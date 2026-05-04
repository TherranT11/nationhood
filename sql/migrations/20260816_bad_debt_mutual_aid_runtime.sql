-- 20260816_bad_debt_mutual_aid_runtime.sql
--
-- Strategic Alliances — Push C: Bad Debt Mutual Aid runtime.
--
-- Article spec: "Any single loan default ≥ $20M against a member corp:
-- every other member absorbs 15% of the written-off principal as a
-- one-time Lending Capital reduction. The defaulted-on bank gets
-- first claim on any recovered collateral, ahead of secondary
-- creditors."
--
-- Pieces:
--   1. Helper RPC _apply_bad_debt_mutual_aid(lender, default_amount)
--      — checks if the defaulted-on bank is in a Bad-Debt-Mutual-Aid
--      alliance, and if the writeoff hits the $20M threshold, deducts
--      15% × writeoff from each peer's corp_lending_capital_max
--      (the persistent base — corp_lending_capital itself is computed
--      via recompute_finance_stats and would be overwritten otherwise).
--      Returns the count of peers absorbed.
--
--      Conversion: corp_lending_capital_max defaults to 5 = $250M of
--      headroom (per 20260605 comment), so 1 LC unit = $50M. A $20M
--      default → 0.15 × $20M / $50M = 0.06 LC reduction per peer.
--      A $100M default → 0.30 LC reduction per peer.
--
--   2. declare_corp_bankruptcy re-issued from the 20260713 body with
--      ONE addition: after the UPDATE that flips a bank_loan to
--      'defaulted', call the helper with the writeoff (remaining −
--      partial-paid). Helper is a no-op fast path when the lender
--      isn't in a Bad-Debt alliance, so safe to call unconditionally
--      on every bank-loan close, but we gate on `v_can_pay <
--      v_remaining` (== status flipped to 'defaulted') so paid loans
--      don't hit the helper at all.
--
-- DEFERRED to a follow-up (called out in Push planning):
--   • "First claim on recovered collateral" — would re-order the
--     payback loop to prioritize alliance peers ahead of non-members.
--     Structural change to how v_payback_cap is allocated; not in
--     this push. Today the bankruptcy loop pays oldest loans first
--     regardless of alliance membership; absorption + recovery
--     priority can land separately.

BEGIN;

-- ── 1. Helper RPC ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _apply_bad_debt_mutual_aid(
    p_lender_faction_id UUID,
    p_default_amount    NUMERIC
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_threshold     CONSTANT NUMERIC := 20000000;
    v_share         CONSTANT NUMERIC := 0.15;
    v_lc_per_dollar CONSTANT NUMERIC := 50000000.0;
    v_alliance_id   UUID;
    v_lc_reduction  NUMERIC;
    v_peer_count    INT := 0;
    v_peer_id       UUID;
BEGIN
    -- Fast no-op paths.
    IF p_default_amount IS NULL OR p_default_amount < v_threshold THEN
        RETURN 0;
    END IF;
    v_alliance_id := _alliance_member_has_article(p_lender_faction_id, 'bad_debt_mutual');
    IF v_alliance_id IS NULL THEN
        RETURN 0;
    END IF;

    -- 15 % of writeoff in dollars → LC units.
    v_lc_reduction := (p_default_amount * v_share) / v_lc_per_dollar;
    IF v_lc_reduction <= 0 THEN RETURN 0; END IF;

    FOR v_peer_id IN
        SELECT m.faction_id
        FROM alliance_members m
        WHERE m.alliance_id = v_alliance_id
          AND m.left_at_tick IS NULL
          AND m.faction_id <> p_lender_faction_id
    LOOP
        -- Reduce the persistent base (max). Floor at 0 so a small
        -- bank can't go negative. recompute_finance_stats then re-
        -- derives the visible corp_lending_capital from the new max.
        UPDATE factions
        SET corp_lending_capital_max = GREATEST(
            0::numeric,
            COALESCE(corp_lending_capital_max, 5) - v_lc_reduction
        )
        WHERE id = v_peer_id;

        PERFORM recompute_finance_stats(v_peer_id);
        v_peer_count := v_peer_count + 1;
    END LOOP;

    RETURN v_peer_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION _apply_bad_debt_mutual_aid(UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION _apply_bad_debt_mutual_aid(UUID, NUMERIC) TO service_role;

COMMENT ON FUNCTION _apply_bad_debt_mutual_aid(UUID, NUMERIC) IS
    'Bad Debt Mutual Aid enforcement. If the defaulted-on lender is in a Bad-Debt alliance and the writeoff is ≥ $20M, deducts 15% of the writeoff (in LC units, where $50M = 1 LC) from each other active member''s corp_lending_capital_max (clamped ≥ 0) and triggers recompute_finance_stats per peer. Returns peer count absorbed.';


-- ── 2. declare_corp_bankruptcy — call helper on each bank_loan default ──
-- Re-issue the latest body (20260713) with one block added inside the
-- bank_loans default loop. The diff against 20260713 is the new IF
-- block right after the UPDATE that flips status.
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
    v_writeoff       NUMERIC;
    v_hq_nation_id   UUID;
    v_sub_nations    UUID[];
    v_nid            UUID;
    v_cur_gdp        NUMERIC;
    v_new_gdp        NUMERIC;
    v_gdp_penalties  JSONB := '[]'::jsonb;
    v_payback_note   TEXT := '';
    v_bank_loan_lenders UUID[] := ARRAY[]::UUID[];
    v_total_aid_peers   INT := 0;
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

        -- ── Bad Debt Mutual Aid (added in 20260816) ──
        -- Only fires when this loan actually defaulted (writeoff > 0)
        -- AND the lender is in a Bad-Debt alliance AND writeoff ≥ $20M.
        -- Helper handles the gates internally; the IF here just avoids
        -- the call on fully-paid loans.
        IF v_can_pay < v_remaining THEN
            v_writeoff := v_remaining - v_can_pay;
            v_total_aid_peers := v_total_aid_peers
                + _apply_bad_debt_mutual_aid(v_loan.lender_faction_id, v_writeoff);
        END IF;

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
            'gdp_penalties', v_gdp_penalties,
            'bad_debt_aid_absorptions', v_total_aid_peers
        ),
        v_current_tick
    );

    DELETE FROM factions WHERE id = p_faction_id;

    RETURN jsonb_build_object(
        'success',                  true,
        'corp_name',                v_corp.faction_name,
        'valuation',                v_valuation,
        'total_payback',            v_total_payback,
        'gdp_penalties',            v_gdp_penalties,
        'bad_debt_aid_absorptions', v_total_aid_peers
    );
END;
$$;

GRANT EXECUTE ON FUNCTION declare_corp_bankruptcy(UUID) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
