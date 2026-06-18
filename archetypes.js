// The ten party archetypes — the single source for the ideologies a party can
// pick (party-creation) and the colour every other view uses to render a party.
// parties.archetype stores the NAME (e.g. "Centrist").
export const ARCHETYPES = [
  { id: 'centrist',     name: 'Centrist',         color: '#64748b', desc: 'Pragmatic middle ground — balance the market and the state, govern by consensus.', icon: '<path d="M12 3v18"/><path d="M5 20h14"/><path d="M4 7h16"/><path d="M4 7l-2 5a3 3 0 006 0z"/><path d="M20 7l-2 5a3 3 0 006 0z"/>' },
  { id: 'conservative', name: 'Conservative',     color: '#243b6b', desc: 'Tradition, order, and a steady hand — protect institutions and the established way.', icon: '<path d="M3 9l9-5 9 5"/><path d="M3 20h18"/><path d="M6 9v11M10 9v11M14 9v11M18 9v11"/>' },
  { id: 'nationalist',  name: 'Nationalist',      color: '#1d4ed8', desc: 'Nation first — sovereignty, heritage, and strong borders.', icon: '<path d="M5 3v18"/><path d="M5 4h13l-3 5 3 5H5"/>' },
  { id: 'liberal',      name: 'Liberal',          color: '#c2890b', desc: 'Civic freedoms and open markets — individual rights and a pro-business state.', icon: '<circle cx="12" cy="7" r="3"/><path d="M5 21v-1a7 7 0 0114 0v1"/>' },
  { id: 'libertarian',  name: 'Libertarian',      color: '#ea580c', desc: 'Minimal government — maximum personal and economic liberty.', icon: '<circle cx="9" cy="9" r="4"/><path d="M12 12l8 8M16 16l2-2M19 19l2-2"/>' },
  { id: 'green',        name: 'Green',            color: '#1f9d57', desc: 'The environment above all — sustainability, conservation, and climate action.', icon: '<path d="M5 21c0-9 6-15 16-16-1 11-7 16-16 16z"/><path d="M9 17c1-5 4-8 8-10"/>' },
  { id: 'progressive',  name: 'Progressive',      color: '#7c3aed', desc: 'Reform and social justice — expand rights and remake the system.', icon: '<path d="M3 17l6-6 4 4 8-8"/><path d="M16 7h5v5"/>' },
  { id: 'agrarian',     name: 'Agrarian',         color: '#4d7c0f', desc: 'The land and its people — farmers, rural life, and food sovereignty.', icon: '<path d="M12 22v-9"/><path d="M12 13c0-3-2-6-6-6 0 4 3 6 6 6z"/><path d="M12 14c0-3 2-5 5-5 0 3-2 5-5 5z"/>' },
  { id: 'faith',        name: 'Faith / Religious', color: '#b45309', desc: 'Faith at the centre — a moral order rooted in religious tradition.', icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>' },
  { id: 'communist',    name: 'Communist',        color: '#c0341d', desc: 'Workers own the means — collective ownership and a planned economy.', icon: '<path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.4 1.4-6.3L3 9.5l6.4-.6z"/>' },
];

// Colour for a stored archetype NAME; neutral grey if it's unknown/missing.
export function archetypeColor(name) {
  var a = ARCHETYPES.filter(function (x) { return x.name === name; })[0];
  return a ? a.color : '#8d8d95';
}
