-- Atomic RPC for creating custom group chats.
-- This replaces client-side multi-table inserts so chat creation is all-or-nothing.

CREATE OR REPLACE FUNCTION public.create_custom_group_chat(
    chat_name TEXT,
    member_ids UUID[]
)
RETURNS TABLE(chat_id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_uid UUID := auth.uid();
    v_creator_faction_id UUID;
    v_chat_id UUID;
    v_chat_name TEXT := COALESCE(NULLIF(BTRIM(chat_name), ''), 'Group Chat');
    v_member_ids UUID[] := COALESCE(member_ids, ARRAY[]::UUID[]);
    v_all_member_ids UUID[];
    v_bad_member_count INTEGER;
BEGIN
    IF v_caller_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required'
            USING ERRCODE = '42501';
    END IF;

    SELECT f.id INTO v_creator_faction_id
    FROM public.factions f
    WHERE f.linked_user_id = v_caller_uid
    ORDER BY f.created_at DESC NULLS LAST
    LIMIT 1;

    IF v_creator_faction_id IS NULL THEN
        RAISE EXCEPTION 'No faction linked to the current user'
            USING ERRCODE = '42501';
    END IF;

    IF char_length(v_chat_name) > 100 THEN
        RAISE EXCEPTION 'Group name must be 100 characters or fewer'
            USING ERRCODE = '22023';
    END IF;

    -- Remove NULLs/duplicates and always include the caller's faction.
    SELECT COALESCE(array_agg(DISTINCT m), ARRAY[]::UUID[])
      INTO v_member_ids
    FROM unnest(v_member_ids) AS t(m)
    WHERE m IS NOT NULL
      AND m <> v_creator_faction_id;

    v_all_member_ids := array_append(v_member_ids, v_creator_faction_id);

    IF COALESCE(array_length(v_all_member_ids, 1), 0) < 2 THEN
        RAISE EXCEPTION 'Select at least one other member'
            USING ERRCODE = '22023';
    END IF;

    SELECT COUNT(*) INTO v_bad_member_count
    FROM unnest(v_member_ids) AS t(m)
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.factions f
        WHERE f.id = t.m
    );

    IF v_bad_member_count > 0 THEN
        RAISE EXCEPTION 'One or more selected members were not found'
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.group_chats(name, chat_type, created_by)
    VALUES (v_chat_name, 'custom', v_creator_faction_id)
    RETURNING id INTO v_chat_id;

    INSERT INTO public.group_chat_members(chat_id, faction_id)
    SELECT v_chat_id, m
    FROM unnest(v_all_member_ids) AS t(m);

    INSERT INTO public.group_chat_messages(
        chat_id, sender_id, is_system, message_text, sent_at_tick
    )
    SELECT
        v_chat_id,
        NULL,
        TRUE,
        COALESCE(f.faction_name, 'Someone') || ' created this group chat.',
        s.current_tick
    FROM public.factions f
    LEFT JOIN public.shard s ON TRUE
    WHERE f.id = v_creator_faction_id
    LIMIT 1;

    RETURN QUERY
    SELECT v_chat_id, v_chat_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_custom_group_chat(TEXT, UUID[]) TO authenticated;
