-- ══════════════════════════════════════════════════════════════
-- SUBSIDIARY AUTO-RATES — Insurance & Loan Services
--
-- Finance subsidiaries (Insurance/Banking) auto-generate rates
-- derived from the host nation's interest_rates stat.
-- Corps operating in the same nation can accept coverage/loans
-- at these rates without player-to-player negotiation.
-- ══════════════════════════════════════════════════════════════

-- ──────────── AUTO-RATES TABLE ────────────
-- One row per subsidiary per service type. Updated each tick as
-- nation interest_rates change.

CREATE TABLE IF NOT EXISTS subsidiary_auto_rates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subsidiary_id   UUID NOT NULL REFERENCES public.corp_properties(id) ON DELETE CASCADE,
    faction_id      UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    nation_id       UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    service_type    TEXT NOT NULL CHECK (service_type IN ('insurance', 'loan')),

    -- Rate components
    base_rate       NUMERIC(5,2) NOT NULL,       -- derived from nation interest_rates / 10
    markup          NUMERIC(5,2) NOT NULL DEFAULT 0, -- owner-set markup (0-5%)
    effective_rate  NUMERIC(5,2) NOT NULL,       -- base_rate + markup = what customers pay

    -- Service limits
    coverage_limit  BIGINT DEFAULT 0,            -- max coverage per policy (insurance) or max loan amount
    min_term_months INT DEFAULT 6,               -- minimum loan/policy term
    max_term_months INT DEFAULT 60,              -- maximum loan/policy term
    deductible_pct  NUMERIC(5,2) DEFAULT 10,     -- insurance deductible (5-25%)

    -- State
    is_active       BOOLEAN NOT NULL DEFAULT true,
    policies_issued INT NOT NULL DEFAULT 0,       -- count of active policies/loans from this rate
    total_revenue   BIGINT NOT NULL DEFAULT 0,    -- lifetime premiums/interest collected
    total_claims    BIGINT NOT NULL DEFAULT 0,    -- lifetime claims/defaults paid out

    -- Timestamps
    last_updated_tick INT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),

    UNIQUE(subsidiary_id, service_type)           -- one rate per service per subsidiary
);

CREATE INDEX IF NOT EXISTS idx_sub_auto_rates_nation ON subsidiary_auto_rates(nation_id, service_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sub_auto_rates_faction ON subsidiary_auto_rates(faction_id);
CREATE INDEX IF NOT EXISTS idx_sub_auto_rates_subsidiary ON subsidiary_auto_rates(subsidiary_id);

-- ──────────── AUTO-POLICIES TABLE ────────────
-- Active insurance policies and loans originated from auto-rates.
-- Separate from finance_active_loans (which is player-to-player).

CREATE TABLE IF NOT EXISTS subsidiary_auto_policies (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_id             UUID NOT NULL REFERENCES public.subsidiary_auto_rates(id) ON DELETE CASCADE,
    subsidiary_id       UUID NOT NULL REFERENCES public.corp_properties(id) ON DELETE CASCADE,
    lender_faction_id   UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    borrower_faction_id UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    nation_id           UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    service_type        TEXT NOT NULL CHECK (service_type IN ('insurance', 'loan')),

    -- Terms (snapshot from auto-rate at acceptance time)
    rate_at_issue       NUMERIC(5,2) NOT NULL,    -- effective_rate when policy was accepted
    principal           BIGINT NOT NULL DEFAULT 0, -- loan amount OR insured value
    deductible_pct      NUMERIC(5,2) DEFAULT 10,   -- insurance deductible at issue

    -- Payment tracking
    monthly_payment     BIGINT NOT NULL DEFAULT 0, -- premium per tick (insurance) or payment per tick (loan)
    total_paid          BIGINT NOT NULL DEFAULT 0,
    payments_made       INT NOT NULL DEFAULT 0,
    payments_missed     INT NOT NULL DEFAULT 0,

    -- Insurance-specific
    insured_vessel_id   UUID,                      -- optional: links to corp_vessels for vessel insurance
    claims_count        INT NOT NULL DEFAULT 0,
    total_claims_paid   BIGINT NOT NULL DEFAULT 0,

    -- Loan-specific
    term_months         INT,                        -- loan duration in ticks
    remaining_principal BIGINT NOT NULL DEFAULT 0,  -- decreasing balance

    -- Status
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'lapsed', 'claimed', 'repaid', 'defaulted', 'cancelled')),
    started_tick        INT NOT NULL,
    last_payment_tick   INT,
    expires_tick        INT,                        -- for insurance: when policy expires

    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_policies_borrower ON subsidiary_auto_policies(borrower_faction_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sub_policies_lender ON subsidiary_auto_policies(lender_faction_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sub_policies_nation ON subsidiary_auto_policies(nation_id, service_type) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sub_policies_rate ON subsidiary_auto_policies(rate_id);

-- RLS: both tables readable by all, writable by authenticated
ALTER TABLE subsidiary_auto_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidiary_auto_policies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read subsidiary_auto_rates" ON subsidiary_auto_rates
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert subsidiary_auto_rates" ON subsidiary_auto_rates
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can update subsidiary_auto_rates" ON subsidiary_auto_rates
    FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can read subsidiary_auto_policies" ON subsidiary_auto_policies
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert subsidiary_auto_policies" ON subsidiary_auto_policies
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can update subsidiary_auto_policies" ON subsidiary_auto_policies
    FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
