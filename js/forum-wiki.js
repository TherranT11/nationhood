// Forum Wiki pane — list + inline reader for wiki_pages.
//
// Single export: mountWikiPane(hostElement, supabaseClient). Replaces
// the host element's contents with a self-contained list/reader UI.
// Both politician-forum.html and entrepreneur-forum.html use it; the
// state machine (list view ↔ reader view) lives inside the function.
//
// The list mirrors the standalone wiki-list.html surface: title search,
// template-type filter pills (All / Nation / Person / Corporation / …),
// a Wiki Home + New Page action pair, a tag search bar with popular-tag
// chips, and an alphabetical page list with type tag + tag preview +
// updated date. Wiki Home and New Page link out to the standalone wiki
// pages (wiki.html / wiki-edit.html?new=1) — the forum subtab is a
// reader surface only.
//
// Reuses the wiki rendering helpers already exported from js/wiki.js
// (fetchPageList, fetchPage, renderWikiLinks, renderInfobox,
// fetchPopularTags) so the in-forum reader matches the standalone
// wiki.html reader byte-for-byte — same wiki-link processing, same
// infobox markup, same body rendering convention (no sanitization,
// matching the existing wiki trust model).
//
// Wiki-link clicks inside the reader are intercepted so navigation
// stays inside the forum shell. Missing-link clicks (slugs that
// don't exist yet) fall through to wiki.html so the user can land
// on the standalone editor surface for that slug.

import { fetchPageList, fetchPage, renderWikiLinks, renderInfobox, fetchPopularTags, normalizeTag } from './wiki.js';
import { escHtml } from './forum-utils.js';

const STYLE_ID = 'forum-wiki-styles';

// Mirrors wiki-list.html's TEMPLATE_TYPES list so the filter pills line
// up byte-for-byte with the standalone surface.
const TEMPLATE_TYPES = [
    'nation', 'person', 'corporation', 'religion', 'culture',
    'political_party', 'law', 'agreement', 'event', 'organization',
    'military_unit', 'product', 'location', 'sports'
];

function titleCaseType(t) {
    return t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
        .fw-loading {
            font-family:monospace; font-size:11px; color:#4a4940;
            text-align:center; padding:60px 20px;
        }
        .fw-empty {
            color:#666; font-size:12px; font-style:italic; text-align:center;
            padding:60px 20px; background:#121212;
            border:0.5px dashed rgba(255,255,255,0.10); border-radius:4px;
        }

        /* ── Toolbar (search + type pills + actions) ───────────────── */
        .fw-toolbar {
            background:#0a0a0a; border:1px solid rgba(255,255,255,0.06);
            border-radius:6px; padding:14px 16px; margin-bottom:10px;
            display:flex; flex-direction:column; gap:10px;
        }
        .fw-toolbar-row {
            display:flex; flex-wrap:wrap; align-items:center; gap:8px;
        }
        .fw-search {
            flex:1; min-width:180px;
            background:#0d0d0d; border:1px solid rgba(255,255,255,0.10);
            border-radius:4px; padding:8px 12px;
            color:#e7e7e7; font-family:inherit; font-size:12px;
            outline:none;
        }
        .fw-search:focus { border-color:rgba(90,175,165,0.45); }
        .fw-search::placeholder { color:#666; }
        .fw-btn {
            display:inline-flex; align-items:center; gap:6px;
            background:#0d0d0d; border:1px solid rgba(255,255,255,0.12);
            color:#d4d4d4; font-family:inherit;
            font-size:10px; letter-spacing:0.12em; font-weight:700;
            text-transform:uppercase;
            padding:8px 14px; border-radius:4px; cursor:pointer;
            text-decoration:none; white-space:nowrap;
        }
        .fw-btn:hover { background:#141414; color:#fff; border-color:rgba(255,255,255,0.20); }
        .fw-btn-primary {
            background:rgba(90,175,165,0.14);
            border-color:rgba(90,175,165,0.40); color:#7ac8c8;
        }
        .fw-btn-primary:hover {
            background:rgba(90,175,165,0.20);
            border-color:rgba(90,175,165,0.55); color:#a1d8d3;
        }

        .fw-filter-bar {
            display:flex; flex-wrap:wrap; gap:6px;
        }
        .fw-filter-btn {
            background:transparent; border:1px solid rgba(255,255,255,0.10);
            color:#a8a8a8; font-family:inherit;
            font-size:9px; letter-spacing:0.14em; font-weight:700;
            text-transform:uppercase;
            padding:5px 10px; border-radius:3px; cursor:pointer;
            transition:all 0.12s;
        }
        .fw-filter-btn:hover { color:#fff; border-color:rgba(255,255,255,0.25); }
        .fw-filter-btn.active {
            background:rgba(90,175,165,0.16);
            border-color:rgba(90,175,165,0.45);
            color:#7ac8c8;
        }

        /* ── Tag search ───────────────────────────────────────────── */
        .fw-tag-wrap {
            display:flex; flex-wrap:wrap; align-items:center; gap:6px;
            background:#0d0d0d; border:1px solid rgba(255,255,255,0.10);
            border-radius:4px; padding:6px 10px; min-height:34px;
        }
        .fw-tag-wrap:focus-within { border-color:rgba(90,175,165,0.45); }
        .fw-tag-input {
            flex:1; min-width:120px;
            background:transparent; border:none; outline:none;
            color:#e7e7e7; font-family:inherit; font-size:12px; padding:2px 0;
        }
        .fw-tag-input::placeholder { color:#666; }
        .fw-tag-chip {
            display:inline-flex; align-items:center; gap:4px;
            background:rgba(90,175,165,0.14);
            border:1px solid rgba(90,175,165,0.35);
            color:#7ac8c8;
            font-size:10px; padding:2px 6px; border-radius:3px;
            font-weight:600;
        }
        .fw-tag-chip-remove {
            background:transparent; border:none; padding:0;
            color:#7ac8c8; cursor:pointer; font-size:14px; line-height:1;
        }
        .fw-tag-chip-remove:hover { color:#fff; }
        .fw-popular-tags {
            display:flex; flex-wrap:wrap; gap:5px;
        }
        .fw-popular-tag {
            display:inline-flex; align-items:center; gap:5px;
            background:transparent;
            border:1px solid rgba(255,255,255,0.08); color:#9a9a9a;
            font-family:inherit; font-size:9.5px;
            padding:3px 7px; border-radius:3px; cursor:pointer;
        }
        .fw-popular-tag:hover {
            border-color:rgba(90,175,165,0.40); color:#7ac8c8;
        }
        .fw-popular-tag-count {
            color:#666; font-size:8.5px; font-weight:700;
        }
        .fw-popular-tag:hover .fw-popular-tag-count { color:#7ac8c8; }
        .fw-toolbar-label {
            font-size:9px; letter-spacing:0.16em; font-weight:700;
            text-transform:uppercase; color:#7a7a7a;
            margin-right:4px;
        }

        /* ── Page list ────────────────────────────────────────────── */
        .fw-list {
            background:#0a0a0a; border:1px solid rgba(255,255,255,0.06);
            border-radius:6px; overflow:hidden;
        }
        .fw-row {
            width:100%;
            display:flex; align-items:center; gap:10px;
            padding:12px 18px;
            background:transparent; border:none;
            border-bottom:1px solid rgba(255,255,255,0.04);
            color:#d4d4d4; font-family:inherit; text-align:left;
            cursor:pointer; transition:background 0.12s;
        }
        .fw-row:last-child { border-bottom:none; }
        .fw-row:hover { background:#0d0d0d; }
        .fw-row-title {
            flex:1; min-width:0;
            font-family:Georgia,serif; font-size:14px; color:#fff;
            font-weight:500; line-height:1.25; letter-spacing:-0.005em;
            overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }
        .fw-row-tag {
            padding:3px 9px; border-radius:3px;
            background:rgba(90,175,165,0.08); border:1px solid rgba(90,175,165,0.25);
            color:#7ac8c8;
            font-size:8.5px; letter-spacing:0.14em; font-weight:700; text-transform:uppercase;
            flex-shrink:0;
        }
        .fw-row-tagchips {
            display:inline-flex; gap:3px; flex-shrink:0;
        }
        .fw-row-tagchip {
            background:rgba(255,255,255,0.04);
            border:1px solid rgba(255,255,255,0.08);
            color:#888;
            font-size:8.5px; padding:1px 5px; border-radius:3px;
            font-weight:600;
        }
        .fw-row-tagchip-match {
            color:#7ac8c8; border-color:rgba(90,175,165,0.40);
            background:rgba(90,175,165,0.10); font-weight:700;
        }
        .fw-row-tagchip-more {
            color:#666; font-size:8.5px; padding:1px 4px; font-weight:700;
        }
        .fw-row-date {
            font-size:10px; color:#666; font-family:monospace;
            flex-shrink:0; min-width:74px; text-align:right;
        }

        /* ── Reader ───────────────────────────────────────────────── */
        .fw-reader {
            background:#0a0a0a; border:1px solid rgba(255,255,255,0.06);
            border-radius:6px; padding:20px 26px;
        }
        .fw-back {
            display:inline-flex; align-items:center; gap:6px;
            background:transparent; border:none; padding:6px 0;
            font-size:10px; letter-spacing:0.14em; font-weight:700;
            text-transform:uppercase; color:#888; font-family:inherit;
            cursor:pointer; margin-bottom:10px;
        }
        .fw-back:hover { color:#7ac8c8; }
        .fw-reader-head {
            display:flex; align-items:flex-start; gap:14px;
            padding-bottom:14px; margin-bottom:18px;
            border-bottom:1px solid rgba(255,255,255,0.06);
        }
        .fw-reader-head h1 {
            flex:1; margin:0;
            font-family:Georgia,serif; font-size:26px; color:#fff;
            font-weight:500; letter-spacing:-0.008em; line-height:1.2;
        }
        .fw-reader-tag {
            padding:5px 12px; border-radius:3px;
            background:rgba(90,175,165,0.08); border:1px solid rgba(90,175,165,0.3);
            color:#7ac8c8;
            font-size:9px; letter-spacing:0.14em; font-weight:700; text-transform:uppercase;
            flex-shrink:0; align-self:center;
        }
        .fw-reader-grid {
            display:flex; gap:24px; align-items:flex-start;
        }
        .fw-reader-body {
            flex:1; min-width:0;
            color:#d4d4d4; font-family:Georgia,serif;
            font-size:14px; line-height:1.8;
        }
        .fw-reader-body p { margin:0 0 12px; }
        .fw-reader-body b, .fw-reader-body strong { color:#fff; font-weight:600; }
        .fw-reader-body i, .fw-reader-body em { font-style:italic; }
        .fw-reader-body h1, .fw-reader-body h2, .fw-reader-body h3 {
            font-family:Georgia,serif; color:#fff; line-height:1.3;
            margin:18px 0 8px; font-weight:500;
        }
        .fw-reader-body h1 { font-size:22px; }
        .fw-reader-body h2 { font-size:18px; }
        .fw-reader-body h3 { font-size:16px; }
        .fw-reader-body ul, .fw-reader-body ol { margin:8px 0 8px 28px; }
        .fw-reader-body blockquote {
            margin:14px 0; padding:8px 16px;
            border-left:3px solid #5aafa5; color:#bbb; font-style:italic;
        }
        .fw-reader-body a, .fw-reader-body .wiki-link {
            color:#7ac8c8; text-decoration:underline;
        }
        .fw-reader-body .wiki-link-missing {
            color:#c87a7a; text-decoration:underline dotted;
        }
        .fw-reader-body img {
            max-width:100%; height:auto;
            margin:14px 0; border-radius:4px;
            border:1px solid rgba(90,175,165,0.25);
            display:block;
        }
        .fw-reader-infobox {
            flex:0 0 220px;
            background:#0d0d0d; border:1px solid rgba(255,255,255,0.06);
            border-radius:5px; padding:12px;
            font-size:11px; line-height:1.5; color:#bbb;
        }
        .fw-reader-infobox img,
        .fw-reader-infobox .wiki-infobox-image {
            max-width:100%; height:auto; border-radius:4px; margin-bottom:8px;
        }

        @media (max-width: 640px) {
            .fw-row { padding:10px 12px; gap:8px; }
            .fw-row-date { display:none; }
            .fw-row-tagchips { display:none; }
            .fw-reader { padding:16px 14px; }
            .fw-reader-grid { flex-direction:column; }
            .fw-reader-infobox { flex:1; width:100%; }
        }
    `;
    document.head.appendChild(s);
}

export async function mountWikiPane(hostEl, supabase) {
    if (!hostEl) return;
    ensureStyles();
    hostEl.innerHTML = '<div class="fw-loading">Loading wiki…</div>';

    let pages, existingSlugs, popularTags = [];
    try {
        pages = await fetchPageList(supabase);
        existingSlugs = new Set((pages || []).map(p => p.slug));
    } catch (e) {
        console.error('forum-wiki: fetch list failed', e);
        hostEl.innerHTML = `<div class="fw-empty">Failed to load wiki: ${escHtml(e?.message || e)}</div>`;
        return;
    }
    // Popular tags is best-effort — its absence shouldn't break the list.
    try { popularTags = await fetchPopularTags(supabase, 10); } catch (_) { popularTags = []; }

    // ── List view state ───────────────────────────────────────────
    let activeFilter = 'all';
    let searchTerm = '';
    let searchTags = [];

    renderList();

    function filterPages() {
        const needle = searchTerm.toLowerCase();
        return (pages || []).filter(p => {
            if (activeFilter !== 'all' && p.template_type !== activeFilter) return false;
            if (needle && !(p.title || '').toLowerCase().includes(needle)) return false;
            if (searchTags.length > 0) {
                const pageTags = p.tags || [];
                if (!searchTags.every(t => pageTags.includes(t))) return false;
            }
            return true;
        });
    }

    function renderList() {
        const filterBtns = ['all', ...TEMPLATE_TYPES].map(f => {
            const label = f === 'all' ? 'All' : titleCaseType(f);
            return `<button type="button" class="fw-filter-btn ${f === activeFilter ? 'active' : ''}" data-filter="${f}">${label}</button>`;
        }).join('');

        const tagChipsHtml = searchTags.map((t, i) =>
            `<span class="fw-tag-chip">#${escHtml(t)}<button type="button" class="fw-tag-chip-remove" data-tag-remove="${i}">×</button></span>`
        ).join('');

        const popularRow = popularTags.length
            ? `<div class="fw-toolbar-row">
                <span class="fw-toolbar-label">Popular</span>
                <div class="fw-popular-tags">
                    ${popularTags.map(pt =>
                        `<button type="button" class="fw-popular-tag" data-add-tag="${escHtml(pt.tag)}">#${escHtml(pt.tag)}<span class="fw-popular-tag-count">${pt.count}</span></button>`
                    ).join('')}
                </div>
            </div>`
            : '';

        const filtered = filterPages();
        const rowsHtml = filtered.length
            ? filtered.map(p => {
                const tag = p.template_type
                    ? `<span class="fw-row-tag">${escHtml(titleCaseType(p.template_type))}</span>`
                    : '';
                const pageTags = p.tags || [];
                const tagChips = pageTags.length
                    ? `<span class="fw-row-tagchips">${
                        pageTags.slice(0, 4).map(t =>
                            `<span class="fw-row-tagchip ${searchTags.includes(t) ? 'fw-row-tagchip-match' : ''}">#${escHtml(t)}</span>`
                        ).join('')
                    }${pageTags.length > 4 ? `<span class="fw-row-tagchip-more">+${pageTags.length - 4}</span>` : ''}</span>`
                    : '';
                const updated = p.updated_at
                    ? new Date(p.updated_at).toLocaleDateString()
                    : '';
                return `
                    <button class="fw-row" type="button" data-slug="${escHtml(p.slug)}">
                        <span class="fw-row-title">${escHtml(p.title)}</span>
                        ${tagChips}
                        ${tag}
                        <span class="fw-row-date">${escHtml(updated)}</span>
                    </button>
                `;
            }).join('')
            : `<div class="fw-empty">${
                searchTags.length > 0
                    ? 'No articles tagged with all of these tags. Try fewer tags.'
                    : searchTerm || activeFilter !== 'all'
                        ? 'No pages match the current filters.'
                        : 'No wiki entries yet.'
            }</div>`;

        hostEl.innerHTML = `
            <div class="fw-toolbar">
                <div class="fw-toolbar-row">
                    <input type="text" class="fw-search" id="fw-search" placeholder="Search pages…" value="${escHtml(searchTerm)}">
                    <a class="fw-btn" href="wiki.html" target="_blank" rel="noopener">Wiki Home</a>
                    <a class="fw-btn fw-btn-primary" href="wiki-edit.html?new=1" target="_blank" rel="noopener">New Page</a>
                </div>
                <div class="fw-filter-bar">${filterBtns}</div>
                <div class="fw-toolbar-row">
                    <div class="fw-tag-wrap">
                        ${tagChipsHtml}
                        <input type="text" class="fw-tag-input" id="fw-tag-input" placeholder="Filter by tag — #avelia #primeminister">
                    </div>
                </div>
                ${popularRow}
            </div>
            <div class="fw-list">${rowsHtml}</div>
        `;

        // Wire up search input — preserve cursor at end across re-renders.
        const searchInput = hostEl.querySelector('#fw-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchTerm = e.target.value;
                renderList();
            });
            if (searchTerm) {
                searchInput.focus();
                searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
            }
        }

        // Filter pill clicks.
        hostEl.querySelectorAll('.fw-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                activeFilter = btn.dataset.filter;
                renderList();
            });
        });

        // Tag chip remove + popular tag add.
        hostEl.querySelectorAll('.fw-tag-chip-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.tagRemove, 10);
                if (!Number.isNaN(idx)) {
                    searchTags.splice(idx, 1);
                    renderList();
                }
            });
        });
        hostEl.querySelectorAll('.fw-popular-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = normalizeTag(btn.dataset.addTag);
                if (tag && !searchTags.includes(tag)) {
                    searchTags.push(tag);
                    renderList();
                }
            });
        });

        // Tag input — Enter / comma / space commits a tag, Backspace pops.
        const tagInput = hostEl.querySelector('#fw-tag-input');
        if (tagInput) {
            tagInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                    e.preventDefault();
                    const tag = normalizeTag(tagInput.value);
                    if (tag && !searchTags.includes(tag)) {
                        searchTags.push(tag);
                        renderList();
                    } else {
                        tagInput.value = '';
                    }
                } else if (e.key === 'Backspace' && !tagInput.value && searchTags.length > 0) {
                    searchTags.pop();
                    renderList();
                }
            });
            tagInput.addEventListener('blur', () => {
                const tag = normalizeTag(tagInput.value);
                if (tag && !searchTags.includes(tag)) {
                    searchTags.push(tag);
                    renderList();
                }
            });
        }

        // Row clicks open inline reader.
        hostEl.querySelectorAll('.fw-row[data-slug]').forEach(btn => {
            btn.addEventListener('click', () => loadAndRenderPage(btn.dataset.slug));
        });
    }

    async function loadAndRenderPage(slug) {
        hostEl.innerHTML = '<div class="fw-loading">Loading page…</div>';
        let page;
        try {
            page = await fetchPage(supabase, slug);
        } catch (e) {
            console.error('forum-wiki: fetch page failed', e);
            hostEl.innerHTML = `<div class="fw-empty">Failed to load page: ${escHtml(e?.message || e)}</div>`;
            return;
        }
        if (!page) {
            hostEl.innerHTML = `<div class="fw-empty">Page "${escHtml(slug)}" not found. <button type="button" class="fw-back" style="display:inline-flex;margin-left:8px;">‹ Back</button></div>`;
            const back = hostEl.querySelector('.fw-back');
            if (back) back.addEventListener('click', renderList);
            return;
        }
        renderReader(page);
    }

    function renderReader(page) {
        const bodyHtml = renderWikiLinks(
            page.body || '<p><em>This page is empty.</em></p>',
            existingSlugs
        );
        const infobox = renderInfobox(page);
        const tag = page.template_type
            ? `<span class="fw-reader-tag">${escHtml(titleCaseType(page.template_type))}</span>`
            : '';
        hostEl.innerHTML = `
            <div class="fw-reader">
                <button class="fw-back" type="button">‹ Back to wiki list</button>
                <div class="fw-reader-head">
                    <h1>${escHtml(page.title)}</h1>
                    ${tag}
                </div>
                <div class="fw-reader-grid">
                    <div class="fw-reader-body">${bodyHtml}</div>
                    ${infobox ? `<aside class="fw-reader-infobox">${infobox}</aside>` : ''}
                </div>
            </div>
        `;
        const back = hostEl.querySelector('.fw-back');
        if (back) back.addEventListener('click', renderList);
        // Intercept clicks on existing wiki-links so navigation stays
        // inside the forum shell. Missing-link clicks fall through to
        // wiki.html (the standalone reader/editor) where the user can
        // create the target page.
        hostEl.querySelectorAll('.fw-reader-body .wiki-link').forEach(a => {
            a.addEventListener('click', (ev) => {
                ev.preventDefault();
                const href = a.getAttribute('href') || '';
                try {
                    const url = new URL(href, window.location.href);
                    const slug = url.searchParams.get('slug');
                    if (slug) loadAndRenderPage(slug);
                } catch (_) { /* malformed href; let the click do nothing */ }
            });
        });
    }
}
