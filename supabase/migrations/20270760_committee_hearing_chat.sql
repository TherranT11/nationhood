-- ════════════════════════════════════════════════════════════════════
-- 20270760 — Committee hearing deliberation chat
--
-- During an open hearing, committee members get a chat surface to
-- respond to witness testimony in real-ish time. Replaces the static
-- "Hearing in session" disabled banner on committee.html with a
-- composer + message list visible to all viewers (deliberation is
-- public-record territory, mirroring the existing public-read posture
-- on committee_hearings / committee_hearing_testimonies from 20270499).
--
-- Schema:
--   committee_hearing_chat_messages   (hearing_id, sender, body, tick)
--   PRIMARY KEY (id); index (hearing_id, created_at) for chronological
--   per-hearing fetch.
--
-- RLS posture matches the rest of the hearing surface:
--   SELECT — any authenticated user (committee deliberation is public)
--   INSERT/UPDATE/DELETE — service_role only; writes funnel through
--     the SECURITY DEFINER RPC below.
--
-- RPC: committee_hearing_chat_post(p_faction_id, p_hearing_id, p_body)
--   Gates: caller owns p_faction_id, faction is a politician seated on
--   the hearing's committee, hearing is still open, body 1-400 chars.
--
-- Realtime broadcast is out of scope for v1 — clients refresh on page
-- load + after their own post. Adding a Supabase subscription is a
-- follow-up if the latency matters.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.committee_hearing_chat_messages (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hearing_id        uuid NOT NULL REFERENCES committee_hearings(id) ON DELETE CASCADE,
    -- sender goes NULL on the writer's faction deletion; the message
    -- body stays so the transcript isn't punched full of holes. Same
    -- ON DELETE SET NULL pattern as committee_hearing_testimonies.
    sender_faction_id uuid REFERENCES factions(id) ON DELETE SET NULL,
    body              text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 400),
    created_at_tick   int  NOT NULL,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS committee_hearing_chat_messages_hearing_idx
    ON public.committee_hearing_chat_messages (hearing_id, created_at);

COMMENT ON TABLE public.committee_hearing_chat_messages IS
    'Committee-side deliberation chat scoped to a single open hearing. Writers must be seated members of the committee (enforced via committee_hearing_chat_post RPC); reads are public to authenticated users, mirroring 20270499 hearing/testimony RLS. 20270760.';

-- ── 2. RLS ──────────────────────────────────────────────────────
ALTER TABLE public.committee_hearing_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS committee_hearing_chat_messages_select ON public.committee_hearing_chat_messages;
CREATE POLICY committee_hearing_chat_messages_select ON public.committee_hearing_chat_messages
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS committee_hearing_chat_messages_service_all ON public.committee_hearing_chat_messages;
CREATE POLICY committee_hearing_chat_messages_service_all ON public.committee_hearing_chat_messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 3. committee_hearing_chat_post ──────────────────────────────
CREATE OR REPLACE FUNCTION public.committee_hearing_chat_post(
    p_faction_id uuid,
    p_hearing_id uuid,
    p_body       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_hearing committee_hearings%ROWTYPE;
    v_body    text;
    v_tick    int;
    v_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_hearing_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_hearing FROM committee_hearings WHERE id = p_hearing_id;
    IF v_hearing.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_not_found');
    END IF;
    IF v_hearing.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_closed');
    END IF;

    -- Caller must be seated on the committee whose hearing this is.
    PERFORM 1 FROM committee_members
     WHERE committee_id          = v_hearing.committee_id
       AND politician_faction_id = v_pol.id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    v_body := btrim(COALESCE(p_body, ''));
    IF length(v_body) < 1 OR length(v_body) > 400 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_body');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO committee_hearing_chat_messages (
        hearing_id, sender_faction_id, body, created_at_tick
    ) VALUES (
        v_hearing.id, v_pol.id, v_body, v_tick
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success',     true,
        'message_id',  v_id,
        'sent_at_tick', v_tick
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.committee_hearing_chat_post(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_hearing_chat_post(uuid, uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
