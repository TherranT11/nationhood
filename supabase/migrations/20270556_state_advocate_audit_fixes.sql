-- ════════════════════════════════════════════════════════════════════
-- 20270556 — State Advocate audit follow-up
--
-- Two fixes flagged by the post-push audit of 20270555:
--
-- (1) Applicant-side pending lookup. politician-career.html added a
--     direct PostgREST query against state_advocate_appointment_
--     requests to drive the "Awaiting Interior Minister" disabled
--     CTA state. 20270555 enables RLS on that table with NO
--     policies (correct RPC-only design, mirrors corp_advocate_
--     offers), so the direct query returns zero rows for the
--     authenticated role — the pending-state UI never triggers.
--     Fix: a tiny SECURITY DEFINER RPC scoped to the caller's own
--     pending request. The frontend swap lives in a sibling commit.
--
-- (2) Abandoned applicant guard. respond_state_advocate_appointment_
--     request re-fetches v_applicant inside the lock to handle
--     stale snapshots, but the SELECT had no abandoned_at filter.
--     A politician who abandons between Seek and the MoI's Approve
--     could become the seated State Advocate — state-party cases
--     would attach to a faction that can't act, leaving trials
--     stalled. Companion fix in the list RPC so abandoned
--     applicants don't even appear in the MoI's pressing-issues
--     queue (defense in depth).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Applicant pending-request RPC ───────────────────────────────
-- Single row or empty result. Auth-gated to the caller's own
-- faction. Returns the request id (so a future UI could deep-link
-- "review your pending request") and the captured snapshot —
-- though today the politician-career CTA only needs to know
-- whether it exists.
CREATE OR REPLACE FUNCTION public.get_pending_state_advocate_request_for_applicant(
    p_faction_id uuid
) RETURNS TABLE (
    request_id          uuid,
    created_at_tick     int,
    has_incumbent       boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    IF v_uid IS NULL OR p_faction_id IS NULL THEN
        RETURN;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.factions
         WHERE id = p_faction_id
           AND (id = v_uid OR linked_user_id = v_uid)
           AND abandoned_at IS NULL
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT r.id, r.created_at_tick, r.incumbent_faction_id IS NOT NULL
      FROM public.state_advocate_appointment_requests r
     WHERE r.applicant_faction_id = p_faction_id
       AND r.status = 'pending'
     LIMIT 1;
END $$;

REVOKE EXECUTE ON FUNCTION public.get_pending_state_advocate_request_for_applicant(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_pending_state_advocate_request_for_applicant(uuid) TO authenticated;

-- ── 2. respond RPC — applicant abandonment guard ───────────────────
-- Replaces the 20270555 body. Only change is the abandoned_at
-- filter on the v_applicant SELECT plus a new failure reason
-- 'applicant_abandoned' for the MoI's UI to surface.
CREATE OR REPLACE FUNCTION public.respond_state_advocate_appointment_request(
    p_request_id uuid,
    p_accept     boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                 uuid := auth.uid();
    v_req                 state_advocate_appointment_requests%ROWTYPE;
    v_pol                 factions%ROWTYPE;
    v_applicant           factions%ROWTYPE;
    v_current_incumbent   uuid;
    v_tick                int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_accept IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_req
      FROM public.state_advocate_appointment_requests
     WHERE id = p_request_id
     FOR UPDATE;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved',
            'status', v_req.status);
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = v_req.reviewer_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND abandoned_at IS NULL
     LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_reviewer');
    END IF;

    PERFORM pg_advisory_xact_lock(555, hashtext(v_req.nation_id::text));

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF NOT p_accept THEN
        UPDATE public.state_advocate_appointment_requests
           SET status = 'rejected', resolved_at_tick = v_tick
         WHERE id = p_request_id;
        RETURN jsonb_build_object('success', true, 'accepted', false);
    END IF;

    -- Applicant fetch. Filtered on abandoned_at so a politician who
    -- abandoned between Seek and Approve can't be installed as the
    -- seated State Advocate (which would route state-party cases to
    -- a faction that can't act).
    SELECT * INTO v_applicant FROM public.factions
     WHERE id = v_req.applicant_faction_id
       AND abandoned_at IS NULL;
    IF v_applicant.id IS NULL THEN
        UPDATE public.state_advocate_appointment_requests
           SET status = 'rejected', resolved_at_tick = v_tick
         WHERE id = p_request_id;
        RETURN jsonb_build_object('success', false, 'reason', 'applicant_abandoned');
    END IF;
    IF v_applicant.politician_state_prosecutor_at_tick IS NOT NULL THEN
        UPDATE public.state_advocate_appointment_requests
           SET status = 'approved', resolved_at_tick = v_tick
         WHERE id = p_request_id;
        RETURN jsonb_build_object('success', true, 'accepted', true,
            'no_op', true, 'reason', 'applicant_already_appointed');
    END IF;

    SELECT id INTO v_current_incumbent
      FROM public.factions
     WHERE nation_id = v_req.nation_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND politician_state_prosecutor_at_tick IS NOT NULL
       AND id <> v_applicant.id
     LIMIT 1;

    PERFORM public._complete_state_advocate_appointment(
        v_req.applicant_faction_id,
        v_current_incumbent,
        v_req.id,
        v_tick);
    RETURN jsonb_build_object('success', true, 'accepted', true,
        'displaced', v_current_incumbent IS NOT NULL);
END $$;

REVOKE EXECUTE ON FUNCTION public.respond_state_advocate_appointment_request(uuid, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.respond_state_advocate_appointment_request(uuid, boolean) TO authenticated;

-- ── 3. list RPC — filter abandoned applicants ──────────────────────
-- Replaces the 20270555 body. Only change is the abandoned_at
-- filter on the applicant join so the MoI's pressing-issues queue
-- doesn't surface dead-end requests. Defense in depth with the
-- respond guard above.
CREATE OR REPLACE FUNCTION public.list_pending_state_advocate_requests_for_reviewer(
    p_faction_id uuid
) RETURNS TABLE (
    request_id              uuid,
    applicant_faction_id    uuid,
    applicant_name          text,
    applicant_standing      int,
    applicant_reputation    int,
    applicant_credibility   int,
    incumbent_name          text,
    created_at_tick         int
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    IF v_uid IS NULL OR p_faction_id IS NULL THEN
        RETURN;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.factions
         WHERE id = p_faction_id
           AND (id = v_uid OR linked_user_id = v_uid)
           AND abandoned_at IS NULL
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        r.id,
        r.applicant_faction_id,
        NULLIF(btrim(COALESCE(a.leader_first_name, '') || ' ' || COALESCE(a.leader_last_name, '')), '')
            ::text AS applicant_name,
        r.applicant_standing,
        r.applicant_reputation,
        r.applicant_credibility,
        NULLIF(btrim(COALESCE(i.leader_first_name, '') || ' ' || COALESCE(i.leader_last_name, '')), '')
            ::text AS incumbent_name,
        r.created_at_tick
      FROM public.state_advocate_appointment_requests r
      JOIN public.factions a ON a.id = r.applicant_faction_id AND a.abandoned_at IS NULL
 LEFT JOIN public.factions i ON i.id = r.incumbent_faction_id
     WHERE r.reviewer_faction_id = p_faction_id
       AND r.status = 'pending'
     ORDER BY r.created_at_tick ASC, r.id ASC;
END $$;

REVOKE EXECUTE ON FUNCTION public.list_pending_state_advocate_requests_for_reviewer(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_pending_state_advocate_requests_for_reviewer(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
