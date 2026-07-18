// admin-auth.js — ONE source for the client-side admin gate, shared by /adminsetup and /backend.
// This is only the UI-side convenience (which view to show); the REAL gate is the is_admin() RLS
// policy (schema/10). If you move the admin account, change the address in BOTH places.
import { supabase } from '/supabase.js';

export const ADMIN_EMAIL = 'therrant@gmail.com';
export function isAdmin(user) { return !!user && (user.email || '').toLowerCase() === ADMIN_EMAIL; }

// The current session + whether it's the admin. Never throws (returns a safe default on error).
export async function getAdminState() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return { session, isAdmin: !!session && isAdmin(session.user) };
  } catch (e) { return { session: null, isAdmin: false }; }
}

export function adminSignIn(email, password) { return supabase.auth.signInWithPassword({ email, password }); }
export function adminSignOut() { return supabase.auth.signOut(); }
