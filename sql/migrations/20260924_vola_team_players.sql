-- 20260924_vola_team_players.sql
--
-- National Vola Team — 3-player roster per nation.
--
--   Position 1 → Forward    (Captain)
--   Position 2 → Midfielder
--   Position 3 → Defender
--
-- Each player has a fixed rating set at recruitment time:
--     rating = floor(national_vola_culture) + 1d6
--
-- Players retire after 1d36 ticks; the tick processor auto-generates
-- a replacement at the *current* culture, so a nation that's been
-- climbing keeps recruiting better players over time, and one that's
-- decayed recruits weaker.
--
-- Team Prowess = sum of all 3 active player ratings. Stored on
-- nations.national_team_prowess (already exists from the trio of
-- "stat boxes" added earlier) so the UI + match resolver can read a
-- single column.

BEGIN;

CREATE TABLE IF NOT EXISTS public.vola_team_players (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id            UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    position_number      INT  NOT NULL CHECK (position_number BETWEEN 1 AND 3),
    position_name        TEXT NOT NULL CHECK (position_name IN ('Forward','Midfielder','Defender')),
    first_name           TEXT NOT NULL,
    last_name            TEXT NOT NULL,
    age                  INT  NOT NULL CHECK (age > 0),
    rating               INT  NOT NULL CHECK (rating >= 0),
    recruited_at_tick    INT  NOT NULL,
    recruited_at_culture NUMERIC(5,1) NOT NULL,
    retires_at_tick      INT  NOT NULL,
    is_captain           BOOLEAN NOT NULL DEFAULT false,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (nation_id, position_number)
);

CREATE INDEX IF NOT EXISTS vola_team_players_retire_idx
    ON public.vola_team_players (retires_at_tick);

COMMENT ON TABLE public.vola_team_players IS
    '3-player national Vola roster per nation. position_number 1=Forward(Captain), 2=Midfielder, 3=Defender. Rating fixed at recruitment (floor(culture) + 1d6); retires_at_tick = recruited_at_tick + 1d36. Tick processor auto-replaces retired players.';

-- Read access for clients (the team panel renders these).
ALTER TABLE public.vola_team_players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vola team players viewable by all authenticated"
    ON public.vola_team_players;
CREATE POLICY "Vola team players viewable by all authenticated"
    ON public.vola_team_players
    FOR SELECT TO authenticated
    USING (true);
-- Writes: service_role only (tick processor + the manual-recruit RPC).

-- ── Backfill: every nation gets 3 players ──
-- Names sampled from nations.first_name_pool / last_name_pool. Falls
-- back to generic 'Player'/'One' if a pool is empty (shouldn't happen
-- on the existing 13-nation seed but defensive).
DO $$
DECLARE
    v_tick      INT;
    v_nation    RECORD;
    v_pos       INT;
    v_first_len INT;
    v_last_len  INT;
    v_first     TEXT;
    v_last      TEXT;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN v_tick := 0; END IF;

    FOR v_nation IN
        SELECT id, first_name_pool, last_name_pool, national_vola_culture
        FROM nations
    LOOP
        v_first_len := COALESCE(array_length(v_nation.first_name_pool, 1), 0);
        v_last_len  := COALESCE(array_length(v_nation.last_name_pool,  1), 0);

        FOR v_pos IN 1..3 LOOP
            -- Skip if this slot already has a player.
            IF EXISTS (
                SELECT 1 FROM vola_team_players
                WHERE nation_id = v_nation.id AND position_number = v_pos
            ) THEN CONTINUE; END IF;

            v_first := CASE WHEN v_first_len > 0
                THEN v_nation.first_name_pool[1 + floor(random() * v_first_len)::int]
                ELSE 'Player' END;
            v_last  := CASE WHEN v_last_len > 0
                THEN v_nation.last_name_pool[1 + floor(random() * v_last_len)::int]
                ELSE CASE v_pos WHEN 1 THEN 'One' WHEN 2 THEN 'Two' ELSE 'Three' END END;

            INSERT INTO vola_team_players (
                nation_id, position_number, position_name,
                first_name, last_name, age, rating,
                recruited_at_tick, recruited_at_culture, retires_at_tick, is_captain
            ) VALUES (
                v_nation.id,
                v_pos,
                CASE v_pos WHEN 1 THEN 'Forward' WHEN 2 THEN 'Midfielder' ELSE 'Defender' END,
                v_first, v_last,
                18 + floor(random() * 18)::int,
                floor(COALESCE(v_nation.national_vola_culture, 0))::int + 1 + floor(random() * 6)::int,
                v_tick,
                COALESCE(v_nation.national_vola_culture, 0),
                v_tick + 1 + floor(random() * 36)::int,
                v_pos = 1
            );
        END LOOP;
    END LOOP;
END $$;

-- Recompute Team Prowess for every nation that just got a roster.
UPDATE nations n SET national_team_prowess = (
    SELECT COALESCE(SUM(rating), 0) FROM vola_team_players WHERE nation_id = n.id
);

-- ── recruit_vola_player_replacement RPC ──
-- Manual "RECRUIT REPLACEMENT" button on the team UI fires this for
-- a given position. Retires the existing slot's player, generates a
-- new one at current culture, recomputes prowess. Owner-gated by the
-- caller's faction holding the sports ministry seat.
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
BEGIN
    IF p_position_number NOT IN (1, 2, 3) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_position');
    END IF;

    -- Active sports minister gate.
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

    v_new_first := COALESCE(
        v_nation.first_name_pool[1 + floor(random() * GREATEST(array_length(v_nation.first_name_pool, 1), 1))::int],
        'Player'
    );
    v_new_last := COALESCE(
        v_nation.last_name_pool[1 + floor(random() * GREATEST(array_length(v_nation.last_name_pool, 1), 1))::int],
        'Replacement'
    );
    v_new_age    := 18 + floor(random() * 18)::int;
    v_new_rating := floor(COALESCE(v_nation.national_vola_culture, 0))::int + 1 + floor(random() * 6)::int;
    v_new_retire := v_tick + 1 + floor(random() * 36)::int;

    -- Replace the slot atomically.
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

    -- Recompute Team Prowess sum.
    UPDATE nations SET national_team_prowess = (
        SELECT COALESCE(SUM(rating), 0) FROM vola_team_players WHERE nation_id = v_nation.id
    ) WHERE id = v_nation.id;

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

COMMENT ON FUNCTION recruit_vola_player_replacement(INT) IS
  'Sports Minister force-retires the player in a given position and recruits a fresh one at current culture. Updates national_team_prowess. SECURITY DEFINER bypasses vola_team_players RLS (writes are tick-processor-only).';

NOTIFY pgrst, 'reload schema';

COMMIT;
