-- ════════════════════════════════════════════════════════════════════
-- 20270743 — Fix Floor Speech: read 'skill' from the helper, not the
--             dead 'credibility' key
--
-- Player report: Floor Speech "always fails." Audit confirms it.
--
-- politician_mp_floor_speech reads (v_ctx->>'credibility') from
-- _mp_action_check, but the helper has not exposed that key since
-- 20270583 consolidated politician_credibility → politician_skill
-- and the helper started returning it under the key 'skill'.
-- Concrete trace of every call against the deployed RPC:
--
--   v_stat   := (v_ctx->>'credibility')::numeric;  -- key missing → NULL
--   v_total  := v_roll + v_stat;                   -- NUMERIC + NULL → NULL
--   v_passed := v_total >= 5;                      -- NULL >= 5 → NULL
--   IF v_passed THEN ... ELSE ... END IF;          -- IF NULL = false → ELSE
--
-- Every Floor Speech burns -1 popularity. The "passed" branch is
-- unreachable. The 20270665 header explicitly flagged this as a
-- "fix lives in a follow-up" item but no follow-up landed.
--
-- This re-emit:
--   • Swaps 'credibility' → 'skill' (the helper-current key for
--     politician_skill).
--   • Body otherwise byte-faithful to 20270665.
--
-- Hold a Rally NOT touched. The 20270665 header also flagged it
-- ("rallies are silently rolling against your bank balance") but
-- that diagnosis was wrong: the column rename chain
-- charisma → standing → influence → (20270646 swap) → capital
-- means the helper's 'charisma' key correctly resolves to
-- politician_capital, which is the small-ints network stat the
-- action is supposed to roll against. Rallies work as intended.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_mp_floor_speech(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_tick       int;
    v_roll       int;
    v_stat       numeric;
    v_total      numeric;
    v_passed     boolean;
    v_new_rep    int;
    v_new_pop    numeric;
    v_party_name text;
BEGIN
    v_ctx := _mp_action_check(p_faction_id);
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;
    -- 20270743: was 'credibility' — that key has been absent from the
    -- helper since 20270583's column consolidation. Reading it
    -- silently returned NULL, NULL propagated into v_total + v_passed,
    -- and the IF evaluated NULL as false → every Floor Speech took
    -- the fail branch.
    v_stat       := (v_ctx->>'skill')::numeric;

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

REVOKE EXECUTE ON FUNCTION public.politician_mp_floor_speech(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_mp_floor_speech(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
