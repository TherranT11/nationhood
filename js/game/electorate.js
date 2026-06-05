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
import { fetchActiveCoalition, deriveLeadPartyId } from './government-structure.js';
import { computeEngagementScores } from './engagement.js';

// ============================================================================
// ISSUE DEFINITIONS
// ============================================================================

/**
 * Inactivity-driven seat penalties.
 *
 * Single source of truth for both browser-side filters (politics.js
 * forecast, elections.js candidate eligibility) and the per-tick seat
 * drain / auto-disband loop in advance-tick. The edge function bundle
 * mirrors these constants locally — see handler-template.ts for the
 * "must match" comment.
 *
 * Seat-loss model:
 *   ticksInactive < DRAIN          → no penalty
 *   DRAIN ≤ ticksInactive < DISBAND → lose 5% of seats per tick (min 1
 *                                      lost; floor at 1 seat remaining)
 *   ticksInactive ≥ DISBAND        → hard-disband (party row DELETEd;
 *                                      monarchies trigger succession)
 *
 * Vacated seats are NOT redistributed to remaining parties — they sit
 * empty until the next election re-allocates the chamber. Hard-delete
 * at the disband threshold (vs the soft-delete used by manual disband
 * and no-confidence cascade) wipes the party entirely: seats, cash,
 * standing, audit trail. FK cascades take care of related rows.
 */
export const INACTIVITY_DRAIN_THRESHOLD   = 9;
export const INACTIVITY_DISBAND_THRESHOLD = 14;
export const INACTIVITY_DRAIN_RATE        = 0.05; // 5%/tick of current seats
export const INACTIVITY_DRAIN_FLOOR       = 1;    // never drain below 1 seat

/**
 * The 8 core issues tracked by the electorate engine.
 * Each issue maps to a set of nation stats (for salience computation)
 * and one or more ideology axes (for stance alignment).
 */
export const ISSUE_DEFS = {
    cost_of_living: {
        label: 'Cost of Living',
        // Alpha refactor: inflation/housing_affordability/fuel_prices columns
        // dropped; cost_of_living absorbs the inflation/fuel signals.
        stats: ['cost_of_living'],
        axes: ['liberty_equality', 'individualism_collectivism'],
    },
    immigration: {
        label: 'Immigration',
        // Alpha refactor: illegal_immigration/emigration/ethnic_diversity dropped.
        stats: ['immigration'],
        axes: ['globalism_nationalism', 'security_freedom'],
    },
    healthcare: {
        label: 'Healthcare',
        // Alpha refactor: healthcare_*, beds_per_100k, lifespan all collapsed
        // into the unified `health` column.
        stats: ['health'],
        axes: ['liberty_equality', 'individualism_collectivism'],
    },
    unemployment: {
        label: 'Unemployment',
        // Canonical-stats Phase 3: unemployment/labor_force_participation
        // map to unskilled_workers (inversion handled via statDirectionSign).
        // minimum_wage replaced by `wages`. poverty_rate →
        // standard_of_living (inverted).
        stats: ['unskilled_workers', 'standard_of_living', 'wages'],
        axes: ['liberty_equality', 'individualism_collectivism'],
    },
    corruption: {
        label: 'Corruption',
        // Alpha refactor: corruption/press_freedom/efficiency dropped;
        // judicial_independence → authority.
        stats: ['authority'],
        axes: ['tradition_progress', 'security_freedom'],
    },
    education: {
        label: 'Education',
        // Alpha refactor: literacy/higher_education/education_accessibility/
        // academic_immigration all collapsed into `education`.
        stats: ['education'],
        axes: ['tradition_progress', 'individualism_collectivism'],
    },
    infrastructure: {
        label: 'Infrastructure',
        // Alpha refactor: physical_infrastructure/digital_infrastructure/
        // rail_network → infrastructure; energy_generation → energy.
        stats: ['infrastructure', 'energy'],
        axes: ['tradition_progress', 'globalism_nationalism'],
    },
    climate: {
        label: 'Climate & Environment',
        // Alpha refactor: pollution/carbon_emissions/renewable_energy_percentage
        // dropped; arable_land → farmland.
        stats: ['farmland'],
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
// Alpha refactor: many of the legacy stats that drove demographic shifts
// (population_growth, median_age, lifespan, income_inequality, social_mobility,
// religiosity, ethnic_diversity, housing_affordability, ...) were collapsed
// or dropped. The translations below remap surviving signals onto the 19
// alpha columns; rows that referenced only dropped stats become empty arrays
// so the band falls back to its schema default.
//
// Inversions:
//   poverty_rate (high = bad) → standard_of_living (high = good): flip direction
const DEMOGRAPHIC_STAT_MAP = {
    age: {
        age_18_29:  [],
        age_30_44:  [{ stat: 'education', weight: 0.3, direction: 1 }],
        age_45_64:  [{ stat: 'skilled_workers', weight: 0.2, direction: 1 }],
        age_65plus: [{ stat: 'health', weight: 0.5, direction: 1 }],
    },
    income: {
        income_low:    [{ stat: 'standard_of_living', weight: 0.6, direction: -1 }],
        income_middle: [],
        income_upper:  [{ stat: 'gdp_growth', weight: 0.3, direction: 1 }, { stat: 'education', weight: 0.3, direction: 1 }],
        income_high:   [{ stat: 'gdp_growth', weight: 0.2, direction: 1 }],
    },
    education: {
        edu_nodegree: [{ stat: 'education', weight: 0.5, direction: -1 }],
        edu_undergrad: [{ stat: 'education', weight: 0.5, direction: 1 }],
        edu_postgrad:  [{ stat: 'education', weight: 0.5, direction: 1 }],
    },
    urbanization: {
        urban_rural:     [{ stat: 'skilled_workers', weight: 0.6, direction: -1 }, { stat: 'farmland', weight: 0.3, direction: 1 }],
        urban_smalltown: [{ stat: 'skilled_workers', weight: 0.2, direction: -1 }],
        urban_suburban:  [{ stat: 'skilled_workers', weight: 0.3, direction: 1 }],
        urban_urban:     [{ stat: 'skilled_workers', weight: 0.6, direction: 1 }],
    },
    religion: {
        religion_secular:  [{ stat: 'education', weight: 0.2, direction: 1 }],
        religion_moderate: [],
        religion_devout:   [],
    },
    nativity: {
        nativity_majority:  [{ stat: 'immigration', weight: 0.3, direction: -1 }],
        nativity_minority:  [],
        nativity_immigrant: [{ stat: 'immigration', weight: 0.5, direction: 1 }],
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
    PILLAR_WEIGHT_ENGAGEMENT: 0.40,
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
    // Mirror of INACTIVITY_DRAIN_THRESHOLD — parties unseen for this many
    // ticks are excluded from electorate calculations (and start losing
    // seats per the inactivity processor in advance-tick).
    INACTIVITY_EXCLUSION_TICKS: INACTIVITY_DRAIN_THRESHOLD,

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
 *   engagement(50) * 0.35 + momentum(0) * 0.25 + ideology * 0.30 + govApprovalPillar * 0.10
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

    // Governing factions = party_ids[] + the PM's party. lead_party_id isn't
    // on government_formations; deriveLeadPartyId is the canonical helper.
    const { data: coalitionRow } = await supabase
        .from('government_formations')
        .select('party_ids, ministry_assignments, proposed_by')
        .eq('nation_id', nation.id)
        .eq('status', 'active')
        .single();
    const governingIds = new Set(coalitionRow?.party_ids || []);
    const leadPartyId = deriveLeadPartyId(coalitionRow);
    if (leadPartyId) governingIds.add(leadPartyId);

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
    // engagement and momentum carry the weight. Existing standings still
    // need to be in the softmax so a new party doesn't get 100% share from
    // being computed in isolation.
    const govApprovalPillar = clamp(50 + (govApproval - 35) * (50 / 65), 0, 100);

    for (const r of rows) {
        r.raw_appeal = round2(
            50 * 0.35 +       // engagement: neutral at genesis
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
    // Retired 2026-05. Elections compute vote share entirely from
    // faction_sector_popularity in the run_election RPC (20260517);
    // the rawAppeal / softmax pillar pipeline was removed. Kept as a
    // callable no-op because the tick processor still invokes it.
    return;
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
    // (Engagement 35%, Momentum 25%, Ideology 30%, Gov Approval 10%).
    return;
}

// ============================================================================
// PHASE 4: CAMPAIGN ACTION ELECTORATE HOOKS
// ============================================================================

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
