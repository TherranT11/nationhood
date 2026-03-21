/**
 * bills.js — Bill support, vote tallies, ideology shifts, resolution engine, foundational bills
 * Extracted from game-common.js
 */

import { GAME_CONFIG, initGameConfigForNation, getPresidentialTermTicks, getPresidentialTermLimit } from './config.js';
import { isPresidentialRepublic } from './government-types.js';
import { DIPLOMACY_CONFIG } from './diplomacy-constants.js';
import { IDEOLOGY_AXES, IDEOLOGY_TO_AXIS, extractAxisScores, loadFactionIdeology, loadNationIdeologies } from './ideology.js';
import { adjustMomentum, adjustMomentumAll, adjustGovernmentApprovalEvent } from './momentum.js';
import { MINISTER_APPROVAL_CONFIG, buildMinistryBaselines } from './stats.js';

import { fetchActiveCoalition } from './government-structure.js';
import { resolveNoConfidence } from './elections.js';
import { getNationNames, isFemaleName } from './political-actions.js';
import { allocateSeatsByVotes } from './election-simulation.js';
import { repealActiveLaw } from './repeal-helper.js';
import { fireBillEvent } from './event-helpers.js';
import { calculateCaucusDispositions, calculateCaucusVoteAdjustment, updateCaucusRelationships } from './caucus.js';

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
        const st = v.stance === 'accept' ? 'yes' : v.stance === 'reject' ? 'no' : v.stance;
        if (st === 'yes')            votesFor += (v.seat_count || 0);
        else if (st === 'no')        votesAgainst += (v.seat_count || 0);
        else if (st === 'abstain')   votesAbstain += (v.seat_count || 0);
    });

    const { error } = await supabase.from('bills').update({
        votes_for: votesFor,
        votes_against: votesAgainst,
        votes_abstain: votesAbstain
    }).eq('id', billId);

    // Fallback: if votes_abstain column doesn't exist yet (PGRST204), update without it
    if (error && error.code === 'PGRST204' && error.message.includes('votes_abstain')) {
        console.warn('[syncVoteTallies] votes_abstain column not found, updating without it');
        await supabase.from('bills').update({
            votes_for: votesFor,
            votes_against: votesAgainst
        }).eq('id', billId);
    }

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
// Legacy — now a no-op; electorate engine handles vote share effects.

/**
 * @deprecated Removed — electorate engine handles vote share now.
 * @param {object} supabase
 * @param {object} bill - Full bill row with bill_articles (with policies)
 * @param {string} nationId
 */
export async function applyBlocPreferenceOnPassage(supabase, bill, nationId) {
    // Legacy faction_bloc_approval writes removed — electorate engine handles approval now.
    return;
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

    // 4. Apply penalties to each non-voter (momentum only — legacy faction_bloc_approval writes removed)
    const penalized = [];
    for (const faction of nonVoters) {
        // Momentum: lose 1d3+1 (2-4) across ALL blocs (adjustMomentumAll is now a no-op)
        const momentumLoss = -(Math.floor(Math.random() * 3) + 2);
        await adjustMomentumAll(supabase, nationId, faction.id, momentumLoss, 'penalty:no_vote');

        penalized.push({
            factionId: faction.id,
            factionName: faction.faction_name,
            momentumLoss,
            preferencePenalty: 0,
            affectedBlocCount: 0
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
    // Legacy bloc-weighted approval removed — electorate engine handles vote share now
    return null;
}

export async function ensureBlocApprovals(supabase, factionId, nationId) {
    // Legacy bloc approval seeding removed — electorate engine handles vote share now
    return null;
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
        !['no_confidence', 'confirmation', 'minister_confirmation', 'foundational', 'veto_override'].includes(b.bill_type)
    );
    if (legislativeBills.length === 0) return;

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

        // Build YES voter set (normalize committee stances)
        const yesVoters = new Set();
        for (const s of (bill.bill_support || [])) {
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') yesVoters.add(s.faction_id);
        }
        // Sponsor always counts as YES
        if (bill.proposed_by) yesVoters.add(bill.proposed_by);

        // Track how many times each (axis, direction) pair appears in this bill
        // for diminishing returns: 1st = full, 2nd = 50%, 3rd = 25%, 4th+ = 12.5%
        const axisTagCounts = {};

        for (const tag of tags) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (!mapping) continue;

            const key = `${mapping.axisKey}:${mapping.direction}`;
            const count = (axisTagCounts[key] || 0) + 1;
            axisTagCounts[key] = count;

            const diminish = count <= 3 ? (1 / Math.pow(2, count - 1)) : 0.125;

            // +2 for proposing (sponsor only)
            if (bill.proposed_by) {
                addShift(bill.proposed_by, mapping.axisKey, 2 * mapping.direction * diminish);
            }

            // +4 for voting YES (all YES voters including sponsor)
            for (const factionId of yesVoters) {
                addShift(factionId, mapping.axisKey, 4 * mapping.direction * diminish);
            }
        }
    }

    // Apply accumulated shifts to faction_ideology
    const historyRows = [];

    for (const [factionId, axisShifts] of Object.entries(factionShifts)) {
        let ideologyRow = await loadFactionIdeology(supabase, factionId);
        if (ideologyRow?._error || !ideologyRow) {
            console.warn(`[processIdeologyShifts] Skipping faction ${factionId}: ${ideologyRow?._error ? 'DB error' : 'no ideology row'}`);
            continue;
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


// ==================== IDEOLOGY DECAY ====================

const IDEOLOGY_DECAY_DEAD_ZONE = 10; // no decay within ±10 of center
/**
 * Per-tick ideology decay toward center (0).
 * Integer arithmetic to match INTEGER columns in faction_ideology.
 *   ±11–74 → 1/tick, ±75–100 → 2/tick
 * Dead zone: scores within ±10 don't decay.
 */
export async function processIdeologyDecay(supabase, nationId, currentTick) {
    const ideologies = await loadNationIdeologies(supabase, nationId);
    if (!ideologies || ideologies.length === 0) return;

    const historyRows = [];

    for (const ideo of ideologies) {
        const updateObj = {};

        for (const axis of IDEOLOGY_AXES) {
            const score = ideo[axis.key] || 0;
            if (Math.abs(score) <= IDEOLOGY_DECAY_DEAD_ZONE) continue;

            const absDecay = Math.max(1, Math.round(Math.abs(score) / 50));
            const newScore = score > 0
                ? Math.max(0, score - absDecay)
                : Math.min(0, score + absDecay);

            if (newScore !== score) updateObj[axis.key] = newScore;
        }

        if (Object.keys(updateObj).length === 0) continue;

        const { error: updateErr } = await supabase
            .from('faction_ideology')
            .update(updateObj)
            .eq('faction_id', ideo.faction_id);

        if (updateErr) {
            console.error(`[processIdeologyDecay] update failed for faction ${ideo.faction_id}:`, updateErr.message);
            continue;
        }

        if (typeof currentTick === 'number') {
            historyRows.push({
                faction_id: ideo.faction_id,
                nation_id: nationId,
                tick: currentTick,
                liberty_equality: updateObj.liberty_equality ?? ideo.liberty_equality ?? 0,
                tradition_progress: updateObj.tradition_progress ?? ideo.tradition_progress ?? 0,
                security_freedom: updateObj.security_freedom ?? ideo.security_freedom ?? 0,
                globalism_nationalism: updateObj.globalism_nationalism ?? ideo.globalism_nationalism ?? 0,
                individualism_collectivism: updateObj.individualism_collectivism ?? ideo.individualism_collectivism ?? 0,
            });
        }
    }

    if (historyRows.length > 0) {
        const { error: histErr } = await supabase
            .from('ideology_history')
            .insert(historyRows);
        if (histErr) {
            console.warn('[processIdeologyDecay] ideology_history insert failed:', histErr.message);
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
    const { data: activeBills, error } = await supabase
        .from('bills')
        .select('id, bill_name, bill_type, voting_ends_tick, proposed_tick, floor_tick, caucus_votes_withheld, bill_support(faction_id, stance, seat_count)')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .is('early_resolution_status', null)
        .or(`voting_ends_tick.gt.${currentTick},voting_ends_tick.is.null`);

    console.log(`[checkEarlyMajority] nation=${nationId} currentTick=${currentTick} found ${activeBills?.length ?? 0} active floor bills (error=${error?.message || 'none'})`);

    if (error || !activeBills || activeBills.length === 0) return [];

    // Use the actual sum of faction seats as the voting denominator, not
    // total_seats.  In autocracies (and after seat changes) the nation's
    // total_seats can exceed the seats actually held by factions — those
    // vacant/unaligned seats can never vote, so including them would inflate
    // the "undeclared" count and break quorum & math-lock checks.
    const { data: factionRows } = await supabase
        .from('factions')
        .select('seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');
    const factionSeatSum = (factionRows || []).reduce((sum, f) => sum + (f.seats || 0), 0);
    const effectiveTotalSeats = Math.min(GAME_CONFIG.TOTAL_SEATS, Math.max(factionSeatSum, 1));

    const quorumSeats = Math.ceil(effectiveTotalSeats * GAME_CONFIG.QUORUM_THRESHOLD);
    const results = [];

    // Check for emergency minority government penalty (once per nation per tick)
    const earlyCoalition = await fetchActiveCoalition(supabase, nationId);
    const minorityPenalty = earlyCoalition?.formation_type === 'emergency_minority';

    for (const bill of activeBills) {
        let yesSeats = 0, noSeats = 0, abstainSeats = 0;
        (bill.bill_support || []).forEach(s => {
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') yesSeats += (s.seat_count || 0);
            else if (stance === 'no') noSeats += (s.seat_count || 0);
            else if (stance === 'abstain') abstainSeats += (s.seat_count || 0);
        });

        // Apply emergency minority penalty to effective YES votes
        let effectiveYes = yesSeats;
        if (minorityPenalty) {
            effectiveYes = Math.floor(yesSeats * 0.8);
        }

        // Apply caucus withheld votes (from opposed internal factions)
        const caucusWithheld = bill.caucus_votes_withheld || 0;
        if (caucusWithheld > 0) {
            effectiveYes = Math.max(0, effectiveYes - caucusWithheld);
        }

        let earlyStatus = null;
        const participating = yesSeats + noSeats + abstainSeats;
        const undeclaredSeats = Math.max(0, effectiveTotalSeats - participating);

        // ── Check 1: Mathematical lock (outcome impossible to change) ──
        if (bill.bill_type === 'foundational' || bill.bill_type === 'default_resolution' || bill.bill_type === 'veto_override' || bill.bill_type === 'impeachment_conviction') {
            // Absolute supermajority: 67% of effective total seats, no quorum
            // Must use effectiveTotalSeats (not GAME_CONFIG.TOTAL_SEATS) to match resolveBillVote
            const requiredSeats = (bill.bill_type === 'veto_override')
                ? Math.ceil(effectiveTotalSeats * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD)
                : Math.ceil(effectiveTotalSeats * GAME_CONFIG.SUPERMAJORITY_THRESHOLD);
            if (effectiveYes >= requiredSeats) {
                earlyStatus = 'majority_reached';
            } else if (effectiveYes + undeclaredSeats < requiredSeats) {
                earlyStatus = 'majority_opposed';
            }
        } else if (bill.bill_type === 'no_confidence' || bill.bill_type === 'impeachment_motion') {
            // Absolute majority: 50%+1 of total seats, no quorum
            const threshold = Math.floor(effectiveTotalSeats / 2) + 1;
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
            if (bill.bill_type !== 'foundational' && bill.bill_type !== 'default_resolution'
                && bill.bill_type !== 'veto_override'
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

        if (earlyStatus) {
            // Resolve immediately this tick (no grace period)
            const resolveAtTick = Math.min(currentTick, bill.voting_ends_tick);

            await supabase.from('bills').update({
                early_resolution_status: earlyStatus,
                early_resolution_tick: currentTick,
                voting_ends_tick: resolveAtTick
            }).eq('id', bill.id);

            const resolveType = earlyStatus.startsWith('quorum') ? 'QUORUM' : 'MATH-LOCK';
            console.log(`[checkEarlyMajority] ${bill.bill_name}: ${earlyStatus} [${resolveType}] (YES=${yesSeats}, NO=${noSeats}, quorum=${quorumSeats}, voted=${participating}, effectiveTotal=${effectiveTotalSeats}, configTotal=${GAME_CONFIG.TOTAL_SEATS}). Resolves tick ${resolveAtTick}`);
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
        // Simplified query: bill_support only needs faction_id/stance/seat_count for vote
        // tallying. Nesting factions() inside bill_support adds a FK join that can cause
        // the entire query to fail silently in PostgREST, leaving all bills stuck on floor.
        .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(faction_id, stance, seat_count)')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .lte('voting_ends_tick', currentTick);

    console.log(`[resolveExpiredVotes] nation=${nationId} currentTick=${currentTick} query returned ${expiredBills?.length ?? 0} bills (error=${error?.message || 'none'})`);
    if (expiredBills && expiredBills.length > 0) {
        for (const b of expiredBills) {
            console.log(`[resolveExpiredVotes]   bill=${b.id} "${b.bill_name}" type=${b.bill_type} voting_ends=${b.voting_ends_tick} early_status=${b.early_resolution_status} support_count=${(b.bill_support||[]).length}`);
        }
    }

    if (error || !expiredBills || expiredBills.length === 0) return [];

    const results = [];

    // Compute the actual sum of faction-held seats — only these can vote.
    // In autocracies (and after seat changes) total_seats can exceed the
    // seats held by factions; including vacant/unaligned seats inflates
    // quorum and makes bills impossible to pass.
    const { data: factionRowsForResolve } = await supabase
        .from('factions')
        .select('seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');
    const resolveFactionSeatSum = (factionRowsForResolve || []).reduce((sum, f) => sum + (f.seats || 0), 0);

    for (const bill of expiredBills) {
      try {
        const { data: nation } = await supabase
            .from('nations')
            .select('name, government_type, total_seats')
            .eq('id', bill.nation_id)
            .single();
        const nominalTotalSeats = nation?.total_seats || GAME_CONFIG.TOTAL_SEATS;
        const totalSeats = Math.min(nominalTotalSeats, Math.max(resolveFactionSeatSum, 1));
        let votesFor = 0, votesAgainst = 0, votesAbstain = 0;

        (bill.bill_support || []).forEach(s => {
            // Normalize committee stances: 'accept' → 'yes', 'reject' → 'no'
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') votesFor += (s.seat_count || 0);
            else if (stance === 'no') votesAgainst += (s.seat_count || 0);
            else if (stance === 'abstain') votesAbstain += (s.seat_count || 0);
        });

        // Emergency minority government penalty: -20% effective YES votes
        const activeCoalition = await fetchActiveCoalition(supabase, bill.nation_id);
        let effectiveVotesFor = votesFor;
        if (activeCoalition?.formation_type === 'emergency_minority') {
            effectiveVotesFor = Math.floor(votesFor * 0.8);
            console.log(`[MinorityPenalty] ${bill.bill_name}: votesFor ${votesFor} → ${effectiveVotesFor} (emergency minority -20%)`);
        }

        // Caucus system: read existing dispositions (created when bill entered floor)
        // and recalculate vote adjustment to account for any whipping during voting window.
        // Fallback: if no dispositions exist yet (legacy bills), calculate them now.
        try {
            const { data: existingDisp } = await supabase
                .from('caucus_dispositions')
                .select('id')
                .eq('bill_id', bill.id)
                .limit(1);
            if (!existingDisp || existingDisp.length === 0) {
                // Legacy fallback: dispositions weren't created at floor entry
                await calculateCaucusDispositions(supabase, bill.id, bill.nation_id, bill.bill_articles || []);
            }
            const caucusAdj = await calculateCaucusVoteAdjustment(supabase, bill.id);
            if (caucusAdj.withheld > 0) {
                effectiveVotesFor = Math.max(0, effectiveVotesFor - caucusAdj.withheld);
                console.log(`[CaucusVote] ${bill.bill_name}: ${caucusAdj.withheld} votes withheld by opposed caucuses (effective YES: ${effectiveVotesFor})`);
            }
        } catch (caucusErr) {
            console.error(`[CaucusVote] Failed for bill ${bill.id} (non-fatal):`, caucusErr);
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
        console.log(`[resolveExpiredVotes] bill=${bill.id} votes yes=${votesFor} no=${votesAgainst} abstain=${votesAbstain} effective_yes=${effectiveVotesFor} totalSeats=${totalSeats} resolution=${resolution}`);

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
            await syncFailedMinisterConfirmationBill(supabase, bill);
            await syncFailedAmbassadorConfirmationBill(supabase, bill);
            const quorumThreshold = Math.ceil(totalSeats * GAME_CONFIG.QUORUM_THRESHOLD);
            const participating = votesFor + votesAgainst + votesAbstain;
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, extra: { reason: `quorum not met after two attempts (${participating}/${quorumThreshold} participating)` } });
            console.log(`[resolveExpiredVotes] ${bill.bill_name}: quorum failed twice (${participating}/${quorumThreshold}), bill dies`);
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_no_quorum', votesFor, votesAgainst, votesAbstain, type: bill.bill_type });
            continue;
        }

        let passed = resolution === 'passed';
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
            await fireBillEvent(supabase, enacted ? 'bill_passed' : 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
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
            await fireBillEvent(supabase, passed ? 'bill_passed' : 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: 0 });
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
                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: 0 });
            } else {
                await failBill(supabase, bill);
                // Reject the ambassador
                await supabase.from('ambassadors').update({
                    status: 'rejected',
                    is_active: false
                }).eq('id', bill.ambassador_id);
                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
            }
            results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'passed' : 'failed', votesFor, votesAgainst, type: 'confirmation', earlyResolution: bill.early_resolution_status || null });
        } else if (bill.bill_type === 'minister_confirmation' && bill.ministry_key) {
            // Minister confirmation bill (Presidential systems)
            const mKey = bill.ministry_key;
            const { data: ministry } = await supabase.from('ministries')
                .select('id, pending_minister')
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
                        pending_minister: null
                    }).select('id, pending_minister').single();
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
                        minister_approval: MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL,
                        ministry_name: ministryNames[mKey] || mKey,
                        confirmation_status: 'confirmed',
                        pending_minister: null,
                        stat_baselines: fullNation ? buildMinistryBaselines(mKey, fullNation) : {}
                    }).eq('id', ministry.id);

                    // If confirming a PM, update government_formations so lead_party_id stays correct
                    if (mKey === 'prime_minister') {
                        try {
                            const { data: activeGovFormation } = await supabase.from('government_formations')
                                .select('id, ministry_assignments')
                                .eq('nation_id', bill.nation_id)
                                .in('status', ['formed', 'caretaker'])
                                .order('formed_at', { ascending: false })
                                .limit(1)
                                .maybeSingle();
                            if (activeGovFormation) {
                                const updatedAssignments = { ...(activeGovFormation.ministry_assignments || {}), prime_minister: pm.party_id };
                                await supabase.from('government_formations')
                                    .update({ ministry_assignments: updatedAssignments })
                                    .eq('id', activeGovFormation.id);
                                console.log(`[resolveExpiredVotes] Updated government_formations PM assignment to ${pm.party_id}`);
                            }
                        } catch (gfErr) { console.warn('[resolveExpiredVotes] Failed to update government_formations PM:', gfErr); }
                    }
                }

                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: 0 });
            } else {
                await failBill(supabase, bill);

                // Clear pending nominee after failed confirmation
                if (ministry?.pending_minister) {
                    await supabase.from('ministries').update({
                        confirmation_status: 'rejected',
                        pending_minister: null
                    }).eq('id', ministry.id);
                }

                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
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
                        await fireBillEvent(supabase, 'bill_failed', originalBill, { currentTick, nationName: nation?.name, votesFor: 0, votesAgainst: 0, billNameOverride: `${originalBill.bill_name} (override enactment failed)` });
                    }
                }
                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'veto_override', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'veto_override', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'ratification' && bill.diplomatic_proposal_id) {
            // Diplomatic ratification bill
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
                // Load the linked diplomatic proposal
                const { data: proposal } = await supabase.from('diplomatic_proposals')
                    .select('*').eq('id', bill.diplomatic_proposal_id).single();
                if (proposal) {
                    const pd = proposal.proposal_data || {};
                    const isBilateral = proposal.proposal_tier === 3 && proposal.proposing_bill_id && proposal.target_bill_id;

                    if (isBilateral) {
                        // ── BILATERAL RATIFICATION (Major Diplomatic Initiative) ──
                        // Check if the OTHER nation's bill has also passed
                        const isProposerBill = bill.id === proposal.proposing_bill_id;
                        const otherBillId = isProposerBill ? proposal.target_bill_id : proposal.proposing_bill_id;

                        let otherPassed = false;
                        if (otherBillId) {
                            const { data: otherBill } = await supabase.from('bills')
                                .select('status').eq('id', otherBillId).single();
                            otherPassed = otherBill?.status === 'passed';
                        }

                        // Update pipeline with this side's result
                        const pipeline = pd.pipeline || {};
                        if (isProposerBill) pipeline.proposer_result = 'passed';
                        else pipeline.target_result = 'passed';
                        pd.pipeline = pipeline;

                        if (otherPassed) {
                            // BOTH parliaments have ratified — activate the initiative
                            pipeline.proposer_result = 'passed';
                            pipeline.target_result = 'passed';
                            pipeline.ratified_at = currentTick;
                            pd.pipeline = pipeline;

                            // Compute per-tick effects from active articles and store them
                            const articles = pd.articles || [];
                            const activeArticles = articles.filter(a => a.status !== 'struck');
                            const activeEffects = { proposer: {}, target: {} };
                            let totalRel = 0;

                            for (const art of activeArticles) {
                                const effects = art.proposer_effects || art.effects || {};
                                const targetEffects = art.target_effects || art.effects || {};
                                totalRel += (effects.relations || 0);

                                // Store per-article effects for per-tick processing (enables per-article transition ramp)
                                art.active_effects = { proposer: {}, target: {} };

                                for (const [key, val] of Object.entries(effects)) {
                                    if (key === 'relations' || key === 'civil_unrest') continue;
                                    if (typeof val === 'number' && val !== 0) {
                                        activeEffects.proposer[key] = (activeEffects.proposer[key] || 0) + val;
                                        art.active_effects.proposer[key] = (art.active_effects.proposer[key] || 0) + val;
                                    }
                                }
                                for (const [key, val] of Object.entries(targetEffects)) {
                                    if (key === 'relations' || key === 'civil_unrest') continue;
                                    if (typeof val === 'number' && val !== 0) {
                                        activeEffects.target[key] = (activeEffects.target[key] || 0) + val;
                                        art.active_effects.target[key] = (art.active_effects.target[key] || 0) + val;
                                    }
                                }
                            }
                            pd.active_effects = activeEffects;

                            const { error: activateErr } = await supabase.from('diplomatic_proposals')
                                .update({ status: 'active', activated_at_tick: currentTick, proposal_data: pd })
                                .eq('id', bill.diplomatic_proposal_id);
                            if (activateErr) console.error('[bilateral] Failed to activate proposal:', activateErr.message);

                            // Apply one-time relation score bump
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

                            // Apply one-time civil unrest spike to both nations (batched to avoid race)
                            let totalUnrestSpike = 0;
                            for (const art of activeArticles) {
                                totalUnrestSpike += (art.effects?.civil_unrest || 0);
                            }
                            if (totalUnrestSpike > 0) {
                                for (const nId of [proposal.proposing_nation_id, proposal.target_nation_id]) {
                                    const { data: n } = await supabase.from('nations').select('civil_unrest').eq('id', nId).single();
                                    if (n) {
                                        const newVal = Math.max(0, Math.min(100, (n.civil_unrest || 0) + totalUnrestSpike));
                                        await supabase.from('nations').update({ civil_unrest: newVal }).eq('id', nId);
                                    }
                                }
                            }

                            await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: activeArticles.length });

                            // Fire activation news event
                            try {
                                for (const nId of [proposal.proposing_nation_id, proposal.target_nation_id]) {
                                    await supabase.rpc('insert_news_event', {
                                        p_nation_id: nId,
                                        p_trigger_key: 'major_initiative_ratified',
                                        p_tick: currentTick,
                                        p_placeholders: {
                                            nation_a: pd.proposer_nation_name || 'Unknown',
                                            nation_b: pd.target_nation_name || 'Unknown',
                                            initiative_name: pd.name || 'Diplomatic Initiative',
                                            article_count: String(activeArticles.length)
                                        }
                                    });
                                }
                            } catch (newsErr) { console.error('News event error:', newsErr); }
                        } else {
                            // Only one side ratified so far — wait for the other
                            await supabase.from('diplomatic_proposals')
                                .update({ proposal_data: pd })
                                .eq('id', bill.diplomatic_proposal_id);
                            await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
                        }
                    } else {
                        // ── UNILATERAL RATIFICATION (existing behavior) ──
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

                        // For trade agreements: create the trade_agreements row so economic effects apply
                        if (proposal.proposal_type === 'trade_agreement' && pd.agreement_type) {
                            const activeArticles = articles.filter((_, i) => !struckIndices.has(i));
                            const addedArticles = pd.added_articles || [];
                            if (addedArticles.length > 0) activeArticles.push(...addedArticles);

                            const durationArt = activeArticles.find(a => a.type === 'duration');
                            const dt = durationArt?.data || {};
                            const durationTicks = dt.duration_type === 'permanent' ? null : (dt.duration_ticks || 480);
                            const expiresAt = durationTicks ? currentTick + durationTicks : null;

                            const taNationA = proposal.proposing_nation_id < proposal.target_nation_id ? proposal.proposing_nation_id : proposal.target_nation_id;
                            const taNationB = proposal.proposing_nation_id < proposal.target_nation_id ? proposal.target_nation_id : proposal.proposing_nation_id;

                            await supabase.from('trade_agreements').insert({
                                nation_a_id: taNationA,
                                nation_b_id: taNationB,
                                agreement_type: pd.agreement_type,
                                agreement_name: pd.agreement_name || pd.name || 'Trade Agreement',
                                articles: activeArticles,
                                status: 'active',
                                enacted_at_tick: currentTick,
                                expires_at_tick: expiresAt,
                                auto_renew: dt.auto_renew || false,
                                withdrawal_notice_ticks: dt.withdrawal_notice_ticks || 3,
                                diplomatic_proposal_id: proposal.id
                            });
                        }

                        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
                    }
                }
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'ratification', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                // Load proposal to check if bilateral
                const { data: failedProposal } = await supabase.from('diplomatic_proposals')
                    .select('proposal_tier, proposing_bill_id, target_bill_id, proposal_data, proposing_nation_id, target_nation_id')
                    .eq('id', bill.diplomatic_proposal_id).single();
                const isBilateral = failedProposal?.proposal_tier === 3 && failedProposal?.proposing_bill_id && failedProposal?.target_bill_id;

                if (isBilateral) {
                    // Update pipeline with failure
                    const fpd = failedProposal.proposal_data || {};
                    const pipeline = fpd.pipeline || {};
                    const isProposerBill = bill.id === failedProposal.proposing_bill_id;
                    if (isProposerBill) pipeline.proposer_result = 'failed';
                    else pipeline.target_result = 'failed';
                    fpd.pipeline = pipeline;

                    await supabase.from('diplomatic_proposals')
                        .update({ status: 'ratification_failed', proposal_data: fpd })
                        .eq('id', bill.diplomatic_proposal_id);

                    // Cancel the other nation's ratification bill (no point voting if one side failed)
                    const otherBillId = isProposerBill ? failedProposal.target_bill_id : failedProposal.proposing_bill_id;
                    if (otherBillId) {
                        const { data: otherBill } = await supabase.from('bills')
                            .select('status, preamble').eq('id', otherBillId).single();
                        if (otherBill && !['passed', 'failed', 'enacted'].includes(otherBill.status)) {
                            const cancelNote = '\n\nAutomatically cancelled — ratification failed in the other nation\'s parliament.';
                            await supabase.from('bills')
                                .update({ status: 'failed', preamble: (otherBill.preamble || '') + cancelNote })
                                .eq('id', otherBillId);
                        }
                    }

                    // Fire failure news event in both nations
                    try {
                        if (failedProposal.proposing_nation_id && failedProposal.target_nation_id) {
                            for (const nId of [failedProposal.proposing_nation_id, failedProposal.target_nation_id]) {
                                await supabase.rpc('insert_news_event', {
                                    p_nation_id: nId,
                                    p_trigger_key: 'major_initiative_ratification_failed',
                                    p_tick: currentTick,
                                    p_placeholders: {
                                        initiative_name: fpd.name || 'Diplomatic Initiative',
                                        failed_in: isProposerBill ? (fpd.proposer_nation_name || 'Proposer') : (fpd.target_nation_name || 'Target')
                                    }
                                });
                            }
                        }
                    } catch (newsErr) { console.error('News event error:', newsErr); }
                } else {
                    // Mark proposal as ratification_failed so FM can abandon or retry
                    await supabase.from('diplomatic_proposals')
                        .update({ status: 'ratification_failed' })
                        .eq('id', bill.diplomatic_proposal_id);
                }
                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
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

                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'trade_ratification', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                // Mark negotiation as ratification_failed
                await supabase.from('trade_negotiations')
                    .update({ status: 'ratification_failed' })
                    .eq('id', bill.trade_negotiation_id);
                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'trade_ratification', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'ratification' && bill.trade_agreement_data && bill.trade_agreement_data.type === 'retaliatory_tariff') {
            // Unilateral retaliatory tariff ratification
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                var rtData = bill.trade_agreement_data;
                var imposerId = rtData.imposer_nation_id;
                var targetId = rtData.target_nation_id;
                var isPermanent = rtData.duration_type === 'permanent';
                var durationTicks = rtData.duration_ticks || null;

                // Insert trade_agreement (retaliatory_tariff bypasses nation ordering constraint — imposer is always nation_a)
                await supabase.from('trade_agreements').insert({
                    nation_a_id: imposerId,
                    nation_b_id: targetId,
                    bill_a_id: bill.id,
                    agreement_type: 'retaliatory_tariff',
                    agreement_name: rtData.agreement_name || 'Retaliatory Tariff',
                    articles: rtData.articles || [],
                    duration_type: isPermanent ? 'permanent' : 'fixed',
                    duration_ticks: isPermanent ? null : durationTicks,
                    auto_renew: false,
                    withdrawal_notice_ticks: 1,
                    status: 'active',
                    enacted_at_tick: currentTick,
                    expires_at_tick: isPermanent ? null : (durationTicks ? currentTick + durationTicks : null)
                });

                // Apply relation_score penalty: -surcharge_pct / 2 (max surcharge across all sector articles)
                var maxSurcharge = 0;
                var articles = rtData.articles || [];
                for (var rti = 0; rti < articles.length; rti++) {
                    if (articles[rti].type === 'tariff_surcharge') {
                        maxSurcharge = Math.max(maxSurcharge, articles[rti].data.surcharge_pct || 0);
                    }
                }
                var relPenalty = Math.round(maxSurcharge / 2);

                if (relPenalty > 0) {
                    // Use canonical ordering for diplomatic_relations lookup
                    var relA = imposerId < targetId ? imposerId : targetId;
                    var relB = imposerId < targetId ? targetId : imposerId;
                    var { data: rel } = await supabase.from('diplomatic_relations')
                        .select('id, relation_score')
                        .eq('nation_a_id', relA).eq('nation_b_id', relB).maybeSingle();
                    if (rel) {
                        var newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) - relPenalty));
                        await supabase.from('diplomatic_relations')
                            .update({ relation_score: newScore }).eq('id', rel.id);
                    }
                }

                // Fire enactment event for target nation
                try {
                    var { data: imposerNation } = await supabase.from('nations').select('name').eq('id', imposerId).single();
                    var imposerName = imposerNation?.name || 'Unknown';
                    await supabase.from('event_log').insert({
                        nation_id: targetId,
                        event_name: 'Retaliatory Tariff Enacted',
                        trigger_key: 'sanctions_imposed',
                        category: 'Trade',
                        description_chosen: imposerName + ' has enacted a retaliatory tariff on your exports. Relations have decreased by ' + relPenalty + '.',
                        fired_at_tick: currentTick
                    });
                } catch (e) { /* non-blocking */ }

                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'retaliatory_tariff', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'retaliatory_tariff', earlyResolution: bill.early_resolution_status || null });
            }
        } else if (bill.bill_type === 'ratification' && bill.trade_agreement_data && bill.trade_agreement_data.type === 'impose_embargo') {
            // Unilateral embargo ratification
            if (passed) {
                await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

                var embData = bill.trade_agreement_data;
                var imposerId = embData.imposer_nation_id;
                var targetId = embData.target_nation_id;
                var durationTicks = embData.duration_ticks || 12;

                // Insert trade_agreement (impose_embargo: imposer = nation_a, target = nation_b)
                await supabase.from('trade_agreements').insert({
                    nation_a_id: imposerId,
                    nation_b_id: targetId,
                    bill_a_id: bill.id,
                    agreement_type: 'impose_embargo',
                    agreement_name: embData.agreement_name || 'Embargo',
                    articles: embData.articles || [],
                    duration_type: 'fixed',
                    duration_ticks: durationTicks,
                    auto_renew: false,
                    withdrawal_notice_ticks: 1,
                    status: 'active',
                    enacted_at_tick: currentTick,
                    expires_at_tick: currentTick + durationTicks
                });

                // Diplomatic penalty: 20 + 5 per embargoed sector (25 targeted, 30-45 partial, 50 total)
                var embargoedSectors = (embData.articles || []).filter(function(a) { return a.type === 'embargo_sector'; }).length;
                var relPenalty = Math.round(20 + embargoedSectors * 5);

                if (relPenalty > 0) {
                    var relA = imposerId < targetId ? imposerId : targetId;
                    var relB = imposerId < targetId ? targetId : imposerId;
                    var { data: rel } = await supabase.from('diplomatic_relations')
                        .select('id, relation_score')
                        .eq('nation_a_id', relA).eq('nation_b_id', relB).maybeSingle();
                    if (rel) {
                        var newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) - relPenalty));
                        await supabase.from('diplomatic_relations')
                            .update({ relation_score: newScore }).eq('id', rel.id);
                    }
                }

                // Fire enactment event for target nation
                try {
                    var { data: imposerNation } = await supabase.from('nations').select('name').eq('id', imposerId).single();
                    var imposerName = imposerNation?.name || 'Unknown';
                    await supabase.from('event_log').insert({
                        nation_id: targetId,
                        event_name: 'Embargo Enacted',
                        trigger_key: 'sanctions_imposed',
                        category: 'Trade',
                        description_chosen: imposerName + ' has imposed an embargo on your trade. Relations have decreased by ' + relPenalty + '.',
                        fired_at_tick: currentTick
                    });
                } catch (e) { /* non-blocking */ }

                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, type: 'impose_embargo', earlyResolution: bill.early_resolution_status || null });
            } else {
                await failBill(supabase, bill);
                await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, type: 'impose_embargo', earlyResolution: bill.early_resolution_status || null });
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
                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: (bill.bill_articles || []).length });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'president_desk', votesFor, votesAgainst, earlyResolution: bill.early_resolution_status || null });
            } else {
                // Wrap enactBill in try-catch to convert thrown exceptions into {success: false}
                let enactment;
                try {
                    enactment = await enactBill(supabase, bill, currentTick);
                } catch (enactErr) {
                    console.error(`[resolveExpiredVotes] enactBill threw for bill ${bill.id} ("${bill.bill_name}"):`, enactErr);
                    enactment = { success: false, error: `enactBill threw: ${enactErr?.message || enactErr}` };
                }
                if (!enactment?.success) {
                    await markBillEnactmentFailed(supabase, bill, currentTick, enactment?.error || 'Unknown enactment failure');
                    await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, billNameOverride: `${bill.bill_name} (enactment failed)` });
                    results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_enactment', votesFor, votesAgainst, error: enactment?.error, earlyResolution: bill.early_resolution_status || null });
                } else {
                    await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: (bill.bill_articles || []).length });
                    results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed', votesFor, votesAgainst, earlyResolution: bill.early_resolution_status || null });
                }
            }
        } else {
            await failBill(supabase, bill);
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed', votesFor, votesAgainst, earlyResolution: bill.early_resolution_status || null });
        }

        // Guardrail: resolved bills must not remain on the floor after this function.
        // If any branch forgets to persist status, fail closed so the bill leaves the active queue.
        try {
            const { data: persistedBill, error: persistedErr } = await supabase
                .from('bills')
                .select('id, status, voting_ends_tick')
                .eq('id', bill.id)
                .single();
            if (persistedErr) {
                throw new Error(`post-resolution read failed: ${persistedErr.message}`);
            }
            if (persistedBill && persistedBill.status === 'floor' && persistedBill.voting_ends_tick != null && persistedBill.voting_ends_tick <= currentTick) {
                throw new Error(`bill ${bill.id} remained on floor after resolution (voting_ends_tick=${persistedBill.voting_ends_tick}, tick=${currentTick})`);
            }
        } catch (persistCheckErr) {
            console.error('[resolveExpiredVotes] Persistence guard tripped:', persistCheckErr);
            throw persistCheckErr;
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

        // Caucus relationship updates after bill resolution
        try {
            const outcome = passed ? 'passed' : 'failed';
            await updateCaucusRelationships(supabase, bill.id, outcome);
        } catch (caucusRelErr) {
            console.error(`[resolveExpiredVotes] Caucus relationship update failed for bill ${bill.id}:`, caucusRelErr.message);
        }
      } catch (billErr) {
        // Per-bill error handler: prevents one bill's failure from blocking all others
        console.error(`[resolveExpiredVotes] UNHANDLED error processing bill ${bill.id} ("${bill.bill_name}"):`, billErr);
        try {
            await markBillEnactmentFailed(supabase, bill, currentTick, `Unhandled error: ${billErr?.message || billErr}`);
        } catch (_) {
            // Even the fallback failed — bill stays on floor, will retry next tick
            console.error(`[resolveExpiredVotes] Failed to mark bill ${bill.id} as failed after unhandled error`);
        }
        results.push({ billId: bill.id, billName: bill.bill_name, result: 'error', error: String(billErr) });
      }
    }

    return results;
}

/**
 * Safety net: catch any bills still stuck on the floor past their voting deadline.
 *
 * resolveExpiredVotes uses a multi-join query that can silently fail
 * (returning an error and early-returning []).  When that happens every bill
 * for the nation is skipped and stays on the floor forever.
 *
 * This function runs AFTER resolveExpiredVotes with deliberately simple
 * queries (no complex joins) so a single broken FK or query timeout cannot
 * block all bills.
 */
export async function resolveStuckFloorBills(supabase, nationId) {
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    // Simple query — no joins that can break
    const { data: stuckBills, error: stuckErr } = await supabase
        .from('bills')
        .select('id, bill_name, bill_type, nation_id, voting_ends_tick, quorum_failures')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .lte('voting_ends_tick', currentTick);

    if (stuckErr || !stuckBills || stuckBills.length === 0) return [];

    console.warn(`[resolveStuckFloorBills] nation=${nationId} found ${stuckBills.length} bills still on floor past deadline — resolving individually`);

    const { data: factionRows } = await supabase
        .from('factions')
        .select('seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');
    const factionSeatSum = (factionRows || []).reduce((sum, f) => sum + (f.seats || 0), 0);

    const { data: nation } = await supabase
        .from('nations')
        .select('name, government_type, total_seats')
        .eq('id', nationId)
        .single();
    const nominalTotalSeats = nation?.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const totalSeats = Math.min(nominalTotalSeats, Math.max(factionSeatSum, 1));

    const specialTypes = new Set(['no_confidence', 'foundational', 'default_resolution', 'veto_override', 'impeachment_motion', 'impeachment_conviction', 'ratification', 'minister_confirmation', 'ambassador_confirmation']);
    const results = [];

    for (const bill of stuckBills) {
      try {
        if (specialTypes.has(bill.bill_type)) {
            console.warn(`[resolveStuckFloorBills] Skipping special bill type "${bill.bill_type}" for bill ${bill.id} "${bill.bill_name}" — needs resolveExpiredVotes`);
            await failBill(supabase, bill);
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor: 0, votesAgainst: 0, extra: { reason: `safety net: special type ${bill.bill_type} could not be resolved normally` } });
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_safety_net', billType: bill.bill_type });
            continue;
        }

        // Load support data individually — simple query, no nested joins
        const { data: supportRows } = await supabase
            .from('bill_support')
            .select('faction_id, stance, seat_count')
            .eq('bill_id', bill.id);

        let votesFor = 0, votesAgainst = 0, votesAbstain = 0;
        (supportRows || []).forEach(s => {
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') votesFor += (s.seat_count || 0);
            else if (stance === 'no') votesAgainst += (s.seat_count || 0);
            else if (stance === 'abstain') votesAbstain += (s.seat_count || 0);
        });

        const resolveBill = {
            ...bill,
            votes_for: votesFor,
            votes_against: votesAgainst,
            votes_abstain: votesAbstain,
            quorum_failures: bill.quorum_failures || 0
        };
        const resolution = resolveBillVote(resolveBill, totalSeats);
        console.log(`[resolveStuckFloorBills] bill=${bill.id} "${bill.bill_name}" votes yes=${votesFor} no=${votesAgainst} abstain=${votesAbstain} totalSeats=${totalSeats} resolution=${resolution}`);

        if (resolution === 'deferred') {
            await supabase.from('bills').update({
                quorum_failures: (bill.quorum_failures || 0) + 1,
                voting_ends_tick: currentTick + 1
            }).eq('id', bill.id);
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'deferred' });
            continue;
        }

        if (resolution === 'failed_no_quorum') {
            await failBill(supabase, bill);
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, extra: { reason: 'quorum not met (safety net)' } });
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_no_quorum' });
            continue;
        }

        const passed = resolution === 'passed';
        if (passed) {
            if (isPresidentialRepublic(nation)) {
                await supabase.from('bills').update({
                    status: 'president_desk',
                    passed_tick: currentTick,
                    president_desk_deadline: currentTick + GAME_CONFIG.PRESIDENT_DESK_TICKS
                }).eq('id', bill.id);
                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'president_desk' });
            } else {
                // Load full bill data for enactment — use simplified join (no nested factions in bill_support)
                const { data: fullBill } = await supabase
                    .from('bills')
                    .select('*, factions(faction_name, ideology_value_1, ideology_value_2), bill_articles(*, policies(*)), bill_support(faction_id, stance, seat_count)')
                    .eq('id', bill.id)
                    .single();

                let enactment;
                try {
                    enactment = await enactBill(supabase, fullBill || bill, currentTick);
                } catch (enactErr) {
                    console.error(`[resolveStuckFloorBills] enactBill threw for bill ${bill.id}:`, enactErr);
                    enactment = { success: false, error: `enactBill threw: ${enactErr?.message || enactErr}` };
                }
                if (!enactment?.success) {
                    await markBillEnactmentFailed(supabase, bill, currentTick, enactment?.error || 'Unknown enactment failure (safety net)');
                    results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_enactment' });
                } else {
                    await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst });
                    results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed' });
                }
            }
        } else {
            await failBill(supabase, bill);
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed' });
        }
      } catch (billErr) {
        console.error(`[resolveStuckFloorBills] Error processing bill ${bill.id}:`, billErr);
        try {
            await markBillEnactmentFailed(supabase, bill, currentTick, `Safety net error: ${billErr?.message || billErr}`);
        } catch (_) {
            console.error(`[resolveStuckFloorBills] Failed to mark bill ${bill.id} as failed`);
        }
        results.push({ billId: bill.id, billName: bill.bill_name, result: 'error', error: String(billErr) });
      }
    }

    if (results.length > 0) {
        console.log(`[resolveStuckFloorBills] Resolved ${results.length} stuck bills for nation=${nationId}:`, JSON.stringify(results));
    }
    return results;
}

async function markBillEnactmentFailed(supabase, bill, currentTick, enactError) {
    const normalizedError = typeof enactError === 'string' ? enactError : 'Unknown enactment failure';
    const { error } = await supabase.from('bills').update({
        status: 'failed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    if (error) {
        console.error(`[markBillEnactmentFailed] Failed to mark bill ${bill.id} as failed:`, error.message);
    }
}

export async function enactBill(supabase, bill, currentTick) {
    let enactError = null;
    const logContext = {
        billId: bill?.id,
        billStatus: bill?.status,
        billNationId: bill?.nation_id,
        presidentFactionId: null
    };
    console.log('[enactBill] stage=preflight_context', logContext);

    console.log('[enactBill] stage=load_nation attempt', logContext);
    const { data: nation } = await supabase
        .from('nations')
        .select('*')
        .eq('id', bill.nation_id)
        .single();
    if (!nation) {
        console.error('[enactBill] stage=load_nation result=failed_nation_not_found', logContext);
        console.error('[enactBill] stage=terminal_result result=failed_nation_not_found', logContext);
        return { success: false, error: `Nation ${bill.nation_id} not found` };
    }
    console.log('[enactBill] stage=load_nation result=success', logContext);

    console.log('[enactBill] stage=load_active_laws attempt', logContext);
    const { data: currentActiveLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', bill.nation_id);
    console.log('[enactBill] stage=load_active_laws result=success', {
        ...logContext,
        activeLawCount: (currentActiveLaws || []).length
    });

    // ── Repeal bill handling ──
    if (bill.bill_type === 'repeal') {
        console.log('[enactBill] stage=repeal_bill attempt', logContext);
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
            } else if (repealResult.reason === 'clear_bill_references_failed' || repealResult.reason === 'clear_article_references_failed') {
                enactError = `Repeal target ${repealResult.targetLawId} FK cleanup failed: ${repealResult.error}`;
            } else {
                enactError = `Unknown repeal failure (${repealResult.reason})`;
            }
            console.error('[enactBill] stage=repeal_bill result=failed_enactment', {
                ...logContext,
                error: enactError,
                reason: repealResult.reason,
                targetLawId: repealResult.targetLawId || null
            });
            console.error('[enactBill] stage=terminal_result result=failed_enactment', {
                ...logContext,
                error: enactError
            });
            return { success: false, error: enactError, repealResult };
        }

        console.log('[enactBill] stage=repeal_bill result=success', {
            ...logContext,
            targetLawId: repealResult.targetLawId,
            policyName: repealResult.policyName
        });
    } else {
        const articles = (bill.bill_articles || []).filter(a => a.policy_id);

        for (const art of articles) {
            const policy = art.policies;
            if (!policy) continue;

            // Repeal article — reverse and delete the targeted active law
            if (art.repeal_active_law_id) {
                console.log('[enactBill] stage=repeal_article attempt', {
                    ...logContext,
                    articleId: art.id,
                    repealActiveLawId: art.repeal_active_law_id
                });
                const repealResult = await repealActiveLaw({
                    supabase,
                    nation,
                    currentTick,
                    currentActiveLaws,
                    reversePolicy,
                    article: art,
                });
                if (!repealResult.success) {
                    console.error('[enactBill] stage=repeal_article result=failed_enactment', {
                        ...logContext,
                        articleId: art.id,
                        reason: repealResult.reason,
                        targetLawId: repealResult.targetLawId || null
                    });
                } else {
                    console.log('[enactBill] stage=repeal_article result=success', {
                        ...logContext,
                        articleId: art.id,
                        targetLawId: repealResult.targetLawId,
                        policyName: repealResult.policyName
                    });
                }
                continue;
            }

            // Reverse any opposed policies — use fresh DB lookup instead of stale snapshot
            if (policy.opposed_policy_ids && Array.isArray(policy.opposed_policy_ids)) {
                for (const opposedId of policy.opposed_policy_ids) {
                    const { data: freshLaw } = await supabase.from('active_laws')
                        .select('id, policy_id, passed_tick, policies(*)')
                        .eq('nation_id', bill.nation_id)
                        .eq('policy_id', opposedId)
                        .maybeSingle();
                    if (freshLaw && freshLaw.policies) {
                        await reversePolicy(supabase, nation, freshLaw.policies, freshLaw.passed_tick, currentTick);
                    }
                }
            }

            // Clear FK references before upserting the new active_law
            const { data: existingActiveLaw } = await supabase.from('active_laws')
                .select('id')
                .eq('nation_id', bill.nation_id)
                .eq('policy_id', policy.id)
                .maybeSingle();
            if (existingActiveLaw) {
                await supabase.from('bills').update({ repeal_active_law_id: null }).eq('repeal_active_law_id', existingActiveLaw.id);
                await supabase.from('bill_articles').update({ repeal_active_law_id: null }).eq('repeal_active_law_id', existingActiveLaw.id);
            }
            console.log('[enactBill] stage=upsert_active_law attempt', {
                ...logContext,
                policyId: policy.id,
                policyName: policy.policy_name
            });
            const { error: activeLawError } = await supabase.from('active_laws')
                .upsert({
                    nation_id: bill.nation_id,
                    policy_id: policy.id,
                    passed_tick: currentTick,
                    proposed_by: bill.proposed_by,
                    effects_applied_through_tick: currentTick - 1
                }, { onConflict: 'nation_id,policy_id' });
            if (activeLawError) {
                console.error('[enactBill] stage=upsert_active_law result=rls_blocked', {
                    ...logContext,
                    policyId: policy.id,
                    policyName: policy.policy_name,
                    error: activeLawError.message
                });
                console.error('[enactBill] stage=terminal_result result=rls_blocked', {
                    ...logContext,
                    error: activeLawError.message
                });
                return { success: false, error: `Active law upsert failed for policy ${policy.policy_name || policy.id}: ${activeLawError.message}` };
            }
            console.log('[enactBill] stage=upsert_active_law result=success', {
                ...logContext,
                policyId: policy.id,
                policyName: policy.policy_name
            });
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
        } else if (typeof effect.target_stat === 'string' && typeof effect.delta === 'number') {
            // Backward compatibility: parse legacy stat_effect-like payloads
            const key = effect.target_stat.toLowerCase();
            const newRate = Math.max(0, Math.min(50, Number(effect.delta)));
            const taxKey = key === 'income_tax' ? 'income_tax'
                : key === 'sales_tax' ? 'sales_tax'
                    : key === 'corporate_tax' ? 'corporate_tax'
                        : null;
            if (taxKey) {
                taxUpdates[taxKey] = newRate;
                console.log(`[enactBill] Tax rate change (parsed): ${taxKey} → ${newRate}%`);
            }
        }
    }

    // Backward compat: parse tax changes from article text for bills filed before effect_data existed
    if (Object.keys(taxUpdates).length === 0) {
        for (const art of (bill.bill_articles || [])) {
            if (art.policy_id || art.effect_data) continue;
            const title = art.article_title || '';
            if (!title.endsWith('Rate Change')) continue;
            const text = art.article_text || '';
            const match = text.match(/change\s+(.+?)\s+from\s+(\d+(?:\.\d+)?)%?\s+to\s+(\d+(?:\.\d+)?)%/i);
            if (!match) continue;
            const taxName = match[1].trim();
            const newRate = Math.max(0, Math.min(50, Number(match[3])));
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
        console.log('[enactBill] stage=apply_tax_updates attempt', {
            ...logContext,
            taxUpdates
        });
        const { error: taxErr } = await supabase.from('nations')
            .update(taxUpdates)
            .eq('id', bill.nation_id);
        if (taxErr) {
            console.error('[enactBill] stage=apply_tax_updates result=rls_blocked', {
                ...logContext,
                error: taxErr.message
            });
            console.error('[enactBill] stage=terminal_result result=rls_blocked', {
                ...logContext,
                error: taxErr.message
            });
            return { success: false, error: `Tax rate update failed: ${taxErr.message}` };
        }
        console.log('[enactBill] stage=apply_tax_updates result=success', {
            ...logContext,
            taxUpdates
        });

        // ── Apply tax-change approval/momentum effects ──
        // These match the preview shown in the economy.html tax cards.
        if (bill.proposed_by) {
            for (const [taxKey, newRate] of Object.entries(taxUpdates)) {
                const oldRate = Number(nation[taxKey] ?? 0);
                const rateDiff = newRate - oldRate;
                if (rateDiff === 0) continue;

                if (taxKey === 'corporate_tax') {
                    // Legacy: corporate tax momentum on Business Owners bloc removed (adjustMomentum is now a no-op)
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

    // ── Apply funding articles (per-institution level changes & discretionary grants) ──
    for (const art of (bill.bill_articles || [])) {
        const fd = art.funding_data;
        if (!fd || !fd.ministry_key) continue;

        // Per-institution funding changes: update ministry funding_level + budget_item_allocations
        const instChanges = (fd.institutions || []).filter(i => i.proposed_pct !== i.current_pct);

        // Update the ministry-level funding_level as a weighted average
        if (instChanges.length > 0) {
            const allInst = fd.institutions || [];
            const avgPct = allInst.reduce((sum, i) => sum + i.proposed_pct, 0) / (allInst.length || 1);
            const newLevel = avgPct / 100;
            console.log('[enactBill] stage=update_ministry_funding attempt', {
                ...logContext,
                ministryKey: fd.ministry_key,
                newLevel
            });
            const { error: ministryFundingErr } = await supabase.from('ministries')
                .update({ funding_level: newLevel })
                .eq('nation_id', bill.nation_id)
                .eq('ministry_key', fd.ministry_key)
                .eq('is_active', true);
            if (ministryFundingErr) {
                console.error('[enactBill] stage=update_ministry_funding result=rls_blocked', {
                    ...logContext,
                    ministryKey: fd.ministry_key,
                    error: ministryFundingErr.message
                });
                console.error('[enactBill] stage=terminal_result result=rls_blocked', {
                    ...logContext,
                    error: ministryFundingErr.message
                });
                return { success: false, error: `Ministry funding update failed for ${fd.ministry_key}: ${ministryFundingErr.message}` };
            }
            console.log('[enactBill] stage=update_ministry_funding result=success', {
                ...logContext,
                ministryKey: fd.ministry_key,
                avgPercent: Math.round(avgPct)
            });

            // Upsert per-institution funding into budget_item_allocations
            // Uses proposed_pct as allocation_amount and 100 as needed_amount
            // so buildStatInstitutionMap computes fundingPct = (proposed_pct / 100) * 100 = proposed_pct
            for (const inst of allInst) {
                const { error: allocErr } = await supabase.from('budget_item_allocations')
                    .upsert({
                        bill_id: bill.id,
                        nation_id: bill.nation_id,
                        fiscal_category: fd.ministry_key,
                        item_type: 'institution',
                        item_id: inst.id,
                        item_name: inst.name,
                        allocation_amount: inst.proposed_pct,
                        needed_amount: 100
                    }, { onConflict: 'bill_id,item_type,item_id' });
                if (allocErr) {
                    console.error('[enactBill] stage=upsert_institution_allocation result=error', {
                        ...logContext,
                        institutionId: inst.id,
                        error: allocErr.message
                    });
                }
            }
            console.log('[enactBill] stage=upsert_institution_allocations result=success', {
                ...logContext,
                ministryKey: fd.ministry_key,
                institutionCount: allInst.length
            });
        }

        // Discretionary grant: add to national debt
        const grantAmount = Number(fd.discretionary) || 0;
        if (grantAmount > 0) {
            const newDebt = (Number(nation.debt) || 0) + grantAmount;
            console.log('[enactBill] stage=update_debt_for_grant attempt', {
                ...logContext,
                ministryKey: fd.ministry_key,
                grantAmount,
                newDebt
            });
            await supabase.from('nations').update({ debt: newDebt }).eq('id', bill.nation_id);
            nation.debt = newDebt;
            console.log('[enactBill] stage=update_debt_for_grant result=success', {
                ...logContext,
                ministryKey: fd.ministry_key,
                grantAmount,
                newDebt
            });
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

    console.log('[enactBill] stage=update_bill_status attempt', logContext);
    const { error: billUpdateErr } = await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    if (billUpdateErr) {
        console.error('[enactBill] stage=update_bill_status error=rls_blocked', {
            ...logContext,
            error: billUpdateErr.message
        });
        console.error('[enactBill] stage=terminal_result result=rls_blocked', {
            ...logContext,
            error: billUpdateErr.message
        });
        return { success: false, error: `Bill status update failed: ${billUpdateErr.message}` };
    }
    console.log('[enactBill] stage=update_bill_status result=success', logContext);

    // Legislative activity: boost gov_approval_events
    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');

    console.log('[enactBill] stage=terminal_result result=success', logContext);
    return { success: true };
}


export async function reversePolicy(supabase, nation, policy, passedTick, currentTick) {
    const ticksActive = currentTick - (passedTick || 0);
    if (ticksActive <= 0) {
        console.log(`[reversePolicy] Skipping reversal for ${policy.policy_name || policy.id}: ticksActive=${ticksActive} (enacted same tick)`);
        return;
    }

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

    // Clear FK references to any existing row before upserting the reversal.
    const { data: existingLaw } = await supabase.from('active_laws')
        .select('id')
        .eq('nation_id', nation.id)
        .eq('policy_id', policy.id)
        .maybeSingle();

    if (existingLaw) {
        await supabase.from('bills').update({ repeal_active_law_id: null }).eq('repeal_active_law_id', existingLaw.id);
        await supabase.from('bill_articles').update({ repeal_active_law_id: null }).eq('repeal_active_law_id', existingLaw.id);
    }

    // Upsert instead of delete+insert to avoid duplicate key errors from race
    // conditions, stale snapshots, or partially-completed previous ticks.
    const { error: reversalInsertError } = await supabase.from('active_laws')
        .upsert({
            nation_id: nation.id,
            policy_id: policy.id,
            passed_tick: currentTick,
            proposed_by: null,
            effects_applied_through_tick: currentTick - 1,
            is_reversal: true,
            reversal_effects: reversalEffects
        }, { onConflict: 'nation_id,policy_id' });
    if (reversalInsertError) {
        console.error(`[reversePolicy] Failed to upsert reversal active_law for policy ${policy.id}:`, reversalInsertError.message);
    }
}

// ==================== FOUNDATIONAL BILL ENACTMENT ====================

export async function enactFoundationalBill(supabase, bill, currentTick) {
    // ── Presidential Term Length subtype ──
    if (bill.proposed_term_length != null) {
        const newTermTicks = bill.proposed_term_length;
        const validOptions = GAME_CONFIG.TERM_LENGTH_OPTIONS || [24, 36, 48, 60, 72, 84];
        if (!validOptions.includes(newTermTicks)) {
            console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_term_length: ${newTermTicks}. Marking as failed.`);
            await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.id);
            return false;
        }

        // Check if a presidential election is imminent (within TERM_LENGTH_DEFER_WINDOW ticks)
        const deferWindow = GAME_CONFIG.TERM_LENGTH_DEFER_WINDOW || 10;
        const { data: imminentElection } = await supabase
            .from('elections')
            .select('id, election_tick')
            .eq('nation_id', bill.nation_id)
            .eq('election_type', 'presidential')
            .eq('status', 'scheduled')
            .gt('election_tick', currentTick)
            .lte('election_tick', currentTick + deferWindow)
            .limit(1)
            .maybeSingle();

        // Get current nation data BEFORE update (for stat effect comparison)
        const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();
        const oldTermTicks = getPresidentialTermTicks(nation);
        const ticksPerYear = GAME_CONFIG.TICKS_PER_YEAR || 12;

        // Mark bill as passed
        const { error: billErr } = await supabase.from('bills').update({
            status: 'passed',
            passed_tick: currentTick
        }).eq('id', bill.id);
        if (billErr) {
            console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message);
            return false;
        }

        // Update nation's presidential_term_ticks
        const { error: nationErr } = await supabase.from('nations').update({
            presidential_term_ticks: newTermTicks
        }).eq('id', bill.nation_id);
        if (nationErr) {
            console.error(`[enactFoundationalBill] Failed to update presidential_term_ticks for nation ${bill.nation_id}:`, nationErr.message);
        }

        // Apply mechanical effects based on whether terms got shorter or longer
        if (newTermTicks < oldTermTicks) {
            // Shortening terms — more elections, more polarization & engagement
            const newPol = Math.min(100, (nation?.polarization || 0) + 2);
            const newEng = Math.min(100, (nation?.political_engagement || 0) + 3);
            const { error: shortErr } = await supabase.from('nations').update({
                polarization: newPol,
                political_engagement: newEng
            }).eq('id', bill.nation_id);
            if (shortErr) console.error(`[enactFoundationalBill] Term shortened stat update failed:`, shortErr.message);
            else console.log(`[enactFoundationalBill] Term shortened: polarization +2, political_engagement +3`);
        } else if (newTermTicks > oldTermTicks) {
            // Extending terms — less accountability, more stability
            const newLegitimacy = Math.max(0, (nation?.legitimacy || 50) - 3);
            const newStability = Math.min(100, (nation?.stability || 50) + 2);
            const { error: extErr } = await supabase.from('nations').update({
                legitimacy: newLegitimacy,
                stability: newStability
            }).eq('id', bill.nation_id);
            if (extErr) console.error(`[enactFoundationalBill] Term extended stat update failed:`, extErr.message);
            else console.log(`[enactFoundationalBill] Term extended: legitimacy -3, stability +2`);
        }

        // If no imminent election, reschedule the next presidential election with the new term length
        if (!imminentElection) {
            // Find the active president to calculate when their term should end
            const { data: activePresident } = await supabase
                .from('presidents')
                .select('elected_tick')
                .eq('nation_id', bill.nation_id)
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

            if (activePresident) {
                // Ensure the new term end is in the future (if shortening makes it past, schedule next tick)
                const newTermEnd = Math.max(currentTick + 1, activePresident.elected_tick + newTermTicks);
                // Update the scheduled presidential election to reflect new term length
                const { data: futureElection } = await supabase
                    .from('elections')
                    .select('id')
                    .eq('nation_id', bill.nation_id)
                    .eq('election_type', 'presidential')
                    .eq('status', 'scheduled')
                    .gt('election_tick', currentTick)
                    .order('election_tick', { ascending: true })
                    .limit(1)
                    .maybeSingle();

                if (futureElection) {
                    const { error: reschedErr } = await supabase.from('elections').update({
                        election_tick: newTermEnd
                    }).eq('id', futureElection.id);
                    if (reschedErr) console.error(`[enactFoundationalBill] Failed to reschedule election:`, reschedErr.message);
                    else console.log(`[enactFoundationalBill] Rescheduled presidential election to tick ${newTermEnd}`);
                }
            }
        } else {
            console.log(`[enactFoundationalBill] Presidential election imminent (tick ${imminentElection.election_tick}), term length change deferred to next cycle.`);
        }

        const newYears = newTermTicks / ticksPerYear;
        console.log(`[enactFoundationalBill] Nation ${bill.nation_id} presidential term set to ${newYears} years (${newTermTicks} ticks).`);
        return true;
    }

    // ── Presidential Term Limits subtype ──
    if (bill.proposed_term_limit != null) {
        const newTermLimit = bill.proposed_term_limit;
        const validOptions = GAME_CONFIG.TERM_LIMIT_OPTIONS || [0, 1, 2, 3, 4];
        if (!validOptions.includes(newTermLimit)) {
            console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_term_limit: ${newTermLimit}. Marking as failed.`);
            await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.id);
            return false;
        }

        // Mark bill as passed
        const { error: billErr } = await supabase.from('bills').update({
            status: 'passed',
            passed_tick: currentTick
        }).eq('id', bill.id);
        if (billErr) {
            console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message);
            return false;
        }

        // Get current nation data for comparison (BEFORE update)
        const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();
        const oldEffectiveLimit = getPresidentialTermLimit(nation); // null = no limits, number = limit
        const isAutocratic = nation?.government_type?.toLowerCase().includes('autocra');

        // Update nation's presidential_term_limit
        const { error: nationErr } = await supabase.from('nations').update({
            presidential_term_limit: newTermLimit
        }).eq('id', bill.nation_id);
        if (nationErr) {
            console.error(`[enactFoundationalBill] Failed to update presidential_term_limit for nation ${bill.nation_id}:`, nationErr.message);
        }

        // Get active president for context
        const { data: activePresident } = await supabase
            .from('presidents')
            .select('terms_served, faction_id')
            .eq('nation_id', bill.nation_id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        // Apply mechanical effects
        if (newTermLimit === 0) {
            // Removing term limits
            let legitimacyPenalty = isAutocratic ? 10 : 6;
            const newLegitimacy = Math.max(0, (nation?.legitimacy || 50) - legitimacyPenalty);
            const newUnrest = Math.min(100, (nation?.civil_unrest || 0) + 4);
            const updates = {
                legitimacy: newLegitimacy,
                civil_unrest: newUnrest
            };
            // (regime_health effect removed — Phase 0)
            const { error: removeErr } = await supabase.from('nations').update(updates).eq('id', bill.nation_id);
            if (removeErr) console.error(`[enactFoundationalBill] Failed to update stats for term limit removal:`, removeErr.message);

            // Opposition parties gain momentum
            const { data: allFactions } = await supabase
                .from('factions')
                .select('id')
                .eq('nation_id', bill.nation_id)
                .eq('faction_type', 'party')
                .neq('id', bill.proposed_by);

            if (allFactions) {
                for (const faction of allFactions) {
                    await adjustMomentumAll(supabase, bill.nation_id, faction.id, 8, 'term_limits_removed');
                }
            }

            // Extra polarization if sitting president has served 2+ terms
            if (activePresident && (activePresident.terms_served || 1) >= 2) {
                const newPol = Math.min(100, (nation?.polarization || 0) + 10);
                const { error: polErr } = await supabase.from('nations').update({ polarization: newPol }).eq('id', bill.nation_id);
                if (polErr) console.error(`[enactFoundationalBill] Polarization update failed:`, polErr.message);
                else console.log(`[enactFoundationalBill] Sitting president has ${activePresident.terms_served} terms — polarization +10`);
            }

            console.log(`[enactFoundationalBill] Term limits removed: legitimacy -${legitimacyPenalty}, civil_unrest +4, opposition momentum +8`);
        } else if (oldEffectiveLimit === null || newTermLimit < oldEffectiveLimit) {
            // Adding or tightening term limits
            const newLegitimacy = Math.min(100, (nation?.legitimacy || 50) + 5);
            const newPressFreedom = Math.min(100, (nation?.press_freedom || 50) + 2);
            const newJudicialInd = Math.min(100, (nation?.judicial_independence || 50) + 2);
            const { error: tightenErr } = await supabase.from('nations').update({
                legitimacy: newLegitimacy,
                press_freedom: newPressFreedom,
                judicial_independence: newJudicialInd
            }).eq('id', bill.nation_id);
            if (tightenErr) console.error(`[enactFoundationalBill] Term limits tighten stat update failed:`, tightenErr.message);
            else console.log(`[enactFoundationalBill] Term limits tightened to ${newTermLimit}: legitimacy +5, press_freedom +2, judicial_independence +2`);
        }

        const limitText = newTermLimit === 0 ? 'No Term Limits' : `${newTermLimit} Term${newTermLimit !== 1 ? 's' : ''}`;
        console.log(`[enactFoundationalBill] Nation ${bill.nation_id} presidential term limit set to: ${limitText}.`);
        return true;
    }

    // ── Head of State Election Method subtype ──
    if (bill.proposed_hos_election_method) {
        const newMethod = bill.proposed_hos_election_method;
        const validMethods = ['direct_vote', 'appointed', 'hereditary'];
        if (!validMethods.includes(newMethod)) {
            console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_hos_election_method: ${newMethod}. Marking as failed.`);
            await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.id);
            return false;
        }

        // Mark bill as passed
        const { error: billErr } = await supabase.from('bills').update({
            status: 'passed',
            passed_tick: currentTick
        }).eq('id', bill.id);
        if (billErr) {
            console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message);
            return false;
        }

        // Get current nation data
        const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();

        // Update nation's hos_election_method and dynasty fields
        const nationUpdate = { hos_election_method: newMethod };
        if (newMethod === 'hereditary') {
            nationUpdate.dynasty_name = bill.proposed_dynasty_name || 'Royal House';
            nationUpdate.dynasty_established_tick = currentTick;
            if (bill.proposed_dynasty_crest_url) {
                nationUpdate.dynasty_crest_url = bill.proposed_dynasty_crest_url;
            }
            // Generate a new monarch: random first name, dynasty last name, age 36-60
            const { firstNames } = getNationNames(nation?.name);
            const monarchFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const dynastyLastName = (bill.proposed_dynasty_name || 'Royal').split(/\s+/).pop(); // Use last word of dynasty name
            const monarchAge = 36 + Math.floor(Math.random() * 25); // 36-60
            nationUpdate.head_of_state_first_name = monarchFirstName;
            nationUpdate.head_of_state_last_name = dynastyLastName;
            nationUpdate.head_of_state_age = monarchAge;
            // Set King or Queen based on the generated monarch's name
            nationUpdate.head_of_state_title = isFemaleName(monarchFirstName) ? 'Queen' : 'King';
        }

        const { error: nationErr } = await supabase.from('nations').update(nationUpdate).eq('id', bill.nation_id);
        if (nationErr) {
            console.error(`[enactFoundationalBill] Failed to update hos_election_method for nation ${bill.nation_id}:`, nationErr.message);
        }

        // Apply mechanical effects based on method
        if (newMethod === 'hereditary') {
            // Constitutional monarchy: stability +5, legitimacy -5
            const newStability = Math.min(100, (nation?.stability || 50) + 5);
            const newLegitimacy = Math.max(0, (nation?.legitimacy || 50) - 5);
            const { error: statErr } = await supabase.from('nations').update({
                stability: newStability,
                legitimacy: newLegitimacy
            }).eq('id', bill.nation_id);
            if (statErr) console.error(`[enactFoundationalBill] Hereditary stat update failed:`, statErr.message);
            else console.log(`[enactFoundationalBill] Constitutional monarchy established: stability +5, legitimacy -5`);
        } else if (newMethod === 'direct_vote') {
            // Direct vote: legitimacy +3, political_engagement +3, polarization +2
            const newLegitimacy = Math.min(100, (nation?.legitimacy || 50) + 3);
            const newEngagement = Math.min(100, (nation?.political_engagement || 50) + 3);
            const newPolarization = Math.min(100, (nation?.polarization || 0) + 2);
            const { error: statErr } = await supabase.from('nations').update({
                legitimacy: newLegitimacy,
                political_engagement: newEngagement,
                polarization: newPolarization
            }).eq('id', bill.nation_id);
            if (statErr) console.error(`[enactFoundationalBill] Direct vote stat update failed:`, statErr.message);
            else console.log(`[enactFoundationalBill] Direct HoS vote established: legitimacy +3, political_engagement +3, polarization +2`);
        }
        // Appointed: no stat changes (it's the default low-friction option)

        const methodLabels = { direct_vote: 'Direct Popular Vote', appointed: 'Appointed by Parliament', hereditary: 'Constitutional Monarchy' };
        console.log(`[enactFoundationalBill] Nation ${bill.nation_id} HoS election method set to "${methodLabels[newMethod]}".`);
        return true;
    }

    // ── Head of State Title subtype ──
    if (bill.proposed_hos_title) {
        const newTitle = bill.proposed_hos_title.trim();
        if (!newTitle) {
            console.warn(`[enactFoundationalBill] Bill ${bill.id} has empty proposed_hos_title. Marking as failed.`);
            await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.id);
            return false;
        }

        const { error: billErr } = await supabase.from('bills').update({
            status: 'passed',
            passed_tick: currentTick
        }).eq('id', bill.id);
        if (billErr) {
            console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message);
            return false;
        }

        const { error: nationErr } = await supabase.from('nations').update({
            head_of_state_title: newTitle
        }).eq('id', bill.nation_id);
        if (nationErr) {
            console.error(`[enactFoundationalBill] Failed to update HoS title for nation ${bill.nation_id}:`, nationErr.message);
        }

        console.log(`[enactFoundationalBill] Nation ${bill.nation_id} HoS title set to "${newTitle}".`);
        return true;
    }

    // ── Electoral Makeup subtype ──
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

    // Legislative activity: boost gov_approval_events
    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');

    return true;
}

export async function failBill(supabase, bill) {
    const { error } = await supabase.from('bills').update({
        status: 'failed'
    }).eq('id', bill.id);
    if (error) {
        console.error(`[failBill] Failed to mark bill ${bill.id} as failed:`, error.message);
    }
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

async function syncFailedAmbassadorConfirmationBill(supabase, bill) {
    if (!bill || bill.bill_type !== 'confirmation' || !bill.ambassador_id) return;

    const { error } = await supabase
        .from('ambassadors')
        .update({
            status: 'rejected',
            is_active: false
        })
        .eq('id', bill.ambassador_id);

    if (error) {
        console.warn('[syncFailedAmbassadorConfirmationBill] Failed to reject ambassador:', error.message);
    }
}

async function syncFailedMinisterConfirmationBill(supabase, bill) {
    if (!bill || bill.bill_type !== 'minister_confirmation' || !bill.ministry_key) return;

    const { data: ministry, error: fetchErr } = await supabase
        .from('ministries')
        .select('id')
        .eq('nation_id', bill.nation_id)
        .eq('ministry_key', bill.ministry_key)
        .eq('is_active', true)
        .maybeSingle();

    if (fetchErr) {
        console.warn('[syncFailedMinisterConfirmationBill] Failed to fetch ministry row:', fetchErr.message);
        return;
    }
    if (!ministry) return;

    const { error: updateErr } = await supabase
        .from('ministries')
        .update({
            confirmation_status: 'rejected',
            pending_minister: null
        })
        .eq('id', ministry.id);

    if (updateErr) {
        console.warn('[syncFailedMinisterConfirmationBill] Failed to clear pending minister:', updateErr.message);
    }
}

export async function syncMinistriesForFailedConfirmationBills(supabase, failedBills) {
    if (!Array.isArray(failedBills) || failedBills.length === 0) return;

    for (const bill of failedBills) {
        await syncFailedMinisterConfirmationBill(supabase, bill);
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
                    trigger_key: 'diplomatic_initiative_rejected',
                    category: 'Diplomatic',
                    description_chosen: `${nation.name}'s ambassador has retired. ${lapsedProposals.length} pending negotiation(s) have lapsed. The new ambassador may re-propose if desired.`,
                    fired_at_tick: currentTick
                });
            }

            // 3. Generate replacement ambassador
            const { firstNames: ambFirstPool, lastNames: ambLastPool } = getNationNames(nation.name);
            let newFirst, newLast;
            do { newFirst = ambFirstPool[Math.floor(Math.random() * ambFirstPool.length)]; }
            while (newFirst === amb.ambassador_first_name);
            do { newLast = ambLastPool[Math.floor(Math.random() * ambLastPool.length)]; }
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
