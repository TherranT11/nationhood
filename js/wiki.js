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
    // Try with tags column first; fall back without it if column doesn't exist yet
    let result = await supabase
        .from('wiki_pages')
        .select('id, slug, title, template_type, updated_at, updated_by, created_by, locked_by, tags')
        .order('title', { ascending: true });
    if (result.error) {
        // tags column may not exist yet — retry without it
        result = await supabase
            .from('wiki_pages')
            .select('id, slug, title, template_type, updated_at, updated_by, created_by, locked_by')
            .order('title', { ascending: true });
        if (result.error) throw result.error;
    }
    return result.data || [];
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

// ===== TAG SYSTEM =====

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 32;

/** Normalize a tag: lowercase, strip # prefix, trim, remove invalid chars */
function normalizeTag(raw) {
    return raw.replace(/^#/, '').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '').slice(0, MAX_TAG_LENGTH);
}

/**
 * Create a reusable tag input component.
 * Returns { container, getTags, setTags, onTagsChange }.
 * @param {object} opts - { initialTags: string[], placeholder: string, onTagsChange: fn }
 */
export function createTagInput(opts = {}) {
    const { initialTags = [], placeholder = 'add tag...', onTagsChange } = opts;
    const tags = [...initialTags];
    const tagCounts = {}; // tag -> usage_count (0 = new)

    // Outer section box (matches infobox editor style)
    const section = document.createElement('div');
    section.className = 'wiki-tag-section';

    const header = document.createElement('div');
    header.className = 'wiki-infobox-editor-title';
    header.textContent = 'Tags';
    section.appendChild(header);

    const container = document.createElement('div');
    container.className = 'wiki-tag-container';
    section.appendChild(container);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'wiki-tag-input';
    input.placeholder = placeholder;

    const autocomplete = document.createElement('div');
    autocomplete.className = 'wiki-tag-autocomplete';
    autocomplete.style.display = 'none';

    // Look up usage count for a single tag
    async function lookupTagCount(tag) {
        if (tag in tagCounts) return tagCounts[tag];
        try {
            const { data } = await _supabase.rpc('get_tag_suggestions', { prefix_query: tag, max_results: 20 });
            if (data) {
                const match = data.find(d => d.tag === tag);
                tagCounts[tag] = match ? match.usage_count : 0;
            } else {
                tagCounts[tag] = 0;
            }
        } catch (_) {
            tagCounts[tag] = 0;
        }
        return tagCounts[tag];
    }

    function renderChips() {
        container.querySelectorAll('.wiki-tag-chip').forEach(c => c.remove());
        tags.forEach((tag, i) => {
            const chip = document.createElement('span');
            chip.className = 'wiki-tag-chip';
            const count = tagCounts[tag];
            const badge = count !== undefined
                ? (count > 0
                    ? `<span class="wiki-tag-badge wiki-tag-badge-existing">(${count})</span>`
                    : '<span class="wiki-tag-badge wiki-tag-badge-new">new</span>')
                : '';
            chip.innerHTML = `#${escapeHtml(tag)}${badge}<button class="wiki-tag-chip-remove" data-index="${i}" type="button">&times;</button>`;
            container.insertBefore(chip, input);
        });
    }

    async function addTag(raw) {
        const tag = normalizeTag(raw);
        if (!tag) return;
        if (tags.includes(tag)) return;
        if (tags.length >= MAX_TAGS) return;
        tags.push(tag);
        input.value = '';
        autocomplete.style.display = 'none';
        renderChips();
        await lookupTagCount(tag);
        renderChips();
        if (onTagsChange) onTagsChange([...tags]);
    }

    function removeTag(index) {
        tags.splice(index, 1);
        renderChips();
        if (onTagsChange) onTagsChange([...tags]);
    }

    // Clicking container focuses input
    container.addEventListener('click', (e) => {
        if (e.target === container) input.focus();
    });

    // Remove button
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('wiki-tag-chip-remove')) {
            removeTag(parseInt(e.target.dataset.index, 10));
        }
    });

    // Key handling
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
            e.preventDefault();
            addTag(input.value);
        } else if (e.key === 'Backspace' && !input.value && tags.length > 0) {
            removeTag(tags.length - 1);
        } else if (e.key === 'Escape') {
            autocomplete.style.display = 'none';
        } else if (e.key === 'ArrowDown' && autocomplete.style.display !== 'none') {
            e.preventDefault();
            const first = autocomplete.querySelector('.wiki-tag-autocomplete-item');
            if (first) first.focus();
        }
    });

    // Blur commits current input
    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (input.value.trim()) addTag(input.value);
            autocomplete.style.display = 'none';
        }, 150);
    });

    // Autocomplete on input
    let autocompleteTimeout;
    input.addEventListener('input', () => {
        clearTimeout(autocompleteTimeout);
        const val = normalizeTag(input.value);
        if (val.length < 2) {
            autocomplete.style.display = 'none';
            return;
        }
        autocompleteTimeout = setTimeout(() => fetchTagSuggestions(val), 200);
    });

    async function fetchTagSuggestions(prefix) {
        try {
            const { data } = await _supabase.rpc('get_tag_suggestions', { prefix_query: prefix, max_results: 8 });
            if (data) data.forEach(d => { tagCounts[d.tag] = d.usage_count; });

            const filtered = (data || []).filter(d => !tags.includes(d.tag));
            let html = filtered.map(d => `<div class="wiki-tag-autocomplete-item" data-tag="${escapeHtml(d.tag)}">
                    <span>#${escapeHtml(d.tag)}</span>
                    <span class="wiki-tag-autocomplete-count">(${d.usage_count}) pages</span>
                </div>`).join('');

            // If exact typed value doesn't match any result, offer as "new"
            const exactMatch = (data || []).find(d => d.tag === prefix);
            if (!exactMatch && !tags.includes(prefix)) {
                html += `<div class="wiki-tag-autocomplete-item wiki-tag-autocomplete-new" data-tag="${escapeHtml(prefix)}">
                    <span>#${escapeHtml(prefix)}</span>
                    <span class="wiki-tag-autocomplete-count wiki-tag-badge-new">new tag</span>
                </div>`;
            }

            autocomplete.innerHTML = html;
            autocomplete.style.display = html ? 'block' : 'none';
        } catch (_) {
            // RPC may not exist — show "new tag" for anything typed
            const prefix2 = normalizeTag(input.value);
            if (prefix2 && !tags.includes(prefix2)) {
                autocomplete.innerHTML = `<div class="wiki-tag-autocomplete-item wiki-tag-autocomplete-new" data-tag="${escapeHtml(prefix2)}">
                    <span>#${escapeHtml(prefix2)}</span>
                    <span class="wiki-tag-autocomplete-count wiki-tag-badge-new">new tag</span>
                </div>`;
                autocomplete.style.display = 'block';
            } else {
                autocomplete.style.display = 'none';
            }
        }
    }

    autocomplete.addEventListener('click', (e) => {
        const item = e.target.closest('.wiki-tag-autocomplete-item');
        if (item) {
            addTag(item.dataset.tag);
            input.focus();
        }
    });

    container.appendChild(input);
    container.style.position = 'relative';
    container.appendChild(autocomplete);

    // Load counts for initial tags then render badges
    renderChips();
    if (tags.length > 0) {
        Promise.all(tags.map(t => lookupTagCount(t))).then(() => renderChips());
    }

    return {
        container: section,
        getTags: () => [...tags],
        setTags: (newTags) => {
            tags.length = 0;
            newTags.forEach(t => {
                const n = normalizeTag(t);
                if (n && !tags.includes(n) && tags.length < MAX_TAGS) tags.push(n);
            });
            renderChips();
            Promise.all(tags.map(t => lookupTagCount(t))).then(() => renderChips());
        }
    };
}

/**
 * Create a tag search component for the wiki-list page.
 * Returns { container, getSearchTags }.
 * @param {object} opts - { onSearch: fn(tags[]), popularTags: [{tag, count}] }
 */
export function createTagSearch(opts = {}) {
    const { onSearch, popularTags = [] } = opts;
    const searchTags = [];

    const section = document.createElement('div');
    section.className = 'wiki-tag-search';

    const wrap = document.createElement('div');
    wrap.className = 'wiki-tag-search-input-wrap';
    wrap.style.position = 'relative';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'wiki-tag-search-input';
    input.placeholder = 'Search by tag — #avelia #primeminister';

    const autocomplete = document.createElement('div');
    autocomplete.className = 'wiki-tag-autocomplete';
    autocomplete.style.display = 'none';

    function renderChips() {
        wrap.querySelectorAll('.wiki-tag-chip').forEach(c => c.remove());
        searchTags.forEach((tag, i) => {
            const chip = document.createElement('span');
            chip.className = 'wiki-tag-chip';
            chip.innerHTML = `#${escapeHtml(tag)}<button class="wiki-tag-chip-remove" data-index="${i}" type="button">&times;</button>`;
            wrap.insertBefore(chip, input);
        });
    }

    function addTag(raw) {
        const tag = normalizeTag(raw);
        if (!tag || searchTags.includes(tag)) return;
        searchTags.push(tag);
        renderChips();
        input.value = '';
        autocomplete.style.display = 'none';
        if (onSearch) onSearch([...searchTags]);
    }

    function removeTag(index) {
        searchTags.splice(index, 1);
        renderChips();
        if (onSearch) onSearch([...searchTags]);
    }

    wrap.addEventListener('click', (e) => {
        if (e.target === wrap) input.focus();
        if (e.target.classList.contains('wiki-tag-chip-remove')) {
            removeTag(parseInt(e.target.dataset.index, 10));
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
            e.preventDefault();
            addTag(input.value);
        } else if (e.key === 'Backspace' && !input.value && searchTags.length > 0) {
            removeTag(searchTags.length - 1);
        } else if (e.key === 'Escape') {
            autocomplete.style.display = 'none';
        }
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (input.value.trim()) addTag(input.value);
            autocomplete.style.display = 'none';
        }, 150);
    });

    let autocompleteTimeout;
    input.addEventListener('input', () => {
        clearTimeout(autocompleteTimeout);
        const val = normalizeTag(input.value);
        if (val.length < 2) { autocomplete.style.display = 'none'; return; }
        autocompleteTimeout = setTimeout(async () => {
            try {
                const { data } = await _supabase.rpc('get_tag_suggestions', { prefix_query: val, max_results: 8 });
                if (!data || data.length === 0) { autocomplete.style.display = 'none'; return; }
                autocomplete.innerHTML = data
                    .filter(d => !searchTags.includes(d.tag))
                    .map(d => `<div class="wiki-tag-autocomplete-item" data-tag="${escapeHtml(d.tag)}">
                        <span>#${escapeHtml(d.tag)}</span>
                        <span class="wiki-tag-autocomplete-count">${d.usage_count}</span>
                    </div>`).join('');
                autocomplete.style.display = autocomplete.innerHTML ? 'block' : 'none';
            } catch (_) { autocomplete.style.display = 'none'; }
        }, 200);
    });

    autocomplete.addEventListener('click', (e) => {
        const item = e.target.closest('.wiki-tag-autocomplete-item');
        if (item) { addTag(item.dataset.tag); input.focus(); }
    });

    wrap.appendChild(input);
    wrap.appendChild(autocomplete);
    section.appendChild(wrap);

    // Popular tags row
    if (popularTags.length > 0) {
        const popRow = document.createElement('div');
        popRow.className = 'wiki-popular-tags';
        popularTags.forEach(pt => {
            const btn = document.createElement('button');
            btn.className = 'wiki-popular-tag';
            btn.type = 'button';
            btn.innerHTML = `#${escapeHtml(pt.tag)}<span class="wiki-popular-tag-count">${pt.count}</span>`;
            btn.addEventListener('click', () => { addTag(pt.tag); input.focus(); });
            popRow.appendChild(btn);
        });
        section.appendChild(popRow);
    }

    return {
        container: section,
        getSearchTags: () => [...searchTags]
    };
}

/** Fetch popular tags (top N most-used across all articles) */
export async function fetchPopularTags(supabase, limit = 10) {
    try {
        const { data } = await supabase.rpc('get_popular_tags', { max_results: limit });
        return data || [];
    } catch (_) {
        // RPC may not exist — fallback to manual query
        try {
            const { data } = await supabase
                .from('wiki_pages')
                .select('tags')
                .not('tags', 'eq', '{}');
            if (!data) return [];
            const counts = {};
            data.forEach(row => {
                (row.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; });
            });
            return Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([tag, count]) => ({ tag, count }));
        } catch (_2) { return []; }
    }
}

/** Render read-only tag chips (for wiki.html reader view) */
export function renderTagDisplay(tags) {
    if (!tags || tags.length === 0) return '';
    const chips = tags.map(t =>
        `<a href="wiki-list.html?tags=${encodeURIComponent(t)}" class="wiki-tag-chip">#${escapeHtml(t)}</a>`
    ).join('');
    return `<div class="wiki-tag-display">${chips}</div>`;
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
