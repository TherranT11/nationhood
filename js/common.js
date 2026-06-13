/**
 * Common functionality shared across all dashboard pages
 * - State management (user, faction, nation)
 * - Top bar rendering
 * - Navigation
 * - Tick countdown with auto-recovery polling
 * - Population growth calculations
 */

import { _supabase, handleLogout, IS_WORK_ENV } from './supabase-client.js';
import { recordFingerprint, checkBanStatus, enforceBan } from './fingerprint.js';
import { hasActiveGovernment } from './game/government-structure.js';
import { isFactionInactive, isHiddenFromSwitcher, getFactionDashboardUrl, addCharacterSlot, activateAddCharacter } from './game/factions.js';
import { escapeHtml, flagUrlFor } from './utils.js';

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



export async function fetchPreviousNationTick(nationId, currentTick) {
    if (currentTick == null) return { previousTick: null, historyFetchFailed: false };
    const prevTickNum = currentTick - 1;
    if (prevTickNum < 0) return { previousTick: null, historyFetchFailed: false };

    const histRes = await _supabase
        .from('nations_history')
        .select('*')
        .eq('nation_id', nationId)
        .eq('tick', prevTickNum)
        .limit(1);

    if (histRes.error) {
        console.error('[trend] nations_history fetch failed', {
            nation_id: nationId,
            prevTickNum,
            error: histRes.error
        });
        return { previousTick: null, historyFetchFailed: true };
    }

    const prev = (histRes.data && histRes.data.length > 0) ? histRes.data[0] : null;
    if (prev) return { previousTick: prev, historyFetchFailed: false };

    // Exact previous tick not found — fall back to most recent snapshot.
    // Cap at 2 ticks of staleness: if the nearest snapshot is >2 ticks old
    // the delta would span many ticks and be misleading (e.g. "+4" when the
    // stat hasn't changed in 17 ticks).  In that case return null so the UI
    // shows "—" instead of a stale cumulative delta.
    const MAX_FALLBACK_AGE = 2;
    const fbRes = await _supabase
        .from('nations_history')
        .select('*')
        .eq('nation_id', nationId)
        .gte('tick', currentTick - MAX_FALLBACK_AGE - 1)
        .lt('tick', currentTick)
        .order('tick', { ascending: false })
        .limit(1);

    const fallback = (fbRes.data && fbRes.data.length > 0) ? fbRes.data[0] : null;
    return { previousTick: fallback, historyFetchFailed: false };
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
// that may lose URL params.
// Admin overrides are gated behind server-side admin role verification.
// The _admin_verified flag is set ONLY after verify_admin_access() RPC succeeds.
let _admin_verified = false;

// Multi-faction support: all factions owned by the current user
let _userFactions = [];
export function getUserFactions() { return _userFactions; }
export function switchFaction(factionId) {
    sessionStorage.setItem('active_faction_id', factionId);
    sessionStorage.removeItem(STATE_KEY); // Clear cached state to force reload
    window.location.reload();
}

export async function verifyAdminOverrides() {
    if (_admin_verified) return true;
    try {
        const { data } = await _supabase.rpc('verify_admin_access');
        _admin_verified = !!(data?.authorized);
    } catch (e) { _admin_verified = false; }
    return _admin_verified;
}

export function getAdminNationOverride() {
    if (!_admin_verified) return null; // Block unless server-verified admin
    try {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('nation_id') || null;
        if (fromUrl) { sessionStorage.setItem('_admin_nation', fromUrl); return fromUrl; }
        return sessionStorage.getItem('_admin_nation') || null;
    } catch (e) { return null; }
}

export function getAdminFactionOverride() {
    if (!_admin_verified) return null; // Block unless server-verified admin
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
    // Skip cache entirely when admin override is active — always fetch fresh.
    // Check URL params AND sessionStorage (for in-iframe navigation without params).
    // _admin_verified is false at this point so we can't use getAdminNationOverride().
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.has('nation_id') || params.has('faction_id')) return null;
        if (sessionStorage.getItem('_admin_nation') || sessionStorage.getItem('_admin_faction')) return null;
    } catch (_) {}
    if (getAdminNationOverride() || getAdminFactionOverride()) return null;
    try {
        const cached = sessionStorage.getItem(STATE_KEY);
        if (!cached) return null;
        const state = JSON.parse(cached);
        const age = Date.now() - state.timestamp;
        if (age > STATE_TTL) { console.log('State cache expired, will refresh'); return null; }
        // Invalidate cache if active faction changed (e.g. switched from corp to party)
        const activeFactionId = sessionStorage.getItem('active_faction_id');
        if (activeFactionId && state.faction && state.faction.id !== activeFactionId) {
            console.log('Active faction changed, invalidating cache');
            return null;
        }
        return state;
    } catch (e) { console.error('Error reading cached state:', e); return null; }
}

export function setCachedState(user, faction, nation, shard) {
    // Don't cache admin-overridden states (would pollute normal sessions)
    if (getAdminNationOverride() || getAdminFactionOverride()) return;
    const state = { user, faction, nation, shard, timestamp: Date.now() };
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function shouldRefreshNationForPage() {
    try {
        const page = (window.location.pathname || '').split('/').pop()?.toLowerCase() || '';
        return page === 'economy.html' || page === 'laws.html' || page === 'bill.html';
    } catch (e) {
        return false;
    }
}

async function refreshCachedNation(cached) {
    if (!cached?.faction?.nation_id && !cached?.nation?.id) return cached;
    const nationId = cached.faction?.nation_id || cached.nation?.id;
    const { data: freshNation, error } = await _supabase
        .from('nations')
        .select('*')
        .eq('id', nationId)
        .single();

    if (error || !freshNation) {
        console.warn('Failed to refresh cached nation for page, using cached nation', error?.message || error);
        return cached;
    }

    const refreshed = { ...cached, nation: freshNation, timestamp: Date.now() };
    sessionStorage.setItem(STATE_KEY, JSON.stringify(refreshed));
    return refreshed;
}

export async function loadGameState(requireFaction = true) {
    const cached = getCachedState();
    if (cached) {
        // Always load factions for the dropdown switcher (cache doesn't store _userFactions)
        if (_userFactions.length === 0 && cached.faction?.id) {
            try {
                const userId = (await _supabase.auth.getUser())?.data?.user?.id;
                if (userId) {
                    const { data: allFactions } = await _supabase
                        .from('factions').select('*')
                        .or(`id.eq.${userId},linked_user_id.eq.${userId}`);
                    _userFactions = (allFactions || []).filter(f => !isFactionInactive(f));
                    // Shard reset guard: cached faction no longer exists in DB
                    if (_userFactions.length === 0) {
                        console.log('Cached faction deleted (shard reset?) — clearing cache');
                        sessionStorage.removeItem(STATE_KEY);
                        if (requireFaction) {
                            window.location.href = 'faction-select.html';
                            return null;
                        }
                    }
                }
            } catch (_) { /* dropdown will just show current faction */ }
        }
        if (shouldRefreshNationForPage()) {
            console.log('Using cached user/faction/shard with fresh nation for current page');
            return await refreshCachedNation(cached);
        }
        console.log('Using cached state');
        return cached;
    }
    console.log('Fetching fresh state from Supabase');
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return null; }

    // Verify admin overrides server-side before allowing inspection.
    // Check both URL params (initial load) and sessionStorage (in-iframe navigation).
    const urlParams = new URLSearchParams(window.location.search);
    const hasAdminContext = urlParams.has('faction_id') || urlParams.has('nation_id')
        || sessionStorage.getItem('_admin_nation') || sessionStorage.getItem('_admin_faction');
    if (hasAdminContext) {
        await verifyAdminOverrides();
    }

    // === ADMIN FACTION OVERRIDE ===
    // If ?faction_id= is in the URL and user is a server-verified admin, load that faction.
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
        // Load ALL factions owned by this user (primary + linked)
        const { data: allFactions } = await _supabase
            .from('factions').select('*')
            .or(`id.eq.${user.id},linked_user_id.eq.${user.id}`);

        const ownedFactions = (allFactions || []).filter(f => !isFactionInactive(f));
        // Store all factions for the dropdown switcher
        _userFactions = ownedFactions;

        if (ownedFactions.length === 0) {
            if (requireFaction) {
                sessionStorage.removeItem(STATE_KEY);
                window.location.href = 'faction-select.html';
                return null;
            }
        } else {
            // Pick the active faction from sessionStorage, or default to
            // primary. Sunset Phase 1 (20270612): party / movement_party
            // factions are filtered out of the pick so a stale
            // sessionStorage active_faction_id pointing at a party row
            // is overridden — the user lands on a Politician or
            // Entrepreneur they own instead. Existing party rows still
            // exist; this is only the entry-point gate. If a user owns
            // *only* parties (degenerate post-sunset edge case), fall
            // through to the unfiltered list so the app still loads.
            const switchable = ownedFactions.filter(f => !isHiddenFromSwitcher(f));
            const pool       = switchable.length ? switchable : ownedFactions;
            const activeFactionId = sessionStorage.getItem('active_faction_id');
            faction = pool.find(f => f.id === activeFactionId)
                || pool.find(f => f.id === user.id)
                || pool[0];
            // If the previously-stored active was a party, clear the
            // sessionStorage stamp so the next visit doesn't keep
            // re-targeting it (the line above already overrode it for
            // this load; this just stops the stale value from sticking).
            if (activeFactionId && !pool.find(f => f.id === activeFactionId)) {
                sessionStorage.setItem('active_faction_id', faction.id);
            }
        }
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

    // Admin override banner removed — admin viewing is logged in console only
    if (overrideNationId || overrideFactionId) {
        console.log('Admin override:', overrideNationId ? 'nation=' + (nation?.name || overrideNationId) : '', overrideFactionId ? 'faction=' + (faction?.faction_name || overrideFactionId) : '');
    }

    // Update last_seen_tick for inactivity tracking (fire-and-forget)
    if (faction && faction.nation_id && shard && shard.current_tick > 0 && !overrideFactionId) {
        _supabase.from('factions')
            .update({ last_seen_tick: shard.current_tick })
            .eq('id', faction.id)
            .then(() => {})
            .catch(err => console.warn('Failed to update last_seen_tick:', err));
    }

    setCachedState(user, faction, nation, shard);

    // Check if player's party was disbanded by Party Registration Act
    checkRegistrationActDisbanded(faction);

    return { user, faction, nation, shard };
}

export async function refreshGameState() {
    sessionStorage.removeItem(STATE_KEY);
    return await loadGameState();
}

// ===== PARTY REGISTRATION ACT POPUP =====
// Shows a persistent modal if the player's party was disbanded by the Political Party
// Registration Act. Persists across page loads until [OK] is clicked, then never again.
export async function checkRegistrationActDisbanded(faction) {
    if (!faction) return;
    if (!faction.registration_act_disbanded) return;
    if (faction.registration_act_dismissed) return;

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;';
    const modal = document.createElement('div');
    modal.style.cssText = 'background:#1a1a16;border:2px solid #c55;border-radius:8px;padding:32px 40px;max-width:520px;text-align:center;font-family:"IBM Plex Sans",sans-serif;';
    modal.innerHTML = `
        <div style="font-size:1.4rem;font-weight:bold;color:#c55;margin-bottom:16px;">Message from the Electoral Commission</div>
        <div style="font-size:0.9rem;color:#e8e4dc;line-height:1.6;margin-bottom:24px;">
            Due to new laws, your party did not meet the threshold for seats in the legislature.
            You should continue to fight and campaign as opposition until you can be seated in the legislature.
        </div>
        <button id="registration-act-ok-btn" style="padding:10px 40px;font-family:'JetBrains Mono',monospace;font-size:0.85rem;font-weight:bold;letter-spacing:2px;background:#c55;color:#000;border:none;cursor:pointer;">OK</button>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('registration-act-ok-btn').addEventListener('click', async () => {
        overlay.remove();
        // Mark as dismissed so it never shows again
        try {
            await _supabase.from('factions').update({ registration_act_dismissed: true }).eq('id', faction.id);
        } catch (e) { console.warn('Failed to dismiss registration act popup:', e); }
    });
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
                <div class="top-bar-sep"></div>
                <div class="tick-info">
                    <div class="tick-item">
                        <div class="tick-label">Game Date</div>
                        <div class="tick-value" id="game-date">--</div>
                    </div>
                    <div class="tick-item">
                        <div class="tick-label">Tick</div>
                        <div class="tick-value" id="tick-number">--</div>
                    </div>
                    <div class="tick-item">
                        <div class="tick-label">Next Tick</div>
                        <div class="tick-value" id="tick-countdown">--</div>
                    </div>
                </div>
            </div>
            <div class="top-bar-right">
                <div class="notif-wrap">
                    <button class="notif-bell" id="notif-bell" type="button" aria-label="Notifications" aria-haspopup="true" aria-expanded="false">
                        <span class="notif-bell__icon" aria-hidden="true">&#x1F514;</span>
                        <span class="notif-bell__dot" id="notif-dot" hidden></span>
                    </button>
                    <div class="notif-dropdown" id="notif-dropdown" role="menu" hidden>
                        <div class="notif-dropdown__header">
                            <span class="notif-dropdown__title">Notifications</span>
                            <span class="notif-dropdown__count" id="notif-count">0</span>
                        </div>
                        <div class="notif-dropdown__list" id="notif-list">
                            <div class="notif-empty">Loading…</div>
                        </div>
                    </div>
                </div>
                <span class="topbar-ap" id="topbar-ap"></span>
                <div class="faction-switcher" id="faction-switcher">
                    <span class="party-badge" id="party-badge" onclick="toggleFactionDropdown()" style="cursor:pointer;">--</span>
                    <div class="faction-dropdown" id="faction-dropdown"></div>
                </div>
                <button class="theme-toggle-btn" onclick="toggleTheme()" id="theme-toggle" title="Toggle light/dark mode">Light</button>
                <button class="logout-btn" onclick="handleLogout()">Logout</button>
            </div>
        </div>
        <button class="hamburger-btn" onclick="document.querySelector('.nav-tabs').classList.toggle('nav-open')" aria-label="Toggle navigation">&#9776;</button>
        <nav class="nav-tabs">
            ${renderNavTabs(activeTab)}
        </nav>
    `;
    document.getElementById('top-bar').innerHTML = topBarHTML;

    // Mobile bottom nav bar
    if (!document.getElementById('mobile-bottom-nav')) {
        const overrideNationId = getAdminNationOverride();
        const overrideFactionId = getAdminFactionOverride();
        const qs = [];
        if (overrideNationId) qs.push('nation_id=' + overrideNationId);
        if (overrideFactionId) qs.push('faction_id=' + overrideFactionId);
        const suffix = qs.length ? '?' + qs.join('&') : '';

        const mobileNav = document.createElement('nav');
        mobileNav.id = 'mobile-bottom-nav';
        mobileNav.className = 'mobile-bottom-nav';
        mobileNav.innerHTML = [
            { id: 'dashboard', label: 'Home',  icon: '\uD83C\uDFE0', href: 'dashboard.html' },
            { id: 'politics',  label: 'Actions', icon: '\u2694\uFE0F', href: 'politics.html' },
        ].map(tab => `<a href="${tab.href}${suffix}" class="mobile-bottom-nav__item ${tab.id === activeTab ? 'active' : ''}" data-tab="${tab.id}">
            <span class="mobile-bottom-nav__icon">${tab.icon}</span>
            <span class="mobile-bottom-nav__label">${tab.label}</span>
        </a>`).join('');
        document.body.appendChild(mobileNav);
    }

    // Work environment banner and Dev Toolbar
    if (IS_WORK_ENV) {
        if (!document.getElementById('work-env-banner')) {
            const banner = document.createElement('div');
            banner.id = 'work-env-banner';
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10000;background:linear-gradient(90deg,#1a6b1a,#2d9b2d);color:#fff;text-align:center;padding:4px 12px;font-size:0.75rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;pointer-events:none;';
            banner.textContent = '[WORK ENVIRONMENT] \u2014 Not connected to live game';
            document.body.prepend(banner);
        }
        document.title = '[WORK] ' + document.title;
        import('./dev-toolbar.js').then(m => m.renderDevToolbar()).catch(() => {});
    }
}

export function renderNavTabs(activeTab) {
    const tabs = [
        { id: 'dashboard', label: 'Home', href: 'dashboard.html' },
        { id: 'politics', label: 'Actions', href: 'politics.html' },
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
        if (tab.id === 'politics') {
            badgeHtml = '<span class="nav-badge nav-badge--amber" id="politics-badge" style="display:none;min-width:8px;height:8px;line-height:8px;border-radius:50%;padding:0;top:4px;right:4px;animation:coalition-pulse 1.5s ease-in-out infinite;"></span>';
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
    if (!badge || !faction || !nation) return;
    try {
        // Count committee + floor bills the player hasn't voted on
        const { data: activeBills } = await _supabase
            .from('bills')
            .select('id, status, bill_support(faction_id)')
            .eq('nation_id', nation.id)
            .in('status', ['committee', 'floor']);

        const seenBills = getSeenBills();
        let count = 0;
        for (const bill of (activeBills || [])) {
            const hasVoted = (bill.bill_support || []).some(s => s.faction_id === faction.id);
            const hasSeen = seenBills.includes(bill.id);
            if (!hasVoted && !hasSeen) count++;
        }

        if (count > 0) {
            badge.textContent = count;
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
    } catch (e) {
        console.error('Error updating bills badge:', e);
    }
}


// ===== DIPLOMACY ROLE DETECTION (for badge gating) =====


// ===== COALITION FORMATION BADGE (no government formed after election) =====

async function checkCoalitionFormationBadge(nation) {
    const badge = document.getElementById('politics-badge');
    if (!badge || !nation) return;
    try {
        // Show the badge when a completed election exists but no government is
        // sitting. hasActiveGovernment is the canonical gate — it routes to the
        // right source per system type (presidents for presidential, formations
        // for parliamentary, ministries for monarchy).
        const [electionResult, activeGov] = await Promise.all([
            _supabase.from('elections')
                .select('id', { count: 'exact', head: true })
                .eq('nation_id', nation.id)
                .eq('status', 'completed'),
            hasActiveGovernment(_supabase, nation),
        ]);

        const hasElection = (electionResult.count || 0) > 0;
        badge.style.display = (hasElection && !activeGov) ? '' : 'none';
    } catch (e) {
        // Non-critical — don't break the page
    }
}

// ===== TICK COUNTDOWN =====

let tickInterval = null;
let nextTickAt = null;
let tickPoller = null;

export function updateTopBarInfo(faction, shard, nation) {
    // Store faction type for poller access
    window._currentFactionType = faction?.faction_type || 'party';
    const badge = document.getElementById('party-badge');
    if (badge) {
        if (faction && faction.nation_id) {
            const abbr = faction.abbreviation || faction.faction_name || '--';
            badge.textContent = '[' + abbr + '] ▾';
        } else {
            badge.textContent = '[No Faction] ▾';
        }
    }

    // Populate faction switcher dropdown
    const dropdown = document.getElementById('faction-dropdown');
    if (dropdown && _userFactions.length > 0) {
        let html = '';
        for (const f of _userFactions) {
            if (isHiddenFromSwitcher(f)) continue;   // legacy corps + parties hidden from switcher
            const isActive = faction && f.id === faction.id;
            // Nation flag replaces the legacy POL/ENTR/CORP text badge.
            const flag = flagUrlFor(f.nation);
            const badge = flag
                ? `<img class="faction-dropdown__type faction-dropdown__flag" src="${escapeHtml(flag)}" alt="" onerror="this.style.display='none'">`
                : `<span class="faction-dropdown__type"></span>`;
            html += `<div class="faction-dropdown__item${isActive ? ' active' : ''}" onclick="handleFactionSwitch('${f.id}')">
                ${badge}
                <span class="faction-dropdown__name">${escapeHtml(f.faction_name || 'Unnamed')}</span>
                <span class="faction-dropdown__abbr">[${escapeHtml(f.abbreviation || '—')}]</span>
            </div>`;
        }
        // Political Party founding option: REMOVED in Sunset Phase 1
        // (migration 20270612). Players now only create Entrepreneurs
        // and Politicians; existing parties keep operating but no new
        // ones are accepted from this dropdown.
        // (Military faction UI retired — the "Join a Military Faction"
        // entry was removed with the army pages.)
        // "Become an Entrepreneur" REMOVED with the entrepreneur
        // sunset — [Add Character] below covers every creatable path.
        // [Add Character] — the 5-character / 3-per-type rules live
        // in js/game/factions.js; faction-select greys capped types.
        const addSlot = addCharacterSlot(_userFactions);
        if (addSlot) {
            html += `<div class="faction-dropdown__item faction-dropdown__item--create" data-join-politician>
                <span class="faction-dropdown__type" style="color:var(--teal,#5aafa5)">+</span>
                <span class="faction-dropdown__name">${addSlot.label}</span>
            </div>`;
        }
        dropdown.innerHTML = html;
        dropdown.querySelectorAll('[data-join-politician]').forEach(el => {
            el.addEventListener('click', () => activateAddCharacter());
        });
    }

    const apEl = document.getElementById('topbar-ap');
    if (apEl && faction) {
        // Unified cash display for both parties and corporations
        const isCorp = faction.faction_type === 'corporation';
        const funds = isCorp ? (faction.corp_cash_reserves ?? 0) : (faction.party_funds ?? 0);
        const fundsStr = funds >= 1000000 ? '$' + (funds / 1000000).toFixed(1) + 'M'
            : funds >= 1000 ? '$' + Math.round(funds / 1000) + 'k'
            : '$' + funds;
        apEl.innerHTML = '<span class="topbar-ap__label">CASH:</span><span class="topbar-ap__count" style="font-size:13px;color:var(--accent);margin-left:4px;">' + fundsStr + '</span>';
    }
    
    const nationFlag = document.getElementById('nation-flag');
    const nationName = document.getElementById('nation-name');
    
    if (nation) {
        if (nationName) nationName.textContent = nation.name || 'Unknown Nation';
        if (nationFlag) {
            const flagSrc = nation.flag_url || `assets/flags/${nation.name}.png`;
            nationFlag.src = flagSrc;
            nationFlag.alt = nation.name + ' flag';
            nationFlag.style.display = 'block';
            nationFlag.onerror = () => { nationFlag.style.display = 'none'; };
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
            const tickLabel = document.querySelector('#tick-countdown')?.closest('.tick-item')?.querySelector('.tick-label');
            if (tickLabel) tickLabel.textContent = 'Next Tick';
            startTickCountdown();
        }
    }
}

/**
 * Fetch fresh AP from the database, update the topbar display, and sync the session cache.
 * Call this after any AP-spending action to ensure the UI is always accurate.
 */
export async function refreshAP(factionId) {
    if (!factionId) return;
    try {
        const { data, error } = await _supabase
            .from('factions')
            .select('action_points, party_funds, corp_cash_reserves, faction_type')
            .eq('id', factionId)
            .single();
        if (error || !data) return;

        // Update topbar with cash (party_funds or corp_cash_reserves)
        const apEl = document.getElementById('topbar-ap');
        if (apEl) {
            const isCorp = data.faction_type === 'corporation';
            const funds = isCorp ? (data.corp_cash_reserves ?? 0) : (data.party_funds ?? 0);
            const fundsStr = funds >= 1000000 ? '$' + (funds / 1000000).toFixed(1) + 'M'
                : funds >= 1000 ? '$' + Math.round(funds / 1000) + 'k'
                : '$' + funds;
            apEl.innerHTML = '<span class="topbar-ap__label">CASH:</span><span class="topbar-ap__count" style="font-size:13px;color:var(--accent);margin-left:4px;">' + fundsStr + '</span>';
        }

        // Sync session cache
        try {
            const cached = sessionStorage.getItem(STATE_KEY);
            if (cached) {
                const state = JSON.parse(cached);
                if (state.faction) {
                    state.faction.action_points = data.action_points ?? 0;
                    state.faction.party_funds = data.party_funds ?? 0;
                    if (data.corp_cash_reserves != null) state.faction.corp_cash_reserves = data.corp_cash_reserves;
                    state.timestamp = Date.now();
                    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
                }
            }
        } catch (e) { /* non-blocking */ }

        return data.action_points ?? 0;
    } catch (e) { console.warn('[refreshAP] Failed:', e); }
}

function renderApDisplay(el, ap) {
    el.innerHTML = '<span class="topbar-ap__count" onclick="toggleApLedger(event)" style="cursor:pointer;">' + ap + ' AP</span>'
        + '<div class="ap-ledger-dropdown" id="ap-ledger-dropdown"></div>';
}

// ===== AP LEDGER DROPDOWN =====

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function tickToShortDate(tick) {
    return MONTHS[tick % 12] + ' ' + (2000 + Math.floor(tick / 12));
}

async function toggleApLedger(e) {
    e?.stopPropagation();
    const dropdown = document.getElementById('ap-ledger-dropdown');
    if (!dropdown) return;
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        return;
    }

    dropdown.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:0.75rem;">Loading...</div>';
    dropdown.classList.add('active');

    // Close on outside click
    const close = (ev) => { if (!dropdown.contains(ev.target) && !ev.target.closest('.topbar-ap__count')) { dropdown.classList.remove('active'); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 0);

    try {
        const cached = sessionStorage.getItem('nationhood_state');
        const factionId = cached ? JSON.parse(cached)?.faction?.id : null;
        if (!factionId) { dropdown.innerHTML = '<div style="padding:12px;color:var(--text-muted);">No faction</div>'; return; }

        const { data: rows } = await _supabase
            .from('ap_ledger')
            .select('tick, delta, reason, detail')
            .eq('faction_id', factionId)
            .order('tick', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(50);

        if (!rows || rows.length === 0) {
            dropdown.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:0.75rem;">No AP history yet. History will appear after the next tick.</div>';
            return;
        }

        // Group by tick
        const byTick = {};
        for (const r of rows) {
            if (!byTick[r.tick]) byTick[r.tick] = [];
            byTick[r.tick].push(r);
        }

        let html = '<div class="ap-ledger-title">AP History</div>';
        for (const tick of Object.keys(byTick).sort((a, b) => b - a)) {
            const entries = byTick[tick];
            const net = entries.reduce((s, e) => s + e.delta, 0);
            const netCls = net > 0 ? 'ap-pos' : net < 0 ? 'ap-neg' : '';
            const netStr = (net > 0 ? '+' : '') + net;

            html += '<div class="ap-ledger-tick">';
            html += '<div class="ap-ledger-tick-header"><span>' + tickToShortDate(Number(tick)) + '</span><span class="' + netCls + '">' + netStr + ' AP</span></div>';
            for (const e of entries) {
                const sign = e.delta > 0 ? '+' : '';
                const cls = e.delta > 0 ? 'ap-pos' : 'ap-neg';
                html += '<div class="ap-ledger-row"><span class="ap-ledger-detail">' + (e.detail || e.reason) + '</span><span class="' + cls + '">' + sign + e.delta + '</span></div>';
            }
            html += '</div>';
        }
        dropdown.innerHTML = html;
    } catch (err) {
        dropdown.innerHTML = '<div style="padding:12px;color:var(--red);font-size:0.75rem;">Failed to load AP history</div>';
    }
}
window.toggleApLedger = toggleApLedger;

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
                .select('next_tick_at, current_tick, current_date, tick_interval_hours')
                .eq('name', 'Alpha Shard')
                .single();

            if (shard?.next_tick_at) {
                const newTime = new Date(shard.next_tick_at).getTime();

                if (newTime > oldNextTick) {
                    // Tick finished — update the UI
                    clearInterval(tickPoller);
                    tickPoller = null;

                    // Recalculate target based on faction type
                    const isCorp = window._currentFactionType === 'corporation';
                    if (isCorp) {
                        const intervalMs = (Number(shard.tick_interval_hours) || 8) * 3600000;
                        const politicalTickAt = new Date(shard.next_tick_at).getTime();
                        const lastAdvanceAt = politicalTickAt - intervalMs;
                        const corpDueAt = lastAdvanceAt + (intervalMs / 2);
                        nextTickAt = new Date(corpDueAt > Date.now() ? corpDueAt : politicalTickAt + (intervalMs / 2));
                    } else {
                        nextTickAt = new Date(shard.next_tick_at);
                    }

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

/**
 * Runtime guard for raw economic values (GDP, debt, population).
 * Logs an error if a value looks like a 0-100 stat score instead of a raw
 * monetary/count value. Call this before displaying GDP or debt.
 *
 * This catches data corruption at the display layer — if a tick processor
 * accidentally clamps GDP from $88B down to 100, this will fire immediately
 * on the next page load rather than silently displaying "$100".
 */
export function assertRawEconomicValue(value, fieldName) {
    if (value !== null && value !== undefined && Number(value) > 0 && Number(value) <= 100_000) {
        console.error(
            `[ECONOMIC DISPLAY BUG] ${fieldName} = ${value} — ` +
            `this looks like a 0-100 stat score instead of a raw monetary value. ` +
            `Check the data source. Run sql/reset_nation_gdp_debt.sql to fix.`
        );
    }
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
    btn.textContent = isLight ? 'Dark' : 'Light';
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
    window.__currentTab = activeTab;
    updateThemeButton();

    // Ban enforcement — check before loading any game state
    const ban = await checkBanStatus();
    if (ban) { enforceBan(ban); return; }

    const state = await loadGameState(requireFaction);
    if (!state) return;

    // Non-party faction on a party page — bounce to its own dashboard
    // (corp → corp-dashboard, army → army-dashboard, …) via the
    // single-source router. Party factions resolve to politics.html —
    // their home inside this very page suite — so they stay. Shared
    // pages (news, wiki) are usable by every type.
    // Preserve window.location.search so admin-inspector overrides
    // (?nation_id= and ?faction_id=) survive the redirect — otherwise
    // the target falls back to the admin's own faction instead of the
    // inspected one.
    const SHARED_TABS = ['news', 'wiki'];
    const factionHome = getFactionDashboardUrl(state.faction);
    if (factionHome && factionHome !== 'politics.html' && !SHARED_TABS.includes(activeTab)) {
        window.location.href = factionHome + window.location.search;
        return;
    }

    updateTopBarInfo(state.faction, state.shard, state.nation);

    // Always fetch fresh AP from DB — cached AP can be minutes stale
    if (state.faction?.id) {
        refreshAP(state.faction.id);
    }

    // Record fingerprint (fire-and-forget, non-blocking)
    recordFingerprint();

    // Update bills badge (non-blocking, skip on laws page since it marks seen)
    if (activeTab !== 'laws') {
        updateBillsBadge(state.faction, state.nation, state.shard);
    }

    // Check if coalition formation is needed (amber badge on Actions tab)
    checkCoalitionFormationBadge(state.nation);

    // Lazy-load messaging bubble (deferred — not needed for initial render)
    const _msgState = state;
    (typeof requestIdleCallback === 'function' ? requestIdleCallback : setTimeout)(() => {
        import('./messaging.js').then(m => m.initMessaging(_msgState.faction, _msgState.nation, _msgState.shard));
    });

    // Lazy-load the navbar notification dropdown.
    (typeof requestIdleCallback === 'function' ? requestIdleCallback : setTimeout)(() => {
        import('./notifications.js')
            .then(m => m.initNotifications({ faction: _msgState.faction, nation: _msgState.nation, shard: _msgState.shard }))
            .catch(err => console.warn('[notifications] init failed:', err?.message || err));
    });

    if (onReady) {
        await onReady(state);
    }
}

// Faction switcher dropdown toggle
function toggleFactionDropdown() {
    const dd = document.getElementById('faction-dropdown');
    if (dd) dd.classList.toggle('open');
}
function handleFactionSwitch(factionId) {
    const dd = document.getElementById('faction-dropdown');
    if (dd) dd.classList.remove('open');
    sessionStorage.setItem('active_faction_id', factionId);
    sessionStorage.removeItem(STATE_KEY);
    const target = _userFactions.find(f => f.id === factionId);
    window.location.href = getFactionDashboardUrl(target) || 'dashboard.html';
}
// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const switcher = document.getElementById('faction-switcher');
    const dd = document.getElementById('faction-dropdown');
    if (dd && switcher && !switcher.contains(e.target)) dd.classList.remove('open');
});

// Expose onclick handlers used by renderTopBar() HTML templates
window.handleLogout = handleLogout;
window.toggleTheme = toggleTheme;
window.toggleFactionDropdown = toggleFactionDropdown;
window.handleFactionSwitch = handleFactionSwitch;

// ===== BLOCS =====
// Shared helpers for the Form Bloc system. A bloc is a named alliance of
// parties within a nation; factions.bloc_id points at blocs.id while the
// bloc is live (dissolved_at_tick IS NULL). Every page that shows a party
// name should surface the bloc the same way — pull the map via
// loadBlocMap(nationId) and render chips with blocTagHtml().

export async function loadBlocMap(nationId) {
    const map = {};
    if (!nationId) return map;
    try {
        const { data, error } = await _supabase
            .from('blocs')
            .select('id, name')
            .eq('nation_id', nationId)
            .is('dissolved_at_tick', null);
        if (error) {
            console.warn('[Blocs] loadBlocMap failed:', error.message);
            return map;
        }
        for (const b of (data || [])) map[b.id] = b.name;
    } catch (err) {
        console.warn('[Blocs] loadBlocMap threw:', err?.message || err);
    }
    return map;
}

export function blocTagHtml(blocId, blocMap) {
    const name = blocId && blocMap ? blocMap[blocId] : null;
    if (!name) return '';
    return `<span style="display:inline-block;font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:var(--amber);background:rgba(176,154,91,0.08);border:1px solid rgba(176,154,91,0.3);white-space:nowrap;">BLOC · ${escapeHtml(name)}</span>`;
}
