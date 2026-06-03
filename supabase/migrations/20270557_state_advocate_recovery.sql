-- ════════════════════════════════════════════════════════════════════
-- 20270557 — State Advocate recovery (defensive re-apply of 20270555)
--
-- User reported:
--   ERROR:  42P01: relation "state_advocate_appointment_requests"
--           does not exist
--   CONTEXT: compilation of PL/pgSQL function
--           "respond_state_advocate_appointment_request" near line 4
--
-- The function exists but the table doesn't. That's the signature of
-- 20270556 having applied (CREATE OR REPLACE FUNCTION succeeds with
-- a missing referenced table — PL/pgSQL compiles lazily on first
-- call) while 20270555 (which defines the table + four other
-- functions + the trigger) didn't apply.
--
-- Rather than guess at the root cause, this migration re-emits every
-- DDL statement from 20270555 in idempotent form so a partial-apply
-- recovers cleanly:
--   • CREATE TABLE IF NOT EXISTS    — no-op if 20270555 succeeded
--   • CREATE INDEX IF NOT EXISTS    — same
--   • ALTER TABLE … ENABLE RLS      — idempotent
--   • CREATE OR REPLACE FUNCTION    — overwrites with the canonical body
--   • DROP TRIGGER IF EXISTS … CREATE TRIGGER — idempotent
--   • Backfill DO block             — idempotent (loop helper short-circuits)
--
-- Function bodies are byte-identical to 20270555's. The seek RPC
-- here matches 20270555's body, not 20270556's (20270556 only
-- touched respond + list + added get_pending — those bodies live in
-- 20270556 and aren't re-emitted here). After this migration applies
-- the surface is exactly what 20270555 + 20270556 together intended.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Request table (idempotent) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.state_advocate_appointment_requests (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id                uuid NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    applicant_faction_id     uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    reviewer_faction_id      uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    incumbent_faction_id     uuid          REFERENCES public.factions(id) ON DELETE SET NULL,
    status                   text NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'approved', 'rejected')),
    applicant_standing       int  NOT NULL,
    applicant_reputation     int  NOT NULL,
    applicant_credibility    int  NOT NULL,
    created_at_tick          int  NOT NULL,
    resolved_at_tick         int
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sa_req_one_pending_per_applicant
    ON public.state_advocate_appointment_requests (applicant_faction_id)
 WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS idx_sa_req_one_pending_per_nation
    ON public.state_advocate_appointment_requests (nation_id)
 WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_sa_req_reviewer_pending
    ON public.state_advocate_appointment_requests (reviewer_faction_id, status);

ALTER TABLE public.state_advocate_appointment_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.state_advocate_appointment_requests IS
    'Pending [Seek Appointment] requests routed to a nation''s Minister of the Interior when a State Advocate appointment needs ministerial approval. RPC-only writes; reads via list_pending_state_advocate_requests_for_reviewer + get_pending_state_advocate_request_for_applicant.';

-- ── 2. _attach_state_advocate_to_trial (idempotent re-create) ──────
CREATE OR REPLACE FUNCTION public._attach_state_advocate_to_trial(
    p_trial_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_trial   court_case_trials%ROWTYPE;
    v_draft   court_case_drafts%ROWTYPE;
    v_sa_id   uuid;
BEGIN
    SELECT * INTO v_trial FROM public.court_case_trials WHERE id = p_trial_id;
    IF v_trial.id IS NULL OR v_trial.status <> 'pre_trial' THEN
        RETURN;
    END IF;

    SELECT * INTO v_draft FROM public.court_case_drafts WHERE id = v_trial.case_draft_id;
    IF v_draft.id IS NULL THEN
        RETURN;
    END IF;

    IF v_draft.plaintiff_party_type <> 'state'
       AND v_draft.defendant_party_type <> 'state' THEN
        RETURN;
    END IF;

    SELECT id INTO v_sa_id
      FROM public.factions
     WHERE nation_id = v_trial.nation_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND politician_state_prosecutor_at_tick IS NOT NULL
     LIMIT 1;
    IF v_sa_id IS NULL THEN
        RETURN;
    END IF;

    IF v_draft.plaintiff_party_type = 'state'
       AND v_trial.plaintiff_advocate_id IS NULL THEN
        UPDATE public.court_case_trials
           SET plaintiff_advocate_id = v_sa_id
         WHERE id = v_trial.id;
    END IF;

    IF v_draft.defendant_party_type = 'state'
       AND v_trial.defendant_advocate_id IS NULL THEN
        UPDATE public.court_case_trials
           SET defendant_advocate_id = v_sa_id
         WHERE id = v_trial.id;
    END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public._attach_state_advocate_to_trial(uuid) FROM PUBLIC;

-- ── 3. Trigger on court_case_trials (idempotent re-create) ─────────
CREATE OR REPLACE FUNCTION public._trg_attach_state_advocate_to_trial()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    PERFORM public._attach_state_advocate_to_trial(NEW.id);
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_attach_state_advocate ON public.court_case_trials;
CREATE TRIGGER trg_attach_state_advocate
    AFTER INSERT ON public.court_case_trials
    FOR EACH ROW EXECUTE FUNCTION public._trg_attach_state_advocate_to_trial();

-- ── 4. _complete_state_advocate_appointment (idempotent re-create) ─
CREATE OR REPLACE FUNCTION public._complete_state_advocate_appointment(
    p_applicant_id  uuid,
    p_incumbent_id  uuid,
    p_request_id    uuid,
    p_tick          int
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_applicant   factions%ROWTYPE;
    v_incumbent   factions%ROWTYPE;
    v_nation_nm   text;
    v_app_name    text;
    v_inc_name    text;
    r_trial       record;
BEGIN
    SELECT * INTO v_applicant FROM public.factions WHERE id = p_applicant_id;
    IF v_applicant.id IS NULL THEN
        RAISE EXCEPTION 'applicant_not_found';
    END IF;

    IF p_incumbent_id IS NOT NULL THEN
        SELECT * INTO v_incumbent FROM public.factions WHERE id = p_incumbent_id;
        UPDATE public.factions
           SET politician_state_prosecutor_at_tick = NULL
         WHERE id = p_incumbent_id;
        UPDATE public.court_case_trials
           SET plaintiff_advocate_id = NULL
         WHERE nation_id = v_applicant.nation_id
           AND status = 'pre_trial'
           AND plaintiff_advocate_id = p_incumbent_id;
        UPDATE public.court_case_trials
           SET defendant_advocate_id = NULL
         WHERE nation_id = v_applicant.nation_id
           AND status = 'pre_trial'
           AND defendant_advocate_id = p_incumbent_id;
    END IF;

    UPDATE public.factions
       SET politician_state_prosecutor_at_tick = COALESCE(p_tick, 0),
           politician_standing      = COALESCE(politician_standing,      1) + 3,
           political_capital        = COALESCE(political_capital,        0) + 7
     WHERE id = p_applicant_id;

    FOR r_trial IN
        SELECT t.id
          FROM public.court_case_trials t
          JOIN public.court_case_drafts d ON d.id = t.case_draft_id
         WHERE t.nation_id = v_applicant.nation_id
           AND t.status    = 'pre_trial'
           AND ((d.plaintiff_party_type = 'state' AND t.plaintiff_advocate_id IS NULL)
             OR (d.defendant_party_type = 'state' AND t.defendant_advocate_id IS NULL))
    LOOP
        PERFORM public._attach_state_advocate_to_trial(r_trial.id);
    END LOOP;

    IF p_request_id IS NOT NULL THEN
        UPDATE public.state_advocate_appointment_requests
           SET status = 'approved', resolved_at_tick = COALESCE(p_tick, 0)
         WHERE id = p_request_id;
    END IF;

    v_app_name := btrim(COALESCE(v_applicant.leader_first_name, '') || ' ' || COALESCE(v_applicant.leader_last_name, ''));
    IF length(v_app_name) = 0 THEN
        v_app_name := COALESCE(v_applicant.faction_name, 'A politician');
    END IF;
    SELECT name INTO v_nation_nm FROM public.nations WHERE id = v_applicant.nation_id;

    INSERT INTO public.event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_applicant.nation_id, v_applicant.id,
        'State Advocate Appointed',
        v_app_name
            || ' has been appointed State Advocate of '
            || COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation')
            || ', charged with pursuing cases on behalf of the people.',
        'politician', 'politician_state_advocate_appt',
        COALESCE(p_tick, 0)
    );

    IF p_incumbent_id IS NOT NULL AND v_incumbent.id IS NOT NULL THEN
        v_inc_name := btrim(COALESCE(v_incumbent.leader_first_name, '') || ' ' || COALESCE(v_incumbent.leader_last_name, ''));
        IF length(v_inc_name) = 0 THEN
            v_inc_name := COALESCE(v_incumbent.faction_name, 'The previous State Advocate');
        END IF;
        INSERT INTO public.event_log (
            nation_id, faction_id,
            event_name, description_used,
            category, trigger_key,
            fired_at_tick
        ) VALUES (
            v_applicant.nation_id, v_incumbent.id,
            'State Advocate Replaced',
            v_inc_name || ' has been replaced as State Advocate by ' || v_app_name || '.',
            'politician', 'politician_state_advocate_displaced',
            COALESCE(p_tick, 0)
        );
    END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public._complete_state_advocate_appointment(uuid, uuid, uuid, int) FROM PUBLIC;

-- ── 5. politician_seek_state_prosecutor_appointment (re-emit) ──────
-- 20270555's body, byte-identical. 20270556 didn't touch this RPC.
CREATE OR REPLACE FUNCTION public.politician_seek_state_prosecutor_appointment(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_tick         int;
    v_incumbent    factions%ROWTYPE;
    v_moi_id       uuid;
    v_existing     state_advocate_appointment_requests%ROWTYPE;
    v_tenure       int;
    v_request_id   uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    PERFORM pg_advisory_xact_lock(555, hashtext(v_pol.nation_id::text));

    IF v_pol.bar_admitted_nation_id IS NULL
       OR v_pol.bar_admitted_nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;
    IF v_pol.politician_experienced_advocate_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_experienced_advocate');
    END IF;
    IF COALESCE(v_pol.politician_reputation, 0) < 35 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'reputation_too_low',
            'reputation', COALESCE(v_pol.politician_reputation, 0), 'required', 35);
    END IF;
    IF COALESCE(v_pol.political_capital, 0) < 25 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'political_capital_too_low',
            'political_capital', COALESCE(v_pol.political_capital, 0), 'required', 25);
    END IF;
    IF v_pol.politician_state_prosecutor_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_appointed');
    END IF;

    SELECT * INTO v_existing
      FROM public.state_advocate_appointment_requests
     WHERE applicant_faction_id = v_pol.id
       AND status = 'pending'
     LIMIT 1;
    IF v_existing.id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'pending', true,
            'already_pending', true, 'request_id', v_existing.id);
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT * INTO v_incumbent
      FROM public.factions
     WHERE nation_id = v_pol.nation_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND politician_state_prosecutor_at_tick IS NOT NULL
     LIMIT 1;

    SELECT party_id INTO v_moi_id
      FROM public.ministries
     WHERE nation_id = v_pol.nation_id
       AND ministry_key = 'interior'
       AND is_active = true
       AND party_id IS NOT NULL
     ORDER BY created_at DESC
     LIMIT 1;

    IF v_incumbent.id IS NULL AND v_moi_id IS NULL THEN
        PERFORM public._complete_state_advocate_appointment(
            v_pol.id, NULL, NULL, v_tick);
        RETURN jsonb_build_object('success', true,
            'appointed', true, 'displaced', false, 'at_tick', v_tick);
    END IF;

    IF v_moi_id IS NOT NULL THEN
        INSERT INTO public.state_advocate_appointment_requests (
            nation_id, applicant_faction_id, reviewer_faction_id,
            incumbent_faction_id, status,
            applicant_standing, applicant_reputation, applicant_credibility,
            created_at_tick
        ) VALUES (
            v_pol.nation_id, v_pol.id, v_moi_id,
            v_incumbent.id, 'pending',
            COALESCE(v_pol.politician_standing,    1),
            COALESCE(v_pol.politician_reputation,  0),
            COALESCE(v_pol.politician_credibility, 1),
            v_tick
        ) RETURNING id INTO v_request_id;
        RETURN jsonb_build_object('success', true, 'pending', true,
            'request_id', v_request_id);
    END IF;

    v_tenure := v_tick - COALESCE(v_incumbent.politician_state_prosecutor_at_tick, 0);
    IF v_tenure <= 36 THEN
        RETURN jsonb_build_object('success', false,
            'reason', 'incumbent_protected',
            'tenure_ticks', v_tenure,
            'ticks_remaining', 36 - v_tenure + 1);
    END IF;
    PERFORM public._complete_state_advocate_appointment(
        v_pol.id, v_incumbent.id, NULL, v_tick);
    RETURN jsonb_build_object('success', true,
        'appointed', true, 'displaced', true, 'at_tick', v_tick);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_seek_state_prosecutor_appointment(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_seek_state_prosecutor_appointment(uuid) TO authenticated;

-- ── 6. Backfill (idempotent — helper short-circuits on populated) ──
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT t.id
          FROM public.court_case_trials t
          JOIN public.court_case_drafts d ON d.id = t.case_draft_id
         WHERE t.status = 'pre_trial'
           AND ((d.plaintiff_party_type = 'state' AND t.plaintiff_advocate_id IS NULL)
             OR (d.defendant_party_type = 'state' AND t.defendant_advocate_id IS NULL))
    LOOP
        PERFORM public._attach_state_advocate_to_trial(r.id);
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
