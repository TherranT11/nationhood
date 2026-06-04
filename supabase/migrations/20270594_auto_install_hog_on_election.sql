-- ════════════════════════════════════════════════════════════════════
-- 20270594 — Auto-install HoG on general election
--
-- After a general election resolves for a nation, the party with the
-- most seats automatically gets its leader installed as Head of
-- Government. Mirrors the manual SQL pattern from this session
-- (deactivate-then-insert against the head_of_government partial
-- unique on (nation_id) WHERE active = true).
--
-- Re-emits resolve_due_general_elections — fourth time in this push
-- window (20270421 origin → 20270422 audit fix → 20270592 Deputy
-- Speaker clear → 20270593 Speaker clear → 20270594 HoG install).
-- The function is becoming a magnet for per-nation cleanup +
-- appointment steps; flagging here that a future refactor pulling
-- the per-nation block into a helper (_resolve_nation_post_election)
-- would keep the orchestrator readable. Not doing that today —
-- single-feature scope.
--
-- Scope deliberately narrow:
--   • Only Head of Government. party_status flipping (Governing /
--     Coalition / Opposition) is NOT touched here. The user set
--     party_status manually this session and may want manual control
--     over coalition vs governing labels. If elections should also
--     flip party_status, that's a follow-up.
--   • Only head_of_government table. The administrations table's
--     prime_minister + admin_name fields (set alongside HoG by the
--     coalition-formation paths in 20261119/20) are NOT touched.
--     Same reason — separate concern, separate ask.
--   • Tie-break on created_at ASC, matching 20270453 / Deputy Speaker
--     / Speaker conventions.
--
-- Apply after 20270593.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    v_largest_party  factions%ROWTYPE;
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
        -- 20270593) open at every general election. Scoped to the
        -- resolving nation so SKIP LOCKED stays per-nation.
        UPDATE factions
           SET politician_deputy_speaker_at_tick = NULL
         WHERE nation_id = v_nation.id
           AND politician_deputy_speaker_at_tick IS NOT NULL;
        UPDATE factions
           SET politician_speaker_of_assembly_at_tick = NULL
         WHERE nation_id = v_nation.id
           AND politician_speaker_of_assembly_at_tick IS NOT NULL;

        -- Auto-install HoG (20270594). Pick the largest-seated party
        -- in the nation; tie-break on created_at ASC, same convention
        -- as 20270453 / chair RPCs. Skip when no party has seats
        -- (post-allocation v_seats > 0 doesn't guarantee any party
        -- got a positive share — could be all zero if popularity
        -- summed to zero, in which case there's no PM to seat).
        SELECT * INTO v_largest_party
          FROM factions
         WHERE nation_id    = v_nation.id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
           AND COALESCE(seats, 0) > 0
         ORDER BY seats DESC, created_at ASC
         LIMIT 1;

        IF v_largest_party.id IS NOT NULL
           AND COALESCE(v_largest_party.leader_first_name, '') <> ''
           AND COALESCE(v_largest_party.leader_last_name, '')  <> ''
           AND v_largest_party.leader_age IS NOT NULL THEN
            -- Deactivate any existing active HoG row first (the partial
            -- unique on (nation_id) WHERE active = true blocks two
            -- active rows; this turns history-preserving — old rows
            -- stay with active=false).
            UPDATE head_of_government
               SET active = false
             WHERE nation_id = v_nation.id
               AND active = true;

            INSERT INTO head_of_government
                (nation_id, faction_id, first_name, last_name, age,
                 appointed_tick, active)
            VALUES (
                v_nation.id, v_largest_party.id,
                v_largest_party.leader_first_name,
                v_largest_party.leader_last_name,
                v_largest_party.leader_age,
                v_tick, true
            );
        END IF;

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
