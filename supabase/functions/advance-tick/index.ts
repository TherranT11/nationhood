// @ts-nocheck
/**
 * Supabase Edge Function: advance-tick
 *
 * Server-side tick processor for Nationhood Alpha.
 * Called by pg_cron every minute — checks if next_tick_at has passed,
 * acquires a database lock, and processes the full game tick.
 *
 * AUTO-GENERATED — do not edit index.ts directly.
 * Source: js/game-common.js + supabase/functions/advance-tick/handler-template.ts
 * Regenerate with: node scripts/sync-edge-function.js
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let rpcPreflightCheckPromise = null;

async function ensureApRpcAvailability(supabase) {
    if (!rpcPreflightCheckPromise) {
        rpcPreflightCheckPromise = (async () => {
            const probeFactionId = "00000000-0000-0000-0000-000000000000";

            const probes = [
                {
                    name: "accumulate_ap",
                    call: () => supabase.rpc("accumulate_ap", {
                        p_faction_id: probeFactionId,
                        p_gain: 0,
                        p_max_ap: 20,
                    }),
                },
                {
                    name: "deduct_ap",
                    call: () => supabase.rpc("deduct_ap", {
                        p_faction_id: probeFactionId,
                        p_cost: 0,
                    }),
                },
            ];

            for (const probe of probes) {
                const { error } = await probe.call();
                if (error) {
                    throw new Error(
                        `Missing or inaccessible required RPC '${probe.name}'. Deploy SQL function/grants before rolling out advance-tick. Detail: ${error.message}`
                    );
                }
            }
            console.log("[advance-tick] RPC preflight passed for accumulate_ap and deduct_ap.");
        })();
    }

    return rpcPreflightCheckPromise;
}

// ===== GAME LOGIC (from js/game-common.js) =====

// ────────── config ──────────


// ==================== CONSTANTS ====================

const GAME_CONFIG = {
    TOTAL_SEATS: 120,
    MAJORITY_SEATS: 61,
    VOTING_WINDOW_TICKS: 6,
    QUORUM_THRESHOLD: 0.5,           // 50% of seats must participate (yes+no+abstain) for quorum
    COMMITTEE_EXPIRY_TICKS: 6,
    DRAFT_BILL_AP_COST: 2,
    VETO_APPROVAL_COST: 3,
    NO_CONFIDENCE_AP_COST: 5,
    NO_CONFIDENCE_VOTING_TICKS: 6,
    NO_CONFIDENCE_COOLDOWN_TICKS: 6,
    FOUNDATIONAL_AP_COST: 3,
    FOUNDATIONAL_VOTING_TICKS: 6,
    SUPERMAJORITY_THRESHOLD: 2/3,
    EARLY_ELECTION_TICKS: 6,
    EARLY_ELECTION_PM_APPROVAL_COST: 5,
    EARLY_ELECTION_COALITION_APPROVAL_COST: 3,
    // Presidential Democracy
    PRESIDENTIAL_TERM_TICKS: 48,
    PARLIAMENTARY_TERM_TICKS: 24,
    VETO_OVERRIDE_THRESHOLD: 2/3,
    PRESIDENT_DESK_TICKS: 6,
    MINISTER_CONFIRMATION_VOTING_TICKS: 6,
    PRESIDENTIAL_TERM_LIMIT: 2,           // max terms before incumbent must step aside
    PRESIDENTIAL_CANDIDATE_LEAD_TICKS: 6, // ticks before presidential election to generate candidates
    MAX_AP: 10,  // maximum action points a party can accumulate
    TICKS_PER_YEAR: 12,
    // (Budget bill system removed)
    // Impeachment (Presidential systems only)
    IMPEACHMENT_AP_COST: 7,
    IMPEACHMENT_COMMITTEE_TICKS: 2,        // debate period before floor vote
    IMPEACHMENT_MOTION_VOTING_TICKS: 6,    // floor vote window for impeachment motion
    IMPEACHMENT_TRIAL_TICKS: 3,            // trial period (conviction vote window)
    IMPEACHMENT_MOTION_COOLDOWN_TICKS: 10, // cooldown after failed motion
    IMPEACHMENT_ACQUITTAL_COOLDOWN_TICKS: 20, // cooldown after acquittal
    IMPEACHMENT_EMERGENCY_ELECTION_TICKS: 6,  // ticks until emergency presidential election
    // Charge precondition thresholds
    IMPEACHMENT_CORRUPTION_THRESHOLD: 40,     // corruption stat >= this for corruption charge
    IMPEACHMENT_INCOMPETENCE_THRESHOLD: 25,   // gov_approval <= this for incompetence charge
    IMPEACHMENT_INCOMPETENCE_TICKS: 6,        // consecutive ticks below threshold
    IMPEACHMENT_VETO_ABUSE_COUNT: 2,          // vetoed bills with >66% support

    // ── Autocracy v2 Faction Actions ──
    PLEDGE_ALLEGIANCE_AP: 2,
    PLEDGE_ALLEGIANCE_LOYALTY: 8,
    PLEDGE_ALLEGIANCE_STANDING: -2,
    PLEDGE_ALLEGIANCE_COMPLY_LOYALTY: 13,     // when under Demand Loyalty order
    PLEDGE_ALLEGIANCE_COMPLY_STANDING: -3,
    PLEDGE_ALLEGIANCE_STANDING_FLOOR: 5,      // standing cannot drop below this from pledging

    CONSOLIDATE_POWER_AP: 2,
    CONSOLIDATE_POWER_STANDING: 6,
    CONSOLIDATE_POWER_LOYALTY: -3,

    DEMONSTRATE_COMPETENCE_AP: 3,
    DEMONSTRATE_COMPETENCE_STANDING: 4,
    DEMONSTRATE_COMPETENCE_LOYALTY: 3,
    DEMONSTRATE_COMPETENCE_COST: 2,           // $2M from embezzled funds
    DEMONSTRATE_COMPETENCE_NATION_STAT: 0.3,
    DEMONSTRATE_COMPETENCE_REDUCED_STANDING: 2, // when can't afford cost

    EMBEZZLE_FUNDS_AP: 1,
    EMBEZZLE_FUNDS_LOYALTY: -5,
    EMBEZZLE_FUNDS_BASE_INCOME: 5,            // $5M base
    EMBEZZLE_FUNDS_INCOME_FLOOR: 3,           // $3M minimum
    EMBEZZLE_FUNDS_BASE_DETECTION: 0.10,      // 10% base
    EMBEZZLE_FUNDS_CONSECUTIVE_BONUS: 0.05,   // +5% per consecutive tick
    EMBEZZLE_FUNDS_DETECTION_FLOOR: 0.03,     // 3% minimum
    EMBEZZLE_FUNDS_DETECTION_CAP: 0.50,       // 50% maximum
    EMBEZZLE_FUNDS_DETECTED_LOYALTY: -15,
    EMBEZZLE_FUNDS_DETECTED_STANDING: -10,
    EMBEZZLE_FUNDS_DETECTED_FUNDS_SEIZURE: 0.30, // 30% seized

    BUY_INFLUENCE_AP: 3,
    BUY_INFLUENCE_STANDING: -1,
    BUY_INFLUENCE_BASE_COST: 3,               // $3M per seat base
    BUY_INFLUENCE_UNALIGNED_COST: 2,          // $2M per seat from unaligned pool
    BUY_INFLUENCE_VULNERABILITY_DISCOUNT: 0.20, // 20% cheaper vs demonstrating faction
    BUY_INFLUENCE_STRONGMAN_BASE_COST: 5,      // $5M per seat base when targeting ruling faction
    BUY_INFLUENCE_STRONGMAN_HEALTH_SCALE: 0.02, // multiplier per regime_health point (0-100)

    INTIMIDATE_AP: 2,
    INTIMIDATE_COST: 1,                        // $1M flat
    INTIMIDATE_LOYALTY: -4,
    INTIMIDATE_STANDING: 2,
    INTIMIDATE_STABILITY: -0.2,
    INTIMIDATE_BASE_EFFECTIVENESS: 4,
    INTIMIDATE_MIN_SEATS: 5,
    INTIMIDATE_VULNERABILITY_BONUS: 0.25,      // 25% more effective vs demonstrating
    INTIMIDATE_FAIL_STANDING: -3,
    INTIMIDATE_REPORT_LOYALTY: -8,
    INTIMIDATE_REPORT_STANDING: -3,
    INTIMIDATE_REPORTER_LOYALTY: 3,
    INTIMIDATE_RETALIATE_COST: 1,              // $1M
    INTIMIDATE_RETALIATE_STANDING: -2,
    INTIMIDATE_RETALIATE_SEATS: -2,
    INTIMIDATE_RETALIATOR_LOYALTY: -2,

    PURGE_AP: 3,
    PURGE_LOYALTY_THRESHOLD: 20,
    PURGE_TARGET_STANDING: -20,
    PURGE_TARGET_SEAT_LOSS: 0.30,             // 30% lost
    PURGE_TARGET_NEW_LOYALTY: 50,
    PURGE_OTHERS_LOYALTY: 5,
    PURGE_REGIME_HEALTH: -3,
    PURGE_STABILITY: -1,
    PURGE_COUP_LOCKOUT_TICKS: 6,

    REDISTRIBUTE_SEATS_AP: 2,
    REDISTRIBUTE_SEATS_COOLDOWN: 4,
    REDISTRIBUTE_SEATS_MAX_RATIO: 0.30,       // max 30% of loser's seats
    REDISTRIBUTE_SEATS_LOSER_STANDING: -3,
    REDISTRIBUTE_SEATS_LOSER_LOYALTY: -5,
    REDISTRIBUTE_SEATS_GAINER_LOYALTY: 5,

    COUP_MIN_STANDING: 15,
    COUP_MIN_SEAT_RATIO: 0.10,               // 10% of legislature
    COUP_FUNDS_THRESHOLD: 30,                  // $30M
    COUP_LOCKOUT_TICKS: 6,

    STANDING_CAP: 90,
    LOYALTY_CAP: 95,
    STANDING_RELEVANCE_DECAY_TICKS: 3,
    UNALIGNED_POOL_REGEN_TICKS: 4,            // +1 seat per 4 ticks
    UNALIGNED_POOL_MAX_RATIO: 0.10,           // max 10% of legislature
    NEW_FACTION_MIN_SEATS: 8,
};

const ENDORSEMENT_SWITCH_WINDOW_TICKS = 6;
const ENDORSEMENT_SWITCH_WINDOW_ERROR = `Endorsements can only be changed in the last ${ENDORSEMENT_SWITCH_WINDOW_TICKS} ticks before a presidential election.`;

function isEndorsementSwitchWindowOpen(currentTick, nextPresidentialTick) {
    if (!Number.isFinite(currentTick) || !Number.isFinite(nextPresidentialTick)) return false;
    const ticksUntilElection = nextPresidentialTick - currentTick;
    return ticksUntilElection >= 1 && ticksUntilElection <= ENDORSEMENT_SWITCH_WINDOW_TICKS;
}
/**
 * Update GAME_CONFIG with nation-specific seat values.
 * Call after loading the nation on each page.
 *
 * Always resets to defaults (120) when nation data is missing, so that
 * sequential multi-nation tick processing never leaks one nation's seat
 * count into the next nation's calculations.
 */
function initGameConfigForNation(nation) {
    const seats = (nation && nation.total_seats) ? nation.total_seats : 120;
    GAME_CONFIG.TOTAL_SEATS = seats;
    GAME_CONFIG.MAJORITY_SEATS = Math.floor(seats / 2) + 1;
}

const FORMATION_DEADLINE_TICKS = 3; // ticks per formation window before escalation
const SNAP_COOLDOWN_GAP = FORMATION_DEADLINE_TICKS + 2; // 5 — general snap cycle guard (overridden by formation escalation)

/**
 * Atomic AP deduction via database RPC.
 * Returns { success: true, newAp } on success, or { success: false, error } on failure.
 * The DB function checks balance and deducts in a single UPDATE, preventing race conditions.
 */
async function deductAP(supabase, factionId, cost) {
    const { data, error } = await supabase.rpc('deduct_ap', {
        p_faction_id: factionId,
        p_cost: cost
    });
    if (error) {
        console.error(`[deductAP] RPC failed for faction ${factionId}, cost ${cost}:`, error.message);
        return { success: false, error: error.message };
    }
    if (data === -1) {
        return { success: false, error: 'Insufficient AP' };
    }
    return { success: true, newAp: data };
}

/**
 * Atomic AP accumulation via database RPC.
 * Returns { success: true, newAp } on success, or { success: false, error } on failure.
 * The DB function atomically increments AP capped at max, preventing race conditions
 * with concurrent deductions.
 * Retries up to 2 additional times on transient RPC failure with short backoff.
 */
async function accumulateAP(supabase, factionId, gain, maxAp = GAME_CONFIG.MAX_AP) {
    const { data, error } = await supabase.rpc('accumulate_ap', {
        p_faction_id: factionId,
        p_gain: gain,
        p_max_ap: maxAp
    });
    if (error) {
        console.error(`[accumulateAP] RPC failed for faction ${factionId}, gain ${gain}:`, error.message);
        return { success: false, error: error.message };
    }
    if (data === -1) {
        return { success: false, error: 'Faction not found' };
    }
    return { success: true, newAp: data };
}

/**
 * Atomically switch a party endorsement target.
 *
 * Server-side RPC behavior:
 * - Reads the existing endorsement preference
 * - Deducts 1 AP only if switching from an existing different target
 * - Upserts the preference row
 *
 * Returns { success: true, newAp, endorsedPartyId } on success.
 */
async function switchPartyEndorsement(supabase, endorsingPartyId, newEndorsedPartyId, currentTick) {
    const { data, error } = await supabase.rpc('switch_party_endorsement', {
        endorsing_party_id: endorsingPartyId,
        new_endorsed_party_id: newEndorsedPartyId,
        current_tick: currentTick
    });

    if (error) {
        console.error('[switchPartyEndorsement] RPC failed:', error.message);
        const rpcMessage = String(error.message || '');
        if (rpcMessage.includes('last 6 ticks before a presidential election')) {
            return { success: false, error: ENDORSEMENT_SWITCH_WINDOW_ERROR };
        }
        return { success: false, error: error.message };
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
        success: true,
        newAp: row?.updated_ap,
        endorsedPartyId: row?.endorsed_party_id
    };
}

// ────────── government-types ──────────


/**
 * Government type helpers.
 * Call with a nation object (must have government_type field).
 */
const CANONICAL_GOVERNMENT_TYPES = Object.freeze({
    PARLIAMENTARY_DEMOCRACY: 'Democracy',
    AUTOCRACY: 'Autocracy',
    PRESIDENTIAL_REPUBLIC: 'Presidential'
});

const GOVERNMENT_TYPE_ALIASES = Object.freeze({
    democracy: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    democratic: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    parliamentary: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    parliamentarian: CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    'parliamentary democracy': CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY,
    autocracy: CANONICAL_GOVERNMENT_TYPES.AUTOCRACY,
    authoritarian: CANONICAL_GOVERNMENT_TYPES.AUTOCRACY,
    authoritarianism: CANONICAL_GOVERNMENT_TYPES.AUTOCRACY,
    dictatorship: CANONICAL_GOVERNMENT_TYPES.AUTOCRACY,
    dictatorial: CANONICAL_GOVERNMENT_TYPES.AUTOCRACY,
    'military junta': CANONICAL_GOVERNMENT_TYPES.AUTOCRACY,
    presidential: CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC,
    'presidential republic': CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC,
    'executive presidency': CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC
});

function getCanonicalGovernmentType(input, fallbackType = CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY) {
    const govType = typeof input === 'string' ? input : input?.government_type;
    if (typeof govType !== 'string') return fallbackType;
    return GOVERNMENT_TYPE_ALIASES[govType.trim().toLowerCase()] || fallbackType;
}

function isAutocracy(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.AUTOCRACY; }
function isParliamentaryDemocracy(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY; }
function isPresidentialRepublic(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC; }

function isGovernmentAutocracy(nation) { return isAutocracy(nation); }
function isGovernmentPresidential(nation) { return isPresidentialRepublic(nation); }

// Canonical government types used by nations and ministry event templates.
const canonicalNationGovTypes = ['Autocracy', 'Parliamentary Republic', 'Presidential'];

// Temporary aliases to support migration from legacy gov-type strings.
// TODO(next migration stub): remove aliases and require strict canonical-only values.
const legacyAliasMap = {
    Democracy: 'Parliamentary Republic'
};

function canonicalizeNationGovType(govType) {
    if (!govType) return null;
    return legacyAliasMap[govType] || govType;
}


// ────────── trade-constants ──────────


// ==================== TRADE SYSTEM CONSTANTS ====================

var TRADE_CONFIG = {
    BASE_TRADE_MULTIPLIER: 50000000,       // base dollar value per unit of export capacity
    BASELINE_GDP: 100000000000,            // 100B — the "average" GDP for scaling
    HISTORY_TICKS: 24,                     // keep 2 game-years of trade history
};

/**
 * Trade sectors — the 8 categories of goods/services that nations trade.
 *
 * Each sector defines:
 *   key         – unique identifier (matches trade_flows.sector column)
 *   label       – display name
 *   export_only – if true, cannot be imported (tourism, services)
 *   export_stat / export_stats – nation stat(s) driving export capacity
 *   export_threshold – minimum stat value to generate any exports (0-100 scale)
 */
var TRADE_SECTORS = [
    {
        key: 'fuel_energy',
        label: 'Fuel & Energy',
        export_only: false,
        export_stat: 'oil_and_gas',
        export_threshold: 15
    },
    {
        key: 'minerals',
        label: 'Minerals & Raw Materials',
        export_only: false,
        export_stat: 'rare_minerals',
        export_threshold: 15
    },
    {
        key: 'food_agriculture',
        label: 'Food & Agriculture',
        export_only: false,
        export_stat: 'arable_land',
        export_threshold: 20
    },
    {
        key: 'manufactured_goods',
        label: 'Manufactured Goods',
        export_only: false,
        export_stats: ['physical_infrastructure', 'higher_education'],
        export_threshold: 25
    },
    {
        key: 'technology',
        label: 'Technology & Electronics',
        export_only: false,
        export_stats: ['digital_infrastructure', 'higher_education'],
        export_threshold: 30
    },
    {
        key: 'arms',
        label: 'Arms & Military Equipment',
        export_only: false,
        export_stats: ['physical_infrastructure', 'higher_education'],
        export_threshold: 30
    },
    {
        key: 'tourism',
        label: 'Tourism',
        export_only: true,
        export_stats: ['happiness', 'stability', 'physical_infrastructure'],
        export_threshold: 25
    },
    {
        key: 'services_finance',
        label: 'Services & Finance',
        export_only: true,
        export_stats: ['higher_education', 'digital_infrastructure', 'credit'],
        export_threshold: 35
    }
];

var TRADE_SECTOR_KEYS = [];
var TRADE_SECTOR_MAP = {};
for (var _tsi = 0; _tsi < TRADE_SECTORS.length; _tsi++) {
    TRADE_SECTOR_KEYS.push(TRADE_SECTORS[_tsi].key);
    TRADE_SECTOR_MAP[TRADE_SECTORS[_tsi].key] = TRADE_SECTORS[_tsi];
}

// ==================== TRADE CALCULATION FUNCTIONS (STUBS) ====================

/**
 * Calculate a nation's export capacity for a given sector.
 * Returns raw dollar value of potential exports.
 *
 * Formulas use 0-20 scale internally (spec baseline). Since codebase stats are
 * 0-100, scores are normalized by dividing by 5.
 *
 * @param {Object} nation    – nation row with all stats (gdp in raw dollars, stats 0-100)
 * @param {Object} sector    – TRADE_SECTORS entry
 * @param {Object} [opts]    – optional: { defense_pct } for arms sector (0-100, % of budget)
 * @returns {number} export capacity in dollars (value side, after currency modifier)
 */
function calculateExportCapacity(nation, sector, opts) {
    var cfg = TRADE_CONFIG;

    // GDP modifier: bigger economies trade more in absolute terms
    var gdp = Number(nation.gdp) || 0;
    var gdpModifier = gdp / cfg.BASELINE_GDP;
    if (gdpModifier <= 0) return 0;

    // Calculate primary export score from sector stat(s) (0-100 scale)
    var score = 0;
    if (sector.export_stat) {
        score = Number(nation[sector.export_stat]) || 0;
    } else if (sector.export_stats) {
        var sum = 0;
        for (var i = 0; i < sector.export_stats.length; i++) {
            sum += Number(nation[sector.export_stats[i]]) || 0;
        }
        score = sum / sector.export_stats.length;
    }

    // Threshold check: stat must exceed sector threshold to generate any exports
    if (score <= (sector.export_threshold || 0)) return 0;

    // Normalize from 0-100 codebase scale to 0-20 spec scale
    var normalizedScore = score / 5;

    // Base capacity = normalizedScore × BASE_TRADE_MULTIPLIER × gdpModifier
    var capacity = normalizedScore * cfg.BASE_TRADE_MULTIPLIER * gdpModifier;

    // ── Sector-specific modifiers ──

    // Arms: requires meaningful defense spending to have an arms industry
    if (sector.key === 'arms') {
        var defensePct = (opts && opts.defense_pct) || 0;
        if (defensePct <= 8) return 0;
        capacity *= (defensePct / 15);  // 15% defense spending = 1.0 multiplier
    }

    // Tourism: smaller than goods trade + requires stability
    if (sector.key === 'tourism') {
        capacity *= 0.5;
        if ((Number(nation.stability) || 0) <= 25) return 0;
    }

    // Services & Finance: smaller than goods trade
    if (sector.key === 'services_finance') {
        capacity *= 0.7;
    }

    // ── Stability modifier ──
    // Political instability disrupts production across all sectors.
    // Below 40 stability, export capacity starts degrading.
    // At stability 20, capacity is halved. At 0, no exports at all.
    var stability = Number(nation.stability) || 50;
    var stabilityMod = Math.min(1.0, stability / 40);
    capacity *= stabilityMod;

    // ── Currency strength modifier ──
    // Affects export VALUE (what appears on trade page).
    // Weak currency = exports are cheaper = lower value per unit.
    // currency_strength 50 = 1.0 (neutral), 25 = 0.5 (cheap), 75 = 1.5 (premium)
    var currencyStrength = Number(nation.currency_strength) || 50;
    var currencyModifier = currencyStrength / 50;
    capacity *= currencyModifier;

    return Math.round(capacity);
}

/**
 * Calculate a nation's import demand for a given sector.
 * Returns raw dollar value of desired imports (after currency + tariff dampening).
 *
 * Each sector has its own demand formula based on what the nation LACKS.
 * Stats are normalized from 0-100 to 0-20 spec scale (/5) for formula consistency.
 * Population is normalized from raw to ~0-20 equivalent (/5M).
 *
 * @param {Object} nation    – nation row (gdp in raw dollars, stats 0-100, population raw)
 * @param {Object} sector    – TRADE_SECTORS entry
 * @param {Object} [opts]    – optional: { defense_budget, has_arms_exports } for arms sector
 * @returns {number} import demand in dollars
 */
function calculateImportDemand(nation, sector, opts) {
    // Export-only sectors have no import demand
    if (sector.export_only) return 0;

    var cfg = TRADE_CONFIG;
    var gdp = Number(nation.gdp) || 0;
    var gdpModifier = gdp / cfg.BASELINE_GDP;

    // Normalize stats from 0-100 codebase scale to 0-20 spec scale
    var SN = 5;   // stat normalizer: divide 0-100 stats by 5
    var PN = 5000000;  // population normalizer: raw pop / 5M ≈ 0-20 equivalent

    var rawDemand = 0;

    // ── FUEL & ENERGY ──
    // Import fuel if you don't produce enough domestically.
    // Driven by inverse of (oil_and_gas + energy_generation).
    if (sector.key === 'fuel_energy') {
        var oilGas = (Number(nation.oil_and_gas) || 0) / SN;
        var energyGen = (Number(nation.energy_generation) || 0) / SN;
        var domesticEnergy = (oilGas + energyGen) / 2;
        var deficiency = Math.max(0, 15 - domesticEnergy);
        rawDemand = deficiency * cfg.BASE_TRADE_MULTIPLIER * gdpModifier;
    }

    // ── MINERALS & RAW MATERIALS ──
    // Import if you lack domestic minerals but have manufacturing that needs inputs.
    // Manufacturing creates demand for raw material imports.
    else if (sector.key === 'minerals') {
        var minerals = (Number(nation.rare_minerals) || 0) / SN;
        var infra = Number(nation.physical_infrastructure) || 0;
        var edu = Number(nation.higher_education) || 0;
        var manufScore = ((infra + edu) / 2) / SN;
        var deficiency = Math.max(0, 12 - minerals);
        rawDemand = deficiency * (manufScore / 10) * cfg.BASE_TRADE_MULTIPLIER * gdpModifier;
    }

    // ── FOOD & AGRICULTURE ──
    // Everyone needs food. Import based on what you can't grow domestically.
    // Uses population as scaling factor (not GDP) — even poor nations need to eat.
    else if (sector.key === 'food_agriculture') {
        var arableLand = (Number(nation.arable_land) || 0) / SN;
        var popNorm = (Number(nation.population) || 1) / PN;
        var sufficiency = arableLand / Math.max(0.1, popNorm * 1.5);
        var deficit = Math.max(0, 1 - sufficiency);
        rawDemand = deficit * popNorm * cfg.BASE_TRADE_MULTIPLIER * 0.8;
    }

    // ── MANUFACTURED GOODS ──
    // Import what you can't make. Consumer demand (population × standard of living)
    // minus domestic production capacity.
    else if (sector.key === 'manufactured_goods') {
        var popNorm = (Number(nation.population) || 1) / PN;
        var sol = (Number(nation.standard_of_living) || 50) / SN;
        var infra = Number(nation.physical_infrastructure) || 0;
        var edu = Number(nation.higher_education) || 0;
        var manufScore = ((infra + edu) / 2) / SN;
        var consumerDemand = popNorm * (sol / 10);
        var domesticManuf = manufScore / 10;
        var deficit = Math.max(0, consumerDemand - domesticManuf);
        rawDemand = deficit * cfg.BASE_TRADE_MULTIPLIER * gdpModifier * 0.6;
    }

    // ── TECHNOLOGY & ELECTRONICS ──
    // Digital infrastructure needs minus domestic tech production.
    else if (sector.key === 'technology') {
        var popNorm = (Number(nation.population) || 1) / PN;
        var digi = (Number(nation.digital_infrastructure) || 0) / SN;
        var edu = Number(nation.higher_education) || 0;
        var techScore = ((Number(nation.digital_infrastructure) || 0) + edu) / 2 / SN;
        var techDemand = popNorm * (digi / 10) * 0.5;
        var domesticTech = techScore / 10;
        var deficit = Math.max(0, techDemand - domesticTech);
        rawDemand = deficit * cfg.BASE_TRADE_MULTIPLIER * gdpModifier * 0.5;
    }

    // ── ARMS & MILITARY EQUIPMENT ──
    // Driven by defense spending minus domestic arms production.
    // 15% of defense budget goes to equipment purchases.
    // Nations with domestic arms industries import less (only 40% of that 15%).
    else if (sector.key === 'arms') {
        var defenseBudget = (opts && opts.defense_budget) || 0;
        var domesticArms = (opts && opts.has_arms_exports) ? 0.6 : 0;
        rawDemand = defenseBudget * 0.15 * (1 - domesticArms);
    }

    if (rawDemand <= 0) return 0;

    // ── Currency strength on imports ──
    // Weak currency makes imports MORE expensive → you can afford LESS.
    // currency_strength 50 = 1.0, 25 = 0.5 (can only afford half), 75 = 1.5
    var currencyStrength = Number(nation.currency_strength) || 50;
    var affordability = currencyStrength / 50;
    rawDemand *= affordability;

    // ── Tariff dampener ──
    // Your own tariffs reduce import volume (makes foreign goods more expensive).
    // tariffs 0 = 1.0 (free trade), 50 = 0.75 (25% reduction), 100 = 0.50 (protectionist)
    var tariffs = Number(nation.tariffs) || 0;
    var tariffDampener = 1 - (tariffs / 200);
    rawDemand *= tariffDampener;

    return Math.round(rawDemand);
}

/**
 * Calculate supply/demand price modifier for a sector across all nations.
 *
 * price_ratio = totalDemand / totalSupply
 * Clamped to [0.5, 2.0] to prevent extreme swings:
 *   0.5 = severe oversupply (prices halved)
 *   1.0 = balanced market
 *   2.0 = severe undersupply (prices doubled)
 *
 * The caller should apply smoothing against the previous tick's price:
 *   smoothed = oldPrice * 0.7 + rawPrice * 0.3
 *
 * @param {number} totalSupply – aggregate export capacity across all nations
 * @param {number} totalDemand – aggregate import demand across all nations
 * @returns {number} price multiplier (0.5–2.0)
 */
function calculatePriceModifier(totalSupply, totalDemand) {
    if (totalSupply <= 0 && totalDemand <= 0) return 1.0;
    if (totalSupply <= 0) return 2.0;   // no supply, max price
    if (totalDemand <= 0) return 0.5;   // no demand, min price

    var ratio = totalDemand / totalSupply;
    return Math.max(0.5, Math.min(2.0, ratio));
}

/**
 * Calculate trade affinity between two nations.
 * Higher affinity = more likely to trade, and more volume flows between them.
 *
 * Components:
 *   base                  50 (neutral starting point)
 *   diplomatic_bonus      relation_score * 0.3           → -30 to +30
 *   trade_agreement       +15 to +25 depending on agreement type
 *   embargo_penalty       -40 if active embargo/sanctions between nations
 *   proximity_bonus       +10 if same region (future)
 *
 * @param {Object} nationA   – nation row
 * @param {Object} nationB   – nation row
 * @param {Object} relation  – diplomatic_relations row { relation_score, active_treaties }
 * @param {Object} [opts]    – { has_trade_agreement, has_fta, has_pta, has_rsc, has_embargo, same_region }
 * @returns {number} affinity score 0-100
 */
function calculateTradeAffinity(nationA, nationB, relation, opts) {
    var base = 50;

    // Diplomatic relations: -100 to +100 score → -30 to +30 affinity
    var relScore = (relation && Number(relation.relation_score)) || 0;
    var diplomaticBonus = relScore * 0.3;

    // Bilateral trade agreement: type-specific affinity boost
    // FTA (free trade) > RSC (supply contract) > PTA (partial reduction)
    var tradeBonus = 0;
    if (opts) {
        if (opts.has_fta) tradeBonus = 25;
        else if (opts.has_rsc) tradeBonus = 20;
        else if (opts.has_pta) tradeBonus = 15;
        else if (opts.has_trade_agreement) tradeBonus = 20;
    }

    // Active embargo/sanctions between these two nations: major penalty
    var embargoPenalty = (opts && opts.has_embargo) ? -40 : 0;

    // Geographic proximity: continuous bonus scaled from proximity 0-100.
    // Bordering (100) → +20, same region (50) → +10, distant (20) → +4.
    var proximity = (opts && opts.proximity != null) ? Number(opts.proximity) : 50;
    var proximityBonus = (proximity / 100) * 20;

    var affinity = base + diplomaticBonus + tradeBonus + embargoPenalty + proximityBonus;
    return Math.round(Math.max(0, Math.min(100, affinity)));
}

/**
 * Distribute an exporter's capacity among importing partners.
 *
 * Each importer receives a share proportional to their weight:
 *   weight_i = affinity_i × demand_i
 *   volume_i = exportCapacity × (weight_i / totalWeight)
 *
 * Volume is also capped at each importer's actual demand (can't import
 * more than you need). Any leftover capacity is redistributed.
 *
 * @param {number} exportCapacity – exporter's total capacity in this sector ($)
 * @param {Array}  importers      – [{ nation_id, demand, affinity }, ...]
 * @returns {Array} [{ importer_nation_id, volume }, ...] – only entries with volume > 0
 */
function distributeTradeAmongPartners(exportCapacity, importers) {
    if (!exportCapacity || exportCapacity <= 0 || !importers || importers.length === 0) {
        return [];
    }

    // Calculate weights: affinity × demand
    var weighted = [];
    var totalWeight = 0;
    for (var i = 0; i < importers.length; i++) {
        var imp = importers[i];
        var aff = Number(imp.affinity) || 0;
        var dem = Number(imp.demand) || 0;
        if (aff <= 0 || dem <= 0) continue;
        var w = aff * dem;
        weighted.push({ nation_id: imp.nation_id, demand: dem, weight: w });
        totalWeight += w;
    }

    if (totalWeight <= 0 || weighted.length === 0) return [];

    // Distribute proportionally, capped at each importer's demand.
    // Two passes: first pass allocates, second pass redistributes any surplus
    // from capped importers to remaining partners.
    var results = [];
    var remaining = exportCapacity;

    // Sort by weight descending so high-affinity partners fill first
    weighted.sort(function (a, b) { return b.weight - a.weight; });

    // Pass 1: proportional allocation, capped at demand
    var uncapped = [];
    var uncappedWeight = 0;
    for (var i = 0; i < weighted.length; i++) {
        var share = exportCapacity * (weighted[i].weight / totalWeight);
        if (share > weighted[i].demand) {
            // Capped: this importer only takes what they need
            results.push({ importer_nation_id: weighted[i].nation_id, volume: Math.round(weighted[i].demand) });
            remaining -= weighted[i].demand;
        } else {
            uncapped.push({ idx: results.length, nation_id: weighted[i].nation_id, demand: weighted[i].demand, weight: weighted[i].weight, share: share });
            uncappedWeight += weighted[i].weight;
            results.push({ importer_nation_id: weighted[i].nation_id, volume: 0 }); // placeholder
        }
    }

    // Pass 2: distribute remaining capacity among uncapped importers
    if (uncappedWeight > 0 && remaining > 0) {
        for (var i = 0; i < uncapped.length; i++) {
            var alloc = remaining * (uncapped[i].weight / uncappedWeight);
            alloc = Math.min(alloc, uncapped[i].demand);
            results[uncapped[i].idx].volume = Math.round(alloc);
        }
    }

    // Filter out zero-volume entries
    return results.filter(function (r) { return r.volume > 0; });
}

/**
 * Derive trade_balance stat (0-100) from raw trade surplus/deficit.
 *
 * Maps surplus as a ratio of GDP onto a 0-100 index:
 *   50 = balanced trade (surplus ≈ 0)
 *   100 = large trade surplus (+10% of GDP or more)
 *   0 = large trade deficit (-10% of GDP or more)
 *
 * Formula: 50 + (tradeSurplus / gdp) * 500
 * Scaled so ±10% of GDP spans the full 0-100 range.
 *
 * @param {number} tradeSurplus – totalExports - totalImports (can be negative)
 * @param {number} gdp          – nation's GDP in raw dollars
 * @returns {number} trade balance index 0-100
 */
function deriveTradeBalanceIndex(tradeSurplus, gdp) {
    if (!gdp || gdp <= 0) return 50;
    var ratio = tradeSurplus / gdp;
    var index = 50 + (ratio * 500);
    return Math.round(Math.max(0, Math.min(100, index)) * 10) / 10;
}

/**
 * Calculate tariff revenue from actual import volumes.
 *
 * tariff_revenue = totalImports × (tariffRate / 100) × collectionRate
 *
 * tariffRate is the nation's tariff stat (0-100).
 * collectionRate is how efficiently tariffs are collected (0-1),
 * typically derived from bureaucratic efficiency (~0.7 average).
 *
 * @param {number} totalImports    – actual dollar value of all imports this tick
 * @param {number} tariffRate      – nation's tariff stat (0-100)
 * @param {number} collectionRate  – collection efficiency 0-1 (default 0.7)
 * @returns {number} tariff revenue in dollars
 */
function calculateTariffRevenue(totalImports, tariffRate, collectionRate) {
    if (!totalImports || totalImports <= 0) return 0;
    var rate = (Number(tariffRate) || 0) / 100;
    var efficiency = (collectionRate != null) ? Number(collectionRate) : 0.7;
    return Math.round(totalImports * rate * efficiency);
}

/**
 * Main trade engine — runs once per tick for ALL nations simultaneously.
 *
 * Pipeline:
 *   1. Compute per-nation per-sector export capacity + import demand
 *   2. Aggregate supply/demand per sector → price modifiers (with smoothing)
 *   3. Fetch diplomatic relations → compute bilateral affinity
 *   4. For each exporter-sector, distribute capacity among importers (weighted by affinity × demand)
 *   5. Write trade_flows, trade_partners, trade_summary rows
 *   6. Update nation trade_balance stat + add tariff revenue
 *
 * @param {Object} supabase     – Supabase client
 * @param {Array}  nationList   – array of nation rows (already fetched)
 * @param {number} currentTick  – current game tick
 * @returns {Object} { processed, totalVolume }
 */
async function processTradeFlows(supabase, nationList, currentTick) {
    if (!nationList || nationList.length < 2) {
        console.log('[processTradeFlows] Need at least 2 nations for trade, skipping');
        return { processed: 0, totalVolume: 0 };
    }

    var cfg = TRADE_CONFIG;
    var sectors = TRADE_SECTORS;
    var nationCount = nationList.length;

    // Build nation lookup by id
    var nationMap = {};
    for (var ni = 0; ni < nationCount; ni++) {
        nationMap[nationList[ni].id] = nationList[ni];
    }

    // ── Step 1: Compute per-nation budget info (for arms sector opts) ──
    var budgetMap = {};
    for (var ni = 0; ni < nationCount; ni++) {
        var n = nationList[ni];
        budgetMap[n.id] = calculateNationalBudget(n);
    }

    // ── Step 2: Compute export capacity + import demand for every nation × sector ──
    // nationFlows[nationId][sectorKey] = { exportCapacity, importDemand }
    var nationFlows = {};
    // sectorAgg[sectorKey] = { totalSupply, totalDemand }
    var sectorAgg = {};

    for (var si = 0; si < sectors.length; si++) {
        sectorAgg[sectors[si].key] = { totalSupply: 0, totalDemand: 0 };
    }

    for (var ni = 0; ni < nationCount; ni++) {
        var n = nationList[ni];
        nationFlows[n.id] = {};

        for (var si = 0; si < sectors.length; si++) {
            var sector = sectors[si];

            // Arms sector needs special opts
            var exportOpts = null;
            var importOpts = null;
            if (sector.key === 'arms') {
                // Estimate defense allocation as 10% of available budget (default assumption)
                var avail = budgetMap[n.id].availableBudget || 0;
                var defenseBudget = avail * 0.10;
                exportOpts = { defense_pct: 10 };
                importOpts = { defense_budget: defenseBudget, has_arms_exports: false };
            }

            var expCap = calculateExportCapacity(n, sector, exportOpts);
            var impDem = calculateImportDemand(n, sector, importOpts);

            // Check if this nation can export arms (for import reduction)
            if (sector.key === 'arms' && expCap > 0 && importOpts) {
                importOpts.has_arms_exports = true;
                impDem = calculateImportDemand(n, sector, importOpts);
            }

            // Export controls: nations can cap exports per sector (e.g., OPEC strategy)
            // export_caps is a JSONB object like { energy: 50, minerals: 75 } meaning % of capacity
            var exportCaps = n.export_caps;
            if (exportCaps && exportCaps[sector.key] != null) {
                expCap = Math.round(expCap * (exportCaps[sector.key] / 100));
            }

            nationFlows[n.id][sector.key] = { exportCapacity: expCap, importDemand: impDem };
            sectorAgg[sector.key].totalSupply += expCap;
            sectorAgg[sector.key].totalDemand += impDem;
        }
    }

    // ── Step 3: Price modifiers per sector (with smoothing from previous tick) ──
    var priceModifiers = {};
    var prevPrices = {};

    // Fetch previous tick's price modifiers for smoothing
    var prevTick = currentTick - 1;
    if (prevTick > 0) {
        var { data: prevFlows } = await supabase.from('trade_flows')
            .select('sector, price_modifier')
            .eq('tick', prevTick)
            .limit(sectors.length);
        if (prevFlows) {
            for (var i = 0; i < prevFlows.length; i++) {
                prevPrices[prevFlows[i].sector] = Number(prevFlows[i].price_modifier) || 1.0;
            }
        }
    }

    for (var si = 0; si < sectors.length; si++) {
        var key = sectors[si].key;
        var rawPrice = calculatePriceModifier(sectorAgg[key].totalSupply, sectorAgg[key].totalDemand);
        var oldPrice = prevPrices[key] || 1.0;
        // Smoothing: 70% old price + 30% new signal → prevents wild swings
        priceModifiers[key] = oldPrice * 0.7 + rawPrice * 0.3;
    }

    // ── Step 4: Fetch diplomatic relations + proposals for affinity ──
    var { data: relations } = await supabase.from('diplomatic_relations')
        .select('nation_a_id, nation_b_id, relation_score, active_treaties, proximity');

    var { data: activeProposals } = await supabase.from('diplomatic_proposals')
        .select('id, proposal_type, proposing_nation_id, target_nation_id')
        .eq('status', 'active')
        .in('proposal_type', ['trade_agreement', 'embargo']);

    // Build relation lookup: relMap["idA|idB"] = { relation_score, active_treaties, proximity }
    var relMap = {};
    if (relations) {
        for (var i = 0; i < relations.length; i++) {
            var r = relations[i];
            var k1 = r.nation_a_id + '|' + r.nation_b_id;
            var k2 = r.nation_b_id + '|' + r.nation_a_id;
            relMap[k1] = r;
            relMap[k2] = r;
        }
    }

    // Build bilateral flags from active proposals (embargoes + legacy trade agreements)
    // flagsMap["idA|idB"] = { has_trade_agreement, has_embargo, has_fta, has_pta, has_rsc }
    var flagsMap = {};
    if (activeProposals) {
        for (var i = 0; i < activeProposals.length; i++) {
            var p = activeProposals[i];
            var k1 = p.proposing_nation_id + '|' + p.target_nation_id;
            var k2 = p.target_nation_id + '|' + p.proposing_nation_id;
            if (!flagsMap[k1]) flagsMap[k1] = {};
            if (!flagsMap[k2]) flagsMap[k2] = {};
            if (p.proposal_type === 'trade_agreement') {
                flagsMap[k1].has_trade_agreement = true;
                flagsMap[k2].has_trade_agreement = true;
            }
            if (p.proposal_type === 'embargo') {
                flagsMap[k1].has_embargo = true;
                flagsMap[k2].has_embargo = true;
            }
        }
    }

    // ── Step 4b: Fetch ALL active trade agreements (FTA, PTA, RSC, RT, ES, Embargo) ──
    var { data: activeTradeAgreements } = await supabase.from('trade_agreements')
        .select('id, nation_a_id, nation_b_id, agreement_type, articles')
        .eq('status', 'active')
        .in('agreement_type', ['fta', 'pta', 'resource_supply', 'retaliatory_tariff', 'export_subsidy', 'impose_embargo']);

    // Set type-specific affinity flags from trade_agreements
    // Build tariff modifier map: tariffModMap[importerId|exporterId][sector] = reduction fraction (0-1)
    // Build tariff surcharge map: tariffSurchargeMap[importerId|exporterId][sector] = surcharge fraction (e.g. 0.25 = +25%)
    // Build embargo map: embargoMap[nationA|nationB][sector] = true (blocks trade in that sector)
    var tariffModMap = {};
    var tariffSurchargeMap = {};
    var exportSubsidyMap = {};
    var embargoMap = {};
    var activeRSCs = [];

    if (activeTradeAgreements) {
        for (var ti = 0; ti < activeTradeAgreements.length; ti++) {
            var ta = activeTradeAgreements[ti];
            var k1 = ta.nation_a_id + '|' + ta.nation_b_id;
            var k2 = ta.nation_b_id + '|' + ta.nation_a_id;
            if (!flagsMap[k1]) flagsMap[k1] = {};
            if (!flagsMap[k2]) flagsMap[k2] = {};

            if (ta.agreement_type === 'fta') {
                flagsMap[k1].has_fta = true;
                flagsMap[k2].has_fta = true;

                // FTA: 100% tariff reduction on all sectors, except exempted ones
                var arts = ta.articles || [];
                var exemptSectors = {};
                for (var ai = 0; ai < arts.length; ai++) {
                    if (arts[ai].type === 'sector_exemption') {
                        exemptSectors[arts[ai].data.sector] = true;
                    }
                }
                if (!tariffModMap[k1]) tariffModMap[k1] = {};
                if (!tariffModMap[k2]) tariffModMap[k2] = {};
                for (var si = 0; si < sectors.length; si++) {
                    if (!exemptSectors[sectors[si].key]) {
                        tariffModMap[k1][sectors[si].key] = 1.0;
                        tariffModMap[k2][sectors[si].key] = 1.0;
                    }
                }
            } else if (ta.agreement_type === 'pta') {
                flagsMap[k1].has_pta = true;
                flagsMap[k2].has_pta = true;

                // PTA: per-sector tariff reductions from tariff_reduction articles
                var arts = ta.articles || [];
                for (var ai = 0; ai < arts.length; ai++) {
                    if (arts[ai].type !== 'tariff_reduction') continue;
                    var d = arts[ai].data;
                    var reduction = (d.reduction_pct || 0) / 100;
                    var direction = d.direction || 'mutual';

                    // Resolve direction: "your_exports" / "their_exports" relative to author
                    var authorId = d.author_nation_id || ta.nation_a_id;
                    var partnerId = (authorId === ta.nation_a_id) ? ta.nation_b_id : ta.nation_a_id;

                    // your_exports: partner (importer) reduces tariffs on author's (exporter's) goods
                    // their_exports: author (importer) reduces tariffs on partner's (exporter's) goods
                    if (direction === 'mutual' || direction === 'your_exports') {
                        var impExpKey = partnerId + '|' + authorId;
                        if (!tariffModMap[impExpKey]) tariffModMap[impExpKey] = {};
                        tariffModMap[impExpKey][d.sector] = Math.max(tariffModMap[impExpKey][d.sector] || 0, reduction);
                    }
                    if (direction === 'mutual' || direction === 'their_exports') {
                        var impExpKey = authorId + '|' + partnerId;
                        if (!tariffModMap[impExpKey]) tariffModMap[impExpKey] = {};
                        tariffModMap[impExpKey][d.sector] = Math.max(tariffModMap[impExpKey][d.sector] || 0, reduction);
                    }
                }
            } else if (ta.agreement_type === 'resource_supply') {
                flagsMap[k1].has_rsc = true;
                flagsMap[k2].has_rsc = true;
                activeRSCs.push(ta);
            } else if (ta.agreement_type === 'retaliatory_tariff') {
                // Retaliatory tariff: unilateral surcharge on imports from target nation
                // articles contain tariff_surcharge entries with imposer_nation_id, sector, surcharge_pct
                var arts = ta.articles || [];
                for (var ai = 0; ai < arts.length; ai++) {
                    if (arts[ai].type !== 'tariff_surcharge') continue;
                    var d = arts[ai].data;
                    var imposerId = d.imposer_nation_id;
                    var targetId = (imposerId === ta.nation_a_id) ? ta.nation_b_id : ta.nation_a_id;
                    var surcharge = (d.surcharge_pct || 0) / 100;
                    // Key: importer (imposer) | exporter (target) — surcharge on imports FROM target
                    var surKey = imposerId + '|' + targetId;
                    if (!tariffSurchargeMap[surKey]) tariffSurchargeMap[surKey] = {};
                    // Stack surcharges per sector (take max if multiple)
                    tariffSurchargeMap[surKey][d.sector] = Math.max(tariffSurchargeMap[surKey][d.sector] || 0, surcharge);
                }
            } else if (ta.agreement_type === 'export_subsidy') {
                // Export subsidy: unilateral — nation_a subsidizes its own exports in a sector
                var arts = ta.articles || [];
                for (var ai = 0; ai < arts.length; ai++) {
                    if (arts[ai].type !== 'subsidized_sector') continue;
                    var d = arts[ai].data;
                    var subsidyPct = (d.subsidy_pct || 0) / 100;
                    var nationId = ta.nation_a_id;
                    if (!exportSubsidyMap[nationId]) exportSubsidyMap[nationId] = {};
                    exportSubsidyMap[nationId][d.sector] = Math.max(exportSubsidyMap[nationId][d.sector] || 0, subsidyPct);
                }
            } else if (ta.agreement_type === 'impose_embargo') {
                // Impose embargo: per-sector trade blocking between imposer (nation_a) and target (nation_b)
                var arts = ta.articles || [];
                for (var ai = 0; ai < arts.length; ai++) {
                    if (arts[ai].type !== 'embargo_sector') continue;
                    var d = arts[ai].data;
                    var imposerId = d.imposer_nation_id || ta.nation_a_id;
                    var embTargetId = ta.nation_b_id;
                    var ek1 = imposerId + '|' + embTargetId;
                    var ek2 = embTargetId + '|' + imposerId;
                    if (!embargoMap[ek1]) embargoMap[ek1] = {};
                    if (!embargoMap[ek2]) embargoMap[ek2] = {};
                    embargoMap[ek1][d.sector] = true;
                    embargoMap[ek2][d.sector] = true;
                }
            }
        }
    }

    // Pre-compute all bilateral affinities
    // affinityMap["exporterId|importerId"] = affinity score 0-100
    var affinityMap = {};
    for (var ai = 0; ai < nationCount; ai++) {
        for (var bi = ai + 1; bi < nationCount; bi++) {
            var a = nationList[ai];
            var b = nationList[bi];
            var pairKey = a.id + '|' + b.id;
            var rel = relMap[pairKey] || null;
            var flags = flagsMap[pairKey] || {};
            // Pass continuous proximity (0-100) for gravity-model weighting
            flags.proximity = (rel && rel.proximity != null) ? rel.proximity : 50;
            var aff = calculateTradeAffinity(a, b, rel, flags);
            affinityMap[a.id + '|' + b.id] = aff;
            affinityMap[b.id + '|' + a.id] = aff;
        }
    }

    // ── Step 4c: Pre-allocate RSC guaranteed volumes ──

    var rscPreAllocations = [];
    if (activeRSCs && activeRSCs.length > 0) {
        for (var ri = 0; ri < activeRSCs.length; ri++) {
            var rsc = activeRSCs[ri];
            var arts = rsc.articles || [];

            // Find supply_commitment and price_terms articles
            var supplyArt = null;
            var priceArt = null;
            for (var ai = 0; ai < arts.length; ai++) {
                if (arts[ai].type === 'supply_commitment') supplyArt = arts[ai].data;
                if (arts[ai].type === 'price_terms') priceArt = arts[ai].data;
            }

            if (!supplyArt || !supplyArt.sector || !supplyArt.commitment_pct) continue;

            // Resolve buyer/seller from direction + author_nation_id
            var authorNationId = supplyArt.author_nation_id || rsc.nation_a_id;
            var otherNationId = (authorNationId === rsc.nation_a_id) ? rsc.nation_b_id : rsc.nation_a_id;
            var buyerNationId, sellerNationId;
            if (supplyArt.direction === 'we_buy') {
                buyerNationId = authorNationId;
                sellerNationId = otherNationId;
            } else {
                sellerNationId = authorNationId;
                buyerNationId = otherNationId;
            }

            // Calculate guaranteed volume from seller's export capacity
            var sellerFlows = nationFlows[sellerNationId];
            var buyerFlows = nationFlows[buyerNationId];
            if (!sellerFlows || !buyerFlows) continue;

            var sellerExport = (sellerFlows[supplyArt.sector] && sellerFlows[supplyArt.sector].exportCapacity) || 0;
            var buyerDemand = (buyerFlows[supplyArt.sector] && buyerFlows[supplyArt.sector].importDemand) || 0;
            if (sellerExport <= 0 || buyerDemand <= 0) continue;

            var guaranteedVolume = Math.round(sellerExport * (supplyArt.commitment_pct / 100));
            guaranteedVolume = Math.min(guaranteedVolume, buyerDemand);

            // Apply price modifier based on price_terms article
            var sectorPriceMod = priceModifiers[supplyArt.sector] || 1.0;
            var rscPriceMod = sectorPriceMod;
            if (priceArt) {
                if (priceArt.price_type === 'fixed') rscPriceMod = 1.0;
                else if (priceArt.price_type === 'discounted') rscPriceMod = sectorPriceMod * (1 - (priceArt.modifier_pct || 0) / 100);
                else if (priceArt.price_type === 'premium') rscPriceMod = sectorPriceMod * (1 + (priceArt.modifier_pct || 0) / 100);
            }

            var adjustedVolume = Math.round(guaranteedVolume * rscPriceMod);
            if (adjustedVolume <= 0) continue;

            rscPreAllocations.push({
                sellerNationId: sellerNationId,
                buyerNationId: buyerNationId,
                sector: supplyArt.sector,
                volume: adjustedVolume,
                agreementId: rsc.id
            });
        }
    }

    // ── Step 5: Distribute trade — for each exporter×sector, match to importers ──
    // Track actual volumes: actualExports[nationId][sector], actualImports[nationId][sector]
    var actualExports = {};
    var actualImports = {};
    for (var ni = 0; ni < nationCount; ni++) {
        actualExports[nationList[ni].id] = {};
        actualImports[nationList[ni].id] = {};
        for (var si = 0; si < sectors.length; si++) {
            actualExports[nationList[ni].id][sectors[si].key] = 0;
            actualImports[nationList[ni].id][sectors[si].key] = 0;
        }
    }

    var partnerRows = [];

    // Pre-allocate RSC guaranteed volumes before normal distribution
    for (var ri = 0; ri < rscPreAllocations.length; ri++) {
        var rscAlloc = rscPreAllocations[ri];
        if (actualExports[rscAlloc.sellerNationId] && actualImports[rscAlloc.buyerNationId]) {
            actualExports[rscAlloc.sellerNationId][rscAlloc.sector] += rscAlloc.volume;
            actualImports[rscAlloc.buyerNationId][rscAlloc.sector] += rscAlloc.volume;

            partnerRows.push({
                tick: currentTick,
                exporter_nation_id: rscAlloc.sellerNationId,
                importer_nation_id: rscAlloc.buyerNationId,
                sector: rscAlloc.sector,
                trade_volume: rscAlloc.volume,
                affinity_score: affinityMap[rscAlloc.sellerNationId + '|' + rscAlloc.buyerNationId] || 0
            });
        }
    }

    // ── Simultaneous proportional distribution ──
    // Instead of iterating exporters sequentially (which lets the first exporter
    // saturate all demand), we collect ALL bilateral (exporter→importer) pairs per
    // sector and allocate simultaneously using a gravity-model weight:
    //   weight = exportCapacity × importDemand × affinity × proximityFactor
    // Each pair's allocation is capped by both the exporter's capacity and the
    // importer's demand. Two passes handle the caps + redistribute surplus.

    for (var si = 0; si < sectors.length; si++) {
        var sector = sectors[si];
        var priceMod = priceModifiers[sector.key];
        var priceDampener = 1 / Math.sqrt(priceMod);

        // Collect all viable bilateral pairs for this sector
        // pairs[i] = { expId, impId, expCap, impDem, affinity, weight }
        var pairs = [];
        for (var ei = 0; ei < nationCount; ei++) {
            var exporter = nationList[ei];
            var expCap = nationFlows[exporter.id][sector.key].exportCapacity;
            if (expCap <= 0) continue;
            // Subtract RSC pre-allocated exports
            var remainingExpCap = expCap - (actualExports[exporter.id][sector.key] || 0);
            if (remainingExpCap <= 0) continue;
            var adjustedCap = Math.round(remainingExpCap * priceMod);
            if (adjustedCap <= 0) continue;

            for (var ii = 0; ii < nationCount; ii++) {
                if (ii === ei) continue;
                var importer = nationList[ii];

                // Hard embargo block (from diplomatic_proposals — blocks all sectors)
                var pairFlags = flagsMap[exporter.id + '|' + importer.id];
                if (pairFlags && pairFlags.has_embargo) continue;

                // Per-sector embargo block (from trade_agreements impose_embargo)
                var pairEmbargo = embargoMap[exporter.id + '|' + importer.id];
                if (pairEmbargo && pairEmbargo[sector.key]) continue;

                var impDem = nationFlows[importer.id][sector.key].importDemand;
                // Subtract RSC pre-allocated imports
                var remainingDem = impDem - (actualImports[importer.id][sector.key] || 0);
                if (remainingDem <= 0) continue;
                remainingDem = Math.round(remainingDem * priceDampener);
                if (remainingDem <= 0) continue;

                var aff = affinityMap[exporter.id + '|' + importer.id] || 0;
                if (aff <= 0) continue;

                // Gravity-model weight: supply × demand × affinity
                var w = adjustedCap * remainingDem * aff;
                pairs.push({
                    expId: exporter.id,
                    impId: importer.id,
                    expCap: adjustedCap,
                    impDem: remainingDem,
                    affinity: aff,
                    weight: w,
                    volume: 0
                });
            }
        }

        if (pairs.length === 0) continue;

        // Build per-exporter and per-importer capacity/demand budgets
        var expBudget = {};  // expBudget[expId] = remaining capacity
        var impBudget = {};  // impBudget[impId] = remaining demand
        for (var pi = 0; pi < pairs.length; pi++) {
            var p = pairs[pi];
            if (expBudget[p.expId] == null) expBudget[p.expId] = p.expCap;
            if (impBudget[p.impId] == null) impBudget[p.impId] = p.impDem;
        }

        // Iterative proportional fitting (2 passes to handle caps)
        for (var pass = 0; pass < 2; pass++) {
            // Compute total weight per exporter and per importer
            var expWeightSum = {};
            var impWeightSum = {};
            for (var pi = 0; pi < pairs.length; pi++) {
                var p = pairs[pi];
                if (p.weight <= 0) continue;
                if (!expWeightSum[p.expId]) expWeightSum[p.expId] = 0;
                if (!impWeightSum[p.impId]) impWeightSum[p.impId] = 0;
                expWeightSum[p.expId] += p.weight;
                impWeightSum[p.impId] += p.weight;
            }

            // Allocate each pair: min of (exporter's share, importer's share)
            for (var pi = 0; pi < pairs.length; pi++) {
                var p = pairs[pi];
                if (p.weight <= 0) { p.volume = 0; continue; }

                // Share of this exporter's capacity going to this importer
                var expShare = (expBudget[p.expId] || 0) * (p.weight / (expWeightSum[p.expId] || 1));
                // Share of this importer's demand filled by this exporter
                var impShare = (impBudget[p.impId] || 0) * (p.weight / (impWeightSum[p.impId] || 1));
                p.volume = Math.round(Math.min(expShare, impShare));
            }

            // Update budgets: subtract allocated volumes, zero out fully-allocated pairs
            for (var eid in expBudget) expBudget[eid] = 0;
            for (var iid in impBudget) impBudget[iid] = 0;
            // First compute how much was allocated per exporter/importer
            var expUsed = {};
            var impUsed = {};
            for (var pi = 0; pi < pairs.length; pi++) {
                var p = pairs[pi];
                if (!expUsed[p.expId]) expUsed[p.expId] = 0;
                if (!impUsed[p.impId]) impUsed[p.impId] = 0;
                expUsed[p.expId] += p.volume;
                impUsed[p.impId] += p.volume;
            }
            // Recompute remaining budgets from original caps minus total used
            for (var pi = 0; pi < pairs.length; pi++) {
                var p = pairs[pi];
                expBudget[p.expId] = p.expCap - (expUsed[p.expId] || 0);
                impBudget[p.impId] = p.impDem - (impUsed[p.impId] || 0);
            }
            // Zero out weights for pairs where either side is exhausted
            for (var pi = 0; pi < pairs.length; pi++) {
                var p = pairs[pi];
                if ((expBudget[p.expId] || 0) <= 0 || (impBudget[p.impId] || 0) <= 0) {
                    p.weight = 0;
                }
            }
        }

        // Record final allocations
        for (var pi = 0; pi < pairs.length; pi++) {
            var p = pairs[pi];
            if (p.volume <= 0) continue;

            actualExports[p.expId][sector.key] += p.volume;
            actualImports[p.impId][sector.key] += p.volume;

            partnerRows.push({
                tick: currentTick,
                exporter_nation_id: p.expId,
                importer_nation_id: p.impId,
                sector: sector.key,
                trade_volume: p.volume,
                affinity_score: p.affinity
            });
        }
    }

    // ── Step 6: Build trade_flows + trade_summary rows, update nation stats ──
    var flowRows = [];
    var summaryRows = [];
    var totalGlobalVolume = 0;

    for (var ni = 0; ni < nationCount; ni++) {
        var n = nationList[ni];
        var totalExp = 0;
        var totalImp = 0;
        var topExpSector = null;
        var topExpVal = 0;
        var topImpSector = null;
        var topImpVal = 0;

        for (var si = 0; si < sectors.length; si++) {
            var sKey = sectors[si].key;
            var expVol = actualExports[n.id][sKey] || 0;
            var impVol = actualImports[n.id][sKey] || 0;
            totalExp += expVol;
            totalImp += impVol;

            if (expVol > topExpVal) { topExpVal = expVol; topExpSector = sKey; }
            if (impVol > topImpVal) { topImpVal = impVol; topImpSector = sKey; }

            flowRows.push({
                nation_id: n.id,
                tick: currentTick,
                sector: sKey,
                export_capacity: nationFlows[n.id][sKey].exportCapacity,
                export_volume: expVol,
                import_demand: nationFlows[n.id][sKey].importDemand,
                import_volume: impVol,
                net_flow: expVol - impVol,
                price_modifier: priceModifiers[sKey]
            });
        }

        var surplus = totalExp - totalImp;
        var gdp = Number(n.gdp) || 0;
        var tradeBalanceIdx = deriveTradeBalanceIndex(surplus, gdp);

        // Tariff revenue: calculated bilaterally to account for FTA/PTA tariff reductions
        var budget = budgetMap[n.id];
        var baseTariffRate = (Number(n.tariffs) || 0) / 100;
        var collectionRate = budget ? budget.collectionRate : 0.7;
        var tariffRev = 0;

        // Sum tariff revenue across all bilateral partner flows for this importer
        for (var pi = 0; pi < partnerRows.length; pi++) {
            var pr = partnerRows[pi];
            if (pr.importer_nation_id !== n.id) continue;
            var effectiveRate = baseTariffRate;
            // Apply FTA/PTA tariff reduction if one exists for this importer-exporter pair and sector
            var modKey = n.id + '|' + pr.exporter_nation_id;
            if (tariffModMap[modKey] && tariffModMap[modKey][pr.sector] !== undefined) {
                effectiveRate = baseTariffRate * (1 - tariffModMap[modKey][pr.sector]);
            }
            // Apply retaliatory tariff surcharge (stacks on top of effective rate)
            if (tariffSurchargeMap[modKey] && tariffSurchargeMap[modKey][pr.sector]) {
                effectiveRate += tariffSurchargeMap[modKey][pr.sector];
            }
            tariffRev += pr.trade_volume * effectiveRate * collectionRate;
        }
        tariffRev = Math.round(tariffRev);

        summaryRows.push({
            nation_id: n.id,
            tick: currentTick,
            total_exports: totalExp,
            total_imports: totalImp,
            trade_surplus: surplus,
            trade_balance_index: tradeBalanceIdx,
            tariff_revenue: tariffRev,
            top_export_sector: topExpSector,
            top_import_sector: topImpSector,
            dependency_alerts: []
        });

        totalGlobalVolume += totalExp;

        // ── Trade-driven stat nudges ──
        var nationUpdates = { trade_balance: tradeBalanceIdx };

        // GDP growth: trade volume (exports + imports) as % of GDP
        // Neutral at 50% of GDP; more trade = better growth, isolation = drag
        // Capped at ±0.2 per tick (~20% of max gdp_growth swing)
        var tradeVolume = totalExp + totalImp;
        var tradeVolumeRatio = gdp > 0 ? tradeVolume / gdp : 0;
        var tradeGdpNudge = Math.max(-0.2, Math.min(0.2, (tradeVolumeRatio - 0.5) * 0.4));
        if (Math.abs(tradeGdpNudge) >= 0.01) {
            var currentGdpGrowth = Number(n.gdp_growth) || 50;
            nationUpdates.gdp_growth = Math.round(Math.max(0, Math.min(100, currentGdpGrowth + tradeGdpNudge)) * 10) / 10;
        }

        // Currency strength: trade surplus strengthens currency, deficit weakens it
        // Gentler than GDP nudge: (tradeBalance - 50) / 100 → range -0.5 to +0.5 per tick
        var currentCurrency = Number(n.currency_strength) || 50;
        var currencyNudge = (tradeBalanceIdx - 50) / 100;
        if (Math.abs(currencyNudge) >= 0.01) {
            nationUpdates.currency_strength = Math.round(Math.max(0, Math.min(100, currentCurrency + currencyNudge)) * 10) / 10;
        }

        // Inflation from import prices: weighted average price modifier of imports
        // If average import prices > 1.0, inflation pressure rises (imported inflation)
        var importWeightedPrice = 0;
        var totalImpForPrice = 0;
        for (var si2 = 0; si2 < sectors.length; si2++) {
            var sKey2 = sectors[si2].key;
            var impVol2 = actualImports[n.id][sKey2] || 0;
            if (impVol2 > 0) {
                importWeightedPrice += impVol2 * (priceModifiers[sKey2] || 1.0);
                totalImpForPrice += impVol2;
            }
        }
        var avgImportPrice = totalImpForPrice > 0 ? importWeightedPrice / totalImpForPrice : 1.0;
        // Nudge inflation: (avgPrice - 1.0) scaled to ±0.5 per tick
        var currentInflation = Number(n.inflation) || 50;
        var inflationNudge = (avgImportPrice - 1.0) * 1.0; // price 1.5 → +0.5 nudge, price 0.7 → -0.3
        if (Math.abs(inflationNudge) >= 0.01) {
            nationUpdates.inflation = Math.round(Math.max(0, Math.min(100, currentInflation + inflationNudge)) * 10) / 10;
        }

        // Unemployment from trade displacement: net imports in job-heavy sectors (manufacturing + services)
        // indicate domestic producers being outcompeted → unemployment pressure
        var mfgNet = (actualImports[n.id]['manufactured_goods'] || 0) - (actualExports[n.id]['manufactured_goods'] || 0);
        var svcNet = (actualImports[n.id]['services_finance'] || 0) - (actualExports[n.id]['services_finance'] || 0);
        if (gdp > 0) {
            var displacementRatio = (mfgNet + svcNet) / gdp;
            // Positive ratio = net importer in job sectors → unemployment nudge up
            // Negative ratio = net exporter in job sectors → unemployment nudge down (job creation)
            var unemploymentNudge = Math.max(-0.5, Math.min(0.5, displacementRatio * 100));
            if (Math.abs(unemploymentNudge) >= 0.01) {
                var currentUnemployment = Number(n.unemployment) || 50;
                nationUpdates.unemployment = Math.round(Math.max(0, Math.min(100, currentUnemployment + unemploymentNudge)) * 10) / 10;
            }
        }

        await supabase.from('nations')
            .update(nationUpdates)
            .eq('id', n.id);
    }

    // ── Step 7: Write to database ──
    // Insert trade_flows in batches (8 sectors × N nations)
    if (flowRows.length > 0) {
        var { error: flowErr } = await supabase.from('trade_flows').upsert(flowRows, {
            onConflict: 'nation_id,tick,sector'
        });
        if (flowErr) console.error('[processTradeFlows] trade_flows upsert error:', flowErr.message);
    }

    // Insert trade_partners in batches
    if (partnerRows.length > 0) {
        // Batch in chunks of 500 to avoid payload limits
        var BATCH = 500;
        for (var bi = 0; bi < partnerRows.length; bi += BATCH) {
            var chunk = partnerRows.slice(bi, bi + BATCH);
            var { error: partErr } = await supabase.from('trade_partners').upsert(chunk, {
                onConflict: 'tick,exporter_nation_id,importer_nation_id,sector'
            });
            if (partErr) console.error('[processTradeFlows] trade_partners upsert error:', partErr.message);
        }
    }

    // Insert trade_summary
    if (summaryRows.length > 0) {
        var { error: sumErr } = await supabase.from('trade_summary').upsert(summaryRows, {
            onConflict: 'nation_id,tick'
        });
        if (sumErr) console.error('[processTradeFlows] trade_summary upsert error:', sumErr.message);
    }

    console.log('[processTradeFlows] tick ' + currentTick + ': ' + nationCount + ' nations, ' +
        flowRows.length + ' flow rows, ' + partnerRows.length + ' partner rows, ' +
        'total volume $' + Math.round(totalGlobalVolume).toLocaleString() +
        (rscPreAllocations.length > 0 ? ', ' + rscPreAllocations.length + ' RSC pre-allocations' : ''));

    return { processed: nationCount, totalVolume: totalGlobalVolume };
}

// ────────── diplomacy-constants ──────────


// ==================== DIPLOMACY CONSTANTS ====================

const DIPLOMACY_CONFIG = {
    // Ambassador actions
    FORMAL_PROTEST_AP: 2,
    PROPOSE_INITIATIVE_AP: 2,
    COVERT_OP_AP: 4,

    // Foreign Minister actions
    RECALL_AMBASSADOR_AP: 1,
    IMPOSE_EMBARGO_AP: 5,
    FOREIGN_AID_AP: 4,
    ISSUE_ULTIMATUM_AP: 3,

    // Head of Government actions
    DECLARE_WAR_AP: 8,
    SUE_FOR_PEACE_AP: 4,
    SIGN_ALLIANCE_AP: 6,

    // Timing
    FM_REVIEW_EXPIRY_TICKS: 3,
    ULTIMATUM_DEADLINE_TICKS: 3,
    STATE_VISIT_AP: 4,
    STATE_VISIT_ACCEPT_WINDOW: 3,
    STATE_VISIT_COOLDOWN: 30,
    STATE_VISIT_REP_BOOST: 3,
    STATE_VISIT_STABILITY_BOOST: 2,
    STATE_VISIT_RELATION_BOOST: 7,
    STATE_VISIT_TRADE_BONUS: 5,         // +5 trade_balance if active trade agreement
    STATE_VISIT_IO_REP_BONUS: 3,        // +3 int'l rep if shared IO membership (future)
    STATE_VISIT_HIGH_REL_GDP_BONUS: 5,  // +5 gdp_growth if relations > 70
    STATE_VISIT_FIRST_STABILITY: 1,     // +1 stability for first-ever visit
    TREATY_RATIFICATION_VOTING_TICKS: 6,
    AMBASSADOR_CONFIRMATION_VOTING_TICKS: 6,
    AMBASSADOR_TERM_LENGTH: 60,         // ticks (60 ticks = 5 years)
    AMBASSADOR_RETIREMENT_WARNING: 3,   // warn this many ticks before retirement

    // War stat penalties (per tick)
    WAR_STABILITY_DRAIN: 2,
    WAR_CIVIL_UNREST_GAIN: 3,
    WAR_TRADE_DRAIN: 2,
    WAR_REPUTATION_DRAIN: 1,

    // Reputation costs
    WAR_WITH_JUSTIFICATION_REP_COST: 3,
    WAR_WITHOUT_JUSTIFICATION_REP_COST: 10,
    FORMAL_PROTEST_TARGET_REP_COST: 1,

    // Covert operation success thresholds (0-1, higher = harder)
    COVERT_INTEL_THRESHOLD: 0.45,
    COVERT_PROPAGANDA_THRESHOLD: 0.55,
    COVERT_BRIBE_THRESHOLD: 0.60,

    // Trade negotiation AP costs
    PROPOSE_TRADE_NEGOTIATION_AP: 2,      // MoT, FM, or Ambassador proposes trade negotiations
    ACCEPT_TRADE_NEGOTIATION_AP: 1,       // Other side's MoT, FM, Ambassador, or HoG accepts
    JOIN_NEGOTIATION_PM_AP: 2,            // PM/HoG/President joins negotiation
    JOIN_NEGOTIATION_FM_AP: 1,            // FM joins negotiation
    JOIN_NEGOTIATION_MOT_AP: 2,           // Minister of Trade joins
    HOG_DRAFT_INITIATIVE_AP: 3,           // HoG drafting when no MoT/FM/Ambassador (penalty)
    MOT_JOIN_DEADLINE_TICKS: 4,           // Ticks before negotiations cancel if MoT hasn't joined

    // Trade negotiation timing
    NEGOTIATION_DEFAULT_DURATION: 4,      // ticks until negotiation expires
    NEGOTIATION_EXTENSION_TICKS: 12,      // ticks added per extension (1 month)
    NEGOTIATION_MAX_EXTENSIONS: 3,        // max times negotiations can be extended
    TRADE_RATIFICATION_VOTING_TICKS: 6,   // ticks for parliament to vote on trade bill

    // Economic Aid
    AID_MAX_GDP_PCT: 25,                  // max annual aid as % of donor's GDP
    AID_MIN_AMOUNT: 1000000000,           // min $1B annual aid (to prevent trivial agreements)
    AID_DURATION_MIN_TICKS: 12,           // min 1 year
    AID_DURATION_MAX_TICKS: 120,          // max 10 years
    AID_MAX_CONDITIONS: 5,                // max condition articles per agreement
    AID_ANNUAL_REVIEW_INTERVAL: 12,       // check conditions every 12 ticks (1 year)
    AID_RELATION_BONUS: 8                 // relation boost when aid agreement is ratified
};

/**
 * Curated list of nation stats that can be used as conditions in Economic Aid agreements.
 * Grouped by category for the UI. default_operator indicates the "natural" direction
 * (gte = stat should be high, lte = stat should be low).
 */
const AID_CONDITION_STATS = [
    // Governance
    { key: 'corruption', label: 'Corruption', default_operator: 'lte', category: 'Governance' },
    { key: 'press_freedom', label: 'Press Freedom', default_operator: 'gte', category: 'Governance' },
    { key: 'freedom_index', label: 'Freedom Index', default_operator: 'gte', category: 'Governance' },
    { key: 'judicial_independence', label: 'Judicial Independence', default_operator: 'gte', category: 'Governance' },
    { key: 'efficiency', label: 'Bureaucratic Efficiency', default_operator: 'gte', category: 'Governance' },
    // Economic
    { key: 'inflation', label: 'Inflation', default_operator: 'lte', category: 'Economic' },
    { key: 'tariffs', label: 'Tariff Rate', default_operator: 'lte', category: 'Economic' },
    { key: 'unemployment', label: 'Unemployment', default_operator: 'lte', category: 'Economic' },
    { key: 'poverty_rate', label: 'Poverty Rate', default_operator: 'lte', category: 'Economic' },
    { key: 'income_inequality', label: 'Income Inequality', default_operator: 'lte', category: 'Economic' },
    // Social
    { key: 'literacy', label: 'Literacy', default_operator: 'gte', category: 'Social' },
    { key: 'healthcare_accessibility', label: 'Healthcare Access', default_operator: 'gte', category: 'Social' },
    { key: 'education_accessibility', label: 'Education Access', default_operator: 'gte', category: 'Social' },
    { key: 'standard_of_living', label: 'Standard of Living', default_operator: 'gte', category: 'Social' },
    { key: 'happiness', label: 'Happiness', default_operator: 'gte', category: 'Social' },
    // Environmental
    { key: 'renewable_energy_percentage', label: 'Renewable Energy %', default_operator: 'gte', category: 'Environmental' },
    { key: 'pollution', label: 'Pollution', default_operator: 'lte', category: 'Environmental' },
    { key: 'carbon_emissions', label: 'Carbon Emissions', default_operator: 'lte', category: 'Environmental' },
    // Security
    { key: 'stability', label: 'Stability', default_operator: 'gte', category: 'Security' },
    { key: 'civil_unrest', label: 'Civil Unrest', default_operator: 'lte', category: 'Security' },
    { key: 'terrorism', label: 'Terrorism', default_operator: 'lte', category: 'Security' },
    // International
    { key: 'international_reputation', label: 'International Reputation', default_operator: 'gte', category: 'International' }
];

/**
 * Trade Agreement types that can be negotiated as Diplomatic Initiatives.
 *
 * 6 types:
 *   FTA  — Free Trade Agreement: comprehensive tariff elimination
 *   PTA  — Preferential Tariff Agreement: sector-specific tariff reduction
 *   RSC  — Resource Supply Contract: guaranteed purchase commitment
 *   ES   — Export Subsidy: unilateral, no partner needed
 *   AID  — Economic Aid Agreement: financial assistance with optional conditions
 *   RT   — Retaliatory Tariff: unilateral surcharge on specific nation/sectors
 */
const TRADE_AGREEMENT_TYPES = {
    fta: {
        key: 'fta',
        label: 'Free Trade Agreement',
        shortLabel: 'FTA',
        description: 'Comprehensive tariff elimination between two nations. Removes all tariffs across all sectors unless specific exemptions are carved out.',
        bilateral: true,
        required_articles: ['duration'],
        optional_articles: ['sector_exemption', 'text_article'],
        icon: 'handshake'
    },
    pta: {
        key: 'pta',
        label: 'Preferential Tariff Agreement',
        shortLabel: 'PTA',
        description: 'Sector-specific tariff reduction. Each side can negotiate different reductions for different sectors and directions.',
        bilateral: true,
        required_articles: ['tariff_reduction', 'duration'],
        optional_articles: ['text_article'],
        icon: 'chart'
    },
    resource_supply: {
        key: 'resource_supply',
        label: 'Resource Supply Contract',
        shortLabel: 'RSC',
        description: 'Guaranteed purchase commitment for raw resources. The buyer commits to purchasing a minimum percentage from the seller.',
        bilateral: true,
        required_articles: ['supply_commitment', 'price_terms', 'duration'],
        optional_articles: ['breach_penalty', 'text_article'],
        icon: 'truck'
    },
    export_subsidy: {
        key: 'export_subsidy',
        label: 'Export Subsidy',
        shortLabel: 'ES',
        description: 'Unilateral policy — subsidize your own exporters to make goods cheaper on the international market. No partner nation needed.',
        bilateral: false,
        required_articles: ['subsidized_sector', 'duration', 'funding_source'],
        optional_articles: ['text_article'],
        icon: 'money'
    },
    economic_aid: {
        key: 'economic_aid',
        label: 'Economic Aid Agreement',
        shortLabel: 'AID',
        description: 'Financial assistance from one nation to another. The donor commits annual funding that appears as revenue in the recipient\'s budget. Optional conditions can require the recipient to maintain governance, economic, or social benchmarks.',
        bilateral: true,
        required_articles: ['aid_terms', 'duration'],
        optional_articles: ['aid_condition', 'text_article'],
        icon: 'aid',
        requires_mot: false  // FM/PM/Ambassador negotiate — no Minister of Trade needed
    },
    retaliatory_tariff: {
        key: 'retaliatory_tariff',
        label: 'Retaliatory Tariff',
        shortLabel: 'RT',
        description: 'Unilateral tariff surcharge on imports from a specific nation. Pick one or more sectors and set a surcharge rate. Damages diplomatic relations.',
        bilateral: false,
        unilateral_action: true,
        required_articles: ['tariff_surcharge', 'duration'],
        optional_articles: ['text_article'],
        icon: 'shield',
        category: 'unilateral'
    },
    impose_embargo: {
        key: 'impose_embargo',
        label: 'Impose Embargo',
        shortLabel: 'EMB',
        description: 'Unilateral embargo blocking trade with target nation in selected sectors. Major diplomatic escalation.',
        bilateral: false,
        unilateral_action: true,
        required_articles: ['embargo_sector', 'duration'],
        optional_articles: ['text_article'],
        icon: 'shield',
        category: 'unilateral'
    }
};

/**
 * The 6 tradeable sectors for trade agreements.
 * Subset of the full 8 TRADE_SECTORS (excludes tourism and services_finance).
 */
const TRADEABLE_SECTORS = [
    { key: 'fuel_energy',        label: 'Fuel & Energy',            raw_resource: true  },
    { key: 'minerals',           label: 'Minerals & Raw Materials', raw_resource: true  },
    { key: 'food_agriculture',   label: 'Food & Agriculture',       raw_resource: true  },
    { key: 'manufactured_goods', label: 'Manufactured Goods',       raw_resource: false },
    { key: 'technology',         label: 'Technology & Electronics', raw_resource: false },
    { key: 'arms',               label: 'Arms & Military Equipment', raw_resource: false }
];

// Lookup map for tradeable sectors
var TRADEABLE_SECTOR_MAP = {};
for (var _tasi = 0; _tasi < TRADEABLE_SECTORS.length; _tasi++) {
    TRADEABLE_SECTOR_MAP[TRADEABLE_SECTORS[_tasi].key] = TRADEABLE_SECTORS[_tasi];
}

/**
 * Article type definitions for trade agreements.
 * Each defines the schema of what data the article captures.
 */
const TRADE_ARTICLE_TYPES = {
    // ── Duration (required for all types) ──
    duration: {
        key: 'duration',
        label: 'Duration',
        description: 'How long the agreement lasts.',
        repeatable: false,
        schema: {
            duration_type: 'permanent|fixed',   // permanent or fixed term
            duration_ticks: 'number',           // min 8, max 48 for FTA/PTA; min 8, max 36 for RSC; min 4, max 24 for ES
            auto_renew: 'boolean',              // only for fixed term
            withdrawal_notice_ticks: 'number'   // 1-6 ticks notice to withdraw
        }
    },

    // ── Sector Exemption (FTA only, optional) ──
    sector_exemption: {
        key: 'sector_exemption',
        label: 'Sector Exemption',
        description: 'Exempt specific sectors from the FTA.',
        repeatable: true,
        applies_to: ['fta'],
        schema: {
            sector: 'string',                   // tradeable sector key
            reason: 'string'                    // optional flavor text
        }
    },

    // ── Tariff Reduction (PTA, required, repeatable per sector) ──
    tariff_reduction: {
        key: 'tariff_reduction',
        label: 'Tariff Reduction',
        description: 'Reduce tariffs on a specific sector.',
        repeatable: true,
        applies_to: ['pta'],
        schema: {
            sector: 'string',                   // tradeable sector key
            direction: 'mutual|your_exports|their_exports',
            reduction_pct: 'number'             // 0-100 (100 = full elimination)
        }
    },

    // ── Supply Commitment (RSC, required) ──
    supply_commitment: {
        key: 'supply_commitment',
        label: 'Supply Commitment',
        description: 'Guaranteed purchase commitment for a raw resource.',
        repeatable: false,
        applies_to: ['resource_supply'],
        schema: {
            sector: 'string',                   // must be raw_resource sector
            direction: 'we_buy|we_sell',        // who is buyer vs seller
            commitment_pct: 'number'            // 10-90%
        }
    },

    // ── Price Terms (RSC, required) ──
    price_terms: {
        key: 'price_terms',
        label: 'Price Terms',
        description: 'How the resource price is determined.',
        repeatable: false,
        applies_to: ['resource_supply'],
        schema: {
            price_type: 'market|fixed|discounted|premium',
            modifier_pct: 'number'              // discount/premium percentage (0-25)
        }
    },

    // ── Breach Penalty (RSC, optional) ──
    breach_penalty: {
        key: 'breach_penalty',
        label: 'Breach Penalty',
        description: 'Penalties if either party breaks the contract early.',
        repeatable: false,
        applies_to: ['resource_supply'],
        schema: {
            relations_penalty: 'number',        // 1-8
            reputation_penalty: 'number',       // 0-4
            financial_penalty: 'number'         // 0-500 (in millions)
        }
    },

    // ── Subsidized Sector (Export Subsidy, required) ──
    subsidized_sector: {
        key: 'subsidized_sector',
        label: 'Export Subsidy',
        description: 'Subsidize exports in a specific sector.',
        repeatable: false,
        applies_to: ['export_subsidy'],
        schema: {
            sector: 'string',                   // any tradeable sector
            subsidy_pct: 'number'               // 5-30%
        }
    },

    // ── Funding Source (Export Subsidy, required) ──
    funding_source: {
        key: 'funding_source',
        label: 'Funding Source',
        description: 'Where the subsidy money comes from.',
        repeatable: false,
        applies_to: ['export_subsidy'],
        schema: {
            source: 'general_treasury|ministry_budget'
        }
    },

    // ── Aid Terms (Economic Aid, required) ──
    aid_terms: {
        key: 'aid_terms',
        label: 'Aid Terms',
        description: 'The core financial terms: who gives, who receives, how much.',
        repeatable: false,
        applies_to: ['economic_aid'],
        schema: {
            donor_nation_id: 'uuid',            // which nation is giving the aid
            annual_amount: 'number',             // annual aid in raw dollars (e.g. 25e9 = $25B)
            gdp_cap_pct: 'number'               // max % of donor GDP (1-25), re-evaluated yearly
        }
    },

    // ── Aid Condition (Economic Aid, optional, repeatable) ──
    aid_condition: {
        key: 'aid_condition',
        label: 'Condition',
        description: 'A stat-based condition the recipient must maintain for aid to continue.',
        repeatable: true,
        applies_to: ['economic_aid'],
        schema: {
            stat_key: 'string',                 // any nation stat key from NATION_STAT_COLUMNS
            operator: 'gte|lte',                // ≥ threshold or ≤ threshold
            threshold: 'number',                // 0-100 stat value
            on_failure: 'suspend|terminate|reduce',  // consequence when condition fails at annual review
            grace_periods: 'number'             // 0-2: how many annual reviews can fail before enforcement
        }
    },

    // ── Tariff Surcharge (Retaliatory Tariff, required, repeatable per sector) ──
    tariff_surcharge: {
        key: 'tariff_surcharge',
        label: 'Tariff Surcharge',
        description: 'Impose an additional tariff on imports from the target nation in a specific sector.',
        repeatable: true,
        applies_to: ['retaliatory_tariff'],
        schema: {
            sector: 'string',                   // tradeable sector key
            surcharge_pct: 'number'             // 5-50%
        }
    },

    // ── Embargo Sector (Impose Embargo, required, repeatable per sector) ──
    embargo_sector: {
        key: 'embargo_sector',
        label: 'Embargo Sector',
        description: 'Block trade in a specific sector with the target nation.',
        repeatable: true,
        applies_to: ['impose_embargo'],
        schema: {
            sector: 'string',
            imposer_nation_id: 'uuid'
        }
    },

    // ── Text Article (optional for all types) ──
    text_article: {
        key: 'text_article',
        label: 'Text Article',
        description: 'Free-text article for flavor/RP. No mechanical effect.',
        repeatable: true,
        applies_to: ['fta', 'pta', 'resource_supply', 'export_subsidy', 'economic_aid', 'retaliatory_tariff', 'impose_embargo'],
        schema: {
            title: 'string',
            body: 'string'
        }
    }
};

/**
 * Diplomatic proposal types with tier classification.
 * Tier 1 = Minor (ambassador approves directly)
 * Tier 2 = FM approval needed (no bill)
 * Tier 3 = Requires Parliament ratification bill
 */
const PROPOSAL_TYPES = {
    // === Tier 1: Minor — Ambassador approves directly ===
    cultural_exchange: {
        tier: 1,
        label: 'Cultural Exchange',
        description: 'Establish cultural exchange programs between nations.',
        stat_effects: [
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    visa_agreement: {
        tier: 1,
        label: 'Visa Agreement',
        description: 'Simplify visa requirements for travel between nations.',
        stat_effects: [
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 },
            { stat_key: 'immigration', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    joint_statement: {
        tier: 1,
        label: 'Joint Statement',
        description: 'Issue a joint diplomatic statement signaling cooperation.',
        stat_effects: []  // Purely cosmetic — shows in event feeds
    },
    student_exchange: {
        tier: 1,
        label: 'Student Exchange',
        description: 'Create student exchange programs to boost education.',
        stat_effects: [
            { stat_key: 'higher_education', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },

    // === Tier 3: Major — Escalates to FM, then Parliament ratification bill ===
    non_aggression_pact: {
        tier: 3,
        label: 'Non-Aggression Pact',
        description: 'Binding commitment not to declare war for a set period.',
        stat_effects: [
            { stat_key: 'stability', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 },
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    military_alliance: {
        tier: 3,
        label: 'Military Alliance',
        description: 'Mutual defense pact — if one is attacked, the other must respond.',
        stat_effects: [
            { stat_key: 'stability', direction: 'up', rate: 2, delay_ticks: 0, duration_ticks: 0 },
            { stat_key: 'international_reputation', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    embargo: {
        tier: 3,
        label: 'Embargo/Sanctions',
        description: 'Economic warfare — tanks target trade stats, also hurts your own.',
        stat_effects: [
            { stat_key: 'trade_balance', direction: 'down', rate: 3, delay_ticks: 0, duration_ticks: 0 },
            { stat_key: 'sanctions', direction: 'up', rate: 3, delay_ticks: 0, duration_ticks: 0 }
        ]
    },
    ceasefire: {
        tier: 3,
        label: 'Ceasefire',
        description: 'Stop active conflict between warring nations.',
        requires_war: true,
        stat_effects: [
            { stat_key: 'stability', direction: 'up', rate: 2, delay_ticks: 0, duration_ticks: 1 },
            { stat_key: 'civil_unrest', direction: 'down', rate: 2, delay_ticks: 0, duration_ticks: 1 }
        ]
    },
    open_borders: {
        tier: 3,
        label: 'Open Borders',
        description: 'Major immigration and security implications — open borders between nations.',
        stat_effects: [
            { stat_key: 'immigration', direction: 'up', rate: 3, delay_ticks: 0, duration_ticks: 0 },
            { stat_key: 'trade_balance', direction: 'up', rate: 1, delay_ticks: 0, duration_ticks: 0 }
        ]
    },
    close_embassy: {
        tier: 3,
        label: 'Close Embassy',
        description: 'Shut down diplomatic presence in the target nation.',
        stat_effects: [
            { stat_key: 'international_reputation', direction: 'down', rate: 2, delay_ticks: 0, duration_ticks: 1 }
        ]
    }
};

// War justification types — required for declaring war without massive reputation penalty
const WAR_JUSTIFICATIONS = {
    ultimatum_ignored:    { label: 'Ignored Ultimatum',     description: 'A formal ultimatum was ignored by the target nation.' },
    caught_spy:           { label: 'Caught Spy',            description: 'A covert agent from the target nation was caught operating in your territory.' },
    broken_treaty:        { label: 'Broken Treaty',         description: 'The target nation violated an existing treaty or agreement.' },
    attacked:             { label: 'Attacked',              description: 'Your nation was attacked by the target nation.' },
    alliance_obligation:  { label: 'Alliance Obligation',   description: 'An allied nation was attacked, triggering mutual defense obligations.' }
};

const MAJOR_SECTORS = [
    { key: 'ECONOMICS',     label: 'Economics',           icon: '💰' },
    { key: 'LABOR',         label: 'Labor',               icon: '👷' },
    { key: 'EDUCATION',     label: 'Education',           icon: '📚' },
    { key: 'ENERGY',        label: 'Energy',              icon: '⚡' },
    { key: 'WELFARE',       label: 'Welfare',             icon: '🏥' },
    { key: 'SOCIAL',        label: 'Social',              icon: '🤝' },
    { key: 'MILITARY',      label: 'Military & Security', icon: '🛡️' },
    { key: 'GOVERNANCE',    label: 'Governance',          icon: '🏛️' },
    { key: 'IMMIGRATION',   label: 'Immigration',         icon: '🌍' },
    { key: 'INTERNATIONAL', label: 'International',       icon: '🌐' },
    { key: 'TRADE',         label: 'Trade',               icon: '📦' }
];

// Policy Platform stances — each sector has 4 stances, each leaning toward 2 ideology poles.
// Used by the "Policy Platform" campaign action (3 AP).
const POLICY_STANCES = {
    ECONOMICS: [
        { key: 'free_market_reform',  name: 'Free Market Reform',  desc: 'Deregulate industries and lower trade barriers.',          poles: ['LIBERTY', 'INDIVIDUALISM'] },
        { key: 'workers_first',       name: 'Workers First',       desc: 'Strengthen labor protections and raise minimum wages.',    poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'protectionist_trade', name: 'Protectionist Trade', desc: 'Shield domestic industries with tariffs and subsidies.',   poles: ['INDIVIDUALISM', 'TRADITION'] },
        { key: 'green_economy',       name: 'Green Economy',       desc: 'Invest in sustainable industries and green jobs.',         poles: ['PROGRESS', 'COLLECTIVISM'] }
    ],
    LABOR: [
        { key: 'business_friendly', name: 'Business Friendly', desc: 'Reduce regulations and empower employers.',             poles: ['LIBERTY', 'INDIVIDUALISM'] },
        { key: 'union_power',       name: 'Union Power',       desc: 'Strengthen unions and collective bargaining.',           poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'full_employment',   name: 'Full Employment',   desc: 'Government programs to guarantee jobs for all.',         poles: ['COLLECTIVISM', 'SECURITY'] },
        { key: 'gig_economy',       name: 'Gig Economy',       desc: 'Embrace flexible work arrangements and innovation.',    poles: ['LIBERTY', 'PROGRESS'] }
    ],
    EDUCATION: [
        { key: 'religious_schooling', name: 'Religious Schooling', desc: 'Expand faith-based education and traditional curricula.', poles: ['TRADITION', 'INDIVIDUALISM'] },
        { key: 'universal_access',    name: 'Universal Access',    desc: 'Guarantee free education for all citizens.',              poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'stem_investment',     name: 'STEM Investment',     desc: 'Prioritize science and technology programs.',             poles: ['PROGRESS', 'LIBERTY'] },
        { key: 'vocational_focus',    name: 'Vocational Focus',    desc: 'Expand trade schools and apprenticeship programs.',       poles: ['TRADITION', 'COLLECTIVISM'] }
    ],
    ENERGY: [
        { key: 'nuclear_power',        name: 'Nuclear Power',        desc: 'Invest in nuclear energy for reliable power.',              poles: ['PROGRESS', 'SECURITY'] },
        { key: 'fossil_fuels',         name: 'Fossil Fuels',         desc: 'Maintain traditional energy sources for stability.',        poles: ['TRADITION', 'INDIVIDUALISM'] },
        { key: 'green_transition',     name: 'Green Transition',     desc: 'Rapidly shift to renewable energy sources.',                poles: ['PROGRESS', 'COLLECTIVISM'] },
        { key: 'energy_independence',  name: 'Energy Independence',  desc: 'Develop domestic energy to reduce foreign dependence.',     poles: ['SECURITY', 'INDIVIDUALISM'] }
    ],
    WELFARE: [
        { key: 'universal_benefits', name: 'Universal Benefits', desc: 'Provide welfare programs for all citizens.',                     poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'targeted_aid',       name: 'Targeted Aid',       desc: 'Focus welfare on those who need it most.',                       poles: ['EQUALITY', 'INDIVIDUALISM'] },
        { key: 'self_reliance',      name: 'Self-Reliance',      desc: 'Reduce welfare dependency and promote personal responsibility.', poles: ['INDIVIDUALISM', 'LIBERTY'] },
        { key: 'community_care',     name: 'Community Care',     desc: 'Channel welfare through community and religious organizations.', poles: ['TRADITION', 'COLLECTIVISM'] }
    ],
    SOCIAL: [
        { key: 'traditional_values',  name: 'Traditional Values',  desc: 'Uphold cultural heritage and social norms.',            poles: ['TRADITION', 'INDIVIDUALISM'] },
        { key: 'social_safety_net',   name: 'Social Safety Net',   desc: 'Expand social programs and public services.',           poles: ['EQUALITY', 'COLLECTIVISM'] },
        { key: 'individual_freedoms', name: 'Individual Freedoms', desc: 'Protect civil liberties and personal choices.',          poles: ['FREEDOM', 'LIBERTY'] },
        { key: 'community_standards', name: 'Community Standards', desc: 'Strengthen community-level governance and norms.',       poles: ['TRADITION', 'COLLECTIVISM'] }
    ],
    MILITARY: [
        { key: 'expand_military',  name: 'Expand the Military', desc: 'Increase defense spending and military capabilities.',     poles: ['SECURITY', 'INDIVIDUALISM'] },
        { key: 'peace_dividend',   name: 'Peace Dividend',      desc: 'Reduce military spending and invest in social programs.',  poles: ['FREEDOM', 'EQUALITY'] },
        { key: 'national_service', name: 'National Service',    desc: 'Implement mandatory national service for citizens.',       poles: ['COLLECTIVISM', 'TRADITION'] },
        { key: 'smart_defense',    name: 'Smart Defense',        desc: 'Invest in advanced technology and cyber capabilities.',   poles: ['PROGRESS', 'LIBERTY'] }
    ],
    GOVERNANCE: [
        { key: 'law_and_order',     name: 'Law and Order',         desc: 'Strengthen law enforcement and judicial authority.',        poles: ['SECURITY', 'TRADITION'] },
        { key: 'anti_corruption',   name: 'Anti-Corruption Drive', desc: 'Increase transparency and root out corruption.',           poles: ['LIBERTY', 'PROGRESS'] },
        { key: 'strong_executive',  name: 'Strong Executive',      desc: 'Concentrate executive power for decisive governance.',     poles: ['SECURITY', 'INDIVIDUALISM'] },
        { key: 'decentralization',  name: 'Decentralization',      desc: 'Distribute power to local communities and regions.',       poles: ['FREEDOM', 'EQUALITY'] }
    ],
    IMMIGRATION: [
        { key: 'closed_borders',       name: 'Closed Borders',       desc: 'Restrict immigration and strengthen border security.',  poles: ['NATIONALISM', 'SECURITY'] },
        { key: 'skilled_migration',    name: 'Skilled Migration',    desc: 'Attract highly skilled immigrants selectively.',         poles: ['LIBERTY', 'INDIVIDUALISM'] },
        { key: 'open_arms',           name: 'Open Arms',            desc: 'Welcome refugees and increase immigration quotas.',      poles: ['GLOBALISM', 'FREEDOM'] },
        { key: 'cultural_integration', name: 'Cultural Integration', desc: 'Require cultural assimilation for new arrivals.',       poles: ['NATIONALISM', 'TRADITION'] }
    ],
    INTERNATIONAL: [
        { key: 'non_interventionist',  name: 'Non-Interventionist',  desc: 'Avoid foreign entanglements and focus on domestic affairs.', poles: ['NATIONALISM', 'FREEDOM'] },
        { key: 'global_leadership',    name: 'Global Leadership',    desc: 'Lead international institutions and alliances.',             poles: ['GLOBALISM', 'PROGRESS'] },
        { key: 'military_deterrence',  name: 'Military Deterrence',  desc: 'Project strength to deter foreign aggression.',              poles: ['SECURITY', 'NATIONALISM'] },
        { key: 'humanitarian_focus',   name: 'Humanitarian Focus',   desc: 'Prioritize foreign aid and human rights advocacy.',           poles: ['GLOBALISM', 'EQUALITY'] }
    ],
    TRADE: [
        { key: 'free_trade',          name: 'Free Trade',            desc: 'Eliminate tariffs and open markets to global commerce.',      poles: ['GLOBALISM', 'LIBERTY'] },
        { key: 'buy_domestic',         name: 'Buy Domestic',          desc: 'Promote domestic products and restrict foreign goods.',      poles: ['NATIONALISM', 'TRADITION'] },
        { key: 'fair_trade',           name: 'Fair Trade',            desc: 'Enforce ethical standards and workers\' rights in trade.',   poles: ['GLOBALISM', 'COLLECTIVISM'] },
        { key: 'economic_sovereignty', name: 'Economic Sovereignty',  desc: 'Protect national industries from foreign ownership.',       poles: ['NATIONALISM', 'INDIVIDUALISM'] }
    ]
};

// Stats where LOWER is better (inverted approval logic)
const INVERTED_STATS = [
    'unemployment', 'poverty_rate', 'income_inequality', 'death_rate',
    'pollution', 'carbon_emissions', 'crime_rate', 'incarceration_rate',
    'drug_use', 'corruption', 'polarization', 'civil_unrest', 'terrorism',
    'political_violence', 'emigration', 'sanctions', 'debt', 'debt_growth',
    'inflation', 'interest_rates', 'illegal_immigration', 'fuel_prices'
];

// Stats stored as raw numbers (not 0-100 indices).
// GDP and debt are stored as raw dollars (88B = 88,000,000,000).
// All other stats (0-100 indices) use the default divisor of 50.
const RAW_SCALING_DIVISORS = {
    population: 1_000_000,
    eligible_voters: 1_000_000,
    gdp: 1_000_000_000,
    debt: 1_000_000_000
};

// Stats that must NEVER be modified by generic tick processors (processStatEffects,
// processMinistryActions, processEvents, processCrises, processStatConnections).
// GDP is driven exclusively by gdp_growth via applyGdpGrowth.
// Debt is driven exclusively by the budget system (surplus/deficit).
// Any policy/event/crisis/connection targeting these keys will be silently skipped.
const STAT_PROCESSOR_SKIP = new Set(['gdp', 'debt']);


// ────────── ideology ──────────


// Ideology spectrum opposites
const IDEOLOGY_OPPOSITES = {
    'LIBERTY': 'EQUALITY',           'EQUALITY': 'LIBERTY',
    'FREEDOM': 'SECURITY',           'SECURITY': 'FREEDOM',
    'TRADITION': 'PROGRESS',         'PROGRESS': 'TRADITION',
    'GLOBALISM': 'NATIONALISM',      'NATIONALISM': 'GLOBALISM',
    'INDIVIDUALISM': 'COLLECTIVISM', 'COLLECTIVISM': 'INDIVIDUALISM'
};

// Audit: detect stances with opposed poles on the same axis
for (const [sector, stances] of Object.entries(POLICY_STANCES)) {
    for (const stance of stances) {
        if (stance.poles.length === 2 && IDEOLOGY_OPPOSITES[stance.poles[0]] === stance.poles[1]) {
            console.error(`STANCE CONFLICT: ${sector}.${stance.key} has opposed poles: ${stance.poles.join(' vs ')}`);
        }
    }
}

// ==================== DYNAMIC IDEOLOGY SYSTEM ====================

const IDEOLOGY_AXES = [
    {
        key: 'liberty_equality',
        left: 'LIBERTY',       right: 'EQUALITY',
        leftLabel: 'Liberty',  rightLabel: 'Equality',
        leftColor: '#3b82f6',  rightColor: '#ef4444',
        description: 'Individual rights vs. collective fairness'
    },
    {
        key: 'tradition_progress',
        left: 'TRADITION',      right: 'PROGRESS',
        leftLabel: 'Tradition', rightLabel: 'Progress',
        leftColor: '#a855f7',   rightColor: '#22c55e',
        description: 'Cultural conservatism vs. social reform'
    },
    {
        key: 'security_freedom',
        left: 'SECURITY',      right: 'FREEDOM',
        leftLabel: 'Security', rightLabel: 'Freedom',
        leftColor: '#f59e0b',  rightColor: '#06b6d4',
        description: 'State protection vs. personal autonomy'
    },
    {
        key: 'globalism_nationalism',
        left: 'GLOBALISM',       right: 'NATIONALISM',
        leftLabel: 'Globalism',  rightLabel: 'Nationalism',
        leftColor: '#14b8a6',    rightColor: '#f97316',
        description: 'International integration vs. national sovereignty'
    },
    {
        key: 'individualism_collectivism',
        left: 'INDIVIDUALISM',       right: 'COLLECTIVISM',
        leftLabel: 'Individualism',  rightLabel: 'Collectivism',
        leftColor: '#eab308',        rightColor: '#ec4899',
        description: 'Personal self-reliance vs. communal structures'
    }
];

const IDEOLOGY_TO_AXIS = {};
for (const axis of IDEOLOGY_AXES) {
    IDEOLOGY_TO_AXIS[axis.left]  = { axisKey: axis.key, direction: -1 };
    IDEOLOGY_TO_AXIS[axis.right] = { axisKey: axis.key, direction: +1 };
}


/**
 * Return an alignment CSS class ('aligned', 'opposed', 'neutral') for
 * an ideology tag relative to a faction's ideology scores.
 */
function getIdeologyChipClass(ideologyTag, factionIdeology) {
    if (!factionIdeology) return 'neutral';
    const tag = (ideologyTag || '').toUpperCase();
    const mapping = IDEOLOGY_TO_AXIS[tag];
    if (!mapping) return 'neutral';
    const score = factionIdeology[mapping.axisKey] || 0;
    const alignment = score * mapping.direction;
    if (alignment > 10) return 'aligned';
    if (alignment < -10) return 'opposed';
    return 'neutral';
}

// ==================== IDEOLOGY LABELS ====================

const IDEOLOGY_LABEL_THRESHOLDS = [
    { min: 0,  max: 10,  label: 'Centrist' },
    { min: 11, max: 30,  label: 'Leaning' },
    { min: 31, max: 60,  label: 'Strong' },
    { min: 61, max: 100, label: 'Radical' }
];

function getIdeologyLabel(score, axisDef) {
    const abs = Math.abs(score);
    const threshold = IDEOLOGY_LABEL_THRESHOLDS.find(t => abs >= t.min && abs <= t.max);
    const intensityLabel = threshold ? threshold.label : 'Centrist';

    if (intensityLabel === 'Centrist') return 'Centrist';

    const sideName = score < 0 ? axisDef.leftLabel : axisDef.rightLabel;
    return `${intensityLabel} ${sideName}`;
}

function getFullIdeologyProfile(ideologyRow) {
    return IDEOLOGY_AXES.map(axis => {
        const score = ideologyRow[axis.key] || 0;
        return {
            axisKey: axis.key,
            axisDef: axis,
            score: score,
            label: getIdeologyLabel(score, axis)
        };
    });
}


// ==================== DYNAMIC OPPOSITION PENALTY ====================

function calculateDynamicOppositionPenalty(factionIdeology, policyIdeologyTag, basePenalty = 2) {
    const tag = policyIdeologyTag.toUpperCase();
    const mapping = IDEOLOGY_TO_AXIS[tag];
    if (!mapping) return 0;

    const factionScore = factionIdeology[mapping.axisKey] || 0;
    const policyDirection = mapping.direction;
    const oppositionScore = -policyDirection * factionScore;

    if (oppositionScore <= 0) return 0;

    const penaltyScale = oppositionScore / 100;
    return -Math.round(basePenalty * penaltyScale * 10) / 10;
}

function calculateBillDynamicPenalty(factionIdeology, articles, basePenalty = 2) {
    let totalPenalty = 0;

    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;

        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);

        for (const tag of ideos) {
            totalPenalty += calculateDynamicOppositionPenalty(factionIdeology, tag, basePenalty);
        }
    }

    return totalPenalty;
}


// ==================== IDEOLOGY ALIGNMENT (DYNAMIC SCORES) ====================

/**
 * Compute ideology alignment (0-100) between a faction and a voter bloc
 * using the faction's dynamic axis scores.
 *
 * Returns 50 for a fully centrist party (neutral), >50 for alignment,
 * <50 for opposition. Axes are weighted by how strongly the party
 * leans on each axis, so centrist axes are naturally ignored.
 *
 * @param {object} factionIdeology - Row from faction_ideology (keys: liberty_equality, etc.)
 * @param {object} bloc - Voter bloc row with axis_* columns (0-100 scale, 50 = neutral)
 * @returns {number} 0-100 alignment score
 */
function computeIdeologyAlignment(factionIdeology, bloc) {
    const AXIS_KEYS = [
        'liberty_equality', 'tradition_progress', 'security_freedom',
        'globalism_nationalism', 'individualism_collectivism'
    ];

    let weightedAlignment = 0;
    let totalWeight = 0;

    for (const axisKey of AXIS_KEYS) {
        const partyScore = factionIdeology[axisKey] || 0; // -100 to +100
        const blocScore = bloc['axis_' + axisKey] ?? 50;  // 0-100

        // How strongly the party leans on this axis (0 = centrist, 1 = extreme)
        const partyStrength = Math.abs(partyScore) / 100;
        if (partyStrength < 0.01) continue; // Skip negligible positions

        // Convert party score to 0-100 scale to match bloc
        const partyNorm = (partyScore + 100) / 2; // -100→0, 0→50, +100→100

        // Alignment = 1 when identical, 0 when at opposite ends
        const alignment = 1 - Math.abs(partyNorm - blocScore) / 100;

        weightedAlignment += alignment * partyStrength;
        totalWeight += partyStrength;
    }

    // If party has no strong positions, compute centrist affinity:
    // centrist parties naturally align better with moderate blocs
    // and worse with extreme blocs on any axis.
    if (totalWeight === 0) {
        let centristAlignment = 0;
        for (const axisKey of AXIS_KEYS) {
            const blocScore = bloc['axis_' + axisKey] ?? 50;
            // Distance from center (50): extreme blocs score lower
            const distFromCenter = Math.abs(blocScore - 50) / 50; // 0 to 1
            centristAlignment += (1 - distFromCenter);
        }
        // Average across axes, scale to 30-70 range (centrist shouldn't be extreme)
        return 30 + (centristAlignment / AXIS_KEYS.length) * 40;
    }
    return (weightedAlignment / totalWeight) * 100;
}


// ==================== IDEOLOGY OPPOSITION PENALTY ====================

/**
 * Count ideology oppositions and alignments between a faction and a voter bloc.
 *
 * For each axis, if the party leans strongly enough (|score| >= 20) AND the
 * bloc also leans strongly enough (|score − 50| >= 10), they are compared:
 *   - Same side → aligned
 *   - Opposite sides → opposed
 *
 * @param {object} factionIdeology - Row from faction_ideology (axis keys: -100 to +100)
 * @param {object} bloc - Voter bloc row with axis_* columns (0-100 scale, 50 = neutral)
 * @returns {{ opposed: number, aligned: number }}
 */
function countIdeologyRelationship(factionIdeology, bloc) {
    const PARTY_THRESHOLD = 20;  // Party must lean at least ±20 to count
    const BLOC_THRESHOLD  = 10;  // Bloc must deviate at least 10 from neutral (50)

    let opposed = 0;
    let aligned = 0;

    for (const axis of IDEOLOGY_AXES) {
        const partyScore = factionIdeology[axis.key] || 0;   // -100 to +100
        const blocScore  = bloc['axis_' + axis.key] ?? 50;   // 0-100

        if (Math.abs(partyScore) < PARTY_THRESHOLD) continue;
        if (Math.abs(blocScore - 50) < BLOC_THRESHOLD) continue;

        const partySide = partyScore < 0 ? 'left' : 'right';
        const blocSide  = blocScore  < 50 ? 'left' : 'right';

        if (partySide === blocSide) {
            aligned++;
        } else {
            opposed++;
        }
    }

    return { opposed, aligned };
}

/**
 * Ideology opposition penalty multiplier for preference_score.
 *
 * - 2+ opposing ideologies → 0.70 (-30%)
 * - 1 opposing ideology    → 0.80 (-20%)
 * - 0 opposing, 0 aligned  → 0.90 (-10%)
 * - At least 1 aligned, 0 opposing → 1.0 (no penalty)
 *
 * @param {object} factionIdeology - Row from faction_ideology
 * @param {object} bloc - Voter bloc row with axis_* columns
 * @returns {number} Multiplier (0.70–1.0)
 */
function ideologyOppositionMultiplier(factionIdeology, bloc) {
    const { opposed, aligned } = countIdeologyRelationship(factionIdeology, bloc);

    if (opposed >= 2) return 0.70;
    if (opposed === 1) return 0.80;
    // Only penalize if the party actually has positions but none align.
    // A fully centrist party (no strong positions) should not be penalized —
    // they just don't benefit from alignment bonuses.
    if (aligned === 0) {
        // Check if the party has ANY strong position (|score| >= 20)
        const hasPosition = IDEOLOGY_AXES.some(ax =>
            Math.abs(factionIdeology[ax.key] || 0) >= 20
        );
        return hasPosition ? 0.90 : 1.0;
    }
    return 1.0;
}


// ==================== IDEOLOGY DATABASE HELPERS ====================

async function loadFactionIdeology(supabase, factionId) {
    const cacheKey = 'faction_ideo_' + factionId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }
    const { data, error } = await supabase
        .from('faction_ideology')
        .select('*')
        .eq('faction_id', factionId)
        .maybeSingle();

    if (error) {
        console.error('Error loading faction ideology:', error);
        return { _error: true, message: error.message };
    }
    if (data && typeof qCacheSet === 'function') qCacheSet(cacheKey, data, 2 * 60 * 1000);
    return data;
}

async function loadNationIdeologies(supabase, nationId) {
    const cacheKey = 'nation_ideos_' + nationId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }
    const { data: factions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');

    if (!factions || factions.length === 0) return [];

    const factionIds = factions.map(f => f.id);
    const { data, error } = await supabase
        .from('faction_ideology')
        .select('*, factions(id, faction_name, faction_type, nation_id)')
        .in('faction_id', factionIds);

    if (error) {
        console.error('Error loading nation ideologies:', error);
        return [];
    }
    const result = data || [];
    if (result.length && typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 2 * 60 * 1000);
    return result;
}

function extractAxisScores(ideologyRow) {
    const scores = {};
    for (const axis of IDEOLOGY_AXES) {
        scores[axis.key] = ideologyRow[axis.key] || 0;
    }
    return scores;
}

// ────────── stats ──────────


// ==================== ADMINISTRATION LIFECYCLE ====================

/**
 * Canonical nation stat columns — the SINGLE SOURCE OF TRUTH.
 *
 * Every stat key in every effect table (policies, crises, events, ministry
 * actions, PM traits, diplomacy) MUST match one of these keys exactly.
 * If a legacy key exists in the database, add it to STAT_KEY_ALIASES below
 * so normalizeNationStatKey() can resolve it.
 *
 * Used by: processStatEffects, processCrises, processEvents,
 *          processMinistryActions, processPMTraitEffects, auditStatKeys,
 *          snapshotNationHistory, administration snapshots.
 *
 * CANONICAL STAT KEY REFERENCE:
 *   --- Economic ---
 *   gdp                        GDP ($B)
 *   gdp_growth                 Annual economic growth rate
 *   debt                       Government debt obligations ($B)
 *   debt_growth                Rate of debt accumulation
 *   inflation                  Rate of price increases
 *   interest_rates             Central bank lending rate
 *   trade_balance              Exports minus imports
 *   currency_strength          Value of national currency
 *   foreign_investment         International capital inflow
 *   credit                     National creditworthiness
 *   --- Taxation ---
 *   income_tax                 Tax rate on personal income
 *   corporate_tax              Tax rate on business profits
 *   sales_tax                  Tax on goods and services
 *   tariffs                    Import/export duties
 *   --- Labor & Employment ---
 *   unemployment               Percentage without work
 *   labor_force_participation  Working-age adults employed
 *   minimum_wage               Lowest legal hourly wage
 *   union_strength             Power of labor unions
 *   poverty_rate               Population below poverty line
 *   income_inequality          Gap between rich and poor
 *   --- Demographics ---
 *   population                 Total population (raw number)
 *   population_growth          Rate of population change
 *   birth_rate                 Births per 1,000 people
 *   death_rate                 Deaths per 1,000 people
 *   median_age                 Average age of population
 *   eligible_voters            Citizens able to vote
 *   ethnic_diversity           Cultural heterogeneity
 *   --- Healthcare ---
 *   healthcare_quality         Overall medical care standard
 *   healthcare_accessibility   Access to medical services
 *   beds_per_100k              Hospital beds per 100,000 people  (NOT "hospital_beds")
 *   lifespan                   Average lifespan in years         (NOT "life_expectancy")
 *   drug_use                   Substance abuse prevalence
 *   --- Education ---
 *   literacy                   Population able to read/write     (NOT "literacy_rate")
 *   higher_education           University graduation rate        (NOT "education_quality")
 *   education_accessibility    Access to schooling
 *   academic_immigration       Scholars attracted to nation
 *   --- Infrastructure ---
 *   physical_infrastructure    Roads, bridges, ports, public works (NOT "infrastructure")
 *   digital_infrastructure     Internet and tech networks        (NOT "technology")
 *   rail_network               Train connectivity
 *   urbanization               Population in cities
 *   energy_generation          Power production capacity
 *   renewable_energy_percentage Clean energy percentage
 *   --- Resources ---
 *   arable_land                Farmable land area
 *   rare_minerals              Strategic mineral reserves
 *   oil_and_gas                Fossil fuel reserves
 *   fuel_prices                Consumer fuel costs
 *   --- Environment ---
 *   pollution                  Environmental contamination
 *   carbon_emissions           CO2 output
 *   --- Social ---
 *   standard_of_living         Quality of life index
 *   happiness                  Population wellbeing
 *   social_mobility            Ability to change economic class
 *   benefits                   Government welfare programs
 *   crime_rate                 Criminal activity level           (NOT "crime")
 *   incarceration_rate         Prison population per capita
 *   --- Religion ---
 *   religious                  Religiosity index
 *   --- Governance ---
 *   stability                  Political stability               (also used for "military_strength")
 *   legitimacy                 Government legitimacy
 *   efficiency                 Bureaucratic efficiency
 *   corruption                 Government corruption
 *   press_freedom              Media independence
 *   judicial_independence      Court system independence
 *   freedom_index              Civil liberties composite
 *   polarization               Political division
 *   --- Security ---
 *   civil_unrest               Public disorder
 *   terrorism                  Terrorist threat level
 *   political_violence         Political violence
 *   --- Immigration ---
 *   immigration                Legal immigration rate
 *   illegal_immigration        Unauthorized entry rate
 *   emigration                 Citizens leaving
 *   --- International ---
 *   international_reputation   Global standing                   (NOT "diplomatic_standing")
 *   trade_agreements           Number of trade agreements        (NOT "trade")
 *   sanctions                  Active sanctions against nation
 */
const NATION_STAT_COLUMNS = [
    'gdp', 'gdp_growth', 'debt', 'debt_growth', 'inflation', 'interest_rates',
    'trade_balance', 'currency_strength', 'foreign_investment', 'credit',
    'income_tax', 'corporate_tax', 'sales_tax', 'tariffs',
    'unemployment', 'labor_force_participation', 'minimum_wage', 'union_strength',
    'poverty_rate', 'income_inequality',
    'population', 'population_growth', 'birth_rate', 'death_rate', 'median_age', 'eligible_voters', 'ethnic_diversity',
    'healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan', 'drug_use',
    'literacy', 'higher_education', 'education_accessibility', 'academic_immigration',
    'physical_infrastructure', 'digital_infrastructure', 'rail_network', 'urbanization', 'energy_generation', 'renewable_energy_percentage',
    'arable_land', 'rare_minerals', 'oil_and_gas', 'fuel_prices',
    'pollution', 'carbon_emissions',
    'standard_of_living', 'happiness', 'social_mobility', 'benefits', 'crime_rate', 'incarceration_rate',
    'religious',
    'stability', 'legitimacy', 'efficiency', 'corruption', 'press_freedom', 'judicial_independence',
    'freedom_index', 'polarization',
    'civil_unrest', 'terrorism', 'political_violence',
    'immigration', 'illegal_immigration', 'emigration',
    'international_reputation', 'trade_agreements', 'sanctions'
];

const NATION_STAT_COLUMN_SET = new Set(NATION_STAT_COLUMNS);

const STAT_KEY_ALIASES = {
    intl_reputation: 'international_reputation',
    diplomatic_standing: 'international_reputation',
    credit_rating: 'credit',
    credit_score: 'credit',
    trade: 'trade_balance',
    trade_volume: 'trade_balance',
    education: 'higher_education',
    education_quality: 'higher_education',
    military_strength: 'stability',
    literacy_rate: 'literacy',
    hospital_beds: 'beds_per_100k',
    technology: 'digital_infrastructure',
    infrastructure: 'physical_infrastructure',
    tourism: 'international_reputation'
};

function normalizeNationStatKey(statKey) {
    if (!statKey || typeof statKey !== 'string') return null;
    return STAT_KEY_ALIASES[statKey] || statKey;
}

/**
 * Stats where HIGHER values are better (increase = achievement).
 */
const STATS_HIGHER_IS_BETTER = [
    'gdp_growth', 'currency_strength', 'foreign_investment', 'credit',
    'labor_force_participation', 'minimum_wage', 'union_strength',
    'population_growth', 'eligible_voters', 'ethnic_diversity',
    'healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan',
    'literacy', 'higher_education', 'education_accessibility', 'academic_immigration',
    'physical_infrastructure', 'digital_infrastructure', 'rail_network', 'energy_generation', 'renewable_energy_percentage',
    'arable_land', 'rare_minerals',
    'standard_of_living', 'happiness', 'social_mobility', 'benefits',
    'stability', 'legitimacy', 'efficiency', 'press_freedom', 'judicial_independence', 'freedom_index',
    'immigration', 'international_reputation', 'trade_agreements'
];

/**
 * Stats where LOWER values are better (decrease = achievement).
 */
const STATS_LOWER_IS_BETTER = [
    'debt_growth', 'inflation', 'interest_rates',
    'unemployment', 'poverty_rate', 'income_inequality', 'death_rate',
    'drug_use', 'fuel_prices', 'pollution', 'carbon_emissions',
    'crime_rate', 'incarceration_rate', 'corruption', 'polarization',
    'civil_unrest', 'terrorism', 'political_violence',
    'illegal_immigration', 'emigration', 'sanctions'
];

// ==================== STAT DECAY CONFIGURATION ====================

const DECAY_SPEED = { CRAWL: 0.25, VERY_SLOW: 0.5, SLOW: 1, MEDIUM: 2, FAST: 3 };

/**
 * Stats that decay each tick. Two types:
 *   - 'equilibrium': drifts toward a midpoint (requires constant governing effort)
 *   - 'erosion': degrades toward a bad floor (punishes neglect)
 * Stats not listed are persistent — they hold value indefinitely.
 */
const STAT_DECAY_CONFIG = {
    // ── Equilibrium (drift back to midpoint) ──
    inflation:           { type: 'equilibrium', target: 28, speed: DECAY_SPEED.CRAWL },
    interest_rates:      { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    currency_strength:   { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    civil_unrest:        { type: 'equilibrium', target: 20, speed: DECAY_SPEED.CRAWL },
    polarization:        { type: 'equilibrium', target: 30, speed: DECAY_SPEED.CRAWL },
    terrorism:           { type: 'equilibrium', target: 10, speed: DECAY_SPEED.CRAWL },
    political_violence:  { type: 'equilibrium', target: 10, speed: DECAY_SPEED.CRAWL },
    happiness:           { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    foreign_investment:  { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    trade_balance:       { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    gdp_growth:          { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    immigration:         { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    illegal_immigration: { type: 'equilibrium', target: 30, speed: DECAY_SPEED.CRAWL },
    emigration:          { type: 'equilibrium', target: 30, speed: DECAY_SPEED.CRAWL },
    fuel_prices:         { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },
    debt_growth:         { type: 'equilibrium', target: 50, speed: DECAY_SPEED.CRAWL },

    // ── Erosion (degrade toward bad floor if neglected) ──
    physical_infrastructure:  { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
    digital_infrastructure:   { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
    rail_network:             { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
    energy_generation:        { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
    efficiency:               { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
    corruption:               { type: 'erosion', target: 70, speed: DECAY_SPEED.CRAWL },
    healthcare_quality:       { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
    healthcare_accessibility: { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
    beds_per_100k:            { type: 'erosion', target: 20, speed: DECAY_SPEED.CRAWL },
    education_accessibility:  { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
    press_freedom:            { type: 'erosion', target: 40, speed: DECAY_SPEED.CRAWL },
    judicial_independence:    { type: 'erosion', target: 40, speed: DECAY_SPEED.CRAWL },
    freedom_index:            { type: 'erosion', target: 40, speed: DECAY_SPEED.CRAWL },
    standard_of_living:       { type: 'erosion', target: 40, speed: DECAY_SPEED.CRAWL },
    social_mobility:          { type: 'erosion', target: 30, speed: DECAY_SPEED.CRAWL },
    benefits:                 { type: 'erosion', target: 0,  speed: DECAY_SPEED.CRAWL },
};

// Validate decay config keys at module load
for (const key of Object.keys(STAT_DECAY_CONFIG)) {
    if (!NATION_STAT_COLUMN_SET.has(key)) {
        console.error(`[STAT_DECAY_CONFIG] Invalid stat key: "${key}" — not in NATION_STAT_COLUMNS`);
    }
}

// ==================== INSTITUTION FUNDING DECAY TIERS ====================
// Institutions counteract natural stat decay. At 100% funding, decay is fully
// blocked. Below 100%, the rates below REPLACE the natural decay rate for stats
// covered by that institution. When multiple institutions cover the same stat,
// their rates are averaged.

const INSTITUTION_DECAY_TIERS = [
    { minPct: 100, primary: 0,    secondary: 0    },  // Fully Funded
    { minPct: 90,  primary: 0.3,  secondary: 0    },  // Stretched
    { minPct: 75,  primary: 0.5,  secondary: 0.2  },  // Strained
    { minPct: 50,  primary: 0.9,  secondary: 0.5  },  // Underfunded
    { minPct: 25,  primary: 1.7,  secondary: 0.9  },  // Critical
    { minPct: 0,   primary: 2.7,  secondary: 1.7  },  // Collapsed
];

/**
 * Look up the institution decay rate for a given funding percentage.
 * @param {number} fundingPct - 0-100 funding percentage
 * @param {'primary'|'secondary'} role - whether this stat is the institution's primary or secondary
 * @returns {number} decay rate per tick (0 = no decay)
 */
function getInstitutionDecayRate(fundingPct, role) {
    for (const tier of INSTITUTION_DECAY_TIERS) {
        if (fundingPct >= tier.minPct) return tier[role];
    }
    return INSTITUTION_DECAY_TIERS[INSTITUTION_DECAY_TIERS.length - 1][role];
}

/**
 * Build a map of statKey → array of { institutionId, role, fundingPct } from
 * institution config rows and budget_item_allocations for the active budget.
 *
 * @param {Array} instConfig - rows from ministry_institution_config
 * @param {Array} itemAllocations - rows from budget_item_allocations for the active bill
 * @returns {Object} e.g. { healthcare_quality: [{ id: 'workforce', role: 'primary', fundingPct: 85 }, ...] }
 */
function buildStatInstitutionMap(instConfig, itemAllocations) {
    const allocMap = {};
    for (const row of (itemAllocations || [])) {
        if (row.item_type === 'institution') {
            allocMap[row.item_id] = {
                allocated: Number(row.allocation_amount || 0),
                needed: Number(row.needed_amount || 0)
            };
        }
    }

    const statMap = {};
    for (const inst of (instConfig || [])) {
        const alloc = allocMap[inst.id];
        const fundingPct = alloc && alloc.needed > 0
            ? Math.min(100, Math.round((alloc.allocated / alloc.needed) * 100))
            : 100;  // no allocation row = fully funded by default

        for (const role of ['primary', 'secondary']) {
            const statKey = inst[`${role}_stat`];
            if (!statKey) continue;
            if (!statMap[statKey]) statMap[statKey] = [];
            statMap[statKey].push({ id: inst.id, role, fundingPct });
        }
    }
    return statMap;
}

/**
 * For a given stat, compute the effective institution decay rate by averaging
 * all institutions that cover it (as primary or secondary).
 *
 * @param {Array} institutions - entries from buildStatInstitutionMap()[statKey]
 * @returns {number|null} averaged decay rate, or null if no institutions cover this stat
 */
function getAveragedInstitutionDecay(institutions) {
    if (!institutions || institutions.length === 0) return null;
    let total = 0;
    for (const inst of institutions) {
        total += getInstitutionDecayRate(inst.fundingPct, inst.role);
    }
    return total / institutions.length;
}

// ==================== THREE-PILLAR VOTING SYSTEM MAPPINGS ====================

/**
 * Maps each nation stat to the ministry responsible for it.
 * Used by performance perception to credit/blame ministry-holding parties.
 */
const STAT_TO_MINISTRY = {
    // Finance
    gdp_growth: 'finance', inflation: 'finance', interest_rates: 'finance',
    currency_strength: 'finance', credit: 'finance',
    income_tax: 'finance', corporate_tax: 'finance', sales_tax: 'finance',
    // Healthcare
    healthcare_quality: 'healthcare', healthcare_accessibility: 'healthcare',
    beds_per_100k: 'healthcare', lifespan: 'healthcare', drug_use: 'healthcare',
    death_rate: 'healthcare',
    // Education
    literacy: 'education', higher_education: 'education',
    education_accessibility: 'education', academic_immigration: 'education',
    // Labor
    unemployment: 'labor', labor_force_participation: 'labor',
    minimum_wage: 'labor', union_strength: 'labor',
    poverty_rate: 'labor', income_inequality: 'labor',
    // Interior
    stability: 'interior',
    crime_rate: 'interior', incarceration_rate: 'interior',
    immigration: 'interior', illegal_immigration: 'interior',
    // Justice
    corruption: 'justice', judicial_independence: 'justice',
    press_freedom: 'justice', freedom_index: 'justice',
    // Energy
    energy_generation: 'energy', renewable_energy_percentage: 'energy',
    pollution: 'energy', carbon_emissions: 'energy',
    // Transportation
    physical_infrastructure: 'transportation', digital_infrastructure: 'transportation',
    rail_network: 'transportation', urbanization: 'transportation',
    // Defense
    terrorism: 'defense',
    // Security
    civil_unrest: 'security', political_violence: 'security',
    // Trade
    trade_balance: 'trade', trade_agreements: 'trade',
    tariffs: 'trade', foreign_investment: 'trade',
    // Foreign
    international_reputation: 'foreign',
    sanctions: 'foreign', emigration: 'foreign',
    // Prime Minister (general governance & quality of life)
    legitimacy: 'prime_minister', efficiency: 'prime_minister', polarization: 'prime_minister',
    happiness: 'prime_minister', standard_of_living: 'prime_minister',
    social_mobility: 'prime_minister', benefits: 'prime_minister',
    fuel_prices: 'prime_minister'
};

/**
 * Maps voter-bloc priority issue categories to the nation stats they care about.
 * Each bloc has 1-2 priority_issues (e.g., ['Economics', 'Labor']).
 */
const ISSUE_CATEGORY_STATS = {
    Agriculture:     ['arable_land', 'fuel_prices', 'trade_balance', 'poverty_rate'],
    Economics:       ['gdp', 'gdp_growth', 'inflation', 'unemployment', 'currency_strength', 'trade_balance', 'debt'],
    Education:       ['literacy', 'higher_education', 'education_accessibility', 'academic_immigration'],
    Governance:      ['stability', 'legitimacy', 'efficiency', 'corruption', 'freedom_index'],
    Healthcare:      ['healthcare_quality', 'healthcare_accessibility', 'beds_per_100k', 'lifespan', 'drug_use'],
    Immigration:     ['immigration', 'illegal_immigration', 'emigration', 'ethnic_diversity'],
    Infrastructure:  ['physical_infrastructure', 'digital_infrastructure', 'rail_network', 'energy_generation', 'renewable_energy_percentage'],
    International:   ['international_reputation', 'trade_agreements', 'sanctions', 'foreign_investment'],
    Labor:           ['unemployment', 'labor_force_participation', 'minimum_wage', 'union_strength', 'poverty_rate', 'income_inequality'],
    Military:        ['terrorism', 'political_violence', 'civil_unrest', 'stability'],
    Social:          ['standard_of_living', 'happiness', 'social_mobility', 'crime_rate', 'pollution', 'benefits']
};

const _HIGHER_IS_BETTER_SET = new Set(STATS_HIGHER_IS_BETTER);
const _LOWER_IS_BETTER_SET  = new Set(STATS_LOWER_IS_BETTER);

/**
 * Returns +1 if a positive delta is "good", -1 if negative delta is "good", 0 if neutral.
 */
function statDirectionSign(statKey) {
    if (_HIGHER_IS_BETTER_SET.has(statKey)) return 1;
    if (_LOWER_IS_BETTER_SET.has(statKey)) return -1;
    return 0;
}

// ==================== INFLATION FORMATTING ====================

/**
 * Inflation scale: 0-100 stat, no deflation (prices always go up).
 * Rate formula: stat^1.5 / 100  →  stat 1 = 0.01%, stat 100 = 10.0%
 */

function inflationRate(inflationStat) {
    const val = Math.max(0, Number(inflationStat ?? 0));
    return Math.pow(val, 1.5) / 100;
}

function formatInflationRate(inflationStat) {
    const rate = inflationRate(inflationStat);
    if (rate < 0.01) return '0%';
    if (rate < 1) return '+' + rate.toFixed(2) + '%';
    return '+' + rate.toFixed(1) + '%';
}

function getInflationLabel(inflationStat) {
    const rate = inflationRate(inflationStat);
    if (rate < 0.1)  return 'Negligible';
    if (rate < 0.5)  return 'Minimal';
    if (rate < 1.5)  return 'Stable';
    if (rate < 3)    return 'Low Inflation';
    if (rate < 5)    return 'Moderate Inflation';
    if (rate < 8)    return 'High Inflation';
    return 'Hyperinflation';
}

function inflationColorClass(inflationStat) {
    const rate = inflationRate(inflationStat);
    if (rate < 1.5)  return 'good';
    if (rate < 5)    return 'medium';
    return 'bad';
}

// ==================== STAT TREND CALCULATION ====================

/** Weights for weighted-average trend: most recent delta gets 0.40, oldest gets 0.05 */
const TREND_WEIGHTS = [0.05, 0.05, 0.10, 0.15, 0.25, 0.40];

/**
 * Weighted trend for a single stat over the last `lookback` ticks.
 * Returns a signed value: positive = rising, negative = falling.
 * Requires stat_history rows populated by recordStatHistory().
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string} statName  - nation stat key (e.g. 'unemployment')
 * @param {number} [lookback=6] - how many tick-deltas to consider
 * @returns {Promise<number>} weighted trend value
 */
async function statTrend(supabase, nationId, statName, lookback = 6) {
    const { data: rows } = await supabase
        .from('stat_history')
        .select('value, tick')
        .eq('nation_id', nationId)
        .eq('stat_name', statName)
        .order('tick', { ascending: true })
        .limit(lookback + 1);

    if (!rows || rows.length < 2) return 0;

    let weightedSum = 0;
    const deltas = rows.length - 1;
    for (let i = 1; i < rows.length; i++) {
        const delta = rows[i].value - rows[i - 1].value;
        const weightIdx = Math.max(0, TREND_WEIGHTS.length - deltas + i - 1);
        weightedSum += delta * (TREND_WEIGHTS[weightIdx] || 0.10);
    }
    return weightedSum;
}

/**
 * Batch version: compute weighted trends for multiple stats in a single query.
 * Returns { statName: trendValue, ... }.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string[]} statNames - array of stat keys
 * @param {number} [lookback=6]
 * @returns {Promise<Object.<string, number>>}
 */
async function statTrendBatch(supabase, nationId, statNames, lookback = 6) {
    if (!statNames || statNames.length === 0) return {};

    const { data: rows } = await supabase
        .from('stat_history')
        .select('stat_name, value, tick')
        .eq('nation_id', nationId)
        .in('stat_name', statNames)
        .order('tick', { ascending: true });

    if (!rows || rows.length === 0) return {};

    // Group by stat_name
    const byName = {};
    for (const r of rows) {
        if (!byName[r.stat_name]) byName[r.stat_name] = [];
        byName[r.stat_name].push(r);
    }

    const trends = {};
    for (const [name, vals] of Object.entries(byName)) {
        const recent = vals.slice(-(lookback + 1));
        if (recent.length < 2) { trends[name] = 0; continue; }
        let weightedSum = 0;
        const deltas = recent.length - 1;
        for (let i = 1; i < recent.length; i++) {
            const delta = recent[i].value - recent[i - 1].value;
            const weightIdx = Math.max(0, TREND_WEIGHTS.length - deltas + i - 1);
            weightedSum += delta * (TREND_WEIGHTS[weightIdx] || 0.10);
        }
        trends[name] = weightedSum;
    }
    return trends;
}

// ==================== MINISTER & GOVERNMENT APPROVAL SYSTEM ====================
// Simplified "Drift-to-Performance" model:
//   - Minister approval drifts toward the average performance of their owned stats
//   - Government approval = average minister approval + vacancy penalty + event modifier

/**
 * Reverse map: ministry_key → [stat_keys] derived from STAT_TO_MINISTRY.
 * Used by the per-tick minister approval calculation to find which stats
 * each minister "owns".
 */
const MINISTRY_TO_STATS = {};
for (const [statKey, ministryKey] of Object.entries(STAT_TO_MINISTRY)) {
    if (!MINISTRY_TO_STATS[ministryKey]) MINISTRY_TO_STATS[ministryKey] = [];
    MINISTRY_TO_STATS[ministryKey].push(statKey);
}

/**
 * Build a stat_baselines object for a ministry: { statKey: currentValue, ... }
 * Only includes stats with a non-zero direction sign (skips neutral stats like taxes).
 *
 * @param {string} ministryKey - e.g. 'finance', 'labor'
 * @param {object} nation - nation row with current stat values
 * @returns {object} baseline snapshot for the ministry's owned stats
 */
function buildMinistryBaselines(ministryKey, nation) {
    const stats = MINISTRY_TO_STATS[ministryKey];
    if (!stats) return {};
    const baselines = {};
    for (const statKey of stats) {
        if (statDirectionSign(statKey) === 0) continue;
        baselines[statKey] = Number(nation[statKey] ?? 50);
    }
    return baselines;
}

/**
 * Delta-based approval system configuration.
 *
 * Minister approval starts at 50 and moves based on how their owned stats
 * change relative to their baseline (snapshot at appointment time).
 * Pure delta model: ministers are judged on improvement, not inherited state.
 *
 * Government approval = avg(filled minister approvals) + vacancy penalty + event modifier.
 */
const MINISTER_APPROVAL_CONFIG = {
    // Per-tick sensitivity: how much each point of average delta moves approval
    DELTA_SENSITIVITY: 0.6,

    // Slow stagnation decay: if stats are flat, approval drifts down slightly per tick
    STAGNATION_DECAY: -0.3,

    // New minister starts at 50% approval
    NEW_MINISTER_APPROVAL: 50,

    // Firing a minister costs 1 AP and gives +3 to the event modifier
    FIRE_MINISTER_AP_COST: 1,
    FIRE_GOV_APPROVAL_BONUS: 3,

    // Government approval: -3 per vacant ministry seat
    VACANCY_PENALTY: -3,

    // Event modifier decay: 10% per tick (transient shocks fade naturally)
    EVENTS_DECAY_RATE: 0.10,

    // Legislative activity: bonus to gov_approval_events when a bill passes
    BILL_PASSAGE_EVENT_BONUS: 3,

};

/**
 * Snapshot all nation stats into a flat JSONB object.
 */
function snapshotNationStats(nation) {
    const snapshot = {};
    for (const key of NATION_STAT_COLUMNS) {
        if (nation[key] !== undefined && nation[key] !== null) {
            snapshot[key] = nation[key];
        }
    }
    return snapshot;
}

// ────────── momentum ──────────


/**
 * Adjust momentum for a faction, optionally targeting a specific voter bloc.
 * Clamps to [-50, +50]. Writes an audit row to momentum_log.
 *
 * @param {object} supabase
 * @param {string} nationId  - nation UUID (for audit log)
 * @param {string} factionId - faction UUID
 * @param {string|null} blocId - specific bloc UUID, or null for all blocs
 * @param {number} amount    - positive = boost, negative = penalty
 * @param {string} source    - audit tag, e.g. 'legislation:veto'
 */
async function adjustMomentum(supabase, nationId, factionId, blocId, amount, source) {
    if (amount === 0) return;

    const query = supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, momentum')
        .eq('faction_id', factionId);
    if (blocId) query.eq('bloc_id', blocId);

    const { data: rows } = await query;
    if (!rows || rows.length === 0) return;

    for (const row of rows) {
        const old = Number(row.momentum ?? 0);
        const clamped = Math.round(Math.max(-50, Math.min(50, old + amount)) * 100) / 100;
        await supabase.from('faction_bloc_approval')
            .update({ momentum: clamped })
            .eq('id', row.id);
    }

    // Audit log (best-effort — don't fail the caller)
    const { data: shard } = await supabase
        .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    await supabase.from('momentum_log').insert({
        nation_id: nationId,
        faction_id: factionId,
        bloc_id: blocId || null,
        amount,
        source: source || 'unknown',
        tick: shard?.current_tick || 0
    });

    console.log(`[Momentum] ${amount > 0 ? '+' : ''}${amount} for faction ${factionId}${blocId ? ` bloc ${blocId}` : ` (${rows.length} blocs)`} — ${source}`);
}

/**
 * Convenience wrapper: adjust momentum uniformly across ALL blocs for a faction.
 * Use this for events that affect a party's overall standing (crises, elections, etc.).
 */
async function adjustMomentumAll(supabase, nationId, factionId, amount, source) {
    await adjustMomentum(supabase, nationId, factionId, null, amount, source);
}
/**
 * Apply a one-time event modifier to the government approval event modifier.
 * The modifier decays 10% per tick, so transient shocks fade naturally.
 * Clamped to [-50, +50]. Writes an audit row to gov_approval_log.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {number} amount   - signed delta (positive = boost, negative = shock)
 * @param {string} source   - audit tag, e.g. 'legislation:veto'
 */
async function adjustGovernmentApprovalEvent(supabase, nationId, amount, source) {
    if (amount === 0) return;

    const { data: nation } = await supabase
        .from('nations')
        .select('gov_approval_events')
        .eq('id', nationId)
        .single();

    const current = Number(nation?.gov_approval_events ?? 0);
    const updated = Math.round(Math.max(-50, Math.min(50, current + amount)) * 100) / 100;

    const { error: updateErr } = await supabase.from('nations')
        .update({ gov_approval_events: updated })
        .eq('id', nationId);

    if (updateErr) {
        console.error(`[GovApprovalEvent] Failed to update gov_approval_events for ${nationId}: ${updateErr.message}`);
        return;
    }

    // Audit log (non-fatal — table may not exist if migration not applied)
    try {
        const { data: shard } = await supabase
            .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        await supabase.from('gov_approval_log').insert({
            nation_id: nationId,
            amount,
            source: source || 'unknown',
            tick: shard?.current_tick || 0
        });
    } catch (e) { /* non-blocking */ }

    console.log(`[GovApprovalEvent] ${amount > 0 ? '+' : ''}${amount} for nation ${nationId} — ${source}`);
}

// ────────── budget ──────────


// ==================== NATIONAL BUDGET CALCULATION ====================

function calculateNationalBudget(nation) {
    // GDP and Debt are stored as raw dollars
    const gdp = Number(nation.gdp ?? nation.GDP ?? 0);
    const debt = Number(nation.debt ?? 0);

    // Tax rates: 0-100 percentages
    const incomeTaxRate  = Number(nation.income_tax ?? 0);
    const corpTaxRate    = Number(nation.corporate_tax ?? 0);
    const salesTaxRate   = Number(nation.sales_tax ?? 0);
    const tariffsRate    = Number(nation.tariffs ?? 0);

    // Other 0-100 stats
    const efficiency     = Number(nation.efficiency ?? 50);
    const corruption     = Number(nation.corruption ?? 50);
    const oilGas         = Number(nation.oil_and_gas ?? 0);
    const creditRating   = Number(nation.credit ?? 50);

    // Collection Rate = (Efficiency + (100 - Corruption)) / 200  →  0.0 to 1.0
    const collectionRate = (efficiency + (100 - corruption)) / 200;

    // Tax Revenue (raw dollars, since GDP is raw dollars)
    const incomeRevenue  = gdp * (incomeTaxRate / 100) * 0.40 * collectionRate;
    const corpRevenue    = gdp * (corpTaxRate / 100)   * 0.10 * collectionRate;
    const salesRevenue   = gdp * (salesTaxRate / 100)  * 0.30 * collectionRate;
    const tariffRevenue  = gdp * (tariffsRate / 100)   * 0.05 * collectionRate;

    // Oil & Gas Revenue (only if oil_and_gas stat > 30)
    const oilRevenue = oilGas > 30 ? gdp * (oilGas / 100) * 0.06 : 0;

    const grossRevenue = incomeRevenue + corpRevenue + salesRevenue + tariffRevenue + oilRevenue;

    // Debt Service: Effective Interest = 15% - (Credit × 0.13%), clamped 2%-18%
    const effectiveInterest = Math.min(0.18, Math.max(0.02, 0.15 - (creditRating * 0.0013)));
    const debtService = debt * effectiveInterest;

    // Available Budget = Revenue - Debt Service
    const availableBudget = grossRevenue - debtService;

    return {
        grossRevenue, debtService, availableBudget, collectionRate,
        incomeRevenue, corpRevenue, salesRevenue, tariffRevenue, oilRevenue
    };
}

/**
 * Override formula-based tariff revenue with real trade engine data.
 * Mutates the budget object in place and returns it.
 */
function applyTradeTariffOverride(budget, tradeTariffRevenue) {
    if (tradeTariffRevenue != null && Number(tradeTariffRevenue) > 0) {
        const oldTariff = budget.tariffRevenue;
        budget.tariffRevenue = Number(tradeTariffRevenue);
        budget.grossRevenue = budget.grossRevenue - oldTariff + budget.tariffRevenue;
        budget.availableBudget = budget.grossRevenue - budget.debtService;
    }
    return budget;
}

// ==================== TAX CONFIG ====================

/**
 * Static metadata for each adjustable tax type.
 * Effects are NOT hardcoded — they come from stat_connections at runtime.
 */
const TAX_CONFIG = [
    {
        key: 'income_tax',
        name: 'Income Tax',
        category: 'Income',
        categoryClass: 'pill-income',
        revenueKey: 'incomeRevenue',
        gdpMultiplier: 0.40,
        maxRate: 50
    },
    {
        key: 'sales_tax',
        name: 'Sales Tax',
        category: 'Consumption',
        categoryClass: 'pill-consumption',
        revenueKey: 'salesRevenue',
        gdpMultiplier: 0.30,
        maxRate: 50
    },
    {
        key: 'corporate_tax',
        name: 'Corporate Tax',
        category: 'Corporate',
        categoryClass: 'pill-corporate',
        revenueKey: 'corpRevenue',
        gdpMultiplier: 0.10,
        maxRate: 50
    }
];

// ==================== BUDGET CALCULATION HELPERS ====================

/**
 * Fiscal categories that map 1:1 to ministries.
 */
const FISCAL_CATEGORIES = [
    'Interior', 'Labor', 'Healthcare', 'Education',
    'Transportation', 'Energy', 'Justice', 'Foreign Ministry', 'Finance', 'Defense', 'Trade'
];

/**
 * Map fiscal category names → ministry_key used in ministry_institution_config.
 */
const FISCAL_TO_MINISTRY_KEY = {
    'Interior': 'interior', 'Labor': 'labor', 'Healthcare': 'healthcare',
    'Education': 'education', 'Transportation': 'transportation', 'Energy': 'energy',
    'Justice': 'justice', 'Foreign Ministry': 'foreign', 'Finance': 'finance',
    'Defense': 'defense', 'Trade': 'trade'
};

/**
 * Compute inflation cost multiplier from the 0-100 inflation stat.
 * Rate = stat^1.5 / 100  →  stat 1 = 0.01%, stat 100 = 10%.
 * No deflation — multiplier is always ≥ 1.
 */
function getInflationMultiplier(inflationStat) {
    const rate = Math.pow(Math.max(0, Number(inflationStat || 0)), 1.5) / 100;
    return 1 + (rate / 100);
}

/**
 * Compute the annualized cost of all active policies for a given fiscal category.
 * Returns raw dollars. Applies inflation adjustment.
 */
function computeMinistryPolicyCost(activeLaws, fiscalCategory, nation) {
    let total = 0;
    const policies = [];

    for (const law of (activeLaws || [])) {
        if (law.is_reversal) continue;
        const policy = law.policies;
        if (!policy || policy.fiscal_category !== fiscalCategory) continue;

        let annualCost = 0;
        const ongoingBase = policy.ongoing_base_cost || policy.ongoing_cost_per_tick || 0;
        if (ongoingBase > 0) {
            let scaled = ongoingBase;
            if (policy.ongoing_scaling_stat && nation[policy.ongoing_scaling_stat] !== undefined) {
                const statVal = Number(nation[policy.ongoing_scaling_stat]) || 1;
                const divisor = RAW_SCALING_DIVISORS[policy.ongoing_scaling_stat] || 50;
                scaled = ongoingBase * (statVal / divisor);
            }
            annualCost = scaled * GAME_CONFIG.TICKS_PER_YEAR * 1_000_000;
        }

        if (annualCost > 0) {
            policies.push({ policy_id: policy.id, policy_name: policy.policy_name, cost: annualCost });
            total += annualCost;
        }
    }

    // Apply inflation
    const inflationMult = getInflationMultiplier(nation.inflation);
    total *= inflationMult;
    for (const p of policies) p.cost *= inflationMult;

    return { total, policies };
}

/**
 * Compute the annualized cost of all institutions for a given fiscal category.
 * Population-scaled: base_cost_per_capita × population × inflation.
 * GDP-scaled:        base_cost_per_capita (as % of GDP, e.g. 0.5 = 0.5%) × GDP × inflation.
 * @param {Array} institutions - rows from ministry_institution_config
 * @param {string} fiscalCategory - e.g. 'Healthcare', 'Trade'
 * @param {Object} nation
 */
function computeMinistryInstitutionCost(institutions, fiscalCategory, nation) {
    const ministryKey = FISCAL_TO_MINISTRY_KEY[fiscalCategory] || fiscalCategory.toLowerCase();
    const insts = (institutions || []).filter(i => i.ministry_key === ministryKey);
    const population = Number(nation.population || 0);
    const gdp = Number(nation.gdp ?? nation.GDP ?? 0);
    const inflationMult = getInflationMultiplier(nation.inflation);

    let total = 0;
    const items = [];
    for (const inst of insts) {
        const baseVal = Number(inst.base_cost_per_capita || 0);
        const scalingType = inst.scaling_type || 'population';
        let cost;
        if (scalingType === 'gdp') {
            // baseVal is a percentage of GDP (e.g. 0.5 means 0.5%)
            cost = (baseVal / 100) * gdp;
        } else {
            cost = baseVal * population;
        }
        cost *= inflationMult;
        items.push({
            id: inst.id, institution_name: inst.institution_name, cost,
            base_cost_per_capita: inst.base_cost_per_capita,
            scaling_type: scalingType
        });
        total += cost;
    }
    return { total, institutions: items };
}

/**
 * Build full budget data for a nation: revenue, expenditures per ministry, debt service, etc.
 * @param {Object} aidData - Optional { received: number, given: number, agreements: [...] }
 */
function buildBudgetData(nation, activeLaws, tradeTariffRevenue, institutions, aidData) {
    const budget = calculateNationalBudget(nation);
    applyTradeTariffOverride(budget, tradeTariffRevenue);
    const inflationStat = Number(nation.inflation || 0);
    const inflationPct = Math.pow(Math.max(0, inflationStat), 1.5) / 100;
    const reserves = 0;

    // Foreign aid: received adds to revenue, given is a mandatory expenditure
    const aidReceived = Number(aidData?.received || 0);
    const aidGiven = Number(aidData?.given || 0);
    budget.aidReceived = aidReceived;
    budget.aidGiven = aidGiven;
    budget.grossRevenue += aidReceived;

    const ministries = {};
    let totalExpenditure = 0;

    for (const cat of FISCAL_CATEGORIES) {
        const polResult = computeMinistryPolicyCost(activeLaws, cat, nation);
        const instResult = computeMinistryInstitutionCost(institutions || [], cat, nation);
        const fulfilledCost = polResult.total + instResult.total;
        ministries[cat] = {
            fulfilledCost,
            allocation: fulfilledCost,  // default: fulfill
            policies: polResult.policies,
            institutions: instResult.institutions,
            institutionTotal: instResult.total,
            policyTotal: polResult.total
        };
        totalExpenditure += fulfilledCost;
    }

    // Aid commitments are mandatory (like debt service) — reduce available budget
    const available = budget.grossRevenue + reserves - budget.debtService - aidGiven;

    return {
        ...budget,
        inflationPct,
        inflationStat,
        reserves,
        aidReceived,
        aidGiven,
        aidAgreements: aidData?.agreements || [],
        ministries,
        totalExpenditure,
        available,
        currentDebt: Number(nation.debt || 0),
        projectedDebt: Number(nation.debt || 0) + Math.max(0, totalExpenditure - available)
    };
}


// ==================== ECONOMIC AID HELPERS ====================

/**
 * Query active economic aid agreements involving a nation.
 * Returns { received: totalDollarsReceived, given: totalDollarsGiven, agreements: [...] }
 */
async function getActiveAidForNation(supabase, nationId) {
    const { data: aidStates } = await supabase.from('aid_agreement_state')
        .select('*, trade_agreements!inner(status, agreement_type, articles, agreement_name, nation_a_id, nation_b_id)')
        .or(`donor_nation_id.eq.${nationId},recipient_nation_id.eq.${nationId}`)
        .eq('trade_agreements.status', 'active')
        .eq('trade_agreements.agreement_type', 'economic_aid')
        .eq('is_suspended', false);

    let received = 0;
    let given = 0;
    const agreements = [];

    for (const state of (aidStates || [])) {
        const amount = Number(state.current_annual_amount || 0);
        if (state.recipient_nation_id === nationId) {
            received += amount;
        }
        if (state.donor_nation_id === nationId) {
            given += amount;
        }
        agreements.push(state);
    }

    return { received, given, agreements };
}

/**
 * Process annual condition reviews for all active economic aid agreements
 * where this nation is the RECIPIENT. Called once per year (when tick % 12 === 0).
 *
 * For each agreement:
 *   1. Check all aid_condition articles against the recipient nation's current stats
 *   2. Track consecutive failures per condition
 *   3. Apply on_failure actions (suspend, terminate, reduce) after grace periods expire
 *   4. Log the review to aid_condition_reviews
 */
async function processAidConditionReview(supabase, nation, currentTick) {
    // Query all active aid agreements where this nation is the recipient and review is due
    // Includes suspended agreements so we can check if conditions are met again (un-suspend)
    const { data: aidStates } = await supabase.from('aid_agreement_state')
        .select('*, trade_agreements!inner(id, status, agreement_type, articles, agreement_name, nation_a_id, nation_b_id)')
        .eq('recipient_nation_id', nation.id)
        .eq('trade_agreements.status', 'active')
        .eq('trade_agreements.agreement_type', 'economic_aid')
        .lte('next_review_tick', currentTick);

    if (!aidStates || aidStates.length === 0) return [];

    const results = [];

    for (const state of aidStates) {
        const agreement = state.trade_agreements;
        const articles = agreement.articles || [];
        const conditions = articles.filter(a => a.type === 'aid_condition');

        if (conditions.length === 0) {
            // No conditions — just update review tick
            await supabase.from('aid_agreement_state').update({
                last_review_tick: currentTick,
                next_review_tick: currentTick + DIPLOMACY_CONFIG.AID_ANNUAL_REVIEW_INTERVAL
            }).eq('agreement_id', state.agreement_id);
            continue;
        }

        const conditionFailures = state.condition_failures || {};
        const conditionsChecked = [];
        const actionsTaken = [];
        let shouldSuspend = false;
        let shouldTerminate = false;
        let reductionFactor = 1.0;

        for (let i = 0; i < conditions.length; i++) {
            const cond = conditions[i].data;
            const statKey = cond.stat_key;
            const operator = cond.operator;     // 'gte' or 'lte'
            const threshold = Number(cond.threshold);
            const onFailure = cond.on_failure;  // 'suspend', 'terminate', 'reduce'
            const gracePeriods = Number(cond.grace_periods || 0);

            const currentValue = Number(nation[statKey] ?? 50);
            const met = operator === 'gte' ? currentValue >= threshold : currentValue <= threshold;

            const prevFailures = Number(conditionFailures[String(i)] || 0);
            const newFailures = met ? 0 : prevFailures + 1;  // reset on success
            conditionFailures[String(i)] = newFailures;

            conditionsChecked.push({
                stat_key: statKey, operator, threshold, current_value: currentValue,
                met, on_failure: onFailure, grace_periods: gracePeriods,
                consecutive_failures: newFailures
            });

            // Apply consequence only if failures exceed grace period
            if (!met && newFailures > gracePeriods) {
                if (onFailure === 'terminate') {
                    shouldTerminate = true;
                    actionsTaken.push({
                        condition_index: i, action: 'terminate',
                        reason: `${statKey} ${operator === 'gte' ? '<' : '>'} ${threshold} (current: ${currentValue.toFixed(1)}) for ${newFailures} reviews`
                    });
                } else if (onFailure === 'suspend') {
                    shouldSuspend = true;
                    actionsTaken.push({
                        condition_index: i, action: 'suspend',
                        reason: `${statKey} ${operator === 'gte' ? '<' : '>'} ${threshold} (current: ${currentValue.toFixed(1)})`
                    });
                } else if (onFailure === 'reduce') {
                    // Each consecutive failure beyond grace halves the aid
                    const reductionSteps = newFailures - gracePeriods;
                    if (reductionSteps >= 3) {
                        shouldTerminate = true;
                        actionsTaken.push({
                            condition_index: i, action: 'terminate',
                            reason: `${statKey} failed ${reductionSteps} times after grace — aid terminated`
                        });
                    } else {
                        const factor = Math.pow(0.5, reductionSteps);
                        reductionFactor = Math.min(reductionFactor, factor);
                        actionsTaken.push({
                            condition_index: i, action: 'reduce',
                            reason: `${statKey} failed — aid reduced to ${(factor * 100).toFixed(0)}%`
                        });
                    }
                }
            } else if (!met) {
                // Within grace period — warn only
                actionsTaken.push({
                    condition_index: i, action: 'warn',
                    reason: `${statKey} ${operator === 'gte' ? '<' : '>'} ${threshold} (grace: ${newFailures}/${gracePeriods})`
                });
            }
        }

        // Apply consequences
        let newAmount = state.current_annual_amount;
        let aidContinued = true;

        if (shouldTerminate) {
            // Terminate the agreement
            await supabase.from('trade_agreements').update({
                status: 'terminated',
                withdrawn_at_tick: currentTick
            }).eq('id', state.agreement_id);

            await supabase.from('aid_agreement_state').update({
                is_suspended: true,
                suspended_at_tick: currentTick,
                suspension_reason: 'Terminated: conditions not met',
                last_review_tick: currentTick,
                next_review_tick: null,
                condition_failures: conditionFailures
            }).eq('agreement_id', state.agreement_id);

            aidContinued = false;
            newAmount = 0;

            // Fire event for both nations (recipient + donor)
            await fireBilateralEvent(supabase, 'aid_terminated', nation.id, state.donor_nation_id, currentTick, { agreement_name: agreement.agreement_name || 'Economic Aid', nation: nation.name });
        } else if (shouldSuspend) {
            await supabase.from('aid_agreement_state').update({
                is_suspended: true,
                suspended_at_tick: currentTick,
                suspension_reason: 'Suspended: conditions not met',
                last_review_tick: currentTick,
                next_review_tick: currentTick + DIPLOMACY_CONFIG.AID_ANNUAL_REVIEW_INTERVAL,
                condition_failures: conditionFailures
            }).eq('agreement_id', state.agreement_id);

            aidContinued = false;
            newAmount = 0;

            // Fire event for both nations (recipient + donor)
            await fireBilateralEvent(supabase, 'aid_suspended', nation.id, state.donor_nation_id, currentTick, { agreement_name: agreement.agreement_name || 'Economic Aid', nation: nation.name });
        } else if (state.is_suspended) {
            // All conditions now met on a suspended agreement — un-suspend
            newAmount = Number(state.original_annual_amount) * reductionFactor;

            // Cap at donor's GDP × max pct
            const aidTermsUnsuspend = articles.find(a => a.type === 'aid_terms');
            if (aidTermsUnsuspend) {
                const gdpCapPct = Number(aidTermsUnsuspend.data.gdp_cap_pct || DIPLOMACY_CONFIG.AID_MAX_GDP_PCT);
                const { data: donorNationUnsuspend } = await supabase.from('nations')
                    .select('gdp').eq('id', state.donor_nation_id).single();
                if (donorNationUnsuspend) {
                    const maxAmount = Number(donorNationUnsuspend.gdp || 0) * (gdpCapPct / 100);
                    newAmount = Math.min(newAmount, maxAmount);
                }
            }

            await supabase.from('aid_agreement_state').update({
                is_suspended: false,
                suspended_at_tick: null,
                suspension_reason: null,
                current_annual_amount: newAmount,
                last_review_tick: currentTick,
                next_review_tick: currentTick + DIPLOMACY_CONFIG.AID_ANNUAL_REVIEW_INTERVAL,
                condition_failures: conditionFailures
            }).eq('agreement_id', state.agreement_id);

            aidContinued = true;
            actionsTaken.push({ condition_index: -1, action: 'unsuspend', reason: 'All conditions now met — aid resumed' });

            // Fire event for both nations
            await fireBilateralEvent(supabase, 'aid_resumed', nation.id, state.donor_nation_id, currentTick, { agreement_name: agreement.agreement_name || 'Economic Aid', nation: nation.name });
        } else {
            // Apply reductions if any
            newAmount = Number(state.original_annual_amount) * reductionFactor;

            // Cap at donor's GDP × max pct
            const aidTerms = articles.find(a => a.type === 'aid_terms');
            if (aidTerms) {
                const gdpCapPct = Number(aidTerms.data.gdp_cap_pct || DIPLOMACY_CONFIG.AID_MAX_GDP_PCT);
                const { data: donorNation } = await supabase.from('nations')
                    .select('gdp').eq('id', state.donor_nation_id).single();
                if (donorNation) {
                    const maxAmount = Number(donorNation.gdp || 0) * (gdpCapPct / 100);
                    newAmount = Math.min(newAmount, maxAmount);
                }
            }

            await supabase.from('aid_agreement_state').update({
                current_annual_amount: newAmount,
                last_review_tick: currentTick,
                next_review_tick: currentTick + DIPLOMACY_CONFIG.AID_ANNUAL_REVIEW_INTERVAL,
                condition_failures: conditionFailures
            }).eq('agreement_id', state.agreement_id);
        }

        // Log the review
        await supabase.from('aid_condition_reviews').insert({
            agreement_id: state.agreement_id,
            review_tick: currentTick,
            donor_nation_id: state.donor_nation_id,
            recipient_nation_id: state.recipient_nation_id,
            conditions_checked: conditionsChecked,
            actions_taken: actionsTaken,
            aid_continued: aidContinued,
            new_annual_amount: newAmount
        });

        results.push({
            agreement_id: state.agreement_id,
            agreement_name: agreement.agreement_name,
            conditions_checked: conditionsChecked.length,
            actions_taken: actionsTaken,
            aid_continued: aidContinued,
            new_amount: newAmount
        });
    }

    return results;
}

/**
 * Expire trade agreements (including economic aid) that have passed their expires_at_tick.
 * Called once per tick. Marks expired agreements as 'expired' and cleans up aid state.
 */
async function processExpiredTradeAgreements(supabase, currentTick) {
    const { data: expired } = await supabase.from('trade_agreements')
        .select('id, agreement_type, agreement_name, nation_a_id, nation_b_id')
        .eq('status', 'active')
        .not('expires_at_tick', 'is', null)
        .lte('expires_at_tick', currentTick);

    if (!expired || expired.length === 0) return [];

    const results = [];
    for (const agreement of expired) {
        await supabase.from('trade_agreements').update({
            status: 'expired'
        }).eq('id', agreement.id);

        // For economic aid, mark the aid_agreement_state as well
        if (agreement.agreement_type === 'economic_aid') {
            await supabase.from('aid_agreement_state').update({
                is_suspended: true,
                suspension_reason: 'Agreement expired',
                next_review_tick: null
            }).eq('agreement_id', agreement.id);
        }

        // Notify nations (unilateral agreements only notify nation_a)
        if (agreement.nation_b_id) {
            await fireBilateralEvent(supabase, 'trade_agreement_expired', agreement.nation_a_id, agreement.nation_b_id, currentTick, { agreement_name: agreement.agreement_name || 'Agreement' });
        } else {
            try {
                await supabase.from('event_log').insert({
                    nation_id: agreement.nation_a_id,
                    event_name: (agreement.agreement_name || 'Agreement') + ' Expired',
                    category: 'Trade',
                    description_chosen: 'Your ' + (agreement.agreement_name || 'trade agreement') + ' has expired.',
                    fired_at_tick: currentTick
                });
            } catch (e) { /* non-blocking */ }
        }

        results.push({ id: agreement.id, name: agreement.agreement_name, type: agreement.agreement_type });
        console.log(`[processExpiredTradeAgreements] Expired: ${agreement.agreement_name} (${agreement.agreement_type})`);
    }
    return results;
}


// Apply GDP growth rate: gdp_growth (0-100) centered at 50 maps to -3% to +3% per month
// Formula: monthlyChange% = ((gdp_growth - 50) / 50) * 3  →  0=-3%, 50=0%, 100=+3%
async function applyGdpGrowth(supabase, nation) {
    const gdpGrowth = Number(nation.gdp_growth ?? 50);
    const currentGdp = Number(nation.gdp ?? 0);
    if (currentGdp <= 0) return;

    const monthlyChangePercent = ((gdpGrowth - 50) / 50) * 3;
    const newGdp = Math.max(0, currentGdp * (1 + monthlyChangePercent / 100));
    nation.gdp = newGdp;

    await supabase.from('nations').update({ gdp: newGdp }).eq('id', nation.id);
}

// ────────── government-structure ──────────


// ==================== SEAT LOADING ====================

async function loadSeats(supabase, nationId, isAutocracy, allParties, currentFactionId) {
    const allPartySeats = {};

    // factions.seats is the canonical source of truth — use it directly
    allParties.forEach(p => {
        allPartySeats[p.id] = p.seats || 0;
    });

    const currentSeats = allPartySeats[currentFactionId] ??
        allParties.find(p => p.id === currentFactionId)?.seats ?? 0;

    return { allPartySeats, currentSeats };
}


// ==================== HEAD FACTION ====================

async function detectHeadFaction(supabase, nationId, allParties, allPartySeats, currentFactionId) {
    const { data: nation } = await supabase
        .from('nations')
        .select('ruling_faction_id')
        .eq('id', nationId)
        .single();

    if (nation?.ruling_faction_id) {
        return {
            headFactionId: nation.ruling_faction_id,
            isHeadFaction: currentFactionId === nation.ruling_faction_id
        };
    }

    const { data: gov } = await supabase
        .from('nation_governments')
        .select('head_of_state_party')
        .eq('nation_id', nationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (gov?.head_of_state_party) {
        return {
            headFactionId: gov.head_of_state_party,
            isHeadFaction: currentFactionId === gov.head_of_state_party
        };
    }

    return { headFactionId: null, isHeadFaction: false };
}


// ==================== COALITION FETCHING ====================

async function fetchActiveCoalition(supabase, nationId) {
    const cacheKey = 'coalition_' + nationId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }

    // === PRESIDENTIAL SYSTEMS: return virtual coalition from active president ===
    const { data: nationRow } = await supabase
        .from('nations')
        .select('government_type')
        .eq('id', nationId)
        .single();

    if (isPresidentialRepublic(nationRow)) {
        const { data: president } = await supabase
            .from('presidents')
            .select('id, nation_id, faction_id, first_name, last_name, elected_tick, is_active')
            .eq('nation_id', nationId)
            .eq('is_active', true)
            .order('elected_tick', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!president) return null; // No active president yet (candidate selection pending)

        // Build ministry_allocations from active ministries
        const { data: ministries } = await supabase
            .from('ministries')
            .select('ministry_key, party_id')
            .eq('nation_id', nationId)
            .eq('is_active', true);

        const ministryAllocations = {};
        const cabinetPartyIds = new Set([president.faction_id]);
        for (const m of (ministries || [])) {
            if (m.party_id) {
                ministryAllocations[m.ministry_key] = m.party_id;
                cabinetPartyIds.add(m.party_id);
            }
        }

        const result = {
            id: president.id,
            nation_id: nationId,
            party_ids: Array.from(cabinetPartyIds),
            lead_party_id: president.faction_id,
            ministry_allocations: ministryAllocations,
            formed_at: null,
            status: 'formed',  // Always 'formed' while president is active
            _source: 'presidential'
        };
        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 15 * 1000);
        return result;
    }

    // === PARLIAMENTARY DEMOCRACY / AUTOCRACY: existing logic ===

    // Helper: if status looks active but frozen bills exist, it's actually caretaker
    async function inferCaretakerStatus(result) {
        if (result && (!result.status || result.status === 'formed')) {
            const { count } = await supabase
                .from('bills')
                .select('id', { count: 'exact', head: true })
                .eq('nation_id', nationId)
                .eq('status', 'frozen');
            if (count && count > 0) {
                result.status = 'caretaker';
            }
        }
        return result;
    }

    const { data: newGov } = await supabase
        .from('government_formations')
        .select('*')
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker'])
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (newGov) {
        const pmPartyId = newGov.ministry_assignments?.prime_minister || newGov.proposed_by;
        const result = {
            id: newGov.id,
            nation_id: newGov.nation_id,
            election_id: newGov.election_id,
            party_ids: newGov.party_ids || [],
            lead_party_id: pmPartyId,
            ministry_allocations: newGov.ministry_assignments || {},
            formed_at: newGov.formed_at,
            status: newGov.status,
            formation_type: newGov.formation_type || 'coalition',
            _source: 'government_formations'
        };
        await inferCaretakerStatus(result);

        // Reconcile: if government_formations has a definitive status, ensure active_coalitions matches
        if (result.status === 'dissolved' || result.status === 'caretaker') {
            try {
                await supabase.from('active_coalitions')
                    .update(result.status === 'dissolved'
                        ? { status: 'dissolved', dissolved_at: new Date().toISOString() }
                        : { status: 'caretaker' })
                    .eq('nation_id', nationId)
                    .is('dissolved_at', null);
            } catch (e) { console.warn('Coalition table reconciliation failed:', e); }
        }

        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 15 * 1000);
        return result;
    }

    const { data } = await supabase
        .from('active_coalitions')
        .select('*')
        .eq('nation_id', nationId)
        .is('dissolved_at', null)
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (data) {
        await inferCaretakerStatus(data);
        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, data, 15 * 1000);
    }
    return data;
}


// ==================== POLICY COMPATIBILITY ====================

function getCompatiblePolicies(sector, allPolicies, faction, isAutocracy, excludePolicyIds = [], activePolicyIds = null) {
    const ideo1 = (faction?.ideology_value_1 || '').toUpperCase();
    const ideo2 = (faction?.ideology_value_2 || '').toUpperCase();
    const factionIdeos = [ideo1, ideo2].filter(Boolean);

    const factionOpposites = new Set(
        factionIdeos.map(fi => IDEOLOGY_OPPOSITES[fi]).filter(Boolean)
    );

    return allPolicies
        .filter(p => p.major_sector === sector && !excludePolicyIds.includes(p.id))
        .map(p => {
            const policyIdeos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
                ? p.ideologies.map(i => i.toUpperCase())
                : (p.ideology ? [p.ideology.toUpperCase()] : []);

            const isOpposed = factionIdeos.length > 0 &&
                policyIdeos.length > 0 &&
                policyIdeos.some(pi => factionOpposites.has(pi));

            let prerequisiteMissing = false;
            let prerequisiteName = null;
            if (p.requires_policy_id && activePolicyIds) {
                if (!activePolicyIds.has(p.requires_policy_id)) {
                    prerequisiteMissing = true;
                    const prereq = allPolicies.find(pp => pp.id === p.requires_policy_id);
                    prerequisiteName = prereq?.policy_name || 'Unknown Policy';
                }
            }

            // Structural policies that are already active laws cannot be enacted again
            const alreadyEnacted = activePolicyIds && activePolicyIds.has(p.id) && p.policy_type === 'structural';

            return { ...p, isOpposed, prerequisiteMissing, prerequisiteName, alreadyEnacted };
        });
}

// ────────── repeal-helper ──────────

/**
 * repeal-helper.js — shared repeal target resolution + reverse/delete executor
 */

function resolveRepealTargetLawId({ bill, article } = {}) {
    if (article?.repeal_active_law_id) {
        return article.repeal_active_law_id;
    }

    if (!bill) return null;
    if (bill.repeal_active_law_id) return bill.repeal_active_law_id;

    const fallbackArticle = (bill.bill_articles || []).find(a => a?.repeal_active_law_id);
    return fallbackArticle?.repeal_active_law_id || null;
}

async function repealActiveLaw({
    supabase,
    nation,
    currentTick,
    currentActiveLaws,
    reversePolicy,
    bill,
    article,
}) {
    const targetLawId = resolveRepealTargetLawId({ bill, article });

    if (!targetLawId) {
        return { success: false, reason: 'missing_target_id', targetLawId: null };
    }

    const targetLaw = (currentActiveLaws || []).find(l => l.id === targetLawId);
    if (!targetLaw) {
        return { success: false, reason: 'target_law_absent', targetLawId };
    }

    if (!targetLaw.policies) {
        return { success: false, reason: 'missing_target_policy', targetLawId };
    }

    // Save policy data before deleting the target law
    const targetPolicy = targetLaw.policies;
    const targetPassedTick = targetLaw.passed_tick;

    // Nullify ALL FK references to this active_law before deleting it.
    // Query for referencing rows first to confirm they exist, then clear them.
    const { data: referencingBills } = await supabase
        .from('bills')
        .select('id')
        .eq('repeal_active_law_id', targetLawId);

    if (referencingBills && referencingBills.length > 0) {
        const billIds = referencingBills.map(b => b.id);
        console.log(`[repealActiveLaw] Clearing ${billIds.length} bill FK refs to active_law ${targetLawId}: ${billIds.join(', ')}`);
        // Clear each referencing bill individually to ensure it takes effect
        for (const refBill of referencingBills) {
            const { error: clearErr } = await supabase
                .from('bills')
                .update({ repeal_active_law_id: null })
                .eq('id', refBill.id);
            if (clearErr) {
                console.error(`[repealActiveLaw] Failed to clear bill ${refBill.id} FK ref: ${clearErr.message}`);
            }
        }
    }

    const { data: referencingArticles } = await supabase
        .from('bill_articles')
        .select('id')
        .eq('repeal_active_law_id', targetLawId);

    if (referencingArticles && referencingArticles.length > 0) {
        const articleIds = referencingArticles.map(a => a.id);
        console.log(`[repealActiveLaw] Clearing ${articleIds.length} article FK refs to active_law ${targetLawId}: ${articleIds.join(', ')}`);
        for (const refArt of referencingArticles) {
            const { error: clearErr } = await supabase
                .from('bill_articles')
                .update({ repeal_active_law_id: null })
                .eq('id', refArt.id);
            if (clearErr) {
                console.error(`[repealActiveLaw] Failed to clear article ${refArt.id} FK ref: ${clearErr.message}`);
            }
        }
    }

    // Verify cleanup worked by checking if any references remain
    const { data: remainingRefs } = await supabase
        .from('bills')
        .select('id, repeal_active_law_id')
        .eq('repeal_active_law_id', targetLawId);
    if (remainingRefs && remainingRefs.length > 0) {
        console.error(`[repealActiveLaw] FK cleanup failed — ${remainingRefs.length} bills still reference active_law ${targetLawId}: ${JSON.stringify(remainingRefs)}`);
        return {
            success: false,
            reason: 'clear_bill_references_failed',
            targetLawId,
            error: `${remainingRefs.length} bills still reference this active_law after cleanup`,
        };
    }

    // Delete target law, then create reversal
    const { error: deleteError } = await supabase
        .from('active_laws')
        .delete()
        .eq('id', targetLawId);

    if (deleteError) {
        return {
            success: false,
            reason: 'delete_failed',
            targetLawId,
            error: deleteError.message,
        };
    }

    // Now create reversal effects (inserts a fresh row since the conflicting row is gone)
    await reversePolicy(supabase, nation, targetPolicy, targetPassedTick, currentTick);

    return {
        success: true,
        reason: 'repealed',
        targetLawId,
        policyName: targetPolicy.policy_name,
    };
}

// ────────── event-helpers ──────────


/**
 * Fire a bill-related system event (bill_passed / bill_failed / quorum_failed etc).
 * Wraps the common try/catch + placeholder boilerplate used 20+ times in bills.js & presidential.js.
 *
 * @param {object} supabase   - Supabase client
 * @param {string} triggerKey - e.g. 'bill_passed', 'bill_failed', 'quorum_failed'
 * @param {object} bill       - The bill row (needs .nation_id, .bill_name, .factions?.faction_name)
 * @param {object} opts       - Additional options
 * @param {number} opts.currentTick
 * @param {string} [opts.nationName]       - Nation name (falls back to 'Unknown')
 * @param {number|string} [opts.votesFor]
 * @param {number|string} [opts.votesAgainst]
 * @param {number|string} [opts.votesAbstain]
 * @param {string} [opts.articleCount]
 * @param {object} [opts.extra]            - Any extra placeholder key/values
 */
async function fireBillEvent(supabase, triggerKey, bill, opts = {}) {
    const placeholders = {
        nation: opts.nationName || 'Unknown',
        bill_name: opts.billNameOverride || bill.bill_name,
        sponsor: opts.sponsor || bill.factions?.faction_name || 'Unknown',
        votes_for: String(opts.votesFor ?? 0),
        votes_against: String(opts.votesAgainst ?? 0),
    };
    if (opts.votesAbstain !== undefined) {
        placeholders.votes_abstain = String(opts.votesAbstain);
    }
    if (opts.articleCount !== undefined) {
        placeholders.article_count = String(opts.articleCount);
    }
    if (opts.extra) {
        Object.assign(placeholders, opts.extra);
    }
    const nationId = opts.nationId || bill.nation_id;
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: triggerKey,
            p_nation_id: nationId,
            p_tick: opts.currentTick,
            p_placeholders: placeholders
        });
    } catch (e) { /* non-blocking */ }
    // Backfill effects_applied on the row the RPC just created (RPC leaves it null).
    // Match on nation + tick + event_name pattern, update the most recent row.
    try {
        const { data: rows } = await supabase.from('event_log')
            .select('id')
            .eq('nation_id', nationId)
            .eq('fired_at_tick', opts.currentTick)
            .ilike('event_name', `%${triggerKey.includes('passed') ? 'Passed' : triggerKey.includes('failed') ? 'Failed' : triggerKey}%`)
            .is('effects_applied', null)
            .order('created_at', { ascending: false })
            .limit(1);
        if (rows && rows.length > 0) {
            await supabase.from('event_log')
                .update({ effects_applied: placeholders })
                .eq('id', rows[0].id);
        }
    } catch (e) { /* non-blocking — effects_applied is a nice-to-have */ }
}

/**
 * Fire a system event to two nations simultaneously (e.g. bilateral aid/trade events).
 */
async function fireBilateralEvent(supabase, triggerKey, nationIdA, nationIdB, currentTick, placeholders) {
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: triggerKey, p_nation_id: nationIdA,
            p_tick: currentTick, p_placeholders: placeholders
        });
        await supabase.rpc('fire_system_event', {
            p_trigger_key: triggerKey, p_nation_id: nationIdB,
            p_tick: currentTick, p_placeholders: placeholders
        });
    } catch (e) { /* non-blocking */ }
}

// ────────── bills ──────────


// ==================== BILL SUPPORT ====================

function calculateBillSupport(billSupport, sponsorPartyId, allPartySeats) {
    const sponsorSeats = allPartySeats[sponsorPartyId] || 0;
    const acceptedSeats = (billSupport || [])
        .filter(s => s.stance === 'accept' && s.faction_id !== sponsorPartyId)
        .reduce((sum, s) => sum + (allPartySeats[s.faction_id] || s.seat_count || 0), 0);
    const totalSupport = sponsorSeats + acceptedSeats;
    const percent = Math.round((totalSupport / GAME_CONFIG.TOTAL_SEATS) * 100);
    return { sponsorSeats, acceptedSeats, totalSupport, percent };
}


// ==================== VOTE TALLY SYNC ====================

async function syncVoteTallies(supabase, billId) {
    const { data: allVotes } = await supabase
        .from('bill_support')
        .select('stance, seat_count')
        .eq('bill_id', billId);

    let votesFor = 0, votesAgainst = 0, votesAbstain = 0;
    (allVotes || []).forEach(v => {
        const st = v.stance === 'accept' ? 'yes' : v.stance === 'reject' ? 'no' : v.stance;
        if (st === 'yes')            votesFor += (v.seat_count || 0);
        else if (st === 'no')        votesAgainst += (v.seat_count || 0);
        else if (st === 'abstain')   votesAbstain += (v.seat_count || 0);
    });

    const { error } = await supabase.from('bills').update({
        votes_for: votesFor,
        votes_against: votesAgainst,
        votes_abstain: votesAbstain
    }).eq('id', billId);

    // Fallback: if votes_abstain column doesn't exist yet (PGRST204), update without it
    if (error && error.code === 'PGRST204' && error.message.includes('votes_abstain')) {
        console.warn('[syncVoteTallies] votes_abstain column not found, updating without it');
        await supabase.from('bills').update({
            votes_for: votesFor,
            votes_against: votesAgainst
        }).eq('id', billId);
    }

    return { votesFor, votesAgainst, votesAbstain };
}


// ==================== ENACTMENT APPROVAL IMPACT ====================

function calculateEnactmentApproval(articles, billSupport, sponsorId, factionIdeologies) {
    const APPROVAL_CAP_POSITIVE = 4;
    const APPROVAL_CAP_NEGATIVE = -10;
    const OPPOSITION_KICKER = -2;

    // Collect all ideology tags from bill articles
    const allTags = [];
    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;
        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);
        allTags.push(...ideos);
    }

    if (allTags.length === 0) return {};

    // Calculate net direction per axis from all article tags
    const axisNetScores = {};
    for (const tag of allTags) {
        const mapping = IDEOLOGY_TO_AXIS[tag];
        if (!mapping) continue;
        axisNetScores[mapping.axisKey] = (axisNetScores[mapping.axisKey] || 0) + mapping.direction;
    }

    if (Object.keys(axisNetScores).length === 0) return {};

    // Build voter map: factionId -> normalized stance
    const votes = {};
    votes[sponsorId] = 'yes';
    for (const s of (billSupport || [])) {
        if (s.faction_id !== sponsorId) {
            // Normalize: 'accept' → 'yes', 'reject' → 'no'
            const normalized = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            votes[s.faction_id] = normalized;
        }
    }

    const approvalDeltas = {};

    for (const [factionId, stance] of Object.entries(votes)) {
        if (stance !== 'yes' && stance !== 'no') continue;

        const factionAxes = factionIdeologies[factionId];
        if (!factionAxes) continue;

        // Sum net alignment: positive = bill aligns with faction, negative = opposes
        let netAlignment = 0;
        for (const [axisKey, netDirection] of Object.entries(axisNetScores)) {
            const factionScore = factionAxes[axisKey] || 0;
            // factionScore > 0 means faction leans "right" on this axis
            // netDirection > 0 means bill pushes "right" on this axis
            // Same sign = aligned
            if (factionScore !== 0 && netDirection !== 0) {
                netAlignment += Math.sign(factionScore) === Math.sign(netDirection)
                    ? Math.abs(netDirection)
                    : -Math.abs(netDirection);
            }
        }

        // YES vote: aligned bill = positive, opposed bill = negative
        // NO vote: inverted — opposed bill = positive, aligned bill = negative
        let delta = stance === 'yes' ? netAlignment : -netAlignment;

        // Apply opposition kicker: extra -1 when the result is negative
        if (delta < 0) {
            delta += OPPOSITION_KICKER;
        }

        // Cap the final value
        delta = Math.max(APPROVAL_CAP_NEGATIVE, Math.min(APPROVAL_CAP_POSITIVE, delta));
        approvalDeltas[factionId] = Math.round(delta * 10) / 10;
    }

    return approvalDeltas;
}

async function applyEnactmentApproval(supabase, nationId, approvalDeltas) {
    for (const [factionId, delta] of Object.entries(approvalDeltas)) {
        if (delta === 0) continue;
        await adjustMomentumAll(supabase, nationId, factionId, delta, 'bill:enactment');
    }
}


// ==================== SPONSOR BLOC PREFERENCE ON BILL PASSAGE ====================

/**
 * When the sponsor's bill passes, adjust preference & momentum with voter blocs
 * based on ideological alignment between the bill's articles and each bloc.
 *
 * - Aligned blocs (lean same direction as bill on any axis, ±10 from center):
 *   +3 preference_score, +3 momentum
 * - Opposed blocs (lean opposite direction on any axis):
 *   -4 preference_score
 *
 * @param {object} supabase
 * @param {object} bill - Full bill row with bill_articles (with policies)
 * @param {string} nationId
 */
async function applyBlocPreferenceOnPassage(supabase, bill, nationId) {
    const ALIGNED_PREF_BONUS = 6;
    const ALIGNED_MOMENTUM_BONUS = 6;
    const OPPOSED_PREF_PENALTY = -8;
    const AXIS_THRESHOLD = 10; // distance from center (50) to count as "having" an opinion

    const sponsorId = bill.proposed_by;
    if (!sponsorId) return;

    // 1. Extract ideology tags from bill articles and compute net direction per axis
    const axisDirections = {}; // { axisKey: net direction (+1 or -1) }
    for (const art of (bill.bill_articles || [])) {
        const p = art.policies || art;
        if (!p) continue;
        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);
        for (const tag of ideos) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (!mapping) continue;
            axisDirections[mapping.axisKey] = (axisDirections[mapping.axisKey] || 0) + mapping.direction;
        }
    }

    // Normalize to sign only
    for (const key of Object.keys(axisDirections)) {
        axisDirections[key] = Math.sign(axisDirections[key]);
    }

    const affectedAxes = Object.keys(axisDirections).filter(k => axisDirections[k] !== 0);
    if (affectedAxes.length === 0) return;

    // 2. Load voter blocs with axis scores
    const { data: voterBlocs } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (!voterBlocs || voterBlocs.length === 0) return;

    // 3. Classify each bloc as aligned, opposed, or neutral
    const alignedBlocIds = new Set();
    const opposedBlocIds = new Set();

    for (const bloc of voterBlocs) {
        let hasAligned = false;
        let hasOpposed = false;

        for (const axisKey of affectedAxes) {
            const blocScore = bloc['axis_' + axisKey] ?? 50;
            const deviation = blocScore - 50; // positive = leans right, negative = leans left
            if (Math.abs(deviation) < AXIS_THRESHOLD) continue; // neutral on this axis

            const blocDirection = Math.sign(deviation); // +1 = right, -1 = left
            const billDirection = axisDirections[axisKey];

            if (blocDirection === billDirection) {
                hasAligned = true;
            } else {
                hasOpposed = true;
            }
        }

        // Opposed takes priority — if a bloc opposes on any axis, they're opposed
        if (hasOpposed) {
            opposedBlocIds.add(bloc.id);
        } else if (hasAligned) {
            alignedBlocIds.add(bloc.id);
        }
    }

    // 4. Load sponsor's faction_bloc_approval rows for affected blocs
    const allAffectedBlocIds = [...alignedBlocIds, ...opposedBlocIds];
    if (allAffectedBlocIds.length === 0) return;

    const { data: approvalRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score, momentum')
        .eq('faction_id', sponsorId)
        .in('bloc_id', allAffectedBlocIds);

    // 5. Apply adjustments
    for (const row of (approvalRows || [])) {
        const oldPref = Math.round(row.preference_score ?? 50);
        const oldMom = Number(row.momentum ?? 0);

        if (alignedBlocIds.has(row.bloc_id)) {
            const newPref = Math.max(0, Math.min(100, oldPref + ALIGNED_PREF_BONUS));
            const newMom = Math.max(-50, Math.min(50, oldMom + ALIGNED_MOMENTUM_BONUS));
            await supabase.from('faction_bloc_approval')
                .update({ preference_score: newPref, momentum: newMom })
                .eq('id', row.id);
        } else if (opposedBlocIds.has(row.bloc_id)) {
            const newPref = Math.max(0, Math.min(100, oldPref + OPPOSED_PREF_PENALTY));
            await supabase.from('faction_bloc_approval')
                .update({ preference_score: newPref })
                .eq('id', row.id);
        }
    }

    // 6. Audit log for momentum changes on aligned blocs
    if (alignedBlocIds.size > 0) {
        const { data: shard } = await supabase
            .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        for (const blocId of alignedBlocIds) {
            try {
                await supabase.from('momentum_log').insert({
                    nation_id: nationId,
                    faction_id: sponsorId,
                    bloc_id: blocId,
                    amount: ALIGNED_MOMENTUM_BONUS,
                    source: 'bill:passage_aligned',
                    tick: shard?.current_tick || 0
                });
            } catch (_) { /* non-blocking audit log */ }
        }
    }

    const alignedNames = voterBlocs.filter(b => alignedBlocIds.has(b.id)).map(b => b.bloc_name);
    const opposedNames = voterBlocs.filter(b => opposedBlocIds.has(b.id)).map(b => b.bloc_name);
    console.log(`[BillPassage] Sponsor ${sponsorId}: +${ALIGNED_PREF_BONUS} pref/mom with aligned blocs [${alignedNames.join(', ')}], ${OPPOSED_PREF_PENALTY} pref with opposed blocs [${opposedNames.join(', ')}]`);
}


// ==================== NO-VOTE PENALTY ====================

/**
 * Penalize factions that did not cast any vote (YES/NO/ABSTAIN) on a bill.
 * - Momentum: lose [1d3+1] (2-4) across all blocs
 * - Preference: -2 preference_score with every voter bloc whose ideology axis score
 *   is at least ±10 from center (≤40 or ≥60) on any axis present in the bill.
 *
 * @param {object} supabase
 * @param {object} bill - Full bill row with bill_articles (with policies) and bill_support
 * @param {string} nationId
 */
async function applyNoVotePenalty(supabase, bill, nationId) {
    const PREFERENCE_PENALTY = -2;
    const AXIS_THRESHOLD = 10; // distance from center (50) to count as "having" an ideology

    // 1. Get all party factions in this nation
    const { data: allFactions } = await supabase
        .from('factions')
        .select('id, faction_name')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (!allFactions || allFactions.length === 0) return [];

    // 2. Determine which factions voted (have a bill_support row)
    const votedFactionIds = new Set();
    // Sponsor always counts as having voted (they implicitly support their own bill)
    if (bill.proposed_by) votedFactionIds.add(bill.proposed_by);
    for (const s of (bill.bill_support || [])) {
        if (s.faction_id) votedFactionIds.add(s.faction_id);
    }

    // 3. Find non-voters
    const nonVoters = allFactions.filter(f => !votedFactionIds.has(f.id));
    if (nonVoters.length === 0) return [];

    // 4. Extract ideology tags from bill articles
    const allTags = [];
    for (const art of (bill.bill_articles || [])) {
        const p = art.policies || art;
        if (!p) continue;
        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);
        allTags.push(...ideos);
    }

    // Map tags to unique axis keys
    const affectedAxes = new Set();
    for (const tag of allTags) {
        const mapping = IDEOLOGY_TO_AXIS[tag];
        if (mapping) affectedAxes.add(mapping.axisKey);
    }

    // 5. Load voter blocs for this nation (need axis scores to filter)
    const { data: voterBlocs } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nationId)
        .eq('is_active', true);

    // 6. Determine which blocs are affected (lean ±10 from center on any affected axis)
    const affectedBlocIds = new Set();
    for (const bloc of (voterBlocs || [])) {
        for (const axisKey of affectedAxes) {
            const score = bloc['axis_' + axisKey] ?? 50;
            if (Math.abs(score - 50) >= AXIS_THRESHOLD) {
                affectedBlocIds.add(bloc.id);
                break; // one matching axis is enough
            }
        }
    }

    // 7. Apply penalties to each non-voter
    const penalized = [];
    for (const faction of nonVoters) {
        // Momentum: lose 1d3+1 (2-4) across ALL blocs
        const momentumLoss = -(Math.floor(Math.random() * 3) + 2);
        await adjustMomentumAll(supabase, nationId, faction.id, momentumLoss, 'penalty:no_vote');

        // Preference: -2 preference_score on matched blocs only
        if (affectedBlocIds.size > 0) {
            const { data: blocRows } = await supabase
                .from('faction_bloc_approval')
                .select('id, bloc_id, preference_score')
                .eq('faction_id', faction.id)
                .in('bloc_id', [...affectedBlocIds]);

            for (const row of (blocRows || [])) {
                const newPref = Math.round(Math.max(0, Math.min(100, (row.preference_score ?? 50) + PREFERENCE_PENALTY)));
                await supabase.from('faction_bloc_approval')
                    .update({ preference_score: newPref })
                    .eq('id', row.id);
            }
        }

        penalized.push({
            factionId: faction.id,
            factionName: faction.faction_name,
            momentumLoss,
            preferencePenalty: affectedBlocIds.size > 0 ? PREFERENCE_PENALTY : 0,
            affectedBlocCount: affectedBlocIds.size
        });
    }

    return penalized;
}


// ==================== STATIC IDEOLOGY PENALTY (LEGACY) ====================

function calculateIdeologyPenalty(stage, opposedCount, polarization) {
    if (opposedCount === 0) return 0;

    const pol = polarization || 0;
    let penalty = 0;

    if (stage === 'floor') {
        if (pol >= 50) {
            penalty = -1 * opposedCount;
        } else {
            penalty = -1 * Math.floor(opposedCount / 2);
        }
    } else if (stage === 'passed') {
        penalty = -1 * opposedCount;
        if (pol >= 75) {
            penalty += -2 * opposedCount;
        }
    }

    return penalty;
}


// ==================== BLOC APPROVAL HELPERS ====================

/**
 * Recalculate derived overall approval_rating for a faction from
 * faction_bloc_approval preference_scores weighted by voter_blocs population_weight.
 * Updates the factions.approval_rating cache column.
 */
async function recalcDerivedApproval(supabase, factionId, blocRows) {
    if (!blocRows) {
        const { data } = await supabase
            .from('faction_bloc_approval')
            .select('bloc_id, preference_score')
            .eq('faction_id', factionId);
        blocRows = data || [];
    }
    if (blocRows.length === 0) return null;

    const blocIds = blocRows.map(r => r.bloc_id);
    const { data: blocs } = await supabase
        .from('voter_blocs')
        .select('id, population_weight')
        .in('id', blocIds);
    if (!blocs || blocs.length === 0) return null;

    const weightMap = {};
    for (const b of blocs) weightMap[b.id] = parseFloat(b.population_weight) || 0;

    let weightedSum = 0;
    for (const row of blocRows) {
        const score = row.preference_score ?? 50;
        weightedSum += score * (weightMap[row.bloc_id] || 0);
    }
    const derived = Math.round(weightedSum / 100);

    await supabase.from('factions')
        .update({ approval_rating: derived })
        .eq('id', factionId);

    return derived;
}

/**
 * Ensures faction_bloc_approval rows exist for a given faction.
 * If none exist, seeds them with default preference_score of 40 for all active blocs.
 * Returns the (possibly newly created) bloc approval rows, or null on failure.
 */
async function ensureBlocApprovals(supabase, factionId, nationId) {
    // Note: faction_ideology row should exist from party creation.
    // If missing, three-pillar recalc will treat the party as centrist — no zero-row creation here.

    const { data: existing, error: checkErr } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score')
        .eq('faction_id', factionId);

    if (checkErr) {
        console.error('[ensureBlocApprovals] Check failed:', checkErr.message);
        return null;
    }

    if (existing && existing.length > 0) {
        return existing;
    }

    const { data: blocs, error: blocErr } = await supabase
        .from('voter_blocs')
        .select('id')
        .eq('nation_id', nationId)
        .eq('is_active', true);

    if (blocErr || !blocs || blocs.length === 0) {
        console.warn('[ensureBlocApprovals] No active voter blocs found for nation', nationId);
        return null;
    }

    const rows = blocs.map(bloc => ({
        faction_id: factionId,
        bloc_id: bloc.id,
        preference_score: 40
    }));

    const { error: upsertErr } = await supabase
        .from('faction_bloc_approval')
        .upsert(rows, { onConflict: 'faction_id,bloc_id', ignoreDuplicates: true });

    if (upsertErr) {
        console.error('[ensureBlocApprovals] Upsert failed:', upsertErr.message);
        return null;
    }

    const { data: newRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score')
        .eq('faction_id', factionId);

    console.log(`[ensureBlocApprovals] Seeded ${rows.length} bloc approval rows for faction ${factionId}`);
    return newRows;
}


// ==================== IDEOLOGY SHIFT PROCESSOR ====================

async function processIdeologyShifts(supabase, nationId, resolutions, currentTick) {
    if (!resolutions || resolutions.length === 0) return;

    // Only process bills with terminal resolutions — skip deferred bills
    // to avoid double-counting when they resolve on a subsequent tick.
    const terminalResolutions = resolutions.filter(r => r.result !== 'deferred');
    if (terminalResolutions.length === 0) return;

    const billIds = terminalResolutions.map(r => r.billId);

    const { data: bills } = await supabase
        .from('bills')
        .select('id, proposed_by, bill_type, bill_articles(*, policies(*)), bill_support(faction_id, stance)')
        .in('id', billIds);

    if (!bills || bills.length === 0) return;

    // Only legislative bills affect ideology
    const legislativeBills = bills.filter(b =>
        !['no_confidence', 'confirmation', 'minister_confirmation', 'foundational', 'veto_override'].includes(b.bill_type)
    );
    if (legislativeBills.length === 0) return;

    // Include 'president_desk' as passed — these bills passed the floor vote
    // and are awaiting presidential action; the passage bonus should apply now
    // since processIdeologyShifts won't run again when the president signs.
    const passedBillIds = new Set(terminalResolutions.filter(r => r.result === 'passed' || r.result === 'president_desk').map(r => r.billId));

    // Accumulate shifts: { factionId: { axisKey: totalShift } }
    const factionShifts = {};

    function addShift(factionId, axisKey, amount) {
        if (!factionShifts[factionId]) factionShifts[factionId] = {};
        factionShifts[factionId][axisKey] = (factionShifts[factionId][axisKey] || 0) + amount;
    }

    for (const bill of legislativeBills) {
        // Collect ideology tags from articles (per-article, with duplicates)
        const tags = [];
        for (const art of (bill.bill_articles || [])) {
            const p = art.policies || art;
            if (!p) continue;
            const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
                ? p.ideologies.map(i => i.toUpperCase())
                : (p.ideology ? [p.ideology.toUpperCase()] : []);
            tags.push(...ideos);
        }
        if (tags.length === 0) continue;

        const isPassed = passedBillIds.has(bill.id);

        // Build YES voter set (normalize committee stances)
        const yesVoters = new Set();
        for (const s of (bill.bill_support || [])) {
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') yesVoters.add(s.faction_id);
        }
        // Sponsor always counts as YES
        if (bill.proposed_by) yesVoters.add(bill.proposed_by);

        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (!mapping) continue;

            // +2 for proposing (sponsor only)
            if (bill.proposed_by) {
                addShift(bill.proposed_by, mapping.axisKey, 2 * mapping.direction);
            }

            // +4 for voting YES (all YES voters including sponsor)
            for (const factionId of yesVoters) {
                addShift(factionId, mapping.axisKey, 4 * mapping.direction);
            }

            // +4 if bill passed (YES voters only)
            if (isPassed) {
                for (const factionId of yesVoters) {
                    addShift(factionId, mapping.axisKey, 4 * mapping.direction);
                }
            }
        }
    }

    // Apply accumulated shifts to faction_ideology
    const historyRows = [];

    for (const [factionId, axisShifts] of Object.entries(factionShifts)) {
        let ideologyRow = await loadFactionIdeology(supabase, factionId);
        if (ideologyRow?._error || !ideologyRow) {
            console.warn(`[processIdeologyShifts] Skipping faction ${factionId}: ${ideologyRow?._error ? 'DB error' : 'no ideology row'}`);
            continue;
        }

        const currentScores = extractAxisScores(ideologyRow);
        const updateObj = {};
        let hasChanges = false;

        for (const [axisKey, shift] of Object.entries(axisShifts)) {
            const oldScore = currentScores[axisKey] || 0;
            const newScore = Math.max(-100, Math.min(100, oldScore + shift));
            if (newScore !== oldScore) {
                updateObj[axisKey] = newScore;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            await supabase.from('faction_ideology').update(updateObj).eq('faction_id', factionId);

            // Record snapshot for ideology_history
            if (typeof currentTick === 'number') {
                const finalScores = { ...currentScores, ...updateObj };
                historyRows.push({
                    faction_id: factionId,
                    nation_id: nationId,
                    tick: currentTick,
                    liberty_equality: finalScores.liberty_equality || 0,
                    tradition_progress: finalScores.tradition_progress || 0,
                    security_freedom: finalScores.security_freedom || 0,
                    globalism_nationalism: finalScores.globalism_nationalism || 0,
                    individualism_collectivism: finalScores.individualism_collectivism || 0
                });
            }
        }
    }

    // Batch insert ideology history snapshots
    if (historyRows.length > 0) {
        const { error: histErr } = await supabase
            .from('ideology_history')
            .insert(historyRows);
        if (histErr) {
            console.warn('[processIdeologyShifts] ideology_history insert failed (table may not exist yet):', histErr.message);
        }
    }
}


// ==================== BILL RESOLUTION ENGINE ====================

/**
 * Returns true if this bill type uses quorum + simple majority (YES > NO of
 * votes cast) rather than an absolute seat threshold.
 *
 * Absolute-threshold types (return false):
 *   - foundational / veto_override: 67% of total seats
 *   - no_confidence / impeachment_motion: 50%+1 of total seats
 *   - impeachment_conviction: 67% of total seats
 */
function isSimpleMajorityBill(billType) {
    return billType !== 'foundational'
        && billType !== 'default_resolution'
        && billType !== 'veto_override'
        && billType !== 'no_confidence'
        && billType !== 'impeachment_motion'
        && billType !== 'impeachment_conviction';
}

/**
 * Get the number of YES seats required for a bill to pass.
 *
 * For supermajority bills (foundational, veto_override) the threshold is a
 * fixed fraction of TOTAL_SEATS.
 *
 * For all other bills the rule is simple majority: YES > NO.  When
 * `votesAgainst` is provided, we return `votesAgainst + 1` so the display
 * updates dynamically as votes come in.  Without it we fall back to the
 * absolute half-chamber number for backward compat.
 */
function getRequiredSeats(billType, votesAgainst) {
    if (billType === 'foundational' || billType === 'default_resolution' || billType === 'impeachment_conviction')
        return Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.SUPERMAJORITY_THRESHOLD);
    if (billType === 'veto_override')
        return Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD);
    if (billType === 'no_confidence' || billType === 'impeachment_motion')
        return Math.floor(GAME_CONFIG.TOTAL_SEATS / 2) + 1;
    // Ordinary bills: simple majority of votes cast
    if (votesAgainst != null) return votesAgainst + 1;
    return GAME_CONFIG.MAJORITY_SEATS;
}

/**
 * Evaluate the current state of a bill vote using the two-step quorum + majority system.
 *
 * Returns an object describing the vote status:
 *   { status, reason, quorumMet, quorumNeeded, quorumCurrent, thresholdNeeded, ... }
 *
 * Status values:
 *   'will_pass'      — mathematically locked in, cannot change
 *   'will_fail'      — mathematically impossible to pass
 *   'passing'        — quorum met, yes currently leads, but not locked
 *   'failing'        — quorum met, no currently leads, but not locked
 *   'tied'           — quorum met, yes === no
 *   'quorum_not_met' — not enough participation yet
 *   'pending'        — for absolute-threshold bills, in progress
 *
 * @param {object} bill - Bill with votes_for, votes_against, votes_abstain, bill_type
 * @param {number} totalSeats - Total parliamentary seats (from nation)
 */
function evaluateBillVote(bill, totalSeats) {
    const forSeats = bill.votes_for || 0;
    const againstSeats = bill.votes_against || 0;
    const abstainSeats = bill.votes_abstain || 0;
    const participating = forSeats + againstSeats + abstainSeats;
    const undeclaredSeats = totalSeats - participating;
    const quorumThreshold = Math.ceil(totalSeats * GAME_CONFIG.QUORUM_THRESHOLD);

    // ── Foundational / default_resolution / veto_override / impeachment_conviction: 67% absolute supermajority, no quorum ──
    if (bill.bill_type === 'foundational' || bill.bill_type === 'default_resolution' || bill.bill_type === 'veto_override' || bill.bill_type === 'impeachment_conviction') {
        const threshold = Math.ceil(totalSeats * 2 / 3);
        if (forSeats >= threshold) {
            return { status: 'will_pass', reason: 'supermajority_reached', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        if (forSeats + undeclaredSeats < threshold) {
            return { status: 'will_fail', reason: 'supermajority_impossible', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        return { status: 'pending', reason: 'supermajority_in_progress', thresholdNeeded: threshold, neededFor: threshold - forSeats, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }

    // ── Impeachment motion / confidence: 50%+1 absolute majority, no quorum ──
    if (bill.bill_type === 'impeachment_motion' || bill.bill_type === 'no_confidence') {
        const threshold = Math.floor(totalSeats / 2) + 1;
        if (forSeats >= threshold) {
            return { status: 'will_pass', reason: 'absolute_majority_reached', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        if (forSeats + undeclaredSeats < threshold) {
            return { status: 'will_fail', reason: 'absolute_majority_impossible', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        return { status: 'pending', reason: 'absolute_majority_in_progress', thresholdNeeded: threshold, neededFor: threshold - forSeats, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }

    // ── Ordinary bills: quorum (50% participation) + simple majority of votes cast ──
    const quorumMet = participating >= quorumThreshold;

    if (!quorumMet) {
        // Check if quorum is even possible
        if (participating + undeclaredSeats < quorumThreshold) {
            return { status: 'will_fail', reason: 'quorum_impossible', quorumMet: false, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        return { status: 'quorum_not_met', reason: 'awaiting_quorum', quorumMet: false, quorumThreshold, quorumCurrent: participating, quorumNeeded: quorumThreshold - participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }

    // Quorum met — check simple majority of votes cast (yes vs no, abstain excluded)
    // "Will Pass": yes > no AND yes > no + all_undeclared (locked)
    if (forSeats > againstSeats + undeclaredSeats) {
        return { status: 'will_pass', reason: 'majority_locked', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }
    // "Will Fail": against >= for + all_undeclared (locked) — even all undeclared voting yes can't flip it
    if (againstSeats >= forSeats + undeclaredSeats) {
        return { status: 'will_fail', reason: 'defeat_locked', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }
    // Not locked — show current leader
    if (forSeats > againstSeats) {
        return { status: 'passing', reason: 'majority_current', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }
    if (againstSeats > forSeats) {
        return { status: 'failing', reason: 'minority_current', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }
    // Exact tie: bill will fail unless more yes votes are cast
    return { status: 'tied', reason: 'tied_votes', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
}

/**
 * Resolve a bill vote at deadline (or early resolution).
 * Returns: 'passed', 'failed', 'failed_no_quorum', or 'deferred'.
 *
 * @param {object} bill - Bill row with votes_for, votes_against, votes_abstain, bill_type, quorum_failures
 * @param {number} totalSeats - Total parliamentary seats
 */
function resolveBillVote(bill, totalSeats) {
    const forSeats = bill.votes_for || 0;
    const againstSeats = bill.votes_against || 0;
    const abstainSeats = bill.votes_abstain || 0;
    const participating = forSeats + againstSeats + abstainSeats;
    const quorumThreshold = Math.ceil(totalSeats * GAME_CONFIG.QUORUM_THRESHOLD);

    // Foundational / default_resolution / veto_override / impeachment_conviction: 67% absolute supermajority
    if (bill.bill_type === 'foundational' || bill.bill_type === 'default_resolution' || bill.bill_type === 'veto_override' || bill.bill_type === 'impeachment_conviction') {
        const threshold = Math.ceil(totalSeats * 2 / 3);
        return forSeats >= threshold ? 'passed' : 'failed';
    }

    // No-confidence / impeachment_motion: 50%+1 absolute majority
    if (bill.bill_type === 'no_confidence' || bill.bill_type === 'impeachment_motion') {
        const threshold = Math.floor(totalSeats / 2) + 1;
        return forSeats >= threshold ? 'passed' : 'failed';
    }

    // Ordinary bills: quorum + simple majority
    if (participating < quorumThreshold) {
        if ((bill.quorum_failures || 0) >= 1) {
            return 'failed_no_quorum'; // second failure, bill dies
        }
        return 'deferred'; // first failure, extend by 1 tick
    }

    // All abstain edge case: 0 yes, 0 no → bill fails (need affirmative support)
    if (forSeats === 0 && againstSeats === 0) return 'failed';

    // Ties fail — status quo wins
    return forSeats > againstSeats ? 'passed' : 'failed';
}

/**
 * Auto-expire committee bills that have been sitting for COMMITTEE_EXPIRY_TICKS
 * without being sent to the floor. Sets status to 'failed'.
 */
async function expireCommitteeBills(supabase, nationId, currentTick) {
    const deadline = currentTick - GAME_CONFIG.COMMITTEE_EXPIRY_TICKS;
    const { data: expired, error } = await supabase
        .from('bills')
        .select('id, bill_name, proposed_by')
        .eq('nation_id', nationId)
        .eq('status', 'committee')
        .neq('bill_type', 'default_resolution')  // default resolutions skip committee
        .lte('proposed_tick', deadline);

    if (error || !expired || expired.length === 0) return [];

    const results = [];
    for (const bill of expired) {
        await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id);
        const { data: nation } = await supabase.from('nations').select('name').eq('id', nationId).single();
        await supabase.rpc('insert_news_event', {
            p_nation_id: nationId,
            p_trigger_key: 'bill_failed',
            p_tick: currentTick,
            p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, reason: 'expired in committee' }
        });
        console.log(`[expireCommitteeBills] ${bill.bill_name} expired in committee after ${GAME_CONFIG.COMMITTEE_EXPIRY_TICKS} ticks`);
        results.push({ billId: bill.id, billName: bill.bill_name, result: 'expired_committee' });
    }
    return results;
}

/**
 * Check all active floor bills for early majority (for or against).
 * If a definitive majority is detected, lock the outcome and shorten
 * voting_ends_tick to currentTick so the bill resolves immediately
 * in the same tick via resolveExpiredVotes.
 *
 * Must run BEFORE resolveExpiredVotes each tick.
 */
async function checkEarlyMajority(supabase, nationId) {
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    // Bills still voting, not yet locked, not yet expired
    const { data: activeBills, error } = await supabase
        .from('bills')
        .select('id, bill_name, bill_type, voting_ends_tick, proposed_tick, floor_tick, bill_support(faction_id, stance, seat_count)')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .is('early_resolution_status', null)
        .or(`voting_ends_tick.gt.${currentTick},voting_ends_tick.is.null`);

    console.log(`[checkEarlyMajority] nation=${nationId} currentTick=${currentTick} found ${activeBills?.length ?? 0} active floor bills (error=${error?.message || 'none'})`);

    if (error || !activeBills || activeBills.length === 0) return [];

    // Use the actual sum of faction seats as the voting denominator, not
    // total_seats.  In autocracies (and after seat changes) the nation's
    // total_seats can exceed the seats actually held by factions — those
    // vacant/unaligned seats can never vote, so including them would inflate
    // the "undeclared" count and break quorum & math-lock checks.
    const { data: factionRows } = await supabase
        .from('factions')
        .select('seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');
    const factionSeatSum = (factionRows || []).reduce((sum, f) => sum + (f.seats || 0), 0);
    const effectiveTotalSeats = Math.min(GAME_CONFIG.TOTAL_SEATS, Math.max(factionSeatSum, 1));

    const quorumSeats = Math.ceil(effectiveTotalSeats * GAME_CONFIG.QUORUM_THRESHOLD);
    const results = [];

    // Check for emergency minority government penalty (once per nation per tick)
    const earlyCoalition = await fetchActiveCoalition(supabase, nationId);
    const minorityPenalty = earlyCoalition?.formation_type === 'emergency_minority';

    for (const bill of activeBills) {
        let yesSeats = 0, noSeats = 0, abstainSeats = 0;
        (bill.bill_support || []).forEach(s => {
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') yesSeats += (s.seat_count || 0);
            else if (stance === 'no') noSeats += (s.seat_count || 0);
            else if (stance === 'abstain') abstainSeats += (s.seat_count || 0);
        });

        // Apply emergency minority penalty to effective YES votes
        let effectiveYes = yesSeats;
        if (minorityPenalty) {
            effectiveYes = Math.floor(yesSeats * 0.8);
        }

        let earlyStatus = null;
        const participating = yesSeats + noSeats + abstainSeats;
        const undeclaredSeats = Math.max(0, effectiveTotalSeats - participating);

        // ── Check 1: Mathematical lock (outcome impossible to change) ──
        if (bill.bill_type === 'foundational' || bill.bill_type === 'default_resolution' || bill.bill_type === 'veto_override' || bill.bill_type === 'impeachment_conviction') {
            // Absolute supermajority: 67% of effective total seats, no quorum
            // Must use effectiveTotalSeats (not GAME_CONFIG.TOTAL_SEATS) to match resolveBillVote
            const requiredSeats = (bill.bill_type === 'veto_override')
                ? Math.ceil(effectiveTotalSeats * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD)
                : Math.ceil(effectiveTotalSeats * GAME_CONFIG.SUPERMAJORITY_THRESHOLD);
            if (effectiveYes >= requiredSeats) {
                earlyStatus = 'majority_reached';
            } else if (effectiveYes + undeclaredSeats < requiredSeats) {
                earlyStatus = 'majority_opposed';
            }
        } else if (bill.bill_type === 'no_confidence' || bill.bill_type === 'impeachment_motion') {
            // Absolute majority: 50%+1 of total seats, no quorum
            const threshold = Math.floor(effectiveTotalSeats / 2) + 1;
            if (effectiveYes >= threshold) {
                earlyStatus = 'majority_reached';
            } else if (effectiveYes + undeclaredSeats < threshold) {
                earlyStatus = 'majority_opposed';
            }
        } else {
            // Ordinary bill: quorum (50% participation) + simple majority of votes cast
            // Math-lock: YES wins even if all undeclared vote NO
            if (effectiveYes > noSeats + undeclaredSeats) {
                earlyStatus = 'majority_reached';
            // Math-lock: NO wins/ties even if all undeclared vote YES
            } else if (minorityPenalty
                ? noSeats >= Math.floor((yesSeats + undeclaredSeats) * 0.8)
                : noSeats >= yesSeats + undeclaredSeats) {
                earlyStatus = 'majority_opposed';
            }
        }

        // ── Check 2: Quorum-based early resolution (ordinary bills only) ──
        // If not math-locked but quorum is met and a clear majority exists,
        // trigger early resolution with a 1-tick grace period.
        if (!earlyStatus && participating >= quorumSeats) {
            if (bill.bill_type !== 'foundational' && bill.bill_type !== 'default_resolution'
                && bill.bill_type !== 'veto_override'
                && bill.bill_type !== 'no_confidence' && bill.bill_type !== 'impeachment_motion'
                && bill.bill_type !== 'impeachment_conviction') {
                // Ordinary bill: simple majority of votes cast
                if (effectiveYes > noSeats) {
                    earlyStatus = 'quorum_reached';
                } else if (noSeats > effectiveYes) {
                    earlyStatus = 'quorum_opposed';
                }
                // Exact tie at quorum: wait for more votes or deadline
            }
        }

        if (earlyStatus) {
            // Resolve immediately this tick (no grace period)
            const resolveAtTick = Math.min(currentTick, bill.voting_ends_tick);

            await supabase.from('bills').update({
                early_resolution_status: earlyStatus,
                early_resolution_tick: currentTick,
                voting_ends_tick: resolveAtTick
            }).eq('id', bill.id);

            const resolveType = earlyStatus.startsWith('quorum') ? 'QUORUM' : 'MATH-LOCK';
            console.log(`[checkEarlyMajority] ${bill.bill_name}: ${earlyStatus} [${resolveType}] (YES=${yesSeats}, NO=${noSeats}, quorum=${quorumSeats}, voted=${participating}, effectiveTotal=${effectiveTotalSeats}, configTotal=${GAME_CONFIG.TOTAL_SEATS}). Resolves tick ${resolveAtTick}`);
            results.push({ billId: bill.id, billName: bill.bill_name, status: earlyStatus, yesSeats, noSeats });
        }
    }

    return results;
}

async function resolveExpiredVotes(supabase, nationId) {
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    const { data: expiredBills, error } = await supabase
        .from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .lte('voting_ends_tick', currentTick);

    console.log(`[resolveExpiredVotes] nation=${nationId} currentTick=${currentTick} query returned ${expiredBills?.length ?? 0} bills (error=${error?.message || 'none'})`);
    if (expiredBills && expiredBills.length > 0) {
        for (const b of expiredBills) {
            console.log(`[resolveExpiredVotes]   bill=${b.id} "${b.bill_name}" type=${b.bill_type} voting_ends=${b.voting_ends_tick} early_status=${b.early_resolution_status} support_count=${(b.bill_support||[]).length}`);
        }
    }

    if (error || !expiredBills || expiredBills.length === 0) return [];

    const results = [];

    // Compute the actual sum of faction-held seats — only these can vote.
    // In autocracies (and after seat changes) total_seats can exceed the
    // seats held by factions; including vacant/unaligned seats inflates
    // quorum and makes bills impossible to pass.
    const { data: factionRowsForResolve } = await supabase
        .from('factions')
        .select('seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');
    const resolveFactionSeatSum = (factionRowsForResolve || []).reduce((sum, f) => sum + (f.seats || 0), 0);

    for (const bill of expiredBills) {
      try {
        const { data: nation } = await supabase
            .from('nations')
            .select('name, government_type, total_seats')
            .eq('id', bill.nation_id)
            .single();
        const nominalTotalSeats = nation?.total_seats || GAME_CONFIG.TOTAL_SEATS;
        const totalSeats = Math.min(nominalTotalSeats, Math.max(resolveFactionSeatSum, 1));
        let votesFor = 0, votesAgainst = 0, votesAbstain = 0;

        (bill.bill_support || []).forEach(s => {
            // Normalize committee stances: 'accept' → 'yes', 'reject' → 'no'
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') votesFor += (s.seat_count || 0);
            else if (stance === 'no') votesAgainst += (s.seat_count || 0);
            else if (stance === 'abstain') votesAbstain += (s.seat_count || 0);
        });

        // Emergency minority government penalty: -20% effective YES votes
        const activeCoalition = await fetchActiveCoalition(supabase, bill.nation_id);
        let effectiveVotesFor = votesFor;
        if (activeCoalition?.formation_type === 'emergency_minority') {
            effectiveVotesFor = Math.floor(votesFor * 0.8);
            console.log(`[MinorityPenalty] ${bill.bill_name}: votesFor ${votesFor} → ${effectiveVotesFor} (emergency minority -20%)`);
        }

        // Determine pass/fail using new quorum + majority system
        // Build a bill-like object with effective votes for the resolve function
        const resolveBill = {
            ...bill,
            votes_for: effectiveVotesFor,
            votes_against: votesAgainst,
            votes_abstain: votesAbstain,
            quorum_failures: bill.quorum_failures || 0
        };
        const resolution = resolveBillVote(resolveBill, totalSeats);
        console.log(`[resolveExpiredVotes] bill=${bill.id} votes yes=${votesFor} no=${votesAgainst} abstain=${votesAbstain} effective_yes=${effectiveVotesFor} totalSeats=${totalSeats} resolution=${resolution}`);

        // Handle quorum deferral: extend vote by 1 tick
        if (resolution === 'deferred') {
            const newDeadline = currentTick + 1;
            await supabase.from('bills').update({
                quorum_failures: (bill.quorum_failures || 0) + 1,
                voting_ends_tick: newDeadline
            }).eq('id', bill.id);

            // Notify all party leaders about quorum failure
            const quorumThreshold = Math.ceil(totalSeats * GAME_CONFIG.QUORUM_THRESHOLD);
            const participating = votesFor + votesAgainst + votesAbstain;
            try {
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'quorum_failed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        bill_name: bill.bill_name,
                        participating: String(participating),
                        quorum_needed: String(quorumThreshold),
                        nation: nation?.name || 'Unknown'
                    }
                });
            } catch (e) { /* non-blocking if event key doesn't exist yet */ }

            console.log(`[resolveExpiredVotes] ${bill.bill_name}: quorum not met (${participating}/${quorumThreshold}), deferred to tick ${newDeadline}`);
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'deferred', votesFor, votesAgainst, votesAbstain, type: bill.bill_type });
            continue;
        }

        // Handle second quorum failure: bill dies
        if (resolution === 'failed_no_quorum') {
            await failBill(supabase, bill);
            await syncFailedMinisterConfirmationBill(supabase, bill);
            await syncFailedAmbassadorConfirmationBill(supabase, bill);
            const quorumThreshold = Math.ceil(totalSeats * GAME_CONFIG.QUORUM_THRESHOLD);
            const participating = votesFor + votesAgainst + votesAbstain;
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, extra: { reason: `quorum not met after two attempts (${participating}/${quorumThreshold} participating)` } });
            console.log(`[resolveExpiredVotes] ${bill.bill_name}: quorum failed twice (${participating}/${quorumThreshold}), bill dies`);
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_no_quorum', votesFor, votesAgainst, votesAbstain, type: bill.bill_type });
            continue;
        }

        let passed = resolution === 'passed';
        const isNoConfidence = bill.bill_type === 'no_confidence';
        const isFoundational = bill.bill_type === 'foundational';

        if (isNoConfidence) {
            // Handle no-confidence resolution (pass or fail)
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
            } else {
                await failBill(supabase, bill);
            }
            await resolveNoConfidence(supabase, bill, passed, votesFor, votesAgainst, currentTick);
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'no_confidence', earlyResolution: bill.early_resolution_status || null });
        } else if (isFoundational) {
            // Handle foundational bill resolution (electoral makeup, etc.)
            let enacted = false;
            if (passed) {
                enacted = await enactFoundationalBill(supabase, bill, currentTick);
            }
            if (!passed || !enacted) {
                if (!enacted && passed) {
                    // enactFoundationalBill already marked it 'failed' internally
                    console.warn(`[resolveExpiredVotes] Foundational bill ${bill.id} had enough votes but enactment failed (invalid proposed_seats).`);
                } else {
                    await failBill(supabase, bill);
                }
            }
            await fireBillEvent(supabase, enacted ? 'bill_passed' : 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
            results.push({ billId: bill.id, billName: bill.bill_name, result: enacted ? 'passed' : 'failed', votesFor, votesAgainst, type: 'foundational', earlyResolution: bill.early_resolution_status || null });
        } else if (bill.bill_type === 'default_resolution') {
            // ── Sovereign Default Resolution ──
            // Full enactment logic lives in handler-template.ts (enactSovereignDefault /
            // handleFailedDefaultResolution) because it needs cross-nation contagion
            // and tick-only helpers. The typeof guard ensures client-side callers
            // (admin.html, laws.html) don't crash — the server tick handles consequences.
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                if (typeof enactSovereignDefault === 'function') {
                    try {
                        await enactSovereignDefault(supabase, bill, currentTick);
                    } catch (defaultErr) {
                        console.error(`[resolveExpiredVotes] enactSovereignDefault failed for bill ${bill.id}:`, defaultErr);
                    }
                }
            } else {
                await failBill(supabase, bill);
                if (typeof handleFailedDefaultResolution === 'function') {
                    try {
                        await handleFailedDefaultResolution(supabase, bill, currentTick);
                    } catch (failErr) {
                        console.error(`[resolveExpiredVotes] handleFailedDefaultResolution failed for bill ${bill.id}:`, failErr);
                    }
                }
            }
            await fireBillEvent(supabase, passed ? 'bill_passed' : 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: 0 });
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'default_resolution', earlyResolution: bill.early_resolution_status || null });
        } else if (bill.bill_type === 'confirmation' && bill.ambassador_id) {
            // Ambassador confirmation bill
            // Check if nominee voted NO — auto-fail (withdrawal of nomination)
            const { data: ambRow } = await supabase.from('ambassadors').select('faction_id').eq('id', bill.ambassador_id).maybeSingle();
            const ambNomineeId = ambRow?.faction_id;
            const nomineeVotedNo = ambNomineeId && (bill.bill_support || []).some(s => {
                const st = s.stance === 'reject' ? 'no' : s.stance;
                return s.faction_id === ambNomineeId && st === 'no';
            });
            if (nomineeVotedNo) passed = false;

            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Activate the ambassador — term starts now
                await supabase.from('ambassadors').update({
                    status: 'active',
                    is_active: true,
                    appointed_at_tick: currentTick
                }).eq('id', bill.ambassador_id);
                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: 0 });
            } else {
                await failBill(supabase, bill);
                // Reject the ambassador
                await supabase.from('ambassadors').update({
                    status: 'rejected',
                    is_active: false
                }).eq('id', bill.ambassador_id);
                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'confirmation', earlyResolution: bill.early_resolution_status || null });
        } else if (bill.bill_type === 'minister_confirmation' && bill.ministry_key) {
            // Minister confirmation bill (Presidential systems)
            const mKey = bill.ministry_key;
            const { data: ministry } = await supabase.from('ministries')
                .select('id, pending_minister')
                .eq('nation_id', bill.nation_id).eq('ministry_key', mKey).eq('is_active', true)
                .maybeSingle();

            // Check if nominee voted NO — auto-fail (withdrawal of nomination)
            const minNomineeId = ministry?.pending_minister?.party_id;
            const minNomineeVotedNo = minNomineeId && (bill.bill_support || []).some(s => {
                const st = s.stance === 'reject' ? 'no' : s.stance;
                return s.faction_id === minNomineeId && st === 'no';
            });
            if (minNomineeVotedNo) passed = false;

            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                if (!ministry) {
                    // Ministry row doesn't exist — create it so the confirmation can proceed
                    console.warn(`Minister confirmation passed but ministry row missing for ${mKey} in nation ${bill.nation_id}. Creating it.`);
                    const { data: createdMinistry } = await supabase.from('ministries').insert({
                        nation_id: bill.nation_id,
                        ministry_key: mKey,
                        ministry_name: mKey,
                        is_active: true,
                        confirmation_status: 'pending',
                        pending_minister: null
                    }).select('id, pending_minister').single();
                    // Use the bill's metadata as fallback for pending_minister
                    if (createdMinistry && bill.metadata?.pending_minister) {
                        await supabase.from('ministries').update({
                            pending_minister: bill.metadata.pending_minister
                        }).eq('id', createdMinistry.id);
                    }
                }

                if (ministry?.pending_minister) {
                    const pm = ministry.pending_minister;
                    const ministryNames = {
                        prime_minister: 'Prime Minister', interior: 'Ministry of the Interior',
                        foreign: 'Foreign Ministry', defense: 'Ministry of Defense',
                        finance: 'Ministry of Finance', education: 'Ministry of Education',
                        healthcare: 'Ministry of Healthcare', labor: 'Ministry of Labor',
                        justice: 'Ministry of Justice', trade: 'Ministry of Trade',
                        energy: 'Ministry of Energy', transportation: 'Ministry of Transportation',
                        security: 'Ministry of Security'
                    };
                    // Fetch full nation for stat baselines
                    const { data: fullNation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();
                    await supabase.from('ministries').update({
                        party_id: pm.party_id,
                        minister_first_name: pm.first_name,
                        minister_last_name: pm.last_name,
                        minister_age: pm.age,
                        minister_approval: 50,
                        ministry_name: ministryNames[mKey] || mKey,
                        confirmation_status: 'confirmed',
                        pending_minister: null,
                        stat_baselines: fullNation ? buildMinistryBaselines(mKey, fullNation) : {}
                    }).eq('id', ministry.id);

                    // If confirming a PM, update government_formations so lead_party_id stays correct
                    if (mKey === 'prime_minister') {
                        try {
                            const { data: activeGovFormation } = await supabase.from('government_formations')
                                .select('id, ministry_assignments')
                                .eq('nation_id', bill.nation_id)
                                .in('status', ['formed', 'caretaker'])
                                .order('formed_at', { ascending: false })
                                .limit(1)
                                .maybeSingle();
                            if (activeGovFormation) {
                                const updatedAssignments = { ...(activeGovFormation.ministry_assignments || {}), prime_minister: pm.party_id };
                                await supabase.from('government_formations')
                                    .update({ ministry_assignments: updatedAssignments })
                                    .eq('id', activeGovFormation.id);
                                console.log(`[resolveExpiredVotes] Updated government_formations PM assignment to ${pm.party_id}`);
                            }
                        } catch (gfErr) { console.warn('[resolveExpiredVotes] Failed to update government_formations PM:', gfErr); }
                    }
                }

                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: 0 });
            } else {
                await failBill(supabase, bill);

                // Clear pending nominee after failed confirmation
                if (ministry?.pending_minister) {
                    await supabase.from('ministries').update({
                        confirmation_status: 'rejected',
                        pending_minister: null
                    }).eq('id', ministry.id);
                }

                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'minister_confirmation', earlyResolution: bill.early_resolution_status || null });
        } else if (bill.bill_type === 'veto_override' && bill.original_bill_id) {
            // Veto override bill (Presidential systems)
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Enact the ORIGINAL vetoed bill
                const { data: originalBill } = await supabase.from('bills')
                    .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
                    .eq('id', bill.original_bill_id).single();
                if (originalBill) {
                    await supabase.from('bills').update({ president_action: 'overridden' }).eq('id', originalBill.id);
                    const enactment = await enactBill(supabase, originalBill, currentTick);
                    if (!enactment?.success) {
                        await markBillEnactmentFailed(supabase, originalBill, currentTick, enactment?.error || 'Unknown enactment failure');
                        await fireBillEvent(supabase, 'bill_failed', originalBill, { currentTick, nationName: nation?.name, votesFor: 0, votesAgainst: 0, billNameOverride: `${originalBill.bill_name} (override enactment failed)` });
                    }
                }
                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'veto_override', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'veto_override', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'ratification' && bill.diplomatic_proposal_id) {
            // Diplomatic ratification bill
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Activate the linked diplomatic proposal
                const { data: proposal } = await supabase.from('diplomatic_proposals')
                    .select('*').eq('id', bill.diplomatic_proposal_id).single();
                if (proposal) {
                    const pd = proposal.proposal_data || {};
                    const updatedPipeline = { ...(pd.pipeline || {}), ratified_at: currentTick };
                    pd.pipeline = updatedPipeline;
                    await supabase.from('diplomatic_proposals')
                        .update({ status: 'active', activated_at_tick: currentTick, proposal_data: pd })
                        .eq('id', bill.diplomatic_proposal_id);
                    // Apply relation effects from active articles
                    const articles = pd.articles || [];
                    const struckIndices = new Set(pd.struck_articles || []);
                    let totalRel = 0;
                    articles.forEach((art, i) => {
                        if (!struckIndices.has(i)) totalRel += art.relations || 0;
                    });
                    if (totalRel !== 0) {
                        const nationA = proposal.proposing_nation_id < proposal.target_nation_id ? proposal.proposing_nation_id : proposal.target_nation_id;
                        const nationB = proposal.proposing_nation_id < proposal.target_nation_id ? proposal.target_nation_id : proposal.proposing_nation_id;
                        const { data: rel } = await supabase.from('diplomatic_relations')
                            .select('id, relation_score, active_treaties')
                            .eq('nation_a_id', nationA).eq('nation_b_id', nationB).maybeSingle();
                        if (rel) {
                            const newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) + totalRel));
                            const treaties = Array.isArray(rel.active_treaties) ? [...rel.active_treaties, proposal.id] : [proposal.id];
                            await supabase.from('diplomatic_relations')
                                .update({ relation_score: newScore, active_treaties: treaties }).eq('id', rel.id);
                        }
                    }
                    await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
                }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'ratification', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                // Mark proposal as ratification_failed so FM can abandon or retry
                await supabase.from('diplomatic_proposals')
                    .update({ status: 'ratification_failed' })
                    .eq('id', bill.diplomatic_proposal_id);
                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'ratification', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'ratification' && bill.trade_negotiation_id) {
            // Trade agreement ratification bill
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                // Check if the OTHER nation's ratification bill has also passed
                const { data: neg } = await supabase.from('trade_negotiations')
                    .select('*').eq('id', bill.trade_negotiation_id).single();

                if (neg) {
                    const isNationA = bill.nation_id === neg.nation_a_id;
                    const otherBillId = isNationA ? neg.bill_b_id : neg.bill_a_id;

                    let otherPassed = false;
                    if (otherBillId) {
                        const { data: otherBill } = await supabase.from('bills')
                            .select('status').eq('id', otherBillId).single();
                        otherPassed = otherBill?.status === 'passed';
                    }

                    if (otherPassed) {
                        // Both parliaments ratified — activate the trade agreement
                        // Extract duration info from draft articles
                        const articles = neg.draft_articles || [];
                        const durationArt = articles.find(a => a.type === 'duration');
                        const durData = durationArt?.data || {};
                        const isPermanent = durData.duration_type === 'permanent';
                        const durationTicks = durData.duration_ticks || null;
                        const autoRenew = durData.auto_renew || false;
                        const withdrawalNotice = durData.withdrawal_notice_ticks || 3;

                        // Ensure canonical nation order (nation_a_id < nation_b_id)
                        const nA = neg.nation_a_id < neg.nation_b_id ? neg.nation_a_id : neg.nation_b_id;
                        const nB = neg.nation_a_id < neg.nation_b_id ? neg.nation_b_id : neg.nation_a_id;

                        // Insert into trade_agreements
                        const { data: newAgreement } = await supabase.from('trade_agreements').insert({
                            nation_a_id: nA,
                            nation_b_id: nB,
                            negotiation_id: neg.id,
                            bill_a_id: neg.bill_a_id,
                            bill_b_id: neg.bill_b_id,
                            agreement_type: neg.agreement_type,
                            agreement_name: neg.agreement_name || 'Trade Agreement',
                            articles: articles,
                            duration_type: isPermanent ? 'permanent' : 'fixed',
                            duration_ticks: isPermanent ? null : durationTicks,
                            auto_renew: autoRenew,
                            withdrawal_notice_ticks: withdrawalNotice,
                            status: 'active',
                            enacted_at_tick: currentTick,
                            expires_at_tick: isPermanent ? null : (durationTicks ? currentTick + durationTicks : null)
                        }).select('id').single();

                        // For economic aid agreements, create the aid_agreement_state row
                        if (neg.agreement_type === 'economic_aid' && newAgreement) {
                            const aidTerms = articles.find(a => a.type === 'aid_terms');
                            if (aidTerms) {
                                const donorId = aidTerms.data.donor_nation_id;

                                // Validate donor_nation_id is one of the two agreement parties
                                if (donorId !== nA && donorId !== nB) {
                                    console.error(`[resolveExpiredVotes] Invalid donor_nation_id ${donorId} — not a party to agreement [${nA}, ${nB}]. Skipping aid_agreement_state.`);
                                } else {
                                    const recipientId = donorId === nA ? nB : nA;
                                    const annualAmount = Number(aidTerms.data.annual_amount || 0);

                                    const { error: aidStateError } = await supabase.from('aid_agreement_state').insert({
                                        agreement_id: newAgreement.id,
                                        donor_nation_id: donorId,
                                        recipient_nation_id: recipientId,
                                        current_annual_amount: annualAmount,
                                        original_annual_amount: annualAmount,
                                        next_review_tick: currentTick + DIPLOMACY_CONFIG.AID_ANNUAL_REVIEW_INTERVAL,
                                        condition_failures: {}
                                    });

                                    if (aidStateError) {
                                        console.error(`[resolveExpiredVotes] Failed to create aid_agreement_state:`, aidStateError.message);
                                    } else {
                                        console.log(`[resolveExpiredVotes] Economic aid agreement activated: donor=${donorId}, recipient=${recipientId}, amount=$${(annualAmount/1e9).toFixed(2)}B`);
                                    }
                                }
                            }
                        }

                        // Mark negotiation as concluded
                        await supabase.from('trade_negotiations')
                            .update({ status: 'concluded', concluded_at_tick: currentTick })
                            .eq('id', neg.id);

                        // Update diplomatic relations
                        const { data: rel } = await supabase.from('diplomatic_relations')
                            .select('id, relation_score, active_treaties')
                            .eq('nation_a_id', nA).eq('nation_b_id', nB).maybeSingle();
                        if (rel) {
                            const bonus = neg.agreement_type === 'economic_aid' ? DIPLOMACY_CONFIG.AID_RELATION_BONUS : 5;
                            const newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) + bonus));
                            await supabase.from('diplomatic_relations')
                                .update({ relation_score: newScore }).eq('id', rel.id);
                        }
                    }
                    // If only one side ratified so far, just leave negotiation in 'ratification' status
                }

                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'trade_ratification', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                // Mark negotiation as ratification_failed
                await supabase.from('trade_negotiations')
                    .update({ status: 'ratification_failed' })
                    .eq('id', bill.trade_negotiation_id);
                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'trade_ratification', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'ratification' && bill.trade_agreement_data && bill.trade_agreement_data.type === 'retaliatory_tariff') {
            // Unilateral retaliatory tariff ratification
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                var rtData = bill.trade_agreement_data;
                var imposerId = rtData.imposer_nation_id;
                var targetId = rtData.target_nation_id;
                var isPermanent = rtData.duration_type === 'permanent';
                var durationTicks = rtData.duration_ticks || null;

                // Insert trade_agreement (retaliatory_tariff bypasses nation ordering constraint — imposer is always nation_a)
                await supabase.from('trade_agreements').insert({
                    nation_a_id: imposerId,
                    nation_b_id: targetId,
                    bill_a_id: bill.id,
                    agreement_type: 'retaliatory_tariff',
                    agreement_name: rtData.agreement_name || 'Retaliatory Tariff',
                    articles: rtData.articles || [],
                    duration_type: isPermanent ? 'permanent' : 'fixed',
                    duration_ticks: isPermanent ? null : durationTicks,
                    auto_renew: false,
                    withdrawal_notice_ticks: 1,
                    status: 'active',
                    enacted_at_tick: currentTick,
                    expires_at_tick: isPermanent ? null : (durationTicks ? currentTick + durationTicks : null)
                });

                // Apply relation_score penalty: -surcharge_pct / 2 (max surcharge across all sector articles)
                var maxSurcharge = 0;
                var articles = rtData.articles || [];
                for (var rti = 0; rti < articles.length; rti++) {
                    if (articles[rti].type === 'tariff_surcharge') {
                        maxSurcharge = Math.max(maxSurcharge, articles[rti].data.surcharge_pct || 0);
                    }
                }
                var relPenalty = Math.round(maxSurcharge / 2);

                if (relPenalty > 0) {
                    // Use canonical ordering for diplomatic_relations lookup
                    var relA = imposerId < targetId ? imposerId : targetId;
                    var relB = imposerId < targetId ? targetId : imposerId;
                    var { data: rel } = await supabase.from('diplomatic_relations')
                        .select('id, relation_score')
                        .eq('nation_a_id', relA).eq('nation_b_id', relB).maybeSingle();
                    if (rel) {
                        var newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) - relPenalty));
                        await supabase.from('diplomatic_relations')
                            .update({ relation_score: newScore }).eq('id', rel.id);
                    }
                }

                // Fire enactment event for target nation
                try {
                    var { data: imposerNation } = await supabase.from('nations').select('name').eq('id', imposerId).single();
                    var imposerName = imposerNation?.name || 'Unknown';
                    await supabase.from('event_log').insert({
                        nation_id: targetId,
                        event_name: 'Retaliatory Tariff Enacted',
                        category: 'Trade',
                        description_chosen: imposerName + ' has enacted a retaliatory tariff on your exports. Relations have decreased by ' + relPenalty + '.',
                        fired_at_tick: currentTick
                    });
                } catch (e) { /* non-blocking */ }

                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'retaliatory_tariff', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'retaliatory_tariff', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'ratification' && bill.trade_agreement_data && bill.trade_agreement_data.type === 'export_subsidy') {
            // Unilateral export subsidy ratification
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                var esData = bill.trade_agreement_data;
                var esNationId = esData.imposer_nation_id;
                var esIsPermanent = esData.duration_type === 'permanent';
                var esDurationTicks = esData.duration_ticks || null;

                // Insert trade_agreement (export_subsidy is unilateral — nation_a is the subsidizer, nation_b is null)
                await supabase.from('trade_agreements').insert({
                    nation_a_id: esNationId,
                    nation_b_id: null,
                    bill_a_id: bill.id,
                    agreement_type: 'export_subsidy',
                    agreement_name: esData.agreement_name || 'Export Subsidy',
                    articles: esData.articles || [],
                    duration_type: esIsPermanent ? 'permanent' : 'fixed',
                    duration_ticks: esIsPermanent ? null : esDurationTicks,
                    auto_renew: false,
                    withdrawal_notice_ticks: 1,
                    status: 'active',
                    enacted_at_tick: currentTick,
                    expires_at_tick: esIsPermanent ? null : (esDurationTicks ? currentTick + esDurationTicks : null)
                });

                // Fire enactment event
                try {
                    await supabase.from('event_log').insert({
                        nation_id: esNationId,
                        event_name: 'Export Subsidy Enacted',
                        category: 'Trade',
                        description_chosen: (nation?.name || 'Unknown') + ' has enacted an export subsidy. Subsidized exports are now cheaper on the international market.',
                        fired_at_tick: currentTick
                    });
                } catch (e) { /* non-blocking */ }

                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'export_subsidy', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'export_subsidy', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'ratification' && bill.trade_agreement_data && bill.trade_agreement_data.type === 'impose_embargo') {
            // Unilateral embargo ratification
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                var embData = bill.trade_agreement_data;
                var imposerId = embData.imposer_nation_id;
                var targetId = embData.target_nation_id;
                var durationTicks = embData.duration_ticks || 12;

                await supabase.from('trade_agreements').insert({
                    nation_a_id: imposerId,
                    nation_b_id: targetId,
                    bill_a_id: bill.id,
                    agreement_type: 'impose_embargo',
                    agreement_name: embData.agreement_name || 'Embargo',
                    articles: embData.articles || [],
                    duration_type: 'fixed',
                    duration_ticks: durationTicks,
                    auto_renew: false,
                    withdrawal_notice_ticks: 1,
                    status: 'active',
                    enacted_at_tick: currentTick,
                    expires_at_tick: currentTick + durationTicks
                });

                // Diplomatic penalty: 20 + 5 per embargoed sector (25 targeted, 30-45 partial, 50 total)
                var embargoedSectors = (embData.articles || []).filter(function(a) { return a.type === 'embargo_sector'; }).length;
                var relPenalty = Math.round(20 + embargoedSectors * 5);

                if (relPenalty > 0) {
                    var relA = imposerId < targetId ? imposerId : targetId;
                    var relB = imposerId < targetId ? targetId : imposerId;
                    var { data: rel } = await supabase.from('diplomatic_relations')
                        .select('id, relation_score')
                        .eq('nation_a_id', relA).eq('nation_b_id', relB).maybeSingle();
                    if (rel) {
                        var newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) - relPenalty));
                        await supabase.from('diplomatic_relations')
                            .update({ relation_score: newScore }).eq('id', rel.id);
                    }
                }

                try {
                    var { data: imposerNation } = await supabase.from('nations').select('name').eq('id', imposerId).single();
                    var imposerName = imposerNation?.name || 'Unknown';
                    await supabase.from('event_log').insert({
                        nation_id: targetId,
                        event_name: 'Embargo Enacted',
                        category: 'Trade',
                        description_chosen: imposerName + ' has imposed an embargo on your trade. Relations have decreased by ' + relPenalty + '.',
                        fired_at_tick: currentTick
                    });
                } catch (e) { /* non-blocking */ }

                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'impose_embargo', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'impose_embargo', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'impeachment_motion' && bill.impeachment_id) {
            // ── Impeachment Motion (Phase 1) ──
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                // Update proceeding: motion passed, president is impeached
                await supabase.from('impeachment_proceedings').update({
                    phase: 'trial',
                    motion_result: 'passed'
                }).eq('id', bill.impeachment_id);

                // Immediate -15 gov_approval hit on president for being impeached
                const { data: proceedingData } = await supabase.from('impeachment_proceedings')
                    .select('president_id').eq('id', bill.impeachment_id).single();
                if (proceedingData) {
                    const { data: presidentRow } = await supabase.from('presidents')
                        .select('faction_id').eq('id', proceedingData.president_id).single();
                    if (presidentRow) {
                        await adjustMomentumAll(supabase, bill.nation_id, presidentRow.faction_id, -15, 'impeachment:impeached');
                    }
                }

                // Create conviction bill (Phase 2) — goes directly to floor with trial-length voting window
                const { data: convictionBill } = await supabase.from('bills').insert({
                    nation_id: bill.nation_id,
                    proposed_by: bill.proposed_by,
                    proposed_tick: currentTick,
                    bill_name: bill.bill_name.replace('Impeachment of', 'Conviction of'),
                    bill_type: 'impeachment_conviction',
                    status: 'floor',
                    voting_ends_tick: currentTick + GAME_CONFIG.IMPEACHMENT_TRIAL_TICKS,
                    impeachment_id: bill.impeachment_id,
                    preamble: 'The President has been impeached. Parliament must now vote on removal. A 2/3 supermajority (' + Math.ceil(totalSeats * 2 / 3) + ' of ' + totalSeats + ' seats) is required for conviction and removal from office.'
                }).select('id').single();

                if (convictionBill) {
                    await supabase.from('impeachment_proceedings').update({
                        conviction_bill_id: convictionBill.id
                    }).eq('id', bill.impeachment_id);
                }

                // Fire impeachment event
                try {
                    await supabase.from('event_log').insert({
                        nation_id: bill.nation_id,
                        event_name: 'PRESIDENT IMPEACHED',
                        event_type: 'impeachment',
                        category: 'government',
                        description_chosen: `Parliament has voted to impeach the President. The motion passed ${votesFor} to ${votesAgainst}. A trial period begins — a 2/3 supermajority vote is required for removal.`,
                        fired_at_tick: currentTick,
                        effects_applied: { impeachment_id: bill.impeachment_id, votes_for: votesFor, votes_against: votesAgainst }
                    });
                } catch (e) { /* non-blocking */ }
            } else {
                await failBill(supabase, bill);

                // Motion failed — apply cooldown
                await supabase.from('impeachment_proceedings').update({
                    phase: 'resolved',
                    motion_result: 'failed',
                    resolved_at_tick: currentTick
                }).eq('id', bill.impeachment_id);

                await supabase.from('nations').update({
                    impeachment_cooldown_until_tick: currentTick + GAME_CONFIG.IMPEACHMENT_MOTION_COOLDOWN_TICKS
                }).eq('id', bill.nation_id);

                // Filer takes -5 approval (partisan overreach)
                await adjustMomentumAll(supabase, bill.nation_id, bill.proposed_by, -5, 'impeachment:failed_motion');

                // President gets +3 approval (vindication)
                const { data: proc } = await supabase.from('impeachment_proceedings')
                    .select('president_id').eq('id', bill.impeachment_id).single();
                if (proc) {
                    const { data: presRow } = await supabase.from('presidents')
                        .select('faction_id').eq('id', proc.president_id).single();
                    if (presRow) {
                        await adjustMomentumAll(supabase, bill.nation_id, presRow.faction_id, 3, 'impeachment:vindicated');
                    }
                }

                // Record in campaign_actions for cooldown tracking
                await supabase.from('campaign_actions').insert({
                    nation_id: bill.nation_id,
                    party_id: bill.proposed_by,
                    action_type: 'impeachment_failed',
                    tick_performed: currentTick,
                    result: { impeachment_id: bill.impeachment_id }
                });

                try {
                    await supabase.from('event_log').insert({
                        nation_id: bill.nation_id,
                        event_name: 'IMPEACHMENT MOTION FAILS',
                        event_type: 'impeachment',
                        category: 'government',
                        description_chosen: `The impeachment motion has failed ${votesFor} to ${votesAgainst}. The President remains in office.`,
                        fired_at_tick: currentTick,
                        effects_applied: { impeachment_id: bill.impeachment_id, votes_for: votesFor, votes_against: votesAgainst, cooldown_ticks: GAME_CONFIG.IMPEACHMENT_MOTION_COOLDOWN_TICKS }
                    });
                } catch (e) { /* non-blocking */ }
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'impeachment_motion', earlyResolution: bill.early_resolution_status || null });

        } else if (bill.bill_type === 'impeachment_conviction' && bill.impeachment_id) {
            // ── Impeachment Conviction (Phase 2) ──
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Conviction logic handled by processImpeachmentConviction in handler-template
                // Mark proceeding as convicted — the tick handler will process removal
                await supabase.from('impeachment_proceedings').update({
                    phase: 'resolved',
                    conviction_result: 'convicted',
                    resolved_at_tick: currentTick
                }).eq('id', bill.impeachment_id);
            } else {
                await failBill(supabase, bill);
                // Acquitted — president restored, long cooldown
                await supabase.from('impeachment_proceedings').update({
                    phase: 'resolved',
                    conviction_result: 'acquitted',
                    resolved_at_tick: currentTick
                }).eq('id', bill.impeachment_id);

                await supabase.from('nations').update({
                    impeachment_cooldown_until_tick: currentTick + GAME_CONFIG.IMPEACHMENT_ACQUITTAL_COOLDOWN_TICKS
                }).eq('id', bill.nation_id);

                // President gets +5 approval (survived trial)
                const { data: proc } = await supabase.from('impeachment_proceedings')
                    .select('president_id').eq('id', bill.impeachment_id).single();
                if (proc) {
                    const { data: presRow } = await supabase.from('presidents')
                        .select('faction_id').eq('id', proc.president_id).single();
                    if (presRow) {
                        await adjustMomentumAll(supabase, bill.nation_id, presRow.faction_id, 5, 'impeachment:acquitted');
                    }
                }

                // Stability recovers +3
                const { data: natRow } = await supabase.from('nations').select('stability').eq('id', bill.nation_id).single();
                if (natRow) {
                    await supabase.from('nations').update({
                        stability: Math.min(100, Math.round(Number(natRow.stability || 0) + 3))
                    }).eq('id', bill.nation_id);
                }

                // Parties that voted for conviction take -2 approval
                const yesVoters = (bill.bill_support || []).filter(s => s.stance === 'yes' || s.stance === 'accept');
                for (const v of yesVoters) {
                    if (v.faction_id !== bill.proposed_by) {
                        await adjustMomentumAll(supabase, bill.nation_id, v.faction_id, -2, 'impeachment:overreach');
                    }
                }
                await adjustMomentumAll(supabase, bill.nation_id, bill.proposed_by, -2, 'impeachment:overreach');

                try {
                    await supabase.from('event_log').insert({
                        nation_id: bill.nation_id,
                        event_name: 'PRESIDENT ACQUITTED',
                        event_type: 'impeachment',
                        category: 'government',
                        description_chosen: `The President has been acquitted. The conviction vote failed ${votesFor} to ${votesAgainst} (needed ${Math.ceil(totalSeats * 2 / 3)}). Full presidential powers are restored.`,
                        fired_at_tick: currentTick,
                        effects_applied: { impeachment_id: bill.impeachment_id, votes_for: votesFor, votes_against: votesAgainst, cooldown_ticks: GAME_CONFIG.IMPEACHMENT_ACQUITTAL_COOLDOWN_TICKS }
                    });
                } catch (e) { /* non-blocking */ }
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'impeachment_conviction', earlyResolution: bill.early_resolution_status || null });

        } else if (passed) {
            // Presidential systems: route regular/repeal bills to president's desk
            if (isPresidentialRepublic(nation)) {
                await supabase.from('bills').update({
                    status: 'president_desk',
                    passed_tick: currentTick,
                    president_desk_deadline: currentTick + GAME_CONFIG.PRESIDENT_DESK_TICKS
                }).eq('id', bill.id);
                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: (bill.bill_articles || []).length });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'president_desk', votesFor, votesAgainst, earlyResolution: bill.early_resolution_status || null });
            } else {
                // Wrap enactBill in try-catch to convert thrown exceptions into {success: false}
                let enactment;
                try {
                    enactment = await enactBill(supabase, bill, currentTick);
                } catch (enactErr) {
                    console.error(`[resolveExpiredVotes] enactBill threw for bill ${bill.id} ("${bill.bill_name}"):`, enactErr);
                    enactment = { success: false, error: `enactBill threw: ${enactErr?.message || enactErr}` };
                }
                if (!enactment?.success) {
                    await markBillEnactmentFailed(supabase, bill, currentTick, enactment?.error || 'Unknown enactment failure');
                    await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, billNameOverride: `${bill.bill_name} (enactment failed)` });
                    results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_enactment', votesFor, votesAgainst, error: enactment?.error, earlyResolution: bill.early_resolution_status || null });
                } else {
                    await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: (bill.bill_articles || []).length });
                    results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, earlyResolution: bill.early_resolution_status || null });
                }
            }
        } else {
            await failBill(supabase, bill);
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, earlyResolution: bill.early_resolution_status || null });
        }

        // Guardrail: resolved bills must not remain on the floor after this function.
        // If any branch forgets to persist status, fail closed so the bill leaves the active queue.
        try {
            const { data: persistedBill, error: persistedErr } = await supabase
                .from('bills')
                .select('id, status, voting_ends_tick')
                .eq('id', bill.id)
                .single();
            if (persistedErr) {
                throw new Error(`post-resolution read failed: ${persistedErr.message}`);
            }
            if (persistedBill && persistedBill.status === 'floor' && persistedBill.voting_ends_tick != null && persistedBill.voting_ends_tick <= currentTick) {
                throw new Error(`bill ${bill.id} remained on floor after resolution (voting_ends_tick=${persistedBill.voting_ends_tick}, tick=${currentTick})`);
            }
        } catch (persistCheckErr) {
            console.error('[resolveExpiredVotes] Persistence guard tripped:', persistCheckErr);
            throw persistCheckErr;
        }

        // ── No-vote penalty: punish factions that didn't cast any vote ──
        try {
            const penalized = await applyNoVotePenalty(supabase, bill, bill.nation_id);
            if (penalized.length > 0) {
                const names = penalized.map(p => `${p.factionName} (${p.momentumLoss} momentum, ${p.preferencePenalty} pref to ${p.affectedBlocCount} blocs)`).join(', ');
                console.log(`[resolveExpiredVotes] No-vote penalty on "${bill.bill_name}": ${names}`);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'no_vote_penalty',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: {
                            bill_name: bill.bill_name,
                            party_names: penalized.map(p => p.factionName).join(', '),
                            party_count: String(penalized.length)
                        }
                    });
                } catch (e) { /* non-blocking if event key doesn't exist yet */ }
            }
        } catch (penaltyErr) {
            console.error(`[resolveExpiredVotes] No-vote penalty failed for bill ${bill.id}:`, penaltyErr.message);
        }
      } catch (billErr) {
        // Per-bill error handler: prevents one bill's failure from blocking all others
        console.error(`[resolveExpiredVotes] UNHANDLED error processing bill ${bill.id} ("${bill.bill_name}"):`, billErr);
        try {
            await markBillEnactmentFailed(supabase, bill, currentTick, `Unhandled error: ${billErr?.message || billErr}`);
        } catch (_) {
            // Even the fallback failed — bill stays on floor, will retry next tick
            console.error(`[resolveExpiredVotes] Failed to mark bill ${bill.id} as failed after unhandled error`);
        }
        results.push({ billId: bill.id, billName: bill.bill_name, result: 'error', error: String(billErr) });
      }
    }

    return results;
}

async function markBillEnactmentFailed(supabase, bill, currentTick, enactError) {
    const normalizedError = typeof enactError === 'string' ? enactError : 'Unknown enactment failure';
    const { error } = await supabase.from('bills').update({
        status: 'failed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    if (error) {
        console.error(`[markBillEnactmentFailed] Failed to mark bill ${bill.id} as failed:`, error.message);
    }
}

async function enactBill(supabase, bill, currentTick) {
    let enactError = null;
    const logContext = {
        billId: bill?.id,
        billStatus: bill?.status,
        billNationId: bill?.nation_id,
        presidentFactionId: null
    };
    console.log('[enactBill] stage=preflight_context', logContext);

    console.log('[enactBill] stage=load_nation attempt', logContext);
    const { data: nation } = await supabase
        .from('nations')
        .select('*')
        .eq('id', bill.nation_id)
        .single();
    if (!nation) {
        console.error('[enactBill] stage=load_nation result=failed_nation_not_found', logContext);
        console.error('[enactBill] stage=terminal_result result=failed_nation_not_found', logContext);
        return { success: false, error: `Nation ${bill.nation_id} not found` };
    }
    console.log('[enactBill] stage=load_nation result=success', logContext);

    console.log('[enactBill] stage=load_active_laws attempt', logContext);
    const { data: currentActiveLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', bill.nation_id);
    console.log('[enactBill] stage=load_active_laws result=success', {
        ...logContext,
        activeLawCount: (currentActiveLaws || []).length
    });

    // ── Repeal bill handling ──
    if (bill.bill_type === 'repeal') {
        console.log('[enactBill] stage=repeal_bill attempt', logContext);
        const repealResult = await repealActiveLaw({
            supabase,
            nation,
            currentTick,
            currentActiveLaws,
            reversePolicy,
            bill,
        });

        if (!repealResult.success) {
            if (repealResult.reason === 'missing_target_id') {
                enactError = 'Repeal bill has no repeal_active_law_id on bill row or articles';
            } else if (repealResult.reason === 'target_law_absent' || repealResult.reason === 'missing_target_policy') {
                enactError = `Repeal target active_law ${repealResult.targetLawId} not found or missing policy`;
            } else if (repealResult.reason === 'delete_failed') {
                enactError = `Repeal target ${repealResult.targetLawId} could not be deleted: ${repealResult.error}`;
            } else if (repealResult.reason === 'clear_bill_references_failed' || repealResult.reason === 'clear_article_references_failed') {
                enactError = `Repeal target ${repealResult.targetLawId} FK cleanup failed: ${repealResult.error}`;
            } else {
                enactError = `Unknown repeal failure (${repealResult.reason})`;
            }
            console.error('[enactBill] stage=repeal_bill result=failed_enactment', {
                ...logContext,
                error: enactError,
                reason: repealResult.reason,
                targetLawId: repealResult.targetLawId || null
            });
            console.error('[enactBill] stage=terminal_result result=failed_enactment', {
                ...logContext,
                error: enactError
            });
            return { success: false, error: enactError, repealResult };
        }

        console.log('[enactBill] stage=repeal_bill result=success', {
            ...logContext,
            targetLawId: repealResult.targetLawId,
            policyName: repealResult.policyName
        });
    } else {
        const articles = (bill.bill_articles || []).filter(a => a.policy_id);

        for (const art of articles) {
            const policy = art.policies;
            if (!policy) continue;

            // Repeal article — reverse and delete the targeted active law
            if (art.repeal_active_law_id) {
                console.log('[enactBill] stage=repeal_article attempt', {
                    ...logContext,
                    articleId: art.id,
                    repealActiveLawId: art.repeal_active_law_id
                });
                const repealResult = await repealActiveLaw({
                    supabase,
                    nation,
                    currentTick,
                    currentActiveLaws,
                    reversePolicy,
                    article: art,
                });
                if (!repealResult.success) {
                    console.error('[enactBill] stage=repeal_article result=failed_enactment', {
                        ...logContext,
                        articleId: art.id,
                        reason: repealResult.reason,
                        targetLawId: repealResult.targetLawId || null
                    });
                } else {
                    console.log('[enactBill] stage=repeal_article result=success', {
                        ...logContext,
                        articleId: art.id,
                        targetLawId: repealResult.targetLawId,
                        policyName: repealResult.policyName
                    });
                }
                continue;
            }

            // Reverse any opposed policies — use fresh DB lookup instead of stale snapshot
            if (policy.opposed_policy_ids && Array.isArray(policy.opposed_policy_ids)) {
                for (const opposedId of policy.opposed_policy_ids) {
                    const { data: freshLaw } = await supabase.from('active_laws')
                        .select('id, policy_id, passed_tick, policies(*)')
                        .eq('nation_id', bill.nation_id)
                        .eq('policy_id', opposedId)
                        .maybeSingle();
                    if (freshLaw && freshLaw.policies) {
                        await reversePolicy(supabase, nation, freshLaw.policies, freshLaw.passed_tick, currentTick);
                    }
                }
            }

            // Clear FK references before upserting the new active_law
            const { data: existingActiveLaw } = await supabase.from('active_laws')
                .select('id')
                .eq('nation_id', bill.nation_id)
                .eq('policy_id', policy.id)
                .maybeSingle();
            if (existingActiveLaw) {
                await supabase.from('bills').update({ repeal_active_law_id: null }).eq('repeal_active_law_id', existingActiveLaw.id);
                await supabase.from('bill_articles').update({ repeal_active_law_id: null }).eq('repeal_active_law_id', existingActiveLaw.id);
            }
            console.log('[enactBill] stage=upsert_active_law attempt', {
                ...logContext,
                policyId: policy.id,
                policyName: policy.policy_name
            });
            const { error: activeLawError } = await supabase.from('active_laws')
                .upsert({
                    nation_id: bill.nation_id,
                    policy_id: policy.id,
                    passed_tick: currentTick,
                    proposed_by: bill.proposed_by,
                    effects_applied_through_tick: currentTick - 1
                }, { onConflict: 'nation_id,policy_id' });
            if (activeLawError) {
                console.error('[enactBill] stage=upsert_active_law result=rls_blocked', {
                    ...logContext,
                    policyId: policy.id,
                    policyName: policy.policy_name,
                    error: activeLawError.message
                });
                console.error('[enactBill] stage=terminal_result result=rls_blocked', {
                    ...logContext,
                    error: activeLawError.message
                });
                return { success: false, error: `Active law upsert failed for policy ${policy.policy_name || policy.id}: ${activeLawError.message}` };
            }
            console.log('[enactBill] stage=upsert_active_law result=success', {
                ...logContext,
                policyId: policy.id,
                policyName: policy.policy_name
            });
        }
    }

    // ── Apply effect_data articles (e.g. tax rate changes) ──
    const VALID_TAX_KEYS = new Set(['income_tax', 'sales_tax', 'corporate_tax']);
    const taxUpdates = {};

    for (const art of (bill.bill_articles || [])) {
        const effect = art.effect_data;
        if (!effect) continue;

        if (effect.type === 'TAX_RATE_CHANGE' && VALID_TAX_KEYS.has(effect.tax_key)) {
            const newRate = Math.max(0, Math.min(50, Number(effect.new_rate)));
            taxUpdates[effect.tax_key] = newRate;
            console.log(`[enactBill] Tax rate change: ${effect.tax_key} ${effect.old_rate}% → ${newRate}%`);
        } else if (typeof effect.target_stat === 'string' && typeof effect.delta === 'number') {
            // Backward compatibility: parse legacy stat_effect-like payloads
            const key = effect.target_stat.toLowerCase();
            const newRate = Math.max(0, Math.min(50, Number(effect.delta)));
            const taxKey = key === 'income_tax' ? 'income_tax'
                : key === 'sales_tax' ? 'sales_tax'
                    : key === 'corporate_tax' ? 'corporate_tax'
                        : null;
            if (taxKey) {
                taxUpdates[taxKey] = newRate;
                console.log(`[enactBill] Tax rate change (parsed): ${taxKey} → ${newRate}%`);
            }
        }
    }

    // Backward compat: parse tax changes from article text for bills filed before effect_data existed
    if (Object.keys(taxUpdates).length === 0) {
        for (const art of (bill.bill_articles || [])) {
            if (art.policy_id || art.effect_data) continue;
            const title = art.article_title || '';
            if (!title.endsWith('Rate Change')) continue;
            const text = art.article_text || '';
            const match = text.match(/change\s+(.+?)\s+from\s+(\d+(?:\.\d+)?)%?\s+to\s+(\d+(?:\.\d+)?)%/i);
            if (!match) continue;
            const taxName = match[1].trim();
            const newRate = Math.max(0, Math.min(50, Number(match[3])));
            const taxKey = taxName === 'Income Tax' ? 'income_tax'
                : taxName === 'Sales Tax' ? 'sales_tax'
                : taxName === 'Corporate Tax' ? 'corporate_tax'
                : null;
            if (taxKey) {
                taxUpdates[taxKey] = newRate;
                console.log(`[enactBill] Tax rate change (parsed): ${taxKey} → ${newRate}%`);
            }
        }
    }

    if (Object.keys(taxUpdates).length > 0) {
        console.log('[enactBill] stage=apply_tax_updates attempt', {
            ...logContext,
            taxUpdates
        });
        const { error: taxErr } = await supabase.from('nations')
            .update(taxUpdates)
            .eq('id', bill.nation_id);
        if (taxErr) {
            console.error('[enactBill] stage=apply_tax_updates result=rls_blocked', {
                ...logContext,
                error: taxErr.message
            });
            console.error('[enactBill] stage=terminal_result result=rls_blocked', {
                ...logContext,
                error: taxErr.message
            });
            return { success: false, error: `Tax rate update failed: ${taxErr.message}` };
        }
        console.log('[enactBill] stage=apply_tax_updates result=success', {
            ...logContext,
            taxUpdates
        });

        // ── Apply tax-change approval/momentum effects ──
        // These match the preview shown in the economy.html tax cards.
        if (bill.proposed_by) {
            for (const [taxKey, newRate] of Object.entries(taxUpdates)) {
                const oldRate = Number(nation[taxKey] ?? 0);
                const rateDiff = newRate - oldRate;
                if (rateDiff === 0) continue;

                if (taxKey === 'corporate_tax') {
                    // Corporate tax: flat momentum hit on Business Owners voter bloc
                    const blocImpact = rateDiff > 0 ? -3 : 2;
                    const { data: boBlocRows } = await supabase
                        .from('voter_blocs')
                        .select('id')
                        .eq('nation_id', bill.nation_id)
                        .eq('bloc_name', 'Business Owners')
                        .eq('is_active', true)
                        .limit(1);
                    if (boBlocRows && boBlocRows.length > 0) {
                        await adjustMomentum(supabase, bill.nation_id, bill.proposed_by, boBlocRows[0].id, blocImpact, 'tax:corporate_tax');
                        console.log(`[enactBill] Corporate tax momentum: ${blocImpact} on Business Owners for sponsor ${bill.proposed_by}`);
                    }
                } else {
                    // Income / Sales tax: general momentum hit on sponsor
                    const approvalImpact = rateDiff > 0 ? rateDiff * -2 : Math.abs(rateDiff) * 1;
                    if (approvalImpact !== 0) {
                        await adjustMomentumAll(supabase, bill.nation_id, bill.proposed_by, approvalImpact, `tax:${taxKey}`);
                        console.log(`[enactBill] ${taxKey} momentum: ${approvalImpact} for sponsor ${bill.proposed_by}`);
                    }
                }
            }
        }
    }

    // ── Apply funding articles (per-institution level changes & discretionary grants) ──
    for (const art of (bill.bill_articles || [])) {
        const fd = art.funding_data;
        if (!fd || !fd.ministry_key) continue;

        // Per-institution funding changes: update ministry funding_level + budget_item_allocations
        const instChanges = (fd.institutions || []).filter(i => i.proposed_pct !== i.current_pct);

        // Update the ministry-level funding_level as a weighted average
        if (instChanges.length > 0) {
            const allInst = fd.institutions || [];
            const avgPct = allInst.reduce((sum, i) => sum + i.proposed_pct, 0) / (allInst.length || 1);
            const newLevel = avgPct / 100;
            console.log('[enactBill] stage=update_ministry_funding attempt', {
                ...logContext,
                ministryKey: fd.ministry_key,
                newLevel
            });
            const { error: ministryFundingErr } = await supabase.from('ministries')
                .update({ funding_level: newLevel })
                .eq('nation_id', bill.nation_id)
                .eq('ministry_key', fd.ministry_key)
                .eq('is_active', true);
            if (ministryFundingErr) {
                console.error('[enactBill] stage=update_ministry_funding result=rls_blocked', {
                    ...logContext,
                    ministryKey: fd.ministry_key,
                    error: ministryFundingErr.message
                });
                console.error('[enactBill] stage=terminal_result result=rls_blocked', {
                    ...logContext,
                    error: ministryFundingErr.message
                });
                return { success: false, error: `Ministry funding update failed for ${fd.ministry_key}: ${ministryFundingErr.message}` };
            }
            console.log('[enactBill] stage=update_ministry_funding result=success', {
                ...logContext,
                ministryKey: fd.ministry_key,
                avgPercent: Math.round(avgPct)
            });

            // Upsert per-institution funding into budget_item_allocations
            // Uses proposed_pct as allocation_amount and 100 as needed_amount
            // so buildStatInstitutionMap computes fundingPct = (proposed_pct / 100) * 100 = proposed_pct
            for (const inst of allInst) {
                const { error: allocErr } = await supabase.from('budget_item_allocations')
                    .upsert({
                        bill_id: bill.id,
                        nation_id: bill.nation_id,
                        fiscal_category: fd.ministry_key,
                        item_type: 'institution',
                        item_id: inst.id,
                        item_name: inst.name,
                        allocation_amount: inst.proposed_pct,
                        needed_amount: 100
                    }, { onConflict: 'bill_id,item_type,item_id' });
                if (allocErr) {
                    console.error('[enactBill] stage=upsert_institution_allocation result=error', {
                        ...logContext,
                        institutionId: inst.id,
                        error: allocErr.message
                    });
                }
            }
            console.log('[enactBill] stage=upsert_institution_allocations result=success', {
                ...logContext,
                ministryKey: fd.ministry_key,
                institutionCount: allInst.length
            });
        }

        // Discretionary grant: add to national debt
        const grantAmount = Number(fd.discretionary) || 0;
        if (grantAmount > 0) {
            const newDebt = (Number(nation.debt) || 0) + grantAmount;
            console.log('[enactBill] stage=update_debt_for_grant attempt', {
                ...logContext,
                ministryKey: fd.ministry_key,
                grantAmount,
                newDebt
            });
            await supabase.from('nations').update({ debt: newDebt }).eq('id', bill.nation_id);
            nation.debt = newDebt;
            console.log('[enactBill] stage=update_debt_for_grant result=success', {
                ...logContext,
                ministryKey: fd.ministry_key,
                grantAmount,
                newDebt
            });
        }
    }

    // Load ideology axes for all voting factions (sponsor + voters)
    const voterFactionIds = [bill.proposed_by, ...(bill.bill_support || []).map(s => s.faction_id)];
    const uniqueFactionIds = [...new Set(voterFactionIds.filter(Boolean))];
    const { data: ideoRows } = await supabase
        .from('faction_ideology')
        .select('faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism')
        .in('faction_id', uniqueFactionIds);

    const factionIdeologies = {};
    for (const row of (ideoRows || [])) {
        factionIdeologies[row.faction_id] = row;
    }

    const approvalDeltas = calculateEnactmentApproval(
        bill.bill_articles || [],
        bill.bill_support || [],
        bill.proposed_by,
        factionIdeologies
    );
    await applyEnactmentApproval(supabase, bill.nation_id, approvalDeltas);

    // Sponsor gains/loses preference with voter blocs based on bill ideology alignment
    await applyBlocPreferenceOnPassage(supabase, bill, bill.nation_id);

    console.log('[enactBill] stage=update_bill_status attempt', logContext);
    const { error: billUpdateErr } = await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    if (billUpdateErr) {
        console.error('[enactBill] stage=update_bill_status error=rls_blocked', {
            ...logContext,
            error: billUpdateErr.message
        });
        console.error('[enactBill] stage=terminal_result result=rls_blocked', {
            ...logContext,
            error: billUpdateErr.message
        });
        return { success: false, error: `Bill status update failed: ${billUpdateErr.message}` };
    }
    console.log('[enactBill] stage=update_bill_status result=success', logContext);

    // Legislative activity: boost gov_approval_events
    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');

    console.log('[enactBill] stage=terminal_result result=success', logContext);
    return { success: true };
}


async function reversePolicy(supabase, nation, policy, passedTick, currentTick) {
    const ticksActive = currentTick - (passedTick || 0);
    if (ticksActive <= 0) {
        console.log(`[reversePolicy] Skipping reversal for ${policy.policy_name || policy.id}: ticksActive=${ticksActive} (enacted same tick)`);
        return;
    }

    const sourceEffects = [];
    if (policy.stat_effects && Array.isArray(policy.stat_effects) && policy.stat_effects.length > 0) {
        sourceEffects.push(...policy.stat_effects);
    } else if (policy.target_stat) {
        sourceEffects.push({
            stat_key: policy.target_stat,
            direction: (policy.stat_direction || 'UP').toLowerCase(),
            rate: policy.stat_change_per_tick || 1,
            delay_ticks: 0,
            duration_ticks: policy.duration_months || 12
        });
    }

    if (sourceEffects.length === 0) return;

    const reversalEffects = [];

    for (const eff of sourceEffects) {
        const delay = eff.delay_ticks || 0;
        const duration = eff.duration_ticks || 12;

        let effectiveTicks = 0;
        if (ticksActive > delay) {
            effectiveTicks = Math.min(ticksActive - delay, duration);
        }

        if (effectiveTicks <= 0) continue;

        reversalEffects.push({
            stat_key: eff.stat_key,
            direction: eff.direction === 'up' ? 'down' : 'up',
            rate: eff.rate || 1,
            delay_ticks: 0,
            duration_ticks: effectiveTicks
        });
    }

    if (reversalEffects.length === 0) return;

    // Clear FK references to any existing row before upserting the reversal.
    const { data: existingLaw } = await supabase.from('active_laws')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('policy_id', policy.id)
        .maybeSingle();

    if (existingLaw) {
        await supabase.from('bills').update({ repeal_active_law_id: null }).eq('repeal_active_law_id', existingLaw.id);
        await supabase.from('bill_articles').update({ repeal_active_law_id: null }).eq('repeal_active_law_id', existingLaw.id);
    }

    // Upsert instead of delete+insert to avoid duplicate key errors from race
    // conditions, stale snapshots, or partially-completed previous ticks.
    const { error: reversalInsertError } = await supabase.from('active_laws')
        .upsert({
            nation_id: nation.id,
            policy_id: policy.id,
            passed_tick: currentTick,
            proposed_by: null,
            effects_applied_through_tick: currentTick - 1,
            is_reversal: true,
            reversal_effects: reversalEffects
        }, { onConflict: 'nation_id,policy_id' });
    if (reversalInsertError) {
        console.error(`[reversePolicy] Failed to upsert reversal active_law for policy ${policy.id}:`, reversalInsertError.message);
    }
}

// ==================== FOUNDATIONAL BILL ENACTMENT ====================

async function enactFoundationalBill(supabase, bill, currentTick) {
    // Validate proposed_seats BEFORE marking the bill as passed
    let newTotalSeats = bill.proposed_seats;

    // Fallback: if proposed_seats is null (column missing or data lost), parse from preamble
    if (!newTotalSeats && bill.preamble) {
        const match = bill.preamble.match(/from\s+\d+\s+to\s+(\d+)/i);
        if (match) {
            newTotalSeats = parseInt(match[1], 10);
            console.warn(`[enactFoundationalBill] proposed_seats was null, recovered ${newTotalSeats} from preamble`);
        }
    }

    if (!newTotalSeats || newTotalSeats < 50 || newTotalSeats > 500) {
        console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_seats: ${newTotalSeats}. Marking as failed.`);
        await supabase.from('bills').update({
            status: 'failed',
            passed_tick: currentTick
        }).eq('id', bill.id);
        return false;
    }

    // Validation passed — mark bill as passed
    console.log(`[enactFoundationalBill] Bill ${bill.id}: proposed_seats=${newTotalSeats}. Marking as passed.`);
    await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);

    // Get current total seats to compute delta
    const { data: nationData } = await supabase
        .from('nations')
        .select('total_seats')
        .eq('id', bill.nation_id)
        .single();
    const currentTotalSeats = nationData?.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const delta = newTotalSeats - currentTotalSeats;

    // 1. Update nation's total_seats
    await supabase.from('nations').update({
        total_seats: newTotalSeats
    }).eq('id', bill.nation_id);

    if (delta !== 0) {
        // SEATS CHANGE — proportionally rescale all party seats to the new total
        let redistributed = false;

        // Attempt 1: use vote totals from last completed parliamentary election
        const { data: election } = await supabase
            .from('elections')
            .select('id, results')
            .eq('nation_id', bill.nation_id)
            .eq('status', 'completed')
            .eq('election_type', 'parliamentary')
            .order('election_tick', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (election?.results?.votes) {
            const votes = election.results.votes;
            const voteTotals = {};
            // Handle both array format (SQL RPC) and object format (JS simulation)
            if (Array.isArray(votes)) {
                for (const v of votes) voteTotals[v.party_id] = v.votes || 0;
            } else {
                for (const [pid, v] of Object.entries(votes)) voteTotals[pid] = v || 0;
            }
            if (Object.keys(voteTotals).length > 0) {
                const newSeats = allocateSeatsByVotes(voteTotals, newTotalSeats);
                for (const [partyId, seats] of Object.entries(newSeats)) {
                    const { error: seatErr } = await supabase.from('factions').update({ seats }).eq('id', partyId);
                    if (seatErr) {
                        console.error(`[enactFoundationalBill] Failed to update seats for faction ${partyId}:`, seatErr);
                        await supabase.from('nations').update({ total_seats: currentTotalSeats }).eq('id', bill.nation_id);
                        return false;
                    }
                }
                redistributed = true;
                console.log(`[enactFoundationalBill] Redistributed from election vote data.`);
            }
        }

        // Fallback: proportionally scale existing faction seats to fill the new total
        if (!redistributed) {
            console.warn(`[enactFoundationalBill] No election vote data found — scaling existing seats proportionally.`);
            const { data: factions } = await supabase
                .from('factions')
                .select('id, seats')
                .eq('nation_id', bill.nation_id)
                .eq('faction_type', 'party');

            if (factions && factions.length > 0) {
                const oldSum = factions.reduce((s, f) => s + (f.seats || 0), 0);
                if (oldSum > 0) {
                    // Use Largest Remainder to cleanly distribute newTotalSeats
                    const seatTotals = {};
                    for (const f of factions) seatTotals[f.id] = f.seats || 0;
                    const newSeats = allocateSeatsByVotes(seatTotals, newTotalSeats);
                    for (const [partyId, seats] of Object.entries(newSeats)) {
                        const { error: seatErr } = await supabase.from('factions').update({ seats }).eq('id', partyId);
                        if (seatErr) {
                            console.error(`[enactFoundationalBill] Failed to update seats for faction ${partyId}:`, seatErr);
                            await supabase.from('nations').update({ total_seats: currentTotalSeats }).eq('id', bill.nation_id);
                            return false;
                        }
                    }
                } else {
                    // All parties at 0 seats — distribute evenly
                    const perParty = Math.floor(newTotalSeats / factions.length);
                    let remainder = newTotalSeats - perParty * factions.length;
                    for (const f of factions) {
                        const seats = perParty + (remainder > 0 ? 1 : 0);
                        if (remainder > 0) remainder--;
                        const { error: seatErr } = await supabase.from('factions').update({ seats }).eq('id', f.id);
                        if (seatErr) {
                            console.error(`[enactFoundationalBill] Failed to update seats for faction ${f.id}:`, seatErr);
                            await supabase.from('nations').update({ total_seats: currentTotalSeats }).eq('id', bill.nation_id);
                            return false;
                        }
                    }
                }
            }
        }

        console.log(`[enactFoundationalBill] ${currentTotalSeats} -> ${newTotalSeats} (${delta > 0 ? '+' : ''}${delta}). Seats rescaled.`);
    } else {
        console.log(`[enactFoundationalBill] No seat change (already ${newTotalSeats}).`);
    }

    // Sync in-memory config so downstream logic in the same tick uses the new seat count
    initGameConfigForNation({ total_seats: newTotalSeats });

    // Legislative activity: boost gov_approval_events
    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');

    return true;
}

async function failBill(supabase, bill) {
    const { error } = await supabase.from('bills').update({
        status: 'failed'
    }).eq('id', bill.id);
    if (error) {
        console.error(`[failBill] Failed to mark bill ${bill.id} as failed:`, error.message);
    }
}

/**
 * Ensure ambassador rows stay in sync when confirmation bills are failed
 * through bulk/force-fail paths that bypass resolveExpiredVotes.
 */
async function syncAmbassadorsForFailedConfirmationBills(supabase, failedBills) {
    if (!Array.isArray(failedBills) || failedBills.length === 0) return;

    const ambassadorIds = [...new Set(
        failedBills
            .filter(b => b?.bill_type === 'confirmation' && b?.ambassador_id)
            .map(b => b.ambassador_id)
    )];

    if (ambassadorIds.length === 0) return;

    const { error } = await supabase
        .from('ambassadors')
        .update({
            status: 'rejected',
            is_active: false
        })
        .in('id', ambassadorIds);

    if (error) {
        console.warn('[syncAmbassadorsForFailedConfirmationBills] Failed to reject ambassadors:', error.message);
    }
}

async function syncFailedAmbassadorConfirmationBill(supabase, bill) {
    if (!bill || bill.bill_type !== 'confirmation' || !bill.ambassador_id) return;

    const { error } = await supabase
        .from('ambassadors')
        .update({
            status: 'rejected',
            is_active: false
        })
        .eq('id', bill.ambassador_id);

    if (error) {
        console.warn('[syncFailedAmbassadorConfirmationBill] Failed to reject ambassador:', error.message);
    }
}

async function syncFailedMinisterConfirmationBill(supabase, bill) {
    if (!bill || bill.bill_type !== 'minister_confirmation' || !bill.ministry_key) return;

    const { data: ministry, error: fetchErr } = await supabase
        .from('ministries')
        .select('id')
        .eq('nation_id', bill.nation_id)
        .eq('ministry_key', bill.ministry_key)
        .eq('is_active', true)
        .maybeSingle();

    if (fetchErr) {
        console.warn('[syncFailedMinisterConfirmationBill] Failed to fetch ministry row:', fetchErr.message);
        return;
    }
    if (!ministry) return;

    const { error: updateErr } = await supabase
        .from('ministries')
        .update({
            confirmation_status: 'rejected',
            pending_minister: null
        })
        .eq('id', ministry.id);

    if (updateErr) {
        console.warn('[syncFailedMinisterConfirmationBill] Failed to clear pending minister:', updateErr.message);
    }
}

async function syncMinistriesForFailedConfirmationBills(supabase, failedBills) {
    if (!Array.isArray(failedBills) || failedBills.length === 0) return;

    for (const bill of failedBills) {
        await syncFailedMinisterConfirmationBill(supabase, bill);
    }
}


// ==================== AMBASSADOR TERM LIMITS ====================

/**
 * Process ambassador retirements and warnings for a single nation.
 * Called once per nation per tick inside the advanceTick loop.
 *
 * 1. Retire ambassadors whose term has expired (current_tick - appointed_at_tick >= term_length).
 * 2. Cancel in-progress diplomatic proposals involving the retiring ambassador's nation pair.
 * 3. Appoint a replacement ambassador with a fresh 60-tick term.
 * 4. Fire event log entries for retirements and lapsed negotiations.
 * 5. Show retirement warning at (term_length - AMBASSADOR_RETIREMENT_WARNING) ticks.
 */
async function processAmbassadorRetirements(supabase, nation, currentTick) {
    const results = [];

    // Fetch all active ambassadors for this nation
    const { data: ambassadors, error: fetchErr } = await supabase
        .from('ambassadors')
        .select('id, nation_id, target_nation_id, faction_id, ambassador_first_name, ambassador_last_name, ambassador_age, appointed_at_tick, term_length, retirement_warning_shown')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .eq('status', 'active');

    if (fetchErr || !ambassadors || ambassadors.length === 0) return results;

    // Load target nation names for event messages
    const targetNationIds = [...new Set(ambassadors.map(a => a.target_nation_id))];
    const { data: targetNations } = await supabase
        .from('nations')
        .select('id, name')
        .in('id', targetNationIds);
    const nationNameMap = {};
    if (targetNations) targetNations.forEach(n => { nationNameMap[n.id] = n.name; });

    for (const amb of ambassadors) {
      try {
        const appointedTick = amb.appointed_at_tick;
        if (appointedTick == null) continue; // No term tracking — skip

        const termLength = amb.term_length || DIPLOMACY_CONFIG.AMBASSADOR_TERM_LENGTH;
        const ticksServed = currentTick - appointedTick;
        const ticksRemaining = termLength - ticksServed;
        const targetNationName = nationNameMap[amb.target_nation_id] || 'Unknown';
        const ambName = ((amb.ambassador_first_name || '') + ' ' + (amb.ambassador_last_name || '')).trim();

        // ---- RETIREMENT ----
        if (ticksServed >= termLength) {
            const yearsServed = Math.floor(ticksServed / 12);

            // 1. Retire the ambassador
            const { error: retireErr } = await supabase.from('ambassadors').update({
                status: 'recalled',
                is_active: false,
                recalled_at_tick: currentTick
            }).eq('id', amb.id);
            if (retireErr) {
                console.error(`[processAmbassadorRetirements] Failed to retire ${ambName}:`, retireErr);
                continue;
            }

            // 2. Cancel in-progress diplomatic proposals involving this nation pair
            const cancelStatuses = ['proposed', 'fm_review', 'ratification'];
            const { data: lapsedProposals } = await supabase
                .from('diplomatic_proposals')
                .select('id, proposal_type, proposal_data, proposing_nation_id, target_nation_id, proposing_bill_id, target_bill_id')
                .in('status', cancelStatuses)
                .or(`and(proposing_nation_id.eq.${nation.id},target_nation_id.eq.${amb.target_nation_id}),and(proposing_nation_id.eq.${amb.target_nation_id},target_nation_id.eq.${nation.id})`);

            if (lapsedProposals && lapsedProposals.length > 0) {
                const lapsedIds = lapsedProposals.map(p => p.id);
                await supabase.from('diplomatic_proposals')
                    .update({ status: 'expired', terminated_at_tick: currentTick })
                    .in('id', lapsedIds);

                // Cancel any linked ratification bills
                for (const lp of lapsedProposals) {
                    if (lp.proposing_bill_id) {
                        await supabase.from('bills')
                            .update({ status: 'failed' })
                            .eq('id', lp.proposing_bill_id)
                            .in('status', ['floor', 'committee']);
                    }
                    if (lp.target_bill_id) {
                        await supabase.from('bills')
                            .update({ status: 'failed' })
                            .eq('id', lp.target_bill_id)
                            .in('status', ['floor', 'committee']);
                    }
                }

                // Fire lapsed negotiation event for the OTHER nation
                await supabase.from('event_log').insert({
                    nation_id: amb.target_nation_id,
                    event_name: 'Diplomatic Negotiations Lapsed',
                    category: 'Diplomatic',
                    description_chosen: `${nation.name}'s ambassador has retired. ${lapsedProposals.length} pending negotiation(s) have lapsed. The new ambassador may re-propose if desired.`,
                    fired_at_tick: currentTick
                });
            }

            // 3. Generate replacement ambassador
            let newFirst, newLast;
            do { newFirst = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)]; }
            while (newFirst === amb.ambassador_first_name);
            do { newLast = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)]; }
            while (newLast === amb.ambassador_last_name);
            const newAge = 35 + Math.floor(Math.random() * 20); // 35-54

            const { error: insertErr } = await supabase.from('ambassadors').insert({
                nation_id: nation.id,
                target_nation_id: amb.target_nation_id,
                faction_id: amb.faction_id,
                ambassador_first_name: newFirst,
                ambassador_last_name: newLast,
                ambassador_age: newAge,
                status: 'active',
                is_active: true,
                appointed_at_tick: currentTick,
                term_length: DIPLOMACY_CONFIG.AMBASSADOR_TERM_LENGTH
            });
            if (insertErr) {
                console.error(`[processAmbassadorRetirements] Failed to create replacement for ${ambName}:`, insertErr);
                // Ambassador was already retired — continue without replacement
            }

            // 4. Fire retirement event for this nation
            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'Ambassador Retired',
                category: 'Diplomatic',
                description_chosen: `${ambName} has retired after ${yearsServed} year${yearsServed !== 1 ? 's' : ''} of service as Ambassador to ${targetNationName}.${insertErr ? '' : ` ${newFirst} ${newLast} has been appointed as replacement.`}`,
                fired_at_tick: currentTick
            });

            results.push({ ambassadorId: amb.id, name: ambName, target: targetNationName, action: 'retired', replacement: insertErr ? null : `${newFirst} ${newLast}` });
            console.log(`[processAmbassadorRetirements] ${ambName} retired from ${nation.name} → ${targetNationName}.${insertErr ? ' (replacement failed)' : ` Replaced by ${newFirst} ${newLast}.`}`);

        // ---- RETIREMENT WARNING (3 ticks before) ----
        } else if (ticksRemaining <= DIPLOMACY_CONFIG.AMBASSADOR_RETIREMENT_WARNING && !amb.retirement_warning_shown) {
            await supabase.from('ambassadors')
                .update({ retirement_warning_shown: true })
                .eq('id', amb.id);

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'Ambassador Retirement Approaching',
                category: 'Diplomatic',
                description_chosen: `Ambassador ${ambName} to ${targetNationName} will retire in ${ticksRemaining} tick${ticksRemaining !== 1 ? 's' : ''}. Conclude any active negotiations before the transition.`,
                fired_at_tick: currentTick
            });

            results.push({ ambassadorId: amb.id, name: ambName, target: targetNationName, action: 'warning' });
            console.log(`[processAmbassadorRetirements] Retirement warning for ${ambName} (${nation.name} → ${targetNationName}): ${ticksRemaining} ticks remaining.`);
        }
      } catch (ambErr) {
        console.error(`[processAmbassadorRetirements] Error processing ambassador ${amb.id}:`, ambErr);
      }
    }

    return results;
}

// ────────── elections ──────────


/**
 * Close the current administration for a nation.
 * Snapshots end stats, queries bills/crises during the admin's tenure, sets end fields.
 *
 * @param {object} supabase - Supabase client
 * @param {string} nationId - Nation UUID
 * @param {object} nation - Full nation row (for stat snapshot)
 * @param {string} endReason - Why the admin ended: 'election_loss', 'new_coalition', 'coalition_collapse', 'coup'
 * @param {number} currentTick - Current shard tick
 * @param {string} currentDate - Current game date string (e.g., "March, 2001")
 * @param {number|null} governmentApproval - Current government approval percentage
 */
async function closeAdministration(supabase, nationId, nation, endReason, currentTick, currentDate, governmentApproval) {
    try {
        // Find all currently open administrations (defensive against legacy duplicates)
        const { data: openAdmins, error: openAdminsErr } = await supabase
            .from('administrations')
            .select('*')
            .eq('nation_id', nationId)
            .is('ended_at_tick', null)
            .order('started_at_tick', { ascending: false })
            .order('created_at', { ascending: false });

        if (openAdminsErr) throw openAdminsErr;

        if (!openAdmins || openAdmins.length === 0) {
            console.warn('closeAdministration: No open administration found for nation', nationId);
            return;
        }

        if (openAdmins.length > 1) {
            console.warn('closeAdministration: duplicate open administrations detected', {
                event: 'duplicate_open_administrations',
                nation_id: nationId,
                open_count: openAdmins.length,
                open_admin_ids: openAdmins.map(a => a.id),
                resolution: 'closing_all_open_rows_with_consistent_end_fields',
                end_reason: endReason,
                end_tick: currentTick
            });
        }

        const statsAtEnd = snapshotNationStats(nation);

        for (const currentAdmin of openAdmins) {
            // Query bills passed during this administration
            const { data: passedBills, error: passedBillsErr } = await supabase
                .from('bills')
                .select('id, bill_name, passed_tick')
                .eq('nation_id', nationId)
                .eq('status', 'passed')
                .gte('passed_tick', currentAdmin.started_at_tick)
                .lte('passed_tick', currentTick);
            if (passedBillsErr) throw passedBillsErr;

            const billsPassed = (passedBills || []).map(b => ({
                bill_id: b.id,
                bill_name: b.bill_name,
                passed_tick: b.passed_tick
            }));

            // Query crises (events with category 'crisis' or matching crisis event names)
            const { data: eventsDuring, error: eventsErr } = await supabase
                .from('event_log')
                .select('event_id, event_name, category, fired_at_tick')
                .eq('nation_id', nationId)
                .gte('fired_at_tick', currentAdmin.started_at_tick)
                .lte('fired_at_tick', currentTick);
            if (eventsErr) throw eventsErr;

            const crisisEvents = (eventsDuring || []).filter(e =>
                e.category === 'crisis' || e.category === 'disaster' || e.category === 'conflict'
            );

            const crisesStarted = crisisEvents
                .filter(e => !e.event_name || !e.event_name.startsWith('CRISIS_RESOLVED:'))
                .map(e => ({
                    event_id: e.event_id,
                    title: e.event_name,
                    started_tick: e.fired_at_tick
                }));

            const crisesSolved = (eventsDuring || [])
                .filter(e => e.event_name && e.event_name.startsWith('CRISIS_RESOLVED:'))
                .map(e => ({
                    title: e.event_name.replace('CRISIS_RESOLVED: ', ''),
                    solved_tick: e.fired_at_tick
                }));

            // Count elections survived (elections that occurred during this admin where the coalition continued)
            const { data: electionsDuring, error: electionsErr } = await supabase
                .from('elections')
                .select('id, election_tick')
                .eq('nation_id', nationId)
                .eq('status', 'completed')
                .gte('election_tick', currentAdmin.started_at_tick)
                .lt('election_tick', currentTick);
            if (electionsErr) throw electionsErr;

            // Update the administration record
            const { error: updateErr } = await supabase
                .from('administrations')
                .update({
                    stats_at_end: statsAtEnd,
                    approval_at_end: governmentApproval,
                    ended_at_tick: currentTick,
                    ended_at_date: currentDate,
                    end_reason: endReason,
                    bills_passed: billsPassed,
                    laws_repealed: [],
                    crises_started: crisesStarted,
                    crises_solved: crisesSolved,
                    elections_survived: (electionsDuring || []).length,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentAdmin.id);
            if (updateErr) throw updateErr;

            console.log(`Administration closed: "${currentAdmin.admin_name}" — reason: ${endReason}`);
        }
    } catch (err) {
        console.error('closeAdministration error:', err);
        throw err;
    }
}

/**
 * Create a new administration record when a coalition forms.
 *
 * @param {object} supabase - Supabase client
 * @param {string} nationId - Nation UUID
 * @param {object} nation - Full nation row (for stat snapshot + HOS)
 * @param {object} coalition - Active coalition object (party_ids, lead_party_id)
 * @param {Array} allParties - Array of faction objects with id, faction_name, seats
 * @param {number} currentTick - Current shard tick
 * @param {string} currentDate - Current game date string
 * @param {number|null} governmentApproval - Current government approval percentage
 */
async function createAdministration(supabase, nationId, nation, coalition, allParties, currentTick, currentDate, governmentApproval) {
    try {
        // Safety net: close any orphaned open administrations before creating a new one
        const { data: orphaned } = await supabase
            .from('administrations')
            .select('id')
            .eq('nation_id', nationId)
            .is('ended_at_tick', null);
        if (orphaned && orphaned.length > 0) {
            console.warn(`createAdministration: closing ${orphaned.length} orphaned open administration(s) for nation ${nationId}`);
            await supabase
                .from('administrations')
                .update({ ended_at_tick: currentTick, ended_at_date: currentDate, end_reason: 'new_coalition' })
                .eq('nation_id', nationId)
                .is('ended_at_tick', null);
        }

        const statsAtStart = snapshotNationStats(nation);

        // Build coalition party info
        const coalitionPartyIds = coalition?.party_ids || [];
        const coalitionParties = coalitionPartyIds.map(pid => {
            const party = allParties.find(p => p.id === pid);
            return {
                party_id: pid,
                party_name: party?.faction_name || 'Unknown',
                seats: party?.seats || 0
            };
        });
        const totalSeats = coalitionParties.reduce((sum, p) => sum + p.seats, 0);

        // Get PM party info
        const leadPartyId = coalition?.lead_party_id;
        const leadParty = allParties.find(p => p.id === leadPartyId);
        const pmPartyName = leadParty?.faction_name || 'Unknown';

        // Get active PM name
        const { data: activeHOG } = await supabase
            .from('head_of_government')
            .select('first_name, last_name')
            .eq('nation_id', nationId)
            .eq('active', true)
            .maybeSingle();

        const pmName = activeHOG ? `${activeHOG.first_name} ${activeHOG.last_name}` : null;

        // Head of state name
        const hosName = (nation.head_of_state_first_name && nation.head_of_state_last_name)
            ? `${nation.head_of_state_first_name} ${nation.head_of_state_last_name}`
            : null;

        // Generate admin name from PM last name, falling back to HOS
        const adminName = activeHOG?.last_name
            ? `${activeHOG.last_name} Administration`
            : (nation.head_of_state_last_name
                ? `${nation.head_of_state_last_name} Administration`
                : `${pmPartyName} Administration`);

        const { error: insertErr } = await supabase
            .from('administrations')
            .insert({
                nation_id: nationId,
                admin_name: adminName,
                head_of_state: hosName,
                prime_minister: pmName,
                pm_party_name: pmPartyName,
                pm_party_id: leadPartyId,
                coalition_parties: coalitionParties,
                total_seats: totalSeats,
                government_type: getCanonicalGovernmentType(nation),
                started_at_tick: currentTick,
                started_at_date: currentDate,
                stats_at_start: statsAtStart,
                approval_at_start: governmentApproval
            });
        if (insertErr) throw insertErr;

        console.log(`Administration created: "${adminName}" at tick ${currentTick}`);
    } catch (err) {
        console.error('createAdministration error:', err);
        throw err;
    }
}

/**
 * Atomically close existing open administrations and create a new one.
 * Falls back to sequential close + create if RPC is unavailable.
 */
async function rolloverAdministration(supabase, nationId, nation, endReason, coalition, allParties, currentTick, currentDate, governmentApproval) {
    const statsAtStart = snapshotNationStats(nation);

    const coalitionPartyIds = coalition?.party_ids || [];
    const coalitionParties = coalitionPartyIds.map(pid => {
        const party = allParties.find(p => p.id === pid);
        return {
            party_id: pid,
            party_name: party?.faction_name || 'Unknown',
            seats: party?.seats || 0
        };
    });
    const totalSeats = coalitionParties.reduce((sum, p) => sum + p.seats, 0);

    const leadPartyId = coalition?.lead_party_id;
    const leadParty = allParties.find(p => p.id === leadPartyId);
    const pmPartyName = leadParty?.faction_name || 'Unknown';

    const { data: activeHOG, error: hogErr } = await supabase
        .from('head_of_government')
        .select('first_name, last_name')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();
    if (hogErr) throw hogErr;

    const pmName = activeHOG ? `${activeHOG.first_name} ${activeHOG.last_name}` : null;
    const hosName = (nation.head_of_state_first_name && nation.head_of_state_last_name)
        ? `${nation.head_of_state_first_name} ${nation.head_of_state_last_name}`
        : null;
    const adminName = activeHOG?.last_name
        ? `${activeHOG.last_name} Administration`
        : (nation.head_of_state_last_name
            ? `${nation.head_of_state_last_name} Administration`
            : `${pmPartyName} Administration`);

    const payload = {
        nation_id: nationId,
        admin_name: adminName,
        head_of_state: hosName,
        prime_minister: pmName,
        pm_party_name: pmPartyName,
        pm_party_id: leadPartyId,
        coalition_parties: coalitionParties,
        total_seats: totalSeats,
        government_type: getCanonicalGovernmentType(nation),
        started_at_tick: currentTick,
        started_at_date: currentDate,
        stats_at_start: statsAtStart,
        approval_at_start: governmentApproval
    };

    const { error: rpcErr } = await supabase.rpc('rollover_administration', {
        p_nation_id: nationId,
        p_end_reason: endReason,
        p_end_tick: currentTick,
        p_end_date: currentDate,
        p_end_approval: governmentApproval,
        p_new_administration: payload
    });

    if (!rpcErr) {
        console.log(`Administration rolled over atomically: "${adminName}" at tick ${currentTick}`);
        return;
    }

    // Graceful fallback if DB function has not been deployed yet
    const rpcUnavailable = /rollover_administration/i.test(rpcErr.message || '') || rpcErr.code === 'PGRST202';
    if (!rpcUnavailable) throw rpcErr;

    console.warn('rolloverAdministration RPC unavailable; falling back to sequential close + create');
    await closeAdministration(supabase, nationId, nation, endReason, currentTick, currentDate, governmentApproval);
    await createAdministration(supabase, nationId, nation, coalition, allParties, currentTick, currentDate, governmentApproval);
}


// ==================== COALITION DISSOLUTION ====================

/**
 * Dissolve the current coalition government.
 * - Sets government_formations status to 'dissolved'
 * - Deactivates PM in head_of_government
 * - Vacates all ministries
 * Nation enters formation period (processGovernmentVacancy handles penalties).
 */
async function dissolveCoalition(supabase, nationId, excludeFormationId) {
    // Bust coalition cache so pages immediately see the dissolved state
    if (typeof qCacheBust === 'function') qCacheBust('coalition_' + nationId);

    // Dissolve government_formations (skip the new formation if one is being created)
    let dissolveQuery = supabase
        .from('government_formations')
        .update({ status: 'dissolved' })
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker']);
    if (excludeFormationId) dissolveQuery = dissolveQuery.neq('id', excludeFormationId);
    const { error: formErr } = await dissolveQuery;
    if (formErr) console.warn('dissolveCoalition: formations update failed:', formErr);

    // Also dissolve legacy active_coalitions
    const { error: acErr } = await supabase
        .from('active_coalitions')
        .update({ status: 'dissolved', dissolved_at: new Date().toISOString() })
        .eq('nation_id', nationId)
        .is('dissolved_at', null);
    if (acErr) console.warn('dissolveCoalition: active_coalitions update failed:', acErr);

    // Deactivate PM
    const { error: pmErr } = await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('nation_id', nationId)
        .eq('active', true);
    if (pmErr) console.warn('dissolveCoalition: PM deactivation failed:', pmErr);

    // Vacate all ministries
    const { error: minErr } = await supabase
        .from('ministries')
        .update({
            minister_first_name: null,
            minister_last_name: null,
            minister_age: null,
            party_id: null
        })
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (minErr) console.warn('dissolveCoalition: ministry vacating failed:', minErr);
}


// ==================== NO-CONFIDENCE RESOLUTION ====================

/**
 * Resolve a passed or failed vote of no confidence.
 *
 * PASSED:
 *   - Coalition immediately dissolved (all ministries vacated, PM removed)
 *   - Calling party gets +3 approval
 *   - All coalition parties get -5 approval
 *   - Event logged
 *
 * FAILED:
 *   - Calling party gets -5 approval
 *   - PM's party gets +3 approval
 *   - 6-tick cooldown recorded
 *   - Event logged
 */
async function resolveNoConfidence(supabase, bill, passed, votesFor, votesAgainst, currentTick) {
    const callingPartyId = bill.proposed_by;
    const nationId = bill.nation_id;

    const { data: nation } = await supabase
        .from('nations')
        .select('name, government_type')
        .eq('id', nationId)
        .single();

    // Presidential systems do not have votes of no confidence
    if (isPresidentialRepublic(nation)) return;

    // Get PM's last name for event text
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('last_name, faction_id')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();

    const pmLastName = hog?.last_name || 'Unknown';
    const pmFactionId = hog?.faction_id || null;

    if (passed) {
        // Get coalition party IDs before dissolving
        const coalition = await fetchActiveCoalition(supabase, nationId);
        const coalitionPartyIds = coalition?.party_ids || [];

        // Guard: skip dissolution if coalition was already dissolved (e.g. by election on same tick)
        if (!coalition || coalition.status === 'dissolved') {
            console.warn('resolveNoConfidence: coalition already dissolved, skipping dissolution penalties');
        } else {
            // Close the current administration before dissolving
            try {
                const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
                const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                if (fullNation) {
                    await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || '', null);
                }
            } catch (adminErr) { console.warn('Could not close administration on no-confidence:', adminErr); }

            // Dissolve coalition
            await dissolveCoalition(supabase, nationId);

            // Calling party gets +3 momentum
            await adjustMomentumAll(supabase, nationId, callingPartyId, 3, 'no_confidence:success');

            // All coalition parties get -5 momentum
            for (const partyId of coalitionPartyIds) {
                await adjustMomentumAll(supabase, nationId, partyId, -5, 'no_confidence:coalition_falls');
            }

            // Schedule snap election (same pattern as early elections)
            await supabase.from('elections').delete()
                .eq('nation_id', nationId).eq('status', 'scheduled');
            await supabase.from('elections').insert({
                nation_id: nationId,
                election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
                status: 'scheduled',
                election_type: 'parliamentary'
            });

            // Freeze active bills (same as early elections)
            await supabase.from('bills')
                .update({ status: 'frozen' })
                .eq('nation_id', nationId)
                .in('status', ['committee', 'floor']);

            // Log event
            await supabase.from('event_log').insert({
                nation_id: nationId,
                event_name: 'No Confidence — Government Falls',
                fired_at_tick: currentTick,
                category: 'government',
                description_chosen: `The ${pmLastName} Government has fallen. A motion of no confidence passed ${votesFor} to ${votesAgainst}. Snap elections scheduled.`,
                effects_applied: { coalition_dissolved: true, caller_approval: +3, coalition_approval: -5, election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS, bills_frozen: true }
            });
        } // end else (coalition not already dissolved)

    } else {
        // FAILED: calling party gets -5 momentum
        await adjustMomentumAll(supabase, nationId, callingPartyId, -5, 'no_confidence:failed');

        // PM's party gets +3 momentum
        if (pmFactionId) {
            await adjustMomentumAll(supabase, nationId, pmFactionId, 3, 'no_confidence:pm_survives');
        }

        // Record cooldown: store the tick when the no-confidence failed
        await supabase.from('campaign_actions').insert({
            party_id: callingPartyId,
            nation_id: nationId,
            action_type: 'no_confidence_failed',
            tick_performed: currentTick,
            result: { votes_for: votesFor, votes_against: votesAgainst, pm_last_name: pmLastName }
        });

        // Log event
        await supabase.from('event_log').insert({
            nation_id: nationId,
            event_name: 'No Confidence — Motion Fails',
            fired_at_tick: currentTick,
            category: 'government',
            description_chosen: `Motion of no confidence against the ${pmLastName} Government failed ${votesFor} to ${votesAgainst}.`,
            effects_applied: { caller_approval: -5, pm_approval: +3 }
        });
    }
}


// ==================== EARLY ELECTIONS ====================

/**
 * Call for early elections (PM action).
 * Transitions government to caretaker, freezes legislation, schedules election in 2 ticks.
 *
 * @param {object} supabase    - Supabase client
 * @param {string} nationId    - Nation UUID
 * @param {string} pmFactionId - PM's faction UUID
 * @param {Array}  coalitionPartyIds - All coalition party IDs
 */
async function callEarlyElectionsAction(supabase, nationId, pmFactionId, coalitionPartyIds) {
    // Presidential systems cannot call early elections
    const { data: nationCheck } = await supabase.from('nations').select('government_type').eq('id', nationId).single();
    if (isPresidentialRepublic(nationCheck)) return { success: false, error: 'Presidential systems cannot call early elections' };

    // 0. Server-side guard: only proceed if coalition is still 'formed' (check both tables)
    let govStatus = null;
    const { data: activeGov } = await supabase
        .from('government_formations')
        .select('id, status')
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker'])
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (activeGov) {
        govStatus = activeGov.status;
    } else {
        // Fallback: check legacy active_coalitions
        const { data: legacyGov } = await supabase
            .from('active_coalitions')
            .select('id, status')
            .eq('nation_id', nationId)
            .is('dissolved_at', null)
            .order('formed_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        govStatus = legacyGov?.status || 'formed'; // legacy rows without status default to formed
    }

    if (govStatus === 'caretaker') {
        throw new Error('The government is already in caretaker mode.');
    }

    // 1. Get current tick
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    const currentTick = shard?.current_tick || 0;

    // 2. Set government to caretaker (both tables — legacy active_coalitions may be source)
    // Use status='formed' filter as optimistic lock — only one caller can transition formed→caretaker
    const { data: updatedGov, count: updatedCount } = await supabase
        .from('government_formations')
        .update({ status: 'caretaker' })
        .eq('nation_id', nationId)
        .in('status', ['formed'])
        .select('id');
    if (!updatedGov || updatedGov.length === 0) {
        throw new Error('Government was already changed by another action. Please refresh.');
    }
    await supabase
        .from('active_coalitions')
        .update({ status: 'caretaker' })
        .eq('nation_id', nationId)
        .is('dissolved_at', null);

    // 3. Apply approval penalties — PM party: -5, other coalition parties: -3
    // (After status transition so penalties aren't lost if transition fails)
    for (const partyId of coalitionPartyIds) {
        const penalty = partyId === pmFactionId
            ? GAME_CONFIG.EARLY_ELECTION_PM_APPROVAL_COST
            : GAME_CONFIG.EARLY_ELECTION_COALITION_APPROVAL_COST;
        await adjustMomentumAll(supabase, nationId, partyId, -penalty, 'early_election:penalty');
    }

    // Bust coalition cache after caretaker transition
    if (typeof qCacheBust === 'function') qCacheBust('coalition_' + nationId);

    // 4. Cancel any existing scheduled elections
    await supabase
        .from('elections')
        .delete()
        .eq('nation_id', nationId)
        .eq('status', 'scheduled');

    // 5. Schedule early election
    await supabase.from('elections').insert({
        nation_id: nationId,
        election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
        status: 'scheduled',
        election_type: 'parliamentary'
    });

    // 6. Freeze all active bills (committee and floor)
    await supabase
        .from('bills')
        .update({ status: 'frozen' })
        .eq('nation_id', nationId)
        .in('status', ['committee', 'floor']);

    // 7. Get PM name for event text
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('first_name, last_name')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();
    const pmName = hog ? `${hog.first_name} ${hog.last_name}` : 'The Prime Minister';

    // 8. Fire system event
    await supabase.from('event_log').insert({
        nation_id: nationId,
        event_name: 'Legislature Dissolved — Early Elections Called',
        fired_at_tick: currentTick,
        category: 'government',
        description_chosen: `Prime Minister ${pmName} has dissolved the Legislature. Caretaker government in place until elections.`,
        effects_applied: {
            caretaker: true,
            election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
            pm_approval: -GAME_CONFIG.EARLY_ELECTION_PM_APPROVAL_COST,
            coalition_approval: -GAME_CONFIG.EARLY_ELECTION_COALITION_APPROVAL_COST,
            bills_frozen: true
        }
    });

    return { success: true, electionTick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS };
}


// ==================== GOVERNMENT VACANCY & FORMATION ESCALATION ====================

/**
 * Process government vacancy with 3-stage escalation for parliamentary democracies.
 *
 * After an election with no majority party:
 *   Stage 0 — Formation window (ticks 1 to FORMATION_DEADLINE_TICKS):
 *     - Every tick: -2 momentum to ALL parties, -1 stability to nation
 *     - Tick 1: notification "Formation underway, N ticks to form coalition"
 *     - Tick (FORMATION_DEADLINE_TICKS - 1): warning "1 tick remaining"
 *
 *   Stage 1 — Snap election (at FORMATION_DEADLINE_TICKS, failed_formation_attempts < 1):
 *     - Top 2 parties by seats: -6 momentum each
 *     - Non-responsive coalition invitees: -3 momentum each
 *     - Snap election scheduled for next tick
 *     - failed_formation_attempts set to 1
 *
 *   Stage 2 — Emergency minority government (at FORMATION_DEADLINE_TICKS, failed_formation_attempts >= 1):
 *     - Largest party auto-installed as minority government
 *     - formation_type = 'emergency_minority' (permanent -20% legislative penalty)
 *     - failed_formation_attempts reset to 0
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {number} currentTick - Current tick number
 * @returns {Promise<object|null>} Summary of actions taken, or null if not applicable
 */
async function processGovernmentVacancy(supabase, nation, currentTick) {
    // Only applies to parliamentary democracies
    if (isAutocracy(nation)) return null;
    if (isPresidentialRepublic(nation)) return null;

    // Check for active coalition
    const coalition = await fetchActiveCoalition(supabase, nation.id);

    // Safety net: detect stale caretaker government with overdue election
    if (coalition && coalition.status === 'caretaker') {
        const { data: overdueElection } = await supabase
            .from('elections')
            .select('id, election_tick')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .lte('election_tick', currentTick)
            .order('election_tick', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (overdueElection) {
            const overdueBy = currentTick - overdueElection.election_tick;
            if (overdueBy >= 2) {
                await supabase.from('elections')
                    .update({ election_tick: currentTick + 1 })
                    .eq('id', overdueElection.id);
                console.log(`Safety net: rescheduled stale caretaker election ${overdueElection.id} to tick ${currentTick + 1} (was overdue by ${overdueBy} ticks)`);
            }
        }
        return null; // Caretaker is a valid government state
    }

    if (coalition) return null;

    // Get latest completed election (filter out records without results)
    const { data: election } = await supabase
        .from('elections')
        .select('id, election_tick, results')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .not('results', 'is', null)
        .order('election_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!election) return null;

    // Check if any party has outright majority (no coalition needed)
    const majoritySeatThreshold = Math.floor((nation.total_seats || GAME_CONFIG.TOTAL_SEATS) / 2) + 1;
    const votes = election.results?.votes || [];
    const majorityParty = votes.find(p => p.seats >= majoritySeatThreshold);
    if (majorityParty) return null;

    // Calculate ticks since election
    const ticksElapsed = currentTick - election.election_tick;
    if (ticksElapsed <= 0) return null;

    const result = {
        nation: nation.name,
        ticksElapsed,
        penaltiesApplied: true,
        approvalLoss: -2,
        stabilityLoss: -1
    };

    // ===== ONGOING PENALTIES (every tick during vacancy) =====
    const { data: allParties } = await supabase
        .from('factions')
        .select('id, faction_name, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party')
        .order('seats', { ascending: false });

    for (const party of (allParties || [])) {
        await adjustMomentumAll(supabase, nation.id, party.id, -2, 'government_vacancy:ongoing');
    }

    // -1 stability to nation
    const newStability = Math.max(0, (nation.stability ?? 50) - 1);
    await supabase.from('nations')
        .update({ stability: newStability })
        .eq('id', nation.id);
    nation.stability = newStability;

    console.log(`Government vacancy: ${nation.name} tick ${ticksElapsed}/${FORMATION_DEADLINE_TICKS} — all parties -2 momentum, nation -1 stability (→ ${newStability})`);

    // ===== FORMATION WINDOW NOTIFICATIONS =====
    if (ticksElapsed === 1) {
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'FORMATION_WINDOW_START',
            description_used: `Coalition formation underway in ${nation.name}. Parties have ${FORMATION_DEADLINE_TICKS} ticks to form a government.`,
            category: 'POLITICAL',
            effects_applied: { ticks_remaining: FORMATION_DEADLINE_TICKS, ongoing_penalty: -2 },
            fired_at_tick: currentTick
        }).then(({ error }) => {
            if (error) console.warn('Formation window start event log failed:', error.message);
        });
    } else if (ticksElapsed === FORMATION_DEADLINE_TICKS - 1) {
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'FORMATION_DEADLINE_WARNING',
            description_used: `1 tick remaining before emergency elections in ${nation.name}. Form a coalition now or face snap elections.`,
            category: 'POLITICAL',
            effects_applied: { ticks_remaining: 1 },
            fired_at_tick: currentTick
        }).then(({ error }) => {
            if (error) console.warn('Formation deadline warning event log failed:', error.message);
        });
    }

    // ===== ESCALATION CHECK =====
    if (ticksElapsed < FORMATION_DEADLINE_TICKS) {
        return result;
    }

    const failedAttempts = nation.failed_formation_attempts || 0;

    // ===== STAGE 1: SNAP ELECTION =====
    if (failedAttempts < 1) {
        console.log(`STAGE 1: SNAP ELECTION triggered for ${nation.name} — ${ticksElapsed} ticks without government (attempt ${failedAttempts + 1})`);

        // Top 2 parties: -6 momentum each
        if (allParties && allParties.length > 0) {
            const largest = allParties[0];
            await adjustMomentumAll(supabase, nation.id, largest.id, -6, 'formation_failure:top_party');
            console.log(`  Snap penalty: ${largest.faction_name} -6 momentum`);

            if (allParties.length > 1) {
                const second = allParties[1];
                await adjustMomentumAll(supabase, nation.id, second.id, -6, 'formation_failure:top_party');
                console.log(`  Snap penalty: ${second.faction_name} -6 momentum`);
            }
        }

        // Non-responsive invitee penalty: -3 momentum
        // Find parties invited to formations but never gave support
        const { data: formations } = await supabase
            .from('government_formations')
            .select('id, party_ids, proposed_by')
            .eq('election_id', election.id)
            .in('status', ['active', 'rejected', 'expired']);

        if (formations && formations.length > 0) {
            // Collect all invited parties (from party_ids, excluding the proposer)
            const invitedPartyIds = new Set();
            for (const f of formations) {
                for (const pid of (f.party_ids || [])) {
                    if (pid !== f.proposed_by) {
                        invitedPartyIds.add(pid);
                    }
                }
            }

            // Check which invitees gave support to ANY formation in this election
            const formationIds = formations.map(f => f.id);
            const { data: supportRecords } = await supabase
                .from('government_formation_support')
                .select('faction_id, supports')
                .in('formation_id', formationIds)
                .eq('supports', true);

            const respondedPartyIds = new Set((supportRecords || []).map(s => s.faction_id));

            // Penalize non-responsive invitees
            for (const pid of invitedPartyIds) {
                if (!respondedPartyIds.has(pid)) {
                    await adjustMomentumAll(supabase, nation.id, pid, -3, 'formation_failure:non_responsive');
                    const partyName = allParties?.find(p => p.id === pid)?.faction_name || pid;
                    console.log(`  Non-responsive penalty: ${partyName} -3 momentum`);
                }
            }
        }

        // Schedule snap election for next tick
        const { data: existingScheduled } = await supabase
            .from('elections')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .limit(1)
            .maybeSingle();

        if (existingScheduled) {
            await supabase.from('elections')
                .update({ election_tick: currentTick + 1 })
                .eq('id', existingScheduled.id);
            console.log(`  Moved existing scheduled election to tick ${currentTick + 1}`);
        } else {
            await supabase.from('elections').insert({
                nation_id: nation.id,
                election_tick: currentTick + 1,
                status: 'scheduled'
            });
            console.log(`  Scheduled snap election for tick ${currentTick + 1}`);
        }

        // Increment failed formation attempts
        await supabase.from('nations')
            .update({ failed_formation_attempts: failedAttempts + 1 })
            .eq('id', nation.id);
        nation.failed_formation_attempts = failedAttempts + 1;

        // Log event
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'FORMATION_SNAP_ELECTION',
            description_used: `Snap election called in ${nation.name} after coalition formation failed. Parties had ${FORMATION_DEADLINE_TICKS} ticks to negotiate.`,
            category: 'POLITICAL',
            effects_applied: {
                stage: 1,
                largest_party: allParties?.[0]?.faction_name,
                second_party: allParties?.[1]?.faction_name,
                top_party_penalty: -6,
                ticks_without_gov: ticksElapsed,
                failed_attempts: failedAttempts + 1
            },
            fired_at_tick: currentTick
        }).then(({ error }) => {
            if (error) console.warn('Formation snap election event log failed:', error.message);
        });

        // Fire system notification
        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'formation_snap_election',
                p_nation_id: nation.id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation.name,
                    ticks: String(ticksElapsed)
                }
            });
        } catch (e) {
            console.warn('fire_system_event (formation_snap_election) failed:', e.message);
        }

        result.snapElection = true;
        result.snapTick = currentTick + 1;
        result.stage = 1;
        return result;
    }

    // ===== STAGE 2: EMERGENCY MINORITY GOVERNMENT =====
    console.log(`STAGE 2: EMERGENCY MINORITY GOVERNMENT for ${nation.name} — second formation window expired`);

    // Identify largest party (tiebreak: higher total votes from election, then lower faction_id)
    const electionVotes = election.results?.votes || [];
    let largestParty = null;
    if (allParties && allParties.length > 0) {
        // Sort by seats DESC, then total_votes DESC, then faction_id ASC
        const partiesWithVotes = allParties.map(p => {
            const voteRecord = electionVotes.find(v => v.party_id === p.id);
            return { ...p, total_votes: voteRecord?.total_votes || 0 };
        });
        partiesWithVotes.sort((a, b) => {
            if (b.seats !== a.seats) return b.seats - a.seats;
            if (b.total_votes !== a.total_votes) return b.total_votes - a.total_votes;
            return a.id < b.id ? -1 : 1; // lower UUID first
        });
        largestParty = partiesWithVotes[0];
    }

    if (!largestParty) {
        console.error(`EMERGENCY MINORITY: No parties found for ${nation.name} — cannot form government`);
        return result;
    }

    console.log(`  Installing ${largestParty.faction_name} as emergency minority government`);

    // Create government_formations record
    const { data: emergencyGov, error: govError } = await supabase
        .from('government_formations')
        .insert({
            nation_id: nation.id,
            election_id: election.id,
            proposed_by: largestParty.id,
            party_ids: [largestParty.id],
            status: 'formed',
            formation_type: 'emergency_minority',
            formed_at: new Date().toISOString(),
            ministry_assignments: { prime_minister: largestParty.id }
        })
        .select()
        .single();

    if (govError) {
        console.error(`EMERGENCY MINORITY: Failed to create government formation for ${nation.name}:`, govError.message);
        return result;
    }

    // Set ruling faction
    await supabase.from('nations')
        .update({
            ruling_faction_id: largestParty.id,
            failed_formation_attempts: 0
        })
        .eq('id', nation.id);
    nation.failed_formation_attempts = 0;

    // Create administration record
    try {
        const coalitionObj = {
            id: emergencyGov.id,
            party_ids: [largestParty.id],
            lead_party_id: largestParty.id,
            ministry_allocations: { prime_minister: largestParty.id },
            status: 'formed',
            formation_type: 'emergency_minority'
        };
        await createAdministration(supabase, nation.id, nation, coalitionObj, allParties || [], currentTick, null, null);
    } catch (adminErr) {
        console.warn(`EMERGENCY MINORITY: Administration creation failed for ${nation.name}:`, adminErr.message);
    }

    // Log event
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'EMERGENCY_MINORITY_GOVERNMENT',
        description_used: `${largestParty.faction_name} installed as emergency minority government in ${nation.name} after two failed formation windows. Legislative effectiveness reduced by 20%.`,
        category: 'POLITICAL',
        effects_applied: {
            stage: 2,
            ruling_party: largestParty.faction_name,
            ruling_party_id: largestParty.id,
            formation_type: 'emergency_minority',
            legislative_penalty: '-20%'
        },
        fired_at_tick: currentTick
    }).then(({ error }) => {
        if (error) console.warn('Emergency minority government event log failed:', error.message);
    });

    // Fire system notification
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'emergency_minority_government',
            p_nation_id: nation.id,
            p_tick: currentTick,
            p_placeholders: {
                nation: nation.name,
                party: largestParty.faction_name
            }
        });
    } catch (e) {
        console.warn('fire_system_event (emergency_minority_government) failed:', e.message);
    }

    result.emergencyMinority = true;
    result.rulingParty = largestParty.faction_name;
    result.stage = 2;
    return result;
}


// ==================== TICK PROCESSOR ====================

// ==================== PARTIAL ELECTION (FOUNDATIONAL BILL) ====================

async function processPartialElection(supabase, nation, election, currentTick) {
    const deltaSeats = election.partial_seats;
    console.log(`Processing partial election for ${nation.name}: +${deltaSeats} new seats`);

    // 1. Load voter blocs
    const { data: blocs } = await supabase
        .from('voter_blocs').select('*')
        .eq('nation_id', nation.id).eq('is_active', true);

    if (!blocs || blocs.length === 0) {
        console.warn('No voter blocs found for partial election');
        await supabase.from('elections').update({ status: 'completed', results: { partial: true, error: 'no_blocs', bloc_details: [] } }).eq('id', election.id);
        return;
    }

    // 2. Scale bloc voter_counts to eligible_voters (same pattern as runElectionPreview)
    const eligibleVoters = nation.eligible_voters || 0;
    const totalBlocVoters = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    if (totalBlocVoters > 0 && eligibleVoters > 0) {
        const scale = eligibleVoters / totalBlocVoters;
        let scaledSum = 0;
        for (const b of blocs) {
            b.voter_count = Math.round((b.voter_count || 0) * scale);
            scaledSum += b.voter_count;
        }
        const diff = eligibleVoters - scaledSum;
        if (diff !== 0) {
            const largest = blocs.reduce((a, b) => (b.voter_count > a.voter_count ? b : a), blocs[0]);
            largest.voter_count += diff;
        }
    }

    // 3. Load parties with ideology axes
    const { data: factions } = await supabase
        .from('factions').select('id, faction_name, seats')
        .eq('nation_id', nation.id).eq('faction_type', 'party');

    if (!factions || factions.length === 0) {
        console.warn('No parties found for partial election');
        await supabase.from('elections').update({ status: 'completed', results: { partial: true, error: 'no_parties', bloc_details: [] } }).eq('id', election.id);
        return;
    }

    const factionIds = factions.map(f => f.id);
    const { data: ideologies } = await supabase
        .from('faction_ideology').select('*').in('faction_id', factionIds);
    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    const parties = factions.map(f => ({
        id: f.id, faction_name: f.faction_name,
        axes: ideoMap[f.id] || {
            liberty_equality: 0, tradition_progress: 0, security_freedom: 0,
            globalism_nationalism: 0, individualism_collectivism: 0
        }
    }));

    // 3b. Load per-bloc preference data
    const { data: fbaRows } = await supabase
        .from('faction_bloc_approval').select('faction_id, bloc_id, preference_score')
        .in('faction_id', factionIds);
    const allBlocApprovals = {};
    for (const row of (fbaRows || [])) {
        if (!allBlocApprovals[row.bloc_id]) allBlocApprovals[row.bloc_id] = {};
        allBlocApprovals[row.bloc_id][row.faction_id] = row.preference_score ?? 40;
    }

    // 4. Run election simulation for ONLY the delta seats
    const result = runElectionSimulation(blocs, parties, deltaSeats, allBlocApprovals);

    // 5. ADD delta seats to each party's existing seats
    for (const faction of factions) {
        const deltaForParty = result.seats[faction.id] || 0;
        const newTotal = (faction.seats || 0) + deltaForParty;
        await supabase.from('factions').update({ seats: newTotal }).eq('id', faction.id);
    }

    // 6. Build results and mark election as completed
    const seatResults = factions.map(f => ({
        party_id: f.id,
        party_name: f.faction_name,
        existing_seats: f.seats || 0,
        new_seats: result.seats[f.id] || 0,
        total_seats: (f.seats || 0) + (result.seats[f.id] || 0),
        votes: result.votes[f.id] || 0
    }));

    await supabase.from('elections').update({
        status: 'completed',
        results: {
            partial: true,
            delta_seats: deltaSeats,
            votes: seatResults,
            seats: seatResults,
            bloc_details: result.details,
            total_votes_cast: result.totalVotesCast,
            total_abstentions: result.totalAbstentions
        }
    }).eq('id', election.id);

    console.log(`Partial election completed: ${deltaSeats} new seats allocated across ${factions.length} parties`);
}

async function resolveManualElectionContext(supabase, nation, currentTick, requestedElectionType = null) {
    const governmentType = getCanonicalGovernmentType(nation);
    if (governmentType !== CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC) {
        return {
            governmentType,
            electionType: 'parliamentary',
            forcedOutsideSchedule: false,
            nextScheduledTick: null
        };
    }

    let electionType = requestedElectionType;
    if (!electionType) {
        const { data: dueScheduledElection } = await supabase
            .from('elections')
            .select('id, election_type')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .lte('election_tick', currentTick)
            .order('election_tick', { ascending: true })
            .limit(1)
            .maybeSingle();
        electionType = dueScheduledElection?.election_type || 'presidential';
    }

    const { data: nextScheduled } = await supabase
        .from('elections')
        .select('election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', electionType)
        .order('election_tick', { ascending: true })
        .limit(1)
        .maybeSingle();

    const nextScheduledTick = nextScheduled?.election_tick ?? null;
    return {
        governmentType,
        electionType,
        forcedOutsideSchedule: !!(nextScheduledTick && nextScheduledTick > currentTick),
        nextScheduledTick
    };
}

async function runManualElectionByGovernmentType(supabase, nation, options = {}) {
    if (!nation?.id) throw new Error('Nation is required');

    let currentTick;
    if (Number.isInteger(options.currentTick)) {
        currentTick = options.currentTick;
    } else {
        const { data: _shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        currentTick = _shard?.current_tick || 0;
    }

    const context = await resolveManualElectionContext(supabase, nation, currentTick, options.electionType);
    const isPresidential = context.governmentType === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC;
    const normalizedElectionType = context.electionType || 'parliamentary';

    // Resolve the target election record up-front so presidential endorsement snapshots
    // can be tied to a concrete election before vote resolution.
    const { data: scheduledElection } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', normalizedElectionType)
        .order('election_tick', { ascending: true })
        .limit(1)
        .maybeSingle();

    const targetElectionId = scheduledElection?.id || (await (async () => {
        const { data: inserted, error: insertErr } = await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: currentTick,
            election_type: normalizedElectionType,
            status: 'scheduled'
        }).select('id').single();
        if (insertErr) throw insertErr;
        return inserted.id;
    })());

    // Use candidate-based voting for presidential elections, party-based for parliamentary
    let electionResults;
    if (isPresidential && normalizedElectionType === 'presidential') {
        // Ensure candidates exist — generate for parties that have none
        const { data: allParties } = await supabase
            .from('factions')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party');

        if (allParties) {
            for (const party of allParties) {
                const { count } = await supabase
                    .from('pm_candidates')
                    .select('*', { count: 'exact', head: true })
                    .eq('nation_id', nation.id)
                    .eq('faction_id', party.id)
                    .eq('candidate_type', 'presidential');
                if (!count || count === 0) {
                    console.log(`Generating presidential candidates for faction ${party.id} (manual election)`);
                    await generatePresidentCandidates(supabase, nation.id, party.id, currentTick, 'presidential');
                }
            }
        }

        // Auto-select candidates for any party that hasn't chosen
        await autoSelectPresidentialCandidates(supabase, nation, currentTick);

        const { error: snapshotErr } = await supabase.rpc('snapshot_presidential_endorsements', {
            p_nation_id: nation.id,
            p_election_id: targetElectionId
        });
        if (snapshotErr) throw snapshotErr;

        const { data, error: runError } = await supabase.rpc('run_presidential_election', {
            p_nation_id: nation.id,
            p_election_id: targetElectionId
        });
        if (runError) throw runError;
        electionResults = data;
    } else {
        const { data, error: runError } = await supabase.rpc('run_election', { p_nation_id: nation.id, p_election_type: normalizedElectionType });
        if (runError) throw runError;
        electionResults = data;
    }

    // Create the election record (SQL RPCs no longer insert their own)
    let completedElectionId;
    await supabase.from('elections')
        .update({ status: 'completed', results: electionResults, election_tick: currentTick })
        .eq('id', targetElectionId);
    completedElectionId = targetElectionId;

    // Fetch the specific election we just completed (not a generic "most recent" query)
    const { data: completedElection, error: electionError } = await supabase
        .from('elections')
        .select('id, election_tick, election_type, results, created_at')
        .eq('id', completedElectionId)
        .single();
    if (electionError) throw electionError;

    // Sync seats for parliamentary elections only (presidential results have no seats)
    const seatResults = completedElection?.results?.seats || [];
    for (const r of seatResults) {
        await supabase
            .from('factions')
            .update({ seats: r.seats })
            .eq('id', r.party_id);
    }

    // Dissolve legislature — fail all pending bills (new parliament must re-propose)
    const { data: dissolvedBills } = await supabase.from('bills')
        .update({ status: 'failed' })
        .eq('nation_id', nation.id)
        .in('status', ['committee', 'floor'])
        .select('id, nation_id, bill_type, ambassador_id, ministry_key');
    await syncAmbassadorsForFailedConfirmationBills(supabase, dissolvedBills);
    await syncMinistriesForFailedConfirmationBills(supabase, dissolvedBills);

    if (isPresidential && normalizedElectionType === 'presidential') {
        // Fail bills on president's desk
        const { data: deskBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .eq('status', 'president_desk')
            .select('id, nation_id, bill_type, ambassador_id, ministry_key');
        await syncAmbassadorsForFailedConfirmationBills(supabase, deskBills);
        await syncMinistriesForFailedConfirmationBills(supabase, deskBills);
        await processPresidentialElectionResult(supabase, nation, completedElection, currentTick, completedElection.id);
    } else if (isPresidential && normalizedElectionType === 'parliamentary') {
        // Midterm parliamentary election — seats reshuffled, president stays
        console.log(`Manual midterm parliamentary election for ${nation.name} — president stays in office`);
    } else {
        // Parliamentary democracy: dissolve existing government after election
        const { data: frozenBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .eq('status', 'frozen')
            .select('id, nation_id, bill_type, ambassador_id, ministry_key');
        await syncAmbassadorsForFailedConfirmationBills(supabase, frozenBills);
        await syncMinistriesForFailedConfirmationBills(supabase, frozenBills);

        let existingGov = null;
        const { data: govFormation } = await supabase
            .from('government_formations')
            .select('id, status')
            .eq('nation_id', nation.id)
            .in('status', ['formed', 'caretaker'])
            .maybeSingle();
        if (govFormation) {
            existingGov = govFormation;
        } else {
            const { data: legacyGov } = await supabase
                .from('active_coalitions')
                .select('id, status')
                .eq('nation_id', nation.id)
                .is('dissolved_at', null)
                .maybeSingle();
            if (legacyGov) existingGov = legacyGov;
        }

        if (existingGov) {
            console.log(`Dissolving government after manual election for ${nation.name}`);

            try {
                const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
                const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                if (fullNation) {
                    await closeAdministration(supabase, nation.id, fullNation, 'dissolved', currentTick, shardData?.current_date || '', null);
                }
            } catch (adminErr) { console.warn('Could not close administration on manual election:', adminErr); }

            await supabase
                .from('government_formations')
                .update({ status: 'dissolved' })
                .eq('nation_id', nation.id)
                .in('status', ['formed', 'caretaker']);

            await supabase
                .from('active_coalitions')
                .update({ status: 'dissolved', dissolved_at: new Date().toISOString() })
                .eq('nation_id', nation.id)
                .is('dissolved_at', null);

            await supabase
                .from('head_of_government')
                .update({ active: false })
                .eq('nation_id', nation.id)
                .eq('active', true);

            await supabase
                .from('ministries')
                .update({
                    minister_first_name: null,
                    minister_last_name: null,
                    minister_age: null,
                    party_id: null
                })
                .eq('nation_id', nation.id)
                .eq('is_active', true);
        }
    }

    return {
        success: true,
        nationId: nation.id,
        governmentType: context.governmentType,
        electionType: normalizedElectionType,
        forcedOutsideSchedule: context.forcedOutsideSchedule,
        nextScheduledTick: context.nextScheduledTick,
        currentTick,
        completedElection,
        seatResults
    };
}

async function processElections(supabase, nation, currentTick) {
    if (isAutocracy(nation)) return [];

    const isPresidential = isPresidentialRepublic(nation);
    const results = [];

    const { data: dueElections } = await supabase
        .from('elections')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .lte('election_tick', currentTick);

    // For presidential systems, process parliamentary elections before presidential ones
    // so seats are allocated before we determine the popular vote winner
    const sorted = (dueElections || []).sort((a, b) => {
        const aType = a.election_type || 'parliamentary';
        const bType = b.election_type || 'parliamentary';
        if (aType === 'parliamentary' && bType === 'presidential') return -1;
        if (aType === 'presidential' && bType === 'parliamentary') return 1;
        return 0;
    });

    for (const election of sorted) {
        const electionType = election.election_type || 'parliamentary';
        console.log(`Processing ${electionType} election for ${nation.name} (tick ${currentTick})`);

        // Partial election — only allocate delta seats (from foundational bill)
        if (election.partial_seats && election.partial_seats > 0) {
            await processPartialElection(supabase, nation, election, currentTick);
            results.push({ electionId: election.id, nation: nation.name, partial: true, deltaSeats: election.partial_seats });
            continue;
        }

        // Auto-select presidential candidates for any party that hasn't chosen yet
        if (electionType === 'presidential') {
            await autoSelectPresidentialCandidates(supabase, nation, currentTick);
        }

        // Use candidate-based voting for presidential elections, party-based for parliamentary
        let data, error;
        if (electionType === 'presidential') {
            const { error: snapshotErr } = await supabase.rpc('snapshot_presidential_endorsements', {
                p_nation_id: nation.id,
                p_election_id: election.id
            });
            if (snapshotErr) {
                console.error(`Failed to snapshot presidential endorsements for ${nation.name}:`, snapshotErr);
                continue;
            }

            ({ data, error } = await supabase.rpc('run_presidential_election', {
                p_nation_id: nation.id,
                p_election_id: election.id
            }));
        } else {
            ({ data, error } = await supabase.rpc('run_election', { p_nation_id: nation.id, p_election_type: electionType }));
        }

        if (error) {
            console.error(`Election RPC failed (attempt 1) for ${nation.name}:`, error);
            // Retry once
            if (electionType === 'presidential') {
                ({ data, error } = await supabase.rpc('run_presidential_election', {
                    p_nation_id: nation.id,
                    p_election_id: election.id
                }));
            } else {
                ({ data, error } = await supabase.rpc('run_election', { p_nation_id: nation.id, p_election_type: electionType }));
            }

            if (error) {
                console.error(`Election RPC failed (attempt 2) for ${nation.name}:`, error);
                // If overdue, reschedule to next tick to prevent permanent stuck state
                if (election.election_tick < currentTick) {
                    await supabase.from('elections')
                        .update({ election_tick: currentTick + 1 })
                        .eq('id', election.id);
                    console.log(`Rescheduled overdue election ${election.id} to tick ${currentTick + 1}`);
                }
                continue;
            }
            console.log(`Election RPC succeeded on retry for ${nation.name}`);
        }

        // Mark the scheduled election record as completed with full results
        await supabase.from('elections')
            .update({ status: 'completed', results: data })
            .eq('id', election.id);

        // Use the specific election we just completed (not a generic "most recent" query
        // which could return a different election type processed earlier in this tick)
        const completedElection = { id: election.id, results: data };

        if (completedElection?.results?.seats) {
            for (const r of completedElection.results.seats) {
                await supabase
                    .from('factions')
                    .update({ seats: r.seats })
                    .eq('id', r.party_id);
            }
            console.log(`Seats synced to factions for ${nation.name}`);
        }

        // Dissolve legislature — fail all pending bills (new parliament must re-propose)
        const { data: dissolvedBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .in('status', ['committee', 'floor'])
            .select('id, nation_id, bill_type, ambassador_id, ministry_key');

        await syncAmbassadorsForFailedConfirmationBills(supabase, dissolvedBills);
        await syncMinistriesForFailedConfirmationBills(supabase, dissolvedBills);

        if (dissolvedBills?.length > 0) {
            console.log(`Dissolved ${dissolvedBills.length} pending bill(s) after election for ${nation.name}`);
        }

        // === PRESIDENTIAL SYSTEM: handle presidential vs parliamentary elections ===
        if (isPresidential && electionType === 'presidential') {
            // Fail any bills sitting on the outgoing president's desk
            const { data: deskBills } = await supabase.from('bills')
                .update({ status: 'failed' })
                .eq('nation_id', nation.id)
                .eq('status', 'president_desk')
                .select('id, nation_id, bill_type, ambassador_id, ministry_key');
            await syncAmbassadorsForFailedConfirmationBills(supabase, deskBills);
            await syncMinistriesForFailedConfirmationBills(supabase, deskBills);
            if (deskBills?.length > 0) {
                console.log(`Failed ${deskBills.length} bill(s) on president's desk after presidential election for ${nation.name}`);
            }

            await processPresidentialElectionResult(supabase, nation, completedElection, currentTick, election.id);
        } else if (isPresidential && electionType === 'parliamentary') {
            // Midterm parliamentary election — seats reshuffled, president stays, desk bills remain
            console.log(`Midterm parliamentary election for ${nation.name} — president stays in office`);
        } else {
            // === PARLIAMENTARY DEMOCRACY: dissolve existing government after election ===
            // After any election, the old government (whether 'formed' or 'caretaker')
            // must be dissolved so that processGovernmentVacancy can apply -2 approval
            // penalties until a new coalition is formed.
            let existingGov = null;
            let existingGovSource = null;
            const { data: govFormation } = await supabase
                .from('government_formations')
                .select('id, status')
                .eq('nation_id', nation.id)
                .in('status', ['formed', 'caretaker'])
                .maybeSingle();
            if (govFormation) {
                existingGov = govFormation;
                existingGovSource = 'government_formations';
            } else {
                const { data: legacyGov } = await supabase
                    .from('active_coalitions')
                    .select('id, status')
                    .eq('nation_id', nation.id)
                    .is('dissolved_at', null)
                    .maybeSingle();
                if (legacyGov) {
                    existingGov = legacyGov;
                    existingGovSource = 'active_coalitions';
                }
            }

            // Fail all frozen bills (from caretaker period) regardless of whether
            // an existing government row was found — bills may have been frozen by
            // early elections even if the government row was already cleaned up.
            const { data: frozenBills } = await supabase.from('bills')
                .update({ status: 'failed' })
                .eq('nation_id', nation.id)
                .eq('status', 'frozen')
                .select('id, nation_id, bill_type, ambassador_id, ministry_key');

            await syncAmbassadorsForFailedConfirmationBills(supabase, frozenBills);
            await syncMinistriesForFailedConfirmationBills(supabase, frozenBills);

            if (existingGov) {
                console.log(`Dissolving ${existingGov.status} government after election for ${nation.name} (source: ${existingGovSource})`);

                // Close the administration
                try {
                    const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
                    const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                    if (fullNation) {
                        await closeAdministration(supabase, nation.id, fullNation, 'dissolved', currentTick, shardData?.current_date || '', null);
                    }
                } catch (adminErr) { console.warn('Could not close administration on election:', adminErr); }

                // Dissolve government in BOTH tables
                await supabase
                    .from('government_formations')
                    .update({ status: 'dissolved' })
                    .eq('nation_id', nation.id)
                    .in('status', ['formed', 'caretaker']);

                await supabase
                    .from('active_coalitions')
                    .update({ status: 'dissolved', dissolved_at: new Date().toISOString() })
                    .eq('nation_id', nation.id)
                    .is('dissolved_at', null);

                // Deactivate PM
                await supabase
                    .from('head_of_government')
                    .update({ active: false })
                    .eq('nation_id', nation.id)
                    .eq('active', true);

                // Vacate all ministries
                await supabase
                    .from('ministries')
                    .update({
                        minister_first_name: null,
                        minister_last_name: null,
                        minister_age: null,
                        party_id: null
                    })
                    .eq('nation_id', nation.id)
                    .eq('is_active', true);
            }
        }

        results.push({
            electionId: election.id,
            nation: nation.name,
            electionType,
            result: data
        });
    }

    // === SCHEDULE NEXT ELECTIONS ===
    if (isPresidential) {
        await scheduleNextPresidentialElections(supabase, nation, currentTick);
    } else {
        const { data: futureElection } = await supabase
            .from('elections')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .gt('election_tick', currentTick)
            .limit(1)
            .maybeSingle();

        if (!futureElection) {
            const frequency = nation.election_frequency || 48;
            const nextTick = currentTick + frequency;

            await supabase.from('elections').insert({
                nation_id: nation.id,
                election_tick: nextTick,
                status: 'scheduled'
            });

            console.log(`Scheduled next election for ${nation.name} at tick ${nextTick}`);
        }
    }

    return results;
}

/**
 * Presidential election result: read candidate-level popular vote results
 * and inaugurate the winning candidate.
 */
async function processPresidentialElectionResult(supabase, nation, completedElection, currentTick, electionId = null) {
    let candidateResults = completedElection?.results?.presidential_candidates || [];
    if (candidateResults.length === 0) {
        console.warn(`No candidate vote data for presidential election in ${nation.name}`);
        return;
    }

    // Identify the outgoing president BEFORE deactivating (for incumbent win/loss effects)
    const { data: outgoingPresident } = await supabase
        .from('presidents')
        .select('id, faction_id, first_name, last_name, terms_served')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    // === RUNOFF SYSTEM ===
    // Round 1: Check if any candidate received >50% of total votes
    const totalVotes = completedElection?.results?.total_votes_cast || 0;
    const sortedRound1 = [...candidateResults].sort((a, b) => b.votes - a.votes);
    const topCandidate = sortedRound1[0];
    const topPct = totalVotes > 0 ? (topCandidate.votes / totalVotes) * 100 : 0;

    let winner;
    let wasRunoff = false;
    let runoffResults = null;
    const snappedEndorsements = completedElection?.results?.snapped_endorsements || [];
    let endorsementResolution = resolvePresidentialRunoffEndorsements({
        wasRunoff: false,
        round1Results: candidateResults,
        runoffCandidates: [],
        snappedEndorsements,
        compatibilityTable: completedElection?.results?.transfer_rate_compatibility || {}
    });

    if (topPct > 50 || candidateResults.length <= 2) {
        // Clear winner with majority — no runoff needed
        winner = topCandidate;
        endorsementResolution = resolvePresidentialRunoffEndorsements({
            wasRunoff: false,
            round1Results: candidateResults,
            runoffCandidates: [],
            snappedEndorsements,
            compatibilityTable: completedElection?.results?.transfer_rate_compatibility || {}
        });
        console.log(`Presidential election Round 1 winner: ${winner.candidate_name} (${winner.party_name}) with ${topPct.toFixed(1)}% — majority achieved (${nation.name})`);
    } else {
        // === RUNOFF: No majority — top 2 candidates advance ===
        wasRunoff = true;
        const runoffCandidates = sortedRound1.slice(0, 2);
        console.log(`Presidential election RUNOFF triggered for ${nation.name}: ${runoffCandidates[0].candidate_name} vs ${runoffCandidates[1].candidate_name} (top was ${topPct.toFixed(1)}%)`);

        // Delete all non-runoff candidates from pm_candidates so the RPC only sees 2
        const runoffCandidateIds = new Set(runoffCandidates.map(c => c.candidate_id));
        const { data: allPresidentialCandidates } = await supabase
            .from('pm_candidates')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('candidate_type', 'presidential');

        for (const pc of (allPresidentialCandidates || [])) {
            if (!runoffCandidateIds.has(pc.id)) {
                await supabase.from('pm_candidates').delete().eq('id', pc.id);
            }
        }

        // Run the presidential election RPC again with only the top 2
        const { data: runoffData, error: runoffErr } = await supabase.rpc('run_presidential_election', {
            p_nation_id: nation.id,
            p_election_id: completedElection.id
        });

        if (runoffErr) {
            console.error(`Runoff RPC failed for ${nation.name}:`, runoffErr);
            // Fallback: use round 1 winner
            winner = topCandidate;
        } else {
            runoffResults = runoffData?.presidential_candidates || [];
            endorsementResolution = resolvePresidentialRunoffEndorsements({
                wasRunoff: true,
                round1Results: candidateResults,
                runoffCandidates,
                snappedEndorsements,
                compatibilityTable: completedElection?.results?.transfer_rate_compatibility || {}
            });
            const runoffSorted = [...runoffResults].sort((a, b) => b.votes - a.votes);
            winner = runoffSorted[0] || topCandidate;
            console.log(`Runoff winner: ${winner.candidate_name} (${winner.party_name}) with ${winner.vote_percentage}% (${nation.name})`);

            // Update the election record with combined round data
            // Replace presidential_candidates with runoff results so the UI shows the final outcome
            const combinedResults = {
                ...completedElection.results,
                presidential_candidates: runoffResults,
                round_1_candidates: candidateResults,
                runoff_candidates: runoffResults,
                total_votes_cast: runoffData?.total_votes_cast || completedElection.results?.total_votes_cast,
                was_runoff: true,
                snapped_endorsements: endorsementResolution.endorsements,
                runoff_endorsement_summary: endorsementResolution.summary
            };
            const targetId = electionId || completedElection.id;
            const { error: runoffUpdateErr } = await supabase.from('elections')
                .update({ results: combinedResults })
                .eq('id', targetId);
            if (runoffUpdateErr) {
                console.error(`[PresElection] Failed to update election ${targetId} with runoff results for ${nation.name}:`, runoffUpdateErr.message);
            }
        }
    }

    console.log(`Presidential election winner: ${winner.candidate_name} (${winner.party_name}) with ${winner.votes} votes (${nation.name})`);

    // === INCUMBENT WIN/LOSS DETECTION ===
    const incumbentFactionId = outgoingPresident?.faction_id;
    const isIncumbentWin = incumbentFactionId && winner.faction_id === incumbentFactionId;
    const isIncumbentRunoffLoss = wasRunoff && incumbentFactionId && winner.faction_id !== incumbentFactionId;
    const isChallengerWin = incumbentFactionId && winner.faction_id !== incumbentFactionId;

    // Deactivate previous president
    const { error: deactErr } = await supabase
        .from('presidents')
        .update({ is_active: false })
        .eq('nation_id', nation.id)
        .eq('is_active', true);
    if (deactErr) {
        console.error(`[processPresidentialElectionResult] Failed to deactivate previous presidents for ${nation.name}:`, deactErr.message);
    }

    // Close previous administration
    try {
        const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        if (fullNation) {
            const endReason = isIncumbentWin ? 'reelection' : 'election_loss';
            await closeAdministration(supabase, nation.id, fullNation, endReason, currentTick, shardData?.current_date || '', null);
        }
    } catch (adminErr) { console.warn('Could not close administration on presidential election:', adminErr); }

    // Set ruling faction to the winner's party
    await supabase.from('nations')
        .update({ ruling_faction_id: winner.faction_id })
        .eq('id', nation.id);

    // Look up the winning candidate from pm_candidates by candidate_id
    console.log(`[PresElection] Looking up candidate ${winner.candidate_id} for ${winner.candidate_name} (${nation.name})`);
    const { data: winningCandidate, error: candErr } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', winner.candidate_id)
        .maybeSingle();
    if (candErr) console.warn(`[PresElection] Candidate lookup error for ${winner.candidate_id}:`, candErr.message);

    if (winningCandidate) {
        await inauguratePresident(supabase, winningCandidate, nation.id, winner.faction_id, currentTick, outgoingPresident);
        console.log(`President inaugurated: ${winner.candidate_name} (${winner.party_name})`);
    } else {
        // Fallback 1: candidate may have been cleaned up, try by faction
        console.warn(`[PresElection] Primary lookup returned null for candidate_id=${winner.candidate_id}, trying faction fallback`);
        const { data: fallbackCandidate } = await supabase
            .from('pm_candidates')
            .select('*')
            .eq('nation_id', nation.id)
            .eq('faction_id', winner.faction_id)
            .eq('candidate_type', 'presidential')
            .eq('selected', true)
            .limit(1)
            .maybeSingle();

        if (fallbackCandidate) {
            await inauguratePresident(supabase, fallbackCandidate, nation.id, winner.faction_id, currentTick, outgoingPresident);
            console.log(`President inaugurated (fallback): ${fallbackCandidate.first_name} ${fallbackCandidate.last_name} (${winner.party_name})`);
        } else {
            // Fallback 2: generate fresh candidate
            console.warn(`[PresElection] Faction fallback also null for ${winner.candidate_name} in ${nation.name} — generating emergency candidate`);
            const emergencyCandidates = await generatePresidentCandidates(supabase, nation.id, winner.faction_id, currentTick, 'presidential');
            if (emergencyCandidates && emergencyCandidates.length > 0) {
                await inauguratePresident(supabase, emergencyCandidates[0], nation.id, winner.faction_id, currentTick, outgoingPresident);
                console.log(`Emergency president inaugurated: ${emergencyCandidates[0].first_name} ${emergencyCandidates[0].last_name}`);
            } else {
                // Fallback 3 (last resort): create president directly from election result data
                // This ensures a president is ALWAYS created after a presidential election
                console.error(`[PresElection] ALL candidate lookups failed for ${winner.candidate_name} in ${nation.name} — direct inauguration from election data`);
                const directCandidate = {
                    first_name: winner.candidate_name?.split(' ')[0] || 'Unknown',
                    last_name: winner.candidate_name?.split(' ').slice(1).join(' ') || 'President',
                    age: 50,
                    ideology: winner.ideology || 'PROGRESS',
                    trait_key: winner.trait_key || null,
                    ideology_axis: 'tradition_progress',
                    ideology_direction: 1
                };
                await inauguratePresident(supabase, directCandidate, nation.id, winner.faction_id, currentTick, outgoingPresident);
                console.log(`Direct president inaugurated from election data: ${directCandidate.first_name} ${directCandidate.last_name}`);
            }
        }
    }

    // === VACATE NON-PRESIDENT-PARTY MINISTERS (new administration) ===
    if (isChallengerWin) {
        try {
            const { error: vacateErr } = await supabase
                .from('ministries')
                .update({
                    party_id: null,
                    minister_first_name: null,
                    minister_last_name: null,
                    minister_age: null
                })
                .eq('nation_id', nation.id)
                .eq('is_active', true)
                .neq('party_id', winner.faction_id);

            if (vacateErr) {
                console.warn(`[PresElection] Failed to vacate non-president ministers for ${nation.name}:`, vacateErr.message);
            } else {
                console.log(`[PresElection] Vacated non-${winner.party_name} ministers for new administration in ${nation.name}`);
            }
        } catch (vacateErr) {
            console.warn('[PresElection] Error vacating ministers:', vacateErr);
        }
    }

    // === WINNER/LOSER EFFECTS ===
    try {
        const { data: nationStats } = await supabase.from('nations')
            .select('stability, legitimacy, happiness, civil_unrest')
            .eq('id', nation.id).single();

        if (nationStats) {
            const updates = {};
            if (isIncumbentWin) {
                // Incumbent wins: +3 legitimacy, +2 stability (mandate renewed)
                updates.legitimacy = Math.min(100, Math.round(((nationStats.legitimacy || 50) + 3) * 10) / 10);
                updates.stability = Math.min(100, Math.round(((nationStats.stability || 50) + 2) * 10) / 10);
                console.log(`Incumbent win effects: +3 legitimacy, +2 stability (${nation.name})`);
            } else if (isChallengerWin && !wasRunoff) {
                // Challenger wins (no runoff): transition effects
                updates.stability = Math.max(0, Math.round(((nationStats.stability || 50) - 2) * 10) / 10);
                updates.civil_unrest = Math.min(100, Math.round(((nationStats.civil_unrest || 0) + 3) * 10) / 10);
                updates.happiness = Math.min(100, Math.round(((nationStats.happiness || 50) + 1) * 10) / 10);
                console.log(`Challenger win effects: -2 stability, +3 civil_unrest, +1 happiness (${nation.name})`);
            } else if (isIncumbentRunoffLoss) {
                // Incumbent loses in runoff: extra penalties (contested transition)
                updates.stability = Math.max(0, Math.round(((nationStats.stability || 50) - 4) * 10) / 10);
                updates.legitimacy = Math.max(0, Math.round(((nationStats.legitimacy || 50) - 2) * 10) / 10);
                updates.civil_unrest = Math.min(100, Math.round(((nationStats.civil_unrest || 0) + 5) * 10) / 10);
                updates.happiness = Math.min(100, Math.round(((nationStats.happiness || 50) + 2) * 10) / 10);
                console.log(`Incumbent runoff loss effects: -4 stability, -2 legitimacy, +5 civil_unrest, +2 happiness (${nation.name})`);
            }

            if (Object.keys(updates).length > 0) {
                await supabase.from('nations').update(updates).eq('id', nation.id);
            }
        }

        // Momentum effects: incumbent win boosts their faction, challenger win penalizes losing incumbent faction
        if (isIncumbentWin && incumbentFactionId) {
            await adjustMomentumAll(supabase, nation.id, incumbentFactionId, 3, 'election:incumbent_win');
            console.log(`Incumbent re-elected: +3 momentum to ${winner.party_name}`);
        } else if (isChallengerWin && incumbentFactionId) {
            await adjustMomentumAll(supabase, nation.id, incumbentFactionId, -5, 'election:incumbent_loss');
            await adjustMomentumAll(supabase, nation.id, winner.faction_id, 3, 'election:challenger_win');
            console.log(`Challenger wins: -5 momentum to outgoing party, +3 to ${winner.party_name}`);
        }
    } catch (effectsErr) { console.warn('Could not apply winner/loser effects:', effectsErr); }

    // Clean up all presidential candidates after election
    await supabase.from('pm_candidates').delete()
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential');

    // Sort for runner-up info in event
    const sorted = [...candidateResults].sort((a, b) => b.votes - a.votes);

    // Fire system event
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'presidential_election',
            p_nation_id: nation.id,
            p_tick: currentTick,
            p_placeholders: {
                nation: nation.name,
                winning_party: winner.party_name,
                winning_candidate: winner.candidate_name,
                votes: winner.votes,
                vote_percentage: winner.vote_percentage || '?',
                runner_up: sorted[1]?.candidate_name || 'N/A',
                runner_up_party: sorted[1]?.party_name || 'N/A',
                was_runoff: wasRunoff ? 'true' : 'false',
                incumbent_win: isIncumbentWin ? 'true' : 'false'
            }
        });
    } catch (e) { console.warn('Presidential election event fire failed (non-blocking):', e); }

    // Proactively schedule next elections (instead of relying on processPresidentialTermEnd safety net)
    try {
        await scheduleNextPresidentialElections(supabase, nation, currentTick);
    } catch (e) { console.warn('Could not schedule next presidential elections:', e); }
}

function resolvePresidentialRunoffEndorsements({ wasRunoff, round1Results = [], runoffCandidates = [], snappedEndorsements = [], compatibilityTable = {} }) {
    const runoffCandidateIds = new Set((runoffCandidates || []).map(c => c.candidate_id));
    const round1ByFaction = new Map((round1Results || []).map(c => [c.faction_id, c]));
    const candidateTotals = {};
    for (const c of (runoffCandidates || [])) {
        candidateTotals[c.candidate_id] = { transfer_votes: 0, protest_votes: 0 };
    }

    const resolved = (snappedEndorsements || []).map(raw => {
        const item = { ...raw };
        if ((item.status || 'PENDING') !== 'PENDING') return item;
        if (!wasRunoff) return { ...item, status: 'VOID', void_reason: 'no_runoff' };
        const endorsing = round1ByFaction.get(item.endorsing_faction_id);
        if (!endorsing) return { ...item, status: 'VOID', void_reason: 'endorsing_not_found' };
        if (runoffCandidateIds.has(endorsing.candidate_id)) return { ...item, status: 'VOID', void_reason: 'endorsing_party_in_runoff' };
        if (!runoffCandidateIds.has(item.endorsed_candidate_id)) return { ...item, status: 'VOID', void_reason: 'endorsed_eliminated' };

        const compKey = item.compatibility || item.compatibility_tier || item.relationship || 'neutral';
        const transferRate = Math.max(0, Math.min(1,
            Number(item.transfer_rate ?? compatibilityTable[compKey] ?? compatibilityTable.neutral ?? 0.65)
        ));
        const baseVotes = Math.max(0, Number(endorsing.votes || 0));
        const transferVotes = Math.round(baseVotes * transferRate);
        const protestVotes = Math.max(0, baseVotes - transferVotes);

        const otherRunoffId = (runoffCandidates || []).find(c => c.candidate_id !== item.endorsed_candidate_id)?.candidate_id || null;
        const protestSplit = item.protest_split || {};
        const endorsedProtestRate = Math.max(0, Math.min(1, Number(protestSplit.endorsed ?? 0.5)));
        const otherProtestRate = Math.max(0, Math.min(1, Number(protestSplit.other ?? (1 - endorsedProtestRate))));
        const abstainRate = Math.max(0, 1 - endorsedProtestRate - otherProtestRate);

        if (candidateTotals[item.endorsed_candidate_id]) {
            candidateTotals[item.endorsed_candidate_id].transfer_votes += transferVotes;
            candidateTotals[item.endorsed_candidate_id].protest_votes += Math.round(protestVotes * endorsedProtestRate);
        }
        if (otherRunoffId && candidateTotals[otherRunoffId]) {
            candidateTotals[otherRunoffId].protest_votes += Math.round(protestVotes * otherProtestRate);
        }

        return {
            ...item,
            status: 'RESOLVED',
            transfer_votes: transferVotes,
            protest_votes: protestVotes,
            protest_abstain_votes: Math.round(protestVotes * abstainRate)
        };
    });

    const summary = {
        total_transfer_votes: Object.values(candidateTotals).reduce((s, v) => s + v.transfer_votes, 0),
        total_protest_votes: Object.values(candidateTotals).reduce((s, v) => s + v.protest_votes, 0),
        candidate_totals: candidateTotals
    };
    return { endorsements: resolved, summary };
}

/**
 * Inaugurate a president from a candidate record. Creates the president row,
 * applies ideology shift, applies trait effects, and creates an administration.
 * Used by both processPresidentialElectionResult (auto-inauguration) and
 * selectPresidentCandidate (manual/legacy selection).
 */
async function inauguratePresident(supabase, candidate, nationId, factionId, currentTick, outgoingPresident = null) {
    // Deactivate any previous president
    const { error: deactErr } = await supabase.from('presidents')
        .update({ is_active: false })
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (deactErr) {
        console.error(`[inauguratePresident] Failed to deactivate previous presidents for ${nationId}:`, deactErr.message);
    }

    // Look up trait data for trait_upside / trait_downside
    const { data: trait } = await supabase.from('leader_traits').select('*').eq('trait_key', candidate.trait_key).maybeSingle();

    // Determine terms_served: if re-elected (same person), increment; otherwise start at 1
    let termsServed = 1;
    if (outgoingPresident &&
        outgoingPresident.first_name === candidate.first_name &&
        outgoingPresident.last_name === candidate.last_name &&
        outgoingPresident.faction_id === factionId) {
        termsServed = (outgoingPresident.terms_served || 1) + 1;
        console.log(`President re-elected: ${candidate.first_name} ${candidate.last_name} — term ${termsServed}`);
    }

    // Insert president record (with trait_upside / trait_downside populated)
    const { error: presErr } = await supabase.from('presidents').insert({
        nation_id: nationId,
        faction_id: factionId,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        age: candidate.age,
        ideology: candidate.ideology,
        trait: candidate.trait_key,
        trait_upside: trait?.upside || null,
        trait_downside: trait?.downside || null,
        elected_tick: currentTick,
        term_ends_tick: currentTick + GAME_CONFIG.PRESIDENTIAL_TERM_TICKS,
        is_active: true,
        terms_served: termsServed
    });
    if (presErr) throw presErr;

    // Apply ideology shift (+15 on candidate's axis)
    const axisKey = candidate.ideology_axis;
    const direction = candidate.ideology_direction;
    if (axisKey && typeof direction === 'number') {
        const shift = 15 * direction;
        let factionIdeology = await loadFactionIdeology(supabase, factionId);
        if (factionIdeology?._error) factionIdeology = null;
        if (factionIdeology) {
            const currentVal = factionIdeology[axisKey] || 0;
            const newVal = Math.max(-100, Math.min(100, currentVal + shift));
            await supabase.from('faction_ideology').update({ [axisKey]: newVal }).eq('faction_id', factionId);
            console.log(`President ideology shift: ${axisKey} ${currentVal} → ${newVal} (${shift > 0 ? '+' : ''}${shift})`);
        }
    }

    // Apply trait effects (same logic as PM)
    if (trait?.effects) {
        if (trait.effects.on_appoint_stability) {
            const { data: nationRow } = await supabase.from('nations').select('stability').eq('id', nationId).single();
            if (nationRow) {
                const newStability = Math.max(0, Math.min(100, (nationRow.stability || 50) + trait.effects.on_appoint_stability));
                await supabase.from('nations').update({ stability: newStability }).eq('id', nationId);
            }
        }
    }

    // Get faction info for administration record
    const { data: faction } = await supabase.from('factions').select('faction_name, seats, approval_rating').eq('id', factionId).single();
    const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
    const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();

    // For presidential systems, fetch latest parliamentary election seats (more reliable than faction.seats)
    let presidentPartySeats = faction?.seats || 0;
    if (!presidentPartySeats) {
        const { data: latestParl } = await supabase
            .from('elections')
            .select('results')
            .eq('nation_id', nationId)
            .eq('status', 'completed')
            .eq('election_type', 'parliamentary')
            .order('election_tick', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (latestParl?.results?.votes) {
            const entry = latestParl.results.votes.find(v => v.party_id === factionId);
            presidentPartySeats = entry?.total_seats || entry?.seats || 0;
        } else if (latestParl?.results?.seats) {
            const entry = latestParl.results.seats.find(s => s.party_id === factionId);
            presidentPartySeats = entry?.total_seats || entry?.seats || 0;
        }
    }

    // Parse year safely from current_date (handles formats like "Month Day, Year" or just "Year")
    const dateStr = shardData?.current_date || '';
    const yearMatch = dateStr.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : '';

    // Create new administration
    await supabase.from('administrations').insert({
        nation_id: nationId,
        admin_name: `${candidate.last_name} Administration${year ? ', ' + year : ''}`,
        head_of_state: `${candidate.first_name} ${candidate.last_name}`,
        president_name: `${candidate.first_name} ${candidate.last_name}`,
        president_party_id: factionId,
        president_party_name: faction?.faction_name || '',
        coalition_parties: [{ party_id: factionId, party_name: faction?.faction_name || '', seats: presidentPartySeats }],
        total_seats: presidentPartySeats,
        government_type: 'Presidential',
        started_at_tick: currentTick,
        started_at_date: dateStr,
        stats_at_start: fullNation ? snapshotNationStats(fullNation) : {},
        approval_at_start: faction?.approval_rating ?? 50
    });

    return candidate;
}

/**
 * Schedule next presidential + parliamentary elections independently.
 * Presidential every PRESIDENTIAL_TERM_TICKS, parliamentary every PARLIAMENTARY_TERM_TICKS.
 */
async function scheduleNextPresidentialElections(supabase, nation, currentTick) {
    // Check for future parliamentary election
    const { data: futureParl } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'parliamentary')
        .gt('election_tick', currentTick)
        .limit(1)
        .maybeSingle();

    if (!futureParl) {
        const nextParl = currentTick + GAME_CONFIG.PARLIAMENTARY_TERM_TICKS;
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: nextParl,
            election_type: 'parliamentary',
            status: 'scheduled'
        });
        console.log(`Scheduled next parliamentary election for ${nation.name} at tick ${nextParl}`);
    }

    // Check for future presidential election
    const { data: futurePres } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .gt('election_tick', currentTick)
        .limit(1)
        .maybeSingle();

    if (!futurePres) {
        const nextPres = currentTick + GAME_CONFIG.PRESIDENTIAL_TERM_TICKS;
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: nextPres,
            election_type: 'presidential',
            status: 'scheduled'
        });
        console.log(`Scheduled next presidential election for ${nation.name} at tick ${nextPres}`);
    }
}

// ────────── presidential ──────────


/** Tally floor votes from bill_support records (already loaded via join). */
function tallyFloorVotes(bill) {
    let votesFor = 0, votesAgainst = 0, votesAbstain = 0;
    for (const s of (bill.bill_support || [])) {
        const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
        if (stance === 'yes') votesFor += (s.seat_count || 0);
        else if (stance === 'no') votesAgainst += (s.seat_count || 0);
        else if (stance === 'abstain') votesAbstain += (s.seat_count || 0);
    }
    return { votesFor, votesAgainst, votesAbstain };
}

/**
 * Generate 3 president candidates for a party (reuses PM candidate generation pattern).
 * Candidates are stored in pm_candidates table with candidate_type = 'presidential';
 * select-candidate.html?role=president reads them.
 *
 * @param {string} candidateType - 'presidential' (default)
 */
async function generatePresidentCandidates(supabase, nationId, factionId, currentTick, candidateType = 'presidential') {
    let factionIdeology = await loadFactionIdeology(supabase, factionId);
    if (factionIdeology?._error) factionIdeology = null;

    // Clear any existing unselected presidential candidates for this faction
    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('candidate_type', 'presidential')
        .eq('selected', false);

    const weightedIdeologies = getWeightedIdeologies(factionIdeology);

    const chosenIdeologies = [];
    const availableIdeologies = [...weightedIdeologies];
    for (let i = 0; i < 3; i++) {
        const pick = weightedRandomPick(availableIdeologies);
        chosenIdeologies.push(pick.item);
        const sameAxis = availableIdeologies.filter(
            wi => wi.item.axisKey === pick.item.axisKey
        );
        sameAxis.forEach(sa => {
            const idx = availableIdeologies.indexOf(sa);
            if (idx >= 0) availableIdeologies.splice(idx, 1);
        });
    }

    const shuffledTraits = [...PM_TRAIT_KEYS].sort(() => Math.random() - 0.5);
    const chosenTraits = shuffledTraits.slice(0, 3);

    const usedFirstNames = new Set();
    const usedLastNames = new Set();
    const candidates = [];

    for (let i = 0; i < 3; i++) {
        let firstName, lastName;

        do { firstName = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)]; }
        while (usedFirstNames.has(firstName));
        usedFirstNames.add(firstName);

        do { lastName = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)]; }
        while (usedLastNames.has(lastName));
        usedLastNames.add(lastName);

        const age = 35 + Math.floor(Math.random() * 16); // Presidents: age 35-50
        const ideology = chosenIdeologies[i];

        candidates.push({
            nation_id: nationId,
            faction_id: factionId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            ideology: ideology.tag,
            ideology_axis: ideology.axisKey,
            ideology_direction: ideology.direction,
            trait_key: chosenTraits[i],
            created_at_tick: currentTick,
            candidate_type: candidateType,
            selected: false
        });
    }

    const { data, error } = await supabase
        .from('pm_candidates')
        .insert(candidates)
        .select();

    if (error) {
        console.error('Error generating president candidates:', error);
        throw error;
    }

    console.log(`Generated 3 president candidates for faction ${factionId}`);
    return data;
}

/**
 * Select a presidential nominee BEFORE the election. Marks the candidate as selected
 * and deletes the other options. The actual inauguration happens automatically when
 * the election resolves via processPresidentialElectionResult → inauguratePresident.
 */
async function selectPresidentCandidate(supabase, candidateId, nationId, factionId, currentTick) {
    const { data: candidate, error: fetchErr } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

    if (fetchErr || !candidate) throw new Error('Candidate not found');
    if (candidate.faction_id !== factionId) throw new Error('Not your candidate');

    // Mark selected, delete others for this faction
    await supabase.from('pm_candidates').update({ selected: true }).eq('id', candidateId);
    await supabase.from('pm_candidates').delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('candidate_type', 'presidential')
        .eq('selected', false);

    console.log(`Presidential nominee selected: ${candidate.first_name} ${candidate.last_name} (${candidate.trait_key}) for faction ${factionId}`);
    return candidate;
}


// ==================== PRESIDENTIAL MINISTER NOMINATION ====================

/**
 * President nominates a minister for a cabinet slot.
 * Writes pending data to the ministries table and creates a confirmation bill.
 * Parliament votes simple majority.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string} presidentFactionId - The president's faction (must match active president)
 * @param {string} ministryKey - Which ministry slot (e.g. 'defense', 'finance')
 * @param {object} nominee - { partyId, partyName, firstName, lastName, age }
 */
async function nominateMinister(supabase, nationId, presidentFactionId, ministryKey, nominee) {
    // Validate: must be Presidential system
    const { data: nation } = await supabase.from('nations').select('name, government_type').eq('id', nationId).single();
    if (!isPresidentialRepublic(nation)) throw new Error('Minister nominations only apply to Presidential systems');

    // Validate: caller must be president's party
    const { data: president } = await supabase.from('presidents')
        .select('id, faction_id')
        .eq('nation_id', nationId).eq('is_active', true)
        .limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can nominate ministers');

    // Validate: no existing pending confirmation for this slot
    const { data: existingMinistry } = await supabase.from('ministries')
        .select('id, confirmation_status')
        .eq('nation_id', nationId).eq('ministry_key', ministryKey).eq('is_active', true)
        .maybeSingle();

    if (existingMinistry?.confirmation_status === 'pending') {
        throw new Error('A confirmation vote is already pending for this ministry');
    }

    // Get current tick
    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    // Write pending minister data to the ministry row
    const pendingData = {
        party_id: nominee.partyId,
        first_name: nominee.firstName,
        last_name: nominee.lastName,
        age: nominee.age
    };

    const ministryDisplayName = {
        prime_minister: 'Prime Minister', interior: 'Ministry of the Interior',
        foreign: 'Foreign Ministry', defense: 'Ministry of Defense',
        finance: 'Ministry of Finance', education: 'Ministry of Education',
        healthcare: 'Ministry of Healthcare', labor: 'Ministry of Labor',
        justice: 'Ministry of Justice', trade: 'Ministry of Trade',
        energy: 'Ministry of Energy', transportation: 'Ministry of Transportation',
        security: 'Ministry of Security'
    }[ministryKey] || ministryKey;

    if (existingMinistry) {
        const { error: updErr } = await supabase.from('ministries').update({
            confirmation_status: 'pending',
            pending_minister: pendingData
        }).eq('id', existingMinistry.id);
        if (updErr) throw new Error('Failed to update ministry: ' + updErr.message);
    } else {
        const { error: insErr } = await supabase.from('ministries').insert({
            nation_id: nationId,
            ministry_key: ministryKey,
            ministry_name: ministryDisplayName,
            is_active: true,
            confirmation_status: 'pending',
            pending_minister: pendingData
        });
        if (insErr) throw new Error('Failed to create ministry row: ' + insErr.message);
    }

    // Create confirmation bill (goes straight to floor vote)
    const ministerTitle = {
        prime_minister: 'Prime Minister', interior: 'Minister of the Interior',
        foreign: 'Minister of Foreign Affairs', defense: 'Minister of Defense',
        finance: 'Minister of Finance', education: 'Minister of Education',
        healthcare: 'Minister of Healthcare', labor: 'Minister of Labor',
        justice: 'Minister of Justice', trade: 'Minister of Trade',
        energy: 'Minister of Energy', transportation: 'Minister of Transportation',
        security: 'Minister of Security'
    }[ministryKey] || ministryDisplayName;

    const billName = `Confirmation of ${nominee.firstName} ${nominee.lastName} as ${ministerTitle}`;
    const preamble = `The President nominates ${nominee.firstName} ${nominee.lastName} (${nominee.partyName}) to serve as ${ministerTitle}. A simple majority (${GAME_CONFIG.MAJORITY_SEATS} of ${GAME_CONFIG.TOTAL_SEATS} seats) is required for confirmation.`;

    const { data: bill, error: billErr } = await supabase.from('bills').insert({
        nation_id: nationId,
        proposed_by: presidentFactionId,
        proposed_tick: currentTick,
        bill_name: billName,
        bill_type: 'minister_confirmation',
        status: 'floor',
        voting_ends_tick: currentTick + GAME_CONFIG.MINISTER_CONFIRMATION_VOTING_TICKS,
        ministry_key: ministryKey,
        preamble
    }).select().single();

    if (billErr) throw billErr;

    console.log(`Minister nomination: ${nominee.firstName} ${nominee.lastName} for ${ministryKey} (bill ${bill.id})`);
    return { bill, nominee };
}


// ==================== PRESIDENTIAL VETO SYSTEM ====================

/**
 * President signs a bill into law.
 * Called from the UI when the President's party clicks "Sign Into Law".
 */
async function signPresidentialBill(supabase, billId, presidentFactionId) {
    const context = { billId, presidentFactionId };
    console.log('[signPresidentialBill] stage=rpc_start', context);

    const { data: rpcResult, error: rpcError } = await supabase.rpc('sign_presidential_bill', {
        p_bill_id: billId
    });

    if (rpcError) {
        console.error('[signPresidentialBill] stage=rpc_error', {
            ...context,
            error: rpcError.message
        });
        throw new Error(`Presidential signing failed: ${rpcError.message}`);
    }

    if (!rpcResult?.ok) {
        console.error('[signPresidentialBill] stage=rpc_rejected', {
            ...context,
            result: rpcResult
        });
        throw new Error(rpcResult?.message || 'Presidential signing was rejected.');
    }

    console.log('[signPresidentialBill] stage=rpc_success', {
        ...context,
        code: rpcResult.code
    });

    const { data: signedBill, error: signedBillErr } = await supabase.from('bills')
        .select('id, bill_name, nation_id, bill_articles(id), bill_support(stance, seat_count)')
        .eq('id', billId)
        .single();

    if (signedBillErr || !signedBill) {
        throw new Error(`Bill signed but failed to reload bill metadata: ${signedBillErr?.message || 'not found'}`);
    }

    const floorVotes = tallyFloorVotes(signedBill);
    await fireBillEvent(supabase, 'bill_passed', signedBill, {
        currentTick: rpcResult.tick || 0,
        votesFor: floorVotes.votesFor,
        votesAgainst: floorVotes.votesAgainst,
        votesAbstain: floorVotes.votesAbstain,
        articleCount: (signedBill.bill_articles || []).length,
        billNameOverride: `${signedBill.bill_name} (signed by President)`
    });

    console.log('[signPresidentialBill] stage=terminal_result result=success', context);
}

/**
 * President vetoes a bill.
 * Auto-creates a veto_override bill requiring 2/3 supermajority.
 */
async function vetoPresidentialBill(supabase, billId, presidentFactionId) {
    const { data: bill } = await supabase.from('bills')
        .select('*, factions(faction_name), bill_support(stance, seat_count)')
        .eq('id', billId).single();
    if (!bill || bill.status !== 'president_desk') throw new Error('Bill is not on the president\'s desk');

    const { data: president } = await supabase.from('presidents')
        .select('faction_id').eq('nation_id', bill.nation_id).eq('is_active', true).limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can veto bills');

    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    // Mark bill as vetoed
    await supabase.from('bills').update({
        status: 'vetoed',
        president_action: 'vetoed',
        president_action_tick: currentTick
    }).eq('id', bill.id);

    // Auto-create veto override bill (goes straight to floor)
    const overrideSeats = Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD);
    const { data: overrideBill } = await supabase.from('bills').insert({
        nation_id: bill.nation_id,
        proposed_by: bill.proposed_by,
        proposed_tick: currentTick,
        bill_name: 'Veto Override: ' + bill.bill_name,
        bill_type: 'veto_override',
        status: 'floor',
        voting_ends_tick: currentTick + GAME_CONFIG.VOTING_WINDOW_TICKS,
        original_bill_id: bill.id,
        is_veto_override: true,
        preamble: `The President has vetoed "${bill.bill_name}". The legislature may override this veto with a two-thirds supermajority (${overrideSeats} of ${GAME_CONFIG.TOTAL_SEATS} seats).`
    }).select().single();

    const floorVotes = tallyFloorVotes(bill);
    await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, votesFor: floorVotes.votesFor, votesAgainst: floorVotes.votesAgainst, votesAbstain: floorVotes.votesAbstain, billNameOverride: bill.bill_name + ' (VETOED by President)' });

    return overrideBill;
}

/**
 * Auto-sign bills that have been on the president's desk past the deadline.
 * Called during advanceTick().
 */
async function processPresidentDesk(supabase, nation, currentTick) {
    console.log(`[processPresidentDesk] nation=${nation.name} gov=${nation.government_type} isPres=${isPresidentialRepublic(nation)} tick=${currentTick}`);
    if (!isPresidentialRepublic(nation)) return [];

    const { data: expiredDesks, error: deskErr } = await supabase.from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('nation_id', nation.id)
        .eq('status', 'president_desk')
        .lte('president_desk_deadline', currentTick);

    console.log(`[processPresidentDesk] found ${expiredDesks?.length ?? 0} expired desk bills (error=${deskErr?.message || 'none'})`);
    if (expiredDesks && expiredDesks.length > 0) {
        for (const b of expiredDesks) {
            console.log(`[processPresidentDesk]   bill=${b.id} "${b.bill_name}" deadline=${b.president_desk_deadline} action=${b.president_action}`);
        }
    }

    if (!expiredDesks || expiredDesks.length === 0) return [];

    const results = [];
    for (const bill of expiredDesks) {
        // Auto-sign: president didn't act in time
        await supabase.from('bills').update({
            president_action: 'auto_signed',
            president_action_tick: currentTick
        }).eq('id', bill.id);

        const enactment = await enactBill(supabase, bill, currentTick);
        if (!enactment?.success) {
            console.error(`[processPresidentDesk] Enactment failed for bill ${bill.id}: ${enactment?.error}`);
            results.push({ billId: bill.id, billName: bill.bill_name, action: 'auto_signed', enactFailed: true, error: enactment?.error });
            continue;
        }

        const floorVotes = tallyFloorVotes(bill);
        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationId: nation.id, nationName: nation.name, votesFor: floorVotes.votesFor, votesAgainst: floorVotes.votesAgainst, votesAbstain: floorVotes.votesAbstain, articleCount: (bill.bill_articles || []).length, billNameOverride: bill.bill_name + ' (auto-signed by President)' });

        results.push({ billId: bill.id, billName: bill.bill_name, action: 'auto_signed' });
    }
    return results;
}

/**
 * Pre-election candidate generation: PRESIDENTIAL_CANDIDATE_LEAD_TICKS (6) ticks
 * before a scheduled presidential election, generate 3 presidential candidates for
 * each non-incumbent party. The incumbent president is automatically locked in as
 * their party's candidate (no player choice). Other parties' players pick their
 * nominee; autoSelectPresidentialCandidates() handles unselected parties on election day.
 *
 * Candidates are stored in pm_candidates with candidate_type = 'presidential'.
 */
async function triggerPresidentialCandidateSelection(supabase, nation, currentTick) {
    if (!isPresidentialRepublic(nation)) return;

    const leadTicks = GAME_CONFIG.PRESIDENTIAL_CANDIDATE_LEAD_TICKS;

    // Find scheduled presidential elections that are within leadTicks away
    // (use lte instead of eq to handle missed ticks from server downtime)
    const targetTick = currentTick + leadTicks;
    const { data: upcomingElection } = await supabase
        .from('elections')
        .select('id, election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .gt('election_tick', currentTick)
        .lte('election_tick', targetTick)
        .order('election_tick', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (!upcomingElection) return;

    // Check if candidates were already generated for this election
    const { count: existingCount } = await supabase
        .from('pm_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential');

    if (existingCount > 0) return; // already generated

    console.log(`Generating presidential candidates for all parties in ${nation.name} (election at tick ${targetTick})`);

    // Check for active incumbent president
    const { data: incumbentPresident } = await supabase
        .from('presidents')
        .select('id, faction_id, first_name, last_name, age, ideology, trait, trait_upside, trait_downside, terms_served')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Get all parties in this nation
    const { data: allParties } = await supabase
        .from('factions')
        .select('id, faction_name')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!allParties || allParties.length === 0) return;

    const termLimit = GAME_CONFIG.PRESIDENTIAL_TERM_LIMIT || 2;

    for (const party of allParties) {
        try {
            const isIncumbentParty = incumbentPresident && party.id === incumbentPresident.faction_id;
            const isTermLimited = isIncumbentParty && (incumbentPresident.terms_served || 1) >= termLimit;

            if (isIncumbentParty && isTermLimited) {
                // === TERM-LIMITED: incumbent has served max terms, party must pick a new candidate ===
                console.log(`TERM LIMIT: President ${incumbentPresident.first_name} ${incumbentPresident.last_name} has served ${incumbentPresident.terms_served} term(s) (limit: ${termLimit}). ${party.faction_name} must choose a new candidate. (${nation.name})`);
                await generatePresidentCandidates(supabase, nation.id, party.id, currentTick, 'presidential');
            } else if (isIncumbentParty) {
                // === INCUMBENT LOCK-IN: auto-create incumbent as their party's candidate ===
                // The incumbent president is automatically locked in as their faction's nominee.
                // No player choice — they must run for re-election. Player must impeach/resign to change.
                let factionIdeology = await loadFactionIdeology(supabase, incumbentPresident.faction_id);
                if (factionIdeology?._error) factionIdeology = null;

                // Determine the incumbent's ideology axis from faction ideology
                // Use the faction's strongest axis as a proxy since we don't store axis on presidents
                let ideologyAxis = 'tradition_progress';
                let ideologyDirection = 1;
                if (factionIdeology) {
                    const axes = ['liberty_equality', 'tradition_progress', 'security_freedom', 'globalism_nationalism', 'individualism_collectivism'];
                    let maxAbs = 0;
                    for (const axis of axes) {
                        const val = Math.abs(factionIdeology[axis] || 0);
                        if (val > maxAbs) {
                            maxAbs = val;
                            ideologyAxis = axis;
                            ideologyDirection = (factionIdeology[axis] || 0) >= 0 ? 1 : -1;
                        }
                    }
                }

                // Clear any existing unselected presidential candidates for this faction
                await supabase.from('pm_candidates').delete()
                    .eq('nation_id', nation.id)
                    .eq('faction_id', incumbentPresident.faction_id)
                    .eq('candidate_type', 'presidential')
                    .eq('selected', false);

                // Insert the incumbent as a pre-selected candidate
                const { error: incumbentErr } = await supabase.from('pm_candidates').insert({
                    nation_id: nation.id,
                    faction_id: incumbentPresident.faction_id,
                    first_name: incumbentPresident.first_name,
                    last_name: incumbentPresident.last_name,
                    age: incumbentPresident.age,
                    ideology: incumbentPresident.ideology || 'PROGRESS',
                    ideology_axis: ideologyAxis,
                    ideology_direction: ideologyDirection,
                    trait_key: incumbentPresident.trait || PM_TRAIT_KEYS[0],
                    created_at_tick: currentTick,
                    candidate_type: 'presidential',
                    selected: true // Auto-selected — locked in
                });

                if (incumbentErr) {
                    console.error(`Error creating incumbent candidate for ${incumbentPresident.first_name} ${incumbentPresident.last_name}:`, incumbentErr);
                } else {
                    console.log(`INCUMBENT LOCK-IN: President ${incumbentPresident.first_name} ${incumbentPresident.last_name} auto-locked as ${party.faction_name}'s candidate (${nation.name})`);
                }
            } else {
                // Normal candidate generation for non-incumbent parties
                await generatePresidentCandidates(supabase, nation.id, party.id, currentTick, 'presidential');
            }
        } catch (partyErr) {
            console.error(`Error generating presidential candidate for party ${party.faction_name} (${party.id}) in ${nation.name}:`, partyErr);
        }
    }

    // Fire system event for incumbent lock-in (only if not term-limited)
    const incumbentIsTermLimited = incumbentPresident && (incumbentPresident.terms_served || 1) >= termLimit;
    if (incumbentPresident && !incumbentIsTermLimited) {
        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'incumbent_lockin',
                p_nation_id: nation.id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation.name,
                    president_name: `${incumbentPresident.first_name} ${incumbentPresident.last_name}`,
                    election_tick: String(targetTick),
                    ticks_remaining: String(leadTicks)
                }
            });
        } catch (e) { console.warn('Incumbent lock-in event fire failed (non-blocking):', e); }
    }
}

/**
 * Safety net: if an active president's term has expired and no presidential election
 * is scheduled, schedule one immediately. Also deactivates the president if term
 * has expired and a new president was already elected (shouldn't happen, but guards).
 */
async function processPresidentialTermEnd(supabase, nation, currentTick) {
    if (!isPresidentialRepublic(nation)) return;

    const { data: president } = await supabase
        .from('presidents')
        .select('id, faction_id, term_ends_tick')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!president) return;

    // Term hasn't expired yet
    if (president.term_ends_tick > currentTick) return;

    // Term has expired — check if a presidential election is already scheduled
    const { data: scheduledElection } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .limit(1)
        .maybeSingle();

    if (!scheduledElection) {
        // No election scheduled — schedule one for next tick
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: currentTick + 1,
            election_type: 'presidential',
            status: 'scheduled'
        });
        console.log(`Emergency presidential election scheduled for ${nation.name} at tick ${currentTick + 1} (term expired)`);
    }
}

/**
 * Auto-select a presidential candidate for every party that has unselected
 * candidates but no selected one. Called immediately before a presidential
 * election fires so every party participates in the candidate popular vote.
 */
async function autoSelectPresidentialCandidates(supabase, nation, currentTick) {
    // Find all unselected presidential candidates for this nation
    const { data: unselected } = await supabase
        .from('pm_candidates')
        .select('id, faction_id, first_name, last_name')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential')
        .eq('selected', false)
        .order('created_at', { ascending: true });

    if (!unselected || unselected.length === 0) return;

    // Find which factions already have a selected candidate
    const { data: alreadySelected } = await supabase
        .from('pm_candidates')
        .select('faction_id')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential')
        .eq('selected', true);

    const selectedFactions = new Set((alreadySelected || []).map(r => r.faction_id));

    // Group unselected by faction, auto-select the first for factions with no selection
    const factionGroups = {};
    for (const c of unselected) {
        if (selectedFactions.has(c.faction_id)) continue;
        if (!factionGroups[c.faction_id]) factionGroups[c.faction_id] = c;
    }

    for (const [factionId, pick] of Object.entries(factionGroups)) {
        console.log(`Auto-selecting presidential candidate for election: ${pick.first_name} ${pick.last_name} (faction ${factionId}) in ${nation.name}`);
        try {
            await selectPresidentCandidate(supabase, pick.id, nation.id, factionId, currentTick);
        } catch (e) {
            console.error(`Error auto-selecting presidential candidate for ${nation.name}:`, e);
        }
    }
}

/**
 * No-op: presidential candidate selection stays open for the full 6-tick window
 * until election day. autoSelectPresidentialCandidates() handles auto-selection
 * at election time inside processElections().
 */
async function processPresidentCandidateTimeout(supabase, nation, currentTick) {
    return;
}

/**
 * Auto-select parliamentary PM candidates that have timed out (3 ticks).
 * Mirrors processPresidentCandidateTimeout but for parliamentary systems.
 */
async function processParliamentaryPMTimeout(supabase, nation, currentTick) {
    if (!isParliamentaryDemocracy(nation)) return;

    const coalition = await fetchActiveCoalition(supabase, nation.id);
    if (!coalition || (coalition.status !== 'formed' && coalition.status !== 'caretaker')) return;

    // Check if there's already an active HOG
    const { data: existingHOG } = await supabase
        .from('head_of_government')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('active', true)
        .limit(1)
        .maybeSingle();
    if (existingHOG) return;

    // No active HOG — auto-appoint the PM party's leader
    const pmPartyId = coalition.ministry_assignments?.prime_minister || coalition.lead_party_id;
    if (!pmPartyId) return;

    try {
        await autoAppointPartyLeaderAsPM(supabase, nation.id, pmPartyId, currentTick);
        console.log(`Auto-appointed party leader as PM for ${nation.name} (tick timeout recovery)`);
    } catch (e) {
        console.error(`Error auto-appointing parliamentary PM for ${nation.name}:`, e);
    }

    // Clean up any stale PM candidates
    await supabase.from('pm_candidates').delete()
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'parliamentary')
        .eq('selected', false);
}

// ==================== NOMINEE SELF-REJECTION ====================

/**
 * Called when the nominated party votes NO on their own minister confirmation bill.
 * Immediately ends the vote as failed, applies -2 gov approval to the president,
 * and clears the pending nominee.
 *
 * @param {object} supabase
 * @param {string} billId - The minister_confirmation bill
 * @param {string} nomineePartyId - The faction that is the nominee (and voted NO)
 */
async function rejectOwnNomination(supabase, billId, nomineePartyId) {
    const { data: bill } = await supabase.from('bills')
        .select('id, bill_name, bill_type, nation_id, ministry_key, status, proposed_by')
        .eq('id', billId).single();
    if (!bill || bill.bill_type !== 'minister_confirmation' || bill.status !== 'floor') {
        throw new Error('Bill is not an active minister confirmation vote');
    }

    const mKey = bill.ministry_key;
    if (!mKey) throw new Error('No ministry_key on confirmation bill');

    // Validate the nominee is actually the pending nominee for this ministry
    const { data: ministry } = await supabase.from('ministries')
        .select('id, pending_minister')
        .eq('nation_id', bill.nation_id).eq('ministry_key', mKey).eq('is_active', true)
        .maybeSingle();

    if (!ministry?.pending_minister || ministry.pending_minister.party_id !== nomineePartyId) {
        throw new Error('Your party is not the nominee for this confirmation');
    }

    // 1. Fail the bill immediately
    await failBill(supabase, bill);

    // 2. Clear pending nomination
    await supabase.from('ministries').update({
        confirmation_status: 'rejected',
        pending_minister: null
    }).eq('id', ministry.id);

    // 3. Apply -2 government approval event (penalty to the president)
    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, -2, 'minister:nominee_self_rejected');

    // 4. Fire system event
    try {
        const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick: shard?.current_tick || 0, votesFor: 0, votesAgainst: 0, votesAbstain: 0, sponsor: 'President', billNameOverride: bill.bill_name + ' (Nominee declined)' });
    } catch (e) { /* non-blocking */ }

    console.log(`Nominee self-rejection: party ${nomineePartyId} declined nomination for ${mKey} (bill ${billId}). -2 gov approval applied.`);
    return { rejected: true, ministryKey: mKey };
}

// Tick lock and tick mutation are intentionally Edge Function only.

// ────────── three-pillar ──────────


// ==================== THREE-PILLAR PREFERENCE ENGINE ====================

/**
 * Master per-tick function that recalculates the three-pillar preference score
 * for every faction-bloc pair in a nation (democracies only).
 *
 * preference_score = ideology_alignment × 0.60
 *                  + clamp(momentum, 0, 100) × 0.40
 *
 * Governance feed: coalition parties get per-tick momentum nudge
 * from gov_approval: (gov_approval - 50) / 10, capped ±5.
 *
 * Then runs softmax per bloc to produce vote_share, and aggregates
 * national_vote_share weighted by bloc population.
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row
 * @param {number} currentTick - The tick just committed
 */
async function calculateThreePillarPreferences(supabase, nation, currentTick) {
    if (isAutocracy(nation)) return;

    // ── 1. Load all party factions ──
    const { data: factions } = await supabase
        .from('factions')
        .select('id, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');
    if (!factions || factions.length === 0) return;
    const factionIds = factions.map(f => f.id);

    const coalition = await fetchActiveCoalition(supabase, nation.id);
    const coalitionPartyIds = new Set(coalition?.party_ids || []);

    // ── 2. Load voter blocs first (needed for orphan detection) ──
    const { data: voterBlocs } = await supabase
        .from('voter_blocs')
        .select('id, population_weight, k_value, priority_issues, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nation.id)
        .eq('is_active', true);
    if (!voterBlocs || voterBlocs.length === 0) return;

    const blocMap = {};
    for (const b of voterBlocs) blocMap[b.id] = b;
    const activeBlocIds = new Set(voterBlocs.map(b => b.id));

    // ── 3. Load all faction_bloc_approval rows ──
    let { data: allBlocRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, faction_id, bloc_id, ideology_alignment, performance_perception, momentum, preference_score, last_platform')
        .in('faction_id', factionIds);
    if (!allBlocRows) allBlocRows = [];

    // ── 3b. Repair orphaned/stale bloc_id references ──
    // faction_bloc_approval rows referencing inactive/deleted voter_blocs will be
    // silently skipped by the calculation loop (`if (!bloc) continue`), leaving
    // preference_score permanently stuck at its seed value (40).
    const orphanedRows = allBlocRows.filter(r => !activeBlocIds.has(r.bloc_id));
    if (orphanedRows.length > 0) {
        console.warn(`[Three-Pillar] Deleting ${orphanedRows.length} orphaned faction_bloc_approval rows (stale bloc_ids) for nation ${nation.name}`);
        for (const row of orphanedRows) {
            await supabase.from('faction_bloc_approval').delete().eq('id', row.id);
        }
        allBlocRows = allBlocRows.filter(r => activeBlocIds.has(r.bloc_id));
    }

    // ── 3c. Seed missing faction_bloc_approval rows ──
    // Ensures every (faction, active_bloc) pair has a row.
    const existingPairs = new Set(allBlocRows.map(r => `${r.faction_id}:${r.bloc_id}`));
    const missingPairs = [];
    for (const fid of factionIds) {
        for (const bloc of voterBlocs) {
            if (!existingPairs.has(`${fid}:${bloc.id}`)) {
                missingPairs.push({ faction_id: fid, bloc_id: bloc.id, preference_score: 40 });
            }
        }
    }
    if (missingPairs.length > 0) {
        console.warn(`[Three-Pillar] Seeding ${missingPairs.length} missing faction_bloc_approval rows for nation ${nation.name}`);
        const { error: seedErr } = await supabase.from('faction_bloc_approval')
            .upsert(missingPairs, { onConflict: 'faction_id,bloc_id', ignoreDuplicates: true });
        if (seedErr) {
            console.error(`[Three-Pillar] Failed to seed missing rows:`, seedErr.message);
        }
        // Re-fetch all rows after any repairs
        const { data: refreshedRows } = await supabase
            .from('faction_bloc_approval')
            .select('id, faction_id, bloc_id, ideology_alignment, performance_perception, momentum, preference_score, last_platform')
            .in('faction_id', factionIds);
        if (refreshedRows && refreshedRows.length > 0) {
            allBlocRows = refreshedRows;
        }
    }

    if (allBlocRows.length === 0) return;

    // ── 3d. Detect and reset stuck rows ──
    // Rows stuck at seed defaults (preference_score=40, ideology_alignment=50) have never been
    // successfully updated by the three-pillar engine. Reset in-memory values to force fresh calculation.
    const stuckRows = allBlocRows.filter(r =>
        Number(r.preference_score) === 40 &&
        Number(r.ideology_alignment) === 50
    );
    if (stuckRows.length > 0) {
        const stuckFactions = [...new Set(stuckRows.map(r => r.faction_id))];
        console.warn(`[Three-Pillar] Detected ${stuckRows.length} stuck rows for ${stuckFactions.length} faction(s): ${stuckFactions.join(', ')}. Resetting to force recalculation.`);
        for (const sr of stuckRows) {
            sr.ideology_alignment = 0;
            sr.preference_score = 0;
            sr.momentum = 0;
        }
    }

    // ── 4. Load faction ideologies (dynamic axis scores + conviction stacks) ──
    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism, convictions')
        .in('faction_id', factionIds);

    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    // ── 4b. Backfill missing faction_ideology rows ──
    // Parties without an ideology row get ideoScore=50 for all blocs, locking
    // preference_score at 50. Create a centrist row so computeIdeologyAlignment
    // can produce varied scores (30-70) based on bloc positions.
    // Map declared ideology values to axis columns with ±30 strength
    const IDEOLOGY_AXIS_MAP = {
        'LIBERTY': { axis: 'liberty_equality', val: -30 },
        'EQUALITY': { axis: 'liberty_equality', val: 30 },
        'TRADITION': { axis: 'tradition_progress', val: -30 },
        'PROGRESS': { axis: 'tradition_progress', val: 30 },
        'SECURITY': { axis: 'security_freedom', val: -30 },
        'FREEDOM': { axis: 'security_freedom', val: 30 },
        'GLOBALISM': { axis: 'globalism_nationalism', val: -30 },
        'NATIONALISM': { axis: 'globalism_nationalism', val: 30 },
        'INDIVIDUALISM': { axis: 'individualism_collectivism', val: -30 },
        'COLLECTIVISM': { axis: 'individualism_collectivism', val: 30 },
    };

    const missingIdeoFactions = factionIds.filter(fid => !ideoMap[fid]);
    if (missingIdeoFactions.length > 0) {
        // Fetch declared ideologies for missing factions to seed axis values
        const { data: factionDetails } = await supabase
            .from('factions')
            .select('id, ideology_value_1, ideology_value_2')
            .in('id', missingIdeoFactions);
        const factionMap = {};
        for (const f of (factionDetails || [])) factionMap[f.id] = f;

        for (const fid of missingIdeoFactions) {
            const faction = factionMap[fid];
            const newRow = {
                faction_id: fid,
                liberty_equality: 0,
                tradition_progress: 0,
                security_freedom: 0,
                globalism_nationalism: 0,
                individualism_collectivism: 0
            };
            // Seed from declared ideologies (±30 per axis)
            for (const iv of [faction?.ideology_value_1, faction?.ideology_value_2]) {
                if (!iv) continue;
                const mapping = IDEOLOGY_AXIS_MAP[iv.toUpperCase()];
                if (mapping) {
                    newRow[mapping.axis] = Math.max(-100, Math.min(100, (newRow[mapping.axis] || 0) + mapping.val));
                }
            }
            console.log(`[three-pillar] Seeding faction_ideology for ${fid}: ${JSON.stringify(newRow)}`);
            // Try insert first (works even without unique constraint on faction_id).
            // Fall back to upsert if a constraint exists.
            let inserted = null;
            let insErr = null;
            const { data: d1, error: e1 } = await supabase
                .from('faction_ideology')
                .insert(newRow)
                .select()
                .single();
            if (!e1 && d1) {
                inserted = d1;
            } else if (e1) {
                // If insert fails (duplicate), try upsert
                const { data: d2, error: e2 } = await supabase
                    .from('faction_ideology')
                    .upsert(newRow, { onConflict: 'faction_id', ignoreDuplicates: true })
                    .select()
                    .single();
                inserted = d2;
                insErr = e2;
            }
            if (inserted) {
                ideoMap[fid] = inserted;
                console.log(`[three-pillar] Backfilled missing faction_ideology row for faction ${fid}`);
            } else if (insErr || e1) {
                console.error(`[three-pillar] Failed to backfill faction_ideology for ${fid}:`, (insErr || e1).message);
            }
        }
    }

    // ── 5. Calculate pillars for each faction-bloc pair ──
    const PILLAR_WEIGHT_IDEO = 0.45;
    const PILLAR_WEIGHT_MOM  = 0.55;
    const MOMENTUM_DECAY     = 0.70; // 30% decay per tick
    const INACTIVITY_DRAIN   = 1.5;  // momentum drain per tick when inactive
    const INACTIVITY_THRESHOLD = 3;  // ticks without any campaign action to trigger drain

    // ── 5a. Fetch last campaign action tick per faction (for inactivity detection) ──
    // Only look at recent ticks to avoid fetching the entire action history.
    const { data: lastActions } = await supabase
        .from('campaign_actions')
        .select('party_id, tick_performed')
        .in('party_id', factionIds)
        .gte('tick_performed', currentTick - INACTIVITY_THRESHOLD)
        .order('tick_performed', { ascending: false })
        .limit(factionIds.length * 2);
    const lastActionTickMap = new Map();
    for (const action of (lastActions || [])) {
        if (!lastActionTickMap.has(action.party_id)) {
            lastActionTickMap.set(action.party_id, action.tick_performed);
        }
    }

    // ── 5b. Governance → momentum feed ──
    // Coalition parties get a per-tick momentum nudge based on gov_approval.
    // Formula: (gov_approval - 50) / 10, capped at ±5.
    // gov_approval 95 → +4.5/tick, 75 → +2.5, 50 → 0, 25 → -2.5, 5 → -4.5
    const govApproval = Number(nation.gov_approval ?? 50);
    const govMomentumNudge = Math.max(-5, Math.min(5,
        Math.round(((govApproval - 50) / 10) * 100) / 100
    ));

    const updates = [];

    // Track platform updates that need writing back (bridge expiry, etc.)
    const platformUpdates = [];

    for (const row of allBlocRows) {
        const bloc = blocMap[row.bloc_id];
        if (!bloc) continue;
        const ideo = ideoMap[row.faction_id];
        const platform = row.last_platform || {};
        let platformChanged = false;

        // ─── PILLAR 1: Ideology Alignment (0-100) ───
        const ideoScore = ideo ? computeIdeologyAlignment(ideo, bloc) : 50;

        // ─── PILLAR 2: Performance Perception — DISABLED ───
        const newPerf = 50; // neutral; column still written for schema compat

        // ─── PILLAR 3: Momentum (-50 to +50) ───
        // Base decay: 30% per tick. Conviction stacks reduce decay for aligned blocs.
        const oldMomentum = Number(row.momentum ?? 0);
        let effectiveDecay = MOMENTUM_DECAY;

        // ─── Double Down: conviction stacks reduce positive momentum decay for aligned blocs ───
        const convictions = ideo?.convictions || {};
        if (oldMomentum > 0 && Object.keys(convictions).length > 0) {
            // Find highest conviction stack on an axis where this bloc aligns with the faction
            let maxConvictionBonus = 0;
            for (const [axisKey, stacks] of Object.entries(convictions)) {
                if (!stacks || stacks <= 0) continue;
                const partyVal = ideo[axisKey] || 0; // -100 to +100
                const blocVal = bloc['axis_' + axisKey] ?? 50; // 0 to 100
                const partyNorm = (partyVal + 100) / 2; // map -100..+100 to 0..100
                const distance = Math.abs(partyNorm - blocVal);
                // Bloc must be aligned (within 30 points) for conviction to help
                if (distance <= 30) {
                    maxConvictionBonus = Math.max(maxConvictionBonus, stacks);
                }
            }
            // Each conviction stack reduces decay by 8% (3 stacks: 30% decay → 6% decay)
            if (maxConvictionBonus > 0) {
                effectiveDecay = Math.min(1.0, MOMENTUM_DECAY + maxConvictionBonus * 0.08);
            }
        }

        let newMomentum = Math.round(oldMomentum * effectiveDecay * 100) / 100;

        // ─── Inactivity drain: parties with no campaign actions in recent ticks lose momentum ───
        // Skip drain in early ticks so parties aren't penalized before they've had a chance to act.
        const lastActionTick = lastActionTickMap.get(row.faction_id) ?? -999;
        if (currentTick >= INACTIVITY_THRESHOLD && (currentTick - lastActionTick) >= INACTIVITY_THRESHOLD) {
            newMomentum -= INACTIVITY_DRAIN;
        }

        // ─── Champion a Community: 2× governance momentum for championed blocs ───
        let govMultiplier = 1;
        if (platform.championed === true) {
            govMultiplier = 2;
        }

        // Governance momentum feed: coalition parties get nudge from gov_approval
        if (coalitionPartyIds.has(row.faction_id)) {
            newMomentum += govMomentumNudge * govMultiplier;
        }

        // ─── Build a Bridge: ongoing momentum boost from active bridges ───
        if (platform.bridges && Array.isArray(platform.bridges)) {
            const activeBridges = [];
            for (const bridge of platform.bridges) {
                if (bridge.expires_tick > currentTick) {
                    // Active bridge: apply per-tick momentum boost
                    newMomentum += (bridge.boost || 2) * 0.5; // half the initial boost per tick
                    activeBridges.push(bridge);
                } else {
                    // Expired bridge: leave +1 permanent goodwill via momentum bump
                    newMomentum += 1;
                    platformChanged = true;
                }
            }
            // Keep only active bridges
            if (activeBridges.length !== platform.bridges.length) {
                platform.bridges = activeBridges;
                if (activeBridges.length === 0) {
                    delete platform.bridges;
                    delete platform.bridge;
                }
                platformChanged = true;
            }
        }

        // Clamp to [-50, +50] and zero out negligible values
        newMomentum = Math.max(-50, Math.min(50, newMomentum));
        newMomentum = Math.round(newMomentum * 100) / 100;
        if (Math.abs(newMomentum) < 0.05) newMomentum = 0;

        // ─── COMBINE: preference_score ───
        // Map momentum from [-50,+50] to [0,100] for blending.
        // Zero momentum maps to 35 (not 50) so inactive parties start below neutral.
        // Multiplier 1.3 stretches the active range to still reach 100 at +50.
        const momMapped = Math.max(0, Math.min(100, 35 + newMomentum * 1.3));
        let prefScore = Math.round(
            (ideoScore * PILLAR_WEIGHT_IDEO + momMapped * PILLAR_WEIGHT_MOM) * 100
        ) / 100;

        // ─── IDEOLOGY OPPOSITION PENALTY (structural) ───
        // 2+ opposing → -30%, 1 opposing → -20%, 0 aligned → -10%
        const oppositionMult = ideo ? ideologyOppositionMultiplier(ideo, bloc) : 1.0;
        prefScore = Math.round(prefScore * oppositionMult * 100) / 100;

        // ─── IDEOLOGY DRIFT: per-tick erosion based on opposition count ───
        // 2+ opposing → -2/tick, 1 opposing → -1/tick, 0 aligned (with positions) → -0.5/tick
        let ideoDrift = 0;
        if (ideo) {
            const { opposed, aligned } = countIdeologyRelationship(ideo, bloc);
            if (opposed >= 2)       ideoDrift = -2;
            else if (opposed === 1) ideoDrift = -1;
            else if (aligned === 0) {
                // Only drift if the party actually has strong positions but none align.
                // Centrist parties with no positions should not be penalized.
                const IDEOLOGY_AXIS_KEYS = ['liberty_equality','tradition_progress','security_freedom','globalism_nationalism','individualism_collectivism'];
                const hasPosition = IDEOLOGY_AXIS_KEYS.some(k => Math.abs(ideo[k] || 0) >= 20);
                if (hasPosition) ideoDrift = -0.5;
            }
        }
        prefScore = Math.max(0, prefScore + ideoDrift);
        prefScore = Math.round(prefScore * 100) / 100;

        updates.push({
            id: row.id,
            faction_id: row.faction_id,
            bloc_id: row.bloc_id,
            ideology_alignment: Math.round(ideoScore * 100) / 100,
            performance_perception: newPerf,
            momentum: newMomentum,
            preference_score: prefScore,
            ideology_drift: ideoDrift
        });

        if (platformChanged) {
            platformUpdates.push({ id: row.id, last_platform: platform });
        }
    }

    // ── 8. Softmax vote share per bloc ──
    const byBloc = {};
    for (const u of updates) {
        if (!byBloc[u.bloc_id]) byBloc[u.bloc_id] = [];
        byBloc[u.bloc_id].push(u);
    }

    for (const blocId of Object.keys(byBloc)) {
        const bloc = blocMap[blocId];
        const k = Number(bloc?.k_value ?? 7);
        const entries = byBloc[blocId];

        const maxPref = Math.max(...entries.map(e => e.preference_score));
        const exps = entries.map(e => Math.exp((e.preference_score - maxPref) / k));
        const sumExp = exps.reduce((a, b) => a + b, 0);

        for (let i = 0; i < entries.length; i++) {
            entries[i].vote_share = sumExp > 0
                ? Math.round((exps[i] / sumExp) * 1000000) / 1000000
                : 1 / entries.length;
        }
    }

    // ── 9. Batch-update faction_bloc_approval rows ──
    let updateFailCount = 0;
    for (const u of updates) {
        const { data: updatedRows, error: updateErr } = await supabase.from('faction_bloc_approval')
            .update({
                ideology_alignment: u.ideology_alignment,
                performance_perception: u.performance_perception,
                momentum: u.momentum,
                preference_score: u.preference_score,
                vote_share: u.vote_share,
                ideology_drift: u.ideology_drift
            })
            .eq('id', u.id)
            .select('id');
        if (updateErr) {
            console.error(`[Three-Pillar] Failed to update faction_bloc_approval row ${u.id} (faction=${u.faction_id}, bloc=${u.bloc_id}):`, updateErr.message);
            updateFailCount++;
        } else if (!updatedRows || updatedRows.length === 0) {
            // Update returned success but modified 0 rows — row likely missing or RLS blocked
            console.error(`[Three-Pillar] Update matched 0 rows for faction_bloc_approval id=${u.id} (faction=${u.faction_id}, bloc=${u.bloc_id}, pref=${u.preference_score}). Attempting upsert fallback.`);
            // Fallback: upsert to ensure the row exists with correct values
            const { error: upsertErr } = await supabase.from('faction_bloc_approval')
                .upsert({
                    id: u.id,
                    faction_id: u.faction_id,
                    bloc_id: u.bloc_id,
                    ideology_alignment: u.ideology_alignment,
                    performance_perception: u.performance_perception,
                    momentum: u.momentum,
                    preference_score: u.preference_score,
                    vote_share: u.vote_share,
                    ideology_drift: u.ideology_drift
                }, { onConflict: 'faction_id,bloc_id' });
            if (upsertErr) {
                console.error(`[Three-Pillar] Upsert fallback also failed for faction=${u.faction_id}, bloc=${u.bloc_id}:`, upsertErr.message);
                updateFailCount++;
            } else {
                console.log(`[Three-Pillar] Upsert fallback succeeded for faction=${u.faction_id}, bloc=${u.bloc_id}`);
            }
        }
    }
    if (updateFailCount > 0) {
        console.error(`[Three-Pillar] ${updateFailCount}/${updates.length} updates failed for nation ${nation.name}`);
    }

    // ── 9b. Write back platform changes (bridge expiry cleanup) ──
    for (const pu of platformUpdates) {
        const { error: platErr } = await supabase.from('faction_bloc_approval')
            .update({ last_platform: pu.last_platform })
            .eq('id', pu.id);
        if (platErr) {
            console.error(`[Three-Pillar] Failed to update platform for row ${pu.id}:`, platErr.message);
        }
    }

    // ── 10. Aggregate national_vote_share per faction ──
    const factionNationalShare = {};
    let totalWeight = 0;

    for (const blocId of Object.keys(byBloc)) {
        const bloc = blocMap[blocId];
        const weight = Number(bloc?.population_weight ?? 0);
        totalWeight += weight;

        for (const entry of byBloc[blocId]) {
            if (!factionNationalShare[entry.faction_id]) factionNationalShare[entry.faction_id] = 0;
            factionNationalShare[entry.faction_id] += (entry.vote_share * weight);
        }
    }

    for (const factionId of factionIds) {
        const rawShare = factionNationalShare[factionId] || 0;
        const pct = totalWeight > 0
            ? Math.round((rawShare / totalWeight) * 10000) / 100
            : 0;

        await supabase.from('factions')
            .update({ national_vote_share: pct })
            .eq('id', factionId);
    }

    // ── 11. Update derived approval_rating cache (backward compat) ──
    for (const fId of factionIds) {
        const factionUpdates = updates.filter(r => r.faction_id === fId);
        await recalcDerivedApproval(supabase, fId, factionUpdates);
    }

    console.log(`[Three-Pillar] Recalculated preferences for ${factionIds.length} parties × ${voterBlocs.length} blocs in ${nation.name}`);
}

// ────────── political-actions ──────────


// ==================== STAT DECAY PROCESSING ====================

/**
 * Apply natural stat decay for a nation. Each tick, configured stats drift
 * toward their target (equilibrium or erosion).
 *
 * Institution funding modifies decay: fully-funded institutions block decay on
 * their primary/secondary stats entirely. Underfunded institutions let decay
 * through (or worsen it). When multiple institutions cover the same stat, their
 * rates are averaged. Stats not covered by any institution decay at natural rates.
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row (in-memory, mutated on success)
 * @param {Object|null} statInstitutionMap - from buildStatInstitutionMap(), or null to use natural rates
 * @returns {Array<object>}  Applied decay descriptors for tick summary
 */
/**
 * Build a map of policy-driven decay floor/ceiling adjustments for a nation.
 * Queries active_laws → policies and aggregates adjust_type/adjust_value
 * from stat_effects. Adjustments stack additively across multiple policies.
 *
 * @returns {{ [statKey: string]: { floor: number, ceiling: number } }}
 */
async function buildPolicyDecayAdjustments(supabase, nationId) {
    const adjustments = {};

    const { data: activeLaws, error } = await supabase
        .from('active_laws')
        .select('policy_id, policies(stat_effects)')
        .eq('nation_id', nationId);

    if (error || !activeLaws) return adjustments;

    for (const law of activeLaws) {
        const effects = law.policies?.stat_effects;
        if (!Array.isArray(effects)) continue;

        for (const eff of effects) {
            if (!eff.adjust_type || !eff.adjust_value) continue;
            const statKey = normalizeNationStatKey(eff.stat_key);
            if (!statKey || !NATION_STAT_COLUMN_SET.has(statKey)) continue;

            if (!adjustments[statKey]) adjustments[statKey] = { floor: 0, ceiling: 0 };

            const val = Math.abs(Number(eff.adjust_value) || 0);
            if (eff.adjust_type === 'floor') {
                adjustments[statKey].floor += val;
            } else if (eff.adjust_type === 'ceiling') {
                adjustments[statKey].ceiling += val;
            }
        }
    }

    return adjustments;
}

async function processStatDecay(supabase, nation, statInstitutionMap, policyDecayAdjustments = null) {
    const appliedDecay = [];
    const nationUpdates = {};

    for (const [statKey, config] of Object.entries(STAT_DECAY_CONFIG)) {
        if (!NATION_STAT_COLUMN_SET.has(statKey)) continue;

        const currentVal = nation[statKey] !== undefined && nation[statKey] !== null
            ? Number(nation[statKey]) : 50;
        let target = config.target;

        // Apply policy-driven floor/ceiling adjustments to the decay target
        const adj = policyDecayAdjustments?.[statKey];
        if (adj) {
            if (adj.floor > 0) {
                // Floor: raise the target so the stat won't decay below it
                target = Math.min(100, target + adj.floor);
            }
            if (adj.ceiling > 0) {
                // Ceiling: lower the target so the stat decays down toward it
                target = Math.max(0, target - adj.ceiling);
            }
        }

        if (currentVal === target) continue;

        // Determine effective decay speed: institution-modified or natural
        const instDecay = statInstitutionMap
            ? getAveragedInstitutionDecay(statInstitutionMap[statKey])
            : null;
        const speed = instDecay !== null ? instDecay : config.speed;

        if (speed === 0) continue;  // fully funded institutions block all decay

        let newVal;
        if (currentVal > target) {
            newVal = Math.max(target, currentVal - speed);
        } else {
            newVal = Math.min(target, currentVal + speed);
        }

        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;

        if (newVal !== Math.round(currentVal * 10) / 10) {
            nationUpdates[statKey] = newVal;
            appliedDecay.push({
                stat: statKey,
                type: config.type,
                previousValue: Math.round(currentVal * 10) / 10,
                newValue: newVal,
                target,
                speed,
                institutionModified: instDecay !== null
            });
        }
    }

    if (Object.keys(nationUpdates).length > 0) {
        const { error } = await supabase
            .from('nations')
            .update(nationUpdates)
            .eq('id', nation.id);

        if (error) {
            console.error('[processStatDecay] Nation stat update FAILED',
                { nationId: nation.id, payload: nationUpdates, error: error.message });
            return [];
        }

        const instCount = appliedDecay.filter(d => d.institutionModified).length;
        console.log(`[processStatDecay] Decay applied for ${nation.name}: ${appliedDecay.length} stat(s)${instCount > 0 ? ` (${instCount} institution-modified)` : ''}`);
        Object.assign(nation, nationUpdates);
    }

    return appliedDecay;
}

// ==================== STAT CONNECTIONS (threshold-triggered ripple effects) ====================

/**
 * Process stat connections for a nation. Each enabled connection checks whether
 * a source stat has crossed a threshold and, if so, nudges the target stat.
 *
 * Supports:
 *   - Delay: connection only fires after the source has been past the threshold
 *     for `delay_ticks` consecutive ticks (tracked by checking the live value each tick).
 *   - Dampening: effect weakens as the target approaches its natural limit (0 or 100).
 *
 * @param {object} supabase - Supabase client
 * @param {object} nation   - Full nation row (in-memory, mutated on success)
 * @param {number} currentTick - Current game tick
 * @param {Array}  connections - Pre-fetched stat_connections rows (enabled only)
 * @returns {Array<object>} Applied connection descriptors for tick summary
 */
async function processStatConnections(supabase, nation, currentTick, connections) {
    if (!connections || connections.length === 0) return [];

    const applied = [];
    const nationUpdates = {};

    for (const conn of connections) {
        if (!NATION_STAT_COLUMN_SET.has(conn.source_stat) ||
            !NATION_STAT_COLUMN_SET.has(conn.target_stat)) continue;
        // GDP and debt are driven by dedicated systems — skip
        if (STAT_PROCESSOR_SKIP.has(conn.target_stat)) continue;

        const sourceVal = Number(nation[conn.source_stat] ?? 50);
        const targetVal = Number(nation[conn.target_stat] ?? 50);

        // Check whether the source stat has crossed the threshold
        const triggered = conn.source_dir === 'above'
            ? sourceVal > conn.threshold
            : sourceVal < conn.threshold;

        if (!triggered) continue;

        // Delay: skip if delay_ticks > 0 (simplified — fires only when threshold
        // is currently crossed; for precise "N consecutive ticks" tracking you'd
        // need a separate state table, but this captures the design intent: delayed
        // connections only fire on ticks that are >= delay_ticks past the start)
        // For now, delay acts as a minimum tick offset from game start (tick 0)
        // where the connection becomes active. A more sophisticated version can
        // track per-nation crossing state later.
        if (conn.delay_ticks > 0 && currentTick < conn.delay_ticks) continue;

        // Compute magnitude with optional dampening
        let effectiveMag = Number(conn.magnitude);
        if (conn.dampening) {
            if (conn.target_dir === 'up') {
                // Weakens as target approaches 100
                effectiveMag *= (1 - targetVal / 100);
            } else {
                // Weakens as target approaches 0
                effectiveMag *= (targetVal / 100);
            }
        }

        if (Math.abs(effectiveMag) < 0.001) continue;

        let newVal = conn.target_dir === 'up'
            ? targetVal + effectiveMag
            : targetVal - effectiveMag;

        // Raw-value stats (gdp, debt, population) must not be clamped to 0-100
        if (RAW_SCALING_DIVISORS[conn.target_stat]) {
            newVal = Math.max(0, newVal);
        } else {
            newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
        }

        if (newVal !== Math.round(targetVal * 10) / 10) {
            // Accumulate — multiple connections can affect the same target
            if (nationUpdates[conn.target_stat] !== undefined) {
                // Add delta on top of already-accumulated value
                const prevDelta = nationUpdates[conn.target_stat] - targetVal;
                const thisDelta = newVal - targetVal;
                const accumulated = targetVal + prevDelta + thisDelta;
                nationUpdates[conn.target_stat] = RAW_SCALING_DIVISORS[conn.target_stat]
                    ? Math.max(0, accumulated)
                    : Math.round(Math.max(0, Math.min(100, accumulated)) * 10) / 10;
            } else {
                nationUpdates[conn.target_stat] = newVal;
            }

            applied.push({
                source: conn.source_stat,
                sourceValue: sourceVal,
                threshold: Number(conn.threshold),
                target: conn.target_stat,
                direction: conn.target_dir,
                previousValue: Math.round(targetVal * 10) / 10,
                newValue: nationUpdates[conn.target_stat],
                magnitude: Number(conn.magnitude),
                effectiveMagnitude: Math.round(effectiveMag * 1000) / 1000,
                dampened: conn.dampening
            });
        }
    }

    if (Object.keys(nationUpdates).length > 0) {
        const { error } = await supabase
            .from('nations')
            .update(nationUpdates)
            .eq('id', nation.id);

        if (error) {
            console.error('[processStatConnections] Nation stat update FAILED',
                { nationId: nation.id, payload: nationUpdates, error: error.message });
            return [];
        }

        console.log(`[processStatConnections] Connections applied for ${nation.name}: ${applied.length} effect(s)`);
        Object.assign(nation, nationUpdates);
    }

    return applied;
}


// ==================== RALLY SYSTEM ====================

const RALLY_CONFIG = {
    AP_COST: 3,
    COOLDOWN_WINDOW: 5,   // ticks to look back for rallied_recently count
};

const RALLY_OUTCOMES = [
    {
        id: 'rousing', name: 'Rousing Success',
        targetMin: 6, targetMax: 8, spillover: 2, spilloverScope: 'adjacent',
        polarization: 1,
        headline: bloc => `Massive turnout at ${bloc} rally — supporters overflow venue`,
    },
    {
        id: 'solid', name: 'Solid Turnout',
        targetMin: 3, targetMax: 5, spillover: 0, spilloverScope: 'none',
        polarization: 0,
        headline: bloc => `Party rally draws steady crowd in ${bloc} district — a strong showing`,
    },
    {
        id: 'low', name: 'Low Turnout',
        targetMin: 1, targetMax: 2, spillover: 0, spilloverScope: 'none',
        polarization: 0,
        headline: bloc => `Sparse attendance at ${bloc} rally raises questions about grassroots support`,
    },
    {
        id: 'gaffe', name: 'Gaffe',
        targetMin: -3, targetMax: -2, spillover: -1, spilloverScope: 'random_adjacent',
        polarization: 1,
        headline: bloc => `Party leader's remarks draw swift backlash at ${bloc} event`,
    },
    {
        id: 'divisive', name: 'Divisive Speech',
        targetMin: 5, targetMax: 7, spillover: -2, spilloverScope: 'all_others',
        polarization: 2,
        headline: bloc => `Fiery rally speech energizes ${bloc} base but draws condemnation from opposition`,
    },
    {
        id: 'counter', name: 'Counter-Protest',
        targetMin: -1, targetMax: -1, spillover: -2, spilloverScope: 'all',
        polarization: 2,
        headline: bloc => `${bloc} rally disrupted by counter-protesters — police intervene as tensions escalate`,
    },
];

/**
 * Compute outcome weights for a rally targeting a voter bloc.
 * Weights shift based on approval, crises, polarization, civil unrest, and recent rallies.
 */
function getRallyOutcomeWeights(blocApproval, ralliedRecently, nationState) {
    const weights = { rousing: 20, solid: 38, low: 15, gaffe: 12, divisive: 8, counter: 5 };

    // High approval → more rousing (thresholds calibrated for 45/55 pillar weights)
    if (blocApproval > 45) {
        weights.rousing += 12; weights.low -= 5; weights.gaffe -= 4;
    } else if (blocApproval < 20) {
        weights.rousing -= 10; weights.low += 10; weights.gaffe += 8;
    }

    // Active crises
    if (nationState.crisisCount > 0) {
        weights.gaffe += 6; weights.divisive += 4; weights.counter += 10;
        weights.rousing -= 8; weights.solid -= 6;
    }

    // High polarization
    if (nationState.polarization > 60) {
        weights.divisive += 6; weights.counter += 4; weights.solid -= 4;
    }

    // Rallied recently → stale material
    if (ralliedRecently >= 1) {
        weights.gaffe += 5 * ralliedRecently;
        weights.rousing -= 3 * ralliedRecently;
        weights.low += 3 * ralliedRecently;
    }

    // High civil unrest
    if (nationState.civilUnrest > 40) {
        weights.counter += 8; weights.rousing -= 4;
    }

    // Clamp to minimum 1
    for (const k of Object.keys(weights)) weights[k] = Math.max(1, weights[k]);

    // Normalize to percentages
    const total = Object.values(weights).reduce((s, v) => s + v, 0);
    for (const k of Object.keys(weights)) weights[k] = Math.round((weights[k] / total) * 100);

    return weights;
}

/**
 * Get a risk assessment label from outcome weights.
 */
function getRallyRiskLevel(weights) {
    const badPct = (weights.gaffe || 0) + (weights.divisive || 0) + (weights.counter || 0);
    if (badPct >= 40) return 'dangerous';
    if (badPct >= 25) return 'risky';
    if (badPct >= 15) return 'moderate';
    return 'safe';
}

/**
 * Pick an outcome from weighted distribution.
 */
function rollRallyOutcome(weights) {
    const ids = ['rousing', 'solid', 'low', 'gaffe', 'divisive', 'counter'];
    let sum = 0;
    const cumulative = [];
    for (const id of ids) {
        sum += (weights[id] || 0);
        cumulative.push({ id, threshold: sum });
    }
    const roll = Math.random() * sum;
    return (cumulative.find(c => roll <= c.threshold) || cumulative[cumulative.length - 1]).id;
}

/**
 * Execute a rally targeting a specific voter bloc.
 * Returns { success, outcomeId, outcomeName, headline, effects, newAp }
 */
async function executeRally(supabase, factionId, nationId, blocId, currentTick) {
    // ── 1. Validate AP ──
    const { data: faction } = await supabase
        .from('factions').select('action_points').eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < RALLY_CONFIG.AP_COST)
        return { success: false, error: `Not enough AP. Need ${RALLY_CONFIG.AP_COST}.` };

    // ── 2. Check cooldown (one rally per tick) ──
    const { data: recentRallies } = await supabase
        .from('campaign_actions')
        .select('tick_performed, result')
        .eq('party_id', factionId)
        .eq('action_type', 'rally')
        .gte('tick_performed', currentTick - RALLY_CONFIG.COOLDOWN_WINDOW)
        .order('tick_performed', { ascending: false });

    if ((recentRallies || []).some(r => r.tick_performed === currentTick))
        return { success: false, error: 'Already held a rally this tick.' };

    // Count how many times this specific bloc was rallied recently
    const ralliedRecently = (recentRallies || []).filter(r => r.result?.blocId === blocId).length;

    // ── 3. Load target bloc + nation stats ──
    const { data: targetBloc } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, population_weight, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('id', blocId).single();
    if (!targetBloc) return { success: false, error: 'Voter bloc not found.' };

    const { data: nation } = await supabase
        .from('nations').select('polarization, civil_unrest, stability').eq('id', nationId).single();
    const { count: crisisCount } = await supabase
        .from('active_crises').select('id', { count: 'exact', head: true }).eq('nation_id', nationId);

    // ── 4. Load all blocs + approval rows ──
    const { data: allBlocs } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, population_weight, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nationId).eq('is_active', true);

    const { data: approvalRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score, momentum')
        .eq('faction_id', factionId);
    const approvalByBloc = {};
    for (const row of (approvalRows || [])) approvalByBloc[row.bloc_id] = row;

    const targetApproval = approvalByBloc[blocId]?.preference_score || 50;

    // ── 5. Compute weights and roll outcome ──
    const nationState = {
        polarization: nation?.polarization || 0,
        civilUnrest: nation?.civil_unrest || 0,
        stability: nation?.stability || 50,
        crisisCount: crisisCount || 0,
    };
    const weights = getRallyOutcomeWeights(targetApproval, ralliedRecently, nationState);
    const outcomeId = rollRallyOutcome(weights);
    const outcome = RALLY_OUTCOMES.find(o => o.id === outcomeId);

    // ── 6. Roll specific target effect ──
    const targetDelta = outcome.targetMin + Math.floor(Math.random() * (outcome.targetMax - outcome.targetMin + 1));

    // ── 7. Apply effects ──
    // ── 7. Apply effects (momentum only — preference_score recalculated by three-pillar calc) ──
    const effects = [];
    const targetRow = approvalByBloc[blocId];
    if (targetRow) {
        const oldMom = Number(targetRow.momentum || 0);
        const newMom = Math.max(-50, Math.min(50, Math.round((oldMom + targetDelta) * 100) / 100));
        await supabase.from('faction_bloc_approval')
            .update({ momentum: newMom }).eq('id', targetRow.id);
        effects.push({ bloc: targetBloc.bloc_name, blocId, value: targetDelta, oldMom, newMom });
    }

    // Spillover effects
    if (outcome.spillover !== 0 && outcome.spilloverScope !== 'none') {
        const otherBlocs = (allBlocs || []).filter(b => b.id !== blocId);

        let spillTargets = [];
        if (outcome.spilloverScope === 'all_others' || outcome.spilloverScope === 'all') {
            spillTargets = outcome.spilloverScope === 'all'
                ? (allBlocs || [])  // includes target bloc for counter-protest
                : otherBlocs;
        } else if (outcome.spilloverScope === 'adjacent' || outcome.spilloverScope === 'random_adjacent') {
            // "Adjacent" = blocs sharing at least one strong ideology axis with the target
            const targetAxes = [];
            for (const key of ['axis_liberty_equality', 'axis_tradition_progress', 'axis_security_freedom', 'axis_globalism_nationalism', 'axis_individualism_collectivism']) {
                if (Math.abs((targetBloc[key] ?? 50) - 50) >= 10) targetAxes.push(key);
            }
            const adjacent = otherBlocs.filter(b => {
                return targetAxes.some(key => {
                    const bVal = b[key] ?? 50;
                    const tVal = targetBloc[key] ?? 50;
                    return Math.abs(bVal - 50) >= 10 && ((bVal < 50) === (tVal < 50));
                });
            });
            if (outcome.spilloverScope === 'random_adjacent' && adjacent.length > 0) {
                spillTargets = [adjacent[Math.floor(Math.random() * adjacent.length)]];
            } else {
                spillTargets = adjacent;
            }
        }

        for (const sb of spillTargets) {
            const row = approvalByBloc[sb.id];
            if (!row) continue;
            // For non-'all' scopes, skip target bloc (already handled above)
            if (sb.id === blocId && outcome.spilloverScope !== 'all') continue;
            const oldMom = Number(row.momentum || 0);
            const newMom = Math.max(-50, Math.min(50, Math.round((oldMom + outcome.spillover) * 100) / 100));
            await supabase.from('faction_bloc_approval')
                .update({ momentum: newMom }).eq('id', row.id);
            effects.push({ bloc: sb.bloc_name, blocId: sb.id, value: outcome.spillover, oldMom, newMom });
        }
    }

    // Polarization effect
    if (outcome.polarization > 0 && nation) {
        const newPol = Math.min(100, (nation.polarization || 0) + outcome.polarization);
        await supabase.from('nations').update({ polarization: newPol }).eq('id', nationId);
        effects.push({ stat: 'Polarization', value: outcome.polarization });
    }

    // ── 8. Deduct AP ──
    const apResult = await deductAP(supabase, factionId, RALLY_CONFIG.AP_COST);

    // ── 9. Log ──
    const headline = outcome.headline(targetBloc.bloc_name);
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'rally',
        ap_cost: RALLY_CONFIG.AP_COST,
        money_cost: 0,
        tick_performed: currentTick,
        result: {
            blocId, blocName: targetBloc.bloc_name,
            outcomeId, outcomeName: outcome.name,
            headline, effects, weights, ralliedRecently,
            // Keep tags for promise compatibility — derive from bloc axes
            tags: _deriveBlocTags(targetBloc),
        }
    });

    return {
        success: true,
        outcomeId,
        outcomeName: outcome.name,
        headline,
        effects,
        weights,
        newAp: apResult.newAp ?? ((faction.action_points || 0) - RALLY_CONFIG.AP_COST),
    };
}

/** Derive ideology tags from a bloc's axis leanings (for promise compatibility). */
function _deriveBlocTags(bloc) {
    const AXIS_MAP = [
        { key: 'axis_liberty_equality', left: 'LIBERTY', right: 'EQUALITY' },
        { key: 'axis_tradition_progress', left: 'TRADITION', right: 'PROGRESS' },
        { key: 'axis_security_freedom', left: 'SECURITY', right: 'FREEDOM' },
        { key: 'axis_globalism_nationalism', left: 'GLOBALISM', right: 'NATIONALISM' },
        { key: 'axis_individualism_collectivism', left: 'INDIVIDUALISM', right: 'COLLECTIVISM' },
    ];
    const tags = [];
    for (const ax of AXIS_MAP) {
        const val = bloc[ax.key] ?? 50;
        if (val < 40) tags.push(ax.left);
        else if (val > 60) tags.push(ax.right);
    }
    return tags;
}


// ==================== VOTER OUTREACH ====================

const OUTREACH_CONFIG = {
    AP_COST: 4,
    COOLDOWN_WINDOW: 4, // look back 4 ticks for diminishing returns
};

const OUTREACH_AXIS_KEYS = [
    'liberty_equality', 'tradition_progress', 'security_freedom',
    'globalism_nationalism', 'individualism_collectivism'
];

/**
 * Compute ideology alignment between a faction and a voter bloc (0-100).
 * Delegates to the canonical computeIdeologyAlignment in ideology.js.
 */
function computeOutreachAlignment(factionIdeology, bloc) {
    return computeIdeologyAlignment(factionIdeology, bloc);
}

/**
 * Compute the base outreach effect and diminishing returns.
 * @returns {{ alignment, base, diminished, penalty }}
 */
function calcOutreachEffect(alignment, recentOutreachCount) {
    // base: 3 at alignment 0, up to 5 at alignment 100
    const base = Math.round(3 + (alignment / 100) * 2);
    const diminished = Math.max(1, base - recentOutreachCount);
    return { alignment, base, diminished, penalty: base - diminished };
}

/**
 * Compute friction — opposed blocs that lose approval when you outreach to a target bloc.
 * Two blocs are "opposed" if they sit on opposite sides (one <40, other >60) of any axis
 * where the target bloc holds a strong opinion (< 35 or > 65).
 */
function calcOutreachFriction(targetBloc, allBlocs, factionIdeology) {
    const frictions = [];
    const targetAxes = [];

    // Find axes where target bloc has a strong leaning
    for (const axisKey of OUTREACH_AXIS_KEYS) {
        const val = targetBloc['axis_' + axisKey] ?? 50;
        if (val < 35 || val > 65) targetAxes.push({ key: axisKey, val });
    }

    for (const other of allBlocs) {
        if (other.id === targetBloc.id) continue;

        // Check if this bloc is ideologically opposed on any of the target's strong axes
        let isOpposed = false;
        for (const { key, val: tVal } of targetAxes) {
            const oVal = other['axis_' + key] ?? 50;
            // Opposed: one is < 35 and the other is > 65 (opposite sides)
            if ((tVal < 35 && oVal > 65) || (tVal > 65 && oVal < 35)) {
                isOpposed = true;
                break;
            }
        }

        if (!isOpposed) continue;

        // Friction penalty scales with how aligned YOUR party is with the opposed bloc
        const yourAlignment = factionIdeology
            ? computeOutreachAlignment(factionIdeology, other)
            : 50;

        // High alignment with opposed bloc = more friction
        const penalty = yourAlignment > 60 ? -2 : yourAlignment > 40 ? -1 : 0;
        if (penalty < 0) {
            frictions.push({ blocId: other.id, blocName: other.bloc_name, penalty, alignment: yourAlignment });
        }
    }

    return frictions;
}

/**
 * Execute voter outreach targeting a specific voter bloc.
 * Guaranteed result — no randomness, no polarization, no headline.
 * Returns { success, effects, newAp }
 */
async function executeOutreach(supabase, factionId, nationId, blocId, currentTick) {
    // ── 1. Validate AP ──
    const { data: faction } = await supabase
        .from('factions').select('action_points').eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < OUTREACH_CONFIG.AP_COST)
        return { success: false, error: `Not enough AP. Need ${OUTREACH_CONFIG.AP_COST}.` };

    // ── 2. Load recent outreach actions for diminishing returns ──
    const { data: recentOutreach } = await supabase
        .from('campaign_actions')
        .select('tick_performed, result')
        .eq('party_id', factionId)
        .eq('action_type', 'outreach')
        .gte('tick_performed', currentTick - OUTREACH_CONFIG.COOLDOWN_WINDOW)
        .order('tick_performed', { ascending: false });

    const outreachedThisTick = (recentOutreach || []).some(r => r.tick_performed === currentTick);
    if (outreachedThisTick)
        return { success: false, error: 'Already conducted outreach this tick.' };

    const recentToBloc = (recentOutreach || []).filter(r => r.result?.blocId === blocId).length;

    // ── 3. Load faction ideology ──
    const { data: factionIdeo } = await supabase
        .from('faction_ideology')
        .select('liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism')
        .eq('faction_id', factionId)
        .maybeSingle();

    // ── 4. Load all blocs ──
    const { data: allBlocs } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, population_weight, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nationId).eq('is_active', true);

    const targetBloc = (allBlocs || []).find(b => b.id === blocId);
    if (!targetBloc) return { success: false, error: 'Voter bloc not found.' };

    // ── 5. Load approval rows ──
    const { data: approvalRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score, momentum')
        .eq('faction_id', factionId);
    const approvalByBloc = {};
    for (const row of (approvalRows || [])) approvalByBloc[row.bloc_id] = row;

    // ── 6. Compute alignment and effect ──
    const alignment = factionIdeo ? computeOutreachAlignment(factionIdeo, targetBloc) : 50;
    const { diminished } = calcOutreachEffect(alignment, recentToBloc);

    // ── 7. Apply target bloc effect (momentum only — preference_score recalculated by three-pillar calc) ──
    const effects = [];
    const targetRow = approvalByBloc[blocId];
    if (targetRow) {
        const oldMom = Number(targetRow.momentum || 0);
        const newMom = Math.max(-50, Math.min(50, Math.round((oldMom + diminished) * 100) / 100));
        await supabase.from('faction_bloc_approval')
            .update({ momentum: newMom }).eq('id', targetRow.id);
        effects.push({ bloc: targetBloc.bloc_name, blocId, value: diminished, oldMom, newMom });
    }

    // ── 8. Apply friction to opposed blocs ──
    const frictions = calcOutreachFriction(targetBloc, allBlocs || [], factionIdeo);
    for (const fri of frictions) {
        const row = approvalByBloc[fri.blocId];
        if (!row) continue;
        const oldMom = Number(row.momentum || 0);
        const newMom = Math.max(-50, Math.min(50, Math.round((oldMom + fri.penalty) * 100) / 100));
        await supabase.from('faction_bloc_approval')
            .update({ momentum: newMom }).eq('id', row.id);
        effects.push({ bloc: fri.blocName, blocId: fri.blocId, value: fri.penalty, oldMom, newMom });
    }

    // ── 9. Deduct AP ──
    const apResult = await deductAP(supabase, factionId, OUTREACH_CONFIG.AP_COST);

    // ── 10. Log ──
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'outreach',
        ap_cost: OUTREACH_CONFIG.AP_COST,
        money_cost: 0,
        tick_performed: currentTick,
        result: {
            blocId, blocName: targetBloc.bloc_name,
            alignment, diminished,
            effects,
            recentToBloc,
            tags: _deriveBlocTags(targetBloc),
        }
    });

    return {
        success: true,
        effects,
        alignment,
        diminished,
        newAp: apResult.newAp ?? ((faction.action_points || 0) - OUTREACH_CONFIG.AP_COST),
    };
}

/**
 * Set or change a party endorsement preference.
 *
 * Rules:
 * - First endorsement preference for a faction is free.
 * - Changing to a different endorsed faction costs 1 AP (atomic deduct_ap RPC).
 * - Re-selecting the same endorsed faction is a no-op (no AP cost).
 * - Always writes a campaign_actions audit row with a reason string.
 */
async function executeEndorsementPreference(supabase, factionId, nationId, endorsedFactionId, currentTick, reason = 'endorsement_preference_update') {
    if (!factionId || !nationId || !endorsedFactionId) {
        return { success: false, error: 'Missing endorsement parameters.' };
    }

    const normalizedReason = String(reason || 'endorsement_preference_update').trim() || 'endorsement_preference_update';

    const { data: existingPref, error: prefErr } = await supabase
        .from('faction_endorsements')
        .select('id, endorsed_faction_id')
        .eq('faction_id', factionId)
        .maybeSingle();
    if (prefErr) {
        return { success: false, error: prefErr.message || 'Failed to load endorsement preference.' };
    }

    let newAp = null;
    let apCharged = 0;
    const existingTarget = existingPref?.endorsed_faction_id || null;

    // First preference: create for free
    if (!existingPref) {
        const { error: insertErr } = await supabase.from('faction_endorsements').insert({
            faction_id: factionId,
            nation_id: nationId,
            endorsed_faction_id: endorsedFactionId,
            updated_at_tick: currentTick
        });
        if (insertErr) {
            return { success: false, error: insertErr.message || 'Failed to create endorsement preference.' };
        }
    }
    // Same target: no AP charge, but refresh timestamp for history visibility
    else if (existingTarget === endorsedFactionId) {
        const { error: sameErr } = await supabase
            .from('faction_endorsements')
            .update({ updated_at_tick: currentTick })
            .eq('id', existingPref.id);
        if (sameErr) {
            return { success: false, error: sameErr.message || 'Failed to keep endorsement preference.' };
        }
    }
    // Preference change: charge 1 AP through atomic RPC
    else {
        const apResult = await deductAP(supabase, factionId, 1);
        if (!apResult.success) {
            return { success: false, error: apResult.error || 'Not enough AP to change endorsement.' };
        }
        newAp = apResult.newAp;
        apCharged = 1;

        const { error: updateErr } = await supabase
            .from('faction_endorsements')
            .update({
                endorsed_faction_id: endorsedFactionId,
                updated_at_tick: currentTick
            })
            .eq('id', existingPref.id);
        if (updateErr) {
            return { success: false, error: updateErr.message || 'Failed to update endorsement preference.' };
        }
    }

    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'endorsement_preference',
        tick_performed: currentTick,
        ap_cost: apCharged,
        result: {
            reason: normalizedReason,
            previous_endorsed_faction_id: existingTarget,
            endorsed_faction_id: endorsedFactionId,
            ap_charged: apCharged
        }
    });

    return {
        success: true,
        newAp,
        apCharged,
        changed: existingTarget !== endorsedFactionId,
        alreadySelected: existingTarget === endorsedFactionId
    };
}


// ==================== ATTACK CAMPAIGN ====================

const ATTACK_CONFIG = {
    AP_COST: 3,
    CREDIBILITY_COST: 20,       // credibility drops 20 per attack
    COOLDOWN_WINDOW: 6,         // look back 6 ticks for recent attacks
    COUNTER_ATTACK_WINDOW: 3,   // target can counter-attack within 3 ticks
    COUNTER_ATTACK_AP_COST: 1,  // counter-attack costs only 1 AP
    COUNTER_ATTACK_BONUS: 2,    // +2 effectiveness bonus for counter-attacks
};

const ATTACK_VECTORS = [
    {
        id: 'broken_promises',
        name: 'Broken Promises',
        icon: '\u2605',
        description: 'Attack their failure to deliver on commitments',
        evidence_required: true,
        effectiveness: 'high',
    },
    {
        id: 'voting_record',
        name: 'Voting Record',
        icon: '\u00A7',
        description: 'Highlight unpopular or controversial votes',
        evidence_required: true,
        effectiveness: 'high',
    },
    {
        id: 'governance',
        name: 'Governance Record',
        icon: '\u25BC',
        description: 'Attack stat deterioration on their watch',
        evidence_required: true,
        effectiveness: 'high',
    },
    {
        id: 'ideology',
        name: 'Ideology',
        icon: '\u25C6',
        description: 'Frame their positions as extreme or out of touch',
        evidence_required: false,
        effectiveness: 'moderate',
    },
    {
        id: 'smear',
        name: 'General Smear',
        icon: '\u25CF',
        description: 'No specific ammunition \u2014 just negative framing',
        evidence_required: false,
        effectiveness: 'low',
    },
];

const ATTACK_OUTCOMES = [
    { id: 'devastating', name: 'Devastating Hit', icon: '\u2726', targetMin: -7, targetMax: -5, selfMin: 3, selfMax: 3, polarization: 0.4 },
    { id: 'effective', name: 'Effective Attack', icon: '\u25CF', targetMin: -4, targetMax: -3, selfMin: 1, selfMax: 2, polarization: 0.4 },
    { id: 'glancing', name: 'Glancing Blow', icon: '\u25E6', targetMin: -1, targetMax: -1, selfMin: 0, selfMax: 0, polarization: 0.4 },
    { id: 'backfire', name: 'Backfire', icon: '\u26A0', targetMin: 1, targetMax: 2, selfMin: -4, selfMax: -2, polarization: 0.4 },
    { id: 'mutual', name: 'Mutual Destruction', icon: '\u2715', targetMin: -3, targetMax: -3, selfMin: -2, selfMax: -2, polarization: 0.4 },
];

const ATTACK_OUTCOME_COLORS = {
    devastating: '#4ade80',
    effective: '#22d3ee',
    glancing: '#facc15',
    backfire: '#f97316',
    mutual: '#ef4444',
};

/**
 * Get outcome probability weights based on evidence strength.
 */
function getAttackOutcomeWeights(strength) {
    if (strength === 'strong') {
        return { devastating: 22, effective: 38, glancing: 22, backfire: 8, mutual: 10 };
    } else if (strength === 'moderate') {
        return { devastating: 10, effective: 28, glancing: 30, backfire: 18, mutual: 14 };
    } else {
        return { devastating: 4, effective: 18, glancing: 30, backfire: 30, mutual: 18 };
    }
}

/**
 * Roll an attack outcome from weighted probabilities.
 */
function rollAttackOutcome(weights) {
    const order = ['devastating', 'effective', 'glancing', 'backfire', 'mutual'];
    let sum = 0;
    const cumulative = [];
    for (const key of order) {
        sum += weights[key] || 0;
        cumulative.push({ id: key, threshold: sum });
    }
    const roll = Math.random() * sum;
    for (const c of cumulative) {
        if (roll <= c.threshold) return c.id;
    }
    return 'glancing';
}

/**
 * Generate a contextual headline for the attack outcome.
 */
function _attackHeadline(outcomeId, targetName, vectorId) {
    const headlines = {
        devastating: {
            broken_promises: `Damning evidence of ${targetName}'s broken promises dominates news cycle`,
            voting_record: `${targetName}'s voting record exposed \u2014 public outrage mounts`,
            governance: `${targetName}'s governance failures laid bare in devastating critique`,
            ideology: `${targetName} branded as extremists in viral opposition campaign`,
            smear: `Relentless attacks leave ${targetName} scrambling to respond`,
        },
        effective: {
            broken_promises: `Opposition research into ${targetName}'s failed promises gains traction`,
            voting_record: `${targetName}'s controversial votes draw media scrutiny`,
            governance: `Questions mount over ${targetName}'s record on key indicators`,
            ideology: `Voters question ${targetName}'s ideological direction after critique`,
            smear: `Negative campaign against ${targetName} lands some punches`,
        },
        glancing: {
            broken_promises: `Attack on ${targetName}'s promises fails to resonate with voters`,
            voting_record: `Criticism of ${targetName}'s votes dismissed as political theatre`,
            governance: `Governance critique against ${targetName} falls flat`,
            ideology: `Ideological attack on ${targetName} largely ignored by public`,
            smear: `Smear campaign against ${targetName} fizzles \u2014 voters indifferent`,
        },
        backfire: {
            broken_promises: `Promise attack on ${targetName} backfires \u2014 sympathy for target surges`,
            voting_record: `Voters rally behind ${targetName} after what they see as unfair attack`,
            governance: `Governance critique seen as hypocritical \u2014 attacker's credibility drops`,
            ideology: `Ideological attack makes attackers look petty \u2014 ${targetName} gains sympathy`,
            smear: `Baseless smear against ${targetName} draws media rebuke`,
        },
        mutual: {
            broken_promises: `Ugly exchange over broken promises leaves both parties damaged`,
            voting_record: `Mudslinging over voting records erodes public trust in politics`,
            governance: `Governance blame game leaves all sides worse off`,
            ideology: `Ideological warfare between parties leaves voters disgusted`,
            smear: `Negative spiral damages both parties \u2014 polarization spikes`,
        },
    };
    return (headlines[outcomeId] && headlines[outcomeId][vectorId])
        || `Attack campaign against ${targetName} produces ${outcomeId} result`;
}

/**
 * Gather attack evidence (broken promises, controversial votes, stat deterioration)
 * for a target party. Used by the UI to show available attack vectors.
 */
async function gatherAttackEvidence(supabase, targetFactionId, nationId, currentTick) {
    const evidence = {
        broken_promises: [],
        controversial_votes: [],
        governance_record: [],
        is_governing: false,
    };

    // 1. Broken promises (last 30 ticks)
    const { data: brokenPromises } = await supabase
        .from('fundraiser_promises')
        .select('id, demand_text, bloc_name, tick_resolved, tick_created')
        .eq('party_id', targetFactionId)
        .eq('status', 'broken')
        .gte('tick_resolved', currentTick - 30)
        .order('tick_resolved', { ascending: false })
        .limit(5);

    evidence.broken_promises = (brokenPromises || []).map(p => ({
        text: p.demand_text,
        bloc: p.bloc_name,
        tick: p.tick_resolved,
    }));

    // 2. Controversial votes — bills where this party voted opposite to majority outcome
    const { data: recentBills } = await supabase
        .from('bills')
        .select('id, bill_name, status, bill_support(faction_id, stance), bill_articles(policy_id, policies(policy_name))')
        .eq('nation_id', nationId)
        .in('status', ['passed', 'failed', 'enacted'])
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(30);

    for (const bill of (recentBills || [])) {
        const support = bill.bill_support || [];
        const targetVote = support.find(s => s.faction_id === targetFactionId);
        if (!targetVote) continue;

        // Controversial = voted against a bill that passed, or voted for a bill that failed
        const controversial =
            (bill.status === 'passed' || bill.status === 'enacted') && targetVote.stance === 'reject' ||
            bill.status === 'failed' && targetVote.stance === 'accept';

        if (controversial) {
            evidence.controversial_votes.push({
                bill: bill.bill_name,
                stance: targetVote.stance,
                outcome: bill.status,
            });
        }
    }
    evidence.controversial_votes = evidence.controversial_votes.slice(0, 5);

    // 3. Governance record — check if target is in governing coalition
    const coalition = await fetchActiveCoalition(supabase, nationId);
    const coalitionPartyIds = new Set(coalition?.party_ids || []);
    evidence.is_governing = coalitionPartyIds.has(targetFactionId);

    if (evidence.is_governing) {
        // Find ministries held by this party
        const { data: ministries } = await supabase
            .from('ministries')
            .select('ministry_key')
            .eq('nation_id', nationId)
            .eq('party_id', targetFactionId)
            .eq('is_active', true);

        if (ministries && ministries.length > 0) {
            // Check stat trends for stats under their ministries
            for (const m of ministries) {
                const stats = MINISTRY_TO_STATS[m.ministry_key] || [];
                for (const statKey of stats) {
                    const { data: history } = await supabase
                        .from('stat_history')
                        .select('value, tick')
                        .eq('nation_id', nationId)
                        .eq('stat_name', statKey)
                        .order('tick', { ascending: false })
                        .limit(6);

                    if (history && history.length >= 2) {
                        const newest = history[0].value;
                        const oldest = history[history.length - 1].value;
                        const change = newest - oldest;
                        const sign = statDirectionSign(statKey);
                        // Stat worsened if it moved opposite to its "good" direction
                        if ((sign === 1 && change < -3) || (sign === -1 && change > 3)) {
                            const changeStr = change > 0 ? `+${Math.round(change)}` : `${Math.round(change)}`;
                            evidence.governance_record.push({
                                stat: statKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                                change: changeStr,
                                ministry: m.ministry_key,
                            });
                        }
                    }
                }
            }
        }
        evidence.governance_record = evidence.governance_record.slice(0, 5);
    }

    return evidence;
}

/**
 * Build available attack vectors for a target based on gathered evidence.
 */
function buildAttackVectors(evidence) {
    const vectors = [];

    if (evidence.broken_promises.length > 0) {
        vectors.push({
            ...ATTACK_VECTORS[0],
            evidence: evidence.broken_promises,
            strength: 'strong',
        });
    }

    if (evidence.controversial_votes.length > 0) {
        vectors.push({
            ...ATTACK_VECTORS[1],
            evidence: evidence.controversial_votes,
            strength: 'strong',
        });
    }

    if (evidence.governance_record.length > 0 && evidence.is_governing) {
        vectors.push({
            ...ATTACK_VECTORS[2],
            evidence: evidence.governance_record,
            strength: 'strong',
        });
    }

    // Ideology is always available (moderate strength)
    vectors.push({
        ...ATTACK_VECTORS[3],
        evidence: null,
        strength: 'moderate',
    });

    // General smear is always available (weak strength)
    vectors.push({
        ...ATTACK_VECTORS[4],
        evidence: null,
        strength: 'weak',
    });

    return vectors;
}

/**
 * Compute attack credibility from recent attack history.
 * Starts at 100, -20 per attack in the last COOLDOWN_WINDOW ticks, min 20.
 */
function computeAttackCredibility(recentAttackCount) {
    return Math.max(20, 100 - recentAttackCount * ATTACK_CONFIG.CREDIBILITY_COST);
}

/**
 * Execute an attack campaign against a target party.
 * Returns { success, outcomeId, outcomeName, headline, effects, weights, opensCounter, newAp }
 */
async function executeAttack(supabase, factionId, nationId, targetFactionId, vectorId, currentTick) {
    // ── 1. Validate AP ──
    const { data: faction } = await supabase
        .from('factions').select('action_points, faction_name').eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < ATTACK_CONFIG.AP_COST)
        return { success: false, error: `Not enough AP. Need ${ATTACK_CONFIG.AP_COST}.` };

    // ── 2. Load target ──
    const { data: targetFaction } = await supabase
        .from('factions').select('faction_name, abbreviation').eq('id', targetFactionId).single();
    if (!targetFaction) return { success: false, error: 'Target party not found.' };

    // ── 3. Check recent attacks (cooldown) ──
    const { data: recentAttacks } = await supabase
        .from('campaign_actions')
        .select('tick_performed, result')
        .eq('party_id', factionId)
        .eq('action_type', 'attack')
        .gte('tick_performed', currentTick - ATTACK_CONFIG.COOLDOWN_WINDOW)
        .order('tick_performed', { ascending: false });

    const attackedThisTick = (recentAttacks || []).some(r => r.tick_performed === currentTick);
    if (attackedThisTick)
        return { success: false, error: 'Already launched an attack this tick.' };

    // ── 4. Gather evidence and validate vector ──
    const evidence = await gatherAttackEvidence(supabase, targetFactionId, nationId, currentTick);
    const vectors = buildAttackVectors(evidence);
    const vector = vectors.find(v => v.id === vectorId);
    if (!vector) return { success: false, error: 'Invalid attack vector.' };
    if (vector.evidence_required && (!vector.evidence || vector.evidence.length === 0))
        return { success: false, error: `No evidence available for ${vector.name}.` };

    // ── 5. Roll outcome ──
    const weights = getAttackOutcomeWeights(vector.strength);
    const outcomeId = rollAttackOutcome(weights);
    const outcome = ATTACK_OUTCOMES.find(o => o.id === outcomeId);

    // ── 6. Calculate effects ──
    const targetDelta = outcome.targetMin + Math.floor(Math.random() * (outcome.targetMax - outcome.targetMin + 1));
    const selfDelta = outcome.selfMin + Math.floor(Math.random() * (outcome.selfMax - outcome.selfMin + 1));

    // ── 7. Apply effects to all blocs via momentum ──
    const effects = [];

    // Target party: apply momentum to all blocs
    if (targetDelta !== 0) {
        await adjustMomentumAll(supabase, nationId, targetFactionId, targetDelta, 'campaign:attack_target');
        effects.push({ label: targetFaction.faction_name, value: targetDelta });
    }

    // Self: apply momentum to all blocs
    if (selfDelta !== 0) {
        const selfLabel = selfDelta > 0 ? 'Your party (credibility gain)' : 'Your party (credibility loss)';
        await adjustMomentumAll(supabase, nationId, factionId, selfDelta, 'campaign:attack_self');
        effects.push({ label: selfLabel, value: selfDelta });
    }

    // Polarization
    if (outcome.polarization > 0) {
        const { data: nation } = await supabase
            .from('nations').select('polarization').eq('id', nationId).single();
        if (nation) {
            const newPol = Math.min(100, (nation.polarization || 0) + outcome.polarization);
            await supabase.from('nations').update({ polarization: newPol }).eq('id', nationId);
        }
        effects.push({ label: 'Polarization', value: outcome.polarization });
    }

    // ── 8. Deduct AP ──
    const apResult = await deductAP(supabase, factionId, ATTACK_CONFIG.AP_COST);

    // ── 9. Generate headline ──
    const headline = _attackHeadline(outcomeId, targetFaction.faction_name, vectorId);

    // ── 10. Log action ──
    const opensCounter = ['devastating', 'effective'].includes(outcomeId);
    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'attack',
        ap_cost: ATTACK_CONFIG.AP_COST,
        money_cost: 0,
        tick_performed: currentTick,
        result: {
            targetFactionId,
            targetName: targetFaction.faction_name,
            targetAbbrev: targetFaction.abbreviation,
            vectorId,
            vectorName: vector.name,
            strength: vector.strength,
            outcomeId,
            outcomeName: outcome.name,
            headline,
            effects,
            weights,
            opensCounter,
            counterWindowEnd: opensCounter ? currentTick + ATTACK_CONFIG.COUNTER_ATTACK_WINDOW : null,
        }
    });

    return {
        success: true,
        outcomeId,
        outcomeName: outcome.name,
        headline,
        effects,
        weights,
        opensCounter,
        newAp: apResult.newAp ?? ((faction.action_points || 0) - ATTACK_CONFIG.AP_COST),
    };
}


// ==================== MAKE PROMISE ====================

const MAKE_PROMISE_CONFIG = {
    AP_COST: 2,
    MONEY_COST: 0,
    STAT_DELTA: 10,                    // Promise to change stat by ±10
    DEADLINE_DICE: 12,                 // 1D12 + base
    DEADLINE_BASE: 12,                 // base ticks added to roll (range: 13-24)
    APPROVAL_ON_PROMISE_STAT: 4,       // immediate bump with affected blocs (stat type)
    APPROVAL_ON_PROMISE_CRISIS: 2,     // immediate bump with all blocs (crisis type)
    APPROVAL_IF_KEPT: 12,              // permanent legacy reward
    PENALTY_PER_TICK_MIN: 1,           // -1D3 per tick while governing & unfulfilled
    PENALTY_PER_TICK_MAX: 3,
    PENALTY_IF_BROKEN: 8,              // permanent legacy penalty on deadline expiry
    MAX_ACTIVE_PROMISES: 5,            // limit active promises per faction
    // Promise resolution rewards/penalties (used by resolvePromise)
    KEPT_PREF_BONUS: 5,               // +preference with donor/affected bloc
    KEPT_MOMENTUM: 4,                  // +momentum when promise kept
    BROKEN_DONOR_PREF: -8,            // -preference with donor/affected bloc
    BROKEN_ALL_PREF: -2,              // -preference with ALL blocs
    BROKEN_MOMENTUM: -12,             // momentum hit when promise broken
    BROKEN_NERVOUS_PREF: -1,          // other active promise holders get nervous
};

/**
 * Execute "Make Promise" — faction publicly commits to a stat target or crisis resolution.
 *
 * @param {string} promiseType  'stat' | 'crisis'
 * @param {object} params       { statKey, direction } for stat; { crisisId } for crisis
 * @returns result object with promise details
 */
async function executeMakePromise(supabase, factionId, nationId, currentTick, promiseType, params) {
    const cfg = MAKE_PROMISE_CONFIG;

    // ── 1. Validate faction ──
    const { data: faction } = await supabase
        .from('factions').select('party_funds, action_points, abbreviation, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };

    if (cfg.AP_COST > 0 && (faction.action_points || 0) < cfg.AP_COST)
        return { success: false, error: `Not enough AP. Need ${cfg.AP_COST}.` };

    // ── 2. Check active promise limit ──
    const { data: activePromises } = await supabase
        .from('fundraiser_promises')
        .select('id, demand_type, conditions')
        .eq('party_id', factionId)
        .eq('status', 'active');

    if ((activePromises || []).length >= cfg.MAX_ACTIVE_PROMISES)
        return { success: false, error: `Maximum ${cfg.MAX_ACTIVE_PROMISES} active promises reached.` };

    // ── 2b. Check per-tick rate limit (max 1 promise per tick) ──
    const { data: promisesThisTick } = await supabase
        .from('fundraiser_promises')
        .select('id')
        .eq('party_id', factionId)
        .eq('tick_created', currentTick);
    if ((promisesThisTick || []).length >= 1)
        return { success: false, error: 'You can only make 1 promise per tick.' };

    // ── 3. Load nation + blocs ──
    const { data: nation } = await supabase
        .from('nations').select('*').eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };

    const { data: allBlocs } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, population_weight, priority_issues')
        .eq('nation_id', nationId).eq('is_active', true);

    const { data: approvalRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score')
        .eq('faction_id', factionId);
    const approvalByBloc = {};
    for (const row of (approvalRows || [])) approvalByBloc[row.bloc_id] = row;

    // ── 4. Roll deadline: 1D12 + 12 ──
    const deadlineRoll = Math.floor(Math.random() * cfg.DEADLINE_DICE) + 1;
    const deadlineTicks = deadlineRoll + cfg.DEADLINE_BASE;
    const tickDeadline = currentTick + deadlineTicks;

    // ── 5. Build promise based on type ──
    let demandText, demandType, conditions, affectedBlocIds, affectedBlocNames;

    if (promiseType === 'stat') {
        const { statKey } = params;
        if (!statKey) return { success: false, error: 'No stat selected.' };
        if (EXCLUDED_PROMISE_STATS.has(statKey)) return { success: false, error: 'Cannot promise on this stat.' };
        const sign = statDirectionSign(statKey);
        if (sign === 0) return { success: false, error: 'Stat has no clear direction.' };

        // Prevent duplicate stat promises
        const hasDuplicate = (activePromises || []).some(p =>
            p.conditions?.stat_key === statKey && p.demand_type === 'stat_target');
        if (hasDuplicate)
            return { success: false, error: 'You already have an active promise for this stat.' };

        const currentVal = Number(nation[statKey] ?? 50);
        // Auto-determine direction: good stats → increase, bad stats → decrease
        const dir = sign === 1 ? 'above' : 'below';
        const targetValue = dir === 'above'
            ? Math.min(100, Math.round(currentVal + cfg.STAT_DELTA))
            : Math.max(0, Math.round(currentVal - cfg.STAT_DELTA));

        const statLabel = statKey.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        demandText = dir === 'above'
            ? `Increase ${statLabel} to ${targetValue}`
            : `Reduce ${statLabel} to ${targetValue}`;
        demandType = 'stat_target';
        conditions = {
            stat_key: statKey,
            direction: dir,
            baseline_value: currentVal,
            target_value: targetValue,
            delta: cfg.STAT_DELTA,
        };

        // Find affected blocs: those whose priority_issues map to this stat
        affectedBlocIds = [];
        affectedBlocNames = [];
        for (const b of (allBlocs || [])) {
            const issues = b.priority_issues || [];
            for (const issue of issues) {
                const catStats = ISSUE_CATEGORY_STATS[issue] || [];
                if (catStats.includes(statKey)) {
                    affectedBlocIds.push(b.id);
                    affectedBlocNames.push(b.bloc_name);
                    break;
                }
            }
        }
    } else if (promiseType === 'crisis') {
        const { crisisId } = params;
        if (!crisisId) return { success: false, error: 'No crisis selected.' };

        // Validate the crisis is active
        const { data: crisisRecord } = await supabase
            .from('active_crises')
            .select('id, crisis_id, started_at_tick')
            .eq('id', crisisId)
            .eq('nation_id', nationId)
            .single();
        if (!crisisRecord) return { success: false, error: 'Crisis not found or not active.' };

        // Get crisis name
        const { data: crisisTemplate } = await supabase
            .from('crisis_templates')
            .select('name, description')
            .eq('id', crisisRecord.crisis_id)
            .single();

        const crisisName = crisisTemplate?.name || 'Unknown Crisis';

        // Prevent duplicate crisis promises
        const hasDuplicate = (activePromises || []).some(p =>
            p.conditions?.crisis_id === crisisId && p.demand_type === 'crisis_resolution');
        if (hasDuplicate)
            return { success: false, error: 'You already have an active promise for this crisis.' };

        demandText = `Resolve ${crisisName}`;
        demandType = 'crisis_resolution';
        conditions = {
            crisis_id: crisisId,
            crisis_template_id: crisisRecord.crisis_id,
            crisis_name: crisisName,
        };

        // Crisis promises affect all blocs
        affectedBlocIds = (allBlocs || []).map(b => b.id);
        affectedBlocNames = (allBlocs || []).map(b => b.bloc_name);
    } else {
        return { success: false, error: 'Invalid promise type.' };
    }

    // ── 6. Apply immediate approval bump ──
    const approvalBump = promiseType === 'crisis'
        ? cfg.APPROVAL_ON_PROMISE_CRISIS
        : cfg.APPROVAL_ON_PROMISE_STAT;

    // ── 6. Apply immediate momentum bump (preference_score recalculated by three-pillar calc) ──
    const blocEffects = [];
    for (const blocId of affectedBlocIds) {
        await adjustMomentum(supabase, nationId, factionId, blocId, approvalBump, `promise:made_${promiseType}`);
        const bloc = (allBlocs || []).find(b => b.id === blocId);
        blocEffects.push({ blocId, blocName: bloc?.bloc_name, delta: approvalBump });
    }

    // ── 7. Deduct AP if needed ──
    let newAp = faction.action_points || 0;
    if (cfg.AP_COST > 0) {
        const apResult = await deductAP(supabase, factionId, cfg.AP_COST);
        newAp = apResult.newAp ?? (newAp - cfg.AP_COST);
    }

    // ── 8. Create promise record ──
    const { data: promise, error: promiseErr } = await supabase
        .from('fundraiser_promises')
        .insert({
            party_id: factionId,
            nation_id: nationId,
            bloc_id: affectedBlocIds[0] || null,
            bloc_name: affectedBlocNames.join(', '),
            demand_index: 0,
            demand_text: demandText,
            demand_type: demandType,
            donation_amount: 0,
            small_amount: 0,
            tick_created: currentTick,
            deadline_ticks: deadlineTicks,
            tick_deadline: tickDeadline,
            conditions,
            progress: { source: 'make_promise', promise_type: promiseType },
            status: 'active',
        })
        .select()
        .single();

    if (promiseErr) {
        console.error('[MakePromise] Promise insert failed:', promiseErr.message);
        return { success: false, error: 'Failed to create promise record.' };
    }

    // ── 9. Log campaign action ──
    const playerAbbr = faction.abbreviation || faction.faction_name;
    const headline = promiseType === 'crisis'
        ? `${playerAbbr} Promises to ${demandText}`
        : `${playerAbbr} Pledges: "${demandText}"`;

    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'make_promise',
        ap_cost: cfg.AP_COST,
        money_cost: 0,
        tick_performed: currentTick,
        result: {
            promiseId: promise.id,
            promiseType,
            demandText,
            demandType,
            conditions,
            deadlineTicks,
            tickDeadline,
            affectedBlocNames,
            approvalBump,
            blocEffects,
            headline,
        }
    });

    return {
        success: true,
        promiseId: promise.id,
        promiseType,
        demandText,
        conditions,
        deadlineTicks,
        tickDeadline,
        affectedBlocNames,
        approvalBump,
        blocEffects,
        headline,
        newAp,
    };
}

/**
 * Get list of stats available for promise-making with current values.
 * Only returns stats with a clear direction (higher/lower is better).
 */
const EXCLUDED_PROMISE_STATS = new Set(['population', 'gdp', 'debt']);

function getPromiseableStats(nation) {
    const results = [];
    for (const statKey of NATION_STAT_COLUMNS) {
        if (EXCLUDED_PROMISE_STATS.has(statKey)) continue;
        const sign = statDirectionSign(statKey);
        if (sign === 0) continue;
        const currentVal = nation[statKey];
        if (currentVal == null) continue;
        const ministry = STAT_TO_MINISTRY[statKey] || null;
        // Good stats (sign=1) → promise to increase; bad stats (sign=-1) → promise to decrease
        const promiseDirection = sign === 1 ? 'increase' : 'decrease';
        results.push({
            statKey,
            label: statKey.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            value: Number(currentVal),
            direction: sign === 1 ? 'higher_is_better' : 'lower_is_better',
            promiseDirection,
            ministry,
        });
    }
    return results;
}



// ==================== MOBILIZE (PARTY CHAIRMAN) ====================

const SUCCESSOR_CONFIG = {
    AP_COST: 9,
    COOLDOWN_TICKS: 60,
    PILLAR_BOOST: 30,
    STABILITY_BOOST: 7,
    OTHER_COUP_READINESS: 5,
    OTHER_LOYALTY_DROP: 10,
    REVOKE_STABILITY_DROP: 5,
    REVOKE_COUP_READINESS: 3,
    REVOKE_LOYALTY_DROP: 20,
    POST_SUCCESSION_FORMER_LOYALTY: -15,
    POST_SUCCESSION_OTHER_LOYALTY: -5,
    DYNASTY_AP_COST: 1,
    DYNASTY_SHADOW_SUCCESSION_STRENGTH: 3,
    DYNASTY_CULTIVATE_LEGITIMACY: 1,
    DYNASTY_CULTIVATE_SUCCESSION_STRENGTH: 5,
    DYNASTY_CULTIVATE_STANDING_PENALTY: 1,
    DYNASTY_PREPARE_SUCCESSION_STRENGTH: 8,
    DYNASTY_PREPARE_EXIT_READINESS: 10,
    DYNASTY_PREPARE_DETECTION_CHANCE: 0.10,
    // Family member successor (appointing own faction)
    FAMILY_STABILITY_BOOST: 1,
    FAMILY_COUP_READINESS: 7,
    FAMILY_PILLAR_PENALTY: 5,
    FAMILY_AP_PENALTY: 1,  // -1 AP/tick while active
};

const MOBILIZE_CONFIG = {
    AP_COST: 3,
    MODES: {
        rally_regime: {
            name: 'Rally for the Regime',
            description: 'Organize demonstrations of public support. Flags, banners, crowds chanting the Strongman\'s name.',
            legitimacy_boost: 3,
            standing_boost: 3,
        },
        rally_self: {
            name: 'Rally for Yourself',
            description: 'The crowds are still there, but your portrait is getting bigger. Provincial committees start seeing you as the future.',
            coup_readiness_boost: 5,
            party_pillar_penalty: 2,
            detection_chance: 0.15,
            standing_penalty_if_detected: 10,
        },
    },
};

/**
 * Execute Mobilize: Party Chairman only, non-ruling faction only.
 * Two modes:
 *  - "rally_regime": +3 legitimacy, +3 standing
 *  - "rally_self": +5 coup readiness, -2 party pillar support, 15% detection → -10 standing
 */
async function executeMobilize(supabase, factionId, nationId, mode, currentTick) {
    const modeConfig = MOBILIZE_CONFIG.MODES[mode];
    if (!modeConfig) return { success: false, error: 'Invalid mobilize mode.' };

    // ── 1. Validate faction + AP ──
    const { data: faction } = await supabase
        .from('factions').select('action_points, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < MOBILIZE_CONFIG.AP_COST)
        return { success: false, error: `Not enough AP. Need ${MOBILIZE_CONFIG.AP_COST}.` };

    // ── 2. Validate steward is party_chairman ──
    const { data: steward } = await supabase
        .from('stewards')
        .select('id, steward_type, standing, coup_readiness, first_name, last_name')
        .eq('faction_id', factionId)
        .eq('nation_id', nationId)
        .eq('is_alive', true)
        .single();
    if (!steward || steward.steward_type !== 'party_chairman')
        return { success: false, error: 'Only the Party Chairman can mobilize.' };

    // ── 3. Validate non-ruling faction ──
    const { data: nation } = await supabase
        .from('nations').select('ruling_faction_id, legitimacy')
        .eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };
    if (nation.ruling_faction_id === factionId)
        return { success: false, error: 'The ruling faction cannot mobilize.' };

    // ── 4. Deduct AP ──
    const apResult = await deductAP(supabase, factionId, MOBILIZE_CONFIG.AP_COST);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    const result = {
        success: true,
        mode,
        modeName: modeConfig.name,
        steward_name: `${steward.first_name} ${steward.last_name}`,
        newAp: apResult.newAp,
        detected: false,
    };

    if (mode === 'rally_regime') {
        // +3 legitimacy (nation stat)
        const newLegitimacy = Math.min(100, Number(nation.legitimacy ?? 50) + modeConfig.legitimacy_boost);
        await supabase.from('nations').update({ legitimacy: newLegitimacy }).eq('id', nationId);

        // +3 standing (steward stat)
        const newStanding = Math.min(100, (steward.standing ?? 50) + modeConfig.standing_boost);
        await supabase.from('stewards').update({ standing: newStanding }).eq('id', steward.id);

        result.legitimacy_change = modeConfig.legitimacy_boost;
        result.standing_change = modeConfig.standing_boost;
        result.newLegitimacy = newLegitimacy;
        result.newStanding = newStanding;

    } else if (mode === 'rally_self') {
        // +5 coup readiness
        const newCR = Math.min(100, (steward.coup_readiness ?? 0) + modeConfig.coup_readiness_boost);
        await supabase.from('stewards').update({ coup_readiness: newCR }).eq('id', steward.id);

        // -2 party pillar support (Grip on Power erosion)
        const { data: partyPillar } = await supabase
            .from('regime_pillars')
            .select('id, support')
            .eq('nation_id', nationId)
            .eq('pillar_key', 'party')
            .single();
        if (partyPillar) {
            const newSupport = Math.max(0, (partyPillar.support ?? 50) - modeConfig.party_pillar_penalty);
            await supabase.from('regime_pillars')
                .update({ support: newSupport, updated_at: new Date().toISOString() })
                .eq('id', partyPillar.id);
            result.party_pillar_change = -modeConfig.party_pillar_penalty;
        }

        result.coup_readiness_change = modeConfig.coup_readiness_boost;
        result.newCoupReadiness = newCR;

        // 15% detection chance
        const detected = Math.random() < modeConfig.detection_chance;
        result.detected = detected;
        if (detected) {
            const newStanding = Math.max(0, (steward.standing ?? 50) - modeConfig.standing_penalty_if_detected);
            await supabase.from('stewards').update({ standing: newStanding }).eq('id', steward.id);
            result.standing_penalty = -modeConfig.standing_penalty_if_detected;
            result.newStanding = newStanding;

            // Log detection event separately
            await supabase.from('campaign_actions').insert({
                party_id: factionId, nation_id: nationId,
                action_type: 'steward_detected_mobilize',
                tick_performed: currentTick,
                result: {
                    steward_name: result.steward_name,
                    faction_name: faction.faction_name,
                    standing_penalty: -modeConfig.standing_penalty_if_detected,
                }
            });
        }
    }

    // ── 5. Log action ──
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'steward_mobilize',
        tick_performed: currentTick,
        result,
    });

    return result;
}


// ==================== PROMISE TICK PROCESSING ====================

/**
 * Evaluate promise fulfillment status for a single promise.
 * Returns { status: 'fulfilled' | 'in_progress' | 'at_risk' | 'broken', progress }
 *
 * This checks stat-based promises. Other types (pass_bill, rally_count, etc.)
 * are tracked via campaign_actions logs and updated externally.
 */
function evaluatePromiseStatus(promise, nationStats, currentTick, ministries, coalitionPartyIds, campaignActions) {
    const cond = promise.conditions;
    const elapsed = currentTick - promise.tick_created;
    const remaining = promise.tick_deadline - currentTick;
    const progress = { ...promise.progress };

    // Helper: check if party holds a specific ministry
    const holdsMinistry = (key) => {
        return (ministries || []).some(m => m.ministry_key === key && m.party_id === promise.party_id);
    };

    switch (promise.demand_type) {
        case 'stat_target': {
            const currentVal = Number(nationStats[cond.stat_key] ?? 50);
            const target = cond.target_value ?? cond.absolute_target;
            progress.current_value = currentVal;
            progress.target_value = target;

            if (cond.direction === 'below' && currentVal <= target) {
                return { status: 'fulfilled', progress };
            }
            if (cond.direction === 'above' && currentVal >= target) {
                return { status: 'fulfilled', progress };
            }

            // At risk if less than 25% time remaining
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) {
                return { status: 'at_risk', progress };
            }
            return { status: 'in_progress', progress };
        }

        case 'ministry_and_stat': {
            const hasMinistry = holdsMinistry(cond.ministry_key);
            const currentVal = Number(nationStats[cond.stat_key] ?? 50);
            const target = cond.target_value ?? cond.absolute_target;
            progress.has_ministry = hasMinistry;
            progress.ministry_key = cond.ministry_key;
            progress.current_value = currentVal;
            progress.target_value = target;

            const statMet = cond.direction === 'below'
                ? currentVal <= target
                : currentVal >= target;

            if (hasMinistry && statMet) {
                return { status: 'fulfilled', progress };
            }
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) {
                return { status: 'at_risk', progress };
            }
            return { status: 'in_progress', progress };
        }

        case 'ministry_and_dual_stat': {
            const hasMinistry = holdsMinistry(cond.ministry_key);
            progress.has_ministry = hasMinistry;
            progress.stats = [];
            let allMet = hasMinistry;

            for (const s of (cond.stats || [])) {
                const currentVal = Number(nationStats[s.stat_key] ?? 50);
                const met = s.direction === 'above'
                    ? currentVal >= s.target_value
                    : currentVal <= s.target_value;
                progress.stats.push({ stat_key: s.stat_key, current: currentVal, target: s.target_value, met });
                if (!met) allMet = false;
            }

            if (allMet) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'stat_floor': {
            const currentVal = Number(nationStats[cond.stat_key] ?? 50);
            const floor = cond.floor;
            progress.current_value = currentVal;
            progress.floor = floor;

            if (currentVal < floor) {
                return { status: 'broken', progress }; // Instant break if floor violated
            }
            return { status: 'in_progress', progress };
        }

        case 'stat_sustained': {
            const currentVal = Number(nationStats[cond.stat_key] ?? 50);
            const threshold = cond.threshold;
            progress.current_value = currentVal;
            progress.threshold = threshold;
            progress.sustained_count = progress.sustained_count || 0;
            progress.required = cond.sustained_ticks;

            if (currentVal >= threshold) {
                progress.sustained_count++;
            } else {
                progress.sustained_count = 0; // Reset on dip
            }

            if (progress.sustained_count >= cond.sustained_ticks) {
                return { status: 'fulfilled', progress };
            }
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'block_stat_decrease':
        case 'block_stat_increase': {
            const currentVal = Number(nationStats[cond.protected_stat] ?? 50);
            const baseline = cond.baseline_value ?? currentVal;
            progress.current_value = currentVal;
            progress.baseline = baseline;

            if (cond.direction === 'no_decrease' && currentVal < baseline - 0.5) {
                return { status: 'broken', progress };
            }
            if (cond.direction === 'no_increase' && currentVal > baseline + 0.5) {
                return { status: 'broken', progress };
            }
            return { status: 'in_progress', progress };
        }

        case 'rally_count': {
            const requiredTags = cond.required_tags || [];
            const matchingRallies = (campaignActions || []).filter(a => {
                if (a.action_type !== 'rally') return false;
                if (a.party_id !== promise.party_id) return false;
                if (a.tick_performed < promise.tick_created) return false;
                if (a.tick_performed > promise.tick_deadline) return false;
                const tags = a.result?.tags || [];
                return requiredTags.some(rt => tags.includes(rt));
            });
            progress.completed = matchingRallies.length;
            progress.required = cond.count;

            if (matchingRallies.length >= cond.count) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'press_conference_count': {
            const matchingPCs = (campaignActions || []).filter(a => {
                if (a.action_type !== 'press_conference') return false;
                if (a.party_id !== promise.party_id) return false;
                if (a.tick_performed < promise.tick_created) return false;
                if (a.tick_performed > promise.tick_deadline) return false;
                return true; // All press conferences count for this
            });
            progress.completed = matchingPCs.length;
            progress.required = cond.count;

            if (matchingPCs.length >= cond.count) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'ministry_appointment': {
            const hasMinistry = holdsMinistry(cond.ministry_key);
            progress.has_ministry = hasMinistry;
            progress.ministry_key = cond.ministry_key;

            if (hasMinistry) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'pass_bill': {
            // Check if a matching bill was passed during the promise window
            const passed = progress.bill_passed || false;
            progress.bill_name = cond.bill_name || 'Required bill';
            if (passed) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'pass_bill_count': {
            const count = progress.bills_passed || 0;
            progress.required = cond.count;
            progress.completed = count;
            if (count >= cond.count) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'crisis_resolution': {
            // Fulfilled when the referenced crisis is no longer active
            // The crisis_id in conditions refers to the active_crises row id
            // Checked externally via processPromiseTick which loads active crises
            if (progress.crisis_resolved) return { status: 'fulfilled', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        case 'repeal_bill':
        case 'block_bill':
        case 'block_bill_tag':
        case 'vote_pattern':
        case 'coalition_restriction':
        case 'no_confidence':
        case 'no_confidence_conditional':
        case 'constitutional_amendment': {
            // These are tracked by external events updating the progress field
            if (progress.completed) return { status: 'fulfilled', progress };
            if (progress.violated) return { status: 'broken', progress };
            if (remaining <= Math.ceil(promise.deadline_ticks * 0.25)) return { status: 'at_risk', progress };
            return { status: 'in_progress', progress };
        }

        default:
            return { status: 'in_progress', progress };
    }
}

/**
 * Process all active promises for a nation during tick advancement.
 * Checks fulfillment, applies rewards/penalties for expired promises.
 */
async function processPromiseTick(supabase, nation, currentTick) {
    const { data: activePromises } = await supabase
        .from('fundraiser_promises')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('status', 'active');

    if (!activePromises || activePromises.length === 0) return [];

    const results = [];

    // Load shared data once
    const { data: ministries } = await supabase
        .from('ministries')
        .select('ministry_key, party_id')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    const coalition = await fetchActiveCoalition(supabase, nation.id);
    const coalitionPartyIds = coalition?.party_ids || [];

    // Load campaign actions for rally/press_conference counting
    const partyIds = [...new Set(activePromises.map(p => p.party_id))];
    const minTick = Math.min(...activePromises.map(p => p.tick_created));
    const { data: campaignActions } = await supabase
        .from('campaign_actions')
        .select('party_id, action_type, tick_performed, result')
        .in('party_id', partyIds)
        .gte('tick_performed', minTick);

    // Fresh nation stats
    const { data: freshNation } = await supabase
        .from('nations').select('*').eq('id', nation.id).single();
    const nationStats = freshNation || nation;

    // Load active crises for crisis_resolution promise checking
    const { data: activeCrises } = await supabase
        .from('active_crises').select('id, crisis_id').eq('nation_id', nation.id);
    const activeCrisisIds = new Set((activeCrises || []).map(ac => ac.id));

    // Build set of governing faction IDs (ruling faction + coalition members)
    const governingFactionIds = new Set([
        nation.ruling_faction_id,
        ...coalitionPartyIds,
    ].filter(Boolean));

    for (const promise of activePromises) {
        const isGoverning = governingFactionIds.has(promise.party_id);

        // If not governing and deadline passed: expire silently, no downside
        if (!isGoverning && currentTick >= promise.tick_deadline) {
            await supabase.from('fundraiser_promises')
                .update({ status: 'expired', tick_resolved: currentTick, updated_at: new Date().toISOString() })
                .eq('id', promise.id);
            results.push({ promise, resolution: 'expired' });
            continue;
        }

        // If not governing: promise is dormant — skip evaluation entirely
        if (!isGoverning) continue;

        // For crisis_resolution promises, check if the crisis is still active
        if (promise.demand_type === 'crisis_resolution' && promise.conditions?.crisis_id) {
            if (!activeCrisisIds.has(promise.conditions.crisis_id)) {
                promise.progress = { ...promise.progress, crisis_resolved: true };
            }
        }

        const evaluation = evaluatePromiseStatus(promise, nationStats, currentTick, ministries, coalitionPartyIds, campaignActions);

        // Update progress
        await supabase.from('fundraiser_promises')
            .update({ progress: evaluation.progress, updated_at: new Date().toISOString() })
            .eq('id', promise.id);

        // Check if fulfilled
        if (evaluation.status === 'fulfilled') {
            await resolvePromise(supabase, promise, 'fulfilled', currentTick, nationStats);
            results.push({ promise, resolution: 'fulfilled' });
            continue;
        }

        // Check if broken (stat floor violated, or deadline passed)
        if (evaluation.status === 'broken' || currentTick >= promise.tick_deadline) {
            await resolvePromise(supabase, promise, 'broken', currentTick, nationStats);
            results.push({ promise, resolution: 'broken' });
            continue;
        }

        // Per-tick penalty: governing party with unfulfilled promise loses approval with the promised bloc
        // -1D3 approval per tick (PENALTY_PER_TICK_MIN to PENALTY_PER_TICK_MAX)
        if (isGoverning && promise.bloc_id) {
            const penaltyAmount = -(Math.floor(Math.random() * (cfg.PENALTY_PER_TICK_MAX - cfg.PENALTY_PER_TICK_MIN + 1)) + cfg.PENALTY_PER_TICK_MIN);
            const { data: penaltyBlocRow } = await supabase
                .from('faction_bloc_approval')
                .select('id, approval')
                .eq('faction_id', promise.party_id)
                .eq('bloc_id', promise.bloc_id)
                .single();
            if (penaltyBlocRow) {
                const newApproval = Math.max(0, Math.round(penaltyBlocRow.approval + penaltyAmount));
                await supabase.from('faction_bloc_approval')
                    .update({ approval: newApproval })
                    .eq('id', penaltyBlocRow.id);
            }
            results.push({ promise, resolution: 'tick_penalty', penaltyAmount });
        }
    }

    return results;
}

/**
 * Apply rewards or penalties when a promise is resolved.
 */
async function resolvePromise(supabase, promise, resolution, currentTick, nationStats) {
    const cfg = MAKE_PROMISE_CONFIG;

    if (resolution === 'fulfilled') {
        // ── REWARDS (all via momentum — preference_score recalculated by three-pillar calc) ──
        if (promise.bloc_id) {
            await adjustMomentum(supabase, promise.nation_id, promise.party_id, promise.bloc_id, cfg.KEPT_PREF_BONUS, 'promise:kept_bloc');
        }

        // +momentum with ALL blocs (APPROVAL_IF_KEPT — the main +12 reward)
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.APPROVAL_IF_KEPT, 'promise:kept');

        // +momentum (additional general boost)
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.KEPT_MOMENTUM, 'promise:kept_bonus');

        // Mark promise as fulfilled
        await supabase.from('fundraiser_promises')
            .update({ status: 'fulfilled', tick_resolved: currentTick, updated_at: new Date().toISOString() })
            .eq('id', promise.id);

    } else if (resolution === 'broken') {
        // ── PENALTIES (all via momentum — preference_score recalculated by three-pillar calc) ──
        if (promise.bloc_id) {
            await adjustMomentum(supabase, promise.nation_id, promise.party_id, promise.bloc_id, cfg.BROKEN_DONOR_PREF, 'promise:broken_bloc');
        }

        // -momentum with ALL blocs
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.BROKEN_ALL_PREF, 'promise:broken');

        // -momentum (additional penalty)
        await adjustMomentumAll(supabase, promise.nation_id, promise.party_id, cfg.BROKEN_MOMENTUM, 'promise:broken_penalty');

        // Nervous other promise holders: -1 momentum with each bloc
        const { data: otherPromises } = await supabase
            .from('fundraiser_promises')
            .select('bloc_id')
            .eq('party_id', promise.party_id)
            .eq('status', 'active')
            .neq('id', promise.id);

        if (otherPromises && otherPromises.length > 0) {
            const nervousBlocIds = [...new Set(otherPromises.map(p => p.bloc_id).filter(Boolean))];
            for (const nervousBlocId of nervousBlocIds) {
                await adjustMomentum(supabase, promise.nation_id, promise.party_id, nervousBlocId, cfg.BROKEN_NERVOUS_PREF, 'promise:broken_nervous');
            }
        }

        // Mark promise as broken
        await supabase.from('fundraiser_promises')
            .update({ status: 'broken', tick_resolved: currentTick, updated_at: new Date().toISOString() })
            .eq('id', promise.id);
    }
}


// ==================== AUTOCRACY SEAT REBALANCING ====================

/**
 * If a faction is disbanded (or for any reason the sum of all
 * faction seats is less than the nation's total_seats), proportionally
 * redistribute the vacant seats across the remaining factions.
 *
 * Uses the Largest Remainder method (same as allocateSeatsByVotes in
 * election-simulation.js) with existing seat counts as weights.
 */
async function rebalanceVacantSeats(supabase, nation) {
    // Autocracies never auto-redistribute seats — factions must earn them.
    if (isAutocracy(nation)) return null;

    const totalSeats = nation.total_seats || GAME_CONFIG.TOTAL_SEATS;

    const { data: factions, error } = await supabase
        .from('factions')
        .select('id, faction_name, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (error || !factions || factions.length === 0) return null;

    const currentSum = factions.reduce((s, f) => s + (f.seats || 0), 0);
    const vacantSeats = totalSeats - currentSum;

    if (vacantSeats <= 0) return null; // No vacant seats

    console.log(`[rebalanceVacantSeats] ${nation.name}: ${vacantSeats} vacant seat(s) detected (${currentSum}/${totalSeats}). Redistributing.`);

    // Proportional redistribution using Largest Remainder (Hamilton) method
    // Weight = each faction's current seats
    if (currentSum === 0) {
        // Edge case: all factions at 0 seats — distribute evenly
        const perParty = Math.floor(totalSeats / factions.length);
        let remainder = totalSeats - perParty * factions.length;
        const updates = [];
        for (const f of factions) {
            const newSeats = perParty + (remainder > 0 ? 1 : 0);
            if (remainder > 0) remainder--;
            updates.push({ id: f.id, name: f.faction_name, oldSeats: f.seats || 0, newSeats });
        }
        for (const u of updates) {
            await supabase.from('factions').update({ seats: u.newSeats }).eq('id', u.id);
        }
        return { nation: nation.name, vacantSeats, updates };
    }

    // Standard Largest Remainder: allocate totalSeats proportionally by current seat share
    const quota = currentSum / totalSeats; // votes-per-seat equivalent
    const fractionals = [];
    const newSeats = {};
    let allocated = 0;

    for (const f of factions) {
        const raw = (f.seats || 0) / quota;
        const guaranteed = Math.floor(raw);
        newSeats[f.id] = guaranteed;
        allocated += guaranteed;
        fractionals.push({ id: f.id, fractional: raw - guaranteed });
    }

    let remaining = totalSeats - allocated;
    fractionals.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remaining && i < fractionals.length; i++) {
        newSeats[fractionals[i].id] = (newSeats[fractionals[i].id] || 0) + 1;
    }

    const updates = [];
    for (const f of factions) {
        const ns = newSeats[f.id] || 0;
        if (ns !== (f.seats || 0)) {
            updates.push({ id: f.id, name: f.faction_name, oldSeats: f.seats || 0, newSeats: ns });
            await supabase.from('factions').update({ seats: ns }).eq('id', f.id);
        }
    }

    if (updates.length > 0) {
        console.log(`[rebalanceVacantSeats] ${nation.name}: Seats rebalanced:`,
            updates.map(u => `${u.name}: ${u.oldSeats}→${u.newSeats}`).join(', '));
    }

    return { nation: nation.name, vacantSeats, updates };
}

// ==================== LOYALTY TICK PROCESSING ====================

/**
 * Determine autocracy loyalty decay rate based on Regime Health thresholds.
 * HEALTHY (60-100): -2/tick
 * WEAKENING (40-59): -2.5/tick
 * DECLINING (20-39): -3/tick
 * CRITICAL (1-19): -4/tick
 */
function getAutocracyLoyaltyDecay(regimeHealth) {
    if (regimeHealth >= 60) return -2;
    if (regimeHealth >= 40) return -2.5;
    if (regimeHealth >= 20) return -3;
    if (regimeHealth >= 1) return -4;
    return -5; // COLLAPSED tier — matches getRegimeHealthTier
}

async function processLoyaltyTick(supabase, nation) {
    const rulingId = nation.ruling_faction_id;
    if (!rulingId) return;

    const nationIsAutocracy = isAutocracy(nation);

    const { data: factions } = await supabase
        .from('factions')
        .select('id, loyalty, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!factions || factions.length === 0) return;

    const { data: ministries } = await supabase
        .from('ministries')
        .select('party_id')
        .eq('nation_id', nation.id)
        .not('party_id', 'is', null);

    const ministryCounts = {};
    if (ministries) {
        for (const m of ministries) {
            ministryCounts[m.party_id] = (ministryCounts[m.party_id] || 0) + 1;
        }
    }

    for (const faction of factions) {
        let loyalty = faction.loyalty ?? 50;
        let seats = faction.seats || 0;

        if (faction.id === rulingId) {
            if (nationIsAutocracy) {
                // Autocracy ruling faction (Strongman): loyalty drifts toward 80
                const ministryCount = ministryCounts[faction.id] || 0;
                if (loyalty > 80) loyalty -= 1;
                else if (loyalty < 80) loyalty += 1;
                loyalty += ministryCount * 0.5;
                loyalty = Math.max(0, Math.min(100, Math.round(loyalty * 10) / 10));
                await supabase.from('factions')
                    .update({ loyalty })
                    .eq('id', faction.id);
            } else {
                if (loyalty !== 100) {
                    await supabase.from('factions')
                        .update({ loyalty: 100 })
                        .eq('id', faction.id);
                }
            }
            continue;
        }

        if (nationIsAutocracy) {
            // ── v2 Autocracy Loyalty Decay ──
            // Flat decay based on Regime Health thresholds. No ministry bonus.
            // Loyalty cap: 95 (inherent paranoia of autocratic rule).
            const regimeHealth = Number(nation.regime_health ?? 80);
            const decayRate = getAutocracyLoyaltyDecay(regimeHealth);
            loyalty += decayRate;
            loyalty = Math.max(0, Math.min(GAME_CONFIG.LOYALTY_CAP, Math.round(loyalty * 10) / 10));

            await supabase.from('factions')
                .update({ loyalty })
                .eq('id', faction.id);
        } else {
            // ── Democracy/Presidential loyalty ──
            const ministryCount = ministryCounts[faction.id] || 0;

            if (ministryCount > 0) {
                loyalty += ministryCount * 0.5;
            } else {
                loyalty -= 2;
            }

            if (loyalty > 50) {
                loyalty -= 1;
            } else if (loyalty < 50) {
                loyalty += 1;
            }

            loyalty = Math.max(0, Math.min(100, Math.round(loyalty * 10) / 10));

            await supabase.from('factions')
                .update({ loyalty, seats })
                .eq('id', faction.id);
        }
    }
}

// ==================== STANDING TICK PROCESSING (v2) ====================

/**
 * Process faction standing relevance decay for autocracy nations.
 * Standing has no natural decay, BUT if a faction takes no standing-building
 * action (Consolidate Power or Demonstrate Competence) for 3+ consecutive ticks,
 * standing decays at -1/tick until a standing-building action is taken.
 * Standing cap: 90.
 */
/**
 * Expire pending loyalty demands past their deadline (server-side).
 * Treats expiry as a refusal: reveals true loyalty, standing -10.
 */
async function processLoyaltyDemandExpiry(supabase, nation, currentTick) {
    if (!isAutocracy(nation)) return;

    const { data: expired } = await supabase
        .from('loyalty_demands')
        .select('id, target_faction_id, strongman_faction_id')
        .eq('nation_id', nation.id)
        .eq('status', 'pending')
        .lte('deadline_tick', currentTick);

    if (!expired || expired.length === 0) return;

    for (const d of expired) {
        await supabase.from('loyalty_demands').update({
            status: 'expired', resolved_at_tick: currentTick,
        }).eq('id', d.id);

        // Standing penalty for refusal
        const { data: targetFaction } = await supabase
            .from('factions').select('id, standing, faction_name')
            .eq('id', d.target_faction_id).single();
        if (targetFaction) {
            await supabase.from('factions').update({
                standing: Math.max(0, (targetFaction.standing ?? 30) - 10),
            }).eq('id', d.target_faction_id);
        }

        await supabase.from('campaign_actions').insert({
            party_id: d.target_faction_id, nation_id: nation.id,
            action_type: 'loyalty_demand_expired',
            tick_performed: currentTick,
            result: { faction_name: targetFaction?.faction_name || 'Unknown' },
        });
    }
}

async function processStandingTick(supabase, nation, currentTick) {
    if (!isAutocracy(nation)) return;

    const { data: factions } = await supabase
        .from('factions')
        .select('id, standing, last_standing_action_tick')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!factions || factions.length === 0) return;

    for (const faction of factions) {
        let standing = faction.standing ?? 30;
        const lastStandingTick = faction.last_standing_action_tick;

        // Relevance decay: if 3+ ticks since last standing-building action
        if (lastStandingTick != null && (currentTick - lastStandingTick) >= 3) {
            standing -= 1;
        } else if (lastStandingTick == null && currentTick >= 3) {
            // Never taken a standing action — decay after tick 3
            standing -= 1;
        }

        // Clamp to [0, 90]
        standing = Math.max(0, Math.min(90, standing));

        if (standing !== (faction.standing ?? 30)) {
            await supabase.from('factions')
                .update({ standing })
                .eq('id', faction.id);
        }
    }
}


// ==================== REGIME PILLARS TICK ====================

/**
 * The six pillars of an autocratic regime. Each pillar decays by 1d2 per tick
 * and receives a 1d2 bonus per satisfied "want" condition.
 * The average of all pillar support values = Grip on Power.
 */
const REGIME_PILLAR_DEFS = [
    { key: 'military',    name: 'The Military',      wants: [
        { stat: 'stability', threshold: 50, direction: 'above' },
        { stat: '_armed_forces_funding', threshold: 90, direction: 'above' },
    ]},
    { key: 'security',    name: 'Security Services',  wants: [
        { stat: 'crime_rate', threshold: 40, direction: 'below' },
        { stat: 'corruption', threshold: 50, direction: 'above' },
    ]},
    { key: 'party',       name: 'The Party',          wants: [
        { stat: 'legitimacy', threshold: 50, direction: 'above' },
        { stat: 'standard_of_living', threshold: 50, direction: 'above' },
    ]},
    { key: 'oligarchs',   name: 'Oligarchs',          wants: [
        { stat: 'gdp_growth', threshold: 50, direction: 'above' },
        { stat: 'corporate_tax', threshold: 30, direction: 'below' },
    ]},
    { key: 'bureaucracy', name: 'Bureaucracy',        wants: [
        { stat: 'efficiency', threshold: 50, direction: 'above' },
        { stat: '_debt_ratio', threshold: 50, direction: 'below' },
    ]},
    { key: 'media',       name: 'State Media',        wants: [
        { stat: 'freedom_index', threshold: 40, direction: 'below' },
        { stat: 'legitimacy', threshold: 50, direction: 'above' },
    ]},
    { key: 'foreign_patrons', name: 'Foreign Patrons',  wants: [
        { stat: 'international_reputation', threshold: 50, direction: 'above' },
        { stat: 'foreign_investment', threshold: 50, direction: 'above' },
    ]},
    { key: 'religious',  name: 'Religious Establishment', wants: [
        { stat: 'religious', threshold: 50, direction: 'above' },
        { stat: 'freedom_index', threshold: 40, direction: 'below' },
    ]},
];

function d2() { return 1 + Math.floor(Math.random() * 2); } // 1 or 2

async function processRegimePillars(supabase, nation) {
    if (!isAutocracy(nation)) return;

    // Fetch existing pillars
    const { data: pillars } = await supabase
        .from('regime_pillars')
        .select('id, pillar_key, support')
        .eq('nation_id', nation.id);

    // If no pillars yet (new autocracy), seed them
    if (!pillars || pillars.length === 0) {
        const rows = REGIME_PILLAR_DEFS.map(def => ({
            nation_id: nation.id,
            pillar_key: def.key,
            pillar_name: def.name,
            support: 55 + Math.floor(Math.random() * 31), // 55-85
        }));
        await supabase.from('regime_pillars').insert(rows);
        return;
    }

    // Build a lookup of pillar_key → row
    const pillarMap = {};
    for (const p of pillars) pillarMap[p.pillar_key] = p;

    // _armed_forces_funding: auto-funded at 100% (no budget bill system)
    let armedForcesFunding = 100;

    // _debt_ratio: simple 0-100 where lower is better
    // Use debt relative to GDP: debt/gdp * 100, clamped 0-100
    const gdp = Number(nation.gdp || 1);
    const debt = Number(nation.debt || 0);
    const debtRatio = Math.min(100, Math.max(0, Math.round((debt / Math.max(gdp, 1)) * 100)));

    const syntheticStats = {
        _armed_forces_funding: armedForcesFunding,
        _debt_ratio: debtRatio,
    };

    // Process each pillar
    for (const def of REGIME_PILLAR_DEFS) {
        const row = pillarMap[def.key];
        if (!row) continue;

        let support = row.support;

        // Natural decay: -1d2 per tick
        support -= d2();

        // Check each want: if satisfied, +1d2 bonus
        for (const want of def.wants) {
            const val = want.stat.startsWith('_')
                ? (syntheticStats[want.stat] ?? 0)
                : Number(nation[want.stat] ?? 50);

            const satisfied = want.direction === 'above'
                ? val >= want.threshold
                : val <= want.threshold;

            if (satisfied) {
                support += d2();
            }
        }

        support = Math.max(0, Math.min(100, support));

        await supabase.from('regime_pillars')
            .update({ support, updated_at: new Date().toISOString() })
            .eq('id', row.id);
    }
}

// ==================== STEWARD TICK ====================

/**
 * Map pillar_key → steward archetype.
 */
const PILLAR_TO_STEWARD_TYPE = {
    bureaucracy:     'technocrat',
    military:        'general',
    party:           'party_chairman',
    oligarchs:       'oligarch',
    security:        'security_chief',
    media:           'propaganda_chief',
    foreign_patrons: 'intelligence_director',
    religious:       'religious_authority',
};

/** Adjust coup_readiness for all living stewards in a nation by a delta. */
async function adjustStewardsCoupReadiness(supabase, nationId, delta) {
    const { data: stewards } = await supabase
        .from('stewards').select('id, coup_readiness')
        .eq('nation_id', nationId).eq('is_alive', true);
    for (const s of (stewards || [])) {
        const newCR = Math.min(100, Math.max(0, (s.coup_readiness ?? 0) + delta));
        await supabase.from('stewards').update({ coup_readiness: newCR }).eq('id', s.id);
    }
}

// ==================== AUTOCRACY v2 FACTION ACTIONS ====================

/**
 * Pledge Allegiance: publicly reaffirm loyalty. Groveling is free.
 * Loyalty +8, Standing -2. If under Demand Loyalty: Loyalty +13, Standing -3.
 * Standing cannot drop below 5 from this action.
 * AP Cost: 2
 */
async function executePledgeAllegiance(supabase, factionId, nationId, currentTick) {
    // 1. Validate faction + AP
    const { data: faction } = await supabase
        .from('factions').select('id, action_points, loyalty, standing, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < GAME_CONFIG.PLEDGE_ALLEGIANCE_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.PLEDGE_ALLEGIANCE_AP}.` };

    // 2. Check for active Demand Loyalty order
    const { data: pendingDemand } = await supabase
        .from('loyalty_demands')
        .select('id, strongman_faction_id')
        .eq('nation_id', nationId)
        .eq('target_faction_id', factionId)
        .eq('status', 'pending')
        .maybeSingle();

    const isComplying = !!pendingDemand;

    // 3. Deduct AP
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.PLEDGE_ALLEGIANCE_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 4. Apply effects
    const loyaltyGain = isComplying ? GAME_CONFIG.PLEDGE_ALLEGIANCE_COMPLY_LOYALTY : GAME_CONFIG.PLEDGE_ALLEGIANCE_LOYALTY;
    const standingPenalty = isComplying ? GAME_CONFIG.PLEDGE_ALLEGIANCE_COMPLY_STANDING : GAME_CONFIG.PLEDGE_ALLEGIANCE_STANDING;

    let newLoyalty = Math.min(GAME_CONFIG.LOYALTY_CAP, (faction.loyalty ?? 50) + loyaltyGain);
    let newStanding = Math.max(GAME_CONFIG.PLEDGE_ALLEGIANCE_STANDING_FLOOR, (faction.standing ?? 30) + standingPenalty);
    newStanding = Math.min(GAME_CONFIG.STANDING_CAP, newStanding);

    await supabase.from('factions').update({
        loyalty: newLoyalty,
        standing: newStanding,
        last_action_type: 'pledge_allegiance',
        consecutive_embezzle_ticks: 0,
    }).eq('id', factionId);

    // 5. Resolve demand if complying
    if (isComplying) {
        await supabase.from('loyalty_demands').update({
            status: 'complied', resolved_at_tick: currentTick
        }).eq('id', pendingDemand.id);
    }

    // 6. Log action
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'faction_pledge_allegiance',
        tick_performed: currentTick,
        result: {
            loyalty_change: loyaltyGain, standing_change: standingPenalty,
            new_loyalty: newLoyalty, new_standing: newStanding,
            complied_with_demand: isComplying,
            faction_name: faction.faction_name,
        }
    });

    return {
        success: true,
        newAp: apResult.newAp,
        loyaltyChange: loyaltyGain,
        standingChange: standingPenalty,
        newLoyalty, newStanding,
        compliedWithDemand: isComplying,
    };
}

/**
 * Consolidate Power: build institutional influence. Quiet power accumulation.
 * Standing +6, Loyalty -3. Resets relevance decay counter.
 * AP Cost: 2
 */
async function executeConsolidatePower(supabase, factionId, nationId, currentTick) {
    // 1. Validate faction + AP
    const { data: faction } = await supabase
        .from('factions').select('id, action_points, loyalty, standing, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < GAME_CONFIG.CONSOLIDATE_POWER_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.CONSOLIDATE_POWER_AP}.` };

    // 2. Deduct AP
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.CONSOLIDATE_POWER_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 3. Apply effects
    let newStanding = Math.min(GAME_CONFIG.STANDING_CAP, (faction.standing ?? 30) + GAME_CONFIG.CONSOLIDATE_POWER_STANDING);
    let newLoyalty = Math.max(0, (faction.loyalty ?? 50) + GAME_CONFIG.CONSOLIDATE_POWER_LOYALTY);
    newLoyalty = Math.min(GAME_CONFIG.LOYALTY_CAP, newLoyalty);

    await supabase.from('factions').update({
        loyalty: newLoyalty,
        standing: newStanding,
        last_action_type: 'consolidate_power',
        last_standing_action_tick: currentTick,
        consecutive_embezzle_ticks: 0,
    }).eq('id', factionId);

    // 4. Log action
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'faction_consolidate_power',
        tick_performed: currentTick,
        result: {
            standing_change: GAME_CONFIG.CONSOLIDATE_POWER_STANDING,
            loyalty_change: GAME_CONFIG.CONSOLIDATE_POWER_LOYALTY,
            new_standing: newStanding, new_loyalty: newLoyalty,
            faction_name: faction.faction_name,
        }
    });

    return {
        success: true,
        newAp: apResult.newAp,
        standingChange: GAME_CONFIG.CONSOLIDATE_POWER_STANDING,
        loyaltyChange: GAME_CONFIG.CONSOLIDATE_POWER_LOYALTY,
        newStanding, newLoyalty,
    };
}

/**
 * Demonstrate Competence: actually govern. Produce visible policy outcomes.
 * Standing +4, Loyalty +3, Nation stat +0.3. Costs $2M from embezzled funds.
 * If can't afford: Standing +2 (reduced), no nation stat effect.
 * Sets vulnerability window (other factions can poach seats cheaper).
 * AP Cost: 3
 */
async function executeDemonstrateCompetence(supabase, factionId, nationId, currentTick) {
    // 1. Validate faction + AP
    const { data: faction } = await supabase
        .from('factions').select('id, action_points, loyalty, standing, embezzled_funds, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < GAME_CONFIG.DEMONSTRATE_COMPETENCE_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.DEMONSTRATE_COMPETENCE_AP}.` };

    // 2. Deduct AP
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.DEMONSTRATE_COMPETENCE_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 3. Check if faction can afford the cost
    const funds = Number(faction.embezzled_funds ?? 0);
    const canAfford = funds >= GAME_CONFIG.DEMONSTRATE_COMPETENCE_COST;

    const standingGain = canAfford ? GAME_CONFIG.DEMONSTRATE_COMPETENCE_STANDING : GAME_CONFIG.DEMONSTRATE_COMPETENCE_REDUCED_STANDING;
    const loyaltyGain = GAME_CONFIG.DEMONSTRATE_COMPETENCE_LOYALTY;

    let newStanding = Math.min(GAME_CONFIG.STANDING_CAP, (faction.standing ?? 30) + standingGain);
    let newLoyalty = Math.min(GAME_CONFIG.LOYALTY_CAP, (faction.loyalty ?? 50) + loyaltyGain);
    let newFunds = canAfford ? funds - GAME_CONFIG.DEMONSTRATE_COMPETENCE_COST : funds;

    await supabase.from('factions').update({
        loyalty: newLoyalty,
        standing: newStanding,
        embezzled_funds: newFunds,
        last_action_type: 'demonstrate_competence',
        last_standing_action_tick: currentTick,
        consecutive_embezzle_ticks: 0,
    }).eq('id', factionId);

    // 4. Apply nation stat bonus if funded
    let nationStatChange = null;
    if (canAfford) {
        // Determine which nation stat to boost based on faction's steward type / pillar
        const { data: steward } = await supabase
            .from('stewards').select('pillar_key, steward_type')
            .eq('faction_id', factionId).eq('nation_id', nationId).eq('is_alive', true)
            .maybeSingle();

        const pillarStatMap = {
            military: 'stability', security: 'stability', bureaucracy: 'government_efficiency',
            party: 'legitimacy', oligarchs: 'gdp_growth', media: 'press_freedom',
            foreign_patrons: 'international_reputation', religious: 'legitimacy',
        };
        const statKey = pillarStatMap[steward?.pillar_key] || 'stability';

        const { data: nation } = await supabase.from('nations').select(statKey).eq('id', nationId).single();
        if (nation) {
            const current = Number(nation[statKey] ?? 50);
            const newVal = Math.min(100, current + GAME_CONFIG.DEMONSTRATE_COMPETENCE_NATION_STAT);
            await supabase.from('nations').update({ [statKey]: newVal }).eq('id', nationId);
            nationStatChange = { stat: statKey, change: GAME_CONFIG.DEMONSTRATE_COMPETENCE_NATION_STAT };
        }
    }

    // 5. Log action
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'faction_demonstrate_competence',
        tick_performed: currentTick,
        result: {
            standing_change: standingGain, loyalty_change: loyaltyGain,
            new_standing: newStanding, new_loyalty: newLoyalty,
            funds_spent: canAfford ? GAME_CONFIG.DEMONSTRATE_COMPETENCE_COST : 0,
            nation_stat_change: nationStatChange,
            could_afford: canAfford,
            faction_name: faction.faction_name,
        }
    });

    return {
        success: true,
        newAp: apResult.newAp,
        standingChange: standingGain,
        loyaltyChange: loyaltyGain,
        newStanding, newLoyalty,
        fundsSpent: canAfford ? GAME_CONFIG.DEMONSTRATE_COMPETENCE_COST : 0,
        nationStatChange,
        couldAfford: canAfford,
    };
}

/**
 * Embezzle Funds: divert state resources into hidden war chest.
 * Loyalty -5, Funds +$X (formula-based), Detection risk.
 * Income formula: base × (1 + standing/100) × (1 + seats/legislature_max)
 * Base: $5M, Floor: $3M.
 * Detection: 10% base + 5% per consecutive tick + corruption modifier.
 * AP Cost: 1
 */
async function executeEmbezzleFunds(supabase, factionId, nationId, currentTick) {
    // 1. Validate faction + AP
    const { data: faction } = await supabase
        .from('factions').select('id, action_points, loyalty, standing, seats, embezzled_funds, consecutive_embezzle_ticks, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < GAME_CONFIG.EMBEZZLE_FUNDS_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.EMBEZZLE_FUNDS_AP}.` };

    // 2. Fetch nation for corruption and legislature size
    const { data: nation } = await supabase
        .from('nations').select('corruption, total_seats, ruling_faction_id, regime_health')
        .eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };

    const legislatureMax = nation.total_seats || 120;

    // 3. Deduct AP
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.EMBEZZLE_FUNDS_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 4. Calculate income
    const standing = faction.standing ?? 30;
    const seats = faction.seats || 0;
    let income = GAME_CONFIG.EMBEZZLE_FUNDS_BASE_INCOME * (1 + standing / 100) * (1 + seats / legislatureMax);
    income = Math.max(GAME_CONFIG.EMBEZZLE_FUNDS_INCOME_FLOOR, Math.round(income * 100) / 100);

    // 5. Calculate detection probability
    const consecutiveTicks = (faction.consecutive_embezzle_ticks ?? 0);
    const corruption = Number(nation.corruption ?? 50);
    const corruptionMod = (corruption - 50) * -0.005; // -0.5% per point above 50, +0.5% below

    // Security faction detection bonus
    let securityBonus = 0;
    const { data: secFactions } = await supabase
        .from('factions').select('id, seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party')
        .neq('id', factionId);
    // We'd need to identify the "security" faction — for now use steward type
    const { data: secStewards } = await supabase
        .from('stewards').select('faction_id')
        .eq('nation_id', nationId)
        .eq('steward_type', 'security_chief')
        .eq('is_alive', true);
    if (secStewards && secStewards.length > 0) {
        for (const ss of secStewards) {
            const secFaction = (secFactions || []).find(f => f.id === ss.faction_id);
            if (secFaction) {
                securityBonus += ((secFaction.seats || 0) / legislatureMax) * 0.10;
            }
        }
    }

    let detectionProb = GAME_CONFIG.EMBEZZLE_FUNDS_BASE_DETECTION
        + consecutiveTicks * GAME_CONFIG.EMBEZZLE_FUNDS_CONSECUTIVE_BONUS
        + corruptionMod
        + securityBonus;
    detectionProb = Math.max(GAME_CONFIG.EMBEZZLE_FUNDS_DETECTION_FLOOR,
        Math.min(GAME_CONFIG.EMBEZZLE_FUNDS_DETECTION_CAP, detectionProb));

    // 6. Roll for detection
    const detected = Math.random() < detectionProb;

    // 7. Apply effects
    let newLoyalty = Math.max(0, (faction.loyalty ?? 50) + GAME_CONFIG.EMBEZZLE_FUNDS_LOYALTY);
    let newFunds = Number(faction.embezzled_funds ?? 0) + income;
    let newStanding = faction.standing ?? 30;
    let fundsSeized = 0;

    if (detected) {
        newLoyalty = Math.max(0, newLoyalty + GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_LOYALTY);
        newStanding = Math.max(0, newStanding + GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_STANDING);
        fundsSeized = Math.round(newFunds * GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_FUNDS_SEIZURE * 100) / 100;
        newFunds -= fundsSeized;

        // Regime health -1 for detected embezzlement
        const newRegimeHealth = Math.max(0, Number(nation.regime_health ?? 80) - 1);
        await supabase.from('nations').update({ regime_health: newRegimeHealth }).eq('id', nationId);
    }

    newLoyalty = Math.min(GAME_CONFIG.LOYALTY_CAP, newLoyalty);
    newStanding = Math.min(GAME_CONFIG.STANDING_CAP, newStanding);

    await supabase.from('factions').update({
        loyalty: newLoyalty,
        standing: newStanding,
        embezzled_funds: Math.max(0, newFunds),
        consecutive_embezzle_ticks: consecutiveTicks + 1,
        last_action_type: 'embezzle_funds',
    }).eq('id', factionId);

    // 8. Log action
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: detected ? 'faction_embezzle_detected' : 'faction_embezzle',
        tick_performed: currentTick,
        result: {
            income, detected, funds_seized: fundsSeized,
            detection_probability: Math.round(detectionProb * 100),
            loyalty_change: GAME_CONFIG.EMBEZZLE_FUNDS_LOYALTY + (detected ? GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_LOYALTY : 0),
            standing_change: detected ? GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_STANDING : 0,
            faction_name: faction.faction_name,
        }
    });

    // 9. Detection risk label
    const riskLabel = detectionProb <= 0.12 ? 'LOW' : detectionProb <= 0.25 ? 'MODERATE' : detectionProb <= 0.35 ? 'ELEVATED' : 'HIGH';

    return {
        success: true,
        newAp: apResult.newAp,
        income, detected, fundsSeized,
        detectionProbability: Math.round(detectionProb * 100),
        riskLabel,
        newLoyalty, newStanding,
        newFunds: Math.max(0, newFunds),
        loyaltyChange: GAME_CONFIG.EMBEZZLE_FUNDS_LOYALTY + (detected ? GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_LOYALTY : 0),
        standingChange: detected ? GAME_CONFIG.EMBEZZLE_FUNDS_DETECTED_STANDING : 0,
    };
}

/**
 * Get qualitative detection risk label for embezzlement.
 */
/**
 * Buy Influence: spend embezzled funds to recruit members from other factions or unaligned pool.
 * Standing -1, Seats +X based on funds spent.
 * Cost per seat: $3M × (target_standing / max(your_standing, 1)) × (1 + target_seats / legislature_max)
 * Unaligned pool: $2M flat per seat.
 * AP Cost: 3
 */
async function executeBuyInfluence(supabase, factionId, nationId, targetId, fundsToSpend, currentTick) {
    // targetId can be a faction ID or 'unaligned' for the unaligned pool
    const isUnaligned = targetId === 'unaligned';

    // 1. Validate faction + AP
    const { data: faction } = await supabase
        .from('factions').select('id, action_points, standing, seats, embezzled_funds, faction_name, last_action_type')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < GAME_CONFIG.BUY_INFLUENCE_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.BUY_INFLUENCE_AP}.` };

    const funds = Number(faction.embezzled_funds ?? 0);
    if (fundsToSpend > funds) return { success: false, error: 'Not enough funds.' };
    if (fundsToSpend <= 0) return { success: false, error: 'Must spend some funds.' };

    const { data: nation } = await supabase
        .from('nations').select('total_seats, unaligned_seats, regime_health, ruling_faction_id')
        .eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };
    const legislatureMax = nation.total_seats || 120;

    // 2. Deduct AP
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.BUY_INFLUENCE_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    let seatsGained = 0;
    let targetName = 'Unaligned Pool';

    if (isUnaligned) {
        // Buy from unaligned pool — $2M flat per seat
        const costPerSeat = GAME_CONFIG.BUY_INFLUENCE_UNALIGNED_COST;
        seatsGained = Math.min(
            Math.floor(fundsToSpend / costPerSeat),
            nation.unaligned_seats || 0
        );
        if (seatsGained <= 0) {
            // Refund AP? No — the AP was spent on the attempt regardless.
            return { success: true, newAp: apResult.newAp, seatsGained: 0, fundsSpent: 0, message: 'Unaligned pool is empty.' };
        }
        const actualCost = seatsGained * costPerSeat;

        await supabase.from('factions').update({
            seats: (faction.seats || 0) + seatsGained,
            embezzled_funds: funds - actualCost,
            standing: Math.max(0, (faction.standing ?? 30) + GAME_CONFIG.BUY_INFLUENCE_STANDING),
            last_action_type: 'buy_influence',
            consecutive_embezzle_ticks: 0,
        }).eq('id', factionId);

        await supabase.from('nations').update({
            unaligned_seats: Math.max(0, (nation.unaligned_seats || 0) - seatsGained)
        }).eq('id', nationId);

        await supabase.from('campaign_actions').insert({
            party_id: factionId, nation_id: nationId,
            action_type: 'buy_influence',
            tick_performed: currentTick,
            result: { seats_gained: seatsGained, funds_spent: actualCost, target: 'unaligned', faction_name: faction.faction_name }
        });

        return { success: true, newAp: apResult.newAp, seatsGained, fundsSpent: actualCost, targetName };
    }

    // 3. Buy from rival faction
    const { data: target } = await supabase
        .from('factions').select('id, standing, seats, faction_name, last_action_type')
        .eq('id', targetId).single();
    if (!target) return { success: false, error: 'Target faction not found.' };
    if (target.id === factionId) return { success: false, error: 'Cannot target yourself.' };
    targetName = target.faction_name;

    // Cost per seat formula
    const yourStanding = Math.max(1, faction.standing ?? 30);
    const targetStanding = target.standing ?? 30;
    const targetSeats = target.seats || 0;
    const isTargetingStrongman = targetId === nation.ruling_faction_id;
    let costPerSeat;

    if (isTargetingStrongman) {
        // Strongman cost scales with regime health: expensive when healthy, cheap when collapsing
        const rh = Math.max(0, Math.min(100, Number(nation.regime_health ?? 80)));
        costPerSeat = GAME_CONFIG.BUY_INFLUENCE_STRONGMAN_BASE_COST * (1 + rh * GAME_CONFIG.BUY_INFLUENCE_STRONGMAN_HEALTH_SCALE);
    } else {
        costPerSeat = GAME_CONFIG.BUY_INFLUENCE_BASE_COST * (targetStanding / yourStanding) * (1 + targetSeats / legislatureMax);
    }

    // Vulnerability discount: if target is demonstrating competence this tick
    if (target.last_action_type === 'demonstrate_competence') {
        costPerSeat *= (1 - GAME_CONFIG.BUY_INFLUENCE_VULNERABILITY_DISCOUNT);
    }

    seatsGained = Math.min(
        Math.floor(fundsToSpend / costPerSeat),
        targetSeats  // can't take more seats than they have
    );
    if (seatsGained <= 0) {
        return { success: true, newAp: apResult.newAp, seatsGained: 0, fundsSpent: 0, message: 'Cannot afford even 1 seat.' };
    }
    const actualCost = Math.round(seatsGained * costPerSeat * 100) / 100;

    // Apply seat transfer
    await supabase.from('factions').update({
        seats: (faction.seats || 0) + seatsGained,
        embezzled_funds: funds - actualCost,
        standing: Math.max(0, (faction.standing ?? 30) + GAME_CONFIG.BUY_INFLUENCE_STANDING),
        last_action_type: 'buy_influence',
        consecutive_embezzle_ticks: 0,
    }).eq('id', factionId);

    await supabase.from('factions').update({
        seats: Math.max(0, targetSeats - seatsGained)
    }).eq('id', targetId);

    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'buy_influence',
        tick_performed: currentTick,
        result: {
            seats_gained: seatsGained, funds_spent: actualCost,
            target_faction_id: targetId, target_name: targetName,
            cost_per_seat: Math.round(costPerSeat * 100) / 100,
            faction_name: faction.faction_name,
        }
    });

    return { success: true, newAp: apResult.newAp, seatsGained, fundsSpent: actualCost, targetName, costPerSeat: Math.round(costPerSeat * 100) / 100 };
}

/**
 * Intimidate: use fear/threats to force members of other factions to switch.
 * Loyalty -4, Standing +2, Stability -0.2. $1M cost.
 * Seats gained = 4 × (your_standing / max(target_standing, 1)) × (your_seats / 20)
 * Requires 5+ seats.
 * Failed intimidation (0 seats): Standing -3, Target standing +1.
 * AP Cost: 2
 */
async function executeIntimidate(supabase, factionId, nationId, targetId, currentTick) {
    // 1. Validate faction + AP + seats
    const { data: faction } = await supabase
        .from('factions').select('id, action_points, loyalty, standing, seats, embezzled_funds, faction_name')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < GAME_CONFIG.INTIMIDATE_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.INTIMIDATE_AP}.` };
    if ((faction.seats || 0) < GAME_CONFIG.INTIMIDATE_MIN_SEATS)
        return { success: false, error: `Need at least ${GAME_CONFIG.INTIMIDATE_MIN_SEATS} seats to intimidate.` };

    const funds = Number(faction.embezzled_funds ?? 0);
    if (funds < GAME_CONFIG.INTIMIDATE_COST)
        return { success: false, error: `Need $${GAME_CONFIG.INTIMIDATE_COST}M for intimidation.` };

    // 2. Validate target
    const { data: target } = await supabase
        .from('factions').select('id, standing, seats, faction_name, last_action_type')
        .eq('id', targetId).single();
    if (!target) return { success: false, error: 'Target faction not found.' };
    if (target.id === factionId) return { success: false, error: 'Cannot target yourself.' };

    // 3. Deduct AP
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.INTIMIDATE_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 4. Calculate seats gained
    const yourStanding = Math.max(1, faction.standing ?? 30);
    const targetStanding = Math.max(1, target.standing ?? 30);
    const yourSeats = faction.seats || 0;
    let effectiveness = GAME_CONFIG.INTIMIDATE_BASE_EFFECTIVENESS * (yourStanding / targetStanding) * (yourSeats / 20);

    // Vulnerability bonus
    if (target.last_action_type === 'demonstrate_competence') {
        effectiveness *= (1 + GAME_CONFIG.INTIMIDATE_VULNERABILITY_BONUS);
    }

    let seatsGained = Math.min(Math.floor(effectiveness), target.seats || 0);
    const failed = seatsGained <= 0;

    // 5. Apply effects
    let newLoyalty = Math.max(0, (faction.loyalty ?? 50) + GAME_CONFIG.INTIMIDATE_LOYALTY);
    let newStanding = faction.standing ?? 30;
    let newFunds = funds - GAME_CONFIG.INTIMIDATE_COST;

    if (failed) {
        // Failed intimidation — humiliation
        newStanding = Math.max(0, newStanding + GAME_CONFIG.INTIMIDATE_FAIL_STANDING);
        await supabase.from('factions').update({
            standing: Math.min(GAME_CONFIG.STANDING_CAP, (target.standing ?? 30) + 1)
        }).eq('id', targetId);
    } else {
        // Successful intimidation
        newStanding = Math.min(GAME_CONFIG.STANDING_CAP, newStanding + GAME_CONFIG.INTIMIDATE_STANDING);

        // Transfer seats
        await supabase.from('factions').update({
            seats: Math.max(0, (target.seats || 0) - seatsGained)
        }).eq('id', targetId);
    }

    newLoyalty = Math.min(GAME_CONFIG.LOYALTY_CAP, newLoyalty);

    await supabase.from('factions').update({
        loyalty: newLoyalty,
        standing: newStanding,
        seats: (faction.seats || 0) + seatsGained,
        embezzled_funds: Math.max(0, newFunds),
        last_action_type: 'intimidate',
        consecutive_embezzle_ticks: 0,
    }).eq('id', factionId);

    // Nation stability hit
    const { data: nationData } = await supabase
        .from('nations').select('stability').eq('id', nationId).single();
    if (nationData) {
        const newStability = Math.max(0, Number(nationData.stability ?? 50) + GAME_CONFIG.INTIMIDATE_STABILITY);
        await supabase.from('nations').update({ stability: newStability }).eq('id', nationId);
    }

    // 6. Log action + create intimidation event for retaliation
    const eventId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: failed ? 'intimidate_failed' : 'intimidate',
        tick_performed: currentTick,
        result: {
            seats_gained: seatsGained, failed,
            target_faction_id: targetId, target_name: target.faction_name,
            loyalty_change: GAME_CONFIG.INTIMIDATE_LOYALTY,
            standing_change: failed ? GAME_CONFIG.INTIMIDATE_FAIL_STANDING : GAME_CONFIG.INTIMIDATE_STANDING,
            target_standing_change: failed ? 1 : 0,
            event_id: eventId,
            faction_name: faction.faction_name,
        }
    });

    // Create a pending intimidation event for the target to respond to
    if (!failed) {
        await supabase.from('campaign_actions').insert({
            party_id: targetId, nation_id: nationId,
            action_type: 'intimidation_pending',
            tick_performed: currentTick,
            result: {
                event_id: eventId,
                intimidator_faction_id: factionId,
                intimidator_name: faction.faction_name,
                seats_lost: seatsGained,
                status: 'pending',
            }
        });
    }

    return {
        success: true,
        newAp: apResult.newAp,
        seatsGained, failed,
        targetName: target.faction_name,
        loyaltyChange: GAME_CONFIG.INTIMIDATE_LOYALTY,
        standingChange: failed ? GAME_CONFIG.INTIMIDATE_FAIL_STANDING : GAME_CONFIG.INTIMIDATE_STANDING,
        newLoyalty, newStanding,
        eventId: failed ? null : eventId,
    };
}

/**
 * Respond to an intimidation event (Accept / Report / Retaliate).
 */
async function executeIntimidationResponse(supabase, factionId, nationId, eventId, response, currentTick) {
    // Find the pending intimidation event
    const { data: events } = await supabase
        .from('campaign_actions')
        .select('id, result')
        .eq('party_id', factionId)
        .eq('nation_id', nationId)
        .eq('action_type', 'intimidation_pending');

    const event = (events || []).find(e => e.result?.event_id === eventId && e.result?.status === 'pending');
    if (!event) return { success: false, error: 'Intimidation event not found or already resolved.' };

    const intimidatorId = event.result.intimidator_faction_id;

    // Mark event as resolved
    const updatedResult = { ...event.result, status: response, resolved_at_tick: currentTick };
    await supabase.from('campaign_actions').update({ result: updatedResult }).eq('id', event.id);

    if (response === 'accept') {
        return { success: true, response: 'accept', message: 'Losses accepted.' };
    }

    if (response === 'report') {
        // Intimidator: loyalty -8, standing -3
        const { data: intimidator } = await supabase
            .from('factions').select('id, loyalty, standing').eq('id', intimidatorId).single();
        if (intimidator) {
            await supabase.from('factions').update({
                loyalty: Math.max(0, (intimidator.loyalty ?? 50) + GAME_CONFIG.INTIMIDATE_REPORT_LOYALTY),
                standing: Math.max(0, (intimidator.standing ?? 30) + GAME_CONFIG.INTIMIDATE_REPORT_STANDING),
            }).eq('id', intimidatorId);
        }
        // Reporter: loyalty +3
        const { data: reporter } = await supabase
            .from('factions').select('id, loyalty').eq('id', factionId).single();
        if (reporter) {
            await supabase.from('factions').update({
                loyalty: Math.min(GAME_CONFIG.LOYALTY_CAP, (reporter.loyalty ?? 50) + GAME_CONFIG.INTIMIDATE_REPORTER_LOYALTY),
            }).eq('id', factionId);
        }

        await supabase.from('campaign_actions').insert({
            party_id: factionId, nation_id: nationId,
            action_type: 'intimidation_reported',
            tick_performed: currentTick,
            result: { event_id: eventId, intimidator_id: intimidatorId }
        });

        return { success: true, response: 'report', message: 'Reported to the Strongman.' };
    }

    if (response === 'retaliate') {
        // Check funds
        const { data: retaliator } = await supabase
            .from('factions').select('id, loyalty, seats, embezzled_funds').eq('id', factionId).single();
        if (!retaliator || Number(retaliator.embezzled_funds ?? 0) < GAME_CONFIG.INTIMIDATE_RETALIATE_COST)
            return { success: false, error: `Need $${GAME_CONFIG.INTIMIDATE_RETALIATE_COST}M to retaliate.` };

        // Retaliator: loyalty -2, funds -$1M
        await supabase.from('factions').update({
            loyalty: Math.max(0, (retaliator.loyalty ?? 50) + GAME_CONFIG.INTIMIDATE_RETALIATOR_LOYALTY),
            embezzled_funds: Math.max(0, Number(retaliator.embezzled_funds ?? 0) - GAME_CONFIG.INTIMIDATE_RETALIATE_COST),
        }).eq('id', factionId);

        // Intimidator: standing -2, seats -2 (transferred to retaliator)
        const { data: intimidator } = await supabase
            .from('factions').select('id, standing, seats').eq('id', intimidatorId).single();
        if (intimidator) {
            const seatLoss = Math.min(intimidator.seats || 0, Math.abs(GAME_CONFIG.INTIMIDATE_RETALIATE_SEATS));
            await supabase.from('factions').update({
                standing: Math.max(0, (intimidator.standing ?? 30) + GAME_CONFIG.INTIMIDATE_RETALIATE_STANDING),
                seats: Math.max(0, (intimidator.seats || 0) - seatLoss),
            }).eq('id', intimidatorId);
            if (seatLoss > 0) {
                await supabase.from('factions').update({
                    seats: (retaliator.seats || 0) + seatLoss,
                }).eq('id', factionId);
            }
        }

        await supabase.from('campaign_actions').insert({
            party_id: factionId, nation_id: nationId,
            action_type: 'intimidation_retaliated',
            tick_performed: currentTick,
            result: { event_id: eventId, intimidator_id: intimidatorId }
        });

        return { success: true, response: 'retaliate', message: 'Retaliation successful.' };
    }

    return { success: false, error: 'Invalid response.' };
}

/**
 * Purge: Strongman removes a faction's steward. Nuclear option.
 * Requires target loyalty < 20.
 * Target: steward removed, loyalty reset 50, standing -20, seats -30%, funds seized.
 * Others: loyalty +5. Nation: stability -1. Regime Health -3.
 * AP Cost: 3
 */
async function executePurge(supabase, factionId, nationId, targetFactionId, currentTick) {
    // 1. Validate caller is Strongman
    const { data: nation } = await supabase
        .from('nations').select('id, ruling_faction_id, stability, civil_unrest, regime_health, international_reputation, total_seats, successor_is_family_member')
        .eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };
    if (nation.ruling_faction_id !== factionId) return { success: false, error: 'Only the Strongman can purge.' };

    // 2. Validate target (must belong to same nation)
    const { data: target } = await supabase
        .from('factions').select('id, loyalty, standing, seats, embezzled_funds, faction_name')
        .eq('id', targetFactionId).eq('nation_id', nationId).single();
    if (!target) return { success: false, error: 'Target faction not found.' };
    if ((target.loyalty ?? 50) >= GAME_CONFIG.PURGE_LOYALTY_THRESHOLD)
        return { success: false, error: `Target loyalty must be below ${GAME_CONFIG.PURGE_LOYALTY_THRESHOLD}. Current: ${target.loyalty ?? 50}.` };

    // 3. Validate AP
    const { data: strongman } = await supabase
        .from('factions').select('action_points').eq('id', factionId).single();
    if ((strongman?.action_points || 0) < GAME_CONFIG.PURGE_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.PURGE_AP}.` };

    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.PURGE_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 4. Remove steward
    const { data: targetSteward } = await supabase
        .from('stewards').select('id, first_name, last_name, is_chosen_successor')
        .eq('faction_id', targetFactionId).eq('nation_id', nationId).eq('is_alive', true)
        .maybeSingle();

    if (targetSteward) {
        await supabase.from('stewards').update({
            is_alive: false, died_at_tick: currentTick,
            is_chosen_successor: false,
        }).eq('id', targetSteward.id);

        // If the purged steward was chosen successor, clear the family flag to restore AP generation
        if (targetSteward.is_chosen_successor && nation.successor_is_family_member) {
            await supabase.from('nations').update({ successor_is_family_member: false }).eq('id', nationId);
        }
    }

    // 5. Create new steward (weaker stats)
    const firstNames = ['Viktor', 'Andrei', 'Dmitri', 'Sergei', 'Nikolai', 'Alexei', 'Pavel', 'Oleg', 'Yuri', 'Ivan'];
    const lastNames = ['Petrov', 'Volkov', 'Novikov', 'Kozlov', 'Morozov', 'Popov', 'Lebedev', 'Sokolov', 'Kuznetsov', 'Pavlov'];
    const newFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const newLast = lastNames[Math.floor(Math.random() * lastNames.length)];

    const { data: oldSteward } = await supabase
        .from('stewards').select('pillar_key, steward_type')
        .eq('faction_id', targetFactionId).eq('nation_id', nationId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();

    await supabase.from('stewards').insert({
        nation_id: nationId,
        faction_id: targetFactionId,
        pillar_key: oldSteward?.pillar_key || 'party',
        steward_type: oldSteward?.steward_type || 'technocrat',
        first_name: newFirst,
        last_name: newLast,
        age: 35 + Math.floor(Math.random() * 20),
        standing: 15,
        power_base: 10,
        true_loyalty: 50,
        estimated_loyalty: 50,
        personal_wealth: 0,
        exit_readiness: 0,
        coup_readiness: 0,
        is_alive: true,
        is_chosen_successor: false,
        created_at_tick: currentTick,
    });

    // 6. Apply target faction effects
    const seatsLost = Math.ceil((target.seats || 0) * GAME_CONFIG.PURGE_TARGET_SEAT_LOSS);
    const newTargetSeats = Math.max(0, (target.seats || 0) - seatsLost);

    await supabase.from('factions').update({
        loyalty: GAME_CONFIG.PURGE_TARGET_NEW_LOYALTY,
        standing: Math.max(0, (target.standing ?? 30) + GAME_CONFIG.PURGE_TARGET_STANDING),
        seats: newTargetSeats,
        embezzled_funds: 0,
        coup_lockout_until_tick: currentTick + GAME_CONFIG.PURGE_COUP_LOCKOUT_TICKS,
    }).eq('id', targetFactionId);

    // 7. Scatter lost seats proportionally to other factions
    const { data: otherFactions } = await supabase
        .from('factions').select('id, seats')
        .eq('nation_id', nationId).eq('faction_type', 'party')
        .neq('id', targetFactionId);

    if (otherFactions && otherFactions.length > 0 && seatsLost > 0) {
        const totalOtherSeats = otherFactions.reduce((s, f) => s + (f.seats || 0), 0) || 1;
        let remaining = seatsLost;
        for (const of2 of otherFactions) {
            const share = Math.round(seatsLost * ((of2.seats || 0) / totalOtherSeats));
            const give = Math.min(share, remaining);
            if (give > 0) {
                await supabase.from('factions').update({ seats: (of2.seats || 0) + give }).eq('id', of2.id);
                remaining -= give;
            }
        }
        // Give remainder to largest faction
        if (remaining > 0) {
            const largest = otherFactions.sort((a, b) => (b.seats || 0) - (a.seats || 0))[0];
            await supabase.from('factions').update({ seats: (largest.seats || 0) + remaining }).eq('id', largest.id);
        }
    }

    // 8. All other non-ruling factions: loyalty +5
    const { data: allFactions } = await supabase
        .from('factions').select('id, loyalty')
        .eq('nation_id', nationId).eq('faction_type', 'party')
        .neq('id', targetFactionId).neq('id', factionId);
    for (const af of (allFactions || [])) {
        await supabase.from('factions').update({
            loyalty: Math.min(GAME_CONFIG.LOYALTY_CAP, (af.loyalty ?? 50) + GAME_CONFIG.PURGE_OTHERS_LOYALTY)
        }).eq('id', af.id);
    }

    // 9. Nation effects
    const newStability = Math.max(0, Number(nation.stability ?? 50) + GAME_CONFIG.PURGE_STABILITY);
    const newRegimeHealth = Math.max(0, Number(nation.regime_health ?? 80) + GAME_CONFIG.PURGE_REGIME_HEALTH);
    const nationUpdates = { stability: newStability, regime_health: newRegimeHealth };

    // Extra penalties for purging powerful factions
    if ((target.standing ?? 30) > 50) {
        nationUpdates.civil_unrest = Math.min(100, Number(nation.civil_unrest ?? 30) + 0.5);
    }
    if ((target.seats || 0) > 40) {
        nationUpdates.civil_unrest = Math.min(100, Number(nationUpdates.civil_unrest ?? nation.civil_unrest ?? 30) + 0.5);
    }
    nationUpdates.international_reputation = Math.max(0, Number(nation.international_reputation ?? 50) - 0.5);

    await supabase.from('nations').update(nationUpdates).eq('id', nationId);

    // 10. Log action
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'purge',
        tick_performed: currentTick,
        result: {
            target_faction_id: targetFactionId,
            target_name: target.faction_name,
            purged_steward: targetSteward ? `${targetSteward.first_name} ${targetSteward.last_name}` : 'Unknown',
            new_steward: `${newFirst} ${newLast}`,
            seats_lost: seatsLost,
            funds_seized: Number(target.embezzled_funds ?? 0),
        }
    });

    return {
        success: true,
        newAp: apResult.newAp,
        targetName: target.faction_name,
        purgedSteward: targetSteward ? `${targetSteward.first_name} ${targetSteward.last_name}` : 'Unknown',
        newSteward: `${newFirst} ${newLast}`,
        seatsLost,
        fundsSeized: Number(target.embezzled_funds ?? 0),
    };
}

/**
 * Redistribute Seats: Strongman transfers seats between factions.
 * Loser: standing -3, loyalty -5. Gainer: loyalty +5.
 * Max 30% of loser's seats. 4-tick cooldown.
 * AP Cost: 2
 */
async function executeRedistributeSeats(supabase, factionId, nationId, loserId, gainerId, seatCount, currentTick) {
    // 1. Validate caller is Strongman
    const { data: nation } = await supabase
        .from('nations').select('id, ruling_faction_id, last_redistribute_tick')
        .eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };
    if (nation.ruling_faction_id !== factionId) return { success: false, error: 'Only the Strongman can redistribute seats.' };

    // 2. Check cooldown
    if (nation.last_redistribute_tick != null && (currentTick - nation.last_redistribute_tick) < GAME_CONFIG.REDISTRIBUTE_SEATS_COOLDOWN)
        return { success: false, error: `Cooldown: ${GAME_CONFIG.REDISTRIBUTE_SEATS_COOLDOWN - (currentTick - nation.last_redistribute_tick)} ticks remaining.` };

    // 3. Validate AP
    const { data: strongman } = await supabase
        .from('factions').select('action_points').eq('id', factionId).single();
    if ((strongman?.action_points || 0) < GAME_CONFIG.REDISTRIBUTE_SEATS_AP)
        return { success: false, error: `Not enough AP. Need ${GAME_CONFIG.REDISTRIBUTE_SEATS_AP}.` };

    // 4. Validate loser and gainer (must belong to same nation)
    const { data: loser } = await supabase
        .from('factions').select('id, seats, standing, loyalty, faction_name')
        .eq('id', loserId).eq('nation_id', nationId).single();
    const { data: gainer } = await supabase
        .from('factions').select('id, seats, loyalty, faction_name')
        .eq('id', gainerId).eq('nation_id', nationId).single();
    if (!loser || !gainer) return { success: false, error: 'Faction not found.' };
    if (loserId === gainerId) return { success: false, error: 'Loser and gainer must be different.' };

    const maxSeats = Math.ceil((loser.seats || 0) * GAME_CONFIG.REDISTRIBUTE_SEATS_MAX_RATIO);
    if (seatCount > maxSeats) return { success: false, error: `Max ${maxSeats} seats (30% of ${loser.seats || 0}).` };
    if (seatCount <= 0) return { success: false, error: 'Must transfer at least 1 seat.' };
    if (seatCount > (loser.seats || 0)) return { success: false, error: 'Loser doesn\'t have enough seats.' };

    // 5. Deduct AP
    const apResult = await deductAP(supabase, factionId, GAME_CONFIG.REDISTRIBUTE_SEATS_AP);
    if (!apResult.success) return { success: false, error: 'Failed to deduct AP.' };

    // 6. Apply transfer
    await supabase.from('factions').update({
        seats: (loser.seats || 0) - seatCount,
        standing: Math.max(0, (loser.standing ?? 30) + GAME_CONFIG.REDISTRIBUTE_SEATS_LOSER_STANDING),
        loyalty: Math.max(0, (loser.loyalty ?? 50) + GAME_CONFIG.REDISTRIBUTE_SEATS_LOSER_LOYALTY),
    }).eq('id', loserId);

    await supabase.from('factions').update({
        seats: (gainer.seats || 0) + seatCount,
        loyalty: Math.min(GAME_CONFIG.LOYALTY_CAP, (gainer.loyalty ?? 50) + GAME_CONFIG.REDISTRIBUTE_SEATS_GAINER_LOYALTY),
    }).eq('id', gainerId);

    // 7. Update cooldown
    await supabase.from('nations').update({ last_redistribute_tick: currentTick }).eq('id', nationId);

    // 8. Log
    await supabase.from('campaign_actions').insert({
        party_id: factionId, nation_id: nationId,
        action_type: 'redistribute_seats',
        tick_performed: currentTick,
        result: {
            loser_id: loserId, loser_name: loser.faction_name,
            gainer_id: gainerId, gainer_name: gainer.faction_name,
            seats_transferred: seatCount,
        }
    });

    return {
        success: true,
        newAp: apResult.newAp,
        loserName: loser.faction_name,
        gainerName: gainer.faction_name,
        seatsTransferred: seatCount,
    };
}

function getEmbezzleRiskLabel(faction, nation) {
    const consecutiveTicks = (faction.consecutive_embezzle_ticks ?? 0);
    const corruption = Number(nation?.corruption ?? 50);
    const corruptionMod = (corruption - 50) * -0.005;
    let prob = GAME_CONFIG.EMBEZZLE_FUNDS_BASE_DETECTION
        + consecutiveTicks * GAME_CONFIG.EMBEZZLE_FUNDS_CONSECUTIVE_BONUS
        + corruptionMod;
    prob = Math.max(GAME_CONFIG.EMBEZZLE_FUNDS_DETECTION_FLOOR,
        Math.min(GAME_CONFIG.EMBEZZLE_FUNDS_DETECTION_CAP, prob));
    if (prob <= 0.12) return 'LOW';
    if (prob <= 0.25) return 'MODERATE';
    if (prob <= 0.35) return 'ELEVATED';
    return 'HIGH';
}

const STEWARD_TYPE_LABELS = {
    technocrat:           'Technocrat',
    general:              'General',
    party_chairman:       'Party Chairman',
    oligarch:             'Oligarch',
    security_chief:       'Security Chief',
    propaganda_chief:     'Propaganda Chief',
    intelligence_director:'Intelligence Director',
    religious_authority:  'Religious Authority',
};

const STEWARD_TYPE_DESCRIPTIONS = {
    technocrat:           'Administrative machinery of the state',
    general:              'Armed forces and national defense',
    party_chairman:       'Civilian party apparatus and regime legitimacy',
    oligarch:             'Private capital and economic leverage',
    security_chief:       'Internal security and surveillance apparatus',
    propaganda_chief:     'State media and narrative control',
    intelligence_director:'Foreign intelligence and covert operations',
    religious_authority:  'Religious authority and moral legitimacy',
};

/**
 * Process steward stats each tick for all living stewards in an autocracy nation.
 *
 * Standing: political influence within the regime
 * Power Base: institutional support and resources
 * True Loyalty: actual allegiance (hidden from strongman) — decays at -2/tick naturally
 * Estimated Loyalty: the Strongman's imperfect read — drifts toward true loyalty
 * Personal Wealth: embezzled funds ($M)
 * Exit Readiness: preparedness to flee (0-100)
 * Coup Readiness: preparedness to seize power (only grows when conditions align)
 */
async function processStewardTick(supabase, nation) {
    if (!isAutocracy(nation)) return;

    const { data: stewards } = await supabase
        .from('stewards')
        .select('id, faction_id, pillar_key, steward_type, standing, power_base, true_loyalty, estimated_loyalty, personal_wealth, exit_readiness, coup_readiness, is_chosen_successor')
        .eq('nation_id', nation.id)
        .eq('is_alive', true);

    if (!stewards || stewards.length === 0) return;

    // Fetch faction data for loyalty + seats
    const { data: factions } = await supabase
        .from('factions')
        .select('id, loyalty, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    const factionMap = {};
    let totalSeats = 0;
    for (const f of (factions || [])) {
        factionMap[f.id] = f;
        totalSeats += (f.seats || 0);
    }
    const avgSeats = factions && factions.length > 0 ? totalSeats / factions.length : 0;

    // Fetch ministry counts per faction
    const { data: ministries } = await supabase
        .from('ministries')
        .select('party_id')
        .eq('nation_id', nation.id)
        .not('party_id', 'is', null);

    const ministryCounts = {};
    for (const m of (ministries || [])) {
        ministryCounts[m.party_id] = (ministryCounts[m.party_id] || 0) + 1;
    }

    // Fetch pillar support values
    const { data: pillars } = await supabase
        .from('regime_pillars')
        .select('pillar_key, support')
        .eq('nation_id', nation.id);

    const pillarSupportMap = {};
    for (const p of (pillars || [])) {
        pillarSupportMap[p.pillar_key] = p.support ?? 50;
    }

    // Check if any pillar is below 20 (regime weakness signal)
    const anyPillarBelow20 = Object.values(pillarSupportMap).some(v => v < 20);

    for (const steward of stewards) {
        const faction = factionMap[steward.faction_id];
        if (!faction) continue;

        const factionLoyalty = faction.loyalty ?? 50;
        const factionSeats = faction.seats || 0;
        const ministryCount = ministryCounts[steward.faction_id] || 0;
        const pillarSupport = pillarSupportMap[steward.pillar_key] ?? 50;

        // ── Standing ──
        let standing = steward.standing;
        // Drift toward 50
        if (standing > 50) standing -= 1;
        else if (standing < 50) standing += 1;
        // Pillar backing
        if (pillarSupport > 50) standing += d2();
        // Ministry influence
        standing += ministryCount;
        // Disloyal factions lose influence
        if (factionLoyalty < 30) standing -= 2;

        // ── Power Base ──
        let powerBase = steward.power_base;
        // Natural decay
        powerBase -= d2();
        // Institutional backing
        if (pillarSupport > 60) powerBase += d2();
        // Ministry presence
        powerBase += ministryCount;
        // Legislative power
        if (factionSeats > avgSeats) powerBase += 1;

        // ── True Loyalty ──
        let trueLoyalty = steward.true_loyalty;
        // Natural decay: -2/tick (loyalty erodes without active maintenance)
        // Chosen Successor has halved decay (-1/tick)
        trueLoyalty -= steward.is_chosen_successor ? 1 : 2;
        // Regime crumbling → steward may turn disloyal faster
        if (pillarSupport < 35) trueLoyalty -= d2();

        // ── Estimated Loyalty (Strongman's imperfect view) ──
        let estimatedLoyalty = steward.estimated_loyalty ?? 55;
        // 80% chance of drifting toward true loyalty each tick
        if (Math.random() < 0.8) {
            if (estimatedLoyalty > trueLoyalty) estimatedLoyalty -= 1;
            else if (estimatedLoyalty < trueLoyalty) estimatedLoyalty += 1;
        }

        // ── Personal Wealth (embezzlement) ──
        let personalWealth = Number(steward.personal_wealth) || 0;
        // Ministry holders can embezzle
        if (ministryCount > 0) {
            personalWealth += 1 + Math.floor(Math.random() * 5); // +$1M-5M/tick
        }
        // Oligarchs have business income
        if (steward.steward_type === 'oligarch') {
            personalWealth += 5 + Math.floor(Math.random() * 11); // +$5M-15M/tick
        }

        // ── Exit Readiness ──
        let exitReadiness = steward.exit_readiness ?? 0;
        // Grows when steward has means and motive to flee
        if (trueLoyalty < 30 && personalWealth > 50) exitReadiness += 1;
        // Planning contingencies alongside coup
        if (steward.coup_readiness > 30) exitReadiness += 1;
        // Loyal stewards don't plan exits
        if (trueLoyalty > 60 && exitReadiness > 0) exitReadiness -= 1;

        // ── Coup Readiness ──
        let coupReadiness = steward.coup_readiness;
        let coupGrowing = false;
        // Only grows when the steward is strong, resourced, and disloyal
        if (standing > 60 && powerBase > 50 && trueLoyalty < 30) {
            coupReadiness += 1;
            coupGrowing = true;
        }
        // Regime weakness accelerates
        if (anyPillarBelow20) {
            coupReadiness += 1;
            coupGrowing = true;
        }
        // Decays when conditions aren't met
        if (!coupGrowing && coupReadiness > 0) {
            coupReadiness -= 1;
        }

        // Clamp all values
        standing = Math.max(0, Math.min(100, standing));
        powerBase = Math.max(0, Math.min(100, powerBase));
        trueLoyalty = Math.max(0, Math.min(100, trueLoyalty));
        estimatedLoyalty = Math.max(0, Math.min(100, estimatedLoyalty));
        exitReadiness = Math.max(0, Math.min(100, exitReadiness));
        coupReadiness = Math.max(0, Math.min(100, coupReadiness));

        await supabase.from('stewards')
            .update({
                standing,
                power_base: powerBase,
                true_loyalty: trueLoyalty,
                estimated_loyalty: estimatedLoyalty,
                personal_wealth: personalWealth,
                exit_readiness: exitReadiness,
                coup_readiness: coupReadiness,
                updated_at: new Date().toISOString()
            })
            .eq('id', steward.id);

        // Sync steward standing → faction standing (v2: standing is faction-level)
        await supabase.from('factions')
            .update({ standing: Math.max(0, Math.min(90, standing)) })
            .eq('id', steward.faction_id);
    }
}

// ==================== COALITION DETECTION ====================

/**
 * Process secret coalition detection each tick.
 * Each active secret coalition has a 5% passive chance of being discovered.
 * When detected, status changes to 'detected' and a campaign_actions entry is logged.
 */
async function processCoalitionDetection(supabase, nation, currentTick) {
    if (!isAutocracy(nation)) return;

    const { data: secretCoalitions } = await supabase
        .from('faction_coalitions')
        .select('id, faction_a_id, faction_b_id')
        .eq('nation_id', nation.id)
        .eq('coalition_type', 'secret')
        .eq('status', 'active');

    if (!secretCoalitions || secretCoalitions.length === 0) return;

    // Fetch faction names for logging
    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name')
        .eq('nation_id', nation.id);

    const nameMap = {};
    for (const fc of (factions || [])) nameMap[fc.id] = fc.faction_name;

    for (const coalition of secretCoalitions) {
        // 5% passive detection
        if (Math.random() < 0.05) {
            await supabase.from('faction_coalitions').update({
                status: 'detected',
                detected_at_tick: currentTick
            }).eq('id', coalition.id);

            // Log detection for the Strongman to see in regime log
            await supabase.from('campaign_actions').insert({
                party_id: nation.ruling_faction_id,
                nation_id: nation.id,
                action_type: 'coalition_detected',
                tick_performed: currentTick,
                result: {
                    coalition_id: coalition.id,
                    faction_a_name: nameMap[coalition.faction_a_id] || '???',
                    faction_b_name: nameMap[coalition.faction_b_id] || '???',
                    faction_a_id: coalition.faction_a_id,
                    faction_b_id: coalition.faction_b_id
                }
            });
        }
    }
}

// ==================== SHAKEUP AUTO-RESOLVE ====================

async function autoResolveStaleShakeups(supabase, nationId, currentTick) {
    const { data: votingShakeups } = await supabase
        .from('shakeups')
        .select('id, created_at, created_tick')
        .eq('nation_id', nationId)
        .eq('status', 'voting');

    if (!votingShakeups || votingShakeups.length === 0) return;

    const AUTO_RESOLVE_TICKS = 2;

    for (const shakeup of votingShakeups) {
        let tickAge = AUTO_RESOLVE_TICKS;

        if (shakeup.created_tick != null) {
            tickAge = currentTick - shakeup.created_tick;
        } else if (shakeup.created_at) {
            const ageMs = Date.now() - new Date(shakeup.created_at).getTime();
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
            tickAge = ageDays >= 1 ? AUTO_RESOLVE_TICKS : 0;
        }

        if (tickAge >= AUTO_RESOLVE_TICKS) {
            console.log(`Auto-resolving stale shakeup ${shakeup.id} (age: ${tickAge} ticks, now tick ${currentTick})`);
            try {
                const { data, error } = await supabase.rpc('resolve_shakeup', { p_shakeup_id: shakeup.id });
                if (error) console.error('Auto-resolve shakeup error:', error);
                else console.log('Auto-resolve result:', data);
            } catch (e) {
                console.error('Auto-resolve shakeup exception:', e);
            }
        }
    }
}


// ==================== STAT EFFECTS PROCESSING ====================

async function processStatEffects(supabase, nation, currentTick) {
    let activeLaws;

    // Try join query first; fall back to separate lookup if FK is missing
    const { data, error: joinError } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', nation.id);

    if (joinError) {
        console.warn('[processStatEffects] Join query failed, falling back to separate policy lookup:', joinError.message);
        const { data: lawsOnly, error: fallbackError } = await supabase
            .from('active_laws')
            .select('*')
            .eq('nation_id', nation.id);

        if (fallbackError || !lawsOnly || lawsOnly.length === 0) {
            if (fallbackError) console.error('[processStatEffects] Fallback query also failed:', fallbackError.message);
            return [];
        }

        // Fetch policies separately and attach them
        const policyIds = [...new Set(lawsOnly.filter(l => l.policy_id).map(l => l.policy_id))];
        if (policyIds.length > 0) {
            const { data: policies } = await supabase
                .from('policies')
                .select('*')
                .in('id', policyIds);
            const policyMap = {};
            for (const p of (policies || [])) policyMap[p.id] = p;
            for (const law of lawsOnly) {
                law.policies = policyMap[law.policy_id] || null;
            }
        }
        activeLaws = lawsOnly;
    } else {
        activeLaws = data;
        // If join succeeded but policies are null for every law, try separate lookup
        if (activeLaws && activeLaws.length > 0 && activeLaws.every(l => !l.policies && l.policy_id)) {
            console.warn('[processStatEffects] Join returned null policies for all laws — fetching separately');
            const policyIds = [...new Set(activeLaws.filter(l => l.policy_id).map(l => l.policy_id))];
            if (policyIds.length > 0) {
                const { data: policies } = await supabase
                    .from('policies')
                    .select('*')
                    .in('id', policyIds);
                const policyMap = {};
                for (const p of (policies || [])) policyMap[p.id] = p;
                for (const law of activeLaws) {
                    if (!law.policies && law.policy_id) law.policies = policyMap[law.policy_id] || null;
                }
            }
        }
    }

    if (!activeLaws || activeLaws.length === 0) {
        console.log(`[processStatEffects] No active laws for ${nation.name}`);
        return [];
    }

    console.log(`[processStatEffects] Processing ${activeLaws.length} active law(s) for ${nation.name}`);

    const appliedEffects = [];
    const nationUpdates = {};
    const lawsToAdvance = [];
    const lawsToDelete = [];

    for (const law of activeLaws) {
        const policy = law.policies;
        const effectSource = `active_law=${law.id}, bill=${law.bill_id || 'unknown'}, policy=${policy?.id || 'unknown'} (${policy?.policy_name || 'Unknown'})`;
        const lastApplied = law.effects_applied_through_tick || 0;
        if (lastApplied >= currentTick) continue;

        const passedTick = law.passed_tick || 0;

        let effects = [];
        const isReversal = law.is_reversal || false;

        if (isReversal && law.reversal_effects && Array.isArray(law.reversal_effects)) {
            effects = law.reversal_effects;
        } else if (policy) {
            if (policy.stat_effects && Array.isArray(policy.stat_effects) && policy.stat_effects.length > 0) {
                effects.push(...policy.stat_effects);
            } else if (policy.target_stat) {
                effects.push({
                    stat_key: policy.target_stat,
                    direction: (policy.stat_direction || 'UP').toLowerCase(),
                    rate: policy.stat_change_per_tick || 1,
                    delay_ticks: 0,
                    duration_ticks: policy.duration_months || 12
                });
            }
        } else if (!isReversal) {
            console.warn(`[processStatEffects] Active law ${law.id} (bill=${law.bill_id}) has NULL policy (policy_id=${law.policy_id}) — no stat effects will be applied`);
        }

        if (effects.length === 0) {
            lawsToAdvance.push(law.id);
            continue;
        }

        let anyEffectApplied = false;
        let allEffectsComplete = true;

        for (let tick = lastApplied + 1; tick <= currentTick; tick++) {
            const ticksSincePassed = tick - passedTick;

            for (const eff of effects) {
                const delay = Number(eff.delay_ticks) || 0;
                const duration = Number(eff.duration_ticks) || 12;
                const rate = Number(eff.rate) || 1;
                const dir = String(eff.direction || '').toLowerCase();
                const rawStatKey = eff.stat_key;
                const statKey = normalizeNationStatKey(rawStatKey);

                if (!statKey || !NATION_STAT_COLUMN_SET.has(statKey)) {
                    if (tick === lastApplied + 1) {
                        console.warn(
                            `[processStatEffects] Skipping invalid stat_key "${rawStatKey}" for ${effectSource}`
                        );
                    }
                    continue;
                }

                if (dir !== 'up' && dir !== 'down') {
                    if (tick === lastApplied + 1) {
                        console.warn(
                            `[processStatEffects] Skipping invalid direction "${eff.direction}" for stat_key="${rawStatKey}" from ${effectSource}`
                        );
                    }
                    continue;
                }

                if (ticksSincePassed <= delay + duration) {
                    allEffectsComplete = false;
                }

                if (ticksSincePassed > delay && ticksSincePassed <= delay + duration) {
                    // GDP and debt are driven by dedicated systems — skip
                    if (STAT_PROCESSOR_SKIP.has(statKey)) continue;

                    const currentVal = nationUpdates[statKey] !== undefined
                        ? nationUpdates[statKey]
                        : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : 50);

                    // For raw-value stats (population), scale rate by divisor
                    // so rate: 1 means +1M for population
                    let scaledRate = RAW_SCALING_DIVISORS[statKey] ? rate * RAW_SCALING_DIVISORS[statKey] : rate;

                    // Debt service burden: reduce government-spending-dependent stat effects
                    if (SPENDING_AFFECTED_STATS.has(statKey)) {
                        scaledRate *= getSpendingEffectivenessMultiplier(nation);
                    }

                    let newVal;
                    if (dir === 'up') {
                        newVal = currentVal + scaledRate;
                    } else {
                        newVal = currentVal - scaledRate;
                    }

                    // Raw-value stats — don't clamp to 0-100
                    if (RAW_SCALING_DIVISORS[statKey]) {
                        newVal = Math.max(0, newVal);
                    } else {
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                    }
                    nationUpdates[statKey] = newVal;
                    anyEffectApplied = true;

                    appliedEffects.push({
                        policy: isReversal ? '↩ Reversal: ' + (policy?.policy_name || 'Unknown') : (policy?.policy_name || 'Unknown'),
                        stat: statKey,
                        direction: dir,
                        rate: rate,
                        tick: tick,
                        newValue: newVal
                    });
                }
            }
        }

        lawsToAdvance.push(law.id);

        if (isReversal && allEffectsComplete) {
            lawsToDelete.push(law.id);
        }
    }

    let nationUpdateError = null;
    if (Object.keys(nationUpdates).length > 0) {
        const { error } = await supabase
            .from('nations')
            .update(nationUpdates)
            .eq('id', nation.id);
        nationUpdateError = error;
    }

    if (nationUpdateError) {
        console.error(
            '[processStatEffects] Nation stat update FAILED',
            { nationId: nation.id, payload: nationUpdates, error: nationUpdateError.message }
        );
        return [];
    }

    if (Object.keys(nationUpdates).length > 0) {
        console.log(`[processStatEffects] Nation stats updated for ${nation.name}:`, JSON.stringify(nationUpdates));
        // Propagate DB-written values to in-memory nation for downstream tick steps (3b-9)
        Object.assign(nation, nationUpdates);
    }

    for (const id of lawsToAdvance) {
        const { error: trackErr } = await supabase
            .from('active_laws')
            .update({ effects_applied_through_tick: currentTick })
            .eq('id', id);
        if (trackErr) {
            console.error(`[processStatEffects] Tracking update FAILED for active_law ${id}:`, trackErr.message);
        }
    }

    for (const id of lawsToDelete) {
        await supabase.from('active_laws').delete().eq('id', id);
    }

    return appliedEffects;
}

/**
 * Process ministry action stat effects during tick advancement.
 * Mirrors processStatEffects but reads from ministry_action_log.
 */
async function processMinistryActions(supabase, nation, currentTick) {
    const { data: actions, error: fetchError } = await supabase
        .from('ministry_action_log')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('processed', false);

    if (fetchError) {
        console.error('[processMinistryActions] Failed to fetch actions:', fetchError.message);
        return [];
    }
    if (!actions || actions.length === 0) return [];

    const appliedEffects = [];
    const nationUpdates = {};
    // Track minister approval changes keyed by ministry_key + faction_id
    const ministerUpdates = {};
    // Track initial minister approval values for cascade delta calculation
    const ministerBaseline = {};
    // Track faction approval changes keyed by faction_id
    const factionUpdates = {};
    const factionBaseline = {};
    // Defer tracking updates until after nation stats are persisted
    const trackingUpdates = [];

    for (const action of actions) {
        const effects = action.stat_effects;
        if (!effects || !Array.isArray(effects) || effects.length === 0) {
            // No effects — mark as processed
            await supabase.from('ministry_action_log').update({ processed: true }).eq('id', action.id);
            continue;
        }

        const lastApplied = action.effects_applied_through_tick || 0;
        if (lastApplied >= currentTick) continue;

        const appliedTick = action.applied_at_tick || 0;

        let allEffectsComplete = true;

        for (let tick = lastApplied + 1; tick <= currentTick; tick++) {
            const ticksSinceAction = tick - appliedTick;

            for (const eff of effects) {
                const delay = Number(eff.delay_ticks) || 0;
                const duration = Number(eff.duration_ticks) || 4;
                const rate = Number(eff.rate) || 1;
                const target = eff.target || 'nation';
                const rawStatKey = eff.stat_key;
                const statKey = (target === 'nation') ? normalizeNationStatKey(rawStatKey) : rawStatKey;
                if (target === 'nation' && (!statKey || !NATION_STAT_COLUMN_SET.has(statKey))) {
                    console.warn(`[processMinistryActions] Skipping invalid stat_key "${rawStatKey}" for action "${action.action_key}" in ${nation.name}`);
                    continue;
                }

                if (ticksSinceAction <= delay + duration) {
                    allEffectsComplete = false;
                }

                if (ticksSinceAction > delay && ticksSinceAction <= delay + duration) {
                    let currentVal, newVal;

                    if (target === 'minister') {
                        const mKey = action.ministry_key + ':' + action.faction_id;
                        if (ministerUpdates[mKey] === undefined) {
                            // Fetch current minister_approval from the ministries table
                            const { data: ministry } = await supabase
                                .from('ministries')
                                .select('minister_approval')
                                .eq('nation_id', nation.id)
                                .eq('ministry_key', action.ministry_key)
                                .eq('party_id', action.faction_id)
                                .single();
                            ministerUpdates[mKey] = (ministry?.minister_approval ?? 50);
                            ministerBaseline[mKey] = ministerUpdates[mKey];
                        }
                        currentVal = ministerUpdates[mKey];
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        ministerUpdates[mKey] = newVal;
                    } else if (target === 'faction') {
                        const fKey = action.faction_id;
                        if (factionUpdates[fKey] === undefined) {
                            const { data: faction } = await supabase
                                .from('factions')
                                .select('approval_rating')
                                .eq('id', action.faction_id)
                                .single();
                            factionUpdates[fKey] = (faction?.approval_rating ?? 50);
                            factionBaseline[fKey] = factionUpdates[fKey];
                        }
                        currentVal = factionUpdates[fKey];
                        newVal = eff.direction === 'up' ? currentVal + rate : currentVal - rate;
                        newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        factionUpdates[fKey] = newVal;
                    } else {
                        // Default: nation stat
                        // GDP and debt are driven by dedicated systems — skip
                        if (STAT_PROCESSOR_SKIP.has(statKey)) continue;
                        currentVal = nationUpdates[statKey] !== undefined
                            ? nationUpdates[statKey]
                            : (nation[statKey] !== undefined && nation[statKey] !== null ? Number(nation[statKey]) : 50);
                        let scaledMinistryRate = RAW_SCALING_DIVISORS[statKey] ? rate * RAW_SCALING_DIVISORS[statKey] : rate;
                        newVal = eff.direction === 'up' ? currentVal + scaledMinistryRate : currentVal - scaledMinistryRate;
                        // Raw-value stats (debt, population) must not be clamped to 0-100
                        if (RAW_SCALING_DIVISORS[statKey]) {
                            newVal = Math.max(0, newVal);
                        } else {
                            newVal = Math.round(Math.max(0, Math.min(100, newVal)) * 10) / 10;
                        }
                        nationUpdates[statKey] = newVal;
                    }

                    appliedEffects.push({
                        action: action.action_key,
                        ministry: action.ministry_key,
                        stat: statKey,
                        target: target,
                        direction: eff.direction,
                        rate: rate,
                        tick: tick,
                        newValue: newVal
                    });
                }
            }
        }

        // Defer tracking update — only apply after nation stats are persisted
        trackingUpdates.push({ id: action.id, allEffectsComplete });
    }

    // Bulk update nation stats FIRST — before advancing tracking
    let nationUpdateFailed = false;
    if (Object.keys(nationUpdates).length > 0) {
        const { error: nationError } = await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        if (nationError) {
            console.error('[processMinistryActions] Nation stat update FAILED — effects will be retried next tick',
                { nationId: nation.id, payload: nationUpdates, error: nationError.message });
            nationUpdateFailed = true;
        } else {
            console.log('[processMinistryActions] Nation stats updated:', JSON.stringify(nationUpdates));
        }
    }

    // Only advance tracking if nation update succeeded (or had nothing to update)
    if (!nationUpdateFailed) {
        for (const tu of trackingUpdates) {
            await supabase.from('ministry_action_log').update({
                effects_applied_through_tick: currentTick,
                processed: tu.allEffectsComplete
            }).eq('id', tu.id);
        }
    }

    // Bulk update minister approval
    for (const mKey of Object.keys(ministerUpdates)) {
        const [ministryKey, factionId] = mKey.split(':');
        await supabase.from('ministries')
            .update({ minister_approval: ministerUpdates[mKey] })
            .eq('nation_id', nation.id)
            .eq('ministry_key', ministryKey)
            .eq('party_id', factionId);
    }

    // Cascade minister approval LOSSES to party approval (PM losses at 2x)
    for (const mKey of Object.keys(ministerUpdates)) {
        const baseline = ministerBaseline[mKey];
        const current = ministerUpdates[mKey];
        if (baseline === undefined || current >= baseline) continue; // only losses cascade
        const [ministryKey, factionId] = mKey.split(':');
        const loss = baseline - current;
        const multiplier = ministryKey === 'prime_minister' ? 2 : 1;
        // Load faction approval into factionUpdates if not already tracked
        if (factionUpdates[factionId] === undefined) {
            const { data: faction } = await supabase
                .from('factions')
                .select('approval_rating')
                .eq('id', factionId)
                .single();
            factionUpdates[factionId] = (faction?.approval_rating ?? 50);
            factionBaseline[factionId] = factionUpdates[factionId];
        }
        factionUpdates[factionId] = Math.max(0, factionUpdates[factionId] - (loss * multiplier));
    }

    // Bulk update faction momentum via event cascades
    for (const fKey of Object.keys(factionUpdates)) {
        const delta = Math.round((factionUpdates[fKey] - (factionBaseline[fKey] ?? 50)) * 10) / 10;
        if (delta !== 0) {
            await adjustMomentumAll(supabase, nation.id, fKey, delta, 'event:cascade');
        }
    }

    return appliedEffects;
}

// ==================== LAYER 1: PER-TICK MINISTER APPROVAL ====================

/**
 * Delta-based minister approval model.
 *
 * Each minister's approval moves based on how their owned stats have changed
 * relative to their baseline (snapshot at appointment time). Ministers are
 * judged on improvement/deterioration, not inherited state.
 *
 * For each stat: delta = (current - baseline) × directionSign
 *   (positive delta = good direction, negative = bad direction)
 * avgDelta = average of all deltas
 * approval += avgDelta × DELTA_SENSITIVITY
 * If avgDelta ≈ 0 (stagnation), apply a small decay.
 *
 * Ministers without baselines get them auto-set to current values (migration path).
 *
 * @param {object} supabase
 * @param {object} nation - full nation row with current stat values
 * @param {number} currentTick
 * @returns {Array<object>} per-minister results for tick summary
 */
async function updateMinisterApprovals(supabase, nation, currentTick) {
    const cfg = MINISTER_APPROVAL_CONFIG;

    const { data: ministries } = await supabase
        .from('ministries')
        .select('id, ministry_key, minister_approval, minister_first_name, party_id, stat_baselines')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (!ministries || ministries.length === 0) return [];

    const results = [];

    for (const ministry of ministries) {
        // Skip vacant ministries (no minister appointed)
        if (!ministry.minister_first_name) continue;

        const ownedStats = MINISTRY_TO_STATS[ministry.ministry_key];
        if (!ownedStats || ownedStats.length === 0) continue;

        // Auto-set baselines for ministers that don't have them yet (migration path)
        let baselines = ministry.stat_baselines;
        if (!baselines || Object.keys(baselines).length === 0) {
            baselines = buildMinistryBaselines(ministry.ministry_key, nation);
            await supabase.from('ministries')
                .update({ stat_baselines: baselines })
                .eq('id', ministry.id);
        }

        // Calculate average delta: how much each stat moved in the "good" direction
        let deltaSum = 0;
        let deltaCount = 0;
        for (const statKey of ownedStats) {
            const sign = statDirectionSign(statKey);
            if (sign === 0) continue; // skip neutral stats (taxes, etc.)
            const current = Number(nation[statKey] ?? 50);
            const baseline = Number(baselines[statKey] ?? current);
            // sign=1 (higher-is-better): improvement = current - baseline (positive = good)
            // sign=-1 (lower-is-better): improvement = baseline - current (positive = good)
            const delta = (current - baseline) * sign;
            deltaSum += delta;
            deltaCount++;
        }

        if (deltaCount === 0) continue;
        const avgDelta = deltaSum / deltaCount;

        const oldApproval = ministry.minister_approval ?? cfg.NEW_MINISTER_APPROVAL;
        let newApproval = oldApproval;

        if (Math.abs(avgDelta) < 0.5) {
            // Stagnation: stats haven't moved meaningfully — slow decay
            newApproval += cfg.STAGNATION_DECAY;
        } else {
            // Apply delta-based movement
            newApproval += avgDelta * cfg.DELTA_SENSITIVITY;
        }

        newApproval = Math.round(Math.max(0, Math.min(100, newApproval)) * 10) / 10;

        // Update baselines to current values so next tick only sees incremental change
        const updatedBaselines = {};
        for (const statKey of ownedStats) {
            if (statDirectionSign(statKey) === 0) continue;
            updatedBaselines[statKey] = Number(nation[statKey] ?? 50);
        }

        await supabase.from('ministries')
            .update({ minister_approval: newApproval, stat_baselines: updatedBaselines })
            .eq('id', ministry.id);

        results.push({
            ministry_key: ministry.ministry_key,
            old: oldApproval,
            new: newApproval,
            avgDelta: Math.round(avgDelta * 10) / 10,
            delta: Math.round((newApproval - oldApproval) * 10) / 10
        });
    }

    if (results.length > 0) {
        console.log(`[updateMinisterApprovals] ${nation.name}: ${results.map(r =>
            `${r.ministry_key} ${r.old}→${r.new} (avgDelta=${r.avgDelta})`
        ).join(', ')}`);
    }

    return results;
}

// ==================== LAYER 2: GOVERNMENT APPROVAL (SIMPLIFIED) ====================

/**
 * Simplified government approval calculation.
 *
 * govApproval = avg(filled minister approvals) + vacancyPenalty + eventModifier
 *
 * No composite pillars, no trend lookback, no embattled tracking,
 * no momentum feedback loop. Simple, transparent, and predictable.
 *
 * @param {object} supabase
 * @param {object} nation - nation row with current stat values
 * @param {number} currentTick
 * @returns {number|null} the computed government approval (0-100), or null if no government
 */
async function calculateGovernmentApprovalTick(supabase, nation, currentTick) {
    const cfg = MINISTER_APPROVAL_CONFIG;

    const { data: ministries } = await supabase
        .from('ministries')
        .select('ministry_key, minister_approval, minister_first_name')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (!ministries || ministries.length === 0) return null;

    const filledMinistries = ministries.filter(m => m.minister_first_name);
    const vacantCount = ministries.length - filledMinistries.length;

    // Average of all filled minister approvals
    let ministerSum = 0;
    for (const m of filledMinistries) {
        ministerSum += (m.minister_approval ?? cfg.NEW_MINISTER_APPROVAL);
    }
    const ministerAvg = filledMinistries.length > 0 ? ministerSum / filledMinistries.length : 50;

    // Vacancy penalty: -3 per unfilled ministry seat
    const vacancyPenalty = vacantCount * cfg.VACANCY_PENALTY;

    // Event modifier (decayed before this call by the tick processor)
    const eventModifier = Number(nation.gov_approval_events ?? 0);

    // Composite target from minister averages + penalties + events
    let rawApproval = ministerAvg + vacancyPenalty + eventModifier;
    rawApproval = Math.max(0, Math.min(100, rawApproval));

    // Cap per-tick change to ±3 so approval moves gradually
    const MAX_TICK_CHANGE = 3;
    const previousApproval = Number(nation.gov_approval ?? 50);
    const delta = rawApproval - previousApproval;
    const clampedDelta = Math.max(-MAX_TICK_CHANGE, Math.min(MAX_TICK_CHANGE, delta));
    const govApproval = Math.round(Math.max(0, Math.min(100, previousApproval + clampedDelta)));

    // Store on nation
    await supabase.from('nations')
        .update({ gov_approval: govApproval })
        .eq('id', nation.id);

    // Update in-memory nation object
    nation.gov_approval = govApproval;

    console.log(`[GovApproval] ${nation.name}: ${govApproval} (target=${Math.round(rawApproval)}, delta=${Math.round(clampedDelta)}, prev=${previousApproval}, avg=${Math.round(ministerAvg)}, vacancies=${vacantCount}×${cfg.VACANCY_PENALTY}=${vacancyPenalty}, events=${eventModifier})`);

    return govApproval;
}

async function processOngoingCosts(supabase, nation, currentTick) {
    const { data: activeLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', nation.id);

    if (!activeLaws || activeLaws.length === 0) return { totalCost: 0, details: [] };

    let totalCost = 0;
    const details = [];

    for (const law of activeLaws) {
        const policy = law.policies;
        if (!policy) continue;

        const baseCost = policy.ongoing_base_cost || policy.ongoing_cost_per_tick || 0;
        if (baseCost === 0) continue;

        let tickCost = baseCost;

        if (policy.ongoing_scaling_stat && nation[policy.ongoing_scaling_stat] !== undefined) {
            const scalingVal = Number(nation[policy.ongoing_scaling_stat]) || 1;
            const divisor = RAW_SCALING_DIVISORS[policy.ongoing_scaling_stat] || 50;
            tickCost = baseCost * (scalingVal / divisor);
        }

        totalCost += tickCost;

        const newAccum = (law.ongoing_accumulated || 0) + tickCost;
        await supabase.from('active_laws').update({
            ongoing_accumulated: newAccum
        }).eq('id', law.id);

        details.push({ policy: policy.policy_name, cost: tickCost });
    }

    // Policy costs are tracked in active_laws.ongoing_accumulated.

    return { totalCost, details };
}

// All columns that nations_history tracks (must match the DB table schema)
const HISTORY_SNAPSHOT_COLUMNS = [
    ...NATION_STAT_COLUMNS,
    'gov_approval',
    'competition_voters', 'liberty_voters', 'security_voters', 'globalism_voters',
    'progressive_voters', 'liberal_voters', 'moderate_voters', 'conservative_voters', 'nationalist_voters'
];

async function snapshotNationHistory(supabase, nation, currentTick) {
    const snapshot = { nation_id: nation.id, tick: currentTick };

    for (const key of HISTORY_SNAPSHOT_COLUMNS) {
        if (nation[key] !== undefined && nation[key] !== null) {
            snapshot[key] = Number(nation[key]);
        }
    }

    const { error: snapError } = await supabase.from('nations_history').upsert(snapshot, {
        onConflict: 'nation_id,tick'
    });
    if (snapError) {
        console.error('[snapshotNationHistory] FAILED for nation', nation.id, 'tick', currentTick, ':', snapError.message);
    } else {
        console.log(`[snapshotNationHistory] Stored ${Object.keys(snapshot).length - 2} stats for nation ${nation.id} at tick ${currentTick}`);
    }
}

/**
 * Record current nation stat values into stat_history for trend calculations.
 * Called once per tick, before minister/government approval calculations.
 * Uses upsert to prevent duplicate rows if tick is re-processed.
 */
async function recordStatHistory(supabase, nation, currentTick) {
    const rows = [];
    for (const statKey of NATION_STAT_COLUMNS) {
        const val = nation[statKey];
        if (val !== undefined && val !== null) {
            rows.push({ nation_id: nation.id, stat_name: statKey, value: Number(val), tick: currentTick });
        }
    }
    if (rows.length === 0) return;
    const { error } = await supabase.from('stat_history').upsert(rows, { onConflict: 'nation_id,stat_name,tick' });
    if (error) {
        console.error('[recordStatHistory] FAILED for nation', nation.id, 'tick', currentTick, ':', error.message);
    }
}


// ==================== EVENT TICK PROCESSOR ====================

async function processEvents(supabase, nation, currentTick) {
    const { data: events } = await supabase
        .from('event_templates')
        .select('*, event_descriptions(*), event_triggers(*), event_effects(*)')
        .eq('is_active', true);

    if (!events || events.length === 0) return [];

    const { data: recentLog } = await supabase
        .from('event_log')
        .select('event_id, fired_at_tick')
        .eq('nation_id', nation.id)
        .order('fired_at_tick', { ascending: false })
        .limit(200);

    const lastFiredMap = {};
    for (const entry of (recentLog || [])) {
        if (!lastFiredMap[entry.event_id]) {
            lastFiredMap[entry.event_id] = entry.fired_at_tick;
        }
    }

    const firedEvents = [];

    for (const event of events) {
        const lastFired = lastFiredMap[event.id];
        if (lastFired !== undefined) {
            const ticksSince = currentTick - lastFired;
            if (ticksSince < event.cooldown_ticks) continue;
        }

        const triggers = event.event_triggers || [];
        if (triggers.length === 0) continue;

        let allTriggersPass = true;
        for (const trigger of triggers) {
            const statValue = nation[trigger.stat_key];
            if (statValue === null || statValue === undefined) {
                allTriggersPass = false;
                break;
            }
            const val = Number(statValue);
            if (trigger.min_value !== null && trigger.min_value !== undefined && val < trigger.min_value) {
                allTriggersPass = false;
                break;
            }
            if (trigger.max_value !== null && trigger.max_value !== undefined && val > trigger.max_value) {
                allTriggersPass = false;
                break;
            }
        }
        if (!allTriggersPass) continue;

        const roll = Math.random() * 100;
        if (roll >= event.probability) continue;

        const descriptions = event.event_descriptions || [];
        let description = descriptions.length > 0
            ? descriptions[Math.floor(Math.random() * descriptions.length)].description_text
            : event.name;

        // Resolve placeholders in event description
        description = description.replace(/\{nation\}/g, nation.name || 'Unknown');

        const effects = event.event_effects || [];
        const appliedEffects = [];
        const nationUpdates = {};

        for (const effect of effects) {
            // Normalize + validate stat_key for nation targets
            const rawEvtStatKey = effect.stat_key;
            const evtStatKey = (effect.target === 'nation') ? normalizeNationStatKey(rawEvtStatKey) : rawEvtStatKey;
            if (effect.target === 'nation' && (!evtStatKey || !NATION_STAT_COLUMN_SET.has(evtStatKey))) {
                console.warn(`[processEvents] Skipping invalid stat_key "${rawEvtStatKey}" in event "${event.name}" for ${nation.name}`);
                continue;
            }

            if (effect.target === 'nation') {
                // GDP and debt are driven by dedicated systems — skip
                if (STAT_PROCESSOR_SKIP.has(evtStatKey)) continue;
                const currentVal = nation[evtStatKey] !== undefined
                    ? Number(nation[evtStatKey]) : 50;
                const scaledChange = RAW_SCALING_DIVISORS[evtStatKey]
                    ? effect.change_value * RAW_SCALING_DIVISORS[evtStatKey]
                    : effect.change_value;
                // Raw-value stats (debt, population) must not be clamped to 0-100
                const newVal = RAW_SCALING_DIVISORS[evtStatKey]
                    ? Math.max(0, currentVal + scaledChange)
                    : Math.max(0, Math.min(100, currentVal + scaledChange));
                nationUpdates[evtStatKey] = newVal;
                nation[evtStatKey] = newVal;

                appliedEffects.push({
                    stat: evtStatKey, change: effect.change_value,
                    target: 'nation', old: currentVal, new: newVal
                });

            } else if (effect.target === 'ruling_party') {
                const rulingId = nation.ruling_faction_id;
                if (!rulingId) continue;

                const { data: faction } = await supabase
                    .from('factions')
                    .select(effect.stat_key)
                    .eq('id', rulingId)
                    .single();

                if (faction) {
                    const currentVal = faction[effect.stat_key] ?? 50;
                    const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
                    await supabase.from('factions')
                        .update({ [effect.stat_key]: newVal })
                        .eq('id', rulingId);

                    appliedEffects.push({
                        stat: effect.stat_key, change: effect.change_value,
                        target: 'ruling_party', faction_id: rulingId,
                        old: currentVal, new: newVal
                    });
                }

            } else if (effect.target === 'random_faction') {
                const { data: factions } = await supabase
                    .from('factions')
                    .select('id, ' + effect.stat_key)
                    .eq('nation_id', nation.id)
                    .eq('faction_type', 'party');

                if (factions && factions.length > 0) {
                    const target = factions[Math.floor(Math.random() * factions.length)];
                    const currentVal = target[effect.stat_key] ?? 50;
                    const newVal = Math.max(0, Math.min(100, currentVal + effect.change_value));
                    await supabase.from('factions')
                        .update({ [effect.stat_key]: newVal })
                        .eq('id', target.id);

                    appliedEffects.push({
                        stat: effect.stat_key, change: effect.change_value,
                        target: 'random_faction', faction_id: target.id,
                        old: currentVal, new: newVal
                    });
                }
            }
        }

        if (Object.keys(nationUpdates).length > 0) {
            await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        }

        const targetFactionId = appliedEffects.find(e => e.faction_id)?.faction_id || null;
        await supabase.from('event_log').insert({
            event_id: event.id,
            nation_id: nation.id,
            event_name: event.name,
            faction_id: targetFactionId,
            description_used: description,
            effects_applied: appliedEffects,
            category: event.category,
            fired_at_tick: currentTick
        });

        firedEvents.push({
            eventName: event.name,
            category: event.category,
            description: description,
            effects: appliedEffects
        });

        console.log(`Event fired: "${event.name}" in ${nation.name} (tick ${currentTick})`);
    }

    return firedEvents;
}


// ==================== CRISIS TICK PROCESSOR ====================

/**
 * Process persistent crises for a nation.
 * - Activates crises when ALL trigger conditions are met
 * - Applies effects every tick while active
 * - Deactivates crises when ALL recovery conditions are met
 * - Effects cascade: nation stats, government/coalition approval, minister approval
 */
async function processCrises(supabase, nation, currentTick) {
    // 1. Load all active crisis templates
    const { data: crisisTemplates } = await supabase
        .from('crisis_templates')
        .select('*, crisis_triggers(*), crisis_effects(*), crisis_end_triggers(*)')
        .eq('is_active', true);

    if (!crisisTemplates || crisisTemplates.length === 0) return [];

    // 2. Load currently active crises for this nation
    const { data: activeCrisisRecords } = await supabase
        .from('active_crises')
        .select('*')
        .eq('nation_id', nation.id);

    const activeMap = {};
    for (const ac of (activeCrisisRecords || [])) {
        activeMap[ac.crisis_id] = ac;
    }

    const crisisEvents = [];
    const nationUpdates = {};
    const statBounds = {}; // { stat_key: { floor: highestFloor, ceiling: lowestCeiling } }

    // Load per-institution funding allocations (written by enactBill funding articles)
    const { data: _fundingAllocRows } = await supabase.from('budget_item_allocations')
        .select('item_id, allocation_amount, needed_amount')
        .eq('nation_id', nation.id)
        .eq('item_type', 'institution')
        .order('created_at', { ascending: true });
    const _fundingMap = {};
    for (const row of (_fundingAllocRows || [])) {
        const needed = Number(row.needed_amount || 0);
        _fundingMap[row.item_id] = needed > 0
            ? Math.min(100, Math.round((Number(row.allocation_amount || 0) / needed) * 100))
            : 100;
    }
    function getInstitutionFundingPct(instId) {
        return _fundingMap[instId] ?? 100;
    }

    // 3. Check inactive crises for activation
    for (const template of crisisTemplates) {
        if (activeMap[template.id]) continue; // already active

        let allTriggersMet = false;

        if (template.crisis_type === 'ministry') {
            // Ministry crisis: check institution funding levels
            const institutionIds = template.institution_ids || [];
            const threshold = Number(template.funding_threshold_pct) || 0;
            if (institutionIds.length === 0) continue;

            allTriggersMet = true;
            for (const instId of institutionIds) {
                const pct = getInstitutionFundingPct(instId);
                if (pct >= threshold) {
                    allTriggersMet = false;
                    break;
                }
            }
        } else {
            // Stat-based crisis: check crisis_triggers
            const triggers = template.crisis_triggers || [];
            if (triggers.length === 0) continue;

            allTriggersMet = true;
            for (const trigger of triggers) {
                const resolvedKey = normalizeNationStatKey(trigger.stat_key) || trigger.stat_key;
                const statValue = nation[resolvedKey];
                if (statValue === null || statValue === undefined) {
                    allTriggersMet = false;
                    break;
                }
                const val = Number(statValue);
                if (trigger.operator === 'gte' && val < Number(trigger.threshold)) {
                    allTriggersMet = false;
                    break;
                }
                if (trigger.operator === 'lte' && val > Number(trigger.threshold)) {
                    allTriggersMet = false;
                    break;
                }
            }
        }

        if (!allTriggersMet) continue;

        // Activate the crisis
        const { data: newActive, error: insertErr } = await supabase
            .from('active_crises')
            .insert({
                crisis_id: template.id,
                nation_id: nation.id,
                started_at_tick: currentTick,
                effects_applied_log: []
            })
            .select()
            .single();

        if (insertErr) {
            console.warn('Crisis activation insert failed:', insertErr.message);
            continue;
        }

        activeMap[template.id] = newActive;

        // Log to event_log
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'CRISIS_STARTED: ' + template.name,
            description_used: template.description || template.name,
            category: 'crisis',
            effects_applied: [],
            fired_at_tick: currentTick
        });

        crisisEvents.push({
            type: 'crisis_started',
            crisisName: template.name,
            description: template.description,
            tick: currentTick
        });

        console.log(`Crisis activated: "${template.name}" in ${nation.name} (tick ${currentTick})`);
    }

    // 4. Process active crises: apply effects first, then check end triggers
    //    (Applying effects before deactivation check prevents crisis flicker when
    //     a crisis's own effects push a stat to exactly the deactivation threshold.)
    for (const template of crisisTemplates) {
        const activeRecord = activeMap[template.id];
        if (!activeRecord) continue;

        // 4a. Idempotency guard: skip if effects already applied for this tick
        const priorLog = activeRecord.effects_applied_log || [];
        if (priorLog.some(entry => entry.tick === currentTick)) {
            console.log(`[processCrises] Skipping "${template.name}" for ${nation.name} — already applied at tick ${currentTick}`);
            continue;
        }

        // 4b. Apply effects every tick
        const effects = template.crisis_effects || [];
        const appliedEffects = [];

        for (const effect of effects) {
            const changePT = Number(effect.change_per_tick);
            if (!Number.isFinite(changePT)) {
                console.warn(`[processCrises] Skipping effect with non-numeric change_per_tick: "${effect.change_per_tick}" in crisis "${template.name}" for ${nation.name}`);
                continue;
            }
            const hasFloor = effect.stat_floor !== null && effect.stat_floor !== undefined;
            const floorVal = hasFloor ? Number(effect.stat_floor) : null;

            // Helper: clamp value respecting the per-effect floor/ceiling (for non-nation targets)
            // Round to 1dp to match processStatEffects and prevent floating-point drift.
            function clampWithFloor(current, raw) {
                if (isNaN(raw) || isNaN(current)) return current ?? 50;
                let v = Math.round(Math.max(0, Math.min(100, raw)) * 10) / 10;
                if (hasFloor) {
                    if (changePT < 0) v = Math.max(floorVal, v);   // floor
                    else if (changePT > 0) v = Math.min(floorVal, v); // ceiling
                }
                return v;
            }

            // Normalize + validate stat_key for nation targets
            const rawStatKey = effect.stat_key;
            const statKey = (effect.target === 'nation') ? normalizeNationStatKey(rawStatKey) : rawStatKey;
            if (effect.target === 'nation' && (!statKey || !NATION_STAT_COLUMN_SET.has(statKey))) {
                console.warn(`[processCrises] Skipping invalid stat_key "${rawStatKey}" in crisis "${template.name}" for ${nation.name}`);
                continue;
            }

            if (effect.target === 'nation') {
                // GDP and debt are driven by dedicated systems — skip
                if (STAT_PROCESSOR_SKIP.has(statKey)) continue;
                const currentVal = nationUpdates[statKey] !== undefined
                    ? nationUpdates[statKey]
                    : (nation[statKey] !== undefined && nation[statKey] !== null
                        ? Number(nation[statKey]) : 50);

                // Raw-value stats (population) must not be clamped to 0-100
                let newVal;
                if (RAW_SCALING_DIVISORS[statKey]) {
                    const scaledCrisisChange = changePT * RAW_SCALING_DIVISORS[statKey];
                    newVal = Math.max(0, currentVal + scaledCrisisChange);
                } else {
                    newVal = Math.round(Math.max(0, Math.min(100, currentVal + changePT)) * 10) / 10;
                }
                nationUpdates[statKey] = newVal;
                nation[statKey] = newVal;

                // Accumulate most-restrictive floor/ceiling bounds for final enforcement
                if (hasFloor) {
                    if (!statBounds[statKey]) statBounds[statKey] = {};
                    if (changePT < 0) {
                        const prev = statBounds[statKey].floor;
                        statBounds[statKey].floor = (prev !== undefined) ? Math.max(prev, floorVal) : floorVal;
                    } else if (changePT > 0) {
                        const prev = statBounds[statKey].ceiling;
                        statBounds[statKey].ceiling = (prev !== undefined) ? Math.min(prev, floorVal) : floorVal;
                    }
                }

                appliedEffects.push({
                    stat: statKey, change: changePT,
                    target: 'nation', old: currentVal, new: newVal
                });

            } else if (effect.target === 'government_approval' || effect.target === 'coalition_approval') {
                const coalition = await fetchActiveCoalition(supabase, nation.id);
                const partyIds = coalition?.party_ids || [];
                for (const partyId of partyIds) {
                    await adjustMomentumAll(supabase, nation.id, partyId, changePT, 'crisis:' + template.name);
                    appliedEffects.push({
                        stat: 'momentum', change: changePT,
                        target: effect.target, faction_id: partyId
                    });
                }
                // Also push to gov approval events component
                await adjustGovernmentApprovalEvent(supabase, nation.id, changePT, 'crisis:' + template.name);

            } else if (effect.target === 'pm_approval') {
                const { data: pmMinistry } = await supabase
                    .from('ministries')
                    .select('minister_approval, party_id')
                    .eq('nation_id', nation.id)
                    .eq('ministry_key', 'prime_minister')
                    .eq('is_active', true)
                    .maybeSingle();

                if (pmMinistry) {
                    const currentVal = pmMinistry.minister_approval ?? 50;
                    const newVal = clampWithFloor(currentVal, currentVal + changePT);
                    const { error: pmUpdErr } = await supabase.from('ministries')
                        .update({ minister_approval: newVal })
                        .eq('nation_id', nation.id)
                        .eq('ministry_key', 'prime_minister')
                        .eq('is_active', true);
                    if (pmUpdErr) console.error(`[processCrises] Failed to update PM approval for ${nation.name}:`, pmUpdErr.message);

                    appliedEffects.push({
                        stat: 'minister_approval', change: changePT,
                        target: 'pm_approval', minister_key: 'prime_minister',
                        old: currentVal, new: newVal
                    });

                    // Cascade PM approval loss to party momentum (2x multiplier)
                    if (changePT < 0 && pmMinistry.party_id) {
                        const cascadeDelta = -(Math.abs(changePT) * 2);
                        await adjustMomentumAll(supabase, nation.id, pmMinistry.party_id, cascadeDelta, 'crisis:pm_cascade:' + template.name);

                        appliedEffects.push({
                            stat: 'momentum', change: cascadeDelta,
                            target: 'minister_cascade', faction_id: pmMinistry.party_id,
                            minister_key: 'prime_minister'
                        });
                    }
                }

            } else if (effect.target === 'minister_approval') {
                const { data: ministry } = await supabase
                    .from('ministries')
                    .select('minister_approval, party_id')
                    .eq('nation_id', nation.id)
                    .eq('ministry_key', effect.minister_key)
                    .eq('is_active', true)
                    .maybeSingle();

                if (ministry) {
                    const currentVal = ministry.minister_approval ?? 50;
                    const newVal = clampWithFloor(currentVal, currentVal + changePT);
                    const { error: minUpdErr } = await supabase.from('ministries')
                        .update({ minister_approval: newVal })
                        .eq('nation_id', nation.id)
                        .eq('ministry_key', effect.minister_key)
                        .eq('is_active', true);
                    if (minUpdErr) console.error(`[processCrises] Failed to update ${effect.minister_key} approval for ${nation.name}:`, minUpdErr.message);

                    appliedEffects.push({
                        stat: 'minister_approval', change: changePT,
                        target: 'minister_approval', minister_key: effect.minister_key,
                        old: currentVal, new: newVal
                    });

                    // Cascade minister approval loss to party momentum (2x for PM, 1x for others)
                    if (changePT < 0 && ministry.party_id) {
                        const loss = Math.abs(changePT);
                        const multiplier = effect.minister_key === 'prime_minister' ? 2 : 1;
                        const cascadeDelta = -(loss * multiplier);
                        await adjustMomentumAll(supabase, nation.id, ministry.party_id, cascadeDelta, 'crisis:minister_cascade:' + effect.minister_key);

                        appliedEffects.push({
                            stat: 'momentum', change: cascadeDelta,
                            target: 'minister_cascade', faction_id: ministry.party_id,
                            minister_key: effect.minister_key
                        });
                    }
                }
            }
        }

        // Update effects log on the active crisis record
        const logEntry = { tick: currentTick, effects: appliedEffects };
        const existingLog = activeRecord.effects_applied_log || [];
        // Keep last 50 entries to prevent unbounded growth
        if (existingLog.length >= 50) existingLog.shift();
        existingLog.push(logEntry);
        await supabase.from('active_crises')
            .update({ effects_applied_log: existingLog })
            .eq('id', activeRecord.id);

        if (appliedEffects.length > 0) {
            crisisEvents.push({
                type: 'crisis_effects',
                crisisName: template.name,
                effects: appliedEffects,
                tick: currentTick
            });
        }

        // 4c. Check end / recovery triggers AFTER effects applied (prevents flicker)
        let allEndConditionsMet = false;

        if (template.crisis_type === 'ministry') {
            // Ministry crisis: resolve when ALL institutions are at/above recovery_threshold_pct
            const institutionIds = template.institution_ids || [];
            const recoveryPct = Number(template.recovery_threshold_pct) || (Number(template.funding_threshold_pct) + 20);
            if (institutionIds.length > 0) {
                allEndConditionsMet = true;
                for (const instId of institutionIds) {
                    const pct = getInstitutionFundingPct(instId);
                    if (pct < recoveryPct) {
                        allEndConditionsMet = false;
                        break;
                    }
                }
            }
        } else {
            // Stat-based crisis: check crisis_end_triggers
            const endTriggers = template.crisis_end_triggers || [];
            allEndConditionsMet = endTriggers.length > 0;

            for (const endTrigger of endTriggers) {
                const resolvedEndKey = normalizeNationStatKey(endTrigger.stat_key) || endTrigger.stat_key;
                const statValue = nation[resolvedEndKey];
                if (statValue === null || statValue === undefined) {
                    allEndConditionsMet = false;
                    break;
                }
                const val = Number(statValue);
                if (endTrigger.operator === 'gte' && val < Number(endTrigger.threshold)) {
                    allEndConditionsMet = false;
                    break;
                }
                if (endTrigger.operator === 'lte' && val > Number(endTrigger.threshold)) {
                    allEndConditionsMet = false;
                    break;
                }
            }
        }

        if (allEndConditionsMet) {
            // Deactivate the crisis (effects already applied this final tick)
            await supabase.from('active_crises').delete().eq('id', activeRecord.id);
            delete activeMap[template.id];

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'CRISIS_RESOLVED: ' + template.name,
                description_used: 'The crisis "' + template.name + '" has been resolved.',
                category: 'crisis',
                effects_applied: [],
                fired_at_tick: currentTick
            });

            crisisEvents.push({
                type: 'crisis_resolved',
                crisisName: template.name,
                duration: currentTick - activeRecord.started_at_tick,
                tick: currentTick
            });

            console.log(`Crisis resolved: "${template.name}" in ${nation.name} (tick ${currentTick}, duration: ${currentTick - activeRecord.started_at_tick} ticks)`);
        }
    }

    // 4d. Enforce most-restrictive floor/ceiling bounds across all crises
    for (const [stat, bounds] of Object.entries(statBounds)) {
        let val = nationUpdates[stat];
        if (val === undefined) continue;
        if (bounds.floor !== undefined) val = Math.max(bounds.floor, val);
        if (bounds.ceiling !== undefined) val = Math.min(bounds.ceiling, val);
        val = Math.round(val * 10) / 10;
        nationUpdates[stat] = val;
        nation[stat] = val;
    }

    // 5. Bulk update nation stats
    if (Object.keys(nationUpdates).length > 0) {
        const { error: crisisUpdateErr } = await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        if (crisisUpdateErr) {
            console.error(`[processCrises] Nation stat update FAILED for ${nation.name}:`, crisisUpdateErr.message, JSON.stringify(nationUpdates));
        } else {
            console.log(`[processCrises] Nation stats updated for ${nation.name}:`, JSON.stringify(nationUpdates));
        }
    }

    return crisisEvents;
}


// ==================== DEMOCRATIC REVOLUTION ====================

/**
 * Process democratic revolution for autocracies.
 * Triggers when: stability < 20, civil_unrest > 50 (Autocracy only).
 * Random 13-22 tick duration. Per-tick: stability -1, civil_unrest +1, intl_reputation -1.
 * Avertable if ANY trigger condition breaks. Fires regime change if duration expires.
 */
async function processRevolution(supabase, nation, currentTick) {
    // Only autocracies can have democratic revolutions
    if (!isAutocracy(nation)) {
        if (nation.revolution_started_tick != null) {
            await supabase.from('nations').update({ revolution_started_tick: null, revolution_duration: null }).eq('id', nation.id);
            nation.revolution_started_tick = null;
            nation.revolution_duration = null;
        }
        return null;
    }

    // Check trigger conditions
    const conditionsMet =
        Number(nation.stability) < 20 &&
        Number(nation.civil_unrest) > 50;

    const crisisActive = nation.revolution_started_tick != null;

    // Conditions NOT met — avert if active
    if (!conditionsMet) {
        if (crisisActive) {
            await supabase.from('nations').update({ revolution_started_tick: null, revolution_duration: null }).eq('id', nation.id);
            nation.revolution_started_tick = null;
            nation.revolution_duration = null;

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'REVOLUTION_AVERTED',
                description_used: 'The revolutionary movement has lost momentum. The regime has stabilized — for now.',
                category: 'crisis',
                effects_applied: [],
                fired_at_tick: currentTick
            });
            console.log(`[Revolution] AVERTED for ${nation.name} at tick ${currentTick}`);
        }
        return null;
    }

    // --- Conditions ARE met ---

    // START new crisis (no per-tick effects on the starting tick)
    if (!crisisActive) {
        const duration = Math.floor(Math.random() * 10) + 13; // 13-22 ticks
        await supabase.from('nations').update({
            revolution_started_tick: currentTick,
            revolution_duration: duration
        }).eq('id', nation.id);
        nation.revolution_started_tick = currentTick;
        nation.revolution_duration = duration;

        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'REVOLUTION_WARNING',
            description_used: 'Pro-democracy demonstrations have erupted across multiple cities. Opposition groups are calling for free elections. The regime must act to restore order — or face revolution.',
            category: 'crisis',
            effects_applied: [],
            fired_at_tick: currentTick
        });
        console.log(`[Revolution] WARNING — crisis started for ${nation.name}, duration ${duration} ticks`);
        return { phase: 'warning', nation: nation.name, tick: currentTick, duration };
    }

    // Apply per-tick effects (stability -1, civil_unrest +1, intl_reputation -1)
    const newStability = Math.max(0, Math.round((Number(nation.stability) - 1) * 10) / 10);
    const newUnrest = Math.min(100, Math.round((Number(nation.civil_unrest) + 1) * 10) / 10);
    const newReputation = Math.max(0, Math.round((Number(nation.international_reputation) - 1) * 10) / 10);

    await supabase.from('nations').update({
        stability: newStability,
        civil_unrest: newUnrest,
        international_reputation: newReputation
    }).eq('id', nation.id);
    Object.assign(nation, { stability: newStability, civil_unrest: newUnrest, international_reputation: newReputation });

    // ONGOING crisis — check if duration expired
    const ticksElapsed = currentTick - nation.revolution_started_tick;
    const duration = Number(nation.revolution_duration);

    if (ticksElapsed < duration) {
        // Not yet expired — log escalation
        const remaining = duration - ticksElapsed;
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'REVOLUTION_ESCALATION',
            description_used: `The revolutionary movement grows stronger. General strikes have paralyzed the capital. International observers are calling for dialogue. ${remaining} tick${remaining !== 1 ? 's' : ''} remain before the regime falls.`,
            category: 'crisis',
            effects_applied: [
                { stat: 'stability', change: -1, target: 'nation' },
                { stat: 'civil_unrest', change: 1, target: 'nation' },
                { stat: 'international_reputation', change: -1, target: 'nation' }
            ],
            fired_at_tick: currentTick
        });
        console.log(`[Revolution] ESCALATION — ${nation.name}, ${remaining} ticks remaining`);
        return { phase: 'escalation', nation: nation.name, tick: currentTick, remaining };
    }

    // === REVOLUTION FIRES ===
    console.log(`[Revolution] REVOLUTION FIRES for ${nation.name} at tick ${currentTick}`);

    // 1. Pick new government type randomly
    const newGovType = Math.random() < 0.5 ? CANONICAL_GOVERNMENT_TYPES.PARLIAMENTARY_DEMOCRACY : CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC;
    const govLabel = newGovType === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC ? 'Presidential Democracy' : 'Parliamentary Democracy';

    // 2. Close current administration and dissolve government/ministries
    try {
        const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        await closeAdministration(supabase, nation.id, nation, 'revolution', currentTick, shardData?.current_date || '', null);
    } catch (err) {
        console.warn('[Revolution] Could not close administration:', err);
    }
    try {
        await dissolveCoalition(supabase, nation.id);
    } catch (err) {
        console.warn('[Revolution] Could not dissolve coalition:', err);
    }

    // 3. Update nation stats
    const newFreedomIndex = Math.min(100, Math.round((Number(nation.freedom_index) + 15) * 10) / 10);
    const newIntlRep = Math.min(100, Math.round((Number(nation.international_reputation) + 5) * 10) / 10);
    const nationUpdates = {
        government_type: newGovType,
        ruling_faction_id: null,
        stability: 30,
        freedom_index: newFreedomIndex,
        civil_unrest: 40,
        international_reputation: newIntlRep,
        revolution_started_tick: null,
        revolution_duration: null
    };
    await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
    Object.assign(nation, nationUpdates);

    // 3b. Clear all active crises — revolution resets the political landscape
    await supabase.from('active_crises').delete().eq('nation_id', nation.id);

    // 4. Reset all faction bloc approvals to 50
    const { data: allFactions } = await supabase
        .from('factions')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (allFactions && allFactions.length > 0) {
        for (const faction of allFactions) {
            await supabase.from('faction_bloc_approval')
                .update({ momentum: 0 })
                .eq('faction_id', faction.id);
            await recalcDerivedApproval(supabase, faction.id);
        }
    }

    // 4b. Reset all faction loyalty to 50 and flag for rebuild
    await supabase.from('factions')
        .update({ loyalty: 50, needs_rebuild: true })
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    // 5. Freeze all active bills — government has fallen
    await supabase.from('bills')
        .update({ status: 'frozen' })
        .eq('nation_id', nation.id)
        .in('status', ['committee', 'floor']);

    // 6. Schedule emergency election in 3 ticks
    await supabase.from('elections').delete()
        .eq('nation_id', nation.id).eq('status', 'scheduled');

    const electionType = newGovType === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC ? 'presidential' : 'parliamentary';
    const { error: electionErr } = await supabase.from('elections').insert({
        nation_id: nation.id,
        election_tick: currentTick + 3,
        status: 'scheduled',
        election_type: electionType
    });
    if (electionErr) {
        console.error('[Revolution] Election insert failed, retrying:', electionErr);
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: currentTick + 3,
            status: 'scheduled',
            election_type: electionType
        });
    }

    // 7. Log the revolution event
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'DEMOCRATIC_REVOLUTION',
        description_used: `The people have risen. The autocratic regime has fallen. A ${govLabel} has been established — emergency elections will determine the first freely elected government.`,
        category: 'crisis',
        effects_applied: [
            { stat: 'government_type', change: `Autocracy → ${govLabel}`, target: 'nation' },
            { stat: 'stability', change: '→ 30', target: 'nation' },
            { stat: 'freedom_index', change: '+15', target: 'nation' },
            { stat: 'civil_unrest', change: '→ 40', target: 'nation' },
            { stat: 'international_reputation', change: '+5', target: 'nation' }
        ],
        fired_at_tick: currentTick
    });

    console.log(`[Revolution] COMPLETE — ${nation.name} is now a ${govLabel}. Emergency ${electionType} election at tick ${currentTick + 3}`);
    return { phase: 'revolution', nation: nation.name, tick: currentTick, newGovType: govLabel, electionTick: currentTick + 3 };
}



// ==================== UTILITY FORMATTERS ====================

function formatStatName(stat) {
    return stat.charAt(0).toUpperCase() + stat.slice(1).replace(/_/g, ' ');
}

function formatMinorSector(key) {
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}


// ==================== PM CANDIDATE SYSTEM ====================

const PM_FIRST_NAMES = [
    'Alejandro', 'Camila', 'Diego', 'Valentina', 'Mateo', 'Isabela', 'Sebastián', 'Luca',
    'Andrés', 'Gabriel', 'Joaquín', 'Mariana', 'Carlos', 'Tomas', 'Rafael', 'Edwin',
    'Emilio', 'Catalina', 'Fernando', 'Renata'
];

const PM_LAST_NAMES = [
    'Velasco', 'Mendoza', 'Guerrero', 'Salazar', 'Castillo', 'Herrera', 'Morales', 'Ríos',
    'Delgado', 'Espinoza', 'Guzmán', 'Navarro', 'Córdoba', 'Echeverría', 'Pacheco', 'Montero',
    'Aguilar', 'Valenzuela', 'Carrasco', 'Ibarra'
];

const IDEOLOGY_OPTIONS = [
    { tag: 'LIBERTY',         axisKey: 'liberty_equality',             direction: -1 },
    { tag: 'EQUALITY',        axisKey: 'liberty_equality',             direction: 1 },
    { tag: 'TRADITION',       axisKey: 'tradition_progress',           direction: -1 },
    { tag: 'PROGRESS',        axisKey: 'tradition_progress',           direction: 1 },
    { tag: 'SECURITY',        axisKey: 'security_freedom',             direction: -1 },
    { tag: 'FREEDOM',         axisKey: 'security_freedom',             direction: 1 },
    { tag: 'NATIONALISM',     axisKey: 'globalism_nationalism',        direction: -1 },
    { tag: 'GLOBALISM',       axisKey: 'globalism_nationalism',        direction: 1 },
    { tag: 'INDIVIDUALISM',   axisKey: 'individualism_collectivism',   direction: -1 },
    { tag: 'COLLECTIVISM',    axisKey: 'individualism_collectivism',   direction: 1 }
];

const PM_TRAIT_KEYS = [
    'dealmaker', 'showman', 'ideologue', 'economist', 'reformer',
    'iron_will', 'popular_champion', 'militarist', 'diplomat',
    'media_darling', 'hardliner', 'technocrat', 'survivor', 'firebrand'
];

async function generatePMCandidates(supabase, nationId, factionId, currentTick) {
    let factionIdeology = await loadFactionIdeology(supabase, factionId);
    if (factionIdeology?._error) factionIdeology = null;

    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('selected', false);

    const weightedIdeologies = getWeightedIdeologies(factionIdeology);

    const chosenIdeologies = [];
    const availableIdeologies = [...weightedIdeologies];
    for (let i = 0; i < 3; i++) {
        const pick = weightedRandomPick(availableIdeologies);
        chosenIdeologies.push(pick.item);
        const sameAxis = availableIdeologies.filter(
            wi => wi.item.axisKey === pick.item.axisKey
        );
        sameAxis.forEach(sa => {
            const idx = availableIdeologies.indexOf(sa);
            if (idx >= 0) availableIdeologies.splice(idx, 1);
        });
    }

    const shuffledTraits = [...PM_TRAIT_KEYS].sort(() => Math.random() - 0.5);
    const chosenTraits = shuffledTraits.slice(0, 3);

    const usedFirstNames = new Set();
    const usedLastNames = new Set();
    const candidates = [];

    for (let i = 0; i < 3; i++) {
        let firstName, lastName;

        do { firstName = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)]; }
        while (usedFirstNames.has(firstName));
        usedFirstNames.add(firstName);

        do { lastName = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)]; }
        while (usedLastNames.has(lastName));
        usedLastNames.add(lastName);

        const age = 35 + Math.floor(Math.random() * 16);
        const ideology = chosenIdeologies[i];

        candidates.push({
            nation_id: nationId,
            faction_id: factionId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            ideology: ideology.tag,
            ideology_axis: ideology.axisKey,
            ideology_direction: ideology.direction,
            trait_key: chosenTraits[i],
            created_at_tick: currentTick,
            selected: false
        });
    }

    const { data, error } = await supabase
        .from('pm_candidates')
        .insert(candidates)
        .select();

    if (error) {
        console.error('Error generating PM candidates:', error);
        throw error;
    }

    console.log(`Generated 3 PM candidates for faction ${factionId}`);
    return data;
}

function getWeightedIdeologies(factionIdeology) {
    if (!factionIdeology) {
        return IDEOLOGY_OPTIONS.map(opt => ({ item: opt, weight: 10 }));
    }

    return IDEOLOGY_OPTIONS.map(opt => {
        const score = factionIdeology[opt.axisKey] || 0;
        const alignment = score * opt.direction;

        let weight;
        if (alignment > 40) {
            weight = 2;
        } else if (alignment > 15) {
            weight = 5;
        } else if (alignment > -15) {
            weight = 12;
        } else if (alignment > -40) {
            weight = 10;
        } else {
            weight = 8;
        }

        return { item: opt, weight };
    });
}

function weightedRandomPick(weightedItems) {
    const totalWeight = weightedItems.reduce((sum, wi) => sum + wi.weight, 0);
    let random = Math.random() * totalWeight;

    for (const wi of weightedItems) {
        random -= wi.weight;
        if (random <= 0) return wi;
    }
    return weightedItems[weightedItems.length - 1];
}

async function selectPMCandidate(supabase, candidateId, nationId, factionId, currentTick) {
    // Guard: coalition must be finalized ('formed') before a PM can be appointed
    const coalition = await fetchActiveCoalition(supabase, nationId);
    if (!coalition || (coalition.status !== 'formed' && coalition.status !== 'caretaker' && coalition._source !== 'presidential')) {
        throw new Error('Cannot appoint a Prime Minister until a coalition has been formed.');
    }

    const { data: candidate, error: fetchErr } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

    if (fetchErr || !candidate) throw new Error('Candidate not found');
    if (candidate.faction_id !== factionId) throw new Error('Not your candidate');

    await supabase
        .from('pm_candidates')
        .update({ selected: true })
        .eq('id', candidateId);

    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('selected', false);

    await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('nation_id', nationId)
        .eq('active', true);

    const { error: hogErr } = await supabase
        .from('head_of_government')
        .upsert({
            nation_id: nationId,
            faction_id: factionId,
            candidate_id: candidateId,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            age: candidate.age,
            ideology: candidate.ideology,
            trait_key: candidate.trait_key,
            appointed_tick: currentTick,
            active: true
        }, { onConflict: 'nation_id' });

    if (hogErr) throw hogErr;

    // Update the open administration record with the newly appointed PM
    const pmFullName = `${candidate.first_name} ${candidate.last_name}`;
    const { error: adminUpdErr } = await supabase
        .from('administrations')
        .update({
            prime_minister: pmFullName,
            admin_name: `${candidate.last_name} Administration`,
            updated_at: new Date().toISOString()
        })
        .eq('nation_id', nationId)
        .is('ended_at_tick', null);
    if (adminUpdErr) console.warn('selectPMCandidate: could not update administration record:', adminUpdErr);

    // Update the prime_minister ministry row so ministry-actions picks it up
    const { data: pmMinistry } = await supabase.from('ministries')
        .select('id').eq('nation_id', nationId)
        .eq('ministry_key', 'prime_minister').eq('is_active', true)
        .maybeSingle();

    // Fetch full nation for stat baselines
    const { data: nationForBaseline } = await supabase.from('nations').select('*').eq('id', nationId).single();
    const pmBaselines = nationForBaseline ? buildMinistryBaselines('prime_minister', nationForBaseline) : {};

    if (pmMinistry) {
        await supabase.from('ministries').update({
            party_id: factionId,
            minister_first_name: candidate.first_name,
            minister_last_name: candidate.last_name,
            minister_age: candidate.age,
            minister_approval: 50,
            stat_baselines: pmBaselines
        }).eq('id', pmMinistry.id);
    } else {
        await supabase.from('ministries').insert({
            nation_id: nationId,
            ministry_key: 'prime_minister',
            ministry_name: 'Prime Minister',
            is_active: true,
            party_id: factionId,
            minister_first_name: candidate.first_name,
            minister_last_name: candidate.last_name,
            minister_age: candidate.age,
            minister_approval: 50,
            stat_baselines: pmBaselines
        });
    }

    const axisKey = candidate.ideology_axis;
    const shift = 15 * candidate.ideology_direction;

    let factionIdeology = await loadFactionIdeology(supabase, factionId);
    if (factionIdeology?._error) factionIdeology = null;
    if (factionIdeology) {
        const currentVal = factionIdeology[axisKey] || 0;
        const newVal = Math.max(-100, Math.min(100, currentVal + shift));

        await supabase
            .from('faction_ideology')
            .update({ [axisKey]: newVal })
            .eq('faction_id', factionId);

        console.log(`Ideology shift: ${axisKey} ${currentVal} → ${newVal} (${shift > 0 ? '+' : ''}${shift})`);
    }


    const { data: trait } = await supabase
        .from('leader_traits')
        .select('*')
        .eq('trait_key', candidate.trait_key)
        .single();

    if (trait?.effects) {
        const effects = trait.effects;

        if (effects.on_appoint_stability) {
            const { data: nation } = await supabase
                .from('nations')
                .select('stability')
                .eq('id', nationId)
                .single();

            if (nation) {
                const newStability = Math.max(0, Math.min(100, (nation.stability || 50) + effects.on_appoint_stability));
                await supabase
                    .from('nations')
                    .update({ stability: newStability })
                    .eq('id', nationId);

                console.log(`On-appoint stability: +${effects.on_appoint_stability} → ${newStability}`);
            }
        }

    }

    console.log(`PM selected: ${candidate.first_name} ${candidate.last_name} (${candidate.trait_key})`);
    return candidate;
}

/**
 * Auto-appoint the party leader as Prime Minister without candidate selection.
 * Used for parliamentary systems — the party leader becomes PM immediately
 * when their party receives the PM role during coalition formation.
 */
async function autoAppointPartyLeaderAsPM(supabase, nationId, factionId, currentTick) {
    const coalition = await fetchActiveCoalition(supabase, nationId);
    if (!coalition || (coalition.status !== 'formed' && coalition.status !== 'caretaker')) {
        throw new Error('Cannot appoint a Prime Minister until a coalition has been formed.');
    }

    // Load faction with leader data
    const { data: faction, error: factionErr } = await supabase
        .from('factions')
        .select('id, faction_name, leader_first_name, leader_last_name, leader_age')
        .eq('id', factionId)
        .single();
    if (factionErr || !faction) throw new Error('Faction not found');
    if (!faction.leader_first_name || !faction.leader_last_name) {
        throw new Error('Party leader data is incomplete — cannot auto-appoint PM.');
    }

    // Pick a weighted ideology based on faction's ideology profile
    let factionIdeology = await loadFactionIdeology(supabase, factionId);
    if (factionIdeology?._error) {
        console.error(`[autoAppointPartyLeaderAsPM] DB error loading ideology for ${factionId}, using neutral weights`);
        factionIdeology = null;
    }
    const weightedIdeologies = getWeightedIdeologies(factionIdeology);
    const ideologyPick = weightedRandomPick(weightedIdeologies);
    const ideology = ideologyPick.item;

    // Pick a random trait
    const traitKey = PM_TRAIT_KEYS[Math.floor(Math.random() * PM_TRAIT_KEYS.length)];

    const leaderAge = faction.leader_age || (35 + Math.floor(Math.random() * 16));

    // Clean up any existing PM candidates for this faction
    await supabase.from('pm_candidates').delete()
        .eq('nation_id', nationId).eq('faction_id', factionId).eq('selected', false);

    // Deactivate any current HOG
    await supabase.from('head_of_government')
        .update({ active: false })
        .eq('nation_id', nationId).eq('active', true);

    // Create HOG record
    const { error: hogErr } = await supabase
        .from('head_of_government')
        .upsert({
            nation_id: nationId,
            faction_id: factionId,
            candidate_id: null,
            first_name: faction.leader_first_name,
            last_name: faction.leader_last_name,
            age: leaderAge,
            ideology: ideology.tag,
            trait_key: traitKey,
            appointed_tick: currentTick,
            active: true
        }, { onConflict: 'nation_id' });
    if (hogErr) throw hogErr;

    // Update administration record
    const pmFullName = `${faction.leader_first_name} ${faction.leader_last_name}`;
    await supabase.from('administrations').update({
        prime_minister: pmFullName,
        admin_name: `${faction.leader_last_name} Administration`,
        updated_at: new Date().toISOString()
    }).eq('nation_id', nationId).is('ended_at_tick', null);

    // Update/create PM ministry row
    const { data: pmMinistry } = await supabase.from('ministries')
        .select('id').eq('nation_id', nationId)
        .eq('ministry_key', 'prime_minister').eq('is_active', true)
        .maybeSingle();

    const { data: nationForBaseline } = await supabase.from('nations').select('*').eq('id', nationId).single();
    const pmBaselines = nationForBaseline ? buildMinistryBaselines('prime_minister', nationForBaseline) : {};

    if (pmMinistry) {
        await supabase.from('ministries').update({
            party_id: factionId,
            minister_first_name: faction.leader_first_name,
            minister_last_name: faction.leader_last_name,
            minister_age: leaderAge,
            minister_approval: 50,
            stat_baselines: pmBaselines
        }).eq('id', pmMinistry.id);
    } else {
        await supabase.from('ministries').insert({
            nation_id: nationId,
            ministry_key: 'prime_minister',
            ministry_name: 'Prime Minister',
            is_active: true,
            party_id: factionId,
            minister_first_name: faction.leader_first_name,
            minister_last_name: faction.leader_last_name,
            minister_age: leaderAge,
            minister_approval: 50,
            stat_baselines: pmBaselines
        });
    }

    // Apply ideology shift (+5 for PM, same as original selectPMCandidate uses +15 via candidate)
    const axisKey = ideology.axisKey;
    const shift = 5 * ideology.direction;

    if (factionIdeology) {
        const currentVal = factionIdeology[axisKey] || 0;
        const newVal = Math.max(-100, Math.min(100, currentVal + shift));
        await supabase.from('faction_ideology').update({ [axisKey]: newVal }).eq('faction_id', factionId);
    }

    // Apply trait effects
    const { data: trait } = await supabase.from('leader_traits').select('*').eq('trait_key', traitKey).single();
    if (trait?.effects?.on_appoint_stability && nationForBaseline) {
        const newStability = Math.max(0, Math.min(100, (nationForBaseline.stability || 50) + trait.effects.on_appoint_stability));
        await supabase.from('nations').update({ stability: newStability }).eq('id', nationId);
    }

    // Fire system event
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'pm_appointed',
            p_nation_id: nationId,
            p_tick: currentTick,
            p_placeholders: {
                nation: nationForBaseline?.name || '',
                pm_name: pmFullName,
                party: faction.faction_name,
                trait: trait?.trait_name || traitKey
            }
        });
    } catch (e) { console.warn('PM appointed event fire failed (non-blocking):', e); }

    console.log(`Auto-appointed party leader as PM: ${pmFullName} (${traitKey}) for faction ${factionId}`);
    return { first_name: faction.leader_first_name, last_name: faction.leader_last_name, age: leaderAge, ideology: ideology.tag, trait_key: traitKey };
}

async function processPMTraitEffects(supabase, nation, currentTick) {
    let effects, factionId;

    if (isPresidentialRepublic(nation)) {
        // For presidential systems, use the active president's trait
        const { data: president } = await supabase
            .from('presidents')
            .select('faction_id, trait')
            .eq('nation_id', nation.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (!president?.trait) return;

        const { data: traitData } = await supabase
            .from('leader_traits')
            .select('effects')
            .eq('trait_key', president.trait)
            .single();

        if (!traitData?.effects) return;
        effects = traitData.effects;
        factionId = president.faction_id;
    } else {
        const { data: hog } = await supabase
            .from('head_of_government')
            .select('*, leader_traits(*)')
            .eq('nation_id', nation.id)
            .eq('active', true)
            .single();

        if (!hog || !hog.leader_traits?.effects) return;
        effects = hog.leader_traits.effects;
        factionId = hog.faction_id;
    }

    if (effects.party_approval_per_tick) {
        await adjustMomentumAll(supabase, nation.id, factionId, effects.party_approval_per_tick, 'pm_trait:party_approval');
    }

    if (effects.nation_stat_per_tick) {
        const updates = {};
        for (const [rawStat, delta] of Object.entries(effects.nation_stat_per_tick)) {
            const stat = normalizeNationStatKey(rawStat);
            if (!stat || !NATION_STAT_COLUMN_SET.has(stat)) {
                console.warn(`[processPMTraitEffects] Skipping invalid stat_key "${rawStat}" in PM trait for ${nation.name}`);
                continue;
            }
            // GDP and debt are driven by dedicated systems — skip
            if (STAT_PROCESSOR_SKIP.has(stat)) continue;
            const currentVal = nation[stat];
            if (currentVal !== undefined && currentVal !== null) {
                if (RAW_SCALING_DIVISORS[stat]) {
                    // Raw-value stats (population): scale rate and don't clamp to 0-100
                    updates[stat] = Math.max(0, Number(currentVal) + delta * RAW_SCALING_DIVISORS[stat]);
                } else {
                    updates[stat] = Math.round(Math.max(0, Math.min(100, Number(currentVal) + delta)) * 10) / 10;
                }
            }
        }
        if (Object.keys(updates).length > 0) {
            await supabase.from('nations').update(updates).eq('id', nation.id);
        }
    }

    if (effects.approval_below_50_bonus || effects.approval_above_60_penalty) {
        const { data: faction } = await supabase
            .from('factions')
            .select('approval_rating')
            .eq('id', factionId)
            .single();

        if (faction) {
            let delta = 0;
            if (faction.approval_rating < 40 && effects.approval_below_50_bonus) {
                delta = effects.approval_below_50_bonus;
            } else if (faction.approval_rating > 50 && effects.approval_above_60_penalty) {
                delta = effects.approval_above_60_penalty;
            }
            if (delta !== 0) {
                await adjustMomentumAll(supabase, nation.id, factionId, delta, 'pm_trait:conditional');
            }
        }
    }

    if (effects.opposition_approval_per_tick) {
        const { data: oppParties } = await supabase
            .from('factions')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .neq('id', factionId);

        for (const opp of (oppParties || [])) {
            await adjustMomentumAll(supabase, nation.id, opp.id, effects.opposition_approval_per_tick, 'pm_trait:opposition');
        }
    }

    if (effects.no_bill_penalty_per_tick) {
        const { count } = await supabase
            .from('bills')
            .select('*', { count: 'exact', head: true })
            .eq('nation_id', nation.id)
            .eq('proposed_by', factionId)
            .eq('status', 'passed')
            .eq('passed_tick', currentTick - 1);

        if (!count || count === 0) {
            await adjustMomentumAll(supabase, nation.id, factionId, effects.no_bill_penalty_per_tick, 'pm_trait:no_bill_penalty');
        }
    }
}


// ==================== RESIGN PM ====================

async function resignPM(supabase, nationId, factionId, currentTick) {
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('*')
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('active', true)
        .single();

    if (!hog) throw new Error('No active PM to resign');

    if (hog.trait_key === 'survivor') {
        throw new Error('A Survivor cannot resign. They cling to power.');
    }

    await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('id', hog.id);

    await adjustMomentumAll(supabase, nationId, factionId, -5, 'pm:resignation');

    const { data: nation } = await supabase
        .from('nations')
        .select('stability')
        .eq('id', nationId)
        .single();

    if (nation) {
        const newStability = Math.max(0, (nation.stability ?? 50) - 3);
        await supabase
            .from('nations')
            .update({ stability: newStability })
            .eq('id', nationId);
    }

    await supabase
        .from('factions')
        .update({ pm_cooldown_until: currentTick + 12 })
        .eq('id', factionId);

    if (hog.trait_key === 'iron_will') {
        console.log('Iron Will resignation — coalition collapses');
        try {
            const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
            const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
            if (fullNation) {
                await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || '', null);
            }
        } catch (adminErr) { console.warn('Could not close administration on iron_will collapse:', adminErr); }
        await dissolveCoalition(supabase, nationId);
        return { result: 'coalition_collapsed', reason: 'iron_will' };
    }

    const { data: govFormation } = await supabase
        .from('government_formations')
        .select('party_ids')
        .eq('nation_id', nationId)
        .eq('status', 'formed')
        .single();

    if (govFormation) {
        const partnerIds = (govFormation.party_ids || [])
            .filter(pid => pid !== factionId);

        const { data: partners } = await supabase
            .from('factions')
            .select('id, faction_name, seats, pm_cooldown_until')
            .in('id', partnerIds)
            .order('seats', { ascending: false });

        const eligible = (partners || []).find(p =>
            !p.pm_cooldown_until || p.pm_cooldown_until <= currentTick
        );

        if (eligible) {
            await autoAppointPartyLeaderAsPM(supabase, nationId, eligible.id, currentTick);
            console.log(`PM auto-appointed to ${eligible.faction_name} leader`);
            return {
                result: 'pm_appointed',
                newPmPartyId: eligible.id,
                newPmPartyName: eligible.faction_name
            };
        }
    }

    console.log('No eligible partner — coalition collapsed');
    try {
        const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
        const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        if (fullNation) {
            await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || '', null);
        }
    } catch (adminErr) { console.warn('Could not close administration on coalition collapse:', adminErr); }
    await dissolveCoalition(supabase, nationId);
    return { result: 'coalition_collapsed', reason: 'no_eligible_partner' };
}


// ==================== DISBAND PARTY ====================

async function disbandParty(supabase, nationId, factionId, currentTick) {
    // 1. Cooldown check
    const { data: faction } = await supabase
        .from('factions')
        .select('disband_cooldown_until_tick, faction_name')
        .eq('id', factionId)
        .single();

    if (faction?.disband_cooldown_until_tick && faction.disband_cooldown_until_tick > currentTick) {
        const remaining = faction.disband_cooldown_until_tick - currentTick;
        throw new Error(`Disband is on cooldown for ${remaining} more tick${remaining !== 1 ? 's' : ''}.`);
    }

    // 2. Fetch nation for autocracy/ruling checks + seat redistribution
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, ruling_faction_id, government_type, total_seats')
        .eq('id', nationId)
        .single();

    // 2b. Autocracy ruling faction succession — transfer power to next most loyal faction
    if (isAutocracy(nation) && nation.ruling_faction_id === factionId) {
        const { data: otherFactions } = await supabase
            .from('factions')
            .select('id, loyalty')
            .eq('nation_id', nationId)
            .eq('faction_type', 'party')
            .neq('id', factionId)
            .order('loyalty', { ascending: false })
            .limit(1);

        const successor = otherFactions?.[0];
        if (successor) {
            await supabase.from('nations')
                .update({ ruling_faction_id: successor.id })
                .eq('id', nationId);
        } else {
            // No other factions — clear ruling faction
            await supabase.from('nations')
                .update({ ruling_faction_id: null })
                .eq('id', nationId);
        }
    }

    // 2c. Autocracy: clean up departing faction's steward and pillar (ruling or non-ruling)
    if (isAutocracy(nation)) {
        await supabase.from('stewards')
            .update({ is_alive: false })
            .eq('nation_id', nationId)
            .eq('faction_id', factionId);
        await supabase.from('regime_pillars')
            .update({ steward_faction_id: null })
            .eq('nation_id', nationId)
            .eq('steward_faction_id', factionId);
    }

    // 3. PM check — if this faction is the active PM, resign first
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('id, trait_key')
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('active', true)
        .maybeSingle();

    let pmResigned = false;
    if (hog) {
        if (hog.trait_key === 'survivor') {
            throw new Error('Cannot disband while your PM has the Survivor trait. They cling to power.');
        }
        await resignPM(supabase, nationId, factionId, currentTick);
        pmResigned = true;
    }

    // 4. Coalition check — handle if in coalition but not PM (or PM resignation didn't dissolve)
    if (!pmResigned) {
        const { data: formations } = await supabase
            .from('government_formations')
            .select('id, lead_party_id, party_ids')
            .eq('nation_id', nationId)
            .in('status', ['formed', 'caretaker']);

        const myFormation = (formations || []).find(f =>
            (f.party_ids || []).includes(factionId)
        );

        if (myFormation) {
            if (myFormation.lead_party_id === factionId) {
                // Lead party disbanding — dissolve entire coalition
                await dissolveCoalition(supabase, nationId);
            } else {
                // Junior partner — remove from party_ids and vacate ministries
                const newPartyIds = (myFormation.party_ids || []).filter(id => id !== factionId);
                const { error: formErr } = await supabase
                    .from('government_formations')
                    .update({ party_ids: newPartyIds })
                    .eq('id', myFormation.id);
                if (formErr) console.warn('disbandParty: could not update formation party_ids:', formErr);

                const { error: minErr } = await supabase
                    .from('ministries')
                    .update({ party_id: null, minister_first_name: null, minister_last_name: null, minister_age: null })
                    .eq('nation_id', nationId)
                    .eq('party_id', factionId)
                    .eq('is_active', true);
                if (minErr) console.warn('disbandParty: could not vacate ministries:', minErr);
            }
        }
    }

    // 5. Zero seats and redistribute to remaining parties
    const { data: dyingFaction } = await supabase
        .from('factions').select('seats').eq('id', factionId).single();
    const vacatedSeats = dyingFaction?.seats || 0;

    await supabase.from('factions')
        .update({ seats: 0 })
        .eq('id', factionId);

    // 6. Immediately redistribute vacated seats to remaining parties
    if (nation && vacatedSeats > 0) {
        if (isAutocracy(nation)) {
            // Autocracy: give all vacated seats to ruling faction
            const rulingId = nation.ruling_faction_id;
            if (rulingId && rulingId !== factionId) {
                const { data: ruler } = await supabase
                    .from('factions').select('seats').eq('id', rulingId).single();
                await supabase.from('factions')
                    .update({ seats: (ruler?.seats || 0) + vacatedSeats })
                    .eq('id', rulingId);
            }
        } else {
            await rebalanceVacantSeats(supabase, nation);
        }
    }

    // 7. Core disband — null out nation_id, reset all stats to fresh defaults
    const { error: disbandErr } = await supabase
        .from('factions')
        .update({
            nation_id: null,
            abandoned_at: new Date().toISOString(),
            disband_cooldown_until_tick: currentTick + 24,
            action_points: 0,
            approval_rating: null,
            last_seen_tick: null,
            founded_tick: null
        })
        .eq('id', factionId);

    if (disbandErr) throw new Error('Failed to disband party: ' + disbandErr.message);

    // 8. Fail any open bills proposed by this faction (they lose their sponsor)
    const { data: orphanedBills } = await supabase
        .from('bills')
        .select('id, bill_name, bill_type, ambassador_id')
        .eq('nation_id', nationId)
        .eq('proposed_by', factionId)
        .in('status', ['committee', 'floor']);
    if (orphanedBills && orphanedBills.length > 0) {
        for (const bill of orphanedBills) {
            await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id);
            // Reject any pending ambassadors from failed confirmation bills
            if (bill.bill_type === 'confirmation' && bill.ambassador_id) {
                await supabase.from('ambassadors').update({ status: 'rejected', is_active: false }).eq('id', bill.ambassador_id);
            }
            console.log(`[disbandParty] Failed orphaned bill "${bill.bill_name}" (proposed by disbanded faction)`);
        }
    }

    // 9. Audit log (before cleanup so the insert isn't immediately deleted)
    const { error: logErr } = await supabase
        .from('campaign_actions')
        .insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'party_disbanded',
            tick_performed: currentTick,
            result: { faction_name: faction?.faction_name || 'Unknown' }
        });
    if (logErr) console.warn('disbandParty: could not log action:', logErr);

    // 10. Clean up all faction-related data from the old nation
    await supabase.from('faction_bloc_approval').delete().eq('faction_id', factionId);
    await supabase.from('faction_ideology').delete().eq('faction_id', factionId);
    await supabase.from('ideology_history').delete().eq('faction_id', factionId);
    await supabase.from('momentum_log').delete().eq('faction_id', factionId);
    await supabase.from('fundraiser_promises').delete().eq('party_id', factionId);
    await supabase.from('donor_trust').delete().eq('party_id', factionId);
    await supabase.from('bill_support').delete().eq('faction_id', factionId);
    await supabase.from('campaign_actions').delete().eq('party_id', factionId).neq('action_type', 'party_disbanded');
    await supabase.from('faction_coalitions').delete().eq('faction_a_id', factionId);
    await supabase.from('faction_coalitions').delete().eq('faction_b_id', factionId);
    await supabase.from('loyalty_demands').delete().eq('strongman_faction_id', factionId);
    await supabase.from('loyalty_demands').delete().eq('target_faction_id', factionId);

    return { result: 'disbanded' };
}


// ==================== APPOINT SUCCESSOR ====================

/**
 * Appoint a successor. Strongman-only, 9 AP.
 *
 * Two modes:
 *  - targetFactionId !== strongmanFactionId: Appoint a steward as Chosen Successor.
 *    Effects: target pillar +30, stability +7, rivals loyalty -10 / coup_readiness +5.
 *  - targetFactionId === strongmanFactionId: Appoint a Close Family Member.
 *    Effects: stability +1, all stewards coup_readiness +7, all pillars -5, -1 AP/tick ongoing.
 *
 * Both modes set a 60-tick cooldown on further appointments.
 */
async function executeAppointSuccessor(supabase, nationId, strongmanFactionId, targetFactionId, currentTick) {
    // 1. Validate: caller is ruling faction
    const { data: nation } = await supabase
        .from('nations').select('id, ruling_faction_id, stability, successor_cooldown_end_tick')
        .eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };
    if (nation.ruling_faction_id !== strongmanFactionId) return { success: false, error: 'Only the Strongman can appoint a successor.' };

    // 2. Check cooldown
    if (nation.successor_cooldown_end_tick && currentTick < nation.successor_cooldown_end_tick) {
        return { success: false, error: `Appointment on cooldown. ${nation.successor_cooldown_end_tick - currentTick} ticks remaining.` };
    }

    const isFamilyMember = targetFactionId === strongmanFactionId;

    // 3. For steward appointment: validate target has a living steward
    let targetSteward = null;
    if (!isFamilyMember) {
        const { data: ts } = await supabase
            .from('stewards')
            .select('id, first_name, last_name, pillar_key, steward_type, is_chosen_successor')
            .eq('faction_id', targetFactionId)
            .eq('nation_id', nationId)
            .eq('is_alive', true)
            .single();
        if (!ts) return { success: false, error: 'Target faction has no living steward.' };
        targetSteward = ts;
    }

    // 4. Deduct AP
    const apResult = await deductAP(supabase, strongmanFactionId, SUCCESSOR_CONFIG.AP_COST);
    if (!apResult.success) return { success: false, error: 'Not enough AP.' };

    // 5. Clear any existing successor (steward-based)
    await supabase.from('stewards').update({
        is_chosen_successor: false,
        succession_strength: 0,
        successor_appointed_tick: null,
    }).eq('nation_id', nationId).eq('is_chosen_successor', true);

    if (isFamilyMember) {
        // === FAMILY MEMBER PATH ===
        // 6a. Set nation flags
        const newStability = Math.min(100, Number(nation.stability ?? 50) + SUCCESSOR_CONFIG.FAMILY_STABILITY_BOOST);
        await supabase.from('nations').update({
            stability: newStability,
            successor_cooldown_end_tick: currentTick + SUCCESSOR_CONFIG.COOLDOWN_TICKS,
            successor_is_family_member: true,
        }).eq('id', nationId);

        // 7a. All stewards: coup_readiness +7
        await adjustStewardsCoupReadiness(supabase, nationId, SUCCESSOR_CONFIG.FAMILY_COUP_READINESS);

        // 8a. All regime pillars: -5 support
        const { data: pillars } = await supabase
            .from('regime_pillars').select('id, support')
            .eq('nation_id', nationId);
        for (const p of (pillars || [])) {
            const newSupport = Math.max(0, (p.support ?? 50) - SUCCESSOR_CONFIG.FAMILY_PILLAR_PENALTY);
            await supabase.from('regime_pillars').update({ support: newSupport }).eq('id', p.id);
        }

        // 9a. Log
        await supabase.from('campaign_actions').insert({
            party_id: strongmanFactionId,
            nation_id: nationId,
            action_type: 'appoint_successor',
            tick_performed: currentTick,
            result: {
                successor_name: 'Close Family Member',
                is_family_member: true,
                stability_gain: SUCCESSOR_CONFIG.FAMILY_STABILITY_BOOST,
                pillar_penalty: SUCCESSOR_CONFIG.FAMILY_PILLAR_PENALTY,
                coup_readiness_gain: SUCCESSOR_CONFIG.FAMILY_COUP_READINESS,
            },
        });

        return { success: true, newAp: apResult.newAp, successorName: 'Close Family Member', isFamilyMember: true };
    }

    // === STEWARD PATH ===
    // 6b. Set target steward as chosen successor
    await supabase.from('stewards').update({
        is_chosen_successor: true,
        successor_appointed_tick: currentTick,
        succession_strength: 0,
    }).eq('id', targetSteward.id);

    // Clear family member flag if it was set
    await supabase.from('nations').update({ successor_is_family_member: false }).eq('id', nationId);

    // 7b. Boost target's pillar support +30 (capped at 100)
    const { data: targetPillar } = await supabase
        .from('regime_pillars')
        .select('id, support')
        .eq('nation_id', nationId)
        .eq('pillar_key', targetSteward.pillar_key)
        .single();
    if (targetPillar) {
        const newSupport = Math.min(100, (targetPillar.support ?? 50) + SUCCESSOR_CONFIG.PILLAR_BOOST);
        await supabase.from('regime_pillars').update({ support: newSupport }).eq('id', targetPillar.id);
    }

    // 8b. Stability +7 (capped at 100)
    const newStability = Math.min(100, Number(nation.stability ?? 50) + SUCCESSOR_CONFIG.STABILITY_BOOST);
    await supabase.from('nations').update({
        stability: newStability,
        successor_cooldown_end_tick: currentTick + SUCCESSOR_CONFIG.COOLDOWN_TICKS,
    }).eq('id', nationId);

    // 9b. All OTHER factions (not target, not strongman): loyalty -10, steward coup_readiness +5
    const { data: otherFactions } = await supabase
        .from('factions')
        .select('id, loyalty')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party')
        .neq('id', strongmanFactionId)
        .neq('id', targetFactionId);

    for (const f of (otherFactions || [])) {
        const newLoy = Math.max(0, (f.loyalty ?? 50) - SUCCESSOR_CONFIG.OTHER_LOYALTY_DROP);
        await supabase.from('factions').update({ loyalty: newLoy }).eq('id', f.id);

        // Boost their steward's coup_readiness
        const { data: otherSteward } = await supabase
            .from('stewards').select('id, coup_readiness')
            .eq('faction_id', f.id).eq('nation_id', nationId).eq('is_alive', true).single();
        if (otherSteward) {
            const newCR = Math.min(100, (otherSteward.coup_readiness ?? 0) + SUCCESSOR_CONFIG.OTHER_COUP_READINESS);
            await supabase.from('stewards').update({ coup_readiness: newCR }).eq('id', otherSteward.id);
        }
    }

    // 10b. Log
    const successorName = `${targetSteward.first_name} ${targetSteward.last_name}`;
    await supabase.from('campaign_actions').insert({
        party_id: strongmanFactionId,
        nation_id: nationId,
        action_type: 'appoint_successor',
        tick_performed: currentTick,
        result: {
            successor_name: successorName,
            successor_steward_id: targetSteward.id,
            successor_faction_id: targetFactionId,
            stability_gain: SUCCESSOR_CONFIG.STABILITY_BOOST,
            pillar_boost: SUCCESSOR_CONFIG.PILLAR_BOOST,
        },
    });

    return { success: true, newAp: apResult.newAp, successorName };
}

/**
 * Revoke the current Chosen Successor (steward or family member). Strongman-only, free (no AP cost).
 * Effects: stability -5, former successor faction loyalty -20, all stewards coup_readiness +3.
 * For family member: just stability -5, coup_readiness +3, and clears the flag (restores AP).
 * Cooldown from original appointment persists.
 */
async function executeRevokeSuccessor(supabase, nationId, strongmanFactionId, currentTick) {
    const { data: nation } = await supabase
        .from('nations').select('id, ruling_faction_id, stability, successor_is_family_member')
        .eq('id', nationId).single();
    if (!nation) return { success: false, error: 'Nation not found.' };
    if (nation.ruling_faction_id !== strongmanFactionId) return { success: false, error: 'Only the Strongman can revoke.' };

    const isFamilyRevoke = nation.successor_is_family_member;

    if (!isFamilyRevoke) {
        // Find the current steward successor
        const { data: currentSuccessor } = await supabase
            .from('stewards')
            .select('id, faction_id, first_name, last_name')
            .eq('nation_id', nationId)
            .eq('is_chosen_successor', true)
            .eq('is_alive', true)
            .maybeSingle();
        if (!currentSuccessor) return { success: false, error: 'No successor to revoke.' };

        // Clear successor tag
        await supabase.from('stewards').update({
            is_chosen_successor: false,
            succession_strength: 0,
            successor_appointed_tick: null,
        }).eq('id', currentSuccessor.id);

        // Former successor's faction: loyalty -20
        const { data: formerFaction } = await supabase.from('factions').select('id, loyalty').eq('id', currentSuccessor.faction_id).single();
        if (formerFaction) {
            const newLoy = Math.max(0, (formerFaction.loyalty ?? 50) - SUCCESSOR_CONFIG.REVOKE_LOYALTY_DROP);
            await supabase.from('factions').update({ loyalty: newLoy }).eq('id', formerFaction.id);
        }

        // Log
        const revokedName = `${currentSuccessor.first_name} ${currentSuccessor.last_name}`;
        await supabase.from('campaign_actions').insert({
            party_id: strongmanFactionId,
            nation_id: nationId,
            action_type: 'revoke_successor',
            tick_performed: currentTick,
            result: {
                revoked_name: revokedName,
                revoked_faction_id: currentSuccessor.faction_id,
            },
        });
    } else {
        // Family member revocation — clear the flag (this also restores AP generation)
        await supabase.from('nations').update({ successor_is_family_member: false }).eq('id', nationId);

        await supabase.from('campaign_actions').insert({
            party_id: strongmanFactionId,
            nation_id: nationId,
            action_type: 'revoke_successor',
            tick_performed: currentTick,
            result: {
                revoked_name: 'Close Family Member',
                is_family_member: true,
            },
        });
    }

    // Stability -5
    const newStability = Math.max(0, Number(nation.stability ?? 50) - SUCCESSOR_CONFIG.REVOKE_STABILITY_DROP);
    await supabase.from('nations').update({ stability: newStability }).eq('id', nationId);

    // All stewards: coup_readiness +3
    await adjustStewardsCoupReadiness(supabase, nationId, SUCCESSOR_CONFIG.REVOKE_COUP_READINESS);

    return { success: true, revokedName: isFamilyRevoke ? 'Close Family Member' : undefined };
}

// ==================== DYNASTY ACTIONS ====================

/**
 * Execute a Dynasty action. Available only to factions whose steward is the Chosen Successor.
 * Three modes: 'shadow', 'cultivate_image', 'prepare_succession'. Each costs 1 AP.
 */
async function executeDynastyAction(supabase, nationId, factionId, mode, targetFactionId, currentTick) {
    // 1. Validate: caller's steward is the chosen successor
    const { data: mySteward } = await supabase
        .from('stewards')
        .select('id, first_name, last_name, is_chosen_successor, succession_strength, exit_readiness, standing')
        .eq('faction_id', factionId)
        .eq('nation_id', nationId)
        .eq('is_alive', true)
        .single();
    if (!mySteward || !mySteward.is_chosen_successor) {
        return { success: false, error: 'Only the Chosen Successor can use Dynasty actions.' };
    }

    // 2. Validate mode
    if (!['shadow', 'cultivate_image', 'prepare_succession'].includes(mode)) {
        return { success: false, error: 'Invalid dynasty mode.' };
    }

    // 3. Deduct AP
    const apResult = await deductAP(supabase, factionId, SUCCESSOR_CONFIG.DYNASTY_AP_COST);
    if (!apResult.success) return { success: false, error: 'Not enough AP.' };

    const result = { mode, newAp: apResult.newAp };

    if (mode === 'shadow') {
        // Requires a target faction
        if (!targetFactionId) return { success: false, error: 'Shadow requires a target faction.' };

        const { data: targetSteward } = await supabase
            .from('stewards')
            .select('id, first_name, last_name, true_loyalty, faction_id')
            .eq('faction_id', targetFactionId)
            .eq('nation_id', nationId)
            .eq('is_alive', true)
            .single();
        if (!targetSteward) return { success: false, error: 'Target faction has no living steward.' };

        // Reveal true loyalty
        result.targetName = `${targetSteward.first_name} ${targetSteward.last_name}`;
        result.trueLoyalty = targetSteward.true_loyalty;

        // Succession strength +3
        const newSS = (mySteward.succession_strength ?? 0) + SUCCESSOR_CONFIG.DYNASTY_SHADOW_SUCCESSION_STRENGTH;
        await supabase.from('stewards').update({ succession_strength: newSS }).eq('id', mySteward.id);
        result.successionStrengthGain = SUCCESSOR_CONFIG.DYNASTY_SHADOW_SUCCESSION_STRENGTH;

        await supabase.from('campaign_actions').insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'dynasty_shadow',
            tick_performed: currentTick,
            result: {
                target_faction_id: targetFactionId,
                target_name: result.targetName,
                true_loyalty: result.trueLoyalty,
                succession_strength_gain: SUCCESSOR_CONFIG.DYNASTY_SHADOW_SUCCESSION_STRENGTH,
            },
        });

    } else if (mode === 'cultivate_image') {
        // Nation legitimacy +1
        const { data: nationRow } = await supabase.from('nations').select('legitimacy').eq('id', nationId).single();
        const newLeg = Math.min(100, Number(nationRow?.legitimacy ?? 50) + SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_LEGITIMACY);
        await supabase.from('nations').update({ legitimacy: newLeg }).eq('id', nationId);

        // Succession strength +5
        const newSS = (mySteward.succession_strength ?? 0) + SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_SUCCESSION_STRENGTH;
        await supabase.from('stewards').update({ succession_strength: newSS }).eq('id', mySteward.id);

        // All OTHER stewards: standing -1
        const { data: otherStewards } = await supabase
            .from('stewards')
            .select('id, standing')
            .eq('nation_id', nationId)
            .eq('is_alive', true)
            .neq('id', mySteward.id);
        for (const s of (otherStewards || [])) {
            const newStanding = Math.max(0, (s.standing ?? 50) - SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_STANDING_PENALTY);
            await supabase.from('stewards').update({ standing: newStanding }).eq('id', s.id);
        }

        result.legitimacyGain = SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_LEGITIMACY;
        result.successionStrengthGain = SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_SUCCESSION_STRENGTH;

        await supabase.from('campaign_actions').insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'dynasty_cultivate',
            tick_performed: currentTick,
            result: {
                legitimacy_gain: SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_LEGITIMACY,
                succession_strength_gain: SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_SUCCESSION_STRENGTH,
                standing_penalty: SUCCESSOR_CONFIG.DYNASTY_CULTIVATE_STANDING_PENALTY,
            },
        });

    } else if (mode === 'prepare_succession') {
        // Succession strength +8, exit_readiness +10
        const newSS = (mySteward.succession_strength ?? 0) + SUCCESSOR_CONFIG.DYNASTY_PREPARE_SUCCESSION_STRENGTH;
        const newER = Math.min(100, (mySteward.exit_readiness ?? 0) + SUCCESSOR_CONFIG.DYNASTY_PREPARE_EXIT_READINESS);
        await supabase.from('stewards').update({
            succession_strength: newSS,
            exit_readiness: newER,
        }).eq('id', mySteward.id);

        // 10% detection chance
        const detected = Math.random() < SUCCESSOR_CONFIG.DYNASTY_PREPARE_DETECTION_CHANCE;
        result.successionStrengthGain = SUCCESSOR_CONFIG.DYNASTY_PREPARE_SUCCESSION_STRENGTH;
        result.exitReadinessGain = SUCCESSOR_CONFIG.DYNASTY_PREPARE_EXIT_READINESS;
        result.detected = detected;

        if (detected) {
            // Log a detection entry visible to the strongman (ruling faction)
            const { data: nationRow } = await supabase.from('nations').select('ruling_faction_id').eq('id', nationId).single();
            await supabase.from('campaign_actions').insert({
                party_id: nationRow?.ruling_faction_id || factionId,
                nation_id: nationId,
                action_type: 'dynasty_detected_prepare',
                tick_performed: currentTick,
                result: {
                    steward_name: `${mySteward.first_name} ${mySteward.last_name}`,
                    faction_id: factionId,
                },
            });
        }

        // Log the prepare action to the acting faction
        await supabase.from('campaign_actions').insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'dynasty_prepare',
            tick_performed: currentTick,
            result: {
                succession_strength_gain: SUCCESSOR_CONFIG.DYNASTY_PREPARE_SUCCESSION_STRENGTH,
                exit_readiness_gain: SUCCESSOR_CONFIG.DYNASTY_PREPARE_EXIT_READINESS,
                detected,
            },
        });
    }

    return { success: true, ...result };
}

// ==================== PHASE 8: COUP OVERHAUL & REGIME HEALTH ====================

/**
 * Get regime health threshold label and effects.
 */
function getRegimeHealthTier(regimeHealth) {
    if (regimeHealth >= 60) return { label: 'HEALTHY', color: '#4CAF50', coupBonus: 0, loyaltyDecay: -2 };
    if (regimeHealth >= 40) return { label: 'WEAKENING', color: '#FFC107', coupBonus: 5, loyaltyDecay: -2.5 };
    if (regimeHealth >= 20) return { label: 'DECLINING', color: '#FF9800', coupBonus: 10, loyaltyDecay: -3 };
    if (regimeHealth >= 1) return { label: 'CRITICAL', color: '#F44336', coupBonus: 20, loyaltyDecay: -4 };
    return { label: 'COLLAPSED', color: '#B71C1C', coupBonus: 30, loyaltyDecay: -5 };
}

/**
 * Process regime health tick: natural decay, modifiers, recovery.
 * Called once per tick for each autocracy nation.
 */
async function processRegimeHealthTick(supabase, nation, currentTick) {
    if (!isAutocracy(nation)) return;

    let rh = Number(nation.regime_health ?? 80);
    const startingRH = 80; // recovery cap

    // Natural decay: -0.5/tick
    rh -= 0.5;

    // Fetch factions for modifier calculations
    const { data: factions } = await supabase
        .from('factions')
        .select('id, loyalty, standing, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (factions && factions.length > 0) {
        // Recovery: high average loyalty across non-ruling factions
        const nonRuling = factions.filter(f => f.id !== nation.ruling_faction_id);
        if (nonRuling.length > 0) {
            const avgLoyalty = nonRuling.reduce((s, f) => s + (f.loyalty ?? 50), 0) / nonRuling.length;
            if (avgLoyalty >= 60) rh += 0.3;
        }
    }

    // Recovery: high stability
    if ((nation.stability ?? 50) >= 60) rh += 0.3;

    // Recovery: has a chosen successor
    const { data: successorCheck } = await supabase
        .from('stewards')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('is_chosen_successor', true)
        .eq('is_alive', true)
        .limit(1);
    if (successorCheck && successorCheck.length > 0) rh += 0.1;

    // Recovery: no active crises (check for recent negative events)
    // Simple heuristic: if stability > 50 and no recent purges/coups, small bonus
    const { data: recentBadEvents } = await supabase
        .from('campaign_actions')
        .select('id')
        .eq('nation_id', nation.id)
        .in('action_type', ['purge', 'coup_failed', 'faction_intimidate'])
        .gte('tick_performed', currentTick - 3)
        .limit(1);
    if (!recentBadEvents || recentBadEvents.length === 0) rh += 0.5;

    // Cap: never exceeds starting value
    rh = Math.min(startingRH, Math.max(0, rh));

    // Update nation
    await supabase.from('nations').update({ regime_health: rh }).eq('id', nation.id);

    // Check for collapse (rh === 0)
    if (rh <= 0) {
        await handleRegimeCollapse(supabase, nation, currentTick);
    }

    return rh;
}

/**
 * Handle regime collapse when regime_health reaches 0.
 * If successor exists, they take over. Otherwise, power vacuum.
 */
async function handleRegimeCollapse(supabase, nation, currentTick) {
    // Check for chosen successor
    const { data: successor } = await supabase
        .from('stewards')
        .select('id, faction_id, first_name, last_name')
        .eq('nation_id', nation.id)
        .eq('is_chosen_successor', true)
        .eq('is_alive', true)
        .limit(1)
        .maybeSingle();

    if (successor) {
        // Successor takes over
        await supabase.from('nations').update({
            ruling_faction_id: successor.faction_id,
            regime_health: 40, // partial recovery on succession
            successor_cooldown_end_tick: null,
            successor_is_family_member: false,
        }).eq('id', nation.id);

        // Clear successor status
        await supabase.from('stewards').update({
            is_chosen_successor: false,
            succession_strength: 0,
            successor_appointed_tick: null,
        }).eq('nation_id', nation.id);

        // Reset all loyalties to 40
        await supabase.from('factions').update({ loyalty: 40 })
            .eq('nation_id', nation.id)
            .neq('id', successor.faction_id);

        await supabase.from('campaign_actions').insert({
            party_id: successor.faction_id,
            nation_id: nation.id,
            action_type: 'regime_succession',
            tick_performed: currentTick,
            result: {
                successor_name: `${successor.first_name} ${successor.last_name}`,
                faction_id: successor.faction_id,
                reason: 'regime_collapse',
            },
        });
    } else {
        // Power vacuum — highest standing faction takes over with penalties
        const { data: factions } = await supabase
            .from('factions')
            .select('id, standing, faction_name')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party')
            .neq('id', nation.ruling_faction_id)
            .order('standing', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (factions) {
            await supabase.from('nations').update({
                ruling_faction_id: factions.id,
                regime_health: 30, // low recovery on power vacuum
                stability: Math.max(0, (nation.stability ?? 50) - 10),
            }).eq('id', nation.id);

            // All loyalties reset to 30 (chaotic transition)
            await supabase.from('factions').update({ loyalty: 30 })
                .eq('nation_id', nation.id)
                .neq('id', factions.id);

            await supabase.from('campaign_actions').insert({
                party_id: factions.id,
                nation_id: nation.id,
                action_type: 'power_vacuum',
                tick_performed: currentTick,
                result: {
                    new_ruler: factions.faction_name,
                    faction_id: factions.id,
                    reason: 'regime_collapse',
                },
            });
        }
    }
}

/**
 * Process unaligned seat pool regeneration: +1 seat per 4 ticks.
 * Draws proportionally from largest factions.
 */
async function processUnalignedPoolTick(supabase, nation, currentTick) {
    if (!isAutocracy(nation)) return;
    if (currentTick % GAME_CONFIG.UNALIGNED_POOL_REGEN_TICKS !== 0) return;

    const totalSeats = nation.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const maxPool = Math.floor(totalSeats * GAME_CONFIG.UNALIGNED_POOL_MAX_RATIO);
    const currentPool = nation.unaligned_seats || 0;

    if (currentPool >= maxPool) return;

    // Find the largest faction to draw from
    const { data: factions } = await supabase
        .from('factions')
        .select('id, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party')
        .order('seats', { ascending: false })
        .limit(1);

    if (!factions || factions.length === 0 || factions[0].seats <= GAME_CONFIG.NEW_FACTION_MIN_SEATS) return;

    // Draw 1 seat from largest faction
    await supabase.from('factions').update({ seats: factions[0].seats - 1 }).eq('id', factions[0].id);
    await supabase.from('nations').update({ unaligned_seats: currentPool + 1 }).eq('id', nation.id);
}

/**
 * Calculate coup success probability.
 * Based on standing, seats, funds, regime health, and allies.
 */
function calculateCoupProbability(faction, nation, allies = []) {
    const standing = faction.standing ?? 30;
    const seats = faction.seats ?? 0;
    const totalSeats = nation.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const funds = Number(faction.embezzled_funds ?? 0);
    const rh = Number(nation.regime_health ?? 80);

    // Base probability from standing (0-30%)
    const standingComponent = (standing / 90) * 30;

    // Seat ratio component (0-25%)
    const seatRatio = seats / totalSeats;
    const seatComponent = Math.min(25, seatRatio * 100);

    // Funds component (0-20%)
    const fundsComponent = Math.min(20, (funds / 100) * 20);

    // Regime health weakness bonus (0-20%)
    const tier = getRegimeHealthTier(rh);
    const rhComponent = tier.coupBonus;

    // Ally bonus (up to 15%)
    let allyBonus = 0;
    for (const ally of allies) {
        allyBonus += ((ally.seats ?? 0) / totalSeats) * 15;
    }
    allyBonus = Math.min(15, allyBonus);

    const raw = standingComponent + seatComponent + fundsComponent + rhComponent + allyBonus;
    return Math.max(5, Math.min(95, Math.round(raw)));
}

/**
 * Get qualitative coup estimate with noise for player display.
 */
function getCoupEstimate(faction, nation, allies = []) {
    const trueProbability = calculateCoupProbability(faction, nation, allies);

    // Apply noise: ±((100 - standing) / 100 × 15%)
    const standing = faction.standing ?? 30;
    const noiseRange = ((100 - standing) / 100) * 15;
    const noise = (Math.random() * 2 - 1) * noiseRange;
    const displayed = Math.max(5, Math.min(95, Math.round(trueProbability + noise)));

    // Map to tier
    let tier, color;
    if (displayed < 25) { tier = 'DESPERATE'; color = '#F44336'; }
    else if (displayed < 40) { tier = 'RISKY'; color = '#FF9800'; }
    else if (displayed < 55) { tier = 'UNCERTAIN'; color = '#FFC107'; }
    else if (displayed < 70) { tier = 'FAVORABLE'; color = '#8BC34A'; }
    else { tier = 'STRONG'; color = '#4CAF50'; }

    return { tier, color, displayed, trueProbability };
}

/**
 * Check if a faction meets the new v2 coup requirements.
 */
function canAttemptCoup(faction, nation, currentTick) {
    const standing = faction.standing ?? 30;
    const seats = faction.seats ?? 0;
    const totalSeats = nation.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const funds = Number(faction.embezzled_funds ?? 0);
    const lockoutUntil = faction.coup_lockout_until_tick;

    const reasons = [];
    if (standing < GAME_CONFIG.COUP_MIN_STANDING) {
        reasons.push(`Standing ${standing} < ${GAME_CONFIG.COUP_MIN_STANDING}`);
    }
    if (seats / totalSeats < GAME_CONFIG.COUP_MIN_SEAT_RATIO) {
        reasons.push(`Seats ${seats} < ${Math.ceil(totalSeats * GAME_CONFIG.COUP_MIN_SEAT_RATIO)} (${Math.round(GAME_CONFIG.COUP_MIN_SEAT_RATIO * 100)}%)`);
    }
    if (funds < GAME_CONFIG.COUP_FUNDS_THRESHOLD) {
        reasons.push(`Funds $${Math.round(funds)}M < $${GAME_CONFIG.COUP_FUNDS_THRESHOLD}M`);
    }
    if (lockoutUntil && currentTick < lockoutUntil) {
        reasons.push(`Lockout until tick ${lockoutUntil} (${lockoutUntil - currentTick} ticks)`);
    }
    // Check if faction is the ruling faction
    if (faction.id === nation.ruling_faction_id) {
        reasons.push('Cannot coup yourself');
    }

    return { canCoup: reasons.length === 0, reasons };
}

/**
 * Send a coup invitation to another faction.
 * Stores as a campaign_action with status 'pending_coup_invite'.
 */
async function sendCoupInvitation(supabase, factionId, nationId, targetFactionId, currentTick) {
    // Validate sender meets coup requirements
    const { data: faction } = await supabase
        .from('factions')
        .select('id, standing, seats, embezzled_funds, coup_lockout_until_tick, faction_name')
        .eq('id', factionId)
        .single();
    if (!faction) return { success: false, error: 'Faction not found' };

    const { data: nation } = await supabase
        .from('nations')
        .select('id, ruling_faction_id, total_seats, regime_health')
        .eq('id', nationId)
        .single();
    if (!nation) return { success: false, error: 'Nation not found' };

    const eligibility = canAttemptCoup(faction, nation, currentTick);
    if (!eligibility.canCoup) return { success: false, error: `Not eligible: ${eligibility.reasons.join(', ')}` };

    // Check if already invited this faction
    const { data: existing } = await supabase
        .from('campaign_actions')
        .select('id')
        .eq('party_id', factionId)
        .eq('nation_id', nationId)
        .eq('action_type', 'coup_invitation')
        .gte('tick_performed', currentTick - 2)
        .limit(1);
    if (existing && existing.length > 0) return { success: false, error: 'Already sent an invitation recently' };

    // Check max 2 invitations
    const { data: allInvites } = await supabase
        .from('campaign_actions')
        .select('id')
        .eq('party_id', factionId)
        .eq('nation_id', nationId)
        .eq('action_type', 'coup_invitation')
        .gte('tick_performed', currentTick - 2);
    if (allInvites && allInvites.length >= 2) return { success: false, error: 'Maximum 2 invitations per coup attempt' };

    // Get estimate for display to invitee
    const estimate = getCoupEstimate(faction, nation);

    await supabase.from('campaign_actions').insert({
        party_id: factionId,
        nation_id: nationId,
        action_type: 'coup_invitation',
        tick_performed: currentTick,
        result: {
            target_faction_id: targetFactionId,
            inviter_name: faction.faction_name,
            estimate_tier: estimate.tier,
            status: 'pending',
        },
    });

    return { success: true, estimateTier: estimate.tier };
}

/**
 * Respond to a coup invitation.
 * Options: 'accept', 'decline', 'report'
 */
async function respondToCoupInvitation(supabase, factionId, nationId, invitationId, response, currentTick) {
    // Load the invitation
    const { data: invite } = await supabase
        .from('campaign_actions')
        .select('id, party_id, result')
        .eq('id', invitationId)
        .single();
    if (!invite) return { success: false, error: 'Invitation not found' };
    if (invite.result?.target_faction_id !== factionId) return { success: false, error: 'Not your invitation' };
    if (invite.result?.status !== 'pending') return { success: false, error: 'Already responded' };

    const inviterId = invite.party_id;
    const updatedResult = { ...invite.result, status: response, responded_tick: currentTick };

    await supabase.from('campaign_actions')
        .update({ result: updatedResult })
        .eq('id', invitationId);

    if (response === 'report') {
        // Reporter: loyalty +15
        const { data: reporter } = await supabase
            .from('factions').select('id, loyalty').eq('id', factionId).single();
        if (reporter) {
            const newLoyalty = Math.min(GAME_CONFIG.LOYALTY_CAP, (reporter.loyalty ?? 50) + 15);
            await supabase.from('factions').update({ loyalty: newLoyalty }).eq('id', factionId);
        }

        // Plotter: loyalty -20, standing -5
        const { data: plotter } = await supabase
            .from('factions').select('id, loyalty, standing').eq('id', inviterId).single();
        if (plotter) {
            const newLoyalty = Math.max(0, (plotter.loyalty ?? 50) - 20);
            const newStanding = Math.max(0, (plotter.standing ?? 30) - 5);
            await supabase.from('factions').update({ loyalty: newLoyalty, standing: newStanding }).eq('id', inviterId);
        }

        // Notify strongman
        const { data: nation } = await supabase.from('nations').select('ruling_faction_id').eq('id', nationId).single();
        await supabase.from('campaign_actions').insert({
            party_id: nation?.ruling_faction_id || factionId,
            nation_id: nationId,
            action_type: 'coup_plot_reported',
            tick_performed: currentTick,
            result: {
                reporter_faction_id: factionId,
                plotter_faction_id: inviterId,
            },
        });
    }

    return { success: true, response };
}

/**
 * Execute a coup attempt (v2 overhaul).
 * New requirements: standing >= 15, seats >= 10%, funds >= $30M.
 */
async function executeCoupAttempt(supabase, factionId, nationId, fundsCommitted, currentTick) {
    // Load faction data
    const { data: faction } = await supabase
        .from('factions')
        .select('id, standing, seats, embezzled_funds, coup_lockout_until_tick, faction_name, loyalty')
        .eq('id', factionId)
        .single();
    if (!faction) return { success: false, error: 'Faction not found' };

    const { data: nation } = await supabase
        .from('nations')
        .select('id, ruling_faction_id, total_seats, regime_health, stability')
        .eq('id', nationId)
        .single();
    if (!nation) return { success: false, error: 'Nation not found' };

    // Validate requirements
    const eligibility = canAttemptCoup(faction, nation, currentTick);
    if (!eligibility.canCoup) return { success: false, error: `Not eligible: ${eligibility.reasons.join(', ')}` };

    // Validate funds commitment (must commit at least $30M, can't exceed holdings)
    const funds = Number(faction.embezzled_funds ?? 0);
    const committed = Math.min(funds, fundsCommitted);
    if (committed < GAME_CONFIG.COUP_FUNDS_THRESHOLD) {
        return { success: false, error: `Must commit at least $${GAME_CONFIG.COUP_FUNDS_THRESHOLD}M` };
    }

    // Find accepted allies
    const { data: acceptedInvites } = await supabase
        .from('campaign_actions')
        .select('id, result')
        .eq('party_id', factionId)
        .eq('nation_id', nationId)
        .eq('action_type', 'coup_invitation')
        .gte('tick_performed', currentTick - 2);

    const allyIds = [];
    if (acceptedInvites) {
        for (const inv of acceptedInvites) {
            if (inv.result?.status === 'accepted') {
                allyIds.push(inv.result.target_faction_id);
            }
        }
    }

    // Load ally data
    let allies = [];
    if (allyIds.length > 0) {
        const { data: allyData } = await supabase
            .from('factions')
            .select('id, standing, seats, faction_name')
            .in('id', allyIds);
        allies = allyData || [];
    }

    // Calculate true probability
    const trueProbability = calculateCoupProbability(faction, nation, allies);
    const success = Math.random() * 100 < trueProbability;

    // Deduct committed funds regardless
    await supabase.from('factions').update({
        embezzled_funds: Math.max(0, funds - committed),
    }).eq('id', factionId);

    const totalSeats = nation.total_seats || GAME_CONFIG.TOTAL_SEATS;

    if (success) {
        // === COUP SUCCESS ===
        // Old strongman's faction: reset
        const oldRulingId = nation.ruling_faction_id;

        // New ruler
        await supabase.from('nations').update({
            ruling_faction_id: factionId,
            regime_health: Math.max(20, Number(nation.regime_health ?? 80) - 10),
            stability: Math.max(0, (nation.stability ?? 50) - 5),
            successor_cooldown_end_tick: null,
            successor_is_family_member: false,
        }).eq('id', nationId);

        // Clear any chosen successors
        await supabase.from('stewards').update({
            is_chosen_successor: false, succession_strength: 0, successor_appointed_tick: null,
        }).eq('nation_id', nationId).eq('is_chosen_successor', true);

        // Coup leader: standing +10, loyalty set to 70
        await supabase.from('factions').update({
            standing: Math.min(GAME_CONFIG.STANDING_CAP, (faction.standing ?? 30) + 10),
            loyalty: 70,
            coup_lockout_until_tick: null,
        }).eq('id', factionId);

        // Allies: standing +10, loyalty set to 70
        for (const ally of allies) {
            await supabase.from('factions').update({
                standing: Math.min(GAME_CONFIG.STANDING_CAP, (ally.standing ?? 30) + 10),
                loyalty: 70,
            }).eq('id', ally.id);
        }

        // Non-involved factions: loyalty reset to 40
        const involvedIds = [factionId, ...allyIds, oldRulingId].filter(Boolean);
        await supabase.from('factions').update({ loyalty: 40 })
            .eq('nation_id', nationId)
            .eq('faction_type', 'party')
            .not('id', 'in', `(${involvedIds.join(',')})`);

        await supabase.from('campaign_actions').insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'coup_success',
            tick_performed: currentTick,
            result: {
                faction_name: faction.faction_name,
                allies: allies.map(a => a.faction_name),
                probability: trueProbability,
                funds_committed: committed,
            },
        });

        return {
            success: true,
            coupSuccess: true,
            probability: trueProbability,
            allies: allies.map(a => a.faction_name),
        };
    } else {
        // === COUP FAILURE ===
        // Leader: steward dies, standing -25, loyalty 10, lose 40% seats, 6-tick lockout
        const { data: leaderSteward } = await supabase
            .from('stewards')
            .select('id, first_name, last_name, steward_type, pillar_key')
            .eq('faction_id', factionId)
            .eq('nation_id', nationId)
            .eq('is_alive', true)
            .limit(1)
            .maybeSingle();

        if (leaderSteward) {
            await supabase.from('stewards').update({ is_alive: false }).eq('id', leaderSteward.id);

            // Generate new steward
            const newFirstName = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)];
            const newLastName = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)];
            await supabase.from('stewards').insert({
                faction_id: factionId,
                nation_id: nationId,
                first_name: newFirstName,
                last_name: newLastName,
                age: 35 + Math.floor(Math.random() * 20),
                steward_type: leaderSteward.steward_type || 'party_chairman',
                pillar_key: leaderSteward.pillar_key,
                standing: 10,
                power_base: 15,
                true_loyalty: 50,
                estimated_loyalty: 50,
                personal_wealth: 0,
                exit_readiness: 0,
                coup_readiness: 0,
                is_alive: true,
            });
        }

        // Leader faction penalties
        const seatLoss = Math.floor((faction.seats ?? 0) * 0.40);
        await supabase.from('factions').update({
            standing: Math.max(0, (faction.standing ?? 30) - 25),
            loyalty: 10,
            embezzled_funds: 0,
            seats: Math.max(1, (faction.seats ?? 0) - seatLoss),
            coup_lockout_until_tick: currentTick + GAME_CONFIG.COUP_LOCKOUT_TICKS,
        }).eq('id', factionId);

        // Distribute lost seats to ruling faction
        if (seatLoss > 0 && nation.ruling_faction_id) {
            const { data: ruler } = await supabase
                .from('factions').select('id, seats').eq('id', nation.ruling_faction_id).single();
            if (ruler) {
                await supabase.from('factions').update({
                    seats: (ruler.seats ?? 0) + seatLoss,
                }).eq('id', ruler.id);
            }
        }

        // Allies: standing -15, loyalty -20, lose 20% seats (transferred to ruling faction)
        let totalAllySeatLoss = 0;
        for (const ally of allies) {
            const allySeatLoss = Math.floor((ally.seats ?? 0) * 0.20);
            const { data: allyFaction } = await supabase
                .from('factions').select('id, loyalty, standing, seats')
                .eq('id', ally.id).single();
            if (allyFaction) {
                const actualLoss = Math.min(allySeatLoss, (allyFaction.seats ?? 0) - 1); // keep at least 1
                await supabase.from('factions').update({
                    standing: Math.max(0, (allyFaction.standing ?? 30) - 15),
                    loyalty: Math.max(0, (allyFaction.loyalty ?? 50) - 20),
                    seats: (allyFaction.seats ?? 0) - actualLoss,
                }).eq('id', ally.id);
                totalAllySeatLoss += actualLoss;
            }
        }
        // Transfer ally lost seats to ruling faction
        if (totalAllySeatLoss > 0 && nation.ruling_faction_id) {
            const { data: ruler2 } = await supabase
                .from('factions').select('id, seats').eq('id', nation.ruling_faction_id).single();
            if (ruler2) {
                await supabase.from('factions').update({
                    seats: (ruler2.seats ?? 0) + totalAllySeatLoss,
                }).eq('id', ruler2.id);
            }
        }

        // Regime health penalty
        await supabase.from('nations').update({
            regime_health: Math.max(0, Number(nation.regime_health ?? 80) - 5),
            stability: Math.max(0, (nation.stability ?? 50) - 3),
        }).eq('id', nationId);

        await supabase.from('campaign_actions').insert({
            party_id: factionId,
            nation_id: nationId,
            action_type: 'coup_failed',
            tick_performed: currentTick,
            result: {
                faction_name: faction.faction_name,
                steward_name: leaderSteward ? `${leaderSteward.first_name} ${leaderSteward.last_name}` : 'Unknown',
                allies: allies.map(a => a.faction_name),
                probability: trueProbability,
                funds_committed: committed,
                seats_lost: seatLoss,
            },
        });

        return {
            success: true,
            coupSuccess: false,
            probability: trueProbability,
            seatsLost: seatLoss,
            stewardDied: !!leaderSteward,
        };
    }
}

// ────────── election-simulation ──────────


// ==================== ELECTION SIMULATION ====================

/**
 * Get a party's alignment score toward a specific ideology tag.
 *
 * @param {object} partyAxes  - Row from faction_ideology (keys: liberty_equality, tradition_progress, etc.)
 * @param {string} tag        - Ideology tag (e.g. "PROGRESS", "Liberty") — case-insensitive
 * @returns {number} Alignment value: positive = supports, negative = opposes
 */
function getPartyAlignment(partyAxes, tag) {
    const info = IDEOLOGY_TO_AXIS[tag.toUpperCase()];
    if (!info) return 0;
    const axisValue = partyAxes[info.axisKey] ?? 0;
    return axisValue * info.direction;
}

// findEligibleParties removed — replaced by weighted competition model
// where ALL parties compete simultaneously for each bloc's voters.

/**
 * Distribute a voter bloc's votes among ALL parties using the Weighted Competition Model.
 *
 * weight = bloc_approval × ideology_multiplier
 * ideology_multiplier = clamp(1.0 + avg_alignment × 0.02, 0.2, 2.0)
 *
 * No cascade steps. No leakage. All parties compete simultaneously.
 *
 * @param {object[]} parties           - All parties with axes
 * @param {string[]} tags              - Bloc ideology tags (may be empty for Unaligned)
 * @param {number}   blocCount         - Voters in this bloc
 * @param {object}   tally             - Mutable { [partyId]: voteCount } accumulator
 * @param {object}   [blocApprovals]   - { partyId: approval } per-bloc approval map
 * @param {object}   [ideologySaturation] - { tag: partyCount } saturation data
 * @param {number}   [avgSaturation]   - Average saturation across active tags
 * @returns {number} Number of abstentions produced
 */
function distributeVotes(parties, tags, blocCount, tally, blocApprovals, ideologySaturation, avgSaturation) {
    if (blocCount <= 0) return 0;

    const IDEOLOGY_RATE = 0.02;
    const MULT_MIN = 0.2;
    const MULT_MAX = 2.0;

    // Helper: get per-bloc approval for a party (default 40)
    const getApproval = (partyId) => (blocApprovals && blocApprovals[partyId] != null) ? blocApprovals[partyId] : 40;

    const upperTags = tags.map(t => t.toUpperCase());

    // ---- Abstention ----
    let abstainRate = upperTags.length === 0 ? 0.35 : 0.22;

    // Ideology Saturation modifier
    if (upperTags.length > 0 && ideologySaturation && avgSaturation > 0) {
        const blocSaturation = upperTags.reduce((s, t) => s + (ideologySaturation[t] || 0), 0) / upperTags.length;
        const SATURATION_RATE = 0.04;
        const SATURATION_CAP  = 0.12;
        let satMod = (blocSaturation - avgSaturation) * SATURATION_RATE;
        satMod = Math.max(-SATURATION_CAP, Math.min(SATURATION_CAP, satMod));
        abstainRate = Math.max(0.05, Math.min(0.85, abstainRate + satMod));
    }

    const abstentions = Math.floor(blocCount * abstainRate);
    const voters = blocCount - abstentions;
    if (voters <= 0) return blocCount;

    // ---- Calculate softmax-sharpened weights for ALL parties ----
    const K_TEMP = 7;  // softmax temperature (matches tick-system k_value)

    // Find max approval for numerical stability
    let maxApproval = 0;
    for (const party of parties) {
        const a = getApproval(party.id);
        if (a > maxApproval) maxApproval = a;
    }

    const weights = [];
    let totalWeight = 0;

    for (const party of parties) {
        const approval = getApproval(party.id);
        // Softmax sharpening: exp((approval - max) / k)
        const softmaxExp = Math.exp((approval - maxApproval) / K_TEMP);

        let multiplier = 1.0;

        if (upperTags.length > 0) {
            // Average alignment across bloc tags
            const alignSum = upperTags.reduce((s, t) => s + getPartyAlignment(party.axes, t), 0);
            const alignAvg = alignSum / upperTags.length;
            multiplier = Math.max(MULT_MIN, Math.min(MULT_MAX, 1.0 + alignAvg * IDEOLOGY_RATE));
        }

        // Weight = softmax(approval) × ideology_multiplier
        const w = Math.max(0, softmaxExp * multiplier);
        weights.push({ id: party.id, weight: w });
        totalWeight += w;
    }

    // Edge case: all weights are 0 — distribute evenly
    if (totalWeight === 0) {
        const evenShare = Math.floor(voters / parties.length);
        for (const party of parties) {
            tally[party.id] = (tally[party.id] || 0) + evenShare;
        }
        const rem = voters - evenShare * parties.length;
        if (rem > 0) {
            tally[parties[0].id] = (tally[parties[0].id] || 0) + rem;
        }
        return abstentions;
    }

    // ---- Distribute proportionally with Largest Remainder ----
    let allocated = 0;
    const partyVotes = [];
    for (const { id, weight } of weights) {
        const exact = (voters * weight) / totalWeight;
        const floored = Math.floor(exact);
        tally[id] = (tally[id] || 0) + floored;
        allocated += floored;
        partyVotes.push({ id, fractional: exact - floored });
    }

    const remainder = voters - allocated;
    partyVotes.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remainder; i++) {
        tally[partyVotes[i].id] = (tally[partyVotes[i].id] || 0) + 1;
    }

    return abstentions;
}

/**
 * Allocate parliamentary seats from vote totals using
 * Largest Remainder / Hare Quota method.
 *
 * @param {object} voteTotals  - { partyId: totalVotes, ... }
 * @param {number} totalSeats  - Seats to allocate (default 120)
 * @returns {object} { partyId: seats, ... }
 */
function allocateSeatsByVotes(voteTotals, totalSeats = GAME_CONFIG.TOTAL_SEATS) {
    const totalVotes = Object.values(voteTotals).reduce((s, v) => s + v, 0);
    if (totalVotes === 0) {
        const seats = {};
        for (const id of Object.keys(voteTotals)) seats[id] = 0;
        return seats;
    }

    const quota = totalVotes / totalSeats;
    const seats = {};
    const fractionals = [];
    let allocatedSeats = 0;

    for (const [id, votes] of Object.entries(voteTotals)) {
        if (votes === 0) { seats[id] = 0; continue; }
        const raw = votes / quota;
        const guaranteed = Math.floor(raw);
        seats[id] = guaranteed;
        allocatedSeats += guaranteed;
        fractionals.push({ id, fractional: raw - guaranteed });
    }

    const remaining = totalSeats - allocatedSeats;
    fractionals.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remaining; i++) {
        seats[fractionals[i].id] = (seats[fractionals[i].id] || 0) + 1;
    }

    return seats;
}

/**
 * Run a full election simulation using the Weighted Competition Model.
 *
 * All parties compete simultaneously for each bloc's voters:
 *   weight = bloc_approval × ideology_multiplier
 *   ideology_multiplier = clamp(1.0 + avg_alignment × 0.02, 0.2, 2.0)
 *
 * @param {object[]} blocs    - Rows from voter_blocs: { id, bloc_name, voter_count, ideology_1..5, is_active }
 * @param {object[]} parties  - Array of { id, faction_name, axes: { liberty_equality, ... } }
 * @param {number}   [totalSeats=120]
 * @param {object}   [allBlocApprovals] - { blocId: { partyId: approval } } from faction_bloc_approval
 * @returns {{ votes: object, seats: object, totalAbstentions: number, totalVotesCast: number, details: object[] }}
 */
function runElectionSimulation(blocs, parties, totalSeats = GAME_CONFIG.TOTAL_SEATS, allBlocApprovals = null) {
    const tally = {};
    for (const p of parties) tally[p.id] = 0;

    let totalAbstentions = 0;
    const details = [];

    // ---- Ideology Saturation: penalise over-served ideologies with higher abstention ----
    const ALL_IDEOLOGY_TAGS = ['LIBERTY','EQUALITY','TRADITION','PROGRESS','SECURITY','FREEDOM',
                               'GLOBALISM','NATIONALISM','INDIVIDUALISM','COLLECTIVISM'];
    const ideologySaturation = {};
    for (const tag of ALL_IDEOLOGY_TAGS) {
        ideologySaturation[tag] = parties.filter(p => getPartyAlignment(p.axes, tag) > 0).length;
    }
    const activeSatTags = ALL_IDEOLOGY_TAGS.filter(t => ideologySaturation[t] > 0);
    const avgSaturation = activeSatTags.length > 0
        ? activeSatTags.reduce((s, t) => s + ideologySaturation[t], 0) / activeSatTags.length
        : 1;

    for (const bloc of blocs) {
        if (!bloc.is_active) continue;
        const count = bloc.voter_count || 0;
        if (count === 0) continue;

        // Collect ideology tags from the bloc
        const tags = [bloc.ideology_1, bloc.ideology_2, bloc.ideology_3, bloc.ideology_4, bloc.ideology_5]
            .filter(t => t && t !== 'Unaligned');

        // Per-bloc approval map for this specific bloc
        const blocApprovals = allBlocApprovals ? allBlocApprovals[bloc.id] || null : null;

        // Snapshot tally before distribution to compute per-bloc party votes
        const snapshot = {};
        for (const p of parties) snapshot[p.id] = tally[p.id];

        // All parties compete simultaneously — no cascade
        const abstentions = distributeVotes(parties, tags, count, tally, blocApprovals, ideologySaturation, avgSaturation);

        // Compute per-party votes from this bloc
        const blocVotes = {};
        const partyVotes = [];
        for (const p of parties) {
            const gained = tally[p.id] - snapshot[p.id];
            if (gained > 0) blocVotes[p.id] = gained;
            partyVotes.push({
                party_id: p.id,
                party_name: p.faction_name,
                votes: Math.max(0, gained)
            });
        }

        totalAbstentions += abstentions;
        details.push({
            bloc_id: bloc.id,
            bloc_name: bloc.bloc_name,
            voter_count: count,
            tags,
            abstentions,
            party_votes: partyVotes,
            blocVotes
        });
    }

    const totalVotesCast = Object.values(tally).reduce((s, v) => s + v, 0);
    const seats = allocateSeatsByVotes(tally, totalSeats);

    return { votes: tally, seats, totalAbstentions, totalVotesCast, details };
}

/**
 * High-level helper: load all data from Supabase and run the election preview.
 *
 * @param {object} supabase   - Supabase client
 * @param {string} nationId   - Nation UUID
 * @returns {Promise<object>} Full election result with party names, votes, seats, turnout
 */
async function runElectionPreview(supabase, nationId) {
    // 1. Load nation
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, total_seats, eligible_voters')
        .eq('id', nationId)
        .single();
    if (!nation) throw new Error('Nation not found');

    const totalSeats = nation.total_seats || 120;

    // 2. Load voter blocs
    const { data: blocs } = await supabase
        .from('voter_blocs')
        .select('*')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (!blocs || blocs.length === 0) throw new Error('No voter blocs found for this nation');

    // 2b. Scale bloc voter_counts so total matches eligible_voters (blocs are generated from population)
    const eligibleVoters = nation.eligible_voters || 0;
    const totalBlocVoters = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    if (totalBlocVoters > 0 && eligibleVoters > 0) {
        const scale = eligibleVoters / totalBlocVoters;
        let scaledSum = 0;
        for (const b of blocs) {
            b.voter_count = Math.round((b.voter_count || 0) * scale);
            scaledSum += b.voter_count;
        }
        // Fix rounding drift on the largest bloc
        const diff = eligibleVoters - scaledSum;
        if (diff !== 0) {
            const largest = blocs.reduce((a, b) => (b.voter_count > a.voter_count ? b : a), blocs[0]);
            largest.voter_count += diff;
        }
    }

    // 3. Load parties + their ideology axes
    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name, seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');
    if (!factions || factions.length === 0) throw new Error('No parties found for this nation');

    const factionIds = factions.map(f => f.id);
    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('*')
        .in('faction_id', factionIds);

    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    // Build party objects with axes (no approval_rating or ideology_modifiers needed)
    const parties = factions.map(f => ({
        id: f.id,
        faction_name: f.faction_name,
        axes: ideoMap[f.id] || {
            liberty_equality: 0, tradition_progress: 0, security_freedom: 0,
            globalism_nationalism: 0, individualism_collectivism: 0
        }
    }));

    // 3b. Load per-bloc preference data from faction_bloc_approval (Three-Pillar system)
    const { data: fbaRows } = await supabase
        .from('faction_bloc_approval')
        .select('faction_id, bloc_id, preference_score')
        .in('faction_id', factionIds);

    // Build allBlocApprovals map: { blocId: { partyId: preference_score } }
    const allBlocApprovals = {};
    for (const row of (fbaRows || [])) {
        if (!allBlocApprovals[row.bloc_id]) allBlocApprovals[row.bloc_id] = {};
        allBlocApprovals[row.bloc_id][row.faction_id] = row.preference_score ?? 40;
    }

    // 4. Run simulation with per-bloc approvals
    const result = runElectionSimulation(blocs, parties, totalSeats, allBlocApprovals);

    // 5. Build friendly results with weighted average approval per party
    const totalBlocWeight = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    const partyResults = parties.map(p => {
        let weightedApproval = 40;
        if (totalBlocWeight > 0) {
            let wSum = 0;
            for (const bloc of blocs) {
                const ba = allBlocApprovals[bloc.id];
                const approval = (ba && ba[p.id] != null) ? ba[p.id] : 40;
                wSum += approval * (bloc.voter_count || 0);
            }
            weightedApproval = Math.round(wSum / totalBlocWeight * 100) / 100;
        }
        return {
            party_id: p.id,
            party_name: p.faction_name,
            approval: weightedApproval,
            votes: result.votes[p.id] || 0,
            vote_percentage: result.totalVotesCast > 0
                ? Math.round(((result.votes[p.id] || 0) / result.totalVotesCast) * 10000) / 100
                : 0,
            seats: result.seats[p.id] || 0
        };
    }).sort((a, b) => b.seats - a.seats);

    // Build party name lookup for UI
    const partyNames = {};
    for (const p of parties) partyNames[p.id] = p.faction_name;

    return {
        nation: nation.name,
        total_seats: totalSeats,
        eligible_voters: nation.eligible_voters || 0,
        total_votes_cast: result.totalVotesCast,
        total_abstentions: result.totalAbstentions,
        turnout_pct: nation.eligible_voters
            ? Math.round((result.totalVotesCast / nation.eligible_voters) * 10000) / 100
            : 0,
        results: partyResults,
        bloc_details: result.details,
        partyNames
    };
}

/**
 * Client-side presidential election preview (non-destructive).
 * Loads candidates, builds virtual-party objects, runs the simulation,
 * and checks for runoff (top candidate <=50% with >2 candidates).
 * If a runoff would trigger, re-runs with only the top 2 candidates.
 */
async function runPresidentialElectionPreview(supabase, nationId) {
    // 1. Load nation
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, total_seats, population, eligible_voters')
        .eq('id', nationId)
        .single();
    if (!nation) throw new Error('Nation not found');

    // 2. Load voter blocs
    const { data: blocs } = await supabase
        .from('voter_blocs')
        .select('*')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (!blocs || blocs.length === 0) throw new Error('No voter blocs found for this nation');

    // Scale bloc voter_counts so total matches actual eligible voter count
    // eligible_voters is a raw count (same as parliamentary preview)
    const eligibleVoters = nation.eligible_voters || 0;
    const totalBlocVoters = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    if (totalBlocVoters > 0 && eligibleVoters > 0) {
        const scale = eligibleVoters / totalBlocVoters;
        let scaledSum = 0;
        for (const b of blocs) {
            b.voter_count = Math.round((b.voter_count || 0) * scale);
            scaledSum += b.voter_count;
        }
        const diff = eligibleVoters - scaledSum;
        if (diff !== 0) {
            const largest = blocs.reduce((a, b) => (b.voter_count > a.voter_count ? b : a), blocs[0]);
            largest.voter_count += diff;
        }
    }

    // 3. Load selected presidential candidates
    const { data: candidates } = await supabase
        .from('pm_candidates')
        .select('id, first_name, last_name, faction_id, ideology, ideology_axis, ideology_direction, trait_key')
        .eq('nation_id', nationId)
        .eq('candidate_type', 'presidential')
        .eq('selected', true);
    if (!candidates || candidates.length === 0) throw new Error('No selected presidential candidates found. Generate and select candidates first.');

    // 4. Load faction data + ideology axes for each candidate's party
    const factionIds = [...new Set(candidates.map(c => c.faction_id))];
    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name')
        .in('id', factionIds);
    const factionMap = {};
    for (const f of (factions || [])) factionMap[f.id] = f;

    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('*')
        .in('faction_id', factionIds);
    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    // 5. Build "virtual party" objects per candidate (mirrors SQL RPC logic)
    const AXES = ['liberty_equality', 'tradition_progress', 'security_freedom', 'globalism_nationalism', 'individualism_collectivism'];
    function buildCandidateParty(cand) {
        const factionIdeo = ideoMap[cand.faction_id] || {};
        const axes = {};
        for (const axis of AXES) {
            let val = factionIdeo[axis] || 0;
            if (cand.ideology_axis === axis) {
                // Candidate gets +15 bonus on their personal axis
                // For globalism_nationalism, negate direction (convention mismatch)
                const dir = axis === 'globalism_nationalism' ? cand.ideology_direction * -1 : cand.ideology_direction;
                val += 15 * dir;
            }
            axes[axis] = Math.max(-100, Math.min(100, val));
        }
        const faction = factionMap[cand.faction_id] || {};
        return {
            id: cand.id,
            faction_name: `${cand.first_name} ${cand.last_name}`,
            party_name: faction.faction_name || 'Independent',
            faction_id: cand.faction_id,
            ideology: cand.ideology,
            trait_key: cand.trait_key,
            axes
        };
    }
    const allCandidateParties = candidates.map(buildCandidateParty);

    // 6. Load per-bloc approval data (keyed by faction, same as parliamentary)
    const { data: fbaRows } = await supabase
        .from('faction_bloc_approval')
        .select('faction_id, bloc_id, preference_score')
        .in('faction_id', factionIds);
    const allBlocApprovals = {};
    for (const row of (fbaRows || [])) {
        if (!allBlocApprovals[row.bloc_id]) allBlocApprovals[row.bloc_id] = {};
        // Map faction approval to candidate id (candidate inherits faction approval)
        for (const cand of candidates) {
            if (cand.faction_id === row.faction_id) {
                allBlocApprovals[row.bloc_id][cand.id] = row.preference_score ?? 40;
            }
        }
    }

    // 7. Run Round 1 simulation (use totalSeats=0 — we only care about votes)
    const round1 = runElectionSimulation(blocs, allCandidateParties, 0, allBlocApprovals);

    // Build Round 1 candidate results
    const totalBlocWeight = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    function buildCandidateResults(parties, simResult) {
        return parties.map(p => {
            let weightedApproval = 40;
            if (totalBlocWeight > 0) {
                let wSum = 0;
                for (const bloc of blocs) {
                    const ba = allBlocApprovals[bloc.id];
                    const approval = (ba && ba[p.id] != null) ? ba[p.id] : 40;
                    wSum += approval * (bloc.voter_count || 0);
                }
                weightedApproval = Math.round(wSum / totalBlocWeight * 100) / 100;
            }
            return {
                candidate_id: p.id,
                candidate_name: p.faction_name,
                party_name: p.party_name,
                faction_id: p.faction_id,
                ideology: p.ideology,
                trait_key: p.trait_key,
                approval: weightedApproval,
                votes: simResult.votes[p.id] || 0,
                vote_percentage: simResult.totalVotesCast > 0
                    ? Math.round(((simResult.votes[p.id] || 0) / simResult.totalVotesCast) * 10000) / 100
                    : 0
            };
        }).sort((a, b) => b.votes - a.votes);
    }

    const round1Results = buildCandidateResults(allCandidateParties, round1);

    // 8. Check for runoff
    const topPct = round1Results[0]?.vote_percentage || 0;
    let wasRunoff = false;
    let runoffResults = null;
    let round2Details = null;
    let winner;

    if (topPct > 50 || allCandidateParties.length <= 2) {
        // Clear winner — no runoff
        winner = round1Results[0];
        winner.winner = true;
    } else {
        // Runoff: top 2 advance, re-run simulation
        wasRunoff = true;
        const top2Ids = new Set([round1Results[0].candidate_id, round1Results[1].candidate_id]);
        const runoffParties = allCandidateParties.filter(p => top2Ids.has(p.id));

        // Build runoff-specific bloc approvals (only top 2 candidates)
        const runoffBlocApprovals = {};
        for (const [blocId, approvals] of Object.entries(allBlocApprovals)) {
            runoffBlocApprovals[blocId] = {};
            for (const p of runoffParties) {
                runoffBlocApprovals[blocId][p.id] = approvals[p.id] ?? 40;
            }
        }

        const round2 = runElectionSimulation(blocs, runoffParties, 0, runoffBlocApprovals);
        runoffResults = buildCandidateResults(runoffParties, round2);
        round2Details = round2.details;
        winner = runoffResults[0];
        winner.winner = true;
    }

    // Build candidate name lookup
    const candidateNames = {};
    for (const p of allCandidateParties) candidateNames[p.id] = p.faction_name;

    return {
        nation: nation.name,
        eligible_voters: eligibleVoters,
        total_votes_cast: round1.totalVotesCast,
        total_abstentions: round1.totalAbstentions,
        turnout_pct: eligibleVoters
            ? Math.round((round1.totalVotesCast / eligibleVoters) * 10000) / 100
            : 0,
        round_1_results: round1Results,
        round_1_details: round1.details,
        was_runoff: wasRunoff,
        runoff_results: runoffResults,
        runoff_details: round2Details,
        winner,
        candidateNames
    };
}

// ────────── sovereign-default ──────────

/**
 * sovereign-default.js — Sovereign Default system utilities and constants
 *
 * Provides shared functions for debt-to-GDP calculations, debt service burden,
 * credit deterioration, default consequence previews, and validation.
 * Used by both client-side UI (laws.html, economy.html) and server-side
 * advance-tick processing.
 */

// ==================== CONSTANTS ====================

// Stable UUIDs for programmatically managed crises (match SQL migration)
const SOVEREIGN_DEFAULT_CRISIS_ID = '00000000-0000-0000-0000-000000000002';
const SOVEREIGN_DEBT_CRISIS_ID    = '00000000-0000-0000-0000-000000000003';

const SOVEREIGN_DEFAULT_CONFIG = {
    // ── Proposal requirements ──
    DEFAULT_RESOLUTION_AP_COST: 6,
    VOTING_TICKS: 6,
    MIN_DEBT_TO_GDP: 1.5,              // 150% — button visibility threshold
    DEFAULT_COOLDOWN_TICKS: 50,        // nation-level cooldown after executed default
    PROPOSAL_COOLDOWN_TICKS: 120,      // cooldown after failed resolution

    // ── Crisis parameters ──
    CRISIS_MIN_DURATION: 20,           // minimum ticks before Sovereign Default Crisis can end
    CRISIS_CREDIT_CEILING: 25,         // Credit cannot exceed this during crisis
    CRISIS_FOREIGN_INV_CEILING: 30,    // Foreign Investment ceiling during crisis

    // ── Credit lockout ──
    CREDIT_LOCKOUT_THRESHOLD: 5,       // Credit <= this = locked out of borrowing

    // ── Debt service burden ──
    BURDEN_THRESHOLD: 1.0,             // debt-to-GDP ratio where burden kicks in
    BURDEN_MAX: 0.4,                   // maximum burden (40% spending reduction)
    BURDEN_SCALE: 0.2,                 // scaling factor: (ratio - 1.0) * 0.2

    // ── Filing market reactions (applied on bill creation) ──
    FILING_CURRENCY_HIT: -5,
    FILING_FOREIGN_INV_HIT: -3,

    // ── Vote failure consequences ──
    FAILURE_CURRENCY_RECOVERY: 3,
    FAILURE_FOREIGN_INV_RECOVERY: 3,
    FAILURE_PM_APPROVAL_HIT: -10,
    FAILURE_INTL_REP_HIT: -2,

    // ── Full default immediate penalties ──
    // For partial restructuring, multiply by (1 - repaymentRate)
    FULL_DEFAULT_CREDIT_HIT: -40,
    FULL_DEFAULT_CURRENCY_HIT: -25,
    FULL_DEFAULT_FOREIGN_INV_HIT: -25,
    FULL_DEFAULT_INTL_REP_HIT: -20,
    FULL_DEFAULT_INTEREST_SPIKE: 20,
    FULL_DEFAULT_INFLATION_SPIKE: 15,
    FULL_DEFAULT_TRADE_HIT: -10,
    FULL_DEFAULT_SOL_HIT: -8,
    FULL_DEFAULT_HAPPINESS_HIT: -10,
    FULL_DEFAULT_GOV_APPROVAL_HIT: -15,
    FULL_DEFAULT_WORKER_APPROVAL_HIT: -5,    // working class / debtor blocs
    FULL_DEFAULT_NATIONALIST_APPROVAL_HIT: -10, // nationalist blocs (partially sympathetic)

    // ── Per-tick Sovereign Default Crisis recovery rates ──
    CRISIS_CREDIT_RECOVERY: 0.5,
    CRISIS_FOREIGN_INV_RECOVERY: 0.3,
    CRISIS_CURRENCY_RECOVERY: 0.5,
    CRISIS_INFLATION_DECAY: -0.3,
    CRISIS_INTEREST_DECAY: -0.5,
    CRISIS_GDP_GROWTH_EARLY: -0.3,     // ticks 1-10 (recession)
    CRISIS_GDP_GROWTH_LATE: 0.2,       // ticks 11-20 (recovery)
    CRISIS_TRADE_RECOVERY: 0.2,
    CRISIS_GDP_GROWTH_PHASE_BREAK: 10, // tick at which recession turns to recovery

    // ── Austerity discount ──
    MAX_AUSTERITY_DISCOUNT: 0.4,       // up to 40% reduction in intl_rep/credit/foreign_inv penalties
    AUSTERITY_DISCOUNT_PER_CUT: 0.1,   // 10% reduction per committed spending cut

    // ── Austerity commitment validation ──
    AUSTERITY_MIN_REDUCTION: 1,
    AUSTERITY_MAX_REDUCTION: 20,
    AUSTERITY_MIN_TICKS: 5,
    AUSTERITY_MAX_TICKS: 20,
    AUSTERITY_MAX_COMMITMENTS: 4,

    // ── Contagion (credit hit to trading partners on default) ──
    CONTAGION_CREDIT_MIN: 2,
    CONTAGION_CREDIT_MAX: 5,

    // ── Sovereign Debt Crisis programmatic triggers ──
    DEBT_CRISIS_MIN_RATIO: 2.0,        // 200% debt-to-GDP
    DEBT_CRISIS_MAX_CREDIT: 15,        // Credit must be <= 15
};

// Stats that can be targeted by austerity commitments
const AUSTERITY_ELIGIBLE_STATS = [
    'benefits', 'healthcare_quality', 'healthcare_accessibility',
    'education_accessibility', 'higher_education', 'physical_infrastructure',
    'digital_infrastructure', 'rail_network', 'energy_generation'
];

// Stats whose policy effects are reduced by debt service burden
// (government-spending-dependent stats)
const SPENDING_AFFECTED_STATS = new Set([
    'healthcare_quality', 'healthcare_accessibility', 'beds_per_100k',
    'education_accessibility', 'higher_education', 'literacy',
    'physical_infrastructure', 'digital_infrastructure', 'rail_network',
    'benefits', 'social_mobility', 'standard_of_living',
    'energy_generation', 'crime_rate', 'incarceration_rate'
]);


// ==================== CORE UTILITY FUNCTIONS ====================

/**
 * Calculate debt-to-GDP ratio safely.
 * Returns ratio as a decimal (1.5 = 150%).
 * Guards against division by zero: GDP=0 with debt → Infinity, no debt → 0.
 *
 * @param {object} nation - Nation object with debt and gdp fields
 * @returns {number} Debt-to-GDP ratio
 */
function getDebtToGDP(nation) {
    const debt = Number(nation.debt ?? 0);
    const gdp = Number(nation.gdp ?? 0);
    if (gdp <= 0) return debt > 0 ? Infinity : 0;
    return debt / gdp;
}

/**
 * Calculate debt service burden (0.0 to 0.4).
 * This is the fraction of government spending effectiveness lost to
 * debt interest payments. Applied as a multiplier reduction on all
 * government-spending-related stats.
 *
 * Scales from 0% at 100% debt-to-GDP to ~40% at 300% debt-to-GDP.
 *
 * @param {object} nation - Nation object with debt and gdp fields
 * @returns {number} Burden as decimal (0.0 to 0.4)
 */
function calculateDebtServiceBurden(nation) {
    const ratio = getDebtToGDP(nation);
    if (!isFinite(ratio) || ratio <= SOVEREIGN_DEFAULT_CONFIG.BURDEN_THRESHOLD) return 0;
    return Math.min(
        SOVEREIGN_DEFAULT_CONFIG.BURDEN_MAX,
        (ratio - SOVEREIGN_DEFAULT_CONFIG.BURDEN_THRESHOLD) * SOVEREIGN_DEFAULT_CONFIG.BURDEN_SCALE
    );
}

/**
 * Get the spending effectiveness multiplier for a nation.
 * Returns 1.0 when no debt burden, down to 0.6 at maximum burden.
 *
 * @param {object} nation - Nation object
 * @returns {number} Multiplier (0.6 to 1.0)
 */
function getSpendingEffectivenessMultiplier(nation) {
    const burden = Number(nation.debt_service_burden ?? 0);
    return 1.0 - Math.min(SOVEREIGN_DEFAULT_CONFIG.BURDEN_MAX, Math.max(0, burden));
}

/**
 * Calculate per-tick credit deterioration based on debt-to-GDP bracket.
 * Returns the amount to subtract from credit each tick.
 *
 * Brackets:
 *   100-150%: -0.3/tick (slow erosion)
 *   150-200%: -0.7/tick (accelerating)
 *   200-250%: -1.2/tick (serious deterioration)
 *   250%+:    -2.0/tick (freefall)
 *
 * @param {object} nation - Nation object
 * @returns {number} Credit penalty per tick (0 to 2.0)
 */
function calculateCreditDeterioration(nation) {
    const ratio = getDebtToGDP(nation);
    if (!isFinite(ratio) || ratio <= 1.0) return 0;
    if (ratio <= 1.5) return 0.3;
    if (ratio <= 2.0) return 0.7;
    if (ratio <= 2.5) return 1.2;
    return 2.0;
}

/**
 * Calculate penalty multiplier for default consequences.
 * Full default = 1.0 (100% of penalties).
 * Partial restructuring scales inversely with repayment rate:
 *   70% repayment → 0.3 multiplier (30% of penalties)
 *   50% repayment → 0.5 multiplier (50% of penalties)
 *   30% repayment → 0.7 multiplier (70% of penalties)
 *
 * @param {string} defaultType - 'full' or 'partial_restructuring'
 * @param {number|null} repaymentRate - 0.3 to 0.7 (for partial)
 * @returns {number} Penalty multiplier (0.3 to 1.0)
 */
function getDefaultPenaltyMultiplier(defaultType, repaymentRate) {
    if (defaultType === 'full') return 1.0;
    return 1.0 - (repaymentRate || 0.5);
}

/**
 * Calculate austerity discount for international penalties.
 * Each valid spending cut commitment reduces International_Reputation,
 * Credit, and Foreign_Investment penalties by 10%, up to 40%.
 *
 * @param {Array} austerityCommitments - Array of commitment objects
 * @returns {number} Discount multiplier (0.0 to 0.4)
 */
function calculateAusterityDiscount(austerityCommitments) {
    if (!austerityCommitments || !Array.isArray(austerityCommitments)) return 0;
    const cfg = SOVEREIGN_DEFAULT_CONFIG;
    const validCuts = austerityCommitments.filter(c =>
        c && c.stat &&
        c.reduction >= cfg.AUSTERITY_MIN_REDUCTION &&
        c.reduction <= cfg.AUSTERITY_MAX_REDUCTION &&
        c.over_ticks >= cfg.AUSTERITY_MIN_TICKS &&
        c.over_ticks <= cfg.AUSTERITY_MAX_TICKS
    );
    return Math.min(cfg.MAX_AUSTERITY_DISCOUNT, validCuts.length * cfg.AUSTERITY_DISCOUNT_PER_CUT);
}

/**
 * Validate austerity commitment entries against rules.
 *
 * @param {Array} commitments - Array of { stat, reduction, over_ticks }
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateAusterityCommitments(commitments) {
    const errors = [];
    const cfg = SOVEREIGN_DEFAULT_CONFIG;

    if (!commitments || !Array.isArray(commitments)) {
        return { valid: true, errors: [] }; // empty is valid (optional)
    }

    if (commitments.length > cfg.AUSTERITY_MAX_COMMITMENTS) {
        errors.push(`Maximum ${cfg.AUSTERITY_MAX_COMMITMENTS} austerity commitments allowed.`);
    }

    const eligibleSet = new Set(AUSTERITY_ELIGIBLE_STATS);
    const seenStats = new Set();

    for (let i = 0; i < commitments.length; i++) {
        const c = commitments[i];
        const label = `Commitment ${i + 1}`;

        if (!c.stat || !eligibleSet.has(c.stat)) {
            errors.push(`${label}: Invalid stat "${c.stat}". Must be one of: ${AUSTERITY_ELIGIBLE_STATS.join(', ')}`);
        }

        if (seenStats.has(c.stat)) {
            errors.push(`${label}: Duplicate stat "${c.stat}". Each stat can only appear once.`);
        }
        seenStats.add(c.stat);

        const reduction = Number(c.reduction);
        if (!Number.isFinite(reduction) || reduction < cfg.AUSTERITY_MIN_REDUCTION || reduction > cfg.AUSTERITY_MAX_REDUCTION) {
            errors.push(`${label}: Reduction must be ${cfg.AUSTERITY_MIN_REDUCTION}-${cfg.AUSTERITY_MAX_REDUCTION} (got ${c.reduction}).`);
        }

        const ticks = Number(c.over_ticks);
        if (!Number.isFinite(ticks) || ticks < cfg.AUSTERITY_MIN_TICKS || ticks > cfg.AUSTERITY_MAX_TICKS) {
            errors.push(`${label}: Duration must be ${cfg.AUSTERITY_MIN_TICKS}-${cfg.AUSTERITY_MAX_TICKS} ticks (got ${c.over_ticks}).`);
        }
    }

    return { valid: errors.length === 0, errors };
}


// ==================== PROPOSAL ELIGIBILITY ====================

/**
 * Check if a nation can propose a Default Resolution.
 * Evaluates all preconditions: debt level, cooldowns, active resolutions.
 *
 * @param {object} nation - Nation object
 * @param {number} currentTick - Current server tick
 * @param {boolean} hasActiveResolution - Whether a default_resolution bill is active
 * @returns {{ canPropose: boolean, reason: string, debtToGDP?: number, ticksRemaining?: number }}
 */
function canProposeDefault(nation, currentTick, hasActiveResolution) {
    const cfg = SOVEREIGN_DEFAULT_CONFIG;
    const debt = Number(nation.debt ?? 0);
    const ratio = getDebtToGDP(nation);

    if (debt <= 0) {
        return { canPropose: false, reason: 'no_debt' };
    }

    if (ratio < cfg.MIN_DEBT_TO_GDP) {
        return { canPropose: false, reason: 'debt_too_low', debtToGDP: ratio };
    }

    if (hasActiveResolution) {
        return { canPropose: false, reason: 'active_resolution' };
    }

    if (nation.last_default_tick != null) {
        const ticksSinceDefault = currentTick - nation.last_default_tick;
        if (ticksSinceDefault < cfg.DEFAULT_COOLDOWN_TICKS) {
            return {
                canPropose: false,
                reason: 'default_cooldown',
                ticksRemaining: cfg.DEFAULT_COOLDOWN_TICKS - ticksSinceDefault,
                debtToGDP: ratio
            };
        }
    }

    return { canPropose: true, reason: 'eligible', debtToGDP: ratio };
}


// ==================== CONSEQUENCE PREVIEW ====================

/**
 * Preview all stat changes from a proposed default for the UI.
 * Helps players understand what they're signing up for before filing.
 *
 * @param {object} nation - Nation object with current stat values
 * @param {string} defaultType - 'full' or 'partial_restructuring'
 * @param {number|null} repaymentRate - 0.3-0.7 for partial
 * @param {Array} austerityCommitments - Optional commitments
 * @returns {object} Preview with debtAfter, statChanges, penaltyMultiplier, austerityDiscount
 */
function previewDefaultConsequences(nation, defaultType, repaymentRate, austerityCommitments) {
    const cfg = SOVEREIGN_DEFAULT_CONFIG;
    const multiplier = getDefaultPenaltyMultiplier(defaultType, repaymentRate);
    const discount = calculateAusterityDiscount(austerityCommitments || []);

    const currentDebt = Number(nation.debt ?? 0);
    const debtAfter = defaultType === 'full' ? 0 : Math.round(currentDebt * (repaymentRate || 0.5));

    // Apply discount to eligible penalties (credit, intl_rep, foreign_inv)
    const discountedMultiplier = multiplier * (1 - discount);

    const clamp = (current, delta) => Math.max(0, Math.min(100, Math.round((current + delta) * 10) / 10));

    const statChanges = {
        debt: { before: currentDebt, after: debtAfter, change: debtAfter - currentDebt },
        credit: {
            before: Number(nation.credit ?? 50),
            change: Math.round(cfg.FULL_DEFAULT_CREDIT_HIT * discountedMultiplier),
            after: clamp(Number(nation.credit ?? 50), cfg.FULL_DEFAULT_CREDIT_HIT * discountedMultiplier)
        },
        currency_strength: {
            before: Number(nation.currency_strength ?? 50),
            change: Math.round(cfg.FULL_DEFAULT_CURRENCY_HIT * multiplier),
            after: clamp(Number(nation.currency_strength ?? 50), cfg.FULL_DEFAULT_CURRENCY_HIT * multiplier)
        },
        foreign_investment: {
            before: Number(nation.foreign_investment ?? 50),
            change: Math.round(cfg.FULL_DEFAULT_FOREIGN_INV_HIT * discountedMultiplier),
            after: clamp(Number(nation.foreign_investment ?? 50), cfg.FULL_DEFAULT_FOREIGN_INV_HIT * discountedMultiplier)
        },
        international_reputation: {
            before: Number(nation.international_reputation ?? 50),
            change: Math.round(cfg.FULL_DEFAULT_INTL_REP_HIT * discountedMultiplier),
            after: clamp(Number(nation.international_reputation ?? 50), cfg.FULL_DEFAULT_INTL_REP_HIT * discountedMultiplier)
        },
        interest_rates: {
            before: Number(nation.interest_rates ?? 50),
            change: Math.round(cfg.FULL_DEFAULT_INTEREST_SPIKE * multiplier),
            after: clamp(Number(nation.interest_rates ?? 50), cfg.FULL_DEFAULT_INTEREST_SPIKE * multiplier)
        },
        inflation: {
            before: Number(nation.inflation ?? 50),
            change: Math.round(cfg.FULL_DEFAULT_INFLATION_SPIKE * multiplier),
            after: clamp(Number(nation.inflation ?? 50), cfg.FULL_DEFAULT_INFLATION_SPIKE * multiplier)
        },
        trade_balance: {
            before: Number(nation.trade_balance ?? 50),
            change: Math.round(cfg.FULL_DEFAULT_TRADE_HIT * multiplier),
            after: clamp(Number(nation.trade_balance ?? 50), cfg.FULL_DEFAULT_TRADE_HIT * multiplier)
        },
        standard_of_living: {
            before: Number(nation.standard_of_living ?? 50),
            change: Math.round(cfg.FULL_DEFAULT_SOL_HIT * multiplier),
            after: clamp(Number(nation.standard_of_living ?? 50), cfg.FULL_DEFAULT_SOL_HIT * multiplier)
        },
        happiness: {
            before: Number(nation.happiness ?? 50),
            change: Math.round(cfg.FULL_DEFAULT_HAPPINESS_HIT * multiplier),
            after: clamp(Number(nation.happiness ?? 50), cfg.FULL_DEFAULT_HAPPINESS_HIT * multiplier)
        }
    };

    return {
        defaultType,
        repaymentRate,
        penaltyMultiplier: multiplier,
        austerityDiscount: discount,
        debtBefore: currentDebt,
        debtAfter,
        debtReduction: currentDebt - debtAfter,
        statChanges,
        governmentApprovalHit: Math.round(cfg.FULL_DEFAULT_GOV_APPROVAL_HIT * multiplier),
        crisisMinDuration: cfg.CRISIS_MIN_DURATION,
        creditCeiling: cfg.CRISIS_CREDIT_CEILING,
        foreignInvCeiling: cfg.CRISIS_FOREIGN_INV_CEILING
    };
}


// ==================== DEBT DISTRESS LEVEL ====================

/**
 * Categorize the nation's debt distress level for UI display.
 *
 * @param {object} nation - Nation object
 * @returns {{ level: string, ratio: number, burden: number, locked: boolean, color: string }}
 */
function getDebtDistressLevel(nation) {
    const ratio = getDebtToGDP(nation);
    const burden = calculateDebtServiceBurden(nation);
    const locked = Boolean(nation.credit_locked_out);

    let level, color;
    if (ratio < 1.0) {
        level = 'healthy';
        color = 'green';
    } else if (ratio < 1.5) {
        level = 'elevated';
        color = 'yellow';
    } else if (ratio < 2.0) {
        level = 'distressed';
        color = 'orange';
    } else {
        level = 'critical';
        color = 'red';
    }

    return { level, ratio, burden, locked, color };
}

/**
 * Format a debt-to-GDP ratio for display (e.g. "152%").
 *
 * @param {number} ratio - Ratio as decimal (1.52)
 * @returns {string} Formatted string
 */
function formatDebtToGDP(ratio) {
    if (!isFinite(ratio)) return '∞';
    return Math.round(ratio * 100) + '%';
}



// ===== END GAME LOGIC =====


// ===== TICK-ONLY HELPERS (edge-function-only — not in game-common.js) =====

// ==================== POPULATION GROWTH ====================
//
// Population growth is derived from birth_rate and death_rate each tick:
//   base = 50 + (birth_rate - death_rate) / 2
//
// Any policy/crisis effects that modified population_growth are preserved
// as additive deltas on top of the base.
//
// The final population_growth (0-100) drives actual population change:
//   0   → -1% per tick (max decline)
//   50  → 0% per tick (equilibrium)
//   100 → +1% per tick (max growth)

async function processPopulationGrowth(supabase: any, nation: any, popGrowthBeforeEffects: number) {
    const birthRate = Number(nation.birth_rate ?? 50);
    const deathRate = Number(nation.death_rate ?? 50);

    // Base population growth from birth rate minus death rate
    const base = 50 + (birthRate - deathRate) / 2;

    // Policy/crisis delta: how much effects shifted population_growth this tick
    const currentPG = Number(nation.population_growth ?? 50);
    const policyDelta = currentPG - popGrowthBeforeEffects;

    // Final population_growth = base + policy adjustments, clamped 0-100
    const finalPG = Math.round(Math.max(0, Math.min(100, base + policyDelta)) * 10) / 10;

    // Population change: linear mapping from 0-100 to -1%..+1% per tick
    const population = Number(nation.population ?? 0);
    const monthlyRate = ((finalPG - 50) / 50) * 0.01;
    const popChange = Math.round(population * monthlyRate);
    const newPopulation = Math.max(0, population + popChange);

    // Scale eligible_voters proportionally
    const eligibleVoters = Number(nation.eligible_voters ?? 0);
    const voterRatio = population > 0 ? (eligibleVoters / population) : 0;
    const newEligibleVoters = Math.round(newPopulation * voterRatio);

    const updates: any = {
        population_growth: finalPG,
        population: newPopulation,
        eligible_voters: newEligibleVoters
    };

    if (finalPG !== currentPG || popChange !== 0) {
        const { error } = await supabase.from('nations').update(updates).eq('id', nation.id);
        if (error) {
            console.error(`[processPopulationGrowth] Update failed for ${nation.name}:`, error.message);
            return null;
        }
        Object.assign(nation, updates);
        console.log(`[processPopulationGrowth] ${nation.name}: birth=${birthRate} death=${deathRate} base=${base.toFixed(1)} delta=${policyDelta.toFixed(1)} final=${finalPG} pop_change=${popChange > 0 ? '+' : ''}${popChange}`);
    }

    return { base, policyDelta, finalPG, popChange, newPopulation, newEligibleVoters };
}


async function processIncumbentCampaignBonuses(supabase, nation, currentTick) {
    if (!isPresidentialRepublic(nation)) return;

    const { data: president } = await supabase
        .from('presidents')
        .select('id, faction_id, first_name, last_name')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!president) return;

    const leadTicks = GAME_CONFIG.PRESIDENTIAL_CANDIDATE_LEAD_TICKS;
    const { data: upcomingElection } = await supabase
        .from('elections')
        .select('id, election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .gt('election_tick', currentTick)
        .lte('election_tick', currentTick + leadTicks)
        .limit(1)
        .maybeSingle();

    if (!upcomingElection) return;

    const ticksToElection = upcomingElection.election_tick - currentTick;
    console.log(`Campaign bonuses for incumbent ${president.first_name} ${president.last_name} in ${nation.name} (${ticksToElection} ticks to election)`);

    await adjustMomentumAll(supabase, nation.id, president.faction_id, 2, 'campaign:incumbent_bonus');

    const { data: nationStats } = await supabase
        .from('nations')
        .select('stability, happiness')
        .eq('id', nation.id)
        .single();

    if (nationStats) {
        const updates = {};
        if ((nationStats.stability || 0) >= 60) {
            updates.happiness = Math.max(0, Math.min(100, Math.round(((nationStats.happiness || 50) + 1) * 10) / 10));
        }
        if ((nationStats.happiness || 0) >= 60) {
            updates.stability = Math.max(0, Math.min(100, Math.round(((nationStats.stability || 50) + 1) * 10) / 10));
        }
        if (Object.keys(updates).length > 0) {
            await supabase.from('nations').update(updates).eq('id', nation.id);
        }
    }
}

function advanceMonth(currentDate) {
    const parts = currentDate.split(',');
    const month = parts[0].trim();
    const year = parseInt(parts[1].trim());

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const idx = months.indexOf(month);
    if (idx === -1) { console.error('Invalid month:', month); return currentDate; }

    const nextIdx = (idx + 1) % 12;
    const nextYear = nextIdx === 0 ? year + 1 : year;
    return `${months[nextIdx]}, ${nextYear}`;
}

async function acquireTickLock(supabase) {
    const STALE_LOCK_MS = 5 * 60 * 1000; // 5 minutes
    const now = new Date().toISOString();

    // Attempt: acquire lock when tick_processing is false
    const { data: acquired, error: err1 } = await supabase
        .from('shard')
        .update({ tick_processing: true, tick_processing_started_at: now })
        .eq('name', 'Alpha Shard')
        .eq('tick_processing', false)
        .select('name');

    if (!err1 && acquired && acquired.length > 0) return true;

    // Check for stale lock (crashed tab)
    const { data: shard } = await supabase
        .from('shard')
        .select('tick_processing, tick_processing_started_at')
        .eq('name', 'Alpha Shard')
        .single();

    if (shard && shard.tick_processing && shard.tick_processing_started_at) {
        const lockAge = Date.now() - new Date(shard.tick_processing_started_at).getTime();
        if (lockAge > STALE_LOCK_MS) {
            console.warn('Stale tick lock detected (' + Math.round(lockAge / 1000) + 's old), forcing acquire');
            const { data: forced, error: err2 } = await supabase
                .from('shard')
                .update({ tick_processing: true, tick_processing_started_at: now })
                .eq('name', 'Alpha Shard')
                .eq('tick_processing', true)
                .select('name');
            return !err2 && forced && forced.length > 0;
        }
    }

    return false;
}

async function releaseTickLock(supabase) {
    await supabase
        .from('shard')
        .update({ tick_processing: false, tick_processing_started_at: null })
        .eq('name', 'Alpha Shard');
}

/**
 * Scan all effect records in the database for invalid stat keys.
 * Logs errors for any stat_key that doesn't match NATION_STAT_COLUMNS
 * (after alias resolution). Runs periodically as a safety net.
 */
async function auditStatKeys(supabase) {
    const invalid = [];

    // 1. Policy stat_effects
    const { data: policies } = await supabase.from('policies').select('id, policy_name, stat_effects');
    for (const p of (policies || [])) {
        for (const eff of (p.stat_effects || [])) {
            const resolved = normalizeNationStatKey(eff.stat_key);
            if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
                invalid.push({ source: 'policy', name: p.policy_name, id: p.id, bad_key: eff.stat_key });
            }
        }
    }

    // 2. Crisis effects
    const { data: crisisEffects } = await supabase.from('crisis_effects').select('id, crisis_template_id, stat_key, target');
    for (const ce of (crisisEffects || [])) {
        if (ce.target !== 'nation') continue;
        const resolved = normalizeNationStatKey(ce.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'crisis_effect', id: ce.id, template_id: ce.crisis_template_id, bad_key: ce.stat_key });
        }
    }

    // 3. Crisis triggers
    const { data: crisisTriggers } = await supabase.from('crisis_triggers').select('id, crisis_template_id, stat_key');
    for (const ct of (crisisTriggers || [])) {
        const resolved = normalizeNationStatKey(ct.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'crisis_trigger', id: ct.id, template_id: ct.crisis_template_id, bad_key: ct.stat_key });
        }
    }

    // 4. Crisis end triggers
    const { data: crisisEndTriggers } = await supabase.from('crisis_end_triggers').select('id, crisis_template_id, stat_key');
    for (const cet of (crisisEndTriggers || [])) {
        const resolved = normalizeNationStatKey(cet.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'crisis_end_trigger', id: cet.id, template_id: cet.crisis_template_id, bad_key: cet.stat_key });
        }
    }

    // 5. Event effects
    const { data: eventEffects } = await supabase.from('event_effects').select('id, event_id, stat_key, target');
    for (const ee of (eventEffects || [])) {
        if (ee.target !== 'nation') continue;
        const resolved = normalizeNationStatKey(ee.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'event_effect', id: ee.id, event_id: ee.event_id, bad_key: ee.stat_key });
        }
    }

    // 6. Event triggers
    const { data: eventTriggers } = await supabase.from('event_triggers').select('id, event_id, stat_key');
    for (const et of (eventTriggers || [])) {
        if (!et.stat_key) continue;
        const resolved = normalizeNationStatKey(et.stat_key);
        if (!resolved || !NATION_STAT_COLUMN_SET.has(resolved)) {
            invalid.push({ source: 'event_trigger', id: et.id, event_id: et.event_id, bad_key: et.stat_key });
        }
    }

    if (invalid.length > 0) {
        console.error(`[auditStatKeys] Found ${invalid.length} invalid stat key(s) in the database:`);
        for (const entry of invalid) {
            console.error(`  - ${entry.source}: "${entry.bad_key}" (id=${entry.id}${entry.name ? ', name=' + entry.name : ''})`);
        }
    } else {
        console.log('[auditStatKeys] All stat keys valid.');
    }

    return invalid;
}

/**
 * Grant AP rewards for long-form writing published this tick.
 * - Op-eds with 1000+ words: +2 AP to author faction
 * - Player articles with 500+ words: +1 AP to author faction
 * Marks rows as rewarded so they aren't double-counted.
 */
async function processWritingRewards(supabase, nationId, currentTick) {
    const rewards = [];

    // Op-ed rewards: reward_ap > 0 and published_tick = currentTick
    const { data: opeds } = await supabase
        .from('op_eds')
        .select('id, author_faction_id, reward_ap')
        .eq('nation_id', nationId)
        .eq('published_tick', currentTick)
        .gt('reward_ap', 0)
        .eq('reward_granted', false);

    for (const oped of (opeds || [])) {
        if (!oped.author_faction_id || !oped.reward_ap) continue;
        const { error } = await supabase.rpc('deduct_ap', {
            p_faction_id: oped.author_faction_id,
            p_cost: -oped.reward_ap  // Negative cost = add AP
        });
        if (!error) {
            await supabase.from('op_eds').update({ reward_granted: true }).eq('id', oped.id);
            rewards.push({ type: 'oped', factionId: oped.author_faction_id, ap: oped.reward_ap });
            console.log(`[processWritingRewards] Op-ed reward: +${oped.reward_ap} AP to faction ${oped.author_faction_id}`);
        }
    }

    // Player article rewards
    const { data: articles } = await supabase
        .from('player_articles')
        .select('id, author_faction_id, reward_ap')
        .eq('nation_id', nationId)
        .eq('published_tick', currentTick)
        .gt('reward_ap', 0)
        .eq('reward_granted', false);

    for (const article of (articles || [])) {
        if (!article.author_faction_id || !article.reward_ap) continue;
        const { error } = await supabase.rpc('deduct_ap', {
            p_faction_id: article.author_faction_id,
            p_cost: -article.reward_ap  // Negative cost = add AP
        });
        if (!error) {
            await supabase.from('player_articles').update({ reward_granted: true }).eq('id', article.id);
            rewards.push({ type: 'article', factionId: article.author_faction_id, ap: article.reward_ap });
            console.log(`[processWritingRewards] Article reward: +${article.reward_ap} AP to faction ${article.author_faction_id}`);
        }
    }

    return rewards;
}

/**
 * Process lingering approval decay from minister purges (autocracy mechanic).
 */
async function processPurgeDecay(supabase, nationId, currentTick) {
    const { data: purgeActions } = await supabase
        .from('campaign_actions')
        .select('id, party_id, result')
        .eq('nation_id', nationId)
        .eq('action_type', 'purge_minister');

    if (!purgeActions || purgeActions.length === 0) return;

    for (const action of purgeActions) {
        const result = action.result;
        if (!result || !result.decay_ticks_remaining || result.decay_ticks_remaining <= 0) continue;

        const decayRate = result.decay_rate || 1;
        await adjustMomentumAll(supabase, nationId, action.party_id, -decayRate, 'purge:decay');

        const newRemaining = result.decay_ticks_remaining - 1;
        await supabase.from('campaign_actions')
            .update({ result: { ...result, decay_ticks_remaining: newRemaining } })
            .eq('id', action.id);
    }
}

// ==================== SOVEREIGN DEFAULT — TICK-ONLY HELPERS ====================

/**
 * Per-tick debt mechanics: update burden, deteriorate credit, check lockout,
 * and programmatically trigger a Sovereign Debt Crisis when conditions are met.
 */
async function processSovereignDebtMechanics(supabase, nation, currentTick) {
    const ratio = getDebtToGDP(nation);
    if (!isFinite(ratio)) return null;

    const burden = calculateDebtServiceBurden(nation);
    const creditDeterioration = calculateCreditDeterioration(nation);
    const currentCredit = Number(nation.credit ?? 50);
    const cfg = SOVEREIGN_DEFAULT_CONFIG;

    const updates: any = {};
    const results: any = { nationId: nation.id, ratio, burden };

    // 1. Update debt_service_burden if changed
    const oldBurden = Number(nation.debt_service_burden ?? 0);
    if (Math.abs(burden - oldBurden) > 0.001) {
        updates.debt_service_burden = Math.round(burden * 1000) / 1000;
        results.burdenChanged = true;
    }

    // 2. Apply credit deterioration (per-tick penalty from high debt)
    if (creditDeterioration > 0 && currentCredit > 0) {
        const newCredit = Math.max(0, Math.round((currentCredit - creditDeterioration) * 10) / 10);
        updates.credit = newCredit;
        results.creditDeterioration = creditDeterioration;
        results.creditBefore = currentCredit;
        results.creditAfter = newCredit;
    }

    // 3. Check credit lockout (credit <= 5 means locked out of borrowing)
    const effectiveCredit = updates.credit !== undefined ? updates.credit : currentCredit;
    const wasLocked = Boolean(nation.credit_locked_out);
    const shouldLock = effectiveCredit <= cfg.CREDIT_LOCKOUT_THRESHOLD;
    if (shouldLock !== wasLocked) {
        updates.credit_locked_out = shouldLock;
        results.creditLockoutChanged = shouldLock;
    }

    // Write updates
    if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('nations').update(updates).eq('id', nation.id);
        if (error) {
            console.error(`[SovereignDebt] Update failed for ${nation.name}:`, error.message);
            return results;
        }
        Object.assign(nation, updates);
    }

    // 4. Programmatically trigger Sovereign Debt Crisis when:
    //    debt-to-GDP > 200% AND credit <= 15 AND no crisis already active
    if (ratio >= cfg.DEBT_CRISIS_MIN_RATIO && effectiveCredit <= cfg.DEBT_CRISIS_MAX_CREDIT) {
        const { data: existing } = await supabase
            .from('active_crises')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('crisis_id', SOVEREIGN_DEBT_CRISIS_ID);

        if (!existing || existing.length === 0) {
            const { error: insertErr } = await supabase.from('active_crises').insert({
                crisis_id: SOVEREIGN_DEBT_CRISIS_ID,
                nation_id: nation.id,
                started_at_tick: currentTick,
                effects_applied_log: []
            });
            if (!insertErr) {
                results.debtCrisisTriggered = true;
                console.log(`[SovereignDebt] Debt Crisis triggered for ${nation.name} (ratio=${(ratio * 100).toFixed(0)}%, credit=${effectiveCredit})`);
                await supabase.from('event_log').insert({
                    nation_id: nation.id,
                    event_name: 'CRISIS_STARTED: Sovereign Debt Crisis',
                    description_used: `Crushing debt (${(ratio * 100).toFixed(0)}% of GDP) and low creditworthiness have triggered a sovereign debt crisis.`,
                    category: 'crisis',
                    effects_applied: [],
                    fired_at_tick: currentTick
                });
            }
        }
    }

    if (results.burdenChanged || results.creditDeterioration || results.creditLockoutChanged || results.debtCrisisTriggered) {
        console.log(`[SovereignDebt] ${nation.name}: ratio=${(ratio * 100).toFixed(0)}% burden=${burden.toFixed(3)} credit=${effectiveCredit}${shouldLock ? ' LOCKED' : ''}`);
    }

    return results;
}

/**
 * Called when a default_resolution bill passes.
 * Applies immediate penalties, reduces debt, starts Sovereign Default Crisis,
 * records history, and triggers contagion on trade partners.
 */
async function enactSovereignDefault(supabase, bill, currentTick) {
    const cfg = SOVEREIGN_DEFAULT_CONFIG;

    // 1. Look up the default_resolution record
    const { data: resolution } = await supabase
        .from('default_resolutions')
        .select('*')
        .eq('bill_id', bill.id)
        .single();

    if (!resolution) {
        console.error(`[enactSovereignDefault] No default_resolution found for bill ${bill.id}`);
        return;
    }

    // 2. Fetch fresh nation data
    const { data: nation } = await supabase
        .from('nations')
        .select('*')
        .eq('id', bill.nation_id)
        .single();
    if (!nation) return;

    // 3. Calculate multipliers
    const multiplier = getDefaultPenaltyMultiplier(resolution.default_type, resolution.repayment_rate);
    const discount = calculateAusterityDiscount(resolution.austerity_commitments || []);
    const discountedMultiplier = multiplier * (1 - discount);

    // 4. Calculate new debt
    const currentDebt = Number(nation.debt ?? 0);
    const debtAfter = resolution.default_type === 'full'
        ? 0
        : Math.round(currentDebt * (resolution.repayment_rate || 0.5));

    // 5. Apply immediate stat penalties
    const clamp = (val, delta) => Math.max(0, Math.min(100, Math.round((val + delta) * 10) / 10));

    const nationUpdates: any = {
        debt: debtAfter,
        last_default_tick: currentTick,
        credit: clamp(Number(nation.credit ?? 50), cfg.FULL_DEFAULT_CREDIT_HIT * discountedMultiplier),
        currency_strength: clamp(Number(nation.currency_strength ?? 50), cfg.FULL_DEFAULT_CURRENCY_HIT * multiplier),
        foreign_investment: clamp(Number(nation.foreign_investment ?? 50), cfg.FULL_DEFAULT_FOREIGN_INV_HIT * discountedMultiplier),
        international_reputation: clamp(Number(nation.international_reputation ?? 50), cfg.FULL_DEFAULT_INTL_REP_HIT * discountedMultiplier),
        interest_rates: clamp(Number(nation.interest_rates ?? 50), cfg.FULL_DEFAULT_INTEREST_SPIKE * multiplier),
        inflation: clamp(Number(nation.inflation ?? 50), cfg.FULL_DEFAULT_INFLATION_SPIKE * multiplier),
        trade_balance: clamp(Number(nation.trade_balance ?? 50), cfg.FULL_DEFAULT_TRADE_HIT * multiplier),
        standard_of_living: clamp(Number(nation.standard_of_living ?? 50), cfg.FULL_DEFAULT_SOL_HIT * multiplier),
        happiness: clamp(Number(nation.happiness ?? 50), cfg.FULL_DEFAULT_HAPPINESS_HIT * multiplier),
    };

    // Re-derive debt_service_burden and credit lockout from new values
    nationUpdates.debt_service_burden = (() => {
        const gdp = Number(nation.gdp ?? 0);
        if (gdp <= 0 || debtAfter <= 0) return 0;
        const newRatio = debtAfter / gdp;
        if (newRatio <= cfg.BURDEN_THRESHOLD) return 0;
        return Math.round(Math.min(cfg.BURDEN_MAX, (newRatio - cfg.BURDEN_THRESHOLD) * cfg.BURDEN_SCALE) * 1000) / 1000;
    })();
    nationUpdates.credit_locked_out = nationUpdates.credit <= cfg.CREDIT_LOCKOUT_THRESHOLD;

    const { error: updateErr } = await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
    if (updateErr) {
        console.error(`[enactSovereignDefault] Nation update failed:`, updateErr.message);
        return;
    }

    console.log(`[enactSovereignDefault] ${nation.name}: ${resolution.default_type} default enacted. Debt ${currentDebt} → ${debtAfter}, multiplier=${multiplier.toFixed(2)}, discount=${discount.toFixed(2)}`);

    // 6. Government approval shock
    await adjustGovernmentApprovalEvent(supabase, nation.id, cfg.FULL_DEFAULT_GOV_APPROVAL_HIT * multiplier, 'sovereign_default:enacted');

    // 7. Record in default_history
    await supabase.from('default_history').insert({
        nation_id: nation.id,
        default_resolution_id: resolution.id,
        default_type: resolution.default_type,
        repayment_rate: resolution.repayment_rate,
        debt_before: currentDebt,
        debt_after: debtAfter,
        executed_at_tick: currentTick
    });

    // 8. Update resolution status
    await supabase.from('default_resolutions').update({
        status: 'passed',
        resolved_at_tick: currentTick
    }).eq('id', resolution.id);

    // 9. Start Sovereign Default Crisis
    const { data: existingCrisis } = await supabase
        .from('active_crises')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('crisis_id', SOVEREIGN_DEFAULT_CRISIS_ID);

    if (!existingCrisis || existingCrisis.length === 0) {
        await supabase.from('active_crises').insert({
            crisis_id: SOVEREIGN_DEFAULT_CRISIS_ID,
            nation_id: nation.id,
            started_at_tick: currentTick,
            effects_applied_log: []
        });
        console.log(`[enactSovereignDefault] Sovereign Default Crisis started for ${nation.name}`);
    }

    // 10. Event log
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'CRISIS_STARTED: Sovereign Default',
        description_used: `${nation.name} has ${resolution.default_type === 'full' ? 'fully defaulted on' : 'partially restructured'} its sovereign debt. International markets react with alarm.`,
        category: 'crisis',
        effects_applied: [],
        fired_at_tick: currentTick
    });

    // 11. Contagion — hit trade partners' credit
    try {
        // Find nations that trade with this nation (from most recent tick data)
        const { data: partners } = await supabase
            .from('trade_partners')
            .select('importer_nation_id, trade_volume')
            .eq('exporter_nation_id', nation.id)
            .order('tick', { ascending: false })
            .limit(50);

        const { data: partners2 } = await supabase
            .from('trade_partners')
            .select('exporter_nation_id, trade_volume')
            .eq('importer_nation_id', nation.id)
            .order('tick', { ascending: false })
            .limit(50);

        // Unique set of partner nation IDs
        const partnerIds = new Set<string>();
        (partners || []).forEach(p => partnerIds.add(p.importer_nation_id));
        (partners2 || []).forEach(p => partnerIds.add(p.exporter_nation_id));
        partnerIds.delete(nation.id); // exclude self

        for (const partnerId of partnerIds) {
            // Random contagion hit within range
            const hit = -(cfg.CONTAGION_CREDIT_MIN + Math.random() * (cfg.CONTAGION_CREDIT_MAX - cfg.CONTAGION_CREDIT_MIN));
            const { data: partnerNation } = await supabase
                .from('nations')
                .select('credit, name')
                .eq('id', partnerId)
                .single();

            if (partnerNation) {
                const newCredit = Math.max(0, Math.round((Number(partnerNation.credit ?? 50) + hit) * 10) / 10);
                await supabase.from('nations').update({ credit: newCredit }).eq('id', partnerId);
                console.log(`[Contagion] ${partnerNation.name}: credit ${hit.toFixed(1)} (${nation.name} default)`);

                await supabase.from('event_log').insert({
                    nation_id: partnerId,
                    event_name: 'Sovereign Default Contagion',
                    description_used: `${nation.name}'s sovereign default has shaken investor confidence in the region.`,
                    category: 'economy',
                    effects_applied: [{ stat: 'credit', change: Math.round(hit * 10) / 10 }],
                    fired_at_tick: currentTick
                });
            }
        }
        console.log(`[Contagion] ${partnerIds.size} trade partners affected by ${nation.name}'s default`);
    } catch (contagionErr) {
        console.error(`[Contagion] Failed:`, contagionErr);
    }
}

/**
 * Called when a default_resolution bill fails.
 * Applies failure consequences: partial market recovery, PM approval hit.
 */
async function handleFailedDefaultResolution(supabase, bill, currentTick) {
    const cfg = SOVEREIGN_DEFAULT_CONFIG;

    // 1. Look up the default_resolution record
    const { data: resolution } = await supabase
        .from('default_resolutions')
        .select('*')
        .eq('bill_id', bill.id)
        .single();

    if (!resolution) {
        console.error(`[handleFailedDefaultResolution] No default_resolution found for bill ${bill.id}`);
        return;
    }

    // 2. Fetch nation
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, currency_strength, foreign_investment, international_reputation')
        .eq('id', bill.nation_id)
        .single();
    if (!nation) return;

    // 3. Apply failure consequences: partial market recovery from filing shock,
    //    but PM takes an approval hit for the failed political gambit
    const clamp = (val, delta) => Math.max(0, Math.min(100, Math.round((val + delta) * 10) / 10));

    const updates: any = {
        currency_strength: clamp(Number(nation.currency_strength ?? 50), cfg.FAILURE_CURRENCY_RECOVERY),
        foreign_investment: clamp(Number(nation.foreign_investment ?? 50), cfg.FAILURE_FOREIGN_INV_RECOVERY),
        international_reputation: clamp(Number(nation.international_reputation ?? 50), cfg.FAILURE_INTL_REP_HIT),
    };

    await supabase.from('nations').update(updates).eq('id', nation.id);
    await adjustGovernmentApprovalEvent(supabase, nation.id, cfg.FAILURE_PM_APPROVAL_HIT, 'sovereign_default:failed');

    // 4. Update resolution status
    await supabase.from('default_resolutions').update({
        status: 'failed',
        resolved_at_tick: currentTick
    }).eq('id', resolution.id);

    // 5. Event log
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'Default Resolution Failed',
        description_used: `Parliament rejected the sovereign default resolution. Markets show cautious relief, but the government's credibility has taken a hit.`,
        category: 'economy',
        effects_applied: [
            { stat: 'currency_strength', change: cfg.FAILURE_CURRENCY_RECOVERY },
            { stat: 'foreign_investment', change: cfg.FAILURE_FOREIGN_INV_RECOVERY },
            { stat: 'international_reputation', change: cfg.FAILURE_INTL_REP_HIT }
        ],
        fired_at_tick: currentTick
    });

    console.log(`[handleFailedDefaultResolution] ${nation.name}: resolution failed, market partial recovery applied`);
}

/**
 * Per-tick processing of active austerity commitments from enacted defaults.
 * Applies gradual stat reductions as promised in the default resolution.
 */
async function processAusterityCommitments(supabase, nation, currentTick) {
    // Find default_resolutions with active austerity commitments for this nation
    const { data: resolutions } = await supabase
        .from('default_resolutions')
        .select('id, austerity_commitments, resolved_at_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'passed')
        .not('austerity_commitments', 'eq', '[]');

    if (!resolutions || resolutions.length === 0) return [];

    const results = [];
    const nationUpdates: any = {};

    for (const res of resolutions) {
        const commitments = res.austerity_commitments || [];
        if (!Array.isArray(commitments) || commitments.length === 0) continue;

        const resolvedTick = res.resolved_at_tick || 0;
        const ticksElapsed = currentTick - resolvedTick;
        let allComplete = true;

        for (const commitment of commitments) {
            if (!commitment.stat || !commitment.reduction || !commitment.over_ticks) continue;

            // Skip if already complete
            if (ticksElapsed > commitment.over_ticks) continue;
            if (ticksElapsed <= 0) { allComplete = false; continue; }

            allComplete = false;

            // Apply per-tick reduction: total_reduction / duration_ticks
            const perTickReduction = commitment.reduction / commitment.over_ticks;
            const resolvedKey = normalizeNationStatKey(commitment.stat);
            if (!resolvedKey || !NATION_STAT_COLUMN_SET.has(resolvedKey)) continue;

            const currentVal = Number(nation[resolvedKey] ?? 50);
            const newVal = Math.max(0, Math.round((currentVal - perTickReduction) * 10) / 10);

            if (newVal !== currentVal) {
                nationUpdates[resolvedKey] = newVal;
                nation[resolvedKey] = newVal;
                results.push({ stat: resolvedKey, change: -perTickReduction, ticksRemaining: commitment.over_ticks - ticksElapsed });
            }
        }
    }

    if (Object.keys(nationUpdates).length > 0) {
        await supabase.from('nations').update(nationUpdates).eq('id', nation.id);
        console.log(`[Austerity] ${nation.name}: applied ${results.length} commitment adjustment(s)`);
    }

    return results;
}

// ==================== ADVANCE TICK ====================

async function advanceTick(supabase, { force = false, reprocess = false } = {}) {
    // 1. Pre-compute next tick metadata
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick, tick_interval_hours, current_date, next_tick_at')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) throw new Error('Shard not found');

    // Reprocess mode: re-run game effects for the CURRENT tick without advancing
    const newTick = reprocess ? (shard.current_tick || 0) : (shard.current_tick || 0) + 1;
    if (reprocess) console.log(`[advanceTick] REPROCESS mode — re-running effects for tick ${newTick} (no advance)`);
    const intervalMs = (shard.tick_interval_hours || 12) * 60 * 60 * 1000;
    const now = Date.now();
    // Always anchor next tick from NOW + interval.
    // The cron fires every minute so drift is negligible, and this avoids
    // compounding issues when manual advances or interval changes shift next_tick_at.
    const nextTickAt = new Date(now + intervalMs);
    // Compute date directly from tick number to prevent drift between
    // shard.current_date (string-based) and tickToDate() (tick-based).
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const newDate = `${MONTHS[newTick % 12]}, ${2000 + Math.floor(newTick / 12)}`;

    // 2. Load all nations
    const { data: nations } = await supabase.from('nations').select('*');
    const nationList = nations || [];

    // Lazy-loaded once per tick for all nations
    let _statConnections = null;
    let _institutionConfig = null;

    const summary = {
        tick: newTick,
        nations: nationList.length,
        effects: [],
        costs: [],
        resolutions: [],
        events: [],
        apFailures: []
    };
    const failedNationIds = new Set();
    const failedFactionIds = new Set();

    // Accumulate AP for party factions each tick:
    // base 3 AP, +2 if in government coalition or strongman. Capped at MAX_AP (10).
    // Uses atomic RPC to prevent race conditions with concurrent player deductions.
    // Skip AP accumulation in reprocess mode — AP was already granted on the original tick.
    let apDistributed = 0;
    let apFailed = 0;
    if (reprocess) {
        console.log(`[advanceTick] REPROCESS mode — skipping AP accumulation`);
    }
    for (const nation of (reprocess ? [] : nationList)) {
      try {
        const { data: factions } = await supabase
            .from('factions')
            .select('id, approval_rating, faction_type')
            .eq('nation_id', nation.id)
            .eq('faction_type', 'party');

        if (!factions || factions.length === 0) continue;

        const coalition = await fetchActiveCoalition(supabase, nation.id);
        const governmentPartyIds = new Set([
            ...(coalition?.party_ids || []),
            nation.ruling_faction_id
        ].filter(Boolean));

        for (const faction of factions) {
            const isInGovernment = governmentPartyIds.has(faction.id);
            let apGain = 3;
            if (isInGovernment) apGain += 2;

            // Family member successor penalty: ruling faction loses 1 AP/tick
            if (nation.successor_is_family_member && faction.id === nation.ruling_faction_id) {
                apGain = Math.max(1, apGain - 1);
            }

            const result = await accumulateAP(supabase, faction.id, apGain);
            if (result.success) {
                console.log(`[advanceTick] AP: faction ${faction.id} → ${result.newAp} (+${apGain})`);
                apDistributed++;
            } else {
                console.error(`[advanceTick] AP accumulation FAILED for faction ${faction.id}: ${result.error}`);
                apFailed++;
                summary.apFailures.push({
                    nationId: nation.id,
                    nation: nation.name,
                    factionId: faction.id,
                    error: result.error
                });
                failedNationIds.add(nation.id);
                failedFactionIds.add(faction.id);
            }
        }
      } catch (apErr) {
        console.error(`[advanceTick] AP distribution FAILED for nation ${nation.id} (${nation.name}):`, apErr);
        summary.errors = summary.errors || [];
        summary.errors.push({ nation: nation.name, nationId: nation.id, phase: 'ap_distribution', error: String(apErr) });
        apFailed++;
        summary.apFailures.push({
            nationId: nation.id,
            nation: nation.name,
            factionId: null,
            error: String(apErr)
        });
        failedNationIds.add(nation.id);
      }
    }
    summary.apDistributed = apDistributed;
    summary.apFailed = apFailed;

    if (apFailed > 0) {
        // Log AP failures but DO NOT abort the tick.
        // AP is non-critical — stats, elections, history snapshots, and the
        // entire simulation must continue even if AP distribution fails.
        // Aborting here previously caused the shard tick to never advance,
        // freezing all stat updates, arrows, and game progression.
        console.error(`[advanceTick] AP distribution had ${apFailed} failure(s) — continuing tick processing`);
        summary.apWarnings = {
            failedNationIds: Array.from(failedNationIds),
            failedFactionIds: Array.from(failedFactionIds),
            message: `AP distribution failed for ${apFailed} faction(s); tick processing continued.`
        };
    }

    // NOTE: Shard tick/date commit moved to AFTER nation processing (see below).
    // This prevents the tick number from advancing if the function times out
    // during nation processing, which would cause skipped game effects.

    // Clear expired coup cooldowns
    await supabase.from('factions')
        .update({ action_lockout_until_tick: null })
        .not('action_lockout_until_tick', 'is', null)
        .lte('action_lockout_until_tick', newTick);

    // Periodic integrity scan for invalid stat keys
    if (newTick % 10 === 1) {
        try {
            await auditStatKeys(supabase);
        } catch (auditErr) {
            console.error('[advanceTick] auditStatKeys failed (non-fatal):', auditErr);
        }
    }

    // 3.5 Trade engine — runs across ALL nations simultaneously
    try {
        const tradeResult = await processTradeFlows(supabase, nationList, newTick);
        if (tradeResult.processed > 0) {
            summary.trade = tradeResult;
            console.log(`[advanceTick] Trade: ${tradeResult.processed} nations, $${Math.round(tradeResult.totalVolume).toLocaleString()} volume`);
        }
    } catch (tradeErr) {
        console.error('[advanceTick] Trade processing failed (non-fatal):', tradeErr);
    }

    // 3.6 Expire trade agreements (including economic aid) that have passed their expires_at_tick
    try {
        const expiredAgreements = await processExpiredTradeAgreements(supabase, newTick);
        if (expiredAgreements.length > 0) {
            summary.expiredAgreements = expiredAgreements;
            console.log(`[advanceTick] Expired ${expiredAgreements.length} trade agreement(s)`);
        }
    } catch (expErr) {
        console.error('[advanceTick] Agreement expiration check failed (non-fatal):', expErr);
    }

    // 3.7 Expire pending state visit proposals past their accept window
    try {
        const { data: expiredVisits, error: svErr } = await supabase
            .from('diplomatic_proposals')
            .update({ status: 'expired' })
            .eq('proposal_type', 'state_visit')
            .eq('status', 'proposed')
            .lte('fm_review_expires_tick', newTick)
            .select('id');
        if (!svErr && expiredVisits && expiredVisits.length > 0) {
            summary.expiredStateVisits = expiredVisits.length;
            console.log(`[advanceTick] Expired ${expiredVisits.length} state visit proposal(s)`);
        }
    } catch (svExpErr) {
        console.error('[advanceTick] State visit expiration check failed (non-fatal):', svExpErr);
    }

    // 4. Process each nation
    for (const nation of nationList) {
      try {
        // Set correct seat count for this nation (affects supermajority thresholds, etc.)
        initGameConfigForNation(nation);

        // Snapshot population_growth BEFORE any effects, so we can isolate
        // policy deltas and rebase on birth_rate - death_rate afterwards.
        const popGrowthBeforeEffects = Number(nation.population_growth ?? 50);

        // Stat effects (from passed bills/active laws)
        const effectResults = await processStatEffects(supabase, nation, newTick);
        if (effectResults.length > 0) summary.effects.push({ nation: nation.name, effects: effectResults });

        // Ministry action effects
        const ministryResults = await processMinistryActions(supabase, nation, newTick);
        if (ministryResults.length > 0) {
            summary.ministryActions = summary.ministryActions || [];
            summary.ministryActions.push({ nation: nation.name, effects: ministryResults });
        }

        // Apply GDP growth rate
        await applyGdpGrowth(supabase, nation);

        // Stat decay (equilibrium drift + erosion, modified by institution funding)
        if (!_institutionConfig) {
            const { data: icRows } = await supabase.from('ministry_institution_config').select('*');
            _institutionConfig = icRows || [];
        }
        // Load per-institution funding allocations (written by enactBill funding articles)
        const { data: allocRows } = await supabase.from('budget_item_allocations')
            .select('*')
            .eq('nation_id', nation.id)
            .eq('item_type', 'institution')
            .order('created_at', { ascending: true });
        const statInstMap = buildStatInstitutionMap(_institutionConfig, allocRows || []);
        const policyDecayAdj = await buildPolicyDecayAdjustments(supabase, nation.id);
        const decayResults = await processStatDecay(supabase, nation, statInstMap, policyDecayAdj);
        if (decayResults.length > 0) {
            summary.decay = summary.decay || [];
            summary.decay.push({ nation: nation.name, effects: decayResults });
        }

        // Stat connections (threshold-triggered ripple effects)
        if (!_statConnections) {
            const { data: scRows } = await supabase.from('stat_connections').select('*').eq('enabled', true);
            _statConnections = scRows || [];
        }
        const connResults = await processStatConnections(supabase, nation, newTick, _statConnections);
        if (connResults.length > 0) {
            summary.statConnections = summary.statConnections || [];
            summary.statConnections.push({ nation: nation.name, effects: connResults });
        }

        // Ongoing costs
        const costResult = await processOngoingCosts(supabase, nation, newTick);
        if (costResult.totalCost !== 0) summary.costs.push({ nation: nation.name, ...costResult });

        // Sovereign debt mechanics (burden, credit deterioration, lockout, debt crisis trigger)
        try {
            const debtResult = await processSovereignDebtMechanics(supabase, nation, newTick);
            if (debtResult && (debtResult.burdenChanged || debtResult.creditDeterioration || debtResult.debtCrisisTriggered)) {
                summary.sovereignDebt = summary.sovereignDebt || [];
                summary.sovereignDebt.push({ nation: nation.name, ...debtResult });
            }
        } catch (debtErr) {
            console.error(`[advanceTick] Sovereign debt mechanics failed for ${nation.name} (non-fatal):`, debtErr);
        }

        // Austerity commitments from enacted sovereign defaults
        try {
            const austerityResults = await processAusterityCommitments(supabase, nation, newTick);
            if (austerityResults.length > 0) {
                summary.austerity = summary.austerity || [];
                summary.austerity.push({ nation: nation.name, commitments: austerityResults });
            }
        } catch (austErr) {
            console.error(`[advanceTick] Austerity processing failed for ${nation.name} (non-fatal):`, austErr);
        }

        // PM trait effects
        await processPMTraitEffects(supabase, nation, newTick);

        // Elections (democracy only)
        const electionResults = await processElections(supabase, nation, newTick);
        if (electionResults.length > 0) {
            summary.elections = summary.elections || [];
            summary.elections.push({ nation: nation.name, elections: electionResults });
        }

        // Government vacancy penalties (democracy only)
        const vacancyResult = await processGovernmentVacancy(supabase, nation, newTick);
        if (vacancyResult) {
            summary.vacancies = summary.vacancies || [];
            summary.vacancies.push(vacancyResult);
        }

        // Check for early majority on active floor bills (lock outcome + set grace tick)
        const earlyResults = await checkEarlyMajority(supabase, nation.id);
        if (earlyResults.length > 0) {
            summary.earlyMajority = summary.earlyMajority || [];
            summary.earlyMajority.push({ nation: nation.name, bills: earlyResults });
        }

        // Resolve expired votes (includes early-locked bills whose grace tick ended)
        const resolutions = await resolveExpiredVotes(supabase, nation.id);
        if (resolutions.length > 0) summary.resolutions.push({ nation: nation.name, bills: resolutions });

        // ── Impeachment processing (Presidential systems) ──
        if (isPresidentialRepublic(nation)) {
            try {
                // 1. Auto-transition committee impeachment bills to floor
                const { data: committeeImpeach } = await supabase
                    .from('bills')
                    .select('id, proposed_tick, impeachment_id')
                    .eq('nation_id', nation.id)
                    .eq('bill_type', 'impeachment_motion')
                    .eq('status', 'committee')
                    .lte('proposed_tick', newTick - GAME_CONFIG.IMPEACHMENT_COMMITTEE_TICKS);

                for (const cb of (committeeImpeach || [])) {
                    await supabase.from('bills').update({
                        status: 'floor',
                        floor_tick: newTick,
                        voting_ends_tick: newTick + GAME_CONFIG.IMPEACHMENT_MOTION_VOTING_TICKS
                    }).eq('id', cb.id);
                    if (cb.impeachment_id) {
                        await supabase.from('impeachment_proceedings').update({ phase: 'motion_floor' }).eq('id', cb.impeachment_id);
                    }
                    console.log(`[Impeachment] Motion ${cb.id} auto-transitioned from committee to floor`);
                }

                // 2. Per-tick trial effects (while conviction vote is on the floor)
                const { data: activeTrials } = await supabase
                    .from('impeachment_proceedings')
                    .select('id, president_id')
                    .eq('nation_id', nation.id)
                    .eq('phase', 'trial');

                if (activeTrials && activeTrials.length > 0) {
                    // Stability -1, gov_approval_events -1, civil_unrest +2 per tick during trial
                    const stab = Math.max(0, Math.round(Number(nation.stability || 50) - 1));
                    const unrest = Math.min(100, Math.round(Number(nation.civil_unrest || 0) + 2));
                    const govApproval = Number(nation.gov_approval_events ?? 0) - 1;
                    await supabase.from('nations').update({
                        stability: stab,
                        civil_unrest: unrest,
                        gov_approval_events: govApproval
                    }).eq('id', nation.id);
                    nation.stability = stab;
                    nation.civil_unrest = unrest;
                    nation.gov_approval_events = govApproval;
                    console.log(`[Impeachment] Trial effects applied for ${nation.name}: stability=${stab}, unrest=${unrest}`);
                }

                // 3. Process conviction (president removal) — runs after resolveExpiredVotes set conviction_result
                const { data: convictions } = await supabase
                    .from('impeachment_proceedings')
                    .select('id, president_id, initiated_by_faction_id, charges')
                    .eq('nation_id', nation.id)
                    .eq('phase', 'resolved')
                    .eq('conviction_result', 'convicted')
                    .eq('resolved_at_tick', newTick);  // only process on the tick it was resolved

                for (const proc of (convictions || [])) {
                    // Get president data
                    const { data: president } = await supabase.from('presidents')
                        .select('*').eq('id', proc.president_id).single();
                    if (!president || !president.is_active) continue;

                    // Deactivate president
                    await supabase.from('presidents').update({
                        is_active: false,
                        removal_reason: 'impeached'
                    }).eq('id', proc.president_id);

                    // President's party takes -10 approval
                    await adjustMomentumAll(supabase, nation.id, president.faction_id, -10, 'impeachment:convicted');

                    // Stability -3, international_reputation -3
                    const newStab = Math.max(0, Math.round(Number(nation.stability || 50) - 3));
                    const newRep = Math.max(0, Math.round(Number(nation.international_reputation || 50) - 3));
                    await supabase.from('nations').update({
                        stability: newStab,
                        international_reputation: newRep
                    }).eq('id', nation.id);
                    nation.stability = newStab;
                    nation.international_reputation = newRep;

                    // Close current administration
                    try {
                        const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                        await closeAdministration(supabase, nation.id, nation, 'impeachment', newTick, shard?.current_date || '', null);
                    } catch (adminErr) { console.warn('Could not close administration on impeachment:', adminErr); }

                    // Generate new VP name as acting president
                    const vpFirst = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)];
                    const vpLast = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)];

                    // Create new president record (VP succession — same party, serves out remainder)
                    const remainingTicks = Math.max(1, (president.term_ends_tick || newTick) - newTick);
                    await supabase.from('presidents').insert({
                        nation_id: nation.id,
                        faction_id: president.faction_id,
                        first_name: vpFirst,
                        last_name: vpLast,
                        age: 45 + Math.floor(Math.random() * 20),
                        ideology: president.ideology,
                        elected_tick: newTick,
                        term_ends_tick: president.term_ends_tick || (newTick + remainingTicks),
                        is_active: true,
                        terms_served: 0
                    });

                    // Schedule emergency presidential election
                    const emergencyElectionTick = newTick + GAME_CONFIG.IMPEACHMENT_EMERGENCY_ELECTION_TICKS;
                    // Cancel existing scheduled presidential elections
                    await supabase.from('elections').delete()
                        .eq('nation_id', nation.id)
                        .eq('election_type', 'presidential')
                        .eq('status', 'scheduled');
                    await supabase.from('elections').insert({
                        nation_id: nation.id,
                        election_tick: emergencyElectionTick,
                        election_type: 'presidential',
                        status: 'scheduled'
                    });

                    // Cancel any pending bills on president's desk
                    await supabase.from('bills').update({ status: 'failed' })
                        .eq('nation_id', nation.id)
                        .eq('status', 'president_desk');

                    // Fire conviction event
                    await supabase.from('event_log').insert({
                        nation_id: nation.id,
                        event_name: 'PRESIDENT REMOVED FROM OFFICE',
                        event_type: 'impeachment',
                        category: 'government',
                        description_chosen: `President ${president.first_name} ${president.last_name} has been convicted and removed from office. Vice President ${vpFirst} ${vpLast} assumes the presidency. An emergency presidential election is scheduled.`,
                        fired_at_tick: newTick,
                        effects_applied: {
                            removed_president: `${president.first_name} ${president.last_name}`,
                            acting_president: `${vpFirst} ${vpLast}`,
                            emergency_election_tick: emergencyElectionTick,
                            stability_hit: -3,
                            reputation_hit: -3,
                            party_approval_hit: -10
                        }
                    });

                    console.log(`[Impeachment] President ${president.first_name} ${president.last_name} removed. VP ${vpFirst} ${vpLast} takes over. Emergency election at tick ${emergencyElectionTick}`);
                }

                // 4. Dismiss impeachment if president's term ended during proceedings
                const { data: staleProceedings } = await supabase
                    .from('impeachment_proceedings')
                    .select('id, president_id, motion_bill_id, conviction_bill_id')
                    .eq('nation_id', nation.id)
                    .neq('phase', 'resolved');

                for (const sp of (staleProceedings || [])) {
                    const { data: pres } = await supabase.from('presidents')
                        .select('is_active').eq('id', sp.president_id).single();
                    if (pres && !pres.is_active) {
                        // President left office — dismiss proceedings
                        await supabase.from('impeachment_proceedings').update({
                            phase: 'resolved',
                            resolved_at_tick: newTick
                        }).eq('id', sp.id);
                        // Fail any pending impeachment bills
                        if (sp.motion_bill_id) {
                            await supabase.from('bills').update({ status: 'failed' })
                                .eq('id', sp.motion_bill_id).in('status', ['committee', 'floor']);
                        }
                        if (sp.conviction_bill_id) {
                            await supabase.from('bills').update({ status: 'failed' })
                                .eq('id', sp.conviction_bill_id).in('status', ['committee', 'floor']);
                        }
                        console.log(`[Impeachment] Proceedings ${sp.id} dismissed — president no longer in office`);
                    }
                }
            } catch (impErr) {
                console.error(`[Impeachment] Processing failed for ${nation.name} (non-fatal):`, impErr);
            }
        }

        // Auto-sign expired president's desk bills (Presidential systems)
        const deskResults = await processPresidentDesk(supabase, nation, newTick);
        if (deskResults.length > 0) {
            summary.presidentDesk = summary.presidentDesk || [];
            summary.presidentDesk.push({ nation: nation.name, bills: deskResults });
        }

        // Presidential pre-election candidate generation, term end safety net, + selection timeout
        await triggerPresidentialCandidateSelection(supabase, nation, newTick);
        await processPresidentialTermEnd(supabase, nation, newTick);
        await processPresidentCandidateTimeout(supabase, nation, newTick);
        await processParliamentaryPMTimeout(supabase, nation, newTick);

        // Incumbent campaign bonuses (+2 approval/tick during pre-election window)
        await processIncumbentCampaignBonuses(supabase, nation, newTick);

        // Ideology shifts from resolved bills
        await processIdeologyShifts(supabase, nation.id, resolutions, newTick);

        // Purge approval decay (autocracy scapegoat mechanic)
        if (isAutocracy(nation)) {
            await processPurgeDecay(supabase, nation.id, newTick);
        }

        // Seat rebalancing: if factions were disbanded and seats are vacant,
        // proportionally redistribute the empty seats across remaining factions.
        {
            const seatResult = await rebalanceVacantSeats(supabase, nation);
            if (seatResult) {
                summary.seatRebalancing = summary.seatRebalancing || [];
                summary.seatRebalancing.push(seatResult);
            }
        }

        // Crises (persistent negative events that apply effects every tick)
        // Runs BEFORE approval calculations so crisis stat/event effects propagate in the same tick.
        const crisisResults = await processCrises(supabase, nation, newTick);
        if (crisisResults.length > 0) {
            summary.crises = summary.crises || [];
            summary.crises.push({ nation: nation.name, crises: crisisResults });
        }

        // Population growth: recompute from birth_rate - death_rate base,
        // preserving any policy/crisis deltas, then apply population change.
        const popGrowthResult = await processPopulationGrowth(supabase, nation, popGrowthBeforeEffects);
        if (popGrowthResult) {
            summary.populationGrowth = summary.populationGrowth || [];
            summary.populationGrowth.push({ nation: nation.name, ...popGrowthResult });
        }

        // Re-fetch nation to get post-crisis stat values for minister approval
        const { data: preApprovalNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        if (preApprovalNation) Object.assign(nation, preApprovalNation);

        // Layer 1: Update minister approvals (drift-to-performance model)
        const ministerApprovalResults = await updateMinisterApprovals(supabase, nation, newTick);
        if (ministerApprovalResults.length > 0) {
            summary.ministerApprovals = summary.ministerApprovals || [];
            summary.ministerApprovals.push({ nation: nation.name, results: ministerApprovalResults });
        }

        // Decay gov_approval_events by 10% per tick (transient shocks fade naturally)
        const oldEvents = Number(nation.gov_approval_events ?? 0);
        if (Math.abs(oldEvents) > 0.01) {
            const decayed = Math.round(oldEvents * (1 - MINISTER_APPROVAL_CONFIG.EVENTS_DECAY_RATE) * 100) / 100;
            await supabase.from('nations')
                .update({ gov_approval_events: decayed })
                .eq('id', nation.id);
            nation.gov_approval_events = decayed;
        }

        // Layer 2: Calculate government approval (avg minister + vacancy penalty + event modifier)
        const govApproval = await calculateGovernmentApprovalTick(supabase, nation, newTick);

        // Three-pillar voter preference recalculation
        await calculateThreePillarPreferences(supabase, nation, newTick);

        // Expire pending loyalty demands (autocracy)
        if (isAutocracy(nation)) {
            await processLoyaltyDemandExpiry(supabase, nation, newTick);
        }

        // Faction loyalty (autocracy)
        if (isAutocracy(nation)) {
            await processLoyaltyTick(supabase, nation);
        }

        // Regime pillars decay & bonus (autocracy)
        if (isAutocracy(nation)) {
            await processRegimePillars(supabase, nation);
        }

        // Steward stats tick (autocracy)
        if (isAutocracy(nation)) {
            await processStewardTick(supabase, nation);
        }

        // Standing relevance decay (autocracy v2)
        if (isAutocracy(nation)) {
            await processStandingTick(supabase, nation, newTick);
        }

        // Regime health tick (autocracy v2)
        if (isAutocracy(nation)) {
            await processRegimeHealthTick(supabase, nation, newTick);
        }

        // Unaligned seat pool regeneration (autocracy v2)
        if (isAutocracy(nation)) {
            await processUnalignedPoolTick(supabase, nation, newTick);
        }

        // Secret coalition detection (autocracy)
        if (isAutocracy(nation)) {
            await processCoalitionDetection(supabase, nation, newTick);
        }

        // Auto-resolve shakeups that are 1+ ticks old
        if (isAutocracy(nation)) {
            await autoResolveStaleShakeups(supabase, nation.id, newTick);
        }

        // Re-fetch nation with post-effect values for remaining processors
        const { data: freshNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        if (freshNation) Object.assign(nation, freshNation);

        // Democratic revolution (autocracy only)
        const revolutionResult = await processRevolution(supabase, nation, newTick);
        if (revolutionResult) {
            summary.revolutions = summary.revolutions || [];
            summary.revolutions.push(revolutionResult);
        }

        // Random events
        const eventResults = await processEvents(supabase, nation, newTick);
        if (eventResults.length > 0) summary.events.push({ nation: nation.name, events: eventResults });

        // Process active fundraiser promises
        const promiseResults = await processPromiseTick(supabase, nation, newTick);
        if (promiseResults.length > 0) {
            summary.promises = summary.promises || [];
            summary.promises.push({ nation: nation.name, promises: promiseResults });
        }


        // Writing AP rewards: grant bonus AP for long op-eds and articles published this tick
        try {
            const rewardResults = await processWritingRewards(supabase, nation.id, newTick);
            if (rewardResults.length > 0) {
                summary.writingRewards = summary.writingRewards || [];
                summary.writingRewards.push({ nation: nation.name, rewards: rewardResults });
            }
        } catch (rewardErr) {
            console.error(`[advanceTick] Writing rewards failed for ${nation.name} (non-fatal):`, rewardErr);
        }

        // Economic aid condition reviews (annual, at year boundaries)
        const aidReviewResults = await processAidConditionReview(supabase, freshNation || nation, newTick);
        if (aidReviewResults.length > 0) {
            summary.aidReviews = summary.aidReviews || [];
            summary.aidReviews.push({ nation: nation.name, reviews: aidReviewResults });
        }

        // Ambassador term limits (retirements + warnings)
        const retirementResults = await processAmbassadorRetirements(supabase, freshNation || nation, newTick);
        if (retirementResults.length > 0) {
            summary.ambassadorRetirements = summary.ambassadorRetirements || [];
            summary.ambassadorRetirements.push({ nation: nation.name, retirements: retirementResults });
        }

        // ── Succession helper: updates HOS, syncs nation object, logs action ──
        async function handleStrongmanSuccession(
            supabase: any, nation: any, hosName: string, hosAge: number, newTick: number
        ) {
            const FIRST = ['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin','Emilio','Catalina','Fernando','Renata'];
            const LAST = ['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero','Aguilar','Valenzuela','Carrasco','Ibarra'];
            const randFirst = () => FIRST[Math.floor(Math.random() * FIRST.length)];
            const randLast = () => LAST[Math.floor(Math.random() * LAST.length)];

            // Check for chosen successor
            const { data: chosenSuccessor } = await supabase.from('stewards')
                .select('id, faction_id, first_name, last_name, age, pillar_key, steward_type, succession_strength')
                .eq('nation_id', nation.id).eq('is_chosen_successor', true).eq('is_alive', true)
                .maybeSingle();

            if (chosenSuccessor) {
                // === CLEAN SUCCESSION ===
                const successorName = `${chosenSuccessor.first_name} ${chosenSuccessor.last_name}`;
                console.log(`[LeaderAging] Clean succession: ${successorName} takes power`);

                await supabase.from('nations').update({
                    head_of_state_first_name: chosenSuccessor.first_name,
                    head_of_state_last_name: chosenSuccessor.last_name,
                    head_of_state_age: chosenSuccessor.age,
                    ruling_faction_id: chosenSuccessor.faction_id,
                    successor_cooldown_end_tick: null, successor_is_family_member: false,
                }).eq('id', nation.id);
                nation.head_of_state_first_name = chosenSuccessor.first_name;
                nation.head_of_state_last_name = chosenSuccessor.last_name;
                nation.head_of_state_age = chosenSuccessor.age;
                nation.ruling_faction_id = chosenSuccessor.faction_id;

                // Retire old steward, reset coup readiness
                await supabase.from('stewards').update({
                    is_chosen_successor: false, succession_strength: 0,
                    successor_appointed_tick: null, is_alive: false, died_at_tick: newTick,
                }).eq('id', chosenSuccessor.id);
                await supabase.from('stewards').update({ coup_readiness: 0 })
                    .eq('nation_id', nation.id).eq('is_alive', true);

                // Loyalty: new ruler -5, others -15
                const { data: factions } = await supabase.from('factions')
                    .select('id, loyalty').eq('nation_id', nation.id).eq('faction_type', 'party');
                for (const fac of (factions || [])) {
                    const drop = fac.id === chosenSuccessor.faction_id ? 5 : 15;
                    await supabase.from('factions').update({
                        loyalty: Math.max(0, (fac.loyalty ?? 50) - drop)
                    }).eq('id', fac.id);
                }

                // Generate replacement steward
                const stewardType = PILLAR_TO_STEWARD_TYPE[chosenSuccessor.pillar_key] || 'technocrat';
                await supabase.from('stewards').insert({
                    nation_id: nation.id, faction_id: chosenSuccessor.faction_id,
                    pillar_key: chosenSuccessor.pillar_key, steward_type: stewardType,
                    first_name: randFirst(), last_name: randLast(),
                    age: 40 + Math.floor(Math.random() * 16),
                    standing: 40, power_base: 30, true_loyalty: 50, estimated_loyalty: 55,
                    personal_wealth: 0, exit_readiness: 0, coup_readiness: 0,
                    is_alive: true, is_chosen_successor: false, succession_strength: 0,
                    created_at_tick: newTick,
                });

                await supabase.from('campaign_actions').insert({
                    party_id: chosenSuccessor.faction_id, nation_id: nation.id,
                    action_type: 'clean_succession', tick_performed: newTick,
                    result: { deceased_name: hosName, deceased_age: hosAge,
                        successor_name: successorName, successor_faction_id: chosenSuccessor.faction_id,
                        succession_strength: chosenSuccessor.succession_strength ?? 0, cause: 'natural_causes' },
                });
                return { type: 'clean_succession', deceased: hosName, deceasedAge: hosAge,
                    successor: successorName, successorAge: chosenSuccessor.age };

            } else if (nation.successor_is_family_member) {
                // === FAMILY MEMBER SUCCESSION ===
                console.log(`[LeaderAging] Family succession in ${nation.name}`);
                const famFirst = randFirst();
                const famLast = nation.head_of_state_last_name || 'Unknown';
                const famAge = 30 + Math.floor(Math.random() * 16);
                const famName = `${famFirst} ${famLast}`;

                await supabase.from('nations').update({
                    head_of_state_first_name: famFirst, head_of_state_last_name: famLast,
                    head_of_state_age: famAge,
                    successor_cooldown_end_tick: null, successor_is_family_member: false,
                }).eq('id', nation.id);
                nation.head_of_state_first_name = famFirst;
                nation.head_of_state_last_name = famLast;
                nation.head_of_state_age = famAge;

                await supabase.from('stewards').update({ coup_readiness: 0 })
                    .eq('nation_id', nation.id).eq('is_alive', true);

                const { data: factions } = await supabase.from('factions')
                    .select('id, loyalty').eq('nation_id', nation.id).eq('faction_type', 'party');
                for (const fac of (factions || [])) {
                    await supabase.from('factions').update({
                        loyalty: Math.max(0, (fac.loyalty ?? 50) - 5)
                    }).eq('id', fac.id);
                }

                await supabase.from('campaign_actions').insert({
                    party_id: nation.ruling_faction_id, nation_id: nation.id,
                    action_type: 'family_succession', tick_performed: newTick,
                    result: { deceased_name: hosName, deceased_age: hosAge,
                        successor_name: famName, is_family_member: true, cause: 'natural_causes' },
                });
                return { type: 'family_succession', deceased: hosName, deceasedAge: hosAge,
                    successor: famName, successorAge: famAge };

            } else {
                // === NO SUCCESSOR — random replacement ===
                const newFirst = randFirst();
                const newLast = randLast();
                const newAge = 45 + Math.floor(Math.random() * 16);
                const newName = `${newFirst} ${newLast}`;

                await supabase.from('nations').update({
                    head_of_state_first_name: newFirst, head_of_state_last_name: newLast,
                    head_of_state_age: newAge,
                    successor_cooldown_end_tick: null, successor_is_family_member: false,
                }).eq('id', nation.id);
                nation.head_of_state_first_name = newFirst;
                nation.head_of_state_last_name = newLast;
                nation.head_of_state_age = newAge;

                await supabase.from('campaign_actions').insert({
                    party_id: nation.ruling_faction_id, nation_id: nation.id,
                    action_type: 'strongman_death', tick_performed: newTick,
                    result: { deceased_name: hosName, deceased_age: hosAge,
                        successor_name: newName, successor_age: newAge, cause: 'natural_causes' },
                });
                return { type: 'strongman_death', deceased: hosName, deceasedAge: hosAge,
                    successor: newName, successorAge: newAge };
            }
        }

        // ── Leader aging (every January — tick % 12 === 0) ──
        // All party leaders, stewards, and the strongman age 1 year.
        // The strongman also rolls health checks starting at age 70.
        if (newTick % 12 === 0) {
            try {
                const agingResults = [];

                // 1. Age all party faction leaders +1
                const { data: partyFactions } = await supabase
                    .from('factions')
                    .select('id, leader_age, leader_first_name, leader_last_name')
                    .eq('nation_id', nation.id)
                    .eq('faction_type', 'party')
                    .not('leader_age', 'is', null);

                if (partyFactions && partyFactions.length > 0) {
                    for (const f of partyFactions) {
                        const newAge = (f.leader_age || 40) + 1;
                        await supabase.from('factions')
                            .update({ leader_age: newAge })
                            .eq('id', f.id);
                        agingResults.push({
                            type: 'party_leader',
                            name: `${f.leader_first_name || '?'} ${f.leader_last_name || '?'}`,
                            factionId: f.id,
                            newAge
                        });
                    }
                }

                // 2. Age all living stewards +1 (autocracy)
                if (isAutocracy(nation)) {
                    const { data: livingStews } = await supabase
                        .from('stewards')
                        .select('id, age, first_name, last_name, faction_id')
                        .eq('nation_id', nation.id)
                        .eq('is_alive', true);

                    if (livingStews && livingStews.length > 0) {
                        for (const s of livingStews) {
                            const newAge = (s.age || 40) + 1;
                            await supabase.from('stewards')
                                .update({ age: newAge })
                                .eq('id', s.id);
                            agingResults.push({
                                type: 'steward',
                                name: `${s.first_name} ${s.last_name}`,
                                stewardId: s.id,
                                factionId: s.faction_id,
                                newAge
                            });
                        }
                    }

                    // 3. Age the strongman (head of state) +1 and roll health checks
                    const hosAge = Number(nation.head_of_state_age ?? 0);
                    if (hosAge > 0) {
                        const newHosAge = hosAge + 1;
                        await supabase.from('nations')
                            .update({ head_of_state_age: newHosAge })
                            .eq('id', nation.id);
                        nation.head_of_state_age = newHosAge;
                        agingResults.push({
                            type: 'strongman',
                            name: `${nation.head_of_state_first_name || '?'} ${nation.head_of_state_last_name || '?'}`,
                            newAge: newHosAge
                        });

                        // Strongman health check: escalating death chance from age 70 to 85.
                        // Probability: 5% at 70, rising linearly to 100% at 85.
                        // Formula: deathChance = 0.05 + (age - 70) * (0.95 / 15)
                        if (newHosAge >= 70) {
                            const deathChance = Math.min(1.0, 0.05 + (newHosAge - 70) * (0.95 / 15));
                            const roll = Math.random();
                            console.log(`[LeaderAging] Strongman health check for ${nation.name}: age=${newHosAge}, deathChance=${(deathChance * 100).toFixed(1)}%, roll=${roll.toFixed(3)}`);

                            if (roll < deathChance) {
                                const hosName = `${nation.head_of_state_first_name || 'The Strongman'} ${nation.head_of_state_last_name || ''}`.trim();
                                console.log(`[LeaderAging] Strongman ${hosName} of ${nation.name} has died at age ${newHosAge}`);
                                const result = await handleStrongmanSuccession(supabase, nation, hosName, newHosAge, newTick);
                                agingResults.push(result);
                            }
                        }
                    }
                }

                if (agingResults.length > 0) {
                    summary.leaderAging = summary.leaderAging || [];
                    summary.leaderAging.push({ nation: nation.name, results: agingResults });
                    console.log(`[LeaderAging] ${nation.name}: aged ${agingResults.length} leader(s)`);
                }
            } catch (agingErr) {
                console.error(`[advanceTick] Leader aging failed for ${nation.name} (non-fatal):`, agingErr);
            }
        }

      } catch (nationErr) {
        console.error(`[advanceTick] FAILED processing nation ${nation.id} (${nation.name}):`, nationErr);
        summary.errors = summary.errors || [];
        summary.errors.push({ nation: nation.name, nationId: nation.id, error: String(nationErr) });
      } finally {
        // Always record history snapshot, even if processing failed partway through.
        // Without this, a crash in any processing step (elections, crises, etc.)
        // causes stat_history / nations_history to have gaps, which makes trend
        // deltas show stale cumulative changes instead of per-tick changes.
        try {
            const { data: finalNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
            await recordStatHistory(supabase, finalNation || nation, newTick);
            await snapshotNationHistory(supabase, finalNation || nation, newTick);
        } catch (snapErr) {
            console.error(`[advanceTick] History snapshot FAILED for ${nation.id} (${nation.name}):`, snapErr);
        }
      }
    }

    // 5. Commit shard tick/date AFTER all nation processing completes.
    // This is the last step — if the function timed out earlier, the tick
    // number stays unchanged and the cron will re-process on the next run.
    // Commit shard update — skip entirely in reprocess mode
    if (reprocess) {
        console.log(`[advanceTick] REPROCESS complete for tick ${newTick}. Shard NOT updated (no advance).`);
    } else {
        console.log(`[advanceTick] All nations processed. Committing tick ${newTick}...`);
        await supabase.from('shard').update({
            current_tick: newTick,
            next_tick_at: nextTickAt.toISOString(),
            current_date: newDate
        }).eq('name', 'Alpha Shard');
        console.log(`[advanceTick] Tick ${newTick} committed. Next tick at ${nextTickAt.toISOString()}`);
    }

    return summary;
}


// ===== EDGE FUNCTION HANDLER =====

Deno.serve(async (req) => {
    const corsHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(
            JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
            { status: 500, headers: corsHeaders }
        );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 0. Startup checks
        console.log("[advance-tick] Step 0: Running preflight...");
        await ensureApRpcAvailability(supabase);
        console.log("[advance-tick] Step 0: Preflight complete.");

        // 1. Check for force/reprocess parameters (admin manual trigger)
        let force = false;
        let reprocess = false;
        try {
            const body = await Promise.race([
                req.json(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("body read timeout")), 3000)),
            ]);
            force = body?.force === true;
            reprocess = body?.reprocess === true;
        } catch (_) {
            // No body, invalid JSON, or timeout — not forced
        }
        console.log(`[advance-tick] Step 1: force=${force}, reprocess=${reprocess}`);

        // 2. Check if tick is due (skip check if force=true)
        console.log("[advance-tick] Step 2: Querying shard...");
        const { data: shard, error: shardError } = await supabase
            .from("shard")
            .select("next_tick_at, current_tick, tick_processing")
            .eq("name", "Alpha Shard")
            .single();
        console.log(`[advance-tick] Step 2: Shard query done. error=${shardError?.message ?? 'none'}, tick=${shard?.current_tick}`);

        if (shardError || !shard) {
            console.error(`[advance-tick] Shard not found: ${shardError?.message}`);
            return new Response(
                JSON.stringify({ error: "Shard not found", detail: shardError?.message }),
                { status: 404, headers: corsHeaders }
            );
        }

        if (!force && !reprocess) {
            const now = new Date();
            const nextTickAt = new Date(shard.next_tick_at);

            if (now < nextTickAt) {
                const remainMs = nextTickAt.getTime() - now.getTime();
                console.log(`[advance-tick] Not due — tick ${shard.current_tick}, next_tick_at=${shard.next_tick_at}, remaining=${Math.round(remainMs / 1000)}s`);
                return new Response(
                    JSON.stringify({
                        status: "not_due",
                        current_tick: shard.current_tick,
                        next_tick_at: shard.next_tick_at,
                        time_remaining_ms: remainMs,
                    }),
                    { headers: corsHeaders }
                );
            }
        }

        // 3. Tick is due (or forced) — acquire lock
        console.log(`[advance-tick] ✓ Tick IS due (or forced/reprocess). Acquiring lock for tick ${shard.current_tick}...`);
        const lockAcquired = await acquireTickLock(supabase);
        if (!lockAcquired) {
            console.warn(`[advance-tick] Lock held — tick ${shard.current_tick}, tick_processing=${shard.tick_processing}`);
            return new Response(
                JSON.stringify({
                    status: "locked",
                    message: "Another process is already processing the tick",
                }),
                { headers: corsHeaders }
            );
        }

        // 4. Process the tick
        console.log(`[advance-tick] Lock acquired, processing tick ${shard.current_tick}...`);
        try {
            const summary = await advanceTick(supabase, { force, reprocess });
            const responseStatus = summary.partial ? "partial" : "success";
            console.log(
                `[advance-tick] Tick ${summary.tick} ${summary.partial ? 'partially processed' : 'processed'} (${summary.nations} nations)`
            );
            return new Response(
                JSON.stringify({ status: responseStatus, summary }),
                { headers: corsHeaders }
            );
        } catch (e) {
            console.error("[advance-tick] Tick processing failed:", e);
            return new Response(
                JSON.stringify({ error: e.message }),
                { status: 500, headers: corsHeaders }
            );
        } finally {
            await releaseTickLock(supabase);
        }
    } catch (error) {
        console.error("[advance-tick] Edge function error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: corsHeaders }
        );
    }
});
