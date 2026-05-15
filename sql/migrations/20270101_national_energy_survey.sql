-- Ministry of Energy — National Energy Survey
--
-- Sister action to the Geological Survey (20261225-7) but tuned to feel
-- rarer / bigger:
--
--   • cost = $8M × 3^count  (vs $8M × 2^count for minerals)
--   • cooldown = 24 ticks   (vs 12 ticks for minerals)  — 1 tick = 1 month
--   • roll bonus is INVERTED — low-energy nations have the headroom:
--       roll = 1d100 + (100 - energy) × 0.5
--     Self-balancing: every successful survey raises `energy`, which
--     lowers the bonus on the next attempt. The tripling cost AND the
--     diminishing bonus both push toward a soft ceiling.
--   • three outcome buckets (None / Modest / Major) — vs four for
--     minerals. Each tier feels more distinct because there are fewer
--     of them.
--
-- Bucket math:
--   total ≤ 45         None         +0
--   total 46..90       Modest       +(1d6  + 2)  = +3..+8
--   total ≥ 91         Major        +(1d12 + 4)  = +5..+16
--
-- Distribution (with inverted bonus):
--   energy =   0 →   0/45/55  (None/Modest/Major)
--   energy =  50 →  20/65/15
--   energy = 100 →  45/45/10
--
-- Stat: nations.energy (0-100), clamped at 100 on the way out.
-- Cost source: ministries.discretionary_balance for ministry_key='energy'.
-- Counter: COUNT(*) on ministry_action_log where
--          action_key='national_energy_survey'. One source of truth —
--          every successful run logs a row; the count is the exponent.

BEGIN;

-- ── Canonical cost-curve helper ──────────────────────────────────
-- p_count = number of prior successful surveys for the nation.
-- Cap at 25 doublings to keep the BIGINT in range: 3^25 ≈ 8.47e11,
-- × 8M ≈ 6.78e18, still under BIGINT max (9.22e18). 3^26 overflows.
CREATE OR REPLACE FUNCTION public._national_energy_survey_cost_at(p_count INT)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT CASE
        WHEN p_count IS NULL OR p_count < 0 THEN 8000000::BIGINT
        WHEN p_count >= 25                  THEN 6778308875544000000::BIGINT
        ELSE (8000000::NUMERIC * power(3::NUMERIC, p_count))::BIGINT
    END;
$$;

GRANT EXECUTE ON FUNCTION public._national_energy_survey_cost_at(INT)
    TO authenticated, anon, service_role;


-- ── Main action RPC ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.national_energy_survey()
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
    v_energy            NUMERIC;
    v_new_energy        NUMERIC;
    v_d100              INT;
    v_total             NUMERIC;
    v_bucket            TEXT;
    v_delta             INT;
    v_d6                INT;
    v_d12               INT;
    v_event_name        TEXT;
    v_description       TEXT;
    v_cooldown          CONSTANT INT := 24;
    v_last_log          RECORD;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    -- Caller-holds-Energy auth + row lock so concurrent surveys can't
    -- both pass the affordability check on a stale balance and both
    -- debit. Same pattern as geological_survey_minerals().
    SELECT * INTO v_ministry FROM ministries
        WHERE ministry_key = 'energy' AND is_active = true
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

    -- Cooldown gate. 24 ticks ~ 24 months between surveys; the cost
    -- curve is the long-term brake, this is the short-term anti-spam.
    SELECT cooldown_until_tick, applied_at_tick INTO v_last_log
      FROM ministry_action_log
     WHERE nation_id    = v_nation.id
       AND action_key   = 'national_energy_survey'
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
       AND action_key = 'national_energy_survey';

    v_cost := _national_energy_survey_cost_at(v_count);

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
    -- Inverted bonus: low-energy nations have more low-hanging fruit.
    v_energy := COALESCE(v_nation.energy, 50);
    v_d100   := 1 + floor(random() * 100)::INT;
    v_total  := v_d100 + ((100 - v_energy) * 0.5);

    IF v_total <= 45 THEN
        v_bucket := 'none';
        v_delta  := 0;
    ELSIF v_total <= 90 THEN
        v_bucket := 'modest';
        v_d6     := 1 + floor(random() * 6)::INT;       -- 1..6
        v_delta  := v_d6 + 2;                           -- 3..8
    ELSE
        v_bucket := 'major';
        v_d12    := 1 + floor(random() * 12)::INT;      -- 1..12
        v_delta  := v_d12 + 4;                          -- 5..16
    END IF;

    v_new_energy := LEAST(100, v_energy + v_delta);

    -- ── Apply ────────────────────────────────────────────────────
    UPDATE nations SET energy = v_new_energy WHERE id = v_nation.id;

    UPDATE ministries
       SET discretionary_balance = v_balance - v_cost
     WHERE id = v_ministry.id;

    INSERT INTO ministry_action_log (
        nation_id, ministry_key, action_key, faction_id,
        ap_cost, money_cost, applied_at_tick, cooldown_until_tick, action_data
    ) VALUES (
        v_nation.id, 'energy', 'national_energy_survey', v_ministry.party_id,
        0, v_cost, v_tick, v_tick + v_cooldown,
        jsonb_build_object(
            'survey_index',  v_count + 1,
            'd100',          v_d100,
            'energy_before', v_energy,
            'energy_after',  v_new_energy,
            'delta',         v_delta,
            'bucket',        v_bucket,
            'cost_raw',      v_cost
        )
    );

    -- ── Flavor per outcome ───────────────────────────────────────
    IF v_bucket = 'none' THEN
        v_event_name  := 'Energy Survey: No Findings';
        v_description := format(
            'Engineers commissioned by the Ministry of Energy comb %s for new generation sites and untapped capacity. The report is sober: no viable options stand out. The treasury is lighter; the grid hums on at its current limits.',
            v_nation.name);
    ELSIF v_bucket = 'modest' THEN
        v_event_name  := 'Energy Survey: Workable Opportunity';
        v_description := format(
            'A regional energy assessment yields a workable opportunity in %s — a hydro site, a wind corridor, an upgrade path to an existing plant. Modest, but real. Ministry engineers begin scoping work.',
            v_nation.name);
    ELSE
        v_event_name  := 'Energy Survey: Transformative Discovery';
        v_description := format(
            'The Ministry of Energy uncovers a transformative finding in %s. A renewable corridor, an untapped reserve, or a generation-leap upgrade — analysts call it a once-a-decade result. Investors and rival nations take notice.',
            v_nation.name);
    END IF;

    INSERT INTO event_log (
        nation_id, event_name, trigger_key, category,
        description_chosen, effects_applied, fired_at_tick
    ) VALUES (
        v_nation.id, v_event_name, 'national_energy_survey', 'ECONOMY',
        v_description,
        jsonb_build_object(
            'bucket',        v_bucket,
            'd100',          v_d100,
            'total',         round(v_total::NUMERIC, 1),
            'delta',         v_delta,
            'energy_before', v_energy,
            'energy_after',  v_new_energy,
            'cost_raw',      v_cost,
            'survey_index',  v_count + 1
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',        true,
        'bucket',         v_bucket,
        'd100',           v_d100,
        'total',          round(v_total::NUMERIC, 1),
        'delta',          v_delta,
        'energy_before',  v_energy,
        'energy_after',   v_new_energy,
        'cost_paid',      v_cost,
        'next_cost',      _national_energy_survey_cost_at(v_count + 1),
        'cooldown_until', v_tick + v_cooldown,
        'description',    v_description
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.national_energy_survey() TO authenticated;


-- ── Read-only companion helpers for the client ───────────────────
CREATE OR REPLACE FUNCTION public.national_energy_survey_next_cost(p_nation_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT public._national_energy_survey_cost_at(COUNT(*)::INT)
    FROM ministry_action_log
    WHERE nation_id  = p_nation_id
      AND action_key = 'national_energy_survey';
$$;

GRANT EXECUTE ON FUNCTION public.national_energy_survey_next_cost(UUID)
    TO authenticated, anon, service_role;


CREATE OR REPLACE FUNCTION public.national_energy_survey_cooldown_until(p_nation_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT cooldown_until_tick
      FROM ministry_action_log
     WHERE nation_id  = p_nation_id
       AND action_key = 'national_energy_survey'
     ORDER BY applied_at_tick DESC
     LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.national_energy_survey_cooldown_until(UUID)
    TO authenticated, anon, service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
