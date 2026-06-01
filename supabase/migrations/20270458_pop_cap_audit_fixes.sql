-- ════════════════════════════════════════════════════════════════════
-- Audit follow-up on 20270457 — pop-cap coverage + trigger safety
--
-- Three issues found in pre-commit audit:
--
-- 1. politician_mp_hold_rally (20270434) still clamps to LEAST(100, …)
--    on its +1 popularity reward. With the 40-cap shipping, a rally
--    can push a party's popularity above 40. Re-paste with the cap.
--
-- 2. resolve_due_bills (20270423) updates popularity per party per
--    bill outcome with LEAST(100, …). Same gap. Re-paste with the cap.
--
-- 3. trg_shard_annual_january has no exception handler. If
--    process_annual_january throws (rare but possible — bad data, lock
--    contention, etc.), the AFTER UPDATE trigger propagates the
--    exception and the shard tick UPDATE rolls back, blocking ALL
--    tick advances until the issue is fixed. Wrap PERFORM in a
--    BEGIN/EXCEPTION block — log the failure, let the shard update
--    commit, lose at most one year of effects.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Trigger exception guard ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_shard_annual_january()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NEW.current_tick IS DISTINCT FROM OLD.current_tick
       AND NEW.current_tick > COALESCE(OLD.current_tick, -1) THEN
        BEGIN
            PERFORM public.process_annual_january(NEW.current_tick);
        EXCEPTION WHEN OTHERS THEN
            -- Tick advance must not be blocked by annual-process
            -- failures. Log + continue. Losing one year of effects is
            -- recoverable; a stalled tick clock is not.
            RAISE WARNING 'process_annual_january failed for tick %: % (%)',
                NEW.current_tick, SQLERRM, SQLSTATE;
        END;
    END IF;
    RETURN NEW;
END;
$$;

-- ── 2. politician_mp_hold_rally — clamp at popularity_cap_pct ───────
CREATE OR REPLACE FUNCTION public.politician_mp_hold_rally()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_party_name text;
    v_tick       int;
    v_funds      bigint;
    v_roll       int;
    v_stat       int;
    v_total      int;
    v_passed     boolean;
    v_new_pop    numeric;
    v_new_rep    int;
    v_new_funds  numeric;
    v_cost       bigint := 10000;
BEGIN
    v_ctx := _mp_action_check();
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;
    v_funds      := (v_ctx->>'party_funds')::bigint;
    v_stat       := (v_ctx->>'charisma')::int;

    IF v_funds < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_party_funds',
            'have', v_funds, 'need', v_cost);
    END IF;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_cost
     WHERE id = v_party_id
    RETURNING party_funds INTO v_new_funds;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + v_stat;
    v_passed := v_total >= 5;

    IF v_passed THEN
        UPDATE factions
           SET popularity_pct = LEAST(popularity_cap_pct, COALESCE(popularity_pct, 0) + 1)
         WHERE id = v_party_id
        RETURNING popularity_pct INTO v_new_pop;
    ELSE
        UPDATE factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) - 1)
         WHERE id = v_pol_id
        RETURNING politician_reputation INTO v_new_rep;
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 6 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'hold_rally',
        'roll',                 v_roll,
        'stat',                 v_stat,
        'total',                v_total,
        'passed',               v_passed,
        'cost',                 v_cost,
        'party_funds_after',    v_new_funds,
        'new_party_popularity', v_new_pop,
        'new_reputation',       v_new_rep,
        'party_name',           v_party_name,
        'next_action_tick',     v_tick + 6
    );
END;
$$;

-- ── 3. resolve_due_bills — clamp at popularity_cap_pct ──────────────
-- The bill resolver applies a per-party popularity delta based on
-- alignment with the bill's archetype + absenteeism penalty. Previously
-- LEAST(100, …); now reads the party's cap. v_delta can be negative
-- (cap clamp is no-op for those), positive (cap-bounded), or zero
-- (skipped entirely by the v_delta <> 0 guard).
CREATE OR REPLACE FUNCTION public.resolve_due_bills()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick      int;
    v_bill      assembly_bills%ROWTYPE;
    v_party     RECORD;
    v_resolved  int := 0;
    v_yes       int;
    v_no        int;
    v_align     int;
    v_pos       int;
    v_pop       numeric;
    v_cap       numeric;
    v_delta     numeric;
    v_absent    int;
    v_base      numeric := 4.0;
    v_outcome   text;
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
            SELECT p.id, p.seats, p.archetype, p.popularity_pct, p.popularity_cap_pct,
                   (SELECT COUNT(*) FROM factions f
                     WHERE f.faction_type = 'politician'
                       AND f.politician_party_id = p.id
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
                v_pos := v_align;
            ELSE
                v_pos := CASE WHEN v_party.member_yes > v_party.member_no THEN 1
                              WHEN v_party.member_no  > v_party.member_yes THEN -1
                              ELSE 0 END;
            END IF;

            IF v_pos > 0 THEN
                v_yes := v_yes + COALESCE(v_party.seats, 0);
            ELSIF v_pos < 0 THEN
                v_no := v_no + COALESCE(v_party.seats, 0);
            END IF;

            v_pop   := COALESCE(v_party.popularity_pct, 0);
            v_cap   := COALESCE(v_party.popularity_cap_pct, 40);
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

            IF v_delta <> 0 THEN
                UPDATE factions
                   SET popularity_pct = GREATEST(0, LEAST(v_cap, v_pop + v_delta))
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

NOTIFY pgrst, 'reload schema';

COMMIT;
