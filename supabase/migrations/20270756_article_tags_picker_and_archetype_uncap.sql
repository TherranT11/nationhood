-- ════════════════════════════════════════════════════════════════════
-- 20270756 — Per-article tag picker + archetype cap removal
--
-- Two small loosenings on the Propose New Law modal surface:
--
-- 1. The modal now lets the user pick each article's tag
--    (OPERATIVE / REMEDY / ADMINISTRATIVE / DEFINITION / EXCEPTION)
--    instead of the server-side auto-cycle by position. The accepted
--    tag set in committee_propose_law adds 'administrative' as a
--    sibling to the legacy 'administration' value so old enacted-law
--    rows keep rendering and the new picker can write the friendlier
--    spelling forward. Both stay accepted; the client defaults the
--    third article to 'administrative'.
--
-- 2. The 2-archetype cap on support_archetypes / oppose_archetypes
--    is dropped. The canonical catalog has 10 entries
--    (_archetype_catalog_names from 20270686) and disjointness is
--    still enforced, so the natural cap is 10 per side. The DISTINCT
--    + catalog-membership checks in _validate_archetype_array were
--    already doing the structural work; only the hard `> 2` line
--    needed to go.
--
-- committee_propose_amendment doesn't need a tag change — it builds
-- its synthetic article with tag = 'operative' inline (20270686 line
-- 435) and that's still valid. The archetype validator change picks
-- it up for free via _validate_archetype_pair.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Lift the 2-archetype cap ──────────────────────────────────
-- Byte-faithful to 20270686 except the `jsonb_array_length > 2` gate
-- is removed. Catalog membership + uniqueness still enforced, so the
-- natural cap is the catalog size (10).
CREATE OR REPLACE FUNCTION public._validate_archetype_array(p_arr jsonb)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_names text[];
BEGIN
    IF p_arr IS NULL THEN RETURN true; END IF;
    IF jsonb_typeof(p_arr) <> 'array' THEN RETURN false; END IF;

    SELECT array_agg(DISTINCT v) INTO v_names
      FROM jsonb_array_elements_text(p_arr) v;
    v_names := COALESCE(v_names, ARRAY[]::text[]);

    -- DISTINCT in the agg removes dupes — if cardinality dropped vs
    -- the raw array, the original had a duplicate entry.
    IF cardinality(v_names) <> jsonb_array_length(p_arr) THEN RETURN false; END IF;

    -- Every name must be in the catalog.
    IF NOT (v_names <@ _archetype_catalog_names()) THEN RETURN false; END IF;

    RETURN true;
END $$;

-- ── 2. committee_propose_law — accept 'administrative' tag ───────
-- Byte-faithful to 20270753 except the article-tag accept list adds
-- 'administrative' alongside 'administration'. Both pass through to
-- the stored articles jsonb. Legacy rows keep their existing tags.
CREATE OR REPLACE FUNCTION public.committee_propose_law(
    p_committee_id      uuid,
    p_category          text,
    p_section           text,
    p_articles          jsonb,
    p_faction_id        uuid,
    p_persona_roles     jsonb DEFAULT NULL,
    p_support_archetypes jsonb DEFAULT NULL,
    p_oppose_archetypes  jsonb DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_comm            committees%ROWTYPE;
    v_tick            int;
    v_section         text;
    v_category        text;
    v_articles        jsonb;
    v_total_len       int := 0;
    v_n_articles      int;
    v_art             jsonb;
    v_text            text;
    v_id              uuid;
    v_committee_name  text;
    v_full_name       text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
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
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;

    -- 20270753: MP per-tick lock. Statute drafting is one of the
    -- three "pick one each tick" tiles.
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_mp_action_tick IS NOT NULL
       AND v_pol.next_mp_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_mp_action_tick, 'current_tick', v_tick);
    END IF;

    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_not_found');
    END IF;
    IF v_pol.nation_id IS NULL OR v_comm.nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_nation');
    END IF;

    v_category := lower(btrim(COALESCE(p_category, '')));
    IF v_category NOT IN ('civil','criminal','commercial','electoral') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_category');
    END IF;

    v_section := btrim(COALESCE(p_section, ''));
    IF length(v_section) < 1 OR length(v_section) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_section');
    END IF;

    IF jsonb_typeof(p_articles) <> 'array' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_articles');
    END IF;
    v_n_articles := jsonb_array_length(p_articles);
    IF v_n_articles < 1 OR v_n_articles > 10 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_articles');
    END IF;
    FOR v_art IN SELECT * FROM jsonb_array_elements(p_articles)
    LOOP
        IF jsonb_typeof(v_art) <> 'object' THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_articles');
        END IF;
        v_text := COALESCE(v_art->>'text', '');
        IF length(btrim(v_text)) = 0 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'empty_article');
        END IF;
        v_total_len := v_total_len + length(v_text);
    END LOOP;
    IF v_total_len > 600 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'articles_too_long',
            'total', v_total_len, 'cap', 600);
    END IF;

    -- 20270756: 'administrative' joins the accept list. Legacy
    -- 'administration' stays valid so historic data keeps round-
    -- tripping.
    SELECT jsonb_agg(
            jsonb_build_object(
                'ordinal', ord,
                'tag',     CASE
                              WHEN lower(COALESCE(elem->>'tag','')) IN
                                   ('operative','remedy','administration','administrative','definition','exception')
                              THEN lower(elem->>'tag')
                              ELSE 'operative'
                           END,
                'text',    btrim(elem->>'text')
            )
            ORDER BY ord
           )
      INTO v_articles
      FROM jsonb_array_elements(p_articles) WITH ORDINALITY AS t(elem, ord);

    IF NOT _validate_persona_roles(p_persona_roles) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_persona_roles');
    END IF;
    IF NOT _validate_archetype_pair(p_support_archetypes, p_oppose_archetypes) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_archetype_positions');
    END IF;

    INSERT INTO committee_proposals (
        committee_id, nation_id, author_faction_id,
        category, section, articles,
        status, proposed_at_tick,
        persona_roles, support_archetypes, oppose_archetypes
    ) VALUES (
        v_comm.id, v_comm.nation_id, v_pol.id,
        v_category, v_section, v_articles,
        'queued', v_tick,
        p_persona_roles, p_support_archetypes, p_oppose_archetypes
    )
    RETURNING id INTO v_id;

    v_committee_name := CASE v_comm.committee_key
        WHEN 'defense_foreign_affairs'  THEN 'Defence & Foreign Affairs Committee'
        WHEN 'finance_budget'           THEN 'Finance and Budget Committee'
        WHEN 'judiciary_constitutional' THEN 'Judiciary & Constitutional Affairs Committee'
        WHEN 'industry_trade_labor'     THEN 'Industry, Trade and Labor Committee'
        WHEN 'interior_public_welfare'  THEN 'Interior & Public Welfare Committee'
        ELSE 'a committee'
    END;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' || COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick, 'proposed_law', v_section,
        jsonb_build_object(
            'committee_key',  v_comm.committee_key,
            'committee_name', v_committee_name,
            'category',       v_category,
            'proposal_id',    v_id
        )
    );

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        'Law Proposed',
        v_full_name
            || ' has submitted a law proposal titled: ' || v_section
            || ', that has been sent to the ' || v_committee_name || '.',
        'politician',
        'politician_proposed_law',
        v_tick
    );

    -- 20270753: burn the MP per-tick lock.
    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',           true,
        'proposal_id',       v_id,
        'committee_id',      v_comm.id,
        'committee_key',     v_comm.committee_key,
        'proposed_at_tick',  v_tick,
        'next_action_tick',  v_tick + 1
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.committee_propose_law(uuid, text, text, jsonb, uuid, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_propose_law(uuid, text, text, jsonb, uuid, jsonb, jsonb, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
