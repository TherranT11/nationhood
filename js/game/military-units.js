// Army units lifecycle — Phase 1.
//
// A unit created via the create_unit RPC starts 'Forming' with
// forming_until_tick = created_tick + 2. This global per-tick sweep
// flips it to 'Active' once that window elapses. Single set-based
// UPDATE — idempotent (re-running finds no eligible rows) and
// non-fatal (logs + returns 0 on error).

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
