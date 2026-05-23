/**
 * corp-investment-pressing-issues.js — Pressing-Issues mount for pending
 * director investment offers (Offer Investment, private corps only).
 *
 * Surfaces every pending corp_investment_offers on a corp the viewer OWNS
 * (the CEO). Each card states the deal — director, amount, equity %, the
 * auto-computed valuation — with inline Accept / Reject buttons that call
 * respond_corp_investment_offer. On accept the founder SELLS that equity to
 * the director (100-share model): the cash goes to the founder's personal
 * funds and the shares transfer from founder to director — the treasury is
 * untouched (see migration 20270232).
 *
 * Mirrors js/acquisition-pressing-issues.js (same mount contract +
 * showEmpty/onChange coordination).
 *
 * Usage:
 *   import { mountInvestmentPressingIssues } from './js/corp-investment-pressing-issues.js';
 *   const ctl = mountInvestmentPressingIssues({
 *       supabase, faction, host, showEmpty: false, onChange: () => syncEmpty(),
 *   });
 */

import { ownerDisplayName, fmtUsd } from './utils.js';

const STYLE_ID = 'ci-invest-pressing-styles';

const CSS = `
.ci-card { background:#1a1a17; border:1px solid rgba(255,255,255,0.06);
  border-left:3px solid #5cc55c; padding:16px 18px; margin-bottom:12px; }
.ci-row1 { display:flex; align-items:baseline; justify-content:space-between; gap:10px; margin-bottom:10px; }
.ci-row1 .ti { font-size:13px; font-weight:500; color:#fff; }
.ci-row1 .ti em { font-style:italic; color:#5cc55c; font-weight:400; }
.ci-row1 .tag { font-size:9px; color:#5cc55c; letter-spacing:0.14em; }
.ci-line { font-size:12px; color:#cfcfcf; line-height:1.5; margin-bottom:10px; }
.ci-line b { color:#fff; font-weight:500; }
.ci-line .px { color:#5cc55c; font-variant-numeric:tabular-nums; }
.ci-err { font-size:11px; color:#c98a8a; min-height:14px; padding-bottom:6px; }
.ci-actions { display:flex; gap:10px; justify-content:flex-end; }
.ci-btn { padding:8px 16px; border-radius:3px; font-size:11px; letter-spacing:0.06em;
  font-weight:500; cursor:pointer; font-family:inherit; }
.ci-btn.acc { border:0.5px solid #5cc55c; background:#13260f; color:#8aca6a; }
.ci-btn.acc:hover { background:#1c3315; }
.ci-btn.rej { border:0.5px solid #aa5a5a; background:#260f0f; color:#c98a8a; }
.ci-btn.rej:hover { background:#331515; }
.ci-btn[disabled] { opacity:0.5; cursor:default; }
`;

function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
}

export function mountInvestmentPressingIssues({
    supabase, faction, host,
    showEmpty = true,
    onChange = null,
}) {
    if (!host) return { refresh: async () => {}, getCount: () => 0 };
    ensureStyles();

    const factionId = faction?.id || null;
    let count = 0;

    async function fetchAll() {
        if (!factionId) return [];
        // Corps the viewer owns (CEO) → their pending investment offers.
        const { data: myCorps, error: cErr } = await supabase
            .from('entrepreneur_corps').select('id, name').eq('owner_faction_id', factionId);
        if (cErr) { console.warn('[invest-pi] corp fetch failed:', cErr.message); return []; }
        const ids = (myCorps || []).map(c => c.id);
        if (!ids.length) return [];
        const nameById = new Map((myCorps || []).map(c => [c.id, c.name]));

        const { data, error } = await supabase
            .from('corp_investment_offers')
            .select('id, corp_id, amount, equity_pct, valuation, director_faction_id,'
                  + ' director:factions!director_faction_id(faction_name, leader_first_name, leader_last_name)')
            .eq('status', 'pending')
            .in('corp_id', ids)
            .order('created_at', { ascending: false });
        if (error) { console.warn('[invest-pi] offer fetch failed:', error.message); return []; }
        return (data || []).map(o => ({ ...o, corpName: nameById.get(o.corp_id) || 'your corporation' }));
    }

    function renderCard(offer) {
        const card = document.createElement('div'); card.className = 'ci-card';

        const row1 = document.createElement('div'); row1.className = 'ci-row1';
        const ti = document.createElement('div'); ti.className = 'ti';
        ti.append(document.createTextNode('Investment offer — '));
        const tiEm = document.createElement('em'); tiEm.textContent = offer.corpName;
        ti.append(tiEm);
        const tag = document.createElement('div'); tag.className = 'tag'; tag.textContent = 'INCOMING';
        row1.append(ti, tag);

        const line = document.createElement('div'); line.className = 'ci-line';
        const who = document.createElement('b'); who.textContent = ownerDisplayName(offer.director);
        const amt = document.createElement('span'); amt.className = 'px'; amt.textContent = fmtUsd(offer.amount);
        const val = document.createElement('span'); val.className = 'px'; val.textContent = fmtUsd(offer.valuation);
        line.append(who, document.createTextNode(' offers '), amt,
            document.createTextNode(` to buy ${Number(offer.equity_pct)}% of your equity — you receive the cash (valuation `), val,
            document.createTextNode(').'));

        const err = document.createElement('div'); err.className = 'ci-err';

        const actions = document.createElement('div'); actions.className = 'ci-actions';
        const acc = document.createElement('button'); acc.className = 'ci-btn acc'; acc.textContent = 'Accept';
        const rej = document.createElement('button'); rej.className = 'ci-btn rej'; rej.textContent = 'Reject';

        async function respond(accept) {
            acc.disabled = true; rej.disabled = true; err.textContent = '';
            try {
                const { data, error: rpcErr } = await supabase.rpc('respond_corp_investment_offer',
                    { p_offer_id: offer.id, p_accept: accept });
                if (rpcErr) throw rpcErr;
                if (!data || !data.success) {
                    const R = {
                        director_insufficient_funds: 'The director no longer has the cash to invest.',
                        founder_insufficient_shares: 'You no longer hold enough equity to sell that stake.',
                        not_private:    'Only private corps can take director investment.',
                        not_ceo:        'Only the corp owner can respond.',
                        not_pending:    'This offer was already resolved.',
                        offer_not_found:'Offer no longer exists.',
                        corp_not_found: 'Corporation no longer exists.',
                    };
                    err.textContent = R[data?.reason] || ('Failed: ' + (data?.reason || 'unknown'));
                    acc.disabled = false; rej.disabled = false;
                    return;
                }
                await refresh();
            } catch (e) {
                err.textContent = 'Failed: ' + (e?.message || e);
                acc.disabled = false; rej.disabled = false;
            }
        }
        acc.onclick = () => respond(true);
        rej.onclick = () => respond(false);
        actions.append(rej, acc);

        card.append(row1, line, err, actions);
        return card;
    }

    async function refresh() {
        const items = await fetchAll();
        count = items.length;
        host.replaceChildren();
        if (items.length === 0) {
            if (showEmpty) {
                const empty = document.createElement('div');
                empty.className = 'empty';
                empty.textContent = 'No pressing issues.';
                host.appendChild(empty);
            }
        } else {
            for (const it of items) host.appendChild(renderCard(it));
        }
        if (typeof onChange === 'function') {
            try { onChange(items); } catch (e) { console.warn('[invest-pi] onChange threw:', e?.message || e); }
        }
    }

    refresh();

    return { refresh, getCount: () => count };
}
