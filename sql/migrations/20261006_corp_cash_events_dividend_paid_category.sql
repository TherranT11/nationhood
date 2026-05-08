-- ════════════════════════════════════════════════════════════════
-- Add 'dividend_paid' to corp_cash_events.category
--
-- Issuer-side outflow when an active equity_positions row pays its
-- annual dividend to the holder. P&L expense category — sibling to
-- wages, exec_salary, fixed_overhead, maintenance, tax, debt_interest,
-- event_cost. Holder side already uses revenue_finance; no schema
-- change needed for that.
--
-- Idempotent (DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT). Replays
-- cleanly because the new value is appended to the existing enum.
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.corp_cash_events
    DROP CONSTRAINT IF EXISTS corp_cash_events_category_chk;
ALTER TABLE public.corp_cash_events
    ADD CONSTRAINT corp_cash_events_category_chk CHECK (category IN (
        'revenue_market',
        'revenue_shipping',
        'revenue_trade',
        'revenue_finance',
        'revenue_airline',
        'wages',
        'exec_salary',
        'fixed_overhead',
        'maintenance',
        'tax',
        'debt_interest',
        'event_cost',
        'dividend_paid',     -- NEW: annual equity dividend, issuer side
        'debt_principal',
        'capital_in',
        'capital_out'
    ));

COMMENT ON COLUMN public.corp_cash_events.category IS
  'Canonical category. revenue_* + dividend_paid + the standard expenses are P&L; debt_principal / capital_in / capital_out are non-P&L cash movements.';

COMMIT;

NOTIFY pgrst, 'reload schema';
