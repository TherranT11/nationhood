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
export async function fetchPolicies() {
  return unwrap(await supabase.from('policies').select('id, definition').order('created_at')) || [];
}
// Does this party have a floor measure (status 'voting') it hasn't cast a vote on? ONE source
// for "is there something to vote on" — drives the Legislature nav dot.
export async function hasUnvotedFloorMeasure(nationId, partyId) {
  const props = unwrap(await supabase.from('proposals').select('id').eq('nation_id', nationId).eq('status', 'voting')) || [];
  if (!props.length) return false;
  const ids = props.map(function (p) { return p.id; });
  const votes = unwrap(await supabase.from('proposal_votes').select('proposal_id').eq('party_id', partyId).in('proposal_id', ids)) || [];
  const voted = {};
  votes.forEach(function (v) { voted[v.proposal_id] = true; });
  return ids.some(function (id) { return !voted[id]; });
}

// ---- mutations (server-authoritative RPCs) ----
export async function proposeDeclaration(slug, value, toFloor) {
  return unwrap(await supabase.rpc('propose_declaration', { p_slug: slug, p_value: value, p_to_floor: toFloor }));
}
// A policy bill goes to committee (schema/154), not straight to the floor. Returns { id, cost, … }
// so the caller can route to the committee page /play/legislature/committee/?id=<id>.
export async function proposeLaw(policyId, optionIdx, title, intro) {
  return unwrap(await supabase.rpc('propose_law', { p_policy: policyId, p_option: optionIdx,
    p_title: title || null, p_intro: intro || null }));
}
// Committee actions (schema/154).
export async function committeeEndorse(proposalId) { return unwrap(await supabase.rpc('committee_endorse', { p_proposal: proposalId })); }
export async function committeePush(proposalId)    { return unwrap(await supabase.rpc('committee_push',    { p_proposal: proposalId })); }
export async function committeePost(proposalId, body) { return unwrap(await supabase.rpc('committee_post', { p_proposal: proposalId, p_body: body })); }
// The monarchy special law: target 21 (proclaim a Constitutional Monarchy) or 20 (abolish it).
export async function proposeRegimeChange(target, toFloor) {
  return unwrap(await supabase.rpc('propose_regime_change', { p_target: target, p_to_floor: toFloor }));
}
// Electoral threshold bill: pct is one of 0/3/5/8/10/15 (the min vote share to win seats).
export async function proposeThreshold(pct, toFloor) {
  return unwrap(await supabase.rpc('propose_threshold', { p_pct: pct, p_to_floor: toFloor }));
}
// Parliamentary reform bills (schema/167): advance the next reform, or repeal the topmost
// enacted one. The Influence cost is charged server-side at proposal and not refunded on a
// failed vote. Returns { id, status, actions, cost } (or { status:'agenda', scheduled_tick } ).
export async function proposeReformAdvance(toFloor) {
  return unwrap(await supabase.rpc('propose_reform_advance', { p_to_floor: toFloor }));
}
export async function proposeReformRepeal(toFloor) {
  return unwrap(await supabase.rpc('propose_reform_repeal', { p_to_floor: toFloor }));
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

// Would this measure carry? DISPLAY mirror of _resolve_proposal (schema/81): an outright
// chamber majority (aye ≥ maj) carries now; otherwise a simple majority of seats cast
// (aye > nay) carries at close. A no-confidence motion is the exception — it carries UNLESS
// the government votes No. ONE source for the Legislature card and the bill page (the server
// stays authoritative for the actual resolution). Returns { outright, carry }.
export function proposalOutcome(aye, nay, maj, kind) {
  if (kind === 'no_confidence') return { outright: false, carry: true };
  var outright = aye > 0 && aye >= maj;
  return { outright: outright, carry: outright || (aye > nay && aye > 0) };
}

// Is the outcome already locked by an outright chamber majority, so it resolves on the NEXT
// tick rather than waiting out its floor window? DISPLAY mirror of _proposal_locked (schema/81),
// used only to label the card "resolves next tick": an outright Aye majority on any measure, or
// an outright Nay majority on a non-no-confidence one. The server stays the resolution authority.
export function proposalLocked(aye, nay, maj, kind) {
  if (!(maj >= 1)) return false;
  return aye >= maj || (kind !== 'no_confidence' && nay >= maj);
}
