-- ══════════════════════════════════════════════════════════════
-- Drop Fuel Depot / Dry Dock from the Expansion catalog entirely.
--
-- Earlier scope (SOP3) removed them from the Shipping Operations
-- page; the Expansion → Purchase grid still surfaces them because
-- it reads available_properties directly. Per user direction:
-- full removal, including any already-purchased rows.
--
-- Three steps, in order:
--   1. Refund the corp's last-known book value for any active rows
--      they own (purchase_price × condition/100, mirrors the
--      valuation helper). Mass-write into corp_cash_reserves so
--      no corp loses value silently.
--   2. Delete those corp_properties rows.
--   3. Delete the catalog rows in available_properties.
--
-- Idempotent — re-running on a fresh DB is a no-op.
-- ══════════════════════════════════════════════════════════════


-- 1. Refund book value to corps that currently own these properties.
WITH owned AS (
    SELECT faction_id,
           SUM(ROUND(COALESCE(purchase_price, 0) * (COALESCE(condition, 0) / 100.0)))::BIGINT AS refund
      FROM corp_properties
     WHERE type IN ('fuel_depot', 'dry_dock')
       AND is_active = true
       AND faction_id IS NOT NULL
     GROUP BY faction_id
)
UPDATE factions f
   SET corp_cash_reserves = COALESCE(f.corp_cash_reserves, 0) + o.refund
  FROM owned o
 WHERE f.id = o.faction_id;


-- 2. Drop owned rows. Use DELETE rather than is_active=false so the
--    UI never resurfaces them, and so the corp_properties valuation
--    counts move cleanly.
DELETE FROM corp_properties
 WHERE type IN ('fuel_depot', 'dry_dock');


-- 3. Drop catalog rows. After this, the Expansion → Purchase grid
--    can no longer offer them.
DELETE FROM available_properties
 WHERE type IN ('fuel_depot', 'dry_dock');


NOTIFY pgrst, 'reload schema';
