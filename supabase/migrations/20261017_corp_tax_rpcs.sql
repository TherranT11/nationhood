-- ════════════════════════════════════════════════════════════════
-- Step 4 of 6: Four corporate-tax RPCs
--
--   assess_corporate_taxes(p_current_tick INT)
--     Service-role only. Called every 12 ticks at the January anchor
--     by the tick processor. Sums revenue_* events per (corp, nation)
--     over the prior 12 ticks; if positive AND the nation has a
--     non-zero corporate_tax rate, INSERTs a corp_tax_bills row.
--     ON CONFLICT DO NOTHING for cron-retry idempotency.
--
--   pay_corporate_tax_full(p_bill_id UUID)
--     Authenticated. Corp owner pays full amount_due. Sufficient cash
--     → status=paid, full debit, full nation.budget credit.
--     Insufficient → pay what's available (drops corp to 0), residual
--     + 10% late fee → status=delinquent. Nation gets credited only
--     for what was actually paid.
--
--   cook_corporate_tax_books(p_bill_id UUID)
--     Authenticated. ONLY allowed on status='due' (blocked on
--     partial / delinquent — once you've taken a hit, no more
--     gambling). Pays 50% (or what's available if cash is short),
--     credits nation budget for the paid amount, then rolls
--     1d100 + nations.corruption clamped 0-100.
--       > 75 success → status=paid_with_fraud,
--                      factions.corp_fraud_total += saved amount.
--       ≤ 75 caught  → residual + 10% fee, status=delinquent,
--                      corp_reputation -1 (floor 0).
--
--   ignore_corporate_tax_bill(p_bill_id UUID)
--     Authenticated. Sets ignored_at_tick (so the UI hides the card
--     for this bill until next cycle), corp_reputation -1 (floor 0).
--     Bill stays 'due' / 'delinquent' as before. Idempotent — second
--     ignore on the same bill returns 'already_ignored', no extra
--     rep hit.
--
-- All three player RPCs SELECT ... FOR UPDATE on the bill row to
-- serialize against concurrent action clicks (e.g. Pay in Full and
-- Cook the Books racing in two browser tabs).
--
-- Cash flow: emit_corp_cash_event with p_nation_id = the assessing
-- nation, category 'tax'. Helper handles the corp_cash_reserves debit
-- atomically with the corp_cash_events ledger row.
--
-- Nation budget credit: COALESCE(budget,0) + amount_paid /
-- 1_000_000_000, mirroring the RAW_PER_ABSTRACT convention used by
-- chargePolicyUpfrontCost in bills.js.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. assess_corporate_taxes ──────────────────────────────────
CREATE OR REPLACE FUNCTION assess_corporate_taxes(p_current_tick INT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_year         INT;
    v_window_start INT;
    v_window_end   INT;
    v_grace_ticks  CONSTANT INT := 6;
    v_inserted     INT := 0;
    v_skipped_dup  INT := 0;
    r              RECORD;
    v_amount_due   BIGINT;
BEGIN
    -- Calendar year being assessed: tick 12 → 2000, tick 24 → 2001, etc.
    -- Matches the cup-year convention from 20260919 (v_year = 2000 + cup_start/12).
    v_year         := 1999 + (p_current_tick / 12);
    v_window_start := p_current_tick - 12;
    v_window_end   := p_current_tick - 1;

    FOR r IN
        SELECT
            ev.corp_id,
            ev.nation_id,
            SUM(ev.delta)         AS revenue_taxed,
            COALESCE(n.corporate_tax, 0) AS rate_pct
        FROM corp_cash_events ev
        JOIN nations n ON n.id = ev.nation_id
        WHERE ev.tick BETWEEN v_window_start AND v_window_end
          AND ev.category LIKE 'revenue\_%' ESCAPE '\'
          AND ev.nation_id IS NOT NULL
        GROUP BY ev.corp_id, ev.nation_id, n.corporate_tax
        HAVING SUM(ev.delta) > 0
           AND COALESCE(n.corporate_tax, 0) > 0
    LOOP
        v_amount_due := FLOOR(r.revenue_taxed * r.rate_pct / 100)::BIGINT;
        IF v_amount_due <= 0 THEN CONTINUE; END IF;

        BEGIN
            INSERT INTO corp_tax_bills (
                corp_id, nation_id, year,
                revenue_taxed, rate_pct, amount_due,
                due_at_tick, status
            ) VALUES (
                r.corp_id, r.nation_id, v_year,
                FLOOR(r.revenue_taxed)::BIGINT,
                FLOOR(r.rate_pct)::INT,
                v_amount_due,
                p_current_tick + v_grace_ticks,
                'due'
            );
            v_inserted := v_inserted + 1;
        EXCEPTION WHEN unique_violation THEN
            -- Cron retry against an already-assessed (corp, nation, year).
            v_skipped_dup := v_skipped_dup + 1;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'success',     true,
        'tick',        p_current_tick,
        'year',        v_year,
        'inserted',    v_inserted,
        'skipped_dup', v_skipped_dup
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION assess_corporate_taxes(INT) FROM PUBLIC;

COMMENT ON FUNCTION assess_corporate_taxes(INT) IS
    'Per-tick processor: at the January anchor (tick % 12 == 0), sums revenue_* corp_cash_events over the prior 12 ticks per (corp, nation), inserts a corp_tax_bills row when revenue > 0 AND nation.corporate_tax > 0. Idempotent on (corp, nation, year) via unique-violation catch — safe under cron retry. NOT granted to authenticated; called from advance-corp-tick.';


-- ── 2. pay_corporate_tax_full ──────────────────────────────────
CREATE OR REPLACE FUNCTION pay_corporate_tax_full(p_bill_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user      UUID := auth.uid();
    v_bill      corp_tax_bills%ROWTYPE;
    v_corp      factions%ROWTYPE;
    v_cash      NUMERIC;
    v_tick      INT;
    v_paid      BIGINT;
    v_residual  BIGINT;
    v_late_fee  BIGINT;
    v_new_status TEXT;
    v_budget_credit NUMERIC;
BEGIN
    -- Lock the bill row for the duration of this transaction so a
    -- concurrent cook / ignore / second pay click can't race us.
    SELECT * INTO v_bill FROM corp_tax_bills WHERE id = p_bill_id FOR UPDATE;
    IF v_bill.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_not_found');
    END IF;
    IF v_bill.status NOT IN ('due', 'partial', 'delinquent') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_already_resolved',
            'status', v_bill.status);
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_bill.corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF NOT is_admin()
       AND v_corp.id <> v_user
       AND v_corp.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Lock the corp's factions row so cash + ledger stay consistent
    -- under concurrent emit_corp_cash_event calls from other RPCs.
    PERFORM 1 FROM factions WHERE id = v_corp.id FOR UPDATE;
    SELECT COALESCE(corp_cash_reserves, 0) INTO v_cash FROM factions WHERE id = v_corp.id;

    IF v_cash >= v_bill.amount_due THEN
        v_paid       := v_bill.amount_due;
        v_residual   := 0;
        v_late_fee   := 0;
        v_new_status := 'paid';
    ELSE
        v_paid       := v_cash::BIGINT;
        v_residual   := v_bill.amount_due - v_paid;
        v_late_fee   := FLOOR(v_residual * 0.10)::BIGINT;
        v_new_status := 'delinquent';
    END IF;

    IF v_paid > 0 THEN
        PERFORM emit_corp_cash_event(
            v_corp.id, 'tax',
            format('Corporate tax %s', v_bill.year),
            -v_paid, v_tick, v_bill.nation_id
        );
    END IF;

    UPDATE corp_tax_bills SET
        amount_due   = v_residual + v_late_fee,
        status       = v_new_status,
        paid_at_tick = CASE WHEN v_new_status = 'paid' THEN v_tick ELSE paid_at_tick END,
        updated_at   = now()
    WHERE id = v_bill.id;

    -- Credit nation.budget by the actually-paid amount (RAW_PER_ABSTRACT
    -- convention from chargePolicyUpfrontCost in bills.js).
    v_budget_credit := v_paid::NUMERIC / 1000000000;
    IF v_budget_credit > 0 THEN
        UPDATE nations SET budget = COALESCE(budget, 0) + v_budget_credit
        WHERE id = v_bill.nation_id;
    END IF;

    RETURN jsonb_build_object(
        'success',         true,
        'amount_paid',     v_paid,
        'residual',        v_residual + v_late_fee,
        'status',          v_new_status,
        'budget_credited', v_budget_credit
    );
END;
$$;

GRANT EXECUTE ON FUNCTION pay_corporate_tax_full(UUID) TO authenticated;

COMMENT ON FUNCTION pay_corporate_tax_full(UUID) IS
    'Pay a corporate tax bill in full. Sufficient cash → status=paid, full nation.budget credit. Insufficient → pay what is available (corp drops to 0 cash), residual + 10%% late fee → status=delinquent, nation credited only for what was actually paid. Allowed on status due / partial / delinquent. SELECT FOR UPDATE on the bill + corp rows serializes concurrent clicks.';


-- ── 3. cook_corporate_tax_books ────────────────────────────────
CREATE OR REPLACE FUNCTION cook_corporate_tax_books(p_bill_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user        UUID := auth.uid();
    v_bill        corp_tax_bills%ROWTYPE;
    v_corp        factions%ROWTYPE;
    v_nation      nations%ROWTYPE;
    v_cash        NUMERIC;
    v_tick        INT;
    v_half        BIGINT;
    v_paid        BIGINT;
    v_unpaid      BIGINT;
    v_late_fee    BIGINT;
    v_corruption  NUMERIC;
    v_roll        INT;
    v_total_roll  NUMERIC;
    v_success     BOOLEAN;
    v_budget_credit NUMERIC;
BEGIN
    SELECT * INTO v_bill FROM corp_tax_bills WHERE id = p_bill_id FOR UPDATE;
    IF v_bill.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_not_found');
    END IF;
    -- Cook is gated to fresh bills only — once a bill is partial /
    -- delinquent, the player has already taken some hit and the only
    -- recovery path is Pay in Full.
    IF v_bill.status <> 'due' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cook_blocked',
            'status', v_bill.status);
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_bill.corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF NOT is_admin()
       AND v_corp.id <> v_user
       AND v_corp.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_bill.nation_id;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    PERFORM 1 FROM factions WHERE id = v_corp.id FOR UPDATE;
    SELECT COALESCE(corp_cash_reserves, 0) INTO v_cash FROM factions WHERE id = v_corp.id;

    -- Pay 50%, or what's available if cash is short. Both branches
    -- keep the same cook semantics — the dice still roll.
    v_half := FLOOR(v_bill.amount_due * 0.5)::BIGINT;
    v_paid := LEAST(v_half, v_cash::BIGINT);

    IF v_paid > 0 THEN
        PERFORM emit_corp_cash_event(
            v_corp.id, 'tax',
            format('Corporate tax %s (cook the books, 50%%)', v_bill.year),
            -v_paid, v_tick, v_bill.nation_id
        );
    END IF;

    v_budget_credit := v_paid::NUMERIC / 1000000000;
    IF v_budget_credit > 0 THEN
        UPDATE nations SET budget = COALESCE(budget, 0) + v_budget_credit
        WHERE id = v_bill.nation_id;
    END IF;

    -- 1d100 + nation corruption (clamped 0-100). > 75 → success.
    v_corruption := GREATEST(0, LEAST(100, COALESCE(v_nation.corruption, 0)));
    v_roll       := 1 + FLOOR(random() * 100)::INT;
    v_total_roll := v_roll + v_corruption;
    v_success    := v_total_roll > 75;

    v_unpaid := v_bill.amount_due - v_paid;

    IF v_success THEN
        UPDATE factions
           SET corp_fraud_total = COALESCE(corp_fraud_total, 0) + v_unpaid
         WHERE id = v_corp.id;
        UPDATE corp_tax_bills SET
            amount_due   = 0,
            status       = 'paid_with_fraud',
            paid_at_tick = v_tick,
            updated_at   = now()
        WHERE id = v_bill.id;
    ELSE
        v_late_fee := FLOOR(v_unpaid * 0.10)::BIGINT;
        UPDATE corp_tax_bills SET
            amount_due = v_unpaid + v_late_fee,
            status     = 'delinquent',
            updated_at = now()
        WHERE id = v_bill.id;
        UPDATE factions
           SET corp_reputation = GREATEST(0, COALESCE(corp_reputation, 0) - 1)
         WHERE id = v_corp.id;
    END IF;

    RETURN jsonb_build_object(
        'success',            true,
        'roll',               v_roll,
        'corruption',         v_corruption,
        'total',              v_total_roll,
        'fraud_succeeded',    v_success,
        'amount_paid',        v_paid,
        'amount_saved',       CASE WHEN v_success THEN v_unpaid ELSE 0 END,
        'amount_delinquent',  CASE WHEN v_success THEN 0 ELSE v_unpaid + v_late_fee END,
        'budget_credited',    v_budget_credit
    );
END;
$$;

GRANT EXECUTE ON FUNCTION cook_corporate_tax_books(UUID) TO authenticated;

COMMENT ON FUNCTION cook_corporate_tax_books(UUID) IS
    'Cook the Books on a fresh (status=due) tax bill. Pay 50%% (or what cash allows), credit nation.budget for the paid amount, then roll 1d100 + nations.corruption clamped 0-100. > 75 → status=paid_with_fraud, factions.corp_fraud_total += unpaid amount. <= 75 caught → unpaid + 10%% fee, status=delinquent, corp_reputation -1 floor 0. Blocked on partial / delinquent / paid bills — once a hit lands, only Pay in Full closes the row.';


-- ── 4. ignore_corporate_tax_bill ──────────────────────────────
CREATE OR REPLACE FUNCTION ignore_corporate_tax_bill(p_bill_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user  UUID := auth.uid();
    v_bill  corp_tax_bills%ROWTYPE;
    v_corp  factions%ROWTYPE;
    v_tick  INT;
BEGIN
    SELECT * INTO v_bill FROM corp_tax_bills WHERE id = p_bill_id FOR UPDATE;
    IF v_bill.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_not_found');
    END IF;
    IF v_bill.status NOT IN ('due', 'partial', 'delinquent') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_already_resolved',
            'status', v_bill.status);
    END IF;
    -- Idempotency: a second ignore on the same bill no-ops without
    -- charging another rep hit. Player can't spam-click for damage.
    IF v_bill.ignored_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_ignored');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_bill.corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF NOT is_admin()
       AND v_corp.id <> v_user
       AND v_corp.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE corp_tax_bills SET
        ignored_at_tick = v_tick,
        updated_at      = now()
    WHERE id = v_bill.id;

    UPDATE factions
       SET corp_reputation = GREATEST(0, COALESCE(corp_reputation, 0) - 1)
     WHERE id = v_corp.id;

    RETURN jsonb_build_object(
        'success',         true,
        'bill_id',         v_bill.id,
        'ignored_at_tick', v_tick
    );
END;
$$;

GRANT EXECUTE ON FUNCTION ignore_corporate_tax_bill(UUID) TO authenticated;

COMMENT ON FUNCTION ignore_corporate_tax_bill(UUID) IS
    'Dismiss the Pressing Issues card for one bill: sets ignored_at_tick (UI filter on this column), corp_reputation -1 floor 0. Bill stays in its current status (due / partial / delinquent). Idempotent — second ignore on the same bill no-ops without an extra rep hit.';

NOTIFY pgrst, 'reload schema';

COMMIT;
