-- ════════════════════════════════════════════════════════════════════
-- 20270881 — City stat rename: Jobs → Unemployment (inverted)
--
-- Per user spec: rename the city Jobs stat to Unemployment and
-- mirror every effect — what raised Jobs now lowers Unemployment.
-- Stored values flip (11 − x on the 1-10 scale) so every city keeps
-- its current meaning: Jobs 9 ('Robust Hiring') becomes
-- Unemployment 2. Two direction calls confirmed by the user:
--   • plant completion HIRES (−3 Unemployment, was −3 Jobs filling
--     openings) — plants are now unambiguously good for the city;
--   • construction stays −3%/point but reads off Unemployment
--     directly (idle labor is cheap labor) — cheap/expensive
--     cities therefore swap.
--
-- Touched:
--   1. cities.jobs → cities.unemployment; values flipped + clamped;
--      CHECK tightened from the never-true 0-100 band to the real
--      1-10 convention; DEFAULT 50 → 5.
--   2. ordinances.stat_effects rows: key 'jobs' → 'unemployment',
--      delta negated. Proposals/enacted reference the catalog by
--      id (no snapshots) so in-flight votes inherit the flip; the
--      resolver applies keys dynamically (format %I) — no re-emit.
--   3. create_ordinance / update_ordinance (20270805 bodies):
--      stat-key whitelist swap.
--   4. request_building_construction (20270750 body): city-picker
--      discount reads unemployment.
--   5. mayor_enact_tax_package (20270750 body): the package's
--      labor cost RAISES unemployment, rejected past the 10
--      ceiling ('unemployment_too_high' replaces
--      'insufficient_jobs'; return key jobs_cost →
--      unemployment_cost — nothing client-side read the old key).
--   6. plant_expansion_cost + complete_construction_projects
--      (20270864 bodies): pitch pricing reads unemployment; the
--      completed plant hires (−3).
-- Client moves in lockstep: CITY_STATS entry + inverted bands,
-- city selects, the corp/businessman cost mirrors, and the mayor
-- tax-package error copy.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Column rename + value flip + honest constraints ───────────
ALTER TABLE public.cities RENAME COLUMN jobs TO unemployment;

UPDATE public.cities
   SET unemployment = GREATEST(1, LEAST(10, 11 - COALESCE(unemployment, 5)));

ALTER TABLE public.cities ALTER COLUMN unemployment SET DEFAULT 5;
ALTER TABLE public.cities DROP CONSTRAINT IF EXISTS cities_jobs_check;
ALTER TABLE public.cities ADD CONSTRAINT cities_unemployment_check
    CHECK (unemployment BETWEEN 1 AND 10);

COMMENT ON COLUMN public.cities.unemployment IS
    '20270881 — renamed/inverted from jobs (values flipped 11-x). 1-10, LOW is good. UI maps the 5-band label (Near-Full Employment → Mass Unemployment). Lowered by hiring (plant completions), raised by mayor tax packages; -3% construction discount per point (idle labor is cheap).';

-- ── 2. Catalog data flip ──────────────────────────────────────────
UPDATE public.ordinances
   SET stat_effects = (
        SELECT COALESCE(jsonb_agg(
            CASE WHEN e->>'key' = 'jobs'
                 THEN jsonb_set(jsonb_set(e, '{key}', '"unemployment"'),
                                '{delta}', to_jsonb(-((e->>'delta')::int)))
                 ELSE e END ORDER BY ord), '[]'::jsonb)
          FROM jsonb_array_elements(stat_effects) WITH ORDINALITY AS t(e, ord))
 WHERE stat_effects @> '[{"key": "jobs"}]'::jsonb;

-- ── 3. Ordinance authoring whitelists ─────────────────────────────
CREATE OR REPLACE FUNCTION public.create_ordinance(
    p_faction_id        uuid,
    p_name              text,
    p_description       text,
    p_cost              int,
    p_support_archetypes text[],
    p_oppose_archetypes  text[],
    p_stat_effects      jsonb,
    p_construction_request boolean DEFAULT false,
    p_construction_building_type text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_id        uuid;
    v_name      text;
    v_desc      text;
    v_support   text[];
    v_oppose    text[];
    v_overlap   int;
    v_effects   jsonb := '[]'::jsonb;
    v_eff       jsonb;
    v_key       text;
    v_delta     int;
    v_seen_keys text[] := ARRAY[]::text[];
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    -- Admins curate the catalog and may author without holding an
    -- office; their politician (when passed) gets the byline,
    -- otherwise the ordinance is unattributed. Everyone else needs
    -- an authoring office.
    IF is_admin() THEN
        IF p_faction_id IS NOT NULL THEN
            SELECT * INTO v_pol FROM factions
             WHERE id = p_faction_id
               AND faction_type = 'politician'
               AND (id = v_uid OR linked_user_id = v_uid);
        END IF;
    ELSE
        IF p_faction_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
        END IF;
        SELECT * INTO v_pol FROM factions
         WHERE id = p_faction_id
           AND faction_type = 'politician'
           AND abandoned_at IS NULL
           AND (id = v_uid OR linked_user_id = v_uid);
        IF v_pol.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
        END IF;
        IF v_pol.politician_office NOT IN
           ('mayor', 'city_council_member', 'city_council_president') THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_office');
        END IF;
    END IF;

    v_name := btrim(COALESCE(p_name, ''));
    v_desc := btrim(COALESCE(p_description, ''));
    IF length(v_name) < 1 OR length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF length(v_desc) < 1 OR length(v_desc) > 400 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_description');
    END IF;
    -- 20270741: cost can be negative (ordinance PAYS the city on pass).
    IF p_cost IS NULL OR p_cost < -100 OR p_cost > 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_cost');
    END IF;
    -- 20270805: a construction request must name a chartered type.
    IF COALESCE(p_construction_request, false)
       AND (p_construction_building_type IS NULL OR p_construction_building_type NOT IN
            ('single_story_home', 'double_story', 'multitenant_living')) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;

    -- Archetypes — same normalisation as 20270739: dedupe non-empty,
    -- reject anything outside the canonical 10, reject support/oppose
    -- overlap.
    v_support := ARRAY(SELECT DISTINCT a FROM unnest(COALESCE(p_support_archetypes, ARRAY[]::text[])) a
                       WHERE btrim(a) <> '');
    v_oppose  := ARRAY(SELECT DISTINCT a FROM unnest(COALESCE(p_oppose_archetypes,  ARRAY[]::text[])) a
                       WHERE btrim(a) <> '');
    IF EXISTS (
        SELECT 1 FROM unnest(v_support || v_oppose) a
         WHERE a NOT IN (
             'Reform', 'Social Democratic', 'Traditional Conservative',
             'Liberal', 'Libertarian', 'Communist / Leftist',
             'Green', 'Nationalist', 'Populist', 'Centrist'
         )
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_archetype');
    END IF;
    SELECT count(*) INTO v_overlap FROM unnest(v_support) s
     WHERE s = ANY(v_oppose);
    IF v_overlap > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'archetype_overlap');
    END IF;

    -- 20270741: stat_effects validation. Each element must be
    -- {key, delta} with key in the 9-stat allowlist + delta in
    -- -10..10. At most one effect per key — duplicates rejected
    -- since they'd let the form author contradictory rows.
    IF p_stat_effects IS NULL OR jsonb_typeof(p_stat_effects) <> 'array' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_effects');
    END IF;
    FOR v_eff IN SELECT * FROM jsonb_array_elements(p_stat_effects)
    LOOP
        IF jsonb_typeof(v_eff) <> 'object' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_effects');
        END IF;
        v_key   := v_eff->>'key';
        v_delta := (v_eff->>'delta')::int;
        IF v_key IS NULL OR v_key NOT IN (
            'infrastructure', 'appeal', 'growth', 'crime', 'approval',
            'pollution', 'unemployment', 'services', 'affordability'
        ) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_key');
        END IF;
        IF v_delta IS NULL OR v_delta < -10 OR v_delta > 10 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_delta');
        END IF;
        IF v_key = ANY(v_seen_keys) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'duplicate_stat_key');
        END IF;
        v_seen_keys := v_seen_keys || v_key;
        v_effects := v_effects || jsonb_build_array(
            jsonb_build_object('key', v_key, 'delta', v_delta)
        );
    END LOOP;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO public.ordinances (
        name, description, cost,
        support_archetypes, oppose_archetypes,
        stat_effects,
        construction_request, construction_building_type,
        author_faction_id, created_at_tick
    ) VALUES (
        v_name, v_desc, p_cost,
        v_support, v_oppose,
        v_effects,
        COALESCE(p_construction_request, false),
        CASE WHEN COALESCE(p_construction_request, false)
             THEN p_construction_building_type ELSE NULL END,
        v_pol.id, v_tick
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'ordinance_id', v_id);
END $$;

CREATE OR REPLACE FUNCTION public.update_ordinance(
    p_ordinance_id      uuid,
    p_faction_id        uuid,
    p_name              text,
    p_description       text,
    p_cost              int,
    p_support_archetypes text[],
    p_oppose_archetypes  text[],
    p_stat_effects      jsonb,
    p_construction_request boolean DEFAULT false,
    p_construction_building_type text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_ord       ordinances%ROWTYPE;
    v_pol       factions%ROWTYPE;
    v_name      text;
    v_desc      text;
    v_support   text[];
    v_oppose    text[];
    v_overlap   int;
    v_effects   jsonb := '[]'::jsonb;
    v_eff       jsonb;
    v_key       text;
    v_delta     int;
    v_seen_keys text[] := ARRAY[]::text[];
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_ordinance_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_ord FROM ordinances WHERE id = p_ordinance_id FOR UPDATE;
    IF v_ord.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'ordinance_not_found');
    END IF;

    -- Admins curate the whole catalog; authoring offices edit their
    -- own work.
    IF NOT is_admin() THEN
        SELECT * INTO v_pol FROM factions
         WHERE id = p_faction_id
           AND faction_type = 'politician'
           AND abandoned_at IS NULL
           AND (id = v_uid OR linked_user_id = v_uid);
        IF v_pol.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
        END IF;
        IF v_pol.politician_office NOT IN
           ('mayor', 'city_council_member', 'city_council_president') THEN
            RETURN jsonb_build_object('success', false, 'reason', 'wrong_office');
        END IF;
        IF v_ord.author_faction_id IS DISTINCT FROM v_pol.id THEN
            RETURN jsonb_build_object('success', false, 'reason', 'not_author');
        END IF;
    END IF;

    v_name := btrim(COALESCE(p_name, ''));
    v_desc := btrim(COALESCE(p_description, ''));
    IF length(v_name) < 1 OR length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF length(v_desc) < 1 OR length(v_desc) > 400 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_description');
    END IF;
    IF p_cost IS NULL OR p_cost < -100 OR p_cost > 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_cost');
    END IF;
    IF COALESCE(p_construction_request, false)
       AND (p_construction_building_type IS NULL OR p_construction_building_type NOT IN
            ('single_story_home', 'double_story', 'multitenant_living')) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;

    v_support := ARRAY(SELECT DISTINCT a FROM unnest(COALESCE(p_support_archetypes, ARRAY[]::text[])) a
                       WHERE btrim(a) <> '');
    v_oppose  := ARRAY(SELECT DISTINCT a FROM unnest(COALESCE(p_oppose_archetypes,  ARRAY[]::text[])) a
                       WHERE btrim(a) <> '');
    IF EXISTS (
        SELECT 1 FROM unnest(v_support || v_oppose) a
         WHERE a NOT IN (
             'Reform', 'Social Democratic', 'Traditional Conservative',
             'Liberal', 'Libertarian', 'Communist / Leftist',
             'Green', 'Nationalist', 'Populist', 'Centrist'
         )
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_archetype');
    END IF;
    SELECT count(*) INTO v_overlap FROM unnest(v_support) s
     WHERE s = ANY(v_oppose);
    IF v_overlap > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'archetype_overlap');
    END IF;

    IF p_stat_effects IS NULL OR jsonb_typeof(p_stat_effects) <> 'array' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_effects');
    END IF;
    FOR v_eff IN SELECT * FROM jsonb_array_elements(p_stat_effects)
    LOOP
        IF jsonb_typeof(v_eff) <> 'object' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_effects');
        END IF;
        v_key   := v_eff->>'key';
        v_delta := (v_eff->>'delta')::int;
        IF v_key IS NULL OR v_key NOT IN (
            'infrastructure', 'appeal', 'growth', 'crime', 'approval',
            'pollution', 'unemployment', 'services', 'affordability'
        ) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_key');
        END IF;
        IF v_delta IS NULL OR v_delta < -10 OR v_delta > 10 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_delta');
        END IF;
        IF v_key = ANY(v_seen_keys) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'duplicate_stat_key');
        END IF;
        v_seen_keys := v_seen_keys || v_key;
        v_effects := v_effects || jsonb_build_array(
            jsonb_build_object('key', v_key, 'delta', v_delta)
        );
    END LOOP;

    UPDATE ordinances
       SET name                       = v_name,
           description                = v_desc,
           cost                       = p_cost,
           support_archetypes         = v_support,
           oppose_archetypes          = v_oppose,
           stat_effects               = v_effects,
           construction_request       = COALESCE(p_construction_request, false),
           construction_building_type = CASE WHEN COALESCE(p_construction_request, false)
                                             THEN p_construction_building_type ELSE NULL END
     WHERE id = p_ordinance_id;

    RETURN jsonb_build_object('success', true, 'ordinance_id', p_ordinance_id);
END $$;

-- ── 4. Construction city-picker discount ──────────────────────────
CREATE OR REPLACE FUNCTION public.request_building_construction(
    p_corp_id       uuid,
    p_name          text,
    p_building_type text,
    p_nation_id     uuid,
    p_tier          text,
    p_bidding_ticks int,
    p_city_id       uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid                uuid := auth.uid();
    v_fac                factions%ROWTYPE;
    v_corp               entrepreneur_corps%ROWTYPE;
    v_req_sector         text;
    v_prof               record;
    v_nation             record;
    v_city               cities%ROWTYPE;
    v_jobs               int;
    v_jobs_discount_pct  numeric;
    v_tax_active         boolean;
    v_discounted_cost    bigint;
    v_tick               int;
    v_id                 uuid;
    v_num                text;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL OR p_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_building_type NOT IN ('regional_hq','construction_yard','port','banking_office',
                               'real_estate_office','engine_assembly_plant','light_assembly_plant',
                               'aircraft_assembly_facility',
                               'apartment_basic','apartment_modest','apartment_luxury',
                               'pump_jack','refinery_small','refinery_regular','refinery_large',
                               'gas_station') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL OR v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    v_req_sector := corp_building_required_sector(p_building_type);
    IF v_req_sector IS NOT NULL AND v_req_sector <> v_corp.industry THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_sector',
            'required', v_req_sector, 'have', v_corp.industry);
    END IF;

    SELECT name, foundable_for_construction
      INTO v_nation
      FROM nations WHERE id = p_nation_id;
    IF v_nation.name IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found'); END IF;
    IF v_nation.foundable_for_construction IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_buildable');
    END IF;

    SELECT * INTO v_city FROM cities WHERE id = p_city_id FOR UPDATE;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;
    IF v_city.nation_id IS DISTINCT FROM p_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_wrong_nation');
    END IF;

    SELECT * INTO v_prof FROM corp_building_cost_profile(p_building_type, p_tier, p_nation_id);
    IF v_prof.cost IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier'); END IF;
    IF p_building_type = 'regional_hq' AND v_prof.eff_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    -- Unemployment discount (20270881): -3% per point — idle labor
    -- is cheap labor. cities.unemployment is 1-10-constrained
    -- per 20270736; NULL falls back to 0 (no discount).
    v_jobs              := COALESCE(v_city.unemployment, 0);
    v_jobs_discount_pct := v_jobs * 0.03;
    v_discounted_cost   := ROUND(v_prof.cost * (1 - v_jobs_discount_pct))::bigint;

    -- Tax Package discount: extra ×0.90 if charges remain. Multiplicative
    -- on top of the Jobs discount.
    v_tax_active := COALESCE(v_city.tax_package_discount_charges, 0) > 0;
    IF v_tax_active THEN
        v_discounted_cost := ROUND(v_discounted_cost * 0.90)::bigint;
    END IF;

    IF COALESCE(v_corp.treasury_cash, 0) < v_discounted_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_corp.treasury_cash, 0)::bigint, 'need', v_discounted_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_num  := 'BLD-' || v_tick || '-' || left(replace(gen_random_uuid()::text, '-', ''), 5);

    INSERT INTO ent_construction_contracts (
        contract_number, name, contract_type, issuer_corp_id, issuer_name,
        building_type, nation_id, city_id, tier, build_cost, spec_tier, timeline_ticks,
        bidding_closes_tick, completion_effects, created_at_tick
    ) VALUES (
        v_num, btrim(p_name), 'private', p_corp_id, v_corp.name,
        p_building_type, p_nation_id, p_city_id, v_prof.eff_tier, v_discounted_cost,
        NULL, v_prof.duration,
        v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6)), '{}'::jsonb, v_tick
    ) RETURNING id INTO v_id;

    -- Tax Package consumption: decrement charge, rebate +1 Growth +1 Jobs.
    IF v_tax_active THEN
        UPDATE cities
           SET tax_package_discount_charges = GREATEST(0, COALESCE(tax_package_discount_charges, 0) - 1),
               growth = LEAST(10, GREATEST(1, COALESCE(growth, 5) + 1)),
               jobs   = LEAST(10, GREATEST(1, COALESCE(jobs, 5)   + 1))
         WHERE id = p_city_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 'contract_id', v_id, 'contract_number', v_num,
        'building_type', p_building_type, 'tier', v_prof.eff_tier,
        'cost', v_discounted_cost, 'base_cost', v_prof.cost,
        'jobs_discount_pct', v_jobs_discount_pct,
        'tax_package_applied', v_tax_active,
        'duration', v_prof.duration,
        'bidding_closes_tick', v_tick + GREATEST(1, COALESCE(p_bidding_ticks, 6))
    );
END;
$$;

-- ── 5. Mayor tax package ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mayor_enact_tax_package(
    p_faction_id uuid,
    p_city_id    uuid,
    p_tier       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_city         cities%ROWTYPE;
    v_tick         int;
    v_tier         text;
    v_growth_cost  int;
    v_jobs_cost    int;
    v_charges_add  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    v_tier := COALESCE(p_tier, '');
    IF v_tier NOT IN ('minor', 'moderate', 'major') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office <> 'mayor' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mayor');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    SELECT * INTO v_city FROM cities WHERE id = p_city_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'city_not_found');
    END IF;
    -- Mayor-of-this-city check — same name+party stamp pattern the
    -- propose / collect-taxes / campaign actions use.
    IF v_city.nation_id IS DISTINCT FROM v_pol.nation_id
       OR v_city.mayor_first_name IS DISTINCT FROM v_pol.leader_first_name
       OR v_city.mayor_last_name  IS DISTINCT FROM v_pol.leader_last_name
       OR v_city.mayor_party_id   IS DISTINCT FROM v_pol.politician_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_this_citys_mayor');
    END IF;

    IF COALESCE(v_city.tax_package_discount_charges, 0) > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'package_active',
            'charges_remaining', v_city.tax_package_discount_charges);
    END IF;

    -- Tier → upfront cost + charges granted.
    IF v_tier = 'minor' THEN
        v_growth_cost := 1; v_jobs_cost := 1; v_charges_add := 2;
    ELSIF v_tier = 'moderate' THEN
        v_growth_cost := 2; v_jobs_cost := 2; v_charges_add := 3;
    ELSE  -- major
        v_growth_cost := 3; v_jobs_cost := 3; v_charges_add := 5;
    END IF;

    -- Require enough headroom to pay the upfront cost without
    -- dropping below the 1-10 stat floor.
    IF COALESCE(v_city.growth, 5) - v_growth_cost < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_growth',
            'have', v_city.growth, 'need', v_growth_cost + 1);
    END IF;
    -- 20270881: the package's labor cost now lands as RISING
    -- unemployment; reject when it would push past the 10 ceiling.
    IF COALESCE(v_city.unemployment, 5) + v_jobs_cost > 10 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'unemployment_too_high',
            'have', COALESCE(v_city.unemployment, 5), 'cost', v_jobs_cost);
    END IF;

    UPDATE cities
       SET growth = LEAST(10, GREATEST(1, COALESCE(growth, 5) - v_growth_cost)),
           unemployment = LEAST(10, GREATEST(1, COALESCE(unemployment, 5) + v_jobs_cost)),
           tax_package_discount_charges = v_charges_add
     WHERE id = p_city_id;

    UPDATE factions
       SET next_member_action_tick = v_tick + 1
     WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'tier',             v_tier,
        'charges',          v_charges_add,
        'growth_cost',      v_growth_cost,
        'unemployment_cost', v_jobs_cost,
        'next_action_tick', v_tick + 1
    );
END;
$$;

-- ── 6. Plant expansion pricing + completion ───────────────────────
CREATE OR REPLACE FUNCTION public.plant_expansion_cost(p_city_id uuid)
RETURNS bigint
LANGUAGE sql STABLE
AS $$
    SELECT ROUND(25000000 * (1 - COALESCE(c.unemployment, 0) * 0.03))::bigint
      FROM cities c WHERE c.id = p_city_id;
$$;

CREATE OR REPLACE FUNCTION public.complete_construction_projects(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_proj      RECORD;
    v_completed int := 0;
    v_tier      text;
    v_aff       numeric;
    v_app       numeric;
    v_req       construction_project_requests%ROWTYPE;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    FOR v_proj IN
        SELECT p.* FROM corp_construction_projects p
         WHERE p.status = 'building' AND p.completes_at_tick <= p_tick
           -- 20270817: a due build PARKS until its blueprint's
           -- materials have been supplied; it completes on the first
           -- sweep after the yard delivers. Blueprint-less projects
           -- owe nothing.
           AND p.materials_supplied >= COALESCE((
               SELECT b.materials_needed FROM corp_blueprints b
                WHERE b.id = p.blueprint_id), 0)
           -- 20270821: and one committed equipment use.
           AND p.equipment_supplied >= 1
         FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE corp_construction_projects SET status = 'completed'
         WHERE id = v_proj.id;
        -- The escrowed price lands; stamped through the revenue
        -- accumulator so the Finances cards and corporate tax both
        -- see construction income.
        UPDATE entrepreneur_corps
           SET treasury_cash = COALESCE(treasury_cash, 0) + v_proj.price,
               -- 20270823: completion grants Experience — System
               -- Design's +3 baseline plus the PM ladder bonus.
               -- 20270827: grant scales with System Design + PM,
               -- clamped at the design tier's Experience cap.
               experience = LEAST(experience_cap(design_tier),
                   COALESCE(experience, 0)
                   + completion_experience(pm_tier, design_tier))
         WHERE id = v_proj.corp_id;
        PERFORM stamp_entrepreneur_corp_revenue(v_proj.corp_id, p_tick, v_proj.price);

        -- Quality-tier city effects (20270810): the finished building
        -- moves the host city's stats. Tier comes from the blueprint
        -- (one source); a deleted blueprint or a city-less project
        -- simply applies nothing. Clamped 1..10 like the ordinance
        -- resolver's stat moves.
        --   low_cost +0.1 Affordability · standard — ·
        --   high_end −0.1 Affordability · luxury and ultra_rich
        --   −0.3 Affordability and +0.1 Appeal
        IF v_proj.city_id IS NOT NULL AND v_proj.blueprint_id IS NOT NULL THEN
            SELECT quality_tier INTO v_tier
              FROM corp_blueprints WHERE id = v_proj.blueprint_id;
            v_aff := CASE v_tier
                WHEN 'low_cost'   THEN  0.1
                WHEN 'high_end'   THEN -0.1
                WHEN 'luxury'     THEN -0.3
                WHEN 'ultra_rich' THEN -0.3
                ELSE 0 END;
            v_app := CASE v_tier WHEN 'luxury' THEN 0.1 WHEN 'ultra_rich' THEN 0.1 ELSE 0 END;
            IF v_aff <> 0 OR v_app <> 0 THEN
                UPDATE cities
                   SET affordability = GREATEST(1, LEAST(10, COALESCE(affordability, 5) + v_aff)),
                       appeal        = GREATEST(1, LEAST(10, COALESCE(appeal, 5)        + v_app))
                 WHERE id = v_proj.city_id;
            END IF;
        END IF;

        -- Plant expansion (20270864): a corp-requested build coming
        -- online adds one assembly line to the requester and moves
        -- the host city — +2 Growth, −3 Jobs (clamped 1..10).
        SELECT * INTO v_req FROM construction_project_requests
         WHERE id = v_proj.request_id;
        IF v_req.requester_corp_id IS NOT NULL THEN
            UPDATE entrepreneur_corps
               SET bonus_assembly_lines = COALESCE(bonus_assembly_lines, 0) + 1
             WHERE id = v_req.requester_corp_id;
            IF v_proj.city_id IS NOT NULL THEN
                UPDATE cities
                   SET growth = GREATEST(1, LEAST(10, COALESCE(growth, 5) + 2)),
                       -- 20270881: the factory hires townspeople.
                       unemployment = GREATEST(1, LEAST(10, COALESCE(unemployment, 5) - 3))
                 WHERE id = v_proj.city_id;
            END IF;
            PERFORM _log_corp_history(v_req.requester_corp_id, p_tick,
                format('Plant expansion in %s complete — a new assembly line comes online.', v_proj.city));
        END IF;

        v_completed := v_completed + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'completed', v_completed);
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
