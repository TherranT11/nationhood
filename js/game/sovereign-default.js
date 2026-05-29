/**
 * sovereign-default.js — Sovereign Default system utilities and constants
 *
 * Provides shared functions for debt-to-GDP calculations, debt service burden,
 * credit deterioration, default consequence previews, and validation.
 * Used by both client-side UI (laws.html, economy.html) and server-side
 * advance-tick processing.
 */

// ==================== CONSTANTS ====================

// Crisis sunset (Phase 2): SOVEREIGN_DEFAULT_CRISIS_ID, SOVEREIGN_DEBT_CRISIS_ID,
// ECONOMIC_COLLAPSE_CRISIS_ID, FAILED_STATE_CRISIS_ID UUID exports
// removed — all writers into active_crises have been stripped.

export const SOVEREIGN_DEFAULT_CONFIG = {
    // ── Proposal requirements ──
    DEFAULT_RESOLUTION_AP_COST: 6,
    VOTING_TICKS: 6,
    MIN_DEBT_TO_GDP: 1.5,              // 150% — button visibility threshold
    DEFAULT_COOLDOWN_TICKS: 50,        // nation-level cooldown after executed default
    PROPOSAL_COOLDOWN_TICKS: 120,      // cooldown after failed resolution

    // ── Crisis parameters ──
    CRISIS_MIN_DURATION: 20,           // minimum ticks before Sovereign Default Crisis can end

    // ── Debt service burden ──
    // PHASE 7 BALANCE: thresholds below were calibrated against debt/GDP;
    // post-alpha-refactor they apply to debt/budget (~10x denser than
    // GDP for typical nations). Numeric values left unchanged so the
    // mechanic still fires; balance team should retune once the alpha
    // refactor settles.
    BURDEN_THRESHOLD: 1.0,             // debt-to-budget ratio where burden kicks in
    BURDEN_MAX: 0.4,                   // maximum burden (40% spending reduction)
    BURDEN_SCALE: 0.2,                 // scaling factor: (ratio - 1.0) * 0.2

    // ── Filing market reactions (applied on bill creation) ──
    // Power: international standing degrades (was currency_strength).
    // Industry: foreign capital pulls out of production (was foreign_investment).
    FILING_POWER_HIT: -5,
    FILING_INDUSTRY_HIT: -3,

    // ── Vote failure consequences ──
    FAILURE_PM_APPROVAL_HIT: -10,
    FAILURE_POWER_HIT: -2,             // was FAILURE_INTL_REP_HIT

    // ── Full default immediate penalties ──
    // For partial restructuring, multiply by (1 - repaymentRate).
    // Power consolidates the legacy (currency_strength + intl_reputation)
    // hits — both were international-standing flavors and would have
    // double-counted into `power` post-shim.
    FULL_DEFAULT_POWER_HIT: -30,
    FULL_DEFAULT_INDUSTRY_HIT: -25,
    FULL_DEFAULT_COST_OF_LIVING_SPIKE: 15,   // was FULL_DEFAULT_INFLATION_SPIKE
    FULL_DEFAULT_SOL_HIT: -8,
    FULL_DEFAULT_UNREST_SPIKE: 10,           // was FULL_DEFAULT_HAPPINESS_HIT (sign flipped)
    FULL_DEFAULT_GOV_APPROVAL_HIT: -15,
    FULL_DEFAULT_WORKER_APPROVAL_HIT: -5,    // working class / debtor blocs
    FULL_DEFAULT_NATIONALIST_APPROVAL_HIT: -10, // nationalist blocs (partially sympathetic)
    // DROPPED (legacy columns deleted by alpha refactor with no replacement):
    //   FULL_DEFAULT_CREDIT_HIT, FULL_DEFAULT_INTEREST_SPIKE, FULL_DEFAULT_TRADE_HIT
    // The CRISIS_*_RECOVERY / CRISIS_*_DECAY scaffolding constants were
    // dropped too — they were never wired into a per-tick recovery
    // function. If/when crisis recovery is implemented, the rates can
    // be reintroduced against alpha columns directly.
    CRISIS_GDP_GROWTH_EARLY: -0.3,     // ticks 1-10 (recession)
    CRISIS_GDP_GROWTH_LATE: 0.2,       // ticks 11-20 (recovery)
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
    // PHASE 7 BALANCE: ratio is now debt/budget; threshold left at 2.0
    // numerically but conceptually different from the old debt/GDP
    // 2.0. Retune as part of post-alpha balance pass.
    DEBT_CRISIS_MIN_RATIO: 2.0,
    // DROPPED: DEBT_CRISIS_MAX_CREDIT — the credit column is deleted by
    // the alpha refactor; whatever debt-crisis triggers wanted "credit
    // is exhausted" can re-key off budget collapse instead.
};

// Stats that can be targeted by austerity commitments. Alpha refactor:
// the ~9-stat legacy list collapses into the 6 alpha columns that
// actually represent state-funded categories.
export const AUSTERITY_ELIGIBLE_STATS = [
    'health', 'education', 'infrastructure', 'energy', 'industry',
    'unskilled_workers', 'skilled_workers'
];

// Stats whose policy effects are reduced by debt service burden
// (government-spending-dependent stats). Same conceptual collapse —
// if the engine can't afford to fund spending, these are the categories
// that suffer first.
export const SPENDING_AFFECTED_STATS = new Set([
    'health', 'education', 'infrastructure',
    'standard_of_living', 'energy', 'industry',
    'unskilled_workers', 'skilled_workers'
]);


// ==================== CORE UTILITY FUNCTIONS ====================

/**
 * Calculate debt-to-budget ratio safely.
 * Returns ratio as a decimal (1.5 = debt is 1.5x annual budget).
 * Guards against division by zero: budget=0 with debt → Infinity,
 * no debt → 0.
 *
 * Alpha refactor: replaces the legacy debt-to-GDP measure. Values
 * are typically ~10x higher than debt-to-GDP because budget is a
 * fraction of GDP, so calling thresholds (BURDEN_THRESHOLD,
 * DEBT_CRISIS_MIN_RATIO) need balance retuning.
 *
 * @param {object} nation - Nation object with debt and budget fields
 * @returns {number} Debt-to-budget ratio
 */
export function getDebtToBudget(nation) {
    const debt = Number(nation.debt ?? 0);
    const budget = Number(nation.budget ?? 0);
    if (budget <= 0) return debt > 0 ? Infinity : 0;
    return debt / budget;
}

// Backwards-compat alias. Existing callers import getDebtToGDP — they
// continue working post-alpha because the return value is now
// debt/budget, which still semantically represents "how unsustainable
// is the debt load". Phase 9 cleanup removes this alias once callers
// are renamed.
export const getDebtToGDP = getDebtToBudget;

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

    // Apply discount to eligible penalties (global_image + industry — the
    // international-standing flavors). Other penalties take the full
    // multiplier without discount.
    const discountedMultiplier = multiplier * (1 - discount);

    const clamp = (current, delta) => Math.max(0, Math.min(100, Math.round((current + delta) * 10) / 10));
    // Read each canonical stat once with a sensible fallback. Hoisted
    // out of the statChanges literal to avoid duplicate reads.
    const globalImage_    = Number(nation.global_image    ?? 50);
    const industry_       = Number(nation.industry        ?? 50);
    const cost_of_living_ = Number(nation.cost_of_living ?? 50);
    const sol_            = Number(nation.standard_of_living ?? 50);
    const unrest_         = Number(nation.unrest          ?? 20);

    const statChanges = {
        debt: { before: currentDebt, after: debtAfter, change: debtAfter - currentDebt },
        global_image: {
            before: globalImage_,
            change: Math.round(cfg.FULL_DEFAULT_POWER_HIT * discountedMultiplier),
            after: clamp(globalImage_, cfg.FULL_DEFAULT_POWER_HIT * discountedMultiplier)
        },
        industry: {
            before: industry_,
            change: Math.round(cfg.FULL_DEFAULT_INDUSTRY_HIT * discountedMultiplier),
            after: clamp(industry_, cfg.FULL_DEFAULT_INDUSTRY_HIT * discountedMultiplier)
        },
        cost_of_living: {
            before: cost_of_living_,
            change: Math.round(cfg.FULL_DEFAULT_COST_OF_LIVING_SPIKE * multiplier),
            after: clamp(cost_of_living_, cfg.FULL_DEFAULT_COST_OF_LIVING_SPIKE * multiplier)
        },
        standard_of_living: {
            before: sol_,
            change: Math.round(cfg.FULL_DEFAULT_SOL_HIT * multiplier),
            after: clamp(sol_, cfg.FULL_DEFAULT_SOL_HIT * multiplier)
        },
        unrest: {
            before: unrest_,
            change: Math.round(cfg.FULL_DEFAULT_UNREST_SPIKE * multiplier),
            after: clamp(unrest_, cfg.FULL_DEFAULT_UNREST_SPIKE * multiplier)
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
        crisisMinDuration: cfg.CRISIS_MIN_DURATION
        // creditCeiling / foreignInvCeiling fields dropped — those columns
        // are deleted by the alpha refactor and the laws.html UI already
        // stopped reading them in Phase 3b.
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
