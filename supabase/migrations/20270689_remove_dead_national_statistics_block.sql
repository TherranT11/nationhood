-- ════════════════════════════════════════════════════════════════════
-- 20270689 — Admin Add Nation form: remove the dead "National
--            Statistics" details block (tolerant matcher)
--
-- Bug: clicking [FILL SENSIBLE DEFAULTS] in the Add Nation tab throws
--   Uncaught ReferenceError: fillNationDefaults is not defined
-- The function (and its sibling renderAddNationStats) were removed
-- from admin.html long ago, but the HTML block hosting their buttons
-- and the empty #nn-stats-grid still lives in
-- system_config.admin_panel_html.
--
-- sql/migrations/20270363_add_nation_admin_tab_politician_refocus.sql
-- was written to delete this block via an exact REPLACE, but its
-- pattern didn't match the database row (HTML whitespace / attribute
-- drift between when 20270350 seeded the block and when 20270363
-- tried to remove it). So the block survived, and the buttons are
-- still hooked to dead JS.
--
-- This migration replaces the strict REPLACE with a regexp_replace
-- that matches the whole <details>...</details> block via the unique
-- "National Statistics" summary text + lazy quantifier. The 6
-- politician-side stat inputs (GDP / Budget / Debt / Stability /
-- Civil Freedoms / GDP Growth) are already collected by the form's
-- "Politician Headline Stats" section higher up — this is pure dead
-- UI removal, no replacement needed.
--
-- Idempotent: WHERE-gated on the presence of 'fillNationDefaults' so
-- a second run is a no-op.
--
-- Apply after 20270688.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE system_config
   SET value = regexp_replace(
           value,
           -- Lazy match from <details containing "National Statistics"
           -- in its <summary> through to the next </details>. [\s\S]
           -- catches any character including newlines (Postgres ARE).
           '<details[^>]*>\s*<summary[^>]*>National Statistics[\s\S]*?</details>\s*',
           '',
           'g'
       ),
       updated_at = now()
 WHERE key = 'admin_panel_html'
   AND value LIKE '%fillNationDefaults%';

COMMIT;
