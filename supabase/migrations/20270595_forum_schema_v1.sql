-- ════════════════════════════════════════════════════════════════════
-- 20270595 — Forum schema + read RPC (v1 read-only slice)
--
-- First shipping slice for the politician-forum surface. Replaces the
-- mockup's static category rows with real data. No write paths yet —
-- create-thread / reply / mark-read RPCs land in follow-up slices.
-- Tables defined here so v2/v3 don't need a schema change.
--
-- Schema decisions:
--   • Authorship is open to ANY faction (politicians, corporations,
--     movement_party — any signed-in account). Author display name
--     is derived from the faction at read time (leader_first/last
--     for individuals, faction_name as fallback).
--   • Categories are DB-stored, seeded by this migration. Adding a
--     new category is an admin SQL insert.
--   • Cached denorms on forum_threads (post_count, last_post_at,
--     last_post_author_faction_id) so the category-list aggregate
--     stays O(categories), not O(posts). Maintained by the v2/v3
--     write RPCs — defaults below cover the "thread just created,
--     one post" case so the schema is internally consistent even
--     before those RPCs ship.
--   • forum_reads is per-faction; the v1 RPC reads it to compute
--     the unread flag per category. Writes deferred to v2.
--   • RLS is ENABLED on all four tables with NO direct policies.
--     All access goes through SECURITY DEFINER RPCs so the read
--     path is the single source of truth for filtering / shaping.
--
-- Apply after 20270594.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 0. Drop legacy forum schema (20260219) ────────────────────────
-- The 20260219 migration created a different forum model:
-- forum_categories (name/sort_order/is_enabled — no zone column),
-- forum_subcategories (intermediate nation-scoped layer), and
-- forum_threads keyed on subcategory_id instead of category_id.
-- Nothing in the live client reads any of it (grep confirmed),
-- so the tables are orphan schema. Dropping CASCADE to clear the
-- trigger trg_forum_reply_count + RLS policies attached to them,
-- then re-creating fresh with the v1 shape below.
DROP TABLE IF EXISTS public.forum_replies      CASCADE;
DROP TABLE IF EXISTS public.forum_subcategories CASCADE;
DROP TABLE IF EXISTS public.forum_posts        CASCADE;
DROP TABLE IF EXISTS public.forum_reads        CASCADE;
DROP TABLE IF EXISTS public.forum_threads      CASCADE;
DROP TABLE IF EXISTS public.forum_categories   CASCADE;
DROP FUNCTION IF EXISTS public.forum_update_thread_on_reply() CASCADE;

-- ── 1. forum_categories ───────────────────────────────────────────
CREATE TABLE public.forum_categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    zone        text NOT NULL CHECK (zone IN ('world', 'players', 'game')),
    slug        text NOT NULL UNIQUE,
    name        text NOT NULL,
    description text NOT NULL DEFAULT '',
    icon_html   text NOT NULL DEFAULT '',   -- HTML entity or literal glyph; admin-controlled
    sort_order  int  NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.forum_categories IS
    'Forum category catalog. One row per discussion area (15 seeded by 20270595). zone groups them into the three top-level forum surfaces (World / Players / Game). slug is the URL-safe identifier; sort_order controls the in-zone listing order.';

-- ── 2. forum_threads ──────────────────────────────────────────────
CREATE TABLE public.forum_threads (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id                 uuid NOT NULL REFERENCES public.forum_categories(id) ON DELETE RESTRICT,
    author_faction_id           uuid NOT NULL REFERENCES public.factions(id) ON DELETE SET NULL,
    title                       text NOT NULL,
    created_at                  timestamptz NOT NULL DEFAULT now(),
    -- Denormalised for the category-list aggregate. Maintained by
    -- the v2 reply RPC; defaults match "thread just created, one
    -- post, author replied to themselves" so the row is consistent
    -- the moment it lands.
    post_count                  int NOT NULL DEFAULT 1,
    last_post_at                timestamptz NOT NULL DEFAULT now(),
    last_post_author_faction_id uuid REFERENCES public.factions(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.forum_threads IS
    'Forum thread (one top-level topic). author_faction_id is who opened it; last_post_* fields cache the most recent reply for the category-list view without an extra subquery per row. ON DELETE SET NULL on author refs so abandoned-faction history stays browsable (faction name resolves to NULL at read time, client falls back to ''[deleted]'').';

CREATE INDEX IF NOT EXISTS idx_forum_threads_category_last_post
    ON public.forum_threads (category_id, last_post_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author
    ON public.forum_threads (author_faction_id);

-- ── 3. forum_posts ────────────────────────────────────────────────
CREATE TABLE public.forum_posts (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id         uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
    author_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE SET NULL,
    body              text NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.forum_posts IS
    'Forum post — opening posts and replies share this table. created_at orders them within a thread. Cascade-delete with the parent thread; SET NULL on the author so deletes don''t orphan-delete posts.';

CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_created
    ON public.forum_posts (thread_id, created_at);

-- ── 4. forum_reads ────────────────────────────────────────────────
CREATE TABLE public.forum_reads (
    faction_id    uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    thread_id     uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
    last_read_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (faction_id, thread_id)
);

COMMENT ON TABLE public.forum_reads IS
    'Per-faction read state. A row exists when the faction has opened the thread at least once; last_read_at is the most recent open. Unread = thread.last_post_at > faction''s last_read_at (or no row for that pair). Writes deferred to v2 (mark-thread-read RPC); v1 just reads this to compute the unread badge.';

-- ── 5. RLS — all access via SECURITY DEFINER RPCs ─────────────────
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reads      ENABLE ROW LEVEL SECURITY;

-- ── 6. Seed: 15 categories from the mockup ────────────────────────
-- Idempotent on slug via ON CONFLICT.
INSERT INTO public.forum_categories (zone, slug, name, description, icon_html, sort_order)
VALUES
    -- The World
    ('world',   'press_publications',   'Press & Publications',      'News articles, opinion columns, editorials, magazine features',         '&#128240;', 10),
    ('world',   'diplomatic_channels',  'Diplomatic Channels',       'State-to-state communications, official notes verbale',                 '&#128231;', 20),
    ('world',   'character_lives',      'Character Lives',           'Personal stories, diaries, character vignettes',                        '&#9997;',   30),
    ('world',   'cultural_sporting',    'Cultural & Sporting',       'Sports, festivals, entertainment, the arts',                            '&#127867;', 40),
    ('world',   'speeches_addresses',   'Speeches & Public Addresses', 'Politicians at the rostrum, leaders speaking to the nation',          '&#128226;', 50),
    ('world',   'markets_industry',     'Markets & Industry',        'Corporate news, business announcements, the financial press',           '&#127970;', 60),
    -- The Players
    ('players', 'introductions_welcome','Introductions & Welcome',   'New players, returning players, hellos and reunions',                   '&#128075;', 10),
    ('players', 'questions_help',       'Questions & Help',          'Mechanics, character creation, lore and world questions',               '&#10067;',  20),
    ('players', 'discussion_theorycraft','Discussion & Theorycraft', 'Analysis, strategy, processing the game world together',                '&#128172;', 30),
    ('players', 'suggestions_feedback', 'Suggestions & Feedback',    'Proposals, complaints, requests for the moderators',                    '&#128161;', 40),
    ('players', 'off_topic',            'Off-Topic',                 'Not the game — people are people, talk freely',                         '&#9749;',   50),
    -- The Game
    ('game',    'announcements',        'Announcements',             'Official moderator posts · read-only for players',                      '&#9888;',   10),
    ('game',    'rules_documentation',  'Rules & Documentation',     'Rulebook, character creation guide, world references',                  '&#128218;', 20),
    ('game',    'calendar_sessions',    'Calendar & Sessions',       'Upcoming sessions, events, scheduling, deadlines',                      '&#128197;', 30),
    ('game',    'recruitment',          'Recruitment',               'Vacant roles, parties seeking members, corps hiring',                   '&#127919;', 40)
ON CONFLICT (slug) DO NOTHING;

-- ── 7. list_forum_categories — v1 read RPC ────────────────────────
-- Returns the full category catalog grouped by zone with per-category
-- counts, the latest thread (if any), and an unread flag computed
-- against the caller's forum_reads rows. Single round-trip from the
-- client — the page renders entirely off this response.
CREATE OR REPLACE FUNCTION public.list_forum_categories(p_viewer_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_categories    jsonb;
    v_total_threads int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT COALESCE(jsonb_agg(row_data ORDER BY zone_order, sort_order), '[]'::jsonb)
      INTO v_categories
      FROM (
        SELECT
            c.zone,
            CASE c.zone WHEN 'world' THEN 1 WHEN 'players' THEN 2 WHEN 'game' THEN 3 ELSE 9 END AS zone_order,
            c.sort_order,
            jsonb_build_object(
                'id',          c.id,
                'zone',        c.zone,
                'slug',        c.slug,
                'name',        c.name,
                'description', c.description,
                'icon_html',   c.icon_html,
                'thread_count',
                    (SELECT COUNT(*) FROM forum_threads t WHERE t.category_id = c.id),
                'post_count',
                    (SELECT COALESCE(SUM(post_count), 0) FROM forum_threads t WHERE t.category_id = c.id),
                'latest', (
                    SELECT jsonb_build_object(
                        'thread_id',     t.id,
                        'title',         t.title,
                        'last_post_at',  t.last_post_at,
                        'author_name',
                            COALESCE(
                                NULLIF(TRIM(COALESCE(f.leader_first_name, '') || ' ' || COALESCE(f.leader_last_name, '')), ''),
                                f.faction_name,
                                '[deleted]'
                            ),
                        'author_faction_id', t.last_post_author_faction_id
                    )
                      FROM forum_threads t
                      LEFT JOIN factions f ON f.id = t.last_post_author_faction_id
                     WHERE t.category_id = c.id
                     ORDER BY t.last_post_at DESC LIMIT 1
                ),
                'unread',
                    CASE WHEN p_viewer_faction_id IS NULL THEN false
                         ELSE EXISTS (
                             SELECT 1
                               FROM forum_threads t
                              WHERE t.category_id = c.id
                                AND t.last_post_at > COALESCE(
                                    (SELECT last_read_at FROM forum_reads
                                      WHERE faction_id = p_viewer_faction_id
                                        AND thread_id  = t.id),
                                    'epoch'::timestamptz
                                )
                         )
                    END
            ) AS row_data
          FROM forum_categories c
      ) sub;

    SELECT COUNT(*) INTO v_total_threads FROM forum_threads;

    RETURN jsonb_build_object(
        'success',       true,
        'categories',    v_categories,
        'total_threads', v_total_threads
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_forum_categories(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_forum_categories(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
