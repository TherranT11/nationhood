-- ══════════════════════════════════════════════════════════════
-- Make corp_cash_events the only writer of cash flows
--
-- Today three places update factions.corp_cash_reserves directly,
-- in parallel with whatever logging they do:
--
--   1. pay_out_loan         (loan disbursement → borrower cash)
--   2. declare_corp_bankruptcy (creditor paybacks → lender cash)
--   3. enactBill gov_bailout (bailout payout → corp cash)
--
-- That means the corp_cash_events ledger drifts from the cash
-- balance: the dashboard's Revenue card never shows these flows,
-- and an event-aware audit can never reconcile against the live
-- balance. Closing this gap so corp_cash_events is the single
-- source of truth for every off-tick movement.
--
-- Pattern: a tiny helper function emit_corp_cash_event that
-- atomically (a) appends the event row and (b) adjusts
-- corp_cash_reserves by the same delta. Every call site that used
-- to do its own UPDATE switches to the helper. Both writes happen
-- in one transaction; the ledger and the balance can't drift.
--
-- Idempotent (CREATE OR REPLACE on every function).
-- ══════════════════════════════════════════════════════════════


-- ── 1. The helper ──
-- One function, two writes. Defaults the tick from the shard so
-- callers in JS / RPC paths don't have to thread it through.
-- Floors cash at 0 to match the existing tick-processor behavior in
-- processPropertyEffects (Math.max(0, ...)). Callers that need a
-- hard sufficient-cash precondition should check beforehand.
CREATE OR REPLACE FUNCTION emit_corp_cash_event(
    p_corp_id  UUID,
    p_category TEXT,
    p_label    TEXT,
    p_delta    NUMERIC,
    p_tick     INTEGER DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick INTEGER;
BEGIN
    IF p_tick IS NULL THEN
        SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';
        v_tick := COALESCE(v_tick, 0);
    ELSE
        v_tick := p_tick;
    END IF;

    INSERT INTO corp_cash_events (corp_id, tick, category, label, delta)
    VALUES (p_corp_id, v_tick, p_category, p_label, p_delta);

    UPDATE factions
       SET corp_cash_reserves = GREATEST(0, COALESCE(corp_cash_reserves, 0) + p_delta)
     WHERE id = p_corp_id;
END;
$$;

-- Deliberately NOT granted to authenticated. The helper bypasses
-- RLS by being SECURITY DEFINER, and granting it broadly would let
-- any signed-in user inflate any corp's cash with one rpc call.
-- pay_out_loan + declare_corp_bankruptcy reach it via PERFORM (the
-- chained SECURITY DEFINER call inherits the owner's privileges,
-- so no explicit grant is needed for that path). The bailout
-- enactment in bills.js / advance-tick runs as service_role inside
-- advance-tick, which bypasses GRANT checks. A browser-side
-- bills.js path triggering a bailout would error out — acceptable
-- because pre-migration that path was already silently no-op'd
-- by the "Factions update own" RLS policy on factions.
REVOKE EXECUTE ON FUNCTION emit_corp_cash_event(UUID, TEXT, TEXT, NUMERIC, INTEGER) FROM PUBLIC;

COMMENT ON FUNCTION emit_corp_cash_event(UUID, TEXT, TEXT, NUMERIC, INTEGER) IS
    'Atomic SSoT writer for corp cash flows. Appends a corp_cash_events row AND adjusts factions.corp_cash_reserves by the same delta in one transaction. Replaces direct UPDATE corp_cash_reserves at every off-tick site (pay_out_loan, declare_corp_bankruptcy, enactBill gov_bailout). The tick processor in advance-corp-tick still does its own batched UPDATE — by the time it runs, this helper has already settled any external events written between ticks. NOT granted to authenticated; reachable via PERFORM from other SECURITY DEFINER RPCs (function-owner privilege chain) and from service_role inside advance-tick.';


-- ── 2. pay_out_loan: route the borrower deposit through the helper ──
-- The 20260614 fork left only the borrower deposit as a direct cash
-- write (the lender debit was removed). Replace that one UPDATE with
-- an emit_corp_cash_event call. corp_debt update stays — it isn't a
-- cash flow, just a debt-tracker bump. Loan-status flip stays.
CREATE OR REPLACE FUNCTION pay_out_loan(
    p_loan_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user     UUID := auth.uid();
    v_loan     bank_loans%ROWTYPE;
    v_lender   factions%ROWTYPE;
    v_borrower factions%ROWTYPE;
    v_tick     INT;
    v_updated_count INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_loan FROM bank_loans WHERE id = p_loan_id;
    IF v_loan.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Loan not found');
    END IF;
    IF v_loan.status <> 'pending_payout' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Loan is %s; cannot pay out', v_loan.status));
    END IF;

    SELECT * INTO v_lender FROM factions WHERE id = v_loan.lender_faction_id;
    IF v_lender.id IS NULL OR (v_lender.id <> v_user AND v_lender.linked_user_id IS DISTINCT FROM v_user) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own the lender bank');
    END IF;

    SELECT * INTO v_borrower FROM factions WHERE id = v_loan.borrower_faction_id;
    IF v_borrower.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Borrower no longer exists');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Borrower cash + debt update. Cash now flows through the SSoT
    -- helper so corp_cash_events stays in sync; debt is a separate
    -- accounting axis and stays as a direct UPDATE.
    PERFORM emit_corp_cash_event(
        v_borrower.id,
        'capital_in',
        'Loan principal disbursed',
        v_loan.principal,
        v_tick
    );
    UPDATE factions
       SET corp_debt = COALESCE(corp_debt, 0) + v_loan.principal
     WHERE id = v_borrower.id;

    UPDATE bank_loans
       SET status            = 'active',
           issued_at_tick    = v_tick,
           matures_at_tick   = v_tick + term_ticks,
           updated_at        = now()
     WHERE id     = p_loan_id
       AND status = 'pending_payout';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        -- Race: another path closed the loan between the SELECT and the
        -- status flip. Refund the borrower's cash + debt to revert.
        PERFORM emit_corp_cash_event(
            v_borrower.id,
            'capital_out',
            'Loan payout race-rollback',
            -v_loan.principal,
            v_tick
        );
        UPDATE factions
           SET corp_debt = GREATEST(0, COALESCE(corp_debt, 0) - v_loan.principal)
         WHERE id = v_borrower.id;
        RETURN jsonb_build_object('success', false, 'error', 'Loan was already paid out');
    END IF;

    PERFORM recompute_finance_stats(v_loan.lender_faction_id);

    RETURN jsonb_build_object(
        'success', true,
        'loan_id', p_loan_id,
        'principal_disbursed', v_loan.principal,
        'matures_at_tick', v_tick + v_loan.term_ticks
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION pay_out_loan(UUID) TO authenticated;


-- ── 3. declare_corp_bankruptcy: route lender paybacks through the helper ──
-- Two repayment loops (legacy finance_active_loans + new bank_loans)
-- previously did SELECT-then-UPDATE on the lender's corp_cash_reserves
-- per loan. Both now call emit_corp_cash_event. Everything else
-- (cooldown, valuation, GDP shock, contract expiry, event_log,
-- final faction DELETE) is unchanged from 20260711.
CREATE OR REPLACE FUNCTION declare_corp_bankruptcy(p_faction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id        UUID;
    v_corp           factions%ROWTYPE;
    v_current_tick   INTEGER;
    v_cooldown_ticks CONSTANT INTEGER := 24;
    v_payback_pct    CONSTANT NUMERIC := 0.50;
    v_last_bk_tick   INTEGER;
    v_ticks_left     INTEGER;
    v_prop_value     NUMERIC := 0;
    v_equip_value    NUMERIC := 0;
    v_cash           NUMERIC := 0;
    v_loans          NUMERIC := 0;
    v_valuation      NUMERIC := 0;
    v_payback_cap    NUMERIC := 0;
    v_total_payback  NUMERIC := 0;
    v_loan           RECORD;
    v_remaining      NUMERIC;
    v_can_pay        NUMERIC;
    v_hq_nation_id   UUID;
    v_sub_nations    UUID[];
    v_nid            UUID;
    v_cur_gdp        NUMERIC;
    v_new_gdp        NUMERIC;
    v_gdp_penalties  JSONB := '[]'::jsonb;
    v_payback_note   TEXT := '';
    v_bank_loan_lenders UUID[] := ARRAY[]::UUID[];
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_corp FROM factions
    WHERE id = p_faction_id
      AND faction_type = 'corporation'
      AND abandoned_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Corporation not found or already dissolved';
    END IF;

    IF v_corp.id <> v_user_id AND COALESCE(v_corp.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user_id THEN
        RAISE EXCEPTION 'You do not own this corporation';
    END IF;

    SELECT COALESCE(current_tick, 0) INTO v_current_tick
    FROM shard WHERE name = 'Alpha Shard';
    IF v_current_tick IS NULL THEN v_current_tick := 0; END IF;

    SELECT MAX(fired_at_tick) INTO v_last_bk_tick
    FROM event_log
    WHERE trigger_key = 'corp_bankruptcy'
      AND (effects_applied->>'user_id')::uuid = v_user_id
      AND fired_at_tick > v_current_tick - v_cooldown_ticks;

    IF v_last_bk_tick IS NOT NULL THEN
        v_ticks_left := (v_last_bk_tick + v_cooldown_ticks) - v_current_tick;
        RAISE EXCEPTION 'Bankruptcy on cooldown — % tick% remaining',
            v_ticks_left,
            CASE WHEN v_ticks_left = 1 THEN '' ELSE 's' END;
    END IF;

    -- National HQ is a real corp_properties row (20260711) so a single
    -- SUM covers it alongside regional HQs and subsidiaries.
    SELECT COALESCE(SUM(
        ROUND(COALESCE(purchase_price, 0) * COALESCE(condition, 0) / 100.0)
    ), 0) INTO v_prop_value
    FROM corp_properties WHERE faction_id = p_faction_id;

    SELECT COALESCE(SUM(
        ROUND(
            COALESCE(purchase_price, 0)
            * GREATEST(0.2, 1 - 0.05 * FLOOR(GREATEST(0, v_current_tick - COALESCE(built_at_tick, 0)) / 12.0))
            * COALESCE(condition, 0) / 100.0
        )
    ), 0) INTO v_equip_value
    FROM corp_vessels
    WHERE faction_id = p_faction_id AND COALESCE(status, '') <> 'for_sale';

    v_cash := COALESCE(v_corp.corp_cash_reserves, 0);
    v_loans := COALESCE(v_corp.corp_loans, 0);
    v_valuation := ROUND((v_cash + v_prop_value + v_equip_value - v_loans) * 1.30);
    v_payback_cap := GREATEST(0, ROUND(v_valuation * v_payback_pct));

    -- ── Repay legacy finance_active_loans ──
    FOR v_loan IN
        SELECT id, principal, total_paid, lender_faction_id
        FROM finance_active_loans
        WHERE borrower_faction_id = p_faction_id
          AND status IN ('current', 'late', 'delinquent')
        ORDER BY started_tick ASC
    LOOP
        v_remaining := COALESCE(v_loan.principal, 0) - COALESCE(v_loan.total_paid, 0);
        IF v_remaining <= 0 THEN CONTINUE; END IF;

        v_can_pay := LEAST(v_remaining, v_payback_cap - v_total_payback);
        IF v_can_pay <= 0 THEN EXIT; END IF;

        -- Lender payback flows through the SSoT helper so the lender's
        -- Revenue card reflects it and the cash + ledger stay in sync.
        IF EXISTS (SELECT 1 FROM factions WHERE id = v_loan.lender_faction_id) THEN
            PERFORM emit_corp_cash_event(
                v_loan.lender_faction_id,
                'capital_in',
                'Bankruptcy creditor payback',
                v_can_pay,
                v_current_tick
            );
        END IF;

        UPDATE finance_active_loans
        SET status = 'repaid',
            total_paid = COALESCE(total_paid, 0) + v_can_pay,
            completed_tick = v_current_tick
        WHERE id = v_loan.id;

        v_total_payback := v_total_payback + v_can_pay;
    END LOOP;

    -- ── Repay bank_loans ──
    FOR v_loan IN
        SELECT id, outstanding, lender_faction_id
        FROM bank_loans
        WHERE borrower_faction_id = p_faction_id
          AND status IN ('pending_payout', 'active')
        ORDER BY issued_at_tick ASC
    LOOP
        v_remaining := COALESCE(v_loan.outstanding, 0);
        IF v_remaining <= 0 THEN CONTINUE; END IF;

        v_can_pay := LEAST(v_remaining, v_payback_cap - v_total_payback);

        IF v_can_pay > 0 THEN
            IF EXISTS (SELECT 1 FROM factions WHERE id = v_loan.lender_faction_id) THEN
                PERFORM emit_corp_cash_event(
                    v_loan.lender_faction_id,
                    'capital_in',
                    'Bankruptcy creditor payback',
                    v_can_pay,
                    v_current_tick
                );
            END IF;
            v_total_payback := v_total_payback + v_can_pay;
        END IF;

        UPDATE bank_loans
        SET status         = CASE WHEN v_can_pay >= v_remaining THEN 'paid' ELSE 'defaulted' END,
            outstanding    = 0,
            closed_at_tick = v_current_tick,
            updated_at     = now()
        WHERE id = v_loan.id;

        IF NOT (v_loan.lender_faction_id = ANY(v_bank_loan_lenders)) THEN
            v_bank_loan_lenders := array_append(v_bank_loan_lenders, v_loan.lender_faction_id);
        END IF;
    END LOOP;

    IF array_length(v_bank_loan_lenders, 1) IS NOT NULL THEN
        FOREACH v_nid IN ARRAY v_bank_loan_lenders LOOP
            PERFORM recompute_finance_stats(v_nid);
        END LOOP;
    END IF;

    -- ── GDP_Growth shock ──
    v_hq_nation_id := v_corp.nation_id;

    SELECT ARRAY_AGG(DISTINCT nation_id) INTO v_sub_nations
    FROM corp_properties
    WHERE faction_id = p_faction_id
      AND type = 'regional_hq'
      AND nation_id IS NOT NULL
      AND nation_id <> COALESCE(v_hq_nation_id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_hq_nation_id IS NOT NULL THEN
        SELECT gdp_growth INTO v_cur_gdp FROM nations WHERE id = v_hq_nation_id;
        IF FOUND THEN
            v_new_gdp := ROUND(GREATEST(0, LEAST(100, COALESCE(v_cur_gdp, 50) - 0.2)) * 10) / 10.0;
            UPDATE nations SET gdp_growth = v_new_gdp WHERE id = v_hq_nation_id;
            v_gdp_penalties := v_gdp_penalties || jsonb_build_object(
                'nation_id', v_hq_nation_id, 'delta', -0.2,
                'before', v_cur_gdp, 'after', v_new_gdp
            );
        END IF;
    END IF;

    IF v_sub_nations IS NOT NULL THEN
        FOREACH v_nid IN ARRAY v_sub_nations LOOP
            SELECT gdp_growth INTO v_cur_gdp FROM nations WHERE id = v_nid;
            IF FOUND THEN
                v_new_gdp := ROUND(GREATEST(0, LEAST(100, COALESCE(v_cur_gdp, 50) - 0.1)) * 10) / 10.0;
                UPDATE nations SET gdp_growth = v_new_gdp WHERE id = v_nid;
                v_gdp_penalties := v_gdp_penalties || jsonb_build_object(
                    'nation_id', v_nid, 'delta', -0.1,
                    'before', v_cur_gdp, 'after', v_new_gdp
                );
            END IF;
        END LOOP;
    END IF;

    UPDATE construction_contracts
    SET status = 'expired'
    WHERE issuer_faction_id = p_faction_id
      AND status IN ('open', 'bidding');

    v_payback_note := CASE WHEN v_total_payback > 0
        THEN ' $' || to_char(v_total_payback, 'FM999,999,999,999') || ' was repaid to creditors.'
        ELSE ''
    END;

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        effects_applied, fired_at_tick
    ) VALUES (
        v_corp.nation_id,
        p_faction_id,
        v_corp.faction_name || ' — Bankruptcy',
        v_corp.faction_name || ' has officially filed for bankruptcy. It has laid off its executive staff and ceased operations.' || v_payback_note,
        'business',
        'corp_bankruptcy',
        jsonb_build_object(
            'corp_name', v_corp.faction_name,
            'sector', v_corp.corp_sector,
            'user_id', v_user_id,
            'loan_payback', v_total_payback,
            'valuation', v_valuation,
            'gdp_penalties', v_gdp_penalties
        ),
        v_current_tick
    );

    DELETE FROM factions WHERE id = p_faction_id;

    RETURN jsonb_build_object(
        'success',       true,
        'corp_name',     v_corp.faction_name,
        'valuation',     v_valuation,
        'total_payback', v_total_payback,
        'gdp_penalties', v_gdp_penalties
    );
END;
$$;

GRANT EXECUTE ON FUNCTION declare_corp_bankruptcy(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
