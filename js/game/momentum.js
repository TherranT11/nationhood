/**
 * momentum.js — Electorate engine helpers for party_approval, credibility, and gov_approval_events.
 * Originally housed the legacy momentum system; now provides shared helpers used across game modules.
 */

// ── Constants (must match advance-tick CFG) ──
const APPROVAL_MIN = 10;
const APPROVAL_MAX = 90;
const DEFAULT_PARTY_APPROVAL = 25;
const CREDIBILITY_MIN = 0.5;
const CREDIBILITY_MAX = 1.5;

export function round2(v) { return Math.round(v * 100) / 100; }
export function round3(v) { return Math.round(v * 1000) / 1000; }

// ── Legacy stubs (kept for any remaining callers — both are no-ops) ──

export async function adjustMomentum(supabase, factionId, nationId, source, delta, reason) {
    // Legacy momentum system removed — electorate engine handles vote share now
    return;
}

export async function adjustMomentumAll(supabase, nationId, source, delta, reason) {
    // Legacy momentum system removed — electorate engine handles vote share now
    return;
}

// ── Electorate engine helpers ──

/**
 * Nudge a faction's party_approval in faction_electoral_standing.
 * Mirrors nudgeApproval() in advance-tick/index.ts.
 */
export async function nudgeApproval(supabase, factionId, nationId, delta) {
    if (!delta || delta === 0) return;
    const { data: standing } = await supabase
        .from('faction_electoral_standing')
        .select('id, party_approval')
        .eq('faction_id', factionId)
        .eq('nation_id', nationId)
        .maybeSingle();
    if (!standing) return;
    const old = Number(standing.party_approval ?? DEFAULT_PARTY_APPROVAL);
    const newVal = round2(Math.min(APPROVAL_MAX, Math.max(APPROVAL_MIN, old + delta)));
    await supabase.from('faction_electoral_standing')
        .update({ party_approval: newVal })
        .eq('id', standing.id);
}

/**
 * Adjust a faction's credibility_modifier in faction_electoral_standing.
 * Mirrors adjustCredibility() in advance-tick/index.ts.
 */
export async function adjustCredibility(supabase, factionId, nationId, delta, suspendRecoveryTicks = 0, currentTick = 0) {
    if (!delta && !suspendRecoveryTicks) return;
    const { data: standing } = await supabase
        .from('faction_electoral_standing')
        .select('id, credibility_modifier, credibility_recovery_suspended_until')
        .eq('faction_id', factionId)
        .eq('nation_id', nationId)
        .maybeSingle();
    if (!standing) return;
    const old = Number(standing.credibility_modifier ?? 1.0);
    const newCred = round3(Math.min(CREDIBILITY_MAX, Math.max(CREDIBILITY_MIN, old + (delta || 0))));
    const updateObj = { credibility_modifier: newCred };
    if (suspendRecoveryTicks > 0) {
        const suspendUntil = currentTick + suspendRecoveryTicks;
        const currentSuspend = Number(standing.credibility_recovery_suspended_until ?? 0);
        updateObj.credibility_recovery_suspended_until = Math.max(currentSuspend, suspendUntil);
    }
    await supabase.from('faction_electoral_standing')
        .update(updateObj)
        .eq('id', standing.id);
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
