// City stats — single source for the 8-stat catalog the
// politician-nation Geography card uses. Stored values on
// public.cities are 1..10 (20270736 rescale collapsed the prior
// 0..100 storage to match the player-facing scale). Display code
// never shows the raw number, only the band label.
//
// Band index = clamp(floor((stat - 1) / 2), 0, 4).
//
//   stat 1  → floor(0/2) = 0 → band 0
//   stat 2  → floor(1/2) = 0 → band 0
//   stat 3  → floor(2/2) = 1 → band 1
//   stat 4  → floor(3/2) = 1 → band 1
//   stat 5  → floor(4/2) = 2 → band 2
//   stat 6  → floor(5/2) = 2 → band 2
//   stat 7  → floor(6/2) = 3 → band 3
//   stat 8  → floor(7/2) = 3 → band 3
//   stat 9  → floor(8/2) = 4 → band 4
//   stat 10 → floor(9/2) = 4 → band 4
//
// Default-seeded cities (stat = 5, band 2) read as the middle
// label across every stat — Adequate / Moderate / Organized Crime /
// Pleasant but Modest / etc.
//
// Order of CITY_STATS is the display order in the Geography card —
// changing it here changes the rendered layout everywhere.

export const CITY_STATS = [
  { key: 'infrastructure', name: 'Infrastructure', bands: ['Failing',         'Strained',              'Adequate',                       'Modern',                          'Advanced'] },
  { key: 'pollution',      name: 'Pollution',      bands: ['Pristine',        'Minor',                 'Moderate',                       'Severe',                          'Hazardous'] },
  { key: 'crime',          name: 'Crime',          bands: ['Safe Streets',    'Smuggling Dominant',    'Organized Crime',                'Gangs Control Districts',         'Total Lawlessness'] },
  { key: 'appeal',         name: 'Appeal',         bands: ['Bleak Eyesore',   'Faded and Neglected',   'Pleasant but Modest',            'Charming and Picturesque',        'Breathtaking and World-Class'] },
  { key: 'growth',         name: 'Growth',         bands: ['Deep Recession',  'Stagnant',              'Moderate',                       'Booming',                         'Hyper-Growth'] },
  { key: 'jobs',           name: 'Jobs',           bands: ['Critical Deficit','Limited Availability',  'Modest Openings',                'Robust Hiring',                   'Surging Labor Demand'] },
  { key: 'services',       name: 'Services',       bands: ['Non-Existent',    'Long Queues',           'Functional',                     'Efficient and Reliable Delivery', 'Comprehensive and Affordable'] },
  { key: 'affordability',  name: 'Affordability',  bands: ['Extreme Hardship','Pricing Out Locals',    'Cost of Living Balance',         'Accessible',                      'Dirt Cheap'] },
];

// Indexed by stat key for cityStatLabel's O(1) lookup. Derived from
// CITY_STATS so adding a stat is a one-place edit above.
const _BANDS_BY_KEY = Object.fromEntries(CITY_STATS.map(s => [s.key, s.bands]));

/** Numeric (1..10) stat → display label for a given key, or '—'
 *  if the key isn't recognised. NULL / undefined / out-of-range
 *  values clamp into the nearest band. */
export function cityStatLabel(key, stat) {
  const bands = _BANDS_BY_KEY[key];
  if (!bands) return '—';
  const n = Number(stat);
  if (!Number.isFinite(n)) return bands[2]; // middle band as the null-safe default
  const idx = Math.max(0, Math.min(4, Math.floor((n - 1) / 2)));
  return bands[idx];
}

/** Shared display extractor for a cities row. Returns the fields
 *  both the Geography card (politician-nation.html) and the Mayor
 *  race city picker (politician-career.html) need. Centralises
 *  null-safe formatting so a change to the "no mayor" label or
 *  budget rounding lands in one place.
 *
 *  Expected shape on `c`: { mayor_first_name, mayor_last_name,
 *  mayor_archetype, mayor_party, population_pct, budget }. Pass the
 *  nation population through so the per-city number can fall back
 *  to the 11% blanket when population_pct is NULL (20270711). */
export function cityDisplayData(c, nationPop) {
  const pct = c?.population_pct != null ? Number(c.population_pct) : 11;
  const population = Math.round((Number(nationPop) || 0) * (pct / 100));
  const mayorName = (c?.mayor_first_name || c?.mayor_last_name)
    ? `${c.mayor_first_name || ''} ${c.mayor_last_name || ''}`.trim()
    : '—';
  const party     = c?.mayor_party || null;
  const partyAbbr = party?.abbreviation || party?.faction_name || '';
  const archetype = party?.archetype    || c?.mayor_archetype || '';
  // 20270738: budget is a single dollar number (unbounded positive
  // int), not a 1-10 stat. Display "$N". The 20270736 "5 / 10" format
  // was a brief stop on the way here — kept as a single-line format
  // helper so future callers don't have to know the prefix.
  const budgetVal = Number(c?.budget) || 0;
  const budgetStr = `$${budgetVal}`;
  return { population, mayorName, partyAbbr, archetype, budgetStr };
}
