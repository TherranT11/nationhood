// Where a signed-in account belongs — the one place this decision is made,
// used by /login (after sign-in, and to skip the form if already signed in),
// /signup (after a sign-up that issues a session immediately), and /found
// and /found/seat (to gate the page: you must be signed in, and you must
// not already have a civilization — and it needs the user id either way for
// the insert, so it's returned here rather than making callers look it up a
// second time).
//
// Returns { dest, user }. dest is "/login", "/found", or "/" — never throws
// and never hangs: a failed nations lookup falls back to "/" since RLS still
// protects the data either way, and every network step is bounded by
// withTimeout() so a stalled request can't strand a page on a loading state
// forever (this is deliberately getSession(), which reads the just-persisted
// local session, rather than getUser(), which re-validates over the network
// on every call — a stall there was seen stranding a visitor on "Checking
// your session…" right after a real sign-in).
import { supabase } from './supabase.js';

var TIMEOUT_MS = 8000;

function withTimeout(promise){
  return new Promise(function(resolve){
    var timer = setTimeout(function(){ resolve(null); }, TIMEOUT_MS);
    promise.then(function(v){ clearTimeout(timer); resolve(v); })
           .catch(function(){ clearTimeout(timer); resolve(null); });
  });
}

export async function routeAfterAuth(){
  var user;
  try{
    var sessionRes = await withTimeout(supabase.auth.getSession());
    if(sessionRes === null) throw new Error("timed out");
    user = sessionRes.data && sessionRes.data.session && sessionRes.data.session.user;
  } catch(err){
    return { dest: "/login", user: null };
  }
  if(!user) return { dest: "/login", user: null };

  try{
    var res = await withTimeout(supabase.from("rf_nations").select("id").eq("user_id", user.id).maybeSingle());
    if(res === null) throw new Error("timed out");
    if(res.error) throw res.error;
    return { dest: res.data ? "/" : "/found", user: user };
  } catch(err){
    return { dest: "/", user: user };
  }
}
