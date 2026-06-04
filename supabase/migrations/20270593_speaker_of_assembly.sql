-- ════════════════════════════════════════════════════════════════════
-- 20270593 — Speaker of the Assembly + chair resignation
--
-- Two additions to the Legislature ladder built on top of 20270592's
-- Deputy Speaker plumbing:
--
--   1. Speaker of the Assembly. Same shape as Deputy Speaker — one
--      per nation, MP-required, held until the next general election
--      clears it — with a different gating axis: party must have the
--      Head of Government role filled (factions.party_status =
--      'Governing', the admin-set flag from 20270394 that signals the
--      party holds the HoG seat).
--
--   2. Chair resignation. politician_resign_chair clears whichever
--      chair the caller currently holds (Deputy Speaker OR Speaker)
--      and leaves politician_office intact at 'member_of_parliament'.
--      Per spec: resignation drops the chair back to MP, not all the
--      way back to Party Member. The existing politician_resign_office
--      (sql/migrations/20270484) is unchanged — that one resigns the
--      MP seat itself, a different operation.
--
-- resolve_due_general_elections re-emitted to clear the Speaker stamp
-- alongside Deputy Speaker per nation. Same scoping discipline as
-- 20270592.
--
-- Apply after 20270592.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ──────────────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_speaker_of_assembly_at_tick int;

COMMENT ON COLUMN public.factions.politician_speaker_of_assembly_at_tick IS
    'Tick at which the politician was appointed Speaker of the Assembly via politician_run_for_speaker (20270593). NULL = not Speaker. One-per-nation enforced by partial unique index uq_factions_speaker_per_nation. Cleared by resolve_due_general_elections at the nation''s next general election, or explicitly by politician_resign_chair. Mutually exclusive at the holder level with politician_deputy_speaker_at_tick.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_factions_speaker_per_nation
    ON public.factions (nation_id)
    WHERE politician_speaker_of_assembly_at_tick IS NOT NULL;

-- ── 2. politician_run_for_speaker ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_run_for_speaker(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    REPUTATION_REQUIRED CONSTANT int := 35;
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_party     factions%ROWTYPE;
    v_tick      int;
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

    IF v_pol.politician_office IS DISTINCT FROM 'member_of_parliament' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;

    IF v_pol.politician_speaker_of_assembly_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_speaker');
    END IF;
    -- Mutually exclusive with the lower chair. Spec route is to resign
    -- Deputy first (politician_resign_chair → returns to MP), then run.
    IF v_pol.politician_deputy_speaker_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'holds_other_chair',
            'chair', 'deputy_speaker');
    END IF;

    IF COALESCE(v_pol.politician_reputation, 0) < REPUTATION_REQUIRED THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_reputation',
            'required', REPUTATION_REQUIRED,
            'have',     COALESCE(v_pol.politician_reputation, 0));
    END IF;

    -- HoG gate: party_status = 'Governing' (set by the 20270394 admin
    -- form when "Head of Government" is checked for the party; the
    -- explicit surface for "this party holds the HoG seat").
    SELECT * INTO v_party FROM public.factions WHERE id = p_party_id;
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    IF v_party.party_status IS DISTINCT FROM 'Governing' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_governing');
    END IF;

    -- Seat-filled gate (one-per-nation). Backstopped by uq index.
    SELECT id INTO v_existing
      FROM public.factions
     WHERE nation_id = v_pol.nation_id
       AND politician_speaker_of_assembly_at_tick IS NOT NULL
     LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seat_filled');
    END IF;

    BEGIN
        UPDATE public.factions
           SET politician_speaker_of_assembly_at_tick = v_tick
         WHERE id = v_pol.id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seat_filled');
    END;

    RETURN jsonb_build_object(
        'success', true,
        'tick',    v_tick,
        'role',    'speaker_of_assembly'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.politician_run_for_speaker(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_run_for_speaker(uuid) TO authenticated;

-- ── 3. politician_resign_chair ─────────────────────────────────────
-- Clears whichever chair the caller currently holds (Deputy Speaker
-- or Speaker) and returns which was cleared. politician_office stays
-- MP — the spec is that resignation returns to MP, not all the way
-- back to Party Member. No-op (with reason 'no_chair_held') if the
-- caller holds neither.
CREATE OR REPLACE FUNCTION public.politician_resign_chair()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_pol   factions%ROWTYPE;
    v_chair text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    IF v_pol.politician_speaker_of_assembly_at_tick IS NOT NULL THEN
        v_chair := 'speaker_of_assembly';
        UPDATE public.factions
           SET politician_speaker_of_assembly_at_tick = NULL
         WHERE id = v_pol.id;
    ELSIF v_pol.politician_deputy_speaker_at_tick IS NOT NULL THEN
        v_chair := 'deputy_speaker';
        UPDATE public.factions
           SET politician_deputy_speaker_at_tick = NULL
         WHERE id = v_pol.id;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'no_chair_held');
    END IF;

    RETURN jsonb_build_object(
        'success',       true,
        'resigned_from', v_chair
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.politician_resign_chair() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_resign_chair() TO authenticated;

-- ── 4. politician_become_deputy_speaker — close the cross-chair gap ───
-- 20270592's body only blocked re-taking Deputy when the caller already
-- held Deputy; it didn't block taking Deputy while holding Speaker.
-- A Speaker calling the Deputy RPC directly would end up stamped with
-- both. Re-emit verbatim except for one extra guard mirroring the
-- run_for_speaker rejection: holds_other_chair when Speaker is set.
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

    IF v_pol.politician_office IS DISTINCT FROM 'member_of_parliament' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;

    IF v_pol.politician_deputy_speaker_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_deputy_speaker');
    END IF;
    -- Cross-chair guard: a Speaker shouldn't be able to also hold the
    -- Deputy stamp. The matching guard on the Speaker RPC blocks the
    -- other direction.
    IF v_pol.politician_speaker_of_assembly_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'holds_other_chair',
            'chair', 'speaker_of_assembly');
    END IF;

    IF COALESCE(v_pol.politician_reputation, 0) < REPUTATION_REQUIRED THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_reputation',
            'required', REPUTATION_REQUIRED,
            'have',     COALESCE(v_pol.politician_reputation, 0));
    END IF;

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

    SELECT id INTO v_existing
      FROM public.factions
     WHERE nation_id = v_pol.nation_id
       AND politician_deputy_speaker_at_tick IS NOT NULL
     LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seat_filled');
    END IF;

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

-- ── 5. resolve_due_general_elections — also clear Speaker per nation ──
-- Re-emit. Same body as 20270592's re-emit plus one additional UPDATE
-- inside the per-nation loop to clear the Speaker stamp.
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

        UPDATE factions f
           SET seats = pr.projected_seats
          FROM project_general_election(v_nation.id) pr
         WHERE f.id = pr.party_id;

        -- Deputy Speaker (20270592) + Speaker (20270593) chairs both
        -- open at every general election. Scoped to the resolving
        -- nation so SKIP LOCKED stays per-nation.
        UPDATE factions
           SET politician_deputy_speaker_at_tick = NULL
         WHERE nation_id = v_nation.id
           AND politician_deputy_speaker_at_tick IS NOT NULL;
        UPDATE factions
           SET politician_speaker_of_assembly_at_tick = NULL
         WHERE nation_id = v_nation.id
           AND politician_speaker_of_assembly_at_tick IS NOT NULL;

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
