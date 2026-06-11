-- ════════════════════════════════════════════════════════════════════
-- 20270833 — New Product: Automotive Electrical Components
--
-- Generated live from each nation's stocks, like Construction
-- Materials: every [1 Mineral + 1 Consumer Goods] pair on hand yields
-- 5 components — amount = LEAST(minerals, consumer_goods) × 5
-- (7 Minerals + 2 Consumer Goods → 10; 4 + 3 → 15). Base cost $5,000,
-- priced per nation on the same scarcity curve as the other goods
-- (global average supply ÷ local supply, clamped 0.5–3, flat base
-- while the whole world holds zero).
--
--   automotive_components_market(p_nation_id): the canonical
--   amount/price (mirrors construction_materials_market's shape).
--   construction_market_listings re-emitted byte-faithful to
--   20270828 plus the third 'components' array — it is the market
--   page's one round-trip for every shelf, construction or not.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── automotive_components_market ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.automotive_components_market(p_nation_id uuid)
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
    -- Each [1 Mineral + 1 Consumer Goods] pair yields 5 components.
    SELECT LEAST(COALESCE(minerals, 0), COALESCE(consumer_goods, 0)) * 5 INTO v_local
      FROM nations WHERE id = p_nation_id;
    IF v_local IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT SUM(LEAST(COALESCE(minerals, 0), COALESCE(consumer_goods, 0)) * 5), COUNT(*)
      INTO v_global, v_count
      FROM nations
     WHERE name = ANY (market_nation_names());

    -- Same scarcity curve as the construction goods; while the whole
    -- world holds zero components, everyone pays flat base.
    IF COALESCE(v_global, 0) = 0 THEN
        v_mult := 1;
    ELSE
        v_mult := GREATEST(0.5, LEAST(3,
            (v_global / GREATEST(v_count, 1)) / GREATEST(v_local, 1)));
    END IF;

    RETURN jsonb_build_object(
        'success',          true,
        'amount_available', FLOOR(v_local)::bigint,
        'cost_per_unit',    ROUND(5000 * v_mult)::bigint,
        'base_cost',        5000,
        'scarcity_mult',    ROUND(v_mult, 2),
        'local_supply',     FLOOR(v_local)::bigint,
        'global_supply',    FLOOR(COALESCE(v_global, 0))::bigint
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.automotive_components_market(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.automotive_components_market(uuid) TO authenticated;

-- ── construction_market_listings — plus the components shelf ──────
CREATE OR REPLACE FUNCTION public.construction_market_listings()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_n         RECORD;
    v_mats      jsonb := '[]'::jsonb;
    v_equip     jsonb := '[]'::jsonb;
    v_comps     jsonb := '[]'::jsonb;
    v_m         jsonb;
    v_e         jsonb;
    v_c         jsonb;
BEGIN
    FOR v_n IN
        SELECT id, name, flag_url FROM nations
         WHERE name = ANY (market_nation_names())
         ORDER BY name
    LOOP
        v_m := construction_materials_market(v_n.id);
        v_e := construction_equipment_market(v_n.id);
        v_c := automotive_components_market(v_n.id);
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
        IF COALESCE((v_c->>'success')::boolean, false) THEN
            v_comps := v_comps || jsonb_build_array(
                v_c || jsonb_build_object('nation_id', v_n.id,
                    'nation', v_n.name, 'flag_url', v_n.flag_url));
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true,
        'materials', v_mats, 'equipment', v_equip, 'components', v_comps);
END $$;

REVOKE EXECUTE ON FUNCTION public.construction_market_listings() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.construction_market_listings() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
