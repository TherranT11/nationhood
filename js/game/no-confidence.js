/**
 * no-confidence.js — shared backend writes for filing a no-confidence motion.
 *
 * Two UI entry points file no-confidence: the FILE NO CONFIDENCE button on
 * government.html and the LEADER party action on politics.html. Both perform
 * the same three database writes (bill insert, bill_support upsert for the
 * filer's YES vote, campaign_actions cooldown row keyed on the targeted PM
 * party). Drift between those two paths would silently break either
 * cooldown enforcement or vote tally, so the writes live here.
 *
 * Pre-flight checks (cooldown remaining, no pending motion, has seats, not
 * the PM party) and the confirm-dialog text stay at the call site because
 * the two UIs need different copy + different lock-state surfaces. Each
 * caller is expected to re-validate at click time before invoking this.
 */

import { GAME_CONFIG } from './config.js';
import { isAbsoluteMonarchy } from './government-types.js';

/**
 * Insert the no-confidence bill, auto-cast the filer's YES vote, and record
 * the per-targeted-PM-party cooldown row. Returns { ok, billId } on success
 * or { ok: false, error } on the first write that fails.
 *
 * @param {object} supabase   - Supabase client (anon-key is fine; RLS on bills + bill_support + campaign_actions is permissive for authenticated users)
 * @param {object} opts
 * @param {object} opts.faction       - { id, faction_name, party_color }
 * @param {object} opts.nation        - { id }
 * @param {string} opts.pmFactionId   - PM's faction id (target of the motion + cooldown key)
 * @param {string|null} opts.pmLastName - For the motion title; null falls back to a generic title
 * @param {number} opts.tick          - Current shard tick
 * @param {number} opts.mySeats       - Filer's seat count (used as the YES vote weight)
 * @returns {Promise<{ ok: true, billId: string } | { ok: false, error: string }>}
 */
export async function fileNoConfidenceMotion(supabase, opts) {
    const { faction, nation, pmFactionId, pmLastName, tick, mySeats } = opts;

    if (!faction?.id || !nation?.id || !pmFactionId) {
        return { ok: false, error: 'Missing required arguments (faction, nation, or PM party id).' };
    }

    // Defense in depth: under absolute monarchy, parliament cannot remove
    // the Monarch's PM via no-confidence — dismissal is a royal prerogative.
    // The two UI entry points (government.html and party-actions.js) also
    // hide/disable the button, but the gate lives here so any future caller
    // gets the same enforcement without re-implementing it.
    const { data: nationRow } = await supabase.from('nations')
        .select('government_type, hos_election_method').eq('id', nation.id).maybeSingle();
    if (isAbsoluteMonarchy(nationRow)) {
        return { ok: false, error: 'No-confidence motions cannot be filed under absolute monarchy. Only the Monarch can dismiss the Prime Minister.' };
    }

    const motionName = pmLastName
        ? `Motion of No Confidence in the ${pmLastName} Government`
        : `Motion of No Confidence in the Government`;
    const preamble = `This motion, filed by the ${faction.faction_name}, calls for a vote of no confidence in the current government. If passed by simple majority, the coalition will be immediately dissolved.`;

    const { data: bill, error: billErr } = await supabase.from('bills').insert({
        nation_id: nation.id,
        proposed_by: faction.id,
        proposed_tick: tick,
        bill_name: motionName,
        bill_type: 'no_confidence',
        status: 'floor',
        floor_tick: tick,
        voting_ends_tick: tick + GAME_CONFIG.NO_CONFIDENCE_VOTING_TICKS,
        proposer_name: faction.faction_name,
        proposer_color: faction.party_color,
        preamble,
    }).select('id').single();
    if (billErr) return { ok: false, error: billErr.message };

    // Race guard: if another opposition party slipped a motion in between our
    // pre-flight check and this insert, drop ours so the nation only ever has
    // one floor/committee no-confidence bill at a time.
    const { count: ncCount } = await supabase.from('bills')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nation.id)
        .eq('bill_type', 'no_confidence')
        .in('status', ['committee', 'floor']);
    if ((ncCount ?? 0) > 1) {
        await supabase.from('bills').delete().eq('id', bill.id);
        return { ok: false, error: 'Another motion of no confidence was just filed. Please refresh.' };
    }

    // Auto-cast the filer's YES vote with their seat weight.
    const { error: voteErr } = await supabase.from('bill_support').upsert({
        bill_id: bill.id,
        faction_id: faction.id,
        stance: 'yes',
        seat_count: Number(mySeats) || 0,
    }, { onConflict: 'bill_id,faction_id' });
    if (voteErr) console.warn('[no_confidence] auto-vote upsert failed (non-fatal, motion still filed):', voteErr.message);

    // Cooldown row keyed on the targeted PM party. Single source of truth for
    // the per-target 12-tick lockout (see GAME_CONFIG.NO_CONFIDENCE_COOLDOWN_TICKS).
    const { error: cdErr } = await supabase.from('campaign_actions').insert({
        party_id: faction.id,
        nation_id: nation.id,
        target_id: pmFactionId,
        action_type: 'no_confidence_filed',
        ap_cost: 0,
        money_cost: 0,
        tick_performed: tick,
        result: { bill_id: bill.id, pm_last_name: pmLastName || null },
    });
    if (cdErr) console.warn('[no_confidence] cooldown insert failed (motion still filed; next file may slip past cooldown):', cdErr.message);

    return { ok: true, billId: bill.id, motionName };
}
