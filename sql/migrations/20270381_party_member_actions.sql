-- ════════════════════════════════════════════════════════════════════
-- PARTY MEMBER ACTIONS — Door Knocking + Give a Speech
-- ════════════════════════════════════════════════════════════════════
-- First two ground-floor actions a lowly party member can take from
-- party.html's Actions panel. Both are member-only (caller's politician
-- faction must have politician_party_id = the party).
--
-- Door Knocking — no cooldown, slow trickle.
--   +0.1 Party Popularity (factions.popularity_pct, clamped 0..100)
--   +0.1 Influence (politician_influence)
--
-- Give a Speech — 1d6 + Charisma, three-tick cooldown.
--   ≤3 → -2 Popularity, -1 Influence (player got booed)
--   4-6 → +1 Popularity
--   ≥7 → +1 Popularity, +1 Influence
--
-- ── Schema changes ──
-- politician_influence widens from INT to NUMERIC so the 0.1-step
-- door-knock reward can land at its intended granularity (the speech
-- action could have stayed INT, but writing the column twice with two
-- types is the duplication trap the design philosophy warns about).
-- Existing INT values survive the cast unchanged; the topbar +
-- members panel already coerce via Number() so display sites are
-- unaffected.
--
-- speech_cooldown_until_tick is a per-action ready-at column on
-- factions. Single column instead of a generic politician_action_log
-- table because there's only one cooldowned action right now —
-- promote to a table when the 3rd cooldowned action arrives, not
-- before.
--
-- ── Gating ──
-- Members-only by re-checking politician_party_id on the caller, same
-- pattern as send_party_message in 20270380. Re-roll/no-op logic for
-- nonsensical actions (e.g. door-knocking for a party you left) is
-- handled by the not_member return.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Influence becomes fractional ──
ALTER TABLE factions
    ALTER COLUMN politician_influence TYPE NUMERIC USING politician_influence::numeric;
ALTER TABLE factions
    ALTER COLUMN politician_influence SET DEFAULT 0;

-- ── 2. Per-action cooldown column ──
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS speech_cooldown_until_tick INT;

-- ── 3. politician_door_knock — no cooldown ──
CREATE OR REPLACE FUNCTION public.politician_door_knock(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol_id  uuid;
    v_new_pop numeric;
    v_new_inf numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT id INTO v_pol_id FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND politician_party_id = p_party_id
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    UPDATE factions
       SET popularity_pct = LEAST(100, GREATEST(0, COALESCE(popularity_pct, 0) + 0.1))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
    RETURNING popularity_pct INTO v_new_pop;
    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    UPDATE factions
       SET politician_influence = COALESCE(politician_influence, 0) + 0.1
     WHERE id = v_pol_id
    RETURNING politician_influence INTO v_new_inf;

    RETURN jsonb_build_object(
        'success', true,
        'popularity_pct', v_new_pop,
        'politician_influence', v_new_inf
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_door_knock(uuid) TO authenticated;

-- ── 4. politician_give_speech — 1d6 + Charisma, 3-tick cooldown ──
-- Brackets are read as thresholds (≤3 / 4-6 / ≥7) so a high-Charisma
-- politician whose roll lands at 11 still counts as a 'good' speech,
-- rather than rolling off the user-stated 7-10 band.
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

    v_cooldown := v_tick + 3;
    UPDATE factions
       SET politician_influence       = GREATEST(0, COALESCE(politician_influence, 0) + v_inf_delta),
           speech_cooldown_until_tick = v_cooldown
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_inf;

    RETURN jsonb_build_object(
        'success',              true,
        'roll',                 v_roll,
        'charisma',             COALESCE(v_pol.politician_charisma, 0),
        'total',                v_total,
        'bracket',              v_bracket,
        'popularity_delta',     v_pop_delta,
        'influence_delta',      v_inf_delta,
        'popularity_pct',       v_new_pop,
        'politician_influence', v_new_inf,
        'cooldown_until_tick',  v_cooldown
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.politician_give_speech(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
