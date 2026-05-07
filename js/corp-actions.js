// js/corp-actions.js — Shared renderer for the corporation Actions
// tab, extracted during Phase 3 dedup of the corp-operations* files.
//
// Before this module, renderActionsTab was byte-for-byte duplicated
// between corp-operations.html and corp-operations-shipping.html
// (5,654 chars each). A change in one file silently drifted from the
// other — exactly the bug that made "Phase 2 unified corp Actions"
// fall over on shipping corps until Alpha 2.2.0.30.
//
// The module writes the shell chrome (stat pills + status bar) via
// js/role-actions.js and populates the exec-card list, then leaves
// the action panel as an empty <div id="actions-right-panel"></div>
// for the caller's renderActionsRightPanel() to fill. The caller
// keeps per-page state (_selectedExecIdx) because opening Shipping
// and Construction tabs side-by-side shouldn't share selection.
//
// Per-page action handlers (openExecSearch, actSelectExec, etc.)
// are still invoked via onclick="..." attributes that resolve to
// window-scoped globals in each HTML file. The shared module doesn't
// need to know about them.

import { renderRoleActionsShell } from './role-actions.js';
import { computeCorpValuation } from './game/corp-valuation.js';
import { EXEC_ROLES, EXEC_ROLE_META } from './game/corp-executives.js';

function escapeHtml(str) {
    if (str == null) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

function getInitials(first, last) {
    return (first || '?')[0] + (last || '?')[0];
}

function fmtSalary(n) {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'k';
    return '$' + n;
}

// Cash / valuation formatting ($X.XM / $Xk / raw). Handles negatives
// so valuation < 0 (debts > assets) renders as "-$X.XM" rather than
// "$-X.XM" or falling through to the raw branch.
function fmtMoney(n) {
    const v = Number(n) || 0;
    const abs = Math.abs(v);
    const body = abs >= 1_000_000_000 ? (abs / 1_000_000_000).toFixed(1) + 'B'
        : abs >= 1_000_000 ? (abs / 1_000_000).toFixed(1) + 'M'
        : abs >= 1_000 ? Math.round(abs / 1000) + 'k'
        : String(Math.round(abs));
    return (v < 0 ? '-$' : '$') + body;
}

/**
 * Render the corp Actions-tab shell + executive list into `container`.
 * Leaves `#actions-right-panel` empty inside the shell's action-panel
 * container — caller invokes its own renderActionsRightPanel() after
 * this returns to fill it.
 *
 * @param {HTMLElement} container - Mount point (typically #actions-container).
 * @param {Object} ctx
 * @param {Object} ctx.faction - Current corp faction row.
 * @param {Object} [ctx.shard] - Shard row (used for currentTick on valuation).
 * @param {Array}  [ctx.ownedProperties] - Corp's active properties.
 * @param {Array}  [ctx.vessels] - Corp's vessels; shipping passes fleet,
 *   construction passes [].
 * @param {Array}  [ctx.executives] - Corp's hired executives.
 * @param {number} [ctx.selectedExecIdx] - Which exec card is highlighted.
 */
export function renderCorpActions(container, ctx) {
    if (!container) return;
    const {
        faction,
        shard,
        ownedProperties = [],
        vessels = [],
        executives = [],
        selectedExecIdx = 0,
    } = ctx || {};

    const corpName = faction?.faction_name || 'Corporation';
    const ticker = (faction?.abbreviation || faction?.corp_ticker || '??').toUpperCase();
    const sector = faction?.corp_sector || '';
    const subsector = faction?.corp_subsector || '';

    // Valuation uses the SSOT formula from js/game/corp-valuation.js.
    // Construction passes vessels: [] (no fleet). Shipping passes its
    // loaded vessel list when that cache is wired; until then the pill
    // under-reports fleet value — known gap flagged at the caller.
    const cashReserves = Number(faction?.corp_cash_reserves || 0);
    const outstandingLoans = Number(faction?.corp_loans || 0);
    const valuation = computeCorpValuation({
        cash: cashReserves,
        loans: outstandingLoans,
        properties: ownedProperties,
        vessels,
        financeReceivables: 0,
        currentTick: shard?.current_tick || 0,
    });

    // Clamp 0-100 with Number.isFinite guard so corrupt DB values
    // never render as NaN. Matches the clamping pattern used elsewhere.
    const repRaw = Number(faction?.corp_reputation ?? 50);
    const reputation = Math.max(0, Math.min(100, Math.round(Number.isFinite(repRaw) ? repRaw : 50)));
    const repColor = reputation >= 60 ? 'var(--green)'
        : reputation >= 40 ? 'var(--text-bright)'
        : 'var(--red)';

    const propertyCount = ownedProperties.length;
    const valColor = valuation < 0 ? 'var(--red)' : 'var(--green)';

    renderRoleActionsShell(container, {
        title: 'Corporate Actions',
        entityName: `${corpName} · ${ticker}`,
        entityColor: '#8b9a6b',
        stats: [
            { label: 'Cash', value: fmtMoney(cashReserves), color: 'var(--accent)' },
            { label: 'Reputation', value: String(reputation), color: repColor },
            { label: 'Valuation', value: fmtMoney(valuation), color: valColor },
        ],
        statusBarItems: [
            {
                type: 'count',
                label: 'Sector',
                big: sector || '—',
                bigColor: '#8b9a6b',
                dim1: subsector || '',
            },
            {
                type: 'count',
                label: 'Properties',
                big: String(propertyCount),
                bigColor: '#8b9a6b',
                dim1: propertyCount === 1 ? 'building' : 'buildings',
            },
        ],
        rolesContainerId: 'corp-exec-list',
        panelContainerId: 'corp-actions-panel',
        rolesColumnWidth: 262,
    });

    // ═══ LEFT PANEL: Executive cards ═══
    const execList = document.getElementById('corp-exec-list');
    if (execList) {
        const execByRole = new Map(executives.map(e => [e.role, e]));
        let execHtml = '';
        for (let i = 0; i < EXEC_ROLES.length; i++) {
            const role = EXEC_ROLES[i];
            const meta = EXEC_ROLE_META[role];
            const exec = execByRole.get(role) || null;
            const isSel = selectedExecIdx === i;
            const color = meta.color;
            const isVacant = !exec;

            execHtml += `<div onclick="actSelectExec(${i})" style="
                padding:10px 12px;
                background:${isSel ? color + '0a' : 'var(--bg-2,#1a1a17)'};
                border:1px solid ${isSel ? color + '44' : 'var(--border-0,rgba(255,255,255,0.06))'};
                border-left:3px solid ${isSel ? color : 'var(--border-0,rgba(255,255,255,0.06))'};
                cursor:pointer;
            ">`;

            if (isVacant && role !== 'CEO') {
                execHtml += `<div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:45px;height:45px;background: var(--border-hair);border:1px dashed var(--border-1);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);flex-shrink:0;">?</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${color};">${escapeHtml(role)}</span>
                        </div>
                        <div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-top:2px;">VACANT</div>
                        <div style="margin-top:4px;">
                            <span onclick="event.stopPropagation();openExecSearch('${role}')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);background:rgba(90,138,170,0.06);cursor:pointer;">EXECUTIVE SEARCH</span>
                        </div>
                    </div>
                </div>`;
            } else {
                const name = exec ? `${exec.first_name} ${exec.last_name}` : '—';
                const age = exec ? exec.age : 0;
                const sal = exec ? exec.salary_per_year : 0;
                const portrait = exec ? getInitials(exec.first_name, exec.last_name) : '—';

                execHtml += `<div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:45px;height:45px;background:${color}15;border:1px solid ${color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${color};flex-shrink:0;">${escapeHtml(portrait)}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${color};">${escapeHtml(role)}</span>
                        </div>
                        <div style="font-size:13px;font-weight:600;color:${isSel ? 'var(--text-bright,#f0efe6)' : 'var(--text-muted,#666)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(name)}${age ? ` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${age})</span>` : ''}</div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${fmtSalary(sal)}/yr</span>
                        </div>
                    </div>
                </div>`;
            }
            execHtml += `</div>`;
        }
        execList.innerHTML = execHtml;
    }

    // ═══ RIGHT PANEL ═══
    // Install the #actions-right-panel placeholder inside the shell's
    // action panel container. The caller's renderActionsRightPanel()
    // writes into this element — it stays in each HTML file because
    // it references page-specific modal openers (openRestructureModal,
    // rdOpen, etc.) that live in each file's module scope.
    const panelHost = document.getElementById('corp-actions-panel');
    if (panelHost) {
        panelHost.innerHTML = `<div id="actions-right-panel"></div>`;
    }
}
