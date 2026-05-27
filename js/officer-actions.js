// Officer Actions — five staff actions that reallocate an army's operating
// modifiers (+5 one stat / −5 another) for a treasury fee. One lightweight
// confirm modal drives all five; the army_officer_action RPC is the single
// authority for the effect, the clamp, and the cost.

import { _supabase } from './supabase-client.js';
import { escapeHtml } from './utils.js';

// Each action's effects are the SINGLE SOURCE OF TRUTH for the displayed numbers
// (the modal here + the army-actions.html cards read officerEffectText()). The
// server RPC army_officer_action applies the matching deltas — keep the two in
// step. `k` is up/down only for colouring. Manpower is a soldier count (±1,000,
// no 0–100 clamp); every other effect is a 0–100 stat (±5 primary, ±3 secondary).
const OA = {
    forward_stockpiling:     { name: 'Forward Stockpiling',     cost: 4,   blurb: 'Cram the forward depots to bursting — the overloaded transport net slows even as stocks rise.',
        eff: [{ t: '+5 Supply', k: 'up' }, { t: '−5 Logistics', k: 'down' }] },
    logistics_overhaul:      { name: 'Logistics Overhaul',      cost: 6,   blurb: 'Re-rationalise convoys and motor pools for throughput — existing stockpiles are consumed in the reshuffle.',
        eff: [{ t: '+5 Logistics', k: 'up' }, { t: '−5 Supply', k: 'down' }] },
    intensive_drills:        { name: 'Intensive Drills',        cost: 5,   blurb: 'Grueling drill cycles sharpen combat skill — exhausted, resentful troops fray and some wash out.',
        eff: [{ t: '+5 Training', k: 'up' }, { t: '−5 Cohesion', k: 'down' }, { t: '−1,000 Manpower', k: 'down' }] },
    internal_security_sweep: { name: 'Internal Security Sweep', cost: 6,   blurb: 'Root out defeatists and informants — ranks close up, but surveillance corrodes professional trust and the purge thins the ranks.',
        eff: [{ t: '+5 Cohesion', k: 'up' }, { t: '−5 Professionalism', k: 'down' }, { t: '−1,000 Manpower', k: 'down' }] },
    doctrine_reform:         { name: 'Doctrine Reform',         cost: 7.5, blurb: 'Rewrite the field manual and enforce standards — conduct focus pulls troops off the live-fire range but sharpens the officer corps.',
        eff: [{ t: '+5 Professionalism', k: 'up' }, { t: '−5 Training', k: 'down' }, { t: '+3 Officer Corps', k: 'up' }] },
    requisition_drive:       { name: 'Requisition Drive',       cost: 5,   blurb: 'Seize supplies hard to fill the depots — heavy-handed requisition grinds morale and spurs desertion.',
        eff: [{ t: '+5 Supply', k: 'up' }, { t: '−5 Cohesion', k: 'down' }, { t: '−1,000 Manpower', k: 'down' }] },
    comforts_and_rations:    { name: 'Comforts & Rations',      cost: 5,   blurb: 'Spend stockpiles on hot food, rest, and comforts — morale lifts and stragglers rejoin as the depots draw down.',
        eff: [{ t: '+5 Cohesion', k: 'up' }, { t: '−5 Supply', k: 'down' }, { t: '+1,000 Manpower', k: 'up' }] },
    field_improvisation:     { name: 'Field Improvisation',     cost: 6,   blurb: 'Push throughput by improvising routes and pressing every hand into hauling — standards slip and the command staff is sidelined.',
        eff: [{ t: '+5 Logistics', k: 'up' }, { t: '−5 Professionalism', k: 'down' }, { t: '−3 Officer Corps', k: 'down' }] },
    standardize_procedures:  { name: 'Standardize Procedures',  cost: 7,   blurb: 'Impose strict doctrine and paperwork — professional standards rise and the staff sharpens, but the transport net bogs down in process.',
        eff: [{ t: '+5 Professionalism', k: 'up' }, { t: '−5 Logistics', k: 'down' }, { t: '+3 Officer Corps', k: 'up' }] },
};

// Joined effect line, e.g. "+5 Training / −5 Cohesion / −1,000 Manpower". Single
// source for both the modal and the army-actions.html action cards.
export function officerEffectText(key) {
    const def = OA[key];
    return def ? def.eff.map(e => e.t).join(' / ') : '';
}

const money = (raw) => '$' + ((Number(raw) || 0) / 1e6).toFixed(1).replace(/\.0$/, '');

let _stylesInjected = false;
function ensureStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    const s = document.createElement('style');
    s.id = 'oa-styles';
    s.textContent = `
    .oa-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:600; display:flex; align-items:center; justify-content:center; padding:30px; }
    .oa-modal { background:#0a0a0a; border:0.5px solid rgba(182,83,63,0.3); border-radius:6px; width:100%; max-width:440px; font-family:var(--font-mono,monospace); overflow:hidden; }
    .oa-head { padding:16px 22px; border-bottom:0.5px solid rgba(255,255,255,0.08); background:linear-gradient(180deg,rgba(182,83,63,0.06),#0c0c0c); }
    .oa-eyebrow { color:#b6533f; font-size:10px; letter-spacing:0.15em; }
    .oa-title { font-size:20px; color:#fff; margin-top:3px; }
    .oa-body { padding:16px 22px; }
    .oa-blurb { font-size:12px; line-height:1.6; color:#9a9a92; }
    .oa-eff { display:flex; gap:10px; margin:14px 0; }
    .oa-eff span { flex:1; text-align:center; padding:9px; border-radius:4px; font-size:13px; font-weight:700; letter-spacing:0.03em; }
    .oa-eff .up { background:rgba(70,196,106,0.1); border:0.5px solid rgba(70,196,106,0.4); color:#5cc46a; }
    .oa-eff .down { background:rgba(229,83,75,0.1); border:0.5px solid rgba(229,83,75,0.4); color:#e5705a; }
    .oa-cost { font-size:11px; color:#888; letter-spacing:0.04em; }
    .oa-cost b { color:#d4d4d4; } .oa-cost b.ok { color:#5cc46a; } .oa-cost b.no { color:#e5534b; }
    .oa-cd { margin-top:10px; font-size:11px; color:#c8a832; }
    .oa-err { margin-top:10px; font-size:11px; color:#c47a7a; }
    .oa-done { margin-top:10px; font-size:12px; color:#5cc46a; }
    .oa-foot { display:flex; gap:8px; justify-content:flex-end; padding:14px 22px; border-top:0.5px solid rgba(255,255,255,0.08); background:#0d0d0d; }
    .oa-btn { padding:9px 18px; font-size:11px; letter-spacing:0.06em; border-radius:3px; cursor:pointer; }
    .oa-btn.sec { border:0.5px solid rgba(255,255,255,0.15); color:#888; }
    .oa-btn.pri { background:#2a1715; border:0.5px solid #b6533f; color:#e8c0b6; font-weight:600; }
    .oa-btn.pri.off { opacity:0.4; pointer-events:none; }`;
    document.head.appendChild(s);
}

// faction: the army faction { id, party_funds }. onDone() fires after a
// successful action is acknowledged (so the caller can refresh treasury/stats).
export function openOfficerAction(faction, key, onDone) {
    const def = OA[key];
    if (!def || !faction?.id) return;
    ensureStyles();
    let overlay = document.getElementById('oa-overlay');
    if (!overlay) { overlay = document.createElement('div'); overlay.id = 'oa-overlay'; overlay.className = 'oa-overlay'; document.body.appendChild(overlay); }

    const costRaw = def.cost * 1e6;
    let funds = Number(faction.party_funds) || 0;
    let busy = false, done = false, err = '', cdRemaining = 0;

    const close = () => { overlay.style.display = 'none'; overlay.innerHTML = ''; overlay.onclick = null; };

    function render() {
        const enough = funds >= costRaw;
        const onCd = cdRemaining > 0;
        overlay.innerHTML = `<div class="oa-modal">
            <div class="oa-head"><div class="oa-eyebrow">— OFFICER ACTION —</div><div class="oa-title">${escapeHtml(def.name)}</div></div>
            <div class="oa-body">
                <div class="oa-blurb">${escapeHtml(def.blurb)}</div>
                <div class="oa-eff">${def.eff.map(e => `<span class="${e.k}">${escapeHtml(e.t)}</span>`).join('')}</div>
                <div class="oa-cost">Cost <b>${money(costRaw)}</b> &middot; Army Funds <b class="${enough ? 'ok' : 'no'}">${money(funds)}</b> &middot; 12-tick cooldown</div>
                ${onCd ? `<div class="oa-cd">On cooldown — ready in ${cdRemaining} tick${cdRemaining === 1 ? '' : 's'}.</div>` : ''}
                ${err ? `<div class="oa-err">${escapeHtml(err)}</div>` : ''}
                ${done ? `<div class="oa-done">Order carried out — ${escapeHtml(def.eff.map(e => e.t).join(', '))}.</div>` : ''}
            </div>
            <div class="oa-foot">
                <div class="oa-btn sec" data-oa="close">${done ? 'Close' : 'Cancel'}</div>
                ${done ? '' : `<div class="oa-btn pri ${(!enough || busy || onCd) ? 'off' : ''}" data-oa="go">${busy ? 'Working…' : 'Execute — ' + money(costRaw)}</div>`}
            </div>
        </div>`;
    }

    overlay.onclick = async (e) => {
        if (e.target === overlay) { if (!busy) { close(); if (done && typeof onDone === 'function') onDone(); } return; }
        const el = e.target.closest('[data-oa]');
        if (!el) return;
        const v = el.getAttribute('data-oa');
        if (v === 'close') { if (!busy) { close(); if (done && typeof onDone === 'function') onDone(); } return; }
        if (v === 'go') {
            if (busy || done || funds < costRaw || cdRemaining > 0) return;
            busy = true; err = ''; render();
            try {
                const { data, error } = await _supabase.rpc('army_officer_action', { p_faction_id: faction.id, p_action: key });
                if (error || (data && data.success === false)) {
                    err = (data && data.error) || error?.message || 'Action failed.'; busy = false; render();
                } else {
                    done = true; busy = false; funds -= costRaw; render();
                }
            } catch (ex) {
                err = ex?.message || 'Action failed.'; busy = false; render();
            }
        }
    };

    overlay.style.display = 'flex';
    render();
    // Fetch fresh funds + this action's cooldown so the button reflects reality.
    (async () => {
        try {
            const [fRes, sRes] = await Promise.all([
                _supabase.from('factions').select('party_funds, officer_action_cooldowns').eq('id', faction.id).maybeSingle(),
                _supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').maybeSingle(),
            ]);
            if (fRes.data) {
                funds = Number(fRes.data.party_funds) || 0;
                const last = Number(fRes.data.officer_action_cooldowns?.[key]);
                // Only compute remaining if we actually got the tick — a missing
                // shard row would otherwise read tick=0 and fake a huge cooldown.
                if (sRes.data && Number.isFinite(last)) {
                    cdRemaining = Math.max(0, last + 12 - (Number(sRes.data.current_tick) || 0));
                }
            }
        } catch (_) { /* non-fatal — keep the optimistic render */ }
        if (!done && !busy) render();
    })();
}
