// The political slants a news outlet can carry — the ONE source for the whole News feature. Read by
// the admin Outlets + Headline-Rules editors and the player News page, so the vocabulary never drifts.
//   id     stored on the outlet (news_outlets.slant) and each headline
//   label  full reader-facing name (Outlets editor dropdown, player News page chip)
//   short  compact name for tight chips (Headline-Rules per-slant pills)
//   color  default brand tint for the slant
export const SLANTS = [
  { id: 'record',   label: 'Paper of Record', short: 'Record',   color: '#c9c9d4' },
  { id: 'state',    label: 'State Media',      short: 'State',    color: '#E0820E' },
  { id: 'left',     label: 'Left Wing',        short: 'Left',     color: '#e0575a' },
  { id: 'radleft',  label: 'Radical Left',     short: 'Rad Left', color: '#d64b8a' },
  { id: 'centre',   label: 'Centrist',         short: 'Centrist', color: '#6b5cff' },
  { id: 'right',    label: 'Right Wing',       short: 'Right',    color: '#3f9fe0' },
  { id: 'farright', label: 'Far Right',        short: 'Far Right',color: '#c99a3a' },
  { id: 'tabloid',  label: 'Tabloid',          short: 'Tabloid',  color: '#3fbf87' }
];

// The logo-colour swatches offered in the Outlets editor (the slant tints plus two extras).
export const PALETTE = ['#c9c9d4','#e0575a','#d64b8a','#6b5cff','#3f9fe0','#c99a3a','#3fbf87','#E0820E','#17b0b8','#e0494c'];

// A slant id → its full label (fallback 'Independent'). ONE lookup for the player News page.
export function slantLabel(id){ var s = SLANTS.filter(function (x) { return x.id === id; })[0]; return s ? s.label : 'Independent'; }
