// Coalition negotiations — the one client-side gateway to the server model in
// schema/45_negotiations.sql. Every page reads + mutates talks through here, so
// the rules (host authors terms, each side sets only its own agreement, open +
// invite cost an action) live server-side and there's a single place to change.

import { supabase } from '/supabase.js';

// One nested shape for a negotiation and everything hanging off it.
const SELECT = 'id, nation_id, host_party_id, status, created_at,' +
  ' negotiation_parties(party_id, status),' +
  ' negotiation_terms(id, party_id, side, type, params, redline, host_agreed, party_agreed, created_at)';

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

// Pending invites this party still has to answer (for the Home banner).
export function pendingInvites(all, myPartyId) {
  return all.filter(function (n) {
    return n.host_party_id !== myPartyId &&
      (n.negotiation_parties || []).some(function (p) { return p.party_id === myPartyId && p.status === 'invited'; });
  });
}
// Talks already in progress for this party — hosting, or invited-and-accepted.
export function activeTalks(all, myPartyId) {
  return all.filter(function (n) {
    if (n.host_party_id === myPartyId) return true;
    return (n.negotiation_parties || []).some(function (p) { return p.party_id === myPartyId && p.status === 'accepted'; });
  });
}

// Pure roll-up of a negotiation's terms: {agreed, total}. A term counts as agreed
// only when both sides have signed off.
export function termCounts(neg) {
  var agreed = 0, total = 0;
  (neg.negotiation_terms || []).forEach(function (t) { total++; if (t.host_agreed && t.party_agreed) agreed++; });
  return { agreed: agreed, total: total };
}

// ---- mutations (all server-authoritative RPCs) ----
export async function openNegotiation(targetId) { return unwrap(await supabase.rpc('coalition_open', { p_target: targetId })); }
export async function inviteParty(negId, targetId) { return unwrap(await supabase.rpc('coalition_invite', { p_neg: negId, p_target: targetId })); }
export async function respondInvite(negId, accept) { return unwrap(await supabase.rpc('coalition_respond', { p_neg: negId, p_accept: accept })); }
export async function addTerm(negId, partyId, side) { return unwrap(await supabase.rpc('coalition_add_term', { p_neg: negId, p_party: partyId, p_side: side })); }
export async function updateTerm(termId, type, params, redline) { return unwrap(await supabase.rpc('coalition_update_term', { p_term: termId, p_type: type, p_params: params, p_redline: redline })); }
export async function removeTerm(termId) { return unwrap(await supabase.rpc('coalition_remove_term', { p_term: termId })); }
export async function setAgree(termId, agreed) { return unwrap(await supabase.rpc('coalition_set_agree', { p_term: termId, p_agreed: agreed })); }
export async function removeParty(negId, partyId) { return unwrap(await supabase.rpc('coalition_remove_party', { p_neg: negId, p_party: partyId })); }
export async function commitAgreement(negId) { return unwrap(await supabase.rpc('coalition_commit', { p_neg: negId })); }
export async function withdrawAgreement(negId) { return unwrap(await supabase.rpc('coalition_withdraw', { p_neg: negId })); }
