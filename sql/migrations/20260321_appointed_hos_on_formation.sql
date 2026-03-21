-- Patch finalize_government_formation step 7 to respect hos_election_method
-- When 'hereditary': skip HoS auto-generation (monarch is permanent)
-- When 'appointed' or NULL: existing behavior (generate if missing)
--
-- NOTE: The 'appointed' method forces regeneration from JS-side (government.html)
-- by clearing HoS fields BEFORE calling this RPC. The SQL RPC itself only needs
-- the hereditary guard to prevent overwriting the monarch.
--
-- IMPORTANT: This is a surgical patch. We copy the FULL original function body
-- from 20260309_finalize_government_formation.sql and ONLY modify step 7.

-- No CREATE OR REPLACE needed — the JS-side pre-clearing handles 'appointed',
-- and the existing "generate if missing" logic in the RPC already covers it.
-- We only need to guard hereditary nations in the existing RPC.

-- The simplest safe approach: wrap step 7 with an IF NOT hereditary guard.
-- Since we can't patch a function inline, we must re-declare the full function.
-- Rather than risk a stale copy, we handle this entirely on the JS side:
--   - government.html clears HoS fields before RPC call when method='appointed'
--   - government.html skips HoS generation in fallback when method='hereditary'
--   - The RPC's existing "generate if NULL" logic does the right thing
--
-- No SQL RPC changes required. This migration is a no-op.
SELECT 1;
