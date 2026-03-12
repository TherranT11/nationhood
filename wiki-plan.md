# Wiki Feature Implementation Plan

## Overview
Add a wiki system (wiki.html, wiki-edit.html, wiki-list.html) to Nationhood. Players can create/edit pages with rich text, images, inter-page links, and Wikipedia-style infobox templates with an image and editable key-value table rows.

---

## Phase 1: Database & Storage

### 1a. Create `wiki_pages` table
```sql
CREATE TABLE IF NOT EXISTS wiki_pages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID NOT NULL REFERENCES nations(id),
    slug            TEXT NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT NOT NULL DEFAULT '',
    template_type   TEXT,  -- NULL, 'nation', 'person', 'corporation', 'religion', 'culture'
    template_data   JSONB DEFAULT '[]'::JSONB,  -- array of {label, value} rows for infobox
    infobox_image   TEXT,  -- Supabase Storage public URL for the infobox header image
    created_by      UUID REFERENCES factions(id),
    updated_by      UUID REFERENCES factions(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(nation_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_nation ON wiki_pages(nation_id);
CREATE INDEX IF NOT EXISTS idx_wiki_pages_slug ON wiki_pages(nation_id, slug);
```

Key decisions:
- `slug` is the URL-friendly page identifier (e.g. "smith-city"), unique per nation
- `template_data` is a JSONB array of `{label, value}` objects — players add/remove rows freely (like Wikipedia infobox: "Capital: Smith City", "Population: 12M")
- `infobox_image` stores the Supabase Storage public URL
- No version history (per requirement)

### 1b. Supabase Storage bucket
- Bucket: `wiki-images` (public read)
- Path format: `{nation_id}/{page_id}/{timestamp}.{ext}`
- Auth: uploads require authenticated user (same pattern as party logo uploads in politics.js)

### 1c. RLS policies
```sql
ALTER TABLE wiki_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY wiki_pages_select ON wiki_pages
    FOR SELECT TO authenticated
    USING (nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid()));

CREATE POLICY wiki_pages_insert ON wiki_pages
    FOR INSERT TO authenticated
    WITH CHECK (nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid()));

CREATE POLICY wiki_pages_update ON wiki_pages
    FOR UPDATE TO authenticated
    USING (nation_id IN (SELECT nation_id FROM factions WHERE id = auth.uid()));
```

---

## Phase 2: Navigation

### 2a. Add Wiki tab to nav bar
**File:** `js/common.js` (~line 348, inside `renderNavTabs`)

Add after the Events entry:
```javascript
{ id: 'wiki', label: 'Wiki', href: 'wiki.html' }
```

---

## Phase 3: HTML Pages

All three pages follow the existing pattern: `dashboard.css` + `css/wiki.css`, `initPage('wiki', callback)`.

### 3a. `wiki.html` — Page Reader
- URL params: `?slug=home` (defaults to "home")
- Renders page title, body (HTML from Quill), and infobox sidebar if template is set
- `[[Page Name]]` in body rendered as `<a href="wiki.html?slug=page-name">` — red-styled if target doesn't exist
- "Edit" button → `wiki-edit.html?slug=...`
- "All Pages" button → `wiki-list.html`
- If page doesn't exist: "This page doesn't exist yet" + "Create it" link

### 3b. `wiki-edit.html` — Page Editor
- URL params: `?slug=...` (edit) or `?new=1&title=Foo` (create with optional pre-filled title from red link)
- **Title field** — text input, auto-generates slug on create
- **Template type dropdown** — None, Nation, Person, Corporation, Religion, Culture
- **Infobox section** (visible when template selected):
  - Image upload button → uploads to `wiki-images` bucket, shows preview
  - Editable key-value table: each row = label input + value input + delete button
  - "Add Row" button appends new row
- **Body editor** — Quill.js (CDN, ~40KB), toolbar: bold, italic, headers, lists, links, image embed
  - Image button triggers Storage upload, inserts URL into editor
  - `[[Page Name]]` typed as plain text, converted to links at render time in wiki.html
- **Save** — upserts to `wiki_pages`
- **Delete** — shown on existing pages, confirms before deleting

### 3c. `wiki-list.html` — Page Index
- Lists all wiki pages for current nation
- Filter by template type (All / Nation / Person / Corporation / Religion / Culture)
- Search box filters by title
- Each row: title, template type badge, last updated, updated by faction
- "New Page" button → `wiki-edit.html?new=1`

---

## Phase 4: CSS — `css/wiki.css`
- Reader layout: content area + infobox sidebar (flexbox, sidebar right)
- Infobox card: bordered box, image at top, key-value table below (Wikipedia-style)
- Red links for missing pages: `a.wiki-link-missing { color: #cc3333; }`
- Editor form: consistent with existing game forms
- Responsive: infobox stacks below on mobile
- Page list: table/card layout matching existing game tables

---

## Phase 5: JavaScript — `js/wiki.js`
Shared utilities:
- `slugify(title)` — title → URL slug
- `renderWikiLinks(html, existingSlugs)` — replaces `[[Page Name]]` with `<a>` tags (red if missing)
- `uploadWikiImage(supabase, nationId, pageId, file)` — uploads to wiki-images bucket, returns public URL
- `fetchPage(supabase, nationId, slug)` — single page query
- `fetchPageList(supabase, nationId)` — all pages for nation (list + link existence checks)

---

## Phase 6: Home Page Seed
When visiting `wiki.html` and no "home" page exists, show welcome message + "Create Home Page" button → `wiki-edit.html?new=1&title=Home`

---

## Files Created/Modified

| Action | File |
|--------|------|
| **Create** | `sql/migrations/20260312_wiki_pages.sql` |
| **Create** | `wiki.html` |
| **Create** | `wiki-edit.html` |
| **Create** | `wiki-list.html` |
| **Create** | `css/wiki.css` |
| **Create** | `js/wiki.js` |
| **Modify** | `js/common.js` (add Wiki nav tab after Events) |

No vite.config.js changes needed — it auto-discovers HTML files.

## External Dependencies
- **Quill.js** — CDN load (`https://cdn.quilljs.com/1.3.7/quill.min.js` + CSS). Rich text editor with image support. No npm install.

---

## Verification Steps
1. Nav bar shows "Wiki" tab after "Events" on all pages
2. Create a new page from wiki-list.html — saves and displays
3. Edit existing page — changes persist
4. Upload infobox image — appears in sidebar
5. Add/remove infobox table rows — save correctly
6. Type `[[Some Page]]` in body — renders as link (red if missing, normal if exists)
7. Create target page — red link turns normal
8. Filter by template type on wiki-list.html
9. Mobile responsive layout works
