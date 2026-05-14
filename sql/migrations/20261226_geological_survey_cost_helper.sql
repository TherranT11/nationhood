-- Geological Survey: audit cleanup — extract cost-curve helper (SoT)
--
-- Follow-up on 20261225_geological_survey_minerals. The audit pass
-- flagged that the cost formula `$8M * 2^count` (with a 60-doubling
-- BIGINT-overflow cap) was inlined in FOUR places inside that
-- migration:
--
--   1. geological_survey_minerals() — the live cost for this survey.
--   2. The same RPC's action_data.next_cost_raw — written but never
--      read; client reads the next_cost field on the RPC return
--      instead. Dead state.
--   3. The same RPC's return jsonb next_cost — what the client uses.
--   4. geological_survey_minerals_next_cost(uuid) — the standalone
--      helper that pre-loads the cost on page load.
--
-- The $8M base cost and the 60-cap were duplicated alongside each
-- formula. If the cost curve ever changes (e.g. tripling instead of
-- doubling, different base, different cap), four places would need
-- to stay in sync.
--
-- This migration:
--   • Adds the canonical helper:
--       _geological_survey_cost_at(p_count INT) → BIGINT
--   • Rewrites geological_survey_minerals() + the standalone
--     next_cost helper to call it.
--   • Drops the dead next_cost_raw write from action_data
--     (next_cost on the RPC return + the standalone helper are the
--      two real surfaces; the jsonb field was orphaned).
--
-- No behaviour change — same numbers come out, just from one source.

BEGIN;

-- ── Canonical cost-curve helper ──────────────────────────────────
-- p_count = number of prior successful surveys for the nation.
-- The cost of the (p_count + 1)-th survey is what callers actually
-- want, but expressing the helper as "cost at this index" makes the
-- call sites read naturally (current_cost = at(count); next_cost =
-- at(count + 1)). Cap at 60 doublings to keep the result inside
-- BIGINT (max ~9.22e18; 8M * 2^60 ~= 9.22e18, beyond which the
-- left-shift wraps to a negative).
CREATE OR REPLACE FUNCTION public._geological_survey_cost_at(p_count INT)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT CASE
        WHEN p_count IS NULL OR p_count < 0 THEN 8000000::BIGINT
        WHEN p_count >= 60                  THEN 9223372036854775000::BIGINT
        ELSE 8000000::BIGINT * (1::BIGINT << p_count)
    END;
$$;

GRANT EXECUTE ON FUNCTION public._geological_survey_cost_at(INT)
    TO authenticated, anon, service_role;


-- ── Rewrite the action RPC to use the helper ─────────────────────
CREATE OR REPLACE FUNCTION public.geological_survey_minerals()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller            UUID := auth.uid();
    v_ministry          ministries%ROWTYPE;
    v_nation            nations%ROWTYPE;
    v_tick              INT;
    v_count             INT;
    v_cost              BIGINT;
    v_balance           NUMERIC;
    v_minerals          NUMERIC;
    v_new_minerals      NUMERIC;
    v_d100              INT;
    v_total             NUMERIC;
    v_bucket            TEXT;
    v_delta             INT;
    v_d3                INT;
    v_d8                INT;
    v_d15               INT;
    v_event_name        TEXT;
    v_description       TEXT;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'interior' AND is_active = true
          AND EXISTS (
              SELECT 1 FROM factions f
              WHERE f.id = ministries.party_id
                AND (f.id = v_caller OR f.linked_user_id = v_caller)
          )
        ORDER BY created_at DESC LIMIT 1
        FOR UPDATE;
    IF v_ministry.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_minister');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = v_ministry.nation_id FOR UPDATE;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    SELECT COUNT(*) INTO v_count
      FROM ministry_action_log
     WHERE nation_id = v_nation.id
       AND action_key = 'geological_survey_minerals';

    v_cost := _geological_survey_cost_at(v_count);

    v_balance := COALESCE(v_ministry.discretionary_balance, 0);
    IF v_balance < v_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason',  'insufficient_balance',
            'cost',    v_cost,
            'balance', v_balance
        );
    END IF;

    v_minerals := COALESCE(v_nation.minerals, 50);
    v_d100     := 1 + floor(random() * 100)::INT;
    v_total    := v_d100 + (v_minerals * 0.5);

    IF v_total <= 30 THEN
        v_bucket := 'none';
        v_delta  := 0;
    ELSIF v_total <= 60 THEN
        v_bucket := 'small';
        v_d3     := 1 + floor(random() * 3)::INT;
        v_delta  := v_d3 + 1;
    ELSIF v_total <= 85 THEN
        v_bucket := 'moderate';
        v_d8     := 1 + floor(random() * 8)::INT;
        v_delta  := v_d8 + 3;
    ELSE
        v_bucket := 'huge';
        v_d15    := 1 + floor(random() * 15)::INT;
        v_delta  := v_d15 + 3;
    END IF;

    v_new_minerals := LEAST(100, v_minerals + v_delta);

    UPDATE nations SET minerals = v_new_minerals WHERE id = v_nation.id;
    UPDATE ministries
       SET discretionary_balance = v_balance - v_cost
     WHERE id = v_ministry.id;

    -- Action log row. `next_cost_raw` was previously written here but
    -- never read by anything; drop it. Callers that need the next
    -- cost read it from the RPC return or call the standalone helper.
    INSERT INTO ministry_action_log (
        nation_id, ministry_key, action_key, faction_id,
        ap_cost, money_cost, applied_at_tick, cooldown_until_tick, action_data
    ) VALUES (
        v_nation.id, 'interior', 'geological_survey_minerals', v_ministry.party_id,
        0, v_cost, v_tick, v_tick,
        jsonb_build_object(
            'survey_index',    v_count + 1,
            'd100',            v_d100,
            'minerals_before', v_minerals,
            'minerals_after',  v_new_minerals,
            'delta',           v_delta,
            'bucket',          v_bucket,
            'cost_raw',        v_cost
        )
    );

    IF v_bucket = 'none' THEN
        v_event_name  := 'Geological Survey: No Findings';
        v_description := format(
            'Surveyors commissioned by the Ministry of the Interior comb %s for new mineral deposits and find nothing of interest. The treasury is lighter, the maps are unchanged.',
            v_nation.name);
    ELSIF v_bucket = 'small' THEN
        v_event_name  := 'Geological Survey: Small Find';
        v_description := format(
            'A small mineral deposit is uncovered in the highlands of %s. Local miners celebrate; ministry geologists file a cautious report.',
            v_nation.name);
    ELSIF v_bucket = 'moderate' THEN
        v_event_name  := 'Geological Survey: Moderate Find';
        v_description := format(
            'Significant mineral veins are confirmed by the geological survey in %s. Industry rejoices; investors take note.',
            v_nation.name);
    ELSE
        v_event_name  := 'Geological Survey: Major Discovery';
        v_description := format(
            'A massive mineral deposit transforms the resource profile of %s. Ministry of the Interior announces the find publicly; foreign capital takes notice.',
            v_nation.name);
    END IF;

    INSERT INTO event_log (
        nation_id, event_name, trigger_key, category,
        description_chosen, effects_applied, fired_at_tick
    ) VALUES (
        v_nation.id, v_event_name, 'geological_survey_minerals', 'ECONOMY',
        v_description,
        jsonb_build_object(
            'bucket',          v_bucket,
            'd100',            v_d100,
            'total',           round(v_total::NUMERIC, 1),
            'delta',           v_delta,
            'minerals_before', v_minerals,
            'minerals_after',  v_new_minerals,
            'cost_raw',        v_cost,
            'survey_index',    v_count + 1
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',         true,
        'bucket',          v_bucket,
        'd100',            v_d100,
        'total',           round(v_total::NUMERIC, 1),
        'delta',           v_delta,
        'minerals_before', v_minerals,
        'minerals_after',  v_new_minerals,
        'cost_paid',       v_cost,
        'next_cost',       _geological_survey_cost_at(v_count + 1),
        'description',     v_description
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.geological_survey_minerals() TO authenticated;


-- ── Rewrite the next-cost helper to use the canonical formula ───
CREATE OR REPLACE FUNCTION public.geological_survey_minerals_next_cost(p_nation_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT public._geological_survey_cost_at(COUNT(*)::INT)
    FROM ministry_action_log
    WHERE nation_id = p_nation_id
      AND action_key = 'geological_survey_minerals';
$$;

GRANT EXECUTE ON FUNCTION public.geological_survey_minerals_next_cost(UUID)
    TO authenticated, anon, service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
