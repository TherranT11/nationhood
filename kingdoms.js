// Shared helpers for the Kingdoms surface (/kingdoms, /kingdom-home, …). ONE source so the pages of this
// game can't drift on how a house name — or an escaped string — is rendered.

// HTML-escape for interpolation. Stronger than util.js's text-only esc (this also escapes quotes), kept
// separate so the Kingdoms pages don't depend on the main game's util.
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// A house name shown consistently as "House X" (the review card and the home top bar).
export const houseLabel = name => 'House ' + String(name || '').replace(/^\s*House\s+/i, '').trim();

// The house's Treasury — shown in the home top bar. These belong to the HOUSE (its lands and coffers).
// The AMOUNTS are granted server-side at founding (kingdoms_starting_resources) and stored on the house's
// `resources` jsonb — this is only how they show.
export const TREASURY_SPEC = [
  { key: 'gold',       label: 'Gold' },
  { key: 'population', label: 'Population' },
  { key: 'plots',      label: 'Available Plots' },
  { key: 'prestige',   label: 'House Prestige' }   // house standing; starts at 0
];

// The head of house's personal attributes — shown on the Head of House card, NOT the house top bar
// (they describe the lord, e.g. Everard, rather than the house). Same `resources` jsonb, same source.
export const LORD_STAT_SPEC = [
  { key: 'ambition',       label: 'Ambition' },        // from the Ambition priority
  { key: 'prowess',        label: 'Prowess' },
  { key: 'administration', label: 'Administration' }
];
