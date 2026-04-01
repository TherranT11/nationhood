import { _supabase } from './supabase-client.js';
import { initPage, refreshAP } from './common.js';
import './guide.js';
import { getPartyIconSVG, getPartyLogoHTML, PARTY_ICONS, PARTY_COLOR_PALETTE } from './party-icons.js';
import { tickToDate } from './utils.js';

import { fetchActiveCoalition, loadSeats, isPresidentialRepublic, initGameConfigForNation, RALLY_CONFIG, executeRally, ATTACK_CONFIG, ATTACK_OUTCOMES, getAttackOutcomeWeights, getAttackAPCost, gatherAttackEvidence, buildAttackVectors, executeAttack, MAKE_PROMISE_CONFIG, executeMakePromise, getPromiseableStats, disbandParty, getNationNames, IDEOLOGY_AXES, PROTEST_CONFIG, getProtestCost, getDecayedUseCount, getProtestFatigueLevel, getStatHintColor, canCallProtest, getStatFailureScore, isExcludedStat, isHigherIsBad, getTierLabel, executeProtest, endorseProtest, callOffProtest, executePublicAddress, switchPartyEndorsement, executeTakeStance, STANCE_CONFIG, ISSUE_DEFS, ISSUE_IDS, POLL_CONFIG, executePollNow, IDEO_SHIFT_CONFIG, executeFundThinkTank, executeMediaCampaign, executeGrassrootsMovement, suspendIdeologyAction, continueIdeologyAction, cancelIdeologyAction, executeIdeologicalPivot, PIVOT_CONFIG } from './game-common.js';
import { isGovernmentPresidential, getGovDisplayLabel } from './game/government-types.js';
import { computeEndorsementButtonState } from './ui/endorsement-ui.js';
import { statDirectionSign, NATION_STAT_COLUMNS } from './game/stats.js';
import { formatStatName } from './game/political-actions.js';
import { calculateIdeologyZones, bimodalAxisAlignment } from './game/electorate.js';
import { getElectabilityTier, getTraitAPModifier } from './game/party-leadership.js';

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
        .select('id, seats, national_vote_share, faction_name, abbreviation, party_color, standing, loyalty, last_seen_tick, leader_first_name, leader_last_name, custom_logo_url, party_logo, party_description, momentum, momentum_log')
        .eq('nation_id', nation.id)
        .eq('faction_type', 'party');

    // Fetch ideology scores for all parties
    const partyIds = (allParties || []).map(p => p.id);
    const { data: allPartyIdeologies } = partyIds.length > 0
        ? await _supabase
            .from('faction_ideology')
            .select('faction_id, liberty_equality, tradition_progress, security_freedom, globalism_nationalism, individualism_collectivism')
            .in('faction_id', partyIds)
        : { data: [] };

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

    // Fetch active crises
    const { data: activeCrises } = await _supabase
        .from('active_crises')
        .select('id, started_at_tick, crisis_templates(name, description)')
        .eq('nation_id', nation.id);

    // Fetch issue_state for electorate issues display
    const { data: issueStatesInit } = await _supabase
        .from('issue_state')
        .select('issue_id, salience')
        .eq('nation_id', nation.id);
    const issueStateMapInit = {};
    for (const is of (issueStatesInit || [])) issueStateMapInit[is.issue_id] = is;

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
        .select('id, faction_id, first_name, last_name, age, ideology, trait, trait_upside, trait_downside, elected_tick, term_ends_tick, is_active, terms_served')
        .eq('nation_id', nation.id)
        .eq('is_active', true)
        .order('elected_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Fetch current administration
    const { data: administration } = await _supabase
        .from('administrations')
        .select('id, admin_name, government_type, started_at_tick, president_name, president_party_id, president_party_name, stats_at_start')
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

    // Fetch active caucus factions for player's party
    const { data: caucusFactions } = await _supabase
        .from('caucus_factions')
        .select('id, name, dominant_axis, wing_end, seat_share, relationship_score')
        .eq('party_id', f.id)
        .eq('is_active', true);

    // Load current endorsement from party_endorsement_preferences
    const { data: currentEndorsement } = await _supabase
        .from('party_endorsement_preferences')
        .select('endorsed_party_id')
        .eq('endorsing_party_id', f.id)
        .maybeSingle();

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
        allPartyIdeologies,
        activeCrises,
        nextElection,
        prevApproval,
        lastParliamentary,
        lastPresidential,
        scheduledElections,
        president,
        administration,
        caucusFactions,
        currentEndorsement,
        issueStateMapInit,
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
        seatDelta, role, officerNames, allParties, allPartyIdeologies, coalition, activeCrises, currentTick,
        nextElection, prevApproval,
        lastParliamentary, lastPresidential, scheduledElections,
        president, administration,
        caucusFactions, currentEndorsement,
        issueStateMapInit,
    } = data;
    const faction = f; // alias for compatibility with sub-renderers

    const partyColor = f.party_color || '#ffcc00';
    const logoSvg = getPartyLogoHTML({ customLogoUrl: f.custom_logo_url, iconKey: f.party_logo, size: 36, color: partyColor });
    const founded = tickToDate(f.founded_tick);

    // Role badge
    const isGov = role.includes('Governing') || role.includes('Lead');
    const roleLabel = role.includes('Lead') ? 'Governing' : role;
    const roleCls = role === 'Strongman' ? 'pol-role-strongman' : isGov ? 'pol-role-gov' : 'pol-role-opp';

    // Ideology tags — dynamically computed from current axis scores (top 2 most extreme)
    const myIdeo = (allPartyIdeologies || []).find(r => r.faction_id === f.id);
    let ideo1 = null, ideo2 = null;
    if (myIdeo) {
        const ranked = IDEOLOGY_AXES
            .map(ax => ({ ax, score: myIdeo[ax.key] ?? 0 }))
            .sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
        if (ranked.length > 0 && ranked[0].score !== 0) ideo1 = ranked[0].score < 0 ? ranked[0].ax.left : ranked[0].ax.right;
        if (ranked.length > 1 && ranked[1].score !== 0) ideo2 = ranked[1].score < 0 ? ranked[1].ax.left : ranked[1].ax.right;
    }
    // Fallback to declared ideologies if no scores available
    if (!ideo1) ideo1 = f.ideology_value_1 || null;
    if (!ideo2) ideo2 = f.ideology_value_2 || null;

    function ideoTag(val) {
        if (!val) return '';
        const cls = 'pol-ideo-' + val.toLowerCase();
        const label = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        return `<div class="pol-ideo-box">
            <span class="pol-ideo-label">Ideology</span>
            <span class="pol-ideo-value ${cls}">${label}</span>
        </div>`;
    }

    // Leader
    let leaderName, leaderAge;
    leaderName = f.leader_first_name && f.leader_last_name
        ? f.leader_first_name + ' ' + f.leader_last_name
        : 'Vacant';
    leaderAge = f.leader_age ? `(${f.leader_age})` : '';
    // Leader's personal ideology (stored when appointed via Party Leadership), fall back to faction ideology
    const leaderIdeoValue = f.leader_ideology || ideo1;
    const leaderIdeo = leaderIdeoValue
        ? `<span class="pol-leader-ideo pol-ideo-${leaderIdeoValue.toLowerCase()}">${leaderIdeoValue.charAt(0).toUpperCase() + leaderIdeoValue.slice(1).toLowerCase()}</span>`
        : '';

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
                    <span class="pol-leader-badge">Leader: ${escapeHtml(leaderName)} ${leaderAge}</span>
                </div>
            </div>
        </div>
        <div class="pol-ideo-row">
            ${ideoTag(ideo1)}
            ${ideoTag(ideo2)}
        </div>
        <hr class="pol-divider">
        <div class="pol-leader-section">
            <div class="pol-leader-header">
                <span class="pol-sub-label">Leader</span>
                <button class="pol-leadership-btn" onclick="window.location.href='party-leadership.html'">Party Leadership &rarr;</button>
            </div>
            <div class="pol-leader-name">${escapeHtml(leaderName)} <span class="pol-leader-age">${leaderAge}</span> <span class="pol-leader-electability"><span class="pol-leader-electability-label">Electability: </span><span style="color:${electTier.color}">${electTier.label}</span></span></div>
            ${leaderIdeo}
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
        ${renderCaucusSection(caucusFactions, mySeats)}
        </div>
        </div>
        ${renderParliamentBox(allParties, coalition, nation, f.id)}
        ${renderForecastBox(allParties, totalSeats, currentTick, nextElection, null, f.id)}
        </div>

        <div class="pol-row-2">
        ${renderNationalMoodBox(nation, activeCrises, currentTick, issueStateMapInit)}
        <div class="pol-ideology-box" id="stance-summary-container">
            <div class="pol-ideo-header"><div class="pol-box-dot pol-box-dot--orange"></div><span class="pol-mod-title">Stances</span></div>
            <div class="pol-box-body"><div id="stance-summary-strip"></div></div>
        </div>
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

    const electorateTabBtn = '<button class="pol-page-tab" data-page-tab="electorate-spread">Electorate</button>';
    const electorateContent = `
    <div class="pol-page-content" data-page-content="electorate-spread">
        <div id="electorate-spread-container" class="es-page" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading electorate data...</div>
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
        ${electorateTabBtn}
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
    ${electorateContent}
    ${electionsContent}
    ${otherPartiesContent}`;

    document.getElementById('content-area').innerHTML = html;

    // Wire up page-level sub-tabs (Politics / Actions / Electorate / Other Parties / Elections)
    let actionsLoaded = false;
    let otherPartiesLoaded = false;
    let electorateSpreadLoaded = false;
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
            // Lazy-load Electorate Spread tab on first click
            if (target === 'electorate-spread' && !electorateSpreadLoaded) {
                electorateSpreadLoaded = true;
                renderElectorateSpreadTab(f, nation, allParties, allPartyIdeologies, currentTick);
            }
            // Lazy-load Other Parties tab on first click
            if (target === 'other-parties' && !otherPartiesLoaded) {
                otherPartiesLoaded = true;
                renderOtherPartiesTab(f, nation, allParties, allPartyIdeologies, coalition, totalSeats, currentTick);
            }
            // Lazy-load Elections tab on first click
            if (target === 'elections' && !electionsLoaded) {
                electionsLoaded = true;
                renderElectionsTab(nation, administration, coalition, f, allParties, allPartyIdeologies, currentTick, role, nextElection, caucusFactions, mySeats);
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
    // Load stance summary into the stance container
    _renderStanceSummaryStrip(f.id, nation.id);
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



async function _loadPartyEventsFeed(nationId, playerFactionId) {
    const feedEl = document.getElementById('party-events-feed');
    if (!feedEl) return;

    const { data: entries, error } = await _supabase
        .from('activity_log')
        .select('id, faction_id, action_type, action_label, description, outcome, ap_spent, tick, created_at')
        .eq('nation_id', nationId)
        .order('tick', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(80);

    if (error || !entries || entries.length === 0) {
        feedEl.innerHTML = '<div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:12px;padding:12px">No party events yet.</div>';
        return;
    }

    const factionIds = [...new Set(entries.map(e => e.faction_id))];
    const { data: factions } = await _supabase
        .from('factions')
        .select('id, faction_name, abbreviation, party_color')
        .in('id', factionIds);
    const factionMap = {};
    for (const f of (factions || [])) factionMap[f.id] = f;

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
                ${entry.ap_spent ? `<span class="pe-item-ap">${entry.ap_spent} AP</span>` : ''}
                ${entry.outcome ? `<span class="pe-item-outcome" style="color:${outcomeColor}">${escapeHtml(entry.outcome)}</span>` : ''}
            </div>
            ${entry.description ? `<div class="pe-item-desc">${escapeHtml(entry.description)}</div>` : ''}
        </div>`;
    }

    feedEl.innerHTML = html;
}

async function _loadGovCardPartyEvents(nationId, playerFactionId) {
    const feedEl = document.getElementById('gov-card-party-events');
    if (!feedEl) return;

    const { data: entries, error } = await _supabase
        .from('activity_log')
        .select('id, faction_id, action_type, action_label, description, outcome, ap_spent, tick, created_at')
        .eq('nation_id', nationId)
        .order('tick', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(40);

    if (error || !entries || entries.length === 0) {
        feedEl.innerHTML = '<div style="color:var(--dtext-3);font-family:var(--dfont-ui);font-size:11px">No party events yet.</div>';
        return;
    }

    const factionIds = [...new Set(entries.map(e => e.faction_id))];
    const { data: factions } = await _supabase
        .from('factions')
        .select('id, faction_name, abbreviation, party_color')
        .in('id', factionIds);
    const factionMap = {};
    for (const f of (factions || [])) factionMap[f.id] = f;

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
        </div>`;
    }

    feedEl.innerHTML = html;
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

function renderCaucusSection(caucusFactions, partySeats) {
    if (!caucusFactions || caucusFactions.length === 0) return '';

    const AXIS_LABELS = {
        liberty_equality: 'Liberty / Equality',
        tradition_progress: 'Tradition / Progress',
        security_freedom: 'Security / Freedom',
        globalism_nationalism: 'Globalism / Nationalism',
        individualism_collectivism: 'Individualism / Collectivism',
    };

    let rows = '';
    for (const cf of caucusFactions) {
        const approxSeats = Math.round(partySeats * cf.seat_share);
        const seatRange = `~${Math.max(1, approxSeats - 2)}–${approxSeats + 2}`;
        const relPct = cf.relationship_score;
        const relColor = relPct >= 60 ? 'var(--green)' : relPct >= 30 ? 'var(--amber)' : 'var(--red)';
        const volatile = relPct < 30 ? ' <span style="color:var(--red);font-size:0.7rem;">VOLATILE</span>' : '';

        rows += `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-dim);">
            <div>
                <div style="font-size:0.85rem;font-weight:500;">${escapeHtml(cf.name)}</div>
                <div style="font-size:0.75rem;color:var(--text-dim);">${AXIS_LABELS[cf.dominant_axis] || cf.dominant_axis} · ${seatRange} seats</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:60px;height:6px;background:var(--border-dim);border-radius:3px;overflow:hidden;">
                    <div style="width:${relPct}%;height:100%;background:${relColor};border-radius:3px;"></div>
                </div>
                ${volatile}
            </div>
        </div>`;
    }

    return `<hr class="pol-divider">
        <div style="padding:0 0 4px;">
            <div class="pol-sub-label" style="margin-bottom:6px;">Internal Caucuses</div>
            ${rows}
        </div>`;
}

function renderParliamentBox(allParties, coalition, nation, playerFactionId) {
    const parties = allParties || [];
    const totalSeats = parties.reduce((sum, p) => sum + (p.seats || 0), 0);
    const majority = Math.ceil(totalSeats / 2);
    let coalitionIds, leadPartyId;
    coalitionIds = new Set(coalition?.party_ids || []);
    leadPartyId = coalition?.lead_party_id || null;

    // Split into governing and opposition
    const governing = parties.filter(p => coalitionIds.has(p.id));
    const opposition = parties.filter(p => !coalitionIds.has(p.id));
    const govSeats = governing.reduce((sum, p) => sum + (p.seats || 0), 0);
    const oppSeats = opposition.reduce((sum, p) => sum + (p.seats || 0), 0);

    // Seat composition bar — sorted by seats desc
    const barParties = [...parties].sort((a, b) => (b.seats || 0) - (a.seats || 0));
    const segmentsHtml = totalSeats > 0
        ? barParties.map(p => {
            const pct = ((p.seats || 0) / totalSeats) * 100;
            if (pct <= 0) return '';
            const c = p.party_color || '#888';
            return `<div class="pol-seat-segment" style="width:${pct.toFixed(2)}%;background:${c}"></div>`;
        }).join('')
        : '';

    // Majority line position
    const majPct = totalSeats > 0 ? (majority / totalSeats) * 100 : 50;
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

// Ideology box removed — replaced by stance summary container in pol-row-2

function renderForecastBox(allParties, totalSeats, currentTick, nextElection, _unused, playerFactionId) {
    const FORECAST_START = 12;
    const MARGIN_START = 12;
    const INACTIVITY_EXCLUSION = 12;
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
        return { ...p, estSeats, momentum: Number(p.momentum ?? 0) };
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
        const momColor = p.momentum > 0 ? 'var(--dgreen)' : p.momentum < 0 ? 'var(--dred)' : 'var(--dtxt-muted)';
        const momArrow = p.momentum > 0 ? '▲' : p.momentum < 0 ? '▼' : '—';
        const momText = p.momentum !== 0 ? `${momArrow}${Math.abs(p.momentum)}` : momArrow;
        const majLinePct = totalSeats > 0 ? (majority / totalSeats) * 100 : 50;

        return `<div class="pol-fc-party">
            <div class="pol-fc-party-header">
                <div class="pol-fc-party-left">
                    <div class="pol-fc-party-dot" style="background:${color}"></div>
                    <span class="pol-fc-party-abbr" style="color:${color}">${escapeHtml(abbr)}</span>
                    ${isPlayer ? '<span class="pol-ideo-legend-you">YOU</span>' : ''}
                </div>
                <div class="pol-fc-party-right">
                    <span class="pol-fc-momentum" style="color:${momColor}">${momText}</span>
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

function renderNationalMoodBox(nation, activeCrises, currentTick, issueStateMap) {
    const crises = activeCrises || [];

    // Crises section
    let crisesHtml;
    if (crises.length === 0) {
        crisesHtml = '<div class="pol-mood-no-crises">No active crises</div>';
    } else {
        crisesHtml = crises.map(c => {
            const name = c.crisis_templates?.name || 'Unknown Crisis';
            const dur = currentTick - (c.started_at_tick || 0);
            return `<div class="pol-mood-crisis">
                <span class="pol-mood-crisis-name">${escapeHtml(name)}</span>
                <span class="pol-mood-crisis-dur">${dur}t</span>
            </div>`;
        }).join('');
    }

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
            ${crisesHtml}
            ${issuesHtml}
            </div>
        </div>`;
}



function renderGovCard(nation, coalition, allParties, currentTick, prevApproval, president, administration) {
    const isPres = isPresidentialRepublic(nation);
    const parties = allParties || [];
    const approval = Math.round(Number(nation.gov_approval ?? 40));
    const ac = approval >= 50 ? 'var(--dgreen)' : approval >= 35 ? 'var(--damber)' : 'var(--dred)';
    const adminName = administration?.admin_name || 'Government';
    const govTypeLabel = isPres ? 'Presidential' : nation?.hos_election_method === 'hereditary' ? 'Constitutional Monarchy' : 'Parliamentary';

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
    const ap    = f.action_points || 0;
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
                <span class="pol-id-ap-badge">AP: <span id="pol-id-ap-display">${ap}</span></span>
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
    const apDisplay    = document.getElementById('pol-id-ap-display');
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
            const { error: saveErr } = await _supabase.from('factions').update(updateData).eq('id', f.id);
            if (saveErr) { _showToast('Save failed: ' + saveErr.message); return; }
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
            <div class="pol-endorse-panel-desc">Select a party's candidate to endorse for the presidential election. First endorsement is free; switching costs 1 AP.</div>
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

                if (!confirm(`Endorse ${partyName}'s candidate for president? First endorsement is free; switching costs 1 AP.`)) return;

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

                    const apMsg = result.newAp != null ? ` (${result.newAp} AP remaining)` : '';
                    alert(`Endorsed ${partyName}!${apMsg}`);
                    endorsePanel.style.display = 'none';
                    // Refresh AP display
                    if (result.newAp != null) await refreshAP(factionId);
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
// DEMOCRACY CAMPAIGN ACTIONS TAB (Rally, Attack, Promise)
// ═══════════════════════════════════════════════════════════════════

// Campaign action state
let _caSelected = null;   // 'rally' | 'attack' | 'promise' | 'protest'
let _caRival = null;      // selected rival faction id
let _caVector = null;     // attack vector id
let _caPromiseType = null; // 'stat' | 'crisis'
let _caStatKey = null;     // selected stat key for promise
let _caCrisisId = null;   // selected crisis id for promise
let _caResult = null;     // last action result for display

let _caAttackVectors = null;  // cached built vectors

// Protest action state
let _protestTab = 'minister';       // 'minister' | 'activeCrisis' | 'statFailure'
let _protestTarget = null;          // selected grievance target object
let _protestState = null;           // null | 'resolving' | 'result' | 'active' | 'locked' | 'cooldown'
let _protestActiveData = null;      // active protest_log row (if any)
let _endorseableProtest = null;     // another party's resolving protest that we can endorse
let _alreadyEndorsed = false;       // whether we already endorsed the current endorseable protest
let _protestCachedMinisters = null;
let _protestCachedCrises = null;
let _protestCachedStats = null;
let _protestLoading = false;
let _govProtestCrisis = null;       // active protest crisis for governing party PA row

// Store references for re-rendering
let _currentNation = null, _currentFaction = null, _currentShard = null, _currentAllParties = null;
let _caIsGoverning = false;
let _caTopIssueStats = null; // Stats from top 7 issues by salience (for Make Promise filtering)

// Campaign actions organized by category
const CA_ACTION_CATEGORIES = [
    { key: 'momentum', label: 'MOMENTUM', color: '#f97316' },
    { key: 'approval', label: 'APPROVAL', color: '#4ade80' },
    { key: 'alignment', label: 'ALIGNMENT', color: '#a78bfa' },
    { key: 'appeal', label: 'APPEAL', color: '#38bdf8' },
    { key: 'tools', label: 'TOOLS', color: '#6b7280' },
];

const CA_ACTIONS = [
    // MOMENTUM
    { id: 'rally', name: 'Hold a Rally', ap: RALLY_CONFIG.AP_COST, color: '#f97316', icon: '★',
      category: 'momentum', affects: 'Momentum',
      desc: 'Rally your supporters in a public show of strength. Random outcome that directly affects your Momentum score. A rousing success builds momentum; a gaffe costs it.' },
    { id: 'press_conference', name: 'Press Conference', ap: 2, color: '#fbbf24', icon: '🎤',
      category: 'momentum', affects: 'Momentum',
      desc: 'Hold a press conference to make a public statement. Base roll: -2 to +2 Momentum. Opposition parties get +1 bonus. High-approval governing parties get +2 bonus.' },
    // APPROVAL
    { id: 'attack', name: 'Campaign Attack', ap: ATTACK_CONFIG.AP_COST, color: '#ef4444', icon: '✦',
      category: 'approval', affects: 'Approval',
      desc: 'Target a rival party\'s record or leadership. Lowers their approval and can hurt their momentum. More effective with evidence — but a weak attack backfires on you.' },
    { id: 'promise', name: 'Make a Promise', ap: MAKE_PROMISE_CONFIG.AP_COST, color: '#a78bfa', icon: '◆',
      category: 'approval', affects: 'Approval',
      desc: 'Publicly commit to improving a national stat or resolving a crisis. Gives an immediate approval boost, but you\'ll face governance penalties if you fail to deliver.' },
    // ALIGNMENT
    { id: 'fund_think_tank', name: 'Fund Think Tank', ap: IDEO_SHIFT_CONFIG.THINK_TANK.AP_COST, color: '#14b8a6', icon: '🏛',
      category: 'alignment', affects: 'Ideology',
      desc: 'Fund a think tank to gradually shift the electorate\'s ideology on a chosen axis. Long-term investment: 8 AP upfront + 1 AP/tick for 50 ticks. Improves your Ideology pillar score.' },
    { id: 'grassroots_movement', name: 'Grassroots Movement', ap: IDEO_SHIFT_CONFIG.GRASSROOTS.AP_COST, color: '#10b981', icon: '🌱',
      category: 'alignment', affects: 'Ideology + Momentum',
      desc: 'Launch a grassroots campaign to shift public ideology and build momentum. Runs for 100 ticks. Drifts electorate opinion toward your position and grants +1 Momentum periodically.' },
    { id: 'pivot', name: 'Ideological Pivot', ap: 1, color: '#f59e0b', icon: '⟳',
      category: 'alignment', affects: 'Alignment',
      desc: 'Shift your party\'s position on a chosen ideological axis. Costs escalate with each pivot (+1 AP per use, resets after 20 ticks). Reversing your current lean costs extra AP.' },
    // APPEAL
    { id: 'take_stance', name: 'Take a Stance', ap: STANCE_CONFIG.AP_COST, color: '#38bdf8', icon: '⚑',
      category: 'appeal', affects: 'Appeal + Ideology',
      desc: 'Declare your party\'s official position on a national issue. Builds platform appeal with aligned voters and shifts your ideology. Stances decay each tick — reinforce before they fade.' },
    { id: 'outreach', name: 'Community Outreach', ap: 3, color: '#60a5fa', icon: '🤝',
      category: 'appeal', affects: 'Appeal',
      desc: 'Engage directly with communities through town halls and local events. +3 Platform Appeal. Cost starts at 3 AP and escalates by +1 each use. Decays by 1 each tick you don\'t use it.' },
    // TOOLS
    { id: 'poll_now', name: 'Poll Now', ap: 1, color: '#22d3ee', icon: '📊',
      category: 'tools', affects: 'Informational',
      desc: 'Commission a poll to update the Current Electoral Standing. 1 AP = ±5% margin, 3 AP = ±3% margin.' },
];

// State for new electorate actions
let _caCooldowns = {};     // { action_type: ticksRemaining }
let _caUsedThisTick = {};  // { actionId: true } — actions already used this tick
let _caActiveActions = [];  // Active ideology_shift_actions rows
let _caTargetAxis = null;
let _caTargetDirection = null;
let _caPivotIdeo = null; // cached faction ideology for pivot cost calculation
let _caPollTier = 1; // poll investment: 1 AP (±5%) or 3 AP (±3%)
let _caOutreachEscalation = 0; // outreach cost escalation: +1 per use, -1 per tick of non-use
window._selectPollTier = function(tier) { _caPollTier = tier; const rerender = document.getElementById('ca-config-panel'); if (rerender) { rerender.innerHTML = renderPollNowConfig(); } };
let _caTargetDemographic = null;
let _caTargetBand = null;
// State for Take Stance action
let _caStanceIssue = null;
let _caStanceAxis = null;
let _caStanceSide = null;
let _caStanceIntensity = 'moderate';
let _caStanceIssueStates = null; // cached issue states for stance config

function caReset() {
    _caRival = null; _caVector = null;
    _caPromiseType = null; _caStatKey = null; _caCrisisId = null;
    _caAttackVectors = null;
    _protestTab = 'minister'; _protestTarget = null;
    _protestCachedMinisters = null; _protestCachedCrises = null; _protestCachedStats = null;
    _protestLoading = false;
    _caTargetAxis = null; _caTargetDirection = null;
    _caTargetDemographic = null; _caTargetBand = null;
    _caStanceIssue = null; _caStanceAxis = null;
    _caStanceSide = null; _caStanceIntensity = 'moderate';
}

function caIsReady() {
    if (_caSelected === 'rally') return true;
    if (_caSelected === 'attack') return !!_caRival && !!_caVector;
    if (_caSelected === 'promise') {
        if (_caPromiseType === 'stat') return !!_caStatKey;
        if (_caPromiseType === 'crisis') return !!_caCrisisId;
        return false;
    }
    if (_caSelected === 'protest') return !!_protestTarget;
    if (_caSelected === 'take_stance') return !!_caStanceIssue && !!_caStanceAxis && !!_caStanceSide && !!_caStanceIntensity;
    if (_caSelected === 'poll_now') return true;
    if (_caSelected === 'press_conference') return true;
    if (_caSelected === 'outreach') return true;
    if (_caSelected === 'fund_think_tank') return !!_caTargetAxis && !!_caTargetDirection;
    if (_caSelected === 'media_campaign') return !!_caTargetAxis && !!_caTargetDirection;
    if (_caSelected === 'grassroots_movement') return !!_caTargetAxis && !!_caTargetDirection;
    if (_caSelected === 'pivot') return !!_caTargetAxis && !!_caTargetDirection && !_caCooldowns['pivot'];
    return false;
}

function caGetCost() {
    if (_caSelected === 'protest') {
        const f = _currentFaction;
        const tick = _currentShard?.current_tick || 0;
        const decayed = getDecayedUseCount(f?.protest_use_count || 0, f?.protest_last_use_tick, tick);
        return getProtestCost(decayed);
    }
    if (_caSelected === 'pivot') {
        const f = _currentFaction;
        const tick = _currentShard?.current_tick || 0;
        let pivotCount = f?.pivot_count || 0;
        const lastPivot = f?.pivot_last_tick || 0;
        if (tick - lastPivot >= PIVOT_CONFIG.ESCALATION_RESET) pivotCount = 0;
        let cost = PIVOT_CONFIG.BASE_AP + pivotCount;
        // Check if reversing (need faction ideology loaded)
        if (_caTargetAxis && _caTargetDirection && _caPivotIdeo) {
            const currentPos = Number(_caPivotIdeo[_caTargetAxis] ?? 0);
            const shiftSign = _caTargetDirection === 'right' ? 1 : -1;
            const isReversal = (currentPos > 0 && shiftSign < 0) || (currentPos < 0 && shiftSign > 0);
            if (isReversal) cost += PIVOT_CONFIG.REVERSE_AP_EXTRA;
        }
        return cost;
    }
    if (_caSelected === 'poll_now') return _caPollTier; // 1 or 3 AP based on tier
    if (_caSelected === 'outreach') {
        const _f = _currentFaction;
        const _t = _currentShard?.current_tick || 0;
        return Math.max(1, 3 + (_caOutreachEscalation || 0) + (_f ? getTraitAPModifier('outreach', _f, _t) : 0));
    }
    if (_caSelected === 'press_conference') {
        const _f2 = _currentFaction;
        const _t2 = _currentShard?.current_tick || 0;
        return Math.max(1, 2 + (_f2 ? getTraitAPModifier('press_conference', _f2, _t2) : 0));
    }
    const act = CA_ACTIONS.find(a => a.id === _caSelected);
    if (!act) return 0;
    // Campaign Attack cost scales with current polarization
    if (act.id === 'attack') return getAttackAPCost(_currentNation?.polarization);
    return act.ap;
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

    // Refresh faction AP
    const { data: freshF } = await _supabase.from('factions')
        .select('action_points, party_funds').eq('id', f.id).single();
    if (freshF) {
        f.action_points = freshF.action_points;
        f.party_funds = freshF.party_funds;
    }
    const ap = f.action_points ?? 0;

    // Check if faction is in government (ruling party or coalition member)
    const coalition = await fetchActiveCoalition(_supabase, n.id);
    const coalitionIds = new Set(coalition?.party_ids || []);
    _caIsGoverning = f.id === n.ruling_faction_id || coalitionIds.has(f.id);


    // Fetch faction ideology
    const { data: factionIdeo } = await _supabase
        .from('faction_ideology')
        .select('*').eq('faction_id', f.id).single();
    _caPivotIdeo = factionIdeo;

    // Fetch other parties
    const otherParties = (allParties || []).filter(p => p.id !== f.id);

    // Fetch top 7 issues by salience for Make Promise filtering
    const { data: topIssues } = await _supabase
        .from('issue_state')
        .select('issue_id, salience')
        .eq('nation_id', n.id)
        .order('salience', { ascending: false })
        .limit(7);
    const allowedStats = new Set();
    for (const iss of (topIssues || [])) {
        const def = ISSUE_DEFS[iss.issue_id];
        if (def) for (const s of def.stats) allowedStats.add(s);
    }
    _caTopIssueStats = allowedStats;

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
    const { data: activeShiftActions } = await _supabase.from('ideology_shift_actions')
        .select('id, action_type, target_axis, target_direction, drift_rate, created_tick, status, band_shift_total')
        .eq('faction_id', f.id)
        .in('status', ['active', 'paused', 'suspended']);

    _caCooldowns = {};
    _caUsedThisTick = {};
    // Multi-tick cooldown windows (action cannot be used again until window expires)
    const cooldownMap = {
        fund_think_tank: IDEO_SHIFT_CONFIG.THINK_TANK.COOLDOWN_WINDOW,
        media_campaign: IDEO_SHIFT_CONFIG.MEDIA_CAMPAIGN.COOLDOWN_WINDOW,
        grassroots_movement: IDEO_SHIFT_CONFIG.GRASSROOTS.COOLDOWN_WINDOW,
        take_stance: STANCE_CONFIG.COOLDOWN_WINDOW,
        poll_now: POLL_CONFIG.COOLDOWN_WINDOW,
    };
    for (const a of (recentActions || [])) {
        const actionId = a.action_type;
        // Track multi-tick cooldowns
        const window = cooldownMap[a.action_type];
        if (window) {
            const remaining = (a.tick_performed + window) - tick;
            if (remaining > 0 && (!_caCooldowns[actionId] || remaining > _caCooldowns[actionId])) {
                _caCooldowns[actionId] = remaining;
            }
        }
        // Track "already used this tick" for one-per-tick actions
        if (a.tick_performed === tick) {
            _caUsedThisTick[actionId] = true;
        }
    }
    _caActiveActions = activeShiftActions || [];

    // Compute outreach escalation: +1 per use, decays -1 per tick of non-use
    // Count outreach actions, then subtract ticks since last outreach
    const outreachActions = (recentActions || []).filter(a => a.action_type === 'outreach');
    if (outreachActions.length > 0) {
        const lastOutreachTick = Math.max(...outreachActions.map(a => a.tick_performed));
        const ticksSinceLastOutreach = tick - lastOutreachTick;
        _caOutreachEscalation = Math.max(0, outreachActions.length - ticksSinceLastOutreach);
    } else {
        _caOutreachEscalation = 0;
    }

    renderCampaignUI(container, f, n, ap, otherParties, factionIdeo, tick, protestCheck, protestApCost);
}

function renderCampaignUI(container, f, n, ap, otherParties, factionIdeo, tick, protestCheck, protestApCost) {
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
            <span style="font-weight:700">PYRRHIC VICTORY</span> — ${pyrrhicRemaining} tick${pyrrhicRemaining !== 1 ? 's' : ''} remaining. AP income reduced by 2/tick.
        </div>`;
    }

    // Public Address pinned row for governing parties during T6/T7 crisis
    if (_caIsGoverning && _govProtestCrisis) {
        const pc = _govProtestCrisis;
        const paCooldownRemaining = pc.public_address_last_tick != null
            ? Math.max(0, PROTEST_CONFIG.PUBLIC_ADDRESS_COOLDOWN - (tick - pc.public_address_last_tick))
            : 0;
        const paReady = ap >= PROTEST_CONFIG.PUBLIC_ADDRESS_AP && paCooldownRemaining === 0;
        const cooldownClass = paCooldownRemaining > 0 ? ' ca-item--cooldown' : '';
        const paApLabel = paCooldownRemaining > 0
            ? `${paCooldownRemaining} TICK CD`
            : `${PROTEST_CONFIG.PUBLIC_ADDRESS_AP} AP`;
        listHtml += `<div class="ca-item ca-item--public-address${cooldownClass}${!paReady ? ' disabled' : ''}" data-action-id="public_address" style="${!paReady ? 'opacity:0.5;' : ''}">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:#5b9bd5">&#9788;</span>
                    <span class="ca-item-name">Public Address</span>
                </div>
                <span class="ca-item-ap">${paApLabel}</span>
            </div>
            <div class="ca-item-desc" style="font-size:9px;color:#4a4840;">Issue a public statement calling for calm. Reduces civil unrest buildup this tick.</div>
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
            listHtml += `<div style="font-family:var(--dfont-mono);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${catDef.color};padding:8px 6px 2px;${gi > 0 ? 'border-top:1px solid var(--dborder-0);margin-top:4px;' : ''}">${catDef.label}</div>`;
        }
        listHtml += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:0 2px;">`;

        for (const act of group.actions) {
            const isSel = _caSelected === act.id;
            const isProtest = act.id === 'protest';

            // Protest row has special state-driven rendering — spans full width
            if (isProtest) {
                listHtml += `<div style="grid-column:1/-1">${renderProtestActionRow(act, isSel, ap, f, tick)}</div>`;
                continue;
            }

            let displayCost = act.id === 'attack' ? getAttackAPCost(n?.polarization) : act.id === 'outreach' ? (3 + (_caOutreachEscalation || 0)) : act.id === 'press_conference' ? 2 : act.ap;
            // Apply leader trait modifiers to displayed cost
            if (['outreach', 'press_conference'].includes(act.id) && f.leader_positive_traits) {
                displayCost = Math.max(1, displayCost + getTraitAPModifier(act.id, f, tick));
            }
            const dbActionType = act.id === 'promise' ? 'make_promise' : act.id;
            const cdRemaining = _caCooldowns[dbActionType] || 0;
            const onCooldown = cdRemaining > 0;
            const usedThisTick = !!_caUsedThisTick[dbActionType];
            const isActive = _caActiveActions.some(a => a.action_type === act.id.replace('fund_', ''));
            const ok = ap >= displayCost && !onCooldown && !usedThisTick;
            const borderColor = isSel ? act.color : ok ? act.color + '55' : 'var(--dtext-3)';
            const bgStyle = isSel ? `background:${act.color}08;` : '';
            const borderStyle = isSel ? `border-color:${act.color}33;` : '';
            const nameColor = isSel ? act.color : 'var(--dtext-0)';
            const affectsColor = act.affects === 'Momentum' ? '#f97316' : act.affects === 'Approval' ? '#4ade80' : act.affects === 'Appeal' ? '#38bdf8' : act.affects.includes('Ideology') ? '#a78bfa' : act.affects === 'Alignment' ? '#f59e0b' : '#6b7280';
            const usedLabel = usedThisTick ? `${act.name} already used this turn` : '';
            const statusBadge = usedThisTick
                ? `<span class="ca-used-badge">USED</span>`
                : onCooldown
                ? `<span class="ca-cd-badge">${cdRemaining} tick${cdRemaining !== 1 ? 's' : ''} CD</span>`
                : isActive ? (() => {
                    const match = _caActiveActions.find(a => a.action_type === act.id.replace('fund_', ''));
                    return match?.status === 'suspended'
                        ? `<span class="ca-active-badge" style="background:#d4a017">SUSPENDED</span>`
                        : match?.status === 'paused'
                        ? `<span class="ca-active-badge" style="background:#f97316">PAUSED</span>`
                        : `<span class="ca-active-badge">ACTIVE</span>`;
                })() : '';
            listHtml += `<div class="ca-item${isSel ? ' selected' : ''}${!ok ? ' disabled' : ''}${onCooldown ? ' ca-item--cooldown' : ''}${usedThisTick ? ' ca-item--used' : ''}" data-action-id="${act.id}" style="border-left-color:${borderColor};${bgStyle}${borderStyle}${!ok ? 'opacity:0.35;' : ''}">
                <div class="ca-item-head">
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="ca-item-icon" style="color:${act.color}">${act.icon}</span>
                        <span class="ca-item-name" style="color:${nameColor}">${escapeHtml(act.name)}</span>
                        ${statusBadge}
                    </div>
                    <span class="ca-item-ap">${usedThisTick ? 'USED' : onCooldown ? `${cdRemaining} TICK CD` : `${displayCost} AP`}</span>
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
            panelHtml += renderActionConfig(sel, otherParties, factionIdeo, n, ap, tick);
            // Confirm button
            const cost = caGetCost();
            const ready = caIsReady();
            const canConfirm = ap >= cost && ready;
            panelHtml += `<div class="ca-confirm-row"><div class="ca-confirm-btn${canConfirm ? '' : ' disabled'}" style="background:${canConfirm ? sel.color : 'var(--dtext-3)'}" id="ca-confirm-btn">Confirm — ${cost} AP</div></div>`;
        }
        panelHtml += `</div>`;
    }

    // Build Active Actions table (includes paused actions)
    let activeActionsHtml = '';
    if (_caActiveActions.length > 0) {
        const durationMap = { think_tank: IDEO_SHIFT_CONFIG.THINK_TANK.DURATION, media_campaign: IDEO_SHIFT_CONFIG.MEDIA_CAMPAIGN.DURATION + (IDEO_SHIFT_CONFIG.MEDIA_CAMPAIGN.VISIBILITY_TICKS || 0), grassroots_movement: IDEO_SHIFT_CONFIG.GRASSROOTS.DURATION };
        const nameMap = { think_tank: 'Think Tank', media_campaign: 'Media Campaign', grassroots_movement: 'Grassroots Movement' };
        const axisMap = {};
        for (const ax of IDEOLOGY_AXES) {
            axisMap[ax.key] = ax;
        }
        const canManage = (type) => type === 'think_tank' || type === 'grassroots_movement';
        let rows = _caActiveActions.map(a => {
            const totalDuration = durationMap[a.action_type] || 50;
            const ticksActive = tick - a.created_tick;
            const ticksLeft = Math.max(0, totalDuration - ticksActive);
            const axDef = axisMap[a.target_axis];
            const axisName = axDef ? `${axDef.leftLabel}–${axDef.rightLabel}` : '';
            const dirLabel = a.target_direction === 'left' ? axDef?.leftLabel : a.target_direction === 'right' ? axDef?.rightLabel : a.target_direction === 'expand' ? `Expand ${axisName}` : a.target_direction === 'narrow' ? `Narrow ${axisName}` : a.target_direction || '?';
            const effectLabel = a.drift_rate ? `+${a.drift_rate}/tick ${dirLabel}` : dirLabel;
            const activatedDate = tickToDate(a.created_tick);
            const isPaused = a.status === 'paused';
            const isSuspended = a.status === 'suspended';
            const statusLabel = isSuspended ? '<span style="color:#d4a017;font-weight:600">SUSPENDED</span>' : isPaused ? '<span style="color:#f97316;font-weight:600">PAUSED</span>' : `${ticksLeft}`;

            // Management buttons for think_tank and grassroots_movement
            let btnsHtml = '';
            if (canManage(a.action_type)) {
                if (isPaused || isSuspended) {
                    btnsHtml = `<td style="text-align:right;white-space:nowrap">
                        <button class="ca-manage-btn" data-action="continue" data-id="${a.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#5cb85c;color:#fff;border:none;border-radius:3px">Continue — 1 AP</button>
                        <button class="ca-manage-btn" data-action="cancel" data-id="${a.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#d9534f;color:#fff;border:none;border-radius:3px">Cancel — 2 AP</button>
                    </td>`;
                } else {
                    btnsHtml = `<td style="text-align:right;white-space:nowrap">
                        <button class="ca-manage-btn" data-action="suspend" data-id="${a.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#c8a44e;color:#fff;border:none;border-radius:3px">Suspend — 1 AP</button>
                        <button class="ca-manage-btn" data-action="cancel" data-id="${a.id}" style="font-size:9px;padding:2px 6px;margin-left:4px;cursor:pointer;background:#d9534f;color:#fff;border:none;border-radius:3px">Cancel — 2 AP</button>
                    </td>`;
                }
            } else {
                btnsHtml = '<td></td>';
            }

            return `<tr>
                <td style="font-weight:600">${nameMap[a.action_type] || a.action_type}</td>
                <td>${activatedDate}</td>
                <td>${effectLabel}</td>
                <td style="text-align:right">${statusLabel}</td>
                ${btnsHtml}
            </tr>`;
        }).join('');
        activeActionsHtml = `<div class="ca-active-actions" style="margin-top:16px;">
            <div class="pe-header"><span class="pol-mod-title">Active Actions</span></div>
            <table class="pol-el-table" style="margin-top:4px"><thead><tr><th>Action</th><th>Activated</th><th>Effect</th><th style="text-align:right">Ticks Left</th><th></th></tr></thead><tbody>${rows}</tbody></table>
        </div>`;
    }

    container.innerHTML = `<div class="ca-wrap"><div class="ca-list">${listHtml}</div>${panelHtml}</div>
    ${activeActionsHtml}
    <div class="ca-portfolios" style="margin-top:16px;">
        <div id="ca-promises-container"><div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px">Loading promises...</div></div>
    </div>
    <div class="pe-container">
        <div class="pe-header"><span class="pol-mod-title">Party Events</span></div>
        <div id="party-events-feed" class="pe-feed"><div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px">Loading events...</div></div>
    </div>
    <div id="ca-stance-portfolio-container" style="margin-top:16px;"></div>`;

    // Load promises and stance portfolio on the actions page
    _renderActionsPromisesPanel(f, n, tick);
    _renderStancePortfolio(document.getElementById('ca-stance-portfolio-container'), f, n);

    // Load party events feed
    _loadPartyEventsFeed(n.id, f.id);

    // Wire up Suspend/Continue/Cancel buttons for ideology shift actions
    container.querySelectorAll('.ca-manage-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (btn.dataset.executing) return;
            btn.dataset.executing = 'true';
            btn.style.opacity = '0.4';
            const actionId = btn.dataset.id;
            const op = btn.dataset.action;
            try {
                let result;
                if (op === 'suspend') {
                    result = await suspendIdeologyAction(_supabase, f.id, actionId, tick);
                } else if (op === 'continue') {
                    result = await continueIdeologyAction(_supabase, f.id, actionId, tick);
                } else if (op === 'cancel') {
                    result = await cancelIdeologyAction(_supabase, f.id, n.id, actionId, tick);
                }
                if (result?.success) {
                    if (result.newAp != null) f.action_points = result.newAp;
                    const freshAp = await refreshAP(f.id);
                    if (freshAp !== undefined) f.action_points = freshAp;
                    _showToast(result.message || 'Done.', false);
                    await renderDemocracyActions(n, f, _currentShard, _currentAllParties);
                } else {
                    _showToast(result?.message || 'Action failed.');
                }
            } catch (err) {
                _showToast('Error: ' + err.message);
            } finally {
                btn.dataset.executing = '';
                btn.style.opacity = '1';
            }
        });
    });

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
                        f.action_points = result.newAp;
                        const freshAp = await refreshAP(f.id);
                        if (freshAp !== undefined) f.action_points = freshAp;
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

            const act = CA_ACTIONS.find(a => a.id === id);
            const actCost = act?.id === 'attack' ? getAttackAPCost(n?.polarization) : act?.ap;
            if (act && ap < actCost) return;
            if (_caSelected === id) { _caSelected = null; } else { _caSelected = id; }
            caReset();
            _caResult = null;
            renderCampaignUI(container, f, n, ap, otherParties, factionIdeo, tick, protestCheck, protestApCost);
        });
    });

    // Wire up config interactions
    wireCampaignConfig(container, f, n, ap, otherParties, factionIdeo, tick, protestCheck, protestApCost);
}

// ── Promises panel on the Actions page ──

async function _renderActionsPromisesPanel(faction, nation, tick) {
    const container = document.getElementById('ca-promises-container');
    if (!container) return;

    const { data: promises, error: promisesErr } = await _supabase
        .from('fundraiser_promises')
        .select('*')
        .eq('party_id', faction.id)
        .eq('nation_id', nation.id)
        .in('status', ['active', 'pending_election']);

    if (promisesErr) {
        container.innerHTML = `<div style="color:var(--dred);font-family:var(--dfont-mono);font-size:11px;padding:8px">Failed to load promises.</div>`;
        return;
    }

    const allPromises = promises || [];

    let rowsHtml = '';
    if (allPromises.length === 0) {
        rowsHtml = '<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:8px 0">No active promises.</div>';
    } else {
        for (const p of allPromises) {
            const isPending = p.status === 'pending_election';
            const isCrisis = p.demand_type === 'crisis_resolution';
            const label = p.demand_text || (isCrisis ? 'Resolve crisis' : 'Improve stat');
            const direction = isCrisis ? '✓' : (p.conditions?.direction === 'above' ? '↑' : '↓');

            let statusHtml;
            if (isPending) {
                statusHtml = `<span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:#94a3b8">⏳ Awaiting election</span>`;
            } else {
                const ticksLeft = Math.max(0, (p.tick_deadline || 0) - tick);
                const isUrgent = ticksLeft <= 3;
                const isCritical = ticksLeft <= 1;
                const tickColor = isCritical ? 'var(--dred)' : isUrgent ? 'var(--damber)' : 'var(--dgreen)';
                statusHtml = `<span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:${tickColor}">${ticksLeft} tick${ticksLeft !== 1 ? 's' : ''} left</span>`;
            }

            rowsHtml += `
            <div style="padding:6px 0;border-bottom:1px solid var(--dborder-1)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <span style="font-family:var(--dfont-mono);font-size:12px;color:var(--dtext-0)">${direction}</span>
                        <span style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0);margin-left:4px">${escapeHtml(label)}</span>
                    </div>
                    ${statusHtml}
                </div>
            </div>`;
        }
    }

    container.innerHTML = `
    <div style="border:1px solid var(--dborder-1);border-radius:6px;padding:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-family:var(--dfont-ui);font-size:13px;font-weight:700;color:var(--dtext-0);text-transform:uppercase;letter-spacing:0.5px">Promises</span>
            <span style="font-family:var(--dfont-mono);font-size:11px;color:var(--dtext-2)">${allPromises.length} / ${MAKE_PROMISE_CONFIG.MAX_ACTIVE_PROMISES}</span>
        </div>
        ${rowsHtml}
    </div>`;
}

// ── Render config body for each action ──

function renderActionConfig(sel, otherParties, factionIdeo, nation, ap, tick) {
    if (sel.id === 'rally') return renderRallyConfig();
    if (sel.id === 'attack') return renderAttackConfig(otherParties);
    if (sel.id === 'promise') return renderPromiseConfig(nation);
    if (sel.id === 'protest') return renderProtestConfig(nation, tick);
    if (sel.id === 'take_stance') return renderTakeStanceConfig(nation);
    if (sel.id === 'poll_now') return renderPollNowConfig();
    if (sel.id === 'fund_think_tank') return renderThinkTankConfig();
    if (sel.id === 'media_campaign') return renderMediaCampaignConfig();
    if (sel.id === 'grassroots_movement') return renderGrassrootsConfig();
    if (sel.id === 'pivot') return renderPivotConfig(nation);
    if (sel.id === 'press_conference') return `<div class="ca-info-box">Hold a press conference to make a public statement. Result depends on your position and approval.<br><br><strong>Base roll:</strong> -2 to +2 Momentum<br><strong>Opposition bonus:</strong> +1<br><strong>Government bonus:</strong> +2 (if gov approval ≥ 40)</div>`;
    if (sel.id === 'outreach') return `<div class="ca-info-box">Engage directly with communities through town halls, door-knocking, and local events.<br><br><strong>Effect:</strong> +3 Platform Appeal</div>`;
    return '';
}

// ── RALLY CONFIG ──

function renderRallyConfig() {
    return `<div class="ca-info-box">Hold a rally to energize your base. Random outcome that directly affects your Momentum — can boost or backfire.</div>`;
}

// ── TAKE STANCE CONFIG ──

function renderTakeStanceConfig(nation) {
    let html = `<div class="ca-info-box">Declare your party's position on an issue. Stances build platform appeal but decay over time.</div>`;

    // Issue selector
    html += `<div class="ca-subtitle" style="margin-top:10px">Select Issue</div><div style="display:flex;flex-direction:column;gap:3px">`;
    const issueEntries = Object.entries(ISSUE_DEFS);
    // Sort by salience if we have issue states
    const sortedIssues = _caStanceIssueStates
        ? issueEntries.sort((a, b) => {
            const sa = _caStanceIssueStates.find(is => is.issue_id === a[0])?.salience ?? 0;
            const sb = _caStanceIssueStates.find(is => is.issue_id === b[0])?.salience ?? 0;
            return sb - sa;
        })
        : issueEntries;

    for (const [issueId, def] of sortedIssues) {
        const isSel = _caStanceIssue === issueId;
        const issState = _caStanceIssueStates?.find(is => is.issue_id === issueId);
        const salience = issState ? Number(issState.salience).toFixed(0) : '—';
        html += `<div class="ca-option-chip${isSel ? ' selected' : ''}" data-stance-issue-id="${issueId}" style="padding:6px 10px;display:flex;justify-content:space-between;align-items:center;${isSel ? 'border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)' : ''}">
            <span style="font-weight:600">${escapeHtml(def.label)}</span>
            <span style="font-size:10px;color:var(--dtext-3)">Salience: ${salience}</span>
        </div>`;
    }
    html += `</div>`;

    // Axis selector (if issue selected)
    if (_caStanceIssue) {
        const issueDef = ISSUE_DEFS[_caStanceIssue];
        if (issueDef && issueDef.axes.length > 0) {
            html += `<div class="ca-subtitle" style="margin-top:12px">Choose Axis</div><div style="display:flex;flex-direction:column;gap:3px">`;
            for (const ak of issueDef.axes) {
                const ax = IDEOLOGY_AXES.find(a => a.key === ak);
                if (!ax) continue;
                const isSel = _caStanceAxis === ak;
                html += `<div class="ca-option-chip${isSel ? ' selected' : ''}" data-stance-axis-key="${ak}" style="padding:6px 10px;${isSel ? 'border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)' : ''}">
                    <span style="color:${ax.leftColor}">${ax.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="color:${ax.rightColor}">${ax.rightLabel}</span>
                </div>`;
            }
            html += `</div>`;
        }
    }

    // Side selector (if axis selected)
    if (_caStanceAxis) {
        const ax = IDEOLOGY_AXES.find(a => a.key === _caStanceAxis);
        if (ax) {
            html += `<div class="ca-subtitle" style="margin-top:12px">Choose Side</div><div style="display:flex;gap:8px">`;
            const isLeft = _caStanceSide === 'left';
            const isRight = _caStanceSide === 'right';
            html += `<div class="ca-option-chip${isLeft ? ' selected' : ''}" data-stance-side-val="left" style="flex:1;text-align:center;padding:8px;${isLeft ? `border-color:${ax.leftColor};color:${ax.leftColor};background:rgba(56,189,248,0.06)` : ''}"><span style="font-weight:700">${ax.leftLabel}</span></div>`;
            html += `<div class="ca-option-chip${isRight ? ' selected' : ''}" data-stance-side-val="right" style="flex:1;text-align:center;padding:8px;${isRight ? `border-color:${ax.rightColor};color:${ax.rightColor};background:rgba(56,189,248,0.06)` : ''}"><span style="font-weight:700">${ax.rightLabel}</span></div>`;
            html += `</div>`;
        }
    }

    // Intensity selector (if side selected)
    if (_caStanceSide) {
        const ax = IDEOLOGY_AXES.find(a => a.key === _caStanceAxis);
        const sideLabel = _caStanceSide === 'left' ? (ax?.leftLabel ?? 'Left') : (ax?.rightLabel ?? 'Right');
        const sideColor = _caStanceSide === 'left' ? (ax?.leftColor ?? '#ccc') : (ax?.rightColor ?? '#ccc');
        html += `<div class="ca-subtitle" style="margin-top:12px">Intensity</div><div style="display:flex;gap:6px">`;
        for (const [key, cfg] of Object.entries(STANCE_CONFIG.INTENSITY)) {
            const isSel = _caStanceIntensity === key;
            html += `<div class="ca-option-chip${isSel ? ' selected' : ''}" data-stance-int-val="${key}" style="flex:1;text-align:center;padding:6px 4px;${isSel ? 'border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)' : ''}">
                <div style="font-weight:600;font-size:11px">${key}</div>
                <div style="font-size:9px;color:var(--dtext-3);margin-top:2px">Str ${cfg.strength} · -${cfg.decay_rate}/t</div>
                <div style="font-size:9px;color:${sideColor};margin-top:1px;font-weight:600">+${cfg.ideology_shift} ${sideLabel}</div>
            </div>`;
        }
        html += `</div>`;

        // Preview summary when intensity is selected
        if (_caStanceIntensity) {
            const selCfg = STANCE_CONFIG.INTENSITY[_caStanceIntensity];
            const issueDef = ISSUE_DEFS[_caStanceIssue];
            html += `<div style="margin-top:10px;padding:8px 10px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.15);border-radius:3px;font-family:var(--dfont-mono);font-size:10px;">
                <div style="color:var(--dtext-1);font-weight:600;margin-bottom:4px">${_caStanceIntensity.toUpperCase()} ${sideLabel.toUpperCase()} on ${issueDef?.label || ''}</div>
                <div style="color:${sideColor};font-weight:700">Ideology: +${selCfg.ideology_shift} ${sideLabel}</div>
                <div style="color:var(--dtext-3);margin-top:2px">Strength: ${selCfg.strength} · Decay: -${selCfg.decay_rate}/tick</div>
            </div>`;
        }
    }

    return html;
}

// ── POLL NOW CONFIG ──

function renderPollNowConfig() {
    return `<div class="ca-info-box">Commission a poll to update the Current Electoral Standing table. Higher investment produces more accurate results.</div>
    <div style="margin-top:8px;">
        <label style="font-family:var(--dfont-mono);font-size:9px;color:var(--dtext-3);text-transform:uppercase;display:block;margin-bottom:4px;">Investment Level</label>
        <div style="display:flex;gap:6px;">
            <button class="ca-poll-tier-btn${_caPollTier === 1 ? ' selected' : ''}" onclick="window._selectPollTier(1)" style="flex:1;padding:6px;background:${_caPollTier === 1 ? 'var(--dbg-hover)' : 'var(--dbg-3)'};border:1px solid ${_caPollTier === 1 ? 'var(--dtext-1)' : 'var(--dborder-0)'};border-radius:2px;color:var(--dtext-0);font-family:var(--dfont-mono);font-size:10px;cursor:pointer;text-align:center;">
                <strong>1 AP</strong><br><span style="color:var(--damber)">±5%</span>
            </button>
            <button class="ca-poll-tier-btn${_caPollTier === 3 ? ' selected' : ''}" onclick="window._selectPollTier(3)" style="flex:1;padding:6px;background:${_caPollTier === 3 ? 'var(--dbg-hover)' : 'var(--dbg-3)'};border:1px solid ${_caPollTier === 3 ? 'var(--dtext-1)' : 'var(--dborder-0)'};border-radius:2px;color:var(--dtext-0);font-family:var(--dfont-mono);font-size:10px;cursor:pointer;text-align:center;">
                <strong>3 AP</strong><br><span style="color:var(--dgreen)">±3%</span>
            </button>
        </div>
    </div>
    ${POLL_CONFIG.COOLDOWN_WINDOW > 0 ? `<div class="ca-info-box" style="margin-top:8px;color:var(--dtext-3);font-size:0.8em">Cooldown: ${POLL_CONFIG.COOLDOWN_WINDOW} ticks between polls.</div>` : ''}`;
}

// ── THINK TANK CONFIG ──

function renderThinkTankConfig() {
    let html = `<div class="ca-info-box">Launch a think tank to gradually drift the electorate's ideological mean on a chosen axis. ${IDEO_SHIFT_CONFIG.THINK_TANK.AP_COST} AP upfront + ${IDEO_SHIFT_CONFIG.THINK_TANK.TICK_AP_COST} AP/tick for ${IDEO_SHIFT_CONFIG.THINK_TANK.DURATION} ticks. Drift: 1d3 (0.1–0.3) per tick.</div>`;
    html += renderAxisSelector();
    if (_caTargetAxis) {
        const axisDef = IDEOLOGY_AXES.find(a => a.key === _caTargetAxis);
        if (axisDef) {
            html += `<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>`;
            html += renderDirectionSelector(axisDef.leftLabel, axisDef.rightLabel, 'left', 'right');
        }
    }
    return html;
}

// ── MEDIA CAMPAIGN CONFIG ──

function renderMediaCampaignConfig() {
    const mc = IDEO_SHIFT_CONFIG.MEDIA_CAMPAIGN;
    let html = `<div class="ca-info-box">Launch a media campaign to expand or narrow electorate ideological variance on a chosen axis. Phase 1: 1d5 (0.1–0.5) variance shift/tick for ${mc.DURATION} ticks. Phase 2: 1d3 (1–3) momentum/tick for ${mc.VISIBILITY_TICKS} ticks.</div>`;
    html += renderAxisSelector();
    if (_caTargetAxis) {
        html += `<div class="ca-subtitle" style="margin-top:12px">Variance direction</div>`;
        html += renderDirectionSelector('Expand (polarize)', 'Narrow (centralize)', 'expand', 'narrow');
    }
    return html;
}

// ── GRASSROOTS CONFIG ──

function renderGrassrootsConfig() {
    const gr = IDEO_SHIFT_CONFIG.GRASSROOTS;
    let html = `<div class="ca-info-box">Launch a grassroots movement to slowly shift the electorate on a chosen axis. ${gr.AP_COST} AP upfront + ${gr.TICK_AP_COST} AP/tick for ${gr.DURATION} ticks. Drift: 1d2 (${gr.DRIFT_MIN}–${gr.DRIFT_MAX})/tick. +1 momentum every ${gr.VISIBILITY_INTERVAL} ticks.</div>`;
    html += renderAxisSelector();
    if (_caTargetAxis) {
        const axisDef = IDEOLOGY_AXES.find(a => a.key === _caTargetAxis);
        if (axisDef) {
            html += `<div class="ca-subtitle" style="margin-top:12px">Drift direction</div>`;
            html += renderDirectionSelector(axisDef.leftLabel, axisDef.rightLabel, 'left', 'right');
        }
    }
    return html;
}

// ── IDEOLOGICAL PIVOT CONFIG ──

function renderPivotConfig(nation) {
    const f = _currentFaction;
    const tick = _currentShard?.current_tick || 0;
    let pivotCount = f?.pivot_count || 0;
    const lastPivot = f?.pivot_last_tick || 0;
    if (tick - lastPivot >= PIVOT_CONFIG.ESCALATION_RESET) pivotCount = 0;

    const cooldownRemaining = Math.max(0, PIVOT_CONFIG.COOLDOWN - (tick - lastPivot));
    const onCooldown = lastPivot > 0 && cooldownRemaining > 0;

    let html = `<div class="ca-info-box">Shift your party's ideological position. Each pivot costs +1 AP more than the last (resets after ${PIVOT_CONFIG.ESCALATION_RESET} ticks of no pivots). Reversing direction costs extra AP. Hold steady 20+ ticks for a conviction bonus.</div>`;

    if (onCooldown) {
        html += `<div style="font-family:var(--dfont-mono);font-size:11px;color:var(--damber);padding:6px 0">Cooldown: ${cooldownRemaining} tick${cooldownRemaining !== 1 ? 's' : ''} remaining</div>`;
    }

    html += `<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);padding:4px 0">Pivots this cycle: ${pivotCount} · Next cost: ${PIVOT_CONFIG.BASE_AP + pivotCount} AP${pivotCount > 0 ? ' (escalated)' : ''}</div>`;

    html += renderAxisSelector();
    if (_caTargetAxis) {
        const axisDef = IDEOLOGY_AXES.find(a => a.key === _caTargetAxis);
        if (axisDef) {
            const currentPos = _caPivotIdeo ? Number(_caPivotIdeo[_caTargetAxis] ?? 0) : 0;
            const posLabel = currentPos > 0 ? `+${currentPos} (${axisDef.rightLabel})` : currentPos < 0 ? `${currentPos} (${axisDef.leftLabel})` : '0 (Center)';
            html += `<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);padding:4px 0;margin-top:4px">Current position: <span style="font-weight:700">${posLabel}</span></div>`;
            html += `<div class="ca-subtitle" style="margin-top:8px">Pivot direction</div>`;
            html += renderDirectionSelector(axisDef.leftLabel, axisDef.rightLabel, 'left', 'right');

            // Show reversal warning
            if (_caTargetDirection) {
                const shiftSign = _caTargetDirection === 'right' ? 1 : -1;
                const isReversal = (currentPos > 0 && shiftSign < 0) || (currentPos < 0 && shiftSign > 0);
                if (isReversal) {
                    html += `<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);padding:6px 0;border-top:1px solid var(--dborder-1);margin-top:8px">⚠ Reversal: +${PIVOT_CONFIG.REVERSE_AP_EXTRA} AP extra</div>`;
                }
            }
        }
    }
    return html;
}

// ── Shared config helpers ──

function renderAxisSelector() {
    let html = `<div class="ca-subtitle" style="margin-top:10px">Target axis</div><div style="display:flex;flex-direction:column;gap:4px">`;
    for (const axis of IDEOLOGY_AXES) {
        const isSel = _caTargetAxis === axis.key;
        html += `<div class="ca-option-chip${isSel ? ' selected' : ''}" data-axis-key="${axis.key}" style="padding:6px 10px;${isSel ? 'border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)' : ''}">
            <span style="font-weight:600">${axis.leftLabel}</span> <span style="color:var(--dtext-3)">↔</span> <span style="font-weight:600">${axis.rightLabel}</span>
            <span style="font-size:0.75em;color:var(--dtext-3);margin-left:6px">${axis.description}</span>
        </div>`;
    }
    html += `</div>`;
    return html;
}

function renderDirectionSelector(leftLabel, rightLabel, leftValue, rightValue) {
    let html = `<div style="display:flex;gap:8px">`;
    const isLeft = _caTargetDirection === leftValue;
    const isRight = _caTargetDirection === rightValue;
    html += `<div class="ca-option-chip${isLeft ? ' selected' : ''}" data-direction-value="${leftValue}" style="flex:1;text-align:center;padding:8px;${isLeft ? 'border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)' : ''}">${leftLabel}</div>`;
    html += `<div class="ca-option-chip${isRight ? ' selected' : ''}" data-direction-value="${rightValue}" style="flex:1;text-align:center;padding:8px;${isRight ? 'border-color:var(--dtext-0);color:var(--dtext-0);background:rgba(255,255,255,0.04)' : ''}">${rightLabel}</div>`;
    html += `</div>`;
    return html;
}

// ── ATTACK CONFIG ──

function renderAttackConfig(otherParties) {
    const pol = _currentNation?.polarization || 0;
    const attackCost = getAttackAPCost(pol);
    const costNote = attackCost > ATTACK_CONFIG.AP_COST ? ` Cost scaled to ${attackCost} AP (polarization ${Math.round(pol)}).` : '';
    let html = `<div style="color:#ef4444;font-size:0.85em;margin-bottom:4px">Using this will increase Polarization by 0.25.${costNote}</div><div class="ca-subtitle">Select target party</div>`;
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

// ── PROMISE CONFIG ──

function renderPromiseConfig(nation) {
    let html = `<div class="ca-subtitle">What do you promise?</div>`;

    // Type selector
    const types = [
        { id: 'stat', name: 'Improve a Stat', desc: 'Promise to move a national stat in the right direction.', color: '#a78bfa' },
        { id: 'crisis', name: 'Resolve a Crisis', desc: 'Promise to resolve an active national crisis.', color: '#ef4444' },
    ];
    html += `<div style="display:flex;gap:8px;margin-bottom:12px">`;
    for (const t of types) {
        const isSel = _caPromiseType === t.id;
        html += `<div style="flex:1;padding:8px 12px;border:1px solid ${isSel ? t.color + '44' : 'var(--dborder-1)'};border-left:3px solid ${isSel ? t.color : 'transparent'};border-radius:4px;cursor:pointer;transition:all 0.1s;${isSel ? `background:${t.color}08` : ''}" data-promise-type="${t.id}">
            <div style="font-family:var(--dfont-ui);font-size:12px;font-weight:700;color:${isSel ? t.color : 'var(--dtext-0)'}">${t.name}</div>
            <div style="font-family:var(--dfont-ui);font-size:10px;color:var(--dtext-3);margin-top:2px">${t.desc}</div>
        </div>`;
    }
    html += `</div>`;

    if (_caPromiseType === 'stat') {
        const statDelta = _caIsGoverning ? MAKE_PROMISE_CONFIG.STAT_DELTA_GOVERNING : MAKE_PROMISE_CONFIG.STAT_DELTA;
        const allStats = getPromiseableStats(nation, _caIsGoverning);
        // Filter to stats from top 7 electorate issues by salience
        const stats = _caTopIssueStats && _caTopIssueStats.size > 0
            ? allStats.filter(s => _caTopIssueStats.has(s.statKey))
            : allStats;
        if (stats.length === 0) {
            html += `<div class="ca-info-box">No stats available to promise on — they may all be at their limit.</div>`;
        } else {
            if (_caIsGoverning) {
                html += `<div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-bottom:8px;padding:4px 8px;border:1px solid rgba(249,115,22,0.2);border-radius:4px;background:rgba(249,115,22,0.04)">⚠ Governing factions must promise ±${statDelta} (you have legislative power)</div>`;
            }
            html += `<div class="ca-bloc-list">`;
            for (const s of stats) {
                const isSel = _caStatKey === s.statKey;
                const target = s.direction === 'higher_is_better'
                    ? Math.min(100, Math.round(s.value + statDelta))
                    : Math.max(0, Math.round(s.value - statDelta));
                const dirLabel = s.promiseDirection === 'increase' ? '↑' : '↓';
                const dirColor = s.promiseDirection === 'increase' ? '#4ade80' : '#22d3ee';
                html += `<div class="ca-stat-card${isSel ? ' selected' : ''}" data-stat-key="${s.statKey}" style="border-left-color:${isSel ? '#a78bfa' : dirColor};${isSel ? 'border-color:rgba(167,139,250,0.2);background:rgba(167,139,250,0.03)' : ''}">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span class="ca-stat-name">${escapeHtml(s.label)}</span>
                        <div style="display:flex;align-items:center;gap:8px">
                            <span class="ca-stat-val" style="color:var(--dtext-2)">${Math.round(s.value)}</span>
                            <span style="color:${dirColor}">${dirLabel}</span>
                            <span class="ca-stat-val" style="color:${dirColor}">${target}</span>
                        </div>
                    </div>
                    ${isSel ? `<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:4px">Deadline: ${MAKE_PROMISE_CONFIG.DEADLINE_BASE + 1}–${MAKE_PROMISE_CONFIG.DEADLINE_BASE + MAKE_PROMISE_CONFIG.DEADLINE_DICE} ticks (starts after next election) · Immediate <span style="color:#4ade80">+${MAKE_PROMISE_CONFIG.APPROVAL_ON_PROMISE} approval</span></div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:3px;display:flex;gap:12px;flex-wrap:wrap">
                        <span style="color:#4ade80">If kept: +${MAKE_PROMISE_CONFIG.KEPT_APPROVAL} momentum</span>
                    </div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;display:flex;gap:12px;flex-wrap:wrap">
                        <span style="color:#ef4444">If broken: ${MAKE_PROMISE_CONFIG.BROKEN_APPROVAL} momentum</span>
                    </div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;color:var(--dtext-3)">Countdown deferred until in government · <span style="color:#f97316">−${MAKE_PROMISE_CONFIG.PENALTY_PER_TICK_MIN} to −${MAKE_PROMISE_CONFIG.PENALTY_PER_TICK_MAX} approval/tick while unfulfilled</span></div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;color:var(--dtext-3)">If in opposition after election: <span style="color:#94a3b8">promise extinguishes — no penalty</span></div>` : ''}
                </div>`;
            }
            html += `</div>`;
        }
    }

    if (_caPromiseType === 'crisis') {
        html += `<div id="ca-crisis-list"><div class="ca-info-box">Loading crises...</div></div>`;
        html += `<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:8px;padding:0 2px">
            Deadline: ${MAKE_PROMISE_CONFIG.DEADLINE_BASE + 1}–${MAKE_PROMISE_CONFIG.DEADLINE_BASE + MAKE_PROMISE_CONFIG.DEADLINE_DICE} ticks (starts after next election) · Immediate <span style="color:#4ade80">+${MAKE_PROMISE_CONFIG.APPROVAL_ON_PROMISE} approval</span>
        </div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:3px;padding:0 2px">
            <span style="color:#4ade80">If kept: +${MAKE_PROMISE_CONFIG.KEPT_APPROVAL} momentum</span>
        </div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;padding:0 2px">
            <span style="color:#ef4444">If broken: ${MAKE_PROMISE_CONFIG.BROKEN_APPROVAL} momentum</span>
        </div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;padding:0 2px;color:var(--dtext-3)">Countdown deferred until in government · <span style="color:#f97316">−${MAKE_PROMISE_CONFIG.PENALTY_PER_TICK_MIN} to −${MAKE_PROMISE_CONFIG.PENALTY_PER_TICK_MAX} approval/tick while unfulfilled</span></div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;padding:0 2px;color:var(--dtext-3)">If in opposition after election: <span style="color:#94a3b8">promise extinguishes — no penalty</span></div>`;
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

    // Load active crises in the nation
    if (!_protestCachedCrises) {
        const { data: crises } = await _supabase
            .from('active_crises')
            .select('id, started_at_tick, crisis_templates(name, description)')
            .eq('nation_id', nation.id);
        _protestCachedCrises = (crises || []).map(c => ({
            ...c,
            duration: tick - (c.started_at_tick || 0),
        }));
    }

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

function renderProtestActionRow(act, isSel, ap, faction, tick) {
    const state = _protestState;
    const cost = act.ap;
    const ok = ap >= cost;

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
        const canCallOff = _protestActiveData.tier === 6 && (faction.action_points || 0) >= PROTEST_CONFIG.CALL_OFF_AP;
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
                : `<div class="protest-calloff-btn${canCallOff ? '' : ' disabled'}" onclick="window._protestCallOff()">Call Off Protest — ${PROTEST_CONFIG.CALL_OFF_AP} AP</div>`
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
        const canEndorse = !_alreadyEndorsed && (faction.action_points || 0) >= 1;
        const endorseLabel = _alreadyEndorsed ? 'ENDORSED' : 'ENDORSE — 1 AP';
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
            <span class="ca-item-ap" style="color:#d9534f">${cost} AP</span>
        </div>
        ${isSel ? `<div class="ca-item-desc">${escapeHtml(act.desc)}</div>` : ''}
    </div>`;
}

// ── Protest Config Panel (right panel) ──

function renderProtestConfig(nation, tick) {
    let html = '';

    // Warning bar
    html += `<div class="protest-warning">Turnout is probabilistic — based on Civil Unrest, Happiness, Polarisation, and Political Violence. A fizzle hands the government a free headline. Choose your moment.</div>`;

    // Live stat hint pills
    const stats = [
        { key: 'civil_unrest', label: 'CIVIL UNREST', value: nation.civil_unrest || 0 },
        { key: 'happiness', label: 'HAPPINESS', value: nation.happiness || 50 },
        { key: 'polarization', label: 'POLARISATION', value: nation.polarization || 0 },
        { key: 'political_violence', label: 'POL VIOLENCE', value: nation.political_violence || 0 },
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
    const tabs = [
        { id: 'minister', label: 'Minister' },
        { id: 'activeCrisis', label: 'Active Crisis' },
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
    } else if (_protestTab === 'activeCrisis') {
        html += renderProtestCrisisTargets();
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

function renderProtestCrisisTargets() {
    const crises = _protestCachedCrises;
    if (!crises) return `<div class="protest-empty">Loading active crises...</div>`;
    if (crises.length === 0) return `<div class="protest-empty">No active crises in this nation.</div>`;

    let html = '';
    for (const c of crises) {
        const isSel = _protestTarget?.id === c.id;
        const name = c.crisis_templates?.name || 'Unknown Crisis';
        const desc = c.crisis_templates?.description || '';
        const dur = c.duration || 0;
        const demandLabel = `The government must resolve the ${name} crisis.`;
        const targetData = JSON.stringify({
            id: c.id,
            type: 'activeCrisis',
            label: name,
            demandLabel,
            grievanceData: { crisisId: c.id, name, duration: dur },
        }).replace(/"/g, '&quot;');

        html += `<div class="protest-target${isSel ? ' selected' : ''}" data-protest-target="${targetData}">
            <div>
                <div class="protest-target__name">${escapeHtml(name)}</div>
                <div class="protest-target__meta">${escapeHtml(desc ? desc.slice(0, 80) : '')}${dur ? ' · ' + dur + 't active' : ''}</div>
            </div>
        </div>`;
    }
    return html;
}

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
    if (result.demandText) {
        html += `<div class="ca-result-row">
            <span class="ca-result-label">Promise</span>
            <span class="ca-result-val" style="color:#a78bfa">${escapeHtml(result.demandText)}</span>
        </div>`;
        if (result.conditions?.is_governing) {
            html += `<div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-top:2px">Governing target: ±${result.conditions.delta} (higher bar)</div>`;
        }
    }
    if (result.deadlineTicks) {
        html += `<div class="ca-result-row">
            <span class="ca-result-label">Deadline</span>
            <span class="ca-result-val" style="color:var(--dtext-2)">${result.deadlineTicks} ticks</span>
        </div>`;
    }
    if (result.promiseType) {
        html += `<div style="border-top:1px solid var(--dborder-1);margin-top:8px;padding-top:8px">
            <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-bottom:4px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Consequences</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#4ade80">Kept: +${MAKE_PROMISE_CONFIG.KEPT_APPROVAL} momentum</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#ef4444;margin-top:2px">Broken: ${MAKE_PROMISE_CONFIG.BROKEN_APPROVAL} momentum</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-top:2px">While unfulfilled: −${MAKE_PROMISE_CONFIG.PENALTY_PER_TICK_MIN} to −${MAKE_PROMISE_CONFIG.PENALTY_PER_TICK_MAX} approval/tick</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#94a3b8;margin-top:2px">Countdown starts after next election · Opposition = extinguished</div>
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

function wireCampaignConfig(container, f, n, ap, otherParties, factionIdeo, tick, protestCheck, protestApCost) {
    const rerender = () => renderCampaignUI(container, f, n, ap, otherParties, factionIdeo, tick, protestCheck, protestApCost);

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

    // Promise type selection
    container.querySelectorAll('[data-promise-type]').forEach(el => {
        el.addEventListener('click', async () => {
            const type = el.dataset.promiseType;
            _caPromiseType = _caPromiseType === type ? null : type;
            _caStatKey = null;
            _caCrisisId = null;
            rerender();

            // Load crises for crisis type
            if (_caPromiseType === 'crisis') {
                const { data: crises } = await _supabase
                    .from('active_crises')
                    .select('id, crisis_id, started_at_tick, crisis_templates(name, description)')
                    .eq('nation_id', n.id);

                const crisisEl = document.getElementById('ca-crisis-list');
                if (crisisEl) {
                    if (!crises || crises.length === 0) {
                        crisisEl.innerHTML = `<div class="ca-info-box">No active crises to promise on.</div>`;
                    } else {
                        let cHtml = '';
                        for (const c of crises) {
                            const isSel = _caCrisisId === c.id;
                            const name = c.crisis_templates?.name || 'Unknown Crisis';
                            cHtml += `<div class="ca-crisis-card${isSel ? ' selected' : ''}" data-crisis-id="${c.id}">
                                <span class="ca-crisis-name">${escapeHtml(name)}</span>
                            </div>`;
                        }
                        crisisEl.innerHTML = cHtml;
                        // Wire crisis click
                        crisisEl.querySelectorAll('[data-crisis-id]').forEach(cel => {
                            cel.addEventListener('click', () => {
                                _caCrisisId = _caCrisisId === cel.dataset.crisisId ? null : cel.dataset.crisisId;
                                rerender();
                            });
                        });
                    }
                }
            }
        });
    });

    // Stat selection (promise)
    container.querySelectorAll('[data-stat-key]').forEach(el => {
        el.addEventListener('click', () => {
            _caStatKey = _caStatKey === el.dataset.statKey ? null : el.dataset.statKey;
            rerender();
        });
    });

    // Crisis selection (promise) — if already loaded
    container.querySelectorAll('[data-crisis-id]').forEach(el => {
        el.addEventListener('click', () => {
            _caCrisisId = _caCrisisId === el.dataset.crisisId ? null : el.dataset.crisisId;
            rerender();
        });
    });

    // Stance issue selection
    container.querySelectorAll('[data-stance-issue-id]').forEach(el => {
        el.addEventListener('click', () => {
            const id = el.dataset.stanceIssueId;
            if (_caStanceIssue === id) { _caStanceIssue = null; } else { _caStanceIssue = id; }
            _caStanceAxis = null; _caStanceSide = null; _caStanceIntensity = 'moderate';
            // Auto-select axis if issue only has one
            const issueDef = ISSUE_DEFS[_caStanceIssue];
            if (issueDef && issueDef.axes.length === 1) _caStanceAxis = issueDef.axes[0];
            rerender();
        });
    });

    // Stance axis selection
    container.querySelectorAll('[data-stance-axis-key]').forEach(el => {
        el.addEventListener('click', () => {
            const ak = el.dataset.stanceAxisKey;
            _caStanceAxis = _caStanceAxis === ak ? null : ak;
            _caStanceSide = null;
            rerender();
        });
    });

    // Stance side selection
    container.querySelectorAll('[data-stance-side-val]').forEach(el => {
        el.addEventListener('click', () => {
            const s = el.dataset.stanceSideVal;
            _caStanceSide = _caStanceSide === s ? null : s;
            rerender();
        });
    });

    // Stance intensity selection
    container.querySelectorAll('[data-stance-int-val]').forEach(el => {
        el.addEventListener('click', () => {
            _caStanceIntensity = el.dataset.stanceIntVal;
            rerender();
        });
    });

    // Load issue states for stance config if needed
    if (_caSelected === 'take_stance' && !_caStanceIssueStates && !_caResult) {
        _supabase.from('issue_state').select('issue_id, salience').eq('nation_id', n.id).then(({ data }) => {
            _caStanceIssueStates = data || [];
            rerender();
        });
    }

    // Axis selection (think tank, media, grassroots)
    container.querySelectorAll('[data-axis-key]').forEach(el => {
        el.addEventListener('click', () => {
            const key = el.dataset.axisKey;
            if (_caTargetAxis === key) { _caTargetAxis = null; } else { _caTargetAxis = key; }
            _caTargetDirection = null;
            _caTargetDemographic = null;
            _caTargetBand = null;
            rerender();
        });
    });

    // Direction selection (think tank, media, grassroots)
    container.querySelectorAll('[data-direction-value]').forEach(el => {
        el.addEventListener('click', () => {
            const val = el.dataset.directionValue;
            _caTargetDirection = _caTargetDirection === val ? null : val;
            rerender();
        });
    });

    // Demographic selection (grassroots)
    container.querySelectorAll('[data-grassroots-demo]').forEach(el => {
        el.addEventListener('click', () => {
            const d = el.dataset.grassrootsDemo;
            if (_caTargetDemographic === d) { _caTargetDemographic = null; } else { _caTargetDemographic = d; }
            _caTargetBand = null;
            rerender();
        });
    });

    // Band selection (grassroots)
    container.querySelectorAll('[data-grassroots-band]').forEach(el => {
        el.addEventListener('click', () => {
            const b = el.dataset.grassrootsBand;
            _caTargetBand = _caTargetBand === b ? null : b;
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
            _protestCachedCrises = _protestCachedCrises || [];
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
            handleCampaignConfirm(container, f, n, ap, otherParties, factionIdeo, tick);
        });
    }
}

// ── Protest Endorse & Call-Off handlers ──

let _protestEndorseLock = false;
window._protestEndorse = async function() {
    if (_protestEndorseLock) return;
    if (!_endorseableProtest || _alreadyEndorsed) return;
    if (!confirm('Endorse this protest? Costs 1 AP and boosts turnout (+15).')) return;
    _protestEndorseLock = true;
    try {
        const result = await endorseProtest(_supabase, _currentFaction.id, _currentNation.id, _endorseableProtest.id, _currentShard.current_tick);
        if (!result.success) {
            _showToast(result.error || 'Endorsement failed.');
            return;
        }
        _alreadyEndorsed = true;
        _currentFaction.action_points = Math.max(0, (_currentFaction.action_points || 0) - 1);
        const freshAp1 = await refreshAP(_currentFaction.id);
        if (freshAp1 !== undefined) _currentFaction.action_points = freshAp1;
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
    if (!confirm('Call off this protest? Costs ' + PROTEST_CONFIG.CALL_OFF_AP + ' AP. A small approval boost from moderate blocs will be applied.')) return;
    _protestCallOffLock = true;
    try {
        const result = await callOffProtest(_supabase, _currentFaction.id, _protestActiveData.id, _currentShard.current_tick);
        if (!result.success) {
            _showToast(result.error || 'Call-off failed.');
            return;
        }
        _currentFaction.action_points = Math.max(0, (_currentFaction.action_points || 0) - PROTEST_CONFIG.CALL_OFF_AP);
        const freshAp2 = await refreshAP(_currentFaction.id);
        if (freshAp2 !== undefined) _currentFaction.action_points = freshAp2;
        await renderDemocracyActions(_currentNation, _currentFaction, _currentShard, _currentAllParties);
    } catch (err) {
        console.error('[Protest] Call-off failed:', err);
        _showToast('Call-off failed: ' + err.message);
    } finally {
        _protestCallOffLock = false;
    }
};

// ── Confirm handler ──

async function handleCampaignConfirm(container, f, n, ap, otherParties, factionIdeo, tick) {
    // Protest is not in CA_ACTIONS (added dynamically for opposition only);
    // look it up separately so the confirm handler can reach the protest branch.
    const sel = CA_ACTIONS.find(a => a.id === _caSelected)
        || (_caSelected === 'protest' ? { id: 'protest', name: 'Organise a Protest', ap: caGetCost(), color: '#d9534f' } : null);
    if (!sel) return;
    const cost = caGetCost();
    if (ap < cost || !caIsReady()) return;

    const btn = document.getElementById('ca-confirm-btn');
    if (btn) { btn.classList.add('disabled'); btn.textContent = 'EXECUTING...'; }

    let result;
    try {
        if (sel.id === 'rally') {
            result = await executeRally(_supabase, f.id, n.id, null, tick);
        } else if (sel.id === 'attack') {
            result = await executeAttack(_supabase, f.id, n.id, _caRival, _caVector, tick);
        } else if (sel.id === 'promise') {
            const params = _caPromiseType === 'stat' ? { statKey: _caStatKey } : { crisisId: _caCrisisId };
            result = await executeMakePromise(_supabase, f.id, n.id, tick, _caPromiseType, params);
        } else if (sel.id === 'protest') {
            if (!_protestTarget) return;
            const grievanceData = _protestTarget.grievanceData || {};
            const demandLabel = _protestTarget.demandLabel || '';
            result = await executeProtest(_supabase, f.id, n.id, _protestTarget.type, grievanceData, demandLabel, tick);
        } else if (sel.id === 'take_stance') {
            result = await executeTakeStance(_supabase, f.id, n.id, _caStanceIssue, _caStanceAxis, _caStanceSide, _caStanceIntensity, tick);
        } else if (sel.id === 'poll_now') {
            // Pass poll tier: 1 AP = ±5% margin, 3 AP = ±3% margin
            result = await executePollNow(_supabase, f.id, n.id, tick, _caPollTier);
        } else if (sel.id === 'fund_think_tank') {
            result = await executeFundThinkTank(_supabase, f.id, n.id, _caTargetAxis, _caTargetDirection, tick);
        } else if (sel.id === 'media_campaign') {
            result = await executeMediaCampaign(_supabase, f.id, n.id, _caTargetAxis, _caTargetDirection, tick);
        } else if (sel.id === 'grassroots_movement') {
            result = await executeGrassrootsMovement(_supabase, f.id, n.id, _caTargetAxis, _caTargetDirection, tick);
        } else if (sel.id === 'press_conference') {
            // Press Conference: base -2 to +2 momentum, +1 if opposition, +2 if gov with approval >= 40
            const { deductAP } = await import('./game/config.js');
            const { getTraitAPModifier: _getTraitModPC } = await import('./game/party-leadership.js');
            const pressCost = Math.max(1, 2 + _getTraitModPC('press_conference', f, tick));
            const apResult = await deductAP(_supabase, f.id, pressCost, { reason: 'press_conference', detail: 'Press Conference', tick });
            if (!apResult.success) { result = { success: false, error: apResult.error || 'Insufficient AP' }; }
            else {
                let baseRoll = Math.floor(Math.random() * 5) - 2; // -2 to +2
                if (!_caIsGoverning) baseRoll += 1; // opposition bonus
                else if ((n.gov_approval || 0) >= 40) baseRoll += 2; // government with decent approval
                // Give momentum via atomic RPC (3-pillar system) — label+tick for log
                const sign = baseRoll >= 0 ? '+' : '';
                const { error: momErr } = await _supabase.rpc('adjust_momentum', {
                    p_faction_id: f.id, p_delta: baseRoll,
                    p_label: `Press Conference (${sign}${baseRoll})`, p_tick: tick
                });
                if (momErr) console.warn('[PressConference] Momentum RPC failed:', momErr.message);
                await _supabase.from('campaign_actions').insert({
                    party_id: f.id, nation_id: n.id, action_type: 'press_conference',
                    ap_cost: pressCost, tick_performed: tick, result: { momentumDelta: baseRoll }
                });
                result = { success: true, newAp: apResult.newAp, headline: 'Press Conference',
                    effects: [{ label: 'Press Coverage', value: `${sign}${baseRoll}` }],
                    outcomeName: `Press conference — ${sign}${baseRoll} momentum` };
            }
        } else if (sel.id === 'outreach') {
            // Community Outreach: +3 platform appeal, escalating cost (base 3 + escalation)
            const { deductAP: _deductAP2 } = await import('./game/config.js');
            const { getTraitAPModifier: _getTraitMod2 } = await import('./game/party-leadership.js');
            const outreachCost = Math.max(1, 3 + (_caOutreachEscalation || 0) + _getTraitMod2('outreach', f, tick));
            const apResult = await _deductAP2(_supabase, f.id, outreachCost, { reason: 'outreach', detail: 'Community Outreach', tick });
            if (!apResult.success) { result = { success: false, error: apResult.error || 'Insufficient AP' }; }
            else {
                const { data: standing } = await _supabase.from('faction_electoral_standing')
                    .select('id, platform_appeal').eq('faction_id', f.id).eq('nation_id', n.id).maybeSingle();
                if (standing) {
                    const newAppeal = Math.min(100, (Number(standing.platform_appeal) || 0) + 3);
                    await _supabase.from('faction_electoral_standing').update({ platform_appeal: newAppeal }).eq('id', standing.id);
                }
                await _supabase.from('campaign_actions').insert({
                    party_id: f.id, nation_id: n.id, action_type: 'outreach',
                    ap_cost: outreachCost, tick_performed: tick, result: { appealBoost: 3 }
                });
                result = { success: true, newAp: apResult.newAp, headline: 'Community Outreach',
                    effects: [{ label: 'Appeal', value: '+3' }],
                    outcomeName: 'Community outreach — +3 platform appeal' };
            }
        } else if (sel.id === 'pivot') {
            result = await executeIdeologicalPivot(_supabase, f.id, n.id, _caTargetAxis, _caTargetDirection, tick);
            if (result.success) {
                // Refresh cached faction data for pivot count
                const { data: freshFaction } = await _supabase.from('factions')
                    .select('pivot_count, pivot_last_tick, pivot_cycle_start_tick')
                    .eq('id', f.id).single();
                if (freshFaction) {
                    f.pivot_count = freshFaction.pivot_count;
                    f.pivot_last_tick = freshFaction.pivot_last_tick;
                    f.pivot_cycle_start_tick = freshFaction.pivot_cycle_start_tick;
                }
                _caPivotIdeo = null; // force reload
            }
        }
    } catch (err) {
        console.error('Campaign action error:', err);
        _showToast('Action failed: ' + err.message);
        if (btn) { btn.classList.remove('disabled'); btn.textContent = `Confirm — ${cost} AP`; }
        return;
    }

    if (!result || !result.success) {
        _showToast(result?.message || result?.error || 'Action failed.');
        if (btn) { btn.classList.remove('disabled'); btn.textContent = `Confirm — ${cost} AP`; }
        return;
    }

    // Update local AP and refresh from server
    f.action_points = result.newAp ?? ((f.action_points ?? 0) - cost);
    const freshAp = await refreshAP(f.id);
    if (freshAp !== undefined) f.action_points = freshAp;

    // Show result
    _caResult = result;

    // Re-render
    await renderDemocracyActions(n, f, _currentShard, _currentAllParties);
    // Refresh stance summary on main tab + portfolio on actions page after stance actions
    if (sel.id === 'take_stance') {
        _renderStanceSummaryStrip(f.id, n.id);
        const spContainer = document.getElementById('ca-stance-portfolio-container');
        if (spContainer) {
            spContainer.querySelector('.sp-card')?.remove();
            _renderStancePortfolio(spContainer, f, n);
        }
    }
}


/* ═══════════════════════════════════════════════════════════════════
   ELECTORATE IDEOLOGY SPREAD TAB
   ═══════════════════════════════════════════════════════════════════ */

// Axes in display order for the electorate spread
const ES_AXES = [
    { key: 'security_freedom',           blocKey: 'axis_security_freedom',           leftLabel: 'Security',      rightLabel: 'Freedom' },
    { key: 'tradition_progress',         blocKey: 'axis_tradition_progress',         leftLabel: 'Tradition',     rightLabel: 'Progress' },
    { key: 'individualism_collectivism', blocKey: 'axis_individualism_collectivism', leftLabel: 'Individualism', rightLabel: 'Collectivism' },
    { key: 'globalism_nationalism',      blocKey: 'axis_globalism_nationalism',      leftLabel: 'Globalism',     rightLabel: 'Nationalism' },
    { key: 'liberty_equality',           blocKey: 'axis_liberty_equality',           leftLabel: 'Liberty',       rightLabel: 'Equality' },
];

// Alignment thresholds (distance in 0-100 normalized space)
const ES_ALIGNED_THRESHOLD = 15;
const ES_PARTIAL_THRESHOLD = 25;

/**
 * Calculate centrist/moderate/radical zone boundaries for an axis.
 * Asymmetric: radical zone grows on the side the mean leans toward + with polarization.
 *
 * @param {number} mean - Electorate mean (0-100)
 * @param {number} variance - Electorate variance (5-45)
 * @returns {{ zones: Array<{id:string, left:number, width:number, label:string}>, zoneForPos: function }}
 */

async function renderElectorateSpreadTab(playerFaction, nation, allParties, allPartyIdeologies, currentTick) {
    const container = document.getElementById('electorate-spread-container');
    if (!container) return;

    const { data: profile } = await _supabase
        .from('electorate_profile')
        .select('*')
        .eq('nation_id', nation.id)
        .maybeSingle();

    if (!profile) {
        container.innerHTML = '<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No electorate data available.</div>';
        return;
    }

    // Build ideology lookup
    const ideoMap = {};
    for (const row of (allPartyIdeologies || [])) {
        ideoMap[row.faction_id] = row;
    }

    // Compute electorate mean per axis from electorate_profile.
    // Zone variance driven by polarization (primary), stability (secondary), diversity (tertiary).
    // Uses a direct 0-100 → 5-45 mapping so that pol=100 always gives max spread.
    const nationPolarization = Number(nation.polarization ?? 50);
    const nationStability = Number(nation.stability ?? 50);
    const nationDiversity = Number(nation.ethnic_diversity ?? 50);
    // Composite spread score: 0-100. Polarization is the primary driver.
    // pol=100 alone → spreadScore ~90. Low stability and high diversity push it further.
    const spreadScore = Math.min(100, Math.max(0,
        nationPolarization * 0.9 +
        (100 - nationStability) * 0.07 +
        nationDiversity * 0.03
    ));
    const zoneVariance = 5 + (spreadScore / 100) * 40; // 0→5, 100→45
    const electorateStats = {};
    for (const ax of ES_AXES) {
        const mean = Number(profile['ideo_mean_' + ax.key] ?? 50);
        electorateStats[ax.key] = { mean, zoneVariance };
    }

    // Build party data (all parties including player)
    const parties = (allParties || []).map(p => {
        const ideo = ideoMap[p.id] || {};
        const isPlayer = p.id === playerFaction.id;
        return {
            id: p.id,
            abbr: p.abbreviation || '??',
            color: p.party_color || '#888',
            isPlayer,
            ideology: {
                security_freedom: Number(ideo.security_freedom ?? 0),
                tradition_progress: Number(ideo.tradition_progress ?? 0),
                liberty_equality: Number(ideo.liberty_equality ?? 0),
                globalism_nationalism: Number(ideo.globalism_nationalism ?? 0),
                individualism_collectivism: Number(ideo.individualism_collectivism ?? 0),
            }
        };
    });

    // Player party ideology for alignment computation
    const playerIdeo = ideoMap[playerFaction.id] || {};

    // Toggle state for rival parties
    const toggleState = {};
    const rivals = parties.filter(p => !p.isPlayer);
    for (const r of rivals) toggleState[r.id] = true;

    // Compute alignment stats
    let alignedCount = 0, partialCount = 0, misalignedCount = 0;
    let totalAlignmentScore = 0;

    function getMatchInfo(axisKey) {
        const playerScore = Number(playerIdeo[axisKey] ?? 0);
        const playerNorm = (playerScore + 100) / 2;
        const eMean = electorateStats[axisKey].mean;
        const gap = Math.abs(playerNorm - eMean);

        if (gap <= ES_ALIGNED_THRESHOLD) return { cls: 'es-match-yes', label: '✓ Aligned', gap };
        if (gap <= ES_PARTIAL_THRESHOLD) return { cls: 'es-match-part', label: '~ Partial', gap };
        return { cls: 'es-match-no', label: '✗ Misaligned', gap };
    }

    for (const ax of ES_AXES) {
        const m = getMatchInfo(ax.key);
        if (m.cls === 'es-match-yes') alignedCount++;
        else if (m.cls === 'es-match-part') partialCount++;
        else misalignedCount++;
        // Alignment score: 100 - gap, clamped 0-100
        totalAlignmentScore += Math.max(0, 100 - m.gap);
    }
    const avgAlignment = Math.round(totalAlignmentScore / ES_AXES.length);
    const alignColor = avgAlignment >= 65 ? 'var(--dgreen)' : avgAlignment >= 45 ? 'var(--damber)' : 'var(--dred)';

    function render() {
        // Build axis blocks
        let axesHtml = '';
        for (let i = 0; i < ES_AXES.length; i++) {
            const ax = ES_AXES[i];
            const stats = electorateStats[ax.key];
            const match = getMatchInfo(ax.key);
            const eMean = stats.mean;
            const eSpread = stats.zoneVariance;

            // Variance band: mean ± spread, clamped to 0-100 (driven by nation polarization)
            const varLeft = Math.max(0, eMean - eSpread);
            const varWidth = Math.min(100, eMean + eSpread) - varLeft;

            // Electorate description: combines mean lean + polarization shape
            const polLevel = nationPolarization >= 76 ? 'deeply divided'
                           : nationPolarization >= 51 ? 'polarized'
                           : nationPolarization >= 26 ? 'moderately divided'
                           : 'near centrist';
            let leanText;
            if (eMean < 45) {
                leanText = `Electorate is <strong>${polLevel}</strong>, leans ${escapeHtml(ax.leftLabel)} — mean ${Math.round(eMean)} / 100`;
            } else if (eMean > 55) {
                leanText = `Electorate is <strong>${polLevel}</strong>, leans ${escapeHtml(ax.rightLabel)} — mean ${Math.round(eMean)} / 100`;
            } else {
                leanText = `Electorate is <strong>${polLevel}</strong> — mean ${Math.round(eMean)} / 100`;
            }

            // Party markers
            let markersHtml = '';
            for (let pi = 0; pi < parties.length; pi++) {
                const p = parties[pi];
                const rawScore = p.ideology[ax.key];
                const normPos = (rawScore + 100) / 2;
                const labelPos = pi % 2 === 0 ? '' : 'es-below';
                const hiddenCls = (!p.isPlayer && !toggleState[p.id]) ? 'es-hidden' : '';

                if (p.isPlayer) {
                    markersHtml += `
                    <div class="es-pm ${hiddenCls}" data-es-party="${p.id}" style="left:${normPos}%">
                        <div class="es-pm-bar" style="background:${p.color}"></div>
                        <div class="es-pm-ring" style="border-color:${p.color}"></div>
                        <div class="es-pm-dot" style="background:${p.color}"></div>
                        <div class="es-pm-label" style="color:${p.color}">${escapeHtml(p.abbr)}</div>
                    </div>`;
                } else {
                    markersHtml += `
                    <div class="es-pm ${hiddenCls}" data-es-party="${p.id}" style="left:${normPos}%">
                        <div class="es-pm-bar" style="background:${p.color}"></div>
                        <div class="es-pm-dot" style="background:${p.color}"></div>
                        <div class="es-pm-label ${labelPos}" style="color:${p.color}">${escapeHtml(p.abbr)}</div>
                    </div>`;
                }
            }

            // Gap annotation for misaligned axes
            let gapHtml = '';
            if (match.cls === 'es-match-no') {
                const playerNorm = (Number(playerIdeo[ax.key] ?? 0) + 100) / 2;
                const gapLeft = Math.min(playerNorm, eMean);
                const gapWidth = Math.abs(playerNorm - eMean);
                gapHtml = `<div class="es-gap" style="left:${gapLeft}%;width:${gapWidth}%">
                    <div class="es-gap-label">${Math.round(match.gap)}pt gap</div>
                </div>`;
            }

            // Zone overlays (centrist/moderate/radical) — use nation polarization for zone width
            const { zones, zoneForPos } = calculateIdeologyZones(eMean, stats.zoneVariance);
            let zonesHtml = '';
            const zoneColors = {
                'radical-left':   'rgba(239,68,68,0.10)',
                'moderate-left':  'rgba(251,191,36,0.07)',
                'centrist':       'rgba(74,222,128,0.08)',
                'moderate-right': 'rgba(251,191,36,0.07)',
                'radical-right':  'rgba(239,68,68,0.10)',
            };
            const zoneBorders = {
                'radical-left':   'rgba(239,68,68,0.25)',
                'moderate-left':  'rgba(251,191,36,0.18)',
                'centrist':       'rgba(74,222,128,0.22)',
                'moderate-right': 'rgba(251,191,36,0.18)',
                'radical-right':  'rgba(239,68,68,0.25)',
            };
            const zoneLabelColors = {
                'radical-left':   'rgba(239,68,68,0.50)',
                'moderate-left':  'rgba(251,191,36,0.45)',
                'centrist':       'rgba(74,222,128,0.50)',
                'moderate-right': 'rgba(251,191,36,0.45)',
                'radical-right':  'rgba(239,68,68,0.50)',
            };
            // Remap zone positions from track-absolute to variance-relative coordinates
            const varRight = varLeft + varWidth;
            for (const z of zones) {
                if (z.width < 1) continue; // skip negligible zones
                // Clip zone to variance band boundaries
                const zLeft = Math.max(z.left, varLeft);
                const zRight = Math.min(z.left + z.width, varRight);
                if (zRight <= zLeft) continue; // zone entirely outside variance band
                // Convert to percentage within variance band
                const relLeft = ((zLeft - varLeft) / varWidth) * 100;
                const relWidth = ((zRight - zLeft) / varWidth) * 100;
                const showLabel = relWidth > 8; // only show label if zone is wide enough
                zonesHtml += `<div class="es-zone" style="left:${relLeft}%;width:${relWidth}%;background:${zoneColors[z.id]};border-left:1px solid ${zoneBorders[z.id]};border-right:1px solid ${zoneBorders[z.id]}">
                    ${showLabel ? `<span class="es-zone-label" style="color:${zoneLabelColors[z.id]}">${z.label}</span>` : ''}
                </div>`;
            }

            // Determine player zone
            const playerNormPos = (Number(playerIdeo[ax.key] ?? 0) + 100) / 2;
            const playerZone = zoneForPos(playerNormPos);
            const playerZoneLabel = zones.find(z => z.id === playerZone)?.label || '';

            // Vote-splitting: find rival parties in the same zone on this axis
            const sameZoneRivals = [];
            for (const p of parties) {
                if (p.isPlayer) continue;
                const rivalNorm = (p.ideology[ax.key] + 100) / 2;
                if (zoneForPos(rivalNorm) === playerZone) {
                    sameZoneRivals.push(p);
                }
            }

            // Build readable zone name with axis direction
            // e.g. "moderate-right" on liberty/equality axis → "Moderate Equality"
            let zoneDirectionLabel = playerZoneLabel; // "Centrist", "Moderate", "Radical"
            if (playerZone.endsWith('-left')) {
                zoneDirectionLabel += ' ' + ax.leftLabel;
            } else if (playerZone.endsWith('-right')) {
                zoneDirectionLabel += ' ' + ax.rightLabel;
            }

            let splitHtml = '';
            if (sameZoneRivals.length > 0) {
                const rivalNames = sameZoneRivals.map(r =>
                    `<strong style="color:${r.color}">${escapeHtml(r.abbr)}</strong>`
                ).join(' and ');
                splitHtml = `<div class="es-split-note">You are <strong>${escapeHtml(zoneDirectionLabel)}</strong> and currently splitting votes with ${rivalNames}</div>`;
            } else {
                splitHtml = `<div class="es-split-note es-split-clear">You are <strong>${escapeHtml(zoneDirectionLabel)}</strong> — no parties competing in your zone</div>`;
            }

            const isLast = i === ES_AXES.length - 1;

            axesHtml += `
            <div class="es-axis-block">
                <div class="es-axis-header">
                    <div class="es-axis-info">
                        <div class="es-axis-name">${escapeHtml(ax.leftLabel)} / ${escapeHtml(ax.rightLabel)}</div>
                        <div class="es-axis-read">${leanText}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <span class="es-zone-badge" data-zone="${playerZone}">${playerZoneLabel}</span>
                        <div class="es-match ${match.cls}">${match.label}</div>
                    </div>
                </div>
                <div class="es-spectrum">
                    <div class="es-pole-row">
                        <span class="es-pole">${escapeHtml(ax.leftLabel)}</span>
                        <span class="es-pole">${escapeHtml(ax.rightLabel)}</span>
                    </div>
                    <div class="es-track">
                        <div class="es-center"><div class="es-center-label">Center</div></div>
                        <div class="es-variance" style="left:${varLeft}%;width:${varWidth}%">${zonesHtml}</div>
                        <div class="es-emean" style="left:${eMean}%"><div class="es-emean-label">Electorate</div></div>
                        ${gapHtml}
                        ${markersHtml}
                    </div>
                </div>
                ${splitHtml}
            </div>
            ${isLast ? '' : '<div class="es-div"></div>'}`;
        }

        // Legend pills
        const playerParty = parties.find(p => p.isPlayer);
        let legendHtml = '';
        if (playerParty) {
            const pFaint = hexToRgba(playerParty.color, 0.10);
            const pBorder = hexToRgba(playerParty.color, 0.25);
            legendHtml += `<div class="es-leg-pill" style="color:${playerParty.color};background:${pFaint};border-color:${pBorder}">
                <div class="es-leg-dot" style="background:${playerParty.color}"></div>${escapeHtml(playerParty.abbr)} <span style="opacity:.55;font-size:7px">YOU</span>
            </div>`;
        }
        for (const r of rivals) {
            const rFaint = hexToRgba(r.color, 0.10);
            const rBorder = hexToRgba(r.color, 0.25);
            const dimCls = toggleState[r.id] ? '' : 'es-dimmed';
            legendHtml += `<div class="es-leg-pill ${dimCls}" data-es-toggle="${r.id}" style="color:${r.color};background:${rFaint};border-color:${rBorder}">
                <div class="es-leg-dot" style="background:${r.color}"></div>${escapeHtml(r.abbr)}
            </div>`;
        }

        // Spread driver indicators
        const spreadDrivers = [];
        if (nationPolarization >= 65) {
            const intensity = nationPolarization >= 85 ? 'High' : 'Elevated';
            spreadDrivers.push({ label: `${intensity} Polarization`, stat: Math.round(nationPolarization), color: 'var(--dred)', note: 'pushing the electorate to the fringes' });
        }
        if (nationStability <= 35) {
            const intensity = nationStability <= 15 ? 'Very low' : 'Low';
            spreadDrivers.push({ label: `${intensity} Stability`, stat: Math.round(nationStability), color: 'var(--damber)', note: 'pushing the electorate to the fringes' });
        }
        if (nationDiversity >= 65) {
            spreadDrivers.push({ label: 'High Ethnic Diversity', stat: Math.round(nationDiversity), color: 'var(--dteal)', note: 'widening ideological divisions' });
        }
        if (nationPolarization <= 25 && nationStability >= 65) {
            spreadDrivers.push({ label: 'Stable & United', stat: null, color: 'var(--dgreen)', note: 'electorate is ideologically consolidated' });
        }
        let spreadDriversHtml = '';
        if (spreadDrivers.length > 0) {
            spreadDriversHtml = '<div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 16px;border-bottom:1px solid var(--dborder-hair)">';
            for (const d of spreadDrivers) {
                spreadDriversHtml += `<div style="font-family:var(--dfont-mono);font-size:10px;color:${d.color};display:flex;align-items:center;gap:4px">`;
                spreadDriversHtml += `<span style="font-weight:700">${d.label}</span>`;
                if (d.stat !== null) spreadDriversHtml += `<span style="opacity:0.6">(${d.stat})</span>`;
                spreadDriversHtml += `<span style="color:var(--dtext-3)">— ${d.note}</span>`;
                spreadDriversHtml += `</div>`;
            }
            spreadDriversHtml += '</div>';
        }

        container.innerHTML = `
        <div class="es-page-label">Electorate Ideology Spread — <span class="es-nation">${escapeHtml(nation.name)}</span> · Tick ${currentTick}</div>
        <div class="es-outer">
            <div class="es-hdr">
                <div class="es-hdr-left">
                    <div class="es-hdr-dot"></div>
                    <span class="es-hdr-title">Electorate Ideology Spread</span>
                </div>
                <div class="es-legend" id="es-legend">${legendHtml}</div>
            </div>
            ${spreadDriversHtml}
            <div class="es-body">${axesHtml}</div>
            <div class="es-legend-bar">
                <div class="es-lb-item">
                    <svg width="16" height="16"><circle cx="8" cy="8" r="6" fill="rgba(255,255,255,0.85)"/></svg>
                    <span class="es-lb-text">White dot = electorate mean</span>
                </div>
                <div class="es-lb-item">
                    <svg width="36" height="16"><rect x="0" y="3" width="36" height="10" rx="2" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.10)" stroke-width="1"/></svg>
                    <span class="es-lb-text">Shaded band = voter spread (wider = more polarized)</span>
                </div>
                <div class="es-lb-item">
                    <svg width="16" height="16">
                        <circle cx="8" cy="8" r="5" fill="${playerParty ? playerParty.color : '#9b7ec8'}"/>
                        <circle cx="8" cy="8" r="8" fill="none" stroke="${playerParty ? playerParty.color : '#9b7ec8'}" stroke-width="1.5" opacity="0.55"/>
                    </svg>
                    <span class="es-lb-text">Ring = your party</span>
                </div>
                <div class="es-lb-item">
                    <svg width="36" height="16"><line x1="0" y1="8" x2="36" y2="8" stroke="rgba(217,83,79,0.7)" stroke-width="2" stroke-dasharray="4,3"/></svg>
                    <span class="es-lb-text">Dashed = alignment gap</span>
                </div>
                <div class="es-lb-item">
                    <span class="es-lb-text" style="font-style:italic">Click party pills to show/hide</span>
                </div>
            </div>
        </div>`;

        // Wire toggle clicks
        container.querySelectorAll('[data-es-toggle]').forEach(pill => {
            pill.addEventListener('click', () => {
                const pid = pill.getAttribute('data-es-toggle');
                toggleState[pid] = !toggleState[pid];
                pill.classList.toggle('es-dimmed', !toggleState[pid]);
                container.querySelectorAll(`[data-es-party="${pid}"]`).forEach(m => {
                    m.classList.toggle('es-hidden', !toggleState[pid]);
                });
            });
        });
    }

    render();

    // Phase 6 (pillar cards) removed from Electorate tab
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 7: STANCE PORTFOLIO + TAKE STANCE UI
// ═══════════════════════════════════════════════════════════════════

/**
 * Load the player's active stances + issue salience and render the
 * Active Stance Portfolio card in the Electorate tab.
 */
async function _renderStancePortfolio(container, faction, nation) {
    // Load stances, issue states, and shard tick in parallel
    const [stancesRes, issueStatesRes, shardRes] = await Promise.all([
        _supabase.from('faction_issue_stance')
            .select('*')
            .eq('faction_id', faction.id)
            .eq('nation_id', nation.id),
        _supabase.from('issue_state')
            .select('issue_id, salience, owned_by, pioneer_faction_id')
            .eq('nation_id', nation.id),
        _supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single(),
    ]);

    if (stancesRes.error) console.error('[Politics] Failed to load stances:', stancesRes.error.message);
    if (issueStatesRes.error) console.error('[Politics] Failed to load issue states:', issueStatesRes.error.message);
    const stances = stancesRes.data || [];
    const issueStates = issueStatesRes.data || [];
    const currentTick = shardRes.data?.current_tick || 0;

    // Build issue state lookup
    const issueStateMap = {};
    for (const is of issueStates) issueStateMap[is.issue_id] = is;

    const maxStances = STANCE_CONFIG.MAX_STANCES;
    const atCap = stances.length >= maxStances;

    // Build stance rows
    let stanceRowsHtml = '';
    if (stances.length === 0) {
        stanceRowsHtml = '<div class="sp-empty">No active stances. Take a stance on an issue to build platform appeal.</div>';
    } else {
        for (const s of stances) {
            const issueDef = ISSUE_DEFS[s.issue_id];
            if (!issueDef) continue;
            const axisInfo = IDEOLOGY_AXES.find(a => a.key === s.axis);
            const sideLabel = s.side === 'left' ? axisInfo?.leftLabel : axisInfo?.rightLabel;
            const sideColor = s.side === 'left' ? axisInfo?.leftColor : axisInfo?.rightColor;
            const strength = Number(s.strength ?? 0);
            const decayRate = Number(s.decay_rate ?? 0);
            const ticksHeld = Number(s.ticks_held ?? 0);

            // Strength thresholds for visual feedback
            const isFading = strength <= 40;
            const isWeak = strength <= 20;
            const strengthColor = isWeak ? 'var(--dred)' : isFading ? 'var(--damber)' : 'var(--dgreen)';

            // Issue salience
            const issueState = issueStateMap[s.issue_id];
            const salience = Number(issueState?.salience ?? 30);

            // Consistency badge
            const consistencyBadge = s.ideologically_consistent
                ? ''
                : '<span class="sp-badge sp-badge--warn">INCONSISTENT</span>';
            const pioneerBadge = s.is_pioneer
                ? '<span class="sp-badge sp-badge--good">PIONEER</span>'
                : '';
            const fadingBadge = isFading
                ? `<span class="sp-badge sp-badge--fade">${isWeak ? 'EXPIRING' : 'FADING'}</span>`
                : '';

            stanceRowsHtml += `
            <div class="sp-row" data-stance-issue="${s.issue_id}">
                <div class="sp-row-top">
                    <div class="sp-row-left">
                        <span class="sp-issue-name">${escapeHtml(issueDef.label)}</span>
                        <span class="sp-side-pill" style="color:${sideColor};border-color:${sideColor}">${s.intensity} ${sideLabel}</span>
                        ${pioneerBadge}${consistencyBadge}${fadingBadge}
                    </div>
                    <div class="sp-row-right">
                        <span class="sp-salience" title="Issue salience">Salience: ${salience.toFixed(0)}</span>
                        <span class="sp-ticks">Held ${ticksHeld} ticks</span>
                    </div>
                </div>
                <div class="sp-bar-row">
                    <div class="sp-bar-track">
                        <div class="sp-bar-fill" style="width:${strength}%;background:${strengthColor}"></div>
                    </div>
                    <span class="sp-str-val" style="color:${strengthColor}">${strength.toFixed(0)}</span>
                    <span class="sp-decay" style="color:var(--dred)">-${decayRate}/tick</span>
                </div>
                <div class="sp-row-actions">
                    <button class="sp-btn sp-btn--reinforce" data-stance-action="reinforce" data-stance-issue="${s.issue_id}" data-stance-axis="${s.axis}" data-stance-side="${s.side}" data-stance-intensity="${s.intensity}">Reinforce</button>
                    <button class="sp-btn sp-btn--modify" data-stance-action="modify" data-stance-issue="${s.issue_id}">Modify</button>
                </div>
            </div>`;
        }
    }

    const portfolioHtml = `
    <div class="sp-card" style="margin-top:20px;max-width:780px;">
        <div class="sp-card-header">
            <div class="sp-card-title">Active Stance Portfolio</div>
            <div class="sp-card-count">${stances.length} / ${maxStances}</div>
        </div>
        <div class="sp-stances">${stanceRowsHtml}</div>
        <div class="sp-footer">
            <button class="sp-btn sp-btn--new${atCap ? ' sp-btn--disabled' : ''}" id="sp-new-stance-btn" ${atCap ? 'disabled title="Maximum stances reached (5/5)"' : ''}>
                + New Stance${atCap ? ' (5/5)' : ''}
            </button>
            <span class="sp-footer-hint">${STANCE_CONFIG.AP_COST} AP · ${STANCE_CONFIG.COOLDOWN_WINDOW}-tick cooldown</span>
        </div>
    </div>`;

    container.insertAdjacentHTML('beforeend', portfolioHtml);

    // Wire button handlers
    container.querySelectorAll('[data-stance-action="reinforce"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            if ((faction.action_points || 0) < STANCE_CONFIG.AP_COST) {
                _showToast(`Need ${STANCE_CONFIG.AP_COST} AP to reinforce stance.`);
                return;
            }
            const issueId = btn.dataset.stanceIssue;
            const axis = btn.dataset.stanceAxis;
            const side = btn.dataset.stanceSide;
            const intensity = btn.dataset.stanceIntensity;
            btn.disabled = true;
            btn.textContent = 'Reinforcing...';
            try {
            const result = await executeTakeStance(_supabase, faction.id, nation.id, issueId, axis, side, intensity, currentTick);
            if (result.success) {
                // Update client AP from server
                if (result.newAp != null) {
                    faction.action_points = result.newAp;
                    if (_currentFaction) _currentFaction.action_points = result.newAp;
                }
                const freshAp3 = await refreshAP(faction.id);
                if (freshAp3 !== undefined) {
                    faction.action_points = freshAp3;
                    if (_currentFaction) _currentFaction.action_points = freshAp3;
                }
                // Re-render the portfolio
                container.querySelector('.sp-card')?.remove();
                await _renderStancePortfolio(container, faction, nation);
                _renderStanceSummaryStrip(faction.id, nation.id);
            } else {
                _showToast(result.message || 'Failed to reinforce stance.');
                btn.disabled = false;
                btn.textContent = 'Reinforce';
            }
            } catch (e) { _showToast('Reinforce failed: ' + e.message); btn.disabled = false; btn.textContent = 'Reinforce'; }
        });
    });

    container.querySelectorAll('[data-stance-action="modify"]').forEach(btn => {
        btn.addEventListener('click', () => {
            _openTakeStanceModal(faction, nation, currentTick, issueStateMap, stances, btn.dataset.stanceIssue);
        });
    });

    const newBtn = document.getElementById('sp-new-stance-btn');
    if (newBtn && !atCap) {
        newBtn.addEventListener('click', () => {
            _openTakeStanceModal(faction, nation, currentTick, issueStateMap, stances, null);
        });
    }
}

/**
 * Open the Take Stance modal. Pre-selects an issue if modifying an existing stance.
 */
function _openTakeStanceModal(faction, nation, currentTick, issueStateMap, existingStances, preselectedIssue) {
    // Remove any existing modal
    document.getElementById('stance-modal-overlay')?.remove();

    const existingIssueIds = new Set(existingStances.map(s => s.issue_id));
    const atCap = existingStances.length >= STANCE_CONFIG.MAX_STANCES;

    // Build issue options sorted by salience (descending)
    const issueOptions = ISSUE_IDS
        .map(id => ({
            id,
            def: ISSUE_DEFS[id],
            salience: Number(issueStateMap[id]?.salience ?? 30),
            hasStance: existingIssueIds.has(id),
        }))
        .sort((a, b) => b.salience - a.salience);

    let issueListHtml = '';
    for (const opt of issueOptions) {
        const disabled = !opt.hasStance && atCap;
        const selected = opt.id === preselectedIssue;
        const salienceColor = opt.salience >= 60 ? 'var(--dred)' : opt.salience >= 40 ? 'var(--damber)' : 'var(--dtext-3)';
        const axisLabels = opt.def.axes.map(ak => {
            const ax = IDEOLOGY_AXES.find(a => a.key === ak);
            return ax ? `${ax.leftLabel}/${ax.rightLabel}` : ak;
        }).join(', ');

        issueListHtml += `
        <div class="sm-issue${selected ? ' sm-issue--selected' : ''}${disabled ? ' sm-issue--disabled' : ''}"
             data-sm-issue="${opt.id}" ${disabled ? '' : 'role="button" tabindex="0"'}>
            <div class="sm-issue-top">
                <span class="sm-issue-name">${escapeHtml(opt.def.label)}</span>
                ${opt.hasStance ? '<span class="sm-issue-badge">HAS STANCE</span>' : ''}
            </div>
            <div class="sm-issue-meta">
                <span class="sm-issue-salience" style="color:${salienceColor}">Salience: ${opt.salience.toFixed(0)}</span>
                <span class="sm-issue-axes">${axisLabels}</span>
            </div>
        </div>`;
    }

    const modalHtml = `
    <div class="modal-overlay active" id="stance-modal-overlay">
        <div class="sm-modal">
            <div class="sm-header">
                <span class="sm-title">Take a Stance</span>
                <button class="sm-close" id="sm-close-btn">&times;</button>
            </div>
            <div class="sm-body">
                <div class="sm-section-label">Select Issue</div>
                <div class="sm-issue-list">${issueListHtml}</div>
                <div id="sm-config-area"></div>
            </div>
            <div class="sm-footer" id="sm-footer" style="display:none">
                <button class="sp-btn sp-btn--new" id="sm-confirm-btn" disabled>Confirm Stance (${STANCE_CONFIG.AP_COST} AP)</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // State
    let selectedIssue = preselectedIssue;
    let selectedAxis = null;
    let selectedSide = null;
    let selectedIntensity = 'moderate';

    function updateConfigArea() {
        const area = document.getElementById('sm-config-area');
        const footer = document.getElementById('sm-footer');
        if (!area || !selectedIssue) {
            if (area) area.innerHTML = '';
            if (footer) footer.style.display = 'none';
            return;
        }

        const issueDef = ISSUE_DEFS[selectedIssue];
        if (!issueDef) return;

        // Auto-select axis if issue only has one
        if (issueDef.axes.length === 1 && !selectedAxis) {
            selectedAxis = issueDef.axes[0];
        }

        // Axis selector
        let axisHtml = '<div class="sm-section-label" style="margin-top:14px;">Choose Axis</div><div class="sm-axis-list">';
        for (const ak of issueDef.axes) {
            const ax = IDEOLOGY_AXES.find(a => a.key === ak);
            if (!ax) continue;
            const sel = ak === selectedAxis;
            axisHtml += `<div class="sm-axis-opt${sel ? ' sm-axis-opt--selected' : ''}" data-sm-axis="${ak}">
                <span style="color:${ax.leftColor}">${ax.leftLabel}</span> / <span style="color:${ax.rightColor}">${ax.rightLabel}</span>
            </div>`;
        }
        axisHtml += '</div>';

        // Side selector (only if axis selected)
        let sideHtml = '';
        if (selectedAxis) {
            const ax = IDEOLOGY_AXES.find(a => a.key === selectedAxis);
            sideHtml = `<div class="sm-section-label" style="margin-top:14px;">Choose Side</div><div class="sm-side-list">
                <div class="sm-side-opt${selectedSide === 'left' ? ' sm-side-opt--selected' : ''}" data-sm-side="left" style="border-color:${ax.leftColor}">
                    <span style="color:${ax.leftColor};font-weight:700">${ax.leftLabel}</span>
                </div>
                <div class="sm-side-opt${selectedSide === 'right' ? ' sm-side-opt--selected' : ''}" data-sm-side="right" style="border-color:${ax.rightColor}">
                    <span style="color:${ax.rightColor};font-weight:700">${ax.rightLabel}</span>
                </div>
            </div>`;
        }

        // Intensity selector (only if side selected)
        let intensityHtml = '';
        if (selectedSide) {
            const sAx = IDEOLOGY_AXES.find(a => a.key === selectedAxis);
            const sSideLabel = selectedSide === 'left' ? (sAx?.leftLabel ?? 'Left') : (sAx?.rightLabel ?? 'Right');
            const sSideColor = selectedSide === 'left' ? (sAx?.leftColor ?? '#ccc') : (sAx?.rightColor ?? '#ccc');
            intensityHtml = `<div class="sm-section-label" style="margin-top:14px;">Intensity</div><div class="sm-intensity-list">`;
            for (const [key, cfg] of Object.entries(STANCE_CONFIG.INTENSITY)) {
                const sel = key === selectedIntensity;
                intensityHtml += `<div class="sm-int-opt${sel ? ' sm-int-opt--selected' : ''}" data-sm-intensity="${key}">
                    <span class="sm-int-name">${key}</span>
                    <span class="sm-int-meta">Strength ${cfg.strength} · Decay ${cfg.decay_rate}/tick</span>
                    <span class="sm-int-meta" style="color:${sSideColor};font-weight:600">+${cfg.ideology_shift} ${sSideLabel}</span>
                </div>`;
            }
            intensityHtml += '</div>';

            // Preview summary when intensity is selected
            if (selectedIntensity) {
                const selCfg = STANCE_CONFIG.INTENSITY[selectedIntensity];
                const issueDef2 = ISSUE_DEFS[selectedIssue];
                intensityHtml += `<div style="margin-top:10px;padding:8px 10px;background:rgba(56,189,248,0.04);border:1px solid rgba(56,189,248,0.15);border-radius:3px;font-family:var(--dfont-mono);font-size:10px;">
                    <div style="color:var(--dtext-1);font-weight:600;margin-bottom:3px">${selectedIntensity.toUpperCase()} ${sSideLabel.toUpperCase()} on ${issueDef2?.label || ''}</div>
                    <div style="color:${sSideColor};font-weight:700">Ideology: +${selCfg.ideology_shift} ${sSideLabel}</div>
                    <div style="color:var(--dtext-3);margin-top:2px">Strength: ${selCfg.strength} · Decay: -${selCfg.decay_rate}/tick</div>
                </div>`;
            }
        }

        area.innerHTML = axisHtml + sideHtml + intensityHtml;

        // Show footer if all selections made
        const allSelected = selectedIssue && selectedAxis && selectedSide && selectedIntensity;
        footer.style.display = allSelected ? 'flex' : 'none';
        const confirmBtn = document.getElementById('sm-confirm-btn');
        if (confirmBtn) confirmBtn.disabled = !allSelected;

        // Wire axis clicks
        area.querySelectorAll('[data-sm-axis]').forEach(el => {
            el.addEventListener('click', () => {
                selectedAxis = el.dataset.smAxis;
                selectedSide = null; // reset downstream
                updateConfigArea();
            });
        });

        // Wire side clicks
        area.querySelectorAll('[data-sm-side]').forEach(el => {
            el.addEventListener('click', () => {
                selectedSide = el.dataset.smSide;
                updateConfigArea();
            });
        });

        // Wire intensity clicks
        area.querySelectorAll('[data-sm-intensity]').forEach(el => {
            el.addEventListener('click', () => {
                selectedIntensity = el.dataset.smIntensity;
                updateConfigArea();
            });
        });
    }

    // Wire issue clicks
    document.querySelectorAll('[data-sm-issue]').forEach(el => {
        if (el.classList.contains('sm-issue--disabled')) return;
        el.addEventListener('click', () => {
            document.querySelectorAll('.sm-issue').forEach(i => i.classList.remove('sm-issue--selected'));
            el.classList.add('sm-issue--selected');
            selectedIssue = el.dataset.smIssue;
            selectedAxis = null;
            selectedSide = null;
            updateConfigArea();
        });
    });

    // Wire close
    document.getElementById('sm-close-btn')?.addEventListener('click', () => {
        document.getElementById('stance-modal-overlay')?.remove();
    });
    document.getElementById('stance-modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'stance-modal-overlay') {
            document.getElementById('stance-modal-overlay')?.remove();
        }
    });

    // Wire confirm
    document.getElementById('sm-confirm-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('sm-confirm-btn');
        if (!btn || btn.disabled) return;
        btn.disabled = true;
        btn.textContent = 'Taking stance...';

        const result = await executeTakeStance(_supabase, faction.id, nation.id, selectedIssue, selectedAxis, selectedSide, selectedIntensity, currentTick);

        if (result.success) {
            // Update client AP from server
            if (result.newAp != null) {
                faction.action_points = result.newAp;
                if (_currentFaction) _currentFaction.action_points = result.newAp;
            }
            const freshAp4 = await refreshAP(faction.id);
            if (freshAp4 !== undefined) {
                faction.action_points = freshAp4;
                if (_currentFaction) _currentFaction.action_points = freshAp4;
            }
            document.getElementById('stance-modal-overlay')?.remove();
            // Re-render portfolio
            const esContainer = document.getElementById('electorate-spread-container');
            if (esContainer) {
                esContainer.querySelector('.sp-card')?.remove();
                await _renderStancePortfolio(esContainer, faction, nation);
            }
            _renderStanceSummaryStrip(faction.id, nation.id);
        } else {
            _showToast(result.message || 'Failed to take stance.');
            btn.disabled = false;
            btn.textContent = `Confirm Stance (${STANCE_CONFIG.AP_COST} AP)`;
        }
    });

    // Auto-show config if pre-selected
    if (preselectedIssue) {
        updateConfigArea();
    }
}

/**
 * Render a slim stance summary strip inside the Ideology box on the Politics tab.
 * Shows compact pills for each active stance.
 */
async function _renderStanceSummaryStrip(factionId, nationId) {
    const strip = document.getElementById('stance-summary-strip');
    if (!strip) return;

    const { data: stances } = await _supabase
        .from('faction_issue_stance')
        .select('issue_id, axis, side, intensity, strength, decay_rate, ticks_held, is_pioneer, ideologically_consistent')
        .eq('faction_id', factionId)
        .eq('nation_id', nationId);

    const maxStances = STANCE_CONFIG.MAX_STANCES;

    if (!stances || stances.length === 0) {
        strip.innerHTML = `<div style="color:var(--dtext-3);font-size:12px;font-family:var(--dfont-ui);padding:4px 0;">
            No active stances. Take a stance in the <span style="color:var(--dtext-0);font-weight:600">Electorate</span> tab.
        </div>`;
        return;
    }

    let rowsHtml = '';
    for (const s of stances) {
        const issueDef = ISSUE_DEFS[s.issue_id];
        if (!issueDef) continue;
        const axisInfo = IDEOLOGY_AXES.find(a => a.key === s.axis);
        const sideLabel = s.side === 'left' ? axisInfo?.leftLabel : axisInfo?.rightLabel;
        const sideColor = s.side === 'left' ? axisInfo?.leftColor : axisInfo?.rightColor;
        const strength = Number(s.strength ?? 0);
        const decayRate = Number(s.decay_rate ?? 0);
        const ticksHeld = Number(s.ticks_held ?? 0);
        const isWeak = strength <= 20;
        const isFading = strength <= 40;
        const strengthColor = isWeak ? 'var(--dred)' : isFading ? 'var(--damber)' : 'var(--dgreen)';

        const pioneerBadge = s.is_pioneer ? '<span style="font-size:9px;color:#4ade80;font-weight:700;margin-left:4px">PIONEER</span>' : '';
        const consistBadge = s.ideologically_consistent === false ? '<span style="font-size:9px;color:#f97316;font-weight:700;margin-left:4px">INCONSISTENT</span>' : '';
        const fadeBadge = isFading ? `<span style="font-size:9px;color:${strengthColor};font-weight:700;margin-left:4px">${isWeak ? 'EXPIRING' : 'FADING'}</span>` : '';

        rowsHtml += `
        <div style="padding:6px 0;${rowsHtml ? 'border-top:1px solid var(--dborder-0);' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <div style="display:flex;align-items:center;flex-wrap:wrap;gap:2px">
                    <span style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0)">${escapeHtml(issueDef.label)}</span>
                    <span style="font-size:10px;padding:1px 5px;border:1px solid ${sideColor};border-radius:3px;color:${sideColor};margin-left:4px">${s.intensity} ${sideLabel}</span>
                    ${pioneerBadge}${consistBadge}${fadeBadge}
                </div>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3)">Held ${ticksHeld}t</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
                <div style="flex:1;height:6px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden">
                    <div style="width:${strength}%;height:100%;background:${strengthColor};border-radius:2px"></div>
                </div>
                <span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:${strengthColor};width:28px;text-align:right">${strength.toFixed(0)}</span>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dred);width:40px;text-align:right">-${decayRate}/t</span>
            </div>
        </div>`;
    }

    strip.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-family:var(--dfont-mono);font-size:11px;color:var(--dtext-2)">${stances.length} / ${maxStances}</span>
        </div>
        ${rowsHtml}
        <div style="margin-top:8px;font-size:10px;color:var(--dtext-3);font-family:var(--dfont-ui)">Manage stances in the <span style="color:var(--dtext-0);font-weight:600">Electorate</span> tab</div>`;
}

/* ═══════════════════════════════════════════════════════════════════
   VOTERS TAB — REMOVED (replaced by Elections tab with 3-pillar system)
   ═══════════════════════════════════════════════════════════════════ */
/* DELETED: renderVotersTab — 5-pillar system (alignment, appeal, approval, visibility, credibility)
   replaced by 3-pillar Elections tab (governance, momentum, ideology) */
/* ═══════════════════════════════════════════════════════════════════
   OTHER PARTIES TAB — Rival party intelligence cards
   ═══════════════════════════════════════════════════════════════════ */

// Fixed issue order for stance display

// Ideology axes in the spec's display order
const OP_AXES = [
    { key: 'security_freedom',           leftLabel: 'Security',    rightLabel: 'Freedom' },
    { key: 'tradition_progress',         leftLabel: 'Tradition',   rightLabel: 'Progress' },
    { key: 'liberty_equality',           leftLabel: 'Liberty',     rightLabel: 'Equality' },
    { key: 'globalism_nationalism',      leftLabel: 'Globalism',   rightLabel: 'Nationalism' },
    { key: 'individualism_collectivism', leftLabel: 'Individual',  rightLabel: 'Collectivism' },
];

async function renderOtherPartiesTab(playerFaction, nation, allParties, allPartyIdeologies, coalition, totalSeats, currentTick) {
    const container = document.getElementById('other-parties-container');
    if (!container) return;

    // Filter out player's own party
    const rivals = (allParties || []).filter(p => p.id !== playerFaction.id);
    const rivalIds = rivals.map(p => p.id);
    if (rivals.length === 0) {
        container.innerHTML = '<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No rival parties found.</div>';
        return;
    }

    // Build ideology lookup
    const ideoMap = {};
    for (const row of (allPartyIdeologies || [])) {
        ideoMap[row.faction_id] = row;
    }

    // Compute national governance score from current administration stats
    const { data: administration } = await _supabase
        .from('administrations')
        .select('stats_at_start, started_at_tick')
        .eq('nation_id', nation.id)
        .is('ended_at_tick', null)
        .order('started_at_tick', { ascending: false })
        .limit(1)
        .maybeSingle();

    let nationalGovScore = 0;
    if (administration?.stats_at_start) {
        let sum = 0, count = 0;
        for (const key of NATION_STAT_COLUMNS) {
            const dir = statDirectionSign(key);
            if (dir === 0) continue;
            const start = Number(administration.stats_at_start[key] ?? 0);
            const now = Number(nation[key] ?? 0);
            const raw = now - start;
            if (raw === 0) continue;
            sum += raw * dir;
            count++;
        }
        if (count > 0) nationalGovScore = sum / count;
        // Incumbency decay
        const ticksInPower = currentTick - (administration.started_at_tick || currentTick);
        const decayCycles = Math.floor(ticksInPower / 12);
        if (nationalGovScore > 0) nationalGovScore *= Math.pow(0.95, decayCycles);
    }

    // Fetch leader data for each rival (factions table has leader columns)
    const { data: rivalFactionData } = await _supabase
        .from('factions')
        .select('id, leader_first_name, leader_last_name, leader_age, founded_tick, ideology_value_1, ideology_value_2')
        .in('id', rivalIds);
    const factionDataMap = {};
    for (const rd of (rivalFactionData || [])) {
        factionDataMap[rd.id] = rd;
    }

    // Determine coalition membership
    const coalitionPartyIds = (coalition && coalition.party_ids) ? coalition.party_ids : [];
    const coalitionLeadId = coalition ? coalition.lead_party_id : null;

    // Build enriched party objects
    const partyCards = rivals.map(p => {
        const fd = factionDataMap[p.id] || {};
        const ideo = ideoMap[p.id] || {};
        const leaderName = (fd.leader_first_name && fd.leader_last_name)
            ? fd.leader_first_name + ' ' + fd.leader_last_name
            : 'Vacant';
        const leaderAge = fd.leader_age || null;
        const voteShare = Number(p.national_vote_share || 0);

        let status = 'opposition';
        if (coalitionPartyIds.includes(p.id)) {
            status = p.id === coalitionLeadId ? 'governing_head' : 'governing_junior';
        }

        const isGov = status.startsWith('governing');
        const govScore = Math.round((isGov ? nationalGovScore : -nationalGovScore) * 10);

        return {
            id: p.id,
            name: p.faction_name || 'Unknown',
            abbreviation: p.abbreviation || '??',
            color: p.party_color || '#888',
            customLogoUrl: p.custom_logo_url || null,
            partyLogo: p.party_logo || null,
            description: p.party_description || '',
            status,
            foundedTick: fd.founded_tick,
            leaderName,
            leaderAge,
            seats: p.seats || 0,
            totalSeats,
            voteShare,
            govScore,
            ideology: {
                security_freedom: ideo.security_freedom ?? 0,
                tradition_progress: ideo.tradition_progress ?? 0,
                liberty_equality: ideo.liberty_equality ?? 0,
                globalism_nationalism: ideo.globalism_nationalism ?? 0,
                individualism_collectivism: ideo.individualism_collectivism ?? 0,
            },
            stances: [],
        };
    });

    // Default sort by seats descending
    let currentSort = 'seats';
    const sortFns = {
        seats:      (a, b) => b.seats - a.seats,
        vote_share: (a, b) => b.voteShare - a.voteShare,
        approval:   (a, b) => b.govScore - a.govScore,
        alignment:  (a, b) => {
            const aStrength = Object.values(a.ideology).reduce((s, v) => s + Math.abs(v), 0);
            const bStrength = Object.values(b.ideology).reduce((s, v) => s + Math.abs(v), 0);
            return bStrength - aStrength;
        },
    };

    function renderGrid() {
        const sorted = [...partyCards].sort(sortFns[currentSort]);
        const gridHtml = sorted.map(p => renderPartyCard(p, nation)).join('');

        container.innerHTML = `
        <div class="op-top">
            <div class="op-top-left">
                <div class="op-title">Rival Parties — ${escapeHtml(nation.name)}</div>
                <div class="op-note">Stance data based on observable actions. Ideology positions may be estimated.</div>
            </div>
            <div class="op-sort-row">
                <span class="op-sort-label">Sort by</span>
                <button class="op-sort-btn${currentSort === 'seats' ? ' active' : ''}" data-op-sort="seats">Seats</button>
                <button class="op-sort-btn${currentSort === 'vote_share' ? ' active' : ''}" data-op-sort="vote_share">Vote Share</button>
                <button class="op-sort-btn${currentSort === 'approval' ? ' active' : ''}" data-op-sort="approval">Approval</button>
                <button class="op-sort-btn${currentSort === 'alignment' ? ' active' : ''}" data-op-sort="alignment">Alignment</button>
            </div>
        </div>
        <div class="op-grid">${gridHtml}</div>`;

        // Wire sort buttons
        container.querySelectorAll('.op-sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentSort = btn.getAttribute('data-op-sort');
                renderGrid();
            });
        });
    }

    renderGrid();
}

function renderPartyCard(party, nation) {
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

    // Founded
    const founded = party.foundedTick != null ? tickToDate(party.foundedTick) : null;
    const foundedBadge = founded ? `<span class="op-badge op-badge-party" style="color:${c};border-color:${cBorder};font-size:12px">Est. ${escapeHtml(founded)}</span>` : '';

    // Leader badge
    const leaderBadge = `<span class="op-badge op-badge-party" style="color:${c};border-color:${cBorder};font-size:12px">Leader: ${escapeHtml(party.leaderName)}${party.leaderAge ? ' (' + party.leaderAge + ')' : ''}</span>`;

    // Party description
    const descHtml = party.description
        ? `<div class="op-desc" style="font-size:13px;line-height:1.6">${escapeHtml(party.description)}</div>`
        : '';

    // Approval color
    const apColor = party.govScore > 2 ? 'var(--dgreen)' : party.govScore > 0 ? 'var(--damber)' : party.govScore > -2 ? 'var(--damber)' : 'var(--dred)';
    const govSign = party.govScore > 0 ? '+' : '';
    const govOppLabel = party.status.startsWith('governing') ? 'GOV' : 'OPP';

    // Ideology axes HTML
    let axesHtml = '';
    for (const ax of OP_AXES) {
        const score = party.ideology[ax.key] ?? 0;
        const normalized = (score + 100) / 2; // 0-100
        const absScore = Math.abs(score);

        let fillStyle;
        if (score > 0) {
            fillStyle = `left:50%;width:${score / 2}%;background:${cHalf}`;
        } else if (score < 0) {
            fillStyle = `right:50%;width:${Math.abs(score) / 2}%;background:${cHalf}`;
        } else {
            fillStyle = `left:50%;width:0%;background:${cHalf}`;
        }

        axesHtml += `
        <div class="op-axis">
            <div class="op-axis-poles"><span>${ax.leftLabel}</span><span>${ax.rightLabel}</span></div>
            <div class="op-axis-track">
                <div class="op-axis-center"></div>
                <div class="op-axis-fill" style="${fillStyle}"></div>
                <div class="op-axis-dot" style="left:${normalized}%;background:${cLight};border-color:${c}"></div>
            </div>
        </div>`;
    }

    // Ideology insight
    const strongPositions = Object.values(party.ideology).filter(v => Math.abs(v) >= 50).length;
    let insightColor, insightLabel, insightBody;
    if (strongPositions >= 4) {
        insightColor = 'var(--dgreen)';
        insightLabel = 'Strong Conviction';
        insightBody = `${strongPositions} strong positions. Consistent ideological identity across axes.`;
    } else if (strongPositions <= 1) {
        insightColor = 'var(--dred)';
        insightLabel = 'Weak Conviction';
        insightBody = `Only ${strongPositions} strong position${strongPositions === 1 ? '' : 's'}. Centrist on most axes — voters may not trust their platform.`;
    } else {
        insightColor = 'var(--dteal)';
        insightLabel = 'Established Party';
        insightBody = `${strongPositions} strong positions. Moderate ideological clarity.`;
    }

    // Stances — rival stance display not yet implemented
    const stancesHtml = '<div style="color:var(--dtxt-dim);font-size:10px;font-style:italic;padding:8px 0;">Rival stance tracking coming soon.</div>';
    const stanceInsight = '';

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
                    <span class="op-sr-label">Governance <span style="font-size:8px;color:var(--dtext-3)">${govOppLabel}</span></span>
                    <span class="op-sr-val" style="color:${apColor}">${govSign}${party.govScore}</span>
                </div>
                <div class="op-rule"></div>
                <div class="op-sec-label">Ideology Axes</div>
                ${axesHtml}
                <div class="op-insight" style="border-left-color:${insightColor}">
                    <div class="op-insight-label" style="color:${insightColor}">${insightLabel}</div>
                    <div class="op-insight-body">${insightBody}</div>
                </div>
            </div>
            <div class="op-col-right">
                <div class="op-sec-label">Active Issue Stances</div>
                ${stancesHtml}
                ${stanceInsight}
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

async function renderElectionsTab(nation, administration, coalition, faction, allParties, allPartyIdeologies, currentTick, role, nextElection, caucusFactions, mySeats) {
    const container = document.getElementById('elections-container');
    if (!container) return;

    try {

    const statsAtStart = administration?.stats_at_start;
    const ticksInPower = currentTick - (administration?.started_at_tick || currentTick);
    const isGoverning = role.includes('Governing') || role.includes('Lead') || role === 'Strongman';

    // --- Compute governance score ---
    let statDeltas = [];
    let governanceScore = 0;
    let scoredCount = 0;

    if (statsAtStart) {
        for (const key of NATION_STAT_COLUMNS) {
            const dir = statDirectionSign(key);
            if (dir === 0) continue; // skip neutral stats (taxes, population, etc.)
            const start = Number(statsAtStart[key] ?? 0);
            const now = Number(nation[key] ?? 0);
            const raw = now - start;
            if (raw === 0) continue;
            const signed = raw * dir; // positive = improvement
            statDeltas.push({ key, start, now, raw, signed, dir });
            governanceScore += signed;
            scoredCount++;
        }
        if (scoredCount > 0) governanceScore = governanceScore / scoredCount;
    }

    // Apply incumbency decay: positive score × 0.95^(terms) every 12 ticks
    const decayCycles = Math.floor(ticksInPower / 12);
    const incumbencyMultiplier = governanceScore > 0 ? Math.pow(0.95, decayCycles) : 1;
    const rawDisplayScore = governanceScore * incumbencyMultiplier;
    const displayScore = rawDisplayScore * 10; // ×10 multiplier for readable display

    // Sort deltas: biggest improvements first, then biggest declines
    statDeltas.sort((a, b) => b.signed - a.signed);

    // Score color (thresholds adjusted for ×10 scale)
    const scoreColor = displayScore > 5 ? 'var(--dgreen)' : displayScore > 0 ? 'var(--damber)' : displayScore > -5 ? 'var(--damber)' : 'var(--dred)';
    const scoreSign = displayScore > 0 ? '+' : '';

    // Opposition gets inverse
    const effectiveScore = isGoverning ? displayScore : -displayScore;
    const effectiveColor = effectiveScore > 5 ? 'var(--dgreen)' : effectiveScore > 0 ? 'var(--damber)' : effectiveScore > -5 ? 'var(--damber)' : 'var(--dred)';
    const effectiveSign = effectiveScore > 0 ? '+' : '';

    // --- Build stat delta rows ---
    const deltaRowsHtml = statDeltas.map(d => {
        const color = d.signed > 0 ? 'var(--dgreen)' : 'var(--dred)';
        const arrow = d.signed > 0 ? '▲' : '▼';
        const label = formatStatName(d.key);
        return `<div class="elec-stat-row">
            <span class="elec-stat-name">${escapeHtml(label)}</span>
            <span class="elec-stat-start">${d.start.toFixed(1)}</span>
            <span class="elec-stat-arrow" style="color:${color}">${arrow}</span>
            <span class="elec-stat-now">${d.now.toFixed(1)}</span>
            <span class="elec-stat-delta" style="color:${color}">${d.raw > 0 ? '+' : ''}${d.raw.toFixed(1)}</span>
        </div>`;
    }).join('');

    const noDataMsg = !statsAtStart
        ? '<div style="color:var(--dtext-3);font-size:11px;padding:10px">No administration data available.</div>'
        : statDeltas.length === 0
            ? '<div style="color:var(--dtext-3);font-size:11px;padding:10px">No stat changes recorded yet.</div>'
            : '';

    // Incumbency decay note
    const decayNote = decayCycles > 0 && governanceScore > 0
        ? `<div class="elec-decay-note">Incumbency decay: ${((1 - incumbencyMultiplier) * 100).toFixed(1)}% reduction (${decayCycles} cycle${decayCycles > 1 ? 's' : ''})</div>`
        : '';

    // --- Governance Box ---
    const governanceBox = `
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="elec-box-title">Governance</span>
        </div>
        <div class="elec-box-body">
            <div class="elec-score-row">
                <div class="elec-score-block">
                    <div class="elec-score-label">${isGoverning ? 'Gov. Score' : 'National Score'}</div>
                    <div class="elec-score-value" style="color:${scoreColor}">${scoreSign}${Math.round(displayScore)}</div>
                </div>
                ${!isGoverning ? `<div class="elec-score-block">
                    <div class="elec-score-label">Your Impact (Opposition)</div>
                    <div class="elec-score-value" style="color:${effectiveColor}">${effectiveSign}${Math.round(effectiveScore)}</div>
                </div>` : ''}
            </div>
            ${decayNote}
            <div class="elec-admin-info">
                <span>${escapeHtml(administration?.admin_name || 'Government')}</span>
                <span class="elec-ticks">${ticksInPower} tick${ticksInPower !== 1 ? 's' : ''} in power</span>
            </div>
            <div class="elec-stat-header">
                <span class="elec-stat-name">Stat</span>
                <span class="elec-stat-start">Start</span>
                <span class="elec-stat-arrow"></span>
                <span class="elec-stat-now">Now</span>
                <span class="elec-stat-delta">Delta</span>
            </div>
            <div class="elec-stat-list">
                ${noDataMsg || deltaRowsHtml}
            </div>
        </div>
    </div>`;

    // --- What Is Governance Box ---
    const whatIsBox = `
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--amber"></div>
            <span class="elec-box-title">What Is Governance?</span>
        </div>
        <div class="elec-box-body elec-explainer">
            <p><strong>Governance</strong> measures how the nation's stats have changed since the current administration took power. It is the single largest factor in elections.</p>
            <p>Every nation stat is snapshotted at inauguration. Each tick, the average improvement (or decline) across all directional stats produces a <strong>governance score</strong>.</p>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">If you are Governing:</div>
                <ul>
                    <li>Your governance score directly reflects national performance under your watch.</li>
                    <li>Pass bills that move stats in the right direction — raise the stats voters want higher, lower the ones they want lower.</li>
                    <li>Appoint strong ministers — vacant ministries and poor performance drag stats down.</li>
                    <li>Beware incumbency decay: positive scores erode 5% every 12 ticks. Fresh wins matter more than old ones.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">If you are Opposition:</div>
                <ul>
                    <li>You receive the <em>inverse</em> of the governance score. Bad governance helps your election chances.</li>
                    <li>Vote against harmful legislation to protect the nation — and your reputation.</li>
                    <li>Build your case through ideology and momentum to maximize seat gains when elections come.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Stat Direction:</div>
                <p>Stats like GDP Growth, Happiness, and Stability are "higher is better." Stats like Unemployment, Crime Rate, and Pollution are "lower is better." Neutral stats (taxes, population) are excluded.</p>
            </div>
        </div>
    </div>`;

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
                    <li><strong>Sponsoring a bill:</strong> +3 momentum for the sponsoring party.</li>
                    <li><strong>Bill passes:</strong> YES voters get +2 momentum per policy article.</li>
                    <li><strong>Bill fails:</strong> YES voters lose -2 per article. NO voters gain +2 per article.</li>
                    <li>Text-only articles do not count. Abstaining gives nothing.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Campaign Actions:</div>
                <ul>
                    <li><strong>Rally</strong> (1 AP) — Moderate, reliable momentum gain.</li>
                    <li>Other campaign actions like stances, public addresses, and media campaigns also contribute.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">The Tradeoff:</div>
                <p>You only get 5 AP per tick. Every AP spent campaigning is an AP not spent on bills. Governing parties must balance legislation (which builds Governance) with campaigning (which builds Momentum). Opposition can focus on campaigning but depends on government failure for Governance.</p>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Vote Locking:</div>
                <p>Once you vote YES or NO on a bill, you cannot flip to the opposite — only change to Abstain. Choose carefully.</p>
            </div>
        </div>
    </div>`;

    // --- Ideology Box (760px) ---
    // Fetch electorate profile for ideology distribution
    const { data: elecProfile, error: elecProfileErr } = await _supabase
        .from('electorate_profile')
        .select('*')
        .eq('nation_id', nation.id)
        .maybeSingle();
    if (elecProfileErr) console.error('[Elections] electorate_profile fetch failed:', elecProfileErr);

    // Build ideology lookup
    const ideoMap = {};
    for (const row of (allPartyIdeologies || [])) {
        ideoMap[row.faction_id] = row;
    }
    const playerIdeo = ideoMap[faction.id] || {};

    // Compute zone variance (same formula as Electorate tab)
    const nationPolarization = Number(nation.polarization ?? 50);
    const nationStability = Number(nation.stability ?? 50);
    const nationDiversity = Number(nation.ethnic_diversity ?? 50);
    const spreadScore = Math.min(100, Math.max(0,
        nationPolarization * 0.9 +
        (100 - nationStability) * 0.07 +
        nationDiversity * 0.03
    ));
    const zoneVariance = 5 + (spreadScore / 100) * 40;

    let ideologyRowsHtml = '';
    let totalCapture = 0;

    if (elecProfile) {
        for (const ax of ES_AXES) {
            const rawScore = Number(playerIdeo[ax.key] ?? 0);
            const normPos = (rawScore + 100) / 2; // -100..+100 → 0..100
            const eMean = Number(elecProfile['ideo_mean_' + ax.key] ?? 50);
            const eVar = zoneVariance;

            // Get zone info
            const { zones, zoneForPos } = calculateIdeologyZones(eMean, eVar);
            const playerZoneId = zoneForPos(normPos);

            // Map zone ID to readable label
            const zoneSide = playerZoneId.includes('left') ? ax.leftLabel : playerZoneId.includes('right') ? ax.rightLabel : '';
            const zoneType = playerZoneId === 'centrist' ? 'Centrist' : playerZoneId.includes('moderate') ? 'Moderate' : 'Radical';
            const playerZoneLabel = playerZoneId === 'centrist' ? 'Centrist' : `${zoneType} ${zoneSide}`;

            // Voter capture via bimodal alignment
            const capture = bimodalAxisAlignment(normPos, eMean, eVar);
            const capturePct = (capture * 100).toFixed(1);
            totalCapture += capture;

            // Find where most voters are (largest zone by width, excluding centrist ties)
            const sortedZones = [...zones].sort((a, b) => b.width - a.width);
            const biggestZone = sortedZones[0];
            const bigZoneSide = biggestZone.id.includes('left') ? ax.leftLabel : biggestZone.id.includes('right') ? ax.rightLabel : '';
            const bigZoneType = biggestZone.id === 'centrist' ? 'Centrist' : biggestZone.id.includes('moderate') ? 'Moderate' : 'Radical';
            const voterConcentration = biggestZone.id === 'centrist' ? 'Centrist' : `${bigZoneType} ${bigZoneSide}`;

            // Capture color
            const capColor = capture >= 0.6 ? 'var(--dgreen)' : capture >= 0.3 ? 'var(--damber)' : 'var(--dred)';

            // Salience
            const salience = Number(elecProfile['salience_' + ax.key] ?? 0.2);
            const saliencePct = (salience * 100).toFixed(0);

            // Zone overlays (identical to Electorate tab)
            const varLeft = Math.max(0, eMean - eVar);
            const varRight = Math.min(100, eMean + eVar);
            const varWidth = varRight - varLeft;

            const zoneColors = {
                'radical-left':   'rgba(239,68,68,0.10)',
                'moderate-left':  'rgba(251,191,36,0.07)',
                'centrist':       'rgba(74,222,128,0.08)',
                'moderate-right': 'rgba(251,191,36,0.07)',
                'radical-right':  'rgba(239,68,68,0.10)',
            };
            const zoneBorders = {
                'radical-left':   'rgba(239,68,68,0.25)',
                'moderate-left':  'rgba(251,191,36,0.18)',
                'centrist':       'rgba(74,222,128,0.22)',
                'moderate-right': 'rgba(251,191,36,0.18)',
                'radical-right':  'rgba(239,68,68,0.25)',
            };
            const zoneLabelColors = {
                'radical-left':   'rgba(239,68,68,0.50)',
                'moderate-left':  'rgba(251,191,36,0.45)',
                'centrist':       'rgba(74,222,128,0.50)',
                'moderate-right': 'rgba(251,191,36,0.45)',
                'radical-right':  'rgba(239,68,68,0.50)',
            };

            let zonesHtml = '';
            for (const z of zones) {
                if (z.width < 1) continue;
                const zLeft = Math.max(z.left, varLeft);
                const zRight = Math.min(z.left + z.width, varRight);
                if (zRight <= zLeft) continue;
                const relLeft = ((zLeft - varLeft) / varWidth) * 100;
                const relWidth = ((zRight - zLeft) / varWidth) * 100;
                const showLabel = relWidth > 8;
                zonesHtml += `<div class="elec-ideo-zone" style="left:${relLeft}%;width:${relWidth}%;background:${zoneColors[z.id]};border-left:1px solid ${zoneBorders[z.id]};border-right:1px solid ${zoneBorders[z.id]}">
                    ${showLabel ? `<span class="elec-ideo-zone-label" style="color:${zoneLabelColors[z.id]}">${z.label}</span>` : ''}
                </div>`;
            }

            // Player marker position within variance band
            const playerRelPos = varWidth > 0 ? ((normPos - varLeft) / varWidth) * 100 : 50;
            const meanRelPos = varWidth > 0 ? ((eMean - varLeft) / varWidth) * 100 : 50;

            ideologyRowsHtml += `
            <div class="elec-ideo-axis">
                <div class="elec-ideo-axis-header">
                    <span class="elec-ideo-axis-name">${escapeHtml(ax.leftLabel)} / ${escapeHtml(ax.rightLabel)}</span>
                    <span class="elec-ideo-salience">Salience: ${saliencePct}%</span>
                </div>
                <div class="elec-ideo-bar-wrap">
                    <div class="elec-ideo-bar-labels">
                        <span>${escapeHtml(ax.leftLabel)}</span>
                        <span>${escapeHtml(ax.rightLabel)}</span>
                    </div>
                    <div class="elec-ideo-bar-track">
                        <div class="elec-ideo-var-band" style="left:${varLeft}%;width:${varWidth}%">
                            ${zonesHtml}
                            <div class="elec-ideo-mean-marker" style="left:${meanRelPos}%"></div>
                            <div class="elec-ideo-player-marker" style="left:${playerRelPos}%"></div>
                        </div>
                    </div>
                    <div class="elec-ideo-bar-labels" style="margin-bottom:12px">
                        <span></span>
                    </div>
                </div>
                <div class="elec-ideo-details">
                    <span class="elec-ideo-position">Your Position: <strong>${escapeHtml(playerZoneLabel)}</strong></span>
                    <span class="elec-ideo-capture" style="color:${capColor}">Voter Capture: <strong>${capturePct}%</strong></span>
                </div>
                <div class="elec-ideo-voters">Most voters are <strong>${escapeHtml(voterConcentration)}</strong></div>
            </div>`;
        }
    }

    const avgCapture = elecProfile ? (totalCapture / ES_AXES.length * 100).toFixed(1) : '—';
    const avgCapColor = totalCapture / ES_AXES.length >= 0.6 ? 'var(--dgreen)' : totalCapture / ES_AXES.length >= 0.3 ? 'var(--damber)' : 'var(--dred)';

    const ideologyBox = `
    <div class="elec-box elec-box--wide">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--purple"></div>
            <span class="elec-box-title">Ideology</span>
            <span class="elec-ideo-avg">Avg. Capture: <strong style="color:${avgCapColor}">${avgCapture}%</strong></span>
        </div>
        <div class="elec-box-body">
            ${elecProfile ? ideologyRowsHtml : '<div style="color:var(--dtext-3);font-size:11px;padding:10px">No electorate data available.</div>'}
        </div>
    </div>`;

    // --- What Is Ideology Box ---
    const whatIsIdeologyBox = `
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--amber"></div>
            <span class="elec-box-title">What Is Ideology?</span>
        </div>
        <div class="elec-box-body elec-explainer">
            <p><strong>Ideology</strong> measures how well your party's positions align with what voters actually want. It accounts for 30% of election outcomes.</p>
            <p>The electorate sits on 5 ideological axes. Voters are distributed across each axis — clustered at the center in stable nations, or split into polarized camps in divided ones.</p>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Voter Capture:</div>
                <p>Your <strong>voter capture</strong> on each axis is the percentage of voters near your position. Higher capture means more votes. If you're in a zone where few voters sit, your capture is low — even if your position is "correct."</p>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Spatial Competition:</div>
                <p>Other parties compete for the same voters. Two parties in the same zone split that zone's voters between them. Finding an uncontested ideological space can be more valuable than crowding the center.</p>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">How to shift your position:</div>
                <ul>
                    <li><strong>Voting on bills</strong> — YES votes shift you toward the bill's ideological direction. NO votes shift you the opposite way.</li>
                    <li><strong>Take Stance</strong> — Declare a position on a salient issue to shift directly on the relevant axis.</li>
                    <li><strong>Fund Think Tank / Ideological Pivot</strong> — Targeted ideology actions for larger shifts.</li>
                </ul>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">Salience:</div>
                <p>Not all axes matter equally. <strong>Salience</strong> reflects how much voters care about each axis right now, driven by national issues. High-salience axes count more toward your ideology score.</p>
            </div>
            <div class="elec-explainer-section">
                <div class="elec-explainer-heading">The Electorate Moves:</div>
                <p>The electorate's position shifts over time based on national conditions. A stable, prosperous nation clusters near the center. A polarized, unstable nation splits into radical camps. Standing still doesn't guarantee alignment — the voters may move away from you.</p>
            </div>
        </div>
    </div>`;

    // --- Caucus Box ---
    const CAUCUS_AXIS_LABELS = {
        liberty_equality: 'Liberty / Equality',
        tradition_progress: 'Tradition / Progress',
        security_freedom: 'Security / Freedom',
        globalism_nationalism: 'Globalism / Nationalism',
        individualism_collectivism: 'Individualism / Collectivism',
    };
    const partySeats = mySeats || 0;
    const totalSeatsAll = (allParties || []).reduce((s, p) => s + (p.seats || 0), 0);
    const seatPct = totalSeatsAll > 0 ? partySeats / totalSeatsAll : 0;
    const activeCaucuses = (caucusFactions || []).filter(c => c.is_active !== false);
    let caucusRowsHtml = '';
    if (activeCaucuses.length === 0) {
        const pctDisplay = (seatPct * 100).toFixed(0);
        caucusRowsHtml = `<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:16px 4px;text-align:center">
            No active caucuses.<br>Caucuses form when your party holds <strong>50%+</strong> of parliamentary seats.<br>
            <span style="margin-top:6px;display:inline-block">You currently hold <strong>${partySeats}</strong> / ${totalSeatsAll} seats (${pctDisplay}%).</span>
        </div>`;
    } else {
        const totalCaucusSeats = activeCaucuses.reduce((s, c) => s + Math.round(partySeats * c.seat_share), 0);
        for (const cf of activeCaucuses) {
            const caucusSeats = Math.round(partySeats * cf.seat_share);
            const relPct = Number(cf.relationship_score ?? 50);
            const relColor = relPct >= 60 ? 'var(--dgreen)' : relPct >= 30 ? 'var(--damber)' : 'var(--dred)';
            const wingLabel = cf.wing_end === 'left' ? '◂' : '▸';
            const volatileBadge = relPct < 30 ? '<span style="font-family:var(--dfont-mono);font-size:9px;color:var(--dred);font-weight:700;letter-spacing:0.5px;margin-left:4px">VOLATILE</span>' : '';
            caucusRowsHtml += `
            <div style="padding:8px 0;border-bottom:1px solid var(--dborder-1)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-family:var(--dfont-ui);font-size:12px;font-weight:600;color:var(--dtext-0)">${escapeHtml(cf.name)}</div>
                        <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:2px">${wingLabel} ${CAUCUS_AXIS_LABELS[cf.dominant_axis] || cf.dominant_axis}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:var(--dtext-0)">${caucusSeats} seat${caucusSeats !== 1 ? 's' : ''}</div>
                        <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
                            <div style="width:50px;height:5px;background:var(--dborder-1);border-radius:3px;overflow:hidden">
                                <div style="width:${relPct}%;height:100%;background:${relColor};border-radius:3px;transition:width 0.3s"></div>
                            </div>
                            <span style="font-family:var(--dfont-mono);font-size:10px;color:${relColor}">${relPct}</span>
                            ${volatileBadge}
                        </div>
                    </div>
                </div>
            </div>`;
        }
        caucusRowsHtml = `<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-2);margin-bottom:6px;display:flex;justify-content:space-between">
            <span>${activeCaucuses.length} active caucus${activeCaucuses.length !== 1 ? 'es' : ''}</span>
            <span>${totalCaucusSeats} / ${partySeats} seats</span>
        </div>` + caucusRowsHtml;
    }

    const caucusBox = `
    <div class="elec-box">
        <div class="elec-box-header">
            <div class="pol-box-dot pol-box-dot--teal"></div>
            <span class="elec-box-title">Internal Caucuses</span>
        </div>
        <div class="elec-box-body">
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-bottom:8px">
                Internal factions within your party. Low relationship scores mean caucus members may defect on ideologically opposed bills.
            </div>
            <div style="overflow-y:auto;max-height:340px">
                ${caucusRowsHtml}
            </div>
        </div>
    </div>`;

    container.innerHTML = `
    <div class="elec-page">
        <div class="elec-row">
            ${governanceBox}
            ${whatIsBox}
            ${momentumBox}
            ${whatIsMomentumBox}
        </div>
        <div class="elec-row" style="margin-top:20px">
            ${ideologyBox}
            ${whatIsIdeologyBox}
            ${caucusBox}
        </div>
    </div>`;

    } catch (e) {
        console.error('[Elections Tab] Render error:', e);
        container.innerHTML = '<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">Failed to load election data. Please refresh.</div>';
    }
}

