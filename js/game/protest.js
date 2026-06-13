/**
 * protest.js — Organise a Protest: game logic + execute functions
 *
 * Phase 1: AP cost scaling, protest fatigue, condition score, turnout roll,
 * tier resolution, escalation path, grievance scoring, tier effects.
 * Phase 2: executeProtest, endorseProtest, callOffProtest server-side handlers.
 */

import { fetchActiveCoalition } from './government-structure.js';
import { adjustGovernmentApprovalEvent } from './momentum.js';
import { nudgeEnthusiasm } from './electorate.js';

// ==================== PROTEST LOG UPDATE RPC ====================
// All protest_log writes from client code must go through this RPC
// because protest_log RLS only allows service_role writes.

async function protestUpdate(supabase, protestId, updates, clearLockouts = false, cooldownFactionId = null, cooldownUntil = null) {
    const params = {
        p_protest_id: protestId,
        p_updates: updates,
        p_clear_lockouts: clearLockouts,
    };
    if (cooldownFactionId != null) params.p_cooldown_faction_id = cooldownFactionId;
    if (cooldownUntil != null) params.p_cooldown_until = cooldownUntil;
    const { error } = await supabase.rpc('protest_update', params);
    if (error) {
        console.error('[Protest] protest_update RPC failed:', error.message);
        throw new Error(error.message);
    }
}

// ==================== CONSTANTS ====================

export const PROTEST_CONFIG = {
    // AP cost tiers indexed by use count
    AP_COST_TIERS: [2, 3, 5, 7, 10],

    // Use counter decay: -1 per N ticks of non-use
    USE_COUNTER_DECAY_INTERVAL: 12,

    // Cooldowns (ticks from tier resolution)
    CALLING_PARTY_COOLDOWN: 12,
    ENDORSING_PARTY_COOLDOWN: 6,

    // Protest fatigue: lookback window and per-protest penalty
    FATIGUE_LOOKBACK_TICKS: 6,
    FATIGUE_PENALTY_PER_PROTEST: 10,

    // Tier 6 crisis (half of Tier 7 values)
    TIER6_GOV_APPROVAL_PER_TICK: -0.25,
    TIER6_CIVIL_UNREST_PER_TICK: 1,
    TIER6_GDP_GROWTH_PER_TICK: -0.15,
    TIER6_FOREIGN_INVESTMENT_PER_TICK: -0.5,
    TIER6_POLITICAL_VIOLENCE_PER_TICK: 0.5,
    TIER6_ENFORCE_SUCCESS_CHANCE: 0.33,

    // Tier 7 crisis
    TIER7_GOV_APPROVAL_PER_TICK: -0.5,
    TIER7_CIVIL_UNREST_PER_TICK: 2,
    TIER7_GDP_GROWTH_PER_TICK: -0.3,
    TIER7_FOREIGN_INVESTMENT_PER_TICK: -1,
    TIER7_POLITICAL_VIOLENCE_PER_TICK: 1,
    TIER7_DEMAND_WINDOW_TICKS: 6,
    TIER7_DEMAND_MIN_MAGNITUDE: 6,
    TIER7_PYRRHIC_COMMITMENT_TICKS: 12,

    // Public Address
    PUBLIC_ADDRESS_AP: 1,
    PUBLIC_ADDRESS_COOLDOWN: 3,

    // Joint protest bonus
    JOINT_BONUS_PER_PARTY: 15,
    JOINT_BONUS_CAP: 30,

    // Endorsement bonus to turnout roll
    ENDORSEMENT_BONUS: 15,

    // Escalation path
    ESCALATION_LOOKBACK_TICKS: 8,
    ESCALATION_MIN_TIER: 5,
    ESCALATION_MIN_SCORE: 65,
    ESCALATION_TRIGGER_SCORE: 70,

    // Fizzle / backfire effects on the organising party
    // Tier 1 — "Embarrassing Backfire": harsh, organiser looks foolish
    FIZZLE_T1_VISIBILITY: -10,
    FIZZLE_T1_APPROVAL: -7,
    FIZZLE_T1_ENTHUSIASM: -12,
    // Tier 2 — "Protests Don't Materialise": milder, just a whimper
    FIZZLE_T2_VISIBILITY: -4,
    FIZZLE_T2_APPROVAL: -3,
    FIZZLE_T2_ENTHUSIASM: -5,
    FIZZLE_GOV_APPROVAL_MAX_BOOST: 3,   // 1d3
    FIZZLE_GOV_APPROVAL_MIN_THRESHOLD: 45,

    // Call-off
    CALL_OFF_AP: 1,
    CALL_OFF_WIND_DOWN_TICKS: 2,

    // Crisis sunset (Phase 2): TIER6_CRISIS_ID / TIER7_CRISIS_ID
    // (UUIDs '...20'/'...21') removed — no more active_crises writers.

    // Unresolved grievance penalty at election
    UNRESOLVED_GRIEVANCE_PENALTY: -5,
};

// Stats permanently excluded from Stat Failure tab.
// Phase 9: ethnic_diversity / median_age dropped from schema (no longer
// reachable); urbanization renamed to workforce, which is a valid Tier 7
// target rather than excluded.
const EXCLUDED_STAT_KEYS = new Set([]);

// Stats eligible for Tier 7 demand generation (canonical 25-stat menu).
const TIER7_ELIGIBLE_STATS = new Set([
    'gdp_growth', 'unrest', 'crime', 'health', 'education',
    'standard_of_living', 'cost_of_living',
    'unskilled_workers', 'skilled_workers', 'wages',
    'infrastructure', 'industry', 'farmland', 'service_sector',
    'energy', 'public_approval', 'global_image',
]);

// Stats where higher values are bad (inverted display).
const HIGHER_IS_BAD = new Set([
    'unrest', 'crime', 'corruption', 'cost_of_living', 'debt',
]);


// ==================== AP COST ====================

/**
 * Get AP cost for a protest based on the party's cumulative use count.
 * @param {number} useCount - party's current protest_use_count
 * @returns {number} AP cost
 */
export function getProtestCost(useCount) {
    const tiers = PROTEST_CONFIG.AP_COST_TIERS;
    return tiers[Math.min(useCount, tiers.length - 1)];
}

/**
 * Calculate the decayed use count after a period of non-use.
 * Decrements by 1 per USE_COUNTER_DECAY_INTERVAL ticks of non-use.
 * @param {number} useCount - current use count
 * @param {number} lastUseTick - tick of last protest use (null if never used)
 * @param {number} currentTick - current game tick
 * @returns {number} decayed use count (>= 0)
 */
export function getDecayedUseCount(useCount, lastUseTick, currentTick) {
    if (!useCount || useCount <= 0) return 0;
    if (lastUseTick == null) return 0;
    const elapsed = currentTick - lastUseTick;
    if (elapsed <= 0) return useCount;
    const decay = Math.floor(elapsed / PROTEST_CONFIG.USE_COUNTER_DECAY_INTERVAL);
    return Math.max(0, useCount - decay);
}

// ==================== PROTEST FATIGUE ====================

/**
 * Calculate protest fatigue penalty from global protest history.
 * Checks ALL parties' protests in the last FATIGUE_LOOKBACK_TICKS ticks.
 * @param {Array} protestHistory - array of { tick } from protest_log
 * @param {number} currentTick
 * @returns {number} penalty to subtract from condition score (>= 0)
 */
export function getProtestFatiguePenalty(protestHistory, currentTick) {
    const cutoff = currentTick - PROTEST_CONFIG.FATIGUE_LOOKBACK_TICKS;
    const recent = (protestHistory || []).filter(p => p.tick >= cutoff).length;
    return recent * PROTEST_CONFIG.FATIGUE_PENALTY_PER_PROTEST;
}

/**
 * Get fatigue level label for UI display.
 * @param {Array} protestHistory
 * @param {number} currentTick
 * @returns {{ label: string, color: string }}
 */
export function getProtestFatigueLevel(protestHistory, currentTick) {
    const cutoff = currentTick - PROTEST_CONFIG.FATIGUE_LOOKBACK_TICKS;
    const recent = (protestHistory || []).filter(p => p.tick >= cutoff).length;
    if (recent === 0) return { label: 'NONE', color: '#5cb85c' };
    if (recent === 1) return { label: 'LOW', color: '#c8a64e' };
    return { label: 'HIGH', color: '#d9534f' };
}

// ==================== CRACKDOWN DETECTION ====================

/**
 * Check if a recent government crackdown is active (hidden +12 bonus).
 * @param {Array} ministryActionHistory - array of { action_key, applied_at_tick }
 * @param {number} currentTick
 * @returns {boolean}
 */
export function recentCrackdownActive(ministryActionHistory, currentTick) {
    return (ministryActionHistory || []).some(a =>
        ['enforcePublicOrder', 'surveillanceExpansion'].includes(a.action_key) &&
        a.applied_at_tick >= currentTick - 4
    );
}

// ==================== GRIEVANCE SCORING ====================

/**
 * Calculate unpopularity bonus for a grievance target.
 * @param {{ type: string, approval?: number, publicApproval?: number, failureScore?: number }} grievance
 * @returns {number} bonus (0 to 15)
 */
export function getGrievanceUnpopularityBonus(grievance) {
    if (grievance.type === 'minister') {
        return Math.max(0, (60 - (grievance.approval || 50)) / 4);
    }
    if (grievance.type === 'activePolicy') {
        return Math.max(0, (60 - (grievance.publicApproval || 50)) / 4);
    }
    if (grievance.type === 'statFailure') {
        return Math.min(15, (grievance.failureScore || 0) / 2);
    }
    return 0;
}

/**
 * Calculate stat failure score for sorting the Stat Failure tab.
 * Positive = failing. Zero or negative = not failing (excluded).
 * @param {number} currentValue
 * @param {number} valueSixTicksAgo
 * @param {string} statKey
 * @returns {number} failure score (positive = bad)
 */
export function getStatFailureScore(currentValue, valueSixTicksAgo, statKey) {
    const delta = currentValue - valueSixTicksAgo;
    if (HIGHER_IS_BAD.has(statKey)) return delta;   // rising bad stat = failing
    return -delta;                                     // falling good stat = failing
}

/**
 * Check if a stat key is excluded from the Stat Failure tab.
 */
export function isExcludedStat(statKey) {
    return EXCLUDED_STAT_KEYS.has(statKey);
}

/**
 * Check if a stat key is eligible for Tier 7 demand generation.
 */
export function isTier7EligibleStat(statKey) {
    return TIER7_ELIGIBLE_STATS.has(statKey);
}

/**
 * Check if higher values are bad for a given stat.
 */
export function isHigherIsBad(statKey) {
    return HIGHER_IS_BAD.has(statKey);
}

// ==================== CONDITION SCORE ====================

/**
 * Calculate the base condition score that feeds the turnout roll.
 * @param {object} nationStats - { civil_unrest, happiness, polarization, political_violence }
 * @param {object} grievance - { type, approval?, publicApproval?, failureScore? }
 * @param {Array} protestHistory - global protest history [{ tick }]
 * @param {Array} ministryActionHistory - [{ action_key, applied_at_tick }]
 * @param {number} currentTick
 * @returns {{ score: number, breakdown: object }}
 */
export function calculateConditionScore(nationStats, grievance, protestHistory, ministryActionHistory, currentTick) {
    let score = 50;
    const breakdown = { base: 50 };

    // Civil unrest: max +30
    const unrestBonus = ((nationStats.unrest || 0) / 100) * 30;
    score += unrestBonus;
    breakdown.civil_unrest = +unrestBonus.toFixed(1);

    // Unhappiness: max +25
    const unhappyBonus = ((100 - (nationStats.standard_of_living || 50)) / 100) * 25;
    score += unhappyBonus;
    breakdown.happiness = +unhappyBonus.toFixed(1);

    // Polarization: max +20
    const polBonus = (0 / 100) * 20;
    score += polBonus;
    breakdown.polarization = +polBonus.toFixed(1);

    // Political violence: max -15
    const violencePenalty = ((nationStats.unrest || 0) / 100) * 15;
    score -= violencePenalty;
    breakdown.political_violence = +(-violencePenalty).toFixed(1);

    // Protest fatigue
    const fatiguePenalty = getProtestFatiguePenalty(protestHistory, currentTick);
    score -= fatiguePenalty;
    breakdown.protest_fatigue = -fatiguePenalty;

    // Hidden crackdown bonus
    const crackdown = recentCrackdownActive(ministryActionHistory, currentTick);
    if (crackdown) {
        score += 12;
        breakdown.crackdown_bonus = 12;
    }

    // Grievance unpopularity bonus (0 to +15)
    const grievanceBonus = getGrievanceUnpopularityBonus(grievance);
    score += grievanceBonus;
    breakdown.grievance_bonus = +grievanceBonus.toFixed(1);

    score = Math.max(0, Math.min(100, score));
    return { score, breakdown };
}

// ==================== TURNOUT ROLL ====================

/**
 * Roll turnout score from condition score with variance.
 * Variance narrows at extremes: ±25 at center, ±8 at edges.
 * @param {number} conditionScore - 0-100
 * @returns {number} turnout score 0-100
 */
export function rollTurnout(conditionScore) {
    const distanceFromCenter = Math.abs(conditionScore - 50);
    const variance = Math.max(8, 25 - (distanceFromCenter * 0.34));
    const swing = (Math.random() * 2 - 1) * variance;
    return Math.max(0, Math.min(100, conditionScore + swing));
}

/**
 * Deterministic version for testing / replay.
 */
export function rollTurnoutWithRng(conditionScore, rngValue) {
    const distanceFromCenter = Math.abs(conditionScore - 50);
    const variance = Math.max(8, 25 - (distanceFromCenter * 0.34));
    const swing = (rngValue * 2 - 1) * variance;
    return Math.max(0, Math.min(100, conditionScore + swing));
}

// ==================== TIER RESOLUTION ====================

/**
 * Map turnout score to tier (1-7).
 * @param {number} score - turnout score 0-100
 * @returns {number} tier 1-7
 */
export function getTurnoutTier(score) {
    if (score < 20) return 1;
    if (score < 35) return 2;
    if (score < 50) return 3;
    if (score < 65) return 4;
    if (score < 78) return 5;
    if (score < 92) return 6;
    return 7;
}

/**
 * Get tier display label.
 */
export function getTierLabel(tier) {
    const labels = {
        1: 'Embarrassing Backfire',
        2: 'Protests Don\'t Materialise',
        3: 'Modest Turnout',
        4: 'Respectable Protest',
        5: 'Strong Demonstration',
        6: 'Nationwide Protests',
        7: 'The Big One',
    };
    return labels[tier] || 'Unknown';
}

// ==================== ESCALATION PATH ====================

/**
 * Check if the escalation path triggers: two strong Tier 5+ protests
 * in close succession escalate to Tier 7.
 * @param {number} newTier - tier from turnout roll
 * @param {number} newScore - raw turnout score
 * @param {Array} protestHistory - [{ tier, score, tick }]
 * @param {number} currentTick
 * @returns {number} potentially escalated tier
 */
export function checkEscalationPath(newTier, newScore, protestHistory, currentTick) {
    if (newTier < PROTEST_CONFIG.ESCALATION_MIN_TIER || newScore < PROTEST_CONFIG.ESCALATION_TRIGGER_SCORE) {
        return newTier;
    }
    const recentHighTier = (protestHistory || []).filter(p =>
        p.tier >= PROTEST_CONFIG.ESCALATION_MIN_TIER &&
        p.score >= PROTEST_CONFIG.ESCALATION_MIN_SCORE &&
        p.tick >= currentTick - PROTEST_CONFIG.ESCALATION_LOOKBACK_TICKS
    );
    if (recentHighTier.length >= 1) return 7;
    return newTier;
}

// ==================== JOINT PROTEST ====================

/**
 * Calculate joint protest bonus when multiple parties endorse.
 * @param {number} endorsementCount - number of endorsing parties (not including caller)
 * @returns {number} bonus to add to turnout score
 */
export function calculateJointProtestBonus(endorsementCount) {
    return Math.min(
        PROTEST_CONFIG.JOINT_BONUS_CAP,
        endorsementCount * PROTEST_CONFIG.JOINT_BONUS_PER_PARTY
    );
}

// ==================== TIER EFFECTS (PURE) ====================

/**
 * Compute the one-time effects for Tiers 1-5.
 * Returns an effect descriptor — caller is responsible for applying to DB.
 * @param {number} tier
 * @param {object} opts - { govApproval, callingFactionId }
 * @returns {object} { govApprovalDelta, civilUnrestDelta, fizzleGovBoost, organiserVisibility, organiserApproval, organiserEnthusiasm, isCrisis }
 */
export function computeTierEffects(tier, opts = {}) {
    const effects = {
        govApprovalDelta: 0,
        civilUnrestDelta: 0,
        fizzleGovBoost: 0,
        // Organiser penalties (Tier 1-2 backfires)
        organiserVisibility: 0,
        organiserApproval: 0,
        organiserEnthusiasm: 0,
        isCrisis: false,
    };

    switch (tier) {
        case 1: {
            // Embarrassing Backfire: organiser looks foolish, gov gets a boost
            effects.organiserVisibility = PROTEST_CONFIG.FIZZLE_T1_VISIBILITY;
            effects.organiserApproval = PROTEST_CONFIG.FIZZLE_T1_APPROVAL;
            effects.organiserEnthusiasm = PROTEST_CONFIG.FIZZLE_T1_ENTHUSIASM;
            if ((opts.govApproval || 0) >= PROTEST_CONFIG.FIZZLE_GOV_APPROVAL_MIN_THRESHOLD) {
                effects.fizzleGovBoost = Math.ceil(Math.random() * PROTEST_CONFIG.FIZZLE_GOV_APPROVAL_MAX_BOOST);
            }
            break;
        }
        case 2: {
            // Protests Don't Materialise: mild backfire, gov gets a boost
            effects.organiserVisibility = PROTEST_CONFIG.FIZZLE_T2_VISIBILITY;
            effects.organiserApproval = PROTEST_CONFIG.FIZZLE_T2_APPROVAL;
            effects.organiserEnthusiasm = PROTEST_CONFIG.FIZZLE_T2_ENTHUSIASM;
            if ((opts.govApproval || 0) >= PROTEST_CONFIG.FIZZLE_GOV_APPROVAL_MIN_THRESHOLD) {
                effects.fizzleGovBoost = Math.ceil(Math.random() * PROTEST_CONFIG.FIZZLE_GOV_APPROVAL_MAX_BOOST);
            }
            break;
        }
        case 3: {
            // Modest Turnout: gov approval -1
            effects.govApprovalDelta = -1;
            break;
        }
        case 4: {
            // Respectable Protest: gov approval -3
            effects.govApprovalDelta = -3;
            break;
        }
        case 5: {
            // Strong Demonstration: gov approval -6, civil unrest +2
            effects.govApprovalDelta = -6;
            effects.civilUnrestDelta = 2;
            break;
        }
        case 6:
        case 7: {
            // Crisis — handled by tick processor, not one-time effects
            effects.isCrisis = true;
            break;
        }
    }

    return effects;
}

/**
 * Compute per-tick crisis effects for an active Tier 6 protest crisis.
 * @param {number} ticksActive - how many ticks the crisis has been running
 * @param {boolean} publicAddressThisTick - was Public Address used this tick?
 * @returns {object} stat deltas to apply
 */
export function computeTier6CrisisEffects(ticksActive, publicAddressThisTick) {
    // Alpha refactor: civil_unrest + political_violence both → unrest
    // (sum the per-tick deltas at config time); foreign_investment
    // dropped (column gone with no replacement).
    const effects = {
        gov_approval: PROTEST_CONFIG.TIER6_GOV_APPROVAL_PER_TICK,
        unrest: PROTEST_CONFIG.TIER6_CIVIL_UNREST_PER_TICK
              + PROTEST_CONFIG.TIER6_POLITICAL_VIOLENCE_PER_TICK,
        gdp_growth: PROTEST_CONFIG.TIER6_GDP_GROWTH_PER_TICK,
    };

    // Public Address reduces unrest accumulation by 1 that tick
    if (publicAddressThisTick) {
        effects.unrest = Math.max(0, effects.unrest - 1);
    }

    return effects;
}

/**
 * Compute per-tick crisis effects for an active Tier 7 protest crisis.
 * @param {boolean} publicAddressThisTick
 * @returns {object} stat deltas to apply
 */
export function computeTier7CrisisEffects(publicAddressThisTick) {
    // Alpha refactor: see computeTier6CrisisEffects above for the
    // collapse rationale.
    const effects = {
        gov_approval: PROTEST_CONFIG.TIER7_GOV_APPROVAL_PER_TICK,
        unrest: PROTEST_CONFIG.TIER7_CIVIL_UNREST_PER_TICK
              + PROTEST_CONFIG.TIER7_POLITICAL_VIOLENCE_PER_TICK,
        gdp_growth: PROTEST_CONFIG.TIER7_GDP_GROWTH_PER_TICK,
    };

    // Public Address reduces unrest accumulation by 1
    if (publicAddressThisTick) {
        effects.unrest = Math.max(0, effects.unrest - 1);
    }

    return effects;
}

// ==================== TIER 7 DEMAND GENERATION ====================

/**
 * Generate a Tier 7 demand from the worst-performing eligible stat.
 * Falls back to most unpopular minister if no stat is failing.
 *
 * @param {Array} statSnapshots - [{ key, current, sixTicksAgo, avgAbsChangePerTick }]
 * @param {Array} ministers - [{ ministry_key, minister_name, minister_approval }]
 * @returns {object} demand object { type, stat?, magnitude?, direction?, target?, label }
 */
export function generateTier7Demand(statSnapshots, ministers) {
    // Find worst-performing eligible stat
    const failingStats = (statSnapshots || [])
        .filter(s => TIER7_ELIGIBLE_STATS.has(s.key))
        .map(s => {
            const score = getStatFailureScore(s.current, s.sixTicksAgo, s.key);
            return { ...s, failureScore: score };
        })
        .filter(s => s.failureScore > 0)
        .sort((a, b) => b.failureScore - a.failureScore);

    if (failingStats.length > 0) {
        const worst = failingStats[0];
        const rawDemand = Math.round((worst.avgAbsChangePerTick || 1) * 6 * 1.5);
        const magnitude = Math.max(PROTEST_CONFIG.TIER7_DEMAND_MIN_MAGNITUDE, rawDemand);
        const direction = HIGHER_IS_BAD.has(worst.key) ? 'reduce' : 'raise';

        return {
            type: 'stat',
            stat: worst.key,
            magnitude,
            direction,
            label: `${direction === 'reduce' ? 'Reduce' : 'Raise'} ${worst.displayName || worst.key} by ${magnitude}`,
        };
    }

    // Fallback: most unpopular minister
    const sorted = (ministers || [])
        .filter(m => !m.is_vacant)
        .sort((a, b) => (a.minister_approval || 50) - (b.minister_approval || 50));

    if (sorted.length > 0) {
        const worst = sorted[0];
        return {
            type: 'minister',
            target: worst.ministry_key,
            targetName: worst.minister_name,
            label: `${worst.minister_name || worst.ministry_key} must resign.`,
        };
    }

    // Absolute fallback
    return {
        type: 'stat',
        stat: 'happiness',
        magnitude: PROTEST_CONFIG.TIER7_DEMAND_MIN_MAGNITUDE,
        direction: 'raise',
        label: `Raise Happiness by ${PROTEST_CONFIG.TIER7_DEMAND_MIN_MAGNITUDE}`,
    };
}

// ==================== TIER 7 DEMAND CHECK ====================

/**
 * Check whether a Tier 7 demand has been met.
 *
 * @param {object} demand - The tier7_demand object stored on the protest_log row
 *   { type: 'stat', stat, magnitude, direction, baseline? } or { type: 'minister', target }
 * @param {object} nation - Current nation row (stat values)
 * @param {Array} ministers - Current minister rows [{ ministry_key, party_id }]
 * @returns {boolean}
 */
export function checkTier7DemandMet(demand, nation, ministers) {
    if (!demand) return false;

    if (demand.type === 'stat') {
        const current = Number(nation?.[demand.stat] ?? 0);
        const baseline = Number(demand.baseline ?? current);
        const magnitude = Number(demand.magnitude || 0);
        if (demand.direction === 'reduce') {
            return current <= baseline - magnitude;
        }
        // direction === 'raise'
        return current >= baseline + magnitude;
    }

    if (demand.type === 'minister') {
        // Demand met if the targeted ministry is now vacant (minister was dismissed)
        const ministry = (ministers || []).find(m => m.ministry_key === demand.target);
        if (!ministry) return false;
        return ministry.party_id == null; // vacant
    }

    return false;
}

// ==================== POLITICAL VIOLENCE DECAY ====================

/**
 * Calculate the Political Violence baseline floor based on inequality/poverty.
 * @param {number} incomeInequality - 0-100
 * @param {number} povertyRate - 0-100
 * @returns {number} floor value
 */
export function getPoliticalViolenceFloor(incomeInequality, povertyRate) {
    return ((incomeInequality || 0) / 100) * 20 + ((povertyRate || 0) / 100) * 15;
}

/**
 * Calculate Political Violence decay for a tick.
 * Decay pauses while Tier 6/7 crisis is active.
 * @param {number} currentValue
 * @param {number} incomeInequality
 * @param {number} povertyRate
 * @param {boolean} protestCrisisActive - is a T6/T7 protest crisis running?
 * @param {boolean} enforcePublicOrderActive - is EPO ministry action active?
 * @returns {number} new political_violence value
 */
export function decayPoliticalViolence(currentValue, incomeInequality, povertyRate, protestCrisisActive, enforcePublicOrderActive) {
    if (protestCrisisActive) return currentValue; // decay pauses during crisis

    const floor = getPoliticalViolenceFloor(incomeInequality, povertyRate);
    const decayRate = enforcePublicOrderActive ? 1.5 : 0.5;
    return Math.max(floor, currentValue - decayRate);
}

// ==================== LOCKOUT HELPERS ====================

/**
 * Check if a faction can call a protest.
 * @param {object} faction - { protest_cooldown_until_tick, protest_locked_by }
 * @param {number} currentTick
 * @param {boolean} isOpposition
 * @param {object|null} activeProtestByFaction - active protest_log row for this faction (or null)
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canCallProtest(faction, currentTick, isOpposition, activeProtestByFaction) {
    if (!isOpposition) {
        return { allowed: false, reason: 'Only opposition parties can organise protests.' };
    }
    if (activeProtestByFaction) {
        return { allowed: false, reason: 'A protest is already running. Cannot call another until resolved.' };
    }
    if (faction.protest_locked_by) {
        return { allowed: false, reason: 'Protests locked by an active crisis led by another party.' };
    }
    if (faction.protest_cooldown_until_tick && faction.protest_cooldown_until_tick > currentTick) {
        const remaining = faction.protest_cooldown_until_tick - currentTick;
        return { allowed: false, reason: `Cooldown: ${remaining} tick${remaining !== 1 ? 's' : ''} remaining.` };
    }
    return { allowed: true };
}

/**
 * Check if a faction can endorse a protest.
 * @param {object} faction
 * @param {number} currentTick
 * @param {boolean} isOpposition
 * @param {string} callingFactionId - the faction that called the protest
 * @param {boolean} alreadyEndorsed
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canEndorseProtest(faction, currentTick, isOpposition, callingFactionId, alreadyEndorsed) {
    if (!isOpposition) {
        return { allowed: false, reason: 'Only opposition parties can endorse protests.' };
    }
    if (faction.id === callingFactionId) {
        return { allowed: false, reason: 'Cannot endorse your own protest.' };
    }
    if (alreadyEndorsed) {
        return { allowed: false, reason: 'Already endorsed this protest.' };
    }
    if ((faction.action_points || 0) < 1) {
        return { allowed: false, reason: 'Need 1 AP to endorse.' };
    }
    return { allowed: true };
}

// ==================== MOMENTUM INDICATOR ====================

/**
 * Compute the pre-endorsement momentum indicator for UI display.
 * @param {number} conditionScore - base condition score
 * @param {number} currentEndorsements - existing endorsement count
 * @returns {{ label: string, color: string, projectedTier: number, impactNote: string }}
 */
export function getEndorsementMomentumIndicator(conditionScore, currentEndorsements) {
    const bonusSoFar = calculateJointProtestBonus(currentEndorsements);
    const bonusAfter = calculateJointProtestBonus(currentEndorsements + 1);
    const projectedScore = Math.min(100, conditionScore + bonusAfter + PROTEST_CONFIG.ENDORSEMENT_BONUS);
    const projectedTier = getTurnoutTier(projectedScore);
    const currentTier = getTurnoutTier(Math.min(100, conditionScore + bonusSoFar));

    let label, color;
    if (projectedScore >= 90) {
        label = 'VERY STRONG';
        color = '#d9534f';
    } else if (projectedScore >= 65) {
        label = 'STRONG';
        color = '#f97316';
    } else if (projectedScore >= 45) {
        label = 'MODERATE';
        color = '#c8a64e';
    } else {
        label = 'WEAK';
        color = '#5cb85c';
    }

    let impactNote;
    if (projectedTier > currentTier) {
        impactNote = `+${PROTEST_CONFIG.ENDORSEMENT_BONUS} to roll — likely pushes toward Tier ${projectedTier}`;
    } else {
        impactNote = `+${PROTEST_CONFIG.ENDORSEMENT_BONUS} to roll — score already in Tier ${currentTier} range`;
    }

    return { label, color, projectedTier, impactNote };
}

// ==================== STAT HINT PILL COLORS ====================

/**
 * Get color for a stat hint pill based on whether it helps or hurts turnout.
 * Red = makes high turnout more likely, Green = less likely, Amber = neutral.
 * @param {string} statKey
 * @param {number} value - 0-100
 * @returns {string} hex color
 */
export function getStatHintColor(statKey, value) {
    if (statKey === 'civil_unrest' || statKey === 'polarization') {
        // Higher = more turnout (bad for government = red)
        if (value >= 60) return '#d9534f';
        if (value >= 30) return '#c8a64e';
        return '#5cb85c';
    }
    if (statKey === 'happiness') {
        // Lower happiness = more turnout (inverted)
        if (value <= 40) return '#d9534f';
        if (value <= 60) return '#c8a64e';
        return '#5cb85c';
    }
    if (statKey === 'political_violence') {
        // Higher = less turnout (suppresses protest = green)
        if (value >= 60) return '#5cb85c';
        if (value >= 30) return '#c8a64e';
        return '#d9534f';
    }
    return '#c8a64e';
}

// ==================== EXECUTE FUNCTIONS ====================

/**
 * Execute the Organise a Protest action.
 * 1. Validate opposition status, cooldowns, AP
 * 2. Atomically deduct AP + insert protest_log via RPC
 * 3. Protest enters 'resolving' state (1-tick delay before turnout rolls)
 *
 * Returns { success, protestId, apCost, newAp, useCount } or { success: false, error }
 */
export async function executeProtest(supabase, factionId, nationId, grievanceType, grievanceData, demandLabel, currentTick) {
    // ── 1. Load faction ──
    const { data: faction } = await supabase
        .from('factions')
        .select('id, action_points, protest_use_count, protest_last_use_tick, protest_cooldown_until_tick, protest_locked_by, nation_id')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };

    // ── 2. Check opposition status ──
    const coalition = await fetchActiveCoalition(supabase, nationId);
    const coalitionIds = new Set(coalition?.party_ids || []);
    const { data: nationRow } = await supabase
        .from('nations').select('ruling_faction_id').eq('id', nationId).single();
    const isOpposition = !coalitionIds.has(factionId) && nationRow?.ruling_faction_id !== factionId;

    // ── 3. Check for active protest by this faction ──
    const { data: activeProtest } = await supabase
        .from('protest_log')
        .select('id')
        .eq('faction_id', factionId)
        .in('status', ['resolving', 'crisis_active'])
        .limit(1).maybeSingle();

    const check = canCallProtest(faction, currentTick, isOpposition, activeProtest);
    if (!check.allowed) return { success: false, error: check.reason };

    // ── 4. Compute decayed use count and AP cost ──
    const decayedUseCount = getDecayedUseCount(
        faction.protest_use_count || 0,
        faction.protest_last_use_tick,
        currentTick
    );
    const apCost = getProtestCost(decayedUseCount);

    if ((faction.action_points || 0) < apCost) {
        return { success: false, error: `Not enough AP. Need ${apCost}, have ${faction.action_points || 0}.` };
    }

    // ── 5. Atomic RPC: deduct AP + insert protest_log ──
    const { data: protestId, error: rpcError } = await supabase.rpc('execute_protest', {
        p_faction_id: factionId,
        p_nation_id: nationId,
        p_ap_cost: apCost,
        p_grievance_type: grievanceType,
        p_grievance_data: grievanceData || {},
        p_demand_label: demandLabel || '',
        p_use_count: decayedUseCount,
        p_tick: currentTick,
    });

    if (rpcError) {
        console.error('[Protest] execute_protest RPC failed:', rpcError.message);
        return { success: false, error: rpcError.message };
    }


    return {
        success: true,
        protestId,
        apCost,
        newAp: (faction.action_points || 0) - apCost,
        useCount: decayedUseCount + 1,
        headline: 'Protest Organised',
        effects: [
            { label: 'AP Spent', value: -apCost },
        ],
        demandText: demandLabel || grievanceType,
        outcomeName: 'Gathering momentum — outcome resolves next tick',
    };
}

/**
 * Endorse an active protest called by another opposition party.
 * Costs 1 AP (non-refundable). Adds +15 to the turnout roll on resolution.
 *
 * Returns { success, endorsementBonus } or { success: false, error }
 */
export async function endorseProtest(supabase, factionId, nationId, protestId, currentTick) {
    // ── 1. Load faction ──
    const { data: faction } = await supabase
        .from('factions')
        .select('id, action_points')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };

    // ── 2. Load the protest ──
    const { data: protest } = await supabase
        .from('protest_log')
        .select('id, faction_id, status, nation_id')
        .eq('id', protestId).single();
    if (!protest) return { success: false, error: 'Protest not found.' };
    if (protest.status !== 'resolving') {
        return { success: false, error: 'Can only endorse protests that are still resolving.' };
    }

    // ── 3. Check opposition status ──
    const coalition = await fetchActiveCoalition(supabase, nationId);
    const coalitionIds = new Set(coalition?.party_ids || []);
    const { data: nationRow } = await supabase
        .from('nations').select('ruling_faction_id').eq('id', nationId).single();
    const isOpposition = !coalitionIds.has(factionId) && nationRow?.ruling_faction_id !== factionId;

    // ── 4. Check if already endorsed ──
    const { data: existing } = await supabase
        .from('protest_endorsements')
        .select('id')
        .eq('protest_id', protestId)
        .eq('faction_id', factionId)
        .maybeSingle();

    const check = canEndorseProtest(faction, currentTick, isOpposition, protest.faction_id, !!existing);
    if (!check.allowed) return { success: false, error: check.reason };

    // ── 5. Atomic RPC: deduct 1 AP + insert endorsement ──
    const { error: rpcError } = await supabase.rpc('endorse_protest', {
        p_faction_id: factionId,
        p_protest_id: protestId,
        p_tick: currentTick,
    });

    if (rpcError) {
        console.error('[Protest] endorse_protest RPC failed:', rpcError.message);
        return { success: false, error: rpcError.message };
    }

    // Count total endorsements for bonus calculation
    const { count } = await supabase
        .from('protest_endorsements')
        .select('id', { count: 'exact', head: true })
        .eq('protest_id', protestId);


    return {
        success: true,
        endorsementBonus: calculateJointProtestBonus(count ?? 0),
    };
}

/**
 * Call off an active Tier 6 protest crisis. Costs 1 AP.
 * Crisis ends in CALL_OFF_WIND_DOWN_TICKS (2 ticks). Small approval boost from moderate blocs.
 * Tier 7 cannot be called off.
 *
 * Returns { success } or { success: false, error }
 */
export async function callOffProtest(supabase, factionId, protestId, currentTick) {
    // ── 1. Load the protest ──
    const { data: protest } = await supabase
        .from('protest_log')
        .select('id, faction_id, nation_id, tier, status, crisis_started_tick')
        .eq('id', protestId).single();
    if (!protest) return { success: false, error: 'Protest not found.' };

    // Only the calling faction can call it off
    if (protest.faction_id !== factionId) {
        return { success: false, error: 'Only the party that called the protest can call it off.' };
    }
    if (protest.status !== 'crisis_active') {
        return { success: false, error: 'No active crisis to call off.' };
    }
    if (protest.tier === 7) {
        return { success: false, error: 'Tier 7 protests cannot be called off.' };
    }

    // ── 2. Load faction for AP check ──
    const { data: faction } = await supabase
        .from('factions')
        .select('id, action_points')
        .eq('id', factionId).single();
    if (!faction) return { success: false, error: 'Faction not found.' };
    if ((faction.action_points || 0) < PROTEST_CONFIG.CALL_OFF_AP) {
        return { success: false, error: `Not enough AP. Need ${PROTEST_CONFIG.CALL_OFF_AP}.` };
    }

    // ── 3. Deduct AP ──
    const { data: newAp, error: apErr } = await supabase.rpc('deduct_ap', {
        p_faction_id: factionId,
        p_cost: PROTEST_CONFIG.CALL_OFF_AP,
    });
    if (apErr) {
        console.error('[Protest] deduct_ap failed for call-off:', apErr.message);
        return { success: false, error: apErr.message };
    }
    if (newAp < 0) {
        return { success: false, error: 'Insufficient AP.' };
    }

    // ── 4. Set crisis to wind down — tick processor will end it after 2 ticks ──
    const windDownEndTick = currentTick + PROTEST_CONFIG.CALL_OFF_WIND_DOWN_TICKS;
    await protestUpdate(supabase, protestId, {
        crisis_ended_tick: windDownEndTick,
        status: 'called_off',
    });

    // Moderate bloc approval boost removed — electorate engine handles this now
    const nationId = protest.nation_id;


    // Dispatch article + event
    const { data: callingFaction } = await supabase.from('factions').select('faction_name').eq('id', factionId).single();
    const partyName = callingFaction?.faction_name || 'Opposition';
    const coHeadline = pickHeadline('protest_called_off').replace('{party}', partyName);
    dispatchProtestArticle(supabase, nationId, 'protest_called_off', coHeadline,
        `${partyName} has called off the protest, ordering supporters to return home. The crisis is expected to wind down within two ticks.`,
        2, currentTick, protestId);
    fireProtestEvent(supabase, nationId, 'protest:called_off', currentTick, { party: partyName, protest_id: protestId });

    return {
        success: true,
        newAp: newAp,
        windDownEndTick,
    };
}

// ==================== ARTICLE DISPATCH HELPER ====================

const PROTEST_HEADLINE_POOLS = {
    protest_fizzle: [
        'Protest Falls Flat — Organisers Lose Credibility',
        'Attempted Protest Fizzles as Turnout Disappoints',
        'Opposition Protest Fails to Materialise',
    ],
    protest_resolved: [
        'Protest Rocks the Capital',
        'Mass Demonstration Pressures Government',
        'Protest Movement Gains Traction',
        'Citizens Take to the Streets in Large Numbers',
    ],
    protest_epo_resolved: [
        'Government Crackdown Ends Protest Crisis',
        'Enforce Public Order Succeeds: Protest Dispersed by Authorities',
    ],
    protest_epo_escalated: [
        'Crackdown Backfires — Protest Escalates to Nationwide Crisis',
        'Police Action Inflames Protesters — Nationwide Uprising Erupts',
    ],
    protest_emergency: [
        'National Emergency Declared — Protest Crisis Ended at Severe Cost',
        'Government Crushes Protest Movement Under Emergency Rule',
    ],
    protest_called_off: [
        'Protest Called Off — Moderates Breathe Sigh of Relief',
    ],
    protest_public_address: [
        'Government Issues Public Address Amid Ongoing Protest Crisis',
    ],
};

function pickHeadline(eventType) {
    const pool = PROTEST_HEADLINE_POOLS[eventType] || ['Protest Update'];
    return pool[Math.floor(Math.random() * pool.length)];
}

async function dispatchProtestArticle(supabase, nationId, eventType, headline, lede, tier, tick, sourceId) {
    try {
        await supabase.from('valdorian_articles').insert({
            nation_id: nationId,
            event_type: eventType,
            tier,
            section: 'politics',
            headline,
            lede,
            body_paragraphs: [],
            quotes: [],
            byline_reporter: ['Maren Solis', 'Davi Cortes', 'Elena Brandt'][Math.floor(Math.random() * 3)],
            topic_tags: ['protest'],
            source_event_id: sourceId || null,
            tick,
        });
    } catch (err) {
        console.warn('[Protest] Article dispatch failed:', err.message);
    }
}

async function fireProtestEvent(supabase, nationId, triggerKey, tick, placeholders) {
    try {
        await supabase.rpc('fire_system_event', {
            p_nation_id: nationId,
            p_trigger_key: triggerKey,
            p_tick: tick,
            p_placeholders: placeholders || {},
        });
    } catch (err) {
        console.warn('[Protest] fire_system_event failed:', err.message);
    }
}

// ==================== GOVERNMENT RESPONSE FUNCTIONS ====================

/**
 * Execute Public Address — governing party action during T6/T7 crisis.
 * Costs 1 AP, 3-tick cooldown. Reduces civil unrest accumulation by 1 that tick,
 * gives +1 moderate bloc approval to the RULING party.
 *
 * Returns { success, newAp, cooldownUntilTick } or { success: false, error }
 */
export async function executePublicAddress(supabase, factionId, nationId, protestId, currentTick) {
    // ── 1. Load the protest crisis ──
    const { data: protest } = await supabase
        .from('protest_log')
        .select('id, status, tier, public_address_last_tick')
        .eq('id', protestId).single();
    if (!protest) return { success: false, error: 'Protest not found.' };
    if (protest.status !== 'crisis_active') {
        return { success: false, error: 'No active protest crisis to address.' };
    }
    if (protest.tier < 6) {
        return { success: false, error: 'Public Address is only available during Tier 6/7 crises.' };
    }

    // ── 2. Check faction is PM/President (lead party only) ──
    const coalition = await fetchActiveCoalition(supabase, nationId);
    const { data: nationRow } = await supabase
        .from('nations').select('ruling_faction_id').eq('id', nationId).single();
    const isLeadParty = coalition?.lead_party_id === factionId || nationRow?.ruling_faction_id === factionId;
    if (!isLeadParty) {
        return { success: false, error: 'Only the Prime Minister or President can issue a Public Address.' };
    }

    // ── 3. Cooldown check ──
    if (protest.public_address_last_tick != null &&
        (currentTick - protest.public_address_last_tick) < PROTEST_CONFIG.PUBLIC_ADDRESS_COOLDOWN) {
        const remaining = PROTEST_CONFIG.PUBLIC_ADDRESS_COOLDOWN - (currentTick - protest.public_address_last_tick);
        return { success: false, error: `Public Address on cooldown: ${remaining} tick${remaining !== 1 ? 's' : ''} remaining.` };
    }

    // ── 4. Mutual exclusion: no EPO or NE same tick ──
    const { data: sameTickActions } = await supabase
        .from('ministry_action_log')
        .select('action_key')
        .eq('nation_id', nationId)
        .eq('applied_at_tick', currentTick)
        .in('action_key', ['enforcePublicOrder', 'nationalEmergencyOnProtest']);
    if (sameTickActions && sameTickActions.length > 0) {
        return { success: false, error: 'Cannot use Public Address in the same tick as Enforce Public Order or National Emergency.' };
    }

    // ── 5. Deduct 1 AP ──
    const { data: newAp, error: apErr } = await supabase.rpc('deduct_ap', {
        p_faction_id: factionId,
        p_cost: PROTEST_CONFIG.PUBLIC_ADDRESS_AP,
    });
    if (apErr) return { success: false, error: apErr.message };
    if (newAp < 0) return { success: false, error: 'Insufficient AP.' };

    // ── 6. Roll for crisis resolution ──
    // T6: 40% chance to end crisis. T7: 15% chance.
    const resolveChance = protest.tier === 7 ? 0.15 : 0.40;
    const roll = Math.random();
    const resolved = roll < resolveChance;

    if (resolved) {
        // Crisis ends — address succeeded in calming the situation
        await protestUpdate(supabase, protestId, {
            status: 'resolved',
            tick_resolved: currentTick,
            public_address_last_tick: currentTick,
        }, true, protest.faction_id, currentTick + PROTEST_CONFIG.CALLING_PARTY_COOLDOWN);

        // Crisis sunset (Phase 2): the matching active_crises row delete
        // (TIER6 or TIER7 protest crisis) is gone — the crisis row no
        // longer exists. Protest state still lives in protest_log.status.

        const headline = pickHeadline('protest_public_address');
        const lede = 'The government\'s public address resonated with the people. The protest crisis has ended peacefully.';
        dispatchProtestArticle(supabase, nationId, 'protest_public_address', headline, lede, 3, currentTick, protestId);
        fireProtestEvent(supabase, nationId, 'protest:public_address_resolved', currentTick, { protest_id: protestId });

        return {
            success: true,
            newAp,
            outcome: 'resolved',
            cooldownUntilTick: currentTick + PROTEST_CONFIG.PUBLIC_ADDRESS_COOLDOWN,
        };
    }

    // ── 7. Not resolved — mark cooldown, standard effects still apply ──
    await protestUpdate(supabase, protestId, {
        public_address_last_tick: currentTick,
    });

    const headline = pickHeadline('protest_public_address');
    const lede = 'The government issued a public address amid the ongoing protest crisis, calling for calm and dialogue.';
    dispatchProtestArticle(supabase, nationId, 'protest_public_address', headline, lede, 3, currentTick, protestId);
    fireProtestEvent(supabase, nationId, 'protest:public_address', currentTick, { protest_id: protestId });

    return {
        success: true,
        newAp,
        outcome: 'continued',
        cooldownUntilTick: currentTick + PROTEST_CONFIG.PUBLIC_ADDRESS_COOLDOWN,
    };
}

/**
 * Execute Enforce Public Order on an active protest crisis.
 * 33% chance: crisis ends immediately. 66% chance: escalates to Tier 7.
 * Only works on Tier 6. Can only be used by the Interior ministry owner.
 *
 * Returns { success, outcome: 'resolved'|'escalated', ... } or { success: false, error }
 */
export async function executeEPOOnCrisis(supabase, factionId, nationId, protestId, currentTick) {
    // ── 1. Load the protest crisis ──
    const { data: protest } = await supabase
        .from('protest_log')
        .select('id, status, tier, faction_id, crisis_started_tick, crisis_duration')
        .eq('id', protestId).single();
    if (!protest) return { success: false, error: 'Protest not found.' };
    if (protest.status !== 'crisis_active') {
        return { success: false, error: 'No active protest crisis.' };
    }
    if (protest.tier !== 6) {
        return { success: false, error: 'Enforce Public Order can only be used on Tier 6 (Nationwide Protests) crises.' };
    }

    // ── 2. Check faction owns Interior ministry ──
    const { data: interiorMinistry } = await supabase
        .from('ministries')
        .select('party_id')
        .eq('nation_id', nationId)
        .eq('ministry_key', 'interior')
        .single();
    if (!interiorMinistry || interiorMinistry.party_id !== factionId) {
        return { success: false, error: 'Only the party controlling the Interior Ministry can use EPO.' };
    }

    // ── 3. Mutual exclusion: no Public Address or NE same tick ──
    const paCheck = await supabase.from('protest_log')
        .select('public_address_last_tick')
        .eq('id', protestId).single();
    if (paCheck?.data?.public_address_last_tick === currentTick) {
        return { success: false, error: 'Cannot use EPO in the same tick as Public Address.' };
    }

    // ── 4. AP cost — use the normal EPO action cost from ministry config ──
    const { data: faction } = await supabase
        .from('factions')
        .select('id, action_points')
        .eq('id', factionId).single();
    const epoApCost = 2; // Base EPO cost
    if ((faction?.action_points || 0) < epoApCost) {
        return { success: false, error: `Not enough AP. Need ${epoApCost}, have ${faction?.action_points || 0}.` };
    }

    const { data: newAp, error: apErr } = await supabase.rpc('deduct_ap', {
        p_faction_id: factionId,
        p_cost: epoApCost,
    });
    if (apErr) return { success: false, error: apErr.message };
    if (newAp < 0) return { success: false, error: 'Insufficient AP.' };

    // ── 5. Roll: 33% success, 66% escalation ──
    const roll = Math.random();
    const success = roll < PROTEST_CONFIG.TIER6_ENFORCE_SUCCESS_CHANCE;

    if (success) {
        // Crisis ends immediately — single RPC handles protest_log + lockouts + cooldown
        await protestUpdate(supabase, protestId, {
            status: 'resolved',
            tick_resolved: currentTick,
            effects_applied: [
                ...(protest.effects_applied || []),
                { stat: 'epo_resolved', tick: currentTick },
            ],
        }, true, protest.faction_id, currentTick + PROTEST_CONFIG.CALLING_PARTY_COOLDOWN);

        // Crisis sunset (Phase 2): matching TIER6 active_crises delete
        // removed. Protest state lives in protest_log.status.

        // 1d6 government approval boost for resolving crisis via EPO
        const epoResolveBoost = Math.ceil(Math.random() * 6);
        await adjustGovernmentApprovalEvent(supabase, nationId, epoResolveBoost, 'crisis:resolved:epo');

        const resolvedHeadline = pickHeadline('protest_epo_resolved');
        dispatchProtestArticle(supabase, nationId, 'protest_epo_resolved', resolvedHeadline,
            'The Interior Ministry\'s enforcement action successfully ended the protest crisis.', 1, currentTick, protestId);
        fireProtestEvent(supabase, nationId, 'protest:epo_resolved', currentTick, { protest_id: protestId });
        return { success: true, outcome: 'resolved', newAp };
    } else {
        // Escalation: T6 → T7. Crisis sunset (Phase 2): the original
        // "2+ other active_crises rows must exist" gate (an active_crises
        // SELECT) has been removed — EPO failure now always escalates.
        // The T6 → T7 active_crises row swap is also gone; protest tier
        // promotion still happens via protest_log so the in-protest T7
        // demand mechanic continues to work.

        // Generate T7 demand
        const { data: statRows } = await supabase
            .from('stat_history')
            .select('stat_name, value, tick')
            .eq('nation_id', nationId)
            .gte('tick', currentTick - 6)
            .order('tick', { ascending: true });

        const statMap = {};
        for (const row of (statRows || [])) {
            if (!statMap[row.stat_name]) statMap[row.stat_name] = [];
            statMap[row.stat_name].push({ tick: row.tick, value: row.value });
        }
        const { data: nationData } = await supabase
            .from('nations').select('*').eq('id', nationId).single();

        const statSnapshots = Object.entries(statMap).map(([key, history]) => {
            const sorted = history.sort((a, b) => a.tick - b.tick);
            const current = nationData?.[key] ?? sorted[sorted.length - 1]?.value ?? 0;
            const sixAgo = sorted[0]?.value ?? current;
            const changes = sorted.slice(1).map((h, i) => Math.abs(h.value - sorted[i].value));
            const avgAbsChangePerTick = changes.length > 0 ? changes.reduce((s, v) => s + v, 0) / changes.length : 1;
            return { key, current, sixTicksAgo: sixAgo, avgAbsChangePerTick, displayName: key.replace(/_/g, ' ') };
        });

        const { data: ministers } = await supabase
            .from('ministries')
            .select('ministry_key, minister_first_name, minister_last_name, minister_approval, party_id')
            .eq('nation_id', nationId);
        const ministerList = (ministers || []).map(m => ({
            ...m,
            is_vacant: m.party_id == null,
            minister_name: `${m.minister_first_name || ''} ${m.minister_last_name || ''}`.trim(),
        }));

        const demand = generateTier7Demand(statSnapshots, ministerList);

        // Store the baseline stat value so we can check if the demand has been met
        if (demand.type === 'stat' && nationData) {
            demand.baseline = Number(nationData[demand.stat] ?? 0);
        }

        // Update protest to T7
        await protestUpdate(supabase, protestId, {
            tier: 7,
            crisis_started_tick: currentTick,
            crisis_duration: 1 + Math.floor(Math.random() * 12), // 1d12
            tier7_demand: demand,
            effects_applied: [
                ...(protest.effects_applied || []),
                { stat: 'epo_escalated', tick: currentTick },
            ],
        });

        const escalatedHeadline = pickHeadline('protest_epo_escalated');
        dispatchProtestArticle(supabase, nationId, 'protest_epo_escalated', escalatedHeadline,
            `A government crackdown backfired, escalating the crisis to The Big One. Demonstrators now demand: ${demand?.label || 'immediate action'}.`,
            1, currentTick, protestId);
        fireProtestEvent(supabase, nationId, 'protest:epo_escalated', currentTick, {
            protest_id: protestId, demand: demand?.label || '',
        });
        return { success: true, outcome: 'escalated', newAp, demand };
    }
}

/**
 * Execute National Emergency on an active protest crisis.
 * Immediately ends ANY tier crisis but at severe cost:
 * civil_unrest +15, political_violence +10, happiness -10, gov_approval -10.
 * Only the ruling faction can invoke this.
 *
 * Returns { success, newAp } or { success: false, error }
 */
export async function executeNationalEmergencyOnProtest(supabase, factionId, nationId, protestId, currentTick) {
    // ── 1. Load the protest crisis ──
    const { data: protest } = await supabase
        .from('protest_log')
        .select('id, status, tier, faction_id')
        .eq('id', protestId).single();
    if (!protest) return { success: false, error: 'Protest not found.' };
    if (protest.status !== 'crisis_active') {
        return { success: false, error: 'No active protest crisis.' };
    }

    // ── 2. Check faction is the ruling faction (head of government) ──
    const { data: nationRow } = await supabase
        .from('nations').select('ruling_faction_id').eq('id', nationId).single();
    const coalition = await fetchActiveCoalition(supabase, nationId);
    const isLeadParty = coalition?.lead_party_id === factionId;
    const isRuling = nationRow?.ruling_faction_id === factionId || isLeadParty;
    if (!isRuling) {
        return { success: false, error: 'Only the ruling party can declare a National Emergency.' };
    }

    // ── 3. Mutual exclusion ──
    const paCheck = await supabase.from('protest_log')
        .select('public_address_last_tick')
        .eq('id', protestId).single();
    if (paCheck?.data?.public_address_last_tick === currentTick) {
        return { success: false, error: 'Cannot declare National Emergency in the same tick as Public Address.' };
    }

    // ── 4. AP cost: 5 AP ──
    const neCost = 5;
    const { data: newAp, error: apErr } = await supabase.rpc('deduct_ap', {
        p_faction_id: factionId,
        p_cost: neCost,
    });
    if (apErr) return { success: false, error: apErr.message };
    if (newAp < 0) return { success: false, error: `Insufficient AP. Need ${neCost}.` };

    // ── 5. End the crisis immediately ──
    // Crisis sunset (Phase 2): the matching T6/T7 active_crises row
    // delete is gone; protest_log.status='resolved' is the canonical
    // end signal.

    // Single RPC handles protest_log + lockouts + cooldown
    await protestUpdate(supabase, protestId, {
        status: 'resolved',
        tick_resolved: currentTick,
        effects_applied: [
            ...(protest.effects_applied || []),
            { stat: 'national_emergency', tick: currentTick },
        ],
    }, true, protest.faction_id, currentTick + PROTEST_CONFIG.CALLING_PARTY_COOLDOWN);

    // ── 6. Apply severe stat costs ──
    const { data: nation } = await supabase
        .from('nations').select('unrest, standard_of_living').eq('id', nationId).single();

    await supabase.from('nations').update({
        unrest: Math.min(100, (nation?.unrest || 0) + 25),
        standard_of_living: Math.max(0, (nation?.standard_of_living || 50) - 10),
    }).eq('id', nationId);

    await adjustGovernmentApprovalEvent(supabase, nationId, -10, 'protest:national_emergency');


    // Dispatch article + event
    const neHeadline = pickHeadline('protest_emergency');
    dispatchProtestArticle(supabase, nationId, 'protest_emergency', neHeadline,
        'The government declared a national emergency to end the protest crisis. The cost was severe: civil unrest surged, political violence spiked, happiness plummeted, and government approval took a devastating hit.',
        1, currentTick, protestId);
    fireProtestEvent(supabase, nationId, 'protest:national_emergency', currentTick, { protest_id: protestId });

    return {
        success: true,
        newAp,
        statPenalties: { civil_unrest: +15, political_violence: +10, happiness: -10, gov_approval: -10 },
    };
}

/**
 * Resolve a protest that has been in 'resolving' state for 1 tick.
 * Called by the tick processor, NOT by the client.
 *
 * 1. Fetch global protest history + endorsements
 * 2. Calculate condition score → roll turnout → get tier
 * 3. Check escalation path
 * 4. Apply tier effects (1-5 one-time, 6-7 create crisis)
 * 5. Update protest_log with results
 * 6. Set cooldowns and lockouts
 *
 * Returns { tier, score, effects, crisisCreated }
 */
export async function resolveProtest(supabase, protest, nationStats, currentTick) {
    const { id: protestId, faction_id: factionId, nation_id: nationId, grievance_type, grievance_data } = protest;

    // ── 1. Fetch protest history (global, all parties) ──
    const { data: protestHistory } = await supabase
        .from('protest_log')
        .select('tick_called, tier, turnout_score')
        .eq('nation_id', nationId)
        .eq('status', 'resolved')
        .gte('tick_called', currentTick - Math.max(PROTEST_CONFIG.FATIGUE_LOOKBACK_TICKS, PROTEST_CONFIG.ESCALATION_LOOKBACK_TICKS))
        .order('tick_called', { ascending: false });
    const historyForFatigue = (protestHistory || []).map(p => ({ tick: p.tick_called }));
    const historyForEscalation = (protestHistory || []).map(p => ({
        tick: p.tick_called, tier: p.tier, score: p.turnout_score,
    }));

    // ── 2. Fetch ministry action history (for crackdown detection) ──
    const { data: ministryActions } = await supabase
        .from('ministry_action_log')
        .select('action_key, applied_at_tick')
        .eq('nation_id', nationId)
        .gte('applied_at_tick', currentTick - 4);

    // ── 3. Fetch endorsements ──
    const { data: endorsements } = await supabase
        .from('protest_endorsements')
        .select('id, faction_id')
        .eq('protest_id', protestId);
    const endorsementCount = (endorsements || []).length;

    // ── 4. Build grievance object for condition score ──
    const grievance = {
        type: grievance_type,
        approval: grievance_data?.approval,
        publicApproval: grievance_data?.publicApproval,
        failureScore: grievance_data?.failureScore,
    };

    // ── 5. Calculate condition score ──
    const { score: conditionScore, breakdown } = calculateConditionScore(
        nationStats, grievance, historyForFatigue, ministryActions || [], currentTick
    );

    // ── 6. Roll turnout + add joint protest bonus ──
    const jointBonus = calculateJointProtestBonus(endorsementCount);
    const adjustedCondition = Math.min(100, conditionScore + jointBonus);
    let turnoutScore = rollTurnout(adjustedCondition);

    // Add endorsement bonus (+15 per endorsing party, already in joint bonus)
    // Joint bonus already accounts for this via JOINT_BONUS_PER_PARTY

    // ── 7. Get tier + check escalation ──
    let tier = getTurnoutTier(turnoutScore);
    tier = checkEscalationPath(tier, turnoutScore, historyForEscalation, currentTick);

    // Crisis sunset (Phase 2): the T6/T7 active_crises count gate
    // (T6 needs 1+ crisis, T7 needs 3+ crises, each + 50% downgrade
    // roll) is removed — turnout-driven tier now stands on its own.
    // Reintroduce by counting active_modifiers (severity='red') if a
    // "stacking unrest" damper is wanted back.
    if (tier >= 7 && Math.random() >= 0.5) tier = 6;
    if (tier >= 6 && Math.random() >= 0.5) tier = 5;

    // ── 8. Apply tier effects ──
    const effects = computeTierEffects(tier, { govApproval: nationStats.gov_approval });
    const appliedEffects = [];

    // Gov approval one-time delta (Tiers 3-5)
    if (effects.govApprovalDelta !== 0) {
        await adjustGovernmentApprovalEvent(supabase, nationId, effects.govApprovalDelta, `protest:tier${tier}`);
        appliedEffects.push({ stat: 'gov_approval_events', delta: effects.govApprovalDelta });
    }

    // Civil unrest one-time delta (Tier 5)
    if (effects.civilUnrestDelta !== 0) {
        const { data: nation } = await supabase
            .from('nations').select('unrest').eq('id', nationId).single();
        const newVal = Math.min(100, (nation?.unrest || 0) + effects.civilUnrestDelta);
        await supabase.from('nations').update({ unrest: newVal }).eq('id', nationId);
        appliedEffects.push({ stat: 'civil_unrest', delta: effects.civilUnrestDelta });
    }

    // Fizzle gov boost (Tier 1-2)
    if (effects.fizzleGovBoost > 0) {
        await adjustGovernmentApprovalEvent(supabase, nationId, effects.fizzleGovBoost, `protest:fizzle:tier${tier}`);
        appliedEffects.push({ stat: 'gov_approval_events', delta: effects.fizzleGovBoost, note: 'fizzle_boost' });
    }

    // Backfire penalties on the organising party (Tier 1-2)
    if (effects.organiserVisibility < 0 || effects.organiserApproval < 0 || effects.organiserEnthusiasm < 0) {
        // Visibility write removed — column repurposed for momentum (3-pillar system).
        if (effects.organiserVisibility < 0) {
            appliedEffects.push({ stat: 'organiser_visibility', delta: effects.organiserVisibility });
        }
        // Party approval
        if (effects.organiserApproval < 0) {
            await supabase.rpc('adjust_momentum', { p_faction_id: factionId, p_delta: effects.organiserApproval, p_label: `Protest backlash (${effects.organiserApproval})`, p_tick: currentTick });
            appliedEffects.push({ stat: 'organiser_approval', delta: effects.organiserApproval });
        }
        // Nation-wide enthusiasm
        if (effects.organiserEnthusiasm < 0) {
            await nudgeEnthusiasm(supabase, nationId, effects.organiserEnthusiasm);
            appliedEffects.push({ stat: 'enthusiasm', delta: effects.organiserEnthusiasm });
        }
    }

    // ── 9. Tier 6/7: create crisis ──
    // Crisis sunset (Phase 2): the active_crises INSERT (TIER6 / TIER7
    // crisis row keyed by PROTEST_CONFIG.TIER*_CRISIS_ID) is removed.
    // The protest itself still becomes "crisis_active" via protest_log
    // below, which is what the protest mechanic reads. Cross-system
    // visibility (the politics page display, etc.) goes away with the table.
    let crisisCreated = false;
    if (effects.isCrisis) {
        // T6 fizzles after 1d6 ticks, T7 after 1d12 ticks
        let duration = tier === 6
            ? (1 + Math.floor(Math.random() * 6))    // 1d6: 1-6 ticks
            : (1 + Math.floor(Math.random() * 12));   // 1d12: 1-12 ticks

        // Leader trait: Crisis Manager (-2 ticks) / Panic Under Pressure (+2 ticks)
        // Applied to the ruling faction's leader (the one enduring the crisis)
        try {
            const { data: nationData } = await supabase.from('nations').select('ruling_faction_id').eq('id', nationId).maybeSingle();
            if (nationData?.ruling_faction_id) {
                const { data: rulerF } = await supabase.from('factions').select('leader_positive_traits, leader_negative_traits').eq('id', nationData.ruling_faction_id).maybeSingle();
                if (rulerF) {
                    const rp = rulerF.leader_positive_traits || [];
                    const rn = rulerF.leader_negative_traits || [];
                    if (rp.includes('crisis_manager')) duration = Math.max(2, duration - 2);
                    if (rn.includes('panic_under_pressure')) duration += 2;
                }
            }
        } catch (_) { /* non-fatal */ }

        // Update protest_log to crisis_active
        await supabase.from('protest_log').update({
            status: 'crisis_active',
            crisis_started_tick: currentTick,
            crisis_duration: duration,
        }).eq('id', protestId);

        // Lock all other opposition parties
        const { data: allFactions } = await supabase
            .from('factions')
            .select('id')
            .eq('nation_id', nationId)
            .neq('id', factionId);

        // Determine opposition parties for lockout
        const coalitionForLockout = await fetchActiveCoalition(supabase, nationId);
        const coalitionLockoutSet = new Set(coalitionForLockout?.party_ids || []);
        const { data: nRow } = await supabase.from('nations').select('ruling_faction_id').eq('id', nationId).single();
        const allOppo = (allFactions || []).filter(f =>
            !coalitionLockoutSet.has(f.id) && f.id !== nRow?.ruling_faction_id
        );

        if (allOppo.length > 0) {
            await supabase.from('factions')
                .update({ protest_locked_by: protestId })
                .in('id', allOppo.map(f => f.id));
        }

        // Generate Tier 7 demand
        if (tier === 7) {
            const { data: statRows } = await supabase
                .from('stat_history')
                .select('stat_name, value, tick')
                .eq('nation_id', nationId)
                .gte('tick', currentTick - 6)
                .order('tick', { ascending: true });

            const statMap = {};
            for (const row of (statRows || [])) {
                if (!statMap[row.stat_name]) statMap[row.stat_name] = [];
                statMap[row.stat_name].push({ tick: row.tick, value: row.value });
            }

            const statSnapshots = Object.entries(statMap).map(([key, history]) => {
                const sorted = history.sort((a, b) => a.tick - b.tick);
                const current = nationStats[key] ?? sorted[sorted.length - 1]?.value ?? 0;
                const sixAgo = sorted[0]?.value ?? current;
                const changes = sorted.slice(1).map((h, i) => Math.abs(h.value - sorted[i].value));
                const avgAbsChangePerTick = changes.length > 0 ? changes.reduce((s, v) => s + v, 0) / changes.length : 1;
                return { key, current, sixTicksAgo: sixAgo, avgAbsChangePerTick, displayName: key.replace(/_/g, ' ') };
            });

            const { data: ministers } = await supabase
                .from('ministries')
                .select('ministry_key, party_id, minister_approval')
                .eq('nation_id', nationId);
            const ministerList = (ministers || []).map(m => ({ ...m, is_vacant: m.party_id == null }));

            const demand = generateTier7Demand(statSnapshots, ministerList);
            // Store baseline so we can check if demand has been met
            if (demand.type === 'stat' && nationStats) {
                demand.baseline = Number(nationStats[demand.stat] ?? 0);
            }
            await supabase.from('protest_log').update({ tier7_demand: demand }).eq('id', protestId);
        }

        crisisCreated = true;
    }

    // ── 10. Update protest_log with results (non-crisis tiers) ──
    if (!crisisCreated) {
        await supabase.from('protest_log').update({
            status: 'resolved',
            tick_resolved: currentTick,
            condition_score: conditionScore,
            turnout_score: turnoutScore,
            tier,
            roll_breakdown: { ...breakdown, joint_bonus: jointBonus, endorsements: endorsementCount },
            effects_applied: appliedEffects,
        }).eq('id', protestId);

        // Fire event + article for Tier 1-5 outcomes
        const tierLabel = getTierLabel(tier);
        const headline = tier <= 2
            ? pickHeadline('protest_fizzle')
            : pickHeadline('protest_resolved');
        const lede = tier <= 2
            ? `A protest organised in ${nationStats.name || 'the nation'} fizzled at ${tierLabel}. The organisers lost credibility.`
            : `A ${tierLabel} protest rocked ${nationStats.name || 'the nation'}. Government approval took a hit.`;
        dispatchProtestArticle(supabase, nationId, tier <= 2 ? 'protest_fizzle' : 'protest_resolved', headline, lede, tier <= 2 ? 1 : 2, currentTick, protestId);
        fireProtestEvent(supabase, nationId, tier <= 2 ? 'protest:fizzle' : 'protest:resolved', currentTick, {
            protest_id: protestId, tier, tier_label: tierLabel
        });
    } else {
        // Crisis tiers: update scores but keep status as crisis_active
        await supabase.from('protest_log').update({
            condition_score: conditionScore,
            turnout_score: turnoutScore,
            tier,
            roll_breakdown: { ...breakdown, joint_bonus: jointBonus, endorsements: endorsementCount },
            effects_applied: appliedEffects,
        }).eq('id', protestId);
    }

    // ── 11. Set cooldowns ──
    // Calling party: 12-tick cooldown from resolution tick
    // (For crises, cooldown starts when crisis ends — handled by tick processor)
    if (!crisisCreated) {
        const cooldownUntil = currentTick + PROTEST_CONFIG.CALLING_PARTY_COOLDOWN;
        await supabase.from('factions').update({
            protest_cooldown_until_tick: cooldownUntil,
        }).eq('id', factionId);

        // Endorsing parties: 6-tick cooldown from resolution
        if (endorsements && endorsements.length > 0) {
            const endorseCooldown = currentTick + PROTEST_CONFIG.ENDORSING_PARTY_COOLDOWN;
            await supabase.from('factions')
                .update({ protest_cooldown_until_tick: endorseCooldown })
                .in('id', endorsements.map(e => e.faction_id));
        }
    }


    return {
        tier,
        tierLabel: getTierLabel(tier),
        score: turnoutScore,
        conditionScore,
        breakdown,
        endorsementCount,
        jointBonus,
        effects: appliedEffects,
        crisisCreated,
    };
}
