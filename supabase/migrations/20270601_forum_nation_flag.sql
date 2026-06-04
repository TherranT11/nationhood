-- ════════════════════════════════════════════════════════════════════
-- 20270601 — Forum: surface nation_id + name + flag on every row
--
-- The category-list thread rows had no nation tag — the only place
-- the Primary Nation showed up was on the thread-detail page header.
-- Re-emit both reader RPCs so each thread row carries the nation
-- (id + display name + flag URL) and the UI can render the chip
-- inline with the title.
--
-- get_forum_category: per-thread record gains nation_id, nation_name,
-- nation_flag_url.
--
-- get_forum_thread: thread payload gains nation_flag_url (id + name
-- were already there from 20270599).
--
-- Both joins are LEFT against nations so NULL nation_id (International
-- threads) leaves all three fields NULL — the client renders an
-- "International" chip without a flag in that case.
--
-- Apply after 20270600.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. get_forum_category — nation fields on each thread row ──────
CREATE OR REPLACE FUNCTION public.get_forum_category(
    p_slug              text,
    p_viewer_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_cat      forum_categories%ROWTYPE;
    v_threads  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_slug IS NULL OR p_slug = '' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_cat FROM forum_categories WHERE slug = p_slug;
    IF v_cat.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'category_not_found');
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'thread_id',     t.id,
            'title',         t.title,
            'created_at',    t.created_at,
            'post_count',    t.post_count,
            'last_post_at',  t.last_post_at,
            'opener_name',
                COALESCE(
                    NULLIF(TRIM(COALESCE(opener.leader_first_name, '') || ' ' || COALESCE(opener.leader_last_name, '')), ''),
                    opener.faction_name,
                    '[deleted]'
                ),
            'opener_faction_id', t.author_faction_id,
            'last_post_author_name',
                COALESCE(
                    NULLIF(TRIM(COALESCE(last_poster.leader_first_name, '') || ' ' || COALESCE(last_poster.leader_last_name, '')), ''),
                    last_poster.faction_name,
                    '[deleted]'
                ),
            'last_post_author_faction_id', t.last_post_author_faction_id,
            'nation_id',       t.nation_id,
            'nation_name',     n.name,
            'nation_flag_url', n.flag_url,
            'unread',
                CASE WHEN p_viewer_faction_id IS NULL THEN false
                     ELSE t.last_post_at > COALESCE(
                         (SELECT last_read_at FROM forum_reads
                           WHERE faction_id = p_viewer_faction_id
                             AND thread_id  = t.id),
                         'epoch'::timestamptz
                     )
                END
        ) ORDER BY t.last_post_at DESC
    ), '[]'::jsonb)
      INTO v_threads
      FROM forum_threads t
      LEFT JOIN factions opener      ON opener.id      = t.author_faction_id
      LEFT JOIN factions last_poster ON last_poster.id = t.last_post_author_faction_id
      LEFT JOIN nations  n           ON n.id           = t.nation_id
     WHERE t.category_id = v_cat.id;

    RETURN jsonb_build_object(
        'success', true,
        'category', jsonb_build_object(
            'id',          v_cat.id,
            'zone',        v_cat.zone,
            'slug',        v_cat.slug,
            'name',        v_cat.name,
            'description', v_cat.description,
            'icon_html',   v_cat.icon_html
        ),
        'threads',      v_threads,
        'thread_count', jsonb_array_length(v_threads)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_forum_category(text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_forum_category(text, uuid) TO authenticated;

-- ── 2. get_forum_thread — flag URL on the thread payload ──────────
-- Re-emits the 20270600 body (which added caller_owns + updated_at
-- per post) and adds nation_flag_url alongside the existing
-- nation_id + nation_name on the thread object.
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
    SELECT id, name, flag_url INTO v_nation FROM nations WHERE id = v_thread.nation_id;

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
            'id',              v_thread.id,
            'title',           v_thread.title,
            'created_at',      v_thread.created_at,
            'post_count',      v_thread.post_count,
            'nation_id',       v_thread.nation_id,
            'nation_name',     CASE WHEN v_nation.id IS NOT NULL THEN v_nation.name     ELSE NULL END,
            'nation_flag_url', CASE WHEN v_nation.id IS NOT NULL THEN v_nation.flag_url ELSE NULL END
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
