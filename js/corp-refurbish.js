// Shared refurbish logic — single source of truth for cost formula and
// DB side effects. Imported by corp-dashboard.html + corp-dashboard-home2.html.
//
// Flow: client calls startRefurbish() → writes refurbish_until_tick +
// refurbish_condition + deducts cash. Server tick processor
// (advance-corp-tick/index.ts:processPropertyEffects) completes the
// refurbish and increments refurbish_count at refurbish_until_tick.

// Base cost = 10% of purchase_price × inflation. Growth factor = 1.25^count
// (uncapped). First refurbish = 1×, second = 1.25×, third = 1.5625×, etc.
export function computeRefurbishCost(prop, inflMod) {
    var purchasePrice = Number(prop?.purchase_price) || 0;
    var count = Number(prop?.refurbish_count) || 0;
    var base = purchasePrice * 0.10 * (Number(inflMod) || 1);
    return Math.round(base * Math.pow(1.25, count));
}

// Kicks off a time-based refurbish. Duration = 1d6 + 3 (4–9 ticks). Target
// condition = 1d4 + 94 (95–98%). Returns { ok, cost?, duration?, targetCondition?, newCash?, error? }.
// Caller is responsible for updating local faction.corp_cash_reserves from newCash
// and re-rendering the property panel.
export async function startRefurbish(supabase, factionId, cashReserves, prop, currentTick, inflMod) {
    if (!factionId || !prop?.id) return { ok: false, error: 'Missing faction or property.' };
    if (Number(prop.condition) >= 95) return { ok: false, error: 'Property already at excellent condition.' };

    var cost = computeRefurbishCost(prop, inflMod);
    var cash = Number(cashReserves) || 0;
    if (cash < cost) return { ok: false, error: 'Insufficient cash.', cost: cost };

    var duration = 4 + Math.floor(Math.random() * 6);
    var targetCondition = 95 + Math.floor(Math.random() * 4);
    var untilTick = Number(currentTick || 0) + duration;

    var { error: cashErr } = await supabase.from('factions').update({
        corp_cash_reserves: Math.max(0, cash - cost),
    }).eq('id', factionId);
    if (cashErr) return { ok: false, error: 'Cash deduct failed: ' + cashErr.message };

    var { error: propErr } = await supabase.from('corp_properties').update({
        refurbish_until_tick: untilTick,
        refurbish_condition: targetCondition,
    }).eq('id', prop.id);
    if (propErr) {
        // Roll back the cash deduction so the player isn't charged for a failed start.
        await supabase.from('factions').update({ corp_cash_reserves: cash }).eq('id', factionId);
        return { ok: false, error: 'Start refurbish failed: ' + propErr.message };
    }

    return { ok: true, cost: cost, duration: duration, targetCondition: targetCondition, newCash: Math.max(0, cash - cost) };
}
