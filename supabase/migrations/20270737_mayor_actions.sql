-- ════════════════════════════════════════════════════════════════════
-- 20270737 — Mayor actions: Collect Taxes + Campaign
--
-- Per user spec, a sitting mayor (politician_office='mayor') gets two
-- repeatable actions on their Pressing Issues / Affiliation card:
--
--   • Collect Taxes  — adds floor(growth / 3) to city.budget, capped
--                       at 10. Costs -1 Party Popularity (floor 0).
--   • Campaign       — +1 Influence + 1 Reputation to the politician,
--                       -1 city.growth (floor 1).
--
-- Both share next_member_action_tick with Door Knocking + Give a
-- Speech — the "one party action per tick" rule. Choosing Collect
-- Taxes means giving up Door Knocking this tick, and vice versa.
-- The shared lock is the design choice the user confirmed: holding
-- the office adds choice depth, not pure additive power.
--
-- Mayor-of-capital (politician_office='mayor_of_capital') is OUT OF
-- SCOPE for V1 — the capital city's row isn't stamped with the
-- mayor's name today (the 20270724 capital-mayor branch only writes
-- party popularity, not the cities row), so we'd need that wiring
-- before the same lookups work. Filed.
--
-- City lookup keys off the cities row the resolver stamps on a
-- mayor win (20270718/20270719): nation_id + mayor_first_name +
-- mayor_last_name + mayor_party_id + city_type <> 'capital'. The
-- party_id disambiguates the unlikely case of two same-named
-- politicians in the same nation; the city_type filter blocks
-- capital fallthrough.
--
-- Both RPCs are SECURITY DEFINER, validate caller-owns-faction +
-- politician_office='mayor', and refuse if next_member_action_tick
-- hasn't expired. Return a structured envelope so the client can
-- render a one-line outcome without re-fetching.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. mayor_collect_taxes ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mayor_collect_taxes(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_city         cities%ROWTYPE;
    v_tick         int;
    v_delta        int;
    v_new_budget   int;
    v_new_pop      numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office <> 'mayor' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mayor');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    SELECT * INTO v_city FROM cities
     WHERE nation_id          = v_pol.nation_id
       AND mayor_first_name   = v_pol.leader_first_name
       AND mayor_last_name    = v_pol.leader_last_name
       AND mayor_party_id IS NOT DISTINCT FROM v_pol.politician_party_id
       AND city_type         <> 'capital'
     LIMIT 1;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    -- floor(growth / 3), capped so budget never exceeds 10.
    v_delta := GREATEST(0, FLOOR(COALESCE(v_city.growth, 0) / 3.0)::int);
    v_new_budget := LEAST(10, COALESCE(v_city.budget, 1) + v_delta);

    UPDATE cities SET budget = v_new_budget WHERE id = v_city.id;

    -- -1 Party Popularity, floor 0.
    IF v_pol.politician_party_id IS NOT NULL THEN
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
         WHERE id = v_pol.politician_party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
        RETURNING popularity_pct INTO v_new_pop;
    END IF;

    UPDATE factions
       SET next_member_action_tick = v_tick + 1
     WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',         true,
        'city_id',         v_city.id,
        'city_name',       v_city.city_name,
        'growth',          v_city.growth,
        'budget_delta',    v_delta,
        'new_budget',      v_new_budget,
        'new_popularity',  v_new_pop,
        'next_action_tick',v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.mayor_collect_taxes(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.mayor_collect_taxes(uuid) TO authenticated;


-- ── 2. mayor_campaign ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mayor_campaign(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_city         cities%ROWTYPE;
    v_tick         int;
    v_new_growth   int;
    v_new_inf      numeric;
    v_new_rep      numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office <> 'mayor' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mayor');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    SELECT * INTO v_city FROM cities
     WHERE nation_id          = v_pol.nation_id
       AND mayor_first_name   = v_pol.leader_first_name
       AND mayor_last_name    = v_pol.leader_last_name
       AND mayor_party_id IS NOT DISTINCT FROM v_pol.politician_party_id
       AND city_type         <> 'capital'
     LIMIT 1;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    -- -1 growth, floor 1.
    v_new_growth := GREATEST(1, COALESCE(v_city.growth, 1) - 1);
    UPDATE cities SET growth = v_new_growth WHERE id = v_city.id;

    UPDATE factions
       SET politician_influence  = COALESCE(politician_influence, 0)  + 1,
           politician_reputation = COALESCE(politician_reputation, 0) + 1,
           next_member_action_tick = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_influence, politician_reputation
        INTO v_new_inf, v_new_rep;

    RETURN jsonb_build_object(
        'success',         true,
        'city_id',         v_city.id,
        'city_name',       v_city.city_name,
        'growth_delta',    v_city.growth - v_new_growth,
        'new_growth',      v_new_growth,
        'new_influence',   v_new_inf,
        'new_reputation',  v_new_rep,
        'next_action_tick',v_tick + 1
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.mayor_campaign(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.mayor_campaign(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
