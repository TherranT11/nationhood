-- ════════════════════════════════════════════════════════════════════
-- REQUEST CONSTRUCTION — commission a building, builders bid, delivered
-- ════════════════════════════════════════════════════════════════════
-- A corp can REQUEST any building it can own (regional_hq + its sector
-- building(s)); construction corps with a completed Construction Yard in
-- that nation bid a price; lowest auto-wins at the deadline and builds over
-- the building's standard duration; on completion the finished building is
-- delivered to the requester. Built on the dormant ent_construction_contracts
-- system (20270216) — extended, not duplicated.
--
-- Locked model (per design owner):
--   • Builder PAYS the standard construction cost (a money sink) on
--     completion; the requester's winning bid is the builder's revenue, so
--     margin = bid − cost. Bid floor = the construction cost.
--   • NO escrow. Money settles atomically at completion: if the requester
--     can't cover the winning bid then, the contract FAILS — nobody is
--     charged and no building is delivered. The builder pays nothing until
--     completion succeeds, so a broke requester costs the builder only time.
--   • A commissioned build consumes the builder's Construction-Yard capacity
--     (CY × 2 concurrent), pooled with its self-builds.
--
-- Cost/duration come from corp_building_cost_profile — the SAME numbers
-- begin_construction uses (extracted here as the one source). Completion
-- delivers via a 'completed' corp_buildings row + the same +0.2 GDP growth
-- self-builds get (20270166).
--
-- ⚠ process_ent_construction_contracts was never wired into a tick, so the
-- contract system has never run. This migration only defines the SQL; the
-- processor is wired into advance-tick in the same commit (handler template
-- + regenerated edge function).
--
-- Idempotent (ADD COLUMN IF NOT EXISTS / CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: building-delivery fields on the contract ───────────
ALTER TABLE ent_construction_contracts ADD COLUMN IF NOT EXISTS building_type         text;
ALTER TABLE ent_construction_contracts ADD COLUMN IF NOT EXISTS nation_id             uuid REFERENCES nations(id) ON DELETE CASCADE;
ALTER TABLE ent_construction_contracts ADD COLUMN IF NOT EXISTS tier                  text;
ALTER TABLE ent_construction_contracts ADD COLUMN IF NOT EXISTS build_cost            bigint;  -- cost snapshot at request = bid floor + completion sink
ALTER TABLE ent_construction_contracts ADD COLUMN IF NOT EXISTS delivered_building_id uuid REFERENCES corp_buildings(id) ON DELETE SET NULL;
-- Building-delivery contracts don't use spec_tier (legacy gov-effects field).
ALTER TABLE ent_construction_contracts ALTER COLUMN spec_tier DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ent_cc_building_open
    ON ent_construction_contracts (status, nation_id) WHERE building_type IS NOT NULL;

-- ── 2. corp_building_cost_profile — single source for cost/duration ─
-- Extracted from begin_construction (20270172/20270180/20270224). Plants
-- pin a fixed effective tier (engine→medium, light→large) which supplies
-- duration + ambition, and a fixed cost base. Everything scales by the
-- nation Infra/CoL multiplier. cost = NULL signals an invalid tier.
CREATE OR REPLACE FUNCTION public.corp_building_cost_profile(
    p_building_type text,
    p_tier          text,
    p_nation_id     uuid,
    OUT eff_tier    text,
    OUT cost        bigint,
    OUT duration    int,
    OUT ambition    smallint,
    OUT col         numeric,
    OUT inf         numeric,
    OUT mult        numeric
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_cost_base bigint;
    v_dur_base  int;
BEGIN
    eff_tier := CASE p_building_type
        WHEN 'engine_assembly_plant' THEN 'medium'
        WHEN 'light_assembly_plant'  THEN 'large'
        ELSE p_tier
    END;

    v_cost_base := CASE eff_tier
        WHEN 'small'      THEN 20000000
        WHEN 'medium'     THEN 50000000
        WHEN 'large'      THEN 100000000
        WHEN 'major'      THEN 200000000
        WHEN 'monumental' THEN 400000000
        ELSE NULL
    END;
    v_dur_base := CASE eff_tier
        WHEN 'small' THEN 24 WHEN 'medium' THEN 27 WHEN 'large' THEN 30
        WHEN 'major' THEN 33 WHEN 'monumental' THEN 36 ELSE NULL
    END;
    ambition := CASE eff_tier
        WHEN 'small' THEN 1 WHEN 'medium' THEN 2 WHEN 'large' THEN 3
        WHEN 'major' THEN 4 WHEN 'monumental' THEN 5 ELSE NULL
    END;

    -- Fixed per-type cost for plants (overrides the tier base).
    IF p_building_type = 'engine_assembly_plant' THEN
        v_cost_base := 45000000;
    ELSIF p_building_type = 'light_assembly_plant' THEN
        v_cost_base := 75000000;
    END IF;

    SELECT COALESCE(cost_of_living, 50), COALESCE(infrastructure, 50)
      INTO col, inf
      FROM nations WHERE id = p_nation_id;
    col  := COALESCE(col, 50);
    inf  := COALESCE(inf, 50);
    mult := (0.5 + col / 100.0) * (0.5 + (100 - inf) / 100.0);

    IF v_cost_base IS NULL THEN
        cost := NULL; duration := NULL;       -- invalid tier
    ELSE
        cost     := ROUND(v_cost_base::numeric * mult)::bigint;
        duration := GREATEST(1, ROUND(v_dur_base::numeric * mult)::int);
    END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.corp_building_cost_profile(text, text, uuid) TO authenticated;

COMMENT ON FUNCTION public.corp_building_cost_profile(text, text, uuid) IS
    'Single source for a corp building''s cost / duration / ambition given type+tier+nation. Plants pin medium/large + fixed cost; everything × the Infra/CoL multiplier. cost=NULL means invalid tier. Used by begin_construction + the Request Construction flow.';

-- ── 3. corp_commercial_build_load — shared CY-capacity pool ─────────
-- A corp's concurrent commercial-build load in a nation = its in-progress
-- self-built commercial buildings + its active commissioned commercial
-- contracts. RHQ/CY are infrastructure and never counted. The capacity cap
-- is (completed CYs in nation) × 2, checked by both begin_construction and
-- the contract award.
CREATE OR REPLACE FUNCTION public.corp_commercial_build_load(p_corp_id uuid, p_nation_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT (
        (SELECT count(*) FROM corp_buildings
          WHERE builder_corp_id = p_corp_id AND nation_id = p_nation_id
            AND status = 'in_progress'
            AND building_type IN ('port','banking_office','real_estate_office',
                                  'engine_assembly_plant','light_assembly_plant'))
      + (SELECT count(*) FROM ent_construction_contracts
          WHERE winner_corp_id = p_corp_id AND nation_id = p_nation_id
            AND status = 'active'
            AND building_type IN ('port','banking_office','real_estate_office',
                                  'engine_assembly_plant','light_assembly_plant'))
    )::int;
$$;
GRANT EXECUTE ON FUNCTION public.corp_commercial_build_load(uuid, uuid) TO authenticated;

-- ── 4. begin_construction — use the shared cost + capacity helpers ──
-- Body of 20270224 (corp treasury_cash payer, plant types) with the inline
-- cost CASE replaced by corp_building_cost_profile and the inline capacity
-- count replaced by corp_commercial_build_load (so self-builds + commissions
-- share one capacity pool).
CREATE OR REPLACE FUNCTION public.begin_construction(
    p_corp_id        uuid,
    p_nation_id      uuid,
    p_name           text,
    p_tier           text,
    p_building_type  text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_corp         entrepreneur_corps%ROWTYPE;
    v_fac          factions%ROWTYPE;
    v_prof         record;
    v_eff_tier     text;
    v_cost         bigint;
    v_duration     int;
    v_ambition     smallint;
    v_tick         int;
    v_nation_name  text;
    v_id           uuid;
    v_has_rhq      boolean;
    v_cy_count     int;
    v_load         int;
    v_corp_cash    numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_building_type NOT IN ('regional_hq','construction_yard','port','banking_office',
                               'real_estate_office','engine_assembly_plant','light_assembly_plant') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_construction_corp');
    END IF;

    SELECT name INTO v_nation_name FROM nations WHERE id = p_nation_id;
    IF v_nation_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT * INTO v_prof FROM corp_building_cost_profile(p_building_type, p_tier, p_nation_id);
    v_eff_tier := v_prof.eff_tier;
    v_cost     := v_prof.cost;
    v_duration := v_prof.duration;
    v_ambition := v_prof.ambition;
    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;
    IF p_building_type = 'regional_hq' AND v_eff_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    IF p_building_type <> 'regional_hq' THEN
        IF p_nation_id <> v_corp.hq_nation_id THEN
            SELECT EXISTS (
                SELECT 1 FROM corp_buildings
                 WHERE owner_corp_id = p_corp_id
                   AND nation_id = p_nation_id
                   AND building_type = 'regional_hq'
                   AND status = 'completed'
            ) INTO v_has_rhq;
            IF NOT v_has_rhq THEN
                RETURN jsonb_build_object('success', false, 'reason', 'no_rhq_in_nation');
            END IF;
        END IF;
    END IF;

    -- Capacity gate (CY × 2) for commercial builds; shared pool with
    -- commissioned contracts via corp_commercial_build_load.
    IF p_building_type IN ('port','banking_office','real_estate_office',
                           'engine_assembly_plant','light_assembly_plant') THEN
        SELECT COUNT(*) INTO v_cy_count FROM corp_buildings
         WHERE owner_corp_id = p_corp_id
           AND nation_id = p_nation_id
           AND building_type = 'construction_yard'
           AND status = 'completed';
        v_load := corp_commercial_build_load(p_corp_id, p_nation_id);
        IF v_load >= v_cy_count * 2 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'capacity_exceeded',
                'cy_count', v_cy_count, 'max', v_cy_count * 2, 'in_progress', v_load);
        END IF;
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_corp_cash := COALESCE(v_corp.treasury_cash, 0);
    IF v_corp_cash < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_corp_cash::bigint, 'need', v_cost, 'payer', 'corp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_cost, updated_at = now()
     WHERE id = p_corp_id;
    UPDATE factions
       SET ent_ambition = COALESCE(ent_ambition, 0) + v_ambition
     WHERE id = v_fac.id;

    INSERT INTO corp_buildings
        (builder_corp_id, owner_corp_id, nation_id, name, tier, building_type,
         cost_paid, ambition_granted, status, started_at_tick, completes_at_tick)
    VALUES
        (p_corp_id, p_corp_id, p_nation_id, btrim(p_name), v_eff_tier, p_building_type,
         v_cost, v_ambition, 'in_progress', v_tick, v_tick + v_duration)
    RETURNING id INTO v_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        p_nation_id, v_fac.id, 'Construction Begins',
        format('%s breaks ground on %s (%s) in %s.',
               v_corp.name, btrim(p_name),
               CASE p_building_type
                   WHEN 'regional_hq'           THEN 'Regional HQ'
                   WHEN 'construction_yard'      THEN 'Construction Yard'
                   WHEN 'port'                   THEN 'Port'
                   WHEN 'banking_office'         THEN 'Banking Office'
                   WHEN 'real_estate_office'     THEN 'Real Estate Office'
                   WHEN 'engine_assembly_plant'  THEN 'Engine Assembly Plant'
                   WHEN 'light_assembly_plant'   THEN 'Light Assembly Plant'
               END, v_nation_name),
        'corporate', 'begin_construction',
        jsonb_build_object(
            'building_id', v_id, 'corp_id', p_corp_id, 'corp_name', v_corp.name,
            'tier', v_eff_tier, 'building_type', p_building_type, 'cost', v_cost,
            'duration', v_duration, 'completes_at_tick', v_tick + v_duration,
            'ambition_bump', v_ambition, 'cost_multiplier', ROUND(v_prof.mult, 3),
            'cost_of_living', v_prof.col, 'infrastructure', v_prof.inf, 'payer', 'corp_treasury'
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success', true, 'building_id', v_id, 'tier', v_eff_tier,
        'building_type', p_building_type, 'cost', v_cost, 'duration', v_duration,
        'ambition_bump', v_ambition, 'started_at_tick', v_tick,
        'completes_at_tick', v_tick + v_duration,
        'corp_cash_after', (v_corp_cash - v_cost)::bigint, 'cost_multiplier', ROUND(v_prof.mult, 3)
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.begin_construction(uuid, uuid, text, text, text) TO authenticated;

-- ── 5. request_building_construction — issue a building-delivery RFP ─
CREATE OR REPLACE FUNCTION public.request_building_construction(
    p_corp_id       uuid,
    p_name          text,
    p_building_type text,
    p_nation_id     uuid,
    p_tier          text,
    p_budget        bigint,
    p_bidding_ticks int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_fac          factions%ROWTYPE;
    v_corp         entrepreneur_corps%ROWTYPE;
    v_req_sector   text;
    v_prof         record;
    v_nation_name  text;
    v_tick         int;
    v_id           uuid;
    v_num          text;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments'); END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_building_type NOT IN ('regional_hq','construction_yard','port','banking_office',
                               'real_estate_office','engine_assembly_plant','light_assembly_plant') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    -- Requester can only commission what its industry can OWN (sector lock).
    v_req_sector := corp_building_required_sector(p_building_type);
    IF v_req_sector IS NOT NULL AND v_req_sector <> v_corp.industry THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_sector',
            'required', v_req_sector, 'have', v_corp.industry);
    END IF;

    SELECT name INTO v_nation_name FROM nations WHERE id = p_nation_id;
    IF v_nation_name IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found'); END IF;

    SELECT * INTO v_prof FROM corp_building_cost_profile(p_building_type, p_tier, p_nation_id);
    IF v_prof.cost IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier'); END IF;
    IF p_building_type = 'regional_hq' AND v_prof.eff_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    -- Budget must at least cover the construction cost (the bid floor).
    IF p_budget IS NULL OR p_budget < v_prof.cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'budget_below_floor', 'floor', v_prof.cost);
    END IF;
    -- Sanity (not locked — settled at completion): must be able to afford the floor now.
    IF COALESCE(v_corp.treasury_cash, 0) < v_prof.cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_corp.treasury_cash, 0)::bigint, 'need', v_prof.cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_num  := 'BLD-' || v_tick || '-' || left(replace(gen_random_uuid()::text, '-', ''), 5);

    INSERT INTO ent_construction_contracts (
        contract_number, name, contract_type, issuer_corp_id, issuer_name,
        building_type, nation_id, tier, build_cost, spec_tier, budget, timeline_ticks,
        bidding_closes_tick, completion_effects, created_at_tick
    ) VALUES (
        v_num, btrim(p_name), 'private', p_corp_id, v_corp.name,
        p_building_type, p_nation_id, v_prof.eff_tier, v_prof.cost, NULL, p_budget, v_prof.duration,
        v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)), '{}'::jsonb, v_tick
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'contract_id', v_id,
        'floor', v_prof.cost, 'timeline_ticks', v_prof.duration,
        'bidding_closes_tick', v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)));
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_building_construction(uuid, text, text, uuid, text, bigint, int) TO authenticated;

-- ── 6. ent_place_construction_bid — CY-in-nation gate + floor ───────
-- Body of 20270216 plus, for building-delivery contracts: bidder must own a
-- completed Construction Yard in the contract's nation, and the bid must be
-- at least the construction-cost floor.
CREATE OR REPLACE FUNCTION public.ent_place_construction_bid(
    p_corp_id     uuid,
    p_contract_id uuid,
    p_bid_amount  bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_fac      factions%ROWTYPE;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_contract ent_construction_contracts%ROWTYPE;
    v_has_cy   boolean;
    v_tick     int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_bid_amount IS NULL OR p_bid_amount <= 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    IF v_corp.industry <> 'construction' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_construction'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_contract FROM ent_construction_contracts WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found'); END IF;
    IF v_contract.status <> 'open' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_open'); END IF;
    IF v_contract.issuer_corp_id IS NOT NULL AND v_contract.issuer_corp_id = p_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'own_contract');
    END IF;
    IF p_bid_amount > v_contract.budget THEN
        RETURN jsonb_build_object('success', false, 'reason', 'over_budget', 'budget', v_contract.budget);
    END IF;

    -- Building-delivery contracts: local-presence + floor gates.
    IF v_contract.building_type IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM corp_buildings
             WHERE owner_corp_id = p_corp_id AND nation_id = v_contract.nation_id
               AND building_type = 'construction_yard' AND status = 'completed'
        ) INTO v_has_cy;
        IF NOT v_has_cy THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_cy_in_nation');
        END IF;
        IF v_contract.build_cost IS NOT NULL AND p_bid_amount < v_contract.build_cost THEN
            RETURN jsonb_build_object('success', false, 'reason', 'bid_below_floor', 'floor', v_contract.build_cost);
        END IF;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO ent_construction_bids (contract_id, bidder_corp_id, bid_amount, created_tick)
    VALUES (p_contract_id, p_corp_id, p_bid_amount, v_tick)
    ON CONFLICT (contract_id, bidder_corp_id)
        DO UPDATE SET bid_amount = EXCLUDED.bid_amount, status = 'pending', created_tick = EXCLUDED.created_tick;

    RETURN jsonb_build_object('success', true, 'bid_amount', p_bid_amount);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ent_place_construction_bid(uuid, uuid, bigint) TO authenticated;

-- ── 7. process_ent_construction_contracts — capacity-aware award +
--        building delivery on completion ──
CREATE OR REPLACE FUNCTION public.process_ent_construction_contracts(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    RAW_PER_ABSTRACT constant numeric := 1000000;
    v_tick       int;
    c            RECORD;
    v_bid        RECORD;
    v_winner_id  uuid;
    v_winner_bid bigint;
    v_cy_count   int;
    v_commercial boolean;
    v_cost       bigint;
    v_bid_id     uuid;
    v_pay_ok     boolean;
    v_eff        jsonb;
    v_bld_id     uuid;
    v_awarded    int := 0;
    v_cancelled  int := 0;
    v_completed  int := 0;
    v_failed     int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

    -- (A) Award at close. Building contracts: lowest bidder who isn't over
    -- CY capacity (commercial types). Legacy contracts: plain lowest bid.
    FOR c IN
        SELECT * FROM ent_construction_contracts
         WHERE status = 'open' AND bidding_closes_tick <= v_tick FOR UPDATE
    LOOP
        v_winner_id := NULL; v_winner_bid := NULL; v_bid_id := NULL;

        IF c.building_type IS NOT NULL THEN
            v_commercial := c.building_type IN ('port','banking_office','real_estate_office',
                                                'engine_assembly_plant','light_assembly_plant');
            FOR v_bid IN
                SELECT * FROM ent_construction_bids
                 WHERE contract_id = c.id AND status = 'pending'
                 ORDER BY bid_amount ASC, created_tick ASC
            LOOP
                IF v_commercial THEN
                    SELECT COUNT(*) INTO v_cy_count FROM corp_buildings
                     WHERE owner_corp_id = v_bid.bidder_corp_id AND nation_id = c.nation_id
                       AND building_type = 'construction_yard' AND status = 'completed';
                    IF corp_commercial_build_load(v_bid.bidder_corp_id, c.nation_id) >= v_cy_count * 2 THEN
                        CONTINUE;   -- bidder at capacity; try next-lowest
                    END IF;
                END IF;
                v_winner_id := v_bid.bidder_corp_id; v_winner_bid := v_bid.bid_amount; v_bid_id := v_bid.id;
                EXIT;
            END LOOP;
        ELSE
            SELECT id, bidder_corp_id, bid_amount INTO v_bid_id, v_winner_id, v_winner_bid
              FROM ent_construction_bids
             WHERE contract_id = c.id AND status = 'pending'
             ORDER BY bid_amount ASC, created_tick ASC LIMIT 1;
        END IF;

        IF v_winner_id IS NULL THEN
            UPDATE ent_construction_contracts SET status = 'cancelled' WHERE id = c.id;
            UPDATE ent_construction_bids SET status = 'lost' WHERE contract_id = c.id AND status = 'pending';
            v_cancelled := v_cancelled + 1;
            CONTINUE;
        END IF;

        UPDATE ent_construction_contracts
           SET status = 'active', winner_corp_id = v_winner_id,
               winning_bid = v_winner_bid, started_at_tick = v_tick, progress_ticks = 0
         WHERE id = c.id;
        UPDATE ent_construction_bids SET status = 'won'  WHERE id = v_bid_id;
        UPDATE ent_construction_bids SET status = 'lost'
         WHERE contract_id = c.id AND id <> v_bid_id AND status = 'pending';
        v_awarded := v_awarded + 1;
    END LOOP;

    -- (B) Advance + complete active builds (started_at_tick < v_tick excludes
    -- contracts awarded this tick → a timeline_ticks=N job completes N ticks later).
    FOR c IN
        SELECT * FROM ent_construction_contracts
         WHERE status = 'active' AND started_at_tick < v_tick FOR UPDATE
    LOOP
        IF c.progress_ticks + 1 < c.timeline_ticks THEN
            UPDATE ent_construction_contracts SET progress_ticks = progress_ticks + 1 WHERE id = c.id;
            CONTINUE;
        END IF;

        IF c.winner_corp_id IS NULL THEN
            UPDATE ent_construction_contracts SET status = 'failed', progress_ticks = c.timeline_ticks WHERE id = c.id;
            v_failed := v_failed + 1;
            CONTINUE;
        END IF;

        -- ── Building-delivery completion: atomic settle, then deliver ──
        IF c.building_type IS NOT NULL THEN
            -- Cost was snapshot at request (build_cost), so stat drift during
            -- the build can't push it above the bid floor the builder agreed to.
            v_cost := COALESCE(c.build_cost, 0);

            -- Requester must cover the winning bid now, else the whole
            -- contract fails — nobody charged, no building delivered.
            UPDATE entrepreneur_corps
               SET treasury_cash = COALESCE(treasury_cash, 0) - c.winning_bid, updated_at = now()
             WHERE id = c.issuer_corp_id AND COALESCE(treasury_cash, 0) >= c.winning_bid;
            IF NOT FOUND THEN
                UPDATE ent_construction_contracts SET status = 'failed', progress_ticks = c.timeline_ticks WHERE id = c.id;
                v_failed := v_failed + 1;
                CONTINUE;
            END IF;

            -- Pay the builder the bid, then sink the construction cost.
            -- bid >= floor = cost, so the builder is always solvent here.
            UPDATE entrepreneur_corps
               SET treasury_cash = COALESCE(treasury_cash, 0) + c.winning_bid - v_cost, updated_at = now()
             WHERE id = c.winner_corp_id;

            -- Deliver the finished building to the requester (built by the winner).
            INSERT INTO corp_buildings (
                builder_corp_id, owner_corp_id, nation_id, name, tier, building_type,
                cost_paid, ambition_granted, status, started_at_tick, completes_at_tick,
                completed_at_tick, gdp_growth_applied
            ) VALUES (
                c.winner_corp_id, c.issuer_corp_id, c.nation_id,
                left(btrim(c.name), 80), COALESCE(c.tier, 'small'), c.building_type,
                v_cost, 0, 'completed', c.started_at_tick, v_tick, v_tick, true
            ) RETURNING id INTO v_bld_id;

            -- Same +0.2 GDP growth a self-built completion grants (20270166).
            UPDATE nations SET gdp_growth = COALESCE(gdp_growth, 0) + 0.2 WHERE id = c.nation_id;

            UPDATE ent_construction_contracts
               SET status = 'completed', progress_ticks = c.timeline_ticks, delivered_building_id = v_bld_id
             WHERE id = c.id;
            v_completed := v_completed + 1;
            CONTINUE;
        END IF;

        -- ── Legacy (gov / non-building private) completion: cash only ──
        v_pay_ok := false;
        IF c.contract_type = 'government' THEN
            UPDATE nations
               SET budget = budget - (c.winning_bid / RAW_PER_ABSTRACT)
             WHERE id = c.issuer_nation_id
               AND COALESCE(budget, 0) * RAW_PER_ABSTRACT >= c.winning_bid;
            v_pay_ok := FOUND;
        ELSE
            UPDATE entrepreneur_corps
               SET treasury_cash = COALESCE(treasury_cash, 0) - c.winning_bid
             WHERE id = c.issuer_corp_id AND COALESCE(treasury_cash, 0) >= c.winning_bid;
            v_pay_ok := FOUND;
        END IF;

        IF NOT v_pay_ok THEN
            UPDATE ent_construction_contracts SET status = 'failed', progress_ticks = c.timeline_ticks WHERE id = c.id;
            v_failed := v_failed + 1;
            CONTINUE;
        END IF;

        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + c.winning_bid, updated_at = now()
         WHERE id = c.winner_corp_id;

        IF c.contract_type = 'government' THEN
            v_eff := c.completion_effects;
            IF COALESCE((v_eff->>'gdp')::numeric, 0) <> 0 THEN
                PERFORM award_construction_gdp_bonus(c.issuer_nation_id, (v_eff->>'gdp')::numeric);
            END IF;
            UPDATE nations SET
                standard_of_living = LEAST(100, GREATEST(0, COALESCE(standard_of_living,50) + COALESCE((v_eff->>'sol')::numeric, 0))),
                public_approval    = LEAST(100, GREATEST(0, COALESCE(public_approval,50)    + COALESCE((v_eff->>'approval')::numeric, 0)))
             WHERE id = c.issuer_nation_id;
        END IF;

        UPDATE ent_construction_contracts SET status = 'completed', progress_ticks = c.timeline_ticks WHERE id = c.id;
        v_completed := v_completed + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick,
        'awarded', v_awarded, 'cancelled', v_cancelled, 'completed', v_completed, 'failed', v_failed);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.process_ent_construction_contracts(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_ent_construction_contracts(int) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
