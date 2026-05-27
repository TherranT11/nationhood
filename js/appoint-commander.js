// Appoint Army Commander — roll 7 generals and put one in charge of an army.
// Free Chief-of-Staff action. Stats are rolled under live ceilings (Leadership
// ≤ Professionalism, Discipline ≤ Cohesion, Loyalty ≤ f(approval,unrest)); the
// appoint_army_commander RPC re-clamps them, so the rolls here are honest UI.
// Leadership & Discipline drive combat; State Loyalty is shown but inert for now.

import { _supabase } from './supabase-client.js';
import { escapeHtml, escapeAttr } from './utils.js';
import { getNationNames } from './game/political-actions.js';

const ARMY_TYPE_SHORT = { regular: 'Regular', guard: 'Guard', paramilitary: 'Paramilitary' };
const rnd = (max) => 1 + Math.floor(Math.random() * Math.max(1, Math.round(max)));
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

let _stylesInjected = false;
function ensureStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    const s = document.createElement('style');
    s.id = 'ac-styles';
    s.textContent = `
    .ac-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:600; display:flex; align-items:center; justify-content:center; padding:30px; }
    .ac-modal { background:#0a0a0a; border:0.5px solid rgba(182,83,63,0.3); border-radius:6px; width:100%; max-width:720px; max-height:92vh; display:flex; flex-direction:column; font-family:var(--font-mono,monospace); overflow:hidden; }
    .ac-head { padding:16px 22px; border-bottom:0.5px solid rgba(255,255,255,0.08); background:linear-gradient(180deg,rgba(182,83,63,0.06),#0c0c0c); display:flex; align-items:center; }
    .ac-eyebrow { color:#b6533f; font-size:10px; letter-spacing:0.15em; }
    .ac-title { font-size:20px; color:#fff; margin-top:3px; }
    .ac-x { margin-left:auto; border:0.5px solid rgba(255,255,255,0.15); color:#888; width:26px; height:26px; border-radius:3px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; }
    .ac-body { padding:14px 22px; overflow-y:auto; }
    .ac-sec { font-size:10px; letter-spacing:0.14em; color:#666; margin:6px 0 8px; }
    .ac-row { display:flex; align-items:center; gap:10px; padding:9px 11px; border:0.5px solid rgba(255,255,255,0.08); border-radius:4px; margin-bottom:6px; cursor:pointer; }
    .ac-row.sel { border-color:#b6533f; background:rgba(182,83,63,0.08); }
    .ac-row .nm { font-size:13px; font-weight:600; color:#fff; }
    .ac-row .sub { font-size:9px; color:#777; margin-top:2px; }
    .ac-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .ac-gen { border:0.5px solid rgba(255,255,255,0.08); border-radius:5px; padding:11px 13px; cursor:pointer; }
    .ac-gen.sel { border-color:#b6533f; background:rgba(182,83,63,0.08); }
    .ac-gen .gn { font-size:13px; font-weight:600; color:#fff; }
    .ac-gen .ga { font-size:9px; color:#777; margin:2px 0 9px; }
    .ac-stat { display:flex; align-items:center; gap:8px; font-size:9px; margin-bottom:5px; }
    .ac-stat .lab { width:74px; color:#9a9a92; letter-spacing:0.04em; flex:none; }
    .ac-stat .bar { flex:1; height:6px; background:#222; border-radius:3px; overflow:hidden; }
    .ac-stat .fill { height:100%; }
    .ac-stat .fill.lead { background:#5cc46a; } .ac-stat .fill.disc { background:#c8a832; } .ac-stat .fill.loy { background:#6a8fb0; }
    .ac-stat .v { width:24px; text-align:right; color:#d4d4d4; font-weight:600; flex:none; }
    .ac-stat.inert .lab, .ac-stat.inert .v { color:#666; }
    .ac-foot { display:flex; align-items:center; gap:14px; padding:14px 22px; border-top:0.5px solid rgba(255,255,255,0.08); background:#0d0d0d; }
    .ac-foot .fm { font-size:10px; color:#888; line-height:1.5; }
    .ac-err { color:#c47a7a; } .ac-ok { color:#5cc46a; }
    .ac-acts { margin-left:auto; display:flex; gap:8px; }
    .ac-btn { padding:9px 18px; font-size:11px; letter-spacing:0.06em; border-radius:3px; cursor:pointer; }
    .ac-btn.sec { border:0.5px solid rgba(255,255,255,0.15); color:#888; }
    .ac-btn.pri { background:#2a1715; border:0.5px solid #b6533f; color:#e8c0b6; font-weight:600; }
    .ac-btn.pri.off { opacity:0.4; pointer-events:none; }
    .ac-empty { padding:24px; text-align:center; color:#666; font-size:12px; }`;
    document.head.appendChild(s);
}

export function openAppointCommanderModal(faction, onDone) {
    if (!faction?.id) return;
    ensureStyles();
    let overlay = document.getElementById('ac-overlay');
    if (!overlay) { overlay = document.createElement('div'); overlay.id = 'ac-overlay'; overlay.className = 'ac-overlay'; document.body.appendChild(overlay); }

    let armies = [], generals = [], selArmy = null, selGen = null, busy = false, result = '', loadError = '';
    const close = () => { overlay.style.display = 'none'; overlay.innerHTML = ''; overlay.onclick = null; };

    const statRow = (lab, val, cls, inert) =>
        `<div class="ac-stat${inert ? ' inert' : ''}"><span class="lab">${lab}</span><span class="bar"><span class="fill ${cls}" style="width:${val}%;"></span></span><span class="v">${val}</span></div>`;

    function render() {
        const armiesHtml = armies.length
            ? armies.map(a => `<div class="ac-row ${selArmy === a.id ? 'sel' : ''}" data-ac="army:${escapeAttr(a.id)}">
                <div style="flex:1;min-width:0;"><div class="nm">${escapeHtml(a.name)}</div>
                <div class="sub">${escapeHtml(ARMY_TYPE_SHORT[a.army_type] || a.army_type || '')}${a.commander_name ? ' · led by ' + escapeHtml(a.commander_name) : ' · no commander'}</div></div></div>`).join('')
            : `<div class="ac-empty">No armies yet — use Create Army first.</div>`;

        const gensHtml = generals.map((g, i) => `<div class="ac-gen ${selGen === i ? 'sel' : ''}" data-ac="gen:${i}">
            <div class="gn">${escapeHtml(g.name)}</div><div class="ga">Age ${g.age}</div>
            ${statRow('LEADERSHIP', g.leadership, 'lead', false)}
            ${statRow('DISCIPLINE', g.discipline, 'disc', false)}
            ${statRow('STATE LOY.', g.loyalty, 'loy', true)}
        </div>`).join('');

        const canAppoint = selArmy && selGen !== null && !busy && !result;
        const msg = result || loadError;
        const isErr = msg.startsWith('Error') || (!result && !!loadError);
        overlay.innerHTML = `<div class="ac-modal">
            <div class="ac-head"><div><div class="ac-eyebrow">— ARMY ACTION —</div><div class="ac-title">Appoint Army <em>Commander</em></div></div><div class="ac-x" data-ac="close">×</div></div>
            <div class="ac-body">
                <div class="ac-sec">I. ARMY</div>${armiesHtml}
                <div class="ac-sec" style="margin-top:14px;">II. GENERAL <span style="color:#555;">· Leadership ≤ Professionalism, Discipline ≤ Cohesion · State Loyalty has no effect yet</span></div>
                <div class="ac-grid">${gensHtml}</div>
            </div>
            <div class="ac-foot">
                <div class="fm ${isErr ? 'ac-err' : 'ac-ok'}">${escapeHtml(msg)}</div>
                <div class="ac-acts">
                    <div class="ac-btn sec" data-ac="close">${result ? 'Close' : 'Cancel'}</div>
                    ${result ? '' : `<div class="ac-btn pri ${canAppoint ? '' : 'off'}" data-ac="appoint">Appoint →</div>`}
                </div>
            </div>
        </div>`;
    }

    overlay.onclick = async (e) => {
        if (e.target === overlay) { if (!busy) { close(); if (result && typeof onDone === 'function') onDone(); } return; }
        const el = e.target.closest('[data-ac]');
        if (!el) return;
        const v = el.getAttribute('data-ac');
        if (v === 'close') { if (!busy) { close(); if (result && typeof onDone === 'function') onDone(); } return; }
        if (v.startsWith('army:')) { if (!busy && !result) { selArmy = v.slice(5); render(); } return; }
        if (v.startsWith('gen:')) { if (!busy && !result) { selGen = Number(v.slice(4)); render(); } return; }
        if (v === 'appoint') {
            const g = generals[selGen];
            if (!selArmy || !g || busy || result) return;
            busy = true; render();
            try {
                const { data, error } = await _supabase.rpc('appoint_army_commander', {
                    p_army_id: selArmy, p_name: g.name, p_age: g.age,
                    p_leadership: g.leadership, p_loyalty: g.loyalty, p_discipline: g.discipline,
                });
                if (error || (data && data.success === false)) {
                    result = 'Error: ' + ((data && data.error) || error?.message || 'appointment failed.');
                } else {
                    result = `${g.name} now commands the army.`;
                }
            } catch (ex) {
                result = 'Error: ' + (ex?.message || 'appointment failed.');
            }
            busy = false; render();
        }
    };

    overlay.style.display = 'flex';
    overlay.innerHTML = '<div class="ac-modal"><div class="ac-body"><div class="ac-empty">Loading…</div></div></div>';
    (async () => {
        try {
            const [aRes, fRes, nRes] = await Promise.all([
                _supabase.from('armies').select('id, name, army_type, commander_name').eq('faction_id', faction.id).order('created_at_tick', { ascending: true }),
                _supabase.from('factions').select('army_professionalism, army_cohesion').eq('id', faction.id).maybeSingle(),
                faction.nation_id ? _supabase.from('nations').select('name, unrest, public_approval').eq('id', faction.nation_id).maybeSingle() : Promise.resolve({ data: null }),
            ]);
            if (aRes.error) throw aRes.error;
            armies = aRes.data || [];
            const prof = Number(fRes.data?.army_professionalism) || 0;
            const coh = Number(fRes.data?.army_cohesion) || 0;
            const unrest = Number(nRes.data?.unrest) || 0;
            const approval = Number(nRes.data?.public_approval) || 0;
            const loyCeil = clamp(Math.round((approval + (100 - unrest)) / 2), 1, 100);
            const pools = getNationNames(nRes.data?.name || faction.__nation_name || '');
            const fn = pools.firstNames || [], ln = pools.lastNames || [];
            const pick = (arr) => arr.length ? arr[Math.floor(Math.random() * arr.length)] : '';
            generals = Array.from({ length: 7 }, () => ({
                name: `${pick(fn)} ${pick(ln)}`.trim() || 'Unnamed Officer',
                age: 45 + Math.floor(Math.random() * 28),
                leadership: rnd(prof),
                discipline: rnd(coh),
                loyalty: rnd(loyCeil),
            }));
            if (armies.length) selArmy = armies[0].id;
        } catch (e) {
            loadError = 'Could not load — try again.';
            console.warn('[appoint-commander] load failed:', e?.message || e);
        }
        render();
    })();
}
