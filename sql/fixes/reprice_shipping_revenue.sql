-- Reprice existing shipping_routes + shipping_claims to the new revenue rates.
--
-- Context: SHIPPING_REVENUE_RATES were originally 6% / 8% / 12% of per-tick
-- bilateral trade volume. On top-volume lanes (~$10B/tick) that produced
-- $600M–$850M per trip — about 1500× too high. New rates:
--   bulk_cargo:              0.00004  (0.004%)
--   container_freight:       0.00005  (0.005%)
--   specialized_transport:   0.00008  (0.008%)
-- Target: $250k–$750k/trip for a single corp on a top lane.
--
-- generateShippingRoutes() upserts estimated_revenue every tick, and
-- claim_shipping_route() recalculates revenue_per_transit from it, so once
-- the next tick runs they'd converge on their own. This script does it
-- immediately so active claims don't keep paying the old rates for a tick.
--
-- Idempotent — re-running just writes the same values.

BEGIN;

-- 1. Reprice routes. organic = (trade_agreement_id IS NULL); those routes
--    already had a 0.35 multiplier baked into their stored estimated_revenue
--    at generation time, so we apply the same multiplier here to match.
UPDATE shipping_routes
SET estimated_revenue = ROUND(
    trade_volume
    * CASE shipping_subsector
        WHEN 'bulk_cargo'            THEN 0.00004
        WHEN 'container_freight'     THEN 0.00005
        WHEN 'specialized_transport' THEN 0.00008
        ELSE 0.00004
      END
    * CASE WHEN trade_agreement_id IS NULL THEN 0.35 ELSE 1.0 END
)
WHERE status = 'active';

-- 2. Reprice active claims against the freshly repriced routes.
UPDATE shipping_claims sc
SET revenue_per_transit = ROUND(
    r.estimated_revenue * (sc.market_share_pct / 100.0)
)
FROM shipping_routes r
WHERE sc.route_id = r.id
  AND sc.status  = 'active';

COMMIT;

-- Verify top 10 by new revenue_per_transit.
SELECT
    sc.id                  AS claim_id,
    f.faction_name,
    r.origin_port || ' -> ' || r.destination_port AS route,
    r.trade_sector,
    r.trade_volume,
    r.estimated_revenue,
    sc.market_share_pct,
    sc.revenue_per_transit
FROM shipping_claims sc
JOIN shipping_routes r ON r.id = sc.route_id
JOIN factions f        ON f.id = sc.faction_id
WHERE sc.status = 'active'
ORDER BY sc.revenue_per_transit DESC
LIMIT 10;
