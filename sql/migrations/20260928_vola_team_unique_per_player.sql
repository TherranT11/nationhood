-- 20260928_vola_team_unique_per_player.sql
--
-- The previous backfills (20260925, 20260927) used a CROSS JOIN LATERAL
-- to produce one random index per (nation, position) row. The LATERAL
-- subquery only referenced the outer `n` (nation), not `p.pos`, so
-- Postgres evaluated it ONCE per nation and reused the same name /
-- age / rating across all 3 positions — every nation ended up with
-- three identical players ("Mahmoud Al-Kassab" x3 at rating 10).
--
-- Fix: rebuild the roster inside a PL/pgSQL DO block. Each
-- (nation, position) is a separate INSERT, so every random() call
-- runs fresh and the planner has no opportunity to hoist.
--
-- Idempotent: TRUNCATE first, then re-insert, then recompute prowess.

BEGIN;

DO $$
DECLARE
    v_tick    INT;
    v_nation  RECORD;
    v_pos     INT;
    v_first   TEXT;
    v_last    TEXT;
    v_first_len INT;
    v_last_len  INT;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN v_tick := 0; END IF;

    TRUNCATE TABLE public.vola_team_players RESTART IDENTITY;

    FOR v_nation IN
        SELECT id, first_name_pool, last_name_pool, national_vola_culture
        FROM nations
    LOOP
        v_first_len := COALESCE(array_length(v_nation.first_name_pool, 1), 0);
        v_last_len  := COALESCE(array_length(v_nation.last_name_pool,  1), 0);

        FOR v_pos IN 1..3 LOOP
            -- Independent random pick per slot.
            IF v_first_len > 0 THEN
                v_first := v_nation.first_name_pool[1 + floor(random() * v_first_len)::int];
            ELSE
                v_first := 'Player';
            END IF;

            IF v_last_len > 0 THEN
                v_last := v_nation.last_name_pool[1 + floor(random() * v_last_len)::int];
            ELSE
                v_last := CASE v_pos WHEN 1 THEN 'One' WHEN 2 THEN 'Two' ELSE 'Three' END;
            END IF;

            INSERT INTO vola_team_players (
                nation_id, position_number, position_name,
                first_name, last_name, age, rating,
                recruited_at_tick, recruited_at_culture, retires_at_tick, is_captain
            ) VALUES (
                v_nation.id,
                v_pos,
                CASE v_pos WHEN 1 THEN 'Forward' WHEN 2 THEN 'Midfielder' ELSE 'Defender' END,
                v_first,
                v_last,
                18 + floor(random() * 18)::int,
                floor(COALESCE(v_nation.national_vola_culture, 0))::int + 1 + floor(random() * 6)::int,
                v_tick,
                COALESCE(v_nation.national_vola_culture, 0),
                v_tick + 1 + floor(random() * 36)::int,
                v_pos = 1
            );
        END LOOP;
    END LOOP;

    UPDATE nations n SET national_team_prowess = COALESCE((
        SELECT SUM(rating) FROM vola_team_players WHERE nation_id = n.id
    ), 0);
END $$;

COMMIT;
