-- ============================================================
-- Backfill corp_properties for completed corp-commissioned contracts
-- ============================================================
--
-- Earlier deliveries (both tick-processor auto-delivery and
-- manual-button delivery from before the handoff was wired up)
-- left the finished asset off the issuer's PROPERTY card.
-- This one-shot migration retro-inserts a corp_properties row
-- for every completed construction_contracts row that:
--   - has issuer_faction_id set (corp-commissioned, not
--     national infrastructure), and
--   - doesn't already have a corp_properties row linked via
--     built_via_contract_id.
--
-- Metadata defaults match getDeliveredPropertyMeta() in
-- advance-corp-tick/index.ts and _deliveryPropertyMeta() in
-- corp-operations.html — keep them in sync if you change one.
-- ============================================================

INSERT INTO corp_properties (
    faction_id,
    nation_id,
    catalog_id,
    name,
    type,
    style,
    capacity,
    purchase_price,
    monthly_maintenance,
    condition,
    city,
    purchased_at_tick,
    built_via_contract_id,
    is_active,
    created_at
)
SELECT
    cc.issuer_faction_id                                                     AS faction_id,
    cc.nation_id                                                             AS nation_id,
    NULL                                                                     AS catalog_id,
    cc.name                                                                  AS name,
    CASE
        WHEN cc.template_key IN ('fuel_depot', 'dry_dock') THEN cc.template_key
        WHEN cc.template_key = 'custom_building'           THEN 'office'
        ELSE cc.template_key
    END                                                                      AS type,
    COALESCE(NULLIF(cc.project_subtype, ''), 'Basic')                        AS style,
    CASE
        WHEN cc.template_key IN ('fuel_depot', 'dry_dock')
             AND cc.project_subtype = 'Modern' THEN 500
        WHEN cc.template_key IN ('fuel_depot', 'dry_dock')            THEN 250
        ELSE 500
    END                                                                      AS capacity,
    COALESCE(cd.payment_received, cc.budget_ceiling, 0)                      AS purchase_price,
    CASE
        WHEN cc.template_key = 'fuel_depot' AND cc.project_subtype = 'Modern' THEN 110000
        WHEN cc.template_key = 'fuel_depot'                                   THEN 85000
        WHEN cc.template_key = 'dry_dock'   AND cc.project_subtype = 'Modern' THEN 200000
        WHEN cc.template_key = 'dry_dock'                                     THEN 150000
        ELSE GREATEST(10000, ROUND(COALESCE(cd.payment_received, cc.budget_ceiling, 10000000) * 0.001))
    END                                                                      AS monthly_maintenance,
    GREATEST(25, LEAST(100, COALESCE(cd.quality_score, 65)))                 AS condition,
    NULL                                                                     AS city,
    COALESCE(cc.completed_at_tick, cd.delivered_at_tick)                     AS purchased_at_tick,
    cc.id                                                                    AS built_via_contract_id,
    TRUE                                                                     AS is_active,
    NOW()                                                                    AS created_at
FROM construction_contracts cc
LEFT JOIN LATERAL (
    SELECT d.payment_received, d.quality_score, d.delivered_at_tick
    FROM   construction_deliveries d
    WHERE  d.contract_id = cc.id
    ORDER  BY d.delivered_at_tick DESC NULLS LAST
    LIMIT  1
) cd ON TRUE
WHERE cc.status IN ('completed', 'delivered')
  AND cc.issuer_faction_id IS NOT NULL
  AND cc.template_key IN ('fuel_depot', 'dry_dock', 'custom_building')
  AND NOT EXISTS (
      SELECT 1
      FROM   corp_properties cp
      WHERE  cp.built_via_contract_id = cc.id
  );

-- Report how many rows landed so the operator can sanity-check.
DO $$
DECLARE rowcount INT;
BEGIN
    SELECT COUNT(*) INTO rowcount
    FROM   corp_properties
    WHERE  built_via_contract_id IS NOT NULL
      AND  created_at >= NOW() - INTERVAL '5 minutes';
    RAISE NOTICE 'Backfill: % corp_properties rows created from completed contracts', rowcount;
END $$;
