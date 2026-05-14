-- Geological Survey: add a 12-tick cooldown.
--
-- User reported two surveys resolving in the same tick (the client
-- inflight flag only fires after the confirm dialog, so a fast
-- second click could slip through). Server-side cooldown closes
-- that loophole AND adds the realism handle the design wanted —
-- ~1 in-game year between national surveys.
--
-- Implementation mirrors the Finance Debt Payment pattern from
-- 20261213: ministry_action_log.cooldown_until_tick stores the
-- earliest tick the next survey may fire. The RPC checks it before
-- doing anything else, returns 'cooldown' + ready_at_tick on bail.
--
-- Cooldown is per-nation (the latest action_log row for this
-- nation + action_key wins). Persists across minister turnover —
-- same realism reasoning as the doubling cost counter.
--
-- A small companion helper geological_survey_minerals_cooldown_until(uuid)
-- exposes the cooldown to the client without exposing the full log
-- table, so the action card can render a lock state with a precise
-- "ready at tick N" message.

BEGIN;

-- ── RPC rewrite: add cooldown gate + stamp ────────────────────
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
    v_cooldown          CONSTANT INT := 12;
    v_last_log          RECORD;
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

    -- Cooldown gate. Per-nation: the most recent successful survey
    -- locks the next one for 12 ticks. Closes the client-double-fire
    -- loophole the inflight flag couldn't cover (confirm dialog races).
    SELECT cooldown_until_tick, applied_at_tick INTO v_last_log
      FROM ministry_action_log
     WHERE nation_id    = v_nation.id
       AND action_key   = 'geological_survey_minerals'
     ORDER BY applied_at_tick DESC LIMIT 1;
    IF v_last_log.cooldown_until_tick IS NOT NULL
       AND v_last_log.cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object(
            'success',       false,
            'reason',        'cooldown',
            'ready_at_tick', v_last_log.cooldown_until_tick
        );
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

    INSERT INTO ministry_action_log (
        nation_id, ministry_key, action_key, faction_id,
        ap_cost, money_cost, applied_at_tick, cooldown_until_tick, action_data
    ) VALUES (
        v_nation.id, 'interior', 'geological_survey_minerals', v_ministry.party_id,
        0, v_cost, v_tick, v_tick + v_cooldown,    -- cooldown stamp
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
        'cooldown_until',  v_tick + v_cooldown,
        'description',     v_description
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.geological_survey_minerals() TO authenticated;


-- ── Companion helper: cooldown_until_tick for a nation ────────
-- Returns the earliest tick the next survey can fire, or NULL if
-- no survey has ever run for this nation (cooldown not active).
-- The client uses this to gate the action-card lock and message.
CREATE OR REPLACE FUNCTION public.geological_survey_minerals_cooldown_until(p_nation_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT cooldown_until_tick
      FROM ministry_action_log
     WHERE nation_id  = p_nation_id
       AND action_key = 'geological_survey_minerals'
     ORDER BY applied_at_tick DESC
     LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.geological_survey_minerals_cooldown_until(UUID)
    TO authenticated, anon, service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
