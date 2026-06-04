/**
 * trial-counsel-pressing-issues.js — Pressing-Issues mount for
 * entrepreneur corp trial alerts (20270519).
 *
 * Surfaces every pre_trial trial where one of the viewer's corps is
 * the open party. Each card shows the case caption, the corp + side,
 * the ticks remaining on the pre-trial window, and an inline list of
 * pending advocate offers — each with Accept / Decline buttons that
 * call the matching RPC and reload the page.
 *
 * If no offers have come in yet, the card shows an "Awaiting offers"
 * placeholder. Owners who want to actively recruit instead of waiting
 * can visit the corp page where the existing RETAIN COUNSEL modal
 * sends general retainers via corp_advocate_offers.
 *
 * Follows the same mount contract as the acquisition / board /
 * investment pressing-issues modules — { supabase, faction, host,
 * showEmpty?, onChange? } in, { refresh, getCount } out.
 */

const STYLE_ID = 'tc-pi-styles';

const CSS = `
.tc-pi-card { background:#1a1a17; border:1px solid rgba(255,255,255,0.06);
  border-left:3px solid #c2a35a; padding:14px 16px; margin-bottom:12px; }
.tc-pi-row1 { display:flex; align-items:baseline; justify-content:space-between; gap:10px; margin-bottom:8px; }
.tc-pi-title { font-size:13px; color:#fff; font-weight:500; line-height:1.3; }
.tc-pi-title em { font-style:italic; color:#c2a35a; }
.tc-pi-title .v { font-style:italic; color:#c2a35a; margin:0 4px; }
.tc-pi-tag { font-size:9px; color:#c2a35a; letter-spacing:0.14em; font-weight:700; }
.tc-pi-meta { display:flex; flex-wrap:wrap; gap:9px; font-size:10px; color:#888; margin-bottom:11px; }
.tc-pi-meta .side { padding:2px 7px; border-radius:3px; font-size:8.5px; letter-spacing:0.1em; font-weight:700; }
.tc-pi-meta .side.plaintiff { background:#10130a; color:#b8cf90; border:0.5px solid #4a5a3a; }
.tc-pi-meta .side.defendant { background:#0e1318; color:#9ab8c8; border:0.5px solid #3a5060; }
.tc-pi-meta .sep { color:#3a3a3a; }
.tc-pi-meta .corp { color:#bbb; }
.tc-pi-meta .corp strong { color:#fff; }
.tc-pi-offers-lab { font-size:8.5px; letter-spacing:0.16em; color:#888; font-weight:700; margin-bottom:7px; }
.tc-pi-offer { display:flex; align-items:center; gap:10px; padding:8px 10px; background:#101010;
  border:0.5px solid rgba(255,255,255,0.07); border-radius:4px; margin-bottom:6px; }
.tc-pi-offer:last-child { margin-bottom:0; }
.tc-pi-offer-name { flex:1; min-width:0; font-size:11px; color:#fff; font-weight:500; }
.tc-pi-offer-stats { display:flex; gap:7px; font-size:9px; color:#888; font-family:monospace; letter-spacing:0.04em; }
.tc-pi-offer-stats span { padding:1px 5px; border-radius:2px; background:#080808; }
.tc-pi-offer-stats span.high { color:#9ac99a; }
.tc-pi-offer-stats span.mid  { color:#d4b87a; }
.tc-pi-offer-stats span.low  { color:#7a7a7a; }
.tc-pi-offer-actions { display:flex; gap:5px; flex-shrink:0; }
.tc-pi-offer-btn { padding:5px 10px; font-size:8.5px; letter-spacing:0.1em; font-weight:700;
  border-radius:3px; cursor:pointer; font-family:inherit; }
.tc-pi-accept { background:#1f2a1a; border:0.5px solid #8aaa6a; color:#8aaa6a; }
.tc-pi-accept:hover { background:#243a1f; color:#fff; }
.tc-pi-decline { background:transparent; border:0.5px solid #5a3030; color:#d49a9a; }
.tc-pi-decline:hover { background:#160e0e; color:#fff; border-color:#c87a7a; }
.tc-pi-offer-btn:disabled { opacity:0.5; cursor:not-allowed; }
.tc-pi-empty { font-size:10px; color:#888; font-style:italic; text-align:center; padding:9px; }
`;

function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
}

function statClass(v) {
    const n = Number(v) || 0;
    if (n >= 7) return 'high';
    if (n >= 4) return 'mid';
    return 'low';
}
function statText(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(1) : '—';
}

export function mountTrialCounselPressingIssues({ supabase, faction, host, showEmpty = true, onChange = null }) {
    installStyles();
    const factionId = faction?.id || null;
    if (!host || !factionId) return { refresh: async () => {}, getCount: () => 0 };
    let count = 0;

    async function fetchAlerts() {
        try {
            const { data, error } = await supabase.rpc('list_corp_trial_alerts_for_owner',
                { p_faction_id: factionId });
            if (error) {
                console.warn('[trial-counsel-pi] fetch failed:', error.message);
                return [];
            }
            if (!data?.success) return [];
            return Array.isArray(data.alerts) ? data.alerts : [];
        } catch (err) {
            console.warn('[trial-counsel-pi] fetch threw:', err?.message || err);
            return [];
        }
    }

    function renderCard(alert) {
        const card = document.createElement('div');
        card.className = 'tc-pi-card';
        const isPlaintiffOpen = alert.open_side === 'plaintiff';
        const tagText = isPlaintiffOpen ? 'PRE-TRIAL · YOUR CORP IS PLAINTIFF'
                                        : 'PRE-TRIAL · YOUR CORP IS DEFENDANT';

        const row1 = document.createElement('div'); row1.className = 'tc-pi-row1';
        const title = document.createElement('div'); title.className = 'tc-pi-title';
        title.innerHTML =
            `${escapeHtml(alert.plaintiff_name || '—')}<span class="v">v.</span>${escapeHtml(alert.defendant_name || '—')}`;
        const tag = document.createElement('div'); tag.className = 'tc-pi-tag';
        tag.textContent = tagText;
        row1.append(title, tag);

        const meta = document.createElement('div'); meta.className = 'tc-pi-meta';
        const sideEl = document.createElement('span');
        sideEl.className = `side ${alert.open_side}`;
        sideEl.textContent = isPlaintiffOpen ? 'FOR PLAINTIFF' : 'FOR DEFENDANT';
        const sep1 = document.createElement('span'); sep1.className = 'sep'; sep1.textContent = '·';
        const corpEl = document.createElement('span'); corpEl.className = 'corp';
        corpEl.innerHTML = `<strong>${escapeHtml(alert.corp_name || 'Your corp')}</strong> &middot; ${escapeHtml((alert.case_type || '').toUpperCase())} &middot; ${escapeHtml((alert.litigation_type || '').toUpperCase())}`;
        meta.append(sideEl, sep1, corpEl);

        card.append(row1, meta);

        const offers = Array.isArray(alert.offers) ? alert.offers : [];
        if (offers.length === 0) {
            const empty = document.createElement('div'); empty.className = 'tc-pi-empty';
            empty.textContent = 'Awaiting counsel offers from advocates in the nation.';
            card.appendChild(empty);
        } else {
            const lab = document.createElement('div'); lab.className = 'tc-pi-offers-lab';
            lab.textContent = `${offers.length} OFFER${offers.length === 1 ? '' : 'S'} PENDING`;
            card.appendChild(lab);
            offers.forEach(o => card.appendChild(renderOffer(o)));
        }
        return card;
    }

    function renderOffer(o) {
        const row = document.createElement('div'); row.className = 'tc-pi-offer';
        const name = document.createElement('div'); name.className = 'tc-pi-offer-name';
        name.textContent = o.advocate_name || 'Advocate';
        const stats = document.createElement('div'); stats.className = 'tc-pi-offer-stats';
        const sRep   = document.createElement('span'); sRep.className = statClass(o.reputation);
        sRep.textContent   = `REP ${statText(o.reputation)}`;
        const sInf   = document.createElement('span'); sInf.className = statClass(o.influence);
        sInf.textContent   = `INF ${statText(o.influence)}`;
        const sSkl   = document.createElement('span'); sSkl.className = statClass(o.skill);
        sSkl.textContent   = `SKL ${statText(o.skill)}`;
        stats.append(sRep, sInf, sSkl);

        const actions = document.createElement('div'); actions.className = 'tc-pi-offer-actions';
        const acc = document.createElement('button');
        acc.type = 'button'; acc.className = 'tc-pi-offer-btn tc-pi-accept'; acc.textContent = '✓ ACCEPT';
        const dec = document.createElement('button');
        dec.type = 'button'; dec.className = 'tc-pi-offer-btn tc-pi-decline'; dec.textContent = '✕ DECLINE';
        acc.addEventListener('click', () => resolveOffer(row, o.offer_id, 'accept'));
        dec.addEventListener('click', () => resolveOffer(row, o.offer_id, 'decline'));
        actions.append(acc, dec);

        row.append(name, stats, actions);
        return row;
    }

    async function resolveOffer(row, offerId, decision) {
        const buttons = row.querySelectorAll('button');
        buttons.forEach(b => { b.disabled = true; });
        const rpc = decision === 'accept' ? 'accept_trial_counsel_offer'
                                          : 'decline_trial_counsel_offer';
        try {
            const { data, error } = await supabase.rpc(rpc, {
                p_owner_faction_id: factionId, p_offer_id: offerId,
            });
            if (error) throw error;
            if (!data?.success) {
                alert((decision === 'accept' ? 'Could not accept: ' : 'Could not decline: ')
                      + (data?.reason || 'unknown'));
                buttons.forEach(b => { b.disabled = false; });
                return;
            }
            window.location.reload();
        } catch (err) {
            alert('Failed: ' + (err?.message || 'network error'));
            buttons.forEach(b => { b.disabled = false; });
        }
    }

    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c =>
            ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    }

    async function refresh() {
        const alerts = await fetchAlerts();
        count = alerts.length;
        host.replaceChildren();
        if (alerts.length === 0) {
            if (showEmpty) {
                const empty = document.createElement('div'); empty.className = 'tc-pi-empty';
                empty.textContent = 'No corp trial alerts.';
                host.appendChild(empty);
            }
        } else {
            alerts.forEach(a => host.appendChild(renderCard(a)));
        }
        if (typeof onChange === 'function') onChange();
    }

    refresh();
    return { refresh, getCount: () => count };
}
