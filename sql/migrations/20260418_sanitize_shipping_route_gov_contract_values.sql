BEGIN;

-- Recompute government-contract terms from controlled economics so
-- outlier values (manual edits, stale upserts, old formulas) do not
-- drive UI payouts.
WITH normalized AS (
    SELECT
        sr.id,
        GREATEST(2, COALESCE(NULLIF(sr.gov_contract_duration, 0), NULLIF(sr.transit_ticks, 0), 1))::INT AS contract_duration,
        LEAST(
            18000000,
            GREATEST(
                1000000,
                ROUND(
                    GREATEST(250000, COALESCE(sr.estimated_revenue, 0))
                    * GREATEST(2, COALESCE(NULLIF(sr.gov_contract_duration, 0), NULLIF(sr.transit_ticks, 0), 1))
                    * 1.35
                )
            )
        )::NUMERIC AS contract_value
    FROM shipping_routes sr
    WHERE sr.scope = 'GOVERNMENT'
      AND sr.status IN ('active', 'claimed')
)
UPDATE shipping_routes sr
SET
    gov_contract_duration = n.contract_duration,
    gov_contract_value = n.contract_value,
    gov_issuer = COALESCE(NULLIF(sr.gov_issuer, ''), 'Ministry of Defense'),
    updated_at = NOW()
FROM normalized n
WHERE sr.id = n.id;

-- Clear government-only fields from non-government routes.
UPDATE shipping_routes
SET
    gov_contract_value = NULL,
    gov_contract_duration = NULL,
    gov_issuer = NULL,
    updated_at = NOW()
WHERE scope <> 'GOVERNMENT'
  AND (
      gov_contract_value IS NOT NULL
      OR gov_contract_duration IS NOT NULL
      OR gov_issuer IS NOT NULL
  );

COMMIT;
