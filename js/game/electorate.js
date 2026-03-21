/**
 * electorate.js — Electorate engine (Phase 2A: constants, config, genesis)
 *
 * Replaces the old voter_blocs + faction_bloc_approval system with a
 * continuous electorate model. The electorate is represented by a single
 * profile per nation (demographic distributions + ideological means/variances)
 * rather than discrete blocs.
 *
 * Tables written to:
 *   electorate_profile        — one row per nation
 *   issue_state               — one row per (nation, issue)
 *   faction_electoral_standing — one row per (faction, nation)
 *
 * Phase 2A scope:
 *   - All constants and config knobs
 *   - seedElectorateProfile()   — derive demographics + ideology from nation stats
 *   - seedIssueStates()         — create 8 issue rows with stat-driven salience
 *   - seedFactionElectoralStanding() — create standing rows with initial values
 */

import { IDEOLOGY_AXES } from './ideology.js';
import { statDirectionSign, ISSUE_CATEGORY_STATS } from './stats.js';

// ============================================================================
// ISSUE DEFINITIONS
// ============================================================================

/**
 * The 8 core issues tracked by the electorate engine.
 * Each issue maps to a set of nation stats (for salience computation)
 * and one or more ideology axes (for stance alignment).
 */
export const ISSUE_DEFS = {
    cost_of_living: {
        label: 'Cost of Living',
        stats: ['cost_of_living', 'inflation', 'housing_affordability', 'fuel_prices'],
        axes: ['liberty_equality', 'individualism_collectivism'],
    },
    immigration: {
        label: 'Immigration',
        stats: ['immigration', 'illegal_immigration', 'emigration', 'ethnic_diversity'],
        axes: ['globalism_nationalism', 'security_freedom'],
    },
    healthcare: {
        label: 'Healthcare',
        stats: ['healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan'],
        axes: ['liberty_equality', 'individualism_collectivism'],
    },
    unemployment: {
        label: 'Unemployment',
        stats: ['unemployment', 'labor_force_participation', 'minimum_wage', 'poverty_rate'],
        axes: ['liberty_equality', 'individualism_collectivism'],
    },
    corruption: {
        label: 'Corruption',
        stats: ['corruption', 'judicial_independence', 'press_freedom', 'efficiency'],
        axes: ['tradition_progress', 'security_freedom'],
    },
    education: {
        label: 'Education',
        stats: ['literacy', 'higher_education', 'education_accessibility', 'academic_immigration'],
        axes: ['tradition_progress', 'individualism_collectivism'],
    },
    infrastructure: {
        label: 'Infrastructure',
        stats: ['physical_infrastructure', 'digital_infrastructure', 'rail_network', 'energy_generation'],
        axes: ['tradition_progress', 'globalism_nationalism'],
    },
    climate: {
        label: 'Climate & Environment',
        stats: ['pollution', 'carbon_emissions', 'renewable_energy_percentage', 'arable_land'],
        axes: ['tradition_progress', 'globalism_nationalism'],
    },
};

export const ISSUE_IDS = Object.keys(ISSUE_DEFS);

// ============================================================================
// AXIS HELPERS
// ============================================================================

export const AXIS_KEYS = IDEOLOGY_AXES.map(a => a.key);

// ============================================================================
// DEMOGRAPHIC ← STAT MAPPING
// ============================================================================
// Each demographic dimension is derived from nation stats at genesis.
// The mapping defines which stats push each band up or down.

/**
 * Maps demographic distribution bands to the nation stats that influence them.
 *
 * Format: { dimension: { band: [{ stat, weight, direction }] } }
 *   - stat: nation stat key
 *   - weight: how strongly this stat affects the band (0-1)
 *   - direction: +1 means higher stat → larger band, -1 means higher stat → smaller band
 */
export const DEMOGRAPHIC_STAT_MAP = {
    age: {
        age_18_29:  [{ stat: 'population_growth', weight: 0.6, direction: 1 }, { stat: 'median_age', weight: 0.5, direction: -1 }],
        age_30_44:  [{ stat: 'higher_education', weight: 0.3, direction: 1 }],
        age_45_64:  [{ stat: 'urbanization', weight: 0.2, direction: 1 }],
        age_65plus: [{ stat: 'lifespan', weight: 0.5, direction: 1 }, { stat: 'median_age', weight: 0.5, direction: 1 }],
    },
    income: {
        income_low:    [{ stat: 'poverty_rate', weight: 0.6, direction: 1 }, { stat: 'income_inequality', weight: 0.4, direction: 1 }],
        income_middle: [{ stat: 'social_mobility', weight: 0.4, direction: 1 }],
        income_upper:  [{ stat: 'gdp_growth', weight: 0.3, direction: 1 }, { stat: 'higher_education', weight: 0.3, direction: 1 }],
        income_high:   [{ stat: 'gdp_growth', weight: 0.2, direction: 1 }, { stat: 'income_inequality', weight: 0.3, direction: 1 }],
    },
    education: {
        edu_nodegree: [{ stat: 'literacy', weight: 0.5, direction: -1 }, { stat: 'education_accessibility', weight: 0.4, direction: -1 }],
        edu_undergrad: [{ stat: 'higher_education', weight: 0.5, direction: 1 }, { stat: 'education_accessibility', weight: 0.3, direction: 1 }],
        edu_postgrad:  [{ stat: 'higher_education', weight: 0.5, direction: 1 }, { stat: 'academic_immigration', weight: 0.3, direction: 1 }],
    },
    urbanization: {
        urban_rural:     [{ stat: 'urbanization', weight: 0.6, direction: -1 }, { stat: 'arable_land', weight: 0.3, direction: 1 }],
        urban_smalltown: [{ stat: 'urbanization', weight: 0.2, direction: -1 }],
        urban_suburban:  [{ stat: 'urbanization', weight: 0.3, direction: 1 }, { stat: 'housing_affordability', weight: 0.2, direction: -1 }],
        urban_urban:     [{ stat: 'urbanization', weight: 0.6, direction: 1 }],
    },
    religion: {
        religion_secular:  [{ stat: 'religiosity', weight: 0.7, direction: -1 }, { stat: 'higher_education', weight: 0.2, direction: 1 }],
        religion_moderate: [],
        religion_devout:   [{ stat: 'religiosity', weight: 0.7, direction: 1 }],
    },
    nativity: {
        nativity_majority:  [{ stat: 'ethnic_diversity', weight: 0.5, direction: -1 }, { stat: 'immigration', weight: 0.3, direction: -1 }],
        nativity_minority:  [{ stat: 'ethnic_diversity', weight: 0.6, direction: 1 }],
        nativity_immigrant: [{ stat: 'immigration', weight: 0.5, direction: 1 }, { stat: 'ethnic_diversity', weight: 0.2, direction: 1 }],
    },
};

// ============================================================================
// IDEOLOGICAL DISTRIBUTION ← STAT MAPPING
// ============================================================================
// Each axis mean is influenced by nation stats. Higher stat pushes
// the electorate mean toward one pole or the other.

/**
 * Maps nation stats to ideological axis means.
 * direction: +1 means higher stat → higher axis value (toward "right" pole),
 *           -1 means higher stat → lower axis value (toward "left" pole).
 */
export const IDEO_STAT_MAP = {
    liberty_equality: [
        { stat: 'income_inequality', weight: 0.4, direction: 1 },     // high inequality → demand for equality
        { stat: 'poverty_rate',      weight: 0.3, direction: 1 },     // high poverty → demand for equality
        { stat: 'social_mobility',   weight: 0.3, direction: -1 },    // high mobility → favor liberty
        { stat: 'freedom_index',     weight: 0.2, direction: -1 },    // high freedom → favor liberty
    ],
    tradition_progress: [
        { stat: 'higher_education',  weight: 0.3, direction: 1 },     // educated → progressive
        { stat: 'urbanization',      weight: 0.3, direction: 1 },     // urban → progressive
        { stat: 'religiosity',       weight: 0.4, direction: -1 },    // religious → traditional
        { stat: 'median_age',        weight: 0.2, direction: -1 },    // older → traditional
    ],
    security_freedom: [
        { stat: 'terrorism',         weight: 0.4, direction: -1 },    // terrorism → demand security
        { stat: 'crime_rate',        weight: 0.3, direction: -1 },    // crime → demand security
        { stat: 'civil_unrest',      weight: 0.3, direction: -1 },    // unrest → demand security
        { stat: 'press_freedom',     weight: 0.3, direction: 1 },     // free press → value freedom
    ],
    globalism_nationalism: [
        { stat: 'international_reputation', weight: 0.3, direction: -1 },  // good rep → globalism
        { stat: 'foreign_investment',       weight: 0.3, direction: -1 },  // FDI → globalism
        { stat: 'immigration',              weight: 0.2, direction: -1 },  // immigration → globalism
        { stat: 'ethnic_diversity',         weight: 0.2, direction: 1 },   // diverse → nationalism backlash
    ],
    individualism_collectivism: [
        { stat: 'benefits',          weight: 0.3, direction: 1 },     // benefits → collectivism
        { stat: 'union_strength',    weight: 0.3, direction: 1 },     // unions → collectivism
        { stat: 'income_inequality', weight: 0.2, direction: 1 },     // inequality → collectivism
        { stat: 'gdp_growth',        weight: 0.2, direction: -1 },    // growth → individualism
    ],
};

// ============================================================================
// IDEOLOGICAL VARIANCE ← STAT MAPPING
// ============================================================================
// Variance represents how spread out the electorate is on each axis.
// Higher polarization → higher variance. Higher stability → lower variance.

export const IDEO_VARIANCE_STAT_MAP = {
    _global: [
        { stat: 'polarization',  weight: 0.5, direction: 1 },
        { stat: 'stability',     weight: 0.3, direction: -1 },
        { stat: 'ethnic_diversity', weight: 0.2, direction: 1 },
    ],
};

// ============================================================================
// SALIENCE ← STAT MAPPING
// ============================================================================
// How much the electorate cares about each ideology axis.
// Issues make axes salient; the axis salience weights determine how much
// each axis matters in the alignment calculation.

/**
 * Maps issues to their axis weights for salience computation.
 * When an issue is salient, its associated axes get more weight.
 */
export const ISSUE_AXIS_SALIENCE = {
    cost_of_living:  { liberty_equality: 0.6, individualism_collectivism: 0.4 },
    immigration:     { globalism_nationalism: 0.6, security_freedom: 0.4 },
    healthcare:      { liberty_equality: 0.5, individualism_collectivism: 0.5 },
    unemployment:    { liberty_equality: 0.5, individualism_collectivism: 0.5 },
    corruption:      { tradition_progress: 0.5, security_freedom: 0.5 },
    education:       { tradition_progress: 0.6, individualism_collectivism: 0.4 },
    infrastructure:  { tradition_progress: 0.5, globalism_nationalism: 0.5 },
    climate:         { tradition_progress: 0.6, globalism_nationalism: 0.4 },
};

// ============================================================================
// CONFIGURATION KNOBS
// ============================================================================

export const ELECTORATE_CONFIG = {
    // -- Genesis defaults --
    DEFAULT_ENTHUSIASM: 50,
    DEFAULT_SALIENCE: 30,
    DEFAULT_SALIENCE_FLOOR: 5,
    DEFAULT_IDEO_VARIANCE: 20,

    // -- Demographic derivation --
    DEMO_STAT_SENSITIVITY: 0.3,    // how strongly stats shift demographics from defaults

    // -- Ideology derivation --
    IDEO_STAT_SENSITIVITY: 0.25,   // how strongly stats shift ideo means from center (50)
    IDEO_VARIANCE_BASE: 20,        // base variance when all stats are neutral
    IDEO_VARIANCE_SENSITIVITY: 0.3,

    // -- Salience --
    SALIENCE_STAT_SENSITIVITY: 0.5, // how strongly stat badness drives salience up
    SALIENCE_MIN: 5,
    SALIENCE_MAX: 95,

    // -- Issue seeding --
    ISSUE_COUNT: 8,                 // all 8 issues are always seeded

    // -- Standing defaults --
    DEFAULT_ALIGNMENT: 50,
    DEFAULT_PLATFORM_APPEAL: 50,
    DEFAULT_PARTY_APPROVAL: 50,
    DEFAULT_VISIBILITY: 30,
    DEFAULT_CREDIBILITY: 1.0,
};

const CFG = ELECTORATE_CONFIG;

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Normalize an array of values so they sum to targetSum.
 * Preserves relative proportions. Handles all-zero case.
 */
function normalizeDistribution(values, targetSum = 100) {
    const sum = values.reduce((a, b) => a + b, 0);
    if (sum <= 0) {
        const even = targetSum / values.length;
        return values.map(() => round2(even));
    }
    const scaled = values.map(v => (v / sum) * targetSum);
    // Fix rounding so sum is exactly targetSum
    const rounded = scaled.map(v => round2(v));
    const diff = round2(targetSum - rounded.reduce((a, b) => a + b, 0));
    if (diff !== 0) rounded[0] = round2(rounded[0] + diff);
    return rounded;
}

function round2(v) { return Math.round(v * 100) / 100; }
function round3(v) { return Math.round(v * 1000) / 1000; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/**
 * Get a nation stat value, defaulting to 50 if missing.
 */
function getStat(nation, key) {
    return Number(nation[key] ?? 50);
}

// ============================================================================
// GENESIS: seedElectorateProfile
// ============================================================================

/**
 * Derive and upsert an electorate_profile row from a nation's current stats.
 *
 * Demographics are derived by starting from column defaults (in the schema)
 * and shifting bands based on DEMOGRAPHIC_STAT_MAP influences.
 *
 * Ideological means are derived from IDEO_STAT_MAP: stats push the
 * electorate mean away from center (50) on each axis.
 *
 * Ideological variances are derived from polarization/stability.
 *
 * Axis salience weights start equal (0.2 each) — they'll be adjusted
 * by tickIssueSalience in Phase 2C based on active issue salience.
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row with stat columns
 * @param {number} [currentTick=0] - The current tick
 * @returns {object} The upserted electorate_profile row
 */
export async function seedElectorateProfile(supabase, nation, currentTick = 0) {
    // ── 1. Derive demographic distributions ──
    const demographics = {};
    for (const [dimension, bands] of Object.entries(DEMOGRAPHIC_STAT_MAP)) {
        const bandKeys = Object.keys(bands);
        // Start from schema defaults
        const defaults = getDefaultsForDimension(dimension);
        const raw = bandKeys.map((bandKey, i) => {
            let value = defaults[i];
            const influences = bands[bandKey];
            for (const inf of influences) {
                const statVal = getStat(nation, inf.stat);
                // Shift from 50 (neutral) scaled by weight and sensitivity
                const shift = ((statVal - 50) / 50) * inf.direction * inf.weight * CFG.DEMO_STAT_SENSITIVITY * 100;
                value += shift;
            }
            return Math.max(1, value); // floor at 1% per band
        });
        const normalized = normalizeDistribution(raw, 100);
        bandKeys.forEach((key, i) => { demographics[key] = normalized[i]; });
    }

    // ── 2. Derive ideological means ──
    const ideoMeans = {};
    for (const axisKey of AXIS_KEYS) {
        const influences = IDEO_STAT_MAP[axisKey] || [];
        let shift = 0;
        for (const inf of influences) {
            const statVal = getStat(nation, inf.stat);
            shift += ((statVal - 50) / 50) * inf.direction * inf.weight;
        }
        // Scale shift and add to center (50)
        ideoMeans['ideo_mean_' + axisKey] = round2(clamp(50 + shift * CFG.IDEO_STAT_SENSITIVITY * 50, 5, 95));
    }

    // ── 3. Derive ideological variances ──
    const globalInfluences = IDEO_VARIANCE_STAT_MAP._global || [];
    let varianceShift = 0;
    for (const inf of globalInfluences) {
        const statVal = getStat(nation, inf.stat);
        varianceShift += ((statVal - 50) / 50) * inf.direction * inf.weight;
    }
    const ideoVars = {};
    for (const axisKey of AXIS_KEYS) {
        ideoVars['ideo_var_' + axisKey] = round2(
            clamp(CFG.IDEO_VARIANCE_BASE + varianceShift * CFG.IDEO_VARIANCE_SENSITIVITY * 50, 5, 45)
        );
    }

    // ── 4. Default salience weights (equal) ──
    const salience = {};
    for (const axisKey of AXIS_KEYS) {
        salience['salience_' + axisKey] = round3(1.0 / AXIS_KEYS.length);
    }

    // ── 5. Upsert ──
    const row = {
        nation_id: nation.id,
        ...demographics,
        ...ideoMeans,
        ...ideoVars,
        ...salience,
        enthusiasm: CFG.DEFAULT_ENTHUSIASM,
        last_updated_tick: currentTick,
    };

    const { data, error } = await supabase
        .from('electorate_profile')
        .upsert(row, { onConflict: 'nation_id' })
        .select()
        .single();

    if (error) {
        console.error(`[Electorate] Failed to seed electorate_profile for ${nation.name}:`, error.message);
        return null;
    }

    console.log(`[Electorate] Seeded electorate_profile for ${nation.name}`);
    return data;
}

/**
 * Returns the schema default values for each band in a demographic dimension.
 */
function getDefaultsForDimension(dimension) {
    const DEFAULTS = {
        age:          [22, 28, 30, 20],
        income:       [28, 38, 22, 12],
        education:    [48, 38, 14],
        urbanization: [22, 20, 32, 26],
        religion:     [30, 42, 28],
        nativity:     [72, 16, 12],
    };
    return DEFAULTS[dimension] || [];
}

// ============================================================================
// GENESIS: seedIssueStates
// ============================================================================

/**
 * Seed issue_state rows for a nation. All 8 issues are created.
 *
 * Initial salience is derived from how poorly the nation performs on the
 * issue's associated stats. Bad stats → high salience (voters care more
 * about problems).
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row
 * @returns {object[]} The upserted issue_state rows
 */
export async function seedIssueStates(supabase, nation) {
    const rows = [];

    for (const issueId of ISSUE_IDS) {
        const def = ISSUE_DEFS[issueId];
        const salience = computeIssueSalience(nation, def.stats);

        rows.push({
            nation_id: nation.id,
            issue_id: issueId,
            salience: round2(salience),
            salience_target: round2(salience),
            salience_floor: CFG.DEFAULT_SALIENCE_FLOOR,
            owned_by: null,
            pioneer_faction_id: null,
            pioneer_ticks_held: 0,
            last_updated_tick: 0,
        });
    }

    const { data, error } = await supabase
        .from('issue_state')
        .upsert(rows, { onConflict: 'nation_id,issue_id' })
        .select();

    if (error) {
        console.error(`[Electorate] Failed to seed issue_state for ${nation.name}:`, error.message);
        return [];
    }

    console.log(`[Electorate] Seeded ${data.length} issue_state rows for ${nation.name}`);
    return data;
}

/**
 * Compute initial salience for an issue based on how "bad" its stats are.
 * Bad stats → high salience. Good stats → low salience.
 *
 * Uses statDirectionSign to determine which direction is "good":
 *   +1 → higher is better → badness = 100 - val
 *   -1 → lower is better  → badness = val
 *    0 → neutral, skip
 */
function computeIssueSalience(nation, statKeys) {
    let badnessSum = 0;
    let count = 0;

    for (const sk of statKeys) {
        const val = getStat(nation, sk);
        const dir = statDirectionSign(sk);
        if (dir === 0) continue;

        // Badness: 0 = perfect, 100 = worst
        const badness = dir === 1 ? (100 - val) : val;
        badnessSum += badness;
        count++;
    }

    if (count === 0) return CFG.DEFAULT_SALIENCE;

    const avgBadness = badnessSum / count;
    // Map badness to salience: 0 badness → low salience, 100 badness → high salience
    const salience = CFG.DEFAULT_SALIENCE + (avgBadness - 50) * CFG.SALIENCE_STAT_SENSITIVITY;
    return clamp(salience, CFG.SALIENCE_MIN, CFG.SALIENCE_MAX);
}

// ============================================================================
// GENESIS: seedFactionElectoralStanding
// ============================================================================

/**
 * Seed faction_electoral_standing rows for all active factions in a nation.
 *
 * Initial values:
 *   - ideological_alignment: computed from faction ideology vs electorate profile
 *   - platform_appeal: 50 (no stances yet)
 *   - party_approval: derived from existing gov_approval for governing factions,
 *     50 for opposition
 *   - visibility: 30 (low, no campaign actions yet)
 *   - credibility: 1.0 (clean slate)
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row
 * @param {object[]} factions - Array of faction rows (id, seats, etc.)
 * @param {object} [profile] - electorate_profile row (fetched if not provided)
 * @returns {object[]} The upserted faction_electoral_standing rows
 */
export async function seedFactionElectoralStanding(supabase, nation, factions, profile = null) {
    if (!factions || factions.length === 0) return [];

    // Fetch profile if not provided
    if (!profile) {
        const { data } = await supabase
            .from('electorate_profile')
            .select('*')
            .eq('nation_id', nation.id)
            .single();
        profile = data;
    }

    // Fetch faction ideologies
    const factionIds = factions.map(f => f.id);
    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism')
        .in('faction_id', factionIds);
    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    // Determine governing faction IDs
    const { data: coalitionRow } = await supabase
        .from('government_formations')
        .select('lead_party_id, party_ids')
        .eq('nation_id', nation.id)
        .eq('status', 'active')
        .single();
    const governingIds = new Set(coalitionRow?.party_ids || []);
    if (coalitionRow?.lead_party_id) governingIds.add(coalitionRow.lead_party_id);

    const govApproval = Number(nation.gov_approval ?? 50);

    const rows = [];
    for (const faction of factions) {
        const ideo = ideoMap[faction.id];

        // Compute initial alignment from ideology vs electorate profile
        const alignment = profile && ideo
            ? computeGenesisAlignment(ideo, profile)
            : CFG.DEFAULT_ALIGNMENT;

        // Party approval: governing factions inherit gov_approval, opposition gets 50
        const approval = governingIds.has(faction.id) ? govApproval : CFG.DEFAULT_PARTY_APPROVAL;

        rows.push({
            faction_id: faction.id,
            nation_id: nation.id,
            ideological_alignment: round2(alignment),
            platform_appeal: CFG.DEFAULT_PLATFORM_APPEAL,
            party_approval: round2(approval),
            visibility: CFG.DEFAULT_VISIBILITY,
            credibility_modifier: CFG.DEFAULT_CREDIBILITY,
            credibility_radius_component: 0,
            credibility_promise_component: 0,
            last_updated_tick: 0,
        });
    }

    const { data, error } = await supabase
        .from('faction_electoral_standing')
        .upsert(rows, { onConflict: 'faction_id,nation_id' })
        .select();

    if (error) {
        console.error(`[Electorate] Failed to seed faction_electoral_standing for ${nation.name}:`, error.message);
        return [];
    }

    console.log(`[Electorate] Seeded ${data.length} faction_electoral_standing rows for ${nation.name}`);
    return data;
}

/**
 * Compute initial ideological alignment between a faction and the electorate.
 *
 * Uses a simplified Gaussian overlap proxy: for each axis, measure the
 * distance between the faction's position and the electorate mean,
 * penalized by electorate variance (wider variance = more forgiving).
 *
 * Returns 0-100 alignment score.
 */
function computeGenesisAlignment(factionIdeology, profile) {
    let weightedAlignment = 0;
    let totalWeight = 0;

    for (const axisKey of AXIS_KEYS) {
        const partyScore = Number(factionIdeology[axisKey] || 0); // -100 to +100
        const elecMean = Number(profile['ideo_mean_' + axisKey] ?? 50); // 0-100
        const elecVar = Number(profile['ideo_var_' + axisKey] ?? 20);  // 0-50
        const salienceWeight = Number(profile['salience_' + axisKey] ?? 0.2);

        // Convert party score to 0-100 scale
        const partyNorm = (partyScore + 100) / 2; // -100→0, 0→50, +100→100

        // Distance from electorate mean
        const distance = Math.abs(partyNorm - elecMean);

        // Alignment: Gaussian-style falloff. Higher variance = more forgiving.
        // σ = elecVar, alignment = exp(-distance² / (2σ²))
        const sigma = Math.max(5, elecVar);
        const alignment = Math.exp(-(distance * distance) / (2 * sigma * sigma));

        weightedAlignment += alignment * salienceWeight;
        totalWeight += salienceWeight;
    }

    if (totalWeight <= 0) return 50;
    return round2(clamp((weightedAlignment / totalWeight) * 100, 0, 100));
}

// ============================================================================
// MASTER GENESIS FUNCTION
// ============================================================================

/**
 * Run full electorate genesis for a nation: profile + issues + standings.
 *
 * Call this when a nation is created or when migrating from the old
 * voter_blocs system. Safe to call multiple times (upserts).
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row
 * @param {object[]} factions - Array of faction rows
 * @param {number} [currentTick=0]
 * @returns {{ profile, issues, standings }}
 */
export async function genesisElectorate(supabase, nation, factions, currentTick = 0) {
    console.log(`[Electorate] Running genesis for ${nation.name}...`);

    const profile = await seedElectorateProfile(supabase, nation, currentTick);
    const issues = await seedIssueStates(supabase, nation);
    const standings = await seedFactionElectoralStanding(supabase, nation, factions, profile);

    console.log(`[Electorate] Genesis complete for ${nation.name}: profile=${!!profile}, issues=${issues.length}, standings=${standings.length}`);
    return { profile, issues, standings };
}
