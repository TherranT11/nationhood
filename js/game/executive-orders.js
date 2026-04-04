/**
 * executive-orders.js — Executive Order system for presidential governments
 *
 * Provides 5 executive orders the president's party can issue:
 *   1. Acting Minister — bypass senate confirmation (max 3)
 *   2. Tax Adjustment — adjust income/corporate/sales tax ±3%
 *   3. Price Controls — freeze fuel_prices for 3 ticks
 *   4. National Emergency — emergency powers (indefinite until manually ended)
 *   5. Censure — censure a rival faction
 *
 * Overreach: orders issued in the last 8 ticks are counted. 2+ = decree penalty,
 * 4+ = authoritarian drift penalty (applied by tick processor).
 */

import { GAME_CONFIG, deductAP } from './config.js';
import { MINISTER_APPROVAL_CONFIG, buildMinistryBaselines } from './stats.js';
import { isGovernmentPresidential, isPresidentialRepublic } from './government-types.js';
import { adjustGovernmentApprovalEvent, adjustCredibility } from './momentum.js';
import { getNationNames } from './political-actions.js';
import { enactBill } from './bills.js';
import { getTraitAPModifier } from './party-leadership.js';

// ─── Executive Order Config Constants ───

export const EO_CONFIG = {
    ACTING_MINISTER_AP: 3,
    ACTING_MINISTER_MAX: 3,
    TAX_ADJUSTMENT_BASE_AP: 2,
    TAX_ADJUSTMENT_MAX_AP: 4,
    TAX_ADJUSTMENT_DELTA: 3,       // ±3 percentage points
    TAX_ADJUSTMENT_COOLDOWN: 3,    // ticks between same tax type
    PRICE_CONTROLS_AP: 4,
    PRICE_CONTROLS_DURATION: 3,
    PRICE_CONTROLS_COOLDOWN: 4,
    NATIONAL_EMERGENCY_AP: 4,
    EMERGENCY_COOLDOWN: 8,
    EMERGENCY_UNREST_THRESHOLD: 18,
    CENSURE_AP: 1,
    CENSURE_REPEAT_WINDOW: 5,
    CENSURE_BASE_MOMENTUM: 8,
    CENSURE_REPEAT_MOMENTUM: 16,
    OVERREACH_WINDOW: 8,
    EMERGENCY_ADVANCE_APPROVAL_COST: -6,
    STIMULATE_ECONOMY_AP: 3,
};

// ─── Stimulate the Economy — Ideology-Flavored Executive Orders ───
// Each ideology gets 2 realistic orders. Once used, cannot be reused in the same presidential term.
// stat_increases/stat_decreases: { stat_key: magnitude }

export const STIMULATE_ECONOMY_ORDERS = {
    // === Axis: Individualism vs Collectivism ===
    individualism_deregulation: {
        key: 'individualism_deregulation',
        ideology: 'INDIVIDUALISM',
        name: 'Small Business Deregulation Order',
        description: 'Strip federal red tape for businesses under 50 employees — expedited permits, waived compliance fees, simplified tax filing.',
        stat_increases: { gdp_growth: 2, credit: 3, service_output: 2, foreign_investment: 1 },
        stat_decreases: { pollution: 3, union_strength: 2, income_inequality: 2 },
    },
    individualism_capital_gains: {
        key: 'individualism_capital_gains',
        ideology: 'INDIVIDUALISM',
        name: 'Capital Gains Tax Holiday',
        description: 'Direct Treasury to defer capital gains tax collection for 12 months on domestic investments.',
        stat_increases: { foreign_investment: 3, gdp_growth: 2, credit: 2, currency_strength: 1 },
        stat_decreases: { income_inequality: 3, poverty_rate: 1, housing_affordability: 2, stability: 1 },
    },
    collectivism_jobs_program: {
        key: 'collectivism_jobs_program',
        ideology: 'COLLECTIVISM',
        name: 'Federal Jobs Program Order',
        description: 'Direct agencies to hire for infrastructure repair, conservation, and public services.',
        stat_increases: { gdp_growth: 1, physical_infrastructure: 2, social_mobility: 1 },
        stat_decreases: { unemployment: 3, poverty_rate: 2, debt_growth: 3, efficiency: 1 },
    },
    collectivism_wage_floor: {
        key: 'collectivism_wage_floor',
        ideology: 'COLLECTIVISM',
        name: 'Wage Floor for Federal Contractors',
        description: 'Mandate all federal contractors pay a living wage minimum, rippling through supply chains.',
        stat_increases: { minimum_wage: 3, standard_of_living: 2, happiness: 1 },
        stat_decreases: { poverty_rate: 2, manufacturing_output: 1, cost_of_living: 1, foreign_investment: 1, service_output: 1 },
    },

    // === Axis: Nationalism vs Globalism (Nationalism = "Buy Local") ===
    nationalism_buy_local: {
        key: 'nationalism_buy_local',
        ideology: 'NATIONALISM',
        name: 'Buy Local Procurement Order',
        description: 'All federal purchases must source domestically — steel, tech, vehicles, materials.',
        stat_increases: { manufacturing_output: 3, gdp_growth: 1, currency_strength: 1, trade_balance: 1, cost_of_living: 2, fuel_prices: 1 },
        stat_decreases: { foreign_investment: 2 },
    },
    nationalism_export_controls: {
        key: 'nationalism_export_controls',
        ideology: 'NATIONALISM',
        name: 'Export Control on Strategic Resources',
        description: 'Restrict export of rare minerals, semiconductors, and energy tech to protect domestic industry.',
        stat_increases: { rare_minerals: 2, manufacturing_output: 2, energy_generation: 1, stability: 1 },
        stat_decreases: { trade_balance: 2, foreign_investment: 2, international_reputation: 2, gdp_growth: 1 },
    },
    globalism_investment_zones: {
        key: 'globalism_investment_zones',
        ideology: 'GLOBALISM',
        name: 'Fast-Track Foreign Investment Zones',
        description: 'Designate special economic zones with streamlined visa and permit processes for foreign firms.',
        stat_increases: { foreign_investment: 4, gdp_growth: 2, immigration: 2, trade_balance: 1, income_inequality: 2, polarization: 1 },
        stat_decreases: { housing_affordability: 2, manufacturing_output: 1 },
    },
    globalism_tariff_suspension: {
        key: 'globalism_tariff_suspension',
        ideology: 'GLOBALISM',
        name: 'Tariff Suspension Order',
        description: 'Suspend tariffs on key imports for 1 year to reduce costs and boost trade volume.',
        stat_increases: { trade_balance: 2, gdp_growth: 1 },
        stat_decreases: { cost_of_living: 2, fuel_prices: 1, manufacturing_output: 2, currency_strength: 1, stability: 1 },
    },

    // === Axis: Equality vs Liberty ===
    equality_minority_lending: {
        key: 'equality_minority_lending',
        ideology: 'EQUALITY',
        name: 'Minority Business Lending Directive',
        description: 'Direct federal lending programs to prioritize underserved communities and women-owned businesses.',
        stat_increases: { social_mobility: 2, gdp_growth: 1, credit: 1, polarization: 1 },
        stat_decreases: { income_inequality: 2, poverty_rate: 1, efficiency: 1 },
    },
    equality_pay_transparency: {
        key: 'equality_pay_transparency',
        ideology: 'EQUALITY',
        name: 'Pay Transparency for Federal Workforce',
        description: 'Mandate all federal agencies and contractors publish salary bands by role to reduce wage gaps.',
        stat_increases: { happiness: 1, legitimacy: 1, social_mobility: 1, polarization: 1 },
        stat_decreases: { income_inequality: 2, foreign_investment: 1, efficiency: 1, service_output: 1 },
    },
    liberty_regulatory_moratorium: {
        key: 'liberty_regulatory_moratorium',
        ideology: 'LIBERTY',
        name: 'Regulatory Moratorium',
        description: 'Freeze all new federal regulations for 6 months — let the market breathe.',
        stat_increases: { gdp_growth: 2, credit: 2, manufacturing_output: 2, foreign_investment: 1, pollution: 2, income_inequality: 1 },
        stat_decreases: { healthcare_quality: 1 },
    },
    liberty_licensing_reform: {
        key: 'liberty_licensing_reform',
        ideology: 'LIBERTY',
        name: 'Federal Licensing Reform Order',
        description: 'Direct agencies to eliminate or reciprocate occupational licenses — let people work freely across regions.',
        stat_increases: { labor_force_participation: 2, service_output: 2, social_mobility: 2, crime_rate: 1 },
        stat_decreases: { unemployment: 2, healthcare_quality: 1, efficiency: 1, union_strength: 1 },
    },

    // === Axis: Progress vs Tradition ===
    progress_green_infrastructure: {
        key: 'progress_green_infrastructure',
        ideology: 'PROGRESS',
        name: 'Green Infrastructure Fast-Track',
        description: 'Expedite permits for solar, wind, EV charging, and battery plants on federal land.',
        stat_increases: { renewable_energy_percentage: 3, gdp_growth: 1, energy_generation: 2, cost_of_living: 1 },
        stat_decreases: { carbon_emissions: 2, fuel_prices: 1, oil_and_gas: 1 },
    },
    progress_ai_workforce: {
        key: 'progress_ai_workforce',
        ideology: 'PROGRESS',
        name: 'AI & Automation Workforce Initiative',
        description: 'Redirect federal training funds to tech reskilling, open federal data for startups.',
        stat_increases: { digital_infrastructure: 3, gdp_growth: 2, higher_education: 1, service_output: 2, unemployment: 2, income_inequality: 1 },
        stat_decreases: { manufacturing_output: 1, religiosity: 1 },
    },
    tradition_energy_unleashing: {
        key: 'tradition_energy_unleashing',
        ideology: 'TRADITION',
        name: 'Domestic Energy Unleashing Order',
        description: 'Open federal lands for oil, gas, and coal extraction — fast-track drilling permits.',
        stat_increases: { oil_and_gas: 3, manufacturing_output: 2, gdp_growth: 2, pollution: 3, carbon_emissions: 3 },
        stat_decreases: { fuel_prices: 2, renewable_energy_percentage: 1, international_reputation: 1 },
    },
    tradition_manufacturing_revival: {
        key: 'tradition_manufacturing_revival',
        ideology: 'TRADITION',
        name: 'Manufacturing Revival Order',
        description: 'Tax incentives via executive directive for companies reshoring factories — focus on heavy industry, steel, auto.',
        stat_increases: { manufacturing_output: 3, gdp_growth: 1, physical_infrastructure: 1, cost_of_living: 1, carbon_emissions: 1 },
        stat_decreases: { unemployment: 2, service_output: 1, trade_balance: 1 },
    },

    // === Axis: Security vs Freedom ===
    security_critical_infrastructure: {
        key: 'security_critical_infrastructure',
        ideology: 'SECURITY',
        name: 'Critical Infrastructure Investment Order',
        description: 'Direct defense funds toward hardening power grids, ports, and supply chains.',
        stat_increases: { physical_infrastructure: 3, stability: 2, energy_generation: 1, gdp_growth: 1, cost_of_living: 1 },
        stat_decreases: { freedom_index: 1, press_freedom: 1 },
    },
    security_anti_fraud: {
        key: 'security_anti_fraud',
        ideology: 'SECURITY',
        name: 'Anti-Fraud & Black Market Crackdown',
        description: 'Expand federal task forces targeting economic crime, counterfeiting, and tax evasion.',
        stat_increases: { legitimacy: 2, gdp_growth: 1 },
        stat_decreases: { corruption: 2, crime_rate: 1, freedom_index: 1, judicial_independence: 1 },
    },
    freedom_fintech_deregulation: {
        key: 'freedom_fintech_deregulation',
        ideology: 'FREEDOM',
        name: 'Crypto & Fintech Deregulation Order',
        description: 'Classify digital assets as commodities, remove regulatory barriers — unleash financial innovation.',
        stat_increases: { credit: 3, foreign_investment: 2, gdp_growth: 2, digital_infrastructure: 1, corruption: 1, income_inequality: 1, crime_rate: 1 },
        stat_decreases: { stability: 1 },
    },
    freedom_enterprise_zones: {
        key: 'freedom_enterprise_zones',
        ideology: 'FREEDOM',
        name: 'Permit-Free Enterprise Zones',
        description: 'Designate urban zones where federal permits, inspections, and zoning restrictions are lifted for 2 years.',
        stat_increases: { gdp_growth: 3, housing_affordability: 2, urbanization: 1, pollution: 2, crime_rate: 1 },
        stat_decreases: { unemployment: 2, healthcare_quality: 1, stability: 1 },
    },
};

// ─── Helpers ───

export function getOverreachStatus(overreachCount) {
    if (overreachCount >= 4) {
        return {
            label: 'AUTHORITARIAN DRIFT',
            color: 'var(--red)',
            className: 'drift',
            fillPct: Math.min(100, (overreachCount / EO_CONFIG.OVERREACH_WINDOW) * 100)
        };
    }
    if (overreachCount >= 2) {
        return {
            label: 'GOVERNING BY DECREE',
            color: 'var(--amber)',
            className: 'decree',
            fillPct: (overreachCount / EO_CONFIG.OVERREACH_WINDOW) * 100
        };
    }
    return {
        label: 'NORMAL',
        color: 'var(--green)',
        className: 'normal',
        fillPct: (overreachCount / EO_CONFIG.OVERREACH_WINDOW) * 100
    };
}

export function canIssueExecutiveOrder(nation, currentFaction, presidentFactionId) {
    if (!nation || !currentFaction || !presidentFactionId) return false;
    if (!isGovernmentPresidential(nation)) return false;
    return currentFaction.id === presidentFactionId;
}

function randomMinisterName(nationName = '') {
    const { firstNames, lastNames } = getNationNames(nationName);
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return { first, last };
}

/**
 * Get the executive order AP modifier from leader traits.
 * Returns a number to add to the base AP cost.
 */
async function getEOTraitAPModifier(supabase, factionId) {
    const { data: faction } = await supabase
        .from('factions')
        .select('leader_positive_traits, leader_negative_traits, last_action_tick')
        .eq('id', factionId)
        .single();
    if (!faction) return 0;
    // Pass tick=0 so quick_study/slow_to_act (first-action-per-tick traits) never fire for EOs —
    // those traits only apply to campaign actions, not executive orders.
    return getTraitAPModifier('executive_order', faction, 0);
}

async function getCurrentTick(supabase) {
    const { data: shard } = await supabase
        .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    return shard?.current_tick || 0;
}

async function insertEventLog(supabase, nationId, eventName, eventDescription, currentTick, payload) {
    try {
        await supabase.from('event_log').insert({
            nation_id: nationId,
            event_name: eventName,
            trigger_key: 'ministry_ability_used',
            description_chosen: eventDescription,
            category: 'executive_order',
            fired_at_tick: currentTick,
            effects_applied: payload || {}
        });
    } catch (e) {
        console.error('[EO] Event log insert failed:', e.message);
    }
}

async function getOverreachCount(supabase, nationId, currentTick) {
    // Fetch the overreach_reset_tick so previous president's EOs don't count
    const { data: nationRow } = await supabase
        .from('nations')
        .select('overreach_reset_tick')
        .eq('id', nationId)
        .single();
    const resetTick = nationRow?.overreach_reset_tick || 0;
    const windowStart = Math.max(currentTick - EO_CONFIG.OVERREACH_WINDOW, resetTick);

    const { count } = await supabase
        .from('executive_orders')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nationId)
        .gte('issued_tick', windowStart);
    return count || 0;
}

// ─── Executive Order: Acting Minister ───

export async function issueActingMinister(supabase, nationId, factionId, ministryKey, nationName = '') {
    const currentTick = await getCurrentTick(supabase);

    // Check max acting ministers
    const { count: actingCount } = await supabase
        .from('ministries')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nationId)
        .eq('is_acting', true)
        .eq('is_active', true);

    if ((actingCount || 0) >= EO_CONFIG.ACTING_MINISTER_MAX) {
        return { success: false, error: `Maximum ${EO_CONFIG.ACTING_MINISTER_MAX} acting ministers reached.` };
    }

    // Check target ministry is vacant (no confirmed minister)
    const { data: ministry } = await supabase
        .from('ministries')
        .select('id, minister_first_name, confirmation_status, is_acting')
        .eq('nation_id', nationId)
        .eq('ministry_key', ministryKey)
        .eq('is_active', true)
        .maybeSingle();

    if (!ministry) {
        return { success: false, error: 'Ministry not found.' };
    }
    if (ministry.minister_first_name && ministry.confirmation_status === 'confirmed' && !ministry.is_acting) {
        return { success: false, error: 'This ministry already has a confirmed minister.' };
    }

    // Deduct AP (with leader trait modifier)
    const eoMod = await getEOTraitAPModifier(supabase, factionId);
    const effectiveEOCost = Math.max(1, EO_CONFIG.ACTING_MINISTER_AP + eoMod);
    const apResult = await deductAP(supabase, factionId, effectiveEOCost);
    if (!apResult.success) return apResult;

    // Generate name
    const name = randomMinisterName(nationName);

    // Insert executive order
    const { data: order, error: orderErr } = await supabase
        .from('executive_orders')
        .insert({
            nation_id: nationId,
            faction_id: factionId,
            order_type: 'acting_minister',
            payload: { ministry_key: ministryKey, minister_name: `${name.first} ${name.last}` },
            issued_tick: currentTick,
            expires_tick: null,
            is_active: true
        })
        .select('id')
        .single();
    if (orderErr) return { success: false, error: orderErr.message };

    // Update ministry
    await supabase.from('ministries')
        .update({
            minister_first_name: name.first,
            minister_last_name: name.last,
            minister_age: 40 + Math.floor(Math.random() * 20),
            party_id: factionId,
            confirmation_status: 'acting',
            is_acting: true,
            acting_order_id: order.id,
            minister_approval: MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL
        })
        .eq('id', ministry.id);

    // Gov approval: check if a confirmation vote was held for this ministry
    // during the current administration
    const { data: currentAdmin } = await supabase
        .from('administrations')
        .select('started_at_tick')
        .eq('nation_id', nationId)
        .is('ended_at_tick', null)
        .order('started_at_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    const adminStartTick = currentAdmin?.started_at_tick ?? 0;

    const { data: priorVote } = await supabase
        .from('bills')
        .select('id, status')
        .eq('nation_id', nationId)
        .eq('bill_type', 'minister_confirmation')
        .eq('ministry_key', ministryKey)
        .gte('proposed_tick', adminStartTick)
        .in('status', ['passed', 'failed'])
        .order('proposed_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (priorVote && priorVote.status === 'failed') {
        // Confirmation vote was held and failed — appointing acting is justified
        await adjustGovernmentApprovalEvent(supabase, nationId, 1, 'executive_order:acting_minister_after_failed_vote');
    } else if (!priorVote) {
        // No confirmation vote held — bypassing parliament
        await adjustGovernmentApprovalEvent(supabase, nationId, -1, 'executive_order:acting_minister_no_vote');
    }
    // If priorVote.status === 'passed', the seat should already be filled — no penalty

    // Update overreach
    const overreach = await getOverreachCount(supabase, nationId, currentTick);
    await supabase.from('nations').update({ overreach_count: overreach }).eq('id', nationId);

    // Event
    await insertEventLog(supabase, nationId,
        'Executive Order: Acting Minister',
        `The president has appointed ${name.first} ${name.last} as acting minister, bypassing legislative confirmation.`,
        currentTick,
        { order_type: 'acting_minister', ministry_key: ministryKey }
    );

    return { success: true, newAp: apResult.newAp, ministerName: `${name.first} ${name.last}` };
}

// ─── Executive Order: Tax Adjustment ───

export async function issueTaxAdjustment(supabase, nationId, factionId, taxType, direction) {
    const validTaxTypes = ['income_tax', 'corporate_tax', 'sales_tax'];
    if (!validTaxTypes.includes(taxType)) {
        return { success: false, error: 'Invalid tax type.' };
    }
    if (direction !== 'increase' && direction !== 'decrease') {
        return { success: false, error: 'Direction must be increase or decrease.' };
    }

    const currentTick = await getCurrentTick(supabase);

    // Check cooldown
    const { data: recentOrders } = await supabase
        .from('executive_orders')
        .select('id, payload')
        .eq('nation_id', nationId)
        .eq('order_type', 'tax_adjustment')
        .gte('issued_tick', currentTick - EO_CONFIG.TAX_ADJUSTMENT_COOLDOWN);

    const sameTypePrior = (recentOrders || []).filter(o => o.payload?.tax_type === taxType);
    if (sameTypePrior.length > 0) {
        return { success: false, error: `Tax adjustment for ${taxType.replace('_', ' ')} on cooldown (${EO_CONFIG.TAX_ADJUSTMENT_COOLDOWN} ticks).` };
    }

    // Calculate AP cost: 2 + prior uses of same tax type (capped at 4)
    const { count: totalPriorUses } = await supabase
        .from('executive_orders')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nationId)
        .eq('order_type', 'tax_adjustment')
        .contains('payload', { tax_type: taxType });

    const baseApCost = Math.min(EO_CONFIG.TAX_ADJUSTMENT_BASE_AP + (totalPriorUses || 0), EO_CONFIG.TAX_ADJUSTMENT_MAX_AP);
    const eoMod = await getEOTraitAPModifier(supabase, factionId);
    const apCost = Math.max(1, baseApCost + eoMod);

    // Deduct AP
    const apResult = await deductAP(supabase, factionId, apCost);
    if (!apResult.success) return apResult;

    // Read current rate
    const { data: nation } = await supabase
        .from('nations').select(taxType).eq('id', nationId).single();
    const currentRate = Number(nation?.[taxType] ?? 20);
    const delta = direction === 'increase' ? EO_CONFIG.TAX_ADJUSTMENT_DELTA : -EO_CONFIG.TAX_ADJUSTMENT_DELTA;
    const newRate = Math.max(0, Math.min(50, currentRate + delta));

    // Insert executive order
    const { error: insertErr } = await supabase.from('executive_orders').insert({
        nation_id: nationId,
        faction_id: factionId,
        order_type: 'tax_adjustment',
        payload: { tax_type: taxType, old_rate: currentRate, new_rate: newRate, direction },
        issued_tick: currentTick,
        is_active: false  // instant effect, no ongoing state
    });
    if (insertErr) return { success: false, error: insertErr.message };

    // Apply tax change
    await supabase.from('nations').update({ [taxType]: newRate }).eq('id', nationId);

    // Approval: increase → -3, decrease → -5 (revenue loss is worse politically)
    const approvalHit = direction === 'increase' ? -3 : -5;
    await adjustGovernmentApprovalEvent(supabase, nationId, approvalHit, 'executive_order:tax_adjustment');

    // Update overreach
    const overreach = await getOverreachCount(supabase, nationId, currentTick);
    await supabase.from('nations').update({ overreach_count: overreach }).eq('id', nationId);

    const taxLabel = taxType.replace('_', ' ');
    await insertEventLog(supabase, nationId,
        `Executive Order: ${taxLabel.charAt(0).toUpperCase() + taxLabel.slice(1)} ${direction === 'increase' ? 'Increase' : 'Cut'}`,
        `The president has ordered a ${Math.abs(delta)}% ${direction} in ${taxLabel} (${currentRate}% → ${newRate}%).`,
        currentTick,
        { order_type: 'tax_adjustment', tax_type: taxType, old_rate: currentRate, new_rate: newRate }
    );

    return { success: true, newAp: apResult.newAp, oldRate: currentRate, newRate, apCost };
}

// ─── Executive Order: Price Controls ───

export async function issuePriceControls(supabase, nationId, factionId, stat) {
    const validStats = ['fuel_prices'];
    if (!validStats.includes(stat)) {
        return { success: false, error: 'Invalid stat for price controls.' };
    }

    const currentTick = await getCurrentTick(supabase);

    // Check cooldown
    const { data: recentControls } = await supabase
        .from('executive_orders')
        .select('id, payload')
        .eq('nation_id', nationId)
        .eq('order_type', 'price_controls')
        .gte('issued_tick', currentTick - EO_CONFIG.PRICE_CONTROLS_COOLDOWN - EO_CONFIG.PRICE_CONTROLS_DURATION);

    const sameStat = (recentControls || []).filter(o => o.payload?.stat === stat);
    if (sameStat.length > 0) {
        return { success: false, error: `Price controls for ${stat.replace('_', ' ')} on cooldown.` };
    }

    // Deduct AP (with leader trait modifier)
    const eoModPC = await getEOTraitAPModifier(supabase, factionId);
    const effectivePCCost = Math.max(1, EO_CONFIG.PRICE_CONTROLS_AP + eoModPC);
    const apResult = await deductAP(supabase, factionId, effectivePCCost);
    if (!apResult.success) return apResult;

    // Read current value
    const { data: nation } = await supabase
        .from('nations').select(stat).eq('id', nationId).single();
    const frozenValue = Number(nation?.[stat] ?? 50);

    // Insert executive order
    const { error: insertErr } = await supabase.from('executive_orders').insert({
        nation_id: nationId,
        faction_id: factionId,
        order_type: 'price_controls',
        payload: { stat, frozen_value: frozenValue, pressure_magnitude: 0 },
        issued_tick: currentTick,
        expires_tick: currentTick + EO_CONFIG.PRICE_CONTROLS_DURATION,
        is_active: true
    });
    if (insertErr) return { success: false, error: insertErr.message };

    // Party approval boost for populist action
    await supabase.rpc('adjust_momentum', { p_faction_id: factionId, p_delta: 2, p_label: 'Price controls ordered (+2)', p_tick: currentTick });

    // Gov approval penalty
    await adjustGovernmentApprovalEvent(supabase, nationId, -3, 'executive_order:price_controls');

    // Update overreach
    const overreach = await getOverreachCount(supabase, nationId, currentTick);
    await supabase.from('nations').update({ overreach_count: overreach }).eq('id', nationId);

    const statLabel = stat.replace('_', ' ');
    await insertEventLog(supabase, nationId,
        `Executive Order: ${statLabel.charAt(0).toUpperCase() + statLabel.slice(1)} Controls`,
        `The president has imposed price controls on ${statLabel}, freezing it at ${frozenValue.toFixed(1)} for ${EO_CONFIG.PRICE_CONTROLS_DURATION} ticks.`,
        currentTick,
        { order_type: 'price_controls', stat, frozen_value: frozenValue }
    );

    return { success: true, newAp: apResult.newAp, frozenValue };
}

// ─── Executive Order: National Emergency ───

export async function issueNationalEmergency(supabase, nationId, factionId) {
    const currentTick = await getCurrentTick(supabase);

    // Check cooldown
    const { data: nation } = await supabase
        .from('nations').select('emergency_cooldown_until, government_type').eq('id', nationId).single();

    if (nation?.emergency_cooldown_until && currentTick < nation.emergency_cooldown_until) {
        const remaining = nation.emergency_cooldown_until - currentTick;
        return { success: false, error: `Emergency cooldown: ${remaining} tick${remaining !== 1 ? 's' : ''} remaining.` };
    }

    // Check no existing active emergency
    const { data: existing } = await supabase
        .from('executive_orders')
        .select('id')
        .eq('nation_id', nationId)
        .eq('order_type', 'national_emergency')
        .eq('is_active', true)
        .maybeSingle();

    if (existing) {
        return { success: false, error: 'A national emergency is already in effect.' };
    }

    // Deduct AP (with leader trait modifier)
    const eoModNE = await getEOTraitAPModifier(supabase, factionId);
    const effectiveNECost = Math.max(1, EO_CONFIG.NATIONAL_EMERGENCY_AP + eoModNE);
    const apResult = await deductAP(supabase, factionId, effectiveNECost);
    if (!apResult.success) return apResult;

    // Insert executive order (no auto-expire)
    const { error: insertErr } = await supabase.from('executive_orders').insert({
        nation_id: nationId,
        faction_id: factionId,
        order_type: 'national_emergency',
        payload: { bills_advanced_this_emergency: 0, last_advance_tick: -1 },
        issued_tick: currentTick,
        expires_tick: null,
        is_active: true
    });
    if (insertErr) return { success: false, error: insertErr.message };

    // +8 gov approval immediately (crisis rally effect)
    await adjustGovernmentApprovalEvent(supabase, nationId, 8, 'executive_order:national_emergency');

    // +2 approval to ALL opposition factions (galvanized opposition)
    const { data: factions } = await supabase
        .from('factions').select('id').eq('nation_id', nationId).neq('id', factionId);
    for (const f of (factions || [])) {
        await supabase.rpc('adjust_momentum', { p_faction_id: f.id, p_delta: 2, p_label: 'National emergency declared (+2)', p_tick: currentTick });
    }

    // Update overreach
    const overreach = await getOverreachCount(supabase, nationId, currentTick);
    await supabase.from('nations').update({ overreach_count: overreach }).eq('id', nationId);

    const leaderTitle = isGovernmentPresidential(nation) ? 'president' : 'head of government';
    await insertEventLog(supabase, nationId,
        'National Emergency Declared',
        `The ${leaderTitle} has declared a national emergency. Emergency powers are now in effect.`,
        currentTick,
        { order_type: 'national_emergency' }
    );

    return { success: true, newAp: apResult.newAp };
}

// ─── End National Emergency (free action, 0 AP) ───

export async function endNationalEmergency(supabase, nationId, factionId) {
    const currentTick = await getCurrentTick(supabase);
    const { data: endNation } = await supabase
        .from('nations').select('government_type').eq('id', nationId).single();

    // Find active emergency by nation (not faction — any authorized party can end it)
    const { data: emergency } = await supabase
        .from('executive_orders')
        .select('id, issued_tick')
        .eq('nation_id', nationId)
        .eq('order_type', 'national_emergency')
        .eq('is_active', true)
        .maybeSingle();

    if (!emergency) {
        return { success: false, error: 'No active national emergency found.' };
    }

    // Deactivate
    await supabase.from('executive_orders')
        .update({ is_active: false })
        .eq('id', emergency.id);

    // Set cooldown (no civil unrest penalty for ending voluntarily)
    await supabase.from('nations').update({
        emergency_cooldown_until: currentTick + EO_CONFIG.EMERGENCY_COOLDOWN
    }).eq('id', nationId);

    const endLeaderTitle = isGovernmentPresidential(endNation) ? 'president' : 'head of government';
    await insertEventLog(supabase, nationId,
        'National Emergency Ended',
        `The ${endLeaderTitle} has ended the national emergency. Civil unrest has risen as a result.`,
        currentTick,
        { order_type: 'national_emergency', action: 'ended', ticks_active: currentTick - emergency.issued_tick }
    );

    return { success: true };
}

// ─── Executive Order: Censure ───

export async function issueCensure(supabase, nationId, factionId, targetFactionId) {
    if (factionId === targetFactionId) {
        return { success: false, error: 'Cannot censure your own party.' };
    }

    const currentTick = await getCurrentTick(supabase);

    // Check target exists in nation
    const { data: target } = await supabase
        .from('factions').select('id, party_name').eq('id', targetFactionId).eq('nation_id', nationId).maybeSingle();
    if (!target) {
        return { success: false, error: 'Target faction not found in this nation.' };
    }

    // Deduct AP (with leader trait modifier)
    const eoModC = await getEOTraitAPModifier(supabase, factionId);
    const effectiveCensureCost = Math.max(1, EO_CONFIG.CENSURE_AP + eoModC);
    const apResult = await deductAP(supabase, factionId, effectiveCensureCost);
    if (!apResult.success) return apResult;

    // Check for repeat censure against same target
    const { count: recentCensures } = await supabase
        .from('executive_orders')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nationId)
        .eq('order_type', 'censure')
        .contains('payload', { target_faction_id: targetFactionId })
        .gte('issued_tick', currentTick - EO_CONFIG.CENSURE_REPEAT_WINDOW);

    const isRepeat = (recentCensures || 0) > 0;
    const martyrMomentum = isRepeat ? EO_CONFIG.CENSURE_REPEAT_MOMENTUM : EO_CONFIG.CENSURE_BASE_MOMENTUM;

    // Insert executive order
    const { error: insertErr } = await supabase.from('executive_orders').insert({
        nation_id: nationId,
        faction_id: factionId,
        order_type: 'censure',
        payload: { target_faction_id: targetFactionId, is_repeat: isRepeat },
        issued_tick: currentTick,
        is_active: false  // instant effect
    });
    if (insertErr) return { success: false, error: insertErr.message };

    // Censure: -2 approval & -0.05 credibility to target
    await supabase.rpc('adjust_momentum', { p_faction_id: targetFactionId, p_delta: -2, p_label: 'Censured (-2)', p_tick: currentTick });
    await adjustCredibility(supabase, targetFactionId, nationId, -0.05, 0, currentTick, { source: 'executive_order:censure' });

    // Martyr effect: target regains some approval (bigger if repeated censure)
    const martyrApproval = Math.round(martyrMomentum * 0.3 * 100) / 100;
    await supabase.rpc('adjust_momentum', { p_faction_id: targetFactionId, p_delta: martyrApproval, p_label: `Censure martyr effect (+${martyrApproval})`, p_tick: currentTick });

    // -3 gov approval
    await adjustGovernmentApprovalEvent(supabase, nationId, -3, 'executive_order:censure');

    // Update overreach
    const overreach = await getOverreachCount(supabase, nationId, currentTick);
    await supabase.from('nations').update({ overreach_count: overreach }).eq('id', nationId);

    await insertEventLog(supabase, nationId,
        `Executive Order: Censure of ${target.party_name}`,
        `The president has censured ${target.party_name}.${isRepeat ? ' This is a repeat censure — the targeted party gains significant sympathy momentum.' : ''}`,
        currentTick,
        { order_type: 'censure', target_faction_id: targetFactionId, is_repeat: isRepeat }
    );

    return { success: true, newAp: apResult.newAp, isRepeat, targetName: target.party_name };
}

// ─── Emergency Bill Advancement ───

export async function advanceBillEmergency(supabase, nationId, factionId, billId) {
    const currentTick = await getCurrentTick(supabase);

    // Validate active emergency
    const { data: emergency } = await supabase
        .from('executive_orders')
        .select('id, payload')
        .eq('nation_id', nationId)
        .eq('order_type', 'national_emergency')
        .eq('is_active', true)
        .maybeSingle();

    if (!emergency) {
        return { success: false, error: 'No active national emergency.' };
    }

    // Check once-per-tick limit
    if (emergency.payload?.last_advance_tick === currentTick) {
        return { success: false, error: 'Emergency bill advancement already used this tick.' };
    }

    // Load nation to determine government type
    const { data: nation } = await supabase
        .from('nations')
        .select('id, government_type')
        .eq('id', nationId)
        .single();
    if (!nation) return { success: false, error: 'Nation not found.' };

    const isPresidential = isPresidentialRepublic(nation);

    // Load bill (include articles+policies for parliamentary enactment path)
    const { data: bill } = await supabase
        .from('bills')
        .select('id, status, bill_name, bill_type, nation_id, proposed_by, bill_articles(*, policies(*))')
        .eq('id', billId)
        .eq('nation_id', nationId)
        .maybeSingle();

    if (!bill) {
        return { success: false, error: 'Bill not found.' };
    }

    if (bill.status !== 'committee' && bill.status !== 'floor') {
        return { success: false, error: 'Bill must be in committee or floor stage.' };
    }

    let advancedTo = '';

    if (bill.status === 'committee') {
        // committee → floor (all government types)
        const { error: billErr } = await supabase.from('bills').update({
            status: 'floor',
            floor_tick: currentTick,
            voting_ends_tick: currentTick + GAME_CONFIG.VOTING_WINDOW_TICKS
        }).eq('id', billId);
        if (billErr) return { success: false, error: billErr.message };
        advancedTo = 'floor';

        // Calculate caucus dispositions
        try {
            const { error: caucusErr } = await supabase.rpc('calculate_caucus_dispositions', { p_bill_id: billId });
            if (caucusErr) console.warn(`[EmergencyAdvance] Caucus RPC error for ${billId} (non-fatal):`, caucusErr.message);
        } catch (e) { /* non-fatal */ }

    } else if (bill.status === 'floor' && isPresidential && bill.bill_type === 'minister_confirmation' && bill.ministry_key) {
        // Minister confirmation bills are resolved directly — they don't go to president's desk.
        // Seat the minister immediately, matching the logic in resolveExpiredVotes (bills.js).
        const mKey = bill.ministry_key;
        const { data: ministry } = await supabase.from('ministries')
            .select('id, pending_minister')
            .eq('nation_id', nationId).eq('ministry_key', mKey).eq('is_active', true)
            .maybeSingle();

        if (ministry?.pending_minister) {
            const pm = ministry.pending_minister;
            const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
            const ministryNames = {
                prime_minister: 'Prime Minister', interior: 'Ministry of the Interior',
                foreign: 'Foreign Ministry', defense: 'Ministry of Defense',
                finance: 'Ministry of Finance', education: 'Ministry of Education',
                healthcare: 'Ministry of Healthcare', labor: 'Ministry of Labor',
                justice: 'Ministry of Justice', trade: 'Ministry of Trade',
                energy: 'Ministry of Energy', transportation: 'Ministry of Transportation',
                security: 'Ministry of Security'
            };
            const { error: minErr } = await supabase.from('ministries').update({
                party_id: pm.party_id,
                minister_first_name: pm.first_name,
                minister_last_name: pm.last_name,
                minister_age: pm.age,
                minister_approval: MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL,
                ministry_name: ministryNames[mKey] || mKey,
                confirmation_status: 'confirmed',
                pending_minister: null,
                stat_baselines: fullNation ? buildMinistryBaselines(mKey, fullNation) : {}
            }).eq('id', ministry.id);
            if (minErr) return { success: false, error: 'Failed to seat minister: ' + minErr.message };
        }

        const { error: billErr } = await supabase.from('bills').update({
            status: 'passed', passed_tick: currentTick
        }).eq('id', billId);
        if (billErr) return { success: false, error: billErr.message };
        advancedTo = 'passed';

    } else if (bill.status === 'floor' && isPresidential) {
        // floor → president's desk (presidential systems)
        const { error: billErr } = await supabase.from('bills').update({
            status: 'president_desk',
            passed_tick: currentTick,
            president_desk_deadline: currentTick + GAME_CONFIG.PRESIDENT_DESK_TICKS
        }).eq('id', billId);
        if (billErr) return { success: false, error: billErr.message };
        advancedTo = 'president_desk';

    } else if (bill.status === 'floor' && bill.bill_type === 'default_resolution') {
        // Default resolutions require server-side enactSovereignDefault (cross-nation contagion).
        // Cannot be emergency-enacted client-side — must go through normal tick resolution.
        return { success: false, error: 'Sovereign default resolutions cannot be fast-tracked past floor. They must complete the normal voting process.' };

    } else if (bill.status === 'floor') {
        // floor → enacted (parliamentary systems — no president's desk)
        const enactment = await enactBill(supabase, bill, currentTick);
        if (!enactment?.success) {
            return { success: false, error: enactment?.error || 'Enactment failed.' };
        }
        advancedTo = 'enacted';
    }

    // Update emergency payload
    const newPayload = {
        ...emergency.payload,
        bills_advanced_this_emergency: (emergency.payload.bills_advanced_this_emergency || 0) + 1,
        last_advance_tick: currentTick
    };
    const { error: payloadErr } = await supabase.from('executive_orders')
        .update({ payload: newPayload })
        .eq('id', emergency.id);
    if (payloadErr) console.error(`[EmergencyAdvance] Failed to update emergency payload:`, payloadErr.message);

    // -6 gov approval (forcing bills is politically costly)
    await adjustGovernmentApprovalEvent(supabase, nationId, EO_CONFIG.EMERGENCY_ADVANCE_APPROVAL_COST, 'executive_order:emergency_bill_advance');

    await insertEventLog(supabase, nationId,
        'Emergency Bill Advancement',
        `Under emergency powers, "${bill.bill_name}" has been advanced to ${advancedTo.replace('_', ' ')} without standard procedure.`,
        currentTick,
        { order_type: 'emergency_bill_advance', bill_id: billId, advanced_to: advancedTo }
    );

    return { success: true, advancedTo, billName: bill.bill_name };
}

// ─── Executive Order: Stimulate the Economy ───

/**
 * Get the tick when the current presidential term started.
 * Uses the administrations table — the open administration's started_at_tick.
 */
async function getTermStartTick(supabase, nationId) {
    const { data: admin } = await supabase
        .from('administrations')
        .select('started_at_tick')
        .eq('nation_id', nationId)
        .is('ended_at_tick', null)
        .order('started_at_tick', { ascending: false })
        .limit(1)
        .maybeSingle();
    return admin?.started_at_tick ?? 0;
}

/**
 * Check which stimulate_economy orders have already been used this term.
 */
export async function getUsedStimulusOrders(supabase, nationId) {
    const termStart = await getTermStartTick(supabase, nationId);
    const { data: orders } = await supabase
        .from('executive_orders')
        .select('payload')
        .eq('nation_id', nationId)
        .eq('order_type', 'stimulate_economy')
        .gte('issued_tick', termStart);
    return (orders || []).map(o => o.payload?.stimulus_key).filter(Boolean);
}

/**
 * Issue a Stimulate the Economy executive order.
 * @param {string} stimulusKey - Key from STIMULATE_ECONOMY_ORDERS (e.g. 'individualism_deregulation')
 */
export async function issueStimulusOrder(supabase, nationId, factionId, stimulusKey) {
    const orderDef = STIMULATE_ECONOMY_ORDERS[stimulusKey];
    if (!orderDef) {
        return { success: false, error: 'Invalid stimulus order key.' };
    }

    const currentTick = await getCurrentTick(supabase);

    // Check once-per-term: has this specific order been used this term?
    const usedKeys = await getUsedStimulusOrders(supabase, nationId);
    if (usedKeys.includes(stimulusKey)) {
        return { success: false, error: `"${orderDef.name}" has already been used this term.` };
    }

    // Deduct AP (with leader trait modifier)
    const eoMod = await getEOTraitAPModifier(supabase, factionId);
    const apCost = Math.max(1, EO_CONFIG.STIMULATE_ECONOMY_AP + eoMod);
    const apResult = await deductAP(supabase, factionId, apCost);
    if (!apResult.success) return apResult;

    // Apply stat changes to nation
    const { data: nation } = await supabase
        .from('nations')
        .select('*')
        .eq('id', nationId)
        .single();

    if (!nation) return { success: false, error: 'Nation not found.' };

    const statUpdates = {};
    const effectsSummary = { increases: {}, decreases: {} };

    // Apply increases
    for (const [stat, magnitude] of Object.entries(orderDef.stat_increases)) {
        const current = Number(nation[stat] ?? 50);
        const newVal = Math.min(100, current + magnitude);
        statUpdates[stat] = newVal;
        effectsSummary.increases[stat] = magnitude;
    }

    // Apply decreases — note: for "lower is better" stats like unemployment, poverty_rate,
    // a decrease in the stat value is actually good. The order definitions already account
    // for this: stat_decreases means the stat value goes DOWN.
    for (const [stat, magnitude] of Object.entries(orderDef.stat_decreases)) {
        const current = Number(nation[stat] ?? 50);
        const newVal = Math.max(0, current - magnitude);
        statUpdates[stat] = newVal;
        effectsSummary.decreases[stat] = magnitude;
    }

    // Write stat updates
    if (Object.keys(statUpdates).length > 0) {
        await supabase.from('nations').update(statUpdates).eq('id', nationId);
    }

    // Insert executive order record
    const { error: insertErr } = await supabase.from('executive_orders').insert({
        nation_id: nationId,
        faction_id: factionId,
        order_type: 'stimulate_economy',
        payload: {
            stimulus_key: stimulusKey,
            ideology: orderDef.ideology,
            name: orderDef.name,
            effects: effectsSummary
        },
        issued_tick: currentTick,
        is_active: false  // instant effect, no ongoing state
    });
    if (insertErr) return { success: false, error: insertErr.message };

    // Update overreach
    const overreach = await getOverreachCount(supabase, nationId, currentTick);
    await supabase.from('nations').update({ overreach_count: overreach }).eq('id', nationId);

    // Event log
    const statUpList = Object.entries(orderDef.stat_increases).map(([s, m]) => `${s.replace(/_/g, ' ')} +${m}`).join(', ');
    const statDownList = Object.entries(orderDef.stat_decreases).map(([s, m]) => `${s.replace(/_/g, ' ')} -${m}`).join(', ');
    await insertEventLog(supabase, nationId,
        `Executive Order: ${orderDef.name}`,
        `The president has signed "${orderDef.name}" to stimulate the economy. Effects: ${statUpList}. Tradeoffs: ${statDownList}.`,
        currentTick,
        { order_type: 'stimulate_economy', stimulus_key: stimulusKey, ideology: orderDef.ideology, effects: effectsSummary }
    );

    return {
        success: true,
        newAp: apResult.newAp,
        orderName: orderDef.name,
        ideology: orderDef.ideology,
        effects: effectsSummary
    };
}

// ─── Fetch Active Orders (for UI) ───

export async function fetchActiveOrders(supabase, nationId) {
    const currentTick = await getCurrentTick(supabase);

    // Fetch overreach_reset_tick so previous president's EOs don't count toward overreach
    const { data: nationRow } = await supabase
        .from('nations')
        .select('overreach_reset_tick')
        .eq('id', nationId)
        .single();
    const resetTick = nationRow?.overreach_reset_tick || 0;
    const windowStart = Math.max(currentTick - EO_CONFIG.OVERREACH_WINDOW, resetTick);

    const { data: orders } = await supabase
        .from('executive_orders')
        .select('*')
        .eq('nation_id', nationId)
        .order('issued_tick', { ascending: false })
        .limit(20);

    const activeOrders = (orders || []).filter(o => o.is_active);
    const recentOrders = (orders || []).filter(o =>
        o.issued_tick >= windowStart
    );

    return {
        all: orders || [],
        active: activeOrders,
        recent: recentOrders,
        overreachCount: recentOrders.length,
        hasActiveEmergency: activeOrders.some(o => o.order_type === 'national_emergency'),
        activeEmergency: activeOrders.find(o => o.order_type === 'national_emergency') || null,
        actingMinisterCount: activeOrders.filter(o => o.order_type === 'acting_minister').length,
        activePriceControls: activeOrders.filter(o => o.order_type === 'price_controls'),
        currentTick
    };
}

// ─── Check Order Availability (for UI modal) ───

export async function checkOrderAvailability(supabase, nationId, factionId, currentAP) {
    const currentTick = await getCurrentTick(supabase);

    const { data: orders } = await supabase
        .from('executive_orders')
        .select('id, order_type, payload, issued_tick, is_active')
        .eq('nation_id', nationId)
        .order('issued_tick', { ascending: false })
        .limit(50);

    const activeOrders = (orders || []).filter(o => o.is_active);

    // Acting Minister
    const actingCount = activeOrders.filter(o => o.order_type === 'acting_minister').length;
    const actingAvailable = actingCount < EO_CONFIG.ACTING_MINISTER_MAX && currentAP >= EO_CONFIG.ACTING_MINISTER_AP;
    const actingReason = actingCount >= EO_CONFIG.ACTING_MINISTER_MAX
        ? `Max ${EO_CONFIG.ACTING_MINISTER_MAX} acting ministers`
        : currentAP < EO_CONFIG.ACTING_MINISTER_AP ? 'Insufficient AP' : '';

    // Tax Adjustment: check cooldowns per type
    const taxCooldowns = {};
    for (const tt of ['income_tax', 'corporate_tax', 'sales_tax']) {
        const recent = (orders || []).filter(o =>
            o.order_type === 'tax_adjustment' &&
            o.payload?.tax_type === tt &&
            o.issued_tick > currentTick - EO_CONFIG.TAX_ADJUSTMENT_COOLDOWN
        );
        taxCooldowns[tt] = recent.length > 0;
    }
    const allTaxesCooling = Object.values(taxCooldowns).every(v => v);
    const taxAvailable = !allTaxesCooling && currentAP >= EO_CONFIG.TAX_ADJUSTMENT_BASE_AP;
    const taxReason = allTaxesCooling ? 'All tax types on cooldown'
        : currentAP < EO_CONFIG.TAX_ADJUSTMENT_BASE_AP ? 'Insufficient AP' : '';

    // Price Controls
    const activePC = activeOrders.filter(o => o.order_type === 'price_controls');
    const pcCooldowns = {};
    for (const s of ['fuel_prices']) {
        const recent = (orders || []).filter(o =>
            o.order_type === 'price_controls' &&
            o.payload?.stat === s &&
            o.issued_tick > currentTick - EO_CONFIG.PRICE_CONTROLS_COOLDOWN - EO_CONFIG.PRICE_CONTROLS_DURATION
        );
        pcCooldowns[s] = recent.length > 0;
    }
    const allPCCooling = Object.values(pcCooldowns).every(v => v);
    const pcAvailable = !allPCCooling && currentAP >= EO_CONFIG.PRICE_CONTROLS_AP;
    const pcReason = allPCCooling ? 'All price control targets on cooldown'
        : currentAP < EO_CONFIG.PRICE_CONTROLS_AP ? 'Insufficient AP' : '';

    // National Emergency
    const { data: nation } = await supabase
        .from('nations').select('emergency_cooldown_until').eq('id', nationId).single();
    const hasActiveEmergency = activeOrders.some(o => o.order_type === 'national_emergency');
    const onEmergencyCooldown = nation?.emergency_cooldown_until && currentTick < nation.emergency_cooldown_until;
    const emergencyAvailable = !hasActiveEmergency && !onEmergencyCooldown && currentAP >= EO_CONFIG.NATIONAL_EMERGENCY_AP;
    const emergencyReason = hasActiveEmergency ? 'Emergency already active'
        : onEmergencyCooldown ? `Cooldown: ${nation.emergency_cooldown_until - currentTick} ticks`
        : currentAP < EO_CONFIG.NATIONAL_EMERGENCY_AP ? 'Insufficient AP' : '';

    // Censure
    const censureAvailable = currentAP >= EO_CONFIG.CENSURE_AP;
    const censureReason = currentAP < EO_CONFIG.CENSURE_AP ? 'Insufficient AP' : '';

    // Stimulate Economy: check which orders are still available this term
    const usedStimulusKeys = await getUsedStimulusOrders(supabase, nationId);
    const stimulusAvailableOrders = {};
    for (const [key, def] of Object.entries(STIMULATE_ECONOMY_ORDERS)) {
        const used = usedStimulusKeys.includes(key);
        stimulusAvailableOrders[key] = {
            ...def,
            available: !used && currentAP >= EO_CONFIG.STIMULATE_ECONOMY_AP,
            reason: used ? 'Already used this term'
                : currentAP < EO_CONFIG.STIMULATE_ECONOMY_AP ? 'Insufficient AP' : '',
            used
        };
    }
    const anyStimulusAvailable = Object.values(stimulusAvailableOrders).some(o => o.available);

    return {
        acting_minister: { available: actingAvailable, reason: actingReason, apCost: EO_CONFIG.ACTING_MINISTER_AP, currentCount: actingCount },
        tax_adjustment: { available: taxAvailable, reason: taxReason, apCost: EO_CONFIG.TAX_ADJUSTMENT_BASE_AP, cooldowns: taxCooldowns },
        price_controls: { available: pcAvailable, reason: pcReason, apCost: EO_CONFIG.PRICE_CONTROLS_AP, cooldowns: pcCooldowns, activeControls: activePC },
        national_emergency: { available: emergencyAvailable, reason: emergencyReason, apCost: EO_CONFIG.NATIONAL_EMERGENCY_AP, hasActive: hasActiveEmergency, cooldownUntil: nation?.emergency_cooldown_until },
        censure: { available: censureAvailable, reason: censureReason, apCost: EO_CONFIG.CENSURE_AP },
        stimulate_economy: { available: anyStimulusAvailable, apCost: EO_CONFIG.STIMULATE_ECONOMY_AP, orders: stimulusAvailableOrders, usedThisTerm: usedStimulusKeys },
        currentTick,
        taxCooldowns,
        pcCooldowns
    };
}
