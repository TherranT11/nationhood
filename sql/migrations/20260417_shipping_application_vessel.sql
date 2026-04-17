-- ══════════════════════════════════════════════════════════════
-- Shipping Applications — persist the vessel the corp put on offer
--
-- The corp picks a specific vessel in the route-application modal.
-- When the Minister of Trade accepts the application, we auto-assign
-- that vessel to the created shipping_claim so it starts operating
-- the route immediately (appearing as an Active Voyage on the corp side).
-- ══════════════════════════════════════════════════════════════

ALTER TABLE shipping_applications
    ADD COLUMN IF NOT EXISTS vessel_id UUID REFERENCES corp_vessels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shipping_applications_vessel
    ON shipping_applications(vessel_id);
