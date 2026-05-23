-- ════════════════════════════════════════════════════════════════════
-- BACKFILL — bring existing public corps up to a 100-share float
-- ════════════════════════════════════════════════════════════════════
-- 20270226 made NEW public corps float 100 shares (20 to the founder, 80
-- available). Existing public corps were founded/IPO'd under the old rule
-- with only 20 shares outstanding (all held → zero available float). This
-- backfills them to 100 outstanding so the 80-share float exists to buy.
--
-- What this does NOT touch (deliberate):
--   • share_price — left at its current (possibly traded-up) value, so each
--     existing holder keeps the same per-share value and $ stake. The new
--     float is offered at the current market price.
--   • corp_shareholdings — existing holdings are unchanged. available =
--     shares_outstanding − Σ holdings, so raising outstanding to 100 simply
--     opens 100 − (currently held) shares as float.
--
-- Consequence (accepted by design owner): raising the share count dilutes
-- existing holders' OWNERSHIP % (e.g. a founder at 11/20 = 55% becomes
-- 11/100 = 11%) — their share count and per-share value are unchanged, but
-- the percentage drops because 80 new float shares now exist. Valuation
-- (shares_outstanding × share_price) rises to reflect the larger float.
--
-- Only bumps corps below 100 (never reduces a corp that already has ≥100).
-- held ≤ old_outstanding < 100, so available stays ≥ 0. Idempotent: a
-- re-run finds no public corp under 100.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE entrepreneur_corps
   SET shares_outstanding = 100,
       updated_at         = now()
 WHERE listing = 'public'
   AND shares_outstanding IS NOT NULL
   AND shares_outstanding < 100;

COMMIT;
