-- ════════════════════════════════════════════════════════════════════
-- 20270602 — Forum: Discord notification on new threads
--
-- When create_forum_thread succeeds, fire a fire-and-forget POST to
-- a Supabase Edge Function that forwards a compact embed to the
-- configured Discord webhook. The pg_net call doesn't block the RPC
-- — the thread inserts; the notification either lands or doesn't.
-- net.http_response holds the response if you need to audit failures.
--
-- Scope: new threads only (user-selected). Replies don't fire.
-- The edge function (supabase/functions/forum-thread-discord) is the
-- secret-bearer: Discord webhook URL stays in that function's env
-- vars, never in the DB.
--
-- Three system_config rows added (rows, not values — values must be
-- set out-of-band by an admin after this migration applies):
--
--   forum_discord_edge_url     — full URL to the deployed edge
--                                 function, e.g.
--                                 https://<project-ref>.supabase.co/functions/v1/forum-thread-discord
--   forum_discord_edge_secret  — shared secret matching the edge
--                                 function's FORUM_DISCORD_EDGE_SECRET
--                                 env var (Authorization: Bearer …)
--   forum_public_base_url      — base URL for the in-app thread
--                                 link, e.g. https://nationhoodgame.com
--
-- Until those three values are populated, the RPC's pg_net call is
-- skipped (NULL/empty config → no notification). Thread creation
-- still works regardless.
--
-- Admin one-time setup after applying:
--   UPDATE system_config SET value='https://YOUR-REF.supabase.co/functions/v1/forum-thread-discord'
--    WHERE key='forum_discord_edge_url';
--   UPDATE system_config SET value='<long-random-string>'
--    WHERE key='forum_discord_edge_secret';
--   UPDATE system_config SET value='https://nationhoodgame.com'
--    WHERE key='forum_public_base_url';
-- Plus, in the Supabase dashboard, set the matching Edge Function
-- secrets:
--   FORUM_DISCORD_EDGE_SECRET = <same long random string as above>
--   DISCORD_FORUM_WEBHOOK_URL = <Discord channel webhook URL>
--
-- Apply after 20270601.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. pg_net for outbound HTTP from SQL ──────────────────────────
-- pg_net pins its own 'net' schema; the WITH SCHEMA clause isn't
-- supported. On Supabase managed projects this extension is
-- typically already enabled — the IF NOT EXISTS makes that a no-op.
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── 2. Config keys (placeholder values, admin sets real ones) ─────
INSERT INTO public.system_config (key, value) VALUES
    ('forum_discord_edge_url',    ''),
    ('forum_discord_edge_secret', ''),
    ('forum_public_base_url',     'https://nationhoodgame.com')
ON CONFLICT (key) DO NOTHING;

-- ── 3. create_forum_thread re-emit ────────────────────────────────
-- Same body as 20270599 except the very last block: after the success
-- jsonb is built, peek at the three system_config rows. When all
-- three are populated, fire a non-blocking pg_net.http_post to the
-- edge function. The HTTP call is async — the RPC returns its
-- success payload to the client without waiting for Discord.
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

    v_edge_url    text;
    v_edge_secret text;
    v_base_url    text;
    v_author_name text;
    v_thread_url  text;
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

    -- ─── Discord notification (fire-and-forget) ───────────────────
    -- Skip entirely if any of the three config keys are blank. This
    -- keeps the migration safe to apply before the admin has set
    -- the real values.
    SELECT value INTO v_edge_url    FROM system_config WHERE key = 'forum_discord_edge_url';
    SELECT value INTO v_edge_secret FROM system_config WHERE key = 'forum_discord_edge_secret';
    SELECT value INTO v_base_url    FROM system_config WHERE key = 'forum_public_base_url';

    IF COALESCE(v_edge_url, '') <> ''
       AND COALESCE(v_edge_secret, '') <> ''
       AND COALESCE(v_base_url, '') <> '' THEN

        v_author_name := COALESCE(
            NULLIF(TRIM(COALESCE(v_faction.leader_first_name, '') || ' ' ||
                       COALESCE(v_faction.leader_last_name,  '')), ''),
            v_faction.faction_name,
            'Anonymous'
        );
        v_thread_url := rtrim(v_base_url, '/') ||
                        '/politician-forum-thread.html?id=' || v_thread_id::text;

        -- Wrapped in a sub-BEGIN so a pg_net hiccup never bubbles up
        -- as a thread-creation failure. The thread is already
        -- inserted at this point — Discord post is best-effort.
        BEGIN
            PERFORM net.http_post(
                url     := v_edge_url,
                body    := jsonb_build_object(
                    'title',         v_title,
                    'author_name',   v_author_name,
                    'category_name', v_cat.name,
                    'thread_url',    v_thread_url
                ),
                headers := jsonb_build_object(
                    'Content-Type',  'application/json',
                    'Authorization', 'Bearer ' || v_edge_secret
                )
            );
        EXCEPTION WHEN OTHERS THEN
            -- Swallow. The notification fails silently; the thread
            -- still posts. Worth flagging in a future audit pass
            -- if we want structured logging here.
            NULL;
        END;
    END IF;

    RETURN jsonb_build_object(
        'success',       true,
        'thread_id',     v_thread_id,
        'category_slug', v_cat.slug
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_forum_thread(text, text, text, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_forum_thread(text, text, text, uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
