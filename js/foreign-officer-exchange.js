// ─── Foreign Officer Exchange Program — Commanding General action ──
//
// Self-contained (own overlay + injected styles + own data fetch),
// mirroring js/report-defense.js. Pick a foreign army; your Officer
// Corps + Professionalism each gain floor((their − your)/20), clamped
// at ≥0. The foreign_officer_exchange RPC is the SINGLE authority for
// cost ($12), the 24-tick cooldown, the gain math and the [0,100]
// clamp — the preview here is display-only and never trusted.

import { _supabase } from './supabase-client.js';
import { escapeHtml } from './utils.js';

const FOE_COST_RAW = 12000000; // $12 on the army /1e6 treasury scale
const FOE_COOLDOWN = 24;

function foeMoney(raw) {
  return '$' + ((Number(raw) || 0) / 1e6).toFixed(1).replace(/\.0$/, '');
}

// floor((target − you) / 20), negatives clamped to 0 — mirrors the RPC.
function foeGain(mine, theirs) {
  return Math.max(0, Math.floor(((Number(theirs) || 0) - (Number(mine) || 0)) / 20));
}

const FOE_CSS = `
.foe-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:600; display:flex; align-items:center; justify-content:center; padding:30px; }
.foe-modal { background:#0a0a0a; border:0.5px solid rgba(182,83,63,0.3); border-radius:6px; width:100%; max-width:760px; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; font-family:var(--font-mono,monospace); }
.foe-head { display:flex; align-items:center; gap:14px; padding:16px 22px; border-bottom:0.5px solid rgba(255,255,255,0.08); background:linear-gradient(180deg,rgba(182,83,63,0.06),#0c0c0c); }
.foe-eyebrow { color:#b6533f; font-size:10px; letter-spacing:0.15em; }
.foe-title { font-size:20px; color:#fff; margin-top:2px; }
.foe-title em { color:#b6533f; font-style:italic; }
.foe-head-right { margin-left:auto; display:flex; align-items:center; gap:18px; }
.foe-stat { text-align:right; }
.foe-stat .l { color:#666; font-size:9px; letter-spacing:0.12em; }
.foe-stat .v { font-size:13px; margin-top:2px; color:#d4d4d4; }
.foe-stat .v.army { color:#b6533f; font-weight:600; }
.foe-x { border:0.5px solid rgba(255,255,255,0.15); color:#888; width:26px; height:26px; border-radius:3px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; }
.foe-desc { padding:12px 22px; font-size:12px; line-height:1.6; color:#9a9a92; border-bottom:0.5px solid rgba(255,255,255,0.06); }
.foe-mine { display:flex; gap:22px; padding:11px 22px; background:#120e0d; border-bottom:0.5px solid rgba(182,83,63,0.12); font-size:11px; color:#c4c2b8; }
.foe-mine .lbl { color:#666; letter-spacing:0.1em; margin-right:6px; }
.foe-mine b { color:#fff; }
.foe-body { flex:1; overflow-y:auto; padding:8px 0; }
.foe-row { display:grid; grid-template-columns:1fr 92px 92px; gap:8px; align-items:center; padding:11px 22px; cursor:pointer; border-bottom:0.5px solid rgba(255,255,255,0.04); }
.foe-row:hover { background:rgba(182,83,63,0.05); }
.foe-row.is-sel { background:rgba(182,83,63,0.1); box-shadow:inset 3px 0 0 #b6533f; }
.foe-row .nm { font-size:13px; color:#f0efe6; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.foe-row .sub { font-size:9px; color:#666; margin-top:2px; }
.foe-row .col { text-align:right; font-size:13px; color:#d4d4d4; }
.foe-row .col .g { font-size:9px; margin-left:5px; }
.foe-row .col .g.up { color:#5cb85c; }
.foe-row .col .g.zero { color:#666; }
.foe-colhead { display:grid; grid-template-columns:1fr 92px 92px; gap:8px; padding:7px 22px; font-size:9px; letter-spacing:0.1em; color:#666; text-transform:uppercase; border-bottom:0.5px solid rgba(255,255,255,0.08); }
.foe-colhead span:not(:first-child) { text-align:right; }
.foe-empty { padding:34px 22px; text-align:center; font-size:12px; color:#666; }
.foe-foot { display:flex; align-items:center; gap:14px; padding:14px 22px; border-top:0.5px solid rgba(255,255,255,0.08); background:#0d0d0d; }
.foe-foot .fm { font-size:10px; letter-spacing:0.06em; color:#888; line-height:1.5; }
.foe-foot .fm b { color:#b6533f; }
.foe-foot .fm.warn { color:#c47a7a; }
.foe-acts { margin-left:auto; display:flex; gap:8px; }
.foe-btn { padding:9px 18px; font-size:11px; letter-spacing:0.06em; border-radius:3px; cursor:pointer; font-family:inherit; }
.foe-btn.sec { border:0.5px solid rgba(255,255,255,0.15); color:#888; background:transparent; }
.foe-btn.pri { background:#2a1715; border:0.5px solid #b6533f; color:#e8c0b6; font-weight:600; }
.foe-btn.pri.off { opacity:0.4; pointer-events:none; }
`;

function ensureStyles() {
  if (document.getElementById('foe-styles')) return;
  const s = document.createElement('style');
  s.id = 'foe-styles';
  s.textContent = FOE_CSS;
  document.head.appendChild(s);
}

// Self-fetch: my stats + funds + cooldown tick, the shard tick, and
// every active foreign army with its stats. Never rejects (safe
// defaults + console.warn), like report-defense's loader.
async function loadContext(faction) {
  let funds = 0, myOc = 0, myPr = 0, lastTick = null, currentTick = 0, targets = [];
  try {
    const { data: f, error: fErr } = await _supabase
      .from('factions')
      .select('party_funds, nation_id, army_officer_corps, army_professionalism, last_foreign_officer_exchange_tick')
      .eq('id', faction.id)
      .maybeSingle();
    if (fErr) console.warn('[foe] faction load failed:', fErr.message);
    if (f) {
      funds = Number(f.party_funds) || 0;
      myOc = Number(f.army_officer_corps) || 0;
      myPr = Number(f.army_professionalism) || 0;
      lastTick = (f.last_foreign_officer_exchange_tick == null) ? null : Number(f.last_foreign_officer_exchange_tick);
    }
    const myNationId = f?.nation_id || faction.nation_id;

    const { data: s, error: sErr } = await _supabase
      .from('shard').select('current_tick').eq('name', 'Alpha Shard').maybeSingle();
    if (sErr) console.warn('[foe] shard load failed:', sErr.message);
    currentTick = Number(s?.current_tick) || 0;

    let q = _supabase
      .from('factions')
      .select('id, nation_id, faction_name, army_officer_corps, army_professionalism, is_banned, nations(name)')
      .eq('faction_type', 'military')
      .eq('branch', 'army')
      .is('abandoned_at', null);
    if (myNationId) q = q.neq('nation_id', myNationId);
    const { data: rows, error: tErr } = await q;
    if (tErr) console.warn('[foe] targets load failed:', tErr.message);
    targets = (rows || [])
      .filter(r => !r.is_banned)
      .map(r => ({
        id: r.id,
        nation: r.nations?.name || r.faction_name || 'Unknown',
        oc: Number(r.army_officer_corps) || 0,
        pr: Number(r.army_professionalism) || 0,
      }))
      .sort((a, b) => a.nation.localeCompare(b.nation));
  } catch (e) {
    console.warn('[foe] context load failed:', e?.message || e);
  }
  return { funds, myOc, myPr, lastTick, currentTick, targets };
}

export function openForeignOfficerExchangeModal(faction) {
  if (!faction?.id) return;
  ensureStyles();

  let overlay = document.getElementById('foe-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'foe-overlay';
    overlay.className = 'foe-overlay';
    document.body.appendChild(overlay);
  }

  let submitting = false;
  let selected = null;

  function close() {
    overlay.style.display = 'none';
    overlay.innerHTML = '';
    overlay.onclick = null;
  }

  function shell(ctx) {
    const cdLeft = (ctx.lastTick != null)
      ? Math.max(0, (ctx.lastTick + FOE_COOLDOWN) - ctx.currentTick) : 0;
    const onCooldown = cdLeft > 0;
    const poor = ctx.funds < FOE_COST_RAW;

    const rows = ctx.targets.length ? ctx.targets.map(t => {
      const og = foeGain(ctx.myOc, t.oc);
      const pg = foeGain(ctx.myPr, t.pr);
      const tag = g => g > 0
        ? `<span class="g up">+${g}</span>`
        : `<span class="g zero">+0</span>`;
      return `<div class="foe-row" data-foe="pick" data-id="${escapeHtml(t.id)}">
        <div><div class="nm">${escapeHtml(t.nation)}</div><div class="sub">Foreign army</div></div>
        <div class="col">${t.oc.toLocaleString()}${tag(og)}</div>
        <div class="col">${t.pr.toLocaleString()}${tag(pg)}</div>
      </div>`;
    }).join('') : `<div class="foe-empty">No foreign armies are available to exchange with yet.</div>`;

    overlay.innerHTML = `<div class="foe-modal">
      <div class="foe-head">
        <div>
          <div class="foe-eyebrow">— ARMY ACTION · COMMANDING GENERAL —</div>
          <div class="foe-title">Foreign Officer <em>Exchange Program</em></div>
        </div>
        <div class="foe-head-right">
          <div class="foe-stat"><div class="l">COST</div><div class="v army">$12</div></div>
          <div class="foe-stat"><div class="l">ARMY FUNDS</div><div class="v">${foeMoney(ctx.funds)}</div></div>
          <div class="foe-x" data-foe="close">×</div>
        </div>
      </div>
      <div class="foe-desc">Send select officers abroad to study at foreign military academies and embed with allied units. Returning officers bring back modern doctrine, professional standards, and international networks. Each stat gains ⌊(their − yours) ÷ 20⌋ — never below 0. ${FOE_COOLDOWN}-tick cooldown.</div>
      <div class="foe-mine">
        <div><span class="lbl">YOUR OFFICER CORPS</span><b>${ctx.myOc.toLocaleString()}</b></div>
        <div><span class="lbl">YOUR PROFESSIONALISM</span><b>${ctx.myPr.toLocaleString()}</b></div>
      </div>
      <div class="foe-colhead"><span>Nation</span><span>Officer Corps</span><span>Professionalism</span></div>
      <div class="foe-body">${rows}</div>
      <div class="foe-foot">
        <div class="fm${onCooldown || poor ? ' warn' : ''}" id="foe-summary">${
          onCooldown ? `On cooldown — ready in ${cdLeft} tick${cdLeft === 1 ? '' : 's'}.`
          : poor ? 'Insufficient Army Funds ($12 required).'
          : 'Select a foreign army to preview the exchange.'
        }</div>
        <div class="foe-acts">
          <div class="foe-btn sec" data-foe="cancel">CANCEL</div>
          <div class="foe-btn pri off" id="foe-go" data-foe="go">EXCHANGE — $12 →</div>
        </div>
      </div>
    </div>`;

    const summary = overlay.querySelector('#foe-summary');
    const goBtn = overlay.querySelector('#foe-go');

    function selectTarget(id) {
      if (onCooldown || poor) return;
      selected = id;
      overlay.querySelectorAll('.foe-row').forEach(r =>
        r.classList.toggle('is-sel', r.getAttribute('data-id') === id));
      const t = ctx.targets.find(x => x.id === id);
      if (!t) return;
      const og = foeGain(ctx.myOc, t.oc);
      const pg = foeGain(ctx.myPr, t.pr);
      const newOc = Math.min(100, Math.max(0, ctx.myOc + og));
      const newPr = Math.min(100, Math.max(0, ctx.myPr + pg));
      summary.classList.remove('warn');
      summary.innerHTML = (og === 0 && pg === 0)
        ? `<b>${escapeHtml(t.nation)}</b> is not ahead of you — no stat gain, but the action still costs $12 and triggers the cooldown.`
        : `<b>${escapeHtml(t.nation)}</b> → Officer Corps ${ctx.myOc}→${newOc} (+${og}), Professionalism ${ctx.myPr}→${newPr} (+${pg}).`;
      goBtn.classList.remove('off');
    }

    overlay.onclick = (e) => {
      const el = e.target.closest('[data-foe]');
      if (!el) { if (e.target === overlay) close(); return; }
      const a = el.getAttribute('data-foe');
      if (a === 'close' || a === 'cancel') return close();
      if (a === 'pick') return selectTarget(el.getAttribute('data-id'));
      if (a === 'go') return submit();
    };
  }

  async function submit() {
    if (submitting || !selected) return;
    submitting = true;
    try {
      const { data, error } = await _supabase.rpc('foreign_officer_exchange', {
        p_faction_id: faction.id,
        p_target_faction_id: selected,
      });
      if (error) { alert('Exchange failed: ' + error.message); return; }
      if (data && data.success === false) {
        if (data.error === 'cooldown') {
          alert('Recently used. Available again at tick ' + (Number(data.ready_at_tick) || 0)
            + ` (${FOE_COOLDOWN}-tick cooldown).`);
        } else {
          alert(data.error || 'Could not run the exchange.');
        }
        return;
      }
      close();
      const og = Number(data?.officer_corps_gain) || 0;
      const pg = Number(data?.professionalism_gain) || 0;
      alert(`Officer exchange with ${data?.target_nation || 'the foreign nation'} complete.\n`
        + `Officer Corps +${og} (now ${Number(data?.new_officer_corps) || 0}), `
        + `Professionalism +${pg} (now ${Number(data?.new_professionalism) || 0}).`);
    } finally {
      submitting = false;
    }
  }

  overlay.style.display = 'flex';
  overlay.innerHTML = '<div class="foe-modal"><div class="foe-body"><div class="foe-empty">Loading foreign armies…</div></div></div>';
  loadContext(faction).then(shell);
}
