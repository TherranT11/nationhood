-- ══════════════════════════════════════════════════════════════
-- Phase 8 (item 4): Payment-skipped indicator on shipping_contracts.
--
-- When the per-tick payment processor (Phase 4 Pass C) can't debit
-- the buyer nation's treasury — budget_reserves < revenue_per_tick —
-- it silently skips. Phase 7 surfaces lifecycle events but had no
-- way to signal an in-flight payment problem.
--
-- This adds a counter so:
--   - the UI can show '⚠ N missed payments' on both buyer and corp
--     sides
--   - future enforcement (auto-default after K skips) has a hook
--   - event_log entries fire on the 0→1 transition (and only then,
--     so a chronic problem doesn't spam the log every tick)
--
-- The column is NOT NULL DEFAULT 0 so existing rows backfill cleanly.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE shipping_contracts
    ADD COLUMN IF NOT EXISTS consecutive_missed_payments INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN shipping_contracts.consecutive_missed_payments IS
    'Phase 8: count of consecutive ticks where buyer nation could not pay revenue_per_tick. Increments in advance-corp-tick Pass C when budget_reserves < revenue. Reset to 0 on any successful payment. Surfaces a payment-delayed indicator on the agreement card + active-routes card.';

NOTIFY pgrst, 'reload schema';
