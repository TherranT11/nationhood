-- ════════════════════════════════════════════════════════════════════
-- 20270555 — State Advocate appointment mechanic
--
-- Replaces the single-shot auto-appoint behaviour from 20270532 with
-- the full design:
--
--   • 1 State Advocate per nation (enforced via politician faction
--     query — only one politician_state_prosecutor_at_tick set at any
--     time within a nation).
--   • [Seek Appointment] retains the 20270532 gates (Experienced
--     Advocate, Rep ≥ 35, PC ≥ 25 — all threshold checks, no spend).
--   • If no Minister of the Interior is in seat → auto-appoint with
--     +3 Standing, +7 PC.
--   • If MoI is in seat → write a row to state_advocate_appointment_
--     requests; the MoI sees a pressing issue with [Appoint]/[Reject].
--     Same reward fires on minister-approved appointments.
--   • If an incumbent State Advocate is already seated AND no MoI:
--       - incumbent tenure ≤ 36 ticks → auto-reject the new applicant
--       - incumbent tenure  > 36 ticks → auto-displace the incumbent
--         (their tick is cleared) and appoint the applicant.
--   • If incumbent + MoI both exist → the request is routed to MoI
--     who can approve (displacing the incumbent) or reject.
--   • On every successful appointment: state-party pre_trial cases
--     get their state-side counsel slot filled with the new advocate.
--     A trigger on court_case_trials handles the forward case (new
--     trials drawn after the appointment).
--
-- Spec note on DoJ: the original design routed the request to the
-- Deputy Minister of Justice with MoI as fallback. No `justice` or
-- `deputy_justice` ministry exists in this codebase, so DoJ is
-- dropped for this version — MoI is the sole minister-side reviewer.
-- Adding DoJ later is a localised edit to the seek RPC's routing
-- block + the pressing-issue list-RPC's reviewer filter.
--
-- Schema name: politician_state_prosecutor_at_tick stays as-is to
-- avoid churning every read site. Display labels say "State Advocate"
-- everywhere user-facing (frontend rename already complete from a
-- prior session). 20270532's "one-shot, never cleared" promise is
-- explicitly broken here — displacement clears the tick.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Request table ───────────────────────────────────────────────
-- Mirrors corp_advocate_offers' shape: a status-tracked row with
-- (applicant, reviewer) pair, captured stat snapshots so the card
-- shows the values at request time even if the applicant grinds Rep
-- while waiting. Two partial unique indexes block dupes:
--   • One pending request per applicant.
--   • One pending request per nation (since the appointment itself is
--     1-per-nation, two parallel pending requests would race on
--     approval).
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
    'Pending [Seek Appointment] requests routed to a nation''s Minister of the Interior when a State Advocate appointment needs ministerial approval. RPC-only writes; reads via list_pending_state_advocate_requests_for_reviewer.';

-- ── 2. _attach_state_advocate_to_trial helper ──────────────────────
-- One source for "fill the state-side counsel slot on a trial with
-- the seated State Advocate." Used by:
--   • The appointment helper (backfill loop on appointment success).
--   • The AFTER INSERT trigger on court_case_trials (forward cases).
-- No-op when:
--   • Neither side is a state party.
--   • The state-side counsel slot is already populated.
--   • No State Advocate is currently seated in the nation.
-- Pre_trial only — in_progress / settlement_conference trials keep
-- their assigned counsel even after a seat change.
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

-- ── 3. AFTER INSERT trigger on court_case_trials ───────────────────
-- Forward auto-attach: every new pre_trial that has a state party
-- with NULL state-side counsel gets the seated State Advocate filled
-- in immediately. The helper short-circuits on every no-op condition
-- so non-state cases and appeal inserts (already pre-filled by
-- start_appeal in 20270546) pass through without writes.
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

-- ── 4. _complete_state_advocate_appointment helper ─────────────────
-- The single write path for "X is now State Advocate." Called by
-- both the auto-appoint branch of the seek RPC and the accept branch
-- of the respond RPC, so reward + displacement + backfill + event
-- log + request resolution stay consistent regardless of route.
--
-- Reward: +3 Standing, +7 Political Capital (uncapped, mirrors the
-- additive pattern in 20270501 / 20270452).
-- Displacement: clears the incumbent's politician_state_prosecutor_
-- at_tick. Their already-filled counsel slots on pre_trial state-
-- party cases are nulled so the backfill loop refills them with the
-- new advocate. In-progress / settlement-conference trials keep
-- their counsel (mid-trial swaps would be jarring; the displaced
-- advocate finishes what they started).
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
        -- Free the displaced advocate's pre_trial state-side counsel
        -- slots so the backfill below refills them with the applicant.
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

    -- Backfill: every pre_trial state-party case in this nation with
    -- a NULL state-side counsel gets the applicant attached. Uses
    -- the same helper that fires on forward inserts, so the rules
    -- (pre_trial only, no overwrite of populated slots) stay aligned.
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

-- ── 5. politician_seek_state_prosecutor_appointment (REPLACED) ─────
-- Same name as 20270532's RPC (kept for callsite stability — the
-- frontend still binds 'politician_seek_state_prosecutor_appointment'
-- to the [Seek Appointment] button). Body redesigned to implement
-- the routing tree.
--
-- Returns:
--   { success: true,  appointed: true,  displaced: bool }     -- auto-appoint
--   { success: true,  pending:   true,  request_id: uuid }     -- request created
--   { success: true,  pending:   true,  already_pending: true }-- idempotent re-press
--   { success: false, reason: 'incumbent_protected', ticks_remaining: int }
--   { success: false, reason: <gate failure> }
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

    -- Serialize per-nation: prevents two concurrent seek attempts
    -- from both reading "no incumbent" and both auto-appointing,
    -- which would violate the 1-per-nation invariant. classid 555
    -- matches the migration prefix; objid is a stable hash of the
    -- nation. Lock is transaction-scoped — auto-released on commit
    -- or rollback. Same lock acquired in the respond RPC below.
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

    -- Idempotent re-press: if this applicant already has a pending
    -- request, surface that instead of trying to insert a duplicate
    -- (which would hit idx_sa_req_one_pending_per_applicant).
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

    -- Incumbent State Advocate in the same nation (1-per-nation
    -- invariant). Excluded from applicant since the one-shot gate
    -- above blocked v_pol from being its own incumbent.
    SELECT * INTO v_incumbent
      FROM public.factions
     WHERE nation_id = v_pol.nation_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND politician_state_prosecutor_at_tick IS NOT NULL
     LIMIT 1;

    -- Minister of the Interior (ministries.party_id is the FACTION
    -- id of the seated politician — legacy column name from when
    -- ministers were per-party; see 20261106 for the same lookup).
    SELECT party_id INTO v_moi_id
      FROM public.ministries
     WHERE nation_id = v_pol.nation_id
       AND ministry_key = 'interior'
       AND is_active = true
       AND party_id IS NOT NULL
     ORDER BY created_at DESC
     LIMIT 1;

    -- Branch A: no incumbent, no MoI → auto-appoint.
    IF v_incumbent.id IS NULL AND v_moi_id IS NULL THEN
        PERFORM public._complete_state_advocate_appointment(
            v_pol.id, NULL, NULL, v_tick);
        RETURN jsonb_build_object('success', true,
            'appointed', true, 'displaced', false, 'at_tick', v_tick);
    END IF;

    -- Branch B: no incumbent, MoI exists → pressing-issue request.
    -- Branch D: incumbent + MoI → same request, with incumbent
    -- recorded so the card can warn the MoI about displacement.
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

    -- Branch C: incumbent exists, no MoI. Tenure decides.
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

COMMENT ON FUNCTION public.politician_seek_state_prosecutor_appointment(uuid) IS
    'Politician [Seek Appointment] for State Advocate. Branches on Minister of Interior seat + incumbent State Advocate to auto-appoint, queue a pressing-issue request to the MoI, or auto-reject. Replaces 20270532''s unconditional auto-appoint.';

-- ── 6. respond_state_advocate_appointment_request ──────────────────
-- The reviewer's [Appoint]/[Reject] action on a pressing-issue card.
-- Caller must be the politician matching the recorded reviewer (the
-- MoI at request time). If a regime change has moved the MoI seat
-- since the request was created, the new MoI does NOT inherit it —
-- they would need to wait for a fresh request. This is intentional;
-- the request captures who was MoI at the moment the applicant
-- pressed Seek Appointment, and that person's call stands.
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

    -- Same per-nation lock the seek RPC takes — prevents an MoI
    -- approval from racing a concurrent auto-appoint (e.g. the MoI
    -- seat empties between the request being filed and approved,
    -- another applicant runs auto-appoint via Branch A in seek).
    PERFORM pg_advisory_xact_lock(555, hashtext(v_req.nation_id::text));

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF NOT p_accept THEN
        UPDATE public.state_advocate_appointment_requests
           SET status = 'rejected', resolved_at_tick = v_tick
         WHERE id = p_request_id;
        RETURN jsonb_build_object('success', true, 'accepted', false);
    END IF;

    -- Re-discover state inside the lock. The request's
    -- incumbent_faction_id was captured at request time and may now
    -- be stale (e.g. MoI seat emptied, another applicant auto-
    -- appointed via Branch A, or the captured incumbent stepped
    -- down). Two guards before calling the appoint helper:
    --   1. If the applicant ALREADY has the tick set (got the seat
    --      via some other path while waiting), don't double-reward
    --      or double-event. Mark the request approved and return
    --      a no-op acknowledgement.
    --   2. Re-fetch the current incumbent fresh so displacement
    --      targets whoever actually holds the seat right now, not
    --      whoever held it when the applicant pressed Seek.
    SELECT * INTO v_applicant FROM public.factions
     WHERE id = v_req.applicant_faction_id;
    IF v_applicant.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'applicant_not_found');
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

-- ── 7. list_pending_state_advocate_requests_for_reviewer ───────────
-- Pressing-issue feed for the MoI. Returns every pending request
-- where the caller is the reviewer, with the applicant's display
-- name + the stat snapshot captured at request time. Sorted oldest-
-- first so the MoI works through the queue in order.
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
    -- Auth gate: only the politician themselves (or their user) can
    -- list their own queue.
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
      JOIN public.factions a ON a.id = r.applicant_faction_id
 LEFT JOIN public.factions i ON i.id = r.incumbent_faction_id
     WHERE r.reviewer_faction_id = p_faction_id
       AND r.status = 'pending'
     ORDER BY r.created_at_tick ASC, r.id ASC;
END $$;

REVOKE EXECUTE ON FUNCTION public.list_pending_state_advocate_requests_for_reviewer(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_pending_state_advocate_requests_for_reviewer(uuid) TO authenticated;

-- ── 8. Backfill: attach existing seated SAs to existing pre_trials ─
-- Idempotent — _attach_state_advocate_to_trial short-circuits when
-- the slot is already populated. Catches any pre_trial state-party
-- case in a nation that ALREADY has a seated State Advocate today
-- but where the trial was drawn before this migration (or before
-- the SA was appointed).
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
