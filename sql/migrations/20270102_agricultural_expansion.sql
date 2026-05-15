-- Ministry of Interior — Agricultural Expansion
--
-- Third workhorse survey action, alongside Geological Survey (20261225-7)
-- and National Energy Survey (20270101). Tuned closer to minerals:
--
--   • cost = $8M × 2^count  (doubling, 60-doubling BIGINT cap)
--   • cooldown = 12 ticks
--   • roll = 1d100 + (100 - farmland) × 0.5   ← inverted: geography
--     caps how much arable land a nation can have, so low-farmland
--     nations have more headroom for new reclamation projects
--   • four buckets (None / Small / Moderate / Major), mirroring minerals
--   • TRADEOFF: industry is only displaced at Major scale. Small and
--     Moderate are clean wins (reclaiming idle/marginal land); Major
--     represents sweeping land-use reform that converts industrial
--     belts to cultivation.
--
-- Bucket math:
--   total ≤ 30         None         farmland +0     industry  0
--   total 31..60       Small        farmland +(1d3 + 1)  = +2..4    industry  0
--   total 61..85       Moderate     farmland +(1d8 + 3)  = +4..11   industry  0
--   total ≥ 86         Major        farmland +(1d15 + 3) = +4..18   industry -(1d6 + 3) = -4..9
--
-- Distribution (with inverted bonus):
--   farmland =   0 →   0/30/25/45  (None/Small/Moderate/Major)
--   farmland =  50 →  20/30/25/25
--   farmland = 100 →  30/30/25/15
--
-- Stat writes: nations.farmland (clamped at 100); on Major also
-- nations.industry (clamped at 0 — a nation already at zero industry
-- takes no industrial hit and still gets the farmland gain).
--
-- Cost source: ministries.discretionary_balance for ministry_key='interior'.
-- Counter: COUNT(*) on ministry_action_log where
-- action_key='agricultural_expansion'.

BEGIN;

-- ── Canonical cost-curve helper ──────────────────────────────────
-- Same shape as _geological_survey_cost_at: $8M × 2^count, cap at 60
-- doublings (above which BIGINT wraps). Kept as a separate helper so
-- the cost curve can diverge from minerals in the future without
-- spooky-action-at-a-distance.
CREATE OR REPLACE FUNCTION public._agricultural_expansion_cost_at(p_count INT)
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

GRANT EXECUTE ON FUNCTION public._agricultural_expansion_cost_at(INT)
    TO authenticated, anon, service_role;


-- ── Main action RPC ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.agricultural_expansion()
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
    v_farmland          NUMERIC;
    v_new_farmland      NUMERIC;
    v_industry          NUMERIC;
    v_new_industry      NUMERIC;
    v_d100              INT;
    v_total             NUMERIC;
    v_bucket            TEXT;
    v_delta             INT;
    v_industry_delta    INT;
    v_d3                INT;
    v_d8                INT;
    v_d15               INT;
    v_d6                INT;
    v_event_name        TEXT;
    v_description       TEXT;
    v_cooldown          CONSTANT INT := 12;
    v_last_log          RECORD;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    -- Caller-holds-Interior auth + row lock so concurrent expansions
    -- can't both pass the affordability check on a stale balance and
    -- both debit. Same pattern as geological_survey_minerals().
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

    -- Cooldown gate (12 ticks). Closes the client-double-fire loophole.
    SELECT cooldown_until_tick, applied_at_tick INTO v_last_log
      FROM ministry_action_log
     WHERE nation_id    = v_nation.id
       AND action_key   = 'agricultural_expansion'
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
     WHERE nation_id  = v_nation.id
       AND action_key = 'agricultural_expansion';

    v_cost := _agricultural_expansion_cost_at(v_count);

    v_balance := COALESCE(v_ministry.discretionary_balance, 0);
    IF v_balance < v_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason',  'insufficient_balance',
            'cost',    v_cost,
            'balance', v_balance
        );
    END IF;

    -- ── Roll ─────────────────────────────────────────────────────
    -- Inverted bonus: low-farmland nations have more headroom.
    v_farmland := COALESCE(v_nation.farmland, 50);
    v_industry := COALESCE(v_nation.industry, 50);
    v_d100     := 1 + floor(random() * 100)::INT;
    v_total    := v_d100 + ((100 - v_farmland) * 0.5);

    -- Default to no industry change; only Major sets it.
    v_industry_delta := 0;
    v_new_industry   := v_industry;

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
        v_bucket := 'major';
        v_d15    := 1 + floor(random() * 15)::INT;       -- 1..15
        v_delta  := v_d15 + 3;                           -- 4..18
        v_d6     := 1 + floor(random() * 6)::INT;        -- 1..6
        v_industry_delta := v_d6 + 3;                    -- 4..9
        v_new_industry   := GREATEST(0, v_industry - v_industry_delta);
        -- Effective loss after the floor — used in the return payload
        -- and event log so the alert/UI shows the real number.
        v_industry_delta := (v_industry - v_new_industry)::INT;
    END IF;

    v_new_farmland := LEAST(100, v_farmland + v_delta);

    -- ── Apply ────────────────────────────────────────────────────
    -- Only write industry when the roll actually moved it (Major bucket
    -- with non-zero effective delta). Without this guard a Small or
    -- Moderate survey on a nation whose industry was NULL would silently
    -- coerce it to the COALESCE default (50), violating the "clean win
    -- under Major" contract.
    UPDATE nations SET farmland = v_new_farmland WHERE id = v_nation.id;
    IF v_industry_delta > 0 THEN
        UPDATE nations SET industry = v_new_industry WHERE id = v_nation.id;
    END IF;

    UPDATE ministries
       SET discretionary_balance = v_balance - v_cost
     WHERE id = v_ministry.id;

    INSERT INTO ministry_action_log (
        nation_id, ministry_key, action_key, faction_id,
        ap_cost, money_cost, applied_at_tick, cooldown_until_tick, action_data
    ) VALUES (
        v_nation.id, 'interior', 'agricultural_expansion', v_ministry.party_id,
        0, v_cost, v_tick, v_tick + v_cooldown,
        jsonb_build_object(
            'survey_index',    v_count + 1,
            'd100',            v_d100,
            'farmland_before', v_farmland,
            'farmland_after',  v_new_farmland,
            'delta',           v_delta,
            'industry_before', v_industry,
            'industry_after',  v_new_industry,
            'industry_delta',  v_industry_delta,
            'bucket',          v_bucket,
            'cost_raw',        v_cost
        )
    );

    -- ── Flavor per outcome ───────────────────────────────────────
    IF v_bucket = 'none' THEN
        v_event_name  := 'Agricultural Expansion: No Viable Zones';
        v_description := format(
            'Land-use surveyors canvas %s for conversion candidates and return empty-handed — every reviewed parcel is already farmed, protected, or unworkable. Budget consumed, no acres added.',
            v_nation.name);
    ELSIF v_bucket = 'small' THEN
        v_event_name  := 'Agricultural Expansion: Modest Reclamation';
        v_description := format(
            'Land-use boards approve a modest reclamation in %s. Surveyors identify dormant marginal land — old grazing tracts, dry wetlands — and bring it into agricultural production. No displacement, just slow accretion.',
            v_nation.name);
    ELSIF v_bucket = 'moderate' THEN
        v_event_name  := 'Agricultural Expansion: Regional Reclamation Program';
        v_description := format(
            'A regional reclamation program in %s unlocks significant new agricultural acreage. Idle land, marginal scrub, and reclaimed coastal flats enter the register. Industry hums on undisturbed.',
            v_nation.name);
    ELSE
        v_event_name  := 'Agricultural Expansion: Sweeping Land-Use Reform';
        v_description := format(
            'The Ministry of Interior pushes through a sweeping land-use reform in %s. Industrial belts on the city outskirts are cleared for cultivation, food production surges, and the manufacturing sector takes a real hit. Long-promised, finally delivered.',
            v_nation.name);
    END IF;

    INSERT INTO event_log (
        nation_id, event_name, trigger_key, category,
        description_chosen, effects_applied, fired_at_tick
    ) VALUES (
        v_nation.id, v_event_name, 'agricultural_expansion', 'ECONOMY',
        v_description,
        jsonb_build_object(
            'bucket',          v_bucket,
            'd100',            v_d100,
            'total',           round(v_total::NUMERIC, 1),
            'delta',           v_delta,
            'industry_delta',  v_industry_delta,
            'farmland_before', v_farmland,
            'farmland_after',  v_new_farmland,
            'industry_before', v_industry,
            'industry_after',  v_new_industry,
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
        'industry_delta',  v_industry_delta,
        'farmland_before', v_farmland,
        'farmland_after',  v_new_farmland,
        'industry_before', v_industry,
        'industry_after',  v_new_industry,
        'cost_paid',       v_cost,
        'next_cost',       _agricultural_expansion_cost_at(v_count + 1),
        'cooldown_until',  v_tick + v_cooldown,
        'description',     v_description
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.agricultural_expansion() TO authenticated;


-- ── Read-only companion helpers for the client ───────────────────
CREATE OR REPLACE FUNCTION public.agricultural_expansion_next_cost(p_nation_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT public._agricultural_expansion_cost_at(COUNT(*)::INT)
    FROM ministry_action_log
    WHERE nation_id  = p_nation_id
      AND action_key = 'agricultural_expansion';
$$;

GRANT EXECUTE ON FUNCTION public.agricultural_expansion_next_cost(UUID)
    TO authenticated, anon, service_role;


CREATE OR REPLACE FUNCTION public.agricultural_expansion_cooldown_until(p_nation_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT cooldown_until_tick
      FROM ministry_action_log
     WHERE nation_id  = p_nation_id
       AND action_key = 'agricultural_expansion'
     ORDER BY applied_at_tick DESC
     LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.agricultural_expansion_cooldown_until(UUID)
    TO authenticated, anon, service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
