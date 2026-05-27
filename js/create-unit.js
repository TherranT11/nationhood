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
import { escapeHtml, escapeAttr, tickToDate } from './utils.js';
import { unitUpkeepPerTick } from './game/military-units.js';

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

// Army (formation) types — single source for the Create Army modal +
// the Order of Battle group headers. Upkeep deltas are authoritative in
// the create_army RPC / unitUpkeepPerTick; the equipment & training
// lines are recorded doctrine, inert until those systems exist.
export const ARMY_TYPES = {
  regular:      { label: 'Regular Army', short: 'Regular',      desc: 'Standard formation. No upkeep change; standard equipment and training.' },
  guard:        { label: 'Guard',        short: 'Guard',        desc: '+$1 upkeep per unit. Always receives the latest equipment when available.' },
  paramilitary: { label: 'Paramilitary', short: 'Paramilitary', desc: '−$1 upkeep per unit (floored at $1). Training capped at 70. Receives the lowest-quality equipment.' },
};
export const ARMY_TYPE_ORDER = ['regular','guard','paramilitary'];

// Brigade composition as a display string ("2× Infantry · 1× Armor").
// Single source — the Order of Battle cards and the Create Army unit
// picker both read it.
export function auComposition(brigades) {
  const brigs = Array.isArray(brigades) ? brigades : [];
  return AU_ORDER
    .filter(k => brigs.includes(k))
    .map(k => `${brigs.filter(x => x === k).length}× ${AU_BRIGADES[k].name}`)
    .join(' · ') || '—';
}

export function auMoney(raw) {
  // Whole millions render as "$2" / "$12"; a fractional balance keeps
  // one decimal ("$28.4"). No "M" suffix.
  return '$' + ((Number(raw) || 0) / 1e6).toFixed(1).replace(/\.0$/, '');
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
.cu-sum { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:20px; background:#0f0f0f; border:0.5px solid rgba(212,184,122,0.2); border-radius:4px; padding:16px 18px; }
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
.oob-army-type { font-size:9px; font-weight:700; letter-spacing:0.1em; padding:2px 7px; border-radius:2px; text-transform:uppercase; margin-left:8px; }
.oob-army-type.guard { color:#d4b87a; background:rgba(212,184,122,0.14); }
.oob-army-type.paramilitary { color:#9a9a9a; background:rgba(160,160,160,0.12); }
.oob-army-type.regular { color:#7a9aab; background:rgba(122,154,171,0.12); }
.ca-row { display:flex; align-items:center; gap:12px; background:#121212; border:0.5px solid rgba(255,255,255,0.1); border-radius:4px; padding:10px 12px; margin-bottom:6px; cursor:pointer; }
.ca-row.sel { border-color:rgba(212,184,122,0.5); background:#161412; }
.ca-check { width:16px; height:16px; border-radius:3px; border:0.5px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; color:#d4b87a; font-size:11px; flex:0 0 auto; }
.ca-row.sel .ca-check { border-color:#d4b87a; }
.ca-row .un { font-size:13px; font-weight:600; color:#fff; }
.ca-row .us { font-size:10px; color:#888; margin-top:2px; }
.ca-type { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:10px; }
.ca-typeopt { background:#141414; border:0.5px solid rgba(255,255,255,0.12); border-radius:4px; padding:10px 12px; cursor:pointer; }
.ca-typeopt.sel { border-color:#d4b87a; background:#161412; }
.ca-typeopt .tn { font-size:13px; font-weight:600; color:#fff; }
.ca-typeopt .td { font-size:10px; color:#888; margin-top:4px; line-height:1.4; }
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
export async function loadUnitsAndFunds(faction) {
  let units = [], funds = 0, armies = [];
  try {
    const { data: u, error: uErr } = await _supabase
      .from('army_units')
      .select('id,name,brigades,total_manpower,status,forming_until_tick,construction_cost,army_id')
      .eq('faction_id', faction.id)
      .neq('status', 'Decommissioned')
      .order('created_at', { ascending: true });
    if (uErr) console.warn('[create-unit] units load failed:', uErr.message);
    else units = u || [];

    const { data: a, error: aErr } = await _supabase
      .from('armies')
      .select('id,name,army_type,created_at_tick,assigned_front_id')
      .eq('faction_id', faction.id)
      .order('created_at_tick', { ascending: true });
    if (aErr) console.warn('[create-unit] armies load failed:', aErr.message);
    else armies = a || [];

    // The army faction's own treasury — the single pot that
    // allocate_defense_funds fills and create_unit charges.
    const { data: f, error: fErr } = await _supabase
      .from('factions')
      .select('party_funds')
      .eq('id', faction.id)
      .maybeSingle();
    if (fErr) console.warn('[create-unit] army funds load failed:', fErr.message);
    funds = Number(f?.party_funds) || 0;
  } catch (e) {
    console.warn('[create-unit] load failed:', e?.message || e);
  }
  return { units, funds, armies };
}

// Rifles actually equipped to this army's brigades, by unit. Returns
// { byUnit: Map<unitId, rows[]>, armed } where armed = Σ qty × soldiers_per_rifle
// (the manpower actually armed, vs. on-hand capacity).
export async function loadBrigadeEquipment(unitIds) {
  const out = { byUnit: new Map(), armed: 0 };
  if (!unitIds || !unitIds.length) return out;
  try {
    const { data, error } = await _supabase
      .from('army_brigade_equipment')
      .select('army_unit_id, brigade_index, quantity, rifle_model_id, rifle_models(name, soldiers_per_rifle)')
      .in('army_unit_id', unitIds);
    if (error) { console.warn('[create-unit] brigade equipment load failed:', error.message); return out; }
    for (const e of (data || [])) {
      if (!out.byUnit.has(e.army_unit_id)) out.byUnit.set(e.army_unit_id, []);
      out.byUnit.get(e.army_unit_id).push(e);
      out.armed += (Number(e.quantity) || 0) * (Number(e.rifle_models?.soldiers_per_rifle) || 0);
    }
  } catch (e) {
    console.warn('[create-unit] brigade equipment load failed:', e?.message || e);
  }
  return out;
}

// On-hand rifles a faction can still allocate (qty > 0), with model name.
async function loadOnHandRifles(factionId) {
  if (!factionId) return [];
  try {
    const { data, error } = await _supabase
      .from('army_rifle_inventory')
      .select('rifle_model_id, quantity, rifle_models(name)')
      .eq('faction_id', factionId)
      .gt('quantity', 0);
    if (error) { console.warn('[create-unit] on-hand rifles load failed:', error.message); return []; }
    return data || [];
  } catch (e) {
    console.warn('[create-unit] on-hand rifles load failed:', e?.message || e);
    return [];
  }
}

// Rifles a brigade needs: 1 rifle arms up to 1,000 soldiers.
function riflesNeeded(brigadeKey) {
  const mp = AU_BRIGADES[brigadeKey]?.mp || 0;
  return Math.ceil(mp / 1000);
}

function poolOf(faction) {
  return Math.max(0, Math.round(Number(faction?.army_manpower) || 0));
}
export function committedOf(units) {
  return units.reduce((s, u) => s + (Number(u.total_manpower) || 0), 0);
}
export function brigadeCountOf(units) {
  return units.reduce((s, u) => s + (Array.isArray(u.brigades) ? u.brigades.length : 0), 0);
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

// ── ACTION: Create Army modal ──────────────────────────────────────
// Forms existing (non-decommissioned, unassigned) units into a named
// formation. faction needs { id }. onCreated() (optional) fires after
// a successful creation. Equipment Status is intentionally absent —
// per-unit equipment isn't modelled yet (deferred with procurement).
export function openCreateArmyModal(faction, onCreated) {
  if (!faction?.id) return;
  ensureStyles();

  let overlay = document.getElementById('ca-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ca-overlay';
    overlay.className = 'cu-overlay';
    document.body.appendChild(overlay);
  }

  let units = [], funds = 0, type = 'regular', creating = false;
  const selected = new Set();
  // Only unassigned, non-decommissioned units can be formed into an army.
  const assignable = () => units.filter(u => !u.army_id);

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
          <div class="cu-title">Create <em>Army</em></div>
        </div>
        <div class="cu-head-right">
          <div class="cu-stat"><div class="l">ACTION COST</div><div class="v gold">${auMoney(AU_FEE)}</div></div>
          <div class="cu-stat"><div class="l">ARMY FUNDS</div><div class="v">${auMoney(funds)}</div></div>
          <div class="cu-x" data-ca="close">×</div>
        </div>
      </div>
      <div class="cu-body">
        <div class="cu-sec">I. Army Designation</div>
        <input class="cu-name" id="ca-name" maxlength="80" placeholder="e.g. 1st Army of Avelia" />
        <div class="cu-hint">Take units within your faction and form them into a cohesive fighting force. Names are public.</div>
        <div id="ca-dyn"></div>
      </div>
    </div>`;
    renderBody();
  }

  function renderBody() {
    const host = overlay.querySelector('#ca-dyn');
    if (!host) return;
    const pool = assignable();
    const enoughFunds = AU_FEE <= funds;
    const hasUnits = selected.size >= 1;
    const canCreate = hasUnits && enoughFunds;

    const typeHtml = ARMY_TYPE_ORDER.map(k => {
      const t = ARMY_TYPES[k];
      return `<div class="ca-typeopt ${type === k ? 'sel' : ''}" data-ca="type:${k}">
        <div class="tn">${escapeHtml(t.label)}</div>
        <div class="td">${escapeHtml(t.desc)}</div>
      </div>`;
    }).join('');

    const unitsHtml = pool.length
      ? pool.map(u => {
          const sel = selected.has(u.id);
          const brigs = Array.isArray(u.brigades) ? u.brigades : [];
          const tag = u.status === 'Forming' ? ' · Forming' : '';
          return `<div class="ca-row ${sel ? 'sel' : ''}" data-ca="unit:${escapeAttr(u.id)}">
            <div class="ca-check">${sel ? '✓' : ''}</div>
            <div style="flex:1;min-width:0;">
              <div class="un">${escapeHtml(u.name)}</div>
              <div class="us">${brigs.length} BRIGADE${brigs.length === 1 ? '' : 'S'} · ${(Number(u.total_manpower) || 0).toLocaleString()} PERSONNEL · ${escapeHtml(auComposition(u.brigades))}${tag}</div>
            </div>
          </div>`;
        }).join('')
      : `<div class="oob-empty">No unassigned units. Commission units with Create Unit first, or they’re all already in an army.</div>`;

    host.innerHTML = `
      <div class="cu-sec">II. Type</div>
      <div class="ca-type">${typeHtml}</div>
      <div class="cu-sec-row"><span class="cu-sec">III. Assigned Units</span><span class="cu-sec c">${selected.size} SELECTED</span></div>
      ${unitsHtml}
      <div class="cu-foot" style="margin:18px -22px -20px;">
        <div class="fm">STATUS: <span class="${hasUnits ? 'gold' : 'warn'}">${hasUnits ? 'READY TO FORM' : 'SELECT AT LEAST ONE UNIT'}</span></div>
        <div class="fm">FUNDS: <span class="${enoughFunds ? 'ok' : 'warn'}">${enoughFunds ? 'SUFFICIENT' : 'INSUFFICIENT'}</span></div>
        <div class="cu-acts">
          <div class="cu-btn sec" data-ca="cancel">CANCEL</div>
          <div class="cu-btn pri ${canCreate ? '' : 'off'}" data-ca="create">CREATE ARMY — ${auMoney(AU_FEE)} →</div>
        </div>
      </div>`;
  }

  async function submit() {
    if (creating) return;
    const name = (overlay.querySelector('#ca-name')?.value || '').trim();
    if (!name) { alert('Enter an army name.'); return; }
    if (selected.size < 1) { alert('Select at least one unit.'); return; }
    creating = true;
    try {
      const { data, error } = await _supabase.rpc('create_army', {
        p_faction_id: faction.id,
        p_name: name,
        p_type: type,
        p_unit_ids: [...selected],
      });
      if (error) { alert('Failed to create army: ' + error.message); return; }
      if (data && data.success === false) { alert(data.error || 'Could not create army.'); return; }
      close();
      alert(`${name} formed — ${selected.size} unit${selected.size === 1 ? '' : 's'} assigned.`);
      if (typeof onCreated === 'function') onCreated();
    } finally {
      creating = false;
    }
  }

  overlay.onclick = (e) => {
    const el = e.target.closest('[data-ca]');
    if (!el) { if (e.target === overlay) close(); return; }
    const a = el.getAttribute('data-ca');
    if (a === 'close' || a === 'cancel') return close();
    if (a.startsWith('type:')) { type = a.slice(5); return renderBody(); }
    if (a.startsWith('unit:')) {
      const id = a.slice(5);
      if (selected.has(id)) selected.delete(id); else selected.add(id);
      return renderBody();
    }
    if (a === 'create') return submit();
  };

  overlay.style.display = 'flex';
  overlay.innerHTML = '<div class="cu-modal"><div class="cu-body"><div class="cu-sec">Loading…</div></div></div>';
  loadUnitsAndFunds(faction).then(r => { units = r.units; funds = r.funds; shell(); });
}

// Deployment label for a front from the viewer's nation's POV:
// "{neighbour name} Front {label}". neighbour(id) → {name,...}|null.
// One source for both the assign modal and the Order of Battle.
function frontDeployLabel(front, myNationId, neighbour) {
  const neigh = front.nation_a_id === myNationId ? front.nation_b_id : front.nation_a_id;
  const n = neighbour(neigh);
  return `${(n && n.name) || 'Border'} Front ${front.label}`;
}

// Resolve a nation's flag: profile flag → nations.flag_url → conventional asset path.
function nationFlagUrl(n) {
  if (!n) return '';
  const pf = Array.isArray(n.nation_profiles) ? n.nation_profiles[0]?.flag_url : n.nation_profiles?.flag_url;
  return pf || n.flag_url || `assets/flags/${n.name}.png`;
}

// ── ACTION: Assign Army to a land front ($1) ───────────────────────
// Pick one of the faction's named armies, then a land front bordering its
// nation. assign_army_to_front charges $1 from the army treasury. Re-assignable.
export function openAssignArmyModal(faction, onAssigned) {
  if (!faction?.id) return;
  ensureStyles();
  let overlay = document.getElementById('asn-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'asn-overlay'; overlay.className = 'cu-overlay';
    document.body.appendChild(overlay);
  }
  const FEE = 1000000;
  let armies = [], fronts = [], neighborById = new Map(), unitsOnFront = new Map(), funds = 0;
  let selArmy = null, selFront = null, busy = false;

  const close = () => { overlay.style.display = 'none'; overlay.innerHTML = ''; overlay.onclick = null; };
  const frontLabel = (f) => frontDeployLabel(f, faction.nation_id, (id) => neighborById.get(id));

  function render() {
    const enough = funds >= FEE;
    const armiesHtml = armies.length
      ? armies.map(a => {
          const cur = a.assigned_front_id ? fronts.find(f => f.id === a.assigned_front_id) : null;
          const sel = selArmy === a.id;
          return `<div class="ca-row ${sel ? 'sel' : ''}" data-asn="army:${escapeAttr(a.id)}">
            <div class="ca-check">${sel ? '✓' : ''}</div>
            <div style="flex:1;min-width:0;"><div class="un">${escapeHtml(a.name)}</div>
            <div class="us">${escapeHtml((ARMY_TYPES[a.army_type] && ARMY_TYPES[a.army_type].short) || a.army_type)} · Currently: ${escapeHtml(cur ? frontLabel(cur) : 'Unassigned')}</div></div>
          </div>`;
        }).join('')
      : `<div class="oob-empty">No armies yet. Use Create Army to form one first.</div>`;

    const frontsHtml = fronts.length
      ? fronts.map(f => {
          const sel = selFront === f.id;
          const neigh = neighborById.get(f.nation_a_id === faction.nation_id ? f.nation_b_id : f.nation_a_id);
          const flag = nationFlagUrl(neigh);
          const nm = (neigh && neigh.name) || 'Border';
          const onFront = unitsOnFront.get(f.id) || 0;
          return `<div class="ca-row ${sel ? 'sel' : ''}" data-asn="front:${escapeAttr(f.id)}">
            <div class="ca-check">${sel ? '✓' : ''}</div>
            ${flag ? `<img src="${escapeAttr(flag)}" alt="" style="width:26px;height:18px;object-fit:cover;border-radius:2px;flex:none;" onerror="this.style.display='none'">` : ''}
            <div style="flex:1;min-width:0;"><div class="un">${escapeHtml(nm)} Front ${escapeHtml(f.label)}</div>
            <div class="us">${onFront} unit${onFront === 1 ? '' : 's'} deployed · ${Number(f.sector_count) || 0} sectors</div></div>
          </div>`;
        }).join('')
      : `<div class="oob-empty">No land fronts border your nation yet.</div>`;

    const canAssign = !!selArmy && !!selFront && enough && !busy;
    overlay.innerHTML = `<div class="cu-modal">
      <div class="cu-head">
        <div><div class="cu-eyebrow">— ARMY ACTION —</div><div class="cu-title">Assign Army to <em>Theater</em></div></div>
        <div class="cu-head-right">
          <div class="cu-stat"><div class="l">ACTION COST</div><div class="v gold">${auMoney(FEE)}</div></div>
          <div class="cu-stat"><div class="l">ARMY FUNDS</div><div class="v">${auMoney(funds)}</div></div>
          <div class="cu-x" data-asn="close">×</div>
        </div>
      </div>
      <div class="cu-body">
        <div class="cu-sec-row"><span class="cu-sec">I. Army</span><span class="cu-sec c">${selArmy ? '1' : '0'} SELECTED</span></div>
        ${armiesHtml}
        <div class="cu-sec-row" style="margin-top:14px;"><span class="cu-sec">II. Front</span><span class="cu-sec c">${selFront ? '1' : '0'} SELECTED</span></div>
        ${frontsHtml}
        <div class="asn-err" id="asn-err" hidden style="margin-top:10px;font-family:var(--font-mono,monospace);font-size:11px;color:#c47a7a;"></div>
        <div class="cu-foot" style="margin:18px -22px -20px;">
          <div class="fm">FUNDS: <span class="${enough ? 'ok' : 'warn'}">${enough ? 'SUFFICIENT' : 'INSUFFICIENT'}</span></div>
          <div class="cu-acts">
            <div class="cu-btn sec" data-asn="cancel">CANCEL</div>
            <div class="cu-btn pri ${canAssign ? '' : 'off'}" data-asn="assign">ASSIGN — ${auMoney(FEE)} →</div>
          </div>
        </div>
      </div>`;
  }

  overlay.onclick = async (e) => {
    if (e.target === overlay) { if (!busy) close(); return; }
    const el = e.target.closest('[data-asn]');
    if (!el) return;
    const v = el.getAttribute('data-asn');
    if (v === 'close' || v === 'cancel') { if (!busy) close(); return; }
    if (v.startsWith('army:'))  { if (!busy) { selArmy = v.slice(5);  render(); } return; }
    if (v.startsWith('front:')) { if (!busy) { selFront = v.slice(6); render(); } return; }
    if (v === 'assign') {
      if (!selArmy || !selFront || funds < FEE || busy) return;
      busy = true; render();
      try {
        const { data, error } = await _supabase.rpc('assign_army_to_front', { p_army_id: selArmy, p_front_id: selFront });
        if (error || (data && data.success === false)) {
          busy = false; render();
          const er = document.getElementById('asn-err');
          if (er) { er.textContent = (data && data.error) || error?.message || 'Assignment failed.'; er.hidden = false; }
        } else {
          close();
          if (typeof onAssigned === 'function') onAssigned();
        }
      } catch (ex) {
        busy = false; render();
        const er = document.getElementById('asn-err');
        if (er) { er.textContent = ex?.message || 'Assignment failed.'; er.hidden = false; }
      }
    }
  };

  overlay.style.display = 'flex';
  overlay.innerHTML = '<div class="cu-modal"><div class="cu-body"><div class="cu-sec">Loading…</div></div></div>';
  (async () => {
    const [aRes, fRes, uRes, facRes] = await Promise.all([
      _supabase.from('armies').select('id, name, army_type, assigned_front_id')
        .eq('faction_id', faction.id).order('created_at_tick', { ascending: true }),
      _supabase.from('war_fronts').select('id, label, nation_a_id, nation_b_id, sector_count')
        .eq('front_type', 'land')
        .or(`nation_a_id.eq.${faction.nation_id},nation_b_id.eq.${faction.nation_id}`),
      _supabase.from('army_units').select('army_id').eq('faction_id', faction.id).neq('status', 'Decommissioned'),
      _supabase.from('factions').select('party_funds').eq('id', faction.id).maybeSingle(),
    ]);
    if (aRes.error) console.warn('[assign-army] armies load:', aRes.error.message);
    if (fRes.error) console.warn('[assign-army] fronts load:', fRes.error.message);
    armies = aRes.data || [];
    fronts = fRes.data || [];
    funds = Number(facRes.data?.party_funds) || 0;
    // Units deployed per front: a unit sits on the front its army is assigned to.
    const armyToFront = new Map(armies.map(a => [a.id, a.assigned_front_id]));
    for (const u of (uRes.data || [])) {
      const fId = armyToFront.get(u.army_id);
      if (fId) unitsOnFront.set(fId, (unitsOnFront.get(fId) || 0) + 1);
    }
    const neighborIds = [...new Set(fronts.map(f => f.nation_a_id === faction.nation_id ? f.nation_b_id : f.nation_a_id))];
    if (neighborIds.length) {
      const { data: nats } = await _supabase.from('nations').select('id, name, flag_url, nation_profiles(flag_url)').in('id', neighborIds);
      for (const n of (nats || [])) neighborById.set(n.id, n);
    }
    fronts.sort((x, y) => frontLabel(x).localeCompare(frontLabel(y)));
    render();
  })();
}

// armyId → deployment label ("Avelian Front A"), for the Order of Battle.
// Isolated from loadUnitsAndFunds so a fronts/nations fetch hiccup can't break
// the core OOB render — it just drops the label.
async function loadArmyFronts(faction, armies) {
  const map = {};
  const frontIds = [...new Set((armies || []).map(a => a.assigned_front_id).filter(Boolean))];
  if (!frontIds.length) return map;
  try {
    const { data: fr } = await _supabase.from('war_fronts')
      .select('id, label, nation_a_id, nation_b_id').in('id', frontIds);
    const fronts = fr || [];
    const fById = {}; for (const f of fronts) fById[f.id] = f;
    const neighborIds = [...new Set(fronts.map(f => f.nation_a_id === faction.nation_id ? f.nation_b_id : f.nation_a_id))];
    const nById = {};
    if (neighborIds.length) {
      const { data: nats } = await _supabase.from('nations').select('id, name').in('id', neighborIds);
      for (const n of (nats || [])) nById[n.id] = n;
    }
    for (const a of (armies || [])) {
      const f = a.assigned_front_id && fById[a.assigned_front_id];
      if (!f) continue;
      map[a.id] = frontDeployLabel(f, faction.nation_id, (id) => nById[id]);
    }
  } catch (e) {
    console.warn('[create-unit] army fronts load failed:', e?.message || e);
  }
  return map;
}

// ── DISPLAY: Order of Battle ───────────────────────────────────────
// Renders a Force-Composition summary + the unit list into hostEl.
export async function renderOrderOfBattle(faction, hostEl) {
  if (!hostEl) return;
  ensureStyles();
  const expanded = new Set();
  let units = [], funds = 0, armies = [], equip = { byUnit: new Map(), armed: 0 }, armyFronts = {};

  function initials(name) {
    const w = String(name || '?').trim().split(/\s+/).filter(Boolean);
    return ((w[0]?.[0] || '?') + (w[1]?.[0] || '')).toUpperCase();
  }

  function draw() {
    const pool = poolOf(faction);
    const committed = committedOf(units);
    const brigCount = brigadeCountOf(units);
    // Armed = manpower covered by rifles actually equipped to brigades (capped
    // at committed for safety). Pump-proof: only real assignments count.
    const armed = Math.min(equip.armed, committed);

    let html = `<div class="cu-sum" style="margin-bottom:16px;">
      <div><div class="l">PERSONNEL</div><div class="v">${committed.toLocaleString()}</div><div class="s">committed of ${pool.toLocaleString()}</div></div>
      <div><div class="l">EQUIPPED</div><div class="v${committed > 0 && armed < committed ? ' warn' : ''}">${armed.toLocaleString()}</div><div class="s">armed of ${committed.toLocaleString()} · rifles</div></div>
      <div><div class="l">ORDER OF BATTLE</div><div class="v">${brigCount}</div><div class="s">${units.length} unit${units.length === 1 ? '' : 's'} · brigades</div></div>
      <div><div class="l">DEFENSE BUDGET</div><div class="v gold">${auMoney(funds)}</div><div class="s">discretionary</div></div>
    </div>`;

    if (units.length === 0) {
      html += '<div class="oob-empty">No units yet. Use the Chief of Staff’s Create Unit action to commission your first formation.</div>';
      hostEl.innerHTML = html;
      return;
    }

    // Group: one section per army (each carries ≥1 unit; the army's type
    // drives both the header label and each unit's upkeep modifier), then
    // "Reserves" last for unassigned units.
    // A unit shows under "Reserves" if it's unassigned OR its army didn't
    // load (transient fetch error / orphan) — never vanishes.
    const knownArmies = new Set(armies.map(a => a.id));
    const regular = units.filter(u => !u.army_id || !knownArmies.has(u.army_id));
    const byArmy = new Map();
    for (const u of units) {
      if (!u.army_id || !knownArmies.has(u.army_id)) continue;
      if (!byArmy.has(u.army_id)) byArmy.set(u.army_id, []);
      byArmy.get(u.army_id).push(u);
    }

    for (const a of armies) {
      const list = byArmy.get(a.id) || [];
      if (!list.length) continue;
      const t = ARMY_TYPES[a.army_type];
      html += `<div class="cu-sec-row"><span class="cu-sec">${escapeHtml(a.name)}</span>`
            + `<span class="oob-army-type ${escapeAttr(a.army_type)}">${escapeHtml(t ? t.short : a.army_type)}</span>`
            + (armyFronts[a.id] ? `<span class="cu-sec c" style="color:#c89e6e;">▸ ${escapeHtml(armyFronts[a.id])}</span>` : '')
            + `<span class="cu-sec c">${list.length} unit${list.length === 1 ? '' : 's'}</span></div>`;
      for (const u of list) html += unitCardHtml(u, a.army_type);
    }
    // Reserves last — units not assigned to any army.
    if (regular.length) {
      html += '<div class="cu-sec">Reserves</div>';
      for (const u of regular) html += unitCardHtml(u, null);
    }
    hostEl.innerHTML = html;
  }

  function unitCardHtml(u, armyType) {
    const brigs = Array.isArray(u.brigades) ? u.brigades : [];
    const forming = u.status === 'Forming';
    const open = expanded.has(u.id);
    const eqByIdx = new Map((equip.byUnit.get(u.id) || []).map(e => [e.brigade_index, Number(e.quantity) || 0]));
    const composition = auComposition(brigs);
    const pill = forming
      ? `<span class="oob-pill forming">Forming · Ready in ${tickToDate(Number(u.forming_until_tick))}</span>`
      : `<span class="oob-pill active" style="color:#46c46a;">[Active]</span><span class="oob-upkeep" style="color:#e5534b;font-weight:600;margin-left:6px;">(-$${unitUpkeepPerTick(u.construction_cost, armyType)})</span>`;
    return `<div class="oob-unit ${forming ? 'forming' : 'active'}">
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
            const need = riflesNeeded(k);
            const got = eqByIdx.get(i) || 0;
            const armedTag = need > 0
              ? `<span style="color:${got >= need ? '#46c46a' : got > 0 ? '#c8a832' : '#888'};">${got}/${need} rifles</span>`
              : '';
            return `<div class="oob-brig"><span style="color:#666;">${i + 1}/${brigs.length}</span><span style="color:#fff;">${sp ? escapeHtml(sp.name) : escapeHtml(k)}</span><span>${sp ? sp.mp.toLocaleString() : '0'} manpower</span>${armedTag}</div>`;
          }).join('')}
          <button class="oob-equip" data-equip-uid="${escapeAttr(u.id)}" style="margin-top:8px;font-family:var(--font-mono,monospace);font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:7px 14px;border-radius:3px;cursor:pointer;background:rgba(182,83,63,0.14);border:1px solid var(--army,#b6533f);color:#e0a090;">Equip</button>
        </div>
      </div>`;
  }

  // Re-read equipment (after an equip/unequip) and redraw — keeps the open
  // unit expanded.
  const reloadEquip = async () => {
    equip = await loadBrigadeEquipment(units.map(u => u.id));
    draw();
  };

  hostEl.onclick = (e) => {
    const equipBtn = e.target.closest('[data-equip-uid]');
    if (equipBtn) {
      e.stopPropagation();
      const u = units.find(x => x.id === equipBtn.getAttribute('data-equip-uid'));
      if (u) openEquipModal(u, faction, reloadEquip);
      return;
    }
    const top = e.target.closest('[data-uid]');
    if (!top) return;
    const id = top.getAttribute('data-uid');
    if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
    draw();
  };

  hostEl.innerHTML = '<div class="oob-empty">Loading order of battle…</div>';
  const r = await loadUnitsAndFunds(faction);
  units = r.units; funds = r.funds; armies = r.armies || [];
  equip = await loadBrigadeEquipment(units.map(u => u.id));
  armyFronts = await loadArmyFronts(faction, armies);
  draw();
}

// Inject equip-modal styles once (kept out of the big ensureStyles block).
function ensureEquipStyles() {
  if (document.getElementById('eq-modal-styles')) return;
  const s = document.createElement('style');
  s.id = 'eq-modal-styles';
  s.textContent = `
    .eq-list{display:flex;flex-direction:column;gap:8px;margin-top:12px;}
    .eq-row{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:12px;padding:10px 12px;background:#0f0f0f;border:0.5px solid rgba(255,255,255,0.08);border-radius:5px;}
    .eq-row .eq-name{font-size:13px;font-weight:600;color:#fff;}
    .eq-row .eq-mp{font-family:var(--font-mono,monospace);font-size:10px;color:#888;margin-top:2px;}
    .eq-count{font-family:var(--font-mono,monospace);font-size:13px;font-weight:700;color:#888;}
    .eq-count.part{color:#c8a832;} .eq-count.full{color:#46c46a;}
    .eq-ctl{display:flex;align-items:center;gap:6px;}
    .eq-model{background:#1a1a17;border:0.5px solid rgba(255,255,255,0.15);border-radius:3px;color:#f0efe6;font-family:var(--font-mono,monospace);font-size:11px;padding:5px 7px;max-width:200px;}
    .eq-btn{font-family:var(--font-mono,monospace);font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;padding:6px 11px;border-radius:3px;cursor:pointer;border:1px solid;}
    .eq-btn.equip{background:rgba(182,83,63,0.16);border-color:var(--army,#b6533f);color:#e0a090;}
    .eq-btn.unequip{background:none;border-color:rgba(255,255,255,0.18);color:#aaa;}
    .eq-btn:disabled{opacity:0.5;cursor:default;}
    .eq-done{font-family:var(--font-mono,monospace);font-size:11px;color:#46c46a;}
    .eq-none{font-family:var(--font-mono,monospace);font-size:10px;color:#888;font-style:italic;}
    .eq-err{margin-top:10px;font-family:var(--font-mono,monospace);font-size:11px;color:#c47a7a;background:rgba(196,122,122,0.1);border:0.5px solid rgba(196,122,122,0.3);border-radius:3px;padding:8px 11px;}
  `;
  document.head.appendChild(s);
}

// ── ACTION: Equip Brigade modal ────────────────────────────────────
// Per-brigade rifle assignment for a unit. One model per brigade; equipping
// pulls from on-hand inventory, unequipping returns it. onChange() refreshes the
// Order of Battle after each change. Listeners are assigned (not addEventListener)
// so re-rendering after an action can't stack handlers; a busy flag + the
// server's FOR UPDATE guard double-fire.
export function openEquipModal(unit, faction, onChange) {
  if (!unit?.id || !faction?.id) return;
  ensureStyles();
  ensureEquipStyles();
  let overlay = document.getElementById('eq-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'eq-overlay';
    overlay.className = 'cu-overlay';
    document.body.appendChild(overlay);
  }
  const brigs = Array.isArray(unit.brigades) ? unit.brigades : [];
  let onHand = [];
  let eqByIdx = new Map();
  let busy = false;

  const close = () => { overlay.style.display = 'none'; overlay.innerHTML = ''; overlay.onclick = null; };

  async function reload() {
    const [oh, eq] = await Promise.all([
      loadOnHandRifles(faction.id),
      loadBrigadeEquipment([unit.id]),
    ]);
    onHand = oh;
    eqByIdx = new Map((eq.byUnit.get(unit.id) || []).map(e => [e.brigade_index, e]));
    render();
    if (typeof onChange === 'function') onChange();
  }

  function render() {
    const rows = brigs.map((k, i) => {
      const sp = AU_BRIGADES[k];
      const name = sp ? sp.name : k;
      const mp = sp ? sp.mp : 0;
      const need = riflesNeeded(k);
      const cur = eqByIdx.get(i);
      const got = cur ? Number(cur.quantity) || 0 : 0;
      const curModel = cur ? cur.rifle_model_id : null;
      const full = need > 0 && got >= need;
      const remaining = Math.max(0, need - got);
      // Models available: locked to the brigade's current model if partly
      // equipped, else any on-hand model with stock.
      const options = onHand.filter(o => (Number(o.quantity) || 0) > 0 && (!curModel || o.rifle_model_id === curModel));

      let control;
      if (full) {
        control = `<span class="eq-done">✓ ${escapeHtml(cur?.rifle_models?.name || 'Equipped')}</span>`;
      } else if (!options.length) {
        control = `<span class="eq-none">${curModel ? 'No more on hand' : 'No rifles on hand'}</span>`;
      } else {
        control = `<select class="eq-model" data-idx="${i}">${options.map(o =>
            `<option value="${escapeAttr(o.rifle_model_id)}">${escapeHtml(o.rifle_models?.name || 'Rifle')} · ${Number(o.quantity).toLocaleString()} on hand</option>`).join('')}</select>`
          + `<button class="eq-btn equip" data-equip-idx="${i}" data-remaining="${remaining}">Equip</button>`;
      }
      const unequip = got > 0 ? `<button class="eq-btn unequip" data-unequip-idx="${i}">Unequip</button>` : '';

      return `<div class="eq-row">
          <div class="eq-brig"><div class="eq-name">${escapeHtml(name)}</div><div class="eq-mp">${mp.toLocaleString()} manpower</div></div>
          <div class="eq-count ${full ? 'full' : got > 0 ? 'part' : ''}">${got} / ${need}</div>
          <div class="eq-ctl">${control}${unequip}</div>
        </div>`;
    }).join('');

    overlay.innerHTML = `<div class="cu-modal" style="max-width:580px;">
      <div class="cu-head">
        <div><div class="cu-eyebrow">— ARMY ACTION —</div><div class="cu-title">Equip <em>${escapeHtml(unit.name)}</em></div></div>
        <div class="cu-head-right"><div class="cu-x" data-eq="close">×</div></div>
      </div>
      <div class="cu-body">
        <div class="cu-hint">One rifle arms up to 1,000 soldiers · one model per brigade. Rifles come from your on-hand inventory.</div>
        <div class="eq-list">${rows || '<div class="oob-empty">This unit has no brigades.</div>'}</div>
        <div class="eq-err" id="eq-err" hidden></div>
      </div>
    </div>`;
  }

  overlay.onclick = async (e) => {
    if (e.target === overlay || e.target.closest('[data-eq="close"]')) { if (!busy) close(); return; }
    const equipBtn = e.target.closest('[data-equip-idx]');
    const unequipBtn = e.target.closest('[data-unequip-idx]');
    if ((!equipBtn && !unequipBtn) || busy) return;
    const errEl = document.getElementById('eq-err');
    busy = true;
    overlay.querySelectorAll('.eq-btn').forEach(b => { b.disabled = true; });
    if (errEl) { errEl.hidden = true; errEl.textContent = ''; }
    try {
      let data, error;
      if (equipBtn) {
        const idx = Number(equipBtn.dataset.equipIdx);
        const remaining = Number(equipBtn.dataset.remaining) || 1;
        const modelId = overlay.querySelector(`.eq-model[data-idx="${idx}"]`)?.value;
        const onHandQty = Number(onHand.find(o => o.rifle_model_id === modelId)?.quantity) || 0;
        const qty = Math.max(1, Math.min(remaining, onHandQty));
        if (!modelId || onHandQty < 1) { busy = false; overlay.querySelectorAll('.eq-btn').forEach(b => { b.disabled = false; }); return; }
        ({ data, error } = await _supabase.rpc('equip_brigade', {
          p_unit_id: unit.id, p_brigade_index: idx, p_rifle_model_id: modelId, p_quantity: qty,
        }));
      } else {
        ({ data, error } = await _supabase.rpc('unequip_brigade', {
          p_unit_id: unit.id, p_brigade_index: Number(unequipBtn.dataset.unequipIdx),
        }));
      }
      if (error || (data && data.ok === false)) {
        if (errEl) { errEl.textContent = (data && data.error) || error?.message || 'Action failed.'; errEl.hidden = false; }
        busy = false;
        overlay.querySelectorAll('.eq-btn').forEach(b => { b.disabled = false; });
      } else {
        busy = false;
        await reload();   // fresh render (buttons recreated) + OOB refresh
      }
    } catch (ex) {
      if (errEl) { errEl.textContent = ex?.message || 'Action failed.'; errEl.hidden = false; }
      busy = false;
      overlay.querySelectorAll('.eq-btn').forEach(b => { b.disabled = false; });
    }
  };

  overlay.style.display = 'flex';
  overlay.innerHTML = '<div class="cu-modal"><div class="cu-body"><div class="cu-sec">Loading…</div></div></div>';
  reload();
}
