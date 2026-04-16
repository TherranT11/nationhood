// js/corp-topbar.js — Shared top bar for all corporation pages
// Renders a unified top bar with logo, tick info, cash, faction switcher, nav tabs

const CORP_VERSION = 'Alpha 2.1.5.3';

const SECTOR_OPS_PAGE = {
    Construction: 'corp-operations.html',
    Shipping: 'corp-operations-shipping.html',
    Finance: 'corp-operations-finance.html',
};

function buildNavTabs(corpSector) {
    const opsPage = SECTOR_OPS_PAGE[corpSector] || 'corp-operations.html';
    return [
        { id: 'home', label: 'HOME', href: 'corp-dashboard.html' },
        { id: 'operations', label: 'OPERATIONS', href: opsPage },
        { id: 'expansion', label: 'EXPANSION', href: opsPage + '?tab=expansion', samePageAction: 'expansion' },
        { id: 'actions', label: 'ACTIONS', href: opsPage + '?tab=actions', samePageAction: 'actions' },
        { id: 'innovation', label: 'INNOVATION', disabled: true },
        { id: 'nations', label: 'NATIONS', href: 'corp-nations.html' },
        { id: 'news', label: 'NEWS', href: 'news.html' },
        { id: 'wiki', label: 'WIKI', href: 'wiki.html' },
    ];
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
    const { faction, shard, activeTab, allUserFactions, badges } = opts;
    const tabBadges = badges || {}; // { tabId: { count, color } }
    const ticker = faction?.corp_ticker || faction?.abbreviation || '';
    const cash = Number(faction?.corp_cash_reserves ?? 0);
    const cashStr = cash >= 1e9 ? '$' + (cash / 1e9).toFixed(2) + 'B'
        : cash >= 1e6 ? '$' + (cash / 1e6).toFixed(2) + 'M'
        : cash >= 1e3 ? '$' + (cash / 1e3).toFixed(1) + 'k'
        : '$' + cash;

    const logoHtml = faction?.custom_logo_url
        ? `<img src="${escHtml(faction.custom_logo_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`
        : escHtml(ticker.slice(0, 2) || '—');

    const gameDate = shard?.current_date || '--';
    const tickNum = shard?.current_tick ?? '--';

    // Nav tabs — same-page tabs use onclick, cross-page tabs use href
    const currentPage = window.location.pathname.split('/').pop().split('?')[0];
    const corpSector = faction?.corp_sector || 'Construction';
    const opsPage = SECTOR_OPS_PAGE[corpSector] || 'corp-operations.html';
    const isOnOperations = currentPage === opsPage || currentPage === 'corp-operations.html' || currentPage === 'corp-operations-shipping.html' || currentPage === 'corp-operations-finance.html';

    const CORP_NAV_TABS = buildNavTabs(corpSector);
    const tabsHtml = CORP_NAV_TABS.map(t => {
        const isActive = t.id === activeTab;
        if (t.disabled) {
            return `<span class="corp-nav-tab disabled">${t.label}</span>`;
        }
        // Same-page tab switching (expansion/actions on operations page)
        if (t.samePageAction && isOnOperations) {
            return `<a href="#" class="corp-nav-tab${isActive ? ' active' : ''}" data-tab-action="${t.samePageAction}" style="text-decoration:none;">${t.label}</a>`;
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
                <span class="corp-topbar__cash" id="topbar-cash">CASH: ${cashStr}</span>
                <div class="corp-topbar__switcher" id="faction-switcher">
                    <span class="corp-topbar__badge-btn" id="corp-name-badge" onclick="window._corpTopbarToggleDropdown()">[${escHtml(ticker.toUpperCase() || '--')}] ▾</span>
                    <div class="corp-topbar__dropdown" id="corp-faction-dropdown">${dropdownHtml}</div>
                </div>
                <button class="corp-topbar__btn" onclick="window._corpTopbarToggleTheme()" id="theme-toggle">Light</button>
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

window._corpTopbarToggleTheme = function() {
    document.body.classList.toggle('light-mode');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = document.body.classList.contains('light-mode') ? 'Dark' : 'Light';
};

window._corpTopbarLogout = async function() {
    const { _supabase } = await import('./supabase-client.js');
    sessionStorage.clear();
    await _supabase.auth.signOut();
    window.location.href = 'login.html';
};

/**
 * Update just the cash display without re-rendering the whole bar.
 */
export function updateCorpTopBarCash(cash) {
    const el = document.getElementById('topbar-cash');
    if (!el) return;
    const cashStr = cash >= 1e9 ? '$' + (cash / 1e9).toFixed(2) + 'B'
        : cash >= 1e6 ? '$' + (cash / 1e6).toFixed(2) + 'M'
        : cash >= 1e3 ? '$' + (cash / 1e3).toFixed(1) + 'k'
        : '$' + cash;
    el.textContent = 'CASH: ' + cashStr;
}
