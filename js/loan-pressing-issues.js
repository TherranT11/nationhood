/**
 * loan-pressing-issues.js — Shared Pressing-Issues mount for the
 * borrower's view of an open loan negotiation.
 *
 * Why: every sector ops page (Construction, Finance, Shipping,
 * Aviation Manufacturing, Airline) needs to surface "a bank is
 * negotiating a loan with you" cards. The original implementation
 * lived inline in corp-operations.html; aviation-operations.html
 * had a hard-coded empty placeholder, so an Aviation Manufacturing
 * borrower (KAI in the bug report) couldn't see ANY incoming
 * offers and the bank kept hitting "You already have an open
 * negotiation with this borrower" on retry. Same drift pattern
 * lawsuit-pressing-issues.js was created to eliminate; this file
 * is its sibling.
 *
 * This module owns the fetch, the render, the click delegation,
 * and the refresh-on-event subscription. Cards ship with self-
 * contained `loan-pi-*` CSS so they render consistently across
 * every page regardless of local class availability.
 *
 * Usage:
 *   import { mountLoanPressingIssues } from './js/loan-pressing-issues.js';
 *   const ctl = mountLoanPressingIssues({
 *       supabase, faction, host: document.getElementById('xx-issues-list'),
 *   });
 *   // ctl.refresh()   — re-fetch on demand
 *   // ctl.getCount()  — current open-item count
 */

import { escapeHtml, hfFmtBig } from './utils.js';

const STYLE_ID = 'loan-pi-pressing-styles';

const CSS = `
.loan-pi-card {
    background: #1a1a17;
    border: 1px solid rgba(255,255,255,0.06);
    border-left: 3px solid #c8a832;
    padding: 18px 22px;
    margin-bottom: 12px;
}
.loan-pi-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
}
.loan-pi-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 2px 8px;
    color: #c8a832;
    border: 1px solid rgba(200,168,50,0.40);
    background: rgba(200,168,50,0.06);
}
.loan-pi-tag.unread {
    color: #fff;
    background: #c8a832;
    border-color: #c8a832;
}
.loan-pi-activity {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.loan-pi-name {
    font-family: 'IBM Plex Serif', Georgia, serif;
    font-weight: 500;
    font-size: 19px;
    color: #f0efe6;
    line-height: 1.2;
    margin-bottom: 6px;
    letter-spacing: -0.01em;
}
.loan-pi-purpose {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 14px;
}
.loan-pi-terms {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin: 8px 0 14px;
}
.loan-pi-terms > span {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.loan-pi-terms .label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px;
    color: #666;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}
.loan-pi-terms .value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #f0efe6;
    font-weight: 600;
}
.loan-pi-actions { display: flex; gap: 8px; }
.loan-pi-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 8px 14px;
    background: #c8a832;
    border: 1px solid #c8a832;
    color: #1a1a17;
    cursor: pointer;
    transition: all 0.15s;
    flex: 1;
    font-weight: 600;
}
.loan-pi-btn:hover {
    background: #f0efe6;
    border-color: #f0efe6;
}
`;

function injectStylesOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
}

function activityLabel(lastActivity) {
    if (!lastActivity) return '—';
    const t = new Date(lastActivity).getTime();
    if (!Number.isFinite(t)) return '—';
    const dSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (dSec < 60)    return dSec + 's ago';
    if (dSec < 3600)  return Math.floor(dSec / 60) + 'm ago';
    if (dSec < 86400) return Math.floor(dSec / 3600) + 'h ago';
    return Math.floor(dSec / 86400) + 'd ago';
}

async function fetchOpenNegotiations(supabase, factionId) {
    const { data, error } = await supabase
        .from('loan_negotiations')
        .select(`
            id, principal, apr, term_ticks, purpose,
            borrower_agreed, lender_agreed,
            last_activity_at, last_seen_at_borrower,
            lender:lender_faction_id ( faction_name, corp_ticker )
        `)
        .eq('borrower_faction_id', factionId)
        .eq('status', 'open')
        .order('last_activity_at', { ascending: false });
    if (error) {
        console.warn('[loan-pressing] fetch failed:', error.message);
        return [];
    }
    return data || [];
}

function renderCard(neg) {
    const lender     = neg.lender || {};
    const bankTicker = lender.corp_ticker || '—';
    const bankName   = lender.faction_name || 'Lender';
    const apr        = Number(neg.apr) || 0;
    const term       = Number(neg.term_ticks) || 0;
    const principal  = Number(neg.principal) || 0;
    const purpose    = neg.purpose ? String(neg.purpose).trim() : '';
    const tally      = (neg.borrower_agreed ? 1 : 0) + (neg.lender_agreed ? 1 : 0);
    const lastActivity = neg.last_activity_at || null;
    const unread = !neg.last_seen_at_borrower
        || (lastActivity && new Date(neg.last_seen_at_borrower).getTime() < new Date(lastActivity).getTime());

    return `<div class="loan-pi-card">
        <div class="loan-pi-meta-row">
            <span class="loan-pi-tag${unread ? ' unread' : ''}">${unread ? 'NEGOTIATION ◊ UNREAD' : 'NEGOTIATION'}</span>
            <span class="loan-pi-activity">${escapeHtml(activityLabel(lastActivity))}</span>
        </div>
        <div class="loan-pi-name">${escapeHtml(bankTicker)} — ${escapeHtml(bankName)}</div>
        ${purpose ? `<div class="loan-pi-purpose">— ${escapeHtml(purpose)}</div>` : ''}
        <div class="loan-pi-terms">
            <span><span class="label">Principal</span><span class="value">${escapeHtml(hfFmtBig(principal))}</span></span>
            <span><span class="label">APR</span><span class="value">${apr.toFixed(1)}%</span></span>
            <span><span class="label">Term</span><span class="value">${term} ticks</span></span>
            <span><span class="label">Agreement</span><span class="value">${tally}/2</span></span>
        </div>
        <div class="loan-pi-actions">
            <button class="loan-pi-btn" data-action="loan-pi-open" data-id="${escapeHtml(neg.id)}">Open Negotiation ▸</button>
        </div>
    </div>`;
}

export function mountLoanPressingIssues({
    supabase,
    faction,
    host,
    emptyMessage = 'No pressing issues right now. Time-sensitive decisions will appear here when triggered.',
    emptyClass = '',
    showEmpty = true,
    onChange = null,
}) {
    if (!host) return { refresh: async () => {}, getCount: () => 0 };
    injectStylesOnce();

    let items = [];

    function render() {
        if (items.length === 0) {
            // When the host also accepts other sources (lawsuit cards,
            // project events) the page suppresses this empty render
            // to avoid a duplicate empty-state line.
            if (!showEmpty) { host.innerHTML = ''; return; }
            const cls = emptyClass ? ` class="${escapeHtml(emptyClass)}"` : '';
            host.innerHTML = `<div${cls}>${escapeHtml(emptyMessage)}</div>`;
            return;
        }
        host.innerHTML = items.map(renderCard).join('');
    }

    async function refresh() {
        items = await fetchOpenNegotiations(supabase, faction.id);
        render();
        if (typeof onChange === 'function') {
            try { onChange(items); } catch (e) { console.warn('[loan-pressing] onChange threw:', e?.message || e); }
        }
    }

    host.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action="loan-pi-open"]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (!id) return;
        try {
            const lnm = await import('./loan-negotiation-modal.js');
            await lnm.mountLoanNegotiationModal({
                supabase,
                negotiationId: id,
                onClose: refresh,
                onFired: refresh,
            });
        } catch (err) {
            console.warn('[loan-pressing] modal mount failed:', err?.message || err);
        }
    });

    // Sibling modules / page code can dispatch this to ask us to
    // re-fetch (e.g. when a fresh negotiation lands via realtime).
    window.addEventListener('loan-negotiation:updated', refresh);

    refresh();

    return {
        refresh,
        getCount: () => items.length,
    };
}
