-- 20260925_vola_team_rerun_1d6.sql
--
-- Re-roll the National Vola Team roster.
--
-- The 20260924 backfill shipped two bugs:
--   1. rating used a static "+6" instead of "+1d6"
--   2. the two random() calls for first_name / last_name
--      occasionally collapsed to identical pool indexes
--      ("Idris Idris", "Bashir Bashir") on some plans.
--
-- This migration wipes vola_team_players, regenerates the
-- 3-player roster for every nation using lateral random
-- picks (so each name draws from its own random()), and
-- replaces recruit_vola_player_replacement so future
-- recruits use the same 1d6 formula.

BEGIN;

-- Clear and rebuild every nation's roster.
TRUNCATE TABLE public.vola_team_players RESTART IDENTITY;

WITH shard_tick AS (
    SELECT current_tick AS t FROM shard WHERE name = 'Alpha Shard' LIMIT 1
)
INSERT INTO vola_team_players (
    nation_id, position_number, position_name,
    first_name, last_name, age, rating,
    recruited_at_tick, recruited_at_culture, retires_at_tick, is_captain
)
SELECT
    n.id,
    p.pos,
    CASE p.pos WHEN 1 THEN 'Forward' WHEN 2 THEN 'Midfielder' ELSE 'Defender' END,
    COALESCE(n.first_name_pool[r.first_idx], 'Player'),
    COALESCE(n.last_name_pool[r.last_idx],
             CASE p.pos WHEN 1 THEN 'One' WHEN 2 THEN 'Two' ELSE 'Three' END),
    r.age,
    floor(COALESCE(n.national_vola_culture, 0))::int + r.d6,
    (SELECT t FROM shard_tick),
    COALESCE(n.national_vola_culture, 0),
    (SELECT t FROM shard_tick) + 1 + r.d36,
    p.pos = 1
FROM nations n
CROSS JOIN (VALUES (1),(2),(3)) AS p(pos)
CROSS JOIN LATERAL (
    SELECT
        1 + floor(random() * GREATEST(COALESCE(array_length(n.first_name_pool, 1), 0), 1))::int AS first_idx,
        1 + floor(random() * GREATEST(COALESCE(array_length(n.last_name_pool,  1), 0), 1))::int AS last_idx,
        18 + floor(random() * 18)::int AS age,
        1  + floor(random() *  6)::int AS d6,
        floor(random() * 36)::int      AS d36
) r;

-- Recompute Team Prowess = SUM(rating) for all nations.
UPDATE nations n SET national_team_prowess = COALESCE((
    SELECT SUM(rating) FROM vola_team_players WHERE nation_id = n.id
), 0);

-- Replace the manual-recruit RPC so the +6 → +1d6 fix sticks for
-- future force-retires from the Sports Ministry button.
CREATE OR REPLACE FUNCTION recruit_vola_player_replacement(p_position_number INT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller        UUID := auth.uid();
    v_ministry      ministries%ROWTYPE;
    v_nation        nations%ROWTYPE;
    v_tick          INT;
    v_new_first     TEXT;
    v_new_last      TEXT;
    v_new_age       INT;
    v_new_rating    INT;
    v_new_retire    INT;
    v_pos_name      TEXT;
    v_first_len     INT;
    v_last_len      INT;
BEGIN
    IF p_position_number NOT IN (1, 2, 3) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_position');
    END IF;

    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'sports' AND is_active = true
          AND EXISTS (
              SELECT 1 FROM factions f
              WHERE f.id = ministries.party_id
                AND (f.id = v_caller OR f.linked_user_id = v_caller)
          )
        ORDER BY created_at DESC LIMIT 1;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_minister');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_ministry.nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    v_pos_name := CASE p_position_number
        WHEN 1 THEN 'Forward'
        WHEN 2 THEN 'Midfielder'
        ELSE 'Defender' END;

    v_first_len := GREATEST(COALESCE(array_length(v_nation.first_name_pool, 1), 0), 1);
    v_last_len  := GREATEST(COALESCE(array_length(v_nation.last_name_pool,  1), 0), 1);

    v_new_first  := COALESCE(v_nation.first_name_pool[1 + floor(random() * v_first_len)::int], 'Player');
    v_new_last   := COALESCE(v_nation.last_name_pool [1 + floor(random() * v_last_len )::int], 'Replacement');
    v_new_age    := 18 + floor(random() * 18)::int;
    v_new_rating := floor(COALESCE(v_nation.national_vola_culture, 0))::int + 1 + floor(random() * 6)::int;
    v_new_retire := v_tick + 1 + floor(random() * 36)::int;

    DELETE FROM vola_team_players
        WHERE nation_id = v_nation.id AND position_number = p_position_number;
    INSERT INTO vola_team_players (
        nation_id, position_number, position_name,
        first_name, last_name, age, rating,
        recruited_at_tick, recruited_at_culture, retires_at_tick, is_captain
    ) VALUES (
        v_nation.id, p_position_number, v_pos_name,
        v_new_first, v_new_last, v_new_age, v_new_rating,
        v_tick, COALESCE(v_nation.national_vola_culture, 0),
        v_new_retire, p_position_number = 1
    );

    UPDATE nations SET national_team_prowess = COALESCE((
        SELECT SUM(rating) FROM vola_team_players WHERE nation_id = v_nation.id
    ), 0) WHERE id = v_nation.id;

    RETURN jsonb_build_object(
        'success', true,
        'first_name', v_new_first,
        'last_name', v_new_last,
        'age', v_new_age,
        'rating', v_new_rating,
        'retires_at_tick', v_new_retire
    );
END;
$$;

GRANT EXECUTE ON FUNCTION recruit_vola_player_replacement(INT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
