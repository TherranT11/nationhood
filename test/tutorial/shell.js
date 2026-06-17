// Shared logic for the in-game sidebar screens (tutorial/home, tutorial/government).
// One source of truth for the party colour map and the sidebar's live bits:
// the flag fallback, the login guard, and the player's chosen-party label.
import { supabase, isConfigured } from '/test/supabase.js';

// The party a player chose in the tutorial -> sidebar label + colour.
// (Liberal is presented as "Centrist".)
export const PARTY = {
  Nationalist: { label: 'Nationalist', color: '#243b6b' }, // blue
  Labour:      { label: 'Labour',      color: '#D1342B' }, // red
  Liberal:     { label: 'Centrist',    color: '#C2890B' }, // yellow
};

// ---------------------------------------------------------------------------
// Auth + profile helpers (the single source of truth for "who is signed in"
// and "what is their tutorial progress", shared by every gated screen)
// ---------------------------------------------------------------------------

// Resolve the signed-in player. Returns the auth user, or null when Supabase
// isn't configured yet (local dev) so callers can fall back to their defaults.
// Redirects to /test/login/ — and returns null — when there is no valid
// session, so a logged-out player never reaches a gated page.
export async function requireUser() {
  if (!isConfigured) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '/test/login/'; return null; }
    return session.user;
  } catch (err) {
    window.location.href = '/test/login/';
    return null;
  }
}

// Read a player's tutorial progress in one place: the party they chose and
// whether they've formed their government. Returns null on any failure, so
// callers keep their defaults rather than act on bad data.
export async function getTutorialProgress(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('tutorial_party, tutorial_government_formed')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return { party: data.tutorial_party, governmentFormed: !!data.tutorial_government_formed };
  } catch (err) {
    return null;
  }
}

// Wire up the shared sidebar: hide the flag if it is missing, require a
// signed-in player, and show their party in its colour. Call once per page.
// Expects a #flag image and a #party label in the markup.
export async function initSidebar() {
  const flag = document.getElementById('flag');
  if (flag) {
    const hide = () => { flag.style.display = 'none'; };
    flag.addEventListener('error', hide);
    if (flag.complete && flag.naturalWidth === 0) hide();
  }

  // The subtitle starts hidden so the player never sees a placeholder before
  // their archetype loads; reveal it once we know (or cannot know) the party.
  const partyEl = document.getElementById('party');
  const reveal = () => { if (partyEl && partyEl.parentElement) partyEl.parentElement.style.visibility = 'visible'; };

  if (!isConfigured) { reveal(); return; } // keep defaults until keys are set

  const user = await requireUser();
  if (!user) return; // not signed in: requireUser has redirected to login

  const progress = await getTutorialProgress(user.id);
  if (!progress) { reveal(); return; } // lookup failed: keep defaults

  const p = PARTY[progress.party];
  if (p && partyEl) { partyEl.textContent = p.label; partyEl.style.color = p.color; }
  reveal();

  // Let the page react to the player's state (archetype contradictions,
  // whether the government is already formed).
  window.nationhoodParty = progress.party;
  window.nationhoodGovernmentFormed = progress.governmentFormed;
  window.dispatchEvent(new CustomEvent('nationhood:party', { detail: progress.party }));
  window.dispatchEvent(new CustomEvent('nationhood:gov', { detail: progress.governmentFormed }));
}

// Record that the player has formed their government. Returns true on success
// (or when there are no keys, so local dev still flows through).
export async function markGovernmentFormed() {
  if (!isConfigured) return true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const { error } = await supabase
      .from('profiles')
      .update({ tutorial_government_formed: true })
      .eq('id', session.user.id);
    return !error;
  } catch (err) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Shared game-clock + weekly-action widget (top-right on every in-game screen)
// ---------------------------------------------------------------------------
// One source of truth for the current week and the actions a player has left,
// so every page agrees. The home screen renders these inline in its own header;
// every other in-game screen gets them from mountTopbar() below.
export const GAME_WEEK = 'Week 22 · May 1980';
export const PARTY_ACTIONS = 3;

// Inject the topbar's styles once per page. Uses the same CSS variables the
// pages already define (--indigo, --soft, --ink, ...), so it inherits each
// screen's palette. Class names are prefixed `gw-` to never collide with a
// page's own markup (e.g. the home screen's .pa / .nextweek).
let topbarStyled = false;
function ensureTopbarStyles() {
  if (topbarStyled) return;
  topbarStyled = true;
  const css = `
  .gw-topbar{display:flex;align-items:center;justify-content:flex-end;gap:13px;flex-wrap:wrap;margin-bottom:20px}
  .gw-topbar .gw-actions{font-family:'Space Mono',monospace;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--indigo);background:var(--indigo-soft);border:1px solid color-mix(in srgb,var(--indigo) 30%,transparent);border-radius:20px;padding:9px 15px;white-space:nowrap}
  .gw-topbar .gw-week{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--soft);white-space:nowrap}
  .gw-topbar .gw-next{font-family:'Space Mono',monospace;font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;background:var(--indigo);color:#fff;border:none;border-radius:11px;padding:12px 20px;cursor:pointer;white-space:nowrap;transition:transform .15s,filter .15s}
  .gw-topbar .gw-next:hover{transform:translateY(-1px);filter:brightness(1.07)}
  .gw-topbar .gw-next:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
  .gw-topbar .gw-next[disabled]{background:#cfcdc7;cursor:default;pointer-events:none}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// Render the actions-remaining chip, current week, and Next Week button into
// the top-right of <main>. Safe to call once per page; a no-op if there is no
// <main> or a bar is already present. Next Week is disabled during the tutorial,
// matching the home screen — the week only advances once that flow is built.
export function mountTopbar() {
  const main = document.querySelector('.main');
  if (!main || main.querySelector('.gw-topbar')) return;
  ensureTopbarStyles();

  const bar = document.createElement('div');
  bar.className = 'gw-topbar';
  bar.innerHTML =
    '<span class="gw-actions">Party Actions: ' + PARTY_ACTIONS + ' Available</span>' +
    '<span class="gw-week">' + GAME_WEEK + '</span>' +
    '<button class="gw-next" type="button" disabled title="Not yet available">Next Week &#9656;</button>';
  main.insertBefore(bar, main.firstChild);
}

// Sign the player out and return to the test landing page. Redirects even if
// the sign-out call fails so a stuck session never traps the player. Guards
// against a double-click firing two sign-outs before the redirect lands.
let loggingOut = false;
export async function logout() {
  if (loggingOut) return;
  loggingOut = true;
  try { if (isConfigured) await supabase.auth.signOut(); } catch (err) { /* fall through to redirect */ }
  window.location.href = '/test/';
}

// Confidence of the formed tutorial government (Front 114 + Workers' 40 = 154
// of 280) under the three standing crises. Single source of truth so the home
// screen and the Government page always agree. Depends on the player's
// archetype: a Nationalist clashes with the Communist Workers' Party.
export function formedConfidence(party) {
  const base = 50;
  const crises = -6;                                // three crises at -2
  const contra = party === 'Nationalist' ? -4 : 0;  // clash with the Communist partner
  const bonus = Math.round((((154 / 280) * 100 - 50) / 2) * 10) / 10; // seats over 50%, halved (2.5)
  const value = Math.round(base + crises + contra + bonus);
  return { value, base, crises, contra, bonus };
}
