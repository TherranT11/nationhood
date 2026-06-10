-- ════════════════════════════════════════════════════════════════════
-- 20270812 — Construction Materials: 95% less on hand
--
-- The exchange was too deep. AMOUNT AVAILABLE becomes
--
--     (nation Energy + Minerals) × 3 × 0.05
--
-- — 95% less than 20270811's listing. The COST formula is untouched:
-- scarcity compares local supply against the global average, and a
-- uniform 95% haircut cancels out of that ratio, so prices stay
-- where they were.
--
-- Body byte-faithful to 20270811 except the amount_available line
-- and the comments around it.
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

NOTIFY pgrst, 'reload schema';

COMMIT;
