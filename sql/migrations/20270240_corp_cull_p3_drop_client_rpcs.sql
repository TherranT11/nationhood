-- ════════════════════════════════════════════════════════════════════
-- Corp-cull Phase 3 — drop client-only legacy corp RPCs (no callers left)
-- ════════════════════════════════════════════════════════════════════
-- These were user-action RPCs invoked only from the legacy corp pages
-- deleted in Phase 2. Verified zero remaining callers — not invoked by any
-- tick (advance-corp-tick / advance-tick), not wired as a trigger, not
-- called by any surviving SQL function, and the client frontend is gone.
-- Safe to drop now.
--
-- NOTE on the rest of the legacy function cull: most remaining legacy
-- functions are TICK-BOUND (assess_corporate_taxes, place_shipping_offer,
-- generate_organic_shipping_routes, process_airline_corp_tick +
-- airline_aircraft_ops_cost/seats/value) and are dropped in Phase 4 in the
-- SAME migration that removes their tick call (caller + callee together).
-- Trigger functions (refresh_corp_routes_count, corp_ownership_sum_check,
-- corp_ownership_auto_seed) drop in Phase 5 with their tables. The corporate-
-- tax RPCs (pay/cook/ignore) are still called by the orphaned-but-not-yet-
-- deleted js/corp-tax-pressing-issues.js — remove that frontend first.
-- declare_corp_bankruptcy is still PERFORM'd by two legacy SQL functions
-- (operational_safety_pact, aviation_incidents) — drops when those go.
-- See docs/legacy-corp-cull.md.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.claim_shipping_route(uuid, uuid, int);
DROP FUNCTION IF EXISTS public.release_shipping_route(uuid, uuid, int);
DROP FUNCTION IF EXISTS public.place_shipping_bid(uuid, uuid, bigint, int);
DROP FUNCTION IF EXISTS public.fire_shipping_action(uuid, text, text);
DROP FUNCTION IF EXISTS public.set_aircraft_tail_number(uuid, text);
DROP FUNCTION IF EXISTS public.queue_production_run(uuid, uuid, uuid, int, uuid[]);

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply the original defining migrations:
--   claim/release_shipping_route → 20260412 (+ 20260425/20260427 MoT variants)
--   place_shipping_bid           → 20260611
--   fire_shipping_action         → 20260616
--   set_aircraft_tail_number     → 20260720
--   queue_production_run         → 20261030 (+ 20261103 time tiers)
