// Shared pure helpers for reading an admin-authored policy definition — used by the
// admin authoring tool (adminsetup) and the player propose page so the option list,
// the default option, and the money scaling live in ONE place. These also MIRROR the
// server: policyOptions ↔ _policy_options (schema/90), policyDefaultIdx ↔ the default
// in _nation_policy_option (schema/92), policyMoney ↔ _policy_money (schema/91).

// A policy's option array: the 'spectrum' or 'binary' list, keyed by its own type.
export function policyOptions(def) {
  return (def && def.type === 'spectrum') ? (def.spectrum || []) : ((def && def.binary) || []);
}
// Its starting option index when a nation hasn't set one (spectrum→defaultIdx,
// binary→binDefault).
export function policyDefaultIdx(def) {
  return (def && def.type === 'spectrum') ? (def.defaultIdx || 0) : ((def && def.binDefault) || 0);
}
// The option index in force for a nation: its stored override for this policy, else
// the policy default. ONE source for "what's in force" — read by the propose page and
// the Policies slate; MIRRORS _nation_policy_option (schema/92). overrides is the
// nation.policies map (policyId → optionIdx); 0 is a valid override (not "unset").
export function policyOptionIdx(def, overrides, id) {
  var stored = overrides && overrides[id];
  return stored == null ? policyDefaultIdx(def) : +stored;
}
// Budget/Debt are money targets — their value scales by the nation's size/wealth.
export function isMoneyTarget(t) { return t === 'Budget' || t === 'Debt'; }
// Money scaling: flat = v; perm = v × pop(millions); pop = v × pop × prosperity/10.
export function policyMoney(v, scale, pop, pros) {
  if (scale === 'flat') return v;
  if (scale === 'perm') return v * pop;
  return v * pop * (pros / 10);
}
// One effect as display text for a nation context (pop in millions, prosperity 1–20;
// the same coalesce(pop,0)/coalesce(pros,10) the server applies). Returns
// { text, cad, cls } where cls is 'pos' | 'neg' | '' by direction.
export function effectText(e, pop, pros) {
  // 'once' on enactment; otherwise per tick — finite (dur>0) for that many months
  // after enactment, else for as long as the option is in force.
  var cad = e.cad === 'once' ? 'once' : (Number(e.dur) > 0 ? 'per tick · ' + Number(e.dur) + ' mo' : 'per tick');
  if (isMoneyTarget(e.t)) {
    var amt = policyMoney(Number(e.v) || 0, e.scale, Number(pop) || 0, Number(pros) || 10);
    return { text: e.t + ' ' + (amt >= 0 ? '+' : '−') + '₣' + Math.abs(amt).toFixed(2) + 'B',
             cad: cad, cls: amt > 0 ? 'pos' : amt < 0 ? 'neg' : '' };
  }
  var v = Number(e.v) || 0;
  return { text: e.t + ' ' + (v >= 0 ? '+' : '−') + Math.abs(v), cad: cad, cls: v > 0 ? 'pos' : v < 0 ? 'neg' : '' };
}
