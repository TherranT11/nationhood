-- ════════════════════════════════════════════════════════════════════
-- 20270859 — Directives follow the chain of command + the model press
--            release
--
-- Directives rev. (design ruling): you direct the NPCs who REPORT TO
-- YOU — the same chain the roster's REPORTS TO column draws (rungs
-- 1-3 → nearest same-track rung 4+, 4 → 5+, 5 → 6, otherwise the
-- Owner). The owner-directs-anyone / CCO-directs-commercial rule
-- retires. A director may issue THREE directives per tick; the new
-- directed_by stamp on the hire row is the ledger that counts them.
--
-- draft_vehicle_blueprint re-emitted from 20270852 with the Corporate
-- History line reworded into a press release: "{corp} announced the
-- {name} car model, a {class} {type} of {quality} quality to be
-- available on the market soon."
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.job_applicants
    ADD COLUMN IF NOT EXISTS directed_by uuid;

COMMENT ON COLUMN public.job_applicants.directed_by IS
    'Faction that issued this NPC''s last directive (20270859) — with directed_at_tick, the three-per-tick ledger. Plain uuid by design: faction purges must not trip over it.';

-- ── direct_employee ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.direct_employee(
    p_applicant_id uuid,
    p_action       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_app   job_applicants%ROWTYPE;
    v_open  job_openings%ROWTYPE;
    v_corp  entrepreneur_corps%ROWTYPE;
    v_tick    int;
    v_fee     bigint;
    v_rung    int;
    v_sup_id  uuid;
    v_sup_fac uuid;
    v_res     jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_applicant_id IS NULL OR p_action IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_app FROM job_applicants WHERE id = p_applicant_id FOR UPDATE;
    IF v_app.id IS NULL OR v_app.status <> 'hired' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_hired');
    END IF;
    IF v_app.applicant_faction_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_npc');
    END IF;
    SELECT * INTO v_open FROM job_openings WHERE id = v_app.opening_id;
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_open.corp_id FOR UPDATE;

    -- Authority (design ruling, rev. 20270859): directives flow down
    -- the chain of command — you direct the NPCs who report to YOU.
    -- The supervisor resolves exactly like the roster's REPORTS TO
    -- column: rungs 1-3 answer to the nearest same-track hire at
    -- rung 4+, rung 4 to 5+, rung 5 to 6; with no superior on staff
    -- (or at rung 6) they answer to the Owner. An NPC supervisor
    -- means nobody holds the directive pen for that report.
    v_rung := COALESCE(v_open.rung, 1);
    IF v_rung < 6 THEN
        SELECT a.id, a.applicant_faction_id INTO v_sup_id, v_sup_fac
          FROM job_applicants a
          JOIN job_openings o ON o.id = a.opening_id
         WHERE a.status = 'hired'
           AND a.id <> v_app.id
           AND o.corp_id = v_open.corp_id
           AND o.track = v_open.track
           AND COALESCE(o.rung, 1) >= CASE WHEN v_rung <= 3 THEN 4 ELSE v_rung + 1 END
         ORDER BY COALESCE(o.rung, 1) ASC, a.created_at ASC
         LIMIT 1;
    END IF;
    IF v_sup_id IS NULL THEN
        SELECT * INTO v_fac FROM factions
         WHERE id = v_corp.owner_faction_id
           AND (id = v_uid OR linked_user_id = v_uid)
           AND faction_type = 'businessman'
           AND abandoned_at IS NULL;
    ELSIF v_sup_fac IS NOT NULL THEN
        SELECT * INTO v_fac FROM factions
         WHERE id = v_sup_fac
           AND (id = v_uid OR linked_user_id = v_uid)
           AND faction_type = 'businessman'
           AND abandoned_at IS NULL;
    END IF;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    -- The directive performs the track's rung-1 kit action.
    IF NOT ((v_open.track = 'manufacturing' AND p_action IN ('optimize_line', 'lean_procurement', 'tune_tooling'))
         OR (v_open.track = 'commercial'    AND p_action IN ('drum_up_buyers', 'sharpen_pitch', 'sweeten_financing'))
         OR (v_open.track = 'product'       AND p_action IN ('bench_test_components', 'log_test_mileage'))) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_directive_kit');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_app.directed_at_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_directed');
    END IF;

    -- Three directives per director per tick (design ruling) — the
    -- stamps below are the ledger, so the count IS the spend.
    IF (SELECT count(*) FROM job_applicants
         WHERE directed_by = v_fac.id AND directed_at_tick = v_tick) >= 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'directive_limit');
    END IF;

    -- Overtime: 10% of the NPC's monthly salary (design ruling).
    v_fee := ROUND(COALESCE(v_open.salary_yearly, 0) / 12.0 * 0.10)::bigint;
    IF floor(COALESCE(v_corp.treasury_cash, 0))::bigint < v_fee THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'need', v_fee, 'have', floor(COALESCE(v_corp.treasury_cash, 0))::bigint);
    END IF;

    v_res := _apply_kit_charge(v_corp.id, p_action);
    IF NOT COALESCE((v_res->>'success')::boolean, false) THEN
        RETURN v_res;
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_fee
     WHERE id = v_corp.id;
    UPDATE job_applicants SET directed_at_tick = v_tick, directed_by = v_fac.id WHERE id = v_app.id;

    RETURN v_res || jsonb_build_object('fee', v_fee, 'employee', v_app.name);
END $$;

REVOKE EXECUTE ON FUNCTION public.direct_employee(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.direct_employee(uuid, text) TO authenticated;

-- ── draft_vehicle_blueprint ────────────────────────────────────
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

REVOKE EXECUTE ON FUNCTION public.draft_vehicle_blueprint(uuid, text, text, text, text, text[], text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.draft_vehicle_blueprint(uuid, text, text, text, text, text[], text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
