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
 * weight = approval × ideology_multiplier
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
 *   weight = approval × ideology_multiplier
 *   ideology_multiplier = clamp(1.0 + avg_alignment × 0.02, 0.2, 2.0)
 *
 * NOTE: The blocs parameter is a legacy holdover; the electorate engine now
 * supplies voter data externally, so callers pass an empty array.
 *
 * @param {object[]} blocs    - Electorate bloc objects (legacy, pass [])
 * @param {object[]} parties  - Array of { id, faction_name, axes: { liberty_equality, ... } }
 * @param {number}   [totalSeats=120]
 * @param {object}   [allBlocApprovals] - Unused legacy parameter (pass null)
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
        .select('id, name, total_seats, eligible_voters, electoral_commission_reform, ruling_faction_id')
        .eq('id', nationId)
        .single();
    if (!nation) throw new Error('Nation not found');

    const totalSeats = nation.total_seats || 120;
    const eligibleVoters = nation.eligible_voters || 0;

    // 2. Load parties (exclude inactive ≥12 ticks)
    const { data: shard } = await supabase
        .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const currentTick = shard?.current_tick || 0;
    const { data: allFactions } = await supabase
        .from('factions')
        .select('id, faction_name, seats, electability, last_seen_tick, founded_tick, abandoned_at')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party')
        .is('abandoned_at', null);
    const factions = (allFactions || []).filter(f => {
        if (f.last_seen_tick != null) return (currentTick - f.last_seen_tick) < 12;
        // Never logged in — use founded_tick; exclude if founded 12+ ticks ago
        return (currentTick - (f.founded_tick || 0)) < 12;
    });
    if (!factions || factions.length === 0) throw new Error('No eligible parties found for this nation');

    // 3. Load electoral standings from 3-pillar election engine
    // Columns repurposed: party_approval → governance score, visibility → momentum, raw_appeal → election score
    const factionIds = factions.map(f => f.id);
    const { data: standings } = await supabase
        .from('faction_electoral_standing')
        .select('faction_id, realized_vote_share, contested_vote_share, turnout_rate, party_approval')
        .eq('nation_id', nationId)
        .in('faction_id', factionIds);

    const standingMap = {};
    for (const s of (standings || [])) standingMap[s.faction_id] = s;

    // 4. Convert vote shares to actual votes
    // Use contested_vote_share × turnout_rate (NOT realized_vote_share which is
    // renormalized to sum=1.0 and would produce ~100% turnout).
    // contested_vote_share = how voters split if everyone voted (sums to ~1.0)
    // turnout_rate = fraction of each party's supporters who actually show up (0.3-0.95)
    // actual_share = contested × turnout → sums to < 1.0 → remainder = abstentions
    const tally = {};
    let totalVotesCast = 0;
    let totalAbstentions = 0;

    let totalActualShare = 0;
    const voteExacts = [];
    for (const f of factions) {
        const s = standingMap[f.id];
        const contested = Number(s?.contested_vote_share || 0);
        const turnout = Number(s?.turnout_rate || 0.65);
        const actualShare = contested * turnout;
        totalActualShare += actualShare;
        const exactVotes = eligibleVoters * actualShare;
        voteExacts.push({ id: f.id, exact: exactVotes, floored: Math.floor(exactVotes) });
        tally[f.id] = Math.floor(exactVotes);
        totalVotesCast += Math.floor(exactVotes);
    }

    // Distribute remainder votes via largest remainder
    const targetVotes = Math.round(eligibleVoters * Math.min(1, totalActualShare));
    let remainder = targetVotes - totalVotesCast;
    if (remainder > 0) {
        voteExacts.sort((a, b) => (b.exact - b.floored) - (a.exact - a.floored));
        for (let i = 0; i < remainder && i < voteExacts.length; i++) {
            tally[voteExacts[i].id] += 1;
            totalVotesCast += 1;
        }
    }

    totalAbstentions = Math.max(0, eligibleVoters - totalVotesCast);

    // 5. Allocate seats
    const seats = allocateSeatsByVotes(tally, totalSeats);

    // 5b. Electoral Commission Reform: ruling coalition gets +5-10% seat bonus
    if (nation.electoral_commission_reform) {
        // Load active coalition to identify governing parties
        const { data: coalition } = await supabase
            .from('government_formations')
            .select('party_ids')
            .eq('nation_id', nationId)
            .in('status', ['formed', 'caretaker'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        const coalitionIds = new Set(coalition?.party_ids || []);
        if (coalitionIds.size > 0) {
            // Random bonus: 5-10% of total seats
            const bonusPct = 0.05 + Math.random() * 0.05;
            const bonusSeats = Math.round(totalSeats * bonusPct);
            if (bonusSeats > 0) {
                // Collect opposition parties and their current seats
                const oppositionIds = Object.keys(seats).filter(id => !coalitionIds.has(id) && seats[id] > 0);
                const totalOppSeats = oppositionIds.reduce((s, id) => s + seats[id], 0);
                if (totalOppSeats > 0) {
                    // Subtract proportionally from opposition
                    let seatsToTransfer = Math.min(bonusSeats, totalOppSeats);
                    let transferred = 0;
                    for (const id of oppositionIds) {
                        const share = seats[id] / totalOppSeats;
                        const loss = Math.round(seatsToTransfer * share);
                        const actualLoss = Math.min(loss, seats[id]); // can't go below 0
                        seats[id] -= actualLoss;
                        transferred += actualLoss;
                    }
                    // Add transferred seats to coalition parties proportionally
                    const coalitionArr = [...coalitionIds].filter(id => seats[id] !== undefined);
                    const totalCoalSeats = coalitionArr.reduce((s, id) => s + (seats[id] || 0), 0);
                    let distributed = 0;
                    for (let i = 0; i < coalitionArr.length; i++) {
                        const id = coalitionArr[i];
                        const share = totalCoalSeats > 0 ? (seats[id] || 0) / totalCoalSeats : 1 / coalitionArr.length;
                        const gain = (i === coalitionArr.length - 1) ? (transferred - distributed) : Math.round(transferred * share);
                        seats[id] = (seats[id] || 0) + gain;
                        distributed += gain;
                    }
                    console.log(`[Election] Electoral Commission Reform: ${transferred} seats transferred to coalition (${(bonusPct * 100).toFixed(1)}% bonus)`);
                }
            }
        }
    }

    // 6. Build friendly results
    const partyResults = factions.map(f => {
        const s = standingMap[f.id];
        return {
            party_id: f.id,
            party_name: f.faction_name,
            governance: Math.round(Number(s?.party_approval || 0)), // repurposed: was approval, now governance score
            votes: tally[f.id] || 0,
            vote_percentage: totalVotesCast > 0
                ? Math.round(((tally[f.id] || 0) / totalVotesCast) * 10000) / 100
                : 0,
            seats: seats[f.id] || 0
        };
    }).sort((a, b) => b.seats - a.seats);

    const partyNames = {};
    for (const f of factions) partyNames[f.id] = f.faction_name;

    return {
        nation: nation.name,
        total_seats: totalSeats,
        eligible_voters: eligibleVoters,
        total_votes_cast: totalVotesCast,
        total_abstentions: totalAbstentions,
        turnout_pct: eligibleVoters
            ? Math.round((totalVotesCast / eligibleVoters) * 10000) / 100
            : 0,
        results: partyResults,
        bloc_details: [],
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

    const eligibleVoters = nation.eligible_voters || 0;

    // 2. Load selected presidential candidates — or synthesize from party leaders
    let { data: candidates } = await supabase
        .from('pm_candidates')
        .select('id, first_name, last_name, faction_id, ideology, ideology_axis, ideology_direction, trait_key')
        .eq('nation_id', nationId)
        .eq('candidate_type', 'presidential')
        .eq('selected', true);

    // If no candidates registered, build synthetic ones from party leaders
    // (mirrors autoSelectPresidentialCandidates in the tick handler)
    if (!candidates || candidates.length === 0) {
        const { data: parties } = await supabase
            .from('factions')
            .select('id, faction_name, leader_first_name, leader_last_name, leader_positive_traits, leader_negative_traits')
            .eq('nation_id', nationId)
            .eq('faction_type', 'party')
            .is('abandoned_at', null);
        const { data: ideos } = await supabase
            .from('faction_ideology')
            .select('faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism')
            .in('faction_id', (parties || []).map(p => p.id));
        const ideoLookup = {};
        for (const r of (ideos || [])) ideoLookup[r.faction_id] = r;

        candidates = (parties || []).filter(p => p.leader_first_name).map(p => {
            const ideo = ideoLookup[p.id] || {};
            const axes = ['liberty_equality', 'tradition_progress', 'security_freedom', 'globalism_nationalism', 'individualism_collectivism'];
            let bestAxis = 'tradition_progress', bestDir = 1, maxAbs = 0;
            for (const axis of axes) {
                const val = Math.abs(ideo[axis] || 0);
                if (val > maxAbs) { maxAbs = val; bestAxis = axis; bestDir = (ideo[axis] || 0) >= 0 ? 1 : -1; }
            }
            return {
                id: p.id, // use faction id as synthetic candidate id
                first_name: p.leader_first_name,
                last_name: p.leader_last_name,
                faction_id: p.id,
                ideology: bestDir > 0 ? bestAxis.split('_').pop() : bestAxis.split('_')[0],
                ideology_axis: bestAxis,
                ideology_direction: bestDir,
                trait_key: (p.leader_positive_traits || [])[0] || null
            };
        });
    }
    if (!candidates || candidates.length === 0) throw new Error('No parties with leaders found for presidential preview.');

    // 3. Load faction data + ideology axes for each candidate's party
    //    Filter out candidates whose factions are inactive ≥12 ticks
    const { data: shardData } = await supabase
        .from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
    const presTick = shardData?.current_tick || 0;
    const allFactionIds = [...new Set(candidates.map(c => c.faction_id))];
    const { data: factions } = await supabase
        .from('factions')
        .select('id, faction_name, last_seen_tick, founded_tick, abandoned_at')
        .in('id', allFactionIds)
        .is('abandoned_at', null);
    const activeFactionIds = new Set((factions || [])
        .filter(f => {
            if (f.last_seen_tick != null) return (presTick - f.last_seen_tick) < 12;
            return (presTick - (f.founded_tick || 0)) < 12;
        })
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

    // 4. Load electoral standings for each candidate's faction
    // party_approval column repurposed: now stores governance score (3-pillar system)
    const { data: standings } = await supabase
        .from('faction_electoral_standing')
        .select('faction_id, realized_vote_share, contested_vote_share, turnout_rate, party_approval')
        .eq('nation_id', nationId)
        .in('faction_id', factionIds);
    const standingMap = {};
    for (const s of (standings || [])) standingMap[s.faction_id] = s;

    // 5. Build "virtual party" objects per candidate
    const AXES = ['liberty_equality', 'tradition_progress', 'security_freedom', 'globalism_nationalism', 'individualism_collectivism'];
    function buildCandidateParty(cand) {
        const factionIdeo = ideoMap[cand.faction_id] || {};
        const axes = {};
        for (const axis of AXES) {
            let val = factionIdeo[axis] || 0;
            if (cand.ideology_axis === axis) {
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

    // 6. Run Round 1 using faction vote shares from the electorate engine
    //    Distribute each faction's realized_vote_share among its candidates proportionally
    function computePresidentialVotes(candidateParties) {
        // Group candidates by faction
        const factionCandidates = {};
        for (const cp of candidateParties) {
            if (!factionCandidates[cp.faction_id]) factionCandidates[cp.faction_id] = [];
            factionCandidates[cp.faction_id].push(cp);
        }

        const tally = {};
        let totalVotesCast = 0;
        for (const cp of candidateParties) tally[cp.id] = 0;

        // Distribute each faction's vote share among its candidates
        // Use contested × turnout (not realized which is renormalized to sum=1)
        for (const [fid, cands] of Object.entries(factionCandidates)) {
            const s = standingMap[fid];
            const contested = Number(s?.contested_vote_share || 0);
            const turnout = Number(s?.turnout_rate || 0.65);
            const factionVotes = Math.round(eligibleVoters * contested * turnout);
            // Split evenly among candidates from same faction (usually 1)
            const perCandidate = Math.floor(factionVotes / cands.length);
            let assigned = 0;
            for (const c of cands) {
                tally[c.id] = perCandidate;
                assigned += perCandidate;
            }
            // Remainder to first candidate
            if (assigned < factionVotes && cands.length > 0) {
                tally[cands[0].id] += factionVotes - assigned;
            }
            totalVotesCast += factionVotes;
        }

        const totalAbstentions = Math.max(0, eligibleVoters - totalVotesCast);
        return { votes: tally, totalVotesCast, totalAbstentions, details: [] };
    }

    const round1 = computePresidentialVotes(allCandidateParties);

    // Build Round 1 candidate results
    function buildCandidateResults(parties, simResult) {
        return parties.map(p => {
            return {
                candidate_id: p.id,
                candidate_name: p.faction_name,
                party_name: p.party_name,
                faction_id: p.faction_id,
                ideology: p.ideology,
                trait_key: p.trait_key,
                approval: 40,
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

    let runoffMeta = null;

    if (topPct > 50 || allCandidateParties.length <= 2) {
        // Clear winner — no runoff
        winner = round1Results[0];
        winner.winner = true;
    } else {
        // Runoff: top 2 advance with vote transfers from eliminated candidates
        wasRunoff = true;
        const top2 = [round1Results[0], round1Results[1]];
        const top2Ids = new Set(top2.map(c => c.candidate_id));
        const runoffParties = allCandidateParties.filter(p => top2Ids.has(p.id));
        const eliminatedParties = allCandidateParties.filter(p => !top2Ids.has(p.id));

        // Start with the top 2 candidates' Round 1 votes as base
        const runoffTally = {};
        for (const c of top2) runoffTally[c.candidate_id] = c.votes;
        let runoffTotalVotes = top2.reduce((s, c) => s + c.votes, 0);
        let runoffAbstentions = 0;

        // Load player endorsement preferences (party → party)
        const elimFactionIds = eliminatedParties.map(p => p.faction_id).filter(Boolean);
        let endorsementPrefs = {};
        if (elimFactionIds.length > 0) {
            const { data: prefs } = await supabase
                .from('party_endorsement_preferences')
                .select('endorsing_party_id, endorsed_party_id')
                .eq('nation_id', nationId)
                .in('endorsing_party_id', elimFactionIds);
            for (const p of (prefs || [])) {
                endorsementPrefs[p.endorsing_party_id] = p.endorsed_party_id;
            }
        }

        // Map runoff candidate faction IDs for endorsement lookups
        const runoffFactionToCandidateId = {};
        for (const rp of runoffParties) {
            runoffFactionToCandidateId[rp.faction_id] = rp.id;
        }

        // Transfer eliminated candidates' votes based on endorsements + ideological proximity
        const AXES = ['liberty_equality', 'tradition_progress', 'security_freedom', 'globalism_nationalism', 'individualism_collectivism'];
        const endorsements = [];

        for (const elim of eliminatedParties) {
            const elimR1 = round1Results.find(r => r.candidate_id === elim.id);
            const elimVotes = elimR1?.votes || 0;
            if (elimVotes === 0) continue;

            // Compute ideological distance to each runoff candidate
            const distances = runoffParties.map(rp => {
                let distSq = 0;
                for (const axis of AXES) {
                    const diff = (elim.axes[axis] || 0) - (rp.axes[axis] || 0);
                    distSq += diff * diff;
                }
                return { id: rp.id, name: rp.faction_name, dist: Math.sqrt(distSq) };
            });

            // Check for player endorsement: does this eliminated faction endorse a runoff candidate's faction?
            const endorsedFactionId = endorsementPrefs[elim.faction_id] || null;
            const endorsedCandidateId = endorsedFactionId ? runoffFactionToCandidateId[endorsedFactionId] || null : null;

            // Convert distances to affinity (inverse distance)
            // If a player endorsement exists, the endorsed candidate gets 75% of affinity
            const totalDist = distances.reduce((s, d) => s + d.dist, 0);
            let affinities;
            if (endorsedCandidateId) {
                // Player endorsed: 75% to endorsed, 25% to other
                affinities = distances.map(d => ({
                    ...d,
                    affinity: d.id === endorsedCandidateId ? 0.75 : 0.25 / Math.max(1, distances.length - 1)
                }));
            } else if (totalDist === 0) {
                affinities = distances.map(d => ({ ...d, affinity: 0.5 }));
            } else {
                affinities = distances.map(d => ({ ...d, affinity: 1 - (d.dist / totalDist) }));
                const affinitySum = affinities.reduce((s, a) => s + a.affinity, 0);
                for (const a of affinities) a.affinity = a.affinity / affinitySum;
            }

            // Abstention rate: lower if there's an endorsement (voters feel more directed)
            // Base 15%, +1% per 10 distance units. Endorsement reduces by 5%.
            const minDist = Math.min(...distances.map(d => d.dist));
            const baseAbstain = endorsedCandidateId ? 0.10 : 0.15;
            const abstainRate = Math.min(0.50, baseAbstain + (minDist / 1000));
            const abstainVotes = Math.round(elimVotes * abstainRate);
            const transferableVotes = elimVotes - abstainVotes;

            const endorsement = {
                eliminated_candidate: elim.faction_name,
                eliminated_party: elim.party_name || elim.faction_name,
                eliminated_faction_id: elim.faction_id,
                endorsed_candidate_id: endorsedCandidateId,
                endorsed_faction_name: endorsedCandidateId
                    ? runoffParties.find(rp => rp.id === endorsedCandidateId)?.faction_name || null
                    : null,
                has_player_endorsement: !!endorsedCandidateId,
                round1_votes: elimVotes,
                abstain_votes: abstainVotes,
                transfers: []
            };

            // Distribute transferable votes proportionally by affinity
            let distributed = 0;
            for (const a of affinities) {
                const xfer = Math.round(transferableVotes * a.affinity);
                runoffTally[a.id] = (runoffTally[a.id] || 0) + xfer;
                distributed += xfer;
                endorsement.transfers.push({
                    candidate_id: a.id,
                    candidate_name: a.name,
                    votes: xfer,
                    affinity_pct: Math.round(a.affinity * 100)
                });
            }
            // Rounding remainder
            if (distributed < transferableVotes && affinities.length > 0) {
                const rem = transferableVotes - distributed;
                const bestId = affinities.sort((a, b) => b.affinity - a.affinity)[0].id;
                runoffTally[bestId] += rem;
                const t = endorsement.transfers.find(t => t.candidate_id === bestId);
                if (t) t.votes += rem;
            }

            runoffTotalVotes += transferableVotes;
            runoffAbstentions += abstainVotes;
            endorsements.push(endorsement);
        }

        // Build runoff results
        runoffResults = runoffParties.map(p => {
            const votes = runoffTally[p.id] || 0;
            return {
                candidate_id: p.id,
                candidate_name: p.faction_name,
                party_name: p.party_name,
                faction_id: p.faction_id,
                ideology: p.ideology,
                trait_key: p.trait_key,
                votes,
                vote_percentage: runoffTotalVotes > 0
                    ? Math.round((votes / runoffTotalVotes) * 10000) / 100
                    : 0
            };
        }).sort((a, b) => b.votes - a.votes);

        round2Details = [];
        winner = runoffResults[0];
        winner.winner = true;

        runoffMeta = {
            endorsements,
            total_transferred: endorsements.reduce((s, e) => s + e.transfers.reduce((ts, t) => ts + t.votes, 0), 0),
            total_abstain: runoffAbstentions,
            runoff_total_votes: runoffTotalVotes,
            endorsed_party_name: endorsements.length > 0
                ? endorsements.sort((a, b) => b.round1_votes - a.round1_votes)[0]
                    ?.transfers.sort((a, b) => b.votes - a.votes)[0]?.candidate_name || null
                : null,
            abstain_votes: runoffAbstentions,
            protest_votes: 0
        };
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
        runoff_meta: runoffMeta,
        winner,
        candidateNames
    };
}
