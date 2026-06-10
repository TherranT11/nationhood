-- ════════════════════════════════════════════════════════════════════
-- 20270805 — Ordinance edit pass + Construction Request ordinances
--
-- The Author Ordinance page is reworked around the catalog: the
-- always-on authoring card is gone, replaced by [Add New Ordinance]
-- and a per-row [Edit Ordinance]. Editing was explicitly "no edit
-- pass today" in 20270739 — today arrived. And ordinances gain a
-- Construction Request flag that bridges city politics into the
-- corp economy.
--
--   ordinances + construction_request / construction_building_type:
--   an ordinance flagged as a construction request carries one of
--   the chartered building types. When a CITY PASSES it (enact),
--   the resolver posts a construction_project_requests row — the
--   public bid board from 20270804 — as "City of {city}". The
--   ordinance is the demand side; corps bid on the supply side.
--
--   create_ordinance: regrown with the two construction params
--   (signature change — old 7-arg DROPPED to avoid a PostgREST
--   overload), and admins may now author without holding an office
--   (byline goes to their politician when passed, else
--   unattributed). Body otherwise byte-faithful to 20270741.
--
--   update_ordinance (new): admins (is_admin()) edit ANY ordinance —
--   the catalog is global content and the admin curates it; an
--   authoring-office politician (mayor / CCM / CCP) edits only their
--   own. p_faction_id is ignored for admins so an admin session
--   without a politician faction works. Validation blocks mirror
--   create_ordinance exactly. Edits change the template in place;
--   already-enacted copies resolved against the old text and are not
--   retroactively changed.
--
--   resolve_due_city_ordinance_proposals: byte-faithful to 20270747
--   except the construction-request INSERT after a successful enact.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.ordinances
    ADD COLUMN IF NOT EXISTS construction_request boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS construction_building_type text CHECK (
        construction_building_type IS NULL OR construction_building_type IN
        ('single_story_home', 'double_story', 'multitenant_living'));

-- ── create_ordinance — regrown with the construction params ───────
DROP FUNCTION IF EXISTS public.create_ordinance(uuid, text, text, int, text[], text[], jsonb);

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
DROP FUNCTION IF EXISTS public.update_ordinance(uuid, uuid, text, text, int, text[], text[], jsonb);

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

-- ── resolve_due_city_ordinance_proposals — post to the bid board ──
-- Body byte-faithful to 20270747 except the construction-request
-- INSERT after a successful enact.
CREATE OR REPLACE FUNCTION public.resolve_due_city_ordinance_proposals()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick        int;
    v_prop        RECORD;
    v_yes         int;
    v_no          int;
    v_pres_vote   text;
    v_passed      boolean;
    v_ord         ordinances%ROWTYPE;
    v_city        cities%ROWTYPE;
    v_eff         jsonb;
    v_key         text;
    v_delta       int;
    v_resolved    int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_prop IN
        SELECT * FROM city_ordinance_proposals
         WHERE status = 'voting'
           AND resolve_tick <= v_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        SELECT COUNT(*) FILTER (WHERE vote = 'yes'),
               COUNT(*) FILTER (WHERE vote = 'no')
          INTO v_yes, v_no
          FROM city_ordinance_proposal_votes
         WHERE proposal_id = v_prop.id;

        IF v_yes > v_no THEN
            v_passed := true;
        ELSIF v_yes < v_no THEN
            v_passed := false;
        ELSE
            SELECT vote INTO v_pres_vote
              FROM city_ordinance_proposal_votes
             WHERE proposal_id = v_prop.id AND seat_idx = 0;
            v_passed := COALESCE(v_pres_vote = 'yes', false);
        END IF;

        IF NOT v_passed THEN
            UPDATE city_ordinance_proposals
               SET status = 'rejected'
             WHERE id = v_prop.id;
            v_resolved := v_resolved + 1;
            CONTINUE;
        END IF;

        SELECT * INTO v_ord  FROM ordinances WHERE id = v_prop.ordinance_id;
        SELECT * INTO v_city FROM cities     WHERE id = v_prop.city_id;
        IF v_ord.id IS NULL OR v_city.id IS NULL THEN
            UPDATE city_ordinance_proposals
               SET status = 'rejected'
             WHERE id = v_prop.id;
            v_resolved := v_resolved + 1;
            CONTINUE;
        END IF;

        IF v_prop.kind = 'enact' THEN
            FOR v_eff IN SELECT * FROM jsonb_array_elements(v_ord.stat_effects)
            LOOP
                v_key   := v_eff->>'key';
                v_delta := (v_eff->>'delta')::int;
                IF v_key IS NULL OR v_delta IS NULL THEN
                    CONTINUE;
                END IF;
                EXECUTE format(
                    'UPDATE cities SET %I = GREATEST(1, LEAST(10, COALESCE(%I, 5) + $1)) WHERE id = $2',
                    v_key, v_key
                ) USING v_delta, v_city.id;
            END LOOP;

            UPDATE cities
               SET budget = GREATEST(0, COALESCE(budget, 0) - v_ord.cost)
             WHERE id = v_city.id;

            INSERT INTO city_ordinances (
                city_id, ordinance_id, status,
                enacted_at_tick, enacted_via_proposal_id
            ) VALUES (
                v_city.id, v_ord.id, 'active',
                v_tick, v_prop.id
            );

            -- Construction Request ordinances (20270805): passage is
            -- the demand signal — the project posts to the public
            -- bid board as "City of {city}".
            IF COALESCE(v_ord.construction_request, false)
               AND v_ord.construction_building_type IS NOT NULL THEN
                INSERT INTO construction_project_requests (
                    entity, requester_city_id, city, nation_id,
                    building_type, created_at_tick
                ) VALUES (
                    'City of ' || v_city.city_name, v_city.id, v_city.city_name,
                    v_city.nation_id, v_ord.construction_building_type, v_tick
                );
            END IF;
        ELSE  -- rescind
            UPDATE city_ordinances
               SET status                    = 'rescinded',
                   rescinded_at_tick         = v_tick,
                   rescinded_via_proposal_id = v_prop.id
             WHERE city_id      = v_city.id
               AND ordinance_id = v_ord.id
               AND status       = 'active';
        END IF;

        -- Proposer reward: +0.5 Skill on PASS (any kind).
        IF v_prop.proposer_faction_id IS NOT NULL THEN
            UPDATE factions
               SET politician_skill = COALESCE(politician_skill, 0) + 0.5
             WHERE id = v_prop.proposer_faction_id;
        END IF;

        -- Party popularity: ENACT only. +0.3 to every party in this
        -- nation whose archetype is in support_archetypes (clamped
        -- by popularity_cap_pct, floored at 0).
        IF v_prop.kind = 'enact' THEN
            UPDATE factions
               SET popularity_pct = LEAST(
                       COALESCE(popularity_cap_pct, 100),
                       GREATEST(0, COALESCE(popularity_pct, 0) + 0.3)
                   )
             WHERE faction_type = 'movement_party'
               AND abandoned_at IS NULL
               AND nation_id    = v_city.nation_id
               AND archetype    = ANY(v_ord.support_archetypes);
        END IF;

        UPDATE city_ordinance_proposals SET status = 'passed'
         WHERE id = v_prop.id;
        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'resolved', v_resolved);
END $$;

REVOKE EXECUTE ON FUNCTION public.resolve_due_city_ordinance_proposals() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resolve_due_city_ordinance_proposals() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
