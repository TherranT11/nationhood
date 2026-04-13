// js/party-overview.js — Parties tab: consolidated party overview
//
// Fetches all data needed for the Parties overview in parallel:
// - Active administration + governance score
// - All factions in nation (rivals)
// - Faction ideology for all parties
// - Electoral standings (ideology capture, vote share)
// - Recent campaign actions (activity feed)
// - Caucus factions
// - Election schedule
//
// Exports initPartyOverview(supabase, state, containerId)

import { IDEOLOGY_AXES } from './game/ideology.js';
import { checkOppositionStatus } from './game/agitator.js';
import { STATS_HIGHER_IS_BETTER, STATS_LOWER_IS_BETTER, statDirectionSign } from './game/stats.js';

let _supabase = null;
let _state = null;

// All fetched data stored here for rendering phases
export let _overview = {
    isOpposition: true,
    administration: null,       // active administration row
    governanceScore: 0,
    governanceDeltas: [],       // { key, start, now, delta, isGood }
    governanceMultiplier: 1,
    governanceDecayCycles: 0,
    ticksInPower: 0,
    myFaction: null,
    allParties: [],             // all party factions in this nation
    rivalParties: [],           // allParties minus mine
    factionIdeology: {},        // { factionId: { liberty_equality, ... } }
    electoralStandings: [],     // faction_electoral_standing rows
    recentActivity: [],         // campaign_actions for my faction
    caucuses: [],               // caucus_factions for my faction
    nextElection: null,         // next scheduled election
    nextElectionTicks: null,    // ticks until next election
    ideologyAxes: [],           // processed axis data with positions + capture
};

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// ═══════════════════════════════════════════════════
// GOVERNANCE SCORE (mirrors politics.js logic)
// ═══════════════════════════════════════════════════

const NATION_STAT_COLUMNS = [
    ...STATS_HIGHER_IS_BETTER,
    ...STATS_LOWER_IS_BETTER,
];

function computeGovernanceScore(nation, statsAtStart, startedAtTick, currentTick) {
    const ticksInPower = currentTick - (startedAtTick || currentTick);
    if (!statsAtStart) return { score: 0, deltas: [], decayCycles: 0, multiplier: 1, ticksInPower };

    let sum = 0, count = 0;
    const deltas = [];

    for (const key of NATION_STAT_COLUMNS) {
        const dir = statDirectionSign(key);
        if (dir === 0) continue;
        const start = Number(statsAtStart[key] ?? 0);
        const now = Number(nation[key] ?? 0);
        const raw = now - start;
        if (raw === 0) continue;
        const signed = raw * dir;
        const isGood = signed > 0;
        deltas.push({ key, start, now, delta: raw, signed, dir, isGood });
        sum += signed;
        count++;
    }

    let score = count > 0 ? sum / count : 0;
    const decayCycles = Math.floor(ticksInPower / 24);
    const multiplier = score > 0 ? Math.pow(0.97, decayCycles) : 1;
    score *= multiplier;

    return { score: Math.round(score * 10) / 10, deltas, decayCycles, multiplier, ticksInPower };
}

// ═══════════════════════════════════════════════════
// IDEOLOGY AXIS PROCESSING
// ═══════════════════════════════════════════════════

function processIdeologyAxes(myFactionId, allIdeology, allParties) {
    return IDEOLOGY_AXES.map(axis => {
        const myIdeo = allIdeology[myFactionId];
        const myScore = myIdeo ? Number(myIdeo[axis.key] ?? 0) : 0;
        // Convert -100..+100 score to 0..1 position (0 = left, 1 = right)
        const myPos = (myScore + 100) / 200;

        const parties = allParties.map(p => {
            const ideo = allIdeology[p.id];
            const score = ideo ? Number(ideo[axis.key] ?? 0) : 0;
            return { id: p.id, pos: (score + 100) / 200, color: p.color || '#666' };
        });

        return {
            key: axis.key,
            name: `${axis.leftLabel} / ${axis.rightLabel}`,
            left: axis.leftLabel.toUpperCase(),
            right: axis.rightLabel.toUpperCase(),
            leftColor: axis.leftColor,
            rightColor: axis.rightColor,
            yourPos: myPos,
            parties: parties,
        };
    });
}

// ═══════════════════════════════════════════════════
// INIT — FETCH ALL DATA
// ═══════════════════════════════════════════════════

/**
 * Initialize the Parties overview tab.
 * Fetches all required data in parallel and stores in _overview.
 *
 * @param {object} supabase
 * @param {object} state — { faction, nation, shard }
 * @param {string} containerId — DOM element to render into
 */
export async function initPartyOverview(supabase, state, containerId) {
    _supabase = supabase;
    _state = state;

    const container = document.getElementById(containerId);
    if (!container) return;

    const faction = state.faction;
    const nation = state.nation;
    const nationId = nation?.id;
    const factionId = faction?.id;

    if (!faction || !nationId) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No faction data.</div>';
        return;
    }

    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Loading party overview...</div>';

    try {
        // Fetch everything in parallel
        const currentTick = state.shard?.current_tick || 0;

        const [
            oppositionResult,
            partiesResult,
            ideologyResult,
            standingsResult,
            activityResult,
            caucusResult,
            electionResult,
        ] = await Promise.all([
            checkOppositionStatus(supabase, nationId, factionId),
            supabase.from('factions').select('*').eq('nation_id', nationId).eq('faction_type', 'party'),
            supabase.from('faction_ideology').select('*').eq('nation_id', nationId),
            supabase.from('faction_electoral_standing').select('*').eq('nation_id', nationId),
            supabase.from('campaign_actions').select('*').eq('party_id', factionId).order('tick_performed', { ascending: false }).limit(20),
            supabase.from('caucus_factions').select('*').eq('party_id', factionId),
            supabase.from('elections').select('*').eq('nation_id', nationId).eq('status', 'scheduled').order('election_tick', { ascending: true }).limit(1),
        ]);

        // Log errors but don't fail
        if (partiesResult.error) console.error('[PartyOverview] Parties fetch error:', partiesResult.error.message);
        if (ideologyResult.error) console.error('[PartyOverview] Ideology fetch error:', ideologyResult.error.message);
        if (standingsResult.error) console.error('[PartyOverview] Standings fetch error:', standingsResult.error.message);
        if (activityResult.error) console.error('[PartyOverview] Activity fetch error:', activityResult.error.message);
        if (caucusResult.error) console.error('[PartyOverview] Caucus fetch error:', caucusResult.error.message);
        if (electionResult.error) console.error('[PartyOverview] Election fetch error:', electionResult.error.message);

        const allParties = partiesResult.data || [];
        const admin = oppositionResult.administration;

        // Build ideology lookup: { factionId: row }
        const ideoMap = {};
        for (const row of (ideologyResult.data || [])) {
            ideoMap[row.faction_id] = row;
        }

        // Compute governance score
        let govResult = { score: 0, deltas: [], decayCycles: 0, multiplier: 1, ticksInPower: 0 };
        if (admin && admin.stats_at_start) {
            govResult = computeGovernanceScore(nation, admin.stats_at_start, admin.started_at_tick, currentTick);
        }

        // Next election
        const nextElection = (electionResult.data || [])[0] || null;
        const nextElectionTicks = nextElection ? Math.max(0, nextElection.election_tick - currentTick) : null;

        // Process ideology axes
        const ideologyAxes = processIdeologyAxes(factionId, ideoMap, allParties);

        // Store everything
        _overview = {
            isOpposition: oppositionResult.isOpposition,
            administration: admin,
            governanceScore: govResult.score,
            governanceDeltas: govResult.deltas.sort((a, b) => Math.abs(b.signed) - Math.abs(a.signed)),
            governanceMultiplier: govResult.multiplier,
            governanceDecayCycles: govResult.decayCycles,
            ticksInPower: govResult.ticksInPower,
            myFaction: faction,
            allParties: allParties,
            rivalParties: allParties.filter(p => p.id !== factionId),
            factionIdeology: ideoMap,
            electoralStandings: standingsResult.data || [],
            recentActivity: activityResult.data || [],
            caucuses: caucusResult.data || [],
            nextElection: nextElection,
            nextElectionTicks: nextElectionTicks,
            ideologyAxes: ideologyAxes,
        };

        // Phase 2-4 will call renderPartyOverview(container) here
        container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Party overview data loaded. Rendering coming in Phase 2.</div>';

    } catch (err) {
        console.error('[PartyOverview] Init error:', err);
        container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>';
    }
}
