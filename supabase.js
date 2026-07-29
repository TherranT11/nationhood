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
