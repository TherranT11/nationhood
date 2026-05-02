-- ══════════════════════════════════════════════════════════════
-- Fix corp bankruptcy against the new bank_loans pipeline.
--
-- Bug: a corp with any outstanding bank_loans cannot declare
-- bankruptcy. The browser surfaces:
--   "Bankruptcy failed: update or delete on table 'factions'
--    violates foreign key constraint
--    'bank_loans_borrower_faction_id_fkey' on table 'bank_loans'"
--
-- Two underlying issues:
--
--  1. FK posture. bank_loans (introduced 20260519, renamed
--     20260522) was created with ON DELETE RESTRICT on both
--     borrower_faction_id and lender_faction_id. Every other
--     corp-facing table in the schema — including the legacy
--     finance_active_loans the bankruptcy RPC was originally
--     written against — uses ON DELETE CASCADE. The mismatch
--     means the bankruptcy DELETE FROM factions is rejected for
--     any corp that ever borrowed (or lent) on the new pipeline.
--
--  2. RPC coverage. declare_corp_bankruptcy iterates
--     finance_active_loans to repay creditors up to 50% of
--     valuation, but never touches bank_loans. Even if the FK
--     were fixed, lenders on the new pipeline would receive
--     nothing — the rows would just CASCADE-vanish.
--
-- Fix:
--   * Drop + recreate the two bank_loans FKs with ON DELETE
--     CASCADE, mirroring the pattern from
--     20260421_corp_bankruptcy_fk_cascade.sql.
--   * Replace declare_corp_bankruptcy with a version that
--     processes bank_loans alongside finance_active_loans:
--     repay outstanding loans in issued-tick order up to the
--     remaining cap, credit each lender's cash, flip the loan
--     to 'paid' (full) or 'defaulted' (partial/none), zero the
--     outstanding, set closed_at_tick, and recompute the
--     lender's Finance hero stats so headroom returns. Any
--     leftover rows are then handled by the CASCADE on faction
--     delete.
-- ══════════════════════════════════════════════════════════════


-- ── 1. Relax the bank_loans FKs from RESTRICT to CASCADE ──
-- These match the cascade behavior of finance_active_loans and
-- the rest of the corp-facing schema. Idempotent (DROP IF EXISTS).
ALTER TABLE bank_loans
    DROP CONSTRAINT IF EXISTS bank_loans_borrower_faction_id_fkey;
ALTER TABLE bank_loans
    ADD CONSTRAINT bank_loans_borrower_faction_id_fkey
        FOREIGN KEY (borrower_faction_id) REFERENCES factions(id) ON DELETE CASCADE;

ALTER TABLE bank_loans
    DROP CONSTRAINT IF EXISTS bank_loans_lender_faction_id_fkey;
ALTER TABLE bank_loans
    ADD CONSTRAINT bank_loans_lender_faction_id_fkey
        FOREIGN KEY (lender_faction_id) REFERENCES factions(id) ON DELETE CASCADE;


-- ── 2. Replace declare_corp_bankruptcy with bank_loans-aware version ──
-- Diff vs. the 20260421 original is contained: a second
-- repayment loop after the finance_active_loans loop, sharing
-- the same v_total_payback / v_payback_cap accounting so the
-- 50% cap covers BOTH loan tables combined. Everything else
-- (cooldown, valuation, GDP shock, contract expiry, event_log,
-- final delete) is unchanged.
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
    v_lender_cash    NUMERIC;
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

    -- ── Repay legacy finance_active_loans (equity / bond / insurance) ──
    -- Unchanged from the original RPC. Rows on this table CASCADE-die
    -- on the final faction DELETE, so no post-loop cleanup needed.
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

        SELECT COALESCE(corp_cash_reserves, 0) INTO v_lender_cash
        FROM factions WHERE id = v_loan.lender_faction_id;
        IF FOUND THEN
            UPDATE factions
            SET corp_cash_reserves = v_lender_cash + v_can_pay
            WHERE id = v_loan.lender_faction_id;
        END IF;

        UPDATE finance_active_loans
        SET status = 'repaid',
            total_paid = COALESCE(total_paid, 0) + v_can_pay,
            completed_tick = v_current_tick
        WHERE id = v_loan.id;

        v_total_payback := v_total_payback + v_can_pay;
    END LOOP;

    -- ── Repay bank_loans (the new banking pipeline) ──
    -- Same accounting as above; v_total_payback / v_payback_cap span
    -- both tables so the 50% cap is total-portfolio, not per-table.
    -- Track touched lenders so we can recompute their Finance hero
    -- stats once at the end (a partial repayment changes outstanding,
    -- which feeds corp_lending_capital + corp_overleverage).
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
            SELECT COALESCE(corp_cash_reserves, 0) INTO v_lender_cash
            FROM factions WHERE id = v_loan.lender_faction_id;
            IF FOUND THEN
                UPDATE factions
                SET corp_cash_reserves = v_lender_cash + v_can_pay
                WHERE id = v_loan.lender_faction_id;
            END IF;
            v_total_payback := v_total_payback + v_can_pay;
        END IF;

        -- Loan closes regardless: full repay → 'paid', partial/none →
        -- 'defaulted'. Outstanding zeroed so any lingering reads (or
        -- a brief window before CASCADE fires on the faction delete)
        -- see a settled row.
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

    -- Recompute each touched lender's Finance hero stats. Cheap
    -- (one UPDATE per lender) and keeps the lending-capital /
    -- overleverage cards in sync without waiting for the next tick.
    IF array_length(v_bank_loan_lenders, 1) IS NOT NULL THEN
        FOREACH v_nid IN ARRAY v_bank_loan_lenders LOOP
            PERFORM recompute_finance_stats(v_nid);
        END LOOP;
    END IF;

    -- ── GDP_Growth shock: HQ −0.2, each subsidiary nation −0.1 ──
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
