-- ══════════════════════════════════════════════════════════════════════════
-- Phase 1: Data foundation for Investment-corp Equity Positions
--
-- Expands the existing finance_loan_requests / finance_loan_offers /
-- finance_active_loans pipeline to support a 4th deal type: 'equity'.
-- Non-finance corps raise capital in exchange for profit-share;
-- Investment corps fund them; target pays dividends each tick equal to
-- equity_pct × monthly_profit. Reuses ~90% of the existing plumbing.
--
-- Also adds factions.monthly_profit — the tick processor will populate
-- this each tick (corp revenue − expenses for that tick). One canonical
-- "target's profit this tick" field, computed once, read everywhere.
-- The equity-dividend branch (Phase 4) reads it; analytics and tax
-- calculations can read it too.
--
-- PURE ADDITIVE. No existing code reads these columns yet, so nothing
-- changes for players. Idempotent — safe to re-run.
-- ══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Extend request_type enum to include 'equity' ──
-- DROP + ADD pattern (not IF NOT EXISTS) because CHECK constraints don't
-- support IF NOT EXISTS. DROP IF EXISTS makes it idempotent.
ALTER TABLE finance_loan_requests
    DROP CONSTRAINT IF EXISTS finance_loan_requests_request_type_check;
ALTER TABLE finance_loan_requests
    ADD CONSTRAINT finance_loan_requests_request_type_check
    CHECK (request_type IN ('loan', 'bond', 'insurance', 'equity'));

-- ── 2. finance_loan_requests: equity_pct + series ──
-- equity_pct: percentage stake offered by the raising corp (1–50 inclusive).
-- NULL for non-equity requests.
ALTER TABLE finance_loan_requests
    ADD COLUMN IF NOT EXISTS equity_pct NUMERIC(5,2);

ALTER TABLE finance_loan_requests
    DROP CONSTRAINT IF EXISTS finance_loan_requests_equity_pct_check;
ALTER TABLE finance_loan_requests
    ADD CONSTRAINT finance_loan_requests_equity_pct_check
    CHECK (equity_pct IS NULL OR (equity_pct > 0 AND equity_pct <= 50));

-- series: funding-round tag ('A', 'B', 'C', ...) set by the auto-classifier
-- in Phase 7. Left as free-form TEXT so new round labels (F, G, LATE, etc.)
-- don't require another migration.
ALTER TABLE finance_loan_requests
    ADD COLUMN IF NOT EXISTS series TEXT;

-- ── 3. finance_active_loans: mirror equity_pct + series on active positions ──
-- equity_pct is read every tick by the dividend branch (Phase 4).
ALTER TABLE finance_active_loans
    ADD COLUMN IF NOT EXISTS equity_pct NUMERIC(5,2);

ALTER TABLE finance_active_loans
    ADD COLUMN IF NOT EXISTS series TEXT;

-- ── 4. factions.monthly_profit ──
-- Written each tick by advance-corp-tick (Phase 4). Corporations have a real
-- value; parties and other faction types stay at 0 (harmless — they're
-- never targeted by equity positions). Signed BIGINT so losses are
-- representable.
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS monthly_profit BIGINT DEFAULT 0;

-- ── 5. Index for fast portfolio queries ──
-- "Which equity positions does investor X hold?" — partial index so it
-- only covers equity positions (keeps the loan/bond rows out).
CREATE INDEX IF NOT EXISTS idx_active_loans_equity_lender
    ON finance_active_loans(lender_faction_id)
    WHERE equity_pct IS NOT NULL;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Verification (run AFTER the migration applies; should all succeed)
-- ══════════════════════════════════════════════════════════════════════════
--
-- 1. Confirm the CHECK constraint now includes 'equity':
--      SELECT pg_get_constraintdef(oid)
--      FROM pg_constraint
--      WHERE conname = 'finance_loan_requests_request_type_check';
--    Expected: "CHECK (request_type = ANY (ARRAY['loan', 'bond', 'insurance', 'equity']))"
--
-- 2. Confirm new columns exist:
--      SELECT column_name, data_type, column_default
--      FROM information_schema.columns
--      WHERE table_name IN ('finance_loan_requests', 'finance_active_loans', 'factions')
--        AND column_name IN ('equity_pct', 'series', 'monthly_profit');
--
-- 3. Seed one test equity request to verify the pipeline accepts it.
--    Replace the UUIDs with real faction + nation ids from your shard:
--
--      INSERT INTO finance_loan_requests (
--          requesting_faction_id, nation_id, amount, term_months, purpose,
--          request_type, equity_pct, series,
--          status, created_tick, expires_tick
--      ) VALUES (
--          '<some-construction-corp-faction-id>',
--          '<that-corp-s-nation-id>',
--          50000000,      -- $50M
--          0,             -- equity has no term; ignored by equity branch
--          'Test Series B raise for fleet expansion',
--          'equity',
--          12.50,         -- 12.5% stake
--          'B',
--          'open',
--          0,
--          999999
--      );
--
-- 4. Verify existing loan/bond/insurance inserts still succeed (no CHECK regression):
--      SELECT request_type, COUNT(*)
--      FROM finance_loan_requests
--      GROUP BY request_type;
--    Expected: existing rows still present, new 'equity' row visible.
