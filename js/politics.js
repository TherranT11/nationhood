import { _supabase } from './supabase-client.js';
import { initPage } from './common.js';
import './guide.js';
import { getPartyIconSVG, getPartyLogoHTML, PARTY_ICONS, PARTY_COLOR_PALETTE } from './party-icons.js';
import { tickToDate } from './utils.js';

import { fetchActiveCoalition, loadSeats, isPresidentialRepublic, initGameConfigForNation, GAME_CONFIG, RALLY_CONFIG, RALLY_OUTCOMES, getRallyOutcomeWeights, getRallyRiskLevel, executeRally, OUTREACH_CONFIG, computeOutreachAlignment, calcOutreachEffect, calcOutreachFriction, executeOutreach, ATTACK_CONFIG, ATTACK_OUTCOMES, getAttackOutcomeWeights, gatherAttackEvidence, buildAttackVectors, executeAttack, MAKE_PROMISE_CONFIG, executeMakePromise, getPromiseableStats, deductAP, disbandParty, getNationNames, IDEOLOGY_AXES, PROTEST_CONFIG, getProtestCost, getDecayedUseCount, getProtestFatigueLevel, getStatHintColor, canCallProtest, getStatFailureScore, isExcludedStat, isHigherIsBad, getTierLabel, executeProtest, endorseProtest, callOffProtest, executePublicAddress, executeEndorsementPreference, executeTakeStance, STANCE_CONFIG, ISSUE_DEFS, ISSUE_IDS, AXIS_KEYS, POLL_CONFIG, executePollNow, IDEO_SHIFT_CONFIG, executeFundThinkTank, executeMediaCampaign, executeGrassrootsMovement } from './game-common.js';
import { isAutocracy, isGovernmentPresidential } from './game/government-types.js';
import { computeEndorsementButtonState } from './ui/endorsement-ui.js';
import { ISSUE_CATEGORY_STATS, statDirectionSign } from './game/stats.js';
import { getElectabilityTier } from './game/party-leadership.js';
import { AUTOCRACY_ACTIONS, dispatchAutocracyAction, getEscalatingCost, checkCooldown } from './game/autocracy-actions.js';

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

    // Initialize game config for this nation (needed for autocracy action costs)
    await initGameConfigForNation(_supabase, nation.id);

    // Fetch full faction data (state.faction has SELECT * so should be complete)
    const f = faction;
    const currentTick = shard?.current_tick || 0;

    // Fetch total seats from all parties
    const { data: allParties } = await _supabase
        .from('factions')
        .select('id, seats, national_vote_share, faction_name, abbreviation, party_color, standing, loyalty, last_seen_tick, leader_first_name, leader_last_name, custom_logo_url, party_logo, party_description')
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

    // V5 Autocracy data
    let pillarStates = [];
    let autocracyTracker = null;
    let autocracyActionLog = [];
    if (isAutoNation) {
        const [fpsRes, trackerRes, logRes] = await Promise.all([
            _supabase.from('faction_pillar_state').select('*').eq('nation_id', nation.id),
            _supabase.from('autocracy_tracker').select('*').eq('nation_id', nation.id).maybeSingle(),
            _supabase.from('autocracy_action_log').select('tick, action_type, faction_id, details')
                .eq('nation_id', nation.id).order('created_at', { ascending: false }).limit(10),
        ]);
        pillarStates = fpsRes.data || [];
        autocracyTracker = trackerRes.data;
        autocracyActionLog = logRes.data || [];
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

    // Fetch active caucus factions for player's party
    const { data: caucusFactions } = await _supabase
        .from('caucus_factions')
        .select('id, name, dominant_axis, wing_end, seat_share, relationship_score')
        .eq('party_id', f.id)
        .eq('is_active', true);

    // Endorsement preference (faction_endorsements table removed — default to null)
    const currentEndorsement = null;

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
        prevApproval,
        lastParliamentary,
        lastPresidential,
        scheduledElections,
        president,
        administration,
        caucusFactions,
        currentEndorsement,
        pillarStates,
        autocracyTracker,
        autocracyActionLog,
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
        nextElection, prevApproval,
        lastParliamentary, lastPresidential, scheduledElections,
        president, administration,
        caucusFactions,
        pillarStates, autocracyTracker,
        voterBlocs, playerBlocApprovals,
        caucusFactions, currentEndorsement,
        pillarStates, autocracyTracker, autocracyActionLog,
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

    // ── Build politics tab content based on government type ──
    let politicsTabContent;
    if (isAutoNation) {
        politicsTabContent = renderAutocracyPoliticsContent(f, nation, {
            totalSeats, mySeats, voteSharePct, lastElectionDate,
            currentTick, allParties, coalition, activeCrises,
            logoSvg, roleCls, roleLabel, leaderName, leaderAge, leaderIdeo,
            officerNames, ideo1, ideo2, deltaHtml, ideoTag,
            pillarStates, autocracyTracker, autocracyActionLog,
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
        ${renderCaucusSection(caucusFactions, mySeats)}
        </div>
        ${renderParliamentBox(allParties, coalition, nation, f.id)}
        ${renderForecastBox(allParties, totalSeats, currentTick, nextElection, null, f.id)}
        </div>

        <div class="pol-row-2">
        ${renderNationalMoodBox(nation, activeCrises, currentTick)}
        <div class="pol-ideology-box" id="stance-summary-container">
            <div class="pol-ideo-header"><span class="pol-mod-title">Stances</span></div>
            <div id="stance-summary-strip"></div>
        </div>
        ${renderEditIdentityBox(f, currentTick)}
        </div>

        <div class="pol-row-3">
        ${renderElectionResultsBox(lastParliamentary, lastPresidential, allParties, { scheduledElections, currentTick, nation, mySeats, faction, currentEndorsement })}
        ${renderBlocVotingBox(lastParliamentary, lastPresidential, allParties)}
        </div>
        <div class="pol-row-4" style="margin-top:24px;text-align:center">
            <button class="pol-disband-btn" id="pol-disband-party-btn" style="background:transparent;color:#d9534f;border:1px solid #d9534f;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:0.75rem;opacity:0.6;transition:opacity 0.2s" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">Disband Party</button>
            <div style="font-size:0.65rem;color:var(--dtext-3);margin-top:4px">Permanently disband your party and leave the game.</div>
        </div>
    </div>`;
    }

    const electorateTabBtn = isAutoNation ? '' : '<button class="pol-page-tab" data-page-tab="electorate-spread">Electorate</button>';
    const electorateContent = isAutoNation ? '' : `
    <div class="pol-page-content" data-page-content="electorate-spread">
        <div id="electorate-spread-container" class="es-page" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading electorate data...</div>
        </div>
    </div>`;

    const otherPartiesTabBtn = isAutoNation ? '' : '<button class="pol-page-tab" data-page-tab="other-parties">Other Parties</button>';
    const otherPartiesContent = isAutoNation ? '' : `
    <div class="pol-page-content" data-page-content="other-parties">
        <div id="other-parties-container" class="op-page" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading rival parties...</div>
        </div>
    </div>`;

    const votersTabBtn = isAutoNation ? '' : '<button class="pol-page-tab" data-page-tab="voters">Voters</button>';
    const votersContent = isAutoNation ? '' : `
    <div class="pol-page-content" data-page-content="voters">
        <div id="voters-container" class="vc-page" style="min-height:300px;">
            <div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;">Loading vote composition...</div>
        </div>
    </div>`;

    const html = `
    <div class="pol-page-tabs">
        <button class="pol-page-tab active" data-page-tab="politics">Politics</button>
        ${electorateTabBtn}
        ${otherPartiesTabBtn}
        ${votersTabBtn}
    </div>
    <div class="pol-grid-wrapper">
        <div class="pol-grid-main">
            <div class="pol-page-content active" data-page-content="politics">
            ${politicsTabContent}
            </div>
            ${electorateContent}
            ${otherPartiesContent}
            ${votersContent}
        </div>
        <div class="pol-activity-feed">
            <div class="pol-feed-header">Activity Feed</div>
            <div class="pol-feed-scroll" id="pol-feed-scroll">
                <div class="pol-feed-empty">Loading activity...</div>
            </div>
        </div>
    </div>`;

    document.getElementById('content-area').innerHTML = html;

    // Load and render Activity Feed
    _loadActivityFeed(faction.id, nation.id);

    // Wire up page-level sub-tabs (Politics / Actions / Electorate / Other Parties / Voters)
    let otherPartiesLoaded = false;
    let electorateSpreadLoaded = false;
    let votersLoaded = false;
    document.querySelectorAll('.pol-page-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.pol-page-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.pol-page-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-page-tab');
            const content = document.querySelector(`.pol-page-content[data-page-content="${target}"]`);
            if (content) content.classList.add('active');
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
            // Lazy-load Voters tab on first click
            if (target === 'voters' && !votersLoaded) {
                votersLoaded = true;
                renderVotersTab(f, nation, allParties, allPartyIdeologies, currentTick, voteSharePct, totalSeats, mySeats);
            }
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
    }
    // Load stance summary into the stance container
    if (!isAutoNation) {
        _renderStanceSummaryStrip(f.id, nation.id);
        // Load party events into the GovCard
        _loadGovCardPartyEvents(nation.id, f.id);
    }

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

// KNOWN ISSUE: Activity Feed loads once and does not auto-update.
// No realtime subscriptions exist for any electorate tables.
// Other players' actions won't appear until page reload.
// TODO: Add Supabase realtime channel on activity_log for live updates.
async function _loadActivityFeed(factionId, nationId) {
    const scrollEl = document.getElementById('pol-feed-scroll');
    if (!scrollEl) return;

    // Fetch last 50 activity_log entries for this nation, ordered newest-first
    const { data: entries, error } = await _supabase
        .from('activity_log')
        .select('id, faction_id, action_type, action_label, description, outcome, ap_spent, tick, created_at')
        .eq('nation_id', nationId)
        .order('tick', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

    if (error || !entries || entries.length === 0) {
        scrollEl.innerHTML = '<div class="pol-feed-empty">No activity yet.</div>';
        return;
    }

    // Need faction names for labelling entries from other parties
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
        // Tick separator
        if (entry.tick !== lastTick) {
            lastTick = entry.tick;
            html += `<div style="padding:6px 16px 2px;font-family:var(--dfont-mono);font-size:10px;font-weight:600;color:var(--dtext-3);letter-spacing:0.06em;text-transform:uppercase;border-top:1px solid var(--dborder-0);margin-top:4px;">${_feedTickLabel(entry.tick)}</div>`;
        }

        const faction = factionMap[entry.faction_id];
        const isPlayer = entry.faction_id === factionId;
        const factionLabel = isPlayer ? 'You' : (faction?.abbreviation || faction?.faction_name || '???');
        const factionColor = faction?.party_color || 'var(--dtext-2)';

        const typeClass = `pol-feed-item-type--${entry.action_type}`;
        const outcomeClass = entry.outcome ? `pol-feed-item-outcome--${entry.outcome}` : '';

        html += `
        <div class="pol-feed-item">
            <div class="pol-feed-item-header">
                <span class="pol-feed-item-type ${typeClass}">${escapeHtml((entry.action_label || entry.action_type).replace(/_/g, ' '))}</span>
                <span style="font-family:var(--dfont-mono);font-size:10px;color:${factionColor};font-weight:600;">${factionLabel}</span>
                ${entry.ap_spent ? `<span style="font-family:var(--dfont-mono);font-size:9px;color:var(--dtext-3);">${entry.ap_spent} AP</span>` : ''}
            </div>
            ${entry.description ? `<div class="pol-feed-item-desc">${escapeHtml(entry.description)}</div>` : ''}
            ${entry.outcome ? `<span class="pol-feed-item-outcome ${outcomeClass}">${escapeHtml(entry.outcome)}</span>` : ''}
        </div>`;
    }

    scrollEl.innerHTML = html;
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

// ═══════════════════════════════════════════════════════════
// COMBINED REGIME CARD — Regime info + Support estimate
// ═══════════════════════════════════════════════════════════
function getRegimeSupportLabel(value) {
    if (value <= 20) return { label: 'Regime', color: '#5cb85c' };
    if (value <= 40) return { label: 'Regime', color: '#5b9bd5' };
    if (value <= 60) return { label: 'Contested', color: '#c8a64e' };
    if (value <= 80) return { label: 'Opposition', color: '#d48a3c' };
    return { label: 'Opposition', color: '#d9534f' };
}

function renderCombinedRegimeCard(hosTitle, hosName, hosAge, rulingId, allParties, isStrongman, trackerColor, trackerWord, autocracyTracker, currentTick) {
    const pubValue = autocracyTracker?.public_tracker_value ?? 30;
    const lastTick = autocracyTracker?.public_tracker_last_tick;
    const { label, color } = getRegimeSupportLabel(pubValue);
    const lastUpdated = lastTick != null ? tickToDate(lastTick) : '—';
    const regimePct = 100 - pubValue;
    const oppositionPct = pubValue;

    return `
    <div class="pol-party-card" style="border-left:3px solid var(--damber);width:380px;height:450px;min-width:300px;display:flex;flex-direction:column">
        <!-- Regime Info -->
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--damber);margin-bottom:8px;font-weight:700">AUTOCRACY — ${escapeHtml(hosTitle)}</div>
        <div style="font-size:14px;color:var(--dtext-1);font-weight:700">${escapeHtml(hosName)} <span style="font-size:11px;color:var(--dtext-3)">(${hosAge})</span></div>
        <div style="font-size:10px;color:var(--dtext-3);margin-top:4px">Ruling faction: ${escapeHtml((allParties || []).find(p => p.id === rulingId)?.faction_name || 'None')}</div>
        ${isStrongman ? `<div style="margin-top:10px;padding:6px 10px;background:${trackerColor}11;border:1px solid ${trackerColor}33;border-radius:2px;text-align:center">
            <div style="font-size:9px;color:var(--dtext-3);text-transform:uppercase;letter-spacing:1px">Regime Stability</div>
            <div style="font-size:16px;color:${trackerColor};font-weight:800;font-family:var(--dfont-mono);letter-spacing:2px;margin-top:2px">${trackerWord}</div>
        </div>` : ''}

        <!-- Divider -->
        <hr style="border:none;border-top:1px solid var(--dborder-0);margin:14px 0">

        <!-- Regime Support Estimate -->
        <div style="flex:1">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <div style="font-size:11px;font-weight:700;color:var(--dtext-0);text-transform:uppercase;letter-spacing:1px">Regime Support</div>
                <div style="font-size:10px;color:var(--dtext-3)">Estimate</div>
            </div>
            <div style="font-size:10px;color:var(--dtext-3);margin-bottom:10px;font-style:italic">Public perception of regime strength.</div>

            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <div style="font-size:20px;font-weight:800;color:${color};font-family:var(--dfont-mono)">${pubValue}+</div>
                <div style="font-size:13px;font-weight:700;color:${color};text-transform:uppercase">${label}</div>
            </div>

            <div style="display:flex;height:10px;border-radius:3px;overflow:hidden;background:var(--dbg-3);margin-bottom:8px">
                <div style="width:${regimePct}%;background:#5cb85c;opacity:0.7;transition:width 0.5s"></div>
                <div style="width:${oppositionPct}%;background:#d9534f;opacity:0.7;transition:width 0.5s"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--dtext-3);margin-bottom:10px">
                <span>Regime</span>
                <span>Opposition</span>
            </div>

            <div style="font-size:10px;color:var(--dtext-3)">Last Updated: <span style="color:var(--dtext-1)">${lastUpdated}</span></div>
        </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// AUTOCRACY EVENTS — recent action feed (mode hidden)
// ═══════════════════════════════════════════════════════════
const ACTION_DISPLAY_NAMES = {
    deploy: 'Deploy', stand_down: 'Stand Down', military_exercises: 'Military Exercises',
    rally: 'Rally', agitate: 'Agitate', party_congress: 'Party Congress',
    patronage: 'Patronage', capital_flight: 'Capital Flight', bribe: 'Bribe',
    surveillance: 'Surveillance', blackmail: 'Blackmail', disappear: 'Disappear',
    broadcast: 'Broadcast', smear: 'Smear', blackout: 'Blackout',
    arrest_leader: 'Arrest Leader', execute_leader: 'Execute Leader', release_leader: 'Release Leader',
    favor: 'Favor', coup_attempt: 'Coup Attempt', declare_putsch: 'Declare Putsch',
    emergency_decree: 'Emergency Decree', appeal_security: 'Appeal to Security',
    putsch_do_nothing: 'Do Nothing', security_putsch_response: 'Security Response',
    silent_coup: 'Silent Coup', silent_coup_vote: 'Silent Coup Vote',
    appoint_successor: 'Appoint Successor', revoke_successor: 'Revoke Successor',
    claim_wildcard: 'Claim Wildcard', select_pillar: 'Select Pillar',
};

const LEADER_TARGET_ACTIONS = new Set(['arrest_leader', 'execute_leader', 'release_leader']);

function renderAutocracyEventsBox(actionLog, allParties, pillarStates, currentTick) {
    let eventsHtml = '';
    if (actionLog.length === 0) {
        eventsHtml = '<div style="padding:12px 0;text-align:center;color:var(--dtext-3);font-size:11px">No recent events.</div>';
    } else {
        for (const entry of actionLog) {
            const faction = (allParties || []).find(p => p.id === entry.faction_id);
            const fName = faction?.faction_name || 'Unknown';
            const fColor = faction?.party_color || '#888';
            // Strip _buff/_debuff suffixes and look up display name from base action
            const baseActionType = entry.action_type.replace(/_(buff|debuff)$/, '');
            const actionName = ACTION_DISPLAY_NAMES[entry.action_type] || ACTION_DISPLAY_NAMES[baseActionType] || baseActionType;
            const date = tickToDate(entry.tick);

            // For arrest/execute/release, show the target leader and faction
            let targetInfo = '';
            if (LEADER_TARGET_ACTIONS.has(entry.action_type) && entry.details?.targetFactionId) {
                const targetParty = (allParties || []).find(p => p.id === entry.details.targetFactionId);
                // Prefer logged name (survives execution), then current party leader, then pillar state
                const targetLeaderName = entry.details.target_leader_name
                    || (targetParty?.leader_first_name && targetParty?.leader_last_name
                        ? `${targetParty.leader_first_name} ${targetParty.leader_last_name}` : null)
                    || pillarStates.find(ps => ps.faction_id === entry.details.targetFactionId)?.leader_name
                    || 'Unknown';
                const targetFactionName = entry.details.target_faction_name || targetParty?.faction_name || 'Unknown';
                targetInfo = `<div style="font-size:10px;color:var(--dtext-2);margin-top:1px">${escapeHtml(targetLeaderName)} of ${escapeHtml(targetFactionName)}</div>`;
            }

            eventsHtml += `
            <div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid var(--dborder-0)">
                <div style="width:6px;height:6px;border-radius:50%;background:${fColor};margin-top:4px;flex-shrink:0"></div>
                <div style="flex:1;min-width:0">
                    <div style="font-size:11px;color:var(--dtext-1)"><span style="font-weight:600">${escapeHtml(fName)}</span> used <span style="color:var(--damber);font-weight:600">${escapeHtml(actionName)}</span></div>
                    ${targetInfo}
                    <div style="font-size:9px;color:var(--dtext-3)">${date}</div>
                </div>
            </div>`;
        }
    }

    return `
    <div class="pol-party-card" style="width:380px;height:450px;min-width:300px;display:flex;flex-direction:column">
        <div style="font-size:11px;font-weight:700;color:var(--dtext-0);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Autocracy Events</div>
        <div style="flex:1;overflow-y:auto">
            ${eventsHtml}
        </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// AUTOCRACY POLITICS TAB — Regime display for autocracy players
// ═══════════════════════════════════════════════════════════
function renderAutocracyPoliticsContent(f, nation, opts) {
    const n = nation;
    const {
        totalSeats, mySeats, currentTick, allParties, coalition, activeCrises,
        logoSvg, roleCls, roleLabel, leaderName, leaderAge, leaderIdeo,
        officerNames, ideoTag, ideo1, ideo2, deltaHtml, voteSharePct, lastElectionDate,
        pillarStates, autocracyTracker, autocracyActionLog,
    } = opts;

    const rulingId = n.ruling_faction_id;
    const isStrongman = f.id === rulingId;

    const hosName = `${n.head_of_state_first_name || '?'} ${n.head_of_state_last_name || '?'}`;
    const hosAge = n.head_of_state_age || '?';
    const hosTitle = n.head_of_state_title || 'Strongman';

    // ── Tracker word (Strongman only) ──
    const trackerValue = autocracyTracker?.tracker_value ?? 30;
    const trackerWord = getTrackerWordLabel(trackerValue);
    const trackerColor = trackerWord === 'IRON' ? '#5cb85c' : trackerWord === 'FIRM' ? '#5b9bd5' :
        trackerWord === 'RESTLESS' ? '#c8a64e' : trackerWord === 'VOLATILE' ? '#d48a3c' : '#d9534f';

    // ── Five Pillars display ──
    const PILLAR_LABELS = { military: 'Military', party: 'Party', oligarchs: 'Oligarchs', media: 'Media', security: 'Security' };
    const PILLAR_COLORS = { military: '#5b9bd5', party: '#c8a64e', oligarchs: '#5cb85c', media: '#d48a3c', security: '#d9534f' };
    const wildcardPillar = autocracyTracker?.wildcard_pillar;
    const wildcardBacking = autocracyTracker?.wildcard_backing ?? 0;

    // My faction's pillar state
    const myFps = pillarStates.find(ps => ps.faction_id === f.id);
    const myPillar = myFps?.pillar || '?';

    // Build pillar bars for all 5 pillars
    let pillarBarsHtml = '';
    const allPillars = ['military', 'party', 'oligarchs', 'media', 'security'];
    for (const pillar of allPillars) {
        const isWildcard = pillar === wildcardPillar;
        const fps = pillarStates.find(ps => ps.pillar === pillar);
        const backing = isWildcard ? wildcardBacking : (fps ? Number(fps.backing) : 0);
        const pct = Math.round((backing / 20) * 100);
        const color = PILLAR_COLORS[pillar];
        const label = PILLAR_LABELS[pillar];
        const isMine = fps?.faction_id === f.id;
        const factionName = fps ? (allParties || []).find(p => p.id === fps.faction_id)?.faction_name : null;
        const ownerLabel = isWildcard ? 'WILDCARD' : (factionName ? escapeHtml(factionName) : '—');
        const highlight = isMine ? `border-left:2px solid ${color};` : '';

        pillarBarsHtml += `
        <div style="display:flex;align-items:center;gap:8px;padding:4px 6px;${highlight}">
            <div style="width:70px;font-size:10px;color:${color};font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${label}</div>
            <div style="flex:1;height:14px;background:var(--dbg-3);border-radius:2px;position:relative;overflow:hidden">
                <div style="width:${pct}%;height:100%;background:${color};opacity:${isWildcard ? 0.4 : 0.7};border-radius:2px;transition:width 0.3s"></div>
            </div>
            <div style="width:30px;text-align:right;font-size:11px;color:var(--dtext-1);font-family:var(--dfont-mono)">${backing.toFixed(1)}</div>
            <div style="width:80px;font-size:9px;color:${isWildcard ? '#d9534f' : 'var(--dtext-3)'};text-align:right;font-style:${isWildcard ? 'italic' : 'normal'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ownerLabel}</div>
        </div>`;
    }

    // ── Faction cards ──
    let factionCardsHtml = '';
    for (const fps of pillarStates) {
        const party = (allParties || []).find(p => p.id === fps.faction_id);
        const pName = party?.faction_name || 'Unknown';
        const pColor = party?.party_color || '#888';
        const pillar = fps.pillar;
        const pLabel = PILLAR_LABELS[pillar] || pillar;
        const pColorPillar = PILLAR_COLORS[pillar] || '#888';
        const backing = Number(fps.backing).toFixed(1);
        const lName = (party?.leader_first_name && party?.leader_last_name)
            ? `${party.leader_first_name} ${party.leader_last_name}`
            : (fps.leader_name || '—');
        const lAge = fps.leader_age || '?';
        const isMe = fps.faction_id === f.id;
        const isSM = fps.is_strongman;
        const ministerCount = fps.minister_count || 0;
        const isPM = fps.is_prime_minister;

        factionCardsHtml += `
        <div style="background:var(--dbg-2);border:1px solid ${isMe ? pColorPillar + '44' : 'var(--dborder-0)'};border-radius:3px;padding:10px 12px;${isMe ? 'border-left:3px solid ' + pColorPillar + ';' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="display:flex;align-items:center;gap:6px">
                    <div style="width:8px;height:8px;border-radius:50%;background:${pColor}"></div>
                    <span style="font-size:12px;color:var(--dtext-0);font-weight:600">${escapeHtml(pName)}</span>
                    ${isSM ? '<span style="font-size:9px;background:#d9534f22;color:#d9534f;padding:1px 5px;border-radius:2px;font-weight:700">STRONGMAN</span>' : ''}
                    ${isPM ? '<span style="font-size:9px;background:#5b9bd522;color:#5b9bd5;padding:1px 5px;border-radius:2px;font-weight:700">PM</span>' : ''}
                </div>
                <span style="font-size:10px;color:${pColorPillar};font-weight:600;text-transform:uppercase">${pLabel}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:6px;font-size:11px">
                <div><span style="color:var(--dtext-3)">Backing</span> <span style="color:var(--dtext-1);font-weight:600;font-family:var(--dfont-mono)">${backing}</span></div>
                <div><span style="color:var(--dtext-3)">Leader</span> <span style="color:var(--dtext-1)">${escapeHtml(lName)}</span> <span style="color:var(--dtext-3)">(${lAge})</span>${fps.arrested_leader ? ' <span style="color:#d9534f;font-weight:700">[ARRESTED]</span>' : ''}</div>
                ${ministerCount > 0 ? `<div><span style="color:var(--dtext-3)">Ministers</span> <span style="color:var(--dtext-1)">${ministerCount}</span></div>` : ''}
            </div>
            ${fps.arrested_leader ? '<div style="font-size:9px;color:#d9534f;margin-top:4px;font-weight:600">LEADER ARRESTED</div>' : ''}
        </div>`;
    }
    if (pillarStates.length === 0) {
        factionCardsHtml = '<div style="padding:16px;text-align:center;color:var(--dtext-3);font-size:12px">No factions have claimed pillars yet.</div>';
    }

    // ── Revolution warning ──
    let revolutionBanner = '';
    if (n.revolution_started_tick != null) {
        const elapsed = currentTick - n.revolution_started_tick;
        const remaining = (n.revolution_duration || 0) - elapsed;
        revolutionBanner = `
        <div style="background:#d9534f11;border:1px solid #d9534f33;border-radius:3px;padding:12px 16px;margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;color:#d9534f;text-transform:uppercase;letter-spacing:1px">DEMOCRATIC REVOLUTION IN PROGRESS</div>
            <div style="font-size:12px;color:var(--dtext-1);margin-top:4px">${remaining > 0 ? remaining + ' tick' + (remaining !== 1 ? 's' : '') + ' until the regime falls' : 'Revolution imminent'}</div>
            <div style="font-size:10px;color:var(--dtext-3);margin-top:2px">Per tick: stability -1, civil unrest +1, international reputation -1</div>
        </div>`;
    }

    return `
    <div class="pol-page">
        <div class="pol-section-label">Politics</div>
        ${revolutionBanner}
        <div class="pol-columns">

        <!-- Left Column: Combined Regime Card + Regime Support -->
        ${renderCombinedRegimeCard(hosTitle, hosName, hosAge, rulingId, allParties, isStrongman, trackerColor, trackerWord, autocracyTracker, currentTick)}

        <!-- Your Party Card -->
        <div class="pol-party-card" style="width:380px;height:450px;min-width:300px">
            <div class="pol-header">
                <div class="pol-logo">${logoSvg}</div>
                <div class="pol-header-info">
                    <div class="pol-party-name">${escapeHtml(f.faction_name)}</div>
                    <div class="pol-meta-row">
                        <span class="pol-role-badge ${roleCls}">${escapeHtml(roleLabel.toUpperCase())}</span>
                        <span style="font-size:10px;color:${PILLAR_COLORS[myPillar] || 'var(--dtext-3)'};font-weight:600;text-transform:uppercase">${escapeHtml(PILLAR_LABELS[myPillar] || myPillar)} Pillar</span>
                    </div>
                </div>
            </div>
            <div class="pol-ideo-row">${ideoTag(ideo1)}${ideoTag(ideo2)}</div>
            <hr class="pol-divider">
            <div class="pol-leader-section">
                <span class="pol-sub-label">Leader</span>
                <div class="pol-leader-name">${escapeHtml(leaderName)} <span class="pol-leader-age">${leaderAge}</span></div>
                ${leaderIdeo}
            </div>
            <div class="pol-stats-row">
                <div class="pol-stat"><div class="pol-stat-val">${mySeats}<span class="pol-stat-of">/${totalSeats}</span></div><div class="pol-stat-label">Seats ${deltaHtml}</div></div>
                <div class="pol-stat"><div class="pol-stat-val">${voteSharePct}%</div><div class="pol-stat-label">Vote Share</div></div>
                ${myFps ? `<div class="pol-stat"><div class="pol-stat-val" style="color:${PILLAR_COLORS[myPillar]}">${Number(myFps.backing).toFixed(1)}</div><div class="pol-stat-label">Backing</div></div>` : ''}
            </div>
        </div>

        <!-- Autocracy Events -->
        ${renderAutocracyEventsBox(autocracyActionLog, allParties, pillarStates, currentTick)}

        <!-- Five Pillars -->
        <div class="pol-party-card" style="width:380px;height:450px;min-width:300px;display:flex;flex-direction:column">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <div style="font-size:11px;font-weight:700;color:var(--dtext-0);text-transform:uppercase;letter-spacing:1px">Five Pillars of Power</div>
                <div style="font-size:10px;color:var(--dtext-3)">Scale: 0–20</div>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
                ${pillarBarsHtml}
            </div>
        </div>

        </div>

        <!-- Faction Cards -->
        <div style="margin-top:16px">
            <div style="font-size:11px;font-weight:700;color:var(--dtext-0);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Factions</div>
            <div style="display:flex;flex-direction:column;gap:6px">
                ${factionCardsHtml}
            </div>
        </div>

        <div class="pol-row-4" style="margin-top:24px;text-align:center">
            <button class="pol-disband-btn" id="pol-disband-party-btn" style="background:transparent;color:#d9534f;border:1px solid #d9534f;padding:8px 20px;border-radius:4px;cursor:pointer;font-size:0.75rem;opacity:0.6;transition:opacity 0.2s" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">Disband Party</button>
            <div style="font-size:0.65rem;color:var(--dtext-3);margin-top:4px">Permanently disband your party and leave the game.</div>
        </div>

    </div>`;
}

/**
 * Map tracker value to word label.
 */
function getTrackerWordLabel(trackerValue) {
    if (trackerValue <= 20) return 'IRON';
    if (trackerValue <= 40) return 'FIRM';
    if (trackerValue <= 60) return 'RESTLESS';
    if (trackerValue <= 80) return 'VOLATILE';
    return 'CRITICAL';
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
    if (g === 'autocracy' || g.includes('dictator') || g.includes('authorit')) return 'Strongman';
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

// Ideology box removed — replaced by stance summary container in pol-row-2

function renderForecastBox(allParties, totalSeats, currentTick, nextElection, blocApprovals, playerFactionId) {
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

    // Build party forecast data (exclude inactive parties — they won't participate in the election)
    // A party is eligible if it has been seen within INACTIVITY_EXCLUSION ticks, or if
    // last_seen_tick is null AND it still has a non-zero vote share (prevents ghost parties).
    const eligibleParties = (allParties || []).filter(p => {
        const voteShare = Number(p.national_vote_share || 0);
        if (voteShare <= 0) return false; // zeroed by Three-Pillar — definitely inactive
        if (p.last_seen_tick == null) return true; // new/unseen party with vote share — include
        return (currentTick - p.last_seen_tick) < INACTIVITY_EXCLUSION;
    });
    const parties = eligibleParties.map(p => {
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
        const color = p.party_color || '#888';
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
        <div style="font-family:var(--dfont-ui);font-size:16px;font-weight:700;color:var(--dtext-0);margin-bottom:8px">${escapeHtml(adminName)}</div>
        <div style="display:flex;gap:6px;margin-bottom:16px">
            <span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:3px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${escapeHtml(govTypeLabel)}</span>
            ${coalitionBadge ? `<span style="font-family:var(--dfont-mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;padding:3px 8px;border-radius:3px;border:1px solid var(--dborder-1);color:var(--dtext-0);background:var(--dbg-4)">${escapeHtml(coalitionBadge)}</span>` : ''}
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
            const svg = getPartyIconSVG(item.key, 16, item.key === icon ? color : '#888');
            iconsHtml += `<div class="pol-id-icon-tile${sel}" data-icon="${item.key}" title="${escapeHtml(item.label)}" style="color:${item.key === icon ? color : '#888'}">${svg}</div>`;
        }
        iconsHtml += '</div>';
    }

    // Rename / abbreviation section (shared cooldown)
    const apColor = ap >= RENAME_AP_COST ? 'var(--dgreen)' : 'var(--dred)';
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
        abbrHtml = `
            <button class="pol-id-rename-btn" id="pol-id-abbr-btn">
                <span>Change Abbreviation</span>
                <span class="pol-id-rename-cost">${RENAME_AP_COST} AP · ${RENAME_COOLDOWN}t cooldown</span>
            </button>
            <div class="pol-id-rename-form" id="pol-id-abbr-form" style="display:none">
                <div class="pol-id-rename-row">
                    <input class="pol-id-rename-input" id="pol-id-abbr-input" placeholder="2–4 letters" maxlength="4" style="text-transform:uppercase;font-family:var(--dfont-mono);font-weight:700;letter-spacing:0.1em;width:80px">
                    <button class="pol-id-rename-confirm" id="pol-id-abbr-confirm">Confirm</button>
                    <button class="pol-id-rename-cancel" id="pol-id-abbr-cancel">✕</button>
                </div>
                <div class="pol-id-rename-meta">
                    <span>Costs <span style="color:var(--damber)">${RENAME_AP_COST} AP</span> · locks rename for <span style="color:var(--damber)">${RENAME_COOLDOWN} ticks</span></span>
                    <span id="pol-id-abbr-ap-available" style="color:${apColor}">${ap} AP available</span>
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
    const abbrApAvail  = document.getElementById('pol-id-abbr-ap-available');
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
            // Deduct AP via RPC
            const result = await deductAP(_supabase, f.id, RENAME_AP_COST);
            if (!result.success) {
                abbrError.textContent = '⚠ ' + (result.error || 'Insufficient AP');
                abbrError.style.display = '';
                abbrConfirm.disabled = false;
                return;
            }
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
            apDisplay.textContent = result.newAp;
            apDisplay.style.color = result.newAp >= RENAME_AP_COST ? 'var(--dgreen)' : 'var(--dred)';
            if (abbrApAvail) {
                abbrApAvail.textContent = result.newAp + ' AP available';
                abbrApAvail.style.color = result.newAp >= RENAME_AP_COST ? 'var(--dgreen)' : 'var(--dred)';
            }
            if (apAvailable) {
                apAvailable.textContent = result.newAp + ' AP available';
                apAvailable.style.color = result.newAp >= RENAME_AP_COST ? 'var(--dgreen)' : 'var(--dred)';
            }
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

function renderElectionResultsBox(lastParliamentary, lastPresidential, allParties, { scheduledElections, currentTick, nation, mySeats, faction, currentEndorsement } = {}) {
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
        const currentEndorsedId = currentEndorsement?.endorsed_faction_id || null;
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
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div class="pol-section-label" style="margin-bottom:0">ELECTION RESULTS</div>
            ${endorseButtonHtml}
        </div>
        ${endorsePanelHtml}
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

        // Candidate selection
        endorsePanel.querySelectorAll('.pol-endorse-candidate').forEach(el => {
            el.addEventListener('click', async () => {
                const targetFactionId = el.getAttribute('data-faction-id');
                const factionId = box.getAttribute('data-faction-id');
                const nationId = box.getAttribute('data-nation-id');
                const currentTick = Number(box.getAttribute('data-current-tick') || 0);
                const partyName = el.querySelector('.pol-endorse-candidate-name')?.textContent || 'this party';

                if (!confirm(`Endorse ${partyName}'s candidate for president? First endorsement is free; switching costs 1 AP.`)) return;

                el.style.opacity = '0.5';
                el.style.pointerEvents = 'none';
                try {
                    const result = await executeEndorsementPreference(_supabase, factionId, nationId, targetFactionId, currentTick);
                    if (!result.success) {
                        alert(result.error || 'Endorsement failed.');
                        return;
                    }
                    // Mark selected candidate
                    endorsePanel.querySelectorAll('.pol-endorse-candidate').forEach(c => c.classList.remove('selected'));
                    el.classList.add('selected');
                    const msg = result.alreadySelected ? `Already endorsing ${partyName}.` :
                        result.apCharged ? `Endorsed ${partyName}! (1 AP spent)` : `Endorsed ${partyName}!`;
                    alert(msg);
                    endorsePanel.style.display = 'none';
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
let _caAttackEvidence = null; // cached attack evidence
let _caAttackVectors = null;  // cached built vectors

// Protest action state
let _protestTab = 'minister';       // 'minister' | 'activePolicy' | 'statFailure'
let _protestTarget = null;          // selected grievance target object
let _protestState = null;           // null | 'resolving' | 'result' | 'active' | 'locked' | 'cooldown'
let _protestActiveData = null;      // active protest_log row (if any)
let _endorseableProtest = null;     // another party's resolving protest that we can endorse
let _alreadyEndorsed = false;       // whether we already endorsed the current endorseable protest
let _protestCachedMinisters = null;
let _protestCachedPolicies = null;
let _protestCachedStats = null;
let _protestLoading = false;
let _govProtestCrisis = null;       // active protest crisis for governing party PA row

// Store references for re-rendering
let _currentNation = null, _currentFaction = null, _currentShard = null, _currentAllParties = null;
let _caIsGoverning = false;
let _caTopIssueStats = null; // Stats from top 7 issues by salience (for Make Promise filtering)

const CA_ACTIONS = [
    { id: 'rally', name: 'Hold a Rally', ap: RALLY_CONFIG.AP_COST, color: '#f97316', icon: '★',
      desc: 'Random outcome — can boost or backfire. Generates headlines visible to rivals.' },
{ id: 'attack', name: 'Campaign Attack', ap: ATTACK_CONFIG.AP_COST, color: '#ef4444', icon: '✦',
      desc: 'Attack a rival\'s record. Stronger with evidence. Can backfire.' },
    { id: 'promise', name: 'Make a Promise', ap: MAKE_PROMISE_CONFIG.AP_COST, color: '#a78bfa', icon: '◆',
      desc: 'Commit to improving a stat or resolving a crisis. Immediate approval boost, but penalties if broken.' },
    { id: 'take_stance', name: 'Take a Stance', ap: STANCE_CONFIG.AP_COST, color: '#38bdf8', icon: '⚑',
      desc: 'Declare your position on an issue. Builds platform appeal. Stances decay over time — reinforce to sustain.' },
    { id: 'poll_now', name: 'Poll Now', ap: POLL_CONFIG.AP_COST, color: '#22d3ee', icon: '📊',
      desc: 'Snapshot your current electorate standing. See your pillars, vote share, and limiters frozen in time.' },
    { id: 'fund_think_tank', name: 'Fund Think Tank', ap: IDEO_SHIFT_CONFIG.THINK_TANK.AP_COST, color: '#14b8a6', icon: '🏛',
      desc: 'Drift the electorate\'s ideological mean on a chosen axis. 8 AP upfront + 1 AP/tick for 50 ticks. Drift: 1d3 (0.1–0.3).' },
    { id: 'media_campaign', name: 'Media Campaign', ap: IDEO_SHIFT_CONFIG.MEDIA_CAMPAIGN.AP_COST, color: '#8b5cf6', icon: '📡',
      desc: 'Expand or narrow electorate variance on a chosen axis. 1d5 variance shift for 5 ticks, then 1d3 visibility for 5 ticks.' },
    { id: 'grassroots_movement', name: 'Grassroots Movement', ap: IDEO_SHIFT_CONFIG.GRASSROOTS.AP_COST, color: '#10b981', icon: '🌱',
      desc: 'Slow burn ideology shift. 3 AP upfront + 1 AP/tick for 100 ticks. 1d2 drift, +1 visibility every 10t.' },
];

// State for new electorate actions
let _caTargetAxis = null;
let _caTargetDirection = null;
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
    _caAttackEvidence = null; _caAttackVectors = null;
    _protestTab = 'minister'; _protestTarget = null;
    _protestCachedMinisters = null; _protestCachedPolicies = null; _protestCachedStats = null;
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
    if (_caSelected === 'fund_think_tank') return !!_caTargetAxis && !!_caTargetDirection;
    if (_caSelected === 'media_campaign') return !!_caTargetAxis && !!_caTargetDirection;
    if (_caSelected === 'grassroots_movement') return !!_caTargetAxis && !!_caTargetDirection;
    return false;
}

function caGetCost() {
    if (_caSelected === 'protest') {
        // Dynamic cost based on use counter
        const f = _currentFaction;
        const tick = _currentShard?.current_tick || 0;
        const decayed = getDecayedUseCount(f?.protest_use_count || 0, f?.protest_last_use_tick, tick);
        return getProtestCost(decayed);
    }
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


    // Fetch faction ideology
    const { data: factionIdeo } = await _supabase
        .from('faction_ideology')
        .select('*').eq('faction_id', f.id).single();

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

    renderCampaignUI(container, f, n, ap, otherParties, factionIdeo, tick, protestCheck, protestApCost);
}

function renderCampaignUI(container, f, n, ap, otherParties, factionIdeo, tick, protestCheck, protestApCost) {
    const allActions = [...CA_ACTIONS];

    // Add protest action for opposition only
    if (!_caIsGoverning) {
        allActions.push({
            id: 'protest', name: 'Organise a Protest', ap: protestApCost || 2,
            color: '#d9534f', icon: '!',
            desc: 'Turnout is probabilistic. A fizzle hands the government a free headline. Choose your moment.',
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
            <div class="ca-item-desc" style="font-size:9px;color:#4a4840;">Reduces civil unrest buildup this tick. +1 moderate bloc approval.</div>
        </div>`;
    }

    for (const act of allActions) {
        const isSel = _caSelected === act.id;
        const isProtest = act.id === 'protest';

        // Protest row has special state-driven rendering
        if (isProtest) {
            listHtml += renderProtestActionRow(act, isSel, ap, f, tick);
            continue;
        }

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
                        f.action_points = result.newAp;
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
            if (act && ap < act.ap) return;
            if (_caSelected === id) { _caSelected = null; } else { _caSelected = id; }
            caReset();
            _caResult = null;
            renderCampaignUI(container, f, n, ap, otherParties, factionIdeo, tick, protestCheck, protestApCost);
        });
    });

    // Wire up config interactions
    wireCampaignConfig(container, f, n, ap, otherParties, factionIdeo, tick, protestCheck, protestApCost);
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
    return '';
}

// ── RALLY CONFIG ──

function renderRallyConfig() {
    return `<div class="ca-info-box">Hold a rally to energize your base. Random outcome — can boost or backfire.</div>`;
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
        html += `<div class="ca-subtitle" style="margin-top:12px">Intensity</div><div style="display:flex;gap:6px">`;
        for (const [key, cfg] of Object.entries(STANCE_CONFIG.INTENSITY)) {
            const isSel = _caStanceIntensity === key;
            html += `<div class="ca-option-chip${isSel ? ' selected' : ''}" data-stance-int-val="${key}" style="flex:1;text-align:center;padding:6px 4px;${isSel ? 'border-color:#38bdf8;color:var(--dtext-0);background:rgba(56,189,248,0.06)' : ''}">
                <div style="font-weight:600;font-size:11px">${key}</div>
                <div style="font-size:9px;color:var(--dtext-3);margin-top:2px">Str ${cfg.strength} · -${cfg.decay_rate}/t</div>
            </div>`;
        }
        html += `</div>`;
    }

    return html;
}

// ── POLL NOW CONFIG ──

function renderPollNowConfig() {
    return `<div class="ca-info-box">Take a snapshot of your current electorate standing. Your polled pillars, vote share, and limiters will be frozen so you can compare before/after future actions.</div>
    <div class="ca-info-box" style="margin-top:8px;color:var(--dtext-3);font-size:0.8em">Cooldown: ${POLL_CONFIG.COOLDOWN_WINDOW} ticks between polls.</div>`;
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
    let html = `<div class="ca-info-box">Launch a media campaign to expand or narrow electorate ideological variance on a chosen axis. Phase 1: 1d5 (0.1–0.5) variance shift/tick for ${mc.DURATION} ticks. Phase 2: 1d3 (1–3) visibility/tick for ${mc.VISIBILITY_TICKS} ticks.</div>`;
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
    let html = `<div class="ca-info-box">Launch a grassroots movement to slowly shift the electorate on a chosen axis. ${gr.AP_COST} AP upfront + ${gr.TICK_AP_COST} AP/tick for ${gr.DURATION} ticks. Drift: 1d2 (${gr.DRIFT_MIN}–${gr.DRIFT_MAX})/tick. +1 visibility every ${gr.VISIBILITY_INTERVAL} ticks.</div>`;
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

    // Load active policies from current government
    if (!_protestCachedPolicies) {
        const coalition = await fetchActiveCoalition(_supabase, nation.id);
        const coalitionIds = coalition?.party_ids || [];
        if (coalitionIds.length > 0) {
            const { data: bills } = await _supabase
                .from('bills')
                .select('id, bill_type, proposed_by, proposed_tick, bill_articles(policy_id, policies(policy_name))')
                .eq('nation_id', nation.id)
                .eq('status', 'enacted')
                .in('proposed_by', coalitionIds)
                .order('proposed_tick', { ascending: false });
            _protestCachedPolicies = (bills || []).map(b => {
                const firstArticle = b.bill_articles?.[0];
                const policyName = firstArticle?.policies?.policy_name || `Bill ${b.id.slice(0, 8)}`;
                return {
                    id: b.id,
                    name: policyName,
                    bill_type: b.bill_type,
                    enacted_tick: b.proposed_tick,
                    ministry: '',
                };
            });
        } else {
            _protestCachedPolicies = [];
        }
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
            const sixAgo = sorted[0]?.value ?? current;
            const delta = current - sixAgo;
            const failureScore = getStatFailureScore(current, sixAgo, key);
            if (failureScore > 0) {
                failingStats.push({
                    key, current, sixTicksAgo: sixAgo, delta, failureScore,
                    displayName: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                });
            }
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
            <div class="ca-item-desc" style="color:#4a4840">Historic or Nationwide Protests already underway, led by another party.</div>
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
        { id: 'activePolicy', label: 'Active Policy' },
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
    } else if (_protestTab === 'activePolicy') {
        html += renderProtestPolicyTargets();
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

function renderProtestPolicyTargets() {
    const policies = _protestCachedPolicies;
    if (!policies) return `<div class="protest-empty">Loading active policies...</div>`;
    if (policies.length === 0) return `<div class="protest-empty">No active policies enacted by the current government.</div>`;

    let html = '';
    for (const p of policies) {
        const isSel = _protestTarget?.id === p.id;
        const isLever = p.bill_type === 'lever' || p.bill_type === 'normal';
        const demandLabel = isLever
            ? `The government must commit to not reactivating ${p.name} for 8 ticks.`
            : `The government must repeal ${p.name}.`;
        const targetData = JSON.stringify({
            id: p.id,
            type: 'activePolicy',
            label: p.name,
            demandLabel,
            grievanceData: { billId: p.id, name: p.name, publicApproval: p.publicApproval || 50 },
        }).replace(/"/g, '&quot;');

        html += `<div class="protest-target${isSel ? ' selected' : ''}" data-protest-target="${targetData}">
            <div>
                <div class="protest-target__name">${escapeHtml(p.name)}</div>
                <div class="protest-target__meta">${escapeHtml(p.ministry || '')} · tick ${p.enacted_tick || '?'}</div>
            </div>
        </div>`;
    }
    return html;
}

function renderProtestStatTargets(nation, tick) {
    const stats = _protestCachedStats?.failingStats;
    if (!stats) return `<div class="protest-empty">Loading stats...</div>`;
    if (stats.length === 0) return `<div class="protest-empty">No stats are currently declining. The government appears to be performing.</div>`;

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
            const typeLabel = data.grievance_type === 'minister' ? 'Minister' : data.grievance_type === 'activePolicy' ? 'Active Policy' : 'Stat Failure';
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
            _protestCachedPolicies = _protestCachedPolicies || [];
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
        const apEl = document.getElementById('topbar-ap');
        if (apEl) apEl.innerHTML = '<span class="topbar-ap__count">' + (_currentFaction.action_points ?? 0) + ' AP</span>';
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
        const apEl = document.getElementById('topbar-ap');
        if (apEl) apEl.innerHTML = '<span class="topbar-ap__count">' + (_currentFaction.action_points ?? 0) + ' AP</span>';
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
    const sel = CA_ACTIONS.find(a => a.id === _caSelected);
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
            result = await executePollNow(_supabase, f.id, n.id, tick);
        } else if (sel.id === 'fund_think_tank') {
            result = await executeFundThinkTank(_supabase, f.id, n.id, _caTargetAxis, _caTargetDirection, tick);
        } else if (sel.id === 'media_campaign') {
            result = await executeMediaCampaign(_supabase, f.id, n.id, _caTargetAxis, _caTargetDirection, tick);
        } else if (sel.id === 'grassroots_movement') {
            result = await executeGrassrootsMovement(_supabase, f.id, n.id, _caTargetAxis, _caTargetDirection, tick);
        }
    } catch (err) {
        console.error('Campaign action error:', err);
        _showToast('Action failed: ' + err.message);
        if (btn) { btn.classList.remove('disabled'); btn.textContent = `Confirm — ${cost} AP`; }
        return;
    }

    if (!result || !result.success) {
        _showToast(result?.error || 'Action failed.');
        if (btn) { btn.classList.remove('disabled'); btn.textContent = `Confirm — ${cost} AP`; }
        return;
    }

    // Update local AP
    f.action_points = result.newAp ?? ((f.action_points ?? 0) - cost);

    // Show result
    _caResult = result;

    // Re-render
    await renderDemocracyActions(n, f, _currentShard, _currentAllParties);
    // Update topbar AP display
    const apEl = document.getElementById('topbar-ap');
    if (apEl) apEl.innerHTML = '<span class="topbar-ap__count">' + (f.action_points ?? 0) + ' AP</span>';
    // Refresh stance summary on main tab after stance actions
    if (sel.id === 'take_stance') {
        _renderStanceSummaryStrip(f.id, n.id);
        // Refresh portfolio in electorate tab if loaded
        const esContainer = document.getElementById('electorate-spread-container');
        if (esContainer) {
            esContainer.querySelector('.sp-card')?.remove();
            _renderStancePortfolio(esContainer, f, n);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// STRONGMAN ACTION PANELS
// ═══════════════════════════════════════════════════════════════════

function renderSuccessorPanel() { return ''; }
function renderPurgePanel() { return ''; }
function renderRedistributePanel() { return ''; }
// (Successor, Purge, Redistribute panels removed — Phase 0)




// ═══════════════════════════════════════════════════════════════════
// AUTOCRACY ACTIONS TAB RENDERER
// ═══════════════════════════════════════════════════════════════════
// ── Autocracy action metadata (client-side labels/descriptions) ──────────────

const AUTO_ACTION_META = {
    // Military
    deploy:              { label: 'Deploy', desc: 'Deploy forces. +Backing, moves tracker.', icon: '⚔', color: '#5b9bd5' },
    stand_down:          { label: 'Stand Down', desc: 'Stand down military. Always FOR YOURSELF.', icon: '◇', color: '#5b9bd5' },
    military_exercises:  { label: 'Military Exercises', desc: 'Display military strength. +Stability, +Backing.', icon: '★', color: '#5b9bd5' },
    // Party
    rally:               { label: 'Rally', desc: 'Rally the base. +Backing.', icon: '◎', color: '#c8a64e' },
    agitate:             { label: 'Agitate', desc: 'Stir up unrest. Regime mode at half power.', icon: '!', color: '#c8a64e' },
    party_congress:      { label: 'Party Congress', desc: 'Hold congress. Strongman may attend or refuse.', icon: '⊞', color: '#c8a64e' },
    // Oligarchs
    patronage:           { label: 'Patronage', desc: 'Patronage network. +Backing via wealth.', icon: '$', color: '#5cb85c' },
    capital_flight:      { label: 'Capital Flight', desc: 'Move capital abroad. Regime mode at half power.', icon: '→', color: '#5cb85c' },
    bribe:               { label: 'Bribe', desc: 'Bribe a faction. Visible only to recipient.', icon: '◆', color: '#5cb85c' },
    // Media
    broadcast:           { label: 'Broadcast', desc: 'Broadcast propaganda. +Backing.', icon: '◈', color: '#d48a3c' },
    smear:               { label: 'Smear', desc: 'Smear a rival faction. -Target Backing.', icon: '✗', color: '#d48a3c' },
    blackout:            { label: 'Blackout', desc: 'Media blackout. Suppresses target faction.', icon: '▬', color: '#d48a3c' },
    // Security
    surveillance:        { label: 'Surveillance', desc: 'Spy on a faction. Reveals Backing/AP/last action.', icon: '◉', color: '#d9534f' },
    blackmail:           { label: 'Blackmail', desc: 'Blackmail a faction leader. -Target Backing.', icon: '✉', color: '#d9534f' },
    disappear:           { label: 'Disappear', desc: 'Disappear a faction leader. Extreme action.', icon: '✕', color: '#d9534f' },
    // Strongman exclusives
    arrest_leader:       { label: 'Arrest Leader', desc: 'Arrest a faction leader. Leader is detained.', icon: '⛓', color: '#d9534f' },
    execute_leader:      { label: 'Execute Leader', desc: 'Execute arrested leader. Permanent removal.', icon: '☠', color: '#d9534f' },
    release_leader:      { label: 'Release Leader', desc: 'Release arrested leader. May restore stability.', icon: '↩', color: '#5b9bd5' },
    favor:               { label: 'Favor', desc: 'Grant a favor. +Target Backing, +Loyalty.', icon: '♔', color: '#c8a64e' },
    emergency_decree:    { label: 'Emergency Decree', desc: 'Issue decree. Immediate stat effects.', icon: '⚡', color: '#d48a3c' },
    appoint_successor:   { label: 'Appoint Successor', desc: 'Designate succession heir.', icon: '→', color: '#c8a64e' },
    revoke_successor:    { label: 'Revoke Successor', desc: 'Remove designated successor.', icon: '✗', color: '#d9534f' },
    // Coups
    coup_attempt:        { label: 'Coup Attempt', desc: 'Attempt a coup. High risk, high reward.', icon: '⚡', color: '#d9534f' },
    declare_putsch:      { label: 'Declare Putsch', desc: 'Declare martial law. Military-only.', icon: '⛊', color: '#5b9bd5' },
    appeal_security:     { label: 'Appeal to Security', desc: 'Strongman appeals to Security Services during putsch.', icon: '◎', color: '#d9534f' },
    security_putsch_response: { label: 'Respond to Putsch', desc: 'Security Services responds to Strongman appeal.', icon: '◉', color: '#d9534f' },
    putsch_do_nothing:   { label: 'Ignore Putsch', desc: 'Strongman chooses not to respond to putsch.', icon: '—', color: '#888' },
    silent_coup:         { label: 'Silent Coup', desc: 'Security Services power play. Multi-phase.', icon: '◉', color: '#d9534f' },
    silent_coup_vote:    { label: 'Vote on Silent Coup', desc: 'Cast your vote on the silent coup.', icon: '✓', color: '#d9534f' },
    // Wildcard / Pillar selection
    claim_wildcard:      { label: 'Claim Wildcard', desc: 'Claim wildcard pillar with new leader.', icon: '?', color: '#888' },
    select_pillar:       { label: 'Select Pillar', desc: 'Choose your pillar (one-time).', icon: '◆', color: '#d48a3c' },
};

// Actions grouped by pillar for display
const AUTO_ACTION_GROUPS = {
    military: ['deploy', 'stand_down', 'military_exercises'],
    party: ['rally', 'agitate', 'party_congress'],
    oligarchs: ['patronage', 'capital_flight', 'bribe'],
    media: ['broadcast', 'smear', 'blackout'],
    security: ['surveillance', 'blackmail', 'disappear'],
    strongman: ['arrest_leader', 'execute_leader', 'release_leader', 'favor', 'emergency_decree', 'appoint_successor', 'revoke_successor'],
    coups: ['coup_attempt', 'declare_putsch', 'appeal_security', 'security_putsch_response', 'putsch_do_nothing', 'silent_coup'],
    special: ['claim_wildcard', 'silent_coup_vote', 'select_pillar'],
};

let _autoSelectedAction = null;
let _autoActionMode = 'regime';
let _autoActionTarget = null;
let _autoNation = null;
let _autoFaction = null;
let _autoShard = null;
let _autoAllParties = [];

async function renderAutocracyActionsTab(nation, faction, shard, pillarStates, autocracyTracker, allParties) {
    const container = document.getElementById('actions-container');
    if (!container) return;

    _autoNation = nation;
    _autoFaction = faction;
    _autoShard = shard;
    _autoAllParties = allParties;

    const tick = shard?.current_tick || 0;
    const f = faction;
    const n = nation;

    // Refresh faction AP
    const { data: freshF } = await _supabase.from('factions')
        .select('action_points').eq('id', f.id).maybeSingle();
    if (freshF) f.action_points = freshF.action_points;
    const ap = f.action_points ?? 0;

    // Load my pillar state
    const myFps = pillarStates.find(ps => ps.faction_id === f.id);
    const myPillar = myFps?.pillar;
    const isStrongman = myFps?.is_strongman;

    // Determine available actions for this faction
    const availableActions = [];

    // 1. Own pillar actions
    if (myPillar && AUTO_ACTION_GROUPS[myPillar]) {
        for (const actionKey of AUTO_ACTION_GROUPS[myPillar]) {
            if (AUTOCRACY_ACTIONS[actionKey]) availableActions.push(actionKey);
        }
    }

    // 2. Strongman exclusives
    if (isStrongman) {
        for (const actionKey of AUTO_ACTION_GROUPS.strongman) {
            if (AUTOCRACY_ACTIONS[actionKey]) availableActions.push(actionKey);
        }
    }

    // 3. Coup actions (available to all non-strongman, or strongman for putsch response)
    if (!isStrongman) {
        if (AUTOCRACY_ACTIONS['coup_attempt']) availableActions.push('coup_attempt');
    }
    if (myPillar === 'military') {
        if (AUTOCRACY_ACTIONS['declare_putsch']) availableActions.push('declare_putsch');
    }
    if (myPillar === 'security') {
        if (AUTOCRACY_ACTIONS['silent_coup']) availableActions.push('silent_coup');
    }

    // 4. Silent coup vote (if there's an active vote phase and I'm not security)
    const { data: activeOffer } = await _supabase.from('silent_coup_offers')
        .select('id').eq('nation_id', n.id).eq('to_faction_id', f.id).eq('voided', false).is('accepted', null)
        .limit(1).maybeSingle();
    if (activeOffer && AUTOCRACY_ACTIONS['silent_coup_vote']) {
        availableActions.push('silent_coup_vote');
    }

    // 5. Claim wildcard (if no leader)
    const leaderExecuted = myFps && !myFps.leader_name;
    if (leaderExecuted && AUTOCRACY_ACTIONS['claim_wildcard']) {
        availableActions.push('claim_wildcard');
    }

    // Build action list HTML
    const pillarConfirmed = myFps?.pillar_confirmed;
    let listHtml = `<div style="font-size:10px;color:var(--dtext-3);margin-bottom:12px">
        AP: <span style="color:var(--dtext-0);font-weight:700;font-family:var(--dfont-mono)">${ap}</span>
        &nbsp;|&nbsp; Pillar: <span style="color:var(--dtext-0);font-weight:600">${myPillar ? myPillar.charAt(0).toUpperCase() + myPillar.slice(1) : '—'}</span>
        ${leaderExecuted ? '&nbsp;<span style="color:#d9534f;font-size:9px;font-weight:600">(NO LEADER)</span>' : ''}
        ${!leaderExecuted && !pillarConfirmed && myFps ? '&nbsp;<span style="color:#d48a3c;font-size:9px">(auto-assigned)</span>' : ''}
        ${isStrongman ? '&nbsp;|&nbsp; <span style="color:#d9534f;font-weight:700">STRONGMAN</span>' : ''}
    </div>`;

    // Leader executed banner — prompt to claim wildcard pillar
    if (leaderExecuted) {
        const wildcardPillar = autocracyTracker?.wildcard_pillar;
        const wildcardBacking = autocracyTracker?.wildcard_backing ?? 0;
        const PILLAR_LABELS = { military: 'Military', party: 'The Party', oligarchs: 'Oligarchs', media: 'Media', security: 'Security' };
        const wildcardLabel = wildcardPillar ? (PILLAR_LABELS[wildcardPillar] || wildcardPillar) : null;

        listHtml += `
        <div style="background:#d9534f11;border:1px solid #d9534f44;border-radius:4px;padding:12px;margin-bottom:12px">
            <div style="font-size:11px;font-weight:700;color:#d9534f;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">LEADER EXECUTED</div>
            <div style="font-size:11px;color:var(--dtext-2);margin-bottom:10px">Your faction leader has been eliminated. You must claim a new pillar to appoint a successor and resume operations.</div>
            ${wildcardPillar ? `
                <div style="display:flex;align-items:center;gap:10px;background:var(--dbg-3);border:1px solid var(--dborder-1);border-radius:3px;padding:10px;margin-bottom:10px">
                    <div style="flex:1">
                        <div style="font-size:10px;color:var(--dtext-3);text-transform:uppercase;letter-spacing:0.5px">Available Wildcard Pillar</div>
                        <div style="font-size:14px;color:var(--dtext-0);font-weight:700;margin-top:2px">${escapeHtml(wildcardLabel)}</div>
                        <div style="font-size:10px;color:var(--dtext-3);margin-top:2px">Backing: ${wildcardBacking}</div>
                    </div>
                    <button id="claim-wildcard-btn" style="padding:8px 16px;background:#d9534f22;border:1px solid #d9534f66;color:#d9534f;border-radius:3px;cursor:pointer;font-size:12px;font-weight:700;white-space:nowrap">Claim Pillar</button>
                </div>
            ` : `
                <div style="font-size:11px;color:var(--dtext-3);font-style:italic">No wildcard pillar is currently available to claim.</div>
            `}
            <div id="claim-wildcard-result" style="font-size:11px"></div>
        </div>`;
    }

    // Pillar selection banner (shown when pillar not yet confirmed)
    if (myFps && !pillarConfirmed && !leaderExecuted) {
        const PILLAR_INFO = {
            military: { label: 'Military', icon: '⚔', color: '#5b9bd5', desc: 'Deploy forces, military exercises, stand down' },
            party: { label: 'The Party', icon: '◎', color: '#c8a64e', desc: 'Rallies, agitation, party congress' },
            oligarchs: { label: 'Oligarchs', icon: '$', color: '#5cb85c', desc: 'Patronage, capital flight, bribery' },
            media: { label: 'Media', icon: '◈', color: '#d48a3c', desc: 'Broadcasts, smear campaigns, blackouts' },
            security: { label: 'Security', icon: '◉', color: '#d9534f', desc: 'Surveillance, blackmail, disappearances' },
        };
        // Find which pillars are already confirmed by others
        const confirmedPillars = new Set((pillarStates || [])
            .filter(fps => fps.pillar_confirmed && fps.faction_id !== f.id)
            .map(fps => fps.pillar));

        let pillarPickerHtml = `
        <div style="background:#d48a3c11;border:1px solid #d48a3c44;border-radius:4px;padding:12px;margin-bottom:12px">
            <div style="font-size:11px;font-weight:700;color:#d48a3c;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">SELECT YOUR PILLAR</div>
            <div style="font-size:11px;color:var(--dtext-2);margin-bottom:10px">Your pillar was auto-assigned. Choose the one you want. Confirmed pillars cannot be taken.</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">`;

        for (const [key, info] of Object.entries(PILLAR_INFO)) {
            const isMine = key === myPillar;
            const isLocked = confirmedPillars.has(key);
            const borderCol = isMine ? info.color : isLocked ? 'var(--dborder-0)' : info.color + '66';
            const bg = isMine ? info.color + '15' : 'transparent';
            const op = isLocked ? '0.35' : '1';
            const cursor = isLocked ? 'default' : 'pointer';
            pillarPickerHtml += `
            <div class="pillar-pick-btn" data-pillar="${key}" data-locked="${isLocked}" style="flex:1;min-width:120px;border:2px solid ${borderCol};border-radius:4px;padding:10px;text-align:center;cursor:${cursor};opacity:${op};background:${bg};transition:all 0.15s">
                <div style="font-size:16px;color:${info.color}">${info.icon}</div>
                <div style="font-size:11px;font-weight:700;color:var(--dtext-0);margin-top:2px">${info.label}</div>
                <div style="font-size:9px;color:var(--dtext-3);margin-top:2px">${info.desc}</div>
                ${isMine ? '<div style="font-size:8px;color:#d48a3c;margin-top:4px;font-weight:600">CURRENT</div>' : ''}
                ${isLocked ? '<div style="font-size:8px;color:var(--dtext-3);margin-top:4px">CLAIMED</div>' : ''}
            </div>`;
        }

        pillarPickerHtml += `</div>
            <div id="pillar-pick-result" style="margin-top:8px;font-size:11px"></div>
        </div>`;
        listHtml += pillarPickerHtml;
    }

    if (availableActions.length === 0 && (pillarConfirmed || !myFps)) {
        listHtml += '<div style="padding:20px;text-align:center;color:var(--dtext-3);font-size:12px">No actions available.</div>';
    }

    for (const actionKey of availableActions) {
        const def = AUTOCRACY_ACTIONS[actionKey];
        const meta = AUTO_ACTION_META[actionKey] || { label: actionKey, desc: '', icon: '?', color: '#888' };
        const cost = myFps ? getEscalatingCost(myFps, def) : def.baseCost;
        const cd = myFps ? checkCooldown(myFps, def, tick) : { onCooldown: false, remainingTicks: 0 };
        const canAfford = ap >= cost;
        const isSelected = _autoSelectedAction === actionKey;
        const disabled = cd.onCooldown || !canAfford;

        const borderColor = isSelected ? meta.color : disabled ? 'var(--dborder-0)' : meta.color + '44';
        const bgColor = isSelected ? meta.color + '0a' : 'transparent';
        const opacity = disabled ? '0.45' : '1';

        let costLabel = `${cost} AP`;
        if (cd.onCooldown) costLabel = `${cd.remainingTicks} CD`;

        listHtml += `
        <div class="auto-action-item" data-action="${actionKey}" data-disabled="${disabled}" style="background:${bgColor};border:1px solid ${borderColor};border-radius:3px;padding:8px 10px;margin-bottom:4px;cursor:${disabled ? 'default' : 'pointer'};opacity:${opacity};transition:all 0.15s">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-size:13px;color:${meta.color};width:18px;text-align:center">${meta.icon}</span>
                    <span style="font-size:12px;color:var(--dtext-0);font-weight:${isSelected ? '700' : '500'}">${meta.label}</span>
                    ${def.hasDualMode ? '<span style="font-size:8px;color:var(--dtext-3);background:var(--dbg-3);padding:1px 4px;border-radius:2px">DUAL</span>' : ''}
                </div>
                <span style="font-size:10px;color:${cd.onCooldown ? '#d9534f' : canAfford ? 'var(--dtext-2)' : '#d9534f'};font-family:var(--dfont-mono)">${costLabel}</span>
            </div>
            <div style="font-size:9px;color:var(--dtext-3);margin-top:2px;padding-left:24px">${meta.desc}</div>
        </div>`;
    }

    // Detail panel (right side)
    let detailHtml = '<div id="auto-action-detail" style="padding:24px;text-align:center;color:var(--dtext-3);font-size:12px">Select an action to see details.</div>';

    container.innerHTML = `
    <div class="auto-actions-wrap" style="display:flex;gap:16px;min-height:400px">
        <div id="auto-action-list" style="width:320px;min-width:0;flex-shrink:1">
            ${listHtml}
        </div>
        <div style="flex:1;min-width:0;background:var(--dbg-2);border:1px solid var(--dborder-0);border-radius:3px;padding:16px;overflow-y:auto">
            ${detailHtml}
        </div>
    </div>
    <style>.auto-actions-wrap{flex-wrap:wrap}@media(max-width:700px){.auto-actions-wrap{flex-direction:column}.auto-actions-wrap>#auto-action-list{width:100%}}</style>`;

    // Wire up click handlers
    container.querySelectorAll('.auto-action-item').forEach(el => {
        el.addEventListener('click', () => {
            if (el.getAttribute('data-disabled') === 'true') return;
            const actionKey = el.getAttribute('data-action');
            _autoSelectedAction = actionKey;
            _autoActionMode = 'regime'; // reset mode on action switch
            _autoActionTarget = null;   // reset target on action switch
            renderAutoActionDetail(actionKey, ap, tick, myFps, isStrongman, pillarStates);
            // Highlight selected
            container.querySelectorAll('.auto-action-item').forEach(e => {
                e.style.background = 'transparent';
                e.style.borderColor = 'var(--dborder-0)';
            });
            const meta = AUTO_ACTION_META[actionKey] || { color: '#888' };
            el.style.background = meta.color + '0a';
            el.style.borderColor = meta.color;
        });
    });

    // Wire up pillar picker buttons
    container.querySelectorAll('.pillar-pick-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (btn.getAttribute('data-locked') === 'true') return;
            const pillar = btn.getAttribute('data-pillar');
            const resultDiv = document.getElementById('pillar-pick-result');

            // Confirm selection
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';

            try {
                const result = await dispatchAutocracyAction(_supabase, {
                    factionId: _autoFaction.id,
                    nationId: _autoNation.id,
                    actionType: 'select_pillar',
                    mode: 'self',
                    currentTick: tick,
                    extra: { pillar },
                });

                if (result.success) {
                    if (resultDiv) resultDiv.innerHTML = `<div style="color:#5cb85c;font-weight:600">Pillar confirmed: ${escapeHtml(pillar)}</div>`;
                    // Refresh the whole tab
                    try {
                        const { data: refreshedFps } = await _supabase.from('faction_pillar_state').select('*').eq('nation_id', _autoNation.id);
                        const { data: refreshedTracker } = await _supabase.from('autocracy_tracker').select('*').eq('nation_id', _autoNation.id).maybeSingle();
                        await renderAutocracyActionsTab(_autoNation, _autoFaction, _autoShard, refreshedFps || [], refreshedTracker, _autoAllParties);
                    } catch (e) { console.warn('[PillarPick] Refresh failed:', e); }
                } else {
                    if (resultDiv) resultDiv.innerHTML = `<div style="color:#d9534f">${escapeHtml(result.error || 'Selection failed')}</div>`;
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                }
            } catch (err) {
                if (resultDiv) resultDiv.innerHTML = `<div style="color:#d9534f">${escapeHtml(err.message)}</div>`;
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            }
        });
    });

    // Wire up claim wildcard banner button
    const claimBtn = container.querySelector('#claim-wildcard-btn');
    if (claimBtn) {
        claimBtn.addEventListener('click', async () => {
            claimBtn.disabled = true;
            claimBtn.textContent = 'Claiming...';
            const resultDiv = document.getElementById('claim-wildcard-result');
            try {
                const result = await dispatchAutocracyAction(_supabase, {
                    factionId: _autoFaction.id,
                    nationId: _autoNation.id,
                    actionType: 'claim_wildcard',
                    mode: 'self',
                    currentTick: tick,
                    extra: {},
                });
                if (result.success) {
                    const effects = result.result?.effects || {};
                    if (resultDiv) resultDiv.innerHTML = `<div style="color:#5cb85c;font-weight:600">Claimed ${escapeHtml(effects.claimed_pillar || 'pillar')}. New leader: ${escapeHtml(effects.new_leader || 'Unknown')}</div>`;
                    // Refresh the tab
                    try {
                        const { data: refreshedFps } = await _supabase.from('faction_pillar_state').select('*').eq('nation_id', _autoNation.id);
                        const { data: refreshedTracker } = await _supabase.from('autocracy_tracker').select('*').eq('nation_id', _autoNation.id).maybeSingle();
                        await renderAutocracyActionsTab(_autoNation, _autoFaction, _autoShard, refreshedFps || [], refreshedTracker, _autoAllParties);
                    } catch (e) { console.warn('[ClaimWildcard] Refresh failed:', e); }
                } else {
                    if (resultDiv) resultDiv.innerHTML = `<div style="color:#d9534f">${escapeHtml(result.error || 'Claim failed')}</div>`;
                    claimBtn.disabled = false;
                    claimBtn.textContent = 'Claim Pillar';
                }
            } catch (err) {
                if (resultDiv) resultDiv.innerHTML = `<div style="color:#d9534f">${escapeHtml(err.message)}</div>`;
                claimBtn.disabled = false;
                claimBtn.textContent = 'Claim Pillar';
            }
        });
    }
}

function renderAutoActionDetail(actionKey, ap, tick, myFps, isStrongman, pillarStates) {
    const detail = document.getElementById('auto-action-detail');
    if (!detail) return;

    const def = AUTOCRACY_ACTIONS[actionKey];
    const meta = AUTO_ACTION_META[actionKey] || { label: actionKey, desc: '', icon: '?', color: '#888' };
    const cost = myFps ? getEscalatingCost(myFps, def) : def.baseCost;
    const cd = myFps ? checkCooldown(myFps, def, tick) : { onCooldown: false, remainingTicks: 0 };
    const canAfford = ap >= cost && !cd.onCooldown;

    // Mode toggle for dual-mode actions
    let modeHtml = '';
    if (def.hasDualMode) {
        modeHtml = `
        <div style="display:flex;gap:8px;margin:12px 0">
            <button class="auto-mode-btn" data-mode="regime" style="flex:1;padding:6px;border:1px solid ${_autoActionMode === 'regime' ? '#5b9bd5' : 'var(--dborder-1)'};background:${_autoActionMode === 'regime' ? '#5b9bd511' : 'transparent'};color:${_autoActionMode === 'regime' ? '#5b9bd5' : 'var(--dtext-2)'};border-radius:3px;cursor:pointer;font-size:11px;font-weight:600">FOR REGIME</button>
            <button class="auto-mode-btn" data-mode="self" style="flex:1;padding:6px;border:1px solid ${_autoActionMode === 'self' ? '#d9534f' : 'var(--dborder-1)'};background:${_autoActionMode === 'self' ? '#d9534f11' : 'transparent'};color:${_autoActionMode === 'self' ? '#d9534f' : 'var(--dtext-2)'};border-radius:3px;cursor:pointer;font-size:11px;font-weight:600">FOR YOURSELF</button>
        </div>
        <div style="font-size:9px;color:var(--dtext-3);margin-bottom:8px">
            ${_autoActionMode === 'regime' ? 'Regime mode: tracker decreases (more stable)' : 'Self mode: tracker increases (less stable)'}
            ${def.halfPowerForRegime && _autoActionMode === 'regime' ? ' — Half power in regime mode' : ''}
        </div>`;
    }

    // Target selector for actions that need a target faction
    const needsTarget = ['smear', 'blackout', 'surveillance', 'blackmail', 'disappear', 'bribe', 'arrest_leader', 'execute_leader', 'release_leader', 'favor', 'appoint_successor'].includes(actionKey);
    let targetHtml = '';
    if (needsTarget) {
        const otherFactions = pillarStates.filter(ps => ps.faction_id !== _autoFaction.id);
        let targetOptions = '';
        for (const fps of otherFactions) {
            const party = (_autoAllParties || []).find(p => p.id === fps.faction_id);
            const pName = party?.faction_name || 'Unknown';
            const sel = _autoActionTarget === fps.faction_id ? 'selected' : '';
            targetOptions += `<option value="${fps.faction_id}" ${sel}>${escapeHtml(pName)} (${escapeHtml(fps.pillar || '?')})</option>`;
        }
        targetHtml = `
        <div style="margin:8px 0">
            <label style="font-size:10px;color:var(--dtext-3);display:block;margin-bottom:4px">Target Faction</label>
            <select id="auto-target-select" style="width:100%;padding:6px;background:var(--dbg-3);border:1px solid var(--dborder-1);color:var(--dtext-1);border-radius:3px;font-size:12px">
                <option value="">— Select target —</option>
                ${targetOptions}
            </select>
        </div>`;
    }

    // Execute button
    const execDisabled = !canAfford || (needsTarget && !_autoActionTarget);
    const execLabel = cd.onCooldown ? `Cooldown (${cd.remainingTicks} ticks)` : !canAfford ? `Need ${cost} AP` : `Execute — ${cost} AP`;

    detail.innerHTML = `
    <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:20px;color:${meta.color}">${meta.icon}</span>
            <span style="font-size:16px;color:var(--dtext-0);font-weight:700">${meta.label}</span>
        </div>
        <div style="font-size:12px;color:var(--dtext-2);margin-bottom:12px">${meta.desc}</div>
        <div style="display:flex;gap:16px;font-size:10px;color:var(--dtext-3);margin-bottom:12px">
            <div>Cost: <span style="color:var(--dtext-1);font-weight:600">${cost} AP</span></div>
            <div>Pillar: <span style="color:var(--dtext-1)">${def.pillar || 'any'}</span></div>
            ${def.cooldownTicks ? `<div>Cooldown: <span style="color:var(--dtext-1)">${def.cooldownTicks} ticks</span></div>` : ''}
            ${def.escalationSteps ? `<div>Escalation: <span style="color:var(--dtext-1)">${def.escalationSteps.join(' → ')}</span></div>` : ''}
        </div>
        ${modeHtml}
        ${targetHtml}
        <button id="auto-exec-btn" style="width:100%;padding:10px;background:${execDisabled ? 'var(--dbg-3)' : meta.color + '22'};border:1px solid ${execDisabled ? 'var(--dborder-1)' : meta.color + '66'};color:${execDisabled ? 'var(--dtext-3)' : meta.color};border-radius:3px;cursor:${execDisabled ? 'not-allowed' : 'pointer'};font-size:12px;font-weight:700;margin-top:12px" ${execDisabled ? 'disabled' : ''}>
            ${execLabel}
        </button>
        <div id="auto-exec-result" style="margin-top:12px;font-size:11px"></div>
    </div>`;

    // Wire mode buttons
    detail.querySelectorAll('.auto-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            _autoActionMode = btn.getAttribute('data-mode');
            renderAutoActionDetail(actionKey, ap, tick, myFps, isStrongman, pillarStates);
        });
    });

    // Wire target select
    const targetSelect = document.getElementById('auto-target-select');
    if (targetSelect) {
        targetSelect.addEventListener('change', () => {
            _autoActionTarget = targetSelect.value || null;
            renderAutoActionDetail(actionKey, ap, tick, myFps, isStrongman, pillarStates);
        });
    }

    // Wire execute button
    const execBtn = document.getElementById('auto-exec-btn');
    if (execBtn && !execDisabled) {
        execBtn.addEventListener('click', async () => {
            execBtn.disabled = true;
            execBtn.textContent = 'Executing...';
            try {
                const extra = {};
                if (_autoActionTarget) {
                    if (actionKey === 'appoint_successor') {
                        extra.successorFactionId = _autoActionTarget;
                    } else {
                        extra.targetFactionId = _autoActionTarget;
                    }
                }

                const result = await dispatchAutocracyAction(_supabase, {
                    factionId: _autoFaction.id,
                    nationId: _autoNation.id,
                    actionType: actionKey,
                    mode: def.hasDualMode ? _autoActionMode : 'self',
                    currentTick: tick,
                    extra,
                });

                const resultDiv = document.getElementById('auto-exec-result');
                if (result.success) {
                    if (resultDiv) {
                        const effectsText = result.result ? escapeHtml(JSON.stringify(result.result.effects || result.result, null, 0)) : '';
                        resultDiv.innerHTML = `<div style="color:#5cb85c;font-weight:600">Action executed successfully.</div>
                            ${effectsText ? `<div style="color:var(--dtext-2);margin-top:4px">${effectsText}</div>` : ''}`;
                    }
                    // Refresh the tab
                    try {
                        const { data: refreshedFps } = await _supabase.from('faction_pillar_state').select('*').eq('nation_id', _autoNation.id);
                        const { data: refreshedTracker } = await _supabase.from('autocracy_tracker').select('*').eq('nation_id', _autoNation.id).single();
                        await renderAutocracyActionsTab(_autoNation, _autoFaction, _autoShard, refreshedFps || [], refreshedTracker, _autoAllParties);
                    } catch (refreshErr) {
                        console.warn('[AutoActions] Refresh after action failed:', refreshErr);
                    }
                } else {
                    if (resultDiv) resultDiv.innerHTML = `<div style="color:#d9534f;font-weight:600">${escapeHtml(result.error || 'Action failed')}</div>`;
                    execBtn.disabled = false;
                    execBtn.textContent = execLabel;
                }
            } catch (err) {
                const resultDiv = document.getElementById('auto-exec-result');
                if (resultDiv) resultDiv.innerHTML = `<div style="color:#d9534f">${escapeHtml(err.message)}</div>`;
                execBtn.disabled = false;
                execBtn.textContent = execLabel;
            }
        });
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

async function renderElectorateSpreadTab(playerFaction, nation, allParties, allPartyIdeologies, currentTick) {
    const container = document.getElementById('electorate-spread-container');
    if (!container) return;

    const { data: profile } = await _supabase
        .from('electorate_profile')
        .select('*')
        .eq('nation_id', nation.id)
        .single();

    if (!profile) {
        container.innerHTML = '<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No electorate data available.</div>';
        return;
    }

    // Build ideology lookup
    const ideoMap = {};
    for (const row of (allPartyIdeologies || [])) {
        ideoMap[row.faction_id] = row;
    }

    // Compute electorate mean and standard deviation per axis from electorate_profile
    const electorateStats = {};
    for (const ax of ES_AXES) {
        const mean = Number(profile['ideo_mean_' + ax.key] ?? 50);
        const variance = Number(profile['ideo_var_' + ax.key] ?? 20);
        electorateStats[ax.key] = { mean, stdDev: variance };
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
            const eStd = stats.stdDev;

            // Variance band: mean ± 1 stddev, clamped to 0-100
            const varLeft = Math.max(0, eMean - eStd);
            const varWidth = Math.min(100, eMean + eStd) - varLeft;

            // Electorate lean text
            let leanText;
            if (eMean < 45) {
                leanText = `Electorate leans <strong>${escapeHtml(ax.leftLabel)}</strong> — mean ${Math.round(eMean)} / 100`;
            } else if (eMean > 55) {
                leanText = `Electorate leans <strong>${escapeHtml(ax.rightLabel)}</strong> — mean ${Math.round(eMean)} / 100`;
            } else {
                leanText = `Electorate is <strong>near centrist</strong> — mean ${Math.round(eMean)} / 100`;
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

            const isLast = i === ES_AXES.length - 1;

            axesHtml += `
            <div class="es-axis-block">
                <div class="es-axis-header">
                    <div class="es-axis-info">
                        <div class="es-axis-name">${escapeHtml(ax.leftLabel)} / ${escapeHtml(ax.rightLabel)}</div>
                        <div class="es-axis-read">${leanText}</div>
                    </div>
                    <div class="es-match ${match.cls}">${match.label}</div>
                </div>
                <div class="es-spectrum">
                    <div class="es-pole-row">
                        <span class="es-pole">${escapeHtml(ax.leftLabel)}</span>
                        <span class="es-pole">${escapeHtml(ax.rightLabel)}</span>
                    </div>
                    <div class="es-track">
                        <div class="es-center"><div class="es-center-label">Center</div></div>
                        <div class="es-variance" style="left:${varLeft}%;width:${varWidth}%"></div>
                        <div class="es-emean" style="left:${eMean}%"><div class="es-emean-label">Electorate</div></div>
                        ${gapHtml}
                        ${markersHtml}
                    </div>
                </div>
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
            <div class="es-body">${axesHtml}</div>
            <div class="es-summary">
                <div class="es-sb-item">
                    <div class="es-sb-label">Ideological Alignment</div>
                    <div class="es-sb-val" style="color:${alignColor}">${avgAlignment}</div>
                </div>
                <div class="es-sb-div"></div>
                <div class="es-sb-item">
                    <div class="es-sb-label">Axes Aligned</div>
                    <div class="es-sb-val" style="color:var(--dgreen)">${alignedCount}</div>
                </div>
                <div class="es-sb-div"></div>
                <div class="es-sb-item">
                    <div class="es-sb-label">Partial</div>
                    <div class="es-sb-val" style="color:var(--damber)">${partialCount}</div>
                </div>
                <div class="es-sb-div"></div>
                <div class="es-sb-item">
                    <div class="es-sb-label">Misaligned</div>
                    <div class="es-sb-val" style="color:var(--dred)">${misalignedCount}</div>
                </div>
            </div>
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

    // ── Phase 6: Pillar Contribution + Vote Left on Table cards ──
    _renderPillarCards(container, playerFaction, nation);
}

/**
 * Phase 6: Render "How You Got X%" and "Vote Left on Table" cards below the
 * Electorate Spread visualization. Reads polled values from faction_electoral_standing.
 */
async function _renderPillarCards(container, playerFaction, nation) {
    const { data: standing } = await _supabase
        .from('faction_electoral_standing')
        .select('*')
        .eq('faction_id', playerFaction.id)
        .eq('nation_id', nation.id)
        .single();

    if (!standing) {
        container.insertAdjacentHTML('beforeend',
            '<div class="pc-empty">Electorate standing not yet computed. Advance a tick to generate data.</div>');
        return;
    }

    // Use polled values if available, fall back to live values
    const hasPolled = standing.polled_vote_share != null;
    const src = hasPolled ? 'polled' : 'live';

    const alignment    = Number((hasPolled ? standing.polled_alignment : standing.ideological_alignment) ?? 50);
    const appeal       = Number((hasPolled ? standing.polled_platform_appeal : standing.platform_appeal) ?? 50);
    const approval     = Number((hasPolled ? standing.polled_party_approval : standing.party_approval) ?? 50);
    const visibility   = Number((hasPolled ? standing.polled_visibility : standing.visibility) ?? 30);
    const credibility  = Number((hasPolled ? standing.polled_credibility : standing.credibility_modifier) ?? 1.0);
    const voteShare    = Number((hasPolled ? standing.polled_vote_share : standing.realized_vote_share) ?? 0);

    const alignContrib  = Number((hasPolled ? standing.polled_alignment_contribution : standing.alignment_contribution) ?? 0);
    const appealContrib = Number((hasPolled ? standing.polled_appeal_contribution : standing.appeal_contribution) ?? 0);
    const approvalContrib = Number((hasPolled ? standing.polled_approval_contribution : standing.approval_contribution) ?? 0);
    const voteLeft      = Number((hasPolled ? standing.polled_vote_left_on_table : standing.vote_left_on_table) ?? 0);

    const contested = Number(standing.contested_vote_share ?? 0);
    const votePct = (voteShare * 100).toFixed(1);

    // ── Pillar weights (must match electorate.js CFG) ──
    const W_ALIGN = 0.40, W_APPEAL = 0.25, W_APPROVAL = 0.35;
    const rawSum = alignment * W_ALIGN + appeal * W_APPEAL + approval * W_APPROVAL;
    const rawAppeal = rawSum * credibility;

    // Pillar contribution percentages (how much each pillar contributes to total)
    const totalContrib = alignContrib + appealContrib + approvalContrib;
    const alignPct = totalContrib > 0 ? (alignContrib / totalContrib * 100).toFixed(0) : '40';
    const appealPct = totalContrib > 0 ? (appealContrib / totalContrib * 100).toFixed(0) : '25';
    const approvalPct = totalContrib > 0 ? (approvalContrib / totalContrib * 100).toFixed(0) : '35';

    // Color scale for pillar values (0-100)
    function pillarColor(v) {
        if (v >= 65) return 'var(--dgreen)';
        if (v >= 45) return 'var(--damber)';
        return 'var(--dred)';
    }
    function credColor(c) {
        if (c >= 0.9) return 'var(--dgreen)';
        if (c >= 0.7) return 'var(--damber)';
        return 'var(--dred)';
    }

    // ── Bar helper: horizontal bar with value label ──
    function pillarBar(label, value, weight, color, contribution) {
        const barWidth = Math.max(2, value);
        return `
        <div class="pc-pillar-row">
            <div class="pc-pillar-label">${label} <span class="pc-pillar-weight">${(weight * 100).toFixed(0)}%</span></div>
            <div class="pc-pillar-bar-track">
                <div class="pc-pillar-bar-fill" style="width:${barWidth}%;background:${color}"></div>
            </div>
            <div class="pc-pillar-val" style="color:${color}">${value.toFixed(1)}</div>
        </div>`;
    }

    // ── Vote Left on Table: identify biggest limiters ──
    const limiters = [];

    // Visibility limiter: low visibility reduces turnout
    if (visibility < 50) {
        const visImpact = ((50 - visibility) * 0.002 * contested * 100);
        limiters.push({
            label: 'Low Visibility',
            detail: `Visibility at ${visibility.toFixed(0)} (below 50 baseline). Rally boosts visibility.`,
            impact: visImpact,
            color: '#f97316',
        });
    }

    // Credibility limiter: multiplies raw appeal
    if (credibility < 0.9) {
        const credImpact = ((1.0 - credibility) * rawSum / 100 * 100);
        limiters.push({
            label: 'Credibility Damage',
            detail: `Credibility at ${(credibility * 100).toFixed(0)}% — reducing your appeal by ${((1.0 - credibility) * 100).toFixed(0)}%. Recovers over time.`,
            impact: credImpact,
            color: '#ef4444',
        });
    }

    // Platform appeal limiter: low stance coverage
    if (appeal < 40) {
        limiters.push({
            label: 'Weak Platform',
            detail: `Platform appeal at ${appeal.toFixed(0)}. Take stances on salient issues to increase.`,
            impact: (50 - appeal) * W_APPEAL,
            color: '#60a5fa',
        });
    }

    // Alignment limiter: ideological mismatch
    if (alignment < 40) {
        limiters.push({
            label: 'Ideological Mismatch',
            detail: `Alignment at ${alignment.toFixed(0)}. Your party ideology doesn't match the electorate's centre.`,
            impact: (50 - alignment) * W_ALIGN,
            color: '#a78bfa',
        });
    }

    // Approval limiter
    if (approval < 40) {
        limiters.push({
            label: 'Low Approval',
            detail: `Party approval at ${approval.toFixed(0)}. Governance performance and momentum drive this.`,
            impact: (50 - approval) * W_APPROVAL,
            color: '#c8a64e',
        });
    }

    // Sort by impact descending
    limiters.sort((a, b) => b.impact - a.impact);

    const voteLeftPct = (voteLeft * 100).toFixed(2);
    const hasVoteLeft = voteLeft > 0.001;

    const limiterHtml = limiters.length === 0
        ? '<div class="pc-no-limiters">No major limiters detected. Your turnout efficiency is strong.</div>'
        : limiters.map(l => `
            <div class="pc-limiter">
                <div class="pc-limiter-header">
                    <span class="pc-limiter-dot" style="background:${l.color}"></span>
                    <span class="pc-limiter-label">${l.label}</span>
                </div>
                <div class="pc-limiter-detail">${l.detail}</div>
            </div>`).join('');

    const dataLabel = hasPolled
        ? `<span class="pc-data-src">Polled tick ${standing.last_polled_tick}</span>`
        : `<span class="pc-data-src">Live (tick ${standing.last_updated_tick})</span>`;

    const cardsHtml = `
    <div class="pc-cards-row">
        <div class="pc-card">
            <div class="pc-card-header">
                <div class="pc-card-title">How You Got ${votePct}%</div>
                ${dataLabel}
            </div>
            <div class="pc-vote-pct">${votePct}<span class="pc-vote-pct-unit">%</span></div>
            <div class="pc-pillar-section">
                ${pillarBar('Ideological Alignment', alignment, W_ALIGN, pillarColor(alignment), alignContrib)}
                ${pillarBar('Platform Appeal', appeal, W_APPEAL, pillarColor(appeal), appealContrib)}
                ${pillarBar('Party Approval', approval, W_APPROVAL, pillarColor(approval), approvalContrib)}
            </div>
            <div class="pc-divider"></div>
            <div class="pc-meta-row">
                <div class="pc-meta-item">
                    <span class="pc-meta-label">Credibility</span>
                    <span class="pc-meta-val" style="color:${credColor(credibility)}">${(credibility * 100).toFixed(0)}%</span>
                </div>
                <div class="pc-meta-item">
                    <span class="pc-meta-label">Visibility</span>
                    <span class="pc-meta-val" style="color:${visibility >= 50 ? 'var(--dgreen)' : visibility >= 30 ? 'var(--damber)' : 'var(--dred)'}">${visibility.toFixed(0)}</span>
                </div>
                <div class="pc-meta-item">
                    <span class="pc-meta-label">Raw Appeal</span>
                    <span class="pc-meta-val">${rawAppeal.toFixed(1)}</span>
                </div>
            </div>
            <div class="pc-contrib-bar">
                <div class="pc-contrib-seg" style="flex:${alignPct};background:var(--dteal);opacity:0.7" title="Alignment ${alignPct}%"></div>
                <div class="pc-contrib-seg" style="flex:${appealPct};background:#60a5fa;opacity:0.7" title="Appeal ${appealPct}%"></div>
                <div class="pc-contrib-seg" style="flex:${approvalPct};background:var(--damber);opacity:0.7" title="Approval ${approvalPct}%"></div>
            </div>
            <div class="pc-contrib-legend">
                <span style="color:var(--dteal)">Alignment ${alignPct}%</span>
                <span style="color:#60a5fa">Appeal ${appealPct}%</span>
                <span style="color:var(--damber)">Approval ${approvalPct}%</span>
            </div>
        </div>
        <div class="pc-card">
            <div class="pc-card-header">
                <div class="pc-card-title">Vote Left on Table</div>
            </div>
            ${hasVoteLeft ? `<div class="pc-vote-left">${voteLeftPct}<span class="pc-vote-left-unit">%</span></div>` : '<div class="pc-vote-left pc-vote-left--none">0<span class="pc-vote-left-unit">%</span></div>'}
            <div class="pc-vote-left-explain">${hasVoteLeft
                ? 'These voters prefer you but didn\'t turn out. Boost visibility and enthusiasm to capture them.'
                : 'Your turnout efficiency is maximized — nearly all your supporters are voting.'
            }</div>
            <div class="pc-divider"></div>
            <div class="pc-limiters-header">Biggest Limiters</div>
            ${limiterHtml}
        </div>
    </div>`;

    container.insertAdjacentHTML('beforeend', cardsHtml);

    // Also render stance portfolio in the Electorate tab
    _renderStancePortfolio(container, playerFaction, nation);
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
            const issueId = btn.dataset.stanceIssue;
            const axis = btn.dataset.stanceAxis;
            const side = btn.dataset.stanceSide;
            const intensity = btn.dataset.stanceIntensity;
            btn.disabled = true;
            btn.textContent = 'Reinforcing...';
            const result = await executeTakeStance(_supabase, faction.id, nation.id, issueId, axis, side, intensity, currentTick);
            if (result.success) {
                // Update client AP
                if (result.newAp != null) {
                    faction.action_points = result.newAp;
                    if (_currentFaction) _currentFaction.action_points = result.newAp;
                    const apEl = document.getElementById('topbar-ap');
                    if (apEl) apEl.innerHTML = '<span class="topbar-ap__count">' + result.newAp + ' AP</span>';
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
            intensityHtml = `<div class="sm-section-label" style="margin-top:14px;">Intensity</div><div class="sm-intensity-list">`;
            for (const [key, cfg] of Object.entries(STANCE_CONFIG.INTENSITY)) {
                const sel = key === selectedIntensity;
                intensityHtml += `<div class="sm-int-opt${sel ? ' sm-int-opt--selected' : ''}" data-sm-intensity="${key}">
                    <span class="sm-int-name">${key}</span>
                    <span class="sm-int-meta">Strength ${cfg.strength} · Decay ${cfg.decay_rate}/tick</span>
                </div>`;
            }
            intensityHtml += '</div>';
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
            // Update client AP
            if (result.newAp != null) {
                faction.action_points = result.newAp;
                if (_currentFaction) _currentFaction.action_points = result.newAp;
                const apEl = document.getElementById('topbar-ap');
                if (apEl) apEl.innerHTML = '<span class="topbar-ap__count">' + result.newAp + ' AP</span>';
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
   VOTERS (VOTE COMPOSITION) TAB
   ═══════════════════════════════════════════════════════════════════ */

// Three-pillar colors
const VC_IDEO_COLOR = '#7ec8c0';
const VC_PERF_COLOR = '#c8a44e';
const VC_MOM_COLOR  = '#7ec87e';

async function renderVotersTab(playerFaction, nation, allParties, allPartyIdeologies, currentTick, voteSharePct, totalSeats, mySeats) {
    const container = document.getElementById('voters-container');
    if (!container) return;

    const partyColor = playerFaction.party_color || '#9b7ec8';
    const partyAbbr = playerFaction.abbreviation || '??';

    // Fetch faction_electoral_standing for ALL parties + issue_state for Issue Landscape
    const partyIds = (allParties || []).map(p => p.id);
    const [standingsRes, issueStatesRes] = await Promise.all([
        _supabase.from('faction_electoral_standing')
            .select('faction_id, ideological_alignment, platform_appeal, party_approval, visibility, credibility_modifier, contested_vote_share, realized_vote_share, turnout_rate, alignment_contribution, appeal_contribution, approval_contribution, vote_left_on_table, raw_appeal')
            .eq('nation_id', nation.id)
            .in('faction_id', partyIds),
        _supabase.from('issue_state')
            .select('issue_id, salience, salience_target, owned_by, pioneer_faction_id')
            .eq('nation_id', nation.id),
    ]);

    if (standingsRes.error) console.error('[Politics] Failed to load standings:', standingsRes.error.message);
    if (issueStatesRes.error) console.error('[Politics] Failed to load issue states:', issueStatesRes.error.message);
    const standings = standingsRes.data || [];
    const issueStates = issueStatesRes.data || [];

    // Build standings lookup
    const standingMap = {};
    for (const s of standings) standingMap[s.faction_id] = s;

    const playerStanding = standingMap[playerFaction.id];

    // Build party lookup
    const partyMap = {};
    for (const p of (allParties || [])) partyMap[p.id] = p;

    // If no standings data, show fallback
    if (!playerStanding) {
        container.innerHTML = '<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">Electorate standing not yet computed. Advance a tick to generate data.</div>';
        return;
    }

    // Player values
    const alignment = Number(playerStanding.ideological_alignment ?? 50);
    const appeal = Number(playerStanding.platform_appeal ?? 50);
    const approval = Number(playerStanding.party_approval ?? 50);
    const visibility = Number(playerStanding.visibility ?? 30);
    const credibility = Number(playerStanding.credibility_modifier ?? 1.0);
    const voteShare = Number(playerStanding.realized_vote_share ?? 0);
    const contestedShare = Number(playerStanding.contested_vote_share ?? 0);
    const turnout = Number(playerStanding.turnout_rate ?? 0.65);
    const voteLeft = Number(playerStanding.vote_left_on_table ?? 0);
    const rawAppeal = Number(playerStanding.raw_appeal ?? 0);

    const vsNum = (voteShare * 100).toFixed(1);
    const seatsText = `${mySeats} / ${totalSeats} seats`;

    // Rank
    const sortedByVote = [...standings].sort((a, b) => (Number(b.realized_vote_share) || 0) - (Number(a.realized_vote_share) || 0));
    const rank = sortedByVote.findIndex(s => s.faction_id === playerFaction.id) + 1;
    const ordinal = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : rank + 'th';

    // Pillar contribution percentages
    const alignContrib = Number(playerStanding.alignment_contribution ?? 0);
    const appealContrib = Number(playerStanding.appeal_contribution ?? 0);
    const approvalContrib = Number(playerStanding.approval_contribution ?? 0);

    // Build all-party comparison rows (sorted by realized_vote_share desc)
    const sortedParties = [...standings]
        .sort((a, b) => (Number(b.realized_vote_share) || 0) - (Number(a.realized_vote_share) || 0));

    let partyRowsHtml = '';
    for (const s of sortedParties) {
        const p = partyMap[s.faction_id];
        if (!p) continue;
        const isPlayer = s.faction_id === playerFaction.id;
        const pColor = p.party_color || '#888';
        const pAbbr = p.abbreviation || '??';
        const sAlign = Number(s.ideological_alignment ?? 50);
        const sAppeal = Number(s.platform_appeal ?? 50);
        const sApproval = Number(s.party_approval ?? 50);
        const sVote = (Number(s.realized_vote_share ?? 0) * 100).toFixed(1);
        const sVis = Number(s.visibility ?? 30);
        const sCred = Number(s.credibility_modifier ?? 1.0);
        const sTurnout = (Number(s.turnout_rate ?? 0.65) * 100).toFixed(0);
        const sVoteLeft = (Number(s.vote_left_on_table ?? 0) * 100).toFixed(1);

        // Pillar color helper
        function pc(v) { return v >= 65 ? 'var(--dgreen)' : v >= 45 ? 'var(--damber)' : 'var(--dred)'; }

        partyRowsHtml += `
        <div class="vc-voter-seg" style="border-left-color:${pColor};${isPlayer ? 'background:rgba(255,255,255,0.02);' : ''}">
            <div class="vc-vs-top">
                <div>
                    <div class="vc-vs-name">${escapeHtml(p.faction_name || pAbbr)}${isPlayer ? ' <span style="font-size:8px;color:var(--dteal);">(YOU)</span>' : ''}</div>
                </div>
                <div style="text-align:right;">
                    <div class="vc-vs-share" style="color:${pColor};">${sVote}%</div>
                    <div style="font-family:var(--dfont-mono);font-size:7px;color:var(--dtxt-dim);">vote share</div>
                </div>
            </div>
            <div class="vc-vs-bar">
                <div class="vc-vs-bar-seg" style="width:${Math.round(sAlign)}%;background:${VC_IDEO_COLOR};"></div>
                <div class="vc-vs-bar-seg" style="width:${Math.round(sAppeal)}%;background:${VC_PERF_COLOR};"></div>
                <div class="vc-vs-bar-seg" style="flex:1;background:${VC_MOM_COLOR};"></div>
            </div>
            <div class="vc-vs-labels">
                <div class="vc-vs-lbl"><div class="vc-vs-lbl-dot" style="background:${VC_IDEO_COLOR}"></div>Alignment <span style="color:${pc(sAlign)}">${sAlign.toFixed(0)}</span></div>
                <div class="vc-vs-lbl"><div class="vc-vs-lbl-dot" style="background:${VC_PERF_COLOR}"></div>Appeal <span style="color:${pc(sAppeal)}">${sAppeal.toFixed(0)}</span></div>
                <div class="vc-vs-lbl"><div class="vc-vs-lbl-dot" style="background:${VC_MOM_COLOR}"></div>Approval <span style="color:${pc(sApproval)}">${sApproval.toFixed(0)}</span></div>
                <div class="vc-vs-lbl">Vis ${sVis.toFixed(0)}</div>
                <div class="vc-vs-lbl">Cred ${(sCred * 100).toFixed(0)}%</div>
                <div class="vc-vs-lbl">Turnout ${sTurnout}%</div>
                ${Number(sVoteLeft) > 0.01 ? `<div class="vc-vs-lbl" style="color:var(--dred);">Left ${sVoteLeft}%</div>` : ''}
            </div>
        </div>`;
    }

    // Issue Landscape section
    let issueLandscapeHtml = '';
    if (issueStates.length > 0) {
        const sortedIssues = [...issueStates].sort((a, b) => Number(b.salience) - Number(a.salience));
        let issueRowsHtml = '';
        for (const is of sortedIssues) {
            const def = ISSUE_DEFS[is.issue_id];
            if (!def) continue;
            const salience = Number(is.salience ?? 30);
            const target = Number(is.salience_target ?? 30);
            const salienceColor = salience >= 60 ? 'var(--dred)' : salience >= 40 ? 'var(--damber)' : 'var(--dtext-3)';
            const ownerParty = is.owned_by ? partyMap[is.owned_by] : null;
            const pioneerParty = is.pioneer_faction_id ? partyMap[is.pioneer_faction_id] : null;
            const trending = target > salience + 5 ? 'rising' : target < salience - 5 ? 'falling' : 'stable';
            const trendIcon = trending === 'rising' ? '<span style="color:var(--dred);">&#9650;</span>' : trending === 'falling' ? '<span style="color:var(--dgreen);">&#9660;</span>' : '<span style="color:var(--dtext-3);">&#8212;</span>';

            issueRowsHtml += `
            <div class="vc-issue-row">
                <div class="vc-issue-name">${escapeHtml(def.label)}</div>
                <div class="vc-issue-bar-track">
                    <div class="vc-issue-bar-fill" style="width:${salience}%;background:${salienceColor}"></div>
                </div>
                <div class="vc-issue-salience" style="color:${salienceColor}">${salience.toFixed(0)}</div>
                <div class="vc-issue-trend">${trendIcon}</div>
                <div class="vc-issue-owner">${ownerParty ? `<span style="color:${ownerParty.party_color || '#888'}">${escapeHtml(ownerParty.abbreviation || '??')}</span>` : '<span style="color:var(--dtext-3);">—</span>'}</div>
            </div>`;
        }

        issueLandscapeHtml = `
        <div class="vc-pillar-section">
            <div class="vc-sec-label" style="margin-bottom:8px;">Issue Landscape — Salience &amp; Ownership</div>
            <div class="vc-issue-header">
                <span class="vc-issue-col-label" style="flex:1;">Issue</span>
                <span class="vc-issue-col-label" style="flex:2;">Salience</span>
                <span class="vc-issue-col-label" style="width:36px;text-align:right;"></span>
                <span class="vc-issue-col-label" style="width:28px;text-align:center;">Trend</span>
                <span class="vc-issue-col-label" style="width:40px;text-align:center;">Owner</span>
            </div>
            ${issueRowsHtml}
        </div>`;
    }

    container.innerHTML = `
    <div class="vc-page-hdr">
        <span class="vc-ph-title">Electorate Standing</span>
        <span style="color:var(--dtxt-dim);font-family:var(--dfont-mono);">—</span>
        <span class="vc-ph-nation">${escapeHtml(nation.name)}</span>
    </div>
    <div class="vc-card">
        <div class="vc-card-hdr">
            <div class="vc-ch-left">
                <div class="vc-ch-dot" style="background:${partyColor}"></div>
                <span class="vc-ch-title">Your Standing — Three Pillars</span>
            </div>
            <div class="vc-ch-right">
                <span class="vc-ch-badge" style="color:${partyColor};background:${hexToRgba(partyColor, 0.09)};border-color:${hexToRgba(partyColor, 0.22)}">${escapeHtml(partyAbbr)}</span>
            </div>
        </div>
        <!-- Headline numbers -->
        <div class="vc-headline-row">
            <div class="vc-headline-cell">
                <div class="vc-hc-label">Vote Share</div>
                <div class="vc-hc-num" style="color:${partyColor}">${vsNum}%</div>
                <div class="vc-hc-sub">${ordinal} place. ${seatsText}.</div>
            </div>
            <div class="vc-headline-cell">
                <div class="vc-hc-label">Raw Appeal</div>
                <div class="vc-hc-num" style="color:${rawAppeal >= 40 ? 'var(--dgreen)' : rawAppeal >= 25 ? 'var(--damber)' : 'var(--dred)'}">${rawAppeal.toFixed(1)}</div>
                <div class="vc-hc-sub">Weighted pillar sum × credibility.</div>
            </div>
            <div class="vc-headline-cell">
                <div class="vc-hc-label">Turnout Rate</div>
                <div class="vc-hc-num" style="color:${turnout >= 0.7 ? 'var(--dgreen)' : turnout >= 0.55 ? 'var(--damber)' : 'var(--dred)'}">${(turnout * 100).toFixed(0)}%</div>
                <div class="vc-hc-sub">Voter turnout for your supporters. Boost visibility to increase.</div>
            </div>
        </div>
        <!-- Three-pillar breakdown -->
        <div class="vc-pillar-section">
            <div class="vc-sec-label" style="margin-bottom:12px;">Three-pillar breakdown</div>
            <div class="vc-pillar-grid">
                <div class="vc-pillar-card" style="border-top-color:${VC_IDEO_COLOR};">
                    <div class="vc-pc-label">Ideological Alignment</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <div class="vc-pc-num" style="color:${VC_IDEO_COLOR};">${alignment.toFixed(0)}</div>
                        <div class="vc-pc-unit">/ 100</div>
                    </div>
                    <div class="vc-pc-bar"><div class="vc-pc-fill" style="width:${alignment}%;background:${VC_IDEO_COLOR};"></div></div>
                    <div class="vc-pc-breakdown">
                        Weight: <strong>40%</strong>. Contribution: <strong>${alignContrib.toFixed(2)}</strong>.
                    </div>
                </div>
                <div class="vc-pillar-card" style="border-top-color:${VC_PERF_COLOR};">
                    <div class="vc-pc-label">Platform Appeal</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <div class="vc-pc-num" style="color:${VC_PERF_COLOR};">${appeal.toFixed(0)}</div>
                        <div class="vc-pc-unit">/ 100</div>
                    </div>
                    <div class="vc-pc-bar"><div class="vc-pc-fill" style="width:${appeal}%;background:${VC_PERF_COLOR};"></div></div>
                    <div class="vc-pc-breakdown">
                        Weight: <strong>25%</strong>. Contribution: <strong>${appealContrib.toFixed(2)}</strong>. Take stances to increase.
                    </div>
                </div>
                <div class="vc-pillar-card" style="border-top-color:${VC_MOM_COLOR};">
                    <div class="vc-pc-label">Party Approval</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <div class="vc-pc-num" style="color:${VC_MOM_COLOR};">${approval.toFixed(0)}</div>
                        <div class="vc-pc-unit">/ 100</div>
                    </div>
                    <div class="vc-pc-bar"><div class="vc-pc-fill" style="width:${approval}%;background:${VC_MOM_COLOR};"></div></div>
                    <div class="vc-pc-breakdown">
                        Weight: <strong>35%</strong>. Contribution: <strong>${approvalContrib.toFixed(2)}</strong>. Governance drives this.
                    </div>
                </div>
            </div>
        </div>
        <!-- Visibility / Credibility / Vote Left strip -->
        <div class="vc-pillar-section" style="display:flex;gap:24px;flex-wrap:wrap;">
            <div>
                <div class="vc-pc-label">Visibility</div>
                <div class="vc-pc-num" style="color:${visibility >= 50 ? 'var(--dgreen)' : visibility >= 30 ? 'var(--damber)' : 'var(--dred)'}; font-size:18px;">${visibility.toFixed(0)}</div>
            </div>
            <div>
                <div class="vc-pc-label">Credibility</div>
                <div class="vc-pc-num" style="color:${credibility >= 0.9 ? 'var(--dgreen)' : credibility >= 0.7 ? 'var(--damber)' : 'var(--dred)'}; font-size:18px;">${(credibility * 100).toFixed(0)}%</div>
            </div>
            <div>
                <div class="vc-pc-label">Vote Left on Table</div>
                <div class="vc-pc-num" style="color:${voteLeft > 0.005 ? 'var(--dred)' : 'var(--dgreen)'}; font-size:18px;">${(voteLeft * 100).toFixed(2)}%</div>
            </div>
        </div>
        ${issueLandscapeHtml}
        <!-- All-party comparison -->
        <div class="vc-pillar-section">
            <div class="vc-sec-label" style="margin-bottom:12px;">All-party comparison</div>
            ${partyRowsHtml}
        </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════════
   OTHER PARTIES TAB — Rival party intelligence cards
   ═══════════════════════════════════════════════════════════════════ */

// Fixed issue order for stance display
const OP_ISSUE_ORDER = [
    'Corruption', 'Unemployment', 'Cost of Living', 'Infrastructure',
    'Healthcare', 'Immigration', 'Education', 'Climate / Energy'
];

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
    if (rivals.length === 0) {
        container.innerHTML = '<div style="color:var(--dtext-3);font-family:var(--dfont-mono);font-size:11px;padding:20px;text-align:center;">No rival parties found.</div>';
        return;
    }

    // Build ideology lookup
    const ideoMap = {};
    for (const row of (allPartyIdeologies || [])) {
        ideoMap[row.faction_id] = row;
    }

    // Approval data from faction_electoral_standing
    const rivalIds = rivals.map(p => p.id);
    const { data: rivalStandings } = rivalIds.length > 0
        ? await _supabase.from('faction_electoral_standing')
            .select('faction_id, party_approval')
            .in('faction_id', rivalIds)
        : { data: [] };

    const approvalMap = {};
    for (const row of (rivalStandings || [])) {
        approvalMap[row.faction_id] = Math.round(row.party_approval ?? 40);
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
        const approval = approvalMap[p.id] ?? 40;
        const voteShare = Number(p.national_vote_share || 0);

        let status = 'opposition';
        if (coalitionPartyIds.includes(p.id)) {
            status = p.id === coalitionLeadId ? 'governing_head' : 'governing_junior';
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
            foundedTick: fd.founded_tick,
            leaderName,
            leaderAge,
            seats: p.seats || 0,
            totalSeats,
            voteShare,
            approval,
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
        approval:   (a, b) => b.approval - a.approval,
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
    const foundedBadge = founded ? `<span class="op-badge op-badge-neutral">Est. ${escapeHtml(founded)}</span>` : '';

    // Leader badge
    const leaderBadge = `<span class="op-badge op-badge-neutral">Leader: ${escapeHtml(party.leaderName)}${party.leaderAge ? ' (' + party.leaderAge + ')' : ''}</span>`;

    // Party description
    const descHtml = party.description
        ? `<div class="op-desc">${escapeHtml(party.description)}</div>`
        : '';

    // Approval color
    const apColor = party.approval > 50 ? 'var(--dgreen)' : party.approval >= 35 ? 'var(--damber)' : 'var(--dred)';

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

    // Stances — currently no stance system, all show "No stance"
    let stancesHtml = '';
    for (const issue of OP_ISSUE_ORDER) {
        stancesHtml += `
        <div class="op-stance-row">
            <div class="op-stance-issue">${escapeHtml(issue)}</div>
            <span class="op-no-stance">No stance</span>
            <div class="op-bar-wrap"></div>
            <div class="op-stance-score" style="color:var(--dtxt-dim)">—</div>
        </div>`;
    }

    // Stance insight — placeholder since no stances exist yet
    const stanceInsight = party.status.startsWith('governing')
        ? `<div class="op-insight" style="border-left-color:var(--dteal)">
            <div class="op-insight-label" style="color:var(--dteal)">No Active Stances</div>
            <div class="op-insight-body">${escapeHtml(party.abbreviation)} has not taken any public issue stances yet. Watch for campaign actions.</div>
           </div>`
        : `<div class="op-insight" style="border-left-color:var(--dteal)">
            <div class="op-insight-label" style="color:var(--dteal)">No Active Stances</div>
            <div class="op-insight-body">${escapeHtml(party.abbreviation)} has not declared any positions. Issue stance system not yet active.</div>
           </div>`;

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
                    <span class="op-sr-label">Vote Share</span>
                    <span class="op-sr-val">${(party.voteShare * 100).toFixed(1)}%</span>
                </div>
                <div class="op-stat-row">
                    <span class="op-sr-label">Approval</span>
                    <span class="op-sr-val" style="color:${apColor}">${party.approval}%</span>
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

