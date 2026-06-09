/**
 * government-structure.js — Seat loading, head faction detection, coalition fetching, policy compatibility
 * Extracted from game-common.js
 */

import { isAbsoluteMonarchy, isPresidentialRepublic, hasElectedPresident } from './government-types.js';

// ==================== SEAT LOADING ====================

export async function loadSeats(supabase, nationId, allParties, currentFactionId) {
    const allPartySeats = {};

    // factions.seats is the canonical source of truth — use it directly
    allParties.forEach(p => {
        allPartySeats[p.id] = p.seats || 0;
    });

    const currentSeats = allPartySeats[currentFactionId] ??
        allParties.find(p => p.id === currentFactionId)?.seats ?? 0;

    return { allPartySeats, currentSeats };
}


// ==================== HEAD FACTION ====================

export async function detectHeadFaction(supabase, nationId, allParties, allPartySeats, currentFactionId) {
    const { data: nation } = await supabase
        .from('nations')
        .select('ruling_faction_id')
        .eq('id', nationId)
        .single();

    if (nation?.ruling_faction_id) {
        return {
            headFactionId: nation.ruling_faction_id,
            isHeadFaction: currentFactionId === nation.ruling_faction_id
        };
    }

    const { data: gov } = await supabase
        .from('nation_governments')
        .select('head_of_state_party')
        .eq('nation_id', nationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (gov?.head_of_state_party) {
        return {
            headFactionId: gov.head_of_state_party,
            isHeadFaction: currentFactionId === gov.head_of_state_party
        };
    }

    return { headFactionId: null, isHeadFaction: false };
}


// ==================== COALITION FETCHING ====================

// ==================== ACTIVE-GOVERNMENT GATE ====================
//
// Single source of truth for the question "does this nation have an active
// government?" — one helper, one answer, regardless of system type.
//
// Delegates to fetchActiveCoalition which already routes per government_type:
//   - Presidential:          `presidents.is_active = true`
//   - Parliamentary / CM:    `government_formations.status = 'formed' or 'caretaker'`
//   - Absolute monarchy:     ministries-derived (always governed in practice)
//
// Callers that previously counted `government_formations.status='formed'` rows
// directly broke for presidential systems (no coalitions exist there) and
// required a lazy-init stub row to paper over the schema mismatch. Route them
// through hasActiveGovernment() instead.
export async function hasActiveGovernment(supabase, nation) {
    if (!nation) return false;
    const coalition = await fetchActiveCoalition(supabase, nation.id);
    return !!coalition && (coalition.status === 'formed' || coalition.status === 'caretaker');
}

/**
 * Derive the lead (PM) party id from a government_formations row.
 *
 * lead_party_id isn't a real column on government_formations. Callers that
 * SELECTed it directly used to silently 42703 in PostgREST and fall through
 * to wrong branches. This helper is the single source of truth for the
 * derivation across the codebase.
 *
 * @param {Object|null} formation – a government_formations row (or null)
 * @returns {string|null} the lead party's faction id, or null when undeterminable
 */
export function deriveLeadPartyId(formation) {
    if (!formation) return null;
    return formation.ministry_assignments?.prime_minister || formation.proposed_by || null;
}

export async function fetchActiveCoalition(supabase, nationId) {
    const cacheKey = 'coalition_' + nationId;
    if (typeof qCache === 'function') {
        const cached = qCache(cacheKey);
        if (cached) return cached;
    }

    // === PRESIDENTIAL SYSTEMS: return virtual coalition from active president ===
    const { data: nationRow } = await supabase
        .from('nations')
        .select('government_type, hos_election_method, monarch_faction_id, ruling_faction_id')
        .eq('id', nationId)
        .single();

    if (isPresidentialRepublic(nationRow)) {
        const { data: president } = await supabase
            .from('presidents')
            .select('id, nation_id, faction_id, first_name, last_name, elected_tick, is_active')
            .eq('nation_id', nationId)
            .eq('is_active', true)
            .order('elected_tick', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!president) return null; // No active president yet (candidate selection pending)

        // Build ministry_allocations from active ministries
        const { data: ministries } = await supabase
            .from('ministries')
            .select('ministry_key, party_id')
            .eq('nation_id', nationId)
            .eq('is_active', true);

        const ministryAllocations = {};
        const cabinetPartyIds = new Set([president.faction_id]);
        for (const m of (ministries || [])) {
            if (m.party_id) {
                ministryAllocations[m.ministry_key] = m.party_id;
                cabinetPartyIds.add(m.party_id);
            }
        }

        const result = {
            id: president.id,
            nation_id: nationId,
            party_ids: Array.from(cabinetPartyIds),
            lead_party_id: president.faction_id,
            ministry_allocations: ministryAllocations,
            formed_at: null,
            status: 'formed',  // Always 'formed' while president is active
        };
        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 15 * 1000);
        return result;
    }

    // === PARLIAMENTARY DEMOCRACY ===
    // Single source of truth: government_formations. Caretaker status is
    // set EXCLUSIVELY by Snap Election / VoNC / Presidential dissolve / PM
    // resignation — see js/game/elections.js + political-actions.js.

    // Only return formed or caretaker governments — 'active' means a proposal
    // that hasn't been finalized. Returning proposals here causes the UI to
    // render them as the actual government (e.g. "Majority Coalition Government"
    // for an unfinalized proposal).
    //
    // Cycle-anchored: a formation is only current if tied to the latest
    // completed election. Without this filter, a stale formation from a prior
    // cycle would continue to read as "active" after a newer election
    // completed with no government formed — blocking processGovernmentVacancy
    // (which bails when a formation is present) and indefinitely deferring
    // the snap-election / emergency-minority escalation.
    const { data: latestElection } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nationId)
        .eq('status', 'completed')
        .not('results', 'is', null)
        .order('election_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    let formationQuery = supabase
        .from('government_formations')
        .select('*')
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker']);
    if (latestElection) formationQuery = formationQuery.eq('election_id', latestElection.id);
    const { data: newGov } = await formationQuery
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (newGov) {
        const pmPartyId = deriveLeadPartyId(newGov);
        const partyIds = [...(newGov.party_ids || [])];

        // Ensure the PM's party is always in party_ids. Some formation
        // rows miss this — without the guard the PM's party ends up
        // misclassified as "Opposition" in parliament views and
        // isInGovt checks fail for the party actually running cabinet.
        if (pmPartyId && !partyIds.includes(pmPartyId)) {
            partyIds.push(pmPartyId);
        }

        const result = {
            id: newGov.id,
            nation_id: newGov.nation_id,
            election_id: newGov.election_id,
            party_ids: partyIds,
            lead_party_id: pmPartyId,
            ministry_allocations: newGov.ministry_assignments || {},
            formed_at: newGov.formed_at,
            formed_at_tick: newGov.formed_at_tick ?? null,
            status: newGov.status,
            formation_type: newGov.formation_type || 'coalition',
        };
        if (typeof qCacheSet === 'function') qCacheSet(cacheKey, result, 15 * 1000);
        return result;
    }

    // === ABSOLUTE MONARCHY FALLBACK: synthesize virtual coalition for UI context ===
    // Constitutional monarchies also have hos_election_method='hereditary',
    // but they are still parliamentary systems. They must use
    // government_formations as the coalition source of truth; otherwise stale
    // ministry rows can masquerade as an active coalition, grey out Form
    // Coalition, and make Leadership Challenge fail with no_coalition.
    if (!isAbsoluteMonarchy(nationRow)) return null;

    const { data: ministries } = await supabase
        .from('ministries')
        .select('ministry_key, party_id')
        .eq('nation_id', nationId)
        .eq('is_active', true);

    const ministryAllocations = {};
    let pmPartyId = null;
    const partyIds = new Set();
    for (const m of (ministries || [])) {
        if (!m.party_id) continue;
        ministryAllocations[m.ministry_key] = m.party_id;
        partyIds.add(m.party_id);
        if (m.ministry_key === 'prime_minister') pmPartyId = m.party_id;
    }

    const fallbackLeadPartyId = pmPartyId || nationRow?.monarch_faction_id || nationRow?.ruling_faction_id || null;
    if (!fallbackLeadPartyId) return null;

    partyIds.add(fallbackLeadPartyId);
    const monarchyFallback = {
        id: `virtual-monarchy-${nationId}`,
        nation_id: nationId,
        party_ids: Array.from(partyIds),
        lead_party_id: fallbackLeadPartyId,
        ministry_allocations: ministryAllocations,
        formed_at: null,
        status: 'formed',
    };

    if (typeof qCacheSet === 'function') qCacheSet(cacheKey, monarchyFallback, 15 * 1000);
    return monarchyFallback;
}


// ==================== POLICY COMPATIBILITY ====================

export function getCompatiblePolicies(sector, allPolicies, faction, excludePolicyIds = [], activePolicyIds = null) {
    // Phase 5a: ideology opposition filter removed. Policies were flagged
    // isOpposed when their ideology tag matched the opposite of the
    // faction's ideology_value_1/2. With ideology going away, every policy
    // is treated as compatible; the isOpposed flag stays in the return
    // shape (always false) so existing UI consumers don't break.

    return allPolicies
        .filter(p => p.major_sector === sector && !excludePolicyIds.includes(p.id))
        .map(p => {
            let prerequisiteMissing = false;
            let prerequisiteName = null;
            if (p.requires_policy_id && activePolicyIds) {
                if (!activePolicyIds.has(p.requires_policy_id)) {
                    prerequisiteMissing = true;
                    const prereq = allPolicies.find(pp => pp.id === p.requires_policy_id);
                    prerequisiteName = prereq?.policy_name || 'Unknown Policy';
                }
            }

            // Structural policies that are already active laws can be repealed; levers cannot
            const isActive = activePolicyIds && activePolicyIds.has(p.id);
            const alreadyEnacted = isActive && p.policy_type === 'structural';
            const alreadyEnactedLever = isActive && p.policy_type === 'lever';

            return { ...p, isOpposed: false, prerequisiteMissing, prerequisiteName, alreadyEnacted, alreadyEnactedLever };
        });
}
