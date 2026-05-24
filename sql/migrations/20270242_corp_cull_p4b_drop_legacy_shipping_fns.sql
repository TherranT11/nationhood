-- ════════════════════════════════════════════════════════════════════
-- Corp-cull Phase 4b — drop legacy shipping functions (tick decoupled)
-- ════════════════════════════════════════════════════════════════════
-- The legacy per-tick processor processShippingRoutes (SOP shipping_routes
-- /claims, non-trade-agreement contracts) was removed from advance-corp-tick
-- in this commit. With it gone, these two legacy shipping functions have zero
-- callers (no tick, no client — the corp pages are deleted, no other SQL):
--   • place_shipping_offer        — legacy carrier offer action
--   • generate_organic_shipping_routes — legacy organic route generator
-- (place_shipping_bid / claim_/release_shipping_route / fire_shipping_action
--  were already dropped in Phase 3.)
--
-- The shared trade-agreement path (processTradeAgreementShipping +
-- process_trade_agreement_shipping_multiwinner + shipping_contracts/bids) is
-- untouched. shipping_routes/shipping_claims/shipping_applications tables drop
-- in Phase 5.
--
-- DEPLOY ORDER: deploy advance-corp-tick (without processShippingRoutes)
-- BEFORE applying this migration so the tick never calls a dropped function.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.place_shipping_offer(uuid, uuid, int, jsonb, int);
DROP FUNCTION IF EXISTS public.generate_organic_shipping_routes(int);

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20260620/20260625/20260940 (place_shipping_offer) and
-- 20260417/20260429 (generate_organic_shipping_routes); restore
-- processShippingRoutes in advance-corp-tick from git history.
