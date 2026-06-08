-- ════════════════════════════════════════════════════════════════════
-- 20270710 — Tier stat rebalance + mayor_party backfill fix
--
-- Two unrelated things bundled together because they're both
-- one-shot data tweaks.
--
-- 1. Re-balance Tier A / B / C starting stats per user spec:
--
--                            Skill   Rep   Cap   Inf
--      Tier A (busy, lowest):  1      1     1    10   (was 1/1/1/1)
--      Tier B (middle):       30     15     7    40   (was 20/10/15/50)
--      Tier C (empty, top):   50     30    15    80   (was 30/35/35/80)
--
--    Re-emits create_politician_with_tier_stats verbatim from
--    20270697 except for the stat block — tier-selection algorithm,
--    linked-vs-primary path, and INSERT/UPSERT shape unchanged.
--    Forward-only per the convention 20270693 established: existing
--    politicians don't get retro-bumped.
--
-- 2. Fix Sierramar's Puerto Rey mayor missing the party chip. The
--    20270708 backfill matched factions.archetype = cities.mayor_
--    archetype exactly — fails on whitespace / casing drift (e.g.
--    "Communist/Leftist" vs "Communist / Leftist"). Two passes:
--
--    a) Case-insensitive, whitespace-stripped fuzzy match across all
--       cities. Catches the typical Communist/Leftist mismatch and
--       similar.
--    b) Defensive force-set for Sierramar's capital → MAB
--       (Movimiento Autonómico de Base) by name match, in case the
--       fuzzy pass still misses.
--
--    Both passes guarded on mayor_party_id IS NULL so already-set
--    cities aren't disturbed.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. create_politician_with_tier_stats re-emit ──────────────────
CREATE OR REPLACE FUNCTION public.create_politician_with_tier_stats(
    p_nation_id  uuid,
    p_first_name text,
    p_last_name  text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_nation     nations%ROWTYPE;
    v_tick       int;
    v_existing   uuid;
    v_primary    uuid;
    v_is_linked  boolean;
    v_faction_id uuid;
    v_first      text;
    v_last       text;
    v_n          int;
    v_pos        int;
    v_a_size     int;
    v_c_size     int;
    v_tier       text;
    v_age        int;
    v_skill      int;
    v_rep        int;
    v_cap        int;
    v_inf        int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    v_first := btrim(COALESCE(p_first_name, ''));
    v_last  := btrim(COALESCE(p_last_name,  ''));
    IF length(v_first) < 1 OR length(v_last) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT id INTO v_existing
      FROM factions
     WHERE faction_type = 'politician'
       AND nation_id    = p_nation_id
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_in_nation');
    END IF;

    WITH counts AS (
        SELECT n.id AS nation_id,
               COUNT(f.id) FILTER (
                   WHERE f.faction_type = 'politician'
                     AND f.abandoned_at IS NULL
               ) AS pol_count
          FROM nations n
          LEFT JOIN factions f ON f.nation_id = n.id
         GROUP BY n.id
    ),
    ranked AS (
        SELECT nation_id,
               ROW_NUMBER() OVER (ORDER BY pol_count DESC, random()) - 1 AS pos,
               COUNT(*)    OVER ()                                      AS total
          FROM counts
    )
    SELECT pos, total INTO v_pos, v_n
      FROM ranked WHERE nation_id = p_nation_id;

    IF v_n IS NULL OR v_n <= 1 THEN
        v_tier := 'A';
    ELSIF v_n = 2 THEN
        v_tier := CASE WHEN v_pos = 0 THEN 'A' ELSE 'C' END;
    ELSE
        v_a_size := GREATEST(1, FLOOR(v_n::numeric / 3.0)::int);
        v_c_size := GREATEST(1, FLOOR(v_n::numeric / 3.0)::int);
        IF v_pos < v_a_size THEN
            v_tier := 'A';
        ELSIF v_pos >= (v_n - v_c_size) THEN
            v_tier := 'C';
        ELSE
            v_tier := 'B';
        END IF;
    END IF;

    -- 20270710 rebalance per user spec.
    IF v_tier = 'A' THEN
        v_age := 25; v_skill := 1;  v_rep := 1;  v_cap := 1;  v_inf := 10;
    ELSIF v_tier = 'B' THEN
        v_age := 45; v_skill := 30; v_rep := 15; v_cap := 7;  v_inf := 40;
    ELSE -- 'C'
        v_age := 50; v_skill := 50; v_rep := 30; v_cap := 15; v_inf := 80;
    END IF;

    SELECT id INTO v_primary FROM factions
     WHERE id = v_uid AND abandoned_at IS NULL
     LIMIT 1;
    v_is_linked  := v_primary IS NOT NULL;
    v_faction_id := CASE WHEN v_is_linked THEN gen_random_uuid() ELSE v_uid END;

    BEGIN
        IF v_is_linked THEN
            INSERT INTO factions (
                id, faction_type, faction_name,
                nation_id, nation,
                seats, action_points, party_funds,
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                politician_skill, politician_reputation,
                politician_capital, politician_influence,
                linked_user_id
            ) VALUES (
                v_faction_id, 'politician',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, 0,
                NULL,
                v_first, v_last, v_age,
                v_tick,
                v_skill, v_rep,
                v_cap, v_inf,
                v_uid
            );
        ELSE
            INSERT INTO factions (
                id, faction_type, faction_name,
                nation_id, nation,
                seats, action_points, party_funds,
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                politician_skill, politician_reputation,
                politician_capital, politician_influence,
                linked_user_id
            ) VALUES (
                v_faction_id, 'politician',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, 0,
                NULL,
                v_first, v_last, v_age,
                v_tick,
                v_skill, v_rep,
                v_cap, v_inf,
                NULL
            )
            ON CONFLICT (id) DO UPDATE SET
                faction_type          = EXCLUDED.faction_type,
                faction_name          = EXCLUDED.faction_name,
                nation_id             = EXCLUDED.nation_id,
                nation                = EXCLUDED.nation,
                seats                 = EXCLUDED.seats,
                action_points         = EXCLUDED.action_points,
                party_funds           = EXCLUDED.party_funds,
                abandoned_at          = NULL,
                leader_first_name     = EXCLUDED.leader_first_name,
                leader_last_name      = EXCLUDED.leader_last_name,
                leader_age            = EXCLUDED.leader_age,
                founded_tick          = EXCLUDED.founded_tick,
                politician_skill      = EXCLUDED.politician_skill,
                politician_reputation = EXCLUDED.politician_reputation,
                politician_capital    = EXCLUDED.politician_capital,
                politician_influence  = EXCLUDED.politician_influence,
                linked_user_id        = NULL;
        END IF;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_in_nation');
    END;

    RETURN jsonb_build_object(
        'success',    true,
        'faction_id', v_faction_id
    );
END $$;

GRANT EXECUTE ON FUNCTION public.create_politician_with_tier_stats(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION public.create_politician_with_tier_stats(uuid, text, text) IS
    'Onboards a new politician with tier-based starting stats. As of 20270710, the values are: Tier A = 1/1/1/10 (skill/rep/cap/inf), Tier B = 30/15/7/40, Tier C = 50/30/15/80. Forward-only — existing politicians are not retro-bumped.';


-- ── 2a. Mayor party backfill — fuzzy match ────────────────────────
-- Whitespace + case insensitive: handles "Communist/Leftist" vs
-- "Communist / Leftist" vs "communist / leftist". Skips cities that
-- already have a mayor_party_id set.
UPDATE public.cities c
   SET mayor_party_id = (
       SELECT f.id
         FROM public.factions f
        WHERE f.nation_id    = c.nation_id
          AND f.faction_type = 'movement_party'
          AND f.abandoned_at IS NULL
          AND LOWER(REPLACE(f.archetype, ' ', '')) =
              LOWER(REPLACE(c.mayor_archetype, ' ', ''))
        ORDER BY f.created_at ASC
        LIMIT 1
   )
 WHERE c.mayor_party_id IS NULL
   AND c.mayor_archetype IS NOT NULL;


-- ── 2b. Sierramar Puerto Rey defensive force-set ──────────────────
-- Even if the fuzzy match above misses (Sierramar parties were added
-- via admin panel, so archetype string format may not align with
-- mayor_archetype), this lands Puerto Rey on MAB by faction name.
UPDATE public.cities c
   SET mayor_party_id = (
       SELECT f.id
         FROM public.factions f
        WHERE f.nation_id    = (SELECT id FROM public.nations WHERE name = 'Sierramar')
          AND f.faction_type = 'movement_party'
          AND f.abandoned_at IS NULL
          AND f.faction_name = 'Movimiento Autonómico de Base'
        LIMIT 1
   )
 WHERE c.nation_id  = (SELECT id FROM public.nations WHERE name = 'Sierramar')
   AND c.city_type  = 'capital'
   AND c.mayor_party_id IS NULL;


NOTIFY pgrst, 'reload schema';

COMMIT;
