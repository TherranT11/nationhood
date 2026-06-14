-- ════════════════════════════════════════════════════════════════════
-- 20270921 — Party Caucus & Allies (Phase 2a): MP bill voting + the
--            Senior-MP seat split
--
-- Assembly-bill voting becomes an MP franchise, and a Senior MP's allies
-- give them a bloc on the floor. Re-emitted from 20270423:
--
--   • cast_vote_on_bill — only a full MP or Senior MP may vote (Junior
--     MPs and non-MP members can't). Same upsert otherwise.
--
--   • resolve_due_bills — three changes, everything else unchanged:
--       1. The party line is set by its MPs (member_count now counts only
--          full/senior MPs, so NPC fallback + the absent penalty are
--          MP-based).
--       2. Senior MP defection: a Senior MP who votes against the party
--          line peels (1 + their allies) seats to the other side (capped
--          at the party's seats), and costs the party 0.5 popularity each.
--       3. +0.2 Influence to every full/senior MP who voted the line.
--     Influence/popularity land HERE, at resolution, where the party line
--     is final and the existing popularity shift already runs.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.cast_vote_on_bill(
    p_bill_id  uuid,
    p_position text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_pol  factions%ROWTYPE;
    v_bill assembly_bills%ROWTYPE;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_position NOT IN ('yes', 'no') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_position');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    -- The floor is an MP franchise (20270921): full MPs and Senior MPs
    -- only — Junior MPs and non-MP members can't vote.
    IF COALESCE(v_pol.politician_office, '') NOT IN ('full_mp', 'senior_mp') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;

    SELECT * INTO v_bill FROM assembly_bills WHERE id = p_bill_id;
    IF v_bill.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_not_found');
    END IF;
    IF v_bill.status <> 'voting' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_closed');
    END IF;
    IF v_bill.nation_id <> v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_nation');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO assembly_bill_votes (bill_id, politician_id, party_id, position, voted_at_tick)
    VALUES (p_bill_id, v_pol.id, v_pol.politician_party_id, p_position, v_tick)
    ON CONFLICT (bill_id, politician_id) DO UPDATE
        SET position      = EXCLUDED.position,
            party_id      = EXCLUDED.party_id,
            voted_at_tick = EXCLUDED.voted_at_tick;

    RETURN jsonb_build_object('success', true, 'bill_id', p_bill_id, 'position', p_position);
END;
$$;
GRANT EXECUTE ON FUNCTION public.cast_vote_on_bill(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_due_bills()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick         int;
    v_bill         assembly_bills%ROWTYPE;
    v_party        RECORD;
    v_resolved     int := 0;
    v_yes          int;
    v_no           int;
    v_align        int;
    v_pos          int;
    v_pop          numeric;
    v_delta        numeric;
    v_absent       int;
    v_base         numeric := 4.0;
    v_outcome      text;
    v_defect_seats int;
    v_defectors    int;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', 0, 'reason', 'no_shard');
    END IF;

    FOR v_bill IN
        SELECT * FROM assembly_bills
         WHERE status = 'voting' AND close_at_tick <= v_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        v_yes := 0;
        v_no  := 0;

        FOR v_party IN
            SELECT p.id, p.seats, p.archetype, p.popularity_pct,
                   -- The party line is set by its MPs (20270921): only
                   -- full/senior MPs count toward the majority + absences.
                   (SELECT COUNT(*) FROM factions f
                     WHERE f.faction_type = 'politician'
                       AND f.politician_party_id = p.id
                       AND f.politician_office IN ('full_mp', 'senior_mp')
                       AND f.abandoned_at IS NULL) AS member_count,
                   (SELECT COUNT(*) FROM assembly_bill_votes bv
                      JOIN factions f ON f.id = bv.politician_id
                     WHERE bv.bill_id = v_bill.id
                       AND f.politician_party_id = p.id
                       AND bv.position = 'yes') AS member_yes,
                   (SELECT COUNT(*) FROM assembly_bill_votes bv
                      JOIN factions f ON f.id = bv.politician_id
                     WHERE bv.bill_id = v_bill.id
                       AND f.politician_party_id = p.id
                       AND bv.position = 'no') AS member_no
              FROM factions p
             WHERE p.faction_type  = 'movement_party'
               AND p.nation_id     = v_bill.nation_id
               AND p.abandoned_at IS NULL
        LOOP
            v_align := COALESCE((v_bill.archetype_alignment->>v_party.archetype)::int, 0);

            IF v_party.member_count = 0 THEN
                v_pos := v_align;  -- no MPs: auto-vote aligned (0 = abstain)
            ELSE
                v_pos := CASE WHEN v_party.member_yes > v_party.member_no THEN 1
                              WHEN v_party.member_no  > v_party.member_yes THEN -1
                              ELSE 0 END;
            END IF;

            -- Senior MP defection (20270921): Senior MPs who voted against
            -- the line peel (1 + allies) seats to the other side.
            v_defect_seats := 0;
            v_defectors    := 0;
            IF v_pos <> 0 THEN
                SELECT COALESCE(SUM(1 + GREATEST(0, COALESCE(f.politician_allies, 0))), 0)::int,
                       COUNT(*)::int
                  INTO v_defect_seats, v_defectors
                  FROM assembly_bill_votes bv
                  JOIN factions f ON f.id = bv.politician_id
                 WHERE bv.bill_id = v_bill.id
                   AND f.politician_party_id = v_party.id
                   AND f.politician_office = 'senior_mp'
                   AND bv.position = CASE WHEN v_pos > 0 THEN 'no' ELSE 'yes' END;
                v_defect_seats := LEAST(v_defect_seats, COALESCE(v_party.seats, 0));
            END IF;

            -- Allocate the party's seats: the line gets the rest, the
            -- Senior MP defectors' bloc crosses to the other side.
            IF v_pos > 0 THEN
                v_yes := v_yes + GREATEST(0, COALESCE(v_party.seats, 0) - v_defect_seats);
                v_no  := v_no  + v_defect_seats;
            ELSIF v_pos < 0 THEN
                v_no  := v_no  + GREATEST(0, COALESCE(v_party.seats, 0) - v_defect_seats);
                v_yes := v_yes + v_defect_seats;
            END IF;

            -- +0.2 Influence to each full/senior MP who voted the line.
            IF v_pos <> 0 THEN
                UPDATE factions f
                   SET politician_influence = COALESCE(f.politician_influence, 0) + 0.2
                 WHERE f.politician_party_id = v_party.id
                   AND f.politician_office IN ('full_mp', 'senior_mp')
                   AND EXISTS (SELECT 1 FROM assembly_bill_votes bv
                                WHERE bv.bill_id = v_bill.id AND bv.politician_id = f.id
                                  AND bv.position = CASE WHEN v_pos > 0 THEN 'yes' ELSE 'no' END);
            END IF;

            v_pop   := COALESCE(v_party.popularity_pct, 0);
            v_delta := 0;
            IF v_align <> 0 AND v_pos <> 0 THEN
                IF (v_align > 0) = (v_pos > 0) THEN
                    v_delta := v_delta + v_base * (1 - v_pop / 100.0);
                ELSE
                    v_delta := v_delta - v_base * (v_pop / 100.0);
                END IF;
            END IF;

            v_absent := GREATEST(0, v_party.member_count - v_party.member_yes - v_party.member_no);
            IF v_absent > 0 THEN
                v_delta := v_delta - v_absent * v_base * (v_pop / 100.0);
            END IF;

            -- Each Senior MP defection costs the party 0.5 popularity.
            v_delta := v_delta - v_defectors * 0.5;

            IF v_delta <> 0 THEN
                UPDATE factions
                   SET popularity_pct = GREATEST(0, LEAST(100, v_pop + v_delta))
                 WHERE id = v_party.id;
            END IF;
        END LOOP;

        v_outcome := CASE
            WHEN v_yes = 0 AND v_no = 0 THEN 'expired'
            WHEN v_yes > v_no             THEN 'passed'
            ELSE                               'failed'
        END;

        UPDATE assembly_bills
           SET status     = v_outcome,
               yes_seats  = v_yes,
               no_seats   = v_no
         WHERE id = v_bill.id;

        IF v_outcome = 'passed' THEN
            IF EXISTS (
                SELECT 1 FROM active_laws
                 WHERE nation_id = v_bill.nation_id
                   AND policy_id = v_bill.policy_id
                   AND COALESCE(is_reversal, false) = false
            ) THEN
                UPDATE active_laws
                   SET selected_option_id = v_bill.proposed_option_id,
                       passed_tick        = v_tick
                 WHERE nation_id = v_bill.nation_id
                   AND policy_id = v_bill.policy_id
                   AND COALESCE(is_reversal, false) = false;
            ELSE
                INSERT INTO active_laws (nation_id, policy_id, selected_option_id, passed_tick, is_reversal)
                VALUES (v_bill.nation_id, v_bill.policy_id, v_bill.proposed_option_id, v_tick, false);
            END IF;
        END IF;

        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick, 'resolved', v_resolved);
END;
$$;
GRANT EXECUTE ON FUNCTION public.resolve_due_bills() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
