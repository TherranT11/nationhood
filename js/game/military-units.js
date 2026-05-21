// Army units lifecycle — Phase 1.
//
// A unit created via the create_unit RPC starts 'Forming' with
// forming_until_tick = created_tick + 2. This global per-tick sweep
// flips it to 'Active' once that window elapses. Single set-based
// UPDATE — idempotent (re-running finds no eligible rows) and
// non-fatal (logs + returns 0 on error).

// Army-type upkeep modifier (per unit, per tick). Guard formations
// cost +$1, paramilitaries −$1; regular/unassigned units are unchanged.
// Single source — create_army's army_type drives this everywhere.
export function armyUpkeepModifier(armyType) {
    if (armyType === 'guard') return 1;
    if (armyType === 'paramilitary') return -1;
    return 0;
}

// Per-unit per-tick maintenance: 25% of construction_cost (stored on
// the /1e6 scale), floored, with a hard $1/tick minimum, then the
// army-type modifier (re-floored at $1). SINGLE SOURCE OF TRUTH —
// budget.js (the nation expenditure sum), government.html, advance-tick
// and the Order of Battle "(-$X)" readout all import this, so the
// per-unit figure can never drift from the budget total. armyType is
// optional: undefined/null = no modifier (regular / unassigned units).
export function unitUpkeepPerTick(constructionCost, armyType) {
    const cc = Number(constructionCost) || 0;
    const base = Math.max(1, Math.floor(cc / 1_000_000 * 0.25));
    return Math.max(1, base + armyUpkeepModifier(armyType));
}

export async function processFormingUnits(supabase, currentTick) {
    const { data, error } = await supabase
        .from('army_units')
        .update({ status: 'Active' })
        .eq('status', 'Forming')
        .lte('forming_until_tick', currentTick)
        .select('id');
    if (error) {
        console.error('[processFormingUnits] activation update failed:', error.message);
        return { activated: 0 };
    }
    return { activated: (data || []).length };
}
