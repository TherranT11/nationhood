-- ════════════════════════════════════════════════════════════════════
-- 20270548 — Trim list_buyable_aircraft_designs payload
--
-- Pre-commit audit on 20270547 flagged that the RPC returned
-- engine_design_cost per row but the client never reads it. I
-- included it speculatively as "maybe a tooltip later could show
-- the engine markup," but per the design philosophy ("don't design
-- for hypothetical future requirements") it's dead in the payload.
-- Re-adding it when a real consumer needs it is one CREATE OR
-- REPLACE migration.
--
-- The math still uses e.cost_per_unit internally to compute
-- effective_cost_per_unit; it's only the BROKEN-OUT row that gets
-- dropped.
--
-- Function body otherwise byte-identical to 20270547.
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
        'effective_cost_per_unit',  d.cost_per_unit
                                    + COALESCE(d.engine_count, 0)
                                      * COALESCE(latest.price_per_unit - COALESCE(e.cost_per_unit, 0), 0),
        'engine_import_price',      latest.price_per_unit,
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

NOTIFY pgrst, 'reload schema';

COMMIT;
