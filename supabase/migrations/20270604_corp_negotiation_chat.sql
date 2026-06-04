-- ════════════════════════════════════════════════════════════════════
-- 20270604 — Corp negotiation chat (CEO-to-CEO discussion box)
--
-- Both CEOs in an active negotiation can now exchange free-form
-- messages alongside the article drafting surface. Same per-negotiation
-- scoping pattern as court_case_trial_messages — one chat thread per
-- corp_negotiations row, scoped to that row only.
--
-- Shape:
--   * corp_negotiation_messages(id, negotiation_id, faction_id, body,
--     created_at). FK to corp_negotiations cascades on delete; FK to
--     factions SET NULL so deleted authors leave their messages with
--     a NULL faction_id that the read RPC renders as '[deleted]'.
--   * send_corp_negotiation_message(neg_id, corp_id, body) — RPC.
--     Guards via _corp_negotiation_validate_caller (existing helper
--     from 20270571), so only the CEOs of the initiator or
--     counterparty corp can post. Body trimmed, 1–2000 chars.
--   * list_corp_negotiation_messages(neg_id, corp_id) — same gate,
--     returns the messages array plus caller_faction_id so the
--     client can side-align messages (me vs them) without an extra
--     auth round-trip.
--
-- No realtime; the client polls list every few seconds, matching the
-- trial-modal pattern (no Supabase Realtime subscriptions needed,
-- single round-trip per poll). Realtime is a follow-up if poll
-- proves too laggy in practice.
--
-- Apply after 20270603.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.corp_negotiation_messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    negotiation_id  uuid NOT NULL REFERENCES public.corp_negotiations(id) ON DELETE CASCADE,
    faction_id      uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    body            text NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.corp_negotiation_messages IS
    'CEO-to-CEO chat scoped to a corp_negotiations row. One row per message; messages cascade with the parent negotiation. faction_id SET NULL on author delete so the message survives in the audit log with author = NULL (rendered as ''[deleted]'').';

CREATE INDEX IF NOT EXISTS idx_corp_negotiation_messages_neg_created
    ON public.corp_negotiation_messages (negotiation_id, created_at);

ALTER TABLE public.corp_negotiation_messages ENABLE ROW LEVEL SECURITY;
-- No policies. All access via SECURITY DEFINER RPCs below.

-- ── 2. send_corp_negotiation_message ──────────────────────────────
CREATE OR REPLACE FUNCTION public.send_corp_negotiation_message(
    p_negotiation_id uuid,
    p_corp_id        uuid,
    p_body           text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    BODY_MIN CONSTANT int := 1;
    BODY_MAX CONSTANT int := 2000;

    v_check     jsonb;
    v_caller_id uuid;
    v_body      text;
    v_msg_id    uuid;
BEGIN
    IF p_negotiation_id IS NULL OR p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    v_check := public._corp_negotiation_validate_caller(p_negotiation_id, p_corp_id);
    IF NOT (v_check ->> 'ok')::boolean THEN
        RETURN jsonb_build_object('success', false, 'reason', v_check ->> 'reason');
    END IF;
    v_caller_id := (v_check ->> 'caller_faction_id')::uuid;

    v_body := TRIM(COALESCE(p_body, ''));
    IF char_length(v_body) < BODY_MIN THEN
        RETURN jsonb_build_object('success', false, 'reason', 'body_too_short');
    END IF;
    IF char_length(v_body) > BODY_MAX THEN
        RETURN jsonb_build_object('success', false, 'reason', 'body_too_long', 'max', BODY_MAX);
    END IF;

    INSERT INTO public.corp_negotiation_messages
        (negotiation_id, faction_id, body)
    VALUES
        (p_negotiation_id, v_caller_id, v_body)
    RETURNING id INTO v_msg_id;

    RETURN jsonb_build_object('success', true, 'message_id', v_msg_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_corp_negotiation_message(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.send_corp_negotiation_message(uuid, uuid, text) TO authenticated;

-- ── 3. list_corp_negotiation_messages ─────────────────────────────
CREATE OR REPLACE FUNCTION public.list_corp_negotiation_messages(
    p_negotiation_id uuid,
    p_corp_id        uuid
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_check    jsonb;
    v_messages jsonb;
BEGIN
    IF p_negotiation_id IS NULL OR p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    v_check := public._corp_negotiation_validate_caller(p_negotiation_id, p_corp_id);
    IF NOT (v_check ->> 'ok')::boolean THEN
        RETURN jsonb_build_object('success', false, 'reason', v_check ->> 'reason');
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id',         m.id,
            'faction_id', m.faction_id,
            'author_name',
                COALESCE(
                    NULLIF(TRIM(COALESCE(f.leader_first_name, '') || ' ' || COALESCE(f.leader_last_name, '')), ''),
                    f.faction_name,
                    '[deleted]'
                ),
            'faction_name', f.faction_name,
            'body',         m.body,
            'created_at',   m.created_at
        ) ORDER BY m.created_at ASC
    ), '[]'::jsonb)
      INTO v_messages
      FROM public.corp_negotiation_messages m
      LEFT JOIN public.factions f ON f.id = m.faction_id
     WHERE m.negotiation_id = p_negotiation_id;

    RETURN jsonb_build_object(
        'success',           true,
        'caller_faction_id', v_check ->> 'caller_faction_id',
        'messages',          v_messages
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_corp_negotiation_messages(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_corp_negotiation_messages(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
