// ─── Politician shared topbar ──────────────────────────────────────
// Single source for the politician top navigation, used by every politician
// page (home + movements, more to come). Mirrors entrepreneur-topbar.js
// one-for-one — same patterns for styles, switcher, countdown, bootstrap —
// just teal where entrepreneur uses green.
import { _supabase } from './supabase-client.js';
import { APP_VERSION, hfFmtBig } from './utils.js';
import { isFactionInactive, isHiddenFromSwitcher, getFactionTypeBadge, getFactionDashboardUrl } from './game/factions.js';

const POL_TABS = [
  { id: 'home',      label: 'HOME',      href: 'politician-home.html' },
  { id: 'movements', label: 'MOVEMENTS', href: 'politician-movements.html' },
];

const START_AGE = 25;
const TICKS_PER_AGE_YEAR = 12;

const STYLE_ID = 'pol-topbar-styles';
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
  body { background:#050505; color:#d4d4d4; font-family:-apple-system,system-ui,sans-serif; margin:0; min-height:100vh; }
  .pol-topbar { display:flex; align-items:center; gap:24px; padding:12px 28px;
    border-bottom:0.5px solid rgba(255,255,255,0.08); font-size:11px; letter-spacing:0.05em; }
  .pol-topbar .brand { display:flex; align-items:center; gap:10px; }
  .pol-topbar .crest { width:24px; height:24px; background:rgba(90,175,165,0.08); border:0.5px solid rgba(90,175,165,0.5);
    border-radius:3px; display:flex; align-items:center; justify-content:center; color:#5aafa5;
    font-size:11px; font-weight:600; letter-spacing:0.05em; }
  .pol-topbar .player { color:#fff; font-weight:500; font-size:13px; }
  .pol-topbar__version { font-family:monospace; font-size:10px; color:#f0efe6; letter-spacing:0.5px; opacity:0.8; }
  .pol-topbar .meta { display:flex; gap:22px; color:#888; align-items:center; }
  .pol-topbar .meta .label { color:#555; font-size:9px; letter-spacing:0.13em; }
  .pol-topbar .meta .value { color:#d4d4d4; font-size:12px; margin-top:2px; display:flex; align-items:center; gap:6px; }
  .pol-topbar .meta .flag { width:18px; height:12px; object-fit:cover; border:0.5px solid rgba(255,255,255,0.1); }
  .pol-topbar .right { margin-left:auto; display:flex; align-items:center; gap:14px; position:relative; }
  .pol-topbar .cash-pill { border:0.5px solid rgba(90,175,165,0.5); padding:6px 12px; border-radius:3px; font-size:11px; }
  .pol-topbar .cash-pill .label { color:#888; }
  .pol-topbar .cash-pill .value { color:#5aafa5; font-weight:500; }
  .pol-switcher { position:relative; display:inline-block; }
  .pol-pill { border:0.5px solid rgba(255,255,255,0.15); padding:6px 12px; border-radius:3px;
    font-size:11px; color:#5aafa5; cursor:pointer; white-space:nowrap; }
  .pol-dd { position:absolute; right:0; top:calc(100% + 8px); background:#0f0f0f;
    border:0.5px solid rgba(255,255,255,0.15); border-radius:4px; min-width:240px; max-width:340px;
    display:none; z-index:100; overflow:hidden; }
  .pol-dd.open { display:block; }
  .pol-dd-item { display:flex; align-items:center; gap:10px; padding:10px 14px; font-size:11px;
    color:#d4d4d4; cursor:pointer; border-bottom:0.5px solid rgba(255,255,255,0.06); }
  .pol-dd-item:last-child { border-bottom:none; }
  .pol-dd-item:hover { background:#1a1a17; }
  .pol-dd-badge { font-size:9px; letter-spacing:0.06em; min-width:40px; }
  .pol-dd-name { flex:1; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .pol-dd-empty { padding:10px; color:#666; font-size:10px; }
  .pol-util { color:#666; font-size:11px; cursor:pointer; }
  .pol-util:hover { color:#d4d4d4; }
  .pol-nav { display:flex; gap:32px; padding:0 28px; border-bottom:0.5px solid rgba(255,255,255,0.08);
    font-size:11px; letter-spacing:0.08em; }
  .pol-nav a { padding:14px 0; color:#888; text-decoration:none; cursor:pointer; }
  .pol-nav a:not(.active):hover { color:#d4d4d4; }
  .pol-nav a.active { color:#5aafa5; border-bottom:1px solid #5aafa5; }

  @media (max-width:700px) {
    .pol-topbar { flex-wrap:wrap; row-gap:8px; gap:10px; padding:10px 12px; }
    .pol-topbar .brand { flex:1 1 auto; min-width:0; }
    .pol-topbar .player { font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .pol-topbar .meta { order:99; width:100%; gap:14px; border-top:0.5px solid rgba(255,255,255,0.06); padding-top:8px; }
    .pol-topbar .meta .label { font-size:8px; }
    .pol-topbar .meta .value { font-size:11px; }
    .pol-topbar .right { margin-left:auto; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
    .pol-topbar .cash-pill, .pol-pill { font-size:10px; padding:4px 8px; }
    .pol-util { font-size:10px; }
    .pol-dd { min-width:200px; max-width:calc(100vw - 24px); }
    .pol-nav { padding:0 12px; gap:18px; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  }`;
  document.head.appendChild(s);
}

function esc(v) { const d = document.createElement('div'); d.textContent = v == null ? '' : String(v); return d.innerHTML; }
function escAttr(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;'); }

function flagFor(n) {
  if (!n) return '';
  return (n.nation_profiles && n.nation_profiles.flag_url) || n.flag_url || `assets/flags/${n.name}.png`;
}

function currentAge(faction, currentTick) {
  if (!faction || faction.founded_tick == null) return START_AGE;
  const elapsed = Math.max(0, (currentTick || 0) - Number(faction.founded_tick));
  return START_AGE + Math.floor(elapsed / TICKS_PER_AGE_YEAR);
}

let _polCountdownTimer = null;
function startCountdown(nextTickAt) {
  const el = document.getElementById('pol-next-tick');
  if (!el || !nextTickAt) return;
  const target = new Date(nextTickAt).getTime();
  const tick = () => {
    const diff = Math.max(0, target - Date.now());
    el.textContent = `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m ${Math.floor((diff % 60000) / 1000)}s`;
  };
  tick();
  if (_polCountdownTimer) clearInterval(_polCountdownTimer);
  _polCountdownTimer = setInterval(tick, 1000);
}

function buildSwitcher(facs) {
  const dd = document.getElementById('pol-dd');
  if (!dd) return;
  if (!facs.length) {
    dd.innerHTML = '<div class="pol-dd-empty">No other factions.</div>';
    return;
  }
  dd.innerHTML = facs.map(f => {
    const { label, color } = getFactionTypeBadge(f.faction_type);
    return `<div class="pol-dd-item" data-id="${esc(f.id)}">
      <span class="pol-dd-badge" style="color:${color}">${esc(label)}</span>
      <span class="pol-dd-name">${esc(f.faction_name || 'Unnamed')}</span>
    </div>`;
  }).join('');
  dd.querySelectorAll('.pol-dd-item').forEach(el => {
    el.addEventListener('click', () => {
      const f = facs.find(x => x.id === el.dataset.id);
      if (!f) return;
      sessionStorage.setItem('active_faction_id', f.id);
      window.location.href = getFactionDashboardUrl(f) || 'faction-select.html';
    });
  });
}

export function renderPoliticianTopbar(container, { faction, shard, nation, allUserFactions, activeTab }) {
  if (!container) return;
  ensureStyles();
  const f = faction || {};
  const s = shard || {};
  const first = f.leader_first_name || '';
  const last  = f.leader_last_name  || '';
  const ini = (((first[0] || '') + (last[0] || '')).toUpperCase()) || '—';
  const display = (first || last) ? (first + ' ' + last).trim() : (f.faction_name || 'Politician');
  const pillLabel = last ? `${(first[0] || '').toUpperCase()}. ${last}` : (first || 'Politician');
  const cash = hfFmtBig(Number(f.party_funds) || 0);
  const age = String(currentAge(f, s.current_tick || 0));
  const nationHtml = nation
    ? `<img class="flag" src="${escAttr(flagFor(nation))}" alt="" onerror="this.style.visibility='hidden'">${esc(nation.name)}`
    : '—';

  container.innerHTML = `
    <div class="pol-topbar">
      <div class="brand">
        <div class="crest">${esc(ini)}</div>
        <span class="player">${esc(display)}</span>
        <span class="pol-topbar__version">${esc(APP_VERSION)}</span>
      </div>
      <div class="meta">
        <div><div class="label">AGE</div><div class="value">${esc(age)}</div></div>
        <div><div class="label">NATION</div><div class="value">${nationHtml}</div></div>
        <div><div class="label">GAME DATE</div><div class="value">${esc(s.current_date || '—')}</div></div>
        <div><div class="label">TICK</div><div class="value">${s.current_tick != null ? esc(s.current_tick) : '—'}</div></div>
        <div><div class="label">NEXT TICK</div><div class="value" id="pol-next-tick">—</div></div>
      </div>
      <div class="right">
        <div class="cash-pill"><span class="label">POL CASH: </span><span class="value">${esc(cash)}</span></div>
        <div class="pol-switcher">
          <span class="pol-pill" id="pol-pill" title="Switch faction">${esc(pillLabel)} &#x25BE;</span>
          <div class="pol-dd" id="pol-dd"></div>
        </div>
        <span class="pol-util" id="pol-logout">Logout</span>
      </div>
    </div>
    <nav class="pol-nav">
      ${POL_TABS.map(t => `<a class="${t.id === activeTab ? 'active' : ''}" href="${t.href}">${esc(t.label)}</a>`).join('')}
    </nav>`;

  buildSwitcher((allUserFactions || []).filter(x => !isFactionInactive(x) && !isHiddenFromSwitcher(x)));
  startCountdown(s.next_tick_at);

  const pill = document.getElementById('pol-pill');
  const dd   = document.getElementById('pol-dd');
  if (pill && dd) {
    pill.addEventListener('click', (e) => { e.stopPropagation(); dd.classList.toggle('open'); });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#pol-pill') && !e.target.closest('#pol-dd')) dd.classList.remove('open');
    });
  }
  const lo = document.getElementById('pol-logout');
  if (lo) lo.addEventListener('click', async () => {
    try { await _supabase.auth.signOut(); } catch (e) { console.warn('[politician-topbar] signOut failed:', e?.message || e); }
    window.location.href = 'login.html';
  });
}

// Auth + fetch + render the topbar into #pol-topbar-container. Returns
// { user, faction, shard, nation, allUserFactions } so the page can render
// its body off the same data. Redirects to login or character-select if the
// caller isn't an authenticated politician. Throws on hard query failure.
export async function bootstrapPolitician(activeTab) {
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return null; }

  const [facRes, shardRes] = await Promise.all([
    _supabase.from('factions')
      .select('id, faction_type, faction_name, nation_id, branch, leader_first_name, leader_last_name, founded_tick, party_funds, abandoned_at, is_banned, politician_career, politician_charisma, politician_reputation, politician_credibility')
      .or(`id.eq.${user.id},linked_user_id.eq.${user.id}`),
    _supabase.from('shard').select('current_tick, current_date, next_tick_at').eq('name', 'Alpha Shard').single(),
  ]);
  if (facRes.error)   throw facRes.error;
  if (shardRes.error) throw shardRes.error;

  const factions = facRes.data || [];
  const shard = shardRes.data || {};
  const activeId = sessionStorage.getItem('active_faction_id');
  const faction = factions.find(f => f.id === activeId && f.faction_type === 'politician' && !isFactionInactive(f))
               || factions.find(f => f.faction_type === 'politician' && !isFactionInactive(f))
               || null;

  if (!faction) {
    window.location.href = 'character-select.html';
    return null;
  }

  let nation = null;
  if (faction.nation_id) {
    try {
      const { data, error } = await _supabase.from('nations')
        .select('id, name, flag_url, nation_profiles(flag_url)')
        .eq('id', faction.nation_id).maybeSingle();
      if (!error) nation = data;
    } catch (_) { /* nation is optional flair; absence falls back to '—' */ }
  }

  const allUserFactions = factions.filter(f => f.id !== faction.id);

  const container = document.getElementById('pol-topbar-container');
  if (container) {
    renderPoliticianTopbar(container, { faction, shard, nation, allUserFactions, activeTab });
  }

  return { user, faction, shard, nation, allUserFactions };
}
