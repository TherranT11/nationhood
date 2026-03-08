/**
 * budget.js — National budget, tax config, economic aid, shutdown, GDP growth
 * Extracted from game-common.js
 */

import { GAME_CONFIG } from './config.js';
import { DIPLOMACY_CONFIG, RAW_SCALING_DIVISORS } from './diplomacy-constants.js';
import { adjustGovernmentApprovalEvent, adjustMomentumAll } from './momentum.js';
import { MINISTER_APPROVAL_CONFIG } from './stats.js';
import { isPresidentialRepublic, isAutocracy } from './government-types.js';
import { fireBilateralEvent } from './event-helpers.js';

// ==================== NATIONAL BUDGET CALCULATION ====================

export function calculateNationalBudget(nation) {
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
export function applyTradeTariffOverride(budget, tradeTariffRevenue) {
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
export const TAX_CONFIG = [
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

// ==================== BUDGET BILL HELPERS ====================

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
 * Compute inflation cost multiplier from the 0-100 inflation stat.
 * Rate = stat^1.5 / 100  →  stat 1 = 0.01%, stat 100 = 10%.
 * No deflation — multiplier is always ≥ 1.
 */
export function getInflationMultiplier(inflationStat) {
    const rate = Math.pow(Math.max(0, Number(inflationStat || 0)), 1.5) / 100;
    return 1 + (rate / 100);
}

/**
 * Compute the annualized cost of all active policies for a given fiscal category.
 * Returns raw dollars. Applies inflation adjustment.
 */
export function computeMinistryPolicyCost(activeLaws, fiscalCategory, nation) {
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
export function computeMinistryInstitutionCost(institutions, fiscalCategory, nation) {
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
export function buildBudgetData(nation, activeLaws, tradeTariffRevenue, institutions, aidData) {
    const budget = calculateNationalBudget(nation);
    applyTradeTariffOverride(budget, tradeTariffRevenue);
    const inflationStat = Number(nation.inflation || 0);
    const inflationPct = Math.pow(Math.max(0, inflationStat), 1.5) / 100;
    const reserves = Number(nation.budget_reserves || 0);

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


/**
 * Resolve a passed budget bill: adjust debt based on surplus/deficit, update reserves.
 */
export async function resolveBudgetBill(supabase, bill, currentTick) {
    const { data: allocations } = await supabase.from('budget_allocations')
        .select('*').eq('bill_id', bill.id);

    // Use item-level allocations when available (players edit these directly)
    const { data: itemAllocations } = await supabase.from('budget_item_allocations')
        .select('allocation_amount').eq('bill_id', bill.id);

    const { data: nation } = await supabase.from('nations')
        .select('*').eq('id', bill.nation_id).single();
    if (!nation) return;

    const budget = calculateNationalBudget(nation);

    // Override tariff revenue with real trade engine data
    let tradeTariffRevenue = null;
    try {
        const { data: tradeSummary } = await supabase.from('trade_summary')
            .select('tariff_revenue')
            .eq('nation_id', nation.id)
            .order('tick', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (tradeSummary) tradeTariffRevenue = Number(tradeSummary.tariff_revenue);
    } catch (e) { /* no trade data yet */ }
    applyTradeTariffOverride(budget, tradeTariffRevenue);

    // Include economic aid in budget resolution
    let aidData = { received: 0, given: 0 };
    try {
        aidData = await getActiveAidForNation(supabase, nation.id);
    } catch (e) { /* no aid data yet */ }

    const reserves = Number(nation.budget_reserves || 0);
    const available = budget.grossRevenue + aidData.received + reserves - budget.debtService - aidData.given;

    let totalSpending = 0;
    if (itemAllocations && itemAllocations.length > 0) {
        for (const item of itemAllocations) {
            totalSpending += Number(item.allocation_amount || 0);
        }
    } else {
        for (const alloc of (allocations || [])) {
            totalSpending += Number(alloc.allocation_amount || 0);
        }
    }

    const gap = available - totalSpending;
    let newDebt = Number(nation.debt || 0);
    let newReserves = 0;

    if (gap >= 0) {
        // Surplus: reduce debt (or build reserves if no debt)
        if (newDebt > 0) {
            const debtReduction = Math.min(gap, newDebt);
            newDebt -= debtReduction;
            newReserves = gap - debtReduction;
        } else {
            newReserves = gap;
        }
    } else {
        // Deficit: add to debt
        newDebt += Math.abs(gap);
        newReserves = 0;
    }

    // Update nation
    const { error: updateErr } = await supabase.from('nations').update({
        debt: newDebt,
        budget_reserves: newReserves,
        last_budget_tick: currentTick,
        last_budget_bill_id: bill.id
    }).eq('id', nation.id);

    if (updateErr) {
        console.error(`[resolveBudgetBill] CRITICAL: Failed to update nation ${nation.name} (last_budget_tick=${currentTick}):`, updateErr.message);
    }

    console.log(`[resolveBudgetBill] Nation ${nation.name}: spending=$${(totalSpending/1e9).toFixed(2)}B, gap=$${(gap/1e9).toFixed(2)}B, newDebt=$${(newDebt/1e9).toFixed(2)}B, last_budget_tick=${currentTick}`);

    // Legislative activity: boost gov_approval_events for passing a budget
    await adjustGovernmentApprovalEvent(supabase, nation.id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage:budget');
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

        // Notify both nations
        await fireBilateralEvent(supabase, 'trade_agreement_expired', agreement.nation_a_id, agreement.nation_b_id, currentTick, { agreement_name: agreement.agreement_name || 'Agreement' });

        results.push({ id: agreement.id, name: agreement.agreement_name, type: agreement.agreement_type });
        console.log(`[processExpiredTradeAgreements] Expired: ${agreement.agreement_name} (${agreement.agreement_type})`);
    }
    return results;
}


// ==================== BUDGET UNFUNDED PENALTY ====================

/**
 * Check if a budget bill has been on the floor for more than BUDGET_UNFUNDED_FLOOR_TICKS
 * without passing. If so, return true — the caller should force all ministry/institution
 * funding to 0% (same effect as government shutdown's buildShutdownStatInstMap).
 *
 * @returns {{ active: boolean, ticksOnFloor: number, billId?: string }}
 */
export async function isBudgetUnfunded(supabase, nation, currentTick) {
    const { data: floorBudgetBills } = await supabase
        .from('bills')
        .select('id, floor_tick, proposed_tick')
        .eq('nation_id', nation.id)
        .eq('bill_type', 'budget')
        .eq('status', 'floor')
        .order('proposed_tick', { ascending: true })
        .limit(1);

    if (!floorBudgetBills || floorBudgetBills.length === 0) {
        return { active: false, ticksOnFloor: 0 };
    }

    const bill = floorBudgetBills[0];
    // Use floor_tick if available, otherwise estimate from proposed_tick + committee time
    const floorTick = bill.floor_tick ?? (bill.proposed_tick + GAME_CONFIG.BUDGET_COMMITTEE_EXPIRY_TICKS);
    const ticksOnFloor = currentTick - floorTick;
    const threshold = GAME_CONFIG.BUDGET_UNFUNDED_FLOOR_TICKS;

    return {
        active: ticksOnFloor >= threshold,
        ticksOnFloor,
        billId: bill.id
    };
}



// Trade balance influences GDP growth each tick:
// trade_balance (0-100) centered at 50 → surplus boosts gdp_growth, deficit drags it down
// Nudge: (trade_balance - 50) / 50 → range -1 to +1 per tick on gdp_growth
export async function applyTradeBalanceToGdpGrowth(supabase, nation) {
    const tradeBalance = Number(nation.trade_balance ?? 50);
    const currentGdpGrowth = Number(nation.gdp_growth ?? 50);
    const nudge = (tradeBalance - 50) / 50; // -1 to +1
    const newGdpGrowth = Math.max(0, Math.min(100, currentGdpGrowth + nudge));
    if (Math.abs(nudge) < 0.01) return;
    nation.gdp_growth = newGdpGrowth;
    await supabase.from('nations').update({ gdp_growth: newGdpGrowth }).eq('id', nation.id);
}

// Apply GDP growth rate: gdp_growth (0-100) centered at 50 maps to -1% to +1% per month
// Formula: monthlyChange% = (gdp_growth - 50) / 50  →  0=-1%, 50=0%, 100=+1%
export async function applyGdpGrowth(supabase, nation) {
    const gdpGrowth = Number(nation.gdp_growth ?? 50);
    const currentGdp = Number(nation.gdp ?? 0);
    if (currentGdp <= 0) return;

    const monthlyChangePercent = (gdpGrowth - 50) / 50;
    const newGdp = Math.max(0, currentGdp * (1 + monthlyChangePercent / 100));
    nation.gdp = newGdp;

    await supabase.from('nations').update({ gdp: newGdp }).eq('id', nation.id);
}
