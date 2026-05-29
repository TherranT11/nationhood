-- ════════════════════════════════════════════════════════════════════
-- PARTY MEMBER ACTIONS — 1 action per turn + Door Knocking cooldown
-- ════════════════════════════════════════════════════════════════════
-- Two rule changes layered on top of 20270381:
--
--   • Door Knocking gains a 1-tick cooldown (was: no cooldown).
--   • Party Members can take at most 1 member-action per tick — doing
--     any action stamps a global "next action ready" gate that
--     blocks the OTHER action for the rest of the current tick.
--
-- ── Schema ──
-- Adds factions.next_member_action_tick (INT, nullable). This is the
-- universal 1-per-turn gate; every member-action RPC stamps it to
-- v_tick + 1 on success. Speech keeps its own
-- speech_cooldown_until_tick (3-tick gate) and is checked against
-- BOTH columns; DK only needs the universal gate so it relies on
-- next_member_action_tick alone.
--
-- A single shared column wouldn't work: a speech at tick N would
-- otherwise gate DK until N+3 too, which contradicts DK's 1-tick
-- cooldown. Two columns with distinct roles keeps each action's
-- cooldown semantics independent while the 1-per-turn rule remains
-- universal.
--
-- ── RPCs ──
-- Both RPC bodies are replaced wholesale rather than amended. Door
-- knock gains the cooldown check + writes next_member_action_tick.
-- Speech adds the next_member_action_tick check + write on top of
-- the existing speech_cooldown_until_tick logic. Return payloads
-- include the new field so the client can render the gated state of
-- both buttons after either action fires.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS next_member_action_tick INT;

-- ── politician_door_knock — now 1-tick cooldown + stamps the gate ──
CREATE OR REPLACE FUNCTION public.politician_door_knock(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_tick    int;
    v_next    int;
    v_new_pop numeric;
    v_new_inf numeric;
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

    UPDATE factions
       SET popularity_pct = LEAST(100, GREATEST(0, COALESCE(popularity_pct, 0) + 0.1))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
    RETURNING popularity_pct INTO v_new_pop;
    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    v_next := v_tick + 1;
    UPDATE factions
       SET politician_influence    = COALESCE(politician_influence, 0) + 0.1,
           next_member_action_tick = v_next
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_inf;

    RETURN jsonb_build_object(
        'success',                 true,
        'popularity_pct',          v_new_pop,
        'politician_influence',    v_new_inf,
        'next_member_action_tick', v_next
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_door_knock(uuid) TO authenticated;

-- ── politician_give_speech — gated by both the 1-per-turn AND the
--    speech-specific 3-tick cooldown; writes both on success ──
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
    v_total := v_roll + COALESCE(v_pol.politician_charisma, 0);

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
        'charisma',                COALESCE(v_pol.politician_charisma, 0),
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
