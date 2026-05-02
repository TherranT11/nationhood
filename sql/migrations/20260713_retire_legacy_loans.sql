-- ══════════════════════════════════════════════════════════════
-- Retire the legacy-loan code path (Option A from the audit)
--
-- finance_active_loans is polymorphic: it holds loans, bonds,
-- equity positions, and insurance policies (4 distinct subsystems
-- discriminated by finance_loan_requests.request_type). Bonds /
-- equity / insurance still depend on it across ~18 advance-corp-tick
-- references and aren't being touched by this migration. Only the
-- LOAN slice is retired here.
--
-- What this migration does:
--   1. Move every still-active LOAN row out of finance_active_loans
--      into bank_loans (with a stub bank_loan_requests row to
--      satisfy the FK), so the new banking pipeline owns the only
--      live ledger of in-flight loans.
--   2. Re-mark the migrated source rows as 'repaid' with a marker
--      in the purpose column, so:
--      a) The legacy bankruptcy loop (if any caller still hits an
--         older RPC) treats them as settled and skips them.
--      b) Sanity queries can see what was migrated.
--   3. Re-create declare_corp_bankruptcy WITHOUT the legacy
--      finance_active_loans repayment loop. Bankruptcy now walks
--      bank_loans only — one table, one path. Bonds / equity /
--      insurance positions on finance_active_loans cascade-delete
--      with the corp via the existing ON DELETE CASCADE FK; they
--      were never properly handled by the legacy loan loop anyway
--      (status='current' equity rows would have been treated as
--      loans and "repaid" with cash, which was wrong).
--
-- What this migration does NOT do:
--   * Drop finance_active_loans. Bonds / equity / insurance still
--     write to it; that's separate work.
--   * Drop finance_loan_requests / finance_loan_offers. Same
--     reason — those tables back the non-loan flows too.
--   * Touch advance-corp-tick. The bond/equity/insurance branches
--     stay; they don't intersect with the loan code path.
--
-- Idempotent: NOT EXISTS guard on the migration loop (skips rows
-- that already have a corresponding bank_loans entry); CREATE OR
-- REPLACE on the bankruptcy RPC.
-- ══════════════════════════════════════════════════════════════


-- ── 1. Migrate live legacy loan rows to bank_loans ──
-- term_months → term_ticks is 1:1 (advance-corp-tick treats
-- 12 ticks = 1 year, same as the legacy month accounting).
-- interest_rate (annual %) maps to bank_loans.apr identically.
-- Status: any of {current, late, delinquent} → 'active'.
-- outstanding falls back from remaining_principal → principal − total_paid
-- when the snapshot column is null.
DO $$
DECLARE
    v_legacy     RECORD;
    v_request_id UUID;
    v_outstanding BIGINT;
    v_term_ticks INTEGER;
    v_apr        NUMERIC(6,3);
    v_current    INTEGER;
    v_migrated   INTEGER := 0;
BEGIN
    SELECT COALESCE(current_tick, 0) INTO v_current
      FROM shard WHERE name = 'Alpha Shard';

    FOR v_legacy IN
        SELECT al.id            AS legacy_id,
               al.borrower_faction_id,
               al.lender_faction_id,
               al.nation_id,
               al.principal,
               al.remaining_principal,
               al.total_paid,
               al.interest_rate,
               al.term_months,
               al.purpose,
               al.status,
               al.started_tick,
               al.last_payment_tick,
               al.payments_missed
          FROM finance_active_loans al
          JOIN finance_loan_requests req ON req.id = al.request_id
         WHERE req.request_type = 'loan'
           AND al.status IN ('current', 'late', 'delinquent')
           -- Idempotency: skip rows already migrated. Match key uses
           -- (borrower, lender, principal, started_tick) — unique
           -- enough that a second run won't duplicate.
           AND NOT EXISTS (
                SELECT 1 FROM bank_loans bl
                 WHERE bl.borrower_faction_id = al.borrower_faction_id
                   AND bl.lender_faction_id   = al.lender_faction_id
                   AND bl.principal           = al.principal
                   AND bl.issued_at_tick      = al.started_tick
           )
    LOOP
        -- term_ticks must be > 0 per CHECK; clamp at 1 if legacy had 0/null.
        v_term_ticks := GREATEST(1, COALESCE(v_legacy.term_months, 12));
        -- apr clamped to bank_loans CHECK range [0, 100].
        v_apr := GREATEST(0, LEAST(100, COALESCE(v_legacy.interest_rate, 0)));
        v_outstanding := GREATEST(0,
            COALESCE(v_legacy.remaining_principal,
                     v_legacy.principal - COALESCE(v_legacy.total_paid, 0)));

        -- Stub bank_loan_requests row to satisfy bank_loans.request_id FK.
        -- All optional fields are filled with the same data the legacy
        -- pipeline implicitly carried; status='approved' so the row
        -- can't be re-bid on by the auction flow.
        INSERT INTO bank_loan_requests (
            requesting_faction_id,
            requesting_nation_id,
            target_bank_ids,
            principal,
            term_ticks,
            requested_apr,
            risk_grade,
            purpose,
            status,
            expires_at_tick,
            winning_bank_id,
            created_at_tick,
            resolved_at_tick
        ) VALUES (
            v_legacy.borrower_faction_id,
            v_legacy.nation_id,
            ARRAY[v_legacy.lender_faction_id]::UUID[],
            v_legacy.principal,
            v_term_ticks,
            v_apr,
            'B',
            COALESCE(v_legacy.purpose, '') ||
                CASE WHEN COALESCE(v_legacy.purpose, '') = '' THEN '' ELSE ' ' END
                || '[migrated from finance_active_loans]',
            'approved',
            v_legacy.started_tick + v_term_ticks,
            v_legacy.lender_faction_id,
            v_legacy.started_tick,
            v_legacy.started_tick
        ) RETURNING id INTO v_request_id;

        INSERT INTO bank_loans (
            request_id,
            lender_faction_id,
            borrower_faction_id,
            nation_id,
            principal,
            apr,
            term_ticks,
            outstanding,
            payments_missed,
            status,
            issued_at_tick,
            matures_at_tick,
            last_payment_tick
        ) VALUES (
            v_request_id,
            v_legacy.lender_faction_id,
            v_legacy.borrower_faction_id,
            v_legacy.nation_id,
            v_legacy.principal,
            v_apr,
            v_term_ticks,
            v_outstanding,
            COALESCE(v_legacy.payments_missed, 0),
            'active',
            v_legacy.started_tick,
            v_legacy.started_tick + v_term_ticks,
            v_legacy.last_payment_tick
        );

        -- Mark the source row settled so the legacy loan loop (anywhere
        -- it still exists) skips it. Append a marker so an audit can
        -- find these rows.
        UPDATE finance_active_loans
           SET status         = 'repaid',
               completed_tick = v_current,
               purpose        = COALESCE(purpose, '') ||
                                 CASE WHEN COALESCE(purpose, '') = '' THEN '' ELSE ' ' END
                                 || '[migrated to bank_loans]'
         WHERE id = v_legacy.legacy_id;

        v_migrated := v_migrated + 1;
    END LOOP;

    RAISE NOTICE '[20260713] Migrated % legacy loan row(s) to bank_loans', v_migrated;

    -- corp_debt is intentionally NOT bumped here. Per the comment on
    -- 20260608_bank_loan_corp_debt_sync.sql, the legacy finance flow
    -- already wrote corp_debt at accept time (see legacy
    -- corp-dashboard-home2.html:2919), so each migrated borrower's
    -- existing corp_debt already reflects this principal. Re-crediting
    -- would double-count. close_bank_loan will decrement corp_debt
    -- correctly when a migrated loan eventually closes.

    -- Refresh lender finance stats. Each migrated row added to a
    -- lender's outstanding pool, which affects corp_lending_capital
    -- and corp_overleverage. recompute_finance_stats short-circuits
    -- for non-Finance corps so passing every distinct lender is safe.
    FOR v_legacy IN
        SELECT DISTINCT lender_faction_id AS lid
          FROM bank_loans bl
         WHERE EXISTS (
                SELECT 1 FROM bank_loan_requests blr
                 WHERE blr.id = bl.request_id
                   AND blr.purpose LIKE '%[migrated from finance_active_loans]%'
           )
    LOOP
        PERFORM recompute_finance_stats(v_legacy.lid);
    END LOOP;
END $$;


-- ── 2. Re-create declare_corp_bankruptcy without the legacy loop ──
-- Drops the finance_active_loans repayment block from the 20260712
-- version. bank_loans is now the only table the bankruptcy RPC
-- walks for creditor paybacks. Bonds / equity / insurance rows on
-- finance_active_loans still cascade-delete with the corp via the
-- ON DELETE CASCADE FK; they aren't paid out (as they shouldn't be —
-- the legacy loop was treating them as loans, which was incorrect).
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

    -- Property: National HQ + regional HQs + subsidiaries all live in
    -- corp_properties (HQ persisted by 20260711). One SUM covers the lot.
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

    -- ── Repay bank_loans (the only loan ledger now) ──
    -- Lender paybacks flow through emit_corp_cash_event so cash and the
    -- corp_cash_events ledger stay in sync (20260712).
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


-- ── Sanity counts ──
-- Should show every nation that had legacy loans, with the migrated
-- count and the equivalent bank_loans rows now active.
SELECT
    n.name AS nation,
    COUNT(*) FILTER (WHERE bl.status = 'active') AS active_bank_loans,
    SUM(bl.outstanding) FILTER (WHERE bl.status = 'active')::BIGINT AS total_outstanding
  FROM bank_loans bl
  JOIN nations n ON n.id = bl.nation_id
 GROUP BY n.name
 ORDER BY n.name;

-- And the migrated source rows (now 'repaid' with the marker).
SELECT
    COUNT(*) AS legacy_rows_migrated
  FROM finance_active_loans
 WHERE purpose LIKE '%[migrated to bank_loans]%';

NOTIFY pgrst, 'reload schema';
