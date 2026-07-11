// regional.js — ONE source for a party's per-hex ("regional") approval, shared by the Party page's
// territory map and the Home hex-picker modal so both read the same number for the same hex.
//
// A party's approval in a hex = its national popularity + a per-region LEAN (a deterministic ±1..5-point
// swing, symmetric so the population-weighted amalgamation reconciles to the national figure) + any
// stored BIAS (policy awards / played cards, schema/163 party_hex_bias), clamped to 0..100.

// Deterministic hash → [0,1) (xmur3-style). Same string always gives the same value, so the regional
// lean is stable across page loads and matches server-agnostic display everywhere.
export function rand01(str) {
  var h = 1779033703 ^ str.length;
  for (var i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// The per-region swing of ±(1..5) points on a party's national approval — pure (no archetype), symmetric.
export function regionalLean(q, r, pid) {
  var k = q + ',' + r + ':' + pid;
  return (rand01(k + ':s') < 0.5 ? -1 : 1) * (1 + rand01(k) * 4);
}

// Stored per-region tilt (party_hex_bias) for one party at one hex; biasMap is { pid: { 'q,r': points } }.
export function regionalBias(q, r, pid, biasMap) {
  var b = biasMap && biasMap[pid];
  return (b && b[q + ',' + r]) || 0;
}

// A party's clamped approval in a hex. `party` needs { id, popularity }; biasMap is optional (default no bias).
export function regionalApproval(party, q, r, biasMap) {
  return Math.max(0, Math.min(100,
    (Number(party.popularity) || 0) + regionalLean(q, r, party.id) + regionalBias(q, r, party.id, biasMap)));
}
