// ─── Create Unit — shared module (Phase 1) ─────────────────────────
//
// Single source for: brigade specs, the Create Unit modal (the
// Chief-of-Staff action on army-actions.html), and the Order of
// Battle display (army-operations.html · Order of Battle subtab).
//
// Brigade manpower/cost here are DISPLAY-ONLY. The create_unit RPC
// (migration 20270121) is the sole authority that computes & charges;
// these numbers MUST stay in sync with that RPC's brigade table.

import { _supabase } from './supabase-client.js';
import { escapeHtml, escapeAttr } from './utils.js';

export const AU_BRIGADES = {
  light_infantry: { name: 'Light Infantry', mp: 2000, cost: 1000000 },
  infantry:       { name: 'Infantry',       mp: 3000, cost: 2000000 },
  mechanized:     { name: 'Mechanized',     mp: 1000, cost: 3000000 },
  armor:          { name: 'Armor',          mp:  500, cost: 5000000 },
  artillery:      { name: 'Artillery',      mp: 1000, cost: 2000000 },
  support:        { name: 'Support',        mp: 2000, cost: 2000000 },
};
export const AU_ORDER = ['light_infantry','infantry','mechanized','armor','artillery','support'];
export const AU_FEE = 2000000;

export function auMoney(raw) {
  return '$' + ((Number(raw) || 0) / 1e6).toFixed(1) + 'M';
}

const CU_CSS = `
.cu-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:600; display:flex; align-items:center; justify-content:center; padding:30px; }
.cu-modal { background:#0a0a0a; border:0.5px solid rgba(255,255,255,0.12); border-radius:6px; width:100%; max-width:880px; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; font-family:var(--font-mono,monospace); }
.cu-head { display:flex; align-items:center; gap:14px; padding:16px 22px; border-bottom:0.5px solid rgba(255,255,255,0.08); background:#0c0c0c; }
.cu-eyebrow { color:#d4b87a; font-size:10px; letter-spacing:0.15em; }
.cu-title { font-size:20px; color:#fff; margin-top:2px; }
.cu-title em { color:#d4b87a; font-style:italic; }
.cu-head-right { margin-left:auto; display:flex; align-items:center; gap:18px; }
.cu-stat { text-align:right; }
.cu-stat .l { color:#666; font-size:9px; letter-spacing:0.12em; }
.cu-stat .v { font-size:13px; margin-top:2px; color:#d4d4d4; }
.cu-stat .v.gold { color:#d4b87a; font-weight:600; }
.cu-x { border:0.5px solid rgba(255,255,255,0.15); color:#888; width:26px; height:26px; border-radius:3px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; }
.cu-body { flex:1; overflow-y:auto; padding:20px 22px; }
.cu-sec { font-size:12px; letter-spacing:0.12em; color:#888; text-transform:uppercase; margin:18px 0 10px; }
.cu-sec:first-child { margin-top:0; }
.cu-sec .c { color:#666; margin-left:auto; font-size:10px; }
.cu-sec-row { display:flex; align-items:baseline; }
.cu-name { width:100%; background:transparent; border:none; border-bottom:1px solid rgba(212,184,122,0.35); color:#fff; font-size:20px; font-weight:600; outline:none; padding:4px 0; font-family:inherit; }
.cu-name::placeholder { color:#444; font-style:italic; }
.cu-hint { font-size:10px; color:#666; margin-top:6px; font-style:italic; }
.cu-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.cu-slot { background:#121212; border:0.5px dashed rgba(255,255,255,0.14); border-radius:4px; min-height:96px; padding:12px; cursor:pointer; display:flex; flex-direction:column; }
.cu-slot.empty { align-items:center; justify-content:center; color:#555; font-size:11px; letter-spacing:0.08em; }
.cu-slot.filled { border-style:solid; cursor:default; }
.cu-slot .sn { font-size:9px; letter-spacing:0.12em; color:#555; display:flex; justify-content:space-between; }
.cu-slot .sx { color:#777; cursor:pointer; }
.cu-slot .st { font-size:13px; font-weight:600; color:#fff; margin-top:6px; }
.cu-slot .sm { font-size:11px; color:#888; margin-top:2px; }
.cu-slot .sc { color:#d4b87a; font-size:12px; font-weight:600; margin-top:auto; }
.cu-pick { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin-top:10px; }
.cu-opt { background:#141414; border:0.5px solid rgba(255,255,255,0.12); border-radius:3px; padding:10px 12px; cursor:pointer; }
.cu-opt:hover { border-color:rgba(212,184,122,0.4); }
.cu-opt .on { font-size:13px; font-weight:600; color:#fff; display:flex; justify-content:space-between; }
.cu-opt .om { font-size:10px; color:#888; margin-top:4px; }
.cu-sum { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; background:#0f0f0f; border:0.5px solid rgba(212,184,122,0.2); border-radius:4px; padding:16px 18px; }
.cu-sum .l { font-size:9px; color:#666; letter-spacing:0.12em; }
.cu-sum .v { font-size:20px; font-weight:600; color:#fff; margin-top:4px; }
.cu-sum .v.gold { color:#d4b87a; }
.cu-sum .v.warn { color:#c47a7a; }
.cu-sum .s { font-size:10px; color:#888; margin-top:3px; }
.cu-foot { display:flex; align-items:center; gap:16px; padding:14px 22px; border-top:0.5px solid rgba(255,255,255,0.08); background:#0d0d0d; }
.cu-foot .fm { font-size:10px; letter-spacing:0.08em; color:#666; }
.cu-foot .fm .gold { color:#d4b87a; font-weight:600; }
.cu-foot .fm .warn { color:#c47a7a; font-weight:600; }
.cu-foot .fm .ok { color:#9eb87a; font-weight:600; }
.cu-acts { margin-left:auto; display:flex; gap:8px; }
.cu-btn { padding:9px 18px; font-size:11px; letter-spacing:0.06em; border-radius:3px; cursor:pointer; font-family:inherit; }
.cu-btn.sec { border:0.5px solid rgba(255,255,255,0.15); color:#888; background:transparent; }
.cu-btn.pri { background:#3a2f1a; border:0.5px solid #d4b87a; color:#d4b87a; font-weight:600; }
.cu-btn.pri.off { opacity:0.4; pointer-events:none; }
.oob-unit { background:#101010; border:0.5px solid rgba(255,255,255,0.08); border-left:2px solid #555; border-radius:4px; padding:12px 16px; margin-bottom:8px; font-family:var(--font-mono,monospace); }
.oob-unit.forming { border-left-color:#d4a23a; }
.oob-unit.active { border-left-color:#7a9aab; }
.oob-top { display:flex; align-items:center; gap:12px; cursor:pointer; }
.oob-name { font-size:14px; font-weight:600; color:#fff; }
.oob-sub { font-size:10px; color:#888; letter-spacing:0.06em; }
.oob-pill { font-size:9px; font-weight:700; letter-spacing:0.1em; padding:3px 8px; border-radius:2px; text-transform:uppercase; }
.oob-pill.forming { color:#d4a23a; background:rgba(212,162,58,0.12); }
.oob-pill.active { color:#9eb87a; background:rgba(158,184,122,0.12); }
.oob-brigs { margin-top:8px; padding-top:8px; border-top:0.5px solid rgba(255,255,255,0.06); display:none; }
.oob-brigs.open { display:block; }
.oob-brig { font-size:11px; color:#aaa; padding:3px 0; display:flex; gap:10px; }
.oob-empty { font-size:11px; color:#666; font-style:italic; padding:8px 2px; }
`;

function ensureStyles() {
  if (document.getElementById('cu-styles')) return;
  const s = document.createElement('style');
  s.id = 'cu-styles';
  s.textContent = CU_CSS;
  document.head.appendChild(s);
}

// Shared fetch: this faction's non-decommissioned units + the
// nation's active defense discretionary balance (raw dollars).
async function loadUnitsAndFunds(faction) {
  let units = [], funds = 0;
  try {
    const { data: u, error: uErr } = await _supabase
      .from('army_units')
      .select('id,name,brigades,total_manpower,status,forming_until_tick')
      .eq('faction_id', faction.id)
      .neq('status', 'Decommissioned')
      .order('created_at', { ascending: true });
    if (uErr) console.warn('[create-unit] units load failed:', uErr.message);
    else units = u || [];

    const { data: m, error: mErr } = await _supabase
      .from('ministries')
      .select('discretionary_balance')
      .eq('nation_id', faction.nation_id)
      .eq('ministry_key', 'defense')
      .eq('is_active', true)
      .maybeSingle();
    if (mErr) console.warn('[create-unit] defense funds load failed:', mErr.message);
    funds = Number(m?.discretionary_balance) || 0;
  } catch (e) {
    console.warn('[create-unit] load failed:', e?.message || e);
  }
  return { units, funds };
}

function poolOf(faction) {
  return Math.max(0, Math.round(Number(faction?.army_manpower) || 0));
}
function committedOf(units) {
  return units.reduce((s, u) => s + (Number(u.total_manpower) || 0), 0);
}

// ── ACTION: Create Unit modal ──────────────────────────────────────
// faction needs { id, nation_id, army_manpower }. onCreated() (optional)
// fires after a successful commission.
export function openCreateUnitModal(faction, onCreated) {
  if (!faction?.id) return;
  ensureStyles();

  let overlay = document.getElementById('cu-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cu-overlay';
    overlay.className = 'cu-overlay';
    document.body.appendChild(overlay);
  }

  let brigades = [], picking = false, creating = false, units = [], funds = 0;
  const available = () => poolOf(faction) - committedOf(units);

  function close() {
    overlay.style.display = 'none';
    overlay.innerHTML = '';
    overlay.onclick = null;
  }

  function shell() {
    overlay.innerHTML = `<div class="cu-modal">
      <div class="cu-head">
        <div>
          <div class="cu-eyebrow">— ARMY ACTION —</div>
          <div class="cu-title">Create <em>Unit</em></div>
        </div>
        <div class="cu-head-right">
          <div class="cu-stat"><div class="l">ACTION COST</div><div class="v gold">${auMoney(AU_FEE)}</div></div>
          <div class="cu-stat"><div class="l">ARMY FUNDS</div><div class="v">${auMoney(funds)}</div></div>
          <div class="cu-x" data-cu="close">×</div>
        </div>
      </div>
      <div class="cu-body">
        <div class="cu-sec">I. Unit Designation</div>
        <input class="cu-name" id="cu-name" maxlength="80" placeholder="e.g. 4th Mechanized Division" />
        <div class="cu-hint">Names are public — they appear on the Order of Battle and in records.</div>
        <div id="cu-dyn"></div>
      </div>
    </div>`;
    renderBody();
  }

  function renderBody() {
    const host = overlay.querySelector('#cu-dyn');
    if (!host) return;
    const mp = brigades.reduce((s, k) => s + (AU_BRIGADES[k]?.mp || 0), 0);
    const cost = brigades.reduce((s, k) => s + (AU_BRIGADES[k]?.cost || 0), 0);
    const outlay = cost + AU_FEE;
    const avail = available();
    const enoughMp = mp <= avail;
    const enoughFunds = outlay <= funds;
    const hasBrig = brigades.length >= 1;
    const canCreate = hasBrig && enoughMp && enoughFunds;

    let slots = '';
    for (let i = 0; i < 6; i++) {
      const k = brigades[i];
      if (k) {
        const sp = AU_BRIGADES[k];
        slots += `<div class="cu-slot filled" style="border-color:rgba(212,184,122,0.35);background:#161412;">
          <div class="sn"><span>SLOT ${i + 1}</span><span class="sx" data-cu="rm:${i}">×</span></div>
          <div class="st">${escapeHtml(sp.name)}</div>
          <div class="sm">${sp.mp.toLocaleString()} manpower</div>
          <div class="sc">${auMoney(sp.cost)}</div>
        </div>`;
      } else if (brigades.length === i) {
        slots += `<div class="cu-slot empty" data-cu="addslot"><div style="font-size:20px;color:#444;">+</div><div>SLOT ${i + 1}${i === 5 ? ' — OPTIONAL' : ' — ADD BRIGADE'}</div></div>`;
      } else {
        slots += `<div class="cu-slot empty" style="opacity:0.35;cursor:default;"><div>SLOT ${i + 1}</div></div>`;
      }
    }
    let picker = '';
    if (picking && brigades.length < 6) {
      picker = '<div class="cu-pick">' + AU_ORDER.map(k => {
        const sp = AU_BRIGADES[k];
        return `<div class="cu-opt" data-cu="pick:${k}">
          <div class="on"><span>${escapeHtml(sp.name)}</span><span style="color:#d4b87a;">${auMoney(sp.cost)}</span></div>
          <div class="om">${sp.mp.toLocaleString()} manpower${k === 'support' ? ' · HQ / logistics / medical' : ''}</div>
        </div>`;
      }).join('') + '</div>';
    }

    host.innerHTML = `
      <div class="cu-sec-row"><span class="cu-sec">II. Brigade Composition</span><span class="cu-sec c">${brigades.length} OF 6 SLOTS FILLED</span></div>
      <div class="cu-grid">${slots}</div>
      ${picker}
      <div class="cu-sec">III. Unit Summary</div>
      <div class="cu-sum">
        <div><div class="l">TOTAL MANPOWER</div><div class="v ${enoughMp ? '' : 'warn'}">${mp.toLocaleString()}</div><div class="s">${avail.toLocaleString()} available</div></div>
        <div><div class="l">CONSTRUCTION</div><div class="v gold">${auMoney(cost)}</div><div class="s">+ ${auMoney(AU_FEE)} action fee</div></div>
        <div><div class="l">TOTAL OUTLAY</div><div class="v ${enoughFunds ? 'gold' : 'warn'}">${auMoney(outlay)}</div><div class="s">of ${auMoney(funds)} available</div></div>
      </div>
      <div class="cu-foot" style="margin:18px -22px -20px;">
        <div class="fm">STATUS: <span class="${hasBrig ? 'gold' : 'warn'}">${hasBrig ? 'READY TO COMMISSION' : 'ADD AT LEAST ONE BRIGADE'}</span></div>
        <div class="fm">MANPOWER: <span class="${enoughMp ? 'ok' : 'warn'}">${enoughMp ? 'SUFFICIENT' : 'INSUFFICIENT'}</span></div>
        <div class="cu-acts">
          <div class="cu-btn sec" data-cu="cancel">CANCEL</div>
          <div class="cu-btn pri ${canCreate ? '' : 'off'}" data-cu="create">CREATE UNIT — ${auMoney(outlay)} →</div>
        </div>
      </div>`;
  }

  async function submit() {
    if (creating) return;
    const name = (overlay.querySelector('#cu-name')?.value || '').trim();
    if (!name) { alert('Enter a unit name.'); return; }
    if (brigades.length < 1) { alert('Add at least one brigade.'); return; }
    creating = true;
    try {
      const { data, error } = await _supabase.rpc('create_unit', {
        p_faction_id: faction.id,
        p_name: name,
        p_brigades: brigades,
      });
      if (error) { alert('Failed to create unit: ' + error.message); return; }
      if (data && data.success === false) { alert(data.error || 'Could not create unit.'); return; }
      close();
      alert(`${name} commissioned — Forming, ready in 2 ticks.`);
      if (typeof onCreated === 'function') onCreated();
    } finally {
      creating = false;
    }
  }

  overlay.onclick = (e) => {
    const el = e.target.closest('[data-cu]');
    if (!el) { if (e.target === overlay) close(); return; }
    const a = el.getAttribute('data-cu');
    if (a === 'close' || a === 'cancel') return close();
    if (a === 'addslot') { picking = true; return renderBody(); }
    if (a.startsWith('pick:')) {
      if (brigades.length < 6) brigades.push(a.slice(5));
      picking = false; return renderBody();
    }
    if (a.startsWith('rm:')) { brigades.splice(Number(a.slice(3)), 1); return renderBody(); }
    if (a === 'create') return submit();
  };

  overlay.style.display = 'flex';
  overlay.innerHTML = '<div class="cu-modal"><div class="cu-body"><div class="cu-sec">Loading…</div></div></div>';
  loadUnitsAndFunds(faction).then(r => { units = r.units; funds = r.funds; shell(); });
}

// ── DISPLAY: Order of Battle ───────────────────────────────────────
// Renders a Force-Composition summary + the unit list into hostEl.
// `shard` supplies current_tick for the Forming countdown.
export async function renderOrderOfBattle(faction, shard, hostEl) {
  if (!hostEl) return;
  ensureStyles();
  const expanded = new Set();
  const tick = () => Number(shard?.current_tick) || 0;
  let units = [], funds = 0;

  function initials(name) {
    const w = String(name || '?').trim().split(/\s+/).filter(Boolean);
    return ((w[0]?.[0] || '?') + (w[1]?.[0] || '')).toUpperCase();
  }

  function draw() {
    const pool = poolOf(faction);
    const committed = committedOf(units);
    const brigCount = units.reduce((s, u) => s + (Array.isArray(u.brigades) ? u.brigades.length : 0), 0);

    let html = `<div class="cu-sum" style="margin-bottom:16px;">
      <div><div class="l">PERSONNEL</div><div class="v">${committed.toLocaleString()}</div><div class="s">committed of ${pool.toLocaleString()}</div></div>
      <div><div class="l">ORDER OF BATTLE</div><div class="v">${brigCount}</div><div class="s">${units.length} unit${units.length === 1 ? '' : 's'} · brigades</div></div>
      <div><div class="l">DEFENSE BUDGET</div><div class="v gold">${auMoney(funds)}</div><div class="s">discretionary</div></div>
    </div>`;

    if (units.length === 0) {
      html += '<div class="oob-empty">No units yet. Use the Chief of Staff’s Create Unit action to commission your first formation.</div>';
      hostEl.innerHTML = html;
      return;
    }

    const t = tick();
    html += '<div class="cu-sec">Regular Army</div>';
    for (const u of units) {
      const brigs = Array.isArray(u.brigades) ? u.brigades : [];
      const forming = u.status === 'Forming';
      const left = Math.max(0, (Number(u.forming_until_tick) || 0) - t);
      const open = expanded.has(u.id);
      const composition = AU_ORDER
        .filter(k => brigs.includes(k))
        .map(k => `${brigs.filter(x => x === k).length}× ${AU_BRIGADES[k].name}`)
        .join(' · ') || '—';
      const pill = forming
        ? `<span class="oob-pill forming">Forming · Ready in ${left} tick${left === 1 ? '' : 's'}</span>`
        : `<span class="oob-pill active">Active</span>`;
      html += `<div class="oob-unit ${forming ? 'forming' : 'active'}">
        <div class="oob-top" data-uid="${escapeAttr(u.id)}">
          <span class="oob-pill" style="background:#222;color:#bbb;">${escapeHtml(initials(u.name))}</span>
          <div style="flex:1;">
            <div class="oob-name">${escapeHtml(u.name)}</div>
            <div class="oob-sub">${brigs.length} BRIGADE${brigs.length === 1 ? '' : 'S'} · ${(Number(u.total_manpower) || 0).toLocaleString()} PERSONNEL</div>
          </div>
          ${pill}
          <span style="color:#666;">${open ? '▾' : '▸'}</span>
        </div>
        <div class="oob-brigs ${open ? 'open' : ''}">
          <div class="oob-sub" style="margin-bottom:4px;">${escapeHtml(composition)}</div>
          ${brigs.map((k, i) => {
            const sp = AU_BRIGADES[k];
            return `<div class="oob-brig"><span style="color:#666;">${i + 1}/${brigs.length}</span><span style="color:#fff;">${sp ? escapeHtml(sp.name) : escapeHtml(k)}</span><span>${sp ? sp.mp.toLocaleString() : '0'} manpower</span></div>`;
          }).join('')}
        </div>
      </div>`;
    }
    hostEl.innerHTML = html;
  }

  hostEl.onclick = (e) => {
    const top = e.target.closest('[data-uid]');
    if (!top) return;
    const id = top.getAttribute('data-uid');
    if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
    draw();
  };

  hostEl.innerHTML = '<div class="oob-empty">Loading order of battle…</div>';
  const r = await loadUnitsAndFunds(faction);
  units = r.units; funds = r.funds;
  draw();
}
