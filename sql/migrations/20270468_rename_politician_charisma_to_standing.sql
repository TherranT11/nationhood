-- Rename politician_charisma → politician_standing.
--
-- Charisma reads as a D&D-flavored personal trait; Standing fits the
-- politician system better — it works equally for an MP, Community
-- Organizer, Admiral, or Magistrate (all of whom have a "where they
-- rank in the public eye" stat). The party-level factions.standing
-- column that previously squatted the name was dropped in 20270398;
-- the namespace is clear.
--
-- One live consumer: politician_give_speech (defined in 20270382)
-- reads COALESCE(v_pol.politician_charisma, 0) into v_total and emits
-- 'charisma' as a JSON key in its result payload. Same body carried
-- forward here with the two surgical name swaps:
--   * v_pol.politician_charisma  → v_pol.politician_standing
--   * 'charisma' JSON key        → 'standing' JSON key
-- The 'standing' key change is intentional — client-side toast in
-- party.html reads it and is renamed in the same commit. Everything
-- else in the function (cooldown logic, bracket thresholds,
-- popularity/influence deltas, return shape) is byte-identical to
-- 20270382 so the function's contract is otherwise unchanged.

BEGIN;

ALTER TABLE public.factions RENAME COLUMN politician_charisma TO politician_standing;

COMMENT ON COLUMN public.factions.politician_standing IS
    'Politician stat: where they rank in the public eye. 1 at creation, grows via rallies / public speeches / leadership wins. Adds to the d6 in politician_give_speech.';

CREATE OR REPLACE FUNCTION public.politician_give_speech(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_speech_cd int;
    v_next      int;
    v_roll      int;
    v_total     int;
    v_bracket   text;
    v_pop_delta numeric := 0;
    v_inf_delta numeric := 0;
    v_new_pop   numeric;
    v_new_inf   numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;
    IF v_pol.speech_cooldown_until_tick IS NOT NULL
       AND v_pol.speech_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.speech_cooldown_until_tick);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_standing, 0);

    IF v_total <= 3 THEN
        v_bracket   := 'bad';
        v_pop_delta := -2;
        v_inf_delta := -1;
    ELSIF v_total <= 6 THEN
        v_bracket   := 'ok';
        v_pop_delta := 1;
    ELSE
        v_bracket   := 'good';
        v_pop_delta := 1;
        v_inf_delta := 1;
    END IF;

    UPDATE factions
       SET popularity_pct = LEAST(100, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
    RETURNING popularity_pct INTO v_new_pop;
    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    v_speech_cd := v_tick + 3;
    v_next      := v_tick + 1;
    UPDATE factions
       SET politician_influence       = GREATEST(0, COALESCE(politician_influence, 0) + v_inf_delta),
           speech_cooldown_until_tick = v_speech_cd,
           next_member_action_tick    = v_next
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_inf;

    RETURN jsonb_build_object(
        'success',                 true,
        'roll',                    v_roll,
        'standing',                COALESCE(v_pol.politician_standing, 0),
        'total',                   v_total,
        'bracket',                 v_bracket,
        'popularity_delta',        v_pop_delta,
        'influence_delta',         v_inf_delta,
        'popularity_pct',          v_new_pop,
        'politician_influence',    v_new_inf,
        'cooldown_until_tick',     v_speech_cd,
        'next_member_action_tick', v_next
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_give_speech(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
