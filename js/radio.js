// js/radio.js — Radio Broadcast System UI
// Renders station listing, station sidebar, broadcast feed, and Create Station modal.

let _supabase = null;
let _state = null;
let _stations = [];
let _selectedStationId = null;
let _broadcasts = [];
let _personalities = [];
let _factionIdeology = null; // cached faction_ideology row for political station gating
let _myGoodListens = new Set(); // broadcast IDs the current faction has good-listened
let _expandedBroadcastId = null; // currently expanded broadcast in the feed

// Station type config
const STATION_TYPES = [
    { id: 'general', name: 'General News', desc: 'Broad coverage. Wide appeal. Moderate influence per broadcast.', locked: false },
    { id: 'opposition', name: 'Opposition', desc: 'Anti-government lean. High credibility with dissidents.', locked: false },
    { id: 'political', name: 'Political', desc: 'Ideology-aligned. Only parties with 20+ in the ideology can broadcast.', locked: false },
    { id: 'underground', name: 'Underground / Pirate', desc: 'Evades detection. Can be raided. High trust among radicals.', locked: false },
    { id: 'commercial', name: 'Commercial / Pro-Business', desc: 'Financed by advertisers. High reach. Biased toward corporate interests.', locked: false },
    { id: 'state', name: 'State Station', desc: 'Requires government ownership or a ruling party mandate.', locked: true },
];

const IDEOLOGY_TAGS = [
    { tag: 'LIBERTY', label: 'Liberty', color: '#3b82f6' },
    { tag: 'EQUALITY', label: 'Equality', color: '#ef4444' },
    { tag: 'TRADITION', label: 'Tradition', color: '#a855f7' },
    { tag: 'PROGRESS', label: 'Progress', color: '#22c55e' },
    { tag: 'SECURITY', label: 'Security', color: '#f59e0b' },
    { tag: 'FREEDOM', label: 'Freedom', color: '#06b6d4' },
    { tag: 'GLOBALISM', label: 'Globalism', color: '#14b8a6' },
    { tag: 'NATIONALISM', label: 'Nationalism', color: '#f97316' },
    { tag: 'INDIVIDUALISM', label: 'Individualism', color: '#eab308' },
    { tag: 'COLLECTIVISM', label: 'Collectivism', color: '#ec4899' },
];

const TYPE_COLORS = {
    general: 'var(--accent)',
    opposition: 'var(--red)',
    political: '#8b7ec8',
    underground: 'var(--orange)',
    commercial: 'var(--blue)',
    state: 'var(--amber)',
};

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function initials(name) {
    return (name || '??').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Ideology tag → axis key + direction mapping (matches ideology.js)
const IDEOLOGY_AXIS_MAP = {
    'LIBERTY': { axis: 'liberty_equality', dir: -1 },
    'EQUALITY': { axis: 'liberty_equality', dir: 1 },
    'TRADITION': { axis: 'tradition_progress', dir: -1 },
    'PROGRESS': { axis: 'tradition_progress', dir: 1 },
    'SECURITY': { axis: 'security_freedom', dir: -1 },
    'FREEDOM': { axis: 'security_freedom', dir: 1 },
    'GLOBALISM': { axis: 'globalism_nationalism', dir: -1 },
    'NATIONALISM': { axis: 'globalism_nationalism', dir: 1 },
    'INDIVIDUALISM': { axis: 'individualism_collectivism', dir: -1 },
    'COLLECTIVISM': { axis: 'individualism_collectivism', dir: 1 },
};

// Check if the current faction has 20+ toward a given ideology tag
function hasIdeologyAccess(ideologyTag, station) {
    if (!ideologyTag) return true;
    // Station creator always has access
    if (station && station.creator_faction_id === _state.faction?.id) return true;
    if (!_factionIdeology) return false;
    const mapping = IDEOLOGY_AXIS_MAP[ideologyTag];
    if (!mapping) return false;
    const score = Number(_factionIdeology[mapping.axis] || 0);
    // Score is negative for "left" ideologies, positive for "right"
    // dir=-1 means left, so we need score <= -20; dir=1 means right, so score >= 20
    return (score * mapping.dir) >= 20;
}

// Check if the current faction can create a personality on this station
function canCreatePersonality(station) {
    const myCount = _personalities.filter(p => p.faction_id === _state.faction?.id).length;
    if (myCount >= 3) return { allowed: false, reason: 'Maximum 3 personalities per party per station.' };
    if (station.station_type === 'political' && !hasIdeologyAccess(station.ideology, station)) {
        const tag = IDEOLOGY_TAGS.find(i => i.tag === station.ideology);
        return { allowed: false, reason: `Requires 20+ ${tag?.label || station.ideology} ideology to join this station.` };
    }
    return { allowed: true, reason: null };
}

// ════════════════════════ INIT ════════════════════════

export async function initRadio(supabase, state) {
    _supabase = supabase;
    _state = state;

    const root = document.getElementById('broadcast-root');
    if (!root) return;

    // Fetch stations for this nation
    const nationId = state.nation?.id;
    if (!nationId) {
        root.innerHTML = '<div class="radio-empty"><div class="radio-empty-icon">&#128225;</div><div class="radio-empty-title">No Nation</div><div class="radio-empty-desc">Your party is not assigned to a nation.</div></div>';
        return;
    }

    // Fetch stations + faction ideology in parallel
    const [stationsResult, ideoResult] = await Promise.all([
        _supabase.from('radio_stations').select('*').eq('nation_id', nationId).order('created_at', { ascending: true }),
        _supabase.from('faction_ideology').select('*').eq('faction_id', state.faction?.id).maybeSingle(),
    ]);

    if (stationsResult.error) {
        console.error('[Radio] Failed to load stations:', stationsResult.error.message);
        root.innerHTML = '<div class="radio-empty"><div class="radio-empty-title">Error loading stations</div></div>';
        return;
    }

    _stations = stationsResult.data || [];
    _factionIdeology = ideoResult.data || null;

    renderRadioPage(root);
}

// ════════════════════════ RENDER PAGE ════════════════════════

function renderRadioPage(root) {
    const nationName = _state.nation?.name || 'Unknown';
    const stationCount = _stations.length;

    root.innerHTML = `
        <div class="radio-page">
            <!-- Header -->
            <div class="radio-header">
                <div class="radio-header-left">
                    <span class="radio-title">Radio</span>
                    <span class="radio-nation-badge">${esc(nationName)}</span>
                    <span class="radio-station-count">${stationCount} station${stationCount !== 1 ? 's' : ''}</span>
                </div>
                <div class="radio-header-actions">
                    <button class="radio-btn radio-btn--outline" id="radio-broadcast-btn" style="display:none;">Start Broadcast</button>
                    <button class="radio-btn radio-btn--primary" id="radio-create-btn">Create Station</button>
                </div>
            </div>

            ${stationCount === 0 ? renderEmptyState() : renderStationView()}
        </div>

        <!-- Create Station Modal -->
        <div class="radio-modal-overlay" id="radio-create-modal">
            ${renderCreateStationModal()}
        </div>

        <!-- Create Personality Modal -->
        <div class="radio-modal-overlay" id="radio-personality-modal"></div>

        <!-- Start Broadcast Modal -->
        <div class="radio-modal-overlay" id="radio-broadcast-modal"></div>
    `;

    // Bind create button
    document.getElementById('radio-create-btn')?.addEventListener('click', openCreateModal);

    // Bind station tabs
    if (stationCount > 0) {
        if (!_selectedStationId || !_stations.find(s => s.id === _selectedStationId)) {
            _selectedStationId = _stations[0].id;
        }
        bindStationTabs();
        selectStation(_selectedStationId);
    }

    // Bind modal
    bindCreateModal();
}

function renderEmptyState() {
    return `
        <div class="radio-empty">
            <div class="radio-empty-icon">&#128225;</div>
            <div class="radio-empty-title">No Stations in ${esc(_state.nation?.name || 'this nation')}</div>
            <div class="radio-empty-desc">Be the first to launch a radio station and start broadcasting to your nation.</div>
        </div>
    `;
}

function renderStationView() {
    // Station tabs
    const tabsHtml = _stations.map(s => {
        const color = TYPE_COLORS[s.station_type] || 'var(--text-dim)';
        return `
            <div class="radio-station-tab" data-station-id="${s.id}">
                <div class="radio-station-tab-top">
                    <div class="radio-station-dot" style="background:${color};color:${color};"></div>
                    <span class="radio-station-tab-call">${esc(s.callsign)}</span>
                </div>
                <div class="radio-station-tab-freq">${esc(s.frequency)}</div>
                <div class="radio-station-tab-bottom">
                    <span class="radio-station-tab-type" style="color:${color};">${esc(s.station_type.toUpperCase())}</span>
                </div>
            </div>
        `;
    }).join('');

    return `
        <!-- Station tabs -->
        <div class="radio-station-tabs" id="radio-station-tabs">${tabsHtml}</div>

        <!-- Main: sidebar + feed -->
        <div class="radio-main">
            <div class="radio-sidebar" id="radio-sidebar"></div>
            <div class="radio-feed" id="radio-feed">
                <div class="radio-feed-header">
                    <span class="radio-feed-title">Broadcasts</span>
                    <span class="radio-feed-count" id="radio-feed-count"></span>
                </div>
                <div class="radio-feed-scroll" id="radio-feed-scroll"></div>
            </div>
        </div>
    `;
}

// ════════════════════════ STATION SELECTION ════════════════════════

function bindStationTabs() {
    document.getElementById('radio-station-tabs')?.addEventListener('click', (e) => {
        const tab = e.target.closest('.radio-station-tab');
        if (!tab) return;
        selectStation(tab.dataset.stationId);
    });
}

async function selectStation(stationId) {
    _selectedStationId = stationId;
    const station = _stations.find(s => s.id === stationId);
    if (!station) return;

    // Update tab active state
    document.querySelectorAll('.radio-station-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.stationId === stationId);
        const color = TYPE_COLORS[_stations.find(s => s.id === t.dataset.stationId)?.station_type] || 'var(--text-dim)';
        if (t.dataset.stationId === stationId) {
            t.style.borderColor = color;
            t.style.borderBottomColor = color;
        } else {
            t.style.borderColor = '';
            t.style.borderBottomColor = 'transparent';
        }
    });

    // Fetch personalities, broadcasts, and user's good listens in parallel
    const factionId = _state.faction?.id;
    const [persResult, bcResult, glResult] = await Promise.all([
        _supabase.from('radio_personalities').select('*').eq('station_id', stationId),
        _supabase.from('radio_broadcasts').select('*').eq('station_id', stationId).order('created_at', { ascending: false }).limit(50),
        factionId ? _supabase.from('broadcast_good_listens').select('broadcast_id').eq('faction_id', factionId) : { data: [] },
    ]);

    _personalities = persResult.data || [];
    _broadcasts = bcResult.data || [];
    _myGoodListens = new Set((glResult.data || []).map(r => r.broadcast_id));
    _expandedBroadcastId = null;

    // Show/hide Start Broadcast button based on whether user has a personality on this station
    const myPers = _personalities.filter(p => p.faction_id === factionId);
    const bcBtn = document.getElementById('radio-broadcast-btn');
    if (bcBtn) {
        bcBtn.style.display = myPers.length > 0 ? '' : 'none';
        bcBtn.onclick = () => openBroadcastModal(station);
    }

    renderSidebar(station);
    renderFeed(station);
}

// ════════════════════════ SIDEBAR ════════════════════════

function renderSidebar(station) {
    const el = document.getElementById('radio-sidebar');
    if (!el) return;

    const color = TYPE_COLORS[station.station_type] || 'var(--text-dim)';
    const myPersonalities = _personalities.filter(p => p.faction_id === _state.faction?.id);
    const allPersonalities = _personalities;

    const persHtml = allPersonalities.length > 0
        ? allPersonalities.map(p => `
            <div class="radio-personality-row">
                <div class="radio-personality-avatar" style="color:${color};">${initials(p.name)}</div>
                <div>
                    <div class="radio-personality-name">${esc(p.name)}</div>
                    ${p.title ? `<div class="radio-personality-title">${esc(p.title)}</div>` : ''}
                </div>
            </div>
        `).join('')
        : '<div style="font-size:8px;color:var(--text-dim);font-style:italic;">No personalities yet.</div>';

    const typeLabel = station.station_type.charAt(0).toUpperCase() + station.station_type.slice(1);
    const ideologyLabel = station.ideology ? ` (${station.ideology})` : '';

    el.innerHTML = `
        <div class="radio-sidebar-freq">
            <div class="radio-sidebar-dot" style="background:${color};box-shadow:0 0 6px ${color}44;"></div>
            <span class="radio-sidebar-freq-label" style="color:${color};">${esc(station.frequency)}</span>
        </div>
        <div class="radio-sidebar-name">${esc(station.callsign)} &mdash; ${esc(station.name)}</div>
        ${station.description ? `<div class="radio-sidebar-desc">${esc(station.description)}</div>` : ''}

        <div class="radio-sidebar-row">
            <span class="radio-sidebar-label">Type</span>
            <span class="radio-sidebar-value" style="color:${color};">${esc(typeLabel)}${esc(ideologyLabel)}</span>
        </div>
        <div class="radio-sidebar-row">
            <span class="radio-sidebar-label">Broadcasts</span>
            <span class="radio-sidebar-value">${_broadcasts.length}</span>
        </div>
        <div class="radio-sidebar-row">
            <span class="radio-sidebar-label">Personalities</span>
            <span class="radio-sidebar-value">${allPersonalities.length}</span>
        </div>

        <div class="radio-sidebar-section">
            <div class="radio-sidebar-section-title">Personalities</div>
            ${persHtml}
            ${renderCreatePersonalityButton(station)}
        </div>
    `;

    // Bind Create Personality button
    document.getElementById('radio-create-pers-btn')?.addEventListener('click', () => openPersonalityModal(station));
}

function renderCreatePersonalityButton(station) {
    const check = canCreatePersonality(station);
    if (!check.allowed) {
        return `<div style="margin-top:8px;padding:5px 8px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);border:1px solid var(--border-main);text-align:center;opacity:0.6;" title="${esc(check.reason)}">${esc(check.reason)}</div>`;
    }
    return `<div class="radio-sidebar-cta" id="radio-create-pers-btn">Create Personality</div>`;

// ════════════════════════ FEED ════════════════════════

function renderFeed(station) {
    const countEl = document.getElementById('radio-feed-count');
    const scrollEl = document.getElementById('radio-feed-scroll');
    if (!countEl || !scrollEl) return;

    countEl.textContent = `${_broadcasts.length} broadcast${_broadcasts.length !== 1 ? 's' : ''}`;

    if (_broadcasts.length === 0) {
        scrollEl.innerHTML = `
            <div class="radio-feed-empty">
                <div class="radio-feed-empty-text">No broadcasts yet.</div>
                <div class="radio-feed-empty-sub">Be the first to go live on this station.</div>
            </div>
        `;
        return;
    }

    scrollEl.innerHTML = _broadcasts.map(bc => {
        const tags = (bc.tags || []);
        const tagsHtml = tags.map(t =>
            `<span style="padding:1px 5px;font-family:var(--font-mono);font-size:6px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-mid);line-height:11px;">${esc(t)}</span>`
        ).join('');

        const personality = _personalities.find(p => p.id === bc.personality_id);
        const persName = personality?.name || 'Unknown';
        const isExpanded = _expandedBroadcastId === bc.id;
        const isGoodListened = _myGoodListens.has(bc.id);

        const bodyStyle = isExpanded
            ? 'font-family:var(--font-serif);font-size:11px;color:var(--text-secondary);line-height:1.7;margin-bottom:8px;'
            : 'font-family:var(--font-serif);font-size:11px;color:var(--text-secondary);line-height:1.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;';

        const glBtnStyle = isGoodListened
            ? 'padding:3px 10px;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.04em;color:var(--bg-body);background:var(--green);border:1px solid var(--green);'
            : 'padding:3px 10px;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.04em;color:var(--green);background:transparent;border:1px solid var(--green-border);';

        return `
            <div style="border-bottom:1px solid var(--border-main);">
                <div style="padding:10px 16px;cursor:pointer;" data-bc-toggle="${bc.id}">
                    <div style="font-family:var(--font-serif);font-size:14px;font-weight:600;color:var(--text-bright);line-height:1.3;margin-bottom:4px;">${esc(bc.subject)}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${esc(persName)}</span>
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">&middot;</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Tick ${bc.published_tick || '?'}</span>
                    </div>
                    <div style="${bodyStyle}">${esc(bc.body)}</div>
                    ${tagsHtml ? `<div style="display:flex;gap:3px;margin-top:6px;flex-wrap:wrap;">${tagsHtml}</div>` : ''}
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:6px;border-top:1px solid var(--border-main);">
                        <div style="display:flex;gap:10px;">
                            <div style="display:flex;align-items:center;gap:3px;">
                                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">GOOD LISTENS</span>
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--green);" id="gl-count-${bc.id}">${bc.good_listen_count || 0}</span>
                            </div>
                        </div>
                        <div style="${glBtnStyle}" data-gl-btn="${bc.id}" id="gl-btn-${bc.id}">${isGoodListened ? '\u2713 GOOD LISTEN' : 'GOOD LISTEN'}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Bind expand/collapse
    scrollEl.addEventListener('click', (e) => {
        // Good Listen button
        const glBtn = e.target.closest('[data-gl-btn]');
        if (glBtn) {
            e.stopPropagation();
            toggleGoodListen(glBtn.dataset.glBtn);
            return;
        }
        // Expand/collapse toggle
        const toggle = e.target.closest('[data-bc-toggle]');
        if (toggle) {
            const bcId = toggle.dataset.bcToggle;
            _expandedBroadcastId = _expandedBroadcastId === bcId ? null : bcId;
            renderFeed(station);
        }
    });
}

// ════════════════════════ GOOD LISTEN ════════════════════════

let _glInFlight = new Set();

async function toggleGoodListen(broadcastId) {
    if (_glInFlight.has(broadcastId)) return;
    _glInFlight.add(broadcastId);

    const btn = document.getElementById('gl-btn-' + broadcastId);
    const countEl = document.getElementById('gl-count-' + broadcastId);
    if (btn) btn.style.opacity = '0.5';

    try {
        const tick = _state.shard?.current_tick || 0;
        const { data, error } = await _supabase.rpc('toggle_broadcast_good_listen', {
            p_broadcast_id: broadcastId,
            p_faction_id: _state.faction.id,
            p_tick: tick,
        });

        if (error) {
            console.error('[Radio] Good listen failed:', error.message);
            return;
        }

        // Update local state
        if (data.liked) {
            _myGoodListens.add(broadcastId);
        } else {
            _myGoodListens.delete(broadcastId);
        }

        // Update cached broadcast
        const bc = _broadcasts.find(b => b.id === broadcastId);
        if (bc) bc.good_listen_count = data.good_listen_count;

        // Update UI inline (avoid full re-render to preserve scroll)
        if (btn) {
            if (data.liked) {
                btn.style.color = 'var(--bg-body)';
                btn.style.background = 'var(--green)';
                btn.style.borderColor = 'var(--green)';
                btn.textContent = '\u2713 GOOD LISTEN';
            } else {
                btn.style.color = 'var(--green)';
                btn.style.background = 'transparent';
                btn.style.borderColor = 'var(--green-border)';
                btn.textContent = 'GOOD LISTEN';
            }
        }
        if (countEl) countEl.textContent = data.good_listen_count;
    } catch (err) {
        console.error('[Radio] Good listen error:', err);
    } finally {
        _glInFlight.delete(broadcastId);
        if (btn) btn.style.opacity = '1';
    }
}

// ════════════════════════ START BROADCAST MODAL ════════════════════════

const BROADCAST_TAGS = ['POLITICS', 'ECONOMY', 'CONSTRUCTION', 'LABOR', 'CORRUPTION', 'BUSINESS', 'MILITARY', 'SOCIAL'];

function openBroadcastModal(station) {
    const overlay = document.getElementById('radio-broadcast-modal');
    if (!overlay) return;

    const color = TYPE_COLORS[station.station_type] || 'var(--text-dim)';
    const myPers = _personalities.filter(p => p.faction_id === _state.faction?.id);
    if (myPers.length === 0) return; // shouldn't happen — button is hidden

    const persOptions = myPers.map((p, i) =>
        `<option value="${p.id}" ${i === 0 ? 'selected' : ''}>${esc(p.name)}${p.title ? ' — ' + esc(p.title) : ''}</option>`
    ).join('');

    const tagsHtml = BROADCAST_TAGS.map(t =>
        `<span class="radio-bc-tag" data-tag="${t}" style="padding:3px 7px;font-family:var(--font-mono);font-size:7px;font-weight:700;cursor:pointer;color:var(--text-dim);background:transparent;border:1px solid var(--border-mid);letter-spacing:0.04em;user-select:none;">${t}</span>`
    ).join('');

    overlay.innerHTML = `
        <div class="radio-modal" style="width:500px;">
            <div class="radio-modal-header">
                <div class="radio-modal-header-left">
                    <div class="radio-modal-dot" style="background:${color};"></div>
                    <span class="radio-modal-title">Start Broadcast</span>
                </div>
                <button class="radio-modal-close" id="radio-bc-close">&times;</button>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid var(--border-main);background:${color}08;display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="width:5px;height:5px;border-radius:50%;background:${color};display:inline-block;"></span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Broadcasting on:</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${color};">${esc(station.callsign)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${esc(station.frequency)}</span>
                </div>
            </div>
            <div class="radio-modal-body" style="gap:14px;">
                <div>
                    <div class="radio-modal-step-label">1 &mdash; Personality</div>
                    <select class="radio-modal-input" id="radio-bc-personality" style="font-family:var(--font-ui);font-size:11px;">
                        ${persOptions}
                    </select>
                </div>
                <div>
                    <div class="radio-modal-step-label">2 &mdash; Subject</div>
                    <input class="radio-modal-input" id="radio-bc-subject" placeholder="e.g., Breaking: Port Workers Announce Strike" style="font-family:var(--font-serif);font-size:13px;">
                </div>
                <div>
                    <div class="radio-modal-step-label">3 &mdash; Broadcast Content</div>
                    <textarea class="radio-modal-input" id="radio-bc-body" rows="7" placeholder="Write your broadcast script..." style="resize:none;font-family:var(--font-serif);font-size:11px;line-height:1.65;"></textarea>
                    <div style="display:flex;justify-content:space-between;margin-top:3px;">
                        <span id="radio-bc-charcount" style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">0 characters</span>
                    </div>
                </div>
                <div>
                    <div class="radio-modal-step-label">4 &mdash; Tags</div>
                    <div style="display:flex;gap:3px;flex-wrap:wrap;" id="radio-bc-tags">${tagsHtml}</div>
                </div>
            </div>
            <div class="radio-modal-footer">
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-right:auto;">FREE</span>
                <button class="radio-modal-btn radio-modal-btn--cancel" id="radio-bc-cancel">Cancel</button>
                <button class="radio-modal-btn radio-modal-btn--submit" id="radio-bc-submit" disabled style="background:var(--accent);">Go Live</button>
            </div>
        </div>
    `;

    overlay.classList.add('active');

    const selectedTags = new Set();

    // Close handlers
    const close = () => overlay.classList.remove('active');
    document.getElementById('radio-bc-close')?.addEventListener('click', close);
    document.getElementById('radio-bc-cancel')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // Tag toggle
    document.getElementById('radio-bc-tags')?.addEventListener('click', (e) => {
        const el = e.target.closest('.radio-bc-tag');
        if (!el) return;
        const tag = el.dataset.tag;
        if (selectedTags.has(tag)) {
            selectedTags.delete(tag);
            el.style.color = 'var(--text-dim)';
            el.style.background = 'transparent';
            el.style.borderColor = 'var(--border-mid)';
        } else {
            selectedTags.add(tag);
            el.style.color = 'var(--accent)';
            el.style.background = 'var(--amber-faint)';
            el.style.borderColor = 'var(--amber-border)';
        }
    });

    // Character count + submit enable
    const updateSubmit = () => {
        const subject = document.getElementById('radio-bc-subject')?.value?.trim();
        const body = document.getElementById('radio-bc-body')?.value?.trim();
        const btn = document.getElementById('radio-bc-submit');
        if (btn) btn.disabled = !(subject && body);
        const cc = document.getElementById('radio-bc-charcount');
        if (cc) cc.textContent = `${(body || '').length} characters`;
    };
    document.getElementById('radio-bc-subject')?.addEventListener('input', updateSubmit);
    document.getElementById('radio-bc-body')?.addEventListener('input', updateSubmit);

    // Submit
    let submitting = false;
    document.getElementById('radio-bc-submit')?.addEventListener('click', async () => {
        if (submitting) return;
        const subject = document.getElementById('radio-bc-subject')?.value?.trim();
        const body = document.getElementById('radio-bc-body')?.value?.trim();
        const personalityId = document.getElementById('radio-bc-personality')?.value;
        if (!subject || !body || !personalityId) return;

        submitting = true;
        const btn = document.getElementById('radio-bc-submit');
        if (btn) { btn.disabled = true; btn.textContent = 'Broadcasting...'; }

        try {
            const { data, error } = await _supabase.from('radio_broadcasts').insert({
                station_id: station.id,
                personality_id: personalityId,
                faction_id: _state.faction.id,
                subject: subject,
                body: body,
                tags: [...selectedTags],
                published_tick: _state.shard?.current_tick || null,
            }).select('*').single();

            if (error) {
                console.error('[Radio] Broadcast failed:', error.message);
                alert('Failed to broadcast: ' + error.message);
                return;
            }

            _broadcasts.unshift(data);
            close();
            renderFeed(station);
        } catch (err) {
            console.error('[Radio] Broadcast error:', err);
        } finally {
            submitting = false;
            if (btn) { btn.disabled = false; btn.textContent = 'Go Live'; }
        }
    });
}

// ════════════════════════ CREATE PERSONALITY MODAL ════════════════════════

function openPersonalityModal(station) {
    const overlay = document.getElementById('radio-personality-modal');
    if (!overlay) return;

    const color = TYPE_COLORS[station.station_type] || 'var(--text-dim)';

    overlay.innerHTML = `
        <div class="radio-modal">
            <div class="radio-modal-header">
                <div class="radio-modal-header-left">
                    <div class="radio-modal-dot" style="background:${color};"></div>
                    <span class="radio-modal-title">Create Personality</span>
                </div>
                <button class="radio-modal-close" id="radio-pers-close">&times;</button>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid var(--border-main);background:${color}08;display:flex;align-items:center;gap:8px;">
                <span style="width:5px;height:5px;border-radius:50%;background:${color};display:inline-block;"></span>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Station:</span>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${color};">${esc(station.callsign)} &mdash; ${esc(station.name)}</span>
            </div>
            <div class="radio-modal-body">
                <div>
                    <div class="radio-modal-step-label">Personality Name</div>
                    <input class="radio-modal-input" id="radio-pers-name" placeholder="e.g., Daniela V&aacute;squez" style="font-family:var(--font-ui);font-size:13px;">
                </div>
                <div>
                    <div class="radio-modal-step-label">Title / Role (optional)</div>
                    <input class="radio-modal-input" id="radio-pers-title" placeholder="e.g., Opposition Voice, Economics Desk" style="font-family:var(--font-ui);font-size:11px;">
                </div>
                <div style="padding:6px 10px;background:var(--amber-faint);border:1px solid var(--amber-border);">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-bottom:2px;">INFO</div>
                    <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                        Radio personalities are cosmetic hosts for your broadcasts. You can have up to <strong style="color:var(--text-bright);">3</strong> per station. They will be affiliated with <strong style="color:var(--accent);">${esc(_state.faction?.name || 'your party')}</strong>.
                    </div>
                </div>
            </div>
            <div class="radio-modal-footer">
                <button class="radio-modal-btn radio-modal-btn--cancel" id="radio-pers-cancel">Cancel</button>
                <button class="radio-modal-btn radio-modal-btn--submit" id="radio-pers-submit">Create</button>
            </div>
        </div>
    `;

    overlay.classList.add('active');

    // Bind close
    const close = () => overlay.classList.remove('active');
    document.getElementById('radio-pers-close')?.addEventListener('click', close);
    document.getElementById('radio-pers-cancel')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // Bind submit
    let submitting = false;
    document.getElementById('radio-pers-submit')?.addEventListener('click', async () => {
        if (submitting) return;
        const name = document.getElementById('radio-pers-name')?.value?.trim();
        const title = document.getElementById('radio-pers-title')?.value?.trim();
        if (!name) return;

        submitting = true;
        const btn = document.getElementById('radio-pers-submit');
        if (btn) { btn.disabled = true; btn.textContent = 'Creating...'; }

        try {
            const { data, error } = await _supabase.from('radio_personalities').insert({
                station_id: station.id,
                faction_id: _state.faction.id,
                name: name,
                title: title || null,
            }).select('*').single();

            if (error) {
                console.error('[Radio] Create personality failed:', error.message);
                alert('Failed to create personality: ' + error.message);
                return;
            }

            _personalities.push(data);
            close();
            renderSidebar(station);
        } catch (err) {
            console.error('[Radio] Create personality error:', err);
        } finally {
            submitting = false;
            if (btn) { btn.disabled = false; btn.textContent = 'Create'; }
        }
    });
}

// ════════════════════════ CREATE STATION MODAL ════════════════════════

let _modalState = {
    stationType: 'general',
    ideology: null,
    callsign: '',
    name: '',
    frequency: '92.0',
    description: '',
};

function renderCreateStationModal() {
    const typesHtml = STATION_TYPES.map(t => `
        <div class="radio-type-card ${t.id === _modalState.stationType ? 'active' : ''} ${t.locked ? 'locked' : ''}"
             data-type="${t.id}" ${t.locked ? '' : ''}>
            <div>
                <div class="radio-type-name" style="color:${t.id === _modalState.stationType ? TYPE_COLORS[t.id] : ''};">${esc(t.name)}</div>
                <div class="radio-type-desc">${esc(t.desc)}</div>
            </div>
            ${t.locked ? '<span style="font-size:8px;color:var(--red);font-family:var(--font-mono);font-weight:700;">LOCKED</span>' : ''}
        </div>
    `).join('');

    const ideologyHtml = IDEOLOGY_TAGS.map(i => `
        <div class="radio-ideology-card ${_modalState.ideology === i.tag ? 'active' : ''}"
             data-ideology="${i.tag}" style="${_modalState.ideology === i.tag ? `color:${i.color};border-color:${i.color}44;background:${i.color}12;` : ''}">
            ${i.label}
        </div>
    `).join('');

    // Existing station frequencies for the band display
    const existingFreqs = _stations.map(s => {
        const num = parseFloat(s.frequency);
        return isNaN(num) ? null : { freq: num, callsign: s.callsign, color: TYPE_COLORS[s.station_type] || 'var(--text-dim)' };
    }).filter(Boolean);

    const markersHtml = existingFreqs.map(f =>
        `<div class="radio-freq-marker" style="background:${f.color};left:${((f.freq - 87.5) / 20.5 * 100)}%;" title="${f.freq} ${f.callsign}"></div>`
    ).join('');

    const legendHtml = existingFreqs.map(f =>
        `<span class="radio-freq-legend-item"><span class="radio-freq-legend-dot" style="background:${f.color};"></span><span style="color:${f.color};">${f.freq} ${f.callsign}</span></span>`
    ).join('');

    const cursorPct = ((parseFloat(_modalState.frequency) - 87.5) / 20.5 * 100);

    return `
        <div class="radio-modal">
            <div class="radio-modal-header">
                <div class="radio-modal-header-left">
                    <div class="radio-modal-dot"></div>
                    <span class="radio-modal-title">Start a Station</span>
                </div>
                <button class="radio-modal-close" id="radio-modal-close">&times;</button>
            </div>
            <div class="radio-modal-body">

                <!-- Step 1: Station Type -->
                <div>
                    <div class="radio-modal-step-label">1 &mdash; Station Type</div>
                    <div class="radio-type-grid" id="radio-type-grid">${typesHtml}</div>
                    <div class="radio-ideology-grid ${_modalState.stationType === 'political' ? 'visible' : ''}" id="radio-ideology-grid">${ideologyHtml}</div>
                </div>

                <!-- Step 2: Frequency -->
                <div>
                    <div class="radio-modal-step-label">2 &mdash; Frequency Band</div>
                    <div class="radio-freq-band">
                        ${markersHtml}
                        <div class="radio-freq-cursor" id="radio-freq-cursor" style="left:${cursorPct}%;"></div>
                        <input type="range" class="radio-freq-range" id="radio-freq-slider" min="875" max="1080" value="${Math.round(parseFloat(_modalState.frequency) * 10)}" step="1">
                    </div>
                    <div class="radio-freq-labels"><span>87.5</span><span>108.0</span></div>
                    ${legendHtml ? `<div class="radio-freq-legend">${legendHtml}</div>` : ''}
                    <div class="radio-freq-display">
                        <span class="radio-freq-value" id="radio-freq-value">${_modalState.frequency} FM</span>
                        <span class="radio-freq-status radio-freq-status--available" id="radio-freq-status">AVAILABLE</span>
                    </div>
                </div>

                <!-- Step 3: Name -->
                <div>
                    <div class="radio-modal-step-label">3 &mdash; Callsign &amp; Name</div>
                    <div class="radio-modal-row">
                        <input class="radio-modal-input radio-modal-input--callsign" id="radio-input-callsign" maxlength="5" placeholder="MHZ" value="${esc(_modalState.callsign)}">
                        <input class="radio-modal-input" id="radio-input-name" placeholder="Full station name (e.g. Melizean Free Radio)" value="${esc(_modalState.name)}" style="flex:1;">
                    </div>
                </div>

                <!-- Step 4: Description -->
                <div>
                    <div class="radio-modal-step-label">4 &mdash; Description (optional)</div>
                    <textarea class="radio-modal-input" id="radio-input-desc" rows="2" placeholder="What does this station cover?" style="resize:none;font-family:var(--font-ui);font-size:10px;line-height:1.5;">${esc(_modalState.description)}</textarea>
                </div>

            </div>
            <div class="radio-modal-footer">
                <button class="radio-modal-btn radio-modal-btn--cancel" id="radio-modal-cancel">Cancel</button>
                <button class="radio-modal-btn radio-modal-btn--submit" id="radio-modal-submit">Launch Station</button>
            </div>
        </div>
    `;
}

function openCreateModal() {
    _modalState = { stationType: 'general', ideology: null, callsign: '', name: '', frequency: '92.0', description: '' };
    const overlay = document.getElementById('radio-create-modal');
    if (overlay) {
        overlay.innerHTML = renderCreateStationModal();
        overlay.classList.add('active');
        bindCreateModal();
    }
}

function closeCreateModal() {
    document.getElementById('radio-create-modal')?.classList.remove('active');
}

function bindCreateModal() {
    const overlay = document.getElementById('radio-create-modal');
    if (!overlay) return;

    // Close
    document.getElementById('radio-modal-close')?.addEventListener('click', closeCreateModal);
    document.getElementById('radio-modal-cancel')?.addEventListener('click', closeCreateModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCreateModal(); });

    // Type selection
    document.getElementById('radio-type-grid')?.addEventListener('click', (e) => {
        const card = e.target.closest('.radio-type-card');
        if (!card || card.classList.contains('locked')) return;
        const type = card.dataset.type;
        _modalState.stationType = type;
        if (type !== 'political') _modalState.ideology = null;

        document.querySelectorAll('.radio-type-card').forEach(c => {
            const isActive = c.dataset.type === type;
            c.classList.toggle('active', isActive);
            const nameEl = c.querySelector('.radio-type-name');
            if (nameEl) nameEl.style.color = isActive ? (TYPE_COLORS[c.dataset.type] || '') : '';
        });

        const ideoGrid = document.getElementById('radio-ideology-grid');
        if (ideoGrid) ideoGrid.classList.toggle('visible', type === 'political');
    });

    // Ideology selection
    document.getElementById('radio-ideology-grid')?.addEventListener('click', (e) => {
        const card = e.target.closest('.radio-ideology-card');
        if (!card) return;
        const tag = card.dataset.ideology;
        const info = IDEOLOGY_TAGS.find(i => i.tag === tag);
        _modalState.ideology = tag;

        document.querySelectorAll('.radio-ideology-card').forEach(c => {
            const isActive = c.dataset.ideology === tag;
            c.classList.toggle('active', isActive);
            if (isActive && info) {
                c.style.color = info.color;
                c.style.borderColor = info.color + '44';
                c.style.background = info.color + '12';
            } else {
                c.style.color = '';
                c.style.borderColor = '';
                c.style.background = '';
            }
        });
    });

    // Frequency slider
    const existingFreqs = _stations.map(s => parseFloat(s.frequency)).filter(f => !isNaN(f));
    document.getElementById('radio-freq-slider')?.addEventListener('input', (e) => {
        const freq = (e.target.value / 10).toFixed(1);
        _modalState.frequency = freq;
        const pct = (e.target.value - 875) / (1080 - 875) * 100;
        const cursor = document.getElementById('radio-freq-cursor');
        if (cursor) cursor.style.left = pct + '%';
        const valueEl = document.getElementById('radio-freq-value');
        if (valueEl) valueEl.textContent = freq + ' FM';

        const isOccupied = existingFreqs.some(f => Math.abs(f - parseFloat(freq)) < 0.2);
        const statusEl = document.getElementById('radio-freq-status');
        if (statusEl) {
            statusEl.textContent = isOccupied ? 'OCCUPIED' : 'AVAILABLE';
            statusEl.className = 'radio-freq-status ' + (isOccupied ? 'radio-freq-status--occupied' : 'radio-freq-status--available');
        }
    });

    // Input bindings
    document.getElementById('radio-input-callsign')?.addEventListener('input', (e) => { _modalState.callsign = e.target.value; });
    document.getElementById('radio-input-name')?.addEventListener('input', (e) => { _modalState.name = e.target.value; });
    document.getElementById('radio-input-desc')?.addEventListener('input', (e) => { _modalState.description = e.target.value; });

    // Submit
    document.getElementById('radio-modal-submit')?.addEventListener('click', submitCreateStation);
}

let _submitting = false;

async function submitCreateStation() {
    if (_submitting) return;
    const { callsign, name, frequency, stationType, ideology, description } = _modalState;

    if (!callsign.trim() || !name.trim()) return;
    if (stationType === 'political' && !ideology) return;

    _submitting = true;
    const btn = document.getElementById('radio-modal-submit');
    if (btn) { btn.disabled = true; btn.textContent = 'Launching...'; }

    try {
        const { data, error } = await _supabase.from('radio_stations').insert({
            nation_id: _state.nation.id,
            creator_faction_id: _state.faction.id,
            callsign: callsign.trim().toUpperCase(),
            name: name.trim(),
            frequency: frequency + ' FM',
            station_type: stationType,
            ideology: stationType === 'political' ? ideology : null,
            description: description.trim() || null,
            created_at_tick: _state.shard?.current_tick || null,
        }).select('*').single();

        if (error) {
            console.error('[Radio] Create station failed:', error.message);
            alert('Failed to create station: ' + error.message);
            return;
        }

        _stations.push(data);
        _selectedStationId = data.id;
        closeCreateModal();
        renderRadioPage(document.getElementById('broadcast-root'));
    } catch (err) {
        console.error('[Radio] Create station error:', err);
    } finally {
        _submitting = false;
        if (btn) { btn.disabled = false; btn.textContent = 'Launch Station'; }
    }
}
