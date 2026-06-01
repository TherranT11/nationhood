-- ════════════════════════════════════════════════════════════════════
-- MP action cooldown: 6 → 1 tick
--
-- Per design change (20270460): MP actions (Floor Speech, Hold a
-- Rally, Fundraising Dinner) now stamp next_mp_action_tick to
-- current_tick + 1 instead of + 6. One per tick instead of one per
-- half-year. Per-action cooldown becomes the same shape as the
-- chamber's tick rhythm.
--
-- Floor Speech and Fundraising Dinner are re-pasted verbatim from
-- 20270434 with the cooldown swap. Hold a Rally is re-pasted from
-- 20270458 (which itself replaced 20270434 with the popularity-cap
-- clamp) with the same swap.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_mp_floor_speech()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_tick       int;
    v_roll       int;
    v_stat       int;
    v_total      int;
    v_passed     boolean;
    v_new_rep    int;
    v_new_pop    numeric;
    v_party_name text;
BEGIN
    v_ctx := _mp_action_check();
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;
    v_stat       := (v_ctx->>'credibility')::int;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + v_stat;
    v_passed := v_total >= 5;

    IF v_passed THEN
        UPDATE factions
           SET politician_reputation = COALESCE(politician_reputation, 0) + 1
         WHERE id = v_pol_id
        RETURNING politician_reputation INTO v_new_rep;
    ELSE
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
         WHERE id = v_party_id
        RETURNING popularity_pct INTO v_new_pop;
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'floor_speech',
        'roll',                 v_roll,
        'stat',                 v_stat,
        'total',                v_total,
        'passed',               v_passed,
        'new_reputation',       v_new_rep,
        'new_party_popularity', v_new_pop,
        'party_name',           v_party_name,
        'next_action_tick',     v_tick + 1
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.politician_mp_hold_rally()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_party_name text;
    v_tick       int;
    v_funds      bigint;
    v_roll       int;
    v_stat       int;
    v_total      int;
    v_passed     boolean;
    v_new_pop    numeric;
    v_new_rep    int;
    v_new_funds  numeric;
    v_cost       bigint := 10000;
BEGIN
    v_ctx := _mp_action_check();
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;
    v_funds      := (v_ctx->>'party_funds')::bigint;
    v_stat       := (v_ctx->>'charisma')::int;

    IF v_funds < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_party_funds',
            'have', v_funds, 'need', v_cost);
    END IF;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_cost
     WHERE id = v_party_id
    RETURNING party_funds INTO v_new_funds;

    v_roll  := 1 + floor(random() * 6)::int;
    v_total := v_roll + v_stat;
    v_passed := v_total >= 5;

    IF v_passed THEN
        UPDATE factions
           SET popularity_pct = LEAST(popularity_cap_pct, COALESCE(popularity_pct, 0) + 1)
         WHERE id = v_party_id
        RETURNING popularity_pct INTO v_new_pop;
    ELSE
        UPDATE factions
           SET politician_reputation = GREATEST(0, COALESCE(politician_reputation, 0) - 1)
         WHERE id = v_pol_id
        RETURNING politician_reputation INTO v_new_rep;
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'hold_rally',
        'roll',                 v_roll,
        'stat',                 v_stat,
        'total',                v_total,
        'passed',               v_passed,
        'cost',                 v_cost,
        'party_funds_after',    v_new_funds,
        'new_party_popularity', v_new_pop,
        'new_reputation',       v_new_rep,
        'party_name',           v_party_name,
        'next_action_tick',     v_tick + 1
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.politician_mp_fundraising_dinner()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_party_name text;
    v_tick       int;
    v_roll       int;
    v_stat       int;
    v_total      int;
    v_money      bigint;
    v_new_funds  numeric;
    v_new_inf    numeric;
    v_new_cha    int;
    v_stat_delta text := NULL;
BEGIN
    v_ctx := _mp_action_check();
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;
    v_stat       := (v_ctx->>'reputation')::int;

    v_roll  := 1 + floor(random() * 30)::int;
    v_total := v_roll + v_stat;
    v_money := (v_total * 1000)::bigint;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_money
     WHERE id = v_party_id
    RETURNING party_funds INTO v_new_funds;

    IF v_total <= 10 THEN
        UPDATE factions
           SET politician_influence = GREATEST(0, COALESCE(politician_influence, 0) - 1)
         WHERE id = v_pol_id
        RETURNING politician_influence INTO v_new_inf;
        v_stat_delta := 'influence';
    ELSIF v_total >= 25 THEN
        UPDATE factions
           SET politician_charisma = COALESCE(politician_charisma, 0) + 1
         WHERE id = v_pol_id
        RETURNING politician_charisma INTO v_new_cha;
        v_stat_delta := 'charisma';
    END IF;

    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',           true,
        'action',            'fundraising_dinner',
        'roll',              v_roll,
        'stat',              v_stat,
        'total',             v_total,
        'money_raised',      v_money,
        'party_funds_after', v_new_funds,
        'party_name',        v_party_name,
        'stat_delta',        v_stat_delta,
        'new_influence',     v_new_inf,
        'new_charisma',      v_new_cha,
        'next_action_tick',  v_tick + 1
    );
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
