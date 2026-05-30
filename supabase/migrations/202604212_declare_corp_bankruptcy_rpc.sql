-- Atomic corp bankruptcy RPC.
--
-- Replaces the ~10-step client-side flow in corp-operations{,-shipping}.html
-- with one SECURITY DEFINER function. Fixes three audit findings:
--
--   #5 error handling — any failure inside the function rolls the whole
--      transaction back; no more partial-state drift (lender paid but
--      faction not deleted, GDP penalty applied but event never logged,
--      etc.)
--   #6 transaction atomicity — PL/pgSQL functions run in a single
--      transaction. Either everything commits or nothing does.
--   #8 cross-corp RLS writes — the function runs as owner, so it can
--      credit the lender's cash, touch other nations' gdp_growth, and
--      flip loan status regardless of the caller's RLS policies. A
--      strict ownership check at the top is the ONLY gate.
--
-- The valuation formula is intentionally kept in sync with
-- js/game/corp-valuation.js's computeCorpValuation (cash + propertyValue +
-- equipmentValue − liabilities, then × 1.30). Finance receivables are
-- excluded here to match the existing client call site, which also
-- omits them. If the JS formula changes, update this one too.
--
-- Cascade deletes (shipping_applications, shipping_claims,
-- insurance_claims, corp_vessels, vessel_orders, subsidiary_*,
-- finance_active_loans as lender/borrower, corp_properties,
-- corp_equipment*, corp_material_inventory, corp_warehouse,
-- corp_executives, faction_agitators, contract_bids) all fire from
-- the single DELETE FROM factions — no per-table pre-cleanup needed.

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
BEGIN
    -- ── Caller identity ──
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- ── Lock + validate target corp ──
    SELECT * INTO v_corp FROM factions
    WHERE id = p_faction_id
      AND faction_type = 'corporation'
      AND abandoned_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Corporation not found or already dissolved';
    END IF;

    -- Ownership gate — the only thing between the caller and SECURITY DEFINER
    -- privileges. A corp's owner is either factions.id = user.id (legacy
    -- one-user-one-corp model) or factions.linked_user_id = user.id
    -- (multi-faction-per-user model).
    IF v_corp.id <> v_user_id AND COALESCE(v_corp.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user_id THEN
        RAISE EXCEPTION 'You do not own this corporation';
    END IF;

    -- ── Current tick ──
    SELECT COALESCE(current_tick, 0) INTO v_current_tick
    FROM shard WHERE name = 'Alpha Shard';
    IF v_current_tick IS NULL THEN v_current_tick := 0; END IF;

    -- ── Cooldown check (any prior bankruptcy by this user in the last N ticks) ──
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

    -- ── Valuation (matches js/game/corp-valuation.js computeCorpValuation) ──
    -- Property: sum(purchase_price × condition/100)
    SELECT COALESCE(SUM(
        ROUND(COALESCE(purchase_price, 0) * COALESCE(condition, 0) / 100.0)
    ), 0) INTO v_prop_value
    FROM corp_properties WHERE faction_id = p_faction_id;

    -- Vessels: straight-line depreciation 5%/yr, floor 20% scrap; exclude
    -- for_sale listings. 12 ticks = 1 year.
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

    -- ── Repay active loans in origination order, up to the cap ──
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

    -- ── GDP_Growth shock: HQ −0.2, each subsidiary (regional_hq) nation −0.1 ──
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

    -- ── Expire open contracts (UPDATE not DELETE so history is preserved) ──
    UPDATE construction_contracts
    SET status = 'expired'
    WHERE issuer_faction_id = p_faction_id
      AND status IN ('open', 'bidding');

    -- ── Log the bankruptcy BEFORE deleting the faction ──
    -- (event_log.faction_id has no FK, so either order works; doing it first
    --  keeps the log readable if the delete ever grows a new constraint.)
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

    -- ── Finally, delete the faction. All corp-facing FKs cascade from here. ──
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
