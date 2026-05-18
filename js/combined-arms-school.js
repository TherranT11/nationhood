// ─── Establish Combined Arms School — Quartermaster action ─────────
//
// Self-contained confirmation modal (own overlay + injected styles +
// own data fetch), mirroring js/foreign-officer-exchange.js. Posts a
// construction contract via the post_combined_arms_school RPC — the
// SINGLE authority for cost ($55 from party_funds), the immediate
// −2,000 manpower, the 24-tick cooldown and the contract row. The
// spec shown here is read from combined_arms_school_spec() (the same
// SSoT the RPC and the tick processor use) and never trusted.

import { _supabase } from './supabase-client.js';
import { escapeHtml } from './utils.js';

const CAS_COOLDOWN = 24;

function casMoney(raw) {
  return '$' + ((Number(raw) || 0) / 1e6).toFixed(1).replace(/\.0$/, '');
}

const CAS_CSS = `
.cas-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); z-index:600; display:flex; align-items:center; justify-content:center; padding:30px; }
.cas-modal { background:#0a0a0a; border:0.5px solid rgba(182,83,63,0.3); border-radius:6px; width:100%; max-width:620px; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; font-family:var(--font-mono,monospace); }
.cas-head { display:flex; align-items:center; gap:14px; padding:16px 22px; border-bottom:0.5px solid rgba(255,255,255,0.08); background:linear-gradient(180deg,rgba(182,83,63,0.06),#0c0c0c); }
.cas-eyebrow { color:#b6533f; font-size:10px; letter-spacing:0.15em; }
.cas-title { font-size:20px; color:#fff; margin-top:2px; }
.cas-title em { color:#b6533f; font-style:italic; }
.cas-head-right { margin-left:auto; display:flex; align-items:center; gap:18px; }
.cas-stat { text-align:right; }
.cas-stat .l { color:#666; font-size:9px; letter-spacing:0.12em; }
.cas-stat .v { font-size:13px; margin-top:2px; color:#d4d4d4; }
.cas-stat .v.army { color:#b6533f; font-weight:600; }
.cas-x { border:0.5px solid rgba(255,255,255,0.15); color:#888; width:26px; height:26px; border-radius:3px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; }
.cas-body { flex:1; overflow-y:auto; padding:18px 22px; }
.cas-desc { font-size:13px; line-height:1.65; color:#bdbdb4; }
.cas-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:16px; }
.cas-cell { background:#121012; border:0.5px solid rgba(182,83,63,0.18); border-radius:3px; padding:10px 12px; }
.cas-cell .k { font-size:9px; color:#9a7166; letter-spacing:0.1em; text-transform:uppercase; }
.cas-cell .v { font-size:15px; font-weight:600; color:#fff; margin-top:3px; }
.cas-cell .v.warn { color:#c47a7a; }
.cas-note { margin-top:14px; font-size:11px; color:#7a7a72; line-height:1.6; }
.cas-foot { display:flex; align-items:center; gap:14px; padding:14px 22px; border-top:0.5px solid rgba(255,255,255,0.08); background:#0d0d0d; }
.cas-foot .fm { font-size:10px; letter-spacing:0.06em; color:#888; }
.cas-foot .fm.warn { color:#c47a7a; }
.cas-acts { margin-left:auto; display:flex; gap:8px; }
.cas-btn { padding:9px 18px; font-size:11px; letter-spacing:0.06em; border-radius:3px; cursor:pointer; font-family:inherit; }
.cas-btn.sec { border:0.5px solid rgba(255,255,255,0.15); color:#888; background:transparent; }
.cas-btn.pri { background:#2a1715; border:0.5px solid #b6533f; color:#e8c0b6; font-weight:600; }
.cas-btn.pri.off { opacity:0.4; pointer-events:none; }
`;

function ensureStyles() {
  if (document.getElementById('cas-styles')) return;
  const s = document.createElement('style');
  s.id = 'cas-styles';
  s.textContent = CAS_CSS;
  document.head.appendChild(s);
}

// Self-fetch: army funds + manpower + cooldown tick, the shard tick,
// and the spec. Never rejects (safe defaults + console.warn).
async function loadContext(faction) {
  let funds = 0, manpower = 0, lastTick = null, currentTick = 0, spec = null;
  try {
    const { data: f, error: fErr } = await _supabase
      .from('factions')
      .select('party_funds, army_manpower, last_combined_arms_school_tick')
      .eq('id', faction.id)
      .maybeSingle();
    if (fErr) console.warn('[cas] faction load failed:', fErr.message);
    if (f) {
      funds = Number(f.party_funds) || 0;
      manpower = Number(f.army_manpower) || 0;
      lastTick = (f.last_combined_arms_school_tick == null) ? null : Number(f.last_combined_arms_school_tick);
    }
    const { data: s, error: sErr } = await _supabase
      .from('shard').select('current_tick').eq('name', 'Alpha Shard').maybeSingle();
    if (sErr) console.warn('[cas] shard load failed:', sErr.message);
    currentTick = Number(s?.current_tick) || 0;

    const { data: sp, error: spErr } = await _supabase.rpc('combined_arms_school_spec');
    if (spErr) console.warn('[cas] spec load failed:', spErr.message);
    spec = sp || null;
  } catch (e) {
    console.warn('[cas] context load failed:', e?.message || e);
  }
  return { funds, manpower, lastTick, currentTick, spec };
}

export function openCombinedArmsSchoolModal(faction) {
  if (!faction?.id) return;
  ensureStyles();

  let overlay = document.getElementById('cas-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cas-overlay';
    overlay.className = 'cas-overlay';
    document.body.appendChild(overlay);
  }

  let submitting = false;

  function close() {
    overlay.style.display = 'none';
    overlay.innerHTML = '';
    overlay.onclick = null;
  }

  function shell(ctx) {
    const spec = ctx.spec || {};
    const budget = Number(spec.budget) || 55000000;
    const timeline = Number(spec.timeline) || 36;
    const mpCost = Number(spec.manpower_cost) || 2000;
    const upkeep = Number(spec.upkeep_per_tick) || 2;
    const effects = Array.isArray(spec.stat_effects) ? spec.stat_effects : [];
    const effectsText = effects.map(e => {
      const sign = Number(e.delta) >= 0 ? '+' : '';
      return `${sign}${e.delta} ${String(e.stat).replace(/^army_/, '').replace(/_/g, ' ')}`;
    }).join(' · ') || '+6 professionalism · +4 officer corps';

    const cdLeft = (ctx.lastTick != null)
      ? Math.max(0, (ctx.lastTick + CAS_COOLDOWN) - ctx.currentTick) : 0;
    const onCooldown = cdLeft > 0;
    const poor = ctx.funds < budget;
    const blocked = onCooldown || poor;

    overlay.innerHTML = `<div class="cas-modal">
      <div class="cas-head">
        <div>
          <div class="cas-eyebrow">— ARMY ACTION · QUARTERMASTER —</div>
          <div class="cas-title">Establish <em>Combined Arms School</em></div>
        </div>
        <div class="cas-head-right">
          <div class="cas-stat"><div class="l">COST</div><div class="v army">${casMoney(budget)}</div></div>
          <div class="cas-stat"><div class="l">ARMY FUNDS</div><div class="v">${casMoney(ctx.funds)}</div></div>
          <div class="cas-x" data-cas="close">×</div>
        </div>
      </div>
      <div class="cas-body">
        <div class="cas-desc">Stand up a national staff college teaching combined arms doctrine, joint operations, and modern warfare. Curriculum draws from foreign manuals and recent conflicts. Frees officers from line duties for 16-week intensive courses. A construction corporation must bid on and build it.</div>
        <div class="cas-grid">
          <div class="cas-cell"><div class="k">Construction Budget</div><div class="v">${casMoney(budget)}</div></div>
          <div class="cas-cell"><div class="k">Build Time</div><div class="v">~${timeline} months</div></div>
          <div class="cas-cell"><div class="k">Manpower Removed Now</div><div class="v warn">−${mpCost.toLocaleString()}</div></div>
          <div class="cas-cell"><div class="k">On Completion</div><div class="v">${escapeHtml(effectsText)}</div></div>
        </div>
        <div class="cas-note">Current manpower: <b>${ctx.manpower.toLocaleString()}</b> → <b>${Math.max(0, ctx.manpower - mpCost).toLocaleString()}</b> (removed immediately, even though the build takes ~${timeline} months). Once built, the school costs the nation <b>$${upkeep}/tick</b> forever under National Infrastructure. ${CAS_COOLDOWN}-tick cooldown. The $${(budget/1e6)} is paid up front and is what corporations bid on — it is not refunded if no corp ever builds it.</div>
      </div>
      <div class="cas-foot">
        <div class="fm${blocked ? ' warn' : ''}" id="cas-msg">${
          onCooldown ? `On cooldown — ready in ${cdLeft} tick${cdLeft === 1 ? '' : 's'}.`
          : poor ? `Insufficient Army Funds (${casMoney(budget)} required).`
          : 'This posts the contract and removes manpower immediately.'
        }</div>
        <div class="cas-acts">
          <div class="cas-btn sec" data-cas="cancel">CANCEL</div>
          <div class="cas-btn pri${blocked ? ' off' : ''}" id="cas-go" data-cas="go">ESTABLISH — ${casMoney(budget)} →</div>
        </div>
      </div>
    </div>`;

    overlay.onclick = (e) => {
      const el = e.target.closest('[data-cas]');
      if (!el) { if (e.target === overlay) close(); return; }
      const a = el.getAttribute('data-cas');
      if (a === 'close' || a === 'cancel') return close();
      if (a === 'go') { if (!blocked) return submit(); }
    };
  }

  async function submit() {
    if (submitting) return;
    submitting = true;
    try {
      const { data, error } = await _supabase.rpc('post_combined_arms_school', {
        p_faction_id: faction.id,
      });
      if (error) { alert('Could not establish the school: ' + error.message); return; }
      if (data && data.success === false) {
        if (data.error === 'cooldown') {
          alert('Recently used. Available again at tick ' + (Number(data.ready_at_tick) || 0)
            + ` (${CAS_COOLDOWN}-tick cooldown).`);
        } else {
          alert(data.error || 'Could not establish the school.');
        }
        return;
      }
      close();
      alert(`Combined Arms School commissioned for ${data?.nation || 'the nation'}.\n`
        + `${Number(data?.manpower_removed) || 0} manpower removed now. Construction corporations can now bid; `
        + `on completion: +6 Professionalism, +4 Officer Corps.`);
    } finally {
      submitting = false;
    }
  }

  overlay.style.display = 'flex';
  overlay.innerHTML = '<div class="cas-modal"><div class="cas-body"><div class="cas-desc">Loading…</div></div></div>';
  loadContext(faction).then(shell);
}
