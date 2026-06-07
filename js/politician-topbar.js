// ─── Politician shared topbar ──────────────────────────────────────
// Single source for the politician top navigation, used by every politician
// page (home + movements, more to come). Mirrors entrepreneur-topbar.js
// one-for-one — same patterns for styles, switcher, countdown, bootstrap —
// just teal where entrepreneur uses green.
import { _supabase } from './supabase-client.js';
import { APP_VERSION, fmtBig, displayName, currentAge, flagUrlFor } from './utils.js';
import { isFactionInactive, isHiddenFromSwitcher, getFactionDashboardUrl, getPoliticianRoleLabel, nextPoliticianSlot, activatePoliticianSlot } from './game/factions.js';

const POL_TABS = [
  { id: 'home',      label: 'HOME',      href: 'politician-home.html',      icon: '🏠' },
  { id: 'movements', label: 'MOVEMENTS', href: 'politician-movements.html', icon: '✊' },
  { id: 'nation',    label: 'NATION',    href: 'politician-nation.html',    icon: '🌍' },
  { id: 'career',    label: 'CAREER',    href: 'politician-career.html',    icon: '⚖️' },
  { id: 'forum',     label: 'FORUM',     href: 'politician-forum.html',     icon: '💬' },
];


const STYLE_ID = 'pol-topbar-styles';
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
  body { background:#050505; color:#d4d4d4; font-family:-apple-system,system-ui,sans-serif; margin:0; min-height:100vh; }
  .pol-topbar { display:flex; align-items:center; gap:24px; padding:12px 28px;
    border-bottom:0.5px solid rgba(255,255,255,0.08); font-size:11px; letter-spacing:0.05em;
    position:relative; }
  .pol-topbar .brand { display:flex; align-items:center; gap:10px; }
  .pol-topbar .crest { width:24px; height:24px; background:rgba(90,175,165,0.08); border:0.5px solid rgba(90,175,165,0.5);
    border-radius:3px; display:flex; align-items:center; justify-content:center; color:#5aafa5;
    font-size:11px; font-weight:600; letter-spacing:0.05em; }
  .pol-topbar .player { color:#fff; font-weight:500; font-size:13px; }
  /* Absolute-centred so the version sits dead-centre regardless of how meta /
     right items pack on either side. */
  .pol-topbar__version { position:absolute; left:50%; top:50%; transform:translate(-50%, -50%);
    font-family:monospace; font-size:10px; color:#f0efe6; letter-spacing:0.5px; opacity:0.8;
    pointer-events:none; }
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
    display:none; z-index:100; overflow-y:auto; max-height:min(70vh, 420px); }
  .pol-dd.open { display:block; }
  .pol-dd-item { display:flex; align-items:center; gap:10px; padding:10px 14px; font-size:11px;
    color:#d4d4d4; cursor:pointer; border-bottom:0.5px solid rgba(255,255,255,0.06); }
  .pol-dd-item:last-child { border-bottom:none; }
  .pol-dd-item:hover { background:#1a1a17; }
  .pol-dd-badge { font-size:9px; letter-spacing:0.06em; min-width:40px; flex-shrink:0; }
  .pol-dd-flag { width:24px; height:16px; object-fit:cover; min-width:24px;
    border-radius:2px; border:0.5px solid rgba(255,255,255,0.1); display:block; }
  .pol-dd-name { flex:1; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .pol-dd-empty { padding:10px; color:#666; font-size:10px; }
  .pol-dd-item.create, .pol-dd-item.create .pol-dd-name { color:#888; }
  .pol-util { color:#666; font-size:11px; cursor:pointer; }
  .pol-util:hover { color:#d4d4d4; }
  .pol-nav { display:flex; gap:32px; padding:0 28px; border-bottom:0.5px solid rgba(255,255,255,0.08);
    font-size:11px; letter-spacing:0.08em; }
  .pol-nav a { padding:14px 0; color:#888; text-decoration:none; cursor:pointer; }
  .pol-nav a:not(.active):hover { color:#d4d4d4; }
  .pol-nav a.active { color:#5aafa5; border-bottom:1px solid #5aafa5; }

  /* Mobile bottom navigation — mirrors the dashboard.css pattern
     (.mobile-bottom-nav) but uses the politician teal accent. Replaces
     the horizontal .pol-nav on narrow screens. */
  .pol-bottom-nav { display:none; position:fixed; bottom:0; left:0; right:0; z-index:500;
    background:#050505; border-top:0.5px solid rgba(255,255,255,0.12);
    padding:4px 0 env(safe-area-inset-bottom, 0);
    justify-content:space-around; align-items:center; }
  .pol-bottom-nav a { display:flex; flex-direction:column; align-items:center; gap:1px;
    padding:6px 0; text-decoration:none; flex:1; min-width:0; transition:color 0.15s; }
  .pol-bottom-nav .icon { font-size:18px; line-height:1;
    filter:grayscale(100%) brightness(0.6); transition:filter 0.15s; }
  .pol-bottom-nav .label { font-family:monospace; font-size:8px; font-weight:600;
    letter-spacing:0.04em; text-transform:uppercase; color:#888; transition:color 0.15s; }
  .pol-bottom-nav a.active .icon { filter:none; }
  .pol-bottom-nav a.active .label { color:#5aafa5; }

  @media (max-width:700px) {
    .pol-topbar { flex-wrap:wrap; row-gap:8px; gap:10px; padding:10px 12px; }
    .pol-topbar .brand { flex:1 1 auto; min-width:0; }
    .pol-topbar .player { font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    /* Absolute-centred version doesn't make sense once the bar wraps; hide it. */
    .pol-topbar__version { display:none; }
    .pol-topbar .meta { order:99; width:100%; gap:14px; border-top:0.5px solid rgba(255,255,255,0.06); padding-top:8px; }
    .pol-topbar .meta .label { font-size:8px; }
    .pol-topbar .meta .value { font-size:11px; }
    .pol-topbar .right { margin-left:auto; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
    .pol-topbar .cash-pill, .pol-pill { font-size:10px; padding:4px 8px; }
    .pol-util { font-size:10px; }
    .pol-dd { min-width:200px; max-width:calc(100vw - 24px); }
    /* Top tab nav hidden — bottom nav replaces it. */
    .pol-nav { display:none; }
    .pol-bottom-nav { display:flex; }
    /* Clear space under page content so the fixed bottom nav doesn't cover it. */
    body { padding-bottom:56px; }
  }
  @media (max-width:480px) {
    .pol-bottom-nav .icon { font-size:16px; }
    .pol-bottom-nav .label { font-size:7px; }
    .pol-bottom-nav a { padding:5px 0; }
  }`;
  document.head.appendChild(s);
}

function esc(v) { const d = document.createElement('div'); d.textContent = v == null ? '' : String(v); return d.innerHTML; }
function escAttr(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;'); }

function flagFor(n) {
  if (!n) return '';
  return (n.nation_profiles && n.nation_profiles.flag_url) || n.flag_url || `assets/flags/${n.name}.png`;
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
  const list = facs || [];
  // Existing rows — every active, non-hidden faction the user owns.
  const items = list.map(f => {
    const role = getPoliticianRoleLabel(f);
    const name = (f.faction_name || 'Unnamed') + (role ? ` (${role})` : '');
    // Nation flag replaces the legacy POL/ENTR/CORP text badge. Falls
    // back to display:none on missing image so an unmapped nation
    // degrades silently rather than showing a broken-image icon.
    const flag = flagUrlFor(f.nation);
    const badge = flag
      ? `<img class="pol-dd-badge pol-dd-flag" src="${esc(flag)}" alt="" onerror="this.style.display='none'">`
      : `<span class="pol-dd-badge"></span>`;
    return `<div class="pol-dd-item" data-id="${esc(f.id)}">
      ${badge}
      <span class="pol-dd-name">${esc(name)}</span>
    </div>`;
  });
  // Politician slot row — label rule, cap, and Patreon11 gate all
  // live in js/game/factions.js. Null when the user has hit the cap.
  // A user viewing the politician topbar always holds at least one
  // politician, so polSlot here will be at minimum slot #2.
  const polSlot = nextPoliticianSlot(list);
  if (polSlot) {
    items.push(`<div class="pol-dd-item create" data-join-politician>
      <span class="pol-dd-badge">+</span>
      <span class="pol-dd-name">${esc(polSlot.label)}</span>
    </div>`);
  }
  if (!items.length) {
    dd.innerHTML = '<div class="pol-dd-empty">No other factions.</div>';
    return;
  }
  dd.innerHTML = items.join('');
  dd.querySelectorAll('.pol-dd-item[data-id]').forEach(el => {
    el.addEventListener('click', () => {
      const f = list.find(x => x.id === el.dataset.id);
      if (!f) return;
      sessionStorage.setItem('active_faction_id', f.id);
      window.location.href = getFactionDashboardUrl(f) || 'faction-select.html';
    });
  });
  dd.querySelectorAll('.pol-dd-item[data-join-politician]').forEach(el => {
    el.addEventListener('click', () => activatePoliticianSlot(polSlot));
  });
}

export function renderPoliticianTopbar(container, { faction, shard, nation, allUserFactions, activeTab }) {
  if (!container) return;
  ensureStyles();
  const f = faction || {};
  const s = shard || {};
  const first = f.leader_first_name || '';
  const last  = f.leader_last_name  || '';
  const nick  = (f.nickname || '').trim();
  const ini = (((first[0] || '') + (last[0] || '')).toUpperCase()) || '—';
  // Brand uses the shared displayName helper. Pill stays inline
  // (abbreviated form — "F. Last" — doesn't fit the helper's shape).
  const display = displayName(f) || 'Politician';
  const baseLabel = last ? `${(first[0] || '').toUpperCase()}. ${last}` : (first || 'Politician');
  const pillLabel = nick ? `${baseLabel} (${nick})` : baseLabel;
  // Politician topbar shows INFLUENCE — sourced from factions.politician
  // _influence (column name matches the display label since 20270646).
  // fmtBig keeps small values plain ("0", "27") and magnitude-scales
  // higher ones ("1.2k").
  const influenceDisplay = fmtBig(Number(f.politician_influence) || 0);
  const age = String(currentAge(f, s.current_tick || 0));
  const nationHtml = nation
    ? `<img class="flag" src="${escAttr(flagFor(nation))}" alt="" onerror="this.style.visibility='hidden'">${esc(nation.name)}`
    : '—';

  container.innerHTML = `
    <div class="pol-topbar">
      <div class="brand">
        <div class="crest">${esc(ini)}</div>
        <span class="player">${esc(display)}</span>
      </div>
      <span class="pol-topbar__version">${esc(APP_VERSION)}</span>
      <div class="meta">
        <div><div class="label">AGE</div><div class="value">${esc(age)}</div></div>
        <div><div class="label">NATION</div><div class="value">${nationHtml}</div></div>
        <div><div class="label">GAME DATE</div><div class="value">${esc(s.current_date || '—')}</div></div>
        <div><div class="label">TICK</div><div class="value">${s.current_tick != null ? esc(s.current_tick) : '—'}</div></div>
        <div><div class="label">NEXT TICK</div><div class="value" id="pol-next-tick">—</div></div>
      </div>
      <div class="right">
        <div class="cash-pill"><span class="label">INFLUENCE: </span><span class="value">${esc(influenceDisplay)}</span></div>
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

  // Mobile bottom nav — appended to body (not the container) so its
  // fixed positioning isn't affected by the topbar's stacking context.
  // Idempotent: re-renders replace any prior instance, so switching
  // between politician pages doesn't stack copies.
  let bottom = document.getElementById('pol-bottom-nav');
  if (bottom) bottom.remove();
  bottom = document.createElement('nav');
  bottom.id = 'pol-bottom-nav';
  bottom.className = 'pol-bottom-nav';
  bottom.innerHTML = POL_TABS.map(t => `
    <a class="${t.id === activeTab ? 'active' : ''}" href="${t.href}">
      <span class="icon">${t.icon}</span>
      <span class="label">${esc(t.label)}</span>
    </a>`).join('');
  document.body.appendChild(bottom);

  // Military factions are intentionally excluded from the politician
  // switcher — politician + military are separate experiences and the
  // army faction shouldn't be reachable from the politician topbar.
  buildSwitcher((allUserFactions || []).filter(x =>
    !isFactionInactive(x) && !isHiddenFromSwitcher(x) && x.faction_type !== 'military'));
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
// its body off the same data. Redirects to login or first-steps if the
// caller isn't an authenticated politician. Throws on hard query failure.
export async function bootstrapPolitician(activeTab) {
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return null; }

  const [facRes, shardRes] = await Promise.all([
    _supabase.from('factions')
      .select('id, faction_type, faction_name, nation, nation_id, branch, leader_first_name, leader_last_name, nickname, founded_tick, party_funds, abandoned_at, is_banned, politician_capital, politician_reputation, politician_skill, politician_influence, politician_suspicion, volunteers, politician_party_id, politician_office, politician_office_won_at_tick, politician_ministry, politician_senior_civil_servant_at_tick, politician_agency_head_of, politician_permanent_secretary_at_tick, politician_permanent_secretary_ministry, politician_junior_portfolio, politician_seek_appointment_cooldown_until_tick, politician_former_community_organizer, civil_service_exam_cooldown_until_tick, next_member_action_tick, next_party_motion_tick, next_mp_action_tick, next_local_action_tick, next_civil_service_action_tick, next_chair_bid_tick, next_lobby_minister_tick, bar_admitted_nation_id, bar_admitted_at_tick, bar_last_attempt_tick, politician_experienced_advocate_at_tick, politician_magistrate_at_tick, politician_state_prosecutor_at_tick, politician_deputy_speaker_at_tick, politician_speaker_of_assembly_at_tick, try_case_cooldown_until_tick, party_cooldown_until_tick')
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
    window.location.href = 'first-steps.html';
    return null;
  }

  let nation = null;
  if (faction.nation_id) {
    try {
      // Superset select: covers the topbar's needs (id/name/flag),
      // politician-nation's full surface, and politician-movements'
      // total_seats. Reading ctx.nation across politician pages saves
      // a per-page nations refetch — one round-trip back regardless
      // of which page consumes which columns.
      const { data, error } = await _supabase.from('nations')
        .select(`
          id, name, flag_url, government_type, capital, total_seats,
          election_frequency, next_election_tick, parliamentary_term_ticks,
          head_of_state_title, head_of_state_first_name, head_of_state_last_name,
          population, dynasty_name,
          politician_gdp, politician_budget, politician_debt,
          politician_stability, politician_civil_freedoms, politician_gdp_growth,
          nation_profiles(flag_url, official_name, motto, overview, founded_year)
        `)
        .eq('id', faction.nation_id).maybeSingle();
      if (!error) nation = data;
    } catch (_) { /* nation is optional flair; absence falls back to '—' */ }
  }

  // Affiliated movement_party (when politician_party_id is set). Soft-fails
  // to null. Filters abandoned_at so a stale FK after a party's been
  // abandoned doesn't render as a ghost affiliation; the rung / hero just
  // show the not-affiliated state until the politician rejoins somewhere.
  // One source of truth for all politician pages — home + career both read
  // ctx.party rather than re-querying.
  let party = null;
  if (faction.politician_party_id) {
    try {
      const { data, error } = await _supabase.from('factions')
        .select('id, faction_name, abbreviation, party_status')
        .eq('id', faction.politician_party_id)
        .is('abandoned_at', null)
        .maybeSingle();
      if (!error) party = data || null;
    } catch (_) { /* non-fatal */ }
  }

  // Include the active politician in the switcher list (matches the
  // entrepreneur / military / common topbars). Filtering them out
  // caused nextPoliticianSlot to undercount by 1, so a user with two
  // politicians saw "Join as Politician #2" instead of "#3".
  const allUserFactions = factions;

  const container = document.getElementById('pol-topbar-container');
  if (container) {
    renderPoliticianTopbar(container, { faction, shard, nation, allUserFactions, activeTab });
  }

  // Fire-and-forget the due-resolution sweeps. Both are idempotent
  // server-side (FOR UPDATE SKIP LOCKED + status/tick advance), so
  // concurrent loads from multiple players (or tabs) won't double-apply.
  // No await — page render shouldn't block. Errors swallowed to console
  // warn since transient RPC failure shouldn't break the bootstrap.
  _supabase.rpc('resolve_due_general_elections')
    .then(({ error }) => { if (error) console.warn('[politician-topbar] resolve_due_general_elections:', error.message); })
    .catch(e => console.warn('[politician-topbar] resolve_due_general_elections threw:', e?.message || e));
  // 20270536: rotate trials whose judge has been silent >5 ticks
  // so the docket keeps moving without a dedicated tick processor.
  _supabase.rpc('resolve_due_judge_timeouts')
    .then(({ error }) => { if (error) console.warn('[politician-topbar] resolve_due_judge_timeouts:', error.message); })
    .catch(e => console.warn('[politician-topbar] resolve_due_judge_timeouts threw:', e?.message || e));

  return { user, faction, shard, nation, allUserFactions, party };
}
