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

// GDP is stored as a number of BILLIONS (one source for the scale). Show it as
// "<n> Billion", or convert to trillions once it passes 999 billion. Display
// only — prefix the nation's currency symbol at the call site.
export function fmtGdp(value) {
  var n = Number(value) || 0;
  if (n > 999) return (Math.round(n / 1000 * 100) / 100) + ' Trillion'; // >999B → trillions, 2 dp
  return n.toLocaleString() + ' Billion';
}

// Population is stored as a number of MILLIONS. Show "<n> Million", rolling to
// Billion once it passes 999 million. Display only.
export function fmtPop(value) {
  var n = Number(value) || 0;
  if (n > 999) return (Math.round(n / 1000 * 100) / 100) + ' Billion'; // >999M → billions, 2 dp
  return n.toLocaleString() + ' Million';
}

// The game clock runs one tick per month, tick 1 = January 1980. One source for
// turning a tick number into its display date (e.g. 5 → "May, 1980"). MIRRORED by
// public.current_game_date() in schema/40_events.sql (which stamps events from the
// tick) — keep the two in sync if the calendar ever changes.
export function tickToDate(tick) {
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var n = Math.max(1, Math.round(Number(tick) || 1));
  return months[(n - 1) % 12] + ', ' + (1980 + Math.floor((n - 1) / 12));
}
