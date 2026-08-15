// Where a signed-in account belongs — the one place this decision is made,
// used by /login (after sign-in, and to skip the form if already signed in),
// /signup (after a sign-up that issues a session immediately), and /found
// (to gate the page: you must be signed in, and you must not already have a
// civilization — and it needs the user id either way for the insert, so it's
// returned here rather than making callers look it up a second time).
//
// Returns { dest, user }. dest is "/login", "/found", or "/" — never throws;
// a failed nations lookup falls back to "/" since RLS still protects the
// data either way and worst case a page's own guard re-checks and corrects
// course.
import { supabase } from './supabase.js';

export async function routeAfterAuth(){
  var user;
  try{
    var userRes = await supabase.auth.getUser();
    user = userRes.data && userRes.data.user;
  } catch(err){
    return { dest: "/login", user: null };
  }
  if(!user) return { dest: "/login", user: null };

  try{
    var res = await supabase.from("rf_nations").select("id").eq("user_id", user.id).maybeSingle();
    if(res.error) throw res.error;
    return { dest: res.data ? "/" : "/found", user: user };
  } catch(err){
    return { dest: "/", user: user };
  }
}
