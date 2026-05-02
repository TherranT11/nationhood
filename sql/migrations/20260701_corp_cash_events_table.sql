-- ══════════════════════════════════════════════════════════════
-- corp_cash_events — single source of truth for per-corp cash
-- movements (Option 4, Phase 1).
--
-- Every cash transaction logs one row. P&L surfaces and the
-- cash-pill dropdown will eventually derive everything from this
-- table. Phase 1 is purely additive — the table exists and gets
-- written by the new logCashEvent helper, but no UI reads from
-- it yet and nothing else writes to it.
--
-- Phases 2-5 progressively migrate the rest of the system:
--   2. Tag every accruePnl site with category + label (dual-write).
--   3. Cut UI reads over to corp_cash_events.
--   4. Stop the dual-write. Old aggregates go stale.
--   5. Drop the obsolete columns and tables.
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.corp_cash_events (
    id          BIGSERIAL PRIMARY KEY,
    corp_id     UUID        NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    tick        INTEGER     NOT NULL,
    category    TEXT        NOT NULL,
    label       TEXT        NOT NULL,
    delta       NUMERIC     NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Canonical category enum. Loose CHECK so Phase 2 can extend
    -- with another ALTER if a new accrual site needs one. Grouping
    -- semantics live in read code, not the schema:
    --   revenue_*       → counted as income in P&L
    --   wages, exec_*,
    --   fixed_overhead,
    --   maintenance,
    --   tax,
    --   debt_interest,
    --   event_cost      → counted as expense in P&L
    --   debt_principal,
    --   capital_in,
    --   capital_out     → cash movements that are NOT P&L
    CONSTRAINT corp_cash_events_category_chk CHECK (category IN (
        'revenue_market',
        'revenue_shipping',
        'revenue_trade',
        'revenue_finance',
        'wages',
        'exec_salary',
        'fixed_overhead',
        'maintenance',
        'tax',
        'debt_interest',
        'event_cost',
        'debt_principal',
        'capital_in',
        'capital_out'
    ))
);

-- Hot-path index: dropdown queries last-N events per corp.
CREATE INDEX IF NOT EXISTS idx_corp_cash_events_corp_tick
    ON public.corp_cash_events (corp_id, tick DESC, id DESC);

-- Tick-aggregate index: dashboard SUM(delta) GROUP BY tick.
CREATE INDEX IF NOT EXISTS idx_corp_cash_events_corp_tick_category
    ON public.corp_cash_events (corp_id, tick, category);

ALTER TABLE public.corp_cash_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'corp_cash_events'
          AND policyname = 'Anyone can read corp_cash_events'
    ) THEN
        CREATE POLICY "Anyone can read corp_cash_events"
            ON public.corp_cash_events
            FOR SELECT
            USING (true);
    END IF;
END $$;

COMMENT ON TABLE public.corp_cash_events IS
  'Per-corp cash movement log (Option 4 SSoT). One row per transaction. Phase 1: written but not yet read.';
COMMENT ON COLUMN public.corp_cash_events.delta IS
  'Signed dollar amount. Positive = inflow (revenue, capital received). Negative = outflow (expense, capital sent).';
COMMENT ON COLUMN public.corp_cash_events.category IS
  'Canonical category. revenue_* and the standard expenses are P&L; debt_principal / capital_in / capital_out are non-P&L cash movements.';

NOTIFY pgrst, 'reload schema';
