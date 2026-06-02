// ─── Entrepreneur shared topbar ────────────────────────────────────
// Single source for the entrepreneur top navigation, used by every
// entrepreneur page (home/dashboard + the Coming-Soon sections) so the
// nav is ubiquitous and full-width — same role corp-topbar.js plays for
// corp pages. NOTE: this mirrors the corp/military per-type topbar
// pattern (a deliberate "entrepreneur copy", not a cross-type shared
// extraction — that larger consolidation is tracked separately).
import { _supabase } from './supabase-client.js';
import { hfFmtBig, APP_VERSION } from './utils.js';
import { getFactionTypeBadge, getFactionDashboardUrl, getPoliticianRoleLabel, isFactionInactive, isHiddenFromSwitcher, nextPoliticianSlot, activatePoliticianSlot } from './game/factions.js';

const ENT_TABS = [
  { id: 'home',         label: 'HOME',         href: 'entrepreneur-dashboard.html' },
  { id: 'corporations', label: 'CORPORATIONS', href: 'entrepreneur-corporations.html' },
  { id: 'markets',      label: 'MARKETS',      href: 'entrepreneur-markets.html' },
  { id: 'assets',       label: 'CHARACTER',    href: 'entrepreneur-assets.html' },
  { id: 'lobbying',     label: 'LOBBYING',     href: 'entrepreneur-lobbying.html' },
];

const STYLE_ID = 'ent-topbar-styles';
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
  body { background:#050505; color:#d4d4d4; font-family:-apple-system,system-ui,sans-serif; margin:0; min-height:100vh; }
  .ent-topbar { display:flex; align-items:center; gap:24px; padding:12px 28px;
    border-bottom:0.5px solid rgba(255,255,255,0.08); font-size:11px; letter-spacing:0.05em; }
  .ent-topbar .brand { display:flex; align-items:center; gap:10px; }
  .ent-topbar .crest { width:24px; height:24px; background:#1a1f1a; border:0.5px solid #4a6a4a;
    border-radius:3px; display:flex; align-items:center; justify-content:center; color:#8aaa6a;
    font-size:11px; font-weight:600; letter-spacing:0.05em; }
  .ent-topbar .player { color:#fff; font-weight:500; font-size:13px; }
  .ent-topbar__version { font-family:var(--font-mono,monospace); font-size:10px; color:#f0efe6; letter-spacing:0.5px; opacity:0.8; }
  .ent-topbar .meta { display:flex; gap:22px; color:#888; }
  .ent-topbar .meta .label { color:#555; font-size:9px; letter-spacing:0.13em; }
  .ent-topbar .meta .value { color:#d4d4d4; font-size:12px; margin-top:2px; }
  .ent-topbar .right { margin-left:auto; display:flex; align-items:center; gap:14px; }
  .ent-topbar .cash-pill { border:0.5px solid #4a6a4a; padding:6px 12px; border-radius:3px; font-size:11px; }
  .ent-topbar .cash-pill .label { color:#888; }
  .ent-topbar .cash-pill .value { color:#8aaa6a; font-weight:500; }
  .ent-switcher { position:relative; display:inline-block; }
  .ent-pill { border:0.5px solid rgba(255,255,255,0.15); padding:6px 12px; border-radius:3px;
    font-size:11px; color:#8aaa6a; cursor:pointer; white-space:nowrap; }
  .ent-dd { position:absolute; right:0; top:calc(100% + 8px); background:#0f0f0f;
    border:0.5px solid rgba(255,255,255,0.15); border-radius:4px; min-width:240px; max-width:340px;
    display:none; z-index:100; overflow-y:auto; max-height:min(70vh, 420px); }
  .ent-dd.open { display:block; }
  .ent-dd-item { display:flex; align-items:center; gap:10px; padding:10px 14px; font-size:11px;
    color:#d4d4d4; cursor:pointer; border-bottom:0.5px solid rgba(255,255,255,0.06); }
  .ent-dd-item:last-child { border-bottom:none; }
  .ent-dd-item:hover { background:#1a1a17; }
  .ent-dd-badge { font-size:9px; letter-spacing:0.06em; min-width:40px; }
  .ent-dd-name { flex:1; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ent-dd-item.create, .ent-dd-item.create .ent-dd-name { color:#888; }
  .ent-util { color:#666; font-size:11px; cursor:pointer; }
  .ent-util:hover { color:#d4d4d4; }
  .ent-nav { display:flex; gap:32px; padding:0 28px; border-bottom:0.5px solid rgba(255,255,255,0.08);
    font-size:11px; letter-spacing:0.08em; }
  .ent-nav a { padding:14px 0; color:#888; text-decoration:none; cursor:pointer; }
  .ent-nav a:not(.active):hover { color:#d4d4d4; }
  .ent-nav a.active { color:#8aaa6a; border-bottom:1px solid #8aaa6a; }
  .ent-content { padding:28px; }

  /* ── Mobile (≤700px): wrap the topbar onto two visual rows
     (brand+right on top, meta below) and let the nav scroll
     horizontally if it overflows. */
  @media (max-width:700px) {
    .ent-topbar { flex-wrap:wrap; row-gap:8px; gap:10px; padding:10px 12px; }
    .ent-topbar .brand { flex:1 1 auto; min-width:0; }
    .ent-topbar .player { font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .ent-topbar .meta {
      order:99;            /* drop meta to the bottom of the wrap */
      width:100%;
      gap:14px;
      border-top:0.5px solid rgba(255,255,255,0.06);
      padding-top:8px;
    }
    .ent-topbar .meta .label { font-size:8px; }
    .ent-topbar .meta .value { font-size:11px; }
    .ent-topbar .right { margin-left:auto; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
    .ent-topbar .cash-pill { font-size:10px; padding:4px 8px; }
    .ent-pill { font-size:10px; padding:4px 8px; }
    .ent-util { font-size:10px; }
    .ent-dd { min-width:200px; max-width:calc(100vw - 24px); }
    .ent-nav {
      padding:0 12px;
      gap:18px;
      overflow-x:auto;
      -webkit-overflow-scrolling:touch;
      scrollbar-width:none;          /* Firefox */
    }
    .ent-nav::-webkit-scrollbar { display:none; }   /* WebKit */
    .ent-nav a { padding:12px 0; white-space:nowrap; }
    .ent-content { padding:18px 12px; }
  }

  /* Mobile refresh — phone-class viewport (~375px primary, 360px safe).
     Topbar wraps already at 700px; this tightens container padding so
     content gets every pixel of width at the narrow end. Used by every
     entrepreneur page that wraps content in .ent-content. */
  @media (max-width:360px) {
    .ent-topbar { padding:8px 10px; gap:8px; }
    .ent-nav { padding:0 10px; }
    .ent-content { padding:14px 10px; }
  }
  `;
  document.head.appendChild(s);
}

function esc(v) { const d = document.createElement('div'); d.textContent = v == null ? '' : String(v); return d.innerHTML; }

let _entCountdownTimer = null;
function startCountdown(nextTickAt) {
  const el = document.getElementById('ent-next-tick');
  if (!el || !nextTickAt) return;
  const target = new Date(nextTickAt).getTime();
  const tick = () => {
    const diff = Math.max(0, target - Date.now());
    el.textContent = `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m ${Math.floor((diff % 60000) / 1000)}s`;
  };
  tick();
  if (_entCountdownTimer) clearInterval(_entCountdownTimer);
  _entCountdownTimer = setInterval(tick, 1000);
}

function buildSwitcher(facs) {
  const pill = document.getElementById('ent-pill');
  const dd = document.getElementById('ent-dd');
  if (!pill || !dd) return;
  dd.replaceChildren();
  const addRow = (cls, badgeText, badgeColor, name, onClick) => {
    const row = document.createElement('div');
    row.className = 'ent-dd-item' + (cls ? ' ' + cls : '');
    const b = document.createElement('span');
    b.className = 'ent-dd-badge';
    if (badgeColor) b.style.color = badgeColor;
    b.textContent = badgeText;
    const n = document.createElement('span');
    n.className = 'ent-dd-name';
    n.textContent = name;
    row.append(b, n);
    row.addEventListener('click', onClick);
    dd.appendChild(row);
  };
  for (const fac of facs) {
    const { label, color } = getFactionTypeBadge(fac.faction_type);
    const role = getPoliticianRoleLabel(fac);
    const name = (fac.faction_name || 'Unnamed') + (role ? ` (${role})` : '');
    addRow('', label, color, name, () => {
      sessionStorage.setItem('active_faction_id', fac.id);
      window.location.href = getFactionDashboardUrl(fac) || 'faction-select.html';
    });
  }
  const creates = [
    { has: 'party',       name: 'Found a Political Party', type: 'party',    url: 'select-nation.html' },
    { has: 'military',    name: 'Join a Military Faction', type: 'military', url: 'faction-select.html' },
  ];
  for (const c of creates) {
    if (facs.some(f => f.faction_type === c.has)) continue;
    addRow('create', '+', null, c.name, () => {
      sessionStorage.setItem('pending_faction_type', c.type);
      window.location.href = c.url;
    });
  }
  // Politician slot row — label rule, cap, and Patreon11 gate all
  // live in js/game/factions.js. Null when the user has hit the cap.
  const polSlot = nextPoliticianSlot(facs);
  if (polSlot) addRow('create', '+', null, polSlot.label, () => activatePoliticianSlot(polSlot));
  pill.addEventListener('click', (e) => { e.stopPropagation(); dd.classList.toggle('open'); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#ent-pill') && !e.target.closest('#ent-dd')) dd.classList.remove('open');
  });
}

// ─── Arrest lock ───────────────────────────────────────────────────
// When the entrepreneur's status is 'arrested' the server hard-blocks
// every economic action (see migration 20270412). Here we make that
// obvious and inert client-side: a persistent banner + a body class that
// greys out and disables all action controls. The topbar / nav use
// <span>/<a> (not button/input), so navigation, faction-switching and
// logout stay live — only page action controls are locked.
const ARREST_STYLE_ID = 'ent-arrest-styles';
function ensureArrestStyles() {
  if (document.getElementById(ARREST_STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = ARREST_STYLE_ID;
  s.textContent = `
  .ent-banner { display:flex; align-items:center; gap:12px; padding:12px 28px;
    background:repeating-linear-gradient(45deg,#2a0d0d,#2a0d0d 12px,#241010 12px,#241010 24px);
    border-bottom:1px solid #7a2a2a; color:#ffb3b3; font-size:12px; letter-spacing:0.02em; line-height:1.5; }
  .ent-banner .lock { font-size:18px; line-height:1; }
  .ent-banner .title { color:#ff6b6b; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; }
  .ent-banner .desc { color:#cf8c8c; }
  @media (max-width:700px){ .ent-banner{ padding:10px 12px; } }
  body.ent-arrested button,
  body.ent-arrested input,
  body.ent-arrested select,
  body.ent-arrested textarea,
  body.ent-arrested [role="button"] {
    pointer-events:none !important; opacity:0.4 !important; cursor:not-allowed !important; filter:grayscale(0.5); }
  body.ent-arrested #ent-banner,
  body.ent-arrested .ent-arrested-allow,
  body.ent-arrested .ent-arrested-allow * {
    pointer-events:auto !important; opacity:1 !important; cursor:auto !important; filter:none !important; }
  .ent-arrest-toast { position:fixed; left:50%; bottom:28px; transform:translateX(-50%);
    background:#2a0d0d; border:1px solid #7a2a2a; color:#ffb3b3; padding:10px 16px; border-radius:6px;
    font-size:12px; z-index:9999; box-shadow:0 6px 24px rgba(0,0,0,0.55); }
  `;
  document.head.appendChild(s);
}

let _arrestWired = false;
function showArrestToast() {
  const t = document.createElement('div');
  t.className = 'ent-arrest-toast';
  t.textContent = 'You are under arrest — this action is blocked.';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function applyArrestLock(faction) {
  const arrested = !!faction && String(faction.status || '').toLowerCase() === 'arrested';
  if (!arrested) { document.body.classList.remove('ent-arrested'); return false; }

  ensureArrestStyles();
  document.body.classList.add('ent-arrested');

  // Banner sits below the nav, full-width, inside the topbar container.
  const bar = document.getElementById('ent-topbar');
  if (bar && !document.getElementById('ent-banner')) {
    bar.insertAdjacentHTML('beforeend',
      `<div class="ent-banner" id="ent-banner">
         <span class="lock">🔒</span>
         <span><span class="title">Under Arrest</span> — your assets are frozen. You cannot found or close
         corporations, buy or sell shares, trade, invest, bid, or borrow. Existing businesses keep operating.
         <span class="desc">Contact an administrator to appeal.</span></span>
       </div>`);
  }

  // Belt-and-suspenders: stop keyboard/Enter form submits the CSS can't catch.
  if (!_arrestWired) {
    _arrestWired = true;
    document.addEventListener('submit', (e) => {
      if (document.body.classList.contains('ent-arrested') &&
          !e.target.closest('#ent-banner, .ent-arrested-allow, .ent-topbar, .ent-nav')) {
        e.preventDefault(); e.stopImmediatePropagation(); showArrestToast();
      }
    }, true);
  }
  return true;
}

export function renderEntrepreneurTopbar(container, { faction, shard, allUserFactions, activeTab }) {
  if (!container) return;
  ensureStyles();
  const f = faction || {};
  const s = shard || {};
  const first = f.leader_first_name || (f.faction_name || '').split(/\s+/)[0] || '';
  const last  = f.leader_last_name  || (f.faction_name || '').split(/\s+/).slice(1).join(' ') || '';
  const ini = (((first[0] || '') + (last[0] || '')).toUpperCase()) || '—';
  const pillLabel = last ? `${(first[0] || '').toUpperCase()}. ${last}` : (first || 'Entrepreneur');
  const cash = hfFmtBig(Number(f.party_funds) || 0);

  container.innerHTML = `
    <div class="ent-topbar">
      <div class="brand"><div class="crest">${esc(ini)}</div><span class="player">${esc(f.faction_name || pillLabel)}</span><span class="ent-topbar__version">${esc(APP_VERSION)}</span></div>
      <div class="meta">
        <div><div class="label">GAME DATE</div><div class="value">${esc(s.current_date || '—')}</div></div>
        <div><div class="label">TICK</div><div class="value">${s.current_tick != null ? esc(s.current_tick) : '—'}</div></div>
        <div><div class="label">NEXT TICK</div><div class="value" id="ent-next-tick">—</div></div>
      </div>
      <div class="right">
        <div class="cash-pill"><span class="label">CASH ON HAND: </span><span class="value">${esc(cash)}</span></div>
        <div class="ent-switcher">
          <span class="ent-pill" id="ent-pill" title="Switch faction">${esc(pillLabel)} ▾</span>
          <div class="ent-dd" id="ent-dd"></div>
        </div>
        <span class="ent-util" id="ent-logout">Logout</span>
      </div>
    </div>
    <nav class="ent-nav">
      ${ENT_TABS.map(t => `<a class="${t.id === activeTab ? 'active' : ''}" href="${t.href}">${t.label}</a>`).join('')}
    </nav>`;

  buildSwitcher((allUserFactions || []).filter(x => !isFactionInactive(x) && !isHiddenFromSwitcher(x)));
  startCountdown(s.next_tick_at);
  const lo = document.getElementById('ent-logout');
  if (lo) lo.addEventListener('click', async () => {
    try { await _supabase.auth.signOut(); } catch (e) { console.warn('[entrepreneur-topbar] signOut failed:', e?.message || e); }
    window.location.href = 'login.html';
  });
}

// Auth + fetch + render the topbar into #ent-topbar. Returns
// { user, faction, shard, allUserFactions }. Redirects to login if not
// authed, or to faction-select if the user has no entrepreneur faction.
// Throws on a hard query failure so the caller can show a loud error.
// Admin inspector override: when admin.html's Inspector loads an
// entrepreneur page in its iframe it appends ?faction_id=<id>. Mirrors the
// common.js convention — only honored for a server-verified admin, and the
// id is stashed in sessionStorage so it survives in-iframe nav (the ENT_TABS
// hrefs carry no query string). Returns the faction id to inspect, or null.
async function getAdminFactionOverride() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('faction_id');
    const fid = fromUrl || sessionStorage.getItem('_admin_faction');
    if (!fid) return null;                              // normal browsing — no RPC, no latency
    if (fromUrl) sessionStorage.setItem('_admin_faction', fromUrl);
    const { data } = await _supabase.rpc('verify_admin_access');
    if (!data || !data.authorized) return null;         // not an admin — ignore the override
    return fid;
  } catch (e) {
    console.warn('[entrepreneur-topbar] admin override check failed:', e?.message || e);
    return null;
  }
}

const ENT_FACTION_COLS =
  'id, faction_name, leader_first_name, leader_last_name, leader_age, nation, ent_origin_nation, ' +
  'entrepreneur_archetype, ent_ambition, ent_cunning, ent_reputation, ent_vision, party_funds, status';

export async function bootstrapEntrepreneur(activeTab) {
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return null; }

  // Admin inspecting a specific entrepreneur? Load that faction by id instead
  // of resolving the caller's own. View-only: action RPCs still resolve by
  // auth.uid() server-side, so an admin can browse but not act as them.
  const overrideId = await getAdminFactionOverride();

  const [facRes, shardRes, allFacRes] = await Promise.all([
    overrideId
      ? _supabase.from('factions').select(ENT_FACTION_COLS).eq('id', overrideId).maybeSingle()
      : _supabase.from('factions').select(ENT_FACTION_COLS)
          .or(`id.eq.${user.id},linked_user_id.eq.${user.id}`)
          .eq('faction_type', 'entrepreneur')
          .is('abandoned_at', null)
          .limit(1).maybeSingle(),
    _supabase.from('shard').select('current_date, current_tick, next_tick_at').eq('name', 'Alpha Shard').maybeSingle(),
    _supabase.from('factions')
      .select('id, faction_type, faction_name, abbreviation, branch, nation_id, abandoned_at, is_banned, linked_user_id, bar_admitted_nation_id, politician_office, politician_ministry, politician_experienced_advocate_at_tick')
      .or(`id.eq.${user.id},linked_user_id.eq.${user.id}`),
  ]);

  if (facRes.error) throw facRes.error;
  const faction = facRes.data;
  if (!faction && !overrideId) { window.location.href = 'faction-select.html'; return null; }
  if (!faction) console.warn('[entrepreneur-topbar] inspector faction not found:', overrideId);
  if (shardRes.error) console.warn('[entrepreneur-topbar] shard load failed:', shardRes.error.message);
  if (allFacRes.error) console.warn('[entrepreneur-topbar] factions load failed:', allFacRes.error.message);

  const shard = shardRes.data || {};
  // While inspecting, the switcher reflects the inspected entrepreneur, not
  // the admin's own factions.
  const allUserFactions = overrideId ? (faction ? [faction] : []) : (allFacRes.data || []);
  renderEntrepreneurTopbar(document.getElementById('ent-topbar'), { faction, shard, allUserFactions, activeTab });
  // Single source for the arrest lock — runs after the topbar exists so the
  // banner can attach, and still applies the body-class lock on any page
  // without an #ent-topbar container.
  applyArrestLock(faction);
  return { user, faction, shard, allUserFactions };
}
