/**
 * Common functionality shared across all dashboard pages
 * - State management (user, faction, nation)
 * - Top bar rendering
 * - Navigation
 * - Tick countdown
 * - Population growth calculations
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
async function loadGameState(requireFaction = true) {
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
        window.location.href = 'login.html';
        return null;
    }
    
    // Get faction
    const { data: faction, error: factionError } = await _supabase
        .from('factions')
        .select('*')
        .eq('id', user.id)
        .single();
    
if (factionError || !faction) {
    if (requireFaction) {
        window.location.href = 'world.html';
        return null;
    }
}
    
    // Get nation
    let nation = null;
    if (faction && faction.nation_id) {
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
            <div class="top-bar-left">
                <!-- Nation Flag & Name -->
                <div class="nation-badge" id="nation-badge">
                    <img class="nation-flag" id="nation-flag" src="" alt="" style="display: none;">
                    <span class="nation-name" id="nation-name">Loading...</span>
                </div>
                
                <!-- Tick Info -->
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
 * Update the top bar with shard/faction/nation info
 */
function updateTopBarInfo(faction, shard, nation) {
    // Party badge
    const badge = document.getElementById('party-badge');
    if (badge && faction) {
        badge.textContent = faction.faction_name + ' [' + (faction.abbreviation || '—') + ']';
    }
    
    // Nation flag and name
    const nationFlag = document.getElementById('nation-flag');
    const nationName = document.getElementById('nation-name');
    
    if (nation) {
        // Set nation name
        if (nationName) {
            nationName.textContent = nation.name || 'Unknown Nation';
        }
        
        // Set flag if available
        if (nationFlag && nation.flag_url) {
            nationFlag.src = nation.flag_url;
            nationFlag.alt = nation.name + ' flag';
            nationFlag.style.display = 'block';
        }
    } else {
        if (nationName) {
            nationName.textContent = 'No Nation';
        }
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


// ===== POPULATION GROWTH CALCULATION =====

/**
 * Calculate Population Growth score (0-100) from contributing stats
 * @param {object} nation - Nation object with all stats
 * @returns {number} Population growth score (0-100)
 */
function calculatePopulationGrowth(nation) {
    const factors = [
        // Positive factors (use raw value)
        { key: 'birth_rate', weight: 3.0, invert: false },
        { key: 'immigration', weight: 2.0, invert: false },
        { key: 'healthcare_quality', weight: 1.5, invert: false },
        { key: 'lifespan', weight: 1.5, invert: false },
        { key: 'standard_of_living', weight: 1.0, invert: false },
        { key: 'happiness', weight: 1.0, invert: false },
        
        // Negative factors (invert: 100 - value)
        { key: 'death_rate', weight: 3.0, invert: true },
        { key: 'emigration', weight: 2.0, invert: true },
        { key: 'poverty_rate', weight: 1.0, invert: true },
        { key: 'pollution', weight: 0.5, invert: true },
        { key: 'crime_rate', weight: 0.5, invert: true },
        { key: 'political_violence', weight: 0.75, invert: true },
        { key: 'civil_unrest', weight: 0.75, invert: true },
        { key: 'drug_use', weight: 0.5, invert: true },
        { key: 'terrorism', weight: 0.5, invert: true }
    ];
    
    let totalWeight = 0;
    let totalScore = 0;
    
    for (const factor of factors) {
        const rawValue = nation[factor.key] ?? 50; // Default to 50 if missing
        const value = factor.invert ? (100 - rawValue) : rawValue;
        
        totalScore += value * factor.weight;
        totalWeight += factor.weight;
    }
    
    return Math.round(totalScore / totalWeight);
}

/**
 * Calculate monthly population change based on growth score
 * @param {number} population - Current total population
 * @param {number} growthScore - Population growth score (0-100)
 * @param {number} maxRate - Maximum monthly rate (default 0.01 = 1%)
 * @returns {number} Population change (positive or negative)
 */
function calculatePopulationChange(population, growthScore, maxRate = 0.01) {
    const monthlyRate = ((growthScore - 50) / 50) * maxRate;
    return Math.round(population * monthlyRate);
}

/**
 * Apply population growth to a nation
 * Updates population and distributes change across ideology voters
 * @param {object} nation - Nation object with population and voter data
 * @returns {object} Object with updated values to save
 */
function applyPopulationGrowth(nation) {
    // Calculate growth score
    const growthScore = calculatePopulationGrowth(nation);
    
    // Calculate population change
    const popChange = calculatePopulationChange(nation.population, growthScore);
    
    // New total population
    const newPopulation = nation.population + popChange;
    
    // Get current ideology voters (assuming these are stored on nation object)
    // Adjust these keys to match your actual database columns
    const ideologyKeys = [
        'progressive_voters',
        'liberal_voters', 
        'moderate_voters',
        'conservative_voters',
        'nationalist_voters'
    ];
    
    // Calculate total voters and distribute change proportionally
    let totalVoters = 0;
    const currentVoters = {};
    
    for (const key of ideologyKeys) {
        const value = nation[key] ?? 0;
        currentVoters[key] = value;
        totalVoters += value;
    }
    
    // Distribute population change across ideologies
    const updatedVoters = {};
    for (const key of ideologyKeys) {
        if (totalVoters > 0) {
            const share = currentVoters[key] / totalVoters;
            updatedVoters[key] = Math.round(currentVoters[key] + (popChange * share));
        } else {
            updatedVoters[key] = currentVoters[key];
        }
    }
    
    // Also update eligible_voters (assuming it tracks voting-age population)
    const voterRatio = nation.eligible_voters / nation.population;
    const newEligibleVoters = Math.round(newPopulation * voterRatio);
    
    return {
        population_growth: growthScore,
        population: newPopulation,
        eligible_voters: newEligibleVoters,
        population_change: popChange, // For logging/display
        ...updatedVoters
    };
}


// ===== PAGE INITIALIZATION =====

/**
 * Standard page initialization
 * Call this at the start of each page
 * @param {string} activeTab - The tab ID for this page
 * @param {function} onReady - Callback when state is loaded
 */
async function initPage(activeTab, onReady, requireFaction = true) {
    renderTopBar(activeTab);
    const state = await loadGameState(requireFaction);
    if (!state) return;
    updateTopBarInfo(state.faction, state.shard, state.nation);
    if (onReady) {
        await onReady(state);
    }
}
