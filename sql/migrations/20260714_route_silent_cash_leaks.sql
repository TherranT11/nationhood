-- ══════════════════════════════════════════════════════════════
-- Route the four silent-leak RPCs through emit_corp_cash_event
--
-- These RPCs each UPDATE factions.corp_cash_reserves directly without
-- logging a corp_cash_events row. Result: cash drops, the dashboard's
-- Revenue / Costs cards show $0 because the events ledger is empty,
-- and players see "where did my money go?" with no trail.
--
-- Affected RPCs (sorted by likely-frequency-of-leak):
--   * acknowledge_corp_contract_event  (Construction event resolutions
--                                       — often $1M+ each, common path)
--   * place_construction_bid           ($50k bid fee, runs frequently)
--   * fire_construction_action         (Construction Strategic Action,
--                                       $40M–$100M cost)
--   * fire_finance_action              (Finance Strategic Action,
--                                       $30M–$150M cost)
--
-- Fix: every cash debit now flows through emit_corp_cash_event so it
-- lands in the corp_cash_events ledger with a category + label, and
-- the dashboard's Costs & Wages / Cash drawer can attribute the drop.
--
-- All four RPCs target the OWNED corp (caller owns it via the existing
-- upstream auth.uid() ownership check), so emit_corp_cash_event is
-- reached via chained PERFORM inside SECURITY DEFINER — no GRANT or
-- ownership-bypass changes to the helper itself in this migration.
--
-- Idempotent: CREATE OR REPLACE on every function. Safe to re-run.
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- 1. place_construction_bid
-- ══════════════════════════════════════════════════════════════
-- Replace the $50k bid-fee UPDATE with PERFORM emit_corp_cash_event.
-- Hard cash gate at line 103 of the original guarantees full-fee
-- payment, so no clamp logic needed.
CREATE OR REPLACE FUNCTION place_construction_bid(
    p_contract_id        UUID,
    p_bidder_faction_id  UUID,
    p_crews_committed    INT,
    p_markup_pct         INT,
    p_bid_message        TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id   UUID := auth.uid();
    v_contract  corp_contracts%ROWTYPE;
    v_bidder    factions%ROWTYPE;
    v_req       JSONB;
    v_key       TEXT;
    v_threshold NUMERIC;
    v_value     NUMERIC;
    v_tick      INT;
    v_supply_mult NUMERIC;
    v_crew_mult NUMERIC;
    v_crew_time_mult NUMERIC;
    v_base_cost NUMERIC;
    v_bid_amount BIGINT;
    v_quoted_months INT;
    v_bid_fee CONSTANT BIGINT := 50000;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    SELECT * INTO v_bidder FROM factions WHERE id = p_bidder_faction_id;
    IF v_bidder.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bidder corporation not found');
    END IF;
    IF v_bidder.id <> v_user_id AND v_bidder.linked_user_id <> v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    IF v_bidder.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only corporations can bid');
    END IF;

    SELECT * INTO v_contract FROM corp_contracts WHERE id = p_contract_id;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract not found');
    END IF;
    IF v_contract.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Contract is not accepting bids');
    END IF;

    IF v_contract.required_sector IS NOT NULL
       AND v_contract.required_sector <> v_bidder.corp_sector THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Requires %s sector', v_contract.required_sector));
    END IF;
    IF p_crews_committed NOT IN (1, 2, 3) THEN
        RETURN jsonb_build_object('success', false, 'error', 'crews_committed must be 1, 2, or 3');
    END IF;
    IF p_markup_pct NOT IN (10, 20, 30, 40, 50) THEN
        RETURN jsonb_build_object('success', false, 'error', 'markup_pct must be one of 10/20/30/40/50');
    END IF;
    IF COALESCE(v_bidder.corp_work_crews, 0) < p_crews_committed THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient Work Crews — committed %s but you have %s',
                            p_crews_committed, v_bidder.corp_work_crews));
    END IF;

    v_req := COALESCE(v_contract.requirements, '{}'::jsonb);
    IF jsonb_typeof(v_req) = 'object' THEN
        FOR v_key IN SELECT jsonb_object_keys(v_req) LOOP
            v_threshold := (v_req ->> v_key)::numeric;
            v_value := CASE v_key
                WHEN 'work_crews'          THEN v_bidder.corp_work_crews
                WHEN 'regulatory_standing' THEN v_bidder.corp_regulatory_standing
                WHEN 'supply_chain'        THEN v_bidder.corp_supply_chain
                ELSE NULL
            END;
            IF v_value IS NULL OR v_value < v_threshold THEN
                RETURN jsonb_build_object('success', false,
                    'error', format('Requirement not met: %s ≥ %s', v_key, v_threshold));
            END IF;
        END LOOP;
    END IF;

    IF COALESCE(v_bidder.corp_cash_reserves, 0) < v_bid_fee THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Need $%s to place a bid', to_char(v_bid_fee, 'FM999,999,999')));
    END IF;

    v_supply_mult := 1.30 - (COALESCE(v_bidder.corp_supply_chain, 0) * 0.06);
    v_crew_mult := CASE p_crews_committed WHEN 1 THEN 1.00 WHEN 2 THEN 1.05 WHEN 3 THEN 1.10 END;
    v_crew_time_mult := CASE p_crews_committed WHEN 1 THEN 1.00 WHEN 2 THEN 0.80 WHEN 3 THEN 0.70 END;

    v_base_cost := v_contract.budget * 0.70;
    v_bid_amount := ROUND(v_base_cost * v_supply_mult * v_crew_mult * (1 + p_markup_pct::numeric / 100))::BIGINT;
    v_quoted_months := ROUND(v_contract.timeline_months * v_crew_time_mult)::INT;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- SSoT cash debit: writes corp_cash_events + adjusts corp_cash_reserves.
    PERFORM emit_corp_cash_event(
        p_bidder_faction_id,
        'capital_out',
        'Construction bid fee',
        -v_bid_fee,
        v_tick
    );

    INSERT INTO corp_contract_bids (
        contract_id, faction_id, nation_id, ap_spent,
        bid_amount, bid_message, created_at_tick,
        crews_committed, markup_pct, quoted_timeline_months
    ) VALUES (
        p_contract_id, p_bidder_faction_id, v_bidder.nation_id, 0,
        v_bid_amount, p_bid_message, v_tick,
        p_crews_committed, p_markup_pct, v_quoted_months
    )
    ON CONFLICT (contract_id, faction_id) DO UPDATE SET
        bid_amount             = EXCLUDED.bid_amount,
        bid_message            = EXCLUDED.bid_message,
        created_at_tick        = EXCLUDED.created_at_tick,
        crews_committed        = EXCLUDED.crews_committed,
        markup_pct             = EXCLUDED.markup_pct,
        quoted_timeline_months = EXCLUDED.quoted_timeline_months;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Bid placed',
        'bid_amount', v_bid_amount,
        'quoted_timeline_months', v_quoted_months,
        'crews_committed', p_crews_committed,
        'markup_pct', p_markup_pct,
        'bid_fee', v_bid_fee
    );
END;
$$;

GRANT EXECUTE ON FUNCTION place_construction_bid(UUID, UUID, INT, INT, TEXT) TO authenticated;


-- ══════════════════════════════════════════════════════════════
-- 2. fire_construction_action
-- ══════════════════════════════════════════════════════════════
-- Original UPDATE bundled cash-debit + stat changes + cooldown in one
-- atomic statement (race safety against double-fire). Split: stats +
-- cooldown still go in one UPDATE with the race-safety WHERE clause;
-- cash debit moves to emit_corp_cash_event after the UPDATE succeeds.
-- A concurrent fire would either (a) race past the WHERE clause and
-- get rejected by ROW_COUNT=0, or (b) be ordered by the row lock the
-- UPDATE acquires.
CREATE OR REPLACE FUNCTION fire_construction_action(
    p_corp_id    UUID,
    p_action_key TEXT,
    p_choice     TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id    UUID := auth.uid();
    v_corp       factions%ROWTYPE;
    v_tick       INT;
    v_cost       BIGINT;
    v_e_crews    NUMERIC;
    v_e_reg      NUMERIC;
    v_e_supply   NUMERIC;
    v_lock_ticks INT := 12;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Corporation not found');
    END IF;
    IF v_corp.id <> v_user_id AND v_corp.linked_user_id <> v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    IF v_corp.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only corporations can take Strategic Actions');
    END IF;
    IF v_corp.corp_sector IS DISTINCT FROM 'Construction' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Construction Strategic Actions only available to construction corps');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active shard');
    END IF;
    IF COALESCE(v_corp.corp_construction_action_locked_until_tick, 0) > v_tick THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Strategic Actions locked for %s more tick(s)',
                v_corp.corp_construction_action_locked_until_tick - v_tick),
            'locked_until_tick', v_corp.corp_construction_action_locked_until_tick
        );
    END IF;

    IF p_choice NOT IN ('A', 'B') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid choice (must be A or B)');
    END IF;

    SELECT cost, e_crews, e_reg, e_supply
      INTO v_cost, v_e_crews, v_e_reg, v_e_supply
    FROM (VALUES
        ('hiring',         'A',  40000000::BIGINT,  2.0,  0.0, -2.0),
        ('hiring',         'B',  70000000::BIGINT,  3.0,  1.0,  0.0),
        ('lobbying',       'A',  50000000::BIGINT, -2.0,  2.0,  0.0),
        ('lobbying',       'B',  80000000::BIGINT,  0.0,  3.0,  1.0),
        ('megaproject',    'A',  30000000::BIGINT,  0.0,  2.0, -2.0),
        ('megaproject',    'B',  90000000::BIGINT,  1.0,  3.0,  0.0),
        ('material',       'A',  40000000::BIGINT,  0.0, -2.0,  2.0),
        ('material',       'B',  70000000::BIGINT,  1.0,  0.0,  3.0),
        ('vertical',       'A',  60000000::BIGINT, -2.0,  0.0,  2.0),
        ('vertical',       'B', 100000000::BIGINT,  0.0,  1.0,  3.0),
        ('safety',         'A',  40000000::BIGINT, -2.0,  2.0,  0.0),
        ('safety',         'B',  80000000::BIGINT,  1.0,  3.0,  0.0),
        ('equipment',      'A',  50000000::BIGINT,  2.0,  0.0, -2.0),
        ('equipment',      'B',  90000000::BIGINT,  3.0,  0.0,  1.0),
        ('patriotic',      'A',  30000000::BIGINT, -2.0,  2.0,  0.0),
        ('patriotic',      'B',  60000000::BIGINT,  0.0,  3.0,  1.0),
        ('apprenticeship', 'A',  40000000::BIGINT,  2.0, -2.0,  0.0),
        ('apprenticeship', 'B',  80000000::BIGINT,  3.0,  1.0,  0.0),
        ('stockpile',      'A',  50000000::BIGINT, -2.0,  0.0,  2.0),
        ('stockpile',      'B',  90000000::BIGINT,  0.0,  1.0,  3.0)
    ) AS defs(key, choice, cost, e_crews, e_reg, e_supply)
    WHERE key = p_action_key AND choice = p_choice;

    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unknown action / choice');
    END IF;

    IF COALESCE(v_corp.corp_cash_reserves, 0) < v_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient cash — need $%sM, have $%sM',
                (v_cost / 1000000)::TEXT,
                (COALESCE(v_corp.corp_cash_reserves, 0) / 1000000)::TEXT)
        );
    END IF;

    -- Stats + cooldown: atomic UPDATE with race-safety WHERE clause. Two
    -- concurrent fires can't both pass the cooldown gate; the loser sees
    -- ROW_COUNT = 0 and returns an error before the cash debit fires.
    UPDATE factions
    SET corp_work_crews = LEAST(GREATEST(COALESCE(corp_work_crews, 0) + v_e_crews, 0::numeric), 10::numeric),
        corp_regulatory_standing = LEAST(GREATEST(COALESCE(corp_regulatory_standing, 0) + v_e_reg, 0::numeric), 10::numeric),
        corp_supply_chain = LEAST(GREATEST(COALESCE(corp_supply_chain, 0) + v_e_supply, 0::numeric), 10::numeric),
        corp_construction_action_locked_until_tick = v_tick + v_lock_ticks
    WHERE id = p_corp_id
      AND COALESCE(corp_construction_action_locked_until_tick, 0) <= v_tick
      AND COALESCE(corp_cash_reserves, 0) >= v_cost;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Action raced — cooldown engaged or cash dropped after the pre-check; try again'
        );
    END IF;

    -- SSoT cash debit. Reaches here only after the UPDATE secured the
    -- cooldown, so a concurrent caller that passed its pre-check won't
    -- get past the UPDATE's race-safety WHERE.
    PERFORM emit_corp_cash_event(
        p_corp_id,
        'event_cost',
        format('Construction Strategic Action: %s (%s)', p_action_key, p_choice),
        -v_cost,
        v_tick
    );

    RETURN jsonb_build_object(
        'success', true,
        'cost', v_cost,
        'effects', jsonb_build_object(
            'crews',      v_e_crews,
            'regulatory', v_e_reg,
            'supply',     v_e_supply
        ),
        'locked_until_tick', v_tick + v_lock_ticks
    );
END;
$$;

GRANT EXECUTE ON FUNCTION fire_construction_action(UUID, TEXT, TEXT) TO authenticated;


-- ══════════════════════════════════════════════════════════════
-- 3. fire_finance_action
-- ══════════════════════════════════════════════════════════════
-- Same race-safe split as fire_construction_action: stats + cooldown
-- in the atomic UPDATE, cash debit via emit_corp_cash_event after.
CREATE OR REPLACE FUNCTION fire_finance_action(
    p_corp_id    UUID,
    p_action_key TEXT,
    p_choice     TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user_id    UUID := auth.uid();
    v_corp       factions%ROWTYPE;
    v_tick       INT;
    v_cost       BIGINT;
    v_e_lending  NUMERIC;
    v_e_rates    NUMERIC;
    v_e_over     NUMERIC;
    v_lock_ticks INT := 12;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Corporation not found');
    END IF;
    IF v_corp.id <> v_user_id AND v_corp.linked_user_id IS DISTINCT FROM v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    IF v_corp.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only corporations can take Strategic Actions');
    END IF;
    IF v_corp.corp_sector IS DISTINCT FROM 'Finance' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Finance Strategic Actions only available to Finance corps');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active shard');
    END IF;
    IF COALESCE(v_corp.corp_finance_action_locked_until_tick, 0) > v_tick THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Strategic Actions locked for %s more tick(s)',
                v_corp.corp_finance_action_locked_until_tick - v_tick),
            'locked_until_tick', v_corp.corp_finance_action_locked_until_tick
        );
    END IF;

    IF p_choice NOT IN ('A', 'B') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid choice (must be A or B)');
    END IF;

    SELECT cost, e_lending, e_rates, e_over
      INTO v_cost, v_e_lending, v_e_rates, v_e_over
    FROM (VALUES
        ('capital_raise',       'A',  60000000::BIGINT,  2.0,  0.0,  2.0),
        ('capital_raise',       'B', 150000000::BIGINT,  3.0,  0.0, -1.0),
        ('aggressive_lending',  'A',  40000000::BIGINT, -1.0,  0.0,  2.0),
        ('aggressive_lending',  'B',  70000000::BIGINT, -2.0, -1.0,  0.0),
        ('rate_hike',           'A',  30000000::BIGINT, -2.0,  2.0,  0.0),
        ('rate_hike',           'B',  70000000::BIGINT,  1.0,  3.0,  0.0),
        ('rate_cut',            'A',  40000000::BIGINT, -2.0, -2.0,  1.0),
        ('rate_cut',            'B',  80000000::BIGINT, -3.0, -3.0,  0.0),
        ('reserve_building',    'A',  50000000::BIGINT, -2.0,  0.0, -2.0),
        ('reserve_building',    'B',  90000000::BIGINT,  0.0,  1.0, -3.0),
        ('high_yield',          'A',  50000000::BIGINT,  2.0,  0.0,  3.0),
        ('high_yield',          'B', 100000000::BIGINT,  3.0,  0.0,  1.0),
        ('deposit_drive',       'A',  40000000::BIGINT,  2.0, -2.0,  0.0),
        ('deposit_drive',       'B',  80000000::BIGINT,  3.0,  1.0,  0.0),
        ('loan_restructuring',  'A',  60000000::BIGINT, -1.0,  0.0, -1.0),
        ('loan_restructuring',  'B',  90000000::BIGINT,  0.0,  1.0, -3.0),
        ('foreign_capital',     'A',  30000000::BIGINT,  2.0,  1.0,  2.0),
        ('foreign_capital',     'B',  80000000::BIGINT,  3.0,  0.0, -1.0),
        ('central_bank',        'A',  65000000::BIGINT, -2.0,  0.0, -2.0),
        ('central_bank',        'B',  80000000::BIGINT,  1.0,  0.0, -3.0)
    ) AS defs(key, choice, cost, e_lending, e_rates, e_over)
    WHERE key = p_action_key AND choice = p_choice;

    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unknown action / choice');
    END IF;

    IF COALESCE(v_corp.corp_cash_reserves, 0) < v_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient cash — need $%sM, have $%sM',
                (v_cost / 1000000)::TEXT,
                (COALESCE(v_corp.corp_cash_reserves, 0) / 1000000)::TEXT)
        );
    END IF;

    -- Stats + cooldown atomic UPDATE with the same race-safety WHERE
    -- the original used. Cash debit moves to emit_corp_cash_event below;
    -- the WHERE still re-checks corp_cash_reserves >= v_cost so a
    -- concurrent action can't squeeze through past the row lock.
    UPDATE factions
    SET corp_lending_capital_max                = LEAST(GREATEST(
                                                      COALESCE(corp_lending_capital_max, 5) + v_e_lending,
                                                      0::numeric), 10::numeric),
        corp_interest_rates                     = LEAST(GREATEST(
                                                      COALESCE(corp_interest_rates, 0) + v_e_rates,
                                                      0::numeric), 10::numeric),
        corp_overleverage_offset                = LEAST(GREATEST(
                                                      COALESCE(corp_overleverage_offset, 0) + v_e_over,
                                                      -10::numeric), 10::numeric),
        corp_finance_action_locked_until_tick   = v_tick + v_lock_ticks
    WHERE id = p_corp_id
      AND COALESCE(corp_finance_action_locked_until_tick, 0) <= v_tick
      AND COALESCE(corp_cash_reserves, 0) >= v_cost;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Action raced — cooldown engaged or cash dropped after the pre-check; try again'
        );
    END IF;

    -- SSoT cash debit.
    PERFORM emit_corp_cash_event(
        p_corp_id,
        'event_cost',
        format('Finance Strategic Action: %s (%s)', p_action_key, p_choice),
        -v_cost,
        v_tick
    );

    PERFORM recompute_finance_stats(p_corp_id);

    RETURN jsonb_build_object(
        'success', true,
        'cost', v_cost,
        'effects', jsonb_build_object(
            'lending', v_e_lending,
            'rates',   v_e_rates,
            'over',    v_e_over
        ),
        'locked_until_tick', v_tick + v_lock_ticks
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION fire_finance_action(UUID, TEXT, TEXT) TO authenticated;


-- ══════════════════════════════════════════════════════════════
-- 4. acknowledge_corp_contract_event
-- ══════════════════════════════════════════════════════════════
-- Acknowledge mode allows partial payment if the corp is short on
-- cash (the player isn't blocked from resolving). To keep the events
-- ledger accurate, lock the row, read available cash, debit
-- LEAST(available, cost) so the logged delta matches the actual
-- corp_cash_reserves change.
CREATE OR REPLACE FUNCTION acknowledge_corp_contract_event(
    p_event_id      UUID,
    p_response_key  TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
    v_user            UUID := auth.uid();
    v_event           corp_contract_events%ROWTYPE;
    v_corp            factions%ROWTYPE;
    v_tick            INT;
    v_response        JSONB;
    v_resp_arr        JSONB;
    v_resp_count      INT;
    v_picked_key      TEXT;
    v_cost            BIGINT;
    v_delay           INT;
    v_updated_count   INT;
    v_available       NUMERIC;
    v_actual_debit    BIGINT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_event FROM corp_contract_events WHERE id = p_event_id;
    IF v_event.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event not found');
    END IF;
    IF v_event.status <> 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Event is %s; cannot acknowledge', v_event.status));
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_event.faction_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event corp not found');
    END IF;
    IF v_corp.id <> v_user AND v_corp.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;

    v_resp_arr := COALESCE(v_event.responses, '[]'::JSONB);
    v_resp_count := jsonb_array_length(v_resp_arr);
    IF v_resp_count = 0 THEN
        v_response := jsonb_build_object('key', 'auto', 'cost', 0, 'delay', 0);
    ELSIF p_response_key IS NOT NULL THEN
        v_response := NULL;
        FOR i IN 0 .. v_resp_count - 1 LOOP
            IF (v_resp_arr -> i) ->> 'key' = p_response_key THEN
                v_response := v_resp_arr -> i;
                EXIT;
            END IF;
        END LOOP;
        IF v_response IS NULL THEN
            v_response := v_resp_arr -> 0;
        END IF;
    ELSE
        v_response := v_resp_arr -> 0;
    END IF;

    v_picked_key := COALESCE(v_response ->> 'key', 'auto');
    v_cost  := COALESCE((v_response ->> 'cost')::BIGINT, 0);
    v_delay := COALESCE((v_response ->> 'delay')::INT, 0);

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Optimistic lock on status='ACTIVE' so a double-click can't apply
    -- the effect twice.
    UPDATE corp_contract_events
       SET status            = 'RESOLVED',
           resolved_at_tick  = v_tick,
           resolution_choice = v_picked_key,
           updated_at        = now()
     WHERE id     = p_event_id
       AND status = 'ACTIVE';
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count = 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Event already resolved or expired');
    END IF;

    -- Apply cost via the SSoT helper. Acknowledge mode lets the corp
    -- pay LESS than the sticker if cash is short — read the available
    -- cash under a row lock, debit min(available, cost), so the events
    -- ledger records the actual debit not the sticker. Helper's own
    -- GREATEST(0, ...) clamp would record the full -v_cost even if
    -- cash floored at 0; we want the logged delta to match the real
    -- corp_cash_reserves change.
    IF v_cost > 0 AND v_event.faction_id IS NOT NULL THEN
        SELECT COALESCE(corp_cash_reserves, 0) INTO v_available
          FROM factions
         WHERE id = v_event.faction_id
         FOR UPDATE;
        v_actual_debit := LEAST(v_available, v_cost::NUMERIC)::BIGINT;
        IF v_actual_debit > 0 THEN
            PERFORM emit_corp_cash_event(
                v_event.faction_id,
                'event_cost',
                'Contract event: ' || COALESCE(v_event.event_key, v_picked_key),
                -v_actual_debit,
                v_tick
            );
        END IF;
    END IF;

    IF v_delay > 0 THEN
        UPDATE corp_contracts
           SET expected_finish_tick = COALESCE(expected_finish_tick, 0) + v_delay
         WHERE id = v_event.contract_id;
    END IF;

    RETURN jsonb_build_object(
        'success',          true,
        'event_id',         p_event_id,
        'resolution_choice',v_picked_key,
        'cost_applied',     v_cost,
        'delay_applied',    v_delay
    );
END;
$func$;

GRANT EXECUTE ON FUNCTION acknowledge_corp_contract_event(UUID, TEXT) TO authenticated;


NOTIFY pgrst, 'reload schema';
