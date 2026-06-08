-- ════════════════════════════════════════════════════════════════════
-- 20270697 — Tier C jumpstart: reputation + political_capital → 35
--
-- New mechanic (extension of 20270693). Bumps the Tier C starting
-- stat block from rep 20 / cap 20 → rep 35 / cap 35. Skill (30),
-- influence (80), age (50) unchanged.
--
-- Why: 20270693's Tier C value (rep 20, cap 20) sits just below the
-- repeated 30/35 thresholds used across the role-application gates:
--
--   • Experienced Advocate    — rep ≥ 30   (20270529:71)
--   • State Advocate          — rep ≥ 35 + cap ≥ 25  (20270555:352, 356)
--   • Deputy Speaker          — rep ≥ 35   (20270592:247)
--   • Speaker of the Assembly — rep ≥ 35   (20270593:92)
--   • Magistrate              — cap ≥ 35   (20270531:74)
--
-- Net effect on a brand-new Tier C joiner (e.g. Sierramar at launch
-- with zero existing players): the entire rep/cap-gated cluster
-- becomes reachable in one stat-check rather than after 5-15 ticks
-- of grinding. Skill-gated rungs (Junior Minister at skill ≥ 28) were
-- already cleared by Tier C's skill 30. Per-nation role-history gates
-- (Senior MP needs prior MP, etc.) are NOT affected — those still
-- require a Sierramar paper trail.
--
-- Tier A / Tier B values unchanged. Design rationale stays: busy
-- nations (Tier A) climb from scratch so newcomers don't shortcut
-- established players; mid-population nations (Tier B) get a moderate
-- head start; empty nations (Tier C) get the maximum jumpstart so
-- they don't launch with a non-functional government for 30 ticks.
--
-- Forward-only — existing politicians are not retro-bumped (matches
-- 20270693's stated convention). The change only affects politicians
-- created via create_politician_with_tier_stats AFTER this migration
-- applies.
--
-- Re-emits the full 20270693 function body because the change lives
-- inside the IF/ELSIF tier block; CREATE OR REPLACE is the standard
-- pattern in this codebase for surgical edits inside PL/pgSQL
-- functions (see 20270696 for a parallel).
--
-- Apply after 20270696.
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
    v_n          int;     -- total nations
    v_pos        int;     -- our nation's 0-based rank (0 = MOST populated)
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

    -- ── Stat block per tier ──────────────────────────────────────
    -- 20270697: Tier C rep + cap bumped 20 → 35 to clear the
    -- repeated 30/35 thresholds on Experienced Advocate / State
    -- Advocate / Deputy Speaker / Speaker / Magistrate gates. Tier A
    -- and Tier B unchanged.
    IF v_tier = 'A' THEN
        v_age := 25; v_skill := 1;  v_rep := 1;  v_cap := 1;  v_inf := 1;
    ELSIF v_tier = 'B' THEN
        v_age := 45; v_skill := 20; v_rep := 10; v_cap := 15; v_inf := 50;
    ELSE -- 'C'
        v_age := 50; v_skill := 30; v_rep := 35; v_cap := 35; v_inf := 80;
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
    'Onboards a new politician with tier-based starting stats. As of 20270697, Tier C joiners arrive with rep 35 + cap 35 (up from 20/20) so they clear the Experienced Advocate / State Advocate / Deputy Speaker / Speaker / Magistrate gates on day one — Tier A and Tier B values unchanged.';

NOTIFY pgrst, 'reload schema';

COMMIT;
