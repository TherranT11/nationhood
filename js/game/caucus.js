/**
 * caucus.js — Caucus System for dominant-party internal factions
 *
 * When a party holds >= 50% of parliamentary seats, internal caucuses
 * activate based on ideology axis spread across voter blocs. These
 * caucuses can defect on bills that touch their dominant axis.
 */

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
    REL_BILL_FAVORABLE_ARTICLE: 1, // +1 per favorable ideological article in a passed bill
    REL_BILL_OPPOSED_PASS: -20,
    REL_WHIP: 3,
    // REL_PLEDGE_HONOURED / REL_PLEDGE_BETRAYED: reserved for future pledge system
    REL_DECAY: -2,                 // unconditional decay per tick
    // Relationship = 0 means permanently opposed on any touching bill
    // REL_VOLATILE_THRESHOLD: reserved for future volatile-caucus mechanics
    // Defection: caucus members leave to join ideologically compatible opposition
    DEFECTION_THRESHOLD: 20,       // relationship_score at or below this triggers defection
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

    // Determine how many axes and wings to create.
    // Each axis can produce 1 wing (dominant side) or 2 wings (both sides).
    // We prioritize diversity: spread across more axes first, then fill with second wings.
    const totalNew = totalFactionCount - existingAxes.size * 2;
    const availableAxes = axisSpreads.slice(0, Math.min(axisSpreads.length, totalNew));

    // Phase 1: assign 1 wing per axis (dominant wing) across as many axes as we have slots
    const assignments = []; // { axis, wing }
    for (const axis of availableAxes) {
        if (assignments.length >= totalNew) break;
        // Pick the dominant wing (more internal tension = higher weight)
        const dominantWing = axis.leftWeight >= axis.rightWeight ? 'left' : 'right';
        assignments.push({ axis, wing: dominantWing });
    }

    // Phase 2: if we still need more caucuses, go back and add the opposite wing
    if (assignments.length < totalNew) {
        for (const axis of availableAxes) {
            if (assignments.length >= totalNew) break;
            const existingWing = assignments.find(a => a.axis.axisKey === axis.axisKey)?.wing;
            if (!existingWing) continue;
            const oppositeWing = existingWing === 'left' ? 'right' : 'left';
            assignments.push({ axis, wing: oppositeWing });
        }
    }

    // Create caucus factions from assignments
    for (const { axis, wing } of assignments) {
        const wingNames = CAUCUS_WING_NAMES[axis.axisKey];
        if (!wingNames) continue;

        // Seat share: 20% + 1D10% of party's total available seats
        const d10 = Math.floor(Math.random() * 10) + 1; // 1-10
        const seatShare = 0.20 + (d10 / 100);           // 0.21 to 0.30

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
 * +1 per favorable ideological article in a passed bill that the caucus's party voted on.
 * -20 if opposed and bill passes anyway.
 *
 * @param {string} outcome - 'passed' or 'failed'
 * @param {Array} billArticles - bill_articles rows with policies (from bill query)
 * @param {Array} billSupport - bill_support rows with faction_id/stance
 */
export async function updateCaucusRelationships(supabase, billId, outcome, billArticles, billSupport) {
    if (outcome !== 'passed') return; // no relationship change on failed bills

    const { data: dispositions, error } = await supabase
        .from('caucus_dispositions')
        .select('caucus_faction_id, disposition, whipped')
        .eq('bill_id', billId);

    if (error || !dispositions || dispositions.length === 0) return;

    // Build set of party IDs that voted on this bill
    const votedPartyIds = new Set();
    for (const s of (billSupport || [])) {
        if (s.faction_id) votedPartyIds.add(s.faction_id);
    }

    // Load caucus faction details (need party_id, dominant_axis, wing_end)
    const caucusIds = dispositions.map(d => d.caucus_faction_id);
    const { data: caucusFactions } = await supabase
        .from('caucus_factions')
        .select('id, party_id, dominant_axis, wing_end, relationship_score')
        .in('id', caucusIds);

    if (!caucusFactions || caucusFactions.length === 0) return;

    const caucusMap = {};
    for (const cf of caucusFactions) caucusMap[cf.id] = cf;

    for (const d of dispositions) {
        if (d.disposition === 'not_triggered') continue;

        const caucus = caucusMap[d.caucus_faction_id];
        if (!caucus) continue;

        // Party must have voted on the bill
        if (!votedPartyIds.has(caucus.party_id)) continue;

        let delta = 0;

        if (d.disposition === 'opposed' && !d.whipped) {
            delta = CAUCUS_CONFIG.REL_BILL_OPPOSED_PASS;
        } else {
            // Count favorable articles: ideology tags on the caucus's dominant axis
            // in the caucus's favored direction
            const favoredDirection = caucus.wing_end === 'left' ? -1 : 1;
            let favorableCount = 0;

            for (const art of (billArticles || [])) {
                const p = art.policies || art;
                if (!p) continue;

                const ideos = (p.ideologies && Array.isArray(p.ideologies) && p.ideologies.length > 0)
                    ? p.ideologies.map(i => i.toUpperCase())
                    : (p.ideology ? [p.ideology.toUpperCase()] : []);

                for (const tag of ideos) {
                    const mapping = IDEOLOGY_TO_AXIS[tag];
                    if (!mapping) continue;
                    // Article must be on the caucus's dominant axis and in the favored direction
                    if (mapping.axisKey === caucus.dominant_axis && mapping.direction === favoredDirection) {
                        favorableCount++;
                    }
                }
            }

            delta = favorableCount * CAUCUS_CONFIG.REL_BILL_FAVORABLE_ARTICLE;
        }

        if (delta === 0) continue;

        const newScore = Math.max(0, Math.min(100, caucus.relationship_score + delta));
        const { error: updErr } = await supabase
            .from('caucus_factions')
            .update({ relationship_score: newScore })
            .eq('id', d.caucus_faction_id);
        if (updErr) {
            console.error(`[Caucus] Failed to update relationship for caucus ${d.caucus_faction_id}:`, updErr.message);
        }
    }
}

/**
 * Decay caucus relationship scores unconditionally.
 * Called once per tick. Every active caucus loses REL_DECAY (-2) per tick.
 */
export async function decayCaucusRelationships(supabase, nationId) {
    const { data: caucuses, error } = await supabase
        .from('caucus_factions')
        .select('id, relationship_score')
        .eq('nation_id', nationId)
        .eq('is_active', true);

    if (error || !caucuses || caucuses.length === 0) return;

    for (const caucus of caucuses) {
        const newScore = Math.max(0, caucus.relationship_score + CAUCUS_CONFIG.REL_DECAY);
        if (newScore !== caucus.relationship_score) {
            const { error: updErr } = await supabase
                .from('caucus_factions')
                .update({ relationship_score: newScore })
                .eq('id', caucus.id);
            if (updErr) {
                console.error(`[Caucus] Failed to decay relationship for caucus ${caucus.id}:`, updErr.message);
            }
        }
    }
}


// ==================== DEFECTION ====================

/**
 * Process caucus defections for a nation. Called once per tick after decay.
 * Threshold-based defection:
 *   - relationship_score <= 20: 1 member defects per tick
 *   - relationship_score <= 19: 2 members defect per tick
 * Defectors join the ideologically closest opposition party on the caucus's
 * dominant axis. If no compatible party exists, seats are lost (independents).
 */
export async function processCaucusDefections(supabase, nationId, currentTick) {
    const { data: caucuses, error } = await supabase
        .from('caucus_factions')
        .select('id, party_id, name, dominant_axis, wing_end, seat_share, relationship_score')
        .eq('nation_id', nationId)
        .eq('is_active', true)
        .lte('relationship_score', CAUCUS_CONFIG.DEFECTION_THRESHOLD);

    if (error || !caucuses || caucuses.length === 0) return;

    // Load all parties in the nation with their seats and ideology
    const { data: parties } = await supabase
        .from('factions')
        .select('id, faction_name, seats, faction_type')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');
    if (!parties || parties.length === 0) return;

    const partyMap = {};
    for (const p of parties) partyMap[p.id] = p;

    // Load faction ideologies for axis matching
    const partyIds = parties.map(p => p.id);
    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism')
        .in('faction_id', partyIds);

    const ideoMap = {};
    for (const ideo of (ideologies || [])) ideoMap[ideo.faction_id] = ideo;

    // Load nation name for event log
    const { data: nation } = await supabase.from('nations').select('name, total_seats').eq('id', nationId).single();

    for (const caucus of caucuses) {
        const sourceParty = partyMap[caucus.party_id];
        if (!sourceParty || sourceParty.seats <= 0) continue;

        // Threshold-based: 1 at <=20, 2 at <=19
        const baseDefections = caucus.relationship_score <= 19 ? 2 : 1;
        const seatsToLose = Math.min(baseDefections, sourceParty.seats);
        if (seatsToLose <= 0) continue;

        // Find the best ideological match among OTHER parties on this caucus's axis
        // wing_end='left' → caucus favors low axis scores (left pole)
        // wing_end='right' → caucus favors high axis scores (right pole)
        const axisKey = caucus.dominant_axis;
        const favorsHigh = caucus.wing_end === 'right';
        let bestParty = null;
        let bestScore = -Infinity;

        for (const party of parties) {
            if (party.id === caucus.party_id) continue; // skip source party
            const ideo = ideoMap[party.id];
            if (!ideo) continue;

            const axisValue = ideo[axisKey] ?? 50;
            // How well does this party match the caucus wing's preferred direction?
            // Right wing: higher axis value = better match
            // Left wing: lower axis value = better match (invert)
            const score = favorsHigh ? axisValue : (100 - axisValue);
            if (score > bestScore) {
                bestScore = score;
                bestParty = party;
            }
        }

        // Transfer seats
        const { error: srcErr } = await supabase
            .from('factions')
            .update({ seats: sourceParty.seats - seatsToLose })
            .eq('id', sourceParty.id);
        if (srcErr) {
            console.error(`[Caucus Defection] Failed to remove seats from ${sourceParty.faction_name}:`, srcErr.message);
            continue;
        }
        sourceParty.seats -= seatsToLose; // update local cache

        let targetName = 'independents';
        if (bestParty && bestScore > 40) {
            // Transfer to compatible party (threshold: axis score > 40 means at least some alignment)
            const { error: tgtErr } = await supabase
                .from('factions')
                .update({ seats: bestParty.seats + seatsToLose })
                .eq('id', bestParty.id);
            if (tgtErr) {
                console.error(`[Caucus Defection] Failed to add seats to ${bestParty.faction_name}:`, tgtErr.message);
            } else {
                bestParty.seats += seatsToLose;
                targetName = bestParty.faction_name;
            }
        }
        // If no compatible party (or score <= 40), seats are simply lost — independents

        // Reduce caucus seat_share proportionally
        const newSeatShare = Math.max(0, caucus.seat_share - (seatsToLose / (nation?.total_seats || 100)));
        await supabase
            .from('caucus_factions')
            .update({ seat_share: Math.round(newSeatShare * 1000) / 1000 })
            .eq('id', caucus.id);

        // Get wing label for event
        const axisInfo = IDEOLOGY_AXES.find(a => a.key === axisKey);
        const wingLabel = caucus.wing_end === 'left' ? axisInfo?.leftLabel : axisInfo?.rightLabel;

        console.log(`[Caucus Defection] ${seatsToLose} seat(s) defected from ${sourceParty.faction_name} (${caucus.name}) to ${targetName}`);

        // Fire nation political event
        try {
            await supabase.rpc('fire_system_event', {
                p_trigger_key: 'caucus_defection',
                p_nation_id: nationId,
                p_tick: currentTick,
                p_placeholders: {
                    caucus_name: caucus.name,
                    source_party: sourceParty.faction_name,
                    target_party: targetName,
                    seats_lost: seatsToLose,
                    wing: wingLabel || caucus.wing_end,
                    relationship_score: caucus.relationship_score
                }
            });
        } catch (e) {
            console.error('[Caucus Defection] Failed to fire political event:', e);
        }

        // Fire world event log
        const desc = targetName === 'independents'
            ? `${seatsToLose} member${seatsToLose !== 1 ? 's' : ''} of the ${caucus.name} wing defected from ${sourceParty.faction_name} in ${nation?.name || 'a nation'}, leaving parliament as independents.`
            : `${seatsToLose} member${seatsToLose !== 1 ? 's' : ''} of the ${caucus.name} wing defected from ${sourceParty.faction_name} to ${targetName} in ${nation?.name || 'a nation'} over ideological disagreements.`;

        try {
            await supabase.from('event_log').insert({
                nation_id: nationId,
                event_name: 'Caucus Defection',
                trigger_key: 'caucus_defection',
                description_chosen: desc,
                category: 'government',
                effects_applied: {
                    caucus: caucus.name,
                    source: sourceParty.faction_name,
                    target: targetName,
                    seats: seatsToLose,
                    relationship: caucus.relationship_score
                },
                fired_at_tick: currentTick
            });
        } catch (e) {
            console.error('[Caucus Defection] Failed to insert event_log:', e);
        }
    }
}
