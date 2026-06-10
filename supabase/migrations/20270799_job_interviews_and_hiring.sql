-- ════════════════════════════════════════════════════════════════════
-- 20270799 — Applicant lifecycle: REJECT / HIRE + interview chat
--
-- The owner's applicant list grows teeth. Every applicant row gets
-- [REJECT] and [HIRE]; player applicants additionally get
-- [INTERVIEW], which opens a private chat titled
-- "JOB INTERVIEW — {Role Title} for {Corp Name}". In the chat the
-- interviewer (corp owner) can [HIRE] or [CLOSE OUT]; the interviewee
-- can only chat.
--
--   factions: + biz_employer_corp_id / biz_job_title /
--   biz_salary_yearly / biz_hired_at_tick — a hired player's
--   employment record. The home page derives Occupation and Salary
--   from these. (Payroll — the per-tick wage transfer from corp
--   treasury — is deliberately NOT in this migration; flagged as the
--   next economy step.)
--
--   job_interviews: one open interview per applicant (partial unique).
--   Role title and corp name are read through the opening_id /
--   corp_id FKs — not snapshotted. RLS: participants only (owner or
--   applicant faction), unlike the public openings board.
--
--   job_interview_messages: append-only chat lines, participant-read
--   via the parent interview, written through send_interview_message.
--
--   RPCs (all SECURITY DEFINER, owner = corp owner businessman):
--     reject_job_applicant  owner-only; applied → rejected; closes
--                           any open interview.
--     hire_job_applicant    owner-only; applied + opening open →
--                           applicant hired, opening filled,
--                           employee_count + 1, open interviews
--                           closed. Player hires also stamp the
--                           faction employment columns and append a
--                           career-history entry.
--     start_job_interview   owner-only, player applicants only;
--                           idempotent — returns the existing open
--                           interview if one exists.
--     send_interview_message either participant, open interviews only.
--     close_job_interview   owner-only ([CLOSE OUT]).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Employment record on the businessman faction ──────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS biz_employer_corp_id uuid REFERENCES public.entrepreneur_corps(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS biz_job_title        text,
    ADD COLUMN IF NOT EXISTS biz_salary_yearly    bigint,
    ADD COLUMN IF NOT EXISTS biz_hired_at_tick    int;

-- ── job_interviews ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_interviews (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id         uuid NOT NULL REFERENCES public.job_applicants(id) ON DELETE CASCADE,
    opening_id           uuid NOT NULL REFERENCES public.job_openings(id)   ON DELETE CASCADE,
    corp_id              uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    owner_faction_id     uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    applicant_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    status               text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at_tick      int  NOT NULL DEFAULT 0,
    created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS job_interviews_one_open_per_applicant
    ON public.job_interviews (applicant_id)
    WHERE status = 'open';

CREATE INDEX IF NOT EXISTS job_interviews_applicant_faction_idx
    ON public.job_interviews (applicant_faction_id) WHERE status = 'open';

ALTER TABLE public.job_interviews ENABLE ROW LEVEL SECURITY;

-- Private to the two participants — interviews are not public game
-- data the way the openings board is.
DROP POLICY IF EXISTS "Participants read" ON public.job_interviews;
CREATE POLICY "Participants read" ON public.job_interviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM factions f
             WHERE f.id IN (owner_faction_id, applicant_faction_id)
               AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );

-- ── job_interview_messages ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_interview_messages (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id      uuid NOT NULL REFERENCES public.job_interviews(id) ON DELETE CASCADE,
    sender_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    body              text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_interview_messages_interview_idx
    ON public.job_interview_messages (interview_id, created_at);

ALTER TABLE public.job_interview_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants read" ON public.job_interview_messages;
CREATE POLICY "Participants read" ON public.job_interview_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_interviews ji
            JOIN factions f ON f.id IN (ji.owner_faction_id, ji.applicant_faction_id)
             WHERE ji.id = interview_id
               AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );

-- ── _job_board_owner_check (internal) ─────────────────────────────
-- Shared guard for the owner-side RPCs: resolves the applicant, its
-- opening and corp, and verifies the caller is the corp's businessman
-- owner (not arrested). Returns a reason string, or NULL when the
-- caller may proceed.
CREATE OR REPLACE FUNCTION public._job_board_owner_check(
    p_applicant_id uuid,
    p_uid          uuid,
    OUT o_reason    text,
    OUT o_applicant job_applicants,
    OUT o_opening   job_openings,
    OUT o_corp      entrepreneur_corps,
    OUT o_owner     factions
) LANGUAGE plpgsql
AS $$
BEGIN
    IF p_uid IS NULL THEN o_reason := 'not_authenticated'; RETURN; END IF;
    IF p_applicant_id IS NULL THEN o_reason := 'invalid_arguments'; RETURN; END IF;

    SELECT * INTO o_applicant FROM job_applicants WHERE id = p_applicant_id FOR UPDATE;
    IF o_applicant.id IS NULL THEN o_reason := 'not_found'; RETURN; END IF;

    SELECT * INTO o_opening FROM job_openings WHERE id = o_applicant.opening_id FOR UPDATE;
    SELECT * INTO o_corp    FROM entrepreneur_corps WHERE id = o_opening.corp_id;

    SELECT * INTO o_owner FROM factions
     WHERE id = o_corp.owner_faction_id
       AND (id = p_uid OR linked_user_id = p_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF o_owner.id IS NULL THEN o_reason := 'not_owner'; RETURN; END IF;
    IF lower(COALESCE(o_owner.status, '')) = 'arrested' THEN
        o_reason := 'arrested'; RETURN;
    END IF;
    o_reason := NULL;
END $$;

REVOKE EXECUTE ON FUNCTION public._job_board_owner_check(uuid, uuid) FROM PUBLIC;

-- ── reject_job_applicant ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_job_applicant(p_applicant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v RECORD;
BEGIN
    SELECT * INTO v FROM _job_board_owner_check(p_applicant_id, auth.uid());
    IF v.o_reason IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', v.o_reason);
    END IF;
    IF (v.o_applicant).status <> 'applied' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_applied',
            'status', (v.o_applicant).status);
    END IF;

    UPDATE job_applicants SET status = 'rejected' WHERE id = p_applicant_id;
    UPDATE job_interviews SET status = 'closed'
     WHERE applicant_id = p_applicant_id AND status = 'open';

    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.reject_job_applicant(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.reject_job_applicant(uuid) TO authenticated;

-- ── hire_job_applicant ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.hire_job_applicant(p_applicant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick int;
    v RECORD;
BEGIN
    SELECT * INTO v FROM _job_board_owner_check(p_applicant_id, auth.uid());
    IF v.o_reason IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', v.o_reason);
    END IF;
    IF (v.o_applicant).status <> 'applied' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_applied',
            'status', (v.o_applicant).status);
    END IF;
    IF (v.o_opening).status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'opening_not_open',
            'status', (v.o_opening).status);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE job_applicants SET status = 'hired'  WHERE id = p_applicant_id;
    UPDATE job_openings   SET status = 'filled' WHERE id = (v.o_opening).id;
    UPDATE entrepreneur_corps
       SET employee_count = COALESCE(employee_count, 1) + 1
     WHERE id = (v.o_corp).id;
    -- The role is filled: every candidate's open interview closes,
    -- not just the winner's — otherwise the losers keep orphaned
    -- chat banners on a posting that no longer exists.
    UPDATE job_interviews SET status = 'closed'
     WHERE opening_id = (v.o_opening).id AND status = 'open';

    -- A real player: stamp the employment record and their career
    -- history. Payroll (per-tick wage out of corp treasury) is the
    -- next economy step — not wired here.
    IF (v.o_applicant).applicant_faction_id IS NOT NULL THEN
        UPDATE factions
           SET biz_employer_corp_id = (v.o_corp).id,
               biz_job_title        = (v.o_opening).title,
               biz_salary_yearly    = (v.o_opening).salary_yearly,
               biz_hired_at_tick    = v_tick,
               biz_career_history   = COALESCE(biz_career_history, '[]'::jsonb)
                   || jsonb_build_array(jsonb_build_object(
                          'year',  2000 + (v_tick / 12),
                          'label', 'Hired as ' || (v.o_opening).title,
                          'sub',   (v.o_corp).name))
         WHERE id = (v.o_applicant).applicant_faction_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'hired',   (v.o_applicant).name,
        'title',   (v.o_opening).title
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.hire_job_applicant(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.hire_job_applicant(uuid) TO authenticated;

-- ── start_job_interview ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.start_job_interview(p_applicant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick int;
    v_id   uuid;
    v RECORD;
BEGIN
    SELECT * INTO v FROM _job_board_owner_check(p_applicant_id, auth.uid());
    IF v.o_reason IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', v.o_reason);
    END IF;
    IF (v.o_applicant).applicant_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'npc_applicant');
    END IF;
    IF (v.o_applicant).status <> 'applied' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_applied',
            'status', (v.o_applicant).status);
    END IF;
    IF (v.o_opening).status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'opening_not_open');
    END IF;

    -- Idempotent: reopening the chat returns the existing interview.
    SELECT id INTO v_id FROM job_interviews
     WHERE applicant_id = p_applicant_id AND status = 'open';
    IF v_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'interview_id', v_id, 'existing', true);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO job_interviews (
        applicant_id, opening_id, corp_id, owner_faction_id,
        applicant_faction_id, created_at_tick
    ) VALUES (
        p_applicant_id, (v.o_opening).id, (v.o_corp).id, (v.o_owner).id,
        (v.o_applicant).applicant_faction_id, COALESCE(v_tick, 0)
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'interview_id', v_id, 'existing', false);
END $$;

REVOKE EXECUTE ON FUNCTION public.start_job_interview(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_job_interview(uuid) TO authenticated;

-- ── send_interview_message ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_interview_message(
    p_interview_id uuid,
    p_body         text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_interview job_interviews%ROWTYPE;
    v_sender    uuid;
    v_body      text := TRIM(COALESCE(p_body, ''));
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF v_body = '' OR length(v_body) > 2000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_body');
    END IF;

    SELECT * INTO v_interview FROM job_interviews WHERE id = p_interview_id;
    IF v_interview.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_found');
    END IF;
    IF v_interview.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'closed');
    END IF;

    -- Which side of the table is the caller on?
    SELECT f.id INTO v_sender FROM factions f
     WHERE f.id IN (v_interview.owner_faction_id, v_interview.applicant_faction_id)
       AND (f.id = v_uid OR f.linked_user_id = v_uid)
       AND f.abandoned_at IS NULL
     LIMIT 1;
    IF v_sender IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_participant');
    END IF;

    INSERT INTO job_interview_messages (interview_id, sender_faction_id, body)
    VALUES (p_interview_id, v_sender, v_body);

    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.send_interview_message(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.send_interview_message(uuid, text) TO authenticated;

-- ── close_job_interview ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.close_job_interview(p_interview_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_interview job_interviews%ROWTYPE;
    v_is_owner  boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_interview FROM job_interviews WHERE id = p_interview_id FOR UPDATE;
    IF v_interview.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_found');
    END IF;
    IF v_interview.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'closed');
    END IF;

    -- [CLOSE OUT] is the interviewer's button.
    SELECT EXISTS (
        SELECT 1 FROM factions f
         WHERE f.id = v_interview.owner_faction_id
           AND (f.id = v_uid OR f.linked_user_id = v_uid)
    ) INTO v_is_owner;
    IF NOT v_is_owner THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    UPDATE job_interviews SET status = 'closed' WHERE id = p_interview_id;

    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.close_job_interview(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.close_job_interview(uuid) TO authenticated;

-- ── withdraw_job_opening — also close its interviews ──────────────
-- Body byte-faithful to 20270796 except the final UPDATE: a
-- withdrawn posting closes its open interviews so interviewees
-- aren't left chatting into a role that no longer exists.
CREATE OR REPLACE FUNCTION public.withdraw_job_opening(p_opening_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_opening job_openings%ROWTYPE;
    v_owner   uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_opening FROM job_openings WHERE id = p_opening_id FOR UPDATE;
    IF v_opening.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_found');
    END IF;
    IF v_opening.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_open',
            'status', v_opening.status);
    END IF;

    SELECT ec.owner_faction_id INTO v_owner
      FROM entrepreneur_corps ec
      JOIN factions f ON f.id = ec.owner_faction_id
     WHERE ec.id = v_opening.corp_id
       AND (f.id = v_uid OR f.linked_user_id = v_uid)
       AND f.abandoned_at IS NULL;
    IF v_owner IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    UPDATE job_openings SET status = 'withdrawn' WHERE id = p_opening_id;
    UPDATE job_interviews SET status = 'closed'
     WHERE opening_id = p_opening_id AND status = 'open';

    RETURN jsonb_build_object('success', true);
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
