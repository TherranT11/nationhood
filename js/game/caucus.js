/**
 * caucus.js — Caucus System for dominant-party internal factions
 *
 * When a party holds >= 50% of parliamentary seats, internal caucuses
 * activate based on ideology axis spread across voter blocs. These
 * caucuses can defect on bills that touch their dominant axis.
 */

import { GAME_CONFIG } from './config.js';
import { IDEOLOGY_AXES, IDEOLOGY_TO_AXIS } from './ideology.js';
import { fetchActiveCoalition } from './government-structure.js';

// ==================== CONSTANTS ====================

export const CAUCUS_CONFIG = {
    THRESHOLD: 0.50,
    TIERS: [
        { min: 0.50, max: 0.59, factions: 2 },
        { min: 0.60, max: 0.69, factions: 3 },
        { min: 0.70, max: 0.79, factions: 4 },
        { min: 0.80, max: 1.00, factions: 5 },
    ],
    DEFAULT_RELATIONSHIP: 65,
    WHIP_AP_COST_BASE: 1,
    WHIP_AP_COST_LARGE: 2,       // for factions with seat_share > 0.20
    WHIP_LARGE_THRESHOLD: 0.20,
    // Disposition thresholds (bill_score on faction's axis)
    THRESHOLD_ALIGNED: 0,
    THRESHOLD_NERVOUS: -15,
    THRESHOLD_RANGE: 20,          // how much relationship shifts thresholds
    // Non-governing factions are 15% more trigger-happy
    NON_GOVERNING_MODIFIER: 0.85,
    // Relationship score deltas
    REL_BILL_ALIGNED: 7,
    REL_BILL_NERVOUS_UNWHIPPED: 5,
    REL_BILL_OPPOSED_PASS: -20,
    REL_WHIP: 3,
    // REL_PLEDGE_HONOURED / REL_PLEDGE_BETRAYED: reserved for future pledge system
    REL_DECAY: -2,
    REL_DECAY_TICK_WINDOW: 10,    // no positive bills in last N ticks
    // Relationship = 0 means permanently opposed on any touching bill
    REL_VOLATILE_THRESHOLD: 30,
};

/** Wing names per axis, keyed by dominant_axis */
export const CAUCUS_WING_NAMES = {
    liberty_equality:           { left: 'Civil Libertarians',    right: 'Egalitarians' },
    tradition_progress:         { left: 'Traditionalist Caucus', right: 'Reform Caucus' },
    security_freedom:           { left: 'Security Hawks',        right: 'Civil Liberties Caucus' },
    globalism_nationalism:      { left: 'Internationalists',     right: 'National Interest Caucus' },
    individualism_collectivism: { left: 'Free Market Caucus',    right: 'Collectivist Caucus' },
};


// ==================== TIER HELPERS ====================

/** Get the number of caucus factions for a given seat share. Returns 0 if below threshold. */
export function getCaucusFactionCount(seatShare) {
    for (const tier of CAUCUS_CONFIG.TIERS) {
        if (seatShare >= tier.min && seatShare <= tier.max) return tier.factions;
    }
    if (seatShare > 1.0) return CAUCUS_CONFIG.TIERS[CAUCUS_CONFIG.TIERS.length - 1].factions;
    return 0;
}


// ==================== ACTIVATION / DEACTIVATION ====================

/**
 * Evaluate caucus activation for all parties in a nation.
 * Called once per tick. Activates or deactivates caucuses based on seat share.
 */
export async function evaluateCaucusActivation(supabase, nationId, totalSeats) {
    const { data: parties, error } = await supabase
        .from('factions')
        .select('id, faction_name, seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');

    if (error || !parties || parties.length === 0) return;

    for (const party of parties) {
        const seatShare = (party.seats || 0) / totalSeats;
        const targetCount = getCaucusFactionCount(seatShare);

        // Load existing active caucuses for this party
        const { data: existing } = await supabase
            .from('caucus_factions')
            .select('id, dominant_axis, wing_end, is_active')
            .eq('party_id', party.id);

        const activeCaucuses = (existing || []).filter(c => c.is_active);

        if (targetCount === 0 && activeCaucuses.length > 0) {
            // Deactivate all
            await supabase
                .from('caucus_factions')
                .update({ is_active: false })
                .eq('party_id', party.id)
                .eq('is_active', true);
            console.log(`[Caucus] Deactivated all caucuses for ${party.faction_name} (seats ${party.seats}/${totalSeats} = ${(seatShare * 100).toFixed(1)}%)`);
        } else if (targetCount > 0 && activeCaucuses.length === 0) {
            // First activation
            await assignCaucusFactions(supabase, party, nationId, targetCount);
            console.log(`[Caucus] Activated ${targetCount} caucuses for ${party.faction_name} (${(seatShare * 100).toFixed(1)}%)`);
        } else if (targetCount > activeCaucuses.length) {
            // Crossed a tier boundary upward — add new factions
            const existingAxes = new Set(activeCaucuses.map(c => c.dominant_axis));
            const additionalCount = targetCount - activeCaucuses.length;
            await assignCaucusFactions(supabase, party, nationId, targetCount, existingAxes);
            console.log(`[Caucus] Added ${additionalCount} caucuses for ${party.faction_name} (now ${targetCount} total)`);
        }
        // targetCount < activeCaucuses.length: don't remove on downward tier shift
        // — only full deactivation below 50%
    }
}


// ==================== FACTION ASSIGNMENT ====================

/**
 * Assign caucus factions to a party based on ideology axis spread.
 *
 * @param {object} supabase
 * @param {object} party - { id, faction_name, seats }
 * @param {string} nationId
 * @param {number} totalFactionCount - Total desired caucus factions (including existing)
 * @param {Set<string>} [existingAxes] - Axes already assigned (skip these)
 */
export async function assignCaucusFactions(supabase, party, nationId, totalFactionCount, existingAxes = new Set()) {
    // voter_blocs table removed — use empty array for spread calculation
    const blocs = [];

    // Calculate spread per axis, weighted by bloc preference for this party
    const axisKeys = IDEOLOGY_AXES.map(a => a.key);
    const axisSpreads = [];

    for (const axisKey of axisKeys) {
        if (existingAxes.has(axisKey)) continue;

        const colName = 'axis_' + axisKey;
        let weightedMin = 100, weightedMax = 0;
        let totalWeight = 0;
        let leftWeight = 0, rightWeight = 0;

        for (const bloc of blocs) {
            const score = bloc[colName] ?? 50;
            const weight = 30 * (bloc.population_weight || 1);
            if (weight <= 0) continue;

            totalWeight += weight;
            if (score < weightedMin) weightedMin = score;
            if (score > weightedMax) weightedMax = score;

            // Accumulate weight for each wing
            if (score < 45) leftWeight += weight;
            else if (score > 55) rightWeight += weight;
        }

        const spread = weightedMax - weightedMin;
        axisSpreads.push({
            axisKey,
            spread,
            leftWeight: leftWeight / (totalWeight || 1),
            rightWeight: rightWeight / (totalWeight || 1),
        });
    }

    // Sort by spread descending, take the top axes we need
    axisSpreads.sort((a, b) => b.spread - a.spread);
    // Each axis produces 2 factions (one per wing)
    const axesNeeded = Math.ceil(totalFactionCount / 2);
    const newAxesCount = axesNeeded - existingAxes.size;
    const selectedAxes = axisSpreads.slice(0, Math.max(newAxesCount, 0));

    // Create two caucus factions per selected axis
    for (const axis of selectedAxes) {
        const wingNames = CAUCUS_WING_NAMES[axis.axisKey];
        if (!wingNames) continue;

        const totalWingWeight = axis.leftWeight + axis.rightWeight || 1;

        for (const wing of ['left', 'right']) {
            const wingWeight = wing === 'left' ? axis.leftWeight : axis.rightWeight;
            // Seat share: proportional to wing weight, minimum 0.12 (~10-15% of party seats)
            const seatShare = Math.max(0.12, Math.min(0.40, wingWeight / totalWingWeight * 0.50));

            await supabase.from('caucus_factions').insert({
                party_id: party.id,
                nation_id: nationId,
                name: wingNames[wing],
                dominant_axis: axis.axisKey,
                wing_end: wing,
                seat_share: Math.round(seatShare * 1000) / 1000,
                relationship_score: CAUCUS_CONFIG.DEFAULT_RELATIONSHIP,
                is_active: true,
            });
        }
    }
}


// ==================== BILL AXIS SCORE EXTRACTION ====================

/**
 * Extract net ideology axis scores from a bill's articles.
 * Returns { axisKey: netScore } where positive = right pole, negative = left pole.
 * Also identifies the primary axis (highest absolute score).
 */
export function extractBillAxisScores(billArticles) {
    const axisScores = {};

    for (const art of (billArticles || [])) {
        const p = art.policies || art;
        if (!p) continue;

        const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
            ? p.ideologies.map(i => i.toUpperCase())
            : (p.ideology ? [p.ideology.toUpperCase()] : []);

        for (const tag of ideos) {
            const mapping = IDEOLOGY_TO_AXIS[tag];
            if (!mapping) continue;
            axisScores[mapping.axisKey] = (axisScores[mapping.axisKey] || 0) + mapping.direction;
        }
    }

    // Determine primary axis
    let primaryAxis = null;
    let maxAbs = 0;
    for (const [key, score] of Object.entries(axisScores)) {
        if (Math.abs(score) > maxAbs) {
            maxAbs = Math.abs(score);
            primaryAxis = key;
        }
    }

    return { axisScores, primaryAxis };
}


// ==================== DISPOSITION CALCULATION ====================

/**
 * Calculate caucus dispositions for a bill. Call when a bill moves to floor
 * or when vote tallies are recalculated.
 *
 * @param {object} supabase
 * @param {string} billId
 * @param {string} nationId
 * @param {Array} billArticles - bill_articles rows with policies
 * @returns {Array} disposition records
 */
export async function calculateCaucusDispositions(supabase, billId, nationId, billArticles) {
    const { axisScores, primaryAxis } = extractBillAxisScores(billArticles);

    // No ideology content → no caucus impact
    if (!primaryAxis) return [];

    // Load active caucus factions
    const { data: caucuses, error } = await supabase
        .from('caucus_factions')
        .select('id, party_id, name, dominant_axis, wing_end, seat_share, relationship_score')
        .eq('nation_id', nationId)
        .eq('is_active', true);

    if (error || !caucuses || caucuses.length === 0) return [];

    // Load party seats for vote calculation
    const partyIds = [...new Set(caucuses.map(c => c.party_id))];
    const { data: parties } = await supabase
        .from('factions')
        .select('id, seats')
        .in('id', partyIds);

    const partySeatsMap = {};
    for (const p of (parties || [])) partySeatsMap[p.id] = p.seats || 0;

    // Check which parties are in the governing coalition
    const coalition = await fetchActiveCoalition(supabase, nationId);
    const coalitionPartyIds = new Set(coalition?.party_ids || []);

    const dispositions = [];

    for (const caucus of caucuses) {
        const billScore = axisScores[caucus.dominant_axis];

        // Bill doesn't touch this axis → not triggered
        if (billScore === undefined || billScore === 0) {
            dispositions.push({
                caucus_faction_id: caucus.id,
                bill_id: billId,
                disposition: 'not_triggered',
                votes_affected: 0,
                whipped: false,
            });
            continue;
        }

        // Determine if bill moves toward or away from this faction's wing
        // wing_end='left' means faction favors negative axis scores (left pole)
        // wing_end='right' means faction favors positive axis scores (right pole)
        const favoredDirection = caucus.wing_end === 'left' ? -1 : 1;
        const effectiveScore = billScore * favoredDirection;

        // Secondary axis: cap at NERVOUS (never OPPOSED)
        const isSecondary = caucus.dominant_axis !== primaryAxis;

        // Relationship modifier: higher rel = more tolerant
        const relModifier = (caucus.relationship_score - 50) / 100 * CAUCUS_CONFIG.THRESHOLD_RANGE;

        // Non-governing parties have lower thresholds (trigger more easily)
        const isGoverning = coalitionPartyIds.has(caucus.party_id);
        const govMod = isGoverning ? 1.0 : CAUCUS_CONFIG.NON_GOVERNING_MODIFIER;

        const effectiveNervous = (CAUCUS_CONFIG.THRESHOLD_NERVOUS + relModifier) * govMod;
        const effectiveAligned = CAUCUS_CONFIG.THRESHOLD_ALIGNED + relModifier;

        // Relationship = 0: permanently opposed on any touching bill
        let disposition;
        if (caucus.relationship_score === 0) {
            disposition = 'opposed';
        } else if (effectiveScore >= effectiveAligned) {
            disposition = 'aligned';
        } else if (effectiveScore >= effectiveNervous || isSecondary) {
            disposition = 'nervous';
        } else {
            disposition = 'opposed';
        }

        const partySeats = partySeatsMap[caucus.party_id] || 0;
        const votesAffected = disposition === 'not_triggered' || disposition === 'aligned'
            ? 0
            : Math.round(partySeats * caucus.seat_share);

        dispositions.push({
            caucus_faction_id: caucus.id,
            bill_id: billId,
            disposition,
            votes_affected: votesAffected,
            whipped: false,
        });
    }

    // Upsert all dispositions
    if (dispositions.length > 0) {
        const { error: upsertErr } = await supabase
            .from('caucus_dispositions')
            .upsert(dispositions, { onConflict: 'caucus_faction_id,bill_id' });

        if (upsertErr) {
            console.error(`[Caucus] Failed to upsert dispositions for bill ${billId}:`, upsertErr.message);
        }
    }

    return dispositions;
}


// ==================== VOTE ADJUSTMENT ====================

/**
 * Calculate total caucus votes withheld for a bill.
 * OPPOSED factions subtract from YES votes. NERVOUS (not whipped) shown as soft but not subtracted.
 *
 * @returns {{ withheld: number, nervousAtRisk: number, details: Array }}
 */
export async function calculateCaucusVoteAdjustment(supabase, billId) {
    const { data: dispositions, error } = await supabase
        .from('caucus_dispositions')
        .select('caucus_faction_id, disposition, votes_affected, whipped, caucus_factions(name, party_id)')
        .eq('bill_id', billId);

    if (error || !dispositions || dispositions.length === 0) {
        return { withheld: 0, nervousAtRisk: 0, details: [] };
    }

    let withheld = 0;
    let nervousAtRisk = 0;
    const details = [];

    for (const d of dispositions) {
        if (d.disposition === 'opposed' && !d.whipped) {
            withheld += d.votes_affected;
            details.push({ name: d.caucus_factions?.name, disposition: 'opposed', votes: d.votes_affected });
        } else if (d.disposition === 'nervous' && !d.whipped) {
            nervousAtRisk += d.votes_affected;
            details.push({ name: d.caucus_factions?.name, disposition: 'nervous', votes: d.votes_affected });
        }
    }

    // Update the bill's caucus_votes_withheld (always write, so stale values are cleared)
    await supabase
        .from('bills')
        .update({ caucus_votes_withheld: withheld })
        .eq('id', billId);

    return { withheld, nervousAtRisk, details };
}


// ==================== WHIP ACTION ====================

/**
 * Execute the Party Whip action on a NERVOUS caucus faction for a specific bill.
 * Delegates to server-side whip_caucus RPC for atomic execution with proper authorization.
 *
 * @returns {{ success: boolean, error?: string, apCost?: number }}
 */
export async function executeWhipCaucus(supabase, factionId, caucusFactionId, billId) {
    const { data, error } = await supabase.rpc('whip_caucus', {
        p_faction_id: factionId,
        p_caucus_faction_id: caucusFactionId,
        p_bill_id: billId,
    });

    if (error) {
        return { success: false, error: 'Whip failed: ' + error.message };
    }

    if (!data || !data.success) {
        return { success: false, error: data?.error || 'Unknown error' };
    }

    return { success: true, apCost: data.ap_cost, newAp: data.new_ap };
}


// ==================== RELATIONSHIP UPDATES ====================

/**
 * Update caucus relationship scores after a bill is resolved.
 *
 * @param {string} outcome - 'passed' or 'failed'
 */
export async function updateCaucusRelationships(supabase, billId, outcome) {
    const { data: dispositions, error } = await supabase
        .from('caucus_dispositions')
        .select('caucus_faction_id, disposition, whipped')
        .eq('bill_id', billId);

    if (error || !dispositions || dispositions.length === 0) return;

    for (const d of dispositions) {
        if (d.disposition === 'not_triggered') continue;

        let delta = 0;

        if (outcome === 'passed') {
            if (d.disposition === 'aligned' || d.whipped) {
                delta = CAUCUS_CONFIG.REL_BILL_ALIGNED;
            } else if (d.disposition === 'nervous' && !d.whipped) {
                delta = CAUCUS_CONFIG.REL_BILL_NERVOUS_UNWHIPPED;
            } else if (d.disposition === 'opposed') {
                delta = CAUCUS_CONFIG.REL_BILL_OPPOSED_PASS;
            }
        }
        // Bill failed: no relationship change (status quo preserved)

        if (delta === 0) continue;

        // Load current score and update
        const { data: caucus } = await supabase
            .from('caucus_factions')
            .select('relationship_score')
            .eq('id', d.caucus_faction_id)
            .single();

        if (!caucus) continue;

        const newScore = Math.max(0, Math.min(100, caucus.relationship_score + delta));
        await supabase
            .from('caucus_factions')
            .update({ relationship_score: newScore })
            .eq('id', d.caucus_faction_id);
    }
}

/**
 * Decay caucus relationship scores for factions with no positive bills recently.
 * Called once per tick.
 */
export async function decayCaucusRelationships(supabase, nationId, currentTick) {
    const { data: caucuses, error } = await supabase
        .from('caucus_factions')
        .select('id, relationship_score')
        .eq('nation_id', nationId)
        .eq('is_active', true);

    if (error || !caucuses || caucuses.length === 0) return;

    // Load bills resolved within the decay window to check for recent aligned dispositions
    const windowStart = currentTick - CAUCUS_CONFIG.REL_DECAY_TICK_WINDOW;
    const { data: recentBills } = await supabase
        .from('bills')
        .select('id')
        .eq('nation_id', nationId)
        .gte('voting_ends_tick', windowStart);
    const recentBillIds = (recentBills || []).map(b => b.id);

    for (const caucus of caucuses) {
        // Check if any aligned disposition exists on recent bills
        let hasRecentPositive = false;
        if (recentBillIds.length > 0) {
            const { data: recentPositive } = await supabase
                .from('caucus_dispositions')
                .select('id')
                .eq('caucus_faction_id', caucus.id)
                .in('bill_id', recentBillIds)
                .in('disposition', ['aligned'])
                .limit(1);
            hasRecentPositive = recentPositive && recentPositive.length > 0;
        }
        if (hasRecentPositive) continue;

        const newScore = Math.max(0, caucus.relationship_score + CAUCUS_CONFIG.REL_DECAY);
        if (newScore !== caucus.relationship_score) {
            await supabase
                .from('caucus_factions')
                .update({ relationship_score: newScore })
                .eq('id', caucus.id);
        }
    }
}
