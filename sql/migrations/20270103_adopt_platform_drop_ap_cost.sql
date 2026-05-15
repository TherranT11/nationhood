-- adopt_platform: drop the AP cost + restore the auth gate.
--
-- The original RPC (20260413, wrapped by 20260727) charged 2 AP via
-- deduct_ap() before recording the adoption. Per UX revision the action
-- card no longer surfaces an AP cost — the client-side modal has its
-- "2 AP" badge and "Costs 2 AP." hint removed alongside this. Keeping
-- the server deduction would be a silent gotcha (action looks free,
-- secretly spends AP), so drop it here too.
--
-- IMPORTANT: deduct_ap was also the de-facto auth check — it returns
-- -1 if `p_faction_id != auth.uid()`, which gated cross-faction
-- adoption. Removing it bare would let any authenticated user adopt
-- platforms on any faction. This migration adds an explicit
-- ownership check up front (matching the pattern used by the
-- ministry survey RPCs), supporting both primary
-- (factions.id = auth.uid()) and linked
-- (factions.linked_user_id = auth.uid()) faction ownership.
--
-- All other gates and side effects preserved: existence check, slot
-- cap (max 3), 6-tick cooldown, momentum award + rival penalties,
-- faction_platforms row insert, _apply_platform_sector_effects call.
--
-- The money cost ($120k, enforced client-side and via the action-card
-- moneyCost field) is unrelated and remains.

BEGIN;

CREATE OR REPLACE FUNCTION adopt_platform(
    p_faction_id UUID,
    p_nation_id UUID,
    p_platform_key TEXT,
    p_tick INT,
    p_baseline_stats JSONB DEFAULT '{}'::jsonb,
    p_target_stats JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_next_slot INT;
    v_last_adopted_tick INT;
    v_existing_count INT;
    v_existing_holder RECORD;
    v_my_momentum NUMERIC;
    v_penalty NUMERIC;
    v_cooldown_ticks INT := 6;
    v_pop_result JSONB;
BEGIN
    -- Auth gate. Previously implicit via deduct_ap; now explicit since
    -- the action no longer costs AP. Supports linked factions.
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated.');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM factions
        WHERE id = p_faction_id
          AND (id = v_caller OR linked_user_id = v_caller)
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this faction.');
    END IF;

    IF EXISTS (SELECT 1 FROM faction_platforms WHERE faction_id = p_faction_id AND platform_key = p_platform_key) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already adopted this platform.');
    END IF;

    SELECT COALESCE(MAX(slot), 0) + 1 INTO v_next_slot
    FROM faction_platforms WHERE faction_id = p_faction_id;

    IF v_next_slot > 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'All 3 platform slots are full.');
    END IF;

    SELECT MAX(adopted_at_tick) INTO v_last_adopted_tick
    FROM faction_platforms WHERE faction_id = p_faction_id;

    IF v_last_adopted_tick IS NOT NULL AND (p_tick - v_last_adopted_tick) < v_cooldown_ticks THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Platform cooldown active. ' || (v_cooldown_ticks - (p_tick - v_last_adopted_tick)) || ' ticks remaining.'
        );
    END IF;

    -- AP deduction removed (see migration header). The action is free
    -- in AP; money cost is enforced client-side via moneyCost.

    SELECT COUNT(*) INTO v_existing_count
    FROM faction_platforms
    WHERE nation_id = p_nation_id
      AND platform_key = p_platform_key
      AND faction_id != p_faction_id;

    CASE v_existing_count
        WHEN 0 THEN v_my_momentum := 12; v_penalty := 0;
        WHEN 1 THEN v_my_momentum := 6;  v_penalty := 6;
        WHEN 2 THEN v_my_momentum := 4;  v_penalty := 4;
        ELSE         v_my_momentum := 2;  v_penalty := 2;
    END CASE;

    IF v_penalty > 0 THEN
        FOR v_existing_holder IN
            SELECT fp.faction_id
            FROM faction_platforms fp
            WHERE fp.nation_id = p_nation_id
              AND fp.platform_key = p_platform_key
              AND fp.faction_id != p_faction_id
        LOOP
            PERFORM adjust_momentum(
                v_existing_holder.faction_id,
                -v_penalty,
                'Platform contested: ' || p_platform_key,
                p_tick
            );
        END LOOP;
    END IF;

    PERFORM adjust_momentum(
        p_faction_id,
        v_my_momentum,
        'Platform adopted: ' || p_platform_key,
        p_tick
    );

    INSERT INTO faction_platforms (faction_id, nation_id, platform_key, slot, adopted_at_tick, baseline_stats, target_stats, popularity_applied)
    VALUES (p_faction_id, p_nation_id, p_platform_key, v_next_slot, p_tick, p_baseline_stats, p_target_stats, true);

    v_pop_result := _apply_platform_sector_effects(
        p_faction_id, p_nation_id, p_platform_key, 'adopt'
    );

    RETURN jsonb_build_object(
        'success', true,
        'slot', v_next_slot,
        'momentum_gained', v_my_momentum,
        'existing_holders_penalized', v_existing_count,
        'penalty_per_holder', v_penalty,
        'sector_effects', v_pop_result
    );
END;
$$;

ALTER FUNCTION public.adopt_platform(UUID, UUID, TEXT, INT, JSONB, JSONB) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.adopt_platform(UUID, UUID, TEXT, INT, JSONB, JSONB) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
