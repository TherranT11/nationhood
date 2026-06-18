// Shared client-side helpers and game constants. One source for small utilities
// that several self-contained pages would otherwise each redefine.

// Escape a string for safe interpolation into innerHTML (player-supplied text).
export function esc(s) {
  return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
}

// Hard cap on parties per nation — shown on nation-select and enforced in
// party-creation. One constant so the display and the guard can never disagree.
export const MAX_PARTIES_PER_NATION = 8;

// The five politician competencies — the ordered source for every place that
// shows or rolls a politician's stats: key = db column, name = full label,
// abbr = compact column header.
export const COMPETENCIES = [
  { key: 'cha', name: 'Charisma', abbr: 'Cha' },
  { key: 'acu', name: 'Acumen',   abbr: 'Acu' },
  { key: 'gui', name: 'Guile',    abbr: 'Gui' },
  { key: 'res', name: 'Resolve',  abbr: 'Res' },
  { key: 'com', name: 'Command',  abbr: 'Com' },
];
