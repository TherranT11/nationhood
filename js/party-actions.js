// js/party-actions.js — Party Actions tab UI
// Renders leader sidebar, actions panel, platform slots.

import { PLATFORMS, STAT_NAMES, BAD_STATS, statDirection, platformMomentumInfo } from './game/platforms.js';
import { getPromiseProgress } from './game/platform-promises.js';
import { fetchActiveAgitator, fetchOrGeneratePool, hireAgitator, checkOppositionStatus, getSkillLabel, calculateAgitatorCost } from './game/agitator.js';
import { LAWSUIT_TARGETS, LAWSUIT_BASES, calculateTier, TIER_EFFECTS, fileLawsuit, fetchActiveLawsuits } from './game/lawsuits.js';

let _supabase = null;
let _state = null;
let _selectedRole = 'leader';
let _myPlatforms = [];
let _nationPlatforms = [];
let _agitator = null;        // hired agitator or null
let _isOpposition = false;   // is this faction in opposition?
let _administration = null;  // active administration data
let _lawsuits = [];          // faction's lawsuits (active + resolved) // all platforms in this nation (for momentum calc)

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

// Leader actions (only Issue Statement and Set Party Platform are live)
const LEADER_ACTIONS = [
    {
        id: 'statement',
        name: 'Issue Statement',
        desc: 'Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.',
        cost: 'FREE',
        costColor: '#5cc55c',
        ap: 1,
        tags: ['PUBLIC', 'NARRATIVE'],
        locked: false,
    },
    {
        id: 'platform',
        name: 'Set Party Platform',
        desc: 'Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.',
        cost: 'FREE',
        costColor: '#5cc55c',
        ap: 2,
        tags: ['STRATEGIC'],
        locked: false,
    },
];

const TAG_COLORS = {
    PUBLIC: '#8b9a6b', NARRATIVE: '#5a8aaa', STRATEGIC: '#c8a832',
    INTERNAL: '#c84', COALITION: '#5aaa8a', RISKY: '#c55',
    PARLIAMENTARY: '#8b9a6b', FINANCIAL: '#5a8aaa', INTELLIGENCE: '#5a8aaa',
    DEFENSIVE: '#5cc55c', CAMPAIGN: '#c84', VOTER: '#c8a832',
    OFFENSIVE: '#c84', REACTIVE: '#ca5', STRUCTURAL: '#9e9a92',
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

    // Fetch platforms + agitator + opposition status in parallel
    const [myPlat, nationPlat, agitatorResult, oppositionResult] = await Promise.all([
        _supabase.from('faction_platforms').select('*').eq('faction_id', faction.id).order('slot'),
        _supabase.from('faction_platforms').select('*').eq('nation_id', state.nation?.id),
        fetchActiveAgitator(_supabase, faction.id),
        checkOppositionStatus(_supabase, state.nation?.id, faction.id),
    ]);

    if (myPlat.error) console.error('[PartyActions] Failed to load faction platforms:', myPlat.error.message);
    if (nationPlat.error) console.error('[PartyActions] Failed to load nation platforms:', nationPlat.error.message);
    _myPlatforms = myPlat.data || [];
    _nationPlatforms = nationPlat.data || [];
    _agitator = agitatorResult;
    _isOpposition = oppositionResult.isOpposition;
    _administration = oppositionResult.administration;

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
    const partyColor = faction.color || '#c8a832';
    const leaderName = faction.leader_first_name && faction.leader_last_name
        ? `${faction.leader_first_name} ${faction.leader_last_name}` : 'Unknown Leader';
    const seats = faction.seats || 0;
    const totalSeats = nation?.total_seats || 120;
    const seatPct = totalSeats > 0 ? Math.round((seats / totalSeats) * 100) : 0;
    const ap = faction.action_points ?? 0;
    const approval = faction.approval_rating ?? 0;
    const momentum = faction.momentum ?? 50;

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
                    <span class="pa-title" style="color:${partyColor};">Party Actions</span>
                    <div class="pa-party-badge">
                        <div class="pa-party-dot" style="background:${partyColor};"></div>
                        <span class="pa-party-name">${esc(faction.faction_name)}</span>
                    </div>
                </div>
                <div class="pa-header-stats">
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">Actions</div>
                        <div class="pa-header-stat-value" style="color:var(--accent);">${ap} AP</div>
                    </div>
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">Momentum</div>
                        <div class="pa-header-stat-value" style="color:var(--text-bright);">${momentum}</div>
                    </div>
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">Approval</div>
                        <div class="pa-header-stat-value" style="color:#ca5;">${approval}%</div>
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
        if (actionId === 'statement') {
            openStatementModal(root);
        } else if (actionId === 'platform') {
            openPlatformModal(root);
        } else if (actionId === 'file_lawsuit') {
            openLawsuitModal(root);
        }
    });

    // Bind hire agitator button
    document.getElementById('pa-hire-agitator-btn')?.addEventListener('click', () => openHireAgitatorModal(root));
    document.getElementById('pa-hire-agitator-panel')?.addEventListener('click', (e) => {
        if (e.target.closest('#pa-hire-agitator-btn')) return; // let button handle it
        openHireAgitatorModal(root);
    });
}

function renderLeaderCards(leaderName, partyColor, faction) {
    return ROLES.map(role => {
        const isLeader = role.id === 'leader';
        const isAgitator = role.id === 'agitator';
        const isActive = _selectedRole === role.id;

        // Agitator: populated if hired, otherwise hireable
        let isVacant, name, portrait, actionCount;
        if (isLeader) {
            isVacant = false;
            name = leaderName;
            portrait = initials(faction.leader_first_name, faction.leader_last_name);
            actionCount = LEADER_ACTIONS.length;
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
        } else {
            isVacant = true;
            name = 'Vacant';
            portrait = '\u2014';
            actionCount = 0;
        }

        let html = `
            <div class="pa-leader-card ${isActive ? 'active' : ''} ${isVacant ? 'vacant' : ''}"
                 data-role="${role.id}"
                 style="${isActive ? `border-left-color:${role.color};` : ''}">
                ${role.oppositionOnly ? '<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:#d44a4a;background:rgba(212,74,74,0.1);border:1px solid rgba(212,74,74,0.2);border-top:none;border-right:none;">OPPOSITION ONLY</div>' : ''}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${role.color};background:${role.color}15;border-color:${role.color}33;">${portrait}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${role.color};">${role.title}</span>
                            ${actionCount > 0 ? `<span class="pa-leader-role-count">${actionCount} actions</span>` : ''}
                        </div>
                        <div class="pa-leader-name">${esc(name)}</div>
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
    const isVacant = !isLeader && !isAgitator;

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

    const portrait = initials(faction.leader_first_name, faction.leader_last_name);
    const age = faction.leader_age ? `, Age ${faction.leader_age}` : '';

    const actionsHtml = LEADER_ACTIONS.map(action => {
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
                        ${action.ap > 0 ? `<span class="pa-action-ap">${action.ap} AP</span>` : ''}
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
                        <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${role.color};">${role.title}</span>
                        <span class="pa-detail-name">${esc(leaderName)}</span>
                    </div>
                    <div class="pa-detail-meta">${esc(role.fullTitle)} &middot; ${esc(faction.faction_name)}${age}</div>
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

// ════════════════════════ AGITATOR ACTIONS PANEL ════════════════════════

const AGITATOR_ACTIONS = [
    {
        id: 'file_lawsuit',
        name: 'File Lawsuit',
        desc: 'Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.',
        cost: 'FREE',
        costColor: '#5cc55c',
        ap: 0,
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
                        <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${role.color};">${role.title}</span>
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
                            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright);">FREE</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:3px;">No AP or money cost</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;">Hire ${esc(selected.first_name)}</button>
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
                const result = await hireAgitator(_supabase, _state.faction?.id, candidates[selectedIdx], tick);
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
                <span style="font-size:14px;">${t.icon}</span>
                <span style="font-size:9px;font-weight:600;color:${isSel ? 'var(--text-bright)' : 'var(--text-secondary)'};">${esc(t.label)}</span>
            </div>`;
        }).join('');

        const basesHtml = LAWSUIT_BASES.map(b => {
            const isSel = selectedBasis === b.key;
            return `<div class="pa-lawsuit-basis ${isSel ? 'selected' : ''}" data-basis="${b.key}">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:12px;height:12px;border-radius:50%;border:2px solid ${isSel ? '#d44a4a' : 'var(--border-mid)'};display:flex;align-items:center;justify-content:center;">
                        ${isSel ? '<div style="width:6px;height:6px;border-radius:50%;background:#d44a4a;"></div>' : ''}
                    </div>
                    <div>
                        <div style="font-size:10px;font-weight:600;color:${isSel ? 'var(--text-bright)' : 'var(--text-secondary)'};">${esc(b.label)}</div>
                        <div style="font-size:8px;color:var(--text-dim);margin-top:1px;">${esc(b.desc)}</div>
                    </div>
                </div>
            </div>`;
        }).join('');

        overlay.innerHTML = `
            <div class="pa-modal" style="width:560px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#d44a4a;"></div>
                        <span class="pa-modal-title">File Lawsuit</span>
                        <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:#5a8aaa;background:rgba(90,138,170,0.08);border:1px solid rgba(90,138,170,0.2);margin-left:6px;">LEGAL</span>
                        <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:#c84;background:rgba(200,132,0,0.08);border:1px solid rgba(200,132,0,0.2);">OFFENSIVE</span>
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
                alert(`Lawsuit filed against ${LAWSUIT_TARGETS.find(t => t.key === selectedTarget)?.label || selectedTarget}.\nCorruption Growth: ${result.lawsuit?.corruption_growth?.toFixed(1) || '?'} \u2192 Tier ${result.tier}: ${tierInfo.label}\nResolves in 8 ticks.`);

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
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">Min 50 characters</span>
                    </div>
                </div>
                <div style="padding:6px 10px;background:var(--amber-faint);border:1px solid var(--amber-border);">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-bottom:2px;">COST</div>
                    <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                        Issuing a statement costs <strong style="color:var(--text-bright);">1 AP</strong>.
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

    // Topic selection
    document.getElementById('pa-stmt-topics')?.addEventListener('click', (e) => {
        const card = e.target.closest('.pa-topic-card');
        if (!card) return;
        selectedTopic = card.dataset.topic;
        document.querySelectorAll('.pa-topic-card').forEach(c => {
            const isActive = c.dataset.topic === selectedTopic;
            c.style.borderColor = isActive ? partyColor : '';
            c.style.background = isActive ? partyColor + '0a' : '';
            const label = c.querySelector('span:last-child');
            if (label) label.style.color = isActive ? 'var(--text-bright)' : '';
        });
        updateSubmitState();
    });

    // Body input
    const updateSubmitState = () => {
        const body = document.getElementById('pa-stmt-body')?.value?.trim() || '';
        const btn = document.getElementById('pa-stmt-submit');
        const cc = document.getElementById('pa-stmt-charcount');
        if (cc) cc.textContent = `${body.length} characters`;
        if (btn) btn.disabled = !(selectedTopic && body.length >= 50);
    };
    document.getElementById('pa-stmt-body')?.addEventListener('input', updateSubmitState);

    // Submit
    document.getElementById('pa-stmt-submit')?.addEventListener('click', async () => {
        if (submitting) return;
        const body = document.getElementById('pa-stmt-body')?.value?.trim();
        if (!selectedTopic || !body || body.length < 50) return;

        submitting = true;
        const btn = document.getElementById('pa-stmt-submit');
        if (btn) { btn.disabled = true; btn.textContent = 'Issuing...'; }

        try {
            const tick = _state.shard?.current_tick || 0;
            const topicDef = STATEMENT_TOPICS.find(t => t.id === selectedTopic);
            const topicLabel = topicDef?.label || selectedTopic;

            // 1. Deduct AP
            const { data: apResult, error: apErr } = await _supabase.rpc('deduct_ap', {
                p_faction_id: faction.id,
                p_cost: 1,
            });

            if (apErr || (apResult != null && apResult < 0)) {
                const currentAp = apResult != null ? -(apResult) - 1 : '?';
                alert(`Not enough AP. You have ${currentAp} AP, need 1.`);
                return;
            }

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

            // 5. Update local state and close
            if (faction) faction.action_points = apResult;
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
