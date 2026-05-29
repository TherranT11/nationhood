-- ═══════════════════════════════════════════════════════════════════════════════
-- SHIPPING — grandfather pre-migration bids so in-flight contracts keep filling
-- ═══════════════════════════════════════════════════════════════════════════════
-- 20270390 changed the rule to "always require Minister of Trade acceptance".
-- That correctly handles new bids going forward but stops every currently
-- flowing contract dead on apply — the minister hasn't yet had a chance to
-- explicitly accept anyone, so the helper returns no winners.
--
-- This migration grandfathers the bids that the old allocator was already
-- filling. The criterion is tight and defensible:
--
--   • pending  — the bid hasn't been settled (won / withdrawn / lost)
--   • NOT vetoed — the minister hasn't actively rejected it
--   • the contract's 3-tick bidding window has closed
--     (current_tick - created_tick >= BIDDING_WINDOW_TICKS = 3)
--
-- The window-closed condition is the implicit consent: under the
-- pre-20270390 dual-mode design, anything that survived the 3-tick
-- window without a veto WAS the minister's selection — the auto-fill
-- proceeded with it. We mark those as manually_accepted = true so the
-- new always-manual helper picks them up unchanged.
--
-- Bids placed AFTER this migration default to manually_accepted = false
-- and still need explicit Accept (per the 20270379 column default and
-- 20270390 helper filter).
--
-- Bids on contracts whose window hasn't closed yet are intentionally left
-- pending — the minister still has those ticks to make an explicit choice,
-- matching the new "must accept" rule for everything inside the window.
--
-- Idempotent. The UPDATE skips rows already accepted (NOT manually_accepted),
-- so re-running this migration is a no-op.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

WITH grandfather AS (
    SELECT b.id
      FROM shipping_contract_bids b
      JOIN shipping_contracts c ON c.id = b.contract_id
      JOIN shard s ON s.name = 'Alpha Shard'
     WHERE b.status = 'pending'
       AND NOT COALESCE(b.vetoed, false)
       AND NOT COALESCE(b.manually_accepted, false)
       AND c.status = 'open'
       AND c.trade_agreement_id IS NOT NULL
       AND (s.current_tick - c.created_tick) >= 3
)
UPDATE shipping_contract_bids
   SET manually_accepted = true,
       updated_at        = now()
 WHERE id IN (SELECT id FROM grandfather);

COMMIT;

-- ── Verification (run after) ──
--
-- Should return 0 rows: post-grandfather, any pending non-vetoed bid on a
-- window-closed open trade-agreement contract is manually_accepted.
--
--   SELECT b.id, b.contract_id, c.created_tick, s.current_tick
--     FROM shipping_contract_bids b
--     JOIN shipping_contracts c ON c.id = b.contract_id
--     JOIN shard s ON s.name = 'Alpha Shard'
--    WHERE b.status = 'pending'
--      AND NOT COALESCE(b.vetoed, false)
--      AND NOT COALESCE(b.manually_accepted, false)
--      AND c.status = 'open'
--      AND c.trade_agreement_id IS NOT NULL
--      AND (s.current_tick - c.created_tick) >= 3;
