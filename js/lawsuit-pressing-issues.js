/**
 * lawsuit-pressing-issues.js — Shared Pressing-Issues mount for the
 * defendant/plaintiff sides of an in-flight commercial lawsuit.
 *
 * Why: every sector ops page (Construction, Finance, Shipping, Airline)
 * needs to show "you've been sued / your settle offer was answered"
 * cards in its Pressing Issues section. The original implementation
 * lived inline in corp-operations.html (Construction); other sectors
 * had a hard-coded empty placeholder, so a defendant in those sectors
 * had no surface to refute / settle / concede.
 *
 * This module owns the fetch, the render, the click delegation, and
 * the refresh-on-event subscription. Cards ship with self-contained
 * `lp-*` CSS so they render consistently across every page regardless
 * of local class availability.
 *
 * Usage:
 *   import { mountLawsuitPressingIssues } from './js/lawsuit-pressing-issues.js';
 *   const ctl = mountLawsuitPressingIssues({
 *       supabase, faction, host: document.getElementById('xx-issues-list'),
 *       currentTick: () => Number(shard?.current_tick) || 0,
 *   });
 *   // ctl.refresh() — re-fetch on demand
 *   // ctl.getCount() — current open-item count
 */

import { GRIEVANCE_LABEL } from './game/lawsuit-types.js';

const STYLE_ID = 'lp-lawsuit-pressing-styles';

const CSS = `
.lp-card {
    background: #1a1a17;
    border: 1px solid rgba(255,255,255,0.06);
    border-left-width: 3px;
    padding: 18px 22px;
    margin-bottom: 12px;
}
.lp-card.kind-defendant { border-left-color: #d9534f; box-shadow: inset 3px 0 12px rgba(217,83,79,0.15); }
.lp-card.kind-settle    { border-left-color: #c8a832; }

.lp-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
}
.lp-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 2px 8px;
    border: 1px solid rgba(255,255,255,0.12);
    background: #1a1a17;
}
.lp-tag.kind-defendant { color: #fff; background: #d9534f; border-color: #d9534f; }
.lp-tag.kind-settle    { color: #c8a832; border-color: rgba(200,168,50,0.40); background: rgba(200,168,50,0.06); }

.lp-deadline {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: #888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.lp-name {
    font-family: 'IBM Plex Serif', Georgia, serif;
    font-weight: 500;
    font-size: 19px;
    color: #f0efe6;
    line-height: 1.2;
    margin-bottom: 6px;
    letter-spacing: -0.01em;
}
.lp-client {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #888;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 14px;
}
.lp-desc {
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
    font-size: 12px;
    line-height: 1.55;
    color: #c4c2b8;
    margin: 8px 0 12px;
}

.lp-actions { display: flex; gap: 8px; }
.lp-btn {
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
.lp-btn:hover {
    background: #f0efe6;
    border-color: #f0efe6;
    color: #1a1a17;
}
`;

function injectStylesOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
}

function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtMoney(n) {
    const v = Number(n) || 0;
    if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `$${Math.round(v / 1e3)}k`;
    return `$${v}`;
}

// Two queries: defendant view (someone is suing you, you must respond)
// and plaintiff view (your settle offer is awaiting their answer — but
// settle_offered status means *defendant* offered; here we want the
// plaintiff's perspective when status='settle_offered' so they can
// review/accept/reject the defendant's settle offer).
async function fetchLawsuitItems(supabase, factionId) {
    const [defRes, plRes] = await Promise.all([
        supabase.from('commercial_lawsuits')
            .select(`
                id, plaintiff_faction_id, defendant_faction_id, grievance_type,
                relief_sought, status, filed_at_tick, response_deadline_tick,
                settle_offer_amount, chat_id,
                plaintiff:plaintiff_faction_id(faction_name, abbreviation, corp_ticker)
            `)
            .eq('defendant_faction_id', factionId)
            .eq('status', 'pending')
            .order('filed_at_tick', { ascending: false }),
        supabase.from('commercial_lawsuits')
            .select(`
                id, plaintiff_faction_id, defendant_faction_id, grievance_type,
                relief_sought, status, settle_offer_amount, chat_id,
                defendant:defendant_faction_id(faction_name, abbreviation, corp_ticker)
            `)
            .eq('plaintiff_faction_id', factionId)
            .eq('status', 'settle_offered')
            .order('updated_at', { ascending: false }),
    ]);
    if (defRes.error) console.warn('[lawsuit-pressing] defendant fetch failed:', defRes.error.message);
    if (plRes.error)  console.warn('[lawsuit-pressing] plaintiff fetch failed:', plRes.error.message);
    return {
        defendantSuits: defRes.data || [],
        plaintiffSettleOffers: plRes.data || [],
    };
}

function renderDefendantCard(l, currentTick) {
    const ticksLeft = Math.max(0, Number(l.response_deadline_tick || 0) - currentTick);
    const plName = l.plaintiff?.faction_name || 'Plaintiff';
    const plTick = l.plaintiff?.corp_ticker || l.plaintiff?.abbreviation || '';
    const grievance = GRIEVANCE_LABEL[l.grievance_type] || l.grievance_type;
    return `<div class="lp-card kind-defendant">
        <div class="lp-meta-row">
            <span class="lp-tag kind-defendant">LAWSUIT ◊ RESPONSE REQUIRED</span>
            <span class="lp-deadline">${ticksLeft} tick${ticksLeft === 1 ? '' : 's'} remaining</span>
        </div>
        <div class="lp-name">Sued by ${escapeHtml(plName)}</div>
        <div class="lp-client">— ${escapeHtml(grievance)} ${plTick ? '· ' + escapeHtml(plTick) : ''}</div>
        <div class="lp-desc">A civil lawsuit has been filed against you. Choose Refute, Settle, or Concede before the deadline or the case auto-concedes.</div>
        <div class="lp-actions">
            <button class="lp-btn" data-action="lawsuit-respond" data-id="${escapeHtml(l.id)}">Respond ▸</button>
        </div>
    </div>`;
}

function renderSettleCard(l) {
    const defName = l.defendant?.faction_name || 'Defendant';
    const offer = Number(l.settle_offer_amount || 0);
    return `<div class="lp-card kind-settle">
        <div class="lp-meta-row">
            <span class="lp-tag kind-settle">SETTLEMENT ◊ AWAITING YOU</span>
            <span class="lp-deadline">Decide</span>
        </div>
        <div class="lp-name">${escapeHtml(defName)} offered ${escapeHtml(fmtMoney(offer))}</div>
        <div class="lp-client">— Accept to close, reject to proceed to trial</div>
        <div class="lp-actions">
            <button class="lp-btn" data-action="lawsuit-settle-review" data-id="${escapeHtml(l.id)}">Review Offer ▸</button>
        </div>
    </div>`;
}

export function mountLawsuitPressingIssues({
    supabase,
    faction,
    host,
    currentTick = () => 0,
    emptyMessage = 'No pressing issues right now. Time-sensitive decisions will appear here when triggered.',
    emptyClass = '',
    showEmpty = true,
    onChange = null,
}) {
    if (!host) return { refresh: async () => {}, getCount: () => 0 };
    injectStylesOnce();

    let items = { defendantSuits: [], plaintiffSettleOffers: [] };

    function render() {
        const tick = Number(currentTick()) || 0;
        const cards = items.defendantSuits.map(l => renderDefendantCard(l, tick))
            .concat(items.plaintiffSettleOffers.map(renderSettleCard));
        if (cards.length === 0) {
            // Pages that mix lawsuits with their own pressing-issue
            // cards (e.g. Construction with project events + loan
            // offers) own the empty-state copy in their main list, so
            // suppress this module's empty render to avoid a duplicate.
            if (!showEmpty) {
                host.innerHTML = '';
                return;
            }
            const cls = emptyClass ? ` class="${escapeHtml(emptyClass)}"` : '';
            host.innerHTML = `<div${cls}>${escapeHtml(emptyMessage)}</div>`;
        } else {
            host.innerHTML = cards.join('');
        }
    }

    async function refresh() {
        items = await fetchLawsuitItems(supabase, faction.id);
        render();
        if (typeof onChange === 'function') {
            try { onChange(items); } catch (e) { console.warn('[lawsuit-pressing] onChange threw:', e?.message || e); }
        }
    }

    host.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action="lawsuit-respond"], [data-action="lawsuit-settle-review"]');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        try {
            const lr = await import('./lawsuit-respond.js');
            const list = action === 'lawsuit-respond' ? items.defendantSuits : items.plaintiffSettleOffers;
            const lawsuit = list.find(x => x.id === id);
            if (!lawsuit) return;
            if (action === 'lawsuit-respond') lr.openLawsuitResponseModal(lawsuit, faction);
            else                              lr.openSettleReviewModal(lawsuit, faction);
        } catch (err) {
            console.warn('[lawsuit-pressing] modal mount failed:', err?.message || err);
        }
    });

    window.addEventListener('lawsuit:responded', refresh);
    window.addEventListener('lawsuit:settled',   refresh);

    refresh();

    return {
        refresh,
        getCount: () => items.defendantSuits.length + items.plaintiffSettleOffers.length,
    };
}
