-- =========================================================================
-- Reclassify fuel_energy shipping routes from bulk_cargo to
-- specialized_transport.
--
-- The SHIPPING_SECTOR_MAP in js/game/shipping.js previously paired
-- fuel_energy with subsector='bulk_cargo' even though the vessel for
-- petroleum / LNG cargo is Tanker / LNG carrier — vessel classes that
-- only Specialized Transport corps can own (Bulk Cargo corps own
-- Reefer / Bulk / Coastal). The mismatch hid every oil/LNG route from
-- Specialized Transport corps and surfaced them on Bulk Cargo
-- corps that had no eligible vessel to bid them.
--
-- This migration brings existing shipping_routes rows in line with the
-- corrected mapping. Only non-completed routes are updated — finished
-- voyages are kept as historical record under their original tag.
--
-- Idempotent: re-runs only touch rows that still carry the old tag.
-- =========================================================================

UPDATE shipping_routes
SET shipping_subsector = 'specialized_transport'
WHERE trade_sector = 'fuel_energy'
  AND shipping_subsector = 'bulk_cargo'
  AND status = 'active';

-- Verify: every active fuel_energy lane should now be specialized_transport.
SELECT
    trade_sector,
    shipping_subsector,
    status,
    COUNT(*) AS routes
FROM shipping_routes
WHERE trade_sector = 'fuel_energy'
GROUP BY trade_sector, shipping_subsector, status
ORDER BY status, shipping_subsector;
