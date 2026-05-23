-- ════════════════════════════════════════════════════════════════════
-- CORP DEBT GATE — you can't pocket borrowed money, and silent default
-- costs the same −3 reputation as an honest bankruptcy
-- ════════════════════════════════════════════════════════════════════
-- Closes the borrow → withdraw → default hole. A loan's principal lands in
-- the corp treasury; today withdraw_corp_treasury lets the founder pull the
-- whole treasury (including that principal) to personal funds, then the
-- per-tick payment can't be met and the loan just flips to 'defaulted' with
-- no penalty — while honestly closing the corp via declare_bankruptcy costs
-- −3 ent_reputation. Backwards incentives, and worse for Central Bank
-- "state loans" (national money).
--
-- Fix, in three coupled parts:
--
--   1. entrepreneur_corp_outstanding_debt(corp_id) — THE single source for
--      a corp's real disbursed debt: Σ ACTIVE corp_loans remaining
--      (principal − total_paid) + Σ ACTIVE central_bank_loans outstanding.
--      'approved'-but-not-disbursed corp loans owe nothing yet and are
--      excluded (no cash received → nothing to gate/subtract).
--
--   2. withdraw_corp_treasury — the founder can only draw the equity ABOVE
--      liabilities: max withdraw = floor(treasury − outstanding_debt), ≥0.
--      Borrowed money stays in the corp (spendable on the business, not
--      personally extractable while owed). Preventive, not punitive.
--
--   3. Penalty parity — a PASSIVE per-tick default now costs the borrower's
--      CEO the same −3 ent_reputation as declare_bankruptcy, so silently
--      defaulting is no longer cheaper than shutting down honestly.
--      (Central Bank loan defaults get the same −3 in advance-corp-tick's
--      processCentralBankLoanPayments — that processor is TypeScript, not
--      SQL, so it's patched in the edge function, not here.)
--
-- Bonus consistency fix: entrepreneur_corp_book_value now subtracts the
-- shared outstanding_debt helper too — so book value finally accounts for
-- Central Bank debt (it previously subtracted only corp_loans) and agrees
-- with the withdrawal gate on what's owed. The JS mirror
-- (js/corp-book-value.js fetchCorpBookAggregates) is updated to match:
-- active corp_loans + active central_bank_loans.
--
-- CREATE OR REPLACE only; one new helper function. Idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1) Single source for a corp's real (disbursed, active) debt ──
CREATE OR REPLACE FUNCTION public.entrepreneur_corp_outstanding_debt(p_corp_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        COALESCE((SELECT SUM(GREATEST(0, principal - COALESCE(total_paid, 0)))
                    FROM corp_loans
                   WHERE borrower_corp_id = p_corp_id
                     AND status = 'active'), 0)
      + COALESCE((SELECT SUM(GREATEST(0, outstanding))
                    FROM central_bank_loans
                   WHERE borrower_corp_id = p_corp_id
                     AND status = 'active'), 0);
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_corp_outstanding_debt(uuid) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_corp_outstanding_debt(uuid) IS
    'Real disbursed debt of an entrepreneur corp: Σ active corp_loans remaining (principal − total_paid) + Σ active central_bank_loans outstanding. The one source — read by withdraw_corp_treasury (liquidity gate) and entrepreneur_corp_book_value (valuation). Mirrored in JS by js/corp-book-value.js fetchCorpBookAggregates.';

-- ── Book value now uses the shared debt (incl. Central Bank loans) ──
CREATE OR REPLACE FUNCTION public.entrepreneur_corp_book_value(p_corp_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT GREATEST(0, ROUND(
          COALESCE((SELECT treasury_cash FROM entrepreneur_corps WHERE id = p_corp_id), 0)
        + COALESCE((SELECT SUM(cost_paid) FROM corp_buildings WHERE owner_corp_id = p_corp_id), 0)
        - entrepreneur_corp_outstanding_debt(p_corp_id)
    ));
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_corp_book_value(uuid) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_corp_book_value(uuid) IS
    'Dynamic book value of an entrepreneur corp: treasury_cash + Σ corp_buildings.cost_paid − entrepreneur_corp_outstanding_debt (active corp + Central Bank loans), floored at 0. SQL mirror of JS computeCorpBookValue (js/game/corp-valuation.js) with aggregates from js/corp-book-value.js; keep in sync. Drives the Sell Equity buyback price + the displayed private valuation.';

-- ── 2) Withdrawal gated at treasury − outstanding debt ──
CREATE OR REPLACE FUNCTION public.withdraw_corp_treasury(p_corp_id UUID, p_amount BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid      UUID := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_treasury BIGINT;
    v_debt     numeric;
    v_avail    BIGINT;
    v_tick     INT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF p_amount IS NULL OR p_amount < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    -- Public corps pay shareholders via corp_dividend, not direct draws.
    IF v_corp.listing = 'public' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'use_dividend');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- Withdrawable = treasury MINUS what the corp still owes. Borrowed money
    -- stays put; the founder can only pocket equity above its liabilities.
    v_treasury := floor(COALESCE(v_corp.treasury_cash, 0))::bigint;
    v_debt     := entrepreneur_corp_outstanding_debt(p_corp_id);
    v_avail    := GREATEST(0, floor(COALESCE(v_corp.treasury_cash, 0) - v_debt))::bigint;
    IF p_amount > v_avail THEN
        RETURN jsonb_build_object('success', false, 'reason', 'exceeds_withdrawable',
            'have', v_avail, 'need', p_amount,
            'treasury', v_treasury, 'debt', floor(v_debt)::bigint);
    END IF;

    -- Atomic: debit corp treasury, credit founder's personal Cash on Hand.
    UPDATE entrepreneur_corps
       SET treasury_cash = treasury_cash - p_amount
     WHERE id = p_corp_id;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) + p_amount
     WHERE id = v_fac.id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Owner Withdrawal',
        format('%s withdrew $%s from %s to personal funds.',
               COALESCE(v_fac.faction_name, 'The founder'), p_amount, v_corp.name),
        'corporate', 'corp_owner_withdrawal',
        jsonb_build_object('corp_id', p_corp_id, 'corp_name', v_corp.name, 'amount', p_amount),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',      true,
        'corp_id',      p_corp_id,
        'amount',       p_amount,
        'new_treasury', v_treasury - p_amount,
        'new_funds',    COALESCE(v_fac.party_funds, 0) + p_amount
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.withdraw_corp_treasury(UUID, BIGINT) TO authenticated;

COMMENT ON FUNCTION public.withdraw_corp_treasury(UUID, BIGINT) IS
    'Founder/CEO of a PRIVATE corp draws treasury → personal party_funds, capped at floor(treasury − entrepreneur_corp_outstanding_debt) so borrowed money can''t be pocketed while owed. 1:1, no tax/cooldown. Owner-only, private-only (public corps use corp_dividend). SECURITY DEFINER; corp-row FOR UPDATE serialises against corp_dividend / corp_trade / go_public.';

-- ── 3) Passive per-tick default now costs the CEO −3 reputation ──
CREATE OR REPLACE FUNCTION public.process_corp_loans(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r            RECORD;
    v_tick       int;
    v_expired    int := 0;
    v_paid       int := 0;
    v_defaulted  int := 0;
    v_repaid     int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Expire stale pending loan requests.
    FOR r IN
        SELECT id FROM corp_loan_requests
         WHERE status = 'pending' AND expires_at_tick <= v_tick
         FOR UPDATE
    LOOP
        UPDATE corp_loan_requests
           SET status = 'expired', finalized_at_tick = v_tick
         WHERE id = r.id;
        v_expired := v_expired + 1;
    END LOOP;

    -- Per-tick repayment: borrower CORP treasury → lender CORP treasury.
    FOR r IN
        SELECT id, borrower_corp_id, lender_corp_id, per_tick_payment,
               payments_remaining, total_paid
          FROM corp_loans
         WHERE status = 'active'
           AND payments_remaining > 0
           AND started_at_tick < v_tick
           AND (last_payment_tick IS NULL OR last_payment_tick < v_tick)
         FOR UPDATE
    LOOP
        -- Debit the borrower corp treasury; default if it can't cover
        -- (also covers a missing/dissolved borrower corp → no row updated).
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) - r.per_tick_payment
         WHERE id = r.borrower_corp_id
           AND COALESCE(treasury_cash, 0) >= r.per_tick_payment;
        IF NOT FOUND THEN
            UPDATE corp_loans
               SET status = 'defaulted', defaulted_at_tick = v_tick
             WHERE id = r.id;
            -- Penalty parity with declare_bankruptcy: the borrower's CEO
            -- takes −3 ent_reputation (no-op if the corp was dissolved).
            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) - 3
             WHERE id = (SELECT owner_faction_id FROM entrepreneur_corps
                          WHERE id = r.borrower_corp_id);
            v_defaulted := v_defaulted + 1;
            CONTINUE;
        END IF;

        -- Credit the lender corp treasury.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + r.per_tick_payment
         WHERE id = r.lender_corp_id;

        UPDATE corp_loans
           SET payments_remaining = payments_remaining - 1,
               total_paid         = total_paid + r.per_tick_payment,
               last_payment_tick  = v_tick,
               status             = CASE WHEN payments_remaining - 1 = 0 THEN 'repaid' ELSE 'active' END
         WHERE id = r.id;

        IF r.payments_remaining - 1 = 0 THEN
            v_repaid := v_repaid + 1;
        ELSE
            v_paid := v_paid + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true,
        'expired',    v_expired,
        'paid',       v_paid,
        'repaid',     v_repaid,
        'defaulted',  v_defaulted,
        'tick',       v_tick);
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_corp_loans(int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270197 (withdraw_corp_treasury), 20270212 (book value), and
-- 20270219 (process_corp_loans) to restore the prior bodies, then
-- DROP FUNCTION IF EXISTS public.entrepreneur_corp_outstanding_debt(uuid);
-- (and revert the processCentralBankLoanPayments −3 in the edge function).
