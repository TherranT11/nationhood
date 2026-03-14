/**
 * executive-orders.js — Executive Order system for presidential governments
 *
 * Provides 5 executive orders the president's party can issue:
 *   1. Acting Minister — bypass senate confirmation (max 3)
 *   2. Tax Adjustment — adjust income/corporate/sales tax ±3%
 *   3. Price Controls — freeze fuel_prices or food_security for 3 ticks
 *   4. National Emergency — emergency powers (indefinite until manually ended)
 *   5. Censure — censure a rival faction
 *
 * Overreach: orders issued in the last 8 ticks are counted. 2+ = decree penalty,
 * 4+ = authoritarian drift penalty (applied by tick processor).
 */

import { GAME_CONFIG, deductAP } from './config.js';
import { isGovernmentPresidential } from './government-types.js';
import { adjustMomentumAll, adjustGovernmentApprovalEvent } from './momentum.js';
import { PM_FIRST_NAMES, PM_LAST_NAMES, getNationNames } from './political-actions.js';

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
};

// ─── Helpers ───

export function getOverreachStatus(overreachCount) {
    if (overreachCount >= 4) {
        return {
            label: 'AUTHORITARIAN DRIFT',
            color: 'var(--red)',
            className: 'drift',
            fillPct: Math.min(100, (overreachCount / 5) * 100)
        };
    }
    if (overreachCount >= 2) {
        return {
            label: 'GOVERNING BY DECREE',
            color: 'var(--amber)',
            className: 'decree',
            fillPct: (overreachCount / 5) * 100
        };
    }
    return {
        label: 'NORMAL',
        color: 'var(--green)',
        className: 'normal',
        fillPct: (overreachCount / 5) * 100
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
            event_description: eventDescription,
            fired_at_tick: currentTick,
            effects_applied: payload || {}
        });
    } catch (e) {
        console.error('[EO] Event log insert failed:', e.message);
    }
}

async function getOverreachCount(supabase, nationId, currentTick) {
    const { count } = await supabase
        .from('executive_orders')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nationId)
        .gte('issued_tick', currentTick - EO_CONFIG.OVERREACH_WINDOW);
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

    // Deduct AP
    const apResult = await deductAP(supabase, factionId, EO_CONFIG.ACTING_MINISTER_AP);
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
            minister_approval: 50
        })
        .eq('id', ministry.id);

    // Gov approval penalty
    await adjustGovernmentApprovalEvent(supabase, nationId, -4, 'executive_order:acting_minister');

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

    const apCost = Math.min(EO_CONFIG.TAX_ADJUSTMENT_BASE_AP + (totalPriorUses || 0), EO_CONFIG.TAX_ADJUSTMENT_MAX_AP);

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
    const validStats = ['fuel_prices', 'food_security'];
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

    // Deduct AP
    const apResult = await deductAP(supabase, factionId, EO_CONFIG.PRICE_CONTROLS_AP);
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

    // Bloc approval effects
    await adjustMomentumAll(supabase, nationId, factionId, 6, 'executive_order:price_controls');

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
        .from('nations').select('emergency_cooldown_until').eq('id', nationId).single();

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

    // Deduct AP
    const apResult = await deductAP(supabase, factionId, EO_CONFIG.NATIONAL_EMERGENCY_AP);
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

    // +6 momentum to ALL opposition factions (galvanized opposition)
    const { data: factions } = await supabase
        .from('factions').select('id').eq('nation_id', nationId).neq('id', factionId);
    for (const f of (factions || [])) {
        await adjustMomentumAll(supabase, nationId, f.id, 6, 'executive_order:emergency_opposition');
    }

    // Update overreach
    const overreach = await getOverreachCount(supabase, nationId, currentTick);
    await supabase.from('nations').update({ overreach_count: overreach }).eq('id', nationId);

    await insertEventLog(supabase, nationId,
        'Executive Order: National Emergency',
        'The president has declared a national emergency. Emergency powers are now in effect.',
        currentTick,
        { order_type: 'national_emergency' }
    );

    return { success: true, newAp: apResult.newAp };
}

// ─── End National Emergency (free action, 0 AP) ───

export async function endNationalEmergency(supabase, nationId, factionId) {
    const currentTick = await getCurrentTick(supabase);

    const { data: emergency } = await supabase
        .from('executive_orders')
        .select('id, issued_tick')
        .eq('nation_id', nationId)
        .eq('order_type', 'national_emergency')
        .eq('faction_id', factionId)
        .eq('is_active', true)
        .maybeSingle();

    if (!emergency) {
        return { success: false, error: 'No active national emergency found.' };
    }

    // Deactivate
    await supabase.from('executive_orders')
        .update({ is_active: false })
        .eq('id', emergency.id);

    // +8 civil_unrest shock
    const { data: nation } = await supabase
        .from('nations').select('civil_unrest').eq('id', nationId).single();
    const currentUnrest = Number(nation?.civil_unrest ?? 20);
    await supabase.from('nations').update({
        civil_unrest: Math.min(100, currentUnrest + 8),
        emergency_cooldown_until: currentTick + EO_CONFIG.EMERGENCY_COOLDOWN
    }).eq('id', nationId);

    await insertEventLog(supabase, nationId,
        'National Emergency Ended',
        'The president has ended the national emergency. Civil unrest has risen as a result.',
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

    // Deduct AP
    const apResult = await deductAP(supabase, factionId, EO_CONFIG.CENSURE_AP);
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

    // -4 momentum to target across all blocs
    await adjustMomentumAll(supabase, nationId, targetFactionId, -4, 'executive_order:censure');

    // Martyr effect: target gains momentum (bigger if repeat)
    await adjustMomentumAll(supabase, nationId, targetFactionId, martyrMomentum, 'executive_order:censure_martyr');

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
        .eq('faction_id', factionId)
        .eq('is_active', true)
        .maybeSingle();

    if (!emergency) {
        return { success: false, error: 'No active national emergency.' };
    }

    // Check once-per-tick limit
    if (emergency.payload?.last_advance_tick === currentTick) {
        return { success: false, error: 'Emergency bill advancement already used this tick.' };
    }

    // Load bill
    const { data: bill } = await supabase
        .from('bills')
        .select('id, status, bill_name, nation_id, proposed_by')
        .eq('id', billId)
        .eq('nation_id', nationId)
        .maybeSingle();

    if (!bill) {
        return { success: false, error: 'Bill not found.' };
    }

    if (bill.status !== 'committee' && bill.status !== 'floor') {
        return { success: false, error: 'Bill must be in committee or floor stage.' };
    }

    let updateFields = {};
    let advancedTo = '';

    if (bill.status === 'committee') {
        // committee → floor
        updateFields = {
            status: 'floor',
            floor_tick: currentTick,
            voting_ends_tick: currentTick + GAME_CONFIG.VOTING_WINDOW_TICKS
        };
        advancedTo = 'floor';
    } else if (bill.status === 'floor') {
        // floor → president_desk (in presidential systems, bills go to president desk)
        updateFields = {
            status: 'president_desk',
            passed_tick: currentTick,
            president_desk_deadline: currentTick + GAME_CONFIG.PRESIDENT_DESK_TICKS
        };
        advancedTo = 'president_desk';
    }

    const { error: billErr } = await supabase.from('bills').update(updateFields).eq('id', billId);
    if (billErr) return { success: false, error: billErr.message };

    // Update emergency payload
    const newPayload = {
        ...emergency.payload,
        bills_advanced_this_emergency: (emergency.payload.bills_advanced_this_emergency || 0) + 1,
        last_advance_tick: currentTick
    };
    await supabase.from('executive_orders')
        .update({ payload: newPayload })
        .eq('id', emergency.id);

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

// ─── Fetch Active Orders (for UI) ───

export async function fetchActiveOrders(supabase, nationId) {
    const currentTick = await getCurrentTick(supabase);

    const { data: orders } = await supabase
        .from('executive_orders')
        .select('*')
        .eq('nation_id', nationId)
        .order('issued_tick', { ascending: false })
        .limit(20);

    const activeOrders = (orders || []).filter(o => o.is_active);
    const recentOrders = (orders || []).filter(o =>
        o.issued_tick >= currentTick - EO_CONFIG.OVERREACH_WINDOW
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
    for (const s of ['fuel_prices', 'food_security']) {
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

    return {
        acting_minister: { available: actingAvailable, reason: actingReason, apCost: EO_CONFIG.ACTING_MINISTER_AP, currentCount: actingCount },
        tax_adjustment: { available: taxAvailable, reason: taxReason, apCost: EO_CONFIG.TAX_ADJUSTMENT_BASE_AP, cooldowns: taxCooldowns },
        price_controls: { available: pcAvailable, reason: pcReason, apCost: EO_CONFIG.PRICE_CONTROLS_AP, cooldowns: pcCooldowns, activeControls: activePC },
        national_emergency: { available: emergencyAvailable, reason: emergencyReason, apCost: EO_CONFIG.NATIONAL_EMERGENCY_AP, hasActive: hasActiveEmergency, cooldownUntil: nation?.emergency_cooldown_until },
        censure: { available: censureAvailable, reason: censureReason, apCost: EO_CONFIG.CENSURE_AP },
        currentTick,
        taxCooldowns,
        pcCooldowns
    };
}
