-- ════════════════════════════════════════════════════════════════════
-- 20270815 — Products: Construction Equipment (ratcheting supply)
--
-- The Market's second good, under the PRODUCTS tab. Equipment is
-- manufactured, not derived: any tick where a nation's ENERGY and
-- CONSUMER GOODS both rose, +7 units land in that nation's
-- construction_equipment_stock — and once added they stay (a later
-- oil selloff dropping Energy takes nothing back). Stock only falls
-- when purchasing consumes it (future).
--
--   nations.construction_equipment_stock  the ratcheting stockpile
--   nations.equip_last_energy /           last tick's watermarks; a
--   nations.equip_last_consumer_goods     NULL watermark (first run)
--                                         records without accruing
--
--   accrue_construction_equipment(p_tick): per-tick sweep from
--   advance-corp-tick. Naturally idempotent — a second run in the
--   same tick sees current == watermark and adds nothing.
--
--   construction_equipment_market(p_nation_id): the one source for
--   the PRODUCTS listing. Amount = the stockpile. Cost = $75,000
--   base × the same scarcity curve as Construction Materials
--   (global average stock ÷ local stock, clamped 0.5×–3×), with a
--   flat-base guard while the whole world's stock is still zero.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS construction_equipment_stock numeric NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS equip_last_energy            numeric,
    ADD COLUMN IF NOT EXISTS equip_last_consumer_goods    numeric;

-- ── accrue_construction_equipment ─────────────────────────────────
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
         WHERE equip_last_energy IS NOT NULL
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

-- ── construction_equipment_market ─────────────────────────────────
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
      FROM nations;

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

NOTIFY pgrst, 'reload schema';

COMMIT;
