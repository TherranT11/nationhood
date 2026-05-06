-- 20260916_sports_action_rpcs.sql
--
-- AUDIT FIX: Sports Minister actions were broken in production.
--
-- The 2026-05 design change repointed Invest in National Sports Culture
-- and Expand Stadium Infrastructure to deduct from nations.budget
-- instead of ministries.discretionary_balance. The previous discretionary
-- path worked because ministries has permissive RLS; the new path hits
-- nations.update + corp_contracts.insert + ministry_action_log.insert,
-- all of which deny authenticated users (admin/service-role only).
-- Result: clicking either action did nothing for non-admin players.
--
-- Fix: wrap both flows in SECURITY DEFINER RPCs. Each RPC validates
-- caller = active sports minister of the nation, then performs every
-- write atomically.
--
-- Atomic budget deduction (UPDATE ... SET budget = budget - $) also
-- closes a small two-tab race the JS-side read-modify-write had —
-- two concurrent calls now correctly debit twice instead of overwriting.

BEGIN;

-- ── invest_in_vola_culture ─────────────────────────────────────────
-- Three tiers; cost in abstract dollars (matches nation.budget scale).
-- Negative budget allowed — the per-tick balance math sweeps the
-- shortfall into debt next tick via processNationDebtTick.
CREATE OR REPLACE FUNCTION invest_in_vola_culture(p_level TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller    UUID := auth.uid();
    v_cost      INT;
    v_gain      INT;
    v_label     TEXT;
    v_ministry  ministries%ROWTYPE;
    v_nation_id UUID;
    v_tick      INT;
    v_last_log  RECORD;
    v_prev_culture NUMERIC;
    v_new_culture  NUMERIC;
    v_prev_budget  NUMERIC;
    v_new_budget   NUMERIC;
BEGIN
    -- Tier table — mirrors VOLA_INVESTMENT_LEVELS in
    -- js/game/political-actions.js. Keep the two in sync if values
    -- ever change.
    IF p_level = 'low' THEN
        v_cost := 2; v_gain := 3; v_label := 'Low Investment';
    ELSIF p_level = 'moderate' THEN
        v_cost := 5; v_gain := 5; v_label := 'Moderate Investment';
    ELSIF p_level = 'high' THEN
        v_cost := 8; v_gain := 7; v_label := 'High Investment';
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_level');
    END IF;

    -- Active sports minister gate (caller must own the seat).
    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'sports' AND is_active = true
          AND (party_id = v_caller OR EXISTS (
              SELECT 1 FROM factions f
              WHERE f.id = ministries.party_id
                AND (f.id = v_caller OR f.linked_user_id = v_caller)
          ))
        ORDER BY created_at DESC LIMIT 1;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_minister');
    END IF;
    v_nation_id := v_ministry.nation_id;

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
    SELECT budget, national_vola_culture INTO v_prev_budget, v_prev_culture
      FROM nations WHERE id = v_nation_id FOR UPDATE;
    v_new_budget  := COALESCE(v_prev_budget, 0) - v_cost;
    v_new_culture := LEAST(100, ROUND(((COALESCE(v_prev_culture, 0)) + v_gain) * 10) / 10.0);

    UPDATE nations
       SET budget                = v_new_budget,
           national_vola_culture = v_new_culture
     WHERE id = v_nation_id;

    -- Log + cooldown.
    INSERT INTO ministry_action_log (
        nation_id, ministry_key, action_key, faction_id,
        ap_cost, money_cost, applied_at_tick, cooldown_until_tick, action_data
    ) VALUES (
        v_nation_id, 'sports', 'invest_in_sports_culture', v_ministry.party_id,
        0, v_cost, v_tick, v_tick + 1,
        jsonb_build_object(
            'level', p_level, 'gain', v_gain,
            'prevCulture', v_prev_culture, 'newCulture', v_new_culture,
            'prevBudget', v_prev_budget, 'newBudget', v_new_budget
        )
    );

    RETURN jsonb_build_object(
        'success',     true,
        'level',       p_level,
        'gain',        v_gain,
        'cost',        v_cost,
        'newCulture',  v_new_culture,
        'newBudget',   v_new_budget
    );
END;
$$;

GRANT EXECUTE ON FUNCTION invest_in_vola_culture(TEXT) TO authenticated;

-- ── post_stadium_contract ─────────────────────────────────────────
-- Posts a Construction-sector contract. Validates one-open-bid-per-
-- nation, deducts posting cost from nation.budget, INSERTs the
-- corp_contracts row.
CREATE OR REPLACE FUNCTION post_stadium_contract(
    p_size          TEXT,
    p_stadium_name  TEXT,
    p_team_name     TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller        UUID := auth.uid();
    v_post_cost     INT;
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
BEGIN
    -- Tier table — mirrors VOLA_STADIUM_TIERS in
    -- js/game/political-actions.js.
    IF p_size = 'small' THEN
        v_post_cost := 3;  v_budget_target := 60000000;
        v_timeline  := 24; v_spec_cat := 'Light Infrastructure';
    ELSIF p_size = 'modest' THEN
        v_post_cost := 7;  v_budget_target := 140000000;
        v_timeline  := 36; v_spec_cat := 'Heavy Infrastructure';
    ELSIF p_size = 'extravagant' THEN
        v_post_cost := 10; v_budget_target := 450000000;
        v_timeline  := 60; v_spec_cat := 'Megaproject';
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- One-open-stadium-bid-per-nation gate.
    SELECT id INTO v_existing FROM corp_contracts
        WHERE issuer_nation_id = v_nation_id
          AND project_subtype  = 'Vola Stadium'
          AND status           = 'open'
        LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_open');
    END IF;

    -- Deduct posting cost atomically.
    UPDATE nations SET budget = COALESCE(budget, 0) - v_post_cost
        WHERE id = v_nation_id;

    -- Generate contract number (lightweight — collisions unlikely).
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

COMMENT ON FUNCTION invest_in_vola_culture(TEXT) IS
  'Sports Minister invests in National Sports Culture. Deducts cost from nation.budget (negative allowed), bumps national_vola_culture, logs to ministry_action_log with 1-tick cooldown. SECURITY DEFINER bypasses the admin-only RLS on nations.';
COMMENT ON FUNCTION post_stadium_contract(TEXT, TEXT, TEXT) IS
  'Sports Minister posts a stadium construction contract. Deducts posting cost from nation.budget, INSERTs a corp_contracts row corps can bid on. SECURITY DEFINER bypasses RLS on both tables.';

NOTIFY pgrst, 'reload schema';

COMMIT;
