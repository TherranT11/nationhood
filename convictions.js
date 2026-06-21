// Shared conviction display helpers — used by the admin authoring preview (adminsetup)
// and the party manifesto (play/party), so the effect/trigger wording lives in ONE
// place. Targets mirror the policy effect targets; Party Popularity and Government
// Confidence are the percentage ones.

export const CONV_ROMAN = ['I', 'II', 'III', 'IV', 'V'];
export function convRoman(l) { return CONV_ROMAN[(l || 1) - 1] || l; }
export function isPctTarget(t) { return t === 'Party Popularity' || t === 'Government Confidence' || t === 'Popularity Ceiling'; }
function pos(v) { return (Number(v) || 0) >= 0 ? 'pos' : 'neg'; }

// "+3% Party Popularity" / "−10 Debt" — signed reward with a % only on the pct targets.
export function convReward(v, t) {
  var n = Number(v) || 0;
  return (n >= 0 ? '+' : '−') + Math.abs(n) + (isPctTarget(t) ? '%' : '') + ' ' + t;
}

// A conviction's on-adopt effects as [{ reward, cond, cls }] (cls: 'pos' | 'neg').
export function adoptLines(c) {
  return (c.onAdopt || []).map(function (e) { return { reward: convReward(e.v, e.t), cond: 'once', cls: pos(e.v) }; });
}

// Role gate suffix for a while-active effect: an effect scoped to government /
// opposition (e.when) reads its role; an unscoped effect adds nothing.
function whenLabel(w) { return w === 'gov' ? ' · while in government' : w === 'opp' ? ' · while in opposition' : ''; }

// A conviction's while-active effects as [{ reward, cond, cls }] — triggers expanded
// into their condition (plus the mirrored inverse when set), standings as held modifiers.
export function activeLines(c) {
  var out = [];
  (c.whileActive || []).forEach(function (e) {
    var role = whenLabel(e.when);
    if (e.kind === 'standing') { out.push({ reward: convReward(e.v, e.t), cond: 'while held' + role, cls: pos(e.v) }); return; }
    var dir = e.dir === 'rise' ? 'rises' : e.dir === 'fall' ? 'falls' : 'changes';
    var per = (e.per && e.per != 1) ? ('per ' + e.per + ' ' + e.stat) : 'each';
    out.push({ reward: convReward(e.rv, e.rt), cond: 'when ' + e.stat + ' ' + dir + ' · ' + per + role, cls: pos(e.rv) });
    if (e.sym && e.dir !== 'either') {
      var opp = e.dir === 'rise' ? 'falls' : 'rises';
      out.push({ reward: convReward(-e.rv, e.rt), cond: 'when ' + e.stat + ' ' + opp + role, cls: pos(-e.rv) });
    }
  });
  return out;
}

// Group conviction rows ({id, definition}) by level 1..5, each sorted by cost.
export function convsByLevel(rows) {
  var by = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  (rows || []).forEach(function (r) {
    var d = r.definition || {}, lvl = Math.min(5, Math.max(1, Number(d.level) || 1));
    by[lvl].push(r);
  });
  Object.keys(by).forEach(function (k) { by[k].sort(function (a, b) { return (a.definition.cost || 0) - (b.definition.cost || 0); }); });
  return by;
}
