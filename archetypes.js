// The party archetypes (ideologies) — the single source for the ideology a party
// takes on (by adopting its first conviction) and the colour every view uses to
// render a party. parties.archetype stores the NAME (e.g. "Conservative").
export const ARCHETYPES = [
  { id: 'globalist',    name: 'Globalist',        color: '#0891b2', desc: 'Open borders and global cooperation — free movement, free trade, and strong international institutions.', icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>' },
  { id: 'conservative', name: 'Conservative',     color: '#243b6b', desc: 'Tradition, order, and a steady hand — protect institutions and the established way.', icon: '<path d="M3 9l9-5 9 5"/><path d="M3 20h18"/><path d="M6 9v11M10 9v11M14 9v11M18 9v11"/>' },
  { id: 'nationalist',  name: 'Nationalist',      color: '#1d4ed8', desc: 'Nation first — sovereignty, heritage, and strong borders.', icon: '<path d="M5 3v18"/><path d="M5 4h13l-3 5 3 5H5"/>' },
  { id: 'liberal',      name: 'Liberal',          color: '#c2890b', desc: 'Civic freedoms and open markets — individual rights and a pro-business state.', icon: '<circle cx="12" cy="7" r="3"/><path d="M5 21v-1a7 7 0 0114 0v1"/>' },
  { id: 'libertarian',  name: 'Libertarian',      color: '#ea580c', desc: 'Minimal government — maximum personal and economic liberty.', icon: '<circle cx="9" cy="9" r="4"/><path d="M12 12l8 8M16 16l2-2M19 19l2-2"/>' },
  { id: 'green',        name: 'Green',            color: '#1f9d57', desc: 'The environment above all — sustainability, conservation, and climate action.', icon: '<path d="M5 21c0-9 6-15 16-16-1 11-7 16-16 16z"/><path d="M9 17c1-5 4-8 8-10"/>' },
  { id: 'progressive',  name: 'Progressive',      color: '#7c3aed', desc: 'Reform and social justice — expand rights and remake the system.', icon: '<path d="M3 17l6-6 4 4 8-8"/><path d="M16 7h5v5"/>' },
  { id: 'social-democratic', name: 'Social Democratic', color: '#e11d48', desc: 'A strong welfare state within a market economy — unions, public services, and steady reform.', icon: '<path d="M12 21C7 17 3 13 3 8.5A4.5 4.5 0 0112 5a4.5 4.5 0 019 3.5C21 13 17 17 12 21z"/>' },
  { id: 'agrarian',     name: 'Agrarian',         color: '#4d7c0f', desc: 'The land and its people — farmers, rural life, and food sovereignty.', icon: '<path d="M12 22v-9"/><path d="M12 13c0-3-2-6-6-6 0 4 3 6 6 6z"/><path d="M12 14c0-3 2-5 5-5 0 3-2 5-5 5z"/>' },
  { id: 'faith',        name: 'Faith / Religious', color: '#b45309', desc: 'Faith at the centre — a moral order rooted in religious tradition.', icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>' },
  { id: 'communist',    name: 'Communist',        color: '#c0341d', desc: 'Workers own the means — collective ownership and a planned economy.', icon: '<path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.4 1.4-6.3L3 9.5l6.4-.6z"/>' },
];

// Colour for a stored archetype NAME; neutral grey if it's unknown/missing.
export function archetypeColor(name) {
  var a = ARCHETYPES.filter(function (x) { return x.name === name; })[0];
  return a ? a.color : '#8d8d95';
}

// A party's display colour: its chosen colour, else its archetype default. ONE
// source for the crest, assembly bar/legend, rival cards, and the page accent.
export function partyColor(party) {
  return (party && party.color) || archetypeColor(party && party.archetype);
}

// A party's ideology LABEL for display: its archetype, or "No Ideology" until it
// adopts its first conviction (which sets the archetype). ONE source for every
// sidebar subtitle, party card, and roster list across the app, so a party with no
// ideology reads the same everywhere.
export function ideologyLabel(party) {
  return (party && party.archetype) || 'No Ideology';
}

// Hard ideological oppositions. Two archetypes are "opposite poles" when their
// core commitments contradict — a coalition partner on the opposite pole costs
// the forming government confidence (see the government-formation design). Listed
// ONCE as unordered pairs of archetype NAMES; the lookup is derived from these so
// the relation is always symmetric. Agrarian, Globalist, and Social Democratic
// appear in no pair — they pay no contradiction penalty with anyone (the universal
// coalition glue). Add pairs here if those ideologies should clash with others.
const OPPOSED_PAIRS = [
  ['Communist', 'Libertarian'],          // total planning vs. minimal state
  ['Communist', 'Liberal'],              // planned economy vs. open markets
  ['Communist', 'Conservative'],         // revolution vs. tradition & order
  ['Communist', 'Nationalist'],          // internationalism vs. nation-first
  ['Communist', 'Faith / Religious'],    // materialist atheism vs. religious order
  ['Libertarian', 'Faith / Religious'],  // personal liberty vs. moral legislation
  ['Libertarian', 'Green'],              // deregulation vs. environmental regulation
  ['Progressive', 'Conservative'],       // reform vs. tradition
  ['Progressive', 'Faith / Religious'],  // secular rights vs. religious morality
  ['Progressive', 'Nationalist'],        // cosmopolitan reform vs. nation-first
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

// Do two archetype NAMES sit on opposite ideological poles? Used by coalition
// formation to penalise confidence per contradictory partner. Order-independent;
// a party never opposes itself; an unknown/missing name opposes nothing.
export function opposes(a, b) {
  return !!(a && b && OPPOSITION[a] && OPPOSITION[a].indexOf(b) >= 0);
}
