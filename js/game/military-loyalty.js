/**
 * military-loyalty.js — Military Loyalty Act (MLA) behavior.
 *
 * While this structural policy is active in a nation, the Defense Minister
 * row in the ministries table is force-synced each tick to match the sitting
 * Head of Government (first/last name, age, party_id). The defense slot
 * cannot be dismissed while MLA is active.
 *
 * Single source of truth for MLA logic — used by:
 *   - advance-tick handler (per-tick sync)
 *   - js/game/bills.js       (enact hook: cancels pending defense confirmations)
 *   - js/game/repeal-helper.js (repeal hook: vacates defense ministry)
 *   - government.html        (fireMinister gate)
 */

import { isPresidentialRepublic } from './government-types.js';

export const MILITARY_LOYALTY_POLICY_KEY = 'military_loyalty';

// Checks whether MLA is currently active in a nation. Ignores reversal rows.
export async function isMilitaryLoyaltyActive(supabase, nationId) {
    if (!nationId) return false;
    const { data, error } = await supabase
        .from('active_laws')
        .select('id, policies!inner(policy_key)')
        .eq('nation_id', nationId)
        .eq('is_reversal', false)
        .eq('policies.policy_key', MILITARY_LOYALTY_POLICY_KEY)
        .limit(1)
        .maybeSingle();
    if (error) {
        console.warn('[MLA] isMilitaryLoyaltyActive query failed:', error.message);
        return false;
    }
    return !!data;
}

// Resolve the current Head of Government for a nation. Returns
// { first_name, last_name, age, party_id } or null if no HoG (vacant PM,
// no elected president, monarchy without a designated HoG, etc.).
// Presidential → active row in presidents (President is HoG+HoS).
// Parliamentary / monarchy-with-PM → PM row in ministries.
async function resolveHeadOfGovernment(supabase, nation) {
    if (!nation?.id) return null;

    if (isPresidentialRepublic(nation)) {
        const { data: pres, error: presErr } = await supabase
            .from('presidents')
            .select('first_name, last_name, age, faction_id')
            .eq('nation_id', nation.id)
            .eq('is_active', true)
            .maybeSingle();
        if (presErr) {
            console.warn(`[MLA] presidents query failed for ${nation.name}:`, presErr.message);
            return null;
        }
        if (!pres?.first_name || !pres?.last_name) return null;
        return {
            first_name: pres.first_name,
            last_name: pres.last_name,
            age: pres.age ?? null,
            party_id: pres.faction_id ?? null,
        };
    }

    const { data: pm, error: pmErr } = await supabase
        .from('ministries')
        .select('minister_first_name, minister_last_name, minister_age, party_id')
        .eq('nation_id', nation.id)
        .eq('ministry_key', 'prime_minister')
        .eq('is_active', true)
        .maybeSingle();
    if (pmErr) {
        console.warn(`[MLA] PM ministries query failed for ${nation.name}:`, pmErr.message);
        return null;
    }
    if (!pm?.minister_first_name || !pm?.minister_last_name) return null;
    return {
        first_name: pm.minister_first_name,
        last_name: pm.minister_last_name,
        age: pm.minister_age ?? null,
        party_id: pm.party_id ?? null,
    };
}

// Per-tick sync: if MLA is active, overwrite the defense ministry row with
// the current HoG. Resets minister_approval to 50 when the identity actually
// changes so the UI reflects a fresh slot each time HoG turns over.
export async function syncMilitaryLoyaltyDefenseMinister(supabase, nation, currentTick) {
    if (!nation?.id) return;
    if (!(await isMilitaryLoyaltyActive(supabase, nation.id))) return;

    const hog = await resolveHeadOfGovernment(supabase, nation);
    if (!hog) return; // no HoG to sync to — leave defense ministry as-is

    const { data: defense, error: defErr } = await supabase
        .from('ministries')
        .select('id, minister_first_name, minister_last_name, minister_age, party_id')
        .eq('nation_id', nation.id)
        .eq('ministry_key', 'defense')
        .eq('is_active', true)
        .maybeSingle();
    if (defErr) {
        console.warn(`[MLA] defense ministries query failed for ${nation.name}:`, defErr.message);
        return;
    }
    if (!defense?.id) return; // no defense ministry row to sync

    const identityChanged = defense.minister_first_name !== hog.first_name
        || defense.minister_last_name !== hog.last_name
        || defense.minister_age !== hog.age
        || defense.party_id !== hog.party_id;
    if (!identityChanged) return;

    const update = {
        minister_first_name: hog.first_name,
        minister_last_name: hog.last_name,
        minister_age: hog.age,
        party_id: hog.party_id,
        minister_approval: 50,
        pending_party_id: null,
        pending_first_name: null,
        pending_last_name: null,
        pending_age: null,
        confirmation_status: null,
        pending_minister: null,
    };
    const { error } = await supabase.from('ministries').update(update).eq('id', defense.id);
    if (error) {
        console.warn(`[MLA] Defense minister sync failed for ${nation.name}:`, error.message);
        return;
    }
    console.log(`[MLA] ${nation.name}: defense minister synced to HoG ${hog.first_name} ${hog.last_name} (tick ${currentTick})`);
}

// Enact hook: on MLA passage, cancel any in-flight defense-minister
// confirmation bill so it doesn't collide with the forced sync.
export async function onMilitaryLoyaltyEnacted(supabase, nationId, currentTick) {
    if (!nationId) return;
    const { error } = await supabase
        .from('bills')
        .update({ status: 'failed', passed_tick: currentTick ?? 0 })
        .eq('nation_id', nationId)
        .eq('status', 'voting')
        .eq('bill_type', 'minister_confirmation')
        .eq('ministry_key', 'defense');
    if (error) console.warn('[MLA] Failed to cancel pending defense confirmations:', error.message);
}

// Repeal hook: on MLA repeal, vacate the defense ministry so the nation
// must appoint a new minister through the normal process.
export async function onMilitaryLoyaltyRepealed(supabase, nationId) {
    if (!nationId) return;
    const { error } = await supabase.from('ministries').update({
        minister_first_name: null,
        minister_last_name: null,
        minister_age: null,
        party_id: null,
        minister_approval: 50,
        stat_baselines: null,
    })
        .eq('nation_id', nationId)
        .eq('ministry_key', 'defense')
        .eq('is_active', true);
    if (error) console.warn('[MLA] Failed to vacate defense ministry on repeal:', error.message);
}
