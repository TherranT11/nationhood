-- 20270661 split #10 of 10 — politician_apply_for_promotion(p_faction_id, p_agency_key)
--
-- Standalone re-emit. DROP old (text) signature, CREATE new
-- (uuid, text) with p_faction_id ownership lookup. Body otherwise
-- byte-identical to 20270634.

BEGIN;

DROP FUNCTION IF EXISTS public.politician_apply_for_promotion(text);

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

    IF COALESCE(v_pol.politician_skill, 0) < 10 THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason',  'insufficient_skill',
            'have',    COALESCE(v_pol.politician_skill, 0),
            'need',    10
        );
    END IF;

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
