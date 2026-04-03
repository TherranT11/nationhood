/**
 * presidential.js — Presidential candidates, nomination, veto, and term processing
 * Extracted from game-common.js
 */

import { GAME_CONFIG, getPresidentialTermLimit } from './config.js';
import { isParliamentaryDemocracy, isPresidentialRepublic } from './government-types.js';
import { loadFactionIdeology } from './ideology.js';
import { enactBill, failBill } from './bills.js';
import { getWeightedIdeologies, weightedRandomPick, autoAppointPartyLeaderAsPM } from './political-actions.js';
import { fetchActiveCoalition } from './government-structure.js';
import { adjustGovernmentApprovalEvent } from './momentum.js';
import { fireBillEvent } from './event-helpers.js';

/** Tally floor votes from bill_support records (already loaded via join). */
function tallyFloorVotes(bill) {
    let votesFor = 0, votesAgainst = 0, votesAbstain = 0;
    for (const s of (bill.bill_support || [])) {
        const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
        if (stance === 'yes') votesFor += (s.seat_count || 0);
        else if (stance === 'no') votesAgainst += (s.seat_count || 0);
        else if (stance === 'abstain') votesAbstain += (s.seat_count || 0);
    }
    return { votesFor, votesAgainst, votesAbstain };
}

/**
 * Register a party's leader as their presidential candidate.
 * The party leader is automatically the nominee — no player choice.
 * Candidate is stored in pm_candidates table with candidate_type = 'presidential'
 * and selected = true so the existing run_presidential_election RPC works unchanged.
 */
export async function registerPartyLeaderAsCandidate(supabase, nationId, factionId, currentTick) {
    // Load faction with leader data
    const { data: faction, error: factionErr } = await supabase
        .from('factions')
        .select('id, faction_name, leader_first_name, leader_last_name, leader_age, leader_positive_traits')
        .eq('id', factionId)
        .single();
    if (factionErr || !faction) throw new Error('Faction not found');
    if (!faction.leader_first_name || !faction.leader_last_name) {
        console.warn(`Party ${faction.faction_name} has no leader — cannot register presidential candidate`);
        return null;
    }

    // Load faction ideology to determine candidate's ideology axis
    let factionIdeology = await loadFactionIdeology(supabase, factionId);
    if (factionIdeology?._error) factionIdeology = null;

    const weightedIdeologies = getWeightedIdeologies(factionIdeology);
    const ideologyPick = weightedRandomPick(weightedIdeologies);
    const ideology = ideologyPick.item;

    // Use the leader's first positive trait
    const traitKey = (faction.leader_positive_traits && faction.leader_positive_traits.length > 0)
        ? faction.leader_positive_traits[0]
        : null;

    // Clear any existing presidential candidates for this faction
    const { error: delErr } = await supabase.from('pm_candidates').delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('candidate_type', 'presidential');
    if (delErr) console.warn(`Failed to clear old presidential candidates for faction ${factionId}:`, delErr.message);

    // Insert party leader as pre-selected candidate
    const { data, error } = await supabase.from('pm_candidates').insert({
        nation_id: nationId,
        faction_id: factionId,
        first_name: faction.leader_first_name,
        last_name: faction.leader_last_name,
        age: faction.leader_age || (35 + Math.floor(Math.random() * 16)),
        ideology: ideology.tag,
        ideology_axis: ideology.axisKey,
        ideology_direction: ideology.direction,
        trait_key: traitKey,
        created_at_tick: currentTick,
        candidate_type: 'presidential',
        selected: true
    }).select().single();

    if (error) {
        console.error(`Error registering party leader as presidential candidate for ${faction.faction_name}:`, error);
        throw error;
    }

    console.log(`Registered party leader ${faction.leader_first_name} ${faction.leader_last_name} as presidential candidate for ${faction.faction_name}`);
    return data;
}

/** Compute the dominant ideology axis and direction for a faction. */
async function computeDominantIdeologyAxis(supabase, factionId) {
    let factionIdeology = await loadFactionIdeology(supabase, factionId);
    if (factionIdeology?._error) factionIdeology = null;
    let ideologyAxis = 'tradition_progress';
    let ideologyDirection = 1;
    if (factionIdeology) {
        const axes = ['liberty_equality', 'tradition_progress', 'security_freedom', 'globalism_nationalism', 'individualism_collectivism'];
        let maxAbs = 0;
        for (const axis of axes) {
            const val = Math.abs(factionIdeology[axis] || 0);
            if (val > maxAbs) { maxAbs = val; ideologyAxis = axis; ideologyDirection = (factionIdeology[axis] || 0) >= 0 ? 1 : -1; }
        }
    }
    return { ideologyAxis, ideologyDirection };
}


// ==================== PRESIDENTIAL MINISTER NOMINATION ====================

/**
 * President nominates a minister for a cabinet slot.
 * Writes pending data to the ministries table and creates a confirmation bill.
 * Parliament votes simple majority.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string} presidentFactionId - The president's faction (must match active president)
 * @param {string} ministryKey - Which ministry slot (e.g. 'defense', 'finance')
 * @param {object} nominee - { partyId, partyName, firstName, lastName, age }
 */
export async function nominateMinister(supabase, nationId, presidentFactionId, ministryKey, nominee) {
    // Validate: must be Presidential system
    const { data: nation } = await supabase.from('nations').select('name, government_type, total_seats').eq('id', nationId).single();
    if (!isPresidentialRepublic(nation)) throw new Error('Minister nominations only apply to Presidential systems');
    const nationTotalSeats = nation.total_seats || GAME_CONFIG.TOTAL_SEATS;

    // Validate: caller must be president's party
    const { data: president } = await supabase.from('presidents')
        .select('id, faction_id')
        .eq('nation_id', nationId).eq('is_active', true)
        .limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can nominate ministers');

    // Validate: no existing pending confirmation for this slot
    const { data: existingMinistry } = await supabase.from('ministries')
        .select('id, confirmation_status')
        .eq('nation_id', nationId).eq('ministry_key', ministryKey).eq('is_active', true)
        .maybeSingle();

    if (existingMinistry?.confirmation_status === 'pending') {
        throw new Error('A confirmation vote is already pending for this ministry');
    }

    // Get current tick
    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    // Write pending minister data to the ministry row
    const pendingData = {
        party_id: nominee.partyId,
        first_name: nominee.firstName,
        last_name: nominee.lastName,
        age: nominee.age
    };

    const ministryDisplayName = {
        prime_minister: 'Prime Minister', interior: 'Ministry of the Interior',
        foreign: 'Foreign Ministry', defense: 'Ministry of Defense',
        finance: 'Ministry of Finance', education: 'Ministry of Education',
        healthcare: 'Ministry of Healthcare', labor: 'Ministry of Labor',
        justice: 'Ministry of Justice', trade: 'Ministry of Trade',
        energy: 'Ministry of Energy', transportation: 'Ministry of Transportation',
        security: 'Ministry of Security'
    }[ministryKey] || ministryKey;

    if (existingMinistry) {
        const { error: updErr } = await supabase.from('ministries').update({
            confirmation_status: 'pending',
            pending_minister: pendingData
        }).eq('id', existingMinistry.id);
        if (updErr) throw new Error('Failed to update ministry: ' + updErr.message);
    } else {
        const { error: insErr } = await supabase.from('ministries').insert({
            nation_id: nationId,
            ministry_key: ministryKey,
            ministry_name: ministryDisplayName,
            is_active: true,
            confirmation_status: 'pending',
            pending_minister: pendingData
        });
        if (insErr) throw new Error('Failed to create ministry row: ' + insErr.message);
    }

    // Create confirmation bill (goes straight to floor vote)
    const ministerTitle = {
        prime_minister: 'Prime Minister', interior: 'Minister of the Interior',
        foreign: 'Minister of Foreign Affairs', defense: 'Minister of Defense',
        finance: 'Minister of Finance', education: 'Minister of Education',
        healthcare: 'Minister of Healthcare', labor: 'Minister of Labor',
        justice: 'Minister of Justice', trade: 'Minister of Trade',
        energy: 'Minister of Energy', transportation: 'Minister of Transportation',
        security: 'Minister of Security'
    }[ministryKey] || ministryDisplayName;

    const billName = `Confirmation of ${nominee.firstName} ${nominee.lastName} as ${ministerTitle}`;
    const majoritySeats = Math.ceil(nationTotalSeats * 0.5) + 1;
    const preamble = `The President nominates ${nominee.firstName} ${nominee.lastName} (${nominee.partyName}) to serve as ${ministerTitle}. A simple majority (${majoritySeats} of ${nationTotalSeats} seats) is required for confirmation.`;

    const { data: bill, error: billErr } = await supabase.from('bills').insert({
        nation_id: nationId,
        proposed_by: presidentFactionId,
        proposed_tick: currentTick,
        bill_name: billName,
        bill_type: 'minister_confirmation',
        status: 'floor',
        voting_ends_tick: currentTick + GAME_CONFIG.MINISTER_CONFIRMATION_VOTING_TICKS,
        ministry_key: ministryKey,
        preamble
    }).select().single();

    if (billErr) throw billErr;

    console.log(`Minister nomination: ${nominee.firstName} ${nominee.lastName} for ${ministryKey} (bill ${bill.id})`);
    return { bill, nominee };
}


// ==================== PRESIDENTIAL VETO SYSTEM ====================

/**
 * President signs a bill into law.
 * Called from the UI when the President's party clicks "Sign Into Law".
 */
export async function signPresidentialBill(supabase, billId, presidentFactionId) {
    const context = { billId, presidentFactionId };
    console.log('[signPresidentialBill] stage=rpc_start', context);

    const { data: rpcResult, error: rpcError } = await supabase.rpc('sign_presidential_bill', {
        p_bill_id: billId
    });

    if (rpcError) {
        console.error('[signPresidentialBill] stage=rpc_error', {
            ...context,
            error: rpcError.message
        });
        throw new Error(`Presidential signing failed: ${rpcError.message}`);
    }

    if (!rpcResult?.ok) {
        console.error('[signPresidentialBill] stage=rpc_rejected', {
            ...context,
            result: rpcResult
        });
        throw new Error(rpcResult?.message || 'Presidential signing was rejected.');
    }

    console.log('[signPresidentialBill] stage=rpc_success', {
        ...context,
        code: rpcResult.code
    });

    const { data: signedBill, error: signedBillErr } = await supabase.from('bills')
        .select('id, bill_name, nation_id, bill_articles(id), bill_support(stance, seat_count)')
        .eq('id', billId)
        .single();

    if (signedBillErr || !signedBill) {
        throw new Error(`Bill signed but failed to reload bill metadata: ${signedBillErr?.message || 'not found'}`);
    }

    const floorVotes = tallyFloorVotes(signedBill);
    await fireBillEvent(supabase, 'bill_passed', signedBill, {
        currentTick: rpcResult.tick || 0,
        votesFor: floorVotes.votesFor,
        votesAgainst: floorVotes.votesAgainst,
        votesAbstain: floorVotes.votesAbstain,
        articleCount: (signedBill.bill_articles || []).length,
        billNameOverride: `${signedBill.bill_name} (signed by President)`
    });

    console.log('[signPresidentialBill] stage=terminal_result result=success', context);
}

/**
 * President vetoes a bill.
 * Auto-creates a veto_override bill requiring 2/3 supermajority.
 */
export async function vetoPresidentialBill(supabase, billId, presidentFactionId) {
    const { data: bill } = await supabase.from('bills')
        .select('*, factions(faction_name), bill_support(stance, seat_count)')
        .eq('id', billId).single();
    if (!bill || bill.status !== 'president_desk') throw new Error('Bill is not on the president\'s desk');

    const { data: president } = await supabase.from('presidents')
        .select('faction_id').eq('nation_id', bill.nation_id).eq('is_active', true).limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can veto bills');

    // Fetch nation's actual seat count for override threshold
    const { data: nationData } = await supabase.from('nations').select('total_seats').eq('id', bill.nation_id).single();
    const nationTotalSeats = nationData?.total_seats || GAME_CONFIG.TOTAL_SEATS;

    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    // Mark bill as vetoed
    await supabase.from('bills').update({
        status: 'vetoed',
        president_action: 'vetoed',
        president_action_tick: currentTick
    }).eq('id', bill.id);

    // Auto-create veto override bill (goes straight to floor)
    const overrideSeats = Math.ceil(nationTotalSeats * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD);
    const { data: overrideBill } = await supabase.from('bills').insert({
        nation_id: bill.nation_id,
        proposed_by: bill.proposed_by,
        proposed_tick: currentTick,
        bill_name: 'Veto Override: ' + bill.bill_name,
        bill_type: 'veto_override',
        status: 'floor',
        voting_ends_tick: currentTick + GAME_CONFIG.VOTING_WINDOW_TICKS,
        original_bill_id: bill.id,
        is_veto_override: true,
        preamble: `The President has vetoed "${bill.bill_name}". The legislature may override this veto with a two-thirds supermajority (${overrideSeats} of ${nationTotalSeats} seats).`
    }).select().single();

    const floorVotes = tallyFloorVotes(bill);
    await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, votesFor: floorVotes.votesFor, votesAgainst: floorVotes.votesAgainst, votesAbstain: floorVotes.votesAbstain, billNameOverride: bill.bill_name + ' (VETOED by President)' });

    return overrideBill;
}

/**
 * Auto-sign bills that have been on the president's desk past the deadline.
 * Called during advanceTick().
 */
export async function processPresidentDesk(supabase, nation, currentTick) {
    console.log(`[processPresidentDesk] nation=${nation.name} gov=${nation.government_type} isPres=${isPresidentialRepublic(nation)} tick=${currentTick}`);
    if (!isPresidentialRepublic(nation)) return [];

    const { data: expiredDesks, error: deskErr } = await supabase.from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('nation_id', nation.id)
        .eq('status', 'president_desk')
        .lte('president_desk_deadline', currentTick);

    console.log(`[processPresidentDesk] found ${expiredDesks?.length ?? 0} expired desk bills (error=${deskErr?.message || 'none'})`);
    if (expiredDesks && expiredDesks.length > 0) {
        for (const b of expiredDesks) {
            console.log(`[processPresidentDesk]   bill=${b.id} "${b.bill_name}" deadline=${b.president_desk_deadline} action=${b.president_action}`);
        }
    }

    if (!expiredDesks || expiredDesks.length === 0) return [];

    const results = [];
    for (const bill of expiredDesks) {
        // Auto-sign: president didn't act in time
        await supabase.from('bills').update({
            president_action: 'auto_signed',
            president_action_tick: currentTick
        }).eq('id', bill.id);

        const enactment = await enactBill(supabase, bill, currentTick);
        if (!enactment?.success) {
            console.error(`[processPresidentDesk] Enactment failed for bill ${bill.id}: ${enactment?.error}`);
            results.push({ billId: bill.id, billName: bill.bill_name, action: 'auto_signed', enactFailed: true, error: enactment?.error });
            continue;
        }

        const floorVotes = tallyFloorVotes(bill);
        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationId: nation.id, nationName: nation.name, votesFor: floorVotes.votesFor, votesAgainst: floorVotes.votesAgainst, votesAbstain: floorVotes.votesAbstain, articleCount: (bill.bill_articles || []).length, billNameOverride: bill.bill_name + ' (auto-signed by President)' });

        results.push({ billId: bill.id, billName: bill.bill_name, action: 'auto_signed' });
    }
    return results;
}

/**
 * Pre-election candidate registration: PRESIDENTIAL_CANDIDATE_LEAD_TICKS (6) ticks
 * before a scheduled presidential election, register each party's leader as their
 * presidential candidate. The party leader IS the nominee — no player choice.
 *
 * For incumbent presidents, the incumbent is locked in (unless term-limited).
 * Candidates are stored in pm_candidates with candidate_type = 'presidential'
 * and selected = true.
 */
export async function triggerPresidentialCandidateSelection(supabase, nation, currentTick) {
    if (!isPresidentialRepublic(nation)) return;

    const leadTicks = GAME_CONFIG.PRESIDENTIAL_CANDIDATE_LEAD_TICKS;

    // Find scheduled presidential elections that are within leadTicks away
    const targetTick = currentTick + leadTicks;
    const { data: upcomingElection } = await supabase
        .from('elections')
        .select('id, election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .gt('election_tick', currentTick)
        .lte('election_tick', targetTick)
        .order('election_tick', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (!upcomingElection) return;

    // Check if candidates were already registered for this election
    const { count: existingCount } = await supabase
        .from('pm_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential');

    if (existingCount > 0) return; // already registered

    console.log(`Registering party leaders as presidential candidates for ${nation.name} (election at tick ${upcomingElection.election_tick})`);

    // Check for active incumbent president
    const { data: incumbentPresident } = await supabase
        .from('presidents')
        .select('id, faction_id, first_name, last_name, age, ideology, trait, trait_upside, trait_downside, terms_served')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Get all parties in this nation
    const { data: allParties } = await supabase
        .from('factions')
        .select('id, faction_name')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!allParties || allParties.length === 0) return;

    const termLimit = getPresidentialTermLimit(nation);

    for (const party of allParties) {
        try {
            const isIncumbentParty = incumbentPresident && party.id === incumbentPresident.faction_id;
            const isTermLimited = termLimit !== null && isIncumbentParty && (incumbentPresident.terms_served || 1) >= termLimit;

            if (isIncumbentParty && !isTermLimited) {
                // === INCUMBENT LOCK-IN: use incumbent president's data ===
                const { ideologyAxis, ideologyDirection } = await computeDominantIdeologyAxis(supabase, incumbentPresident.faction_id);

                await supabase.from('pm_candidates').delete()
                    .eq('nation_id', nation.id)
                    .eq('faction_id', incumbentPresident.faction_id)
                    .eq('candidate_type', 'presidential');

                const { error: incumbentErr } = await supabase.from('pm_candidates').insert({
                    nation_id: nation.id,
                    faction_id: incumbentPresident.faction_id,
                    first_name: incumbentPresident.first_name,
                    last_name: incumbentPresident.last_name,
                    age: incumbentPresident.age,
                    ideology: incumbentPresident.ideology || 'PROGRESS',
                    ideology_axis: ideologyAxis,
                    ideology_direction: ideologyDirection,
                    trait_key: incumbentPresident.trait || null,
                    created_at_tick: currentTick,
                    candidate_type: 'presidential',
                    selected: true
                });

                if (incumbentErr) {
                    console.error(`Error creating incumbent candidate for ${incumbentPresident.first_name} ${incumbentPresident.last_name}:`, incumbentErr);
                } else {
                    console.log(`INCUMBENT LOCK-IN: President ${incumbentPresident.first_name} ${incumbentPresident.last_name} auto-locked as ${party.faction_name}'s candidate (${nation.name})`);
                }
            } else {
                // Register party leader as candidate (term-limited incumbent or non-incumbent party)
                if (isIncumbentParty && isTermLimited) {
                    console.log(`TERM LIMIT: President ${incumbentPresident.first_name} ${incumbentPresident.last_name} has served ${incumbentPresident.terms_served} term(s) (limit: ${termLimit}). ${party.faction_name}'s party leader will be the candidate. (${nation.name})`);
                }
                await registerPartyLeaderAsCandidate(supabase, nation.id, party.id, currentTick);
            }
        } catch (partyErr) {
            console.error(`Error registering presidential candidate for party ${party.faction_name} (${party.id}) in ${nation.name}:`, partyErr);
        }
    }

    // Fire system event for incumbent lock-in (only if not term-limited)
    const incumbentIsTermLimited = incumbentPresident && termLimit !== null && (incumbentPresident.terms_served || 1) >= termLimit;
    if (incumbentPresident && !incumbentIsTermLimited) {
        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'incumbent_lockin',
                p_nation_id: nation.id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation.name,
                    president_name: `${incumbentPresident.first_name} ${incumbentPresident.last_name}`,
                    election_tick: String(upcomingElection.election_tick),
                    ticks_remaining: String(leadTicks)
                }
            });
        } catch (e) { console.warn('Incumbent lock-in event fire failed (non-blocking):', e); }
    }
}

/**
 * Safety net: if an active president's term has expired and no presidential election
 * is scheduled, schedule one immediately. Also deactivates the president if term
 * has expired and a new president was already elected (shouldn't happen, but guards).
 */
export async function processPresidentialTermEnd(supabase, nation, currentTick) {
    if (!isPresidentialRepublic(nation)) return;

    const { data: president } = await supabase
        .from('presidents')
        .select('id, faction_id, term_ends_tick')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!president) return;

    // Term hasn't expired yet
    if (president.term_ends_tick > currentTick) return;

    // Term has expired — check if a presidential election is already scheduled
    const { data: scheduledElection } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .limit(1)
        .maybeSingle();

    if (!scheduledElection) {
        // No election scheduled — schedule with enough lead time for candidate registration
        const leadTicks = GAME_CONFIG.PRESIDENTIAL_CANDIDATE_LEAD_TICKS + 1; // +1 so trigger fires before election
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: currentTick + leadTicks,
            election_type: 'presidential',
            status: 'scheduled'
        });
        console.log(`Emergency presidential election scheduled for ${nation.name} at tick ${currentTick + leadTicks} (term expired, ${leadTicks} tick lead time for candidates)`);
    }
}

/**
 * Safety-net: ensure every party has a registered presidential candidate before
 * the election runs. Since party leaders are now the automatic nominees, this
 * registers any party that was missed by triggerPresidentialCandidateSelection.
 */
export async function autoSelectPresidentialCandidates(supabase, nation, currentTick) {
    // Find which factions already have a registered candidate
    const { data: existing } = await supabase
        .from('pm_candidates')
        .select('faction_id')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential')
        .eq('selected', true);

    const registeredFactions = new Set((existing || []).map(r => r.faction_id));

    // Get all parties
    const { data: allParties } = await supabase
        .from('factions')
        .select('id, faction_name')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    if (!allParties) return;

    // Check for active incumbent (respect incumbent lock-in)
    const { data: incumbentPresident } = await supabase
        .from('presidents')
        .select('id, faction_id, first_name, last_name, age, ideology, trait, terms_served')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    const termLimit = getPresidentialTermLimit(nation);

    for (const party of allParties) {
        if (registeredFactions.has(party.id)) continue;
        try {
            const isIncumbentParty = incumbentPresident && party.id === incumbentPresident.faction_id;
            const isTermLimited = termLimit !== null && isIncumbentParty && (incumbentPresident.terms_served || 1) >= termLimit;

            if (isIncumbentParty && !isTermLimited) {
                // Incumbent lock-in: use incumbent president's data, not party leader
                console.log(`Auto-registering INCUMBENT ${incumbentPresident.first_name} ${incumbentPresident.last_name} as candidate for ${party.faction_name} in ${nation.name}`);
                const { ideologyAxis, ideologyDirection } = await computeDominantIdeologyAxis(supabase, incumbentPresident.faction_id);
                const { error: delErr } = await supabase.from('pm_candidates').delete()
                    .eq('nation_id', nation.id).eq('faction_id', party.id).eq('candidate_type', 'presidential');
                if (delErr) console.warn(`[autoSelect] delete error for incumbent party ${party.faction_name}:`, delErr.message);

                const { error: insErr } = await supabase.from('pm_candidates').insert({
                    nation_id: nation.id, faction_id: party.id,
                    first_name: incumbentPresident.first_name, last_name: incumbentPresident.last_name,
                    age: incumbentPresident.age, ideology: incumbentPresident.ideology || 'PROGRESS',
                    ideology_axis: ideologyAxis, ideology_direction: ideologyDirection,
                    trait_key: incumbentPresident.trait || null,
                    created_at_tick: currentTick, candidate_type: 'presidential', selected: true
                });
                if (insErr) console.error(`[autoSelect] Error creating incumbent candidate:`, insErr);
            } else {
                console.log(`Auto-registering party leader as presidential candidate for ${party.faction_name} in ${nation.name}`);
                await registerPartyLeaderAsCandidate(supabase, nation.id, party.id, currentTick);
            }
        } catch (e) {
            console.error(`Error auto-registering presidential candidate for ${party.faction_name} in ${nation.name}:`, e);
        }
    }
}

/**
 * Safety net for parliamentary systems: if no active HOG exists after coalition
 * formation, auto-appoint the PM party's leader.
 */
export async function processParliamentaryPMTimeout(supabase, nation, currentTick) {
    if (!isParliamentaryDemocracy(nation)) return;

    const coalition = await fetchActiveCoalition(supabase, nation.id);
    if (!coalition || coalition.status !== 'formed') return;

    const { data: existingHOG } = await supabase
        .from('head_of_government')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('active', true)
        .limit(1)
        .maybeSingle();
    if (existingHOG) return;

    const pmPartyId = coalition.ministry_assignments?.prime_minister || coalition.lead_party_id;
    if (!pmPartyId) return;

    try {
        await autoAppointPartyLeaderAsPM(supabase, nation.id, pmPartyId, currentTick);
        console.log(`Auto-appointed party leader as PM for ${nation.name} (tick timeout recovery)`);
    } catch (e) {
        console.error(`Error auto-appointing parliamentary PM for ${nation.name}:`, e);
    }
}

// ==================== NOMINEE SELF-REJECTION ====================

/**
 * Called when the nominated party votes NO on their own minister confirmation bill.
 * Immediately ends the vote as failed, applies -2 gov approval to the president,
 * and clears the pending nominee.
 *
 * @param {object} supabase
 * @param {string} billId - The minister_confirmation bill
 * @param {string} nomineePartyId - The faction that is the nominee (and voted NO)
 */
export async function rejectOwnNomination(supabase, billId, nomineePartyId) {
    const { data: bill } = await supabase.from('bills')
        .select('id, bill_name, bill_type, nation_id, ministry_key, status, proposed_by')
        .eq('id', billId).single();
    if (!bill || bill.bill_type !== 'minister_confirmation' || bill.status !== 'floor') {
        throw new Error('Bill is not an active minister confirmation vote');
    }

    const mKey = bill.ministry_key;
    if (!mKey) throw new Error('No ministry_key on confirmation bill');

    // Validate the nominee is actually the pending nominee for this ministry
    const { data: ministry } = await supabase.from('ministries')
        .select('id, pending_minister')
        .eq('nation_id', bill.nation_id).eq('ministry_key', mKey).eq('is_active', true)
        .maybeSingle();

    if (!ministry?.pending_minister || ministry.pending_minister.party_id !== nomineePartyId) {
        throw new Error('Your party is not the nominee for this confirmation');
    }

    // 1. Fail the bill immediately
    await failBill(supabase, bill);

    // 2. Clear pending nomination
    await supabase.from('ministries').update({
        confirmation_status: 'rejected',
        pending_minister: null
    }).eq('id', ministry.id);

    // 3. Apply -2 government approval event (penalty to the president)
    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, -2, 'minister:nominee_self_rejected');

    // 4. Fire system event
    try {
        const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick: shard?.current_tick || 0, votesFor: 0, votesAgainst: 0, votesAbstain: 0, sponsor: 'President', billNameOverride: bill.bill_name + ' (Nominee declined)' });
    } catch (e) { /* non-blocking */ }

    console.log(`Nominee self-rejection: party ${nomineePartyId} declined nomination for ${mKey} (bill ${billId}). -2 gov approval applied.`);
    return { rejected: true, ministryKey: mKey };
}

// Tick lock and tick mutation are intentionally Edge Function only.
