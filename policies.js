// Shared pure helpers for reading an admin-authored policy definition — used by the
// admin authoring tool (adminsetup) and the player propose page so the option list,
// the default option, and the money scaling live in ONE place. These also MIRROR the
// server: policyOptions ↔ _policy_options (schema/90), policyDefaultIdx ↔ the default
// in _nation_policy_option (schema/92), policyMoney ↔ _policy_money (schema/91).

// The stat vocabulary a policy EFFECT can target — the game's ministry stats (the same
// set the Government page groups as STAT_GROUPS). Policies author against these ahead of
// the stat backend, so effects are stored but not yet applied live. ONE source for the
// policy builder's stat picker. (Distinct from the live world-event target list, which
// still uses the current backend stat names until the models converge.)
// The stats a policy effect can target (the policy-builder vocabulary). 'Regime' moves the nation's
// place on the 1–25 scale — applied server-side by _apply_policy_effect (schema/91, republic range
// only) — and is shown as the Government page's regime graph rather than a ministry-stat cell.
export const POLICY_STATS = [
  'Budget Balance', 'Growth', 'Bureaucracy', 'Tax Burden', 'Interest Rates',
  'Crime', 'Immigration', 'Extremism', 'Unemployment', 'Poverty', 'Wages',
  'Prosperity', 'Press Freedom', 'Social Integration', 'Armed Forces Funding',
  'Military Research', 'Cybersecurity', 'Energy Availability', 'CO₂ Emissions', 'Global Warming',
  'Rule of Law', 'Standard of Living', 'Housing Affordability',
  'Pension Quality', 'Equity Between Generations', 'Demographic Pressure', 'Birth Rate',
  'Education', 'Health', 'Innovation', 'Environment', 'Infrastructure', 'Regime'
];

// The valid input range for a ministry stat, where one is defined — used to bound the admin
// Edit-Nation inputs. Stats not listed here are left open. ONE source for the ranges.
export const STAT_RANGES = {
  'Pension Quality': { min: 1, max: 100 },
  'Equity Between Generations': { min: 1, max: 100 },
  'Demographic Pressure': { min: 1, max: 100 },
  'Birth Rate': { min: -50, max: 50 },
  'Education': { min: 1, max: 100 },
  'Health': { min: 1, max: 100 },
  'Innovation': { min: 1, max: 100 }
};

// The admin-typed ministry stats (the Edit Nation "Ministry Stats" grid). Derived from POLICY_STATS
// — one source — minus stats that are NOT typed in that grid: Budget Balance & Bureaucracy are
// COMPUTED from policy effects, and Regime lives on economy.regime (its own graph), so it's a
// policy-effect target but never a typed ministry field.
var NON_MINISTRY_STATS = ['Budget Balance', 'Bureaucracy', 'Regime'];
export const MINISTRY_STATS = POLICY_STATS.filter(function (s) { return NON_MINISTRY_STATS.indexOf(s) < 0; });

// A policy's vote-popularity reaction: how a party's popularity moves for how it votes on a
// proposed level change. def.popRaise is the swing per rung for voting to RAISE the policy
// (signed; negative = raising is unpopular). It scales by the rungs moved and flips for a drop;
// voting against is the mirror. ONE source for the propose preview and the Legislature bill view.
export function policyVotePopularity(def, fromIdx, toIdx) {
  var forVote = (Number(def && def.popRaise) || 0) * ((Number(toIdx) || 0) - (Number(fromIdx) || 0));
  return { forVote: forVote, againstVote: -forVote };
}

// The Influence a bill costs to propose: the policy's own authored base (definition.influence) scaled
// by how many rungs the change moves — N × (base + N − 1), N=|to−from| (min 1). ONE source (mirrors
// _proposal_cost in schema/154); read by the propose page's cost preview.
export function proposalInfluenceCost(base, fromIdx, toIdx) {
  var n = Math.max(1, Math.abs((Number(toIdx) || 0) - (Number(fromIdx) || 0)));
  return n * (Math.max(0, Number(base) || 0) + n - 1);
}

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
// The effect objects in force at a given option index — the ONE source for "what a policy is doing"
// at a rung. A spectrum is CUMULATIVE: being at level N accumulates every crossed level 1..N (the base
// level 0 has none), so rung C = the effects of B + C together. A binary uses its in-force state's
// effects. Trade policy carries its modifiers outside this list, so it returns none.
export function policyInForceEffects(def, optionIdx) {
  if (!def || isTradePolicy(def)) return [];
  var opts = policyOptions(def);
  if (!opts.length) return [];
  var idx = Math.max(0, Math.min(Number(optionIdx) || 0, opts.length - 1));
  var inForce = (def.type === 'spectrum') ? opts.slice(1, idx + 1) : [opts[idx]];
  var out = [];
  inForce.forEach(function (o) { ((o && o.effects) || []).forEach(function (e) { out.push(e); }); });
  return out;
}
// Aggregate a list of {t,v,unit} effects into one signed total per {t,unit}. Helper for the delta below.
function aggregateEffects(list) {
  var agg = [], pos = {};
  (list || []).forEach(function (e) {
    var key = e.t + '|' + (e.unit || '');
    if (pos[key] == null) { pos[key] = agg.length; agg.push({ t: e.t, v: 0, unit: e.unit }); }
    agg[pos[key]].v += (Number(e.v) || 0);
  });
  return agg;
}
// The NET change to each standing stat for a proposed rung move fromIdx → toIdx: the difference of
// cumulative in-force effects (policyInForceEffects(to) − policyInForceEffects(from)). Because each
// level's effect is the per-step increment, this reads a move DOWN as the reverse of the move UP —
// e.g. leaving a −3 rung (D) for a −1 rung (B) nets +2, not the target rung's absolute −1. ONE source
// for the propose + bill-view "standing effects" previews, mirroring the fiscal line's "vs the rung
// in force". Returns [{t, unit, v}] with v the signed net change (zero entries filtered by the caller).
export function policyEffectChange(def, fromIdx, toIdx) {
  var to = aggregateEffects(policyInForceEffects(def, toIdx));
  var from = aggregateEffects(policyInForceEffects(def, fromIdx));
  var pos = {}, out = [];
  to.forEach(function (e) { var k = e.t + '|' + (e.unit || ''); pos[k] = out.length; out.push({ t: e.t, unit: e.unit, v: e.v }); });
  from.forEach(function (e) { var k = e.t + '|' + (e.unit || ''); if (pos[k] == null) { pos[k] = out.length; out.push({ t: e.t, unit: e.unit, v: 0 }); } out[pos[k]].v -= e.v; });
  return out;
}
// One policy's in-force contribution to a given stat: the sum of that stat's cumulative in-force
// effects (policyInForceEffects). A 'gdp'-unit effect is amount% of GDP; a flat effect is as-is.
export function policyStatContribution(def, overrides, id, gdp, stat) {
  var sum = 0;
  policyInForceEffects(def, policyOptionIdx(def, overrides, id)).forEach(function (e) {
    if (e.t !== stat) return;
    var v = Number(e.v) || 0;
    sum += (e.unit === 'gdp') ? (v / 100) * (Number(gdp) || 0) : v;
  });
  return sum;
}
// Budget Balance ($bn/yr) is one such stat.
export function policyBudgetContribution(def, overrides, id, gdp) {
  return policyStatContribution(def, overrides, id, gdp, 'Budget Balance');
}
// The nation's total for a stat (Σ every policy's in-force contribution — all that ADD minus all
// that SUBTRACT), with the per-policy breakdown of the non-zero contributors ({name, amount}).
// policyRows = [{ id, definition }]; overrides = nation.policies; gdp = nation.gdp. ONE source for
// the top-bar / Budget page (Budget Balance) and the stat detail pages (e.g. Bureaucracy).
export function nationStatContributions(policyRows, overrides, gdp, stat) {
  var items = [], total = 0;
  (policyRows || []).forEach(function (r) {
    var amt = policyStatContribution(r.definition, overrides, r.id, gdp, stat);
    if (Math.abs(amt) >= 0.0001) { items.push({ name: (r.definition && r.definition.name) || 'Policy', amount: amt }); total += amt; }
  });
  return { total: total, items: items };
}
// Display label for an initiative's running Budget Balance cost: "$X B/yr" (flat) or "X% of GDP/yr" (a
// % of the enacting nation's GDP). ONE source for the wording — the builder preview, the home panel,
// and the joint composer all read this. `value` is the authored figure (flat $bn or the %); isPct is
// definition.budgetUnit === 'gdp'.
export function fmtInitiativeCost(value, isPct) {
  var v = Math.round((Number(value) || 0) * 10) / 10;
  return isPct ? (v + '% of GDP/yr') : ('$' + v + 'B/yr');
}
// The $bn/yr a running initiative costs its ENACTING nation — a flat figure, or a % of that nation's
// GDP (definition.budgetUnit === 'gdp'). ownerGdp is the enacting nation's GDP. ONE source (mirrors the
// gdp resolution in _nation_budget_balance).
export function initiativeYearlyCost(def, ownerGdp) {
  var v = Number(def && def.budgetPerYear) || 0;
  return (def && def.budgetUnit === 'gdp') ? (v / 100 * (Number(ownerGdp) || 0)) : v;
}
// A running national initiative is a STANDING Budget Balance cost (schema/141/152). A joint project
// splits it — the enacting nation bears (100 − partnerShare)%, the partner covers partnerShare%. This
// returns THIS nation's yearly cost as a positive number. ONE source (mirrors _nation_budget_balance).
export function initiativeBudgetAmount(def, partnerShare, isPartner, ownerGdp) {
  var y = initiativeYearlyCost(def, ownerGdp);
  var s = Math.max(0, Math.min(100, Number(partnerShare) || 0));
  return isPartner ? y * s / 100 : y * (100 - s) / 100;
}
// Active-initiative Budget Balance line items for a nation, each a COST (negative amount). rows =
// [{ def, partnerShare, isPartner, ownerGdp }] — the nation's own running initiatives plus any joint
// project it partners. Filters ~zero. ONE source for the Budget page list and the balance total below.
export function initiativeBudgetItems(rows) {
  var items = [];
  (rows || []).forEach(function (r) {
    var amt = initiativeBudgetAmount(r.def, r.partnerShare, r.isPartner, r.ownerGdp);
    if (Math.abs(amt) >= 0.0001) items.push({ name: (r.def && r.def.name) || 'Initiative', amount: -amt });
  });
  return items;
}
// The nation's full Budget Balance breakdown: every policy's contribution PLUS every running
// initiative's standing cost. ONE source for the top bar, Budget page and Government cell.
export function nationBudgetContributions(policyRows, overrides, gdp, initiativeRows) {
  var pol = nationStatContributions(policyRows, overrides, gdp, 'Budget Balance');
  var ini = initiativeBudgetItems(initiativeRows);
  var total = pol.total;
  ini.forEach(function (i) { total += i.amount; });
  return { total: total, items: pol.items.concat(ini) };
}
export function nationBudgetBalance(policyRows, overrides, gdp, initiativeRows) {
  return nationBudgetContributions(policyRows, overrides, gdp, initiativeRows).total;
}

// Budget/Debt/Income are money targets — their value scales by the nation's size/wealth.
export function isMoneyTarget(t) { return t === 'Budget' || t === 'Debt' || t === 'Income'; }
// Tax Burden % is now DERIVED server-side (schema/47 _nation_tax_burden, exposed via the
// nation_tax_burden RPC) — the ONE source the tick and the client share. The client reads
// it from that RPC rather than recomputing here.
// Money scaling: flat = v; perm = v × pop(millions); pop = v × pop × prosperity/50
// (prosperity is on the 1..100 scale — 50 is the neutral midpoint, so a mid nation scales ×1).
export function policyMoney(v, scale, pop, pros) {
  if (scale === 'flat') return v;
  if (scale === 'perm') return v * pop;
  return v * pop * (pros / 50);
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
// matching.
var POL_TGT_LABEL = { 'Party Popularity': 'Party Popularity (parties in govt)',
                      'Popularity Ceiling': 'Popularity Ceiling (parties in govt)' };
export function polTgtLabel(t) { return POL_TGT_LABEL[t] || t; }

// One effect as display text for a nation context (pop in millions, prosperity 1–100;
// the same coalesce(pop,0)/coalesce(pros,50) the server applies). Returns
// { text, cad, cls } where cls is 'pos' | 'neg' | '' by direction.
export function effectText(e, pop, pros) {
  // New-model effects (no cadence) are one-time transition changes — applied when the policy
  // changes state/level, NOT per tick — so a missing cad reads "on change". Legacy cadenced
  // effects keep their timing: 'once' on enactment; 'year' every January; else per tick
  // (finite for dur months after enactment, else while in force).
  var cad = e.cad == null ? 'on change'
          : e.cad === 'once' ? 'once'
          : e.cad === 'year' ? 'per year'
          : (Number(e.dur) > 0 ? 'per tick · ' + Number(e.dur) + ' mo' : 'per tick');
  if (isMoneyTarget(e.t)) {
    var amt = policyMoney(Number(e.v) || 0, e.scale, Number(pop) || 0, Number(pros) || 50);
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
