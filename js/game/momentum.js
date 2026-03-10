/**
 * momentum.js — Momentum and government approval event adjustments
 * Extracted from game-common.js
 */

/**
 * Adjust momentum for a faction, optionally targeting a specific voter bloc.
 * Clamps to [-50, +50]. Writes an audit row to momentum_log.
 *
 * @param {object} supabase
 * @param {string} nationId  - nation UUID (for audit log)
 * @param {string} factionId - faction UUID
 * @param {string|null} blocId - specific bloc UUID, or null for all blocs
 * @param {number} amount    - positive = boost, negative = penalty
 * @param {string} source    - audit tag, e.g. 'legislation:veto'
 */
export async function adjustMomentum(supabase, nationId, factionId, blocId, amount, source) {
    if (amount === 0) return;

    const query = supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, momentum')
        .eq('faction_id', factionId);
    if (blocId) query.eq('bloc_id', blocId);

    const { data: rows } = await query;
    if (!rows || rows.length === 0) return;

    for (const row of rows) {
        const old = Number(row.momentum ?? 0);
        const clamped = Math.round(Math.max(-50, Math.min(50, old + amount)) * 100) / 100;
        await supabase.from('faction_bloc_approval')
            .update({ momentum: clamped })
            .eq('id', row.id);
    }

    // Audit log (best-effort — don't fail the caller)
    const { data: shard } = await supabase
        .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    await supabase.from('momentum_log').insert({
        nation_id: nationId,
        faction_id: factionId,
        bloc_id: blocId || null,
        amount,
        source: source || 'unknown',
        tick: shard?.current_tick || 0
    });

    console.log(`[Momentum] ${amount > 0 ? '+' : ''}${amount} for faction ${factionId}${blocId ? ` bloc ${blocId}` : ` (${rows.length} blocs)`} — ${source}`);
}

/**
 * Convenience wrapper: adjust momentum uniformly across ALL blocs for a faction.
 * Use this for events that affect a party's overall standing (crises, elections, etc.).
 */
export async function adjustMomentumAll(supabase, nationId, factionId, amount, source) {
    await adjustMomentum(supabase, nationId, factionId, null, amount, source);
}
/**
 * Apply a one-time event modifier to the government approval event modifier.
 * The modifier decays 10% per tick, so transient shocks fade naturally.
 * Clamped to [-50, +50]. Writes an audit row to gov_approval_log.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {number} amount   - signed delta (positive = boost, negative = shock)
 * @param {string} source   - audit tag, e.g. 'legislation:veto'
 */
export async function adjustGovernmentApprovalEvent(supabase, nationId, amount, source) {
    if (amount === 0) return;

    const { data: nation } = await supabase
        .from('nations')
        .select('gov_approval_events')
        .eq('id', nationId)
        .single();

    const current = Number(nation?.gov_approval_events ?? 0);
    const updated = Math.round(Math.max(-50, Math.min(50, current + amount)) * 100) / 100;

    const { error: updateErr } = await supabase.from('nations')
        .update({ gov_approval_events: updated })
        .eq('id', nationId);

    if (updateErr) {
        console.error(`[GovApprovalEvent] Failed to update gov_approval_events for ${nationId}: ${updateErr.message}`);
        return;
    }

    // Audit log (non-fatal — table may not exist if migration not applied)
    try {
        const { data: shard } = await supabase
            .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        await supabase.from('gov_approval_log').insert({
            nation_id: nationId,
            amount,
            source: source || 'unknown',
            tick: shard?.current_tick || 0
        });
    } catch (e) { /* non-blocking */ }

    console.log(`[GovApprovalEvent] ${amount > 0 ? '+' : ''}${amount} for nation ${nationId} — ${source}`);
}
