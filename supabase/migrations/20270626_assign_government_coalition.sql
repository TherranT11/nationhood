-- ════════════════════════════════════════════════════════════════════
-- 20270626 — Auto-form government coalition (PM + party_status + HoG)
--
-- politician-nation.html's Head of Gov't card was rendering "Vacant ·
-- Prime Minister" for Avelia / Montequilla / Melizea because no
-- ministries row with ministry_key='prime_minister' existed for them.
-- The parties had seats, the largest party had a leader — nothing was
-- wiring the two together. Same gap on party_status: the column was
-- admin-set per party (20270394), so most parties sat at NULL.
--
-- assign_government_coalition(p_nation_id):
--   1. Picks the largest seat-holding party (tie-break created_at ASC).
--      Sets its party_status = 'Governing'.
--   2. Walks the remaining parties by descending seats, adding each to
--      'Coalition' until the running seat total clears 51% of
--      total_seats (ceil). Everyone else gets 'Opposition'.
--   3. If the governing party has a fully-named leader (first + last +
--      age), installs them as Prime Minister in ministries
--      (ministry_key='prime_minister') AND in head_of_government — the
--      two surfaces are read by different pages so we keep both in
--      lockstep.
--
-- Called from:
--   • resolve_due_general_elections — re-issued here so the helper runs
--     for each nation whose election just resolved. Supersedes the
--     20270594 HoG-only block (the helper does the same install plus
--     ministries.prime_minister + party_status).
--   • Backfill at the tail of this migration — every nation with
--     positive total_seats. Covers Avelia / Montequilla / Melizea (the
--     three current nations) and any others that were sitting on a
--     vacant PM. Idempotent: re-running on a nation that already has
--     the correct PM is a no-op semantically.
--   • Manual: GRANT EXECUTE TO authenticated so an admin can re-trigger
--     after creating new parties / seating a new nation. Future nation-
--     creation flows can call this from inside their own RPC to
--     guarantee an initial government.
--
-- Threshold uses ceil(total_seats * 0.51), matching the user's "51%"
-- spec verbatim. For a 135-seat chamber this resolves to 69 — one seat
-- above the bare-majority 68. A coalition lands when its running total
-- reaches OR exceeds that threshold.
--
-- Apply after 20270625.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. assign_government_coalition helper ─────────────────────────
CREATE OR REPLACE FUNCTION public.assign_government_coalition(
    p_nation_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick           int;
    v_total_seats    int;
    v_threshold      int;
    v_running        int := 0;
    v_largest        factions%ROWTYPE;
    v_party          RECORD;
    v_coalition_n    int := 1;
    v_opposition_n   int := 0;
BEGIN
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT COALESCE(total_seats, 0) INTO v_total_seats
      FROM nations
     WHERE id = p_nation_id;
    IF v_total_seats <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_seats');
    END IF;

    -- 51% threshold, ceiling. Matches the user's spec verbatim.
    v_threshold := CEIL(v_total_seats * 0.51)::int;

    -- Pick the largest seat-holding party. Tie-break on created_at ASC
    -- (same convention as 20270453 / 20270594 / chair RPCs).
    SELECT * INTO v_largest
      FROM factions
     WHERE nation_id    = p_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
       AND COALESCE(seats, 0) > 0
     ORDER BY seats DESC, created_at ASC
     LIMIT 1;

    IF v_largest.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_seated_parties');
    END IF;

    -- Reset all party statuses in the nation so the walk below writes
    -- a clean slate (no orphan 'Governing' / 'Coalition' from a prior
    -- composition still bleeding through).
    UPDATE factions
       SET party_status = NULL
     WHERE nation_id    = p_nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL;

    -- Largest party gets Governing; its seats start the coalition tally.
    UPDATE factions SET party_status = 'Governing' WHERE id = v_largest.id;
    v_running := COALESCE(v_largest.seats, 0);

    -- Walk remaining parties by seats DESC. Add to Coalition until the
    -- running total clears the threshold; the rest go to Opposition.
    FOR v_party IN
        SELECT id, COALESCE(seats, 0) AS seats
          FROM factions
         WHERE nation_id    = p_nation_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
           AND id           <> v_largest.id
         ORDER BY seats DESC, created_at ASC
    LOOP
        IF v_running < v_threshold THEN
            UPDATE factions SET party_status = 'Coalition' WHERE id = v_party.id;
            v_running     := v_running + v_party.seats;
            v_coalition_n := v_coalition_n + 1;
        ELSE
            UPDATE factions SET party_status = 'Opposition' WHERE id = v_party.id;
            v_opposition_n := v_opposition_n + 1;
        END IF;
    END LOOP;

    -- PM install — only when the largest party has a complete leader.
    -- Same gate as 20270594's HoG installer (first + last + age all
    -- present) so we don't seat a half-named ghost. Both surfaces
    -- (ministries.prime_minister read by politician-nation.html, and
    -- head_of_government read by other pages) get the same row.
    IF COALESCE(v_largest.leader_first_name, '') <> ''
       AND COALESCE(v_largest.leader_last_name, '')  <> ''
       AND v_largest.leader_age IS NOT NULL THEN
        -- ministries has a UNIQUE (nation_id, ministry_key) that ignores
        -- is_active, so a row already exists for any nation that's ever
        -- had a PM. ON CONFLICT updates in place instead of failing on
        -- duplicate. (head_of_government below uses a PARTIAL unique on
        -- (nation_id) WHERE active = true, so the deactivate-then-insert
        -- pattern stays correct there.)
        INSERT INTO ministries (
            nation_id, ministry_key, ministry_name, party_id,
            minister_first_name, minister_last_name, minister_age,
            is_active, created_at
        ) VALUES (
            p_nation_id, 'prime_minister', 'Prime Minister', v_largest.id,
            v_largest.leader_first_name,
            v_largest.leader_last_name,
            v_largest.leader_age,
            true, now()
        )
        ON CONFLICT (nation_id, ministry_key) DO UPDATE SET
            ministry_name       = EXCLUDED.ministry_name,
            party_id            = EXCLUDED.party_id,
            minister_first_name = EXCLUDED.minister_first_name,
            minister_last_name  = EXCLUDED.minister_last_name,
            minister_age        = EXCLUDED.minister_age,
            is_active           = true;

        -- head_of_government table mirror (partial unique on (nation_id)
        -- WHERE active = true — deactivate prior, insert new).
        UPDATE head_of_government
           SET active = false
         WHERE nation_id = p_nation_id AND active = true;

        INSERT INTO head_of_government
            (nation_id, faction_id, first_name, last_name, age,
             appointed_tick, active)
        VALUES (
            p_nation_id, v_largest.id,
            v_largest.leader_first_name,
            v_largest.leader_last_name,
            v_largest.leader_age,
            v_tick, true
        );
    END IF;

    RETURN jsonb_build_object(
        'success',            true,
        'nation_id',          p_nation_id,
        'governing_party_id', v_largest.id,
        'coalition_parties',  v_coalition_n,
        'opposition_parties', v_opposition_n,
        'coalition_seats',    v_running,
        'threshold',          v_threshold,
        'pm_installed',       COALESCE(v_largest.leader_first_name, '') <> ''
                              AND COALESCE(v_largest.leader_last_name, '') <> ''
                              AND v_largest.leader_age IS NOT NULL
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_government_coalition(uuid) TO authenticated;

COMMENT ON FUNCTION public.assign_government_coalition(uuid) IS
    'Auto-forms a parliamentary government for the given nation. Largest seat-holding party becomes party_status=Governing; subsequent parties become Coalition until the running seat total clears 51% of total_seats (ceil); the rest become Opposition. The Governing party''s leader is installed as Prime Minister in ministries + head_of_government when fully named. Called by resolve_due_general_elections on every election + as a manual admin trigger for backfill / new-nation seating.';

-- ── 2. Re-issue resolve_due_general_elections — call the helper ────
-- Body lifted from 20270594 with the inline HoG-install block replaced
-- by a single PERFORM call to assign_government_coalition(). The
-- helper now owns the PM + HoG + party_status writes; this orchestrator
-- still owns the seat allocation, chair clearing, and next-tick
-- scheduling.
CREATE OR REPLACE FUNCTION public.resolve_due_general_elections()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick           int;
    v_nation         RECORD;
    v_seats          int;
    v_next_tick      int;
    v_resolved       int := 0;
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

        -- Chairs (Deputy Speaker 20270592 / Speaker of the Assembly
        -- 20270593) open at every general election.
        UPDATE factions
           SET politician_deputy_speaker_at_tick = NULL
         WHERE nation_id = v_nation.id
           AND politician_deputy_speaker_at_tick IS NOT NULL;
        UPDATE factions
           SET politician_speaker_of_assembly_at_tick = NULL
         WHERE nation_id = v_nation.id
           AND politician_speaker_of_assembly_at_tick IS NOT NULL;

        -- Form the government. Helper sets party_status across all
        -- parties + installs PM (ministries + head_of_government).
        -- Supersedes the inline HoG block from 20270594.
        PERFORM public.assign_government_coalition(v_nation.id);

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

-- ── 3. Backfill — every nation with seats but no government ───────
-- Runs the helper for each nation that has parties to seat. Idempotent:
-- a nation already in the correct composition just re-writes the same
-- values. Covers Avelia / Montequilla / Melizea explicitly without
-- naming them (filter is "has seats", not "is one of these three").
DO $$
DECLARE
    v_nation_id uuid;
BEGIN
    FOR v_nation_id IN
        SELECT id FROM nations WHERE COALESCE(total_seats, 0) > 0
    LOOP
        PERFORM public.assign_government_coalition(v_nation_id);
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
