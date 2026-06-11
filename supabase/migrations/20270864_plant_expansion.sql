-- ════════════════════════════════════════════════════════════════════
-- 20270864 — Propose Plant Expansion (the CMO's pitch to the owner)
--
-- The CMO picks a city; the cost quotes off that city's Jobs at the
-- established −3%-per-Job rate (20270749) on a $25M baseline —
-- plant_expansion_cost is the one source. The pitch lands on the
-- owner's Pressing Issues; ACCEPT debits the treasury and opens a
-- PUBLIC BID for a Tier I Infrastructure in that city, with the
-- payment held as the request's escrow (corp_escrow).
--
-- Award rides the existing chokepoint: _award_construction_bid's
-- no_payer seam is wired — the escrow pays the winning bid, the
-- surplus refunds to the requester, and the build runs a FIXED 18
-- ticks (design ruling). auto_award_construction_bids now sweeps
-- corp requests too (lowest affordable bid at +3 ticks; the mayor
-- path can't touch them — no requester city).
--
-- Completion (complete_construction_projects, re-emitted from
-- 20270827): the requester corp gains +1 bonus assembly line
-- (bonus_assembly_lines; corp_assembly_lines(tier, bonus) is the new
-- one source for line counts — _apply_kit_charge and
-- _start_production_run re-emitted from 20270863 to read it), and
-- the host city moves +2 Growth / −3 Jobs (clamped 1..10).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS bonus_assembly_lines int NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.entrepreneur_corps.bonus_assembly_lines IS
    'Assembly lines gained from completed plant expansions (20270864) — added on top of the Assembly Plant tier''s count by corp_assembly_lines().';

ALTER TABLE public.construction_project_requests
    ADD COLUMN IF NOT EXISTS corp_escrow bigint;
COMMENT ON COLUMN public.construction_project_requests.corp_escrow IS
    'Plant-expansion escrow (20270864): the jobs-priced cost the requester corp paid at pitch acceptance. Pays the winning bid; the surplus refunds at award. KNOWN ISSUE: a request that never draws a bid holds its escrow indefinitely — no expiry/refund valve yet (flagged follow-up).';

CREATE TABLE IF NOT EXISTS public.plant_expansion_proposals (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id             uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    proposer_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    city_id             uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    cost                bigint NOT NULL,
    status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at_tick     int  NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plant_expansion_proposals_corp_idx
    ON public.plant_expansion_proposals (corp_id);

ALTER TABLE public.plant_expansion_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.plant_expansion_proposals;
CREATE POLICY "Allow select for all" ON public.plant_expansion_proposals
    FOR SELECT USING (true);

-- ── plant_expansion_cost — the one quote ──────────────────────────
-- $25M baseline, −3% per city Job (the 20270749 rate; jobs are
-- 1-10, so the natural range is $24.25M down to $17.5M).
CREATE OR REPLACE FUNCTION public.plant_expansion_cost(p_city_id uuid)
RETURNS bigint
LANGUAGE sql STABLE
AS $$
    SELECT ROUND(25000000 * (1 - COALESCE(c.jobs, 0) * 0.03))::bigint
      FROM cities c WHERE c.id = p_city_id;
$$;

REVOKE EXECUTE ON FUNCTION public.plant_expansion_cost(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.plant_expansion_cost(uuid) TO authenticated;

-- ── corp_assembly_lines — the one line count ──────────────────────
CREATE OR REPLACE FUNCTION public.corp_assembly_lines(p_tier int, p_bonus int)
RETURNS int
LANGUAGE sql IMMUTABLE
AS $$
    SELECT assembly_lines(COALESCE(p_tier, 1)) + GREATEST(0, COALESCE(p_bonus, 0));
$$;

REVOKE EXECUTE ON FUNCTION public.corp_assembly_lines(int, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_assembly_lines(int, int) TO authenticated;

-- ── cmo_propose_plant_expansion ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.cmo_propose_plant_expansion(p_city_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_city cities%ROWTYPE;
    v_tick int;
    v_cost bigint;
    v_id   uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    v_fac := _manufacturing_chief_check(v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_cmo');
    END IF;
    SELECT * INTO v_city FROM cities WHERE id = p_city_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;

    -- One pitch on the desk at a time (the CCO-pitch convention).
    IF EXISTS (SELECT 1 FROM plant_expansion_proposals
                WHERE corp_id = v_fac.biz_employer_corp_id AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pitch_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_cost := plant_expansion_cost(p_city_id);

    INSERT INTO plant_expansion_proposals (
        corp_id, proposer_faction_id, city_id, cost, created_at_tick
    ) VALUES (
        v_fac.biz_employer_corp_id, v_fac.id, p_city_id, v_cost, v_tick
    ) RETURNING id INTO v_id;

    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'proposal_id', v_id,
        'cost', v_cost, 'city', v_city.city_name);
END $$;

REVOKE EXECUTE ON FUNCTION public.cmo_propose_plant_expansion(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cmo_propose_plant_expansion(uuid) TO authenticated;

-- ── review_plant_expansion — the owner's ACCEPT / REJECT ──────────
CREATE OR REPLACE FUNCTION public.review_plant_expansion(
    p_proposal_id uuid,
    p_accept      boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_prop plant_expansion_proposals%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_city cities%ROWTYPE;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_proposal_id IS NULL OR p_accept IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_prop FROM plant_expansion_proposals WHERE id = p_proposal_id FOR UPDATE;
    IF v_prop.id IS NULL OR v_prop.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_pending');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_prop.corp_id FOR UPDATE;
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

    IF NOT p_accept THEN
        UPDATE plant_expansion_proposals SET status = 'rejected' WHERE id = v_prop.id;
        RETURN jsonb_build_object('success', true, 'accepted', false);
    END IF;

    -- Validate-then-apply: everything checked before money moves.
    SELECT * INTO v_city FROM cities WHERE id = v_prop.city_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;
    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_prop.cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_prop.cost, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_prop.cost
     WHERE id = v_corp.id;

    INSERT INTO construction_project_requests (
        entity, requester_corp_id, city, nation_id,
        building_type, corp_escrow, created_at_tick
    ) VALUES (
        v_corp.name || ' — Plant Expansion', v_corp.id, v_city.city_name, v_city.nation_id,
        'infrastructure_tier_i', v_prop.cost, v_tick
    );

    UPDATE plant_expansion_proposals SET status = 'accepted' WHERE id = v_prop.id;

    PERFORM _log_corp_history(v_corp.id, v_tick,
        format('Plant expansion approved — a public Tier I Infrastructure bid opens in %s ($%s escrowed).', v_city.city_name, v_prop.cost));

    RETURN jsonb_build_object('success', true, 'accepted', true, 'cost', v_prop.cost);
END $$;

REVOKE EXECUTE ON FUNCTION public.review_plant_expansion(uuid, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.review_plant_expansion(uuid, boolean) TO authenticated;



CREATE OR REPLACE FUNCTION public._apply_kit_charge(p_corp_id uuid, p_action text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_corp entrepreneur_corps%ROWTYPE;
    v_cap  int;
    v_have int;
BEGIN
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    IF p_action IN ('optimize_line', 'lean_procurement', 'tune_tooling') THEN
        -- Max 1 pending charge of each type per assembly line.
        v_cap := corp_assembly_lines(v_corp.assembly_tier, v_corp.bonus_assembly_lines);
        v_have := COALESCE(CASE p_action
            WHEN 'optimize_line'    THEN v_corp.prod_buff_output
            WHEN 'lean_procurement' THEN v_corp.prod_buff_cost
            WHEN 'tune_tooling'     THEN v_corp.prod_buff_aluminum
        END, 0);
        IF v_have >= v_cap THEN
            RETURN jsonb_build_object('success', false, 'reason', 'line_already_tuned',
                'pending', v_have, 'cap', v_cap);
        END IF;
        UPDATE entrepreneur_corps SET
            prod_buff_output   = prod_buff_output   + CASE WHEN p_action = 'optimize_line'    THEN 1 ELSE 0 END,
            prod_buff_cost     = prod_buff_cost     + CASE WHEN p_action = 'lean_procurement' THEN 1 ELSE 0 END,
            prod_buff_aluminum = prod_buff_aluminum + CASE WHEN p_action = 'tune_tooling'     THEN 1 ELSE 0 END
         WHERE id = v_corp.id;
        RETURN jsonb_build_object('success', true,
            'action', p_action, 'pending', v_have + 1, 'cap', v_cap);

    ELSIF p_action IN ('drum_up_buyers', 'sharpen_pitch', 'sweeten_financing') THEN
        -- Max 1 pending charge of each type — campaigns run once a tick.
        v_have := COALESCE(CASE p_action
            WHEN 'drum_up_buyers'    THEN v_corp.sales_buff_units
            WHEN 'sharpen_pitch'     THEN v_corp.sales_buff_appeal
            WHEN 'sweeten_financing' THEN v_corp.sales_buff_price
        END, 0);
        IF v_have >= 1 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'campaign_already_primed');
        END IF;
        UPDATE entrepreneur_corps SET
            sales_buff_units  = sales_buff_units  + CASE WHEN p_action = 'drum_up_buyers'    THEN 1 ELSE 0 END,
            sales_buff_appeal = sales_buff_appeal + CASE WHEN p_action = 'sharpen_pitch'     THEN 1 ELSE 0 END,
            sales_buff_price  = sales_buff_price  + CASE WHEN p_action = 'sweeten_financing' THEN 1 ELSE 0 END
         WHERE id = v_corp.id;
        RETURN jsonb_build_object('success', true, 'action', p_action, 'pending', 1, 'cap', 1);

    ELSIF p_action = 'bench_test_components' THEN
        IF COALESCE(v_corp.design_buff_appeal, 0) >= 1 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'bench_already_charged');
        END IF;
        UPDATE entrepreneur_corps
           SET design_buff_appeal = COALESCE(design_buff_appeal, 0) + 1
         WHERE id = v_corp.id;
        RETURN jsonb_build_object('success', true, 'action', p_action, 'pending', 1, 'cap', 1);

    ELSIF p_action = 'second_shift' THEN
        -- The CMO's overtime rider (20270863) — one pending charge;
        -- the next Production Run builds +25% for +25% cost.
        IF COALESCE(v_corp.prod_buff_overtime, 0) >= 1 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'shift_already_scheduled');
        END IF;
        UPDATE entrepreneur_corps
           SET prod_buff_overtime = COALESCE(prod_buff_overtime, 0) + 1
         WHERE id = v_corp.id;
        RETURN jsonb_build_object('success', true, 'action', p_action, 'pending', 1, 'cap', 1);

    ELSIF p_action = 'log_test_mileage' THEN
        IF COALESCE(v_corp.experience, 0)
           >= design_studio_cap(COALESCE(v_corp.design_studio_tier, 1)) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'experience_at_cap',
                'cap', design_studio_cap(COALESCE(v_corp.design_studio_tier, 1)));
        END IF;
        UPDATE entrepreneur_corps
           SET experience = LEAST(design_studio_cap(COALESCE(design_studio_tier, 1)),
                                  COALESCE(experience, 0) + 1)
         WHERE id = v_corp.id;
        RETURN jsonb_build_object('success', true, 'action', p_action, 'pending', 1, 'cap', 1);
    END IF;

    RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
END $$;

REVOKE EXECUTE ON FUNCTION public._apply_kit_charge(uuid, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._start_production_run(
    p_corp_id      uuid,
    p_blueprint_id uuid,
    p_quantity     int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_corp  entrepreneur_corps%ROWTYPE;
    v_bp    vehicle_blueprints%ROWTYPE;
    v_tick  int;
    v_unit  bigint;
    v_total bigint;
    v_aluminum numeric;
    v_components int;
    v_bonus int := 0;
    v_id    uuid;
BEGIN
    IF p_corp_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    -- 50 vehicles per tick per line (vehicle_production_rate,
    -- 20270854): the line is assigned ceil(quantity ÷ rate) ticks.
    -- 200 bounds runaway assignments; the depot's materials are the
    -- real limiter.
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 200 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_quantity');
    END IF;

    -- Lock the corp row: the allowance, the line check, and the
    -- treasury debit below must serialize against concurrent runs.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'automotive' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_bp FROM vehicle_blueprints
     WHERE id = p_blueprint_id AND corp_id = p_corp_id;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;

    -- Assembly lines by plant level (20270842): 1/2/2/3/4 concurrent
    -- runs. (The Level III+ Superior / Automated line efficiencies
    -- await their production model.)
    IF (SELECT COUNT(*) FROM vehicle_production_runs
         WHERE corp_id = p_corp_id AND status = 'running')
       >= corp_assembly_lines(v_corp.assembly_tier, v_corp.bonus_assembly_lines) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_line_available');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_unit  := GREATEST(1, COALESCE(v_bp.xp_cost, 1)) * 5000;
    v_total := v_unit * p_quantity;
    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_total, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    -- Materials are assigned when the run starts — the whole order's
    -- worth must be in the depot up front. Aluminum: 0.5/motorcycle,
    -- 2/pickup, 1 otherwise (20270851). Electrical Components ride
    -- the design: hybrid 1 / basic EV 2 / performance EV 3, +1 each
    -- for the Technology and Self-Driving packages.
    v_aluminum := vehicle_aluminum_per_unit(v_bp.vehicle_type) * p_quantity;
    v_components := vehicle_components_per_unit(v_bp.engine, v_bp.packages) * p_quantity;

    -- Production Engineer buffs (20270845): one pending charge of
    -- each type rides this run, then falls off. Cost −10%, Aluminum
    -- −10% (rounded to the half-unit), output +10% (round up, min
    -- +1 — the bonus cars land at completion, costing no extra
    -- ticks, dollars, or Aluminum).
    IF COALESCE(v_corp.prod_buff_cost, 0) > 0 THEN
        v_total := ROUND(v_total * 0.90);
    END IF;
    IF COALESCE(v_corp.prod_buff_aluminum, 0) > 0 THEN
        v_aluminum := ROUND(v_aluminum * 0.90 * 2) / 2.0;
    END IF;
    IF COALESCE(v_corp.prod_buff_output, 0) > 0 THEN
        v_bonus := GREATEST(1, CEIL(p_quantity * 0.10))::int;
    END IF;

    -- Second Shift (20270863, the CMO's rider): the plant runs
    -- overtime — +25% output for +25% cost, applied after the
    -- engineer's discounts; the bonus vehicles stack with the
    -- line-tuning +10% and land at completion the same way.
    IF COALESCE(v_corp.prod_buff_overtime, 0) > 0 THEN
        v_total := ROUND(v_total * 1.25);
        v_bonus := v_bonus + GREATEST(1, CEIL(p_quantity * 0.25))::int;
    END IF;

    IF COALESCE(v_corp.aluminum_stock, 0) < v_aluminum THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_aluminum',
            'need', v_aluminum, 'have', COALESCE(v_corp.aluminum_stock, 0));
    END IF;
    IF COALESCE(v_corp.components_stock, 0) < v_components THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_components',
            'need', v_components, 'have', COALESCE(v_corp.components_stock, 0));
    END IF;

    INSERT INTO vehicle_production_runs (
        corp_id, blueprint_id, quantity, unit_cost, total_cost,
        started_tick, completes_at_tick, bonus_units
    ) VALUES (
        p_corp_id, p_blueprint_id, p_quantity, v_unit, v_total,
        v_tick, v_tick + CEIL(p_quantity::numeric / vehicle_production_rate())::int, v_bonus
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_total,
           aluminum_stock = COALESCE(aluminum_stock, 0) - v_aluminum,
           components_stock = COALESCE(components_stock, 0) - v_components,
           prod_buff_cost     = GREATEST(0, COALESCE(prod_buff_cost, 0) - 1),
           prod_buff_aluminum = GREATEST(0, COALESCE(prod_buff_aluminum, 0) - 1),
           prod_buff_output   = GREATEST(0, COALESCE(prod_buff_output, 0) - 1),
           prod_buff_overtime = GREATEST(0, COALESCE(prod_buff_overtime, 0) - 1)
     WHERE id = p_corp_id;

    PERFORM _log_corp_history(p_corp_id, v_tick, format('Started a production run — %s × %s ($%s).', p_quantity, v_bp.name, v_total));
    RETURN jsonb_build_object('success', true, 'run_id', v_id,
        'quantity', p_quantity, 'unit_cost', v_unit, 'total_cost', v_total,
        'bonus_units', v_bonus,
        'completes_at_tick', v_tick + CEIL(p_quantity::numeric / vehicle_production_rate())::int);
END $$;

REVOKE EXECUTE ON FUNCTION public._start_production_run(uuid, uuid, int) FROM PUBLIC;

-- ── _award_construction_bid (internal) ────────────────────────────
CREATE OR REPLACE FUNCTION public._award_construction_bid(p_bid_id uuid, p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_bid  construction_project_bids%ROWTYPE;
    v_req  construction_project_requests%ROWTYPE;
    v_city cities%ROWTYPE;
    v_id   uuid;
BEGIN
    SELECT * INTO v_bid FROM construction_project_bids WHERE id = p_bid_id FOR UPDATE;
    IF v_bid.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_found');
    END IF;
    IF v_bid.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bid_not_pending');
    END IF;

    SELECT * INTO v_req FROM construction_project_requests
     WHERE id = v_bid.request_id FOR UPDATE;
    IF v_req.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_open');
    END IF;
    IF v_req.requester_city_id IS NULL THEN
        -- Plant expansions (20270864): the requester corp escrowed
        -- the jobs-priced cost at pitch acceptance. A bid over the
        -- escrow is unaffordable (auto-award skips to the next-
        -- lowest); the surplus refunds to the requester at award.
        IF v_req.requester_corp_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_payer');
        END IF;
        IF COALESCE(v_req.corp_escrow, 0) < v_bid.price THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_escrow',
                'escrow', COALESCE(v_req.corp_escrow, 0), 'price', v_bid.price);
        END IF;
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0)
                             + (COALESCE(v_req.corp_escrow, 0) - v_bid.price)
         WHERE id = v_req.requester_corp_id;
        SELECT * INTO v_city FROM cities
         WHERE nation_id = v_req.nation_id AND city_name = v_req.city;
    ELSE
        SELECT * INTO v_city FROM cities WHERE id = v_req.requester_city_id FOR UPDATE;
        IF v_city.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
        END IF;
        IF COALESCE(v_city.budget, 0) < v_bid.price THEN
            RETURN jsonb_build_object('success', false, 'reason', 'insufficient_city_budget',
                'budget', COALESCE(v_city.budget, 0), 'price', v_bid.price);
        END IF;

        -- Escrow: the city pays now, the corp collects at completion.
        UPDATE cities SET budget = COALESCE(budget, 0) - v_bid.price
         WHERE id = v_city.id;
    END IF;

    UPDATE construction_project_bids SET status = 'won' WHERE id = p_bid_id;
    UPDATE construction_project_bids SET status = 'lost'
     WHERE request_id = v_req.id AND status = 'pending';
    UPDATE construction_project_requests SET status = 'awarded'
     WHERE id = v_req.id;

    INSERT INTO corp_construction_projects (
        request_id, bid_id, corp_id, blueprint_id, city_id, city,
        price, quality, started_tick, completes_at_tick
    ) VALUES (
        v_req.id, p_bid_id, v_bid.corp_id, v_bid.blueprint_id,
        v_city.id, v_req.city, v_bid.price, v_bid.quality,
        p_tick, p_tick + CASE WHEN v_req.requester_corp_id IS NOT NULL
                              THEN 18 ELSE GREATEST(1, v_bid.build_ticks) END
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'project_id', v_id,
        'completes_at_tick', p_tick + CASE WHEN v_req.requester_corp_id IS NOT NULL
                                           THEN 18 ELSE GREATEST(1, v_bid.build_ticks) END);
END $$;

REVOKE EXECUTE ON FUNCTION public._award_construction_bid(uuid, int) FROM PUBLIC;

-- ── auto_award_construction_bids — the 3-tick fallback ────────────
CREATE OR REPLACE FUNCTION public.auto_award_construction_bids(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_req     RECORD;
    v_bid     RECORD;
    v_res     jsonb;
    v_awarded int := 0;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    FOR v_req IN
        SELECT r.id FROM construction_project_requests r
         WHERE r.status = 'open'
           AND (r.requester_city_id IS NOT NULL OR r.requester_corp_id IS NOT NULL)
           AND p_tick - r.created_at_tick >= 3
           AND EXISTS (SELECT 1 FROM construction_project_bids b
                        WHERE b.request_id = r.id AND b.status = 'pending')
         ORDER BY r.created_at_tick
    LOOP
        -- Lowest price the city can afford; an unaffordable lowball
        -- is skipped for the next-lowest.
        FOR v_bid IN
            SELECT b.id FROM construction_project_bids b
             WHERE b.request_id = v_req.id AND b.status = 'pending'
             ORDER BY b.price ASC, b.created_at ASC
        LOOP
            v_res := _award_construction_bid(v_bid.id, p_tick);
            IF (v_res->>'success')::boolean THEN
                v_awarded := v_awarded + 1;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'awarded', v_awarded);
END $$;

REVOKE EXECUTE ON FUNCTION public.auto_award_construction_bids(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.auto_award_construction_bids(int) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_construction_projects(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_proj      RECORD;
    v_completed int := 0;
    v_tier      text;
    v_aff       numeric;
    v_app       numeric;
    v_req       construction_project_requests%ROWTYPE;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    FOR v_proj IN
        SELECT p.* FROM corp_construction_projects p
         WHERE p.status = 'building' AND p.completes_at_tick <= p_tick
           -- 20270817: a due build PARKS until its blueprint's
           -- materials have been supplied; it completes on the first
           -- sweep after the yard delivers. Blueprint-less projects
           -- owe nothing.
           AND p.materials_supplied >= COALESCE((
               SELECT b.materials_needed FROM corp_blueprints b
                WHERE b.id = p.blueprint_id), 0)
           -- 20270821: and one committed equipment use.
           AND p.equipment_supplied >= 1
         FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE corp_construction_projects SET status = 'completed'
         WHERE id = v_proj.id;
        -- The escrowed price lands; stamped through the revenue
        -- accumulator so the Finances cards and corporate tax both
        -- see construction income.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_proj.price,
               -- 20270823: completion grants Experience — System
               -- Design's +3 baseline plus the PM ladder bonus.
               -- 20270827: grant scales with System Design + PM,
               -- clamped at the design tier's Experience cap.
               experience = LEAST(experience_cap(design_tier),
                   COALESCE(experience, 0)
                   + completion_experience(pm_tier, design_tier))
         WHERE id = v_proj.corp_id;
        PERFORM stamp_entrepreneur_corp_revenue(v_proj.corp_id, p_tick, v_proj.price);

        -- Quality-tier city effects (20270810): the finished building
        -- moves the host city's stats. Tier comes from the blueprint
        -- (one source); a deleted blueprint or a city-less project
        -- simply applies nothing. Clamped 1..10 like the ordinance
        -- resolver's stat moves.
        --   low_cost +0.1 Affordability · standard — ·
        --   high_end −0.1 Affordability · luxury and ultra_rich
        --   −0.3 Affordability and +0.1 Appeal
        IF v_proj.city_id IS NOT NULL AND v_proj.blueprint_id IS NOT NULL THEN
            SELECT quality_tier INTO v_tier
              FROM corp_blueprints WHERE id = v_proj.blueprint_id;
            v_aff := CASE v_tier
                WHEN 'low_cost'   THEN  0.1
                WHEN 'high_end'   THEN -0.1
                WHEN 'luxury'     THEN -0.3
                WHEN 'ultra_rich' THEN -0.3
                ELSE 0 END;
            v_app := CASE v_tier WHEN 'luxury' THEN 0.1 WHEN 'ultra_rich' THEN 0.1 ELSE 0 END;
            IF v_aff <> 0 OR v_app <> 0 THEN
                UPDATE cities
                   SET affordability = GREATEST(1, LEAST(10, COALESCE(affordability, 5) + v_aff)),
                       appeal        = GREATEST(1, LEAST(10, COALESCE(appeal, 5)        + v_app))
                 WHERE id = v_proj.city_id;
            END IF;
        END IF;

        -- Plant expansion (20270864): a corp-requested build coming
        -- online adds one assembly line to the requester and moves
        -- the host city — +2 Growth, −3 Jobs (clamped 1..10).
        SELECT * INTO v_req FROM construction_project_requests
         WHERE id = v_proj.request_id;
        IF v_req.requester_corp_id IS NOT NULL THEN
            UPDATE entrepreneur_corps
               SET bonus_assembly_lines = COALESCE(bonus_assembly_lines, 0) + 1
             WHERE id = v_req.requester_corp_id;
            IF v_proj.city_id IS NOT NULL THEN
                UPDATE cities
                   SET growth = GREATEST(1, LEAST(10, COALESCE(growth, 5) + 2)),
                       jobs   = GREATEST(1, LEAST(10, COALESCE(jobs, 5) - 3))
                 WHERE id = v_proj.city_id;
            END IF;
            PERFORM _log_corp_history(v_req.requester_corp_id, p_tick,
                format('Plant expansion in %s complete — a new assembly line comes online.', v_proj.city));
        END IF;

        v_completed := v_completed + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'completed', v_completed);
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
