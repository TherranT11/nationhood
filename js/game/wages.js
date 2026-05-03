/**
 * wages.js — Canonical corp wage formula.
 *
 * SSoT-BY-CONVENTION: this file is the authoritative definition of the
 * formula. Two consumers:
 *
 *   1. corp-dashboard-home2.html renderWorkforce — imports this module
 *      directly to render the projected per-tier wage breakdown.
 *
 *   2. supabase/functions/advance-corp-tick/index.ts processCorpMonthlyIncome
 *      — that file is hand-maintained (not bundled by sync-edge-function.js,
 *      which only targets advance-tick). It carries an INLINE MIRROR of the
 *      WAGE_MULTIPLIERS / computeWageScalars logic with a clear comment
 *      header pointing at this file. If you tweak the formula here, tweak
 *      it there too.
 *
 * Formula:
 *   annual_wage(tier) = baseAnnualWage × tier_multiplier × inflMod × solMod
 *
 *   baseAnnualWage = (minimum_wage / 100) × $48,000
 *   inflMod        = 1 + ((inflation - 50) / 100) × 0.5
 *   solMod         = 1 + ((standard_of_living - 50) / 100) × 0.5
 */

export const WAGE_MULTIPLIERS = Object.freeze({
    general:    2,
    skilled:    3,
    innovative: 6,
});

const BASE_ANNUAL_WAGE_AT_FULL_MIN = 48000;

function readStat(nation, key) {
    return Number(nation?.[key] ?? 50);
}

export function computeWageScalars(nation) {
    const minWage   = readStat(nation, 'minimum_wage');
    const inflation = readStat(nation, 'inflation');
    const sol       = readStat(nation, 'standard_of_living');
    const baseAnnualWage = (minWage / 100) * BASE_ANNUAL_WAGE_AT_FULL_MIN;
    const inflMod = 1 + ((inflation - 50) / 100 * 0.5);
    const solMod  = 1 + ((sol       - 50) / 100 * 0.5);
    return { baseAnnualWage, inflMod, solMod };
}

export function annualWageForTier(nation, tier) {
    const mult = WAGE_MULTIPLIERS[tier];
    if (!mult) return 0;
    const { baseAnnualWage, inflMod, solMod } = computeWageScalars(nation);
    return Math.round(baseAnnualWage * mult * inflMod * solMod);
}

export function computeMonthlyWages(nation, counts) {
    const { baseAnnualWage, inflMod, solMod } = computeWageScalars(nation);
    const calc = (mult) => Math.round(baseAnnualWage * mult * inflMod * solMod);
    const general    = Number(counts?.general    ?? 0);
    const skilled    = Number(counts?.skilled    ?? 0);
    const innovative = Number(counts?.innovative ?? 0);
    const annual = general    * calc(WAGE_MULTIPLIERS.general)
                 + skilled    * calc(WAGE_MULTIPLIERS.skilled)
                 + innovative * calc(WAGE_MULTIPLIERS.innovative);
    return Math.round(annual / 12);
}
