-- ════════════════════════════════════════════════════════════════════
-- 20270946 — Corp executive actions bank up to 3 (was 1 per tick)
--
-- exec_action_tick was a single "used this tick" stamp: a corp had 1 action
-- if currentTick > exec_action_tick, and spending set it to the current tick.
-- This re-reads it as a "consumed-through" pointer so a corp now BANKS +1
-- action per tick up to a max of 3, spending one at a time.
--
-- The trick: available = LEAST(3, tick - exec_action_tick). The reject
-- condition is mathematically UNCHANGED — exec_action_tick >= tick still
-- means 0 available — so every RPC gate is left exactly as it was. Only the
-- SPEND changes, from `exec_action_tick = v_tick` to a call to the shared
-- helper _corp_exec_spend(), which advances the pointer by one credit. The
-- cap of 3 lives in that one helper; no new column, no per-tick accrual job
-- (the bank is derived from the gap, so idle ticks accrue implicitly).
--
-- The 18 corp action RPCs below are re-emitted VERBATIM from their latest
-- definitions with only the spend line re-pointed (generated, not hand-typed).
-- The client mirrors the same LEAST(3, …) for the "N of 3 remaining" badge.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Advance the consumed-through pointer by one executive-action credit.
-- available = GREATEST(0, LEAST(3, tick - COALESCE(exec_action_tick,-1)));
-- after the spend, available is one lower. Called only when the gate has
-- already confirmed >=1 available, so this never grants a free action.
CREATE OR REPLACE FUNCTION public._corp_exec_spend(p_exec_action_tick int, p_tick int)
RETURNS int
LANGUAGE sql IMMUTABLE AS $$
    SELECT p_tick - GREATEST(0, LEAST(3, p_tick - COALESCE(p_exec_action_tick, -1))) + 1;
$$;
REVOKE EXECUTE ON FUNCTION public._corp_exec_spend(int, int) FROM PUBLIC;

-- ── advance_build (from 20270888_operating_expenses_deductible.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.advance_build(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
    v_tick  int;
    v_count int;
    v_cost  bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the per-tick allowance check below must
    -- serialize against a concurrent executive action.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT COUNT(*) INTO v_count FROM corp_construction_projects
     WHERE corp_id = p_corp_id AND status = 'building';
    IF v_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_active_projects');
    END IF;

    v_cost := v_count * 10000;
    IF FLOOR(COALESCE(v_corp.treasury_cash, 0)) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_cost,
           exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick)
     WHERE id = p_corp_id;

    -- Operating expense → the tax-deductible accumulator (20270888).
    PERFORM _corp_log_expense(p_corp_id, v_cost);

    UPDATE corp_construction_projects
       SET completes_at_tick = completes_at_tick - 1
     WHERE corp_id = p_corp_id AND status = 'building';

    -- Anything pushed to due completes NOW through the canonical
    -- sweep — same payout, revenue stamp, and tier city effects the
    -- tick engine applies.
    PERFORM complete_construction_projects(v_tick);

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Advance Build — pushed %s job site(s) forward ($%s).', v_count, v_cost));
    RETURN jsonb_build_object(
        'success',  true,
        'advanced', v_count,
        'cost',     v_cost
    );
END $$;

-- ── analyze_vehicle_market (from 20270852_corp_history_ledger.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.analyze_vehicle_market(
    p_corp_id      uuid,
    p_vehicle_type text,
    p_nation_id    uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_nation  nations%ROWTYPE;
    v_tick    int;
    v_share   numeric;
    v_demand  numeric;
    v_aff     numeric;
    v_w       numeric[];
    v_total   numeric;
    v_classes jsonb := '[]'::jsonb;
    v_names   text[] := ARRAY['economy', 'mid_range', 'premium', 'luxury', 'ultra_luxury'];
    v_sale    bigint;
    i         int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_vehicle_type NOT IN ('coupe', 'sedan', 'pickup', 'motorcycle', 'sports_car') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the allowance spend below must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    -- Home turf by default; a Quality & Data Center at Level III+
    -- (20270842) unlocks analyzing another nation.
    IF p_nation_id IS NOT NULL AND p_nation_id <> v_corp.hq_nation_id
       AND COALESCE(v_corp.data_center_tier, 1) < 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'data_center_too_small');
    END IF;
    SELECT * INTO v_nation FROM nations
     WHERE id = COALESCE(p_nation_id, v_corp.hq_nation_id)
       AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Monthly demand: population ÷ 100k × the type's market share,
    -- class weights from affluence — both via the 20270839 helpers
    -- shared with run_sales_campaign.
    v_share := vehicle_type_share(p_vehicle_type);
    v_demand := vehicle_type_monthly_demand(v_nation.population, p_vehicle_type);

    v_aff := (GREATEST(1, COALESCE(v_nation.standard_of_living, 50))
              + GREATEST(1, COALESCE(v_nation.wages, 50))) / 2.0;
    v_w := ARRAY[
        vehicle_class_weight('economy',      v_aff),
        vehicle_class_weight('mid_range',    v_aff),
        vehicle_class_weight('premium',      v_aff),
        vehicle_class_weight('luxury',       v_aff),
        vehicle_class_weight('ultra_luxury', v_aff)
    ];
    v_total := v_w[1] + v_w[2] + v_w[3] + v_w[4] + v_w[5];

    FOR i IN 1..5 LOOP
        v_classes := v_classes || jsonb_build_array(jsonb_build_object(
            'class',         v_names[i],
            'desire_pct',    ROUND(v_w[i] / v_total * 100),
            'monthly_units', ROUND(v_demand * v_w[i] / v_total)));
    END LOOP;

    -- The showroom: every unit of this type sitting in the inventory
    -- of a corp headquartered in the nation.
    SELECT COALESCE(SUM(vb.units_in_stock), 0)
           + COALESCE((SELECT SUM(ms.units) FROM vehicle_market_stock ms
                         JOIN vehicle_blueprints mb ON mb.id = ms.blueprint_id
                        WHERE ms.nation_id = v_nation.id
                          AND mb.vehicle_type = p_vehicle_type), 0)
      INTO v_sale
      FROM vehicle_blueprints vb
      JOIN entrepreneur_corps ec ON ec.id = vb.corp_id
     WHERE ec.hq_nation_id = v_nation.id
       AND vb.vehicle_type = p_vehicle_type;

    -- The analysis is the day's executive action.
    UPDATE entrepreneur_corps SET exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick) WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Analyzed the %s market in %s.', replace(p_vehicle_type, '_', ' '), v_nation.name));
    RETURN jsonb_build_object(
        'success',        true,
        'nation',         v_nation.name,
        'vehicle_type',   p_vehicle_type,
        'monthly_demand', ROUND(v_demand),
        'affluence',      ROUND(v_aff),
        'classes',        v_classes,
        'for_sale_units', v_sale
    );
END $$;

-- ── bank_issue_loan (from 20270894_corp_credit_market.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.bank_issue_loan(
    p_offer_id     uuid,
    p_bank_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_bank     entrepreneur_corps%ROWTYPE;
    v_borrower entrepreneur_corps%ROWTYPE;
    v_offer    corp_bank_loan_offers%ROWTYPE;
    v_fac      factions%ROWTYPE;
    v_tick     int;
    v_loan_id  uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_offer_id IS NULL OR p_bank_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id FOR UPDATE;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_bank.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;
    v_fac := _corp_owner_faction(v_bank.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    -- Bring the deposit ledger current (20270897) before the
    -- funding check — issuing lends real, settled cash.
    PERFORM _bank_settle_deposits(p_bank_corp_id);
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id;

    -- Lock the offer: a double-issue serializes here and the loser
    -- sees status=issued.
    SELECT * INTO v_offer FROM corp_bank_loan_offers WHERE id = p_offer_id FOR UPDATE;
    IF v_offer.id IS NULL OR v_offer.bank_corp_id <> p_bank_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found');
    END IF;
    IF v_offer.status <> 'accepted' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_accepted');
    END IF;
    -- The Clearing House caps the active book (20270896 wiring):
    -- 2 loans at floor 0, +2 per level — a full book must collect
    -- before it writes again. Checked before any money or the
    -- action burns. The bank row is locked, so this count can't
    -- race against a concurrent issue by the same bank.
    IF (SELECT count(*) FROM corp_bank_loans
         WHERE bank_corp_id = p_bank_corp_id AND status = 'active')
       >= 2 + 2 * COALESCE(v_bank.bank_clearing_tier, 0) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'book_full',
            'cap', 2 + 2 * COALESCE(v_bank.bank_clearing_tier, 0));
    END IF;

    IF FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint < v_offer.amount THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_offer.amount, 'have', FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_bank.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    SELECT * INTO v_borrower FROM entrepreneur_corps
     WHERE id = (SELECT corp_id FROM corp_bank_loan_requests WHERE id = v_offer.request_id)
     FOR UPDATE;
    IF v_borrower.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'borrower_gone');
    END IF;

    -- Principal is not income for the borrower and not an expense
    -- for the bank — straight treasury moves, no cash events, so the
    -- corporate tax base stays honest.
    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_offer.amount,
           exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick)
     WHERE id = p_bank_corp_id;
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_offer.amount
     WHERE id = v_borrower.id;

    INSERT INTO corp_bank_loans (
        bank_corp_id, borrower_corp_id, request_id, offer_id,
        principal, rate_bps, term_ticks,
        originated_tick, due_tick,
        balance, last_accrual_tick, collateral_asset
    ) VALUES (
        p_bank_corp_id, v_borrower.id, v_offer.request_id, v_offer.id,
        v_offer.amount, v_offer.rate_bps, v_offer.term_ticks,
        v_tick, v_tick + v_offer.term_ticks,
        v_offer.amount, v_tick, v_offer.collateral_asset
    ) RETURNING id INTO v_loan_id;

    UPDATE corp_bank_loan_offers SET status = 'issued' WHERE id = p_offer_id;

    PERFORM _log_corp_history(p_bank_corp_id, v_tick,
        format('Issued the $%s loan to %s — %s%% prime, due tick %s.',
               v_offer.amount, v_borrower.name, v_offer.rate_bps / 100, v_tick + v_offer.term_ticks));
    PERFORM _log_corp_history(v_borrower.id, v_tick,
        format('Received $%s from %s — %s%% prime, due tick %s.',
               v_offer.amount, v_bank.name, v_offer.rate_bps / 100, v_tick + v_offer.term_ticks));

    RETURN jsonb_build_object('success', true, 'loan_id', v_loan_id,
        'amount', v_offer.amount, 'due_tick', v_tick + v_offer.term_ticks);
END $$;

-- ── bank_logistical_overhaul (from 20270896_bank_assets_overhaul.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.bank_logistical_overhaul(
    p_corp_id uuid,
    p_asset   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_tier     int;
    v_cost     bigint;
    v_tax_city uuid;
    v_tick     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_asset NOT IN
       ('branch_network', 'vault', 'underwriting', 'trading_desk', 'clearing_house') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;
    v_fac := _corp_owner_faction(v_corp.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    v_tier := COALESCE(CASE p_asset
        WHEN 'branch_network' THEN v_corp.bank_branch_tier
        WHEN 'vault'          THEN v_corp.bank_vault_tier
        WHEN 'underwriting'   THEN v_corp.bank_underwriting_tier
        WHEN 'trading_desk'   THEN v_corp.bank_trading_tier
        WHEN 'clearing_house' THEN v_corp.bank_clearing_tier
    END, 0);
    IF v_tier >= 5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'max_tier');
    END IF;

    -- The shared price ladder — yard_upgrade_cost is the one source
    -- across all three industries' overhauls.
    v_cost := yard_upgrade_cost(v_tier + 1);
    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'max_tier');
    END IF;

    -- Bring the deposit ledger current (20270897) — the treasury
    -- gate below must see interest paid and flows landed.
    PERFORM _bank_settle_deposits(p_corp_id);
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;

    -- City tax package (20270890): an active package in the HQ city
    -- discounts the spend 10%; consumed only when the action lands.
    v_tax_city := _tax_package_city(v_corp.hq_nation_id, v_corp.hq_city);
    IF v_tax_city IS NOT NULL THEN
        v_cost := ROUND(v_cost * 0.90);
    END IF;

    IF FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    UPDATE entrepreneur_corps SET
        treasury_cash          = COALESCE(treasury_cash, 0) - v_cost,
        exec_action_tick       = _corp_exec_spend(exec_action_tick, v_tick),
        bank_branch_tier       = CASE WHEN p_asset = 'branch_network' THEN v_tier + 1 ELSE bank_branch_tier END,
        bank_vault_tier        = CASE WHEN p_asset = 'vault'          THEN v_tier + 1 ELSE bank_vault_tier END,
        bank_underwriting_tier = CASE WHEN p_asset = 'underwriting'   THEN v_tier + 1 ELSE bank_underwriting_tier END,
        bank_trading_tier      = CASE WHEN p_asset = 'trading_desk'   THEN v_tier + 1 ELSE bank_trading_tier END,
        bank_clearing_tier     = CASE WHEN p_asset = 'clearing_house' THEN v_tier + 1 ELSE bank_clearing_tier END
     WHERE id = p_corp_id;

    IF v_tax_city IS NOT NULL THEN
        PERFORM _consume_tax_package_charge(v_tax_city);
    END IF;

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Logistical Overhaul — upgraded the %s asset to Level %s ($%s).',
               replace(p_asset, '_', ' '), v_tier + 1, v_cost));

    RETURN jsonb_build_object('success', true,
        'asset', p_asset, 'tier', v_tier + 1, 'cost', v_cost,
        'tax_package_applied', v_tax_city IS NOT NULL);
END $$;

-- ── bank_offer_loan (from 20270926_bank_offer_loan_scope_gate.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.bank_offer_loan(
    p_request_id       uuid,
    p_bank_corp_id     uuid,
    p_term_ticks       int,
    p_collateral_asset text,
    p_comments         text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_bank     entrepreneur_corps%ROWTYPE;
    v_borrower entrepreneur_corps%ROWTYPE;
    v_fac      factions%ROWTYPE;
    v_req      corp_bank_loan_requests%ROWTYPE;
    v_tick     int;
    v_id       uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_bank_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_term_ticks IS NULL OR p_term_ticks NOT IN (12, 24, 36) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_term');
    END IF;
    IF p_comments IS NOT NULL AND length(p_comments) > 300 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'comments_too_long');
    END IF;

    -- Lock the request FIRST — the accept path takes the same lock
    -- first, so a simultaneous accept and offer serialize instead of
    -- deadlocking, and no offer can land on a just-funded request.
    SELECT * INTO v_req FROM corp_bank_loan_requests WHERE id = p_request_id FOR UPDATE;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_closed');
    END IF;

    -- Then the bank: allowance + treasury checks serialize.
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id FOR UPDATE;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_bank.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;
    v_fac := _corp_owner_faction(v_bank.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    -- Lender scope (20270926): a Local request only takes offers from
    -- banks in the borrower's nation. The board client-filters too; this
    -- is the authority.
    IF v_req.lender_scope = 'local' AND v_bank.hq_nation_id IS DISTINCT FROM v_req.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'out_of_scope');
    END IF;
    -- No sheet, no lending — the offer's rate IS the posted prime.
    IF v_bank.bank_prime_rate_bps IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_rate_sheet');
    END IF;
    -- The Underwriting Desk caps the ticket (20270896 wiring):
    -- $20M per level. The Sovereign Desk (V) reaches the board's
    -- $100M ceiling — nothing is out of reach.
    IF v_req.amount > COALESCE(v_bank.bank_underwriting_tier, 1)::bigint * 20000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'underwriting_too_small',
            'cap', COALESCE(v_bank.bank_underwriting_tier, 1)::bigint * 20000000,
            'ask', v_req.amount);
    END IF;
    -- The Clearing House gates the longer paper (20270896 wiring):
    -- 12-tick terms always; Level I services 24, Level II services 36.
    IF (p_term_ticks = 24 AND COALESCE(v_bank.bank_clearing_tier, 0) < 1)
       OR (p_term_ticks = 36 AND COALESCE(v_bank.bank_clearing_tier, 0) < 2) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'clearing_too_small',
            'clearing_tier', COALESCE(v_bank.bank_clearing_tier, 0), 'term', p_term_ticks);
    END IF;
    -- Bring the deposit ledger current (20270897) — the treasury
    -- gate below must see interest paid and flows landed.
    PERFORM _bank_settle_deposits(p_bank_corp_id);
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id;

    SELECT * INTO v_borrower FROM entrepreneur_corps WHERE id = v_req.corp_id;
    -- Lending to your own corp at your own prime is money laundering
    -- with extra steps.
    IF v_borrower.owner_faction_id = v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'self_dealing');
    END IF;
    IF p_collateral_asset IS NULL
       OR NOT (p_collateral_asset = ANY (_loan_collateral_menu(v_borrower.industry))) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_collateral');
    END IF;

    -- The vault must be able to fund what it dangles. Re-checked at
    -- acceptance — this gate just keeps fantasy offers off the board.
    IF FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint < v_req.amount THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_req.amount, 'have', FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_bank.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    BEGIN
        INSERT INTO corp_bank_loan_offers (
            request_id, bank_corp_id, amount, rate_bps, term_ticks,
            collateral_asset, comments, created_at_tick
        ) VALUES (
            p_request_id, p_bank_corp_id, v_req.amount, v_bank.bank_prime_rate_bps,
            p_term_ticks, p_collateral_asset, NULLIF(btrim(COALESCE(p_comments, '')), ''), v_tick
        ) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_already_pending');
    END;

    UPDATE entrepreneur_corps SET exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick) WHERE id = p_bank_corp_id;

    PERFORM _log_corp_history(p_bank_corp_id, v_tick,
        format('Offered %s a $%s loan — %s%% prime, %s ticks.',
               v_borrower.name, v_req.amount, v_bank.bank_prime_rate_bps / 100, p_term_ticks));

    RETURN jsonb_build_object('success', true, 'offer_id', v_id,
        'amount', v_req.amount, 'rate_bps', v_bank.bank_prime_rate_bps,
        'term_ticks', p_term_ticks);
END $$;

-- ── bank_package_subprime (from 20270895_subprime_packaging.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.bank_package_subprime(
    p_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_bank     entrepreneur_corps%ROWTYPE;
    v_fac      factions%ROWTYPE;
    v_nation   nations%ROWTYPE;
    v_tick     int;
    v_heat     int;
    v_payout   bigint;
    v_roll     int;
    v_lamp_lit boolean := false;
    v_lamps    int;
    v_crashed  boolean := false;
    v_burned   record;
    v_keep     numeric;
    v_flee     numeric;
    v_fled_i   numeric;
    v_fled     numeric := 0;
    v_refuge_ids uuid[];
    v_refuge_id  uuid;
    v_inflow     numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Unlocked read for the cheap gates; the authoritative re-read
    -- happens under lock below.
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_bank.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;
    v_fac := _corp_owner_faction(v_bank.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    -- LOCK ORDER: nation FIRST, then the own corp row. The crash
    -- branch locks every bank in the nation while holding the nation
    -- lock; if packagers took their corp lock before queueing on the
    -- nation, a crash and a concurrent package would deadlock
    -- (A holds nation + wants B's corp; B holds its corp + wants
    -- nation). Nation-first means every packager queues here holding
    -- nothing, and no other banking action ever takes a nation lock.
    SELECT * INTO v_nation FROM nations WHERE id = v_bank.hq_nation_id FOR UPDATE;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    -- Now the authoritative corp row, re-checked under lock.
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    -- Bring the deposit ledger current (20270897) before the frenzy.
    PERFORM _bank_settle_deposits(p_corp_id);

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_bank.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Bring the gauge current (lazy cool), then feed the frenzy.
    v_heat := GREATEST(0, COALESCE(v_nation.market_heat, 0)
                  - 2 * GREATEST(0, v_tick - COALESCE(v_nation.market_heat_updated_tick, v_tick)));
    v_heat := LEAST(100, v_heat + 12);

    -- The payout — richest right at the cliff. Taxable income.
    -- The Trading Desk (20270896 wiring) sweetens every tranche:
    -- +10% per level, The Black Box (V) paying ×1.5. No desk still
    -- packages at base — the desk is appetite, not admission.
    v_payout := ROUND((1500000 + v_heat * 50000)
        * (1 + 0.10 * LEAST(5, GREATEST(0, COALESCE(v_bank.bank_trading_tier, 0)))));

    -- The roll: 1d100 ≤ heat lights the next lamp. Permanent.
    v_roll  := 1 + floor(random() * 100)::int;
    v_lamps := COALESCE(v_nation.crash_lamps, 0);
    IF v_roll <= v_heat THEN
        v_lamp_lit := true;
        v_lamps := v_lamps + 1;
    END IF;
    v_crashed := v_lamps >= 5;

    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) + v_payout,
           exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick)
     WHERE id = p_corp_id;
    INSERT INTO corp_cash_events (corp_id, tick, category, label, delta, nation_id)
    VALUES (p_corp_id, v_tick, 'revenue_finance',
            'Subprime tranches sold', v_payout, v_bank.hq_nation_id);

    IF NOT v_crashed THEN
        UPDATE nations
           SET market_heat              = v_heat,
               market_heat_updated_tick = v_tick,
               crash_lamps              = v_lamps
         WHERE id = v_nation.id;

        PERFORM _log_corp_history(p_corp_id, v_tick,
            format('Packaged subprime tranches — $%s sold. Market Heat %s%s.',
                   v_payout, v_heat,
                   CASE WHEN v_lamp_lit
                        THEN format(', crash indicator %s of 5 lit', v_lamps)
                        ELSE '' END));
    ELSE
        -- ── THE CRASH ─────────────────────────────────────────────
        -- Every bank in the nation holds the paper. The base
        -- writedown is 50% for the bank that lit MARGIN CALL, 30%
        -- for bystanders — each bank's VAULT keeps +3% per level
        -- past I (20270896 wiring). Then the RUN: half the deposit
        -- base flees, less 10% per Vault level past I (floor 10%) —
        -- the claim leaves regardless, the cash only as far as the
        -- post-writedown vault can pay. Fled money is tallied for
        -- the flight to quality below. Pure treasury losses — no
        -- expense deduction (the payouts were taxed as income; the
        -- crash is not a shelter).
        FOR v_burned IN
            SELECT id, bank_vault_tier, bank_deposits, treasury_cash
              FROM entrepreneur_corps
             WHERE hq_nation_id = v_nation.id AND industry = 'banking'
             ORDER BY id
             FOR UPDATE
        LOOP
            v_keep := LEAST(1.0,
                CASE WHEN v_burned.id = p_corp_id THEN 0.50 ELSE 0.70 END
                + 0.03 * GREATEST(0, COALESCE(v_burned.bank_vault_tier, 1) - 1));
            v_flee := GREATEST(0.10,
                0.50 - 0.10 * GREATEST(0, COALESCE(v_burned.bank_vault_tier, 1) - 1));
            -- The run pays out only what the post-writedown vault
            -- holds; the UNPAID CLAIM STAYS OWED (consistent with
            -- orderly settlement — and the illiquid bank keeps
            -- paying interest on money it couldn't return). Only
            -- cash that actually left counts toward the flight.
            v_fled_i := LEAST(
                ROUND(COALESCE(v_burned.bank_deposits, 0) * v_flee),
                GREATEST(0, ROUND(COALESCE(v_burned.treasury_cash, 0) * v_keep)));
            v_fled   := v_fled + v_fled_i;
            UPDATE entrepreneur_corps
               SET treasury_cash = ROUND(COALESCE(treasury_cash, 0) * v_keep) - v_fled_i,
                   bank_deposits = COALESCE(bank_deposits, 0) - v_fled_i,
                   bank_deposits_updated_tick = v_tick
             WHERE id = v_burned.id;
            PERFORM _log_corp_history(v_burned.id, v_tick,
                CASE WHEN v_burned.id = p_corp_id
                     THEN format('MARKET CRASH — your tranches lit the MARGIN CALL. %s%% of the treasury written down; %s%% of depositors besiege the branches.',
                                 ROUND((1 - v_keep) * 100), ROUND(v_flee * 100))
                     ELSE format('MARKET CRASH — the paper went to zero. %s%% of the treasury written down; %s%% of depositors besiege the branches.',
                                 ROUND((1 - v_keep) * 100), ROUND(v_flee * 100)) END);
        END LOOP;

        -- ── FLIGHT TO QUALITY (Vault Level V capstone) ────────────
        -- Panicked money doesn't vanish — half of the cash that
        -- ACTUALLY left the banks runs TO the nation's National
        -- Depository banks (Vault V), split among them. The trigger
        -- bank is never the refuge from its own panic. No
        -- Depository: the money stays under mattresses. One query
        -- defines who qualifies.
        SELECT array_agg(id) INTO v_refuge_ids FROM entrepreneur_corps
         WHERE hq_nation_id = v_nation.id AND industry = 'banking'
           AND COALESCE(bank_vault_tier, 1) >= 5 AND id <> p_corp_id;
        IF v_refuge_ids IS NOT NULL AND v_fled > 0 THEN
            v_inflow := ROUND(v_fled * 0.5 / array_length(v_refuge_ids, 1));
            FOREACH v_refuge_id IN ARRAY v_refuge_ids LOOP
                UPDATE entrepreneur_corps
                   SET bank_deposits = COALESCE(bank_deposits, 0) + v_inflow,
                       treasury_cash = COALESCE(treasury_cash, 0) + v_inflow,
                       bank_deposits_updated_tick = v_tick
                 WHERE id = v_refuge_id;
                PERFORM _log_corp_history(v_refuge_id, v_tick,
                    format('FLIGHT TO QUALITY — $%s of panicked deposits ran to the National Depository.', v_inflow));
            END LOOP;
        END IF;

        UPDATE nations
           SET market_heat              = 10,
               market_heat_updated_tick = v_tick,
               crash_lamps              = 0,
               unrest                   = LEAST(100, COALESCE(unrest, 0) + 10)
         WHERE id = v_nation.id;

        INSERT INTO event_log (
            nation_id, faction_id, event_name, description_used,
            category, trigger_key, fired_at_tick
        ) VALUES (
            v_nation.id, v_fac.id,
            'Market Crash',
            format('MARKET CRASH IN %s — the subprime market collapses. Depositors besiege the branches; every bank writes down its book. %s packaged the tranche that broke it.',
                   upper(v_nation.name), v_bank.name),
            'economy', 'bank_market_crash', v_tick
        );
    END IF;

    RETURN jsonb_build_object(
        'success',   true,
        'payout',    v_payout,
        'roll',      v_roll,
        'heat',      CASE WHEN v_crashed THEN 10 ELSE v_heat END,
        'lamp_lit',  v_lamp_lit,
        'lamps',     CASE WHEN v_crashed THEN 0 ELSE v_lamps END,
        'crashed',   v_crashed
    );
END $$;

-- ── bank_set_interest_rate (from 20270903_widen_bank_rate_sheet.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.bank_set_interest_rate(
    p_corp_id     uuid,
    p_deposit_bps int,
    p_prime_bps   int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_deposit_bps IS NULL OR p_prime_bps IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    -- The chartered pill values (yearly): deposits 1-4.5%, prime 2-12%.
    IF p_deposit_bps NOT IN (100, 150, 200, 250, 300, 350, 400, 450)
       OR p_prime_bps NOT IN (200, 400, 500, 600, 800, 1000, 1200) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rate');
    END IF;
    -- Belt and braces: the pill sets can never overlap, but the rule
    -- ("never pay savers more than borrowers pay you") is a doctrine,
    -- not an accident of today's values.
    IF p_deposit_bps >= p_prime_bps THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_spread');
    END IF;

    -- Lock the corp row: the allowance check must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Settle the deposit ledger at the OLD rate before repricing
    -- (20270897) — the elapsed window was lived under the old sheet.
    PERFORM _bank_settle_deposits(p_corp_id);

    UPDATE entrepreneur_corps
       SET bank_deposit_rate_bps = p_deposit_bps,
           bank_prime_rate_bps   = p_prime_bps,
           exec_action_tick      = _corp_exec_spend(exec_action_tick, v_tick)
     WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Posted the rate sheet — deposits at %s%%, prime at %s%%.',
               p_deposit_bps / 100, p_prime_bps / 100));

    RETURN jsonb_build_object('success', true,
        'deposit_bps', p_deposit_bps,
        'prime_bps',   p_prime_bps);
END $$;

-- ── buy_construction_goods (from 20270888_operating_expenses_deductible.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.buy_construction_goods(
    p_corp_id    uuid,
    p_good       text,
    p_qty        int,
    p_nation_id  uuid,
    p_project_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_proj   corp_construction_projects%ROWTYPE;
    v_need   int;
    v_caps   record;
    v_units  int;
    v_mkt    jsonb;
    v_price  bigint;
    v_total  bigint;
    v_tick   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL
       OR p_good NOT IN ('materials', 'equipment')
       OR p_qty IS NULL OR p_qty < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: allowance + cap checks must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    v_caps := yard_storage_caps(COALESCE(v_corp.supply_tier, 0));

    IF p_good = 'materials' THEN
        -- Materials: always project-bound, always home nation —
        -- storage returns with the Supply & Material ladder.
        IF p_nation_id <> v_corp.hq_nation_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'home_nation_only');
        END IF;
        IF p_project_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'project_required');
        END IF;
        SELECT * INTO v_proj FROM corp_construction_projects
         WHERE id = p_project_id AND corp_id = p_corp_id AND status = 'building'
         FOR UPDATE;
        IF v_proj.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'project_not_found');
        END IF;
        v_need := COALESCE((SELECT materials_needed FROM corp_blueprints
                             WHERE id = v_proj.blueprint_id), 0);
        IF v_proj.materials_supplied + p_qty > v_need THEN
            RETURN jsonb_build_object('success', false, 'reason', 'exceeds_project_need',
                'needed', v_need, 'supplied', v_proj.materials_supplied);
        END IF;
    ELSE
        -- Equipment: abroad opens at Level IV.
        IF COALESCE(v_corp.supply_tier, 0) < 4
           AND p_nation_id <> v_corp.hq_nation_id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'home_nation_only');
        END IF;
        IF v_caps.equipment_cap = 0 THEN
            -- Level 0: one unit, bought straight onto an active
            -- project — its single use is committed on the spot.
            IF p_qty <> 1 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
            END IF;
            IF p_project_id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'reason', 'project_required');
            END IF;
            SELECT * INTO v_proj FROM corp_construction_projects
             WHERE id = p_project_id AND corp_id = p_corp_id AND status = 'building'
             FOR UPDATE;
            IF v_proj.id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'reason', 'project_not_found');
            END IF;
            IF v_proj.equipment_supplied >= 1 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'exceeds_project_need');
            END IF;
        ELSE
            SELECT COUNT(*) INTO v_units FROM corp_equipment WHERE corp_id = p_corp_id;
            IF v_units + p_qty > v_caps.equipment_cap THEN
                RETURN jsonb_build_object('success', false, 'reason', 'storage_full',
                    'cap', v_caps.equipment_cap, 'stock', v_units);
            END IF;
        END IF;
    END IF;

    -- Price + availability THROUGH the canonical market functions —
    -- the listed price IS the charged price.
    v_mkt := CASE p_good
        WHEN 'materials' THEN construction_materials_market(p_nation_id)
        ELSE construction_equipment_market(p_nation_id)
    END;
    IF NOT COALESCE((v_mkt->>'success')::boolean, false) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'market_unavailable');
    END IF;
    IF p_qty > (v_mkt->>'amount_available')::bigint THEN
        RETURN jsonb_build_object('success', false, 'reason', 'market_sold_out',
            'available', (v_mkt->>'amount_available')::bigint);
    END IF;
    v_price := (v_mkt->>'cost_per_unit')::bigint;
    v_total := v_price * p_qty;
    IF FLOOR(COALESCE(v_corp.treasury_cash, 0)) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_total, 'have', FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_total,
           exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick)
     WHERE id = p_corp_id;

    -- Operating expense → the tax-deductible accumulator (20270888).
    PERFORM _corp_log_expense(p_corp_id, v_total);

    IF p_good = 'materials' THEN
        UPDATE corp_construction_projects
           SET materials_supplied = materials_supplied + p_qty
         WHERE id = p_project_id;
    ELSE
        IF v_caps.equipment_cap = 0 THEN
            UPDATE corp_construction_projects
               SET equipment_supplied = 1
             WHERE id = p_project_id;
        ELSE
            INSERT INTO corp_equipment (corp_id, uses_left, acquired_at_tick)
            SELECT p_corp_id, 3, v_tick FROM generate_series(1, p_qty);
        END IF;
        -- Equipment leaves the seller nation's ratcheting stock —
        -- the ratchet's only down-path. Conditional so a concurrent
        -- buyer can't drive it negative.
        UPDATE nations
           SET construction_equipment_stock = construction_equipment_stock - p_qty
         WHERE id = p_nation_id
           AND construction_equipment_stock >= p_qty;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'reason', 'market_sold_out');
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'qty', p_qty,
        'unit_price', v_price, 'total', v_total);
END $$;

-- ── draft_blueprint (from 20270825_infrastructure_tier_i.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.draft_blueprint(
    p_corp_id       uuid,
    p_category      text,
    p_building_type text,
    p_quality_tier  text,
    p_name          text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
    v_id   uuid;
    v_name text := TRIM(COALESCE(p_name, ''));
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF length(v_name) < 2 OR length(v_name) > 60 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_category NOT IN ('residential', 'infrastructure') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'category_not_chartered');
    END IF;
    -- Types pair with their category (20270825).
    IF (p_category = 'residential' AND p_building_type NOT IN
            ('single_story_home', 'double_story', 'multitenant_living'))
       OR (p_category = 'infrastructure' AND p_building_type <> 'infrastructure_tier_i')
       OR p_quality_tier NOT IN ('low_cost', 'standard', 'high_end', 'luxury', 'ultra_rich') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the per-tick allowance check below must
    -- serialize against a concurrent draft.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    INSERT INTO corp_blueprints (
        corp_id, category, city, building_type, quality_tier,
        created_at_tick, name, materials_needed
    ) VALUES (
        p_corp_id, p_category, COALESCE(v_corp.hq_city, '—'),
        p_building_type, p_quality_tier, v_tick, v_name,
        CASE p_building_type
            WHEN 'single_story_home'    THEN 1
            WHEN 'double_story'         THEN 2
            WHEN 'multitenant_living'   THEN 7
            WHEN 'infrastructure_tier_i' THEN 10
            ELSE 1
        END
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps SET exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick) WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'blueprint_id', v_id, 'name', v_name);
END $$;

-- ── draft_vehicle_blueprint (from 20270859_directive_chain.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.draft_vehicle_blueprint(
    p_corp_id       uuid,
    p_name          text,
    p_vehicle_type  text,
    p_vehicle_class text,
    p_engine        text,
    p_packages      text[],
    p_quality       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_tick     int;
    v_id       uuid;
    v_name     text := TRIM(COALESCE(p_name, ''));
    v_packages text[];
    v_cost     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF length(v_name) < 2 OR length(v_name) > 60 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_vehicle_type NOT IN ('coupe', 'sedan', 'pickup', 'motorcycle', 'sports_car')
       OR p_vehicle_class NOT IN ('economy', 'mid_range', 'premium', 'luxury', 'ultra_luxury')
       OR p_engine NOT IN ('basic_3cyl', 'basic_4cyl', 'tuned_4cyl', 'v6', 'v8', 'v12',
                           'electric_basic', 'electric_performance', 'hybrid')
       OR p_quality NOT IN ('low', 'moderate', 'standard', 'exceptional') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Packages: dedupe, then validate against the catalog and the
    -- two fitment gates (plus the V12's market restriction).
    SELECT COALESCE(array_agg(DISTINCT x), '{}') INTO v_packages
      FROM unnest(COALESCE(p_packages, '{}')) AS x;
    IF NOT (v_packages <@ ARRAY['leather_interior', 'premium_audio', 'technology',
                                'driver_assist', 'sport_performance', 'safety',
                                'appearance', 'cold_weather', 'off_road', 'self_driving']) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF 'off_road' = ANY(v_packages) AND p_vehicle_type <> 'pickup' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'off_road_pickup_only');
    END IF;
    IF 'self_driving' = ANY(v_packages)
       AND p_vehicle_class NOT IN ('premium', 'luxury', 'ultra_luxury') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'self_driving_premium_only');
    END IF;
    IF p_engine = 'v12' AND p_vehicle_type <> 'sports_car'
       AND p_vehicle_class NOT IN ('luxury', 'ultra_luxury') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'v12_restricted');
    END IF;

    -- Lock the corp row: the allowance check and the XP debit below
    -- must serialize against a concurrent draft.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_cost := vehicle_blueprint_xp_cost(p_vehicle_type, p_vehicle_class, p_engine,
                                        COALESCE(array_length(v_packages, 1), 0), p_quality);
    IF COALESCE(v_corp.experience, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_experience',
            'xp_cost', v_cost, 'experience', COALESCE(v_corp.experience, 0));
    END IF;

    -- Bench Test the Components (20270847): a pending charge bakes
    -- +0.5 appeal into this Model permanently, then falls off.
    INSERT INTO vehicle_blueprints (
        corp_id, name, vehicle_type, vehicle_class, engine,
        packages, quality, xp_cost, created_at_tick, appeal_bonus
    ) VALUES (
        p_corp_id, v_name, p_vehicle_type, p_vehicle_class, p_engine,
        v_packages, p_quality, v_cost, v_tick,
        CASE WHEN COALESCE(v_corp.design_buff_appeal, 0) > 0 THEN 0.5 ELSE 0 END
    ) RETURNING id INTO v_id;

    -- The Design & Engineering Studio (20270842): every new Model
    -- grants Experience by studio level (+1/+2/+3), accruing up to
    -- the level's ceiling (20/20/20/40/60 — the grant is forfeited
    -- at the cap, never clamping down).
    UPDATE entrepreneur_corps
       SET experience = GREATEST(COALESCE(experience, 0) - v_cost,
               LEAST(design_studio_cap(COALESCE(design_studio_tier, 1)),
                     COALESCE(experience, 0) - v_cost
                     + design_studio_grant(COALESCE(design_studio_tier, 1)))),
           design_buff_appeal = GREATEST(0, COALESCE(design_buff_appeal, 0) - 1),
           exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick)
     WHERE id = p_corp_id;

    -- The press release (design ruling, 20270859) — labels mirror
    -- VEHICLE_TYPES / VEHICLE_CLASSES / VEHICLE_QUALITY client-side.
    PERFORM _log_corp_history(p_corp_id, v_tick, format(
        '%s announced the %s car model, %s %s %s of %s quality to be available on the market soon.',
        v_corp.name, v_name,
        CASE WHEN p_vehicle_class IN ('economy', 'ultra_luxury') THEN 'an' ELSE 'a' END,
        CASE p_vehicle_class WHEN 'economy' THEN 'Economy' WHEN 'mid_range' THEN 'Mid-Range'
             WHEN 'premium' THEN 'Premium' WHEN 'luxury' THEN 'Luxury' ELSE 'Ultra-Luxury' END,
        CASE p_vehicle_type WHEN 'coupe' THEN 'Coupe' WHEN 'sedan' THEN 'Sedan'
             WHEN 'pickup' THEN 'Pickup' WHEN 'motorcycle' THEN 'Motorcycle' ELSE 'Sports Car' END,
        CASE p_quality WHEN 'low' THEN 'Low' WHEN 'moderate' THEN 'Moderate'
             WHEN 'standard' THEN 'Standard' ELSE 'Exceptional' END));
    RETURN jsonb_build_object('success', true, 'blueprint_id', v_id,
        'name', v_name, 'xp_cost', v_cost);
END $$;

-- ── expand_market (from 20270853_cco_expansion_proposals.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.expand_market(
    p_corp_id         uuid,
    p_nation_id       uuid,
    p_kind            text,
    p_subsidiary_name text,
    p_shipments       jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_nation   nations%ROWTYPE;
    v_presence corp_market_presence%ROWTYPE;
    v_tick     int;
    v_cost     bigint := 0;
    v_name     text := TRIM(COALESCE(p_subsidiary_name, ''));
    v_shipped  int := 0;
    r          RECORD;
    v_bp       vehicle_blueprints%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_kind NOT IN ('expansion', 'subsidiary') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_kind');
    END IF;

    -- Lock the corp row: allowance, fee, and HQ stock deductions
    -- below must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;
    IF p_nation_id = v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'home_nation');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT * INTO v_nation FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- Validate every shipment BEFORE any money moves (20270844): a
    -- bad row must not leave the entry fee paid with nothing shipped
    -- (a plain RETURN does not roll back the debit). The row locks
    -- taken here also serialize the stock deductions below.
    FOR r IN SELECT * FROM jsonb_to_recordset(COALESCE(p_shipments, '[]'::jsonb))
                  AS x(blueprint_id uuid, units int, local_name text, list_price bigint)
    LOOP
        SELECT * INTO v_bp FROM vehicle_blueprints
         WHERE id = r.blueprint_id AND corp_id = p_corp_id
         FOR UPDATE;
        IF v_bp.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
        END IF;
        IF COALESCE(r.units, 0) < 0 OR COALESCE(r.units, 0) > COALESCE(v_bp.units_in_stock, 0) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'ship_exceeds_stock',
                'model', v_bp.name, 'have', COALESCE(v_bp.units_in_stock, 0));
        END IF;
    END LOOP;

    SELECT * INTO v_presence FROM corp_market_presence
     WHERE corp_id = p_corp_id AND nation_id = p_nation_id;

    IF v_presence.id IS NULL THEN
        -- First entry pays the fee: $10M flat to expand, or
        -- $7M × the TARGET nation's Standard of Living / 50 for a
        -- named subsidiary.
        IF p_kind = 'subsidiary' THEN
            IF length(v_name) < 2 OR length(v_name) > 60 THEN
                RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
            END IF;
        END IF;
        v_cost := market_entry_cost(p_kind, p_nation_id);
        IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
                'need', v_cost, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
        END IF;
        INSERT INTO corp_market_presence (
            corp_id, nation_id, kind, subsidiary_name, cost_paid, established_tick
        ) VALUES (
            p_corp_id, p_nation_id, p_kind,
            CASE WHEN p_kind = 'subsidiary' THEN v_name END, v_cost, v_tick
        ) RETURNING * INTO v_presence;
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) - v_cost
         WHERE id = p_corp_id;
    END IF;
    -- Already present: the re-run ships and re-prices for free.

    -- Shipments (validated above): move units HQ → nation, set
    -- standing prices, and (subsidiaries only) the local Model names.
    FOR r IN SELECT * FROM jsonb_to_recordset(COALESCE(p_shipments, '[]'::jsonb))
                  AS x(blueprint_id uuid, units int, local_name text, list_price bigint)
    LOOP
        IF COALESCE(r.units, 0) > 0 THEN
            UPDATE vehicle_blueprints
               SET units_in_stock = units_in_stock - r.units
             WHERE id = r.blueprint_id;
            v_shipped := v_shipped + COALESCE(r.units, 0);
        END IF;
        INSERT INTO vehicle_market_stock (corp_id, nation_id, blueprint_id, units, local_name, list_price)
        VALUES (p_corp_id, p_nation_id, r.blueprint_id, COALESCE(r.units, 0),
                CASE WHEN v_presence.kind = 'subsidiary' THEN NULLIF(TRIM(COALESCE(r.local_name, '')), '') END,
                r.list_price)
        ON CONFLICT (blueprint_id, nation_id) DO UPDATE
           SET units      = vehicle_market_stock.units + COALESCE(EXCLUDED.units, 0),
               local_name = CASE WHEN v_presence.kind = 'subsidiary'
                                 THEN COALESCE(EXCLUDED.local_name, vehicle_market_stock.local_name)
                                 ELSE vehicle_market_stock.local_name END,
               list_price = COALESCE(EXCLUDED.list_price, vehicle_market_stock.list_price);
    END LOOP;

    UPDATE entrepreneur_corps SET exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick) WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick, CASE
        WHEN v_cost > 0 AND v_presence.kind = 'subsidiary'
            THEN format('Opened the subsidiary “%s” in %s ($%s)%s', v_presence.subsidiary_name, v_nation.name, v_cost,
                        CASE WHEN v_shipped > 0 THEN format(' — shipped %s vehicle(s).', v_shipped) ELSE '.' END)
        WHEN v_cost > 0
            THEN format('Expanded into %s ($%s)%s', v_nation.name, v_cost,
                        CASE WHEN v_shipped > 0 THEN format(' — shipped %s vehicle(s).', v_shipped) ELSE '.' END)
        ELSE format('Shipped %s vehicle(s) to %s.', v_shipped, v_nation.name)
    END);
    RETURN jsonb_build_object(
        'success',   true,
        'kind',      v_presence.kind,
        'name',      v_presence.subsidiary_name,
        'cost_paid', v_cost,
        'shipped',   v_shipped,
        'nation',    v_nation.name
    );
END $$;

-- ── logistical_overhaul (from 20270890_tax_package_founding_upgrades.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.logistical_overhaul(
    p_corp_id uuid,
    p_asset   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
    v_cost bigint;
    v_tax_city uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_asset IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_asset NOT IN ('project_management', 'heavy_equipment', 'supply_material',
                       'system_design', 'regulatory_compliance') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_asset');
    END IF;

    -- Lock the corp row: allowance + treasury checks must serialize.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    -- All five assets climb the same price ladder ($7-40M).
    IF p_asset = 'heavy_equipment' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.supply_tier, 0) + 1);
    ELSIF p_asset = 'supply_material' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.materials_tier, 0) + 1);
    ELSIF p_asset = 'regulatory_compliance' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.reg_tier, 0) + 1);
    ELSIF p_asset = 'system_design' THEN
        v_cost := yard_upgrade_cost(COALESCE(v_corp.design_tier, 0) + 1);
    ELSE
        v_cost := yard_upgrade_cost(COALESCE(v_corp.pm_tier, 0) + 1);
        -- PM levels also demand owned commercial buildings — checks
        -- that cannot pass until commercial categories are chartered.
        IF v_cost IS NOT NULL
           AND NOT _pm_upgrade_requirement_met(p_corp_id, COALESCE(v_corp.pm_tier, 0) + 1) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'requires_building');
        END IF;
    END IF;
    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'max_tier');
    END IF;

    -- City tax package (20270890): an active package in the HQ city
    -- discounts the spend 10%; the charge is consumed (with its
    -- +1 Growth / -1 Unemployment rebate) only when the action lands.
    v_tax_city := _tax_package_city(v_corp.hq_nation_id, v_corp.hq_city);
    IF v_tax_city IS NOT NULL THEN
        v_cost := ROUND(v_cost * 0.90);
    END IF;

    IF FLOOR(COALESCE(v_corp.treasury_cash, 0)) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash    = COALESCE(treasury_cash, 0) - v_cost,
           supply_tier      = COALESCE(supply_tier, 0)
               + CASE WHEN p_asset = 'heavy_equipment' THEN 1 ELSE 0 END,
           pm_tier          = COALESCE(pm_tier, 0)
               + CASE WHEN p_asset = 'project_management' THEN 1 ELSE 0 END,
           materials_tier   = COALESCE(materials_tier, 0)
               + CASE WHEN p_asset = 'supply_material' THEN 1 ELSE 0 END,
           reg_tier         = COALESCE(reg_tier, 0)
               + CASE WHEN p_asset = 'regulatory_compliance' THEN 1 ELSE 0 END,
           design_tier      = COALESCE(design_tier, 0)
               + CASE WHEN p_asset = 'system_design' THEN 1 ELSE 0 END,
           exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick)
     WHERE id = p_corp_id;

    IF v_tax_city IS NOT NULL THEN
        PERFORM _consume_tax_package_charge(v_tax_city);
    END IF;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Logistical Overhaul — upgraded the %s asset ($%s).', replace(p_asset, '_', ' '), v_cost));
    RETURN jsonb_build_object('success', true, 'asset', p_asset, 'cost', v_cost,
        'tax_package_applied', v_tax_city IS NOT NULL,
        'new_tier', CASE p_asset
                         WHEN 'heavy_equipment'       THEN COALESCE(v_corp.supply_tier, 0) + 1
                         WHEN 'supply_material'       THEN COALESCE(v_corp.materials_tier, 0) + 1
                         WHEN 'regulatory_compliance' THEN COALESCE(v_corp.reg_tier, 0) + 1
                         WHEN 'system_design'         THEN COALESCE(v_corp.design_tier, 0) + 1
                         ELSE COALESCE(v_corp.pm_tier, 0) + 1 END);
END $$;

-- ── offer_personal_loan (from 20270937_personal_loans_treasury_converge.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.offer_personal_loan(
    p_request_id   uuid,
    p_bank_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_bank     entrepreneur_corps%ROWTYPE;
    v_req      personal_loan_requests%ROWTYPE;
    v_borrower factions%ROWTYPE;
    v_tick     int;
    v_apr      numeric;
    v_offer_id uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_bank_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock order request → bank (matches accept) to stay deadlock-free.
    SELECT * INTO v_req FROM personal_loan_requests WHERE id = p_request_id FOR UPDATE;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_pending');
    END IF;

    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id FOR UPDATE;
    IF v_bank.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bank_corp_not_found');
    END IF;
    IF v_bank.industry <> 'banking' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_banking_corp');
    END IF;
    v_fac := _corp_owner_faction(v_bank.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_bank.bank_prime_rate_bps IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_rate_sheet');
    END IF;
    v_apr := v_bank.bank_prime_rate_bps / 10000.0;
    IF v_apr > 0.5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'prime_rate_too_high', 'cap_bps', 5000);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_tick > v_req.expires_at_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_expired');
    END IF;

    -- Eligibility: bank HQ in borrower's nation + a completed banking_office there.
    SELECT * INTO v_borrower FROM factions WHERE id = v_req.borrower_faction_id;
    IF v_borrower.nation_id IS NULL OR v_bank.hq_nation_id <> v_borrower.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_mismatch');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM corp_buildings
         WHERE owner_corp_id = v_bank.id
           AND nation_id     = v_borrower.nation_id
           AND building_type = 'banking_office'
           AND status        = 'completed'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_banking_office');
    END IF;

    -- No lending to a borrower the bank's account also controls.
    IF v_borrower.id = v_uid OR v_borrower.linked_user_id = v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'self_dealing');
    END IF;

    -- Settle deposits, then the treasury must cover the ticket.
    PERFORM _bank_settle_deposits(p_bank_corp_id);
    SELECT * INTO v_bank FROM entrepreneur_corps WHERE id = p_bank_corp_id;
    IF FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint < v_req.principal THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_req.principal, 'have', FLOOR(COALESCE(v_bank.treasury_cash, 0))::bigint);
    END IF;
    IF COALESCE(v_bank.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    INSERT INTO personal_loan_offers (request_id, bank_corp_id, apr, placed_at_tick)
    VALUES (p_request_id, p_bank_corp_id, v_apr, v_tick)
    ON CONFLICT (request_id, bank_corp_id) WHERE status = 'pending'
        DO UPDATE SET apr = EXCLUDED.apr, placed_at_tick = EXCLUDED.placed_at_tick
    RETURNING id INTO v_offer_id;

    UPDATE entrepreneur_corps SET exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick) WHERE id = p_bank_corp_id;

    PERFORM _log_corp_history(p_bank_corp_id, v_tick,
        format('Offered a personal loan of $%s at %s%% prime.',
               v_req.principal, v_bank.bank_prime_rate_bps / 100));

    RETURN jsonb_build_object('success', true, 'offer_id', v_offer_id,
        'request_id', p_request_id, 'apr', v_apr);
END;
$$;

-- ── run_sales_campaign (from 20270850_cco_actions.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.run_sales_campaign(
    p_corp_id      uuid,
    p_nation_id    uuid,
    p_blueprint_id uuid,
    p_price        bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
    v_res  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_res := _resolve_sales_campaign(p_corp_id, p_nation_id, p_blueprint_id, p_price);
    IF COALESCE((v_res->>'success')::boolean, false) THEN
        UPDATE entrepreneur_corps SET exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick) WHERE id = p_corp_id;
    END IF;
    RETURN v_res;
END $$;

-- ── start_construction_project (from 20270826_regulatory_ladder.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.start_construction_project(
    p_corp_id         uuid,
    p_city_id         uuid,
    p_blueprint_id    uuid,
    p_pm_applicant_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
    v_bp    corp_blueprints%ROWTYPE;
    v_city  cities%ROWTYPE;
    v_pm    job_applicants%ROWTYPE;
    v_tick  int;
    v_ticks int;
    v_id    uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_city_id IS NULL
       OR p_blueprint_id IS NULL OR p_pm_applicant_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the per-tick allowance check below must
    -- serialize against a concurrent executive action.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT * INTO v_bp FROM corp_blueprints
     WHERE id = p_blueprint_id AND corp_id = p_corp_id;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;
    IF v_bp.category <> 'residential' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'category_not_chartered');
    END IF;

    SELECT * INTO v_city FROM cities WHERE id = p_city_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    -- The assigned PM must be someone this corp actually hired.
    SELECT a.* INTO v_pm
      FROM job_applicants a
      JOIN job_openings o ON o.id = a.opening_id
     WHERE a.id = p_pm_applicant_id
       AND o.corp_id = p_corp_id
       AND a.status = 'hired';
    IF v_pm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pm_not_found');
    END IF;

    -- Project Management cap (20270820): NEW projects refuse beyond
    -- the tier's Max Active Projects; in-flight builds above the cap
    -- are grandfathered.
    IF NOT _pm_cap_allows(p_corp_id, v_corp.pm_tier) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'project_cap_reached',
            'cap', pm_max_active_projects(v_corp.pm_tier));
    END IF;

    -- Regulatory Compliance gates (20270826): license tier for the
    -- building type, and Tier V for building outside the HQ nation.
    IF reg_min_tier(v_bp.building_type) > COALESCE(v_corp.reg_tier, 0) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_licensed');
    END IF;
    IF v_city.nation_id IS DISTINCT FROM v_corp.hq_nation_id
       AND COALESCE(v_corp.reg_tier, 0) < 5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'foreign_locked');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_ticks := construction_build_ticks(v_bp.building_type, v_corp.pillar_speed);

    INSERT INTO corp_construction_projects (
        kind, corp_id, blueprint_id, pm_applicant_id, city_id, city,
        price, quality, started_tick, completes_at_tick
    ) VALUES (
        'self', p_corp_id, p_blueprint_id, p_pm_applicant_id,
        v_city.id, v_city.city_name,
        0, GREATEST(1, COALESCE(v_corp.pillar_quality, 1)),
        v_tick, v_tick + v_ticks
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps SET exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick) WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'project_id', v_id,
        'completes_at_tick', v_tick + v_ticks);
END $$;

-- ── start_production_run (from 20270885_production_runs_build_now.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.start_production_run(
    p_corp_id      uuid,
    p_blueprint_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
    v_res  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_res := _production_run_build(p_corp_id, p_blueprint_id);
    IF COALESCE((v_res->>'success')::boolean, false) THEN
        UPDATE entrepreneur_corps SET exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick) WHERE id = p_corp_id;
    END IF;
    RETURN v_res;
END $$;

-- ── submit_public_bid (from 20270852_corp_history_ledger.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.submit_public_bid(
    p_request_id   uuid,
    p_blueprint_id uuid,
    p_price        bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_bp      corp_blueprints%ROWTYPE;
    v_req     construction_project_requests%ROWTYPE;
    v_tick    int;
    v_id      uuid;
    v_ticks   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_price IS NULL OR p_price < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;

    SELECT * INTO v_bp FROM corp_blueprints WHERE id = p_blueprint_id;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;

    -- Lock the corp row: the per-tick allowance check below must
    -- serialize against a concurrent executive action.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_bp.corp_id FOR UPDATE;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT * INTO v_req FROM construction_project_requests WHERE id = p_request_id;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_open',
            'status', v_req.status);
    END IF;
    IF v_req.building_type <> v_bp.building_type THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_type_mismatch');
    END IF;
    -- Regulatory Compliance gates (20270826, superseding the PM
    -- Level III international privilege): the firm must hold the
    -- license tier for the building type, and foreign projects
    -- (request nation ≠ HQ) need the Tier V International Charter.
    IF reg_min_tier(v_req.building_type) > COALESCE(v_corp.reg_tier, 0) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_licensed');
    END IF;
    IF v_req.nation_id IS DISTINCT FROM v_corp.hq_nation_id
       AND COALESCE(v_corp.reg_tier, 0) < 5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'foreign_locked');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_ticks := construction_build_ticks(v_req.building_type, v_corp.pillar_speed);

    BEGIN
        INSERT INTO construction_project_bids (
            request_id, corp_id, blueprint_id, submitted_at_tick,
            price, quality, build_ticks
        ) VALUES (
            p_request_id, v_corp.id, p_blueprint_id, v_tick,
            p_price, GREATEST(1, COALESCE(v_corp.pillar_quality, 1)), v_ticks
        ) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_bid');
    END;

    UPDATE entrepreneur_corps SET exec_action_tick = _corp_exec_spend(exec_action_tick, v_tick) WHERE id = v_corp.id;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Bid $%s for the “%s” build in %s.', p_price, v_req.entity, v_req.city));
    RETURN jsonb_build_object('success', true, 'bid_id', v_id, 'build_ticks', v_ticks);
END $$;

-- ── upgrade_automotive_asset (from 20270890_tax_package_founding_upgrades.sql; 1 spend site re-pointed) ──
CREATE OR REPLACE FUNCTION public.upgrade_automotive_asset(
    p_corp_id uuid,
    p_asset   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tier int;
    v_cost bigint;
    v_tax_city uuid;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_asset NOT IN
       ('design_studio', 'assembly', 'data_center', 'parts_depot', 'franchise') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the treasury debit and tier bump must
    -- serialize against a concurrent upgrade.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    v_tier := COALESCE(CASE p_asset
        WHEN 'design_studio' THEN v_corp.design_studio_tier
        WHEN 'assembly'      THEN v_corp.assembly_tier
        WHEN 'data_center'   THEN v_corp.data_center_tier
        WHEN 'parts_depot'   THEN v_corp.parts_depot_tier
        WHEN 'franchise'     THEN v_corp.franchise_tier
    END, 1);
    IF v_tier >= 5 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'max_tier');
    END IF;

    -- The construction price ladder, aligned by Roman numeral:
    -- II $10M · III $16M · IV $25M · V $40M (Level I is free at
    -- founding). yard_upgrade_cost is the one price source.
    v_cost := yard_upgrade_cost(v_tier + 1);

    -- City tax package (20270890): an active package in the HQ city
    -- discounts the spend 10%; the charge is consumed (with its
    -- +1 Growth / -1 Unemployment rebate) only when the action lands.
    v_tax_city := _tax_package_city(v_corp.hq_nation_id, v_corp.hq_city);
    IF v_tax_city IS NOT NULL THEN
        v_cost := ROUND(v_cost * 0.90);
    END IF;

    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_cost, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    -- The overhaul is the day's executive action (20270855 — the
    -- on-card free upgrades retired with the Logistical Overhaul
    -- card, construction parity).
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    UPDATE entrepreneur_corps SET
        treasury_cash      = COALESCE(treasury_cash, 0) - v_cost,
        exec_action_tick   = _corp_exec_spend(exec_action_tick, v_tick),
        design_studio_tier = CASE WHEN p_asset = 'design_studio' THEN v_tier + 1 ELSE design_studio_tier END,
        assembly_tier      = CASE WHEN p_asset = 'assembly'      THEN v_tier + 1 ELSE assembly_tier END,
        data_center_tier   = CASE WHEN p_asset = 'data_center'   THEN v_tier + 1 ELSE data_center_tier END,
        parts_depot_tier   = CASE WHEN p_asset = 'parts_depot'   THEN v_tier + 1 ELSE parts_depot_tier END,
        franchise_tier     = CASE WHEN p_asset = 'franchise'     THEN v_tier + 1 ELSE franchise_tier END
     WHERE id = p_corp_id;

    IF v_tax_city IS NOT NULL THEN
        PERFORM _consume_tax_package_charge(v_tax_city);
    END IF;

    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Logistical Overhaul — upgraded the %s asset to Level %s ($%s).',
               replace(p_asset, '_', ' '), v_tier + 1, v_cost));

    RETURN jsonb_build_object('success', true,
        'asset', p_asset, 'tier', v_tier + 1, 'cost', v_cost,
        'tax_package_applied', v_tax_city IS NOT NULL);
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
