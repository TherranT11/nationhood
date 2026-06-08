-- ════════════════════════════════════════════════════════════════════
-- 20270729 — Tier algorithm back to relative ranking
--              (within the foundable_for_politician set)
--
-- User wants the picker to always show at least one of each tier —
-- A, B, and C. The absolute-threshold algorithm in 20270725
--   C: count < 5  /  B: 5-14  /  A: 15+
-- doesn't guarantee that. With the current population (Avelia 29,
-- Melizea 23, Montequilla 21, Sierramar 7) all four nations clear
-- the 5-count floor; Sierramar is the only B, the other three pile
-- up at A, and nobody ever reads as C. The "jumpstart" tier becomes
-- invisible to onboarding.
--
-- Revert to the relative-third-split the original (pre-20270725)
-- algorithm used, but keep the foundable_for_politician filter
-- 20270725 introduced. That filter is what made Sierramar
-- mistakenly read as Tier A in the first place — Sierramar with one
-- politician topped the count-DESC ranking across ALL 30+ nations.
-- With the same ranking scoped to the four foundable nations the
-- busy ones (29 / 23 / 21) become A/B and the quiet one (7) reads
-- as C, which is exactly the gameplay shape the user wants.
--
-- Tier algorithm at N=4 (current state):
--   pos 0 (busiest)              → A
--   pos 1, 2 (middle)            → B
--   pos N-1 (quietest)           → C
-- The aSize / cSize = floor(N/3) bucket math handles N=3, N=5, etc.
-- gracefully — there's always at least one A and one C for N >= 3.
-- N=1 → A; N=2 → A/C. Documented in the function body.
--
-- Schema: no changes. nations.foundable_for_politician still gates
-- both the picker (client) and the founding RPC (server). Forward-
-- only: existing politicians don't get retro-bumped.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
    IF v_nation.foundable_for_politician IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_foundable');
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

    -- Tier algorithm: rank foundable_for_politician nations by active-
    -- politician count DESC; top third → A, bottom third → C, middle
    -- → B. random() tiebreak on equal counts so a flat field doesn't
    -- always slot the same nation into A. With N=4 you get pos
    -- 0 → A, pos 1-2 → B, pos 3 → C — exactly one of each tier with
    -- a middle band. N=1 → A; N=2 → A/C. Mirrored client-side in
    -- first-steps.html's computeTierMap.
    WITH counts AS (
        SELECT n.id AS nation_id,
               COUNT(f.id) FILTER (
                   WHERE f.faction_type = 'politician'
                     AND f.abandoned_at IS NULL
               ) AS pol_count
          FROM nations n
          LEFT JOIN factions f ON f.nation_id = n.id
         WHERE n.foundable_for_politician = TRUE
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

    -- 20270710 stat values, unchanged.
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
        'faction_id', v_faction_id,
        'tier',       v_tier
    );
END $$;

GRANT EXECUTE ON FUNCTION public.create_politician_with_tier_stats(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION public.create_politician_with_tier_stats(uuid, text, text) IS
    'Onboards a new politician with relative-third-split tier stats (20270729). Gate: nations.foundable_for_politician must be TRUE. Tier from relative ranking of active-politician COUNT across the foundable set — top third A (basic), middle B (boosted), bottom third C (jumpstart). Guarantees at least one A and one C whenever N >= 3. Stat values unchanged from 20270710. Forward-only.';

NOTIFY pgrst, 'reload schema';

COMMIT;
