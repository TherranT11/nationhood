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
 * Auto-generate a budget bill for a nation.
 * Called at January ticks (tick % 12 === 1, since tick 1 = January after start).
 */
export async function generateBudgetBill(supabase, nation, currentTick, activeLaws, opts) {
    const systemGenerated = opts?.systemGenerated || false;

    // Fetch latest trade summary for tariff revenue (matches Economy page)
    let tradeTariffRevenue = null;
    try {
        const { data: tradeSummary } = await supabase.from('trade_summary')
            .select('tariff_revenue')
            .eq('nation_id', nation.id)
            .order('tick', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (tradeSummary) tradeTariffRevenue = Number(tradeSummary.tariff_revenue);
    } catch (e) { /* no trade data yet — use formula fallback */ }

    // Load institution config for cost calculations
    const { data: instRows } = await supabase.from('ministry_institution_config')
        .select('*');

    // Query active economic aid agreements for this nation
    let aidData = { received: 0, given: 0, agreements: [] };
    try {
        aidData = await getActiveAidForNation(supabase, nation.id);
    } catch (e) { /* no aid data yet */ }

    const budgetData = buildBudgetData(nation, activeLaws, tradeTariffRevenue, instRows || [], aidData);

    const gameYear = 2000 + Math.floor(currentTick / 12);
    const billName = `Budget Act of ${gameYear}`;

    // Find sponsor: ruling faction or first party faction.
    // System-generated bills also need a sponsor (proposed_by NOT NULL constraint).
    let sponsorId = nation.ruling_faction_id;
    if (!sponsorId) {
        const { data: parties } = await supabase.from('factions')
            .select('id').eq('nation_id', nation.id).eq('faction_type', 'party').limit(1);
        sponsorId = parties?.[0]?.id;
    }
    if (!sponsorId) {
        console.error(`[generateBudgetBill] No sponsor found for ${nation.name} — cannot create budget bill`);
        return null;
    }

    const preamble = systemGenerated
        ? `Annual budget for the fiscal year ${gameYear}. ` +
          `This bill allocates $${(budgetData.available / 1e9).toFixed(1)}B in available revenue across all government ministries. ` +
          `The budget has been automatically introduced to committee and must be moved to the floor for a vote before the deadline.`
        : `Annual budget for the fiscal year ${gameYear}. ` +
          `This bill allocates $${(budgetData.available / 1e9).toFixed(1)}B in available revenue across all government ministries. ` +
          (budgetData.inflationPct > 0
              ? `Inflation (${budgetData.inflationStat.toFixed(0)}/100) has increased all costs by ~${budgetData.inflationPct.toFixed(1)}% since the last budget cycle.`
              : `Inflation is currently under control.`);

    // Insert the bill into committee (voting_ends_tick set when sent to floor)
    const { data: bill, error: billError } = await supabase.from('bills').insert({
        nation_id: nation.id,
        proposed_by: sponsorId,
        proposed_tick: currentTick,
        bill_name: billName,
        status: 'committee',
        preamble,
        bill_type: 'budget'
    }).select('id').single();

    if (billError || !bill) {
        console.error('[generateBudgetBill] Failed to create budget bill:', billError?.message);
        return null;
    }

    // Insert budget allocations per ministry
    const allocRows = [];
    for (const cat of FISCAL_CATEGORIES) {
        const m = budgetData.ministries[cat];
        allocRows.push({
            bill_id: bill.id,
            nation_id: nation.id,
            fiscal_category: cat,
            allocation_amount: m.allocation,
            fulfilled_cost: m.fulfilledCost
        });
    }

    const { error: allocError } = await supabase.from('budget_allocations').insert(allocRows);
    if (allocError) {
        console.error('[generateBudgetBill] Failed to insert allocations:', allocError.message);
    }

    // Insert per-item allocations (institutions + policies)
    const itemRows = [];
    for (const cat of FISCAL_CATEGORIES) {
        const m = budgetData.ministries[cat];
        for (const inst of (m.institutions || [])) {
            itemRows.push({
                bill_id: bill.id, nation_id: nation.id, fiscal_category: cat,
                item_type: 'institution', item_id: inst.id,
                item_name: inst.institution_name,
                allocation_amount: inst.cost, needed_amount: inst.cost, is_cut: false
            });
        }
        for (const pol of (m.policies || [])) {
            itemRows.push({
                bill_id: bill.id, nation_id: nation.id, fiscal_category: cat,
                item_type: 'policy', item_id: pol.policy_id,
                item_name: pol.policy_name,
                allocation_amount: pol.cost, needed_amount: pol.cost, is_cut: false
            });
        }
    }
    if (itemRows.length > 0) {
        const { error: itemError } = await supabase.from('budget_item_allocations').insert(itemRows);
        if (itemError) console.error('[generateBudgetBill] Failed to insert item allocations:', itemError.message);
    }

    console.log(`[generateBudgetBill] Created budget bill "${billName}" for ${nation.name} (bill ${bill.id})`);
    return bill.id;
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

/**
 * Check if a nation is missing a budget and apply penalties.
 * Called each tick. If no budget has passed in the current fiscal year, apply penalties.
 */
export async function processNoBudgetPenalty(supabase, nation, currentTick) {
    const lastBudgetTick = nation.last_budget_tick;
    const ticksSinceLastBudget = lastBudgetTick != null ? (currentTick - lastBudgetTick) : currentTick;

    // Grace period: no penalty in the first year (first 12 ticks)
    if (currentTick < 12) return null;

    // If budget was passed within the last year, no penalty
    if (ticksSinceLastBudget <= GAME_CONFIG.TICKS_PER_YEAR) return null;

    // Penalty scales: the longer without a budget, the worse
    const ticksOverdue = ticksSinceLastBudget - GAME_CONFIG.TICKS_PER_YEAR;
    const maxPenaltyTicks = GAME_CONFIG.NO_BUDGET_PENALTY_TICKS;
    const severity = Math.min(ticksOverdue / maxPenaltyTicks, 1.0);

    // Apply penalties: efficiency drops, stability drops, credit drops
    // Use one-decimal-place precision so early overdue ticks still apply small penalties
    // instead of rounding to 0 (e.g. severity=0.04 → effPenalty=-0.1 instead of 0)
    const effPenalty = -Math.round(severity * 2 * 10) / 10;    // up to -2.0/tick
    const stabPenalty = -Math.round(severity * 1.5 * 10) / 10; // up to -1.5/tick
    const creditPenalty = -Math.round(severity * 1 * 10) / 10; // up to -1.0/tick

    const updates = {};
    if (effPenalty !== 0) updates.efficiency = Math.round(Math.max(0, Number(nation.efficiency || 50) + effPenalty) * 10) / 10;
    if (stabPenalty !== 0) updates.stability = Math.round(Math.max(0, Number(nation.stability || 50) + stabPenalty) * 10) / 10;
    if (creditPenalty !== 0) updates.credit = Math.round(Math.max(0, Number(nation.credit || 50) + creditPenalty) * 10) / 10;

    if (Object.keys(updates).length > 0) {
        await supabase.from('nations').update(updates).eq('id', nation.id);
        Object.assign(nation, updates);
    }

    return { ticksOverdue, severity, effPenalty, stabPenalty, creditPenalty };
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

// ==================== GOVERNMENT SHUTDOWN ====================
// Stable UUID for the Government Shutdown crisis template (matches SQL migration)
export const GOVERNMENT_SHUTDOWN_CRISIS_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Check if a government shutdown is active for this nation.
 * Shutdown triggers when a budget due date has been missed by 2 ticks
 * while there is still an open Budget Bill (committee or floor).
 * Ends automatically when the Budget Bill is passed (no open budget bills remain).
 *
 * @returns {{ active: boolean, openBillId?: string, ticksOpen?: number }}
 */
export async function isGovernmentShutdown(supabase, nation, currentTick) {
    // Find the oldest open budget bill for this nation
    // Include president_desk: the bill passed legislature but awaits presidential action
    const { data: openBudgetBills } = await supabase
        .from('bills')
        .select('id, proposed_tick')
        .eq('nation_id', nation.id)
        .eq('bill_type', 'budget')
        .in('status', ['committee', 'floor', 'president_desk'])
        .order('proposed_tick', { ascending: true })
        .limit(1);

    if (!openBudgetBills || openBudgetBills.length === 0) {
        return { active: false };
    }

    const bill = openBudgetBills[0];
    const lastBudgetTick = Number(nation.last_budget_tick || 0);
    const budgetDueTick = lastBudgetTick > 0
        ? (lastBudgetTick + GAME_CONFIG.TICKS_PER_YEAR)
        : GAME_CONFIG.TICKS_PER_YEAR;
    const shutdownStartTick = budgetDueTick + 2;
    const ticksOpen = Math.max(0, currentTick - shutdownStartTick);

    return {
        active: currentTick >= shutdownStartTick,
        openBillId: bill.id,
        ticksOpen
    };
}

/**
 * Build a forced-Collapsed statInstitutionMap: every institution at 0% funding.
 * Used during government shutdown to force all institution-covered stats to decay
 * at the Collapsed tier rate (primary: 2.7, secondary: 1.7).
 */
export function buildShutdownStatInstMap(institutionConfig) {
    const statMap = {};
    for (const inst of (institutionConfig || [])) {
        for (const role of ['primary', 'secondary']) {
            const statKey = inst[`${role}_stat`];
            if (!statKey) continue;
            if (!statMap[statKey]) statMap[statKey] = [];
            statMap[statKey].push({ id: inst.id, role, fundingPct: 0 });
        }
    }
    return statMap;
}

/**
 * Government Shutdown Crisis — approval penalties + active_crises management.
 * Called each tick when isGovernmentShutdown() returns active.
 *
 * Effects (in addition to Collapsed institution decay for unfunded ministries):
 *   - Direct stat damage: stability -1.0 per tick
 *   - Gov approval event: -5 per tick (via adjustGovernmentApprovalEvent)
 *   - All ministers: -6/tick approval penalty (via updateMinisterApprovals SHUTDOWN_MINISTER_PENALTY)
 *   - Gov approval: -25 flat penalty (via calculateGovernmentApprovalTick SHUTDOWN_GOV_PENALTY)
 *   - Unfunded ministries suffer collapsing effect (handled by buildShutdownStatInstMap)
 *   - Inserts an active_crises row so it shows on nation.html
 *   - Fires a system event notification
 */
export async function processGovernmentShutdown(supabase, nation, currentTick, shutdownInfo) {
    const ticksOpen = shutdownInfo?.ticksOpen ?? 0;

    console.log(`[GovernmentShutdown] ACTIVE for ${nation.name} — budget bill open for ${ticksOpen} ticks`);

    // --- 0. Activate crisis record (insert into active_crises if not already present) ---
    const { data: existingCrises, error: checkErr } = await supabase
        .from('active_crises')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('crisis_id', GOVERNMENT_SHUTDOWN_CRISIS_ID);

    if (checkErr) {
        console.error(`[GovernmentShutdown] Failed to check existing crisis for ${nation.name}:`, checkErr.message);
    }

    if (!existingCrises || existingCrises.length === 0) {
        const { error: insertErr } = await supabase
            .from('active_crises')
            .insert({
                crisis_id: GOVERNMENT_SHUTDOWN_CRISIS_ID,
                nation_id: nation.id,
                started_at_tick: currentTick,
                effects_applied_log: []
            });
        if (insertErr) {
            console.warn(`[GovernmentShutdown] Failed to insert active_crises row:`, insertErr.message);
        } else {
            console.log(`[GovernmentShutdown] Crisis activated for ${nation.name} at tick ${currentTick}`);

            // Log to event_log
            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'CRISIS_STARTED: Government Shutdown',
                description_used: 'The government has shut down due to failure to pass a budget.',
                category: 'crisis',
                effects_applied: [],
                fired_at_tick: currentTick
            });

            // Fire system event only on the activation tick (not every tick)
            try {
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'government_shutdown',
                    p_nation_id: nation.id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation.name || 'Unknown',
                        ticks_open: String(ticksOpen)
                    }
                });
            } catch (e) {
                console.warn(`[GovernmentShutdown] fire_system_event failed (template may not exist):`, e.message);
            }
        }
    }

    // --- 1. PM/President approval: -5 per tick via gov approval event ---
    // Shutdown is a catastrophic governance failure — heavy penalty that quickly pins
    // the events component at its -50 floor, tanking the 20% events slice to 0.
    await adjustGovernmentApprovalEvent(supabase, nation.id, -5, 'crisis:government_shutdown');
    console.log(`[GovernmentShutdown] Applied -5 gov approval event for ${nation.name}`);

    // --- 2. Direct stat damage: -1 Stability per tick ---
    const currentStability = Number(nation.stability ?? 50);
    const newStability = Math.round(Math.max(0, currentStability - 1.0) * 10) / 10;
    await supabase.from('nations').update({ stability: newStability }).eq('id', nation.id);
    nation.stability = newStability;
    console.log(`[GovernmentShutdown] Applied -1 stability for ${nation.name}: ${currentStability} → ${newStability}`);

    // --- 3. Ministry approval penalty: -6/tick for all ministers ---
    // (handled by updateMinisterApprovals via the isShutdown flag — SHUTDOWN_MINISTER_PENALTY = -6)

    // --- 4. Unfunded ministries suffer collapsing effect ---
    // (handled by buildShutdownStatInstMap forcing all institutions to 0% funding in the main loop)

    return {
        active: true,
        ticksOpen: ticksOpen
    };
}

/**
 * Deactivate the Government Shutdown crisis when a budget has been passed.
 * Called each tick when isGovernmentShutdown() returns false — removes the
 * active_crises row if one exists, so it disappears from nation.html.
 */
export async function resolveGovernmentShutdown(supabase, nation, currentTick) {
    // Delete directly by nation_id + crisis_id (more robust than query-then-delete)
    const { data: deleted, error: delErr } = await supabase
        .from('active_crises')
        .delete()
        .eq('nation_id', nation.id)
        .eq('crisis_id', GOVERNMENT_SHUTDOWN_CRISIS_ID)
        .select('id, started_at_tick');

    if (delErr) {
        console.error(`[GovernmentShutdown] CRITICAL: Failed to delete active_crises for ${nation.name}:`, delErr.message);
        return;
    }

    if (!deleted || deleted.length === 0) return; // No active shutdown to resolve

    const duration = currentTick - (deleted[0].started_at_tick || 0);

    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'CRISIS_RESOLVED: Government Shutdown',
        description_used: 'The government shutdown has ended. A budget has been passed.',
        category: 'crisis',
        effects_applied: [],
        fired_at_tick: currentTick
    });

    console.log(`[GovernmentShutdown] Crisis resolved for ${nation.name} at tick ${currentTick} (duration: ${duration} ticks)`);
}

// ==================== AUTO-GENERATE BUDGET BILLS ====================

/**
 * Auto-generate a budget bill and place it into committee if one is due.
 * Called each tick from the tick handler. Generates a bill BUDGET_AUTO_GENERATE_LEAD_TICKS
 * (3) ticks before the budget due date. The bill has no sponsor (proposed_by = null) —
 * it is a system-generated bill that parliament must move to the floor.
 *
 * Skips if:
 *   - Nation is an autocracy
 *   - An open budget bill already exists (committee, floor, or president_desk)
 *   - It's too early (not within the auto-generation window)
 */
export async function autoGenerateBudgetBill(supabase, nation, currentTick, activeLaws) {
    // Skip autocracies — no parliament to pass budgets
    if (isAutocracy(nation)) return null;

    // Calculate when the next budget is due
    const lastBudgetTick = Number(nation.last_budget_tick || 0);
    const budgetDueTick = lastBudgetTick > 0
        ? (lastBudgetTick + GAME_CONFIG.TICKS_PER_YEAR)
        : GAME_CONFIG.TICKS_PER_YEAR;
    const generateAtTick = budgetDueTick - GAME_CONFIG.BUDGET_AUTO_GENERATE_LEAD_TICKS;

    // Not time yet
    if (currentTick < generateAtTick) return null;

    // Check if there's already an open budget bill (including president's desk)
    const { data: openBills } = await supabase
        .from('bills')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('bill_type', 'budget')
        .in('status', ['committee', 'floor', 'president_desk'])
        .limit(1);

    if (openBills && openBills.length > 0) return null;

    // Generate the budget bill (system-generated)
    console.log(`[autoGenerateBudgetBill] Generating budget bill for ${nation.name} at tick ${currentTick} (due at tick ${budgetDueTick}, last_budget_tick=${lastBudgetTick})`);
    const billId = await generateBudgetBill(supabase, nation, currentTick, activeLaws, { systemGenerated: true });

    if (!billId) {
        console.error(`[autoGenerateBudgetBill] generateBudgetBill returned null for ${nation.name} — bill creation failed`);
    } else {
        console.log(`[autoGenerateBudgetBill] Auto-generated budget bill for ${nation.name} at tick ${currentTick} (due at tick ${budgetDueTick})`);

        // Fire system event notification
        try {
            await supabase.rpc('insert_news_event', {
                p_nation_id: nation.id,
                p_trigger_key: 'budget_bill_introduced',
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation.name || 'Unknown',
                    bill_name: `Budget Act of ${2000 + Math.floor(currentTick / 12)}`,
                    deadline_ticks: String(GAME_CONFIG.BUDGET_COMMITTEE_EXPIRY_TICKS)
                }
            });
        } catch (e) { /* news template may not exist yet */ }
    }

    return billId;
}

// ==================== BUDGET COMMITTEE AUTO-MOVE ====================

/**
 * Check if a budget bill has sat in committee for BUDGET_COMMITTEE_EXPIRY_TICKS
 * without being moved to the floor. If so, automatically move it to the floor
 * and apply approval penalties. Budget bills can NEVER fail — they persist on
 * the floor until passed.
 *
 * Parliamentary systems:
 *   - Auto-move bill to floor
 *   - All coalition parties receive BUDGET_FAILURE_COALITION_PENALTY (-5) approval
 *
 * Presidential systems:
 *   - Auto-move bill to floor
 *   - President's party receives BUDGET_FAILURE_PRESIDENT_PENALTY (-10) approval
 *
 * @returns {{ movedToFloor: boolean, consequence: string, billId?: string }} or null
 */
export async function processBudgetCommitteeExpiry(supabase, nation, currentTick) {
    // Skip autocracies
    if (isAutocracy(nation)) return null;

    // Find budget bills sitting in committee past the deadline
    const deadline = currentTick - GAME_CONFIG.BUDGET_COMMITTEE_EXPIRY_TICKS;
    const { data: expiredBills } = await supabase
        .from('bills')
        .select('id, bill_name, proposed_tick')
        .eq('nation_id', nation.id)
        .eq('bill_type', 'budget')
        .eq('status', 'committee')
        .lte('proposed_tick', deadline);

    if (!expiredBills || expiredBills.length === 0) return null;

    // Don't auto-move if there's already a budget bill on the floor
    const { data: floorBudgetBills } = await supabase
        .from('bills')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('bill_type', 'budget')
        .eq('status', 'floor')
        .limit(1);
    if (floorBudgetBills && floorBudgetBills.length > 0) {
        console.log(`[BudgetCommitteeExpiry] ${nation.name} — skipping auto-move, budget bill already on floor`);
        return null;
    }

    const bill = expiredBills[0];
    const isPresidential = isPresidentialRepublic(nation);

    // Auto-move the budget bill to the floor (budget bills can never fail)
    await supabase.from('bills').update({
        status: 'floor',
        floor_tick: currentTick
    }).eq('id', bill.id);

    // Apply approval penalties based on government type
    let consequence;
    if (isPresidential) {
        const { data: president } = await supabase
            .from('presidents')
            .select('faction_id')
            .eq('nation_id', nation.id)
            .eq('is_active', true)
            .maybeSingle();

        if (president?.faction_id) {
            await adjustMomentumAll(
                supabase, nation.id, president.faction_id,
                GAME_CONFIG.BUDGET_FAILURE_PRESIDENT_PENALTY,
                'budget:committee_expiry'
            );
            console.log(`[BudgetCommitteeExpiry] Presidential: ${nation.name} — president's party receives ${GAME_CONFIG.BUDGET_FAILURE_PRESIDENT_PENALTY} approval penalty`);
        }
        consequence = 'auto_floor_presidential';
    } else {
        const { data: activeGov } = await supabase
            .from('government_formations')
            .select('id, status, party_ids')
            .eq('nation_id', nation.id)
            .in('status', ['formed', 'caretaker'])
            .order('formed_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        const coalitionPartyIds = activeGov?.party_ids || [];

        for (const partyId of coalitionPartyIds) {
            await adjustMomentumAll(
                supabase, nation.id, partyId,
                GAME_CONFIG.BUDGET_FAILURE_COALITION_PENALTY,
                'budget:committee_expiry'
            );
        }
        if (coalitionPartyIds.length > 0) {
            console.log(`[BudgetCommitteeExpiry] Parliamentary: ${nation.name} — ${coalitionPartyIds.length} coalition parties receive ${GAME_CONFIG.BUDGET_FAILURE_COALITION_PENALTY} approval penalty`);
        }
        consequence = 'auto_floor_parliamentary';
    }

    // Log event (shared for both government types)
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'BUDGET_AUTO_MOVED_TO_FLOOR',
        description_used: `The budget bill "${bill.bill_name}" was automatically moved to the floor after sitting in committee for ${GAME_CONFIG.BUDGET_COMMITTEE_EXPIRY_TICKS} ticks.`,
        category: 'legislation',
        effects_applied: [],
        fired_at_tick: currentTick
    });

    try {
        await supabase.rpc('insert_news_event', {
            p_nation_id: nation.id,
            p_trigger_key: 'budget_auto_floor',
            p_tick: currentTick,
            p_placeholders: { nation: nation.name || 'Unknown', bill_name: bill.bill_name, reason: 'auto-moved to floor from committee' }
        });
    } catch (e) { /* news template may not exist */ }

    return { movedToFloor: true, consequence, billId: bill.id };
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
