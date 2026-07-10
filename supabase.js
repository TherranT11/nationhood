// Shared Supabase browser client — the single source of truth for the
// project URL and publishable key. Imported across the app (the auth pages
// directly, and every in-game screen via tutorial/shell.js).
//
// The publishable key (sb_publishable_...) is safe to ship in client code:
// access is governed by Row Level Security in the database, not by hiding
// this key. Never put the secret (sb_secret_...) key here.
// Bundled from npm by Vite (was the esm.sh CDN), so it ships minified + hashed
// with the app instead of a separate runtime fetch.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://enxrxbcozjlvktuummbw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-sTPXsMaU81zU-pJtktSpA_yR0tS8CM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// True once real credentials have been filled in, so pages can show a clear
// message instead of failing with a cryptic network error.
export const isConfigured =
  !SUPABASE_URL.includes('YOUR-PROJECT-REF') &&
  !SUPABASE_PUBLISHABLE_KEY.includes('YOUR-');

// Sign the player out and return to the landing page. One source, used by every
// signed-in screen. Redirects even if the sign-out call fails so a stuck session
// never traps the player; guards against a double-click firing two sign-outs.
let loggingOut = false;
export async function logout() {
  if (loggingOut) return;
  loggingOut = true;
  try { if (isConfigured) await supabase.auth.signOut(); } catch (err) { /* fall through to redirect */ }
  window.location.href = '/';
}

// Resolve the signed-in player. Returns the auth user, or null when Supabase isn't
// configured (local dev) so callers can fall back to defaults. Redirects to /login/
// — and returns null — when there's no valid session, so a logged-out player never
// reaches a gated page. One source, shared by the tutorial and the online game.
export async function requireUser() {
  if (!isConfigured) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '/login/'; return null; }
    return session.user;
  } catch (err) {
    window.location.href = '/login/';
    return null;
  }
}

// The signed-in player's party, or null (not signed in / no party / not
// configured). One source for the "do I already have a party?" routing check —
// used to send a returning player straight to their instance, and to keep a
// party-holder out of the found-a-party flow (which would overwrite their party).
export async function currentParty() {
  if (!isConfigured) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const { data } = await supabase.from('parties').select('id, nation_id').eq('user_id', session.user.id).maybeSingle();
    return data || null;
  } catch (err) {
    return null;
  }
}

// The shared game clock's current tick — one source for "now" (one tick = one
// month, tick 1 = January 1980). Defaults to 1 if unavailable.
export async function currentTick() {
  if (!isConfigured) return 1;
  try {
    const { data } = await supabase.from('game_state').select('current_tick').maybeSingle();
    return (data && data.current_tick != null) ? data.current_tick : 1;
  } catch (err) {
    return 1;
  }
}

// Fetch EVERY row of a table, paging past PostgREST's ~1000-row response cap. A plain select
// silently returns only the first ~1000 rows, which reads as missing data on a large table (e.g. a
// world map grown past 1000 hexes: painted land saves but reloads "gone"). Returns the familiar
// { data, error } shape — the error from the first failing page — so callers keep any column
// fallback. ONE source for a whole-table read; used by the world-map readers.
export async function selectAll(table, columns) {
  const PAGE = 1000;
  let from = 0, all = [], batch;
  do {
    const res = await supabase.from(table).select(columns).range(from, from + PAGE - 1);
    if (res.error) return res;
    batch = res.data || [];
    all = all.concat(batch);
    from += PAGE;
  } while (batch.length === PAGE);
  return { data: all, error: null };
}

// Delete the signed-in player's party and everything that cascades from it —
// politicians, the recruit drive, and its events (the DB FKs handle the cascade).
// Goes through the delete_party RPC (schema/169) so the deletion is counted: the
// 2nd voluntary deletion onward locks new-party creation for 6 ticks (anti-spam).
// The session is left intact (the player stays logged in). Returns { data, error }
// where data = { deleted, deletions, until } (until = the new cooldown tick, or null).
export async function deleteParty() {
  if (!isConfigured) return { error: { message: 'Not connected.' } };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: { message: 'Not signed in.' } };
    return await supabase.rpc('delete_party');
  } catch (err) {
    return { error: { message: 'Delete failed.' } };
  }
}

// Wire the settings-gear "Delete Party" flow. The markup is shared (injected by
// topbar.js): the gear menu holds the Delete Party item; clicking it opens the
// confirm MODAL (warning about the 2nd-deletion cooldown), and Confirm →
// deleteParty() → /home (still signed in). Errors surface in the modal. No-op if
// the gear isn't on the page.
export function wireDeletePartyMenu() {
  const gearBtn = document.getElementById('gearBtn');
  if (!gearBtn) return;
  const gearMenu = document.getElementById('gearMenu');
  const modal = document.getElementById('delModal');
  const errEl = document.getElementById('delModalErr');
  const confirmBtn = document.getElementById('delConfirm');
  function closeMenu() { gearMenu.hidden = true; gearBtn.setAttribute('aria-expanded', 'false'); }
  function closeModal() { if (modal) modal.hidden = true; }
  gearBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (gearMenu.hidden) { gearMenu.hidden = false; gearBtn.setAttribute('aria-expanded', 'true'); }
    else closeMenu();
  });
  document.getElementById('delPartyBtn').addEventListener('click', function () {
    closeMenu();
    if (errEl) { errEl.textContent = ''; errEl.hidden = true; }
    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'Confirm'; }
    if (modal) modal.hidden = false;
  });
  document.getElementById('delCancel').addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });   // click the backdrop
  confirmBtn.addEventListener('click', async function () {
    confirmBtn.disabled = true; confirmBtn.textContent = 'Deleting…';
    const { error } = await deleteParty();
    if (error) {
      confirmBtn.disabled = false; confirmBtn.textContent = 'Confirm';
      if (errEl) { errEl.textContent = error.message || 'Couldn’t delete your party.'; errEl.hidden = false; }
      return;
    }
    window.location.href = '/home/';
  });
  document.addEventListener('click', function (e) { if (!gearMenu.hidden && !e.target.closest('.tb-gear')) closeMenu(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modal && !modal.hidden) closeModal(); else if (!gearMenu.hidden) closeMenu();
  });
}


