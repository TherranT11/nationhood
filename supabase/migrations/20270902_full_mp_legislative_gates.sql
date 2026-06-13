-- ════════════════════════════════════════════════════════════════════
-- 20270902 — full_mp counts as a sitting MP in the legislative gates
--
-- 20270901 added the middle rung (office 'full_mp', display "Member of
-- Parliament") to the election engine. This wires it into the chamber-
-- power gates so a promoted Member of Parliament keeps full legislative
-- rights — propose laws / amendments / policy changes / tax holidays and
-- the shared member-action gate.
--
-- ONE SOURCE OF TRUTH: introduces _is_mp_office(text) — the single
-- definition of "which offices sit in the chamber". Every gate now calls
-- it instead of inlining IN ('member_of_parliament','senior_mp'), so the
-- next tier change is a one-line edit here, never another N-function
-- sweep. The five functions below are re-emitted verbatim from their
-- current definitions (20270665 / 20270892) with ONLY the gate line
-- swapped to NOT _is_mp_office(...).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 0. The single source of truth ────────────────────────────────
CREATE OR REPLACE FUNCTION public._is_mp_office(p_office text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $fn$
    SELECT p_office IN ('member_of_parliament', 'full_mp', 'senior_mp');
$fn$;
COMMENT ON FUNCTION public._is_mp_office(text) IS
    'TRUE when the office is a sitting-chamber MP tier (Junior MP / Member of Parliament / Senior MP). Single source of truth for every legislative gate — 20270902.';

-- ── 1. _mp_action_check — shared member-action gate (20270665) ────
CREATE OR REPLACE FUNCTION public._mp_action_check(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_pol   factions%ROWTYPE;
    v_party factions%ROWTYPE;
    v_tick  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'no_politician');
    END IF;
    IF NOT _is_mp_office(v_pol.politician_office) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'wrong_office',
            'have', v_pol.politician_office);
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_in_party');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_mp_action_tick IS NOT NULL AND v_pol.next_mp_action_tick > v_tick THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_mp_action_tick, 'current_tick', v_tick);
    END IF;

    SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id FOR UPDATE;
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'party_not_found');
    END IF;

    RETURN jsonb_build_object(
        'ok',                true,
        'politician_id',     v_pol.id,
        'skill',       COALESCE(v_pol.politician_skill, 0),
        'charisma',          COALESCE(v_pol.politician_capital, 0),
        'reputation',        COALESCE(v_pol.politician_reputation, 0),
        'politician_influence', COALESCE(v_pol.politician_influence, 0),
        'party_id',          v_party.id,
        'party_name',        v_party.faction_name,
        'party_funds',       COALESCE(v_party.party_funds, 0),
        'current_tick',      v_tick
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public._mp_action_check(uuid) FROM PUBLIC;

-- ── 2. committee_propose_law (20270892) ──────────────────────────
CREATE OR REPLACE FUNCTION public.committee_propose_law(
    p_category           text,
    p_section            text,
    p_articles           jsonb,
    p_faction_id         uuid,
    p_support_archetypes jsonb DEFAULT NULL,
    p_oppose_archetypes  jsonb DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_pol        factions%ROWTYPE;
    v_tick       int;
    v_section    text;
    v_category   text;
    v_articles   jsonb;
    v_total_len  int := 0;
    v_n_articles int;
    v_art        jsonb;
    v_text       text;
    v_id         uuid;
    v_full_name  text;
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
    IF NOT _is_mp_office(v_pol.politician_office) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    -- 20270753: MP per-tick lock. Statute drafting is one of the
    -- "pick one each tick" tiles.
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_mp_action_tick IS NOT NULL
       AND v_pol.next_mp_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_mp_action_tick, 'current_tick', v_tick);
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

    IF NOT _validate_archetype_pair(p_support_archetypes, p_oppose_archetypes) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_archetype_positions');
    END IF;

    INSERT INTO committee_proposals (
        nation_id, author_faction_id,
        category, section, articles,
        status, proposed_at_tick,
        support_archetypes, oppose_archetypes
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        v_category, v_section, v_articles,
        'on_floor', v_tick,
        p_support_archetypes, p_oppose_archetypes
    )
    RETURNING id INTO v_id;

    PERFORM _committee_resolve_floor(v_id, v_tick);

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' || COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick, 'proposed_law', v_section,
        jsonb_build_object('category', v_category, 'proposal_id', v_id)
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
            || '. It is before the assembly now.',
        'politician',
        'politician_proposed_law',
        v_tick
    );

    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'proposal_id',      v_id,
        'proposed_at_tick', v_tick,
        'resolve_at_tick',  v_tick + 3,
        'next_action_tick', v_tick + 1
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.committee_propose_law(text, text, jsonb, uuid, jsonb, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_propose_law(text, text, jsonb, uuid, jsonb, jsonb) TO authenticated;

-- ── 3. committee_propose_amendment (20270892) ────────────────────
CREATE OR REPLACE FUNCTION public.committee_propose_amendment(
    p_amends_proposal_id uuid,
    p_amendment_text     text,
    p_faction_id         uuid,
    p_support_archetypes jsonb DEFAULT NULL,
    p_oppose_archetypes  jsonb DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_parent    committee_proposals%ROWTYPE;
    v_tick      int;
    v_text      text;
    v_articles  jsonb;
    v_section   text;
    v_id        uuid;
    v_full_name text;
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
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF NOT _is_mp_office(v_pol.politician_office) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;

    IF p_amends_proposal_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_target');
    END IF;
    SELECT * INTO v_parent FROM committee_proposals WHERE id = p_amends_proposal_id;
    IF v_parent.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'target_not_found');
    END IF;
    IF v_parent.status <> 'enacted' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'target_not_enacted');
    END IF;
    IF v_pol.nation_id IS NULL OR v_parent.nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_nation');
    END IF;

    v_text := btrim(COALESCE(p_amendment_text, ''));
    IF length(v_text) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'empty_amendment');
    END IF;
    IF length(v_text) > 600 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'amendment_too_long',
            'have', length(v_text), 'cap', 600);
    END IF;

    IF NOT _validate_archetype_pair(p_support_archetypes, p_oppose_archetypes) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_archetype_positions');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_articles := jsonb_build_array(
        jsonb_build_object('ordinal', 1, 'tag', 'operative', 'text', v_text)
    );
    v_section := 'Amendment: ' || v_parent.section;

    INSERT INTO committee_proposals (
        nation_id, author_faction_id,
        category, section, articles,
        status, proposed_at_tick,
        proposal_type, amends_proposal_id,
        support_archetypes, oppose_archetypes
    ) VALUES (
        v_parent.nation_id, v_pol.id,
        v_parent.category, v_section, v_articles,
        'on_floor', v_tick,
        'amendment', v_parent.id,
        p_support_archetypes, p_oppose_archetypes
    )
    RETURNING id INTO v_id;

    PERFORM _committee_resolve_floor(v_id, v_tick);

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' || COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick, 'proposed_amendment', v_section,
        jsonb_build_object(
            'category',           v_parent.category,
            'proposal_id',        v_id,
            'amends_proposal_id', v_parent.id,
            'amends_section',     v_parent.section
        )
    );

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        'Amendment Proposed',
        v_full_name
            || ' has submitted an amendment to: ' || v_parent.section
            || '. It is before the assembly now.',
        'politician',
        'politician_proposed_amendment',
        v_tick
    );

    RETURN jsonb_build_object(
        'success',            true,
        'proposal_id',        v_id,
        'amends_proposal_id', v_parent.id,
        'proposed_at_tick',   v_tick,
        'resolve_at_tick',    v_tick + 3
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.committee_propose_amendment(uuid, text, uuid, jsonb, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_propose_amendment(uuid, text, uuid, jsonb, jsonb) TO authenticated;

-- ── 4. committee_propose_policy_change (20270892) ────────────────
CREATE OR REPLACE FUNCTION public.committee_propose_policy_change(
    p_policy_id          uuid,
    p_proposed_option_id uuid,
    p_faction_id         uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_tick            int;
    v_proposed_policy uuid;
    v_current_opt     uuid;
    v_id              uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_policy_id IS NULL OR p_proposed_option_id IS NULL THEN
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
    IF NOT _is_mp_office(v_pol.politician_office) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    SELECT policy_id INTO v_proposed_policy
      FROM policy_options WHERE id = p_proposed_option_id;
    IF v_proposed_policy IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'option_not_found');
    END IF;
    IF v_proposed_policy IS DISTINCT FROM p_policy_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'option_policy_mismatch');
    END IF;

    SELECT selected_option_id INTO v_current_opt
      FROM active_laws
     WHERE nation_id = v_pol.nation_id
       AND policy_id = p_policy_id
       AND is_reversal = false
     LIMIT 1;

    IF v_current_opt IS NOT NULL AND v_current_opt = p_proposed_option_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_change_proposed');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO committee_policy_proposals (
        nation_id, author_faction_id,
        policy_id, current_option_id, proposed_option_id,
        status, proposed_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        p_policy_id, v_current_opt, p_proposed_option_id,
        'on_floor', v_tick
    )
    RETURNING id INTO v_id;

    PERFORM _open_policy_floor_vote(v_id, v_tick);

    RETURN jsonb_build_object(
        'success',         true,
        'proposal_id',     v_id,
        'tick',            v_tick,
        'resolve_at_tick', v_tick + 3
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.committee_propose_policy_change(uuid, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_propose_policy_change(uuid, uuid, uuid) TO authenticated;

-- ── 5. propose_tax_holiday (20270892; grants preserved) ──────────
CREATE OR REPLACE FUNCTION public.propose_tax_holiday(
    p_faction_id uuid,
    p_years      int,
    p_sectors    text[],
    p_pct        int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_tick    int;
    v_year    int;
    v_sectors text[];
    v_support jsonb;
    v_oppose  jsonb;
    v_title   text;
    v_desc    text;
    v_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL
       OR p_years IS NULL OR p_years < 1 OR p_years > 3
       OR p_pct IS NULL OR p_pct NOT IN (25, 50, 75, 100) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    -- Sectors: NULL/empty = all industries; else live corp industries.
    IF p_sectors IS NOT NULL AND cardinality(p_sectors) > 0 THEN
        v_sectors := ARRAY(SELECT DISTINCT s FROM unnest(p_sectors) s);
        IF NOT (v_sectors <@ ARRAY['construction', 'automotive']) THEN
            RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
        END IF;
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
    IF NOT _is_mp_office(v_pol.politician_office) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_mp_action_tick IS NOT NULL
       AND v_pol.next_mp_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_mp_action_tick);
    END IF;
    v_year := 2000 + v_tick / 12;

    -- One active holiday per nation (design ruling).
    IF EXISTS (SELECT 1 FROM corporate_tax_holidays
                WHERE nation_id = v_pol.nation_id
                  AND v_year < start_year + years) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'holiday_active');
    END IF;
    -- One in-flight holiday proposal per nation.
    IF EXISTS (SELECT 1 FROM committee_proposals
                WHERE nation_id = v_pol.nation_id
                  AND holiday_params IS NOT NULL
                  AND status NOT IN ('enacted', 'failed')) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_pending');
    END IF;
    -- 3 ticks of quiet after the chamber kills one (design ruling).
    IF EXISTS (SELECT 1 FROM committee_proposals
                WHERE nation_id = v_pol.nation_id
                  AND holiday_params IS NOT NULL
                  AND status = 'failed'
                  AND COALESCE(floor_resolved_at_tick, 0) > v_tick - 3) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'chamber_cooldown');
    END IF;

    -- The stances (design ruling). Nationalist backs TARGETED relief.
    v_support := '["Libertarian", "Traditional Conservative", "Liberal"]'::jsonb;
    IF v_sectors IS NOT NULL THEN
        v_support := v_support || '"Nationalist"'::jsonb;
    END IF;
    v_oppose := '["Communist / Leftist", "Social Democratic", "Green"]'::jsonb;

    v_title := format('Tax Holiday Act of %s', v_year);
    v_desc  := format('A one-time corporate tax holiday: %s%% off corporate tax filings for %s, for %s filing year%s beginning on enactment. The treasury forgoes the revenue.',
        p_pct,
        CASE WHEN v_sectors IS NULL THEN 'all industries'
             ELSE array_to_string(v_sectors, ' and ') || ' corporations' END,
        p_years, CASE WHEN p_years = 1 THEN '' ELSE 's' END);

    INSERT INTO committee_proposals (
        nation_id, author_faction_id,
        category, section, articles,
        status, proposed_at_tick,
        support_archetypes, oppose_archetypes, holiday_params
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        'commercial', v_title,
        jsonb_build_array(jsonb_build_object('ordinal', 1, 'tag', 'operative', 'text', v_desc)),
        'on_floor', v_tick,
        v_support, v_oppose,
        jsonb_build_object('pct', p_pct, 'years', p_years, 'sectors', to_jsonb(v_sectors),
                           'proposer_party_id', v_pol.politician_party_id)
    ) RETURNING id INTO v_id;

    PERFORM _committee_resolve_floor(v_id, v_tick);

    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol.id;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (v_pol.id, v_tick, 'proposed_law', v_title,
            jsonb_build_object('proposal_id', v_id));

    RETURN jsonb_build_object('success', true, 'proposal_id', v_id, 'title', v_title);
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
