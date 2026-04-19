/**
 * bills.js — Bill support, vote tallies, ideology shifts, resolution engine, foundational bills
 * Extracted from game-common.js
 */

import { GAME_CONFIG, initGameConfigForNation, getPresidentialTermTicks, getPresidentialTermLimit } from './config.js';
import { hasElectedPresident, getCurrentConstitutionalSystem, MINISTRY_OFFICE_NAMES } from './government-types.js';
import { DIPLOMACY_CONFIG, RAW_SCALING_DIVISORS } from './diplomacy-constants.js';
import { IDEOLOGY_AXES, IDEOLOGY_TO_AXIS, extractAxisScores, loadFactionIdeology, loadNationIdeologies } from './ideology.js';
import { adjustGovernmentApprovalEvent, adjustCredibility, round2 } from './momentum.js';
import { computeCorpValuation } from './corp-valuation.js';
import { MINISTER_APPROVAL_CONFIG, buildMinistryBaselines } from './stats.js';

import { fetchActiveCoalition } from './government-structure.js';
import { resolveNoConfidence } from './elections.js';
import { getNationNames, isFemaleName, installHOG } from './political-actions.js';
import { allocateSeatsByVotes } from './election-simulation.js';
import { repealActiveLaw } from './repeal-helper.js';
import { fireBillEvent } from './event-helpers.js';
import { calculateCaucusDispositions, calculateCaucusVoteAdjustment, updateCaucusRelationships } from './caucus.js';

const _BILL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
function _billTickToDate(tick) {
    if (tick == null) return null;
    return `${_BILL_MONTHS[tick % 12]}, ${2000 + Math.floor(tick / 12)}`;
}

async function _logAdministrationIntegrityIssue(supabase, nationId, contextLabel) {
    const [{ data: openRows }, { data: missingEndedTickRows }] = await Promise.all([
        supabase.from('administrations').select('id').eq('nation_id', nationId).is('ended_at_tick', null),
        supabase.from('administrations').select('id').eq('nation_id', nationId).not('ended_at_date', 'is', null).is('ended_at_tick', null)
    ]);

    if ((openRows || []).length !== 1 || (missingEndedTickRows || []).length > 0) {
        console.warn('[enactFoundationalBill] administration integrity check warning', {
            context: contextLabel,
            nation_id: nationId,
            open_count: (openRows || []).length,
            open_admin_ids: (openRows || []).map(r => r.id),
            ended_missing_tick_ids: (missingEndedTickRows || []).map(r => r.id)
        });
    }
}

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


// ==================== BILL COST TOTALS ====================

/**
 * Scale a policy's raw cost by its scaling stat. Mirrors bill.html's
 * scalePolicyCost() so every surface that displays bill totals converges.
 */
function _scalePolicyCost(baseCost, scalingStat, nation) {
    if (!scalingStat || !nation || nation[scalingStat] === undefined) return baseCost;
    const statVal = Number(nation[scalingStat]) || 1;
    const divisor = RAW_SCALING_DIVISORS?.[scalingStat] || 50;
    return baseCost * (statVal / divisor);
}

/**
 * Sum upfront + ongoing cost across a bill's articles.
 *
 * Returns { upfront, ongoingMonthly, ongoingYearly }. ongoingMonthly is
 * per-tick (1 tick = 1 month); ongoingYearly = ongoingMonthly × 12.
 *
 * Article handling (matches bill.html's per-article render):
 *   1. Funding-data (BUDGET): fd.discretionary → upfront,
 *      Σ institutions[].base_cost × (toPct - fromPct)/100 → monthly ongoing.
 *   2. Repeal: subtract the repealed policy's scaled ongoing (negative
 *      monthly) — repealing saves what the law was spending.
 *   3. Policy: scaled upfront_cost + scaled (ongoing_cost_per_tick ||
 *      ongoing_base_cost).
 *   4. Text / entrenchment / anything without a policies join: zero.
 */
export function computeBillCostTotals(bill, nation) {
    const articles = bill?.bill_articles || [];
    let upfront = 0;
    let ongoingMonthly = 0;

    for (const art of articles) {
        // (1) Funding-data (BUDGET) article
        const fd = art.funding_data;
        if (fd) {
            upfront += Number(fd.discretionary || 0);
            for (const inst of (fd.institutions || [])) {
                const fromPct = Number(inst.current_pct || 0);
                const toPct = Number(inst.proposed_pct || 0);
                if (fromPct === toPct) continue;
                const baseCost = Number(inst.base_cost || 0);
                ongoingMonthly += ((toPct - fromPct) / 100) * baseCost;
            }
            continue;
        }

        const p = art.policies;
        if (!p) continue; // text-only / entrenchment / missing join

        // (2) Repeal article — saves the repealed law's ongoing cost
        if (art.repeal_active_law_id) {
            const onCost = _scalePolicyCost(p.ongoing_cost_per_tick || p.ongoing_base_cost || 0, p.ongoing_scaling_stat, nation);
            ongoingMonthly -= onCost;
            continue;
        }

        // (3) Policy article
        upfront += _scalePolicyCost(p.upfront_cost || 0, p.upfront_scaling_stat, nation);
        ongoingMonthly += _scalePolicyCost(p.ongoing_cost_per_tick || p.ongoing_base_cost || 0, p.ongoing_scaling_stat, nation);
    }

    return { upfront, ongoingMonthly, ongoingYearly: ongoingMonthly * 12 };
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

// No-op: enactment no longer awards momentum.
export async function applyEnactmentApproval() { }


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
 * - Party approval: -1d3 (1-3)
 * - Visibility: -5
 * - Credibility: -5 (i.e. -0.05 on the modifier)
 *
 * @param {object} supabase
 * @param {object} bill - Full bill row with bill_articles (with policies) and bill_support
 * @param {string} nationId
 */
export async function applyNoVotePenalty(supabase, bill, nationId, currentTick = 0) {
    const VISIBILITY_PENALTY = -5;
    const CREDIBILITY_PENALTY = -0.05; // -5 on the 0-100 display scale

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

    // 4. Apply penalties to each non-voter
    const penalized = [];
    for (const faction of nonVoters) {
        // Flat -2 momentum for not voting
        await supabase.rpc('adjust_momentum', {
            p_faction_id: faction.id, p_delta: -2,
            p_label: 'Absent from vote (-2)', p_tick: currentTick || 0
        });

        // Visibility and credibility writes removed — 3-pillar election system.
        // No-vote penalty is handled server-side via adjustFactionMomentum.

        penalized.push({
            factionId: faction.id,
            factionName: faction.faction_name,
            approvalLoss,
            visibilityLoss: VISIBILITY_PENALTY,
            credibilityLoss: VISIBILITY_PENALTY,
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
 * Legacy bloc-weighted approval recalculation (no longer used).
 * Approval is now tracked in faction_electoral_standing.party_approval.
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

        // Build YES and NO voter sets (normalize committee stances)
        const yesVoters = new Set();
        const noVoters = new Set();
        for (const s of (bill.bill_support || [])) {
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') yesVoters.add(s.faction_id);
            else if (stance === 'no') noVoters.add(s.faction_id);
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

            // -4 for voting NO (opposite direction)
            for (const factionId of noVoters) {
                addShift(factionId, mapping.axisKey, -4 * mapping.direction * diminish);
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
            const normalizedScore = Math.round(oldScore + shift);
            const newScore = Math.max(-100, Math.min(100, normalizedScore));
            if (newScore !== oldScore) {
                updateObj[axisKey] = newScore;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            const { error: updateErr } = await supabase
                .from('faction_ideology')
                .update(updateObj)
                .eq('faction_id', factionId);

            if (updateErr) {
                console.error(`[processIdeologyShifts] update failed for faction ${factionId}`, {
                    faction_id: factionId,
                    payload: updateObj,
                    error: updateErr.message
                });
                continue;
            }

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
 *   ±11–49 → 0.5/tick, ±50–100 → 1/tick
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

            const absDecay = Math.abs(score) >= 50 ? 1 : 0.5;
            // Round to int — smallint columns reject decimals like 28.5
            const newScore = Math.round(score > 0
                ? Math.max(0, score - absDecay)
                : Math.min(0, score + absDecay));

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
 * Single source of truth for bill-type threshold categorization.
 *
 * Every path that asks "is this bill type X/Y/Z?" — getRequiredSeats,
 * isSimpleMajorityBill, evaluateBillVote, resolveBillVote, resolveExpiredVotes,
 * and any future resolver — routes through getBillTypeSpec() and the named
 * predicates below. Bill types not listed here (ordinary, ratification,
 * confirmation, minister_confirmation, etc.) fall through to 'simple'
 * threshold with quorum.
 *
 * Kinds:
 *   'supermajority' — 2/3 of TOTAL_SEATS (foundational, default_resolution,
 *                     impeachment_conviction). Nation flags may raise/lower
 *                     this in the evaluate/resolve functions; the registry
 *                     owns the default.
 *   'veto_override' — VETO_OVERRIDE_THRESHOLD of TOTAL_SEATS (currently 2/3
 *                     but kept distinct from 'supermajority' so the two can
 *                     diverge without a registry rewrite).
 *   'absolute'      — Math.floor(TOTAL_SEATS / 2) + 1 (no_confidence,
 *                     impeachment_motion). No quorum. Nation flags may raise.
 *   'simple'        — YES > NO of votes cast, with 50% participation quorum.
 *                     Default for unlisted bill types.
 */
const BILL_TYPE_SPECS = Object.freeze({
    foundational:           { threshold: 'supermajority' },
    default_resolution:     { threshold: 'supermajority' },
    veto_override:          { threshold: 'veto_override' },
    impeachment_conviction: { threshold: 'supermajority' },
    no_confidence:          { threshold: 'absolute' },
    impeachment_motion:     { threshold: 'absolute' },
});

/**
 * Look up the threshold spec for a bill type. Unlisted types return
 * { threshold: 'simple' } — covers ordinary, ratification, confirmation,
 * minister_confirmation, etc.
 */
export function getBillTypeSpec(billType) {
    return BILL_TYPE_SPECS[billType] || { threshold: 'simple' };
}

/** foundational / default_resolution / veto_override / impeachment_conviction */
export function isSupermajorityBill(billType) {
    const k = getBillTypeSpec(billType).threshold;
    return k === 'supermajority' || k === 'veto_override';
}

/** no_confidence / impeachment_motion */
export function isAbsoluteMajorityBill(billType) {
    return getBillTypeSpec(billType).threshold === 'absolute';
}

/**
 * Returns true if this bill type uses quorum + simple majority (YES > NO of
 * votes cast) rather than an absolute seat threshold. Default for every
 * bill type not in BILL_TYPE_SPECS.
 */
export function isSimpleMajorityBill(billType) {
    return getBillTypeSpec(billType).threshold === 'simple';
}

/**
 * Get the number of YES seats required for a bill to pass.
 *
 * For supermajority / veto_override bills the threshold is a fixed
 * fraction of TOTAL_SEATS.
 * For absolute-majority bills (no_confidence, impeachment_motion) the
 * threshold is floor(TOTAL_SEATS / 2) + 1.
 * For simple-majority bills the rule is YES > NO — with votesAgainst
 * supplied we return votesAgainst + 1 so the display updates live; without
 * it we fall back to MAJORITY_SEATS for backward compat.
 */
export function getRequiredSeats(billType, votesAgainst) {
    const spec = getBillTypeSpec(billType);
    if (spec.threshold === 'supermajority')
        return Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.SUPERMAJORITY_THRESHOLD);
    if (spec.threshold === 'veto_override')
        return Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD);
    if (spec.threshold === 'absolute')
        return Math.floor(GAME_CONFIG.TOTAL_SEATS / 2) + 1;
    // simple majority of votes cast
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
 * @param {object} [nationFlags] - Optional nation flags affecting thresholds
 * @param {boolean} [nationFlags.judicial_appointment_politicization] - If true, raises impeachment conviction to 75% and no confidence to 60%
 */
export function evaluateBillVote(bill, totalSeats, nationFlags = {}) {
    const forSeats = bill.votes_for || 0;
    const againstSeats = bill.votes_against || 0;
    const abstainSeats = bill.votes_abstain || 0;
    const participating = forSeats + againstSeats + abstainSeats;
    const undeclaredSeats = totalSeats - participating;
    // Legislative Quorum Reform: use override if active (40/30/25%), else default 50%
    const quorumPct = (nationFlags.legislative_quorum_override > 0) ? (nationFlags.legislative_quorum_override / 100) : GAME_CONFIG.QUORUM_THRESHOLD;
    const quorumThreshold = Math.ceil(totalSeats * quorumPct);
    const judicialPoliticized = !!nationFlags.judicial_appointment_politicization;

    // ── Entrenchment clause: elevates ordinary bills to supermajority thresholds ──
    if (bill.entrenchment_tier && bill.bill_type !== 'foundational') {
        let ratio;
        if (bill.entrenchment_tier === 'protected') ratio = GAME_CONFIG.PROTECTED_THRESHOLD; // 60%
        else ratio = GAME_CONFIG.SUPERMAJORITY_THRESHOLD; // 67% for entrenched & enshrined
        const threshold = Math.ceil(totalSeats * ratio);
        if (forSeats >= threshold) {
            return { status: 'will_pass', reason: 'supermajority_reached', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating, entrenchmentTier: bill.entrenchment_tier };
        }
        if (forSeats + undeclaredSeats < threshold) {
            return { status: 'will_fail', reason: 'supermajority_impossible', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating, entrenchmentTier: bill.entrenchment_tier };
        }
        return { status: 'pending', reason: 'supermajority_in_progress', thresholdNeeded: threshold, neededFor: threshold - forSeats, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating, entrenchmentTier: bill.entrenchment_tier };
    }

    // ── Foundational / default_resolution / veto_override / impeachment_conviction: supermajority, no quorum ──
    if (isSupermajorityBill(bill.bill_type)) {
        // Determine supermajority ratio:
        // - Impeachment conviction + judicial politicization: 75%
        // - Foundational + constitutional streamlining active (but NOT the streamlining bill itself): 55%
        // - Everything else: 67%
        let ratio = 2 / 3; // default 67%
        if (bill.bill_type === 'impeachment_conviction' && judicialPoliticized) {
            ratio = 0.75;
        } else if (bill.bill_type === 'foundational' && nationFlags.constitutional_amendment_streamlining
                   && !bill.proposed_constitutional_amendment_streamlining) {
            ratio = 0.55; // streamlining active, and this isn't the streamlining bill itself
        }
        const threshold = Math.ceil(totalSeats * ratio);
        if (forSeats >= threshold) {
            return { status: 'will_pass', reason: 'supermajority_reached', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        if (forSeats + undeclaredSeats < threshold) {
            return { status: 'will_fail', reason: 'supermajority_impossible', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        return { status: 'pending', reason: 'supermajority_in_progress', thresholdNeeded: threshold, neededFor: threshold - forSeats, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }

    // ── Impeachment motion / no confidence: absolute majority, no quorum ──
    if (isAbsoluteMajorityBill(bill.bill_type)) {
        // No confidence: 60% if courts are captured, otherwise 50%+1
        const threshold = (bill.bill_type === 'no_confidence' && judicialPoliticized)
            ? Math.ceil(totalSeats * 0.6)
            : Math.floor(totalSeats / 2) + 1;
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
export function resolveBillVote(bill, totalSeats, nationFlags = {}) {
    const forSeats = bill.votes_for || 0;
    const againstSeats = bill.votes_against || 0;
    const abstainSeats = bill.votes_abstain || 0;
    const participating = forSeats + againstSeats + abstainSeats;
    const quorumPct = (nationFlags.legislative_quorum_override > 0) ? (nationFlags.legislative_quorum_override / 100) : GAME_CONFIG.QUORUM_THRESHOLD;
    const quorumThreshold = Math.ceil(totalSeats * quorumPct);
    const judicialPoliticized = !!nationFlags.judicial_appointment_politicization;

    // Entrenchment clause: elevates ordinary bills to supermajority thresholds
    if (bill.entrenchment_tier && bill.bill_type !== 'foundational') {
        const ratio = bill.entrenchment_tier === 'protected' ? GAME_CONFIG.PROTECTED_THRESHOLD : GAME_CONFIG.SUPERMAJORITY_THRESHOLD;
        const threshold = Math.ceil(totalSeats * ratio);
        return forSeats >= threshold ? 'passed' : 'failed';
    }

    // Foundational / default_resolution / veto_override / impeachment_conviction: supermajority
    if (isSupermajorityBill(bill.bill_type)) {
        let ratio = 2 / 3;
        if (bill.bill_type === 'impeachment_conviction' && judicialPoliticized) {
            ratio = 0.75;
        } else if (bill.bill_type === 'foundational' && nationFlags.constitutional_amendment_streamlining
                   && !bill.proposed_constitutional_amendment_streamlining) {
            ratio = 0.55;
        }
        const threshold = Math.ceil(totalSeats * ratio);
        return forSeats >= threshold ? 'passed' : 'failed';
    }

    // No-confidence / impeachment_motion: absolute majority
    if (isAbsoluteMajorityBill(bill.bill_type)) {
        const threshold = (bill.bill_type === 'no_confidence' && judicialPoliticized)
            ? Math.ceil(totalSeats * 0.6)
            : Math.floor(totalSeats / 2) + 1;
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
        .select('id, bill_name, bill_type, voting_ends_tick, proposed_tick, floor_tick, caucus_votes_withheld, proposed_constitutional_amendment_streamlining, bill_support(faction_id, stance, seat_count)')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .is('early_resolution_status', null)
        .or(`voting_ends_tick.gt.${currentTick},voting_ends_tick.is.null`);

    console.log(`[checkEarlyMajority] nation=${nationId} currentTick=${currentTick} found ${activeBills?.length ?? 0} active floor bills (error=${error?.message || 'none'})`);

    if (error || !activeBills || activeBills.length === 0) return [];

    // Use the actual sum of faction seats as the voting denominator, not
    // total_seats.  After seat changes the nation's
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

    // Check for Legislative Quorum Reform override and Constitutional Amendment Streamlining
    const { data: nationQuorum } = await supabase.from('nations').select('legislative_quorum_override, constitutional_amendment_streamlining').eq('id', nationId).single();
    const qPct = (nationQuorum?.legislative_quorum_override > 0) ? (nationQuorum.legislative_quorum_override / 100) : GAME_CONFIG.QUORUM_THRESHOLD;
    const hasStreamlining = !!nationQuorum?.constitutional_amendment_streamlining;
    const quorumSeats = Math.ceil(effectiveTotalSeats * qPct);
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
        if (isSupermajorityBill(bill.bill_type)) {
            // Supermajority threshold — must match resolveBillVote logic:
            // - Veto override uses VETO_OVERRIDE_THRESHOLD
            // - Foundational + streamlining active (not the streamlining bill itself): 55%
            // - Everything else: 67%
            let ratio = GAME_CONFIG.SUPERMAJORITY_THRESHOLD;
            if (bill.bill_type === 'veto_override') {
                ratio = GAME_CONFIG.VETO_OVERRIDE_THRESHOLD;
            } else if (bill.bill_type === 'foundational' && hasStreamlining && !bill.proposed_constitutional_amendment_streamlining) {
                ratio = 0.55;
            }
            const requiredSeats = Math.ceil(effectiveTotalSeats * ratio);
            if (effectiveYes >= requiredSeats) {
                earlyStatus = 'majority_reached';
            } else if (effectiveYes + undeclaredSeats < requiredSeats) {
                earlyStatus = 'majority_opposed';
            }
        } else if (isAbsoluteMajorityBill(bill.bill_type)) {
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
                voting_ends_tick: resolveAtTick,
                votes_for: yesSeats,
                votes_against: noSeats,
                votes_abstain: abstainSeats
            }).eq('id', bill.id);

            const resolveType = earlyStatus.startsWith('quorum') ? 'QUORUM' : 'MATH-LOCK';
            console.log(`[checkEarlyMajority] ${bill.bill_name}: ${earlyStatus} [${resolveType}] (YES=${yesSeats}, NO=${noSeats}, quorum=${quorumSeats}, voted=${participating}, effectiveTotal=${effectiveTotalSeats}, configTotal=${GAME_CONFIG.TOTAL_SEATS}). Resolves tick ${resolveAtTick}`);
            results.push({ billId: bill.id, billName: bill.bill_name, status: earlyStatus, yesSeats, noSeats });
        }
    }

    return results;
}

// ── Constitutional Referendum Resolution ──
// Resolves pending referendums 1+ ticks after referendum_start_tick.
// YES > 50% → bill moves to referendum_approved (sponsor can send to floor).
// NO ≥ 50% → bill fails.
export async function resolveReferendums(supabase, nation, currentTick) {
    const { data: pendingBills, error } = await supabase
        .from('bills')
        .select('id, bill_name, proposed_by, referendum_start_tick, bill_type, proposed_seats, proposed_term_length, proposed_constitutional_reform, proposed_constitutional_amendment_streamlining, entrenchment_tier')
        .eq('nation_id', nation.id)
        .eq('status', 'referendum_pending')
        .eq('referendum_status', 'pending')
        .lte('referendum_start_tick', currentTick - 1);

    if (error || !pendingBills || pendingBills.length === 0) return [];

    const results = [];

    for (const bill of pendingBills) {
        if (bill.proposed_by) {
            const { data: proposer } = await supabase.from('factions').select('id').eq('id', bill.proposed_by).maybeSingle();
            if (!proposer) {
                await supabase.from('bills').update({ status: 'failed', referendum_status: 'resolved', referendum_yes_pct: 0, referendum_no_pct: 100, referendum_turnout_pct: 0 }).eq('id', bill.id);
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_proposer_disbanded' });
                continue;
            }
        }

        var govApproval = Number(nation.gov_approval ?? 50);
        var civilUnrest = Number(nation.civil_unrest ?? 30);
        var polarization = Number(nation.polarization ?? 50);
        var happiness = Number(nation.happiness ?? 50);
        var stability = Number(nation.stability ?? 50);
        var sol = Number(nation.standard_of_living ?? 50);
        var gdpGrowth = Number(nation.gdp_growth ?? 0);

        var crisisCount = 0;
        try {
            const { count } = await supabase
                .from('incidents')
                .select('id', { count: 'exact', head: true })
                .or(`nation_a_id.eq.${nation.id},nation_b_id.eq.${nation.id}`)
                .in('status', ['active', 'mediating']);
            crisisCount = count || 0;
        } catch (_) {}

        var proposerApproval = 50;
        if (bill.proposed_by) {
            try {
                const { data: standing } = await supabase
                    .from('faction_electoral_standing')
                    .select('party_approval')
                    .eq('faction_id', bill.proposed_by)
                    .maybeSingle();
                if (standing) proposerApproval = Number(standing.party_approval ?? 50);
            } catch (_) {}
        }

        var fatiguePenalty = 0;
        try {
            const { count: recentCount } = await supabase
                .from('bills')
                .select('id', { count: 'exact', head: true })
                .eq('nation_id', nation.id)
                .eq('referendum_status', 'resolved')
                .gte('referendum_start_tick', currentTick - 24);
            if (recentCount && recentCount > 0) fatiguePenalty = 10;
        } catch (_) {}

        var yesPct = 50;
        yesPct += Math.max(0, (50 - govApproval)) * 0.3;
        yesPct += Math.max(0, (civilUnrest - 50)) * 0.2;
        yesPct += crisisCount * 5;
        yesPct += Math.max(0, (polarization - 50)) * 0.15;
        yesPct += Math.max(0, (50 - happiness)) * 0.15;
        yesPct += (proposerApproval - 50) * 0.2;
        yesPct -= Math.max(0, (stability - 50)) * 0.2;
        yesPct -= Math.max(0, (sol - 50)) * 0.15;
        // GDP growth: gdp_growth is 0-100 centered at 50. Growing economy resists change.
        yesPct -= Math.max(0, (gdpGrowth - 50)) * 0.3;
        yesPct -= fatiguePenalty;

        yesPct = Math.max(15, Math.min(85, yesPct));
        yesPct += (Math.random() - 0.5) * 10;
        yesPct = Math.round(Math.max(5, Math.min(95, yesPct)) * 10) / 10;
        var noPct = Math.round((100 - yesPct) * 10) / 10;

        var turnout = 30;
        turnout += Math.max(0, (polarization - 50)) * 0.2;
        turnout += crisisCount * 3;
        turnout += Math.max(0, (civilUnrest - 50)) * 0.1;
        turnout = Math.max(20, Math.min(45, turnout));
        turnout = Math.round((turnout + (Math.random() - 0.5) * 4) * 10) / 10;
        turnout = Math.max(15, Math.min(50, turnout));

        var passed = yesPct > 50;

        console.log(`[resolveReferendums] ${bill.bill_name}: YES=${yesPct}% NO=${noPct}% turnout=${turnout}% → ${passed ? 'APPROVED' : 'REJECTED'}`);

        if (passed) {
            await supabase.from('bills').update({
                status: 'referendum_approved',
                referendum_status: 'resolved',
                referendum_yes_pct: yesPct,
                referendum_no_pct: noPct,
                referendum_turnout_pct: turnout
            }).eq('id', bill.id);
        } else {
            await supabase.from('bills').update({
                status: 'failed',
                referendum_status: 'resolved',
                referendum_yes_pct: yesPct,
                referendum_no_pct: noPct,
                referendum_turnout_pct: turnout
            }).eq('id', bill.id);
        }

        results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'approved' : 'rejected', yesPct, noPct, turnout });
    }

    return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// BILL-TYPE RESOLVERS
//
// Each resolver handles one bill_type branch that used to live as an
// if/else-if inside resolveExpiredVotes. Extracted incrementally (R3, R4, …);
// resolveExpiredVotes will eventually dispatch to these via a map.
//
// Every resolver has the same signature:
//   resolveXBill(supabase, bill, ctx) → Promise<resultEntry>
// where ctx = { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain }
// and resultEntry is the row pushed onto the resolveExpiredVotes results array.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Resolve a passed/failed minister_confirmation bill (presidential and
 * semi-presidential PM + cabinet confirmations). Reads the nominee from
 * bill.metadata.pending_minister (sole source of truth); installs the
 * confirmed minister into ministries; for PM bills also syncs
 * government_formations.ministry_assignments and installs head_of_government.
 *
 * Force-fails (overrides ctx.passed) when:
 *   - bill.metadata.pending_minister is missing
 *   - the nominee's own party voted NO
 */
export async function resolveMinisterConfirmationBill(supabase, bill, ctx) {
    const { currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;
    let passed = ctx.passed;

    const mKey = bill.ministry_key;
    const pm = bill.metadata?.pending_minister || null;

    // Fetch the (possibly absent) ministry row — used to know whether to
    // UPDATE or INSERT, and to preserve is_acting for the failed-bill restore
    // path. Never the source of truth for the nominee.
    const { data: ministry } = await supabase.from('ministries')
        .select('id, is_acting')
        .eq('nation_id', bill.nation_id).eq('ministry_key', mKey).eq('is_active', true)
        .maybeSingle();

    if (!pm) {
        console.error(`[resolveMinisterConfirmation] bill ${bill.id} (${mKey}) missing bill.metadata.pending_minister. Failing.`);
        passed = false;
    }

    // Auto-fail if the nominee's party itself voted NO.
    const minNomineeVotedNo = pm?.party_id && (bill.bill_support || []).some(s => {
        const st = s.stance === 'reject' ? 'no' : s.stance;
        return s.faction_id === pm.party_id && st === 'no';
    });
    if (minNomineeVotedNo) passed = false;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

        const { data: fullNation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();
        const ministryFields = {
            party_id: pm.party_id,
            minister_first_name: pm.first_name,
            minister_last_name: pm.last_name,
            minister_age: pm.age,
            minister_approval: MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL,
            ministry_name: MINISTRY_OFFICE_NAMES[mKey] || mKey,
            confirmation_status: 'confirmed',
            pending_minister: null,
            stat_baselines: fullNation ? buildMinistryBaselines(mKey, fullNation) : {},
        };

        if (ministry) {
            const { error: updErr } = await supabase.from('ministries').update(ministryFields).eq('id', ministry.id);
            if (updErr) console.error(`[resolveMinisterConfirmation] ministries update failed for ${mKey}:`, updErr.message);
        } else {
            const { error: insErr } = await supabase.from('ministries').insert({
                nation_id: bill.nation_id,
                ministry_key: mKey,
                is_active: true,
                ...ministryFields,
            });
            if (insErr) console.error(`[resolveMinisterConfirmation] ministries insert failed for ${mKey}:`, insErr.message);
        }

        if (mKey === 'prime_minister') {
            try {
                const { data: activeGovFormation } = await supabase.from('government_formations')
                    .select('id, ministry_assignments')
                    .eq('nation_id', bill.nation_id)
                    .in('status', ['formed', 'active', 'caretaker'])
                    .order('formed_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (activeGovFormation) {
                    const updatedAssignments = { ...(activeGovFormation.ministry_assignments || {}), prime_minister: pm.party_id };
                    await supabase.from('government_formations')
                        .update({ ministry_assignments: updatedAssignments })
                        .eq('id', activeGovFormation.id);
                    console.log(`[resolveMinisterConfirmation] Updated government_formations PM assignment to ${pm.party_id}`);
                }
            } catch (gfErr) { console.warn('[resolveMinisterConfirmation] Failed to update government_formations PM:', gfErr); }

            try {
                await installHOG(supabase, {
                    nationId: bill.nation_id,
                    factionId: pm.party_id,
                    firstName: pm.first_name,
                    lastName: pm.last_name,
                    age: pm.age,
                    currentTick,
                });
                console.log(`[resolveMinisterConfirmation] Installed HOG for confirmed PM ${pm.first_name} ${pm.last_name} (party ${pm.party_id})`);
            } catch (hogErr) {
                console.error('[resolveMinisterConfirmation] HOG install failed:', hogErr.message || hogErr);
            }
        }

        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: 0 });
    } else {
        await failBill(supabase, bill);

        if (ministry) {
            await supabase.from('ministries').update({
                confirmation_status: ministry.is_acting ? 'acting' : 'rejected',
                pending_minister: null,
            }).eq('id', ministry.id);
        }

        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'minister_confirmation',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed ambassador confirmation bill.
 *
 * Force-fails (overrides ctx.passed) when the nominee's own party voted NO.
 * On pass: activates the ambassador row (status='active', is_active=true,
 * appointed_at_tick).
 * On fail: rejects the ambassador row (status='rejected', is_active=false).
 */
export async function resolveAmbassadorConfirmationBill(supabase, bill, ctx) {
    const { currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;
    let passed = ctx.passed;

    // Resolve the nominee's party for the auto-fail vote check.
    const { data: ambRow } = await supabase.from('ambassadors')
        .select('faction_id')
        .eq('id', bill.ambassador_id)
        .maybeSingle();
    const ambNomineeId = ambRow?.faction_id;
    const nomineeVotedNo = ambNomineeId && (bill.bill_support || []).some(s => {
        const st = s.stance === 'reject' ? 'no' : s.stance;
        return s.faction_id === ambNomineeId && st === 'no';
    });
    if (nomineeVotedNo) passed = false;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
        await supabase.from('ambassadors').update({
            status: 'active',
            is_active: true,
            appointed_at_tick: currentTick,
        }).eq('id', bill.ambassador_id);
        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: 0 });
    } else {
        await failBill(supabase, bill);
        await supabase.from('ambassadors').update({
            status: 'rejected',
            is_active: false,
        }).eq('id', bill.ambassador_id);
        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'confirmation',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed no_confidence bill. Thin wrapper around the
 * elections.js domain handler (resolveNoConfidence) plus the standard
 * bills.update / failBill + result-entry bookkeeping.
 */
export async function resolveNoConfidenceBill(supabase, bill, ctx) {
    const { passed, currentTick, votesFor, votesAgainst } = ctx;
    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    } else {
        await failBill(supabase, bill);
    }
    await resolveNoConfidence(supabase, bill, passed, votesFor, votesAgainst, currentTick);
    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'no_confidence',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed impeachment_motion bill (Phase 1 of impeachment).
 *
 * On pass: advances proceedings to 'trial', applies immediate approval +
 * credibility hits on the president, auto-spawns the Phase 2 conviction
 * bill with a trial voting window, fires PRESIDENT IMPEACHED event.
 *
 * On fail: marks proceeding motion_result='failed', sets the nation-wide
 * impeachment-motion cooldown, penalizes the filer, grants the president
 * vindication bonuses, records a campaign_action row for cooldown tracking,
 * fires IMPEACHMENT MOTION FAILS event.
 */
export async function resolveImpeachmentMotionBill(supabase, bill, ctx) {
    const { passed, currentTick, votesFor, votesAgainst, totalSeats } = ctx;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

        // Motion passed — advance the proceeding to the trial phase.
        await supabase.from('impeachment_proceedings').update({
            phase: 'trial',
            motion_result: 'passed',
        }).eq('id', bill.impeachment_id);

        // Immediate momentum + credibility hit on the president for being impeached.
        const { data: proceedingData } = await supabase.from('impeachment_proceedings')
            .select('president_id').eq('id', bill.impeachment_id).single();
        if (proceedingData) {
            const { data: presidentRow } = await supabase.from('presidents')
                .select('faction_id').eq('id', proceedingData.president_id).single();
            if (presidentRow) {
                await supabase.rpc('adjust_momentum', { p_faction_id: presidentRow.faction_id, p_delta: -5, p_label: 'Impeachment passed (-5)', p_tick: currentTick });
                await adjustCredibility(supabase, presidentRow.faction_id, bill.nation_id, -0.15, 12, currentTick, { source: 'impeachment:passed' });
            }
        }

        // Auto-spawn the conviction bill (Phase 2) — goes straight to floor.
        const seats = totalSeats || GAME_CONFIG.TOTAL_SEATS;
        const { data: convictionBill } = await supabase.from('bills').insert({
            nation_id: bill.nation_id,
            proposed_by: bill.proposed_by,
            proposed_tick: currentTick,
            bill_name: bill.bill_name.replace('Impeachment of', 'Conviction of'),
            bill_type: 'impeachment_conviction',
            status: 'floor',
            voting_ends_tick: currentTick + GAME_CONFIG.IMPEACHMENT_TRIAL_TICKS,
            impeachment_id: bill.impeachment_id,
            preamble: 'The President has been impeached. Parliament must now vote on removal. A 2/3 supermajority (' + Math.ceil(seats * 2 / 3) + ' of ' + seats + ' seats) is required for conviction and removal from office.',
        }).select('id').single();

        if (convictionBill) {
            await supabase.from('impeachment_proceedings').update({
                conviction_bill_id: convictionBill.id,
            }).eq('id', bill.impeachment_id);
        }

        try {
            await supabase.from('event_log').insert({
                nation_id: bill.nation_id,
                event_name: 'PRESIDENT IMPEACHED',
                event_type: 'impeachment',
                category: 'government',
                description_chosen: `Parliament has voted to impeach the President. The motion passed ${votesFor} to ${votesAgainst}. A trial period begins — a 2/3 supermajority vote is required for removal.`,
                fired_at_tick: currentTick,
                effects_applied: { impeachment_id: bill.impeachment_id, votes_for: votesFor, votes_against: votesAgainst },
            });
        } catch (e) { /* non-blocking */ }
    } else {
        await failBill(supabase, bill);

        // Motion failed — close proceeding + apply nation-wide cooldown.
        await supabase.from('impeachment_proceedings').update({
            phase: 'resolved',
            motion_result: 'failed',
            resolved_at_tick: currentTick,
        }).eq('id', bill.impeachment_id);

        await supabase.from('nations').update({
            impeachment_cooldown_until_tick: currentTick + GAME_CONFIG.IMPEACHMENT_MOTION_COOLDOWN_TICKS,
        }).eq('id', bill.nation_id);

        // Filer: partisan-overreach penalty.
        await supabase.rpc('adjust_momentum', { p_faction_id: bill.proposed_by, p_delta: -2, p_label: 'Impeachment failed — initiator (-2)', p_tick: currentTick });
        await adjustCredibility(supabase, bill.proposed_by, bill.nation_id, -0.05, 0, currentTick, { source: 'impeachment:motion_failed' });

        // President: vindication bonus.
        const { data: proc } = await supabase.from('impeachment_proceedings')
            .select('president_id').eq('id', bill.impeachment_id).single();
        if (proc) {
            const { data: presRow } = await supabase.from('presidents')
                .select('faction_id').eq('id', proc.president_id).single();
            if (presRow) {
                await supabase.rpc('adjust_momentum', { p_faction_id: presRow.faction_id, p_delta: 2, p_label: 'Impeachment failed — president vindicated (+2)', p_tick: currentTick });
                await adjustCredibility(supabase, presRow.faction_id, bill.nation_id, 0.03, 0, currentTick, { source: 'impeachment:motion_failed:vindicated' });
            }
        }

        await supabase.from('campaign_actions').insert({
            nation_id: bill.nation_id,
            party_id: bill.proposed_by,
            action_type: 'impeachment_failed',
            tick_performed: currentTick,
            result: { impeachment_id: bill.impeachment_id },
        });

        try {
            await supabase.from('event_log').insert({
                nation_id: bill.nation_id,
                event_name: 'IMPEACHMENT MOTION FAILS',
                event_type: 'impeachment',
                category: 'government',
                description_chosen: `The impeachment motion has failed ${votesFor} to ${votesAgainst}. The President remains in office.`,
                fired_at_tick: currentTick,
                effects_applied: { impeachment_id: bill.impeachment_id, votes_for: votesFor, votes_against: votesAgainst, cooldown_ticks: GAME_CONFIG.IMPEACHMENT_MOTION_COOLDOWN_TICKS },
            });
        } catch (e) { /* non-blocking */ }
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'impeachment_motion',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed impeachment_conviction bill (Phase 2 of impeachment).
 *
 * On pass (convicted): marks proceeding conviction_result='convicted'. Actual
 * presidential removal is handled by processImpeachmentConviction in the
 * tick handler (which needs cross-nation + scheduling context the resolver
 * doesn't have).
 *
 * On fail (acquitted): marks proceeding acquitted, sets long acquittal
 * cooldown, grants the president survived-trial bonuses, boosts national
 * stability, penalizes parties that voted YES on conviction (plus the
 * filer), fires PRESIDENT ACQUITTED event.
 */
export async function resolveImpeachmentConvictionBill(supabase, bill, ctx) {
    const { passed, currentTick, votesFor, votesAgainst, totalSeats } = ctx;
    const seats = totalSeats || GAME_CONFIG.TOTAL_SEATS;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
        await supabase.from('impeachment_proceedings').update({
            phase: 'resolved',
            conviction_result: 'convicted',
            resolved_at_tick: currentTick,
        }).eq('id', bill.impeachment_id);
    } else {
        await failBill(supabase, bill);

        // Acquitted — close proceeding + long cooldown.
        await supabase.from('impeachment_proceedings').update({
            phase: 'resolved',
            conviction_result: 'acquitted',
            resolved_at_tick: currentTick,
        }).eq('id', bill.impeachment_id);

        await supabase.from('nations').update({
            impeachment_cooldown_until_tick: currentTick + GAME_CONFIG.IMPEACHMENT_ACQUITTAL_COOLDOWN_TICKS,
        }).eq('id', bill.nation_id);

        // President: survived-trial bonuses.
        const { data: proc } = await supabase.from('impeachment_proceedings')
            .select('president_id').eq('id', bill.impeachment_id).single();
        if (proc) {
            const { data: presRow } = await supabase.from('presidents')
                .select('faction_id').eq('id', proc.president_id).single();
            if (presRow) {
                await supabase.rpc('adjust_momentum', { p_faction_id: presRow.faction_id, p_delta: 3, p_label: 'Survived impeachment (+3)', p_tick: currentTick });
                await adjustCredibility(supabase, presRow.faction_id, bill.nation_id, 0.05, 0, currentTick, { source: 'impeachment:survived' });
            }
        }

        // Stability recovers +3.
        const { data: natRow } = await supabase.from('nations').select('stability').eq('id', bill.nation_id).single();
        if (natRow) {
            await supabase.from('nations').update({
                stability: Math.min(100, Math.round(Number(natRow.stability || 0) + 3)),
            }).eq('id', bill.nation_id);
        }

        // Parties that voted YES on conviction take -1 approval.
        const yesVoters = (bill.bill_support || []).filter(s => s.stance === 'yes' || s.stance === 'accept');
        for (const v of yesVoters) {
            if (v.faction_id !== bill.proposed_by) {
                await supabase.rpc('adjust_momentum', { p_faction_id: v.faction_id, p_delta: -1, p_label: 'Impeachment survived — yes voter (-1)', p_tick: currentTick });
                await adjustCredibility(supabase, v.faction_id, bill.nation_id, -0.03, 0, currentTick, { source: 'impeachment:survived:accuser' });
            }
        }
        await supabase.rpc('adjust_momentum', { p_faction_id: bill.proposed_by, p_delta: -1, p_label: 'Impeachment survived — initiator (-1)', p_tick: currentTick });
        await adjustCredibility(supabase, bill.proposed_by, bill.nation_id, -0.03, 0, currentTick, { source: 'impeachment:survived:accuser' });

        try {
            await supabase.from('event_log').insert({
                nation_id: bill.nation_id,
                event_name: 'PRESIDENT ACQUITTED',
                event_type: 'impeachment',
                category: 'government',
                description_chosen: `The President has been acquitted. The conviction vote failed ${votesFor} to ${votesAgainst} (needed ${Math.ceil(seats * 2 / 3)}). Full presidential powers are restored.`,
                fired_at_tick: currentTick,
                effects_applied: { impeachment_id: bill.impeachment_id, votes_for: votesFor, votes_against: votesAgainst, cooldown_ticks: GAME_CONFIG.IMPEACHMENT_ACQUITTAL_COOLDOWN_TICKS },
            });
        } catch (e) { /* non-blocking */ }
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'impeachment_conviction',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed diplomatic_proposal ratification bill.
 *
 * Two sub-paths:
 *   - Bilateral (proposal_tier === 3 with both proposing_bill_id and target_bill_id):
 *     waits for the OTHER nation's twin bill; once both sides pass, activates
 *     the proposal, applies one-time relation bump + unrest spike, and for
 *     trade agreements creates the trade_agreements + aid_agreement_state
 *     rows so the tick processor can apply economic effects.
 *   - Unilateral: activates immediately, same side-effects.
 *
 * On fail:
 *   - Bilateral: marks pipeline side failed, cancels the other side's
 *     still-open ratification bill, fires failure news to both nations.
 *   - Unilateral: marks proposal ratification_failed so the FM can retry.
 */
export async function resolveDiplomaticRatificationBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
        const { data: proposal } = await supabase.from('diplomatic_proposals')
            .select('*').eq('id', bill.diplomatic_proposal_id).single();
        if (proposal) {
            const pd = proposal.proposal_data || {};
            const isBilateral = proposal.proposal_tier === 3 && proposal.proposing_bill_id && proposal.target_bill_id;

            if (isBilateral) {
                // ── BILATERAL RATIFICATION (Major Diplomatic Initiative) ──
                const isProposerBill = bill.id === proposal.proposing_bill_id;
                const otherBillId = isProposerBill ? proposal.target_bill_id : proposal.proposing_bill_id;

                let otherPassed = false;
                if (otherBillId) {
                    const { data: otherBill } = await supabase.from('bills')
                        .select('status').eq('id', otherBillId).single();
                    otherPassed = otherBill?.status === 'passed';
                }

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

                    const articles = pd.articles || [];
                    const activeArticles = articles.filter(a => a.status !== 'struck');
                    const activeEffects = { proposer: {}, target: {} };
                    let totalRel = 0;

                    for (const art of activeArticles) {
                        const effects = art.proposer_effects || art.effects || {};
                        const targetEffects = art.target_effects || art.effects || {};
                        totalRel += (effects.relations || 0);

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

                    if (proposal.proposal_type === 'trade_agreement' && pd.agreement_type) {
                        const durationArt = activeArticles.find(a => a.type === 'duration');
                        const dt = durationArt?.data || {};
                        const durationTicks = dt.duration_type === 'permanent' ? null : (dt.duration_ticks || 480);
                        const expiresAt = durationTicks ? currentTick + durationTicks : null;

                        const taNationA = proposal.proposing_nation_id < proposal.target_nation_id ? proposal.proposing_nation_id : proposal.target_nation_id;
                        const taNationB = proposal.proposing_nation_id < proposal.target_nation_id ? proposal.target_nation_id : proposal.proposing_nation_id;

                        const { data: newTA, error: taErr } = await supabase.from('trade_agreements').insert({
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
                            negotiation_id: null,
                        }).select('id').single();

                        if (taErr) {
                            console.error('[bilateral] trade_agreements insert failed:', taErr.message);
                        } else if (newTA) {
                            await supabase.from('diplomatic_proposals')
                                .update({ status: 'enacted' })
                                .eq('id', bill.diplomatic_proposal_id);
                            if (pd.agreement_type === 'economic_aid') {
                                const aidArt = activeArticles.find(a => a.type === 'aid_terms');
                                if (aidArt) {
                                    const donorId = aidArt.data?.donor_nation_id;
                                    const annualAmount = Number(aidArt.data?.annual_amount || 0);
                                    if (donorId && annualAmount > 0) {
                                        const recipientId = donorId === proposal.proposing_nation_id ? proposal.target_nation_id : proposal.proposing_nation_id;
                                        const { error: aidErr } = await supabase.from('aid_agreement_state').insert({
                                            agreement_id: newTA.id,
                                            donor_nation_id: donorId,
                                            recipient_nation_id: recipientId,
                                            current_annual_amount: annualAmount,
                                            original_annual_amount: annualAmount,
                                            next_review_tick: currentTick + (DIPLOMACY_CONFIG.AID_ANNUAL_REVIEW_INTERVAL || 12),
                                            condition_failures: {},
                                        });
                                        if (aidErr) console.error('[bilateral] aid_agreement_state insert failed:', aidErr.message);
                                    }
                                }
                            }
                        }
                    }

                    await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: activeArticles.length });

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
                                    article_count: String(activeArticles.length),
                                },
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
                // ── UNILATERAL RATIFICATION ──
                const updatedPipeline = { ...(pd.pipeline || {}), ratified_at: currentTick };
                pd.pipeline = updatedPipeline;
                await supabase.from('diplomatic_proposals')
                    .update({ status: 'active', activated_at_tick: currentTick, proposal_data: pd })
                    .eq('id', bill.diplomatic_proposal_id);
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
                        negotiation_id: null,
                    }).select('id').single().then(async ({ data: newTA, error: taErr }) => {
                        if (taErr) { console.error('[ratification] trade_agreements insert failed:', taErr.message); return; }
                        await supabase.from('diplomatic_proposals')
                            .update({ status: 'enacted' })
                            .eq('id', proposal.id);
                        if (pd.agreement_type === 'economic_aid' && newTA) {
                            const aidArt = activeArticles.find(a => a.type === 'aid_terms');
                            if (aidArt) {
                                const donorId = aidArt.data?.donor_nation_id;
                                const annualAmount = Number(aidArt.data?.annual_amount || 0);
                                if (donorId && annualAmount > 0) {
                                    const recipientId = donorId === proposal.proposing_nation_id ? proposal.target_nation_id : proposal.proposing_nation_id;
                                    const { error: aidErr } = await supabase.from('aid_agreement_state').insert({
                                        agreement_id: newTA.id,
                                        donor_nation_id: donorId,
                                        recipient_nation_id: recipientId,
                                        current_annual_amount: annualAmount,
                                        original_annual_amount: annualAmount,
                                        next_review_tick: currentTick + (DIPLOMACY_CONFIG.AID_ANNUAL_REVIEW_INTERVAL || 12),
                                        condition_failures: {},
                                    });
                                    if (aidErr) console.error('[ratification] aid_agreement_state insert failed:', aidErr.message);
                                    else console.log(`[ratification] Aid state created: donor=${donorId}, recipient=${recipientId}, amount=$${(annualAmount/1e9).toFixed(1)}B/yr`);
                                }
                            }
                        }
                    });
                }

                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
            }
        }
    } else {
        await failBill(supabase, bill);
        const { data: failedProposal } = await supabase.from('diplomatic_proposals')
            .select('proposal_tier, proposing_bill_id, target_bill_id, proposal_data, proposing_nation_id, target_nation_id')
            .eq('id', bill.diplomatic_proposal_id).single();
        const isBilateral = failedProposal?.proposal_tier === 3 && failedProposal?.proposing_bill_id && failedProposal?.target_bill_id;

        if (isBilateral) {
            const fpd = failedProposal.proposal_data || {};
            const pipeline = fpd.pipeline || {};
            const isProposerBill = bill.id === failedProposal.proposing_bill_id;
            if (isProposerBill) pipeline.proposer_result = 'failed';
            else pipeline.target_result = 'failed';
            fpd.pipeline = pipeline;

            await supabase.from('diplomatic_proposals')
                .update({ status: 'ratification_failed', proposal_data: fpd })
                .eq('id', bill.diplomatic_proposal_id);

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

            try {
                if (failedProposal.proposing_nation_id && failedProposal.target_nation_id) {
                    for (const nId of [failedProposal.proposing_nation_id, failedProposal.target_nation_id]) {
                        await supabase.rpc('insert_news_event', {
                            p_nation_id: nId,
                            p_trigger_key: 'major_initiative_ratification_failed',
                            p_tick: currentTick,
                            p_placeholders: {
                                initiative_name: fpd.name || 'Diplomatic Initiative',
                                failed_in: isProposerBill ? (fpd.proposer_nation_name || 'Proposer') : (fpd.target_nation_name || 'Target'),
                            },
                        });
                    }
                }
            } catch (newsErr) { console.error('News event error:', newsErr); }
        } else {
            await supabase.from('diplomatic_proposals')
                .update({ status: 'ratification_failed' })
                .eq('id', bill.diplomatic_proposal_id);
        }
        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'ratification',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed trade-negotiation ratification bill. Bilateral:
 * waits for the other nation's twin bill; once both pass, creates the
 * trade_agreements row (+ aid_agreement_state for economic aid) and marks
 * the negotiation concluded. On failure: marks negotiation ratification_failed.
 */
export async function resolveTradeRatificationBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

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
                const articles = neg.draft_articles || [];
                const durationArt = articles.find(a => a.type === 'duration');
                const durData = durationArt?.data || {};
                const isPermanent = durData.duration_type === 'permanent';
                const durationTicks = durData.duration_ticks || null;
                const autoRenew = durData.auto_renew || false;
                const withdrawalNotice = durData.withdrawal_notice_ticks || 3;

                const nA = neg.nation_a_id < neg.nation_b_id ? neg.nation_a_id : neg.nation_b_id;
                const nB = neg.nation_a_id < neg.nation_b_id ? neg.nation_b_id : neg.nation_a_id;

                const { data: newAgreement, error: taInsertErr } = await supabase.from('trade_agreements').insert({
                    nation_a_id: nA,
                    nation_b_id: nB,
                    negotiation_id: neg.id,
                    bill_a_id: neg.bill_a_id,
                    bill_b_id: neg.bill_b_id,
                    agreement_type: neg.agreement_type,
                    agreement_name: neg.agreement_name || 'Trade Agreement',
                    articles,
                    duration_type: isPermanent ? 'permanent' : 'fixed',
                    duration_ticks: isPermanent ? null : durationTicks,
                    auto_renew: autoRenew,
                    withdrawal_notice_ticks: withdrawalNotice,
                    status: 'active',
                    enacted_at_tick: currentTick,
                    expires_at_tick: isPermanent ? null : (durationTicks ? currentTick + durationTicks : null),
                }).select('id').single();
                if (taInsertErr) console.error('[resolveTradeRatification] trade_agreements insert failed:', taInsertErr.message);

                if (neg.agreement_type === 'economic_aid' && newAgreement) {
                    const aidTerms = articles.find(a => a.type === 'aid_terms');
                    if (aidTerms) {
                        const donorId = aidTerms.data.donor_nation_id;
                        if (donorId !== nA && donorId !== nB) {
                            console.error(`[resolveTradeRatification] Invalid donor_nation_id ${donorId} — not a party to agreement [${nA}, ${nB}]. Skipping aid_agreement_state.`);
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
                                condition_failures: {},
                            });
                            if (aidStateError) {
                                console.error('[resolveTradeRatification] Failed to create aid_agreement_state:', aidStateError.message);
                            } else {
                                console.log(`[resolveTradeRatification] Economic aid agreement activated: donor=${donorId}, recipient=${recipientId}, amount=$${(annualAmount/1e9).toFixed(2)}B`);
                            }
                        }
                    }
                }

                const { error: negUpdateErr } = await supabase.from('trade_negotiations')
                    .update({ status: 'concluded', concluded_at_tick: currentTick })
                    .eq('id', neg.id);
                if (negUpdateErr) console.error('[resolveTradeRatification] trade_negotiations concluded update failed:', negUpdateErr.message);
                else console.log('[resolveTradeRatification] Trade agreement activated — negotiation', neg.id, 'marked concluded');

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
            // If only one side ratified so far, just leave the negotiation in 'ratification' status.
        }

        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
    } else {
        await failBill(supabase, bill);
        await supabase.from('trade_negotiations')
            .update({ status: 'ratification_failed' })
            .eq('id', bill.trade_negotiation_id);
        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'trade_ratification',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed retaliatory-tariff ratification bill. Unilateral —
 * imposer nation parliament only. On pass: creates an active trade_agreement
 * row (imposer = nation_a), applies a diplomatic penalty proportional to the
 * max surcharge, fires an enactment event in the target nation. On fail:
 * plain failBill.
 */
export async function resolveRetaliatoryTariffRatificationBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

        const rtData = bill.trade_agreement_data;
        const imposerId = rtData.imposer_nation_id;
        const targetId = rtData.target_nation_id;
        const isPermanent = rtData.duration_type === 'permanent';
        const durationTicks = rtData.duration_ticks || null;

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
            expires_at_tick: isPermanent ? null : (durationTicks ? currentTick + durationTicks : null),
        });

        let maxSurcharge = 0;
        const articles = rtData.articles || [];
        for (const art of articles) {
            if (art.type === 'tariff_surcharge') {
                maxSurcharge = Math.max(maxSurcharge, art.data.surcharge_pct || 0);
            }
        }
        const relPenalty = Math.round(maxSurcharge / 2);

        if (relPenalty > 0) {
            const relA = imposerId < targetId ? imposerId : targetId;
            const relB = imposerId < targetId ? targetId : imposerId;
            const { data: rel } = await supabase.from('diplomatic_relations')
                .select('id, relation_score')
                .eq('nation_a_id', relA).eq('nation_b_id', relB).maybeSingle();
            if (rel) {
                const newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) - relPenalty));
                await supabase.from('diplomatic_relations')
                    .update({ relation_score: newScore }).eq('id', rel.id);
            }
        }

        try {
            const { data: imposerNation } = await supabase.from('nations').select('name').eq('id', imposerId).single();
            const imposerName = imposerNation?.name || 'Unknown';
            await supabase.from('event_log').insert({
                nation_id: targetId,
                event_name: 'Retaliatory Tariff Enacted',
                trigger_key: 'sanctions_imposed',
                category: 'Trade',
                description_chosen: imposerName + ' has enacted a retaliatory tariff on your exports. Relations have decreased by ' + relPenalty + '.',
                fired_at_tick: currentTick,
            });
        } catch (e) { /* non-blocking */ }

        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
    } else {
        await failBill(supabase, bill);
        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'retaliatory_tariff',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed embargo ratification bill. Unilateral — imposer
 * nation parliament only. On pass: creates an active trade_agreement row,
 * applies a diplomatic penalty (20 + 5 per embargoed sector), fires an
 * enactment event in the target nation. On fail: plain failBill.
 */
export async function resolveEmbargoRatificationBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

        const embData = bill.trade_agreement_data;
        const imposerId = embData.imposer_nation_id;
        const targetId = embData.target_nation_id;
        const durationTicks = embData.duration_ticks || 12;

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
            expires_at_tick: currentTick + durationTicks,
        });

        const embargoedSectors = (embData.articles || []).filter(a => a.type === 'embargo_sector').length;
        const relPenalty = Math.round(20 + embargoedSectors * 5);

        if (relPenalty > 0) {
            const relA = imposerId < targetId ? imposerId : targetId;
            const relB = imposerId < targetId ? targetId : imposerId;
            const { data: rel } = await supabase.from('diplomatic_relations')
                .select('id, relation_score')
                .eq('nation_a_id', relA).eq('nation_b_id', relB).maybeSingle();
            if (rel) {
                const newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) - relPenalty));
                await supabase.from('diplomatic_relations')
                    .update({ relation_score: newScore }).eq('id', rel.id);
            }
        }

        try {
            const { data: imposerNation } = await supabase.from('nations').select('name').eq('id', imposerId).single();
            const imposerName = imposerNation?.name || 'Unknown';
            await supabase.from('event_log').insert({
                nation_id: targetId,
                event_name: 'Embargo Enacted',
                trigger_key: 'sanctions_imposed',
                category: 'Trade',
                description_chosen: imposerName + ' has imposed an embargo on your trade. Relations have decreased by ' + relPenalty + '.',
                fired_at_tick: currentTick,
            });
        } catch (e) { /* non-blocking */ }

        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
    } else {
        await failBill(supabase, bill);
        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'impose_embargo',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed sovereign-default_resolution bill.
 *
 * Thin dispatcher: the heavy economic effects (cross-nation contagion,
 * creditor payouts, credit-rating updates) live in handler-template.ts
 * (enactSovereignDefault / handleFailedDefaultResolution) because they
 * need cross-nation + tick-scheduling context the resolver lacks. The
 * typeof guard means client-side callers that don't bundle those
 * functions (admin.html, laws.html) see a no-op enactment while the
 * tick handler owns the real consequences.
 */
export async function resolveDefaultResolutionBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst } = ctx;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
        if (typeof enactSovereignDefault === 'function') {
            try {
                await enactSovereignDefault(supabase, bill, currentTick);
            } catch (defaultErr) {
                console.error(`[resolveDefaultResolution] enactSovereignDefault failed for bill ${bill.id}:`, defaultErr);
            }
        }
    } else {
        await failBill(supabase, bill);
        if (typeof handleFailedDefaultResolution === 'function') {
            try {
                await handleFailedDefaultResolution(supabase, bill, currentTick);
            } catch (failErr) {
                console.error(`[resolveDefaultResolution] handleFailedDefaultResolution failed for bill ${bill.id}:`, failErr);
            }
        }
    }
    await fireBillEvent(supabase, passed ? 'bill_passed' : 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: 0 });

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'default_resolution',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed veto_override bill (Presidential systems).
 *
 * On pass: marks this bill passed and ENACTS the ORIGINAL (vetoed) bill
 * via enactBill, bypassing the president's desk entirely. If the
 * original's enactment fails, both bills are marked failed with an
 * explanatory event on the original. On fail: the veto holds —
 * the original stays failed forever (cannot be re-vetoed-overridden).
 */
export async function resolveVetoOverrideBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
        // Enact the ORIGINAL vetoed bill — bypasses president's desk.
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
    } else {
        await failBill(supabase, bill);
        // Original bill dies with the override — it can never pass now.
        if (bill.original_bill_id) {
            await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.original_bill_id);
        }
        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'veto_override',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed foundational bill (constitutional amendments,
 * electoral reform, etc.).
 *
 * Three outcomes:
 *   - passed vote + enactment succeeds → result='passed'
 *   - passed vote + enactment fails → warn, result='failed', NO failBill call
 *     (enactFoundationalBill is responsible for whatever cleanup it needs;
 *     the bill row may stay in whatever intermediate state it left behind)
 *   - failed vote → failBill, result='failed'
 *
 * The heavy lifting — constitutional-system transitions, HOG deactivation,
 * election scheduling, stat side-effects — lives inside enactFoundationalBill.
 */
export async function resolveFoundationalBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;
    let enacted = false;
    if (passed) {
        enacted = await enactFoundationalBill(supabase, bill, currentTick);
    }
    if (!passed || !enacted) {
        if (!enacted && passed) {
            console.warn(`[resolveFoundationalBill] Foundational bill ${bill.id} had enough votes but enactment failed.`);
        } else {
            await failBill(supabase, bill);
        }
    }
    await fireBillEvent(supabase, enacted ? 'bill_passed' : 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: enacted ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'foundational',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve an ordinary bill (the catch-all: regular policy bills, repeals,
 * everything not matched by a specialized resolver).
 *
 * Branches:
 *   - Presidential (hasElectedPresident): route to president's desk —
 *     bills.update status='president_desk' with a deadline. The president's
 *     desk processor picks it up for sign/veto/auto-sign.
 *   - Parliamentary (no elected president): enact immediately via enactBill.
 *     If enactment fails, the bill is marked failed_enactment with an
 *     explanatory event; otherwise status=passed and effects applied.
 *   - Failed: plain failBill + event.
 *
 * Note: the absolute-monarchy early-continue for passed ordinary bills
 * (awaiting_royal_assent) is handled upstream in resolveExpiredVotes —
 * those bills never reach this resolver.
 *
 * Return entry lacks a `type` field (no existing consumer sets one for
 * ordinary bills), and the pass path may yield result='president_desk',
 * 'passed', or 'failed_enactment' depending on the sub-branch taken.
 */
export async function resolveOrdinaryBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;

    if (passed) {
        if (hasElectedPresident(nation)) {
            await supabase.from('bills').update({
                status: 'president_desk',
                passed_tick: currentTick,
                president_desk_deadline: currentTick + GAME_CONFIG.PRESIDENT_DESK_TICKS,
            }).eq('id', bill.id);
            await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: (bill.bill_articles || []).length });
            return {
                billId: bill.id,
                billName: bill.bill_name,
                result: 'president_desk',
                votesFor,
                votesAgainst,
                earlyResolution: bill.early_resolution_status || null,
            };
        }
        // Parliamentary: enact immediately. Wrap enactBill in try/catch so a
        // thrown exception still produces a clean failed_enactment result.
        let enactment;
        try {
            enactment = await enactBill(supabase, bill, currentTick);
        } catch (enactErr) {
            console.error(`[resolveOrdinaryBill] enactBill threw for bill ${bill.id} ("${bill.bill_name}"):`, enactErr);
            enactment = { success: false, error: `enactBill threw: ${enactErr?.message || enactErr}` };
        }
        if (!enactment?.success) {
            await markBillEnactmentFailed(supabase, bill, currentTick, enactment?.error || 'Unknown enactment failure');
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, billNameOverride: `${bill.bill_name} (enactment failed)` });
            return {
                billId: bill.id,
                billName: bill.bill_name,
                result: 'failed_enactment',
                votesFor,
                votesAgainst,
                error: enactment?.error,
                earlyResolution: bill.early_resolution_status || null,
            };
        }
        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: (bill.bill_articles || []).length });
        return {
            billId: bill.id,
            billName: bill.bill_name,
            result: 'passed',
            votesFor,
            votesAgainst,
            earlyResolution: bill.early_resolution_status || null,
        };
    }
    // Failed
    await failBill(supabase, bill);
    await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: 'failed',
        votesFor,
        votesAgainst,
        earlyResolution: bill.early_resolution_status || null,
    };
}


// ─── Bill resolver dispatch ─────────────────────────────────────────────────
//
// Single source of truth for "which resolver handles which bill_type".
// Each entry is a selector (bill) → resolver | null. A null return means
// the bill_type is recognized but the specific sub-shape isn't — fall back
// to resolveOrdinaryBill.
//
// This mirrors BILL_TYPE_SPECS (threshold side, R2) on the dispatch side.
const BILL_RESOLVERS = Object.freeze({
    no_confidence:          ()  => resolveNoConfidenceBill,
    foundational:           ()  => resolveFoundationalBill,
    default_resolution:     ()  => resolveDefaultResolutionBill,
    confirmation:           (b) => b.ambassador_id      ? resolveAmbassadorConfirmationBill : null,
    minister_confirmation:  (b) => b.ministry_key       ? resolveMinisterConfirmationBill   : null,
    veto_override:          (b) => b.original_bill_id   ? resolveVetoOverrideBill           : null,
    impeachment_motion:     (b) => b.impeachment_id     ? resolveImpeachmentMotionBill      : null,
    impeachment_conviction: (b) => b.impeachment_id     ? resolveImpeachmentConvictionBill  : null,
    ratification:           (b) => {
        if (b.diplomatic_proposal_id)                              return resolveDiplomaticRatificationBill;
        if (b.trade_negotiation_id)                                return resolveTradeRatificationBill;
        if (b.trade_agreement_data?.type === 'retaliatory_tariff') return resolveRetaliatoryTariffRatificationBill;
        if (b.trade_agreement_data?.type === 'impose_embargo')     return resolveEmbargoRatificationBill;
        return null;
    },
});

export function selectBillResolver(bill) {
    const selector = BILL_RESOLVERS[bill?.bill_type];
    const resolver = selector ? selector(bill) : null;
    return resolver || resolveOrdinaryBill;
}

export async function resolveExpiredVotes(supabase, nationId) {
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    // Load nation flags for authoritarian law threshold overrides
    const { data: nationForFlags } = await supabase.from('nations').select('legislative_quorum_override, judicial_appointment_politicization, constitutional_amendment_streamlining').eq('id', nationId).single();
    const effectiveQuorumPct = (nationForFlags?.legislative_quorum_override > 0) ? (nationForFlags.legislative_quorum_override / 100) : GAME_CONFIG.QUORUM_THRESHOLD;
    const nationFlags = {
        judicial_appointment_politicization: !!nationForFlags?.judicial_appointment_politicization,
        legislative_quorum_override: nationForFlags?.legislative_quorum_override || 0,
        constitutional_amendment_streamlining: !!nationForFlags?.constitutional_amendment_streamlining
    };

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
    // After seat changes total_seats can exceed the
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

        // Sync vote tallies to bills table (client-side syncVoteTallies only
        // runs on manual votes — tick processor must persist tallies too)
        await supabase.from('bills').update({
            votes_for: votesFor,
            votes_against: votesAgainst,
            votes_abstain: votesAbstain
        }).eq('id', bill.id);

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
        const resolution = resolveBillVote(resolveBill, totalSeats, nationFlags);
        console.log(`[resolveExpiredVotes] bill=${bill.id} votes yes=${votesFor} no=${votesAgainst} abstain=${votesAbstain} effective_yes=${effectiveVotesFor} totalSeats=${totalSeats} resolution=${resolution}`);

        // Handle quorum deferral: extend vote by 1 tick
        if (resolution === 'deferred') {
            const newDeadline = currentTick + 1;
            await supabase.from('bills').update({
                quorum_failures: (bill.quorum_failures || 0) + 1,
                voting_ends_tick: newDeadline
            }).eq('id', bill.id);

            // Notify all party leaders about quorum failure
            const quorumThreshold = Math.ceil(totalSeats * effectiveQuorumPct);
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
            const quorumThreshold = Math.ceil(totalSeats * effectiveQuorumPct);
            const participating = votesFor + votesAgainst + votesAbstain;
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, extra: { reason: `quorum not met after two attempts (${participating}/${quorumThreshold} participating)` } });
            console.log(`[resolveExpiredVotes] ${bill.bill_name}: quorum failed twice (${participating}/${quorumThreshold}), bill dies`);
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_no_quorum', votesFor, votesAgainst, votesAbstain, type: bill.bill_type });
            continue;
        }

        let passed = resolution === 'passed';
        const isNoConfidence = bill.bill_type === 'no_confidence';
        const isFoundational = bill.bill_type === 'foundational';

        // Absolute Monarchy: ordinary bills that pass go to royal assent instead of auto-enacting
        const isMonarchy = (nation?.government_type || '').toLowerCase().includes('monarchy');
        const isOrdinaryBill = !isNoConfidence && !isFoundational
            && bill.bill_type !== 'impeachment_motion' && bill.bill_type !== 'impeachment_conviction'
            && bill.bill_type !== 'veto_override' && bill.bill_type !== 'default_resolution';
        if (isMonarchy && passed && isOrdinaryBill) {
            await supabase.from('bills').update({
                status: 'awaiting_royal_assent',
                votes_for: votesFor,
                votes_against: votesAgainst,
                votes_abstain: votesAbstain,
            }).eq('id', bill.id);
            results.push({ billId: bill.id, billName: bill.bill_name, resolution: 'awaiting_royal_assent', votesFor, votesAgainst });
            continue; // skip normal enactment — monarch decides
        }

        // Dispatch to the per-bill-type resolver. BILL_RESOLVERS is the single
        // source of truth for routing; selectBillResolver falls back to
        // resolveOrdinaryBill for unknown types or sub-shapes that don't match.
        const resolver = selectBillResolver(bill);
        const entry = await resolver(supabase, bill, {
            passed, currentTick, nation, votesFor, votesAgainst, votesAbstain, totalSeats,
        });
        results.push(entry);

        // ── Bill momentum: award momentum to YES/NO voters based on outcome ──
        // Sponsor: +1 on passage. YES voters: +2/article on pass, -1 on fail.
        // NO voters: +2/article on fail. Abstain: nothing.
        // Skip momentum for special bill types and presidential desk (not yet enacted)
        const lastResult = results[results.length - 1];
        const skipMomentum = ['no_confidence', 'confirmation', 'minister_confirmation', 'impeachment_conviction'].includes(bill.bill_type)
            || lastResult?.result === 'president_desk';
        if (!skipMomentum) {
            try {
                const billPassed = lastResult?.result === 'passed';
                const supports = bill.bill_support || [];

                for (const s of supports) {
                    const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
                    let delta = 0;
                    let label = '';

                    if (stance === 'yes' && billPassed) {
                        delta = 1;
                        label = `Bill passed: ${(bill.bill_name || '').slice(0, 25)}… (+1)`;
                    } else if (stance === 'yes' && !billPassed) {
                        delta = -1;
                        label = `Bill failed: ${(bill.bill_name || '').slice(0, 25)}… (-1)`;
                    } else if (stance === 'no' && !billPassed) {
                        delta = 1;
                        label = `Bill failed: ${(bill.bill_name || '').slice(0, 25)}… (+1)`;
                    }
                    // NO voters on passing bills: no penalty (removed — opposition shouldn't be punished for opposing)

                    if (delta !== 0) {
                        await supabase.rpc('adjust_momentum', {
                            p_faction_id: s.faction_id,
                            p_delta: delta,
                            p_label: label,
                            p_tick: currentTick
                        });
                    }
                }

                // Sponsor bonus: +1 on passage (opposition only), -2 on failure
                // Government sponsors get +0 — they already benefit from legislative success
                if (billPassed && bill.proposed_by) {
                    const sponsorCoalition = await fetchActiveCoalition(supabase, bill.nation_id);
                    const isGovSponsor = sponsorCoalition?.party_ids?.includes(bill.proposed_by);
                    if (!isGovSponsor) {
                        await supabase.rpc('adjust_momentum', {
                            p_faction_id: bill.proposed_by,
                            p_delta: 1,
                            p_label: `Sponsored bill passed (opposition): ${(bill.bill_name || '').slice(0, 25)}… (+1)`,
                            p_tick: currentTick
                        });
                    }
                } else if (!billPassed && bill.proposed_by) {
                    await supabase.rpc('adjust_momentum', {
                        p_faction_id: bill.proposed_by,
                        p_delta: -2,
                        p_label: `Sponsored bill failed: ${(bill.bill_name || '').slice(0, 25)}… (-2)`,
                        p_tick: currentTick
                    });
                }
            } catch (momErr) {
                console.warn(`[resolveExpiredVotes] Momentum awards failed for bill ${bill.id}:`, momErr.message);
            }
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
            const penalized = await applyNoVotePenalty(supabase, bill, bill.nation_id, currentTick);
            if (penalized.length > 0) {
                const names = penalized.map(p => `${p.factionName} (${p.approvalLoss} approval, ${p.visibilityLoss} vis, ${p.credibilityLoss} cred)`).join(', ');
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
            await updateCaucusRelationships(supabase, bill.id, outcome, bill.bill_articles || [], bill.bill_support || []);
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

    // ── Cleanup orphaned vetoed bills ──
    // If a vetoed bill has no pending override vote (the override was already
    // resolved or was never created), fail the vetoed bill so its policies
    // are freed for reuse. Runs every tick as a safety net.
    try {
        const { data: orphanedVetoes } = await supabase
            .from('bills')
            .select('id')
            .eq('nation_id', nationId)
            .eq('status', 'vetoed');

        for (const vb of (orphanedVetoes || [])) {
            const { data: pendingOverride } = await supabase
                .from('bills')
                .select('id')
                .eq('original_bill_id', vb.id)
                .eq('bill_type', 'veto_override')
                .in('status', ['floor', 'committee'])
                .limit(1)
                .maybeSingle();

            if (!pendingOverride) {
                await supabase.from('bills')
                    .update({ status: 'failed', passed_tick: currentTick })
                    .eq('id', vb.id);
                console.log(`[resolveExpiredVotes] Orphaned vetoed bill ${vb.id} marked as failed`);
            }
        }
    } catch (orphanErr) {
        console.warn('[resolveExpiredVotes] Orphan veto cleanup failed (non-fatal):', orphanErr);
    }

    return results;
}

/**
 * Safety net: catch trade negotiations stuck in 'ratification' where both bills have passed.
 * This handles the race condition where both ratification bills resolve in the same tick
 * and the first-processed bill doesn't see the other as passed yet.
 */
export async function resolveStuckRatifications(supabase, nationId) {
    try {
        const { data: stuckNegs } = await supabase
            .from('trade_negotiations')
            .select('id, bill_a_id, bill_b_id, nation_a_id, nation_b_id, agreement_type, agreement_name, draft_articles')
            .eq('status', 'ratification')
            .or(`nation_a_id.eq.${nationId},nation_b_id.eq.${nationId}`);

        if (!stuckNegs || stuckNegs.length === 0) return;

        const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        const currentTick = shard?.current_tick || 0;

        for (const neg of stuckNegs) {
            // If bill IDs are missing, the negotiation is orphaned — fail it
            if (!neg.bill_a_id || !neg.bill_b_id) {
                await supabase.from('trade_negotiations')
                    .update({ status: 'ratification_failed' })
                    .eq('id', neg.id);
                console.log(`[resolveStuckRatifications] Negotiation ${neg.id} failed — missing bill IDs`);
                continue;
            }

            const [billARes, billBRes] = await Promise.all([
                supabase.from('bills').select('status').eq('id', neg.bill_a_id).single(),
                supabase.from('bills').select('status').eq('id', neg.bill_b_id).single(),
            ]);

            const aStatus = billARes.data?.status;
            const bStatus = billBRes.data?.status;

            if (aStatus === 'passed' && bStatus === 'passed') {
                console.log(`[resolveStuckRatifications] Both bills passed for negotiation ${neg.id} — activating trade agreement`);

                const articles = neg.draft_articles || [];
                const durationArt = articles.find(a => a.type === 'duration');
                const durData = durationArt?.data || {};
                const isPermanent = durData.duration_type === 'permanent';
                const durationTicks = durData.duration_ticks || null;
                const autoRenew = durData.auto_renew || false;
                const withdrawalNotice = durData.withdrawal_notice_ticks || 3;
                const nA = neg.nation_a_id < neg.nation_b_id ? neg.nation_a_id : neg.nation_b_id;
                const nB = neg.nation_a_id < neg.nation_b_id ? neg.nation_b_id : neg.nation_a_id;

                // Check if agreement already exists (avoid duplicate)
                const { data: existing } = await supabase.from('trade_agreements')
                    .select('id').eq('negotiation_id', neg.id).maybeSingle();
                if (!existing) {
                    await supabase.from('trade_agreements').insert({
                        nation_a_id: nA, nation_b_id: nB,
                        negotiation_id: neg.id,
                        bill_a_id: neg.bill_a_id, bill_b_id: neg.bill_b_id,
                        agreement_type: neg.agreement_type,
                        agreement_name: neg.agreement_name || 'Trade Agreement',
                        articles, duration_type: isPermanent ? 'permanent' : 'fixed',
                        duration_ticks: isPermanent ? null : durationTicks,
                        auto_renew: autoRenew, withdrawal_notice_ticks: withdrawalNotice,
                        status: 'active', enacted_at_tick: currentTick,
                        expires_at_tick: isPermanent ? null : (durationTicks ? currentTick + durationTicks : null),
                    });
                }

                await supabase.from('trade_negotiations')
                    .update({ status: 'concluded', concluded_at_tick: currentTick })
                    .eq('id', neg.id);

                console.log(`[resolveStuckRatifications] Negotiation ${neg.id} activated via safety net`);
            } else if (['failed', 'expired', 'vetoed'].includes(aStatus) || ['failed', 'expired', 'vetoed'].includes(bStatus) || !aStatus || !bStatus) {
                // One or both ratification bills failed, expired, or were deleted — negotiation is dead
                await supabase.from('trade_negotiations')
                    .update({ status: 'ratification_failed' })
                    .eq('id', neg.id);
                console.log(`[resolveStuckRatifications] Negotiation ${neg.id} failed — bill statuses: A=${aStatus}, B=${bStatus}`);
            }
        }
    } catch (err) {
        console.error('[resolveStuckRatifications] Error:', err.message);
    }
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
        .select('name, government_type, total_seats, judicial_appointment_politicization, legislative_quorum_override, constitutional_amendment_streamlining')
        .eq('id', nationId)
        .single();
    const nominalTotalSeats = nation?.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const totalSeats = Math.min(nominalTotalSeats, Math.max(factionSeatSum, 1));
    const stuckNationFlags = {
        judicial_appointment_politicization: !!nation?.judicial_appointment_politicization,
        legislative_quorum_override: nation?.legislative_quorum_override || 0,
        constitutional_amendment_streamlining: !!nation?.constitutional_amendment_streamlining
    };

    const specialTypes = new Set(['no_confidence', 'foundational', 'default_resolution', 'veto_override', 'impeachment_motion', 'impeachment_conviction', 'ratification', 'minister_confirmation', 'ambassador_confirmation']);
    const results = [];

    for (const bill of stuckBills) {
      try {
        if (specialTypes.has(bill.bill_type)) {
            console.warn(`[resolveStuckFloorBills] Skipping special bill type "${bill.bill_type}" for bill ${bill.id} "${bill.bill_name}" — needs resolveExpiredVotes`);
            await failBill(supabase, bill);
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor: 0, votesAgainst: 0, extra: { reason: `safety net: special type ${bill.bill_type} could not be resolved normally` } });
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_safety_net', billType: bill.bill_type });
        } else {
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

        // Sync vote tallies to bills table
        await supabase.from('bills').update({
            votes_for: votesFor,
            votes_against: votesAgainst,
            votes_abstain: votesAbstain
        }).eq('id', bill.id);

        const resolveBill = {
            ...bill,
            votes_for: votesFor,
            votes_against: votesAgainst,
            votes_abstain: votesAbstain,
            quorum_failures: bill.quorum_failures || 0
        };
        const resolution = resolveBillVote(resolveBill, totalSeats, stuckNationFlags);
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
            if (hasElectedPresident(nation)) {
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
        } // end else (non-special bill type)
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
    } else if (bill.bill_type === 'entrenchment_upgrade' && bill.entrenchment_upgrade_law_id) {
        // Entrenchment upgrade: update the target active_law's entrenchment tier
        const targetTier = bill.entrenchment_tier;
        const updateData = { entrenchment_tier: targetTier };
        if (targetTier === 'entrenched') {
            updateData.entrenchment_cooldown_until_tick = currentTick + GAME_CONFIG.ENTRENCHED_COOLDOWN_TICKS;
        } else if (targetTier === 'enshrined') {
            updateData.entrenchment_cooldown_until_tick = null;
        }
        const { error: upgradeErr } = await supabase.from('active_laws')
            .update(updateData)
            .eq('id', bill.entrenchment_upgrade_law_id);
        if (upgradeErr) {
            console.error('[enactBill] stage=entrenchment_upgrade result=failed', { ...logContext, error: upgradeErr.message });
            return { success: false, error: `Entrenchment upgrade failed: ${upgradeErr.message}` };
        }
        console.log('[enactBill] stage=entrenchment_upgrade result=success', { ...logContext, targetTier, lawId: bill.entrenchment_upgrade_law_id });
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
            const activeLawRow = {
                    nation_id: bill.nation_id,
                    policy_id: policy.id,
                    passed_tick: currentTick,
                    proposed_by: bill.proposed_by,
                    effects_applied_through_tick: currentTick - 1
                };
            // Stamp entrenchment from bill
            if (bill.entrenchment_tier) {
                activeLawRow.entrenchment_tier = bill.entrenchment_tier;
                if (bill.entrenchment_tier === 'entrenched') {
                    activeLawRow.entrenchment_cooldown_until_tick = currentTick + GAME_CONFIG.ENTRENCHED_COOLDOWN_TICKS;
                }
            }
            const { error: activeLawError } = await supabase.from('active_laws')
                .upsert(activeLawRow, { onConflict: 'nation_id,policy_id' });
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
        } else if (effect.type === 'TARIFF_RATE_CHANGE' && effect.sector) {
            // Per-sector tariff: merge into nation's sector_tariffs jsonb
            const tariffRate = Math.max(0, Math.min(100, Number(effect.new_rate)));
            const { data: nationRow, error: tariffReadErr } = await supabase.from('nations').select('sector_tariffs').eq('id', bill.nation_id).single();
            if (tariffReadErr) {
                console.error('[enactBill] Failed to read sector_tariffs:', tariffReadErr.message);
            } else {
                const existingTariffs = nationRow?.sector_tariffs || {};
                existingTariffs[effect.sector] = tariffRate;
                const { error: tariffWriteErr } = await supabase.from('nations').update({ sector_tariffs: existingTariffs }).eq('id', bill.nation_id);
                if (tariffWriteErr) console.error('[enactBill] Failed to write sector_tariffs:', tariffWriteErr.message);
                else console.log(`[enactBill] Sector tariff: ${effect.sector} → ${tariffRate}%`);
            }
        } else if (effect.type === 'gov_bailout' && effect.corp_faction_id && Number.isFinite(effect.amount) && effect.amount > 0) {
            // Government Bailout: single-source-of-truth is effect_data { corp_faction_id, amount }.
            // Re-validate corp, recompute valuation, fund from reserves → debt, +0.1 gdp_growth,
            // then apply -50 momentum and -20 gov_approval event per yes voter.
            try {
                const corpId = effect.corp_faction_id;
                const requested = Math.max(0, Number(effect.amount));
                const { data: corp } = await supabase.from('factions')
                    .select('id, faction_name, faction_type, nation_id, corp_cash_reserves, corp_loans, abandoned_at')
                    .eq('id', corpId).single();
                if (!corp || corp.faction_type !== 'corporation' || corp.abandoned_at || corp.nation_id !== bill.nation_id) {
                    console.log(`[enactBill] gov_bailout voided: corp ${corpId} missing/moved/dissolved`);
                } else {
                    const { data: props } = await supabase.from('corp_properties')
                        .select('purchase_price, condition').eq('faction_id', corpId);
                    const { data: vessels } = await supabase.from('corp_vessels')
                        .select('purchase_price, condition, built_at_tick, status').eq('faction_id', corpId);
                    const corpCash = Number(corp.corp_cash_reserves || 0);
                    const corpLoans = Number(corp.corp_loans || 0);
                    const valuation = computeCorpValuation({ cash: corpCash, loans: corpLoans, properties: props, vessels, currentTick });
                    const cap = Math.max(0, 3 * valuation);
                    const payout = Math.min(requested, cap);
                    if (payout > 0) {
                        const { data: nation } = await supabase.from('nations')
                            .select('budget_reserves, debt, gdp_growth').eq('id', bill.nation_id).single();
                        const reserves = Number(nation?.budget_reserves || 0);
                        const drawReserves = Math.max(0, Math.min(payout, reserves));
                        const drawDebt = payout - drawReserves;
                        const currentGdp = Number(nation?.gdp_growth ?? 50);
                        const newGdp = Math.round(Math.max(0, Math.min(100, currentGdp + 0.1)) * 10) / 10;
                        await supabase.from('nations').update({
                            budget_reserves: Math.round(reserves - drawReserves),
                            debt: Math.round(Number(nation?.debt || 0) + drawDebt),
                            gdp_growth: newGdp,
                        }).eq('id', bill.nation_id);
                        await supabase.from('factions').update({
                            corp_cash_reserves: corpCash + payout,
                        }).eq('id', corpId);
                        console.log(`[enactBill] gov_bailout: $${Math.round(payout / 1e6)}M to ${corp.faction_name} (reserves: $${Math.round(drawReserves / 1e6)}M, debt: +$${Math.round(drawDebt / 1e6)}M, gdp_growth: ${currentGdp} → ${newGdp})`);
                    } else {
                        console.log(`[enactBill] gov_bailout: payout capped to 0 (valuation $${Math.round(valuation / 1e6)}M)`);
                    }
                    const yesVoters = (bill.bill_support || []).filter(s => s.stance === 'accept' || s.stance === 'yes');
                    for (const v of yesVoters) {
                        await supabase.rpc('adjust_momentum', { p_faction_id: v.faction_id, p_delta: -50 });
                        await adjustGovernmentApprovalEvent(supabase, bill.nation_id, -20, 'gov_bailout');
                    }
                }
            } catch (e) {
                console.error('[enactBill] gov_bailout failed:', e?.message || e);
            }
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

        // ── Apply tax-change approval effects to gov_approval_events ──
        // Tax increases hurt approval, tax cuts boost it.
        // Approval gain is reduced by 20% per active crisis.
        if (bill.proposed_by) {
            // Count active crises to scale approval impact
            let crisisCount = 0;
            try {
                const { count } = await supabase
                    .from('active_crises').select('id', { count: 'exact', head: true })
                    .eq('nation_id', bill.nation_id);
                crisisCount = count || 0;
            } catch (e) {
                console.warn('[enactBill] Could not count active crises:', e.message);
            }
            const crisisPenalty = Math.min(1, crisisCount * 0.20); // cap at 100%

            for (const [taxKey, newRate] of Object.entries(taxUpdates)) {
                const oldRate = Number(nation[taxKey] ?? 0);
                const rateDiff = newRate - oldRate;
                if (rateDiff === 0) continue;

                // Tax increase: -2 per point raised. Tax cut: +1 per point lowered.
                let approvalImpact = rateDiff > 0 ? rateDiff * -2 : Math.abs(rateDiff) * 1;
                if (approvalImpact > 0 && crisisPenalty > 0) {
                    approvalImpact = Math.round(approvalImpact * (1 - crisisPenalty));
                }
                if (approvalImpact !== 0) {
                    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, approvalImpact, `tax:${taxKey}`);
                    console.log(`[enactBill] ${taxKey} gov_approval_events: ${approvalImpact} (crises: ${crisisCount}, penalty: ${Math.round(crisisPenalty * 100)}%)`);
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
            // Stores actual dollar amounts: needed_amount = true cost, allocation_amount = funded amount
            // so fundingPct = allocation_amount / needed_amount * 100
            const { data: _billNation } = await supabase.from('nations').select('population, gdp, inflation').eq('id', bill.nation_id).single();
            const { data: _instConfigs } = await supabase.from('ministry_institution_config').select('id, base_cost_per_capita, scaling_type');
            const _billPop = Number(_billNation?.population || 0);
            const _billGdp = Number(_billNation?.gdp || 0);
            const _billInfRate = Math.pow(Math.max(0, Number(_billNation?.inflation || 0)), 1.5) / 100;
            const _billInfMult = 1 + (_billInfRate / 100);

            for (const inst of allInst) {
                const instCfg = (_instConfigs || []).find(c => c.id === inst.id);
                let neededAmt = 0;
                if (instCfg) {
                    const bv = Number(instCfg.base_cost_per_capita || 0);
                    const st = instCfg.scaling_type || 'population';
                    neededAmt = Math.round((st === 'gdp' ? (bv / 100) * _billGdp : bv * _billPop) * _billInfMult);
                }
                const allocAmt = Math.round(neededAmt * (inst.proposed_pct / 100));

                const { error: allocErr } = await supabase.from('budget_item_allocations')
                    .upsert({
                        bill_id: bill.id,
                        nation_id: bill.nation_id,
                        fiscal_category: fd.ministry_key,
                        item_type: 'institution',
                        item_id: inst.id,
                        item_name: inst.name,
                        allocation_amount: allocAmt,
                        needed_amount: neededAmt
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

        // Discretionary funds: credit ministry balance and add cost to national debt
        // fd.discretionary is in $M — convert to raw dollars for the balance column.
        // Positive = parliament allocating funds. Negative = parliament withdrawing funds.
        const grantAmountM = Number(fd.discretionary) || 0;
        if (grantAmountM !== 0) {
            const grantRaw = grantAmountM * 1_000_000;
            // Credit (or debit) the ministry's discretionary_balance
            const { data: curMinistry, error: balReadErr } = await supabase.from('ministries')
                .select('discretionary_balance')
                .eq('nation_id', bill.nation_id)
                .eq('ministry_key', fd.ministry_key)
                .eq('is_active', true)
                .maybeSingle();
            if (balReadErr) {
                console.error(`[enactBill] failed to read discretionary_balance for ${fd.ministry_key}:`, balReadErr.message);
            }
            const curBalance = Number(curMinistry?.discretionary_balance || 0);
            const newBalance = Math.max(0, curBalance + grantRaw);
            const { error: balWriteErr } = await supabase.from('ministries')
                .update({ discretionary_balance: newBalance })
                .eq('nation_id', bill.nation_id)
                .eq('ministry_key', fd.ministry_key)
                .eq('is_active', true);
            if (balWriteErr) {
                console.error(`[enactBill] failed to update discretionary_balance for ${fd.ministry_key}:`, balWriteErr.message);
            }
            console.log(`[enactBill] discretionary: ${fd.ministry_key} balance ${curBalance} → ${newBalance} (${grantAmountM > 0 ? '+' : ''}${grantAmountM}M)`);

            // Positive grants add to national debt (the money has to come from somewhere)
            // grantAmountM is in $M, nation.debt is in raw dollars — convert
            if (grantAmountM > 0) {
                const grantDollars = grantAmountM * 1_000_000;
                const newDebt = (Number(nation.debt) || 0) + grantDollars;
                console.log('[enactBill] stage=update_debt_for_grant attempt', {
                    ...logContext,
                    ministryKey: fd.ministry_key,
                    grantAmount: grantAmountM,
                    grantDollars,
                    newDebt
                });
                await supabase.from('nations').update({ debt: newDebt }).eq('id', bill.nation_id);
                nation.debt = newDebt;
                console.log('[enactBill] stage=update_debt_for_grant result=success', {
                    ...logContext,
                    ministryKey: fd.ministry_key,
                    grantAmount: grantAmountM,
                    newDebt
                });
            }
            // Negative grants (withdrawals) reduce debt if possible
            if (grantAmountM < 0) {
                const absAmountDollars = Math.abs(grantAmountM) * 1_000_000;
                const newDebt = Math.max(0, (Number(nation.debt) || 0) - absAmountDollars);
                await supabase.from('nations').update({ debt: newDebt }).eq('id', bill.nation_id);
                nation.debt = newDebt;
                console.log(`[enactBill] discretionary withdrawal: debt reduced by $${Math.abs(grantAmountM)}M → ${newDebt}`);
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
    await applyEnactmentApproval(supabase, bill.nation_id, approvalDeltas, currentTick);

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

    // ── Authoritarian crisis bonus ──
    // If 3+ crises are active AND this bill reduces freedom-related stats,
    // award gov_approval + momentum to governing parties.
    // Diminishing returns: first authoritarian law during multi-crisis = +5/+5,
    // subsequent ones = +2/+2.
    try {
        await applyAuthoritarianCrisisBonus(supabase, bill, nation, currentTick);
    } catch (authErr) {
        console.error('[enactBill] Authoritarian crisis bonus failed (non-fatal):', authErr?.message);
    }

    console.log('[enactBill] stage=terminal_result result=success', logContext);
    return { success: true };
}


// ── Authoritarian Crisis Bonus ──
// When 3+ crises are active and a bill with authoritarian stat effects passes,
// governing parties receive gov_approval + momentum bonuses.
// Diminishing returns: first = +5/+5, subsequent = +2/+2.
const AUTHORITARIAN_STATS = new Set(['freedom_index', 'press_freedom', 'judicial_independence']);

async function applyAuthoritarianCrisisBonus(supabase, bill, nation, currentTick) {
    // 1. Check if the bill has authoritarian effects (decreases freedom stats)
    const articles = bill.articles || [];
    let isAuthoritarian = false;
    for (const article of articles) {
        if (article.status === 'struck') continue;
        const effects = article.stat_effects || article.effects || [];
        for (const eff of effects) {
            const key = eff.stat_key || eff.stat || '';
            const dir = eff.direction || (eff.delta < 0 ? 'down' : 'up');
            if (AUTHORITARIAN_STATS.has(key) && dir === 'down') {
                isAuthoritarian = true;
                break;
            }
        }
        if (isAuthoritarian) break;
    }

    // Also check policy-level stat_effects if linked to a policy
    if (!isAuthoritarian && bill.policy_id) {
        const { data: policy } = await supabase.from('policies').select('stat_effects').eq('id', bill.policy_id).maybeSingle();
        if (policy?.stat_effects) {
            for (const eff of policy.stat_effects) {
                if (AUTHORITARIAN_STATS.has(eff.stat_key) && eff.direction === 'down') {
                    isAuthoritarian = true;
                    break;
                }
            }
        }
    }

    if (!isAuthoritarian) return;

    // 2. Check active crises count
    const { data: crises } = await supabase
        .from('active_crises')
        .select('id')
        .eq('nation_id', bill.nation_id);

    const crisisCount = (crises || []).length;
    if (crisisCount < 3) return;

    // 3. Check diminishing returns — how many authoritarian laws passed during this
    // multi-crisis period? Count bills with authoritarian effects passed while 3+ crises active.
    const { data: recentAuth } = await supabase
        .from('event_log')
        .select('id')
        .eq('nation_id', bill.nation_id)
        .eq('trigger_key', 'authoritarian_crisis_bonus')
        .gte('fired_at_tick', currentTick - 24); // look back 24 ticks

    const priorCount = (recentAuth || []).length;
    const isFirst = priorCount === 0;
    const approvalBonus = isFirst ? 5 : 2;
    const momentumBonus = isFirst ? 5 : 2;

    // 4. Apply gov_approval bonus
    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, approvalBonus, 'authoritarian_crisis_law');

    // 5. Apply momentum to all governing parties
    const { data: admin } = await supabase
        .from('administrations')
        .select('coalition_parties')
        .eq('nation_id', bill.nation_id)
        .is('ended_at_tick', null)
        .order('started_at_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    const coalitionParties = admin?.coalition_parties || [];
    for (const cp of coalitionParties) {
        if (cp.party_id) {
            await supabase.rpc('adjust_momentum', {
                p_faction_id: cp.party_id,
                p_delta: momentumBonus,
                p_label: `Authoritarian law during crisis (${crisisCount} crises)`,
                p_tick: currentTick,
            });
        }
    }

    // 6. Log event for diminishing returns tracking
    await supabase.from('event_log').insert({
        nation_id: bill.nation_id,
        event_name: isFirst ? 'Authoritarian Law — Crisis Mandate' : 'Authoritarian Law — Continued Mandate',
        trigger_key: 'authoritarian_crisis_bonus',
        fired_at_tick: currentTick,
        category: 'government',
        description_chosen: `${bill.bill_name || 'A bill'} restricting civil liberties passed during ${crisisCount} active crises. Government approval +${approvalBonus}, governing parties +${momentumBonus} momentum${isFirst ? '' : ' (diminished)'}.`,
        effects_applied: {
            bill_id: bill.id,
            crisis_count: crisisCount,
            approval_bonus: approvalBonus,
            momentum_bonus: momentumBonus,
            is_first: isFirst,
            prior_count: priorCount,
        },
    });

    console.log(`[enactBill] Authoritarian crisis bonus: +${approvalBonus} approval, +${momentumBonus} momentum to ${coalitionParties.length} parties (${isFirst ? 'first' : 'diminished'}, ${crisisCount} crises)`);
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

    // FK references are already cleared by repealActiveLaw() before calling this.
    // For the opposed-policy auto-reversal path (bills.js:2369), the original
    // active_law row is replaced by upsert so no FK cleanup is needed there either.
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

// ─── Foundational reform subtype registry ───────────────────────────────────
//
// Single source of truth for dispatching enactFoundationalBill to a subtype.
// Each entry is { matches: bill => bool, enact: async fn }. The first entry
// whose `matches` predicate returns true wins; if none match, the fallthrough
// `enactElectoralMakeup` runs (proposed_seats or preamble-recovered).
//
// Precedence is deliberate — it mirrors the legacy if-cascade order so that
// bills with multiple `proposed_*` fields resolve identically to before.
const FOUNDATIONAL_REFORMS = Object.freeze([
    { matches: b => b.proposed_term_length != null, enact: enactPresidentialTermLength },
    { matches: b => b.proposed_parliamentary_term_length != null, enact: enactLegislativeTermLength },
    { matches: b => b.proposed_term_limit != null, enact: enactPresidentialTermLimits },
    { matches: b => !!b.proposed_constitutional_reform, enact: enactConstitutionalReform },
    { matches: b => !!b.proposed_hos_election_method, enact: enactHosElectionMethod },
    { matches: b => !!b.proposed_hos_title, enact: enactHosTitle },
    { matches: b => !!b.proposed_judicial_appointment_politicization, enact: enactJudicialPoliticization },
    { matches: b => !!b.proposed_electoral_commission_reform, enact: enactElectoralCommissionReform },
    { matches: b => !!b.proposed_party_registration_threshold, enact: enactPartyRegistrationReform },
    { matches: b => !!b.proposed_legislative_quorum_override, enact: enactLegislativeQuorumReform },
    { matches: b => !!b.proposed_constitutional_amendment_streamlining, enact: enactConstitutionalStreamlining },
    { matches: b => !!b.proposed_monarchy_reform, enact: enactMonarchyReform },
]);

export async function enactFoundationalBill(supabase, bill, currentTick) {
    for (const { matches, enact } of FOUNDATIONAL_REFORMS) {
        if (matches(bill)) return enact(supabase, bill, currentTick);
    }
    return enactElectoralMakeup(supabase, bill, currentTick);
}



async function enactPresidentialTermLength(supabase, bill, currentTick) {
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

async function enactLegislativeTermLength(supabase, bill, currentTick) {
    const newParlTermTicks = bill.proposed_parliamentary_term_length;
    const validOptions = GAME_CONFIG.PARLIAMENTARY_TERM_LENGTH_OPTIONS || [24, 36, 48, 60, 72];
    if (!validOptions.includes(newParlTermTicks)) {
        console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_parliamentary_term_length: ${newParlTermTicks}. Marking as failed.`);
        await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.id);
        return false;
    }

    // Get current nation data BEFORE update
    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();
    const oldParlTermTicks = nation?.parliamentary_term_ticks || GAME_CONFIG.PARLIAMENTARY_TERM_TICKS;
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

    // Update nation's parliamentary_term_ticks
    const { error: nationErr } = await supabase.from('nations').update({
        parliamentary_term_ticks: newParlTermTicks
    }).eq('id', bill.nation_id);
    if (nationErr) {
        console.error(`[enactFoundationalBill] Failed to update parliamentary_term_ticks for nation ${bill.nation_id}:`, nationErr.message);
    }

    // Apply mechanical effects based on whether terms got shorter or longer
    if (newParlTermTicks < oldParlTermTicks) {
        // Shortening terms — more elections, more polarization & engagement
        const newPol = Math.min(100, (nation?.polarization || 0) + 2);
        const newEng = Math.min(100, (nation?.political_engagement || 0) + 3);
        const { error: shortErr } = await supabase.from('nations').update({
            polarization: newPol,
            political_engagement: newEng
        }).eq('id', bill.nation_id);
        if (shortErr) console.error(`[enactFoundationalBill] Legislative term shortened stat update failed:`, shortErr.message);
        else console.log(`[enactFoundationalBill] Legislative term shortened: polarization +2, political_engagement +3`);
    } else if (newParlTermTicks > oldParlTermTicks) {
        // Extending terms — less accountability, more stability
        const newLegitimacy = Math.max(0, (nation?.legitimacy || 50) - 3);
        const newStability = Math.min(100, (nation?.stability || 50) + 2);
        const { error: extErr } = await supabase.from('nations').update({
            legitimacy: newLegitimacy,
            stability: newStability
        }).eq('id', bill.nation_id);
        if (extErr) console.error(`[enactFoundationalBill] Legislative term extended stat update failed:`, extErr.message);
        else console.log(`[enactFoundationalBill] Legislative term extended: legitimacy -3, stability +2`);
    }

    // NOTE: We do NOT reschedule the current parliamentary election.
    // The new term length takes effect after the next election completes.

    const newYears = newParlTermTicks / ticksPerYear;
    console.log(`[enactFoundationalBill] Nation ${bill.nation_id} parliamentary term set to ${newYears} years (${newParlTermTicks} ticks).`);
    return true;
}

async function enactPresidentialTermLimits(supabase, bill, currentTick) {
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
        let legitimacyPenalty = 6;
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
                // Base loves it (+3 approval) but anti-democratic (-0.1 credibility)
                await supabase.rpc('adjust_momentum', { p_faction_id: faction.id, p_delta: 3, p_label: 'Term limits abolished (+3)', p_tick: currentTick });
                await adjustCredibility(supabase, faction.id, bill.nation_id, -0.1, 0, currentTick, { source: 'bill:term_limit' });
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

async function enactConstitutionalReform(supabase, bill, currentTick) {
    const targetSystem = bill.proposed_constitutional_reform;
    const validSystems = ['parliamentary', 'constitutional_monarchy', 'presidential', 'semi_presidential'];
    if (!validSystems.includes(targetSystem)) {
        console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_constitutional_reform: ${targetSystem}. Marking as failed.`);
        const { error: failErr } = await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.id);
        if (failErr) console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as failed:`, failErr.message);
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
    const { data: nation, error: nationFetchErr } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();
    if (nationFetchErr || !nation) {
        console.error(`[enactFoundationalBill] Failed to fetch nation ${bill.nation_id} for constitutional reform:`, nationFetchErr?.message);
        return false;
    }
    const currentSystem = getCurrentConstitutionalSystem(nation);

    if (currentSystem === targetSystem) {
        console.warn(`[enactFoundationalBill] Nation ${bill.nation_id} is already ${targetSystem}. No-op.`);
        return true;
    }

    // NOTE: Active floor bills (no-confidence, impeachment, etc.) are NOT cancelled during
    // a constitutional transition. They resolve under the new government type's rules.
    // This is a known edge case — same pattern as the legacy hos_election_method block.
    console.log(`[enactFoundationalBill] Constitutional reform: ${currentSystem} → ${targetSystem} for nation ${bill.nation_id}`);

    // Determine structural changes
    const currentHasPresident = currentSystem === 'presidential' || currentSystem === 'semi_presidential';
    const targetHasPresident = targetSystem === 'presidential' || targetSystem === 'semi_presidential';
    const currentHasPM = currentSystem === 'parliamentary' || currentSystem === 'constitutional_monarchy' || currentSystem === 'semi_presidential';
    const targetHasPM = targetSystem === 'parliamentary' || targetSystem === 'constitutional_monarchy' || targetSystem === 'semi_presidential';
    const currentIsMonarchy = currentSystem === 'constitutional_monarchy';
    const targetIsMonarchy = targetSystem === 'constitutional_monarchy';

    // Build nation update
    const nationUpdate = {
        last_constitutional_reform_tick: currentTick
    };

    // Set target government_type and hos_election_method
    switch (targetSystem) {
        case 'parliamentary':
            nationUpdate.government_type = 'Democracy';
            nationUpdate.hos_election_method = 'appointed';
            break;
        case 'constitutional_monarchy':
            nationUpdate.government_type = 'Democracy';
            nationUpdate.hos_election_method = 'hereditary';
            break;
        case 'presidential':
            nationUpdate.government_type = 'Presidential';
            nationUpdate.hos_election_method = 'direct_vote';
            break;
        case 'semi_presidential':
            nationUpdate.government_type = 'Semi-Presidential';
            nationUpdate.hos_election_method = 'direct_vote';
            break;
    }

    // ── Losing president (Presidential/Semi-Pres → Parliamentary/CM) ──
    if (currentHasPresident && !targetHasPresident) {
        const { error: presErr } = await supabase.from('presidents')
            .update({ is_active: false })
            .eq('nation_id', bill.nation_id)
            .eq('is_active', true);
        if (presErr) console.error('[enactFoundationalBill] Failed to deactivate president:', presErr.message);

        const { error: delPresElErr } = await supabase.from('elections').delete()
            .eq('nation_id', bill.nation_id)
            .eq('status', 'scheduled')
            .eq('election_type', 'presidential');
        if (delPresElErr) console.error('[enactFoundationalBill] Failed to clear presidential elections:', delPresElErr.message);

        const { error: candErr } = await supabase.from('pm_candidates').delete()
            .eq('nation_id', bill.nation_id)
            .eq('candidate_type', 'presidential');
        if (candErr) console.error('[enactFoundationalBill] Failed to clean presidential candidates:', candErr.message);

        // Close administration
        const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        const dateStr = shardData?.current_date || _billTickToDate(currentTick);
        const { error: adminErr } = await supabase.from('administrations')
            .update({ ended_at_tick: currentTick, ended_at_date: dateStr, end_reason: 'constitutional_transition' })
            .eq('nation_id', bill.nation_id)
            .is('ended_at_tick', null);
        if (adminErr) console.error('[enactFoundationalBill] Failed to close administration:', adminErr.message);
        else await _logAdministrationIntegrityIssue(supabase, bill.nation_id, 'foundational_transition_no_president');

        // Fail bills on president's desk (orphaned without a president)
        const { error: deskErr } = await supabase.from('bills')
            .update({ status: 'failed', passed_tick: currentTick })
            .eq('nation_id', bill.nation_id)
            .eq('status', 'president_desk');
        if (deskErr) console.error('[enactFoundationalBill] Failed to clear president desk bills:', deskErr.message);

        // Fail pending impeachment bills and resolve proceedings
        const { error: impeachBillErr } = await supabase.from('bills')
            .update({ status: 'failed', passed_tick: currentTick })
            .eq('nation_id', bill.nation_id)
            .in('bill_type', ['impeachment_motion', 'impeachment_conviction'])
            .in('status', ['committee', 'floor']);
        if (impeachBillErr) console.error('[enactFoundationalBill] Failed to clear impeachment bills:', impeachBillErr.message);

        const { error: impeachProcErr } = await supabase.from('impeachment_proceedings')
            .update({ phase: 'resolved', resolved_tick: currentTick, outcome: 'dismissed_constitutional_transition' })
            .eq('nation_id', bill.nation_id)
            .neq('phase', 'resolved');
        if (impeachProcErr) console.error('[enactFoundationalBill] Failed to resolve impeachment proceedings:', impeachProcErr.message);

        console.log(`[enactFoundationalBill] President deactivated, presidential elections cleared`);
    }

    // ── Losing PM (Parliamentary/CM/Semi-Pres → Presidential) ──
    if (currentHasPM && !targetHasPM) {
        // Dissolve coalition (formed + caretaker)
        const { error: coalErr } = await supabase.from('government_formations')
            .update({ status: 'dissolved' })
            .eq('nation_id', bill.nation_id)
            .in('status', ['formed', 'caretaker']);
        if (coalErr) console.error('[enactFoundationalBill] Failed to dissolve coalition:', coalErr.message);

        // Also expire any in-progress formations
        const { error: formingErr } = await supabase.from('government_formations')
            .update({ status: 'expired' })
            .eq('nation_id', bill.nation_id)
            .eq('status', 'forming');
        if (formingErr) console.error('[enactFoundationalBill] Failed to expire forming coalitions:', formingErr.message);

        const { error: hogErr } = await supabase.from('head_of_government')
            .update({ active: false })
            .eq('nation_id', bill.nation_id)
            .eq('active', true);
        if (hogErr) console.error('[enactFoundationalBill] Failed to deactivate PM:', hogErr.message);

        // Fail pending PM confirmation bills (orphaned without parliamentary system)
        const { error: pmBillErr } = await supabase.from('bills')
            .update({ status: 'failed', passed_tick: currentTick })
            .eq('nation_id', bill.nation_id)
            .eq('bill_type', 'minister_confirmation')
            .eq('ministry_key', 'prime_minister')
            .in('status', ['committee', 'floor']);
        if (pmBillErr) console.error('[enactFoundationalBill] Failed to clear PM confirmation bills:', pmBillErr.message);

        const { error: delParlElErr } = await supabase.from('elections').delete()
            .eq('nation_id', bill.nation_id)
            .eq('status', 'scheduled')
            .eq('election_type', 'parliamentary');
        if (delParlElErr) console.error('[enactFoundationalBill] Failed to clear parliamentary elections:', delParlElErr.message);

        nationUpdate.gov_approval = 50;
        nationUpdate.gov_approval_events = 0;

        console.log(`[enactFoundationalBill] PM deactivated, coalition dissolved`);
    }

    // ── Gaining president (Parliamentary/CM → Presidential/Semi-Pres) ──
    if (!currentHasPresident && targetHasPresident) {
        // Check for existing scheduled presidential election before inserting
        const { data: existingPresEl } = await supabase.from('elections')
            .select('id')
            .eq('nation_id', bill.nation_id)
            .eq('status', 'scheduled')
            .eq('election_type', 'presidential')
            .limit(1);

        if (!existingPresEl || existingPresEl.length === 0) {
            const { error: presElErr } = await supabase.from('elections').insert({
                nation_id: bill.nation_id,
                election_tick: currentTick + 3,
                status: 'scheduled',
                election_type: 'presidential'
            });
            if (presElErr) console.error('[enactFoundationalBill] Failed to schedule presidential election:', presElErr.message);
            else console.log(`[enactFoundationalBill] Presidential election scheduled at tick ${currentTick + 3}`);
        } else {
            console.log(`[enactFoundationalBill] Presidential election already scheduled, skipping`);
        }

        if (targetSystem === 'presidential') {
            const parlTermTicks = Number(nation?.parliamentary_term_ticks) || GAME_CONFIG.PARLIAMENTARY_TERM_TICKS;
            const { error: midtermErr } = await supabase.from('elections').insert({
                nation_id: bill.nation_id,
                election_tick: currentTick + parlTermTicks,
                status: 'scheduled',
                election_type: 'parliamentary'
            });
            if (midtermErr) console.error('[enactFoundationalBill] Failed to schedule midterm:', midtermErr.message);
        }
    }

    // ── Gaining PM (Presidential → Semi-Pres or Parliamentary/CM) ──
    if (!currentHasPM && targetHasPM) {
        nationUpdate.pm_nomination_attempts = 0;

        const { data: existingParlEl } = await supabase.from('elections')
            .select('id')
            .eq('nation_id', bill.nation_id)
            .eq('status', 'scheduled')
            .eq('election_type', 'parliamentary')
            .limit(1);

        if (!existingParlEl || existingParlEl.length === 0) {
            const { error: parlElErr } = await supabase.from('elections').insert({
                nation_id: bill.nation_id,
                election_tick: currentTick + 3,
                status: 'scheduled',
                election_type: 'parliamentary'
            });
            if (parlElErr) console.error('[enactFoundationalBill] Failed to schedule parliamentary election:', parlElErr.message);
            else console.log(`[enactFoundationalBill] Parliamentary election scheduled at tick ${currentTick + 3}`);
        }

        console.log(`[enactFoundationalBill] PM formation triggered`);
    }

    // ── Gaining monarchy (→ Absolute Monarchy) ──
    if (!currentIsMonarchy && targetIsMonarchy) {
        const { firstNames } = getNationNames(nation?.name);
        const monarchFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const dynastyName = bill.proposed_dynasty_name || 'Royal House';
        const dynastyLastName = dynastyName.split(/\s+/).pop() || 'Royal';
        const monarchAge = 36 + Math.floor(Math.random() * 25);

        nationUpdate.dynasty_name = dynastyName;
        nationUpdate.dynasty_established_tick = currentTick;
        if (bill.proposed_dynasty_crest_url) {
            nationUpdate.dynasty_crest_url = bill.proposed_dynasty_crest_url;
        }
        nationUpdate.head_of_state_first_name = monarchFirstName;
        nationUpdate.head_of_state_last_name = dynastyLastName;
        nationUpdate.head_of_state_age = monarchAge;
        nationUpdate.head_of_state_title = isFemaleName(monarchFirstName) ? 'Queen' : 'King';

        console.log(`[enactFoundationalBill] Monarch generated: ${nationUpdate.head_of_state_title} ${monarchFirstName} ${dynastyLastName}, age ${monarchAge}`);
    }

    // ── Losing monarchy (Absolute Monarchy → anything) ──
    if (currentIsMonarchy && !targetIsMonarchy) {
        nationUpdate.dynasty_name = null;
        nationUpdate.dynasty_established_tick = null;
        nationUpdate.dynasty_crest_url = null;
        console.log(`[enactFoundationalBill] Monarchy abolished, dynasty cleared`);
    }

    // ── Stat effects based on target system ──
    const stability = nation?.stability || 50;
    const legitimacy = nation?.legitimacy || 50;
    const politicalEngagement = nation?.political_engagement || 50;
    const polarization = nation?.polarization || 0;
    const civilUnrest = nation?.civil_unrest || 0;

    switch (targetSystem) {
        case 'parliamentary':
            nationUpdate.stability = Math.min(100, stability + 3);
            nationUpdate.legitimacy = Math.min(100, legitimacy + 2);
            break;
        case 'constitutional_monarchy':
            nationUpdate.stability = Math.min(100, stability + 5);
            nationUpdate.legitimacy = Math.max(0, legitimacy - 5);
            break;
        case 'presidential':
            nationUpdate.legitimacy = Math.min(100, legitimacy + 3);
            nationUpdate.political_engagement = Math.min(100, politicalEngagement + 3);
            nationUpdate.polarization = Math.min(100, polarization + 2);
            break;
        case 'semi_presidential':
            nationUpdate.legitimacy = Math.min(100, legitimacy + 2);
            nationUpdate.political_engagement = Math.min(100, politicalEngagement + 2);
            nationUpdate.polarization = Math.min(100, polarization + 3);
            break;
    }

    // Major reform always causes some civil unrest
    nationUpdate.civil_unrest = Math.min(100, civilUnrest + 5);

    // Apply all nation updates
    const { error: nationErr } = await supabase.from('nations').update(nationUpdate).eq('id', bill.nation_id);
    if (nationErr) {
        console.error(`[enactFoundationalBill] Failed to update nation for constitutional reform:`, nationErr.message);
    }

    const systemLabels = {
        parliamentary: 'Parliamentary Democracy',
        constitutional_monarchy: 'Constitutional Monarchy',
        presidential: 'Presidential Republic',
        semi_presidential: 'Semi-Presidential Republic'
    };
    console.log(`[enactFoundationalBill] Nation ${bill.nation_id} constitutional system changed to "${systemLabels[targetSystem]}".`);
    return true;
}

async function enactHosElectionMethod(supabase, bill, currentTick) {
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
        const statUpdate = { stability: newStability, legitimacy: newLegitimacy };

        const { error: statErr } = await supabase.from('nations').update(statUpdate).eq('id', bill.nation_id);
        if (statErr) console.error(`[enactFoundationalBill] Hereditary stat update failed:`, statErr.message);
        else console.log(`[enactFoundationalBill] Constitutional monarchy established: stability +5, legitimacy -5`);
    } else if (newMethod === 'direct_vote') {
        // Direct vote: legitimacy +3, political_engagement +3, polarization +2
        // AND transition Parliamentary → Presidential
        const wasParliamentary = !nation?.government_type?.toLowerCase().includes('president');
        const statUpdate = {
            legitimacy: Math.min(100, (nation?.legitimacy || 50) + 3),
            political_engagement: Math.min(100, (nation?.political_engagement || 50) + 3),
            polarization: Math.min(100, (nation?.polarization || 0) + 2)
        };

        if (wasParliamentary) {
            statUpdate.government_type = 'Presidential';
            console.log(`[enactFoundationalBill] Parliamentary → Presidential transition for nation ${bill.nation_id}`);

            // Close the current coalition/government formation (PM system no longer applies)
            const { error: coalErr } = await supabase.from('government_formations')
                .update({ status: 'dissolved' })
                .eq('nation_id', bill.nation_id)
                .in('status', ['formed', 'caretaker']);
            if (coalErr) console.error('[enactFoundationalBill] Failed to dissolve coalition:', coalErr.message);

            // Deactivate parliamentary head of government (PM)
            const { error: hogErr } = await supabase.from('head_of_government')
                .update({ active: false })
                .eq('nation_id', bill.nation_id)
                .eq('active', true);
            if (hogErr) console.error('[enactFoundationalBill] Failed to deactivate PM:', hogErr.message);

            // Clear any scheduled parliamentary-only elections, keep presidential if any
            const { error: delElErr } = await supabase.from('elections').delete()
                .eq('nation_id', bill.nation_id)
                .eq('status', 'scheduled')
                .eq('election_type', 'parliamentary');
            if (delElErr) console.error('[enactFoundationalBill] Failed to clear parliamentary elections:', delElErr.message);

            // Schedule presidential election 3 ticks out (allows endorsement window)
            const { error: presElErr } = await supabase.from('elections').insert({
                nation_id: bill.nation_id,
                election_tick: currentTick + 3,
                status: 'scheduled',
                election_type: 'presidential'
            });
            if (presElErr) console.error('[enactFoundationalBill] Failed to schedule presidential election:', presElErr.message);
            else console.log(`[enactFoundationalBill] Presidential election scheduled at tick ${currentTick + 3}`);

            // Also schedule the first parliamentary midterm
            const parlTermTicks = Number(nation?.parliamentary_term_ticks) || 24;
            const { error: midtermErr } = await supabase.from('elections').insert({
                nation_id: bill.nation_id,
                election_tick: currentTick + parlTermTicks,
                status: 'scheduled',
                election_type: 'parliamentary'
            });
            if (midtermErr) console.error('[enactFoundationalBill] Failed to schedule midterm:', midtermErr.message);

            // Reset government approval for the transition
            statUpdate.gov_approval = 50;
            statUpdate.gov_approval_events = 0;
        }

        const { error: statErr } = await supabase.from('nations').update(statUpdate).eq('id', bill.nation_id);
        if (statErr) console.error(`[enactFoundationalBill] Direct vote stat update failed:`, statErr.message);
        else console.log(`[enactFoundationalBill] Direct HoS vote established: legitimacy +3, political_engagement +3, polarization +2${wasParliamentary ? ', gov type → Presidential' : ''}`);
    } else if (newMethod === 'appointed') {
        // Appointed by Parliament: transition Presidential → Parliamentary if applicable
        const wasPresidential = nation?.government_type?.toLowerCase().includes('president');

        if (wasPresidential) {
            console.log(`[enactFoundationalBill] Presidential → Parliamentary transition for nation ${bill.nation_id}`);

            // Deactivate the president
            const { error: presErr } = await supabase.from('presidents')
                .update({ is_active: false })
                .eq('nation_id', bill.nation_id)
                .eq('is_active', true);
            if (presErr) console.error('[enactFoundationalBill] Failed to deactivate president:', presErr.message);

            // Change government type
            const { error: govErr } = await supabase.from('nations').update({
                government_type: 'Democracy',
                gov_approval: 50,
                gov_approval_events: 0
            }).eq('id', bill.nation_id);
            if (govErr) console.error(`[enactFoundationalBill] Gov type update failed:`, govErr.message);

            // Clear presidential elections, schedule parliamentary
            const { error: clearElErr } = await supabase.from('elections').delete()
                .eq('nation_id', bill.nation_id)
                .eq('status', 'scheduled');
            if (clearElErr) console.error('[enactFoundationalBill] Failed to clear scheduled elections:', clearElErr.message);

            const { error: parlElErr } = await supabase.from('elections').insert({
                nation_id: bill.nation_id,
                election_tick: currentTick + 3,
                status: 'scheduled',
                election_type: 'parliamentary'
            });
            if (parlElErr) console.error('[enactFoundationalBill] Failed to schedule parliamentary election:', parlElErr.message);
            else console.log(`[enactFoundationalBill] Parliamentary election scheduled at tick ${currentTick + 3}`);

            // Clean up presidential candidates
            const { error: candErr } = await supabase.from('pm_candidates').delete()
                .eq('nation_id', bill.nation_id)
                .eq('candidate_type', 'presidential');
            if (candErr) console.error('[enactFoundationalBill] Failed to clean presidential candidates:', candErr.message);

            // Close administration for transition
            const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
            const dateStr = shardData?.current_date || _billTickToDate(currentTick);
            const { error: closeAdminErr } = await supabase.from('administrations')
                .update({ ended_at_tick: currentTick, ended_at_date: dateStr, end_reason: 'constitutional_transition' })
                .eq('nation_id', bill.nation_id)
                .is('ended_at_tick', null);
            if (closeAdminErr) console.error('[enactFoundationalBill] Failed to close administration on PM removal transition:', closeAdminErr.message);
            else await _logAdministrationIntegrityIssue(supabase, bill.nation_id, 'foundational_transition_no_pm');

            console.log(`[enactFoundationalBill] Presidential → Parliamentary Democracy, election at tick ${currentTick + 3}`);
        }
        // No stat changes for appointed (it's the default low-friction option)
    }

    const methodLabels = { direct_vote: 'Direct Popular Vote', appointed: 'Appointed by Parliament', hereditary: 'Constitutional Monarchy' };
    console.log(`[enactFoundationalBill] Nation ${bill.nation_id} HoS election method set to "${methodLabels[newMethod]}".`);
    return true;
}

async function enactHosTitle(supabase, bill, currentTick) {
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

async function enactJudicialPoliticization(supabase, bill, currentTick) {
    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();

    const { error: billErr } = await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    if (billErr) { console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message); return false; }

    const cappedJudicial = Math.min(Number(nation?.judicial_independence ?? 50), 30);
    const newLegitimacy = Math.max(0, (nation?.legitimacy ?? 50) - 5);
    const newFreedom = Math.max(0, (nation?.freedom_index ?? 50) - 3);

    const { error: nationErr } = await supabase.from('nations').update({
        judicial_appointment_politicization: true,
        judicial_independence: cappedJudicial,
        legitimacy: newLegitimacy,
        freedom_index: newFreedom
    }).eq('id', bill.nation_id);
    if (nationErr) console.error(`[enactFoundationalBill] Failed to update nation for judicial politicization:`, nationErr.message);

    const isPres = hasElectedPresident(nation);
    const mechanicDesc = isPres
        ? 'Impeachment conviction now requires 75% (up from 67%). The courts no longer serve as a check on executive power.'
        : 'Votes of no confidence now require 60% (up from 50%+1). The ruling coalition is shielded from parliamentary removal.';

    await supabase.from('event_log').insert({
        nation_id: bill.nation_id,
        event_name: 'FOUNDATIONAL_LAW_PASSED',
        trigger_key: 'judicial_appointment_politicization',
        description_used: `The Judicial Appointment Politicization Act has passed. The ruling coalition now appoints judges directly. Judicial independence is permanently capped at 30. ${mechanicDesc}`,
        category: 'POLITICAL',
        effects_applied: {
            law: 'judicial_appointment_politicization',
            judicial_independence_cap: 30,
            legitimacy: -5,
            freedom_index: -3,
            threshold_change: isPres ? 'impeachment_conviction 67%→75%' : 'no_confidence 50%+1→60%'
        },
        fired_at_tick: currentTick
    });

    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');
    console.log(`[enactFoundationalBill] Judicial Appointment Politicization Act enacted for nation ${bill.nation_id}`);
    return true;
}

async function enactElectoralCommissionReform(supabase, bill, currentTick) {
    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();

    const { error: billErr } = await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    if (billErr) { console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message); return false; }

    const newLegitimacy = Math.max(0, (nation?.legitimacy ?? 50) - 5);
    const newPolarization = Math.min(100, (nation?.polarization ?? 0) + 3);

    const { error: nationErr } = await supabase.from('nations').update({
        electoral_commission_reform: true,
        legitimacy: newLegitimacy,
        polarization: newPolarization
    }).eq('id', bill.nation_id);
    if (nationErr) console.error(`[enactFoundationalBill] Failed to update nation for electoral commission reform:`, nationErr.message);

    await supabase.from('event_log').insert({
        nation_id: bill.nation_id,
        event_name: 'FOUNDATIONAL_LAW_PASSED',
        trigger_key: 'electoral_commission_reform',
        description_used: 'The Electoral Commission Reform Act has passed. The ruling coalition now controls the election commission. Parliamentary elections are tilted in favor of the governing parties — opposition parties face an administrative disadvantage in seat allocation.',
        category: 'POLITICAL',
        effects_applied: {
            law: 'electoral_commission_reform',
            legitimacy: -5,
            polarization: 3,
            seat_bonus: '5-10% random per election'
        },
        fired_at_tick: currentTick
    });

    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');
    console.log(`[enactFoundationalBill] Electoral Commission Reform Act enacted for nation ${bill.nation_id}`);
    return true;
}

async function enactPartyRegistrationReform(supabase, bill, currentTick) {
    const threshold = Number(bill.proposed_party_registration_threshold);
    if (![5, 10, 15].includes(threshold)) {
        console.error(`[enactFoundationalBill] Invalid party registration threshold: ${threshold}`);
        await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id);
        return false;
    }

    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();

    const { error: billErr } = await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    if (billErr) { console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message); return false; }

    const newLegitimacy = Math.max(0, (nation?.legitimacy ?? 50) - 4);
    const newPolarization = Math.min(100, (nation?.polarization ?? 0) + 5);
    const newFreedom = Math.max(0, (nation?.freedom_index ?? 50) - 3);

    const { error: nationErr } = await supabase.from('nations').update({
        party_registration_threshold: threshold,
        legitimacy: newLegitimacy,
        polarization: newPolarization,
        freedom_index: newFreedom
    }).eq('id', bill.nation_id);
    if (nationErr) console.error(`[enactFoundationalBill] Failed to update nation for party registration act:`, nationErr.message);

    await supabase.from('event_log').insert({
        nation_id: bill.nation_id,
        event_name: 'FOUNDATIONAL_LAW_PASSED',
        trigger_key: 'party_registration_act',
        description_used: `The Political Party Registration Act has passed. Parties holding less than ${threshold}% of legislative seats will have their seats reallocated after elections. Affected parties cannot sponsor bills, vote, or hold ministries.`,
        category: 'POLITICAL',
        effects_applied: {
            law: 'party_registration_act',
            threshold_pct: threshold,
            legitimacy: -4,
            polarization: 5,
            freedom_index: -3
        },
        fired_at_tick: currentTick
    });

    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');
    console.log(`[enactFoundationalBill] Political Party Registration Act enacted for nation ${bill.nation_id} (threshold: ${threshold}%)`);
    return true;
}

async function enactLegislativeQuorumReform(supabase, bill, currentTick) {
    const quorumPct = Number(bill.proposed_legislative_quorum_override);
    if (![25, 30, 40].includes(quorumPct)) {
        console.error(`[enactFoundationalBill] Invalid quorum override: ${quorumPct}`);
        await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id);
        return false;
    }

    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();

    const { error: billErr } = await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    if (billErr) { console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message); return false; }

    const newLegitimacy = Math.max(0, (nation?.legitimacy ?? 50) - 3);
    const newFreedom = Math.max(0, (nation?.freedom_index ?? 50) - 2);

    const { error: nationErr } = await supabase.from('nations').update({
        legislative_quorum_override: quorumPct,
        legitimacy: newLegitimacy,
        freedom_index: newFreedom
    }).eq('id', bill.nation_id);
    if (nationErr) console.error(`[enactFoundationalBill] Failed to update nation for quorum reform:`, nationErr.message);

    await supabase.from('event_log').insert({
        nation_id: bill.nation_id,
        event_name: 'FOUNDATIONAL_LAW_PASSED',
        trigger_key: 'legislative_quorum_reform',
        description_used: `The Legislative Quorum Reform Act has passed. The quorum requirement for standard bills has been lowered from 50% to ${quorumPct}%. The ruling coalition can now pass legislation with fewer participants.`,
        category: 'POLITICAL',
        effects_applied: { law: 'legislative_quorum_reform', quorum_pct: quorumPct, legitimacy: -3, freedom_index: -2 },
        fired_at_tick: currentTick
    });

    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');
    console.log(`[enactFoundationalBill] Legislative Quorum Reform Act enacted for nation ${bill.nation_id} (quorum: ${quorumPct}%)`);
    return true;
}

async function enactConstitutionalStreamlining(supabase, bill, currentTick) {
    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();

    const { error: billErr } = await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    if (billErr) { console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message); return false; }

    const { error: nationErr } = await supabase.from('nations').update({
        constitutional_amendment_streamlining: true,
        legitimacy: Math.max(0, (nation?.legitimacy ?? 50) - 8),
        polarization: Math.min(100, (nation?.polarization ?? 0) + 5),
        freedom_index: Math.max(0, (nation?.freedom_index ?? 50) - 5)
    }).eq('id', bill.nation_id);
    if (nationErr) console.error(`[enactFoundationalBill] Failed to update nation for constitutional streamlining:`, nationErr.message);

    await supabase.from('event_log').insert({
        nation_id: bill.nation_id,
        event_name: 'FOUNDATIONAL_LAW_PASSED',
        trigger_key: 'constitutional_amendment_streamlining',
        description_used: 'The Constitutional Amendment Streamlining Act has passed. The supermajority threshold for foundational bills has been lowered from 67% to 55%. The constitution is now far easier to rewrite.',
        category: 'POLITICAL',
        effects_applied: { law: 'constitutional_amendment_streamlining', new_threshold: '55%', legitimacy: -8, polarization: 5, freedom_index: -5 },
        fired_at_tick: currentTick
    });

    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');
    console.log(`[enactFoundationalBill] Constitutional Amendment Streamlining enacted for nation ${bill.nation_id}`);
    return true;
}

async function enactMonarchyReform(supabase, bill, currentTick) {
    const reformKey = bill.proposed_monarchy_reform;
    const { data: nation } = await supabase.from('nations')
        .select('id, name, government_type, monarch_faction_id, legitimacy, gov_approval')
        .eq('id', bill.nation_id).single();

    if (!nation) { console.error(`[enactFoundationalBill] Nation not found for monarchy reform`); return false; }

    const { error: billErr } = await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    if (billErr) { console.error(`[enactFoundationalBill] Failed to mark bill as passed:`, billErr.message); return false; }

    const MONARCHY_REFORMS = {
        freedom_of_press: {
            statChanges: { press_freedom: 5, freedom_index: 3, legitimacy: 2 },
            nationFlag: 'monarchy_freedom_of_press',
            eventDesc: 'The Freedom of the Press Act has been enacted. Independent media is now legal. The Crown gains legitimacy through restraint.',
        },
        right_of_assembly: {
            statChanges: { freedom_index: 3, civil_unrest: -2, stability: 2 },
            nationFlag: 'monarchy_right_of_assembly',
            eventDesc: 'The Right of Assembly Act has been enacted. Political gatherings and peaceful protest are now legal.',
        },
        independent_judiciary: {
            statChanges: { judicial_independence: 5, legitimacy: -2, corruption: -3 },
            nationFlag: 'monarchy_independent_judiciary',
            eventDesc: 'The Independent Judiciary Act has been enacted. Courts now operate free from royal interference.',
        },
        parliamentary_inquiry: {
            statChanges: { corruption: -3, legitimacy: -3, transparency: 3 },
            nationFlag: 'monarchy_parliamentary_inquiry',
            eventDesc: 'The Parliamentary Inquiry Act has been enacted. Parliament can now investigate the Crown\'s finances and decisions.',
        },
        civil_liberties_charter: {
            statChanges: { freedom_index: 5, stability: 2, legitimacy: -3, happiness: 3 },
            nationFlag: 'monarchy_civil_liberties_charter',
            eventDesc: 'The Civil Liberties Charter has been enacted. Individual rights are now codified and cannot be overridden by royal decree.',
        },
        electoral_reform: {
            statChanges: { freedom_index: 3, legitimacy: -5, political_engagement: 5 },
            nationFlag: 'monarchy_electoral_reform',
            eventDesc: 'The Electoral Reform Act has been enacted. The legal framework for democratic elections now exists. This is the point of no return.',
        },
        parliamentary_supremacy: {
            statChanges: { legitimacy: -5, stability: -3, freedom_index: 5, political_engagement: 5 },
            nationFlag: 'monarchy_parliamentary_supremacy',
            eventDesc: 'The Parliamentary Supremacy Act has been enacted. Parliament can now override royal veto with a two-thirds majority. The monarch\'s legislative power is effectively advisory.',
        },
        act_of_abdication: {
            statChanges: { stability: -5, civil_unrest: 10, freedom_index: 8, legitimacy: -10 },
            nationFlag: null,
            eventDesc: 'The Act of Abdication has been enacted. The monarchy is dissolved. Democratic elections are scheduled.',
        },
    };

    const reform = MONARCHY_REFORMS[reformKey];
    if (!reform) { console.warn(`[enactFoundationalBill] Unknown monarchy reform: ${reformKey}`); return false; }

    // Apply stat changes
    if (reform.statChanges && Object.keys(reform.statChanges).length > 0) {
        const { error: statErr } = await supabase.rpc('increment_nation_stats', {
            p_nation_id: bill.nation_id,
            p_changes: reform.statChanges,
        });
        if (statErr) console.error(`[enactFoundationalBill] Monarchy reform stat update failed:`, statErr.message);
    }

    // Set nation flag (for prerequisite tracking)
    if (reform.nationFlag) {
        await supabase.from('nations').update({ [reform.nationFlag]: true }).eq('id', bill.nation_id);
    }

    // Act of Abdication: dissolve monarchy, schedule elections
    if (reformKey === 'act_of_abdication') {
        // Clear monarch
        await supabase.from('nations').update({
            government_type: 'Democracy',
            monarch_faction_id: null,
            failed_formation_attempts: 0,
        }).eq('id', bill.nation_id);

        // Reset legitimacy and gov approval for fresh start
        await supabase.rpc('increment_nation_stats', {
            p_nation_id: bill.nation_id,
            p_changes: { legitimacy: 50 - (Number(nation.legitimacy) || 50), gov_approval: 40 - (Number(nation.gov_approval) || 50) },
        }).catch(() => {});

        // Dissolve any existing coalition
        await supabase.from('active_coalitions').update({ status: 'dissolved', dissolved_at: new Date().toISOString() })
            .eq('nation_id', bill.nation_id).in('status', ['formed', 'active']);

        // Deactivate PM
        await supabase.from('head_of_government').update({ active: false })
            .eq('nation_id', bill.nation_id).eq('active', true);

        // Schedule election 2 ticks from now
        await supabase.from('elections').insert({
            nation_id: bill.nation_id,
            election_tick: currentTick + 2,
            election_type: 'parliamentary',
            status: 'scheduled',
            trigger: 'abdication',
        });

        console.log(`[enactFoundationalBill] Monarchy dissolved for ${nation.name}. Election scheduled at tick ${currentTick + 2}.`);
    }

    // Log event
    await supabase.from('event_log').insert({
        nation_id: bill.nation_id,
        event_name: 'FOUNDATIONAL_LAW_PASSED',
        trigger_key: 'monarchy_reform_' + reformKey,
        description_used: reform.eventDesc,
        category: 'POLITICAL',
        effects_applied: { law: reformKey, tag: 'eroding_the_monarchy', ...reform.statChanges },
        fired_at_tick: currentTick,
    });

    console.log(`[enactFoundationalBill] [Eroding the Monarchy] ${reformKey} enacted for nation ${bill.nation_id}`);
    return true;
}

async function enactElectoralMakeup(supabase, bill, currentTick) {
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
        .select('id, is_acting')
        .eq('nation_id', bill.nation_id)
        .eq('ministry_key', bill.ministry_key)
        .eq('is_active', true)
        .maybeSingle();

    if (fetchErr) {
        console.warn('[syncFailedMinisterConfirmationBill] Failed to fetch ministry row:', fetchErr.message);
        return;
    }
    if (!ministry) return;

    // If an acting minister is in place, restore 'acting' status instead of 'rejected'
    const { error: updateErr } = await supabase
        .from('ministries')
        .update({
            confirmation_status: ministry.is_acting ? 'acting' : 'rejected',
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
 * 3. Fire event log entries for retirements and lapsed negotiations.
 * 4. Show retirement warning at (term_length - AMBASSADOR_RETIREMENT_WARNING) ticks.
 *
 * Note: Retired ambassadorships remain vacant until a nomination vote is put forth.
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
                    description_chosen: `${nation.name}'s ambassador has retired. ${lapsedProposals.length} pending negotiation(s) have lapsed. A new ambassador must be nominated before negotiations can resume.`,
                    fired_at_tick: currentTick
                });
            }

            // 3. Fire retirement event — ambassadorship remains vacant until nomination vote
            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'Ambassador Retired',
                category: 'Diplomatic',
                description_chosen: `${ambName} has retired after ${yearsServed} year${yearsServed !== 1 ? 's' : ''} of service as Ambassador to ${targetNationName}. The post is now vacant until a replacement is nominated and confirmed.`,
                fired_at_tick: currentTick
            });

            results.push({ ambassadorId: amb.id, name: ambName, target: targetNationName, action: 'retired' });
            console.log(`[processAmbassadorRetirements] ${ambName} retired from ${nation.name} → ${targetNationName}. Post is now vacant.`);

        // ---- RETIREMENT WARNING (3 ticks before) ----
        } else if (ticksRemaining <= DIPLOMACY_CONFIG.AMBASSADOR_RETIREMENT_WARNING && !amb.retirement_warning_shown) {
            await supabase.from('ambassadors')
                .update({ retirement_warning_shown: true })
                .eq('id', amb.id);

            await supabase.from('event_log').insert({
                nation_id: nation.id,
                event_name: 'Ambassador Retirement Approaching',
                category: 'Diplomatic',
                description_chosen: `Ambassador ${ambName} to ${targetNationName} will retire in ${ticksRemaining} tick${ticksRemaining !== 1 ? 's' : ''}. Conclude any active negotiations and prepare a nomination for their replacement.`,
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
