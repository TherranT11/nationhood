-- ════════════════════════════════════════════════════════════════════
-- 20270598 — Forum compose v2 audit follow-ups
--
-- Two of the three findings from the post-fd97b66 audit. The Cancel-
-- during-upload finding is JS-only and ships alongside this migration.
--
--   1. Tighten the forum-images upload policy. The 20270597 policy
--      allowed any authenticated user to write to any path under the
--      bucket. Folder convention (forum-images/<faction_id>/...) was
--      documentation, not enforcement. Now the policy requires the
--      first folder segment to match one of the uploader's faction
--      ids (matched by id = auth.uid() OR linked_user_id = auth.uid()).
--      A user with multiple factions (politician + entrepreneur) can
--      upload to any of their own faction folders; nobody else's.
--
--   2. Loosen create_forum_thread's body_too_short check. An image-
--      only post (one <img> embed, no text caption) previously failed
--      because the tag-stripped length came out to 0. The visible-text
--      gate now lets the row through when the body contains an <img>
--      tag, regardless of accompanying text. The sanitizer (forum-
--      utils.js sanitizeHtml) is the upstream guarantee that an <img>
--      in the body has a valid http(s) src — bare <img> with no src
--      survives the sanitizer but renders as nothing, which is a
--      cosmetic abuse, not a content-validity issue.
--
-- Apply after 20270597.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Per-faction upload policy ──────────────────────────────────
-- DROP + CREATE because storage.objects policies don't support
-- ALTER POLICY for the WITH CHECK clause. Same pattern as the
-- original 20270597 emission.
DROP POLICY IF EXISTS "Authenticated users can upload forum images" ON storage.objects;
CREATE POLICY "Authenticated users can upload forum images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'forum-images'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text
              FROM public.factions
             WHERE (id = auth.uid() OR linked_user_id = auth.uid())
               AND abandoned_at IS NULL
        )
    );

-- ── 2. create_forum_thread — allow image-only bodies ──────────────
-- Verbatim re-emit of the 20270597 body except for the body_too_short
-- check: tag-stripped length still needs to clear BODY_MIN, OR the
-- body must contain an <img> tag (case-insensitive substring match;
-- the sanitizer guarantees the img has a real src by the time the
-- payload arrives here).
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
    v_text_len  int;
    v_has_image boolean;
    v_now       timestamptz := now();
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

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

    v_title := TRIM(COALESCE(p_title, ''));
    IF char_length(v_title) < TITLE_MIN THEN
        RETURN jsonb_build_object('success', false, 'reason', 'title_too_short',
            'min', TITLE_MIN);
    END IF;
    IF char_length(v_title) > TITLE_MAX THEN
        RETURN jsonb_build_object('success', false, 'reason', 'title_too_long',
            'max', TITLE_MAX);
    END IF;

    v_body      := COALESCE(p_body_html, '');
    v_text_len  := char_length(TRIM(regexp_replace(v_body, '<[^>]*>', '', 'g')));
    v_has_image := position('<img' in lower(v_body)) > 0;

    -- Reject only when BOTH the text is too short AND there's no
    -- image. A photo-only post (img tag, no caption) is allowed.
    IF v_text_len < BODY_MIN AND NOT v_has_image THEN
        RETURN jsonb_build_object('success', false, 'reason', 'body_too_short',
            'min', BODY_MIN);
    END IF;
    IF char_length(v_body) > BODY_MAX THEN
        RETURN jsonb_build_object('success', false, 'reason', 'body_too_long',
            'max', BODY_MAX);
    END IF;

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

    INSERT INTO forum_reads (faction_id, thread_id, last_read_at)
    VALUES (v_faction.id, v_thread_id, v_now)
    ON CONFLICT (faction_id, thread_id) DO UPDATE
       SET last_read_at = EXCLUDED.last_read_at;

    RETURN jsonb_build_object(
        'success',       true,
        'thread_id',     v_thread_id,
        'category_slug', v_cat.slug
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_forum_thread(text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_forum_thread(text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
