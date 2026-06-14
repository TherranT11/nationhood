/**
 * budget.js — National budget, tax config, economic aid, shutdown, GDP growth
 * Extracted from game-common.js
 */

import { GAME_CONFIG } from './config.js';
import { DIPLOMACY_CONFIG, RAW_SCALING_DIVISORS } from './diplomacy-constants.js';
import { MINISTER_APPROVAL_CONFIG } from './stats.js';
import { hasElectedPresident, isAbsoluteMonarchy } from './government-types.js';
import { fireBilateralEvent } from './event-helpers.js';

// ==================== NATIONAL BUDGET CALCULATION ====================

// Per-capita economic scale: population is divided by this for BOTH income-tax
// revenue and population-scaled policy costs, so the two grow in lockstep. A
// mismatch here (revenue per-10M vs costs per-1M) once made costs ~10× revenue.
export const POPULATION_SCALE = 10_000_000;

/**
 * Per-tick income tax revenue.
 *   (population / POPULATION_SCALE) × (income_tax / 100) × wages × (1 − unrest/100)
 * Lands as a small literal number that adds to nation.budget each tick.
 * Pass a rateOverride to preview revenue at a hypothetical rate.
 */
export function computeIncomeTaxRevenue(nation, rateOverride) {
    const pop = Number(nation.population || 0);
    const rate = rateOverride !== undefined ? Number(rateOverride) : Number(nation.income_tax || 0);
    const wages = Number(nation.wages || 0);
    const unrest = Number(nation.unrest || 0);
    const rev = (pop / POPULATION_SCALE) * (rate / 100) * wages * (1 - unrest / 100);
    return Math.max(0, rev);
}

// Flat per-tick contribution to corporate tax revenue for every active
// entrepreneur corporation HQ'd in the nation. $1/tick × 12 ticks =
// $12/yr per corp, independent of the corporate_tax rate or corruption.
export const CORP_TAX_PER_CORP_PER_TICK = 1;

export function computeCorporateTaxPerCorp(activeCorpCount) {
    return CORP_TAX_PER_CORP_PER_TICK * Number(activeCorpCount || 0);
}

/**
 * Per-tick corporate tax revenue.
 *   ((service_sector + industry) / 10) × corporate_tax × (1 − corruption/100)
 *   + 1 × activeCorpCount      ($12/yr per active corp HQ'd here)
 * Pass a rateOverride to preview revenue at a hypothetical rate.
 * activeCorpCount defaults to 0; callers without a count get the
 * rate-only figure (used by economy.html rate-delta projections
 * where the per-corp adder cancels out).
 */
export function computeCorporateTaxRevenue(nation, rateOverride, activeCorpCount = 0) {
    const svc = Number(nation.service_sector || 0);
    const ind = Number(nation.industry || 0);
    const rate = rateOverride !== undefined ? Number(rateOverride) : Number(nation.corporate_tax || 0);
    const corruption = Number(nation.corruption || 0);
    // rate is the % effective corporate tax rate under the unified 0-100
    // scale (migration 20261209). Mirror the income_tax pattern: divide by
    // 100 so "rate=50" means 50% of the taxable base. Pre-fix the formula
    // multiplied by raw rate, inflating revenue 100× under the new scale.
    const rateRev = (svc + ind) * (rate / 100) * (1 - corruption / 100);
    return Math.max(0, rateRev) + computeCorporateTaxPerCorp(activeCorpCount);
}

/**
 * Annual Public Sector Wages cost: monthly = (state_apparatus × wages) / 200,
 * annual = monthly × ticks/year. Single source of truth — read by
 * computePanelAnnualExpenditures (server per-tick debt) and
 * _gbBuildCostRows in government.html (the displayed Costs panel) so the
 * panel balance and the per-tick debt change can never diverge.
 */
export function computePublicSectorWagesAnnual(nation) {
    return (Number(nation?.state_apparatus) || 0) * (Number(nation?.wages) || 0)
        / 200 * GAME_CONFIG.TICKS_PER_YEAR;
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
    const corpRevenue = computeCorporateTaxRevenue(nation, undefined, opts.activeCorpCount || 0);

    // Debt service: flat 5% annual interest on outstanding debt.
    const FLAT_ANNUAL_INTEREST = 0.05;
    const debtService = debt * FLAT_ANNUAL_INTEREST;

    const availableBudget = grossRevenue - debtService;

    return {
        grossRevenue, debtService, availableBudget,
        collectionRate: 1,
        incomeRevenue, corpRevenue,
        tariffRevenue: 0
    };
}

// ════════════════════════════════════════════════════════════════
// Per-tick national debt math (v3 — bonds retired).
//
// Balance = revenue − expenditures.
//   surplus + debt > 0 → debt shrinks by the surplus (capped at
//                         remaining debt); any leftover after the
//                         debt clears accumulates in treasury.
//   surplus + debt = 0 → full surplus accumulates in treasury
//                         (stockpile, not flow — once the books
//                         are square, future surpluses are savings).
//   deficit            → debt grows by |balance|, treasury untouched
//                         (implicit borrow — no bond offers, no printing).
//
// Mirrors the Government Budget panel's monthly-balance math so
// what the player sees on the cards is what gets applied each tick.
//
// Unit handling: nation.budget AND nation.debt are both stored as
// abstract integers (migrations 20261206 + 20261207). The unified
// scale means processNationDebtTick can compute deltas without any
// raw↔abstract conversion. Other tick-math paths (chargePolicyUpfrontCost,
// resolveTradeRatificationBill, bailout payouts, recurring trade
// transfers, corp shipping payments) bridge through the exported
// RAW_PER_ABSTRACT constant below when comparing raw-dollar `amount` /
// `revenue` / `dollars` fields against the abstract columns.
//
// REMAINING SCOPE-FLAG: calculateNationalBudget still aliases
// nation.budget (treasury) as `grossRevenue` for back-compat. The
// Government Budget panel + processNationDebtTick now compute real
// revenue via computeIncomeTaxRevenue + computeCorporateTaxRevenue,
// so they no longer see the aliasing flaw. economy.html still reads
// budget.grossRevenue directly and will display treasury as revenue
// until separately patched.
// ════════════════════════════════════════════════════════════════

// Single source of truth for the raw-dollar ↔ abstract-integer bridge.
// abstract × RAW_PER_ABSTRACT = raw dollars. Used by every tick-math
// path that compares raw transfer / payment amounts against the abstract
// nation.budget / nation.debt columns.
export const RAW_PER_ABSTRACT = 1_000_000;

/**
 * Per-nation Interior Infrastructure upkeep. Single source of truth
 * for both the panel display and processNationDebtTick. Reads
 * completed Interior Infrastructure contracts (status='completed',
 * project_subtype='Interior Infrastructure') for the nation, joins
 * each spec_category to its tier in interior_infrastructure_tiers(),
 * and sums upkeep_per_year × count.
 *
 * Returns { totalAnnual, byTier: [{ key, name, count, annual }] }.
 * byTier is sorted small → modest → extravagant for stable display
 * order; tiers with zero builds are dropped.
 */
const _INTERIOR_TIER_ORDER = ['small', 'modest', 'extravagant'];

export async function computeInteriorInfraAnnualCost(supabase, nation) {
    const empty = { totalAnnual: 0, byTier: [] };
    if (!nation?.id) return empty;
    let tiers = {};
    try {
        const { data } = await supabase.rpc('interior_infrastructure_tiers');
        tiers = data || {};
    } catch (_) { return empty; }

    let builds = [];
    try {
        const { data, error } = await supabase.from('corp_contracts')
            .select('spec_category')
            .eq('issuer_nation_id', nation.id)
            .eq('project_subtype', 'Interior Infrastructure')
            .eq('status', 'completed');
        if (error) return empty;
        builds = data || [];
    } catch (_) { return empty; }

    const countsBySpec = {};
    for (const b of builds) {
        const k = b.spec_category;
        if (!k) continue;
        countsBySpec[k] = (countsBySpec[k] || 0) + 1;
    }

    const byTier = [];
    let totalAnnual = 0;
    for (const key of _INTERIOR_TIER_ORDER) {
        const t = tiers[key];
        if (!t) continue;
        const count = countsBySpec[t.spec_category] || 0;
        if (count === 0) continue;
        const upkeep = Number(t.upkeep_per_year) || 0;
        const annual = count * upkeep;
        totalAnnual += annual;
        byTier.push({ key, name: t.name, count, annual });
    }
    return { totalAnnual, byTier };
}

// Combined Arms School upkeep — annual abstract $ for the nation.
// Each completed school (corp_contracts project_subtype='Combined
// Arms School', issuer_nation_id=nation) costs upkeep_per_tick
// (from combined_arms_school_spec, $2) every tick, perpetually,
// surfaced under National Infrastructure. Keyed off the nation (not
// the issuing faction) so it persists even if that faction is gone.
export async function computeCombinedArmsSchoolUpkeepAnnual(supabase, nation) {
    if (!nation?.id) return { totalAnnual: 0, count: 0 };
    let perTick = 0;
    try {
        const { data: spec } = await supabase.rpc('combined_arms_school_spec');
        perTick = Number(spec?.upkeep_per_tick) || 0;
    } catch (_) { return { totalAnnual: 0, count: 0 }; }
    if (perTick <= 0) return { totalAnnual: 0, count: 0 };
    let count = 0;
    try {
        const { count: n, error } = await supabase.from('corp_contracts')
            .select('id', { count: 'exact', head: true })
            .eq('issuer_nation_id', nation.id)
            .eq('project_subtype', 'Combined Arms School')
            .eq('status', 'completed');
        if (error) { console.warn('[CombinedArmsSchool] upkeep count failed:', error.message); return { totalAnnual: 0, count: 0 }; }
        count = n || 0;
    } catch (e) {
        console.warn('[CombinedArmsSchool] upkeep threw:', e?.message || e);
        return { totalAnnual: 0, count: 0 };
    }
    return { totalAnnual: count * perTick * GAME_CONFIG.TICKS_PER_YEAR, count };
}

// Military unit maintenance — annual abstract $ for the nation's
// active (non-Decommissioned) units. Per-tick upkeep = 25% of a
// unit's stored construction_cost, ROUNDED DOWN, with a HARD FLOOR
// of $1/tick per unit (every unit always costs ≥ $1; an $8 unit →
// $2/tick → $24/yr). construction_cost is stored on the army /1e6
// scale (create_unit / party_funds), distinct from the /1e9 trade-
// debt abstraction — the "$8 create → $2 tick" spec pins this. The
// status <> 'Decommissioned' filter is the SAME committed-unit rule
// create_unit uses for manpower (one definition).
//
// The military faction was retired (2027xxxx): there are no army units
// to maintain, so unit maintenance is structurally zero. Kept as a
// function so computePanelAnnualExpenditures' shape is unchanged.
export async function computeUnitMaintenanceAnnual() {
    return 0;
}

/**
 * Panel-accurate annual expenditures. Mirrors _gbBuildCostRows in
 * government.html so the tick processor's debt math agrees with what
 * the Government Budget panel shows the player.
 *
 * Five line items, all in abstract units:
 *   - Interest on Debt        = debtService (raw $) / 1e9
 *   - Royal Holdings          = $36/yr if monarchy, else 0
 *   - Active-law ongoing      = sum(active_laws.selected_option.ongoing_base_cost) × 12
 *   - Sports & Culture (Vola) = nations.vola_stadium_annual_cost
 *                               (sum of every completed stadium's tier annual cost
 *                               — small $0.5 / modest $1 / extravagant $2)
 *   - Interior Infrastructure = sum over completed Interior Infrastructure
 *                               contracts of tier.upkeep_per_year
 *                               (small $1 / modest $2 / extravagant $4)
 *   - Public Sector Wages     = (state_apparatus × wages) / 200 × 12
 *   - Unit Maintenance        = 0 (army units retired — 20270905)
 *   - Combined Arms School    = (#completed schools) × upkeep_per_tick($2) × 12
 *                               (rolls up under National Infrastructure)
 *
 * Single source of truth: processNationDebtTick in this file +
 * _gbBuildCostRows in government.html both depend on this returning
 * the same number, so the panel's monthly balance and the per-tick
 * debt change always agree.
 */
export async function computePanelAnnualExpenditures(supabase, nation) {
    const budget = calculateNationalBudget(nation);
    // nation.debt is now stored as abstract integers (migration 20261207),
    // so debtService (= debt × FLAT_ANNUAL_INTEREST) is already on the
    // unified abstract scale — no _RAW_PER_ABSTRACT division needed.
    const debtServiceAbstract = Number(budget.debtService || 0);
    const royalHoldingsAnnual = isAbsoluteMonarchy(nation) ? 36 : 0;
    let activeLawAnnual = 0;
    try {
        // Canonical cost column: policy_options.ongoing_base_cost.
        // Both policies.ongoing_base_cost and
        // policies.ongoing_cost_per_tick that older code referenced
        // were dropped from the schema.
        const { data: laws, error: lawsErr } = await supabase
            .from('active_laws')
            .select('selected_option:policy_options!selected_option_id(ongoing_base_cost)')
            .eq('nation_id', nation.id);
        if (lawsErr) {
            console.warn(`[Budget] active_laws fetch failed for ${nation.name}:`, lawsErr.message);
        } else {
            for (const law of (laws || [])) {
                const perTick = Number(law?.selected_option?.ongoing_base_cost) || 0;
                if (perTick > 0) activeLawAnnual += perTick * 12;
            }
        }
    } catch (err) {
        console.warn(`[Budget] active_laws threw for ${nation.name}:`, err?.message || err);
    }
    const stadiumAnnualCost = Number(nation.vola_stadium_annual_cost) || 0;
    const interiorInfra = await computeInteriorInfraAnnualCost(supabase, nation);
    const publicSectorWagesAnnual = computePublicSectorWagesAnnual(nation);
    const unitMaintenanceAnnual = await computeUnitMaintenanceAnnual(supabase, nation);
    const combinedArmsSchoolAnnual = (await computeCombinedArmsSchoolUpkeepAnnual(supabase, nation)).totalAnnual;
    return debtServiceAbstract + royalHoldingsAnnual + activeLawAnnual + stadiumAnnualCost + interiorInfra.totalAnnual + publicSectorWagesAnnual + unitMaintenanceAnnual + combinedArmsSchoolAnnual;
}

export async function processNationDebtTick(supabase, nation, activeCorpCount = 0) {
    // Annual revenue from the actual tax flow — same formulas that drive
    // the Revenue card in the budget panel. Previously this read
    // budget.grossRevenue which is aliased to nation.budget (treasury),
    // producing a perTickBalance based on stockpile vs flow — wrong unit.
    const incomeAnnual = computeIncomeTaxRevenue(nation) * 12;
    const corpAnnual   = computeCorporateTaxRevenue(nation, undefined, activeCorpCount) * 12;
    const annualRevenue = incomeAnnual + corpAnnual;
    const annualExpenditures = await computePanelAnnualExpenditures(supabase, nation);
    const perTickBalance = (annualRevenue - annualExpenditures) / 12;

    if (perTickBalance === 0) return null;

    // nation.debt and nation.budget are both stored as abstract integers
    // post-migrations 20261206 + 20261207 — no _RAW_PER_ABSTRACT bridging
    // needed inside this function. perTickBalance is also abstract.
    //
    // Re-read budget + debt fresh: earlier processors this tick (notably the
    // recurring trade/aid transfer loop, section 3.5f) credit or debit the
    // treasury directly in the DB, so the in-memory `nation` object can be
    // stale here. Reading first keeps the deficit-from-treasury math correct
    // and avoids overwriting those updates with a stale baseline.
    const { data: _fresh, error: _readErr } = await supabase.from('nations')
        .select('budget, debt').eq('id', nation.id).maybeSingle();
    if (_readErr || !_fresh) {
        console.warn(`[Debt] balance read failed for ${nation.name}:`, _readErr?.message);
        return null;
    }
    const currentDebt     = Number(_fresh.debt) || 0;
    const currentTreasury = Number(_fresh.budget) || 0;

    if (perTickBalance > 0) {
        // Surplus → treasury. Debt is NOT auto-paid from surpluses (it falls
        // via the corp-tax credit + explicit pay-down); this lets an indebted
        // nation build a treasury buffer so costs draw from cash, not debt.
        const newBudget = currentTreasury + perTickBalance;
        const { error } = await supabase.from('nations')
            .update({ budget: newBudget }).eq('id', nation.id);
        if (error) {
            console.warn(`[Debt] surplus update failed for ${nation.name}:`, error.message);
            return null;
        }
        nation.budget = newBudget;
        return { mode: 'surplus_to_treasury', perTickBalance, newDebtRaw: currentDebt };
    }

    // Deficit → debt grows by the full shortfall; treasury is NOT used as a
    // buffer. The previous "drain treasury first" path silently absorbed
    // years of overspend so debt never reflected the deficit on the budget
    // panel. Trade/aid still credits the treasury separately (those
    // processors run earlier this tick); debt now strictly tracks operating
    // shortfall, which is what the panel's Balance shows.
    const deficit = -perTickBalance;
    const newDebt = currentDebt + deficit;
    const { error } = await supabase.from('nations')
        .update({ debt: newDebt }).eq('id', nation.id);
    if (error) {
        console.warn(`[Debt] deficit update failed for ${nation.name}:`, error.message);
        return null;
    }
    nation.debt = newDebt;
    return {
        mode: 'deficit_borrow',
        perTickBalance: -deficit,
        newDebtRaw: newDebt,
    };
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
 * Map fiscal category names → ministry_key.
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

// Cost-scaling divisors for head-count stats. RAW_SCALING_DIVISORS.population
// is 1M (its job is abstract↔raw stat-delta conversion in political-actions);
// reusing it for COSTS made policy spend scale per-million while revenue
// scales per-POPULATION_SCALE, so costs ran ~10× ahead of revenue. Cost
// scaling shares revenue's POPULATION_SCALE here; other stats fall back to
// RAW_SCALING_DIVISORS.
const POLICY_COST_DIVISORS = { population: POPULATION_SCALE, eligible_voters: POPULATION_SCALE };

/**
 * Scale a policy's ongoing_base_cost by a nation stat (e.g. population).
 * Single source of truth for the scaling factor — every cost-display
 * surface (budget, bill preview, GOV/Economy pages, the tick) calls this
 * so the figures never drift apart. Population/voters scale per-10M to
 * match revenue; other stats use RAW_SCALING_DIVISORS.
 * If the scaling stat is unset or the nation lacks that column (deleted by
 * the alpha refactor), returns the unscaled base.
 */
export function scalePolicyOngoingCost(ongoingBase, scalingStat, nation) {
    const base = Number(ongoingBase) || 0;
    if (!base || !scalingStat || nation?.[scalingStat] == null) return base;
    const divisor = POLICY_COST_DIVISORS[scalingStat] || RAW_SCALING_DIVISORS[scalingStat] || 50;
    return base * ((Number(nation[scalingStat]) || 1) / divisor);
}

/**
 * Compute the annualized cost of all active policies for a given fiscal category.
 * Returns raw dollars. Alpha refactor: inflation multiplier is a no-op
 * (constant 1) so policy costs no longer scale with inflation.
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
            const scaled = scalePolicyOngoingCost(ongoingBase, scalingStat, nation);
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
 * Build full budget data for a nation: revenue, expenditures per ministry, debt service, etc.
 * @param {Object} aidData - Optional { received: number, given: number, agreements: [...] }
 */
export function buildBudgetData(nation, activeLaws, tradeTariffRevenue, aidData) {
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
        const fulfilledCost = polResult.total;
        ministries[cat] = {
            fulfilledCost,
            allocation: fulfilledCost,  // default: fulfill
            policies: polResult.policies,
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

// Crisis sunset (Phase 2): activateEconomicCollapse removed. It was
// already orphaned by Phase 1's processCrises deletion and fired the
// Economic Collapse / Currency Collapse / Hyperinflation Emergency
// mega-crisis chain plus a -25 gov approval and -6 momentum / -0.15
// credibility hit to every coalition party. Reintroduce via a
// modifier_template plus a one-shot SQL RPC if the bleed-out behavior
// is wanted back.

/**
 * Per-tick GDP drift driven by the gdp_growth stat.
 *   gdp_growth ∈ [0,100], 50 = 0%/month, 100 = +1%/month, 0 = −1%/month.
 *   monthlyPct = ((gdp_growth − 50) / 50) × 1.0
 *   newGdp     = oldGdp × (1 + monthlyPct / 100)
 *
 * nation.gdp is stored in $B abstract units (e.g. 358.6 = $358.6B).
 * Floor at 0 (no negative GDP). UPDATE returns silently if no row
 * matches; non-fatal on error per the budget tick's broader contract.
 */
export async function applyGdpGrowthDrift(supabase, nation) {
    const gdp = Number(nation?.gdp);
    if (!isFinite(gdp) || gdp <= 0) return null;
    const growthStat = Number(nation?.gdp_growth);
    if (!isFinite(growthStat)) return null;

    const monthlyPct = ((growthStat - 50) / 50) * 1.0;     // ±1% range
    if (monthlyPct === 0) return null;                      // exact 0 → no write

    const newGdp = Math.max(0, Math.round(gdp * (1 + monthlyPct / 100) * 10) / 10); // 1dp
    if (newGdp === gdp) return null;                        // sub-0.1 drift → skip write

    const { error } = await supabase.from('nations')
        .update({ gdp: newGdp })
        .eq('id', nation.id);
    if (error) {
        console.warn(`[applyGdpGrowthDrift] update failed for ${nation.name}:`, error.message);
        return null;
    }
    nation.gdp = newGdp;
    return { before: gdp, after: newGdp, monthlyPct };
}
