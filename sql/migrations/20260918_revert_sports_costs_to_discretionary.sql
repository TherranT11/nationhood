-- 20260918_revert_sports_costs_to_discretionary.sql
--
-- Design clarification: the 2026-05 "pull from Budget" change was
-- wrong. Sports Minister actions ALWAYS pull from the Sports Ministry's
-- discretionary budget. The funding-article mechanism is what draws
-- against nations.budget to top up that ministry's discretionary pool.
--
-- Reverts:
--   - invest_in_vola_culture: deduct from ministries.discretionary_balance
--     (raw dollars, $2M / $5M / $8M); gate on balance >= cost
--   - post_stadium_contract: deduct from ministries.discretionary_balance
--     (raw dollars, $3M / $7M / $10M); gate on balance >= cost
--   - cancel_stadium_contract: refund to ministries.discretionary_balance
--     (was changed in 20260915 to refund nation.budget — reverted here)
--
-- Cost amounts back to raw dollars (millions). Display labels in the
-- UI continue to drop the M suffix per user preference ($2 / $5 / $8
-- visible, $2M / $5M / $8M deducted).

BEGIN;

-- ── invest_in_vola_culture (revert to discretionary) ──────────────────
CREATE OR REPLACE FUNCTION invest_in_vola_culture(p_level TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller       UUID := auth.uid();
    v_cost         BIGINT;
    v_gain         INT;
    v_ministry     ministries%ROWTYPE;
    v_nation_id    UUID;
    v_tick         INT;
    v_last_log     RECORD;
    v_prev_culture NUMERIC;
    v_new_culture  NUMERIC;
    v_balance      NUMERIC;
    v_new_balance  NUMERIC;
BEGIN
    -- Tier table — raw dollars (millions). Mirrors VOLA_INVESTMENT_LEVELS
    -- in js/game/political-actions.js.
    IF p_level = 'low' THEN
        v_cost := 2000000; v_gain := 3;
    ELSIF p_level = 'moderate' THEN
        v_cost := 5000000; v_gain := 5;
    ELSIF p_level = 'high' THEN
        v_cost := 8000000; v_gain := 7;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_level');
    END IF;

    -- Active sports minister gate (caller must own the seat).
    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'sports' AND is_active = true
          AND EXISTS (
              SELECT 1 FROM factions f
              WHERE f.id = ministries.party_id
                AND (f.id = v_caller OR f.linked_user_id = v_caller)
          )
        ORDER BY created_at DESC LIMIT 1;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_minister');
    END IF;
    v_nation_id := v_ministry.nation_id;
    v_balance := COALESCE(v_ministry.discretionary_balance, 0);

    IF v_balance < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_balance',
            'balance', v_balance, 'cost', v_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- Cooldown check: 1 tick.
    SELECT cooldown_until_tick INTO v_last_log
      FROM ministry_action_log
     WHERE nation_id    = v_nation_id
       AND ministry_key = 'sports'
       AND action_key   = 'invest_in_sports_culture'
     ORDER BY applied_at_tick DESC LIMIT 1;
    IF v_last_log.cooldown_until_tick IS NOT NULL AND v_last_log.cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_last_log.cooldown_until_tick);
    END IF;

    -- Atomic deduction + culture bump (clamped 0..100).
    SELECT national_vola_culture INTO v_prev_culture
      FROM nations WHERE id = v_nation_id FOR UPDATE;
    v_new_balance := v_balance - v_cost;
    v_new_culture := LEAST(100, ROUND(((COALESCE(v_prev_culture, 0)) + v_gain) * 10) / 10.0);

    UPDATE ministries SET discretionary_balance = v_new_balance
        WHERE id = v_ministry.id;
    UPDATE nations SET national_vola_culture = v_new_culture
        WHERE id = v_nation_id;

    INSERT INTO ministry_action_log (
        nation_id, ministry_key, action_key, faction_id,
        ap_cost, money_cost, applied_at_tick, cooldown_until_tick, action_data
    ) VALUES (
        v_nation_id, 'sports', 'invest_in_sports_culture', v_ministry.party_id,
        0, v_cost, v_tick, v_tick + 1,
        jsonb_build_object(
            'level', p_level, 'gain', v_gain,
            'prevCulture', v_prev_culture, 'newCulture', v_new_culture,
            'prevBalance', v_balance, 'newBalance', v_new_balance
        )
    );

    RETURN jsonb_build_object(
        'success',     true,
        'level',       p_level,
        'gain',        v_gain,
        'cost',        v_cost,
        'newCulture',  v_new_culture,
        'newBalance',  v_new_balance
    );
END;
$$;

GRANT EXECUTE ON FUNCTION invest_in_vola_culture(TEXT) TO authenticated;

-- ── post_stadium_contract (revert to discretionary) ───────────────────
CREATE OR REPLACE FUNCTION post_stadium_contract(
    p_size          TEXT,
    p_stadium_name  TEXT,
    p_team_name     TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller        UUID := auth.uid();
    v_post_cost     BIGINT;
    v_budget_target BIGINT;
    v_timeline      INT;
    v_spec_cat      TEXT;
    v_ministry      ministries%ROWTYPE;
    v_nation_id     UUID;
    v_tick          INT;
    v_existing      UUID;
    v_contract_id   UUID;
    v_contract_no   TEXT;
    v_year          INT;
    v_balance       NUMERIC;
BEGIN
    IF p_size = 'small' THEN
        v_post_cost := 3000000;  v_budget_target := 60000000;
        v_timeline  := 24;       v_spec_cat := 'Light Infrastructure';
    ELSIF p_size = 'modest' THEN
        v_post_cost := 7000000;  v_budget_target := 140000000;
        v_timeline  := 36;       v_spec_cat := 'Heavy Infrastructure';
    ELSIF p_size = 'extravagant' THEN
        v_post_cost := 10000000; v_budget_target := 450000000;
        v_timeline  := 60;       v_spec_cat := 'Megaproject';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_size');
    END IF;

    IF p_stadium_name IS NULL OR length(trim(p_stadium_name)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_stadium_name');
    END IF;

    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'sports' AND is_active = true
          AND EXISTS (
              SELECT 1 FROM factions f
              WHERE f.id = ministries.party_id
                AND (f.id = v_caller OR f.linked_user_id = v_caller)
          )
        ORDER BY created_at DESC LIMIT 1;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_minister');
    END IF;
    v_nation_id := v_ministry.nation_id;
    v_balance := COALESCE(v_ministry.discretionary_balance, 0);

    IF v_balance < v_post_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_balance',
            'balance', v_balance, 'cost', v_post_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    SELECT id INTO v_existing FROM corp_contracts
        WHERE issuer_nation_id = v_nation_id
          AND project_subtype  = 'Vola Stadium'
          AND status           = 'open'
        LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_open');
    END IF;

    UPDATE ministries SET discretionary_balance = v_balance - v_post_cost
        WHERE id = v_ministry.id;

    v_year := 2000 + (v_tick / 12);
    v_contract_no := 'GOV-' || v_year::TEXT || '-' ||
                     lpad((floor(random() * 1000)::INT)::TEXT, 3, '0');

    INSERT INTO corp_contracts (
        contract_number, name, description,
        contract_type,   issuer_name,        issuer_faction_id, issuer_nation_id,
        required_sector, spec_category,      budget,            timeline_months,
        project_type,    project_subtype,    status,
        created_at_tick, expires_at_tick
    ) VALUES (
        v_contract_no,   trim(p_stadium_name),
        CASE WHEN p_team_name IS NULL OR length(trim(p_team_name)) = 0
             THEN 'Vola Stadium'
             ELSE 'Home of: ' || trim(p_team_name) END,
        'GOVERNMENT',    'Ministry of Sports', NULL,            v_nation_id,
        'Construction',  v_spec_cat,           v_budget_target, v_timeline,
        'Civil Engineering', 'Vola Stadium',   'open',
        v_tick,          v_tick + 6
    ) RETURNING id INTO v_contract_id;

    RETURN jsonb_build_object(
        'success',      true,
        'contract_id',  v_contract_id,
        'tier',         p_size,
        'cost',         v_post_cost
    );
END;
$$;

GRANT EXECUTE ON FUNCTION post_stadium_contract(TEXT, TEXT, TEXT) TO authenticated;

-- ── cancel_stadium_contract (refund to discretionary) ────────────────
CREATE OR REPLACE FUNCTION cancel_stadium_contract(p_contract_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller         UUID := auth.uid();
    v_contract       corp_contracts%ROWTYPE;
    v_refund_amount  BIGINT := 0;
BEGIN
    SELECT * INTO v_contract FROM corp_contracts WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract is no longer open');
    END IF;
    IF v_contract.project_subtype <> 'Vola Stadium' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not a stadium contract');
    END IF;
    IF v_caller IS NOT NULL AND NOT _is_active_sports_minister(v_contract.issuer_nation_id, v_caller) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the Sports Minister can cancel this contract');
    END IF;

    -- Refund mapping mirrors VOLA_STADIUM_TIERS.postingCost (raw dollars).
    v_refund_amount := CASE v_contract.spec_category
        WHEN 'Light Infrastructure' THEN 3000000
        WHEN 'Heavy Infrastructure' THEN 7000000
        WHEN 'Megaproject'          THEN 10000000
        ELSE 0
    END;

    UPDATE corp_contracts SET status = 'cancelled' WHERE id = p_contract_id;

    UPDATE corp_contract_bids
       SET status = 'rejected'
     WHERE contract_id = p_contract_id AND status = 'pending';

    -- Refund to the active sports ministry's discretionary balance.
    IF v_refund_amount > 0 THEN
        UPDATE ministries
           SET discretionary_balance = COALESCE(discretionary_balance, 0) + v_refund_amount
         WHERE nation_id    = v_contract.issuer_nation_id
           AND ministry_key = 'sports'
           AND is_active    = true;
    END IF;

    RETURN jsonb_build_object('success', true, 'refund_amount', v_refund_amount);
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_stadium_contract(UUID) TO authenticated;

COMMENT ON FUNCTION invest_in_vola_culture(TEXT) IS
  'Sports Minister invests in National Sports Culture. Deducts cost from ministries.discretionary_balance (gated on balance >= cost), bumps national_vola_culture, logs to ministry_action_log with 1-tick cooldown.';
COMMENT ON FUNCTION post_stadium_contract(TEXT, TEXT, TEXT) IS
  'Sports Minister posts a stadium construction contract. Deducts posting cost from ministries.discretionary_balance, INSERTs a corp_contracts row corps can bid on.';
COMMENT ON FUNCTION cancel_stadium_contract(UUID) IS
  'Sports Minister cancels an open stadium contract. Refunds the raw-dollar posting cost to ministries.discretionary_balance and rejects any pending bids.';

NOTIFY pgrst, 'reload schema';

COMMIT;
