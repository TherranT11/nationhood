-- ============================================================
-- Drop shipping_claims.vessel_status — consolidate SSoT
--
-- Prior behaviour: vessel activity state was stored in TWO columns:
--   * corp_vessels.status        (in_port, in_transit, dry_dock, ...)
--   * shipping_claims.vessel_status (loading, in_transit, unloading, idle)
--
-- Every state transition had to write BOTH. When one write succeeded
-- and the other didn't (silent exception mid-tick), vessels got stuck
-- in inconsistent states — "ships sat on LOADING forever" was the
-- symptom traced back to this dual-write pattern multiple times.
--
-- Fix: corp_vessels.status becomes the single source of truth. The
-- display "loading" value is now derived at render time from
--   claim.status='active' AND vessel.status='in_port'
-- and "in_transit" maps directly to vessel.status='in_transit'. No
-- stored copy on the claim, so no drift possible.
--
-- Safe to re-run: IF EXISTS guard.
-- ============================================================

ALTER TABLE shipping_claims DROP COLUMN IF EXISTS vessel_status;

-- Verify
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'shipping_claims' AND column_name = 'vessel_status';
-- Expected: 0 rows
