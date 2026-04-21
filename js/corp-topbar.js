// js/corp-topbar.js — Shared top bar for all corporation pages
// Renders a unified top bar with logo, tick info, cash, faction switcher, nav tabs

const CORP_VERSION = 'Alpha 2.2.1.1';
const THEME_STORAGE_KEY = 'corpThemePref';

// Stashed at render time so the CASH-pill dropdown can query cash history
// for the active corp without re-threading faction through window handlers.
let _topbarFaction = null;

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
    Shipping: 'corp-operations-shipping.html',
    Finance: 'corp-operations-finance.html',
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
        { id: 'expansion', label: 'EXPANSION', href: opsPage + '?tab=expansion', samePageAction: 'expansion' },
        { id: 'actions', label: 'ACTIONS', href: opsPage + '?tab=actions', samePageAction: 'actions' },
        { id: 'innovation', label: 'INNOVATION', disabled: true },
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
    _topbarFaction = faction;
    const tabBadges = badges || {}; // { tabId: { count, color } }
    const isLightMode = document.body.classList.contains('light-mode');
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

    const CORP_NAV_TABS = buildNavTabs(corpSector, faction?.id);
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
                <div class="corp-topbar__cash-wrap" id="corp-cash-wrap">
                    <span class="corp-topbar__cash" id="topbar-cash" onclick="window._corpTopbarToggleCashDropdown()">CASH: ${cashStr} ▾</span>
                    <div class="corp-topbar__dropdown corp-topbar__cash-dd" id="corp-cash-dropdown">
                        <div id="corp-cash-dd-list" style="padding:10px 14px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Loading recent movements…</div>
                    </div>
                </div>
                <div class="corp-topbar__switcher" id="faction-switcher">
                    <span class="corp-topbar__badge-btn" id="corp-name-badge" onclick="window._corpTopbarToggleDropdown()">[${escHtml(ticker.toUpperCase() || '--')}] ▾</span>
                    <div class="corp-topbar__dropdown" id="corp-faction-dropdown">${dropdownHtml}</div>
                </div>
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

// CASH-pill dropdown: last 5 cash movements for this corp. Derived —
// no new writes — from corp_cash_history (per-tick P&L) + finance_active_loans
// originations (equity sales, loan receipts) where this corp is the borrower.
window._corpTopbarToggleCashDropdown = async function() {
    const dd = document.getElementById('corp-cash-dropdown');
    if (!dd) return;
    const willOpen = !dd.classList.contains('open');
    dd.classList.toggle('open');
    if (willOpen) await _renderCashMovements();
};

async function _renderCashMovements() {
    const list = document.getElementById('corp-cash-dd-list');
    if (!list || !_topbarFaction?.id) return;
    try {
        const { _supabase } = await import('./supabase-client.js');
        const { tickToDate } = await import('./utils.js');
        const factionId = _topbarFaction.id;

        // Per-tick P&L component = cash_delta - non_pnl_cash_movements.
        // Written by advance-corp-tick at end of each nation's corp block.
        const histQ = _supabase.from('corp_cash_history')
            .select('tick, cash_delta, non_pnl_cash_movements')
            .eq('faction_id', factionId)
            .order('tick', { ascending: false })
            .limit(10);
        // BORROWER side — one-off cash INFLOWS (equity sales, loans received).
        const borrowerQ = _supabase.from('finance_active_loans')
            .select('started_tick, principal, equity_pct, finance_loan_requests(request_type)')
            .eq('borrower_faction_id', factionId)
            .order('started_tick', { ascending: false })
            .limit(10);
        // LENDER side — one-off cash OUTFLOWS (equity bought into another corp,
        // loan originated to another corp). Principal becomes a negative entry.
        const lenderQ = _supabase.from('finance_active_loans')
            .select('started_tick, principal, equity_pct, finance_loan_requests(request_type)')
            .eq('lender_faction_id', factionId)
            .order('started_tick', { ascending: false })
            .limit(10);
        const [histRes, borrowerRes, lenderRes] = await Promise.all([histQ, borrowerQ, lenderQ]);
        if (histRes.error)     console.warn('[CashDropdown] corp_cash_history query error:', histRes.error.message);
        if (borrowerRes.error) console.warn('[CashDropdown] finance_active_loans (borrower) query error:', borrowerRes.error.message);
        if (lenderRes.error)   console.warn('[CashDropdown] finance_active_loans (lender) query error:', lenderRes.error.message);
        const hist = histRes.data;
        const loans = borrowerRes.data;
        const lent  = lenderRes.data;

        const entries = [];
        for (const h of (hist || [])) {
            const pnl = Number(h.cash_delta || 0) - Number(h.non_pnl_cash_movements || 0);
            if (pnl === 0) continue;  // don't clutter with zero ticks
            entries.push({
                tick: h.tick,
                amount: pnl,
                label: pnl >= 0 ? 'Income' : 'Loss',
            });
        }
        for (const l of (loans || [])) {
            const type = l.finance_loan_requests?.request_type;
            if (type === 'equity') {
                const pct = Number(l.equity_pct || 0).toFixed(2).replace(/\.00$/, '');
                entries.push({
                    tick: l.started_tick,
                    amount: Number(l.principal || 0),
                    label: `Sold ${pct}% Equity`,
                });
            } else if (type === 'loan') {
                entries.push({
                    tick: l.started_tick,
                    amount: Number(l.principal || 0),
                    label: 'Received Loan',
                });
            }
        }
        // LENDER-side outflows: cash left this corp to buy equity in / loan to another corp.
        for (const l of (lent || [])) {
            const type = l.finance_loan_requests?.request_type;
            if (type === 'equity') {
                const pct = Number(l.equity_pct || 0).toFixed(2).replace(/\.00$/, '');
                entries.push({
                    tick: l.started_tick,
                    amount: -Number(l.principal || 0),
                    label: `Bought ${pct}% Equity`,
                });
            } else if (type === 'loan') {
                entries.push({
                    tick: l.started_tick,
                    amount: -Number(l.principal || 0),
                    label: 'Issued Loan',
                });
            }
        }

        entries.sort((a, b) => b.tick - a.tick);
        const top5 = entries.slice(0, 5);

        if (top5.length === 0) {
            list.innerHTML = '<div style="padding:10px 14px;color:var(--text-dim);">No recent cash movements.</div>';
            return;
        }

        const fmtAmt = (n) => {
            const abs = Math.abs(n);
            const s = abs >= 1e9 ? (abs / 1e9).toFixed(2) + 'B'
                    : abs >= 1e6 ? (abs / 1e6).toFixed(2) + 'M'
                    : abs >= 1e3 ? (abs / 1e3).toFixed(1) + 'k'
                    : String(abs);
            return (n >= 0 ? '+$' : '-$') + s;
        };
        list.innerHTML = top5.map(e => {
            const color = e.amount >= 0 ? 'var(--green, #5c5)' : 'var(--red, #c55)';
            return `<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 14px;border-bottom:1px solid var(--border-0);font-family:var(--font-mono);font-size:10px;">
                <span style="color:${color};font-weight:700;min-width:70px;">${fmtAmt(e.amount)}</span>
                <span style="color:var(--text-primary);flex:1;">${e.label}</span>
                <span style="color:var(--text-dim);">${tickToDate(e.tick)}</span>
            </div>`;
        }).join('');
    } catch (err) {
        console.warn('[CashDropdown] Failed to render cash movements:', err?.message || err);
        list.innerHTML = '<div style="padding:10px 14px;color:var(--red);">Could not load recent movements.</div>';
    }
}

// Close both dropdowns on outside click so they don't stick open.
document.addEventListener('click', (e) => {
    if (!e.target.closest('#corp-cash-wrap')) {
        document.getElementById('corp-cash-dropdown')?.classList.remove('open');
    }
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
