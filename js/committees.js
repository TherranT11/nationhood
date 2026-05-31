// Shared committee metadata + the apply RPC wrapper. Two pages
// (committee.html + politician-nation.html) read these; without this
// module each one carried its own committee-key→display map and its
// own apply-RPC error mapping, which drifted (one page said "Defence"
// while the other said "Defense"). Source of truth lives here.

import { _supabase } from './supabase-client.js';

export const COMMITTEES = {
  defense_foreign_affairs: {
    name:     'Defence & Foreign Affairs',
    fullName: 'Defence & Foreign Affairs Committee',
    icon:     '⚔',
    desc:     'Oversees the military, foreign policy, and treaties. Reviews the Defence Ministry’s budget, scrutinises press claims, and ratifies settlements with foreign powers.',
  },
};

// Human messages for apply_for_committee rejection reasons. Server
// returns short tokens; UI alerts on the long form. Keys must match
// the reasons returned by the apply_for_committee RPC (20270455).
const APPLY_REJECT_HUMAN = {
  not_authenticated:   'You are not signed in.',
  no_politician:       'No politician faction found.',
  not_mp:              'Only Members of Parliament may apply.',
  committee_not_found: 'Committee not found.',
  wrong_nation:        'This committee is not in your nation.',
  already_member:      'You are already a member of this committee.',
  committee_cap:       'You are at the 2-committee cap.',
  vote_pending:        'An admission vote is already in progress.',
  no_open_seat:        'No open member seat on this committee right now.',
};

// Wraps the apply_for_committee RPC. Returns one of:
//   { success: true, data }            on success
//   { success: false, humanError }     on any failure (rejection or thrown)
// Callers handle UI state (button disable, navigation, alerts).
export async function applyForCommittee(committeeId) {
  try {
    const { data, error } = await _supabase.rpc('apply_for_committee', { p_committee_id: committeeId });
    if (error) return { success: false, humanError: error.message || 'Could not submit.' };
    if (!data?.success) {
      return { success: false, humanError: APPLY_REJECT_HUMAN[data.reason] || `Could not apply (${data.reason}).` };
    }
    return { success: true, data };
  } catch (err) {
    console.warn('applyForCommittee threw', err);
    return { success: false, humanError: 'Could not submit application. Try again.' };
  }
}
