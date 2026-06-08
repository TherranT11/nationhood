-- ════════════════════════════════════════════════════════════════════
-- 20270738 — Cities budget: drop the 1-10 cap, treat as a dollar
--              number (unbounded positive integer)
--
-- Per user spec change after 20270736: budget is NOT a 1-10 stat
-- like the other nine city columns. It's a single dollar number
-- displayed as "$5" or "$22" — unbounded positive int. The 1-10
-- CHECK constraint 20270736 added to budget was the wrong fit.
--
-- The nine BAND stats (infrastructure / appeal / growth / crime /
-- approval / pollution / jobs / services / affordability) stay
-- 1-10 — the descriptive-label model still applies to those. Only
-- budget changes.
--
-- Knock-on:
--   • mayor_collect_taxes (20270737) caps new_budget at 10. That
--     cap is now wrong — collect-taxes accumulates over time and
--     the cap throws away revenue silently. RPC re-emitted below
--     to remove the LEAST(10, ...) clamp.
--   • Client display in city-labels.js / politician-home.html /
--     city.html switches from "5 / 10" → "$5". Client edits land
--     in the companion commit.
--
-- Defaults unchanged (still 5 from 20270736) so newly-created
-- cities still start at "$5" — a sensible low-end starting purse.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Drop the budget 1-10 CHECK constraint ────────────────────────
ALTER TABLE public.cities
    DROP CONSTRAINT IF EXISTS cities_budget_check;

COMMENT ON COLUMN public.cities.budget IS
    '20270738 — int dollar amount (unbounded positive). Mayor''s discretionary fund. Collect Taxes adds floor(growth/3); accumulates over time. Display: "$N". (20270736 briefly modeled this as a 1-10 stat; the cap was the wrong fit.)';


-- ── 2. mayor_collect_taxes: remove the LEAST(10, ...) budget cap ────
-- Body byte-faithful to 20270737 except v_new_budget computation +
-- the return envelope (growth_yield dropped since with no cap it
-- always equals budget_delta — redundant payload).
CREATE OR REPLACE FUNCTION public.mayor_collect_taxes(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_city          cities%ROWTYPE;
    v_tick          int;
    v_delta         int;
    v_new_budget    int;
    v_new_pop       numeric;
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

    -- floor(growth / 3), no upper bound on the resulting budget.
    -- 20270738 removed the LEAST(10, …) clamp 20270737 inherited
    -- from when budget itself was a 1-10 stat.
    v_delta      := GREATEST(0, FLOOR(COALESCE(v_city.growth, 0) / 3.0)::int);
    v_new_budget := COALESCE(v_city.budget, 0) + v_delta;

    UPDATE cities SET budget = v_new_budget WHERE id = v_city.id;

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

NOTIFY pgrst, 'reload schema';

COMMIT;
