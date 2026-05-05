/**
 * budget.js — National budget, tax config, economic aid, shutdown, GDP growth
 * Extracted from game-common.js
 */

import { GAME_CONFIG } from './config.js';
import { DIPLOMACY_CONFIG, RAW_SCALING_DIVISORS } from './diplomacy-constants.js';
import { adjustGovernmentApprovalEvent, adjustCredibility } from './momentum.js';
import { fetchActiveCoalition } from './government-structure.js';
import { SOVEREIGN_DEFAULT_CRISIS_ID, SOVEREIGN_DEBT_CRISIS_ID, ECONOMIC_COLLAPSE_CRISIS_ID } from './sovereign-default.js';
import { MINISTER_APPROVAL_CONFIG } from './stats.js';
import { hasElectedPresident, isAbsoluteMonarchy } from './government-types.js';
import { fireBilateralEvent } from './event-helpers.js';

// ==================== NATIONAL BUDGET CALCULATION ====================

/**
 * Per-tick income tax revenue.
 *   (population / 10_000_000) × income_tax × (1 − unrest/100)
 * Lands as a small literal number that adds to nation.budget each tick.
 * Pass a rateOverride to preview revenue at a hypothetical rate.
 */
export function computeIncomeTaxRevenue(nation, rateOverride) {
    const pop = Number(nation.population || 0);
    const rate = rateOverride !== undefined ? Number(rateOverride) : Number(nation.income_tax || 0);
    const unrest = Number(nation.unrest || 0);
    const rev = (pop / 10_000_000) * rate * (1 - unrest / 100);
    return Math.max(0, rev);
}

/**
 * Per-tick corporate tax revenue.
 *   (service_sector + industry) / 10 × corporate_tax × (1 − corruption/100)
 * Pass a rateOverride to preview revenue at a hypothetical rate.
 */
export function computeCorporateTaxRevenue(nation, rateOverride) {
    const svc = Number(nation.service_sector || 0);
    const ind = Number(nation.industry || 0);
    const rate = rateOverride !== undefined ? Number(rateOverride) : Number(nation.corporate_tax || 0);
    const corruption = Number(nation.corruption || 0);
    const rev = ((svc + ind) / 10) * rate * (1 - corruption / 100);
    return Math.max(0, rev);
}

export function calculateNationalBudget(nation, opts = {}) {
    // Phase 8.5.4: nation.budget is a cash balance. Each tick, the engine
    // adds computeIncomeTaxRevenue + computeCorporateTaxRevenue to it via
    // advance-tick. This function exposes the current balance as
    // grossRevenue (for callers that still treat it as the headline
    // revenue figure) plus the per-tick line items so UI can render them.
    const debt = Number(nation.debt ?? 0);
    const grossRevenue = Number(nation.budget ?? 0);

    const incomeRevenue = computeIncomeTaxRevenue(nation);
    const corpRevenue = computeCorporateTaxRevenue(nation);

    // Debt service: prefer the actual sum of bond coupon obligations from
    // the tick processor; fall back to a flat 5% annual interest rate.
    const FLAT_ANNUAL_INTEREST = 0.05;
    const debtService = opts.actualDebtService != null
        ? Number(opts.actualDebtService)
        : debt * FLAT_ANNUAL_INTEREST;

    const availableBudget = grossRevenue - debtService;

    return {
        grossRevenue, debtService, availableBudget,
        collectionRate: 1,
        incomeRevenue, corpRevenue,
        tariffRevenue: 0
    };
}

// ════════════════════════════════════════════════════════════════
// Budget surplus → debt paydown (per-tick).
//
// Mirrors the Government Budget panel's monthly-balance math exactly
// so what the player sees on the cards is what gets applied each
// tick: revenue (treasury cash, treated as annual) minus
// expenditures (Interest on Debt + monarchy-only Royal Holdings,
// other rows still $0 placeholders) → annual balance → /12 →
// per-tick paydown applied to principal.
//
// Unit handling: this is the load-bearing piece. The panel mixes
// scales — nation.budget is "abstract" (small number, displayed
// directly), debtService comes back from calculateNationalBudget in
// raw dollars and is divided by 1e9 to render, and nation.debt is
// raw dollars (also /1e9 to display). The legacy processDebtTick
// silently ate this mismatch by subtracting an abstract surplus
// from a raw debt value, which is why a $17 abstract balance never
// dented a $1.2e12 raw debt. Here we convert abstract → raw with
// _RAW_PER_ABSTRACT before touching nation.debt.
//
// Treasury bookkeeping: the abstract amount is also deducted from
// nation.budget (the treasury cash balance) so the player's reserve
// drops by the same amount the debt does — money paid out, not
// magicked from thin air.
//
// Order of operations: caller wires this AFTER processDebtTick so
// bond maturities, coupon charges, and offer expiry have already
// hit. The interest payment side ("goes toward Interest on Debt")
// is handled by processBondCouponsTick / the panel's debt-service
// expenditure line; this helper is the "and then paying toward
// the Debt" half of the user's spec.
// ════════════════════════════════════════════════════════════════
const _RAW_PER_ABSTRACT = 1e9;

export async function processBudgetSurplusPaydown(supabase, nation) {
    const debtRaw = Number(nation?.debt) || 0;
    if (debtRaw <= 0) return null; // No debt — nothing to pay down.

    // Compute the same monthly balance the budget panel renders.
    const budget = calculateNationalBudget(nation);
    const annualRevenue = Number(budget.grossRevenue || 0);

    // Annual expenditures, in abstract units, mirroring
    // _gbBuildCostRows in government.html.
    const debtServiceAbstract = (Number(budget.debtService || 0)) / _RAW_PER_ABSTRACT;
    const royalHoldingsAnnual = isAbsoluteMonarchy(nation) ? 36 : 0;
    const annualExpenditures = debtServiceAbstract + royalHoldingsAnnual;

    const annualBalance = annualRevenue - annualExpenditures;
    if (annualBalance <= 0) return null;

    // Per-tick deduction = monthly balance (12 ticks / year).
    let tickPaydown = annualBalance / 12;
    if (tickPaydown <= 0) return null;

    // Cap at the actual treasury so we never pay more than we have.
    // Without this, a tick where revenue < expenditures but
    // grossRevenue is still positive (treasury accumulated from
    // earlier ticks) could send debt negative on the abstract side
    // while taking treasury below zero. Math.max(0, ...) on the
    // updates is a belt; this is the suspenders.
    const treasury = Number(nation.budget) || 0;
    if (treasury < tickPaydown) tickPaydown = treasury;
    if (tickPaydown <= 0) return null;

    const newBudget = Math.max(0, treasury - tickPaydown);
    const newDebtRaw = Math.max(0, debtRaw - tickPaydown * _RAW_PER_ABSTRACT);

    const { error } = await supabase.from('nations')
        .update({ budget: newBudget, debt: newDebtRaw })
        .eq('id', nation.id);
    if (error) {
        console.warn(`[BudgetSurplusPaydown] update failed for ${nation.name}:`, error.message);
        return null;
    }
    nation.budget = newBudget;
    nation.debt = newDebtRaw;
    return { paid: tickPaydown, newBudget, newDebtRaw };
}

/**
 * Override formula-based tariff revenue with real trade engine data.
 * Mutates the budget object in place and returns it. Alpha refactor:
 * the gdp parameter is kept in the signature for back-compat but no
 * longer used (gdp column deleted; cap removed).
 */
export function applyTradeTariffOverride(budget, tradeTariffRevenue, _gdpUnused) {
    if (tradeTariffRevenue != null && Number(tradeTariffRevenue) > 0) {
        const oldTariff = budget.tariffRevenue;
        const newTariff = Number(tradeTariffRevenue);
        budget.tariffRevenue = newTariff;
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
export const TAX_CONFIG = [
    {
        key: 'income_tax',
        name: 'Income Tax',
        category: 'Income',
        categoryClass: 'pill-income',
        revenueKey: 'incomeRevenue',
        maxRate: 10
    },
    {
        key: 'corporate_tax',
        name: 'Corporate Tax',
        category: 'Corporate',
        categoryClass: 'pill-corporate',
        revenueKey: 'corpRevenue',
        maxRate: 10
    }
];

// ==================== BUDGET CALCULATION HELPERS ====================

/**
 * Fiscal categories that map 1:1 to ministries.
 */
export const FISCAL_CATEGORIES = [
    'Interior', 'Labor', 'Healthcare', 'Education',
    'Transportation', 'Energy', 'Justice', 'Foreign Ministry', 'Finance', 'Defense', 'Trade'
];

/**
 * Map fiscal category names → ministry_key used in ministry_institution_config.
 */
export const FISCAL_TO_MINISTRY_KEY = {
    'Interior': 'interior', 'Labor': 'labor', 'Healthcare': 'healthcare',
    'Education': 'education', 'Transportation': 'transportation', 'Energy': 'energy',
    'Justice': 'justice', 'Foreign Ministry': 'foreign', 'Finance': 'finance',
    'Defense': 'defense', 'Trade': 'trade'
};

/**
 * Inflation cost multiplier — alpha stats refactor neutralized this to
 * a constant 1 since the underlying `inflation` column is deleted.
 * Kept as an exported identity function so callers needn't change.
 * If a "cost-of-living-driven" cost multiplier is desired later, plug
 * it in here against alpha columns.
 */
export function getInflationMultiplier(_inflationStatUnused) {
    return 1;
}

/**
 * Compute the annualized cost of all active policies for a given fiscal category.
 * Returns raw dollars. Alpha refactor: inflation multiplier is a no-op
 * (constant 1) so policy costs no longer scale with inflation; if the
 * `ongoing_scaling_stat` policy field still references a deleted column,
 * the read returns undefined and the scaled-cost branch falls through
 * to ongoingBase * 1 (no scaling).
 */
export function computeMinistryPolicyCost(activeLaws, fiscalCategory, nation) {
    let total = 0;
    const policies = [];

    for (const law of (activeLaws || [])) {
        if (law.is_reversal) continue;
        const policy = law.policies;
        if (!policy) continue;

        const opt = law.selected_option || null;
        const fiscalCat = opt?.fiscal_category ?? policy.fiscal_category;
        if (fiscalCat !== fiscalCategory) continue;

        const ongoingBase = (opt?.ongoing_base_cost ?? policy.ongoing_base_cost ?? policy.ongoing_cost_per_tick) || 0;
        const scalingStat = opt?.ongoing_scaling_stat || policy.ongoing_scaling_stat;

        let annualCost = 0;
        if (ongoingBase > 0) {
            let scaled = ongoingBase;
            if (scalingStat && nation[scalingStat] !== undefined) {
                const statVal = Number(nation[scalingStat]) || 1;
                const divisor = RAW_SCALING_DIVISORS[scalingStat] || 50;
                scaled = ongoingBase * (statVal / divisor);
            }
            annualCost = scaled * GAME_CONFIG.TICKS_PER_YEAR * 1_000_000;
        }

        if (annualCost > 0) {
            policies.push({ policy_id: policy.id, policy_name: policy.policy_name, cost: annualCost });
            total += annualCost;
        }
    }

    return { total, policies };
}

/**
 * Compute the annualized cost of all institutions for a given fiscal category.
 * Alpha stats refactor: gdp-scaled institutions collapse to population
 * scaling (matches bill.html / laws.html _computeInstitutionBaseCost from
 * Phase 7b). Inflation multiplier is a no-op (Phase 7e).
 * @param {Array} institutions - rows from ministry_institution_config
 * @param {string} fiscalCategory - e.g. 'Healthcare', 'Trade'
 * @param {Object} nation
 */
export function computeMinistryInstitutionCost(institutions, fiscalCategory, nation) {
    const ministryKey = FISCAL_TO_MINISTRY_KEY[fiscalCategory] || fiscalCategory.toLowerCase();
    const insts = (institutions || []).filter(i => i.ministry_key === ministryKey);
    const population = Number(nation.population || 0);

    let total = 0;
    const items = [];
    for (const inst of insts) {
        const baseVal = Number(inst.base_cost_per_capita || 0);
        const scalingType = inst.scaling_type || 'population';
        const cost = baseVal * population;
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
export function buildBudgetData(nation, activeLaws, tradeTariffRevenue, institutions, aidData) {
    const budget = calculateNationalBudget(nation);
    applyTradeTariffOverride(budget, tradeTariffRevenue, 0);
    // Inflation column was deleted by the alpha refactor; both fields are
    // kept in the return blob at 0 for callers that destructure them.
    const inflationStat = 0;
    const inflationPct = 0;
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
export async function getActiveAidForNation(supabase, nationId) {
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
export async function processAidConditionReview(supabase, nation, currentTick) {
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
export async function processExpiredTradeAgreements(supabase, currentTick) {
    const { data: expired } = await supabase.from('trade_agreements')
        .select('id, agreement_type, agreement_name, nation_a_id, nation_b_id, auto_renew, duration_ticks')
        .eq('status', 'active')
        .not('expires_at_tick', 'is', null)
        .lte('expires_at_tick', currentTick);

    if (!expired || expired.length === 0) return [];

    const results = [];
    for (const agreement of expired) {
        // Auto-renew: extend the agreement by another duration period instead of expiring
        if (agreement.auto_renew && agreement.duration_ticks > 0) {
            const newExpiry = currentTick + agreement.duration_ticks;
            await supabase.from('trade_agreements').update({
                expires_at_tick: newExpiry
            }).eq('id', agreement.id);

            // For economic aid, clear any suspension and restore amount so renewed agreement
            // flows through the budget. If conditions are still failing, the per-tick
            // processAidConditionReview will re-suspend on this same tick.
            if (agreement.agreement_type === 'economic_aid') {
                const { data: aidState } = await supabase.from('aid_agreement_state')
                    .select('original_annual_amount')
                    .eq('agreement_id', agreement.id)
                    .maybeSingle();

                const { error: aidErr } = await supabase.from('aid_agreement_state').update({
                    is_suspended: false,
                    suspended_at_tick: null,
                    suspension_reason: null,
                    current_annual_amount: aidState?.original_annual_amount || 0
                }).eq('agreement_id', agreement.id);

                if (aidErr) console.error(`[processExpiredTradeAgreements] Failed to clear aid suspension for ${agreement.id}: ${aidErr.message}`);
            }

            console.log(`[processExpiredTradeAgreements] Auto-renewed: ${agreement.agreement_name} — new expiry tick ${newExpiry}${agreement.agreement_type === 'economic_aid' ? ' (suspension cleared)' : ''}`);
            results.push({ id: agreement.id, name: agreement.agreement_name, type: agreement.agreement_type, renewed: true });
            continue;
        }

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

        // Notify nations (guard against null nation_b_id for unilateral agreements)
        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'trade_agreement_expired', p_nation_id: agreement.nation_a_id,
                p_tick: currentTick, p_placeholders: { agreement_name: agreement.agreement_name || 'Agreement' }
            });
            if (agreement.nation_b_id) {
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'trade_agreement_expired', p_nation_id: agreement.nation_b_id,
                    p_tick: currentTick, p_placeholders: { agreement_name: agreement.agreement_name || 'Agreement' }
                });
            }
        } catch (e) { /* non-blocking */ }

        results.push({ id: agreement.id, name: agreement.agreement_name, type: agreement.agreement_type });
        console.log(`[processExpiredTradeAgreements] Expired: ${agreement.agreement_name} (${agreement.agreement_type})`);
    }
    return results;
}


// Apply GDP growth rate — RETIRED by alpha stats refactor (Phase 7e).
//
// The legacy mechanic moved an absolute-dollar `nation.gdp` column up
// or down each tick based on the `gdp_growth` 0-100 stat, with a hard
// floor at 20% of `starting_gdp` triggering Economic Collapse. Both
// `gdp` and `starting_gdp` columns are deleted by the alpha refactor
// (alpha-19 keeps `gdp_growth` as a momentum signal but no absolute
// GDP value), so this function has no columns to read or write.
//
// Function is preserved as a no-op so existing tick processor + admin
// importers don't break. Economic Collapse activation moved to the
// fiscal-redesign phase (likely keyed off prolonged budget collapse +
// debt/budget ratio).
export async function applyGdpGrowth(_supabase, _nation, _currentTick) {
    return;
}

// Activate Economic Collapse mega-crisis: clears other economic crises, applies political penalties
async function activateEconomicCollapse(supabase, nation, currentTick) {
    try {
        // 1. Skip if already active
        const { data: existing, error: existErr } = await supabase.from('active_crises')
            .select('id').eq('nation_id', nation.id)
            .eq('crisis_id', ECONOMIC_COLLAPSE_CRISIS_ID);
        if (existErr) return; // fail safe — don't double-activate
        if (existing?.length > 0) return;

        // 2. Clear existing economic crises
        const econCrisisNames = ['Currency Collapse', 'Hyperinflation Emergency'];
        const { data: econTemplates } = await supabase.from('crisis_templates')
            .select('id').in('name', econCrisisNames);
        const econIds = (econTemplates || []).map(t => t.id)
            .concat([SOVEREIGN_DEBT_CRISIS_ID, SOVEREIGN_DEFAULT_CRISIS_ID]);
        await supabase.from('active_crises')
            .delete().eq('nation_id', nation.id).in('crisis_id', econIds);

        // 3. Political penalties: -25 gov approval, -6 party_approval & -0.15 credibility to all coalition parties
        await adjustGovernmentApprovalEvent(supabase, nation.id, -25, 'crisis:economic_collapse');

        const coalition = await fetchActiveCoalition(supabase, nation.id);
        for (const partyId of (coalition?.party_ids || [])) {
            await supabase.rpc('adjust_momentum', { p_faction_id: partyId, p_delta: -6, p_label: 'Sovereign default (-6)', p_tick: currentTick });
            await adjustCredibility(supabase, partyId, nation.id, -0.15, 12, currentTick, { source: 'sovereign_default' });
        }

        // 4. Reset gdp_growth to neutral (stop the bleeding) — critical to prevent re-trigger loop
        nation.gdp_growth = 50;
        await supabase.from('nations').update({ gdp_growth: 50 }).eq('id', nation.id);

        // 5. Insert Economic Collapse crisis
        await supabase.from('active_crises').insert({
            crisis_id: ECONOMIC_COLLAPSE_CRISIS_ID,
            nation_id: nation.id,
            started_at_tick: currentTick,
            effects_applied_log: []
        });

        // 6. Event log
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'CRISIS_STARTED: Economic Collapse',
            trigger_key: 'crisis_started',
            description_used: `${nation.name}'s economy has collapsed. GDP has fallen to critical levels. Emergency economic restructuring is underway.`,
            category: 'crisis',
            effects_applied: [],
            fired_at_tick: currentTick
        });
    } catch (err) {
        // Non-fatal — GDP is already clamped at floor by caller
    }
}
