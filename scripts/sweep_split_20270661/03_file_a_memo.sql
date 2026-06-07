-- 20270661 split #03 of 10 — politician_file_a_memo(p_faction_id)
--
-- Standalone re-emit. DROP old () signature, CREATE new (uuid)
-- with p_faction_id ownership lookup. Body otherwise byte-identical
-- to 20270650.

BEGIN;

DROP FUNCTION IF EXISTS public.politician_file_a_memo();

CREATE OR REPLACE FUNCTION public.politician_file_a_memo(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_new_skill numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_civil_service_action_tick IS NOT NULL
       AND v_pol.next_civil_service_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_civil_service_action_tick);
    END IF;

    UPDATE factions
       SET politician_skill                = COALESCE(politician_skill, 0) + 0.5,
           next_civil_service_action_tick  = v_tick + 1
     WHERE id = v_pol.id
    RETURNING politician_skill INTO v_new_skill;

    RETURN jsonb_build_object(
        'success',           true,
        'action',            'file_a_memo',
        'skill_delta',       0.5,
        'new_skill',         v_new_skill,
        'next_action_tick',  v_tick + 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_file_a_memo(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
