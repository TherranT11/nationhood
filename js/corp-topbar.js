// js/corp-topbar.js — Shared top bar for all corporation pages
// Renders a unified top bar with logo, tick info, faction switcher, nav tabs.

const CORP_VERSION = 'Alpha 2.4.5.0';
const THEME_STORAGE_KEY = 'corpThemePref';

// One-shot flag: messaging.js initMessaging is called at most once per
// page load. Idempotent on the messaging side too (injectHTML guards on
// existing #msg-bubble), but skipping re-imports keeps the network tab
// quiet on tab/topbar re-renders.
let _msgInjected = false;

// Sync body.light-mode from localStorage. Called at render (and by a tiny inline
// script at the top of each corp body) so saved preference survives page loads
// and the first paint matches the final theme.
function applyStoredCorpTheme() {
    try {
        const pref = localStorage.getItem(THEME_STORAGE_KEY);
        document.body.classList.toggle('light-mode', pref === 'light');
    } catch (e) { /* localStorage unavailable (private mode, etc.) — default dark */ }
}

// Single source of truth for the corp sector → Operations page mapping.
// Imported by the three Ops HTMLs + common.js so faction-switcher, topbar
// nav, and shared-page nav all route a Finance/Shipping corp to the right
// page instead of the Construction default.
export const SECTOR_OPS_PAGE = {
    Construction: 'corp-operations.html',
    Shipping:     'corp-operations-shipping.html',
    Finance:      'corp-operations-finance.html',
    Airline:      'airline-operations.html',
};

// Corps with access to the Home2 test dashboard (Chairman's Desk redesign).
// Temporary allowlist — swap for a feature-flag column before broader rollout.
const HOME2_TEST_CORP_IDS = new Set([
    'a0f36506-f14e-4304-946c-ecb802e61adf', // Compañía Transoceánica de San Estrella
]);

function buildNavTabs(corpSector, factionId) {
    const opsPage = SECTOR_OPS_PAGE[corpSector] || 'corp-operations.html';
    const tabs = [
        { id: 'home', label: 'HOME', href: 'corp-dashboard.html' },
    ];
    if (factionId && HOME2_TEST_CORP_IDS.has(factionId)) {
        tabs.push({ id: 'home2', label: 'HOME2', href: 'corp-dashboard-home2.html' });
    }
    tabs.push(
        { id: 'operations', label: 'OPERATIONS', href: opsPage },
        // Expansion + Actions are standalone cross-sector pages. No more
        // in-page tab switching, no ?tab= URL params, no redirect-through-
        // Construction for Finance corps. One URL per tab, one file per
        // URL, works for every sector.
        { id: 'expansion', label: 'EXPANSION', href: 'expansion.html' },
        { id: 'actions', label: 'ACTIONS', href: 'actions.html' },
        { id: 'alliances', label: 'STRATEGIC ALLIANCES', href: 'alliances.html' },
        { id: 'nations', label: 'NATIONS', href: 'corp-nations.html' },
        { id: 'news', label: 'NEWS', href: 'news.html' },
        { id: 'wiki', label: 'WIKI', href: 'wiki.html' },
    );
    return tabs;
}

function escHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

/**
 * Render the shared corp top bar into the given container element.
 * @param {HTMLElement} container - Element to render into (e.g. #corp-topbar)
 * @param {Object} opts
 * @param {string} opts.activeTab - Current tab id (e.g. 'home', 'operations', 'nations')
 * @param {Object} opts.faction - Faction data object
 * @param {Object} opts.shard - Shard data (current_tick, current_date, next_tick_at, tick_interval_hours)
 * @param {Array} opts.allUserFactions - All factions owned by this user
 * @param {Function} opts.onFactionSwitch - Callback when faction is switched
 * @param {Object} opts.supabase - Supabase client
 */
export function renderCorpTopBar(container, opts = {}) {
    applyStoredCorpTheme();
    const { faction, shard, activeTab, allUserFactions, badges } = opts;
    const tabBadges = badges || {}; // { tabId: { count, color } }
    const isLightMode = document.body.classList.contains('light-mode');
    const ticker = faction?.corp_ticker || faction?.abbreviation || '';

    const logoHtml = faction?.custom_logo_url
        ? `<img src="${escHtml(faction.custom_logo_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`
        : escHtml(ticker.slice(0, 2) || '—');

    const gameDate = shard?.current_date || '--';
    const tickNum = shard?.current_tick ?? '--';

    // Static cash label (corp_cash_reserves). Same compact $/$k/$M
    // formatting as the party-side topbar — no dropdown, just a read-out.
    const cashRaw = Number(faction?.corp_cash_reserves ?? 0);
    const cashStr = !Number.isFinite(cashRaw) ? '$0'
        : cashRaw >= 1_000_000 ? '$' + (cashRaw / 1_000_000).toFixed(1) + 'M'
        : cashRaw >= 1_000     ? '$' + Math.round(cashRaw / 1_000) + 'k'
        : '$' + cashRaw;

    // Nav tabs — same-page tabs use onclick, cross-page tabs use href
    const corpSector = faction?.corp_sector || 'Construction';

    const CORP_NAV_TABS = buildNavTabs(corpSector, faction?.id);
    const tabsHtml = CORP_NAV_TABS.map(t => {
        const isActive = t.id === activeTab;
        if (t.disabled) {
            return `<span class="corp-nav-tab disabled">${t.label}</span>`;
        }
        const badge = tabBadges[t.id];
        const badgeHtml = badge ? `<span style="position:relative;top:-4px;margin-left:2px;display:inline-block;min-width:8px;height:8px;line-height:8px;border-radius:50%;font-size:0;background:${badge.color || '#c8a832'};" title="${badge.title || ''}"></span>` : '';
        return `<a href="${t.href}" class="corp-nav-tab${isActive ? ' active' : ''}" style="text-decoration:none;">${t.label}${badgeHtml}</a>`;
    }).join('');

    // Faction dropdown items
    let dropdownHtml = '';
    if (allUserFactions && allUserFactions.length > 0) {
        dropdownHtml = allUserFactions.map(f => {
            const isActive = faction && f.id === faction.id;
            const typeLabel = f.faction_type === 'corporation' ? 'CORP' : 'PARTY';
            const typeColor = f.faction_type === 'corporation' ? 'var(--teal)' : 'var(--amber)';
            return `<div class="corp-dd-item${isActive ? ' active' : ''}" data-faction-id="${f.id}" data-faction-type="${f.faction_type}">
                <span class="corp-dd-type" style="color:${typeColor}">${typeLabel}</span>
                <span class="corp-dd-name">${escHtml(f.faction_name || 'Unnamed')}</span>
                <span class="corp-dd-abbr">[${escHtml(f.abbreviation || '—')}]</span>
            </div>`;
        }).join('');
    }
    const hasParty = (allUserFactions || []).some(f => f.faction_type === 'party');
    if (!hasParty) {
        dropdownHtml += `<div class="corp-dd-item" data-action="found-party" style="border-top:1px solid var(--border-0, rgba(255,255,255,0.06));cursor:pointer;">
            <span class="corp-dd-type" style="color:var(--amber)">+</span>
            <span class="corp-dd-name">Found a Political Party</span>
        </div>`;
    }

    container.innerHTML = `
        <div class="corp-topbar">
            <div class="corp-topbar__left">
                <div class="corp-topbar__badge">
                    <div class="corp-topbar__logo" id="corp-logo">${logoHtml}</div>
                    <span class="corp-topbar__name" id="corp-name-bar">${escHtml(faction?.faction_name || 'Loading...')}</span>
                </div>
                <div class="corp-topbar__sep"></div>
                <div class="corp-topbar__ticks">
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">GAME DATE</div>
                        <div class="corp-topbar__tick-value" id="game-date">${escHtml(String(gameDate))}</div>
                    </div>
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">TICK</div>
                        <div class="corp-topbar__tick-value" id="tick-number">${tickNum}</div>
                    </div>
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">NEXT CORP TICK</div>
                        <div class="corp-topbar__tick-value" id="tick-countdown">--</div>
                    </div>
                </div>
            </div>
            <div class="corp-topbar__version">${CORP_VERSION}</div>
            <div class="corp-topbar__right">
                <span class="corp-topbar__cash" id="corp-topbar-cash">
                    <span class="corp-topbar__cash-label">CASH:</span>
                    <span class="corp-topbar__cash-value" id="corp-topbar-cash-value">${escHtml(cashStr)}</span>
                </span>
                <div class="corp-topbar__switcher" id="faction-switcher">
                    <span class="corp-topbar__badge-btn" id="corp-name-badge" onclick="window._corpTopbarToggleDropdown()">[${escHtml(ticker.toUpperCase() || '--')}] ▾</span>
                    <div class="corp-topbar__dropdown" id="corp-faction-dropdown">${dropdownHtml}</div>
                </div>
                <span class="notif-wrap" style="display:inline-flex;">
                    <button id="notif-bell" class="notif-bell" type="button" aria-label="Notifications" aria-haspopup="true" aria-expanded="false">
                        <span class="notif-bell__icon">&#9788;</span>
                        <span id="notif-dot" class="notif-bell__dot" hidden></span>
                    </button>
                    <div id="notif-dropdown" class="notif-dropdown" hidden role="dialog" aria-label="Notifications">
                        <div class="notif-dropdown__header">
                            <span class="notif-dropdown__title">Notifications</span>
                            <span class="notif-dropdown__count" id="notif-count">0</span>
                        </div>
                        <div class="notif-dropdown__list" id="notif-list"></div>
                    </div>
                </span>
                <button class="corp-topbar__btn" onclick="window._corpTopbarToggleTheme()" id="theme-toggle">${isLightMode ? 'Dark' : 'Light'}</button>
                ${activeTab === 'home2' ? `<button class="corp-topbar__btn" onclick="window._corpHome2ToggleMode()" id="home2-mode-toggle" title="Home2 paper/dark mode">${(document.documentElement.getAttribute('data-mode') === 'paper') ? 'Dark' : 'Paper'}</button>` : ''}
                <button class="corp-topbar__btn corp-topbar__btn--logout" onclick="window._corpTopbarLogout()">Logout</button>
            </div>
        </div>
        <div class="corp-topbar__nav">${tabsHtml}</div>
    `;

    // Bind same-page tab actions (expansion/actions within operations page)
    container.querySelectorAll('[data-tab-action]').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const action = tab.dataset.tabAction;
            // Update active state visually
            container.querySelectorAll('.corp-nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Call the page's tab switcher if it exists
            if (action === 'expansion' && typeof window.switchToExpansion === 'function') {
                window.switchToExpansion(e);
            } else if (action === 'actions' && typeof window.switchToActions === 'function') {
                window.switchToActions(e);
            }
        });
    });

    // Bind dropdown clicks
    const dropdown = container.querySelector('#corp-faction-dropdown');
    if (dropdown) {
        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.corp-dd-item');
            if (!item) return;
            if (item.dataset.action === 'found-party') {
                sessionStorage.setItem('pending_faction_type', 'party');
                window.location.href = 'select-nation.html';
                return;
            }
            const fid = item.dataset.factionId;
            const ftype = item.dataset.factionType;
            sessionStorage.setItem('active_faction_id', fid);
            if (ftype === 'party') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'corp-dashboard.html';
            }
        });
    }

    // Start countdown timer
    startCorpCountdown(shard);

    // Lazy-load the messaging bubble + notification dropdown. Mirrors
    // the party-side init in common.js so corp pages get the same
    // floating chat affordance and bell via the one shared topbar
    // call. Module-level _msgInjected flag keeps both one-shot per
    // page load even if renderCorpTopBar re-renders.
    if (faction?.id && !_msgInjected) {
        _msgInjected = true;
        const schedule = typeof requestIdleCallback === 'function' ? requestIdleCallback : setTimeout;
        schedule(() => {
            import('./messaging.js')
                .then(m => m.initMessaging(faction, opts.nation || null, shard))
                .catch(err => console.warn('[corp-topbar] messaging init failed:', err));
            import('./notifications.js')
                .then(m => m.initNotifications({ faction, nation: opts.nation || null, shard }))
                .catch(err => console.warn('[corp-topbar] notifications init failed:', err));
        });
    }
}

// Countdown timer for next corp tick
function startCorpCountdown(shard) {
    const el = document.getElementById('tick-countdown');
    if (!el || !shard?.next_tick_at) return;

    // Corp tick fires at midpoint of political tick interval (4h offset on 8h ticks)
    const nextPoliticalTick = new Date(shard.next_tick_at).getTime();
    const intervalMs = (Number(shard.tick_interval_hours) || 8) * 3600000;
    const lastAdvanceAt = nextPoliticalTick - intervalMs;
    const corpDueAt = lastAdvanceAt + (intervalMs / 2);

    function update() {
        const now = Date.now();
        // If this cycle's corp tick has passed, count down to the next cycle midpoint
        const target = corpDueAt > now ? corpDueAt : nextPoliticalTick + (intervalMs / 2);
        const diff = Math.max(0, target - now);
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        el.textContent = `${h}h ${m}m ${s}s`;
    }
    update();
    setInterval(update, 1000);
}

// Global helpers (attached to window for onclick handlers)
window._corpTopbarToggleDropdown = function() {
    const dd = document.getElementById('corp-faction-dropdown');
    if (dd) dd.classList.toggle('open');
};

// Cash-pill dropdown + per-tick movement helpers were removed. Per-tick
// cash detail is now surfaced via the expandable Revenue / Costs & Wages /
// Outstanding Debt cards on the dashboard (corp-dashboard.html
// #renderFinCard).

// Close the faction-switcher dropdown on outside click.
document.addEventListener('click', (e) => {
    if (!e.target.closest('#faction-switcher')) {
        document.getElementById('corp-faction-dropdown')?.classList.remove('open');
    }
});

window._corpTopbarToggleTheme = function() {
    const nowLight = document.body.classList.toggle('light-mode');
    try { localStorage.setItem(THEME_STORAGE_KEY, nowLight ? 'light' : 'dark'); } catch (e) {}
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = nowLight ? 'Dark' : 'Light';
};

// Home2-only paper/dark mode (independent of the global light/dark theme).
// Sets data-mode on <html>; Phase 2+ CSS reads --h2-* vars scoped to that attribute.
window._corpHome2ToggleMode = function() {
    const current = document.documentElement.getAttribute('data-mode') === 'paper' ? 'paper' : 'dark';
    const next = current === 'paper' ? 'dark' : 'paper';
    document.documentElement.setAttribute('data-mode', next);
    try { localStorage.setItem('corp_home2_mode', next); } catch (e) {}
    const btn = document.getElementById('home2-mode-toggle');
    if (btn) btn.textContent = next === 'paper' ? 'Dark' : 'Paper';
};

window._corpTopbarLogout = async function() {
    const { _supabase } = await import('./supabase-client.js');
    sessionStorage.clear();
    await _supabase.auth.signOut();
    window.location.href = 'login.html';
};

