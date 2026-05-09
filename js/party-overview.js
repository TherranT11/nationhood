// js/party-overview.js — Parties tab: consolidated party overview
//
// Fetches all data needed for the Parties overview in parallel:
// - Active administration
// - All factions in nation (rivals)
// - Sector strongholds for all parties (Phase 4 — replaces ideology axes)
// - Electoral standings (vote share)
// - Recent campaign actions (activity feed)
// - Caucus factions
// - Election schedule
//
// Exports initPartyOverview(supabase, state, containerId)

import { getStrongholdSectors } from './game/sectors.js';
import { getGoverningStatus, getGoverningStatusFor } from './game/agitator.js';
import { hasElectedPresident } from './game/government-types.js';
import { blocTagHtml, loadBlocMap } from './common.js';

let _supabase = null;
let _state = null;

// All fetched data stored here for rendering phases
export let _overview = {
    isGoverning: false,
    statusLabel: 'OPPOSITION',  // GOVERNING | OPPOSITION | LOYAL | DISSIDENT
    administration: null,       // active administration row
    ticksInPower: 0,
    myFaction: null,
    allParties: [],             // all party factions in this nation
    rivalParties: [],           // allParties minus mine
    strongholdsByParty: {},     // { factionId: [{ sector_key, name, contribution }, ...top 3] }
    passedBills: [],            // recently-passed bills in this nation, with sector_effects + voter stances
    sectors: [],                // active sectors in this nation (sector_key → name lookup for the bills feed)
    caucuses: [],               // caucus_factions for my faction
    nextElection: null,         // next scheduled election
    nextElectionTicks: null,    // ticks until next election
};

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// ═══════════════════════════════════════════════════
// SECTOR STRONGHOLDS PROCESSING (Phase 4)
// ═══════════════════════════════════════════════════

// Compute each party's top-3 stronghold sectors. Returns
// { factionId: [{ sector_key, name, contribution }, ...] }.
// A party with no popularity data gets an empty array — the renderer
// shows "Unaligned" in that case.
function processStrongholds(allParties, sectors, popularityRows) {
    const out = {};
    for (const p of allParties) {
        out[p.id] = getStrongholdSectors(p.id, sectors, popularityRows, 3);
    }
    return out;
}

// Pivots faction_sector_popularity into sector-first rows: every active
// sector in the nation, sorted by weight DESC then by name, with the top 3
// parties by popularity attached as a `top3` array. Tie-break is total
// seats DESC (per Q3 of the Sector Ranking design). Underfilled top-3
// slots are dropped — sectors with fewer than 3 parties scoring above 0
// just render fewer chips, no placeholders.
function processSectorRanking(allParties, sectors, popularityRows) {
    const partyMap = new Map(allParties.map(p => [p.id, p]));
    const popBySector = new Map();  // sector_id → [{party_id, popularity}]
    for (const row of popularityRows) {
        const list = popBySector.get(row.sector_id) || [];
        list.push({ party_id: row.faction_id, popularity: Number(row.popularity) || 0 });
        popBySector.set(row.sector_id, list);
    }

    return sectors.map(s => {
        const candidates = (popBySector.get(s.id) || [])
            .filter(c => c.popularity > 0 && partyMap.has(c.party_id))
            .map(c => {
                const p = partyMap.get(c.party_id);
                return {
                    party_id:     p.id,
                    abbreviation: p.abbreviation || (p.faction_name || '?').slice(0, 3).toUpperCase(),
                    color:        p.party_color || '#888',
                    seats:        Number(p.seats) || 0,
                    popularity:   c.popularity,
                };
            });
        candidates.sort((a, b) => {
            if (b.popularity !== a.popularity) return b.popularity - a.popularity;
            return b.seats - a.seats;
        });
        return {
            sector_key:  s.sector_key,
            name:        s.name,
            description: s.description || '',
            weight:      Number(s.weight) || 0,
            // Full popularity-sorted list. The renderer splits the
            // viewer's row out separately so it always shows on the
            // right; the top-3 chips slice excludes the viewer.
            candidates,
        };
    }).sort((a, b) => {
        if (b.weight !== a.weight) return b.weight - a.weight;
        return (a.name || '').localeCompare(b.name || '');
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
            governingResult,
            partiesResult,
            sectorsResult,
            passedBillsResult,
            caucusResult,
            electionResult,
            ministriesResult,
            blocMap,
        ] = await Promise.all([
            getGoverningStatus(supabase, nationId, factionId),
            supabase.from('factions').select('*').eq('nation_id', nationId).eq('faction_type', 'party'),
            // Phase 4: replaced faction_ideology fetch with sectors. Strongholds
            // come from joining sectors + faction_sector_popularity below.
            supabase.from('sectors')
                .select('id, sector_key, name, description, weight, base_turnout, is_active')
                .eq('nation_id', nationId)
                .eq('is_active', true)
                .order('display_order'),
            // Recently-passed bills feed. Mirrors the join shape used by
            // processSectorShifts in advance-tick — sector_effects come from
            // the chosen policy_option. bill_support stances let the renderer
            // split parties into "gained" (sponsor + yes) and "lost" (no).
            supabase.from('bills')
                .select('id, bill_name, bill_type, proposed_by, passed_tick, bill_articles(selected_option:policy_options!selected_option_id(sector_effects)), bill_support(faction_id, stance)')
                .eq('nation_id', nationId)
                .eq('status', 'passed')
                .not('passed_tick', 'is', null)
                .order('passed_tick', { ascending: false })
                .limit(15),
            // Phase 5b: caucus_factions table dropped. Empty result preserves
            // the renderCaucuses path (shows "None" when array is empty).
            Promise.resolve({ data: [], error: null }),
            supabase.from('elections').select('*').eq('nation_id', nationId).eq('status', 'scheduled').order('election_tick', { ascending: true }).limit(5),
            supabase.from('ministries').select('party_id').eq('nation_id', nationId).eq('is_active', true),
            loadBlocMap(nationId),
        ]);

        // Log errors but don't fail
        if (partiesResult.error) console.error('[PartyOverview] Parties fetch error:', partiesResult.error.message);
        if (sectorsResult.error) console.error('[PartyOverview] Sectors fetch error:', sectorsResult.error.message);
        if (caucusResult.error) console.error('[PartyOverview] Caucus fetch error:', caucusResult.error.message);
        if (electionResult.error) console.error('[PartyOverview] Election fetch error:', electionResult.error.message);
        if (passedBillsResult.error) console.error('[PartyOverview] Passed-bills fetch error:', passedBillsResult.error.message);

        const allParties = partiesResult.data || [];
        const sectors = sectorsResult.data || [];
        const admin = governingResult.administration;
        // Pre-computed set of party IDs holding an active ministry, used by
        // getGoverningStatusFor to determine cabinet-held status in rival rows.
        const ministryPartyIds = new Set(
            (ministriesResult.data || []).map(m => m.party_id).filter(Boolean)
        );

        // Phase 4: load popularity rows for the parties we care about, then
        // compute each party's top-3 stronghold sectors.
        let popularityRows = [];
        if (allParties.length > 0 && sectors.length > 0) {
            const partyIds = allParties.map(p => p.id);
            const { data: pop, error: popErr } = await supabase
                .from('faction_sector_popularity')
                .select('faction_id, sector_id, popularity')
                .in('faction_id', partyIds);
            if (popErr) console.error('[PartyOverview] Popularity fetch error:', popErr.message);
            popularityRows = pop || [];
        }
        const strongholdsByParty = processStrongholds(allParties, sectors, popularityRows);
        // Sector-first pivot for the SECTOR RANKING card: every active
        // sector in the nation with the top 3 parties by popularity.
        const sectorRanking = processSectorRanking(allParties, sectors, popularityRows);

        const ticksInPower = admin?.started_at_tick != null
            ? Math.max(0, currentTick - admin.started_at_tick)
            : 0;

        // Next election — determine if it's a General (pres+parl same tick) or Midterm (parl only)
        const upcomingElections = electionResult.data || [];
        const nextElection = upcomingElections[0] || null;
        const nextElectionTicks = nextElection ? Math.max(0, nextElection.election_tick - currentTick) : null;
        let nextElectionLabel = null;
        if (nextElection && nation) {
            if (hasElectedPresident(nation)) {
                // Check if there's a presidential election at the same tick
                const hasPresAtSameTick = upcomingElections.some(e =>
                    e.election_type === 'presidential' && e.election_tick === nextElection.election_tick);
                nextElectionLabel = hasPresAtSameTick ? 'General' : 'Midterm';
            }
        }

        // Process ideology axes
        // Store everything
        _overview = {
            isGoverning: governingResult.isGoverning,
            statusLabel: governingResult.label,
            administration: admin,
            ministryPartyIds,
            ticksInPower,
            myFaction: faction,
            allParties: allParties,
            rivalParties: allParties.filter(p => p.id !== factionId),
            blocMap,
            strongholdsByParty,
            sectorRanking,
            passedBills: passedBillsResult.data || [],
            sectors,
            caucuses: caucusResult.data || [],
            nextElection: nextElection,
            nextElectionTicks: nextElectionTicks,
            nextElectionLabel: nextElectionLabel,
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


function renderPartyOverview(container) {
    const o = _overview;
    const faction = o.myFaction;
    const nation = _state.nation;
    const partyColor = faction?.party_color || faction?.color || '#c8a832';
    const currentTick = _state.shard?.current_tick || 0;

    const adminName = o.administration?.admin_name || (o.isGoverning ? 'Government' : 'Opposition');
    const statusLabel = o.statusLabel;
    const statusColor = o.isGoverning ? 'var(--green)' : 'var(--orange)';
    const seats = faction?.seats || 0;
    const totalSeats = nation?.total_seats || 100;
    const momentum = faction?.momentum ?? 50;

    container.innerHTML = `<div class="po-page">
        ${renderSummaryBar(o, partyColor, seats, totalSeats, momentum)}
        <div class="po-columns">
            <div class="po-col-left">
                ${renderIdentityCard(o, faction, partyColor, statusLabel, statusColor)}
                ${renderStrongholdsSection(o, faction, partyColor)}
                ${renderCaucuses(o)}
            </div>
            <div class="po-col-center" id="po-center-col">
                ${renderMechanicsCard()}
                ${renderPassedBillsFeed(o)}
            </div>
            <div class="po-col-right" id="po-right-col">
                ${renderRivalParties(o, faction)}
                ${renderDecayNote(o)}
            </div>
        </div>
    </div>`;
}

function renderSummaryBar(o, partyColor, seats, totalSeats, momentum) {
    const adminName = o.isGoverning ? (o.administration?.admin_name || 'Government') : 'Opposition';
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
        <!-- KNOWN-STALE: factions.momentum no longer drives elections —
             run_election was rewritten in 20260517 to compute vote share
             from sector popularity. This cell stays for now to avoid a
             scope creep on the bills-feed change; replace with a real
             SECTORS / POPULARITY summary metric in a follow-up. -->
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
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap;">
                    <span class="po-identity-name">${esc(faction?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${statusColor};background:${statusColor}0a;border-color:${statusColor}44;">${statusLabel}</span>
                    ${blocTagHtml(faction?.bloc_id, o.blocMap)}
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

// Sector-first ranking. Every active sector in the nation, sorted by
// weight DESC then alphabetical. Each row shows the sector name + a
// weight badge (1, 2, or 3), then up to three chips for the parties
// with the highest popularity in that sector. Tie-break is total seats
// DESC. The player's own party is highlighted in their party color
// when it lands in the top 3.
function renderStrongholdsSection(o, faction, partyColor) {
    const myFactionId = faction?.id;
    const ranking = o.sectorRanking || [];

    const renderChip = (p, mineColorOverride) => {
        const isMine = p.party_id === myFactionId;
        const color  = isMine ? (mineColorOverride || partyColor) : (p.color || '#888');
        // Storage is integer tenths (0-100); display 0-10 with one decimal.
        const popDisplay = (Math.round(p.popularity) / 10).toFixed(1);
        const labelHtml = isMine
            ? `<span class="po-stronghold-chip-label" style="font-weight:700;">You</span>`
            : `<span class="po-stronghold-chip-label">${esc(p.abbreviation)}</span>`;
        return `<div class="po-stronghold-chip" style="border-color:${color}66;background:${color}14;">
            ${labelHtml}
            <span class="po-stronghold-chip-label" style="color:${color};font-weight:700;margin-left:4px;">${popDisplay}</span>
        </div>`;
    };

    const rowsHtml = ranking.map(s => {
        // Viewer's row split out from the rest so it always renders on the
        // far right, separated. Top-3 area excludes the viewer; if they're
        // genuinely top-3 they show up only on the right.
        const candidates = s.candidates || [];
        const otherChips = candidates
            .filter(p => p.party_id !== myFactionId)
            .slice(0, 3)
            .map(p => renderChip(p))
            .join('');
        const myCandidate = candidates.find(p => p.party_id === myFactionId) || null;
        const myChip = myCandidate
            ? renderChip(myCandidate)
            // Synthesize a zero-popularity chip so the "You" pill always
            // renders even when the player has no recorded standing yet.
            : renderChip({ party_id: myFactionId, popularity: 0, color: partyColor });

        const othersHtml = otherChips
            ? `<div class="po-stronghold-chips">${otherChips}</div>`
            : `<div style="font-size:9px;color:var(--text-dim);font-family:var(--font-mono);padding:4px 0;">No other party popularity yet</div>`;

        const weight = Number(s.weight) || 0;
        const weightColor = weight >= 3 ? 'var(--gold, #c9a449)'
                          : weight === 2 ? 'var(--amber, #c8a64e)'
                          : 'var(--text-secondary)';
        const weightBadge = `<span style="display:inline-block;min-width:18px;padding:1px 5px;font-family:var(--font-mono);font-size:9px;font-weight:700;color:${weightColor};border:1px solid ${weightColor}66;background:${weightColor}14;text-align:center;letter-spacing:0;">w${weight}</span>`;

        const desc = (s.description || '').trim();
        const descHtml = desc
            ? `<div style="font-family:var(--font-mono);font-size:9.5px;color:var(--text-dim);line-height:1.4;margin-top:2px;">${esc(desc)}</div>`
            : '';

        return `<div class="po-stronghold-row" style="align-items:flex-start;">
            <div class="po-stronghold-party" style="min-width:0;flex:1;">
                <div style="display:flex;align-items:center;gap:8px;">
                    ${weightBadge}
                    <span class="po-stronghold-party-name">${esc(s.name)}</span>
                </div>
                ${descHtml}
            </div>
            ${othersHtml}
            <div style="margin-left:14px;padding-left:14px;border-left:1px dashed var(--border-main, rgba(255,255,255,0.1));display:flex;align-items:center;">
                ${myChip}
            </div>
        </div>`;
    }).join('');

    return `<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">SECTOR RANKING</span>
            <span class="po-card-subtitle">all sectors · top 3 other parties · you on the right</span>
        </div>
        <div style="padding:8px 12px;">
            ${rowsHtml || '<div style="padding:8px 0;font-size:9px;color:var(--text-dim);font-family:var(--font-mono);">No active sectors in this nation.</div>'}
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

// Static explainer for the three concepts that drive party performance.
// Replaces the per-faction MOMENTUM card now that vote share is computed
// from sector popularity (run_election; 20260517_run_election_sector_popularity).
function renderMechanicsCard() {
    return `<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">SECTORS AND POPULARITY</span>
        </div>
        <div style="padding:10px 12px;display:flex;flex-direction:column;gap:10px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);letter-spacing:0.05em;">SECTORS</div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);line-height:1.5;margin-top:3px;">
                    Slices of the electorate (Construction, Finance, Manufacturing, etc.). Each carries a <span style="color:var(--text-bright);font-weight:700;">weight</span> — w1 minor, w2 average, w3 major — that scales how much its voters matter on election day.
                </div>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);letter-spacing:0.05em;">POPULARITY</div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);line-height:1.5;margin-top:3px;">
                    A party's standing inside a sector (0–10). Bills shift it: passing bills credit the sponsor and YES voters with the policy's effects, debit NO voters with the inverse. Failed bills hit the sponsor with the inverse alone.
                </div>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);letter-spacing:0.05em;">TURNOUT</div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);line-height:1.5;margin-top:3px;">
                    Per-sector engagement multiplier (0.50–1.30). High-turnout sectors translate the same popularity into more votes; low-turnout sectors disproportionately reward the parties already entrenched there.
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.5;border-top:1px solid var(--border-hair);padding-top:6px;">
                Vote share = Σ (popularity × weight × turnout) per party, normalized across the nation.
            </div>
        </div>
    </div>`;
}

// Aggregate every article's sector_effects into a single
// sector_key → change_tenths map. sector_effects live on the chosen
// policy_option. Mirrors sumSectorEffects in advance-tick.
function aggregateBillEffects(bill) {
    const sums = new Map();
    for (const art of (bill.bill_articles || [])) {
        const effects = art?.selected_option?.sector_effects || [];
        for (const e of effects) {
            if (!e || typeof e.sector_key !== 'string') continue;
            const change = Number(e.change_tenths);
            if (!Number.isFinite(change) || change === 0) continue;
            sums.set(e.sector_key, (sums.get(e.sector_key) || 0) + change);
        }
    }
    return Array.from(sums, ([sector_key, change_tenths]) => ({ sector_key, change_tenths }));
}

function billPartyChip(faction, isSponsor) {
    if (!faction) return '';
    const color = faction.party_color || faction.color || '#888';
    const label = faction.abbreviation || (faction.faction_name || '?').slice(0, 3).toUpperCase();
    const sponsorMark = isSponsor
        ? `<span style="font-family:var(--font-mono);font-size:6px;color:${color};margin-left:3px;letter-spacing:0.05em;">SPONSOR</span>`
        : '';
    return `<span style="display:inline-flex;align-items:center;gap:2px;padding:1px 5px;border:1px solid ${color}55;background:${color}14;font-family:var(--font-mono);font-size:8px;font-weight:700;color:${color};">${esc(label)}${sponsorMark}</span>`;
}

// Render an inline list of sector deltas. `invert` flips every sign — used
// for the NO bucket since NO voters get the inverse of the policy's effects.
function billDeltasInline(effects, sectorNameByKey, invert) {
    if (!effects.length) return `<span style="color:var(--text-dim);">no sector effects</span>`;
    return effects.map(e => {
        const tenths = invert ? -e.change_tenths : e.change_tenths;
        const value = tenths / 10;
        const sign = value > 0 ? '+' : (value < 0 ? '−' : '');
        const mag = Math.abs(value).toFixed(1);
        const color = value > 0 ? 'var(--green)' : value < 0 ? 'var(--red)' : 'var(--text-dim)';
        const name = sectorNameByKey.get(e.sector_key) || e.sector_key;
        return `<span style="white-space:nowrap;"><span style="color:${color};font-weight:700;">${sign}${mag}</span> <span style="color:var(--text-secondary);">${esc(name)}</span></span>`;
    }).join(`<span style="color:var(--text-dim);margin:0 4px;">·</span>`);
}

// Passed-bills feed. Per bill, shows: title + sponsor + ticks-ago, the
// sponsor + YES bucket with the literal sector deltas, and the NO bucket
// with the inverse. Resolution rules taken from
// supabase/functions/advance-tick/index.ts:4911 (computeSectorShifts):
//   passed → sponsor + YES voters get +change_tenths; NO voters get
//   −change_tenths. Sponsor is force-cast YES even without a bill_support
//   row, which is why we merge it in below.
function renderPassedBillsFeed(o) {
    const bills = o.passedBills || [];
    const currentTick = _state.shard?.current_tick || 0;

    // Skip the political-process bill types that carry no sector effects —
    // matches the legislative filter inside processSectorShifts.
    const legislative = bills.filter(b =>
        !['no_confidence', 'confirmation', 'minister_confirmation', 'foundational', 'veto_override']
            .includes(b.bill_type)
    );

    if (legislative.length === 0) {
        return `<div class="po-card" style="flex:1;">
            <div class="po-card-header">
                <span class="po-card-title">RECENT BILLS</span>
                <span class="po-card-subtitle">passed bills · sector outcomes</span>
            </div>
            <div style="padding:24px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No passed bills yet.</div>
        </div>`;
    }

    const factionById = new Map((o.allParties || []).map(p => [p.id, p]));
    const sectorNameByKey = new Map((o.sectors || []).map(s => [s.sector_key, s.name]));

    const rowsHtml = legislative.map(b => {
        const effects = aggregateBillEffects(b);
        const ticksAgo = currentTick - (b.passed_tick || 0);
        const agoLabel = ticksAgo === 0 ? 'just now' : ticksAgo + 't ago';

        const stanceById = new Map();
        for (const s of (b.bill_support || [])) {
            const stance = s.stance === 'accept' ? 'yes'
                         : s.stance === 'reject' ? 'no'
                         : s.stance;
            if (stance === 'yes' || stance === 'no') stanceById.set(s.faction_id, stance);
        }
        if (b.proposed_by) stanceById.set(b.proposed_by, 'yes');

        const yesChips = [];
        const noChips = [];
        for (const [factionId, stance] of stanceById) {
            const faction = factionById.get(factionId);
            if (!faction) continue;
            const chip = billPartyChip(faction, factionId === b.proposed_by);
            if (stance === 'yes') yesChips.push(chip);
            else if (stance === 'no') noChips.push(chip);
        }

        const sponsor = factionById.get(b.proposed_by);
        const sponsorLabel = sponsor
            ? `<span style="color:${sponsor.party_color || sponsor.color || '#888'};font-weight:700;">${esc(sponsor.abbreviation || sponsor.faction_name || '?')}</span>`
            : '<span style="color:var(--text-dim);">unknown</span>';

        const yesLine = yesChips.length
            ? `<div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--green);letter-spacing:0.05em;width:36px;flex-shrink:0;">GAINED</span>
                    ${yesChips.join('')}
               </div>
               <div style="margin-left:40px;font-family:var(--font-mono);font-size:8px;line-height:1.6;margin-top:2px;">
                    ${billDeltasInline(effects, sectorNameByKey, false)}
               </div>`
            : '';

        const noLine = noChips.length
            ? `<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:7px;color:var(--red);letter-spacing:0.05em;width:36px;flex-shrink:0;">LOST</span>
                    ${noChips.join('')}
               </div>
               <div style="margin-left:40px;font-family:var(--font-mono);font-size:8px;line-height:1.6;margin-top:2px;">
                    ${billDeltasInline(effects, sectorNameByKey, true)}
               </div>`
            : '';

        return `<div style="padding:8px 12px;border-bottom:1px solid rgba(200,196,184,0.05);">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;">
                <span style="font-size:10px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(b.bill_name || 'Untitled bill')}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);flex-shrink:0;">${agoLabel}</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);margin-top:1px;">sponsored by ${sponsorLabel}</div>
            ${yesLine}
            ${noLine}
        </div>`;
    }).join('');

    return `<div class="po-card" style="flex:1;">
        <div class="po-card-header">
            <span class="po-card-title">RECENT BILLS</span>
            <span class="po-card-subtitle">passed bills · sector outcomes</span>
        </div>
        <div style="max-height:520px;overflow-y:auto;">${rowsHtml}</div>
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
    const nation = _state.nation;
    const pmPartyId = admin?.pm_party_id;
    const totalSeats = nation?.total_seats || 100;

    const rivalHtml = rivals.map(party => {
        const pColor = party.party_color || '#666';
        const abbr = party.abbreviation || party.faction_name?.slice(0, 3)?.toUpperCase() || '?';
        const leaderName = (party.leader_first_name && party.leader_last_name)
            ? `${party.leader_first_name} ${party.leader_last_name}` : 'Unknown';
        const seats = party.seats || 0;

        // Governing status — single source of truth in getGoverningStatusFor.
        // Parliamentary lead party (PM) keeps a "— LEAD" tag for visual hierarchy;
        // other governing partners just show the bare label.
        const gov = getGoverningStatusFor(party, admin, o.ministryPartyIds, nation);
        let statusLabel = gov.label;
        const statusColor = gov.isGoverning ? 'var(--green)' : 'var(--orange)';
        if (gov.isGoverning && gov.label === 'GOVERNING') {
            if (party.id === pmPartyId) statusLabel = 'GOVERNING \u2014 LEAD';
            else statusLabel = 'GOVERNING \u2014 JUNIOR';
        }

        // Seat diff vs you
        const seatDiff = seats - (myFaction?.seats || 0);
        const diffColor = seatDiff > 0 ? 'var(--green)' : seatDiff < 0 ? 'var(--red)' : 'var(--text-dim)';

        // Phase 4: mini-strongholds (top 3 sector names) replaces ideology axis bars.
        const strongholds = o.strongholdsByParty?.[party.id] || [];
        const miniStrongholdsHtml = strongholds.length > 0
            ? `<div style="display:flex;flex-wrap:wrap;gap:4px;">${
                strongholds.map(s => `<span style="font-family:var(--font-mono);font-size:9px;padding:2px 6px;border:1px solid ${pColor}44;background:${pColor}10;color:var(--text-bright);white-space:nowrap;">${esc(s.name)}</span>`).join('')
            }</div>`
            : `<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Unaligned</div>`;

        return `<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${pColor}15;border:1px solid ${pColor}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${pColor};">${esc(abbr)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${esc(party.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${esc(leaderName)}</div>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${statusColor};background:${statusColor}0a;border:1px solid ${statusColor}44;white-space:nowrap;">${statusLabel}</span>
                    ${blocTagHtml(party.bloc_id, o.blocMap)}
                </div>
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
            ${miniStrongholdsHtml}
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

function renderDecayNote() {
    return `<div style="background:var(--bg-card);border:1px solid var(--border-main);padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.6;">
            <span style="color:var(--text-bright);font-weight:700;">Momentum resets to 0</span> after every election. Rebuild each cycle.
        </div>
    </div>`;
}
