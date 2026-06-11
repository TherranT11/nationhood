-- ════════════════════════════════════════════════════════════════════
-- 20270828 — The market shrinks to the four live nations + equipment
-- seed
--
-- Only Sierramar, Melizea, Avelia, and Montequilla are playable; the
-- other ten seeded nations were ghosting the market — fourteen rows
-- on every tab, and worse, fourteen nations in the scarcity AVERAGE,
-- distorting every price.
--
--   market_nation_names(): the server mirror of the client's
--   BUSINESSMAN_ALLOWED_NATIONS set — the ONE place the active list
--   lives server-side. The listings, both market price functions'
--   global aggregates, and the equipment accrual sweep all filter
--   through it.
--
--   Seed: each live nation receives one manufacturing cycle (+7
--   Construction Equipment) so the Products shelf opens stocked; the
--   per-tick accrual (+7 on any month Energy AND Consumer Goods both
--   rise) continues from there.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.market_nation_names()
RETURNS text[]
LANGUAGE sql IMMUTABLE
AS $$
    SELECT ARRAY['Sierramar', 'Melizea', 'Avelia', 'Montequilla'];
$$;

COMMENT ON FUNCTION public.market_nation_names() IS
    'The live, market-participating nations (20270828) — server mirror of select-nation.html''s BUSINESSMAN_ALLOWED_NATIONS. The ONLY server-side home of the list.';

-- One manufacturing cycle each, so the shelves open stocked.
UPDATE public.nations
   SET construction_equipment_stock = COALESCE(construction_equipment_stock, 0) + 7
 WHERE name = ANY (market_nation_names());

-- ── construction_materials_market — active-nation aggregate ───────
CREATE OR REPLACE FUNCTION public.construction_materials_market(p_nation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_local  numeric;
    v_global numeric;
    v_count  int;
    v_mult   numeric;
BEGIN
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    SELECT COALESCE(energy, 0) + COALESCE(minerals, 0) INTO v_local
      FROM nations WHERE id = p_nation_id;
    IF v_local IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT SUM(COALESCE(energy, 0) + COALESCE(minerals, 0)), COUNT(*)
      INTO v_global, v_count
      FROM nations
     WHERE name = ANY (market_nation_names());

    v_mult := GREATEST(0.5, LEAST(3,
        (v_global / GREATEST(v_count, 1)) / GREATEST(v_local, 1)));

    RETURN jsonb_build_object(
        'success',          true,
        -- 20270812: 95% less on hand than the original × 3 listing.
        'amount_available', FLOOR(v_local * 3 * 0.05)::bigint,
        'cost_per_unit',    ROUND(20000 * v_mult)::bigint,
        'base_cost',        20000,
        'scarcity_mult',    ROUND(v_mult, 2),
        'local_supply',     FLOOR(v_local)::bigint,
        'global_supply',    FLOOR(COALESCE(v_global, 0))::bigint
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.construction_materials_market(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.construction_materials_market(uuid) TO authenticated;

-- ── construction_equipment_market — active-nation aggregate ───────
CREATE OR REPLACE FUNCTION public.construction_equipment_market(p_nation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_local  numeric;
    v_global numeric;
    v_count  int;
    v_mult   numeric;
BEGIN
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    SELECT COALESCE(construction_equipment_stock, 0) INTO v_local
      FROM nations WHERE id = p_nation_id;
    IF v_local IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT SUM(COALESCE(construction_equipment_stock, 0)), COUNT(*)
      INTO v_global, v_count
      FROM nations
     WHERE name = ANY (market_nation_names());

    -- Same scarcity curve as Construction Materials; while the whole
    -- world holds zero equipment, everyone pays flat base.
    IF COALESCE(v_global, 0) = 0 THEN
        v_mult := 1;
    ELSE
        v_mult := GREATEST(0.5, LEAST(3,
            (v_global / GREATEST(v_count, 1)) / GREATEST(v_local, 1)));
    END IF;

    RETURN jsonb_build_object(
        'success',          true,
        'amount_available', FLOOR(v_local)::bigint,
        'cost_per_unit',    ROUND(75000 * v_mult)::bigint,
        'base_cost',        75000,
        'scarcity_mult',    ROUND(v_mult, 2),
        'local_supply',     FLOOR(v_local)::bigint,
        'global_supply',    FLOOR(COALESCE(v_global, 0))::bigint
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.construction_equipment_market(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.construction_equipment_market(uuid) TO authenticated;

-- ── construction_market_listings — four rows per tab ──────────────
CREATE OR REPLACE FUNCTION public.construction_market_listings()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_n         RECORD;
    v_mats      jsonb := '[]'::jsonb;
    v_equip     jsonb := '[]'::jsonb;
    v_m         jsonb;
    v_e         jsonb;
BEGIN
    FOR v_n IN
        SELECT id, name, flag_url FROM nations
         WHERE name = ANY (market_nation_names())
         ORDER BY name
    LOOP
        v_m := construction_materials_market(v_n.id);
        v_e := construction_equipment_market(v_n.id);
        IF COALESCE((v_m->>'success')::boolean, false) THEN
            v_mats := v_mats || jsonb_build_array(
                v_m || jsonb_build_object('nation_id', v_n.id,
                    'nation', v_n.name, 'flag_url', v_n.flag_url));
        END IF;
        IF COALESCE((v_e->>'success')::boolean, false) THEN
            v_equip := v_equip || jsonb_build_array(
                v_e || jsonb_build_object('nation_id', v_n.id,
                    'nation', v_n.name, 'flag_url', v_n.flag_url));
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true,
        'materials', v_mats, 'equipment', v_equip);
END $$;

REVOKE EXECUTE ON FUNCTION public.construction_market_listings() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.construction_market_listings() TO authenticated;

-- ── accrue_construction_equipment — live nations only ─────────────
CREATE OR REPLACE FUNCTION public.accrue_construction_equipment(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_accrued int;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- +7 where BOTH resources rose since the last watermark; the
    -- ratchet never subtracts. First sighting (NULL watermark) just
    -- records the baseline.
    WITH bumped AS (
        UPDATE nations
           SET construction_equipment_stock = construction_equipment_stock + 7
         WHERE name = ANY (market_nation_names())
           AND equip_last_energy IS NOT NULL
           AND equip_last_consumer_goods IS NOT NULL
           AND COALESCE(energy, 0)         > equip_last_energy
           AND COALESCE(consumer_goods, 0) > equip_last_consumer_goods
        RETURNING id
    )
    SELECT COUNT(*) INTO v_accrued FROM bumped;

    UPDATE nations
       SET equip_last_energy         = COALESCE(energy, 0),
           equip_last_consumer_goods = COALESCE(consumer_goods, 0);

    RETURN jsonb_build_object('success', true, 'nations_accrued', v_accrued);
END $$;

REVOKE EXECUTE ON FUNCTION public.accrue_construction_equipment(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.accrue_construction_equipment(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
