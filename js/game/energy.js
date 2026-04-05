/**
 * energy.js — Strategic Oil Reserve tick processing
 *
 * Processes active oil build cycles each tick:
 *   - Accumulates reserve based on (oil_and_gas + manufacturing_output) / 2
 *   - Applies per-tick stat effects: fuel_prices +0.1, energy_generation -0.1 per active cycle
 *   - Decrements ticks_remaining, deactivates completed cycles
 *   - Respects reserve cap (population * 20 Mb)
 */

export async function processEnergyOilBuildCycles(supabase, nation, currentTick) {
    // Fetch active build cycles for this nation
    const { data: cycles, error } = await supabase
        .from('energy_oil_build_cycles')
        .select('id, ticks_remaining, rate_per_tick')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    if (error || !cycles || cycles.length === 0) return { processed: 0 };

    const pop = Number(nation.population || 20000000);
    const reserveCap = Math.round((pop / 1000000) * 20);
    let currentReserve = Number(nation.strategic_oil_reserve_mb || 0);
    const activeCycleCount = cycles.length;

    const completedIds = [];
    const updatedCycles = [];

    for (const cycle of cycles) {
        const newTicksRemaining = cycle.ticks_remaining - 1;

        // Accumulate reserve (capped)
        const canAdd = Math.min(cycle.rate_per_tick, Math.max(0, reserveCap - currentReserve));
        currentReserve += canAdd;

        if (newTicksRemaining <= 0) {
            completedIds.push(cycle.id);
        } else {
            updatedCycles.push({ id: cycle.id, ticks_remaining: newTicksRemaining });
        }
    }

    // Apply stacking stat effects: +0.1 fuel_prices, -0.1 energy_generation per active cycle
    const fuelPricesDelta = 0.1 * activeCycleCount;
    const energyGenDelta = -0.1 * activeCycleCount;

    const currentFuelPrices = Number(nation.fuel_prices ?? 50);
    const currentEnergyGen = Number(nation.energy_generation ?? 50);

    const newFuelPrices = Math.round(Math.max(2, Math.min(98, currentFuelPrices + fuelPricesDelta)) * 10) / 10;
    const newEnergyGen = Math.round(Math.max(2, Math.min(98, currentEnergyGen + energyGenDelta)) * 10) / 10;

    // Update nation: reserve + stat effects
    const { error: nationErr } = await supabase.from('nations').update({
        strategic_oil_reserve_mb: currentReserve,
        fuel_prices: newFuelPrices,
        energy_generation: newEnergyGen
    }).eq('id', nation.id);

    if (nationErr) {
        console.error(`[Energy] Failed to update nation ${nation.name}:`, nationErr.message);
        return { processed: 0, error: nationErr.message };
    }

    // Update cycle ticks_remaining
    for (const c of updatedCycles) {
        const { error: tickErr } = await supabase.from('energy_oil_build_cycles')
            .update({ ticks_remaining: c.ticks_remaining })
            .eq('id', c.id);
        if (tickErr) console.error(`[Energy] Failed to update cycle ${c.id}:`, tickErr.message);
    }

    // Deactivate completed cycles
    if (completedIds.length > 0) {
        const { error: deactErr } = await supabase.from('energy_oil_build_cycles')
            .update({ is_active: false, ticks_remaining: 0 })
            .in('id', completedIds);
        if (deactErr) {
            console.error('[Energy] Failed to deactivate completed cycles:', deactErr.message);
        }

        // Fire completion event for each finished cycle
        for (const id of completedIds) {
            const { error: evtErr } = await supabase.rpc('fire_system_event', {
                p_nation_id: nation.id,
                p_trigger_key: 'energy_build_oil_reserves_complete',
                p_tick: currentTick,
                p_placeholders: { cycle_id: id, reserve_mb: currentReserve, reserve_cap_mb: reserveCap }
            });
            if (evtErr) console.error('[Energy] fire_system_event error:', evtErr.message);
        }
    }

    // Fire near-cap warning if reserve >= 90% of cap
    if (reserveCap > 0 && currentReserve >= reserveCap * 0.9 && currentReserve < reserveCap) {
        const { error: nearCapErr } = await supabase.rpc('fire_system_event', {
            p_nation_id: nation.id,
            p_trigger_key: 'energy_build_oil_reserves_near_cap',
            p_tick: currentTick,
            p_placeholders: { reserve_mb: currentReserve, reserve_cap_mb: reserveCap, pct: Math.round((currentReserve / reserveCap) * 100) }
        });
        if (nearCapErr) console.error('[Energy] fire_system_event near-cap error:', nearCapErr.message);
    }

    // Cleanup: delete inactive cycles older than 100 ticks (preserves recent ones for use-count decay)
    const cutoffTick = currentTick - 100;
    if (cutoffTick > 0) {
        const { error: cleanupErr } = await supabase
            .from('energy_oil_build_cycles')
            .delete()
            .eq('nation_id', nation.id)
            .eq('is_active', false)
            .lt('activated_on_tick', cutoffTick);
        if (cleanupErr) console.error('[Energy] Cycle cleanup error:', cleanupErr.message);
    }

    return {
        processed: cycles.length,
        completed: completedIds.length,
        reserve: currentReserve,
        reserveCap,
        fuelPricesDelta,
        energyGenDelta
    };
}
