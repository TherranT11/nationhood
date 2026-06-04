-- ════════════════════════════════════════════════════════════════════
-- 20270592 — Deputy Speaker mechanic (Legislature ladder)
--
-- Wires the Deputy Speaker rung in the Legislature career ladder.
-- Currently a placeholder in politician-career.html (held() always
-- false, actions are unwired stubs). This migration delivers:
--
--   • Schema: factions.politician_deputy_speaker_at_tick (int, nullable).
--     Stamped on appointment via politician_become_deputy_speaker.
--     Cleared at the nation's next general election by
--     resolve_due_general_elections (re-emitted here).
--   • Partial unique index uq_factions_deputy_speaker_per_nation
--     enforcing one-per-nation. Matches the spec — exactly one
--     Deputy Speaker presides per chamber.
--   • politician_become_deputy_speaker(p_party_id) — auth + four
--     gates: (1) caller is a sitting MP, (2) politician_reputation
--     ≥ 35, (3) caller's party has the plurality (top seats among
--     movement_party factions in the nation; in this codebase
--     "governing" and "plurality" coincide), (4) no existing Deputy
--     Speaker holds the seat. The partial unique index is the
--     ultimate backstop on (4) in case of a race.
--
-- Locking model: mid-term changes (the politician's party falls out
-- of plurality, the politician loses MP-side gates) DO NOT un-seat
-- the Deputy Speaker. The seat clears only at the next general
-- election. Spec says "locked until next election" — implemented
-- as a single clear step inside resolve_due_general_elections,
-- scoped to the nation being resolved.
--
-- The actionable in-role mechanic (Change Legislative Agenda) is
-- deferred per user direction — the JS rung still renders the
-- action label as a greyed stub until the bill / floor surface
-- catches up.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ──────────────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_deputy_speaker_at_tick int;

COMMENT ON COLUMN public.factions.politician_deputy_speaker_at_tick IS
    'Tick at which the politician was appointed Deputy Speaker via politician_become_deputy_speaker (20270592). NULL = not Deputy Speaker. One-per-nation enforced by partial unique index uq_factions_deputy_speaker_per_nation. Cleared by resolve_due_general_elections at the nation''s next general election cycle; nothing mid-term un-seats the holder.';

-- One-per-nation. nation_id is non-null on politician factions; this
-- partial index races the RPC's seat_filled check to enforce the
-- invariant even under concurrent appointments.
CREATE UNIQUE INDEX IF NOT EXISTS uq_factions_deputy_speaker_per_nation
    ON public.factions (nation_id)
    WHERE politician_deputy_speaker_at_tick IS NOT NULL;

-- ── 2. politician_become_deputy_speaker ────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_become_deputy_speaker(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    REPUTATION_REQUIRED CONSTANT int := 35;
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_top_party uuid;
    v_existing  uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- Pre-req: sitting MP.
    IF v_pol.politician_office IS DISTINCT FROM 'member_of_parliament' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;

    IF v_pol.politician_deputy_speaker_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_deputy_speaker');
    END IF;

    IF COALESCE(v_pol.politician_reputation, 0) < REPUTATION_REQUIRED THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_reputation',
            'required', REPUTATION_REQUIRED,
            'have',     COALESCE(v_pol.politician_reputation, 0));
    END IF;

    -- Plurality / governing gate. The top-seated movement_party in the
    -- nation is the governing party; ties break on created_at ASC,
    -- matching the convention in 20270453 (committees_v1).
    SELECT id INTO v_top_party
      FROM public.factions
     WHERE nation_id    = v_pol.nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
     ORDER BY COALESCE(seats, 0) DESC, created_at ASC
     LIMIT 1;
    IF v_top_party IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_governing');
    END IF;

    -- Seat-already-filled gate. Backstopped by the partial unique
    -- index — this branch keeps the failure mode user-friendly
    -- ("seat_filled") instead of a raw constraint violation.
    SELECT id INTO v_existing
      FROM public.factions
     WHERE nation_id = v_pol.nation_id
       AND politician_deputy_speaker_at_tick IS NOT NULL
     LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seat_filled');
    END IF;

    -- Wrapped in EXCEPTION so a race between two MPs (both pass the
    -- seat_filled check while neither has stamped yet, both reach the
    -- UPDATE) surfaces as the friendly seat_filled reason instead of
    -- a raw unique_violation. The partial unique index is the
    -- ultimate enforcer of the one-per-nation invariant.
    BEGIN
        UPDATE public.factions
           SET politician_deputy_speaker_at_tick = v_tick
         WHERE id = v_pol.id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seat_filled');
    END;

    RETURN jsonb_build_object(
        'success',       true,
        'tick',          v_tick,
        'role',          'deputy_speaker'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.politician_become_deputy_speaker(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_become_deputy_speaker(uuid) TO authenticated;

-- ── 3. resolve_due_general_elections — clear Deputy Speaker per nation ──
-- Re-emits the 20270422 body verbatim except for one new statement
-- inside the per-nation loop: clear every politician_deputy_speaker_at_tick
-- in the nation being resolved. The placement is right after the seat
-- reallocation, before next_election_tick is rescheduled — the seat
-- opens for re-appointment at the same moment the new chamber composition
-- becomes authoritative.
CREATE OR REPLACE FUNCTION public.resolve_due_general_elections()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick      int;
    v_nation    RECORD;
    v_seats     int;
    v_next_tick int;
    v_resolved  int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', 0, 'reason', 'no_shard');
    END IF;

    FOR v_nation IN
        SELECT id, name, total_seats
          FROM nations
         WHERE next_election_tick IS NOT NULL
           AND next_election_tick <= v_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        v_seats := COALESCE(v_nation.total_seats, 0);
        IF v_seats <= 0 THEN
            v_next_tick := v_tick + 5 + 1 + floor(random() * 36)::int;
            UPDATE nations SET next_election_tick = v_next_tick WHERE id = v_nation.id;
            CONTINUE;
        END IF;

        -- Seat reallocation (delegated to project_general_election).
        UPDATE factions f
           SET seats = pr.projected_seats
          FROM project_general_election(v_nation.id) pr
         WHERE f.id = pr.party_id;

        -- Deputy Speaker seat opens at every general election (20270592).
        -- Scoped to the nation being resolved so this stays per-nation
        -- under SKIP LOCKED — other nations' Deputy Speakers untouched.
        UPDATE factions
           SET politician_deputy_speaker_at_tick = NULL
         WHERE nation_id = v_nation.id
           AND politician_deputy_speaker_at_tick IS NOT NULL;

        -- Reschedule: 1D36 + 5 ticks → 6..41 ticks out.
        v_next_tick := v_tick + 5 + 1 + floor(random() * 36)::int;
        UPDATE nations
           SET next_election_tick = v_next_tick
         WHERE id = v_nation.id;

        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick, 'resolved', v_resolved);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_due_general_elections() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resolve_due_general_elections() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
