-- ════════════════════════════════════════════════════════════════════
-- 20270858 — Directives: the Owner (and the CCO) put NPC staff to work
--
-- An NPC employee can be DIRECTED once per tick to perform their
-- track's rung-1 kit action — the charge lands in the SAME slots the
-- player kits fill, so every cap and consumption rule already
-- applies; what staff buys is coverage, not extra stacking. A
-- directive costs 10% of the NPC's monthly salary from the treasury
-- (design ruling; flat potency for now — experience scaling later).
-- Authority (design ruling): the Owner directs anyone; the corp's
-- CCO directs commercial-track staff.
--
-- One source: the charge application moves into _apply_kit_charge,
-- and the three player-kit RPCs (re-emitted from 20270845/46/47)
-- plus direct_employee all call it — the audit-flagged duplication
-- of the effect logic retires.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.job_applicants
    ADD COLUMN IF NOT EXISTS directed_at_tick int;

COMMENT ON COLUMN public.job_applicants.directed_at_tick IS
    'Last tick this NPC hire was issued a directive (20270858) — one per NPC per tick.';

-- ── _apply_kit_charge — the one home of every kit effect ──────────
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
        v_cap := assembly_lines(COALESCE(v_corp.assembly_tier, 1));
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
    v_tick  int;
    v_fee   bigint;
    v_owner boolean;
    v_res   jsonb;
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

    -- Authority: the Owner directs anyone; the corp's CCO directs
    -- commercial-track staff (design ruling).
    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    v_owner := v_fac.id IS NOT NULL;
    IF NOT v_owner THEN
        v_fac := _commercial_chief_check(v_uid);
        IF v_fac.id IS NULL OR v_fac.biz_employer_corp_id <> v_corp.id
           OR v_open.track <> 'commercial' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
        END IF;
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
    UPDATE job_applicants SET directed_at_tick = v_tick WHERE id = v_app.id;

    RETURN v_res || jsonb_build_object('fee', v_fee, 'employee', v_app.name);
END $$;

REVOKE EXECUTE ON FUNCTION public.direct_employee(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.direct_employee(uuid, text) TO authenticated;

-- ── production_engineer_action — effect via the shared helper ─────
CREATE OR REPLACE FUNCTION public.production_engineer_action(p_action text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_tick int;
    v_res  jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_action NOT IN ('optimize_line', 'lean_procurement', 'tune_tooling') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_businessman');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_fac.biz_employer_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_employed');
    END IF;

    -- The kit belongs to the rung-1 Production Engineer — verified
    -- on the live hire row, the same record everything else reads.
    IF NOT EXISTS (
        SELECT 1 FROM job_applicants a
          JOIN job_openings o ON o.id = a.opening_id
         WHERE a.applicant_faction_id = v_fac.id
           AND a.status = 'hired'
           AND o.corp_id = v_fac.biz_employer_corp_id
           AND o.track = 'manufacturing'
           AND o.rung = 1
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_production_engineer');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_res := _apply_kit_charge(v_fac.biz_employer_corp_id, p_action);
    IF NOT COALESCE((v_res->>'success')::boolean, false) THEN
        RETURN v_res;
    END IF;
    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;
    RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.production_engineer_action(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.production_engineer_action(text) TO authenticated;

-- ── sales_rep_action ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sales_rep_action(p_action text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_fac   factions%ROWTYPE;
    v_tick  int;
    v_res   jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_action NOT IN ('drum_up_buyers', 'sharpen_pitch', 'sweeten_financing') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_businessman');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_fac.biz_employer_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_employed');
    END IF;

    -- The kit belongs to the rung-1 Field Sales Representative —
    -- verified on the live hire row.
    IF NOT EXISTS (
        SELECT 1 FROM job_applicants a
          JOIN job_openings o ON o.id = a.opening_id
         WHERE a.applicant_faction_id = v_fac.id
           AND a.status = 'hired'
           AND o.corp_id = v_fac.biz_employer_corp_id
           AND o.track = 'commercial'
           AND o.rung = 1
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_sales_rep');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_fac.biz_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_res := _apply_kit_charge(v_fac.biz_employer_corp_id, p_action);
    IF NOT COALESCE((v_res->>'success')::boolean, false) THEN
        RETURN v_res;
    END IF;
    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;
    RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.sales_rep_action(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.sales_rep_action(text) TO authenticated;

-- ── product_engineer_action ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.product_engineer_action(p_action text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_tick int;
    v_res  jsonb;
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

    v_res := _apply_kit_charge(v_fac.biz_employer_corp_id, p_action);
    IF NOT COALESCE((v_res->>'success')::boolean, false) THEN
        RETURN v_res;
    END IF;
    UPDATE factions SET biz_action_tick = v_tick WHERE id = v_fac.id;
    RETURN v_res;
END $$;

REVOKE EXECUTE ON FUNCTION public.product_engineer_action(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.product_engineer_action(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
