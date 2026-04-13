// js/party-actions.js — Party Actions tab UI
// Renders leader sidebar, actions panel, platform slots.

import { PLATFORMS, STAT_NAMES, statDirection, platformMomentumInfo } from './game/platforms.js';

let _supabase = null;
let _state = null;
let _selectedRole = 'leader';
let _myPlatforms = [];
let _nationPlatforms = []; // all platforms in this nation (for momentum calc)

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
        locked: true, // Phase 3 unlocks this
        lockReason: 'Coming in a future update.',
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

    // Fetch platforms
    const [myPlat, nationPlat] = await Promise.all([
        _supabase.from('faction_platforms').select('*').eq('faction_id', faction.id).order('slot'),
        _supabase.from('faction_platforms').select('*').eq('nation_id', state.nation?.id),
    ]);

    _myPlatforms = myPlat.data || [];
    _nationPlatforms = nationPlat.data || [];

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

    // Platform slots display
    const slotLabels = [];
    for (let i = 1; i <= 3; i++) {
        const p = _myPlatforms.find(fp => fp.slot === i);
        if (p) {
            const def = PLATFORMS.find(d => d.id === p.platform_key);
            slotLabels.push(def?.name || p.platform_key);
        } else {
            slotLabels.push(null);
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
                        ${slotLabels.map(s => s
                            ? `<span class="pa-platform-slot filled">${esc(s)}</span>`
                            : '<span class="pa-platform-slot">No Platform</span>'
                        ).join('')}
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
        if (actionId === 'platform') {
            // Phase 4 will implement the platform modal
        }
    });
}

function renderLeaderCards(leaderName, partyColor, faction) {
    return ROLES.map(role => {
        const isLeader = role.id === 'leader';
        const isActive = _selectedRole === role.id;
        const isVacant = !isLeader;
        const name = isLeader ? leaderName : 'Vacant';
        const portrait = isLeader ? initials(faction.leader_first_name, faction.leader_last_name) : '—';
        const actionCount = isLeader ? LEADER_ACTIONS.length : 0;

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
                            ${!isVacant ? `<span class="pa-leader-role-count">${actionCount} actions</span>` : ''}
                        </div>
                        <div class="pa-leader-name">${esc(name)}</div>
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
    const isVacant = !isLeader;

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
