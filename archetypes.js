// The party ideologies — the single source for the ideology a party declares and the
// colour every view uses to render a party. parties.archetype stores the NAME (e.g. "Far Left").
//
// This is the 7-axis ideology taxonomy: a five-point Left↔Right spectrum plus two off-axis
// poles (Libertarian, Green). Each ideology carries the national CONDITIONS that feed ("bump")
// or bleed ("drop") its Party Approval while it sits in OPPOSITION — the "approval winds" the
// server applies each tick (schema/233). The condition list here is the DISPLAY source (the
// ideology modal renders these chips); the mechanic reads the mirrored ideology_conditions
// table (schema/232). KEEP THE TWO IN SYNC — edit both together.
//
// A condition is { stat, dir } where dir is 'HIGH' (the stat sitting above the neutral band
// helps) or 'LOW' (below the band helps). stat names are canonical POLICY_STATS (policies.js).
export const ARCHETYPES = [
  { id: 'far-left', name: 'Far Left', color: '#b5342c',
    quote: 'The system itself is the enemy; misery is the proof.',
    bump: [{ stat: 'Poverty', dir: 'HIGH' }, { stat: 'Unemployment', dir: 'HIGH' }],
    drop: [{ stat: 'Prosperity', dir: 'HIGH' }, { stat: 'Standard of Living', dir: 'HIGH' }] },
  { id: 'left', name: 'Left', color: '#e07a5c',
    quote: 'The system can be fixed — tax it, fund it, protect the worker.',
    bump: [{ stat: 'Wages', dir: 'LOW' }, { stat: 'Health', dir: 'LOW' }],
    drop: [{ stat: 'Prosperity', dir: 'HIGH' }, { stat: 'Extremism', dir: 'HIGH' }] },
  { id: 'center', name: 'Center', color: '#9c9cb5',
    quote: 'Steady hands, sound money, no adventures.',
    bump: [{ stat: 'Prosperity', dir: 'HIGH' }, { stat: 'Rule of Law', dir: 'HIGH' }],
    drop: [{ stat: 'Inflation', dir: 'HIGH' }, { stat: 'Extremism', dir: 'HIGH' }] },
  { id: 'right', name: 'Right', color: '#4a7dc9',
    quote: "Order, tradition, and an honest day's market.",
    bump: [{ stat: 'Crime', dir: 'HIGH' }, { stat: 'Immigration', dir: 'HIGH' }],
    drop: [{ stat: 'Unemployment', dir: 'HIGH' }, { stat: 'Wages', dir: 'LOW' }] },
  { id: 'far-right', name: 'Far Right', color: '#2c3f8a',
    quote: 'The nation betrayed; the strongman waiting.',
    bump: [{ stat: 'Immigration', dir: 'HIGH' }, { stat: 'National Pride', dir: 'LOW' }],
    drop: [{ stat: 'Social Integration', dir: 'HIGH' }, { stat: 'Prosperity', dir: 'HIGH' }] },
  { id: 'libertarian', name: 'Libertarian', color: '#f0c53c',
    quote: 'The state is the problem, in every sentence.',
    bump: [{ stat: 'Tax Burden', dir: 'HIGH' }, { stat: 'Bureaucracy', dir: 'HIGH' }],
    drop: [{ stat: 'Crime', dir: 'HIGH' }, { stat: 'Revolt Risk', dir: 'HIGH' }] },
  { id: 'green', name: 'Green', color: '#3ecf8e',
    quote: 'The ledger nobody else is keeping.',
    bump: [{ stat: 'Environment', dir: 'LOW' }, { stat: 'CO₂ Emissions', dir: 'HIGH' }],
    drop: [{ stat: 'Unemployment', dir: 'HIGH' }, { stat: 'Poverty', dir: 'HIGH' }] },
];

// Colour for a stored ideology NAME; neutral grey if it's unknown/missing.
export function archetypeColor(name) {
  var a = ARCHETYPES.filter(function (x) { return x.name === name; })[0];
  return a ? a.color : '#8d8d95';
}

// The ideology object for a stored NAME (or null). Used by the ideology modal + card.
export function ideologyByName(name) {
  return ARCHETYPES.filter(function (x) { return x.name === name; })[0] || null;
}

// A party's display colour: its chosen colour, else its ideology default. ONE
// source for the crest, assembly bar/legend, rival cards, and the page accent.
export function partyColor(party) {
  return (party && party.color) || archetypeColor(party && party.archetype);
}

// A party's ideology LABEL for display: its declared ideology, or "No Ideology" until it
// declares one (which sets the archetype). ONE source for every sidebar subtitle, party
// card, and roster list across the app, so an undeclared party reads the same everywhere.
export function ideologyLabel(party) {
  return (party && party.archetype) || 'No Ideology';
}

// Hard ideological oppositions — an uneasy coalition pairing (the government-formation
// design penalises confidence per contradictory partner). On the Left↔Right spectrum two
// ideologies clash when they sit three or more steps apart; the off-axis poles clash where
// their creeds directly contradict (Libertarian's minimal state vs. the redistributive left;
// Green's environmentalism vs. the Far Right's industrial nationalism). Center is the
// universal glue — it opposes no one. Listed ONCE as unordered NAME pairs; the lookup is
// derived so the relation is symmetric.
const OPPOSED_PAIRS = [
  ['Far Left', 'Right'],          // revolutionary left vs. market right (3 apart)
  ['Far Left', 'Far Right'],      // opposite extremes (4 apart)
  ['Left', 'Far Right'],          // social democracy vs. the strongman (3 apart)
  ['Far Left', 'Libertarian'],    // total collectivism vs. the minimal state
  ['Left', 'Libertarian'],        // tax-and-fund vs. deregulation
  ['Green', 'Far Right'],         // ecological limits vs. industrial nationalism
];

// name → array of opposing names, built once from OPPOSED_PAIRS (symmetric).
const OPPOSITION = (function () {
  var m = {};
  OPPOSED_PAIRS.forEach(function (p) {
    (m[p[0]] = m[p[0]] || []).push(p[1]);
    (m[p[1]] = m[p[1]] || []).push(p[0]);
  });
  return m;
})();

// Do two ideology NAMES sit on opposite poles? Used by coalition formation to penalise
// confidence per contradictory partner. Order-independent; a party never opposes itself;
// an unknown/missing name opposes nothing.
export function opposes(a, b) {
  return !!(a && b && OPPOSITION[a] && OPPOSITION[a].indexOf(b) >= 0);
}
