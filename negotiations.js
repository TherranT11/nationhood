// Coalition negotiations — CLIENT-LOCAL store (localStorage), one list per player
// per browser. This is a deliberate first-cut: it lets the Negotiate flow work
// end-to-end before a server-side, multiplayer coalition model exists. Every
// caller goes through this module, so when the real (Supabase-backed) model
// lands there is ONE place to change. Not multiplayer and not shared across
// devices — by design, for now.

const KEY = 'nh_negotiations_v1';

function readStore() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
}
function writeStore(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage off/full — drop silently */ }
}

// Lists are keyed by the OWNING party id, so two players sharing a browser never
// see each other's talks.
export function loadNegotiations(partyId) {
  return readStore()[partyId] || [];
}
export function saveNegotiations(partyId, list) {
  var s = readStore(); s[partyId] = list; writeStore(s);
}
export function getNegotiation(partyId, id) {
  return loadNegotiations(partyId).filter(function (n) { return n.id === id; })[0] || null;
}

// Start a new negotiation seeded with one party at the table. Persists + returns it.
export function createNegotiation(partyId, firstPartyId) {
  var list = loadNegotiations(partyId);
  var neg = {
    id: 'neg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    created: Date.now(),
    invited: [firstPartyId],
    active: firstPartyId,
    tid: 1,                 // running id for terms within this negotiation
    data: {}
  };
  neg.data[firstPartyId] = { offering: [], requesting: [] };
  list.push(neg);
  saveNegotiations(partyId, list);
  return neg;
}

export function removeNegotiation(partyId, id) {
  saveNegotiations(partyId, loadNegotiations(partyId).filter(function (n) { return n.id !== id; }));
}

// Pure roll-up of a negotiation's terms across every party at the table.
export function termCounts(neg) {
  var agreed = 0, total = 0;
  (neg.invited || []).forEach(function (pid) {
    var d = neg.data[pid]; if (!d) return;
    d.offering.concat(d.requesting).forEach(function (t) { total++; if (t.status === 'agreed') agreed++; });
  });
  return { agreed: agreed, total: total };
}
