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

        <!-- Statement Modal -->
        <div class="pa-modal-overlay" id="pa-statement-modal"></div>
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
