/**
 * election-simulation.js — Election simulation (vote distribution, D'Hondt allocation)
 * Extracted from game-common.js
 */

import { GAME_CONFIG } from './config.js';
import { IDEOLOGY_TO_AXIS } from './ideology.js';

// ==================== ELECTION SIMULATION ====================

/**
 * Get a party's alignment score toward a specific ideology tag.
 *
 * @param {object} partyAxes  - Row from faction_ideology (keys: liberty_equality, tradition_progress, etc.)
 * @param {string} tag        - Ideology tag (e.g. "PROGRESS", "Liberty") — case-insensitive
 * @returns {number} Alignment value: positive = supports, negative = opposes
 */
export function getPartyAlignment(partyAxes, tag) {
    const info = IDEOLOGY_TO_AXIS[tag.toUpperCase()];
    if (!info) return 0;
    const axisValue = partyAxes[info.axisKey] ?? 0;
    return axisValue * info.direction;
}

// findEligibleParties removed — replaced by weighted competition model
// where ALL parties compete simultaneously for each bloc's voters.

/**
 * Distribute a voter bloc's votes among ALL parties using the Weighted Competition Model.
 *
 * weight = bloc_approval × ideology_multiplier
 * ideology_multiplier = clamp(1.0 + avg_alignment × 0.02, 0.2, 2.0)
 *
 * No cascade steps. No leakage. All parties compete simultaneously.
 *
 * @param {object[]} parties           - All parties with axes
 * @param {string[]} tags              - Bloc ideology tags (may be empty for Unaligned)
 * @param {number}   blocCount         - Voters in this bloc
 * @param {object}   tally             - Mutable { [partyId]: voteCount } accumulator
 * @param {object}   [blocApprovals]   - { partyId: approval } per-bloc approval map
 * @param {object}   [ideologySaturation] - { tag: partyCount } saturation data
 * @param {number}   [avgSaturation]   - Average saturation across active tags
 * @returns {number} Number of abstentions produced
 */
export function distributeVotes(parties, tags, blocCount, tally, blocApprovals, ideologySaturation, avgSaturation) {
    if (blocCount <= 0) return 0;

    const IDEOLOGY_RATE = 0.02;
    const MULT_MIN = 0.2;
    const MULT_MAX = 2.0;

    // Helper: get per-bloc approval for a party (default 40)
    const getApproval = (partyId) => (blocApprovals && blocApprovals[partyId] != null) ? blocApprovals[partyId] : 40;

    const upperTags = tags.map(t => t.toUpperCase());

    // ---- Abstention ----
    let abstainRate = upperTags.length === 0 ? 0.35 : 0.22;

    // Ideology Saturation modifier
    if (upperTags.length > 0 && ideologySaturation && avgSaturation > 0) {
        const blocSaturation = upperTags.reduce((s, t) => s + (ideologySaturation[t] || 0), 0) / upperTags.length;
        const SATURATION_RATE = 0.04;
        const SATURATION_CAP  = 0.12;
        let satMod = (blocSaturation - avgSaturation) * SATURATION_RATE;
        satMod = Math.max(-SATURATION_CAP, Math.min(SATURATION_CAP, satMod));
        abstainRate = Math.max(0.05, Math.min(0.85, abstainRate + satMod));
    }

    const abstentions = Math.floor(blocCount * abstainRate);
    const voters = blocCount - abstentions;
    if (voters <= 0) return blocCount;

    // ---- Calculate softmax-sharpened weights for ALL parties ----
    const K_TEMP = 7;  // softmax temperature (matches tick-system k_value)

    // Find max approval for numerical stability
    let maxApproval = 0;
    for (const party of parties) {
        const a = getApproval(party.id);
        if (a > maxApproval) maxApproval = a;
    }

    const weights = [];
    let totalWeight = 0;

    for (const party of parties) {
        const approval = getApproval(party.id);
        // Softmax sharpening: exp((approval - max) / k)
        const softmaxExp = Math.exp((approval - maxApproval) / K_TEMP);

        let multiplier = 1.0;

        if (upperTags.length > 0) {
            // Average alignment across bloc tags
            const alignSum = upperTags.reduce((s, t) => s + getPartyAlignment(party.axes, t), 0);
            const alignAvg = alignSum / upperTags.length;
            multiplier = Math.max(MULT_MIN, Math.min(MULT_MAX, 1.0 + alignAvg * IDEOLOGY_RATE));
        }

        // Electability modifier: 50 is neutral.
        // Below 50: penalty grows as distance from 50, / 10 (e.g. 40 → -1.0%)
        // Above 50: bonus grows as distance from 50, / 20 (e.g. 70 → +1.0%)
        const electability = party.electability ?? 50;
        let electMod = 1.0;
        if (electability <= 50) {
            electMod = 1.0 - (50 - electability) / 1000;
        } else {
            electMod = 1.0 + (electability - 50) / 2000;
        }

        // Weight = softmax(approval) × ideology_multiplier × electability_modifier
        const w = Math.max(0, softmaxExp * multiplier * electMod);
        weights.push({ id: party.id, weight: w });
        totalWeight += w;
    }

    // Edge case: all weights are 0 — distribute evenly
    if (totalWeight === 0) {
        const evenShare = Math.floor(voters / parties.length);
        for (const party of parties) {
            tally[party.id] = (tally[party.id] || 0) + evenShare;
        }
        const rem = voters - evenShare * parties.length;
        if (rem > 0) {
            tally[parties[0].id] = (tally[parties[0].id] || 0) + rem;
        }
        return abstentions;
    }

    // ---- Distribute proportionally with Largest Remainder ----
    let allocated = 0;
    const partyVotes = [];
    for (const { id, weight } of weights) {
        const exact = (voters * weight) / totalWeight;
        const floored = Math.floor(exact);
        tally[id] = (tally[id] || 0) + floored;
        allocated += floored;
        partyVotes.push({ id, fractional: exact - floored });
    }

    const remainder = voters - allocated;
    partyVotes.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remainder; i++) {
        tally[partyVotes[i].id] = (tally[partyVotes[i].id] || 0) + 1;
    }

    return abstentions;
}

/**
 * Allocate parliamentary seats from vote totals using
 * Largest Remainder / Hare Quota method.
 *
 * @param {object} voteTotals  - { partyId: totalVotes, ... }
 * @param {number} totalSeats  - Seats to allocate (default 120)
 * @returns {object} { partyId: seats, ... }
 */
export function allocateSeatsByVotes(voteTotals, totalSeats = GAME_CONFIG.TOTAL_SEATS) {
    const totalVotes = Object.values(voteTotals).reduce((s, v) => s + v, 0);
    if (totalVotes === 0) {
        const seats = {};
        for (const id of Object.keys(voteTotals)) seats[id] = 0;
        return seats;
    }

    const quota = totalVotes / totalSeats;
    const seats = {};
    const fractionals = [];
    let allocatedSeats = 0;

    for (const [id, votes] of Object.entries(voteTotals)) {
        if (votes === 0) { seats[id] = 0; continue; }
        const raw = votes / quota;
        const guaranteed = Math.floor(raw);
        seats[id] = guaranteed;
        allocatedSeats += guaranteed;
        fractionals.push({ id, fractional: raw - guaranteed });
    }

    const remaining = totalSeats - allocatedSeats;
    fractionals.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remaining; i++) {
        seats[fractionals[i].id] = (seats[fractionals[i].id] || 0) + 1;
    }

    return seats;
}

/**
 * Run a full election simulation using the Weighted Competition Model.
 *
 * All parties compete simultaneously for each bloc's voters:
 *   weight = bloc_approval × ideology_multiplier
 *   ideology_multiplier = clamp(1.0 + avg_alignment × 0.02, 0.2, 2.0)
 *
 * @param {object[]} blocs    - Rows from voter_blocs: { id, bloc_name, voter_count, ideology_1..5, is_active }
 * @param {object[]} parties  - Array of { id, faction_name, axes: { liberty_equality, ... } }
 * @param {number}   [totalSeats=120]
 * @param {object}   [allBlocApprovals] - { blocId: { partyId: approval } } from faction_bloc_approval
 * @returns {{ votes: object, seats: object, totalAbstentions: number, totalVotesCast: number, details: object[] }}
 */
export function runElectionSimulation(blocs, parties, totalSeats = GAME_CONFIG.TOTAL_SEATS, allBlocApprovals = null) {
    const tally = {};
    for (const p of parties) tally[p.id] = 0;

    let totalAbstentions = 0;
    const details = [];

    // ---- Ideology Saturation: penalise over-served ideologies with higher abstention ----
    const ALL_IDEOLOGY_TAGS = ['LIBERTY','EQUALITY','TRADITION','PROGRESS','SECURITY','FREEDOM',
                               'GLOBALISM','NATIONALISM','INDIVIDUALISM','COLLECTIVISM'];
    const ideologySaturation = {};
    for (const tag of ALL_IDEOLOGY_TAGS) {
        ideologySaturation[tag] = parties.filter(p => getPartyAlignment(p.axes, tag) > 0).length;
    }
    const activeSatTags = ALL_IDEOLOGY_TAGS.filter(t => ideologySaturation[t] > 0);
    const avgSaturation = activeSatTags.length > 0
        ? activeSatTags.reduce((s, t) => s + ideologySaturation[t], 0) / activeSatTags.length
        : 1;

    for (const bloc of blocs) {
        if (!bloc.is_active) continue;
        const count = bloc.voter_count || 0;
        if (count === 0) continue;

        // Collect ideology tags from the bloc
        const tags = [bloc.ideology_1, bloc.ideology_2, bloc.ideology_3, bloc.ideology_4, bloc.ideology_5]
            .filter(t => t && t !== 'Unaligned');

        // Per-bloc approval map for this specific bloc
        const blocApprovals = allBlocApprovals ? allBlocApprovals[bloc.id] || null : null;

        // Snapshot tally before distribution to compute per-bloc party votes
        const snapshot = {};
        for (const p of parties) snapshot[p.id] = tally[p.id];

        // All parties compete simultaneously — no cascade
        const abstentions = distributeVotes(parties, tags, count, tally, blocApprovals, ideologySaturation, avgSaturation);

        // Compute per-party votes from this bloc
        const blocVotes = {};
        const partyVotes = [];
        for (const p of parties) {
            const gained = tally[p.id] - snapshot[p.id];
            if (gained > 0) blocVotes[p.id] = gained;
            partyVotes.push({
                party_id: p.id,
                party_name: p.faction_name,
                votes: Math.max(0, gained)
            });
        }

        totalAbstentions += abstentions;
        details.push({
            bloc_id: bloc.id,
            bloc_name: bloc.bloc_name,
            voter_count: count,
            tags,
            abstentions,
            party_votes: partyVotes,
            blocVotes
        });
    }

    const totalVotesCast = Object.values(tally).reduce((s, v) => s + v, 0);
    const seats = allocateSeatsByVotes(tally, totalSeats);

    return { votes: tally, seats, totalAbstentions, totalVotesCast, details };
}

/**
 * High-level helper: load all data from Supabase and run the election preview.
 *
 * @param {object} supabase   - Supabase client
 * @param {string} nationId   - Nation UUID
 * @returns {Promise<object>} Full election result with party names, votes, seats, turnout
 */
export async function runElectionPreview(supabase, nationId) {
    // 1. Load nation
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, total_seats, eligible_voters')
        .eq('id', nationId)
        .single();
    if (!nation) throw new Error('Nation not found');

    const totalSeats = nation.total_seats || 120;

    // 2. Load voter blocs
    const { data: blocs } = await supabase
        .from('voter_blocs')
        .select('*')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (!blocs || blocs.length === 0) throw new Error('No voter blocs found for this nation');

    // 2b. Scale bloc voter_counts so total matches eligible_voters (blocs are generated from population)
    const eligibleVoters = nation.eligible_voters || 0;
    const totalBlocVoters = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    if (totalBlocVoters > 0 && eligibleVoters > 0) {
        const scale = eligibleVoters / totalBlocVoters;
        let scaledSum = 0;
        for (const b of blocs) {
            b.voter_count = Math.round((b.voter_count || 0) * scale);
            scaledSum += b.voter_count;
        }
        // Fix rounding drift on the largest bloc
        const diff = eligibleVoters - scaledSum;
        if (diff !== 0) {
            const largest = blocs.reduce((a, b) => (b.voter_count > a.voter_count ? b : a), blocs[0]);
            largest.voter_count += diff;
        }
    }

    // 3. Load parties + their ideology axes (exclude inactive ≥12 ticks)
    const { data: shard } = await supabase
        .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;
    const { data: allFactions } = await supabase
        .from('factions')
        .select('id, faction_name, seats, electability, last_seen_tick, abandoned_at')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party')
        .is('abandoned_at', null);
    const factions = (allFactions || []).filter(f =>
        f.last_seen_tick == null || (currentTick - f.last_seen_tick) < 12
    );
    if (!factions || factions.length === 0) throw new Error('No eligible parties found for this nation');

    const factionIds = factions.map(f => f.id);
    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('*')
        .in('faction_id', factionIds);

    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    // Build party objects with axes and electability
    const parties = factions.map(f => ({
        id: f.id,
        faction_name: f.faction_name,
        electability: f.electability ?? 50,
        axes: ideoMap[f.id] || {
            liberty_equality: 0, tradition_progress: 0, security_freedom: 0,
            globalism_nationalism: 0, individualism_collectivism: 0
        }
    }));

    // 3b. Load per-bloc preference data from faction_bloc_approval (Three-Pillar system)
    const { data: fbaRows } = await supabase
        .from('faction_bloc_approval')
        .select('faction_id, bloc_id, preference_score')
        .in('faction_id', factionIds);

    // Build allBlocApprovals map: { blocId: { partyId: preference_score } }
    const allBlocApprovals = {};
    for (const row of (fbaRows || [])) {
        if (!allBlocApprovals[row.bloc_id]) allBlocApprovals[row.bloc_id] = {};
        allBlocApprovals[row.bloc_id][row.faction_id] = row.preference_score ?? 40;
    }

    // 4. Run simulation with per-bloc approvals
    const result = runElectionSimulation(blocs, parties, totalSeats, allBlocApprovals);

    // 5. Build friendly results with weighted average approval per party
    const totalBlocWeight = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    const partyResults = parties.map(p => {
        let weightedApproval = 40;
        if (totalBlocWeight > 0) {
            let wSum = 0;
            for (const bloc of blocs) {
                const ba = allBlocApprovals[bloc.id];
                const approval = (ba && ba[p.id] != null) ? ba[p.id] : 40;
                wSum += approval * (bloc.voter_count || 0);
            }
            weightedApproval = Math.round(wSum / totalBlocWeight * 100) / 100;
        }
        return {
            party_id: p.id,
            party_name: p.faction_name,
            approval: weightedApproval,
            votes: result.votes[p.id] || 0,
            vote_percentage: result.totalVotesCast > 0
                ? Math.round(((result.votes[p.id] || 0) / result.totalVotesCast) * 10000) / 100
                : 0,
            seats: result.seats[p.id] || 0
        };
    }).sort((a, b) => b.seats - a.seats);

    // Build party name lookup for UI
    const partyNames = {};
    for (const p of parties) partyNames[p.id] = p.faction_name;

    return {
        nation: nation.name,
        total_seats: totalSeats,
        eligible_voters: nation.eligible_voters || 0,
        total_votes_cast: result.totalVotesCast,
        total_abstentions: result.totalAbstentions,
        turnout_pct: nation.eligible_voters
            ? Math.round((result.totalVotesCast / nation.eligible_voters) * 10000) / 100
            : 0,
        results: partyResults,
        bloc_details: result.details,
        partyNames
    };
}

/**
 * Client-side presidential election preview (non-destructive).
 * Loads candidates, builds virtual-party objects, runs the simulation,
 * and checks for runoff (top candidate <=50% with >2 candidates).
 * If a runoff would trigger, re-runs with only the top 2 candidates.
 */
export async function runPresidentialElectionPreview(supabase, nationId) {
    // 1. Load nation
    const { data: nation } = await supabase
        .from('nations')
        .select('id, name, total_seats, population, eligible_voters')
        .eq('id', nationId)
        .single();
    if (!nation) throw new Error('Nation not found');

    // 2. Load voter blocs
    const { data: blocs } = await supabase
        .from('voter_blocs')
        .select('*')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (!blocs || blocs.length === 0) throw new Error('No voter blocs found for this nation');

    // Scale bloc voter_counts so total matches actual eligible voter count
    // eligible_voters is a raw count (same as parliamentary preview)
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

    // 3. Load selected presidential candidates
    const { data: candidates } = await supabase
        .from('pm_candidates')
        .select('id, first_name, last_name, faction_id, ideology, ideology_axis, ideology_direction, trait_key')
        .eq('nation_id', nationId)
        .eq('candidate_type', 'presidential')
        .eq('selected', true);
    if (!candidates || candidates.length === 0) throw new Error('No selected presidential candidates found. Generate and select candidates first.');

    // 4. Load faction data + ideology axes for each candidate's party
    //    Filter out candidates whose factions are inactive ≥12 ticks
    const { data: shardData } = await supabase
        .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const presTick = shardData?.current_tick || 0;
    const allFactionIds = [...new Set(candidates.map(c => c.faction_id))];
    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name, last_seen_tick, abandoned_at')
        .in('id', allFactionIds)
        .is('abandoned_at', null);
    const activeFactionIds = new Set((factions || [])
        .filter(f => f.last_seen_tick == null || (presTick - f.last_seen_tick) < 12)
        .map(f => f.id));
    const eligibleCandidates = candidates.filter(c => activeFactionIds.has(c.faction_id));
    if (eligibleCandidates.length === 0) throw new Error('No eligible presidential candidates (all factions inactive)');
    const factionIds = [...activeFactionIds];
    const factionMap = {};
    for (const f of (factions || []).filter(f => activeFactionIds.has(f.id))) factionMap[f.id] = f;

    const { data: ideologies } = await supabase
        .from('faction_ideology')
        .select('*')
        .in('faction_id', factionIds);
    const ideoMap = {};
    for (const row of (ideologies || [])) ideoMap[row.faction_id] = row;

    // 5. Build "virtual party" objects per candidate (mirrors SQL RPC logic)
    const AXES = ['liberty_equality', 'tradition_progress', 'security_freedom', 'globalism_nationalism', 'individualism_collectivism'];
    function buildCandidateParty(cand) {
        const factionIdeo = ideoMap[cand.faction_id] || {};
        const axes = {};
        for (const axis of AXES) {
            let val = factionIdeo[axis] || 0;
            if (cand.ideology_axis === axis) {
                // Candidate gets +15 bonus on their personal axis
                // For globalism_nationalism, negate direction (convention mismatch)
                const dir = axis === 'globalism_nationalism' ? cand.ideology_direction * -1 : cand.ideology_direction;
                val += 15 * dir;
            }
            axes[axis] = Math.max(-100, Math.min(100, val));
        }
        const faction = factionMap[cand.faction_id] || {};
        return {
            id: cand.id,
            faction_name: `${cand.first_name} ${cand.last_name}`,
            party_name: faction.faction_name || 'Independent',
            faction_id: cand.faction_id,
            ideology: cand.ideology,
            trait_key: cand.trait_key,
            axes
        };
    }
    const allCandidateParties = eligibleCandidates.map(buildCandidateParty);

    // 6. Load per-bloc approval data (keyed by faction, same as parliamentary)
    const { data: fbaRows } = await supabase
        .from('faction_bloc_approval')
        .select('faction_id, bloc_id, preference_score')
        .in('faction_id', factionIds);
    const allBlocApprovals = {};
    for (const row of (fbaRows || [])) {
        if (!allBlocApprovals[row.bloc_id]) allBlocApprovals[row.bloc_id] = {};
        // Map faction approval to candidate id (candidate inherits faction approval)
        for (const cand of eligibleCandidates) {
            if (cand.faction_id === row.faction_id) {
                allBlocApprovals[row.bloc_id][cand.id] = row.preference_score ?? 40;
            }
        }
    }

    // 7. Run Round 1 simulation (use totalSeats=0 — we only care about votes)
    const round1 = runElectionSimulation(blocs, allCandidateParties, 0, allBlocApprovals);

    // Build Round 1 candidate results
    const totalBlocWeight = blocs.reduce((s, b) => s + (b.voter_count || 0), 0);
    function buildCandidateResults(parties, simResult) {
        return parties.map(p => {
            let weightedApproval = 40;
            if (totalBlocWeight > 0) {
                let wSum = 0;
                for (const bloc of blocs) {
                    const ba = allBlocApprovals[bloc.id];
                    const approval = (ba && ba[p.id] != null) ? ba[p.id] : 40;
                    wSum += approval * (bloc.voter_count || 0);
                }
                weightedApproval = Math.round(wSum / totalBlocWeight * 100) / 100;
            }
            return {
                candidate_id: p.id,
                candidate_name: p.faction_name,
                party_name: p.party_name,
                faction_id: p.faction_id,
                ideology: p.ideology,
                trait_key: p.trait_key,
                approval: weightedApproval,
                votes: simResult.votes[p.id] || 0,
                vote_percentage: simResult.totalVotesCast > 0
                    ? Math.round(((simResult.votes[p.id] || 0) / simResult.totalVotesCast) * 10000) / 100
                    : 0
            };
        }).sort((a, b) => b.votes - a.votes);
    }

    const round1Results = buildCandidateResults(allCandidateParties, round1);

    // 8. Check for runoff
    const topPct = round1Results[0]?.vote_percentage || 0;
    let wasRunoff = false;
    let runoffResults = null;
    let round2Details = null;
    let winner;

    if (topPct > 50 || allCandidateParties.length <= 2) {
        // Clear winner — no runoff
        winner = round1Results[0];
        winner.winner = true;
    } else {
        // Runoff: top 2 advance, re-run simulation
        wasRunoff = true;
        const top2Ids = new Set([round1Results[0].candidate_id, round1Results[1].candidate_id]);
        const runoffParties = allCandidateParties.filter(p => top2Ids.has(p.id));

        // Build runoff-specific bloc approvals (only top 2 candidates)
        const runoffBlocApprovals = {};
        for (const [blocId, approvals] of Object.entries(allBlocApprovals)) {
            runoffBlocApprovals[blocId] = {};
            for (const p of runoffParties) {
                runoffBlocApprovals[blocId][p.id] = approvals[p.id] ?? 40;
            }
        }

        const round2 = runElectionSimulation(blocs, runoffParties, 0, runoffBlocApprovals);
        runoffResults = buildCandidateResults(runoffParties, round2);
        round2Details = round2.details;
        winner = runoffResults[0];
        winner.winner = true;
    }

    // Build candidate name lookup
    const candidateNames = {};
    for (const p of allCandidateParties) candidateNames[p.id] = p.faction_name;

    return {
        nation: nation.name,
        eligible_voters: eligibleVoters,
        total_votes_cast: round1.totalVotesCast,
        total_abstentions: round1.totalAbstentions,
        turnout_pct: eligibleVoters
            ? Math.round((round1.totalVotesCast / eligibleVoters) * 10000) / 100
            : 0,
        round_1_results: round1Results,
        round_1_details: round1.details,
        was_runoff: wasRunoff,
        runoff_results: runoffResults,
        runoff_details: round2Details,
        winner,
        candidateNames
    };
}
