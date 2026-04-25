-- Reprice existing shipping_routes + shipping_claims to the service-rate band.
--
-- Design: every lane pays $250k–$750k per trip per ship, regardless of raw
-- trade volume. The corp bids inside that band in their application; on
-- acceptance that bid (clamped) becomes revenue_per_transit. We clamp here
-- so active routes + claims seeded before the service-rate model lands
-- inside the band immediately instead of waiting for the next tick.
--
-- Idempotent — re-running writes the same values.

BEGIN;

-- 1. Reprice routes: candidate revenue from the annual rate ÷ 12, then
--    clamped to [$250k, $750k]. Organic lanes keep their 0.35 multiplier
--    but the clamp rules them both in the same band.
UPDATE shipping_routes
SET estimated_revenue = LEAST(
    750000,
    GREATEST(
        250000,
        ROUND(
            trade_volume
            * CASE shipping_subsector
                WHEN 'bulk_cargo'            THEN 0.010
                WHEN 'container_freight'     THEN 0.012
                WHEN 'specialized_transport' THEN 0.016
                ELSE 0.010
              END
            * CASE WHEN trade_agreement_id IS NULL THEN 0.35 ELSE 1.0 END
            / 12.0
        )
    )
)
WHERE status = 'active';

-- 2. Reprice active claims against the freshly repriced routes. Claims
--    created before corps were offered a bid slider fall back to the
--    route's clamped estimated_revenue × market_share; once the accept
--    flow writes the bid directly this will be redundant for new claims
--    but not harmful.
UPDATE shipping_claims sc
SET revenue_per_transit = ROUND(
    r.estimated_revenue * (sc.market_share_pct / 100.0)
)
FROM shipping_routes r
WHERE sc.route_id = r.id
  AND sc.status  = 'active';

COMMIT;

-- Verify top + bottom of active contracts.
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
