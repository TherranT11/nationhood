-- Redesign politician_mp_fundraising_dinner — flat 1D20 in $1k,
-- always costs -1 party popularity.
--
-- Was (20270485):
--   roll = 1d30, money = (roll + reputation) × 1000
--   bracketed stat reward/penalty (≤10 = -1 PC, ≥25 = +1 standing)
--
-- Now:
--   roll = 1d20, money = roll × 1000 (range $1k–$20k)
--   ALWAYS -1 party popularity_pct (floored at 0) — donor circuit
--   buys money for visibility cost
--
-- The reward/penalty brackets + 'reputation' read from
-- _mp_action_check are gone — both unused by this function now.
-- Return envelope drops stat / stat_delta / new_charisma /
-- new_political_capital and gains new_party_popularity. Cooldown
-- (next_mp_action_tick = current_tick + 1) unchanged.

BEGIN;

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
    v_money      bigint;
    v_new_funds  numeric;
    v_new_pop    numeric;
BEGIN
    v_ctx := _mp_action_check();
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;

    v_roll  := 1 + floor(random() * 20)::int;
    v_money := (v_roll * 1000)::bigint;

    UPDATE factions
       SET party_funds    = COALESCE(party_funds, 0) + v_money,
           popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
     WHERE id = v_party_id
    RETURNING party_funds, popularity_pct INTO v_new_funds, v_new_pop;

    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'fundraising_dinner',
        'roll',                 v_roll,
        'money_raised',         v_money,
        'party_funds_after',    v_new_funds,
        'new_party_popularity', v_new_pop,
        'party_name',           v_party_name,
        'next_action_tick',     v_tick + 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_mp_fundraising_dinner() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
