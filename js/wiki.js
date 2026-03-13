// ===== WIKI SHARED UTILITIES =====

import { escapeHtml } from './utils.js';
import { _supabase } from './supabase-client.js';

// ===== WIKI TOP BAR & INIT =====

/** Render the minimal wiki-specific top bar (replaces the game top bar) */
export function renderWikiTopBar() {
    const topBar = document.getElementById('top-bar');
    if (!topBar) return;
    topBar.innerHTML = `
        <div class="wiki-top-bar">
            <a href="wiki.html" class="wiki-top-bar-brand">Nationhood Wiki</a>
            <div class="wiki-top-bar-right">
                <a href="dashboard.html" class="wiki-btn wiki-btn-return">Return to Game</a>
                <button class="theme-toggle-btn" onclick="window.__wikiToggleTheme()" id="theme-toggle"></button>
            </div>
        </div>
    `;
    updateWikiThemeButton();
}

function updateWikiThemeButton() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.textContent = document.body.classList.contains('light-mode') ? 'Dark' : 'Light';
}

window.__wikiToggleTheme = function() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('nationhood_theme', isLight ? 'light' : 'dark');
    updateWikiThemeButton();
};

/**
 * Initialize a wiki page. Works for both logged-in and anonymous users.
 * Returns { isLoggedIn, faction, nation } or { isLoggedIn: false, faction: null, nation: null }.
 * If requireAuth is true, redirects to login page if not authenticated.
 */
export async function initWikiPage({ requireAuth = false } = {}) {
    renderWikiTopBar();

    const { data: { user } } = await _supabase.auth.getUser();

    if (!user) {
        if (requireAuth) {
            window.location.href = 'login.html';
            return null;
        }
        return { isLoggedIn: false, faction: null, nation: null };
    }

    // Load faction and nation for logged-in users
    const { data: faction } = await _supabase
        .from('factions').select('*').eq('id', user.id).maybeSingle();

    let nation = null;
    if (faction && faction.nation_id) {
        const { data: nationData } = await _supabase
            .from('nations').select('*').eq('id', faction.nation_id).maybeSingle();
        nation = nationData;
    }

    return { isLoggedIn: true, faction, nation };
}

/**
 * Render the persistent wiki search bar. Call after the page content is set up.
 * Inserts a search bar at the top of the wiki-root container.
 */
export async function renderWikiSearchBar(container) {
    const searchBarHtml = `
        <div class="wiki-global-search" id="wiki-global-search">
            <input type="text" class="wiki-search-input wiki-global-search-input" id="wiki-global-search-input" placeholder="Search wiki pages...">
            <div class="wiki-search-dropdown" id="wiki-global-search-results"></div>
        </div>
    `;
    container.insertAdjacentHTML('afterbegin', searchBarHtml);

    // Load page list for search
    let allPages = [];
    try {
        allPages = await fetchPageList(_supabase);
    } catch (_) {}

    const searchInput = document.getElementById('wiki-global-search-input');
    const searchResults = document.getElementById('wiki-global-search-results');

    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) { searchResults.innerHTML = ''; searchResults.style.display = 'none'; return; }
        const matches = allPages.filter(p => p.title.toLowerCase().includes(q)).slice(0, 8);
        if (!matches.length) {
            searchResults.innerHTML = `<div class="wiki-search-item wiki-search-empty">No pages match "${escapeHtml(q)}"</div>`;
        } else {
            searchResults.innerHTML = matches.map(p =>
                `<a href="wiki.html?slug=${encodeURIComponent(p.slug)}" class="wiki-search-item">${escapeHtml(p.title)}${p.template_type ? ` <span class="wiki-page-row-type">${escapeHtml(p.template_type)}</span>` : ''}</a>`
            ).join('');
        }
        searchResults.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

/** Convert a page title to a URL-safe slug */
export function slugify(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Replace [[Page Name]] wiki-links in HTML with <a> tags.
 * Links to missing pages get class="wiki-link-missing".
 */
export function renderWikiLinks(html, existingSlugs) {
    return html.replace(/\[\[([^\]]+)\]\]/g, (match, pageName) => {
        const slug = slugify(pageName);
        const exists = existingSlugs.has(slug);
        const cls = exists ? 'wiki-link' : 'wiki-link-missing';
        const href = exists
            ? `wiki.html?slug=${encodeURIComponent(slug)}`
            : `wiki-edit.html?new=1&title=${encodeURIComponent(pageName.trim())}`;
        return `<a href="${href}" class="${cls}">${escapeHtml(pageName.trim())}</a>`;
    });
}

/** Upload an image to the wiki-images bucket and return the public URL */
export async function uploadWikiImage(supabase, nationId, file) {
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `${nationId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
        .from('wiki-images')
        .upload(filePath, file, { contentType: file.type, upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('wiki-images').getPublicUrl(filePath);
    return data?.publicUrl || null;
}

/** Fetch a single wiki page by slug (global — no nation filter) */
export async function fetchPage(supabase, slug) {
    const { data, error } = await supabase
        .from('wiki_pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
    if (error) throw error;
    return data;
}

/** Fetch all wiki pages (lightweight — no body) */
export async function fetchPageList(supabase) {
    const { data, error } = await supabase
        .from('wiki_pages')
        .select('id, slug, title, template_type, updated_at, updated_by, created_by, locked_by')
        .order('title', { ascending: true });
    if (error) throw error;
    return data || [];
}

/** Fetch the set of existing slugs for link colouring */
export async function fetchExistingSlugs(supabase) {
    const { data, error } = await supabase
        .from('wiki_pages')
        .select('slug');
    if (error) throw error;
    return new Set((data || []).map(r => r.slug));
}

/** Fetch faction names for a set of faction IDs */
export async function fetchFactionNames(supabase, factionIds) {
    const ids = [...new Set(factionIds.filter(Boolean))];
    if (!ids.length) return {};
    const { data, error } = await supabase
        .from('factions')
        .select('id, faction_name')
        .in('id', ids);
    if (error) return {};
    const map = {};
    (data || []).forEach(f => { map[f.id] = f.faction_name; });
    return map;
}

/** Build infobox HTML for the reader view */
export function renderInfobox(page) {
    if (!page.template_type) return '';
    const rows = Array.isArray(page.template_data) ? page.template_data : [];
    const imageHtml = page.infobox_image
        ? `<img class="wiki-infobox-image" src="${escapeHtml(page.infobox_image)}" alt="${escapeHtml(page.title)}">`
        : '';
    const typeLabel = page.template_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
