// js/radio.js — Radio Broadcast System UI
// Renders station listing, station sidebar, broadcast feed, and Create Station modal.

let _supabase = null;
let _state = null;
let _stations = [];
let _selectedStationId = null;
let _broadcasts = [];
let _personalities = [];
let _myGoodListens = new Set(); // broadcast IDs the current faction has good-listened
let _expandedBroadcastId = null; // currently expanded broadcast in the feed
let _allGlobalStations = [];    // all stations across all nations (for global feed)
let _tuneInMode = false; // true when Tune In view is active
let _tuneInNations = []; // all nations for Tune In
let _tuneInSelectedNationId = null; // selected nation in Tune In
let _tuneInStations = []; // stations for selected nation
let _tuneInSelectedStationId = null; // selected station in Tune In
let _tuneInBroadcasts = []; // broadcasts for selected Tune In station

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

function escParagraphs(str) {
    if (!str) return '';
    // Split on double-newlines for paragraphs, single newlines become <br>
    return str.split(/\n\n+/).map(para => {
        const escaped = esc(para.trim());
        return escaped ? `<p style="margin:0 0 12px 0;">${escaped.replace(/\n/g, '<br>')}</p>` : '';
    }).filter(Boolean).join('');
}

function initials(name) {
    return (name || '??').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Phase 5b: political-station gating used to require the joining faction
// to have 20+ on the station's labeled ideology axis. With ideology gone,
// the gate is open. Personality cap (max 3 per party per station) stays.
function canCreatePersonality(station) {
    const myCount = _personalities.filter(p => p.faction_id === _state.faction?.id && p.station_id === station.id).length;
    if (myCount >= 3) return { allowed: false, reason: 'Maximum 3 personalities per party per station.' };
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

    // Phase 5a: faction_ideology fetch removed; political-station gating
    // is opened until Phase 5c rewrites it on sector strongholds.
    const [stationsResult] = await Promise.all([
        _supabase.from('radio_stations').select('*').eq('nation_id', nationId).order('created_at', { ascending: true }),
    ]);
    if (stationsResult.error) {
        console.error('[Radio] Failed to load stations:', stationsResult.error.message);
        root.innerHTML = '<div class="radio-empty"><div class="radio-empty-title">Error loading stations</div></div>';
        return;
    }

    _stations = stationsResult.data || [];

    // Attach event listeners ONCE via delegation — survives innerHTML rebuilds
    attachRadioListeners(root);
    renderRadioPage(root);
}

// ════════════════════════ EVENT LISTENERS (attached once) ════════════════════════

function attachRadioListeners(root) {
    root.addEventListener('click', async (e) => {
        // Create Station button
        if (e.target.closest('#radio-create-btn')) { openCreateModal(); return; }

        // Tune In / Back toggle
        if (e.target.closest('#radio-tunein-btn')) {
            _tuneInMode = !_tuneInMode;
            if (_tuneInMode) openTuneIn();
            else renderRadioPage(root);
            return;
        }

        // Station tab click (normal mode)
        const tab = e.target.closest('.radio-station-tab');
        if (tab) { selectStation(tab.dataset.stationId); return; }

        // Tune In: nation selection
        const nationBtn = e.target.closest('.radio-tunein-nation');
        if (nationBtn) {
            _tuneInSelectedNationId = nationBtn.dataset.nationId;
            _tuneInSelectedStationId = null;
            _tuneInBroadcasts = [];
            await loadTuneInStations();
            renderRadioPage(root);
            return;
        }

        // Tune In: station selection
        const stationBtn = e.target.closest('.radio-tunein-station');
        if (stationBtn) {
            _tuneInSelectedStationId = stationBtn.dataset.stationId;
            await loadTuneInBroadcasts();
            renderRadioPage(root);
            return;
        }

        // Create Station modal: type card, ideology card, close, cancel, submit
        const typeCard = e.target.closest('.radio-type-card');
        if (typeCard && !typeCard.classList.contains('locked')) {
            _modalState.stationType = typeCard.dataset.type;
            if (typeCard.dataset.type !== 'political') _modalState.ideology = null;
            // Re-render modal inline
            const overlay = document.getElementById('radio-create-modal');
            if (overlay) { overlay.innerHTML = renderCreateStationModal(); }
            return;
        }
        const ideoCard = e.target.closest('.radio-ideology-card');
        if (ideoCard) {
            _modalState.ideology = ideoCard.dataset.ideology;
            const overlay = document.getElementById('radio-create-modal');
            if (overlay) { overlay.innerHTML = renderCreateStationModal(); }
            return;
        }
        if (e.target.closest('#radio-modal-close') || e.target.closest('#radio-modal-cancel')) { closeCreateModal(); return; }
        if (e.target.closest('#radio-modal-submit')) { submitCreateStation(); return; }
        // Close modal on overlay click
        if (e.target.classList.contains('radio-modal-overlay')) { e.target.classList.remove('active'); return; }

        // Create Personality button
        if (e.target.closest('#radio-create-pers-btn')) {
            const station = _stations.find(s => s.id === _selectedStationId);
            if (station) openPersonalityModal(station);
            return;
        }

        // Feed: Good Listen button
        const glBtn = e.target.closest('[data-gl-btn]');
        if (glBtn) {
            e.stopPropagation();
            toggleGoodListen(glBtn.dataset.glBtn);
            return;
        }
        // Feed: Edit broadcast button
        const editBtn = e.target.closest('[data-bc-edit]');
        if (editBtn) {
            e.stopPropagation();
            openEditBroadcastModal(editBtn.dataset.bcEdit);
            return;
        }
        // Feed: Expand/collapse broadcast toggle
        const bcToggle = e.target.closest('[data-bc-toggle]');
        if (bcToggle) {
            const bcId = bcToggle.dataset.bcToggle;
            _expandedBroadcastId = _expandedBroadcastId === bcId ? null : bcId;
            const station = _stations.find(s => s.id === _selectedStationId);
            renderFeed(station);
            return;
        }
    });

    // Frequency slider — delegated input listener
    root.addEventListener('input', (e) => {
        if (e.target.id === 'radio-freq-slider') {
            const freq = (e.target.value / 10).toFixed(1);
            _modalState.frequency = freq;
            const pct = (e.target.value - 875) / (1080 - 875) * 100;
            const cursor = document.getElementById('radio-freq-cursor');
            if (cursor) cursor.style.left = pct + '%';
            const valueEl = document.getElementById('radio-freq-value');
            if (valueEl) valueEl.textContent = freq + ' FM';
            const freqNum = parseFloat(freq);
            const occupiedBy = _allGlobalFreqs.find(function(s) { return Math.abs(s.freq - freqNum) < 0.2; });
            const statusEl = document.getElementById('radio-freq-status');
            if (statusEl) {
                statusEl.textContent = occupiedBy ? ('OCCUPIED (' + occupiedBy.callsign + ')') : 'AVAILABLE';
                statusEl.className = 'radio-freq-status ' + (occupiedBy ? 'radio-freq-status--occupied' : 'radio-freq-status--available');
            }
        }
        if (e.target.id === 'radio-input-callsign') _modalState.callsign = e.target.value;
        if (e.target.id === 'radio-input-name') _modalState.name = e.target.value;
        if (e.target.id === 'radio-input-desc') _modalState.description = e.target.value;
    });
}

// Bind only the non-delegatable modal inputs (called after modal innerHTML updates)
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
                    <button class="radio-btn radio-btn--outline" id="radio-tunein-btn">${_tuneInMode ? '&#9664; Back' : '&#128225; Tune In'}</button>
                    <button class="radio-btn radio-btn--outline" id="radio-broadcast-btn" disabled title="Create a personality on a station first">Start Broadcast</button>
                    <button class="radio-btn radio-btn--primary" id="radio-create-btn">Create Station</button>
                </div>
            </div>

            <div class="radio-two-col">
                <div class="radio-col-left">
                    ${_tuneInMode ? renderTuneInView() : (stationCount === 0 ? renderEmptyState() : renderStationView())}
                </div>
                <div class="radio-col-right">
                    <div class="radio-events-panel" id="radio-events-panel">
                        <div class="radio-events-header">
                            <span class="radio-events-title">Events</span>
                            <div style="display:flex;gap:8px;align-items:center;">
                                <div class="radio-events-tabs" id="radio-events-type-tabs">
                                    <span class="radio-events-tab active" data-type="political">Politics</span>
                                    <span class="radio-events-tab" data-type="corporate">Corporate</span>
                                </div>
                                <div style="width:1px;height:14px;background:var(--border-main);"></div>
                                <div class="radio-events-tabs" id="radio-events-scope-tabs">
                                    <span class="radio-events-tab active" data-scope="nation">Nation</span>
                                    <span class="radio-events-tab" data-scope="world">World</span>
                                </div>
                            </div>
                        </div>
                        <div class="radio-events-scroll" id="radio-events-scroll">
                            <div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Loading events...</div>
                        </div>
                    </div>
                </div>
            </div>
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

    // After render: load data for current mode (no listener re-binding)
    if (!_tuneInMode && stationCount > 0) {
        loadAllBroadcasts();
    }

    // Load events panel
    loadRadioEvents();
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

    if (persResult.error) console.error('[Radio] Failed to load personalities:', persResult.error.message);
    if (bcResult.error) console.error('[Radio] Failed to load broadcasts:', bcResult.error.message);

    _personalities = persResult.data || [];
    _broadcasts = bcResult.data || [];
    _myGoodListens = new Set((glResult.data || []).map(r => r.broadcast_id));
    _expandedBroadcastId = null;

    // Enable/disable Start Broadcast button based on whether user has a personality on this station
    const myPers = _personalities.filter(p => p.faction_id === factionId);
    const bcBtn = document.getElementById('radio-broadcast-btn');
    if (bcBtn) {
        bcBtn.disabled = myPers.length === 0;
        bcBtn.title = myPers.length > 0 ? 'Broadcast on this station' : 'Create a personality on a station first';
        bcBtn.onclick = myPers.length > 0 ? () => openBroadcastModal(station) : null;
    }

    // Show sidebar when a specific station is selected
    const sidebarEl = document.getElementById('radio-sidebar');
    if (sidebarEl) sidebarEl.style.display = '';

    renderSidebar(station);
    renderFeed(station);
}

async function loadAllBroadcasts() {
    // Load ALL broadcasts from ALL stations across ALL nations
    const factionId = _state.faction?.id;

    const [bcResult, persResult, glResult, allStationsResult] = await Promise.all([
        _supabase.from('radio_broadcasts').select('*').order('created_at', { ascending: false }).limit(100),
        _supabase.from('radio_personalities').select('*'),
        factionId ? _supabase.from('broadcast_good_listens').select('broadcast_id').eq('faction_id', factionId) : { data: [] },
        _supabase.from('radio_stations').select('id, callsign, frequency, station_type, nation_id, nations!inner(name)').order('created_at'),
    ]);

    // Build a global station lookup (including other nations)
    _allGlobalStations = (allStationsResult.data || []);
    _personalities = persResult.data || [];
    _broadcasts = bcResult.data || [];
    _myGoodListens = new Set((glResult.data || []).map(r => r.broadcast_id));
    _expandedBroadcastId = null;
    _selectedStationId = null;

    // Enable broadcast button if user has personality on ANY local station
    const myPers = _personalities.filter(p => p.faction_id === factionId);
    const bcBtn = document.getElementById('radio-broadcast-btn');
    if (bcBtn) {
        bcBtn.disabled = myPers.length === 0;
        bcBtn.title = myPers.length > 0 ? 'Start a broadcast' : 'Create a personality on a station first';
        if (myPers.length > 0) {
            const persStation = _stations.find(s => myPers.some(p => p.station_id === s.id));
            bcBtn.onclick = persStation ? () => openBroadcastModal(persStation) : null;
        }
    }

    // Clear active tab state
    document.querySelectorAll('.radio-station-tab').forEach(t => {
        t.classList.remove('active');
        t.style.borderColor = '';
        t.style.borderBottomColor = 'transparent';
    });

    // Hide sidebar, show feed with all broadcasts
    const sidebarEl = document.getElementById('radio-sidebar');
    if (sidebarEl) sidebarEl.style.display = 'none';

    renderFeed(null);
}

// ════════════════════════ SIDEBAR ════════════════════════

function renderSidebar(station) {
    const el = document.getElementById('radio-sidebar');
    if (!el) return;

    const color = TYPE_COLORS[station.station_type] || 'var(--text-dim)';

    const persHtml = _personalities.length > 0
        ? _personalities.map(p => `
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
            <span class="radio-sidebar-value">${_personalities.length}</span>
        </div>

        <div class="radio-sidebar-section">
            <div class="radio-sidebar-section-title">Personalities</div>
            ${persHtml}
            ${renderCreatePersonalityButton(station)}
        </div>
    `;

    // Create Personality click is handled by delegated listener in attachRadioListeners
}

function renderCreatePersonalityButton(station) {
    const check = canCreatePersonality(station);
    if (!check.allowed) {
        return `<div style="margin-top:8px;padding:5px 8px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);border:1px solid var(--border-main);text-align:center;opacity:0.6;" title="${esc(check.reason)}">${esc(check.reason)}</div>`;
    }
    return `<div class="radio-sidebar-cta" id="radio-create-pers-btn">Create Personality</div>`;
}

// ════════════════════════ FEED ════════════════════════

function renderFeed(station) {
    const countEl = document.getElementById('radio-feed-count');
    const scrollEl = document.getElementById('radio-feed-scroll');
    if (!countEl || !scrollEl) return;

    const allMode = !station;
    countEl.textContent = `${_broadcasts.length} broadcast${_broadcasts.length !== 1 ? 's' : ''}${allMode ? ' (all stations)' : ''}`;

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
            `<span style="padding:2px 7px;font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-mid);line-height:14px;">${esc(t)}</span>`
        ).join('');

        const personality = _personalities.find(p => p.id === bc.personality_id);
        const persName = personality?.name || 'Unknown';
        const stationInfo = _allGlobalStations.find(s => s.id === bc.station_id) || _stations.find(s => s.id === bc.station_id);
        const nationName = stationInfo?.nations?.name || '';
        const stationColor = TYPE_COLORS[stationInfo?.station_type] || 'var(--text-dim)';
        const stationTuning = stationInfo ? `${stationInfo.frequency} — ${stationInfo.callsign}${nationName ? ' · ' + nationName : ''}` : '';
        const isExpanded = _expandedBroadcastId === bc.id;
        const isGoodListened = _myGoodListens.has(bc.id);

        const bodyStyle = isExpanded
            ? 'font-family:var(--font-serif);font-size:14px;color:var(--text-secondary);line-height:1.7;margin-bottom:10px;'
            : 'font-family:var(--font-serif);font-size:14px;color:var(--text-secondary);line-height:1.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;';

        const glBtnStyle = isGoodListened
            ? 'padding:5px 14px;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.04em;color:var(--bg-body);background:var(--green);border:1px solid var(--green);'
            : 'padding:5px 14px;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.04em;color:var(--green);background:transparent;border:1px solid var(--green-border);';

        return `
            <div style="border-bottom:1px solid var(--border-main);">
                <div style="padding:14px 20px;cursor:pointer;" data-bc-toggle="${bc.id}">
                    ${stationTuning ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                        <span style="width:6px;height:6px;border-radius:50%;background:${stationColor};flex-shrink:0;box-shadow:0 0 4px ${stationColor}44;"></span>
                        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${stationColor};letter-spacing:0.04em;">${esc(stationTuning)}</span>
                    </div>` : ''}
                    <div style="font-family:var(--font-serif);font-size:18px;font-weight:600;color:var(--text-bright);line-height:1.3;margin-bottom:6px;">${esc(bc.subject)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                        <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);font-weight:600;">${esc(persName)}</span>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">&middot;</span>
                        <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">Tick ${bc.published_tick || '?'}</span>
                    </div>
                    <div style="${bodyStyle}">${isExpanded ? escParagraphs(bc.body) : esc(bc.body)}</div>
                    ${tagsHtml ? `<div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;">${tagsHtml}</div>` : ''}
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:1px solid var(--border-main);">
                        <div style="display:flex;gap:12px;">
                            <div style="display:flex;align-items:center;gap:4px;">
                                <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">LISTENERS</span>
                                <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--green);" id="gl-count-${bc.id}">${bc.good_listen_count || 0}</span>
                            </div>
                        </div>
                        <div style="display:flex;gap:6px;align-items:center;">
                            ${bc.faction_id === _state.faction?.id ? `<div data-bc-edit="${bc.id}" style="padding:5px 12px;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.04em;color:var(--text-dim);background:transparent;border:1px solid var(--border-mid);">EDIT</div>` : ''}
                            <div style="${glBtnStyle}" data-gl-btn="${bc.id}" id="gl-btn-${bc.id}">${isGoodListened ? '\u2713 LISTEN' : 'LISTEN'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Feed click handling is delegated from attachRadioListeners — no listeners added here
}

// ════════════════════════ LISTEN ════════════════════════

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
            p_faction_id: _state.faction?.id,
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
                btn.textContent = '\u2713 LISTEN';
            } else {
                btn.style.color = 'var(--green)';
                btn.style.background = 'transparent';
                btn.style.borderColor = 'var(--green-border)';
                btn.textContent = 'LISTEN';
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
                    <textarea class="radio-modal-input" id="radio-bc-body" rows="10" placeholder="Write your broadcast script...&#10;&#10;Use blank lines for paragraph breaks." style="resize:vertical;font-family:var(--font-serif);font-size:11px;line-height:1.65;"></textarea>
                    <div style="display:flex;justify-content:space-between;margin-top:3px;">
                        <span id="radio-bc-charcount" style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">0 characters</span>
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">Use blank lines for paragraph breaks</span>
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
                faction_id: _state.faction?.id,
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

// ════════════════════════ EDIT BROADCAST MODAL ════════════════════════

function openEditBroadcastModal(broadcastId) {
    const bc = _broadcasts.find(b => b.id === broadcastId);
    if (!bc) return;

    // Only the owning faction can edit
    if (bc.faction_id !== _state.faction?.id) return;

    const station = _allGlobalStations.find(s => s.id === bc.station_id) || _stations.find(s => s.id === bc.station_id);
    if (!station) return;

    const overlay = document.getElementById('radio-broadcast-modal');
    if (!overlay) return;

    const color = TYPE_COLORS[station.station_type] || 'var(--text-dim)';
    const myPers = _personalities.filter(p => p.faction_id === _state.faction?.id);

    const persOptions = myPers.map(p =>
        `<option value="${p.id}" ${p.id === bc.personality_id ? 'selected' : ''}>${esc(p.name)}${p.title ? ' — ' + esc(p.title) : ''}</option>`
    ).join('');

    const existingTags = new Set(bc.tags || []);
    const tagsHtml = BROADCAST_TAGS.map(t => {
        const isOn = existingTags.has(t);
        return `<span class="radio-bc-tag" data-tag="${t}" style="padding:4px 10px;cursor:pointer;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.04em;border:1px solid ${isOn ? 'var(--amber-border)' : 'var(--border-mid)'};color:${isOn ? 'var(--accent)' : 'var(--text-dim)'};background:${isOn ? 'var(--amber-faint)' : 'transparent'};">${t}</span>`;
    }).join('');

    overlay.innerHTML = `
        <div class="radio-modal" style="width:500px;">
            <div class="radio-modal-header">
                <div class="radio-modal-header-left">
                    <div class="radio-modal-dot" style="background:${color};"></div>
                    <span class="radio-modal-title">Edit Broadcast</span>
                </div>
                <button class="radio-modal-close" id="radio-bc-close">&times;</button>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid var(--border-main);background:${color}08;display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="width:5px;height:5px;border-radius:50%;background:${color};display:inline-block;"></span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Editing on:</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${color};">${esc(station.callsign)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${esc(station.frequency)}</span>
                </div>
            </div>
            <div class="radio-modal-body" style="gap:14px;">
                <div>
                    <div class="radio-modal-step-label">1 — Personality</div>
                    <select class="radio-modal-input" id="radio-bc-personality" style="font-family:var(--font-ui);font-size:11px;">
                        ${persOptions}
                    </select>
                </div>
                <div>
                    <div class="radio-modal-step-label">2 — Subject</div>
                    <input class="radio-modal-input" id="radio-bc-subject" value="${esc(bc.subject)}" style="font-family:var(--font-serif);font-size:13px;">
                </div>
                <div>
                    <div class="radio-modal-step-label">3 — Broadcast Content</div>
                    <textarea class="radio-modal-input" id="radio-bc-body" rows="10" style="resize:vertical;font-family:var(--font-serif);font-size:11px;line-height:1.65;">${esc(bc.body)}</textarea>
                    <div style="display:flex;justify-content:space-between;margin-top:3px;">
                        <span id="radio-bc-charcount" style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${(bc.body || '').length} characters</span>
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">Use blank lines for paragraph breaks</span>
                    </div>
                </div>
                <div>
                    <div class="radio-modal-step-label">4 — Tags</div>
                    <div style="display:flex;gap:3px;flex-wrap:wrap;" id="radio-bc-tags">${tagsHtml}</div>
                </div>
            </div>
            <div class="radio-modal-footer">
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-right:auto;">EDITING</span>
                <button class="radio-modal-btn radio-modal-btn--cancel" id="radio-bc-cancel">Cancel</button>
                <button class="radio-modal-btn radio-modal-btn--submit" id="radio-bc-submit" style="background:var(--accent);">Update</button>
            </div>
        </div>
    `;

    overlay.classList.add('active');

    const selectedTags = new Set(bc.tags || []);

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

    // Submit (UPDATE instead of INSERT)
    let submitting = false;
    document.getElementById('radio-bc-submit')?.addEventListener('click', async () => {
        if (submitting) return;
        const subject = document.getElementById('radio-bc-subject')?.value?.trim();
        const body = document.getElementById('radio-bc-body')?.value?.trim();
        const personalityId = document.getElementById('radio-bc-personality')?.value;
        if (!subject || !body || !personalityId) return;

        submitting = true;
        const btn = document.getElementById('radio-bc-submit');
        if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }

        try {
            const { data, error } = await _supabase.from('radio_broadcasts').update({
                personality_id: personalityId,
                subject: subject,
                body: body,
                tags: [...selectedTags],
            }).eq('id', broadcastId).eq('faction_id', _state.faction?.id).select('*').single();

            if (error) {
                console.error('[Radio] Edit failed:', error.message);
                alert('Failed to update: ' + error.message);
                return;
            }

            // Update in local cache
            const idx = _broadcasts.findIndex(b => b.id === broadcastId);
            if (idx >= 0) _broadcasts[idx] = { ..._broadcasts[idx], ...data };

            close();
            const feedStation = _stations.find(s => s.id === _selectedStationId);
            renderFeed(feedStation);
        } catch (err) {
            console.error('[Radio] Edit error:', err);
        } finally {
            submitting = false;
            if (btn) { btn.disabled = false; btn.textContent = 'Update'; }
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
                faction_id: _state.faction?.id,
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
                    <textarea class="radio-modal-input" id="radio-input-desc" rows="2" placeholder="What does this station cover?" style="resize:none;font-family:var(--font-ui);font-size:13px;line-height:1.5;">${esc(_modalState.description)}</textarea>
                </div>

            </div>
            <div class="radio-modal-footer">
                <button class="radio-modal-btn radio-modal-btn--cancel" id="radio-modal-cancel">Cancel</button>
                <button class="radio-modal-btn radio-modal-btn--submit" id="radio-modal-submit">Launch Station</button>
            </div>
        </div>
    `;
}

// Global frequency cache for availability checking (loaded on modal open)
var _allGlobalFreqs = [];

async function openCreateModal() {
    _modalState = { stationType: 'general', ideology: null, callsign: '', name: '', frequency: '92.0', description: '' };

    // Load all frequencies globally so the slider shows accurate availability
    try {
        var { data: allStations } = await _supabase.from('radio_stations').select('frequency, callsign');
        _allGlobalFreqs = (allStations || []).map(function(s) { return { freq: parseFloat(s.frequency), callsign: s.callsign }; }).filter(function(s) { return !isNaN(s.freq); });
    } catch (_) { _allGlobalFreqs = []; }

    const overlay = document.getElementById('radio-create-modal');
    if (overlay) {
        overlay.innerHTML = renderCreateStationModal();
        overlay.classList.add('active');
    }
}

function closeCreateModal() {
    document.getElementById('radio-create-modal')?.classList.remove('active');
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
        // Check for duplicate frequency across ALL stations globally
        const freqVal = parseFloat(frequency);
        const { data: existingStations } = await _supabase.from('radio_stations')
            .select('id, callsign, frequency')
            .order('created_at');
        const duplicate = (existingStations || []).find(s => {
            const existing = parseFloat(s.frequency);
            return !isNaN(existing) && Math.abs(existing - freqVal) < 0.05;
        });
        if (duplicate) {
            alert(`Frequency ${frequency} FM is already taken by station ${duplicate.callsign}. Choose a different frequency.`);
            _submitting = false;
            if (btn) { btn.disabled = false; btn.textContent = 'Launch Station'; }
            return;
        }

        const { data, error } = await _supabase.from('radio_stations').insert({
            nation_id: _state.nation?.id,
            creator_faction_id: _state.faction?.id,
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

// ════════════════════════ TUNE IN — CROSS-NATION BROWSING ════════════════════════

async function openTuneIn() {
    const root = document.getElementById('broadcast-root');
    if (!root) return;

    // Fetch all nations if not cached
    if (_tuneInNations.length === 0) {
        const { data } = await _supabase.from('nations').select('id, name, government_type, flag_url').order('name');
        _tuneInNations = data || [];
    }

    // Default to first OTHER nation (exclude own)
    const myNationId = _state.nation?.id;
    if (!_tuneInSelectedNationId) {
        const other = _tuneInNations.find(n => n.id !== myNationId);
        _tuneInSelectedNationId = other?.id || _tuneInNations[0]?.id || null;
    }

    await loadTuneInStations();
    renderRadioPage(root);
}

async function loadTuneInStations() {
    if (!_tuneInSelectedNationId) { _tuneInStations = []; _tuneInBroadcasts = []; return; }

    const { data } = await _supabase.from('radio_stations')
        .select('*')
        .eq('nation_id', _tuneInSelectedNationId)
        .order('created_at', { ascending: true });

    _tuneInStations = data || [];
    _tuneInSelectedStationId = _tuneInStations[0]?.id || null;

    if (_tuneInSelectedStationId) {
        await loadTuneInBroadcasts();
    } else {
        _tuneInBroadcasts = [];
    }
}

async function loadTuneInBroadcasts() {
    if (!_tuneInSelectedStationId) { _tuneInBroadcasts = []; return; }

    const [bcResult, persResult] = await Promise.all([
        _supabase.from('radio_broadcasts')
            .select('*')
            .eq('station_id', _tuneInSelectedStationId)
            .order('created_at', { ascending: false })
            .limit(50),
        _supabase.from('radio_personalities')
            .select('id, name, title')
            .eq('station_id', _tuneInSelectedStationId),
    ]);

    _tuneInBroadcasts = bcResult.data || [];
    // Attach personality names to broadcasts
    const persMap = {};
    for (const p of (persResult.data || [])) persMap[p.id] = p;
    for (const bc of _tuneInBroadcasts) {
        bc._personality = persMap[bc.personality_id] || null;
    }
}

function renderTuneInView() {
    const myNationId = _state.nation?.id;

    const nationsHtml = _tuneInNations.map(n => {
        const isActive = n.id === _tuneInSelectedNationId;
        const isYou = n.id === myNationId;
        return `<div class="radio-tunein-nation ${isActive ? 'active' : ''}" data-nation-id="${n.id}">
            ${esc(n.name)}${isYou ? ' <span style="color:var(--green);font-size:9px;">(YOU)</span>' : ''}
        </div>`;
    }).join('');

    const nation = _tuneInNations.find(n => n.id === _tuneInSelectedNationId);
    const stationsHtml = _tuneInStations.length > 0
        ? _tuneInStations.map(s => {
            const color = TYPE_COLORS[s.station_type] || 'var(--text-dim)';
            const isActive = s.id === _tuneInSelectedStationId;
            return `<div class="radio-tunein-station ${isActive ? 'active' : ''}" data-station-id="${s.id}" style="border-left-color:${color};">
                <div class="radio-tunein-station-name">${esc(s.callsign)} &mdash; ${esc(s.name)}</div>
                <div class="radio-tunein-station-meta">${esc(s.frequency)} &middot; <span style="color:${color};">${esc(s.station_type.toUpperCase())}</span></div>
            </div>`;
        }).join('')
        : '<div class="radio-tunein-empty">No stations in this nation yet.</div>';

    const station = _tuneInStations.find(s => s.id === _tuneInSelectedStationId);

    let timelineHtml = '';
    if (station && _tuneInBroadcasts.length > 0) {
        const bcRows = _tuneInBroadcasts.map(bc => {
            const persName = bc._personality?.name || 'Unknown';
            const tagsHtml = (bc.tags || []).map(t => `<span class="radio-tunein-bc-tag">${esc(t)}</span>`).join('');
            return `<div class="radio-tunein-bc">
                <div class="radio-tunein-bc-subject">${esc(bc.subject)}</div>
                <div class="radio-tunein-bc-meta">
                    <span style="font-weight:600;color:var(--text-secondary);">${esc(persName)}</span>
                    <span>&middot;</span>
                    <span>Tick ${bc.published_tick ?? '?'}</span>
                    <span>&middot;</span>
                    <span>${bc.good_listen_count || 0} &#128266;</span>
                </div>
                <div class="radio-tunein-bc-body">${escParagraphs(bc.body)}</div>
                ${tagsHtml ? `<div class="radio-tunein-bc-tags">${tagsHtml}</div>` : ''}
            </div>`;
        }).join('');

        timelineHtml = `<div class="radio-tunein-timeline">
            <div class="radio-tunein-timeline-header">Timeline &mdash; ${esc(station.callsign)} ${esc(station.frequency)}</div>
            <div style="max-height:500px;overflow-y:auto;">${bcRows}</div>
        </div>`;
    } else if (station) {
        timelineHtml = `<div class="radio-tunein-timeline">
            <div class="radio-tunein-timeline-header">Timeline &mdash; ${esc(station.callsign)} ${esc(station.frequency)}</div>
            <div class="radio-tunein-empty">No broadcasts on this station yet.</div>
        </div>`;
    }

    return `
        <div style="margin-top:8px;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">Select a Nation</div>
            <div class="radio-tunein-nations" id="radio-tunein-nations">${nationsHtml}</div>

            <div style="display:flex;gap:10px;align-items:flex-start;">
                <div style="width:260px;flex-shrink:0;">
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Stations${nation ? ' in ' + esc(nation.name) : ''}</div>
                    ${stationsHtml}
                </div>
                <div style="flex:1;min-width:0;">${timelineHtml}</div>
            </div>
        </div>
    `;
}

// ════════════════════════ EVENTS PANEL ════════════════════════

let _radioEvents = [];
let _radioEventScope = 'nation'; // 'nation' or 'world'
let _radioEventType = 'political'; // 'political' or 'corporate'
let _radioAllNations = []; // cached for flag display

async function loadRadioEvents() {
    const currentTick = _state.shard?.current_tick || 0;
    const lookback = Math.max(1, currentTick - 48);

    const [evResult, nationsResult] = await Promise.all([
        _supabase.from('event_log')
            .select('id, nation_id, event_name, category, fired_at_tick, description_chosen')
            .gte('fired_at_tick', lookback)
            .order('fired_at_tick', { ascending: false })
            .limit(100),
        _radioAllNations.length === 0
            ? _supabase.from('nations').select('id, name, flag_url').order('name')
            : { data: _radioAllNations },
    ]);

    _radioEvents = evResult.data || [];
    if (nationsResult.data) _radioAllNations = nationsResult.data;
    renderRadioEvents();

    // Wire type tabs (Politics/Corporate)
    const typeContainer = document.getElementById('radio-events-type-tabs');
    if (typeContainer && !typeContainer._wired) {
        typeContainer._wired = true;
        typeContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.radio-events-tab');
            if (!tab || !tab.dataset.type) return;
            _radioEventType = tab.dataset.type;
            typeContainer.querySelectorAll('.radio-events-tab').forEach(t => t.classList.toggle('active', t.dataset.type === _radioEventType));
            renderRadioEvents();
        });
    }

    // Wire scope tabs (Nation/World)
    const scopeContainer = document.getElementById('radio-events-scope-tabs');
    if (scopeContainer && !scopeContainer._wired) {
        scopeContainer._wired = true;
        scopeContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.radio-events-tab');
            if (!tab || !tab.dataset.scope) return;
            _radioEventScope = tab.dataset.scope;
            scopeContainer.querySelectorAll('.radio-events-tab').forEach(t => t.classList.toggle('active', t.dataset.scope === _radioEventScope));
            renderRadioEvents();
        });
    }
}

function renderRadioEvents() {
    const scroll = document.getElementById('radio-events-scroll');
    if (!scroll) return;

    const nationId = _state.nation?.id;
    const POLITICAL_CATS = new Set(['government', 'political', 'crisis', 'diplomatic', 'military', 'trade', 'economic']);
    const CORPORATE_CATS = new Set(['corporate', 'ipo', 'shipping', 'insurance', 'corp_action']);

    let events = _radioEvents;

    // Filter by type (political vs corporate)
    if (_radioEventType === 'corporate') {
        events = events.filter(e => CORPORATE_CATS.has(e.category));
    } else {
        events = events.filter(e => POLITICAL_CATS.has(e.category) || !CORPORATE_CATS.has(e.category));
    }

    // Filter by scope (nation vs world)
    if (_radioEventScope === 'nation' && nationId) {
        events = events.filter(e => e.nation_id === nationId);
    }

    if (events.length === 0) {
        scroll.innerHTML = '<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);font-style:italic;">No recent events.</div>';
        return;
    }

    const CAT_COLORS = {
        government: { color: '#8b9a6b', bg: 'rgba(139,154,107,0.06)', border: 'rgba(139,154,107,0.2)' },
        political: { color: '#c8a832', bg: 'rgba(200,168,50,0.06)', border: 'rgba(200,168,50,0.2)' },
        crisis: { color: '#d44a4a', bg: 'rgba(212,74,74,0.06)', border: 'rgba(212,74,74,0.2)' },
        trade: { color: '#5aaa8a', bg: 'rgba(90,170,138,0.06)', border: 'rgba(90,170,138,0.2)' },
        diplomatic: { color: '#5a8aaa', bg: 'rgba(90,138,170,0.06)', border: 'rgba(90,138,170,0.2)' },
        military: { color: '#c84', bg: 'rgba(204,136,68,0.06)', border: 'rgba(204,136,68,0.2)' },
        corporate: { color: '#5aaa8a', bg: 'rgba(90,170,138,0.06)', border: 'rgba(90,170,138,0.2)' },
        economic: { color: '#c8a832', bg: 'rgba(200,168,50,0.06)', border: 'rgba(200,168,50,0.2)' },
    };

    scroll.innerHTML = events.map(ev => {
        const cat = ev.category || 'government';
        const cs = CAT_COLORS[cat] || CAT_COLORS.government;
        const desc = ev.description_chosen || ev.event_name || '';
        const truncDesc = desc; // show full text, no truncation

        // Show nation flag+name on World scope
        let nationHtml = '';
        if (_radioEventScope === 'world') {
            const nation = _radioAllNations.find(n => n.id === ev.nation_id);
            if (nation) {
                const flagUrl = nation.flag_url || `assets/flags/${nation.name}.png`;
                nationHtml = `<div style="display:flex;align-items:center;gap:4px;margin-top:3px;">
                    <img src="${flagUrl}" style="width:16px;height:11px;object-fit:cover;border:1px solid var(--border-main);" onerror="this.style.display='none'" alt="">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${esc(nation.name)}</span>
                </div>`;
            }
        }

        return `<div style="padding:8px 14px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;gap:8px;align-items:flex-start;">
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);flex-shrink:0;width:26px;">${ev.fired_at_tick}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 5px;color:${cs.color};background:${cs.bg};border:1px solid ${cs.border};flex-shrink:0;text-transform:uppercase;">${esc(cat)}</span>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:12px;color:var(--text-secondary);line-height:1.4;">${esc(truncDesc)}</div>
                    ${nationHtml}
                </div>
            </div>
        </div>`;
    }).join('');
}

