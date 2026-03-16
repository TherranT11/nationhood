import { _supabase } from './supabase-client.js';
import { initPage } from './common.js';
import './guide.js';
import { getPartyIconSVG, getPartyLogoHTML, PARTY_ICONS, PARTY_COLOR_PALETTE } from './party-icons.js';
import { tickToDate, escapeHtml as utilEscapeHtml } from './utils.js';
import { fetchActiveCoalition, loadSeats, isPresidentialRepublic, initGameConfigForNation, GAME_CONFIG, RALLY_CONFIG, RALLY_OUTCOMES, getRallyOutcomeWeights, getRallyRiskLevel, executeRally, OUTREACH_CONFIG, computeOutreachAlignment, calcOutreachEffect, calcOutreachFriction, executeOutreach, ATTACK_CONFIG, ATTACK_OUTCOMES, getAttackOutcomeWeights, gatherAttackEvidence, buildAttackVectors, executeAttack, MAKE_PROMISE_CONFIG, executeMakePromise, getPromiseableStats, MOBILIZE_CONFIG, executeMobilize, SUCCESSOR_CONFIG, executeAppointSuccessor, executeRevokeSuccessor, executeDynastyAction, executePledgeAllegiance, executeConsolidatePower, executeDemonstrateCompetence, executeEmbezzleFunds, getEmbezzleRiskLabel, executeBuyInfluence, executeIntimidate, executeIntimidationResponse, executePurge, executeRedistributeSeats, canAttemptCoup, getCoupEstimate, executeCoupAttempt, sendCoupInvitation, respondToCoupInvitation, getRegimeHealthTier, deductAP, disbandParty, PILLAR_TO_STEWARD_TYPE, STEWARD_TYPE_LABELS, STEWARD_TYPE_DESCRIPTIONS, ensureBlocApprovals, getNationNames, IDEOLOGY_AXES } from './game-common.js';
import { isAutocracy, isGovernmentPresidential } from './game/government-types.js';
import { ISSUE_CATEGORY_STATS, statDirectionSign } from './game/stats.js';
import { getElectabilityTier } from './game/party-leadership.js';

initPage('politics', async (state) => {
    const { nation, faction, shard } = state;

    if (!nation || !faction) {
        document.getElementById('content-area').innerHTML =
            '<div class="pol-loading">No nation or party data available.</div>';
        return;
    }

    // Initialize game config for this nation (needed for autocracy action costs)
    await initGameConfigForNation(_supabase, nation.id);

    // Fetch full faction data (state.faction has SELECT * so should be complete)
    const f = faction;
    const currentTick = shard?.current_tick || 0;

    // Fetch total seats from all parties
    const { data: allParties } = await _supabase
        .from('factions')
        .select('id, seats, national_vote_share, faction_name, abbreviation, party_color')
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
    const { currentSeats } = await loadSeats(_supabase, nation.id, isAutocracy(nation), allParties || [], f.id);

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
    const isAutoNation = isAutocracy(nation);
    let role = 'Opposition';
    if (isAutoNation && nation.ruling_faction_id === f.id) {
        role = 'Strongman';
    } else if (coalition && coalition.party_ids && coalition.party_ids.includes(f.id)) {
        role = coalition.lead_party_id === f.id ? 'Lead — Governing' : 'Governing Coalition';
    }

    // ── Autocracy-specific data ──
    let regimePillars = null, stewardRows = null, autoMinistries = null, regimeLog = null, loyaltyDemands = null, autoCoalitions = null;
    if (isAutoNation) {
        const [pillarsRes, stewardsRes, ministriesRes, logRes, demandsRes, coalitionsRes] = await Promise.all([
            _supabase.from('regime_pillars').select('*').eq('nation_id', nation.id),
            _supabase.from('stewards').select('*').eq('nation_id', nation.id),
            _supabase.from('ministries').select('ministry_key, party_id').eq('nation_id', nation.id).not('party_id', 'is', null),
            _supabase.from('campaign_actions').select('*').eq('nation_id', nation.id).order('tick_performed', { ascending: false }).limit(30),
            _supabase.from('loyalty_demands').select('*').eq('nation_id', nation.id).eq('status', 'pending'),
            _supabase.from('faction_coalitions').select('*').eq('nation_id', nation.id).in('status', ['active', 'pending']),
        ]);
        regimePillars = pillarsRes.data;
        stewardRows = stewardsRes.data;
        autoMinistries = ministriesRes.data;
        regimeLog = logRes.data;
        loyaltyDemands = demandsRes.data;
        autoCoalitions = coalitionsRes.data;
    }

    // Fetch active crises
    const { data: activeCrises } = await _supabase
        .from('active_crises')
        .select('id, started_at_tick, crisis_templates(name, description)')
        .eq('nation_id', nation.id);

    // Fetch next scheduled election
    const { data: nextElection } = await _supabase
        .from('elections')
        .select('election_tick')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .order('election_tick', { ascending: true })
        .limit(1)
        .maybeSingle();

    // Fetch per-party momentum (average across blocs)
    const { data: blocApprovals } = partyIds.length > 0
        ? await _supabase
            .from('faction_bloc_approval')
            .select('faction_id, momentum')
            .in('faction_id', partyIds)
        : { data: [] };

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
        .single();
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
        .select('id, admin_name, government_type, started_at_tick, president_name, president_party_id, president_party_name')
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

    // Fetch all scheduled elections (for upcoming panel)
    const { data: scheduledElections } = await _supabase
        .from('elections')
        .select('election_tick, election_type')
        .eq('nation_id', nation.id)
        .eq('status', 'scheduled')
        .order('election_tick', { ascending: true });

    // Fetch voter blocs for coalition overview
    const { data: voterBlocs } = await _supabase
        .from('voter_blocs')
        .select('id, bloc_name, population_weight, is_active, axis_liberty_equality, axis_tradition_progress, axis_security_freedom, axis_globalism_nationalism, axis_individualism_collectivism, priority_issues, ideology_1, ideology_2, ideology_3, ideology_4, ideology_5')
        .eq('nation_id', nation.id)
        .eq('is_active', true);

    // Fetch player's faction_bloc_approval rows (preference_score per bloc)
    const { data: playerBlocApprovals } = await _supabase
        .from('faction_bloc_approval')
        .select('bloc_id, preference_score')
        .eq('faction_id', f.id);


    renderPartyTab(f, nation, {
        shard,
        totalSeats,
        mySeats,
        voteSharePct,
        lastElectionDate,
        seatDelta,
        role,
        isAutoNation,
        coalition,
        currentTick,
        officerNames,
        allParties,
        allPartyIdeologies,
        activeCrises,
        nextElection,
        blocApprovals,
        prevApproval,
        lastParliamentary,
        lastPresidential,
        scheduledElections,
        president,
        administration,
        voterBlocs,
        playerBlocApprovals,
        regimePillars,
        stewardRows,
        autoMinistries,
        regimeLog,
        loyaltyDemands,
        autoCoalitions
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
        seatDelta, role, isAutoNation, officerNames, allParties, allPartyIdeologies, coalition, activeCrises, currentTick,
        nextElection, blocApprovals, prevApproval,
        lastParliamentary, lastPresidential, scheduledElections,
        president, administration,
        voterBlocs, playerBlocApprovals,
        regimePillars, stewardRows, autoMinistries, regimeLog, loyaltyDemands, autoCoalitions
    } = data;
    const faction = f; // alias for compatibility with sub-renderers

    const partyColor = f.party_color || '#ffcc00';
    const logoSvg = getPartyLogoHTML({ customLogoUrl: f.custom_logo_url, iconKey: f.party_logo, size: 36, color: partyColor });
    const founded = tickToDate(f.founded_tick);

    // Role badge
    const isGov = role.includes('Governing') || role.includes('Lead') || role === 'Strongman';
    const roleLabel = role.includes('Lead') ? 'Governing' : role;
    const roleCls = role === 'Strongman' ? 'pol-role-strongman' : isGov ? 'pol-role-gov' : 'pol-role-opp';

    // Ideology tags
    const ideo1 = f.ideology_value_1 || null;
    const ideo2 = f.ideology_value_2 || null;

    function ideoTag(val) {
        if (!val) return '';
        const cls = 'pol-ideo-' + val.toLowerCase();
        const label = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        return `<div class="pol-ideo-box">
            <span class="pol-ideo-label">Ideology</span>
            <span class="pol-ideo-value ${cls}">${label}</span>
        </div>`;
    }

    // Leader — for autocracy strongman, use head of state as party leader
    let leaderName, leaderAge;
    if (isAutoNation && nation.ruling_faction_id === f.id && nation.head_of_state_first_name && nation.head_of_state_last_name) {
        leaderName = nation.head_of_state_first_name + ' ' + nation.head_of_state_last_name;
        leaderAge = nation.head_of_state_age ? `(${nation.head_of_state_age})` : '';
    } else {
        leaderName = f.leader_first_name && f.leader_last_name
            ? f.leader_first_name + ' ' + f.leader_last_name
            : 'Vacant';
        leaderAge = f.leader_age ? `(${f.leader_age})` : '';
    }
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

    // Vote share delta (simple: compare to equal share as baseline)
    let voteShareDeltaHtml = '';
    // We show the vote share as-is with an up arrow if > 0
    const vsNum = parseFloat(voteSharePct);
    if (vsNum > 0) {
        // Show a delta indicator based on change from hypothetical equal share
        // For now just show the percentage; delta from last election would need historical data
    }

    // ── Build politics tab content based on government type ──
    let politicsTabContent;
    if (isAutoNation) {
        politicsTabContent = renderAutocracyPoliticsContent(f, nation, {
            totalSeats, mySeats, voteSharePct, lastElectionDate, seatDelta,
            role, currentTick, allParties, coalition, activeCrises,
            regimePillars, stewardRows, autoMinistries, regimeLog, loyaltyDemands, autoCoalitions,
            logoSvg, partyColor, founded, roleCls, roleLabel, leaderName, leaderAge, leaderIdeo,
            officerNames, ideo1, ideo2, deltaHtml, ideoTag
        });
    } else {
        politicsTabContent = `
    <div class="pol-page">
        <div class="pol-section-label">Politics</div>

        <div class="pol-columns">
        ${renderGovCard(nation, coalition, allParties, currentTick, prevApproval, president, administration)}
        <div class="pol-party-card">
        <div class="pol-header">
            <div class="pol-logo">${logoSvg}</div>
            <div class="pol-header-info">
                <div class="pol-party-name">${escapeHtml(f.faction_name)}</div>
                <div class="pol-meta-row">
                    <span class="pol-role-badge ${roleCls}">${escapeHtml(roleLabel.toUpperCase())}</span>
                    <span class="pol-established">Est. ${founded}</span>
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
            <div class="pol-stat-block">
                <div class="pol-stat-label">Vote Share</div>
                <div class="pol-stat-value">${voteSharePct}%</div>
                ${lastElectionDate ? `<div class="pol-stat-note">${lastElectionDate}</div>` : ''}
            </div>
        </div>
        </div>
        ${renderParliamentBox(allParties, coalition, nation, f.id)}
        ${renderForecastBox(allParties, totalSeats, currentTick, nextElection, blocApprovals, f.id)}
        </div>

        <div class="pol-row-2">
        ${renderCoalitionOverviewBox(voterBlocs, playerBlocApprovals, allPartyIdeologies, f.id, f.party_color)}
        ${renderNationalMoodBox(nation, activeCrises, currentTick)}
        ${renderIdeologyBox(allParties, allPartyIdeologies, f.id)}
        ${renderEditIdentityBox(f, currentTick)}
        </div>

        <div class="pol-row-3">
        ${renderElectionResultsBox(lastParliamentary, lastPresidential, allParties)}
        ${renderBlocVotingBox(lastParliamentary, lastPresidential, allParties)}
        </div>
        <div class="pol-row-4" style="margin-top:24px;text-align:center">
            <button class="pol-disband-btn" id="pol-disband-party-btn" style="background:transparent;color:#ff4444;border:1px solid #ff4444;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:0.75rem;opacity:0.6;transition:opacity 0.2s" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">Disband Party</button>
            <div style="font-size:0.65rem;color:var(--dtext-3);margin-top:4px">Permanently disband your party and leave the game.</div>
        </div>
    </div>`;
    }

    const html = `
    <div class="pol-page-tabs">
        <button class="pol-page-tab active" data-page-tab="politics">Politics</button>
        <button class="pol-page-tab" data-page-tab="actions">Actions</button>
        <button class="pol-page-tab" data-page-tab="events">Events</button>
    </div>
    <div class="pol-page-content active" data-page-content="politics">
    ${politicsTabContent}
    </div>
    <div class="pol-page-content" data-page-content="actions">
        <div class="pol-page" style="min-height:300px;">
            <div class="pol-section-label">Actions</div>
            <div id="actions-container"></div>
        </div>
    </div>
    <div class="pol-page-content" data-page-content="events">
        <div class="pol-page" style="min-height:300px;">
            <div class="pol-section-label">Political Events</div>
            <div id="events-container"></div>
        </div>
    </div>`;

    document.getElementById('content-area').innerHTML = html;

    // Wire up page-level sub-tabs (Politics / Actions)
    document.querySelectorAll('.pol-page-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.pol-page-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.pol-page-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-page-tab');
            const content = document.querySelector(`.pol-page-content[data-page-content="${target}"]`);
            if (content) content.classList.add('active');
        });
    });

    if (!isAutoNation) {
        // Lock all panels to fixed 450px height (desktop only)
        if (window.innerWidth > 860) {
            document.querySelectorAll('.pol-admin-box, .pol-party-card, .pol-parliament-box, .pol-forecast-box, .pol-coalition-box, .pol-mood-box, .pol-ideology-box, .pol-identity-box, .pol-election-box, .pol-blocs-box').forEach(el => {
                el.style.height = '450px';
            });
        }
        initEditIdentityBox(f);
        initElectionResultsBox();
        initBlocAlignment();
    } else {
        // Wire up autocracy steward claim buttons
        initAutocracyStewardClaims(f, nation, stewardRows, regimePillars);
    }
    initIdeologyToggle();

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
                window.location.href = 'index.html';
            } catch (err) {
                alert(err.message || 'Failed to disband party.');
                disbandBtn.disabled = false;
                disbandBtn.textContent = 'Disband Party';
            }
        });
    }

    // ═══════════════════════════════════════
    // EVENTS TAB — Political Events Feed
    // ═══════════════════════════════════════
    await renderEventsTab(nation.id, faction.id, currentTick);

    // ═══════════════════════════════════════
    // ACTIONS TAB — Democracy Campaign Actions
    // ═══════════════════════════════════════
    if (!isAutoNation) {
        await renderDemocracyActions(nation, faction, shard, allParties);
    } else {
        await renderAutocracyActionsTab(nation, faction, shard);
    }
}

// ═══════════════════════════════════════════════════════════
// AUTOCRACY POLITICS TAB — Regime display for autocracy players
// ═══════════════════════════════════════════════════════════
function renderAutocracyPoliticsContent(f, nation, opts) {
    const n = nation;
    const {
        totalSeats, mySeats, currentTick, allParties, coalition, activeCrises,
        regimePillars, stewardRows, autoMinistries, regimeLog, loyaltyDemands, autoCoalitions,
        logoSvg, roleCls, roleLabel, leaderName, leaderAge, leaderIdeo,
        officerNames, ideoTag, ideo1, ideo2, deltaHtml, voteSharePct, lastElectionDate
    } = opts;

    const rulingId = n.ruling_faction_id;
    const isStrongman = f.id === rulingId;
    const rulingFaction = (allParties || []).find(p => p.id === rulingId);
    const nonRuling = (allParties || []).filter(p => p.id !== rulingId);

    // Pillar helpers
    const PILLAR_ICONS = {
        military: '&#9876;', security: '&#128065;', party: '&#9733;',
        oligarchs: '&#9830;', bureaucracy: '&#9881;', media: '&#9000;',
        foreign_patrons: '&#127758;', religious: '&#9766;'
    };
    const PILLAR_ORDER = ['military', 'security', 'party', 'oligarchs', 'bureaucracy', 'media', 'foreign_patrons', 'religious'];

    function pillarColor(val) {
        if (val >= 70) return 'var(--dgreen)';
        if (val >= 50) return 'var(--dgreen)';
        if (val >= 35) return 'var(--dorange)';
        if (val >= 20) return 'var(--dred)';
        return 'var(--dred)';
    }
    function pillarLabel(val) {
        if (val >= 70) return 'LOYAL';
        if (val >= 50) return 'CONTENT';
        if (val >= 35) return 'RESTLESS';
        if (val >= 20) return 'HOSTILE';
        return 'MUTINOUS';
    }

    const pillarMap = {};
    for (const p of (regimePillars || [])) pillarMap[p.pillar_key] = p;

    // Steward lookups
    const liveStewards = (stewardRows || []).filter(s => s.is_alive !== false);
    const stewardByPillar = {};
    const stewardByFaction = {};
    for (const s of liveStewards) {
        if (s.pillar_key) stewardByPillar[s.pillar_key] = s;
        stewardByFaction[s.faction_id] = s;
    }
    const mySteward = stewardByFaction[f.id] || null;

    // Ministry lookups
    const ministryCounts = {};
    const ministryByParty = {};
    for (const m of (autoMinistries || [])) {
        ministryCounts[m.party_id] = (ministryCounts[m.party_id] || 0) + 1;
        if (!ministryByParty[m.party_id]) ministryByParty[m.party_id] = [];
        ministryByParty[m.party_id].push(m.ministry_key);
    }

    // Faction name map
    const factionNameMap = {};
    for (const p of (allParties || [])) factionNameMap[p.id] = p.faction_name;

    // Compute Grip on Power from pillar averages
    const stability = Number(n.stability ?? 50);
    const legitimacy = Number(n.legitimacy ?? 50);
    const civilUnrest = Number(n.civil_unrest ?? 30);

    let gripClamped;
    if (regimePillars && regimePillars.length > 0) {
        const pillarSum = regimePillars.reduce((s, p) => s + (p.support ?? 0), 0);
        gripClamped = Math.max(0, Math.min(100, Math.round(pillarSum / regimePillars.length)));
    } else {
        const avgLoyalty = nonRuling.length > 0
            ? nonRuling.reduce((s, p) => s + (p.loyalty ?? 50), 0) / nonRuling.length : 50;
        gripClamped = Math.max(0, Math.min(100, Math.round(
            stability * 0.30 + avgLoyalty * 0.25 + (100 - civilUnrest) * 0.25 + legitimacy * 0.20
        )));
    }

    let gripLabel, gripColor;
    if (gripClamped >= 85) { gripLabel = 'IRON GRIP'; gripColor = 'var(--dgreen)'; }
    else if (gripClamped >= 70) { gripLabel = 'FIRM'; gripColor = 'var(--dgreen)'; }
    else if (gripClamped >= 50) { gripLabel = 'STABLE'; gripColor = 'var(--dorange)'; }
    else if (gripClamped >= 30) { gripLabel = 'TENUOUS'; gripColor = 'var(--dred)'; }
    else { gripLabel = 'CRUMBLING'; gripColor = 'var(--dred)'; }

    // Succession
    const chosenSuccessorSteward = liveStewards.find(s => s.is_chosen_successor);
    const isFamilyMemberSuccessor = n.successor_is_family_member === true;
    const hasAnySuccessor = !!chosenSuccessorSteward || isFamilyMemberSuccessor;
    const successionLabel = chosenSuccessorSteward
        ? `${chosenSuccessorSteward.first_name} ${chosenSuccessorSteward.last_name}`
        : isFamilyMemberSuccessor ? 'FAMILY MEMBER' : 'UNDESIGNATED';
    const successionColor = hasAnySuccessor ? 'var(--damber)' : 'var(--dred)';

    // Regime Health
    const regimeHealthVal = Math.round(Number(n.regime_health ?? 80));
    const regimeHealthPct = Math.max(0, Math.min(100, regimeHealthVal));
    let regimeHealthLabel, regimeHealthColor;
    if (regimeHealthVal >= 60) { regimeHealthLabel = 'HEALTHY'; regimeHealthColor = 'var(--dgreen)'; }
    else if (regimeHealthVal >= 40) { regimeHealthLabel = 'WEAKENING'; regimeHealthColor = 'var(--dorange)'; }
    else if (regimeHealthVal >= 20) { regimeHealthLabel = 'DECLINING'; regimeHealthColor = 'var(--dred)'; }
    else if (regimeHealthVal > 0) { regimeHealthLabel = 'CRITICAL'; regimeHealthColor = 'var(--dred)'; }
    else { regimeHealthLabel = 'COLLAPSED'; regimeHealthColor = 'var(--dred)'; }

    // Vital helpers
    function vitalColor(val, inv) { const v = inv ? (100 - val) : val; return v >= 70 ? 'var(--dgreen)' : v >= 45 ? 'var(--dorange)' : 'var(--dred)'; }
    function vitalLabel(val, inv) { const v = inv ? (100 - val) : val; return v >= 70 ? 'HIGH' : v >= 45 ? 'MODERATE' : 'LOW'; }

    const pressF = Math.round(Number(n.press_freedom ?? 50));
    const corruption = Math.round(Number(n.corruption ?? 50));
    const freedomIdx = Math.round(Number(n.freedom_index ?? 50));

    // Revolution threat
    const revActive = n.revolution_started_tick != null && n.revolution_duration != null;
    const revRemaining = revActive ? Math.max(0, n.revolution_duration - (currentTick - n.revolution_started_tick)) : 0;
    let threatHtml = '';
    if (revActive) {
        threatHtml = `<div class="reg-section"><div class="reg-section-title" style="color:var(--dred)">REVOLUTION THREAT</div>
            <div style="color:var(--dred);font-weight:700;padding:8px 0">DEMOCRATIC REVOLUTION IN PROGRESS — ${revRemaining} ticks remaining</div></div>`;
    } else {
        const risks = [];
        if (stability < 25) risks.push('Stability critically low');
        if (civilUnrest > 40) risks.push('Civil Unrest dangerously high');
        if (risks.length > 0) {
            threatHtml = `<div class="reg-section"><div class="reg-section-title" style="color:var(--dorange)">REVOLUTION THREAT</div>
                <div style="color:var(--dorange);font-size:11px;padding:4px 0">${risks.join(' · ')}</div></div>`;
        }
    }

    // Loyalty visibility: exact if strongman, own faction, or regime health critical
    const canSeeExactLoyalty = (fid) => isStrongman || fid === f.id || regimeHealthVal < 20;
    const canSeeLoyaltyLabel = (fid) => isStrongman || regimeHealthVal < 40;

    // Head of state info
    const hosFirst = n.head_of_state_first_name || 'Unknown';
    const hosLast = n.head_of_state_last_name || '';
    const hosAge = n.head_of_state_age || '?';

    // ── Pillar cards (display only) ──
    const pillarCardsHtml = PILLAR_ORDER.map(key => {
        const pil = pillarMap[key] || {};
        const support = Math.round(pil.support ?? 50);
        const icon = PILLAR_ICONS[key] || '';
        const name = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const steward = stewardByPillar[key];
        const stewardInfo = steward
            ? `<div class="reg-pillar-steward">${escapeHtml(steward.first_name + ' ' + steward.last_name)} — ${escapeHtml(factionNameMap[steward.faction_id] || '?')}${steward.is_chosen_successor ? ' <span style="color:var(--damber)">HEIR</span>' : ''}</div>`
            : (!isStrongman && !mySteward ? `<button class="reg-pillar-claim-btn" data-pillar-id="${pil.id || ''}" data-pillar-key="${key}" data-pillar-name="${name}">BECOME STEWARD</button>` : `<div class="reg-pillar-steward" style="opacity:0.5">Unclaimed</div>`);
        return `<div class="reg-pillar-card">
            <div class="reg-pillar-icon">${icon}</div>
            <div class="reg-pillar-name">${name}</div>
            <div class="reg-pillar-bar-track"><div class="reg-pillar-bar-fill" style="width:${support}%;background:${pillarColor(support)}"></div></div>
            <div class="reg-pillar-label" style="color:${pillarColor(support)}">${support}% — ${pillarLabel(support)}</div>
            ${stewardInfo}
        </div>`;
    }).join('');

    // ── Steward Status (non-strongman) ──
    let stewardStatusHtml = '';
    if (!isStrongman && mySteward) {
        const stType = STEWARD_TYPE_LABELS[mySteward.steward_type] || mySteward.steward_type;
        const stDesc = STEWARD_TYPE_DESCRIPTIONS[mySteward.steward_type] || '';
        const stTrueLoyalty = Math.round(mySteward.true_loyalty ?? 50);
        const stCoupReadiness = Math.round(mySteward.coup_readiness ?? 0);
        const stPersonalWealth = Math.round(Number(f.embezzled_funds ?? 0));
        const stExitReadiness = Math.round(mySteward.exit_readiness ?? 0);
        const stSuccStrength = mySteward.is_chosen_successor ? Math.round(mySteward.succession_strength ?? 0) : null;

        function loyaltyColor(v) { return v >= 70 ? 'var(--dgreen)' : v >= 50 ? 'var(--dgreen)' : v >= 30 ? 'var(--dorange)' : v >= 15 ? 'var(--dred)' : 'var(--dred)'; }
        function coupColor(v) { return v >= 60 ? 'var(--dgreen)' : v >= 30 ? 'var(--dorange)' : v >= 10 ? 'var(--dred)' : 'var(--dred)'; }

        stewardStatusHtml = `
        <div class="reg-section">
            <div class="reg-section-title">STEWARD STATUS</div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <span style="font-weight:700;color:var(--dtext-1)">${escapeHtml(mySteward.first_name + ' ' + mySteward.last_name)}</span>
                <span style="font-size:10px;color:var(--dtext-3)">${escapeHtml(stType)}</span>
                ${mySteward.is_chosen_successor ? '<span style="color:var(--damber);font-size:10px;font-weight:700">CHOSEN SUCCESSOR</span>' : ''}
            </div>
            <div style="font-size:10px;color:var(--dtext-3);margin-bottom:12px">${escapeHtml(stDesc)}</div>
            <div class="reg-vitals-grid">
                <div class="reg-vital">
                    <span class="reg-vital-label">TRUE LOYALTY</span>
                    <span class="reg-vital-val" style="color:${loyaltyColor(stTrueLoyalty)}">${stTrueLoyalty}</span>
                </div>
                <div class="reg-vital">
                    <span class="reg-vital-label">COUP READINESS</span>
                    <span class="reg-vital-val" style="color:${coupColor(stCoupReadiness)}">${stCoupReadiness}${stCoupReadiness >= 60 ? ' — READY' : ''}</span>
                </div>
                <div class="reg-vital">
                    <span class="reg-vital-label">WAR CHEST</span>
                    <span class="reg-vital-val" style="color:var(--dtext-1)">$${stPersonalWealth}M</span>
                </div>
                <div class="reg-vital">
                    <span class="reg-vital-label">EXIT READINESS</span>
                    <span class="reg-vital-val" style="color:${stExitReadiness >= 60 ? 'var(--dgreen)' : stExitReadiness >= 30 ? 'var(--dorange)' : 'var(--dred)'}">${stExitReadiness}</span>
                </div>
                ${stSuccStrength !== null ? `<div class="reg-vital">
                    <span class="reg-vital-label">SUCCESSION STRENGTH</span>
                    <span class="reg-vital-val" style="color:var(--damber)">${stSuccStrength}</span>
                </div>` : ''}
            </div>
        </div>`;
    } else if (!isStrongman && !mySteward) {
        stewardStatusHtml = `
        <div class="reg-section">
            <div class="reg-section-title">STEWARD STATUS</div>
            <div style="color:var(--dtext-3);font-size:12px;padding:8px 0">You have not claimed a pillar yet. Choose one below to become a steward.</div>
        </div>`;
    }

    // ── Faction Intelligence ──
    const sortedFactions = [...(allParties || [])].sort((a, b) => {
        if (a.id === rulingId) return -1;
        if (b.id === rulingId) return 1;
        return (b.seats || 0) - (a.seats || 0);
    });

    const factionIntelRows = sortedFactions.map(p => {
        const isPlayer = p.id === f.id;
        const isRuling = p.id === rulingId;
        const steward = stewardByFaction[p.id];
        const mCount = ministryCounts[p.id] || 0;
        const mKeys = (ministryByParty[p.id] || []).map(k => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ');

        let loyaltyDisplay;
        if (isRuling) {
            loyaltyDisplay = '<span style="color:var(--dtext-3)">—</span>';
        } else if (canSeeExactLoyalty(p.id)) {
            const loy = Math.round(p.loyalty ?? 50);
            loyaltyDisplay = `<span style="color:${loy >= 70 ? 'var(--dgreen)' : loy >= 50 ? 'var(--dgreen)' : loy >= 30 ? 'var(--dorange)' : 'var(--dred)'}">${loy}</span>`;
        } else if (canSeeLoyaltyLabel(p.id)) {
            const loy = Math.round(p.loyalty ?? 50);
            const ll = loy >= 70 ? 'LOYAL' : loy >= 50 ? 'CONTENT' : loy >= 30 ? 'RESTLESS' : loy >= 15 ? 'HOSTILE' : 'MUTINOUS';
            loyaltyDisplay = `<span style="color:${loy >= 70 ? 'var(--dgreen)' : loy >= 50 ? 'var(--dgreen)' : loy >= 30 ? 'var(--dorange)' : 'var(--dred)'}">${ll}</span>`;
        } else {
            loyaltyDisplay = '<span style="color:var(--dtext-3)">?</span>';
        }

        let stewardHtml = '';
        if (steward) {
            const stLabel = STEWARD_TYPE_LABELS[steward.steward_type] || steward.steward_type;
            stewardHtml = `<div style="font-size:10px;color:var(--dtext-3);margin-top:4px">${escapeHtml(steward.first_name + ' ' + steward.last_name)} — ${escapeHtml(stLabel)}${steward.is_chosen_successor ? ' <span style="color:var(--damber)">HEIR</span>' : ''}</div>`;
            if (isStrongman && steward.estimated_loyalty != null) {
                const est = Math.round(steward.estimated_loyalty);
                stewardHtml += `<div style="font-size:9px;color:var(--dtext-3)">Est. Loyalty: ${est}</div>`;
            }
        }

        return `<div class="reg-intel-row" style="border-left:3px solid ${p.party_color || 'var(--dtext-3)'};padding:8px 12px;margin-bottom:6px;background:rgba(255,255,255,0.02);border-radius:3px">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-weight:700;color:var(--dtext-1)">${escapeHtml(p.faction_name)}${isPlayer ? ' <span style="color:var(--damber);font-size:9px">[YOU]</span>' : ''}${isRuling ? ' <span style="color:var(--dgreen);font-size:9px">[RULING]</span>' : ''}</span>
                <span style="font-size:11px;color:var(--dtext-2)">${p.seats || 0} seats</span>
            </div>
            <div style="display:flex;gap:16px;margin-top:4px;font-size:11px">
                <span>Loyalty: ${loyaltyDisplay}</span>
                <span>Standing: <span style="color:var(--dtext-2)">${Math.round(p.standing ?? 0)}</span></span>
                <span>Ministries: <span style="color:var(--dtext-2)">${mCount > 0 ? mKeys : 'None'}</span></span>
            </div>
            ${stewardHtml}
        </div>`;
    }).join('');

    // ── Regime Log ──
    const ACTION_LABELS = {
        rally: 'RALLY', outreach: 'OUTREACH', attack: 'ATTACK', make_promise: 'PROMISE',
        demand_loyalty: 'DEMAND', pledge_allegiance: 'PLEDGE', consolidate_power: 'CONSOLIDATE',
        demonstrate_competence: 'DEMONSTRATE', embezzle: 'EMBEZZLE', show_of_force: 'SHOW OF FORCE',
        mobilize: 'MOBILIZE', dynasty: 'DYNASTY', purge: 'PURGE', redistribute_seats: 'REDISTRIBUTE',
        coup_attempt: 'COUP', intimidation: 'INTIMIDATE', buy_influence: 'BUY INFLUENCE',
    };

    const regimeLogHtml = (regimeLog || []).slice(0, 15).map(log => {
        const label = ACTION_LABELS[log.action_type] || log.action_type?.toUpperCase() || '?';
        const actorName = factionNameMap[log.party_id] || '?';
        const date = tickToDate(log.tick_performed);
        const detail = log.result?.detail || log.result?.target_faction || '';
        return `<div style="display:flex;gap:8px;align-items:baseline;font-size:10px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
            <span style="color:var(--dtext-3);min-width:60px">${date}</span>
            <span style="color:var(--dtext-2);min-width:30px">${escapeHtml(actorName.substring(0, 8))}</span>
            <span style="color:var(--daccent-1);font-weight:700">${label}</span>
            <span style="color:var(--dtext-3)">${detail ? escapeHtml(String(detail).substring(0, 40)) : ''}</span>
        </div>`;
    }).join('');

    // ── Pending Loyalty Demand Banner ──
    const myPendingDemand = (loyaltyDemands || []).find(d => d.target_faction_id === f.id && d.status === 'pending');
    let demandBannerHtml = '';
    if (!isStrongman && myPendingDemand) {
        const deadline = myPendingDemand.deadline_tick || (myPendingDemand.demanded_at_tick + 2);
        const ticksLeft = Math.max(0, deadline - currentTick);
        demandBannerHtml = `<div style="background:var(--dred-faint);border:1px solid var(--dred-border);border-radius:3px;padding:12px;margin:8px 0;text-align:center">
            <div style="color:var(--dred);font-weight:700;font-size:12px">THE STRONGMAN DEMANDS YOUR LOYALTY</div>
            <div style="color:var(--dtext-3);font-size:10px;margin-top:4px">${ticksLeft} tick${ticksLeft !== 1 ? 's' : ''} to respond</div>
        </div>`;
    }

    // ── Known Coalitions (strongman view) ──
    let coalitionIntelHtml = '';
    if (isStrongman && autoCoalitions && autoCoalitions.length > 0) {
        const publicOnes = autoCoalitions.filter(c => c.coalition_type === 'public' && c.status === 'active');
        const rows = publicOnes.map(c => {
            const a = factionNameMap[c.faction_a_id] || '?';
            const b = factionNameMap[c.faction_b_id] || '?';
            return `<div style="font-size:11px;color:var(--dtext-2);padding:4px 0">${escapeHtml(a)} + ${escapeHtml(b)} <span style="color:var(--dtext-3)">(PUBLIC)</span></div>`;
        }).join('');
        if (rows) {
            coalitionIntelHtml = `<div class="reg-section"><div class="reg-section-title">KNOWN COALITIONS</div>${rows}</div>`;
        }
    }

    // ── Assemble the full autocracy politics tab ──
    return `
    <div class="pol-page">
        <div class="reg-panel">
            <div class="reg-header">
                <div class="reg-header-left">
                    <div class="reg-nation-name">${escapeHtml(n.name || '')}</div>
                    <div class="reg-gov-type">${escapeHtml(n.government_type || 'Autocracy')} &middot; TICK ${currentTick}</div>
                </div>
                <div class="reg-header-ap">
                    <div class="reg-ap-label">ACTION POINTS</div>
                    <div class="reg-ap-value">
                        <span class="reg-ap-current" style="color:${(f.action_points ?? 0) < 5 ? ((f.action_points ?? 0) < 2 ? 'var(--dred)' : 'var(--dorange)') : 'var(--dtext-0)'}">${f.action_points ?? 0}</span>
                        <span class="reg-ap-max">/ ${GAME_CONFIG.MAX_AP}</span>
                    </div>
                </div>
                <div class="reg-header-right">
                    <div class="reg-strongman-label">STRONGMAN</div>
                    <div class="reg-strongman-name">${escapeHtml(hosFirst)} ${escapeHtml(hosLast)}</div>
                    <div class="reg-strongman-faction">${rulingFaction ? escapeHtml(rulingFaction.faction_name) : 'Unknown'}</div>
                    <div class="reg-strongman-meta">Age ${hosAge}</div>
                </div>
            </div>

            <div class="reg-strip">
                <div class="reg-strip-item">
                    <span class="reg-strip-label">REGIME</span>
                    <span class="reg-strip-value" style="color:${gripColor}">${gripLabel}</span>
                </div>
                <div class="reg-strip-item">
                    <span class="reg-strip-label">SUCCESSION</span>
                    <span class="reg-strip-value" style="color:${successionColor}">${escapeHtml(successionLabel)}</span>
                </div>
            </div>

            ${demandBannerHtml}

            <div class="reg-body">
                <div class="reg-col-left">
                    <div class="reg-section">
                        <div class="reg-section-title">GRIP ON POWER</div>
                        ${isStrongman ? `
                        <div class="reg-grip-row">
                            <span class="reg-grip-score" style="color:${gripColor}">${gripClamped}</span>
                            <div class="reg-grip-bar-track">
                                <div class="reg-grip-bar-fill" style="width:${gripClamped}%;background:${gripColor}"></div>
                            </div>
                            <span class="reg-grip-label" style="color:${gripColor}">${gripLabel}</span>
                        </div>` : `
                        <div class="reg-grip-row">
                            <div class="reg-grip-bar-track">
                                <div class="reg-grip-bar-fill" style="width:${gripClamped}%;background:${gripColor}"></div>
                            </div>
                            <span class="reg-grip-label" style="color:${gripColor}">${gripLabel}</span>
                        </div>`}
                    </div>

                    <div class="reg-section">
                        <div class="reg-section-title">REGIME HEALTH</div>
                        <div class="reg-grip-row">
                            <span class="reg-grip-score" style="color:${regimeHealthColor}">${regimeHealthVal}</span>
                            <div class="reg-grip-bar-track">
                                <div class="reg-grip-bar-fill" style="width:${regimeHealthPct}%;background:${regimeHealthColor}"></div>
                            </div>
                            <span class="reg-grip-label" style="color:${regimeHealthColor}">${regimeHealthLabel}</span>
                        </div>
                        <div class="reg-regime-health-note">${regimeHealthVal < 20 && regimeHealthVal > 0 ? 'The regime is collapsing. All loyalty scores are now visible.' : regimeHealthVal < 40 ? 'The regime is in decline. Loyalty decay accelerated.' : regimeHealthVal < 60 ? 'The regime shows signs of strain.' : 'Natural decay: -0.5/tick'}</div>
                    </div>

                    ${stewardStatusHtml}

                    <div class="reg-section">
                        <div class="reg-section-title">REGIME VITALS</div>
                        <div class="reg-vitals-grid">
                            <div class="reg-vital">
                                <span class="reg-vital-label">STABILITY</span>
                                <span class="reg-vital-val" style="color:${vitalColor(stability, false)}">${isStrongman ? stability : vitalLabel(stability, false)}</span>
                            </div>
                            <div class="reg-vital">
                                <span class="reg-vital-label">LEGITIMACY</span>
                                <span class="reg-vital-val" style="color:${vitalColor(legitimacy, false)}">${isStrongman ? legitimacy : vitalLabel(legitimacy, false)}</span>
                            </div>
                            <div class="reg-vital">
                                <span class="reg-vital-label">CIVIL UNREST</span>
                                <span class="reg-vital-val" style="color:${vitalColor(civilUnrest, true)}">${isStrongman ? civilUnrest : vitalLabel(civilUnrest, true)}</span>
                            </div>
                            <div class="reg-vital">
                                <span class="reg-vital-label">CORRUPTION</span>
                                <span class="reg-vital-val" style="color:${vitalColor(corruption, true)}">${isStrongman ? corruption : vitalLabel(corruption, true)}</span>
                            </div>
                            <div class="reg-vital">
                                <span class="reg-vital-label">PRESS FREEDOM</span>
                                <span class="reg-vital-val" style="color:${vitalColor(pressF, true)}">${isStrongman ? pressF : vitalLabel(pressF, true)}</span>
                            </div>
                            <div class="reg-vital">
                                <span class="reg-vital-label">FREEDOM INDEX</span>
                                <span class="reg-vital-val" style="color:${vitalColor(freedomIdx, true)}">${isStrongman ? freedomIdx : vitalLabel(freedomIdx, true)}</span>
                            </div>
                        </div>
                    </div>

                    ${threatHtml}
                </div>

                <div class="reg-col-right">
                    <div class="reg-section">
                        <div class="reg-section-title">PILLARS OF THE REGIME</div>
                        <div class="reg-pillar-grid">${pillarCardsHtml}</div>
                    </div>

                    <div class="reg-section">
                        <div class="reg-section-title">FACTION INTELLIGENCE</div>
                        <div class="reg-intel-list">${factionIntelRows || '<div style="color:var(--dtext-3)">No factions in the regime</div>'}</div>
                    </div>

                    ${coalitionIntelHtml}

                    ${regimeLogHtml ? `<div class="reg-section">
                        <div class="reg-section-title">REGIME LOG</div>
                        <div style="max-height:250px;overflow-y:auto">${regimeLogHtml}</div>
                    </div>` : ''}
                </div>
            </div>
        </div>

        <div id="steward-confirm-overlay" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;align-items:center;justify-content:center">
            <div style="background:var(--dbg-2);border:1px solid var(--dborder-1);border-radius:3px;padding:24px;max-width:400px;text-align:center">
                <div id="steward-confirm-title" style="font-weight:700;font-size:16px;color:var(--dtext-1);margin-bottom:12px"></div>
                <div id="steward-confirm-text" style="font-size:12px;color:var(--dtext-2);margin-bottom:20px"></div>
                <div style="display:flex;gap:12px;justify-content:center">
                    <button id="steward-confirm-yes" style="background:var(--dgreen);color:#fff;border:none;padding:8px 20px;border-radius:3px;cursor:pointer;font-weight:700">CONFIRM</button>
                    <button id="steward-confirm-no" style="background:var(--dbg-3);color:var(--dtext-2);border:1px solid var(--dborder-1);padding:8px 20px;border-radius:3px;cursor:pointer">CANCEL</button>
                </div>
            </div>
        </div>
    </div>`;
}

function initAutocracyStewardClaims(f, nation, stewardRows, regimePillars) {
    document.querySelectorAll('.reg-pillar-claim-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pillarId = btn.dataset.pillarId;
            const pillarKey = btn.dataset.pillarKey;
            const pillarName = btn.dataset.pillarName;
            const stewardType = PILLAR_TO_STEWARD_TYPE[pillarKey] || 'technocrat';
            const typeLabel = STEWARD_TYPE_LABELS[stewardType] || stewardType;

            const overlay = document.getElementById('steward-confirm-overlay');
            const titleEl = document.getElementById('steward-confirm-title');
            const textEl = document.getElementById('steward-confirm-text');
            const yesBtn = document.getElementById('steward-confirm-yes');
            const noBtn = document.getElementById('steward-confirm-no');
            if (!overlay) return;

            titleEl.textContent = `Become ${typeLabel}`;
            textEl.textContent = `You will become the ${typeLabel} \u2014 Steward of ${pillarName}. This choice is permanent. Proceed?`;
            overlay.style.display = 'flex';

            const newYes = yesBtn.cloneNode(true);
            const newNo = noBtn.cloneNode(true);
            yesBtn.replaceWith(newYes);
            noBtn.replaceWith(newNo);

            newNo.addEventListener('click', () => { overlay.style.display = 'none'; });

            newYes.addEventListener('click', async () => {
                overlay.style.display = 'none';
                btn.disabled = true;
                btn.textContent = 'Claiming...';

                const { error } = await _supabase
                    .from('regime_pillars')
                    .update({ steward_faction_id: f.id })
                    .eq('id', pillarId)
                    .is('steward_faction_id', null);

                if (error) {
                    console.error('[pillar-claim]', error);
                    btn.textContent = 'Failed';
                    setTimeout(() => { btn.textContent = 'BECOME STEWARD'; btn.disabled = false; }, 2000);
                    return;
                }

                // Generate steward identity
                const { firstNames: stewFirstPool, lastNames: stewLastPool } = getNationNames(nation.name);
                const firstName = stewFirstPool[Math.floor(Math.random() * stewFirstPool.length)];
                const existingLastNames = new Set(
                    (stewardRows || []).filter(s => s.is_alive !== false).map(s => s.last_name)
                );
                let lastName;
                do {
                    lastName = stewLastPool[Math.floor(Math.random() * stewLastPool.length)];
                } while (existingLastNames.has(lastName) && existingLastNames.size < stewLastPool.length);

                const age = 35 + Math.floor(Math.random() * 30);

                await _supabase.from('stewards').insert({
                    nation_id: nation.id, faction_id: f.id, pillar_key: pillarKey,
                    steward_type: stewardType, first_name: firstName, last_name: lastName,
                    age, is_alive: true, true_loyalty: 50, estimated_loyalty: 50,
                    coup_readiness: 0, exit_readiness: 0, succession_strength: 0,
                    is_chosen_successor: false
                });

                await _supabase.from('campaign_actions').insert({
                    party_id: f.id, nation_id: nation.id, action_type: 'become_steward',
                    tick_performed: 0, result: { pillar: pillarKey, steward_type: stewardType, name: firstName + ' ' + lastName }
                });

                location.reload();
            });
        });
    });
}

function renderModifiersBox(f) {
    const hasLeader = f.leader_first_name && f.leader_last_name;
    const ideo1 = f.ideology_value_1 || null;
    const modCount = (hasLeader && ideo1) ? 1 : 0;

    let bodyHtml;
    if (hasLeader && ideo1) {
        const leaderFull = escapeHtml(f.leader_first_name + ' ' + f.leader_last_name);
        const ideoLabel = ideo1.charAt(0).toUpperCase() + ideo1.slice(1).toLowerCase();
        bodyHtml = `
            <div class="pol-mod-card">
                <div class="pol-mod-card-header">
                    <span class="pol-mod-icon">★</span>
                    <span class="pol-mod-label">${leaderFull} — ${escapeHtml(ideoLabel)}</span>
                </div>
                <div class="pol-mod-effect">+5 Voter Preference with ${escapeHtml(ideoLabel)} voter blocs</div>
                <div class="pol-mod-footer">
                    <span class="pol-mod-source">Leader Ideology</span>
                    <span class="pol-mod-expires">While leader</span>
                </div>
            </div>`;
    } else {
        bodyHtml = `<div class="pol-mod-empty">No active modifiers.</div>`;
    }

    return `
        <div class="pol-modifiers-box">
            <div class="pol-mod-header">
                <span class="pol-mod-title">Party Modifiers</span>
                <span class="pol-mod-count">${modCount} active</span>
            </div>
            ${bodyHtml}
        </div>`;
}

function miniLogo(color, acronym, name) {
    const c = color || '#8a8778';
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
    if (g === 'autocracy' || g.includes('dictator') || g.includes('authorit')) return 'Strongman';
    return 'Head of Gov.';
}

function renderParliamentBox(allParties, coalition, nation, playerFactionId) {
    const parties = allParties || [];
    const totalSeats = parties.reduce((sum, p) => sum + (p.seats || 0), 0);
    const majority = Math.ceil(totalSeats / 2);
    const isAuto = isAutocracy(nation);

    // For autocracies without a coalition, use ruling_faction_id to split governing/opposition
    let coalitionIds, leadPartyId;
    if (isAuto && !coalition && nation.ruling_faction_id) {
        coalitionIds = new Set([nation.ruling_faction_id]);
        leadPartyId = nation.ruling_faction_id;
    } else {
        coalitionIds = new Set(coalition?.party_ids || []);
        leadPartyId = coalition?.lead_party_id || null;
    }

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
            const c = p.party_color || '#8a8778';
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
                <span class="pol-parl-title">Parliament</span>
                <span class="pol-parl-seats-count">${totalSeats} seats</span>
            </div>

            <div class="pol-seat-bar-wrap">
                <div class="pol-seat-bar">${segmentsHtml}</div>
                ${majorityLineHtml}
            </div>

            <div class="pol-section-header">
                <span class="pol-section-title">${isAuto ? 'Ruling Party' : 'Governing Coalition'}</span>
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
        </div>`;
}

const ISSUE_DISPLAY_NAMES = {
    Economics: 'Economy', Military: 'Security', Social: 'Quality of Life',
    Governance: 'Governance', Healthcare: 'Healthcare', Education: 'Education',
    Immigration: 'Immigration', Labor: 'Labor & Jobs', Infrastructure: 'Infrastructure',
    International: 'Foreign Affairs', Agriculture: 'Agriculture'
};

function computeIssueImportance(nation, statKeys) {
    let total = 0, count = 0;
    for (const key of statKeys) {
        const val = Number(nation[key] ?? 50);
        const dir = statDirectionSign(key);
        if (dir === 0) continue;
        // Higher-is-better: badness = 100 - val. Lower-is-better: badness = val.
        const badness = dir === 1 ? (100 - val) : val;
        total += Math.max(0, Math.min(100, badness));
        count++;
    }
    return count > 0 ? Math.round(total / count) : 0;
}

function importanceColor(pct) {
    if (pct >= 60) return 'var(--dred)';
    if (pct >= 40) return 'var(--damber)';
    return 'var(--dgreen)';
}

function renderIdeologyBox(allParties, allPartyIdeologies, playerFactionId) {
    const parties = allParties || [];
    const ideoMap = {};
    for (const row of (allPartyIdeologies || [])) {
        ideoMap[row.faction_id] = row;
    }

    // Build party data with ideology positions
    const partyData = parties.map(p => ({
        id: p.id,
        name: p.faction_name || 'Unknown',
        abbr: p.abbreviation || (p.faction_name || '??').substring(0, 2).toUpperCase(),
        color: p.party_color || '#8a8778',
        isPlayer: p.id === playerFactionId,
        ideo: ideoMap[p.id] || {}
    }));

    // Party legend (clickable to toggle visibility)
    const legendHtml = partyData.map(p =>
        `<div class="pol-ideo-legend-item" data-ideo-party="${p.id}" title="Click to toggle">
            <div class="pol-ideo-legend-dot" style="background:${p.color}"></div>
            <span class="pol-ideo-legend-abbr" style="color:${p.color}">${escapeHtml(p.abbr)}</span>
            ${p.isPlayer ? '<span class="pol-ideo-legend-you">YOU</span>' : ''}
        </div>`
    ).join('');

    // Zone legend
    const zoneLegendHtml = `
        <div class="pol-ideo-zone-legend">
            <div class="pol-ideo-zone-item">
                <div class="pol-ideo-zone-line" style="background:rgba(250,204,21,0.33)"></div>
                <span class="pol-ideo-zone-label">Centrist / Moderate</span>
            </div>
            <div class="pol-ideo-zone-item">
                <div class="pol-ideo-zone-line" style="background:rgba(239,68,68,0.33)"></div>
                <span class="pol-ideo-zone-label">Moderate / Radical</span>
            </div>
        </div>`;

    // Axis tracks
    const axesHtml = IDEOLOGY_AXES.map(ax => {
        // Party markers on this axis
        const markersHtml = partyData.map(p => {
            const rawVal = Number(p.ideo[ax.key] ?? 0); // -100 to +100
            const pos = (rawVal + 100) / 2; // normalize to 0–100
            return `<div class="pol-ideo-marker" data-ideo-party="${p.id}" style="left:${pos}%;width:10px;height:10px;background:${p.color}"></div>`;
        }).join('');

        return `<div>
            <div class="pol-ideo-axis-labels">
                <span class="pol-ideo-axis-label">${escapeHtml(ax.leftLabel)}</span>
                <span class="pol-ideo-axis-label">${escapeHtml(ax.rightLabel)}</span>
            </div>
            <div class="pol-ideo-track">
                <div class="pol-ideo-zone-line-v" style="left:15%;background:rgba(239,68,68,0.2)"></div>
                <div class="pol-ideo-zone-line-v" style="left:85%;background:rgba(239,68,68,0.2)"></div>
                <div class="pol-ideo-zone-line-v" style="left:35%;background:rgba(250,204,21,0.2)"></div>
                <div class="pol-ideo-zone-line-v" style="left:65%;background:rgba(250,204,21,0.2)"></div>
                <div class="pol-ideo-center-line"></div>
                ${markersHtml}
            </div>
        </div>`;
    }).join('');

    // Party stance summaries
    const summariesHtml = partyData.map(p => {
        const stances = [];
        for (const ax of IDEOLOGY_AXES) {
            const raw = Number(p.ideo[ax.key] ?? 0);
            const pos = (raw + 100) / 2; // 0-100
            if (pos >= 35 && pos <= 65) continue; // centrist — skip
            const side = pos < 50 ? ax.leftLabel : ax.rightLabel;
            const zone = (pos <= 15 || pos >= 85) ? 'Radical' : 'Moderate';
            const zoneColor = zone === 'Radical' ? 'var(--dred)' : 'var(--damber)';
            stances.push(`<span style="color:${zoneColor}">${zone}</span> ${escapeHtml(side)}`);
        }
        if (stances.length === 0) return '';
        return `<div class="pol-ideo-summary-row" data-ideo-party="${p.id}">
            <span class="pol-ideo-summary-abbr" style="color:${p.color}">${escapeHtml(p.abbr)}:</span>
            <span class="pol-ideo-summary-stances">${stances.join(', ')}</span>
        </div>`;
    }).filter(Boolean).join('');

    // Decay rates for player's party
    const playerParty = partyData.find(p => p.isPlayer);
    let decayHtml = '';
    if (playerParty) {
        const decayItems = [];
        for (const ax of IDEOLOGY_AXES) {
            const score = Number(playerParty.ideo[ax.key] ?? 0);
            if (Math.abs(score) <= 10) continue; // dead zone
            const decay = -(Math.abs(score) / 50) * Math.sign(score);
            const decayRounded = Math.round(decay * 100) / 100;
            const side = score > 0 ? ax.rightLabel : ax.leftLabel;
            decayItems.push(`<span style="color:var(--dtxt-muted)">${escapeHtml(side)}</span> <span style="color:var(--dred)">${decayRounded > 0 ? '+' : ''}${decayRounded.toFixed(1)}/tick</span>`);
        }
        if (decayItems.length > 0) {
            decayHtml = `<div class="pol-ideo-decay" style="padding:6px 10px;font-size:11px;color:var(--dtxt-muted);border-top:1px solid var(--dborder)">
                <span style="opacity:0.7">Drift toward center:</span> ${decayItems.join(' &middot; ')}
            </div>`;
        }
    }

    return `
        <div class="pol-ideology-box">
            <div class="pol-ideo-header">
                <span class="pol-mod-title">Ideology — All Parties</span>
            </div>
            <div class="pol-ideo-legend">${legendHtml}</div>
            ${zoneLegendHtml}
            <div class="pol-ideo-axes">${axesHtml}</div>
            ${summariesHtml ? `<div class="pol-ideo-summaries">${summariesHtml}</div>` : ''}
            ${decayHtml}
        </div>`;
}

function initIdeologyToggle() {
    const box = document.querySelector('.pol-ideology-box');
    if (!box) return;
    box.querySelectorAll('.pol-ideo-legend-item[data-ideo-party]').forEach(item => {
        item.addEventListener('click', () => {
            const pid = item.getAttribute('data-ideo-party');
            const hidden = item.classList.toggle('ideo-hidden');
            box.querySelectorAll(`.pol-ideo-marker[data-ideo-party="${pid}"]`).forEach(m => {
                m.style.display = hidden ? 'none' : '';
            });
            box.querySelectorAll(`.pol-ideo-summary-row[data-ideo-party="${pid}"]`).forEach(s => {
                s.style.display = hidden ? 'none' : '';
            });
        });
    });
}

function renderForecastBox(allParties, totalSeats, currentTick, nextElection, blocApprovals, playerFactionId) {
    const FORECAST_START = 12;
    const MARGIN_START = 12;
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
                    <span class="pol-mod-title">Election Forecast</span>
                </div>
                ${earlyElectionDate ? `<div style="text-align:center;padding:6px 0 2px;font-size:13px;letter-spacing:0.5px;color:var(--dtxt-secondary)">Next Election: <span style="color:var(--dtxt-primary);font-weight:600">${earlyElectionDate}</span></div>` : ''}
                <div class="pol-fc-empty">
                    <div class="pol-fc-empty-title">Insufficient polling data</div>
                    <div class="pol-fc-empty-detail">${detail}</div>
                </div>
            </div>`;
    }

    // Compute per-party momentum (average across blocs)
    const momMap = {};
    const momCount = {};
    for (const row of (blocApprovals || [])) {
        const fid = row.faction_id;
        momMap[fid] = (momMap[fid] || 0) + Number(row.momentum || 0);
        momCount[fid] = (momCount[fid] || 0) + 1;
    }

    const seatMargin = Math.max(1, MARGIN_START - (FORECAST_START - ticksLeft));

    // Build party forecast data
    const parties = (allParties || []).map(p => {
        const voteShare = Number(p.national_vote_share || 0);
        const estSeats = Math.round((voteShare / 100) * totalSeats);
        const avgMom = momCount[p.id] ? Math.round(momMap[p.id] / momCount[p.id]) : 0;
        return { ...p, estSeats, momentum: avgMom };
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
        const color = p.party_color || '#8a8778';
        const abbr = p.abbreviation || (p.faction_name || '??').substring(0, 2).toUpperCase();
        const isPlayer = p.id === playerFactionId;
        const momColor = p.momentum > 0 ? 'var(--dgreen)' : p.momentum < 0 ? 'var(--dred)' : 'var(--dtxt-muted)';
        const momArrow = p.momentum > 0 ? '▲' : p.momentum < 0 ? '▼' : '—';
        const momText = p.momentum !== 0 ? `${momArrow}${Math.abs(p.momentum)}` : momArrow;
        const majLinePct = (majority / totalSeats) * 100;

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
                <span class="pol-mod-title">Election Forecast</span>
                <span class="pol-fc-phase" style="color:${phaseColor};background:${phaseColor}15">${phase}</span>
            </div>
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
        </div>`;
}

function renderNationalMoodBox(nation, activeCrises, currentTick) {
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

    // Issues section
    const issues = Object.entries(ISSUE_CATEGORY_STATS).map(([key, statKeys]) => ({
        name: ISSUE_DISPLAY_NAMES[key] || key,
        importance: computeIssueImportance(nation, statKeys),
        statKeys
    })).sort((a, b) => b.importance - a.importance);

    const issuesHtml = issues.map((iss, idx) => {
        const color = importanceColor(iss.importance);
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
                    <div class="pol-mood-issue-bar" style="width:${iss.importance}%;background:${color}"></div>
                </div>
                <span class="pol-mood-issue-pct">${iss.importance}%</span>
                <span class="pol-mood-chevron">▸</span>
            </div>
            <div class="pol-mood-stats">${statsHtml}</div>
        </div>`;
    }).join('');

    return `
        <div class="pol-mood-box">
            <div class="pol-mood-header">
                <span class="pol-mood-title">Electorate Issues</span>
            </div>
            <div class="pol-mood-subtitle">Shows which issues matter most to the electorate.</div>
            ${crisesHtml}
            ${issuesHtml}
        </div>`;
}

function computeCategoryContribution(nation, statKeys) {
    let total = 0, count = 0;
    for (const key of statKeys) {
        const val = Number(nation[key] ?? 50);
        const dir = statDirectionSign(key);
        if (dir === 0) continue;
        const goodness = dir === 1 ? val : (100 - val);
        total += Math.max(0, Math.min(100, goodness));
        count++;
    }
    if (count === 0) return { avgGoodness: 50, score: 0 };
    const avgGoodness = total / count;
    const score = Math.round(((avgGoodness - 50) / 5) * 10) / 10;
    return { avgGoodness, score };
}

function formatStatValue(key, val) {
    if (key === 'gdp') {
        if (val >= 1e9) return '$' + Math.round(val / 1e9) + 'B';
        if (val >= 1e6) return '$' + Math.round(val / 1e6) + 'M';
        return '$' + Math.round(val);
    }
    return Math.round(val * 10) / 10;
}

function getRepresentativeStat(nation, statKeys) {
    // Return the stat with the worst individual value
    let worst = null, worstBadness = -1;
    for (const key of statKeys) {
        const val = Number(nation[key] ?? 50);
        const dir = statDirectionSign(key);
        if (dir === 0) continue;
        const badness = dir === 1 ? (100 - val) : val;
        if (badness > worstBadness) {
            worstBadness = badness;
            worst = { key, val: formatStatValue(key, val) };
        }
    }
    return worst;
}

function renderCoalitionOverviewBox(voterBlocs, playerBlocApprovals, allPartyIdeologies, playerFactionId, playerPartyColor) {
    const blocs = voterBlocs || [];
    const approvalMap = {};
    for (const row of (playerBlocApprovals || [])) {
        approvalMap[row.bloc_id] = Number(row.preference_score ?? 40);
    }

    // Classify blocs into tiers based on preference_score
    // BASE: >= 55, LEAN: 42-54, SWING: 30-41, SKEPTICAL: 18-29, HOSTILE: < 18
    const TIER_DEFS = [
        { key: 'BASE', label: 'BASE', min: 55, color: 'var(--dgreen)', dimColor: 'rgba(74,222,128,0.08)' },
        { key: 'LEAN', label: 'LEAN', min: 42, color: '#22d3ee', dimColor: 'rgba(34,211,238,0.08)' },
        { key: 'SWING', label: 'SWING', min: 30, color: 'var(--damber)', dimColor: 'rgba(250,204,21,0.08)' },
        { key: 'SKEPTICAL', label: 'SKEPTICAL', min: 18, color: '#f97316', dimColor: 'rgba(249,115,22,0.08)' },
        { key: 'HOSTILE', label: 'HOSTILE', min: 0, color: 'var(--dred)', dimColor: 'rgba(239,68,68,0.08)' },
    ];

    // Map axis keys from IDEOLOGY_AXES to voter_bloc column names
    const AXIS_COL_MAP = {
        liberty_equality: 'axis_liberty_equality',
        tradition_progress: 'axis_tradition_progress',
        security_freedom: 'axis_security_freedom',
        globalism_nationalism: 'axis_globalism_nationalism',
        individualism_collectivism: 'axis_individualism_collectivism',
    };

    // Assign each bloc to a tier and compute enriched data
    const tierData = TIER_DEFS.map(t => ({ ...t, blocs: 0, weight: 0 }));
    const totalWeight = blocs.reduce((s, b) => s + Number(b.population_weight || 0), 0);

    const enrichedBlocs = [];
    for (const bloc of blocs) {
        const pref = approvalMap[bloc.id] ?? 40;
        const w = Number(bloc.population_weight || 0);
        let tierKey = 'HOSTILE';
        for (const tier of tierData) {
            if (pref >= tier.min) {
                tier.blocs++;
                tier.weight += w;
                tierKey = tier.key;
                break;
            }
        }
        const pct = totalWeight > 0 ? Math.round((w / totalWeight) * 100) : 0;

        // Compute ideology strengths from ideology tags
        const tags = [bloc.ideology_1, bloc.ideology_2, bloc.ideology_3, bloc.ideology_4, bloc.ideology_5]
            .filter(t => t && t !== 'Unaligned').map(t => t.toUpperCase());
        const strengths = {};
        for (const ax of IDEOLOGY_AXES) {
            const col = AXIS_COL_MAP[ax.key];
            const val = Number(bloc[col] ?? 50);
            const hasTag = tags.includes(ax.left) || tags.includes(ax.right);
            const extreme = val <= 20 || val >= 80;
            strengths[ax.key] = hasTag ? 3 : extreme ? 2 : (val <= 30 || val >= 70) ? 1 : 0.5;
        }

        // Collect top issues from priority_issues or ideology tags
        let issues = [];
        if (bloc.priority_issues && Array.isArray(bloc.priority_issues)) {
            issues = bloc.priority_issues.slice(0, 3);
        } else if (tags.length > 0) {
            issues = tags.slice(0, 3).map(t => t.charAt(0) + t.slice(1).toLowerCase());
        }

        enrichedBlocs.push({ ...bloc, pref, pct, tierKey, strengths, issues, tags });
    }

    // Convert weights to percentages
    for (const tier of tierData) {
        tier.pct = totalWeight > 0 ? Math.round((tier.weight / totalWeight) * 100) : 0;
    }

    const basePct = tierData[0].pct;
    const leanPct = tierData[1].pct;
    const swingPct = tierData[2].pct;
    const solidPct = basePct + leanPct;
    const reachable = solidPct + swingPct;
    const conceded = 100 - reachable;

    // Tier cards
    const tierCardsHtml = tierData.map(t =>
        `<div class="pol-co-tier-card" style="border-top:3px solid ${t.color}">
            <div class="pol-co-tier-header">
                <span class="pol-co-tier-label" style="color:${t.color}">${t.label}</span>
                <span class="pol-co-tier-count">${t.blocs}</span>
            </div>
            <div class="pol-co-tier-pct" style="color:${t.color}">${t.pct}%</div>
        </div>`
    ).join('');

    // Electorate bar
    const ebarHtml = tierData.filter(t => t.pct > 0).map(t => {
        const showLabel = t.pct >= 10;
        return `<div class="pol-co-ebar-seg" style="width:${t.pct}%;background:${t.color}22;border-bottom:3px solid ${t.color}">
            <span style="color:${t.color}">${showLabel ? `${t.label} ${t.pct}%` : t.pct}</span>
        </div>`;
    }).join('');

    // Key numbers
    const keyRowHtml = `
        <div class="pol-co-key-row">
            <div class="pol-co-key-block">
                <div class="pol-co-key-value" style="color:var(--dgreen)">${solidPct}%</div>
                <div class="pol-co-key-label">SOLID</div>
            </div>
            <div class="pol-co-key-block">
                <div class="pol-co-key-value" style="color:var(--damber)">${reachable}%</div>
                <div class="pol-co-key-label">REACHABLE</div>
            </div>
            <div class="pol-co-key-block">
                <div class="pol-co-key-value" style="color:var(--dred)">${conceded}%</div>
                <div class="pol-co-key-label">CONCEDED</div>
            </div>
        </div>`;

    // Get player party ideology (convert -100..+100 to 0..100)
    const ideoMap = {};
    for (const row of (allPartyIdeologies || [])) ideoMap[row.faction_id] = row;
    const playerIdeo = ideoMap[playerFactionId] || {};
    const partyColor = playerPartyColor || '#60a5fa';

    // Pre-compute party positions on 0-100 scale
    const partyPositions = {};
    for (const ax of IDEOLOGY_AXES) {
        partyPositions[ax.key] = Math.round((Number(playerIdeo[ax.key] ?? 0) + 100) / 2);
    }

    // Bloc dropdown options — sorted by preference descending
    const sortedBlocs = [...enrichedBlocs].sort((a, b) => b.pref - a.pref);
    const defaultBloc = sortedBlocs[0];

    // Encode enriched bloc data as JSON for the interactivity script
    const blocDataJson = JSON.stringify(sortedBlocs.map(b => ({
        id: b.id,
        name: b.bloc_name,
        pref: b.pref,
        pct: b.pct,
        tier: b.tierKey,
        axes: Object.fromEntries(IDEOLOGY_AXES.map(ax => [ax.key, Number(b[AXIS_COL_MAP[ax.key]] ?? 50)])),
        strengths: b.strengths,
        issues: b.issues,
    }))).replace(/</g, '\\u003c');

    const partyPosJson = JSON.stringify(partyPositions);

    // Dropdown items HTML
    const dropdownItemsHtml = sortedBlocs.map(b => {
        const bt = TIER_DEFS.find(t => t.key === b.tierKey) || TIER_DEFS[4];
        return `<div class="pol-ba-drop-item" data-bloc-id="${b.id}">
            <div class="pol-ba-drop-dot" style="background:${bt.color}"></div>
            <span class="pol-ba-drop-name">${escapeHtml(b.bloc_name)}</span>
            <span class="pol-ba-drop-tier" style="color:${bt.color}">${bt.label}</span>
            <span class="pol-ba-drop-pct">${b.pct}%</span>
            <span class="pol-ba-drop-score" style="color:${bt.color}">${b.pref}</span>
        </div>`;
    }).join('');

    return `<div class="pol-coalition-box">
        <span class="pol-co-section-label">Coalition Overview</span>

        <div class="pol-co-tier-row">${tierCardsHtml}</div>

        <div style="margin-bottom:4px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span class="pol-co-sub-label">Electorate by Tier</span>
                <span style="font-family:var(--dfont-mono);font-size:9px;color:var(--dtext-2)">Reachable: <span style="color:var(--dgreen);font-weight:700">${reachable}%</span></span>
            </div>
            <div class="pol-co-ebar">${ebarHtml}</div>
        </div>

        <div class="pol-sc-divider"></div>
        ${keyRowHtml}
        <div class="pol-sc-divider"></div>

        <!-- BLOC ALIGNMENT -->
        <span class="pol-co-section-label">Bloc Alignment</span>

        <div class="pol-ba-selector" id="pol-ba-selector">
            <div class="pol-ba-selected" id="pol-ba-selected">
                <div class="pol-ba-sel-left">
                    <div class="pol-ba-sel-dot" id="pol-ba-sel-dot"></div>
                    <span class="pol-ba-sel-name" id="pol-ba-sel-name"></span>
                    <span class="pol-ba-sel-badge" id="pol-ba-sel-badge"></span>
                    <span class="pol-ba-sel-pct" id="pol-ba-sel-pct"></span>
                </div>
                <span class="pol-ba-sel-arrow" id="pol-ba-sel-arrow">▼</span>
            </div>
            <div class="pol-ba-dropdown" id="pol-ba-dropdown">
                ${dropdownItemsHtml}
            </div>
        </div>

        <!-- Stats row -->
        <div class="pol-co-key-row" id="pol-ba-stats" style="margin-top:10px">
            <div class="pol-co-key-block">
                <div class="pol-co-key-value" id="pol-ba-alignment">—</div>
                <div class="pol-co-key-label">ALIGNMENT</div>
            </div>
            <div class="pol-co-key-block">
                <div class="pol-co-key-value" id="pol-ba-approval">—</div>
                <div class="pol-co-key-label">APPROVAL</div>
            </div>
            <div class="pol-co-key-block">
                <div class="pol-co-key-value" id="pol-ba-headroom">—</div>
                <div class="pol-co-key-label">HEADROOM</div>
            </div>
        </div>

        <!-- Legend -->
        <div class="pol-ba-legend" style="margin-top:10px">
            <div class="pol-ba-legend-item">
                <div class="pol-ba-legend-dot" style="background:${partyColor}"></div>
                <span style="color:${partyColor}">You</span>
            </div>
            <div class="pol-ba-legend-item">
                <div class="pol-ba-legend-dot" id="pol-ba-legend-bloc-dot"></div>
                <span id="pol-ba-legend-bloc-name"></span>
            </div>
            <span class="pol-ba-legend-hint">● = importance</span>
        </div>

        <!-- Axes -->
        <div id="pol-ba-axes" style="margin-top:6px"></div>

        <!-- Summary -->
        <div class="pol-ba-summary" id="pol-ba-summary" style="margin-top:4px"></div>

        <!-- Issues -->
        <div class="pol-ba-issues" id="pol-ba-issues" style="margin-top:6px"></div>

        <div hidden id="pol-ba-bloc-data">${blocDataJson}</div>
        <div hidden id="pol-ba-party-pos">${partyPosJson}</div>
        <div hidden id="pol-ba-party-color">"${partyColor}"</div>
    </div>`;
}

function renderGovCard(nation, coalition, allParties, currentTick, prevApproval, president, administration) {
    const isPres = isPresidentialRepublic(nation);
    const isAuto = isAutocracy(nation);
    const parties = allParties || [];
    const approval = Math.round(Number(nation.gov_approval ?? 40));
    const ac = approval >= 50 ? 'var(--dgreen)' : approval >= 35 ? 'var(--damber)' : 'var(--dred)';
    const adminName = administration?.admin_name || 'Government';
    const govTypeLabel = isAuto ? 'Autocracy' : isPres ? 'Presidential' : 'Parliamentary';

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
    } else if (!isPres && !isAuto && coalition) {
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
    } else if (isAuto) {
        const hosName = (nation.head_of_state_first_name && nation.head_of_state_last_name)
            ? nation.head_of_state_first_name + ' ' + nation.head_of_state_last_name : 'Unknown';
        const ini = initials(nation.head_of_state_first_name, nation.head_of_state_last_name);
        const rulingParty = nation.ruling_faction_id ? parties.find(p => p.id === nation.ruling_faction_id) : null;
        const rpColor = rulingParty?.party_color || '#c8a64e';
        const rpAbbr = rulingParty?.abbreviation || (rulingParty?.faction_name || '??').substring(0, 3).toUpperCase();
        leader1Html = `
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:4px;background:var(--dbg-4);border:1px solid var(--dborder-0);display:flex;align-items:center;justify-content:center;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);flex-shrink:0">${escapeHtml(ini)}</div>
          <div>
            <div style="font-family:var(--dfont-ui);font-size:14px;font-weight:600;color:var(--dtext-0)">${escapeHtml(hosName)}</div>
            <div style="font-family:var(--dfont-ui);font-size:11px;color:var(--dtext-2);margin-top:1px">Generalísimo${nation.head_of_state_age ? ' &middot; Age ' + nation.head_of_state_age : ''}</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
              <div style="width:7px;height:7px;border-radius:2px;background:${rpColor}"></div>
              <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:500;color:${rpColor}">${escapeHtml(rpAbbr)}</span>
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
    } else if (!isPres && !isAuto && hosFirst && hosLast) {
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
            return `<div style="width:${pct.toFixed(2)}%;height:100%;background:${p.party_color || '#8a8778'}"></div>`;
          }).join('')
        : '';

    // ── Coalition party rows ──
    const partyRowsHtml = sortedGov.map(p =>
        `<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
            <div style="width:7px;height:7px;border-radius:2px;background:${p.party_color || '#8a8778'};flex-shrink:0"></div>
            <span style="font-family:var(--dfont-ui);font-size:12px;color:var(--dtext-0);flex:1">${escapeHtml(p.faction_name || 'Unknown')}</span>
            <span style="font-family:var(--dfont-mono);font-size:12px;font-weight:600;color:${p.party_color || 'var(--dtext-0)'}">${p.seats || 0}</span>
        </div>`
    ).join('');

    // ── Footer ──
    const govLabel = isMajority ? 'Majority Government' : 'Minority Government';
    const footerDetail = `${govSeats}/${totalSeats} seats (${majority} needed)`;

    return `<div class="pol-admin-box">
        <div style="font-family:var(--dfont-ui);font-size:16px;font-weight:700;color:var(--dtext-0);margin-bottom:8px">${escapeHtml(adminName)}</div>
        <div style="display:flex;gap:6px;margin-bottom:16px">
            <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:3px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${escapeHtml(govTypeLabel)}</span>
            ${coalitionBadge ? `<span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:3px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${escapeHtml(coalitionBadge)}</span>` : ''}
        </div>

        ${leader1Html}
        ${leader2Html}

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Governing Coalition</div>
        <div style="display:flex;height:10px;border-radius:3px;overflow:hidden;background:rgba(255,255,255,0.04);margin-bottom:10px">${barHtml}</div>
        ${partyRowsHtml}
        <div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);text-align:right;margin-top:4px">${govSeats} seats combined</div>

        <div style="height:1px;background:var(--dborder-0);margin:14px 0"></div>

        <div style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--dtext-2);margin-bottom:8px">Approval</div>
        <div style="font-family:var(--dfont-mono);font-size:28px;font-weight:700;line-height:1;color:${ac}">${approval}%</div>

        <div style="background:var(--dbg-4);border-top:1px solid var(--dborder-0);margin:16px -20px -16px;padding:10px 20px;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-2);letter-spacing:0.04em;display:flex;align-items:center;gap:8px;border-radius:0 0 4px 4px">
            <span style="text-transform:uppercase">${escapeHtml(govLabel)}</span>
            <span style="color:var(--dtext-3);font-weight:400">${escapeHtml(footerDetail)}</span>
        </div>
    </div>`;
}

const RENAME_AP_COST  = 3;
const RENAME_COOLDOWN = 60;
const MAX_DESC        = 200;
const MAX_FILE_KB     = 256;

function renderEditIdentityBox(f, currentTick) {
    const color = f.party_color || '#ffcc00';
    const icon  = f.party_logo || 'flag';
    const desc  = f.party_description || '';
    const ap    = f.action_points || 0;
    const lastRenameTick = f.last_rename_tick || 0;
    const cooldownRemaining = Math.max(0, RENAME_COOLDOWN - (currentTick - lastRenameTick));
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
            const svg = getPartyIconSVG(item.key, 16, item.key === icon ? color : '#8a8778');
            iconsHtml += `<div class="pol-id-icon-tile${sel}" data-icon="${item.key}" title="${escapeHtml(item.label)}" style="color:${item.key === icon ? color : '#8a8778'}">${svg}</div>`;
        }
        iconsHtml += '</div>';
    }

    // Rename section
    const apColor = ap >= RENAME_AP_COST ? 'var(--dgreen)' : 'var(--dred)';
    let renameHtml;
    if (onCooldown) {
        const pct = (cooldownRemaining / RENAME_COOLDOWN * 100).toFixed(1);
        renameHtml = `
            <div class="pol-id-cooldown">
                <span class="pol-id-cooldown-label">Rename cooldown</span>
                <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:${pct}%"></div></div>
                <span class="pol-id-cooldown-ticks">${cooldownRemaining}t</span>
            </div>`;
    } else {
        renameHtml = `
            <button class="pol-id-rename-btn" id="pol-id-rename-btn">
                <span>Rename Party</span>
                <span class="pol-id-rename-cost">${RENAME_AP_COST} AP · ${RENAME_COOLDOWN}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-rename-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-rename-input" placeholder="Enter new party name…" maxlength="60">
                    <button class="pol-id-rename-confirm" id="pol-id-rename-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-rename-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Costs <span style="color:var(--damber)">${RENAME_AP_COST} AP</span> · locks rename for <span style="color:var(--damber)">${RENAME_COOLDOWN} ticks</span></span>
                    <span id="pol-id-ap-available" style="color:${apColor}">${ap} AP available</span>
                </div>
                <div class="pol-id-error" id="pol-id-rename-error" style="display:none"></div>
            </div>`;
    }

    return `<div class="pol-identity-box" id="pol-identity-box"
        data-faction-id="${f.id}"
        data-selected-color="${color}"
        data-selected-icon="${icon}"
        data-current-tick="${currentTick}">

        <!-- Header -->
        <div class="pol-id-header">
            <div>
                <div class="pol-id-title">Edit Party Identity</div>
                <div class="pol-id-subtitle">Cosmetic changes are free and instant</div>
            </div>
            <div class="pol-id-preview" id="pol-id-preview" style="border:2px solid ${color};background:${color}18">
                ${previewSvg}
            </div>
        </div>
        <div class="pol-id-divider"></div>

        <!-- Party Name -->
        <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span class="pol-id-section-label">Party Name</span>
                <span class="pol-id-ap-badge">AP: <span id="pol-id-ap-display" style="color:${apColor}">${ap}</span></span>
            </div>
            <div class="pol-id-name-display">
                <span id="pol-id-current-name">${escapeHtml(f.faction_name)}</span>
                <span>current</span>
            </div>
            ${renameHtml}
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
    const nameDisplay  = document.getElementById('pol-id-current-name');
    const apDisplay    = document.getElementById('pol-id-ap-display');
    const apAvailable  = document.getElementById('pol-id-ap-available');
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
            t.style.color = isSelected ? c : '#8a8778';
            t.innerHTML = getPartyIconSVG(key, 16, isSelected ? c : '#8a8778');
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
            // Deduct AP via RPC
            const result = await deductAP(_supabase, f.id, RENAME_AP_COST);
            if (!result.success) {
                renameError.textContent = '⚠ ' + (result.error || 'Insufficient AP');
                renameError.style.display = '';
                return;
            }
            // Update faction_name + last_rename_tick in DB
            const tick = parseInt(box.dataset.currentTick) || 0;
            await _supabase.from('factions').update({
                faction_name: trimmed,
                last_rename_tick: tick
            }).eq('id', f.id);

            // Update UI
            nameDisplay.textContent = trimmed;
            apDisplay.textContent = result.newAp;
            apDisplay.style.color = result.newAp >= RENAME_AP_COST ? 'var(--dgreen)' : 'var(--dred)';
            if (apAvailable) {
                apAvailable.textContent = result.newAp + ' AP available';
                apAvailable.style.color = result.newAp >= RENAME_AP_COST ? 'var(--dgreen)' : 'var(--dred)';
            }
            renameForm.style.display = 'none';
            renameInput.value = '';
            // Replace rename button with cooldown bar
            renameBtn.outerHTML = `
                <div class="pol-id-cooldown">
                    <span class="pol-id-cooldown-label">Rename cooldown</span>
                    <div class="pol-id-cooldown-track"><div class="pol-id-cooldown-fill" style="width:100%"></div></div>
                    <span class="pol-id-cooldown-ticks">${RENAME_COOLDOWN}t</span>
                </div>`;
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
            await _supabase.from('factions').update(updateData).eq('id', f.id);
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

function renderElectionResultsBox(lastParliamentary, lastPresidential, allParties) {
    // Build a color map from allParties
    const colorMap = {};
    (allParties || []).forEach(p => { colorMap[p.id] = p.party_color || '#888'; });

    function renderParliamentaryContent(el) {
        if (!el) return '<div class="pol-el-empty">No parliamentary election results yet.</div>';
        const r = el.results;
        if (!r || !r.votes) return '<div class="pol-el-empty">No parliamentary election results yet.</div>';
        const date = tickToDate(el.election_tick);
        const votes = [...r.votes].sort((a, b) => (b.seats || 0) - (a.seats || 0));
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
        return renderPresidentialCandidates(cands, date, r.turnout_pct, r.total_votes_cast);
    }

    function renderRunoffContent(el) {
        if (!el) return '<div class="pol-el-empty">No runoff results.</div>';
        const r = el.results;
        const cands = r?.runoff_candidates;
        if (!cands) return '<div class="pol-el-empty">No runoff results.</div>';
        const date = tickToDate(el.election_tick);
        return renderPresidentialCandidates(cands, date, r.turnout_pct, r.total_votes_cast);
    }

    // Determine if presidential election had a runoff
    const wasRunoff = lastPresidential?.results?.was_runoff === true;

    // Build presidential tabs
    let presTabs, presContents;
    if (wasRunoff) {
        presTabs = `
            <button class="pol-el-tab" data-tab="pres-r1">Presidential [1st Round]</button>
            <button class="pol-el-tab" data-tab="pres-runoff">Presidential [Runoff]</button>`;
        presContents = `
            <div class="pol-el-content" data-content="pres-r1">${renderRound1Content(lastPresidential)}</div>
            <div class="pol-el-content" data-content="pres-runoff">${renderRunoffContent(lastPresidential)}</div>`;
    } else {
        presTabs = `<button class="pol-el-tab" data-tab="pres">Presidential</button>`;
        presContents = `<div class="pol-el-content" data-content="pres">${renderPresidentialContent(lastPresidential)}</div>`;
    }

    return `<div class="pol-election-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div class="pol-section-label" style="margin-bottom:0">ELECTION RESULTS</div>
            <button class="pol-endorse-btn" disabled>Endorse Candidate</button>
        </div>
        <div class="pol-el-tabs">
            <button class="pol-el-tab active" data-tab="parl">Parliamentary</button>
            ${presTabs}
        </div>
        <div class="pol-el-content active" data-content="parl">${renderParliamentaryContent(lastParliamentary)}</div>
        ${presContents}
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

function renderUpcomingElectionsBox(scheduledElections, currentTick) {
    const elections = scheduledElections || [];
    let bodyHtml;
    if (elections.length === 0) {
        bodyHtml = '<div class="pol-el-empty">No elections currently scheduled.</div>';
    } else {
        bodyHtml = elections.map(e => {
            const date = tickToDate(e.election_tick);
            const ticksAway = e.election_tick - currentTick;
            const typeClass = e.election_type === 'presidential' ? 'pres' : 'parl';
            const typeLabel = e.election_type === 'presidential' ? 'Presidential' : 'Parliamentary';
            return `<div class="pol-upcoming-row">
                <span class="pol-upcoming-type ${typeClass}">${typeLabel}</span>
                <div class="pol-upcoming-info">
                    <span class="pol-upcoming-date">${date}</span>
                    <span class="pol-upcoming-countdown">in ${ticksAway} tick${ticksAway !== 1 ? 's' : ''}</span>
                </div>
            </div>`;
        }).join('');
    }

    return `<div class="pol-upcoming-box">
        <div class="pol-section-label" style="margin-bottom:12px">UPCOMING ELECTIONS</div>
        ${bodyHtml}
    </div>`;
}

function renderBlocVotingBox(lastParliamentary, lastPresidential, allParties) {
    const colorMap = {};
    const nameMap = {};
    (allParties || []).forEach(p => {
        colorMap[p.id] = p.party_color || '#888';
        nameMap[p.id] = p.abbreviation || p.faction_name || '?';
    });

    // Pick the most recent election that has bloc_details
    const parlHasBlocs = lastParliamentary?.results?.bloc_details?.length > 0;
    const presHasBlocs = lastPresidential?.results?.bloc_details?.length > 0;
    let sourceElection = null;
    if (parlHasBlocs && presHasBlocs) {
        sourceElection = (lastPresidential.election_tick > lastParliamentary.election_tick) ? lastPresidential : lastParliamentary;
    } else if (presHasBlocs) {
        sourceElection = lastPresidential;
    } else if (parlHasBlocs) {
        sourceElection = lastParliamentary;
    }

    if (!sourceElection) {
        return `<div class="pol-blocs-box">
            <div class="pol-section-label" style="margin-bottom:12px">HOW BLOCS VOTED</div>
            <div class="pol-el-empty">No bloc voting data available.</div>
        </div>`;
    }

    const blocs = sourceElection.results.bloc_details;
    const date = tickToDate(sourceElection.election_tick);

    let rows = blocs.map(bloc => {
        // Tags
        const tags = (bloc.tags || []).map(t => `<span class="pol-bloc-tag">${escapeHtml(t)}</span>`).join('');

        // Sort party_votes by votes descending
        const pv = [...(bloc.party_votes || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));
        const totalBlocVotes = pv.reduce((s, v) => s + (v.votes || 0), 0) || 1;

        // Find top party
        const topParty = pv.length > 0 ? pv[0] : null;
        const topPartyName = topParty ? (nameMap[topParty.party_id] || escapeHtml(topParty.party_name)) : '—';
        const topPartyColor = topParty ? (colorMap[topParty.party_id] || '#888') : '#888';

        // Vote split — show top 3 parties as mini bars
        const top3 = pv.slice(0, 3);
        const voteBars = top3.map(v => {
            const pct = ((v.votes || 0) / totalBlocVotes * 100).toFixed(1);
            const color = colorMap[v.party_id] || '#888';
            const name = nameMap[v.party_id] || escapeHtml(v.party_name);
            return `<div class="pol-bloc-vote-row">
                <div class="pol-bloc-vote-bar" style="width:${Math.max(pct * 0.8, 2)}px;background:${color}"></div>
                <span class="pol-bloc-vote-name">${name}</span>
                <span class="pol-bloc-vote-pct">${pct}%</span>
            </div>`;
        }).join('');

        return `<tr>
            <td>${escapeHtml(bloc.bloc_name)}</td>
            <td><div class="pol-bloc-tags">${tags || '—'}</div></td>
            <td>${(bloc.voter_count || 0).toLocaleString()}</td>
            <td><span class="pol-bloc-top-party"><span class="pol-el-color-dot" style="background:${topPartyColor}"></span>${topPartyName}</span></td>
            <td><div class="pol-bloc-votes">${voteBars}</div></td>
            <td>${(bloc.abstentions || 0).toLocaleString()}</td>
        </tr>`;
    }).join('');

    const totalAbstentions = blocs.reduce((s, b) => s + (b.abstentions || 0), 0);

    return `<div class="pol-blocs-box">
        <div class="pol-section-label" style="margin-bottom:12px">HOW BLOCS VOTED</div>
        <div class="pol-el-date">${date}</div>
        <table class="pol-blocs-table">
            <thead><tr><th>Bloc</th><th>Tags</th><th>Voters</th><th>Top Party</th><th>Vote Split</th><th>Abstain</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="pol-el-summary" style="margin-top:8px">Total abstentions: ${totalAbstentions.toLocaleString()}</div>
    </div>`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════════
// EVENTS TAB RENDERER
// ═══════════════════════════════════════════════════════════════════
const EVENT_ACTION_LABELS = {
    rally: 'RALLY', outreach: 'OUTREACH', attack: 'ATTACK', make_promise: 'PROMISE MADE',
    press_conference: 'PRESS CONFERENCE', steward_claim: 'STEWARD CLAIMED',
    become_steward: 'STEWARD CLAIMED',
    demand_loyalty: 'DEMAND LOYALTY', loyalty_demand_complied: 'COMPLIED',
    loyalty_demand_refused: 'REFUSED', loyalty_demand_expired: 'DEMAND EXPIRED',
    steward_show_of_force: 'SHOW OF FORCE', steward_mobilize: 'MOBILIZE',
    steward_surveillance: 'SURVEILLANCE', steward_embezzle: 'EMBEZZLED',
    steward_conspire: 'CONSPIRED', steward_detected_mobilize: 'MOBILIZE — DETECTED',
    coup_success: 'COUP — SUCCESS', coup_failed: 'COUP — FAILED',
    coup_invitation: 'COUP INVITATION', coup_plot_reported: 'PLOT REPORTED',
    coalition_proposed: 'COALITION PROPOSED', propose_coalition: 'COALITION PROPOSED',
    coalition_accepted: 'COALITION FORMED', accept_coalition: 'COALITION FORMED',
    coalition_betrayed: 'BETRAYAL', betray_coalition: 'BETRAYAL',
    coalition_detected: 'COALITION DETECTED', dissolve_coalition: 'COALITION DISSOLVED',
    coalition_dissolved: 'COALITION DISSOLVED',
    appoint_successor: 'SUCCESSOR APPOINTED', revoke_successor: 'SUCCESSOR REVOKED',
    faction_pledge_allegiance: 'PLEDGED ALLEGIANCE', faction_consolidate_power: 'CONSOLIDATED',
    faction_demonstrate_competence: 'DEMONSTRATED', faction_embezzle: 'FACTION EMBEZZLE',
    faction_embezzle_detected: 'EMBEZZLE — DETECTED',
    faction_buy_influence: 'BOUGHT INFLUENCE', buy_influence: 'BOUGHT INFLUENCE',
    faction_intimidate: 'INTIMIDATED', intimidate: 'INTIMIDATED',
    intimidate_failed: 'INTIMIDATION FAILED',
    intimidation_pending: 'INTIMIDATION RECEIVED', intimidation_reported: 'REPORTED INTIMIDATION',
    intimidation_retaliated: 'RETALIATED',
    purge: 'PURGE', redistribute_seats: 'REDISTRIBUTED', party_disbanded: 'PARTY DISBANDED',
    official_dispatch: 'OFFICIAL DISPATCH', strongman_death: 'STRONGMAN DIED',
    regime_succession: 'SUCCESSION', power_vacuum: 'POWER VACUUM',
    dynasty_shadow: 'DYNASTY — SHADOW', dynasty_cultivate: 'DYNASTY — CULTIVATE',
    dynasty_prepare: 'DYNASTY — PREPARE', dynasty_detected_prepare: 'DYNASTY — DETECTED',
    regime_health_threshold: 'REGIME ALERT', pillar_threshold: 'PILLAR ALERT',
    loyalty_milestone: 'LOYALTY SHIFT', standing_milestone: 'STANDING SHIFT',
    take_a_stand: 'TOOK A STAND', champion_community: 'CHAMPIONED',
    build_a_bridge: 'BUILT A BRIDGE', double_down: 'DOUBLED DOWN',
    dig_up_dirt: 'DUG UP DIRT', campaign_mobilize: 'MOBILIZED VOTERS',
    campaign_message: 'MESSAGING CAMPAIGN', campaign_contrast: 'ATTACK AD',
};

async function renderEventsTab(nationId, factionId, currentTick) {
    const container = document.getElementById('events-container');
    if (!container) return;

    // Try with factions join first; fall back to plain query if join fails (no FK)
    let actions = null;
    const { data: joined, error: joinErr } = await _supabase
        .from('campaign_actions')
        .select('action_type, party_id, tick_performed, result, factions(faction_name, abbreviation, party_color)')
        .eq('nation_id', nationId)
        .order('tick_performed', { ascending: false })
        .limit(50);

    if (joinErr || !joined) {
        // FK join failed — fall back to plain query without join
        const { data: plain } = await _supabase
            .from('campaign_actions')
            .select('action_type, party_id, tick_performed, result')
            .eq('nation_id', nationId)
            .order('tick_performed', { ascending: false })
            .limit(50);
        actions = plain;
    } else {
        actions = joined;
    }

    if (!actions || actions.length === 0) {
        container.innerHTML = '<div style="color:var(--dtext-3);padding:16px;font-size:12px;">No political events yet.</div>';
        return;
    }

    const rows = actions.map(entry => {
        const dateStr = tickToDate(entry.tick_performed);
        const fName = entry.factions?.abbreviation || entry.factions?.faction_name || '???';
        const fColor = entry.factions?.party_color || '#888';
        const label = EVENT_ACTION_LABELS[entry.action_type] || entry.action_type.replace(/_/g, ' ').toUpperCase();
        const r = entry.result || {};

        let detail = '';
        if (entry.action_type === 'rally') detail = r.headline || r.outcomeName || '';
        else if (entry.action_type === 'outreach') detail = r.blocName ? `Outreach to ${r.blocName}` : '';
        else if (entry.action_type === 'attack') detail = r.headline || (r.targetName ? `Attacked ${r.targetName}` : '');
        else if (entry.action_type === 'make_promise') detail = r.headline || r.demandText || '';
        else if (entry.action_type === 'demand_loyalty') detail = r.target_faction ? `Demanded loyalty from ${r.target_faction}` : '';
        else if (entry.action_type === 'loyalty_demand_complied') detail = r.faction_name ? `${r.faction_name} complied` : '';
        else if (entry.action_type === 'loyalty_demand_refused') detail = r.faction_name ? `${r.faction_name} refused` : '';
        else if (entry.action_type === 'coup_success') detail = r.faction_name ? `${r.faction_name} seized power!` : '';
        else if (entry.action_type === 'coup_failed') detail = r.faction_name ? `${r.faction_name} failed coup` : '';
        else if (entry.action_type === 'faction_pledge_allegiance') detail = r.faction_name || '';
        else if (entry.action_type === 'faction_consolidate_power') detail = r.faction_name || '';
        else if (entry.action_type === 'faction_demonstrate_competence') detail = r.faction_name || '';
        else if (entry.action_type === 'faction_embezzle') detail = r.detected ? 'DETECTED' : '';
        else if (entry.action_type === 'faction_buy_influence') detail = r.targetName ? `from ${r.targetName}` : '';
        else if (entry.action_type === 'faction_intimidate') detail = r.targetName ? `${r.targetName}` : '';
        else if (entry.action_type === 'appoint_successor') detail = r.successor_name || '';
        else if (entry.action_type === 'purge') detail = r.target_name || '';
        else if (entry.action_type === 'party_disbanded') detail = r.faction_name || '';
        else if (entry.action_type === 'steward_claim') detail = r.pillar_name ? `Claimed ${r.pillar_name}` : '';
        else if (entry.action_type === 'steward_mobilize') detail = r.mode === 'rally_regime' ? 'Rallied for regime' : (r.detected ? 'Rallied for self — DETECTED' : '');
        else if (entry.action_type === 'steward_detected_mobilize') detail = r.steward_name ? `${r.steward_name} detected` : '';
        else if (entry.action_type === 'become_steward') detail = r.name ? `${r.name} claimed ${r.pillar || ''}` : '';
        else if (entry.action_type === 'faction_embezzle_detected') detail = r.funds_seized ? `Seized $${r.funds_seized}M` : 'DETECTED';
        else if (entry.action_type === 'buy_influence') detail = r.target ? `${r.seats_gained} seats from ${r.target}` : (r.faction_name || '');
        else if (entry.action_type === 'intimidate') detail = r.targetName || '';
        else if (entry.action_type === 'intimidate_failed') detail = r.targetName ? `Failed against ${r.targetName}` : '';
        else if (entry.action_type === 'intimidation_pending') detail = r.aggressor_name || '';
        else if (entry.action_type === 'intimidation_reported') detail = r.aggressor_name ? `Reported ${r.aggressor_name}` : '';
        else if (entry.action_type === 'intimidation_retaliated') detail = r.aggressor_name ? `Retaliated against ${r.aggressor_name}` : '';
        else if (entry.action_type === 'dynasty_shadow') detail = r.successor_name || '';
        else if (entry.action_type === 'dynasty_cultivate') detail = r.successor_name || '';
        else if (entry.action_type === 'dynasty_prepare') detail = r.successor_name || '';
        else if (entry.action_type === 'dynasty_detected_prepare') detail = r.faction_name ? `${r.faction_name} grooming successor` : '';
        else if (entry.action_type === 'coup_invitation') detail = r.target_name || '';
        else if (entry.action_type === 'coup_plot_reported') detail = r.reporter_name || '';
        else if (entry.action_type === 'regime_health_threshold') detail = r.message || '';
        else if (entry.action_type === 'pillar_threshold') detail = r.message || '';
        else if (entry.action_type === 'loyalty_milestone') detail = r.message || '';
        else if (entry.action_type === 'standing_milestone') detail = r.message || '';
        else if (entry.action_type === 'regime_succession') detail = r.new_leader || '';
        else if (entry.action_type === 'power_vacuum') detail = r.message || 'Regime collapsed';
        else if (entry.action_type === 'strongman_death') detail = r.deceased_name ? `${r.deceased_name} died — ${r.successor_name || 'no successor'}` : '';
        else if (entry.action_type === 'coalition_accepted' || entry.action_type === 'accept_coalition') detail = r.partner_faction || r.partner || '';
        else if (entry.action_type === 'take_a_stand') detail = r.headline || (r.direction ? `Declared for ${r.direction}` : '');
        else if (entry.action_type === 'champion_community') detail = r.headline || (r.bloc_name ? `Championed ${r.bloc_name}` : '');
        else if (entry.action_type === 'build_a_bridge') detail = r.headline || (r.bloc_name ? `Bridge to ${r.bloc_name}` : '');
        else if (entry.action_type === 'double_down') detail = r.headline || (r.side ? `${r.side} (${r.stacks}/3)` : '');
        else if (entry.action_type === 'dig_up_dirt') detail = r.headline || (r.mode === 'bloc' ? `Studied ${r.bloc_name}` : `Investigated ${r.rival_name}`);
        else if (entry.action_type === 'campaign_mobilize') detail = r.headline || (r.bloc_name ? `Mobilized ${r.bloc_name}` : '');
        else if (entry.action_type === 'campaign_message') detail = r.headline || 'Messaging campaign';
        else if (entry.action_type === 'campaign_contrast') detail = r.headline || (r.rival_name ? `Attacked ${r.rival_name}` : '');
        else detail = r.headline || '';

        return `<div class="pol-event-row">
            <span class="pol-event-date">${escapeHtml(dateStr)}</span>
            <span class="pol-event-faction" style="color:${fColor}">${escapeHtml(fName)}</span>
            <span class="pol-event-label">${escapeHtml(label)}</span>
            ${detail ? `<span class="pol-event-detail">${escapeHtml(detail)}</span>` : ''}
        </div>`;
    }).join('');

    container.innerHTML = `<div class="pol-events-list">${rows}</div>`;
}

// ═══════════════════════════════════════════════════════════════════
// DEMOCRACY CAMPAIGN ACTIONS TAB (Rally, Outreach, Attack, Promise)
// ═══════════════════════════════════════════════════════════════════

// Campaign action state
let _caSelected = null;   // 'rally' | 'outreach' | 'attack' | 'promise'
let _caBloc = null;       // selected bloc id
let _caRival = null;      // selected rival faction id
let _caVector = null;     // attack vector id
let _caPromiseType = null; // 'stat' | 'crisis'
let _caStatKey = null;     // selected stat key for promise
let _caCrisisId = null;   // selected crisis id for promise
let _caResult = null;     // last action result for display
let _caAttackEvidence = null; // cached attack evidence
let _caAttackVectors = null;  // cached built vectors

// Store references for re-rendering
let _currentNation = null, _currentFaction = null, _currentShard = null, _currentAllParties = null;
let _caIsGoverning = false;

const CA_ACTIONS = [
    { id: 'rally', name: 'Hold a Rally', ap: RALLY_CONFIG.AP_COST, color: '#f97316', icon: '★',
      desc: 'Random outcome — can boost or backfire. Generates headlines visible to rivals.' },
    { id: 'outreach', name: 'Voter Outreach', ap: OUTREACH_CONFIG.AP_COST, color: '#4ade80', icon: '●',
      desc: 'Guaranteed result based on ideology alignment. Diminishing returns with repeated use.' },
    { id: 'attack', name: 'Campaign Attack', ap: ATTACK_CONFIG.AP_COST, color: '#ef4444', icon: '✦',
      desc: 'Attack a rival\'s record. Stronger with evidence. Can backfire.' },
    { id: 'promise', name: 'Make a Promise', ap: MAKE_PROMISE_CONFIG.AP_COST, color: '#a78bfa', icon: '◆',
      desc: 'Commit to improving a stat or resolving a crisis. Immediate approval boost, but penalties if broken.' },
];

function caReset() {
    _caBloc = null; _caRival = null; _caVector = null;
    _caPromiseType = null; _caStatKey = null; _caCrisisId = null;
    _caAttackEvidence = null; _caAttackVectors = null;
}

function caIsReady() {
    if (_caSelected === 'rally') return !!_caBloc;
    if (_caSelected === 'outreach') return !!_caBloc;
    if (_caSelected === 'attack') return !!_caRival && !!_caVector;
    if (_caSelected === 'promise') {
        if (_caPromiseType === 'stat') return !!_caStatKey;
        if (_caPromiseType === 'crisis') return !!_caCrisisId;
        return false;
    }
    return false;
}

function caGetCost() {
    const act = CA_ACTIONS.find(a => a.id === _caSelected);
    return act ? act.ap : 0;
}

async function renderDemocracyActions(nation, faction, shard, allParties) {
    _currentNation = nation;
    _currentFaction = faction;
    _currentShard = shard;
    _currentAllParties = allParties;
    const container = document.getElementById('actions-container');
    if (!container) return;

    const tick = shard?.current_tick || 0;
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

    // Fetch voter blocs
    const { data: voterBlocs } = await _supabase
        .from('voter_blocs').select('*').eq('nation_id', n.id).eq('is_active', true);

    // Fetch bloc approvals
    const { data: blocApprovals } = await _supabase
        .from('faction_bloc_approval')
        .select('bloc_id, preference_score, momentum, ideology_alignment')
        .eq('faction_id', f.id);
    const approvalByBloc = {};
    for (const ba of (blocApprovals || [])) approvalByBloc[ba.bloc_id] = ba;

    // Fetch faction ideology
    const { data: factionIdeo } = await _supabase
        .from('faction_ideology')
        .select('*').eq('faction_id', f.id).single();

    // Fetch other parties
    const otherParties = (allParties || []).filter(p => p.id !== f.id);

    // Build blocs with approval info
    const blocs = (voterBlocs || []).map(b => {
        const ba = approvalByBloc[b.id];
        const pref = ba?.preference_score ?? 40;
        return { ...b, approval: Math.round(pref), momentum: ba?.momentum ?? 0 };
    });

    renderCampaignUI(container, f, n, ap, blocs, otherParties, factionIdeo, approvalByBloc, tick);
}

function renderCampaignUI(container, f, n, ap, blocs, otherParties, factionIdeo, approvalByBloc, tick) {
    const sel = CA_ACTIONS.find(a => a.id === _caSelected);

    // Action list (left)
    let listHtml = '';
    for (const act of CA_ACTIONS) {
        const isSel = _caSelected === act.id;
        const ok = ap >= act.ap;
        const borderColor = isSel ? act.color : ok ? act.color + '55' : 'var(--dtext-3)';
        const bgStyle = isSel ? `background:${act.color}08;` : '';
        const borderStyle = isSel ? `border-color:${act.color}33;` : '';
        const nameColor = isSel ? act.color : 'var(--dtext-0)';
        listHtml += `<div class="ca-item${isSel ? ' selected' : ''}${!ok ? ' disabled' : ''}" data-action-id="${act.id}" style="border-left-color:${borderColor};${bgStyle}${borderStyle}${!ok ? 'opacity:0.35;' : ''}">
            <div class="ca-item-head">
                <div style="display:flex;align-items:center;gap:6px">
                    <span class="ca-item-icon" style="color:${act.color}">${act.icon}</span>
                    <span class="ca-item-name" style="color:${nameColor}">${escapeHtml(act.name)}</span>
                </div>
                <span class="ca-item-ap">${act.ap} AP</span>
            </div>
            ${isSel ? `<div class="ca-item-desc">${escapeHtml(act.desc)}</div>` : ''}
        </div>`;
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
        } else {
            panelHtml += renderActionConfig(sel, blocs, otherParties, factionIdeo, n, ap, tick);
            // Confirm button
            const cost = caGetCost();
            const ready = caIsReady();
            const canConfirm = ap >= cost && ready;
            panelHtml += `<div class="ca-confirm-row"><div class="ca-confirm-btn${canConfirm ? '' : ' disabled'}" style="background:${canConfirm ? sel.color : 'var(--dtext-3)'}" id="ca-confirm-btn">Confirm — ${cost} AP</div></div>`;
        }
        panelHtml += `</div>`;
    }

    container.innerHTML = `<div class="ca-wrap"><div class="ca-list">${listHtml}</div>${panelHtml}</div>`;

    // Wire up action selection
    container.querySelectorAll('.ca-item').forEach(el => {
        el.addEventListener('click', () => {
            const id = el.dataset.actionId;
            const act = CA_ACTIONS.find(a => a.id === id);
            if (act && ap < act.ap) return;
            if (_caSelected === id) { _caSelected = null; } else { _caSelected = id; }
            caReset();
            _caResult = null;
            renderCampaignUI(container, f, n, ap, blocs, otherParties, factionIdeo, approvalByBloc, tick);
        });
    });

    // Wire up config interactions
    wireCampaignConfig(container, f, n, ap, blocs, otherParties, factionIdeo, approvalByBloc, tick);
}

// ── Render config body for each action ──

function renderActionConfig(sel, blocs, otherParties, factionIdeo, nation, ap, tick) {
    if (sel.id === 'rally') return renderRallyConfig(blocs, factionIdeo, nation);
    if (sel.id === 'outreach') return renderOutreachConfig(blocs, factionIdeo);
    if (sel.id === 'attack') return renderAttackConfig(otherParties);
    if (sel.id === 'promise') return renderPromiseConfig(nation);
    return '';
}

// ── RALLY CONFIG ──

function renderRallyConfig(blocs, factionIdeo, nation) {
    const nationState = {
        crisisCount: 0,
        polarization: nation.polarization ?? 0,
        civilUnrest: nation.civil_unrest ?? 0,
    };

    let html = `<div class="ca-subtitle">Select target bloc</div>`;
    html += `<div class="ca-info-box">Random outcome based on bloc approval. Higher approval = better odds.</div>`;
    html += `<div class="ca-bloc-list">`;
    for (const b of blocs) {
        const isSel = _caBloc === b.id;
        const approvalColor = b.approval >= 55 ? '#4ade80' : b.approval >= 35 ? '#facc15' : '#ef4444';
        html += `<div class="ca-bloc-card${isSel ? ' selected' : ''}" data-bloc-id="${b.id}" style="border-left-color:${isSel ? '#f97316' : approvalColor};${isSel ? 'border-color:rgba(249,115,22,0.2);background:rgba(249,115,22,0.03)' : ''}">
            <div class="ca-bloc-head">
                <span class="ca-bloc-name">${escapeHtml(b.bloc_name)}</span>
                <div style="display:flex;align-items:center;gap:10px">
                    <span class="ca-bloc-meta">${Math.round(b.population_weight || 0)}% pop</span>
                    <span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:${approvalColor}">${b.approval}</span>
                </div>
            </div>`;

        // Show outcome odds when selected
        if (isSel) {
            const weights = getRallyOutcomeWeights(b.approval, 0, nationState);
            const risk = getRallyRiskLevel(weights);
            const riskColors = { dangerous: '#ef4444', risky: '#f97316', moderate: '#facc15', safe: '#4ade80' };
            const maxPct = Math.max(...Object.values(weights));

            html += `<div class="ca-bloc-detail">`;
            html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span style="font-family:var(--dfont-mono);font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--dtext-3)">Outcome Odds</span>
                <span class="ca-pill" style="color:${riskColors[risk] || '#facc15'};background:${riskColors[risk] || '#facc15'}15;border:1px solid ${riskColors[risk] || '#facc15'}33">${risk.toUpperCase()}</span>
            </div>`;
            for (const o of RALLY_OUTCOMES) {
                const pct = weights[o.id] || 0;
                const barW = maxPct > 0 ? (pct / maxPct) * 100 : 0;
                const oColor = o.id === 'rousing' ? '#4ade80' : o.id === 'solid' ? '#2dd4bf' : o.id === 'low' ? '#facc15' : o.id === 'gaffe' ? '#f97316' : o.id === 'divisive' ? '#a78bfa' : '#ef4444';
                html += `<div class="ca-outcome-bar">
                    <span class="ca-outcome-name">${escapeHtml(o.name)}</span>
                    <div class="ca-outcome-track"><div class="ca-outcome-fill" style="width:${barW}%;background:${oColor}"></div></div>
                    <span class="ca-outcome-pct" style="color:${oColor}">${pct}%</span>
                </div>`;
            }
            html += `</div>`;
        }
        html += `</div>`;
    }
    html += `</div>`;
    return html;
}

// ── OUTREACH CONFIG ──

function renderOutreachConfig(blocs, factionIdeo) {
    let html = `<div class="ca-subtitle">Select target bloc</div>`;
    html += `<div class="ca-info-box">Guaranteed result. Effect based on ideology alignment. No randomness, no headlines.</div>`;
    html += `<div class="ca-bloc-list">`;
    for (const b of blocs) {
        const isSel = _caBloc === b.id;
        const alignment = factionIdeo ? computeOutreachAlignment(factionIdeo, b) : 50;
        const effect = calcOutreachEffect(alignment, 0);
        const alignColor = alignment >= 70 ? '#4ade80' : alignment >= 50 ? '#22d3ee' : alignment >= 35 ? '#facc15' : '#ef4444';
        html += `<div class="ca-bloc-card${isSel ? ' selected' : ''}" data-bloc-id="${b.id}" style="border-left-color:${isSel ? '#4ade80' : alignColor};${isSel ? 'border-color:rgba(74,222,128,0.2);background:rgba(74,222,128,0.03)' : ''}">
            <div class="ca-bloc-head">
                <span class="ca-bloc-name">${escapeHtml(b.bloc_name)}</span>
                <div style="display:flex;align-items:center;gap:10px">
                    <span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3)">align</span>
                    <span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:${alignColor}">${alignment}</span>
                    <span style="font-family:var(--dfont-mono);font-size:10px;color:#4ade80;font-weight:700">+${effect.base}</span>
                </div>
            </div>`;

        if (isSel) {
            const frictions = calcOutreachFriction(b, blocs, factionIdeo);
            html += `<div class="ca-bloc-detail">`;
            html += `<div style="margin-bottom:4px"><span style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3)">Expected effect: </span><span style="font-family:var(--dfont-mono);font-size:11px;font-weight:700;color:#4ade80">+${effect.base} approval</span></div>`;
            if (frictions.length > 0) {
                html += `<div style="font-family:var(--dfont-mono);font-size:9px;color:var(--dtext-3);margin:6px 0 4px">Friction — opposed blocs lose approval:</div>`;
                for (const fr of frictions) {
                    html += `<div class="ca-friction-row">
                        <span class="ca-friction-name">${escapeHtml(fr.blocName)}</span>
                        <span class="ca-friction-val">${fr.penalty}</span>
                    </div>`;
                }
            } else {
                html += `<div style="font-family:var(--dfont-mono);font-size:10px;color:#4ade80;margin-top:4px">No friction — no opposed blocs affected</div>`;
            }
            html += `</div>`;
        }
        html += `</div>`;
    }
    html += `</div>`;
    return html;
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
        const stats = getPromiseableStats(nation, _caIsGoverning);
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
                    ${isSel ? `<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:4px">Deadline: ${MAKE_PROMISE_CONFIG.DEADLINE_BASE + 1}–${MAKE_PROMISE_CONFIG.DEADLINE_BASE + MAKE_PROMISE_CONFIG.DEADLINE_DICE} ticks · Immediate <span style="color:#4ade80">+${MAKE_PROMISE_CONFIG.APPROVAL_ON_PROMISE_STAT}</span> momentum with affected blocs</div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:3px;display:flex;gap:12px;flex-wrap:wrap">
                        <span style="color:#4ade80">If kept: +${MAKE_PROMISE_CONFIG.APPROVAL_IF_KEPT} all blocs, +${MAKE_PROMISE_CONFIG.KEPT_PREF_BONUS} affected bloc, +${MAKE_PROMISE_CONFIG.KEPT_MOMENTUM} momentum</span>
                    </div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;display:flex;gap:12px;flex-wrap:wrap">
                        <span style="color:#ef4444">If broken: ${MAKE_PROMISE_CONFIG.BROKEN_MOMENTUM} momentum, ${MAKE_PROMISE_CONFIG.BROKEN_DONOR_PREF} affected bloc, ${MAKE_PROMISE_CONFIG.BROKEN_ALL_PREF} all blocs</span>
                    </div>
                    <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;color:var(--dtext-3)">While unfulfilled & governing: <span style="color:#f97316">−${MAKE_PROMISE_CONFIG.PENALTY_PER_TICK_MIN} to −${MAKE_PROMISE_CONFIG.PENALTY_PER_TICK_MAX} momentum/tick</span> with promised bloc</div>` : ''}
                </div>`;
            }
            html += `</div>`;
        }
    }

    if (_caPromiseType === 'crisis') {
        html += `<div id="ca-crisis-list"><div class="ca-info-box">Loading crises...</div></div>`;
        html += `<div style="font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3);margin-top:8px;padding:0 2px">
            Deadline: ${MAKE_PROMISE_CONFIG.DEADLINE_BASE + 1}–${MAKE_PROMISE_CONFIG.DEADLINE_BASE + MAKE_PROMISE_CONFIG.DEADLINE_DICE} ticks · Immediate <span style="color:#4ade80">+${MAKE_PROMISE_CONFIG.APPROVAL_ON_PROMISE_CRISIS}</span> momentum with all blocs
        </div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:3px;padding:0 2px">
            <span style="color:#4ade80">If kept: +${MAKE_PROMISE_CONFIG.APPROVAL_IF_KEPT} all blocs, +${MAKE_PROMISE_CONFIG.KEPT_MOMENTUM} momentum</span>
        </div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;padding:0 2px">
            <span style="color:#ef4444">If broken: ${MAKE_PROMISE_CONFIG.BROKEN_MOMENTUM} momentum, ${MAKE_PROMISE_CONFIG.BROKEN_ALL_PREF} all blocs</span>
        </div>
        <div style="font-family:var(--dfont-mono);font-size:10px;margin-top:2px;padding:0 2px;color:var(--dtext-3)">While unfulfilled & governing: <span style="color:#f97316">−${MAKE_PROMISE_CONFIG.PENALTY_PER_TICK_MIN} to −${MAKE_PROMISE_CONFIG.PENALTY_PER_TICK_MAX} momentum/tick</span></div>`;
    }

    return html;
}

// ── Result display ──

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
            const label = e.bloc || e.label || '';
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
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#4ade80">Kept: +${MAKE_PROMISE_CONFIG.APPROVAL_IF_KEPT} all blocs, +${MAKE_PROMISE_CONFIG.KEPT_MOMENTUM} momentum</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#ef4444;margin-top:2px">Broken: ${MAKE_PROMISE_CONFIG.BROKEN_MOMENTUM} momentum, ${MAKE_PROMISE_CONFIG.BROKEN_ALL_PREF} all blocs</div>
            <div style="font-family:var(--dfont-mono);font-size:10px;color:#f97316;margin-top:2px">While unfulfilled: −${MAKE_PROMISE_CONFIG.PENALTY_PER_TICK_MIN} to −${MAKE_PROMISE_CONFIG.PENALTY_PER_TICK_MAX}/tick</div>
        </div>`;
    }

    html += `</div></div>`;
    return html;
}

// ── Wire up config panel interactions ──

function wireCampaignConfig(container, f, n, ap, blocs, otherParties, factionIdeo, approvalByBloc, tick) {
    const rerender = () => renderCampaignUI(container, f, n, ap, blocs, otherParties, factionIdeo, approvalByBloc, tick);

    // Bloc selection (rally, outreach)
    container.querySelectorAll('[data-bloc-id]').forEach(el => {
        el.addEventListener('click', () => {
            _caBloc = _caBloc === el.dataset.blocId ? null : el.dataset.blocId;
            rerender();
        });
    });

    // Rival selection (attack)
    container.querySelectorAll('[data-rival-id]').forEach(el => {
        el.addEventListener('click', async () => {
            const rivalId = el.dataset.rivalId;
            if (_caRival === rivalId) return;
            _caRival = rivalId;
            _caVector = null;
            _caAttackEvidence = null;
            _caAttackVectors = null;
            rerender();

            // Load evidence asynchronously
            const evidence = await gatherAttackEvidence(_supabase, rivalId, n.id, tick);
            _caAttackEvidence = evidence;
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

    // Dismiss result
    const dismissBtn = container.querySelector('#ca-dismiss-result');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            _caResult = null;
            rerender();
        });
    }

    // Confirm button
    const confirmBtn = container.querySelector('#ca-confirm-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (confirmBtn.classList.contains('disabled')) return;
            confirmBtn.classList.add('disabled');
            handleCampaignConfirm(container, f, n, ap, blocs, otherParties, factionIdeo, approvalByBloc, tick);
        });
    }
}

// ── Confirm handler ──

async function handleCampaignConfirm(container, f, n, ap, blocs, otherParties, factionIdeo, approvalByBloc, tick) {
    const sel = CA_ACTIONS.find(a => a.id === _caSelected);
    if (!sel) return;
    const cost = caGetCost();
    if (ap < cost || !caIsReady()) return;

    const btn = document.getElementById('ca-confirm-btn');
    if (btn) { btn.classList.add('disabled'); btn.textContent = 'EXECUTING...'; }

    let result;
    try {
        if (sel.id === 'rally') {
            result = await executeRally(_supabase, f.id, n.id, _caBloc, tick);
        } else if (sel.id === 'outreach') {
            result = await executeOutreach(_supabase, f.id, n.id, _caBloc, tick);
        } else if (sel.id === 'attack') {
            result = await executeAttack(_supabase, f.id, n.id, _caRival, _caVector, tick);
        } else if (sel.id === 'promise') {
            const params = _caPromiseType === 'stat' ? { statKey: _caStatKey } : { crisisId: _caCrisisId };
            result = await executeMakePromise(_supabase, f.id, n.id, tick, _caPromiseType, params);
        }
    } catch (err) {
        console.error('Campaign action error:', err);
        alert('Action failed: ' + err.message);
        if (btn) { btn.classList.remove('disabled'); btn.textContent = `Confirm — ${cost} AP`; }
        return;
    }

    if (!result || !result.success) {
        alert(result?.error || 'Action failed.');
        if (btn) { btn.classList.remove('disabled'); btn.textContent = `Confirm — ${cost} AP`; }
        return;
    }

    // Update local AP
    f.action_points = result.newAp ?? ((f.action_points ?? 0) - cost);

    // Show result
    _caResult = result;

    // Re-render
    await renderDemocracyActions(n, f, _currentShard, _currentAllParties);
    await renderEventsTab(n.id, f.id, tick);
    // Update topbar AP display
    const apEl = document.getElementById('topbar-ap');
    if (apEl) apEl.innerHTML = '<span class="topbar-ap__count">' + (f.action_points ?? 0) + ' AP</span>';
}

// ═══════════════════════════════════════════════════════════════════
// STRONGMAN ACTION PANELS
// ═══════════════════════════════════════════════════════════════════

function renderSuccessorPanel(n, f, ap, tick, allStewardRows, allFactions, nonRuling, stewardByFaction) {
    // Find current chosen successor
    const chosenSteward = (allStewardRows || []).find(s => s.is_chosen_successor);
    const isFamilySuccessor = n.successor_is_family_member === true;
    const hasSuccessor = !!chosenSteward || isFamilySuccessor;

    // Cooldown check
    const cooldownEnd = Number(n.successor_cooldown_end_tick || 0);
    const cooldownLeft = Math.max(0, cooldownEnd - tick);
    const onCooldown = cooldownLeft > 0;

    // Build content
    let content = '';

    if (hasSuccessor) {
        // Show current successor with revoke option
        if (chosenSteward) {
            const stFaction = allFactions?.find(p => p.id === chosenSteward.faction_id);
            const stType = STEWARD_TYPE_LABELS[chosenSteward.steward_type] || chosenSteward.steward_type;
            content = `
                <div style="background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.3);border-radius:6px;padding:12px;margin-top:8px">
                    <div style="color:var(--damber);font-weight:700;font-size:11px;margin-bottom:6px">CHOSEN SUCCESSOR</div>
                    <div style="font-weight:700;color:var(--dtext-1)">${escapeHtml(chosenSteward.first_name + ' ' + chosenSteward.last_name)}</div>
                    <div style="font-size:10px;color:var(--dtext-3);margin-top:2px">${escapeHtml(stType)} — ${escapeHtml(stFaction?.faction_name || '?')}</div>
                    <div style="display:flex;gap:12px;margin-top:8px;font-size:10px">
                        <span>Succession Str: <span style="color:var(--damber)">${Math.round(chosenSteward.succession_strength ?? 0)}</span></span>
                        <span>True Loyalty: <span style="color:var(--dtext-2)">${Math.round(chosenSteward.true_loyalty ?? 50)}</span></span>
                    </div>
                    <div style="font-size:9px;color:var(--dtext-3);margin-top:8px">
                        Revoking costs: Stability -${SUCCESSOR_CONFIG.REVOKE_STABILITY_DROP}, Faction Loyalty -${SUCCESSOR_CONFIG.REVOKE_LOYALTY_DROP}, All Coup Readiness +${SUCCESSOR_CONFIG.REVOKE_COUP_READINESS}
                    </div>
                    <button class="pol-action-execute" style="margin-top:8px;background:#880000" id="successor-revoke-btn">REVOKE SUCCESSION</button>
                </div>`;
        } else {
            // Family member successor
            content = `
                <div style="background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.3);border-radius:6px;padding:12px;margin-top:8px">
                    <div style="color:var(--damber);font-weight:700;font-size:11px;margin-bottom:6px">CHOSEN SUCCESSOR</div>
                    <div style="font-weight:700;color:var(--dtext-1)">Family Member</div>
                    <div style="font-size:10px;color:var(--dtext-3);margin-top:2px">Dynasty succession — costs ${SUCCESSOR_CONFIG.FAMILY_AP_PENALTY} AP/tick while active</div>
                    <div style="font-size:9px;color:#ff9800;margin-top:6px">All pillar support -${SUCCESSOR_CONFIG.FAMILY_PILLAR_PENALTY}, All coup readiness +${SUCCESSOR_CONFIG.FAMILY_COUP_READINESS}</div>
                    <button class="pol-action-execute" style="margin-top:8px;background:#880000" id="successor-revoke-btn">REVOKE SUCCESSION</button>
                </div>`;
        }
    } else if (onCooldown) {
        content = `<div style="color:var(--dtext-3);font-size:11px;margin-top:8px;padding:8px;background:rgba(255,255,255,0.03);border-radius:4px">
            Appointment on cooldown — ${cooldownLeft} tick${cooldownLeft !== 1 ? 's' : ''} remaining
        </div>`;
    } else {
        // Show appointment targets
        const eligibleStewards = (allStewardRows || []).filter(s =>
            s.faction_id !== f.id && !s.is_chosen_successor
        );

        let targetButtons = '';
        if (eligibleStewards.length > 0) {
            targetButtons = eligibleStewards.map(s => {
                const fac = allFactions?.find(p => p.id === s.faction_id);
                const stType = STEWARD_TYPE_LABELS[s.steward_type] || s.steward_type;
                return `<button class="pol-action-execute" style="margin:4px;border-left:3px solid ${fac?.party_color || '#888'};text-align:left;display:block;width:100%" data-successor-target="${s.faction_id}">
                    <div>${escapeHtml(s.first_name + ' ' + s.last_name)}</div>
                    <div style="font-size:9px;opacity:0.7">${escapeHtml(stType)} — ${escapeHtml(fac?.faction_name || '?')}</div>
                </button>`;
            }).join('');
        } else {
            targetButtons = '<div style="color:var(--dtext-3);font-size:10px;padding:4px 0">No eligible stewards to appoint.</div>';
        }

        content = `
            <div style="margin-top:8px">
                <div style="font-size:10px;color:var(--dtext-3);margin-bottom:6px">
                    Stability +${SUCCESSOR_CONFIG.STABILITY_BOOST}, Target pillar +${SUCCESSOR_CONFIG.PILLAR_BOOST}.
                    Others: Loyalty -${SUCCESSOR_CONFIG.OTHER_LOYALTY_DROP}, Coup Readiness +${SUCCESSOR_CONFIG.OTHER_COUP_READINESS}
                </div>
                <div style="font-size:10px;color:var(--dtext-2);font-weight:700;margin-bottom:4px">Select a steward:</div>
                ${targetButtons}
                <div style="margin-top:8px;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px">
                    <button class="pol-action-execute" style="width:100%;border-left:3px solid #FFD700" id="successor-family-btn" ${ap < SUCCESSOR_CONFIG.AP_COST ? 'disabled' : ''}>
                        <div>Appoint Family Member</div>
                        <div style="font-size:9px;opacity:0.7">Costs ${SUCCESSOR_CONFIG.FAMILY_AP_PENALTY} AP/tick. All pillars -${SUCCESSOR_CONFIG.FAMILY_PILLAR_PENALTY}, All coup readiness +${SUCCESSOR_CONFIG.FAMILY_COUP_READINESS}</div>
                    </button>
                </div>
            </div>`;
    }

    return `<div class="pol-action-panel">
        <div class="pol-action-header">
            <span class="pol-action-title">APPOINT SUCCESSOR</span>
            <span class="pol-action-cost">${SUCCESSOR_CONFIG.AP_COST} AP</span>
        </div>
        <div class="pol-action-tagline">${hasSuccessor ? 'Successor designated.' : 'Designate a steward as your chosen successor.'}</div>
        ${content}
    </div>`;
}

function renderPurgePanel(n, f, ap, tick, nonRuling, stewardByFaction) {
    const purgeTargets = nonRuling.filter(p => {
        const loy = Math.round(p.loyalty ?? 50);
        return loy < (GAME_CONFIG.PURGE_LOYALTY_THRESHOLD || 20) && stewardByFaction[p.id];
    });

    let content = '';
    if (purgeTargets.length === 0) {
        content = `<div style="color:var(--dtext-3);font-size:11px;margin-top:8px;padding:8px;background:rgba(255,255,255,0.03);border-radius:4px">
            No factions eligible for purge. Targets must have loyalty below ${GAME_CONFIG.PURGE_LOYALTY_THRESHOLD || 20} and an active steward.
        </div>`;
    } else {
        const targetButtons = purgeTargets.map(p => {
            const loy = Math.round(p.loyalty ?? 50);
            const steward = stewardByFaction[p.id];
            const stName = steward ? `${steward.first_name} ${steward.last_name}` : '?';
            return `<button class="pol-action-execute" style="margin:4px;border-left:3px solid ${p.party_color || '#888'};text-align:left;display:block;width:100%" data-purge-target="${p.id}" ${ap < (GAME_CONFIG.PURGE_AP || 3) ? 'disabled' : ''}>
                <div>${escapeHtml(p.faction_name)} <span style="color:#ff4444;font-size:10px">Loyalty: ${loy}</span></div>
                <div style="font-size:9px;opacity:0.7">Steward: ${escapeHtml(stName)}</div>
            </button>`;
        }).join('');

        content = `
            <div style="margin-top:8px">
                <div style="font-size:10px;color:#ff5722;margin-bottom:6px">
                    Target loses steward, ${Math.round((GAME_CONFIG.PURGE_TARGET_SEAT_LOSS || 0.30) * 100)}% seats, all embezzled funds.
                    Loyalty reset to ${GAME_CONFIG.PURGE_TARGET_NEW_LOYALTY || 50}. Stability ${GAME_CONFIG.PURGE_STABILITY || -1}, Health ${GAME_CONFIG.PURGE_REGIME_HEALTH || -3}.
                </div>
                ${targetButtons}
            </div>`;
    }

    return `<div class="pol-action-panel">
        <div class="pol-action-header">
            <span class="pol-action-title" style="color:#ff5722">PURGE</span>
            <span class="pol-action-cost">${GAME_CONFIG.PURGE_AP || 3} AP</span>
        </div>
        <div class="pol-action-tagline">Remove a faction's steward. Devastating consequences.</div>
        ${content}
    </div>`;
}

function renderRedistributePanel(n, f, ap, tick, nonRuling) {
    const cooldownTicks = GAME_CONFIG.REDISTRIBUTE_SEATS_COOLDOWN || 4;
    const lastRedist = Number(n.last_redistribute_tick || 0);
    const cooldownLeft = Math.max(0, (lastRedist + cooldownTicks) - tick);
    const onCooldown = cooldownLeft > 0;
    const maxRatio = GAME_CONFIG.REDISTRIBUTE_SEATS_MAX_RATIO || 0.30;
    const apCost = GAME_CONFIG.REDISTRIBUTE_SEATS_AP || 2;

    // Need at least 2 non-ruling factions to transfer between, or any non-ruling to transfer to ruling
    const otherFactions = nonRuling.filter(p => (p.seats || 0) > 0);

    let content = '';
    if (onCooldown) {
        content = `<div style="color:var(--dtext-3);font-size:11px;margin-top:8px;padding:8px;background:rgba(255,255,255,0.03);border-radius:4px">
            On cooldown — ${cooldownLeft} tick${cooldownLeft !== 1 ? 's' : ''} remaining
        </div>`;
    } else if (otherFactions.length < 2) {
        content = `<div style="color:var(--dtext-3);font-size:11px;margin-top:8px">Not enough factions to redistribute between.</div>`;
    } else {
        const optionsHtml = otherFactions.map(p =>
            `<option value="${p.id}">${escapeHtml(p.faction_name)} (${p.seats || 0} seats)</option>`
        ).join('');

        content = `
            <div style="margin-top:8px">
                <div style="font-size:10px;color:var(--dtext-3);margin-bottom:8px">
                    Loser: Standing ${GAME_CONFIG.REDISTRIBUTE_SEATS_LOSER_STANDING || -3}, Loyalty ${GAME_CONFIG.REDISTRIBUTE_SEATS_LOSER_LOYALTY || -5}.
                    Gainer: Loyalty +${GAME_CONFIG.REDISTRIBUTE_SEATS_GAINER_LOYALTY || 5}. Max ${Math.round(maxRatio * 100)}% of loser's seats.
                </div>
                <div style="display:flex;flex-direction:column;gap:6px">
                    <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-size:10px;color:var(--dtext-2);min-width:65px">Take from:</span>
                        <select id="redist-loser" style="flex:1;background:var(--dbg-3);color:var(--dtext-1);border:1px solid var(--dborder-1);padding:4px 8px;border-radius:4px;font-size:11px">
                            ${optionsHtml}
                        </select>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-size:10px;color:var(--dtext-2);min-width:65px">Give to:</span>
                        <select id="redist-gainer" style="flex:1;background:var(--dbg-3);color:var(--dtext-1);border:1px solid var(--dborder-1);padding:4px 8px;border-radius:4px;font-size:11px">
                            ${optionsHtml}
                        </select>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-size:10px;color:var(--dtext-2);min-width:65px">Seats:</span>
                        <input type="number" id="redist-seats" min="1" max="30" value="1" style="width:60px;background:var(--dbg-3);color:var(--dtext-1);border:1px solid var(--dborder-1);padding:4px 8px;border-radius:4px;font-size:11px">
                        <span id="redist-max-label" style="font-size:9px;color:var(--dtext-3)"></span>
                    </div>
                    <button class="pol-action-execute" id="redist-execute-btn" ${ap < apCost ? 'disabled' : ''} style="margin-top:4px">REDISTRIBUTE</button>
                </div>
            </div>`;
    }

    return `<div class="pol-action-panel">
        <div class="pol-action-header">
            <span class="pol-action-title">REDISTRIBUTE SEATS</span>
            <span class="pol-action-cost">${apCost} AP</span>
        </div>
        <div class="pol-action-tagline">Transfer seats between factions.</div>
        ${content}
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// AUTOCRACY ACTIONS TAB RENDERER
// ═══════════════════════════════════════════════════════════════════
async function renderAutocracyActionsTab(nation, faction, shard) {
    const container = document.getElementById('actions-container');
    if (!container) return;

    const n = nation;
    const f = faction;
    const tick = shard?.current_tick || 0;
    const rulingId = n.ruling_faction_id;
    const isStrongman = f.id === rulingId;

    // Refresh faction data
    const { data: freshF } = await _supabase.from('factions')
        .select('action_points, embezzled_funds, consecutive_embezzle_ticks, standing, loyalty, seats')
        .eq('id', f.id).single();
    if (freshF) Object.assign(f, freshF);
    const ap = f.action_points ?? 0;

    // Fetch steward
    const { data: stewardRows } = await _supabase
        .from('stewards')
        .select('*')
        .eq('nation_id', n.id).eq('faction_id', f.id).eq('is_alive', true);
    const mySteward = (stewardRows || [])[0] || null;

    // Fetch all factions
    const { data: allFactions } = await _supabase
        .from('factions')
        .select('id, faction_name, abbreviation, party_color, action_points, loyalty, seats, standing, embezzled_funds')
        .eq('nation_id', n.id).eq('faction_type', 'party');
    const nonRuling = (allFactions || []).filter(p => p.id !== rulingId);

    // Fetch pending loyalty demands
    const { data: pendingDemands } = await _supabase
        .from('loyalty_demands').select('id, target_faction_id')
        .eq('nation_id', n.id).eq('status', 'pending');

    const isChosenSuccessor = mySteward?.is_chosen_successor;
    const isGeneral = mySteward?.steward_type === 'general';
    const isPartyChairman = mySteward?.steward_type === 'party_chairman' && !isStrongman;

    const factionFunds = Number(f.embezzled_funds ?? 0);

    // Fetch unaligned seats for Buy Influence
    const { data: nationSeats } = await _supabase.from('nations')
        .select('unaligned_seats, total_seats')
        .eq('id', n.id).single();
    const unalignedSeats = nationSeats?.unaligned_seats || 0;

    // Fetch ALL stewards (full data for successor/purge/coalition)
    const { data: allStewardRows } = await _supabase
        .from('stewards').select('*').eq('nation_id', n.id).eq('is_alive', true);
    const factionsWithStewards = new Set((allStewardRows || []).map(s => s.faction_id));
    const stewardByFaction = {};
    for (const s of (allStewardRows || [])) stewardByFaction[s.faction_id] = s;

    // Fetch existing coalitions
    const { data: coalitionRows } = await _supabase
        .from('faction_coalitions').select('*').eq('nation_id', n.id).in('status', ['active', 'pending']);
    const myActiveCoalitions = [], myPendingIncoming = [], myPendingOutgoing = [];
    const existingPartners = new Set();
    for (const c of (coalitionRows || [])) {
        const isMine = c.faction_a_id === f.id || c.faction_b_id === f.id;
        if (!isMine) continue;
        const partner = c.faction_a_id === f.id ? c.faction_b_id : c.faction_a_id;
        existingPartners.add(partner);
        if (c.status === 'active') myActiveCoalitions.push(c);
        else if (c.proposed_by_faction_id === f.id) myPendingOutgoing.push(c);
        else myPendingIncoming.push(c);
    }

    // Eligible coalition targets: factions with stewards (non-strongman) or any faction (strongman), not already partnered
    const eligibleTargets = (allFactions || []).filter(p =>
        p.id !== f.id && !existingPartners.has(p.id) &&
        (isStrongman || factionsWithStewards.has(p.id))
    );

    const factionNameMap = {};
    for (const p of (allFactions || [])) factionNameMap[p.id] = p.faction_name;

    // Build coalition HTML (shared between strongman and steward)
    let coalitionHtml = '';

    // Pending incoming requests
    if (myPendingIncoming.length > 0) {
        coalitionHtml += myPendingIncoming.map(c => {
            const proposer = factionNameMap[c.proposed_by_faction_id] || '?';
            const isSecret = c.coalition_type === 'secret';
            return `<div class="pol-action-panel" style="border-left:3px solid #FFD700">
                <div class="pol-action-header">
                    <span class="pol-action-title">COALITION REQUEST</span>
                    <span class="pol-action-cost">${isSecret ? 'SECRET' : 'PUBLIC'}</span>
                </div>
                <div class="pol-action-tagline">${escapeHtml(proposer)} proposes a ${isSecret ? 'secret' : 'public'} coalition.</div>
                <div style="display:flex;gap:6px;margin-top:8px">
                    <button class="pol-action-execute" data-coal-accept="${c.id}">ACCEPT</button>
                    <button class="pol-action-execute" data-coal-decline="${c.id}">DECLINE</button>
                    ${isSecret ? `<button class="pol-action-execute" style="background:#880000" data-coal-betray="${c.id}">BETRAY</button>` : ''}
                </div>
            </div>`;
        }).join('');
    }

    // Propose coalition panel
    if (eligibleTargets.length > 0 && (mySteward || isStrongman)) {
        const targetOptions = eligibleTargets.map(p =>
            `<option value="${p.id}">${escapeHtml(p.faction_name)}</option>`).join('');
        coalitionHtml += `<div class="pol-action-panel">
            <div class="pol-action-header">
                <span class="pol-action-title">PROPOSE COALITION</span>
                <span class="pol-action-cost">1 AP</span>
            </div>
            <div class="pol-action-tagline">Form an alliance with another faction.</div>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
                <select id="coal-target-select" style="flex:1;min-width:120px;background:var(--dbg-3);color:var(--dtext-1);border:1px solid var(--dborder-1);padding:4px 8px;border-radius:4px">
                    ${targetOptions}
                </select>
                <select id="coal-type-select" style="background:var(--dbg-3);color:var(--dtext-1);border:1px solid var(--dborder-1);padding:4px 8px;border-radius:4px">
                    ${isStrongman ? '<option value="public">Public</option>' : '<option value="public">Public</option><option value="secret">Secret</option>'}
                </select>
                <button class="pol-action-execute" id="coal-propose-btn" ${ap < 1 ? 'disabled' : ''}>PROPOSE</button>
            </div>
        </div>`;
    }

    // Active coalitions
    if (myActiveCoalitions.length > 0) {
        coalitionHtml += myActiveCoalitions.map(c => {
            const partnerId = c.faction_a_id === f.id ? c.faction_b_id : c.faction_a_id;
            const partnerName = factionNameMap[partnerId] || '?';
            const isSecret = c.coalition_type === 'secret';
            const ticksLeft = c.expires_at_tick ? Math.max(0, c.expires_at_tick - tick) : '?';
            return `<div class="pol-action-panel" style="border-left:3px solid ${isSecret ? '#9C27B0' : '#4CAF50'}">
                <div class="pol-action-header">
                    <span class="pol-action-title">${isSecret ? 'SECRET' : 'PUBLIC'} COALITION</span>
                    <span class="pol-action-cost">${ticksLeft} ticks left</span>
                </div>
                <div class="pol-action-tagline">Allied with ${escapeHtml(partnerName)}</div>
                <div style="display:flex;gap:6px;margin-top:8px">
                    <button class="pol-action-execute" data-coal-msg="${c.id}" data-coal-msg-partner="${escapeHtml(partnerName)}">MESSAGE</button>
                    <button class="pol-action-execute" style="background:#880000" data-coal-dissolve="${c.id}">DISSOLVE</button>
                </div>
            </div>`;
        }).join('');
    }

    // Pending outgoing
    if (myPendingOutgoing.length > 0) {
        coalitionHtml += myPendingOutgoing.map(c => {
            const targetName = factionNameMap[c.faction_b_id] || '?';
            return `<div class="pol-action-panel" style="opacity:0.7">
                <div class="pol-action-header">
                    <span class="pol-action-title">PENDING PROPOSAL</span>
                    <span class="pol-action-cost">${c.coalition_type?.toUpperCase() || 'PUBLIC'}</span>
                </div>
                <div class="pol-action-tagline">Awaiting response from ${escapeHtml(targetName)}</div>
            </div>`;
        }).join('');
    }

    let html = '';

    if (!mySteward && !isStrongman) {
        html = '<div class="pol-action-empty">You must claim a pillar and become a steward before taking actions.</div>';
    } else if (isStrongman) {
        // Strongman actions: Demand Loyalty, Appoint Successor, Purge, Redistribute
        html = `
            <div class="pol-actions-grid">
                <div class="pol-action-panel">
                    <div class="pol-action-header">
                        <span class="pol-action-title">DEMAND LOYALTY</span>
                        <span class="pol-action-cost">2 AP</span>
                    </div>
                    <div class="pol-action-tagline">Target a faction. They must comply or refuse.</div>
                    <div class="pol-bloc-select-grid">${nonRuling.length > 0 ? nonRuling.map(p => `<button class="pol-action-execute" style="margin:4px;border-left:3px solid ${p.party_color || '#888'}" data-demand-target="${p.id}">${escapeHtml(p.faction_name)}</button>`).join('') : '<div style="color:var(--dtext-3);font-size:10px;padding:4px 0">No factions to demand loyalty from.</div>'}</div>
                </div>
                ${renderSuccessorPanel(n, f, ap, tick, allStewardRows, allFactions, nonRuling, stewardByFaction)}
                ${renderPurgePanel(n, f, ap, tick, nonRuling, stewardByFaction)}
                ${renderRedistributePanel(n, f, ap, tick, nonRuling)}
                ${coalitionHtml}
            </div>`;
    } else {
        // Steward faction actions + steward-specific actions
        const hasPendingDemand = (pendingDemands || []).some(d => d.target_faction_id === f.id);
        const demoCanAfford = factionFunds >= (GAME_CONFIG.DEMONSTRATE_COMPETENCE_COST || 2);

        html = `
            <div class="pol-actions-grid">
                <div class="pol-action-panel">
                    <div class="pol-action-header">
                        <span class="pol-action-title">PLEDGE ALLEGIANCE</span>
                        <span class="pol-action-cost">${GAME_CONFIG.PLEDGE_ALLEGIANCE_AP} AP</span>
                    </div>
                    <div class="pol-action-tagline">Publicly reaffirm loyalty. Loyalty +${GAME_CONFIG.PLEDGE_ALLEGIANCE_LOYALTY}, Standing ${GAME_CONFIG.PLEDGE_ALLEGIANCE_STANDING}</div>
                    <button class="pol-action-execute" id="autocracy-pledge-btn" ${ap < GAME_CONFIG.PLEDGE_ALLEGIANCE_AP ? 'disabled' : ''}>PLEDGE</button>
                </div>
                <div class="pol-action-panel">
                    <div class="pol-action-header">
                        <span class="pol-action-title">CONSOLIDATE POWER</span>
                        <span class="pol-action-cost">${GAME_CONFIG.CONSOLIDATE_POWER_AP} AP</span>
                    </div>
                    <div class="pol-action-tagline">Build alliances. Standing +${GAME_CONFIG.CONSOLIDATE_POWER_STANDING}, Loyalty ${GAME_CONFIG.CONSOLIDATE_POWER_LOYALTY}</div>
                    <button class="pol-action-execute" id="autocracy-consolidate-btn" ${ap < GAME_CONFIG.CONSOLIDATE_POWER_AP ? 'disabled' : ''}>CONSOLIDATE</button>
                </div>
                <div class="pol-action-panel">
                    <div class="pol-action-header">
                        <span class="pol-action-title">DEMONSTRATE COMPETENCE</span>
                        <span class="pol-action-cost">${GAME_CONFIG.DEMONSTRATE_COMPETENCE_AP} AP${demoCanAfford ? ` · $${GAME_CONFIG.DEMONSTRATE_COMPETENCE_COST}M` : ''}</span>
                    </div>
                    <div class="pol-action-tagline">Actually govern. Standing +${demoCanAfford ? GAME_CONFIG.DEMONSTRATE_COMPETENCE_STANDING : GAME_CONFIG.DEMONSTRATE_COMPETENCE_REDUCED_STANDING}, Loyalty +${GAME_CONFIG.DEMONSTRATE_COMPETENCE_LOYALTY}</div>
                    <button class="pol-action-execute" id="autocracy-demonstrate-btn" ${ap < GAME_CONFIG.DEMONSTRATE_COMPETENCE_AP ? 'disabled' : ''}>DEMONSTRATE</button>
                </div>
                <div class="pol-action-panel">
                    <div class="pol-action-header">
                        <span class="pol-action-title">EMBEZZLE FUNDS</span>
                        <span class="pol-action-cost">${GAME_CONFIG.EMBEZZLE_FUNDS_AP} AP</span>
                    </div>
                    <div class="pol-action-tagline">Loyalty ${GAME_CONFIG.EMBEZZLE_FUNDS_LOYALTY} · Risk: ${getEmbezzleRiskLabel(f, n)}</div>
                    <button class="pol-action-execute" id="autocracy-embezzle-btn" ${ap < GAME_CONFIG.EMBEZZLE_FUNDS_AP ? 'disabled' : ''}>EMBEZZLE</button>
                </div>
                <div class="pol-action-panel">
                    <div class="pol-action-header">
                        <span class="pol-action-title">BUY INFLUENCE</span>
                        <span class="pol-action-cost">${GAME_CONFIG.BUY_INFLUENCE_AP} AP</span>
                    </div>
                    <div class="pol-action-tagline">Spend war chest funds to acquire seats. Standing ${GAME_CONFIG.BUY_INFLUENCE_STANDING}</div>
                    <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;align-items:center">
                        <select id="buy-influence-target" style="flex:1;min-width:120px;background:var(--dbg-3);color:var(--dtext-1);border:1px solid var(--dborder-1);padding:4px 8px;border-radius:4px;font-size:0.75rem">
                            <option value="unaligned" data-cost="${GAME_CONFIG.BUY_INFLUENCE_UNALIGNED_COST}" data-maxseats="${unalignedSeats}">Unaligned Pool (${unalignedSeats} seats · $${GAME_CONFIG.BUY_INFLUENCE_UNALIGNED_COST}M/seat)</option>
                            ${(() => { const rh = Math.max(0, Math.min(100, Number(n.regime_health ?? 80))); const strongmanCost = Math.round(GAME_CONFIG.BUY_INFLUENCE_STRONGMAN_BASE_COST * (1 + rh * GAME_CONFIG.BUY_INFLUENCE_STRONGMAN_HEALTH_SCALE)); const rulingFac = (allFactions || []).find(p => p.id === rulingId); return rulingFac ? `<option value="${rulingFac.id}" data-cost="${strongmanCost}" data-maxseats="${rulingFac.seats || 0}">${escapeHtml(rulingFac.faction_name)} [RULER] (${rulingFac.seats || 0} seats · ~$${strongmanCost}M/seat)</option>` : ''; })()}
                            ${nonRuling.filter(p => p.id !== f.id).map(p => {
                                const yourSt = Math.max(1, f.standing ?? 30);
                                const tSt = p.standing ?? 30;
                                const tSeats = p.seats || 0;
                                const cps = Math.round(GAME_CONFIG.BUY_INFLUENCE_BASE_COST * (tSt / yourSt) * (1 + tSeats / (n.total_seats || 120)));
                                return `<option value="${p.id}" data-cost="${cps}" data-maxseats="${tSeats}">${escapeHtml(p.faction_name)} (${tSeats} seats · ~$${cps}M/seat)</option>`;
                            }).join('')}
                        </select>
                        <input type="number" id="buy-influence-seats" min="1" max="${unalignedSeats}" value="1" style="width:70px;background:var(--dbg-3);color:var(--dtext-1);border:1px solid var(--dborder-1);padding:4px 8px;border-radius:4px;font-size:0.75rem">
                        <button class="pol-action-execute" id="autocracy-buyinfluence-btn" ${ap < GAME_CONFIG.BUY_INFLUENCE_AP || factionFunds < 1 ? 'disabled' : ''}>BUY</button>
                    </div>
                    <div id="buy-influence-cost-preview" style="font-size:0.65rem;color:var(--dtext-3);margin-top:4px">Cost: $${GAME_CONFIG.BUY_INFLUENCE_UNALIGNED_COST}M · War Chest: $${Math.round(factionFunds)}M</div>
                </div>
                ${isGeneral ? `<div class="pol-action-panel">
                    <div class="pol-action-header">
                        <span class="pol-action-title">SHOW OF FORCE</span>
                        <span class="pol-action-cost">3 AP</span>
                    </div>
                    <div class="pol-action-tagline">Military presence. All rivals: -5 Coup Readiness</div>
                    <button class="pol-action-execute" id="autocracy-showofforce-btn" ${ap < 3 ? 'disabled' : ''}>DEPLOY</button>
                </div>` : ''}
                ${isPartyChairman ? `<div class="pol-action-panel">
                    <div class="pol-action-header">
                        <span class="pol-action-title">MOBILIZE</span>
                        <span class="pol-action-cost">${MOBILIZE_CONFIG.AP_COST} AP</span>
                    </div>
                    <div class="pol-action-tagline">Organize demonstrations for regime or yourself.</div>
                    <button class="pol-action-execute" data-mode="rally_regime" id="autocracy-mobilize-regime-btn" ${ap < MOBILIZE_CONFIG.AP_COST ? 'disabled' : ''}>Rally for Regime</button>
                    <button class="pol-action-execute" data-mode="rally_self" id="autocracy-mobilize-self-btn" ${ap < MOBILIZE_CONFIG.AP_COST ? 'disabled' : ''}>Rally for Self (risky)</button>
                </div>` : ''}
                ${isChosenSuccessor ? `<div class="pol-action-panel">
                    <div class="pol-action-header">
                        <span class="pol-action-title">DYNASTY</span>
                        <span class="pol-action-cost">1 AP</span>
                    </div>
                    <div class="pol-action-tagline">Prepare for your future reign.</div>
                    <button class="pol-action-execute" id="autocracy-cultivate-btn" ${ap < 1 ? 'disabled' : ''}>Cultivate Image</button>
                    <button class="pol-action-execute" id="autocracy-prepare-btn" ${ap < 1 ? 'disabled' : ''}>Prepare Succession</button>
                </div>` : ''}
                ${coalitionHtml}
            </div>
            <div style="margin-top:12px;font-family:var(--dfont-mono);font-size:10px;color:var(--dtext-3)">WAR CHEST: $${Math.round(factionFunds)}M</div>`;
    }

    // Add coalition messaging overlay
    const coalMsgOverlay = `
    <div id="pol-coal-msg-overlay" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;align-items:center;justify-content:center">
        <div style="background:var(--dbg-2);border:1px solid var(--dborder-1);border-radius:8px;padding:20px;width:90%;max-width:400px;max-height:70vh;display:flex;flex-direction:column">
            <div id="pol-coal-msg-title" style="font-weight:700;color:var(--dtext-1);margin-bottom:12px">Coalition Messages</div>
            <div id="pol-coal-msg-list" style="flex:1;overflow-y:auto;max-height:300px;margin-bottom:12px;font-size:0.8rem"></div>
            <div style="display:flex;gap:6px">
                <input type="text" id="pol-coal-msg-input" placeholder="Type a message..." maxlength="280" style="flex:1;background:var(--dbg-3);color:var(--dtext-1);border:1px solid var(--dborder-1);padding:6px 10px;border-radius:4px;font-size:0.8rem">
                <button id="pol-coal-msg-send" class="pol-action-execute" style="padding:6px 14px">SEND</button>
            </div>
            <button id="pol-coal-msg-close" style="margin-top:10px;background:transparent;color:var(--dtext-2);border:1px solid var(--dborder-1);padding:6px 14px;border-radius:4px;cursor:pointer;font-size:0.75rem">CLOSE</button>
        </div>
    </div>`;

    container.innerHTML = html + coalMsgOverlay;

    // Wire up autocracy action buttons
    const reRender = async () => {
        await renderAutocracyActionsTab(nation, faction, shard);
        await renderEventsTab(n.id, f.id, tick);
        // Update topbar AP display immediately after actions
        const apEl = document.getElementById('topbar-ap');
        if (apEl) apEl.innerHTML = '<span class="topbar-ap__count">' + (f.action_points ?? 0) + ' AP</span>';
    };

    // Steward actions
    document.getElementById('autocracy-pledge-btn')?.addEventListener('click', async function() {
        this.disabled = true; this.textContent = 'PLEDGING...';
        const r = await executePledgeAllegiance(_supabase, f.id, n.id, tick);
        if (!r.success) { alert(r.error); await reRender(); return; }
        f.action_points = r.newAp;
        alert(`Pledge Allegiance:\nLoyalty ${r.loyaltyChange > 0 ? '+' : ''}${r.loyaltyChange} → ${r.newLoyalty}\nStanding ${r.standingChange > 0 ? '+' : ''}${r.standingChange} → ${r.newStanding}`);
        await reRender();
    });

    document.getElementById('autocracy-consolidate-btn')?.addEventListener('click', async function() {
        this.disabled = true; this.textContent = 'CONSOLIDATING...';
        const r = await executeConsolidatePower(_supabase, f.id, n.id, tick);
        if (!r.success) { alert(r.error); await reRender(); return; }
        f.action_points = r.newAp;
        alert(`Consolidate Power:\nStanding +${r.standingChange} → ${r.newStanding}\nLoyalty ${r.loyaltyChange} → ${r.newLoyalty}`);
        await reRender();
    });

    document.getElementById('autocracy-demonstrate-btn')?.addEventListener('click', async function() {
        this.disabled = true; this.textContent = 'GOVERNING...';
        const r = await executeDemonstrateCompetence(_supabase, f.id, n.id, tick);
        if (!r.success) { alert(r.error); await reRender(); return; }
        f.action_points = r.newAp;
        let msg = `Standing +${r.standingChange}, Loyalty +${r.loyaltyChange}`;
        if (r.fundsSpent > 0) msg += `, Spent $${r.fundsSpent}M`;
        alert(msg);
        await reRender();
    });

    document.getElementById('autocracy-embezzle-btn')?.addEventListener('click', async function() {
        this.disabled = true; this.textContent = 'EMBEZZLING...';
        const r = await executeEmbezzleFunds(_supabase, f.id, n.id, tick);
        if (!r.success) { alert(r.error); await reRender(); return; }
        f.action_points = r.newAp;
        let msg = `Income: +$${r.income}M, Loyalty: ${r.loyaltyChange}`;
        if (r.detected) msg += ` — DETECTED! Funds seized: $${r.fundsSeized}M`;
        alert(msg);
        await reRender();
    });

    // Buy Influence — dynamic cost preview
    const buyTargetSelect = document.getElementById('buy-influence-target');
    const buySeatsInput = document.getElementById('buy-influence-seats');
    const buyCostPreview = document.getElementById('buy-influence-cost-preview');
    function updateBuyCostPreview() {
        if (!buyTargetSelect || !buySeatsInput || !buyCostPreview) return;
        const opt = buyTargetSelect.selectedOptions[0];
        const costPerSeat = Number(opt?.dataset.cost || 0);
        const maxSeats = Number(opt?.dataset.maxseats || 0);
        const seats = Math.max(0, Number(buySeatsInput.value || 0));
        buySeatsInput.max = maxSeats;
        const totalCost = seats * costPerSeat;
        const warChest = Math.round(Number(f.embezzled_funds ?? 0));
        const canAfford = totalCost <= warChest && seats > 0 && seats <= maxSeats;
        buyCostPreview.textContent = `Cost: $${totalCost}M · War Chest: $${warChest}M` + (seats > 0 && !canAfford ? ' — NOT ENOUGH' : '');
        buyCostPreview.style.color = canAfford ? 'var(--dtext-3)' : 'var(--dred, #d9534f)';
    }
    buyTargetSelect?.addEventListener('change', updateBuyCostPreview);
    buySeatsInput?.addEventListener('input', updateBuyCostPreview);

    // Buy Influence — submit handler
    document.getElementById('autocracy-buyinfluence-btn')?.addEventListener('click', async function() {
        const targetSelect = document.getElementById('buy-influence-target');
        const seatsInput = document.getElementById('buy-influence-seats');
        const targetId = targetSelect?.value;
        const opt = targetSelect?.selectedOptions[0];
        const costPerSeat = Number(opt?.dataset.cost || 0);
        const seatCount = Number(seatsInput?.value || 0);
        if (!targetId || seatCount <= 0) { alert('Select a target and enter seats to buy.'); return; }
        const fundsToSpend = seatCount * costPerSeat;
        if (fundsToSpend > Number(f.embezzled_funds ?? 0)) { alert(`Not enough war chest funds. Need $${fundsToSpend}M, have $${Math.round(Number(f.embezzled_funds ?? 0))}M.`); return; }
        this.disabled = true; this.textContent = 'BUYING...';
        const r = await executeBuyInfluence(_supabase, f.id, n.id, targetId, fundsToSpend, tick);
        if (!r.success) { alert(r.error); await reRender(); return; }
        f.action_points = r.newAp;
        let msg = r.seatsGained > 0
            ? `Bought ${r.seatsGained} seat${r.seatsGained !== 1 ? 's' : ''} from ${r.targetName}.\nSpent: $${Math.round(r.fundsSpent)}M\nStanding: ${GAME_CONFIG.BUY_INFLUENCE_STANDING}`
            : (r.message || 'No seats acquired.');
        alert(msg);
        await reRender();
    });

    // Show of Force (General only)
    document.getElementById('autocracy-showofforce-btn')?.addEventListener('click', async function() {
        this.disabled = true; this.textContent = 'DEPLOYING...';
        const apResult = await deductAP(_supabase, f.id, 3);
        if (!apResult.success) { alert('Not enough AP.'); await reRender(); return; }
        f.action_points = apResult.newAp;

        // All OTHER stewards: coup_readiness -5
        const { data: otherStewards } = await _supabase.from('stewards')
            .select('id, coup_readiness, faction_id').eq('nation_id', n.id).eq('is_alive', true);
        for (const os of (otherStewards || []).filter(s => s.faction_id !== f.id)) {
            const newCR = Math.max(0, (os.coup_readiness ?? 0) - 5);
            await _supabase.from('stewards').update({ coup_readiness: newCR }).eq('id', os.id);
        }

        // Nation: civil_unrest -2, happiness -3
        const newUnrest = Math.max(0, Number(n.civil_unrest ?? 30) - 2);
        const newHappiness = Math.max(0, Number(n.happiness ?? 50) - 3);
        await _supabase.from('nations').update({ civil_unrest: newUnrest, happiness: newHappiness }).eq('id', n.id);

        // Military pillar support +3
        const { data: milPillars } = await _supabase.from('regime_pillars')
            .select('id, support').eq('nation_id', n.id).eq('pillar_key', 'military');
        const milPillar = (milPillars || [])[0];
        if (milPillar) {
            const newSupport = Math.min(100, (milPillar.support ?? 50) + 3);
            await _supabase.from('regime_pillars').update({ support: newSupport }).eq('id', milPillar.id);
        }

        // Log
        await _supabase.from('campaign_actions').insert({
            party_id: f.id, nation_id: n.id,
            action_type: 'steward_show_of_force', tick_performed: tick,
            result: {
                steward_name: mySteward ? `${mySteward.first_name} ${mySteward.last_name}` : f.faction_name,
                faction_name: f.faction_name,
                rivals_coup_readiness: -5, civil_unrest: -2, happiness: -3,
                military_pillar_support: milPillar ? '+3' : 'no pillar'
            }
        });

        alert('Show of Force deployed.\nAll rivals: Coup Readiness -5\nCivil Unrest -2, Happiness -3\nMilitary Pillar +3');
        await reRender();
    });

    // Mobilize
    document.getElementById('autocracy-mobilize-regime-btn')?.addEventListener('click', async function() {
        this.disabled = true;
        const r = await executeMobilize(_supabase, f.id, n.id, 'rally_regime', tick);
        if (!r.success) { alert(r.error); await reRender(); return; }
        f.action_points = r.newAp;
        alert(`Rallied for regime. Legitimacy +${r.legitimacyChange || 3}, Standing +${r.standingChange || 3}`);
        await reRender();
    });

    document.getElementById('autocracy-mobilize-self-btn')?.addEventListener('click', async function() {
        this.disabled = true;
        const r = await executeMobilize(_supabase, f.id, n.id, 'rally_self', tick);
        if (!r.success) { alert(r.error); await reRender(); return; }
        f.action_points = r.newAp;
        let msg = `Coup Readiness +${r.coupReadinessChange || 5}`;
        if (r.detected) msg += ' — DETECTED!';
        alert(msg);
        await reRender();
    });

    // Dynasty
    document.getElementById('autocracy-cultivate-btn')?.addEventListener('click', async function() {
        this.disabled = true;
        const r = await executeDynastyAction(_supabase, n.id, f.id, 'cultivate_image', null, tick);
        if (!r.success) { alert(r.error); await reRender(); return; }
        f.action_points = r.newAp;
        alert(`Image cultivated. Legitimacy +${r.legitimacyGain}, Succession Strength +${r.successionStrengthGain}`);
        await reRender();
    });

    document.getElementById('autocracy-prepare-btn')?.addEventListener('click', async function() {
        this.disabled = true;
        const r = await executeDynastyAction(_supabase, n.id, f.id, 'prepare_succession', null, tick);
        if (!r.success) { alert(r.error); await reRender(); return; }
        f.action_points = r.newAp;
        alert(r.detected ? 'Preparation detected!' : `Succession Strength +${r.successionStrengthGain}, Exit Readiness +${r.exitReadinessGain}`);
        await reRender();
    });

    // Strongman demand loyalty buttons
    container.querySelectorAll('[data-demand-target]').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (ap < 2) { alert('Not enough AP (need 2).'); await reRender(); return; }
            btn.disabled = true; btn.textContent = 'DEMANDING...';
            const apResult = await deductAP(_supabase, f.id, 2);
            if (!apResult.success) { alert('Not enough AP.'); await reRender(); return; }
            f.action_points = apResult.newAp;
            const targetId = btn.dataset.demandTarget;
            const targetName = (allFactions || []).find(p => p.id === targetId)?.faction_name || 'Unknown';
            await _supabase.from('loyalty_demands').insert({
                nation_id: n.id, strongman_faction_id: f.id,
                target_faction_id: targetId, demanded_at_tick: tick, deadline_tick: tick + 2, status: 'pending'
            });
            await _supabase.from('campaign_actions').insert({
                party_id: f.id, nation_id: n.id, action_type: 'demand_loyalty',
                tick_performed: tick, result: { target_faction: targetName, target_faction_id: targetId }
            });
            alert(`Demanded loyalty from ${targetName}`);
            await reRender();
        });
    });

    // ── Appoint Successor: steward target buttons ──
    container.querySelectorAll('[data-successor-target]').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (ap < SUCCESSOR_CONFIG.AP_COST) { alert(`Not enough AP (need ${SUCCESSOR_CONFIG.AP_COST}).`); await reRender(); return; }
            const targetId = btn.dataset.successorTarget;
            const targetFac = (allFactions || []).find(p => p.id === targetId);
            if (!confirm(`Appoint ${targetFac?.faction_name || 'this faction'}'s steward as successor?\n\nCost: ${SUCCESSOR_CONFIG.AP_COST} AP\nStability +${SUCCESSOR_CONFIG.STABILITY_BOOST}\nTarget pillar +${SUCCESSOR_CONFIG.PILLAR_BOOST}\nOther factions: Loyalty -${SUCCESSOR_CONFIG.OTHER_LOYALTY_DROP}, Coup Readiness +${SUCCESSOR_CONFIG.OTHER_COUP_READINESS}\n\nCooldown: ${SUCCESSOR_CONFIG.COOLDOWN_TICKS} ticks`)) return;
            btn.disabled = true;
            const r = await executeAppointSuccessor(_supabase, n.id, f.id, targetId, tick);
            if (!r.success) { alert(r.error || 'Failed to appoint successor.'); await reRender(); return; }
            f.action_points = r.newAp;
            alert(`Appointed ${r.successorName} as chosen successor.`);
            await reRender();
        });
    });

    // ── Appoint Successor: family member button ──
    document.getElementById('successor-family-btn')?.addEventListener('click', async () => {
        if (ap < SUCCESSOR_CONFIG.AP_COST) { alert(`Not enough AP (need ${SUCCESSOR_CONFIG.AP_COST}).`); return; }
        if (!confirm(`Appoint a family member as successor?\n\nCost: ${SUCCESSOR_CONFIG.AP_COST} AP + ${SUCCESSOR_CONFIG.FAMILY_AP_PENALTY} AP/tick ongoing\nStability +${SUCCESSOR_CONFIG.FAMILY_STABILITY_BOOST}\nAll pillars: -${SUCCESSOR_CONFIG.FAMILY_PILLAR_PENALTY} support\nAll stewards: Coup Readiness +${SUCCESSOR_CONFIG.FAMILY_COUP_READINESS}\n\nCooldown: ${SUCCESSOR_CONFIG.COOLDOWN_TICKS} ticks`)) return;
        const r = await executeAppointSuccessor(_supabase, n.id, f.id, f.id, tick);
        if (!r.success) { alert(r.error || 'Failed to appoint family member.'); await reRender(); return; }
        f.action_points = r.newAp;
        alert('Appointed family member as successor.');
        await reRender();
    });

    // ── Revoke Successor ──
    document.getElementById('successor-revoke-btn')?.addEventListener('click', async () => {
        if (!confirm('Revoke the current successor?\n\nStability -' + SUCCESSOR_CONFIG.REVOKE_STABILITY_DROP + '\nAll stewards: Coup Readiness +' + SUCCESSOR_CONFIG.REVOKE_COUP_READINESS + '\nFormer successor faction: Loyalty -' + SUCCESSOR_CONFIG.REVOKE_LOYALTY_DROP)) return;
        const r = await executeRevokeSuccessor(_supabase, n.id, f.id, tick);
        if (!r.success) { alert(r.error || 'Failed to revoke successor.'); await reRender(); return; }
        alert('Successor revoked.' + (r.revokedName ? ` ${r.revokedName} removed.` : ''));
        await reRender();
    });

    // ── Purge target buttons ──
    container.querySelectorAll('[data-purge-target]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.dataset.purgeTarget;
            const targetFac = (allFactions || []).find(p => p.id === targetId);
            const targetName = targetFac?.faction_name || 'Unknown';
            if (!confirm(`PURGE ${targetName.toUpperCase()}?\n\nThis will:\n• Kill their steward and replace with a weaker one\n• Remove ${Math.round((GAME_CONFIG.PURGE_TARGET_SEAT_LOSS || 0.30) * 100)}% of their seats\n• Seize all embezzled funds\n• Reset loyalty to ${GAME_CONFIG.PURGE_TARGET_NEW_LOYALTY || 50}\n• Standing -${Math.abs(GAME_CONFIG.PURGE_TARGET_STANDING || 20)}\n\nNational effects:\n• Stability ${GAME_CONFIG.PURGE_STABILITY || -1}\n• Regime Health ${GAME_CONFIG.PURGE_REGIME_HEALTH || -3}\n• Other factions: Loyalty +${GAME_CONFIG.PURGE_OTHERS_LOYALTY || 5}`)) return;
            btn.disabled = true;
            const r = await executePurge(_supabase, f.id, n.id, targetId, tick);
            if (!r.success) { alert(r.error || 'Purge failed.'); await reRender(); return; }
            f.action_points = r.newAp;
            let msg = `Purged ${r.targetName}.\nSteward ${r.purgedSteward} eliminated.\nNew steward: ${r.newSteward}\nSeats lost: ${r.seatsLost}`;
            if (r.fundsSeized > 0) msg += `\nFunds seized: $${r.fundsSeized}M`;
            alert(msg);
            await reRender();
        });
    });

    // ── Redistribute Seats ──
    const redistLoser = document.getElementById('redist-loser');
    const redistGainer = document.getElementById('redist-gainer');
    const redistSeats = document.getElementById('redist-seats');
    const redistMaxLabel = document.getElementById('redist-max-label');

    // Update max seats label when loser changes
    function updateRedistMax() {
        if (!redistLoser || !redistSeats || !redistMaxLabel) return;
        const loserFac = (allFactions || []).find(p => p.id === redistLoser.value);
        const maxSeats = Math.max(1, Math.floor((loserFac?.seats || 0) * (GAME_CONFIG.REDISTRIBUTE_SEATS_MAX_RATIO || 0.30)));
        redistMaxLabel.textContent = `(max ${maxSeats})`;
        redistSeats.max = maxSeats;
        if (Number(redistSeats.value) > maxSeats) redistSeats.value = maxSeats;
    }
    redistLoser?.addEventListener('change', updateRedistMax);
    updateRedistMax();

    document.getElementById('redist-execute-btn')?.addEventListener('click', async () => {
        if (!redistLoser || !redistGainer || !redistSeats) return;
        const loserId = redistLoser.value;
        const gainerId = redistGainer.value;
        const seats = parseInt(redistSeats.value, 10);
        if (loserId === gainerId) { alert('Cannot transfer to the same faction.'); return; }
        if (!seats || seats < 1) { alert('Must transfer at least 1 seat.'); return; }
        const loserFac = (allFactions || []).find(p => p.id === loserId);
        const gainerFac = (allFactions || []).find(p => p.id === gainerId);
        if (!confirm(`Transfer ${seats} seat${seats !== 1 ? 's' : ''} from ${loserFac?.faction_name || '?'} to ${gainerFac?.faction_name || '?'}?`)) return;
        const r = await executeRedistributeSeats(_supabase, f.id, n.id, loserId, gainerId, seats, tick);
        if (!r.success) { alert(r.error || 'Redistribution failed.'); await reRender(); return; }
        f.action_points = r.newAp;
        alert(`Redistributed ${r.seatsTransferred} seats from ${r.loserName} to ${r.gainerName}.`);
        await reRender();
    });

    // Coalition: Propose
    document.getElementById('coal-propose-btn')?.addEventListener('click', async function() {
        const targetId = document.getElementById('coal-target-select')?.value;
        const coalType = document.getElementById('coal-type-select')?.value || 'public';
        if (!targetId) return;
        this.disabled = true; this.textContent = 'PROPOSING...';
        const apResult = await deductAP(_supabase, f.id, 1);
        if (!apResult.success) { alert('Not enough AP.'); await reRender(); return; }
        f.action_points = apResult.newAp;

        const aId = f.id < targetId ? f.id : targetId;
        const bId = f.id < targetId ? targetId : f.id;
        await _supabase.from('faction_coalitions').insert({
            nation_id: n.id, faction_a_id: aId, faction_b_id: bId,
            coalition_type: coalType, status: 'pending',
            proposed_by_faction_id: f.id,
            proposed_at_tick: tick, expires_at_tick: tick + 20
        });
        const targetName = factionNameMap[targetId] || 'Unknown';
        await _supabase.from('campaign_actions').insert({
            party_id: f.id, nation_id: n.id, action_type: 'propose_coalition',
            tick_performed: tick, result: { target_faction: targetName, coalition_type: coalType }
        });
        alert(`Proposed ${coalType} coalition with ${targetName}`);
        await reRender();
    });

    // Coalition: Accept
    container.querySelectorAll('[data-coal-accept]').forEach(btn => {
        btn.addEventListener('click', async () => {
            btn.disabled = true; btn.textContent = 'ACCEPTING...';
            const coalId = btn.dataset.coalAccept;
            await _supabase.from('faction_coalitions').update({ status: 'active' }).eq('id', coalId);
            const coal = myPendingIncoming.find(c => c.id === coalId);
            if (coal) {
                await _supabase.from('campaign_actions').insert({
                    party_id: f.id, nation_id: n.id, action_type: 'accept_coalition',
                    tick_performed: tick, result: { partner: factionNameMap[coal.faction_a_id === f.id ? coal.faction_b_id : coal.faction_a_id] || '?' }
                });
            }
            alert('Coalition accepted.');
            await reRender();
        });
    });

    // Coalition: Decline
    container.querySelectorAll('[data-coal-decline]').forEach(btn => {
        btn.addEventListener('click', async () => {
            btn.disabled = true; btn.textContent = 'DECLINING...';
            const coalId = btn.dataset.coalDecline;
            await _supabase.from('faction_coalitions').update({ status: 'declined' }).eq('id', coalId);
            alert('Coalition declined.');
            await reRender();
        });
    });

    // Coalition: Betray (report secret coalition to strongman)
    container.querySelectorAll('[data-coal-betray]').forEach(btn => {
        btn.addEventListener('click', async () => {
            btn.disabled = true; btn.textContent = 'BETRAYING...';
            const coalId = btn.dataset.coalBetray;
            const coal = myPendingIncoming.find(c => c.id === coalId);
            await _supabase.from('faction_coalitions').update({ status: 'betrayed' }).eq('id', coalId);
            if (coal) {
                // Report to strongman — proposer loses loyalty
                const proposerId = coal.proposed_by_faction_id || (coal.faction_a_id === f.id ? coal.faction_b_id : coal.faction_a_id);
                const { data: proposer } = await _supabase.from('factions').select('loyalty').eq('id', proposerId).maybeSingle();
                if (proposer) {
                    const newLoy = Math.max(0, (proposer.loyalty ?? 50) - 15);
                    await _supabase.from('factions').update({ loyalty: newLoy }).eq('id', proposerId);
                }
                await _supabase.from('campaign_actions').insert({
                    party_id: f.id, nation_id: n.id, action_type: 'betray_coalition',
                    tick_performed: tick, result: { betrayed_faction: factionNameMap[proposerId] || '?' }
                });
            }
            alert('Coalition betrayed! The proposer has been exposed to the strongman.');
            await reRender();
        });
    });

    // Coalition: Dissolve
    container.querySelectorAll('[data-coal-dissolve]').forEach(btn => {
        btn.addEventListener('click', async () => {
            btn.disabled = true; btn.textContent = 'DISSOLVING...';
            const coalId = btn.dataset.coalDissolve;
            await _supabase.from('faction_coalitions').update({ status: 'dissolved' }).eq('id', coalId);
            await _supabase.from('campaign_actions').insert({
                party_id: f.id, nation_id: n.id, action_type: 'dissolve_coalition',
                tick_performed: tick, result: {}
            });
            alert('Coalition dissolved.');
            await reRender();
        });
    });

    // Coalition: Messaging
    container.querySelectorAll('[data-coal-msg]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const coalitionId = btn.dataset.coalMsg;
            const partnerName = btn.dataset.coalMsgPartner;
            const overlay = document.getElementById('pol-coal-msg-overlay');
            const titleEl = document.getElementById('pol-coal-msg-title');
            const listEl = document.getElementById('pol-coal-msg-list');
            const inputEl = document.getElementById('pol-coal-msg-input');
            const sendBtn = document.getElementById('pol-coal-msg-send');
            const closeBtn = document.getElementById('pol-coal-msg-close');
            if (!overlay || !listEl) return;

            titleEl.textContent = `Messages — ${partnerName}`;
            overlay.style.display = 'flex';

            async function loadMessages() {
                const { data: msgs } = await _supabase
                    .from('coalition_messages')
                    .select('faction_id, message, tick_posted')
                    .eq('coalition_id', coalitionId)
                    .order('created_at', { ascending: true })
                    .limit(50);

                listEl.innerHTML = (msgs || []).map(m => {
                    const isMine = m.faction_id === f.id;
                    const senderName = isMine ? f.faction_name : partnerName;
                    return `<div style="margin-bottom:8px;text-align:${isMine ? 'right' : 'left'}">
                        <span style="font-size:0.7rem;color:var(--dtext-3)">${escapeHtml(senderName)}</span><br>
                        <span style="background:${isMine ? 'var(--accent-bg, #2a2a1a)' : 'var(--dbg-3)'};padding:4px 8px;border-radius:6px;font-size:0.8rem;color:var(--dtext-1);display:inline-block">${escapeHtml(m.message)}</span>
                        <span style="font-size:0.6rem;color:var(--dtext-3);display:block">Tick ${m.tick_posted}</span>
                    </div>`;
                }).join('') || '<div style="color:var(--dtext-3);text-align:center;padding:20px;font-size:0.8rem">No messages yet.</div>';

                listEl.scrollTop = listEl.scrollHeight;
            }

            await loadMessages();

            // Clone to remove old listeners
            const newSend = sendBtn.cloneNode(true);
            const newClose = closeBtn.cloneNode(true);
            const newInput = inputEl.cloneNode(true);
            sendBtn.replaceWith(newSend);
            closeBtn.replaceWith(newClose);
            inputEl.replaceWith(newInput);

            newClose.addEventListener('click', () => { overlay.style.display = 'none'; });

            newSend.addEventListener('click', async () => {
                const text = newInput.value.trim();
                if (!text) return;
                newSend.disabled = true;
                await _supabase.from('coalition_messages').insert({
                    coalition_id: coalitionId,
                    faction_id: f.id,
                    message: text,
                    tick_posted: tick
                });
                newInput.value = '';
                newSend.disabled = false;
                await loadMessages();
            });

            newInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); newSend.click(); }
            });
        });
    });
}

