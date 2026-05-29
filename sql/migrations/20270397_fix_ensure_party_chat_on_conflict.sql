-- ════════════════════════════════════════════════════════════════════
-- ensure_party_chat — match the partial unique index in ON CONFLICT
-- ════════════════════════════════════════════════════════════════════
-- 20270380 introduced ensure_party_chat with:
--
--     INSERT INTO group_chats (...) VALUES (...)
--     ON CONFLICT (party_id) DO NOTHING;
--
-- and the supporting index as PARTIAL:
--
--     CREATE UNIQUE INDEX idx_group_chats_party
--         ON group_chats(party_id) WHERE party_id IS NOT NULL;
--
-- PostgreSQL's ON CONFLICT (col) inference does NOT match a partial
-- index by column alone — the predicate has to be repeated on the
-- INSERT side so the planner can pick the right index. Without it
-- the function runtime errors:
--
--     there is no unique or exclusion constraint matching the
--     ON CONFLICT specification
--
-- which is exactly what the user reported the first time they hit
-- the chat surface after the function landed.
--
-- Fix: re-apply ensure_party_chat with the predicate echoed on the
-- ON CONFLICT clause. The index stays partial (corp / global / etc.
-- group_chats rows have party_id NULL — a full unique index would
-- forbid more than one of them, breaking those chat types). Body
-- otherwise verbatim from 20270380:40-83.
--
-- CREATE OR REPLACE, idempotent. Re-running on the already-fixed
-- function body is a byte-for-byte no-op.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.ensure_party_chat(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_party     factions%ROWTYPE;
    v_chat_id   uuid;
    v_is_member boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_party FROM factions
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL;
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM factions
         WHERE (id = v_uid OR linked_user_id = v_uid)
           AND faction_type = 'politician'
           AND politician_party_id = p_party_id
           AND abandoned_at IS NULL
    ) INTO v_is_member;
    IF NOT v_is_member THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT id INTO v_chat_id FROM group_chats WHERE party_id = p_party_id LIMIT 1;
    IF v_chat_id IS NULL THEN
        INSERT INTO group_chats (chat_type, party_id, name, created_by)
        VALUES ('movement_party', p_party_id,
                left(COALESCE(v_party.faction_name, 'Party') || ' — Party Chat', 100), NULL)
        -- Predicate echoes idx_group_chats_party so the planner picks
        -- the partial unique index. Without `WHERE party_id IS NOT
        -- NULL` this raises 'no unique or exclusion constraint
        -- matching the ON CONFLICT specification'.
        ON CONFLICT (party_id) WHERE party_id IS NOT NULL DO NOTHING;
        SELECT id INTO v_chat_id FROM group_chats WHERE party_id = p_party_id LIMIT 1;
    END IF;

    RETURN jsonb_build_object('success', true, 'chat_id', v_chat_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_party_chat(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
