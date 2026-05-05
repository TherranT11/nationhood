/**
 * wiki-render.js — pure rendering helpers for the wiki.
 *
 * No DOM, no Supabase, no fetch. Safe to import from both the browser
 * (as a module) and from Node (the static-page build script).
 *
 * The browser-side dynamic viewer in js/wiki.js currently has its
 * own copies of slugify / renderInfobox / renderTagDisplay /
 * renderWikiLinks. Those should converge to import from this module
 * as well — left as a follow-up so the in-app viewer's behavior
 * doesn't shift in the same commit that introduces the shared
 * surface. Until then, KEEP THE TWO IN SYNC: any change to a
 * renderer here should mirror the equivalent change in js/wiki.js,
 * and vice versa.
 */

/**
 * Escape the five characters that can break HTML parsing in any
 * context (text node, attribute value, etc.). Stricter than the
 * browser's textContent-based escape — this version is safe inside
 * attribute values too.
 */
export function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Mirrors the slug rules the in-app editor uses. Lowercase, strip
 * apostrophes/quotes, replace runs of non-alphanumerics with single
 * dashes, trim leading/trailing dashes.
 */
export function slugify(s) {
    return String(s || '')
        .toLowerCase()
        .trim()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Resolve [[Page Name]] wikilinks inside an HTML body. Caller
 * supplies a urlBuilder that decides what href to emit for a known
 * slug — the generator uses `wiki-SLUG.html` (static URL); the
 * browser would use `wiki.html?slug=SLUG`. Unknown slugs route to
 * `wiki-edit.html?new=1&title=NAME` so editors can author the page.
 *
 * @param {string} html — raw page body, may contain HTML.
 * @param {Set<string>} existingSlugs — slugs that exist as pages.
 * @param {(slug: string) => string} urlBuilder — known-slug href resolver.
 */
export function renderWikiLinks(html, existingSlugs, urlBuilder) {
    return String(html || '').replace(/\[\[([^\]]+)\]\]/g, (match, pageName) => {
        const slug = slugify(pageName);
        const exists = existingSlugs.has(slug);
        const cls = exists ? 'wiki-link' : 'wiki-link-missing';
        const href = exists
            ? urlBuilder(slug)
            : `wiki-edit.html?new=1&title=${encodeURIComponent(pageName.trim())}`;
        return `<a href="${href}" class="${cls}">${escapeHtml(pageName.trim())}</a>`;
    });
}

/**
 * Wikipedia-style infobox: optional image, title, type label,
 * and a key/value table from template_data rows.
 */
export function renderInfobox(page) {
    if (!page.template_type) return '';
    const rows = Array.isArray(page.template_data) ? page.template_data : [];
    const imageHtml = page.infobox_image
        ? `<img class="wiki-infobox-image" src="${escapeHtml(page.infobox_image)}" alt="${escapeHtml(page.title)}">`
        : '';
    const typeLabel = String(page.template_type)
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    const rowsHtml = rows.map(r =>
        `<tr><td>${escapeHtml(r.label || '')}</td><td>${escapeHtml(r.value || '')}</td></tr>`
    ).join('');
    return `
        <aside class="wiki-infobox">
            ${imageHtml}
            <div class="wiki-infobox-title">${escapeHtml(page.title)}</div>
            <div class="wiki-infobox-type">${escapeHtml(typeLabel)}</div>
            ${rowsHtml ? `<table class="wiki-infobox-table">${rowsHtml}</table>` : ''}
        </aside>
    `;
}

/**
 * Tag chips beneath the page title. Each chip links to the wiki
 * list page filtered by that tag.
 */
export function renderTagDisplay(tags) {
    if (!tags || tags.length === 0) return '';
    const chips = tags.map(t =>
        `<a href="wiki-list.html?tags=${encodeURIComponent(t)}" class="wiki-tag-chip">#${escapeHtml(t)}</a>`
    ).join('');
    return `<div class="wiki-tag-display">${chips}</div>`;
}

/**
 * Strip HTML + collapse whitespace, then truncate. Used for
 * <meta description> and og:description so link previews show real
 * page content instead of "Loading wiki..." or the full body.
 */
export function bodyExcerpt(html, max = 200) {
    const text = String(html || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    if (text.length <= max) return text;
    return text.slice(0, max - 1).trimEnd() + '…';
}
