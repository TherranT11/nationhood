// Forum Wiki pane — list + inline reader for wiki_pages.
//
// Single export: mountWikiPane(hostElement, supabaseClient). Replaces
// the host element's contents with a self-contained list/reader UI.
// Both politician-forum.html and entrepreneur-forum.html use it; the
// state machine (list view ↔ reader view) lives inside the function.
//
// Reuses the wiki rendering helpers already exported from js/wiki.js
// (fetchPageList, fetchPage, renderWikiLinks, renderInfobox) so the
// in-forum reader matches the standalone wiki.html reader byte-for-byte
// — same wiki-link processing, same infobox markup, same body
// rendering convention (no sanitization, matching the existing wiki
// trust model).
//
// Wiki-link clicks inside the reader are intercepted so navigation
// stays inside the forum shell. Missing-link clicks (slugs that
// don't exist yet) fall through to wiki.html so the user can land
// on the standalone editor surface for that slug.

import { fetchPageList, fetchPage, renderWikiLinks, renderInfobox } from './wiki.js';
import { escHtml } from './forum-utils.js';

const STYLE_ID = 'forum-wiki-styles';

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
        .fw-list {
            background:#0a0a0a; border:1px solid rgba(255,255,255,0.06);
            border-radius:6px; overflow:hidden;
        }
        .fw-row {
            width:100%;
            display:flex; align-items:center; gap:14px;
            padding:14px 22px;
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
            padding:3px 10px; border-radius:3px;
            background:rgba(90,175,165,0.08); border:1px solid rgba(90,175,165,0.25);
            color:#7ac8c8;
            font-size:8.5px; letter-spacing:0.14em; font-weight:700; text-transform:uppercase;
            flex-shrink:0;
        }

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
    `;
    document.head.appendChild(s);
}

export async function mountWikiPane(hostEl, supabase) {
    if (!hostEl) return;
    ensureStyles();
    hostEl.innerHTML = '<div class="fw-loading">Loading wiki…</div>';

    let pages, existingSlugs;
    try {
        pages = await fetchPageList(supabase);
        existingSlugs = new Set((pages || []).map(p => p.slug));
    } catch (e) {
        console.error('forum-wiki: fetch list failed', e);
        hostEl.innerHTML = `<div class="fw-empty">Failed to load wiki: ${escHtml(e?.message || e)}</div>`;
        return;
    }
    if (!pages || pages.length === 0) {
        hostEl.innerHTML = '<div class="fw-empty">No wiki entries yet.</div>';
        return;
    }

    renderList();

    function renderList() {
        const rows = pages.map(p => `
            <button class="fw-row" type="button" data-slug="${escHtml(p.slug)}">
                <span class="fw-row-title">${escHtml(p.title)}</span>
                ${p.template_type
                    ? `<span class="fw-row-tag">${escHtml(p.template_type)}</span>`
                    : ''}
            </button>
        `).join('');
        hostEl.innerHTML = `<div class="fw-list">${rows}</div>`;
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
            ? `<span class="fw-reader-tag">${escHtml(page.template_type)}</span>`
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
