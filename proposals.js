// Floor proposals + assembly voting — the one client gateway to the server model
// in schema/81_proposals.sql. Both the Legislature (voting) and Propose
// (declaration picker) pages read + mutate measures through here, so the rules
// (1 action to open a floor vote, seat-weighted tally) live server-side.

import { supabase } from '/supabase.js';

function unwrap(res) { if (res.error) throw new Error(res.error.message); return res.data; }

// ---- reads ----
export async function fetchDeclarations() {
  return unwrap(await supabase.from('declarations').select('*').order('sort_order').order('created_at')) || [];
}
export async function fetchProposals(nationId) {
  return unwrap(await supabase.from('proposals').select('*').eq('nation_id', nationId).order('created_at', { ascending: false })) || [];
}
export async function fetchVotes(proposalIds) {
  if (!proposalIds.length) return [];
  return unwrap(await supabase.from('proposal_votes').select('proposal_id, party_id, aye').in('proposal_id', proposalIds)) || [];
}

// ---- mutations (server-authoritative RPCs) ----
export async function proposeDeclaration(slug, value, toFloor) {
  return unwrap(await supabase.rpc('propose_declaration', { p_slug: slug, p_value: value, p_to_floor: toFloor }));
}
export async function proposalToFloor(id) { return unwrap(await supabase.rpc('proposal_to_floor', { p_proposal: id })); }
export async function castVote(id, aye) { return unwrap(await supabase.rpc('cast_floor_vote', { p_proposal: id, p_aye: aye })); }

// Pure seat tally for one proposal's votes — a DISPLAY mirror of _resolve_proposal's
// seat sums (the server stays authoritative for the actual pass/fail). seatsByParty:
// { party_id: seats }.
export function tallyVotes(votes, seatsByParty) {
  var aye = 0, nay = 0;
  votes.forEach(function (v) { var s = seatsByParty[v.party_id] || 0; if (v.aye) aye += s; else nay += s; });
  return { aye: aye, nay: nay };
}
