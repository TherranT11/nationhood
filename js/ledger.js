// js/ledger.js — Ledger page: global nation stat viewer
// Three modes: Single Nation, Comparison, Global Rankings

import { STATS_HIGHER_IS_BETTER, STATS_LOWER_IS_BETTER } from './game/stats.js';

let _supabase = null;
let _state = null;
let _allNations = [];
let _selectedNationId = null;
let _activeCategory = 'fiscal';
let _mode = 'single';
let _compareIds = [];
let _rankingStat = 'gdp_growth';
let _rankingCategory = 'fiscal';
let _searchTerm = '';

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// Stats that should be formatted as currency (large dollar amounts)
const CURRENCY_STATS = new Set(['budget', 'debt']);

// ── Goods / Trade Sector definitions ──
const GOODS_SECTORS = [
    { key: 'fuel_energy',        name: 'Fuel & Energy',     icon: '\u26FD' },
    { key: 'minerals',           name: 'Minerals',          icon: '\u26CF\uFE0F' },
    { key: 'manufactured_goods', name: 'Manufactured',      icon: '\uD83C\uDFED' },
    { key: 'technology',         name: 'Technology',         icon: '\uD83D\uDCBB' },
    { key: 'arms',               name: 'Arms',              icon: '\u2694\uFE0F' },
    { key: 'grains_staples',     name: 'Grains & Staples',  icon: '\uD83C\uDF3E' },
    { key: 'livestock_dairy',    name: 'Livestock & Dairy',  icon: '\uD83E\uDD6C' },
    { key: 'fruits_vegetables',  name: 'Fruits & Veg',      icon: '\uD83C\uDF4E' },
    { key: 'cash_crops',         name: 'Cash Crops',         icon: '\uD83C\uDF3F' },
    { key: 'tourism',            name: 'Tourism',            icon: '\u2708\uFE0F' },
    { key: 'services_finance',   name: 'Services & Finance', icon: '\uD83C\uDFE6' },
];

// nationId → { sectorKey → { export_capacity, import_demand, export_volume, import_volume } }
let _allTradeFlows = {};

function fmtVal(val, statId) {
    if (val == null) return '\u2014';
    if (typeof val === 'string') return val;
    if (CURRENCY_STATS.has(statId)) {
        const abs = Math.abs(val);
        if (abs >= 1e12) return '$' + (val / 1e12).toFixed(1) + 'T';
        if (abs >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
        if (abs >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
        if (abs >= 1e3) return '$' + Math.round(val / 1e3) + 'k';
        return '$' + val;
    }
    return val.toFixed(1);
}

// ═══════════════════════════════════════════════════
// STAT CATEGORIES
// ═══════════════════════════════════════════════════

const HIGHER = new Set(STATS_HIGHER_IS_BETTER);
const LOWER = new Set(STATS_LOWER_IS_BETTER);

function isHigherBetter(statId) {
    if (HIGHER.has(statId)) return true;
    if (LOWER.has(statId)) return false;
    return null; // neutral
}

// Phase 9b: alpha-23 stat menu, organized into the 7 groups shared with
// the admin/policy/crisis stat pickers. Goods is preserved as a custom
// trade-flow viewer.
const STAT_CATEGORIES = [
    { id: 'fiscal', name: 'Fiscal', stats: [
        { id: 'budget', name: 'Budget' },
        { id: 'debt', name: 'Debt' },
        { id: 'gdp_growth', name: 'GDP Growth' },
        { id: 'income_tax', name: 'Income Tax' },
        { id: 'corporate_tax', name: 'Corporate Tax' },
        { id: 'cost_of_living', name: 'Cost of Living' },
    ]},
    { id: 'governance', name: 'Governance', stats: [
        { id: 'control', name: 'Control' },
        { id: 'public_approval', name: 'Public Approval' },
        { id: 'crown_authority', name: 'Crown Authority' },
        { id: 'corruption', name: 'Corruption' },
    ]},
    { id: 'stability', name: 'Stability', stats: [
        { id: 'unrest', name: 'Unrest' },
        { id: 'crime', name: 'Crime' },
    ]},
    { id: 'population', name: 'Population', stats: [
        { id: 'population', name: 'Population' },
        { id: 'immigration', name: 'Immigration' },
    ]},
    { id: 'wellbeing', name: 'Wellbeing', stats: [
        { id: 'health', name: 'Health' },
        { id: 'education', name: 'Education' },
        { id: 'standard_of_living', name: 'Standard of Living' },
    ]},
    { id: 'productive', name: 'Productive Base', stats: [
        { id: 'infrastructure', name: 'Infrastructure' },
        { id: 'industry', name: 'Industry' },
        { id: 'farmland', name: 'Farmland' },
        { id: 'service_sector', name: 'Service Sector' },
        { id: 'workforce', name: 'Workforce' },
        { id: 'energy', name: 'Energy' },
    ]},
    { id: 'international', name: 'International', stats: [
        { id: 'power', name: 'Power' },
    ]},
    { id: 'goods', name: 'Goods', stats: [] }, // rendered via custom trade flow logic
];

// ═══════════════════════════════════════════════════
// RANKING HELPERS
// ═══════════════════════════════════════════════════

function getRank(nationId, statId) {
    const hb = isHigherBetter(statId);
    const vals = _allNations.map(n => ({ id: n.id, val: Number(n[statId] ?? 0) }));
    vals.sort((a, b) => hb !== false ? b.val - a.val : a.val - b.val);
    return vals.findIndex(v => v.id === nationId) + 1;
}

function rankColor(rank, total) {
    if (rank <= 3) return 'var(--accent)';
    if (rank <= Math.ceil(total * 0.5)) return 'var(--green)';
    if (rank <= Math.ceil(total * 0.75)) return 'var(--amber)';
    return 'var(--red)';
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════

export async function initLedger(supabase, state) {
    _supabase = supabase;
    _state = state;

    const root = document.getElementById('ledger-root');
    if (!root) return;

    root.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:17px;">Loading ledger...</div>';

    // Fetch all nations
    const { data: nations, error } = await supabase
        .from('nations')
        .select('*')
        .order('name');

    if (error) {
        console.error('[Ledger] Failed to load nations:', error.message);
        root.innerHTML = '<div style="padding:40px;text-align:center;color:var(--red);font-size:17px;">Failed to load data.</div>';
        return;
    }

    _allNations = nations || [];
    _selectedNationId = state.nation?.id || (_allNations[0]?.id ?? null);
    _compareIds = [_selectedNationId].filter(Boolean);

    // Load trade flows for the Goods tab
    await loadAllTradeFlows(supabase);

    // Attach event listeners ONCE on root — they persist across re-renders
    attachLedgerListeners(root);
    renderLedgerBody(root);
}

async function loadAllTradeFlows(_supabase) {
    // Phase 10A: trade_flows + trade_summary tables dropped. The Goods
    // tab renders an empty placeholder until the rebuild lands.
    _allTradeFlows = {};
}

function getGoodsRank(nationId, sectorKey, metric) {
    const vals = _allNations.map(n => {
        const flow = _allTradeFlows[n.id]?.[sectorKey];
        return { id: n.id, val: flow ? Number(flow[metric]) || 0 : 0 };
    });
    vals.sort((a, b) => b.val - a.val); // higher is better for production
    return vals.findIndex(v => v.id === nationId) + 1;
}

function fmtCurrency(val) {
    if (val == null || val === 0) return '$0';
    const abs = Math.abs(val);
    if (abs >= 1e12) return '$' + (val / 1e12).toFixed(1) + 'T';
    if (abs >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return '$' + (val / 1e6).toFixed(0) + 'M';
    if (abs >= 1e3) return '$' + Math.round(val / 1e3) + 'k';
    return '$' + Math.round(val);
}

// ═══════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════

// Flag URL helper — nation.flag_url with fallback to assets/flags/{name}.png
function flagUrl(nation) {
    return nation.flag_url || `assets/flags/${nation.name}.png`;
}

// Attach event listeners ONCE on root via delegation (survives innerHTML rebuilds)
function attachLedgerListeners(root) {
    root.addEventListener('click', (e) => {
        // Mode switcher
        const modeBtn = e.target.closest('.lg-mode-btn');
        if (modeBtn) {
            _mode = modeBtn.dataset.mode;
            renderLedgerBody(root);
            return;
        }
        // Nation selector clicks (single mode)
        const row = e.target.closest('.lg-nation-row');
        if (row) {
            _selectedNationId = row.dataset.nationId;
            renderLedgerBody(root);
            return;
        }
        const catBtn = e.target.closest('.lg-cat-btn');
        if (catBtn) {
            _activeCategory = catBtn.dataset.cat;
            renderLedgerBody(root);
            return;
        }
        // Compare mode: toggle nation
        const compBtn = e.target.closest('.lg-comp-nation');
        if (compBtn) {
            const nid = compBtn.dataset.nationId;
            if (_compareIds.includes(nid)) {
                if (_compareIds.length > 1) _compareIds = _compareIds.filter(id => id !== nid);
            } else if (_compareIds.length < 4) {
                _compareIds.push(nid);
            }
            renderLedgerBody(root);
            return;
        }
        // Rankings mode: category picker
        const rankCat = e.target.closest('.lg-rank-cat');
        if (rankCat) {
            _rankingCategory = rankCat.dataset.cat;
            if (_rankingCategory === 'goods') {
                _rankingStat = GOODS_SECTORS[0].key;
            } else {
                const newCat = STAT_CATEGORIES.find(c => c.id === _rankingCategory);
                if (newCat && newCat.stats.length > 0) _rankingStat = newCat.stats[0].id;
            }
            renderLedgerBody(root);
            return;
        }
        // Rankings mode: stat picker
        const rankStat = e.target.closest('.lg-rank-stat');
        if (rankStat) {
            _rankingStat = rankStat.dataset.stat;
            renderLedgerBody(root);
            return;
        }
    });

    // Search: use delegated input event on root
    root.addEventListener('input', (e) => {
        if (e.target.matches('.lg-search input')) {
            _searchTerm = e.target.value;
            renderLedgerBody(root);
        }
    });
}

function renderLedgerBody(root) {
    const totalStats = STAT_CATEGORIES.reduce((s, c) => s + c.stats.length, 0) + GOODS_SECTORS.length;

    root.innerHTML = `<div class="lg-page">
        <div class="lg-header">
            <div style="display:flex;align-items:center;">
                <span class="lg-title">Ledger</span>
                <span class="lg-meta">${_allNations.length} nations \u00B7 ${totalStats} stats</span>
            </div>
            <div class="lg-mode-bar" id="lg-mode-bar">
                <div class="lg-mode-btn ${_mode === 'single' ? 'active' : ''}" data-mode="single">SINGLE NATION</div>
                <div class="lg-mode-btn ${_mode === 'compare' ? 'active' : ''}" data-mode="compare">COMPARISON</div>
                <div class="lg-mode-btn ${_mode === 'rankings' ? 'active' : ''}" data-mode="rankings">GLOBAL RANKINGS</div>
            </div>
        </div>
        <div id="lg-body">${_mode === 'single' ? renderSingleMode() : _mode === 'compare' ? renderCompareMode() : renderRankingsMode()}</div>
    </div>`;

    // Restore search value after innerHTML rebuild
    const searchInput = root.querySelector('.lg-search input');
    if (searchInput) {
        searchInput.value = _searchTerm;
    }
}

// ═══════════════════════════════════════════════════
// SINGLE NATION MODE
// ═══════════════════════════════════════════════════

function renderSingleMode() {
    const myNationId = _state.nation?.id;
    const filtered = _searchTerm
        ? _allNations.filter(n => n.name.toLowerCase().includes(_searchTerm.toLowerCase()))
        : _allNations;

    const nation = _allNations.find(n => n.id === _selectedNationId);
    const cat = STAT_CATEGORIES.find(c => c.id === _activeCategory);
    const total = _allNations.length;

    // Sidebar
    const sidebarHtml = filtered.map(n => {
        const isActive = n.id === _selectedNationId;
        const isYou = n.id === myNationId;
        return `<div class="lg-nation-row ${isActive ? 'active' : ''}" data-nation-id="${n.id}">
            <img class="lg-nation-flag" src="${flagUrl(n)}" alt="" onerror="this.style.display='none'">
            <div style="flex:1;min-width:0;">
                <div class="lg-nation-name">${esc(n.name)}</div>
                <div class="lg-nation-continent">${esc(n.government_type || '')}</div>
            </div>
            ${isYou ? '<span class="lg-nation-you">YOU</span>' : ''}
        </div>`;
    }).join('');

    // Nation header
    const headerHtml = nation ? `<div class="lg-nation-header" style="border-left-color:var(--accent);">
        <div style="display:flex;align-items:center;gap:12px;">
            <img class="lg-header-flag" src="${flagUrl(nation)}" alt="" onerror="this.style.display='none'">
            <div>
                <div class="lg-nation-title">${esc(nation.name)}</div>
                <div class="lg-nation-sub">${esc(nation.government_type || '')} \u00B7 Pop: ${Number(nation.population || 0).toLocaleString()}</div>
            </div>
        </div>
        <div style="font-family:var(--font-mono);font-size:17px;color:var(--text-dim);">
            GDP Growth: <span style="color:var(--text-bright);font-weight:700;">${fmtVal(nation.gdp_growth, 'gdp_growth')}</span>
        </div>
    </div>` : '';

    // Category tabs
    const catHtml = STAT_CATEGORIES.map(c =>
        `<div class="lg-cat-btn ${c.id === _activeCategory ? 'active' : ''}" data-cat="${c.id}">${esc(c.name.toUpperCase())}</div>`
    ).join('');

    // Stat rows — goods category uses trade flows, others use nation stats
    let statsHtml = '';
    if (_activeCategory === 'goods' && nation) {
        const flows = _allTradeFlows[nation.id] || {};
        let totalProd = 0;
        const sectorRows = GOODS_SECTORS.map(s => {
            const flow = flows[s.key];
            const prod = flow ? flow.export_capacity : 0;
            totalProd += prod;
            const rank = getGoodsRank(nation.id, s.key, 'export_capacity');
            const pct = total > 1 ? ((total - rank) / (total - 1)) * 100 : 50;
            const barColor = pct > 75 ? 'var(--green)' : pct > 50 ? 'var(--amber)' : pct > 25 ? 'var(--orange)' : 'var(--red)';
            return `<div class="lg-stat-row">
                <span class="lg-stat-name"><span style="margin-right:4px;">${s.icon}</span>${esc(s.name)}</span>
                <span class="lg-stat-value">${fmtCurrency(prod)}</span>
                <span class="lg-stat-rank" style="color:${rankColor(rank, total)};">#${rank}</span>
                <div class="lg-stat-bar-wrap">
                    <div class="lg-stat-bar"><div class="lg-stat-bar-fill" style="width:${pct}%;background:${barColor};"></div></div>
                    <span class="lg-stat-pct">${Math.round(pct)}%</span>
                </div>
            </div>`;
        }).join('');
        // Total production header row
        statsHtml = `<div class="lg-stat-row" style="background:var(--bg-card);border-bottom:2px solid var(--border-main);">
            <span class="lg-stat-name" style="font-weight:700;color:var(--text-bright);">Total Production</span>
            <span class="lg-stat-value" style="font-weight:700;color:var(--accent);">${fmtCurrency(totalProd)}</span>
            <span class="lg-stat-rank"></span>
            <div class="lg-stat-bar-wrap"></div>
        </div>` + sectorRows;
    } else {
        statsHtml = (cat?.stats || []).map(stat => {
            if (!nation) return '';
            const val = Number(nation[stat.id] ?? 0);
            const hb = isHigherBetter(stat.id);
            const rank = getRank(nation.id, stat.id);
            const pct = total > 1 ? ((total - rank) / (total - 1)) * 100 : 50;
            const barColor = pct > 75 ? 'var(--green)' : pct > 50 ? 'var(--amber)' : pct > 25 ? 'var(--orange)' : 'var(--red)';

            return `<div class="lg-stat-row">
                <span class="lg-stat-name">${esc(stat.name)}</span>
                <span class="lg-stat-value">${fmtVal(val, stat.id)}</span>
                <span class="lg-stat-rank" style="color:${rankColor(rank, total)};">#${rank}</span>
                <div class="lg-stat-bar-wrap">
                    <div class="lg-stat-bar"><div class="lg-stat-bar-fill" style="width:${pct}%;background:${barColor};"></div></div>
                    <span class="lg-stat-pct">${Math.round(pct)}%</span>
                </div>
            </div>`;
        }).join('');
    }

    return `<div class="lg-main">
        <div class="lg-sidebar">
            <div class="lg-search"><input placeholder="Search nations..." /></div>
            <div class="lg-nation-list">${sidebarHtml}</div>
        </div>
        <div class="lg-content">
            ${headerHtml}
            <div class="lg-cat-bar">${catHtml}</div>
            <div class="lg-table">
                <div class="lg-table-header">
                    <span style="flex:1;">STAT</span>
                    <span style="width:70px;text-align:right;">VALUE</span>
                    <span style="width:50px;text-align:right;">RANK</span>
                    <span style="width:120px;text-align:right;">GLOBAL POSITION</span>
                </div>
                ${statsHtml}
            </div>
        </div>
    </div>`;
}

// ═══════════════════════════════════════════════════
// COMPARISON MODE
// ═══════════════════════════════════════════════════

function renderCompareMode() {
    const cat = STAT_CATEGORIES.find(c => c.id === _activeCategory);
    const myNationId = _state.nation?.id;

    // Nation picker
    const pickerHtml = _allNations.map(n => {
        const isIn = _compareIds.includes(n.id);
        return `<div class="lg-comp-nation" data-nation-id="${n.id}" style="
            padding:3px 8px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;
            font-family:var(--font-mono);font-size:16px;font-weight:${isIn ? '700' : '400'};
            color:${isIn ? 'var(--text-bright)' : 'var(--text-dim)'};
            background:${isIn ? 'var(--amber-faint)' : 'transparent'};
            border:1px solid ${isIn ? 'var(--amber-border)' : 'var(--border-main)'};
        ">${esc(n.name)}${n.id === myNationId ? ' <span style="color:var(--green);font-size:17px;">YOU</span>' : ''}</div>`;
    }).join('');

    // Category tabs
    const catHtml = STAT_CATEGORIES.map(c =>
        `<div class="lg-cat-btn ${c.id === _activeCategory ? 'active' : ''}" data-cat="${c.id}">${esc(c.name.toUpperCase())}</div>`
    ).join('');

    // Column headers
    const colHeaders = _compareIds.map(nid => {
        const n = _allNations.find(x => x.id === nid);
        if (!n) return '';
        return `<div style="flex:1;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${esc(n.name)}</div>
            <div style="font-family:var(--font-mono);font-size:17px;color:var(--text-dim);">${esc(n.government_type || '')}</div>
        </div>`;
    }).join('');

    // Stat rows — goods category uses trade flows
    const compareStatList = _activeCategory === 'goods'
        ? GOODS_SECTORS.map(s => ({ id: s.key, name: s.icon + ' ' + s.name, isGoods: true }))
        : (cat?.stats || []);

    const statsHtml = compareStatList.map((stat, si) => {
        const isGoods = stat.isGoods;

        const vals = _compareIds.map(nid => {
            if (isGoods) {
                const flow = _allTradeFlows[nid]?.[stat.id];
                return { id: nid, val: flow ? flow.export_capacity : 0 };
            }
            return { id: nid, val: Number(_allNations.find(n => n.id === nid)?.[stat.id] ?? 0) };
        });

        const hb = isGoods ? true : isHigherBetter(stat.id);
        const numVals = vals.filter(v => !isNaN(v.val));
        let bestId = null;
        if (numVals.length > 0 && hb !== null) {
            bestId = hb
                ? numVals.reduce((a, b) => b.val > a.val ? b : a).id
                : numVals.reduce((a, b) => b.val < a.val ? b : a).id;
        }

        const cellsHtml = _compareIds.map(nid => {
            const v = vals.find(x => x.id === nid);
            const val = v ? v.val : 0;
            const isBest = nid === bestId;
            const display = isGoods ? fmtCurrency(val) : fmtVal(val, stat.id);
            return `<div style="flex:1;text-align:center;">
                <span style="font-family:var(--font-mono);font-size:17px;font-weight:700;color:${isBest ? 'var(--accent)' : 'var(--text-bright)'};">${display}</span>
                ${isBest ? '<span style="font-family:var(--font-mono);font-size:16px;color:var(--accent);margin-left:2px;">\u2605</span>' : ''}
            </div>`;
        }).join('');

        return `<div style="display:flex;padding:5px 14px;align-items:center;border-bottom:${si < compareStatList.length - 1 ? '1px solid rgba(200,196,184,0.03)' : 'none'};">
            <span style="width:160px;font-size:16px;color:var(--text-secondary);">${stat.isGoods ? stat.name : esc(stat.name)}</span>
            ${cellsHtml}
        </div>`;
    }).join('');

    return `<div>
        <div style="background:var(--bg-panel);border:1px solid var(--border-main);padding:8px 14px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;gap:4px;flex-wrap:wrap;">${pickerHtml}</div>
            <span style="font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">${_compareIds.length}/4 selected</span>
        </div>
        <div class="lg-cat-bar">${catHtml}</div>
        <div class="lg-table">
            <div style="display:flex;padding:8px 14px;background:var(--bg-card);border-bottom:1px solid var(--border-main);">
                <span style="width:160px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">STAT</span>
                ${colHeaders}
            </div>
            ${statsHtml}
        </div>
    </div>`;
}

// ═══════════════════════════════════════════════════
// GLOBAL RANKINGS MODE
// ═══════════════════════════════════════════════════

function renderRankingsMode() {
    const myNationId = _state.nation?.id;
    const rankCat = STAT_CATEGORIES.find(c => c.id === _rankingCategory);
    const isGoodsRanking = _rankingCategory === 'goods';
    const goodsSector = isGoodsRanking ? GOODS_SECTORS.find(s => s.key === _rankingStat) : null;
    const statDef = isGoodsRanking ? (goodsSector ? { name: goodsSector.name } : { name: 'Production' }) : rankCat?.stats.find(s => s.id === _rankingStat);
    const hb = isGoodsRanking ? true : isHigherBetter(_rankingStat);

    // Sort nations by selected stat
    const sorted = [..._allNations].sort((a, b) => {
        if (isGoodsRanking) {
            const va = _allTradeFlows[a.id]?.[_rankingStat]?.export_capacity || 0;
            const vb = _allTradeFlows[b.id]?.[_rankingStat]?.export_capacity || 0;
            return vb - va;
        }
        const va = Number(a[_rankingStat] ?? 0);
        const vb = Number(b[_rankingStat] ?? 0);
        return hb !== false ? vb - va : va - vb;
    });

    // Use the largest absolute value across all nations for bar scaling
    const maxVal = sorted.length > 0 ? Math.max(...sorted.map(n => {
        if (isGoodsRanking) return _allTradeFlows[n.id]?.[_rankingStat]?.export_capacity || 0;
        return Math.abs(Number(n[_rankingStat] ?? 0));
    }), 1) : 1;

    // Category tabs
    const catHtml = STAT_CATEGORIES.map(c =>
        `<div class="lg-rank-cat" data-cat="${c.id}" style="
            padding:3px 8px;font-family:var(--font-mono);font-size:16px;font-weight:700;cursor:pointer;
            color:${_rankingCategory === c.id ? 'var(--text-bright)' : 'var(--text-dim)'};
            background:${_rankingCategory === c.id ? 'var(--bg-card)' : 'transparent'};
            border:1px solid ${_rankingCategory === c.id ? 'var(--border-main)' : 'transparent'};
        ">${esc(c.name.toUpperCase())}</div>`
    ).join('');

    // Stat picker — goods uses GOODS_SECTORS, others use cat.stats
    const statPickerList = isGoodsRanking
        ? GOODS_SECTORS.map(s => ({ id: s.key, name: s.icon + ' ' + s.name }))
        : (rankCat?.stats || []);

    const statPickerHtml = statPickerList.map(s =>
        `<div class="lg-rank-stat" data-stat="${s.id}" style="
            padding:3px 10px;font-family:var(--font-mono);font-size:17px;cursor:pointer;
            font-weight:${_rankingStat === s.id ? '700' : '400'};
            color:${_rankingStat === s.id ? 'var(--accent)' : 'var(--text-secondary)'};
            background:${_rankingStat === s.id ? 'var(--amber-faint)' : 'transparent'};
            border:1px solid ${_rankingStat === s.id ? 'var(--amber-border)' : 'var(--border-main)'};
        ">${isGoodsRanking ? s.name : esc(s.name)}</div>`
    ).join('');

    // Ranked rows
    const rowsHtml = sorted.map((n, i) => {
        const val = isGoodsRanking
            ? (_allTradeFlows[n.id]?.[_rankingStat]?.export_capacity || 0)
            : Number(n[_rankingStat] ?? 0);
        const pct = maxVal > 0 ? (Math.abs(val) / maxVal) * 100 : 0;
        const isPlayer = n.id === myNationId;
        const medal = i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : `#${i + 1}`;
        const medalColor = i === 0 ? 'var(--accent)' : i === 1 ? 'var(--text-secondary)' : i === 2 ? 'var(--orange)' : 'var(--text-dim)';
        const barColor = isPlayer ? 'var(--accent)' : i === 0 ? 'var(--accent)' : i < 3 ? 'var(--green)' : i < Math.ceil(sorted.length * 0.5) ? 'var(--amber)' : 'var(--text-dim)';

        return `<div style="display:flex;padding:6px 14px;align-items:center;border-bottom:1px solid rgba(200,196,184,0.03);background:${isPlayer ? 'var(--amber-faint)' : 'transparent'};">
            <span style="width:40px;font-family:var(--font-mono);font-size:${i < 3 ? '13' : '10'}px;font-weight:700;color:${medalColor};">${medal}</span>
            <div style="flex:1;display:flex;align-items:center;gap:8px;">
                <div>
                    <span style="font-size:14px;font-weight:${isPlayer ? '700' : '500'};color:${isPlayer ? 'var(--accent)' : 'var(--text-bright)'};">${esc(n.name)}</span>
                    ${isPlayer ? '<span style="font-family:var(--font-mono);font-size:17px;color:var(--green);font-weight:700;margin-left:6px;">YOU</span>' : ''}
                    <div style="font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">${esc(n.government_type || '')}</div>
                </div>
            </div>
            <span style="width:100px;font-family:var(--font-mono);font-size:16px;font-weight:700;color:${i === 0 ? 'var(--accent)' : 'var(--text-bright)'};text-align:right;">${isGoodsRanking ? fmtCurrency(val) : fmtVal(val, _rankingStat)}</span>
            <div style="width:160px;display:flex;align-items:center;gap:6px;justify-content:flex-end;flex-shrink:0;">
                <div style="width:130px;height:6px;background:var(--border-main);overflow:hidden;">
                    <div style="width:${Math.min(pct, 100)}%;height:100%;background:${barColor};"></div>
                </div>
            </div>
        </div>`;
    }).join('');

    return `<div>
        <div style="background:var(--bg-panel);border:1px solid var(--border-main);padding:8px 14px;margin-bottom:6px;">
            <div style="display:flex;gap:2px;margin-bottom:6px;flex-wrap:wrap;">${catHtml}</div>
            <div style="display:flex;gap:3px;flex-wrap:wrap;">${statPickerHtml}</div>
        </div>
        <div class="lg-table">
            <div style="display:flex;padding:6px 14px;background:var(--bg-card);border-bottom:1px solid var(--border-main);">
                <span style="width:40px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">RANK</span>
                <span style="flex:1;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">NATION</span>
                <span style="width:100px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);text-align:right;">${esc(statDef?.name?.toUpperCase() || 'VALUE')}</span>
                <span style="width:160px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);text-align:right;">BAR</span>
            </div>
            ${rowsHtml}
        </div>
    </div>`;
}
