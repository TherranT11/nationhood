/**
 * acquisition-pressing-issues.js — Pressing-Issues mount for open
 * corp acquisition negotiations (2.6.8.3).
 *
 * Surfaces every negotiating corp_acquisitions where the viewer is on
 * either side of the table — the SELLER (their corp is the target) or
 * the BUYER (their corp made the offer). Each card states the deal in
 * one line and links to the corp page, where the existing acquire
 * modal ([Review offer] for the owner / the negotiation view for the
 * buyer) handles chat + price + agree.
 *
 * The card is read-only on the dashboard by design — all deal actions
 * live in one place (the corp-page modal), so there's a single source
 * of truth for the negotiation UI.
 *
 * Mirrors js/corp-board-pressing-issues.js (same mount contract) and
 * supports the showEmpty/onChange coordination used when several
 * pressing-issue handlers share one column (see corp-operations).
 *
 * Usage:
 *   import { mountAcquisitionPressingIssues } from './js/acquisition-pressing-issues.js';
 *   const ctl = mountAcquisitionPressingIssues({
 *       supabase, faction, host: document.getElementById('ent-pi-acq'),
 *       showEmpty: false, onChange: () => syncEmpty(),
 *   });
 *   // ctl.refresh()  — re-fetch on demand
 *   // ctl.getCount() — number of open negotiations the viewer is in
 */

import { ownerDisplayName, fmtUsd } from './utils.js';

const STYLE_ID = 'aq-acq-pressing-styles';

const CSS = `
.aq-card { background:#1a1a17; border:1px solid rgba(255,255,255,0.06);
  border-left:3px solid #c2a35a; padding:16px 18px; margin-bottom:12px; }
.aq-row1 { display:flex; align-items:baseline; justify-content:space-between; gap:10px; margin-bottom:10px; }
.aq-row1 .ti { font-size:13px; font-weight:500; color:#fff; }
.aq-row1 .ti em { font-style:italic; color:#c2a35a; font-weight:400; }
.aq-row1 .tag { font-size:9px; color:#c2a35a; letter-spacing:0.14em; }
.aq-line { font-size:12px; color:#cfcfcf; line-height:1.5; margin-bottom:10px; }
.aq-line b { color:#fff; font-weight:500; }
.aq-line .px { color:#c2a35a; font-variant-numeric:tabular-nums; }
.aq-status { font-size:11px; color:#888; padding:4px 0 10px; }
.aq-status .ag { color:#8aaa6a; }
.aq-actions { display:flex; gap:10px; justify-content:flex-end; }
.aq-btn { padding:8px 16px; border-radius:3px; font-size:11px; letter-spacing:0.06em;
  font-weight:500; cursor:pointer; border:0.5px solid #c2a35a; background:#26210f; color:#c2a35a;
  text-decoration:none; display:inline-block; font-family:inherit; }
.aq-btn:hover { background:#332a13; }
`;

function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
}

export function mountAcquisitionPressingIssues({
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
        const { data, error } = await supabase
            .from('corp_acquisitions')
            .select('id, target_corp_id, price, buyer_agreed, seller_agreed,'
                  + ' buyer_faction_id, seller_faction_id,'
                  + ' target:entrepreneur_corps!target_corp_id(id, name),'
                  + ' buyer:factions!buyer_faction_id(faction_name, leader_first_name, leader_last_name)')
            .eq('status', 'negotiating')
            .or(`seller_faction_id.eq.${factionId},buyer_faction_id.eq.${factionId}`)
            .order('created_at', { ascending: false });
        if (error) { console.warn('[acq-pi] fetch failed:', error.message); return []; }
        return data || [];
    }

    function renderCard(acq) {
        const corp = acq.target || {};
        const corpName = corp.name || 'a corporation';
        const iAmSeller = acq.seller_faction_id === factionId;

        const card = document.createElement('div'); card.className = 'aq-card';

        const row1 = document.createElement('div'); row1.className = 'aq-row1';
        const ti = document.createElement('div'); ti.className = 'ti';
        const tiSans = document.createElement('span');
        tiSans.textContent = iAmSeller ? 'Acquisition offer — ' : 'Your acquisition — ';
        const tiEm = document.createElement('em'); tiEm.textContent = corpName;
        ti.append(tiSans, tiEm);
        const tag = document.createElement('div'); tag.className = 'tag';
        tag.textContent = iAmSeller ? 'INCOMING' : 'PENDING';
        row1.append(ti, tag);

        const line = document.createElement('div'); line.className = 'aq-line';
        if (iAmSeller) {
            const who = document.createElement('b'); who.textContent = ownerDisplayName(acq.buyer);
            const px = document.createElement('span'); px.className = 'px'; px.textContent = fmtUsd(acq.price);
            line.append(who, document.createTextNode(' proposes to acquire your corporation for '), px, document.createTextNode('.'));
        } else {
            const px = document.createElement('span'); px.className = 'px'; px.textContent = fmtUsd(acq.price);
            line.append(document.createTextNode('You offered to acquire '), (() => { const b = document.createElement('b'); b.textContent = corpName; return b; })(), document.createTextNode(' for '), px, document.createTextNode('.'));
        }

        const status = document.createElement('div'); status.className = 'aq-status';
        const buyerOk = document.createElement('span'); buyerOk.className = acq.buyer_agreed ? 'ag' : '';
        buyerOk.textContent = `Buyer ${acq.buyer_agreed ? '✓' : '…'}`;
        const sellerOk = document.createElement('span'); sellerOk.className = acq.seller_agreed ? 'ag' : '';
        sellerOk.textContent = `Seller ${acq.seller_agreed ? '✓' : '…'}`;
        status.append(buyerOk, document.createTextNode('   ·   '), sellerOk);

        const actions = document.createElement('div'); actions.className = 'aq-actions';
        const btn = document.createElement('a'); btn.className = 'aq-btn';
        btn.href = `entrepreneur-corp.html?id=${encodeURIComponent(acq.target_corp_id)}`;
        btn.textContent = iAmSeller ? 'Review offer' : 'View negotiation';
        actions.appendChild(btn);

        card.append(row1, line, status, actions);
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
            try { onChange(items); } catch (e) { console.warn('[acq-pi] onChange threw:', e?.message || e); }
        }
    }

    refresh();

    return { refresh, getCount: () => count };
}
