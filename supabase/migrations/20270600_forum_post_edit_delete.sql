-- ════════════════════════════════════════════════════════════════════
-- 20270600 — Forum post edit + delete
--
-- Caller can edit or delete any post whose author is one of their
-- own factions. Two new RPCs share the same ownership-via-faction
-- gate as the write RPCs (id = auth.uid() OR linked_user_id =
-- auth.uid(), abandoned_at IS NULL, faction_type in the postable set).
--
-- Edit:
--   • update_forum_post(p_post_id, p_body_html). Same body-length
--     gates as create_forum_post. Stamps forum_posts.updated_at so
--     the UI can label edited posts.
--
-- Delete:
--   • delete_forum_post(p_post_id). Drops the row. If the post was
--     the last one in its thread, the thread row cascades — empty
--     threads aren't useful and would otherwise need a separate
--     surface to find. Forum_threads denorm fields (post_count,
--     last_post_at, last_post_author_faction_id) are recomputed
--     against the remaining posts after the row is gone.
--
-- updated_at column on forum_posts is new; nullable (NULL = never
-- edited). created_at stays the original post moment.
--
-- Apply after 20270599.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. updated_at on forum_posts ──────────────────────────────────
ALTER TABLE public.forum_posts
    ADD COLUMN IF NOT EXISTS updated_at timestamptz;

COMMENT ON COLUMN public.forum_posts.updated_at IS
    'Most recent edit timestamp via update_forum_post (20270600). NULL = never edited; created_at remains the original post moment. The UI shows ''edited <relative>'' when this is set.';

-- ── 2. update_forum_post ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_forum_post(
    p_post_id   uuid,
    p_body_html text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    BODY_MIN    CONSTANT int := 4;
    BODY_MAX    CONSTANT int := 50000;

    v_uid       uuid := auth.uid();
    v_post      forum_posts%ROWTYPE;
    v_body      text;
    v_text_len  int;
    v_has_image boolean;
    v_owner_ok  boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_post_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_post FROM forum_posts WHERE id = p_post_id FOR UPDATE;
    IF v_post.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'post_not_found');
    END IF;

    -- Caller must own the post's author faction. Same gate as the
    -- write RPCs — id/linked_user_id match, not-abandoned,
    -- entrepreneur / corporation / politician only.
    SELECT EXISTS (
        SELECT 1 FROM factions
         WHERE id = v_post.author_faction_id
           AND (id = v_uid OR linked_user_id = v_uid)
           AND abandoned_at IS NULL
           AND faction_type IN ('entrepreneur', 'corporation', 'politician')
    ) INTO v_owner_ok;
    IF NOT v_owner_ok THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_post_owner');
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

    UPDATE forum_posts
       SET body       = v_body,
           updated_at = now()
     WHERE id = v_post.id;

    RETURN jsonb_build_object(
        'success',    true,
        'post_id',    v_post.id,
        'thread_id',  v_post.thread_id
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_forum_post(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.update_forum_post(uuid, text) TO authenticated;

-- ── 3. delete_forum_post ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_forum_post(p_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_post          forum_posts%ROWTYPE;
    v_thread_id     uuid;
    v_owner_ok      boolean;
    v_remaining     int;
    v_last_post     forum_posts%ROWTYPE;
    v_thread_gone   boolean := false;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_post_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_post FROM forum_posts WHERE id = p_post_id FOR UPDATE;
    IF v_post.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'post_not_found');
    END IF;
    v_thread_id := v_post.thread_id;

    SELECT EXISTS (
        SELECT 1 FROM factions
         WHERE id = v_post.author_faction_id
           AND (id = v_uid OR linked_user_id = v_uid)
           AND abandoned_at IS NULL
           AND faction_type IN ('entrepreneur', 'corporation', 'politician')
    ) INTO v_owner_ok;
    IF NOT v_owner_ok THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_post_owner');
    END IF;

    DELETE FROM forum_posts WHERE id = v_post.id;

    -- Recompute thread denorm against what's left. If nothing's
    -- left, cascade-delete the thread row — an empty thread isn't
    -- a meaningful surface.
    SELECT COUNT(*) INTO v_remaining FROM forum_posts WHERE thread_id = v_thread_id;
    IF v_remaining = 0 THEN
        DELETE FROM forum_threads WHERE id = v_thread_id;
        v_thread_gone := true;
    ELSE
        SELECT * INTO v_last_post
          FROM forum_posts
         WHERE thread_id = v_thread_id
         ORDER BY created_at DESC LIMIT 1;
        UPDATE forum_threads
           SET post_count                  = v_remaining,
               last_post_at                = v_last_post.created_at,
               last_post_author_faction_id = v_last_post.author_faction_id
         WHERE id = v_thread_id;
    END IF;

    RETURN jsonb_build_object(
        'success',      true,
        'post_id',      p_post_id,
        'thread_id',    v_thread_id,
        'thread_gone',  v_thread_gone
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_forum_post(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.delete_forum_post(uuid) TO authenticated;

-- ── 4. get_forum_thread re-emit — expose updated_at + caller-owns ─
-- The detail page needs to know which posts the viewer can edit /
-- delete (caller-owns flag) and when each post was last edited
-- (updated_at). Re-emit with both fields in the per-post object.
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
            'updated_at', p.updated_at,
            'caller_owns',
                EXISTS (
                    SELECT 1 FROM factions cf
                     WHERE cf.id = p.author_faction_id
                       AND (cf.id = v_uid OR cf.linked_user_id = v_uid)
                       AND cf.abandoned_at IS NULL
                       AND cf.faction_type IN ('entrepreneur', 'corporation', 'politician')
                ),
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

    IF p_viewer_faction_id IS NOT NULL THEN
        INSERT INTO forum_reads (faction_id, thread_id, last_read_at)
        VALUES (p_viewer_faction_id, v_thread.id, now())
        ON CONFLICT (faction_id, thread_id) DO UPDATE SET last_read_at = EXCLUDED.last_read_at;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'thread', jsonb_build_object(
            'id',          v_thread.id,
            'title',       v_thread.title,
            'created_at',  v_thread.created_at,
            'post_count',  v_thread.post_count,
            'nation_id',   v_thread.nation_id,
            'nation_name', CASE WHEN v_nation.id IS NOT NULL THEN v_nation.name ELSE NULL END
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
