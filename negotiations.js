// Coalition negotiations — the one client-side gateway to the server model in
// schema/45_negotiations.sql. Every page reads + mutates talks through here, so
// the rules (any seated party authors terms, each party signs only its own
// agreement, open + invite + commit cost an action) live server-side and there's
// a single place to change.

import { supabase } from '/supabase.js';

// One nested shape for a negotiation and everything hanging off it. Each term
// carries its author (party_id) and the set of parties that have agreed to it
// (negotiation_term_agreements) — consensus is computed from that set + the seats.
const SELECT = 'id, nation_id, host_party_id, status, created_at, objective_id,' +
  ' negotiation_parties(party_id, status),' +
  ' negotiation_terms(id, party_id, side, type, params, redline, created_at, negotiation_term_agreements(party_id))';

function unwrap(res) { if (res.error) throw new Error(res.error.message); return res.data; }

// Every live negotiation the signed-in player can see — active or committed, but
// not closed (RLS scopes this to the ones they host or were invited to). The two
// pure filters below split it.
export async function fetchNegotiations() {
  return unwrap(await supabase.from('negotiations').select(SELECT).neq('status', 'closed').order('created_at', { ascending: false })) || [];
}
export async function loadNegotiation(id) {
  return unwrap(await supabase.from('negotiations').select(SELECT).eq('id', id).maybeSingle());
}

// Talks already in progress for this party — hosting, or invited-and-accepted.
export function activeTalks(all, myPartyId) {
  return all.filter(function (n) {
    if (n.host_party_id === myPartyId) return true;
    return (n.negotiation_parties || []).some(function (p) { return p.party_id === myPartyId && p.status === 'accepted'; });
  });
}

// Every party seated at the table (host + accepted partners) — the set whose
// consensus a term needs. ONE definition, mirrored from _negotiation_seats in SQL.
export function seatIds(neg) {
  var ids = [neg.host_party_id];
  (neg.negotiation_parties || []).forEach(function (p) { if (p.status === 'accepted') ids.push(p.party_id); });
  return ids;
}

// The set of party ids that have agreed to a term.
export function termAgreedBy(term) {
  return (term.negotiation_term_agreements || []).map(function (a) { return a.party_id; });
}

// A term is fully agreed only when EVERY seated party has signed it.
export function termAgreed(neg, term) {
  var signed = termAgreedBy(term);
  return seatIds(neg).every(function (id) { return signed.indexOf(id) >= 0; });
}

// Pure roll-up of a negotiation's terms: {agreed, total}. A term counts as agreed
// only when every party at the table has signed off (full consensus).
export function termCounts(neg) {
  var total = (neg.negotiation_terms || []).length, agreed = 0;
  (neg.negotiation_terms || []).forEach(function (t) { if (termAgreed(neg, t)) agreed++; });
  return { agreed: agreed, total: total };
}

// ---- mutations (all server-authoritative RPCs) ----
export async function openNegotiation(targetId) { return unwrap(await supabase.rpc('coalition_open', { p_target: targetId })); }
export async function inviteParty(negId, targetId) { return unwrap(await supabase.rpc('coalition_invite', { p_neg: negId, p_target: targetId })); }
export async function respondInvite(negId, accept) { return unwrap(await supabase.rpc('coalition_respond', { p_neg: negId, p_accept: accept })); }
// Any seated party may author a term; the server records the caller as its author.
export async function addTerm(negId, side) { return unwrap(await supabase.rpc('coalition_add_term', { p_neg: negId, p_side: side })); }
export async function updateTerm(termId, type, params, redline) { return unwrap(await supabase.rpc('coalition_update_term', { p_term: termId, p_type: type, p_params: params, p_redline: redline })); }
export async function removeTerm(termId) { return unwrap(await supabase.rpc('coalition_remove_term', { p_term: termId })); }
export async function setAgree(termId, agreed) { return unwrap(await supabase.rpc('coalition_set_agree', { p_term: termId, p_agreed: agreed })); }
export async function removeParty(negId, partyId) { return unwrap(await supabase.rpc('coalition_remove_party', { p_neg: negId, p_party: partyId })); }
// An invited party walks away (−2% popularity to all at the table; server-enforced).
export async function leaveTalks(negId) { return unwrap(await supabase.rpc('coalition_leave', { p_neg: negId })); }
export async function commitAgreement(negId) { return unwrap(await supabase.rpc('coalition_commit', { p_neg: negId })); }
export async function withdrawAgreement(negId) { return unwrap(await supabase.rpc('coalition_withdraw', { p_neg: negId })); }
// Mid-term [Form Government]: a minority government's PM seats this committed
// coalition immediately (no election). Server-gated to that exact case.
export async function formGovernment(negId) { return unwrap(await supabase.rpc('coalition_form_government', { p_neg: negId })); }

// Pending invites for the Home banner: each of the caller's still-pending invites
// with its host + full invited roster (name + archetype), gathered in one scoped call.
export async function coalitionInvitesForMe() { return unwrap(await supabase.rpc('coalition_invites_for_me')) || []; }

// ---- coalition chat (per negotiation; participants only) ----
export async function fetchMessages(negId) {
  return unwrap(await supabase.from('negotiation_messages').select('id, party_id, body, created_at')
    .eq('negotiation_id', negId).order('created_at', { ascending: true })) || [];
}
export async function postMessage(negId, body) { return unwrap(await supabase.rpc('coalition_post_message', { p_neg: negId, p_body: body })); }
