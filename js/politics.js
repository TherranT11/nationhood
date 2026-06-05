import { _supabase } from './supabase-client.js';
import { initPage, refreshAP, loadBlocMap, blocTagHtml } from './common.js';
import { getPartyIconSVG, getPartyLogoHTML, PARTY_ICONS, PARTY_COLOR_PALETTE } from './party-icons.js';
import { tickToDate, formatCurrencyShort } from './utils.js';

import { fetchActiveCoalition, loadSeats } from './game/government-structure.js';
import { INACTIVITY_DRAIN_THRESHOLD } from './game/electorate.js';
import { hasElectedPresident } from './game/government-types.js';
import { initGameConfigForNation, switchPartyEndorsement } from './game/config.js';
import { ATTACK_CONFIG, ATTACK_OUTCOMES, getAttackOutcomeWeights, gatherAttackEvidence, buildAttackVectors, executeAttack, disbandParty, getNationNames } from './game/political-actions.js';
import { PROTEST_CONFIG, getProtestCost, getDecayedUseCount, getProtestFatigueLevel, getStatHintColor, canCallProtest, getStatFailureScore, isExcludedStat, isHigherIsBad, getTierLabel, executeProtest, endorseProtest, callOffProtest, executePublicAddress } from './game/protest.js';
import { ISSUE_DEFS, ISSUE_IDS } from './game/electorate.js';
import { getStrongholdSectors } from './game/sectors.js';
import { isGovernmentPresidential, getGovDisplayLabel } from './game/government-types.js';
import { computeEndorsementButtonState } from './ui/endorsement-ui.js';
import { getElectabilityTier } from './game/party-leadership.js';

// ── Shared helpers ──

function toMap(arr, key = 'id') {
    const m = {};
    for (const item of (arr || [])) m[item[key]] = item;
    return m;
}

// Lightweight toast notification (replaces alert() calls)
function _showToast(msg, isError = true) {
    const existing = document.getElementById('pol-toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = 'pol-toast';
    el.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:13px;font-family:var(--dfont-mono);max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:opacity 0.3s;${isError ? 'background:#2d1517;color:#f87171;border:1px solid #7f1d1d;' : 'background:#1a2e1a;color:#86efac;border:1px solid #14532d;'}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 4000);
}

initPage('politics', async (state) => {
    const { nation, faction, shard } = state;

    if (!nation || !faction) {
        document.getElementById('content-area').innerHTML =
            '<div class="pol-loading">No nation or party data available.</div>';
        return;
    }

    // Initialize game config for this nation
    await initGameConfigForNation(_supabase, nation.id);

    // Fetch full faction data (state.faction has SELECT * so should be complete)
    const f = faction;
    const currentTick = shard?.current_tick || 0;

    // Fetch total seats from all parties
    const { data: allParties } = await _supabase
        .from('factions')
        .select('id, seats, national_vote_share, faction_name, abbreviation, party_color, loyalty, last_seen_tick, leader_first_name, leader_last_name, leader_age, founded_tick, custom_logo_url, party_logo, party_description, momentum, momentum_log, bloc_id')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    // Normalise seat counts from election results (single source of truth)
    const { currentSeats } = await loadSeats(_supabase, nation.id, allParties || [], f.id);

    const totalSeats = (allParties || []).reduce((sum, p) => sum + (p.seats || 0), 0);
    const mySeats = currentSeats;

    // Get last completed election for vote share date + delta
    const { data: lastElection } = await _supabase
        .from('elections')
        .select('election_tick, results')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .order('election_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Compute vote share from election results (not the between-election poll)
    let voteSharePct = Number(f.national_vote_share || 0).toFixed(1); // fallback
    let lastElectionDate = null;
    let seatDelta = null;
    if (lastElection) {
        lastElectionDate = tickToDate(lastElection.election_tick);

        // Extract vote_percentage from election results
        const results = lastElection.results;
        const votesArr = results?.votes || (Array.isArray(results) ? results : []);
        const myResult = votesArr.find(r => r.party_id === f.id);
        if (myResult && typeof myResult.vote_percentage === 'number') {
            voteSharePct = myResult.vote_percentage.toFixed(1);
        }

        // Try to compute seat delta from election results
        if (Array.isArray(results)) {
            const mySeatResult = results.find(r => r.party_id === f.id);
            if (mySeatResult && typeof mySeatResult.seats_won === 'number') {
                const prevSeats = typeof mySeatResult.seats_before === 'number' ? mySeatResult.seats_before : null;
                if (prevSeats !== null) {
                    seatDelta = mySeats - prevSeats;
                }
            }
        }
    }

    // Fetch coalition to determine governing/opposition
    const coalition = await fetchActiveCoalition(_supabase, nation.id);
    let role = 'Opposition';
    if (coalition && coalition.party_ids && coalition.party_ids.includes(f.id)) {
        role = coalition.lead_party_id === f.id ? 'Lead — Governing' : 'Governing Coalition';
    }
    // Absolute monarchy: monarch faction with majority is the government
    const _isAbsMonarchy = (nation?.government_type || '').toLowerCase().includes('absolute');
    if (_isAbsMonarchy && nation?.monarch_faction_id === f.id) {
        const _totalSeats = nation?.total_seats || 100;
        const _majorityThreshold = Math.floor(_totalSeats / 2) + 1;
        if ((f.seats || 0) >= _majorityThreshold) role = 'Lead — Governing';
    }

    // Crisis sunset (Phase 3): the active_crises read for the party-tab
    // National Mood box is gone (the crisis-list section was removed).

    const issueStateMapInit = {};

    // Fetch next scheduled election (future only, matching dashboard query)
    let { data: nextElection } = await _supabase
        .from('elections')
        .select('election_tick, election_type')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .gt('election_tick', currentTick)
        .order('election_tick', { ascending: true })
        .limit(1)
        .maybeSingle();

    // Fallback: if no scheduled election in DB, project from term length
    // (mirrors dashboard projection logic so both pages stay consistent)
    if (!nextElection) {
        const termTicks = Number(nation.parliamentary_term_ticks) || 24;
        nextElection = { election_tick: currentTick + termTicks, election_type: 'parliamentary' };
    }

    // Use DB columns for whip if available, otherwise generate deterministically
    const generatedNames = generateOfficerNames(f.id, nation.name);
    const officerNames = {
        whipFirst: f.whip_first_name || generatedNames.whipFirst,
        whipLast: f.whip_last_name || generatedNames.whipLast,
    };

    // Fetch previous tick's gov_approval for delta display
    const { data: prevSnap } = await _supabase
        .from('nations_history')
        .select('gov_approval')
        .eq('nation_id', nation.id)
        .eq('tick', currentTick - 1)
        .maybeSingle();
    const prevApproval = prevSnap?.gov_approval ?? null;

    // Fetch active president (presidential systems)
    const { data: president } = await _supabase
        .from('presidents')
        .select('id, faction_id, first_name, last_name, age, trait, trait_upside, trait_downside, elected_tick, term_ends_tick, is_active, terms_served')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Fetch current administration. Identity fields (president_name,
    // president_party_id, president_party_name) used to be projected here
    // but the politics page only reads admin_name / stats_at_start /
    // started_at_tick downstream — so we drop the dead-fetched identity
    // columns. If a future feature needs the live president, query
    // presidents.is_active=true directly rather than re-introducing the
    // drift-prone admin columns.
    const { data: administration } = await _supabase
        .from('administrations')
        .select('id, admin_name, government_type, started_at_tick, stats_at_start')
        .eq('nation_id', nation.id)
        .is('ended_at_tick', null)
        .order('started_at_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Fetch last completed parliamentary election
    const { data: lastParliamentary } = await _supabase
        .from('elections')
        .select('election_tick, results, election_type')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .eq('election_type', 'parliamentary')
        .order('election_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Fetch last completed presidential election
    const { data: lastPresidential } = await _supabase
        .from('elections')
        .select('election_tick, results, election_type')
        .eq('nation_id', nation.id)
        .eq('status', 'completed')
        .eq('election_type', 'presidential')
        .order('election_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Fetch all scheduled elections (for upcoming panel — future only)
    const { data: scheduledElections } = await _supabase
        .from('elections')
        .select('election_tick, election_type')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .gt('election_tick', currentTick)
        .order('election_tick', { ascending: true });

    // Load current endorsement from party_endorsement_preferences
    const { data: currentEndorsement } = await _supabase
        .from('party_endorsement_preferences')
        .select('endorsed_party_id')
        .eq('endorsing_party_id', f.id)
        .maybeSingle();

    // Load sectors + player popularity for the Strongholds card
    const [sectorsRes, popularityRes] = await Promise.all([
        _supabase.from('sectors')
            .select('id, sector_key, name, weight, base_turnout, is_active')
            .eq('nation_id', nation.id)
            .eq('is_active', true),
        _supabase.from('faction_sector_popularity')
            .select('faction_id, sector_id, popularity')
            .eq('faction_id', f.id),
    ]);
    const strongholds = getStrongholdSectors(f.id, sectorsRes.data || [], popularityRes.data || []);

    renderPartyTab(f, nation, {
        shard,
        totalSeats,
        mySeats,
        voteSharePct,
        lastElectionDate,
        seatDelta,
        role,
        coalition,
        currentTick,
        officerNames,
        allParties,
        nextElection,
        prevApproval,
        lastParliamentary,
        lastPresidential,
        scheduledElections,
        president,
        administration,
        currentEndorsement,
        issueStateMapInit,
        strongholds,
    });
});

/**
 * Generate a deterministic electability score (20-70) from a faction UUID.
 * Subtracts 10 from the base to reflect initial political uncertainty.
 */
function seedElectability(factionId) {
    const hex = factionId.replace(/-/g, '');
    const seed = parseInt(hex.substring(16, 24), 16);
    const base = 20 + (seed % 51); // 20-70
    return Math.max(0, base - 10); // subtract 10, clamp to 0
}

/**
 * Generate deterministic Party Whip name from faction UUID.
 * Uses the UUID bytes to seed a simple selection from name pools.
 */
function generateOfficerNames(factionId, nationName = '') {
    const { firstNames, lastNames } = getNationNames(nationName);
    const hex = factionId.replace(/-/g, '');
    const seedC = parseInt(hex.substring(8, 12), 16);
    const seedD = parseInt(hex.substring(12, 16), 16);

    return {
        whipFirst: firstNames[seedC % firstNames.length],
        whipLast: lastNames[seedD % lastNames.length]
    };
}

async function renderPartyTab(f, nation, data) {
    const {
        shard, totalSeats, mySeats, voteSharePct, lastElectionDate,
        seatDelta, role, officerNames, allParties, coalition, currentTick,
        nextElection, prevApproval,
        lastParliamentary, lastPresidential, scheduledElections,
        president, administration,
        currentEndorsement,
        issueStateMapInit,
        strongholds,
    } = data;
    const faction = f; // alias for compatibility with sub-renderers

    const partyColor = f.party_color || '#ffcc00';
    const logoSvg = getPartyLogoHTML({ customLogoUrl: f.custom_logo_url, iconKey: f.party_logo, size: 36, color: partyColor });
    const founded = tickToDate(f.founded_tick);

    // Role badge
    const isGov = role.includes('Governing') || role.includes('Lead');
    const roleLabel = role.includes('Lead') ? 'Governing' : role;
    const roleCls = role === 'Strongman' ? 'pol-role-strongman' : isGov ? 'pol-role-gov' : 'pol-role-opp';

    // Leader
    let leaderName, leaderAge;
    leaderName = f.leader_first_name && f.leader_last_name
        ? f.leader_first_name + ' ' + f.leader_last_name
        : 'Vacant';
    leaderAge = f.leader_age ? `(${f.leader_age})` : '';

    // Electability — stored on faction, fallback to deterministic seed
    const electScore = f.electability ?? seedElectability(f.id);
    const electTier = getElectabilityTier(electScore);

    // Seat delta display
    let deltaHtml = '';
    if (seatDelta !== null && seatDelta !== 0) {
        const sign = seatDelta > 0 ? '+' : '';
        const cls = seatDelta > 0 ? 'up' : 'down';
        deltaHtml = `<span class="pol-stat-delta ${cls}">${sign}${seatDelta}</span>`;
    }

    // ── Build politics tab content ──
    const politicsTabContent = `
    <div class="pol-page">
        <div class="pol-section-label">Politics</div>

        <div class="pol-columns">
        ${renderGovCard(nation, coalition, allParties, currentTick, prevApproval, president, administration)}
        <div class="pol-party-card">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--green"></div>
            <span class="pol-box-label">Your Party</span>
        </div>
        <div class="pol-box-body">
        <div class="pol-header">
            <div class="pol-logo">${logoSvg}</div>
            <div class="pol-header-info">
                <div class="pol-party-name">${escapeHtml(f.faction_name)} <span style="color:var(--dtext-3);font-size:11px;font-weight:400;font-style:italic;margin-left:4px;">${getGovDisplayLabel(nation)}</span></div>
                <div class="pol-meta-row">
                    <span class="pol-role-badge ${roleCls}">${escapeHtml(roleLabel.toUpperCase())}</span>
                    <span class="pol-established">Est. ${founded}</span>
                    ${f.archetype ? `<span class="pol-archetype-badge" style="font-family:var(--dfont-mono);font-size:9px;font-weight:700;padding:2px 6px;color:#b794f6;background:rgba(183,148,246,0.08);border:1px solid rgba(183,148,246,0.30);text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(f.archetype)}</span>` : ''}
                    <span class="pol-leader-badge">Leader: ${escapeHtml(leaderName)} ${leaderAge}</span>
                </div>
            </div>
        </div>
        <hr class="pol-divider">
        <div class="pol-leader-section">
            <div class="pol-leader-header">
                <span class="pol-sub-label">Leader</span>
                <button class="pol-leadership-btn" onclick="window.location.href='party-leadership.html'">Party Leadership &rarr;</button>
            </div>
            <div class="pol-leader-name">${escapeHtml(leaderName)} <span class="pol-leader-age">${leaderAge}</span> <span class="pol-leader-electability"><span class="pol-leader-electability-label">Electability: </span><span style="color:${electTier.color}">${electTier.label}</span></span></div>
        </div>
        <div class="pol-officers-row">
            <div class="pol-officer">
                <div class="pol-officer-label">Party Whip</div>
                <div class="pol-officer-name">${escapeHtml(officerNames.whipFirst + ' ' + officerNames.whipLast)}</div>
            </div>
        </div>
        <hr class="pol-divider">
        <div class="pol-stats-row">
            <div class="pol-stat-block">
                <div class="pol-stat-label">Seats</div>
                <div class="pol-stat-value">${mySeats}<span class="pol-stat-total">/${totalSeats}</span>${deltaHtml}</div>
            </div>
        </div>
        </div>
        </div>
        ${renderParliamentBox(allParties, coalition, nation, f.id)}
        ${renderForecastBox(allParties, totalSeats, currentTick, nextElection, null, f.id)}
        </div>

        <div class="pol-row-2">
        ${renderNationalMoodBox(nation, currentTick, issueStateMapInit)}
        ${renderStrongholdsBox(strongholds)}
        ${renderEditIdentityBox(f, currentTick)}
        </div>

        <div class="pol-row-3">
        ${renderElectionResultsBox(lastParliamentary, lastPresidential, allParties, { scheduledElections, currentTick, nation, mySeats, faction, currentEndorsement })}

        </div>
        <div class="pol-row-4" style="margin-top:24px;text-align:center">
            <button class="pol-disband-btn" id="pol-disband-party-btn" style="background:transparent;color:#d9534f;border:1px solid #d9534f;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:0.75rem;opacity:0.6;transition:opacity 0.2s" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">Disband Party</button>
            <div style="font-size:0.65rem;color:var(--dtext-3);margin-top:4px">Permanently disband your party and leave the game.</div>
        </div>
    </div>`;

    const otherPartiesTabBtn = '<button class="pol-page-tab" data-page-tab="other-parties">Other Parties</button>';
    const otherPartiesContent = `
    <div class="pol-page-content" data-page-content="other-parties">
        <div id="other-parties-container" class="op-page" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading rival parties...</div>
        </div>
    </div>`;

    const electionsTabBtn = '<button class="pol-page-tab" data-page-tab="elections">Your Party</button>';
    const electionsContent = `
    <div class="pol-page-content" data-page-content="elections">
        <div id="elections-container" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading election data...</div>
        </div>
    </div>`;

    const html = `
    <div class="pol-page-tabs">
        <button class="pol-page-tab active" data-page-tab="politics">Politics</button>
        <button class="pol-page-tab" data-page-tab="actions">Actions</button>
        ${electionsTabBtn}
        ${otherPartiesTabBtn}
    </div>
    <div class="pol-page-content active" data-page-content="politics">
    ${politicsTabContent}
    </div>
    <div class="pol-page-content" data-page-content="actions">
        <div class="pol-page">
            <div id="actions-container"></div>
        </div>
    </div>
    ${electionsContent}
    ${otherPartiesContent}`;

    document.getElementById('content-area').innerHTML = html;

    // Wire up page-level sub-tabs (Politics / Actions / Electorate / Other Parties / Elections)
    let actionsLoaded = false;
    let otherPartiesLoaded = false;
    let electionsLoaded = false;
    document.querySelectorAll('.pol-page-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.pol-page-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.pol-page-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-page-tab');
            const content = document.querySelector(`.pol-page-content[data-page-content="${target}"]`);
            if (content) content.classList.add('active');
            // Lazy-load Actions tab on first click
            if (target === 'actions' && !actionsLoaded) {
                actionsLoaded = true;
                renderDemocracyActions(nation, f, shard, allParties);
            }
            // Lazy-load Other Parties tab on first click
            if (target === 'other-parties' && !otherPartiesLoaded) {
                otherPartiesLoaded = true;
                renderOtherPartiesTab(f, nation, allParties, coalition, totalSeats);
            }
            // Lazy-load Elections tab on first click
            if (target === 'elections' && !electionsLoaded) {
                electionsLoaded = true;
                renderElectionsTab(f, currentTick, nextElection);
            }
        });
    });

    // Lock all panels to fixed 450px height (desktop only)
    if (window.innerWidth > 860) {
        document.querySelectorAll('.pol-admin-box, .pol-party-card, .pol-parliament-box, .pol-forecast-box, .pol-coalition-box, .pol-mood-box, .pol-ideology-box, .pol-identity-box, .pol-election-box, .pol-blocs-box').forEach(el => {
            el.style.height = '450px';
        });
    }
    initEditIdentityBox(f);
    initElectionResultsBox();
    initBlocAlignment();
    // Load party events into the GovCard
    _loadGovCardPartyEvents(nation.id, f.id);

    // Disband Party handler
    const disbandBtn = document.getElementById('pol-disband-party-btn');
    if (disbandBtn) {
        disbandBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to disband your party? This is permanent — your party will be removed from the game after the next tick.')) return;
            if (!confirm('This cannot be undone. Disband your party?')) return;
            disbandBtn.disabled = true;
            disbandBtn.textContent = 'Disbanding...';
            try {
                await disbandParty(_supabase, nation.id, f.id, currentTick);
                sessionStorage.removeItem('nationhood_state');
                await _supabase.auth.signOut();
                window.location.href = 'login.html';
            } catch (err) {
                _showToast(err.message || 'Failed to disband party.');
                disbandBtn.disabled = false;
                disbandBtn.textContent = 'Disband Party';
            }
        });
    }

}

// ═══════════════════════════════════════════════════════════
// ACTIVITY FEED — Persistent sidebar reading from activity_log
// ═══════════════════════════════════════════════════════════

const _MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function _feedTickLabel(tick) {
    return `${_MONTHS[tick % 12]} ${2000 + Math.floor(tick / 12)}`;
}



async function _loadEventFeed(elementId, nationId, playerFactionId, { limit = 80, detailed = true } = {}) {
    const feedEl = document.getElementById(elementId);
    if (!feedEl) return;

    const { data: entries, error } = await _supabase
        .from('activity_log')
        .select('id, faction_id, action_type, action_label, description, outcome, tick, created_at')
        .eq('nation_id', nationId)
        .order('tick', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error || !entries || entries.length === 0) {
        feedEl.innerHTML = '<div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px;padding:8px">No party events yet.</div>';
        return;
    }

    const factionIds = [...new Set(entries.map(e => e.faction_id))];
    const { data: factions } = await _supabase
        .from('factions')
        .select('id, faction_name, abbreviation, party_color')
        .in('id', factionIds);
    const factionMap = toMap(factions);

    let html = '';
    let lastTick = null;

    for (const entry of entries) {
        if (entry.tick !== lastTick) {
            lastTick = entry.tick;
            html += `<div class="pe-tick-sep">${_feedTickLabel(entry.tick)}</div>`;
        }

        const faction = factionMap[entry.faction_id];
        const isPlayer = entry.faction_id === playerFactionId;
        const fLabel = isPlayer ? 'You' : (faction?.abbreviation || '???');
        const fColor = faction?.party_color || 'var(--dtext-2)';
        const outcomeColor = entry.outcome === 'success' ? 'var(--dgreen)'
            : entry.outcome === 'backfire' ? 'var(--dred)'
            : entry.outcome === 'failure' ? 'var(--damber)' : 'var(--dtext-3)';

        html += `<div class="pe-item${isPlayer ? ' pe-item--you' : ''}">
            <div class="pe-item-row">
                <span class="pe-item-party" style="color:${fColor}">${escapeHtml(fLabel)}</span>
                <span class="pe-item-label">${escapeHtml((entry.action_label || entry.action_type).replace(/_/g, ' '))}</span>
                ${entry.outcome ? `<span class="pe-item-outcome" style="color:${outcomeColor}">${escapeHtml(entry.outcome)}</span>` : ''}
            </div>
            ${detailed && entry.description ? `<div class="pe-item-desc">${escapeHtml(entry.description)}</div>` : ''}
        </div>`;
    }

    feedEl.innerHTML = html;
}

function _loadPartyEventsFeed(nationId, playerFactionId) {
    return _loadEventFeed('party-events-feed', nationId, playerFactionId, { limit: 80, detailed: true });
}

function _loadGovCardPartyEvents(nationId, playerFactionId) {
    return _loadEventFeed('gov-card-party-events', nationId, playerFactionId, { limit: 40, detailed: false });
}

function miniLogo(color, acronym, name) {
    const c = color || '#888';
    const abbr = acronym || (name ? name.substring(0, 2).toUpperCase() : '??');
    return `<div class="pol-mini-logo" style="background:${c}">${escapeHtml(abbr)}</div>`;
}

function hogTitle(govType, nation) {
    // Custom HoS title from foundational law (not applicable to Presidential systems)
    if (nation?.head_of_state_title && !isGovernmentPresidential(nation)) {
        return nation.head_of_state_title;
    }
    if (!govType) return 'Head of Gov.';
    const g = govType.toLowerCase();
    if (g === 'democracy' || g.includes('parliament')) return 'PM';
    if (g.includes('president')) return 'President';
    return 'Head of Gov.';
}

function renderParliamentBox(allParties, coalition, nation, playerFactionId) {
    const parties = allParties || [];
    const partySeatTotal = parties.reduce((sum, p) => sum + (p.seats || 0), 0);
    const independentSeats = Number(nation?.independent_seats) || 0;
    const parliamentSize = Number(nation?.total_seats) || (partySeatTotal + independentSeats);
    const totalSeats = parliamentSize;
    const majority = Math.floor(parliamentSize / 2) + 1;
    let coalitionIds, leadPartyId;
    coalitionIds = new Set(coalition?.party_ids || []);
    leadPartyId = coalition?.lead_party_id || null;

    // Split into governing and opposition
    const governing = parties.filter(p => coalitionIds.has(p.id));
    const opposition = parties.filter(p => !coalitionIds.has(p.id));
    const govSeats = governing.reduce((sum, p) => sum + (p.seats || 0), 0);
    const oppSeats = opposition.reduce((sum, p) => sum + (p.seats || 0), 0);

    // Seat composition bar — sorted by seats desc, then a white independents block
    const barParties = [...parties].sort((a, b) => (b.seats || 0) - (a.seats || 0));
    const segmentsHtml = parliamentSize > 0
        ? barParties.map(p => {
            const pct = ((p.seats || 0) / parliamentSize) * 100;
            if (pct <= 0) return '';
            const c = p.party_color || '#888';
            return `<div class="pol-seat-segment" style="width:${pct.toFixed(2)}%;background:${c}"></div>`;
        }).join('') + (independentSeats > 0
            ? `<div class="pol-seat-segment pol-seat-segment--indep" style="width:${((independentSeats / parliamentSize) * 100).toFixed(2)}%;background:#ffffff" title="Independents"></div>`
            : '')
        : '';

    // Majority line position
    const majPct = parliamentSize > 0 ? (majority / parliamentSize) * 100 : 50;
    const majorityLineHtml = `<div class="pol-majority-line" style="left:${majPct.toFixed(2)}%"></div>`;

    // Government title
    const title = hogTitle(nation?.government_type, nation);

    // Party row renderer
    function partyRow(p) {
        const logo = miniLogo(p.party_color, p.abbreviation, p.faction_name);
        const name = escapeHtml(p.faction_name || 'Unknown');
        const seats = p.seats || 0;
        const isPlayer = p.id === playerFactionId;
        const isHoG = p.id === leadPartyId;
        const pills = [
            isHoG ? `<span class="pol-hog-pill">${escapeHtml(title)}</span>` : '',
            isPlayer ? '<span class="pol-you-pill">YOU</span>' : ''
        ].filter(Boolean).join(' ');
        return `<div class="pol-parl-party-row">
            ${logo}
            <span class="pol-parl-party-name">${name}</span>
            ${pills}
            <span class="pol-parl-party-seats">${seats}</span>
        </div>`;
    }

    const govRowsHtml = governing.length > 0
        ? governing.sort((a, b) => (b.seats || 0) - (a.seats || 0)).map(partyRow).join('')
        : '';
    const oppRowsHtml = opposition.length > 0
        ? opposition.sort((a, b) => (b.seats || 0) - (a.seats || 0)).map(partyRow).join('')
        : '';

    const independentsBlockHtml = independentSeats > 0 ? `
            <div class="pol-section-header">
                <span class="pol-section-title">Independents</span>
                <span class="pol-section-seats">${independentSeats} seat${independentSeats !== 1 ? 's' : ''}</span>
            </div>
            <div class="pol-parl-party-row">
                ${miniLogo('#ffffff', 'IND', 'Independents')}
                <span class="pol-parl-party-name">Independents</span>
                <span class="pol-parl-party-seats">${independentSeats}</span>
            </div>` : '';

    // Margin
    const margin = govSeats - majority;
    const marginPositive = margin >= 0;
    const marginCls = marginPositive ? 'pol-margin-positive' : 'pol-margin-negative';
    const marginText = marginPositive
        ? `+${margin} above majority`
        : `${Math.abs(margin)} below majority`;

    return `
        <div class="pol-parliament-box">
            <div class="pol-parl-header">
                <div class="pol-box-dot pol-box-dot--amber"></div>
                <span class="pol-parl-title">Parliament</span>
                <div class="pol-box-header-right"><span class="pol-parl-seats-count">${totalSeats} seats</span></div>
            </div>
            <div class="pol-box-body">
            <div class="pol-seat-bar-wrap">
                <div class="pol-seat-bar">${segmentsHtml}</div>
                ${majorityLineHtml}
            </div>

            <div class="pol-section-header">
                <span class="pol-section-title">Governing Coalition</span>
                <span class="pol-section-seats">${govSeats} seats</span>
            </div>
            ${govRowsHtml}

            <div class="pol-section-header">
                <span class="pol-section-title">Opposition</span>
                <span class="pol-section-seats">${oppSeats} seats</span>
            </div>
            ${oppRowsHtml}
            ${independentsBlockHtml}

            <div class="pol-margin-row ${marginCls}">
                <span class="pol-margin-dot"></span>
                <span>${marginText}</span>
            </div>
            </div>
        </div>`;
}

function importanceColor(pct) {
    if (pct >= 60) return 'var(--dred)';
    if (pct >= 40) return 'var(--damber)';
    return 'var(--dgreen)';
}


function renderForecastBox(allParties, totalSeats, currentTick, nextElection, _, playerFactionId) {
    const FORECAST_START = 12;
    const MARGIN_START = 12;
    const INACTIVITY_EXCLUSION = INACTIVITY_DRAIN_THRESHOLD;
    const electionTick = nextElection?.election_tick || 0;
    const ticksLeft = electionTick > currentTick ? electionTick - currentTick : 0;
    const forecastVisible = electionTick > 0 && ticksLeft <= FORECAST_START;
    const majority = Math.ceil(totalSeats / 2);

    // Phase label
    const phase = ticksLeft <= 5 ? 'CAMPAIGN SEASON' : ticksLeft <= 10 ? 'MID CYCLE' : 'EARLY CYCLE';
    const phaseColor = ticksLeft <= 5 ? 'var(--dred)' : ticksLeft <= 10 ? 'var(--damber)' : 'var(--dgreen)';

    if (!forecastVisible) {
        const ticksUntilForecast = electionTick > 0 ? ticksLeft - FORECAST_START : 0;
        const detail = electionTick > 0
            ? `Forecast available in <span style="color:var(--dtxt-secondary);font-weight:700">${ticksUntilForecast} ticks</span><br>Polling begins ${FORECAST_START} ticks before election`
            : 'No election currently scheduled';
        const earlyElectionDate = electionTick > 0 ? tickToDate(electionTick) : null;
        return `
            <div class="pol-forecast-box">
                <div class="pol-fc-header">
                    <div class="pol-box-dot pol-box-dot--blue"></div>
                    <span class="pol-mod-title">Election Forecast</span>
                </div>
                <div class="pol-box-body">
                ${earlyElectionDate ? `<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${earlyElectionDate}</span></div>` : ''}
                <div class="pol-fc-empty">
                    <div class="pol-fc-empty-title">Insufficient polling data</div>
                    <div class="pol-fc-empty-detail">${detail}</div>
                </div>
                </div>
            </div>`;
    }

    const seatMargin = Math.max(1, MARGIN_START - (FORECAST_START - ticksLeft));

    // Build party forecast data (exclude inactive parties — they won't participate in the election)
    // A party is eligible if it has been seen within INACTIVITY_EXCLUSION ticks, or if
    // last_seen_tick is null AND it still has a non-zero vote share (prevents ghost parties).
    const eligibleParties = (allParties || []).filter(p => {
        const voteShare = Number(p.national_vote_share || 0);
        if (voteShare <= 0) return false; // zeroed by Three-Pillar — definitely inactive
        if (p.last_seen_tick != null) return (currentTick - p.last_seen_tick) < INACTIVITY_EXCLUSION;
        // Never logged in — use founded_tick as reference
        return (currentTick - (p.founded_tick || 0)) < INACTIVITY_EXCLUSION;
    });
    const parties = eligibleParties.map(p => {
        const voteShare = Number(p.national_vote_share || 0);
        const estSeats = Math.round((voteShare / 100) * totalSeats);
        return {
            ...p,
            estSeats,
        };
    }).sort((a, b) => b.estSeats - a.estSeats);

    // Confidence
    const confLabel = seatMargin >= 10 ? 'VERY LOW' : seatMargin >= 7 ? 'LOW' : seatMargin >= 5 ? 'MODERATE' : seatMargin >= 3 ? 'HIGH' : 'VERY HIGH';
    const confColor = seatMargin >= 10 ? 'var(--dred)' : seatMargin >= 7 ? 'var(--damber)' : seatMargin >= 5 ? 'var(--damber)' : seatMargin >= 3 ? '#22d3ee' : 'var(--dgreen)';
    const confPct = ((FORECAST_START - ticksLeft) / FORECAST_START) * 100;

    // Party bands
    const bandsHtml = parties.map(p => {
        const lo = Math.max(p.estSeats - seatMargin, 0);
        const hi = Math.min(p.estSeats + seatMargin, totalSeats);
        const loPct = (lo / totalSeats) * 100;
        const hiPct = (hi / totalSeats) * 100;
        const color = p.party_color || '#888';
        const abbr = p.abbreviation || (p.faction_name || '??').substring(0, 2).toUpperCase();
        const isPlayer = p.id === playerFactionId;
        const majLinePct = totalSeats > 0 ? (majority / totalSeats) * 100 : 50;

        return `<div class="pol-fc-party">
            <div class="pol-fc-party-header">
                <div class="pol-fc-party-left">
                    <div class="pol-fc-party-dot" style="background:${color}"></div>
                    <span class="pol-fc-party-abbr" style="color:${color}">${escapeHtml(abbr)}</span>
                    ${isPlayer ? '<span class="pol-ideo-legend-you">YOU</span>' : ''}
                </div>
                <div class="pol-fc-party-right">
                    <span class="pol-fc-range">${lo}–${hi}</span>
                    <span class="pol-fc-seats-label">seats</span>
                </div>
            </div>
            <div class="pol-fc-band">
                <div class="pol-fc-band-fill" style="left:${loPct.toFixed(1)}%;width:${(hiPct - loPct).toFixed(1)}%;background:${color}22;border-color:${color}33"></div>
                <div class="pol-fc-maj-line" style="left:${majLinePct.toFixed(1)}%"></div>
            </div>
        </div>`;
    }).join('');

    // Race status
    const playerParty = parties.find(p => p.id === playerFactionId);
    const topRival = parties.find(p => p.id !== playerFactionId);
    let statusHtml = '';
    if (playerParty && topRival) {
        const pLo = Math.max(playerParty.estSeats - seatMargin, 0);
        const pHi = Math.min(playerParty.estSeats + seatMargin, totalSeats);
        const rLo = Math.max(topRival.estSeats - seatMargin, 0);
        const rHi = Math.min(topRival.estSeats + seatMargin, totalSeats);
        const overlap = Math.max(0, Math.min(pHi, rHi) - Math.max(pLo, rLo));
        const totalRange = pHi - pLo;
        const overlapPct = totalRange > 0 ? Math.round((overlap / totalRange) * 100) : 0;
        const pAbbr = playerParty.abbreviation || 'YOU';
        const rAbbr = topRival.abbreviation || 'RIVAL';
        const label = overlapPct > 70 ? 'TOO CLOSE TO CALL'
            : overlapPct > 30 ? 'COMPETITIVE'
            : overlapPct > 0 ? (playerParty.estSeats > topRival.estSeats ? `LEANING ${pAbbr}` : `LEANING ${rAbbr}`)
            : (playerParty.estSeats > topRival.estSeats ? `${pAbbr} LEADS` : `${rAbbr} LEADS`);
        const statusColor = overlapPct > 70 ? 'var(--dred)' : overlapPct > 30 ? 'var(--damber)' : 'var(--dgreen)';
        const desc = overlapPct > 70 ? `${pAbbr} and ${rAbbr} seat ranges fully overlap. Outcome is uncertain.`
            : overlapPct > 30 ? 'Bands are narrowing. Late campaigns could decide the race.'
            : overlapPct > 0 ? 'Leading party is emerging, but the gap is not yet decisive.'
            : 'Ranges no longer overlap. Leader is identifiable.';
        statusHtml = `
            <div class="pol-fc-status" style="background:${statusColor}08;border-color:${statusColor}">
                <div class="pol-fc-status-header">
                    <span class="pol-fc-status-label" style="color:${statusColor}">${escapeHtml(label)}</span>
                    <span class="pol-fc-status-overlap">${overlapPct}% overlap</span>
                </div>
                <div class="pol-fc-status-desc">${desc}</div>
            </div>`;
    }

    const nextElectionDate = electionTick > 0 ? tickToDate(electionTick) : null;
    return `
        <div class="pol-forecast-box">
            <div class="pol-fc-header">
                <div class="pol-box-dot pol-box-dot--blue"></div>
                <span class="pol-mod-title">Election Forecast</span>
                <div class="pol-box-header-right"><span class="pol-fc-phase" style="color:${phaseColor};background:${phaseColor}15">${phase}</span></div>
            </div>
            <div class="pol-box-body">
            ${nextElectionDate ? `<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${nextElectionDate}</span></div>` : ''}
            <div class="pol-fc-countdown">
                <div>
                    <span class="pol-fc-ticks-big" style="color:${phaseColor}">${ticksLeft}</span>
                    <span class="pol-fc-ticks-label">ticks</span>
                </div>
                <div style="text-align:right">
                    <div style="display:flex;align-items:center;gap:4px;justify-content:flex-end">
                        <span class="pol-fc-margin-label">Margin:</span>
                        <span class="pol-fc-margin-val" style="color:${confColor}">±${seatMargin} seats</span>
                    </div>
                    <span class="pol-fc-conf-badge" style="color:${confColor};background:${confColor}15">${confLabel} CONFIDENCE</span>
                </div>
            </div>
            <div class="pol-fc-conf-bar">
                <div class="pol-fc-conf-fill" style="width:${confPct.toFixed(0)}%;background:${confColor}"></div>
            </div>
            ${bandsHtml}
            <div class="pol-fc-maj-legend">
                <div class="pol-fc-maj-dash"></div>
                <span class="pol-fc-maj-text">Majority: ${majority} seats</span>
            </div>
            ${statusHtml}
            </div>
        </div>`;
}

function renderStrongholdsBox(strongholds) {
    const list = Array.isArray(strongholds) ? strongholds : [];
    let bodyHtml;
    if (list.length === 0) {
        bodyHtml = `<div style="color:var(--dtext-3);font-size:11px;padding:10px;text-align:center;">
            No sector affinity yet.<br>Vote on bills to shift your popularity with sectors.
        </div>`;
    } else {
        // Bar fill is absolute against the 0–100 storage scale (= 0.0–10.0 display)
        // so a 2.0 stronghold reads as ~20% full, not 100% just because it's the player's top.
        bodyHtml = list.map(s => {
            const pop = Math.max(0, Math.min(100, Number(s.popularity) || 0));
            const widthPct = pop;
            const display = (pop / 10).toFixed(1);
            const color = pop >= 70 ? 'var(--dgreen)' : pop >= 40 ? 'var(--damber)' : 'var(--dtext-2)';
            return `<div class="pol-mood-issue-wrap"><div class="pol-mood-issue">
                <span class="pol-mood-issue-name">${escapeHtml(s.name || s.sector_key)}</span>
                <div class="pol-mood-issue-bar-wrap"><div class="pol-mood-issue-bar" style="width:${widthPct.toFixed(1)}%;background:${color}"></div></div>
                <span class="pol-mood-issue-pct">${display}</span>
            </div></div>`;
        }).join('');
    }
    return `
        <div class="pol-mood-box">
            <div class="pol-box-header">
                <div class="pol-box-dot pol-box-dot--orange"></div>
                <span class="pol-mod-title">Sector Strongholds</span>
            </div>
            <div class="pol-box-body">${bodyHtml}</div>
        </div>`;
}

function renderNationalMoodBox(nation, currentTick, issueStateMap) {
    // Crisis sunset (Phase 3): the "Active Crises" header block above
    // the Electorate Issues panel is gone.

    // Issues section — uses ISSUE_DEFS + salience from issue_state (same source as Take Stance modal)
    const issues = ISSUE_IDS.map(id => {
        const def = ISSUE_DEFS[id];
        const salience = Number(issueStateMap?.[id]?.salience ?? 30);
        return { id, name: def.label, salience, statKeys: def.stats };
    }).sort((a, b) => b.salience - a.salience);

    const issuesHtml = issues.map(iss => {
        const color = importanceColor(iss.salience);
        const statsHtml = iss.statKeys.map(sk => {
            const val = Math.round(Number(nation[sk] ?? 0));
            const label = sk.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return `<div class="pol-mood-stat-row">
                <span class="pol-mood-stat-name">${escapeHtml(label)}</span>
                <span class="pol-mood-stat-val">${val}</span>
            </div>`;
        }).join('');
        return `<div class="pol-mood-issue-wrap">
            <div class="pol-mood-issue" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.pol-mood-chevron').textContent=this.nextElementSibling.classList.contains('open')?'▾':'▸'">
                <span class="pol-mood-issue-name">${escapeHtml(iss.name)}</span>
                <div class="pol-mood-issue-bar-wrap">
                    <div class="pol-mood-issue-bar" style="width:${iss.salience}%;background:${color}"></div>
                </div>
                <span class="pol-mood-issue-pct">${iss.salience}%</span>
                <span class="pol-mood-chevron">▸</span>
            </div>
            <div class="pol-mood-stats">${statsHtml}</div>
        </div>`;
    }).join('');

    return `
        <div class="pol-mood-box">
            <div class="pol-mood-header">
                <div class="pol-box-dot pol-box-dot--red"></div>
                <span class="pol-mood-title">Electorate Issues</span>
            </div>
            <div class="pol-box-body">
            <div class="pol-mood-subtitle">Shows which issues matter most to the electorate.</div>
            ${issuesHtml}
            </div>
        </div>`;
}



function renderGovCard(nation, coalition, allParties, currentTick, prevApproval, president, administration) {
    const isPres = hasElectedPresident(nation);
    const parties = allParties || [];
    const approval = Math.round(Number(nation.gov_approval ?? 40));
    const ac = approval >= 50 ? 'var(--dgreen)' : approval >= 35 ? 'var(--damber)' : 'var(--dred)';
    const adminName = administration?.admin_name || 'Government';
    const govTypeLabel = getGovDisplayLabel(nation);

    // Coalition info
    const coalitionIds = new Set(coalition?.party_ids || []);
    const governing = parties.filter(p => coalitionIds.has(p.id));
    const govSeats = governing.reduce((s, p) => s + (p.seats || 0), 0);
    const totalSeats = parties.reduce((s, p) => s + (p.seats || 0), 0);
    const majority = Math.ceil(totalSeats / 2);
    const isMajority = govSeats >= majority;
    const coalitionBadge = governing.length > 1 ? 'Coalition' : governing.length === 1 ? 'Single Party' : '';

    // Helper: initials
    function initials(first, last) {
        return ((first || '?')[0] + (last || '?')[0]).toUpperCase();
    }

    // ── Leader 1 (President or PM) ──
    let leader1Html = '';
    if (isPres && president) {
        const presParty = parties.find(p => p.id === president.faction_id);
        const presColor = presParty?.party_color || '#888';
        const presAbbr = presParty?.abbreviation || (presParty?.faction_name || '??').substring(0, 3).toUpperCase();
        const termOrd = president.terms_served > 1 ? (president.terms_served === 2 ? '2nd' : president.terms_served + 'th') : '1st';
        const ini = initials(president.first_name, president.last_name);
        leader1Html = `
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${escapeHtml(ini)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${escapeHtml(president.first_name + ' ' + president.last_name)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">President &middot; Age ${president.age || '?'} &middot; ${termOrd} Term</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${presColor}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${presColor}">${escapeHtml(presAbbr)}</span>
            </div>
          </div>
        </div>`;
    } else if (!isPres && coalition) {
        const leadParty = parties.find(p => p.id === coalition.lead_party_id);
        const pmColor = leadParty?.party_color || '#888';
        const pmName = leadParty?.faction_name || 'Unknown';
        const pmAbbr = leadParty?.abbreviation || pmName.substring(0, 3).toUpperCase();
        const ini = pmName.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
        leader1Html = `
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${escapeHtml(ini)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${escapeHtml(pmName)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of Government</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${pmColor}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${pmColor}">${escapeHtml(pmAbbr)}</span>
            </div>
          </div>
        </div>`;
    }

    // ── Leader 2 (VP or Head of State) ──
    let leader2Html = '';
    const hosFirst = nation.head_of_state_first_name || '';
    const hosLast = nation.head_of_state_last_name || '';
    if (isPres && hosFirst && hosLast) {
        const ini = initials(hosFirst, hosLast);
        leader2Html = `
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${escapeHtml(ini)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${escapeHtml(hosFirst + ' ' + hosLast)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Vice President</div>
          </div>
        </div>`;
    } else if (!isPres && hosFirst && hosLast) {
        const ini = initials(hosFirst, hosLast);
        leader2Html = `
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${escapeHtml(ini)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${escapeHtml(hosFirst + ' ' + hosLast)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Head of State</div>
          </div>
        </div>`;
    }

    // ── Coalition bar ──
    const sortedGov = [...governing].sort((a, b) => (b.seats || 0) - (a.seats || 0));
    const barHtml = totalSeats > 0
        ? sortedGov.map(p => {
            const pct = ((p.seats || 0) / totalSeats) * 100;
            if (pct <= 0) return '';
            return `<div style="width:${pct.toFixed(2)}%;height:100%;background:${p.party_color || '#888'}"></div>`;
          }).join('')
        : '';

    // ── Coalition party rows ──
    const partyRowsHtml = sortedGov.map(p =>
        `<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
            <div style="width:7px;height:7px;border-radius:2px;background:${p.party_color || '#888'};flex-shrink:0"></div>
            <span style="font-family:var(--dfont-ui);font-size:12px;color:var(--dtext-0);flex:1">${escapeHtml(p.faction_name || 'Unknown')}</span>
            <span style="font-family:var(--dfont-mono);font-size:12px;font-weight:600;color:${p.party_color || 'var(--dtext-0)'}">${p.seats || 0}</span>
        </div>`
    ).join('');

    // ── Footer ──
    const govLabel = isMajority ? 'Majority Government' : 'Minority Government';
    const footerDetail = `${govSeats}/${totalSeats} seats (${majority} needed)`;

    return `<div class="pol-admin-box">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="pol-box-label">Government</span>
        </div>
        <div class="pol-box-body">
        <div style="font-family:var(--dfont-ui);font-size:16px;font-weight:700;color:var(--dtext-0);margin-bottom:8px">${escapeHtml(adminName)}</div>
        <div style="display:flex;gap:6px;margin-bottom:16px">
            <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:2px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${escapeHtml(govTypeLabel)}</span>
            ${coalitionBadge ? `<span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:2px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${escapeHtml(coalitionBadge)}</span>` : ''}
        </div>

        ${leader1Html}
        ${leader2Html}

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Approval</div>
        <div style="font-family:var(--dfont-mono);font-size:28px;font-weight:700;line-height:1;color:${ac}">${approval}%</div>
        <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:4px;display:flex;align-items:center;gap:8px">
            <span style="text-transform:uppercase;font-weight:600">${escapeHtml(govLabel)}</span>
            <span style="font-weight:400">${escapeHtml(footerDetail)}</span>
        </div>

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Party Events</div>
        <div id="gov-card-party-events" class="pe-feed" style="max-height:200px;overflow-y:auto;font-size:11px">
            <div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px">Loading events...</div>
        </div>
        </div>
    </div>`;
}

const RENAME_COOLDOWN = 360;
const MAX_DESC        = 200;
const MAX_FILE_KB     = 256;

function renderEditIdentityBox(f, currentTick) {
    const color = f.party_color || '#ffcc00';
    const icon  = f.party_logo || 'flag';
    const desc  = f.party_description || '';
    const lastRenameTick = f.last_rename_tick || 0;
    const cooldownRemaining = lastRenameTick > 0 ? Math.max(0, RENAME_COOLDOWN - (currentTick - lastRenameTick)) : 0;
    const onCooldown = cooldownRemaining > 0;

    // Preview badge
    const hasCustomLogo = !!f.custom_logo_url;
    const previewSvg = getPartyLogoHTML({ customLogoUrl: f.custom_logo_url, iconKey: icon, size: 20, color });

    // Color swatches
    const swatchesHtml = PARTY_COLOR_PALETTE.map(c => {
        const sel = c.hex.toLowerCase() === color.toLowerCase() ? ' selected' : '';
        return `<div class="pol-id-swatch${sel}" data-color="${c.hex}" title="${c.label}" style="background:${c.hex}"></div>`;
    }).join('');

    // Icon categories
    const categories = {};
    for (const [key, val] of Object.entries(PARTY_ICONS)) {
        const cat = val.category || 'Other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push({ key, label: val.label });
    }
    let iconsHtml = '';
    for (const [cat, items] of Object.entries(categories)) {
        iconsHtml += `<div class="pol-id-icon-cat">${escapeHtml(cat)}</div><div class="pol-id-icon-grid">`;
        for (const item of items) {
            const sel = item.key === icon ? ' selected' : '';
            const svg = getPartyIconSVG(item.key, 16, item.key === icon ? color : '#888');
            iconsHtml += `<div class="pol-id-icon-tile${sel}" data-icon="${item.key}" title="${escapeHtml(item.label)}" style="color:${item.key === icon ? color : '#888'}">${svg}</div>`;
        }
        iconsHtml += '</div>';
    }

    // Rename / abbreviation section (shared cooldown, no AP cost)
    let renameHtml;
    let abbrHtml;
    if (onCooldown) {
        const pct = (cooldownRemaining / RENAME_COOLDOWN * 100).toFixed(1);
        const cooldownBar = `
            <div class="pol-id-cooldown">
                <span class="pol-id-cooldown-label">Rename cooldown</span>
                <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:${pct}%"></div></div>
                <span class="pol-id-cooldown-ticks">${cooldownRemaining}t</span>
            </div>`;
        renameHtml = cooldownBar;
        abbrHtml = cooldownBar;
    } else {
        renameHtml = `
            <button class="pol-id-rename-btn" id="pol-id-rename-btn">
                <span>Rename Party</span>
                <span class="pol-id-rename-cost">${RENAME_COOLDOWN}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-rename-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-rename-input" placeholder="Enter new party name…" maxlength="60">
                    <button class="pol-id-rename-confirm" id="pol-id-rename-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-rename-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Locks rename for <span style="color:var(--damber)">${RENAME_COOLDOWN} ticks</span></span>
                </div>
                <div class="pol-id-error" id="pol-id-rename-error" style="display:none"></div>
            </div>`;
        abbrHtml = `
            <button class="pol-id-rename-btn" id="pol-id-abbr-btn">
                <span>Change Abbreviation</span>
                <span class="pol-id-rename-cost">${RENAME_COOLDOWN}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-abbr-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-abbr-input" placeholder="2–4 letters" maxlength="4" style="text-transform:uppercase;font-family:var(--dfont-mono);font-weight:700;letter-spacing:0.1em;width:80px">
                    <button class="pol-id-rename-confirm" id="pol-id-abbr-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-abbr-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Locks rename for <span style="color:var(--damber)">${RENAME_COOLDOWN} ticks</span></span>
                </div>
                <div class="pol-id-error" id="pol-id-abbr-error" style="display:none"></div>
            </div>`;
    }

    return `<div class="pol-identity-box" id="pol-identity-box"
        data-faction-id="${f.id}"
        data-selected-color="${color}"
        data-selected-icon="${icon}"
        data-current-tick="${currentTick}">

        <!-- Header -->
        <div class="pol-id-header">
            <div class="pol-box-dot pol-box-dot--amber"></div>
            <span class="pol-id-title">Party Identity</span>
            <div class="pol-box-header-right">
                <div class="pol-id-preview" id="pol-id-preview" style="border:2px solid ${color};background:${color}18">
                    ${previewSvg}
                </div>
            </div>
        </div>
        <div class="pol-box-body">

        <!-- Party Name -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span class="pol-id-section-label">Party Name</span>
            </div>
            <div class="pol-id-name-display">
                <span id="pol-id-current-name">${escapeHtml(f.faction_name)}</span>
                <span>current</span>
            </div>
            ${renameHtml}
        </div>
        <div class="pol-id-divider"></div>

        <!-- Abbreviation -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span class="pol-id-section-label">Abbreviation</span>
            </div>
            <div class="pol-id-name-display">
                <span id="pol-id-current-abbr">${escapeHtml(f.abbreviation || '???')}</span>
                <span>current</span>
            </div>
            ${abbrHtml}
        </div>
        <div class="pol-id-divider"></div>

        <!-- Description -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span class="pol-id-section-label">Description</span>
                <span class="pol-id-char-count${desc.length > MAX_DESC * 0.9 ? ' warn' : ''}" id="pol-id-char-count">${desc.length} / ${MAX_DESC}</span>
            </div>
            <textarea class="pol-id-desc" id="pol-id-desc" rows="3" maxlength="${MAX_DESC}">${escapeHtml(desc)}</textarea>
        </div>
        <div class="pol-id-divider"></div>

        <!-- Party Color -->
        <div style="margin-bottom:14px">
            <span class="pol-id-section-label">Party Color</span>
            <div class="pol-id-colors" id="pol-id-colors">${swatchesHtml}</div>
            <div class="pol-id-hex-row">
                <span class="pol-id-hex-label">Custom hex</span>
                <input class="pol-id-hex-input" id="pol-id-hex-input" value="${color}" maxlength="7">
                <div class="pol-id-hex-preview" id="pol-id-hex-preview" style="background:${color}"></div>
            </div>
        </div>
        <div class="pol-id-divider"></div>

        <!-- Party Logo -->
        <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span class="pol-id-section-label">Party Logo</span>
                <div class="pol-id-tab-bar">
                    <button class="pol-id-tab${hasCustomLogo ? '' : ' active'}" data-tab="icon">Icon</button>
                    <button class="pol-id-tab${hasCustomLogo ? ' active' : ''}" data-tab="custom">Custom Image</button>
                </div>
            </div>
            <div id="pol-id-icon-section"${hasCustomLogo ? ' style="display:none"' : ''}>${iconsHtml}</div>
            <div id="pol-id-upload-section"${hasCustomLogo ? '' : ' style="display:none"'}>
                <div class="pol-id-upload-zone${hasCustomLogo ? ' has-image' : ''}" id="pol-id-upload-zone">
                    ${hasCustomLogo ? `
                        <img class="pol-id-upload-preview" src="${f.custom_logo_url}" alt="preview" style="border:2px solid ${color}">
                        <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${MAX_FILE_KB}KB · Best at 128×128px</div>
                    ` : `
                        <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                        <div class="pol-id-upload-text">Click to upload logo</div>
                        <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${MAX_FILE_KB}KB · Best at 128×128px</div>
                    `}
                </div>
                <input type="file" accept="image/*" id="pol-id-file-input" style="display:none">
                <div class="pol-id-error" id="pol-id-upload-error" style="display:none"></div>
                <button class="pol-id-remove-btn" id="pol-id-remove-btn"${hasCustomLogo ? '' : ' style="display:none"'}>Remove Image</button>
            </div>
        </div>
        <div class="pol-id-divider"></div>

        <!-- Footer -->
        <div class="pol-id-footer">
            <div class="pol-id-footer-hint">Preview updates live ↗</div>
            <button class="pol-id-save-btn" id="pol-id-save-btn">Save Changes</button>
        </div>
        </div>
    </div>`;
}

function initEditIdentityBox(f) {
    const box = document.getElementById('pol-identity-box');
    if (!box) return;

    const preview      = document.getElementById('pol-id-preview');
    const colorsGrid   = document.getElementById('pol-id-colors');
    const hexInput     = document.getElementById('pol-id-hex-input');
    const hexPreview   = document.getElementById('pol-id-hex-preview');
    const descArea     = document.getElementById('pol-id-desc');
    const charCount    = document.getElementById('pol-id-char-count');
    const saveBtn      = document.getElementById('pol-id-save-btn');
    const renameBtn    = document.getElementById('pol-id-rename-btn');
    const renameForm   = document.getElementById('pol-id-rename-form');
    const renameInput  = document.getElementById('pol-id-rename-input');
    const renameConfirm = document.getElementById('pol-id-rename-confirm');
    const renameCancel = document.getElementById('pol-id-rename-cancel');
    const renameError  = document.getElementById('pol-id-rename-error');
    const abbrBtn      = document.getElementById('pol-id-abbr-btn');
    const abbrForm     = document.getElementById('pol-id-abbr-form');
    const abbrInput    = document.getElementById('pol-id-abbr-input');
    const abbrConfirm  = document.getElementById('pol-id-abbr-confirm');
    const abbrCancel   = document.getElementById('pol-id-abbr-cancel');
    const abbrError    = document.getElementById('pol-id-abbr-error');
    const abbrDisplay  = document.getElementById('pol-id-current-abbr');
    const nameDisplay  = document.getElementById('pol-id-current-name');
    const iconSection  = document.getElementById('pol-id-icon-section');
    const uploadSection = document.getElementById('pol-id-upload-section');
    const uploadZone   = document.getElementById('pol-id-upload-zone');
    const fileInput    = document.getElementById('pol-id-file-input');
    const uploadError  = document.getElementById('pol-id-upload-error');
    const removeBtn    = document.getElementById('pol-id-remove-btn');

    let uploadedDataUrl = null;
    let uploadedFile    = null;
    let useCustomImage  = !!(f.custom_logo_url);
    let existingCustomUrl = f.custom_logo_url || null;

    function getColor() { return box.dataset.selectedColor; }
    function getIcon()  { return box.dataset.selectedIcon; }

    function updatePreview() {
        const c = getColor();
        preview.style.border = '2px solid ' + c;
        preview.style.background = c + '18';
        if (useCustomImage && (uploadedDataUrl || existingCustomUrl)) {
            const src = uploadedDataUrl || existingCustomUrl;
            preview.innerHTML = '<img src="' + src + '" alt="" style="width:100%;height:100%;object-fit:cover">';
        } else {
            preview.innerHTML = getPartyIconSVG(getIcon(), 20, c);
        }
    }

    function updateIconHighlights() {
        const c = getColor();
        const sel = getIcon();
        box.querySelectorAll('.pol-id-icon-tile').forEach(t => {
            const key = t.dataset.icon;
            const isSelected = key === sel;
            t.classList.toggle('selected', isSelected);
            t.style.color = isSelected ? c : '#888';
            t.innerHTML = getPartyIconSVG(key, 16, isSelected ? c : '#888');
        });
    }

    function updateSwatchHighlights() {
        const c = getColor().toLowerCase();
        box.querySelectorAll('.pol-id-swatch').forEach(s => {
            s.classList.toggle('selected', s.dataset.color.toLowerCase() === c);
        });
    }

    // Color swatches
    if (colorsGrid) {
        colorsGrid.addEventListener('click', e => {
            const swatch = e.target.closest('.pol-id-swatch');
            if (!swatch) return;
            box.dataset.selectedColor = swatch.dataset.color;
            hexInput.value = swatch.dataset.color;
            hexPreview.style.background = swatch.dataset.color;
            updateSwatchHighlights();
            updateIconHighlights();
            updatePreview();
        });
    }

    // Custom hex
    if (hexInput) {
        hexInput.addEventListener('input', () => {
            const val = hexInput.value;
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                box.dataset.selectedColor = val;
                hexPreview.style.background = val;
                updateSwatchHighlights();
                updateIconHighlights();
                updatePreview();
            } else {
                hexPreview.style.background = 'var(--dtext-3)';
            }
        });
    }

    // Icon tiles
    if (iconSection) {
        iconSection.addEventListener('click', e => {
            const tile = e.target.closest('.pol-id-icon-tile');
            if (!tile) return;
            box.dataset.selectedIcon = tile.dataset.icon;
            useCustomImage = false;
            updateIconHighlights();
            updatePreview();
        });
    }

    // Tab toggle
    box.querySelectorAll('.pol-id-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            box.querySelectorAll('.pol-id-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const isIcon = tab.dataset.tab === 'icon';
            iconSection.style.display = isIcon ? '' : 'none';
            uploadSection.style.display = isIcon ? 'none' : '';
        });
    });

    // Upload zone
    if (uploadZone) {
        uploadZone.addEventListener('click', () => fileInput.click());
    }
    if (fileInput) {
        fileInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            uploadError.style.display = 'none';
            if (file.size > MAX_FILE_KB * 1024) {
                uploadError.textContent = '⚠ File too large — max ' + MAX_FILE_KB + 'KB.';
                uploadError.style.display = '';
                return;
            }
            if (!file.type.startsWith('image/')) {
                uploadError.textContent = '⚠ Must be PNG, JPG, SVG, or WebP.';
                uploadError.style.display = '';
                return;
            }
            const r = new FileReader();
            r.onload = ev => {
                uploadedDataUrl = ev.target.result;
                uploadedFile = file;
                useCustomImage = true;
                uploadZone.classList.add('has-image');
                uploadZone.innerHTML = `
                    <img class="pol-id-upload-preview" src="${uploadedDataUrl}" alt="preview" style="border:2px solid ${getColor()}">
                    <div class="pol-id-upload-text" style="color:var(--dtext-2)">Click to replace</div>
                    <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${MAX_FILE_KB}KB · Best at 128×128px</div>`;
                removeBtn.style.display = '';
                updatePreview();
            };
            r.readAsDataURL(file);
        });
    }
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            uploadedDataUrl = null;
            uploadedFile = null;
            useCustomImage = false;
            existingCustomUrl = null;
            uploadZone.classList.remove('has-image');
            uploadZone.innerHTML = `
                <div style="font-size:22px;color:var(--dtext-3)">⬆</div>
                <div class="pol-id-upload-text">Click to upload logo</div>
                <div class="pol-id-upload-hint">PNG · JPG · SVG · WebP · Max ${MAX_FILE_KB}KB · Best at 128×128px</div>`;
            removeBtn.style.display = 'none';
            updatePreview();
        });
    }

    // Description char counter
    if (descArea && charCount) {
        descArea.addEventListener('input', () => {
            const len = descArea.value.length;
            charCount.textContent = len + ' / ' + MAX_DESC;
            charCount.classList.toggle('warn', len > MAX_DESC * 0.9);
        });
    }

    // Abbreviation change flow (shared cooldown with rename)
    if (abbrBtn && abbrForm) {
        abbrBtn.addEventListener('click', () => {
            abbrBtn.style.display = 'none';
            abbrForm.style.display = '';
            abbrInput.focus();
        });
    }
    if (abbrCancel) {
        abbrCancel.addEventListener('click', () => {
            abbrForm.style.display = 'none';
            abbrBtn.style.display = '';
            abbrInput.value = '';
            abbrError.style.display = 'none';
            abbrInput.classList.remove('has-error');
        });
    }
    if (abbrInput) {
        abbrInput.addEventListener('input', () => {
            abbrInput.value = abbrInput.value.toUpperCase();
        });
    }
    if (abbrConfirm) {
        abbrConfirm.addEventListener('click', async () => {
            if (abbrConfirm.disabled) return;
            abbrError.style.display = 'none';
            abbrInput.classList.remove('has-error');
            const trimmed = abbrInput.value.trim().toUpperCase();
            if (trimmed.length < 2 || trimmed.length > 4) {
                abbrError.textContent = '⚠ Must be 2–4 letters.';
                abbrError.style.display = '';
                abbrInput.classList.add('has-error');
                return;
            }
            abbrConfirm.disabled = true;
            // Update abbreviation + last_rename_tick in DB
            const tick = parseInt(box.dataset.currentTick) || 0;
            const { error: abbrUpdateErr } = await _supabase.from('factions').update({
                abbreviation: trimmed,
                last_rename_tick: tick
            }).eq('id', f.id);
            if (abbrUpdateErr) {
                abbrError.textContent = '⚠ Failed to save — try again.';
                abbrError.style.display = '';
                abbrConfirm.disabled = false;
                return;
            }

            // Update UI
            abbrDisplay.textContent = trimmed;
            abbrForm.style.display = 'none';
            abbrInput.value = '';
            // Replace abbr button with cooldown bar
            abbrBtn.outerHTML = `
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${RENAME_COOLDOWN}t</span>
                </div>`;
            // Also lock the rename button if it exists
            if (renameBtn) {
                renameForm.style.display = 'none';
                renameBtn.outerHTML = `
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${RENAME_COOLDOWN}t</span>
                    </div>`;
            }
        });
    }

    // Rename flow
    if (renameBtn && renameForm) {
        renameBtn.addEventListener('click', () => {
            renameBtn.style.display = 'none';
            renameForm.style.display = '';
            renameInput.focus();
        });
    }
    if (renameCancel) {
        renameCancel.addEventListener('click', () => {
            renameForm.style.display = 'none';
            renameBtn.style.display = '';
            renameInput.value = '';
            renameError.style.display = 'none';
            renameInput.classList.remove('has-error');
        });
    }
    if (renameConfirm) {
        renameConfirm.addEventListener('click', async () => {
            renameError.style.display = 'none';
            renameInput.classList.remove('has-error');
            const trimmed = renameInput.value.trim();
            if (!trimmed) {
                renameError.textContent = '⚠ Name cannot be empty.';
                renameError.style.display = '';
                renameInput.classList.add('has-error');
                return;
            }
            if (trimmed.length < 3) {
                renameError.textContent = '⚠ Minimum 3 characters.';
                renameError.style.display = '';
                renameInput.classList.add('has-error');
                return;
            }
            // Update faction_name + last_rename_tick in DB
            const tick = parseInt(box.dataset.currentTick) || 0;
            const { error: renameUpdateErr } = await _supabase.from('factions').update({
                faction_name: trimmed,
                last_rename_tick: tick
            }).eq('id', f.id);
            if (renameUpdateErr) {
                renameError.textContent = '⚠ Failed to save — try again.';
                renameError.style.display = '';
                return;
            }

            // Update UI
            nameDisplay.textContent = trimmed;
            renameForm.style.display = 'none';
            renameInput.value = '';
            // Replace rename button with cooldown bar
            renameBtn.outerHTML = `
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${RENAME_COOLDOWN}t</span>
                </div>`;
            // Also lock the abbreviation button (shared cooldown)
            if (abbrBtn) {
                abbrForm.style.display = 'none';
                abbrBtn.outerHTML = `
                    <div class="pol-id-cooldown">
                        <span class="pol-id-cooldown-label">Rename cooldown</span>
                        <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                        <span class="pol-id-cooldown-ticks">${RENAME_COOLDOWN}t</span>
                    </div>`;
            }
        });
    }

    // Save button
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            let customLogoUrl = existingCustomUrl;

            // Upload new custom image to Supabase Storage if a new file was selected
            if (useCustomImage && uploadedFile) {
                const ext = uploadedFile.name.split('.').pop() || 'png';
                const filePath = `party-logos/${f.id}/${Date.now()}.${ext}`;
                const { error: uploadErr } = await _supabase.storage
                    .from('public-assets')
                    .upload(filePath, uploadedFile, { contentType: uploadedFile.type, upsert: true });
                if (uploadErr) {
                    console.error('Logo upload failed:', uploadErr.message);
                    saveBtn.textContent = '⚠ Upload failed';
                    saveBtn.disabled = false;
                    setTimeout(() => { saveBtn.textContent = 'Save Changes'; }, 2000);
                    return;
                }
                const { data: urlData } = _supabase.storage.from('public-assets').getPublicUrl(filePath);
                customLogoUrl = urlData?.publicUrl || null;
                existingCustomUrl = customLogoUrl;
                uploadedFile = null; // Clear so we don't re-upload
            }

            const updateData = {
                party_color: getColor(),
                party_logo: useCustomImage ? null : getIcon(),
                custom_logo_url: useCustomImage ? customLogoUrl : null,
                party_description: descArea ? descArea.value.slice(0, MAX_DESC) : ''
            };
            const { data: savedRows, error: saveErr } = await _supabase.from('factions').update(updateData).eq('id', f.id).select('id');
            if (saveErr) { _showToast('Save failed: ' + saveErr.message); saveBtn.disabled = false; saveBtn.textContent = 'Save Changes'; return; }
            if (!savedRows || savedRows.length === 0) { _showToast('Save failed: no rows updated (permission denied?)'); saveBtn.disabled = false; saveBtn.textContent = 'Save Changes'; return; }
            // Invalidate cached state so changes persist on page reload
            sessionStorage.removeItem('nationhood_state');
            saveBtn.textContent = '✓ Saved';
            saveBtn.classList.add('saved');
            saveBtn.disabled = false;
            setTimeout(() => {
                saveBtn.textContent = 'Save Changes';
                saveBtn.classList.remove('saved');
            }, 2000);
        });
    }
}

function renderElectionResultsBox(lastParliamentary, lastPresidential, allParties, { scheduledElections, currentTick, nation, mySeats, faction, currentEndorsement } = {}) {
    // Build a color map and seat map from allParties (single source of truth for seats)
    const colorMap = {};
    const seatMap = {};
    (allParties || []).forEach(p => {
        colorMap[p.id] = p.party_color || '#888';
        seatMap[p.id] = p.seats || 0;
    });

    function renderParliamentaryContent(el) {
        if (!el) return '<div class="pol-el-empty">No parliamentary election results yet.</div>';
        const r = el.results;
        if (!r || !r.votes) return '<div class="pol-el-empty">No parliamentary election results yet.</div>';
        const date = tickToDate(el.election_tick);
        // Use live factions.seats as the source of truth (matches Parliament panel)
        const snapshotIds = new Set(r.votes.map(v => v.party_id));
        const missingParties = (allParties || [])
            .filter(p => !snapshotIds.has(p.id) && (seatMap[p.id] || 0) > 0)
            .map(p => ({ party_id: p.id, party_name: p.faction_name, votes: 0, vote_percentage: 0, seats: seatMap[p.id] || 0 }));
        const votes = [...r.votes, ...missingParties].map(v => ({ ...v, seats: seatMap[v.party_id] ?? v.seats ?? 0 }))
            .sort((a, b) => (b.seats || 0) - (a.seats || 0));
        const maxVotePct = Math.max(...votes.map(v => v.vote_percentage || 0), 1);
        let rows = votes.map(v => {
            const color = colorMap[v.party_id] || '#888';
            const pct = (v.vote_percentage || 0).toFixed(1);
            const barW = Math.round(((v.vote_percentage || 0) / maxVotePct) * 100);
            return `<tr>
                <td><span class="pol-el-color-dot" style="background:${color}"></span>${escapeHtml(v.party_name)}</td>
                <td>${(v.votes || 0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${barW}%;background:${color}"></div></div></td>
                <td>${pct}%</td>
                <td>${v.seats || 0}</td>
            </tr>`;
        }).join('');
        return `
            <div class="pol-el-date">${date}</div>
            <div class="pol-el-summary">Turnout: ${(r.turnout_pct || 0).toFixed(1)}% &middot; ${(r.total_votes_cast || 0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Party</th><th>Votes</th><th></th><th>%</th><th>Seats</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
    }

    function renderPresidentialCandidates(cands, date, turnoutPct, totalVotesCast) {
        const sorted = [...cands].sort((a, b) => (b.votes || 0) - (a.votes || 0));
        const maxVotePct = Math.max(...sorted.map(c => c.vote_percentage || 0), 1);
        let rows = sorted.map(c => {
            const color = colorMap[c.faction_id] || '#888';
            const pct = (c.vote_percentage || 0).toFixed(1);
            const barW = Math.round(((c.vote_percentage || 0) / maxVotePct) * 100);
            const winBadge = c.winner ? ' <span class="pol-el-winner-badge">WINNER</span>' : '';
            return `<tr>
                <td><span class="pol-el-color-dot" style="background:${color}"></span>${escapeHtml(c.candidate_name)}${winBadge}</td>
                <td>${escapeHtml(c.party_name)}</td>
                <td>${(c.votes || 0).toLocaleString()}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${barW}%;background:${color}"></div></div></td>
                <td>${pct}%</td>
            </tr>`;
        }).join('');
        return `
            <div class="pol-el-date">${date}</div>
            <div class="pol-el-summary">Turnout: ${(turnoutPct || 0).toFixed(1)}% &middot; ${(totalVotesCast || 0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
    }

    function renderPresidentialContent(el) {
        if (!el) return '<div class="pol-el-empty">No presidential election results yet.</div>';
        const r = el.results;
        if (!r || !r.presidential_candidates) return '<div class="pol-el-empty">No presidential election results yet.</div>';
        const date = tickToDate(el.election_tick);
        return renderPresidentialCandidates(r.presidential_candidates, date, r.turnout_pct, r.total_votes_cast);
    }

    function renderRound1Content(el) {
        if (!el) return '<div class="pol-el-empty">No first round results.</div>';
        const r = el.results;
        const cands = r?.round_1_candidates || r?.presidential_candidates;
        if (!cands) return '<div class="pol-el-empty">No first round results.</div>';
        const date = tickToDate(el.election_tick);
        // Use round_1 specific totals if available (total_votes_cast gets overwritten with runoff totals)
        const r1Turnout = r.round_1_turnout_pct ?? r.turnout_pct;
        const r1Votes = r.round_1_total_votes_cast ?? r.total_votes_cast;
        return renderPresidentialCandidates(cands, date, r1Turnout, r1Votes);
    }

    function renderRunoffContent(el) {
        if (!el) return '<div class="pol-el-empty">No runoff results.</div>';
        const r = el.results;
        const cands = r?.runoff_candidates;
        if (!cands) return '<div class="pol-el-empty">No runoff results.</div>';
        const date = tickToDate(el.election_tick);

        // Build candidate table with transfer breakdown
        const sorted = [...cands].sort((a, b) => (b.votes || 0) - (a.votes || 0));
        const maxVotePct = Math.max(...sorted.map(c => c.vote_percentage || 0), 1);
        let rows = sorted.map(c => {
            const color = colorMap[c.faction_id] || '#888';
            const pct = (c.vote_percentage || 0).toFixed(1);
            const barW = Math.round(((c.vote_percentage || 0) / maxVotePct) * 100);
            const winBadge = c.winner ? ' <span class="pol-el-winner-badge">WINNER</span>' : '';
            // Show transfer breakdown if available
            let transferNote = '';
            if (c.base_votes != null && c.transfer_votes) {
                transferNote = `<div style="font-size:10px;color:var(--dtxt-muted);margin-top:2px">${(c.base_votes || 0).toLocaleString()} direct + ${(c.transfer_votes || 0).toLocaleString()} transferred</div>`;
            }
            return `<tr>
                <td><span class="pol-el-color-dot" style="background:${color}"></span>${escapeHtml(c.candidate_name)}${winBadge}</td>
                <td>${escapeHtml(c.party_name)}</td>
                <td>${(c.votes || 0).toLocaleString()}${transferNote}</td>
                <td class="pol-el-bar-cell"><div class="pol-el-bar"><div class="pol-el-bar-fill" style="width:${barW}%;background:${color}"></div></div></td>
                <td>${pct}%</td>
            </tr>`;
        }).join('');

        let candidateTable = `
            <div class="pol-el-date">${date}</div>
            <div class="pol-el-summary">Turnout: ${(r.turnout_pct || 0).toFixed(1)}% &middot; ${(r.total_votes_cast || 0).toLocaleString()} votes</div>
            <table class="pol-el-table">
                <thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th></th><th>%</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>`;

        // Render vote transfer breakdown showing where eliminated parties' votes went
        const allTransfers = sorted.flatMap(c => (c.transfer_detail || []).map(t => ({ ...t, to_candidate: c.candidate_name, to_faction_id: c.faction_id })));
        if (allTransfers.length > 0) {
            let transferRows = allTransfers.map(t => {
                const fromColor = colorMap[t.faction_id] || '#888';
                const toColor = colorMap[t.to_faction_id] || '#888';
                const ratePct = t.round1_votes > 0 ? Math.round((t.transferred / t.round1_votes) * 100) : 0;
                return `<tr>
                    <td><span class="pol-el-color-dot" style="background:${fromColor}"></span>${escapeHtml(t.party_name || '')}</td>
                    <td><span class="pol-el-color-dot" style="background:${toColor}"></span>${escapeHtml(t.to_candidate || '')}</td>
                    <td>${(t.transferred || 0).toLocaleString()}</td>
                    <td>${ratePct}%</td>
                </tr>`;
            }).join('');

            candidateTable += `
                <div style="margin-top:14px;font-family:var(--dfont-mono);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--dtxt-muted);margin-bottom:6px">Vote Transfers</div>
                <table class="pol-el-table">
                    <thead><tr><th>Eliminated Party</th><th>Votes Went To</th><th>Transferred</th><th>Rate</th></tr></thead>
                    <tbody>${transferRows}</tbody>
                </table>`;
        }

        return candidateTable;
    }

    // Determine if presidential election had a runoff
    const wasRunoff = lastPresidential?.results?.was_runoff === true;

    // Build presidential tabs
    let presTabs, presContents;
    if (wasRunoff) {
        presTabs = `
            <button class="pol-el-tab" data-tab="pres-r1">General Election [1st Round]</button>
            <button class="pol-el-tab" data-tab="pres-runoff">General Election [Runoff]</button>`;
        presContents = `
            <div class="pol-el-content" data-content="pres-r1">${renderRound1Content(lastPresidential)}</div>
            <div class="pol-el-content" data-content="pres-runoff">${renderRunoffContent(lastPresidential)}</div>`;
    } else {
        presTabs = `<button class="pol-el-tab" data-tab="pres">General Election</button>`;
        presContents = `<div class="pol-el-content" data-content="pres">${renderPresidentialContent(lastPresidential)}</div>`;
    }

    // Endorsement button state (shared logic with endorsement-ui.js)
    const endorseState = computeEndorsementButtonState({
        isPresidentialSystem: isGovernmentPresidential(nation),
        scheduledElections,
        currentTick,
        playerSeats: mySeats
    });

    let endorseHint = '';
    if (endorseState.ticksUntilWindow) {
        endorseHint = `<div style="font-size:10px;color:var(--dtxt-muted);text-align:right;margin-top:2px">Available in ${endorseState.ticksUntilWindow} tick${endorseState.ticksUntilWindow !== 1 ? 's' : ''}</div>`;
    } else if (!endorseState.disabled && endorseState.ticksUntilElection) {
        endorseHint = `<div style="font-size:10px;color:var(--dgreen);text-align:right;margin-top:2px">${endorseState.ticksUntilElection} tick${endorseState.ticksUntilElection !== 1 ? 's' : ''} until election</div>`;
    }

    // Build endorsement button + panel HTML (hidden entirely for non-presidential systems)
    let endorseButtonHtml = '';
    let endorsePanelHtml = '';
    if (!endorseState.hidden) {
        const currentEndorsedId = currentEndorsement?.endorsed_party_id || null;
        const otherParties = (allParties || []).filter(p => p.id !== faction?.id && (p.seats || 0) > 0);
        const endorseCandidatesHtml = otherParties.map(p => {
            const color = p.party_color || '#888';
            const leaderName = [p.leader_first_name, p.leader_last_name].filter(Boolean).join(' ') || 'Unknown';
            const isCurrentlyEndorsed = p.id === currentEndorsedId;
            return `<div class="pol-endorse-candidate${isCurrentlyEndorsed ? ' selected' : ''}" data-faction-id="${p.id}">
                <span class="pol-el-color-dot" style="background:${color}"></span>
                <span class="pol-endorse-candidate-name">${escapeHtml(p.faction_name || p.abbreviation)}</span>
                <span class="pol-endorse-candidate-leader">${escapeHtml(leaderName)}</span>
                <span class="pol-endorse-candidate-seats">${p.seats || 0} seats</span>
                ${isCurrentlyEndorsed ? '<span style="font-family:var(--dfont-mono);font-size:8px;color:var(--dgreen)">ENDORSED</span>' : ''}
            </div>`;
        }).join('');

        endorseButtonHtml = `<div>
            <button class="pol-endorse-btn" ${endorseState.disabled ? 'disabled' : ''}>Endorse Candidate</button>
            ${endorseHint}
        </div>`;

        endorsePanelHtml = `<div class="pol-endorse-panel" style="display:none">
            <div class="pol-endorse-panel-header">
                <span class="pol-section-label" style="margin-bottom:0;font-size:9px">ENDORSE A CANDIDATE</span>
                <button class="pol-endorse-panel-close">&times;</button>
            </div>
            <div class="pol-endorse-panel-desc">Select a party's candidate to endorse for the presidential election.</div>
            <div class="pol-endorse-candidate-list">
                ${endorseCandidatesHtml || '<div class="pol-el-empty">No eligible parties to endorse.</div>'}
            </div>
        </div>`;
    }

    return `<div class="pol-election-box"
        data-faction-id="${faction?.id || ''}"
        data-nation-id="${nation?.id || ''}"
        data-current-tick="${currentTick || 0}">
        <div class="pol-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="pol-box-label">Election Results</span>
            <div class="pol-box-header-right">${endorseButtonHtml}</div>
        </div>
        <div class="pol-box-body" style="padding:0">
        ${endorsePanelHtml}
        <div class="pol-el-tabs">
            <button class="pol-el-tab active" data-tab="parl">Parliamentary</button>
            ${presTabs}
        </div>
        <div class="pol-el-content active" data-content="parl">${renderParliamentaryContent(lastParliamentary)}</div>
        ${presContents}
        </div>
    </div>`;
}

function initElectionResultsBox() {
    const box = document.querySelector('.pol-election-box');
    if (!box) return;
    const tabs = box.querySelectorAll('.pol-el-tab');
    const contents = box.querySelectorAll('.pol-el-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            const content = box.querySelector(`.pol-el-content[data-content="${target}"]`);
            if (content) content.classList.add('active');
        });
    });

    // Endorsement panel toggle
    const endorseBtn = box.querySelector('.pol-endorse-btn');
    const endorsePanel = box.querySelector('.pol-endorse-panel');
    const endorseClose = box.querySelector('.pol-endorse-panel-close');
    if (endorseBtn && endorsePanel) {
        endorseBtn.addEventListener('click', () => {
            const isOpen = endorsePanel.style.display !== 'none';
            endorsePanel.style.display = isOpen ? 'none' : 'block';
        });
        if (endorseClose) {
            endorseClose.addEventListener('click', () => {
                endorsePanel.style.display = 'none';
            });
        }

        // Candidate selection — calls switchPartyEndorsement RPC
        endorsePanel.querySelectorAll('.pol-endorse-candidate').forEach(el => {
            el.addEventListener('click', async () => {
                const targetFactionId = el.getAttribute('data-faction-id');
                const factionId = box.getAttribute('data-faction-id');
                const currentTick = Number(box.getAttribute('data-current-tick') || 0);
                const partyName = el.querySelector('.pol-endorse-candidate-name')?.textContent || 'this party';

                if (!confirm(`Endorse ${partyName}'s candidate for president?`)) return;

                el.style.opacity = '0.5';
                el.style.pointerEvents = 'none';
                try {
                    const result = await switchPartyEndorsement(_supabase, factionId, targetFactionId, currentTick);
                    if (!result.success) {
                        alert(result.error || 'Endorsement failed.');
                        return;
                    }
                    // Mark selected candidate
                    endorsePanel.querySelectorAll('.pol-endorse-candidate').forEach(c => {
                        c.classList.remove('selected');
                        c.querySelector('[style*="color:var(--dgreen)"]')?.remove();
                    });
                    el.classList.add('selected');
                    const badge = document.createElement('span');
                    badge.style.cssText = 'font-family:var(--dfont-mono);font-size:8px;color:var(--dgreen)';
                    badge.textContent = 'ENDORSED';
                    el.appendChild(badge);

                    alert(`Endorsed ${partyName}!`);
                    endorsePanel.style.display = 'none';
                    await refreshAP(factionId);
                } catch (err) {
                    alert('Endorsement failed: ' + (err.message || 'Unknown error'));
                } finally {
                    el.style.opacity = '';
                    el.style.pointerEvents = '';
                }
            });
        });
    }
}

function initBlocAlignment() {
    const dataEl = document.getElementById('pol-ba-bloc-data');
    const partyPosEl = document.getElementById('pol-ba-party-pos');
    const partyColorEl = document.getElementById('pol-ba-party-color');
    if (!dataEl || !partyPosEl) return;

    const blocsData = JSON.parse(dataEl.textContent);
    const partyPos = JSON.parse(partyPosEl.textContent);
    const partyColor = JSON.parse(partyColorEl.textContent);
    if (blocsData.length === 0) return;

    const TIER_COLORS = {
        BASE: { color: 'var(--dgreen)', raw: '#4ade80', dim: 'rgba(74,222,128,0.08)' },
        LEAN: { color: '#22d3ee', raw: '#22d3ee', dim: 'rgba(34,211,238,0.08)' },
        SWING: { color: 'var(--damber)', raw: '#facc15', dim: 'rgba(250,204,21,0.08)' },
        SKEPTICAL: { color: '#f97316', raw: '#f97316', dim: 'rgba(249,115,22,0.08)' },
        HOSTILE: { color: 'var(--dred)', raw: '#ef4444', dim: 'rgba(239,68,68,0.08)' },
    };
    const AXES = [
        { key: 'liberty_equality', left: 'Liberty', right: 'Equality' },
        { key: 'tradition_progress', left: 'Tradition', right: 'Progress' },
        { key: 'security_freedom', left: 'Security', right: 'Freedom' },
        { key: 'globalism_nationalism', left: 'Globalism', right: 'Nationalism' },
        { key: 'individualism_collectivism', left: 'Individualism', right: 'Collectivism' },
    ];

    const distColor = d => d <= 10 ? 'var(--dgreen)' : d <= 20 ? '#22d3ee' : d <= 35 ? 'var(--damber)' : d <= 50 ? '#f97316' : 'var(--dred)';
    const strDots = s => s >= 3 ? '●●●' : s >= 2 ? '●●' : s >= 1 ? '●' : '';
    const strColor = s => s >= 3 ? 'var(--dred)' : s >= 2 ? '#f97316' : s >= 1 ? 'var(--damber)' : 'var(--dtext-3)';

    const selectedEl = document.getElementById('pol-ba-selected');
    const dropdown = document.getElementById('pol-ba-dropdown');
    const arrow = document.getElementById('pol-ba-sel-arrow');
    const items = dropdown.querySelectorAll('.pol-ba-drop-item');

    function renderBloc(bloc) {
        const tc = TIER_COLORS[bloc.tier] || TIER_COLORS.HOSTILE;

        // Selected bar
        document.getElementById('pol-ba-sel-dot').style.background = tc.raw;
        document.getElementById('pol-ba-sel-name').textContent = bloc.name;
        const badge = document.getElementById('pol-ba-sel-badge');
        badge.textContent = bloc.tier;
        badge.style.color = tc.raw;
        badge.style.background = tc.dim;
        document.getElementById('pol-ba-sel-pct').textContent = bloc.pct + '%';

        // Compute alignment from ideology distance
        const axisData = AXES.map(ax => {
            const pv = partyPos[ax.key] || 50;
            const bv = bloc.axes[ax.key] || 50;
            const dist = Math.abs(pv - bv);
            const str = bloc.strengths[ax.key] || 0.5;
            return { ...ax, pv, bv, dist, str, weighted: dist * str };
        });
        const totalWeighted = axisData.reduce((s, a) => s + a.weighted, 0);
        const maxWeighted = AXES.length * 100 * 3; // max possible
        const alignment = Math.round(Math.max(0, 100 - (totalWeighted / maxWeighted) * 100));
        const approval = bloc.pref;
        const headroom = alignment - approval;

        // Stats
        const alEl = document.getElementById('pol-ba-alignment');
        alEl.textContent = alignment;
        alEl.style.color = tc.raw;
        const perfEl = document.getElementById('pol-ba-performance');
        const perf = bloc.perf ?? 50;
        perfEl.textContent = Math.round(perf);
        perfEl.style.color = perf >= 55 ? 'var(--dgreen)' : perf >= 40 ? 'var(--damber)' : 'var(--dred)';
        const apEl = document.getElementById('pol-ba-approval');
        apEl.textContent = approval;
        apEl.style.color = 'var(--dtext-0)';
        const hrEl = document.getElementById('pol-ba-headroom');
        hrEl.textContent = (headroom >= 0 ? '+' : '') + headroom.toFixed(1);
        hrEl.style.color = headroom > 10 ? 'var(--damber)' : headroom >= 0 ? 'var(--dgreen)' : 'var(--dred)';

        // Legend
        document.getElementById('pol-ba-legend-bloc-dot').style.background = tc.raw;
        const lbn = document.getElementById('pol-ba-legend-bloc-name');
        lbn.textContent = bloc.name;
        lbn.style.color = tc.raw;

        // Axes
        const axesContainer = document.getElementById('pol-ba-axes');
        axesContainer.innerHTML = axisData.map(a => {
            const dc = distColor(a.dist);
            const bandLeft = Math.min(a.pv, a.bv);
            const bandWidth = a.dist;
            return `<div class="pol-ba-axis-row">
                <div class="pol-ba-axis-labels">
                    <span class="pol-ba-axis-label">${a.left}</span>
                    <span class="pol-ba-axis-str" style="color:${strColor(a.str)}">${strDots(a.str)}</span>
                    <span class="pol-ba-axis-label">${a.right}</span>
                </div>
                <div class="pol-ba-axis-track">
                    <div style="position:absolute;left:15%;top:0;width:1px;height:100%;background:rgba(239,68,68,0.22)"></div>
                    <div style="position:absolute;left:85%;top:0;width:1px;height:100%;background:rgba(239,68,68,0.22)"></div>
                    <div style="position:absolute;left:35%;top:0;width:1px;height:100%;background:rgba(250,204,21,0.22)"></div>
                    <div style="position:absolute;left:65%;top:0;width:1px;height:100%;background:rgba(250,204,21,0.22)"></div>
                    <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(255,255,255,0.1)"></div>
                    ${a.dist > 3 ? `<div class="pol-ba-axis-band" style="left:${bandLeft}%;width:${bandWidth}%;background:${dc}12"></div>` : ''}
                    <div class="pol-ba-axis-marker" style="left:${a.pv}%;background:${partyColor};z-index:3">
                        <span style="color:var(--dbg-0)">${a.pv}</span>
                    </div>
                    <div class="pol-ba-axis-marker" style="left:${a.bv}%;background:${tc.raw}">
                        <span style="color:var(--dbg-0)">${a.bv}</span>
                    </div>
                </div>
                <div class="pol-ba-axis-meta">
                    <span style="color:${dc}">dist: ${a.dist}</span>
                    <span style="color:var(--dtext-3)">×${a.str} = <span style="color:${dc};font-weight:700">${a.weighted.toFixed(0)}</span></span>
                </div>
            </div>`;
        }).join('');

        // Summary
        const bestAxis = axisData.reduce((b, a) => a.dist < b.dist ? a : b, axisData[0]);
        const worstAxis = axisData.reduce((w, a) => a.weighted > w.weighted ? a : w, axisData[0]);
        document.getElementById('pol-ba-summary').innerHTML =
            `<span style="color:var(--dgreen)">Closest: ${bestAxis.left}/${bestAxis.right}</span>` +
            `<span style="color:var(--dred)">Gap: ${worstAxis.left}/${worstAxis.right}</span>`;

        // Issues
        const issuesContainer = document.getElementById('pol-ba-issues');
        issuesContainer.innerHTML = (bloc.issues || []).map(iss =>
            `<span class="pol-ba-issue-tag">${iss}</span>`
        ).join('');

        // Update dropdown active state
        items.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-bloc-id') === bloc.id);
            if (item.getAttribute('data-bloc-id') === bloc.id) {
                item.style.borderLeftColor = tc.raw;
            } else {
                item.style.borderLeftColor = 'transparent';
            }
        });
    }

    // Initial render with first bloc
    renderBloc(blocsData[0]);

    // Toggle dropdown
    selectedEl.addEventListener('click', () => {
        const isOpen = dropdown.classList.toggle('open');
        arrow.classList.toggle('open', isOpen);
    });

    // Select a bloc
    items.forEach(item => {
        item.addEventListener('click', () => {
            const blocId = item.getAttribute('data-bloc-id');
            const bloc = blocsData.find(b => b.id === blocId);
            if (bloc) renderBloc(bloc);
            dropdown.classList.remove('open');
            arrow.classList.remove('open');
        });
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        const selector = document.getElementById('pol-ba-selector');
        if (selector && !selector.contains(e.target)) {
            dropdown.classList.remove('open');
            arrow.classList.remove('open');
        }
    });
}



function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════════
// DEMOCRACY CAMPAIGN ACTIONS TAB (Press Conference, Attack, Protest)
// ═══════════════════════════════════════════════════════════════════

// Campaign action state
let _caSelected = null;   // 'attack' | 'protest' | 'press_conference'
let _caRival = null;      // selected rival faction id
let _caVector = null;     // attack vector id
let _caResult = null;     // last action result for display

let _caAttackVectors = null;  // cached built vectors

// Protest action state
let _protestTab = 'minister';       // 'minister' | 'statFailure' (Phase 3: 'activeCrisis' tab removed)
let _protestTarget = null;          // selected grievance target object
let _protestState = null;           // null | 'resolving' | 'result' | 'active' | 'locked' | 'cooldown'
let _protestActiveData = null;      // active protest_log row (if any)
let _endorseableProtest = null;     // another party's resolving protest that we can endorse
let _alreadyEndorsed = false;       // whether we already endorsed the current endorseable protest
let _protestCachedMinisters = null;
// Crisis sunset (Phase 3): _protestCachedCrises dropped; Active Crisis
// target tab is gone.
let _protestCachedStats = null;
let _protestLoading = false;
let _govProtestCrisis = null;       // active protest crisis for governing party PA row

// Store references for re-rendering
let _currentNation = null, _currentFaction = null, _currentShard = null, _currentAllParties = null;
let _caIsGoverning = false;

// Campaign actions organized by category
const CA_ACTION_CATEGORIES = [
    { key: 'momentum', label: 'MOMENTUM', color: '#f97316' },
];

const CA_ACTIONS = [
    // MOMENTUM
    { id: 'press_conference', name: 'Press Conference', ap: 1, color: '#fbbf24', icon: '🎤',
      category: 'momentum', affects: 'Momentum',
      desc: 'Hold a press conference to make a public statement. Base roll: -2 to +2 Momentum. Opposition parties get +1 bonus. High-approval governing parties get +2 bonus.' },
    { id: 'attack', name: 'Campaign Attack', ap: ATTACK_CONFIG.AP_COST, color: '#ef4444', icon: '✦',
      category: 'momentum', affects: 'Momentum',
      desc: 'Target a rival party\'s record or leadership. Lowers their momentum and can hurt their election chances. More effective with evidence — but a weak attack backfires on you.' },
];

// State for campaign actions
let _caCooldowns = {};     // { action_type: ticksRemaining }
let _caUsedThisTick = {};  // { actionId: true } — actions already used this tick
let _caPressEscalation = 0;    // press conference cost escalation: +1 per use, -1 per tick

function caReset() {
    _caRival = null; _caVector = null;
    _caAttackVectors = null;
    _protestTab = 'minister'; _protestTarget = null;
    _protestCachedMinisters = null; _protestCachedStats = null;
    _protestLoading = false;
}

function caIsReady() {
    if (_caSelected === 'attack') return !!_caRival && !!_caVector;
    if (_caSelected === 'protest') return !!_protestTarget;
    if (_caSelected === 'press_conference') return true;
    return false;
}

function caGetCost() {
    // Only consumed by money-cost actions (affordability check + label). The
    // campaign actions are free since the AP cull, so the result is otherwise unused.
    const act = CA_ACTIONS.find(a => a.id === _caSelected);
    return act?.ap ?? 0;
}

async function renderDemocracyActions(nation, faction, shard, allParties) {
    _currentNation = nation;
    _currentFaction = faction;
    _currentShard = shard;
    _currentAllParties = allParties;
    const container = document.getElementById('actions-container');
    if (!container) return;

    let tick = shard?.current_tick || 0;
    // Fallback: if shard tick is missing, fetch it directly
    if (!tick) {
        const { data: freshShard } = await _supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        tick = freshShard?.current_tick || 0;
        if (shard) shard.current_tick = tick;
    }
    const f = faction;
    const n = nation;

    // Refresh faction funds and last_action_tick (for Quick Study trait discount accuracy)
    const { data: freshF } = await _supabase.from('factions')
        .select('party_funds, last_action_tick').eq('id', f.id).single();
    if (freshF) {
        f.party_funds = freshF.party_funds;
        f.last_action_tick = freshF.last_action_tick;
    }

    // Check if faction is in government (ruling party or coalition member)
    const coalition = await fetchActiveCoalition(_supabase, n.id);
    const coalitionIds = new Set(coalition?.party_ids || []);
    _caIsGoverning = f.id === n.ruling_faction_id || coalitionIds.has(f.id);


    // Fetch other parties
    const otherParties = (allParties || []).filter(p => p.id !== f.id);

    // Fetch protest state for the action row
    let protestCheck = { allowed: false, reason: '' };
    let protestApCost = 2;
    if (!_caIsGoverning) {
        const { data: activeProtest } = await _supabase
            .from('protest_log')
            .select('id, status, tier, tick_called, tick_resolved, crisis_started_tick, crisis_duration, demand_label, turnout_score, effects_applied, grievance_type, grievance_data')
            .eq('faction_id', f.id)
            .in('status', ['resolving', 'crisis_active'])
            .limit(1).maybeSingle();
        _protestActiveData = activeProtest;

        const decayedCount = getDecayedUseCount(f.protest_use_count || 0, f.protest_last_use_tick, tick);
        protestApCost = getProtestCost(decayedCount);

        protestCheck = canCallProtest(f, tick, true, activeProtest);

        // Detect protest state for visual display
        if (activeProtest) {
            _protestState = activeProtest.status === 'resolving' ? 'resolving' : 'active';
        } else if (f.protest_locked_by) {
            _protestState = 'locked';
        } else if (f.protest_cooldown_until_tick && f.protest_cooldown_until_tick > tick) {
            _protestState = 'cooldown';
        } else {
            // Check for recently resolved protest (result flash, 1 tick)
            const { data: recentResolved } = await _supabase
                .from('protest_log')
                .select('id, tier, turnout_score, effects_applied, tick_resolved, roll_breakdown, condition_score')
                .eq('faction_id', f.id)
                .eq('status', 'resolved')
                .gte('tick_resolved', tick - 1)
                .order('tick_resolved', { ascending: false })
                .limit(1).maybeSingle();
            if (recentResolved && recentResolved.tick_resolved === tick) {
                _protestState = 'result';
                _protestActiveData = recentResolved;
            } else {
                _protestState = null;
            }
        }
    }

    // Check for another party's resolving protest (endorsement window)
    _endorseableProtest = null;
    _alreadyEndorsed = false;
    if (!_caIsGoverning && !_protestActiveData) {
        const { data: otherProtest } = await _supabase
            .from('protest_log')
            .select('id, faction_id, status, tier, demand_label, grievance_type')
            .eq('nation_id', n.id)
            .eq('status', 'resolving')
            .neq('faction_id', f.id)
            .limit(1).maybeSingle();
        if (otherProtest) {
            _endorseableProtest = otherProtest;
            // Check if already endorsed
            const { data: existingEndorse } = await _supabase
                .from('protest_endorsements')
                .select('id')
                .eq('protest_id', otherProtest.id)
                .eq('faction_id', f.id)
                .maybeSingle();
            _alreadyEndorsed = !!existingEndorse;
        }
    }

    // Governing party: check for active protest crisis (for Public Address row)
    _govProtestCrisis = null;
    if (_caIsGoverning) {
        const { data: govCrisis } = await _supabase
            .from('protest_log')
            .select('id, tier, status, public_address_last_tick, tier7_demand, crisis_started_tick, crisis_duration')
            .eq('nation_id', n.id)
            .eq('status', 'crisis_active')
            .order('crisis_started_tick', { ascending: false })
            .limit(1).maybeSingle();
        _govProtestCrisis = govCrisis;
    }

    // Fetch cooldown and active action data for UI
    const { data: recentActions } = await _supabase.from('campaign_actions')
        .select('action_type, tick_performed')
        .eq('party_id', f.id)
        .gte('tick_performed', tick - 10)
        .order('tick_performed', { ascending: false });
    _caCooldowns = {};
    _caUsedThisTick = {};
    for (const a of (recentActions || [])) {
        const actionId = a.action_type;
        if (a.tick_performed === tick) {
            _caUsedThisTick[actionId] = true;
        }
    }

    // Compute escalation for repeatable actions: +1 per use, decays -1 per tick of non-use
    for (const [actionType, setter] of [['press_conference', v => _caPressEscalation = v]]) {
        const acts = (recentActions || []).filter(a => a.action_type === actionType);
        if (acts.length > 0) {
            const lastTick = Math.max(...acts.map(a => a.tick_performed));
            setter(Math.max(0, acts.length - (tick - lastTick)));
        } else {
            setter(0);
        }
    }

    renderCampaignUI(container, f, n, otherParties, tick, protestCheck, protestApCost);
}

function renderCampaignUI(container, f, n, otherParties, tick, protestCheck, protestApCost) {
    const allActions = [...CA_ACTIONS];

    // Add protest action for opposition only (under momentum category)
    if (!_caIsGoverning) {
        allActions.push({
            id: 'protest', name: 'Organise a Protest', ap: protestApCost || 2,
            color: '#d9534f', icon: '!',
            category: 'momentum', affects: 'Momentum',
            desc: 'Mobilize citizens against the government. A strong turnout forces a crisis and builds your momentum, but a fizzle hands the ruling party a free headline.',
        });
    }

    const sel = allActions.find(a => a.id === _caSelected);

    // Action list (left)
    let listHtml = '';

    // Pyrrhic Victory warning banner
    if (f.pyrrhic_victory_until_tick && f.pyrrhic_victory_until_tick > tick) {
        const pyrrhicRemaining = f.pyrrhic_victory_until_tick - tick;
        listHtml += `<div class="protest-pyrrhic-banner">
            <span style="font-weight:700">PYRRHIC VICTORY</span> — ${pyrrhicRemaining} tick${pyrrhicRemaining !== 1 ? 's' : ''} remaining.
        </div>`;
    }

    // Public Address pinned row for governing parties during T6/T7 crisis
    if (_caIsGoverning && _govProtestCrisis) {
        const pc = _govProtestCrisis;
        const paCooldownRemaining = pc.public_address_last_tick != null
            ? Math.max(0, PROTEST_CONFIG.PUBLIC_ADDRESS_COOLDOWN - (tick - pc.public_address_last_tick))
            : 0;
        const paReady = paCooldownRemaining === 0;
        const cooldownClass = paCooldownRemaining > 0 ? ' ca-item--cooldown' : '';
        const paApLabel = paCooldownRemaining > 0
            ? `${paCooldownRemaining} TICK CD`
            : 'READY';
        listHtml += `<div class="ca-item ca-item--public-address${cooldownClass}${!paReady ? ' disabled' : ''}" data-action-id="public_address" style="${!paReady ? 'opacity:0.5;' : ''}">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#5b9bd5">&#9788;</span>
                    <span class="ca-item-name">Public Address</span>
                </div>
                <span class="ca-item-ap">${paApLabel}</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840;">Issue a public statement calling for calm. Reduces civil unrest buildup this tick.</div>
        </div>`;
    }

    // Render actions grouped by category in a 2-column grid per group
    // Group actions by category
    const categoryGroups = [];
    let currentGroup = null;
    for (const act of allActions) {
        if (act.category && (!currentGroup || act.category !== currentGroup.key)) {
            currentGroup = { key: act.category, actions: [] };
            categoryGroups.push(currentGroup);
        }
        if (currentGroup) currentGroup.actions.push(act);
    }

    for (let gi = 0; gi < categoryGroups.length; gi++) {
        const group = categoryGroups[gi];
        const catDef = CA_ACTION_CATEGORIES.find(c => c.key === group.key);
        if (catDef) {
            listHtml += `<div style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${catDef.color};padding:10px 8px 3px;${gi > 0 ? 'border-top:1px solid var(--dborder-0);margin-top:6px;' : ''}">${catDef.label}</div>`;
        }
        listHtml += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:0 3px;">`;

        for (const act of group.actions) {
            const isSel = _caSelected === act.id;
            const isProtest = act.id === 'protest';

            // Protest row has special state-driven rendering — spans full width
            if (isProtest) {
                listHtml += `<div style="grid-column:1/-1">${renderProtestActionRow(act, isSel, f, tick)}</div>`;
                continue;
            }

            const dbActionType = act.id;
            const cdRemaining = _caCooldowns[dbActionType] || 0;
            const onCooldown = cdRemaining > 0;
            const usedThisTick = !!_caUsedThisTick[dbActionType];
            const ok = !onCooldown && !usedThisTick;
            const borderColor = isSel ? act.color : ok ? act.color + '55' : 'var(--dtext-3)';
            const bgStyle = isSel ? `background:${act.color}08;` : '';
            const borderStyle = isSel ? `border-color:${act.color}33;` : '';
            const nameColor = isSel ? act.color : 'var(--dtext-0)';
            const affectsColor = (act.affects === 'Momentum' || act.affects === 'Sector Popularity') ? '#f97316' : '#6b7280';
            const usedLabel = usedThisTick ? `${act.name} already used this turn` : '';
            const statusBadge = usedThisTick
                ? `<span class="ca-used-badge">USED</span>`
                : onCooldown
                ? `<span class="ca-cd-badge">${cdRemaining} tick${cdRemaining !== 1 ? 's' : ''} CD</span>`
                : '';
            listHtml += `<div class="ca-item${isSel ? ' selected' : ''}${!ok ? ' disabled' : ''}${onCooldown ? ' ca-item--cooldown' : ''}${usedThisTick ? ' ca-item--used' : ''}" data-action-id="${act.id}" style="border-left-color:${borderColor};${bgStyle}${borderStyle}${!ok ? 'opacity:0.35;' : ''}">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:${act.color}">${act.icon}</span>
                        <span class="ca-item-name" style="color:${nameColor}">${escapeHtml(act.name)}</span>
                        ${statusBadge}
                    </div>
                    <span class="ca-item-ap">${usedThisTick ? 'USED' : onCooldown ? `${cdRemaining} TICK CD` : ''}</span>
                </div>
                <div class="ca-item-desc">${escapeHtml(act.desc)}</div>
                ${usedThisTick ? `<div class="ca-item-used-msg">${escapeHtml(usedLabel)}</div>` : `<div class="ca-item-affects" style="color:${affectsColor}">This action affects ${act.affects}</div>`}
            </div>`;
        }

        listHtml += `</div>`; // close grid
    }

    // Config panel (right)
    let panelHtml = '';
    if (!sel) {
        panelHtml = `<div class="ca-panel"><div class="ca-panel-empty"><div class="ca-panel-empty-text">Choose an action</div></div></div>`;
    } else {
        panelHtml = `<div class="ca-panel" style="border-color:${sel.color}22">`;

        // Show last result if present
        if (_caResult) {
            panelHtml += renderActionResult(_caResult);
        } else if (sel.id === 'protest' && _protestState === 'result' && _protestActiveData) {
            panelHtml += renderProtestResultPanel(_protestActiveData);
        } else if (sel.id === 'protest' && _protestState === 'resolving') {
            panelHtml += renderProtestResolvingPanel();
        } else {
            panelHtml += renderActionConfig(sel, otherParties, n, tick);
            // Confirm button
            const cost = caGetCost();
            const ready = caIsReady();
            const isMoneyAct = !!sel.money;
            const canAfford = isMoneyAct ? (f.party_funds || 0) >= cost : true;
            const canConfirm = canAfford && ready;
            const costLabel = isMoneyAct ? `Confirm — ${formatCurrencyShort(cost)}` : 'Confirm';
            panelHtml += `<div class="ca-confirm-row"><div class="ca-confirm-btn${canConfirm ? '' : ' disabled'}" style="background:${canConfirm ? sel.color : 'var(--dtext-3)'}" id="ca-confirm-btn">${costLabel}</div></div>`;
        }
        panelHtml += `</div>`;
    }

    container.innerHTML = `<div class="ca-wrap"><div class="ca-list">${listHtml}</div>${panelHtml}</div>
    <div class="pe-container">
        <div class="pe-header"><span class="pol-mod-title">Party Events</span></div>
        <div id="party-events-feed" class="pe-feed"><div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px">Loading events...</div></div>
    </div>`;

    // Load party events feed
    _loadPartyEventsFeed(n.id, f.id);

    // Wire up action selection
    container.querySelectorAll('.ca-item').forEach(el => {
        el.addEventListener('click', async () => {
            const id = el.dataset.actionId;

            // Public Address — execute immediately, no config
            if (id === 'public_address' && _govProtestCrisis) {
                if (el.classList.contains('disabled')) return;
                if (el.dataset.executing) return; // double-fire guard
                el.dataset.executing = 'true';
                el.style.opacity = '0.4';
                try {
                    const result = await executePublicAddress(_supabase, f.id, n.id, _govProtestCrisis.id, tick);
                    if (result.success) {
                        await refreshAP(f.id);
                        await renderDemocracyActions(n, f, _currentShard, _currentAllParties);
                    } else {
                        _showToast(result.error || 'Public Address failed.');
                        el.style.opacity = '';
                        delete el.dataset.executing;
                    }
                } catch (e) {
                    _showToast('Error: ' + (e.message || 'Unknown'));
                    el.style.opacity = '';
                    delete el.dataset.executing;
                }
                return;
            }

            if (_caSelected === id) { _caSelected = null; } else { _caSelected = id; }
            caReset();
            _caResult = null;
            renderCampaignUI(container, f, n, otherParties, tick, protestCheck, protestApCost);
        });
    });

    // Wire up config interactions
    wireCampaignConfig(container, f, n, otherParties, tick, protestCheck, protestApCost);
}

// ── Render config body for each action ──

function renderActionConfig(sel, otherParties, nation, tick) {
    if (sel.id === 'attack') return renderAttackConfig(otherParties);
    if (sel.id === 'protest') return renderProtestConfig(nation, tick);
    if (sel.id === 'press_conference') return `<div class="ca-info-box">Hold a press conference to make a public statement. Result depends on your position and approval.<br><br><strong>Base roll:</strong> -2 to +2 Momentum<br><strong>Opposition bonus:</strong> +1<br><strong>Government bonus:</strong> +2 (if gov approval ≥ 40)</div>`;
    return '';
}

// ── ATTACK CONFIG ──

function renderAttackConfig(otherParties) {
    let html = `<div style="color:#ef4444;font-size:0.85em;margin-bottom:4px">Using this will increase Polarization by 0.25.</div><div class="ca-subtitle">Select target party</div>`;
    for (const r of otherParties) {
        const isSel = _caRival === r.id;
        html += `<div class="ca-rival-card${isSel ? ' selected' : ''}" data-rival-id="${r.id}" style="border-left-color:${isSel ? '#ef4444' : r.party_color || '#888'};${isSel ? 'border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)' : ''}">
            <span class="ca-rival-name" style="color:${isSel ? '#ef4444' : 'var(--dtext-0)'}">${escapeHtml(r.faction_name)}</span>
        </div>`;
    }

    // Show attack vectors if rival selected and evidence loaded
    if (_caRival && _caAttackVectors) {
        html += `<div class="ca-subtitle" style="margin-top:12px">Choose attack vector</div>`;
        for (const v of _caAttackVectors) {
            const isSel = _caVector === v.id;
            const hasEvidence = v.strength === 'strong' || v.strength === 'moderate';
            const noEvidence = v.evidence_required && v.strength === 'weak';
            const strengthColor = v.strength === 'strong' ? '#4ade80' : v.strength === 'moderate' ? '#facc15' : '#ef4444';
            html += `<div class="ca-vector-card${isSel ? ' selected' : ''}${noEvidence ? ' disabled' : ''}" data-vector-id="${v.id}" style="border-left-color:${isSel ? '#ef4444' : strengthColor};${isSel ? 'border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.03)' : ''}">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span class="ca-vector-name">${escapeHtml(v.name)}</span>
                    <span class="ca-vector-strength" style="color:${strengthColor}">${v.strength.toUpperCase()}</span>
                </div>
                <div class="ca-vector-desc">${escapeHtml(v.description)}</div>
            </div>`;
        }

        // Show outcome odds if vector selected
        if (_caVector) {
            const vec = _caAttackVectors.find(v => v.id === _caVector);
            if (vec) {
                const weights = getAttackOutcomeWeights(vec.strength);
                const maxPct = Math.max(...Object.values(weights));
                html += `<div style="margin-top:10px">`;
                const attackColors = { devastating: '#4ade80', effective: '#22d3ee', glancing: '#facc15', backfire: '#f97316', mutual: '#ef4444' };
                for (const o of ATTACK_OUTCOMES) {
                    const pct = weights[o.id] || 0;
                    const barW = maxPct > 0 ? (pct / maxPct) * 100 : 0;
                    const oColor = attackColors[o.id] || '#888';
                    html += `<div class="ca-outcome-bar">
                        <span class="ca-outcome-name">${escapeHtml(o.name)}</span>
                        <div class="ca-outcome-track"><div class="ca-outcome-fill" style="width:${barW}%;background:${oColor}"></div></div>
                        <span class="ca-outcome-pct" style="color:${oColor}">${pct}%</span>
                    </div>`;
                }
                html += `</div>`;
            }
        }
    } else if (_caRival && !_caAttackVectors) {
        html += `<div class="ca-info-box" style="margin-top:12px">Loading evidence...</div>`;
    }

    return html;
}

// ── Result display ──

// ── Protest Data Loading ──

async function loadProtestData(nation, faction, tick) {
    // Load ministers (sorted by approval ascending)
    if (!_protestCachedMinisters) {
        const { data: ministers } = await _supabase
            .from('ministries')
            .select('ministry_key, minister_first_name, minister_last_name, minister_approval, party_id')
            .eq('nation_id', nation.id)
            .not('party_id', 'is', null)
            .order('minister_approval', { ascending: true });
        _protestCachedMinisters = ministers || [];
    }

    // Crisis sunset (Phase 3): active_crises read for the "Active Crisis"
    // protest target tab removed (the tab itself is gone).

    // Load stat failure data
    if (!_protestCachedStats) {
        const { data: statHistory } = await _supabase
            .from('stat_history')
            .select('stat_name, value, tick')
            .eq('nation_id', nation.id)
            .gte('tick', tick - 6)
            .order('tick', { ascending: true });

        const statMap = {};
        for (const row of (statHistory || [])) {
            if (!statMap[row.stat_name]) statMap[row.stat_name] = [];
            statMap[row.stat_name].push({ tick: row.tick, value: row.value });
        }

        const failingStats = [];
        for (const [key, history] of Object.entries(statMap)) {
            if (isExcludedStat(key)) continue;
            const sorted = history.sort((a, b) => a.tick - b.tick);
            const current = nation[key] ?? sorted[sorted.length - 1]?.value ?? 0;
            // Only allow stats within 30 of their worst value (≥70 for higher-is-bad, ≤30 for lower-is-bad)
            const isBad = isHigherIsBad(key) ? current >= 70 : current <= 30;
            if (!isBad) continue;
            const sixAgo = sorted[0]?.value ?? current;
            const delta = current - sixAgo;
            const failureScore = getStatFailureScore(current, sixAgo, key);
            failingStats.push({
                key, current, sixTicksAgo: sixAgo, delta, failureScore,
                displayName: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            });
        }
        failingStats.sort((a, b) => b.failureScore - a.failureScore);

        // Protest fatigue
        const { data: recentProtests } = await _supabase
            .from('protest_log')
            .select('tick_called')
            .eq('nation_id', nation.id)
            .gte('tick_called', tick - 6);
        const fatigueLevel = getProtestFatigueLevel(
            (recentProtests || []).map(p => ({ tick: p.tick_called })),
            tick
        );

        _protestCachedStats = { failingStats, _fatigueLevel: fatigueLevel };
    }
}

// ── Protest Action Row (left panel) ──

function renderProtestActionRow(act, isSel, faction, tick) {
    const state = _protestState;
    const ok = true;

    // Resolving state
    if (state === 'resolving') {
        return `<div class="ca-item ca-item--protest ca-item--resolving" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#c8a64e">!</span>
                    <span class="ca-item-name" style="color:#c8a64e">${escapeHtml(act.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#c8a64e">RESOLVING...</span>
            </div>
        </div>`;
    }

    // Result flash state (Tier 3, 4, or 5)
    if (state === 'result' && _protestActiveData) {
        const tier = _protestActiveData.tier;
        if (tier >= 3 && tier <= 5) {
            const tierLabel = getTierLabel(tier).toUpperCase();
            const rb = _protestActiveData.roll_breakdown || {};
            const endorseCount = rb.endorsements || 0;
            const jointBonus = rb.joint_bonus || 0;
            const endorseNote = endorseCount > 0 ? ` (+${endorseCount} endorse${endorseCount > 1 ? 's' : ''})` : '';
            return `<div class="ca-item ca-item--protest ca-item--result-${tier}" data-action-id="protest">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:#5cb85c">!</span>
                        <span class="ca-item-name" style="color:#5cb85c">${escapeHtml(act.name)}</span>
                    </div>
                    <span class="ca-item-ap" style="color:#5cb85c">TIER ${tier} — ${tierLabel}</span>
                </div>
                ${endorseCount > 0 ? `<div style="font-family:var(--dfont-mono);font-size:9px;color:#a78bfa;margin-top:2px;padding:0 12px 4px">${endorseCount} party endorsement${endorseCount > 1 ? 's' : ''} (+${jointBonus} bonus)</div>` : ''}
            </div>`;
        }
    }

    // Active crisis state (calling party)
    if (state === 'active' && _protestActiveData) {
        const remaining = ((_protestActiveData.crisis_started_tick ?? tick) + (_protestActiveData.crisis_duration || 6)) - tick;
        const canCallOff = _protestActiveData.tier === 6;
        const callOffDisabled = _protestActiveData.tier === 7;
        return `<div class="ca-item ca-item--protest ca-item--active" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${escapeHtml(act.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">ACTIVE — TIER ${_protestActiveData.tier}</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Your protest crisis is running. ${_protestActiveData.demand_label ? `Demand: ${escapeHtml(_protestActiveData.demand_label)}` : ''}</div>
            <div class="protest-passive-status">Running — ${Math.max(0, remaining)} tick${remaining !== 1 ? 's' : ''} remaining.</div>
            ${callOffDisabled
                ? `<div class="protest-calloff-note">Tier 7 protests cannot be called off.</div>`
                : `<div class="protest-calloff-btn${canCallOff ? '' : ' disabled'}" onclick="window._protestCallOff()">Call Off Protest</div>`
            }
        </div>`;
    }

    // Locked state (another party's crisis) — may have endorsement opportunity
    if (state === 'locked') {
        return `<div class="ca-item ca-item--protest ca-item--locked" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.5)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.5)">${escapeHtml(act.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:rgba(217,83,79,0.5)">LOCKED</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">A protest crisis is already underway, led by another party.</div>
        </div>`;
    }

    // Cooldown state
    if (state === 'cooldown') {
        const remaining = (faction.protest_cooldown_until_tick || 0) - tick;
        return `<div class="ca-item ca-item--protest ca-item--cooldown" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:rgba(217,83,79,0.3)">!</span>
                    <span class="ca-item-name" style="color:rgba(217,83,79,0.3)">${escapeHtml(act.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#4a4840">COOLDOWN ${Math.max(0, remaining)}</span>
            </div>
        </div>`;
    }

    // Endorsement opportunity (another party's protest is resolving)
    if (_endorseableProtest && !state) {
        const canEndorse = !_alreadyEndorsed;
        const endorseLabel = _alreadyEndorsed ? 'ENDORSED' : 'ENDORSE';
        return `<div class="ca-item ca-item--protest ca-item--endorse" data-action-id="protest">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#a78bfa">!</span>
                    <span class="ca-item-name" style="color:#a78bfa">${escapeHtml(act.name)}</span>
                </div>
                <span class="ca-item-ap" style="color:#a78bfa">ENDORSEMENT</span>
            </div>
            <div class="ca-item-desc" style="color:#4a4840">Another opposition party has called a protest. You can endorse it to boost turnout (+15 per endorsement).</div>
            ${_endorseableProtest.demand_label ? `<div style="font-family:var(--dfont-mono);font-size:9px;color:#f97316;padding:0 12px 4px">Demand: ${escapeHtml(_endorseableProtest.demand_label)}</div>` : ''}
            <div class="protest-endorse-btn${canEndorse ? '' : ' disabled'}" onclick="window._protestEndorse()">${endorseLabel}</div>
        </div>`;
    }

    // Normal state
    const borderColor = isSel ? '#d9534f' : ok ? 'rgba(217,83,79,0.55)' : 'var(--dtext-3)';
    const bgStyle = isSel ? 'background:rgba(217,83,79,0.07);' : '';
    const borderStyle = isSel ? 'border-color:rgba(217,83,79,0.2);' : '';
    const nameColor = isSel ? '#e06460' : 'var(--dtext-0)';
    return `<div class="ca-item ca-item--protest${isSel ? ' selected' : ''}${!ok ? ' disabled' : ''}" data-action-id="protest" style="border-left-color:${borderColor};${bgStyle}${borderStyle}${!ok ? 'opacity:0.35;' : ''}">
        <div class="ca-item-head">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="ca-item-icon" style="color:#d9534f">!</span>
                <span class="ca-item-name" style="color:${nameColor}">${escapeHtml(act.name)}</span>
            </div>
            <span class="ca-item-ap" style="color:#d9534f"></span>
        </div>
        ${isSel ? `<div class="ca-item-desc">${escapeHtml(act.desc)}</div>` : ''}
    </div>`;
}

// ── Protest Config Panel (right panel) ──

function renderProtestConfig(nation, tick) {
    let html = '';

    // Warning bar
    html += `<div class="protest-warning">Turnout is probabilistic — based on Unrest and Public Approval. A fizzle hands the government a free headline. Choose your moment.</div>`;

    // Live stat hint pills (Phase 8.5.1: civil_unrest/terrorism/political_violence
    // collapsed into unrest; happiness/polarization deleted with no replacement).
    const stats = [
        { key: 'unrest', label: 'UNREST', value: nation.unrest || 0 },
        { key: 'public_approval', label: 'PUBLIC APPROVAL', value: nation.public_approval || 0 },
    ];
    html += `<div class="protest-stat-hints">`;
    for (const s of stats) {
        const color = getStatHintColor(s.key, s.value);
        html += `<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">${s.label}</span>
            <span class="protest-stat-pill__value" style="color:${color}">${Math.round(s.value)}</span>
        </div>`;
    }
    // Protest fatigue pill (loaded async, placeholder)
    const fatigueLevel = _protestCachedStats?._fatigueLevel || { label: '...', color: '#4a4840' };
    html += `<div class="protest-stat-pill">
        <span class="protest-stat-pill__label">PROTEST FATIGUE</span>
        <span class="protest-stat-pill__value" style="color:${fatigueLevel.color}">${fatigueLevel.label}</span>
    </div>`;
    // Potential endorsers pill
    const oppositionPartyCount = (_currentAllParties || []).filter(p => {
        if (p.id === _currentFaction?.id) return false;
        if (_caIsGoverning) return false;
        return true; // other parties that could potentially endorse
    }).length;
    if (oppositionPartyCount > 0) {
        const endorseColor = oppositionPartyCount >= 2 ? '#a78bfa' : '#4a4840';
        html += `<div class="protest-stat-pill">
            <span class="protest-stat-pill__label">ENDORSERS</span>
            <span class="protest-stat-pill__value" style="color:${endorseColor}">${oppositionPartyCount}</span>
        </div>`;
    }
    html += `</div>`;

    // Grievance type tabs
    // Crisis sunset (Phase 3): 'activeCrisis' tab dropped along with
    // renderProtestCrisisTargets.
    const tabs = [
        { id: 'minister', label: 'Minister' },
        { id: 'statFailure', label: 'Stat Failure' },
    ];
    html += `<div class="protest-tabs">`;
    for (const tab of tabs) {
        html += `<div class="protest-tab${_protestTab === tab.id ? ' active' : ''}" data-protest-tab="${tab.id}">${tab.label}</div>`;
    }
    html += `</div>`;

    // Target list based on active tab
    html += `<div class="protest-target-list" id="protest-target-list">`;
    if (_protestTab === 'minister') {
        html += renderProtestMinisterTargets();
    } else if (_protestTab === 'statFailure') {
        html += renderProtestStatTargets(nation, tick);
    }
    html += `</div>`;

    // Confirm bar
    const targetLabel = _protestTarget?.label || null;
    html += `<div class="protest-confirm">`;
    html += `<div class="protest-confirm__note">${targetLabel ? `Targeting: ${escapeHtml(targetLabel)}` : 'Select a target above'}</div>`;
    // Button rendered by the parent renderCampaignUI confirm logic
    html += `</div>`;

    return html;
}

function renderProtestMinisterTargets() {
    const ministers = _protestCachedMinisters;
    if (!ministers) return `<div class="protest-empty">Loading ministers...</div>`;
    if (ministers.length === 0) return `<div class="protest-empty">No government ministers found.</div>`;

    let html = '';
    for (const m of ministers) {
        const approval = Math.round(m.minister_approval || 50);
        const colorClass = approval > 50 ? 'high' : approval >= 35 ? 'mid' : 'low';
        const isSel = _protestTarget?.id === m.ministry_key;
        const targetData = JSON.stringify({
            id: m.ministry_key,
            type: 'minister',
            label: `${m.minister_first_name || ''} ${m.minister_last_name || ''}`.trim() || m.ministry_key,
            demandLabel: `${(m.minister_first_name || '') + ' ' + (m.minister_last_name || '')} must resign.`.trim(),
            grievanceData: { ministryKey: m.ministry_key, approval, name: `${m.minister_first_name || ''} ${m.minister_last_name || ''}`.trim() },
        }).replace(/"/g, '&quot;');

        html += `<div class="protest-target${isSel ? ' selected' : ''}" data-protest-target="${targetData}">
            <div>
                <div class="protest-target__name">${escapeHtml(`${m.minister_first_name || ''} ${m.minister_last_name || ''}`.trim() || m.ministry_key)}</div>
                <div class="protest-target__meta">${escapeHtml(m.ministry_key)}</div>
            </div>
            <span class="protest-target__value protest-target__value--${colorClass}">${approval}%</span>
        </div>`;
    }
    return html;
}

// Crisis sunset (Phase 3): renderProtestCrisisTargets removed (Active
// Crisis protest target tab is gone).

function renderProtestStatTargets(nation, tick) {
    const stats = _protestCachedStats?.failingStats;
    if (!stats) return `<div class="protest-empty">Loading stats...</div>`;
    if (stats.length === 0) return `<div class="protest-empty">No stats are bad enough to protest. Stats must be critically failing (\u226570 for negative stats, \u226430 for positive stats).</div>`;

    let html = '';
    for (const s of stats) {
        const isSel = _protestTarget?.id === s.key;
        const arrow = isHigherIsBad(s.key) ? '&#9650;' : '&#9660;';
        const targetData = JSON.stringify({
            id: s.key,
            type: 'statFailure',
            label: s.displayName,
            demandLabel: `The government must address ${s.displayName}.`,
            grievanceData: { statKey: s.key, failureScore: s.failureScore, current: s.current },
        }).replace(/"/g, '&quot;');

        html += `<div class="protest-target${isSel ? ' selected' : ''}" data-protest-target="${targetData}">
            <div>
                <div class="protest-target__name">${escapeHtml(s.displayName)}</div>
                <div class="protest-target__meta">${Math.round(s.current)} <span class="protest-target__delta" style="color:#d9534f">${arrow} ${Math.abs(s.delta).toFixed(1)}</span></div>
            </div>
            <span class="protest-target__value protest-target__value--low">${s.failureScore.toFixed(1)}</span>
        </div>`;
    }
    return html;
}

function renderActionResult(result) {
    if (!result) return '';
    const isPositive = !result.error && result.success;
    const color = isPositive ? '#4ade80' : '#ef4444';

    let html = `<div class="ca-result-box" style="border-color:${color}33">`;
    html += `<div class="ca-result-header" style="background:${color}08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:${color}">${escapeHtml(result.headline || (isPositive ? 'Action completed' : 'Action failed'))}</span>
        <span class="ca-result-dismiss" id="ca-dismiss-result">Dismiss</span>
    </div>`;
    html += `<div class="ca-result-body">`;

    if (result.effects && result.effects.length > 0) {
        for (const e of result.effects) {
            const label = e.bloc || e.label || e.stat || '';
            const val = e.value ?? e.delta ?? 0;
            const vColor = val >= 0 ? '#4ade80' : '#ef4444';
            html += `<div class="ca-result-row">
                <span class="ca-result-label">${escapeHtml(label)}</span>
                <span class="ca-result-val" style="color:${vColor}">${val >= 0 ? '+' : ''}${val}</span>
            </div>`;
        }
    }
    if (result.blocEffects && result.blocEffects.length > 0) {
        for (const e of result.blocEffects) {
            html += `<div class="ca-result-row">
                <span class="ca-result-label">${escapeHtml(e.blocName)}</span>
                <span class="ca-result-val" style="color:#4ade80">+${e.delta}</span>
            </div>`;
        }
    }
    if (result.outcomeName) {
        html += `<div class="ca-result-row">
            <span class="ca-result-label">Outcome</span>
            <span class="ca-result-val" style="color:${color}">${escapeHtml(result.outcomeName)}</span>
        </div>`;
    }
    html += `</div></div>`;
    return html;
}

function renderProtestResultPanel(protestData) {
    const tier = protestData.tier || 0;
    const tierLabel = getTierLabel(tier).toUpperCase();
    const rb = protestData.roll_breakdown || {};
    const score = protestData.condition_score ?? protestData.turnout_score ?? 0;
    const endorseCount = rb.endorsements || 0;
    const jointBonus = rb.joint_bonus || 0;
    const effects = protestData.effects_applied || [];

    let html = `<div class="ca-result-box" style="border-color:#5cb85c33">`;
    html += `<div class="ca-result-header" style="background:#5cb85c08">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:#5cb85c">Protest Result — Tier ${tier}</span>
    </div>`;
    html += `<div class="ca-result-body">`;

    // Tier label
    html += `<div class="ca-result-row">
        <span class="ca-result-label">Outcome</span>
        <span class="ca-result-val" style="color:#5cb85c">${tierLabel}</span>
    </div>`;

    // Condition score
    html += `<div class="ca-result-row">
        <span class="ca-result-label">Condition Score</span>
        <span class="ca-result-val" style="color:var(--dtext-1)">${Math.round(score)}</span>
    </div>`;

    // Roll breakdown
    if (Object.keys(rb).length > 0) {
        html += `<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Score Breakdown</div>`;
        const skipKeys = new Set(['endorsements', 'joint_bonus']);
        for (const [key, val] of Object.entries(rb)) {
            if (skipKeys.has(key)) continue;
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const numVal = Number(val);
            const vColor = numVal >= 0 ? '#4ade80' : '#ef4444';
            html += `<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${escapeHtml(label)}</span>
                <span class="ca-result-val" style="color:${vColor};font-size:10px">${numVal >= 0 ? '+' : ''}${numVal.toFixed(1)}</span>
            </div>`;
        }
        html += `</div>`;
    }

    // Endorsements
    if (endorseCount > 0) {
        html += `<div class="protest-endorse-breakdown">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#a78bfa;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:2px">Coalition Support</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-1)">${endorseCount} party endorsement${endorseCount > 1 ? 's' : ''} — +${jointBonus} bonus</div>
        </div>`;
    }

    // Effects applied
    const statEffects = effects.filter(e => e.stat && e.stat !== 'electoral_wound');
    if (statEffects.length > 0) {
        html += `<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Effects on Nation</div>`;
        for (const e of statEffects) {
            const label = (e.stat || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const delta = Number(e.delta || e.value || 0);
            const vColor = delta >= 0 ? '#4ade80' : '#ef4444';
            html += `<div class="ca-result-row">
                <span class="ca-result-label" style="font-size:10px">${escapeHtml(label)}</span>
                <span class="ca-result-val" style="color:${vColor};font-size:10px">${delta >= 0 ? '+' : ''}${delta}</span>
            </div>`;
        }
        html += `</div>`;
    }

    html += `</div></div>`;
    return html;
}

function renderProtestResolvingPanel() {
    const data = _protestActiveData;
    let html = `<div class="ca-result-box" style="border-color:rgba(217,83,79,0.3)">`;
    html += `<div class="ca-result-header" style="background:rgba(217,83,79,0.06)">
        <span style="font-family:var(--dfont-ui);font-size:14px;font-weight:700;color:#d9534f">Protest Resolving...</span>
    </div>`;
    html += `<div class="ca-result-body">`;
    html += `<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);line-height:1.8">
        Your protest has been called and is gathering momentum. The turnout will be determined at the next tick based on national conditions.
    </div>`;

    if (data) {
        if (data.grievance_type) {
            const typeLabel = data.grievance_type === 'minister' ? 'Minister' : data.grievance_type === 'activeCrisis' ? 'Active Crisis' : data.grievance_type === 'activePolicy' ? 'Active Policy' : 'Stat Failure';
            html += `<div class="ca-result-row" style="margin-top:8px">
                <span class="ca-result-label">Grievance</span>
                <span class="ca-result-val" style="color:#f97316">${typeLabel}</span>
            </div>`;
        }
        if (data.demand_label) {
            html += `<div class="ca-result-row">
                <span class="ca-result-label">Demand</span>
                <span class="ca-result-val" style="color:#a78bfa">${escapeHtml(data.demand_label)}</span>
            </div>`;
        }
    }

    html += `<div style="font-family:var(--dfont-mono);font-size:9px;color:var(--dtext-3);margin-top:12px;font-style:italic">
        Other opposition parties can endorse this protest during this tick to boost turnout (+15 per endorsement).
    </div>`;
    html += `</div></div>`;
    return html;
}

// ── Wire up config panel interactions ──

function wireCampaignConfig(container, f, n, otherParties, tick, protestCheck, protestApCost) {
    const rerender = () => renderCampaignUI(container, f, n, otherParties, tick, protestCheck, protestApCost);

    // Rival selection (attack)
    container.querySelectorAll('[data-rival-id]').forEach(el => {
        el.addEventListener('click', async () => {
            const rivalId = el.dataset.rivalId;
            if (_caRival === rivalId) return;
            _caRival = rivalId;
            _caVector = null;

            _caAttackVectors = null;
            rerender();

            // Load evidence asynchronously
            const evidence = await gatherAttackEvidence(_supabase, rivalId, n.id, tick);

            _caAttackVectors = buildAttackVectors(evidence);
            rerender();
        });
    });

    // Vector selection (attack)
    container.querySelectorAll('[data-vector-id]').forEach(el => {
        el.addEventListener('click', () => {
            if (el.classList.contains('disabled')) return;
            _caVector = _caVector === el.dataset.vectorId ? null : el.dataset.vectorId;
            rerender();
        });
    });

    // Dismiss result
    const dismissBtn = container.querySelector('#ca-dismiss-result');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            _caResult = null;
            rerender();
        });
    }

    // Protest: load data when first visible (only if not already cached or loading)
    if (_caSelected === 'protest' && !_caResult && !_protestCachedMinisters && !_protestLoading) {
        _protestLoading = true;
        loadProtestData(n, f, tick).then(() => {
            _protestLoading = false;
            rerender();
        }).catch(err => {
            console.error('[Protest] loadProtestData failed:', err);
            _protestLoading = false;
            _protestCachedMinisters = _protestCachedMinisters || [];
            _protestCachedStats = _protestCachedStats || { failingStats: [], _fatigueLevel: { label: '—', color: '#4a4840' } };
            rerender();
        });
    }

    // Protest tab selection
    container.querySelectorAll('[data-protest-tab]').forEach(el => {
        el.addEventListener('click', () => {
            _protestTab = el.dataset.protestTab;
            _protestTarget = null;
            rerender();
        });
    });

    // Protest target selection
    container.querySelectorAll('[data-protest-target]').forEach(el => {
        el.addEventListener('click', () => {
            const targetData = el.dataset.protestTarget;
            try {
                const parsed = JSON.parse(targetData);
                _protestTarget = _protestTarget?.id === parsed.id ? null : parsed;
            } catch (e) {
                _protestTarget = null;
            }
            rerender();
        });
    });

    // Confirm button
    const confirmBtn = container.querySelector('#ca-confirm-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (confirmBtn.classList.contains('disabled')) return;
            confirmBtn.classList.add('disabled');
            handleCampaignConfirm(container, f, n, otherParties, tick);
        });
    }
}

// ── Protest Endorse & Call-Off handlers ──

let _protestEndorseLock = false;
window._protestEndorse = async function() {
    if (_protestEndorseLock) return;
    if (!_endorseableProtest || _alreadyEndorsed) return;
    if (!confirm('Endorse this protest? Boosts turnout (+15).')) return;
    _protestEndorseLock = true;
    try {
        const result = await endorseProtest(_supabase, _currentFaction.id, _currentNation.id, _endorseableProtest.id, _currentShard.current_tick);
        if (!result.success) {
            _showToast(result.error || 'Endorsement failed.');
            return;
        }
        _alreadyEndorsed = true;
        await refreshAP(_currentFaction.id);
        await renderDemocracyActions(_currentNation, _currentFaction, _currentShard, _currentAllParties);
    } catch (err) {
        console.error('[Protest] Endorse failed:', err);
        _showToast('Endorsement failed: ' + err.message);
    } finally {
        _protestEndorseLock = false;
    }
};

let _protestCallOffLock = false;
window._protestCallOff = async function() {
    if (_protestCallOffLock) return;
    if (!_protestActiveData) return;
    if (_protestActiveData.tier === 7) { _showToast('Tier 7 protests cannot be called off.'); return; }
    if (!confirm('Call off this protest? A small approval boost from moderate blocs will be applied.')) return;
    _protestCallOffLock = true;
    try {
        const result = await callOffProtest(_supabase, _currentFaction.id, _protestActiveData.id, _currentShard.current_tick);
        if (!result.success) {
            _showToast(result.error || 'Call-off failed.');
            return;
        }
        await refreshAP(_currentFaction.id);
        await renderDemocracyActions(_currentNation, _currentFaction, _currentShard, _currentAllParties);
    } catch (err) {
        console.error('[Protest] Call-off failed:', err);
        _showToast('Call-off failed: ' + err.message);
    } finally {
        _protestCallOffLock = false;
    }
};

// ── Confirm handler ──

async function handleCampaignConfirm(container, f, n, otherParties, tick) {
    // Protest is not in CA_ACTIONS (added dynamically for opposition only);
    // look it up separately so the confirm handler can reach the protest branch.
    const sel = CA_ACTIONS.find(a => a.id === _caSelected)
        || (_caSelected === 'protest' ? { id: 'protest', name: 'Organise a Protest', color: '#d9534f' } : null);
    if (!sel) return;
    const cost = caGetCost();
    const isMoneyAct = !!sel.money;
    const confirmLabel = isMoneyAct ? `Confirm — ${formatCurrencyShort(cost)}` : 'Confirm';
    const affordable = isMoneyAct ? (f.party_funds || 0) >= cost : true;
    if (!affordable || !caIsReady()) return;

    const btn = document.getElementById('ca-confirm-btn');
    if (btn) { btn.classList.add('disabled'); btn.textContent = 'EXECUTING...'; }

    let result;
    try {
        if (sel.id === 'attack') {
            result = await executeAttack(_supabase, f.id, n.id, _caRival, _caVector, tick);
        } else if (sel.id === 'protest') {
            if (!_protestTarget) return;
            const grievanceData = _protestTarget.grievanceData || {};
            const demandLabel = _protestTarget.demandLabel || '';
            result = await executeProtest(_supabase, f.id, n.id, _protestTarget.type, grievanceData, demandLabel, tick);
        } else if (sel.id === 'press_conference') {
            // Press Conference: base -2 to +2 momentum, +1 if opposition, +2 if gov with approval >= 40
            let baseRoll = Math.floor(Math.random() * 5) - 2; // -2 to +2
            if (!_caIsGoverning) baseRoll += 1; // opposition bonus
            else if ((n.gov_approval || 0) >= 40) baseRoll += 2; // government with decent approval
            // Diminishing returns: reduce effect by 25% per escalation level (min 25% of original)
            if ((_caPressEscalation || 0) > 0 && baseRoll !== 0) {
                const rollSign = baseRoll > 0 ? 1 : -1;
                const diminish = Math.max(0.25, 1 - _caPressEscalation * 0.25);
                baseRoll = Math.round(baseRoll * diminish);
                if (baseRoll === 0) baseRoll = rollSign;
            }
            // Give momentum via atomic RPC (3-pillar system) — label+tick for log
            const sign = baseRoll >= 0 ? '+' : '';
            const { error: momErr } = await _supabase.rpc('adjust_momentum', {
                p_faction_id: f.id, p_delta: baseRoll,
                p_label: `Press Conference (${sign}${baseRoll})`, p_tick: tick
            });
            if (momErr) console.warn('[PressConference] Momentum RPC failed:', momErr.message);
            await _supabase.from('campaign_actions').insert({
                party_id: f.id, nation_id: n.id, action_type: 'press_conference',
                tick_performed: tick, result: { momentumDelta: baseRoll }
            });
            result = { success: true, headline: 'Press Conference',
                effects: [{ label: 'Press Coverage', value: `${sign}${baseRoll}` }],
                outcomeName: `Press conference — ${sign}${baseRoll} momentum` };
        }
    } catch (err) {
        console.error('Campaign action error:', err);
        _showToast('Action failed: ' + err.message);
        if (btn) { btn.classList.remove('disabled'); btn.textContent = confirmLabel; }
        return;
    }

    if (!result || !result.success) {
        _showToast(result?.message || result?.error || 'Action failed.');
        if (btn) { btn.classList.remove('disabled'); btn.textContent = confirmLabel; }
        return;
    }

    // Update local cost resource and refresh from server
    if (isMoneyAct) {
        f.party_funds = result.newFunds ?? ((f.party_funds ?? 0) - cost);
    } else {
        await refreshAP(f.id);
    }

    // Show result
    _caResult = result;

    // Re-render
    await renderDemocracyActions(n, f, _currentShard, _currentAllParties);
}


/* ═══════════════════════════════════════════════════════════════════
   OTHER PARTIES TAB — Rival party intelligence cards
   ═══════════════════════════════════════════════════════════════════ */

async function renderOtherPartiesTab(playerFaction, nation, allParties, coalition, totalSeats) {
    const container = document.getElementById('other-parties-container');
    if (!container) return;

    const rivals = (allParties || []).filter(p => p.id !== playerFaction.id);
    if (rivals.length === 0) {
        container.innerHTML = '<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No rival parties found.</div>';
        return;
    }

    const blocMap = await loadBlocMap(nation.id);

    const factionDataMap = toMap(rivals);

    const coalitionPartyIds = (coalition && coalition.party_ids) ? coalition.party_ids : [];
    const coalitionLeadId = coalition ? coalition.lead_party_id : null;

    // Fetch sectors + popularity for stronghold chips on each rival card
    const rivalIds = rivals.map(r => r.id);
    const [sectorsRes, popRes] = await Promise.all([
        _supabase.from('sectors')
            .select('id, sector_key, name, weight, base_turnout, is_active')
            .eq('nation_id', nation.id)
            .eq('is_active', true),
        rivalIds.length > 0
            ? _supabase.from('faction_sector_popularity')
                .select('faction_id, sector_id, popularity')
                .in('faction_id', rivalIds)
            : Promise.resolve({ data: [] }),
    ]);
    const _sectors = sectorsRes.data || [];
    const _pop = popRes.data || [];

    const partyCards = rivals.map(p => {
        const fd = factionDataMap[p.id] || {};
        const leaderName = (fd.leader_first_name && fd.leader_last_name)
            ? fd.leader_first_name + ' ' + fd.leader_last_name
            : 'Vacant';
        const leaderAge = fd.leader_age || null;
        const voteShare = Number(p.national_vote_share || 0);

        let status = 'opposition';
        if (coalitionPartyIds.includes(p.id)) {
            status = p.id === coalitionLeadId ? 'governing_head' : 'governing_junior';
        }
        const isAbsMonarchy = (nation?.government_type || '').toLowerCase().includes('absolute');
        if (isAbsMonarchy && nation?.monarch_faction_id === p.id) {
            const majorityThreshold = Math.floor((totalSeats || 100) / 2) + 1;
            if ((p.seats || 0) >= majorityThreshold) status = 'governing_head';
        }

        return {
            id: p.id,
            name: p.faction_name || 'Unknown',
            abbreviation: p.abbreviation || '??',
            color: p.party_color || '#888',
            customLogoUrl: p.custom_logo_url || null,
            partyLogo: p.party_logo || null,
            description: p.party_description || '',
            status,
            blocId: p.bloc_id || null,
            foundedTick: fd.founded_tick,
            leaderName,
            leaderAge,
            seats: p.seats || 0,
            totalSeats,
            voteShare,
            strongholds: getStrongholdSectors(p.id, _sectors, _pop, 3),
        };
    });

    let currentSort = 'seats';
    const sortFns = {
        seats:      (a, b) => b.seats - a.seats,
        vote_share: (a, b) => b.voteShare - a.voteShare,
    };

    function renderGrid() {
        const sorted = [...partyCards].sort(sortFns[currentSort]);
        const gridHtml = sorted.map(p => renderPartyCard(p, nation, blocMap)).join('');

        container.innerHTML = `
        <div class="op-top">
            <div class="op-top-left">
                <div class="op-title">Rival Parties — ${escapeHtml(nation.name)}</div>
            </div>
            <div class="op-sort-row">
                <span class="op-sort-label">Sort by</span>
                <button class="op-sort-btn${currentSort === 'seats' ? ' active' : ''}" data-op-sort="seats">Seats</button>
                <button class="op-sort-btn${currentSort === 'vote_share' ? ' active' : ''}" data-op-sort="vote_share">Vote Share</button>
            </div>
        </div>
        <div class="op-grid">${gridHtml}</div>`;

        container.querySelectorAll('.op-sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentSort = btn.getAttribute('data-op-sort');
                renderGrid();
            });
        });
    }

    renderGrid();
}

function renderPartyCard(party, nation, blocMap) {
    const c = party.color;
    const cFaint = hexToRgba(c, 0.12);
    const cBorder = hexToRgba(c, 0.35);
    const cHalf = hexToRgba(c, 0.5);
    const cLight = hexToRgba(c, 0.2);
    const cGlow = hexToRgba(c, 0.06);

    // Party logo (custom image or icon SVG)
    const logoHtml = getPartyLogoHTML({ customLogoUrl: party.customLogoUrl, iconKey: party.partyLogo, size: 32, color: c });

    // Status badge
    let statusLabel, statusCls;
    if (party.status === 'governing_head') { statusLabel = 'GOVERNING — HEAD'; statusCls = 'op-badge-green'; }
    else if (party.status === 'governing_junior') { statusLabel = 'GOVERNING — JUNIOR'; statusCls = 'op-badge-green'; }
    else { statusLabel = 'OPPOSITION'; statusCls = 'op-badge-red'; }

    const blocChip = blocTagHtml(party.blocId, blocMap);

    // Founded
    const founded = party.foundedTick != null ? tickToDate(party.foundedTick) : null;
    const foundedBadge = founded ? `<span class="op-badge op-badge-party" style="color:${c};border-color:${cBorder};font-size:12px">Est. ${escapeHtml(founded)}</span>` : '';

    // Leader badge
    const leaderBadge = `<span class="op-badge op-badge-party" style="color:${c};border-color:${cBorder};font-size:12px">Leader: ${escapeHtml(party.leaderName)}${party.leaderAge ? ' (' + party.leaderAge + ')' : ''}</span>`;

    // Party description
    const descHtml = party.description
        ? `<div class="op-desc" style="font-size:13px;line-height:1.6">${escapeHtml(party.description)}</div>`
        : '';

    const voteShareDisp = (party.voteShare || 0).toFixed(1);

    return `
    <div class="op-card" style="background:linear-gradient(135deg, ${cGlow} 0%, var(--dbg-2) 40%);border-color:${cBorder}">
        <div class="op-card-hdr" style="border-bottom-color:${cBorder}">
            <div class="op-logo-wrap" style="background:${cFaint};border:1px solid ${cBorder};border-radius:6px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">${logoHtml}</div>
            <div class="op-hdr-info">
                <div class="op-name" style="color:${c}">${escapeHtml(party.name)}</div>
                <div class="op-meta">
                    <span class="op-badge ${statusCls}">${statusLabel}</span>
                    ${foundedBadge}
                    ${leaderBadge}
                </div>
                ${blocChip ? `<div style="margin-top:4px;">${blocChip}</div>` : ''}
            </div>
        </div>
        ${descHtml}
        <div class="op-body">
            <div class="op-col-left">
                <div class="op-sec-label">Party Stats</div>
                <div class="op-stat-row">
                    <span class="op-sr-label">Seats</span>
                    <span class="op-sr-val" style="color:${c}">${party.seats} <span style="color:var(--dtext-3);font-size:9px;font-weight:400">/ ${party.totalSeats}</span></span>
                </div>
                <div class="op-stat-row">
                    <span class="op-sr-label">Vote Share</span>
                    <span class="op-sr-val" style="color:${c}">${voteShareDisp}%</span>
                </div>
                ${(party.strongholds || []).length > 0 ? `
                <div class="op-sec-label" style="margin-top:10px">Strongholds</div>
                <div style="display:flex;flex-wrap:wrap;gap:4px">${
                    party.strongholds.map(s => `<span style="font-family:var(--dfont-mono);font-size:9px;padding:2px 6px;border:1px solid ${c}44;background:${c}10;color:var(--dtext-1);white-space:nowrap;">${escapeHtml(s.name || s.sector_key)}</span>`).join('')
                }</div>` : ''}
            </div>
        </div>
    </div>`;
}

/** Convert hex color to rgba string */
function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16) || 0;
    const g = parseInt(h.substring(2, 4), 16) || 0;
    const b = parseInt(h.substring(4, 6), 16) || 0;
    return `rgba(${r},${g},${b},${alpha})`;
}

// ==================== ELECTIONS TAB ====================

async function renderElectionsTab(faction, currentTick, nextElection) {
    const container = document.getElementById('elections-container');
    if (!container) return;

    try {

    // --- Momentum Box ---
    // Momentum score (0-100) from factions table, decays 8%/tick, reset after elections.
    const momentum = Number(faction.momentum ?? 0);
    const momentumDecayRate = 0.08;
    const decayPerTick = (momentum * momentumDecayRate).toFixed(1);
    const momColor = momentum >= 60 ? 'var(--dgreen)' : momentum >= 30 ? 'var(--damber)' : 'var(--dred)';
    const momBarWidth = Math.min(100, Math.max(0, momentum));

    // Next election countdown
    const electionTick = nextElection?.election_tick || 0;
    const ticksUntilElection = electionTick > currentTick ? electionTick - currentTick : null;

    // Momentum event log — read from faction.momentum_log if available (array of { label, delta, tick })
    const momentumLog = Array.isArray(faction.momentum_log) ? faction.momentum_log : [];
    const logRowsHtml = momentumLog.length > 0
        ? momentumLog.slice(0, 30).map(entry => {
            const ticksAgo = currentTick - (entry.tick || 0);
            const color = entry.delta > 0 ? 'var(--dgreen)' : 'var(--dred)';
            const sign = entry.delta > 0 ? '+' : '';
            return `<div class="elec-mom-log-row">
                <span class="elec-mom-log-label">${escapeHtml(entry.label || 'Event')}</span>
                <span class="elec-mom-log-delta" style="color:${color}">${sign}${entry.delta}</span>
                <span class="elec-mom-log-ago">${ticksAgo}t ago</span>
            </div>`;
        }).join('')
        : '<div style="color:var(--dtext-3);font-size:11px;padding:10px">No momentum events yet.</div>';

    const momentumBox = `
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="elec-box-title">Momentum</span>
        </div>
        <div class="elec-box-body elec-mom-body">
            <div class="elec-mom-score-row">
                <div class="elec-mom-score">
                    <span class="elec-mom-value" style="color:${momColor}">${Math.round(momentum)}</span>
                    <span class="elec-mom-max">/ 100</span>
                </div>
            </div>
            <div class="elec-mom-bar-wrap">
                <div class="elec-mom-bar" style="width:${momBarWidth}%;background:${momColor}"></div>
            </div>
            <div class="elec-mom-decay">Decays 8%/tick — currently losing ${decayPerTick}/tick</div>
            ${faction.custom_logo_url ? `<div class="elec-mom-decay" style="color:var(--dgreen);margin-top:-4px;">+1/tick from party logo</div>` : ''}
            <div class="elec-mom-log-header">Recent Activity</div>
            <div class="elec-mom-log">
                ${logRowsHtml}
            </div>
            ${ticksUntilElection ? `<div class="elec-mom-election">Next election in ${ticksUntilElection} tick${ticksUntilElection !== 1 ? 's' : ''}</div>` : ''}
        </div>
    </div>`;

    // --- What Is Momentum Box ---
    const whatIsMomentumBox = `
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--amber"></div>
            <span class="elec-box-title">What Is Momentum?</span>
        </div>
        <div class="elec-box-body elec-explainer">
            <p><strong>Momentum</strong> measures your party's political energy — how active, visible, and engaged you are with the electorate. It accounts for 30% of election outcomes.</p>
            <p>Momentum is a score from 0 to 100 that <strong>decays 8% per tick</strong>. If you stop acting, it fades. Sustained activity keeps it high. It resets to 0 after every election.</p>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Legislation:</div>
                <ul>
                    <li><strong>Sponsoring a bill:</strong> +2 momentum for the sponsoring party.</li>
                    <li><strong>Bill passes:</strong> YES voters get +2 momentum per policy article.</li>
                    <li><strong>Bill fails:</strong> YES voters lose -2 per article. NO voters gain +2 per article.</li>
                    <li>Text-only articles do not count. Abstaining gives nothing.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Campaign Actions:</div>
                <ul>
                    <li><strong>Rally</strong> — Spend party funds to shift your popularity in one voter sector.</li>
                    <li>Other campaign actions like stances, public addresses, and media campaigns also contribute.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Crisis Resolution:</div>
                <ul>
                    <li>When a national crisis is resolved, <strong>all governing coalition parties receive +8 momentum</strong>.</li>
                    <li>This rewards the government for managing the crisis — even if the resolution was automatic.</li>
                    <li>The government also receives a 1-6 approval boost alongside the momentum.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Vote Locking:</div>
                <p>Once you vote YES or NO on a bill, you cannot flip to the opposite — only change to Abstain. Choose carefully.</p>
            </div>
        </div>
    </div>`;

    container.innerHTML = `
    <div class="elec-page">
        <div class="elec-row">
            ${momentumBox}
            ${whatIsMomentumBox}
        </div>
    </div>`;

    } catch (e) {
        console.error('[Elections Tab] Render error:', e);
        container.innerHTML = '<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">Failed to load election data. Please refresh.</div>';
    }
}

