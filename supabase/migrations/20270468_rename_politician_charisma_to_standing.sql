-- Rename politician_charisma → politician_standing.
--
-- Charisma reads as a D&D-flavored personal trait; Standing fits the
-- politician system better — it works equally for an MP, Community
-- Organizer, Admiral, or Magistrate (all of whom have a "where they
-- rank in the public eye" stat). The party-level factions.standing
-- column that previously squatted the name was dropped in 20270467;
-- the namespace is clear.
--
-- Live consumer: politician_give_speech. Main's 20270450
-- (party_member_actions_redesign) reshaped this function — new
-- brackets (crit_fail / fail / hit / crit), it writes
-- politician_reputation instead of politician_influence, and the
-- result payload returns reputation_delta + politician_reputation.
-- That redesign still reads politician_charisma as the d6 modifier
-- and emits the value as the 'charisma' JSON key, both of which
-- become stale once this migration renames the column.
--
-- So this migration carries forward main's 20270450 body verbatim,
-- with two surgical swaps:
--   * v_pol.politician_charisma  → v_pol.politician_standing
--   * 'charisma' JSON key        → 'standing' JSON key
-- Everything else (brackets, reputation writes, cooldown, payload
-- shape) is byte-identical to 20270450 so the function's contract
-- is otherwise unchanged.
--
-- Client-side rename of the 'charisma' key reader → 'standing'
-- lands in party.html in the same commit.

BEGIN;

-- Idempotent rename — no-ops if politician_standing already exists
-- (e.g. someone applied this via SQL editor before db-push.yml caught
-- up). The bare RENAME would otherwise fail with "column does not
-- exist" on a re-run.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = 'factions'
           AND column_name  = 'politician_charisma'
    ) THEN
        EXECUTE 'ALTER TABLE public.factions RENAME COLUMN politician_charisma TO politician_standing';
    END IF;
END $$;

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
    v_cooldown  int;
    v_roll      int;
    v_total     int;
    v_bracket   text;
    v_pop_delta numeric := 0;
    v_rep_delta int     := 0;
    v_new_pop   numeric;
    v_new_rep   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;
    IF v_pol.speech_cooldown_until_tick IS NOT NULL
       AND v_pol.speech_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.speech_cooldown_until_tick);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_standing, 0);

    IF v_roll = 1 THEN
        v_bracket   := 'crit_fail';
        v_rep_delta := -3;
    ELSIF v_roll = 6 THEN
        v_bracket   := 'crit';
        v_pop_delta := 0.4;
    ELSIF v_total >= 5 THEN
        v_bracket   := 'hit';
        v_pop_delta := 0.2;
    ELSE
        v_bracket   := 'fail';
        v_rep_delta := -2;
    END IF;

    UPDATE factions
       SET popularity_pct = LEAST(100, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
    RETURNING popularity_pct INTO v_new_pop;
    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    v_cooldown := v_tick + 3;
    UPDATE factions
       SET politician_reputation       = GREATEST(0, COALESCE(politician_reputation, 0) + v_rep_delta),
           speech_cooldown_until_tick  = v_cooldown
     WHERE id = v_pol.id
    RETURNING politician_reputation INTO v_new_rep;

    RETURN jsonb_build_object(
        'success',              true,
        'roll',                 v_roll,
        'standing',             COALESCE(v_pol.politician_standing, 0),
        'total',                v_total,
        'bracket',              v_bracket,
        'popularity_delta',     v_pop_delta,
        'reputation_delta',     v_rep_delta,
        'popularity_pct',       v_new_pop,
        'politician_reputation', v_new_rep,
        'cooldown_until_tick',  v_cooldown
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_give_speech(uuid) TO authenticated;

COMMENT ON FUNCTION public.politician_give_speech(uuid) IS
    'Party-member action. 1d6 + politician_standing (was politician_charisma; renamed 20270468). Natural 1: -3 Reputation (crit_fail). Total <5: -2 Reputation (fail). Total >=5: +0.2 Party Popularity (hit). Natural 6: +0.4 Party Popularity (crit). 3-tick cooldown. Body carried forward from 20270450 with the Standing column rename only.';

NOTIFY pgrst, 'reload schema';

COMMIT;
