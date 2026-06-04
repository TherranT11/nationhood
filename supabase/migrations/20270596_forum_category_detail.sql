-- ════════════════════════════════════════════════════════════════════
-- 20270596 — Forum category detail RPC
--
-- Each category gets its own URL: politician-forum-category.html?slug=...
-- The detail page calls get_forum_category(p_slug) which returns the
-- category metadata (zone / name / description) plus the thread list
-- for that category.
--
-- For v1 the thread list is empty (no write path yet — create-thread
-- ships in v2). The RPC's threads array is shaped already so the
-- page renders the empty state today and the live list once writes
-- land, without a follow-up shape change.
--
-- Same SECURITY DEFINER + REVOKE-then-GRANT pattern as 20270595's
-- list_forum_categories — RLS is enabled on the underlying tables
-- with no policies, so this RPC is the single read surface.
--
-- Apply after 20270595.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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

    -- Thread list shape: matches the per-row needs of the detail page
    -- (title, opener author, last-post chip, unread flag). For v1
    -- this aggregates to an empty array; v2's create-thread RPC will
    -- populate forum_threads + forum_posts.
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
        'threads', v_threads,
        'thread_count', jsonb_array_length(v_threads)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_forum_category(text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_forum_category(text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
