/**
 * archetypes.js — Phase 5C-4 party archetype catalog.
 *
 * Each archetype maps to three "stronghold" sectors (sector_key references
 * the per-nation default sectors seeded by seed_default_sectors). New
 * parties start at 1.0 popularity in every sector (trigger
 * trg_backfill_faction_popularity, 10 stored tenths) and the archetype
 * raises the three strongholds with a primary→secondary→tertiary curve:
 *   primary    → 4.0  (40 stored tenths)
 *   secondary  → 3.5  (35 stored tenths)
 *   tertiary   → 3.0  (30 stored tenths)
 * The strongholds array order encodes the tier — index 0 is primary,
 * index 1 secondary, index 2 tertiary — and STRONGHOLD_POPULARITY_TIERS
 * is parallel. Both pieces are passed to apply_party_archetype as
 * positional arrays.
 *
 * The list is shared between the createparty UI and any downstream display
 * code (party header, party-overview cards, etc.) so the labels can never
 * drift.
 */

export const STRONGHOLD_POPULARITY_TIERS = [40, 35, 30]; // primary, secondary, tertiary (4.0 / 3.5 / 3.0 displayed)

export const ARCHETYPES = [
    {
        key: 'labor_social_democratic',
        name: 'Labor / Social Democratic',
        description: 'Coalition of working-class voters, organized labor, and city-dwelling salaried workers. Champions wages, labor protections, and public services.',
        strongholds: ['SERVICE_GIG_WORKERS', 'SKILLED_TRADES_MANUFACTURING', 'URBAN_PROFESSIONALS'],
    },
    {
        key: 'traditional_conservative',
        name: 'Traditional Conservative',
        description: 'Faith-driven communities, rural voters, and small-business owners. Anchors policy in tradition, family, and local economic stability.',
        strongholds: ['RELIGIOUS_CONSERVATIVES', 'RURAL_AGRICULTURAL', 'SMALL_BUSINESS_OWNERS'],
    },
    {
        key: 'liberal_progressive',
        name: 'Liberal / Progressive',
        description: 'Educated city dwellers, the cultural sector, and younger voters. Pushes for civil rights, climate action, and an active welfare state.',
        strongholds: ['URBAN_PROFESSIONALS', 'CULTURAL_PRODUCERS', 'STUDENTS_YOUNG_PRECARIAT'],
    },
    {
        key: 'populist_right',
        name: 'Populist Right',
        description: 'Rural communities, religious traditionalists, and industrial trades. Anti-establishment, protectionist, and skeptical of elite institutions.',
        strongholds: ['RURAL_AGRICULTURAL', 'RELIGIOUS_CONSERVATIVES', 'SKILLED_TRADES_MANUFACTURING'],
    },
    {
        key: 'libertarian',
        name: 'Libertarian',
        description: 'Investors, the tech class, and small business. Favors low taxes, light regulation, free markets, and limited government.',
        strongholds: ['CAPITAL_OWNERS_EXECUTIVES', 'TECH_ENGINEERING_CLASS', 'SMALL_BUSINESS_OWNERS'],
    },
    {
        key: 'green',
        name: 'Green',
        description: 'Younger voters, the cultural sector, and educated urbanites. Climate-first, pro-public-investment, and skeptical of extractive industry.',
        strongholds: ['STUDENTS_YOUNG_PRECARIAT', 'URBAN_PROFESSIONALS', 'CULTURAL_PRODUCERS'],
    },
    {
        key: 'nationalist',
        name: 'Nationalist',
        description: 'Rural voters, religious traditionalists, and retirees. National-sovereignty first; cultural preservation; skeptical of immigration and globalism.',
        strongholds: ['RURAL_AGRICULTURAL', 'RELIGIOUS_CONSERVATIVES', 'RETIREES_PENSIONERS'],
    },
    {
        key: 'technocratic_centrist',
        name: 'Technocratic / Centrist',
        description: 'Tech workers, urban professionals, and small business. Pragmatic, evidence-driven, allergic to ideology — competence over conviction.',
        strongholds: ['TECH_ENGINEERING_CLASS', 'URBAN_PROFESSIONALS', 'SMALL_BUSINESS_OWNERS'],
    },
];
