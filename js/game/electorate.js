/**
 * electorate.js — Electorate engine
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
 * Phase 2A: Constants, config, genesis seed functions
 * Phase 2B: Per-tick three-pillar calculations + vote share pipeline
 * Phase 2C: Issue salience drift, profile drift, platform appeal, stance decay
 */

import { IDEOLOGY_AXES } from './ideology.js';
import { statDirectionSign, ISSUE_CATEGORY_STATS } from './stats.js';
import { isAutocracy } from './government-types.js';
import { fetchActiveCoalition } from './government-structure.js';

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

    // ── Phase 2B: Per-tick pillar weights ──
    PILLAR_WEIGHT_ALIGNMENT: 0.40,  // ideological alignment
    PILLAR_WEIGHT_APPEAL: 0.25,     // platform appeal (stances, issue ownership)
    PILLAR_WEIGHT_APPROVAL: 0.35,   // party approval (governance record, momentum)

    // ── Alignment tick config ──
    ALIGNMENT_DRIFT_SPEED: 2,       // max points per tick toward target alignment

    // ── Party approval config ──
    APPROVAL_GOV_NUDGE_DIVISOR: 2.5,  // (gov_approval - 50) / divisor = nudge
    APPROVAL_GOV_NUDGE_CAP: 8,        // max ±nudge per tick
    APPROVAL_COALITION_SHARE: 0.25,    // non-lead coalition parties get 25% of nudge
    APPROVAL_OPPOSITION_TARGET: 45,    // inactive opposition drifts toward this
    APPROVAL_DRIFT_SPEED: 3,           // max points per tick drift toward target
    APPROVAL_MIN: 10,
    APPROVAL_MAX: 90,

    // ── Visibility config ──
    VISIBILITY_DECAY: 0.92,          // 8% decay per tick
    VISIBILITY_FLOOR: 10,
    VISIBILITY_GOV_FLOOR: 25,        // governing parties stay more visible
    VISIBILITY_INACTIVITY_THRESHOLD: 3, // ticks without action before decay kicks in

    // ── Credibility config ──
    CREDIBILITY_MIN: 0.5,
    CREDIBILITY_MAX: 1.5,
    CREDIBILITY_RECOVERY_RATE: 0.01,  // per tick toward 1.0

    // ── Vote share config ──
    SOFTMAX_TEMPERATURE: 8,           // softmax k (higher = more uniform distribution)
    TURNOUT_BASE: 0.65,               // base turnout fraction
    TURNOUT_ENTHUSIASM_SCALE: 0.003,  // per enthusiasm point above/below 50
    TURNOUT_VISIBILITY_SCALE: 0.002,  // per visibility point above 50

    // ── Inactivity ──
    INACTIVITY_EXCLUSION_TICKS: 12,   // parties unseen for this many ticks are excluded

    // ── Phase 2C: Issue salience drift ──
    SALIENCE_DRIFT_SPEED: 2,          // max salience points per tick toward target
    SALIENCE_OWNERSHIP_BONUS: 10,     // bonus salience when a faction "owns" an issue
    SALIENCE_DECAY_TOWARD_FLOOR: 0.5, // per-tick drift toward floor when stats are good

    // ── Phase 2C: Electorate profile drift ──
    PROFILE_IDEO_DRIFT_SPEED: 0.5,    // max ideo mean drift per tick
    PROFILE_VAR_DRIFT_SPEED: 0.3,     // max variance drift per tick

    // ── Phase 2C: Platform appeal ──
    APPEAL_IDEOLOGY_BASELINE_WEIGHT: 0.3,  // how much alignment contributes to appeal floor
    APPEAL_STANCE_WEIGHT: 0.7,             // how much stances contribute to appeal
    APPEAL_PIONEER_BONUS: 5,               // bonus for being the first faction on an issue
    APPEAL_CONSISTENCY_BONUS: 3,           // bonus for ideologically consistent stances
    APPEAL_INCONSISTENCY_PENALTY: 5,       // penalty for inconsistent stances
    APPEAL_DRIFT_SPEED: 3,                 // max platform_appeal change per tick
    APPEAL_MIN: 10,
    APPEAL_MAX: 90,

    // ── Phase 2C: Stance decay ──
    STANCE_REMOVAL_THRESHOLD: 5,      // strength below this → remove the stance
    MAX_STANCES_PER_FACTION: 5,       // max active stances
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

// ============================================================================
// PHASE 2B: PER-TICK THREE-PILLAR CALCULATIONS + VOTE SHARE PIPELINE
// ============================================================================

/**
 * Master per-tick function. Recalculates all three pillars for every faction
 * in a nation, then runs the vote share pipeline.
 *
 * Pipeline:
 *   1. Load electorate_profile, issue_states, faction standings, ideologies
 *   2. Recalculate Pillar 1: ideological alignment (Gaussian overlap)
 *   3. Recalculate Pillar 2: platform appeal (issue-stance matching)
 *   4. Recalculate Pillar 3: party approval (gov performance drift)
 *   5. Update visibility (campaign action decay)
 *   6. Update credibility (recovery toward 1.0)
 *   7. Compute raw_appeal = weighted pillar sum × credibility
 *   8. Softmax → contested_vote_share
 *   9. Apply turnout → realized_vote_share
 *  10. Write back to faction_electoral_standing + factions.national_vote_share
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row
 * @param {number} currentTick - The tick just committed
 */
export async function tickElectorate(supabase, nation, currentTick) {
    if (isAutocracy(nation)) return;

    // ── 1. Load active factions (exclude gone ≥12 ticks) ──
    const { data: allFactions } = await supabase
        .from('factions')
        .select('id, seats, last_seen_tick, faction_type')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');
    if (!allFactions || allFactions.length === 0) return;

    const factions = allFactions.filter(f =>
        f.last_seen_tick == null || (currentTick - f.last_seen_tick) < CFG.INACTIVITY_EXCLUSION_TICKS
    );
    const inactiveFactions = allFactions.filter(f =>
        f.last_seen_tick != null && (currentTick - f.last_seen_tick) >= CFG.INACTIVITY_EXCLUSION_TICKS
    );
    if (factions.length === 0) return;
    const factionIds = factions.map(f => f.id);

    // ── 2. Load coalition info ──
    const coalition = await fetchActiveCoalition(supabase, nation.id);
    const coalitionPartyIds = new Set(coalition?.party_ids || []);
    const leadPartyId = coalition?.lead_party_id || null;

    // ── 3. Load electorate profile ──
    const { data: profile } = await supabase
        .from('electorate_profile')
        .select('*')
        .eq('nation_id', nation.id)
        .single();
    if (!profile) {
        console.warn(`[Electorate] No electorate_profile for ${nation.name}, running genesis`);
        await genesisElectorate(supabase, nation, factions, currentTick);
        return;
    }

    // ── 4. Load issue states ──
    const { data: issueStates } = await supabase
        .from('issue_state')
        .select('*')
        .eq('nation_id', nation.id);

    // ── 5. Load faction ideologies ──
    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism')
        .in('faction_id', factionIds);
    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    // ── 6. Load existing standings ──
    let { data: standings } = await supabase
        .from('faction_electoral_standing')
        .select('*')
        .in('faction_id', factionIds)
        .eq('nation_id', nation.id);
    if (!standings || standings.length === 0) {
        // Genesis if no standings exist
        await seedFactionElectoralStanding(supabase, nation, factions, profile);
        const { data: freshStandings } = await supabase
            .from('faction_electoral_standing')
            .select('*')
            .in('faction_id', factionIds)
            .eq('nation_id', nation.id);
        standings = freshStandings || [];
    }

    // Ensure all factions have a standing row
    const standingMap = {};
    for (const s of standings) standingMap[s.faction_id] = s;
    const missingFactions = factions.filter(f => !standingMap[f.id]);
    if (missingFactions.length > 0) {
        await seedFactionElectoralStanding(supabase, nation, missingFactions, profile);
        const { data: newRows } = await supabase
            .from('faction_electoral_standing')
            .select('*')
            .in('faction_id', missingFactions.map(f => f.id))
            .eq('nation_id', nation.id);
        for (const r of (newRows || [])) {
            standings.push(r);
            standingMap[r.faction_id] = r;
        }
    }

    // ── 7. Load last campaign action tick per faction ──
    const { data: lastActions } = await supabase
        .from('campaign_actions')
        .select('party_id, tick_performed')
        .in('party_id', factionIds)
        .order('tick_performed', { ascending: false })
        .limit(factionIds.length * 2);
    const lastActionTickMap = new Map();
    for (const action of (lastActions || [])) {
        if (!lastActionTickMap.has(action.party_id)) {
            lastActionTickMap.set(action.party_id, action.tick_performed);
        }
    }

    // ── 8. Compute governance momentum nudge ──
    const govApproval = Number(nation.gov_approval ?? 40);
    const govNudge = clamp(
        round2((govApproval - 50) / CFG.APPROVAL_GOV_NUDGE_DIVISOR),
        -CFG.APPROVAL_GOV_NUDGE_CAP,
        CFG.APPROVAL_GOV_NUDGE_CAP
    );

    // ── 9. Phase 2C: Drift issue salience toward stat-driven targets ──
    const updatedIssueStates = await tickIssueSalience(supabase, nation, issueStates || [], currentTick);

    // ── 10. Phase 2C: Drift electorate profile toward stat-driven targets ──
    const updatedProfile = await tickElectorateProfile(supabase, nation, profile, currentTick);
    const activeProfile = updatedProfile || profile;

    // ── 11. Build salience-weighted axis weights from (updated) issue states ──
    const axisSalienceWeights = computeAxisSalienceWeights(updatedIssueStates);

    // ── 12. Load faction stances for platform appeal ──
    const { data: allStances } = await supabase
        .from('faction_issue_stance')
        .select('*')
        .in('faction_id', factionIds)
        .eq('nation_id', nation.id);
    const stancesByFaction = {};
    for (const s of (allStances || [])) {
        if (!stancesByFaction[s.faction_id]) stancesByFaction[s.faction_id] = [];
        stancesByFaction[s.faction_id].push(s);
    }

    // Build issue state lookup
    const issueStateMap = {};
    for (const is of updatedIssueStates) issueStateMap[is.issue_id] = is;

    // ── 13. Phase 2C: Decay stance strength ──
    await tickStanceDecay(supabase, allStances || [], currentTick);

    // ── 14. Calculate pillars for each faction ──
    const updates = [];

    for (const standing of standings) {
        const factionId = standing.faction_id;
        const ideo = ideoMap[factionId];
        const lastActionTick = lastActionTickMap.get(factionId) ?? -999;
        const ticksSinceAction = currentTick - lastActionTick;
        const isCoalition = coalitionPartyIds.has(factionId);
        const isLead = factionId === leadPartyId;

        // ─── PILLAR 1: Ideological Alignment (0-100) ───
        const targetAlignment = ideo
            ? computeTickAlignment(ideo, activeProfile, axisSalienceWeights)
            : CFG.DEFAULT_ALIGNMENT;

        // Drift toward target
        const oldAlignment = Number(standing.ideological_alignment ?? 50);
        const alignDelta = clamp(targetAlignment - oldAlignment, -CFG.ALIGNMENT_DRIFT_SPEED, CFG.ALIGNMENT_DRIFT_SPEED);
        const newAlignment = round2(clamp(oldAlignment + alignDelta, 0, 100));

        // ─── PILLAR 2: Platform Appeal (0-100) ───
        const factionStances = stancesByFaction[factionId] || [];
        const appealResult = computePlatformAppeal(
            factionStances, issueStateMap, ideo, newAlignment
        );
        const oldAppeal = Number(standing.platform_appeal ?? CFG.DEFAULT_PLATFORM_APPEAL);
        const appealDelta = clamp(appealResult.appeal - oldAppeal, -CFG.APPEAL_DRIFT_SPEED, CFG.APPEAL_DRIFT_SPEED);
        const newAppeal = round2(clamp(oldAppeal + appealDelta, CFG.APPEAL_MIN, CFG.APPEAL_MAX));

        // ─── PILLAR 3: Party Approval (0-100) ───
        const oldApproval = Number(standing.party_approval ?? 50);
        let approvalTarget;

        if (isCoalition) {
            // Governing parties: approval drifts based on gov_approval
            approvalTarget = govApproval;
        } else if (currentTick >= CFG.VISIBILITY_INACTIVITY_THRESHOLD &&
                   ticksSinceAction >= CFG.VISIBILITY_INACTIVITY_THRESHOLD) {
            // Inactive opposition: drift toward skepticism
            approvalTarget = CFG.APPROVAL_OPPOSITION_TARGET;
        } else {
            // Active opposition: hold steady
            approvalTarget = oldApproval;
        }

        // Lead party gets full gov nudge, coalition gets partial
        let approvalNudge = 0;
        if (isLead) {
            approvalNudge = govNudge;
        } else if (isCoalition) {
            approvalNudge = round2(govNudge * CFG.APPROVAL_COALITION_SHARE);
        }

        const approvalDelta = clamp(approvalTarget - oldApproval, -CFG.APPROVAL_DRIFT_SPEED, CFG.APPROVAL_DRIFT_SPEED);
        const newApproval = round2(clamp(oldApproval + approvalDelta + approvalNudge, CFG.APPROVAL_MIN, CFG.APPROVAL_MAX));

        // ─── VISIBILITY (turnout multiplier, not a pillar) ───
        let newVisibility = Number(standing.visibility ?? CFG.DEFAULT_VISIBILITY);
        if (currentTick >= CFG.VISIBILITY_INACTIVITY_THRESHOLD &&
            ticksSinceAction >= CFG.VISIBILITY_INACTIVITY_THRESHOLD) {
            newVisibility = round2(newVisibility * CFG.VISIBILITY_DECAY);
        }
        const visFloor = isCoalition ? CFG.VISIBILITY_GOV_FLOOR : CFG.VISIBILITY_FLOOR;
        newVisibility = round2(clamp(newVisibility, visFloor, 100));

        // ─── CREDIBILITY (recovery toward 1.0) ───
        let newCredibility = Number(standing.credibility_modifier ?? 1.0);
        if (newCredibility < 1.0) {
            // Check if recovery is suspended
            const suspendedUntil = Number(standing.credibility_recovery_suspended_until ?? 0);
            if (currentTick >= suspendedUntil) {
                newCredibility = round3(Math.min(1.0, newCredibility + CFG.CREDIBILITY_RECOVERY_RATE));
            }
        }
        newCredibility = round3(clamp(newCredibility, CFG.CREDIBILITY_MIN, CFG.CREDIBILITY_MAX));

        // ─── RAW APPEAL = weighted pillar sum × credibility ───
        const rawAppeal = round2(
            (newAlignment * CFG.PILLAR_WEIGHT_ALIGNMENT +
             newAppeal * CFG.PILLAR_WEIGHT_APPEAL +
             newApproval * CFG.PILLAR_WEIGHT_APPROVAL) * newCredibility
        );

        // ─── Per-pillar contribution (for diagnostics/display) ───
        const alignContrib = round2(newAlignment * CFG.PILLAR_WEIGHT_ALIGNMENT);
        const appealContrib = round2(newAppeal * CFG.PILLAR_WEIGHT_APPEAL);
        const approvalContrib = round2(newApproval * CFG.PILLAR_WEIGHT_APPROVAL);

        updates.push({
            id: standing.id,
            faction_id: factionId,
            nation_id: nation.id,
            ideological_alignment: newAlignment,
            platform_appeal: newAppeal,
            party_approval: newApproval,
            ideology_baseline: round2(appealResult.ideologyBaseline),
            stance_contribution_total: round2(appealResult.stanceContribution),
            platform_ceiling: round2(appealResult.ceiling),
            visibility: newVisibility,
            credibility_modifier: newCredibility,
            raw_appeal: rawAppeal,
            alignment_contribution: round2(alignContrib / 100),
            appeal_contribution: round2(appealContrib / 100),
            approval_contribution: round2(approvalContrib / 100),
            last_updated_tick: currentTick,
        });
    }

    // ── 11. Softmax → contested_vote_share ──
    computeContestedVoteShares(updates);

    // ── 12. Turnout → realized_vote_share ──
    computeRealizedVoteShares(updates, profile);

    // ── 13. Compute vote_left_on_table ──
    for (const u of updates) {
        u.vote_left_on_table = round2(Math.max(0,
            (u.contested_vote_share || 0) - (u.realized_vote_share || 0)
        ));
    }

    // ── 14. Batch-write standings ──
    let failCount = 0;
    for (const u of updates) {
        const { error } = await supabase
            .from('faction_electoral_standing')
            .update({
                ideological_alignment: u.ideological_alignment,
                platform_appeal: u.platform_appeal,
                party_approval: u.party_approval,
                ideology_baseline: u.ideology_baseline,
                stance_contribution_total: u.stance_contribution_total,
                platform_ceiling: u.platform_ceiling,
                visibility: u.visibility,
                credibility_modifier: u.credibility_modifier,
                raw_appeal: u.raw_appeal,
                contested_vote_share: u.contested_vote_share,
                base_vote_share: u.base_vote_share,
                realized_vote_share: u.realized_vote_share,
                turnout_rate: u.turnout_rate,
                alignment_contribution: u.alignment_contribution,
                appeal_contribution: u.appeal_contribution,
                approval_contribution: u.approval_contribution,
                vote_left_on_table: u.vote_left_on_table,
                last_updated_tick: u.last_updated_tick,
            })
            .eq('id', u.id);
        if (error) {
            console.error(`[Electorate] Failed to update standing for faction ${u.faction_id}:`, error.message);
            failCount++;
        }
    }
    if (failCount > 0) {
        console.error(`[Electorate] ${failCount}/${updates.length} standing updates failed for ${nation.name}`);
    }

    // ── 15. Write national_vote_share to factions table ──
    await updateNationalVoteShare(supabase, updates, inactiveFactions, nation);

    console.log(`[Electorate] Tick ${currentTick}: updated ${updates.length} standings for ${nation.name}`);
}

// ============================================================================
// PILLAR 1: Ideological Alignment (tick computation)
// ============================================================================

/**
 * Compute alignment between a faction's ideology and the electorate profile,
 * weighted by current axis salience.
 *
 * Uses Gaussian overlap: exp(-d² / 2σ²) per axis, weighted by salience.
 * Same algorithm as genesis but with live salience weights.
 *
 * @param {object} ideo - faction_ideology row (-100 to +100 per axis)
 * @param {object} profile - electorate_profile row
 * @param {object} axisSalienceWeights - { axisKey: weight } from issue states
 * @returns {number} 0-100 alignment
 */
function computeTickAlignment(ideo, profile, axisSalienceWeights) {
    let weightedAlignment = 0;
    let totalWeight = 0;

    for (const axisKey of AXIS_KEYS) {
        const partyScore = Number(ideo[axisKey] || 0);
        const elecMean = Number(profile['ideo_mean_' + axisKey] ?? 50);
        const elecVar = Number(profile['ideo_var_' + axisKey] ?? 20);

        // Salience: blend profile default with issue-driven weights
        const profileSalience = Number(profile['salience_' + axisKey] ?? 0.2);
        const issueSalience = axisSalienceWeights[axisKey] ?? 0.2;
        const weight = (profileSalience + issueSalience) / 2;

        const partyNorm = (partyScore + 100) / 2;
        const distance = Math.abs(partyNorm - elecMean);
        const sigma = Math.max(5, elecVar);
        const alignment = Math.exp(-(distance * distance) / (2 * sigma * sigma));

        weightedAlignment += alignment * weight;
        totalWeight += weight;
    }

    if (totalWeight <= 0) return 50;
    return round2(clamp((weightedAlignment / totalWeight) * 100, 0, 100));
}

/**
 * Compute axis salience weights from issue_state rows.
 * Each issue's salience is distributed across its axes according to ISSUE_AXIS_SALIENCE.
 * The result is normalized so weights sum to 1.0.
 *
 * @param {object[]} issueStates - Array of issue_state rows
 * @returns {object} { axisKey: weight } normalized to sum to 1.0
 */
function computeAxisSalienceWeights(issueStates) {
    const rawWeights = {};
    for (const axisKey of AXIS_KEYS) rawWeights[axisKey] = 0;

    for (const issue of issueStates) {
        const salience = Number(issue.salience ?? 30);
        const axisMap = ISSUE_AXIS_SALIENCE[issue.issue_id];
        if (!axisMap) continue;

        for (const [axisKey, axisWeight] of Object.entries(axisMap)) {
            rawWeights[axisKey] += salience * axisWeight;
        }
    }

    // Normalize to sum to 1.0
    const total = Object.values(rawWeights).reduce((a, b) => a + b, 0);
    const result = {};
    for (const axisKey of AXIS_KEYS) {
        result[axisKey] = total > 0 ? round3(rawWeights[axisKey] / total) : round3(1 / AXIS_KEYS.length);
    }
    return result;
}

// ============================================================================
// VOTE SHARE PIPELINE
// ============================================================================

/**
 * Softmax over raw_appeal → contested_vote_share.
 *
 * contested_vote_share represents how voters would split if everyone voted.
 * Temperature controls how "winner-take-all" the distribution is.
 *
 * @param {object[]} updates - Array of standing update objects (mutated in place)
 */
function computeContestedVoteShares(updates) {
    if (updates.length === 0) return;

    const k = CFG.SOFTMAX_TEMPERATURE;
    const appeals = updates.map(u => u.raw_appeal);
    const maxAppeal = Math.max(...appeals);

    // Softmax with numerical stability (subtract max)
    const exps = appeals.map(a => Math.exp((a - maxAppeal) / k));
    const sumExp = exps.reduce((a, b) => a + b, 0);

    for (let i = 0; i < updates.length; i++) {
        updates[i].contested_vote_share = sumExp > 0
            ? round4(exps[i] / sumExp)
            : round4(1 / updates.length);
        // base_vote_share = contested (before turnout adjustment)
        updates[i].base_vote_share = updates[i].contested_vote_share;
    }
}

/**
 * Apply turnout to convert contested_vote_share → realized_vote_share.
 *
 * Each faction has a turnout rate based on:
 *   - Base turnout (65%)
 *   - Enthusiasm bonus (from electorate profile)
 *   - Visibility bonus (visible parties mobilize more supporters)
 *
 * realized_vote_share = contested_vote_share × turnout_rate (renormalized)
 *
 * @param {object[]} updates - Array of standing update objects (mutated in place)
 * @param {object} profile - electorate_profile row
 */
function computeRealizedVoteShares(updates, profile) {
    if (updates.length === 0) return;

    const enthusiasm = Number(profile?.enthusiasm ?? 50);

    // Compute per-faction turnout rate
    for (const u of updates) {
        const vis = Number(u.visibility ?? 30);
        const enthBonus = (enthusiasm - 50) * CFG.TURNOUT_ENTHUSIASM_SCALE;
        const visBonus = Math.max(0, (vis - 50)) * CFG.TURNOUT_VISIBILITY_SCALE;
        u.turnout_rate = round3(clamp(CFG.TURNOUT_BASE + enthBonus + visBonus, 0.3, 0.95));
    }

    // realized = contested × turnout (then renormalize)
    let totalRealized = 0;
    for (const u of updates) {
        u.realized_vote_share = u.contested_vote_share * u.turnout_rate;
        totalRealized += u.realized_vote_share;
    }

    // Renormalize so realized shares sum to 1.0
    if (totalRealized > 0) {
        for (const u of updates) {
            u.realized_vote_share = round4(u.realized_vote_share / totalRealized);
        }
    } else {
        const even = round4(1 / updates.length);
        for (const u of updates) {
            u.realized_vote_share = even;
        }
    }
}

function round4(v) { return Math.round(v * 10000) / 10000; }

// ============================================================================
// NATIONAL VOTE SHARE AGGREGATION
// ============================================================================

/**
 * Write realized_vote_share as a percentage to factions.national_vote_share.
 * Zero out inactive factions so stale data doesn't persist.
 *
 * @param {object} supabase
 * @param {object[]} updates - Standing update objects with realized_vote_share
 * @param {object[]} inactiveFactions - Factions excluded from calculation
 * @param {object} nation
 */
async function updateNationalVoteShare(supabase, updates, inactiveFactions, nation) {
    for (const u of updates) {
        const pct = round2((u.realized_vote_share || 0) * 100);
        await supabase.from('factions')
            .update({ national_vote_share: pct })
            .eq('id', u.faction_id);
    }

    // Zero inactive
    for (const f of inactiveFactions) {
        await supabase.from('factions')
            .update({ national_vote_share: 0 })
            .eq('id', f.id);
    }
    if (inactiveFactions.length > 0) {
        console.log(`[Electorate] Zeroed national_vote_share for ${inactiveFactions.length} inactive parties in ${nation.name}`);
    }
}

// ============================================================================
// PHASE 2C: ISSUE SALIENCE DRIFT
// ============================================================================

/**
 * Drift each issue's salience toward a stat-driven target.
 *
 * Target is recomputed each tick from nation stats (same formula as genesis).
 * Salience drifts at SALIENCE_DRIFT_SPEED per tick, never below salience_floor.
 * When stats are good (low badness), salience decays toward the floor.
 *
 * Also updates salience_target for display purposes.
 *
 * @param {object} supabase
 * @param {object} nation - Full nation row
 * @param {object[]} issueStates - Current issue_state rows
 * @param {number} currentTick
 * @returns {object[]} Updated issue state rows (in-memory, also written to DB)
 */
async function tickIssueSalience(supabase, nation, issueStates, currentTick) {
    if (issueStates.length === 0) return issueStates;

    const updates = [];

    for (const issue of issueStates) {
        const def = ISSUE_DEFS[issue.issue_id];
        if (!def) continue;

        // Recompute target from current stats
        const target = computeIssueSalience(nation, def.stats);
        const floor = Number(issue.salience_floor ?? CFG.DEFAULT_SALIENCE_FLOOR);
        const old = Number(issue.salience ?? 30);

        // Drift toward target
        const delta = clamp(target - old, -CFG.SALIENCE_DRIFT_SPEED, CFG.SALIENCE_DRIFT_SPEED);
        let newSalience = round2(clamp(old + delta, floor, CFG.SALIENCE_MAX));

        // Extra decay toward floor when stats are healthy (target < floor + 10)
        if (target < floor + 10 && newSalience > floor) {
            newSalience = round2(Math.max(floor, newSalience - CFG.SALIENCE_DECAY_TOWARD_FLOOR));
        }

        // Update in-memory for downstream use
        issue.salience = newSalience;
        issue.salience_target = round2(target);

        updates.push({
            id: issue.id,
            salience: newSalience,
            salience_target: round2(target),
            last_updated_tick: currentTick,
        });
    }

    // Batch write
    for (const u of updates) {
        await supabase.from('issue_state')
            .update({ salience: u.salience, salience_target: u.salience_target, last_updated_tick: u.last_updated_tick })
            .eq('id', u.id);
    }

    return issueStates;
}

// ============================================================================
// PHASE 2C: ELECTORATE PROFILE DRIFT
// ============================================================================

/**
 * Drift electorate ideological means and variances toward stat-driven targets.
 *
 * Each tick, the target ideo means/vars are recomputed from current nation stats
 * (same formulas as genesis). The profile drifts slowly toward those targets.
 * This makes the electorate responsive to nation changes without sudden jumps.
 *
 * Demographics are NOT drifted per-tick (they change via events/elections only).
 *
 * @param {object} supabase
 * @param {object} nation - Full nation row
 * @param {object} profile - Current electorate_profile row
 * @param {number} currentTick
 * @returns {object} Updated profile (in-memory, also written to DB)
 */
async function tickElectorateProfile(supabase, nation, profile, currentTick) {
    const changes = {};
    let anyChange = false;

    // ── Drift ideo means ──
    for (const axisKey of AXIS_KEYS) {
        const col = 'ideo_mean_' + axisKey;
        const old = Number(profile[col] ?? 50);

        // Recompute target from current stats
        const influences = IDEO_STAT_MAP[axisKey] || [];
        let shift = 0;
        for (const inf of influences) {
            const statVal = getStat(nation, inf.stat);
            shift += ((statVal - 50) / 50) * inf.direction * inf.weight;
        }
        const target = clamp(50 + shift * CFG.IDEO_STAT_SENSITIVITY * 50, 5, 95);

        const delta = clamp(target - old, -CFG.PROFILE_IDEO_DRIFT_SPEED, CFG.PROFILE_IDEO_DRIFT_SPEED);
        const newVal = round2(clamp(old + delta, 5, 95));

        if (newVal !== old) {
            changes[col] = newVal;
            profile[col] = newVal;
            anyChange = true;
        }
    }

    // ── Drift ideo variances ──
    const globalInfluences = IDEO_VARIANCE_STAT_MAP._global || [];
    let varianceShift = 0;
    for (const inf of globalInfluences) {
        const statVal = getStat(nation, inf.stat);
        varianceShift += ((statVal - 50) / 50) * inf.direction * inf.weight;
    }
    const targetVar = clamp(CFG.IDEO_VARIANCE_BASE + varianceShift * CFG.IDEO_VARIANCE_SENSITIVITY * 50, 5, 45);

    for (const axisKey of AXIS_KEYS) {
        const col = 'ideo_var_' + axisKey;
        const old = Number(profile[col] ?? 20);
        const delta = clamp(targetVar - old, -CFG.PROFILE_VAR_DRIFT_SPEED, CFG.PROFILE_VAR_DRIFT_SPEED);
        const newVal = round2(clamp(old + delta, 5, 45));

        if (newVal !== old) {
            changes[col] = newVal;
            profile[col] = newVal;
            anyChange = true;
        }
    }

    // ── Update axis salience weights from current issue salience ──
    // (will be recomputed fully in the main loop, but store for display)

    if (anyChange) {
        changes.last_updated_tick = currentTick;
        await supabase.from('electorate_profile')
            .update(changes)
            .eq('id', profile.id);
    }

    return profile;
}

// ============================================================================
// PHASE 2C: PLATFORM APPEAL COMPUTATION
// ============================================================================

/**
 * Compute platform appeal for a faction based on its stances and issue salience.
 *
 * Formula:
 *   appeal = ideology_baseline × BASELINE_WEIGHT
 *          + stance_contribution × STANCE_WEIGHT
 *
 * ideology_baseline: derived from ideological alignment (floor for appeal)
 * stance_contribution: sum of per-stance scores weighted by issue salience
 *
 * Per-stance score:
 *   - Base: strength × (salience / 100)
 *   - Pioneer bonus: +PIONEER_BONUS if is_pioneer
 *   - Consistency bonus: +CONSISTENCY_BONUS if ideologically_consistent
 *   - Inconsistency penalty: -INCONSISTENCY_PENALTY if !ideologically_consistent
 *   - Scaled to 0-100
 *
 * @param {object[]} stances - faction_issue_stance rows for this faction
 * @param {object} issueStateMap - { issue_id: issue_state row }
 * @param {object} ideo - faction_ideology row (or null)
 * @param {number} alignment - current ideological alignment (0-100)
 * @returns {{ appeal, ideologyBaseline, stanceContribution, ceiling }}
 */
function computePlatformAppeal(stances, issueStateMap, ideo, alignment) {
    // Ideology baseline: parties with better alignment have a higher floor
    const ideologyBaseline = alignment * CFG.APPEAL_IDEOLOGY_BASELINE_WEIGHT;

    if (!stances || stances.length === 0) {
        // No stances → appeal is purely from ideology baseline
        const appeal = round2(clamp(ideologyBaseline, CFG.APPEAL_MIN, CFG.APPEAL_MAX));
        return { appeal, ideologyBaseline: round2(ideologyBaseline), stanceContribution: 0, ceiling: appeal };
    }

    // Compute stance contribution
    let stanceScore = 0;
    let maxPossibleScore = 0;

    for (const stance of stances) {
        const issueState = issueStateMap[stance.issue_id];
        const salience = Number(issueState?.salience ?? 30);
        const strength = Number(stance.strength ?? 50);

        // Base contribution: strength scaled by salience
        // At salience=100, strength=100 → 100 points
        let contribution = (strength / 100) * (salience / 100) * 100;

        // Pioneer bonus
        if (stance.is_pioneer) {
            contribution += CFG.APPEAL_PIONEER_BONUS;
        }

        // Consistency bonus/penalty
        if (stance.ideologically_consistent) {
            contribution += CFG.APPEAL_CONSISTENCY_BONUS;
        } else {
            contribution -= CFG.APPEAL_INCONSISTENCY_PENALTY;
        }

        stanceScore += Math.max(0, contribution);
        maxPossibleScore += 100 + CFG.APPEAL_PIONEER_BONUS + CFG.APPEAL_CONSISTENCY_BONUS;
    }

    // Normalize stance score to 0-100
    const normalizedStance = maxPossibleScore > 0
        ? (stanceScore / maxPossibleScore) * 100
        : 0;

    const stanceContribution = normalizedStance * CFG.APPEAL_STANCE_WEIGHT;
    const rawAppeal = ideologyBaseline + stanceContribution;
    const ceiling = round2(clamp(rawAppeal, CFG.APPEAL_MIN, CFG.APPEAL_MAX));
    const appeal = ceiling;

    return {
        appeal,
        ideologyBaseline: round2(ideologyBaseline),
        stanceContribution: round2(stanceContribution),
        ceiling,
    };
}

// ============================================================================
// PHASE 2C: STANCE DECAY
// ============================================================================

/**
 * Decay all faction stances each tick. Stances lose strength at their decay_rate
 * per tick. When strength drops below STANCE_REMOVAL_THRESHOLD, the stance is
 * deleted.
 *
 * Decay rates by intensity:
 *   - centrist: 2/tick (lasts ~50 ticks)
 *   - moderate: 4/tick (lasts ~25 ticks)
 *   - radical:  8/tick (lasts ~12 ticks)
 *
 * @param {object} supabase
 * @param {object[]} stances - All faction_issue_stance rows for this nation
 * @param {number} currentTick
 */
async function tickStanceDecay(supabase, stances, currentTick) {
    if (stances.length === 0) return;

    const toUpdate = [];
    const toDelete = [];

    for (const stance of stances) {
        const strength = Number(stance.strength ?? 100);
        const decayRate = Number(stance.decay_rate ?? 4);
        const newStrength = round2(strength - decayRate);

        if (newStrength < CFG.STANCE_REMOVAL_THRESHOLD) {
            toDelete.push(stance.id);
        } else {
            toUpdate.push({
                id: stance.id,
                strength: newStrength,
                ticks_held: (Number(stance.ticks_held ?? 0)) + 1,
                ticks_at_current_intensity: (Number(stance.ticks_at_current_intensity ?? 0)) + 1,
            });
        }
    }

    // Batch update surviving stances
    for (const u of toUpdate) {
        await supabase.from('faction_issue_stance')
            .update({ strength: u.strength, ticks_held: u.ticks_held, ticks_at_current_intensity: u.ticks_at_current_intensity })
            .eq('id', u.id);
    }

    // Delete expired stances
    if (toDelete.length > 0) {
        await supabase.from('faction_issue_stance')
            .delete()
            .in('id', toDelete);
        console.log(`[Electorate] Removed ${toDelete.length} expired stances`);
    }
}
