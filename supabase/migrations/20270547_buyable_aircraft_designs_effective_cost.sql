-- ════════════════════════════════════════════════════════════════════
-- 20270547 — Buyable aircraft designs: effective unit cost
--
-- Bug report: the Buy Aircraft modal on the airline side reads
-- ent_aircraft_designs.cost_per_unit as the displayed per-unit
-- price. That field is computed at design research time as:
--
--     cost_per_unit = airframe.cost
--                   + engine.cost_per_unit × engine_count   ← engine
--                   + modules + offerings                     DESIGN cost
--
-- The engine.cost_per_unit term is the ENGINE DESIGN's stored
-- production cost, not what the aircraft manufacturer actually paid
-- to import engines from another corp via the engine-order RFP flow
-- (ent_engine_orders). When the engine is bought at a market price
-- well above the design's own cost (typical — sellers add margin),
-- the displayed cost understates the manufacturer's real outlay,
-- which forces them to either eat the loss or look like a scammer
-- on RFP bids.
--
-- This migration ships a list RPC the buyer modal can call instead
-- of the existing direct table query. The RPC returns the standard
-- design columns + two cost fields:
--
--   cost_per_unit            — the stored design value, unchanged.
--   effective_cost_per_unit  — design value adjusted for the
--                              manufacturer's most recent completed
--                              engine purchase. When the manufacturer
--                              has no purchase record (self-produced
--                              engines), the two values match.
--
-- Math:
--   adjustment = engine_count × (latest_purchase_price - engine.cost_per_unit)
--   effective_cost_per_unit = cost_per_unit + adjustment
--
-- Latest purchase = most recent ent_engine_orders row WHERE
-- buyer_corp_id = manufacturer AND engine_design_id matches AND
-- status='completed'. LATERAL join, NULL-safe via COALESCE so
-- self-produced engines (no row) pass through with adjustment = 0.
--
-- Read-only RPC. SECURITY DEFINER for the cross-table read, REVOKE
-- PUBLIC + GRANT authenticated.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.list_buyable_aircraft_designs(p_buyer_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_designs jsonb;
BEGIN
    IF p_buyer_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',                       d.id,
        'name',                     d.name,
        'airframe_class',           d.airframe_class,
        'passengers',               d.passengers,
        'range_nm',                 d.range_nm,
        'demand_score',             d.demand_score,
        'safety_score',             d.safety_score,
        'quality',                  d.quality,
        'engine_count',             d.engine_count,
        'cost_per_unit',            d.cost_per_unit,
        -- effective_cost_per_unit folds in the manufacturer's most
        -- recent completed engine purchase price. If they self-
        -- produce engines (no row in ent_engine_orders), latest_eng
        -- is NULL → adjustment is 0 → matches the stored design cost.
        'effective_cost_per_unit',  d.cost_per_unit
                                    + COALESCE(d.engine_count, 0)
                                      * COALESCE(latest.price_per_unit - COALESCE(e.cost_per_unit, 0), 0),
        'engine_import_price',      latest.price_per_unit,
        'engine_design_cost',       e.cost_per_unit,
        'owner',                    jsonb_build_object('name', mfr.name)
    ) ORDER BY d.name), '[]'::jsonb)
      INTO v_designs
      FROM public.ent_aircraft_designs d
      JOIN public.entrepreneur_corps mfr ON mfr.id = d.entrepreneur_corp_id
      LEFT JOIN public.ent_aircraft_designs e ON e.id = d.engine_design_id
      LEFT JOIN LATERAL (
          SELECT eo.price_per_unit
            FROM public.ent_engine_orders eo
           WHERE eo.buyer_corp_id    = d.entrepreneur_corp_id
             AND eo.engine_design_id = d.engine_design_id
             AND eo.status           = 'completed'
             AND eo.price_per_unit IS NOT NULL
           ORDER BY eo.created_at DESC
           LIMIT 1
      ) latest ON true
     WHERE d.design_type    = 'aircraft'
       AND d.status         = 'available'
       AND d.entrepreneur_corp_id <> p_buyer_corp_id
       AND d.airframe_class IN ('regional', 'narrowbody', 'widebody');

    RETURN jsonb_build_object('success', true, 'designs', v_designs);
END $$;

REVOKE EXECUTE ON FUNCTION public.list_buyable_aircraft_designs(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_buyable_aircraft_designs(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
