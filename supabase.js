// Shared Supabase browser client — the single source of truth for the
// project URL and publishable key. Imported across the app (the auth pages
// directly, and every in-game screen via tutorial/shell.js).
//
// The publishable key (sb_publishable_...) is safe to ship in client code:
// access is governed by Row Level Security in the database, not by hiding
// this key. Never put the secret (sb_secret_...) key here.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// Delete the signed-in player's party and everything that cascades from it —
// politicians, the recruit drive, and its events (the DB FKs handle the cascade;
// seats/funds/popularity are columns on the party row). RLS lets a player delete
// only their own party. The session is left intact (the player stays logged in).
export async function deleteParty() {
  if (!isConfigured) return { error: { message: 'Not connected.' } };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: { message: 'Not signed in.' } };
    return await supabase.from('parties').delete().eq('user_id', session.user.id);
  } catch (err) {
    return { error: { message: 'Delete failed.' } };
  }
}

// Wire the settings-gear "Delete Party" menu. The markup is per-page (part of the
// topbar each page already duplicates); this is the one shared behaviour: toggle
// the menu, a two-step confirm, then deleteParty() → /home (still signed in).
// Errors surface in the confirm text. No-op if the gear isn't on the page.
export function wireDeletePartyMenu() {
  const gearBtn = document.getElementById('gearBtn');
  if (!gearBtn) return;
  const gearMenu = document.getElementById('gearMenu');
  const gearMain = document.getElementById('gearMain');
  const gearConfirm = document.getElementById('gearConfirm');
  const gearWarn = document.getElementById('gearWarn');
  const defaultWarn = gearWarn ? gearWarn.textContent : '';
  function close() { gearMenu.hidden = true; gearBtn.setAttribute('aria-expanded', 'false'); gearMain.hidden = false; gearConfirm.hidden = true; }
  gearBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (gearMenu.hidden) { gearMenu.hidden = false; gearBtn.setAttribute('aria-expanded', 'true'); gearMain.hidden = false; gearConfirm.hidden = true; }
    else close();
  });
  document.getElementById('delPartyBtn').addEventListener('click', function () { if (gearWarn) gearWarn.textContent = defaultWarn; gearMain.hidden = true; gearConfirm.hidden = false; });
  document.getElementById('delNo').addEventListener('click', close);
  document.getElementById('delYes').addEventListener('click', async function () {
    const yes = document.getElementById('delYes'); yes.disabled = true; yes.textContent = 'Deleting…';
    const { error } = await deleteParty();
    if (error) { yes.disabled = false; yes.textContent = 'Yes, delete'; if (gearWarn) gearWarn.textContent = error.message || 'Couldn’t delete your party.'; return; }
    window.location.href = '/home/';
  });
  document.addEventListener('click', function (e) { if (!gearMenu.hidden && !e.target.closest('.tb-gear')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !gearMenu.hidden) close(); });
}


