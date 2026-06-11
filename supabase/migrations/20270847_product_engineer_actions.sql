-- ════════════════════════════════════════════════════════════════════
-- 20270847 — The Product Engineer's kit (Product rung 1)
--
-- The third employee kit, on the design loop:
--
--   · DESIGN — the engineer drafts a real vehicle proposal (full
--     picker, validated like draft_vehicle_blueprint) at the normal
--     XP cost MINUS 1 (floor 1). It lands in the owner's Pressing
--     Issues to accept or reject: acceptance pays the discounted XP
--     from the corp (with the Studio grant and any pending bench
--     charge applying, exactly like a draft) and creates the Model —
--     spending NO executive action; the engineer's daily action was
--     the price. One pending proposal per engineer.
--   · BENCH TEST THE COMPONENTS — the next Model created (drafted
--     or accepted) ships with +0.5 appeal baked in permanently
--     (vehicle_blueprints.appeal_bonus — read by every campaign's
--     appeal math, the owner's and rivals' alike). Max 1 pending.
--   · LOG TEST MILEAGE — +1 Experience immediately, capped at the
--     Studio's ceiling. No queue; it resolves on the spot.
--
-- One action per tick on the shared factions.biz_action_tick;
-- strictly the rung-1 hire, verified on the live hire row.
-- draft_vehicle_blueprint re-emitted from 20270842 (bench charge);
-- run_sales_campaign re-emitted from 20270846 (appeal_bonus).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.vehicle_blueprints
    ADD COLUMN IF NOT EXISTS appeal_bonus numeric NOT NULL DEFAULT 0;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS design_buff_appeal int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.vehicle_design_proposals (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id             uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    proposer_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    name                text NOT NULL,
    vehicle_type        text NOT NULL,
    vehicle_class       text NOT NULL,
    engine              text NOT NULL,
    packages            text[] NOT NULL DEFAULT '{}',
    quality             text NOT NULL,
    xp_cost             int  NOT NULL,
    status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at_tick     int  NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vehicle_design_proposals_corp_idx
    ON public.vehicle_design_proposals (corp_id);

ALTER TABLE public.vehicle_design_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.vehicle_design_proposals;
CREATE POLICY "Allow select for all" ON public.vehicle_design_proposals
    FOR SELECT USING (true);

-- ── _product_engineer_check — the shared eligibility guard ────────
CREATE OR REPLACE FUNCTION public._product_engineer_check(p_uid uuid)
RETURNS factions
LANGUAGE plpgsql
AS $$
DECLARE
    v_fac factions%ROWTYPE;
BEGIN
    SELECT * INTO v_fac FROM factions
     WHERE (id = p_uid OR linked_user_id = p_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL OR v_fac.biz_employer_corp_id IS NULL
       OR lower(COALESCE(v_fac.status, '')) = 'arrested'
       OR NOT EXISTS (
            SELECT 1 FROM job_applicants a
              JOIN job_openings o ON o.id = a.opening_id
             WHERE a.applicant_faction_id = v_fac.id
               AND a.status = 'hired'
               AND o.corp_id = v_fac.biz_employer_corp_id
               AND o.track = 'product'
               AND o.rung = 1
       ) THEN
        RETURN NULL;
    END IF;
    RETURN v_fac;
END $$;

REVOKE EXECUTE ON FUNCTION public._product_engineer_check(uuid) FROM PUBLIC;

-- ── product_engineer_action — bench test + test mileage ───────────
CREATE OR REPLACE FUNCTION public.product_engineer_action(p_action text)
RETURNS jsonb
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
    IF p_action NOT IN ('bench_test_components', 'log_test_mileage') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    v_fac := _product_engineer_check(v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_product_engineer');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_fac.biz_employer_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    IF p_action = 'bench_test_components' THEN
        -- Max 1 pending charge; the next Model created consumes it.
        IF COALESCE(v_corp.design_buff_appeal, 0) >= 1 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'bench_already_charged');
        END IF;
        UPDATE entrepreneur_corps
           SET design_buff_appeal = COALESCE(design_buff_appeal, 0) + 1
         WHERE id = v_corp.id;
    ELSE
        -- +1 Experience on the spot, capped at the Studio ceiling.
        IF COALESCE(v_corp.experience, 0)
           >= design_studio_cap(COALESCE(v_corp.design_studio_tier, 1)) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'experience_at_cap',
                'cap', design_studio_cap(COALESCE(v_corp.design_studio_tier, 1)));
        END IF;
        UPDATE entrepreneur_corps
           SET experience = LEAST(design_studio_cap(COALESCE(design_studio_tier, 1)),
                                  COALESCE(experience, 0) + 1)
         WHERE id = v_corp.id;
    END IF;
    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'action', p_action, 'pending', 1, 'cap', 1);
END $$;

REVOKE EXECUTE ON FUNCTION public.product_engineer_action(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.product_engineer_action(text) TO authenticated;

-- ── propose_vehicle_design — DESIGN, to the owner's desk ──────────
CREATE OR REPLACE FUNCTION public.propose_vehicle_design(
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
    v_tick     int;
    v_name     text := TRIM(COALESCE(p_name, ''));
    v_packages text[];
    v_cost     int;
    v_id       uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    v_fac := _product_engineer_check(v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_product_engineer');
    END IF;

    -- The same design gates draft_vehicle_blueprint enforces.
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

    -- One proposal on the boss's desk at a time.
    IF EXISTS (SELECT 1 FROM vehicle_design_proposals
                WHERE proposer_faction_id = v_fac.id AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_pending');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- The engineer's craft: the design costs 1 XP less (floor 1).
    -- Charged when the owner accepts — nothing is spent on a reject.
    v_cost := GREATEST(1, vehicle_blueprint_xp_cost(p_vehicle_type, p_vehicle_class,
                  p_engine, COALESCE(array_length(v_packages, 1), 0), p_quality) - 1);

    INSERT INTO vehicle_design_proposals (
        corp_id, proposer_faction_id, name, vehicle_type, vehicle_class,
        engine, packages, quality, xp_cost, created_at_tick
    ) VALUES (
        v_fac.biz_employer_corp_id, v_fac.id, v_name, p_vehicle_type, p_vehicle_class,
        p_engine, v_packages, p_quality, v_cost, v_tick
    ) RETURNING id INTO v_id;

    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'proposal_id', v_id,
        'name', v_name, 'xp_cost', v_cost);
END $$;

REVOKE EXECUTE ON FUNCTION public.propose_vehicle_design(text, text, text, text, text[], text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.propose_vehicle_design(text, text, text, text, text[], text) TO authenticated;

-- ── review_design_proposal — the owner's call ─────────────────────
CREATE OR REPLACE FUNCTION public.review_design_proposal(
    p_proposal_id uuid,
    p_accept      boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_prop vehicle_design_proposals%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_fac  factions%ROWTYPE;
    v_tick int;
    v_id   uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_proposal_id IS NULL OR p_accept IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_prop FROM vehicle_design_proposals
     WHERE id = p_proposal_id FOR UPDATE;
    IF v_prop.id IS NULL OR v_prop.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_pending');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_prop.corp_id FOR UPDATE;
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

    IF NOT p_accept THEN
        UPDATE vehicle_design_proposals SET status = 'rejected' WHERE id = v_prop.id;
        RETURN jsonb_build_object('success', true, 'accepted', false, 'name', v_prop.name);
    END IF;

    -- Acceptance pays the engineer's discounted XP price and creates
    -- the Model exactly like a draft — Studio grant and any pending
    -- bench charge included. No executive action: the engineer's
    -- daily action already paid for this design.
    IF COALESCE(v_corp.experience, 0) < v_prop.xp_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_experience',
            'xp_cost', v_prop.xp_cost, 'experience', COALESCE(v_corp.experience, 0));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO vehicle_blueprints (
        corp_id, name, vehicle_type, vehicle_class, engine,
        packages, quality, xp_cost, created_at_tick, appeal_bonus
    ) VALUES (
        v_prop.corp_id, v_prop.name, v_prop.vehicle_type, v_prop.vehicle_class, v_prop.engine,
        v_prop.packages, v_prop.quality, v_prop.xp_cost, v_tick,
        CASE WHEN COALESCE(v_corp.design_buff_appeal, 0) > 0 THEN 0.5 ELSE 0 END
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps
       SET experience = GREATEST(COALESCE(experience, 0) - v_prop.xp_cost,
               LEAST(design_studio_cap(COALESCE(design_studio_tier, 1)),
                     COALESCE(experience, 0) - v_prop.xp_cost
                     + design_studio_grant(COALESCE(design_studio_tier, 1)))),
           design_buff_appeal = GREATEST(0, COALESCE(design_buff_appeal, 0) - 1)
     WHERE id = v_corp.id;

    UPDATE vehicle_design_proposals SET status = 'accepted' WHERE id = v_prop.id;

    RETURN jsonb_build_object('success', true, 'accepted', true,
        'blueprint_id', v_id, 'name', v_prop.name, 'xp_cost', v_prop.xp_cost);
END $$;

REVOKE EXECUTE ON FUNCTION public.review_design_proposal(uuid, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.review_design_proposal(uuid, boolean) TO authenticated;

-- ── draft_vehicle_blueprint — the bench charge ────────────────────
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
           exec_action_tick = v_tick
     WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'blueprint_id', v_id,
        'name', v_name, 'xp_cost', v_cost);
END $$;

REVOKE EXECUTE ON FUNCTION public.draft_vehicle_blueprint(uuid, text, text, text, text, text[], text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.draft_vehicle_blueprint(uuid, text, text, text, text, text[], text) TO authenticated;

-- ── run_sales_campaign — bench-tested appeal everywhere ───────────
CREATE OR REPLACE FUNCTION public.run_sales_campaign(
    p_corp_id      uuid,
    p_nation_id    uuid,
    p_blueprint_id uuid,
    p_price        bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_bp     vehicle_blueprints%ROWTYPE;
    v_nation nations%ROWTYPE;
    v_tick   int;
    v_aff    numeric;
    v_w      numeric;
    v_wsum   numeric;
    v_units  numeric;
    v_appeal numeric;
    v_comp   numeric;
    v_sold   int;
    v_rev    bigint;
    v_home   boolean;
    v_presence corp_market_presence%ROWTYPE;
    v_stockrow vehicle_market_stock%ROWTYPE;
    v_stock  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_price IS NULL OR p_price < 1 OR p_price > 100000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;

    -- Lock the corp row: the allowance spend and the revenue credit
    -- below must serialize.
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

    SELECT * INTO v_bp FROM vehicle_blueprints
     WHERE id = p_blueprint_id AND corp_id = p_corp_id;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;

    SELECT * INTO v_nation FROM nations
     WHERE id = p_nation_id AND name = ANY (market_nation_names());
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_live');
    END IF;

    -- Home campaigns sell HQ inventory; foreign ones need presence
    -- there (Expand Market, 20270840) and sell the stock you shipped.
    -- A Subsidiary's local badge earns +1 appeal.
    v_home := (p_nation_id = v_corp.hq_nation_id);
    IF NOT v_home THEN
        SELECT * INTO v_presence FROM corp_market_presence
         WHERE corp_id = p_corp_id AND nation_id = p_nation_id;
        IF v_presence.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_in_market');
        END IF;
        SELECT * INTO v_stockrow FROM vehicle_market_stock
         WHERE blueprint_id = p_blueprint_id AND nation_id = p_nation_id;
        v_stock := COALESCE(v_stockrow.units, 0);
    ELSE
        v_stock := COALESCE(v_bp.units_in_stock, 0);
    END IF;
    IF v_stock < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_stock');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    -- The month's demand for this type × class in the nation
    -- (identical math to analyze_vehicle_market via the helpers).
    v_aff := (GREATEST(1, COALESCE(v_nation.standard_of_living, 50))
              + GREATEST(1, COALESCE(v_nation.wages, 50))) / 2.0;
    v_w := vehicle_class_weight(v_bp.vehicle_class, v_aff);
    v_wsum := vehicle_class_weight('economy', v_aff) + vehicle_class_weight('mid_range', v_aff)
            + vehicle_class_weight('premium', v_aff) + vehicle_class_weight('luxury', v_aff)
            + vehicle_class_weight('ultra_luxury', v_aff);
    v_units := vehicle_type_monthly_demand(v_nation.population, v_bp.vehicle_type)
               * v_w / v_wsum;

    -- Gas prices and disposable income: high Energy on hand helps,
    -- a high Cost of Living hurts.
    v_units := v_units
        * GREATEST(0.5, LEAST(1.5, GREATEST(0, COALESCE(v_nation.energy, 0)) / 50.0))
        * GREATEST(0.5, LEAST(1.5, 50.0 / GREATEST(1, COALESCE(v_nation.cost_of_living, 50))));

    -- Pricing against the class anchor: undercutting sells more.
    -- Sweeten the Financing (20270846): the demand math reads the
    -- price 10% lower than the full sticker the buyers actually pay.
    v_units := v_units * GREATEST(0.4, LEAST(1.6,
        vehicle_class_anchor_price(v_bp.vehicle_class)::numeric
        / (p_price * CASE WHEN COALESCE(v_corp.sales_buff_price, 0) > 0 THEN 0.90 ELSE 1 END)));

    -- Appeal share against competitor Models of the same type with
    -- stock, HQ'd in the nation.
    v_appeal := vehicle_appeal(v_bp.engine, v_bp.quality,
                               COALESCE(array_length(v_bp.packages, 1), 0))
                -- Bench-tested designs (20270847) carry their bonus.
                + COALESCE(v_bp.appeal_bonus, 0)
                + CASE WHEN NOT v_home AND (v_presence).kind = 'subsidiary' THEN 1 ELSE 0 END
                -- Sharpen the Pitch (20270846): the rep's polish.
                + CASE WHEN COALESCE(v_corp.sales_buff_appeal, 0) > 0 THEN 0.5 ELSE 0 END;
    -- Rivals with stock IN this nation: locals' HQ inventory plus
    -- anything foreigners shipped in (their subsidiary badges don't
    -- defend — the bonus is the campaigner's edge).
    SELECT COALESCE(SUM(vehicle_appeal(vb.engine, vb.quality,
                                       COALESCE(array_length(vb.packages, 1), 0))
                        + COALESCE(vb.appeal_bonus, 0)), 0)
      INTO v_comp
      FROM vehicle_blueprints vb
      JOIN entrepreneur_corps ec ON ec.id = vb.corp_id
     WHERE vb.vehicle_type = v_bp.vehicle_type
       AND vb.corp_id <> p_corp_id
       AND ((ec.hq_nation_id = p_nation_id AND COALESCE(vb.units_in_stock, 0) > 0)
            OR EXISTS (SELECT 1 FROM vehicle_market_stock ms
                        WHERE ms.blueprint_id = vb.id
                          AND ms.nation_id = p_nation_id
                          AND ms.units > 0));
    v_units := v_units * v_appeal / (v_appeal + v_comp);

    -- Franchise & Commercial Suite (20270842): the network adds
    -- Demand at home by suite level (+1/+2/+3/+4, retained at V),
    -- and Subsidiary-brand campaigns gain +1/+2/+3 from Level III.
    IF v_home THEN
        v_units := v_units + franchise_home_demand(COALESCE(v_corp.franchise_tier, 1));
    ELSIF (v_presence).kind = 'subsidiary' THEN
        v_units := v_units + franchise_subsidiary_demand(COALESCE(v_corp.franchise_tier, 1));
    END IF;

    -- Drum Up Buyers (20270846): +10% units, rounded up, min +1 —
    -- applied before the stock cap.
    IF COALESCE(v_corp.sales_buff_units, 0) > 0 THEN
        v_units := v_units + GREATEST(1, CEIL(FLOOR(v_units) * 0.10));
    END IF;

    v_sold := LEAST(v_stock, FLOOR(v_units)::int);
    v_rev  := v_sold::bigint * p_price;

    IF v_home THEN
        UPDATE vehicle_blueprints
           SET units_in_stock = units_in_stock - v_sold
         WHERE id = v_bp.id;
    ELSE
        UPDATE vehicle_market_stock
           SET units = units - v_sold
         WHERE id = (v_stockrow).id;
    END IF;
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) + v_rev,
           sales_buff_units  = GREATEST(0, COALESCE(sales_buff_units, 0) - 1),
           sales_buff_appeal = GREATEST(0, COALESCE(sales_buff_appeal, 0) - 1),
           sales_buff_price  = GREATEST(0, COALESCE(sales_buff_price, 0) - 1),
           exec_action_tick = v_tick
     WHERE id = p_corp_id;
    IF v_rev > 0 THEN
        PERFORM stamp_entrepreneur_corp_revenue(p_corp_id, v_tick, v_rev);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'sold',    v_sold,
        'revenue', v_rev,
        'name',    v_bp.name,
        'price',   p_price,
        'nation',  v_nation.name
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.run_sales_campaign(uuid, uuid, uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.run_sales_campaign(uuid, uuid, uuid, bigint) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
