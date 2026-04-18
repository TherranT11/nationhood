-- ============================================================
-- Third-pass organic-route tightening. Player feedback after the
-- proximity-based cuts: long-haul lanes are fine, the clutter was
-- LOW-volume small-economy routes, not distance. Switch from a
-- proximity gate to a volume gate only.
--
-- Levers applied in the TS generator (supabase/functions/advance-corp-tick/
-- index.ts) — the active path — and mirrored into this SQL fallback:
--
--     v_max_prox       20 → 200       effectively unlimited (kept only
--                                      as a guard against rogue values)
--     v_min_volume     $50M → $5B     heavy floor, filters the long tail
--
-- Target: ~30–40 active organic routes (down from ~370). Aligned with
-- the top-volume slice of the current distribution ($5B+).
--
-- Cleanup at the bottom expires every currently-active organic route
-- whose trade_volume is below $5B, using an EXISTS guard to dodge the
-- uq_shipping_route unique constraint. The handful of skipped triples
-- (where an expired row already exists) roll off naturally within 8
-- ticks.
-- ============================================================

CREATE OR REPLACE FUNCTION generate_organic_shipping_routes(
    target_tick INT DEFAULT NULL
)
RETURNS TABLE (generated INT, expired INT)
LANGUAGE plpgsql
AS $func$
DECLARE
    v_tick           INT;
    v_lifetime       INT     := 8;
    v_max_prox       INT     := 200;         -- was 20 — effectively off
    v_revenue_mult   NUMERIC := 0.35;
    v_min_volume     NUMERIC := 5000000000;  -- $50M → $5B
    v_flow_window    INT     := 4;
    v_generated      INT     := 0;
    v_expired        INT     := 0;
BEGIN
    IF target_tick IS NULL THEN
        SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    ELSE
        v_tick := target_tick;
    END IF;

    IF v_tick IS NULL THEN
        RAISE EXCEPTION 'generate_organic_shipping_routes: could not resolve tick';
    END IF;

    WITH sector_meta(sector, subsector, category, goods, goods_sub, vessel, vessel_note, unit, revenue_rate) AS (
        VALUES
            ('fuel_energy',        'bulk_cargo',        'FUEL',     'Fuel & Energy Products',    'Petroleum, LNG, coal, refined fuels',         'Tanker',         'Double-hull required.',    'tons', 0.06::NUMERIC),
            ('minerals',           'bulk_cargo',        'MINERALS', 'Minerals & Raw Materials',  'Iron ore, copper, bauxite, rare earths',      'Bulk Carrier',   'Heavy-load bulk.',         'tons', 0.06::NUMERIC),
            ('grains_staples',     'bulk_cargo',        'FOOD',     'Grains & Staples',          'Wheat, rice, corn, soybeans',                 'Bulk Carrier',   'Dry bulk holds.',          'tons', 0.06::NUMERIC),
            ('livestock_dairy',    'bulk_cargo',        'FOOD',     'Livestock & Dairy',         'Feed crops, processed dairy, frozen meat',    'Bulk Carrier',   'Temperature-controlled.',  'tons', 0.06::NUMERIC),
            ('cash_crops',         'bulk_cargo',        'FOOD',     'Cash Crops',                'Coffee, cocoa, tobacco, cotton, rubber',      'Bulk Carrier',   'Standard dry bulk.',       'tons', 0.06::NUMERIC),
            ('manufactured_goods', 'container_freight', 'MFG',      'Manufactured Goods',        'Consumer goods, vehicles, industrial parts',  'Container Ship', 'Standard container.',      'TEU',  0.08::NUMERIC),
            ('technology',         'container_freight', 'TECH',     'Technology & Electronics',  'Semiconductors, electronics, equipment',      'Container Ship', 'Climate-controlled.',      'TEU',  0.08::NUMERIC),
            ('fruits_vegetables',  'container_freight', 'FOOD',     'Perishable Produce',        'Fresh fruit, vegetables, seafood',            'Reefer Ship',    'Refrigerated holds.',      'tons', 0.08::NUMERIC)
    ),
    latest_flows AS (
        SELECT DISTINCT ON (tf.nation_id, tf.sector)
            tf.nation_id, tf.sector, tf.tick,
            COALESCE(tf.export_volume, 0) AS export_volume,
            COALESCE(tf.import_volume, 0) AS import_volume,
            COALESCE(tf.import_demand, 0) AS import_demand
        FROM   trade_flows tf
        WHERE  tf.tick <= v_tick
          AND  tf.tick >= v_tick - v_flow_window
        ORDER  BY tf.nation_id, tf.sector, tf.tick DESC
    ),
    pair_candidates AS (
        SELECT
            e.nation_id                                                        AS origin_id,
            i.nation_id                                                        AS dest_id,
            e.sector                                                           AS sector,
            LEAST(e.export_volume, GREATEST(i.import_volume, i.import_demand)) AS flow_size,
            dr.proximity                                                       AS proximity,
            op.port_name                                                       AS origin_port,
            dp.port_name                                                       AS destination_port,
            COALESCE(n_dest.tariffs, 0)                                        AS dest_tariff
        FROM latest_flows e
        JOIN latest_flows i
            ON i.sector = e.sector AND i.nation_id <> e.nation_id
        JOIN diplomatic_relations dr
            ON ((dr.nation_a_id = e.nation_id AND dr.nation_b_id = i.nation_id)
             OR (dr.nation_a_id = i.nation_id AND dr.nation_b_id = e.nation_id))
        JOIN nation_ports op ON op.nation_id = e.nation_id
        JOIN nation_ports dp ON dp.nation_id = i.nation_id
        JOIN nations      n_dest ON n_dest.id = i.nation_id
        WHERE e.export_volume                                      >= v_min_volume
          AND GREATEST(i.import_volume, i.import_demand)           >= v_min_volume
          AND dr.proximity                                         IS NOT NULL
          AND dr.proximity                                         <= v_max_prox
    ),
    routes AS (
        SELECT DISTINCT ON (origin_id, dest_id, sector)
            origin_id, dest_id, sector, flow_size, proximity,
            origin_port, destination_port, dest_tariff
        FROM pair_candidates
        ORDER BY origin_id, dest_id, sector, flow_size DESC
    ),
    inserted AS (
        INSERT INTO shipping_routes (
            origin_nation_id, destination_nation_id, origin_port, destination_port,
            trade_sector, cargo_category, shipping_subsector, scope,
            goods_name, goods_description, vessel_class, vessel_note,
            trade_volume, estimated_revenue, volume_physical, volume_unit,
            transit_ticks, proximity, tariff_rate,
            demand_level, trade_agreement_id, trade_agreement_name,
            status, generated_at_tick, last_refreshed_tick
        )
        SELECT
            r.origin_id, r.dest_id, r.origin_port, r.destination_port,
            r.sector, sm.category, sm.subsector,
            CASE WHEN r.proximity <= 15 THEN 'COASTAL' ELSE 'INTERNATIONAL' END,
            sm.goods, 'Open market — ' || sm.goods_sub, sm.vessel, sm.vessel_note,
            ROUND(r.flow_size)::NUMERIC,
            ROUND(r.flow_size * sm.revenue_rate * v_revenue_mult)::NUMERIC,
            ROUND(r.flow_size / 100)::NUMERIC,
            sm.unit,
            GREATEST(1, LEAST(6, 1 + (r.proximity / 20)))::INT,
            r.proximity, r.dest_tariff,
            CASE WHEN r.flow_size >= 20000000 THEN 'MODERATE' ELSE 'LOW' END,
            NULL, NULL, 'active', v_tick, v_tick
        FROM   routes r
        JOIN   sector_meta sm ON sm.sector = r.sector
        ON CONFLICT (origin_nation_id, destination_nation_id, trade_sector, status) DO UPDATE SET
            trade_volume        = EXCLUDED.trade_volume,
            estimated_revenue   = EXCLUDED.estimated_revenue,
            volume_physical     = EXCLUDED.volume_physical,
            volume_unit         = EXCLUDED.volume_unit,
            demand_level        = EXCLUDED.demand_level,
            tariff_rate         = EXCLUDED.tariff_rate,
            proximity           = EXCLUDED.proximity,
            scope               = EXCLUDED.scope,
            last_refreshed_tick = v_tick,
            updated_at          = NOW()
        RETURNING 1
    )
    SELECT COUNT(*)::INT INTO v_generated FROM inserted;

    WITH expired_rows AS (
        UPDATE shipping_routes
        SET    status     = 'expired',
               updated_at = NOW()
        WHERE  status              = 'active'
          AND  trade_agreement_id IS NULL
          AND  last_refreshed_tick < v_tick - v_lifetime
        RETURNING 1
    )
    SELECT COUNT(*)::INT INTO v_expired FROM expired_rows;

    RETURN QUERY SELECT v_generated, v_expired;
END;
$func$;

GRANT EXECUTE ON FUNCTION generate_organic_shipping_routes(INT) TO authenticated, service_role;

-- One-off cleanup: expire every currently-active organic route whose
-- trade_volume lands below the new $5B floor. NOT EXISTS guard skips
-- triples where an expired row already exists (prevents the
-- uq_shipping_route unique violation that bit us on the prior pass).
-- Uses UPDATE not DELETE so the FK from shipping_applications.route_id
-- stays intact.
UPDATE shipping_routes r
SET    status     = 'expired',
       updated_at = NOW()
WHERE  r.status              = 'active'
  AND  r.trade_agreement_id IS NULL
  AND  r.trade_volume        < 5000000000
  AND  NOT EXISTS (
         SELECT 1 FROM shipping_routes r2
         WHERE  r2.origin_nation_id      = r.origin_nation_id
           AND  r2.destination_nation_id = r.destination_nation_id
           AND  r2.trade_sector          = r.trade_sector
           AND  r2.status                = 'expired'
       );
