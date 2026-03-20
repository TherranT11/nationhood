/**
 * elections.js — Administration lifecycle, coalition dissolution, elections, government vacancy
 * Extracted from game-common.js
 */

import { FORMATION_DEADLINE_TICKS, GAME_CONFIG, SNAP_COOLDOWN_GAP, getPresidentialTermTicks, getPresidentialTermLimit } from './config.js';
import { CANONICAL_GOVERNMENT_TYPES, getCanonicalGovernmentType, isAutocracy, isPresidentialRepublic } from './government-types.js';
import { loadFactionIdeology } from './ideology.js';
import { snapshotNationStats } from './stats.js';
import { adjustMomentumAll } from './momentum.js';
import { fetchActiveCoalition } from './government-structure.js';
import { syncAmbassadorsForFailedConfirmationBills, syncMinistriesForFailedConfirmationBills } from './bills.js';
import { autoSelectPresidentialCandidates, registerPartyLeaderAsCandidate } from './presidential.js';
import { runElectionSimulation } from './election-simulation.js';

/**
 * Close the current administration for a nation.
 * Snapshots end stats, queries bills/crises during the admin's tenure, sets end fields.
 *
 * @param {object} supabase - Supabase client
 * @param {string} nationId - Nation UUID
 * @param {object} nation - Full nation row (for stat snapshot)
 * @param {string} endReason - Why the admin ended: 'election_loss', 'new_coalition', 'coalition_collapse', 'coup'
 * @param {number} currentTick - Current shard tick
 * @param {string} currentDate - Current game date string (e.g., "March, 2001")
 * @param {number|null} governmentApproval - Current government approval percentage
 */
export async function closeAdministration(supabase, nationId, nation, endReason, currentTick, currentDate, governmentApproval) {
    try {
        // Find all currently open administrations (defensive against legacy duplicates)
        const { data: openAdmins, error: openAdminsErr } = await supabase
            .from('administrations')
            .select('*')
            .eq('nation_id', nationId)
            .is('ended_at_tick', null)
            .order('started_at_tick', { ascending: false })
            .order('created_at', { ascending: false });

        if (openAdminsErr) throw openAdminsErr;

        if (!openAdmins || openAdmins.length === 0) {
            console.warn('closeAdministration: No open administration found for nation', nationId);
            return;
        }

        if (openAdmins.length > 1) {
            console.warn('closeAdministration: duplicate open administrations detected', {
                event: 'duplicate_open_administrations',
                nation_id: nationId,
                open_count: openAdmins.length,
                open_admin_ids: openAdmins.map(a => a.id),
                resolution: 'closing_all_open_rows_with_consistent_end_fields',
                end_reason: endReason,
                end_tick: currentTick
            });
        }

        const statsAtEnd = snapshotNationStats(nation);

        for (const currentAdmin of openAdmins) {
            // Query bills passed during this administration (exclude repeals — tracked separately)
            const { data: passedBills, error: passedBillsErr } = await supabase
                .from('bills')
                .select('id, bill_name, passed_tick')
                .eq('nation_id', nationId)
                .eq('status', 'passed')
                .neq('bill_type', 'repeal')
                .gte('passed_tick', currentAdmin.started_at_tick)
                .lte('passed_tick', currentTick);
            if (passedBillsErr) throw passedBillsErr;

            const billsPassed = (passedBills || []).map(b => ({
                bill_id: b.id,
                bill_name: b.bill_name,
                passed_tick: b.passed_tick
            }));

            // Query repeal bills that passed during this administration
            const { data: repealBills, error: repealBillsErr } = await supabase
                .from('bills')
                .select('id, bill_name, passed_tick')
                .eq('nation_id', nationId)
                .eq('bill_type', 'repeal')
                .eq('status', 'passed')
                .gte('passed_tick', currentAdmin.started_at_tick)
                .lte('passed_tick', currentTick);
            if (repealBillsErr) throw repealBillsErr;

            const lawsRepealed = (repealBills || []).map(b => ({
                bill_id: b.id,
                bill_name: b.bill_name,
                repealed_tick: b.passed_tick
            }));

            // Query crises (events with category 'crisis' or matching crisis event names)
            const { data: eventsDuring, error: eventsErr } = await supabase
                .from('event_log')
                .select('event_id, event_name, category, fired_at_tick, description_chosen')
                .eq('nation_id', nationId)
                .gte('fired_at_tick', currentAdmin.started_at_tick)
                .lte('fired_at_tick', currentTick);
            if (eventsErr) throw eventsErr;

            const crisisEvents = (eventsDuring || []).filter(e =>
                e.category === 'crisis' || e.category === 'disaster' || e.category === 'conflict'
            );

            const crisesStarted = crisisEvents
                .filter(e => !e.event_name || !e.event_name.startsWith('CRISIS_RESOLVED:'))
                .map(e => ({
                    event_id: e.event_id,
                    title: e.event_name,
                    started_tick: e.fired_at_tick
                }));

            const crisesSolved = (eventsDuring || [])
                .filter(e => e.event_name && e.event_name.startsWith('CRISIS_RESOLVED:'))
                .map(e => ({
                    title: e.event_name.replace('CRISIS_RESOLVED: ', ''),
                    solved_tick: e.fired_at_tick
                }));

            // Count elections survived (elections that occurred during this admin where the coalition continued)
            const { data: electionsDuring, error: electionsErr } = await supabase
                .from('elections')
                .select('id, election_tick')
                .eq('nation_id', nationId)
                .eq('status', 'completed')
                .gte('election_tick', currentAdmin.started_at_tick)
                .lt('election_tick', currentTick);
            if (electionsErr) throw electionsErr;

            // Query trade agreements enacted during this administration
            const { data: tradeAgreementsDuring, error: taErr } = await supabase
                .from('trade_agreements')
                .select('id, agreement_type, agreement_name, nation_a_id, nation_b_id, enacted_at_tick, status')
                .or(`nation_a_id.eq.${nationId},nation_b_id.eq.${nationId}`)
                .gte('enacted_at_tick', currentAdmin.started_at_tick)
                .lte('enacted_at_tick', currentTick);
            if (taErr) throw taErr;

            const tradeAgreements = (tradeAgreementsDuring || []).map(ta => ({
                agreement_id: ta.id,
                agreement_type: ta.agreement_type,
                agreement_name: ta.agreement_name,
                partner_nation_id: ta.nation_a_id === nationId ? ta.nation_b_id : ta.nation_a_id,
                enacted_at_tick: ta.enacted_at_tick,
                status: ta.status
            }));

            // Query bills that failed during this administration
            const { data: failedBillRows } = await supabase
                .from('bills')
                .select('id, bill_name, bill_type, passed_tick, created_at')
                .eq('nation_id', nationId)
                .eq('status', 'failed')
                .neq('bill_type', 'repeal')
                .gte('created_at', currentAdmin.created_at || '1900-01-01')
                .lte('created_at', new Date().toISOString());
            const billsFailed = (failedBillRows || [])
                .filter(b => {
                    // Use passed_tick if available (some failed bills may not have it)
                    if (b.passed_tick != null) return b.passed_tick >= currentAdmin.started_at_tick && b.passed_tick <= currentTick;
                    return true; // created_at filter already scoped it
                })
                .map(b => ({ bill_id: b.id, bill_name: b.bill_name, bill_type: b.bill_type || 'standard' }));

            // Query no-confidence votes during this administration
            const { data: nocRows } = await supabase
                .from('bills')
                .select('id, bill_name, status, passed_tick')
                .eq('nation_id', nationId)
                .eq('bill_type', 'no_confidence')
                .gte('passed_tick', currentAdmin.started_at_tick)
                .lte('passed_tick', currentTick);
            const noConfidenceVotes = (nocRows || []).map(b => ({
                bill_id: b.id, bill_name: b.bill_name, result: b.status === 'passed' ? 'passed' : 'failed', tick: b.passed_tick
            }));

            // Query impeachment motions/convictions during this administration
            const { data: impeachRows } = await supabase
                .from('bills')
                .select('id, bill_name, bill_type, status, passed_tick')
                .eq('nation_id', nationId)
                .in('bill_type', ['impeachment_motion', 'impeachment_conviction'])
                .gte('passed_tick', currentAdmin.started_at_tick)
                .lte('passed_tick', currentTick);
            const impeachments = (impeachRows || []).map(b => ({
                bill_id: b.id, bill_name: b.bill_name, type: b.bill_type, result: b.status === 'passed' ? 'passed' : 'failed', tick: b.passed_tick
            }));

            // Query executive orders issued during this administration
            const { data: eoRows } = await supabase
                .from('executive_orders')
                .select('id, order_type, issued_at_tick')
                .eq('nation_id', nationId)
                .gte('issued_at_tick', currentAdmin.started_at_tick)
                .lte('issued_at_tick', currentTick);
            const executiveOrders = (eoRows || []).map(eo => ({
                id: eo.id, order_type: eo.order_type, tick: eo.issued_at_tick
            }));

            // Detect snap elections and minority governments from event_log
            const snapEvents = (eventsDuring || []).filter(e =>
                e.event_name && (e.event_name.includes('snap_election') || e.event_name.includes('formation_snap_election') || e.event_name.includes('early_election'))
            ).map(e => ({ title: e.event_name, tick: e.fired_at_tick }));

            const minorityEvents = (eventsDuring || []).filter(e =>
                e.event_name && e.event_name.includes('minority_government')
            ).map(e => ({ title: e.event_name, tick: e.fired_at_tick }));

            // Detect leader changes from event_log (Party Leadership appointments)
            const leaderChangeEvents = (eventsDuring || []).filter(e =>
                e.event_name && e.event_name === 'New Party Leader'
            ).map(e => ({ role: e.event_name, description: e.description_chosen || '', tick: e.fired_at_tick }));

            // Update the administration record
            const { error: updateErr } = await supabase
                .from('administrations')
                .update({
                    stats_at_end: statsAtEnd,
                    approval_at_end: governmentApproval,
                    ended_at_tick: currentTick,
                    ended_at_date: currentDate,
                    end_reason: endReason,
                    bills_passed: billsPassed,
                    bills_failed: billsFailed,
                    laws_repealed: lawsRepealed,
                    crises_started: crisesStarted,
                    crises_solved: crisesSolved,
                    elections_survived: (electionsDuring || []).length,
                    trade_agreements: tradeAgreements,
                    no_confidence_votes: noConfidenceVotes,
                    impeachments: impeachments,
                    executive_orders: executiveOrders,
                    snap_elections: snapEvents,
                    minority_governments: minorityEvents,
                    leader_changes: leaderChangeEvents,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentAdmin.id);
            if (updateErr) throw updateErr;

            console.log(`Administration closed: "${currentAdmin.admin_name}" — reason: ${endReason}`);
        }
    } catch (err) {
        console.error('closeAdministration error:', err);
        throw err;
    }
}

/**
 * Create a new administration record when a coalition forms.
 *
 * @param {object} supabase - Supabase client
 * @param {string} nationId - Nation UUID
 * @param {object} nation - Full nation row (for stat snapshot + HOS)
 * @param {object} coalition - Active coalition object (party_ids, lead_party_id)
 * @param {Array} allParties - Array of faction objects with id, faction_name, seats
 * @param {number} currentTick - Current shard tick
 * @param {string} currentDate - Current game date string
 * @param {number|null} governmentApproval - Current government approval percentage
 */
export async function createAdministration(supabase, nationId, nation, coalition, allParties, currentTick, currentDate, governmentApproval) {
    try {
        // Safety net: close any orphaned open administrations before creating a new one
        const { data: orphaned } = await supabase
            .from('administrations')
            .select('id')
            .eq('nation_id', nationId)
            .is('ended_at_tick', null);
        if (orphaned && orphaned.length > 0) {
            console.warn(`createAdministration: closing ${orphaned.length} orphaned open administration(s) for nation ${nationId}`);
            await supabase
                .from('administrations')
                .update({ ended_at_tick: currentTick, ended_at_date: currentDate, end_reason: 'new_coalition' })
                .eq('nation_id', nationId)
                .is('ended_at_tick', null);
        }

        const statsAtStart = snapshotNationStats(nation);

        // Build coalition party info
        const coalitionPartyIds = coalition?.party_ids || [];
        const coalitionParties = coalitionPartyIds.map(pid => {
            const party = allParties.find(p => p.id === pid);
            return {
                party_id: pid,
                party_name: party?.faction_name || 'Unknown',
                seats: party?.seats || 0
            };
        });
        const totalSeats = coalitionParties.reduce((sum, p) => sum + p.seats, 0);

        // Get PM party info
        const leadPartyId = coalition?.lead_party_id;
        const leadParty = allParties.find(p => p.id === leadPartyId);
        const pmPartyName = leadParty?.faction_name || 'Unknown';

        // Get active PM name
        const { data: activeHOG } = await supabase
            .from('head_of_government')
            .select('first_name, last_name')
            .eq('nation_id', nationId)
            .eq('active', true)
            .maybeSingle();

        const pmName = activeHOG ? `${activeHOG.first_name} ${activeHOG.last_name}` : null;

        // Head of state name
        const hosName = (nation.head_of_state_first_name && nation.head_of_state_last_name)
            ? `${nation.head_of_state_first_name} ${nation.head_of_state_last_name}`
            : null;

        // Generate admin name from PM last name, falling back to HOS
        const adminName = activeHOG?.last_name
            ? `${activeHOG.last_name} Administration`
            : (nation.head_of_state_last_name
                ? `${nation.head_of_state_last_name} Administration`
                : `${pmPartyName} Administration`);

        const { error: insertErr } = await supabase
            .from('administrations')
            .insert({
                nation_id: nationId,
                admin_name: adminName,
                head_of_state: hosName,
                prime_minister: pmName,
                pm_party_name: pmPartyName,
                pm_party_id: leadPartyId,
                coalition_parties: coalitionParties,
                total_seats: totalSeats,
                government_type: getCanonicalGovernmentType(nation),
                started_at_tick: currentTick,
                started_at_date: currentDate,
                stats_at_start: statsAtStart,
                approval_at_start: governmentApproval
            });
        if (insertErr) throw insertErr;

        // Fire timeline event for government formed
        try {
            const partyNames = coalitionParties.map(p => p.party_name).join(', ');
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'government_formed',
                p_nation_id: nationId,
                p_tick: currentTick,
                p_placeholders: {
                    admin_name: adminName,
                    pm: pmName || 'Unknown',
                    pm_party: pmPartyName,
                    coalition_parties: partyNames,
                    total_seats: String(totalSeats)
                }
            });
        } catch (e) { /* non-blocking */ }

        console.log(`Administration created: "${adminName}" at tick ${currentTick}`);
    } catch (err) {
        console.error('createAdministration error:', err);
        throw err;
    }
}

/**
 * Atomically close existing open administrations and create a new one.
 * Falls back to sequential close + create if RPC is unavailable.
 */
export async function rolloverAdministration(supabase, nationId, nation, endReason, coalition, allParties, currentTick, currentDate, governmentApproval) {
    const statsAtStart = snapshotNationStats(nation);

    const coalitionPartyIds = coalition?.party_ids || [];
    const coalitionParties = coalitionPartyIds.map(pid => {
        const party = allParties.find(p => p.id === pid);
        return {
            party_id: pid,
            party_name: party?.faction_name || 'Unknown',
            seats: party?.seats || 0
        };
    });
    const totalSeats = coalitionParties.reduce((sum, p) => sum + p.seats, 0);

    const leadPartyId = coalition?.lead_party_id;
    const leadParty = allParties.find(p => p.id === leadPartyId);
    const pmPartyName = leadParty?.faction_name || 'Unknown';

    const { data: activeHOG, error: hogErr } = await supabase
        .from('head_of_government')
        .select('first_name, last_name')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();
    if (hogErr) throw hogErr;

    const pmName = activeHOG ? `${activeHOG.first_name} ${activeHOG.last_name}` : null;
    const hosName = (nation.head_of_state_first_name && nation.head_of_state_last_name)
        ? `${nation.head_of_state_first_name} ${nation.head_of_state_last_name}`
        : null;
    const adminName = activeHOG?.last_name
        ? `${activeHOG.last_name} Administration`
        : (nation.head_of_state_last_name
            ? `${nation.head_of_state_last_name} Administration`
            : `${pmPartyName} Administration`);

    const payload = {
        nation_id: nationId,
        admin_name: adminName,
        head_of_state: hosName,
        prime_minister: pmName,
        pm_party_name: pmPartyName,
        pm_party_id: leadPartyId,
        coalition_parties: coalitionParties,
        total_seats: totalSeats,
        government_type: getCanonicalGovernmentType(nation),
        started_at_tick: currentTick,
        started_at_date: currentDate,
        stats_at_start: statsAtStart,
        approval_at_start: governmentApproval
    };

    const { error: rpcErr } = await supabase.rpc('rollover_administration', {
        p_nation_id: nationId,
        p_end_reason: endReason,
        p_end_tick: currentTick,
        p_end_date: currentDate,
        p_end_approval: governmentApproval,
        p_new_administration: payload
    });

    if (!rpcErr) {
        console.log(`Administration rolled over atomically: "${adminName}" at tick ${currentTick}`);
        return;
    }

    // Graceful fallback if DB function has not been deployed yet
    const rpcUnavailable = /rollover_administration/i.test(rpcErr.message || '') || rpcErr.code === 'PGRST202';
    if (!rpcUnavailable) throw rpcErr;

    console.warn('rolloverAdministration RPC unavailable; falling back to sequential close + create');
    await closeAdministration(supabase, nationId, nation, endReason, currentTick, currentDate, governmentApproval);
    await createAdministration(supabase, nationId, nation, coalition, allParties, currentTick, currentDate, governmentApproval);
}


// ==================== COALITION DISSOLUTION ====================

/**
 * Dissolve the current coalition government.
 * - Sets government_formations status to 'dissolved'
 * - Deactivates PM in head_of_government
 * - Vacates all ministries
 * Nation enters formation period (processGovernmentVacancy handles penalties).
 */
export async function dissolveCoalition(supabase, nationId, excludeFormationId) {
    // Bust coalition cache so pages immediately see the dissolved state
    if (typeof qCacheBust === 'function') qCacheBust('coalition_' + nationId);

    // Dissolve government_formations (skip the new formation if one is being created)
    let dissolveQuery = supabase
        .from('government_formations')
        .update({ status: 'dissolved' })
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker']);
    if (excludeFormationId) dissolveQuery = dissolveQuery.neq('id', excludeFormationId);
    const { error: formErr } = await dissolveQuery;
    if (formErr) console.warn('dissolveCoalition: formations update failed:', formErr);

    // Also dissolve legacy active_coalitions
    const { error: acErr } = await supabase
        .from('active_coalitions')
        .update({ status: 'dissolved', dissolved_at: new Date().toISOString() })
        .eq('nation_id', nationId)
        .is('dissolved_at', null);
    if (acErr) console.warn('dissolveCoalition: active_coalitions update failed:', acErr);

    // Deactivate PM
    const { error: pmErr } = await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('nation_id', nationId)
        .eq('active', true);
    if (pmErr) console.warn('dissolveCoalition: PM deactivation failed:', pmErr);

    // Vacate all ministries
    const { error: minErr } = await supabase
        .from('ministries')
        .update({
            minister_first_name: null,
            minister_last_name: null,
            minister_age: null,
            party_id: null
        })
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (minErr) console.warn('dissolveCoalition: ministry vacating failed:', minErr);
}


// ==================== NO-CONFIDENCE RESOLUTION ====================

/**
 * Resolve a passed or failed vote of no confidence.
 *
 * PASSED:
 *   - Coalition immediately dissolved (all ministries vacated, PM removed)
 *   - Calling party gets +3 approval
 *   - All coalition parties get -5 approval
 *   - Event logged
 *
 * FAILED:
 *   - Calling party gets -5 approval
 *   - PM's party gets +3 approval
 *   - 6-tick cooldown recorded
 *   - Event logged
 */
export async function resolveNoConfidence(supabase, bill, passed, votesFor, votesAgainst, currentTick) {
    const callingPartyId = bill.proposed_by;
    const nationId = bill.nation_id;

    const { data: nation } = await supabase
        .from('nations')
        .select('name, government_type')
        .eq('id', nationId)
        .single();

    // Presidential systems do not have votes of no confidence
    if (isPresidentialRepublic(nation)) return;

    // Get PM's last name for event text
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('last_name, faction_id')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();

    const pmLastName = hog?.last_name || 'Unknown';
    const pmFactionId = hog?.faction_id || null;

    if (passed) {
        // Get coalition party IDs before dissolving
        const coalition = await fetchActiveCoalition(supabase, nationId);
        const coalitionPartyIds = coalition?.party_ids || [];

        // Guard: skip dissolution if coalition was already dissolved (e.g. by election on same tick)
        if (!coalition || coalition.status === 'dissolved') {
            console.warn('resolveNoConfidence: coalition already dissolved, skipping dissolution penalties');
        } else {
            // Close the current administration before dissolving
            try {
                const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();
                const { data: shard } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                if (fullNation) {
                    await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || '', null);
                }
            } catch (adminErr) { console.warn('Could not close administration on no-confidence:', adminErr); }

            // Dissolve coalition
            await dissolveCoalition(supabase, nationId);

            // Calling party gets +3 momentum
            await adjustMomentumAll(supabase, nationId, callingPartyId, 3, 'no_confidence:success');

            // All coalition parties get -5 momentum
            for (const partyId of coalitionPartyIds) {
                await adjustMomentumAll(supabase, nationId, partyId, -5, 'no_confidence:coalition_falls');
            }

            // Schedule snap election (same pattern as early elections)
            await supabase.from('elections').delete()
                .eq('nation_id', nationId).eq('status', 'scheduled');
            await supabase.from('elections').insert({
                nation_id: nationId,
                election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
                status: 'scheduled',
                election_type: 'parliamentary'
            });

            // Freeze active bills (same as early elections)
            await supabase.from('bills')
                .update({ status: 'frozen' })
                .eq('nation_id', nationId)
                .in('status', ['committee', 'floor']);

            // Log event
            await supabase.from('event_log').insert({
                nation_id: nationId,
                event_name: 'No Confidence — Government Falls',
                trigger_key: 'vonc_passed',
                fired_at_tick: currentTick,
                category: 'government',
                description_chosen: `The ${pmLastName} Government has fallen. A motion of no confidence passed ${votesFor} to ${votesAgainst}. Snap elections scheduled.`,
                effects_applied: { coalition_dissolved: true, caller_approval: +3, coalition_approval: -5, election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS, bills_frozen: true }
            });
        } // end else (coalition not already dissolved)

    } else {
        // FAILED: calling party gets -5 momentum
        await adjustMomentumAll(supabase, nationId, callingPartyId, -5, 'no_confidence:failed');

        // PM's party gets +3 momentum
        if (pmFactionId) {
            await adjustMomentumAll(supabase, nationId, pmFactionId, 3, 'no_confidence:pm_survives');
        }

        // Record cooldown: store the tick when the no-confidence failed
        await supabase.from('campaign_actions').insert({
            party_id: callingPartyId,
            nation_id: nationId,
            action_type: 'no_confidence_failed',
            tick_performed: currentTick,
            result: { votes_for: votesFor, votes_against: votesAgainst, pm_last_name: pmLastName }
        });

        // Log event
        await supabase.from('event_log').insert({
            nation_id: nationId,
            event_name: 'No Confidence — Motion Fails',
            trigger_key: 'vonc_failed',
            fired_at_tick: currentTick,
            category: 'government',
            description_chosen: `Motion of no confidence against the ${pmLastName} Government failed ${votesFor} to ${votesAgainst}.`,
            effects_applied: { caller_approval: -5, pm_approval: +3 }
        });
    }
}


// ==================== EARLY ELECTIONS ====================

/**
 * Call for early elections (PM action).
 * Transitions government to caretaker, freezes legislation, schedules election in 2 ticks.
 *
 * @param {object} supabase    - Supabase client
 * @param {string} nationId    - Nation UUID
 * @param {string} pmFactionId - PM's faction UUID
 * @param {Array}  coalitionPartyIds - All coalition party IDs
 */
export async function callEarlyElectionsAction(supabase, nationId, pmFactionId, coalitionPartyIds) {
    // Presidential systems cannot call early elections
    const { data: nationCheck } = await supabase.from('nations').select('government_type').eq('id', nationId).single();
    if (isPresidentialRepublic(nationCheck)) return { success: false, error: 'Presidential systems cannot call early elections' };

    // 0. Server-side guard: only proceed if coalition is still 'formed' (check both tables)
    let govStatus = null;
    const { data: activeGov } = await supabase
        .from('government_formations')
        .select('id, status')
        .eq('nation_id', nationId)
        .in('status', ['formed', 'caretaker'])
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (activeGov) {
        govStatus = activeGov.status;
    } else {
        // Fallback: check legacy active_coalitions
        const { data: legacyGov } = await supabase
            .from('active_coalitions')
            .select('id, status')
            .eq('nation_id', nationId)
            .is('dissolved_at', null)
            .order('formed_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        govStatus = legacyGov?.status || 'formed'; // legacy rows without status default to formed
    }

    if (govStatus === 'caretaker') {
        throw new Error('The government is already in caretaker mode.');
    }

    // 1. Get current tick
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    const currentTick = shard?.current_tick || 0;

    // 2. Set government to caretaker (both tables — legacy active_coalitions may be source)
    // Use status='formed' filter as optimistic lock — only one caller can transition formed→caretaker
    const { data: updatedGov, count: updatedCount } = await supabase
        .from('government_formations')
        .update({ status: 'caretaker' })
        .eq('nation_id', nationId)
        .in('status', ['formed'])
        .select('id');
    if (!updatedGov || updatedGov.length === 0) {
        throw new Error('Government was already changed by another action. Please refresh.');
    }
    await supabase
        .from('active_coalitions')
        .update({ status: 'caretaker' })
        .eq('nation_id', nationId)
        .is('dissolved_at', null);

    // 3. Apply approval penalties — PM party: -5, other coalition parties: -3
    // (After status transition so penalties aren't lost if transition fails)
    for (const partyId of coalitionPartyIds) {
        const penalty = partyId === pmFactionId
            ? GAME_CONFIG.EARLY_ELECTION_PM_APPROVAL_COST
            : GAME_CONFIG.EARLY_ELECTION_COALITION_APPROVAL_COST;
        await adjustMomentumAll(supabase, nationId, partyId, -penalty, 'early_election:penalty');
    }

    // Bust coalition cache after caretaker transition
    if (typeof qCacheBust === 'function') qCacheBust('coalition_' + nationId);

    // 4. Cancel any existing scheduled elections
    await supabase
        .from('elections')
        .delete()
        .eq('nation_id', nationId)
        .eq('status', 'scheduled');

    // 5. Schedule early election
    await supabase.from('elections').insert({
        nation_id: nationId,
        election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
        status: 'scheduled',
        election_type: 'parliamentary'
    });

    // 6. Freeze all active bills (committee and floor)
    await supabase
        .from('bills')
        .update({ status: 'frozen' })
        .eq('nation_id', nationId)
        .in('status', ['committee', 'floor']);

    // 7. Get PM name for event text
    const { data: hog } = await supabase
        .from('head_of_government')
        .select('first_name, last_name')
        .eq('nation_id', nationId)
        .eq('active', true)
        .maybeSingle();
    const pmName = hog ? `${hog.first_name} ${hog.last_name}` : 'The Prime Minister';

    // 8. Fire system event
    await supabase.from('event_log').insert({
        nation_id: nationId,
        event_name: 'Legislature Dissolved — Early Elections Called',
        trigger_key: 'snap_election_called',
        fired_at_tick: currentTick,
        category: 'government',
        description_chosen: `Prime Minister ${pmName} has dissolved the Legislature. Caretaker government in place until elections.`,
        effects_applied: {
            caretaker: true,
            election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
            pm_approval: -GAME_CONFIG.EARLY_ELECTION_PM_APPROVAL_COST,
            coalition_approval: -GAME_CONFIG.EARLY_ELECTION_COALITION_APPROVAL_COST,
            bills_frozen: true
        }
    });

    return { success: true, electionTick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS };
}


// ==================== GOVERNMENT VACANCY & FORMATION ESCALATION ====================

/**
 * Process government vacancy with 3-stage escalation for parliamentary democracies.
 *
 * After an election with no majority party:
 *   Stage 0 — Formation window (ticks 1 to FORMATION_DEADLINE_TICKS):
 *     - Every tick: -2 momentum to ALL parties, -1 stability to nation
 *     - Tick 1: notification "Formation underway, N ticks to form coalition"
 *     - Tick (FORMATION_DEADLINE_TICKS - 1): warning "1 tick remaining"
 *
 *   Stage 1 — Snap election (at FORMATION_DEADLINE_TICKS, failed_formation_attempts < 1):
 *     - Top 2 parties by seats: -6 momentum each
 *     - Non-responsive coalition invitees: -3 momentum each
 *     - Snap election scheduled for next tick
 *     - failed_formation_attempts set to 1
 *
 *   Stage 2 — Emergency minority government (at FORMATION_DEADLINE_TICKS, failed_formation_attempts >= 1):
 *     - Largest party auto-installed as minority government
 *     - formation_type = 'emergency_minority' (permanent -20% legislative penalty)
 *     - failed_formation_attempts reset to 0
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {number} currentTick - Current tick number
 * @returns {Promise<object|null>} Summary of actions taken, or null if not applicable
 */
export async function processGovernmentVacancy(supabase, nation, currentTick) {
    // Only applies to parliamentary democracies
    if (isAutocracy(nation)) return null;
    if (isPresidentialRepublic(nation)) return null;

    // Check for active coalition
    const coalition = await fetchActiveCoalition(supabase, nation.id);

    // Safety net: detect stale caretaker government with overdue election
    if (coalition && coalition.status === 'caretaker') {
        const { data: overdueElection } = await supabase
            .from('elections')
            .select('id, election_tick')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .lte('election_tick', currentTick)
            .order('election_tick', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (overdueElection) {
            const overdueBy = currentTick - overdueElection.election_tick;
            if (overdueBy >= 2) {
                await supabase.from('elections')
                    .update({ election_tick: currentTick + 1 })
                    .eq('id', overdueElection.id);
                console.log(`Safety net: rescheduled stale caretaker election ${overdueElection.id} to tick ${currentTick + 1} (was overdue by ${overdueBy} ticks)`);
            }
        }
        return null; // Caretaker is a valid government state
    }

    if (coalition) return null;

    // Get latest completed election (filter out records without results)
    const { data: election } = await supabase
        .from('elections')
        .select('id, election_tick, results')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .not('results', 'is', null)
        .order('election_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!election) return null;

    // Check if any party has outright majority (no coalition needed)
    const majoritySeatThreshold = Math.floor((nation.total_seats || GAME_CONFIG.TOTAL_SEATS) / 2) + 1;
    const votes = election.results?.votes || [];
    const majorityParty = votes.find(p => p.seats >= majoritySeatThreshold);
    if (majorityParty) return null;

    // Calculate ticks since election
    const ticksElapsed = currentTick - election.election_tick;
    if (ticksElapsed <= 0) return null;

    const result = {
        nation: nation.name,
        ticksElapsed,
        penaltiesApplied: true,
        approvalLoss: -2,
        stabilityLoss: -1
    };

    // ===== ONGOING PENALTIES (every tick during vacancy) =====
    const { data: allParties } = await supabase
        .from('factions')
        .select('id, faction_name, seats')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party')
        .order('seats', { ascending: false });

    for (const party of (allParties || [])) {
        await adjustMomentumAll(supabase, nation.id, party.id, -2, 'government_vacancy:ongoing');
    }

    // -1 stability to nation
    const newStability = Math.max(0, (nation.stability ?? 50) - 1);
    await supabase.from('nations')
        .update({ stability: newStability })
        .eq('id', nation.id);
    nation.stability = newStability;

    console.log(`Government vacancy: ${nation.name} tick ${ticksElapsed}/${FORMATION_DEADLINE_TICKS} — all parties -2 momentum, nation -1 stability (→ ${newStability})`);

    // ===== FORMATION WINDOW NOTIFICATIONS =====
    if (ticksElapsed === 1) {
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'FORMATION_WINDOW_START',
            trigger_key: 'coalition_formation_started',
            description_used: `Coalition formation underway in ${nation.name}. Parties have ${FORMATION_DEADLINE_TICKS} ticks to form a government.`,
            category: 'POLITICAL',
            effects_applied: { ticks_remaining: FORMATION_DEADLINE_TICKS, ongoing_penalty: -2 },
            fired_at_tick: currentTick
        }).then(({ error }) => {
            if (error) console.warn('Formation window start event log failed:', error.message);
        });
    } else if (ticksElapsed === FORMATION_DEADLINE_TICKS - 1) {
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'FORMATION_DEADLINE_WARNING',
            description_used: `1 tick remaining before emergency elections in ${nation.name}. Form a coalition now or face snap elections.`,
            category: 'POLITICAL',
            effects_applied: { ticks_remaining: 1 },
            fired_at_tick: currentTick
        }).then(({ error }) => {
            if (error) console.warn('Formation deadline warning event log failed:', error.message);
        });
    }

    // ===== ESCALATION CHECK =====
    if (ticksElapsed < FORMATION_DEADLINE_TICKS) {
        return result;
    }

    const failedAttempts = nation.failed_formation_attempts || 0;

    // ===== STAGE 1: SNAP ELECTION =====
    if (failedAttempts < 1) {
        console.log(`STAGE 1: SNAP ELECTION triggered for ${nation.name} — ${ticksElapsed} ticks without government (attempt ${failedAttempts + 1})`);

        // Top 2 parties: -6 momentum each
        if (allParties && allParties.length > 0) {
            const largest = allParties[0];
            await adjustMomentumAll(supabase, nation.id, largest.id, -6, 'formation_failure:top_party');
            console.log(`  Snap penalty: ${largest.faction_name} -6 momentum`);

            if (allParties.length > 1) {
                const second = allParties[1];
                await adjustMomentumAll(supabase, nation.id, second.id, -6, 'formation_failure:top_party');
                console.log(`  Snap penalty: ${second.faction_name} -6 momentum`);
            }
        }

        // Non-responsive invitee penalty: -3 momentum
        // Find parties invited to formations but never gave support
        const { data: formations } = await supabase
            .from('government_formations')
            .select('id, party_ids, proposed_by')
            .eq('election_id', election.id)
            .in('status', ['active', 'rejected', 'expired']);

        if (formations && formations.length > 0) {
            // Collect all invited parties (from party_ids, excluding the proposer)
            const invitedPartyIds = new Set();
            for (const f of formations) {
                for (const pid of (f.party_ids || [])) {
                    if (pid !== f.proposed_by) {
                        invitedPartyIds.add(pid);
                    }
                }
            }

            // Check which invitees gave support to ANY formation in this election
            const formationIds = formations.map(f => f.id);
            const { data: supportRecords } = await supabase
                .from('government_formation_support')
                .select('faction_id, supports')
                .in('formation_id', formationIds)
                .eq('supports', true);

            const respondedPartyIds = new Set((supportRecords || []).map(s => s.faction_id));

            // Penalize non-responsive invitees
            for (const pid of invitedPartyIds) {
                if (!respondedPartyIds.has(pid)) {
                    await adjustMomentumAll(supabase, nation.id, pid, -3, 'formation_failure:non_responsive');
                    const partyName = allParties?.find(p => p.id === pid)?.faction_name || pid;
                    console.log(`  Non-responsive penalty: ${partyName} -3 momentum`);
                }
            }
        }

        // Schedule snap election for next tick
        const { data: existingScheduled } = await supabase
            .from('elections')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .limit(1)
            .maybeSingle();

        if (existingScheduled) {
            await supabase.from('elections')
                .update({ election_tick: currentTick + 1 })
                .eq('id', existingScheduled.id);
            console.log(`  Moved existing scheduled election to tick ${currentTick + 1}`);
        } else {
            await supabase.from('elections').insert({
                nation_id: nation.id,
                election_tick: currentTick + 1,
                status: 'scheduled'
            });
            console.log(`  Scheduled snap election for tick ${currentTick + 1}`);
        }

        // Increment failed formation attempts
        await supabase.from('nations')
            .update({ failed_formation_attempts: failedAttempts + 1 })
            .eq('id', nation.id);
        nation.failed_formation_attempts = failedAttempts + 1;

        // Log event
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'FORMATION_SNAP_ELECTION',
            trigger_key: 'formation_snap_election',
            description_used: `Snap election called in ${nation.name} after coalition formation failed. Parties had ${FORMATION_DEADLINE_TICKS} ticks to negotiate.`,
            category: 'POLITICAL',
            effects_applied: {
                stage: 1,
                largest_party: allParties?.[0]?.faction_name,
                second_party: allParties?.[1]?.faction_name,
                top_party_penalty: -6,
                ticks_without_gov: ticksElapsed,
                failed_attempts: failedAttempts + 1
            },
            fired_at_tick: currentTick
        }).then(({ error }) => {
            if (error) console.warn('Formation snap election event log failed:', error.message);
        });

        // Fire system notification
        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'formation_snap_election',
                p_nation_id: nation.id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation.name,
                    ticks: String(ticksElapsed)
                }
            });
        } catch (e) {
            console.warn('fire_system_event (formation_snap_election) failed:', e.message);
        }

        result.snapElection = true;
        result.snapTick = currentTick + 1;
        result.stage = 1;
        return result;
    }

    // ===== STAGE 2: EMERGENCY MINORITY GOVERNMENT =====
    console.log(`STAGE 2: EMERGENCY MINORITY GOVERNMENT for ${nation.name} — second formation window expired`);

    // Identify largest party (tiebreak: higher total votes from election, then lower faction_id)
    const electionVotes = election.results?.votes || [];
    let largestParty = null;
    if (allParties && allParties.length > 0) {
        // Sort by seats DESC, then total_votes DESC, then faction_id ASC
        const partiesWithVotes = allParties.map(p => {
            const voteRecord = electionVotes.find(v => v.party_id === p.id);
            return { ...p, total_votes: voteRecord?.total_votes || 0 };
        });
        partiesWithVotes.sort((a, b) => {
            if (b.seats !== a.seats) return b.seats - a.seats;
            if (b.total_votes !== a.total_votes) return b.total_votes - a.total_votes;
            return a.id < b.id ? -1 : 1; // lower UUID first
        });
        largestParty = partiesWithVotes[0];
    }

    if (!largestParty) {
        console.error(`EMERGENCY MINORITY: No parties found for ${nation.name} — cannot form government`);
        return result;
    }

    console.log(`  Installing ${largestParty.faction_name} as emergency minority government`);

    // Create government_formations record
    const { data: emergencyGov, error: govError } = await supabase
        .from('government_formations')
        .insert({
            nation_id: nation.id,
            election_id: election.id,
            proposed_by: largestParty.id,
            party_ids: [largestParty.id],
            status: 'formed',
            formation_type: 'emergency_minority',
            formed_at: new Date().toISOString(),
            ministry_assignments: { prime_minister: largestParty.id }
        })
        .select()
        .single();

    if (govError) {
        console.error(`EMERGENCY MINORITY: Failed to create government formation for ${nation.name}:`, govError.message);
        return result;
    }

    // Set ruling faction
    await supabase.from('nations')
        .update({
            ruling_faction_id: largestParty.id,
            failed_formation_attempts: 0
        })
        .eq('id', nation.id);
    nation.failed_formation_attempts = 0;

    // Create administration record
    try {
        const coalitionObj = {
            id: emergencyGov.id,
            party_ids: [largestParty.id],
            lead_party_id: largestParty.id,
            ministry_allocations: { prime_minister: largestParty.id },
            status: 'formed',
            formation_type: 'emergency_minority'
        };
        await createAdministration(supabase, nation.id, nation, coalitionObj, allParties || [], currentTick, null, null);
    } catch (adminErr) {
        console.warn(`EMERGENCY MINORITY: Administration creation failed for ${nation.name}:`, adminErr.message);
    }

    // Log event
    await supabase.from('event_log').insert({
        nation_id: nation.id,
        event_name: 'EMERGENCY_MINORITY_GOVERNMENT',
        trigger_key: 'minority_government_formed',
        description_used: `${largestParty.faction_name} installed as emergency minority government in ${nation.name} after two failed formation windows. Legislative effectiveness reduced by 20%.`,
        category: 'POLITICAL',
        effects_applied: {
            stage: 2,
            ruling_party: largestParty.faction_name,
            ruling_party_id: largestParty.id,
            formation_type: 'emergency_minority',
            legislative_penalty: '-20%'
        },
        fired_at_tick: currentTick
    }).then(({ error }) => {
        if (error) console.warn('Emergency minority government event log failed:', error.message);
    });

    // Fire system notification
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'emergency_minority_government',
            p_nation_id: nation.id,
            p_tick: currentTick,
            p_placeholders: {
                nation: nation.name,
                party: largestParty.faction_name
            }
        });
    } catch (e) {
        console.warn('fire_system_event (emergency_minority_government) failed:', e.message);
    }

    result.emergencyMinority = true;
    result.rulingParty = largestParty.faction_name;
    result.stage = 2;
    return result;
}


// ==================== TICK PROCESSOR ====================

// ==================== PARTIAL ELECTION (FOUNDATIONAL BILL) ====================

export async function processPartialElection(supabase, nation, election, currentTick) {
    const deltaSeats = election.partial_seats;
    console.log(`Processing partial election for ${nation.name}: +${deltaSeats} new seats`);

    // 1. Load voter blocs
    const { data: blocs } = await supabase
        .from('voter_blocs').select('*')
        .eq('nation_id', nation.id).eq('is_active', true);

    if (!blocs || blocs.length === 0) {
        console.warn('No voter blocs found for partial election');
        await supabase.from('elections').update({ status: 'completed', results: { partial: true, error: 'no_blocs', bloc_details: [] } }).eq('id', election.id);
        return;
    }

    // 2. Scale bloc voter_counts to eligible_voters (same pattern as runElectionPreview)
    const eligibleVoters = nation.eligible_voters || 0;
    const totalBlocVoters = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    if (totalBlocVoters > 0 && eligibleVoters > 0) {
        const scale = eligibleVoters / totalBlocVoters;
        let scaledSum = 0;
        for (const b of blocs) {
            b.voter_count = Math.round((b.voter_count || 0) * scale);
            scaledSum += b.voter_count;
        }
        const diff = eligibleVoters - scaledSum;
        if (diff !== 0) {
            const largest = blocs.reduce((a, b) => (b.voter_count > a.voter_count ? b : a), blocs[0]);
            largest.voter_count += diff;
        }
    }

    // 3. Load parties with ideology axes
    const { data: factions } = await supabase
        .from('factions').select('id, faction_name, seats, electability')
        .eq('nation_id', nation.id).eq('faction_type', 'party');

    if (!factions || factions.length === 0) {
        console.warn('No parties found for partial election');
        await supabase.from('elections').update({ status: 'completed', results: { partial: true, error: 'no_parties', bloc_details: [] } }).eq('id', election.id);
        return;
    }

    const factionIds = factions.map(f => f.id);
    const { data: ideologies } = await supabase
        .from('faction_ideology').select('*').in('faction_id', factionIds);
    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    const parties = factions.map(f => ({
        id: f.id, faction_name: f.faction_name,
        electability: f.electability ?? 50,
        axes: ideoMap[f.id] || {
            liberty_equality: 0, tradition_progress: 0, security_freedom: 0,
            globalism_nationalism: 0, individualism_collectivism: 0
        }
    }));

    // 3b. Load per-bloc preference data
    const { data: fbaRows } = await supabase
        .from('faction_bloc_approval').select('faction_id, bloc_id, preference_score')
        .in('faction_id', factionIds);
    const allBlocApprovals = {};
    for (const row of (fbaRows || [])) {
        if (!allBlocApprovals[row.bloc_id]) allBlocApprovals[row.bloc_id] = {};
        allBlocApprovals[row.bloc_id][row.faction_id] = row.preference_score ?? 40;
    }

    // 4. Run election simulation for ONLY the delta seats
    const result = runElectionSimulation(blocs, parties, deltaSeats, allBlocApprovals);

    // 5. ADD delta seats to each party's existing seats
    for (const faction of factions) {
        const deltaForParty = result.seats[faction.id] || 0;
        const newTotal = (faction.seats || 0) + deltaForParty;
        await supabase.from('factions').update({ seats: newTotal }).eq('id', faction.id);
    }

    // 6. Build results and mark election as completed
    const seatResults = factions.map(f => ({
        party_id: f.id,
        party_name: f.faction_name,
        existing_seats: f.seats || 0,
        new_seats: result.seats[f.id] || 0,
        total_seats: (f.seats || 0) + (result.seats[f.id] || 0),
        votes: result.votes[f.id] || 0
    }));

    await supabase.from('elections').update({
        status: 'completed',
        results: {
            partial: true,
            delta_seats: deltaSeats,
            votes: seatResults,
            seats: seatResults,
            bloc_details: result.details,
            total_votes_cast: result.totalVotesCast,
            total_abstentions: result.totalAbstentions
        }
    }).eq('id', election.id);

    console.log(`Partial election completed: ${deltaSeats} new seats allocated across ${factions.length} parties`);
}

export async function resolveManualElectionContext(supabase, nation, currentTick, requestedElectionType = null) {
    const governmentType = getCanonicalGovernmentType(nation);
    if (governmentType !== CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC) {
        return {
            governmentType,
            electionType: 'parliamentary',
            forcedOutsideSchedule: false,
            nextScheduledTick: null
        };
    }

    let electionType = requestedElectionType;
    if (!electionType) {
        const { data: dueScheduledElection } = await supabase
            .from('elections')
            .select('id, election_type')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .lte('election_tick', currentTick)
            .order('election_tick', { ascending: true })
            .limit(1)
            .maybeSingle();
        electionType = dueScheduledElection?.election_type || 'presidential';
    }

    const { data: nextScheduled } = await supabase
        .from('elections')
        .select('election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', electionType)
        .order('election_tick', { ascending: true })
        .limit(1)
        .maybeSingle();

    const nextScheduledTick = nextScheduled?.election_tick ?? null;
    return {
        governmentType,
        electionType,
        forcedOutsideSchedule: !!(nextScheduledTick && nextScheduledTick > currentTick),
        nextScheduledTick
    };
}

export async function runManualElectionByGovernmentType(supabase, nation, options = {}) {
    if (!nation?.id) throw new Error('Nation is required');

    let currentTick;
    if (Number.isInteger(options.currentTick)) {
        currentTick = options.currentTick;
    } else {
        const { data: _shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        currentTick = _shard?.current_tick || 0;
    }

    const context = await resolveManualElectionContext(supabase, nation, currentTick, options.electionType);
    const isPresidential = context.governmentType === CANONICAL_GOVERNMENT_TYPES.PRESIDENTIAL_REPUBLIC;
    const normalizedElectionType = context.electionType || 'parliamentary';

    // Resolve the target election record up-front so presidential endorsement snapshots
    // can be tied to a concrete election before vote resolution.
    const { data: scheduledElection } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', normalizedElectionType)
        .order('election_tick', { ascending: true })
        .limit(1)
        .maybeSingle();

    const targetElectionId = scheduledElection?.id || (await (async () => {
        const { data: inserted, error: insertErr } = await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: currentTick,
            election_type: normalizedElectionType,
            status: 'scheduled'
        }).select('id').single();
        if (insertErr) throw insertErr;
        return inserted.id;
    })());

    // Use candidate-based voting for presidential elections, party-based for parliamentary
    let electionResults;
    if (isPresidential && normalizedElectionType === 'presidential') {
        // Ensure candidates exist — generate for parties that have none
        // Ensure all parties have their leader registered as a candidate
        await autoSelectPresidentialCandidates(supabase, nation, currentTick);

        const { error: snapshotErr } = await supabase.rpc('snapshot_presidential_endorsements', {
            p_nation_id: nation.id,
            p_election_id: targetElectionId
        });
        if (snapshotErr) throw snapshotErr;

        const { data, error: runError } = await supabase.rpc('run_presidential_election', {
            p_nation_id: nation.id,
            p_election_id: targetElectionId
        });
        if (runError) throw runError;
        electionResults = data;
    } else {
        const { data, error: runError } = await supabase.rpc('run_election', { p_nation_id: nation.id, p_election_type: normalizedElectionType });
        if (runError) throw runError;
        electionResults = data;
    }

    // Create the election record (SQL RPCs no longer insert their own)
    let completedElectionId;
    await supabase.from('elections')
        .update({ status: 'completed', results: electionResults, election_tick: currentTick })
        .eq('id', targetElectionId);
    completedElectionId = targetElectionId;

    // Fetch the specific election we just completed (not a generic "most recent" query)
    const { data: completedElection, error: electionError } = await supabase
        .from('elections')
        .select('id, election_tick, election_type, results, created_at')
        .eq('id', completedElectionId)
        .single();
    if (electionError) throw electionError;

    // Sync seats for parliamentary elections only (presidential results have no seats)
    const seatResults = completedElection?.results?.seats || [];
    for (const r of seatResults) {
        await supabase
            .from('factions')
            .update({ seats: r.seats })
            .eq('id', r.party_id);
    }

    // Dissolve legislature — fail all pending bills (new parliament must re-propose)
    const { data: dissolvedBills } = await supabase.from('bills')
        .update({ status: 'failed' })
        .eq('nation_id', nation.id)
        .in('status', ['committee', 'floor'])
        .select('id, nation_id, bill_type, ambassador_id, ministry_key');
    await syncAmbassadorsForFailedConfirmationBills(supabase, dissolvedBills);
    await syncMinistriesForFailedConfirmationBills(supabase, dissolvedBills);

    if (isPresidential && normalizedElectionType === 'presidential') {
        // Fail bills on president's desk
        const { data: deskBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .eq('status', 'president_desk')
            .select('id, nation_id, bill_type, ambassador_id, ministry_key');
        await syncAmbassadorsForFailedConfirmationBills(supabase, deskBills);
        await syncMinistriesForFailedConfirmationBills(supabase, deskBills);
        await processPresidentialElectionResult(supabase, nation, completedElection, currentTick, completedElection.id);
    } else if (isPresidential && normalizedElectionType === 'parliamentary') {
        // Midterm parliamentary election — seats reshuffled, president stays
        console.log(`Manual midterm parliamentary election for ${nation.name} — president stays in office`);
    } else {
        // Parliamentary democracy: dissolve existing government after election
        const { data: frozenBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .eq('status', 'frozen')
            .select('id, nation_id, bill_type, ambassador_id, ministry_key');
        await syncAmbassadorsForFailedConfirmationBills(supabase, frozenBills);
        await syncMinistriesForFailedConfirmationBills(supabase, frozenBills);

        let existingGov = null;
        const { data: govFormation } = await supabase
            .from('government_formations')
            .select('id, status')
            .eq('nation_id', nation.id)
            .in('status', ['formed', 'caretaker'])
            .maybeSingle();
        if (govFormation) {
            existingGov = govFormation;
        } else {
            const { data: legacyGov } = await supabase
                .from('active_coalitions')
                .select('id, status')
                .eq('nation_id', nation.id)
                .is('dissolved_at', null)
                .maybeSingle();
            if (legacyGov) existingGov = legacyGov;
        }

        if (existingGov) {
            console.log(`Dissolving government after manual election for ${nation.name}`);

            try {
                const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
                const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                if (fullNation) {
                    await closeAdministration(supabase, nation.id, fullNation, 'dissolved', currentTick, shardData?.current_date || '', null);
                }
            } catch (adminErr) { console.warn('Could not close administration on manual election:', adminErr); }

            await supabase
                .from('government_formations')
                .update({ status: 'dissolved' })
                .eq('nation_id', nation.id)
                .in('status', ['formed', 'caretaker']);

            await supabase
                .from('active_coalitions')
                .update({ status: 'dissolved', dissolved_at: new Date().toISOString() })
                .eq('nation_id', nation.id)
                .is('dissolved_at', null);

            await supabase
                .from('head_of_government')
                .update({ active: false })
                .eq('nation_id', nation.id)
                .eq('active', true);

            await supabase
                .from('ministries')
                .update({
                    minister_first_name: null,
                    minister_last_name: null,
                    minister_age: null,
                    party_id: null
                })
                .eq('nation_id', nation.id)
                .eq('is_active', true);
        }
    }

    return {
        success: true,
        nationId: nation.id,
        governmentType: context.governmentType,
        electionType: normalizedElectionType,
        forcedOutsideSchedule: context.forcedOutsideSchedule,
        nextScheduledTick: context.nextScheduledTick,
        currentTick,
        completedElection,
        seatResults
    };
}

export async function processElections(supabase, nation, currentTick) {
    if (isAutocracy(nation)) return [];

    const isPresidential = isPresidentialRepublic(nation);
    const results = [];

    const { data: dueElections } = await supabase
        .from('elections')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .lte('election_tick', currentTick);

    // For presidential systems, process parliamentary elections before presidential ones
    // so seats are allocated before we determine the popular vote winner
    const sorted = (dueElections || []).sort((a, b) => {
        const aType = a.election_type || 'parliamentary';
        const bType = b.election_type || 'parliamentary';
        if (aType === 'parliamentary' && bType === 'presidential') return -1;
        if (aType === 'presidential' && bType === 'parliamentary') return 1;
        return 0;
    });

    for (const election of sorted) {
        const electionType = election.election_type || 'parliamentary';
        console.log(`Processing ${electionType} election for ${nation.name} (tick ${currentTick})`);

        // Partial election — only allocate delta seats (from foundational bill)
        if (election.partial_seats && election.partial_seats > 0) {
            await processPartialElection(supabase, nation, election, currentTick);
            results.push({ electionId: election.id, nation: nation.name, partial: true, deltaSeats: election.partial_seats });
            continue;
        }

        // Auto-select presidential candidates for any party that hasn't chosen yet
        if (electionType === 'presidential') {
            await autoSelectPresidentialCandidates(supabase, nation, currentTick);
        }

        // Use candidate-based voting for presidential elections, party-based for parliamentary
        let data, error;
        if (electionType === 'presidential') {
            const { error: snapshotErr } = await supabase.rpc('snapshot_presidential_endorsements', {
                p_nation_id: nation.id,
                p_election_id: election.id
            });
            if (snapshotErr) {
                console.error(`Failed to snapshot presidential endorsements for ${nation.name}:`, snapshotErr);
                continue;
            }

            ({ data, error } = await supabase.rpc('run_presidential_election', {
                p_nation_id: nation.id,
                p_election_id: election.id
            }));
        } else {
            ({ data, error } = await supabase.rpc('run_election', { p_nation_id: nation.id, p_election_type: electionType }));
        }

        if (error) {
            console.error(`Election RPC failed (attempt 1) for ${nation.name}:`, error);
            // Retry once
            if (electionType === 'presidential') {
                ({ data, error } = await supabase.rpc('run_presidential_election', {
                    p_nation_id: nation.id,
                    p_election_id: election.id
                }));
            } else {
                ({ data, error } = await supabase.rpc('run_election', { p_nation_id: nation.id, p_election_type: electionType }));
            }

            if (error) {
                console.error(`Election RPC failed (attempt 2) for ${nation.name}:`, error);
                // If overdue, reschedule to next tick to prevent permanent stuck state
                if (election.election_tick < currentTick) {
                    await supabase.from('elections')
                        .update({ election_tick: currentTick + 1 })
                        .eq('id', election.id);
                    console.log(`Rescheduled overdue election ${election.id} to tick ${currentTick + 1}`);
                }
                continue;
            }
            console.log(`Election RPC succeeded on retry for ${nation.name}`);
        }

        // Mark the scheduled election record as completed with full results
        await supabase.from('elections')
            .update({ status: 'completed', results: data })
            .eq('id', election.id);

        // Use the specific election we just completed (not a generic "most recent" query
        // which could return a different election type processed earlier in this tick)
        const completedElection = { id: election.id, results: data };

        if (completedElection?.results?.seats) {
            for (const r of completedElection.results.seats) {
                await supabase
                    .from('factions')
                    .update({ seats: r.seats })
                    .eq('id', r.party_id);
            }
            console.log(`Seats synced to factions for ${nation.name}`);

            // Fire election result timeline event with seat breakdown
            try {
                const seatSummary = completedElection.results.seats
                    .sort((a, b) => (b.seats || 0) - (a.seats || 0))
                    .map(s => `${s.party_name || 'Unknown'}: ${s.seats}`)
                    .join(', ');
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'election_held',
                    p_nation_id: nation.id,
                    p_tick: currentTick,
                    p_placeholders: { election_type: electionType || 'parliamentary', seats: seatSummary }
                });
            } catch (e) { /* non-blocking */ }
        }

        // Dissolve legislature — fail all pending bills (new parliament must re-propose)
        const { data: dissolvedBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .in('status', ['committee', 'floor'])
            .select('id, nation_id, bill_type, ambassador_id, ministry_key');

        await syncAmbassadorsForFailedConfirmationBills(supabase, dissolvedBills);
        await syncMinistriesForFailedConfirmationBills(supabase, dissolvedBills);

        if (dissolvedBills?.length > 0) {
            console.log(`Dissolved ${dissolvedBills.length} pending bill(s) after election for ${nation.name}`);
        }

        // === PRESIDENTIAL SYSTEM: handle presidential vs parliamentary elections ===
        if (isPresidential && electionType === 'presidential') {
            // Fail any bills sitting on the outgoing president's desk
            const { data: deskBills } = await supabase.from('bills')
                .update({ status: 'failed' })
                .eq('nation_id', nation.id)
                .eq('status', 'president_desk')
                .select('id, nation_id, bill_type, ambassador_id, ministry_key');
            await syncAmbassadorsForFailedConfirmationBills(supabase, deskBills);
            await syncMinistriesForFailedConfirmationBills(supabase, deskBills);
            if (deskBills?.length > 0) {
                console.log(`Failed ${deskBills.length} bill(s) on president's desk after presidential election for ${nation.name}`);
            }

            await processPresidentialElectionResult(supabase, nation, completedElection, currentTick, election.id);
        } else if (isPresidential && electionType === 'parliamentary') {
            // Midterm parliamentary election — seats reshuffled, president stays, desk bills remain
            console.log(`Midterm parliamentary election for ${nation.name} — president stays in office`);
        } else {
            // === PARLIAMENTARY DEMOCRACY: dissolve existing government after election ===
            // After any election, the old government (whether 'formed' or 'caretaker')
            // must be dissolved so that processGovernmentVacancy can apply -2 approval
            // penalties until a new coalition is formed.
            let existingGov = null;
            let existingGovSource = null;
            const { data: govFormation } = await supabase
                .from('government_formations')
                .select('id, status')
                .eq('nation_id', nation.id)
                .in('status', ['formed', 'caretaker'])
                .maybeSingle();
            if (govFormation) {
                existingGov = govFormation;
                existingGovSource = 'government_formations';
            } else {
                const { data: legacyGov } = await supabase
                    .from('active_coalitions')
                    .select('id, status')
                    .eq('nation_id', nation.id)
                    .is('dissolved_at', null)
                    .maybeSingle();
                if (legacyGov) {
                    existingGov = legacyGov;
                    existingGovSource = 'active_coalitions';
                }
            }

            // Fail all frozen bills (from caretaker period) regardless of whether
            // an existing government row was found — bills may have been frozen by
            // early elections even if the government row was already cleaned up.
            const { data: frozenBills } = await supabase.from('bills')
                .update({ status: 'failed' })
                .eq('nation_id', nation.id)
                .eq('status', 'frozen')
                .select('id, nation_id, bill_type, ambassador_id, ministry_key');

            await syncAmbassadorsForFailedConfirmationBills(supabase, frozenBills);
            await syncMinistriesForFailedConfirmationBills(supabase, frozenBills);

            if (existingGov) {
                console.log(`Dissolving ${existingGov.status} government after election for ${nation.name} (source: ${existingGovSource})`);

                // Close the administration
                try {
                    const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
                    const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                    if (fullNation) {
                        await closeAdministration(supabase, nation.id, fullNation, 'dissolved', currentTick, shardData?.current_date || '', null);
                    }
                } catch (adminErr) { console.warn('Could not close administration on election:', adminErr); }

                // Dissolve government in BOTH tables
                await supabase
                    .from('government_formations')
                    .update({ status: 'dissolved' })
                    .eq('nation_id', nation.id)
                    .in('status', ['formed', 'caretaker']);

                await supabase
                    .from('active_coalitions')
                    .update({ status: 'dissolved', dissolved_at: new Date().toISOString() })
                    .eq('nation_id', nation.id)
                    .is('dissolved_at', null);

                // Deactivate PM
                await supabase
                    .from('head_of_government')
                    .update({ active: false })
                    .eq('nation_id', nation.id)
                    .eq('active', true);

                // Vacate all ministries
                await supabase
                    .from('ministries')
                    .update({
                        minister_first_name: null,
                        minister_last_name: null,
                        minister_age: null,
                        party_id: null
                    })
                    .eq('nation_id', nation.id)
                    .eq('is_active', true);
            }
        }

        results.push({
            electionId: election.id,
            nation: nation.name,
            electionType,
            result: data
        });
    }

    // === SCHEDULE NEXT ELECTIONS ===
    if (isPresidential) {
        await scheduleNextPresidentialElections(supabase, nation, currentTick);
    } else {
        const { data: futureElection } = await supabase
            .from('elections')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .gt('election_tick', currentTick)
            .limit(1)
            .maybeSingle();

        if (!futureElection) {
            const frequency = nation.election_frequency || 48;
            const nextTick = currentTick + frequency;

            await supabase.from('elections').insert({
                nation_id: nation.id,
                election_tick: nextTick,
                status: 'scheduled'
            });

            console.log(`Scheduled next election for ${nation.name} at tick ${nextTick}`);
        }
    }

    return results;
}

/**
 * Presidential election result: read candidate-level popular vote results
 * and inaugurate the winning candidate.
 */
export async function processPresidentialElectionResult(supabase, nation, completedElection, currentTick, electionId = null) {
    let candidateResults = completedElection?.results?.presidential_candidates || [];
    if (candidateResults.length === 0) {
        console.warn(`No candidate vote data for presidential election in ${nation.name}`);
        return;
    }

    // Identify the outgoing president BEFORE deactivating (for incumbent win/loss effects)
    const { data: outgoingPresident } = await supabase
        .from('presidents')
        .select('id, faction_id, first_name, last_name, terms_served')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    // === RUNOFF SYSTEM ===
    // Round 1: Check if any candidate received >50% of total votes
    const totalVotes = completedElection?.results?.total_votes_cast || 0;
    const sortedRound1 = [...candidateResults].sort((a, b) => b.votes - a.votes);
    const topCandidate = sortedRound1[0];
    const topPct = totalVotes > 0 ? (topCandidate.votes / totalVotes) * 100 : 0;

    let winner;
    let wasRunoff = false;
    let runoffResults = null;
    const snappedEndorsements = completedElection?.results?.snapped_endorsements || [];
    let endorsementResolution = resolvePresidentialRunoffEndorsements({
        wasRunoff: false,
        round1Results: candidateResults,
        runoffCandidates: [],
        snappedEndorsements,
        compatibilityTable: completedElection?.results?.transfer_rate_compatibility || {}
    });

    if (topPct > 50 || candidateResults.length <= 2) {
        // Clear winner with majority — no runoff needed
        winner = topCandidate;
        endorsementResolution = resolvePresidentialRunoffEndorsements({
            wasRunoff: false,
            round1Results: candidateResults,
            runoffCandidates: [],
            snappedEndorsements,
            compatibilityTable: completedElection?.results?.transfer_rate_compatibility || {}
        });
        console.log(`Presidential election Round 1 winner: ${winner.candidate_name} (${winner.party_name}) with ${topPct.toFixed(1)}% — majority achieved (${nation.name})`);
    } else {
        // === RUNOFF: No majority — top 2 candidates advance ===
        wasRunoff = true;
        const runoffCandidates = sortedRound1.slice(0, 2);
        console.log(`Presidential election RUNOFF triggered for ${nation.name}: ${runoffCandidates[0].candidate_name} vs ${runoffCandidates[1].candidate_name} (top was ${topPct.toFixed(1)}%)`);

        // Delete all non-runoff candidates from pm_candidates so the RPC only sees 2
        const runoffCandidateIds = new Set(runoffCandidates.map(c => c.candidate_id));
        const { data: allPresidentialCandidates } = await supabase
            .from('pm_candidates')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('candidate_type', 'presidential');

        for (const pc of (allPresidentialCandidates || [])) {
            if (!runoffCandidateIds.has(pc.id)) {
                await supabase.from('pm_candidates').delete().eq('id', pc.id);
            }
        }

        // Run the presidential election RPC again with only the top 2
        const { data: runoffData, error: runoffErr } = await supabase.rpc('run_presidential_election', {
            p_nation_id: nation.id,
            p_election_id: completedElection.id
        });

        if (runoffErr) {
            console.error(`Runoff RPC failed for ${nation.name}:`, runoffErr);
            // Fallback: use round 1 winner
            winner = topCandidate;
        } else {
            runoffResults = runoffData?.presidential_candidates || [];
            endorsementResolution = resolvePresidentialRunoffEndorsements({
                wasRunoff: true,
                round1Results: candidateResults,
                runoffCandidates,
                snappedEndorsements,
                compatibilityTable: completedElection?.results?.transfer_rate_compatibility || {}
            });
            const runoffSorted = [...runoffResults].sort((a, b) => b.votes - a.votes);
            winner = runoffSorted[0] || topCandidate;
            console.log(`Runoff winner: ${winner.candidate_name} (${winner.party_name}) with ${winner.vote_percentage}% (${nation.name})`);

            // Update the election record with combined round data
            // Replace presidential_candidates with runoff results so the UI shows the final outcome
            const combinedResults = {
                ...completedElection.results,
                presidential_candidates: runoffResults,
                round_1_candidates: candidateResults,
                runoff_candidates: runoffResults,
                total_votes_cast: runoffData?.total_votes_cast || completedElection.results?.total_votes_cast,
                was_runoff: true,
                snapped_endorsements: endorsementResolution.endorsements,
                runoff_endorsement_summary: endorsementResolution.summary
            };
            const targetId = electionId || completedElection.id;
            const { error: runoffUpdateErr } = await supabase.from('elections')
                .update({ results: combinedResults })
                .eq('id', targetId);
            if (runoffUpdateErr) {
                console.error(`[PresElection] Failed to update election ${targetId} with runoff results for ${nation.name}:`, runoffUpdateErr.message);
            }
        }
    }

    console.log(`Presidential election winner: ${winner.candidate_name} (${winner.party_name}) with ${winner.votes} votes (${nation.name})`);

    // === INCUMBENT WIN/LOSS DETECTION ===
    const incumbentFactionId = outgoingPresident?.faction_id;
    const isIncumbentWin = incumbentFactionId && winner.faction_id === incumbentFactionId;
    const isIncumbentRunoffLoss = wasRunoff && incumbentFactionId && winner.faction_id !== incumbentFactionId;
    const isChallengerWin = incumbentFactionId && winner.faction_id !== incumbentFactionId;

    // Deactivate previous president
    const { error: deactErr } = await supabase
        .from('presidents')
        .update({ is_active: false })
        .eq('nation_id', nation.id)
        .eq('is_active', true);
    if (deactErr) {
        console.error(`[processPresidentialElectionResult] Failed to deactivate previous presidents for ${nation.name}:`, deactErr.message);
    }

    // Close previous administration
    try {
        const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
        const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        if (fullNation) {
            const endReason = isIncumbentWin ? 'reelection' : 'election_loss';
            await closeAdministration(supabase, nation.id, fullNation, endReason, currentTick, shardData?.current_date || '', null);
        }
    } catch (adminErr) { console.warn('Could not close administration on presidential election:', adminErr); }

    // Set ruling faction to the winner's party
    await supabase.from('nations')
        .update({ ruling_faction_id: winner.faction_id })
        .eq('id', nation.id);

    // Look up the winning candidate from pm_candidates by candidate_id
    console.log(`[PresElection] Looking up candidate ${winner.candidate_id} for ${winner.candidate_name} (${nation.name})`);
    const { data: winningCandidate, error: candErr } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', winner.candidate_id)
        .maybeSingle();
    if (candErr) console.warn(`[PresElection] Candidate lookup error for ${winner.candidate_id}:`, candErr.message);

    if (winningCandidate) {
        await inauguratePresident(supabase, winningCandidate, nation.id, winner.faction_id, currentTick, outgoingPresident);
        console.log(`President inaugurated: ${winner.candidate_name} (${winner.party_name})`);
    } else {
        // Fallback 1: candidate may have been cleaned up, try by faction
        console.warn(`[PresElection] Primary lookup returned null for candidate_id=${winner.candidate_id}, trying faction fallback`);
        const { data: fallbackCandidate } = await supabase
            .from('pm_candidates')
            .select('*')
            .eq('nation_id', nation.id)
            .eq('faction_id', winner.faction_id)
            .eq('candidate_type', 'presidential')
            .eq('selected', true)
            .limit(1)
            .maybeSingle();

        if (fallbackCandidate) {
            await inauguratePresident(supabase, fallbackCandidate, nation.id, winner.faction_id, currentTick, outgoingPresident);
            console.log(`President inaugurated (fallback): ${fallbackCandidate.first_name} ${fallbackCandidate.last_name} (${winner.party_name})`);
        } else {
            // Fallback 2: register party leader and use that
            console.warn(`[PresElection] Faction fallback also null for ${winner.candidate_name} in ${nation.name} — using party leader`);
            let leaderCandidate = null;
            try {
                leaderCandidate = await registerPartyLeaderAsCandidate(supabase, nation.id, winner.faction_id, currentTick);
            } catch (regErr) {
                console.error(`[PresElection] registerPartyLeaderAsCandidate threw for ${winner.candidate_name}:`, regErr);
            }
            if (leaderCandidate) {
                await inauguratePresident(supabase, leaderCandidate, nation.id, winner.faction_id, currentTick, outgoingPresident);
                console.log(`President inaugurated from party leader: ${leaderCandidate.first_name} ${leaderCandidate.last_name}`);
            } else {
                // Fallback 3 (last resort): create president directly from election result data
                console.error(`[PresElection] ALL candidate lookups failed for ${winner.candidate_name} in ${nation.name} — direct inauguration from election data`);
                const directCandidate = {
                    first_name: winner.candidate_name?.split(' ')[0] || 'Unknown',
                    last_name: winner.candidate_name?.split(' ').slice(1).join(' ') || 'President',
                    age: 50,
                    ideology: winner.ideology || 'PROGRESS',
                    trait_key: winner.trait_key || null,
                    ideology_axis: 'tradition_progress',
                    ideology_direction: 1
                };
                await inauguratePresident(supabase, directCandidate, nation.id, winner.faction_id, currentTick, outgoingPresident);
                console.log(`Direct president inaugurated from election data: ${directCandidate.first_name} ${directCandidate.last_name}`);
            }
        }
    }

    // === TERM-LIMITED PRESIDENT RETIRES AS PARTY LEADER ===
    if (outgoingPresident) {
        const effectiveTermLimit = getPresidentialTermLimit(nation);
        if (effectiveTermLimit !== null && (outgoingPresident.terms_served || 1) >= effectiveTermLimit) {
            const outgoingName = `${outgoingPresident.first_name} ${outgoingPresident.last_name}`;
            console.log(`[PresElection] Term-limited president ${outgoingName} retires as party leader (served ${outgoingPresident.terms_served}/${effectiveTermLimit} terms)`);

            const { error: retireErr } = await supabase.from('factions')
                .update({ leader_first_name: null, leader_last_name: null, leader_age: null, electability: 50 })
                .eq('id', outgoingPresident.faction_id);
            if (retireErr) console.error(`[PresElection] Failed to clear retired leader:`, retireErr.message);

            try {
                const { data: factionData } = await supabase.from('factions').select('faction_name').eq('id', outgoingPresident.faction_id).single();
                await supabase.from('event_log').insert({
                    nation_id: nation.id,
                    event_name: 'President Retires (Term Limited)',
                    trigger_key: 'party_leader_replaced',
                    description_chosen: `${outgoingName}, having served the maximum ${effectiveTermLimit} term${effectiveTermLimit !== 1 ? 's' : ''} as president, has retired from party leadership. ${factionData?.faction_name || 'The party'} must appoint a new leader.`,
                    category: 'POLITICAL',
                    fired_at_tick: currentTick,
                });
            } catch (e) { console.warn('[PresElection] Failed to log term-limited retirement event:', e); }
        }
    }

    // === VACATE NON-PRESIDENT-PARTY MINISTERS (new administration) ===
    if (isChallengerWin) {
        try {
            const { error: vacateErr } = await supabase
                .from('ministries')
                .update({
                    party_id: null,
                    minister_first_name: null,
                    minister_last_name: null,
                    minister_age: null
                })
                .eq('nation_id', nation.id)
                .eq('is_active', true)
                .neq('party_id', winner.faction_id);

            if (vacateErr) {
                console.warn(`[PresElection] Failed to vacate non-president ministers for ${nation.name}:`, vacateErr.message);
            } else {
                console.log(`[PresElection] Vacated non-${winner.party_name} ministers for new administration in ${nation.name}`);
            }
        } catch (vacateErr) {
            console.warn('[PresElection] Error vacating ministers:', vacateErr);
        }
    }

    // === WINNER/LOSER EFFECTS ===
    try {
        const { data: nationStats } = await supabase.from('nations')
            .select('stability, legitimacy, happiness, civil_unrest')
            .eq('id', nation.id).single();

        if (nationStats) {
            const updates = {};
            if (isIncumbentWin) {
                // Incumbent wins: +3 legitimacy, +2 stability (mandate renewed)
                updates.legitimacy = Math.min(100, Math.round(((nationStats.legitimacy || 50) + 3) * 10) / 10);
                updates.stability = Math.min(100, Math.round(((nationStats.stability || 50) + 2) * 10) / 10);
                console.log(`Incumbent win effects: +3 legitimacy, +2 stability (${nation.name})`);
            } else if (isChallengerWin && !wasRunoff) {
                // Challenger wins (no runoff): transition effects
                updates.stability = Math.max(0, Math.round(((nationStats.stability || 50) - 2) * 10) / 10);
                updates.civil_unrest = Math.min(100, Math.round(((nationStats.civil_unrest || 0) + 3) * 10) / 10);
                updates.happiness = Math.min(100, Math.round(((nationStats.happiness || 50) + 1) * 10) / 10);
                console.log(`Challenger win effects: -2 stability, +3 civil_unrest, +1 happiness (${nation.name})`);
            } else if (isIncumbentRunoffLoss) {
                // Incumbent loses in runoff: extra penalties (contested transition)
                updates.stability = Math.max(0, Math.round(((nationStats.stability || 50) - 4) * 10) / 10);
                updates.legitimacy = Math.max(0, Math.round(((nationStats.legitimacy || 50) - 2) * 10) / 10);
                updates.civil_unrest = Math.min(100, Math.round(((nationStats.civil_unrest || 0) + 5) * 10) / 10);
                updates.happiness = Math.min(100, Math.round(((nationStats.happiness || 50) + 2) * 10) / 10);
                console.log(`Incumbent runoff loss effects: -4 stability, -2 legitimacy, +5 civil_unrest, +2 happiness (${nation.name})`);
            }

            if (Object.keys(updates).length > 0) {
                await supabase.from('nations').update(updates).eq('id', nation.id);
            }
        }

        // Momentum effects: incumbent win boosts their faction, challenger win penalizes losing incumbent faction
        if (isIncumbentWin && incumbentFactionId) {
            await adjustMomentumAll(supabase, nation.id, incumbentFactionId, 3, 'election:incumbent_win');
            console.log(`Incumbent re-elected: +3 momentum to ${winner.party_name}`);
        } else if (isChallengerWin && incumbentFactionId) {
            await adjustMomentumAll(supabase, nation.id, incumbentFactionId, -5, 'election:incumbent_loss');
            await adjustMomentumAll(supabase, nation.id, winner.faction_id, 3, 'election:challenger_win');
            console.log(`Challenger wins: -5 momentum to outgoing party, +3 to ${winner.party_name}`);
        }
    } catch (effectsErr) { console.warn('Could not apply winner/loser effects:', effectsErr); }

    // Clean up all presidential candidates after election
    await supabase.from('pm_candidates').delete()
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential');

    // Sort for runner-up info in event
    const sorted = [...candidateResults].sort((a, b) => b.votes - a.votes);

    // Fire system event
    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'presidential_election',
            p_nation_id: nation.id,
            p_tick: currentTick,
            p_placeholders: {
                nation: nation.name,
                winning_party: winner.party_name,
                winning_candidate: winner.candidate_name,
                votes: winner.votes,
                vote_percentage: winner.vote_percentage || '?',
                runner_up: sorted[1]?.candidate_name || 'N/A',
                runner_up_party: sorted[1]?.party_name || 'N/A',
                was_runoff: wasRunoff ? 'true' : 'false',
                incumbent_win: isIncumbentWin ? 'true' : 'false'
            }
        });
    } catch (e) { console.warn('Presidential election event fire failed (non-blocking):', e); }

    // Proactively schedule next elections (instead of relying on processPresidentialTermEnd safety net)
    try {
        await scheduleNextPresidentialElections(supabase, nation, currentTick);
    } catch (e) { console.warn('Could not schedule next presidential elections:', e); }
}

function resolvePresidentialRunoffEndorsements({ wasRunoff, round1Results = [], runoffCandidates = [], snappedEndorsements = [], compatibilityTable = {} }) {
    const runoffCandidateIds = new Set((runoffCandidates || []).map(c => c.candidate_id));
    const round1ByFaction = new Map((round1Results || []).map(c => [c.faction_id, c]));
    const candidateTotals = {};
    for (const c of (runoffCandidates || [])) {
        candidateTotals[c.candidate_id] = { transfer_votes: 0, protest_votes: 0 };
    }

    const resolved = (snappedEndorsements || []).map(raw => {
        const item = { ...raw };
        if ((item.status || 'PENDING') !== 'PENDING') return item;
        if (!wasRunoff) return { ...item, status: 'VOID', void_reason: 'no_runoff' };
        const endorsing = round1ByFaction.get(item.endorsing_faction_id);
        if (!endorsing) return { ...item, status: 'VOID', void_reason: 'endorsing_not_found' };
        if (runoffCandidateIds.has(endorsing.candidate_id)) return { ...item, status: 'VOID', void_reason: 'endorsing_party_in_runoff' };
        if (!runoffCandidateIds.has(item.endorsed_candidate_id)) return { ...item, status: 'VOID', void_reason: 'endorsed_eliminated' };

        const compKey = item.compatibility || item.compatibility_tier || item.relationship || 'neutral';
        const transferRate = Math.max(0, Math.min(1,
            Number(item.transfer_rate ?? compatibilityTable[compKey] ?? compatibilityTable.neutral ?? 0.65)
        ));
        const baseVotes = Math.max(0, Number(endorsing.votes || 0));
        const transferVotes = Math.round(baseVotes * transferRate);
        const protestVotes = Math.max(0, baseVotes - transferVotes);

        const otherRunoffId = (runoffCandidates || []).find(c => c.candidate_id !== item.endorsed_candidate_id)?.candidate_id || null;
        const protestSplit = item.protest_split || {};
        const endorsedProtestRate = Math.max(0, Math.min(1, Number(protestSplit.endorsed ?? 0.5)));
        const otherProtestRate = Math.max(0, Math.min(1, Number(protestSplit.other ?? (1 - endorsedProtestRate))));
        const abstainRate = Math.max(0, 1 - endorsedProtestRate - otherProtestRate);

        if (candidateTotals[item.endorsed_candidate_id]) {
            candidateTotals[item.endorsed_candidate_id].transfer_votes += transferVotes;
            candidateTotals[item.endorsed_candidate_id].protest_votes += Math.round(protestVotes * endorsedProtestRate);
        }
        if (otherRunoffId && candidateTotals[otherRunoffId]) {
            candidateTotals[otherRunoffId].protest_votes += Math.round(protestVotes * otherProtestRate);
        }

        return {
            ...item,
            status: 'RESOLVED',
            transfer_votes: transferVotes,
            protest_votes: protestVotes,
            protest_abstain_votes: Math.round(protestVotes * abstainRate)
        };
    });

    const summary = {
        total_transfer_votes: Object.values(candidateTotals).reduce((s, v) => s + v.transfer_votes, 0),
        total_protest_votes: Object.values(candidateTotals).reduce((s, v) => s + v.protest_votes, 0),
        candidate_totals: candidateTotals
    };
    return { endorsements: resolved, summary };
}

/**
 * Inaugurate a president from a candidate record. Creates the president row,
 * applies ideology shift, applies trait effects, and creates an administration.
 * Used by processPresidentialElectionResult (auto-inauguration).
 */
export async function inauguratePresident(supabase, candidate, nationId, factionId, currentTick, outgoingPresident = null) {
    // Deactivate any previous president
    const { error: deactErr } = await supabase.from('presidents')
        .update({ is_active: false })
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (deactErr) {
        console.error(`[inauguratePresident] Failed to deactivate previous presidents for ${nationId}:`, deactErr.message);
    }

    // Fetch nation data early for per-nation term length
    const { data: nationForTerm, error: nationTermErr } = await supabase.from('nations').select('presidential_term_ticks, presidential_term_limit').eq('id', nationId).single();
    if (nationTermErr) console.error(`[inauguratePresident] Failed to fetch nation term data:`, nationTermErr.message);

    // Look up trait data for trait_upside / trait_downside
    const { data: trait } = await supabase.from('leader_traits').select('*').eq('trait_key', candidate.trait_key).maybeSingle();

    // Determine terms_served: if re-elected (same person), increment; otherwise start at 1
    let termsServed = 1;
    if (outgoingPresident &&
        outgoingPresident.first_name === candidate.first_name &&
        outgoingPresident.last_name === candidate.last_name &&
        outgoingPresident.faction_id === factionId) {
        termsServed = (outgoingPresident.terms_served || 1) + 1;
        console.log(`President re-elected: ${candidate.first_name} ${candidate.last_name} — term ${termsServed}`);
    }

    // Insert president record (with trait_upside / trait_downside populated)
    const { error: presErr } = await supabase.from('presidents').insert({
        nation_id: nationId,
        faction_id: factionId,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        age: candidate.age,
        ideology: candidate.ideology,
        trait: candidate.trait_key,
        trait_upside: trait?.upside || null,
        trait_downside: trait?.downside || null,
        elected_tick: currentTick,
        term_ends_tick: currentTick + getPresidentialTermTicks(nationForTerm),
        is_active: true,
        terms_served: termsServed
    });
    if (presErr) throw presErr;

    // Apply ideology shift (+15 on candidate's axis)
    const axisKey = candidate.ideology_axis;
    const direction = candidate.ideology_direction;
    if (axisKey && typeof direction === 'number') {
        const shift = 15 * direction;
        let factionIdeology = await loadFactionIdeology(supabase, factionId);
        if (factionIdeology?._error) factionIdeology = null;
        if (factionIdeology) {
            const currentVal = factionIdeology[axisKey] || 0;
            const newVal = Math.max(-100, Math.min(100, currentVal + shift));
            await supabase.from('faction_ideology').update({ [axisKey]: newVal }).eq('faction_id', factionId);
            console.log(`President ideology shift: ${axisKey} ${currentVal} → ${newVal} (${shift > 0 ? '+' : ''}${shift})`);
        }
    }

    // Apply trait effects (same logic as PM)
    if (trait?.effects) {
        if (trait.effects.on_appoint_stability) {
            const { data: nationRow } = await supabase.from('nations').select('stability').eq('id', nationId).single();
            if (nationRow) {
                const newStability = Math.max(0, Math.min(100, (nationRow.stability || 50) + trait.effects.on_appoint_stability));
                await supabase.from('nations').update({ stability: newStability }).eq('id', nationId);
            }
        }
    }

    // Get faction info for administration record
    const { data: faction } = await supabase.from('factions').select('faction_name, seats, approval_rating').eq('id', factionId).single();
    const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
    const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nationId).single();

    // For presidential systems, fetch latest parliamentary election seats (more reliable than faction.seats)
    let presidentPartySeats = faction?.seats || 0;
    if (!presidentPartySeats) {
        const { data: latestParl } = await supabase
            .from('elections')
            .select('results')
            .eq('nation_id', nationId)
            .eq('status', 'completed')
            .eq('election_type', 'parliamentary')
            .order('election_tick', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (latestParl?.results?.votes) {
            const entry = latestParl.results.votes.find(v => v.party_id === factionId);
            presidentPartySeats = entry?.total_seats || entry?.seats || 0;
        } else if (latestParl?.results?.seats) {
            const entry = latestParl.results.seats.find(s => s.party_id === factionId);
            presidentPartySeats = entry?.total_seats || entry?.seats || 0;
        }
    }

    // Parse year safely from current_date (handles formats like "Month Day, Year" or just "Year")
    const dateStr = shardData?.current_date || '';
    const yearMatch = dateStr.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : '';

    // Create new administration
    await supabase.from('administrations').insert({
        nation_id: nationId,
        admin_name: `${candidate.last_name} Administration${year ? ', ' + year : ''}`,
        head_of_state: `${candidate.first_name} ${candidate.last_name}`,
        president_name: `${candidate.first_name} ${candidate.last_name}`,
        president_party_id: factionId,
        president_party_name: faction?.faction_name || '',
        coalition_parties: [{ party_id: factionId, party_name: faction?.faction_name || '', seats: presidentPartySeats }],
        total_seats: presidentPartySeats,
        government_type: 'Presidential',
        started_at_tick: currentTick,
        started_at_date: dateStr,
        stats_at_start: fullNation ? snapshotNationStats(fullNation) : {},
        approval_at_start: faction?.approval_rating ?? 50,
        head_of_state_title: fullNation?.head_of_state_title || null
    });

    return candidate;
}

/**
 * Schedule next presidential + parliamentary elections independently.
 * Presidential every PRESIDENTIAL_TERM_TICKS, parliamentary every PARLIAMENTARY_TERM_TICKS.
 */
export async function scheduleNextPresidentialElections(supabase, nation, currentTick) {
    // Check for future parliamentary election
    const { data: futureParl } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'parliamentary')
        .gt('election_tick', currentTick)
        .limit(1)
        .maybeSingle();

    if (!futureParl) {
        const nextParl = currentTick + GAME_CONFIG.PARLIAMENTARY_TERM_TICKS;
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: nextParl,
            election_type: 'parliamentary',
            status: 'scheduled'
        });
        console.log(`Scheduled next parliamentary election for ${nation.name} at tick ${nextParl}`);
    }

    // Check for future presidential election
    const { data: futurePres } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'presidential')
        .gt('election_tick', currentTick)
        .limit(1)
        .maybeSingle();

    if (!futurePres) {
        const nextPres = currentTick + getPresidentialTermTicks(nation);
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: nextPres,
            election_type: 'presidential',
            status: 'scheduled'
        });
        console.log(`Scheduled next presidential election for ${nation.name} at tick ${nextPres}`);
    }
}
