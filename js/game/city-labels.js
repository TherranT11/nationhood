// City stat labels — single source for the 5-band descriptive labels
// the politician-nation Geography card uses to render city stats. The
// stored values on public.cities are 0..100 (matching the existing
// schema's CHECK constraint family); the player-facing scale is 1..10
// with 5 bands of 2. Display code never shows the raw number, only
// the band label.
//
// Band index = clamp(floor((stat - 1) / 20), 0, 4).
//
// Verification for the user-facing 1..10 → band mapping:
//   user 1  → stored 10  → floor(9/20)  = 0 → band 0
//   user 2  → stored 20  → floor(19/20) = 0 → band 0
//   user 3  → stored 30  → floor(29/20) = 1 → band 1
//   user 4  → stored 40  → floor(39/20) = 1 → band 1
//   user 5  → stored 50  → floor(49/20) = 2 → band 2
//   user 6  → stored 60  → floor(59/20) = 2 → band 2
//   user 7  → stored 70  → floor(69/20) = 3 → band 3
//   user 8  → stored 80  → floor(79/20) = 3 → band 3
//   user 9  → stored 90  → floor(89/20) = 4 → band 4
//   user 10 → stored 100 → floor(99/20) = 4 → band 4
//
// Default-seeded cities (stat = 50, third band) read as the middle
// label across every stat — Adequate / Moderate / Organized Crime /
// Pleasant but Modest / etc.

export const CITY_STAT_LABELS = {
  infrastructure: ['Failing',         'Strained',              'Adequate',                       'Modern',                          'Advanced'],
  pollution:      ['Pristine',        'Minor',                 'Moderate',                       'Severe',                          'Hazardous'],
  crime:          ['Safe Streets',    'Smuggling Dominant',    'Organized Crime',                'Gangs Control Districts',         'Total Lawlessness'],
  appeal:         ['Bleak Eyesore',   'Faded and Neglected',   'Pleasant but Modest',            'Charming and Picturesque',        'Breathtaking and World-Class'],
  growth:         ['Deep Recession',  'Stagnant',              'Moderate',                       'Booming',                         'Hyper-Growth'],
  jobs:           ['Critical Deficit','Limited Availability',  'Modest Openings',                'Robust Hiring',                   'Surging Labor Demand'],
  services:       ['Non-Existent',    'Long Queues',           'Functional',                     'Efficient and Reliable Delivery', 'Comprehensive and Affordable'],
  affordability:  ['Extreme Hardship','Pricing Out Locals',    'Cost of Living Balance',         'Accessible',                      'Dirt Cheap'],
};

/** Numeric (0..100) stat → display label for a given key, or '—'
 *  if the key isn't recognised. NULL / undefined / out-of-range
 *  values clamp into the nearest band. */
export function cityStatLabel(key, stat) {
  const bands = CITY_STAT_LABELS[key];
  if (!bands) return '—';
  const n = Number(stat);
  if (!Number.isFinite(n)) return bands[2]; // middle band as the null-safe default
  const idx = Math.max(0, Math.min(4, Math.floor((n - 1) / 20)));
  return bands[idx];
}
