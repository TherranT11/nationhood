/**
 * bonus-vote-pressing-issues.js — Pressing-Issues mount for pending
 * performance-bonus board votes (20270775).
 *
 * Surfaces every pending corp_bonus_proposals row where the viewer
 * sits in the snapshot voter pool and hasn't voted yet. Each card
 * shows the corp, the proposed bonus amount, and the stakes — then
 * [YES] / [NO]. Votes resolve the proposal the moment a majority is
 * reached (or becomes impossible): YES → the CEO is paid and the
 * share price rises 3%; NO → the escrow refunds and the share price
 * falls 0.2% per $1M proposed.
 *
 * Mount contract matches the sibling pressing-issues modules:
 *   { supabase, faction, host, showEmpty?, onChange? } in
 *   { refresh, getCount } out
 */

const STYLE_ID = 'bv-pi-styles';

const CSS = `
.bv-pi-card { background:#1a1a17; border:1px solid rgba(255,255,255,0.06);
  border-left:3px solid #c8a64e; padding:14px 16px; margin-bottom:12px;
  display:flex; align-items:flex-start; gap:14px; }
.bv-pi-icon { width:36px; height:36px; flex-shrink:0; background:rgba(200,166,78,0.08);
  border:0.5px solid rgba(200,166,78,0.4); border-radius:4px;
  display:flex; align-items:center; justify-content:center; font-size:17px; }
.bv-pi-info { flex:1; min-width:0; }
.bv-pi-eyebrow { font-size:9px; letter-spacing:0.14em; color:#c8a64e; font-weight:700; margin-bottom:4px; }
.bv-pi-headline { font-size:12.5px; color:#fff; line-height:1.4; margin-bottom:6px; }
.bv-pi-headline strong { color:#fff; font-weight:600; }
.bv-pi-meta { font-size:10px; color:#888; line-height:1.5; }
.bv-pi-meta b { color:#cfcabf; }
.bv-pi-actions { display:flex; flex-direction:column; gap:6px; flex-shrink:0; }
.bv-pi-yes, .bv-pi-no { padding:7px 14px; font-size:9px; letter-spacing:0.12em;
  font-weight:700; border-radius:3px; cursor:pointer; font-family:inherit; white-space:nowrap; }
.bv-pi-yes { background:rgba(138,170,106,0.08); border:0.5px solid #8aaa6a; color:#8aaa6a; }
.bv-pi-yes:hover:not(:disabled) { background:rgba(138,170,106,0.18); color:#fff; }
.bv-pi-no { background:transparent; border:0.5px solid #5a3030; color:#d49a9a; }
.bv-pi-no:hover:not(:disabled) { background:#160e0e; color:#fff; }
.bv-pi-yes:disabled, .bv-pi-no:disabled { opacity:0.5; cursor:not-allowed; }
@media (max-width:520px) {
  .bv-pi-card { flex-wrap:wrap; }
  .bv-pi-actions { flex-direction:row; width:100%; }
  .bv-pi-yes, .bv-pi-no { flex:1; }
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
    not_authenticated: 'Sign in to vote.',
    no_entrepreneur:   'No entrepreneur faction found.',
    proposal_not_found:'That proposal no longer exists.',
    already_resolved:  'This vote already resolved.',
    not_in_pool:       'You weren’t on the board when this was proposed.',
    already_voted:     'You already voted on this proposal.',
    corp_not_found:    'The corporation no longer exists.',
};

export function mountBonusVotePressingIssues({ supabase, faction, host, showEmpty = true, onChange = null }) {
    installStyles();
    const factionId = faction?.id || null;
    if (!host || !factionId) return { refresh: async () => {}, getCount: () => 0 };

    let count = 0;

    async function fetchProposals() {
        try {
            const { data, error } = await supabase.rpc('list_pending_bonus_votes_for_director',
                { p_faction_id: factionId });
            if (error) {
                console.warn('[bonus-vote-pi] fetch failed:', error.message);
                return [];
            }
            if (!data?.success) return [];
            return Array.isArray(data.proposals) ? data.proposals : [];
        } catch (err) {
            console.warn('[bonus-vote-pi] fetch threw:', err?.message || err);
            return [];
        }
    }

    function renderCard(p) {
        const fee = '$' + (Number(p.amount) || 0).toLocaleString();
        const dropPct = Math.min(90, 0.2 * Math.floor((Number(p.amount) || 0) / 1000000));
        return `
            <div class="bv-pi-card" data-proposal-id="${escHtml(p.proposal_id)}">
                <div class="bv-pi-icon">🗳</div>
                <div class="bv-pi-info">
                    <div class="bv-pi-eyebrow">BOARD VOTE &middot; PERFORMANCE BONUS</div>
                    <div class="bv-pi-headline"><strong>${escHtml(p.corp_name || 'A corporation')}</strong>'s chief executive requests a <b>${escHtml(fee)}</b> performance bonus.</div>
                    <div class="bv-pi-meta">YES: bonus pays out, share price <b>+3%</b> &middot; NO: refunded, share price <b>−${dropPct.toFixed(1)}%</b></div>
                </div>
                <div class="bv-pi-actions">
                    <button type="button" class="bv-pi-yes" data-vote="yes">&#10003; YES</button>
                    <button type="button" class="bv-pi-no"  data-vote="no">&#10005; NO</button>
                </div>
            </div>`;
    }

    async function castVote(card, voteYes) {
        if (card.dataset.busy === '1') return;
        card.dataset.busy = '1';
        card.querySelectorAll('button').forEach(b => { b.disabled = true; });
        try {
            const { data, error } = await supabase.rpc('vote_performance_bonus', {
                p_proposal_id: card.dataset.proposalId,
                p_faction_id:  factionId,
                p_vote_yes:    voteYes,
            });
            if (error) throw error;
            if (!data?.success) {
                alert(REASON_HUMAN[data?.reason] || ('Could not vote: ' + (data?.reason || 'unknown')));
                card.dataset.busy = '0';
                card.querySelectorAll('button').forEach(b => { b.disabled = false; });
                return;
            }
            location.reload();
        } catch (err) {
            alert('Failed: ' + (err?.message || err));
            card.dataset.busy = '0';
            card.querySelectorAll('button').forEach(b => { b.disabled = false; });
        }
    }

    async function refresh() {
        const proposals = await fetchProposals();
        count = proposals.length;
        if (!count) {
            host.innerHTML = showEmpty
                ? '<div class="bv-pi-empty"><div class="empty">No board votes pending.</div></div>'
                : '';
            if (onChange) onChange();
            return;
        }
        host.innerHTML = proposals.map(renderCard).join('');
        host.querySelectorAll('.bv-pi-card').forEach(card => {
            card.querySelector('[data-vote="yes"]')?.addEventListener('click', () => castVote(card, true));
            card.querySelector('[data-vote="no"]')?.addEventListener('click', () => castVote(card, false));
        });
        if (onChange) onChange();
    }

    refresh();
    return { refresh, getCount: () => count };
}
