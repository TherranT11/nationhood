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
    getFactionTypeBadge,
    getFactionDashboardUrl,
    getBranchDisplayLabel,
} from './game/factions.js';

const VERSION = 'Alpha 2.6.0.0';

function escHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function renderMilitaryTopBar(container, opts = {}) {
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

    // Dropdown: every active faction the user owns + "Found a …" entries
    // for missing party/corp types. We never offer "Join a Military
    // Branch" because the viewer is already on a military dashboard.
    let dropdownHtml = '';
    if (allUserFactions && allUserFactions.length > 0) {
        dropdownHtml = allUserFactions.map(f => {
            const isActive = faction && f.id === faction.id;
            const { label, color } = getFactionTypeBadge(f.faction_type);
            // For military rows, prefer the branch label over the (often
            // null) abbreviation column so the row reads e.g. "[ARMY]".
            const abbr = f.faction_type === 'military'
                ? getBranchDisplayLabel(f.branch)
                : (f.abbreviation || '—');
            return `<div class="mil-dd-item${isActive ? ' active' : ''}" data-faction-id="${escHtml(f.id)}">
                <span class="mil-dd-type" style="color:${color}">${label}</span>
                <span class="mil-dd-name">${escHtml(f.faction_name || 'Unnamed')}</span>
                <span class="mil-dd-abbr">[${escHtml(abbr)}]</span>
            </div>`;
        }).join('');
    }
    const hasParty = (allUserFactions || []).some(f => f.faction_type === 'party');
    if (!hasParty) {
        dropdownHtml += `<div class="mil-dd-item mil-dd-item--create" data-action="found-party">
            <span class="mil-dd-type" style="color:var(--amber)">+</span>
            <span class="mil-dd-name">Found a Political Party</span>
        </div>`;
    }
    const hasCorp = (allUserFactions || []).some(f => f.faction_type === 'corporation');
    if (!hasCorp) {
        dropdownHtml += `<div class="mil-dd-item mil-dd-item--create" data-action="found-corp">
            <span class="mil-dd-type" style="color:var(--teal)">+</span>
            <span class="mil-dd-name">Found a Corporation</span>
        </div>`;
    }

    // Nav tabs — only Home for now. Active tab dashboard URL is read off
    // BRANCH_DASHBOARDS so adding navy/air-force pages later is one entry.
    const homeUrl = BRANCH_DASHBOARDS[faction?.branch] || 'army-dashboard.html';
    const TABS = [{ id: 'home', label: 'Home', href: homeUrl }];
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
                </div>
            </div>
            <div class="mil-topbar__version">${VERSION}</div>
            <div class="mil-topbar__right">
                <div class="mil-topbar__switcher" id="mil-faction-switcher">
                    <span class="mil-topbar__badge-btn" onclick="window._milTopbarToggleDropdown()">[${escHtml(branchBadge)}] ▾</span>
                    <div class="mil-topbar__dropdown" id="mil-faction-dropdown">${dropdownHtml}</div>
                </div>
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
            if (item.dataset.action === 'found-party') {
                sessionStorage.setItem('pending_faction_type', 'party');
                window.location.href = 'select-nation.html';
                return;
            }
            if (item.dataset.action === 'found-corp') {
                sessionStorage.setItem('pending_faction_type', 'corp');
                window.location.href = 'corp-setup.html';
                return;
            }
            const fid = item.dataset.factionId;
            if (!fid) return;
            sessionStorage.setItem('active_faction_id', fid);
            const target = (allUserFactions || []).find(f => f.id === fid);
            window.location.href = getFactionDashboardUrl(target) || homeUrl;
        });
    }
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

window._milTopbarLogout = async function () {
    sessionStorage.clear();
    await _supabase.auth.signOut();
    window.location.href = 'login.html';
};
