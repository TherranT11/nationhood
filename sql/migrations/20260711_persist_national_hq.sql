-- ══════════════════════════════════════════════════════════════
-- Persist National HQ as a real corp_properties row
--
-- Background: every corporation has a "National HQ" headquartered
-- in its home nation. Until now the HQ was synthesized at display
-- time from nations.standard_of_living + nations.control — three
-- separate inline copies of the same formula (expansion.html,
-- corp-dashboard.html, advance-tick) and a shared helper
-- (synthesizeNationalHq in js/game/corp-valuation.js).
--
-- That choice has been the root cause of a long string of bugs:
--   * Masthead valuation read $4.67M because the dashboard's
--     nation fetch dropped standard_of_living (06a439a).
--   * Bailouts and bankruptcy under-counted by tens of millions
--     until withNationalHq was wired through every call site
--     (e52e81b).
--   * The corp-tick maintenance loop scans corp_properties only,
--     so the synthetic HQ's "MAINT/TICK $359.3k" displayed on
--     Expansion has never actually been deducted — Costs & Wages
--     reads $0 forever.
--
-- This migration replaces the synthesis with a persisted row.
-- Every system that already reads corp_properties (maintenance,
-- valuation, bailout, bankruptcy, expansion display) now picks
-- the HQ up automatically with no helper.
--
-- Two parts:
--   1. One-shot backfill: insert a national_hq row for every
--      active corp that doesn't already have one. Formulas mirror
--      js/game/corp-valuation.js#nationalHqValue / nationalHqQuality
--      exactly:
--        purchase_price      = round(50M + 25M × sol/100)
--        condition           = round(70 + control × 0.3)
--        monthly_maintenance = round(purchase_price × 0.005)
--   2. Re-create declare_corp_bankruptcy without the synthetic
--      HQ contribution block from 20260709 — the corp_properties
--      SUM at the top of v_prop_value now naturally includes the
--      HQ row, so re-adding it would double-count.
--
-- Idempotent: NOT EXISTS guard on the backfill, CREATE OR REPLACE
-- on the function. Safe to re-run.
-- ══════════════════════════════════════════════════════════════


-- ── 1. Backfill the National HQ row for every active corp ──
-- Skips corps that already have a role='national_hq' row (re-runs).
-- Skips corps with no nation_id (defensive — every corporation
-- should have a home nation, but the WHERE guard prevents a
-- migration crash if seed data is incomplete).
INSERT INTO corp_properties (
    faction_id, nation_id, name, type, role, style,
    capacity, purchase_price, monthly_maintenance, condition,
    city, purchased_at_tick, is_active
)
SELECT
    f.id,
    f.nation_id,
    f.faction_name || ' Headquarters',
    'national_hq',
    'national_hq',
    'Modern',
    1000,
    -- nationalHqValue(sol)
    ROUND(50000000 + 25000000 * GREATEST(0, LEAST(100, COALESCE(n.standard_of_living, 0))) / 100.0),
    -- monthly_maintenance = purchase_price × 0.005, applied via subquery
    -- below so we don't recompute the value twice. Inline arithmetic here.
    ROUND(
        (ROUND(50000000 + 25000000 * GREATEST(0, LEAST(100, COALESCE(n.standard_of_living, 0))) / 100.0))
        * 0.005
    ),
    -- nationalHqQuality(control)
    ROUND(70 + GREATEST(0, LEAST(100, COALESCE(n.control, 50))) * 0.3),
    n.capital,
    COALESCE((SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), 0),
    true
  FROM factions f
  JOIN nations n ON n.id = f.nation_id
 WHERE f.faction_type = 'corporation'
   AND f.abandoned_at IS NULL
   AND f.nation_id IS NOT NULL
   AND NOT EXISTS (
        SELECT 1 FROM corp_properties cp
         WHERE cp.faction_id = f.id
           AND cp.role = 'national_hq'
           AND cp.is_active = true
   );


-- ── 2. Drop the synthetic HQ contribution from declare_corp_bankruptcy ──
-- The 20260709 version added v_hq_value × v_hq_quality to v_prop_value
-- on top of the corp_properties SUM. With the HQ now persisted, that
-- SUM already covers the HQ — the extra block would double-count.
-- This re-creates the function without the synthetic-HQ block.
-- Otherwise identical to the 20260709 body.
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

    -- Property valuation: National HQ is now a real corp_properties row
    -- (sql/migrations/20260711_persist_national_hq.sql), so a single
    -- SUM covers it alongside regional HQs and subsidiaries — no
    -- separate synthetic-HQ contribution needed.
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
            SELECT COALESCE(corp_cash_reserves, 0) INTO v_lender_cash
            FROM factions WHERE id = v_loan.lender_faction_id;
            IF FOUND THEN
                UPDATE factions
                SET corp_cash_reserves = v_lender_cash + v_can_pay
                WHERE id = v_loan.lender_faction_id;
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


-- ── Sanity check ──
SELECT n.name AS nation,
       COUNT(*) AS national_hq_rows,
       SUM(cp.purchase_price)::BIGINT AS total_hq_value
  FROM corp_properties cp
  JOIN factions f ON f.id = cp.faction_id
  JOIN nations  n ON n.id = cp.nation_id
 WHERE cp.role = 'national_hq'
   AND cp.is_active = true
   AND f.abandoned_at IS NULL
 GROUP BY n.name
 ORDER BY n.name;

NOTIFY pgrst, 'reload schema';
