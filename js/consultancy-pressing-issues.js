/**
 * consultancy-pressing-issues.js — Pressing-Issues mount for pending
 * corp consultancy offers targeting an entrepreneur (20270773).
 *
 * A corp owner can retain any Entrepreneur or Politician as a
 * consultant; the fee is escrowed corp-side at offer time. This
 * module surfaces the entrepreneur-side cards (politicians get the
 * inline card on politician-home). Accept pays the fee into
 * factions.party_funds; Decline refunds the corp's escrow. Both
 * paths reload so the cash pill repaints.
 *
 * Mount contract matches the sibling pressing-issues modules:
 *   { supabase, faction, host, showEmpty?, onChange? } in
 *   { refresh, getCount } out
 */

const STYLE_ID = 'co-pi-styles';

const CSS = `
.co-pi-card { background:#1a1a17; border:1px solid rgba(255,255,255,0.06);
  border-left:3px solid #8aaa6a; padding:14px 16px; margin-bottom:12px;
  display:flex; align-items:flex-start; gap:14px; }
.co-pi-icon { width:36px; height:36px; flex-shrink:0; background:rgba(138,170,106,0.08);
  border:0.5px solid rgba(138,170,106,0.4); border-radius:4px;
  display:flex; align-items:center; justify-content:center;
  font-size:17px; }
.co-pi-info { flex:1; min-width:0; }
.co-pi-eyebrow { font-size:9px; letter-spacing:0.14em; color:#8aaa6a; font-weight:700; margin-bottom:4px; }
.co-pi-headline { font-size:12.5px; color:#fff; line-height:1.4; margin-bottom:6px; }
.co-pi-headline strong { color:#fff; font-weight:600; }
.co-pi-meta { font-size:10.5px; color:#888; }
.co-pi-meta b { color:#cfcabf; }
.co-pi-actions { display:flex; flex-direction:column; gap:6px; flex-shrink:0; }
.co-pi-accept, .co-pi-decline { padding:7px 12px; font-size:9px; letter-spacing:0.12em;
  font-weight:700; border-radius:3px; cursor:pointer; font-family:inherit; white-space:nowrap; }
.co-pi-accept { background:rgba(138,170,106,0.08); border:0.5px solid #8aaa6a; color:#8aaa6a; }
.co-pi-accept:hover:not(:disabled) { background:rgba(138,170,106,0.18); color:#fff; }
.co-pi-decline { background:transparent; border:0.5px solid #5a3030; color:#d49a9a; }
.co-pi-decline:hover:not(:disabled) { background:#160e0e; color:#fff; }
.co-pi-accept:disabled, .co-pi-decline:disabled { opacity:0.5; cursor:not-allowed; }
@media (max-width:520px) {
  .co-pi-card { flex-wrap:wrap; }
  .co-pi-actions { flex-direction:row; width:100%; }
  .co-pi-accept, .co-pi-decline { flex:1; }
}
`;

function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
}

function escHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
        ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

const REASON_HUMAN = {
    not_authenticated: 'Sign in to respond.',
    no_faction:        'No active faction found.',
    offer_not_found:   'That offer no longer exists.',
    not_your_offer:    'This offer isn’t addressed to you.',
    already_resolved:  'This offer was already resolved.',
    corp_not_found:    'The corporation no longer exists.',
};

export function mountConsultancyPressingIssues({ supabase, faction, host, showEmpty = true, onChange = null }) {
    installStyles();
    const factionId = faction?.id || null;
    if (!host || !factionId) return { refresh: async () => {}, getCount: () => 0 };

    let count = 0;

    async function fetchOffers() {
        try {
            const { data, error } = await supabase.rpc('list_pending_consultancy_offers_for_faction',
                { p_faction_id: factionId });
            if (error) {
                console.warn('[consultancy-pi] fetch failed:', error.message);
                return [];
            }
            if (!data?.success) return [];
            return Array.isArray(data.offers) ? data.offers : [];
        } catch (err) {
            console.warn('[consultancy-pi] fetch threw:', err?.message || err);
            return [];
        }
    }

    function renderCard(o) {
        const fee = '$' + (Number(o.amount) || 0).toLocaleString();
        return `
            <div class="co-pi-card" data-offer-id="${escHtml(o.offer_id)}">
                <div class="co-pi-icon">💼</div>
                <div class="co-pi-info">
                    <div class="co-pi-eyebrow">PRIVATE SECTOR &middot; CONSULTANCY OFFER</div>
                    <div class="co-pi-headline"><strong>${escHtml(o.corp_name || 'A corporation')}</strong> offers to retain you as a consultant.</div>
                    <div class="co-pi-meta">Fee: <b>${escHtml(fee)}</b></div>
                </div>
                <div class="co-pi-actions">
                    <button type="button" class="co-pi-accept" data-act="accept">&#10003; ACCEPT</button>
                    <button type="button" class="co-pi-decline" data-act="decline">&#10005; DECLINE</button>
                </div>
            </div>`;
    }

    async function respond(card, accept) {
        if (card.dataset.busy === '1') return;
        card.dataset.busy = '1';
        card.querySelectorAll('button').forEach(b => { b.disabled = true; });
        try {
            const { data, error } = await supabase.rpc('respond_consultancy_offer', {
                p_offer_id:   card.dataset.offerId,
                p_faction_id: factionId,
                p_accept:     accept,
            });
            if (error) throw error;
            if (!data?.success) {
                alert(REASON_HUMAN[data?.reason] || ('Could not respond: ' + (data?.reason || 'unknown')));
                card.dataset.busy = '0';
                card.querySelectorAll('button').forEach(b => { b.disabled = false; });
                return;
            }
            // Reload so Cash on Hand repaints from the DB.
            location.reload();
        } catch (err) {
            alert('Failed: ' + (err?.message || err));
            card.dataset.busy = '0';
            card.querySelectorAll('button').forEach(b => { b.disabled = false; });
        }
    }

    async function refresh() {
        const offers = await fetchOffers();
        count = offers.length;
        if (!count) {
            host.innerHTML = showEmpty
                ? '<div class="co-pi-empty"><div class="empty">No consultancy offers.</div></div>'
                : '';
            if (onChange) onChange();
            return;
        }
        host.innerHTML = offers.map(renderCard).join('');
        host.querySelectorAll('.co-pi-card').forEach(card => {
            card.querySelector('[data-act="accept"]')?.addEventListener('click', () => respond(card, true));
            card.querySelector('[data-act="decline"]')?.addEventListener('click', () => respond(card, false));
        });
        if (onChange) onChange();
    }

    refresh();
    return { refresh, getCount: () => count };
}
