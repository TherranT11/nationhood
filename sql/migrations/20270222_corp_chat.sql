-- ════════════════════════════════════════════════════════════════════
-- PER-CORP CHAT — public wall on each entrepreneur corp
-- ════════════════════════════════════════════════════════════════════
-- Reuses the existing group-chat system (group_chats / group_chat_messages)
-- rather than a parallel table. Each entrepreneur corp gets one chat,
-- scoped by a new group_chats.corp_id + chat_type 'entrepreneur_corp'.
--
-- Public by design (per product decision): reads are already RLS
-- USING(true), and message INSERT only requires sender_id = your own
-- faction — so no membership rows are needed. The corp page reads/inserts
-- group_chat_messages directly; this migration only adds the scope column
-- and a get-or-create helper.
--
-- The existing rate-limit + mute/ban INSERT triggers still apply (mute/ban
-- no-ops for non-members; rate-limit guards spam). Idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE group_chats
    ADD COLUMN IF NOT EXISTS corp_id uuid REFERENCES entrepreneur_corps(id) ON DELETE CASCADE;

-- Widen chat_type to allow the corp channel (preserve all existing values).
ALTER TABLE group_chats DROP CONSTRAINT IF EXISTS group_chats_chat_type_check;
ALTER TABLE group_chats ADD CONSTRAINT group_chats_chat_type_check
    CHECK (chat_type IN ('custom','ipo','nation','global','lawsuit','entrepreneur_corp'));

-- One chat per corp. Full unique index (multiple NULLs allowed for the
-- non-corp chats) doubles as the ON CONFLICT arbiter below.
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_chats_corp ON group_chats(corp_id);

-- ── ensure_corp_chat — get-or-create the corp's chat (idempotent) ──
CREATE OR REPLACE FUNCTION public.ensure_corp_chat(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     uuid;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_chat_id uuid;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT id INTO v_chat_id FROM group_chats WHERE corp_id = p_corp_id LIMIT 1;
    IF v_chat_id IS NULL THEN
        SELECT id INTO v_fac FROM factions
         WHERE id = v_uid OR linked_user_id = v_uid
         ORDER BY created_at ASC LIMIT 1;
        INSERT INTO group_chats (chat_type, corp_id, name, created_by)
        VALUES ('entrepreneur_corp', p_corp_id,
                left(COALESCE(v_corp.name, 'Corp') || ' — Corp Chat', 100), v_fac)
        ON CONFLICT (corp_id) DO NOTHING;
        SELECT id INTO v_chat_id FROM group_chats WHERE corp_id = p_corp_id LIMIT 1;
    END IF;

    RETURN jsonb_build_object('success', true, 'chat_id', v_chat_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_corp_chat(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
