-- ══════════════════════════════════════════════════════════════════════════
-- Equity positions: track the most recent tick's dividend payout amount.
--
-- Before this migration: tick processor updated total_paid (cumulative)
-- and last_payment_tick (timing), but NOT the per-tick dollar amount.
-- Investor portfolio UI could show "paid at tick N" but not "how much".
--
-- After: advance-corp-tick writes last_payment_amount on every equity
-- dividend cycle (including $0 when the target had no profit/cash), and
-- the investor portfolio renders it inline so each equity holder sees
-- exactly what their position paid out most recently.
--
-- Column is nullable — existing equity rows stay NULL until the next
-- corp tick processes them, at which point they get populated.
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.finance_active_loans
    ADD COLUMN IF NOT EXISTS last_payment_amount BIGINT;
