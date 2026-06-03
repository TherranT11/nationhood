/**
 * contract-negotiation-pressing-issues.js — Pressing-Issues mount for
 * active corp-to-corp contract negotiations (20270575).
 *
 * Surfaces every drafting + awaiting_signatures negotiation where any
 * corp the viewer owns is a party — both as initiator AND counterparty
 * per the "Both parties" scope pick. Each card shows:
 *
 *   • header        — "Contract Negotiation" + my corp name
 *   • body line     — other corp + CEO + initiated/awaiting line
 *   • stat row      — REP (CEO reputation) + CAP (other corp treasury)
 *   • status line   — N articles drafted · M of N locked + state
 *   • action        — single [Open Negotiation] → corp-contract.html?id=…
 *
 * STD/PRI from the mockup are dropped (no natural schema mapping per
 * the "omit unknowns" scope pick). The "Expires in N ticks" pill is
 * dropped (per the "Drop the pill" pick). Defer/Decline buttons are
 * dropped (per the "Just [Open Negotiation]" pick).
 *
 * Mount contract matches the sibling pressing-issues modules:
 *   { supabase, faction, host, showEmpty?, onChange? } in
 *   { refresh, getCount } out
 */

const STYLE_ID = 'cn-pi-styles';

const CSS = `
.cn-pi-card { background:#1a1a17; border:1px solid rgba(255,255,255,0.06);
  border-left:3px solid #5aafa5; padding:14px 16px; margin-bottom:12px; }
.cn-pi-row1 { display:flex; align-items:baseline; justify-content:space-between; gap:10px; margin-bottom:8px; }
.cn-pi-title { font-size:13px; color:#fff; font-weight:500; line-height:1.3; }
.cn-pi-title strong { color:#fff; }
.cn-pi-tag { font-size:9px; color:#5aafa5; letter-spacing:0.14em; font-weight:700; }
.cn-pi-body { font-size:11px; color:#bbb; margin-bottom:10px; line-height:1.45; }
.cn-pi-body strong { color:#fff; }
.cn-pi-body .ceo { color:#888; }
.cn-pi-stats { display:flex; gap:7px; margin-bottom:10px; }
.cn-pi-stats span { padding:2px 7px; border-radius:2px; background:#080808;
  font-size:9px; font-family:monospace; letter-spacing:0.04em; color:#7a7a7a; }
.cn-pi-stats span.high { color:#9ac99a; }
.cn-pi-stats span.mid  { color:#d4b87a; }
.cn-pi-stats span.low  { color:#7a7a7a; }
.cn-pi-status { font-size:10px; color:#888; margin-bottom:11px; }
.cn-pi-status .sep { color:#3a3a3a; margin:0 6px; }
.cn-pi-status .state { color:#5aafa5; font-weight:600; letter-spacing:0.04em; }
.cn-pi-actions { display:flex; }
.cn-pi-open { padding:6px 12px; font-size:9px; letter-spacing:0.14em; font-weight:700;
  border-radius:3px; cursor:pointer; font-family:inherit;
  background:rgba(90,175,165,0.08); border:0.5px solid #5aafa5; color:#5aafa5;
  text-decoration:none; display:inline-block; }
.cn-pi-open:hover { background:rgba(90,175,165,0.18); color:#fff; }
.cn-pi-empty { font-size:10px; color:#888; font-style:italic; text-align:center; padding:9px; }
`;

function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
        ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function repClass(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 'low';
    if (n >= 7) return 'high';
    if (n >= 4) return 'mid';
    return 'low';
}
function repText(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(1) : '—';
}
function fmtCash(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
}

export function mountContractNegotiationPressingIssues({ supabase, faction, host, showEmpty = true, onChange = null }) {
    installStyles();
    const factionId = faction?.id || null;
    if (!host || !factionId) return { refresh: async () => {}, getCount: () => 0 };
    let count = 0;

    async function fetchNegotiations() {
        try {
            const { data, error } = await supabase.rpc('list_corp_negotiations_for_caller');
            if (error) {
                console.warn('[contract-negotiation-pi] fetch failed:', error.message);
                return [];
            }
            if (!data?.success) return [];
            return Array.isArray(data.negotiations) ? data.negotiations : [];
        } catch (err) {
            console.warn('[contract-negotiation-pi] fetch threw:', err?.message || err);
            return [];
        }
    }

    function renderCard(n) {
        const card = document.createElement('div');
        card.className = 'cn-pi-card';

        const row1 = document.createElement('div'); row1.className = 'cn-pi-row1';
        const title = document.createElement('div'); title.className = 'cn-pi-title';
        title.innerHTML = `Contract Negotiation &middot; <strong>${escapeHtml(n.my_corp_name || 'Your corp')}</strong>`;
        const tag = document.createElement('div'); tag.className = 'cn-pi-tag';
        tag.textContent = n.is_initiator ? 'YOU INITIATED' : 'COUNTERPARTY';
        row1.append(title, tag);

        const body = document.createElement('div'); body.className = 'cn-pi-body';
        const otherCorp = escapeHtml(n.other_corp_name || 'Unknown corp');
        const otherNation = n.other_corp_nation ? ` <span class="ceo">(${escapeHtml(n.other_corp_nation)})</span>` : '';
        const ceo = n.other_ceo_name
            ? `<span class="ceo">CEO ${escapeHtml(n.other_ceo_name)}</span>`
            : '';
        const verb = n.is_initiator
            ? 'You opened negotiations with'
            : 'Wishes to negotiate a contract with you:';
        if (n.is_initiator) {
            body.innerHTML = `${verb} <strong>${otherCorp}</strong>${otherNation}${ceo ? '<br>' + ceo : ''}`;
        } else {
            body.innerHTML = `<strong>${otherCorp}</strong>${otherNation}${ceo ? ' &middot; ' + ceo : ''}<br>${verb}`;
        }
        card.append(row1, body);

        const stats = document.createElement('div'); stats.className = 'cn-pi-stats';
        if (Number.isFinite(Number(n.other_ceo_reputation))) {
            const rep = document.createElement('span');
            rep.className = repClass(n.other_ceo_reputation);
            rep.textContent = `REP ${repText(n.other_ceo_reputation)}`;
            stats.appendChild(rep);
        }
        if (Number.isFinite(Number(n.other_corp_treasury))) {
            const cap = document.createElement('span');
            cap.textContent = `CAP ${fmtCash(n.other_corp_treasury)}`;
            stats.appendChild(cap);
        }
        if (stats.children.length > 0) card.appendChild(stats);

        const status = document.createElement('div'); status.className = 'cn-pi-status';
        const total = Number(n.articles_total) || 0;
        const locked = Number(n.articles_locked) || 0;
        const articlesText = total === 0
            ? 'No articles drafted yet'
            : `${total} article${total === 1 ? '' : 's'} drafted &middot; ${locked} of ${total} locked`;
        const stateText = n.status === 'awaiting_signatures'
            ? 'Awaiting Signatures'
            : 'Drafting';
        status.innerHTML = `${articlesText} <span class="sep">·</span> <span class="state">${escapeHtml(stateText)}</span>`;
        card.appendChild(status);

        const actions = document.createElement('div'); actions.className = 'cn-pi-actions';
        const open = document.createElement('a');
        open.className = 'cn-pi-open';
        open.href = `corp-contract.html?id=${encodeURIComponent(n.contract_id)}`;
        open.textContent = 'OPEN NEGOTIATION →';
        actions.appendChild(open);
        card.appendChild(actions);

        return card;
    }

    async function refresh() {
        const negs = await fetchNegotiations();
        count = negs.length;
        host.replaceChildren();
        if (negs.length === 0) {
            if (showEmpty) {
                const empty = document.createElement('div'); empty.className = 'cn-pi-empty';
                empty.textContent = 'No active contract negotiations.';
                host.appendChild(empty);
            }
        } else {
            negs.forEach(n => host.appendChild(renderCard(n)));
        }
        if (typeof onChange === 'function') onChange();
    }

    refresh();
    return { refresh, getCount: () => count };
}
