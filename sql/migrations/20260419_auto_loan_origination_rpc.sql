-- Atomic auto-policy acceptance for subsidiary finance services.
-- Ensures policy insert + cash movements + immutable loan ledger happen together.

-- 1) Immutable origination ledger for subsidiary auto loans.
CREATE TABLE IF NOT EXISTS public.subsidiary_auto_loan_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES public.subsidiary_auto_policies(id) ON DELETE CASCADE,
    ledger_event TEXT NOT NULL DEFAULT 'origination' CHECK (ledger_event = 'origination'),
    principal BIGINT NOT NULL CHECK (principal >= 0),
    borrower_faction_id UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    lender_faction_id UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    subsidiary_id UUID REFERENCES public.corp_properties(id) ON DELETE SET NULL,
    tick INT NOT NULL,
    was_backfill BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (policy_id, ledger_event)
);

CREATE INDEX IF NOT EXISTS idx_sub_auto_loan_ledger_borrower_tick
    ON public.subsidiary_auto_loan_ledger (borrower_faction_id, tick DESC);
CREATE INDEX IF NOT EXISTS idx_sub_auto_loan_ledger_lender_tick
    ON public.subsidiary_auto_loan_ledger (lender_faction_id, tick DESC);

ALTER TABLE public.subsidiary_auto_loan_ledger ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Anyone can read subsidiary_auto_loan_ledger"
        ON public.subsidiary_auto_loan_ledger FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated can insert subsidiary_auto_loan_ledger"
        ON public.subsidiary_auto_loan_ledger FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) Funding model flags (snapshot on policy at origination).
ALTER TABLE public.subsidiary_auto_rates
    ADD COLUMN IF NOT EXISTS loan_funding_model TEXT NOT NULL DEFAULT 'subsidiary_cash'
    CHECK (loan_funding_model IN ('subsidiary_cash', 'parent_corp'));

ALTER TABLE public.subsidiary_auto_policies
    ADD COLUMN IF NOT EXISTS loan_funding_model TEXT
    CHECK (loan_funding_model IN ('subsidiary_cash', 'parent_corp'));

COMMENT ON COLUMN public.subsidiary_auto_rates.loan_funding_model
    IS 'For loan service_type: where principal is sourced from at origination.';
COMMENT ON COLUMN public.subsidiary_auto_policies.loan_funding_model
    IS 'Snapshot of subsidiary_auto_rates.loan_funding_model at acceptance.';

CREATE OR REPLACE FUNCTION public.accept_subsidiary_auto_policy(
    p_rate_id UUID,
    p_borrower_faction_id UUID,
    p_principal BIGINT,
    p_term_months INT,
    p_monthly_payment BIGINT,
    p_started_tick INT,
    p_expires_tick INT
)
RETURNS public.subsidiary_auto_policies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rate public.subsidiary_auto_rates%ROWTYPE;
    v_policy public.subsidiary_auto_policies%ROWTYPE;
    v_borrower_cash BIGINT;
    v_lender_cash BIGINT;
    v_sub_cash BIGINT;
    v_funding_model TEXT;
BEGIN
    IF p_principal <= 0 THEN
        RAISE EXCEPTION 'Principal must be > 0';
    END IF;
    IF p_term_months <= 0 THEN
        RAISE EXCEPTION 'Term must be > 0';
    END IF;

    SELECT * INTO v_rate
    FROM public.subsidiary_auto_rates
    WHERE id = p_rate_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rate not found';
    END IF;

    IF v_rate.is_active IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Rate is inactive';
    END IF;

    IF p_principal > COALESCE(v_rate.coverage_limit, 0) THEN
        RAISE EXCEPTION 'Principal exceeds max loan/coverage limit';
    END IF;

    v_funding_model := CASE
        WHEN v_rate.service_type = 'loan' THEN COALESCE(v_rate.loan_funding_model, 'subsidiary_cash')
        ELSE NULL
    END;

    INSERT INTO public.subsidiary_auto_policies (
        rate_id,
        subsidiary_id,
        lender_faction_id,
        borrower_faction_id,
        nation_id,
        service_type,
        rate_at_issue,
        principal,
        deductible_pct,
        monthly_payment,
        term_months,
        remaining_principal,
        started_tick,
        expires_tick,
        status,
        loan_funding_model
    ) VALUES (
        v_rate.id,
        v_rate.subsidiary_id,
        v_rate.faction_id,
        p_borrower_faction_id,
        v_rate.nation_id,
        v_rate.service_type,
        v_rate.effective_rate,
        p_principal,
        CASE WHEN v_rate.service_type = 'insurance' THEN COALESCE(v_rate.deductible_pct, 10) ELSE 0 END,
        p_monthly_payment,
        p_term_months,
        CASE WHEN v_rate.service_type = 'loan' THEN p_principal ELSE 0 END,
        p_started_tick,
        p_expires_tick,
        'active',
        v_funding_model
    )
    RETURNING * INTO v_policy;

    IF v_rate.service_type = 'loan' THEN
        -- Credit borrower principal.
        SELECT corp_cash_reserves INTO v_borrower_cash
        FROM public.factions
        WHERE id = p_borrower_faction_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Borrower faction not found';
        END IF;

        UPDATE public.factions
        SET corp_cash_reserves = COALESCE(v_borrower_cash, 0) + p_principal,
            corp_debt = COALESCE(corp_debt, 0) + p_principal
        WHERE id = p_borrower_faction_id;

        -- Debit lender source of funds.
        IF v_funding_model = 'subsidiary_cash' THEN
            SELECT sub_cash INTO v_sub_cash
            FROM public.corp_properties
            WHERE id = v_rate.subsidiary_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Subsidiary not found for rate';
            END IF;

            UPDATE public.corp_properties
            SET sub_cash = COALESCE(v_sub_cash, 0) - p_principal
            WHERE id = v_rate.subsidiary_id;
        ELSE
            SELECT corp_cash_reserves INTO v_lender_cash
            FROM public.factions
            WHERE id = v_rate.faction_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Lender faction not found';
            END IF;

            UPDATE public.factions
            SET corp_cash_reserves = COALESCE(v_lender_cash, 0) - p_principal
            WHERE id = v_rate.faction_id;
        END IF;

        INSERT INTO public.subsidiary_auto_loan_ledger (
            policy_id,
            principal,
            borrower_faction_id,
            lender_faction_id,
            subsidiary_id,
            tick,
            was_backfill
        ) VALUES (
            v_policy.id,
            p_principal,
            p_borrower_faction_id,
            v_rate.faction_id,
            v_rate.subsidiary_id,
            p_started_tick,
            false
        );
    END IF;

    UPDATE public.subsidiary_auto_rates
    SET policies_issued = COALESCE(policies_issued, 0) + 1,
        updated_at = now()
    WHERE id = v_rate.id;

    RETURN v_policy;
END;
$$;

COMMENT ON FUNCTION public.accept_subsidiary_auto_policy(UUID, UUID, BIGINT, INT, BIGINT, INT, INT)
IS 'Atomically accepts a subsidiary auto policy; for loans also transfers origination principal and records immutable ledger.';

GRANT EXECUTE ON FUNCTION public.accept_subsidiary_auto_policy(UUID, UUID, BIGINT, INT, BIGINT, INT, INT)
    TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.backfill_subsidiary_auto_loan_originations(
    p_limit INT DEFAULT 500
)
RETURNS TABLE (
    repaired_count INT,
    skipped_count INT,
    scanned_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_policy RECORD;
    v_repaired INT := 0;
    v_skipped INT := 0;
    v_scanned INT := 0;
    v_lender_cash BIGINT;
    v_sub_cash BIGINT;
    v_model TEXT;
BEGIN
    FOR v_policy IN
        SELECT p.id,
               p.principal,
               p.borrower_faction_id,
               p.lender_faction_id,
               p.subsidiary_id,
               p.started_tick,
               COALESCE(p.loan_funding_model, r.loan_funding_model, 'subsidiary_cash') AS funding_model
        FROM public.subsidiary_auto_policies p
        JOIN public.subsidiary_auto_rates r ON r.id = p.rate_id
        LEFT JOIN public.subsidiary_auto_loan_ledger l
            ON l.policy_id = p.id
           AND l.ledger_event = 'origination'
        WHERE p.service_type = 'loan'
          AND p.status = 'active'
          AND l.id IS NULL
        ORDER BY p.started_tick ASC
        LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 500), 5000))
    LOOP
        v_scanned := v_scanned + 1;
        v_model := COALESCE(v_policy.funding_model, 'subsidiary_cash');

        -- Lock/validate lender source first; skip safely if source row is missing.
        IF v_model = 'subsidiary_cash' THEN
            SELECT sub_cash INTO v_sub_cash
            FROM public.corp_properties
            WHERE id = v_policy.subsidiary_id
            FOR UPDATE;

            IF NOT FOUND THEN
                v_skipped := v_skipped + 1;
                CONTINUE;
            END IF;
        ELSE
            SELECT corp_cash_reserves INTO v_lender_cash
            FROM public.factions
            WHERE id = v_policy.lender_faction_id
            FOR UPDATE;

            IF NOT FOUND THEN
                v_skipped := v_skipped + 1;
                CONTINUE;
            END IF;
        END IF;

        -- Credit borrower (origination was likely missing because no ledger row exists).
        UPDATE public.factions
        SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_policy.principal,
            corp_debt = COALESCE(corp_debt, 0) + v_policy.principal
        WHERE id = v_policy.borrower_faction_id;

        IF v_model = 'subsidiary_cash' THEN
            UPDATE public.corp_properties
            SET sub_cash = COALESCE(v_sub_cash, 0) - v_policy.principal
            WHERE id = v_policy.subsidiary_id;
        ELSE
            UPDATE public.factions
            SET corp_cash_reserves = COALESCE(v_lender_cash, 0) - v_policy.principal
            WHERE id = v_policy.lender_faction_id;
        END IF;

        INSERT INTO public.subsidiary_auto_loan_ledger (
            policy_id,
            principal,
            borrower_faction_id,
            lender_faction_id,
            subsidiary_id,
            tick,
            was_backfill
        ) VALUES (
            v_policy.id,
            v_policy.principal,
            v_policy.borrower_faction_id,
            v_policy.lender_faction_id,
            v_policy.subsidiary_id,
            COALESCE(v_policy.started_tick, 0),
            true
        );

        UPDATE public.subsidiary_auto_policies
        SET loan_funding_model = v_model
        WHERE id = v_policy.id
          AND loan_funding_model IS DISTINCT FROM v_model;

        v_repaired := v_repaired + 1;
    END LOOP;

    RETURN QUERY SELECT v_repaired, v_skipped, v_scanned;
END;
$$;

COMMENT ON FUNCTION public.backfill_subsidiary_auto_loan_originations(INT)
IS 'Backfills missing loan origination transfers for active auto-loan policies lacking origination ledger rows; idempotent by ledger uniqueness.';

GRANT EXECUTE ON FUNCTION public.backfill_subsidiary_auto_loan_originations(INT)
    TO authenticated, service_role;
