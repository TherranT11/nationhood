-- ════════════════════════════════════════════════════════════════
-- Step 3 of 6: corp_tax_bills table + factions.corp_fraud_total
--
-- Schema for the territorial corporate-tax ledger:
--
--   corp_tax_bills — one row per (corp, nation, year). Inserted by
--     the assessor RPC in step 4 when a corp earned revenue in a
--     nation over the prior 12 ticks. Status flows due → paid /
--     paid_with_fraud / partial / delinquent via the four player-
--     facing RPCs (pay full, cook the books, ignore) plus the
--     assessor itself.
--
--   factions.corp_fraud_total — cumulative dollars saved across
--     successful Cook the Books rolls. Increments on each pass;
--     never decrements. Surfaces on the corp profile.
--
-- Status enum:
--   due             initial state on insertion
--   paid            full amount collected (Pay in Full success)
--   paid_with_fraud Cook the Books rolled > 75 (saved 50%)
--   partial         transitional — partial payment received, late
--                   fee applied and amount_due reduced. Typically
--                   flips to delinquent in the same RPC; included
--                   in the enum for future workflows.
--   delinquent     past grace OR failed cook → late fee applied
--
-- UNIQUE (corp_id, nation_id, year) makes the assessor naturally
-- idempotent: a duplicate cron fire would conflict on insert and
-- the RPC can ON CONFLICT DO NOTHING.
--
-- RLS: corp owners read their own bills; admins read all (override
-- pattern from 20261010 / 20261011). No INSERT/UPDATE/DELETE for
-- authenticated — every write routes through SECURITY DEFINER RPCs
-- in step 4.
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS corp_tax_bills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Bill belongs to the corp that earned the taxed revenue. CASCADE
    -- on corp delete: dissolved corps clear their bills (per design
    -- "nation absorbs the loss" — uncollectable on a dead corp).
    corp_id         UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,

    -- Assessing nation. CASCADE on nation delete: a nation that ceases
    -- to exist can't collect; the bill is moot.
    nation_id       UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    -- Game year of the assessed period. Combined with corp_id +
    -- nation_id forms the natural key — one bill per (corp, nation,
    -- year). Drives assessor idempotency.
    year            INT NOT NULL,

    -- Snapshot of the revenue base at assessment time. Sum of
    -- corp_cash_events.delta WHERE corp_id = X AND nation_id = Y AND
    -- category LIKE 'revenue_%' over the prior 12 ticks. Floored at
    -- 0 (negative aggregate revenue → no bill issued, so this is
    -- always >= 0 here).
    revenue_taxed   BIGINT NOT NULL CHECK (revenue_taxed >= 0),

    -- Snapshot of the slider rate at assessment time. Locked into
    -- the row so a mid-year policy change doesn't retroactively
    -- recompute already-issued bills. 1-100 literal effective %.
    rate_pct        INT NOT NULL CHECK (rate_pct BETWEEN 1 AND 100),

    -- Current outstanding amount. Starts at revenue_taxed * rate_pct
    -- / 100. Cook the Books success → 0 (paid_with_fraud). Pay
    -- in Full sufficient → 0. Pay insufficient → reduced to residual
    -- + 10% fee. Cook fail → halved + 10% on remaining.
    amount_due      BIGINT NOT NULL CHECK (amount_due >= 0),

    -- Tick by which the bill should be paid. Set at assessment time
    -- (typically current_tick + grace_period). The delinquency sweep
    -- in the tick processor flags status='due' bills past this tick.
    due_at_tick     INT NOT NULL,

    status          TEXT NOT NULL DEFAULT 'due'
        CHECK (status IN ('due', 'paid', 'paid_with_fraud', 'partial', 'delinquent')),

    -- Set when the corp clicks Ignore. Card UI filters on IS NULL so
    -- the bill stops surfacing in Pressing Issues for this player
    -- session; row stays in DB and shows up in any "Past Bills" view.
    -- Cleared on the next assessment cycle that re-issues a sibling
    -- bill (handled in step 4).
    ignored_at_tick INT,

    paid_at_tick    INT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (corp_id, nation_id, year)
);

COMMENT ON TABLE corp_tax_bills IS
    'Per-(corp, nation, year) corporate tax bill. Assessor inserts one row per (corp, nation) pair where the corp earned revenue in the prior 12 ticks. Status flows via four player RPCs (pay_corporate_tax_full, cook_corporate_tax_books, ignore_corporate_tax_bill) plus the assessor itself. UNIQUE (corp, nation, year) makes the assessor idempotent.';

-- Hot-path index: Pressing Issues card lists my outstanding bills.
CREATE INDEX IF NOT EXISTS idx_corp_tax_bills_corp_status
    ON corp_tax_bills (corp_id, status);

-- Delinquency sweep index: tick processor finds bills past due_at_tick.
-- Partial filter on unpaid statuses keeps the index small.
CREATE INDEX IF NOT EXISTS idx_corp_tax_bills_unpaid_due
    ON corp_tax_bills (status, due_at_tick)
    WHERE status IN ('due', 'partial');

ALTER TABLE corp_tax_bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Corp owner can read own tax bills" ON corp_tax_bills;
CREATE POLICY "Corp owner can read own tax bills"
    ON corp_tax_bills
    FOR SELECT
    TO authenticated
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1 FROM factions f
            WHERE f.id = corp_tax_bills.corp_id
              AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );

-- No INSERT/UPDATE/DELETE policies for authenticated — every write
-- routes through SECURITY DEFINER RPCs in step 4 (assess_corporate_taxes,
-- pay_corporate_tax_full, cook_corporate_tax_books, ignore_corporate_tax_bill).

-- ── factions.corp_fraud_total ──────────────────────────────────
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS corp_fraud_total NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN factions.corp_fraud_total IS
    'Cumulative dollars saved across successful Cook the Books rolls. Increments by the unpaid 50% on each pass; never decrements. Surfaces on the corp profile.';

NOTIFY pgrst, 'reload schema';

COMMIT;
