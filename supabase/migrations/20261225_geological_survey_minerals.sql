-- ════════════════════════════════════════════════════════════════
-- Ministry of the Interior — Geological Survey (Minerals)
--
-- New ministry action surfacing on politics.html → Actions subtab
-- under the Minister of Interior. Funds a geological survey of the
-- nation; rolls a simple equation; adds 0–18 percentage points to
-- the nation's `minerals` stat (clamped at 100).
--
-- Cost curve:
--   $8 (abstract) on first use → doubles every subsequent use.
--   No cooldown. The cost curve IS the cooldown — after ~10 uses
--   the price exceeds any realistic ministry discretionary balance.
--   $8 abstract = $8M raw, matching the Petition for Reform abstract
--   scale (1 abstract = $1M raw).
--
-- Counter is per-nation (does not reset across ministers or
-- governments) and is derived from a COUNT(*) on ministry_action_log
-- where action_key = 'geological_survey_minerals'. Single source of
-- truth: every successful run logs a row; the count is the doubling
-- exponent on the next run.
--
-- Roll:
--   d100  =   1 + floor(random() * 100)         -- 1..100
--   total =   d100 + minerals * 0.5             -- minerals 0-100 → +0..50
--
-- Outcome buckets:
--   total ≤  30        None         +0 minerals
--   total 31..60       Small        +(1d3 + 1)  = +2..+4
--   total 61..85       Moderate     +(1d8 + 3)  = +4..+11
--   total ≥  86        Huge         +(1d15 + 3) = +4..+18
--
-- Distribution shift:
--   minerals=  0 →  ~30/30/25/15  (None/Small/Moderate/Huge)
--   minerals= 50 →   ~5/30/35/30
--   minerals=100 →   ~0/10/25/65
--
-- Realism: a baseline "None" rate is preserved at every stat level —
-- even resource-rich nations get dry holes. The positive-feedback
-- ("more minerals → find more") loop is dampened by the doubling
-- cost so it doesn't run away.
--
-- Cost source: Minister of the Interior's discretionary_balance.
-- Same pattern as interior_infrastructure (20261106) and Finance
-- Debt Payment.

BEGIN;

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
    v_base_cost         CONSTANT BIGINT := 8000000;   -- $8 abstract = $8M raw
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

    -- Caller-holds-Interior auth + lock the ministry row so two
    -- concurrent surveys can't both pass the affordability check on
    -- a stale balance and both debit. Same pattern as
    -- post_interior_infrastructure (20261106).
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

    -- Doubling cost: count prior surveys IN THIS NATION (persists
    -- across ministers + administrations — geological surveys are a
    -- national program, not a ministerial prerogative).
    SELECT COUNT(*) INTO v_count
      FROM ministry_action_log
     WHERE nation_id = v_nation.id
       AND action_key = 'geological_survey_minerals';

    -- 8M * 2^count. Guard against overflow at extreme counts: BIGINT
    -- holds ~9.2e18, so power(2, 63) overflows. Cap at 60 doublings
    -- (cost = $9.2 quintillion) which no nation can possibly pay
    -- anyway. Defensive only.
    IF v_count >= 60 THEN
        v_cost := 9223372036854775000;
    ELSE
        v_cost := v_base_cost * (1::BIGINT << v_count);
    END IF;

    v_balance := COALESCE(v_ministry.discretionary_balance, 0);
    IF v_balance < v_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason',  'insufficient_balance',
            'cost',    v_cost,
            'balance', v_balance
        );
    END IF;

    -- ── Roll ──────────────────────────────────────────────────
    v_minerals := COALESCE(v_nation.minerals, 50);
    v_d100     := 1 + floor(random() * 100)::INT;
    v_total    := v_d100 + (v_minerals * 0.5);

    IF v_total <= 30 THEN
        v_bucket := 'none';
        v_delta  := 0;
    ELSIF v_total <= 60 THEN
        v_bucket := 'small';
        v_d3     := 1 + floor(random() * 3)::INT;        -- 1..3
        v_delta  := v_d3 + 1;                            -- 2..4
    ELSIF v_total <= 85 THEN
        v_bucket := 'moderate';
        v_d8     := 1 + floor(random() * 8)::INT;        -- 1..8
        v_delta  := v_d8 + 3;                            -- 4..11
    ELSE
        v_bucket := 'huge';
        v_d15    := 1 + floor(random() * 15)::INT;       -- 1..15
        v_delta  := v_d15 + 3;                           -- 4..18
    END IF;

    -- Clamp at 100; downstream production code (buildMineralsBucketDeltas
    -- in political-actions.js) divides minerals by 3 and expects the
    -- 0-100 range. Without the clamp, a string of Huge finds would
    -- push past the intended ceiling.
    v_new_minerals := LEAST(100, v_minerals + v_delta);

    -- ── Apply ─────────────────────────────────────────────────
    UPDATE nations SET minerals = v_new_minerals WHERE id = v_nation.id;

    UPDATE ministries
       SET discretionary_balance = v_balance - v_cost
     WHERE id = v_ministry.id;

    -- ── Action log row (drives the next-cost counter) ─────────
    INSERT INTO ministry_action_log (
        nation_id, ministry_key, action_key, faction_id,
        ap_cost, money_cost, applied_at_tick, cooldown_until_tick, action_data
    ) VALUES (
        v_nation.id, 'interior', 'geological_survey_minerals', v_ministry.party_id,
        0, v_cost, v_tick, v_tick,    -- no cooldown (cost curve handles it)
        jsonb_build_object(
            'survey_index',    v_count + 1,
            'd100',            v_d100,
            'minerals_before', v_minerals,
            'minerals_after',  v_new_minerals,
            'delta',           v_delta,
            'bucket',          v_bucket,
            'cost_raw',        v_cost,
            'next_cost_raw',   CASE WHEN v_count + 1 >= 60
                                    THEN 9223372036854775000
                                    ELSE v_base_cost * (1::BIGINT << (v_count + 1))
                               END
        )
    );

    -- ── Event log: flavor per outcome ─────────────────────────
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
        'next_cost',       CASE WHEN v_count + 1 >= 60
                                THEN 9223372036854775000
                                ELSE v_base_cost * (1::BIGINT << (v_count + 1))
                           END,
        'description',     v_description
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.geological_survey_minerals() TO authenticated;


-- ── Helper to expose the next cost to the client without forcing a
-- second round-trip after every refresh. Cheap, idempotent. Returns
-- the cost the CURRENT caller's nation would pay on its next survey.
CREATE OR REPLACE FUNCTION public.geological_survey_minerals_next_cost(p_nation_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT CASE
        WHEN COUNT(*) >= 60 THEN 9223372036854775000::BIGINT
        ELSE 8000000::BIGINT * (1::BIGINT << COUNT(*)::INT)
    END
    FROM ministry_action_log
    WHERE nation_id = p_nation_id
      AND action_key = 'geological_survey_minerals';
$$;

GRANT EXECUTE ON FUNCTION public.geological_survey_minerals_next_cost(UUID) TO authenticated, anon, service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
