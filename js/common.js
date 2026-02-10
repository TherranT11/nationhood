/**
 * Common functionality shared across all dashboard pages
 * - State management (user, faction, nation)
 * - Top bar rendering
 * - Navigation
 * - Tick countdown with auto-recovery polling
 * - Population growth calculations
 */

// ===== STATE MANAGEMENT =====

const STATE_KEY = 'nationhood_state';
const STATE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedState() {
    try {
        const cached = sessionStorage.getItem(STATE_KEY);
        if (!cached) return null;
        const state = JSON.parse(cached);
        const age = Date.now() - state.timestamp;
        if (age > STATE_TTL) { console.log('State cache expired, will refresh'); return null; }
        return state;
    } catch (e) { console.error('Error reading cached state:', e); return null; }
}

function setCachedState(user, faction, nation, shard) {
    const state = { user, faction, nation, shard, timestamp: Date.now() };
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
}

async function loadGameState(requireFaction = true) {
    const cached = getCachedState();
    if (cached) { console.log('Using cached state'); return cached; }
    console.log('Fetching fresh state from Supabase');
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return null; }
    const { data: faction, error: factionError } = await _supabase
        .from('factions').select('*').eq('id', user.id).single();
    if (factionError || !faction) { if (requireFaction) { window.location.href = 'world.html'; return null; } }
    let nation = null;
    if (faction && faction.nation_id) {
        const { data: nationData } = await _supabase
            .from('nations').select('*').eq('id', faction.nation_id).single();
        nation = nationData;
    }
    const { data: shard } = await _supabase
        .from('shard').select('*').eq('name', 'Alpha Shard').single();
    setCachedState(user, faction, nation, shard);
    return { user, faction, nation, shard };
}

async function refreshGameState() {
    sessionStorage.removeItem(STATE_KEY);
    return await loadGameState();
}


// ===== TOP BAR =====

function renderTopBar(activeTab) {
    const topBarHTML = `
        <div class="top-bar-row1">
            <div class="top-bar-left">
                <div class="nation-badge" id="nation-badge">
                    <img class="nation-flag" id="nation-flag" src="" alt="" style="display: none;">
                    <span class="nation-name" id="nation-name">Loading...</span>
                </div>
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
                <button class="theme-toggle-btn" onclick="toggleTheme()" id="theme-toggle" title="Toggle light/dark mode">☀️ Light</button>
                <button class="logout-btn" onclick="handleLogout()">Abandon Session</button>
            </div>
        </div>
        <nav class="nav-tabs">
            ${renderNavTabs(activeTab)}
        </nav>
    `;
    document.getElementById('top-bar').innerHTML = topBarHTML;
}

function renderNavTabs(activeTab) {
    const tabs = [
        { id: 'world', label: 'World', href: 'world.html' },
        { id: 'nation', label: 'Nation', href: 'nation.html' },
        { id: 'government', label: 'Government', href: 'government.html' },
        { id: 'ministry-actions', label: 'Ministry', href: 'ministry-actions.html' },
        { id: 'parties', label: 'Parties', href: 'parties.html' },
        { id: 'elections', label: 'Elections', href: 'elections.html' },
        { id: 'laws', label: 'Bills', href: 'laws.html' },
        { id: 'diplomacy', label: 'Diplomacy', href: 'diplomacy.html' },
        { id: 'economy', label: 'Economy', href: 'economy.html' },
        { id: 'events', label: 'Events', href: 'events.html' },
        { id: 'factions', label: 'Factions', href: 'factions.html' },
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
let tickPoller = null;

function updateTopBarInfo(faction, shard, nation) {
    const badge = document.getElementById('party-badge');
    if (badge && faction) {
        badge.textContent = faction.faction_name + ' [' + (faction.abbreviation || '—') + ']';
    }
    
    const nationFlag = document.getElementById('nation-flag');
    const nationName = document.getElementById('nation-name');
    
    if (nation) {
        if (nationName) nationName.textContent = nation.name || 'Unknown Nation';
        if (nationFlag && nation.flag_url) {
            nationFlag.src = nation.flag_url;
            nationFlag.alt = nation.name + ' flag';
            nationFlag.style.display = 'block';
        }

        // Rename tabs for autocracies
        if (nation.government_type === 'Autocracy') {
            const partiesTab = document.querySelector('.nav-tab[data-tab="parties"]');
            if (partiesTab) partiesTab.textContent = 'Inner Circle';
            const electionsTab = document.querySelector('.nav-tab[data-tab="elections"]');
            if (electionsTab) electionsTab.textContent = 'Regime';
        }
    } else {
        if (nationName) nationName.textContent = 'No Nation';
    }
    
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

function startTickCountdown() {
    if (tickInterval) clearInterval(tickInterval);
    if (tickPoller) { clearInterval(tickPoller); tickPoller = null; }
    tickInterval = setInterval(updateCountdown, 1000);
    updateCountdown();
}

function updateCountdown() {
    const el = document.getElementById('tick-countdown');
    if (!el) return;
    if (!nextTickAt) { el.textContent = '—'; return; }

    const diff = nextTickAt - Date.now();

    if (diff <= 0) {
        el.textContent = 'Processing…';
        clearInterval(tickInterval);
        pollForNewTick();
        return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = h + 'h ' + m + 'm ' + s + 's';
}

/**
 * After the countdown reaches zero, poll Supabase every 5 seconds
 * until a new next_tick_at is detected, then restart the countdown.
 * This fixes the "stuck on Processing…" bug — previously the interval
 * was killed and nothing ever checked for the tick to finish.
 */
function pollForNewTick() {
    // Don't start a second poller if one is already running
    if (tickPoller) return;

    const oldNextTick = nextTickAt ? nextTickAt.getTime() : 0;
    let attempts = 0;
    const maxAttempts = 60; // ~5 minutes at 5s intervals

    tickPoller = setInterval(async () => {
        attempts++;

        try {
            const { data: shard } = await _supabase
                .from('shard')
                .select('next_tick_at, current_tick, current_date')
                .eq('name', 'Alpha Shard')
                .single();

            if (shard?.next_tick_at) {
                const newTime = new Date(shard.next_tick_at).getTime();

                if (newTime > oldNextTick) {
                    // Tick finished — update the UI
                    clearInterval(tickPoller);
                    tickPoller = null;

                    nextTickAt = new Date(shard.next_tick_at);

                    // Update tick number and game date in the top bar
                    const tickEl = document.getElementById('tick-number');
                    if (tickEl) tickEl.textContent = shard.current_tick || '—';
                    const dateEl = document.getElementById('game-date');
                    if (dateEl) dateEl.textContent = shard.current_date || '—';

                    // Bust the stale sessionStorage cache so any navigation
                    // or refresh loads fresh data
                    sessionStorage.removeItem(STATE_KEY);

                    // Restart the countdown with the new target
                    startTickCountdown();
                }
            }
        } catch (e) {
            console.warn('Tick poll error:', e);
        }

        // Safety valve — stop polling after too many attempts
        if (attempts >= maxAttempts) {
            clearInterval(tickPoller);
            tickPoller = null;
            const el = document.getElementById('tick-countdown');
            if (el) el.textContent = 'Refresh page';
        }
    }, 5000);
}


// ===== UTILITY FUNCTIONS =====

function formatNumber(n) {
    if (n == null) return 'N/A';
    return Number(n).toLocaleString();
}

function formatCurrency(n) {
    if (n == null) return 'N/A';
    return '$' + Number(n).toLocaleString();
}

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

function calculatePopulationGrowth(nation) {
    const factors = [
        { key: 'birth_rate', weight: 3.0, invert: false },
        { key: 'immigration', weight: 2.0, invert: false },
        { key: 'healthcare_quality', weight: 1.5, invert: false },
        { key: 'lifespan', weight: 1.5, invert: false },
        { key: 'standard_of_living', weight: 1.0, invert: false },
        { key: 'happiness', weight: 1.0, invert: false },
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
    
    let totalWeight = 0, totalScore = 0;
    for (const factor of factors) {
        const rawValue = nation[factor.key] ?? 50;
        const value = factor.invert ? (100 - rawValue) : rawValue;
        totalScore += value * factor.weight;
        totalWeight += factor.weight;
    }
    return Math.round(totalScore / totalWeight);
}

function calculatePopulationChange(population, growthScore, maxRate = 0.01) {
    const monthlyRate = ((growthScore - 50) / 50) * maxRate;
    return Math.round(population * monthlyRate);
}

function applyPopulationGrowth(nation) {
    const growthScore = calculatePopulationGrowth(nation);
    const popChange = calculatePopulationChange(nation.population, growthScore);
    const newPopulation = nation.population + popChange;
    
    const ideologyKeys = [
        'progressive_voters', 'liberal_voters', 'moderate_voters',
        'conservative_voters', 'nationalist_voters'
    ];
    
    let totalVoters = 0;
    const currentVoters = {};
    for (const key of ideologyKeys) {
        const value = nation[key] ?? 0;
        currentVoters[key] = value;
        totalVoters += value;
    }
    
    const updatedVoters = {};
    for (const key of ideologyKeys) {
        if (totalVoters > 0) {
            const share = currentVoters[key] / totalVoters;
            updatedVoters[key] = Math.round(currentVoters[key] + (popChange * share));
        } else {
            updatedVoters[key] = currentVoters[key];
        }
    }
    
    const voterRatio = nation.eligible_voters / nation.population;
    const newEligibleVoters = Math.round(newPopulation * voterRatio);
    
    return {
        population_growth: growthScore,
        population: newPopulation,
        eligible_voters: newEligibleVoters,
        population_change: popChange,
        ...updatedVoters
    };
}


// ===== THEME (LIGHT / DARK) =====

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('nationhood_theme', isLight ? 'light' : 'dark');
    updateThemeButton();
}

function updateThemeButton() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isLight = document.body.classList.contains('light-mode');
    btn.textContent = isLight ? '🌙 Dark' : '☀️ Light';
}

// Apply saved theme immediately (before page renders fully)
(function() {
    if (localStorage.getItem('nationhood_theme') === 'light') {
        document.body.classList.add('light-mode');
    }
})();


// ===== PAGE INITIALIZATION =====

async function initPage(activeTab, onReady, requireFaction = true) {
    renderTopBar(activeTab);
    updateThemeButton();
    const state = await loadGameState(requireFaction);
    if (!state) return;
    updateTopBarInfo(state.faction, state.shard, state.nation);
    if (onReady) {
        await onReady(state);
    }
}
