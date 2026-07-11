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

// Party inactivity (wall-clock) over parties.last_active_at (stamped by _lock_party on every
// action; any action revives the party). Three thresholds, ALL derived from that one timestamp
// — no stored flag to drift. An early nudge shows from INACTIVE_WARN_DAYS; at INACTIVE_DAYS the
// party is inactive and sits out elections (resolve_election, schema/60); at INACTIVE_DELETE_DAYS
// the 8-hour tick deletes it and its politicians, freeing the nation slot (_purge_inactive_parties,
// schema/97). These day counts MIRROR those SQL thresholds — keep the two in sync.
export const INACTIVE_WARN_DAYS = 6;
export const INACTIVE_DAYS = 7;
export const INACTIVE_DELETE_DAYS = 21;
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
// ECONOMY — MIRRORS supabase/schema/113. The four annual demands and the settling
// window. economyPeriod is the year of the next June deadline (Jul–Dec settle next
// year's June; Jan–Jun settle this year's), so a nation's demands.year < the period
// means nothing's been settled for the current window yet. economyNeed gives the size
// of one demand from the nation's live state — units for food/goods/services, and the
// upkeep COST in Budget for military. Server is authority; these only render the page.
export function economyPeriod(tick) {
  var n = Math.max(1, Math.round(Number(tick) || 1));
  var month = ((n - 1) % 12) + 1;
  return 1980 + Math.floor((n - 1) / 12) + (month > 6 ? 1 : 0);
}
// Produce action — MIRRORS schema/113 economy_produce: 5 AP, 12-tick cooldown.
export const PRODUCE_COST = 5;
export const PRODUCE_COOLDOWN = 12;
export function economyNeed(resource, nation) {
  var stats = (nation && nation.stats) || {}, on = (nation && nation.on_hand) || {};
  switch (resource) {
    case 'food':     return Math.max(1, Math.ceil((Number(nation && nation.population) || 0) / 50));
    case 'goods':    return Math.ceil((Number(stats.prosperity) || 0) / 10);
    case 'services': return Math.ceil((Number(stats.welfare) || 0) / 10);
    case 'military': return Number(on.military) || 0;
    default:         return 0;
  }
}

// WORLD MARKETS — MIRRORS supabase/schema/114. A resource's world price = its base
// price × a scarcity multiplier, clamped to [$1, $25]. The tier is production ÷ demand
// for that resource; only Food/Goods/Services have a unit demand, so the rest read
// Normal. Server is authority (the import RPC recomputes); these render the page.
export const RESOURCE_BASE = { energy: 5, food: 3, minerals: 3, goods: 5, services: 5, military: 15 };
export const TIER_MULT  = { glut: 0.7, normal: 1.0, tight: 1.3, scarce: 1.6, crisis: 2.0 };
export const TIER_LABEL = { glut: 'Glut', normal: 'Normal', tight: 'Tight', scarce: 'Scarce', crisis: 'Crisis' };
export function worldTier(resource, nations) {
  if (resource !== 'food' && resource !== 'goods' && resource !== 'services') return 'normal';
  var prod = 0, dem = 0;
  (nations || []).forEach(function (n) {
    prod += Number((n.production || {})[resource]) || 0;
    dem  += economyNeed(resource, n);
  });
  if (dem <= 0) return 'normal';
  var r = prod / dem;
  return r < 0.5 ? 'crisis' : r < 0.8 ? 'scarce' : r < 1.1 ? 'tight' : r < 1.6 ? 'normal' : 'glut';
}
export function worldPrice(resource, nations) {
  var base = RESOURCE_BASE[resource] || 0, mult = TIER_MULT[worldTier(resource, nations)] || 1;
  return Math.max(1, Math.min(25, Math.round(base * mult * 10) / 10));
}

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

// The display label for an admin event's structured effect (e.g. "Order −2",
// "Budget +$12B"). One source for the admin composer/feed and the player feed, so
// the pill always reads the same in both. Budget/Debt are money (billions) and take
// the nation's currency symbol; every other target is a plain signed number.
export function eventEffectLabel(target, value, currency) {
  var v = Number(value) || 0;
  var sign = v > 0 ? '+' : (v < 0 ? '−' : '');
  if (target === 'Budget' || target === 'Debt') return target + ' ' + sign + (currency || '$') + Math.abs(v) + 'B';
  return target + ' ' + sign + Math.abs(v);
}
