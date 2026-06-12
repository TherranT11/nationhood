// ─────────────────────────────────────────────────────────────────────────────
// politician_join_party / politician_leave_party — RPC wrapper + shared copy.
// One source for the wire dance (try/catch, success/reason normalisation) and
// the confirm-message string. Used by:
//   • politician-career.html  (Party Member rung's Leave button)
//   • politician-movements.html (Join/Leave button in the join modal)
//   • party.html               (Join/Leave button on the dedicated party page)
//
// Returns { ok, reason, data }. Callers handle UI state themselves —
// disabling the clicked button, restoring it on failure, reloading on
// success — so this helper stays the wire glue and nothing more.
// ─────────────────────────────────────────────────────────────────────────────
import { _supabase } from './supabase-client.js';

export const LEAVE_PARTY_CONFIRM = 'Leave your political party?';

export async function callPartyAction(mode, politicianId, partyId) {
    try {
        const rpc = mode === 'leave'
            ? _supabase.rpc('politician_leave_party', { p_politician_id: politicianId })
            : _supabase.rpc('politician_join_party',  { p_politician_id: politicianId, p_party_id: partyId });
        const { data, error } = await rpc;
        if (error) return { ok: false, reason: error.message || 'rpc_error', data: null };
        if (!data || !data.success) return { ok: false, reason: data?.reason || 'unknown', data: null };
        return { ok: true, reason: null, data };
    } catch (err) {
        return { ok: false, reason: err.message || String(err), data: null };
    }
}
