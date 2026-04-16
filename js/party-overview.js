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
            return { id: p.id, pos: (score + 100) / 200, color: p.party_color || '#666' };
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
            supabase.from('faction_ideology').select('*'),  // fetch all, filter by party IDs after
            supabase.from('faction_electoral_standing').select('*').eq('nation_id', nationId),
            supabase.from('campaign_actions').select('*').eq('party_id', factionId).order('tick_performed', { ascending: false }).limit(20),
            supabase.from('caucus_factions').select('*').eq('party_id', factionId).eq('is_active', true),
            supabase.from('elections').select('*').eq('nation_id', nationId).eq('status', 'scheduled').order('election_tick', { ascending: true }).limit(5),
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

        // Next election — determine if it's a General (pres+parl same tick) or Midterm (parl only)
        const upcomingElections = electionResult.data || [];
        const nextElection = upcomingElections[0] || null;
        const nextElectionTicks = nextElection ? Math.max(0, nextElection.election_tick - currentTick) : null;
        let nextElectionLabel = null;
        if (nextElection && nation) {
            const isPresNation = nation.government_type?.toLowerCase().includes('presidential') ||
                nation.hos_election_method === 'direct_vote';
            if (isPresNation) {
                // Check if there's a presidential election at the same tick
                const hasPresAtSameTick = upcomingElections.some(e =>
                    e.election_type === 'presidential' && e.election_tick === nextElection.election_tick);
                nextElectionLabel = hasPresAtSameTick ? 'General' : 'Midterm';
            }
        }

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
            nextElectionLabel: nextElectionLabel,
            ideologyAxes: ideologyAxes,
        };

        renderPartyOverview(container);

    } catch (err) {
        console.error('[PartyOverview] Init error:', err);
        container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>';
    }
}

// ═══════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════

let _visibleParties = []; // toggled in legend

function renderPartyOverview(container) {
    const o = _overview;
    const faction = o.myFaction;
    const nation = _state.nation;
    const partyColor = faction?.party_color || faction?.color || '#c8a832';
    const currentTick = _state.shard?.current_tick || 0;

    // Init visible parties for legend
    if (_visibleParties.length === 0) {
        _visibleParties = [faction?.id, ...o.rivalParties.map(p => p.id)];
    }

    const adminName = o.administration?.admin_name || (o.isOpposition ? 'Opposition' : 'Government');
    const statusLabel = o.isOpposition ? 'OPPOSITION' : 'GOVERNING';
    const statusColor = o.isOpposition ? 'var(--orange)' : 'var(--green)';
    const seats = faction?.seats || 0;
    const totalSeats = nation?.total_seats || 100;
    const momentum = faction?.momentum ?? 50;

    container.innerHTML = `<div class="po-page">
        ${renderSummaryBar(o, partyColor, seats, totalSeats, momentum)}
        <div class="po-columns">
            <div class="po-col-left">
                ${renderIdentityCard(o, faction, partyColor, statusLabel, statusColor)}
                ${renderGovernanceTable(o)}
                ${renderIdeologySection(o, faction, partyColor, container)}
                ${renderCaucuses(o)}
            </div>
            <div class="po-col-center" id="po-center-col">
                ${renderMomentumCard(o, momentum)}
                ${renderActivityFeed(o)}
            </div>
            <div class="po-col-right" id="po-right-col">
                ${renderRivalParties(o, faction)}
                ${renderElectionFormula(o)}
                ${renderDecayNote(o)}
            </div>
        </div>
    </div>`;

    // Bind legend toggles
    container.querySelectorAll('.po-legend-item').forEach(el => {
        el.addEventListener('click', () => {
            const pid = el.dataset.partyId;
            if (pid === faction?.id) return; // can't hide yourself
            if (_visibleParties.includes(pid)) {
                _visibleParties = _visibleParties.filter(id => id !== pid);
            } else {
                _visibleParties.push(pid);
            }
            renderPartyOverview(container);
        });
    });
}

function renderSummaryBar(o, partyColor, seats, totalSeats, momentum) {
    const govScore = o.governanceScore;
    const govColor = govScore >= 0 ? 'var(--green)' : 'var(--red)';
    const adminName = o.isOpposition ? 'Opposition' : (o.administration?.admin_name || 'Government');
    const isMonarchy = (_state.nation?.government_type || '').toLowerCase().includes('monarchy');
    const elTicks = isMonarchy ? 'No elections' : (o.nextElectionTicks != null ? o.nextElectionTicks : '—');
    const elColor = isMonarchy ? 'var(--text-dim)' : ((typeof elTicks === 'number' && elTicks <= 3) ? 'var(--red)' : 'var(--text-bright)');
    const elLabel = isMonarchy ? 'NEXT ELECTION' : (o.nextElectionLabel ? 'NEXT ' + o.nextElectionLabel.toUpperCase() : 'NEXT ELECTION');

    return `<div class="po-summary">
        <div class="po-summary-cell" style="display:flex;flex-direction:row;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;background:${partyColor};"></div>
            <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-bright);">${esc(adminName)}</div>
                <div class="po-summary-sub">${o.ticksInPower} ticks in power</div>
            </div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">GOV. SCORE</div>
            <div class="po-summary-value" style="color:${govColor};">${govScore}</div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">MOMENTUM</div>
            <div style="display:flex;align-items:baseline;justify-content:center;gap:3px;">
                <span class="po-summary-value" style="color:var(--orange);">${momentum}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/ 100</span>
            </div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">SEATS</div>
            <div style="display:flex;align-items:baseline;justify-content:center;gap:3px;">
                <span class="po-summary-value" style="color:${partyColor};">${seats}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/ ${totalSeats}</span>
            </div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">${elLabel}</div>
            <div class="po-summary-value" style="color:${elColor};">${elTicks}${typeof elTicks === 'number' ? ' ticks' : ''}</div>
        </div>
    </div>`;
}

function renderIdentityCard(o, faction, partyColor, statusLabel, statusColor) {
    const leaderName = (faction?.leader_first_name && faction?.leader_last_name)
        ? `${faction.leader_first_name} ${faction.leader_last_name}` : 'Unknown';
    const leaderInitials = ((faction?.leader_first_name || '?')[0] + (faction?.leader_last_name || '?')[0]).toUpperCase();
    const leaderAge = faction?.leader_age ? `, Age ${faction.leader_age}` : '';
    const approval = faction?.approval_rating ?? 0;

    return `<div class="po-card po-identity" style="border-left-color:${partyColor};">
        <div class="po-identity-inner">
            <div class="po-identity-logo" style="color:${partyColor};background:${partyColor}12;border-color:${partyColor}33;">${leaderInitials}</div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                    <span class="po-identity-name">${esc(faction?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${statusColor};background:${statusColor}0a;border-color:${statusColor}44;">${statusLabel}</span>
                </div>
                <div class="po-identity-meta">${o.ticksInPower} ticks in power</div>
                <div class="po-leader-row">
                    <div class="po-leader-avatar" style="color:${partyColor};background:${partyColor}15;border-color:${partyColor}33;">${leaderInitials}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-size:10px;font-weight:600;color:var(--text-bright);">${esc(leaderName)}</span>
                            <span style="font-family:var(--font-mono);font-size:7px;color:${partyColor};">PARTY LEADER</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">APPROVAL</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--amber);">${approval}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

function renderGovernanceTable(o) {
    const deltas = o.governanceDeltas.slice(0, 12); // top 12
    const govScore = o.governanceScore;
    const govColor = govScore >= 0 ? 'var(--green)' : 'var(--red)';
    const decayNote = o.governanceDecayCycles > 0 && govScore > 0
        ? `Decay: ${((1 - o.governanceMultiplier) * 100).toFixed(1)}% (${o.governanceDecayCycles} cycles)`
        : '';

    const rowsHtml = deltas.map((d, i) => {
        const deltaColor = d.isGood ? 'var(--green)' : 'var(--red)';
        const sign = d.delta > 0 ? '+' : '';
        const statName = d.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `<div class="po-gov-row" style="${i < deltas.length - 1 ? 'border-bottom:1px solid rgba(200,196,184,0.03);' : ''}">
            <span class="po-gov-stat">${esc(statName)}</span>
            <span class="po-gov-val">${d.start.toFixed(1)}</span>
            <span class="po-gov-val">${d.now.toFixed(1)}</span>
            <span class="po-gov-delta" style="color:${deltaColor};">${sign}${d.delta.toFixed(1)}</span>
        </div>`;
    }).join('');

    return `<div class="po-card">
        <div class="po-card-header">
            <div style="display:flex;align-items:center;gap:6px;">
                <span class="po-card-title">GOVERNANCE</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${govColor};">${govScore}</span>
            </div>
            <span class="po-card-subtitle">${decayNote}</span>
        </div>
        <div style="display:flex;padding:4px 12px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
            <span style="flex:1;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.04em;">STAT</span>
            <span style="width:40px;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);text-align:right;">START</span>
            <span style="width:40px;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);text-align:right;">NOW</span>
            <span style="width:44px;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);text-align:right;">DELTA</span>
        </div>
        ${rowsHtml || '<div style="padding:12px;text-align:center;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);font-style:italic;">No governance data yet.</div>'}
    </div>`;
}

function renderIdeologySection(o, faction, partyColor) {
    // Build legend
    const allLegend = [
        { id: faction?.id, name: 'You', color: partyColor },
        ...o.rivalParties.map(p => ({ id: p.id, name: p.abbreviation || p.faction_name?.slice(0, 3) || '?', color: p.party_color || '#666' })),
    ];

    const legendHtml = allLegend.map(p => {
        const isOn = _visibleParties.includes(p.id);
        return `<div class="po-legend-item ${isOn ? 'active' : 'inactive'}" data-party-id="${p.id}" style="${isOn ? `background:${p.color}12;border-color:${p.color}44;` : ''}">
            <div class="po-legend-dot" style="background:${isOn ? p.color : 'var(--text-dim)'};"></div>
            <span class="po-legend-name">${esc(p.name)}</span>
        </div>`;
    }).join('');

    const axesHtml = o.ideologyAxes.map(axis => {
        const dotsHtml = axis.parties
            .filter(p => _visibleParties.includes(p.id))
            .map(p => `<div class="po-axis-dot" style="left:${p.pos * 100}%;background:${p.color};"></div>`)
            .join('');

        const zones = [20, 40, 60, 80].map(pct =>
            `<div class="po-axis-zone" style="left:${pct}%;"></div>`
        ).join('');

        return `<div class="po-axis">
            <div class="po-axis-labels">
                <span class="po-axis-label">${esc(axis.left)}</span>
                <span class="po-axis-name">${esc(axis.name)}</span>
                <span class="po-axis-label">${esc(axis.right)}</span>
            </div>
            <div class="po-axis-track">${zones}${dotsHtml}</div>
        </div>`;
    }).join('');

    return `<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">IDEOLOGY</span>
        </div>
        <div style="padding:8px 12px;">
            <div class="po-legend">${legendHtml}</div>
            ${axesHtml}
        </div>
    </div>`;
}

function renderCaucuses(o) {
    const activeCaucuses = (o.caucuses || []).filter(c => c.name && c.name !== 'Unnamed');
    if (activeCaucuses.length === 0) {
        return `<div class="po-card">
            <div class="po-card-header">
                <span class="po-card-title">INTERNAL CAUCUSES</span>
                <span class="po-card-subtitle">None</span>
            </div>
        </div>`;
    }

    const mySeats = o.faction?.seats || 0;
    const rowsHtml = activeCaucuses.map(c => {
        const loyalty = c.relationship_score ?? 50;
        const loyaltyColor = loyalty > 60 ? 'var(--green)' : loyalty > 40 ? 'var(--amber)' : 'var(--red)';
        const caucusSeats = Math.round((c.seat_share || 0) * mySeats);
        const axisLabel = (c.dominant_axis || '').replace(/_/g, '/');
        const wingLabel = c.wing_end === 'left' ? axisLabel.split('/')[0] : axisLabel.split('/')[1] || '';
        return `<div class="po-caucus-row">
            <div>
                <div class="po-caucus-name">${esc(c.name)}</div>
                <div class="po-caucus-wing" style="color:var(--text-dim);">${esc(wingLabel)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="po-caucus-seats">${caucusSeats} seats</span>
                <div style="width:50px;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;margin-bottom:1px;">LOYALTY</div>
                    <div style="width:100%;height:3px;background:var(--border-main);"><div style="height:100%;width:${loyalty}%;background:${loyaltyColor};"></div></div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${loyaltyColor};text-align:right;margin-top:1px;">${loyalty}</div>
                </div>
            </div>
        </div>`;
    }).join('');

    return `<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">INTERNAL CAUCUSES</span>
            <span class="po-card-subtitle">${activeCaucuses.length} active \u00B7 ${mySeats} seats</span>
        </div>
        ${rowsHtml}
    </div>`;
}

// ═══════════════════════════════════════════════════
// CENTER COLUMN
// ═══════════════════════════════════════════════════

function renderMomentumCard(o, momentum) {
    const decayPct = 8;
    const decayPerTick = Math.round(momentum * decayPct / 100 * 10) / 10;
    const barPct = Math.min(100, Math.max(0, momentum));
    const momColor = momentum >= 60 ? 'var(--green)' : momentum >= 30 ? 'var(--orange)' : 'var(--red)';

    return `<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">MOMENTUM</span>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--red);">losing ${decayPerTick}/tick</span>
        </div>
        <div style="padding:10px 12px;">
            <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:6px;">
                <span style="font-family:var(--font-mono);font-size:28px;font-weight:700;color:${momColor};">${momentum}</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">/ 100</span>
            </div>
            <div style="width:100%;height:4px;background:var(--border-main);">
                <div style="height:100%;width:${barPct}%;background:${momColor};"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">Decays ${decayPct}%/tick</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">30% of election outcome</span>
            </div>
        </div>
    </div>`;
}

function renderActivityFeed(o) {
    const actions = o.recentActivity || [];
    const currentTick = _state.shard?.current_tick || 0;

    if (actions.length === 0) {
        return `<div class="po-card" style="flex:1;">
            <div class="po-card-header">
                <span class="po-card-title">RECENT ACTIVITY</span>
            </div>
            <div style="padding:24px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No recent actions.</div>
        </div>`;
    }

    const ACTION_LABELS = {
        rally: 'Rally',
        press_conference: 'Press Conference',
        attack: 'Attack Ad',
        issue_statement: 'Statement',
        ideological_pivot: 'Ideology Shift',
        take_stance: 'Took Stance',
        poll_now: 'Polled',
        endorse: 'Endorsement',
        lobby: 'Lobby',
    };

    const rowsHtml = actions.map(a => {
        const ticksAgo = currentTick - (a.tick_performed || 0);
        const agoLabel = ticksAgo === 0 ? '0t' : ticksAgo + 't';
        const result = a.result || {};
        const momDelta = result.momentumDelta || result.momentum_delta
            || (result.effects || []).reduce((s, e) => s + (e.stat === 'Momentum' ? e.value : 0), 0)
            || 0;
        const momSign = momDelta > 0 ? '+' : '';
        const momColor = momDelta > 0 ? 'var(--green)' : momDelta < 0 ? 'var(--red)' : 'var(--text-dim)';
        const label = ACTION_LABELS[a.action_type] || a.action_type?.replace(/_/g, ' ') || '?';

        // Build description from result
        let desc = label;
        if (a.action_type === 'rally') {
            desc = 'Rally: ' + (result.outcomeName || 'Unknown') + (momDelta ? ' (' + momSign + momDelta + ')' : '');
        } else if (a.action_type === 'press_conference') {
            desc = 'Press Conference (' + momSign + momDelta + ')';
        } else if (a.action_type === 'attack') {
            desc = 'Attack on ' + (result.targetName || 'rival');
        } else if (a.action_type === 'issue_statement') {
            desc = 'Issued statement' + (momDelta ? ' (' + momSign + momDelta + ')' : '');
        } else if (a.action_type === 'take_stance') {
            desc = 'Took stance on ' + (result.issueLabel || 'issue');
        } else if (a.action_type === 'ideological_pivot') {
            desc = 'Ideology shift: ' + (result.targetAxis || '');
        } else if (a.action_type === 'poll_now') {
            desc = 'Polled (margin: ' + (result.pollMargin || '?') + ')';
        }

        return `<div style="padding:5px 12px;border-bottom:1px solid rgba(200,196,184,0.03);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:9px;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px;">${esc(desc)}</span>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${momColor};">${momDelta !== 0 ? momSign + momDelta : '\u2014'}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);width:20px;text-align:right;">${agoLabel}</span>
            </div>
        </div>`;
    }).join('');

    return `<div class="po-card" style="flex:1;">
        <div class="po-card-header">
            <span class="po-card-title">RECENT ACTIVITY</span>
        </div>
        <div style="max-height:380px;overflow-y:auto;">${rowsHtml}</div>
    </div>`;
}

function renderQuickInfoCards() {
    return `<div style="display:flex;gap:6px;">
        <div class="po-card" style="flex:1;padding:8px 10px;">
            <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.06em;text-transform:uppercase;">LEGISLATION</div>
            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);margin-top:3px;line-height:1.5;">
                <span style="color:var(--text-bright);font-weight:700;">Sponsoring a bill:</span> +2 momentum
            </div>
            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);margin-top:1px;line-height:1.5;">
                <span style="color:var(--green);font-weight:700;">Bill passes:</span> YES voters +2 per article
            </div>
            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);margin-top:1px;line-height:1.5;">
                <span style="color:var(--red);font-weight:700;">Bill fails:</span> YES lose -2, NO gain +2
            </div>
        </div>
        <div class="po-card" style="flex:1;padding:8px 10px;">
            <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.06em;text-transform:uppercase;">CAMPAIGN ACTIONS</div>
            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);margin-top:3px;line-height:1.5;">
                <span style="color:var(--text-bright);font-weight:700;">Rally</span> (1 AP) \u2014 Moderate, reliable momentum gain.
            </div>
            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);margin-top:1px;line-height:1.5;">
                <span style="color:var(--text-bright);font-weight:700;">Press Conf.</span> (1 AP) \u2014 Reactive narrative control.
            </div>
        </div>
    </div>`;
}

// ═══════════════════════════════════════════════════
// RIGHT COLUMN
// ═══════════════════════════════════════════════════

function renderRivalParties(o, myFaction) {
    const rivals = o.rivalParties;
    const admin = o.administration;
    const coalitionIds = new Set(
        (Array.isArray(admin?.coalition_parties) ? admin.coalition_parties : [])
            .map(entry => {
                if (!entry) return null;
                if (typeof entry === 'string') return entry;
                if (typeof entry === 'object') return entry.party_id || entry.id || null;
                return null;
            })
            .filter(Boolean)
    );
    const pmPartyId = admin?.pm_party_id;
    const totalSeats = _state.nation?.total_seats || 100;

    const AXIS_LABELS = ['SEC/FRE', 'TRA/PRO', 'IND/COL', 'LIB/EQL', 'GLB/NAT'];
    const AXIS_KEYS = ['security_freedom', 'tradition_progress', 'individualism_collectivism', 'liberty_equality', 'globalism_nationalism'];

    const rivalHtml = rivals.map(party => {
        const pColor = party.party_color || '#666';
        const abbr = party.abbreviation || party.faction_name?.slice(0, 3)?.toUpperCase() || '?';
        const leaderName = (party.leader_first_name && party.leader_last_name)
            ? `${party.leader_first_name} ${party.leader_last_name}` : 'Unknown';
        const seats = party.seats || 0;

        // Governing status
        const isPM = party.id === pmPartyId;
        const isCoalition = coalitionIds.has(party.id);
        let statusLabel, statusColor;
        if (isPM) {
            statusLabel = 'GOVERNING \u2014 LEAD';
            statusColor = 'var(--green)';
        } else if (isCoalition) {
            statusLabel = 'GOVERNING \u2014 JUNIOR';
            statusColor = 'var(--green)';
        } else {
            statusLabel = 'OPPOSITION';
            statusColor = 'var(--orange)';
        }

        // Seat diff vs you
        const seatDiff = seats - (myFaction?.seats || 0);
        const diffColor = seatDiff > 0 ? 'var(--green)' : seatDiff < 0 ? 'var(--red)' : 'var(--text-dim)';

        // Mini ideology axes
        const ideo = o.factionIdeology[party.id];
        const miniAxesHtml = AXIS_KEYS.map((key, i) => {
            const score = ideo ? Number(ideo[key] ?? 0) : 0;
            const pos = (score + 100) / 200;
            return `<div style="display:flex;align-items:center;gap:6px;">
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:42px;text-align:right;">${AXIS_LABELS[i]}</span>
                <div style="flex:1;height:5px;background:var(--border-main);position:relative;">
                    <div style="position:absolute;top:50%;left:${pos * 100}%;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:50%;background:${pColor};"></div>
                </div>
            </div>`;
        }).join('');

        return `<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${pColor}15;border:1px solid ${pColor}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${pColor};">${esc(abbr)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${esc(party.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${esc(leaderName)}</div>
                    </div>
                </div>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${statusColor};background:${statusColor}0a;border:1px solid ${statusColor}44;white-space:nowrap;">${statusLabel}</span>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">SEATS</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${seats > 0 ? 'var(--text-bright)' : 'var(--text-dim)'};">${seats}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">/ ${totalSeats}</span>
                </div>
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">VS YOU</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${diffColor};">${seatDiff > 0 ? '+' : ''}${seatDiff}</span>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:3px;">${miniAxesHtml}</div>
        </div>`;
    }).join('');

    return `<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">RIVAL PARTIES</span>
            <span class="po-card-subtitle">${rivals.length} parties</span>
        </div>
        ${rivalHtml || '<div style="padding:16px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No rival parties.</div>'}
    </div>`;
}

function renderElectionFormula(o) {
    const govColor = o.governanceScore >= 0 ? 'var(--green)' : 'var(--red)';
    return `<div class="po-card" style="padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.06em;color:var(--text-dim);margin-bottom:4px;">ELECTION FORMULA</div>
        <div style="display:flex;gap:6px;">
            <div style="flex:1;padding:6px 8px;text-align:center;background:var(--bg-card);border:1px solid var(--border-main);">
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${govColor};">40%</div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);margin-top:2px;">Governance</div>
            </div>
            <div style="flex:1;padding:6px 8px;text-align:center;background:var(--bg-card);border:1px solid var(--border-main);">
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--orange);">30%</div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);margin-top:2px;">Momentum</div>
            </div>
            <div style="flex:1;padding:6px 8px;text-align:center;background:var(--bg-card);border:1px solid var(--border-main);">
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">30%</div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);margin-top:2px;">Ideology</div>
            </div>
        </div>
    </div>`;
}

function renderDecayNote() {
    return `<div style="background:var(--bg-card);border:1px solid var(--border-main);padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.6;">
            <span style="color:var(--amber);font-weight:700;">\u26A0 INCUMBENCY DECAY:</span> Positive governance scores erode 3% every 24 ticks. Long-serving governments must keep delivering results.
            <span style="color:var(--text-bright);font-weight:700;"> Momentum resets to 0</span> after every election. Rebuild each cycle.
        </div>
    </div>`;
}
