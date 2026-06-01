-- ════════════════════════════════════════════════════════════════════
-- Party Member actions — redesign with asymmetric risk/reward
--
-- Replaces the v1 actions from 20270381:
--   Door Knocking:  no-cooldown +0.1 Influence / +0.1 Party Popularity
--   Give a Speech:  1d6 + Charisma, 3-tick cooldown, three brackets
--                   that all hurt the party AND the player together
--
-- With asymmetric archetypes that lock the player into a career bet:
--
-- ── Door Knocking — personal-first, party eats your stumbles ─────────
--   Roll: 1d6 + Reputation
--   Natural 1 → -1 Party Popularity (catastrophic off-message moment)
--   Total < 5 → -0.5 Party Popularity (off-message)
--   Total ≥ 5 → +0.2 Influence (standard win)
--   Natural 6 → +0.4 Influence (great day on the doors)
--   Cooldown: 2 ticks
--
-- ── Give a Speech — party-first, you eat the embarrassment ───────────
--   Roll: 1d6 + Charisma
--   Natural 1 → -3 Reputation (career-defining bomb)
--   Total < 5 → -2 Reputation (rough speech)
--   Total ≥ 5 → +0.2 Party Popularity (standard win)
--   Natural 6 → +0.4 Party Popularity (electrifying)
--   Cooldown: 3 ticks
--
-- ── Scaling property ────────────────────────────────────────────────
-- Natural 1 always crashes regardless of stat. Natural 6 always crits.
-- At Charisma 4+, total < 5 never fires (minimum total = 5), so the
-- distribution is 1/6 crash + 4/6 standard hit + 1/6 crit = 83%
-- success with a perpetual ~17% bomb floor. Low-stat politicians
-- accumulate the standard-fail penalty fast — speech specifically
-- destroys a Charisma-1 politician's Reputation (~-56 over 48 attempts).
--
-- ── Per-action cooldown column ──────────────────────────────────────
-- Door Knocking was no-cooldown in v1; now needs a 2-tick stamp.
-- New door_knock_cooldown_until_tick column parallel to the existing
-- speech_cooldown_until_tick. The shared per-turn next_member_action_tick
-- gate stays in place — you still pick ONE action per turn — but each
-- action also has its own re-up window.
--
-- ── Magnitude choice (+0.2 / +0.4 / -0.5 / -2 / -1 / -3) ────────────
-- Player picked these. They make the successes slow-grind (over a
-- game year of 144 ticks at max-rate spam, Charisma-4 speech gives
-- ~+10 Party Popularity, -24 Reputation — the asymmetric story is
-- baked into the magnitudes themselves: failures hurt proportionally
-- harder than successes help.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Per-action cooldown column for Door Knocking ───────────────
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS door_knock_cooldown_until_tick INT;

REVOKE UPDATE (door_knock_cooldown_until_tick)
    ON factions FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN factions.door_knock_cooldown_until_tick IS
    'Earliest tick at which this politician may Door Knock again. Stamped to current_tick + 2 by politician_door_knock on any non-rejected call (success OR failure — both consume the cooldown). NULL = no cooldown. Server-only writes (RPC-only).';

-- ── 2. politician_door_knock — 1d6 + Reputation, 2-tick cooldown ──
-- Outcomes by die roll:
--   Natural 1  → crit_fail   → -1   Party Popularity
--   Total < 5  → fail        → -0.5 Party Popularity
--   Total ≥ 5  → hit         → +0.2 Influence
--   Natural 6  → crit        → +0.4 Influence
-- Natural 1 and 6 are absolute (override the total threshold).
CREATE OR REPLACE FUNCTION public.politician_door_knock(p_party_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_roll      int;
    v_total     int;
    v_bracket   text;
    v_pop_delta numeric := 0;
    v_inf_delta numeric := 0;
    v_new_pop   numeric;
    v_new_inf   numeric;
    v_cooldown  int;
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
    IF v_pol.door_knock_cooldown_until_tick IS NOT NULL
       AND v_pol.door_knock_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.door_knock_cooldown_until_tick);
    END IF;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + COALESCE(v_pol.politician_reputation, 0);

    IF v_roll = 1 THEN
        v_bracket   := 'crit_fail';
        v_pop_delta := -1;
    ELSIF v_roll = 6 THEN
        v_bracket   := 'crit';
        v_inf_delta := 0.4;
    ELSIF v_total >= 5 THEN
        v_bracket   := 'hit';
        v_inf_delta := 0.2;
    ELSE
        v_bracket   := 'fail';
        v_pop_delta := -0.5;
    END IF;

    UPDATE factions
       SET popularity_pct = LEAST(100, GREATEST(0, COALESCE(popularity_pct, 0) + v_pop_delta))
     WHERE id = p_party_id
       AND faction_type = 'movement_party'
    RETURNING popularity_pct INTO v_new_pop;
    IF v_new_pop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;

    v_cooldown := v_tick + 2;
    UPDATE factions
       SET politician_influence            = GREATEST(0, COALESCE(politician_influence, 0) + v_inf_delta),
           door_knock_cooldown_until_tick  = v_cooldown
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_inf;

    RETURN jsonb_build_object(
        'success',              true,
        'roll',                 v_roll,
        'reputation',           COALESCE(v_pol.politician_reputation, 0),
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
GRANT EXECUTE ON FUNCTION public.politician_door_knock(uuid) TO authenticated;

COMMENT ON FUNCTION public.politician_door_knock(uuid) IS
    'Party-member action. 1d6 + politician_reputation. Natural 1: -1 Party Popularity. Total <5: -0.5 Party Popularity. Total >=5: +0.2 Influence. Natural 6: +0.4 Influence. 2-tick cooldown. Asymmetric design (20270450): personal upside at risk of party brand.';

-- ── 3. politician_give_speech — redesigned brackets ──────────────
-- Outcomes by die roll:
--   Natural 1  → crit_fail   → -3   Reputation
--   Total < 5  → fail        → -2   Reputation
--   Total ≥ 5  → hit         → +0.2 Party Popularity
--   Natural 6  → crit        → +0.4 Party Popularity
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
    v_total := v_roll + COALESCE(v_pol.politician_charisma, 0);

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
        'charisma',             COALESCE(v_pol.politician_charisma, 0),
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
    'Party-member action. 1d6 + politician_charisma. Natural 1: -3 Reputation. Total <5: -2 Reputation. Total >=5: +0.2 Party Popularity. Natural 6: +0.4 Party Popularity. 3-tick cooldown. Asymmetric design (20270450): party-brand upside at risk of personal Reputation.';

NOTIFY pgrst, 'reload schema';

COMMIT;
