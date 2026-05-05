#!/usr/bin/env node
/**
 * generate-wiki-pages.js
 *
 * Static generator for the Nationhood wiki. Reads every active row in
 * `wiki_pages` from Supabase and writes one `wiki-SLUG.html` per page
 * into the Vite build output (`dist/`).
 *
 * Why static: GitHub Pages serves static files. The dynamic
 * `wiki.html?slug=foo` viewer ships a loading spinner and a generic
 * <title> to anyone who fetches it without executing JS — so link
 * previews, search engines, AI tools, social-media unfurlers, and
 * anything else that doesn't run JS see nothing but the spinner. The
 * static files generated here have the page content in the HTML body,
 * a real per-page <title>, and Open Graph tags — so external readers
 * can actually read the wiki.
 *
 * The dynamic viewer at wiki.html?slug=foo stays in place for live
 * editing and in-app navigation. Static files are the canonical
 * public URL surface.
 *
 * Runs once per deploy (added to .github/workflows/deploy.yml between
 * `npx vite build` and the page-artifact upload). Can also be invoked
 * out-of-band by the trigger-wiki-rebuild edge function so a player
 * edit refreshes static pages within minutes (next commit).
 *
 * Reads via the Supabase anon key — relies on the
 * `wiki_pages_anon_select` RLS policy (migration 20260313_wiki_public_read).
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
    escapeHtml,
    renderWikiLinks,
    renderInfobox,
    renderTagDisplay,
    bodyExcerpt,
} from '../js/wiki-render.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
    || process.env.SUPABASE_URL
    || 'https://pbumjalxclmegzckhqqr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
    || process.env.SUPABASE_ANON_KEY
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBidW1qYWx4Y2xtZWd6Y2tocXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODk0NTUsImV4cCI6MjA4NTM2NTQ1NX0.ykjUqdJbwF3yliond1Vz2lcNQZCWA-5SnviruXm4ypI';

const OUT_DIR = path.resolve(process.cwd(), 'dist');
const SITE_URL = 'https://nationhoodgame.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Static-page URL builder for wikilinks. Generator emits links to the
// pre-rendered static HTML; the browser's dynamic viewer would use
// `wiki.html?slug=SLUG` instead and pass its own builder.
const staticUrlForSlug = (slug) => `wiki-${encodeURIComponent(slug)}.html`;

function renderPageHtml(page, existingSlugs, factionNames) {
    const title = page.title || page.slug;
    const description = bodyExcerpt(page.body, 200) || `Wiki page on ${title}.`;
    const canonical = `${SITE_URL}/wiki-${encodeURIComponent(page.slug)}.html`;
    const ogImage = page.infobox_image || '';

    const bodyHtml = renderWikiLinks(page.body || '<p><em>This page is empty.</em></p>', existingSlugs, staticUrlForSlug);
    const infoboxHtml = renderInfobox(page);
    const tagsHtml = renderTagDisplay(page.tags);

    const createdName = factionNames[page.created_by] || null;
    const updatedName = factionNames[page.updated_by] || null;
    const attribution = (createdName || updatedName)
        ? `<div class="wiki-attribution">
            ${createdName ? `<span>Created by ${escapeHtml(createdName)}</span>` : ''}
            ${updatedName && updatedName !== createdName ? `<span> · Last edited by ${escapeHtml(updatedName)}</span>` : ''}
        </div>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — Nationhood Wiki</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonical)}">
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : ''}
<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
<link rel="stylesheet" href="css/dashboard.css">
<link rel="stylesheet" href="css/wiki.css">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
<div id="top-bar">
    <div class="wiki-top-bar">
        <a href="wiki.html" class="wiki-top-bar-brand">Nationhood Wiki</a>
        <div class="wiki-top-bar-right">
            <a href="dashboard.html" class="wiki-btn wiki-btn-return">Return to Game</a>
        </div>
    </div>
</div>
<div class="wiki-container">
    <article class="wiki-page">
        ${infoboxHtml}
        <header class="wiki-page-header">
            <h1>${escapeHtml(title)}</h1>
            ${tagsHtml}
            ${attribution}
        </header>
        <div class="wiki-page-body">
            ${bodyHtml}
        </div>
        <footer class="wiki-page-footer">
            <a href="wiki.html?slug=${encodeURIComponent(page.slug)}" class="wiki-btn">View / Edit Live</a>
            <a href="wiki-list.html" class="wiki-btn">All Pages</a>
        </footer>
    </article>
</div>
</body>
</html>
`;
}

async function main() {
    console.log(`[wiki-gen] Connecting to ${SUPABASE_URL}`);

    const { data: pages, error: pagesErr } = await supabase
        .from('wiki_pages')
        .select('id, slug, title, body, template_type, template_data, infobox_image, tags, created_by, updated_by, updated_at');
    if (pagesErr) {
        console.error('[wiki-gen] Failed to fetch wiki_pages:', pagesErr.message);
        process.exit(1);
    }
    if (!pages || pages.length === 0) {
        console.log('[wiki-gen] No wiki pages found — nothing to generate.');
        return;
    }
    console.log(`[wiki-gen] Found ${pages.length} pages.`);

    const existingSlugs = new Set(pages.map(p => p.slug).filter(Boolean));

    const factionIds = Array.from(new Set(
        pages.flatMap(p => [p.created_by, p.updated_by]).filter(Boolean)
    ));
    let factionNames = {};
    if (factionIds.length > 0) {
        const { data: factions, error: factionsErr } = await supabase
            .from('factions').select('id, faction_name').in('id', factionIds);
        if (factionsErr) {
            console.warn('[wiki-gen] Faction fetch failed (attribution will be missing):', factionsErr.message);
        } else {
            factionNames = Object.fromEntries((factions || []).map(f => [f.id, f.faction_name]));
        }
    }

    await fs.mkdir(OUT_DIR, { recursive: true });

    let written = 0;
    for (const page of pages) {
        if (!page.slug) {
            console.warn(`[wiki-gen] Skipping page id=${page.id} — no slug.`);
            continue;
        }
        const html = renderPageHtml(page, existingSlugs, factionNames);
        const fileName = `wiki-${page.slug}.html`;
        await fs.writeFile(path.join(OUT_DIR, fileName), html, 'utf8');
        written++;
    }
    console.log(`[wiki-gen] Wrote ${written} static wiki pages to ${OUT_DIR}/`);
}

main().catch(err => {
    console.error('[wiki-gen] Fatal:', err);
    process.exit(1);
});
