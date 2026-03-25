// ============================================================================
// ENGAGEMENT SCORE — Legislative Activity & Voter Accountability
// ============================================================================
//
// Tracks how actively each faction participates in governance.
// Three components:
//   1. Legislative Initiative (35%) — are you proposing bills?
//   2. Constructive Participation (40%) — are you engaging beyond just blocking?
//   3. Issue Positioning (25%) — are you taking stances on salient issues?
//
// The composite score applies as a multiplier on Platform Appeal.
// ============================================================================

const ENGAGEMENT_CFG = {
    // Rolling window in ticks for bill/vote tracking
    ROLLING_WINDOW: 20,

    // Component weights
    WEIGHT_INITIATIVE: 0.35,
    WEIGHT_CONSTRUCTIVE: 0.40,
    WEIGHT_POSITIONING: 0.25,

    // Initiative thresholds: [bills_to_floor, raw_score]
    INITIATIVE_TIERS: [
        [0, 10],
        [1, 40],
        [2, 60],
        [3, 75],
        [4, 90],
    ],

    // Seat-scaling for initiative expectations
    SEAT_SCALE_THRESHOLDS: [
        { maxSeats: 9,  scale: 0.5 },
        { maxSeats: 25, scale: 1.0 },
        { maxSeats: 40, scale: 1.5 },
        { maxSeats: Infinity, scale: 2.0 },
    ],

    // Constructive participation tiers: [rate, raw_score]
    CONSTRUCTIVE_TIERS: [
        [0.00, 15],
        [0.10, 30],
        [0.20, 45],
        [0.35, 60],
        [0.50, 75],
        [0.70, 90],
    ],

    // Principled opposition floor: if initiative >= this, constructive gets a floor
    PRINCIPLED_OPPOSITION_INITIATIVE_THRESHOLD: 60,
    PRINCIPLED_OPPOSITION_CONSTRUCTIVE_FLOOR: 45,

    // Default when no votes occurred in window
    CONSTRUCTIVE_DEFAULT: 50,

    // Issue positioning points
    POSITIONING_STRONG_THRESHOLD: 60,
    POSITIONING_MODERATE_THRESHOLD: 30,
    POSITIONING_STRONG_POINTS: 18,
    POSITIONING_MODERATE_POINTS: 12,
    POSITIONING_WEAK_POINTS: 6,
    POSITIONING_FLOOR: 10,
    POSITIONING_TOP_ISSUES: 5,

    // Role adjustments
    ROLE_COALITION_INITIATIVE_SCALE: 0.5,
    ROLE_OPPOSITION_INITIATIVE_SCALE: 0.5,
    ROLE_SMALL_INITIATIVE_SCALE: 0.3,
    ROLE_OPPOSITION_CONSTRUCTIVE_FLOOR: 25,
    ROLE_COALITION_CONSTRUCTIVE_FLOOR: 40,
    ROLE_SMALL_CONSTRUCTIVE_FLOOR: 30,

    // Platform Appeal multiplier tiers: [minScore, multiplier]
    APPEAL_MULTIPLIER_TIERS: [
        [60, 1.00],   // engaged — no penalty
        [40, 0.85],   // coasting — mild drag
        [20, 0.65],   // disengaged — significant
        [0,  0.50],   // pure obstruction — severe
    ],

    // Score bounds
    SCORE_MIN: 10,
    SCORE_MAX: 95,

    // Drift speed per tick
    DRIFT_SPEED: 2.0,

    // Grace period for new factions (ticks to hold at 50)
    GRACE_PERIOD_TICKS: 5,
};

/**
 * Compute the engagement score for all factions in a nation.
 *
 * @param {object} supabase
 * @param {object} nation
 * @param {Array} factions - array of { id, seats }
 * @param {Set} coalitionPartyIds
 * @param {string|null} leadPartyId
 * @param {Array} issueStates - array of issue_state rows
 * @param {number} currentTick
 * @returns {Object} map of factionId -> { engagementScore, initiative, constructive, positioning, multiplier }
 */
export async function computeEngagementScores(supabase, nation, factions, coalitionPartyIds, leadPartyId, issueStates, currentTick) {
    const cfg = ENGAGEMENT_CFG;
    const nationId = nation.id;
    const factionIds = factions.map(f => f.id);
    const windowStart = currentTick - cfg.ROLLING_WINDOW;

    // ── 1. Load bills that reached floor in the rolling window ──
    const { data: floorBills } = await supabase
        .from('bills')
        .select('id, proposed_by, bill_support(faction_id, stance)')
        .eq('nation_id', nationId)
        .in('status', ['floor', 'passed', 'failed'])
        .gte('floor_tick', windowStart)
        .lte('floor_tick', currentTick);

    const bills = floorBills || [];

    // Count bills proposed per faction that reached the floor
    const billsToFloor = {};
    for (const fId of factionIds) billsToFloor[fId] = 0;
    for (const bill of bills) {
        if (bill.proposed_by && billsToFloor[bill.proposed_by] !== undefined) {
            billsToFloor[bill.proposed_by]++;
        }
    }

    // Count votes per faction across all floor bills
    const yesVotes = {};
    const noVotes = {};
    const abstainVotes = {};
    const totalVotesPossible = {};
    for (const fId of factionIds) {
        yesVotes[fId] = 0;
        noVotes[fId] = 0;
        abstainVotes[fId] = 0;
        totalVotesPossible[fId] = 0;
    }

    for (const bill of bills) {
        // Every faction with seats could have voted on this bill
        for (const fId of factionIds) {
            totalVotesPossible[fId]++;
        }
        for (const support of (bill.bill_support || [])) {
            const fId = support.faction_id;
            if (!fId || yesVotes[fId] === undefined) continue;
            const stance = (support.stance || '').toLowerCase();
            if (stance === 'yes' || stance === 'accept' || stance === 'support') {
                yesVotes[fId]++;
            } else if (stance === 'no' || stance === 'reject' || stance === 'oppose') {
                noVotes[fId]++;
            } else if (stance === 'abstain') {
                abstainVotes[fId]++;
            }
        }
    }

    // ── 2. Load faction stances for issue positioning ──
    const { data: allStances } = await supabase
        .from('faction_issue_stance')
        .select('faction_id, issue_id, strength')
        .eq('nation_id', nationId)
        .in('faction_id', factionIds);

    const stancesByFaction = {};
    for (const fId of factionIds) stancesByFaction[fId] = [];
    for (const s of (allStances || [])) {
        if (stancesByFaction[s.faction_id]) {
            stancesByFaction[s.faction_id].push(s);
        }
    }

    // Top N issues by salience
    const sortedIssues = [...(issueStates || [])]
        .sort((a, b) => Number(b.salience ?? 0) - Number(a.salience ?? 0))
        .slice(0, cfg.POSITIONING_TOP_ISSUES);
    const topIssueIds = new Set(sortedIssues.map(i => i.issue_id));

    // ── 3. Load existing engagement records ──
    const { data: existingEngagement } = await supabase
        .from('faction_engagement')
        .select('faction_id, engagement_score, first_seated_tick')
        .eq('nation_id', nationId)
        .in('faction_id', factionIds);

    const engagementMap = {};
    for (const e of (existingEngagement || [])) engagementMap[e.faction_id] = e;

    // Build seat map
    const seatMap = {};
    for (const f of factions) seatMap[f.id] = f.seats || 0;

    // ── 4. Compute scores for each faction ──
    const results = {};
    const upserts = [];

    for (const fId of factionIds) {
        const seats = seatMap[fId] || 0;
        const isCoalition = coalitionPartyIds.has(fId);
        const isLead = fId === leadPartyId;
        const existing = engagementMap[fId];

        // Grace period check
        const firstSeatedTick = existing?.first_seated_tick ?? currentTick;
        if (currentTick - firstSeatedTick < cfg.GRACE_PERIOD_TICKS) {
            results[fId] = {
                engagementScore: 50,
                initiative: 50,
                constructive: 50,
                positioning: 50,
                multiplier: 1.0,
            };
            upserts.push({
                faction_id: fId,
                nation_id: nationId,
                engagement_score: 50,
                initiative_score: 50,
                constructive_score: 50,
                positioning_score: 50,
                bills_to_floor_count: billsToFloor[fId],
                yes_vote_count: yesVotes[fId],
                no_vote_count: noVotes[fId],
                abstain_vote_count: abstainVotes[fId],
                total_votes_possible: totalVotesPossible[fId],
                updated_at_tick: currentTick,
                first_seated_tick: firstSeatedTick,
            });
            continue;
        }

        // ── Component 1: Legislative Initiative ──
        const seatScale = cfg.SEAT_SCALE_THRESHOLDS.find(t => seats <= t.maxSeats)?.scale ?? 1.0;
        let roleInitScale = 1.0;
        if (isCoalition && !isLead) roleInitScale = cfg.ROLE_COALITION_INITIATIVE_SCALE;
        else if (!isCoalition && seats < 10) roleInitScale = cfg.ROLE_SMALL_INITIATIVE_SCALE;
        else if (!isCoalition) roleInitScale = cfg.ROLE_OPPOSITION_INITIATIVE_SCALE;

        const effectiveScale = seatScale * roleInitScale;
        const scaledBills = effectiveScale > 0 ? billsToFloor[fId] / effectiveScale : billsToFloor[fId];

        let initiativeScore = cfg.INITIATIVE_TIERS[0][1]; // default: 10
        for (const [threshold, score] of cfg.INITIATIVE_TIERS) {
            if (scaledBills >= threshold) initiativeScore = score;
        }

        // ── Component 2: Constructive Participation ──
        let constructiveScore;
        const totalVotes = totalVotesPossible[fId];
        if (totalVotes === 0) {
            constructiveScore = cfg.CONSTRUCTIVE_DEFAULT;
        } else {
            const votesFor = yesVotes[fId] + abstainVotes[fId] * 0.5;
            const constructiveRate = votesFor / totalVotes;

            constructiveScore = cfg.CONSTRUCTIVE_TIERS[0][1]; // default: 15
            for (const [rate, score] of cfg.CONSTRUCTIVE_TIERS) {
                if (constructiveRate >= rate) constructiveScore = score;
            }

            // Principled opposition escape valve
            if (constructiveScore < cfg.PRINCIPLED_OPPOSITION_CONSTRUCTIVE_FLOOR &&
                initiativeScore >= cfg.PRINCIPLED_OPPOSITION_INITIATIVE_THRESHOLD) {
                constructiveScore = Math.max(constructiveScore, cfg.PRINCIPLED_OPPOSITION_CONSTRUCTIVE_FLOOR);
            }

            // Role-based constructive floor
            let roleFloor = 0;
            if (isCoalition) roleFloor = cfg.ROLE_COALITION_CONSTRUCTIVE_FLOOR;
            else if (!isCoalition && seats < 10) roleFloor = cfg.ROLE_SMALL_CONSTRUCTIVE_FLOOR;
            else if (!isCoalition) roleFloor = cfg.ROLE_OPPOSITION_CONSTRUCTIVE_FLOOR;

            constructiveScore = Math.max(constructiveScore, roleFloor);
        }

        // ── Component 3: Issue Positioning ──
        const factionStances = stancesByFaction[fId] || [];
        let positioningScore = cfg.POSITIONING_FLOOR;
        for (const issueId of topIssueIds) {
            const stance = factionStances.find(s => s.issue_id === issueId);
            if (!stance) continue;
            const strength = Number(stance.strength ?? 0);
            if (strength >= cfg.POSITIONING_STRONG_THRESHOLD) {
                positioningScore += cfg.POSITIONING_STRONG_POINTS;
            } else if (strength >= cfg.POSITIONING_MODERATE_THRESHOLD) {
                positioningScore += cfg.POSITIONING_MODERATE_POINTS;
            } else {
                positioningScore += cfg.POSITIONING_WEAK_POINTS;
            }
        }
        positioningScore = Math.min(90, positioningScore);

        // ── Composite ──
        let targetScore = Math.round(
            initiativeScore * cfg.WEIGHT_INITIATIVE +
            constructiveScore * cfg.WEIGHT_CONSTRUCTIVE +
            positioningScore * cfg.WEIGHT_POSITIONING
        );
        targetScore = Math.max(cfg.SCORE_MIN, Math.min(cfg.SCORE_MAX, targetScore));

        // Apply drift from previous score
        const prevScore = Number(existing?.engagement_score ?? 50);
        const delta = targetScore - prevScore;
        const clampedDelta = Math.max(-cfg.DRIFT_SPEED, Math.min(cfg.DRIFT_SPEED, delta));
        const engagementScore = Math.round(Math.max(cfg.SCORE_MIN, Math.min(cfg.SCORE_MAX, prevScore + clampedDelta)));

        // Compute appeal multiplier
        let multiplier = cfg.APPEAL_MULTIPLIER_TIERS[cfg.APPEAL_MULTIPLIER_TIERS.length - 1][1];
        for (const [minScore, mult] of cfg.APPEAL_MULTIPLIER_TIERS) {
            if (engagementScore >= minScore) {
                multiplier = mult;
                break;
            }
        }

        results[fId] = {
            engagementScore,
            initiative: initiativeScore,
            constructive: constructiveScore,
            positioning: positioningScore,
            multiplier,
        };

        upserts.push({
            faction_id: fId,
            nation_id: nationId,
            engagement_score: engagementScore,
            initiative_score: initiativeScore,
            constructive_score: constructiveScore,
            positioning_score: positioningScore,
            bills_to_floor_count: billsToFloor[fId],
            yes_vote_count: yesVotes[fId],
            no_vote_count: noVotes[fId],
            abstain_vote_count: abstainVotes[fId],
            total_votes_possible: totalVotesPossible[fId],
            updated_at_tick: currentTick,
            first_seated_tick: firstSeatedTick,
        });
    }

    // ── 5. Batch upsert engagement records ──
    if (upserts.length > 0) {
        const { error } = await supabase
            .from('faction_engagement')
            .upsert(upserts, { onConflict: 'faction_id,nation_id' });
        if (error) {
            console.error('[Engagement] Failed to upsert engagement scores:', error.message);
        }
    }

    return results;
}

/**
 * Get the platform appeal multiplier from an engagement score.
 */
export function getEngagementMultiplier(engagementScore) {
    const cfg = ENGAGEMENT_CFG;
    for (const [minScore, mult] of cfg.APPEAL_MULTIPLIER_TIERS) {
        if (engagementScore >= minScore) return mult;
    }
    return cfg.APPEAL_MULTIPLIER_TIERS[cfg.APPEAL_MULTIPLIER_TIERS.length - 1][1];
}
