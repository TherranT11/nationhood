-- ════════════════════════════════════════════════════════════════════
-- 20270684 — Author-specified stakeholders on committee proposals
--
-- Lets the proposer list up to 5 stakeholder roles when filing a
-- committee proposal. Those roles get materialised as personas at
-- hearing-open time, alongside the existing 8-from-category-template
-- auto-seed from _seed_hearing_personas (20270499). Total per
-- hearing stays at 8: the author's 5 (or fewer) come first, the
-- remainder fill from the category templates as before.
--
-- Schema:
--   committee_proposals.persona_roles jsonb — NULL or array of
--     0-5 unique, non-empty, ≤40-char strings. Author-supplied at
--     propose / amend time. NULL = legacy proposal or author opted
--     not to specify; hearing falls back to all-category-template
--     behavior.
--
-- Helper:
--   _validate_persona_roles(jsonb) — true iff the input is NULL or
--     a jsonb array of 0-5 unique (case-insensitive) trimmed
--     strings, each 1-40 chars.
--
-- RPC signature changes (both DROP + CREATE):
--   committee_propose_law — adds p_persona_roles jsonb at the end
--   committee_propose_amendment — adds p_persona_roles jsonb at end
--
-- _seed_hearing_personas (20270499) is updated to:
--   1. Look up the proposal's persona_roles via the hearing's
--      proposal_id.
--   2. INSERT one persona per author-role, generating a name from
--      the nation's name pools (same approach as the existing
--      category-template loop). Slug = 'author_<n>' so it can't
--      collide with category-template slugs; title = the author's
--      verbatim role text; affiliation = 'Independent'.
--   3. Fill remaining slots (8 - N) from the category templates as
--      before. Existing call sites (committee_hold_hearing,
--      process_committee_npc_chair_agenda) don't need to change —
--      the function signature is unchanged.
--
-- Account-level cap on testimony submission (the "one persona per
-- ACCOUNT" rule) is a separate concern from this commit — that's
-- a constraint change on committee_hearing_testimonies + an RPC
-- update, landing in 20270685.
--
-- Apply after 20270683.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: new column ────────────────────────────────────────
ALTER TABLE public.committee_proposals
    ADD COLUMN IF NOT EXISTS persona_roles jsonb;

COMMENT ON COLUMN public.committee_proposals.persona_roles IS
    'Author-specified stakeholder roles for the hearing. NULL or jsonb array of 0-5 unique trimmed strings (case-insensitive), each 1-40 chars. Materialised as personas alongside the existing 8-per-hearing category templates by _seed_hearing_personas. 20270684.';

-- ── 2. Helper: validate the persona_roles payload ────────────────
CREATE OR REPLACE FUNCTION public._validate_persona_roles(p_roles jsonb)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    v_role  text;
    v_count int := 0;
    v_seen  text[] := ARRAY[]::text[];
BEGIN
    IF p_roles IS NULL THEN
        RETURN true;
    END IF;
    IF jsonb_typeof(p_roles) <> 'array' THEN
        RETURN false;
    END IF;
    IF jsonb_array_length(p_roles) > 5 THEN
        RETURN false;
    END IF;
    FOR v_role IN SELECT jsonb_array_elements_text(p_roles) LOOP
        v_role := btrim(v_role);
        IF length(v_role) < 1 OR length(v_role) > 40 THEN
            RETURN false;
        END IF;
        IF lower(v_role) = ANY(v_seen) THEN
            RETURN false;  -- duplicate role (case-insensitive)
        END IF;
        v_seen := v_seen || lower(v_role);
        v_count := v_count + 1;
    END LOOP;
    RETURN true;
END;
$$;

COMMENT ON FUNCTION public._validate_persona_roles(jsonb) IS
    'True iff the input is NULL or a jsonb array of 0-5 unique (case-insensitive) trimmed strings, each 1-40 chars. Author-facing RPCs (committee_propose_law / committee_propose_amendment) call this before INSERTing into committee_proposals.persona_roles.';

-- ── 3. committee_propose_law — adds p_persona_roles ──────────────
DROP FUNCTION IF EXISTS public.committee_propose_law(uuid, text, text, jsonb, uuid);

CREATE OR REPLACE FUNCTION public.committee_propose_law(
    p_committee_id uuid,
    p_category     text,
    p_section      text,
    p_articles     jsonb,
    p_faction_id   uuid,
    p_persona_roles jsonb DEFAULT NULL
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
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
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

    SELECT jsonb_agg(
            jsonb_build_object(
                'ordinal', ord,
                'tag',     CASE
                              WHEN lower(COALESCE(elem->>'tag','')) IN
                                   ('operative','remedy','administration','definition','exception')
                              THEN lower(elem->>'tag')
                              ELSE 'operative'
                           END,
                'text',    btrim(elem->>'text')
            )
            ORDER BY ord
           )
      INTO v_articles
      FROM jsonb_array_elements(p_articles) WITH ORDINALITY AS t(elem, ord);

    -- ── Stakeholders validation (new in 20270684) ────────────────
    IF NOT _validate_persona_roles(p_persona_roles) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_persona_roles');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO committee_proposals (
        committee_id, nation_id, author_faction_id,
        category, section, articles,
        status, proposed_at_tick, persona_roles
    ) VALUES (
        v_comm.id, v_comm.nation_id, v_pol.id,
        v_category, v_section, v_articles,
        'queued', v_tick, p_persona_roles
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

    RETURN jsonb_build_object(
        'success',           true,
        'proposal_id',       v_id,
        'committee_id',      v_comm.id,
        'committee_key',     v_comm.committee_key,
        'proposed_at_tick',  v_tick
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.committee_propose_law(uuid, text, text, jsonb, uuid, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_propose_law(uuid, text, text, jsonb, uuid, jsonb) TO authenticated;

-- ── 4. committee_propose_amendment — adds p_persona_roles ────────
DROP FUNCTION IF EXISTS public.committee_propose_amendment(uuid, text, uuid);

CREATE OR REPLACE FUNCTION public.committee_propose_amendment(
    p_amends_proposal_id uuid,
    p_amendment_text     text,
    p_faction_id         uuid,
    p_persona_roles      jsonb DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_parent          committee_proposals%ROWTYPE;
    v_comm            committees%ROWTYPE;
    v_tick            int;
    v_text            text;
    v_articles        jsonb;
    v_section         text;
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
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
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
            'total', length(v_text), 'cap', 600);
    END IF;

    -- ── Stakeholders validation (new in 20270684) ────────────────
    IF NOT _validate_persona_roles(p_persona_roles) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_persona_roles');
    END IF;

    SELECT * INTO v_comm FROM committees WHERE id = v_parent.committee_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_section := v_parent.section;
    v_articles := jsonb_build_array(
        jsonb_build_object(
            'ordinal', 1,
            'tag',     'operative',
            'text',    v_text
        )
    );

    INSERT INTO committee_proposals (
        committee_id, nation_id, author_faction_id,
        category, section, articles,
        status, proposed_at_tick,
        amends_proposal_id, persona_roles
    ) VALUES (
        v_parent.committee_id, v_parent.nation_id, v_pol.id,
        v_parent.category, v_section, v_articles,
        'queued', v_tick,
        v_parent.id, p_persona_roles
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
        v_pol.id, v_tick, 'proposed_amendment', v_section,
        jsonb_build_object(
            'committee_key',  v_comm.committee_key,
            'committee_name', v_committee_name,
            'category',       v_parent.category,
            'proposal_id',    v_id,
            'amends_proposal_id', v_parent.id
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
            || ' has submitted an amendment to: ' || v_section
            || ', referred to the ' || v_committee_name || '.',
        'politician',
        'politician_proposed_amendment',
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'proposal_id',       v_id,
        'committee_id',      v_parent.committee_id,
        'committee_key',     v_comm.committee_key,
        'proposed_at_tick',  v_tick,
        'amends_proposal_id', v_parent.id
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.committee_propose_amendment(uuid, text, uuid, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_propose_amendment(uuid, text, uuid, jsonb) TO authenticated;

-- ── 5. _seed_hearing_personas — use proposal.persona_roles ───────
-- Looks up the proposal's persona_roles via the hearing's proposal_
-- id. For each author-specified role, INSERT a persona row with
-- slug='author_<n>' (so it can't collide with category-template
-- slugs), title=the verbatim role text, affiliation='Independent'.
-- Then fill remaining slots (8 - N) from the category templates as
-- before. Signature unchanged so committee_hold_hearing and
-- process_committee_npc_chair_agenda don't need to be touched.
CREATE OR REPLACE FUNCTION public._seed_hearing_personas(
    p_hearing_id uuid, p_category text, p_nation_id uuid
)
RETURNS int
LANGUAGE plpgsql AS $$
DECLARE
    v_nation       nations%ROWTYPE;
    v_city         text;
    v_npool_len    int;
    v_lpool_len    int;
    rec            RECORD;
    v_count        int := 0;
    v_first        text;
    v_last         text;
    v_aff          text;
    v_proposal     uuid;
    v_roles        jsonb;
    v_n_author     int := 0;
    v_remaining    int;
    v_role         text;
    v_idx          int := 0;
BEGIN
    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    v_city      := COALESCE(NULLIF(btrim(v_nation.capital), ''), v_nation.name, 'the Capital');
    v_npool_len := COALESCE(array_length(v_nation.first_name_pool, 1), 0);
    v_lpool_len := COALESCE(array_length(v_nation.last_name_pool, 1), 0);

    -- ── Phase 1: author-specified roles from persona_roles ───────
    SELECT cp.id, cp.persona_roles
      INTO v_proposal, v_roles
      FROM committee_proposals cp
      JOIN committee_hearings ch ON ch.proposal_id = cp.id
     WHERE ch.id = p_hearing_id;

    IF v_roles IS NOT NULL AND jsonb_typeof(v_roles) = 'array' THEN
        FOR v_role IN SELECT jsonb_array_elements_text(v_roles) LOOP
            v_idx := v_idx + 1;
            IF v_npool_len > 0 THEN
                v_first := v_nation.first_name_pool[1 + floor(random() * v_npool_len)::int];
            ELSE
                v_first := 'Witness';
            END IF;
            IF v_lpool_len > 0 THEN
                v_last := v_nation.last_name_pool[1 + floor(random() * v_lpool_len)::int];
            ELSE
                v_last := 'Smith';
            END IF;
            INSERT INTO committee_hearing_personas (hearing_id, slug, name, title, affiliation)
            VALUES (
                p_hearing_id,
                'author_' || v_idx,
                v_first || ' ' || v_last,
                btrim(v_role),
                'Independent'
            );
            v_count := v_count + 1;
        END LOOP;
        v_n_author := v_count;
    END IF;

    -- ── Phase 2: fill remaining slots from category templates ────
    v_remaining := 8 - v_n_author;

    IF v_remaining > 0 THEN
        FOR rec IN
            SELECT slug, title, affiliation_template FROM (VALUES
                -- CIVIL
                ('civil',      'tenants_union',         'Tenants'' Union Representative',           '%s Renters'' Coalition'),
                ('civil',      'landlords_assoc',       'Landlords'' Association Spokesperson',     'Property Owners of %s'),
                ('civil',      'housing_researcher',    'Housing Researcher',                       'Universidad de %s'),
                ('civil',      'family_lawyer',         'Family Law Attorney',                      'Independent'),
                ('civil',      'consumer_advocate',     'Consumer Protection Advocate',             '%s Consumers'' League'),
                ('civil',      'real_estate_dev',       'Real Estate Developer',                    'Independent'),
                ('civil',      'building_inspector',    'Senior Building Inspector',                'Ministry of Interior'),
                ('civil',      'civil_rights_lawyer',   'Civil Rights Attorney',                    'Independent'),
                ('civil',      'religious_leader',      'Religious Community Leader',               '%s Interfaith Council'),
                -- CRIMINAL
                ('criminal',   'prosecutor',            'Senior Public Prosecutor',                 'Office of the Attorney General'),
                ('criminal',   'defense_lawyer',        'Criminal Defense Attorney',                'Independent'),
                ('criminal',   'police_commissioner',   'Police Commissioner',                      'National Police'),
                ('criminal',   'criminologist',         'Criminologist',                            'Universidad de %s'),
                ('criminal',   'victims_advocate',      'Victims'' Rights Advocate',                '%s Victims'' Network'),
                ('criminal',   'prison_warden',         'Prison Warden',                            'Ministry of Justice'),
                ('criminal',   'forensics_expert',      'Forensics Expert',                         'National Forensics Lab'),
                ('criminal',   'reform_activist',       'Criminal Justice Reform Activist',         '%s Justice Coalition'),
                -- COMMERCIAL
                ('commercial', 'chamber_commerce',      'Chamber of Commerce President',            'National Chamber of Commerce'),
                ('commercial', 'small_business',        'Small Business Owner',                     'Independent'),
                ('commercial', 'union_rep',             'Labor Union Representative',               '%s Workers'' Federation'),
                ('commercial', 'economist',             'Economist',                                'Independent'),
                ('commercial', 'banking_rep',           'Banking Industry Representative',          'Banking Association of %s'),
                ('commercial', 'trade_attorney',        'Trade Law Attorney',                       'Independent'),
                ('commercial', 'consumer_rep',          'Consumer Affairs Representative',          'Independent'),
                ('commercial', 'foreign_investor',      'Foreign Investor Representative',          'Independent'),
                -- ELECTORAL
                ('electoral',  'election_official',     'Chief Election Commissioner',              'National Electoral Commission'),
                ('electoral',  'political_scientist',   'Political Scientist',                      'Universidad de %s'),
                ('electoral',  'civic_advocate',        'Civic Engagement Advocate',                '%s Civic Foundation'),
                ('electoral',  'party_chair',           'Political Party Chair',                    'Independent'),
                ('electoral',  'media_executive',       'Media Executive',                          '%s Broadcasting Corp'),
                ('electoral',  'party_treasurer',       'Party Treasurer',                          'Independent'),
                ('electoral',  'redistricting_expert',  'Redistricting Expert',                     'Independent'),
                ('electoral',  'civil_society',         'Civil Society Director',                   '%s Civic Foundation')
            ) AS t(cat, slug, title, affiliation_template)
            WHERE cat = p_category
            ORDER BY random()
            LIMIT v_remaining
        LOOP
            IF v_npool_len > 0 THEN
                v_first := v_nation.first_name_pool[1 + floor(random() * v_npool_len)::int];
            ELSE
                v_first := 'Witness';
            END IF;
            IF v_lpool_len > 0 THEN
                v_last := v_nation.last_name_pool[1 + floor(random() * v_lpool_len)::int];
            ELSE
                v_last := rec.slug;
            END IF;
            v_aff := replace(rec.affiliation_template, '%s', v_city);

            INSERT INTO committee_hearing_personas (hearing_id, slug, name, title, affiliation)
            VALUES (p_hearing_id, rec.slug, v_first || ' ' || v_last, rec.title, v_aff);
            v_count := v_count + 1;
        END LOOP;
    END IF;

    RETURN v_count;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
