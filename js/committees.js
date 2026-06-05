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
  finance_budget: {
    name:     'Finance and Budget',
    fullName: 'Finance and Budget Committee',
    icon:     '$',
    desc:     'Reviews the national budget, scrutinises ministry spending, and shapes tax policy. Confirms the Finance Minister and signs off on the annual revenue and appropriations bills.',
  },
  judiciary_constitutional: {
    name:     'Judiciary & Constitutional Affairs',
    fullName: 'Judiciary & Constitutional Affairs Committee',
    icon:     '⚖',
    desc:     'Oversees the courts, confirms judicial appointments, and reviews proposed amendments to the Constitutional Charter. The first stop for any bill touching the Criminal or Civil Codes.',
  },
  industry_trade_labor: {
    name:     'Industry, Trade and Labor',
    fullName: 'Industry, Trade and Labor Committee',
    icon:     '⚒',
    desc:     'Sets industrial policy, regulates inter-corporate trade, and arbitrates labour standards. Confirms the Trade and Labour Ministers and reviews tariff schedules.',
  },
  interior_public_welfare: {
    name:     'Interior & Public Welfare',
    fullName: 'Interior & Public Welfare Committee',
    icon:     '⌂',
    desc:     'Oversees domestic affairs, immigration, social welfare, health, and education. Confirms the Interior, Health, and Education Ministers and reviews funding for public services.',
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
  committee_cap:       'You are at the 3-committee cap (members + pending applications).',
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
