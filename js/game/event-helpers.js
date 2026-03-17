/**
 * event-helpers.js — Shared helpers for firing system events.
 * Extracted from game-common.js
 */

/**
 * Fire a bill-related system event (bill_passed / bill_failed / quorum_failed etc).
 * Wraps the common try/catch + placeholder boilerplate used 20+ times in bills.js & presidential.js.
 *
 * @param {object} supabase   - Supabase client
 * @param {string} triggerKey - e.g. 'bill_passed', 'bill_failed', 'quorum_failed'
 * @param {object} bill       - The bill row (needs .nation_id, .bill_name, .factions?.faction_name)
 * @param {object} opts       - Additional options
 * @param {number} opts.currentTick
 * @param {string} [opts.nationName]       - Nation name (falls back to 'Unknown')
 * @param {number|string} [opts.votesFor]
 * @param {number|string} [opts.votesAgainst]
 * @param {number|string} [opts.votesAbstain]
 * @param {string} [opts.articleCount]
 * @param {object} [opts.extra]            - Any extra placeholder key/values
 */
export async function fireBillEvent(supabase, triggerKey, bill, opts = {}) {
    const placeholders = {
        nation: opts.nationName || 'Unknown',
        bill_name: opts.billNameOverride || bill.bill_name,
        sponsor: opts.sponsor || bill.factions?.faction_name || 'Unknown',
        votes_for: String(opts.votesFor ?? 0),
        votes_against: String(opts.votesAgainst ?? 0),
    };
    if (opts.votesAbstain !== undefined) {
        placeholders.votes_abstain = String(opts.votesAbstain);
    }
    if (opts.articleCount !== undefined) {
        placeholders.article_count = String(opts.articleCount);
    }
    if (opts.extra) {
        Object.assign(placeholders, opts.extra);
    }
    const nationId = opts.nationId || bill.nation_id;
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: triggerKey,
            p_nation_id: nationId,
            p_tick: opts.currentTick,
            p_placeholders: placeholders
        });
    } catch (e) { /* non-blocking */ }
    // Backfill effects_applied on the row the RPC just created (RPC leaves it null).
    // Try multiple matching strategies to find the row reliably.
    try {
        // Strategy 1: match on trigger_key column if the RPC stores it
        let rows = null;
        const { data: r1 } = await supabase.from('event_log')
            .select('id')
            .eq('nation_id', nationId)
            .eq('fired_at_tick', opts.currentTick)
            .eq('trigger_key', triggerKey)
            .is('effects_applied', null)
            .order('created_at', { ascending: false })
            .limit(1);
        rows = r1;

        // Strategy 2: fallback to ilike on event_name with broader patterns
        if (!rows || rows.length === 0) {
            const patterns = [triggerKey.replace(/_/g, ' ')];
            if (triggerKey.includes('passed')) patterns.push('Passed', 'Enacted', 'Signed');
            else if (triggerKey.includes('failed')) patterns.push('Failed', 'Defeated', 'Vetoed');
            for (const pat of patterns) {
                const { data: r2 } = await supabase.from('event_log')
                    .select('id')
                    .eq('nation_id', nationId)
                    .eq('fired_at_tick', opts.currentTick)
                    .ilike('event_name', `%${pat}%`)
                    .is('effects_applied', null)
                    .order('created_at', { ascending: false })
                    .limit(1);
                if (r2 && r2.length > 0) { rows = r2; break; }
            }
        }

        if (rows && rows.length > 0) {
            await supabase.from('event_log')
                .update({ effects_applied: placeholders })
                .eq('id', rows[0].id);
        }
    } catch (e) { /* non-blocking — effects_applied is a nice-to-have */ }
}

/**
 * Fire a system event to two nations simultaneously (e.g. bilateral aid/trade events).
 */
export async function fireBilateralEvent(supabase, triggerKey, nationIdA, nationIdB, currentTick, placeholders) {
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: triggerKey, p_nation_id: nationIdA,
            p_tick: currentTick, p_placeholders: placeholders
        });
        await supabase.rpc('fire_system_event', {
            p_trigger_key: triggerKey, p_nation_id: nationIdB,
            p_tick: currentTick, p_placeholders: placeholders
        });
    } catch (e) { /* non-blocking */ }
}
