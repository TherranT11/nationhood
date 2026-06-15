-- ════════════════════════════════════════════════════════════════════
-- 20270940 — Company Chat: a per-corp message board for owner + staff
--
-- An append-only chat scoped to one corporation, mirroring the
-- job_interview_messages shape (20270799). Members are the corp's owner
-- and its hired employees; only members read or post, both enforced by
-- one membership predicate (_corp_chat_member) reused by the RLS read
-- policy and the send RPC.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.corp_chat_messages (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id           uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    sender_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    body              text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
    created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS corp_chat_messages_corp_idx
    ON public.corp_chat_messages (corp_id, created_at);

-- ── Membership — one source for "owner or hired employee here" ────────
CREATE OR REPLACE FUNCTION public._corp_chat_member(p_corp_id uuid, p_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT p_uid IS NOT NULL AND (
        EXISTS (
            SELECT 1 FROM entrepreneur_corps c
              JOIN factions f ON f.id = c.owner_faction_id
             WHERE c.id = p_corp_id
               AND (f.id = p_uid OR f.linked_user_id = p_uid)
        )
        OR EXISTS (
            SELECT 1 FROM job_applicants a
              JOIN factions f ON f.id = a.applicant_faction_id
             WHERE a.corp_id = p_corp_id
               AND a.status = 'hired'
               AND (f.id = p_uid OR f.linked_user_id = p_uid)
        )
    );
$$;

ALTER TABLE public.corp_chat_messages ENABLE ROW LEVEL SECURITY;
-- Members read; writes go only through send_corp_chat_message.
DROP POLICY IF EXISTS "Members read corp chat" ON public.corp_chat_messages;
CREATE POLICY "Members read corp chat" ON public.corp_chat_messages
    FOR SELECT TO authenticated
    USING (_corp_chat_member(corp_id, auth.uid()));

-- ── send_corp_chat_message — a member posts a line ───────────────────
CREATE OR REPLACE FUNCTION public.send_corp_chat_message(p_corp_id uuid, p_body text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_body   text;
    v_sender uuid;
    v_id     uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    v_body := btrim(COALESCE(p_body, ''));
    IF v_body = '' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'empty');
    END IF;
    IF length(v_body) > 2000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'too_long');
    END IF;
    IF NOT _corp_chat_member(p_corp_id, v_uid) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    -- The caller's faction that is actually a member here — the owner
    -- faction or their hired-employee faction — is the sender.
    SELECT f.id INTO v_sender FROM factions f
     WHERE (f.id = v_uid OR f.linked_user_id = v_uid)
       AND f.abandoned_at IS NULL
       AND (
         f.id = (SELECT owner_faction_id FROM entrepreneur_corps WHERE id = p_corp_id)
         OR EXISTS (SELECT 1 FROM job_applicants a
                     WHERE a.corp_id = p_corp_id AND a.status = 'hired'
                       AND a.applicant_faction_id = f.id)
       )
     ORDER BY f.created_at ASC
     LIMIT 1;
    IF v_sender IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    INSERT INTO corp_chat_messages (corp_id, sender_faction_id, body)
    VALUES (p_corp_id, v_sender, v_body)
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.send_corp_chat_message(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.send_corp_chat_message(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
