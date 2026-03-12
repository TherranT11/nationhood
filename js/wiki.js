// ===== WIKI SHARED UTILITIES =====

import { escapeHtml } from './utils.js';

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

/** Fetch a single wiki page by slug */
export async function fetchPage(supabase, nationId, slug) {
    const { data, error } = await supabase
        .from('wiki_pages')
        .select('*')
        .eq('nation_id', nationId)
        .eq('slug', slug)
        .maybeSingle();
    if (error) throw error;
    return data;
}

/** Fetch all wiki pages for a nation (lightweight — no body) */
export async function fetchPageList(supabase, nationId) {
    const { data, error } = await supabase
        .from('wiki_pages')
        .select('id, slug, title, template_type, updated_at, updated_by, created_by, locked_by')
        .eq('nation_id', nationId)
        .order('title', { ascending: true });
    if (error) throw error;
    return data || [];
}

/** Fetch the set of existing slugs for link colouring */
export async function fetchExistingSlugs(supabase, nationId) {
    const { data, error } = await supabase
        .from('wiki_pages')
        .select('slug')
        .eq('nation_id', nationId);
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
    const typeLabel = page.template_type.charAt(0).toUpperCase() + page.template_type.slice(1);
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
