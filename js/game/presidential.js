/**
 * presidential.js — Presidential candidates, nomination, veto, and term processing
 * Extracted from game-common.js
 */

import { GAME_CONFIG } from './config.js';
import { isParliamentaryDemocracy, isPresidentialRepublic } from './government-types.js';
import { loadFactionIdeology } from './ideology.js';
import { enactBill, failBill } from './bills.js';
import { resolveBudgetBill, GOVERNMENT_SHUTDOWN_CRISIS_ID } from './budget.js';
import { adjustMomentumAll } from './momentum.js';
import { PM_FIRST_NAMES, PM_LAST_NAMES, PM_TRAIT_KEYS, getWeightedIdeologies, selectPMCandidate, weightedRandomPick } from './political-actions.js';
import { fetchActiveCoalition } from './government-structure.js';
import { adjustGovernmentApprovalEvent } from './momentum.js';

/**
 * Generate 3 president candidates for a party (reuses PM candidate generation pattern).
 * Candidates are stored in pm_candidates table with candidate_type = 'presidential';
 * select-candidate.html?role=president reads them.
 *
 * @param {string} candidateType - 'presidential' (default)
 */
export async function generatePresidentCandidates(supabase, nationId, factionId, currentTick, candidateType = 'presidential') {
    const factionIdeology = await loadFactionIdeology(supabase, factionId);

    // Clear any existing unselected presidential candidates for this faction
    await supabase
        .from('pm_candidates')
        .delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('candidate_type', 'presidential')
        .eq('selected', false);

    const weightedIdeologies = getWeightedIdeologies(factionIdeology);

    const chosenIdeologies = [];
    const availableIdeologies = [...weightedIdeologies];
    for (let i = 0; i < 3; i++) {
        const pick = weightedRandomPick(availableIdeologies);
        chosenIdeologies.push(pick.item);
        const sameAxis = availableIdeologies.filter(
            wi => wi.item.axisKey === pick.item.axisKey
        );
        sameAxis.forEach(sa => {
            const idx = availableIdeologies.indexOf(sa);
            if (idx >= 0) availableIdeologies.splice(idx, 1);
        });
    }

    const shuffledTraits = [...PM_TRAIT_KEYS].sort(() => Math.random() - 0.5);
    const chosenTraits = shuffledTraits.slice(0, 3);

    const usedFirstNames = new Set();
    const usedLastNames = new Set();
    const candidates = [];

    for (let i = 0; i < 3; i++) {
        let firstName, lastName;

        do { firstName = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)]; }
        while (usedFirstNames.has(firstName));
        usedFirstNames.add(firstName);

        do { lastName = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)]; }
        while (usedLastNames.has(lastName));
        usedLastNames.add(lastName);

        const age = 35 + Math.floor(Math.random() * 16); // Presidents: age 35-50
        const ideology = chosenIdeologies[i];

        candidates.push({
            nation_id: nationId,
            faction_id: factionId,
            first_name: firstName,
            last_name: lastName,
            age: age,
            ideology: ideology.tag,
            ideology_axis: ideology.axisKey,
            ideology_direction: ideology.direction,
            trait_key: chosenTraits[i],
            created_at_tick: currentTick,
            candidate_type: candidateType,
            selected: false
        });
    }

    const { data, error } = await supabase
        .from('pm_candidates')
        .insert(candidates)
        .select();

    if (error) {
        console.error('Error generating president candidates:', error);
        throw error;
    }

    console.log(`Generated 3 president candidates for faction ${factionId}`);
    return data;
}

/**
 * Select a presidential nominee BEFORE the election. Marks the candidate as selected
 * and deletes the other options. The actual inauguration happens automatically when
 * the election resolves via processPresidentialElectionResult → inauguratePresident.
 */
export async function selectPresidentCandidate(supabase, candidateId, nationId, factionId, currentTick) {
    const { data: candidate, error: fetchErr } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

    if (fetchErr || !candidate) throw new Error('Candidate not found');
    if (candidate.faction_id !== factionId) throw new Error('Not your candidate');

    // Mark selected, delete others for this faction
    await supabase.from('pm_candidates').update({ selected: true }).eq('id', candidateId);
    await supabase.from('pm_candidates').delete()
        .eq('nation_id', nationId)
        .eq('faction_id', factionId)
        .eq('candidate_type', 'presidential')
        .eq('selected', false);

    console.log(`Presidential nominee selected: ${candidate.first_name} ${candidate.last_name} (${candidate.trait_key}) for faction ${factionId}`);
    return candidate;
}


// ==================== PRESIDENTIAL MINISTER NOMINATION ====================

/**
 * President nominates a minister for a cabinet slot.
 * Writes pending data to the ministries table and creates a confirmation bill.
 * Parliament votes simple majority; if rejected, the party is blocked for that slot.
 *
 * @param {object} supabase
 * @param {string} nationId
 * @param {string} presidentFactionId - The president's faction (must match active president)
 * @param {string} ministryKey - Which ministry slot (e.g. 'defense', 'finance')
 * @param {object} nominee - { partyId, partyName, firstName, lastName, age }
 */
export async function nominateMinister(supabase, nationId, presidentFactionId, ministryKey, nominee) {
    // Validate: must be Presidential system
    const { data: nation } = await supabase.from('nations').select('name, government_type').eq('id', nationId).single();
    if (!isPresidentialRepublic(nation)) throw new Error('Minister nominations only apply to Presidential systems');

    // Validate: caller must be president's party
    const { data: president } = await supabase.from('presidents')
        .select('id, faction_id')
        .eq('nation_id', nationId).eq('is_active', true)
        .limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can nominate ministers');

    // Validate: no existing pending confirmation for this slot
    const { data: existingMinistry } = await supabase.from('ministries')
        .select('id, confirmation_status, rejected_parties')
        .eq('nation_id', nationId).eq('ministry_key', ministryKey).eq('is_active', true)
        .maybeSingle();

    if (existingMinistry?.confirmation_status === 'pending') {
        throw new Error('A confirmation vote is already pending for this ministry');
    }

    // Validate: nominee's party was not already rejected for this slot
    const rejectedParties = existingMinistry?.rejected_parties || [];
    if (rejectedParties.includes(nominee.partyId)) {
        throw new Error('This party\'s nominee was already rejected for this ministry slot');
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
            pending_minister: pendingData,
            rejected_parties: []
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
    const preamble = `The President nominates ${nominee.firstName} ${nominee.lastName} (${nominee.partyName}) to serve as ${ministerTitle}. A simple majority (${GAME_CONFIG.MAJORITY_SEATS} of ${GAME_CONFIG.TOTAL_SEATS} seats) is required for confirmation.`;

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
    const { data: bill } = await supabase.from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('id', billId).single();
    if (!bill || bill.status !== 'president_desk') throw new Error('Bill is not on the president\'s desk');

    // Validate caller is president's party
    const { data: president } = await supabase.from('presidents')
        .select('faction_id').eq('nation_id', bill.nation_id).eq('is_active', true).limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can sign bills');

    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    if (bill.bill_type === 'budget') {
        // Budget bills: resolve budget effects instead of enactBill
        await resolveBudgetBill(supabase, bill, currentTick);
        await supabase.from('bills').update({
            status: 'passed',
            president_action: 'signed',
            president_action_tick: currentTick
        }).eq('id', bill.id);
    } else {
        const enactment = await enactBill(supabase, bill, currentTick);
        if (!enactment?.success) {
            // Mark bill as failed so it doesn't stay stuck on the desk
            await supabase.from('bills').update({
                status: 'failed',
                president_action: 'signed',
                president_action_tick: currentTick
            }).eq('id', bill.id);
            throw new Error(enactment?.error || 'Bill enactment failed after presidential signature');
        }
        // Only mark president_action after successful enactment
        // (enactBill already sets status='passed')
        await supabase.from('bills').update({
            president_action: 'signed',
            president_action_tick: currentTick
        }).eq('id', bill.id);
    }

    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'bill_passed',
            p_nation_id: bill.nation_id,
            p_tick: currentTick,
            p_placeholders: {
                nation: 'Unknown',
                bill_name: bill.bill_name + ' (signed by President)',
                sponsor: bill.factions?.faction_name || 'Unknown',
                votes_for: '0', votes_against: '0', votes_abstain: '0',
                article_count: String((bill.bill_articles || []).length)
            }
        });
    } catch (e) { /* non-blocking */ }
}

/**
 * President vetoes a bill.
 * Auto-creates a veto_override bill requiring 2/3 supermajority.
 */
export async function vetoPresidentialBill(supabase, billId, presidentFactionId) {
    const { data: bill } = await supabase.from('bills')
        .select('*, factions(faction_name)')
        .eq('id', billId).single();
    if (!bill || bill.status !== 'president_desk') throw new Error('Bill is not on the president\'s desk');

    const { data: president } = await supabase.from('presidents')
        .select('faction_id').eq('nation_id', bill.nation_id).eq('is_active', true).limit(1).maybeSingle();
    if (!president || president.faction_id !== presidentFactionId) throw new Error('Only the President\'s party can veto bills');

    const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;

    // Mark bill as vetoed
    await supabase.from('bills').update({
        status: 'vetoed',
        president_action: 'vetoed',
        president_action_tick: currentTick
    }).eq('id', bill.id);

    // Auto-create veto override bill (goes straight to floor)
    const overrideSeats = Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD);
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
        preamble: `The President has vetoed "${bill.bill_name}". The legislature may override this veto with a two-thirds supermajority (${overrideSeats} of ${GAME_CONFIG.TOTAL_SEATS} seats).`
    }).select().single();

    // Budget veto: apply president penalty + activate government shutdown
    if (bill.bill_type === 'budget') {
        if (president?.faction_id) {
            await adjustMomentumAll(
                supabase, bill.nation_id, president.faction_id,
                GAME_CONFIG.BUDGET_FAILURE_PRESIDENT_PENALTY,
                'budget:presidential_veto'
            );
        }
        // Directly activate government shutdown crisis
        const { data: existingCrises } = await supabase
            .from('active_crises')
            .select('id')
            .eq('nation_id', bill.nation_id)
            .eq('crisis_id', GOVERNMENT_SHUTDOWN_CRISIS_ID);

        if (!existingCrises || existingCrises.length === 0) {
            await supabase.from('active_crises').insert({
                crisis_id: GOVERNMENT_SHUTDOWN_CRISIS_ID,
                nation_id: bill.nation_id,
                started_at_tick: currentTick,
                effects_applied_log: []
            });
            await supabase.from('event_log').insert({
                nation_id: bill.nation_id,
                event_name: 'CRISIS_STARTED: Government Shutdown',
                description_used: 'The President has vetoed the budget. The government has shut down pending a veto override vote.',
                category: 'crisis',
                effects_applied: [],
                fired_at_tick: currentTick
            });
        }
        console.log(`[vetoPresidentialBill] Budget vetoed — government shutdown activated for nation ${bill.nation_id}`);
    }

    try {
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'bill_failed',
            p_nation_id: bill.nation_id,
            p_tick: currentTick,
            p_placeholders: {
                nation: 'Unknown',
                bill_name: bill.bill_name + ' (VETOED by President)',
                sponsor: bill.factions?.faction_name || 'Unknown',
                votes_for: '0', votes_against: '0', votes_abstain: '0'
            }
        });
    } catch (e) { /* non-blocking */ }

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

        if (bill.bill_type === 'budget') {
            // Budget bills: resolve budget effects instead of enactBill
            try {
                await resolveBudgetBill(supabase, bill, currentTick);
                await supabase.from('bills').update({ status: 'passed' }).eq('id', bill.id);
            } catch (budgetErr) {
                console.error(`[processPresidentDesk] resolveBudgetBill failed for bill ${bill.id}: ${budgetErr.message}`);
                results.push({ billId: bill.id, billName: bill.bill_name, action: 'auto_signed', enactFailed: true, error: budgetErr.message });
                continue;
            }
        } else {
            const enactment = await enactBill(supabase, bill, currentTick);
            if (!enactment?.success) {
                console.error(`[processPresidentDesk] Enactment failed for bill ${bill.id}: ${enactment?.error}`);
                results.push({ billId: bill.id, billName: bill.bill_name, action: 'auto_signed', enactFailed: true, error: enactment?.error });
                continue;
            }
        }

        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'bill_passed',
                p_nation_id: nation.id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation.name,
                    bill_name: bill.bill_name + ' (auto-signed by President)',
                    sponsor: bill.factions?.faction_name || 'Unknown',
                    votes_for: '0', votes_against: '0',
                    article_count: String((bill.bill_articles || []).length)
                }
            });
        } catch (e) { /* non-blocking */ }

        results.push({ billId: bill.id, billName: bill.bill_name, action: 'auto_signed' });
    }
    return results;
}

/**
 * Pre-election candidate generation: PRESIDENTIAL_CANDIDATE_LEAD_TICKS (6) ticks
 * before a scheduled presidential election, generate 3 presidential candidates for
 * each non-incumbent party. The incumbent president is automatically locked in as
 * their party's candidate (no player choice). Other parties' players pick their
 * nominee; autoSelectPresidentialCandidates() handles unselected parties on election day.
 *
 * Candidates are stored in pm_candidates with candidate_type = 'presidential'.
 */
export async function triggerPresidentialCandidateSelection(supabase, nation, currentTick) {
    if (!isPresidentialRepublic(nation)) return;

    const leadTicks = GAME_CONFIG.PRESIDENTIAL_CANDIDATE_LEAD_TICKS;

    // Find scheduled presidential elections that are within leadTicks away
    // (use lte instead of eq to handle missed ticks from server downtime)
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

    // Check if candidates were already generated for this election
    const { count: existingCount } = await supabase
        .from('pm_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential');

    if (existingCount > 0) return; // already generated

    console.log(`Generating presidential candidates for all parties in ${nation.name} (election at tick ${targetTick})`);

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

    const termLimit = GAME_CONFIG.PRESIDENTIAL_TERM_LIMIT || 2;

    for (const party of allParties) {
        try {
            const isIncumbentParty = incumbentPresident && party.id === incumbentPresident.faction_id;
            const isTermLimited = isIncumbentParty && (incumbentPresident.terms_served || 1) >= termLimit;

            if (isIncumbentParty && isTermLimited) {
                // === TERM-LIMITED: incumbent has served max terms, party must pick a new candidate ===
                console.log(`TERM LIMIT: President ${incumbentPresident.first_name} ${incumbentPresident.last_name} has served ${incumbentPresident.terms_served} term(s) (limit: ${termLimit}). ${party.faction_name} must choose a new candidate. (${nation.name})`);
                await generatePresidentCandidates(supabase, nation.id, party.id, currentTick, 'presidential');
            } else if (isIncumbentParty) {
                // === INCUMBENT LOCK-IN: auto-create incumbent as their party's candidate ===
                // The incumbent president is automatically locked in as their faction's nominee.
                // No player choice — they must run for re-election. Player must impeach/resign to change.
                const factionIdeology = await loadFactionIdeology(supabase, incumbentPresident.faction_id);

                // Determine the incumbent's ideology axis from faction ideology
                // Use the faction's strongest axis as a proxy since we don't store axis on presidents
                let ideologyAxis = 'tradition_progress';
                let ideologyDirection = 1;
                if (factionIdeology) {
                    const axes = ['liberty_equality', 'tradition_progress', 'security_freedom', 'globalism_nationalism', 'individualism_collectivism'];
                    let maxAbs = 0;
                    for (const axis of axes) {
                        const val = Math.abs(factionIdeology[axis] || 0);
                        if (val > maxAbs) {
                            maxAbs = val;
                            ideologyAxis = axis;
                            ideologyDirection = (factionIdeology[axis] || 0) >= 0 ? 1 : -1;
                        }
                    }
                }

                // Clear any existing unselected presidential candidates for this faction
                await supabase.from('pm_candidates').delete()
                    .eq('nation_id', nation.id)
                    .eq('faction_id', incumbentPresident.faction_id)
                    .eq('candidate_type', 'presidential')
                    .eq('selected', false);

                // Insert the incumbent as a pre-selected candidate
                const { error: incumbentErr } = await supabase.from('pm_candidates').insert({
                    nation_id: nation.id,
                    faction_id: incumbentPresident.faction_id,
                    first_name: incumbentPresident.first_name,
                    last_name: incumbentPresident.last_name,
                    age: incumbentPresident.age,
                    ideology: incumbentPresident.ideology || 'PROGRESS',
                    ideology_axis: ideologyAxis,
                    ideology_direction: ideologyDirection,
                    trait_key: incumbentPresident.trait || PM_TRAIT_KEYS[0],
                    created_at_tick: currentTick,
                    candidate_type: 'presidential',
                    selected: true // Auto-selected — locked in
                });

                if (incumbentErr) {
                    console.error(`Error creating incumbent candidate for ${incumbentPresident.first_name} ${incumbentPresident.last_name}:`, incumbentErr);
                } else {
                    console.log(`INCUMBENT LOCK-IN: President ${incumbentPresident.first_name} ${incumbentPresident.last_name} auto-locked as ${party.faction_name}'s candidate (${nation.name})`);
                }
            } else {
                // Normal candidate generation for non-incumbent parties
                await generatePresidentCandidates(supabase, nation.id, party.id, currentTick, 'presidential');
            }
        } catch (partyErr) {
            console.error(`Error generating presidential candidate for party ${party.faction_name} (${party.id}) in ${nation.name}:`, partyErr);
        }
    }

    // Fire system event for incumbent lock-in (only if not term-limited)
    const incumbentIsTermLimited = incumbentPresident && (incumbentPresident.terms_served || 1) >= termLimit;
    if (incumbentPresident && !incumbentIsTermLimited) {
        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'incumbent_lockin',
                p_nation_id: nation.id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation.name,
                    president_name: `${incumbentPresident.first_name} ${incumbentPresident.last_name}`,
                    election_tick: String(targetTick),
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
        // No election scheduled — schedule one for next tick
        await supabase.from('elections').insert({
            nation_id: nation.id,
            election_tick: currentTick + 1,
            election_type: 'presidential',
            status: 'scheduled'
        });
        console.log(`Emergency presidential election scheduled for ${nation.name} at tick ${currentTick + 1} (term expired)`);
    }
}

/**
 * Auto-select a presidential candidate for every party that has unselected
 * candidates but no selected one. Called immediately before a presidential
 * election fires so every party participates in the candidate popular vote.
 */
export async function autoSelectPresidentialCandidates(supabase, nation, currentTick) {
    // Find all unselected presidential candidates for this nation
    const { data: unselected } = await supabase
        .from('pm_candidates')
        .select('id, faction_id, first_name, last_name')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential')
        .eq('selected', false)
        .order('created_at', { ascending: true });

    if (!unselected || unselected.length === 0) return;

    // Find which factions already have a selected candidate
    const { data: alreadySelected } = await supabase
        .from('pm_candidates')
        .select('faction_id')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'presidential')
        .eq('selected', true);

    const selectedFactions = new Set((alreadySelected || []).map(r => r.faction_id));

    // Group unselected by faction, auto-select the first for factions with no selection
    const factionGroups = {};
    for (const c of unselected) {
        if (selectedFactions.has(c.faction_id)) continue;
        if (!factionGroups[c.faction_id]) factionGroups[c.faction_id] = c;
    }

    for (const [factionId, pick] of Object.entries(factionGroups)) {
        console.log(`Auto-selecting presidential candidate for election: ${pick.first_name} ${pick.last_name} (faction ${factionId}) in ${nation.name}`);
        try {
            await selectPresidentCandidate(supabase, pick.id, nation.id, factionId, currentTick);
        } catch (e) {
            console.error(`Error auto-selecting presidential candidate for ${nation.name}:`, e);
        }
    }
}

/**
 * No-op: presidential candidate selection stays open for the full 6-tick window
 * until election day. autoSelectPresidentialCandidates() handles auto-selection
 * at election time inside processElections().
 */
export async function processPresidentCandidateTimeout(supabase, nation, currentTick) {
    return;
}

/**
 * Auto-select parliamentary PM candidates that have timed out (3 ticks).
 * Mirrors processPresidentCandidateTimeout but for parliamentary systems.
 */
export async function processParliamentaryPMTimeout(supabase, nation, currentTick) {
    if (!isParliamentaryDemocracy(nation)) return;

    // Guard: only auto-select PM if a coalition is actually formed
    const coalition = await fetchActiveCoalition(supabase, nation.id);
    if (!coalition || (coalition.status !== 'formed' && coalition.status !== 'caretaker')) return;

    const timeoutTicks = 3;
    const { data: staleCandidates } = await supabase
        .from('pm_candidates')
        .select('*')
        .eq('nation_id', nation.id)
        .eq('candidate_type', 'parliamentary')
        .eq('selected', false)
        .lte('created_at_tick', currentTick - timeoutTicks)
        .order('created_at_tick', { ascending: true });

    if (!staleCandidates || staleCandidates.length === 0) return;

    // Group by faction to auto-select one per party
    const factionGroups = {};
    for (const c of staleCandidates) {
        if (!factionGroups[c.faction_id]) factionGroups[c.faction_id] = [];
        factionGroups[c.faction_id].push(c);
    }

    for (const [factionId, candidates] of Object.entries(factionGroups)) {
        // Check if this faction already has a selected candidate
        const { data: alreadySelected } = await supabase
            .from('pm_candidates')
            .select('id')
            .eq('nation_id', nation.id)
            .eq('faction_id', factionId)
            .eq('candidate_type', 'parliamentary')
            .eq('selected', true)
            .limit(1)
            .maybeSingle();
        if (alreadySelected) continue;

        const pick = candidates[0];
        console.log(`Auto-selecting parliamentary PM for ${nation.name}: ${pick.first_name} ${pick.last_name} — selection timed out after ${timeoutTicks} ticks`);

        try {
            await selectPMCandidate(supabase, pick.id, nation.id, factionId, currentTick);
        } catch (e) {
            console.error(`Error auto-selecting parliamentary PM for ${nation.name}:`, e);
        }
    }
}

// ==================== NOMINEE SELF-REJECTION ====================

/**
 * Called when the nominated party votes NO on their own minister confirmation bill.
 * Immediately ends the vote as failed, applies -2 gov approval to the president,
 * adds the party to rejected_parties so the president cannot re-nominate them.
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
        .select('id, pending_minister, rejected_parties')
        .eq('nation_id', bill.nation_id).eq('ministry_key', mKey).eq('is_active', true)
        .maybeSingle();

    if (!ministry?.pending_minister || ministry.pending_minister.party_id !== nomineePartyId) {
        throw new Error('Your party is not the nominee for this confirmation');
    }

    // 1. Fail the bill immediately
    await failBill(supabase, bill);

    // 2. Add nominee's party to rejected_parties so President cannot re-nominate them
    const existingRejected = ministry.rejected_parties || [];
    if (!existingRejected.includes(nomineePartyId)) {
        existingRejected.push(nomineePartyId);
    }
    await supabase.from('ministries').update({
        confirmation_status: 'rejected',
        pending_minister: null,
        rejected_parties: existingRejected
    }).eq('id', ministry.id);

    // 3. Apply -2 government approval event (penalty to the president)
    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, -2, 'minister:nominee_self_rejected');

    // 4. Fire system event
    try {
        const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        await supabase.rpc('fire_system_event', {
            p_trigger_key: 'bill_failed',
            p_nation_id: bill.nation_id,
            p_tick: shard?.current_tick || 0,
            p_placeholders: {
                nation: 'Unknown',
                bill_name: bill.bill_name + ' (Nominee declined)',
                sponsor: 'President',
                votes_for: '0',
                votes_against: '0',
                votes_abstain: '0'
            }
        });
    } catch (e) { /* non-blocking */ }

    console.log(`Nominee self-rejection: party ${nomineePartyId} declined nomination for ${mKey} (bill ${billId}). -2 gov approval applied.`);
    return { rejected: true, ministryKey: mKey };
}

// Tick lock and tick mutation are intentionally Edge Function only.

