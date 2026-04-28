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
 * Phase 4:  Campaign action integration (visibility, approval, credibility, stances, activity log)
 */

import { statDirectionSign } from './stats.js';
import { fetchActiveCoalition } from './government-structure.js';
import { deductAP } from './config.js';
import { computeEngagementScores } from './engagement.js';

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
const DEMOGRAPHIC_STAT_MAP = {
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
// CONFIGURATION KNOBS
// ============================================================================

const ELECTORATE_CONFIG = {
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
    IDEO_VARIANCE_SENSITIVITY: 0.7,

    // -- Salience --
    SALIENCE_STAT_SENSITIVITY: 0.5, // how strongly stat badness drives salience up
    SALIENCE_MIN: 5,
    SALIENCE_MAX: 95,

    // -- Issue seeding --
    ISSUE_COUNT: 8,                 // all 8 issues are always seeded

    // -- Standing defaults --
    DEFAULT_ALIGNMENT: 50,
    DEFAULT_PLATFORM_APPEAL: 0,
    DEFAULT_PARTY_APPROVAL: 25,
    DEFAULT_VISIBILITY: 0,
    DEFAULT_CREDIBILITY: 1.0,  // 50% credibility score (formula: (modifier - 0.5) * 100)

    // ── Election pillar weights ──
    // Phase 5a: ideology pillar removed. The remaining engagement +
    // momentum pillars carry the signal; gov_approval stays at 0 for
    // consistency with the prior tuning. Sum doesn't have to equal 1 —
    // raw_appeal feeds a softmax for contested_vote_share that
    // re-normalizes regardless.
    PILLAR_WEIGHT_GOVERNANCE: 0.40,
    PILLAR_WEIGHT_MOMENTUM: 0.30,
    PILLAR_WEIGHT_IDEOLOGY: 0.00,
    PILLAR_WEIGHT_GOV_APPROVAL: 0.00,

    // ── Alignment tick config ──
    ALIGNMENT_DRIFT_SPEED: 2,       // max points per tick toward target alignment

    // ── Centrist zone penalty ──
    // Direct penalty per axis where a party sits in the centrist zone.
    // Scales with polarization. At max polarization, a party centrist on all
    // 5 axes loses 5 × 4 = 20 points of alignment — a massive hit.
    CENTRIST_ZONE_PENALTY_PER_AXIS: 4, // alignment points lost per centrist axis at max polarization

    // ── Party approval config ──
    APPROVAL_GOV_NUDGE_DIVISOR: 2.5,  // (gov_approval - 50) / divisor = nudge
    APPROVAL_GOV_NUDGE_CAP: 8,        // max ±nudge per tick
    APPROVAL_COALITION_SHARE: 0.25,    // non-lead coalition parties get 25% of nudge
    APPROVAL_OPPOSITION_TARGET: 45,    // inactive opposition drifts toward this
    APPROVAL_DRIFT_SPEED: 1.5,         // max points per tick drift toward target
    APPROVAL_MIN: 10,
    APPROVAL_MAX: 90,

    // ── Visibility config ──
    VISIBILITY_DECAY: 0.985,         // ~1.5% decay per tick (always active)
    VISIBILITY_FLOOR: 10,
    VISIBILITY_GOV_FLOOR: 25,        // governing parties stay more visible
    VISIBILITY_INACTIVITY_THRESHOLD: 3, // ticks without action before approval drift kicks in

    // ── Credibility config (REMOVED — 3-pillar election system) ──
    // CREDIBILITY_MIN, CREDIBILITY_MAX, CREDIBILITY_RECOVERY_RATE removed.

    // ── Vote share config ──
    SOFTMAX_TEMPERATURE: 12,          // softmax k (higher = more uniform distribution)
    TURNOUT_BASE: 0.50,               // base turnout fraction
    TURNOUT_POLARIZATION_SCALE: 0.002, // per polarization point: higher polarization → more turnout
    TURNOUT_VISIBILITY_SCALE: 0.002,  // per visibility point above 50
    TURNOUT_MAX: 0.88,               // hard cap on turnout rate

    // ── Inactivity ──
    INACTIVITY_EXCLUSION_TICKS: 12,   // parties unseen for this many ticks are excluded

    // ── Phase 2C: Issue salience drift ──
    SALIENCE_DRIFT_SPEED: 2,          // max salience points per tick toward target
    SALIENCE_OWNERSHIP_BONUS: 10,     // bonus salience when a faction "owns" an issue
    SALIENCE_DECAY_TOWARD_FLOOR: 0.5, // per-tick drift toward floor when stats are good

    // ── Phase 2C: Electorate profile drift ──
    PROFILE_IDEO_DRIFT_SPEED: 0.5,    // max ideo mean drift per tick
    PROFILE_VAR_DRIFT_SPEED: 0.5,     // max variance drift per tick

    // ── Phase 2C: Platform appeal ──
    APPEAL_IDEOLOGY_BASELINE_WEIGHT: 0.3,  // how much alignment contributes to appeal floor
    APPEAL_STANCE_WEIGHT: 0.7,             // how much stances contribute to appeal
    APPEAL_PIONEER_BONUS: 5,               // bonus for being the first faction on an issue
    APPEAL_CONSISTENCY_BONUS: 3,           // bonus for ideologically consistent stances
    APPEAL_INCONSISTENCY_PENALTY: 5,       // penalty for inconsistent stances
    // APPEAL_DRIFT_SPEED removed (old 5-pillar system)
    APPEAL_MIN: 10,
    APPEAL_MAX: 90,

    // ── Phase 2C: Stance decay ──
    STANCE_REMOVAL_THRESHOLD: 5,      // strength below this → remove the stance
    MAX_STANCES_PER_FACTION: 5,       // max active stances

    // ── Diminishing returns on same-tick campaign actions ──
    CAMPAIGN_ACTION_DIMINISHING: [1.0, 0.75, 0.50, 0.25],  // multiplier for 1st, 2nd, 3rd, 4th+ action
    CAMPAIGN_ACTION_FLOOR: 0.25,                             // multiplier floor for 5th+ actions

    // ── Enthusiasm config ──
    ENTHUSIASM_NATURAL_DECAY: 1,          // -1/tick passive decay
    ENTHUSIASM_RESTING: 35,               // natural resting point
    ENTHUSIASM_DRIFT_SPEED: 3,            // max drift per tick toward target
    ENTHUSIASM_INACTIVE_PENALTY: 3,       // per inactive party per tick
    ENTHUSIASM_CRISIS_BONUS: 4,           // per active crisis
    ENTHUSIASM_POLARIZATION_SCALE: 0.2,   // bonus per polarization point above 50
    ENTHUSIASM_ELECTION_PROXIMITY: 10,    // max bonus when election is imminent
    ENTHUSIASM_ELECTION_WINDOW: 20,       // ticks before election when bonus ramps up
    ENTHUSIASM_GOV_EXTREME_SCALE: 0.15,   // bonus per |gov_approval - 50| point
    ENTHUSIASM_STANCE_BOOST_MIN: 1,       // Take a Stance: 1d3 (min)
    ENTHUSIASM_STANCE_BOOST_MAX: 3,       // Take a Stance: 1d3 (max)
    ENTHUSIASM_MIN: 10,
    ENTHUSIASM_MAX: 95,
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

import { round2, round3 } from './momentum.js';
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
 * Phase 5a: ideology-axis means / variances / salience are no longer
 * computed here — those columns are slated for deletion in Phase 5b.
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row with stat columns
 * @param {number} [currentTick=0] - The current tick
 * @returns {object} The upserted electorate_profile row
 */
async function seedElectorateProfile(supabase, nation, currentTick = 0) {
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

    // Phase 5a: ideology axes (ideo_mean_*, ideo_var_*, salience_*) are no
    // longer derived. Their consumers (computeSpatialAlignments and the
    // ideology pillar) are gone. The column data is going away in Phase 5b.

    // ── 5. Upsert ──
    const row = {
        nation_id: nation.id,
        ...demographics,
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
// GENESIS: seedFactionElectoralStanding (3-pillar system)
// ============================================================================

/**
 * Seed faction_electoral_standing rows for all active factions in a nation.
 *
 * Initial raw_appeal uses the 3-pillar formula:
 *   governance(50) * 0.35 + momentum(0) * 0.25 + ideology * 0.30 + govApprovalPillar * 0.10
 * where govApprovalPillar = clamp(50 + (gov_approval - 35) * (50/65), 0, 100).
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row
 * @param {object[]} factions - Array of faction rows (id, seats, etc.)
 * @param {object} [profile] - electorate_profile row (fetched if not provided)
 * @returns {object[]} The upserted faction_electoral_standing rows
 */
async function seedFactionElectoralStanding(supabase, nation, factions, profile = null) {
    if (!factions || factions.length === 0) return [];

    // Fetch profile if not provided
    if (!profile) {
        const { data } = await supabase
            .from('electorate_profile')
            .select('*')
            .eq('nation_id', nation.id)
            .maybeSingle();
        profile = data;
    }

    // Fetch ideologies for ALL active factions in the nation (not just the ones being seeded)
    // so that spatial alignment is calculated with proper competition from existing parties.
    // Without this, a single new party gets uncompeted alignment (70-90+) and inflated vote share.
    const factionIds = factions.map(f => f.id);
    const { data: allNationFactions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party')
        .is('abandoned_at', null);
    const allFactionIds = (allNationFactions || []).map(f => f.id);

    // Phase 5a: ideology pillar removed from the electorate engine. We no
    // longer fetch faction_ideology or compute spatial alignment against the
    // electorate_profile — the pillar weight is zero, the column is going
    // away in Phase 5b, and the work was a tick-time hot path.

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
        // Party approval: governing factions inherit gov_approval, new parties start low
        const approval = governingIds.has(faction.id) ? govApproval : CFG.DEFAULT_PARTY_APPROVAL;

        rows.push({
            faction_id: faction.id,
            nation_id: nation.id,
            platform_appeal: CFG.DEFAULT_PLATFORM_APPEAL,
            party_approval: round2(approval),
            visibility: CFG.DEFAULT_VISIBILITY,
            credibility_modifier: CFG.DEFAULT_CREDIBILITY,
            credibility_radius_component: 0,
            credibility_promise_component: 0,
            last_updated_tick: 0,
        });
    }

    // Compute initial raw_appeal so elections running before the first tick
    // don't see NULL contested_vote_share. Phase 5a: ideology pillar dropped;
    // governance and momentum carry the weight. Existing standings still
    // need to be in the softmax so a new party doesn't get 100% share from
    // being computed in isolation.
    const govApprovalPillar = clamp(50 + (govApproval - 35) * (50 / 65), 0, 100);

    for (const r of rows) {
        r.raw_appeal = round2(
            50 * 0.35 +       // governance: neutral at genesis
            0 * 0.25 +        // momentum: 0 at genesis
            0 * 0.30 +        // ideology: pillar removed in Phase 5a
            govApprovalPillar * 0.10
        );
    }

    // Fetch existing standings so softmax includes ALL parties (not just the new ones)
    const existingFactionIds = allFactionIds.filter(id => !factionIds.includes(id));
    let allRows = [...rows];
    if (existingFactionIds.length > 0) {
        const { data: existingStandings } = await supabase
            .from('faction_electoral_standing')
            .select('faction_id, nation_id, raw_appeal, contested_vote_share, realized_vote_share, turnout_rate')
            .eq('nation_id', nation.id)
            .in('faction_id', existingFactionIds);
        if (existingStandings && existingStandings.length > 0) {
            allRows = [...rows, ...existingStandings];
        }
    }

    computeContestedVoteShares(allRows);
    computeRealizedVoteShares(allRows, profile, nation);

    // Copy computed values back to the new rows only (existing standings aren't written)
    for (const r of rows) {
        const computed = allRows.find(a => a.faction_id === r.faction_id);
        if (computed) {
            r.contested_vote_share = computed.contested_vote_share;
            r.realized_vote_share = computed.realized_vote_share;
            r.turnout_rate = computed.turnout_rate;
        }
        r.base_vote_share = r.contested_vote_share;
        r.turnout_rate = r.turnout_rate || 0.65;
    }

    const { data, error } = await supabase
        .from('faction_electoral_standing')
        .upsert(rows, { onConflict: 'faction_id,nation_id' })
        .select();

    if (error) {
        console.error(`[Electorate] Failed to seed faction_electoral_standing for ${nation.name}:`, error.message);
        return [];
    }

    console.log(`[Electorate] Seeded ${data.length} faction_electoral_standing rows for ${nation.name} (with initial vote shares)`);
    return data;
}

/**
 * Compute initial ideological alignment between a faction and the electorate.
 *
 * Uses bimodal mixture model: at low polarization, a single Gaussian
 * centered at the electorate mean. At high polarization, two Gaussian
 * humps offset from the mean — rewarding parties that align with either
 * pole rather than sitting in the empty center.
 *
 * Returns 0-100 alignment score.
 */

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
async function genesisElectorate(supabase, nation, factions, currentTick = 0) {
    console.log(`[Electorate] Running genesis for ${nation.name}...`);

    const profile = await seedElectorateProfile(supabase, nation, currentTick);
    const standings = await seedFactionElectoralStanding(supabase, nation, factions, profile);

    console.log(`[Electorate] Genesis complete for ${nation.name}: profile=${!!profile}, standings=${standings.length}`);
    return { profile, standings };
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
 * @param {object} [opts] - Options
 * @param {boolean} [opts.snap] - If true, bypass drift caps and snap pillars to target values immediately
 */
export async function tickElectorate(supabase, nation, currentTick, opts = {}) {
    // ── 3-Pillar Electoral Standing Calculator ──
    // Runs each tick to compute contested_vote_share and turnout_rate
    // for all active parties in a nation.
    //
    // Pillars: Governance (35%) + Momentum (25%) + Ideology (30%) + Gov Approval (10%)

    const nationId = nation.id;

    // 1. Load all active parties with momentum
    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name, seats, momentum, last_seen_tick, founded_tick, abandoned_at')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party')
        .is('abandoned_at', null);

    if (!factions || factions.length === 0) return;

    // Exclude inactive parties (unseen for 12+ ticks)
    const activeFactions = factions.filter(f => {
        const ref = f.last_seen_tick ?? f.founded_tick ?? 0;
        return (currentTick - ref) < CFG.INACTIVITY_EXCLUSION_TICKS;
    });
    if (activeFactions.length === 0) return;

    const factionIds = activeFactions.map(f => f.id);

    // 2. Load electorate profile
    const { data: profile } = await supabase
        .from('electorate_profile')
        .select('*')
        .eq('nation_id', nationId)
        .maybeSingle();

    // If no profile exists, seed one (first tick after nation creation)
    if (!profile) {
        await genesisElectorate(supabase, nation, activeFactions, currentTick);
        return;
    }

    // Phase 5b: ideology shift actions and issue-salience drift removed
    // (ideology_shift_actions / issue_state tables dropped).

    // Load existing standings (for fields we don't recalculate, like platform_appeal)
    const { data: existingStandings } = await supabase
        .from('faction_electoral_standing')
        .select('faction_id, platform_appeal, visibility, credibility_modifier, party_approval')
        .eq('nation_id', nationId)
        .in('faction_id', factionIds);
    const standingMap = {};
    for (const s of (existingStandings || [])) standingMap[s.faction_id] = s;

    // 6. Determine governing faction IDs + incumbency tenure
    const { data: coalitionRow } = await supabase
        .from('government_formations')
        .select('lead_party_id, party_ids')
        .eq('nation_id', nationId)
        .in('status', ['formed', 'active', 'caretaker'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    const governingIds = new Set(coalitionRow?.party_ids || []);
    if (coalitionRow?.lead_party_id) governingIds.add(coalitionRow.lead_party_id);

    // Incumbency tenure: ticks since current administration started
    let incumbencyTicks = 0;
    if (governingIds.size > 0) {
        const { data: adminRow } = await supabase
            .from('administrations')
            .select('started_at_tick')
            .eq('nation_id', nationId)
            .order('started_at_tick', { ascending: false })
            .limit(1)
            .maybeSingle();
        incumbencyTicks = adminRow?.started_at_tick
            ? Math.max(0, currentTick - adminRow.started_at_tick)
            : 0;
    }

    // 7. Compute engagement scores (Governance pillar)
    const coalitionPartyIds = new Set(coalitionRow?.party_ids || []);
    const leadPartyId = coalitionRow?.lead_party_id || null;
    // Phase 5b: issue_state table dropped — engagement scoring no longer
    // takes per-issue salience as input. Pass an empty array to keep the
    // public signature stable.
    let engagementResults = {};
    try {
        engagementResults = await computeEngagementScores(
            supabase, nation, activeFactions, coalitionPartyIds, leadPartyId, [], currentTick
        ) || {};
    } catch (engErr) {
        console.warn(`[tickElectorate] Engagement scores failed for ${nation.name}, using defaults:`, engErr.message);
    }

    // Phase 5a: ideology pillar removed. The remaining pillars (governance,
    // momentum) carry the signal. computeSpatialAlignments was the per-tick
    // ideology computation; no longer called.

    // ── Gov Approval pillar (10% — currently weighted 0) ──
    // Map gov_approval (0-100, centered ~35-65) to a 0-100 pillar score
    const govApproval = clamp(Number(nation.gov_approval ?? 50), 0, 100);
    const govApprovalPillar = clamp(50 + (govApproval - 35) * (50 / 65), 0, 100);

    // ── Build standing updates ──
    const updates = [];

    for (const f of activeFactions) {
        const existing = standingMap[f.id] || {};

        // PILLAR 1: Momentum (0-100 from factions.momentum)
        const momentum = clamp(Number(f.momentum ?? 0), 0, 100);

        // PILLAR 2: Governance (0-100 from engagement score)
        const engagement = engagementResults[f.id]?.engagementScore ?? 50;

        // Party approval: governing parties drift toward gov_approval,
        // opposition drifts toward a target based on their momentum
        let partyApproval = Number(existing.party_approval ?? CFG.DEFAULT_PARTY_APPROVAL);
        if (governingIds.has(f.id)) {
            // Governing: nudge toward gov_approval
            const target = govApproval;
            const nudge = clamp((target - partyApproval) / CFG.APPROVAL_GOV_NUDGE_DIVISOR,
                -CFG.APPROVAL_GOV_NUDGE_CAP, CFG.APPROVAL_GOV_NUDGE_CAP);
            partyApproval = clamp(partyApproval + nudge, CFG.APPROVAL_MIN, CFG.APPROVAL_MAX);
        } else {
            // Opposition: drift toward target based on momentum
            const target = CFG.APPROVAL_OPPOSITION_TARGET + (momentum - 50) * 0.3;
            const diff = target - partyApproval;
            const drift = clamp(diff, -CFG.APPROVAL_DRIFT_SPEED, CFG.APPROVAL_DRIFT_SPEED);
            partyApproval = clamp(partyApproval + drift, CFG.APPROVAL_MIN, CFG.APPROVAL_MAX);
        }

        // ── Combine pillars into raw_appeal ──
        // Phase 5a: ideology and gov_approval terms drop out (their weights
        // are 0); kept in the formula for symmetry with the genesis path.
        const rawAppeal = round2(
            engagement * CFG.PILLAR_WEIGHT_GOVERNANCE +
            momentum * CFG.PILLAR_WEIGHT_MOMENTUM +
            0 * CFG.PILLAR_WEIGHT_IDEOLOGY +
            govApprovalPillar * CFG.PILLAR_WEIGHT_GOV_APPROVAL
        );

        updates.push({
            faction_id: f.id,
            nation_id: nationId,
            party_approval: round2(partyApproval),
            visibility: round2(momentum),
            raw_appeal: rawAppeal,
            last_updated_tick: currentTick,
        });
    }

    // ── Vote share pipeline ──
    computeContestedVoteShares(updates);
    computeRealizedVoteShares(updates, profile, nation);

    // Ensure turnout_rate has a sane default and strip transient properties before DB write
    for (const u of updates) {
        u.base_vote_share = u.contested_vote_share;
        u.turnout_rate = u.turnout_rate || 0.65;
        delete u._incumbencyBonus;
    }

    // ── Write to faction_electoral_standing ──
    const { error: upsertErr } = await supabase
        .from('faction_electoral_standing')
        .upsert(updates, { onConflict: 'faction_id,nation_id' });

    if (upsertErr) {
        console.error(`[tickElectorate] Failed to upsert standings for ${nation.name}:`, upsertErr.message);
        return;
    }

    console.log(`[tickElectorate] Updated ${updates.length} electoral standings for ${nation.name} (tick ${currentTick})`);
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

    const k = CFG.SOFTMAX_TEMPERATURE || 8; // guard against zero/undefined
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
function computeRealizedVoteShares(updates, profile, nation) {
    if (updates.length === 0) return;

    // Uniform turnout: all parties get the same base turnout rate.
    // Elections are determined by Momentum/Ideology/Governance through raw_appeal only.
    // No visibility-based turnout distortion.
    const baseTurnout = 0.65;

    for (const u of updates) {
        u.turnout_rate = baseTurnout;
        u.realized_vote_share = u.contested_vote_share;
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
        const { error } = await supabase.from('factions')
            .update({ national_vote_share: pct })
            .eq('id', u.faction_id);
        if (error) { console.error('[Electorate] factions vote_share update failed:', error.message); continue; }
    }

    // Zero inactive
    for (const f of inactiveFactions) {
        const { error } = await supabase.from('factions')
            .update({ national_vote_share: 0 })
            .eq('id', f.id);
        if (error) { console.error('[Electorate] factions zero vote_share update failed:', error.message); continue; }
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
async function tickElectorateProfile(supabase, nation, profile, currentTick, enthusiasmContext = {}) {
    const changes = {};
    let anyChange = false;

    // Phase 5a: ideo_mean_* / ideo_var_* drift removed. Their downstream
    // consumers (computeSpatialAlignments and the ideology pillar) are gone,
    // and the columns drop in Phase 5b. Enthusiasm drift below stays.

    // ── Drift enthusiasm ──
    const oldEnthusiasm = Number(profile.enthusiasm ?? CFG.DEFAULT_ENTHUSIASM);
    const { nextElectionTick, crisisCount, inactiveCount } = enthusiasmContext;

    // 1. Natural decay toward resting point
    let enthusiasmDelta = -CFG.ENTHUSIASM_NATURAL_DECAY;

    // 2. Inactive parties drag enthusiasm down
    if (inactiveCount > 0) {
        enthusiasmDelta -= inactiveCount * CFG.ENTHUSIASM_INACTIVE_PENALTY;
    }

    // 3. Active crises raise urgency
    if (crisisCount > 0) {
        enthusiasmDelta += crisisCount * CFG.ENTHUSIASM_CRISIS_BONUS;
    }

    // 4. High polarization energizes voters
    const polarization = Number(nation.polarization ?? 50);
    if (polarization > 50) {
        enthusiasmDelta += (polarization - 50) * CFG.ENTHUSIASM_POLARIZATION_SCALE;
    }

    // 5. Election proximity ramps up enthusiasm
    if (nextElectionTick != null) {
        const ticksUntil = nextElectionTick - currentTick;
        if (ticksUntil > 0 && ticksUntil <= CFG.ENTHUSIASM_ELECTION_WINDOW) {
            const proximity = 1 - (ticksUntil / CFG.ENTHUSIASM_ELECTION_WINDOW);
            enthusiasmDelta += proximity * CFG.ENTHUSIASM_ELECTION_PROXIMITY;
        }
    }

    // 6. Very good or very bad governance drives engagement
    const govApproval = Number(nation.gov_approval ?? 50);
    const govExtreme = Math.abs(govApproval - 50);
    enthusiasmDelta += govExtreme * CFG.ENTHUSIASM_GOV_EXTREME_SCALE;

    // Apply delta with drift speed cap
    const clampedDelta = clamp(enthusiasmDelta, -CFG.ENTHUSIASM_DRIFT_SPEED, CFG.ENTHUSIASM_DRIFT_SPEED);
    const newEnthusiasm = round2(clamp(oldEnthusiasm + clampedDelta, CFG.ENTHUSIASM_MIN, CFG.ENTHUSIASM_MAX));

    if (newEnthusiasm !== oldEnthusiasm) {
        changes.enthusiasm = newEnthusiasm;
        profile.enthusiasm = newEnthusiasm;
        anyChange = true;
    }

    // ── Update axis salience weights from current issue salience ──
    // (will be recomputed fully in the main loop, but store for display)

    if (anyChange) {
        changes.last_updated_tick = currentTick;
        const { error: profErr } = await supabase.from('electorate_profile')
            .update(changes)
            .eq('id', profile.id);
        if (profErr) console.error('[Electorate] electorate_profile update failed:', profErr.message);
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

// ============================================================================
// PHASE 4: CAMPAIGN ACTION HELPERS
// ============================================================================
// These functions are called by the existing campaign action implementations
// in political-actions.js to update the new electorate tables in parallel
// with the legacy faction_bloc_approval writes.

/**
 * Get the diminishing-returns multiplier for the Nth campaign action this tick,
 * then increment the counter. Prevents burst AP spending from being as effective
 * as spreading actions across multiple ticks.
 *
 * @param {object} supabase
 * @param {string} standingId - faction_electoral_standing row id
 * @param {number} currentCount - current campaign_actions_this_tick value
 * @returns {number} multiplier (1.0, 0.75, 0.50, 0.25, ...)
 */
function getDiminishingMultiplier(currentCount) {
    const schedule = CFG.CAMPAIGN_ACTION_DIMINISHING;
    if (currentCount < schedule.length) return schedule[currentCount];
    return CFG.CAMPAIGN_ACTION_FLOOR;
}

/**
 * Boost a faction's visibility after a campaign action (Rally, Outreach, etc.)
 * Applies diminishing returns when multiple actions are taken in the same tick.
 *
 * @param {object} supabase
 * @param {string} factionId
 * @param {string} nationId
 * @param {number} boost - Positive visibility increment (e.g., 5-15)
 */
async function boostVisibility(supabase, factionId, nationId, boost) {
    // No-op: visibility column repurposed for momentum (3-pillar election system).
    // Server-side tickElectionPillars overwrites visibility with momentum each tick.
    return;
}

// nudgeApproval removed — all 41 calls converted to adjust_momentum RPC.

/**
 * Nudge the nation-wide enthusiasm on electorate_profile.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {number} delta - Signed enthusiasm change (e.g., +2, -3)
 */
export async function nudgeEnthusiasm(supabase, nationId, delta) {
    if (!delta || delta === 0) return;

    const { data: profile } = await supabase
        .from('electorate_profile')
        .select('id, enthusiasm')
        .eq('nation_id', nationId)
        .maybeSingle();
    if (!profile) return;

    const old = Number(profile.enthusiasm ?? CFG.DEFAULT_ENTHUSIASM);
    const newEnthusiasm = round2(clamp(old + delta, CFG.ENTHUSIASM_MIN, CFG.ENTHUSIASM_MAX));

    const { error } = await supabase.from('electorate_profile')
        .update({ enthusiasm: newEnthusiasm })
        .eq('id', profile.id);
    if (error) console.error('[Electorate] enthusiasm update failed:', error.message);
}

/**
 * Damage or boost a faction's credibility_modifier after an attack or scandal.
 *
 * @param {object} supabase
 * @param {string} factionId
 * @param {string} nationId
 * @param {number} delta - Signed credibility change (e.g., -0.1 for damage, +0.05 for boost)
 * @param {number} [suspendRecoveryTicks=0] - If > 0, suspend credibility recovery for this many ticks
 * @param {number} [currentTick=0] - Current tick (needed for suspend calculation)
 */
export async function adjustCredibility(supabase, factionId, nationId, delta, suspendRecoveryTicks = 0, currentTick = 0, opts = {}) {
    // No-op: credibility system removed — 3-pillar election system
    // (Governance 35%, Momentum 25%, Ideology 30%, Gov Approval 10%).
    return;
}

// ============================================================================
// PHASE 4: CAMPAIGN ACTION ELECTORATE HOOKS
// ============================================================================

/**
 * Hook called after executeRally() to update electorate tables.
 *
 * Rally boosts visibility. Outcome quality determines boost size.
 * Rousing = big boost, gaffe/counter = no boost (or penalty).
 *
 * @param {object} supabase
 * @param {string} factionId
 * @param {string} nationId
 * @param {string} outcomeId - Rally outcome (rousing, solid, low, gaffe, divisive, counter)
 * @param {number} currentTick
 */
export async function onRally(supabase, factionId, nationId, outcomeId, currentTick) {
    const visBoost = {
        rousing: 3,
        solid: 2,
        low: 1,
        gaffe: -1,
        divisive: -3,
        counter: -3,
    }[outcomeId] ?? 0;

    if (visBoost !== 0) {
        await boostVisibility(supabase, factionId, nationId, visBoost);
    }

    // Approval penalties for bad outcomes
    const approvalHit = {
        gaffe: -3,
        divisive: -2,
        counter: -3,
    }[outcomeId] ?? 0;
    if (approvalHit !== 0) {
        await supabase.rpc('adjust_momentum', { p_faction_id: factionId, p_delta: approvalHit, p_label: `Rally outcome (${approvalHit > 0 ? '+' : ''}${approvalHit})`, p_tick: currentTick });
    }

    await logActivity(supabase, factionId, nationId, 'rally',
        'Rally', `Rally — ${outcomeId}`,
        outcomeId === 'gaffe' || outcomeId === 'counter' || outcomeId === 'divisive' ? 'failure' : 'success',
        3, currentTick
    );

    return { visBoost, approvalHit };
}

/**
 * Hook called after executeAttack() to update electorate tables.
 *
 * Attack damages target's credibility (on success) or attacker's (on backfire).
 * Also boosts attacker's visibility (any publicity is publicity).
 *
 * @param {object} supabase
 * @param {string} factionId - Attacker
 * @param {string} targetFactionId - Target
 * @param {string} nationId
 * @param {string} outcomeId - Attack outcome
 * @param {string} strength - 'strong', 'moderate', 'weak'
 * @param {number} currentTick
 */
export async function onAttack(supabase, factionId, targetFactionId, nationId, outcomeId, strength, currentTick) {
    // Credibility damage to target (on success)
    const targetCredDelta = {
        devastating: -0.15,
        effective: -0.08,
        glancing: -0.03,
        backfire: 0,       // target takes no credibility damage on backfire
        mutual: -0.05,
    }[outcomeId] ?? 0;

    // Credibility damage to self (on backfire/mutual)
    const selfCredDelta = {
        devastating: 0,
        effective: 0,
        glancing: 0,
        backfire: -0.10,
        mutual: -0.05,
    }[outcomeId] ?? 0;

    // Suspend target recovery for a few ticks (strong evidence = longer)
    const suspendTicks = strength === 'strong' ? 5 : strength === 'moderate' ? 3 : 1;

    if (targetCredDelta !== 0) {
        await adjustCredibility(supabase, targetFactionId, nationId, targetCredDelta, suspendTicks, currentTick, { source: 'attack:received' });
    }
    if (selfCredDelta !== 0) {
        await adjustCredibility(supabase, factionId, nationId, selfCredDelta, suspendTicks, currentTick, { source: 'attack:self' });
    }

    // Attacker always gains some visibility (political theater)
    await boostVisibility(supabase, factionId, nationId, 5);

    // Target also gains involuntary visibility from being attacked
    if (['devastating', 'effective'].includes(outcomeId)) {
        await boostVisibility(supabase, targetFactionId, nationId, 3);
    }

    const outcome = outcomeId === 'backfire' ? 'backfire'
        : outcomeId === 'mutual' ? 'neutral'
        : 'success';
    await logActivity(supabase, factionId, nationId, 'attack',
        'Attack', `Attack (${strength}) — ${outcomeId}`,
        outcome, 3, currentTick
    );
}

// ============================================================================
// PHASE 4: ACTIVITY LOG
// ============================================================================

/**
 * Write a row to the activity_log table.
 *
 * @param {object} supabase
 * @param {string} factionId
 * @param {string} nationId
 * @param {string} actionType - e.g., 'rally', 'outreach', 'attack', 'take_stance'
 * @param {string} actionLabel - Short display label
 * @param {string} description - Longer description
 * @param {string} outcome - 'success', 'failure', 'backfire', 'neutral', 'pending'
 * @param {number} apSpent
 * @param {number} tick
 */
async function logActivity(supabase, factionId, nationId, actionType, actionLabel, description, outcome, apSpent, tick) {
    const { error } = await supabase.from('activity_log').insert({
        faction_id: factionId,
        nation_id: nationId,
        action_type: actionType,
        action_label: actionLabel,
        description,
        outcome,
        ap_spent: apSpent,
        tick,
    });
    if (error) {
        console.error(`[Electorate] Failed to log activity (${actionType}):`, error.message);
    }
}
