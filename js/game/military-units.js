// Army units lifecycle — Phase 1.
//
// A unit created via the create_unit RPC starts 'Forming' with
// forming_until_tick = created_tick + 2. This global per-tick sweep
// flips it to 'Active' once that window elapses. Single set-based
// UPDATE — idempotent (re-running finds no eligible rows) and
// non-fatal (logs + returns 0 on error).

// Per-unit per-tick maintenance: 25% of construction_cost (stored on
// the /1e6 scale), floored, with a hard $1/tick minimum. SINGLE SOURCE
// OF TRUTH — budget.js (the nation expenditure sum) and the Order of
// Battle "(-$X)" readout both import this, so the per-unit figure can
// never drift from the budget total.
export function unitUpkeepPerTick(constructionCost) {
    const cc = Number(constructionCost) || 0;
    return Math.max(1, Math.floor(cc / 1_000_000 * 0.25));
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
