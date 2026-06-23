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
  { key: 'com', name: 'Image',    abbr: 'Img' },   // 'com' = internal column key (legacy); displayed as Image
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

// Party funds (a raw currency amount) shown compactly: 375000 → "375K",
// 2_500_000 → "2.5M", 1_200_000_000 → "1.2B". Display only — prefix the nation's
// currency symbol at the call site. One source for the topbar pill and the party
// page's funds stat.
export function fmtFunds(value) {
  var n = Number(value) || 0, a = Math.abs(n);
  if (a >= 1e9) return (Math.round(n / 1e9 * 10) / 10) + 'B';
  if (a >= 1e6) return (Math.round(n / 1e6 * 10) / 10) + 'M';
  if (a >= 1e3) return (Math.round(n / 1e3 * 10) / 10) + 'K';
  return String(Math.round(n));
}

// Majority threshold for a chamber of N seats: floor(N/2)+1. One source for the
// client — MIRRORS public._majority() in schema/45 (an accepted JS↔SQL mirror).
export function majority(seats) {
  return Math.floor((Number(seats) || 0) / 2) + 1;
}

// Party inactivity (wall-clock). daysIdle() is the metric over parties.last_active_at
// (stamped server-side by _lock_party). The in-game dormancy warning shows from
// INACTIVE_WARN_DAYS; a party is eligible for admin removal from INACTIVE_DELETE_DAYS.
// ONE source for the home banner and the admin review.
export const INACTIVE_WARN_DAYS = 6;
export const INACTIVE_DELETE_DAYS = 7;
export function daysIdle(ts) {
  return ts ? Math.floor((Date.now() - new Date(ts).getTime()) / 86400000) : 0;
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

// A nation's CURRENT value for a declaration slot — the one source for "what is it
// now", shared by the Nation page and the declaration propose preview. The nation's
// own choice wins; otherwise a pick-list slot shows its ★ default, while a free-text
// identity slot (custom_allowed) stays '—' until declared (its ★ is only an example,
// not a shared default). `values` is the nation's declarations jsonb ({} when none).
export function declaredValue(slot, values) {
  var v = values && slot ? values[slot.slug] : null;
  if (v != null && v !== '') return v;
  if (slot && !slot.custom_allowed && (slot.options || [])[slot.default_index] != null) return slot.options[slot.default_index];
  return '—';
}

// The Head of Government title declaration slot (e.g. "Prime Minister"), the one
// place that knows its slug + columns — shared by the Government and World pages,
// each of which resolves it per-nation via declaredValue. Takes the supabase
// client so this module stays dependency-free. Non-critical: returns null on any
// failure, so callers fall back to the generic "Head of Government" label.
export async function loadHogTitleSlot(supabase) {
  try {
    const { data } = await supabase.from('declarations')
      .select('slug, options, default_index, custom_allowed')
      .eq('slug', 'head_of_government_title').maybeSingle();
    return data || null;
  } catch (e) { return null; }
}
