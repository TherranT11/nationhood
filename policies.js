// Shared pure helpers for reading an admin-authored policy definition — used by the
// admin authoring tool (adminsetup) and the player propose page so the option list,
// the default option, and the money scaling live in ONE place. These also MIRROR the
// server: policyOptions ↔ _policy_options (schema/90), policyDefaultIdx ↔ the default
// in _nation_policy_option (schema/92), policyMoney ↔ _policy_money (schema/91).

// The stat vocabulary a policy EFFECT can target — the game's ministry stats (the same
// set the Government page groups as STAT_GROUPS). Policies author against these ahead of
// the stat backend, so effects are stored but not yet applied live. ONE source for the
// policy builder's stat picker. (Distinct from the live conviction/world-event target
// list, which still uses the current backend stat names until the models converge.)
export const POLICY_STATS = [
  'Budget Balance', 'Growth', 'Bureaucracy', 'Tax Burden', 'Interest Rates',
  'Crime', 'Immigration', 'Extremism', 'Unemployment', 'Poverty', 'Wages',
  'Prosperity', 'Press Freedom', 'Social Integration', 'Armed Forces Funding',
  'Military Research', 'Cybersecurity', 'Energy Availability', 'CO₂ Emissions', 'Global Warming'
];

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
// Budget/Debt/Income are money targets — their value scales by the nation's size/wealth.
export function isMoneyTarget(t) { return t === 'Budget' || t === 'Debt' || t === 'Income'; }
// Tax Burden % is now DERIVED server-side (schema/47 _nation_tax_burden, exposed via the
// nation_tax_burden RPC) — the ONE source the tick and the client share. The client reads
// it from that RPC rather than recomputing here.
// Money scaling: flat = v; perm = v × pop(millions); pop = v × pop × prosperity/10.
export function policyMoney(v, scale, pop, pros) {
  if (scale === 'flat') return v;
  if (scale === 'perm') return v * pop;
  return v * pop * (pros / 10);
}
// The annual ₣B factor for a money effect the fiscal summary annualizes: per-year ×1,
// permanent per-tick ×12, else 0 (one-time and finite-duration money fall through to the
// effects list with their own cadence). ONE predicate so the money summary and the effects
// filter agree — a money effect belongs in the fiscal block iff this is non-zero, and a
// standing effect belongs in the effects list iff it is zero.
export function fiscalFactor(e) {
  if (!isMoneyTarget(e.t)) return 0;
  return e.cad === 'year' ? 1 : (e.cad === 'tick' && !(Number(e.dur) > 0)) ? 12 : 0;
}
// { Income, Budget, Debt } annual ₣B for a nation being on this option's rung — its recurring
// money effects, annualized (fiscalFactor) and scaled to the nation (policyMoney). ONE source
// for the propose preview and the Legislature bill view.
export function optMoney(o, pop, pros) {
  var m = { Income: 0, Budget: 0, Debt: 0 };
  ((o && o.effects) || []).forEach(function (e) {
    var f = fiscalFactor(e); if (!f) return;
    m[e.t] += policyMoney(Number(e.v) || 0, e.scale, pop, pros) * f;
  });
  return m;
}
// The single net ₣B of a { Income, Budget, Debt } map: assets add, Debt (a liability) subtracts.
// ONE source for the "which money targets are a cost" convention — every net figure reads it.
export function moneyNet(m) { return m.Income + m.Budget - m.Debt; }
// The fiscal CHANGE from the rung in force to the proposed rung (proposed − current), per
// money target — what enacting the bill does to the budget. ONE source for both views.
export function fiscalDelta(curOpt, propOpt, pop, pros) {
  var cm = optMoney(curOpt, pop, pros), pm = optMoney(propOpt, pop, pros);
  return { Income: pm.Income - cm.Income, Budget: pm.Budget - cm.Budget, Debt: pm.Debt - cm.Debt };
}
// The recurring fiscal change as a SINGLE net ₣B/yr figure: Income + Budget − Debt (Debt is a
// liability, so more of it is a cost). ONE source for the "Net fiscal impact" line in the propose
// preview and the Legislature bill view.
export function fiscalNet(curOpt, propOpt, pop, pros) {
  return moneyNet(fiscalDelta(curOpt, propOpt, pop, pros));
}
// The up-front money an option applies once, netted to a single ₣B figure: its NON-recurring
// money effects (cadence 'once' or finite-duration — anything fiscalFactor leaves out), summed
// as Income + Budget − Debt (Debt is a liability, so it counts as a cost). Absolute (these fire
// on enactment regardless of the current rung), unlike the recurring fiscalDelta. ONE source for
// the "one-time cost" line so the recurring and one-time money never split across the preview.
export function optOneTimeMoney(o, pop, pros) {
  var m = { Income: 0, Budget: 0, Debt: 0 };
  ((o && o.effects) || []).forEach(function (e) {
    if (!isMoneyTarget(e.t) || fiscalFactor(e)) return;   // recurring money is the /year delta, not here
    m[e.t] += policyMoney(Number(e.v) || 0, e.scale, pop, pros);
  });
  return moneyNet(m);
}

// Two policy targets are scoped to the parties in government (schema/91 _apply_policy_effect),
// not all parties in the nation — so label them with that scope wherever a policy's effects are
// shown (the admin authoring tool and the player policy/propose views all read this one source).
// Display-only: the stored target value stays the canonical string, so existing policies keep
// matching. (Convictions reuse the same target list but scope to the adopting party, so they
// keep the plain names.)
var POL_TGT_LABEL = { 'Party Popularity': 'Party Popularity (parties in govt)',
                      'Popularity Ceiling': 'Popularity Ceiling (parties in govt)' };
export function polTgtLabel(t) { return POL_TGT_LABEL[t] || t; }

// One effect as display text for a nation context (pop in millions, prosperity 1–20;
// the same coalesce(pop,0)/coalesce(pros,10) the server applies). Returns
// { text, cad, cls } where cls is 'pos' | 'neg' | '' by direction.
export function effectText(e, pop, pros) {
  // 'once' on enactment; 'year' every January while in force; otherwise per tick —
  // finite (dur>0) for that many months after enactment, else while in force.
  var cad = e.cad === 'once' ? 'once'
          : e.cad === 'year' ? 'per year'
          : (Number(e.dur) > 0 ? 'per tick · ' + Number(e.dur) + ' mo' : 'per tick');
  if (isMoneyTarget(e.t)) {
    var amt = policyMoney(Number(e.v) || 0, e.scale, Number(pop) || 0, Number(pros) || 10);
    return { text: polTgtLabel(e.t) + ' ' + (amt >= 0 ? '+' : '−') + '₣' + Math.abs(amt).toFixed(2) + 'B',
             cad: cad, cls: amt > 0 ? 'pos' : amt < 0 ? 'neg' : '' };
  }
  var v = Number(e.v) || 0;
  return { text: polTgtLabel(e.t) + ' ' + (v >= 0 ? '+' : '−') + Math.abs(v), cad: cad, cls: v > 0 ? 'pos' : v < 0 ? 'neg' : '' };
}

// Trade Policy (definition.special === 'trade') rungs carry their STANDING modifiers — the
// import multiplier, tariff, and whether imports are open — outside the generic effects list,
// so the standard standing-effects render can't see them. These two helpers are the ONE source
// for "is this the trade policy" and for the human-readable line a rung's modifiers describe,
// shared by the Policies slate, the propose preview, and the Legislature bill view.
export function isTradePolicy(def) { return !!(def && def.special === 'trade'); }
export function tradeEffectText(o) {
  if (!o) return '';
  if (o.blocked) return 'Imports closed — no foreign trade.';
  var mult = Number(o.importMult); if (!(mult > 0)) mult = 1;
  var tariff = Math.max(0, Number(o.tariff) || 0);
  var parts = [mult === 1 ? 'Imports at the world rate' : 'Imports ×' + mult + ' the world rate'];
  if (tariff > 0) parts.push(tariff + '% tariff to the treasury');
  return parts.join(' · ') + '.';
}
