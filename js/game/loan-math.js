// Shared loan math — single source of truth for monthly interest,
// principal portion, and collateral-recovery rates. Consumed by:
//   * UI:               corp-operations-finance.html
//                       js/corp-auto-services.js
//   * Bundled edge fn:  js/game/subsidiary-payments.js (advance-tick
//                       picks this up via scripts/sync-edge-function.js)
//   * Hand-maintained:  supabase/functions/advance-corp-tick/index.ts
//                       inlines a verbatim copy at the top of the file.
//                       If you change a formula here, update that copy
//                       in the same commit.
//
// All math uses the flat-interest model (interest computed once on
// the original principal) which is the convention used across the
// finance subsystem. Callers that need a different model should NOT
// reach in and override these — they should pick a different helper.

// Monthly interest payment on a loan.
//   principal      — flat-interest base. For finance_active_loans this
//                    is original_principal; for corp_loans it's the
//                    current outstanding balance (amortized model).
//   annualRatePct  — annual rate as a percentage (5.0 means 5%, NOT 0.05).
export function monthlyInterest(principal, annualRatePct) {
    const safePrincipal = Math.max(0, Number(principal) || 0);
    const safeRate = Math.max(0, Number(annualRatePct) || 0);
    return Math.round(safePrincipal * (safeRate / 100) / 12);
}

// Principal portion of a monthly payment after the interest slice.
// Returns >= 0 even when interest exceeds the payment (rare on
// late-stage loans with shrinking remaining balance).
export function principalPortion(monthlyPayment, monthlyInterestAmount) {
    const safePayment = Number(monthlyPayment) || 0;
    const safeInterest = Number(monthlyInterestAmount) || 0;
    return Math.max(0, safePayment - safeInterest);
}

// Flat-interest base for a finance_active_loans row. Returns the principal
// the engine uses to compute per-tick interest in advance-corp-tick. Reads
// `original_principal` first (set at origination + reset on restructure)
// and falls back to `principal` for legacy rows pre-dating the
// 20260420 migration. Always returns a non-negative number; null/undefined
// row inputs collapse to 0 so callers never have to null-guard.
export function loanFlatInterestBase(loan) {
    if (!loan) return 0;
    const base = loan.original_principal ?? loan.principal ?? 0;
    return Math.max(0, Number(base) || 0);
}

// Collateral recovery rates applied on default. Used by the finance
// loan default RPC and any UI that previews recovery exposure.
export const COLLATERAL_RECOVERY_RATES = {
    equipment: 0.6,
    property: 0.75,
    unsecured: 0,
};

// Recovery rate for a given collateral_type column value. Unknown
// types (including null/undefined) return 0 — i.e. unsecured.
export function collateralRecoveryRate(collateralType) {
    if (!collateralType) return 0;
    const rate = COLLATERAL_RECOVERY_RATES[collateralType];
    return typeof rate === 'number' ? rate : 0;
}

// Consecutive missed payments before a loan goes to 'defaulted'.
// Applies to both tier-1 finance_active_loans and subsidiary
// auto-loan policies — they used to diverge (4 vs 3) so identical
// scenarios produced different outcomes by loan type. The escalation
// ladder for tier-1 loans is:
//   1 missed  -> late
//   3 missed  -> delinquent
//   4 missed  -> defaulted
// Auto-loans don't surface late/delinquent as UI states, but they
// still get the same 4-tick grace period before they default.
export const DEFAULT_MISSED_THRESHOLD = 4;
