/**
 * protest.js — Organise a Protest: core game logic (pure functions)
 *
 * Phase 1: AP cost scaling, protest fatigue, condition score, turnout roll,
 * tier resolution, escalation path, grievance scoring, tier effects.
 */

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

    // Tier 6 crisis
    TIER6_DURATION: 6,
    TIER6_GOV_APPROVAL_PER_TICK: -2,
    TIER6_CIVIL_UNREST_PER_TICK: 2,
    TIER6_HAPPINESS_PER_TICK: -1,
    TIER6_POLITICAL_VIOLENCE_AFTER_TICK: 3, // starts after tick 3
    TIER6_POLITICAL_VIOLENCE_PER_TICK: 1,
    TIER6_ENFORCE_SUCCESS_CHANCE: 0.33,

    // Tier 7 crisis
    TIER7_DURATION: 6,
    TIER7_GOV_APPROVAL_PER_TICK: -3,
    TIER7_CIVIL_UNREST_PER_TICK: 3,
    TIER7_GDP_GROWTH_PER_TICK: -0.2,
    TIER7_FOREIGN_INVESTMENT_PER_TICK: -2,
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

    // Fizzle (Tier 1-2) effects
    FIZZLE_BLOC_PENALTY: -2,
    FIZZLE_GOV_APPROVAL_MAX_BOOST: 3,   // 1d3
    FIZZLE_GOV_APPROVAL_MIN_THRESHOLD: 45,

    // Call-off
    CALL_OFF_AP: 1,
    CALL_OFF_WIND_DOWN_TICKS: 2,

    // Crisis template IDs
    TIER6_CRISIS_ID: '00000000-0000-0000-0000-000000000020',
    TIER7_CRISIS_ID: '00000000-0000-0000-0000-000000000021',

    // Unresolved grievance penalty at election
    UNRESOLVED_GRIEVANCE_PENALTY: -5,
};

// Stats permanently excluded from Stat Failure tab
const EXCLUDED_STAT_KEYS = new Set([
    'ethnic_diversity', 'urbanization', 'median_age',
]);

// Stats eligible for Tier 7 demand generation
const TIER7_ELIGIBLE_STATS = new Set([
    'gdp_growth', 'inflation', 'unemployment', 'crime_rate',
    'healthcare_quality', 'healthcare_accessibility', 'literacy',
    'higher_education', 'happiness', 'standard_of_living',
    'poverty_rate', 'income_inequality', 'fuel_prices', 'pollution',
    'digital_infrastructure', 'physical_infrastructure', 'energy_generation',
]);

// Stats where higher values are bad (inverted display)
const HIGHER_IS_BAD = new Set([
    'civil_unrest', 'terrorism', 'political_violence', 'crime_rate',
    'corruption', 'pollution', 'carbon_emissions', 'poverty_rate',
    'income_inequality', 'inflation', 'unemployment', 'drug_use',
    'illegal_immigration', 'emigration', 'fuel_prices', 'incarceration_rate',
    'debt', 'debt_growth', 'cost_of_living',
]);

// Blocs penalised on fizzle (Tier 1-2)
const FIZZLE_PENALTY_BLOCS = ['centrists', 'business_owners', 'academics'];

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
    const unrestBonus = ((nationStats.civil_unrest || 0) / 100) * 30;
    score += unrestBonus;
    breakdown.civil_unrest = +unrestBonus.toFixed(1);

    // Unhappiness: max +25
    const unhappyBonus = ((100 - (nationStats.happiness || 50)) / 100) * 25;
    score += unhappyBonus;
    breakdown.happiness = +unhappyBonus.toFixed(1);

    // Polarization: max +20
    const polBonus = ((nationStats.polarization || 0) / 100) * 20;
    score += polBonus;
    breakdown.polarization = +polBonus.toFixed(1);

    // Political violence: max -15
    const violencePenalty = ((nationStats.political_violence || 0) / 100) * 15;
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
    if (score < 15) return 1;
    if (score < 30) return 2;
    if (score < 45) return 3;
    if (score < 60) return 4;
    if (score < 75) return 5;
    if (score < 90) return 6;
    return 7;
}

/**
 * Get tier display label.
 */
export function getTierLabel(tier) {
    const labels = {
        1: 'Embarrassing Fizzle',
        2: 'Modest Showing',
        3: 'Respectable Turnout',
        4: 'Strong Protest',
        5: 'Mass Demonstration',
        6: 'Historic Protest',
        7: 'Nationwide Protest',
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
 * @returns {object} { govApprovalDelta, civilUnrestDelta, blocPenalties, blocBonuses, fizzleGovBoost }
 */
export function computeTierEffects(tier, opts = {}) {
    const effects = {
        govApprovalDelta: 0,
        civilUnrestDelta: 0,
        blocPenalties: [],    // [{ blocName, delta }]
        blocBonuses: [],      // [{ blocName, delta }]
        fizzleGovBoost: 0,
        isCrisis: false,
    };

    switch (tier) {
        case 1: {
            // Embarrassing Fizzle: -2 approval with centrists/business/academics, 1d3 gov boost if gov >= 45%
            effects.blocPenalties = FIZZLE_PENALTY_BLOCS.map(b => ({
                blocName: b,
                delta: PROTEST_CONFIG.FIZZLE_BLOC_PENALTY,
            }));
            if ((opts.govApproval || 0) >= PROTEST_CONFIG.FIZZLE_GOV_APPROVAL_MIN_THRESHOLD) {
                effects.fizzleGovBoost = Math.ceil(Math.random() * PROTEST_CONFIG.FIZZLE_GOV_APPROVAL_MAX_BOOST);
            }
            break;
        }
        case 2: {
            // Modest Showing: no stat effect, free headline, same gov boost as tier 1
            if ((opts.govApproval || 0) >= PROTEST_CONFIG.FIZZLE_GOV_APPROVAL_MIN_THRESHOLD) {
                effects.fizzleGovBoost = Math.ceil(Math.random() * PROTEST_CONFIG.FIZZLE_GOV_APPROVAL_MAX_BOOST);
            }
            break;
        }
        case 3: {
            // Respectable Turnout: gov approval -1
            effects.govApprovalDelta = -1;
            break;
        }
        case 4: {
            // Strong Protest: gov approval -3, +2 with aligned blocs
            effects.govApprovalDelta = -3;
            // Caller must resolve "ideologically aligned blocs" and populate blocBonuses
            break;
        }
        case 5: {
            // Mass Demonstration: gov approval -6, civil unrest +2
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
    const effects = {
        gov_approval: PROTEST_CONFIG.TIER6_GOV_APPROVAL_PER_TICK,
        civil_unrest: PROTEST_CONFIG.TIER6_CIVIL_UNREST_PER_TICK,
        happiness: PROTEST_CONFIG.TIER6_HAPPINESS_PER_TICK,
        political_violence: 0,
    };

    // Political violence starts after tick 3
    if (ticksActive > PROTEST_CONFIG.TIER6_POLITICAL_VIOLENCE_AFTER_TICK) {
        effects.political_violence = PROTEST_CONFIG.TIER6_POLITICAL_VIOLENCE_PER_TICK;
    }

    // Public Address reduces civil unrest accumulation by 1 that tick
    if (publicAddressThisTick) {
        effects.civil_unrest = Math.max(0, effects.civil_unrest - 1);
    }

    return effects;
}

/**
 * Compute per-tick crisis effects for an active Tier 7 protest crisis.
 * @param {boolean} publicAddressThisTick
 * @returns {object} stat deltas to apply
 */
export function computeTier7CrisisEffects(publicAddressThisTick) {
    const effects = {
        gov_approval: PROTEST_CONFIG.TIER7_GOV_APPROVAL_PER_TICK,
        civil_unrest: PROTEST_CONFIG.TIER7_CIVIL_UNREST_PER_TICK,
        gdp_growth: PROTEST_CONFIG.TIER7_GDP_GROWTH_PER_TICK,
        foreign_investment: PROTEST_CONFIG.TIER7_FOREIGN_INVESTMENT_PER_TICK,
        political_violence: PROTEST_CONFIG.TIER7_POLITICAL_VIOLENCE_PER_TICK,
    };

    // Public Address reduces civil unrest accumulation by 1
    if (publicAddressThisTick) {
        effects.civil_unrest = Math.max(0, effects.civil_unrest - 1);
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
