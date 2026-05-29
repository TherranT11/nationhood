-- ════════════════════════════════════════════════════════════════════
-- PARTY CHAT — per-movement_party message wall
-- ════════════════════════════════════════════════════════════════════
-- Reuses group_chats / group_chat_messages the same way corps did in
-- 20270222 — new scope column on group_chats + new chat_type value +
-- a get-or-create RPC. Differs from corp_chat in one place: party chats
-- are members-only ("visible to party members only" per the surface
-- copy), so both the ensure and the send RPC gate on the caller being
-- a politician whose politician_party_id matches the chat's party.
--
-- Reads stay practically scoped: group_chat_messages.RLS is already
-- USING(true), so the privacy guarantee is "you can't read messages
-- without the chat_id, and you can't get the chat_id without going
-- through ensure_party_chat" — same model corp_chat ships with. If
-- the threat model later needs a hard RLS read gate, the membership
-- predicate below is the obvious source for it.
--
-- Sender id in group_chat_messages = the politician faction id of the
-- caller (resolved via id OR linked_user_id). The leader/deputy/whip
-- badge UI on the read side does name-matching against the chat's
-- party.leader_first_name + leader_last_name (and the deputy/whip
-- equivalents from 20270376), so this side stays politician-faction-
-- shaped and the badge rendering stays purely a UI concern.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. group_chats.party_id + widened chat_type ──
ALTER TABLE group_chats
    ADD COLUMN IF NOT EXISTS party_id uuid REFERENCES factions(id) ON DELETE CASCADE;

ALTER TABLE group_chats DROP CONSTRAINT IF EXISTS group_chats_chat_type_check;
ALTER TABLE group_chats ADD CONSTRAINT group_chats_chat_type_check
    CHECK (chat_type IN ('custom','ipo','nation','global','lawsuit','entrepreneur_corp','movement_party'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_chats_party
    ON group_chats(party_id) WHERE party_id IS NOT NULL;

-- ── 2. ensure_party_chat — get-or-create, membership-gated ──
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
        ON CONFLICT (party_id) DO NOTHING;
        SELECT id INTO v_chat_id FROM group_chats WHERE party_id = p_party_id LIMIT 1;
    END IF;

    RETURN jsonb_build_object('success', true, 'chat_id', v_chat_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_party_chat(uuid) TO authenticated;

-- ── 3. send_party_message — membership-gated insert ──
-- Sender id in the message row is the caller's politician faction —
-- the same row whose politician_party_id qualified them for membership.
-- The role-badge UI on the read side joins on this id to pull the
-- sender's name + age and compares against the party's leader/deputy/
-- whip names. If a member somehow holds two politician factions, the
-- ORDER BY created_at ASC LIMIT 1 picks the older one as canonical.
CREATE OR REPLACE FUNCTION public.send_party_message(
    p_chat_id uuid,
    p_message text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_chat      group_chats%ROWTYPE;
    v_sender_id uuid;
    v_message   text := btrim(COALESCE(p_message, ''));
    v_tick      int;
    v_msg_id    uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF length(v_message) < 1 OR length(v_message) > 2000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_message');
    END IF;

    SELECT * INTO v_chat FROM group_chats WHERE id = p_chat_id;
    IF v_chat.id IS NULL OR v_chat.chat_type <> 'movement_party' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'chat_not_found');
    END IF;

    SELECT id INTO v_sender_id FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = v_chat.party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_sender_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO group_chat_messages (chat_id, sender_id, message_text, sent_at_tick)
    VALUES (p_chat_id, v_sender_id, v_message, COALESCE(v_tick, 0))
    RETURNING id INTO v_msg_id;

    RETURN jsonb_build_object('success', true, 'message_id', v_msg_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_party_message(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
