-- Platforms: retire momentum, add flat sector-popularity headline
--
-- Per design decision "keep table, swap momentum only":
--   • The nuanced per-sector boost/penalty table
--     (_apply_platform_sector_effects, 'adopt' and 'fail') is UNCHANGED.
--   • adopt_platform no longer awards momentum (self or rival penalty)
--     — momentum is retired game-wide.
--   • Adopting now also applies a flat +0.3 popularity (+3 tenths) to
--     EVERY active sector of the faction's nation, as the headline
--     reward. The matching failure penalty (−0.5 / −5 tenths to every
--     active sector when promised stat targets aren't met) is applied
--     in js/game/platform-promises.js via _apply_flat_sector_popularity.
--
-- New helper _apply_flat_sector_popularity is the single source of
-- truth for "flat delta to all active sectors": adopt_platform PERFORMs
-- it (+3); platform-promises.js calls it over RPC (−5). SECURITY
-- DEFINER + REVOKE FROM PUBLIC, mirroring _apply_platform_sector_effects
-- (faction_sector_popularity is admin/service-role write-only).
--
-- Flat magnitudes mirror PLATFORM_POPULARITY in js/game/platforms.js;
-- keep them in sync. Idempotent (CREATE OR REPLACE); prerequisites
-- (popularity_applied column, platform_sector_effects catalog,
-- _apply_platform_sector_effects) already exist on the live DB.

BEGIN;

-- ── Single source of truth: flat delta to all active sectors ────
CREATE OR REPLACE FUNCTION _apply_flat_sector_popularity(
    p_faction_id   UUID,
    p_nation_id    UUID,
    p_delta_tenths INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sec     RECORD;
    v_applied INTEGER := 0;
BEGIN
    IF p_delta_tenths = 0 THEN
        RETURN jsonb_build_object('success', true, 'applied', 0, 'delta_tenths', 0);
    END IF;

    FOR v_sec IN
        SELECT id FROM sectors
         WHERE nation_id = p_nation_id AND is_active = true
    LOOP
        INSERT INTO faction_sector_popularity (faction_id, sector_id, popularity)
        VALUES (p_faction_id, v_sec.id, GREATEST(0, LEAST(100, p_delta_tenths)))
        ON CONFLICT (faction_id, sector_id) DO UPDATE
            SET popularity = GREATEST(0, LEAST(100,
                    faction_sector_popularity.popularity + p_delta_tenths)),
                updated_at = NOW();
        v_applied := v_applied + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'applied', v_applied,
                              'delta_tenths', p_delta_tenths);
END;
$$;

REVOKE EXECUTE ON FUNCTION _apply_flat_sector_popularity(UUID, UUID, INT) FROM PUBLIC;
-- Reachable from adopt_platform (PERFORM, function-owner privilege
-- chain) and from advance-tick / platform-promises.js (service_role).


-- ── adopt_platform: drop momentum, add flat popularity ──────────
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
    v_cooldown_ticks INT := 6;
    v_pop_result JSONB;
BEGIN
    -- Auth gate (explicit since the action no longer costs AP; supports
    -- linked factions).
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

    -- Serialize concurrent adopts by the same caller so a double-click
    -- can't pass the dup / slot / cooldown checks twice before either
    -- insert lands (check-then-insert TOCTOU). Mirrors hold_rally.
    PERFORM 1 FROM factions WHERE id = p_faction_id FOR UPDATE;

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

    -- Momentum award + rival penalties removed: momentum is retired.
    -- The contestation-count branching only ever drove momentum, so it
    -- is gone too.

    INSERT INTO faction_platforms (faction_id, nation_id, platform_key, slot, adopted_at_tick, baseline_stats, target_stats, popularity_applied)
    VALUES (p_faction_id, p_nation_id, p_platform_key, v_next_slot, p_tick, p_baseline_stats, p_target_stats, true);

    -- Nuanced per-sector boost/penalty table (unchanged — boosts your
    -- natural constituencies, penalizes your structural opposition).
    v_pop_result := _apply_platform_sector_effects(
        p_faction_id, p_nation_id, p_platform_key, 'adopt'
    );

    -- Flat headline reward: +0.3 popularity (3 tenths) across every
    -- active sector. Replaces the retired momentum award. Magnitude
    -- mirrors PLATFORM_POPULARITY.adoptTenths in js/game/platforms.js;
    -- the matching −0.5 failure penalty is applied in
    -- platform-promises.js via the same helper.
    PERFORM _apply_flat_sector_popularity(p_faction_id, p_nation_id, 3);

    RETURN jsonb_build_object(
        'success', true,
        'slot', v_next_slot,
        'flat_popularity_tenths', 3,
        'sector_effects', v_pop_result
    );
END;
$$;

ALTER FUNCTION public.adopt_platform(UUID, UUID, TEXT, INT, JSONB, JSONB) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.adopt_platform(UUID, UUID, TEXT, INT, JSONB, JSONB) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
