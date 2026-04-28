/**
 * election-simulation.js — Largest-remainder seat allocation + sector-based
 * client-side election preview.
 */

import { GAME_CONFIG } from './config.js';
import {
    calculateTotalWeightedPopularity,
    allocateSeatsByTwp,
    getStrongholdSectors,
    redistributeRunoffVotes,
} from './sectors.js';
import { runSectorPresidentialElectionRound } from './elections.js';

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
 * Sector-based parliamentary election preview. Mirrors the live
 * runSectorElection allocation (TWP → Largest Remainder → fringe threshold)
 * but skips the random independents roll, electability/uncertainty modifiers,
 * and tie-breaker bonuses so the preview is deterministic against current
 * sector popularity.
 */
export async function runElectionPreview(supabase, nationId) {
    const [nationRes, partiesRes, sectorsRes, popRes] = await Promise.all([
        supabase.from('nations')
            .select('id, name, total_seats, independent_seats')
            .eq('id', nationId)
            .single(),
        supabase.from('factions')
            .select('id, faction_name, abbreviation, party_color, seats')
            .eq('nation_id', nationId)
            .eq('faction_type', 'party')
            .is('abandoned_at', null),
        supabase.from('sectors')
            .select('id, sector_key, name, weight, base_turnout, is_active')
            .eq('nation_id', nationId)
            .eq('is_active', true),
        supabase.from('faction_sector_popularity')
            .select('faction_id, sector_id, popularity')
            .eq('nation_id', nationId),
    ]);

    const nation = nationRes.data;
    if (!nation) {
        return { nation: 'Unknown', error: 'Nation not found.' };
    }

    const parties = partiesRes.data || [];
    const sectors = sectorsRes.data || [];
    const popularity = popRes.data || [];

    const parliamentSize = Number(nation.total_seats) || 0;
    const independentSeats = Number(nation.independent_seats) || 0;
    const availableSeats = Math.max(0, parliamentSize - independentSeats);

    if (parliamentSize <= 0) {
        return { engine: 'sectors', nation: nation.name, nation_id: nation.id, error: 'Nation has no parliament size configured.' };
    }
    if (parties.length === 0) {
        return { engine: 'sectors', nation: nation.name, nation_id: nation.id, parliament_size: parliamentSize, independent_seats: independentSeats, available_seats: availableSeats, total_twp: 0, results: [], error: 'No active parties in this nation.' };
    }

    // Compute TWP per party
    const twpByFaction = {};
    for (const p of parties) {
        twpByFaction[p.id] = calculateTotalWeightedPopularity(p.id, sectors, popularity);
    }

    // Allocate seats using the live engine's algorithm
    const seatsByFaction = allocateSeatsByTwp(twpByFaction, availableSeats);

    const totalTwp = Object.values(twpByFaction).reduce((s, v) => s + (Number(v) || 0), 0);

    const results = parties
        .map(p => {
            const twp = Number(twpByFaction[p.id]) || 0;
            const seats = Number(seatsByFaction[p.id]) || 0;
            const pct = totalTwp > 0 ? (twp / totalTwp) * 100 : 0;
            return {
                id: p.id,
                party_name: p.faction_name,
                abbreviation: p.abbreviation,
                color: p.party_color,
                twp: Math.round(twp),
                seats,
                seat_pct: parliamentSize > 0 ? Number(((seats / parliamentSize) * 100).toFixed(1)) : 0,
                twp_share_pct: Number(pct.toFixed(1)),
                strongholds: getStrongholdSectors(p.id, sectors, popularity, 3),
                current_seats: Number(p.seats) || 0,
            };
        })
        .sort((a, b) => b.seats - a.seats || b.twp - a.twp);

    return {
        engine: 'sectors',
        nation: nation.name,
        nation_id: nation.id,
        parliament_size: parliamentSize,
        independent_seats: independentSeats,
        available_seats: availableSeats,
        total_twp: Math.round(totalTwp),
        results,
    };
}

/**
 * Sector-based presidential election preview. Mirrors the live pipeline:
 *   1. Round 1 vote tally via runSectorPresidentialElectionRound (TWP shares).
 *   2. If top candidate > 50% of votes cast or only ≤2 candidates → no runoff.
 *   3. Otherwise simulate a runoff:
 *      - Top 2 advance.
 *      - Eliminated candidates' votes redistribute by coalitionAffinity
 *        (sector-stronghold overlap), with a base 15% abstain rate that
 *        scales up to 50% as overlap drops — same model as the live runoff
 *        in processPresidentialElectionResult.
 *
 * Non-destructive: writes nothing to the database.
 *
 * Returns a shape compatible with admin.html's previewPresidentialElection
 * consumer (result.winner, result.was_runoff, result.round_1_results,
 * result.runoff_results, result.runoff_meta, result.candidateNames).
 */
export async function runPresidentialElectionPreview(supabase, nationId) {
    const { data: nation, error: nationErr } = await supabase
        .from('nations')
        .select('id, name, eligible_voters')
        .eq('id', nationId)
        .single();
    if (nationErr || !nation) {
        return { nation: 'Unknown', error: 'Nation not found.' };
    }

    let round1;
    try {
        round1 = await runSectorPresidentialElectionRound(supabase, nationId);
    } catch (e) {
        return { nation: nation.name, error: e.message || 'Round 1 simulation failed.' };
    }

    const round1Candidates = round1.presidential_candidates || [];
    if (round1Candidates.length === 0) {
        return {
            nation: nation.name,
            error: 'No active presidential candidates for this nation.',
        };
    }

    const totalVotesCast = round1.total_votes_cast || 0;
    const sortedRound1 = [...round1Candidates].sort((a, b) => b.votes - a.votes);
    const top = sortedRound1[0];
    const topPct = totalVotesCast > 0 ? (top.votes / totalVotesCast) * 100 : 0;

    const candidateNames = {};
    for (const c of round1Candidates) candidateNames[c.candidate_id] = c.candidate_name;

    // No runoff: top has majority OR only ≤2 candidates ran
    if (topPct > 50 || round1Candidates.length <= 2) {
        return {
            engine: 'sectors',
            nation: nation.name,
            eligible_voters: Number(nation.eligible_voters) || 0,
            total_votes_cast: totalVotesCast,
            total_abstentions: round1.total_abstentions || 0,
            turnout_pct: round1.turnout_pct || 0,
            was_runoff: false,
            winner: { ...top },
            round_1_results: sortedRound1,
            round_1_details: [],
            runoff_results: null,
            runoff_meta: null,
            candidateNames,
        };
    }

    // === Runoff simulation ===
    const top2 = sortedRound1.slice(0, 2);
    const top2Ids = new Set(top2.map(c => c.candidate_id));
    const eliminated = round1Candidates.filter(c => !top2Ids.has(c.candidate_id));

    // Load sectors + popularity for affinity computation
    const allFactionIds = round1Candidates.map(c => c.faction_id).filter(Boolean);
    const [sectorsRes, popRes] = await Promise.all([
        supabase.from('sectors')
            .select('id, sector_key, name, weight, base_turnout, is_active')
            .eq('nation_id', nationId)
            .eq('is_active', true),
        allFactionIds.length > 0
            ? supabase.from('faction_sector_popularity')
                .select('faction_id, sector_id, popularity')
                .in('faction_id', allFactionIds)
            : Promise.resolve({ data: [] }),
    ]);
    const sectors  = sectorsRes.data || [];
    const popList  = popRes.data || [];

    const strongholdsByFaction = {};
    for (const fid of allFactionIds) {
        strongholdsByFaction[fid] = getStrongholdSectors(fid, sectors, popList, 3);
    }

    const redistribution = redistributeRunoffVotes(eliminated, top2, strongholdsByFaction);
    const transfersByCand = redistribution.transfersByCand;
    const totalAbstained = redistribution.totalAbstained;
    const totalTransferred = redistribution.totalTransferred;
    // Tag each preview endorsement with has_player_endorsement: false (no
    // player-endorsement state is tracked in the preview path).
    const endorsements = redistribution.endorsements.map(e => ({ ...e, has_player_endorsement: false }));

    // Build runoff results
    let runoffResults = top2.map(c => {
        const t = transfersByCand[c.candidate_id];
        const added = t ? t.transfer_votes : 0;
        return {
            ...c,
            votes: (c.votes || 0) + added,
            base_votes: c.votes || 0,
            transfer_votes: added,
            transfer_detail: t?.from || [],
        };
    });
    const runoffTotal = runoffResults.reduce((s, c) => s + (c.votes || 0), 0);
    runoffResults = runoffResults.map(c => ({
        ...c,
        vote_percentage: runoffTotal > 0 ? Number(((c.votes / runoffTotal) * 100).toFixed(2)) : 0,
    }));
    const runoffSorted = [...runoffResults].sort((a, b) => b.votes - a.votes);
    runoffResults = runoffResults.map(c => ({ ...c, winner: c.candidate_id === runoffSorted[0]?.candidate_id }));
    const runoffWinner = runoffSorted[0];

    return {
        engine: 'sectors',
        nation: nation.name,
        eligible_voters: Number(nation.eligible_voters) || 0,
        total_votes_cast: totalVotesCast,
        total_abstentions: round1.total_abstentions || 0,
        turnout_pct: round1.turnout_pct || 0,
        was_runoff: true,
        winner: { ...runoffWinner },
        round_1_results: sortedRound1,
        round_1_details: [],
        runoff_results: runoffResults,
        runoff_details: [],
        runoff_meta: {
            endorsements,
            total_transferred: totalTransferred,
            abstain_votes: totalAbstained,
        },
        candidateNames,
    };
}
