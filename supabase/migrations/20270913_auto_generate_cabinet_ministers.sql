-- ════════════════════════════════════════════════════════════════════
-- 20270913 — Auto-generate cabinet ministers from the coalition
-- ════════════════════════════════════════════════════════════════════
-- Every nation's four major ministries (Foreign Affairs & Trade, Interior,
-- Economic Development, Defense) should be staffed by ministers drawn from
-- the parties in government. Movement parties have no NPC member roster, so
-- each minister is a generated NPC tagged to a Governing/Coalition party
-- (party_id), named from the nation's first/last name pools, given a
-- realistic age.
--
-- Distribution: SEAT-WEIGHTED. Each portfolio is handed to a party picked
-- with probability proportional to its seats, so larger parties hold more
-- of the cabinet. Foreign Affairs & Trade is SKIPPED when a player holds
-- the dedicated Foreign Minister post (politician_foreign_minister_at_tick,
-- 20270868) — that post is the source of truth there.
--
-- The function is additive and idempotent: it only fills a ministry that
-- has no active named minister, never overwriting an existing (player or
-- prior NPC) holder. It runs:
--   1. as a backfill over every existing nation (bottom of this file), and
--   2. on every government formation, via an AFTER INSERT trigger on
--      head_of_government (party_status is already set by then). The trigger
--      swallows errors so cabinet staffing can never abort an election.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.populate_cabinet_ministers(p_nation_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    -- Canonical major-ministry slugs (mirror _major_ministry_keys(),
    -- 20270904) paired with their display names.
    v_keys   text[] := ARRAY['foreign_affairs','interior','economic_development','defense'];
    v_names  text[] := ARRAY['Foreign Affairs & Trade','Interior','Economic Development','Defense'];
    v_nation       nations%ROWTYPE;
    v_idx          int;
    v_key          text;
    v_total_seats  int;
    v_pick         int;
    v_acc          int;
    v_party        RECORD;
    v_chosen       uuid;
    v_first        text;
    v_last         text;
    v_age          int;
    v_first_len    int;
    v_last_len     int;
    v_fm_held      boolean;
    v_staffed      boolean;
BEGIN
    IF p_nation_id IS NULL THEN RETURN; END IF;
    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN RETURN; END IF;

    v_first_len := COALESCE(array_length(v_nation.first_name_pool, 1), 0);
    v_last_len  := COALESCE(array_length(v_nation.last_name_pool, 1), 0);

    -- Seat total across the cabinet bloc (Governing + Coalition).
    SELECT COALESCE(SUM(GREATEST(COALESCE(seats, 0), 0)), 0)
      INTO v_total_seats
      FROM factions
     WHERE nation_id = p_nation_id AND faction_type = 'movement_party'
       AND abandoned_at IS NULL AND party_status IN ('Governing', 'Coalition');
    IF v_total_seats <= 0 THEN RETURN; END IF;  -- nothing to staff from yet

    -- Player-held Foreign Minister post → leave foreign_affairs to the post.
    SELECT EXISTS (
        SELECT 1 FROM factions
         WHERE nation_id = p_nation_id
           AND politician_foreign_minister_at_tick IS NOT NULL
           AND abandoned_at IS NULL
    ) INTO v_fm_held;

    FOR v_idx IN 1 .. array_length(v_keys, 1) LOOP
        v_key := v_keys[v_idx];

        IF v_key = 'foreign_affairs' AND v_fm_held THEN
            CONTINUE;
        END IF;

        -- Already staffed with a named minister? Leave it untouched.
        SELECT EXISTS (
            SELECT 1 FROM ministries
             WHERE nation_id = p_nation_id AND ministry_key = v_key
               AND is_active = true AND COALESCE(minister_last_name, '') <> ''
        ) INTO v_staffed;
        IF v_staffed THEN CONTINUE; END IF;

        -- Seat-weighted pick of a Governing/Coalition party.
        v_pick   := 1 + floor(random() * v_total_seats)::int;
        v_acc    := 0;
        v_chosen := NULL;
        FOR v_party IN
            SELECT id, GREATEST(COALESCE(seats, 0), 0) AS seats
              FROM factions
             WHERE nation_id = p_nation_id AND faction_type = 'movement_party'
               AND abandoned_at IS NULL AND party_status IN ('Governing', 'Coalition')
             ORDER BY seats DESC, created_at ASC
        LOOP
            v_acc := v_acc + v_party.seats;
            IF v_pick <= v_acc THEN
                v_chosen := v_party.id;
                EXIT;
            END IF;
        END LOOP;
        IF v_chosen IS NULL THEN CONTINUE; END IF;

        -- Generate the NPC minister: name from the nation pools, adult age.
        v_first := CASE WHEN v_first_len > 0
            THEN v_nation.first_name_pool[1 + floor(random() * v_first_len)::int] ELSE 'Alex' END;
        v_last  := CASE WHEN v_last_len > 0
            THEN v_nation.last_name_pool[1 + floor(random() * v_last_len)::int] ELSE 'Vargas' END;
        v_age   := 40 + floor(random() * 26)::int;  -- 40..65

        -- UNIQUE (nation_id, ministry_key) ignores is_active, so a dormant
        -- row may exist — upsert fills it in place rather than duplicating.
        INSERT INTO ministries (
            nation_id, ministry_key, ministry_name, party_id,
            minister_first_name, minister_last_name, minister_age,
            is_active, created_at
        ) VALUES (
            p_nation_id, v_key, v_names[v_idx], v_chosen,
            v_first, v_last, v_age, true, now()
        )
        ON CONFLICT (nation_id, ministry_key) DO UPDATE SET
            party_id            = EXCLUDED.party_id,
            minister_first_name = EXCLUDED.minister_first_name,
            minister_last_name  = EXCLUDED.minister_last_name,
            minister_age        = EXCLUDED.minister_age,
            ministry_name       = COALESCE(ministries.ministry_name, EXCLUDED.ministry_name),
            is_active           = true;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.populate_cabinet_ministers(uuid) IS
    'Fills a nation''s four major ministries (foreign_affairs / interior / economic_development / defense) with generated NPC ministers drawn seat-weighted from Governing+Coalition parties. Additive (only staffs empty seats), skips foreign_affairs when a player holds the Foreign Minister post (20270868). Backfilled here + run on every government formation via trg_populate_cabinet_after_hog. 20270913.';

GRANT EXECUTE ON FUNCTION public.populate_cabinet_ministers(uuid) TO authenticated;

-- ── Ongoing hook: staff the cabinet whenever a government forms ──────
-- head_of_government gets a fresh active row at the end of
-- assign_government_coalition (and the full formation path), after
-- party_status is written — the right moment to staff the rest of the
-- cabinet. Best-effort: any failure is logged, never propagated, so it
-- cannot abort election resolution.
CREATE OR REPLACE FUNCTION public._tg_populate_cabinet_after_hog()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF NEW.active THEN
        BEGIN
            PERFORM public.populate_cabinet_ministers(NEW.nation_id);
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'populate_cabinet_ministers failed for nation %: %', NEW.nation_id, SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_populate_cabinet_after_hog ON public.head_of_government;
CREATE TRIGGER trg_populate_cabinet_after_hog
    AFTER INSERT ON public.head_of_government
    FOR EACH ROW EXECUTE FUNCTION public._tg_populate_cabinet_after_hog();

-- ── Backfill every existing nation ──────────────────────────────────
DO $do$
DECLARE v_n RECORD;
BEGIN
    FOR v_n IN SELECT id FROM nations LOOP
        PERFORM public.populate_cabinet_ministers(v_n.id);
    END LOOP;
END $do$;

COMMIT;
