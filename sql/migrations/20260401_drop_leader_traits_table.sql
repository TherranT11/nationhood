-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: Drop leader_traits table
-- Date: 2026-04-01
--
-- The old PM/President trait system (Diplomat, Firebrand, etc.) is removed.
-- PM/President now displays the party leader's first positive trait from
-- the candidate trait system (POSITIVE_TRAITS in party-leadership.js).
-- The leader_traits table is no longer queried by any code.
-- ════════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS leader_traits CASCADE;
