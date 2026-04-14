// js/party-actions.js — Party Actions tab UI
// Renders leader sidebar, actions panel, platform slots.

import { PLATFORMS, STAT_NAMES, BAD_STATS, statDirection, platformMomentumInfo } from './game/platforms.js';
import { getPromiseProgress } from './game/platform-promises.js';
import { fetchActiveAgitator, fetchOrGeneratePool, hireAgitator, checkOppositionStatus, getSkillLabel, calculateAgitatorCost } from './game/agitator.js';
import { LAWSUIT_TARGETS, LAWSUIT_BASES, calculateTier, TIER_EFFECTS, fileLawsuit, fetchActiveLawsuits } from './game/lawsuits.js';
import { getNationNames } from './game/political-actions.js';
import { isAbsoluteMonarchy } from './game/government-types.js';

let _supabase = null;
let _state = null;
let _selectedRole = 'leader';
let _myPlatforms = [];
let _nationPlatforms = [];
let _agitator = null;        // hired agitator or null
let _deputy = null;          // hired deputy leader or null
let _isOpposition = false;   // is this faction in opposition?
let _administration = null;  // active administration data
let _lawsuits = [];          // faction's lawsuits (active + resolved)
let _standing = null;        // faction_electoral_standing row (pillar scores)

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function initials(first, last) {
    return ((first || '?')[0] + (last || '?')[0]).toUpperCase();
}

// Role definitions — only leader is populated, rest are VACANT
const ROLES = [
    { id: 'leader', title: 'LEADER', fullTitle: 'Party Leader', color: '#c8a832' },
    { id: 'deputy', title: 'DEPUTY', fullTitle: 'Deputy Party Leader', color: '#8b9a6b' },
    { id: 'chief', title: 'CHIEF OF STAFF', fullTitle: 'Chief of Staff', color: '#5cc55c' },
    { id: 'campaign', title: 'CAMPAIGN MGR', fullTitle: 'Campaign Manager', color: '#c84' },
    { id: 'comms', title: 'COMMS DIR', fullTitle: 'Communications Director', color: '#5a8aaa' },
    { id: 'agitator', title: 'AGITATOR', fullTitle: 'Opposition Coordinator', color: '#d44a4a', oppositionOnly: true },
];

// Fundraise escalation: each use yields less money and costs more momentum
const FUNDRAISE_TIERS = [
    { perSeat: 5000, momDivisor: 10 }, // Use 1: $5k/seat, -1 mom per 10 seats
    { perSeat: 4000, momDivisor: 8 },  // Use 2: $4k/seat, -1 mom per 8 seats
    { perSeat: 3000, momDivisor: 6 },  // Use 3: $3k/seat, -1 mom per 6 seats
    { perSeat: 2000, momDivisor: 5 },  // Use 4: $2k/seat, -1 mom per 5 seats
    { perSeat: 1000, momDivisor: 5 },  // Use 5+: $1k/seat, -1 mom per 5 seats
];
let _fundraiseUseCount = 0; // tracked per session, reset on page load

function getFundraiseInfo(seats, useCount) {
    const tier = FUNDRAISE_TIERS[Math.min(useCount, FUNDRAISE_TIERS.length - 1)];
    const raised = seats * tier.perSeat;
    const momCost = Math.max(1, Math.floor(seats / tier.momDivisor)); // minimum 1
    return { raised, momCost, perSeat: tier.perSeat, tierIdx: Math.min(useCount, FUNDRAISE_TIERS.length - 1) };
}

const LEADER_ACTIONS = [
    {
        id: 'fundraise',
        name: 'Fundraise',
        desc: 'Raise party funds proportional to your seat count. Each use yields less money and costs more momentum. Momentum cannot drop below 1.',
        cost: 'MOMENTUM',
        costColor: '#c84',
        moneyCost: 0,
        tags: ['FINANCIAL', 'CAMPAIGN'],
        locked: false,
    },
    {
        id: 'statement',
        name: 'Issue Statement',
        desc: 'Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.',
        cost: '$20k',
        costColor: '#c8a832',
        moneyCost: 20000,
        tags: ['PUBLIC', 'NARRATIVE'],
        locked: false,
    },
    {
        id: 'platform',
        name: 'Set Party Platform',
        desc: 'Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.',
        cost: '$120k',
        costColor: '#c8a832',
        moneyCost: 120000,
        tags: ['STRATEGIC'],
        locked: false,
    },
];

// Monarch-only actions (shown instead of standard leader actions in monarchy)
const MONARCH_ACTIONS = [
    {
        id: 'fundraise',
        name: 'Fundraise',
        desc: 'Raise royal treasury funds proportional to your seat count. Each use yields less money and costs more momentum.',
        cost: 'MOMENTUM',
        costColor: '#c84',
        moneyCost: 0,
        tags: ['FINANCIAL', 'CAMPAIGN'],
        locked: false,
    },
    {
        id: 'grant_seats',
        name: 'Grant Seats',
        desc: 'Grant parliamentary seats to a noble house. Sharing power increases legitimacy (+0.5 per seat). Hoarding >70% of seats causes tyranny decay.',
        cost: 'FREE',
        costColor: '#5cc55c',
        moneyCost: 0,
        tags: ['ROYAL', 'STRUCTURAL'],
        locked: false,
    },
    {
        id: 'revoke_seats',
        name: 'Revoke Seats',
        desc: 'Revoke seats from a noble house. Costs $100k and -1 Legitimacy per seat revoked. Use sparingly — the people do not forget.',
        cost: '$100k/seat',
        costColor: '#d44a4a',
        moneyCost: 100000,
        tags: ['ROYAL', 'OFFENSIVE'],
        locked: false,
    },
    {
        id: 'statement',
        name: 'Royal Decree',
        desc: 'Issue a public declaration on an issue. Shifts positioning and voter bloc reactions. Media covers it.',
        cost: '$20k',
        costColor: '#c8a832',
        moneyCost: 20000,
        tags: ['PUBLIC', 'NARRATIVE'],
        locked: false,
    },
];

const TAG_COLORS = {
    PUBLIC: '#8b9a6b', NARRATIVE: '#5a8aaa', STRATEGIC: '#c8a832',
    INTERNAL: '#c84', COALITION: '#5aaa8a', RISKY: '#c55',
    PARLIAMENTARY: '#8b9a6b', FINANCIAL: '#5a8aaa', INTELLIGENCE: '#5a8aaa',
    DEFENSIVE: '#5cc55c', CAMPAIGN: '#c84', VOTER: '#c8a832',
    OFFENSIVE: '#c84', REACTIVE: '#ca5', STRUCTURAL: '#9e9a92',
    ROYAL: '#c8a832', LEGAL: '#5a8aaa',
};

// Statement topics
const STATEMENT_TOPICS = [
    { id: 'economy', label: 'Economy & Jobs', icon: '💰' },
    { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'security', label: 'National Security', icon: '🛡️' },
    { id: 'environment', label: 'Environment', icon: '🌱' },
    { id: 'corruption', label: 'Anti-Corruption', icon: '🔍' },
    { id: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
    { id: 'immigration', label: 'Immigration', icon: '🌐' },
    { id: 'housing', label: 'Housing & Cost of Living', icon: '🏠' },
    { id: 'crime', label: 'Crime & Justice', icon: '⚖️' },
    { id: 'labor', label: 'Labor & Workers', icon: '🔨' },
    { id: 'foreign_policy', label: 'Foreign Policy', icon: '🕊️' },
];

// Headline templates for statements (mirrors valdorian-templates.js)
const STATEMENT_HEADLINES = [
    '{party_name} Calls for Action on {topic}',
    '{leader_name}: \'{topic}\' Must Be National Priority',
    '{leader_name} Pledges Bold Agenda on {topic}',
    '{party_name} Leader Addresses Nation on {topic}',
];

// ════════════════════════ INIT ════════════════════════

export async function initPartyActions(supabase, state) {
    _supabase = supabase;
    _state = state;

    const root = document.getElementById('pa-actions-root');
    if (!root) return;

    const faction = state.faction;
    if (!faction) {
        root.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--text-dim);">No faction data.</div>';
        return;
    }

    // Auto-assign first player as monarch in Absolute Monarchy nations
    if (isAbsoluteMonarchy(state.nation) && !state.nation.monarch_faction_id) {
        const leaderName = (faction.leader_first_name && faction.leader_last_name)
            ? faction.leader_first_name + ' ' + faction.leader_last_name : 'The Monarch';
        const dynastyName = faction.leader_last_name || faction.faction_name?.split(' ')[0] || 'Royal';
        const { getNationNames: _getNames } = await import('./game/political-actions.js');
        const _names = _getNames(state.nation.name);
        const heirFirst = (_names.firstNames || ['Alexander'])[Math.floor(Math.random() * (_names.firstNames || ['Alexander']).length)];

        const { error: monarchErr } = await _supabase.from('nations').update({
            monarch_faction_id: faction.id,
            monarch_name: leaderName,
            dynasty_name: dynastyName,
            heir_name: heirFirst + ' ' + dynastyName,
            heir_age: 14 + Math.floor(Math.random() * 8),
            monarch_crowned_tick: state.shard?.current_tick || 0,
        }).eq('id', state.nation.id);
        if (monarchErr) console.error('[Monarchy] Failed to assign monarch:', monarchErr.message);

        // Update local state
        state.nation.monarch_faction_id = faction.id;
        state.nation.monarch_name = leaderName;
        state.nation.dynasty_name = dynastyName;
    }

    // Fetch platforms + agitator + opposition status + electoral standing in parallel
    const [myPlat, nationPlat, agitatorResult, oppositionResult, standingResult] = await Promise.all([
        _supabase.from('faction_platforms').select('*').eq('faction_id', faction.id).order('slot'),
        _supabase.from('faction_platforms').select('*').eq('nation_id', state.nation?.id),
        fetchActiveAgitator(_supabase, faction.id),
        checkOppositionStatus(_supabase, state.nation?.id, faction.id),
        _supabase.from('faction_electoral_standing')
            .select('ideological_alignment, visibility, raw_appeal')
            .eq('faction_id', faction.id)
            .eq('nation_id', state.nation?.id)
            .maybeSingle(),
    ]);

    if (myPlat.error) console.error('[PartyActions] Failed to load faction platforms:', myPlat.error.message);
    if (nationPlat.error) console.error('[PartyActions] Failed to load nation platforms:', nationPlat.error.message);
    _myPlatforms = myPlat.data || [];
    _nationPlatforms = nationPlat.data || [];
    _agitator = agitatorResult;
    _isOpposition = oppositionResult.isOpposition;
    _administration = oppositionResult.administration;
    _standing = standingResult.data || null;

    // Fetch deputy leader
    const { data: deputyData } = await _supabase.from('faction_deputies')
        .select('*').eq('faction_id', faction.id).eq('status', 'active').maybeSingle();
    _deputy = deputyData || null;

    // Fetch lawsuits if agitator is hired
    if (_agitator) {
        _lawsuits = await fetchActiveLawsuits(_supabase, faction.id);
    }

    renderPage(root);
}

// ════════════════════════ RENDER ════════════════════════

function renderPage(root) {
    const faction = _state.faction;
    const nation = _state.nation;
    const _isMonarchy = isAbsoluteMonarchy(nation);
    const _isMonarch = _isMonarchy && nation?.monarch_faction_id === faction?.id;
    const partyColor = faction.color || '#c8a832';
    const leaderName = faction.leader_first_name && faction.leader_last_name
        ? `${faction.leader_first_name} ${faction.leader_last_name}` : 'Unknown Leader';
    const seats = faction.seats || 0;
    const totalSeats = nation?.total_seats || 120;
    const seatPct = totalSeats > 0 ? Math.round((seats / totalSeats) * 100) : 0;
    const ap = faction.action_points ?? 0;
    const approval = faction.approval_rating ?? 0;
    const momentum = faction.momentum ?? 50;
    const partyFunds = faction.party_funds ?? 0;

    // Platform slots display with promise progress
    const promiseProgress = getPromiseProgress(_myPlatforms, nation);
    const slotData = [];
    for (let i = 1; i <= 3; i++) {
        const p = _myPlatforms.find(fp => fp.slot === i);
        if (p) {
            const def = PLATFORMS.find(d => d.id === p.platform_key);
            const pp = promiseProgress.find(pr => pr.id === p.id);
            const metCount = pp ? pp.stats.filter(s => s.met).length : 0;
            const totalCount = pp ? pp.stats.length : 0;
            slotData.push({ name: def?.name || p.platform_key, status: p.status, metCount, totalCount, slot: i });
        } else {
            slotData.push(null);
        }
    }

    root.innerHTML = `
        <div class="pa-page">
            <!-- Header -->
            <div class="pa-header">
                <div class="pa-header-left">
                    <span class="pa-title" style="color:${partyColor};">${_isMonarch ? 'Royal Court' : 'Party Actions'}</span>
                    <div class="pa-party-badge">
                        <div class="pa-party-dot" style="background:${partyColor};"></div>
                        <span class="pa-party-name">${esc(faction.faction_name)}</span>
                    </div>
                </div>
                <div class="pa-header-stats">
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">Party Funds</div>
                        <div class="pa-header-stat-value" style="color:var(--accent);">$${partyFunds >= 1000000 ? (partyFunds / 1000000).toFixed(1) + 'M' : partyFunds >= 1000 ? Math.round(partyFunds / 1000) + 'k' : partyFunds}</div>
                    </div>
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">Momentum</div>
                        <div class="pa-header-stat-value" style="color:${momentum > 0 ? 'var(--text-bright)' : 'var(--red)'};">${Math.round(momentum)}</div>
                    </div>
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">${_isMonarchy ? 'Legitimacy' : 'Governance'}</div>
                        <div class="pa-header-stat-value" style="color:var(--green);">${_isMonarchy ? Math.round(Number(_state.nation?.legitimacy ?? _state.nation?.gov_approval ?? 50)) : Math.round(Number(_state.nation?.gov_approval ?? 0))}</div>
                    </div>
                </div>
            </div>

            <!-- Status bar -->
            <div class="pa-status-bar">
                <div class="pa-status-item">
                    <div class="pa-status-label">Seats</div>
                    <div class="pa-status-value">
                        <span class="pa-status-big" style="color:${partyColor};">${seats}</span>
                        <span class="pa-status-dim">/ ${totalSeats}</span>
                        <span class="pa-status-dim">(${seatPct}%)</span>
                    </div>
                </div>
                <div class="pa-status-item">
                    <div class="pa-status-label">Platforms</div>
                    <div style="display:flex;gap:4px;margin-top:3px;">
                        ${slotData.map(s => {
                            if (!s) return '<span class="pa-platform-slot">No Platform</span>';
                            const statusIcon = s.status === 'fulfilled' ? ' \u2713' : s.status === 'failed' ? ' \u2717' : s.status === 'abated' ? ' \u2014' : '';
                            const statusClass = s.status === 'fulfilled' ? 'fulfilled' : s.status === 'failed' ? 'failed' : s.status === 'abated' ? 'abated' : 'filled';
                            const progress = s.totalCount > 0 ? `${s.metCount}/${s.totalCount}` : '';
                            return `<span class="pa-platform-slot ${statusClass}" title="${s.metCount} of ${s.totalCount} stats on target">${esc(s.name)}${progress ? ` (${progress})` : ''}${statusIcon}</span>`;
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- Main layout -->
            <div class="pa-main">
                <!-- Leader sidebar -->
                <div class="pa-leaders" id="pa-leaders">
                    ${renderLeaderCards(leaderName, partyColor, faction)}
                </div>

                <!-- Actions panel -->
                <div class="pa-actions-panel" id="pa-actions-panel">
                    ${renderActionsPanel(leaderName, partyColor, faction)}
                </div>
            </div>
        </div>

        <!-- Statement Modal -->
        <div class="pa-modal-overlay" id="pa-statement-modal"></div>
        <!-- Platform Modal -->
        <div class="pa-modal-overlay" id="pa-platform-modal"></div>
        <!-- Hire Agitator Modal -->
        <div class="pa-modal-overlay" id="pa-hire-modal"></div>
        <!-- File Lawsuit Modal -->
        <div class="pa-modal-overlay" id="pa-lawsuit-modal"></div>
        <!-- Rebrand Modal -->
        <div class="pa-modal-overlay" id="pa-rebrand-modal"></div>
        <!-- Hire Deputy Modal -->
        <div class="pa-modal-overlay" id="pa-deputy-modal"></div>
        <!-- Rally Modal -->
        <div class="pa-modal-overlay" id="pa-rally-modal"></div>
        <!-- Grant/Revoke Seats Modal -->
        <div class="pa-modal-overlay" id="pa-royal-modal"></div>
    `;

    // Bind leader card clicks
    document.getElementById('pa-leaders')?.addEventListener('click', (e) => {
        const card = e.target.closest('.pa-leader-card');
        if (!card || card.classList.contains('vacant')) return;
        const role = card.dataset.role;
        if (role && role !== _selectedRole) {
            _selectedRole = role;
            renderPage(root);
        }
    });

    // Bind action clicks
    document.getElementById('pa-actions-panel')?.addEventListener('click', (e) => {
        const item = e.target.closest('.pa-action-item');
        if (!item || item.classList.contains('locked')) return;
        const actionId = item.dataset.actionId;
        if (actionId === 'fundraise') {
            executeFundraise(root);
        } else if (actionId === 'grant_seats') {
            openGrantSeatsModal(root);
        } else if (actionId === 'revoke_seats') {
            openRevokeSeatsModal(root);
        } else if (actionId === 'rally') {
            openRallyModal(root);
        } else if (actionId === 'statement') {
            openStatementModal(root);
        } else if (actionId === 'platform') {
            openPlatformModal(root);
        } else if (actionId === 'file_lawsuit') {
            openLawsuitModal(root);
        } else if (actionId === 'rebrand') {
            openRebrandModal(root);
        }
    });

    // Bind hire agitator button
    document.getElementById('pa-hire-agitator-btn')?.addEventListener('click', () => openHireAgitatorModal(root));
    document.getElementById('pa-hire-agitator-panel')?.addEventListener('click', (e) => {
        if (e.target.closest('#pa-hire-agitator-btn')) return;
        openHireAgitatorModal(root);
    });

    // Bind hire deputy button
    document.getElementById('pa-hire-deputy-btn')?.addEventListener('click', () => openHireDeputyModal(root));
    document.getElementById('pa-hire-deputy-panel')?.addEventListener('click', (e) => {
        if (e.target.closest('#pa-hire-deputy-btn')) return;
        openHireDeputyModal(root);
    });
}

function renderLeaderCards(leaderName, partyColor, faction) {
    return ROLES.map(role => {
        const isLeader = role.id === 'leader';
        const isAgitator = role.id === 'agitator';
        const isActive = _selectedRole === role.id;

        // Agitator: populated if hired, otherwise hireable
        let isVacant, name, portrait, actionCount, roleSubLabel;
        if (isLeader) {
            isVacant = false;
            name = leaderName;
            portrait = initials(faction.leader_first_name, faction.leader_last_name);
            actionCount = LEADER_ACTIONS.length;
            // Determine political role label
            const __isMonarchy = isAbsoluteMonarchy(_state.nation);
            const __isMonarch = __isMonarchy && _state.nation?.monarch_faction_id === faction.id;
            if (__isMonarch) {
                roleSubLabel = { text: (_state.nation?.monarch_title || 'KING').toUpperCase(), color: '#c8a832' };
            } else if (__isMonarchy) {
                roleSubLabel = { text: 'NOBLE HOUSE', color: '#8b9a6b' };
            } else {
                const isPM = _administration?.pm_party_id === faction.id;
                const isPresident = _state.nation?.hos_election_method === 'elected' && _administration?.president_party_id === faction.id;
                if (isPM) roleSubLabel = { text: 'PRIME MINISTER', color: '#5cc55c' };
                else if (isPresident) roleSubLabel = { text: 'PRESIDENT', color: '#5cc55c' };
                else if (!_isOpposition) roleSubLabel = { text: 'GOVERNING', color: '#8b9a6b' };
                else roleSubLabel = { text: 'OPPOSITION', color: '#c84' };
            }
        } else if (isAgitator && _agitator) {
            isVacant = false;
            name = `${_agitator.first_name} ${_agitator.last_name}`;
            portrait = initials(_agitator.first_name, _agitator.last_name);
            actionCount = 1; // File Lawsuit (others coming later)
        } else if (isAgitator && !_agitator) {
            isVacant = false; // not vacant — hireable
            name = 'Not Hired';
            portrait = '+';
            actionCount = 0;
        } else if (role.id === 'deputy' && _deputy) {
            isVacant = false;
            name = `${_deputy.first_name} ${_deputy.last_name}`;
            portrait = initials(_deputy.first_name, _deputy.last_name);
            actionCount = 1; // Rally
        } else if (role.id === 'deputy' && !_deputy) {
            isVacant = false;
            name = 'Not Hired';
            portrait = '+';
            actionCount = 0;
        } else if (role.id === 'campaign') {
            isVacant = false;
            name = 'Campaign Mgr';
            portrait = 'CM';
            actionCount = CAMPAIGN_MANAGER_ACTIONS.length;
        } else {
            isVacant = true;
            name = 'Vacant';
            portrait = '\u2014';
            actionCount = 0;
        }

        const isGovLocked = role.oppositionOnly && !_isOpposition;

        let html = `
            <div class="pa-leader-card ${isActive ? 'active' : ''} ${isVacant ? 'vacant' : ''} ${isGovLocked ? 'vacant' : ''}"
                 data-role="${role.id}"
                 style="${isActive ? `border-left-color:${role.color};` : ''}${isGovLocked ? 'opacity:0.35;' : ''}">
                ${role.oppositionOnly ? `<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:${isGovLocked ? 'var(--text-dim)' : '#d44a4a'};background:${isGovLocked ? 'rgba(100,100,100,0.1)' : 'rgba(212,74,74,0.1)'};border:1px solid ${isGovLocked ? 'rgba(100,100,100,0.2)' : 'rgba(212,74,74,0.2)'};border-top:none;border-right:none;">${isGovLocked ? 'IN GOVERNMENT' : 'OPPOSITION ONLY'}</div>` : ''}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${role.color};background:${role.color}15;border-color:${role.color}33;">${portrait}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${role.color};">${role.title}</span>
                            ${actionCount > 0 ? `<span class="pa-leader-role-count">${actionCount} actions</span>` : ''}
                        </div>
                        <div class="pa-leader-name">${esc(name)}</div>
                        ${roleSubLabel ? `<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:${roleSubLabel.color};margin-top:2px;">${roleSubLabel.text}</div>` : ''}
                        ${isAgitator && _agitator ? `<div style="display:flex;align-items:center;gap:3px;margin-top:2px;"><div style="flex:1;height:2px;background:var(--border-mid);"><div style="height:100%;width:${_agitator.skill}%;background:${getSkillLabel(_agitator.skill).color};"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:16px;text-align:right;">${_agitator.skill}</span></div>` : ''}
                        ${isAgitator && !_agitator ? '<div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;margin-top:2px;">Click to recruit</div>' : ''}
                    </div>
                </div>
            </div>
        `;
        return html;
    }).join('') + `
        <div class="pa-threats">
            <div class="pa-threats-title">Threats</div>
            <div class="pa-threats-row">
                <span class="pa-threats-label">Active scandals</span>
                <span class="pa-threats-value">0</span>
            </div>
            <div class="pa-threats-row">
                <span class="pa-threats-label">Media investigations</span>
                <span class="pa-threats-value">0</span>
            </div>
            <div class="pa-threats-row">
                <span class="pa-threats-label">Oppo research against us</span>
                <span class="pa-threats-value">?</span>
            </div>
        </div>
    `;
}

function renderActionsPanel(leaderName, partyColor, faction) {
    const role = ROLES.find(r => r.id === _selectedRole);
    if (!role) return '';

    const isLeader = _selectedRole === 'leader';
    const isAgitator = _selectedRole === 'agitator';
    const isCampaign = _selectedRole === 'campaign';
    const isDeputy = _selectedRole === 'deputy';
    const isVacant = !isLeader && !isAgitator && !isCampaign && !isDeputy;

    if (isVacant) {
        return `
            <div class="pa-vacant-msg">
                <div>
                    <div class="pa-vacant-title">${esc(role.fullTitle)} — Vacant</div>
                    <div class="pa-vacant-sub">This position has not been filled. Recruitment coming in a future update.</div>
                </div>
            </div>
        `;
    }

    // Agitator: blocked if in government
    if (isAgitator && !_isOpposition) {
        return `
            <div class="pa-vacant-msg" style="opacity:0.4;">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">🚫</div>
                    <div class="pa-vacant-title">Agitator Unavailable</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto;">
                        Your party is in government. The Agitator role is only available to opposition parties.
                    </div>
                </div>
            </div>
        `;
    }

    // Agitator: not hired → show hire prompt
    if (isAgitator && !_agitator) {
        return `
            <div class="pa-vacant-msg" style="cursor:pointer;" id="pa-hire-agitator-panel">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.4;">&#9760;</div>
                    <div class="pa-vacant-title">Hire an Opposition Coordinator</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto 16px;">
                        The Agitator leads your opposition strategy — filing lawsuits, organizing protests, and applying legal and political pressure against the government.
                    </div>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-agitator-btn" style="background:#d44a4a;">Search Candidates</button>
                </div>
            </div>
        `;
    }

    // Agitator: hired → show their actions
    if (isAgitator && _agitator) {
        return renderAgitatorActionsPanel(role);
    }

    // Deputy: not hired → show hire prompt; hired → show Rally action
    if (isDeputy && !_deputy) {
        return `
            <div class="pa-vacant-msg" style="cursor:pointer;" id="pa-hire-deputy-panel">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.4;">🤝</div>
                    <div class="pa-vacant-title">Hire a Deputy Party Leader</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto 16px;">
                        The Deputy supports your party leader — organizing rallies, boosting momentum, and energizing the base.
                    </div>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-deputy-btn" style="background:#8b9a6b;">Search Candidates</button>
                </div>
            </div>
        `;
    }
    if (isDeputy && _deputy) {
        return renderDeputyActionsPanel(role);
    }

    // Campaign Manager: show rebrand action
    if (isCampaign) {
        return renderCampaignManagerPanel(role, faction);
    }

    const portrait = initials(faction.leader_first_name, faction.leader_last_name);
    const age = faction.leader_age ? `, Age ${faction.leader_age}` : '';

    const seats = faction.seats || 0;
    const momentum = faction.momentum ?? 0;

    // Use monarch-specific actions if this is the monarch in a monarchy
    const __isMonarchyForActions = isAbsoluteMonarchy(_state.nation);
    const __isMonarchForActions = __isMonarchyForActions && _state.nation?.monarch_faction_id === faction.id;
    const actionsList = __isMonarchForActions ? MONARCH_ACTIONS : LEADER_ACTIONS;

    const actionsHtml = actionsList.map(action => {
        const tagsHtml = action.tags.map(t =>
            `<span class="pa-action-tag" style="color:${TAG_COLORS[t] || 'var(--text-dim)'};">${t}</span>`
        ).join('');

        // Fundraise: show dynamic cost/yield info
        let extraInfo = '';
        let costDisplay = action.cost;
        let costColor = action.costColor;
        let isDisabled = action.locked;
        if (action.id === 'fundraise') {
            const fi = getFundraiseInfo(seats, _fundraiseUseCount);
            costDisplay = `-${fi.momCost} MOM`;
            costColor = '#c84';
            extraInfo = `<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);display:flex;gap:12px;">
                <span>Raises: <span style="color:var(--accent);font-weight:700;">$${(fi.raised / 1000).toFixed(0)}k</span></span>
                <span>$${(fi.perSeat / 1000).toFixed(0)}k/seat × ${seats}</span>
                ${_fundraiseUseCount > 0 ? `<span style="color:var(--orange);">Use #${_fundraiseUseCount + 1}</span>` : ''}
            </div>`;
            // Check if player can afford the momentum cost (must stay above floor of 1)
            if (momentum - fi.momCost < 1) {
                isDisabled = true;
                extraInfo += `<div style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Not enough momentum (need ${fi.momCost}, have ${Math.round(momentum)})</div>`;
            }
        }

        return `
            <div class="pa-action-item ${isDisabled ? 'locked' : ''}" data-action-id="${action.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${esc(action.name)}</span>
                        <div class="pa-action-tags">${tagsHtml}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${costColor};">${costDisplay}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${esc(action.desc)}</div>
                ${extraInfo}
                ${action.locked && action.lockReason ? `<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>\u2298</span><span>${esc(action.lockReason)}</span></div>` : ''}
            </div>
        `;
    }).join('');

    return `
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${role.color};background:${role.color}15;border-color:${role.color}33;">${portrait}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${role.color};">${_isMonarch ? (_state.nation?.monarch_title || 'KING').toUpperCase() : role.title}</span>
                        <span class="pa-detail-name">${esc(leaderName)}</span>
                        ${_isMonarchy && _state.nation?.dynasty_name ? `<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">House ${esc(_state.nation.dynasty_name)}</span>` : ''}
                    </div>
                    <div class="pa-detail-meta">${_isMonarch ? esc((_state.nation?.monarch_title || 'King') + ' of ' + (_state.nation?.name || '')) : esc(role.fullTitle) + ' &middot; ' + esc(faction.faction_name)}${age}${(() => {
                        if (_isMonarch) return ' <span style="color:#c8a832;font-weight:700;"> &middot; ' + (_state.nation?.monarch_title || 'MONARCH').toUpperCase() + '</span>';
                        if (_isMonarchy) return ' <span style="color:#8b9a6b;font-weight:700;"> &middot; NOBLE HOUSE</span>';
                        const isPM = _administration?.pm_party_id === faction.id;
                        const isPresident = _state.nation?.hos_election_method === 'elected' && _administration?.president_party_id === faction.id;
                        if (isPM) return ' <span style="color:#5cc55c;font-weight:700;"> &middot; PRIME MINISTER</span>';
                        if (isPresident) return ' <span style="color:#5cc55c;font-weight:700;"> &middot; PRESIDENT</span>';
                        if (!_isOpposition) return ' <span style="color:#8b9a6b;font-weight:700;"> &middot; GOVERNING</span>';
                        return ' <span style="color:#c84;font-weight:700;"> &middot; OPPOSITION</span>';
                    })()}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list">
            ${actionsHtml}
        </div>
        <div class="pa-skill-footer">
            <span style="color:${role.color};font-weight:700;">${role.title}</span> actions are executed by the party leader. Effectiveness depends on party approval and momentum.
        </div>
    `;
}

// ════════════════════════ DEPUTY LEADER PANEL ════════════════════════

const DEPUTY_ACTIONS = [
    {
        id: 'rally',
        name: 'Hold a Rally',
        desc: 'Invest party funds into a public rally. Higher investment improves your odds, but a bad roll can backfire. Roll 1d6 + rally bonus for momentum.',
        cost: '$50k-$200k',
        costColor: '#8b9a6b',
        tags: ['CAMPAIGN', 'RISKY'],
        locked: false,
    },
];

const RALLY_TIERS = [
    { cost: 50000, bonus: 1, label: '$50k (+1)' },
    { cost: 80000, bonus: 2, label: '$80k (+2)' },
    { cost: 120000, bonus: 3, label: '$120k (+3)' },
    { cost: 150000, bonus: 4, label: '$150k (+4)' },
    { cost: 200000, bonus: 5, label: '$200k (+5)' },
];

function getRallyResult(dieRoll, bonus) {
    const total = dieRoll + bonus;
    if (total >= 8) return { momentum: 3, label: 'Rousing Success', color: '#5cc55c' };
    if (total >= 5) return { momentum: 2, label: 'Solid Turnout', color: '#8b9a6b' };
    if (total >= 3) return { momentum: 0, label: 'Flat Response', color: '#ca5' };
    return { momentum: -2, label: 'Backfire', color: '#c55' };
}

function renderDeputyActionsPanel(role) {
    const actionsHtml = DEPUTY_ACTIONS.map(action => {
        const tagsHtml = action.tags.map(t =>
            `<span class="pa-action-tag" style="color:${TAG_COLORS[t] || 'var(--text-dim)'};">${t}</span>`
        ).join('');
        return `
            <div class="pa-action-item ${action.locked ? 'locked' : ''}" data-action-id="${action.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${esc(action.name)}</span>
                        <div class="pa-action-tags">${tagsHtml}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${action.costColor};">${action.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${esc(action.desc)}</div>
            </div>
        `;
    }).join('');

    const sk = getSkillLabel(_deputy.skill);
    return `
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${role.color};background:${role.color}15;border-color:${role.color}33;">${initials(_deputy.first_name, _deputy.last_name)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${role.color};">${role.title}</span>
                        <span class="pa-detail-name">${esc(_deputy.first_name)} ${esc(_deputy.last_name)}</span>
                    </div>
                    <div class="pa-detail-meta">${esc(role.fullTitle)} &middot; Age ${_deputy.age} &middot; Skill: <span style="color:${sk.color};font-weight:700;">${_deputy.skill}</span></div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list" id="pa-actions-panel">${actionsHtml}</div>
    `;
}

// ════════════════════════ HIRE DEPUTY MODAL ════════════════════════

function generateDeputyCandidates(nationName) {
    const names = getNationNames(nationName);
    const firstNames = names.firstNames || [];
    const lastNames = names.lastNames || [];
    if (firstNames.length === 0 || lastNames.length === 0) return [];

    const count = 5 + Math.floor(Math.random() * 3); // 5-7
    const usedNames = new Set();
    const candidates = [];

    for (let i = 0; i < count; i++) {
        let fn, ln, full;
        let attempts = 0;
        do {
            fn = firstNames[Math.floor(Math.random() * firstNames.length)];
            ln = lastNames[Math.floor(Math.random() * lastNames.length)];
            full = fn + ' ' + ln;
            attempts++;
        } while (usedNames.has(full) && attempts < 20);
        usedNames.add(full);

        const skill = 20 + Math.floor(Math.random() * 66); // 20-85
        const age = 28 + Math.floor(Math.random() * 30); // 28-57
        // Cost: $125k (skill 20) to $650k (skill 85), linear
        const t = Math.max(0, (skill - 20)) / 65;
        const cost = Math.round((125000 + t * 525000) / 25000) * 25000; // round to $25k

        candidates.push({ first_name: fn, last_name: ln, age, skill, hire_cost: cost });
    }

    return candidates.sort((a, b) => b.skill - a.skill);
}

async function openHireDeputyModal(root) {
    const overlay = document.getElementById('pa-deputy-modal');
    if (!overlay) return;

    const nationName = _state.nation?.name;
    const candidates = generateDeputyCandidates(nationName);
    let selectedIdx = null;

    function render() {
        const selected = selectedIdx != null ? candidates[selectedIdx] : null;
        const selSkill = selected ? getSkillLabel(selected.skill) : null;

        const listHtml = candidates.map((c, i) => {
            const isSel = selectedIdx === i;
            const sk = getSkillLabel(c.skill);
            return `<div class="pa-hire-row ${isSel ? 'selected' : ''}" data-idx="${i}">
                <div style="width:32px;height:32px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#8b9a6b;flex-shrink:0;">${initials(c.first_name, c.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${isSel ? 'var(--text-bright)' : 'var(--text-secondary)'};">${esc(c.first_name)} ${esc(c.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${c.skill}%;background:${sk.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${sk.color};">${c.skill}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Age ${c.age}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);">$${Math.round(c.hire_cost / 1000)}k</div>
                </div>
            </div>`;
        }).join('');

        let detailHtml;
        if (!selected) {
            detailHtml = `<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
                <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">\u2190</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a candidate to review</div>
            </div></div>`;
        } else {
            detailHtml = `
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#8b9a6b;">${initials(selected.first_name, selected.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${esc(selected.first_name)} ${esc(selected.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${selected.age} &middot; Deputy Leader Candidate</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${selected.skill}%;background:${selSkill.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${selSkill.color};">${selected.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${selSkill.color};margin-top:3px;font-weight:700;">${selSkill.label}</div>
                        </div>
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">HIRE COST</div>
                            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">$${Math.round(selected.hire_cost / 1000)}k</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:3px;">From party funds</div>
                        </div>
                    </div>
                    <div style="padding:8px 10px;background:rgba(139,154,107,0.04);border:1px solid rgba(139,154,107,0.12);">
                        <div style="font-family:var(--font-mono);font-size:7px;color:#8b9a6b;letter-spacing:0.06em;margin-bottom:3px;">ROLE: DEPUTY PARTY LEADER</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Organizes rallies, boosts momentum, and energizes the party base. Higher skill improves rally outcomes.</div>
                    </div>
                </div>
                <div style="padding:10px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:flex-end;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-right:auto;">Cost: <span style="color:var(--accent);font-weight:700;">$${Math.round(selected.hire_cost / 1000)}k</span></span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dep-hire-confirm" style="background:#8b9a6b;"${(_state.faction?.party_funds || 0) < selected.hire_cost ? ' disabled title="Not enough funds"' : ''}>Hire ${esc(selected.first_name)}</button>
                </div>
            `;
        }

        overlay.innerHTML = `
            <div style="width:100%;max-width:700px;background:var(--bg-panel);border:1px solid var(--border-mid);box-shadow:0 20px 60px rgba(0,0,0,0.5);display:flex;flex-direction:column;max-height:80vh;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#8b9a6b;"></div>
                        <span class="pa-modal-title">Hire Deputy Leader</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:8px;">${candidates.length} candidates</span>
                    </div>
                    <button class="pa-modal-close" id="pa-dep-close">&times;</button>
                </div>
                <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
                    <div style="width:240px;border-right:1px solid var(--border-main);overflow-y:auto;" id="pa-dep-list">${listHtml}</div>
                    <div style="flex:1;overflow-y:auto;">${detailHtml}</div>
                </div>
            </div>
        `;

        const close = () => overlay.classList.remove('active');
        document.getElementById('pa-dep-close')?.addEventListener('click', close);
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
        document.getElementById('pa-dep-list')?.addEventListener('click', (e) => {
            const row = e.target.closest('.pa-hire-row');
            if (!row) return;
            selectedIdx = parseInt(row.dataset.idx, 10);
            render();
        });
        document.getElementById('pa-dep-hire-confirm')?.addEventListener('click', async () => {
            if (selectedIdx == null) return;
            const c = candidates[selectedIdx];
            const funds = _state.faction?.party_funds || 0;
            if (funds < c.hire_cost) { alert('Not enough funds.'); return; }

            const btn = document.getElementById('pa-dep-hire-confirm');
            if (btn) { btn.disabled = true; btn.textContent = 'Hiring...'; }

            try {
                const newFunds = funds - c.hire_cost;
                const tick = _state.shard?.current_tick || 0;

                // Insert deputy
                const { data, error } = await _supabase.from('faction_deputies').insert({
                    faction_id: _state.faction.id,
                    first_name: c.first_name,
                    last_name: c.last_name,
                    age: c.age,
                    skill: c.skill,
                    status: 'active',
                    hired_at_tick: tick,
                }).select('*').single();

                if (error) { alert('Failed: ' + error.message); return; }

                // Deduct funds
                await _supabase.from('factions').update({ party_funds: newFunds }).eq('id', _state.faction.id);
                _state.faction.party_funds = newFunds;
                _deputy = data;
                _selectedRole = 'deputy';
                close();
                renderPage(root);
            } catch (err) {
                console.error('[Deputy] Hire error:', err);
            } finally {
                if (btn) { btn.disabled = false; }
            }
        });
    }

    overlay.classList.add('active');
    render();
}

// ════════════════════════ RALLY MODAL ════════════════════════

function openRallyModal(root) {
    const overlay = document.getElementById('pa-rally-modal');
    if (!overlay) return;
    if (!_deputy) return;

    const faction = _state.faction;
    const funds = faction.party_funds || 0;
    let selectedTier = null;
    let result = null;

    function render() {
        const tiersHtml = RALLY_TIERS.map((t, i) => {
            const canAfford = funds >= t.cost;
            const isSel = selectedTier === i;
            return `<div class="pa-action-item ${isSel ? 'selected' : ''} ${!canAfford ? 'locked' : ''}" data-tier="${i}" style="cursor:${canAfford ? 'pointer' : 'not-allowed'};${isSel ? 'border-color:#8b9a6b;background:rgba(139,154,107,0.06);' : ''}">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:${isSel ? '#8b9a6b' : 'var(--text-bright)'};">$${Math.round(t.cost / 1000)}k Investment</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#8b9a6b;">+${t.bonus} Rally Bonus</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Roll 1d6 + ${t.bonus} = range ${1 + t.bonus} to ${6 + t.bonus}</div>
            </div>`;
        }).join('');

        let resultHtml = '';
        if (result) {
            resultHtml = `
                <div style="padding:16px;background:${result.color}08;border:1px solid ${result.color}22;margin-top:12px;">
                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${result.color};margin-bottom:4px;">${result.label}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);margin-bottom:6px;">
                        Die roll: <strong>${result.dieRoll}</strong> + Rally bonus: <strong>${result.bonus}</strong> = <strong>${result.total}</strong>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${result.color};">
                        ${result.momentum >= 0 ? '+' : ''}${result.momentum} Momentum
                    </div>
                </div>
            `;
        }

        overlay.innerHTML = `
            <div class="pa-modal" style="width:520px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#8b9a6b;"></div>
                        <span class="pa-modal-title">Hold a Rally</span>
                    </div>
                    <button class="pa-modal-close" id="rally-close">&times;</button>
                </div>
                <div style="padding:8px 16px;border-bottom:1px solid var(--border-main);display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Organized by:</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#8b9a6b;">${esc(_deputy.first_name)} ${esc(_deputy.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Skill ${_deputy.skill}</span>
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    <div class="pa-modal-step-label">Choose Investment Level</div>
                    <div id="rally-tiers">${tiersHtml}</div>

                    <div style="margin-top:8px;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.6;">
                        <strong>Outcome table:</strong> Roll 1d6 + bonus<br>
                        8-11 = <span style="color:#5cc55c;">+3 Momentum</span> &middot;
                        5-7 = <span style="color:#8b9a6b;">+2 Momentum</span> &middot;
                        3-4 = <span style="color:#ca5;">+0 Momentum</span> &middot;
                        1-2 = <span style="color:#c55;">-2 Momentum</span>
                    </div>

                    ${resultHtml}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="rally-cancel">${result ? 'Close' : 'Cancel'}</button>
                    ${!result ? `<button class="pa-modal-btn pa-modal-btn--submit" id="rally-submit" style="background:#8b9a6b;" ${selectedTier == null ? 'disabled' : ''}>Hold Rally</button>` : ''}
                </div>
            </div>
        `;

        const close = () => { overlay.classList.remove('active'); if (result) renderPage(root); };
        document.getElementById('rally-close')?.addEventListener('click', close);
        document.getElementById('rally-cancel')?.addEventListener('click', close);
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        document.getElementById('rally-tiers')?.addEventListener('click', (e) => {
            const item = e.target.closest('[data-tier]');
            if (!item || item.classList.contains('locked')) return;
            selectedTier = parseInt(item.dataset.tier, 10);
            render();
        });

        document.getElementById('rally-submit')?.addEventListener('click', async () => {
            if (selectedTier == null || result) return;
            const tier = RALLY_TIERS[selectedTier];
            // Fetch fresh funds from DB to avoid stale cache race condition
            const { data: freshRallyFaction } = await _supabase.from('factions').select('party_funds, momentum').eq('id', _state.faction.id).single();
            const currentFunds = freshRallyFaction?.party_funds || 0;
            if (currentFunds < tier.cost) { alert('Not enough funds.'); return; }
            // Use fresh momentum too
            _state.faction.party_funds = currentFunds;
            _state.faction.momentum = freshRallyFaction?.momentum ?? _state.faction.momentum;

            const btn = document.getElementById('rally-submit');
            if (btn) { btn.disabled = true; btn.textContent = 'Rolling...'; }

            try {
                const dieRoll = 1 + Math.floor(Math.random() * 6);
                const rallyResult = getRallyResult(dieRoll, tier.bonus);

                const newFunds = currentFunds - tier.cost;
                const newMomentum = Math.max(1, (_state.faction.momentum || 0) + rallyResult.momentum);

                await _supabase.from('factions').update({
                    party_funds: newFunds,
                    momentum: newMomentum,
                }).eq('id', _state.faction.id);

                const tick = _state.shard?.current_tick || 0;
                await _supabase.from('campaign_actions').insert({
                    party_id: _state.faction.id,
                    nation_id: _state.nation?.id,
                    action_type: 'rally',
                    ap_cost: 0,
                    money_cost: tier.cost,
                    tick_performed: tick,
                    result: { dieRoll, bonus: tier.bonus, total: dieRoll + tier.bonus, momentum: rallyResult.momentum, label: rallyResult.label },
                });

                _state.faction.party_funds = newFunds;
                _state.faction.momentum = newMomentum;
                sessionStorage.removeItem('nationhood_state'); // bust stale cache so refreshAP reads correct value

                result = { ...rallyResult, dieRoll, bonus: tier.bonus, total: dieRoll + tier.bonus };
                render();
            } catch (err) {
                console.error('[Rally] Error:', err);
                alert('Rally failed.');
            }
        });
    }

    overlay.classList.add('active');
    render();
}

// ════════════════════════ CAMPAIGN MANAGER PANEL ════════════════════════

const CAMPAIGN_MANAGER_ACTIONS = [
    {
        id: 'rebrand',
        name: 'Rebrand Party',
        desc: 'Change your party name, abbreviation, color, logo, and description. Costly but grants a "Fresh Start" modifier. Nuclear option after scandal or major defeat.',
        cost: '$150k',
        costColor: '#c84',
        moneyCost: 150000,
        tags: ['CAMPAIGN', 'STRUCTURAL'],
        locked: false,
    },
];

const PARTY_COLORS_LIST = [
    { id: 'crimson', hex: '#c43a3a', name: 'Crimson' },
    { id: 'scarlet', hex: '#d45a2a', name: 'Scarlet' },
    { id: 'amber', hex: '#c8a832', name: 'Amber' },
    { id: 'gold', hex: '#d4a017', name: 'Gold' },
    { id: 'olive', hex: '#8a9a4a', name: 'Olive' },
    { id: 'emerald', hex: '#2a8a4a', name: 'Emerald' },
    { id: 'forest', hex: '#3a6a3a', name: 'Forest' },
    { id: 'teal_c', hex: '#2a8a7a', name: 'Teal' },
    { id: 'sky', hex: '#4a8aba', name: 'Sky' },
    { id: 'cobalt', hex: '#3a5a9a', name: 'Cobalt' },
    { id: 'navy', hex: '#2a3a6a', name: 'Navy' },
    { id: 'violet', hex: '#7a4a9a', name: 'Violet' },
    { id: 'plum', hex: '#8a3a7a', name: 'Plum' },
    { id: 'rose', hex: '#ba4a6a', name: 'Rose' },
    { id: 'slate', hex: '#5a6a7a', name: 'Slate' },
    { id: 'iron', hex: '#4a4a4a', name: 'Iron' },
];

const PARTY_LOGOS_LIST = [
    { emoji: '🏛️', name: 'Parliament' }, { emoji: '⚖️', name: 'Scales' }, { emoji: '🗽', name: 'Liberty' },
    { emoji: '🕊️', name: 'Dove' }, { emoji: '🦅', name: 'Eagle' }, { emoji: '🦁', name: 'Lion' },
    { emoji: '🐻', name: 'Bear' }, { emoji: '🐉', name: 'Dragon' }, { emoji: '🐘', name: 'Elephant' },
    { emoji: '🏔️', name: 'Mountain' }, { emoji: '🌊', name: 'Wave' }, { emoji: '🔥', name: 'Flame' },
    { emoji: '⭐', name: 'Star' }, { emoji: '🌟', name: 'Glow Star' }, { emoji: '💎', name: 'Diamond' },
    { emoji: '🛡️', name: 'Shield' }, { emoji: '⚔️', name: 'Swords' }, { emoji: '🏗️', name: 'Builder' },
    { emoji: '🌿', name: 'Leaf' }, { emoji: '🌾', name: 'Wheat' }, { emoji: '🔨', name: 'Hammer' },
    { emoji: '⚡', name: 'Lightning' }, { emoji: '🎯', name: 'Target' }, { emoji: '🏴', name: 'Flag' },
    { emoji: '🚩', name: 'Red Flag' }, { emoji: '✊', name: 'Fist' }, { emoji: '🤝', name: 'Handshake' },
    { emoji: '📜', name: 'Scroll' }, { emoji: '🗳️', name: 'Ballot' }, { emoji: '👑', name: 'Crown' },
];

function renderCampaignManagerPanel(role, faction) {
    const actionsHtml = CAMPAIGN_MANAGER_ACTIONS.map(action => {
        const tagsHtml = action.tags.map(t =>
            `<span class="pa-action-tag" style="color:${TAG_COLORS[t] || 'var(--text-dim)'};">${t}</span>`
        ).join('');
        return `
            <div class="pa-action-item ${action.locked ? 'locked' : ''}" data-action-id="${action.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${esc(action.name)}</span>
                        <div class="pa-action-tags">${tagsHtml}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${action.costColor};">${action.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${esc(action.desc)}</div>
            </div>
        `;
    }).join('');

    return `
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${role.color};background:${role.color}15;border-color:${role.color}33;">CM</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${role.color};">${role.title}</span>
                    </div>
                    <div class="pa-detail-meta">${esc(role.fullTitle)} &middot; ${esc(faction.faction_name)}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list" id="pa-actions-panel">${actionsHtml}</div>
        <div style="padding:8px 14px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);line-height:1.6;">
            <strong style="color:var(--text-secondary);">CAMPAIGN MANAGER</strong> actions shape your party's public identity and electoral strategy.
        </div>
    `;
}

function openRebrandModal(root) {
    const overlay = document.getElementById('pa-rebrand-modal');
    if (!overlay) return;

    const faction = _state.faction;
    const nation = _state.nation;
    const momentum = faction.momentum ?? 50;

    // Get colors claimed by other parties
    const claimedColors = {};
    const otherParties = (_state._allParties || []).filter(p => p.id !== faction.id);
    // We'll detect claimed colors from party_color field later; for now just build the modal

    const selectedColor = { current: faction.party_color || '#4a8aba' };
    const selectedLogoIdx = { current: 0 };
    const customLogoUrl = { current: faction.custom_logo_url || null };
    const customLogoFile = { current: null }; // File object pending upload
    const useCustomLogo = { current: !!faction.custom_logo_url };
    const confirming = { current: false };

    function getActiveColor() { return selectedColor.current; }

    function render() {
        const ac = getActiveColor();
        const colorName = PARTY_COLORS_LIST.find(c => c.hex === ac)?.name || 'Custom';
        const activeLogo = PARTY_LOGOS_LIST[selectedLogoIdx.current]?.emoji || '🏛️';
        const hasCustomLogo = useCustomLogo.current && (customLogoUrl.current || customLogoFile.current);
        const customPreviewSrc = customLogoUrl.current || (customLogoFile.current ? URL.createObjectURL(customLogoFile.current) : null);

        const nameVal = document.getElementById('rb-name')?.value ?? faction.faction_name ?? '';
        const abbrVal = document.getElementById('rb-abbr')?.value ?? faction.abbreviation ?? '';
        const descVal = document.getElementById('rb-desc')?.value ?? '';

        const colorsHtml = PARTY_COLORS_LIST.map(c => {
            const isSel = ac === c.hex;
            return `<div class="rb-color-swatch ${isSel ? 'selected' : ''}" data-hex="${c.hex}" style="background:${c.hex};${isSel ? `box-shadow:0 0 8px ${c.hex}44;border:2px solid var(--text-bright);` : ''}">
                ${isSel ? '<span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5);">✓</span>' : ''}
            </div>`;
        }).join('');

        const logosHtml = PARTY_LOGOS_LIST.map((l, i) => {
            const isSel = selectedLogoIdx.current === i;
            return `<div class="rb-logo-item ${isSel ? 'selected' : ''}" data-idx="${i}" style="${isSel ? `background:${ac}15;border:2px solid ${ac};box-shadow:0 0 6px ${ac}33;` : ''}">
                ${l.emoji}
            </div>`;
        }).join('');

        overlay.innerHTML = `
            <div class="pa-modal" style="width:780px;max-width:100%;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#c84;"></div>
                        <span class="pa-modal-title">Rebrand Party</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:#c84;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);">$150k</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:#c55;background:rgba(204,85,85,0.06);border:1px solid rgba(204,85,85,0.15);">-10 MOMENTUM</span>
                    </div>
                    <button class="pa-modal-close" id="rb-close">&times;</button>
                </div>

                <!-- Warning banner -->
                <div style="padding:8px 20px;background:rgba(212,74,74,0.04);border-bottom:1px solid var(--border-main);display:flex;align-items:center;gap:8px;">
                    <span style="font-size:12px;">⚠</span>
                    <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">
                        Rebranding costs <span style="color:#c55;font-weight:700;">10 Momentum</span> and resets approval <span style="color:#c55;font-weight:700;">-3 across all voter blocs</span> but grants a <span style="color:#5c5;font-weight:700;">"Fresh Start"</span> modifier. 120 tick cooldown.
                    </div>
                </div>

                <div style="display:flex;">
                    <!-- LEFT: Form -->
                    <div style="flex:1;padding:14px 20px;border-right:1px solid var(--border-main);">
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Name</div>
                            <input class="pa-modal-input" id="rb-name" value="${esc(nameVal)}" maxlength="60" style="font-size:13px;font-weight:600;">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${nameVal.length}/60 · Min 3</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Abbreviation</div>
                            <input class="pa-modal-input" id="rb-abbr" value="${esc(abbrVal)}" maxlength="4" style="width:100px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:${ac};">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">2-4 uppercase letters</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Description</div>
                            <textarea class="pa-modal-input" id="rb-desc" rows="3" style="resize:vertical;font-family:var(--font-ui);font-size:11px;line-height:1.5;">${esc(descVal)}</textarea>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${descVal.length}/200 · Visible to all</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Color — <span style="color:${ac};">${esc(colorName)}</span></div>
                            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" id="rb-colors">${colorsHtml}</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Logo — ${hasCustomLogo ? '<span style="color:var(--teal);">Custom</span>' : 'Preset'}</div>
                            <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-bottom:8px;${hasCustomLogo ? 'opacity:0.3;' : ''}" id="rb-logos">${logosHtml}</div>
                            <!-- Custom upload section -->
                            <div style="border:1px ${hasCustomLogo ? 'solid var(--teal)' : 'dashed var(--border-mid)'};padding:10px 14px;background:${hasCustomLogo ? 'rgba(90,170,138,0.04)' : 'var(--bg-card)'};">
                                ${hasCustomLogo && customPreviewSrc ? `
                                    <div style="display:flex;align-items:center;gap:12px;">
                                        <img src="${customPreviewSrc}" style="width:48px;height:48px;object-fit:contain;border:1px solid var(--border-main);background:var(--bg-card);" alt="Custom logo">
                                        <div style="flex:1;">
                                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--teal);font-weight:700;">CUSTOM LOGO ACTIVE</div>
                                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${customLogoFile.current ? customLogoFile.current.name : 'Saved logo'}</div>
                                        </div>
                                        <div id="rb-remove-logo" style="font-family:var(--font-mono);font-size:8px;color:#c55;cursor:pointer;padding:4px 8px;border:1px solid rgba(204,85,85,0.2);">REMOVE</div>
                                    </div>
                                ` : `
                                    <div style="display:flex;align-items:center;gap:10px;">
                                        <div style="font-size:18px;opacity:0.3;">🎨</div>
                                        <div style="flex:1;">
                                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);font-weight:600;">Or upload a custom logo</div>
                                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:1px;">PNG, JPG, SVG, or WebP · Max 2MB · Transparent background recommended</div>
                                        </div>
                                        <label id="rb-upload-label" style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid rgba(90,170,138,0.3);cursor:pointer;">
                                            UPLOAD
                                            <input type="file" id="rb-logo-file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style="display:none;">
                                        </label>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT: Preview -->
                    <div style="width:240px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;flex-shrink:0;">
                        <div class="pa-modal-step-label">Live Preview</div>
                        <div style="background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${ac};padding:10px;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                <div style="width:40px;height:40px;background:${ac}15;border:1.5px solid ${ac};display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden;">
                                    ${hasCustomLogo && customPreviewSrc
                                        ? `<img src="${customPreviewSrc}" style="width:100%;height:100%;object-fit:contain;" alt="">`
                                        : activeLogo}
                                </div>
                                <div>
                                    <div style="font-size:12px;font-weight:700;color:var(--text-bright);line-height:1.2;">${esc(nameVal || 'Party Name')}</div>
                                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${ac};letter-spacing:1px;">${esc(abbrVal || '???')}</div>
                                </div>
                            </div>
                            <div style="font-size:9px;color:var(--text-secondary);line-height:1.5;">${esc(descVal || 'No description...')}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);margin-bottom:3px;">BADGES</div>
                            <div style="display:flex;gap:3px;flex-wrap:wrap;">
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${ac};background:${ac}0a;border:1px solid ${ac}25;">${esc(abbrVal)}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${ac};background:${ac}0a;border:1px solid ${ac}25;">MEMBER</span>
                            </div>
                        </div>
                        <div style="padding:6px 8px;background:${ac}08;border:1px solid ${ac}25;display:flex;align-items:center;gap:8px;">
                            <div style="width:20px;height:20px;background:${ac};"></div>
                            <div>
                                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${ac};">${esc(colorName.toUpperCase())}</div>
                                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${ac}</div>
                            </div>
                        </div>

                        <!-- Cost summary -->
                        <div style="padding:8px;background:rgba(204,85,85,0.04);border:1px solid rgba(204,85,85,0.12);margin-top:auto;">
                            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-dim);margin-bottom:4px;">COST SUMMARY</div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Party Funds</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">$150k</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Momentum</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c55;">-10 (${momentum} → ${Math.max(1, momentum - 10)})</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Approval</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c55;">-3 all blocs</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Cooldown</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#d44a4a;">120 ticks</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;border-top:1px solid var(--border-main);margin-top:3px;padding-top:3px;"><span style="font-size:9px;color:#5c5;">Gain</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#5c5;">"Fresh Start" modifier</span></div>
                        </div>
                    </div>
                </div>

                <div class="pa-modal-footer" style="justify-content:space-between;">
                    <div style="max-width:400px;font-size:9px;color:var(--text-secondary);line-height:1.5;" id="rb-footer-msg">
                        ${confirming.current
                            ? '<span style="color:#d44a4a;font-weight:700;">⚠ Final confirmation. This costs $150k, 10 Momentum, and -3 approval. Cannot rebrand again for 120 ticks.</span>'
                            : 'This will change your party\'s identity across all UI, media, and diplomatic channels.'}
                    </div>
                    <div style="display:flex;gap:6px;">
                        ${confirming.current ? `
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-back">Go Back</button>
                            <button class="pa-modal-btn" id="rb-confirm" style="background:#d44a4a;color:#fff;">⚠ Confirm Rebrand</button>
                        ` : `
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-cancel">Cancel</button>
                            <button class="pa-modal-btn pa-modal-btn--submit" id="rb-submit" style="background:#c84;">Rebrand</button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    // Store custom logo state on overlay so executeRebrand can access it
    overlay._rbCustomLogoFile = null;
    overlay._rbCustomLogoUrl = customLogoUrl.current;
    overlay._rbUseCustomLogo = useCustomLogo.current;

    render();
    overlay.classList.add('active');

    // File input change handler (delegated)
    overlay.addEventListener('change', function fileHandler(e) {
        if (e.target.id === 'rb-logo-file') {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
                alert('Logo must be under 2MB. Selected file: ' + (file.size / (1024 * 1024)).toFixed(1) + 'MB');
                e.target.value = '';
                return;
            }
            if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
                alert('Unsupported file type. Use PNG, JPG, SVG, or WebP.');
                e.target.value = '';
                return;
            }
            customLogoFile.current = file;
            customLogoUrl.current = null;
            useCustomLogo.current = true;
            overlay._rbCustomLogoFile = file;
            overlay._rbCustomLogoUrl = null;
            overlay._rbUseCustomLogo = true;
            render();
        }
    });

    // Event delegation on overlay
    overlay.addEventListener('click', function handler(e) {
        if (e.target === overlay || e.target.closest('#rb-close') || e.target.closest('#rb-cancel')) {
            overlay.classList.remove('active');
            overlay.removeEventListener('click', handler);
            return;
        }

        // Color swatch
        const swatch = e.target.closest('.rb-color-swatch');
        if (swatch) {
            selectedColor.current = swatch.dataset.hex;
            render();
            return;
        }

        // Logo item (preset) — deactivates custom logo
        const logo = e.target.closest('.rb-logo-item');
        if (logo) {
            selectedLogoIdx.current = parseInt(logo.dataset.idx) || 0;
            useCustomLogo.current = false;
            overlay._rbUseCustomLogo = false;
            render();
            return;
        }

        // Remove custom logo
        if (e.target.closest('#rb-remove-logo')) {
            customLogoUrl.current = null;
            customLogoFile.current = null;
            useCustomLogo.current = false;
            overlay._rbCustomLogoFile = null;
            overlay._rbCustomLogoUrl = null;
            overlay._rbUseCustomLogo = false;
            render();
            return;
        }

        // Submit → go to confirm
        if (e.target.closest('#rb-submit')) {
            const name = document.getElementById('rb-name')?.value?.trim() || '';
            const abbr = document.getElementById('rb-abbr')?.value?.trim() || '';
            if (name.length < 3 || abbr.length < 2) { alert('Name must be 3+ chars, abbreviation 2-4 chars.'); return; }
            confirming.current = true;
            render();
            return;
        }

        // Back from confirm
        if (e.target.closest('#rb-back')) {
            confirming.current = false;
            render();
            return;
        }

        // Final confirm → execute rebrand
        if (e.target.closest('#rb-confirm')) {
            executeRebrand(overlay, root, handler);
            return;
        }
    });
}

async function executeRebrand(overlay, root, handler) {
    const faction = _state.faction;
    const name = document.getElementById('rb-name')?.value?.trim() || '';
    const abbr = document.getElementById('rb-abbr')?.value?.trim() || '';
    const desc = document.getElementById('rb-desc')?.value?.trim() || '';
    const color = document.querySelector('.rb-color-swatch.selected')?.dataset?.hex || faction.party_color;
    const logoIdx = document.querySelector('.rb-logo-item.selected')?.dataset?.idx;
    const logoEmoji = logoIdx != null ? PARTY_LOGOS_LIST[parseInt(logoIdx)]?.emoji : null;

    // Get custom logo state from the closure (set by openRebrandModal)
    const customFile = overlay._rbCustomLogoFile;
    const useCustom = overlay._rbUseCustomLogo;
    const existingCustomUrl = overlay._rbCustomLogoUrl;

    const btn = document.getElementById('rb-confirm');
    if (btn) { btn.disabled = true; btn.textContent = 'Rebranding...'; }

    try {
        const tick = _state.shard?.current_tick || 0;

        // 1. Upload custom logo if a new file was selected
        let customLogoUrlFinal = existingCustomUrl;
        if (useCustom && customFile) {
            const ext = customFile.name.split('.').pop()?.toLowerCase() || 'png';
            const storagePath = `${faction.id}/logo_${Date.now()}.${ext}`;

            const { data: uploadData, error: uploadErr } = await _supabase.storage
                .from('party-logos')
                .upload(storagePath, customFile, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: customFile.type,
                });

            if (uploadErr) {
                console.error('[Rebrand] Logo upload failed:', uploadErr.message);
                alert('Logo upload failed: ' + uploadErr.message);
                return;
            }

            // Get public URL
            const { data: urlData } = _supabase.storage.from('party-logos').getPublicUrl(storagePath);
            customLogoUrlFinal = urlData?.publicUrl || null;
        } else if (!useCustom) {
            customLogoUrlFinal = null; // User chose preset, clear custom logo
        }

        // 2. Deduct party funds ($150k)
        const rebrandCost = 150000;
        const currentFunds = faction.party_funds || 0;
        if (currentFunds < rebrandCost) {
            alert(`Not enough funds. You have $${Math.round(currentFunds / 1000)}k, need $150k.`);
            return;
        }

        // 3. Deduct funds, momentum, and update faction identity
        const newFunds = currentFunds - rebrandCost;
        const newMomentum = Math.max(1, (faction.momentum || 0) - 10);
        await _supabase.from('factions').update({
            party_funds: newFunds,
            momentum: newMomentum,
            faction_name: name,
            abbreviation: abbr.toUpperCase(),
            party_color: color,
            party_logo: useCustom ? null : logoEmoji,
            custom_logo_url: customLogoUrlFinal,
            rebrand_cooldown_until_tick: tick + 120,
        }).eq('id', faction.id);

        // 3. Log action
        await _supabase.from('campaign_actions').insert({
            party_id: faction.id,
            nation_id: _state.nation?.id,
            action_type: 'rebrand',
            ap_cost: 3,
            money_cost: 0,
            tick_performed: tick,
            result: { oldName: faction.faction_name, newName: name, oldAbbr: faction.abbreviation, newAbbr: abbr, oldColor: faction.party_color, newColor: color },
        });

        // 4. Update local state
        faction.party_funds = newFunds;
        faction.momentum = newMomentum;
        faction.faction_name = name;
        faction.abbreviation = abbr.toUpperCase();
        faction.party_color = color;
        faction.party_logo = useCustom ? null : logoEmoji;
        faction.custom_logo_url = customLogoUrlFinal;

        // 5. Close and re-render
        overlay.classList.remove('active');
        overlay.removeEventListener('click', handler);
        renderPage(root);
    } catch (err) {
        console.error('[PartyActions] Rebrand error:', err);
        alert('Failed to rebrand: ' + (err.message || err));
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '⚠ Confirm Rebrand'; }
    }
}

// ════════════════════════ AGITATOR ACTIONS PANEL ════════════════════════

const AGITATOR_ACTIONS = [
    {
        id: 'file_lawsuit',
        name: 'File Lawsuit',
        desc: 'Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.',
        cost: '$250k',
        costColor: '#c8a832',
        moneyCost: 250000,
        tags: ['LEGAL', 'OFFENSIVE'],
        locked: false,
    },
];

function renderAgitatorActionsPanel(role) {
    const ag = _agitator;
    const portrait = initials(ag.first_name, ag.last_name);
    const skillInfo = getSkillLabel(ag.skill);
    const oppLabel = _isOpposition
        ? '<span style="color:#5cc55c;margin-left:6px;">\u2713 IN OPPOSITION</span>'
        : '<span style="color:#c84;margin-left:6px;">\u26A0 IN GOVERNMENT (actions limited)</span>';

    const actionsHtml = AGITATOR_ACTIONS.map(action => {
        const tagsHtml = action.tags.map(t =>
            `<span class="pa-action-tag" style="color:${TAG_COLORS[t] || 'var(--text-dim)'};">${t}</span>`
        ).join('');
        return `
            <div class="pa-action-item ${action.locked ? 'locked' : ''}" data-action-id="${action.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${esc(action.name)}</span>
                        <div class="pa-action-tags">${tagsHtml}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${action.costColor};">${action.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${esc(action.desc)}</div>
                ${action.locked && action.lockReason ? `<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>\u2298</span><span>${esc(action.lockReason)}</span></div>` : ''}
            </div>
        `;
    }).join('');

    return `
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${role.color};background:${role.color}15;border-color:${role.color}33;">${portrait}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${role.color};">${role.title}</span>
                        <span class="pa-detail-name">${esc(ag.first_name)} ${esc(ag.last_name)}</span>
                    </div>
                    <div class="pa-detail-meta">${esc(role.fullTitle)}, Age ${ag.age}${oppLabel}</div>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;">SKILL</div>
                <div style="display:flex;align-items:center;gap:4px;margin-top:1px;">
                    <div style="width:40px;height:3px;background:var(--border-mid);"><div style="height:100%;width:${ag.skill}%;background:${skillInfo.color};"></div></div>
                    <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${skillInfo.color};">${ag.skill}</span>
                </div>
            </div>
        </div>
        ${ag.background ? `<div style="padding:6px 16px;border:1px solid var(--border-main);border-top:none;border-bottom:none;background:var(--bg-panel);font-size:9px;color:var(--text-dim);font-style:italic;">${esc(ag.background)}</div>` : ''}
        <div class="pa-actions-list">
            ${actionsHtml}
        </div>
        ${renderLawsuitsSection()}
        <div class="pa-skill-footer">
            <span style="color:${role.color};font-weight:700;">${role.title}</span> skill (${ag.skill}/100) affects lawsuit discovery and legal action outcomes. <span style="color:${skillInfo.color};font-weight:700;">${skillInfo.label}</span>: ${skillInfo.desc}
        </div>
    `;
}

function renderLawsuitsSection() {
    if (_lawsuits.length === 0) return '';

    const currentTick = _state.shard?.current_tick || 0;

    const lawsuitsHtml = _lawsuits.map(ls => {
        const targetDef = LAWSUIT_TARGETS.find(t => t.key === ls.target_ministry);
        const targetLabel = targetDef ? targetDef.label : ls.target_ministry;
        const targetIcon = targetDef ? targetDef.icon : '\u2696\uFE0F';
        const tierInfo = calculateTier(ls.corruption_growth || 0);
        const effects = TIER_EFFECTS[ls.tier] || TIER_EFFECTS[1];
        const isActive = ls.status === 'active';
        const ticksElapsed = Math.max(0, currentTick - ls.filed_at_tick);
        const totalTicks = 8;
        const progress = Math.min(1, ticksElapsed / totalTicks);
        const ticksLeft = Math.max(0, ls.resolves_at_tick - currentTick);

        // Milestone dots
        const milestones = [
            { tick: 0, label: 'Filed', type: 'filing' },
            { tick: 2, label: 'Discovery', type: 'discovery' },
            { tick: 5, label: 'Evidence', type: 'evidence' },
            { tick: 7, label: 'Pre-trial', type: 'pre_trial' },
            { tick: 8, label: 'Verdict', type: 'resolution' },
        ];

        const milestonesHtml = milestones.map(m => {
            const mTick = ls.filed_at_tick + m.tick;
            const passed = currentTick >= mTick;
            const isCurrent = currentTick >= mTick && (m.tick === 8 || currentTick < ls.filed_at_tick + milestones[milestones.indexOf(m) + 1]?.tick);
            const pct = (m.tick / totalTicks) * 100;
            return `<div class="pa-ls-milestone ${passed ? 'passed' : ''} ${isCurrent ? 'current' : ''}" style="left:${pct}%;" title="${m.label} (Tick ${mTick})">
                <div class="pa-ls-milestone-dot"></div>
                <div class="pa-ls-milestone-label">${m.label}</div>
            </div>`;
        }).join('');

        // Resolution badge
        let resolutionBadge = '';
        if (!isActive) {
            const resLabel = effects === TIER_EFFECTS[1] ? 'FRIVOLOUS' : effects === TIER_EFFECTS[2] ? 'PARTIAL WIN' : effects === TIER_EFFECTS[3] ? 'MAJOR WIN' : 'DEVASTATING';
            const resColor = ls.tier === 1 ? 'var(--red)' : ls.tier === 2 ? '#ca5' : ls.tier === 3 ? '#c84' : 'var(--green)';
            resolutionBadge = `<span class="pa-ls-tier-badge" style="color:${resColor};border-color:${resColor}44;background:${resColor}0a;">${resLabel}</span>`;
        }

        // Effects display
        const effectsHtml = !isActive ? `
            <div style="display:flex;gap:12px;margin-top:6px;font-family:var(--font-mono);font-size:8px;">
                <span style="color:${ls.momentum_effect >= 0 ? 'var(--green)' : 'var(--red)'};">You: ${ls.momentum_effect >= 0 ? '+' : ''}${ls.momentum_effect} Mom</span>
                <span style="color:${ls.governance_effect >= 0 ? 'var(--green)' : 'var(--red)'};">${ls.governance_effect >= 0 ? '+' : ''}${ls.governance_effect} Gov</span>
                <span style="color:${ls.gov_momentum_effect >= 0 ? 'var(--green)' : 'var(--red)'};">Govt: ${ls.gov_momentum_effect >= 0 ? '+' : ''}${ls.gov_momentum_effect} Mom</span>
            </div>
        ` : '';

        return `
            <div class="pa-ls-card ${isActive ? 'active' : 'resolved'}">
                <div class="pa-ls-header">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${targetIcon}</span>
                        <span style="font-size:11px;font-weight:700;color:var(--text-bright);">${esc(targetLabel)}</span>
                        <span class="pa-ls-tier-badge" style="color:${tierInfo.color};border-color:${tierInfo.color}44;background:${tierInfo.color}0a;">TIER ${ls.tier}</span>
                        ${resolutionBadge}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">
                        ${isActive ? `${ticksLeft} ticks left` : `Resolved tick ${ls.resolves_at_tick}`}
                    </div>
                </div>
                ${isActive ? `
                    <div class="pa-ls-timeline">
                        <div class="pa-ls-timeline-track">
                            <div class="pa-ls-timeline-fill" style="width:${progress * 100}%;"></div>
                        </div>
                        ${milestonesHtml}
                    </div>
                ` : ''}
                <div style="font-size:9px;color:var(--text-dim);margin-top:4px;">
                    Corruption growth: <span style="color:${tierInfo.color};font-weight:700;">${(ls.corruption_growth || 0).toFixed(1)}</span>
                    &mdash; ${esc(tierInfo.label)}
                </div>
                ${effectsHtml}
            </div>
        `;
    }).join('');

    return `
        <div class="pa-ls-section">
            <div class="pa-ls-section-title">Legal Actions</div>
            ${lawsuitsHtml}
        </div>
    `;
}

// ════════════════════════ HIRE AGITATOR MODAL ════════════════════════

let _hireSubmitting = false;

async function openHireAgitatorModal(root) {
    const overlay = document.getElementById('pa-hire-modal');
    if (!overlay) return;

    const nationId = _state.nation?.id;
    const nationName = _state.nation?.name;
    if (!nationId || !nationName) return;

    overlay.innerHTML = '<div class="pa-modal"><div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Searching for candidates...</div></div>';
    overlay.classList.add('active');

    const candidates = await fetchOrGeneratePool(_supabase, nationId, nationName);
    let selectedIdx = null;

    function render() {
        const selected = selectedIdx != null ? candidates[selectedIdx] : null;
        const selSkill = selected ? getSkillLabel(selected.skill) : null;

        const listHtml = candidates.map((c, i) => {
            const isSel = selectedIdx === i;
            const sk = getSkillLabel(c.skill);
            return `<div class="pa-hire-row ${isSel ? 'selected' : ''}" data-idx="${i}">
                <div style="width:32px;height:32px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#d44a4a;flex-shrink:0;">${initials(c.first_name, c.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${isSel ? 'var(--text-bright)' : 'var(--text-secondary)'};">${esc(c.first_name)} ${esc(c.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${c.skill}%;background:${sk.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${sk.color};">${c.skill}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;">Age ${c.age}</div>
            </div>`;
        }).join('');

        let detailHtml;
        if (!selected) {
            detailHtml = `<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
                <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">\u2190</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a candidate to review</div>
            </div></div>`;
        } else {
            detailHtml = `
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#d44a4a;">${initials(selected.first_name, selected.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${esc(selected.first_name)} ${esc(selected.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${selected.age} &middot; Opposition Coordinator Candidate</div>
                        </div>
                    </div>

                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${selected.skill}%;background:${selSkill.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${selSkill.color};">${selected.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${selSkill.color};margin-top:3px;font-weight:700;">${selSkill.label}</div>
                        </div>
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">HIRE COST</div>
                            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">$${(selected.hire_cost / 1000).toFixed(0)}k</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:3px;">From party funds</div>
                        </div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">BACKGROUND</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.6;font-style:italic;">${esc(selected.background)}</div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">SKILL ASSESSMENT</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${selSkill.desc}</div>
                    </div>

                    <div style="padding:8px 10px;background:rgba(212,74,74,0.04);border:1px solid rgba(212,74,74,0.12);">
                        <div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;letter-spacing:0.06em;margin-bottom:3px;">ROLE: OPPOSITION COORDINATOR</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Files lawsuits against the government, organizes protests, and leads legal challenges. Skill affects success rates of legal and direct actions. Available only when your party is in opposition.</div>
                    </div>
                </div>
                <div style="padding:10px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:flex-end;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-right:auto;">Cost: <span style="color:var(--accent);font-weight:700;">$${(selected.hire_cost / 1000).toFixed(0)}k</span></span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;"${(_state.faction?.party_funds || 0) < selected.hire_cost ? ' disabled title="Not enough funds"' : ''}>Hire ${esc(selected.first_name)}</button>
                </div>
            `;
        }

        overlay.innerHTML = `
            <div style="width:100%;max-width:700px;background:var(--bg-panel);border:1px solid var(--border-mid);box-shadow:0 20px 60px rgba(0,0,0,0.5);display:flex;flex-direction:column;max-height:80vh;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#d44a4a;"></div>
                        <span class="pa-modal-title">Hire Agitator</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:8px;">${candidates.length} candidates</span>
                    </div>
                    <button class="pa-modal-close" id="pa-hire-close">&times;</button>
                </div>
                <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
                    <div style="width:240px;border-right:1px solid var(--border-main);overflow-y:auto;" id="pa-hire-list">
                        ${listHtml}
                    </div>
                    <div style="flex:1;overflow-y:auto;" id="pa-hire-detail">
                        ${detailHtml}
                    </div>
                </div>
            </div>
        `;

        // Bind events
        const close = () => overlay.classList.remove('active');
        document.getElementById('pa-hire-close')?.addEventListener('click', close);
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        document.getElementById('pa-hire-list')?.addEventListener('click', (e) => {
            const row = e.target.closest('.pa-hire-row');
            if (!row) return;
            selectedIdx = parseInt(row.dataset.idx, 10);
            render();
        });

        document.getElementById('pa-hire-confirm')?.addEventListener('click', async () => {
            if (_hireSubmitting || selectedIdx == null) return;
            _hireSubmitting = true;
            const btn = document.getElementById('pa-hire-confirm');
            if (btn) { btn.disabled = true; btn.textContent = 'Hiring...'; }

            try {
                const tick = _state.shard?.current_tick || 0;
                const candidate = candidates[selectedIdx];
                const hireCost = candidate.hire_cost || 0;
                const currentFunds = _state.faction?.party_funds || 0;

                // Deduct party funds
                if (hireCost > 0 && currentFunds < hireCost) {
                    alert(`Not enough funds. You have $${Math.round(currentFunds / 1000)}k, need $${Math.round(hireCost / 1000)}k.`);
                    return;
                }
                if (hireCost > 0) {
                    const newFunds = currentFunds - hireCost;
                    const { error: fundsErr } = await _supabase.from('factions').update({ party_funds: newFunds }).eq('id', _state.faction.id);
                    if (fundsErr) { alert('Failed to deduct funds.'); return; }
                    _state.faction.party_funds = newFunds;
                }

                const result = await hireAgitator(_supabase, _state.faction?.id, candidate, tick);
                if (!result.success) {
                    alert(result.error || 'Failed to hire agitator.');
                    return;
                }
                _agitator = result.agitator;
                _selectedRole = 'agitator';
                close();
                renderPage(root);
            } catch (err) {
                console.error('[PartyActions] Hire agitator error:', err);
            } finally {
                _hireSubmitting = false;
                if (btn) { btn.disabled = false; }
            }
        });
    }

    render();
}

// ════════════════════════ FILE LAWSUIT MODAL ════════════════════════

let _lawsuitSubmitting = false;

function openLawsuitModal(root) {
    const overlay = document.getElementById('pa-lawsuit-modal');
    if (!overlay) return;

    if (!_administration) {
        alert('No active government to file against.');
        return;
    }

    const faction = _state.faction;
    const ag = _agitator;
    let selectedTarget = null;
    let selectedBasis = null;

    function render() {
        const canFile = selectedTarget && selectedBasis;

        const targetsHtml = LAWSUIT_TARGETS.map(t => {
            const isSel = selectedTarget === t.key;
            return `<div class="pa-lawsuit-target ${isSel ? 'selected' : ''}" data-target="${t.key}">
                <span style="font-size:18px;">${t.icon}</span>
                <span style="font-size:12px;font-weight:600;color:${isSel ? 'var(--text-bright)' : 'var(--text-secondary)'};">${esc(t.label)}</span>
            </div>`;
        }).join('');

        const basesHtml = LAWSUIT_BASES.map(b => {
            const isSel = selectedBasis === b.key;
            return `<div class="pa-lawsuit-basis ${isSel ? 'selected' : ''}" data-basis="${b.key}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${isSel ? '#d44a4a' : 'var(--border-mid)'};display:flex;align-items:center;justify-content:center;">
                        ${isSel ? '<div style="width:8px;height:8px;border-radius:50%;background:#d44a4a;"></div>' : ''}
                    </div>
                    <div>
                        <div style="font-size:14px;font-weight:600;color:${isSel ? 'var(--text-bright)' : 'var(--text-secondary)'};">${esc(b.label)}</div>
                        <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${esc(b.desc)}</div>
                    </div>
                </div>
            </div>`;
        }).join('');

        overlay.innerHTML = `
            <div class="pa-modal" style="width:700px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#d44a4a;"></div>
                        <span class="pa-modal-title">File Lawsuit</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 8px;color:#5a8aaa;background:rgba(90,138,170,0.08);border:1px solid rgba(90,138,170,0.2);margin-left:6px;">LEGAL</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 8px;color:#c84;background:rgba(200,132,0,0.08);border:1px solid rgba(200,132,0,0.2);">OFFENSIVE</span>
                    </div>
                    <button class="pa-modal-close" id="pa-lawsuit-close">&times;</button>
                </div>

                ${ag ? `<div style="padding:6px 16px;border-bottom:1px solid var(--border-main);background:rgba(212,74,74,0.04);display:flex;align-items:center;gap:8px;">
                    <span style="width:5px;height:5px;border-radius:50%;background:#d44a4a;display:inline-block;"></span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Filed by:</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#d44a4a;">${esc(ag.first_name)} ${esc(ag.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Skill ${ag.skill}</span>
                </div>` : ''}

                <div class="pa-modal-body" style="gap:16px;">
                    <div>
                        <div class="pa-modal-step-label">1 &mdash; Target Ministry</div>
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;" id="pa-lawsuit-targets">${targetsHtml}</div>
                    </div>

                    <div>
                        <div class="pa-modal-step-label">2 &mdash; Legal Basis</div>
                        <div style="display:flex;flex-direction:column;gap:4px;" id="pa-lawsuit-bases">${basesHtml}</div>
                    </div>

                    <div style="padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">INTELLIGENCE</div>
                        <div style="font-size:9px;color:var(--text-dim);font-style:italic;">No intelligence gathered. File FOIA requests first to assess corruption levels.</div>
                    </div>

                    <div style="padding:8px 10px;background:rgba(212,74,74,0.04);border:1px solid rgba(212,74,74,0.12);">
                        <div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;letter-spacing:0.06em;margin-bottom:4px;">COST &amp; RISK</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.6;">
                            <strong style="color:var(--text-bright);">FREE</strong> &middot; Duration: <strong style="color:var(--text-bright);">8 ticks</strong><br>
                            If corruption growth is low (0-5):<br>
                            <span style="color:var(--red);">YOU: -5 Momentum, -2 Governance</span><br>
                            <span style="color:var(--green);">THEM: +3 Momentum, +1 Governance</span>
                        </div>
                    </div>
                </div>

                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-lawsuit-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-lawsuit-submit" ${canFile ? '' : 'disabled'} style="background:#d44a4a;">File Lawsuit</button>
                </div>
            </div>
        `;

        // Bind
        const close = () => overlay.classList.remove('active');
        document.getElementById('pa-lawsuit-close')?.addEventListener('click', close);
        document.getElementById('pa-lawsuit-cancel')?.addEventListener('click', close);
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        document.getElementById('pa-lawsuit-targets')?.addEventListener('click', (e) => {
            const el = e.target.closest('.pa-lawsuit-target');
            if (!el) return;
            selectedTarget = el.dataset.target;
            render();
        });

        document.getElementById('pa-lawsuit-bases')?.addEventListener('click', (e) => {
            const el = e.target.closest('.pa-lawsuit-basis');
            if (!el) return;
            selectedBasis = el.dataset.basis;
            render();
        });

        document.getElementById('pa-lawsuit-submit')?.addEventListener('click', async () => {
            if (_lawsuitSubmitting || !selectedTarget || !selectedBasis) return;
            _lawsuitSubmitting = true;
            const btn = document.getElementById('pa-lawsuit-submit');
            if (btn) { btn.disabled = true; btn.textContent = 'Filing...'; }

            try {
                // Deduct $250k from party funds
                const lawsuitCost = 250000;
                const { data: freshFac } = await _supabase.from('factions').select('party_funds').eq('id', faction.id).single();
                const curFunds = freshFac?.party_funds || 0;
                if (curFunds < lawsuitCost) {
                    alert(`Not enough funds. You have $${Math.round(curFunds / 1000)}k, need $250k.`);
                    _lawsuitSubmitting = false;
                    if (btn) { btn.disabled = false; btn.textContent = 'File Lawsuit'; }
                    return;
                }
                const newFunds = curFunds - lawsuitCost;
                await _supabase.from('factions').update({ party_funds: newFunds }).eq('id', faction.id);
                faction.party_funds = newFunds;
                sessionStorage.removeItem('nationhood_state');

                const tick = _state.shard?.current_tick || 0;
                const result = await fileLawsuit(_supabase, {
                    factionId: faction?.id,
                    nationId: _state.nation?.id,
                    agitatorId: ag?.id,
                    targetMinistry: selectedTarget,
                    basis: selectedBasis,
                    currentTick: tick,
                    partyName: faction?.faction_name || 'Opposition',
                    administration: _administration,
                });

                if (!result.success) {
                    alert(result.error || 'Failed to file lawsuit.');
                    return;
                }

                const tierInfo = calculateTier(result.lawsuit?.corruption_growth || 0);
                const effects = TIER_EFFECTS[result.tier] || TIER_EFFECTS[1];
                close();

                // Show a brief result notification
                alert(`Lawsuit filed against ${LAWSUIT_TARGETS.find(t => t.key === selectedTarget)?.label || selectedTarget}.\nThe case is now under investigation. Results will be determined when it resolves in 8 ticks.`);

                renderPage(root);
            } catch (err) {
                console.error('[PartyActions] File lawsuit error:', err);
                alert('An error occurred. Please try again.');
            } finally {
                _lawsuitSubmitting = false;
                if (btn) { btn.disabled = false; btn.textContent = 'File Lawsuit'; }
            }
        });
    }

    overlay.classList.add('active');
    render();
}

// ════════════════════════ GRANT / REVOKE SEATS (Monarchy) ════════════════════════

async function openGrantSeatsModal(root) {
    const overlay = document.getElementById('pa-royal-modal');
    if (!overlay) return;

    const nation = _state.nation;
    const faction = _state.faction;
    const monarchSeats = faction.seats || 0;
    const totalSeats = nation?.total_seats || 100;

    // Fetch all factions in this nation
    const { data: allFactions } = await _supabase.from('factions')
        .select('id, faction_name, abbreviation, party_color, seats')
        .eq('nation_id', nation.id).eq('faction_type', 'party').is('abandoned_at', null)
        .order('faction_name');

    const otherFactions = (allFactions || []).filter(f => f.id !== faction.id);
    let selectedFactionId = null;
    let grantAmount = 5;

    function render() {
        const selected = otherFactions.find(f => f.id === selectedFactionId);
        const maxGrant = Math.max(0, monarchSeats - 1); // keep at least 1 seat

        overlay.innerHTML = `
            <div class="pa-modal" style="width:560px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#c8a832;"></div>
                        <span class="pa-modal-title">Grant Seats</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 8px;color:#c8a832;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);">ROYAL</span>
                    </div>
                    <button class="pa-modal-close" id="royal-close">&times;</button>
                </div>
                <div style="padding:8px 20px;border-bottom:1px solid var(--border-main);font-size:12px;color:var(--text-secondary);line-height:1.5;">
                    Grant parliamentary seats to a noble house. Each seat granted earns <span style="color:#5cc55c;font-weight:700;">+0.5 Legitimacy</span>.
                    You currently hold <strong>${monarchSeats}</strong> of ${totalSeats} seats.
                    ${monarchSeats / totalSeats > 0.7 ? '<div style="color:#d44a4a;font-weight:700;margin-top:4px;">⚠ You hold >70% of seats — tyranny legitimacy decay active!</div>' : ''}
                </div>
                <div class="pa-modal-body">
                    <div class="pa-modal-step-label">Select Noble House</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${otherFactions.length > 0 ? otherFactions.map(f => {
                            const isSel = f.id === selectedFactionId;
                            return `<div class="pa-action-item ${isSel ? 'selected' : ''}" data-faction-id="${f.id}" style="cursor:pointer;${isSel ? `border-color:${f.party_color || '#888'};background:${(f.party_color || '#888')}08;` : ''}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${f.party_color || '#888'};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${esc(f.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${f.seats || 0} seats</span>
                                </div>
                            </div>`;
                        }).join('') : '<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No other factions in this nation.</div>'}
                    </div>
                    ${selected ? `
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Grant</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${maxGrant}" value="${grantAmount}" id="grant-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent);width:40px;text-align:center;" id="grant-count">${grantAmount}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Legitimacy gain: <span style="color:#5cc55c;font-weight:700;">+${(grantAmount * 0.5).toFixed(1)}</span>
                                &middot; Your seats after: ${monarchSeats - grantAmount} &middot; Their seats after: ${(selected.seats || 0) + grantAmount}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-grant" ${!selected ? 'disabled' : ''} style="background:#c8a832;">Grant ${grantAmount} Seats</button>
                </div>
            </div>
        `;

        const close = () => overlay.classList.remove('active');
        document.getElementById('royal-close')?.addEventListener('click', close);
        document.getElementById('royal-cancel')?.addEventListener('click', close);
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        // Faction selection
        overlay.querySelector('.pa-modal-body')?.addEventListener('click', (e) => {
            const item = e.target.closest('[data-faction-id]');
            if (item) { selectedFactionId = item.dataset.factionId; render(); }
        });

        // Slider
        document.getElementById('grant-slider')?.addEventListener('input', (e) => {
            grantAmount = parseInt(e.target.value) || 1;
            document.getElementById('grant-count').textContent = grantAmount;
            const btn = document.getElementById('royal-grant');
            if (btn) btn.textContent = `Grant ${grantAmount} Seats`;
        });

        // Grant button
        document.getElementById('royal-grant')?.addEventListener('click', async () => {
            if (!selectedFactionId) return;
            const btn = document.getElementById('royal-grant');
            if (btn) { btn.disabled = true; btn.textContent = 'Granting...'; }

            try {
                const target = otherFactions.find(f => f.id === selectedFactionId);
                const newMonarchSeats = monarchSeats - grantAmount;
                const newTargetSeats = (target?.seats || 0) + grantAmount;
                const legGain = grantAmount * 0.5;
                const newLeg = Math.min(100, (Number(nation.legitimacy) || 50) + legGain);

                // Update both factions' seats
                const { error: e1 } = await _supabase.from('factions').update({ seats: newMonarchSeats }).eq('id', faction.id);
                const { error: e2 } = await _supabase.from('factions').update({ seats: newTargetSeats }).eq('id', selectedFactionId);
                const { error: e3 } = await _supabase.from('nations').update({ legitimacy: newLeg }).eq('id', nation.id);

                if (e1 || e2 || e3) { alert('Failed to grant seats.'); return; }

                faction.seats = newMonarchSeats;
                nation.legitimacy = newLeg;

                // Log event
                await _supabase.from('event_log').insert({
                    nation_id: nation.id,
                    event_name: `${nation.monarch_title || 'King'} grants ${grantAmount} seats to ${target?.faction_name || 'unknown'}`,
                    category: 'government',
                    description_chosen: `The ${nation.monarch_title || 'King'} has granted ${grantAmount} parliamentary seat${grantAmount !== 1 ? 's' : ''} to ${target?.faction_name}. Legitimacy +${legGain.toFixed(1)}.`,
                    fired_at_tick: _state.shard?.current_tick || 0,
                }).catch(() => {});

                close();
                renderPage(root);
            } catch (err) {
                console.error('[GrantSeats] Error:', err);
                alert('Failed to grant seats.');
            }
        });
    }

    overlay.classList.add('active');
    render();
}

async function openRevokeSeatsModal(root) {
    const overlay = document.getElementById('pa-royal-modal');
    if (!overlay) return;

    const nation = _state.nation;
    const faction = _state.faction;

    const { data: allFactions } = await _supabase.from('factions')
        .select('id, faction_name, abbreviation, party_color, seats')
        .eq('nation_id', nation.id).eq('faction_type', 'party').is('abandoned_at', null)
        .order('faction_name');

    const seatedFactions = (allFactions || []).filter(f => f.id !== faction.id && (f.seats || 0) > 0);
    let selectedFactionId = null;
    let revokeAmount = 1;

    function render() {
        const selected = seatedFactions.find(f => f.id === selectedFactionId);
        const maxRevoke = selected ? selected.seats || 0 : 0;
        const costPerSeat = 100000;
        const totalCost = revokeAmount * costPerSeat;
        const currentFunds = faction.party_funds || 0;

        overlay.innerHTML = `
            <div class="pa-modal" style="width:560px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#d44a4a;"></div>
                        <span class="pa-modal-title">Revoke Seats</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 8px;color:#d44a4a;background:rgba(212,74,74,0.06);border:1px solid rgba(212,74,74,0.15);">ROYAL</span>
                    </div>
                    <button class="pa-modal-close" id="royal-close">&times;</button>
                </div>
                <div style="padding:8px 20px;border-bottom:1px solid var(--border-main);font-size:12px;color:var(--text-secondary);line-height:1.5;">
                    Revoke seats from a noble house. Costs <span style="color:#d44a4a;font-weight:700;">$100k per seat</span> and
                    <span style="color:#d44a4a;font-weight:700;">-1 Legitimacy per seat</span>. Revoked seats return to the crown.
                </div>
                <div class="pa-modal-body">
                    <div class="pa-modal-step-label">Select Noble House</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${seatedFactions.length > 0 ? seatedFactions.map(f => {
                            const isSel = f.id === selectedFactionId;
                            return `<div class="pa-action-item ${isSel ? 'selected' : ''}" data-faction-id="${f.id}" style="cursor:pointer;${isSel ? 'border-color:#d44a4a;background:rgba(212,74,74,0.04);' : ''}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${f.party_color || '#888'};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${esc(f.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${f.seats} seats</span>
                                </div>
                            </div>`;
                        }).join('') : '<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No factions have seats to revoke.</div>'}
                    </div>
                    ${selected ? `
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Revoke</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${maxRevoke}" value="${revokeAmount}" id="revoke-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#d44a4a;width:40px;text-align:center;" id="revoke-count">${revokeAmount}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Cost: <span style="color:#d44a4a;font-weight:700;">$${Math.round(totalCost / 1000)}k</span>
                                &middot; Legitimacy: <span style="color:#d44a4a;font-weight:700;">-${revokeAmount}</span>
                                ${currentFunds < totalCost ? '<span style="color:#d44a4a;margin-left:8px;">⚠ Not enough funds</span>' : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-revoke" ${!selected || currentFunds < totalCost ? 'disabled' : ''} style="background:#d44a4a;">Revoke ${revokeAmount} Seats</button>
                </div>
            </div>
        `;

        const close = () => overlay.classList.remove('active');
        document.getElementById('royal-close')?.addEventListener('click', close);
        document.getElementById('royal-cancel')?.addEventListener('click', close);
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        overlay.querySelector('.pa-modal-body')?.addEventListener('click', (e) => {
            const item = e.target.closest('[data-faction-id]');
            if (item) { selectedFactionId = item.dataset.factionId; revokeAmount = 1; render(); }
        });

        document.getElementById('revoke-slider')?.addEventListener('input', (e) => {
            revokeAmount = parseInt(e.target.value) || 1;
            document.getElementById('revoke-count').textContent = revokeAmount;
            const btn = document.getElementById('royal-revoke');
            if (btn) btn.textContent = `Revoke ${revokeAmount} Seats`;
        });

        document.getElementById('royal-revoke')?.addEventListener('click', async () => {
            if (!selectedFactionId) return;
            const btn = document.getElementById('royal-revoke');
            if (btn) { btn.disabled = true; btn.textContent = 'Revoking...'; }

            try {
                const target = seatedFactions.find(f => f.id === selectedFactionId);
                const cost = revokeAmount * 100000;

                // Fetch fresh funds
                const { data: fresh } = await _supabase.from('factions').select('party_funds').eq('id', faction.id).single();
                const curFunds = fresh?.party_funds || 0;
                if (curFunds < cost) { alert('Not enough funds.'); return; }

                const newFunds = curFunds - cost;
                const newMonarchSeats = (faction.seats || 0) + revokeAmount;
                const newTargetSeats = Math.max(0, (target?.seats || 0) - revokeAmount);
                const legCost = revokeAmount;
                const newLeg = Math.max(0, (Number(nation.legitimacy) || 50) - legCost);

                const { error: e1 } = await _supabase.from('factions').update({ seats: newMonarchSeats, party_funds: newFunds }).eq('id', faction.id);
                const { error: e2 } = await _supabase.from('factions').update({ seats: newTargetSeats }).eq('id', selectedFactionId);
                const { error: e3 } = await _supabase.from('nations').update({ legitimacy: newLeg }).eq('id', nation.id);

                if (e1 || e2 || e3) { alert('Failed to revoke seats.'); return; }

                faction.seats = newMonarchSeats;
                faction.party_funds = newFunds;
                nation.legitimacy = newLeg;
                sessionStorage.removeItem('nationhood_state');

                await _supabase.from('event_log').insert({
                    nation_id: nation.id,
                    event_name: `${nation.monarch_title || 'King'} revokes ${revokeAmount} seats from ${target?.faction_name || 'unknown'}`,
                    category: 'political',
                    description_chosen: `The ${nation.monarch_title || 'King'} has revoked ${revokeAmount} seat${revokeAmount !== 1 ? 's' : ''} from ${target?.faction_name}. Legitimacy -${legCost}.`,
                    fired_at_tick: _state.shard?.current_tick || 0,
                }).catch(() => {});

                close();
                renderPage(root);
            } catch (err) {
                console.error('[RevokeSeats] Error:', err);
                alert('Failed to revoke seats.');
            }
        });
    }

    overlay.classList.add('active');
    render();
}

// ════════════════════════ FUNDRAISE ════════════════════════

let _fundraiseSubmitting = false;

async function executeFundraise(root) {
    if (_fundraiseSubmitting) return;
    const faction = _state.faction;
    const seats = faction.seats || 0;
    const momentum = Math.max(1, faction.momentum ?? 0);

    if (seats <= 0) {
        alert('Your party has no seats — nothing to fundraise from.');
        return;
    }

    const fi = getFundraiseInfo(seats, _fundraiseUseCount);

    // Check if player has enough momentum to pay the cost (must stay above floor of 1)
    if (momentum - fi.momCost < 1) {
        alert(`Not enough momentum. You need ${fi.momCost} momentum (current: ${Math.round(momentum)}, floor: 1). Try again next tick when momentum recovers.`);
        return;
    }

    _fundraiseSubmitting = true;

    try {
        // Fetch fresh values from DB to avoid stale cache
        const { data: freshFunds } = await _supabase.from('factions').select('party_funds, momentum').eq('id', faction.id).single();
        if (freshFunds) {
            faction.party_funds = freshFunds.party_funds ?? 0;
            faction.momentum = freshFunds.momentum ?? 0;
        }
        const freshMomentum = Math.max(1, faction.momentum ?? 0);

        const tick = _state.shard?.current_tick || 0;
        const newMomentum = Math.max(1, freshMomentum - fi.momCost);
        const newFunds = (faction.party_funds || 0) + fi.raised;

        // Update faction: deduct momentum, add funds
        const { error } = await _supabase.from('factions').update({
            momentum: newMomentum,
            party_funds: newFunds,
        }).eq('id', faction.id);

        if (error) {
            alert('Fundraise failed: ' + error.message);
            return;
        }

        // Log action
        await _supabase.from('campaign_actions').insert({
            party_id: faction.id,
            nation_id: _state.nation?.id,
            action_type: 'fundraise',
            ap_cost: 0,
            money_cost: 0,
            tick_performed: tick,
            result: {
                raised: fi.raised,
                perSeat: fi.perSeat,
                momCost: fi.momCost,
                useNumber: _fundraiseUseCount + 1,
                seats: seats,
            },
        });

        // Update local state + bust cache so refreshAP reads correct value
        faction.momentum = newMomentum;
        faction.party_funds = newFunds;
        sessionStorage.removeItem('nationhood_state');
        _fundraiseUseCount++;

        renderPage(root);
    } catch (err) {
        console.error('[PartyActions] Fundraise error:', err);
        alert('Fundraise failed.');
    } finally {
        _fundraiseSubmitting = false;
    }
}

// ════════════════════════ ISSUE STATEMENT MODAL ════════════════════════

function openStatementModal(root) {
    const overlay = document.getElementById('pa-statement-modal');
    if (!overlay) return;

    const faction = _state.faction;
    const partyColor = faction?.color || '#c8a832';
    const leaderName = (faction?.leader_first_name && faction?.leader_last_name)
        ? `${faction.leader_first_name} ${faction.leader_last_name}` : 'Party Leader';

    const topicsHtml = STATEMENT_TOPICS.map(t =>
        `<div class="pa-topic-card" data-topic="${t.id}" style="padding:8px 10px;cursor:pointer;border:1px solid var(--border-mid);display:flex;align-items:center;gap:8px;transition:all 0.12s;">
            <span style="font-size:14px;">${t.icon}</span>
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary);">${esc(t.label)}</span>
        </div>`
    ).join('');

    overlay.innerHTML = `
        <div class="pa-modal" style="width:520px;">
            <div class="pa-modal-header">
                <div class="pa-modal-header-left">
                    <div class="pa-modal-dot" style="background:${partyColor};"></div>
                    <span class="pa-modal-title">Issue Statement</span>
                </div>
                <button class="pa-modal-close" id="pa-stmt-close">&times;</button>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid var(--border-main);background:${partyColor}08;display:flex;align-items:center;gap:8px;">
                <span style="width:5px;height:5px;border-radius:50%;background:${partyColor};display:inline-block;"></span>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Speaking as:</span>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${partyColor};">${esc(leaderName)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Party Leader</span>
            </div>
            <div class="pa-modal-body" style="gap:14px;">
                <div>
                    <div class="pa-modal-step-label">1 &mdash; Topic</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;" id="pa-stmt-topics">${topicsHtml}</div>
                </div>
                <div>
                    <div class="pa-modal-step-label">2 &mdash; Statement</div>
                    <textarea class="pa-modal-input" id="pa-stmt-body" rows="5" placeholder="Write your public statement..." style="resize:none;font-family:var(--font-ui);font-size:11px;line-height:1.6;"></textarea>
                    <div style="display:flex;justify-content:space-between;margin-top:3px;">
                        <span id="pa-stmt-charcount" style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">0 characters</span>
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">Min 10 characters</span>
                    </div>
                </div>
                <div style="padding:6px 10px;background:var(--amber-faint);border:1px solid var(--amber-border);">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-bottom:2px;">COST</div>
                    <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                        Issuing a statement costs <strong style="color:var(--accent);">$20k</strong>.
                        The statement will appear in the national news and may shift voter bloc reactions.
                    </div>
                </div>
            </div>
            <div class="pa-modal-footer">
                <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-stmt-cancel">Cancel</button>
                <button class="pa-modal-btn pa-modal-btn--submit" id="pa-stmt-submit" disabled>Issue Statement</button>
            </div>
        </div>
    `;

    overlay.classList.add('active');

    let selectedTopic = null;
    let submitting = false;

    const close = () => overlay.classList.remove('active');
    document.getElementById('pa-stmt-close')?.addEventListener('click', close);
    document.getElementById('pa-stmt-cancel')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // Topic selection — reset inactive cards to original dim color (not empty string)
    document.getElementById('pa-stmt-topics')?.addEventListener('click', (e) => {
        const card = e.target.closest('.pa-topic-card');
        if (!card) return;
        selectedTopic = card.dataset.topic;
        document.querySelectorAll('.pa-topic-card').forEach(c => {
            const isActive = c.dataset.topic === selectedTopic;
            c.style.borderColor = isActive ? partyColor : 'var(--border-mid)';
            c.style.background = isActive ? partyColor + '0a' : '';
            const label = c.querySelector('span:last-child');
            if (label) label.style.color = isActive ? 'var(--text-bright)' : 'var(--text-secondary)';
        });
        updateSubmitState();
    });

    // Body input
    const updateSubmitState = () => {
        const body = document.getElementById('pa-stmt-body')?.value?.trim() || '';
        const btn = document.getElementById('pa-stmt-submit');
        const cc = document.getElementById('pa-stmt-charcount');
        if (cc) cc.textContent = `${body.length} characters`;
        if (btn) btn.disabled = !(selectedTopic && body.length >= 10);
    };
    document.getElementById('pa-stmt-body')?.addEventListener('input', updateSubmitState);

    // Submit
    document.getElementById('pa-stmt-submit')?.addEventListener('click', async () => {
        if (submitting) return;
        const body = document.getElementById('pa-stmt-body')?.value?.trim();
        if (!selectedTopic || !body || body.length < 10) return;

        submitting = true;
        const btn = document.getElementById('pa-stmt-submit');
        if (btn) { btn.disabled = true; btn.textContent = 'Issuing...'; }

        try {
            const tick = _state.shard?.current_tick || 0;
            const topicDef = STATEMENT_TOPICS.find(t => t.id === selectedTopic);
            const topicLabel = topicDef?.label || selectedTopic;

            // 1. Deduct party funds ($20k) — fetch fresh from DB to avoid stale cache
            const stmtCost = 20000;
            const { data: freshFaction } = await _supabase.from('factions').select('party_funds').eq('id', faction.id).single();
            const currentFunds = freshFaction?.party_funds || 0;
            if (currentFunds < stmtCost) {
                alert(`Not enough funds. You have $${Math.round(currentFunds / 1000)}k, need $20k.`);
                return;
            }
            const newFunds = currentFunds - stmtCost;
            const { error: fundsErr } = await _supabase.from('factions').update({ party_funds: newFunds }).eq('id', faction.id);
            if (fundsErr) { alert('Failed to deduct funds: ' + fundsErr.message); return; }
            faction.party_funds = newFunds;

            // 2. Generate headline
            const template = STATEMENT_HEADLINES[Math.floor(Math.random() * STATEMENT_HEADLINES.length)];
            const headline = template
                .replace('{party_name}', faction.faction_name || 'Unknown Party')
                .replace('{leader_name}', leaderName)
                .replace('{topic}', topicLabel);

            // 3. Write to campaign_actions
            const { error: actionErr } = await _supabase.from('campaign_actions').insert({
                party_id: faction.id,
                nation_id: _state.nation?.id,
                action_type: 'issue_statement',
                ap_cost: 1,
                money_cost: 0,
                tick_performed: tick,
                result: {
                    topic: selectedTopic,
                    topicLabel: topicLabel,
                    headline: headline,
                    body: body,
                    leaderName: leaderName,
                },
            });

            if (actionErr) {
                console.error('[PartyActions] Statement log failed:', actionErr.message);
            }

            // 4. Write to valdorian_articles (system news)
            const { error: articleErr } = await _supabase.from('valdorian_articles').insert({
                nation_id: _state.nation?.id,
                event_type: 'issue_statement',
                tier: 3,
                section: 'politics',
                headline: headline,
                subheadline: topicLabel,
                lede: body.substring(0, 200) + (body.length > 200 ? '...' : ''),
                body_paragraphs: JSON.stringify(body.split(/\n\n+/).filter(p => p.trim())),
                quotes: JSON.stringify([{ posture: 'assertive', text: body.substring(0, 150) }]),
                byline_reporter: 'Political Desk',
                topic_tags: JSON.stringify([selectedTopic]),
                source_event_id: 'statement_' + Date.now(),
                tick: tick,
            });

            if (articleErr) {
                console.error('[PartyActions] Article creation failed:', articleErr.message);
            }

            // 5. Write to event_log (shows in Events panel + Executive Timeline)
            await _supabase.from('event_log').insert({
                nation_id: _state.nation?.id,
                event_name: headline,
                category: 'political',
                description_chosen: `${leaderName} (${faction.faction_name}) issued a statement on ${topicLabel}: "${body.substring(0, 150)}${body.length > 150 ? '...' : ''}"`,
                fired_at_tick: tick,
            }).catch(e => console.warn('[Statement] event_log insert failed:', e));

            // 6. Write to admin timeline (under Communications filter)
            await _supabase.from('admin_timeline_events').insert({
                nation_id: _state.nation?.id,
                tick: tick,
                type: 'communications',
                title: 'Statement Issued',
                description: `${leaderName} issued a public statement on ${topicLabel}: "${body.substring(0, 120)}${body.length > 120 ? '...' : ''}"`,
            }).catch(e => console.warn('[Statement] timeline insert failed:', e));

            // 7. Close and re-render (funds already updated above)
            close();
            renderPage(root);
        } catch (err) {
            console.error('[PartyActions] Statement error:', err);
            alert('Failed to issue statement. Please try again.');
        } finally {
            submitting = false;
            if (btn) { btn.disabled = false; btn.textContent = 'Issue Statement'; }
        }
    });
}

// ════════════════════════ SET PARTY PLATFORM MODAL ════════════════════════

const PROMISE_DELTA = 20; // stats must move +/- 20 from baseline to fulfill promise

function openPlatformModal(root) {
    const overlay = document.getElementById('pa-platform-modal');
    if (!overlay) return;

    const faction = _state.faction;
    const nation = _state.nation;
    const partyColor = faction?.color || '#c8a832';
    let selectedPlatformId = null;
    let confirming = false;
    let submitting = false;

    // Count existing claims per platform in this nation (excluding our own)
    const claimCounts = {};
    for (const fp of _nationPlatforms) {
        if (fp.faction_id === faction?.id) continue;
        claimCounts[fp.platform_key] = (claimCounts[fp.platform_key] || 0) + 1;
    }

    // Our adopted platform keys
    const myPlatformKeys = new Set(_myPlatforms.map(p => p.platform_key));

    function render() {
        const selected = PLATFORMS.find(p => p.id === selectedPlatformId);
        const mInfo = selected ? platformMomentumInfo(claimCounts[selected.id] || 0) : null;

        // Claim info for selected
        const claimants = selected ? _nationPlatforms.filter(fp => fp.platform_key === selected.id && fp.faction_id !== faction?.id) : [];

        // Platform grid
        const gridHtml = PLATFORMS.map(p => {
            const isSel = selectedPlatformId === p.id;
            const isAdopted = myPlatformKeys.has(p.id);
            const mi = platformMomentumInfo(claimCounts[p.id] || 0);
            const count = claimCounts[p.id] || 0;

            return `<div class="pa-plat-card ${isSel ? 'selected' : ''} ${isAdopted ? 'adopted' : ''}" data-plat="${p.id}">
                ${isAdopted ? '<div class="pa-plat-active-badge">ACTIVE</div>' : ''}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="font-size:14px;">${p.icon}</span>
                    <span style="font-size:10px;font-weight:700;color:${isAdopted ? partyColor : isSel ? 'var(--text-bright)' : 'var(--text-secondary)'};line-height:1.2;">${esc(p.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.4;margin-bottom:6px;">${esc(p.tagline)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${mi.color};">${mi.label}</span>
                    ${count > 0 ? `<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 3px;color:var(--text-dim);border:1px solid var(--border-mid);">${count} rival${count > 1 ? 's' : ''}</span>` : ''}
                </div>
            </div>`;
        }).join('');

        // Detail panel
        let detailHtml;
        if (!selected) {
            detailHtml = `<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
                <div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">\u2190</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a platform to review</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:4px;">16 platforms available</div>
                </div>
            </div>`;
        } else {
            // Stat pills
            const improvePills = selected.improve.map(s => {
                const d = statDirection(s, 'improve');
                return `<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(92,204,92,0.05);border:1px solid rgba(92,204,92,0.15);color:${d.color};white-space:nowrap;">${d.arrow} ${STAT_NAMES[s] || s}</span>`;
            }).join('');
            const worsenPills = selected.worsen.map(s => {
                const d = statDirection(s, 'worsen');
                return `<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(204,85,85,0.05);border:1px solid rgba(204,85,85,0.15);color:${d.color};white-space:nowrap;">${d.arrow} ${STAT_NAMES[s] || s}</span>`;
            }).join('');

            const isAlreadyAdopted = myPlatformKeys.has(selected.id);
            const slotsUsed = _myPlatforms.length;

            // Action bar
            let actionBarHtml;
            if (isAlreadyAdopted) {
                actionBarHtml = `<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${partyColor};display:flex;align-items:center;gap:6px;">\u2713 CURRENT PLATFORM</div>`;
            } else if (slotsUsed >= 3) {
                actionBarHtml = `<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">All 3 platform slots are full.</div>`;
            } else if (confirming) {
                actionBarHtml = `<div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:#ca5;font-weight:700;">\u26A0 Confirm: Adopt ${esc(selected.name)}?</span>
                    <div style="display:flex;gap:6px;">
                        <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-plat-conf-cancel">Cancel</button>
                        <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-conf-yes">Confirm</button>
                    </div>
                </div>`;
            } else {
                actionBarHtml = `<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Costs 2 AP. Stats locked at current values. 6-tick cooldown.</span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-adopt" style="background:${partyColor};">Adopt Platform</button>
                </div>`;
            }

            detailHtml = `
                <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                        <span style="font-size:22px;">${selected.icon}</span>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${esc(selected.name)}</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.04em;margin-top:1px;">${esc(selected.tagline.toUpperCase())}</div>
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">${esc(selected.desc)}</div>
                </div>
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">MOMENTUM GAIN</div>
                            <div style="display:flex;align-items:baseline;gap:6px;">
                                <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${mInfo.color};">${mInfo.label}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${esc(mInfo.note)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex:1;padding:12px 20px;overflow-y:auto;">
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--green);display:inline-block;"></span>
                            PROMISES TO IMPROVE <span style="font-weight:400;color:var(--text-dim);">(${selected.improve.length} stats, +${PROMISE_DELTA} target)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${improvePills}</div>
                    </div>
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--red);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--red);display:inline-block;"></span>
                            LIKELY SIDE EFFECTS <span style="font-weight:400;color:var(--text-dim);">(${selected.worsen.length} stats)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${worsenPills}</div>
                    </div>
                    <div style="padding:10px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.15);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#ca5;letter-spacing:0.06em;margin-bottom:4px;">\u26A0 TRADEOFF</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${esc(selected.tradeoff)}</div>
                    </div>
                    <div style="margin-top:12px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">PROMISE RULES</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                            Stats are locked at current values when adopted. If your party enters government, you have <strong style="color:var(--text-bright);">24 ticks</strong> to move each promised stat by <strong style="color:var(--text-bright);">+${PROMISE_DELTA}</strong>. Failure: <strong style="color:var(--red);">-20 Momentum, -10 Governance</strong>. If you don't enter government, the promise abates.
                        </div>
                    </div>
                </div>
                <div style="padding:12px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;align-items:center;">
                    ${actionBarHtml}
                </div>
            `;
        }

        overlay.innerHTML = `
            <div style="width:100%;max-width:920px;background:var(--bg-panel);border:1px solid var(--border-mid);box-shadow:0 20px 60px rgba(0,0,0,0.5);display:flex;flex-direction:column;max-height:85vh;">
                <div style="padding:14px 20px;border-bottom:1px solid var(--border-main);display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:0.12em;color:${partyColor};">SET PARTY PLATFORM</span>
                            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--green);background:var(--green-faint);border:1px solid var(--green-border);">2 AP</span>
                            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--text-secondary);background:var(--bg-card);border:1px solid var(--border-mid);">CD: 6 TICKS</span>
                        </div>
                        <div style="font-size:10px;color:var(--text-secondary);margin-top:3px;">Choose your party's focus. Defines which stats you promise to change.</div>
                    </div>
                    <button class="pa-modal-close" id="pa-plat-close">&times;</button>
                </div>
                <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
                    <div style="width:380px;border-right:1px solid var(--border-main);padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:4px;align-content:start;overflow-y:auto;" id="pa-plat-grid">
                        ${gridHtml}
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;min-width:0;" id="pa-plat-detail">
                        ${detailHtml}
                    </div>
                </div>
            </div>
        `;

        // Bind events
        document.getElementById('pa-plat-close')?.addEventListener('click', () => overlay.classList.remove('active'));
        overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('active'); };

        document.getElementById('pa-plat-grid')?.addEventListener('click', (e) => {
            const card = e.target.closest('.pa-plat-card');
            if (!card) return;
            selectedPlatformId = card.dataset.plat;
            confirming = false;
            render();
        });

        document.getElementById('pa-plat-adopt')?.addEventListener('click', () => {
            confirming = true;
            render();
        });

        document.getElementById('pa-plat-conf-cancel')?.addEventListener('click', () => {
            confirming = false;
            render();
        });

        document.getElementById('pa-plat-conf-yes')?.addEventListener('click', () => submitPlatformAdoption(root, selectedPlatformId));
    }

    overlay.classList.add('active');
    render();
}

let _platformSubmitting = false;

async function submitPlatformAdoption(root, platformKey) {
    if (_platformSubmitting) return;
    _platformSubmitting = true;

    const overlay = document.getElementById('pa-platform-modal');
    const faction = _state.faction;
    const nation = _state.nation;
    if (!faction || !nation || !platformKey) { _platformSubmitting = false; return; }

    const platform = PLATFORMS.find(p => p.id === platformKey);
    if (!platform) return;

    // Build baseline and target stats from the nation's current values
    const baselineStats = {};
    const targetStats = {};
    const isBadStat = (s) => BAD_STATS.has(s);

    for (const stat of platform.improve) {
        const current = Number(nation[stat] ?? 50);
        baselineStats[stat] = current;
        // For bad stats, improve means lower; for good stats, improve means higher
        if (isBadStat(stat)) {
            targetStats[stat] = Math.max(0, current - PROMISE_DELTA);
        } else {
            targetStats[stat] = Math.min(100, current + PROMISE_DELTA);
        }
    }

    try {
        const tick = _state.shard?.current_tick || 0;
        const { data, error } = await _supabase.rpc('adopt_platform', {
            p_faction_id: faction.id,
            p_nation_id: nation.id,
            p_platform_key: platformKey,
            p_tick: tick,
            p_baseline_stats: baselineStats,
            p_target_stats: targetStats,
        });

        if (error) {
            console.error('[PartyActions] Platform adoption failed:', error.message);
            alert('Failed to adopt platform: ' + error.message);
            return;
        }

        if (data && !data.success) {
            alert(data.error || 'Failed to adopt platform.');
            return;
        }

        // Update local state
        const newSlot = data?.slot || (_myPlatforms.length + 1);
        _myPlatforms.push({
            faction_id: faction.id,
            nation_id: nation.id,
            platform_key: platformKey,
            slot: newSlot,
            adopted_at_tick: tick,
            baseline_stats: baselineStats,
            target_stats: targetStats,
            status: 'active',
        });
        _nationPlatforms.push(_myPlatforms[_myPlatforms.length - 1]);

        if (faction && data?.momentum_gained) {
            faction.momentum = (faction.momentum || 0) + data.momentum_gained;
        }
        // AP was deducted server-side by deduct_ap() inside the RPC.
        // Estimate locally (server is source of truth, will refresh on next page load).
        if (faction) faction.action_points = Math.max(0, (faction.action_points || 0) - 2);

        overlay?.classList.remove('active');
        renderPage(root);
    } catch (err) {
        console.error('[PartyActions] Platform adoption error:', err);
        alert('An error occurred. Please try again.');
    } finally {
        _platformSubmitting = false;
    }
}
