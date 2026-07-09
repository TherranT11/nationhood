// topbar.js — the in-game top bar (Discord, party funds, Influence, date,
// and the settings gear). ONE source for every signed-in screen: a page drops
// <div class="topbar" id="topbar"></div> at the top of <main>, calls
// mountTopbar() once, then feeds live values via the setters as data loads.
import { supabase, wireDeletePartyMenu, logout } from '/supabase.js';
import { partyColor } from '/archetypes.js';
import { liveGameDate, mountGameDate } from '/gamedate.js';
import { nationBudgetBalance } from '/policies.js';
import { fetchBudgetInitiatives } from '/initiatives.js';
import { mountCoalitionBanner } from '/coalition-banner.js';

const CSS = `
/* Compact chip row, matching the tutorial's .nhbar: Influence (star) · Budget ·
   Next Tick · Date, then the round theme + gear buttons. */
.topbar{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-bottom:26px}
.tb-discord{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#5865f2;color:#fff;flex:none;transition:background .15s}
.tb-discord:hover{background:#4752c4}
.tb-discord svg{width:18px;height:18px}
.tb-chip{display:inline-flex;align-items:center;gap:6px;background:var(--chip);border:1px solid var(--line);border-radius:10px;padding:7px 12px;font-family:'Space Mono',monospace;font-size:12.5px;font-weight:700;white-space:nowrap}
.tb-inf{color:var(--ink)}
.tb-inf svg{width:16px;height:16px;fill:var(--amber)}
.tb-bal--pos{color:var(--green)}
.tb-bal--neg{color:var(--red)}
.tb-next{color:var(--soft)}
.tb-date{color:var(--muted)}
.tb-gear{position:relative;flex:none}
.gear{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--chip);border:1px solid var(--line);color:var(--muted);cursor:pointer;transition:color .15s,border-color .15s}
.gear:hover{color:var(--ink);border-color:var(--ink)}
.gear svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.gearmenu{position:absolute;top:calc(100% + 8px);right:0;background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:0 18px 44px -18px rgba(0,0,0,.4);padding:6px;min-width:210px;z-index:60}
.gearmenu[hidden]{display:none}
.gearmenu__item{display:block;width:100%;text-align:left;background:none;border:none;border-radius:8px;padding:10px 12px;font-family:inherit;font-size:13.5px;color:var(--ink);cursor:pointer}
.gearmenu__item:hover{background:var(--chip)}
.gearmenu__item--danger{color:var(--red);font-weight:700}
.gearmenu__item--danger:hover{background:var(--red-soft,#FBEAE9)}
.gearmenu__warn{font-size:12.5px;line-height:1.5;color:var(--muted);padding:8px 10px 4px;margin:0}
.gearmenu__row{display:flex;gap:8px;padding:8px 6px 4px}
.gearmenu__btn{flex:1;border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:9px 10px;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--ink);cursor:pointer}
.gearmenu__btn:hover{background:var(--chip)}
.gearmenu__btn--danger{background:var(--red);border-color:var(--red);color:#fff}
.gearmenu__btn--danger:hover{filter:brightness(1.05);background:var(--red)}
.gearmenu__btn:disabled{opacity:.6;cursor:not-allowed}
@media(max-width:560px){.topbar{gap:10px;margin-bottom:16px}}
`;

const HTML = `
<a class="tb-discord" href="https://discord.gg/HBvWxJUm8" target="_blank" rel="noopener" aria-label="Join our Discord"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a13.6 13.6 0 0 0-.6 1.23 18.27 18.27 0 0 0-5.487 0A13.6 13.6 0 0 0 9.87 3a19.79 19.79 0 0 0-3.76 1.369C2.72 9.046 1.79 13.605 2.255 18.1a19.9 19.9 0 0 0 6.073 3.058c.49-.668.926-1.377 1.302-2.122a12.93 12.93 0 0 1-2.05-.978c.172-.126.34-.257.502-.392a14.2 14.2 0 0 0 12.036 0c.164.135.332.266.502.392-.654.386-1.343.714-2.052.98.376.743.812 1.452 1.302 2.12a19.86 19.86 0 0 0 6.075-3.058c.546-5.21-.93-9.728-3.93-13.73ZM9.682 15.33c-1.182 0-2.157-1.086-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.097 2.157 2.42 0 1.334-.955 2.42-2.157 2.42Zm4.636 0c-1.182 0-2.157-1.086-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.097 2.157 2.42 0 1.334-.946 2.42-2.157 2.42Z"/></svg></a>
<span class="tb-chip tb-inf" title="Influence — actions you can take this tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg><span id="tbInf">12</span></span>
<span class="tb-chip tb-bal" id="tbBal" title="Budget Balance (per year) — the net of the nation's in-force policy effects" hidden>—</span>
<span class="tb-chip tb-next" title="Time to the next tick">&#9201; <span id="tbNext">—:—:—</span></span>
<span class="tb-chip tb-date" id="tbDate" title="In-game date"></span>
<button class="gear" id="themeBtn" type="button" aria-label="Toggle dark mode"></button>
<div class="tb-gear">
  <button class="gear" id="gearBtn" type="button" aria-label="Settings" aria-haspopup="true" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
  <div class="gearmenu" id="gearMenu" hidden>
    <div id="gearMain">
      <button class="gearmenu__item" id="handleBtn" type="button">Set nickname</button>
      <button class="gearmenu__item" id="logoutBtn" type="button">Log out</button>
      <button class="gearmenu__item gearmenu__item--danger" id="delPartyBtn" type="button">Delete Party</button>
    </div>
    <div id="gearConfirm" hidden>
      <p class="gearmenu__warn" id="gearWarn">Delete your party? This permanently removes your seats, politicians, and funds. This can&rsquo;t be undone.</p>
      <div class="gearmenu__row">
        <button class="gearmenu__btn gearmenu__btn--danger" id="delYes" type="button">Yes, delete</button>
        <button class="gearmenu__btn" id="delNo" type="button">Cancel</button>
      </div>
    </div>
  </div>
</div>
`;

// Inject the styles once, fill #topbar with the markup, and wire the gear menu.
export function mountTopbar(){
  if (!document.getElementById('tb-style')) {
    const s = document.createElement('style');
    s.id = 'tb-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  const host = document.getElementById('topbar');
  if (host) host.innerHTML = HTML;
  wireDeletePartyMenu();   // settings gear → Delete Party (shared; see supabase.js)
  const logoutBtn = document.getElementById('logoutBtn');   // gear → Log out (moved here from the side nav)
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  // gear → Set nickname: the player's out-of-character Forum identity (@handle). OOC
  // posting is gated on having one.
  const handleBtn = document.getElementById('handleBtn');
  if (handleBtn) handleBtn.addEventListener('click', async function () {
    const h = prompt('Choose a nickname — up to 16 letters, digits, or underscores. This is your out-of-character name in the Forum, and you need one to post there.');
    if (h == null) return;
    try {
      const { data, error } = await supabase.rpc('set_handle', { p_handle: h.trim() });
      if (error) throw error;
      alert('Nickname set to @' + data);
    } catch (e) { alert(e.message || 'Couldn’t set that nickname.'); }
  });
  wireTheme();             // sun/moon toggle → flips the persistent light/dark theme
  loadChrome();            // accent + funds + action budget on every screen (one source)

  // The game date (the global tick) is shown here: cached value instantly (no
  // placeholder flash) then confirmed from the live tick — see gamedate.js. Re-pull
  // it whenever the page is (re)shown so it never goes stale after a tick advances
  // elsewhere: on bfcache restore (back/forward) and when a tab is refocused.
  mountGameDate(document.getElementById('tbDate'));
  mountNextTick(document.getElementById('tbNext'));   // live "Next Tick" countdown to the next 8h boundary
  mountCoalitionBanner();   // top-of-page "form a coalition" prompt while the nation has no governing coalition
  window.addEventListener('pageshow', function () { refreshTopbarDate(); mountCoalitionBanner(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { refreshTopbarDate(); mountCoalitionBanner(); } });
}

export async function refreshTopbarDate(){
  try { setTopbarDate(await liveGameDate()); } catch (e) { /* keep the last shown date */ }
}

// The live "Next Tick" countdown. The server advances the clock via pg_cron at
// 00:00 / 08:00 / 16:00 UTC (schema/60), so the next tick is just the next 8-hour UTC
// boundary — pure wall-clock math, no server round-trip. We repaint every second; when
// a boundary passes (the countdown jumps back up to ~8h), the server has just ticked,
// so we re-pull the visible game date — at once, then again a few seconds later in case
// the cron run lands a moment late. visibilitychange (above) also refreshes on refocus,
// so a backgrounded tab self-heals.
const TICK_PERIOD_MS = 8 * 3600 * 1000;   // 8 hours — must match the cron schedule '0 */8 * * *'
let nextTickTimer = null;

function msUntilNextTick(now){
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const since = now.getTime() - dayStart;                              // ms since UTC midnight
  const nextBoundary = (Math.floor(since / TICK_PERIOD_MS) + 1) * TICK_PERIOD_MS;
  return dayStart + nextBoundary - now.getTime();                      // ms to the next 00/08/16 UTC
}
function fmtCountdown(ms){
  const s = Math.max(0, Math.floor(ms / 1000));
  const two = function (n) { return String(n).padStart(2, '0'); };
  return Math.floor(s / 3600) + ':' + two(Math.floor((s % 3600) / 60)) + ':' + two(s % 60);
}
function mountNextTick(el){   // internal: only mountTopbar uses it
  if (!el) return;
  if (nextTickTimer) { clearInterval(nextTickTimer); nextTickTimer = null; }   // never stack intervals
  let remaining = msUntilNextTick(new Date());
  el.textContent = fmtCountdown(remaining);
  nextTickTimer = setInterval(function () {
    const prev = remaining;
    remaining = msUntilNextTick(new Date());
    if (remaining > prev) {                 // a boundary just passed → the server ticked
      refreshTopbarDate();
      setTimeout(refreshTopbarDate, 6000);  // and once more, in case the cron run lands late
    }
    el.textContent = fmtCountdown(remaining);
  }, 1000);
}

// Live-value setters — no-ops if the topbar isn't mounted on this page.
export function setTopbarActions(n){
  const el = document.getElementById('tbInf');            // the Influence chip (server field: influence)
  if (el) el.textContent = (n != null ? n : 12);          // 12 = the default budget, matching the static markup
}
// The nation's Budget Balance — the computed net of its in-force policy effects (one source:
// nationBudgetBalance in policies.js), shown ±-coloured and suffixed "bn /yr". Internal:
// loadChrome computes it once per page; it only moves when a policy changes.
function setTopbarBudget(currency, balance){
  const el = document.getElementById('tbBal');
  if (!el) return;
  if (balance == null) { el.hidden = true; return; }
  const b = Math.round(balance * 10) / 10, neg = b < 0;
  el.textContent = (neg ? '−' : '') + (currency || '$') + Math.abs(b) + 'bn /yr';
  el.classList.toggle('tb-bal--neg', neg);
  el.classList.toggle('tb-bal--pos', !neg);
  el.hidden = false;
}
export function setTopbarDate(dateStr){
  const el = document.getElementById('tbDate');
  if (el) el.textContent = dateStr;
}

// Light/dark toggle. The actual theme state + persistence live in theme.js
// (window.NHTheme); the topbar just owns the button. We re-tint the party accent
// on every flip because the soft tint mixes toward the page background, which
// differs between light and dark.
const SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
function paintThemeIcon(){
  const b = document.getElementById('themeBtn');
  if (!b) return;
  const dark = window.NHTheme && window.NHTheme.current === 'dark';
  b.innerHTML = dark ? SUN : MOON;          // show what you'll switch TO
  b.setAttribute('aria-pressed', dark ? 'true' : 'false');
}
function wireTheme(){
  const b = document.getElementById('themeBtn');
  if (!b) return;
  paintThemeIcon();
  b.addEventListener('click', function () { if (window.NHTheme) window.NHTheme.toggle(); });
  window.addEventListener('nh-theme', paintThemeIcon);
}

// Party-colour accent — ONE source for every signed-in screen. Remaps the page's
// --indigo (and its soft tint) on :root, so the topbar pill, sidebar, and all page
// accents follow the player's party colour. Pages can call this to update live (e.g.
// after Edit Party); mountTopbar also loads it once so every page is tinted on boot.
// The soft tint blends toward var(--surface), so it re-resolves automatically when
// the theme flips — no recompute needed here.
export function setAccent(color){
  if (!color) return;
  const r = document.documentElement;
  r.style.setProperty('--indigo', color);
  r.style.setProperty('--indigo-soft', 'color-mix(in srgb, ' + color + ' 14%, var(--surface))');
}
// Load the player's party once and fill the shared chrome on EVERY screen — accent
// colour, the nation budget, and the action budget — so they're correct even on
// pages that don't feed the topbar themselves. Pages may still call setTopbarActions
// to update the Influence chip live after spending an action.
async function loadChrome(){
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: p } = await supabase.from('parties')
      .select('color, archetype, influence, nation_id').eq('user_id', session.user.id).maybeSingle();
    if (!p) return;
    setAccent(partyColor(p));               // chosen colour, else archetype default (one source: archetypes.js)
    setTopbarActions(p.influence);
    // Budget Balance = the net of the nation's in-force policy effects minus its running initiatives'
    // standing $bn/yr (one source: policies.js).
    try {
      const { data: n } = await supabase.from('nations').select('economy, policies, gdp').eq('id', p.nation_id).maybeSingle();
      const { data: pols } = await supabase.from('policies').select('id, definition');
      const inits = await fetchBudgetInitiatives(p.nation_id);
      setTopbarBudget((n && n.economy && n.economy.currency) || '$', nationBudgetBalance(pols || [], (n && n.policies) || {}, n && n.gdp, inits));
    } catch (e) { /* leave the chip hidden if policies/nation can't be read */ }
  } catch (e) { /* leave the defaults if the party can't be read */ }
}
