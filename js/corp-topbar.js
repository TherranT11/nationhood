// js/corp-topbar.js — Shared top bar for all corporation pages
// Renders a unified top bar with logo, tick info, cash, faction switcher, nav tabs

const CORP_VERSION = 'Alpha 2.1.5.3';

const CORP_NAV_TABS = [
    { id: 'home', label: 'HOME', href: 'corp-dashboard.html' },
    { id: 'operations', label: 'OPERATIONS', href: 'corp-operations.html' },
    { id: 'expansion', label: 'EXPANSION', href: 'corp-operations.html#expansion' },
    { id: 'actions', label: 'ACTIONS', href: 'corp-operations.html#actions' },
    { id: 'innovation', label: 'INNOVATION', href: 'corp-operations.html#innovation' },
    { id: 'nations', label: 'NATIONS', href: 'corp-nations.html' },
    { id: 'news', label: 'NEWS', href: 'corp-dashboard.html#news' },
    { id: 'wiki', label: 'WIKI', href: 'corp-operations.html#wiki' },
];

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
    const { faction, shard, activeTab, allUserFactions } = opts;
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

    // Nav tabs
    const tabsHtml = CORP_NAV_TABS.map(t => {
        const isActive = t.id === activeTab;
        return `<a href="${t.href}" class="corp-nav-tab${isActive ? ' active' : ''}" style="text-decoration:none;">${t.label}</a>`;
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

    // Bind dropdown clicks
    const dropdown = container.querySelector('#corp-faction-dropdown');
    if (dropdown) {
        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.corp-dd-item');
            if (!item) return;
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

    // Corp tick fires at midpoint of political tick interval
    const nextPoliticalTick = new Date(shard.next_tick_at).getTime();
    const intervalMs = (shard.tick_interval_hours || 6) * 3600000;
    const corpTickAt = nextPoliticalTick - (intervalMs / 2);

    function update() {
        const now = Date.now();
        const target = corpTickAt > now ? corpTickAt : nextPoliticalTick;
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
