-- ════════════════════════════════════════════════════════════════════
-- 20270811 — The Market: Construction Materials pricing
--
-- The businessman MARKET tab opens with one tradable row under Raw
-- Materials: Construction Materials.
--
--   AMOUNT AVAILABLE = (nation's Energy on hand + Minerals on hand) × 3
--
--   COST PER UNIT    = $20,000 base × scarcity multiplier, where
--                      scarcity = global AVERAGE nation supply ÷ this
--                      nation's supply (supply = energy + minerals),
--                      clamped 0.5×–3× ($10k floor, $60k ceiling).
--                      A nation holding exactly the global average
--                      pays base; resource-poor nations pay up to 3×;
--                      resource-rich ones floor at half.
--
-- construction_materials_market(p_nation_id) is the ONE source for
-- both numbers — the market page displays it today, and the purchase
-- RPC reads the same function when buying lands, so the listed price
-- IS the charged price by construction.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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
      FROM nations;

    v_mult := GREATEST(0.5, LEAST(3,
        (v_global / GREATEST(v_count, 1)) / GREATEST(v_local, 1)));

    RETURN jsonb_build_object(
        'success',          true,
        'amount_available', FLOOR(v_local * 3)::bigint,
        'cost_per_unit',    ROUND(20000 * v_mult)::bigint,
        'base_cost',        20000,
        'scarcity_mult',    ROUND(v_mult, 2),
        'local_supply',     FLOOR(v_local)::bigint,
        'global_supply',    FLOOR(COALESCE(v_global, 0))::bigint
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.construction_materials_market(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.construction_materials_market(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
