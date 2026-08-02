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
