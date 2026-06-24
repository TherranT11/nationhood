// forum.js — data access for the Forum (boards / threads / posts). Thin wrappers over
// supabase; all writes go through the server RPCs (which snapshot author identity).
import { supabase } from '/supabase.js';

function unwrap(res) { if (res.error) throw new Error(res.error.message); return res.data; }

// The fixed board set (seeded server-side). Returned sorted; each row carries
// key, realm, name, descr, icon (svg markup), sys.
export async function fetchBoards() {
  return unwrap(await supabase.from('forum_boards').select('*').order('sort')) || [];
}

// Threads in the given boards, newest activity first. nationId (optional) filters IC
// threads to one nation.
export async function fetchThreads(boardKeys, nationId) {
  if (!boardKeys.length) return [];
  let q = supabase.from('forum_threads').select('*').in('board', boardKeys)
    .order('bumped_at', { ascending: false }).limit(200);
  if (nationId) q = q.eq('nation_id', nationId);
  return unwrap(await q) || [];
}

// Posts-per-thread for the given thread ids (replies = posts − 1, since the opening
// post is the thread's first post). Derived live — no denormalised counter to drift.
export async function postCounts(threadIds) {
  var out = {};
  if (!threadIds.length) return out;
  var rows = unwrap(await supabase.from('forum_posts').select('thread_id').in('thread_id', threadIds)) || [];
  rows.forEach(function (r) { out[r.thread_id] = (out[r.thread_id] || 0) + 1; });
  return out;
}

export async function fetchThread(id) {
  return unwrap(await supabase.from('forum_threads').select('*').eq('id', id).maybeSingle());
}
export async function fetchPosts(threadId) {
  return unwrap(await supabase.from('forum_posts').select('*').eq('thread_id', threadId).order('created_at')) || [];
}

export async function postThread(board, title, body) {
  return unwrap(await supabase.rpc('forum_post_thread', { p_board: board, p_title: title, p_body: body }));
}
export async function postReply(threadId, body) {
  return unwrap(await supabase.rpc('forum_post_reply', { p_thread: threadId, p_body: body }));
}
// (Setting the nickname is wired in the shared topbar gear, which calls set_handle directly.)

// Relative "2h" / "40m" / "3d" style age from a timestamp — matches the mockup.
export function ago(ts) {
  if (!ts) return '';
  var s = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  if (s < 86400 * 30) return Math.floor(s / 86400) + 'd';
  return Math.floor(s / (86400 * 30)) + 'mo';
}
