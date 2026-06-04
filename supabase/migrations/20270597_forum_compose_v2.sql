-- ════════════════════════════════════════════════════════════════════
-- 20270597 — Forum compose v2: write path + image uploads
--
-- Second forum slice. Ships the generic compose surface (Title +
-- rich-text Body with image embeds) for every category. Press-specific
-- fields (Article Type / Byline / Section / Tags) layer in a later
-- slice; this one is universal.
--
-- Three pieces:
--   1. Storage bucket forum-images, public-read + authenticated-upload.
--      The compose page uploads images into per-faction folders and
--      embeds the public URL into the body HTML.
--   2. create_forum_thread(p_category_slug, p_title, p_body_html) RPC.
--      Authoritative server-side validation: length, non-empty title,
--      non-empty body, valid slug. Inserts forum_threads + the opening
--      forum_posts row in one transaction. Returns the new thread id
--      so the client can navigate.
--   3. Length caps live on the RPC. Schema CHECK constraints would
--      pin this harder but are awkward to evolve; the RPC validation
--      is the single enforcement point for now.
--
-- Sanitization model: HTML body is sanitized client-side before submit
-- (forum-utils.js sanitizeHtml allowlists tag set + attributes) AND
-- again client-side at render time. Server stores whatever it receives.
-- Documented limitation: a hostile client could bypass the client
-- sanitizer; the render-side sanitizer is the second line of defence.
-- Server-side HTML sanitization would be the third line but is
-- non-trivial in plpgsql and deferred.
--
-- Apply after 20270596.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Storage bucket: forum-images ───────────────────────────────
-- Public bucket so the embedded <img src> URLs resolve without auth
-- for anyone reading the forum. Uploads gated to authenticated users
-- via the storage.objects policies below.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'forum-images',
    'forum-images',
    true,
    8 * 1024 * 1024,                                          -- 8 MB cap per file
    ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
   SET public             = EXCLUDED.public,
       file_size_limit    = EXCLUDED.file_size_limit,
       allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── 2. Storage policies ───────────────────────────────────────────
-- The compose page uploads to forum-images/<faction_id>/<filename>.
-- Authenticated upload + public read. Update/delete locked to the
-- uploader so accidental cross-faction tampering is impossible.
DROP POLICY IF EXISTS "Authenticated users can upload forum images" ON storage.objects;
CREATE POLICY "Authenticated users can upload forum images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'forum-images');

DROP POLICY IF EXISTS "Anyone can view forum images" ON storage.objects;
CREATE POLICY "Anyone can view forum images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'forum-images');

DROP POLICY IF EXISTS "Uploaders can delete their own forum images" ON storage.objects;
CREATE POLICY "Uploaders can delete their own forum images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'forum-images' AND owner = auth.uid());

-- ── 3. create_forum_thread RPC ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_forum_thread(
    p_category_slug text,
    p_title         text,
    p_body_html     text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    TITLE_MIN   CONSTANT int := 4;
    TITLE_MAX   CONSTANT int := 200;
    BODY_MIN    CONSTANT int := 4;
    BODY_MAX    CONSTANT int := 50000;

    v_uid       uuid := auth.uid();
    v_faction   factions%ROWTYPE;
    v_cat       forum_categories%ROWTYPE;
    v_thread_id uuid;
    v_title     text;
    v_body      text;
    v_now       timestamptz := now();
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    -- Caller's primary faction. Same lookup pattern as the politician /
    -- entrepreneur RPCs: id matches v_uid, or linked_user_id matches.
    -- Picks the oldest non-abandoned faction so multi-account quirks
    -- resolve deterministically.
    SELECT * INTO v_faction FROM public.factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    IF p_category_slug IS NULL OR p_category_slug = '' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_category');
    END IF;
    SELECT * INTO v_cat FROM forum_categories WHERE slug = p_category_slug;
    IF v_cat.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'category_not_found');
    END IF;

    -- Title: trim + length-cap. Empty / too short / too long all reject.
    v_title := TRIM(COALESCE(p_title, ''));
    IF char_length(v_title) < TITLE_MIN THEN
        RETURN jsonb_build_object('success', false, 'reason', 'title_too_short',
            'min', TITLE_MIN);
    END IF;
    IF char_length(v_title) > TITLE_MAX THEN
        RETURN jsonb_build_object('success', false, 'reason', 'title_too_long',
            'max', TITLE_MAX);
    END IF;

    -- Body: same trim + bounds. Cap at 50 KB so a runaway paste doesn't
    -- bloat a row. Empty body (after sanitizer strips junk) also rejects.
    v_body := COALESCE(p_body_html, '');
    -- Strip-tag length check: count text content rather than HTML markup
    -- so the bound reflects actual reading length, not tag overhead.
    -- regexp_replace removes any sequence of < ... > non-greedy.
    IF char_length(TRIM(regexp_replace(v_body, '<[^>]*>', '', 'g'))) < BODY_MIN THEN
        RETURN jsonb_build_object('success', false, 'reason', 'body_too_short',
            'min', BODY_MIN);
    END IF;
    IF char_length(v_body) > BODY_MAX THEN
        RETURN jsonb_build_object('success', false, 'reason', 'body_too_long',
            'max', BODY_MAX);
    END IF;

    -- Insert thread + opening post in one transaction. The thread's
    -- denorm fields (post_count, last_post_at, last_post_author_faction_id)
    -- default to "thread just created, one post by author" — no
    -- post-insert update needed.
    INSERT INTO forum_threads
        (category_id, author_faction_id, title, created_at,
         post_count, last_post_at, last_post_author_faction_id)
    VALUES
        (v_cat.id, v_faction.id, v_title, v_now,
         1, v_now, v_faction.id)
    RETURNING id INTO v_thread_id;

    INSERT INTO forum_posts
        (thread_id, author_faction_id, body, created_at)
    VALUES
        (v_thread_id, v_faction.id, v_body, v_now);

    -- Mark the author as having "read" their own thread so it doesn't
    -- come back as unread on their next forum-index visit.
    INSERT INTO forum_reads (faction_id, thread_id, last_read_at)
    VALUES (v_faction.id, v_thread_id, v_now)
    ON CONFLICT (faction_id, thread_id) DO UPDATE
       SET last_read_at = EXCLUDED.last_read_at;

    RETURN jsonb_build_object(
        'success',      true,
        'thread_id',    v_thread_id,
        'category_slug', v_cat.slug
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_forum_thread(text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_forum_thread(text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
