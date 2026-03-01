/**
 * Common functionality shared across all dashboard pages
 * - State management (user, faction, nation)
 * - Top bar rendering
 * - Navigation
 * - Tick countdown with auto-recovery polling
 * - Population growth calculations
 */

import { _supabase, handleLogout } from './supabase-client.js';
import { tickToDate } from './utils.js';

// ===== QUERY CACHE =====
// Generic sessionStorage cache for Supabase query results.
// Eliminates redundant fetches when navigating between pages.

const _CACHE_PREFIX = 'nh_q_';

export function qCache(key) {
    try {
        const raw = sessionStorage.getItem(_CACHE_PREFIX + key);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (Date.now() > entry.ex) { sessionStorage.removeItem(_CACHE_PREFIX + key); return null; }
        return entry.d;
    } catch { return null; }
}

export function qCacheSet(key, data, ttlMs) {
    try {
        sessionStorage.setItem(_CACHE_PREFIX + key, JSON.stringify({ d: data, ex: Date.now() + ttlMs }));
    } catch { /* storage full — silently skip */ }
}

export function qCacheBust(keyPrefix) {
    try {
        const keys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith(_CACHE_PREFIX + keyPrefix)) keys.push(k);
        }
        keys.forEach(k => sessionStorage.removeItem(k));
    } catch {}
}

/** Fetch with cache: returns cached data or runs queryFn and caches the result. */
export async function cachedQuery(cacheKey, ttlMs, queryFn) {
    const hit = qCache(cacheKey);
    if (hit) return hit;
    const result = await queryFn();
    if (result) qCacheSet(cacheKey, result, ttlMs);
    return result;
}

// ===== STATE MANAGEMENT =====

const STATE_KEY = 'nationhood_state';
const STATE_TTL = 5 * 60 * 1000; // 5 minutes

// Admin inspector overrides: ?nation_id= and ?faction_id= in URL
// Falls back to sessionStorage so overrides survive in-page navigations
// (e.g. Appoint Ambassador link) that may lose URL params.
export function getAdminNationOverride() {
    try {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('nation_id') || null;
        if (fromUrl) { sessionStorage.setItem('_admin_nation', fromUrl); return fromUrl; }
        return sessionStorage.getItem('_admin_nation') || null;
    } catch (e) { return null; }
}

export function getAdminFactionOverride() {
    try {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('faction_id') || null;
        if (fromUrl) { sessionStorage.setItem('_admin_faction', fromUrl); return fromUrl; }
        return sessionStorage.getItem('_admin_faction') || null;
    } catch (e) { return null; }
}

// Clear stale admin overrides when a page loads with NO admin URL params
// and is not inside an iframe (i.e. normal browsing, not admin inspector).
(function clearStaleAdminOverrides() {
    try {
        const params = new URLSearchParams(window.location.search);
        const hasAdminParams = params.has('nation_id') || params.has('faction_id');
        const inIframe = window.parent !== window;
        if (!hasAdminParams && !inIframe) {
            sessionStorage.removeItem('_admin_nation');
            sessionStorage.removeItem('_admin_faction');
        }
    } catch (e) {}
})();

export function getCachedState() {
    // Skip cache entirely when admin override is active — always fetch fresh
    if (getAdminNationOverride() || getAdminFactionOverride()) return null;
    try {
        const cached = sessionStorage.getItem(STATE_KEY);
        if (!cached) return null;
        const state = JSON.parse(cached);
        const age = Date.now() - state.timestamp;
        if (age > STATE_TTL) { console.log('State cache expired, will refresh'); return null; }
        return state;
    } catch (e) { console.error('Error reading cached state:', e); return null; }
}

export function setCachedState(user, faction, nation, shard) {
    // Don't cache admin-overridden states (would pollute normal sessions)
    if (getAdminNationOverride() || getAdminFactionOverride()) return;
    const state = { user, faction, nation, shard, timestamp: Date.now() };
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export async function loadGameState(requireFaction = true) {
    const cached = getCachedState();
    if (cached) { console.log('Using cached state'); return cached; }
    console.log('Fetching fresh state from Supabase');
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return null; }

    // === ADMIN FACTION OVERRIDE ===
    // If ?faction_id= is in the URL, load that faction instead of the user's own.
    const overrideFactionId = getAdminFactionOverride();
    let faction = null;

    if (overrideFactionId) {
        console.log('Admin override: loading faction', overrideFactionId);
        const { data: factionData, error: factionError } = await _supabase
            .from('factions').select('*').eq('id', overrideFactionId).single();
        if (factionError || !factionData) {
            console.warn('Could not load override faction, falling back to user faction');
            const { data: userFaction } = await _supabase
                .from('factions').select('*').eq('id', user.id).single();
            faction = userFaction;
        } else {
            faction = factionData;
        }
    } else {
        const { data: userFaction, error: factionError } = await _supabase
            .from('factions').select('*').eq('id', user.id).single();
        if (factionError || !userFaction) { if (requireFaction) { window.location.href = 'world.html'; return null; } }
        faction = userFaction;
    }

    // === ADMIN NATION OVERRIDE ===
    // If ?nation_id= is in the URL (from admin inspector), load that nation
    // instead of the user's own nation. This lets admins view any nation's pages.
    const overrideNationId = getAdminNationOverride();
    let nation = null;

    if (overrideNationId) {
        console.log('Admin override: loading nation', overrideNationId);
        const { data: nationData } = await _supabase
            .from('nations').select('*').eq('id', overrideNationId).single();
        nation = nationData;
    } else if (faction && faction.nation_id) {
        const { data: nationData } = await _supabase
            .from('nations').select('*').eq('id', faction.nation_id).single();
        nation = nationData;
    }

    const { data: shard } = await _supabase
        .from('shard').select('*').eq('name', 'Alpha Shard').single();

    // When admin override is active, patch faction.nation_id so pages
    // that query using faction.nation_id get the overridden nation
    if (overrideNationId && faction) {
        faction.nation_id = overrideNationId;
        if (nation) faction.nation = nation.name;
    }

    // Inject admin viewing banner when any override is active
    if (overrideNationId || overrideFactionId) {
        setTimeout(() => {
            if (!document.getElementById('admin-override-banner')) {
                const banner = document.createElement('div');
                banner.id = 'admin-override-banner';
                banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(90deg,#8B0000,#cc3300);color:#fff;text-align:center;padding:6px 12px;font-size:0.8rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;opacity:0.9;pointer-events:none;';
                const parts = [];
                if (nation) parts.push('Nation: ' + nation.name);
                if (overrideFactionId && faction) parts.push('Faction: ' + faction.faction_name);
                banner.textContent = '⚠ ADMIN VIEWING — ' + parts.join(' · ') + ' — DO NOT TAKE ACTIONS';
                document.body.prepend(banner);
            }
        }, 100);
    }

    // Fire-and-forget: update last_seen_tick so admin inactivity tracking
    // reflects actual logins, not just AP spending.
    if (faction && shard?.current_tick != null && !overrideFactionId) {
        _supabase.from('factions')
            .update({ last_seen_tick: shard.current_tick })
            .eq('id', faction.id)
            .then(() => {}, () => {});
    }

    setCachedState(user, faction, nation, shard);
    return { user, faction, nation, shard };
}

export async function refreshGameState() {
    sessionStorage.removeItem(STATE_KEY);
    return await loadGameState();
}


// ===== TOP BAR =====

export function renderTopBar(activeTab) {
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
        <button class="hamburger-btn" onclick="document.querySelector('.nav-tabs').classList.toggle('nav-open')" aria-label="Toggle navigation">&#9776;</button>
        <nav class="nav-tabs">
            ${renderNavTabs(activeTab)}
        </nav>
    `;
    document.getElementById('top-bar').innerHTML = topBarHTML;
}

export function renderNavTabs(activeTab) {
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
        { id: 'conflict', label: 'Conflict', href: 'conflict.html' }
    ];

    // Preserve admin overrides in nav links so clicking tabs
    // within the inspector stays on the overridden nation/faction
    const overrideNationId = getAdminNationOverride();
    const overrideFactionId = getAdminFactionOverride();
    
    return tabs.map(tab => {
        let href = tab.href;
        const params = [];
        if (overrideNationId) params.push('nation_id=' + overrideNationId);
        if (overrideFactionId) params.push('faction_id=' + overrideFactionId);
        if (params.length) href += '?' + params.join('&');
        let badgeHtml = '';
        if (tab.id === 'laws') {
            badgeHtml = '<span class="nav-badge" id="bills-badge" style="display:none;"></span><span class="nav-badge-budget" id="budget-due-badge" style="display:none;"></span>';
        } else if (tab.id === 'parties') {
            badgeHtml = '<span class="nav-badge" id="parties-nominee-badge" style="display:none;"></span>';
        }
        return `
            <a href="${href}"
               class="nav-tab ${tab.id === activeTab ? 'active' : ''}"
               data-tab="${tab.id}">
                ${tab.label}${badgeHtml}
            </a>
        `;
    }).join('');
}


// ===== BILLS BADGE (unseen floor bills) =====

function getSeenBills() {
    try { return JSON.parse(localStorage.getItem('nationhood_seen_bills') || '[]'); }
    catch { return []; }
}

export function markBillsSeen(billIds) {
    const seen = getSeenBills();
    const updated = [...new Set([...seen, ...billIds])];
    localStorage.setItem('nationhood_seen_bills', JSON.stringify(updated));
    const badge = document.getElementById('bills-badge');
    if (badge) badge.style.display = 'none';
}

export function cleanSeenBills(activeFloorIds) {
    const seen = getSeenBills();
    const cleaned = seen.filter(id => activeFloorIds.includes(id));
    localStorage.setItem('nationhood_seen_bills', JSON.stringify(cleaned));
}

async function updateBillsBadge(faction, nation, shard) {
    const badge = document.getElementById('bills-badge');
    const budgetDueBadge = document.getElementById('budget-due-badge');
    if (!badge || !faction || !nation) return;
    try {
        const { data: floorBills } = await _supabase
            .from('bills')
            .select('id, bill_type, bill_support(faction_id)')
            .eq('nation_id', nation.id)
            .eq('status', 'floor');

        const seenBills = getSeenBills();
        let count = 0;
        for (const bill of (floorBills || [])) {
            const hasVoted = (bill.bill_support || []).some(s => s.faction_id === faction.id);
            const hasSeen = seenBills.includes(bill.id);
            if (!hasVoted && !hasSeen) count++;
        }

        // Budget cycle detection: cooldown vs early window vs overdue
        const currentTick = shard?.current_tick || 0;
        const lastBudgetTick = Number(nation.last_budget_tick || 0);
        const dueTick = lastBudgetTick > 0 ? lastBudgetTick + 12 : 12;
        const ticksUntilDue = dueTick - currentTick;
        const inEarlyWindow = ticksUntilDue > 0 && ticksUntilDue <= 3;
        const budgetOverdue = ticksUntilDue <= 0;
        const budgetOnCooldown = ticksUntilDue > 3; // hard cooldown

        const hasPendingBudget = (floorBills || []).some(b => b.bill_type === 'budget');
        let hasPendingCommittee = false;
        if (!budgetOnCooldown && !hasPendingBudget) {
            // Also check committee
            const { data: committeeBudget } = await _supabase.from('bills')
                .select('id')
                .eq('nation_id', nation.id)
                .eq('bill_type', 'budget')
                .eq('status', 'committee')
                .limit(1);
            hasPendingCommittee = committeeBudget && committeeBudget.length > 0;
            if (!hasPendingCommittee) {
                count++;
            }
        }

        if (count > 0) {
            badge.textContent = count;
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }

        // Budget Due badge on nav tab (yellow = early window, red = overdue)
        if (budgetDueBadge) {
            const budgetPassedThisCycle = hasPendingBudget || hasPendingCommittee || budgetOnCooldown;
            const reviewTick = Math.max(0, dueTick - 3);
            const reviewDate = tickToDate(reviewTick);
            const submitDate = tickToDate(dueTick);
            if (!budgetPassedThisCycle && (inEarlyWindow || budgetOverdue)) {
                budgetDueBadge.textContent = budgetOverdue ? 'OVERDUE' : 'DUE';
                budgetDueBadge.className = 'nav-badge-budget ' + (budgetOverdue ? 'nav-badge-budget-red' : 'nav-badge-budget-yellow');
                budgetDueBadge.title = budgetOverdue
                    ? 'Budget is overdue! Review Available: ' + reviewDate + '. Open to Submit: ' + submitDate + '.'
                    : 'Review Available: ' + reviewDate + '. Open to Submit: ' + submitDate + '.';
                budgetDueBadge.style.display = '';
            } else {
                budgetDueBadge.style.display = 'none';
            }
        }
    } catch (e) {
        console.error('Error updating bills badge:', e);
    }
}


// ===== PRESIDENTIAL NOMINEE BADGE =====

async function updatePresNomineeBadge(faction, nation) {
    const badge = document.getElementById('parties-nominee-badge');
    if (!badge || !faction || !nation) return;
    try {
        // Only for presidential republics (canonical: 'Presidential', legacy: 'Presidential Republic')
        const gt = (nation.government_type || '').toLowerCase();
        if (gt !== 'presidential' && gt !== 'presidential republic') return;
        // Check for unselected presidential candidates for this faction
        const { count } = await _supabase
            .from('pm_candidates')
            .select('*', { count: 'exact', head: true })
            .eq('nation_id', nation.id)
            .eq('faction_id', faction.id)
            .eq('candidate_type', 'presidential')
            .eq('selected', false);
        if ((count || 0) > 0) {
            badge.textContent = '!';
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
    } catch (e) {
        console.error('Error updating presidential nominee badge:', e);
    }
}


// ===== TICK COUNTDOWN =====

let tickInterval = null;
let nextTickAt = null;
let tickPoller = null;

export function updateTopBarInfo(faction, shard, nation) {
    const badge = document.getElementById('party-badge');
    if (badge) {
        if (faction && faction.nation_id) {
            badge.textContent = faction.faction_name + ' [' + (faction.abbreviation || '—') + ']';
        } else {
            badge.textContent = '[No Party]';
        }
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
        el.textContent = 'Tick due — awaiting server…';
        clearInterval(tickInterval);
        // Don't auto-advance from the browser. The server-side Edge Function
        // (or admin panel) will process the tick. Poll for the update.
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
 * Used as fallback when this page can't trigger the tick itself.
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

                    // Bust all stale caches so any navigation
                    // or refresh loads fresh data
                    sessionStorage.removeItem(STATE_KEY);
                    qCacheBust('');  // clear all query caches on tick change

                    // Notify any page-level listeners that a tick advanced
                    window.dispatchEvent(new Event('tick-advanced'));

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

export function formatNumber(n) {
    if (n == null) return 'N/A';
    return Number(n).toLocaleString();
}

export function formatCurrency(n) {
    if (n == null) return 'N/A';
    return '$' + Number(n).toLocaleString();
}

/**
 * GDP and debt are stored in the DB as raw dollars:
 *   88,000,000,000 = $88 Billion
 *
 * This function is now a pass-through. It exists only to avoid
 * breaking callers (nation.html, map.html) that still
 * reference it. No conversion is needed — formatCurrencyShort()
 * handles the display formatting directly.
 */
export function scaleRawToDollars(val) {
    return val;
}

export function showLoading(containerId = 'content-area') {
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
//
// Population growth base is derived from birth_rate - death_rate.
// Policies and crises can shift population_growth up or down from this base.
//
// population_growth is a 0-100 stat where:
//   0   = max population decline (-1% per tick)
//   50  = equilibrium (no change)
//   100 = max population growth  (+1% per tick)

export function calculatePopulationGrowth(nation) {
    const birthRate = Number(nation.birth_rate ?? 50);
    const deathRate = Number(nation.death_rate ?? 50);

    // Base: maps (birth_rate - death_rate) from -100..+100 onto 0..100
    const base = 50 + (birthRate - deathRate) / 2;

    return Math.round(Math.max(0, Math.min(100, base)) * 10) / 10;
}

export function calculatePopulationChange(population, growthScore, maxRate = 0.01) {
    const monthlyRate = ((growthScore - 50) / 50) * maxRate;
    return Math.round(population * monthlyRate);
}

export function applyPopulationGrowth(nation) {
    const growthScore = calculatePopulationGrowth(nation);
    const popChange = calculatePopulationChange(nation.population, growthScore);
    const newPopulation = Math.max(0, nation.population + popChange);

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

    const voterRatio = nation.population > 0 ? (nation.eligible_voters / nation.population) : 0;
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

export function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('nationhood_theme', isLight ? 'light' : 'dark');
    updateThemeButton();
}

export function updateThemeButton() {
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

export async function initPage(activeTab, onReady, requireFaction = true) {
    renderTopBar(activeTab);
    updateThemeButton();
    const state = await loadGameState(requireFaction);
    if (!state) return;
    updateTopBarInfo(state.faction, state.shard, state.nation);
    // Update bills badge (non-blocking, skip on laws page since it marks seen)
    if (activeTab !== 'laws') {
        updateBillsBadge(state.faction, state.nation, state.shard);
    }
    // Update presidential nominee badge (non-blocking)
    updatePresNomineeBadge(state.faction, state.nation);
    if (onReady) {
        await onReady(state);
    }
}

// Expose onclick handlers used by renderTopBar() HTML templates
window.handleLogout = handleLogout;
window.toggleTheme = toggleTheme;
