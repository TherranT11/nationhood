// js/military-topbar.js — Shared top bar for military-branch dashboards.
// Currently used by army-dashboard.html; navy/air-force dashboards will
// reuse the same renderer when they land.
//
// Layout mirrors the party (common.js renderTopBar) and corp
// (corp-topbar.js) top bars in size and shape, but trimmed to what the
// branch dashboards need today: nation flag + faction name, game date,
// faction-switcher dropdown, logout, and a nav row with the active tab.
// No cash readout, tick counter, notification bell, or theme toggle —
// those land alongside the features that need them.

import { _supabase } from './supabase-client.js';
import {
    BRANCH_DASHBOARDS,
    getFactionDashboardUrl,
    getBranchDisplayLabel,
    getPoliticianRoleLabel,
    isHiddenFromSwitcher,
    nextPoliticianSlot,
    activatePoliticianSlot,
} from './game/factions.js';
import { escapeHtml as escHtml, flagUrlFor } from './utils.js';

// Per-area theme key, mirroring corp-topbar's THEME_STORAGE_KEY
// ('corpThemePref') and common.js's ('nationhood_theme') — each
// dashboard family persists its own; the shared visual mechanism is
// the body.light-mode class. Applied at render so first paint matches.
const _MIL_THEME_KEY = 'milThemePref';
function applyStoredMilTheme() {
    if (typeof document === 'undefined') return;
    try {
        document.body.classList.toggle('light-mode',
            localStorage.getItem(_MIL_THEME_KEY) === 'light');
    } catch (e) { /* localStorage unavailable — default dark */ }
}

// The military top bar carries its own styling so it renders identically
// on ANY page (army-dashboard, army-actions, future navy/air) with zero
// per-page CSS. Tokens are scoped to the top-bar containers — not :root —
// so they're self-contained on a page that doesn't define them and never
// leak into / clash with the host page's palette. Verbatim from the
// original army-dashboard.html inline block (single source now).
const _MIL_TOPBAR_CSS = `
.mil-topbar, .mil-topbar__nav {
  --bg-2: #1a1a17; --bg-3: #252525;
  --border-0: rgba(255,255,255,0.06); --border-1: rgba(255,255,255,0.08);
  --text-bright: #f0efe6; --text-dim: #4a4940;
  --red: #d9534f; --red-faint: rgba(217,83,79,0.08); --red-border: rgba(217,83,79,0.18);
  --font-mono: 'JetBrains Mono', monospace;
  --font-ui: 'IBM Plex Sans', -apple-system, sans-serif;
}
.mil-topbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 22px; height: 53px;
  background: var(--bg-2); border-bottom: 1px solid var(--border-0);
}
.mil-topbar__left { display: flex; align-items: center; gap: 0; }
.mil-topbar__sep {
  width: 1px; height: 31px; background: var(--border-1);
  margin: 0 16px; flex-shrink: 0;
}
.mil-topbar__badge { display: flex; align-items: center; gap: 10px; }
.mil-topbar__flag {
  width: 36px; height: 24px; object-fit: cover;
  border: 1px solid var(--border-1);
}
.mil-topbar__flag-fallback {
  width: 36px; height: 24px;
  background: var(--bg-3); border: 1px solid var(--border-1);
}
.mil-topbar__name {
  font-family: var(--font-ui); font-size: 14px; font-weight: 700;
  color: var(--text-bright);
}
.mil-topbar__ticks { display: flex; gap: 20px; }
.mil-topbar__tick { display: flex; flex-direction: column; gap: 1px; }
.mil-topbar__tick-label {
  font-family: var(--font-mono); font-size: 9.5px; font-weight: 600;
  letter-spacing: 0.8px; text-transform: uppercase; color: #7a7868;
}
.mil-topbar__tick-value {
  font-family: var(--font-mono); font-size: 13px; font-weight: 500;
  color: var(--text-bright);
}
.mil-topbar__right { display: flex; align-items: center; gap: 10px; }
.mil-topbar__budget {
  display: flex; align-items: baseline; gap: 6px;
  font-family: var(--font-mono); padding: 4px 10px;
  border: 1px solid var(--border-1); background: var(--bg-3);
}
.mil-topbar__budget-label {
  font-size: 9.5px; font-weight: 600; letter-spacing: 0.8px;
  text-transform: uppercase; color: #7a7868;
}
.mil-topbar__budget-value {
  font-size: 12px; font-weight: 700; color: var(--text-bright);
}
.mil-topbar__switcher { position: relative; }
.mil-topbar__badge-btn {
  font-family: var(--font-mono); font-size: 12px; font-weight: 700;
  color: var(--red); padding: 4px 10px; cursor: pointer;
  background: var(--red-faint);
  border: 1px solid var(--red-border);
}
.mil-topbar__dropdown {
  display: none; position: absolute; top: 100%; right: 0;
  min-width: 260px; max-height: 60vh; overflow-y: auto;
  background: var(--bg-2); border: 1px solid var(--border-0);
  box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 100; margin-top: 4px;
}
.mil-topbar__dropdown.open { display: block; }
.mil-dd-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 14px;
  cursor: pointer; border-bottom: 1px solid var(--border-0);
  font-family: var(--font-mono); font-size: 11px;
}
.mil-dd-item:hover { background: rgba(255,255,255,0.04); }
.mil-dd-item.active { background: rgba(217,83,79,0.06); }
.mil-dd-item--create { border-top: 1px solid var(--border-0); }
.mil-dd-type { font-size: 8px; font-weight: 700; letter-spacing: 0.5px; min-width: 32px; flex-shrink: 0; }
.mil-dd-flag { width: 24px; height: 16px; object-fit: cover; min-width: 24px;
    border-radius: 2px; border: 0.5px solid rgba(255,255,255,0.1); display: block; }
.mil-dd-name { color: var(--text-bright); flex: 1; }
.mil-dd-abbr { color: var(--text-dim); font-size: 9px; }
.mil-topbar__btn {
  font-family: var(--font-mono); font-size: 10px; font-weight: 600;
  letter-spacing: 0.5px; padding: 5px 14px; cursor: pointer;
  background: transparent; border: 1px solid var(--border-0);
  color: var(--text-dim); transition: all 0.15s;
}
.mil-topbar__btn:hover { color: var(--text-bright); border-color: var(--text-dim); }
.mil-topbar__btn--logout:hover { color: var(--red); border-color: var(--red); }

.mil-topbar__nav {
  display: flex; gap: 0; padding: 0 22px;
  background: var(--bg-2); border-bottom: 1px solid var(--border-0);
}
.mil-nav-tab {
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  letter-spacing: 1px; padding: 8px 16px; color: var(--text-dim);
  border-bottom: 2px solid transparent; transition: all 0.15s;
  text-transform: uppercase; text-decoration: none;
}
.mil-nav-tab:hover { color: var(--text-bright); }
.mil-nav-tab.active {
  color: var(--text-bright);
  border-bottom-color: var(--red);
}`;

function _ensureMilTopbarStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('mil-topbar-styles')) return;
    const s = document.createElement('style');
    s.id = 'mil-topbar-styles';
    s.textContent = _MIL_TOPBAR_CSS;
    document.head.appendChild(s);
}

export function renderMilitaryTopBar(container, opts = {}) {
    _ensureMilTopbarStyles();
    applyStoredMilTheme();
    const {
        faction,           // the user's military faction (must have .branch)
        nation,            // nation row (for name; not used for flag, see flagUrl)
        shard,             // shard row (for current_date)
        allUserFactions,   // every active faction the user owns
        activeTab,         // 'home' for now; expand as branch pages land
        flagUrl,           // pre-resolved flag URL (caller picks the right source)
    } = opts;

    const branchBadge = getBranchDisplayLabel(faction?.branch || 'army');
    const gameDate    = shard?.current_date || '--';
    const tickNum     = shard?.current_tick ?? '--';
    // Army treasury (party_funds) on the army /1e6 no-"M" convention —
    // byte-identical to the army-dashboard "Available Budget" card so
    // the two never disagree. '$0' when the column wasn't selected.
    const budgetStr = '$' + ((Number(faction?.party_funds) || 0) / 1e6)
        .toFixed(1).replace(/\.0$/, '');
    const isLight = typeof document !== 'undefined'
        && document.body.classList.contains('light-mode');

    // Dropdown: every active faction the user owns + "Found a …" entries
    // for missing party/corp types. We never offer "Join a Military
    // Branch" because the viewer is already on a military dashboard.
    let dropdownHtml = '';
    if (allUserFactions && allUserFactions.length > 0) {
        dropdownHtml = allUserFactions.filter(f => !isHiddenFromSwitcher(f)).map(f => {
            const isActive = faction && f.id === faction.id;
            // For military rows, prefer the branch label over the (often
            // null) abbreviation column so the row reads e.g. "[ARMY]".
            const abbr = f.faction_type === 'military'
                ? getBranchDisplayLabel(f.branch)
                : (f.abbreviation || '—');
            const role = getPoliticianRoleLabel(f);
            const name = (f.faction_name || 'Unnamed') + (role ? ` (${role})` : '');
            // Nation flag replaces the legacy POL/ENTR/MIL text badge.
            const flag = flagUrlFor(f.nation);
            const badge = flag
                ? `<img class="mil-dd-type mil-dd-flag" src="${escHtml(flag)}" alt="" onerror="this.style.display='none'">`
                : `<span class="mil-dd-type"></span>`;
            return `<div class="mil-dd-item${isActive ? ' active' : ''}" data-faction-id="${escHtml(f.id)}">
                ${badge}
                <span class="mil-dd-name">${escHtml(name)}</span>
                <span class="mil-dd-abbr">[${escHtml(abbr)}]</span>
            </div>`;
        }).join('');
    }
    // Political Party founding REMOVED in Sunset Phase 1 (20270612).
    // Players going forward create only Politicians and Entrepreneurs;
    // existing parties keep operating but no new ones are accepted.
    // Founding a legacy corporation is retired (corp-cull Phase 1). No entry.
    const hasEntrepreneur = (allUserFactions || []).some(f => f.faction_type === 'entrepreneur');
    if (!hasEntrepreneur) {
        dropdownHtml += `<div class="mil-dd-item mil-dd-item--create" data-action="become-entrepreneur">
            <span class="mil-dd-type" style="color:var(--purple,#8b5cf6)">+</span>
            <span class="mil-dd-name">Become an Entrepreneur</span>
        </div>`;
    }
    // Politician slot row — label rule, cap, and Patreon11 gate all
    // live in js/game/factions.js. Null when the user has hit the cap.
    const polSlot = nextPoliticianSlot(allUserFactions);
    if (polSlot) {
        dropdownHtml += `<div class="mil-dd-item mil-dd-item--create" data-action="join-politician">
            <span class="mil-dd-type" style="color:var(--teal,#5aafa5)">+</span>
            <span class="mil-dd-name">${escHtml(polSlot.label)}</span>
        </div>`;
    }

    // Nav tabs — only Home for now. Active tab dashboard URL is read off
    // BRANCH_DASHBOARDS so adding navy/air-force pages later is one entry.
    const homeUrl = BRANCH_DASHBOARDS[faction?.branch] || 'army-dashboard.html';
    // army-actions.html is army-only (Phase 1). When navy/air-force pages
    // land this becomes a per-branch map like BRANCH_DASHBOARDS.
    const TABS = [
        { id: 'home',        label: 'Home',        href: homeUrl },
        { id: 'actions',     label: 'Actions',     href: 'army-actions.html' },
        { id: 'procurement', label: 'Procurement', href: 'army-procurement.html' },
        { id: 'operations',  label: 'Operations',  href: 'army-operations.html' },
    ];
    const tabsHtml = TABS.map(t => {
        const isActive = t.id === activeTab;
        return `<a href="${t.href}" class="mil-nav-tab${isActive ? ' active' : ''}">${escHtml(t.label)}</a>`;
    }).join('');

    const flagHtml = flagUrl
        ? `<img class="mil-topbar__flag" src="${escHtml(flagUrl)}" alt="" onerror="this.outerHTML='<div class=&quot;mil-topbar__flag-fallback&quot;></div>'">`
        : `<div class="mil-topbar__flag-fallback"></div>`;

    container.innerHTML = `
        <div class="mil-topbar">
            <div class="mil-topbar__left">
                <div class="mil-topbar__badge">
                    ${flagHtml}
                    <span class="mil-topbar__name">${escHtml(faction?.faction_name || 'Loading...')}</span>
                </div>
                <div class="mil-topbar__sep"></div>
                <div class="mil-topbar__ticks">
                    <div class="mil-topbar__tick">
                        <div class="mil-topbar__tick-label">GAME DATE</div>
                        <div class="mil-topbar__tick-value">${escHtml(String(gameDate))}</div>
                    </div>
                    <div class="mil-topbar__tick">
                        <div class="mil-topbar__tick-label">TICK</div>
                        <div class="mil-topbar__tick-value">${escHtml(String(tickNum))}</div>
                    </div>
                    <div class="mil-topbar__tick">
                        <div class="mil-topbar__tick-label">NEXT TICK</div>
                        <div class="mil-topbar__tick-value" id="mil-tick-countdown">--</div>
                    </div>
                </div>
            </div>
            <div class="mil-topbar__right">
                <div class="mil-topbar__budget">
                    <span class="mil-topbar__budget-label">Budget</span>
                    <span class="mil-topbar__budget-value">${escHtml(budgetStr)}</span>
                </div>
                <div class="mil-topbar__switcher" id="mil-faction-switcher">
                    <span class="mil-topbar__badge-btn" onclick="window._milTopbarToggleDropdown()">[${escHtml(branchBadge)}] ▾</span>
                    <div class="mil-topbar__dropdown" id="mil-faction-dropdown">${dropdownHtml}</div>
                </div>
                <button class="mil-topbar__btn" id="mil-theme-toggle" onclick="window._milTopbarToggleTheme()">${isLight ? 'Dark' : 'Light'}</button>
                <button class="mil-topbar__btn mil-topbar__btn--logout" onclick="window._milTopbarLogout()">Logout</button>
            </div>
        </div>
        <div class="mil-topbar__nav">${tabsHtml}</div>
    `;

    // Bind dropdown clicks (event delegation so a re-render doesn't lose them).
    const dd = container.querySelector('#mil-faction-dropdown');
    if (dd) {
        dd.addEventListener('click', (e) => {
            const item = e.target.closest('.mil-dd-item');
            if (!item) return;
            // 'found-party' branch REMOVED in Sunset Phase 1 (20270612).
            // The render above no longer emits the item, so the click
            // routing has nothing to dispatch.
            if (item.dataset.action === 'become-entrepreneur') {
                sessionStorage.setItem('pending_faction_type', 'entrepreneur');
                window.location.href = 'faction-select.html';
                return;
            }
            if (item.dataset.action === 'join-politician') {
                activatePoliticianSlot(polSlot);
                return;
            }
            const fid = item.dataset.factionId;
            if (!fid) return;
            sessionStorage.setItem('active_faction_id', fid);
            const target = (allUserFactions || []).find(f => f.id === fid);
            window.location.href = getFactionDashboardUrl(target) || homeUrl;
        });
    }

    startMilTickCountdown(shard);
}

// Live countdown to the next political tick. Mirrors the corp-topbar
// pattern (self-contained, 1s interval) but targets shard.next_tick_at
// directly — the political tick shown in the standard topbar, not the
// corp midpoint. Clears any prior timer so a re-render can't stack them.
let _milCountdownTimer = null;
function startMilTickCountdown(shard) {
    const el = document.getElementById('mil-tick-countdown');
    if (!el || !shard?.next_tick_at) return;
    const target = new Date(shard.next_tick_at).getTime();
    function update() {
        const diff = Math.max(0, target - Date.now());
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        el.textContent = `${h}h ${m}m ${s}s`;
    }
    update();
    if (_milCountdownTimer) clearInterval(_milCountdownTimer);
    _milCountdownTimer = setInterval(update, 1000);
}

// Toggle helpers attached to window so the inline onclick attributes can find
// them. Mirrors the corp-topbar pattern.
window._milTopbarToggleDropdown = function () {
    const dd = document.getElementById('mil-faction-dropdown');
    if (dd) dd.classList.toggle('open');
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('#mil-faction-switcher')) {
        document.getElementById('mil-faction-dropdown')?.classList.remove('open');
    }
});

// Theme toggle — mirrors corp-topbar's _corpTopbarToggleTheme: flips
// the shared body.light-mode class, persists per-area, swaps the label.
window._milTopbarToggleTheme = function () {
    const nowLight = document.body.classList.toggle('light-mode');
    try { localStorage.setItem(_MIL_THEME_KEY, nowLight ? 'light' : 'dark'); } catch (e) { /* ignore */ }
    const btn = document.getElementById('mil-theme-toggle');
    if (btn) btn.textContent = nowLight ? 'Dark' : 'Light';
};

window._milTopbarLogout = async function () {
    sessionStorage.clear();
    await _supabase.auth.signOut();
    window.location.href = 'login.html';
};
