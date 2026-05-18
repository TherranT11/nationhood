// ─── Report to Defense Minister — Phase 1 (filing modal) ───────────
//
// The army Chief-of-Staff action. Self-contained (own overlay +
// injected styles, own data fetch) — mirrors js/create-unit.js.
// Submits a confidential briefing + the army's current modifier
// snapshot via the file_chief_of_staff_report RPC (which is the
// single authority for cost / cooldown / snapshot). The Pressing
// Issues consumer render is Phase 2.

import { _supabase } from './supabase-client.js';
import { escapeHtml } from './utils.js';

const BODY_LIMIT = 1200;
const STAT_ROWS = [
  ['manpower',        'Manpower'],
  ['officer_corps',   'Officer Corps'],
  ['training',        'Training'],
  ['equipment',       'Equipment Quality'],
  ['cohesion',        'Cohesion'],
  ['professionalism', 'Professionalism'],
  ['logistics',       'Logistics'],
  ['supplies',        'Supplies'],
];

function rdMoney(raw) {
  return '$' + ((Number(raw) || 0) / 1e6).toFixed(1).replace(/\.0$/, '');
}

const RD_CSS = `
.rd-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:600; display:flex; align-items:center; justify-content:center; padding:30px; }
.rd-modal { background:#0a0a0a; border:0.5px solid rgba(122,154,171,0.25); border-radius:6px; width:100%; max-width:820px; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; font-family:var(--font-mono,monospace); }
.rd-head { display:flex; align-items:center; gap:14px; padding:16px 22px; border-bottom:0.5px solid rgba(255,255,255,0.08); background:linear-gradient(180deg,rgba(122,154,171,0.05),#0c0c0c); }
.rd-eyebrow { color:#7a9aab; font-size:10px; letter-spacing:0.15em; }
.rd-title { font-size:20px; color:#fff; margin-top:2px; }
.rd-title em { color:#7a9aab; font-style:italic; }
.rd-head-right { margin-left:auto; display:flex; align-items:center; gap:18px; }
.rd-stat { text-align:right; }
.rd-stat .l { color:#666; font-size:9px; letter-spacing:0.12em; }
.rd-stat .v { font-size:13px; margin-top:2px; color:#d4d4d4; }
.rd-stat .v.steel { color:#7a9aab; font-weight:600; }
.rd-x { border:0.5px solid rgba(255,255,255,0.15); color:#888; width:26px; height:26px; border-radius:3px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; }
.rd-recipient { display:flex; align-items:center; gap:10px; padding:11px 22px; background:#0c1115; border-bottom:0.5px solid rgba(122,154,171,0.12); font-size:11px; color:#aab8c0; flex-wrap:wrap; }
.rd-recipient .lbl { color:#555; font-size:9px; letter-spacing:0.13em; margin-right:5px; }
.rd-recipient .who { color:#d4d4d4; font-weight:600; }
.rd-recipient .role { color:#7a9aab; font-size:10px; letter-spacing:0.08em; }
.rd-recipient .arr { color:#4a4a4a; margin:0 6px; }
.rd-body { flex:1; overflow-y:auto; padding:18px 22px; }
.rd-sec { font-size:11px; letter-spacing:0.12em; color:#888; text-transform:uppercase; margin:16px 0 10px; }
.rd-sec:first-child { margin-top:0; }
.rd-snap { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.rd-snap .cell { background:#121518; border:0.5px solid rgba(122,154,171,0.15); border-radius:3px; padding:9px 11px; }
.rd-snap .cell .k { font-size:9px; color:#7a9aab; letter-spacing:0.1em; text-transform:uppercase; }
.rd-snap .cell .v { font-size:16px; font-weight:600; color:#fff; margin-top:3px; }
.rd-ta { width:100%; min-height:200px; background:#0d1115; border:0.5px solid rgba(122,154,171,0.2); border-radius:4px; color:#d8d8d8; font-size:13px; line-height:1.6; font-family:Georgia,'Times New Roman',serif; resize:vertical; padding:14px 16px; outline:none; }
.rd-ta::placeholder { color:#445; font-style:italic; }
.rd-count { font-size:9px; color:#555; text-align:right; margin-top:6px; letter-spacing:0.06em; }
.rd-count.over { color:#c47a7a; }
.rd-pub { display:flex; align-items:center; gap:8px; margin-top:14px; font-size:11px; color:#aab8c0; cursor:pointer; user-select:none; }
.rd-pub input { accent-color:#7a9aab; width:14px; height:14px; }
.rd-foot { display:flex; align-items:center; gap:16px; padding:14px 22px; border-top:0.5px solid rgba(255,255,255,0.08); background:#0d0d0d; }
.rd-foot .fm { font-size:10px; letter-spacing:0.08em; color:#666; }
.rd-foot .fm .steel { color:#7a9aab; font-weight:600; }
.rd-acts { margin-left:auto; display:flex; gap:8px; }
.rd-btn { padding:9px 18px; font-size:11px; letter-spacing:0.06em; border-radius:3px; cursor:pointer; font-family:inherit; }
.rd-btn.sec { border:0.5px solid rgba(255,255,255,0.15); color:#888; background:transparent; }
.rd-btn.pri { background:#1a2a35; border:0.5px solid #7a9aab; color:#c8d4dc; font-weight:600; }
.rd-btn.pri.off { opacity:0.4; pointer-events:none; }
`;

function ensureStyles() {
  if (document.getElementById('rd-styles')) return;
  const s = document.createElement('style');
  s.id = 'rd-styles';
  s.textContent = RD_CSS;
  document.head.appendChild(s);
}

// Self-fetch: party_funds + the 8 modifiers + the Defense Minister
// name. Never rejects (safe defaults + console.warn), like
// create-unit's loader.
async function loadContext(faction) {
  let funds = 0, stats = {}, minister = '';
  try {
    const { data: f, error: fErr } = await _supabase
      .from('factions')
      .select('party_funds, army_manpower, army_officer_corps, army_training, army_equipment, army_cohesion, army_professionalism, army_logistics, army_supplies')
      .eq('id', faction.id)
      .maybeSingle();
    if (fErr) console.warn('[report-defense] faction load failed:', fErr.message);
    if (f) {
      funds = Number(f.party_funds) || 0;
      stats = {
        manpower:  f.army_manpower,  officer_corps:   f.army_officer_corps,
        training:  f.army_training,  equipment:       f.army_equipment,
        cohesion:  f.army_cohesion,  professionalism: f.army_professionalism,
        logistics: f.army_logistics, supplies:        f.army_supplies,
      };
    }
    const { data: m, error: mErr } = await _supabase
      .from('ministries')
      .select('minister_first_name, minister_last_name')
      .eq('nation_id', faction.nation_id)
      .eq('ministry_key', 'defense')
      .eq('is_active', true)
      .maybeSingle();
    if (mErr) console.warn('[report-defense] minister load failed:', mErr.message);
    if (m) minister = `${m.minister_first_name || ''} ${m.minister_last_name || ''}`.trim();
  } catch (e) {
    console.warn('[report-defense] context load failed:', e?.message || e);
  }
  return { funds, stats, minister };
}

export function openReportModal(faction) {
  if (!faction?.id) return;
  ensureStyles();

  let overlay = document.getElementById('rd-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'rd-overlay';
    overlay.className = 'rd-overlay';
    document.body.appendChild(overlay);
  }

  let submitting = false;
  const chief = `${faction.leader_first_name || ''} ${faction.leader_last_name || ''}`.trim() || 'The Chief of Staff';

  function close() {
    overlay.style.display = 'none';
    overlay.innerHTML = '';
    overlay.onclick = null;
    overlay.oninput = null;
  }

  function shell(ctx) {
    const ministerLine = ctx.minister
      ? `<span class="who">${escapeHtml(ctx.minister)}</span> <span class="role">MINISTER OF DEFENSE</span>`
      : `<span class="who" style="color:#888;">Vacant</span> <span class="role">NO DEFENSE MINISTER</span>`;
    const snapCells = STAT_ROWS.map(([k, label]) => {
      const v = ctx.stats[k];
      const shown = (v === null || v === undefined) ? '—' : Number(v).toLocaleString();
      return `<div class="cell"><div class="k">${escapeHtml(label)}</div><div class="v">${shown}</div></div>`;
    }).join('');

    overlay.innerHTML = `<div class="rd-modal">
      <div class="rd-head">
        <div>
          <div class="rd-eyebrow">— ARMY ACTION · RESTRICTED —</div>
          <div class="rd-title">Report to <em>Defense Minister</em></div>
        </div>
        <div class="rd-head-right">
          <div class="rd-stat"><div class="l">FILING COST</div><div class="v steel">$1</div></div>
          <div class="rd-stat"><div class="l">ARMY FUNDS</div><div class="v">${rdMoney(ctx.funds)}</div></div>
          <div class="rd-x" data-rd="close">×</div>
        </div>
      </div>
      <div class="rd-recipient">
        <span class="lbl">FROM</span><span class="who">${escapeHtml(chief)}</span> <span class="role">CHIEF OF STAFF</span>
        <span class="arr">▸</span>
        <span class="lbl">TO</span>${ministerLine}
      </div>
      <div class="rd-body">
        <div class="rd-sec">Service snapshot — auto-attached, read-only</div>
        <div class="rd-snap">${snapCells}</div>
        <div class="rd-sec">Confidential briefing</div>
        <textarea class="rd-ta" id="rd-body" maxlength="${BODY_LIMIT}" placeholder="Write privately to the Defense Minister. Only the party that controls the Defense ministry can read this; every other party sees only the headline."></textarea>
        <div class="rd-count" id="rd-count">0 / ${BODY_LIMIT}</div>
        <label class="rd-pub"><input type="checkbox" id="rd-public"> Make report public — every party can read the full report (default: only the Defense Minister's party)</label>
      </div>
      <div class="rd-foot">
        <div class="fm">VISIBILITY: <span class="steel" id="rd-vis">DEFENSE MINISTER'S PARTY ONLY</span></div>
        <div class="rd-acts">
          <div class="rd-btn sec" data-rd="cancel">CANCEL</div>
          <div class="rd-btn pri off" id="rd-file" data-rd="file">FILE BRIEFING — $1 →</div>
        </div>
      </div>
    </div>`;

    const ta = overlay.querySelector('#rd-body');
    const cnt = overlay.querySelector('#rd-count');
    const fileBtn = overlay.querySelector('#rd-file');
    const pub = overlay.querySelector('#rd-public');
    const vis = overlay.querySelector('#rd-vis');
    if (pub && vis) pub.onchange = () => {
      vis.textContent = pub.checked ? 'ALL PARTIES (PUBLIC)' : "DEFENSE MINISTER'S PARTY ONLY";
    };
    overlay.oninput = () => {
      const n = ta.value.length;
      cnt.textContent = `${n} / ${BODY_LIMIT}`;
      cnt.classList.toggle('over', n > BODY_LIMIT);
      fileBtn.classList.toggle('off', ta.value.trim().length === 0 || n > BODY_LIMIT);
    };
    ta.focus();
  }

  async function submit() {
    if (submitting) return;
    const ta = overlay.querySelector('#rd-body');
    const body = (ta?.value || '').trim();
    if (!body) { alert('Write the briefing first.'); return; }
    if (body.length > BODY_LIMIT) { alert(`The briefing exceeds the ${BODY_LIMIT} character limit.`); return; }
    submitting = true;
    try {
      const { data, error } = await _supabase.rpc('file_chief_of_staff_report', {
        p_faction_id: faction.id,
        p_body: body,
        p_public: !!overlay.querySelector('#rd-public')?.checked,
      });
      if (error) { alert('Failed to file: ' + error.message); return; }
      if (data && data.success === false) {
        if (data.error === 'cooldown') {
          alert('A report was filed recently. The Chief of Staff may file again in '
            + Math.max(0, (Number(data.ready_at_tick) || 0)) + ' ticks (12-tick cooldown).');
        } else {
          alert(data.error || 'Could not file the report.');
        }
        return;
      }
      close();
      alert('Briefing filed to the Defense Minister. It now appears in the nation’s Pressing Issues.');
    } finally {
      submitting = false;
    }
  }

  overlay.onclick = (e) => {
    const el = e.target.closest('[data-rd]');
    if (!el) { if (e.target === overlay) close(); return; }
    const a = el.getAttribute('data-rd');
    if (a === 'close' || a === 'cancel') return close();
    if (a === 'file') return submit();
  };

  overlay.style.display = 'flex';
  overlay.innerHTML = '<div class="rd-modal"><div class="rd-body"><div class="rd-sec">Loading…</div></div></div>';
  loadContext(faction).then(shell);
}
