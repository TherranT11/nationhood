// Shared Supabase browser client — one source of truth for the project URL,
// publishable key, and the auth actions the app performs.
//
// The publishable key (sb_publishable_...) is SAFE to ship in client code:
// access is governed by Row Level Security, not by hiding this key. Never put
// the secret key here. Bundled from npm by Vite.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://enxrxbcozjlvktuummbw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-sTPXsMaU81zU-pJtktSpA_yR0tS8CM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Register a ruler. The nickname rides as auth metadata so the handle_new_user()
// trigger writes it into profiles on sign-up. Returns { data, error }.
export async function signUp({ email, nickname, password }) {
  try {
    return await supabase.auth.signUp({ email, password, options: { data: { nickname } } });
  } catch (err) {
    return { error: { message: 'Could not found your nation. Try again.' } };
  }
}

// Sign in with an email OR a nickname. A nickname is resolved to its email via
// the email_for_nickname RPC first, then GoTrue verifies the password.
// Returns { data, error }.
export async function signIn({ ident, password }) {
  try {
    let email = ident.trim();
    if (!email.includes('@')) {
      const { data, error } = await supabase.rpc('email_for_nickname', { _nick: email });
      if (error || !data) {
        return { error: { message: "That name and passphrase don't match. Try again, or ask the archivists." } };
      }
      email = data;
    }
    return await supabase.auth.signInWithPassword({ email, password });
  } catch (err) {
    return { error: { message: 'Something went wrong at the gate. Try again.' } };
  }
}

// End the session. Guards against a double-click firing two sign-outs.
let signingOut = false;
export async function signOut() {
  if (signingOut) return;
  signingOut = true;
  try { await supabase.auth.signOut(); }
  finally { signingOut = false; }
}

// The signed-in user, or null. One source for the "am I logged in?" gate.
export async function currentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? session.user : null;
  } catch (err) {
    return null;
  }
}

// The signed-in ruler's founded nation, or null. One source for "have I founded
// yet?" — used for routing and by the game home.
export async function currentNation() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { data: null, error: null };
    return await supabase.from('pp_nations').select('*').eq('user_id', session.user.id).maybeSingle();
  } catch (err) {
    return { data: null, error: { message: 'Could not load your nation.' } };
  }
}

// Found the caller's nation via the found_nation() RPC (side derived server-side;
// one per account). Returns { data, error }.
export async function foundNation({ people, realm, house }) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: { message: 'You must be logged in to found a nation.' } };
    return await supabase.rpc('pp_found_nation', { _people: people, _realm: realm, _house: house });
  } catch (err) {
    return { error: { message: 'Could not found your nation. Try again.' } };
  }
}

// Load the shared world map document (or null if none saved yet). Returns
// { data, error } where data is the row { data: <map jsonb> }.
export async function loadWorldMap() {
  try {
    return await supabase.from('pp_world_map').select('data').maybeSingle();
  } catch (err) {
    return { data: null, error: { message: 'Could not load the world map.' } };
  }
}

// Save the world map via the admin-gated RPC (checks the caller is the owner
// server-side). Returns { data, error }.
export async function saveWorldMap(map) {
  try {
    return await supabase.rpc('pp_save_world_map', { _data: map });
  } catch (err) {
    return { error: { message: 'Could not save the world map. Try again.' } };
  }
}

// Where a just-authenticated ruler belongs: the game home if they already have a
// nation, otherwise the founding flow. One source, used after login and sign-up.
export async function afterAuthDestination() {
  const { data } = await currentNation();
  return data ? '/home/' : '/found/';
}
