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
export const SOVEREIGN_DEFAULT_CRISIS_ID = '00000000-0000-0000-0000-000000000002';
export const SOVEREIGN_DEBT_CRISIS_ID    = '00000000-0000-0000-0000-000000000003';
export const ECONOMIC_COLLAPSE_CRISIS_ID = '00000000-0000-0000-0000-000000000010';
export const FAILED_STATE_CRISIS_ID     = '00000000-0000-0000-0000-000000000011';

export const SOVEREIGN_DEFAULT_CONFIG = {
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
export const AUSTERITY_ELIGIBLE_STATS = [
    'benefits', 'healthcare_quality', 'healthcare_accessibility',
    'education_accessibility', 'higher_education', 'physical_infrastructure',
    'digital_infrastructure', 'rail_network', 'energy_generation'
];

// Stats whose policy effects are reduced by debt service burden
// (government-spending-dependent stats)
export const SPENDING_AFFECTED_STATS = new Set([
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
export function getDebtToGDP(nation) {
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
export function calculateDebtServiceBurden(nation) {
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
export function getSpendingEffectivenessMultiplier(nation) {
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
export function calculateCreditDeterioration(nation) {
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
export function getDefaultPenaltyMultiplier(defaultType, repaymentRate) {
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
export function calculateAusterityDiscount(austerityCommitments) {
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

// #region server-exclude
/**
 * Validate austerity commitment entries against rules.
 *
 * @param {Array} commitments - Array of { stat, reduction, over_ticks }
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAusterityCommitments(commitments) {
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
export function canProposeDefault(nation, currentTick, hasActiveResolution) {
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
export function previewDefaultConsequences(nation, defaultType, repaymentRate, austerityCommitments) {
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
export function getDebtDistressLevel(nation) {
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
export function formatDebtToGDP(ratio) {
    if (!isFinite(ratio)) return '∞';
    return Math.round(ratio * 100) + '%';
}
// #endregion server-exclude
