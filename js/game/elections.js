/**
 * elections.js — Administration lifecycle, coalition dissolution, elections, government vacancy
 * Extracted from game-common.js
 */

import { FORMATION_DEADLINE_TICKS, GAME_CONFIG, getPresidentialTermTicks, getPresidentialTermLimit, getParliamentaryTermTicks } from './config.js';
import { CANONICAL_GOVERNMENT_TYPES, getCanonicalGovernmentType, hasElectedPresident, hasParliamentaryPM, isAbsoluteMonarchy } from './government-types.js';
import { snapshotNationStats } from './stats.js';
import { adjustCredibility, adjustGovernmentApprovalEvent, round2 } from './momentum.js';
import { fetchActiveCoalition } from './government-structure.js';
import { INACTIVITY_DRAIN_THRESHOLD } from './electorate.js';
import { syncMinistriesForFailedConfirmationBills } from './bills.js';
import { autoSelectPresidentialCandidates, registerPartyLeaderAsCandidate } from './presidential.js';
import {
    rollIndependents,
    applyTieBreakerBonuses,
    calculateTotalWeightedPopularity,
    calculateSectorContributions,
    allocateSeatsByTwp,
    applyElectabilityModifier,
    applyUncertaintyRoll,
    electabilityBucket,
    getStrongholdSectors,
    redistributeRunoffVotes,
    computeSectorWeights,
    persistSectorWeights,
} from './sectors.js';

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
                .select('id, bill_name, bill_type, passed_tick')
                .eq('nation_id', nationId)
                .eq('status', 'passed')
                .neq('bill_type', 'repeal')
                .gte('passed_tick', currentAdmin.started_at_tick)
                .lte('passed_tick', currentTick);
            if (passedBillsErr) throw passedBillsErr;

            const billsPassed = (passedBills || []).map(b => ({
                bill_id: b.id,
                bill_name: b.bill_name,
                bill_type: b.bill_type,
                passed_tick: b.passed_tick,
                date: _gameDate(b.passed_tick)
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
                repealed_tick: b.passed_tick,
                date: _gameDate(b.passed_tick)
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
                    started_tick: e.fired_at_tick,
                    date: _gameDate(e.fired_at_tick)
                }));

            const crisesSolved = (eventsDuring || [])
                .filter(e => e.event_name && e.event_name.startsWith('CRISIS_RESOLVED:'))
                .map(e => ({
                    title: e.event_name.replace('CRISIS_RESOLVED: ', ''),
                    solved_tick: e.fired_at_tick,
                    date: _gameDate(e.fired_at_tick)
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
                date: _gameDate(ta.enacted_at_tick),
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
                .map(b => ({ bill_id: b.id, bill_name: b.bill_name, bill_type: b.bill_type || 'standard', date: _gameDate(b.passed_tick) }));

            // Query no-confidence votes during this administration
            const { data: nocRows } = await supabase
                .from('bills')
                .select('id, bill_name, status, passed_tick')
                .eq('nation_id', nationId)
                .eq('bill_type', 'no_confidence')
                .gte('passed_tick', currentAdmin.started_at_tick)
                .lte('passed_tick', currentTick);
            const noConfidenceVotes = (nocRows || []).map(b => ({
                bill_id: b.id, bill_name: b.bill_name, result: b.status === 'passed' ? 'passed' : 'failed', tick: b.passed_tick, date: _gameDate(b.passed_tick)
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
                bill_id: b.id, bill_name: b.bill_name, type: b.bill_type, result: b.status === 'passed' ? 'passed' : 'failed', tick: b.passed_tick, date: _gameDate(b.passed_tick)
            }));

            // Query executive orders issued during this administration
            const { data: eoRows } = await supabase
                .from('executive_orders')
                .select('id, order_type, issued_at_tick')
                .eq('nation_id', nationId)
                .gte('issued_at_tick', currentAdmin.started_at_tick)
                .lte('issued_at_tick', currentTick);
            const executiveOrders = (eoRows || []).map(eo => ({
                id: eo.id, order_type: eo.order_type, tick: eo.issued_at_tick, date: _gameDate(eo.issued_at_tick)
            }));

            // Detect snap elections and minority governments from event_log
            const snapEvents = (eventsDuring || []).filter(e =>
                e.event_name && (e.event_name.includes('snap_election') || e.event_name.includes('formation_snap_election') || e.event_name.includes('early_election'))
            ).map(e => ({ title: e.event_name, tick: e.fired_at_tick, date: _gameDate(e.fired_at_tick) }));

            const minorityEvents = (eventsDuring || []).filter(e =>
                e.event_name && e.event_name.includes('minority_government')
            ).map(e => ({ title: e.event_name, tick: e.fired_at_tick, date: _gameDate(e.fired_at_tick) }));

            // Detect leader changes from event_log (Party Leadership appointments)
            const leaderChangeEvents = (eventsDuring || []).filter(e =>
                e.event_name && e.event_name === 'New Party Leader'
            ).map(e => ({ role: e.event_name, description: e.description_chosen || '', tick: e.fired_at_tick, date: _gameDate(e.fired_at_tick) }));

            // Minister actions (from campaign_actions)
            const { data: ministerRows } = await supabase
                .from('campaign_actions').select('id, action_type, tick_performed, result')
                .eq('nation_id', nationId)
                .in('action_type', ['assign_minister', 'purge_minister', 'fire_minister'])
                .gte('tick_performed', currentAdmin.started_at_tick)
                .lte('tick_performed', currentTick);
            const ministerActions = (ministerRows || []).map(r => ({
                action_type: r.action_type, tick: r.tick_performed, date: _gameDate(r.tick_performed),
                minister_name: r.result?.minister_name || (r.result?.first_name ? `${r.result.first_name} ${r.result.last_name}` : null),
                ministry: r.result?.ministry_key || r.result?.ministry_name || null,
                party: r.result?.party_name || null,
            }));

            // Diplomatic actions (from diplomatic_action_log)
            const { data: diplomaticRows } = await supabase
                .from('diplomatic_action_log').select('id, action_type, target_nation_id, applied_at_tick, action_data')
                .eq('nation_id', nationId)
                .gte('applied_at_tick', currentAdmin.started_at_tick)
                .lte('applied_at_tick', currentTick);
            const diplomaticActions = (diplomaticRows || []).map(r => ({
                action_type: r.action_type, tick: r.applied_at_tick, date: _gameDate(r.applied_at_tick),
                target_nation_id: r.target_nation_id,
                target_nation: r.action_data?.target_nation_name || null,
            }));

            // Update the administration record
            const { error: updateErr } = await supabase
                .from('administrations')
                .update({
                    stats_at_end: statsAtEnd,
                    approval_at_end: governmentApproval,
                    ended_at_tick: currentTick,
                    ended_at_date: _normalizeAdminEndDate(currentDate, currentTick),
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
                    minister_actions: ministerActions,
                    diplomatic_actions: diplomaticActions,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentAdmin.id);
            if (updateErr) throw updateErr;

            console.log(`Administration closed: "${currentAdmin.admin_name}" — reason: ${endReason}`);
        }

        // Pair admin-close with cabinet-vacate. This used to live at five
        // separate close-admin call sites; two of them (vacancy timeout,
        // gov collapse) silently forgot, leaking stale ministers across
        // formation cycles. Inlining means every close path gets the
        // vacate for free. Runs once per closeAdministration call (after
        // the loop) so it's not redundant on duplicate-open-admin nations.
        //
        // Not strictly atomic with the admin UPDATE — the UPDATEs above
        // landed already, and an orphanCabinet failure would throw with
        // admin-closed+cabinet-stale state. But orphanCabinet now throws
        // on error (was console.warn) so the failure surfaces instead of
        // being swallowed; Phase C will move both writes into a single
        // SQL RPC for true atomicity.
        await orphanCabinet(supabase, nationId);
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
                .update({ ended_at_tick: currentTick, ended_at_date: _normalizeAdminEndDate(currentDate, currentTick), end_reason: 'new_coalition' })
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
                started_at_date: _normalizeAdminEndDate(currentDate, currentTick),
                stats_at_start: statsAtStart,
                approval_at_start: 50
            });
        if (insertErr) throw insertErr;

        // Reset government approval to 50 for the new administration (clean slate)
        const { error: approvalResetErr } = await supabase.from('nations')
            .update({ gov_approval: 50, gov_approval_events: 0 })
            .eq('id', nationId);
        if (approvalResetErr) console.error('createAdministration: failed to reset gov_approval:', approvalResetErr.message);

        // Fire timeline event for government formed
        try {
            const partyNames = coalitionParties.map(p => p.party_name).join(', ');
            const seatDetail = coalitionParties
                .slice().sort((a, b) => (b.seats || 0) - (a.seats || 0))
                .map(p => `${p.party_name} (${p.seats || 0})`)
                .join(', ');
            const coalitionDesc = `${pmName || 'Unknown'} of ${pmPartyName} forms a coalition government with ${partyNames}. Seat breakdown: ${seatDetail}.`;
            await supabase.from('event_log').insert({
                nation_id: nationId,
                event_name: 'Coalition Formed',
                trigger_key: 'government_formed',
                category: 'government',
                description_chosen: coalitionDesc,
                effects_applied: {
                    admin_name: adminName,
                    pm: pmName || 'Unknown',
                    pm_party: pmPartyName,
                    coalition_parties: partyNames,
                    total_seats: String(totalSeats)
                },
                fired_at_tick: currentTick
            });
        } catch (e) { /* non-blocking */ }

        // Coalition formation reward: formateur party gets +3 momentum
        try {
            await supabase.rpc('adjust_momentum', {
                p_faction_id: leadPartyId,
                p_delta: 3,
                p_label: 'Coalition formed (+3)',
                p_tick: currentTick
            });
        } catch (e) { /* non-blocking */ }

        console.log(`Administration created: "${adminName}" at tick ${currentTick}`);
        await _verifyAdministrationIntegrity(supabase, nationId, 'createAdministration');
    } catch (err) {
        console.error('createAdministration error:', err);
        throw err;
    }
}

const _MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
function _gameDate(tick) {
    if (tick == null) return null;
    return `${_MONTHS[tick % 12]}, ${2000 + Math.floor(tick / 12)}`;
}

function _normalizeAdminEndDate(currentDate, currentTick) {
    return (typeof currentDate === 'string' && currentDate.trim()) ? currentDate : (_gameDate(currentTick) || 'Unknown Date');
}

async function _verifyAdministrationIntegrity(supabase, nationId, contextLabel) {
    const [{ data: openRows, error: openErr }, { data: missingEndedTickRows, error: endedErr }] = await Promise.all([
        supabase.from('administrations').select('id, started_at_tick, created_at').eq('nation_id', nationId).is('ended_at_tick', null).order('started_at_tick', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('administrations').select('id').eq('nation_id', nationId).not('ended_at_date', 'is', null).is('ended_at_tick', null)
    ]);

    if (openErr || endedErr) {
        console.warn('administration_integrity_check_failed', { nation_id: nationId, context: contextLabel, open_error: openErr?.message || null, ended_error: endedErr?.message || null });
        return;
    }

    if ((openRows || []).length !== 1 || (missingEndedTickRows || []).length > 0) {
        console.warn('administration_integrity_violation', {
            nation_id: nationId,
            context: contextLabel,
            open_count: (openRows || []).length,
            open_admin_ids: (openRows || []).map(r => r.id),
            ended_rows_missing_ended_at_tick: (missingEndedTickRows || []).map(r => r.id)
        });
    }
}

/**
 * Refresh the current (open) administration's event arrays so the
 * Past Administrations card always shows live data.  Called once per
 * nation per tick by the tick processor.
 */
export async function refreshCurrentAdministrationEvents(supabase, nationId, currentTick) {
    try {
        const { data: admin, error: adminErr } = await supabase
            .from('administrations')
            .select('id, started_at_tick, created_at')
            .eq('nation_id', nationId)
            .is('ended_at_tick', null)
            .maybeSingle();

        if (adminErr || !admin) return; // no open admin — nothing to refresh

        const start = admin.started_at_tick;

        // Run all source-table queries in parallel
        const [
            { data: passedBills },
            { data: repealBills },
            { data: failedBillRows },
            { data: nocRows },
            { data: impeachRows },
            { data: eoRows },
            { data: electionsDuring },
            { data: tradeAgreementsDuring },
            { data: eventsDuring },
            { data: ministerRows },
            { data: diplomaticRows },
        ] = await Promise.all([
            // Bills passed (excluding repeals)
            supabase.from('bills').select('id, bill_name, bill_type, passed_tick')
                .eq('nation_id', nationId).eq('status', 'passed').neq('bill_type', 'repeal')
                .gte('passed_tick', start).lte('passed_tick', currentTick),
            // Laws repealed
            supabase.from('bills').select('id, bill_name, passed_tick')
                .eq('nation_id', nationId).eq('bill_type', 'repeal').eq('status', 'passed')
                .gte('passed_tick', start).lte('passed_tick', currentTick),
            // Bills failed (include NULL passed_tick — some bills fail without a vote)
            supabase.from('bills').select('id, bill_name, bill_type, passed_tick, created_at')
                .eq('nation_id', nationId).eq('status', 'failed').neq('bill_type', 'repeal')
                .gte('created_at', admin.created_at || '1900-01-01'),
            // No-confidence votes
            supabase.from('bills').select('id, bill_name, status, passed_tick')
                .eq('nation_id', nationId).eq('bill_type', 'no_confidence')
                .gte('passed_tick', start).lte('passed_tick', currentTick),
            // Impeachment motions/convictions
            supabase.from('bills').select('id, bill_name, bill_type, status, passed_tick')
                .eq('nation_id', nationId).in('bill_type', ['impeachment_motion', 'impeachment_conviction'])
                .gte('passed_tick', start).lte('passed_tick', currentTick),
            // Executive orders
            supabase.from('executive_orders').select('id, order_type, issued_at_tick')
                .eq('nation_id', nationId)
                .gte('issued_at_tick', start).lte('issued_at_tick', currentTick),
            // Elections survived
            supabase.from('elections').select('id, election_tick')
                .eq('nation_id', nationId).eq('status', 'completed')
                .gte('election_tick', start).lt('election_tick', currentTick),
            // Trade agreements
            supabase.from('trade_agreements').select('id, agreement_type, agreement_name, nation_a_id, nation_b_id, enacted_at_tick, status')
                .or(`nation_a_id.eq.${nationId},nation_b_id.eq.${nationId}`)
                .gte('enacted_at_tick', start).lte('enacted_at_tick', currentTick),
            // Event log (crises, snap elections, minority govts, leader changes)
            supabase.from('event_log').select('event_id, event_name, category, fired_at_tick, description_chosen')
                .eq('nation_id', nationId)
                .gte('fired_at_tick', start).lte('fired_at_tick', currentTick),
            // Minister actions (from campaign_actions)
            supabase.from('campaign_actions').select('id, action_type, tick_performed, result')
                .eq('nation_id', nationId)
                .in('action_type', ['assign_minister', 'purge_minister', 'fire_minister'])
                .gte('tick_performed', start).lte('tick_performed', currentTick),
            // Diplomatic actions (from diplomatic_action_log)
            supabase.from('diplomatic_action_log').select('id, action_type, target_nation_id, applied_at_tick, action_data')
                .eq('nation_id', nationId)
                .gte('applied_at_tick', start).lte('applied_at_tick', currentTick),
        ]);

        // Shape the data (include date for every entry)
        const billsPassed = (passedBills || []).map(b => ({
            bill_id: b.id, bill_name: b.bill_name, bill_type: b.bill_type,
            passed_tick: b.passed_tick, date: _gameDate(b.passed_tick)
        }));
        const lawsRepealed = (repealBills || []).map(b => ({
            bill_id: b.id, bill_name: b.bill_name,
            repealed_tick: b.passed_tick, date: _gameDate(b.passed_tick)
        }));
        const billsFailed = (failedBillRows || [])
            .filter(b => {
                if (b.passed_tick != null) return b.passed_tick >= start && b.passed_tick <= currentTick;
                return true; // created_at filter already scoped it
            })
            .map(b => ({
                bill_id: b.id, bill_name: b.bill_name, bill_type: b.bill_type || 'standard',
                tick: b.passed_tick, date: _gameDate(b.passed_tick)
            }));
        const noConfidenceVotes = (nocRows || []).map(b => ({
            bill_id: b.id, bill_name: b.bill_name,
            result: b.status === 'passed' ? 'passed' : 'failed',
            tick: b.passed_tick, date: _gameDate(b.passed_tick)
        }));
        const impeachments = (impeachRows || []).map(b => ({
            bill_id: b.id, bill_name: b.bill_name, type: b.bill_type,
            result: b.status === 'passed' ? 'passed' : 'failed',
            tick: b.passed_tick, date: _gameDate(b.passed_tick)
        }));
        const executiveOrders = (eoRows || []).map(eo => ({
            id: eo.id, order_type: eo.order_type,
            tick: eo.issued_at_tick, date: _gameDate(eo.issued_at_tick)
        }));
        const tradeAgreements = (tradeAgreementsDuring || []).map(ta => ({
            agreement_id: ta.id, agreement_type: ta.agreement_type, agreement_name: ta.agreement_name,
            partner_nation_id: ta.nation_a_id === nationId ? ta.nation_b_id : ta.nation_a_id,
            enacted_at_tick: ta.enacted_at_tick, date: _gameDate(ta.enacted_at_tick), status: ta.status
        }));

        const events = eventsDuring || [];
        const crisisEvents = events.filter(e => e.category === 'crisis' || e.category === 'disaster' || e.category === 'conflict');
        const crisesStarted = crisisEvents
            .filter(e => !e.event_name?.startsWith('CRISIS_RESOLVED:'))
            .map(e => ({ event_id: e.event_id, title: e.event_name, started_tick: e.fired_at_tick, date: _gameDate(e.fired_at_tick) }));
        const crisesSolved = events
            .filter(e => e.event_name?.startsWith('CRISIS_RESOLVED:'))
            .map(e => ({ title: e.event_name.replace('CRISIS_RESOLVED: ', ''), solved_tick: e.fired_at_tick, date: _gameDate(e.fired_at_tick) }));
        const snapElections = events
            .filter(e => e.event_name && (e.event_name.includes('snap_election') || e.event_name.includes('formation_snap_election') || e.event_name.includes('early_election')))
            .map(e => ({ title: e.event_name, tick: e.fired_at_tick, date: _gameDate(e.fired_at_tick) }));
        const minorityGovernments = events
            .filter(e => e.event_name?.includes('minority_government'))
            .map(e => ({ title: e.event_name, tick: e.fired_at_tick, date: _gameDate(e.fired_at_tick) }));
        const leaderChanges = events
            .filter(e => e.event_name === 'New Party Leader')
            .map(e => ({ role: e.event_name, description: e.description_chosen || '', tick: e.fired_at_tick, date: _gameDate(e.fired_at_tick) }));

        const ministerActions = (ministerRows || []).map(r => ({
            action_type: r.action_type, tick: r.tick_performed, date: _gameDate(r.tick_performed),
            minister_name: r.result?.minister_name || (r.result?.first_name ? `${r.result.first_name} ${r.result.last_name}` : null),
            ministry: r.result?.ministry_key || r.result?.ministry_name || null,
            party: r.result?.party_name || null,
        }));
        const diplomaticActions = (diplomaticRows || []).map(r => ({
            action_type: r.action_type, tick: r.applied_at_tick, date: _gameDate(r.applied_at_tick),
            target_nation_id: r.target_nation_id,
            target_nation: r.action_data?.target_nation_name || null,
        }));

        const { error: updateErr } = await supabase.from('administrations').update({
            bills_passed: billsPassed,
            bills_failed: billsFailed,
            laws_repealed: lawsRepealed,
            crises_started: crisesStarted,
            crises_solved: crisesSolved,
            elections_survived: (electionsDuring || []).length,
            trade_agreements: tradeAgreements,
            no_confidence_votes: noConfidenceVotes,
            impeachments,
            executive_orders: executiveOrders,
            snap_elections: snapElections,
            minority_governments: minorityGovernments,
            leader_changes: leaderChanges,
            minister_actions: ministerActions,
            diplomatic_actions: diplomaticActions,
            updated_at: new Date().toISOString()
        }).eq('id', admin.id);
        if (updateErr) console.error('refreshCurrentAdministrationEvents update error:', updateErr);
    } catch (err) {
        console.error('refreshCurrentAdministrationEvents error:', err);
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

        // Always roll over administrations on new coalition formation.
    // Design decision: no same-PM continuity shortcut; every new coalition
    // closes the previous administration and opens a new one.

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
        started_at_date: _normalizeAdminEndDate(currentDate, currentTick),
        stats_at_start: statsAtStart,
        approval_at_start: 50
    };

    const { error: rpcErr } = await supabase.rpc('rollover_administration', {
        p_nation_id: nationId,
        p_end_reason: endReason,
        p_end_tick: currentTick,
        p_end_date: _normalizeAdminEndDate(currentDate, currentTick),
        p_end_approval: governmentApproval,
        p_new_administration: payload
    });

    if (!rpcErr) {
        // Reset government approval to 50 for the new administration (clean slate)
        const { error: approvalResetErr } = await supabase.from('nations')
            .update({ gov_approval: 50, gov_approval_events: 0 })
            .eq('id', nationId);
        if (approvalResetErr) console.error('rolloverAdministration: failed to reset gov_approval:', approvalResetErr.message);
        console.log(`Administration rolled over atomically: "${adminName}" at tick ${currentTick}`);
        await _verifyAdministrationIntegrity(supabase, nationId, 'rolloverAdministration_rpc');
        return;
    }

    // Graceful fallback if DB function has not been deployed yet
    const rpcUnavailable = /rollover_administration/i.test(rpcErr.message || '') || rpcErr.code === 'PGRST202';
    if (!rpcUnavailable) throw rpcErr;

    console.warn('rolloverAdministration RPC unavailable; falling back to sequential close + create');
    const normalizedDate = _normalizeAdminEndDate(currentDate, currentTick);
    await closeAdministration(supabase, nationId, nation, endReason, currentTick, normalizedDate, governmentApproval);
    await createAdministration(supabase, nationId, nation, coalition, allParties, currentTick, normalizedDate, governmentApproval);
    await _verifyAdministrationIntegrity(supabase, nationId, 'rolloverAdministration_fallback');
}


// ==================== COALITION DISSOLUTION ====================

/**
 * Dissolve the current coalition government.
 * - Sets government_formations status to 'dissolved' (canonical)
 * - Deactivates PM in head_of_government
 * Ministries are NOT cleared — the cabinet persists as caretaker until the
 * next election. Nation enters formation period (processGovernmentVacancy
 * handles penalties).
 */
/**
 * Clear minister names + party assignments on every active ministry row
 * for a nation. Used on every parliamentary turnover that should leave
 * the new PM re-confirming the cabinet from scratch — manual election,
 * snap election, presidential dissolution. Variant-callers (e.g. the
 * post-election partial-vacate that excludes the winning faction; the
 * acting-minister clear for new presidents) keep their own UPDATE
 * shapes — this helper covers only the identical "orphan everyone"
 * pattern.
 *
 * Errors throw — a failed clear used to be silently warned and
 * leaked stale ministers across formation cycles (Sangreza, Calveth,
 * Sierramar all hit this). Throwing surfaces the failure to the
 * caller (closeAdministration) whose outer catch already handles
 * partial-state rollback semantics.
 */
async function orphanCabinet(supabase, nationId) {
    const { error } = await supabase.from('ministries')
        .update({
            minister_first_name: null,
            minister_last_name: null,
            minister_age: null,
            party_id: null
        })
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (error) throw new Error(`orphanCabinet: ministries clear failed for nation ${nationId}: ${error.message}`);
}

export async function dissolveCoalition(supabase, nationId, excludeFormationId) {
    // Bust coalition cache so pages immediately see the dissolved state
    if (typeof qCacheBust === 'function') qCacheBust('coalition_' + nationId);

    // Dissolve government_formations (skip the new formation if one is being created)
    let dissolveQuery = supabase
        .from('government_formations')
        .update({ status: 'dissolved' })
        .eq('nation_id', nationId)
        .in('status', ['formed', 'active', 'caretaker']);
    if (excludeFormationId) dissolveQuery = dissolveQuery.neq('id', excludeFormationId);
    const { error: formErr } = await dissolveQuery;
    if (formErr) console.warn('dissolveCoalition: formations update failed:', formErr);

    // Deactivate PM
    const { error: pmErr } = await supabase
        .from('head_of_government')
        .update({ active: false })
        .eq('nation_id', nationId)
        .eq('active', true);
    if (pmErr) console.warn('dissolveCoalition: PM deactivation failed:', pmErr);

    // dissolveCoalition does NOT close the admin row — it dissolves the
    // formation and deactivates the PM, but the admin stays open as
    // caretaker until the next election. Cabinet ministers persist
    // through this caretaker window. They get vacated atomically when
    // closeAdministration finally runs (see orphanCabinet inlined at
    // the end of closeAdministration). One invariant, one place: admin
    // closed ⇔ cabinet vacant.
}


// ==================== NO-CONFIDENCE RESOLUTION ====================

/**
 * Resolve a passed or failed vote of no confidence.
 *
 * PASSED:
 *   - Coalition immediately dissolved (PM deactivated; ministries stay populated
 *     as caretaker cabinet until the snap election vacates them)
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

    // NOTE: government_type is fetched at resolution time, not bill creation time.
    // If a foundational bill changes the government type while a vonc is on the floor,
    // it will resolve under the new type's rules. This is a known edge case.
    const { data: nation } = await supabase
        .from('nations')
        .select('name, government_type')
        .eq('id', nationId)
        .single();

    // Presidential systems do not have votes of no confidence.
    // Absolute monarchy: defense in depth — fileNoConfidenceMotion already
    // rejects monarchy nations, but a stale bill from before that gate
    // could otherwise reach this resolver.
    if (!hasParliamentaryPM(nation)) return;
    if (isAbsoluteMonarchy(nation)) return;

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
        // === Parliamentary: full government dissolution ===
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
                    await closeAdministration(supabase, nationId, fullNation, 'coalition_collapse', currentTick, shard?.current_date || _gameDate(currentTick), null);
                }
            } catch (adminErr) { console.warn('Could not close administration on no-confidence:', adminErr); }

            // Dissolve coalition
            await dissolveCoalition(supabase, nationId);

            // Calling party gets approval boost
            await supabase.rpc('adjust_momentum', { p_faction_id: callingPartyId, p_delta: 4, p_label: 'No confidence called (+4)', p_tick: currentTick });

            // All coalition parties take approval & credibility hit
            for (const partyId of coalitionPartyIds) {
                await supabase.rpc('adjust_momentum', { p_faction_id: partyId, p_delta: -3, p_label: 'No confidence — gov party (-3)', p_tick: currentTick });
                await adjustCredibility(supabase, partyId, nationId, -0.05);
            }
            await adjustGovernmentApprovalEvent(supabase, nationId, -5, 'no_confidence:success');

            // Schedule snap election (same pattern as early elections)
            // Only cancel parliamentary elections (preserve presidential for semi-pres safety)
            await supabase.from('elections').delete()
                .eq('nation_id', nationId).eq('status', 'scheduled').eq('election_type', 'parliamentary');
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
        // FAILED: calling party takes approval & credibility hit
        await supabase.rpc('adjust_momentum', { p_faction_id: callingPartyId, p_delta: -3, p_label: 'No confidence failed — caller (-3)', p_tick: currentTick });
        await adjustCredibility(supabase, callingPartyId, nationId, -0.05);

        // PM's party gets approval & credibility boost
        if (pmFactionId) {
            await supabase.rpc('adjust_momentum', { p_faction_id: pmFactionId, p_delta: 2, p_label: 'No confidence defeated (+2)', p_tick: currentTick });
            await adjustCredibility(supabase, pmFactionId, nationId, 0.03);
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
    // Presidential systems cannot call early elections.
    // Absolute monarchy: parliament does not run elections — the Monarch
    // controls government composition via the Appoint PM royal action.
    const { data: nationCheck } = await supabase.from('nations').select('government_type, hos_election_method, gov_approval, state_apparatus').eq('id', nationId).single();
    if (!hasParliamentaryPM(nationCheck)) return { success: false, error: 'Presidential systems cannot call early elections' };
    if (isAbsoluteMonarchy(nationCheck)) return { success: false, error: 'Elections are not held under absolute monarchy.' };

    // 0. Server-side guard: only proceed if coalition is still 'formed' (check both tables)
    let govStatus = null;
    const { data: activeGov } = await supabase
        .from('government_formations')
        .select('id, status')
        .eq('nation_id', nationId)
        .in('status', ['formed', 'active', 'caretaker'])
        .order('formed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (activeGov) {
        govStatus = activeGov.status;
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

    // 1b. Cooldown: can't call within 6 ticks of the last election
    const { data: lastElection } = await supabase.from('elections')
        .select('election_tick').eq('nation_id', nationId).eq('status', 'completed')
        .order('election_tick', { ascending: false }).limit(1).maybeSingle();
    if (lastElection && (currentTick - lastElection.election_tick) < 6) {
        throw new Error(`Too soon after last election (tick ${lastElection.election_tick}). Must wait 6 ticks between elections.`);
    }

    // 1c. Cooldown: can't call within 2 ticks of the next scheduled election
    const { data: nextElection } = await supabase.from('elections')
        .select('election_tick').eq('nation_id', nationId).eq('status', 'scheduled')
        .order('election_tick', { ascending: true }).limit(1).maybeSingle();
    if (nextElection && (nextElection.election_tick - currentTick) <= 2) {
        throw new Error(`Elections already scheduled in ${nextElection.election_tick - currentTick} tick(s). Too close to call early elections.`);
    }

    // 2. Flip government to caretaker on the canonical table.
    // Optimistic lock via status='formed' filter — only one caller can
    // transition formed→caretaker.
    const { data: updatedGov } = await supabase
        .from('government_formations')
        .update({ status: 'caretaker' })
        .eq('nation_id', nationId)
        .in('status', ['formed'])
        .select('id');
    if (!updatedGov || updatedGov.length === 0) {
        throw new Error('Government was already changed by another action. Please refresh.');
    }

    // 3. Tiered effects based on gov_approval
    const govApproval = Number(nationCheck?.gov_approval ?? 50);

    if (govApproval > 50) {
        // STRENGTH: "Seeking a fresh mandate" — PM party gets +3 momentum
        await supabase.rpc('adjust_momentum', {
            p_faction_id: pmFactionId,
            p_delta: 3,
            p_label: 'Snap elections from strength (+3)',
            p_tick: currentTick
        });
    } else if (govApproval < 35) {
        // WEAKNESS: "Conceding to the people" — opposition +5 each, stability +3
        const { data: allFactions } = await supabase
            .from('factions')
            .select('id')
            .eq('nation_id', nationId)
            .eq('faction_type', 'party')
            .is('abandoned_at', null);
        const oppositionIds = (allFactions || [])
            .filter(f => !coalitionPartyIds.includes(f.id))
            .map(f => f.id);
        for (const oppId of oppositionIds) {
            await supabase.rpc('adjust_momentum', {
                p_faction_id: oppId,
                p_delta: 5,
                p_label: 'Government concedes — snap elections (+5)',
                p_tick: currentTick
            });
        }
        const newStateApparatus = Math.min(100, Number(nationCheck?.state_apparatus ?? 50) + 3);
        await supabase.from('nations').update({ state_apparatus: newStateApparatus }).eq('id', nationId);
    }
    // 35-50: no momentum or stability changes

    // Bust coalition cache after caretaker transition
    if (typeof qCacheBust === 'function') qCacheBust('coalition_' + nationId);

    // 4 + 5. Cancel existing scheduled elections and schedule the snap.
    // Routed through a SECURITY DEFINER RPC because the `elections` table
    // has no client-side INSERT/DELETE policy (see 20260302_fix_rls_ownership);
    // direct DML from the player session silently affected zero rows,
    // leaving the original election in place.
    const { error: scheduleErr } = await supabase.rpc('schedule_snap_election', {
        p_nation_id: nationId,
        p_election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
        p_preserve_presidential: false
    });
    if (scheduleErr) {
        throw new Error('Failed to schedule snap election: ' + (scheduleErr.message || scheduleErr));
    }

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
    const tierLabel = govApproval > 50 ? 'from strength' : govApproval < 35 ? 'concession' : 'neutral';
    const tierDesc = govApproval > 50
        ? `PM ${pmName} has called snap elections from a position of strength. The ruling party gains a momentum surge.`
        : govApproval < 35
            ? `PM ${pmName} has conceded to public pressure and called snap elections. Opposition parties gain momentum. Stability improves from the orderly transition.`
            : `PM ${pmName} has dissolved the Legislature. Caretaker government in place until elections.`;
    await supabase.from('event_log').insert({
        nation_id: nationId,
        event_name: 'Legislature Dissolved — Early Elections Called',
        trigger_key: 'snap_election_called',
        fired_at_tick: currentTick,
        category: 'government',
        description_used: tierDesc,
        effects_applied: {
            caretaker: true,
            election_tick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS,
            tier: tierLabel,
            gov_approval: govApproval,
            bills_frozen: true
        }
    });

    // Immediate fire: invoke advance-tick with the per-nation election flag so
    // the scheduled election (election_tick = currentTick) runs synchronously
    // and the player sees results in seconds instead of waiting on pg_cron.
    // Failure is non-fatal — the row stays scheduled, tick processor catches
    // it on the next beat.
    try {
        const { data: fireResult, error: fireErr } = await supabase.functions.invoke('advance-tick', {
            body: { fire_elections_for_nation: nationId },
        });
        if (fireErr) {
            console.warn('[callEarlyElections] Immediate fire failed; election will run on next tick:', fireErr.message || fireErr);
        } else {
            console.log('[callEarlyElections] Election fired immediately:', fireResult);
        }
    } catch (err) {
        console.warn('[callEarlyElections] Immediate fire threw; election will run on next tick:', err?.message || err);
    }

    return { success: true, electionTick: currentTick + GAME_CONFIG.EARLY_ELECTION_TICKS };
}

// dissolveParliament removed in 20270748 — semi-presidential-only action.


// ==================== GOVERNMENT VACANCY & FORMATION ESCALATION ====================

/**
 * Process government vacancy with 3-stage escalation for parliamentary democracies.
 *
 * After an election with no majority party:
 *   Stage 0 — Formation window (ticks 1 to FORMATION_DEADLINE_TICKS):
 *     - Every tick: top 2 parties by seats lose -2 approval
 *     - Tick 1: notification "Formation underway, N ticks to form coalition"
 *     - Tick (deadline - 1): warning "1 tick remaining"
 *
 *   Stage 1 — Snap election (at FORMATION_DEADLINE_TICKS, failed_formation_attempts < 1):
 *     - Non-responsive coalition invitees: -3 approval each
 *     - Snap election scheduled for next tick
 *     - failed_formation_attempts set to 1
 *
 *   Stage 2 — Continued deadlock (FORMATION_DEADLINE_TICKS after snap, failed_formation_attempts >= 1):
 *     - Never auto-installs a government
 *     - Schedules another snap election for the next tick
 *     - Keeps vacancy pressure active until players form a coalition
 *
 * @param {object} supabase    - Supabase client
 * @param {object} nation      - Full nation row
 * @param {number} currentTick - Current tick number
 * @returns {Promise<object|null>} Summary of actions taken, or null if not applicable
 */
export async function processGovernmentVacancy(supabase, nation, currentTick) {
    // Only applies to parliamentary democracies.
    // Absolute monarchy: PM vacancies are filled by the Monarch's
    // appointment, not by snap elections / emergency formation.
    if (!hasParliamentaryPM(nation)) return null;
    if (isAbsoluteMonarchy(nation)) return null;

    // Check for active coalition
    const coalition = await fetchActiveCoalition(supabase, nation.id);

    // Safety net: self-heal a STUCK caretaker. A healthy caretaker
    // resolves via a snap election scheduled ~FORMATION_DEADLINE_TICKS
    // out. The stuck-forever class (Dravka, Avelia) is a caretaker whose
    // soonest scheduled election is overdue, pathologically far out, or
    // missing entirely — the old net only handled the overdue case
    // (.lte election_tick currentTick), so a future-dated election
    // (tick 112 vs cur 92) left the caretaker frozen indefinitely.
    // Generalized: also pull a far-future election forward, and
    // schedule one if none exists. Healthy short caretakers (election
    // within the formation window) are untouched — no behaviour change.
    if (coalition && coalition.status === 'caretaker') {
        const { data: soonest, error: soonestErr } = await supabase
            .from('elections')
            .select('id, election_tick')
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled')
            .order('election_tick', { ascending: true })
            .limit(1)
            .maybeSingle();

        // A failed read must NOT be treated as "no election exists" — that
        // would fire a spurious snap election. Bail to no-action this tick
        // (a caretaker waiting one more tick is harmless; the next tick
        // retries) — matches the codebase's transient-DB-error discipline.
        if (soonestErr) {
            console.warn(`Safety net: scheduled-election lookup failed for ${nation.name} (skipping this tick):`, soonestErr.message);
            return null;
        }

        if (!soonest) {
            // Caretaker with no resolving election at all — schedule one.
            await supabase.rpc('schedule_snap_election', {
                p_nation_id: nation.id,
                p_election_tick: currentTick + 1,
                p_preserve_presidential: false,
            }).then(({ error }) => {
                if (error) console.warn(`Safety net: schedule_snap_election failed for ${nation.name}:`, error.message);
            });
            console.log(`Safety net: caretaker ${nation.name} had no scheduled election — scheduled one at tick ${currentTick + 1}`);
        } else {
            const ticksUntil = soonest.election_tick - currentTick;
            if (ticksUntil < 0 || ticksUntil > FORMATION_DEADLINE_TICKS) {
                await supabase.from('elections')
                    .update({ election_tick: currentTick + 1 })
                    .eq('id', soonest.id)
                    .then(({ error }) => {
                        if (error) console.warn(`Safety net: reschedule failed for ${nation.name}:`, error.message);
                    });
                console.log(`Safety net: caretaker ${nation.name} election was ${ticksUntil} ticks out — pulled to tick ${currentTick + 1}`);
            }
        }
        return null; // Caretaker remains valid until the election resolves
    }

    // Emergency minority government auto-snap timer. A player-formed
    // minority government runs at most 36 ticks before a snap election
    // is forced, so the deadlock breaker can't become permanent rule
    // by a plurality party that simply refuses to negotiate further.
    // Dissolving the formation here also clears the -20% YES penalty
    // that bills.js applies via formation_type='emergency_minority'.
    if (coalition?.formation_type === 'emergency_minority'
        && coalition.status === 'formed'
        && coalition.formed_at_tick != null) {
        const ticksAsMinority = currentTick - coalition.formed_at_tick;
        if (ticksAsMinority >= 36) {
            await supabase.rpc('schedule_snap_election', {
                p_nation_id: nation.id,
                p_election_tick: currentTick + 1,
                p_preserve_presidential: false,
            });
            await supabase.from('government_formations')
                .update({ status: 'dissolved' })
                .eq('id', coalition.id);
            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'Minority Government Mandate Expired',
                trigger_key: 'emergency_minority_government',
                description_used: `${nation.name}'s minority government has exhausted its 36-tick mandate. A snap election has been scheduled.`,
                category: 'POLITICAL',
                fired_at_tick: currentTick,
            }).then(({ error }) => {
                if (error) console.warn('Minority auto-snap event log failed:', error.message);
            });
            return { nation: nation.name, autoSnapFired: true, ticksAsMinority };
        }
        return null;  // minority gov still within mandate
    }

    // fetchActiveCoalition only returns 'formed' or 'caretaker' (not proposals)
    if (coalition && coalition.status === 'formed') return null;

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

    // Load all parties (sorted by seats) — needed for penalties AND deadline trait check
    const { data: allParties } = await supabase
        .from('factions')
        .select('id, faction_name, seats, leader_positive_traits')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party')
        .order('seats', { ascending: false });

    const result = {
        nation: nation.name,
        ticksElapsed,
        penaltiesApplied: true,
        approvalLoss: -2,
    };

    // Top 2 parties by seats lose -2 approval each tick during vacancy —
    // ongoing pressure to form a government. The auto-snap that used to
    // fire after FORMATION_DEADLINE_TICKS has been removed. There is no
    // manual deadlock breaker; the standing momentum penalty applies
    // until a coalition forms.
    if (allParties && allParties.length > 0) {
        await supabase.rpc('adjust_momentum', { p_faction_id: allParties[0].id, p_delta: -2, p_label: 'Formation timeout (-2)', p_tick: currentTick });
        if (allParties.length > 1) {
            await supabase.rpc('adjust_momentum', { p_faction_id: allParties[1].id, p_delta: -2, p_label: 'Formation timeout (-2)', p_tick: currentTick });
        }
    }

    // One-shot informational event when vacancy begins.
    if (ticksElapsed === 1) {
        await supabase.from('event_log').insert({
            nation_id: nation.id,
            event_name: 'FORMATION_WINDOW_START',
            trigger_key: 'coalition_formation_started',
            description_used: `Coalition formation underway in ${nation.name}. Top two parties lose -2 approval per tick until a government forms; any party leader can call a snap election to break a deadlock.`,
            category: 'POLITICAL',
            effects_applied: { ongoing_penalty: -2 },
            fired_at_tick: currentTick
        }).then(({ error }) => {
            if (error) console.warn('Formation window start event log failed:', error.message);
        });
    }

    return result;
}


// ==================== TICK PROCESSOR ====================

// ==================== PARTIAL ELECTION (FOUNDATIONAL BILL) ====================

export async function processPartialElection(supabase, nation, election, currentTick) {
    const deltaSeats = election.partial_seats;
    console.log(`Processing partial election for ${nation.name}: +${deltaSeats} new seats`);

    // 1. Load parties + sectors + popularity. Phase 3: partial elections use
    //    the same sector engine as full elections, but skip the independents
    //    roll (these are delta seats added to an existing parliament, not a
    //    fresh contest) and skip the uncertainty roll (deltas should be a
    //    direct read of current standings). Existing seats are needed for
    //    the delta-add at step 4, so includeCurrentSeats: true.
    const { factions: factionList, sectors: sectorList, popularity } =
        await loadSectorElectionInputs(supabase, nation.id, { includeCurrentSeats: true });

    if (factionList.length === 0) {
        console.warn('No parties found for partial election');
        await supabase.from('elections')
            .update({ status: 'completed', results: { partial: true, error: 'no_parties', bloc_details: [] }, election_tick: currentTick })
            .eq('id', election.id);
        return;
    }

    // Phase 1 dynamic sector weights: recompute and persist before TWP
    // so partial elections see the same up-to-date weights as a full
    // election. Mutates sectorList in place; non-fatal on error.
    try {
        const newWeights = computeSectorWeights(nation, sectorList);
        await persistSectorWeights(supabase, newWeights, sectorList);
    } catch (wErr) {
        console.warn(`[processPartialElection] dynamic-weight recompute failed (non-fatal):`, wErr?.message || wErr);
    }

    // Layer in target-based-option turnout + weight deltas before TWP scaling.
    await applyActiveOptionSectorEffects(supabase, nation.id, sectorList);

    // 2. Tie-breakers + TWP per faction.
    const bonuses = applyTieBreakerBonuses(factionList, sectorList, popularity);
    const augmentedPop = layerBonusesIntoPopularity(popularity, sectorList, bonuses);
    const twpByFaction = {};
    for (const f of factionList) {
        twpByFaction[f.id] = calculateTotalWeightedPopularity(f.id, sectorList, augmentedPop);
    }

    // 3. Allocate ONLY the delta via TWP. No uncertainty roll on partials.
    let deltaAllocation = allocateSeatsByTwp(twpByFaction, deltaSeats);
    const electabilityByFaction = {};
    for (const f of factionList) electabilityByFaction[f.id] = electabilityBucket(f.electability);
    deltaAllocation = applyElectabilityModifier(deltaAllocation, electabilityByFaction, deltaSeats);

    // 4. ADD delta to each faction's existing seats.
    for (const f of factionList) {
        const deltaForParty = deltaAllocation[f.id] ?? 0;
        const newTotal = (f.seats || 0) + deltaForParty;
        await supabase.from('factions').update({ seats: newTotal }).eq('id', f.id);
    }

    // 5. Scale TWP shares to realistic vote counts using derived eligible
    //    voters (population × VOTING_AGE_SHARE) and sector-weighted
    //    turnout. Same helper the full-election and presidential paths use.
    const eligibleForScale = getEligibleVoters(nation);
    const partialScaling = (eligibleForScale > 0)
        ? computeTwpVoteScaling(twpByFaction, sectorList, eligibleForScale)
        : null;

    const seatResults = factionList.map(f => ({
        party_id: f.id,
        party_name: f.faction_name,
        existing_seats: f.seats || 0,
        new_seats: deltaAllocation[f.id] ?? 0,
        total_seats: (f.seats || 0) + (deltaAllocation[f.id] ?? 0),
        votes: partialScaling
            ? (partialScaling.votesByFaction[f.id] ?? 0)
            : Math.round(twpByFaction[f.id] || 0),
    }));

    await supabase.from('elections').update({
        status: 'completed',
        results: {
            partial: true,
            delta_seats: deltaSeats,
            votes: seatResults,
            seats: seatResults,
            bloc_details: [],
            total_votes_cast: partialScaling
                ? partialScaling.totalVotesCast
                : Math.round(Object.values(twpByFaction).reduce((s, v) => s + v, 0)),
            total_abstentions: partialScaling ? partialScaling.abstentions : 0,
            turnout_pct: partialScaling ? partialScaling.turnoutPct : null,
            eligible_voters: eligibleForScale,
            sector_breakdown: {
                independent_seats_unchanged: true,
                factions: factionList.map(f => ({
                    faction_id: f.id,
                    faction_name: f.faction_name,
                    twp: twpByFaction[f.id] || 0,
                    delta_seats: deltaAllocation[f.id] ?? 0,
                })),
            },
        }
    }).eq('id', election.id);

    console.log(`Partial election completed: ${deltaSeats} new seats allocated across ${factionList.length} parties via sector engine`);
}

/**
 * Sync parliamentary seats to factions and record a completed parliamentary
 * election so the UI Parliamentary tab shows fresh results.
 * Used by both the tick path and manual path when a General Election
 * (presidential + parliamentary) runs.
 */
async function recordParliamentarySubElection(supabase, nationId, parlData, currentTick) {
    if (!parlData) return;
    if (parlData.seats) {
        for (const r of parlData.seats) {
            await supabase.from('factions').update({ seats: r.seats }).eq('id', r.party_id);
        }
    }
    // Consume a scheduled parliamentary election record if one exists, otherwise insert one
    const { data: existingParlElection } = await supabase
        .from('elections')
        .select('id')
        .eq('nation_id', nationId)
        .eq('status', 'scheduled')
        .eq('election_type', 'parliamentary')
        .order('election_tick', { ascending: true })
        .limit(1)
        .maybeSingle();
    if (existingParlElection) {
        await supabase.from('elections')
            .update({ status: 'completed', results: parlData, election_tick: currentTick })
            .eq('id', existingParlElection.id);
    } else {
        await supabase.from('elections').insert({
            nation_id: nationId,
            election_tick: currentTick,
            election_type: 'parliamentary',
            status: 'completed',
            results: parlData
        });
    }
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
        // General Election: run parliamentary (seats) first, then presidential (candidates)
        // Phase 3: parliamentary sub-election uses the sector engine.
        const parlData = await runSectorElection(supabase, nation);

        // Sync seats and create a completed parliamentary election record for the UI
        await recordParliamentarySubElection(supabase, nation.id, parlData, currentTick);

        // Ensure candidates exist — generate for parties that have none
        await autoSelectPresidentialCandidates(supabase, nation, currentTick);

        const { error: snapshotErr } = await supabase.rpc('snapshot_presidential_endorsements', {
            p_nation_id: nation.id,
            p_election_id: targetElectionId
        });
        if (snapshotErr) throw snapshotErr;

        const data = await runSectorPresidentialElectionRound(supabase, nation.id);
        // Merge parliamentary seat results into the presidential election results
        electionResults = { ...data, seats: parlData?.seats || [] };
    } else {
        // Phase 3: parliamentary uses the sector engine; presidential still
        // uses the legacy SQL RPC (different model, out of scope for now).
        if (normalizedElectionType === 'parliamentary') {
            electionResults = await runSectorElection(supabase, nation);
        } else {
            const { data, error: runError } = await supabase.rpc('run_election', { p_nation_id: nation.id, p_election_type: normalizedElectionType });
            if (runError) throw runError;
            electionResults = data;
        }
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

    // Dissolve legislature — fail all pending and frozen bills (new parliament must re-propose)
    const { data: dissolvedBills } = await supabase.from('bills')
        .update({ status: 'failed' })
        .eq('nation_id', nation.id)
        .in('status', ['committee', 'floor', 'frozen'])
        .select('id, nation_id, bill_type, ministry_key');
    await syncMinistriesForFailedConfirmationBills(supabase, dissolvedBills);

    if (isPresidential && normalizedElectionType === 'presidential') {
        // Fail bills on president's desk
        const { data: deskBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .eq('status', 'president_desk')
            .select('id, nation_id, bill_type, ministry_key');
        await syncMinistriesForFailedConfirmationBills(supabase, deskBills);
        await processPresidentialElectionResult(supabase, nation, completedElection, currentTick, completedElection.id);
    } else {
        // Parliamentary dissolution.
        const { data: frozenBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .eq('status', 'frozen')
            .select('id, nation_id, bill_type, ministry_key');
        await syncMinistriesForFailedConfirmationBills(supabase, frozenBills);

        let existingGov = null;
        // Fetch ALL active/formed/caretaker rows (newest first), not
        // .maybeSingle() — after an early election there can legitimately
        // be >1 (the just-flipped caretaker plus a leftover from a prior
        // cycle), and .maybeSingle() THROWS on multiple rows. That error
        // silently skipped the dissolve block below, leaving an orphaned
        // caretaker row that read as "stuck in caretaker" forever. The
        // dissolve UPDATE already uses .in(status,[...]) so it clears
        // every stale row; we only need [0] for the existence check.
        const { data: govFormations } = await supabase
            .from('government_formations')
            .select('id, status')
            .eq('nation_id', nation.id)
            .in('status', ['formed', 'active', 'caretaker'])
            .order('formed_at', { ascending: false });
        if (govFormations && govFormations.length > 0) existingGov = govFormations[0];

        if (existingGov) {
            console.log(`Dissolving government after manual election for ${nation.name}`);

            try {
                const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
                const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                if (fullNation) {
                    await closeAdministration(supabase, nation.id, fullNation, 'dissolved', currentTick, shardData?.current_date || _gameDate(currentTick), null);
                }
            } catch (adminErr) { console.warn('Could not close administration on manual election:', adminErr); }

            await supabase
                .from('government_formations')
                .update({ status: 'dissolved' })
                .eq('nation_id', nation.id)
                .in('status', ['formed', 'active', 'caretaker']);

            // closeAdministration above already vacated the cabinet —
            // explicit orphanCabinet here would be redundant.
        }

        // HoG deactivation runs UNCONDITIONALLY — even if no government_formations
        // row existed. Legacy nations whose PM was auto-appointed without a
        // formation row must still have their HoG flipped
        // to inactive when an election completes, otherwise the stale row
        // suppresses the formation UI across every subsequent cycle (Melizea
        // bug, pre-fix). One source of truth: "election completed" ⇒ "old PM out".
        await supabase
            .from('head_of_government')
            .update({ active: false })
            .eq('nation_id', nation.id)
            .eq('active', true);
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

// ==================== SECTOR-BASED ELECTION (Phase 3) ====================

/**
 * Run a parliamentary election using the Phase 3 sector-popularity engine.
 *
 * Replaces the legacy SQL run_election RPC for parliamentary elections.
 * Pipeline matches V3 §4.6:
 *
 *   1. Roll independents — 1D10 delta from nations.independent_seats,
 *      clamped to [0, floor(parliament_size * 0.08)]. Persist immediately.
 *   2. Compute available_seats = parliament_size - independent_seats.
 *   3. Load active sectors + per-faction popularity.
 *   4. Apply tie-breaker bonuses for sectors where 2+ factions are tied at
 *      the highest popularity (virtual +1.0 to one randomly-chosen winner;
 *      not persisted, election-scope only).
 *   5. Compute TWP per faction with bonuses layered on.
 *   6. Allocate available_seats by TWP (Largest Remainder + fringe threshold;
 *      zero-fallback splits evenly when no party meets fringe).
 *   7. Apply Electability modifier (Low/Moderate/High → -2%/0%/+2%).
 *   8. Apply ±5% uncertainty roll on the leader's seat count.
 *   9. Sync factions.seats and return a result blob matching the legacy
 *      RPC's shape, with sector_breakdown nested for replay/diagnostics.
 *
 * Presidential elections still use the legacy SQL RPC (different model).
 *
 * Returns a JSONB-compatible object identical in shape to run_election so
 * the existing JS post-processing in processElections / runManualElection
 * doesn't need other changes.
 */
async function runSectorElection(supabase, nation) {
    const nationId = nation.id;
    const totalSeats = Number(nation.total_seats) || 120;
    const currentIndependents = Number(nation.independent_seats) || 0;

    // 1. Roll independents and persist immediately. Do this BEFORE seat math
    //    so a partial failure leaves the nation in a coherent state.
    const indep = rollIndependents(currentIndependents, totalSeats);
    const { error: indepErr } = await supabase
        .from('nations')
        .update({ independent_seats: indep.next })
        .eq('id', nationId);
    if (indepErr) {
        console.error(`[runSectorElection] failed to persist independent_seats for ${nation.name}:`, indepErr.message);
        // Continue anyway — seat math is the priority; admin can reconcile.
    }
    const availableSeats = Math.max(0, totalSeats - indep.next);

    // 2. Load factions + sectors + popularity (shared with processPartialElection).
    const { factions: factionList, sectors: sectorList, popularity } =
        await loadSectorElectionInputs(supabase, nationId, { includeCurrentSeats: false });

    if (factionList.length === 0) {
        // Nation has no parties — return an empty result.
        return buildEmptySectorElectionResult(indep, totalSeats);
    }

    // Phase 1 dynamic sector weights: recompute and persist before TWP.
    // sectors carry primary_stat / secondary_stat keys (set by the
    // 20260430_sector_dynamic_weights migration); each weight is stepped
    // from the nation's current stat values (≥65→30, 35-65→20, <35→10) and
    // soft-capped to the nation total of 320. persistSectorWeights mutates
    // sectorList in place so the TWP math below reads the fresh values.
    try {
        const newWeights = computeSectorWeights(nation, sectorList);
        await persistSectorWeights(supabase, newWeights, sectorList);
    } catch (wErr) {
        console.warn(`[runSectorElection] dynamic-weight recompute failed (non-fatal):`, wErr?.message || wErr);
    }

    // Layer in target-based-option turnout + weight deltas.
    // Election-scope only — sectors.base_turnout / sectors.weight in the
    // DB are untouched.
    await applyActiveOptionSectorEffects(supabase, nationId, sectorList);

    // 3. Tie-breaker bonuses (election-scope, not persisted).
    const bonuses = applyTieBreakerBonuses(factionList, sectorList, popularity);

    // 4. Layer bonuses onto popularity rows for TWP computation. We clone the
    //    rows so we don't mutate the cached query result.
    const augmentedPop = layerBonusesIntoPopularity(popularity, sectorList, bonuses);

    // 5. Compute TWP per faction.
    const twpByFaction = {};
    const contribByFaction = {};
    for (const f of factionList) {
        twpByFaction[f.id] = calculateTotalWeightedPopularity(f.id, sectorList, augmentedPop);
        contribByFaction[f.id] = calculateSectorContributions(f.id, sectorList, augmentedPop);
    }

    // 6. Allocate seats by TWP (Largest Remainder + fringe + zero-fallback).
    let seats = allocateSeatsByTwp(twpByFaction, availableSeats);

    // 7. Electability modifier.
    const electabilityByFaction = {};
    for (const f of factionList) {
        electabilityByFaction[f.id] = electabilityBucket(f.electability);
    }
    seats = applyElectabilityModifier(seats, electabilityByFaction, availableSeats);

    // 8. ±5% uncertainty roll on the leader.
    seats = applyUncertaintyRoll(seats, availableSeats);

    // 9. Sync factions.seats. Zero out parties that received no seats so the
    //    state is clean (matches the legacy SQL RPC's behavior).
    for (const f of factionList) {
        const newSeats = seats[f.id] ?? 0;
        const { error: seatErr } = await supabase
            .from('factions')
            .update({ seats: newSeats })
            .eq('id', f.id);
        if (seatErr) {
            console.error(`[runSectorElection] failed to update seats for ${f.faction_name}:`, seatErr.message);
            // Continue — partial sync is recoverable; total failure is not.
        }
    }

    // Build the result blob in the legacy shape so existing callers don't
    // need plumbing changes. sector_breakdown is the new replay payload.
    return buildSectorElectionResult({
        factions: factionList,
        seats,
        twpByFaction,
        contribByFaction,
        bonuses,
        indep,
        totalSeats,
        nation,
        sectors: sectorList,
    });
}

/**
 * Shared loader for the sector-election inputs (factions, sectors, popularity).
 * Used by both runSectorElection (full election) and processPartialElection
 * (foundational-bill delta seats). Set includeCurrentSeats=true if the caller
 * needs to read existing factions.seats — runSectorElection only writes seats
 * so it skips that column.
 */
async function loadSectorElectionInputs(supabase, nationId, { includeCurrentSeats = false } = {}) {
    const factionColumns = includeCurrentSeats
        ? 'id, faction_name, electability, seats'
        : 'id, faction_name, electability';

    const [
        { data: factions, error: factErr },
        { data: sectors,  error: secErr  },
    ] = await Promise.all([
        supabase.from('factions')
            .select(factionColumns)
            .eq('nation_id', nationId)
            .eq('faction_type', 'party')
            .is('abandoned_at', null),
        supabase.from('sectors')
            .select('id, sector_key, name, weight, base_turnout, is_active')
            .eq('nation_id', nationId)
            .eq('is_active', true)
            .order('display_order'),
    ]);
    if (factErr) throw new Error(`load factions: ${factErr.message}`);
    if (secErr)  throw new Error(`load sectors: ${secErr.message}`);

    const factionList = factions || [];
    const sectorList  = sectors  || [];
    let popularity = [];
    if (factionList.length > 0 && sectorList.length > 0) {
        const { data: pop, error: popErr } = await supabase
            .from('faction_sector_popularity')
            .select('faction_id, sector_id, popularity')
            .in('faction_id', factionList.map(f => f.id));
        if (popErr) throw new Error(`load faction_sector_popularity: ${popErr.message}`);
        popularity = pop || [];
    }
    return { factions: factionList, sectors: sectorList, popularity };
}

/**
 * Sector-based presidential election — round 1 vote tally.
 *
 * Replaces the run_presidential_election SQL RPC. Uses TWP shares instead of
 * the dropped contested_vote_share × turnout_rate model.
 *
 * Vote model:
 *   total_votes_cast = eligible_voters × sector_weighted_turnout
 *   sector_weighted_turnout = Σ(base_turnout × weight) / Σ(weight)
 *   candidate.votes = round((party_TWP / total_party_TWP) × total_votes_cast)
 *   Multi-candidate-same-party: votes split evenly, remainder to first candidate.
 *
 * Returns the same JSONB-compatible shape as the legacy RPC so
 * processPresidentialElectionResult and admin.html consumers don't need
 * plumbing changes:
 *   {
 *     presidential_candidates: [{ candidate_id, candidate_name, faction_id,
 *                                  party_name, trait_key, votes,
 *                                  vote_percentage, winner }],
 *     bloc_details: [],
 *     total_votes_cast, total_abstentions, turnout_pct
 *   }
 */
export async function runSectorPresidentialElectionRound(supabase, nationId) {
    // Fetch nation, candidates (joined to factions), sectors, popularity, shard tick
    const [nationRes, candRes, sectorsRes, shardRes] = await Promise.all([
        supabase.from('nations')
            .select('id, name, population')
            .eq('id', nationId)
            .single(),
        supabase.from('pm_candidates')
            .select('id, first_name, last_name, faction_id, trait_key, factions(faction_name, faction_type, abandoned_at, last_seen_tick, founded_tick)')
            .eq('nation_id', nationId)
            .eq('candidate_type', 'presidential')
            .eq('selected', true),
        supabase.from('sectors')
            .select('id, sector_key, name, weight, base_turnout, is_active')
            .eq('nation_id', nationId)
            .eq('is_active', true),
        supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single(),
    ]);

    if (nationRes.error) throw new Error(`load nation: ${nationRes.error.message}`);
    if (candRes.error)   throw new Error(`load candidates: ${candRes.error.message}`);
    if (sectorsRes.error) throw new Error(`load sectors: ${sectorsRes.error.message}`);

    const nation = nationRes.data;
    if (!nation) throw new Error(`Nation not found: ${nationId}`);

    const eligible = getEligibleVoters(nation);
    const sectors  = sectorsRes.data || [];
    const tick     = shardRes.data?.current_tick ?? 0;

    // Apply target-based options' sector turnout + weight deltas before
    // the weighted turnout / TWP math below. Mutates sectors in place.
    await applyActiveOptionSectorEffects(supabase, nationId, sectors);

    // Filter candidates to active parties (mirrors the inactivity-drain
    // window — once a party starts losing seats, it can't field new
    // presidential candidates either).
    const allCands = (candRes.data || []).filter(c => {
        const f = c.factions;
        if (!f) return false;
        if (f.faction_type !== 'party') return false;
        if (f.abandoned_at) return false;
        if (f.last_seen_tick != null) return (tick - f.last_seen_tick) < INACTIVITY_DRAIN_THRESHOLD;
        return (tick - (f.founded_tick || 0)) < INACTIVITY_DRAIN_THRESHOLD;
    });

    if (allCands.length === 0) {
        return {
            presidential_candidates: [],
            bloc_details: [],
            total_votes_cast: 0,
            total_abstentions: eligible,
            turnout_pct: 0,
        };
    }

    // Load popularity for the candidate-backing factions
    const factionIds = [...new Set(allCands.map(c => c.faction_id).filter(Boolean))];
    let popularity = [];
    if (factionIds.length > 0 && sectors.length > 0) {
        const { data: pop, error: popErr } = await supabase
            .from('faction_sector_popularity')
            .select('faction_id, sector_id, popularity')
            .in('faction_id', factionIds);
        if (popErr) throw new Error(`load popularity: ${popErr.message}`);
        popularity = pop || [];
    }

    // Compute TWP per candidate-backing faction
    const twpByFaction = {};
    for (const fid of factionIds) {
        twpByFaction[fid] = calculateTotalWeightedPopularity(fid, sectors, popularity);
    }
    const totalTwp = Object.values(twpByFaction).reduce((s, v) => s + (Number(v) || 0), 0);

    // Sector-weighted turnout average. Falls back to 0.65 if sectors unavailable.
    let turnout = 0.65;
    if (sectors.length > 0) {
        const sumW = sectors.reduce((s, x) => s + (Number(x.weight) || 0), 0);
        if (sumW > 0) {
            const sumWT = sectors.reduce((s, x) => s + (Number(x.weight) || 0) * (Number(x.base_turnout) || 0), 0);
            turnout = sumWT / sumW;
        }
    }
    const totalVotesCast = Math.round(eligible * turnout);

    // Group candidates by faction so multi-candidate-same-party splits evenly
    const candsByFaction = {};
    for (const c of allCands) {
        if (!candsByFaction[c.faction_id]) candsByFaction[c.faction_id] = [];
        candsByFaction[c.faction_id].push(c);
    }

    // Build candidate vote rows
    const candidateRows = [];
    for (const c of allCands) {
        const fid = c.faction_id;
        const partyTwp = Number(twpByFaction[fid]) || 0;
        const partyShare = totalTwp > 0 ? partyTwp / totalTwp : 0;
        const partyVotes = Math.round(partyShare * totalVotesCast);
        const cohort = candsByFaction[fid] || [c];
        const perCand = Math.floor(partyVotes / cohort.length);
        // Remainder to the first candidate in the cohort (by id sort for determinism)
        const sorted = [...cohort].sort((a, b) => String(a.id).localeCompare(String(b.id)));
        const remainder = partyVotes - perCand * cohort.length;
        const isFirst = sorted[0]?.id === c.id;
        const votes = perCand + (isFirst ? remainder : 0);
        candidateRows.push({
            candidate_id:   c.id,
            candidate_name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
            faction_id:     fid,
            party_name:     c.factions?.faction_name || 'Unknown',
            trait_key:      c.trait_key || null,
            votes,
        });
    }

    // Recompute total cast from rounded candidate votes (so percentages align)
    const actualTotal = candidateRows.reduce((s, c) => s + (c.votes || 0), 0);
    const abstentions = Math.max(0, eligible - actualTotal);
    const turnoutPct  = eligible > 0 ? Number(((actualTotal / eligible) * 100).toFixed(2)) : 0;

    // Pick winner (highest votes — runoff orchestrator handles 50% threshold)
    let winnerId = null;
    let maxVotes = -1;
    for (const c of candidateRows) {
        if (c.votes > maxVotes) { maxVotes = c.votes; winnerId = c.candidate_id; }
    }

    const finalCandidates = candidateRows.map(c => ({
        ...c,
        vote_percentage: actualTotal > 0
            ? Number(((c.votes / actualTotal) * 100).toFixed(2))
            : 0,
        winner: c.candidate_id === winnerId,
    }));

    return {
        presidential_candidates: finalCandidates,
        bloc_details: [],
        total_votes_cast: actualTotal,
        total_abstentions: abstentions,
        turnout_pct: turnoutPct,
    };
}

function layerBonusesIntoPopularity(popularity, sectors, bonuses) {
    if (!bonuses || bonuses.size === 0) return popularity;
    const sectorIdByKey = new Map(sectors.map(s => [s.sector_key, s.id]));
    // Index existing rows for fast lookup.
    const indexed = new Map();
    const out = [];
    for (const r of popularity) {
        const clone = { ...r };
        indexed.set(`${r.faction_id}:${r.sector_id}`, clone);
        out.push(clone);
    }
    for (const [factionId, sectorBonuses] of bonuses) {
        for (const [sectorKey, bonusTenths] of sectorBonuses) {
            const sectorId = sectorIdByKey.get(sectorKey);
            if (!sectorId) continue;
            const key = `${factionId}:${sectorId}`;
            const existing = indexed.get(key);
            if (existing) {
                existing.popularity = (Number(existing.popularity) || 0) + bonusTenths;
            } else {
                const fresh = { faction_id: factionId, sector_id: sectorId, popularity: bonusTenths };
                indexed.set(key, fresh);
                out.push(fresh);
            }
        }
    }
    return out;
}

/**
 * Aggregate every active target-based option's per-sector deltas for a
 * nation and apply them to the supplied sectors array in place. Two
 * effect types share one fetch:
 *
 *   - sector_turnout_targets[].delta → sectors[].base_turnout (float ±0.30)
 *     effective_turnout = base_turnout + Σ deltas, clamped [0, 2]
 *   - sector_weight_targets[].delta  → sectors[].weight       (integer ±5)
 *     effective_weight  = weight + Σ deltas, floored at 1
 *
 * Both deltas are election-scope only — the columns in `sectors` stay
 * untouched in the DB. Multiple active options on the same sector sum.
 *
 * Schema: columns added in migrations 20260829 (turnout) + 20260830 (weight).
 * Mutates and returns the same sectors array so callers can chain.
 */
export async function applyActiveOptionSectorEffects(supabase, nationId, sectors) {
    if (!Array.isArray(sectors) || sectors.length === 0) return sectors;
    const { data: laws, error } = await supabase
        .from('active_laws')
        .select('selected_option:policy_options!selected_option_id(is_target_based, sector_turnout_targets, sector_weight_targets)')
        .eq('nation_id', nationId);
    if (error) {
        console.warn(`[applyActiveOptionSectorEffects] active_laws fetch failed for ${nationId}:`, error.message);
        return sectors;
    }
    const turnoutBySector = new Map();
    const weightBySector  = new Map();
    for (const law of (laws || [])) {
        const opt = law.selected_option;
        if (!opt?.is_target_based) continue;
        for (const t of (Array.isArray(opt.sector_turnout_targets) ? opt.sector_turnout_targets : [])) {
            const key = t?.sector_key;
            const d = Number(t?.delta);
            if (!key || !Number.isFinite(d) || d === 0) continue;
            turnoutBySector.set(key, (turnoutBySector.get(key) || 0) + d);
        }
        for (const t of (Array.isArray(opt.sector_weight_targets) ? opt.sector_weight_targets : [])) {
            const key = t?.sector_key;
            const d = Number(t?.delta);
            if (!key || !Number.isFinite(d) || d === 0) continue;
            weightBySector.set(key, (weightBySector.get(key) || 0) + d);
        }
    }
    if (turnoutBySector.size === 0 && weightBySector.size === 0) return sectors;
    for (const sector of sectors) {
        const turnoutDelta = turnoutBySector.get(sector.sector_key);
        if (turnoutDelta) {
            const base = Number(sector.base_turnout) || 0;
            sector.base_turnout = Math.max(0, Math.min(2, base + turnoutDelta));
        }
        const weightDelta = weightBySector.get(sector.sector_key);
        if (weightDelta) {
            const base = Number(sector.weight) || 0;
            sector.weight = Math.max(1, Math.round(base + weightDelta));
        }
    }
    return sectors;
}

/**
 * Voting-age share of population. The legacy `nation.eligible_voters`
 * column was just `population × 0.65`; Phase 9b dropped the column and
 * derives it at read time so the engine has one fewer thing to keep in
 * sync.
 */
export const VOTING_AGE_SHARE = 0.65;

/**
 * Derive the eligible-voter count from population. Returns 0 if
 * population is missing.
 */
export function getEligibleVoters(nation) {
    return Math.round((Number(nation?.population) || 0) * VOTING_AGE_SHARE);
}

/**
 * Scale TWP shares to a realistic vote count using the nation's
 * (derived) eligible voters and a sector-weighted turnout. Single
 * source of truth for the TWP→votes display math, mirroring the model
 * already in runSectorPresidentialElectionRound:
 *
 *   sectorWeightedTurnout = Σ(weight × base_turnout) / Σ(weight)
 *   totalVotesCast        = round(eligible × sectorWeightedTurnout)
 *   votes[party]          = round((twp[party] / totalTwp) × totalVotesCast)
 *
 * Falls back to a neutral 0.65 turnout if sectors are missing or carry
 * no weight, so partial-data nations still get a defensible display.
 */
export function computeTwpVoteScaling(twpByFaction, sectors, eligible) {
    let turnout = 0.65;
    if (sectors && sectors.length > 0) {
        const sumW = sectors.reduce((s, x) => s + (Number(x.weight) || 0), 0);
        if (sumW > 0) {
            const sumWT = sectors.reduce((s, x) => s + (Number(x.weight) || 0) * (Number(x.base_turnout) || 0), 0);
            turnout = sumWT / sumW;
        }
    }
    const eligibleNum = Number(eligible) || 0;
    const targetTotalVotes = Math.round(eligibleNum * turnout);

    let totalTwp = 0;
    for (const fid in twpByFaction) totalTwp += Number(twpByFaction[fid]) || 0;

    // When every faction has TWP=0 (nation hasn't seeded
    // faction_sector_popularity yet, or all rows are still at 0),
    // allocateSeatsByTwp falls through to even-split. Mirror that here so
    // the displayed vote count + turnout stay consistent with the seat
    // table: if seats split evenly, votes split evenly too. Otherwise the
    // past-elections panel reads 0 votes / 0.0% turnout while every
    // faction has 23ish seats, which looks broken.
    const factionIds = Object.keys(twpByFaction);
    const evenSplit = totalTwp === 0 && factionIds.length > 0;

    const votesByFaction = {};
    if (evenSplit) {
        const base = Math.floor(targetTotalVotes / factionIds.length);
        const remainder = targetTotalVotes - base * factionIds.length;
        factionIds.forEach((fid, i) => {
            votesByFaction[fid] = base + (i < remainder ? 1 : 0);
        });
    } else {
        for (const fid of factionIds) {
            const twp = Number(twpByFaction[fid]) || 0;
            const share = totalTwp > 0 ? twp / totalTwp : 0;
            votesByFaction[fid] = Math.round(share * targetTotalVotes);
        }
    }

    const actualTotal = Object.values(votesByFaction).reduce((s, v) => s + v, 0);
    const abstentions = Math.max(0, eligibleNum - actualTotal);
    const turnoutPct = eligibleNum > 0
        ? Number(((actualTotal / eligibleNum) * 100).toFixed(2))
        : 0;

    return { votesByFaction, totalVotesCast: actualTotal, abstentions, turnoutPct };
}

function buildSectorElectionResult({ factions, seats, twpByFaction, contribByFaction, bonuses, indep, totalSeats, nation, sectors }) {
    const seatRows = [];
    const voteRows = [];
    const breakdown = [];
    let totalTwp = 0;
    for (const f of factions) totalTwp += Number(twpByFaction[f.id]) || 0;

    // Derive realistic vote counts from TWP shares + derived eligible
    // voters (population × VOTING_AGE_SHARE). Falls through to
    // TWP-as-votes if nation isn't supplied (legacy callers).
    const eligible = getEligibleVoters(nation);
    const scaling = (eligible > 0)
        ? computeTwpVoteScaling(twpByFaction, sectors, eligible)
        : null;

    for (const f of factions) {
        const fSeats = seats[f.id] ?? 0;
        const fTwp   = Number(twpByFaction[f.id]) || 0;
        const sharePct = totalTwp > 0 ? Math.round((fTwp / totalTwp) * 10000) / 100 : 0;

        seatRows.push({ party_id: f.id, party_name: f.faction_name, seats: fSeats });
        // 'votes' is the displayed vote count for the party. With nation +
        // sectors supplied, this is the realistic eligible×turnout-scaled
        // count; without, it falls back to rounded TWP (legacy behavior).
        const fVotes = scaling
            ? (scaling.votesByFaction[f.id] ?? 0)
            : Math.round(fTwp);
        voteRows.push({
            party_id: f.id,
            party_name: f.faction_name,
            votes: fVotes,
            vote_percentage: sharePct,
            seats: fSeats,
        });
        breakdown.push({
            faction_id: f.id,
            faction_name: f.faction_name,
            twp: fTwp,
            top_contributions: (contribByFaction[f.id] || [])
                .filter(c => c.contribution > 0)
                .sort((a, b) => b.contribution - a.contribution)
                .slice(0, 3)
                .map(c => ({ sector_key: c.sector_key, name: c.name, contribution: c.contribution })),
        });
    }

    const tieBreaks = [];
    for (const [winnerId, sectorMap] of (bonuses || new Map())) {
        for (const [sectorKey] of sectorMap) {
            tieBreaks.push({ winner_faction_id: winnerId, sector_key: sectorKey });
        }
    }

    return {
        votes: voteRows,
        seats: seatRows,
        bloc_details: [],
        // Legacy display fields. With scaling supplied, these show the
        // realistic ballot count + abstentions + turnout %. Without, they
        // fall back to the old TWP-as-votes shape (non-zero only when
        // legacy callers omit nation/sectors).
        total_votes_cast: scaling ? scaling.totalVotesCast : Math.round(totalTwp),
        total_abstentions: scaling ? scaling.abstentions : 0,
        turnout_pct: scaling ? scaling.turnoutPct : null,
        eligible_voters: getEligibleVoters(nation),
        // Phase 3 additions.
        sector_breakdown: {
            independent_seats: indep.next,
            independent_roll:  indep.roll,
            independent_delta: indep.delta,
            independent_cap:   indep.cap,
            parliament_size:   totalSeats,
            available_seats:   totalSeats - indep.next,
            factions: breakdown,
            tie_breaks: tieBreaks,
        },
    };
}

function buildEmptySectorElectionResult(indep, totalSeats) {
    return {
        votes: [],
        seats: [],
        bloc_details: [],
        total_votes_cast: 0,
        total_abstentions: 0,
        turnout_pct: null,
        sector_breakdown: {
            independent_seats: indep.next,
            independent_roll:  indep.roll,
            independent_delta: indep.delta,
            independent_cap:   indep.cap,
            parliament_size:   totalSeats,
            available_seats:   totalSeats - indep.next,
            factions: [],
            tie_breaks: [],
        },
    };
}

export async function processElections(supabase, nation, currentTick) {
    const results = [];

    // Absolute monarchies NEVER hold elections. The call site in advance-tick
    // is unconditional ("democracy only" was only a comment), so this is the
    // real gate. A stale 'scheduled' election can exist — e.g. left over from
    // before the nation converted to a monarchy — and would otherwise fire
    // here. Cancel any such rows so they can never run and the "Next election:
    // Never" state stays truthful.
    if (isAbsoluteMonarchy(nation)) {
        await supabase.from('elections')
            .update({ status: 'cancelled' })
            .eq('nation_id', nation.id)
            .eq('status', 'scheduled');
        return results;
    }

    const isPresidential = hasElectedPresident(nation);

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

        // Safety check: skip snap elections if a government has ALREADY FORMED SINCE
        // the election was scheduled. This prevents snap elections (from no-confidence
        // votes or dissolutions) from firing after a new government has already taken office.
        // Regular scheduled elections should NOT be cancelled — they dissolve the existing
        // government as part of the normal election cycle.
        // BUG FIX: previously this cancelled ALL parliamentary elections when a government
        // existed, breaking the normal election cycle entirely.
        if (electionType === 'parliamentary') {
            const existingGov = await fetchActiveCoalition(supabase, nation.id);
            if (existingGov && (existingGov.status === 'formed' || existingGov.status === 'active')) {
                // Only cancel if the government formed AFTER this election was scheduled
                // (meaning a new government took office and this snap election is stale)
                const govStartTick = existingGov.started_at_tick || 0;
                const electionCreatedAt = election.created_at ? new Date(election.created_at).getTime() : 0;
                const govCreatedAt = existingGov.created_at ? new Date(existingGov.created_at).getTime() : 0;

                if (govCreatedAt > electionCreatedAt) {
                    console.log(`Skipping stale snap election for ${nation.name} — government formed after election was scheduled`);
                    await supabase.from('elections')
                        .update({ status: 'cancelled' })
                        .eq('id', election.id);
                    continue;
                }
            }
        }

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
            // General Election: always run parliamentary seats alongside presidential.
            // Check if a parliamentary election was already completed this tick (e.g. both
            // were scheduled at the same tick and parliamentary ran first in the sort order).
            const { data: parlAlreadyRan } = await supabase
                .from('elections')
                .select('id')
                .eq('nation_id', nation.id)
                .eq('status', 'completed')
                .eq('election_type', 'parliamentary')
                .eq('election_tick', currentTick)
                .limit(1)
                .maybeSingle();

            if (!parlAlreadyRan) {
                // Phase 3: parliamentary sub-election uses the sector engine.
                let parlData = null;
                try {
                    parlData = await runSectorElection(supabase, nation);
                } catch (parlError) {
                    console.error(`Parliamentary sub-election failed for presidential election in ${nation.name}:`, parlError);
                }
                if (parlData) {
                    await recordParliamentarySubElection(supabase, nation.id, parlData, currentTick);
                    console.log(`Parliamentary seats synced alongside presidential election for ${nation.name}`);
                }
            } else {
                console.log(`Parliamentary election already completed this tick for ${nation.name}, skipping sub-election`);
            }

            const { error: snapshotErr } = await supabase.rpc('snapshot_presidential_endorsements', {
                p_nation_id: nation.id,
                p_election_id: election.id
            });
            if (snapshotErr) {
                console.error(`Failed to snapshot presidential endorsements for ${nation.name}:`, snapshotErr);
                continue;
            }

            try {
                data = await runSectorPresidentialElectionRound(supabase, nation.id);
                error = null;
            } catch (e) {
                data = null;
                error = e;
            }
        } else {
            // Phase 3: parliamentary uses the sector engine. Wrap in try/catch
            // and shape the response as { data, error } to match the legacy
            // RPC contract this code path expects.
            try {
                data = await runSectorElection(supabase, nation);
                error = null;
            } catch (e) {
                data = null;
                error = e;
            }
        }

        if (error) {
            console.error(`Election RPC failed (attempt 1) for ${nation.name}:`, error);
            // Retry once
            if (electionType === 'presidential') {
                try {
                    data = await runSectorPresidentialElectionRound(supabase, nation.id);
                    error = null;
                } catch (e) {
                    data = null;
                    error = e;
                }
            } else {
                try {
                    data = await runSectorElection(supabase, nation);
                    error = null;
                } catch (e) {
                    data = null;
                    error = e;
                }
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

        // Mark the scheduled election record as completed with full results.
        // Update election_tick to currentTick so the formation window starts from
        // when the election actually ran, not when it was originally scheduled.
        // Without this, overdue elections cause ticksElapsed to be inflated and
        // the formation window expires immediately (or even auto-forms a government).
        await supabase.from('elections')
            .update({ status: 'completed', results: data, election_tick: currentTick })
            .eq('id', election.id);

        // Use the specific election we just completed (not a generic "most recent" query
        // which could return a different election type processed earlier in this tick)
        const completedElection = { id: election.id, results: data };

        if (completedElection?.results?.seats) {
            // Snapshot old seats before syncing new ones (for momentum seed)
            const { data: oldSeatData } = await supabase.from('factions')
                .select('id, seats').eq('nation_id', nation.id)
                .eq('faction_type', 'party').is('abandoned_at', null);
            const oldSeats = {};
            if (oldSeatData) for (const f of oldSeatData) oldSeats[f.id] = f.seats || 0;

            for (const r of completedElection.results.seats) {
                await supabase
                    .from('factions')
                    .update({ seats: r.seats })
                    .eq('id', r.party_id);
            }
            console.log(`Seats synced to factions for ${nation.name}`);

            // Post-election momentum seed: +1 per 5 seats gained (min 1 if any gained)
            for (const r of completedElection.results.seats) {
                const gained = (r.seats || 0) - (oldSeats[r.party_id] || 0);
                if (gained > 0) {
                    const momDelta = Math.max(1, Math.floor(gained / 5));
                    await supabase.rpc('adjust_momentum', {
                        p_faction_id: r.party_id, p_delta: momDelta,
                        p_label: `Election: gained ${gained} seat${gained !== 1 ? 's' : ''} (+${momDelta})`,
                        p_tick: currentTick
                    });
                }
            }

            // Fire election result timeline event with seat breakdown
            try {
                const sortedSeats = completedElection.results.seats
                    .slice().sort((a, b) => (b.seats || 0) - (a.seats || 0));
                const seatSummary = sortedSeats
                    .map(s => `${s.party_name || 'Unknown'}: ${s.seats}`)
                    .join(', ');
                const elType = electionType || 'parliamentary';
                const electionDesc = `${elType.charAt(0).toUpperCase() + elType.slice(1)} election held. Results: ${seatSummary}.`;
                await supabase.from('event_log').insert({
                    nation_id: nation.id,
                    event_name: 'Election Held',
                    trigger_key: 'election_held',
                    category: 'government',
                    description_chosen: electionDesc,
                    effects_applied: { election_type: elType, seats: seatSummary },
                    fired_at_tick: currentTick
                });
            } catch (e) { /* non-blocking */ }
        }

        // Dissolve legislature — fail all pending and frozen bills (new parliament must re-propose)
        const { data: dissolvedBills } = await supabase.from('bills')
            .update({ status: 'failed' })
            .eq('nation_id', nation.id)
            .in('status', ['committee', 'floor', 'frozen'])
            .select('id, nation_id, bill_type, ministry_key');

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
                .select('id, nation_id, bill_type, ministry_key');
            await syncMinistriesForFailedConfirmationBills(supabase, deskBills);
            if (deskBills?.length > 0) {
                console.log(`Failed ${deskBills.length} bill(s) on president's desk after presidential election for ${nation.name}`);
            }

            await processPresidentialElectionResult(supabase, nation, completedElection, currentTick, election.id);
        } else {
            // === PARLIAMENTARY DISSOLUTION ===
            // After any election, the old government (whether 'formed' or 'caretaker')
            // must be dissolved so that processGovernmentVacancy can apply -2 approval
            // penalties until a new coalition is formed.
            let existingGov = null;
            // See the manual-election path above: .maybeSingle() throws on
            // multiple rows, which after an early election is a legitimate
            // state (stale caretaker + prior-cycle leftover). The throw
            // skipped the dissolve and stranded the caretaker row. Fetch
            // all matching rows; the dissolve UPDATE below already clears
            // every one via .in(status,[...]).
            const { data: govFormations } = await supabase
                .from('government_formations')
                .select('id, status')
                .eq('nation_id', nation.id)
                .in('status', ['formed', 'active', 'caretaker'])
                .order('formed_at', { ascending: false });
            if (govFormations && govFormations.length > 0) existingGov = govFormations[0];

            // Fail all frozen bills (from caretaker period) regardless of whether
            // an existing government row was found — bills may have been frozen by
            // early elections even if the government row was already cleaned up.
            const { data: frozenBills } = await supabase.from('bills')
                .update({ status: 'failed' })
                .eq('nation_id', nation.id)
                .eq('status', 'frozen')
                .select('id, nation_id, bill_type, ministry_key');

            await syncMinistriesForFailedConfirmationBills(supabase, frozenBills);

            if (existingGov) {
                console.log(`Dissolving ${existingGov.status} government after election for ${nation.name}`);

                // Reset failed_formation_attempts so the new election gets a fresh
                // Stage 1 window (snap election if formation fails). Without this,
                // a stale counter from a previous snap cycle would skip straight to
                // Stage 2 (emergency minority). Only reset when dissolving an
                // existing government (regular elections), NOT after snap elections
                // (where existingGov is null and the counter must stay at 1 so the
                // post-snap formation failure escalates to Stage 2 rather than
                // calling another snap).
                if (nation.failed_formation_attempts > 0) {
                    await supabase.from('nations')
                        .update({ failed_formation_attempts: 0 })
                        .eq('id', nation.id);
                    nation.failed_formation_attempts = 0;
                    console.log(`Reset failed_formation_attempts for ${nation.name} after new election`);
                }

                // Close the administration
                try {
                    const { data: fullNation } = await supabase.from('nations').select('*').eq('id', nation.id).single();
                    const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
                    if (fullNation) {
                        await closeAdministration(supabase, nation.id, fullNation, 'dissolved', currentTick, shardData?.current_date || _gameDate(currentTick), null);
                    }
                } catch (adminErr) { console.warn('Could not close administration on election:', adminErr); }

                // Dissolve government in BOTH tables
                await supabase
                    .from('government_formations')
                    .update({ status: 'dissolved' })
                    .eq('nation_id', nation.id)
                    .in('status', ['formed', 'active', 'caretaker']);

                // closeAdministration above already vacated the cabinet —
                // explicit orphanCabinet here would be redundant.
            }

            // HoG deactivation runs UNCONDITIONALLY — see matching comment in
            // processManualElection. The existingGov guard wraps gov-row
            // cleanup, but the PM invariant ("election completed ⇒ old PM
            // out") is independent of whether a formation row existed.
            await supabase
                .from('head_of_government')
                .update({ active: false })
                .eq('nation_id', nation.id)
                .eq('active', true);
        }

        results.push({
            electionId: election.id,
            nation: nation.name,
            electionType,
            result: data
        });
    }

    // === SCHEDULE NEXT ELECTIONS ===
    await ensureElectionsScheduled(supabase, nation, currentTick);

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

    if (topPct > 50 || candidateResults.length <= 2) {
        // Clear winner with majority — no runoff needed
        winner = topCandidate;
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

        // Run the presidential election again with only the top 2
        let runoffData = null;
        let runoffErr = null;
        try {
            runoffData = await runSectorPresidentialElectionRound(supabase, nation.id);
        } catch (e) {
            runoffErr = e;
        }

        if (runoffErr) {
            console.error(`Runoff failed for ${nation.name}:`, runoffErr);
            // Fallback: use round 1 winner
            winner = topCandidate;
        } else {
            runoffResults = runoffData?.presidential_candidates || [];

            // === Redistribute eliminated candidates' votes by sector affinity (Phase 5a) ===
            // The RPC only gives each runoff candidate their base faction votes.
            // Eliminated candidates' voters redistribute proportionally based on
            // sector-stronghold overlap between their party and each surviving
            // runoff candidate's party. coalitionAffinity returns a [0,1] score
            // from shared / overlapping strongholds.
            const eliminatedCandidates = candidateResults.filter(c => !runoffCandidateIds.has(c.candidate_id));
            const runoffCandidateList = candidateResults.filter(c => runoffCandidateIds.has(c.candidate_id));

            // Load sectors + popularity for every involved faction so we can
            // compute strongholds. One round trip each.
            const allFactionIds = candidateResults.map(c => c.faction_id).filter(Boolean);
            const [
                { data: sectorRows,     error: sectorErr },
                { data: popularityRows, error: popErr   },
            ] = await Promise.all([
                supabase.from('sectors')
                    .select('id, sector_key, name, weight, base_turnout, is_active')
                    .eq('nation_id', nation.id)
                    .eq('is_active', true)
                    .order('display_order'),
                allFactionIds.length > 0
                    ? supabase.from('faction_sector_popularity')
                        .select('faction_id, sector_id, popularity')
                        .in('faction_id', allFactionIds)
                    : Promise.resolve({ data: [], error: null }),
            ]);
            if (sectorErr) console.error(`Failed to fetch sectors for runoff redistribution (${nation.name}):`, sectorErr.message);
            if (popErr)    console.error(`Failed to fetch popularity for runoff redistribution (${nation.name}):`, popErr.message);
            const sectorList = sectorRows || [];
            const popList    = popularityRows || [];

            // Pre-compute strongholds per faction so we don't repeat work
            // inside the redistribution helper.
            const strongholdsByFaction = {};
            for (const fid of allFactionIds) {
                strongholdsByFaction[fid] = getStrongholdSectors(fid, sectorList, popList, 3);
            }

            // Defensive: if the RPC returned no runoff candidates, skip the
            // redistribution math (avoids 1/0 in the affinity-fallback branch).
            const skipRedistribution = runoffCandidateList.length === 0;

            const redistribution = redistributeRunoffVotes(
                skipRedistribution ? [] : eliminatedCandidates,
                runoffCandidateList,
                strongholdsByFaction,
            );
            const runoffTransfers = redistribution.transfersByCand;
            const totalAbstained = redistribution.totalAbstained;

            // Apply transfers to runoff results
            runoffResults = runoffResults.map(c => {
                const transfers = runoffTransfers[c.candidate_id];
                const addedVotes = transfers ? transfers.transfer_votes : 0;
                return {
                    ...c,
                    votes: (c.votes || 0) + addedVotes,
                    base_votes: c.votes || 0,
                    transfer_votes: addedVotes,
                    transfer_detail: transfers?.from || []
                };
            });
            // Recalculate percentages and total after adding transfers
            const runoffTotalVotes = runoffResults.reduce((s, c) => s + (c.votes || 0), 0);
            runoffResults = runoffResults.map(c => ({
                ...c,
                vote_percentage: runoffTotalVotes > 0 ? Math.round(((c.votes || 0) / runoffTotalVotes) * 10000) / 100 : 0
            }));
            // Re-determine winner after transfers
            const runoffSorted = [...runoffResults].sort((a, b) => b.votes - a.votes);
            // Mark winner flag
            if (runoffSorted.length >= 1) {
                runoffResults = runoffResults.map(c => ({ ...c, winner: c.candidate_id === runoffSorted[0].candidate_id }));
            }
            winner = runoffSorted[0] || topCandidate;
            console.log(`Runoff winner: ${winner.candidate_name} (${winner.party_name}) with ${winner.vote_percentage}% (${nation.name})`);

            // Update the election record with combined round data
            // Replace presidential_candidates with runoff results so the UI shows the final outcome
            const combinedResults = {
                ...completedElection.results,
                presidential_candidates: runoffResults,
                round_1_candidates: candidateResults,
                runoff_candidates: runoffResults,
                total_votes_cast: runoffTotalVotes,
                was_runoff: true,
                runoff_transfers: runoffTransfers,
                runoff_abstentions: totalAbstained
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

    // Administration close is now handled atomically inside inauguratePresident()
    const endReason = isIncumbentWin ? 'reelection' : 'election_loss';

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
        await inauguratePresident(supabase, winningCandidate, nation.id, winner.faction_id, currentTick, outgoingPresident, endReason);
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
            await inauguratePresident(supabase, fallbackCandidate, nation.id, winner.faction_id, currentTick, outgoingPresident, endReason);
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
                await inauguratePresident(supabase, leaderCandidate, nation.id, winner.faction_id, currentTick, outgoingPresident, endReason);
                console.log(`President inaugurated from party leader: ${leaderCandidate.first_name} ${leaderCandidate.last_name}`);
            } else {
                // Fallback 3 (last resort): create president directly from election result data
                console.error(`[PresElection] ALL candidate lookups failed for ${winner.candidate_name} in ${nation.name} — direct inauguration from election data`);
                const directCandidate = {
                    first_name: winner.candidate_name?.split(' ')[0] || 'Unknown',
                    last_name: winner.candidate_name?.split(' ').slice(1).join(' ') || 'President',
                    age: 50,
                    trait_key: winner.trait_key || null,
                };
                await inauguratePresident(supabase, directCandidate, nation.id, winner.faction_id, currentTick, outgoingPresident, endReason);
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
            .select('state_apparatus, public_approval, standard_of_living, unrest')
            .eq('id', nation.id).single();

        if (nationStats) {
            const updates = {};
            if (isIncumbentWin) {
                // Incumbent wins: mandate renewed.
                updates.public_approval = Math.min(100, Math.round((nationStats.public_approval || 50) + 3));
                updates.state_apparatus = Math.min(100, Math.round((nationStats.state_apparatus || 50) + 2));
                console.log(`Incumbent win effects: +3 public_approval, +2 state_apparatus (${nation.name})`);
            } else if (isChallengerWin && !wasRunoff) {
                // Challenger wins (no runoff): transition effects
                updates.state_apparatus = Math.max(0, Math.round((nationStats.state_apparatus || 50) - 2));
                updates.unrest = Math.min(100, Math.round((nationStats.unrest || 0) + 3));
                console.log(`Challenger win effects: -2 state_apparatus, +3 unrest (${nation.name})`);
            } else if (isIncumbentRunoffLoss) {
                // Incumbent loses in runoff: extra penalties (contested transition)
                updates.state_apparatus = Math.max(0, Math.round((nationStats.state_apparatus || 50) - 4));
                updates.public_approval = Math.max(0, Math.round((nationStats.public_approval || 50) - 2));
                updates.unrest = Math.min(100, Math.round((nationStats.unrest || 0) + 5));
                console.log(`Incumbent runoff loss effects: -4 state_apparatus, -2 public_approval, +5 unrest (${nation.name})`);
            }

            if (Object.keys(updates).length > 0) {
                await supabase.from('nations').update(updates).eq('id', nation.id);
            }
        }

        // Election effects: incumbent win boosts approval, challenger win penalizes loser
        if (isIncumbentWin && incumbentFactionId) {
            await supabase.rpc('adjust_momentum', { p_faction_id: incumbentFactionId, p_delta: 3, p_label: 'Incumbent re-elected (+3)', p_tick: currentTick });
            console.log(`Incumbent re-elected: +3 approval to ${winner.party_name}`);
        } else if (isChallengerWin && incumbentFactionId) {
            await supabase.rpc('adjust_momentum', { p_faction_id: incumbentFactionId, p_delta: -4, p_label: 'Lost presidency (-4)', p_tick: currentTick });
            await supabase.rpc('adjust_momentum', { p_faction_id: winner.faction_id, p_delta: 3, p_label: 'Won presidency (+3)', p_tick: currentTick });
            console.log(`Challenger wins: -4 approval to outgoing party, +3 to ${winner.party_name}`);
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
        await ensureElectionsScheduled(supabase, nation, currentTick);
    } catch (e) { console.warn('Could not schedule next presidential elections:', e); }
}

/**
 * Inaugurate a president from a candidate record. Creates the president row,
 * applies ideology shift, applies trait effects, and creates an administration.
 * Used by processPresidentialElectionResult (auto-inauguration).
 */
export async function inauguratePresident(supabase, candidate, nationId, factionId, currentTick, outgoingPresident = null, endReason = 'election_loss') {
    // Fetch nation data early for per-nation term length
    const { data: nationForTerm, error: nationTermErr } = await supabase.from('nations').select('presidential_term_ticks, presidential_term_limit').eq('id', nationId).single();
    if (nationTermErr) console.error(`[inauguratePresident] Failed to fetch nation term data:`, nationTermErr.message);

    // Determine terms_served: if re-elected (same person), increment; otherwise start at 1
    let termsServed = 1;
    if (outgoingPresident &&
        outgoingPresident.first_name === candidate.first_name &&
        outgoingPresident.last_name === candidate.last_name &&
        outgoingPresident.faction_id === factionId) {
        termsServed = (outgoingPresident.terms_served || 1) + 1;
        console.log(`President re-elected: ${candidate.first_name} ${candidate.last_name} — term ${termsServed}`);
    }

    // Insert NEW president FIRST. The previous order deactivated the
    // outgoing president before the INSERT, so a transient INSERT failure
    // left the nation with zero active presidents — the "President left
    // empty" bug. Inserting first means a failed INSERT still leaves the
    // outgoing president in office, which is the correct fallback.
    // Phase 5b: presidents.ideology column dropped.
    // Trait is now resolved from POSITIVE_TRAITS at display time
    // (leader_traits table removed).
    const { data: newPresident, error: presErr } = await supabase.from('presidents').insert({
        nation_id: nationId,
        faction_id: factionId,
        first_name: candidate.first_name,
        last_name: candidate.last_name,
        age: candidate.age,
        trait: candidate.trait_key,
        trait_upside: null,
        trait_downside: null,
        elected_tick: currentTick,
        term_ends_tick: currentTick + getPresidentialTermTicks(nationForTerm),
        is_active: true,
        terms_served: termsServed
    }).select('id').single();
    if (presErr) throw presErr;
    if (!newPresident?.id) throw new Error(`[inauguratePresident] insert succeeded but returned no id for ${nationId}`);

    // Deactivate ALL other active presidents (excluding the just-inserted
    // row). Logged but non-blocking — the new president is already in
    // office; a stale prior row will be caught by the post-condition
    // check below or cleaned up on the next inauguration.
    const { error: deactErr } = await supabase.from('presidents')
        .update({ is_active: false })
        .eq('nation_id', nationId)
        .eq('is_active', true)
        .neq('id', newPresident.id);
    if (deactErr) {
        console.error(`[inauguratePresident] Failed to deactivate previous presidents for ${nationId}:`, deactErr.message);
    }

    // Post-condition: exactly one active president row must exist for
    // this nation. Anything else is a data-integrity violation that
    // breaks every downstream consumer (fetchActiveCoalition, EO
    // authority checks, semi-pres PM nomination).
    const { count: activeCount, error: countErr } = await supabase.from('presidents')
        .select('id', { count: 'exact', head: true })
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (countErr) {
        console.error(`[inauguratePresident] post-condition count query failed:`, countErr.message);
    } else if (activeCount !== 1) {
        throw new Error(`[inauguratePresident] post-condition violation: nation ${nationId} has ${activeCount} active president rows (expected exactly 1)`);
    }

    // Mirror the active president onto nations.head_of_state_* so the UI
    // (which reads the nation row, not the presidents table) stays
    // current. Single source of mirror logic in the SQL RPC.
    const { error: syncErr } = await supabase.rpc('sync_nation_head_of_state', { p_nation_id: nationId });
    if (syncErr) console.error(`[inauguratePresident] HOS sync failed for ${nationId}:`, syncErr.message);

    // Phase 5a: presidential ideology shift removed. The legacy mechanic
    // wrote a +15 shift on the winning candidate's ideology axis to faction_
    // ideology. With sectors as the live political dimension, ideology data
    // is frozen (Phase 4) and slated for deletion (Phase 5b), so this write
    // path is gone.

    // Old leader_traits effect system removed — trait is display-only now

    // ── Presidential transition: clean slate for new administration ──

    // Crisis sunset (Phase 2): "The Big One" (Tier-7 protest crisis)
    // active_crises cleanup removed. The protest tier-7 crisis writer
    // in resolveProtest is also gone, so there's nothing for a new
    // presidency to clear here.

    // Reset executive overreach counter — new president starts with clean record
    const { error: overreachErr } = await supabase.from('nations')
        .update({ overreach_count: 0 })
        .eq('id', nationId);
    if (overreachErr) {
        console.error(`[inauguratePresident] Failed to reset overreach_count:`, overreachErr.message);
    }

    // Reset government approval to 50 — new administration starts with clean slate
    const { error: approvalResetErr } = await supabase.from('nations')
        .update({ gov_approval: 50, gov_approval_events: 0 })
        .eq('id', nationId);
    if (approvalResetErr) {
        console.error(`[inauguratePresident] Failed to reset gov_approval:`, approvalResetErr.message);
    }

    // Remove all acting ministers — new president appoints their own cabinet
    const { error: actingErr } = await supabase.from('ministries')
        .update({
            minister_first_name: null,
            minister_last_name: null,
            minister_age: null,
            is_acting: false,
            acting_order_id: null,
            confirmation_status: null
        })
        .eq('nation_id', nationId)
        .eq('is_acting', true);
    if (actingErr) {
        console.error(`[inauguratePresident] Failed to remove acting ministers:`, actingErr.message);
    } else {
        console.log(`[inauguratePresident] Removed acting ministers for ${nationId}`);
    }
    // Deactivate the associated executive orders for acting ministers
    const { error: actingEoErr } = await supabase.from('executive_orders')
        .update({ is_active: false })
        .eq('nation_id', nationId)
        .eq('order_type', 'acting_minister')
        .eq('is_active', true);
    if (actingEoErr) {
        console.error(`[inauguratePresident] Failed to deactivate acting minister EOs:`, actingEoErr.message);
    }

    // Active executive orders from previous presidents are kept —
    // new president can undo them via their own executive actions.

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
    const dateStr = shardData?.current_date || _gameDate(currentTick);
    const yearMatch = dateStr.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : '';

    // Atomically close previous administration and create new one
    // Close first to satisfy uniq_open_administration_per_nation constraint
    const { error: closeErr } = await supabase
        .from('administrations')
        .update({
            ended_at_tick: currentTick,
            ended_at_date: _normalizeAdminEndDate(dateStr, currentTick),
            end_reason: endReason,
            approval_at_end: faction?.approval_rating ?? null,
            stats_at_end: fullNation ? snapshotNationStats(fullNation) : {},
            updated_at: new Date().toISOString()
        })
        .eq('nation_id', nationId)
        .is('ended_at_tick', null);
    if (closeErr) {
        console.error(`[inauguratePresident] Failed to close previous administration for ${nationId}:`, closeErr.message);
    } else {
        console.log(`[inauguratePresident] Closed previous administration for ${nationId} (reason: ${endReason})`);
    }

    // Create new administration
    const { error: adminErr } = await supabase.from('administrations').insert({
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
        started_at_date: _normalizeAdminEndDate(dateStr, currentTick),
        stats_at_start: fullNation ? snapshotNationStats(fullNation) : {},
        approval_at_start: 50,
        head_of_state_title: fullNation?.head_of_state_title || null
    });
    if (adminErr) {
        console.error(`[inauguratePresident] Failed to create new administration for ${nationId}:`, adminErr.message);
    } else {
        await _verifyAdministrationIntegrity(supabase, nationId, 'inauguratePresident');
    }

    return candidate;
}

/**
 * Ensure future elections are scheduled for a nation.
 * Always schedules parliamentary. Presidential systems also get presidential elections.
 */
export async function ensureElectionsScheduled(supabase, nation, currentTick) {
    // Absolute monarchies never hold elections — never schedule one. Without
    // this, the parliamentary-cycle insert below recreated a scheduled
    // election every tick for a monarchy, which processElections then fired.
    if (isAbsoluteMonarchy(nation)) return;

    // Parliamentary cycle (every parliamentaryTermTicks). Read first so
    // the presidential branch below can align onto it for first-ever
    // presidential elections.
    const { data: futureParl } = await supabase
        .from('elections')
        .select('id, election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .eq('election_type', 'parliamentary')
        .gt('election_tick', currentTick)
        .limit(1)
        .maybeSingle();

    let parlTick = futureParl?.election_tick ?? null;
    if (!futureParl) {
        parlTick = currentTick + getParliamentaryTermTicks(nation);
        const { error: parlErr } = await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: parlTick,
            election_type: 'parliamentary',
            status: 'scheduled'
        });
        if (parlErr) console.error(`Failed to schedule parliamentary election for ${nation.name}:`, parlErr.message);
        else console.log(`Scheduled next parliamentary election for ${nation.name} at tick ${parlTick}`);
    }

    // Presidential cycle (every presidentialTermTicks, must coincide
    // with a parliamentary tick — every other parliamentary election
    // is a "General" with both fired together; the off ones are
    // midterms). Cycles stay aligned naturally after the first General
    // because presidentialTerm = 2 × parliamentaryTerm by design.
    if (hasElectedPresident(nation)) {
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
            // First-ever presidential election: align with the next
            // parliamentary tick so the FIRST election fires as a
            // General (P+P together) instead of leaving the nation
            // president-less for a full presidential cycle.
            const { data: pastPres } = await supabase
                .from('elections')
                .select('id')
                .eq('nation_id', nation.id)
                .eq('election_type', 'presidential')
                .limit(1)
                .maybeSingle();

            const presTick = pastPres
                ? currentTick + getPresidentialTermTicks(nation)
                : (parlTick ?? currentTick + getParliamentaryTermTicks(nation));

            const { error: presErr } = await supabase.from('elections').insert({
                nation_id: nation.id,
                election_tick: presTick,
                election_type: 'presidential',
                status: 'scheduled'
            });
            if (presErr) console.error(`Failed to schedule presidential election for ${nation.name}:`, presErr.message);
            else console.log(`Scheduled next presidential election for ${nation.name} at tick ${presTick}${pastPres ? '' : ' (first-ever — paired with parliamentary)'}`);
        }
    }
}
