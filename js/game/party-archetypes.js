/**
 * party-archetypes.js — Canonical archetype catalog used everywhere
 * a politician interacts with party archetypes.
 *
 * The 10 entries below mirror the admin-form NPC party dropdown
 * (20270394) and the server-side _archetype_catalog_names() helper
 * introduced in 20270686. Editing this list is a coordinated
 * client + SQL migration change.
 *
 * factions.archetype stores the display name verbatim, so storage
 * and equality checks happen on the strings here — no key
 * translation layer.
 */

export const PARTY_ARCHETYPES = [
    'Reform',
    'Social Democratic',
    'Traditional Conservative',
    'Liberal',
    'Libertarian',
    'Communist / Leftist',
    'Green',
    'Nationalist',
    'Populist',
    'Centrist',
];
