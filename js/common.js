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
import { initMessaging } from './messaging.js';

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
// (e.g. Appoint Ambassador link) that may lose URL params.
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
                    _userFactions = (allFactions || []).filter(f => f.nation_id);
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

        const ownedFactions = (allFactions || []).filter(f => f.nation_id);
        // Store all factions for the dropdown switcher
        _userFactions = ownedFactions;

        if (ownedFactions.length === 0) {
            if (requireFaction) {
                sessionStorage.removeItem(STATE_KEY);
                window.location.href = 'select-nation.html';
                return null;
            }
        } else {
            // Pick the active faction from sessionStorage, or default to primary
            const activeFactionId = sessionStorage.getItem('active_faction_id');
            faction = ownedFactions.find(f => f.id === activeFactionId)
                || ownedFactions.find(f => f.id === user.id)
                || ownedFactions[0];
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

    // Update last_seen_tick for inactivity tracking (fire-and-forget)
    if (faction && faction.nation_id && shard && shard.current_tick > 0 && !overrideFactionId) {
        _supabase.from('factions')
            .update({ last_seen_tick: shard.current_tick })
            .eq('id', faction.id)
            .then(() => {})
            .catch(err => console.warn('Failed to update last_seen_tick:', err));
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
                <button class="guide-btn" id="guide-btn" title="Page Guide" style="display:none;"></button>
                ${activeTab === 'home' ? '<a href="how-to.html" class="guide-btn" style="text-decoration:none;">HOW TO</a>' : ''}
                <div class="faction-switcher" id="faction-switcher">
                    <span class="party-badge" id="party-badge" onclick="toggleFactionDropdown()" style="cursor:pointer;">--</span>
                    <div class="faction-dropdown" id="faction-dropdown"></div>
                </div>
                <span class="topbar-ap" id="topbar-ap"></span>
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
        { id: 'nation', label: 'Nation', href: 'nation.html' },
        { id: 'government', label: 'Government', href: 'government.html' },
        { id: 'politics', label: 'Politics', href: 'politics.html' },
        { id: 'laws', label: 'Bills', href: 'laws.html' },
        { id: 'diplomacy', label: 'Diplomacy', href: 'diplomacy.html' },
        { id: 'news', label: 'News', href: 'news.html' },
        { id: 'conflicts', label: 'Conflicts', href: 'conflicts.html' },
        { id: 'economy', label: 'Economy', href: 'economy.html' },
        { id: 'wiki', label: 'Wiki', href: 'wiki.html' }
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
            badgeHtml = '<span class="nav-badge" id="bills-badge" style="display:none;"></span>';
        }
        if (tab.id === 'diplomacy') {
            badgeHtml = '<span class="nav-badge" id="diplomacy-badge" style="display:none;"></span>';
        }
        if (tab.id === 'conflicts') {
            badgeHtml = '<span class="nav-badge nav-badge--crimson" id="conflicts-badge" style="display:none;"></span>';
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

/**
 * Lightweight role check: is this faction the FM, MoT, or ambassador to specific nations?
 * Used by the nav-bar badge functions so only relevant players see notifications.
 */
async function getDiploBadgeRoles(faction, nation) {
    const roles = { isFM: false, isMoT: false, ambassadorTargetIds: [] };
    if (!faction || !nation) return roles;

    try {
        const [minRes, ambRes] = await Promise.all([
            _supabase.from('ministries').select('ministry_key, party_id')
                .eq('nation_id', nation.id).in('ministry_key', ['foreign', 'trade']).eq('is_active', true),
            _supabase.from('ambassadors').select('target_nation_id')
                .eq('nation_id', nation.id).eq('faction_id', faction.id)
                .eq('is_active', true).eq('status', 'active')
        ]);

        (minRes.data || []).forEach(m => {
            if (m.party_id === faction.id) {
                if (m.ministry_key === 'foreign') roles.isFM = true;
                if (m.ministry_key === 'trade') roles.isMoT = true;
            }
        });

        roles.ambassadorTargetIds = (ambRes.data || []).map(a => a.target_nation_id);
    } catch (e) {
        console.warn('Error fetching diplo badge roles:', e);
    }

    return roles;
}

// ===== DIPLOMACY BADGE (unread messages + pending proposals, single red badge) =====

async function updateDiplomacyBadge(faction, nation, roles) {
    const badge = document.getElementById('diplomacy-badge');
    if (!badge || !faction || !nation) return;
    try {
        if (!roles) roles = await getDiploBadgeRoles(faction, nation);

        // No diplomatic role → no badge
        if (!roles.isFM && !roles.isMoT && roles.ambassadorTargetIds.length === 0) {
            badge.style.display = 'none';
            return;
        }

        let count = 0;

        // 1. Unread diplomatic messages
        const { data: msgs } = await _supabase
            .from('diplomatic_messages')
            .select('id, from_nation_id, read_by_factions')
            .eq('to_nation_id', nation.id)
            .neq('from_nation_id', nation.id);

        for (const msg of (msgs || [])) {
            const readBy = msg.read_by_factions || [];
            if (readBy.includes(faction.id)) continue;
            if (roles.isFM || roles.ambassadorTargetIds.includes(msg.from_nation_id)) {
                count++;
            }
        }

        // 2. Incoming diplomatic proposals needing attention
        const { data: proposals } = await _supabase
            .from('diplomatic_proposals')
            .select('status, proposing_nation_id, target_nation_id, proposal_data')
            .in('status', ['proposed', 'revised'])
            .eq('target_nation_id', nation.id);

        for (const p of (proposals || [])) {
            if (p.status === 'proposed') {
                if (roles.isFM || roles.ambassadorTargetIds.includes(p.proposing_nation_id)) {
                    count++;
                }
            } else if (p.status === 'revised') {
                const pd = p.proposal_data || {};
                const revisedByUs = pd.revised_by_nation_id === nation.id;
                if (!revisedByUs && (roles.isFM || roles.ambassadorTargetIds.includes(p.proposing_nation_id))) {
                    count++;
                }
            }
        }

        // 3. Open trade negotiations
        const { data: tradeNegs } = await _supabase
            .from('trade_negotiations')
            .select('initiated_by_nation, nation_a_id, nation_b_id, status')
            .eq('status', 'open')
            .or('nation_a_id.eq.' + nation.id + ',nation_b_id.eq.' + nation.id)
            .neq('initiated_by_nation', nation.id);

        for (const n of (tradeNegs || [])) {
            const otherNationId = n.initiated_by_nation;
            if (roles.isFM || roles.isMoT || roles.ambassadorTargetIds.includes(otherNationId)) {
                count++;
            }
        }

        if (count > 0) {
            badge.textContent = count;
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
    } catch (e) {
        console.error('Error updating diplomacy badge:', e);
    }
}


// ===== CONFLICTS BADGE (active incidents involving your nation) =====

async function updateConflictsBadge(faction, nation) {
    const badge = document.getElementById('conflicts-badge');
    if (!badge || !faction || !nation) return;
    try {
        const { count } = await _supabase
            .from('incidents')
            .select('id', { count: 'exact', head: true })
            .in('status', ['active', 'mediating'])
            .or(`nation_a_id.eq.${nation.id},nation_b_id.eq.${nation.id}`);

        if (count && count > 0) {
            badge.textContent = count;
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
    } catch (e) {
        console.error('Error updating conflicts badge:', e);
    }
}


// ===== IPO INVITE BADGE (pending org invitations) =====

async function updateIPOInviteBadge(faction, roles) {
    const dipBadge = document.getElementById('diplomacy-badge');
    if (!faction) return;
    try {
        // Count pending invites
        const { data: invites, error } = await _supabase
            .from('ipo_invitations')
            .select('id')
            .eq('target_faction_id', faction.id)
            .eq('status', 'pending');
        if (error) return;
        const inviteCount = (invites || []).length;
        window._ipoPendingInviteCount = inviteCount;

        // Count open IPO votes where player hasn't voted (shows for ALL members)
        let pendingVoteCount = 0;
        try {
            const { data: myOrgs } = await _supabase
                .from('ipo_members')
                .select('org_id')
                .eq('faction_id', faction.id)
                .eq('is_active', true)
                .eq('role', 'member');
            if (myOrgs && myOrgs.length > 0) {
                const orgIds = myOrgs.map(m => m.org_id);
                const { data: openVotes } = await _supabase
                    .from('ipo_votes')
                    .select('id')
                    .in('org_id', orgIds)
                    .eq('status', 'open');
                if (openVotes && openVotes.length > 0) {
                    const voteIds = openVotes.map(v => v.id);
                    const { data: myBallots } = await _supabase
                        .from('ipo_ballots')
                        .select('vote_id')
                        .in('vote_id', voteIds)
                        .eq('faction_id', faction.id);
                    const votedSet = new Set((myBallots || []).map(b => b.vote_id));
                    pendingVoteCount = openVotes.filter(v => !votedSet.has(v.id)).length;
                }
            }
        } catch (_) {}

        const totalIPO = inviteCount + pendingVoteCount;
        window._ipoPendingVoteCount = pendingVoteCount;

        // Show badge: IPO votes show for ALL players, invites only for diplomatic roles
        if (dipBadge) {
            const hasDiploRole = roles && (roles.isFM || roles.isMoT || roles.ambassadorTargetIds.length > 0);
            const badgeCount = pendingVoteCount + (hasDiploRole ? inviteCount : 0);
            if (badgeCount > 0) {
                const existing = parseInt(dipBadge.textContent) || 0;
                dipBadge.textContent = existing + badgeCount;
                dipBadge.style.display = '';
            }
        }
    } catch (e) {
        console.error('Error updating IPO invite badge:', e);
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
            badge.textContent = faction.faction_name + ' [' + (faction.abbreviation || '—') + '] ▾';
        } else {
            badge.textContent = '[No Faction] ▾';
        }
    }

    // Populate faction switcher dropdown
    const dropdown = document.getElementById('faction-dropdown');
    if (dropdown && _userFactions.length > 0) {
        let html = '';
        for (const f of _userFactions) {
            const isActive = faction && f.id === faction.id;
            const typeLabel = f.faction_type === 'corporation' ? 'CORP' : 'PARTY';
            const typeColor = f.faction_type === 'corporation' ? 'var(--teal)' : 'var(--amber)';
            html += `<div class="faction-dropdown__item${isActive ? ' active' : ''}" onclick="handleFactionSwitch('${f.id}', '${f.faction_type}')">
                <span class="faction-dropdown__type" style="color:${typeColor}">${typeLabel}</span>
                <span class="faction-dropdown__name">${f.faction_name || 'Unnamed'}</span>
                <span class="faction-dropdown__abbr">[${f.abbreviation || '—'}]</span>
            </div>`;
        }
        // "Found a Corporation" option if no corp exists
        const hasCorp = _userFactions.some(f => f.faction_type === 'corporation');
        if (!hasCorp) {
            html += `<div class="faction-dropdown__item faction-dropdown__item--create" onclick="window.location.href='corp-setup.html'">
                <span class="faction-dropdown__type" style="color:var(--teal)">+</span>
                <span class="faction-dropdown__name">Found a Corporation</span>
            </div>`;
        }
        // "Found a Party" option if no party exists
        const hasParty = _userFactions.some(f => f.faction_type === 'party');
        if (!hasParty) {
            html += `<div class="faction-dropdown__item faction-dropdown__item--create" onclick="window.location.href='select-nation.html'">
                <span class="faction-dropdown__type" style="color:var(--amber)">+</span>
                <span class="faction-dropdown__name">Found a Political Party</span>
            </div>`;
        }
        dropdown.innerHTML = html;
    }

    const apEl = document.getElementById('topbar-ap');
    if (apEl && faction) {
        const ap = faction.action_points ?? 0;
        renderApDisplay(apEl, ap);
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

    // Corporation faction on shared pages — show full corp nav
    if (faction?.faction_type === 'corporation') {
        const navEl = document.querySelector('.nav-tabs');
        if (navEl) {
            const currentTab = window.__currentTab || '';
            const corpTabs = [
                { id: 'home', label: 'Home', href: 'corp-dashboard.html' },
                { id: 'operations', label: 'Operations' },
                { id: 'workforce', label: 'Workforce' },
                { id: 'expansion', label: 'Expansion' },
                { id: 'industries', label: 'Industries' },
                { id: 'innovation', label: 'Innovation' },
                { id: 'lobbying', label: 'Lobbying' },
                { id: 'news', label: 'News', href: 'news.html' },
                { id: 'wiki', label: 'Wiki', href: 'wiki.html' },
            ];
            navEl.innerHTML = corpTabs.map(t => {
                const isActive = t.id === currentTab;
                if (t.href) {
                    return `<a href="${t.href}" class="nav-tab ${isActive ? 'active' : ''}" data-tab="${t.id}">${t.label}</a>`;
                }
                return `<a href="#" class="nav-tab" data-tab="${t.id}" onclick="return false;" style="opacity:0.4;cursor:not-allowed;">${t.label}</a>`;
            }).join('');
        }
        // Update nation badge to show corp name instead
        if (nationName) nationName.textContent = faction.faction_name || 'Corporation';
        if (nationFlag) nationFlag.style.display = 'none';
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

/**
 * Fetch fresh AP from the database, update the topbar display, and sync the session cache.
 * Call this after any AP-spending action to ensure the UI is always accurate.
 */
export async function refreshAP(factionId) {
    if (!factionId) return;
    try {
        const { data, error } = await _supabase
            .from('factions')
            .select('action_points')
            .eq('id', factionId)
            .single();
        if (error || !data) return;
        const ap = data.action_points ?? 0;

        // Update topbar — preserve the AP ledger dropdown
        const apEl = document.getElementById('topbar-ap');
        if (apEl) renderApDisplay(apEl, ap);

        // Sync session cache so page navigations show correct AP
        try {
            const cached = sessionStorage.getItem(STATE_KEY);
            if (cached) {
                const state = JSON.parse(cached);
                if (state.faction) {
                    state.faction.action_points = ap;
                    state.timestamp = Date.now();
                    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
                }
            }
        } catch (e) { /* non-blocking */ }

        return ap;
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


// ===== POPULATION GROWTH CALCULATION =====
//
// population_growth is a standalone 0-100 stat where:
//   0   = max population decline (-1% per tick)
//   50  = equilibrium (no change)
//   100 = max population growth  (+1% per tick)
//
// Driven by policy effects and stat decay directly.
// No longer derived from birth_rate / death_rate.

export function calculatePopulationGrowth(nation) {
    return Math.round(Math.max(0, Math.min(100, Number(nation.population_growth ?? 50))) * 10) / 10;
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

    // Corporation faction on a party page — redirect to corp dashboard
    // (except shared pages like news and wiki which both factions can use)
    const SHARED_TABS = ['news', 'wiki'];
    if (state.faction?.faction_type === 'corporation' && !SHARED_TABS.includes(activeTab)) {
        window.location.href = 'corp-dashboard.html';
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
    // Update diplomacy badge (role-gated: only FM, MoT, or ambassadors see it)
    const diploRoles = await getDiploBadgeRoles(state.faction, state.nation);
    if (activeTab !== 'diplomacy') {
        updateDiplomacyBadge(state.faction, state.nation, diploRoles);
    }
    updateIPOInviteBadge(state.faction, diploRoles);
    // Update conflicts badge (active incidents involving your nation)
    if (activeTab !== 'conflicts') {
        updateConflictsBadge(state.faction, state.nation);
    }

    // Inject messaging bubble on all pages
    initMessaging(state.faction, state.nation, state.shard);

    if (onReady) {
        await onReady(state);
    }
}

// Faction switcher dropdown toggle
function toggleFactionDropdown() {
    const dd = document.getElementById('faction-dropdown');
    if (dd) dd.classList.toggle('open');
}
function handleFactionSwitch(factionId, factionType) {
    const dd = document.getElementById('faction-dropdown');
    if (dd) dd.classList.remove('open');
    sessionStorage.setItem('active_faction_id', factionId);
    sessionStorage.removeItem(STATE_KEY);
    // Route to the right dashboard
    if (factionType === 'corporation') {
        window.location.href = 'corp-dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
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
