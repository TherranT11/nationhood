-- ════════════════════════════════════════════════════════════════════
-- 20270674 — Agency Head promotion threshold: 10 → 15
--
-- User design change. politician_apply_for_promotion previously
-- gated on politician_skill ≥ 10 (per 20270634 and the 20270661
-- sweep). With the age-year passive Experience accrual landing in
-- 20270672 (every active politician picks up +1 every 12 ticks),
-- the 10-Experience bar was within reach in a year or two of
-- calendar time alone. Bumping to 15 keeps the promotion meaningful
-- under the new accrual rate.
--
-- All other gates unchanged: must hold a politician_ministry (i.e.
-- be a Civil Servant), must not already be Senior Civil Servant,
-- the agency key must validate against the caller's ministry via
-- _paperwork_valid_ministry_agency.
--
-- The 'have' field in the insufficient_skill reason still carries
-- the politician's current Experience numeric so the client error
-- message can fill the (have X) parenthetical without a second
-- query.
--
-- CREATE OR REPLACE rather than DROP + CREATE because the signature
-- is unchanged (still (p_faction_id uuid, p_agency_key text) →
-- jsonb). Reapply-safe.
--
-- Apply after 20270673.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_apply_for_promotion(
    p_faction_id uuid,
    p_agency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_tick    int;
    v_agency  text := NULLIF(btrim(p_agency_key), '');
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF v_agency IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_agency');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;
    IF v_pol.politician_senior_civil_servant_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_senior');
    END IF;

    -- 15 Experience threshold (politician_skill column). Bumped from
    -- 10 in this migration to compensate for the age-year passive
    -- accrual from 20270672.
    IF COALESCE(v_pol.politician_skill, 0) < 15 THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason',  'insufficient_skill',
            'have',    COALESCE(v_pol.politician_skill, 0),
            'need',    15
        );
    END IF;

    -- Agency must be in the caller's ministry. _paperwork_valid_
    -- ministry_agency (20270627) is the SoT taxonomy guard.
    IF NOT public._paperwork_valid_ministry_agency(v_pol.politician_ministry, v_agency) THEN
        RETURN jsonb_build_object(
            'success',  false,
            'reason',   'invalid_agency',
            'ministry', v_pol.politician_ministry,
            'agency',   v_agency
        );
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET politician_senior_civil_servant_at_tick = v_tick,
           politician_agency_head_of               = v_agency
     WHERE id = v_pol.id;

    -- target_name lifts the agency label for the career timeline.
    -- event_type stays 'promoted_senior_civil_servant' as the stable
    -- analytics key (display swap to "Agency Head" was label-only).
    INSERT INTO politician_career_events
        (faction_id, event_tick, event_type, target_name)
    VALUES
        (v_pol.id, v_tick, 'promoted_senior_civil_servant',
         'Agency Head · ' || v_agency);

    RETURN jsonb_build_object(
        'success',     true,
        'action',      'apply_for_promotion',
        'promoted_at', v_tick,
        'agency',      v_agency,
        'skill',       v_pol.politician_skill
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_apply_for_promotion(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
