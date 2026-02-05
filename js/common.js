/**
 * Common functionality shared across all dashboard pages
 * - State management (user, faction, nation)
 * - Top bar rendering
 * - Navigation
 * - Tick countdown
 */

// ===== STATE MANAGEMENT =====

const STATE_KEY = 'nationhood_state';
const STATE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached state from sessionStorage
 * Returns null if expired or missing
 */
function getCachedState() {
    try {
        const cached = sessionStorage.getItem(STATE_KEY);
        if (!cached) return null;
        
        const state = JSON.parse(cached);
        const age = Date.now() - state.timestamp;
        
        if (age > STATE_TTL) {
            console.log('State cache expired, will refresh');
            return null;
        }
        
        return state;
    } catch (e) {
        console.error('Error reading cached state:', e);
        return null;
    }
}

/**
 * Save state to sessionStorage
 */
function setCachedState(user, faction, nation, shard) {
    const state = {
        user,
        faction,
        nation,
        shard,
        timestamp: Date.now()
    };
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
}

/**
 * Load game state (user, faction, nation)
 * Uses cache if fresh, otherwise fetches from Supabase
 * @returns {Promise<{user, faction, nation, shard}>}
 */
async function loadGameState() {
    // Check cache first
    const cached = getCachedState();
    if (cached) {
        console.log('Using cached state');
        return cached;
    }
    
    console.log('Fetching fresh state from Supabase');
    
    // Get authenticated user
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    
    // Get faction
    const { data: faction, error: factionError } = await _supabase
        .from('factions')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (factionError || !faction || faction.faction_type !== 'party') {
        window.location.href = 'nation-selection.html';
        return null;
    }
    
    // Get nation
    let nation = null;
    if (faction.nation_id) {
        const { data: nationData } = await _supabase
            .from('nations')
            .select('*')
            .eq('id', faction.nation_id)
            .single();
        nation = nationData;
    }
    
    // Get shard info
    const { data: shard } = await _supabase
        .from('shard')
        .select('*')
        .eq('name', 'Alpha Shard')
        .single();
    
    // Cache the state
    setCachedState(user, faction, nation, shard);
    
    return { user, faction, nation, shard };
}

/**
 * Force refresh state (bypass cache)
 */
async function refreshGameState() {
    sessionStorage.removeItem(STATE_KEY);
    return await loadGameState();
}


// ===== TOP BAR =====

/**
 * Render the top bar HTML
 * @param {string} activeTab - The currently active tab name
 */
function renderTopBar(activeTab) {
    const topBarHTML = `
        <div class="top-bar-row1">
            <div class="tick-info">
                <div class="tick-item">
                    <div class="tick-label">Game Date</div>
                    <div class="tick-value" id="game-date">Loading…</div>
                </div>
                <div class="tick-item">
                    <div class="tick-label">Tick</div>
                    <div class="tick-value" id="tick-number">—</div>
                </div>
                <div class="tick-item">
                    <div class="tick-label">Next Tick In</div>
                    <div class="tick-countdown" id="tick-countdown">—</div>
                </div>
            </div>
            <div class="top-bar-right">
                <span class="party-badge" id="party-badge">…</span>
                <button class="logout-btn" onclick="handleLogout()">Abandon Session</button>
            </div>
        </div>
        <nav class="nav-tabs">
            ${renderNavTabs(activeTab)}
        </nav>
    `;
    
    document.getElementById('top-bar').innerHTML = topBarHTML;
}

/**
 * Render navigation tabs
 * @param {string} activeTab - The currently active tab
 */
function renderNavTabs(activeTab) {
    const tabs = [
        { id: 'world', label: 'World', href: 'world.html' },
        { id: 'nation', label: 'Nation', href: 'nation.html' },
        { id: 'government', label: 'Government', href: 'government.html' },
        { id: 'legislature', label: 'Legislature', href: 'legislature.html' },
        { id: 'parties', label: 'Parties', href: 'parties.html' },
        { id: 'elections', label: 'Elections', href: 'elections.html' },
        { id: 'laws', label: 'Laws', href: 'laws.html' },
        { id: 'diplomacy', label: 'Diplomacy', href: 'diplomacy.html' },
        { id: 'economy', label: 'Economy', href: 'economy.html' },
        { id: 'conflict', label: 'Conflict', href: 'conflict.html' }
    ];
    
    return tabs.map(tab => `
        <a href="${tab.href}" 
           class="nav-tab ${tab.id === activeTab ? 'active' : ''}"
           data-tab="${tab.id}">
            ${tab.label}
        </a>
    `).join('');
}


// ===== TICK COUNTDOWN =====

let tickInterval = null;
let nextTickAt = null;

/**
 * Update the top bar with shard/faction info
 */
function updateTopBarInfo(faction, shard) {
    // Party badge
    const badge = document.getElementById('party-badge');
    if (badge && faction) {
        badge.textContent = faction.faction_name + ' [' + (faction.abbreviation || '—') + ']';
    }
    
    // Tick info
    if (shard) {
        const gameDate = document.getElementById('game-date');
        const tickNumber = document.getElementById('tick-number');
        
        if (gameDate) gameDate.textContent = shard.current_date || '—';
        if (tickNumber) tickNumber.textContent = shard.current_tick || '—';
        
        if (shard.next_tick_at) {
            nextTickAt = new Date(shard.next_tick_at);
            startTickCountdown();
        }
    }
}

/**
 * Start the tick countdown timer
 */
function startTickCountdown() {
    if (tickInterval) {
        clearInterval(tickInterval);
    }
    tickInterval = setInterval(updateCountdown, 1000);
    updateCountdown();
}

/**
 * Update the countdown display
 */
function updateCountdown() {
    const el = document.getElementById('tick-countdown');
    if (!el) return;
    
    if (!nextTickAt) {
        el.textContent = '—';
        return;
    }
    
    const diff = nextTickAt - Date.now();
    
    if (diff <= 0) {
        el.textContent = 'Processing…';
        clearInterval(tickInterval);
        return;
    }
    
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    el.textContent = h + 'h ' + m + 'm ' + s + 's';
}


// ===== UTILITY FUNCTIONS =====

/**
 * Format a number with commas
 */
function formatNumber(n) {
    if (n == null) return 'N/A';
    return Number(n).toLocaleString();
}

/**
 * Format currency
 */
function formatCurrency(n) {
    if (n == null) return 'N/A';
    return '$' + Number(n).toLocaleString();
}

/**
 * Show a loading state in the content area
 */
function showLoading(containerId = 'content-area') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div>Loading...</div>
            </div>
        `;
    }
}


// ===== PAGE INITIALIZATION =====

/**
 * Standard page initialization
 * Call this at the start of each page
 * @param {string} activeTab - The tab ID for this page
 * @param {function} onReady - Callback when state is loaded
 */
async function initPage(activeTab, onReady) {
    // Render top bar immediately (with loading state)
    renderTopBar(activeTab);
    
    // Load game state
    const state = await loadGameState();
    if (!state) return; // Redirect happened
    
    // Update top bar with real data
    updateTopBarInfo(state.faction, state.shard);
    
    // Call page-specific initialization
    if (onReady) {
        await onReady(state);
    }
}
