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
        await supabase.from('energy_oil_build_cycles')
            .update({ ticks_remaining: c.ticks_remaining })
            .eq('id', c.id);
    }

    // Deactivate completed cycles
    if (completedIds.length > 0) {
        await supabase.from('energy_oil_build_cycles')
            .update({ is_active: false, ticks_remaining: 0 })
            .in('id', completedIds);
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
