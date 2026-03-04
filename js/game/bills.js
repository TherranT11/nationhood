/**
 * bills.js — Bill support, vote tallies, ideology shifts, resolution engine, foundational bills
 * Extracted from game-common.js
 */

import { GAME_CONFIG, initGameConfigForNation } from './config.js';
import { isPresidentialRepublic } from './government-types.js';
import { DIPLOMACY_CONFIG } from './diplomacy-constants.js';
import { IDEOLOGY_TO_AXIS, extractAxisScores, loadFactionIdeology } from './ideology.js';
import { adjustMomentum, adjustMomentumAll, adjustGovernmentApprovalEvent } from './momentum.js';
import { MINISTER_APPROVAL_CONFIG, buildMinistryBaselines } from './stats.js';
import { resolveBudgetBill } from './budget.js';
import { fetchActiveCoalition } from './government-structure.js';
import { resolveNoConfidence } from './elections.js';
import { PM_FIRST_NAMES, PM_LAST_NAMES } from './political-actions.js';
import { allocateSeatsByVotes } from './election-simulation.js';
import { repealActiveLaw } from './repeal-helper.js';

// ==================== BILL SUPPORT ====================

export function calculateBillSupport(billSupport, sponsorPartyId, allPartySeats) {
    const sponsorSeats = allPartySeats[sponsorPartyId] || 0;
    const acceptedSeats = (billSupport || [])
        .filter(s => s.stance === 'accept' && s.faction_id !== sponsorPartyId)
        .reduce((sum, s) => sum + (allPartySeats[s.faction_id] || s.seat_count || 0), 0);
    const totalSupport = sponsorSeats + acceptedSeats;
    const percent = Math.round((totalSupport / GAME_CONFIG.TOTAL_SEATS) * 100);
    return { sponsorSeats, acceptedSeats, totalSupport, percent };
}


// ==================== VOTE TALLY SYNC ====================

export async function syncVoteTallies(supabase, billId) {
    const { data: allVotes } = await supabase
        .from('bill_support')
        .select('stance, seat_count')
        .eq('bill_id', billId);

    let votesFor = 0, votesAgainst = 0, votesAbstain = 0;
    (allVotes || []).forEach(v => {
        const st = v.stance === 'accept' ? 'yes' : v.stance === 'reject' ? 'no' : 'abstain';
        if (st === 'yes')            votesFor += v.seat_count;
        else if (st === 'no')        votesAgainst += v.seat_count;
        else if (st === 'abstain')   votesAbstain += v.seat_count;
    });

    await supabase.from('bills').update({
        votes_for: votesFor,
        votes_against: votesAgainst,
        votes_abstain: votesAbstain
    }).eq('id', billId);

    return { votesFor, votesAgainst, votesAbstain };
}


// ==================== ENACTMENT APPROVAL IMPACT ====================

export function calculateEnactmentApproval(articles, billSupport, sponsorId, factionIdeologies) {
    const APPROVAL_CAP_POSITIVE = 4;
    const APPROVAL_CAP_NEGATIVE = -10;
    const OPPOSITION_KICKER = -2;

    // Collect all ideology tags from bill articles
    const allTags = [];
    for (const art of articles) {
        const p = art.policies || art;
        if (!p) continue;
        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);
        allTags.push(...ideos);
    }

    if (allTags.length === 0) return {};

    // Calculate net direction per axis from all article tags
    const axisNetScores = {};
    for (const tag of allTags) {
        const mapping = IDEOLOGY_TO_AXIS[tag];
        if (!mapping) continue;
        axisNetScores[mapping.axisKey] = (axisNetScores[mapping.axisKey] || 0) + mapping.direction;
    }

    if (Object.keys(axisNetScores).length === 0) return {};

    // Build voter map: factionId -> normalized stance
    const votes = {};
    votes[sponsorId] = 'yes';
    for (const s of (billSupport || [])) {
        if (s.faction_id !== sponsorId) {
            // Normalize: 'accept' → 'yes', 'reject' → 'no'
            const normalized = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            votes[s.faction_id] = normalized;
        }
    }

    const approvalDeltas = {};

    for (const [factionId, stance] of Object.entries(votes)) {
        if (stance !== 'yes' && stance !== 'no') continue;

        const factionAxes = factionIdeologies[factionId];
        if (!factionAxes) continue;

        // Sum net alignment: positive = bill aligns with faction, negative = opposes
        let netAlignment = 0;
        for (const [axisKey, netDirection] of Object.entries(axisNetScores)) {
            const factionScore = factionAxes[axisKey] || 0;
            // factionScore > 0 means faction leans "right" on this axis
            // netDirection > 0 means bill pushes "right" on this axis
            // Same sign = aligned
            if (factionScore !== 0 && netDirection !== 0) {
                netAlignment += Math.sign(factionScore) === Math.sign(netDirection)
                    ? Math.abs(netDirection)
                    : -Math.abs(netDirection);
            }
        }

        // YES vote: aligned bill = positive, opposed bill = negative
        // NO vote: inverted — opposed bill = positive, aligned bill = negative
        let delta = stance === 'yes' ? netAlignment : -netAlignment;

        // Apply opposition kicker: extra -1 when the result is negative
        if (delta < 0) {
            delta += OPPOSITION_KICKER;
        }

        // Cap the final value
        delta = Math.max(APPROVAL_CAP_NEGATIVE, Math.min(APPROVAL_CAP_POSITIVE, delta));
        approvalDeltas[factionId] = Math.round(delta * 10) / 10;
    }

    return approvalDeltas;
}

export async function applyEnactmentApproval(supabase, nationId, approvalDeltas) {
    for (const [factionId, delta] of Object.entries(approvalDeltas)) {
        if (delta === 0) continue;
        await adjustMomentumAll(supabase, nationId, factionId, delta, 'bill:enactment');
    }
}


// ==================== SPONSOR BLOC PREFERENCE ON BILL PASSAGE ====================

/**
 * When the sponsor's bill passes, adjust preference & momentum with voter blocs
 * based on ideological alignment between the bill's articles and each bloc.
 *
 * - Aligned blocs (lean same direction as bill on any axis, ±10 from center):
 *   +3 preference_score, +3 momentum
 * - Opposed blocs (lean opposite direction on any axis):
 *   -4 preference_score
 *
 * @param {object} supabase
 * @param {object} bill - Full bill row with bill_articles (with policies)
 * @param {string} nationId
 */
export async function applyBlocPreferenceOnPassage(supabase, bill, nationId) {
    const ALIGNED_PREF_BONUS = 6;
    const ALIGNED_MOMENTUM_BONUS = 6;
    const OPPOSED_PREF_PENALTY = -8;
    const AXIS_THRESHOLD = 10; // distance from center (50) to count as "having" an opinion

    const sponsorId = bill.proposed_by;
    if (!sponsorId) return;

    // 1. Extract ideology tags from bill articles and compute net direction per axis
    const axisDirections = {}; // { axisKey: net direction (+1 or -1) }
    for (const art of (bill.bill_articles || [])) {
        const p = art.policies || art;
        if (!p) continue;
        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);
        for (const tag of ideos) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (!mapping) continue;
            axisDirections[mapping.axisKey] = (axisDirections[mapping.axisKey] || 0) + mapping.direction;
        }
    }

    // Normalize to sign only
    for (const key of Object.keys(axisDirections)) {
        axisDirections[key] = Math.sign(axisDirections[key]);
    }

    const affectedAxes = Object.keys(axisDirections).filter(k => axisDirections[k] !== 0);
    if (affectedAxes.length === 0) return;

    // 2. Load voter blocs with axis scores
    const { data: voterBlocs } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (!voterBlocs || voterBlocs.length === 0) return;

    // 3. Classify each bloc as aligned, opposed, or neutral
    const alignedBlocIds = new Set();
    const opposedBlocIds = new Set();

    for (const bloc of voterBlocs) {
        let hasAligned = false;
        let hasOpposed = false;

        for (const axisKey of affectedAxes) {
            const blocScore = bloc['axis_' + axisKey] ?? 50;
            const deviation = blocScore - 50; // positive = leans right, negative = leans left
            if (Math.abs(deviation) < AXIS_THRESHOLD) continue; // neutral on this axis

            const blocDirection = Math.sign(deviation); // +1 = right, -1 = left
            const billDirection = axisDirections[axisKey];

            if (blocDirection === billDirection) {
                hasAligned = true;
            } else {
                hasOpposed = true;
            }
        }

        // Opposed takes priority — if a bloc opposes on any axis, they're opposed
        if (hasOpposed) {
            opposedBlocIds.add(bloc.id);
        } else if (hasAligned) {
            alignedBlocIds.add(bloc.id);
        }
    }

    // 4. Load sponsor's faction_bloc_approval rows for affected blocs
    const allAffectedBlocIds = [...alignedBlocIds, ...opposedBlocIds];
    if (allAffectedBlocIds.length === 0) return;

    const { data: approvalRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score, momentum')
        .eq('faction_id', sponsorId)
        .in('bloc_id', allAffectedBlocIds);

    // 5. Apply adjustments
    for (const row of (approvalRows || [])) {
        const oldPref = Math.round(row.preference_score ?? 50);
        const oldMom = Number(row.momentum ?? 0);

        if (alignedBlocIds.has(row.bloc_id)) {
            const newPref = Math.max(0, Math.min(100, oldPref + ALIGNED_PREF_BONUS));
            const newMom = Math.max(-50, Math.min(50, oldMom + ALIGNED_MOMENTUM_BONUS));
            await supabase.from('faction_bloc_approval')
                .update({ preference_score: newPref, momentum: newMom })
                .eq('id', row.id);
        } else if (opposedBlocIds.has(row.bloc_id)) {
            const newPref = Math.max(0, Math.min(100, oldPref + OPPOSED_PREF_PENALTY));
            await supabase.from('faction_bloc_approval')
                .update({ preference_score: newPref })
                .eq('id', row.id);
        }
    }

    // 6. Audit log for momentum changes on aligned blocs
    if (alignedBlocIds.size > 0) {
        const { data: shard } = await supabase
            .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        for (const blocId of alignedBlocIds) {
            try {
                await supabase.from('momentum_log').insert({
                    nation_id: nationId,
                    faction_id: sponsorId,
                    bloc_id: blocId,
                    amount: ALIGNED_MOMENTUM_BONUS,
                    source: 'bill:passage_aligned',
                    tick: shard?.current_tick || 0
                });
            } catch (_) { /* non-blocking audit log */ }
        }
    }

    const alignedNames = voterBlocs.filter(b => alignedBlocIds.has(b.id)).map(b => b.bloc_name);
    const opposedNames = voterBlocs.filter(b => opposedBlocIds.has(b.id)).map(b => b.bloc_name);
    console.log(`[BillPassage] Sponsor ${sponsorId}: +${ALIGNED_PREF_BONUS} pref/mom with aligned blocs [${alignedNames.join(', ')}], ${OPPOSED_PREF_PENALTY} pref with opposed blocs [${opposedNames.join(', ')}]`);
}


// ==================== NO-VOTE PENALTY ====================

/**
 * Penalize factions that did not cast any vote (YES/NO/ABSTAIN) on a bill.
 * - Momentum: lose [1d3+1] (2-4) across all blocs
 * - Preference: -2 preference_score with every voter bloc whose ideology axis score
 *   is at least ±10 from center (≤40 or ≥60) on any axis present in the bill.
 *
 * @param {object} supabase
 * @param {object} bill - Full bill row with bill_articles (with policies) and bill_support
 * @param {string} nationId
 */
export async function applyNoVotePenalty(supabase, bill, nationId) {
    const PREFERENCE_PENALTY = -2;
    const AXIS_THRESHOLD = 10; // distance from center (50) to count as "having" an ideology

    // 1. Get all party factions in this nation
    const { data: allFactions } = await supabase
        .from('factions')
        .select('id, faction_name')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (!allFactions || allFactions.length === 0) return [];

    // 2. Determine which factions voted (have a bill_support row)
    const votedFactionIds = new Set();
    // Sponsor always counts as having voted (they implicitly support their own bill)
    if (bill.proposed_by) votedFactionIds.add(bill.proposed_by);
    for (const s of (bill.bill_support || [])) {
        if (s.faction_id) votedFactionIds.add(s.faction_id);
    }

    // 3. Find non-voters
    const nonVoters = allFactions.filter(f => !votedFactionIds.has(f.id));
    if (nonVoters.length === 0) return [];

    // 4. Extract ideology tags from bill articles
    const allTags = [];
    for (const art of (bill.bill_articles || [])) {
        const p = art.policies || art;
        if (!p) continue;
        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);
        allTags.push(...ideos);
    }

    // Map tags to unique axis keys
    const affectedAxes = new Set();
    for (const tag of allTags) {
        const mapping = IDEOLOGY_TO_AXIS[tag];
        if (mapping) affectedAxes.add(mapping.axisKey);
    }

    // 5. Load voter blocs for this nation (need axis scores to filter)
    const { data: voterBlocs } = await supabase
        .from('voter_blocs')
        .select('id, bloc_name, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism')
        .eq('nation_id', nationId)
        .eq('is_active', true);

    // 6. Determine which blocs are affected (lean ±10 from center on any affected axis)
    const affectedBlocIds = new Set();
    for (const bloc of (voterBlocs || [])) {
        for (const axisKey of affectedAxes) {
            const score = bloc['axis_' + axisKey] ?? 50;
            if (Math.abs(score - 50) >= AXIS_THRESHOLD) {
                affectedBlocIds.add(bloc.id);
                break; // one matching axis is enough
            }
        }
    }

    // 7. Apply penalties to each non-voter
    const penalized = [];
    for (const faction of nonVoters) {
        // Momentum: lose 1d3+1 (2-4) across ALL blocs
        const momentumLoss = -(Math.floor(Math.random() * 3) + 2);
        await adjustMomentumAll(supabase, nationId, faction.id, momentumLoss, 'penalty:no_vote');

        // Preference: -2 preference_score on matched blocs only
        if (affectedBlocIds.size > 0) {
            const { data: blocRows } = await supabase
                .from('faction_bloc_approval')
                .select('id, bloc_id, preference_score')
                .eq('faction_id', faction.id)
                .in('bloc_id', [...affectedBlocIds]);

            for (const row of (blocRows || [])) {
                const newPref = Math.round(Math.max(0, Math.min(100, (row.preference_score ?? 50) + PREFERENCE_PENALTY)));
                await supabase.from('faction_bloc_approval')
                    .update({ preference_score: newPref })
                    .eq('id', row.id);
            }
        }

        penalized.push({
            factionId: faction.id,
            factionName: faction.faction_name,
            momentumLoss,
            preferencePenalty: affectedBlocIds.size > 0 ? PREFERENCE_PENALTY : 0,
            affectedBlocCount: affectedBlocIds.size
        });
    }

    return penalized;
}


// ==================== STATIC IDEOLOGY PENALTY (LEGACY) ====================

export function calculateIdeologyPenalty(stage, opposedCount, polarization) {
    if (opposedCount === 0) return 0;

    const pol = polarization || 0;
    let penalty = 0;

    if (stage === 'floor') {
        if (pol >= 50) {
            penalty = -1 * opposedCount;
        } else {
            penalty = -1 * Math.floor(opposedCount / 2);
        }
    } else if (stage === 'passed') {
        penalty = -1 * opposedCount;
        if (pol >= 75) {
            penalty += -2 * opposedCount;
        }
    }

    return penalty;
}


// ==================== BLOC APPROVAL HELPERS ====================

/**
 * Recalculate derived overall approval_rating for a faction from
 * faction_bloc_approval preference_scores weighted by voter_blocs population_weight.
 * Updates the factions.approval_rating cache column.
 */
export async function recalcDerivedApproval(supabase, factionId, blocRows) {
    if (!blocRows) {
        const { data } = await supabase
            .from('faction_bloc_approval')
            .select('bloc_id, preference_score')
            .eq('faction_id', factionId);
        blocRows = data || [];
    }
    if (blocRows.length === 0) return null;

    const blocIds = blocRows.map(r => r.bloc_id);
    const { data: blocs } = await supabase
        .from('voter_blocs')
        .select('id, population_weight')
        .in('id', blocIds);
    if (!blocs || blocs.length === 0) return null;

    const weightMap = {};
    for (const b of blocs) weightMap[b.id] = parseFloat(b.population_weight) || 0;

    let weightedSum = 0;
    for (const row of blocRows) {
        const score = row.preference_score ?? 50;
        weightedSum += score * (weightMap[row.bloc_id] || 0);
    }
    const derived = Math.round(weightedSum / 100);

    await supabase.from('factions')
        .update({ approval_rating: derived })
        .eq('id', factionId);

    return derived;
}

/**
 * Ensures faction_bloc_approval rows exist for a given faction.
 * If none exist, seeds them with default preference_score of 40 for all active blocs.
 * Returns the (possibly newly created) bloc approval rows, or null on failure.
 */
export async function ensureBlocApprovals(supabase, factionId, nationId) {
    const { data: existing, error: checkErr } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score')
        .eq('faction_id', factionId);

    if (checkErr) {
        console.error('[ensureBlocApprovals] Check failed:', checkErr.message);
        return null;
    }

    if (existing && existing.length > 0) {
        return existing;
    }

    const { data: blocs, error: blocErr } = await supabase
        .from('voter_blocs')
        .select('id')
        .eq('nation_id', nationId)
        .eq('is_active', true);

    if (blocErr || !blocs || blocs.length === 0) {
        console.warn('[ensureBlocApprovals] No active voter blocs found for nation', nationId);
        return null;
    }

    const rows = blocs.map(bloc => ({
        faction_id: factionId,
        bloc_id: bloc.id,
        preference_score: 40
    }));

    const { error: upsertErr } = await supabase
        .from('faction_bloc_approval')
        .upsert(rows, { onConflict: 'faction_id,bloc_id', ignoreDuplicates: true });

    if (upsertErr) {
        console.error('[ensureBlocApprovals] Upsert failed:', upsertErr.message);
        return null;
    }

    const { data: newRows } = await supabase
        .from('faction_bloc_approval')
        .select('id, bloc_id, preference_score')
        .eq('faction_id', factionId);

    console.log(`[ensureBlocApprovals] Seeded ${rows.length} bloc approval rows for faction ${factionId}`);
    return newRows;
}


// ==================== IDEOLOGY SHIFT PROCESSOR ====================

export async function processIdeologyShifts(supabase, nationId, resolutions, currentTick) {
    if (!resolutions || resolutions.length === 0) return;

    // Only process bills with terminal resolutions — skip deferred bills
    // to avoid double-counting when they resolve on a subsequent tick.
    const terminalResolutions = resolutions.filter(r => r.result !== 'deferred');
    if (terminalResolutions.length === 0) return;

    const billIds = terminalResolutions.map(r => r.billId);

    const { data: bills } = await supabase
        .from('bills')
        .select('id, proposed_by, bill_type, bill_articles(*, policies(*)), bill_support(faction_id, stance)')
        .in('id', billIds);

    if (!bills || bills.length === 0) return;

    // Only legislative bills affect ideology
    const legislativeBills = bills.filter(b =>
        !['no_confidence', 'confirmation', 'minister_confirmation', 'foundational', 'veto_override', 'budget'].includes(b.bill_type)
    );
    if (legislativeBills.length === 0) return;

    // Include 'president_desk' as passed — these bills passed the floor vote
    // and are awaiting presidential action; the passage bonus should apply now
    // since processIdeologyShifts won't run again when the president signs.
    const passedBillIds = new Set(terminalResolutions.filter(r => r.result === 'passed' || r.result === 'president_desk').map(r => r.billId));

    // Accumulate shifts: { factionId: { axisKey: totalShift } }
    const factionShifts = {};

    function addShift(factionId, axisKey, amount) {
        if (!factionShifts[factionId]) factionShifts[factionId] = {};
        factionShifts[factionId][axisKey] = (factionShifts[factionId][axisKey] || 0) + amount;
    }

    for (const bill of legislativeBills) {
        // Collect ideology tags from articles (per-article, with duplicates)
        const tags = [];
        for (const art of (bill.bill_articles || [])) {
            const p = art.policies || art;
            if (!p) continue;
            const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
                ? p.ideologies.map(i => i.toUpperCase())
                : (p.ideology ? [p.ideology.toUpperCase()] : []);
            tags.push(...ideos);
        }
        if (tags.length === 0) continue;

        const isPassed = passedBillIds.has(bill.id);

        // Build YES voter set (normalize committee stances)
        const yesVoters = new Set();
        for (const s of (bill.bill_support || [])) {
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') yesVoters.add(s.faction_id);
        }
        // Sponsor always counts as YES
        if (bill.proposed_by) yesVoters.add(bill.proposed_by);

        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (!mapping) continue;

            // +2 for proposing (sponsor only)
            if (bill.proposed_by) {
                addShift(bill.proposed_by, mapping.axisKey, 2 * mapping.direction);
            }

            // +4 for voting YES (all YES voters including sponsor)
            for (const factionId of yesVoters) {
                addShift(factionId, mapping.axisKey, 4 * mapping.direction);
            }

            // +4 if bill passed (YES voters only)
            if (isPassed) {
                for (const factionId of yesVoters) {
                    addShift(factionId, mapping.axisKey, 4 * mapping.direction);
                }
            }
        }
    }

    // Apply accumulated shifts to faction_ideology
    const historyRows = [];

    for (const [factionId, axisShifts] of Object.entries(factionShifts)) {
        let ideologyRow = await loadFactionIdeology(supabase, factionId);
        if (!ideologyRow) {
            const newRow = { faction_id: factionId, liberty_equality: 0, tradition_progress: 0, security_freedom: 0, globalism_nationalism: 0, individualism_collectivism: 0 };
            await supabase.from('faction_ideology').upsert(newRow, { onConflict: 'faction_id' });
            ideologyRow = newRow;
            console.warn(`Created missing faction_ideology row for faction ${factionId}`);
        }

        const currentScores = extractAxisScores(ideologyRow);
        const updateObj = {};
        let hasChanges = false;

        for (const [axisKey, shift] of Object.entries(axisShifts)) {
            const oldScore = currentScores[axisKey] || 0;
            const newScore = Math.max(-100, Math.min(100, oldScore + shift));
            if (newScore !== oldScore) {
                updateObj[axisKey] = newScore;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            await supabase.from('faction_ideology').update(updateObj).eq('faction_id', factionId);

            // Record snapshot for ideology_history
            if (typeof currentTick === 'number') {
                const finalScores = { ...currentScores, ...updateObj };
                historyRows.push({
                    faction_id: factionId,
                    nation_id: nationId,
                    tick: currentTick,
                    liberty_equality: finalScores.liberty_equality || 0,
                    tradition_progress: finalScores.tradition_progress || 0,
                    security_freedom: finalScores.security_freedom || 0,
                    globalism_nationalism: finalScores.globalism_nationalism || 0,
                    individualism_collectivism: finalScores.individualism_collectivism || 0
                });
            }
        }
    }

    // Batch insert ideology history snapshots
    if (historyRows.length > 0) {
        const { error: histErr } = await supabase
            .from('ideology_history')
            .insert(historyRows);
        if (histErr) {
            console.warn('[processIdeologyShifts] ideology_history insert failed (table may not exist yet):', histErr.message);
        }
    }
}


// ==================== BILL RESOLUTION ENGINE ====================

/**
 * Returns true if this bill type uses quorum + simple majority (YES > NO of
 * votes cast) rather than an absolute seat threshold.
 *
 * Absolute-threshold types (return false):
 *   - foundational / veto_override: 67% of total seats
 *   - no_confidence / impeachment_motion: 50%+1 of total seats
 *   - impeachment_conviction: 67% of total seats
 */
export function isSimpleMajorityBill(billType) {
    return billType !== 'foundational'
        && billType !== 'default_resolution'
        && billType !== 'veto_override'
        && billType !== 'no_confidence'
        && billType !== 'impeachment_motion'
        && billType !== 'impeachment_conviction';
}

/**
 * Get the number of YES seats required for a bill to pass.
 *
 * For supermajority bills (foundational, veto_override) the threshold is a
 * fixed fraction of TOTAL_SEATS.
 *
 * For all other bills the rule is simple majority: YES > NO.  When
 * `votesAgainst` is provided, we return `votesAgainst + 1` so the display
 * updates dynamically as votes come in.  Without it we fall back to the
 * absolute half-chamber number for backward compat.
 */
export function getRequiredSeats(billType, votesAgainst) {
    if (billType === 'foundational' || billType === 'default_resolution' || billType === 'impeachment_conviction')
        return Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.SUPERMAJORITY_THRESHOLD);
    if (billType === 'veto_override')
        return Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD);
    if (billType === 'no_confidence' || billType === 'impeachment_motion')
        return Math.floor(GAME_CONFIG.TOTAL_SEATS / 2) + 1;
    // Ordinary bills: simple majority of votes cast
    if (votesAgainst != null) return votesAgainst + 1;
    return GAME_CONFIG.MAJORITY_SEATS;
}

/**
 * Evaluate the current state of a bill vote using the two-step quorum + majority system.
 *
 * Returns an object describing the vote status:
 *   { status, reason, quorumMet, quorumNeeded, quorumCurrent, thresholdNeeded, ... }
 *
 * Status values:
 *   'will_pass'      — mathematically locked in, cannot change
 *   'will_fail'      — mathematically impossible to pass
 *   'passing'        — quorum met, yes currently leads, but not locked
 *   'failing'        — quorum met, no currently leads, but not locked
 *   'tied'           — quorum met, yes === no
 *   'quorum_not_met' — not enough participation yet
 *   'pending'        — for absolute-threshold bills, in progress
 *
 * @param {object} bill - Bill with votes_for, votes_against, votes_abstain, bill_type
 * @param {number} totalSeats - Total parliamentary seats (from nation)
 */
export function evaluateBillVote(bill, totalSeats) {
    const forSeats = bill.votes_for || 0;
    const againstSeats = bill.votes_against || 0;
    const abstainSeats = bill.votes_abstain || 0;
    const participating = forSeats + againstSeats + abstainSeats;
    const undeclaredSeats = totalSeats - participating;
    const quorumThreshold = Math.ceil(totalSeats * GAME_CONFIG.QUORUM_THRESHOLD);

    // ── Foundational / default_resolution / veto_override / impeachment_conviction: 67% absolute supermajority, no quorum ──
    if (bill.bill_type === 'foundational' || bill.bill_type === 'default_resolution' || bill.bill_type === 'veto_override' || bill.bill_type === 'impeachment_conviction') {
        const threshold = Math.ceil(totalSeats * 2 / 3);
        if (forSeats >= threshold) {
            return { status: 'will_pass', reason: 'supermajority_reached', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        if (forSeats + undeclaredSeats < threshold) {
            return { status: 'will_fail', reason: 'supermajority_impossible', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        return { status: 'pending', reason: 'supermajority_in_progress', thresholdNeeded: threshold, neededFor: threshold - forSeats, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }

    // ── Impeachment motion / confidence: 50%+1 absolute majority, no quorum ──
    if (bill.bill_type === 'impeachment_motion' || bill.bill_type === 'no_confidence') {
        const threshold = Math.floor(totalSeats / 2) + 1;
        if (forSeats >= threshold) {
            return { status: 'will_pass', reason: 'absolute_majority_reached', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        if (forSeats + undeclaredSeats < threshold) {
            return { status: 'will_fail', reason: 'absolute_majority_impossible', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        return { status: 'pending', reason: 'absolute_majority_in_progress', thresholdNeeded: threshold, neededFor: threshold - forSeats, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }

    // ── Ordinary bills: quorum (50% participation) + simple majority of votes cast ──
    const quorumMet = participating >= quorumThreshold;

    if (!quorumMet) {
        // Check if quorum is even possible
        if (participating + undeclaredSeats < quorumThreshold) {
            return { status: 'will_fail', reason: 'quorum_impossible', quorumMet: false, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        return { status: 'quorum_not_met', reason: 'awaiting_quorum', quorumMet: false, quorumThreshold, quorumCurrent: participating, quorumNeeded: quorumThreshold - participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }

    // Quorum met — check simple majority of votes cast (yes vs no, abstain excluded)
    // "Will Pass": yes > no AND yes > no + all_undeclared (locked)
    if (forSeats > againstSeats + undeclaredSeats) {
        return { status: 'will_pass', reason: 'majority_locked', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }
    // "Will Fail": against >= for + all_undeclared (locked) — even all undeclared voting yes can't flip it
    if (againstSeats >= forSeats + undeclaredSeats) {
        return { status: 'will_fail', reason: 'defeat_locked', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }
    // Not locked — show current leader
    if (forSeats > againstSeats) {
        return { status: 'passing', reason: 'majority_current', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }
    if (againstSeats > forSeats) {
        return { status: 'failing', reason: 'minority_current', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }
    // Exact tie: bill will fail unless more yes votes are cast
    return { status: 'tied', reason: 'tied_votes', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
}

/**
 * Resolve a bill vote at deadline (or early resolution).
 * Returns: 'passed', 'failed', 'failed_no_quorum', or 'deferred'.
 *
 * @param {object} bill - Bill row with votes_for, votes_against, votes_abstain, bill_type, quorum_failures
 * @param {number} totalSeats - Total parliamentary seats
 */
export function resolveBillVote(bill, totalSeats) {
    const forSeats = bill.votes_for || 0;
    const againstSeats = bill.votes_against || 0;
    const abstainSeats = bill.votes_abstain || 0;
    const participating = forSeats + againstSeats + abstainSeats;
    const quorumThreshold = Math.ceil(totalSeats * GAME_CONFIG.QUORUM_THRESHOLD);

    // Foundational / default_resolution / veto_override / impeachment_conviction: 67% absolute supermajority
    if (bill.bill_type === 'foundational' || bill.bill_type === 'default_resolution' || bill.bill_type === 'veto_override' || bill.bill_type === 'impeachment_conviction') {
        const threshold = Math.ceil(totalSeats * 2 / 3);
        return forSeats >= threshold ? 'passed' : 'failed';
    }

    // No-confidence / impeachment_motion: 50%+1 absolute majority
    if (bill.bill_type === 'no_confidence' || bill.bill_type === 'impeachment_motion') {
        const threshold = Math.floor(totalSeats / 2) + 1;
        return forSeats >= threshold ? 'passed' : 'failed';
    }

    // Ordinary bills: quorum + simple majority
    if (participating < quorumThreshold) {
        if ((bill.quorum_failures || 0) >= 1) {
            return 'failed_no_quorum'; // second failure, bill dies
        }
        return 'deferred'; // first failure, extend by 1 tick
    }

    // All abstain edge case: 0 yes, 0 no → bill fails (need affirmative support)
    if (forSeats === 0 && againstSeats === 0) return 'failed';

    // Ties fail — status quo wins
    return forSeats > againstSeats ? 'passed' : 'failed';
}

/**
 * Auto-expire committee bills that have been sitting for COMMITTEE_EXPIRY_TICKS
 * without being sent to the floor. Sets status to 'failed'.
 */
export async function expireCommitteeBills(supabase, nationId, currentTick) {
    const deadline = currentTick - GAME_CONFIG.COMMITTEE_EXPIRY_TICKS;
    const { data: expired, error } = await supabase
        .from('bills')
        .select('id, bill_name, proposed_by')
        .eq('nation_id', nationId)
        .eq('status', 'committee')
        .neq('bill_type', 'budget')  // budget bills persist until passed
        .neq('bill_type', 'default_resolution')  // default resolutions skip committee
        .lte('proposed_tick', deadline);

    if (error || !expired || expired.length === 0) return [];

    const results = [];
    for (const bill of expired) {
        await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id);
        const { data: nation } = await supabase.from('nations').select('name').eq('id', nationId).single();
        await supabase.rpc('insert_news_event', {
            p_nation_id: nationId,
            p_trigger_key: 'bill_failed',
            p_tick: currentTick,
            p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, reason: 'expired in committee' }
        });
        console.log(`[expireCommitteeBills] ${bill.bill_name} expired in committee after ${GAME_CONFIG.COMMITTEE_EXPIRY_TICKS} ticks`);
        results.push({ billId: bill.id, billName: bill.bill_name, result: 'expired_committee' });
    }
    return results;
}

/**
 * Check all active floor bills for early majority (for or against).
 * If a definitive majority is detected, lock the outcome and shorten
 * voting_ends_tick to currentTick so the bill resolves immediately
 * in the same tick via resolveExpiredVotes.
 *
 * Must run BEFORE resolveExpiredVotes each tick.
 */
export async function checkEarlyMajority(supabase, nationId) {
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    // Bills still voting, not yet locked, not yet expired
    // Include budget bills with null voting_ends_tick (they persist until passed)
    const { data: activeBills, error } = await supabase
        .from('bills')
        .select('id, bill_name, bill_type, voting_ends_tick, bill_support(faction_id, stance, seat_count)')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .is('early_resolution_status', null)
        .or(`voting_ends_tick.gt.${currentTick},voting_ends_tick.is.null`);

    if (error || !activeBills || activeBills.length === 0) return [];

    const quorumSeats = Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.QUORUM_THRESHOLD);
    const results = [];

    // Check for emergency minority government penalty (once per nation per tick)
    const earlyCoalition = await fetchActiveCoalition(supabase, nationId);
    const minorityPenalty = earlyCoalition?.formation_type === 'emergency_minority';

    for (const bill of activeBills) {
        let yesSeats = 0, noSeats = 0, abstainSeats = 0;
        (bill.bill_support || []).forEach(s => {
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') yesSeats += s.seat_count;
            else if (stance === 'no') noSeats += s.seat_count;
            else if (stance === 'abstain') abstainSeats += s.seat_count;
        });

        // Apply emergency minority penalty to effective YES votes
        let effectiveYes = yesSeats;
        if (minorityPenalty) {
            effectiveYes = Math.floor(yesSeats * 0.8);
        }

        let earlyStatus = null;
        const participating = yesSeats + noSeats + abstainSeats;
        const undeclaredSeats = GAME_CONFIG.TOTAL_SEATS - participating;

        // ── Check 1: Mathematical lock (outcome impossible to change) ──
        if (bill.bill_type === 'foundational' || bill.bill_type === 'default_resolution' || bill.bill_type === 'veto_override' || bill.bill_type === 'impeachment_conviction') {
            // Absolute supermajority: 67% of total seats, no quorum
            const requiredSeats = getRequiredSeats(bill.bill_type);
            if (effectiveYes >= requiredSeats) {
                earlyStatus = 'majority_reached';
            } else if (effectiveYes + undeclaredSeats < requiredSeats) {
                earlyStatus = 'majority_opposed';
            }
        } else if (bill.bill_type === 'no_confidence' || bill.bill_type === 'impeachment_motion') {
            // Absolute majority: 50%+1 of total seats, no quorum
            const threshold = Math.floor(GAME_CONFIG.TOTAL_SEATS / 2) + 1;
            if (effectiveYes >= threshold) {
                earlyStatus = 'majority_reached';
            } else if (effectiveYes + undeclaredSeats < threshold) {
                earlyStatus = 'majority_opposed';
            }
        } else {
            // Ordinary bill: quorum (50% participation) + simple majority of votes cast
            // Math-lock: YES wins even if all undeclared vote NO
            if (effectiveYes > noSeats + undeclaredSeats) {
                earlyStatus = 'majority_reached';
            // Math-lock: NO wins/ties even if all undeclared vote YES
            } else if (minorityPenalty
                ? noSeats >= Math.floor((yesSeats + undeclaredSeats) * 0.8)
                : noSeats >= yesSeats + undeclaredSeats) {
                earlyStatus = 'majority_opposed';
            }
        }

        // ── Check 2: Quorum-based early resolution (ordinary bills only) ──
        // If not math-locked but quorum is met and a clear majority exists,
        // trigger early resolution with a 1-tick grace period.
        if (!earlyStatus && participating >= quorumSeats) {
            if (bill.bill_type !== 'foundational' && bill.bill_type !== 'veto_override'
                && bill.bill_type !== 'no_confidence' && bill.bill_type !== 'impeachment_motion'
                && bill.bill_type !== 'impeachment_conviction') {
                // Ordinary bill: simple majority of votes cast
                if (effectiveYes > noSeats) {
                    earlyStatus = 'quorum_reached';
                } else if (noSeats > effectiveYes) {
                    earlyStatus = 'quorum_opposed';
                }
                // Exact tie at quorum: wait for more votes or deadline
            }
        }

        // ── Check 3: Budget bill forced resolution after MAX_FLOOR_TICKS ──
        // Budget bills have no voting deadline (voting_ends_tick = null).
        // If a budget bill has been on the floor for BUDGET_BILL_MAX_FLOOR_TICKS
        // ticks without resolution, force a vote based on the current tally.
        // This prevents budget bills from getting stuck indefinitely when
        // bill_support seat_counts are stale and don't trigger a math-lock.
        if (!earlyStatus && bill.bill_type === 'budget' && bill.voting_ends_tick == null) {
            const ticksSinceProposed = currentTick - (bill.proposed_tick || 0);
            if (ticksSinceProposed >= GAME_CONFIG.BUDGET_BILL_MAX_FLOOR_TICKS) {
                if (participating >= quorumSeats && effectiveYes > noSeats) {
                    earlyStatus = 'quorum_reached';
                } else {
                    earlyStatus = 'quorum_opposed';
                }
                console.log(`[checkEarlyMajority] Budget bill ${bill.bill_name}: FORCED resolution after ${ticksSinceProposed} ticks (YES=${yesSeats}, NO=${noSeats}, participating=${participating}, quorum=${quorumSeats})`);
            }
        }

        if (earlyStatus) {
            // Resolve immediately this tick (no grace period)
            // Budget bills have null voting_ends_tick, so just use currentTick
            const resolveAtTick = bill.voting_ends_tick != null
                ? Math.min(currentTick, bill.voting_ends_tick)
                : currentTick;

            await supabase.from('bills').update({
                early_resolution_status: earlyStatus,
                early_resolution_tick: currentTick,
                voting_ends_tick: resolveAtTick
            }).eq('id', bill.id);

            const resolveType = earlyStatus.startsWith('quorum') ? 'QUORUM' : 'MATH-LOCK';
            console.log(`[checkEarlyMajority] ${bill.bill_name}: ${earlyStatus} [${resolveType}] (YES=${yesSeats}, NO=${noSeats}, quorum=${quorumSeats}, voted=${participating}). Resolves tick ${resolveAtTick}`);
            results.push({ billId: bill.id, billName: bill.bill_name, status: earlyStatus, yesSeats, noSeats });
        }
    }

    return results;
}

export async function resolveExpiredVotes(supabase, nationId) {
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    const { data: expiredBills, error } = await supabase
        .from('bills')
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .lte('voting_ends_tick', currentTick);

    if (error || !expiredBills || expiredBills.length === 0) return [];

    const results = [];

    for (const bill of expiredBills) {
        const { data: nation } = await supabase
            .from('nations')
            .select('name, government_type, total_seats')
            .eq('id', bill.nation_id)
            .single();
        const totalSeats = nation?.total_seats || GAME_CONFIG.TOTAL_SEATS;
        let votesFor = 0, votesAgainst = 0, votesAbstain = 0;

        (bill.bill_support || []).forEach(s => {
            // Normalize committee stances: 'accept' → 'yes', 'reject' → 'no'
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') votesFor += s.seat_count;
            else if (stance === 'no') votesAgainst += s.seat_count;
            else if (stance === 'abstain') votesAbstain += s.seat_count;
        });

        // Emergency minority government penalty: -20% effective YES votes
        const activeCoalition = await fetchActiveCoalition(supabase, bill.nation_id);
        let effectiveVotesFor = votesFor;
        if (activeCoalition?.formation_type === 'emergency_minority') {
            effectiveVotesFor = Math.floor(votesFor * 0.8);
            console.log(`[MinorityPenalty] ${bill.bill_name}: votesFor ${votesFor} → ${effectiveVotesFor} (emergency minority -20%)`);
        }

        // Determine pass/fail using new quorum + majority system
        // Build a bill-like object with effective votes for the resolve function
        const resolveBill = {
            ...bill,
            votes_for: effectiveVotesFor,
            votes_against: votesAgainst,
            votes_abstain: votesAbstain,
            quorum_failures: bill.quorum_failures || 0
        };
        const resolution = resolveBillVote(resolveBill, totalSeats);

        // Handle quorum deferral: extend vote by 1 tick
        if (resolution === 'deferred') {
            const newDeadline = currentTick + 1;
            await supabase.from('bills').update({
                quorum_failures: (bill.quorum_failures || 0) + 1,
                voting_ends_tick: newDeadline
            }).eq('id', bill.id);

            // Notify all party leaders about quorum failure
            const quorumThreshold = Math.ceil(totalSeats * GAME_CONFIG.QUORUM_THRESHOLD);
            const participating = votesFor + votesAgainst + votesAbstain;
            try {
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'quorum_failed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        bill_name: bill.bill_name,
                        participating: String(participating),
                        quorum_needed: String(quorumThreshold),
                        nation: nation?.name || 'Unknown'
                    }
                });
            } catch (e) { /* non-blocking if event key doesn't exist yet */ }

            console.log(`[resolveExpiredVotes] ${bill.bill_name}: quorum not met (${participating}/${quorumThreshold}), deferred to tick ${newDeadline}`);
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'deferred', votesFor, votesAgainst, votesAbstain, type: bill.bill_type });
            continue;
        }

        // Handle second quorum failure: bill dies
        if (resolution === 'failed_no_quorum') {
            await failBill(supabase, bill);
            const quorumThreshold = Math.ceil(totalSeats * GAME_CONFIG.QUORUM_THRESHOLD);
            const participating = votesFor + votesAgainst + votesAbstain;
            try {
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'bill_failed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name,
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst),
                        reason: `quorum not met after two attempts (${participating}/${quorumThreshold} participating)`
                    }
                });
            } catch (e) { /* non-blocking */ }
            console.log(`[resolveExpiredVotes] ${bill.bill_name}: quorum failed twice (${participating}/${quorumThreshold}), bill dies`);
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_no_quorum', votesFor, votesAgainst, votesAbstain, type: bill.bill_type });
            continue;
        }

        const passed = resolution === 'passed';
        const isNoConfidence = bill.bill_type === 'no_confidence';
        const isFoundational = bill.bill_type === 'foundational';

        if (isNoConfidence) {
            // Handle no-confidence resolution (pass or fail)
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
            } else {
                await failBill(supabase, bill);
            }
            await resolveNoConfidence(supabase, bill, passed, votesFor, votesAgainst, currentTick);
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'no_confidence', earlyResolution: bill.early_resolution_status || null });
        } else if (isFoundational) {
            // Handle foundational bill resolution (electoral makeup, etc.)
            let enacted = false;
            if (passed) {
                enacted = await enactFoundationalBill(supabase, bill, currentTick);
            }
            if (!passed || !enacted) {
                if (!enacted && passed) {
                    // enactFoundationalBill already marked it 'failed' internally
                    console.warn(`[resolveExpiredVotes] Foundational bill ${bill.id} had enough votes but enactment failed (invalid proposed_seats).`);
                } else {
                    await failBill(supabase, bill);
                }
            }
            const eventKey = enacted ? 'bill_passed' : 'bill_failed';
            await supabase.rpc('fire_system_event', {
                p_trigger_key: eventKey,
                p_nation_id: bill.nation_id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation?.name || 'Unknown',
                    bill_name: bill.bill_name,
                    sponsor: bill.factions?.faction_name || 'Unknown',
                    votes_for: String(votesFor),
                    votes_against: String(votesAgainst),
                    article_count: '0'
                }
            });
            results.push({ billId: bill.id, billName: bill.bill_name, result: enacted ? 'passed' : 'failed', votesFor, votesAgainst, type: 'foundational', earlyResolution: bill.early_resolution_status || null });
        } else if (bill.bill_type === 'default_resolution') {
            // ── Sovereign Default Resolution ──
            // Full enactment logic lives in handler-template.ts (enactSovereignDefault /
            // handleFailedDefaultResolution) because it needs cross-nation contagion
            // and tick-only helpers. The typeof guard ensures client-side callers
            // (admin.html, laws.html) don't crash — the server tick handles consequences.
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                if (typeof enactSovereignDefault === 'function') {
                    try {
                        await enactSovereignDefault(supabase, bill, currentTick);
                    } catch (defaultErr) {
                        console.error(`[resolveExpiredVotes] enactSovereignDefault failed for bill ${bill.id}:`, defaultErr);
                    }
                }
            } else {
                await failBill(supabase, bill);
                if (typeof handleFailedDefaultResolution === 'function') {
                    try {
                        await handleFailedDefaultResolution(supabase, bill, currentTick);
                    } catch (failErr) {
                        console.error(`[resolveExpiredVotes] handleFailedDefaultResolution failed for bill ${bill.id}:`, failErr);
                    }
                }
            }
            const eventKey = passed ? 'bill_passed' : 'bill_failed';
            try {
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: eventKey,
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name,
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst),
                        article_count: '0'
                    }
                });
            } catch (e) { /* non-blocking */ }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'default_resolution', earlyResolution: bill.early_resolution_status || null });
        } else if (bill.bill_type === 'confirmation' && bill.ambassador_id) {
            // Ambassador confirmation bill
            // Check if nominee voted NO — auto-fail (withdrawal of nomination)
            const { data: ambRow } = await supabase.from('ambassadors').select('faction_id').eq('id', bill.ambassador_id).maybeSingle();
            const ambNomineeId = ambRow?.faction_id;
            const nomineeVotedNo = ambNomineeId && (bill.bill_support || []).some(s => {
                const st = s.stance === 'reject' ? 'no' : s.stance;
                return s.faction_id === ambNomineeId && st === 'no';
            });
            if (nomineeVotedNo) passed = false;

            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Activate the ambassador — term starts now
                await supabase.from('ambassadors').update({
                    status: 'active',
                    is_active: true,
                    appointed_at_tick: currentTick
                }).eq('id', bill.ambassador_id);
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'bill_passed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name,
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst),
                        article_count: '0'
                    }
                });
            } else {
                await failBill(supabase, bill);
                // Reject the ambassador
                await supabase.from('ambassadors').update({
                    status: 'rejected',
                    is_active: false
                }).eq('id', bill.ambassador_id);
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'bill_failed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name,
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst)
                    }
                });
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'confirmation', earlyResolution: bill.early_resolution_status || null });
        } else if (bill.bill_type === 'minister_confirmation' && bill.ministry_key) {
            // Minister confirmation bill (Presidential systems)
            const mKey = bill.ministry_key;
            const { data: ministry } = await supabase.from('ministries')
                .select('id, pending_minister, rejected_parties')
                .eq('nation_id', bill.nation_id).eq('ministry_key', mKey).eq('is_active', true)
                .maybeSingle();

            // Check if nominee voted NO — auto-fail (withdrawal of nomination)
            const minNomineeId = ministry?.pending_minister?.party_id;
            const minNomineeVotedNo = minNomineeId && (bill.bill_support || []).some(s => {
                const st = s.stance === 'reject' ? 'no' : s.stance;
                return s.faction_id === minNomineeId && st === 'no';
            });
            if (minNomineeVotedNo) passed = false;

            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                if (!ministry) {
                    // Ministry row doesn't exist — create it so the confirmation can proceed
                    console.warn(`Minister confirmation passed but ministry row missing for ${mKey} in nation ${bill.nation_id}. Creating it.`);
                    const { data: createdMinistry } = await supabase.from('ministries').insert({
                        nation_id: bill.nation_id,
                        ministry_key: mKey,
                        ministry_name: mKey,
                        is_active: true,
                        confirmation_status: 'pending',
                        pending_minister: null,
                        rejected_parties: []
                    }).select('id, pending_minister, rejected_parties').single();
                    // Use the bill's metadata as fallback for pending_minister
                    if (createdMinistry && bill.metadata?.pending_minister) {
                        await supabase.from('ministries').update({
                            pending_minister: bill.metadata.pending_minister
                        }).eq('id', createdMinistry.id);
                    }
                }

                if (ministry?.pending_minister) {
                    const pm = ministry.pending_minister;
                    const ministryNames = {
                        prime_minister: 'Prime Minister', interior: 'Ministry of the Interior',
                        foreign: 'Foreign Ministry', defense: 'Ministry of Defense',
                        finance: 'Ministry of Finance', education: 'Ministry of Education',
                        healthcare: 'Ministry of Healthcare', labor: 'Ministry of Labor',
                        justice: 'Ministry of Justice', trade: 'Ministry of Trade',
                        energy: 'Ministry of Energy', transportation: 'Ministry of Transportation',
                        security: 'Ministry of Security'
                    };
                    // Fetch full nation for stat baselines
                    const { data: fullNation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();
                    await supabase.from('ministries').update({
                        party_id: pm.party_id,
                        minister_first_name: pm.first_name,
                        minister_last_name: pm.last_name,
                        minister_age: pm.age,
                        minister_approval: 50,
                        ministry_name: ministryNames[mKey] || mKey,
                        confirmation_status: 'confirmed',
                        pending_minister: null,
                        stat_baselines: fullNation ? buildMinistryBaselines(mKey, fullNation) : {}
                    }).eq('id', ministry.id);
                }

                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_passed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: {
                            nation: nation?.name || 'Unknown',
                            bill_name: bill.bill_name,
                            sponsor: bill.factions?.faction_name || 'Unknown',
                            votes_for: String(votesFor),
                            votes_against: String(votesAgainst),
                            article_count: '0'
                        }
                    });
                } catch (e) { /* non-blocking */ }
            } else {
                await failBill(supabase, bill);

                // Record rejected party so President can't re-nominate same party for this slot
                if (ministry?.pending_minister) {
                    const rejectedPartyId = ministry.pending_minister.party_id;
                    const existingRejected = ministry.rejected_parties || [];
                    if (!existingRejected.includes(rejectedPartyId)) {
                        existingRejected.push(rejectedPartyId);
                    }
                    await supabase.from('ministries').update({
                        confirmation_status: 'rejected',
                        pending_minister: null,
                        rejected_parties: existingRejected
                    }).eq('id', ministry.id);
                }

                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: {
                            nation: nation?.name || 'Unknown',
                            bill_name: bill.bill_name,
                            sponsor: bill.factions?.faction_name || 'Unknown',
                            votes_for: String(votesFor),
                            votes_against: String(votesAgainst)
                        }
                    });
                } catch (e) { /* non-blocking */ }
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'minister_confirmation', earlyResolution: bill.early_resolution_status || null });
        } else if (bill.bill_type === 'veto_override' && bill.original_bill_id) {
            // Veto override bill (Presidential systems)
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Enact the ORIGINAL vetoed bill
                const { data: originalBill } = await supabase.from('bills')
                    .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(*, factions(faction_name))')
                    .eq('id', bill.original_bill_id).single();
                if (originalBill) {
                    await supabase.from('bills').update({ president_action: 'overridden' }).eq('id', originalBill.id);
                    const enactment = await enactBill(supabase, originalBill, currentTick);
                    if (!enactment?.success) {
                        await markBillEnactmentFailed(supabase, originalBill, currentTick, enactment?.error || 'Unknown enactment failure');
                        try {
                            await supabase.rpc('fire_system_event', {
                                p_trigger_key: 'bill_failed',
                                p_nation_id: originalBill.nation_id,
                                p_tick: currentTick,
                                p_placeholders: {
                                    nation: nation?.name || 'Unknown',
                                    bill_name: `${originalBill.bill_name} (override enactment failed)`,
                                    sponsor: originalBill.factions?.faction_name || 'Unknown',
                                    votes_for: '0',
                                    votes_against: '0'
                                }
                            });
                        } catch (e) { /* non-blocking */ }
                    }
                }
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_passed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst), article_count: '0' }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'veto_override', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst) }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'veto_override', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'ratification' && bill.diplomatic_proposal_id) {
            // Diplomatic ratification bill
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Activate the linked diplomatic proposal
                const { data: proposal } = await supabase.from('diplomatic_proposals')
                    .select('*').eq('id', bill.diplomatic_proposal_id).single();
                if (proposal) {
                    const pd = proposal.proposal_data || {};
                    const updatedPipeline = { ...(pd.pipeline || {}), ratified_at: currentTick };
                    pd.pipeline = updatedPipeline;
                    await supabase.from('diplomatic_proposals')
                        .update({ status: 'active', activated_at_tick: currentTick, proposal_data: pd })
                        .eq('id', bill.diplomatic_proposal_id);
                    // Apply relation effects from active articles
                    const articles = pd.articles || [];
                    const struckIndices = new Set(pd.struck_articles || []);
                    let totalRel = 0;
                    articles.forEach((art, i) => {
                        if (!struckIndices.has(i)) totalRel += art.relations || 0;
                    });
                    if (totalRel !== 0) {
                        const nationA = proposal.proposing_nation_id < proposal.target_nation_id ? proposal.proposing_nation_id : proposal.target_nation_id;
                        const nationB = proposal.proposing_nation_id < proposal.target_nation_id ? proposal.target_nation_id : proposal.proposing_nation_id;
                        const { data: rel } = await supabase.from('diplomatic_relations')
                            .select('id, relation_score, active_treaties')
                            .eq('nation_a_id', nationA).eq('nation_b_id', nationB).maybeSingle();
                        if (rel) {
                            const newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) + totalRel));
                            const treaties = Array.isArray(rel.active_treaties) ? [...rel.active_treaties, proposal.id] : [proposal.id];
                            await supabase.from('diplomatic_relations')
                                .update({ relation_score: newScore, active_treaties: treaties }).eq('id', rel.id);
                        }
                    }
                    try {
                        await supabase.rpc('fire_system_event', {
                            p_trigger_key: 'bill_passed',
                            p_nation_id: bill.nation_id,
                            p_tick: currentTick,
                            p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst), article_count: '0' }
                        });
                    } catch (e) { /* non-blocking */ }
                }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'ratification', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                // Mark proposal as ratification_failed so FM can abandon or retry
                await supabase.from('diplomatic_proposals')
                    .update({ status: 'ratification_failed' })
                    .eq('id', bill.diplomatic_proposal_id);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst) }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'ratification', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'ratification' && bill.trade_negotiation_id) {
            // Trade agreement ratification bill
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                // Check if the OTHER nation's ratification bill has also passed
                const { data: neg } = await supabase.from('trade_negotiations')
                    .select('*').eq('id', bill.trade_negotiation_id).single();

                if (neg) {
                    const isNationA = bill.nation_id === neg.nation_a_id;
                    const otherBillId = isNationA ? neg.bill_b_id : neg.bill_a_id;

                    let otherPassed = false;
                    if (otherBillId) {
                        const { data: otherBill } = await supabase.from('bills')
                            .select('status').eq('id', otherBillId).single();
                        otherPassed = otherBill?.status === 'passed';
                    }

                    if (otherPassed) {
                        // Both parliaments ratified — activate the trade agreement
                        // Extract duration info from draft articles
                        const articles = neg.draft_articles || [];
                        const durationArt = articles.find(a => a.type === 'duration');
                        const durData = durationArt?.data || {};
                        const isPermanent = durData.duration_type === 'permanent';
                        const durationTicks = durData.duration_ticks || null;
                        const autoRenew = durData.auto_renew || false;
                        const withdrawalNotice = durData.withdrawal_notice_ticks || 3;

                        // Ensure canonical nation order (nation_a_id < nation_b_id)
                        const nA = neg.nation_a_id < neg.nation_b_id ? neg.nation_a_id : neg.nation_b_id;
                        const nB = neg.nation_a_id < neg.nation_b_id ? neg.nation_b_id : neg.nation_a_id;

                        // Insert into trade_agreements
                        const { data: newAgreement } = await supabase.from('trade_agreements').insert({
                            nation_a_id: nA,
                            nation_b_id: nB,
                            negotiation_id: neg.id,
                            bill_a_id: neg.bill_a_id,
                            bill_b_id: neg.bill_b_id,
                            agreement_type: neg.agreement_type,
                            agreement_name: neg.agreement_name || 'Trade Agreement',
                            articles: articles,
                            duration_type: isPermanent ? 'permanent' : 'fixed',
                            duration_ticks: isPermanent ? null : durationTicks,
                            auto_renew: autoRenew,
                            withdrawal_notice_ticks: withdrawalNotice,
                            status: 'active',
                            enacted_at_tick: currentTick,
                            expires_at_tick: isPermanent ? null : (durationTicks ? currentTick + durationTicks : null)
                        }).select('id').single();

                        // For economic aid agreements, create the aid_agreement_state row
                        if (neg.agreement_type === 'economic_aid' && newAgreement) {
                            const aidTerms = articles.find(a => a.type === 'aid_terms');
                            if (aidTerms) {
                                const donorId = aidTerms.data.donor_nation_id;

                                // Validate donor_nation_id is one of the two agreement parties
                                if (donorId !== nA && donorId !== nB) {
                                    console.error(`[resolveExpiredVotes] Invalid donor_nation_id ${donorId} — not a party to agreement [${nA}, ${nB}]. Skipping aid_agreement_state.`);
                                } else {
                                    const recipientId = donorId === nA ? nB : nA;
                                    const annualAmount = Number(aidTerms.data.annual_amount || 0);

                                    const { error: aidStateError } = await supabase.from('aid_agreement_state').insert({
                                        agreement_id: newAgreement.id,
                                        donor_nation_id: donorId,
                                        recipient_nation_id: recipientId,
                                        current_annual_amount: annualAmount,
                                        original_annual_amount: annualAmount,
                                        next_review_tick: currentTick + DIPLOMACY_CONFIG.AID_ANNUAL_REVIEW_INTERVAL,
                                        condition_failures: {}
                                    });

                                    if (aidStateError) {
                                        console.error(`[resolveExpiredVotes] Failed to create aid_agreement_state:`, aidStateError.message);
                                    } else {
                                        console.log(`[resolveExpiredVotes] Economic aid agreement activated: donor=${donorId}, recipient=${recipientId}, amount=$${(annualAmount/1e9).toFixed(2)}B`);
                                    }
                                }
                            }
                        }

                        // Mark negotiation as concluded
                        await supabase.from('trade_negotiations')
                            .update({ status: 'concluded', concluded_at_tick: currentTick })
                            .eq('id', neg.id);

                        // Update diplomatic relations
                        const { data: rel } = await supabase.from('diplomatic_relations')
                            .select('id, relation_score, active_treaties')
                            .eq('nation_a_id', nA).eq('nation_b_id', nB).maybeSingle();
                        if (rel) {
                            const bonus = neg.agreement_type === 'economic_aid' ? DIPLOMACY_CONFIG.AID_RELATION_BONUS : 5;
                            const newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) + bonus));
                            await supabase.from('diplomatic_relations')
                                .update({ relation_score: newScore }).eq('id', rel.id);
                        }
                    }
                    // If only one side ratified so far, just leave negotiation in 'ratification' status
                }

                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_passed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst), article_count: '0' }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'trade_ratification', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                // Mark negotiation as ratification_failed
                await supabase.from('trade_negotiations')
                    .update({ status: 'ratification_failed' })
                    .eq('id', bill.trade_negotiation_id);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst) }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'trade_ratification', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'budget') {
            // Budget bill resolution
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                await resolveBudgetBill(supabase, bill, currentTick);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_passed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst), article_count: '0' }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'budget', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: { nation: nation?.name || 'Unknown', bill_name: bill.bill_name, sponsor: bill.factions?.faction_name || 'Unknown', votes_for: String(votesFor), votes_against: String(votesAgainst) }
                    });
                } catch (e) { /* non-blocking */ }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'budget', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'impeachment_motion' && bill.impeachment_id) {
            // ── Impeachment Motion (Phase 1) ──
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                // Update proceeding: motion passed, president is impeached
                await supabase.from('impeachment_proceedings').update({
                    phase: 'trial',
                    motion_result: 'passed'
                }).eq('id', bill.impeachment_id);

                // Immediate -15 gov_approval hit on president for being impeached
                const { data: proceedingData } = await supabase.from('impeachment_proceedings')
                    .select('president_id').eq('id', bill.impeachment_id).single();
                if (proceedingData) {
                    const { data: presidentRow } = await supabase.from('presidents')
                        .select('faction_id').eq('id', proceedingData.president_id).single();
                    if (presidentRow) {
                        await adjustMomentumAll(supabase, bill.nation_id, presidentRow.faction_id, -15, 'impeachment:impeached');
                    }
                }

                // Create conviction bill (Phase 2) — goes directly to floor with trial-length voting window
                const { data: convictionBill } = await supabase.from('bills').insert({
                    nation_id: bill.nation_id,
                    proposed_by: bill.proposed_by,
                    proposed_tick: currentTick,
                    bill_name: bill.bill_name.replace('Impeachment of', 'Conviction of'),
                    bill_type: 'impeachment_conviction',
                    status: 'floor',
                    voting_ends_tick: currentTick + GAME_CONFIG.IMPEACHMENT_TRIAL_TICKS,
                    impeachment_id: bill.impeachment_id,
                    preamble: 'The President has been impeached. Parliament must now vote on removal. A 2/3 supermajority (' + Math.ceil(totalSeats * 2 / 3) + ' of ' + totalSeats + ' seats) is required for conviction and removal from office.'
                }).select('id').single();

                if (convictionBill) {
                    await supabase.from('impeachment_proceedings').update({
                        conviction_bill_id: convictionBill.id
                    }).eq('id', bill.impeachment_id);
                }

                // Fire impeachment event
                try {
                    await supabase.from('event_log').insert({
                        nation_id: bill.nation_id,
                        event_name: 'PRESIDENT IMPEACHED',
                        event_type: 'impeachment',
                        category: 'government',
                        description_chosen: `Parliament has voted to impeach the President. The motion passed ${votesFor} to ${votesAgainst}. A trial period begins — a 2/3 supermajority vote is required for removal.`,
                        fired_at_tick: currentTick,
                        effects_applied: { impeachment_id: bill.impeachment_id, votes_for: votesFor, votes_against: votesAgainst }
                    });
                } catch (e) { /* non-blocking */ }
            } else {
                await failBill(supabase, bill);

                // Motion failed — apply cooldown
                await supabase.from('impeachment_proceedings').update({
                    phase: 'resolved',
                    motion_result: 'failed',
                    resolved_at_tick: currentTick
                }).eq('id', bill.impeachment_id);

                await supabase.from('nations').update({
                    impeachment_cooldown_until_tick: currentTick + GAME_CONFIG.IMPEACHMENT_MOTION_COOLDOWN_TICKS
                }).eq('id', bill.nation_id);

                // Filer takes -5 approval (partisan overreach)
                await adjustMomentumAll(supabase, bill.nation_id, bill.proposed_by, -5, 'impeachment:failed_motion');

                // President gets +3 approval (vindication)
                const { data: proc } = await supabase.from('impeachment_proceedings')
                    .select('president_id').eq('id', bill.impeachment_id).single();
                if (proc) {
                    const { data: presRow } = await supabase.from('presidents')
                        .select('faction_id').eq('id', proc.president_id).single();
                    if (presRow) {
                        await adjustMomentumAll(supabase, bill.nation_id, presRow.faction_id, 3, 'impeachment:vindicated');
                    }
                }

                // Record in campaign_actions for cooldown tracking
                await supabase.from('campaign_actions').insert({
                    nation_id: bill.nation_id,
                    party_id: bill.proposed_by,
                    action_type: 'impeachment_failed',
                    tick_performed: currentTick,
                    result: { impeachment_id: bill.impeachment_id }
                });

                try {
                    await supabase.from('event_log').insert({
                        nation_id: bill.nation_id,
                        event_name: 'IMPEACHMENT MOTION FAILS',
                        event_type: 'impeachment',
                        category: 'government',
                        description_chosen: `The impeachment motion has failed ${votesFor} to ${votesAgainst}. The President remains in office.`,
                        fired_at_tick: currentTick,
                        effects_applied: { impeachment_id: bill.impeachment_id, votes_for: votesFor, votes_against: votesAgainst, cooldown_ticks: GAME_CONFIG.IMPEACHMENT_MOTION_COOLDOWN_TICKS }
                    });
                } catch (e) { /* non-blocking */ }
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'impeachment_motion', earlyResolution: bill.early_resolution_status || null });

        } else if (bill.bill_type === 'impeachment_conviction' && bill.impeachment_id) {
            // ── Impeachment Conviction (Phase 2) ──
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Conviction logic handled by processImpeachmentConviction in handler-template
                // Mark proceeding as convicted — the tick handler will process removal
                await supabase.from('impeachment_proceedings').update({
                    phase: 'resolved',
                    conviction_result: 'convicted',
                    resolved_at_tick: currentTick
                }).eq('id', bill.impeachment_id);
            } else {
                await failBill(supabase, bill);
                // Acquitted — president restored, long cooldown
                await supabase.from('impeachment_proceedings').update({
                    phase: 'resolved',
                    conviction_result: 'acquitted',
                    resolved_at_tick: currentTick
                }).eq('id', bill.impeachment_id);

                await supabase.from('nations').update({
                    impeachment_cooldown_until_tick: currentTick + GAME_CONFIG.IMPEACHMENT_ACQUITTAL_COOLDOWN_TICKS
                }).eq('id', bill.nation_id);

                // President gets +5 approval (survived trial)
                const { data: proc } = await supabase.from('impeachment_proceedings')
                    .select('president_id').eq('id', bill.impeachment_id).single();
                if (proc) {
                    const { data: presRow } = await supabase.from('presidents')
                        .select('faction_id').eq('id', proc.president_id).single();
                    if (presRow) {
                        await adjustMomentumAll(supabase, bill.nation_id, presRow.faction_id, 5, 'impeachment:acquitted');
                    }
                }

                // Stability recovers +3
                const { data: natRow } = await supabase.from('nations').select('stability').eq('id', bill.nation_id).single();
                if (natRow) {
                    await supabase.from('nations').update({
                        stability: Math.min(100, Math.round(Number(natRow.stability || 0) + 3))
                    }).eq('id', bill.nation_id);
                }

                // Parties that voted for conviction take -2 approval
                const yesVoters = (bill.bill_support || []).filter(s => s.stance === 'yes' || s.stance === 'accept');
                for (const v of yesVoters) {
                    if (v.faction_id !== bill.proposed_by) {
                        await adjustMomentumAll(supabase, bill.nation_id, v.faction_id, -2, 'impeachment:overreach');
                    }
                }
                await adjustMomentumAll(supabase, bill.nation_id, bill.proposed_by, -2, 'impeachment:overreach');

                try {
                    await supabase.from('event_log').insert({
                        nation_id: bill.nation_id,
                        event_name: 'PRESIDENT ACQUITTED',
                        event_type: 'impeachment',
                        category: 'government',
                        description_chosen: `The President has been acquitted. The conviction vote failed ${votesFor} to ${votesAgainst} (needed ${Math.ceil(totalSeats * 2 / 3)}). Full presidential powers are restored.`,
                        fired_at_tick: currentTick,
                        effects_applied: { impeachment_id: bill.impeachment_id, votes_for: votesFor, votes_against: votesAgainst, cooldown_ticks: GAME_CONFIG.IMPEACHMENT_ACQUITTAL_COOLDOWN_TICKS }
                    });
                } catch (e) { /* non-blocking */ }
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'impeachment_conviction', earlyResolution: bill.early_resolution_status || null });

        } else if (passed) {
            // Presidential systems: route regular/repeal bills to president's desk
            if (isPresidentialRepublic(nation)) {
                await supabase.from('bills').update({
                    status: 'president_desk',
                    passed_tick: currentTick,
                    president_desk_deadline: currentTick + GAME_CONFIG.PRESIDENT_DESK_TICKS
                }).eq('id', bill.id);
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'bill_passed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        nation: nation?.name || 'Unknown',
                        bill_name: bill.bill_name,
                        sponsor: bill.factions?.faction_name || 'Unknown',
                        votes_for: String(votesFor),
                        votes_against: String(votesAgainst),
                        article_count: String((bill.bill_articles || []).length)
                    }
                });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'president_desk', votesFor, votesAgainst, earlyResolution: bill.early_resolution_status || null });
            } else {
                const enactment = await enactBill(supabase, bill, currentTick);
                if (!enactment?.success) {
                    await markBillEnactmentFailed(supabase, bill, currentTick, enactment?.error || 'Unknown enactment failure');
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_failed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: {
                            nation: nation?.name || 'Unknown',
                            bill_name: `${bill.bill_name} (enactment failed)`,
                            sponsor: bill.factions?.faction_name || 'Unknown',
                            votes_for: String(votesFor),
                            votes_against: String(votesAgainst)
                        }
                    });
                    results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_enactment', votesFor, votesAgainst, error: enactment?.error, earlyResolution: bill.early_resolution_status || null });
                } else {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'bill_passed',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: {
                            nation: nation?.name || 'Unknown',
                            bill_name: bill.bill_name,
                            sponsor: bill.factions?.faction_name || 'Unknown',
                            votes_for: String(votesFor),
                            votes_against: String(votesAgainst),
                            article_count: String((bill.bill_articles || []).length)
                        }
                    });
                    results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, earlyResolution: bill.early_resolution_status || null });
                }
            }
        } else {
            await failBill(supabase, bill);
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'bill_failed',
                p_nation_id: bill.nation_id,
                p_tick: currentTick,
                p_placeholders: {
                    nation: nation?.name || 'Unknown',
                    bill_name: bill.bill_name,
                    sponsor: bill.factions?.faction_name || 'Unknown',
                    votes_for: String(votesFor),
                    votes_against: String(votesAgainst)
                }
            });
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, earlyResolution: bill.early_resolution_status || null });
        }

        // ── No-vote penalty: punish factions that didn't cast any vote ──
        try {
            const penalized = await applyNoVotePenalty(supabase, bill, bill.nation_id);
            if (penalized.length > 0) {
                const names = penalized.map(p => `${p.factionName} (${p.momentumLoss} momentum, ${p.preferencePenalty} pref to ${p.affectedBlocCount} blocs)`).join(', ');
                console.log(`[resolveExpiredVotes] No-vote penalty on "${bill.bill_name}": ${names}`);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'no_vote_penalty',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: {
                            bill_name: bill.bill_name,
                            party_names: penalized.map(p => p.factionName).join(', '),
                            party_count: String(penalized.length)
                        }
                    });
                } catch (e) { /* non-blocking if event key doesn't exist yet */ }
            }
        } catch (penaltyErr) {
            console.error(`[resolveExpiredVotes] No-vote penalty failed for bill ${bill.id}:`, penaltyErr.message);
        }
    }

    return results;
}

async function markBillEnactmentFailed(supabase, bill, currentTick, enactError) {
    const normalizedError = typeof enactError === 'string' ? enactError : 'Unknown enactment failure';
    await supabase.from('bills').update({
        status: 'failed',
        passed_tick: currentTick,
        enact_error: normalizedError
    }).eq('id', bill.id);
}

export async function enactBill(supabase, bill, currentTick) {
    let enactError = null;

    const { data: nation } = await supabase
        .from('nations')
        .select('*')
        .eq('id', bill.nation_id)
        .single();
    if (!nation) return { success: false, error: `Nation ${bill.nation_id} not found` };

    const { data: currentActiveLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', bill.nation_id);

    // ── Repeal bill handling ──
    if (bill.bill_type === 'repeal') {
        const repealResult = await repealActiveLaw({
            supabase,
            nation,
            currentTick,
            currentActiveLaws,
            reversePolicy,
            bill,
        });

        if (!repealResult.success) {
            if (repealResult.reason === 'missing_target_id') {
                enactError = 'Repeal bill has no repeal_active_law_id on bill row or articles';
            } else if (repealResult.reason === 'target_law_absent' || repealResult.reason === 'missing_target_policy') {
                enactError = `Repeal target active_law ${repealResult.targetLawId} not found or missing policy`;
            } else if (repealResult.reason === 'delete_failed') {
                enactError = `Repeal target ${repealResult.targetLawId} could not be deleted: ${repealResult.error}`;
            } else {
                enactError = `Unknown repeal failure (${repealResult.reason})`;
            }
            console.error(`[enactBill] Repeal bill ${bill.id} ("${bill.bill_name}") failed: ${enactError}`);
            return { success: false, error: enactError, repealResult };
        }

        console.log(`[enactBill] Repealed active law ${repealResult.targetLawId} (${repealResult.policyName})`);
    } else {
        const articles = (bill.bill_articles || []).filter(a => a.policy_id);

        for (const art of articles) {
            const policy = art.policies;
            if (!policy) continue;

            // Repeal article — reverse and delete the targeted active law
            if (art.repeal_active_law_id) {
                const repealResult = await repealActiveLaw({
                    supabase,
                    nation,
                    currentTick,
                    currentActiveLaws,
                    reversePolicy,
                    article: art,
                });
                if (!repealResult.success) {
                    console.error(`[enactBill] Repeal article failure (${repealResult.reason}) for active_law ${repealResult.targetLawId || 'n/a'}`);
                } else {
                    console.log(`[enactBill] Repealed active law ${repealResult.targetLawId} (${repealResult.policyName})`);
                }
                continue;
            }

            if (policy.opposed_policy_ids && Array.isArray(policy.opposed_policy_ids)) {
                for (const opposedId of policy.opposed_policy_ids) {
                    const opposedLaw = (currentActiveLaws || []).find(l => l.policy_id === opposedId);
                    if (opposedLaw && opposedLaw.policies) {
                        await reversePolicy(supabase, nation, opposedLaw.policies, opposedLaw.passed_tick, currentTick);
                        await supabase.from('active_laws').delete().eq('id', opposedLaw.id);
                    }
                }
            }

            const { error: activeLawError } = await supabase.from('active_laws').upsert({
                nation_id: bill.nation_id,
                policy_id: policy.id,
                passed_tick: currentTick,
                proposed_by: bill.proposed_by,
                effects_applied_through_tick: currentTick - 1
            }, { onConflict: 'nation_id,policy_id' });
            if (activeLawError) {
                console.error(`[enactBill] Failed to upsert active_law for policy ${policy.id} (${policy.policy_name}):`, activeLawError.message);
            }
        }
    }

    // ── Apply effect_data articles (e.g. tax rate changes) ──
    const VALID_TAX_KEYS = new Set(['income_tax', 'sales_tax', 'corporate_tax']);
    const taxUpdates = {};

    for (const art of (bill.bill_articles || [])) {
        const effect = art.effect_data;
        if (!effect) continue;

        if (effect.type === 'TAX_RATE_CHANGE' && VALID_TAX_KEYS.has(effect.tax_key)) {
            const newRate = Math.max(0, Math.min(50, Number(effect.new_rate)));
            taxUpdates[effect.tax_key] = newRate;
            console.log(`[enactBill] Tax rate change: ${effect.tax_key} ${effect.old_rate}% → ${newRate}%`);
        }
    }

    // Backward compat: parse tax changes from article text for bills filed before effect_data existed
    if (Object.keys(taxUpdates).length === 0) {
        for (const art of (bill.bill_articles || [])) {
            if (art.policy_id || art.effect_data) continue;
            const title = art.article_title || '';
            if (!title.endsWith('Rate Change')) continue;
            const text = art.article_text || '';
            const match = text.match(/change\s+(.+?)\s+from\s+(\d+)%?\s+to\s+(\d+)%/i);
            if (!match) continue;
            const taxName = match[1].trim();
            const newRate = Math.max(0, Math.min(50, parseInt(match[3], 10)));
            const taxKey = taxName === 'Income Tax' ? 'income_tax'
                : taxName === 'Sales Tax' ? 'sales_tax'
                : taxName === 'Corporate Tax' ? 'corporate_tax'
                : null;
            if (taxKey) {
                taxUpdates[taxKey] = newRate;
                console.log(`[enactBill] Tax rate change (parsed): ${taxKey} → ${newRate}%`);
            }
        }
    }

    if (Object.keys(taxUpdates).length > 0) {
        const { error: taxErr } = await supabase.from('nations')
            .update(taxUpdates)
            .eq('id', bill.nation_id);
        if (taxErr) {
            console.error(`[enactBill] Failed to apply tax rate changes:`, taxErr.message);
            return { success: false, error: `Tax rate update failed: ${taxErr.message}` };
        }
        console.log(`[enactBill] Tax rates applied to nation ${bill.nation_id}:`, JSON.stringify(taxUpdates));

        // ── Apply tax-change approval/momentum effects ──
        // These match the preview shown in the economy.html tax cards.
        if (bill.proposed_by) {
            for (const [taxKey, newRate] of Object.entries(taxUpdates)) {
                const oldRate = Number(nation[taxKey] ?? 0);
                const rateDiff = newRate - oldRate;
                if (rateDiff === 0) continue;

                if (taxKey === 'corporate_tax') {
                    // Corporate tax: flat momentum hit on Business Owners voter bloc
                    const blocImpact = rateDiff > 0 ? -3 : 2;
                    const { data: boBlocRows } = await supabase
                        .from('voter_blocs')
                        .select('id')
                        .eq('nation_id', bill.nation_id)
                        .eq('bloc_name', 'Business Owners')
                        .eq('is_active', true)
                        .limit(1);
                    if (boBlocRows && boBlocRows.length > 0) {
                        await adjustMomentum(supabase, bill.nation_id, bill.proposed_by, boBlocRows[0].id, blocImpact, 'tax:corporate_tax');
                        console.log(`[enactBill] Corporate tax momentum: ${blocImpact} on Business Owners for sponsor ${bill.proposed_by}`);
                    }
                } else {
                    // Income / Sales tax: general momentum hit on sponsor
                    const approvalImpact = rateDiff > 0 ? rateDiff * -2 : Math.abs(rateDiff) * 1;
                    if (approvalImpact !== 0) {
                        await adjustMomentumAll(supabase, bill.nation_id, bill.proposed_by, approvalImpact, `tax:${taxKey}`);
                        console.log(`[enactBill] ${taxKey} momentum: ${approvalImpact} for sponsor ${bill.proposed_by}`);
                    }
                }
            }
        }
    }

    // Load ideology axes for all voting factions (sponsor + voters)
    const voterFactionIds = [bill.proposed_by, ...(bill.bill_support || []).map(s => s.faction_id)];
    const uniqueFactionIds = [...new Set(voterFactionIds.filter(Boolean))];
    const { data: ideoRows } = await supabase
        .from('faction_ideology')
        .select('faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism')
        .in('faction_id', uniqueFactionIds);

    const factionIdeologies = {};
    for (const row of (ideoRows || [])) {
        factionIdeologies[row.faction_id] = row;
    }

    const approvalDeltas = calculateEnactmentApproval(
        bill.bill_articles || [],
        bill.bill_support || [],
        bill.proposed_by,
        factionIdeologies
    );
    await applyEnactmentApproval(supabase, bill.nation_id, approvalDeltas);

    // Sponsor gains/loses preference with voter blocs based on bill ideology alignment
    await applyBlocPreferenceOnPassage(supabase, bill, bill.nation_id);

    await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick,
        enact_error: null
    }).eq('id', bill.id);

    // Legislative activity: boost gov_approval_events and record last bill tick
    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');
    await supabase.from('nations').update({ last_bill_passed_tick: currentTick }).eq('id', bill.nation_id);

    return { success: true };
}

export async function reversePolicy(supabase, nation, policy, passedTick, currentTick) {
    const ticksActive = currentTick - (passedTick || 0);
    if (ticksActive <= 0) return;

    const sourceEffects = [];
    if (policy.stat_effects && Array.isArray(policy.stat_effects) && policy.stat_effects.length > 0) {
        sourceEffects.push(...policy.stat_effects);
    } else if (policy.target_stat) {
        sourceEffects.push({
            stat_key: policy.target_stat,
            direction: (policy.stat_direction || 'UP').toLowerCase(),
            rate: policy.stat_change_per_tick || 1,
            delay_ticks: 0,
            duration_ticks: policy.duration_months || 12
        });
    }

    if (sourceEffects.length === 0) return;

    const reversalEffects = [];

    for (const eff of sourceEffects) {
        const delay = eff.delay_ticks || 0;
        const duration = eff.duration_ticks || 12;

        let effectiveTicks = 0;
        if (ticksActive > delay) {
            effectiveTicks = Math.min(ticksActive - delay, duration);
        }

        if (effectiveTicks <= 0) continue;

        reversalEffects.push({
            stat_key: eff.stat_key,
            direction: eff.direction === 'up' ? 'down' : 'up',
            rate: eff.rate || 1,
            delay_ticks: 0,
            duration_ticks: effectiveTicks
        });
    }

    if (reversalEffects.length === 0) return;

    const { error: reversalInsertError } = await supabase.from('active_laws').insert({
        nation_id: nation.id,
        policy_id: policy.id,
        passed_tick: currentTick,
        proposed_by: null,
        effects_applied_through_tick: currentTick - 1,
        is_reversal: true,
        reversal_effects: reversalEffects
    });
    if (reversalInsertError) {
        console.error(`[reversePolicy] Failed to insert reversal active_law for policy ${policy.id}:`, reversalInsertError.message);
    }
}

// ==================== FOUNDATIONAL BILL ENACTMENT ====================

export async function enactFoundationalBill(supabase, bill, currentTick) {
    // Validate proposed_seats BEFORE marking the bill as passed
    let newTotalSeats = bill.proposed_seats;

    // Fallback: if proposed_seats is null (column missing or data lost), parse from preamble
    if (!newTotalSeats && bill.preamble) {
        const match = bill.preamble.match(/from\s+\d+\s+to\s+(\d+)/i);
        if (match) {
            newTotalSeats = parseInt(match[1], 10);
            console.warn(`[enactFoundationalBill] proposed_seats was null, recovered ${newTotalSeats} from preamble`);
        }
    }

    if (!newTotalSeats || newTotalSeats < 50 || newTotalSeats > 500) {
        console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_seats: ${newTotalSeats}. Marking as failed.`);
        await supabase.from('bills').update({
            status: 'failed',
            passed_tick: currentTick
        }).eq('id', bill.id);
        return false;
    }

    // Validation passed — mark bill as passed
    console.log(`[enactFoundationalBill] Bill ${bill.id}: proposed_seats=${newTotalSeats}. Marking as passed.`);
    await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);

    // Get current total seats to compute delta
    const { data: nationData } = await supabase
        .from('nations')
        .select('total_seats')
        .eq('id', bill.nation_id)
        .single();
    const currentTotalSeats = nationData?.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const delta = newTotalSeats - currentTotalSeats;

    // 1. Update nation's total_seats
    await supabase.from('nations').update({
        total_seats: newTotalSeats
    }).eq('id', bill.nation_id);

    if (delta !== 0) {
        // SEATS CHANGE — proportionally rescale all party seats to the new total
        let redistributed = false;

        // Attempt 1: use vote totals from last completed parliamentary election
        const { data: election } = await supabase
            .from('elections')
            .select('id, results')
            .eq('nation_id', bill.nation_id)
            .eq('status', 'completed')
            .eq('election_type', 'parliamentary')
            .order('election_tick', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (election?.results?.votes) {
            const votes = election.results.votes;
            const voteTotals = {};
            // Handle both array format (SQL RPC) and object format (JS simulation)
            if (Array.isArray(votes)) {
                for (const v of votes) voteTotals[v.party_id] = v.votes || 0;
            } else {
                for (const [pid, v] of Object.entries(votes)) voteTotals[pid] = v || 0;
            }
            if (Object.keys(voteTotals).length > 0) {
                const newSeats = allocateSeatsByVotes(voteTotals, newTotalSeats);
                for (const [partyId, seats] of Object.entries(newSeats)) {
                    const { error: seatErr } = await supabase.from('factions').update({ seats }).eq('id', partyId);
                    if (seatErr) {
                        console.error(`[enactFoundationalBill] Failed to update seats for faction ${partyId}:`, seatErr);
                        await supabase.from('nations').update({ total_seats: currentTotalSeats }).eq('id', bill.nation_id);
                        return false;
                    }
                }
                redistributed = true;
                console.log(`[enactFoundationalBill] Redistributed from election vote data.`);
            }
        }

        // Fallback: proportionally scale existing faction seats to fill the new total
        if (!redistributed) {
            console.warn(`[enactFoundationalBill] No election vote data found — scaling existing seats proportionally.`);
            const { data: factions } = await supabase
                .from('factions')
                .select('id, seats')
                .eq('nation_id', bill.nation_id)
                .eq('faction_type', 'party');

            if (factions && factions.length > 0) {
                const oldSum = factions.reduce((s, f) => s + (f.seats || 0), 0);
                if (oldSum > 0) {
                    // Use Largest Remainder to cleanly distribute newTotalSeats
                    const seatTotals = {};
                    for (const f of factions) seatTotals[f.id] = f.seats || 0;
                    const newSeats = allocateSeatsByVotes(seatTotals, newTotalSeats);
                    for (const [partyId, seats] of Object.entries(newSeats)) {
                        const { error: seatErr } = await supabase.from('factions').update({ seats }).eq('id', partyId);
                        if (seatErr) {
                            console.error(`[enactFoundationalBill] Failed to update seats for faction ${partyId}:`, seatErr);
                            await supabase.from('nations').update({ total_seats: currentTotalSeats }).eq('id', bill.nation_id);
                            return false;
                        }
                    }
                } else {
                    // All parties at 0 seats — distribute evenly
                    const perParty = Math.floor(newTotalSeats / factions.length);
                    let remainder = newTotalSeats - perParty * factions.length;
                    for (const f of factions) {
                        const seats = perParty + (remainder > 0 ? 1 : 0);
                        if (remainder > 0) remainder--;
                        const { error: seatErr } = await supabase.from('factions').update({ seats }).eq('id', f.id);
                        if (seatErr) {
                            console.error(`[enactFoundationalBill] Failed to update seats for faction ${f.id}:`, seatErr);
                            await supabase.from('nations').update({ total_seats: currentTotalSeats }).eq('id', bill.nation_id);
                            return false;
                        }
                    }
                }
            }
        }

        console.log(`[enactFoundationalBill] ${currentTotalSeats} -> ${newTotalSeats} (${delta > 0 ? '+' : ''}${delta}). Seats rescaled.`);
    } else {
        console.log(`[enactFoundationalBill] No seat change (already ${newTotalSeats}).`);
    }

    // Sync in-memory config so downstream logic in the same tick uses the new seat count
    initGameConfigForNation({ total_seats: newTotalSeats });

    // Legislative activity: boost gov_approval_events and record last bill tick
    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');
    await supabase.from('nations').update({ last_bill_passed_tick: currentTick }).eq('id', bill.nation_id);

    return true;
}

export async function failBill(supabase, bill) {
    await supabase.from('bills').update({
        status: 'failed'
    }).eq('id', bill.id);
}

/**
 * Ensure ambassador rows stay in sync when confirmation bills are failed
 * through bulk/force-fail paths that bypass resolveExpiredVotes.
 */
export async function syncAmbassadorsForFailedConfirmationBills(supabase, failedBills) {
    if (!Array.isArray(failedBills) || failedBills.length === 0) return;

    const ambassadorIds = [...new Set(
        failedBills
            .filter(b => b?.bill_type === 'confirmation' && b?.ambassador_id)
            .map(b => b.ambassador_id)
    )];

    if (ambassadorIds.length === 0) return;

    const { error } = await supabase
        .from('ambassadors')
        .update({
            status: 'rejected',
            is_active: false
        })
        .in('id', ambassadorIds);

    if (error) {
        console.warn('[syncAmbassadorsForFailedConfirmationBills] Failed to reject ambassadors:', error.message);
    }
}


// ==================== AMBASSADOR TERM LIMITS ====================

/**
 * Process ambassador retirements and warnings for a single nation.
 * Called once per nation per tick inside the advanceTick loop.
 *
 * 1. Retire ambassadors whose term has expired (current_tick - appointed_at_tick >= term_length).
 * 2. Cancel in-progress diplomatic proposals involving the retiring ambassador's nation pair.
 * 3. Appoint a replacement ambassador with a fresh 60-tick term.
 * 4. Fire event log entries for retirements and lapsed negotiations.
 * 5. Show retirement warning at (term_length - AMBASSADOR_RETIREMENT_WARNING) ticks.
 */
async function processAmbassadorRetirements(supabase, nation, currentTick) {
    const results = [];

    // Fetch all active ambassadors for this nation
    const { data: ambassadors, error: fetchErr } = await supabase
        .from('ambassadors')
        .select('id, nation_id, target_nation_id, faction_id, ambassador_first_name, ambassador_last_name, ambassador_age, appointed_at_tick, term_length, retirement_warning_shown')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .eq('status', 'active');

    if (fetchErr || !ambassadors || ambassadors.length === 0) return results;

    // Load target nation names for event messages
    const targetNationIds = [...new Set(ambassadors.map(a => a.target_nation_id))];
    const { data: targetNations } = await supabase
        .from('nations')
        .select('id, name')
        .in('id', targetNationIds);
    const nationNameMap = {};
    if (targetNations) targetNations.forEach(n => { nationNameMap[n.id] = n.name; });

    for (const amb of ambassadors) {
      try {
        const appointedTick = amb.appointed_at_tick;
        if (appointedTick == null) continue; // No term tracking — skip

        const termLength = amb.term_length || DIPLOMACY_CONFIG.AMBASSADOR_TERM_LENGTH;
        const ticksServed = currentTick - appointedTick;
        const ticksRemaining = termLength - ticksServed;
        const targetNationName = nationNameMap[amb.target_nation_id] || 'Unknown';
        const ambName = ((amb.ambassador_first_name || '') + ' ' + (amb.ambassador_last_name || '')).trim();

        // ---- RETIREMENT ----
        if (ticksServed >= termLength) {
            const yearsServed = Math.floor(ticksServed / 12);

            // 1. Retire the ambassador
            const { error: retireErr } = await supabase.from('ambassadors').update({
                status: 'recalled',
                is_active: false,
                recalled_at_tick: currentTick
            }).eq('id', amb.id);
            if (retireErr) {
                console.error(`[processAmbassadorRetirements] Failed to retire ${ambName}:`, retireErr);
                continue;
            }

            // 2. Cancel in-progress diplomatic proposals involving this nation pair
            const cancelStatuses = ['proposed', 'fm_review', 'ratification'];
            const { data: lapsedProposals } = await supabase
                .from('diplomatic_proposals')
                .select('id, proposal_type, proposal_data, proposing_nation_id, target_nation_id, proposing_bill_id, target_bill_id')
                .in('status', cancelStatuses)
                .or(`and(proposing_nation_id.eq.${nation.id},target_nation_id.eq.${amb.target_nation_id}),and(proposing_nation_id.eq.${amb.target_nation_id},target_nation_id.eq.${nation.id})`);

            if (lapsedProposals && lapsedProposals.length > 0) {
                const lapsedIds = lapsedProposals.map(p => p.id);
                await supabase.from('diplomatic_proposals')
                    .update({ status: 'expired', terminated_at_tick: currentTick })
                    .in('id', lapsedIds);

                // Cancel any linked ratification bills
                for (const lp of lapsedProposals) {
                    if (lp.proposing_bill_id) {
                        await supabase.from('bills')
                            .update({ status: 'failed' })
                            .eq('id', lp.proposing_bill_id)
                            .in('status', ['floor', 'committee']);
                    }
                    if (lp.target_bill_id) {
                        await supabase.from('bills')
                            .update({ status: 'failed' })
                            .eq('id', lp.target_bill_id)
                            .in('status', ['floor', 'committee']);
                    }
                }

                // Fire lapsed negotiation event for the OTHER nation
                await supabase.from('event_log').insert({
                    nation_id: amb.target_nation_id,
                    event_name: 'Diplomatic Negotiations Lapsed',
                    category: 'Diplomatic',
                    description_chosen: `${nation.name}'s ambassador has retired. ${lapsedProposals.length} pending negotiation(s) have lapsed. The new ambassador may re-propose if desired.`,
                    fired_at_tick: currentTick
                });
            }

            // 3. Generate replacement ambassador
            let newFirst, newLast;
            do { newFirst = PM_FIRST_NAMES[Math.floor(Math.random() * PM_FIRST_NAMES.length)]; }
            while (newFirst === amb.ambassador_first_name);
            do { newLast = PM_LAST_NAMES[Math.floor(Math.random() * PM_LAST_NAMES.length)]; }
            while (newLast === amb.ambassador_last_name);
            const newAge = 35 + Math.floor(Math.random() * 20); // 35-54

            const { error: insertErr } = await supabase.from('ambassadors').insert({
                nation_id: nation.id,
                target_nation_id: amb.target_nation_id,
                faction_id: amb.faction_id,
                ambassador_first_name: newFirst,
                ambassador_last_name: newLast,
                ambassador_age: newAge,
                status: 'active',
                is_active: true,
                appointed_at_tick: currentTick,
                term_length: DIPLOMACY_CONFIG.AMBASSADOR_TERM_LENGTH
            });
            if (insertErr) {
                console.error(`[processAmbassadorRetirements] Failed to create replacement for ${ambName}:`, insertErr);
                // Ambassador was already retired — continue without replacement
            }

            // 4. Fire retirement event for this nation
            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'Ambassador Retired',
                category: 'Diplomatic',
                description_chosen: `${ambName} has retired after ${yearsServed} year${yearsServed !== 1 ? 's' : ''} of service as Ambassador to ${targetNationName}.${insertErr ? '' : ` ${newFirst} ${newLast} has been appointed as replacement.`}`,
                fired_at_tick: currentTick
            });

            results.push({ ambassadorId: amb.id, name: ambName, target: targetNationName, action: 'retired', replacement: insertErr ? null : `${newFirst} ${newLast}` });
            console.log(`[processAmbassadorRetirements] ${ambName} retired from ${nation.name} → ${targetNationName}.${insertErr ? ' (replacement failed)' : ` Replaced by ${newFirst} ${newLast}.`}`);

        // ---- RETIREMENT WARNING (3 ticks before) ----
        } else if (ticksRemaining <= DIPLOMACY_CONFIG.AMBASSADOR_RETIREMENT_WARNING && !amb.retirement_warning_shown) {
            await supabase.from('ambassadors')
                .update({ retirement_warning_shown: true })
                .eq('id', amb.id);

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'Ambassador Retirement Approaching',
                category: 'Diplomatic',
                description_chosen: `Ambassador ${ambName} to ${targetNationName} will retire in ${ticksRemaining} tick${ticksRemaining !== 1 ? 's' : ''}. Conclude any active negotiations before the transition.`,
                fired_at_tick: currentTick
            });

            results.push({ ambassadorId: amb.id, name: ambName, target: targetNationName, action: 'warning' });
            console.log(`[processAmbassadorRetirements] Retirement warning for ${ambName} (${nation.name} → ${targetNationName}): ${ticksRemaining} ticks remaining.`);
        }
      } catch (ambErr) {
        console.error(`[processAmbassadorRetirements] Error processing ambassador ${amb.id}:`, ambErr);
      }
    }

    return results;
}
