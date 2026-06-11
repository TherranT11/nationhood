-- ════════════════════════════════════════════════════════════════════
-- 20270819 — The Market lists every nation
--
-- The Raw Materials and Products tabs show one row per nation —
-- NAME | NATION | AMOUNT AVAILABLE | COST PER UNIT — instead of only
-- the viewer's home market.
--
--   construction_market_listings(): one round-trip returning both
--   goods for every nation, built by looping the CANONICAL
--   per-nation functions (construction_materials_market /
--   construction_equipment_market) — prices and amounts can't drift
--   from what the buy RPC charges because they're the same calls.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
        SELECT id, name, flag_url FROM nations ORDER BY name
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

NOTIFY pgrst, 'reload schema';

COMMIT;
