/**
 * corp-tax-pressing-issues.js — Pressing-Issues mount for corporate
 * tax bills.
 *
 * Renders one card per outstanding (corp_tax_bills.status IN
 * 'due'/'partial'/'delinquent', ignored_at_tick IS NULL) bill
 * belonging to the current corp. Each card carries up to three
 * actions:
 *   • Pay in Full     → pay_corporate_tax_full RPC.
 *   • Cook the Books  → cook_corporate_tax_books RPC. Only shown on
 *                        status='due' bills (the RPC blocks
 *                        partial / delinquent). Confirmation modal
 *                        surfaces the success odds.
 *   • Ignore          → ignore_corporate_tax_bill RPC. Sets
 *                        ignored_at_tick (so the card disappears
 *                        until next assessment cycle), -1 reputation.
 *
 * Mirrors the structural pattern of js/lawsuit-pressing-issues.js:
 * scoped CSS injected once, click delegation, refresh()-on-event,
 * showEmpty toggle.
 *
 * Usage:
 *   import { mountCorporateTaxPressingIssues } from './js/corp-tax-pressing-issues.js';
 *   const ctl = mountCorporateTaxPressingIssues({
 *       supabase, faction, host: document.getElementById('co-tax-pressing'),
 *       currentTick: () => Number(shard?.current_tick) || 0,
 *   });
 *   // ctl.refresh() — re-fetch on demand
 *   // ctl.getCount() — current open-bill count
 */

import { tickToDate } from './utils.js';

const STYLE_ID = 'cti-corp-tax-pressing-styles';

const CSS = `
.cti-card {
    background: #1a1a17;
    border: 1px solid rgba(255,255,255,0.06);
    border-left-width: 3px;
    padding: 18px 22px;
    margin-bottom: 12px;
}
.cti-card.kind-due        { border-left-color: #c8a832; }
.cti-card.kind-partial    { border-left-color: #d9a035; }
.cti-card.kind-delinquent { border-left-color: #d9534f; box-shadow: inset 3px 0 12px rgba(217,83,79,0.15); }

.cti-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
}

.cti-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 2px 8px;
    border: 1px solid rgba(255,255,255,0.12);
    background: #1a1a17;
}
.cti-tag.kind-due        { color: #c8a832; border-color: rgba(200,168,50,0.40); background: rgba(200,168,50,0.06); }
.cti-tag.kind-partial    { color: #d9a035; border-color: rgba(217,160,53,0.40); background: rgba(217,160,53,0.06); }
.cti-tag.kind-delinquent { color: #fff; background: #d9534f; border-color: #d9534f; }

.cti-deadline {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.cti-deadline.warn { color: #d9534f; }

.cti-name {
    font-family: 'IBM Plex Serif', Georgia, serif;
    font-weight: 500;
    font-size: 19px;
    color: #f0efe6;
    line-height: 1.2;
    margin-bottom: 8px;
    letter-spacing: -0.01em;
}

.cti-stats {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #c4c2b8;
    margin-bottom: 14px;
    line-height: 1.6;
}
.cti-stats strong { color: #f0efe6; }

.cti-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.cti-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 8px 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background: transparent;
    color: #c4c2b8;
    cursor: pointer;
}
.cti-btn:hover    { border-color: rgba(255,255,255,0.30); color: #f0efe6; }
.cti-btn[disabled] { opacity: 0.5; cursor: wait; }
.cti-btn-primary  { background: #c8a832; color: #1a1a17; border-color: #c8a832; }
.cti-btn-primary:hover { background: #d6b647; border-color: #d6b647; color: #1a1a17; }
.cti-btn-secondary { color: #888; }

.cti-empty {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #888;
    padding: 20px;
    text-align: center;
}
`;

function injectStylesOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
}

function fmtMoney(n) {
    const num = Number(n) || 0;
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return '$' + (num / 1e3).toFixed(1) + 'k';
    return '$' + Math.round(num).toLocaleString();
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

function clampCorruption(c) {
    return Math.max(0, Math.min(100, Number(c) || 0));
}

// Roll is 1d100 + corruption. Success when total > 75. Probability of
// success = (number of d100 outcomes that yield > 75 - corruption) / 100,
// clamped 0..100. Mirrors the cook_corporate_tax_books RPC's logic.
function cookSuccessOdds(corruption) {
    const c = clampCorruption(corruption);
    return Math.max(0, Math.min(100, 25 + c));
}

async function fetchBills(supabase, factionId) {
    const { data, error } = await supabase
        .from('corp_tax_bills')
        .select('id, nation_id, year, revenue_taxed, rate_pct, amount_due, status, due_at_tick, nations:nation_id(name, corruption)')
        .eq('corp_id', factionId)
        .in('status', ['due', 'partial', 'delinquent'])
        .is('ignored_at_tick', null)
        .order('due_at_tick', { ascending: true });
    if (error) {
        console.warn('[corp-tax-pressing] fetch failed:', error.message);
        return [];
    }
    return data || [];
}

function renderCard(bill, currentTick) {
    const nationName = bill.nations?.name || 'Unknown nation';
    const status = bill.status;
    const tagClass = status === 'delinquent' ? 'kind-delinquent'
                   : status === 'partial'    ? 'kind-partial'
                                              : 'kind-due';
    const tagText  = status === 'delinquent' ? 'Delinquent'
                   : status === 'partial'    ? 'Partial'
                                              : 'Tax Due';

    const overdue = currentTick > Number(bill.due_at_tick) && status === 'due';
    const dueText = `Due by ${tickToDate(bill.due_at_tick)}`;

    // Cook is only available on fresh bills — RPC blocks partial /
    // delinquent. Hide the button rather than disable so a player on
    // a delinquent card sees just the two valid options.
    const cookButton = status === 'due'
        ? `<button class="cti-btn" data-action="cook" data-id="${escapeHtml(bill.id)}">Cook the Books</button>`
        : '';

    return `<div class="cti-card ${tagClass}">
        <div class="cti-meta-row">
            <span class="cti-tag ${tagClass}">${tagText}</span>
            <span class="cti-deadline${overdue ? ' warn' : ''}">${escapeHtml(dueText)}</span>
        </div>
        <div class="cti-name">${escapeHtml(nationName)} Corporate Tax — ${bill.year}</div>
        <div class="cti-stats">
            Revenue ${fmtMoney(bill.revenue_taxed)} · Rate ${bill.rate_pct}% · Amount Due <strong>${fmtMoney(bill.amount_due)}</strong>
        </div>
        <div class="cti-actions">
            <button class="cti-btn cti-btn-primary" data-action="pay" data-id="${escapeHtml(bill.id)}">Pay in Full</button>
            ${cookButton}
            <button class="cti-btn cti-btn-secondary" data-action="ignore" data-id="${escapeHtml(bill.id)}">Ignore</button>
        </div>
    </div>`;
}

export function mountCorporateTaxPressingIssues({
    supabase,
    faction,
    host,
    currentTick = () => 0,
    showEmpty = false,
    onChange = null,
}) {
    if (!host) return { refresh: async () => {}, getCount: () => 0 };
    injectStylesOnce();

    let bills = [];

    function render() {
        const tick = Number(currentTick()) || 0;
        if (bills.length === 0) {
            if (!showEmpty) { host.innerHTML = ''; return; }
            host.innerHTML = '<div class="cti-empty">No outstanding tax bills.</div>';
            return;
        }
        host.innerHTML = bills.map(b => renderCard(b, tick)).join('');
    }

    async function refresh() {
        bills = await fetchBills(supabase, faction.id);
        render();
        if (typeof onChange === 'function') {
            try { onChange(bills); } catch (e) { console.warn('[corp-tax-pressing] onChange threw:', e?.message || e); }
        }
    }

    async function performAction(billId, action) {
        const bill = bills.find(b => b.id === billId);
        if (!bill) return;

        if (action === 'pay') {
            const { data, error } = await supabase.rpc('pay_corporate_tax_full', { p_bill_id: billId });
            if (error) { alert(`Payment failed: ${error.message}`); return; }
            if (!data?.success) { alert(`Payment failed: ${data?.reason || 'unknown'}`); return; }
            if (data.status === 'delinquent') {
                alert(`Insufficient cash. Paid ${fmtMoney(data.amount_paid)}; ${fmtMoney(data.residual)} now delinquent (10% late fee applied).`);
            }
            window.dispatchEvent(new CustomEvent('corp-tax:changed', { detail: { action, billId, result: data } }));
            await refresh();
            return;
        }

        if (action === 'cook') {
            const corruption = clampCorruption(bill.nations?.corruption);
            const half       = Math.floor(Number(bill.amount_due) * 0.5);
            const odds       = cookSuccessOdds(corruption);
            const msg = `Cook the Books — ${bill.nations?.name || 'this nation'} ${bill.year} tax bill\n\n`
                + `Pay ${fmtMoney(half)} now (50% of ${fmtMoney(bill.amount_due)}).\n`
                + `Roll 1d100 + ${corruption} corruption.\n`
                + `  > 75 → bill closes, ${fmtMoney(bill.amount_due - half)} added to Corporate Fraud.\n`
                + `  ≤ 75 → caught: residual + 10% late fee → delinquent, -1 reputation.\n\n`
                + `Estimated success: ${odds}%.\n\nContinue?`;
            if (!confirm(msg)) return;
            const { data, error } = await supabase.rpc('cook_corporate_tax_books', { p_bill_id: billId });
            if (error) { alert(`Cook failed: ${error.message}`); return; }
            if (!data?.success) { alert(`Cook failed: ${data?.reason || 'unknown'}`); return; }
            const summary = data.fraud_succeeded
                ? `Rolled ${data.roll} + ${data.corruption} = ${data.total}. Cook SUCCEEDED.\nSaved ${fmtMoney(data.amount_saved)}.`
                : `Rolled ${data.roll} + ${data.corruption} = ${data.total}. Cook CAUGHT.\n${fmtMoney(data.amount_delinquent)} now delinquent. -1 reputation.`;
            alert(summary);
            window.dispatchEvent(new CustomEvent('corp-tax:changed', { detail: { action, billId, result: data } }));
            await refresh();
            return;
        }

        if (action === 'ignore') {
            if (!confirm('Ignore this tax bill?\n\n-1 corporate reputation. Bill stays in your records and is hidden from this list until next year\'s assessment.')) return;
            const { data, error } = await supabase.rpc('ignore_corporate_tax_bill', { p_bill_id: billId });
            if (error) { alert(`Ignore failed: ${error.message}`); return; }
            if (!data?.success) { alert(`Ignore failed: ${data?.reason || 'unknown'}`); return; }
            window.dispatchEvent(new CustomEvent('corp-tax:changed', { detail: { action, billId, result: data } }));
            await refresh();
            return;
        }
    }

    host.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action][data-id]');
        if (!btn) return;
        if (btn.disabled) return;
        // Disable for the duration of the action; refresh re-renders so
        // the button reference is gone and we don't need to re-enable.
        // If the action throws and the card stays, leaving disabled is
        // the safer bias against double-fire.
        btn.disabled = true;
        try {
            await performAction(btn.dataset.id, btn.dataset.action);
        } catch (err) {
            console.error('[corp-tax-pressing] action threw:', err?.message || err);
            alert('Action failed — check console.');
            btn.disabled = false;
        }
    });

    refresh();

    return {
        refresh,
        getCount: () => bills.length,
    };
}
