/**
 * event-helpers.js — Shared helpers for firing system events.
 * Extracted from game-common.js
 */

/**
 * Phase 5.3: Walk a bill's articles and produce "Policy → Switch to Option"
 * one-liners for the option-based articles. Repeal articles, text articles,
 * and policies without options are skipped. Used to surface multi-option
 * transitions in bill-passed event descriptions without forcing every
 * downstream template to add a new placeholder.
 */
function _summarizeOptionTransitions(bill) {
    const transitions = [];
    for (const art of (bill?.bill_articles || [])) {
        if (!art?.policy_id || art?.repeal_active_law_id) continue;
        const policyName = art.policies?.policy_name;
        const optionName = art.selected_option?.option_name;
        if (policyName && optionName) {
            transitions.push(`${policyName} → ${optionName}`);
        }
    }
    return transitions;
}

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
    // Phase 5.3: surface option transitions to event templates. Two channels:
    //   • {option_transitions} placeholder — explicit, opt-in for new templates
    //   • bill_name auto-suffix — universal, so existing templates that
    //     reference {bill_name} surface the option info without a template
    //     edit. Skipped when the caller passes billNameOverride (those
    //     overrides have their own narrative shape) or when the bill has
    //     no option-based articles (text bills, repeals, foundational, etc.).
    const transitions = _summarizeOptionTransitions(bill);
    const transitionsSummary = transitions.join('; ');

    const baseBillName = opts.billNameOverride || bill.bill_name;
    const decoratedBillName = (!opts.billNameOverride && transitions.length > 0)
        ? `${baseBillName} (${transitionsSummary})`
        : baseBillName;

    const placeholders = {
        nation: opts.nationName || 'Unknown',
        bill_name: decoratedBillName,
        sponsor: opts.sponsor || bill.factions?.faction_name || 'Unknown',
        votes_for: String(opts.votesFor ?? 0),
        votes_against: String(opts.votesAgainst ?? 0),
        option_transitions: transitionsSummary,
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
 * Broadcast a hand-written event to every nation (world news). Inserts one
 * event_log row per nation with the supplied description. Mirrors the existing
 * direct-insert pattern in issues.js (spawnIncidentFromIssue)
 * rather than the templated fire_system_event RPC, because these events are
 * fully composed at the call site and don't need placeholder substitution.
 *
 * Non-blocking — swallows errors with a console warning. The triggering action
 * has already succeeded; a missed event-log row shouldn't surface as a UI
 * failure to the player.
 *
 * @param {object} supabase
 * @param {object} opts
 * @param {string} opts.eventName     - Display name on the event card.
 * @param {string} opts.triggerKey    - Stable key for grouping/filtering.
 * @param {string} opts.description   - Final user-visible line.
 * @param {string} [opts.category]    - News section. Defaults to 'diplomacy'.
 * @param {number} [opts.currentTick] - Tick stamp. Fetched from shard if omitted.
 */
export async function broadcastWorldEvent(supabase, { eventName, triggerKey, description, category = 'diplomacy', currentTick } = {}) {
    try {
        let tick = currentTick;
        if (tick == null) {
            const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
            tick = shard?.current_tick || 0;
        }
        const { data: nations, error: natErr } = await supabase.from('nations').select('id');
        if (natErr) throw natErr;
        const ids = (nations || []).map(n => n.id);
        if (!ids.length) return;
        const rows = ids.map(nation_id => ({
            nation_id, event_name: eventName, trigger_key: triggerKey,
            description_chosen: description, category, fired_at_tick: tick,
        }));
        const { error } = await supabase.from('event_log').insert(rows);
        if (error) console.warn('[broadcastWorldEvent] insert failed:', error.message);
    } catch (e) {
        console.warn('[broadcastWorldEvent] failed:', e?.message || e);
    }
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
