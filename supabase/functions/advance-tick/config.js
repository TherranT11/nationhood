// config.js — Shared utilities for advance-tick edge function

/**
 * Deduct AP from a faction. Returns the new AP value, or -1 if insufficient.
 */
export async function deductAP(supabase, factionId, cost, meta = {}) {
    const { data, error } = await supabase.rpc('deduct_ap', {
        p_faction_id: factionId,
        p_cost: cost,
    });
    if (error) {
        console.error('[deductAP] RPC error:', error.message);
        return -1;
    }
    return data;
}
