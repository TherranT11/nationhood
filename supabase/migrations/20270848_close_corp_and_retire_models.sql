-- ════════════════════════════════════════════════════════════════════
-- 20270848 — [Declare Bankruptcy] and [Retire] for Models
--
--   close_businessman_corporation: the owner's voluntary wind-down,
--   under PAY TAXES in the Finances box. Requires no debt (active
--   central-bank or corp-to-corp borrowings refuse it). Fires every
--   employee — player hires get their employment record cleared and
--   a career-history line, exactly like fire_employee — returns the
--   remaining treasury to the owner's personal funds (design
--   ruling), logs the closure beside the founding event, and deletes
--   the corporation (dependents cascade per their FKs).
--
--   retire_vehicle_model: removes a Model from an automotive corp's
--   library. Refused while an assembly line is running it; otherwise
--   the design is deleted and any remaining inventory — home stock
--   and units shipped abroad — is scrapped (design ruling; the
--   confirm dialog states the loss).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── close_businessman_corporation ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.close_businessman_corporation(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_tick   int;
    v_debt   numeric := 0;
    v_cash   bigint;
    v_fired  int := 0;
    r        RECORD;
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

    -- No debt: every borrowing must be settled before the doors close.
    SELECT COALESCE(SUM(GREATEST(0, outstanding)), 0) INTO v_debt
      FROM central_bank_loans
     WHERE borrower_corp_id = p_corp_id AND status = 'active';
    v_debt := v_debt + COALESCE((
        SELECT SUM(GREATEST(0, principal - total_paid))
          FROM corp_loans
         WHERE borrower_corp_id = p_corp_id AND status = 'active'), 0);
    IF v_debt > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'has_debt',
            'outstanding', FLOOR(v_debt)::bigint);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Fire everyone. Player hires get the same record-clearing and
    -- career-history line fire_employee writes; NPC rows just flip.
    FOR r IN SELECT a.id, a.applicant_faction_id, o.title
               FROM job_applicants a
               JOIN job_openings o ON o.id = a.opening_id
              WHERE o.corp_id = p_corp_id AND a.status = 'hired'
    LOOP
        UPDATE job_applicants SET status = 'fired' WHERE id = r.id;
        IF r.applicant_faction_id IS NOT NULL THEN
            UPDATE factions
               SET biz_employer_corp_id = NULL,
                   biz_job_title        = NULL,
                   biz_salary_yearly    = NULL,
                   biz_hired_at_tick    = NULL,
                   biz_career_history   = COALESCE(biz_career_history, '[]'::jsonb)
                       || jsonb_build_array(jsonb_build_object(
                              'year',  2000 + (v_tick / 12),
                              'label', 'Let go as ' || r.title || ' — corporation closed',
                              'sub',   v_corp.name))
             WHERE id = r.applicant_faction_id;
        END IF;
        v_fired := v_fired + 1;
    END LOOP;

    -- The remaining treasury returns to the owner (design ruling).
    v_cash := FLOOR(GREATEST(0, COALESCE(v_corp.treasury_cash, 0)))::bigint;
    IF v_cash > 0 THEN
        UPDATE factions
           SET party_funds = COALESCE(party_funds, 0) + v_cash
         WHERE id = v_fac.id;
    END IF;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Corporation Closed',
        COALESCE(v_fac.faction_name, 'A businessman') || ' has closed ' || v_corp.name
            || '. ' || v_fired || ' employee(s) released.',
        'economy', 'businessman_closed_corp', v_tick
    );

    DELETE FROM entrepreneur_corps WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true,
        'name', v_corp.name, 'returned', v_cash, 'fired', v_fired);
END $$;

REVOKE EXECUTE ON FUNCTION public.close_businessman_corporation(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.close_businessman_corporation(uuid) TO authenticated;

-- ── retire_vehicle_model ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.retire_vehicle_model(
    p_corp_id      uuid,
    p_blueprint_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_bp      vehicle_blueprints%ROWTYPE;
    v_shipped bigint;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_blueprint_id IS NULL THEN
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

    SELECT * INTO v_bp FROM vehicle_blueprints
     WHERE id = p_blueprint_id AND corp_id = p_corp_id
     FOR UPDATE;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;

    -- A Model on a running line cannot retire (design ruling).
    IF EXISTS (SELECT 1 FROM vehicle_production_runs
                WHERE blueprint_id = p_blueprint_id AND status = 'running') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'in_production');
    END IF;

    SELECT COALESCE(SUM(units), 0) INTO v_shipped
      FROM vehicle_market_stock WHERE blueprint_id = p_blueprint_id;

    -- The delete cascades the shipped stock and the run history.
    DELETE FROM vehicle_blueprints WHERE id = p_blueprint_id;

    RETURN jsonb_build_object('success', true, 'name', v_bp.name,
        'scrapped', COALESCE(v_bp.units_in_stock, 0) + v_shipped);
END $$;

REVOKE EXECUTE ON FUNCTION public.retire_vehicle_model(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.retire_vehicle_model(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
