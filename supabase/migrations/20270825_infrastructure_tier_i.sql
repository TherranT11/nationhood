-- ════════════════════════════════════════════════════════════════════
-- 20270825 — Infrastructure Tier I joins the building types
--
-- The first non-residential building, full chain (user call): the
-- ordinance editor can commission it, the bid board carries it, and
-- corps draft it under a newly CHARTERED INFRASTRUCTURE category in
-- the Draft Blueprint modal.
--
--   Materials needed: 10 · build-time baseline: 12 ticks (minus
--   Structural Speed) — both user-set, heavier than Multitenant
--   Living (7 / 9). Quality tiers and their city effects apply
--   generically, as does the whole bid → award → build → complete
--   pipeline (it matches blueprint type to request type and reads
--   materials_needed off the blueprint).
--
--   CHECKs widened on ordinances / requests / blueprints;
--   create_ordinance + update_ordinance + draft_blueprint re-emitted
--   byte-faithful except the type lists (and draft_blueprint's
--   category-type pairing); construction_build_ticks re-emitted with
--   the 12-tick baseline.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.ordinances
    DROP CONSTRAINT IF EXISTS ordinances_construction_building_type_check;
ALTER TABLE public.ordinances
    ADD CONSTRAINT ordinances_construction_building_type_check CHECK (
        construction_building_type IS NULL OR construction_building_type IN
        ('single_story_home', 'double_story', 'multitenant_living', 'infrastructure_tier_i'));

ALTER TABLE public.construction_project_requests
    DROP CONSTRAINT IF EXISTS construction_project_requests_building_type_check;
ALTER TABLE public.construction_project_requests
    ADD CONSTRAINT construction_project_requests_building_type_check CHECK (
        building_type IN ('single_story_home', 'double_story', 'multitenant_living',
                          'infrastructure_tier_i'));

ALTER TABLE public.corp_blueprints
    DROP CONSTRAINT IF EXISTS corp_blueprints_building_type_check;
ALTER TABLE public.corp_blueprints
    ADD CONSTRAINT corp_blueprints_building_type_check CHECK (
        building_type IN ('single_story_home', 'double_story', 'multitenant_living',
                          'infrastructure_tier_i'));
ALTER TABLE public.corp_blueprints
    DROP CONSTRAINT IF EXISTS corp_blueprints_category_check;
ALTER TABLE public.corp_blueprints
    ADD CONSTRAINT corp_blueprints_category_check CHECK (
        category IN ('residential', 'infrastructure'));

-- ── construction_build_ticks — the 12-tick baseline ───────────────
CREATE OR REPLACE FUNCTION public.construction_build_ticks(
    p_building_type text,
    p_speed         int
) RETURNS int
LANGUAGE sql IMMUTABLE
AS $$
    SELECT GREATEST(1,
        CASE p_building_type
            WHEN 'single_story_home'     THEN 4
            WHEN 'double_story'          THEN 6
            WHEN 'multitenant_living'    THEN 9
            WHEN 'infrastructure_tier_i' THEN 12
            ELSE 6
        END - GREATEST(1, COALESCE(p_speed, 1)));
$$;

COMMENT ON FUNCTION public.construction_build_ticks(text, int) IS
    'Canonical build time: type baseline (single 4 / double 6 / multitenant 9 / infrastructure I 12 ticks) minus Structural Speed, floor 1. The ONLY place these baselines live.';

-- ── create_ordinance ──────────────────────────────────────────────
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
            ('single_story_home', 'double_story', 'multitenant_living',
             'infrastructure_tier_i')) THEN
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
            'pollution', 'jobs', 'services', 'affordability'
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

REVOKE EXECUTE ON FUNCTION public.create_ordinance(uuid, text, text, int, text[], text[], jsonb, boolean, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_ordinance(uuid, text, text, int, text[], text[], jsonb, boolean, text) TO authenticated;

-- ── update_ordinance ──────────────────────────────────────────────
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
            ('single_story_home', 'double_story', 'multitenant_living',
             'infrastructure_tier_i')) THEN
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
            'pollution', 'jobs', 'services', 'affordability'
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

REVOKE EXECUTE ON FUNCTION public.update_ordinance(uuid, uuid, text, text, int, text[], text[], jsonb, boolean, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.update_ordinance(uuid, uuid, text, text, int, text[], text[], jsonb, boolean, text) TO authenticated;

-- ── draft_blueprint — INFRASTRUCTURE chartered ────────────────────
CREATE OR REPLACE FUNCTION public.draft_blueprint(
    p_corp_id       uuid,
    p_category      text,
    p_building_type text,
    p_quality_tier  text,
    p_name          text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_fac  factions%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
    v_tick int;
    v_id   uuid;
    v_name text := TRIM(COALESCE(p_name, ''));
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF length(v_name) < 2 OR length(v_name) > 60 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_category NOT IN ('residential', 'infrastructure') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'category_not_chartered');
    END IF;
    -- Types pair with their category (20270825).
    IF (p_category = 'residential' AND p_building_type NOT IN
            ('single_story_home', 'double_story', 'multitenant_living'))
       OR (p_category = 'infrastructure' AND p_building_type <> 'infrastructure_tier_i')
       OR p_quality_tier NOT IN ('low_cost', 'standard', 'high_end', 'luxury', 'ultra_rich') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the corp row: the per-tick allowance check below must
    -- serialize against a concurrent draft.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    INSERT INTO corp_blueprints (
        corp_id, category, city, building_type, quality_tier,
        created_at_tick, name, materials_needed
    ) VALUES (
        p_corp_id, p_category, COALESCE(v_corp.hq_city, '—'),
        p_building_type, p_quality_tier, v_tick, v_name,
        CASE p_building_type
            WHEN 'single_story_home'    THEN 1
            WHEN 'double_story'         THEN 2
            WHEN 'multitenant_living'   THEN 7
            WHEN 'infrastructure_tier_i' THEN 10
            ELSE 1
        END
    ) RETURNING id INTO v_id;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = p_corp_id;

    RETURN jsonb_build_object('success', true, 'blueprint_id', v_id, 'name', v_name);
END $$;

REVOKE EXECUTE ON FUNCTION public.draft_blueprint(uuid, text, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.draft_blueprint(uuid, text, text, text, text) TO authenticated;

-- ── submit_public_bid — regression fix ────────────────────────────
-- 20270820's re-emit was generated from the pre-20270809 body and
-- silently restored the inline 4/6/9 CASE, bypassing
-- construction_build_ticks. Byte-faithful to 20270820 (international
-- gate + caps intact) except the helper call is back — so the
-- 12-tick infrastructure baseline reaches bid snapshots.
CREATE OR REPLACE FUNCTION public.submit_public_bid(
    p_request_id   uuid,
    p_blueprint_id uuid,
    p_price        bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_bp      corp_blueprints%ROWTYPE;
    v_req     construction_project_requests%ROWTYPE;
    v_tick    int;
    v_id      uuid;
    v_ticks   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_price IS NULL OR p_price < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;

    SELECT * INTO v_bp FROM corp_blueprints WHERE id = p_blueprint_id;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;

    -- Lock the corp row: the per-tick allowance check below must
    -- serialize against a concurrent executive action.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_bp.corp_id FOR UPDATE;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT * INTO v_req FROM construction_project_requests WHERE id = p_request_id;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_open',
            'status', v_req.status);
    END IF;
    IF v_req.building_type <> v_bp.building_type THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_type_mismatch');
    END IF;
    -- International bidding is a Level III Project Management
    -- privilege (20270820).
    IF v_req.nation_id IS DISTINCT FROM v_corp.hq_nation_id
       AND COALESCE(v_corp.pm_tier, 0) < 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'international_locked');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    v_ticks := construction_build_ticks(v_req.building_type, v_corp.pillar_speed);

    BEGIN
        INSERT INTO construction_project_bids (
            request_id, corp_id, blueprint_id, submitted_at_tick,
            price, quality, build_ticks
        ) VALUES (
            p_request_id, v_corp.id, p_blueprint_id, v_tick,
            p_price, GREATEST(1, COALESCE(v_corp.pillar_quality, 1)), v_ticks
        ) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_bid');
    END;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = v_corp.id;

    RETURN jsonb_build_object('success', true, 'bid_id', v_id, 'build_ticks', v_ticks);
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_public_bid(uuid, uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_public_bid(uuid, uuid, bigint) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
