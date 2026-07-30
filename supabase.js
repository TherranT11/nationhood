// Shared Supabase browser client — one source of truth for the project URL and
// publishable key, and for the auth actions the app performs (sign up, sign in,
// sign out).
//
// The publishable key (sb_publishable_...) is SAFE to ship in client code:
// access is governed by Row Level Security in the database, not by hiding this
// key. Never put the secret (sb_secret_...) key here. Bundled from npm by Vite,
// so it ships minified + hashed with the app.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://enxrxbcozjlvktuummbw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-sTPXsMaU81zU-pJtktSpA_yR0tS8CM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Register a new citizen. The nickname rides along as auth metadata so the
// handle_new_user() trigger writes it into profiles atomically on sign-up — one
// round trip, never an auth user left without a profile. Returns { data, error }.
export function signUp({ email, password, nickname }) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname } },
  });
}

// Sign in an existing citizen. Returns { data, error }.
export function signIn({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password });
}

// End the session. Guards against a double-click firing two sign-outs; the
// caller handles navigation so this stays a plain, reusable action.
let signingOut = false;
export async function signOut() {
  if (signingOut) return;
  signingOut = true;
  try { await supabase.auth.signOut(); }
  finally { signingOut = false; }
}

// One source of truth for "is a citizen signed in?". The callback fires once on
// setup with the restored session (or null), then on every sign-in / sign-out,
// so the UI can reflect auth state without polling. Returns the subscription.
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session));
}

// The signed-in citizen's founded gens, or null (not signed in / no gens yet).
// One source for the "do I already have a gens?" routing check. Returns
// { data, error }; data is null when there's no character.
export async function currentCharacter() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { data: null, error: null };
    return await supabase
      .from('characters')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
  } catch (err) {
    return { data: null, error: { message: 'Could not load your character.' } };
  }
}

// Found the signed-in citizen's gens through the found_gens() RPC, which seeds
// the game-controlled stats server-side (the client can't forge them). One per
// account — a second attempt returns a 23505 error. Returns { data, error };
// wrapped so a network failure surfaces as a clean error instead of a throw.
export async function foundGens({ praenomen, nomen, priorities, birthplace }) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: { message: 'You must be logged in to found a gens.' } };
    return await supabase.rpc('found_gens', {
      _praenomen: praenomen, _nomen: nomen, _priorities: priorities, _birthplace: birthplace,
    });
  } catch (err) {
    return { error: { message: 'Could not found your gens. Try again.' } };
  }
}

// Rome's shared world state (one row). Returns { data, error }; data is null if
// it hasn't been seeded. One source for the city's stats.
export async function romeStats() {
  try {
    return await supabase
      .from('rome')
      .select('population, treasury, grain, unrest')
      .maybeSingle();
  } catch (err) {
    return { data: null, error: { message: 'Could not load Rome.' } };
  }
}
