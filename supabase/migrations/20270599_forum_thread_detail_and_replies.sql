-- ════════════════════════════════════════════════════════════════════
-- 20270599 — Forum thread detail page + replies + nation tag
--
-- Third forum slice. Threads now have a per-thread URL with a reader
-- + reply surface. Replies use an identity selector (caller's
-- entrepreneur / corporation / politician factions). Threads also
-- carry an optional nation_id tag (NULL = International).
--
-- Schema:
--   • forum_threads.nation_id uuid → nations(id). NULL means
--     International (the thread isn't tied to any one country).
--
-- Two new RPCs:
--   • get_forum_thread(p_thread_id, p_viewer_faction_id) — full
--     thread payload for the detail page: thread metadata, category
--     info, all posts in created_at order with resolved author
--     identities (name + faction type for the small-print attribution
--     beneath each post). Marks the viewer as having read the
--     thread on success.
--   • create_forum_post(p_thread_id, p_author_faction_id, p_body_html) —
--     adds a reply. Validates that the caller owns p_author_faction_id
--     (id = auth.uid() OR linked_user_id = auth.uid()) and that its
--     faction_type is in the allowed set (entrepreneur / corporation /
--     politician — movement_party + military are NOT allowed to post).
--     Updates the thread's denorm (post_count, last_post_at,
--     last_post_author_faction_id) so the category-list aggregate
--     stays correct without a follow-up query.
--
-- create_forum_thread re-emitted with two new parameters:
--   • p_author_faction_id — same identity selector as replies, with
--     the same ownership + faction_type guards. Replaces the
--     "pick the caller's oldest non-abandoned faction" fallback.
--   • p_nation_id — optional nations.id tag. NULL passes through as
--     International. When non-null, validated to exist.
--
-- Apply after 20270598.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: nation_id on threads ───────────────────────────────
ALTER TABLE public.forum_threads
    ADD COLUMN IF NOT EXISTS nation_id uuid REFERENCES public.nations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.forum_threads.nation_id IS
    'Optional nation tag set when the thread is opened. NULL = International (not tied to one country). ON DELETE SET NULL so deleting a nation doesn''t cascade-delete its threads — the thread reverts to International.';

CREATE INDEX IF NOT EXISTS idx_forum_threads_nation
    ON public.forum_threads (nation_id)
    WHERE nation_id IS NOT NULL;

-- ── 2. Helper: caller-owned faction validator ─────────────────────
-- DRY helper used by create_forum_thread + create_forum_post. Returns
-- the faction row when the caller (auth.uid()) owns it AND it's in
-- the allowed type set; returns an empty row when the check fails.
CREATE OR REPLACE FUNCTION public._forum_resolve_author(p_faction_id uuid)
RETURNS factions
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_f   factions%ROWTYPE;
BEGIN
    IF v_uid IS NULL OR p_faction_id IS NULL THEN
        RETURN v_f;     -- empty row
    END IF;
    SELECT * INTO v_f FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND abandoned_at IS NULL
       AND faction_type IN ('entrepreneur', 'corporation', 'politician');
    RETURN v_f;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._forum_resolve_author(uuid) FROM PUBLIC;
-- NOT granted to authenticated. The helper is called by the
-- SECURITY DEFINER write RPCs (create_forum_thread,
-- create_forum_post) which execute with elevated privileges; the
-- caller's grant doesn't apply. Keeping it un-grantable to
-- authenticated reduces the API surface on the wire.

-- ── 3. create_forum_thread v3 ─────────────────────────────────────
-- Adds p_author_faction_id (replaces the implicit "oldest non-abandoned
-- faction" pick) and p_nation_id (optional nation tag). Everything
-- else verbatim from 20270598.
CREATE OR REPLACE FUNCTION public.create_forum_thread(
    p_category_slug    text,
    p_title            text,
    p_body_html        text,
    p_author_faction_id uuid,
    p_nation_id        uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    TITLE_MIN   CONSTANT int := 4;
    TITLE_MAX   CONSTANT int := 200;
    BODY_MIN    CONSTANT int := 4;
    BODY_MAX    CONSTANT int := 50000;

    v_faction   factions%ROWTYPE;
    v_cat       forum_categories%ROWTYPE;
    v_thread_id uuid;
    v_title     text;
    v_body      text;
    v_text_len  int;
    v_has_image boolean;
    v_now       timestamptz := now();
    v_nation_ok boolean;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    v_faction := public._forum_resolve_author(p_author_faction_id);
    IF v_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_author_faction');
    END IF;

    IF p_category_slug IS NULL OR p_category_slug = '' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_category');
    END IF;
    SELECT * INTO v_cat FROM forum_categories WHERE slug = p_category_slug;
    IF v_cat.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'category_not_found');
    END IF;

    -- nation_id is optional. NULL → International. If supplied, must exist.
    IF p_nation_id IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM nations WHERE id = p_nation_id) INTO v_nation_ok;
        IF NOT v_nation_ok THEN
            RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
        END IF;
    END IF;

    v_title := TRIM(COALESCE(p_title, ''));
    IF char_length(v_title) < TITLE_MIN THEN
        RETURN jsonb_build_object('success', false, 'reason', 'title_too_short', 'min', TITLE_MIN);
    END IF;
    IF char_length(v_title) > TITLE_MAX THEN
        RETURN jsonb_build_object('success', false, 'reason', 'title_too_long', 'max', TITLE_MAX);
    END IF;

    v_body      := COALESCE(p_body_html, '');
    v_text_len  := char_length(TRIM(regexp_replace(v_body, '<[^>]*>', '', 'g')));
    v_has_image := position('<img' in lower(v_body)) > 0;
    IF v_text_len < BODY_MIN AND NOT v_has_image THEN
        RETURN jsonb_build_object('success', false, 'reason', 'body_too_short', 'min', BODY_MIN);
    END IF;
    IF char_length(v_body) > BODY_MAX THEN
        RETURN jsonb_build_object('success', false, 'reason', 'body_too_long', 'max', BODY_MAX);
    END IF;

    INSERT INTO forum_threads
        (category_id, author_faction_id, title, nation_id, created_at,
         post_count, last_post_at, last_post_author_faction_id)
    VALUES
        (v_cat.id, v_faction.id, v_title, p_nation_id, v_now,
         1, v_now, v_faction.id)
    RETURNING id INTO v_thread_id;

    INSERT INTO forum_posts (thread_id, author_faction_id, body, created_at)
    VALUES (v_thread_id, v_faction.id, v_body, v_now);

    INSERT INTO forum_reads (faction_id, thread_id, last_read_at)
    VALUES (v_faction.id, v_thread_id, v_now)
    ON CONFLICT (faction_id, thread_id) DO UPDATE SET last_read_at = EXCLUDED.last_read_at;

    RETURN jsonb_build_object(
        'success',       true,
        'thread_id',     v_thread_id,
        'category_slug', v_cat.slug
    );
END;
$$;

-- Drop the v2 signature (3-arg) so callers can't accidentally bypass
-- the new identity / nation params. Idempotent.
DROP FUNCTION IF EXISTS public.create_forum_thread(text, text, text);

REVOKE EXECUTE ON FUNCTION public.create_forum_thread(text, text, text, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_forum_thread(text, text, text, uuid, uuid) TO authenticated;

-- ── 4. create_forum_post — replies ────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_forum_post(
    p_thread_id        uuid,
    p_author_faction_id uuid,
    p_body_html        text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    BODY_MIN    CONSTANT int := 4;
    BODY_MAX    CONSTANT int := 50000;

    v_faction   factions%ROWTYPE;
    v_thread    forum_threads%ROWTYPE;
    v_post_id   uuid;
    v_body      text;
    v_text_len  int;
    v_has_image boolean;
    v_now       timestamptz := now();
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    v_faction := public._forum_resolve_author(p_author_faction_id);
    IF v_faction.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_author_faction');
    END IF;

    SELECT * INTO v_thread FROM forum_threads WHERE id = p_thread_id FOR UPDATE;
    IF v_thread.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'thread_not_found');
    END IF;

    v_body      := COALESCE(p_body_html, '');
    v_text_len  := char_length(TRIM(regexp_replace(v_body, '<[^>]*>', '', 'g')));
    v_has_image := position('<img' in lower(v_body)) > 0;
    IF v_text_len < BODY_MIN AND NOT v_has_image THEN
        RETURN jsonb_build_object('success', false, 'reason', 'body_too_short', 'min', BODY_MIN);
    END IF;
    IF char_length(v_body) > BODY_MAX THEN
        RETURN jsonb_build_object('success', false, 'reason', 'body_too_long', 'max', BODY_MAX);
    END IF;

    INSERT INTO forum_posts (thread_id, author_faction_id, body, created_at)
    VALUES (v_thread.id, v_faction.id, v_body, v_now)
    RETURNING id INTO v_post_id;

    -- Denorm bump on the thread. The category-list aggregate reads
    -- these without a join into forum_posts.
    UPDATE forum_threads
       SET post_count                  = post_count + 1,
           last_post_at                = v_now,
           last_post_author_faction_id = v_faction.id
     WHERE id = v_thread.id;

    -- Mark the author as having read the thread up to and including
    -- their own reply.
    INSERT INTO forum_reads (faction_id, thread_id, last_read_at)
    VALUES (v_faction.id, v_thread.id, v_now)
    ON CONFLICT (faction_id, thread_id) DO UPDATE SET last_read_at = EXCLUDED.last_read_at;

    RETURN jsonb_build_object(
        'success',   true,
        'post_id',   v_post_id,
        'thread_id', v_thread.id
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_forum_post(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_forum_post(uuid, uuid, text) TO authenticated;

-- ── 5. get_forum_thread — detail-page payload ─────────────────────
-- Single round-trip: thread metadata + category info + ordered posts
-- with resolved authors. Marks the viewer's read state at the end so
-- the thread disappears from the unread count on the index.
CREATE OR REPLACE FUNCTION public.get_forum_thread(
    p_thread_id         uuid,
    p_viewer_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_thread forum_threads%ROWTYPE;
    v_cat    forum_categories%ROWTYPE;
    v_nation RECORD;
    v_posts  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_thread_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_thread FROM forum_threads WHERE id = p_thread_id;
    IF v_thread.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'thread_not_found');
    END IF;

    SELECT * INTO v_cat FROM forum_categories WHERE id = v_thread.category_id;
    SELECT id, name INTO v_nation FROM nations WHERE id = v_thread.nation_id;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'post_id',    p.id,
            'body',       p.body,
            'created_at', p.created_at,
            'author', jsonb_build_object(
                'faction_id',   f.id,
                'faction_type', f.faction_type,
                'faction_name', f.faction_name,
                'leader_name',  NULLIF(TRIM(COALESCE(f.leader_first_name, '') || ' ' || COALESCE(f.leader_last_name, '')), ''),
                'display_name',
                    COALESCE(
                        NULLIF(TRIM(COALESCE(f.leader_first_name, '') || ' ' || COALESCE(f.leader_last_name, '')), ''),
                        f.faction_name,
                        '[deleted]'
                    )
            )
        ) ORDER BY p.created_at ASC
    ), '[]'::jsonb)
      INTO v_posts
      FROM forum_posts p
      LEFT JOIN factions f ON f.id = p.author_faction_id
     WHERE p.thread_id = v_thread.id;

    -- Mark viewer's read state so the unread badge clears.
    IF p_viewer_faction_id IS NOT NULL THEN
        INSERT INTO forum_reads (faction_id, thread_id, last_read_at)
        VALUES (p_viewer_faction_id, v_thread.id, now())
        ON CONFLICT (faction_id, thread_id) DO UPDATE SET last_read_at = EXCLUDED.last_read_at;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'thread', jsonb_build_object(
            'id',            v_thread.id,
            'title',         v_thread.title,
            'created_at',    v_thread.created_at,
            'post_count',    v_thread.post_count,
            'nation_id',     v_thread.nation_id,
            'nation_name',   CASE WHEN v_nation.id IS NOT NULL THEN v_nation.name ELSE NULL END
        ),
        'category', jsonb_build_object(
            'id',          v_cat.id,
            'zone',        v_cat.zone,
            'slug',        v_cat.slug,
            'name',        v_cat.name,
            'description', v_cat.description,
            'icon_html',   v_cat.icon_html
        ),
        'posts', v_posts
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_forum_thread(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_forum_thread(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
