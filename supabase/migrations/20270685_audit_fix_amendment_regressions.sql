-- ════════════════════════════════════════════════════════════════════
-- 20270685 — Audit fix: restore committee_propose_amendment guards +
--            tidy _seed_hearing_personas dead state
--
-- Pre-commit audit on 20270684 caught silent regressions in my
-- rewrite of committee_propose_amendment. I dropped the function and
-- recreated it to add p_persona_roles, but several pre-existing
-- behaviors went with the drop because I didn't read 20270668's body
-- carefully enough before re-emitting:
--
--   1. parent_committee_missing guard — if v_parent.committee_id no
--      longer resolves to a row in committees, the original bailed
--      with a friendly reason; my rewrite proceeded with v_comm full
--      of NULLs and wrote an orphan amendment row. AMEND_REASON_HUMAN
--      on the client still maps this reason, so the silent omission
--      would have shown 'Could not submit (unknown).' instead.
--   2. v_section := 'Amendment: ' || v_parent.section — without the
--      prefix, amendments collide visually with the parent statute in
--      any list keyed on section.
--   3. proposal_type = 'amendment' in the INSERT — downstream
--      consumers (and the eventual single-URL bill page) discriminate
--      amendments from fresh laws via this column.
--   4. metadata.amends_section in politician_career_events — career
--      timeline render needs the parent name; without it the
--      'proposed_amendment' event row can't say what was amended.
--   5. Cosmetic regressions in error jsonb keys ('have'→'total') and
--      event_log copy ('that has been sent to the '→'referred to').
--
-- Also in this migration: cleanup pass on _seed_hearing_personas from
-- 20270684. The function had three counters tracking the same value
-- in Phase 1 (v_count, v_idx, v_n_author) plus a stale v_proposal
-- DECLARE that was INTO'd but never read. Consolidate to one counter
-- (v_count), drop v_proposal, drop v_n_author, drop v_idx.
--
-- committee_propose_law from 20270684 is unchanged here — its rewrite
-- preserved all original behaviors. Only the amendment path needs
-- fixing.
--
-- Apply after 20270684.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. committee_propose_amendment — restore regressions ─────────
-- Same signature as 20270684. Body re-aligned with 20270668's
-- behavior, with p_persona_roles validation and the persona_roles
-- INSERT preserved.
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
            'have', length(v_text), 'cap', 600);
    END IF;

    -- Committee inherited from the parent. If the parent's committee
    -- row was deleted (shouldn't happen — committees aren't deleted
    -- in the current model — but defend against it) bail rather than
    -- write an orphan amendment. AMEND_REASON_HUMAN on the client
    -- has a mapping for this reason.
    SELECT * INTO v_comm FROM committees WHERE id = v_parent.committee_id;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'parent_committee_missing');
    END IF;

    IF NOT _validate_persona_roles(p_persona_roles) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_persona_roles');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Single-article wrap matching the propose_law shape so downstream
    -- readers (hearing UI, statute view) don't need a branch on
    -- proposal_type to render the body.
    v_articles := jsonb_build_array(
        jsonb_build_object('ordinal', 1, 'tag', 'operative', 'text', v_text)
    );
    v_section := 'Amendment: ' || v_parent.section;

    INSERT INTO committee_proposals (
        committee_id, nation_id, author_faction_id,
        category, section, articles,
        status, proposed_at_tick,
        proposal_type, amends_proposal_id,
        persona_roles
    ) VALUES (
        v_comm.id, v_parent.nation_id, v_pol.id,
        v_parent.category, v_section, v_articles,
        'queued', v_tick,
        'amendment', v_parent.id,
        p_persona_roles
    )
    RETURNING id INTO v_id;

    -- Committee display name — keep this CASE in sync with
    -- js/committees.js and committee_propose_law's matching block.
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
            'committee_key',     v_comm.committee_key,
            'committee_name',    v_committee_name,
            'category',          v_parent.category,
            'proposal_id',       v_id,
            'amends_proposal_id', v_parent.id,
            'amends_section',    v_parent.section
        )
    );

    -- ONE-SOURCE NOTE: this sentence mirrors committee_propose_law's
    -- event_log INSERT — keep the two in sync with the client-side
    -- CAREER_EVENT_TEMPLATES map.
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
            || ', that has been sent to the ' || v_committee_name || '.',
        'politician',
        'politician_proposed_amendment',
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'proposal_id',       v_id,
        'committee_id',      v_comm.id,
        'committee_key',     v_comm.committee_key,
        'amends_proposal_id', v_parent.id,
        'proposed_at_tick',  v_tick
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.committee_propose_amendment(uuid, text, uuid, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_propose_amendment(uuid, text, uuid, jsonb) TO authenticated;

-- ── 2. _seed_hearing_personas — drop dead state, one counter ─────
-- 20270684 declared v_proposal (SELECT INTO target, never read),
-- v_n_author (a mirror of v_count at end of Phase 1), and v_idx
-- (1-indexed slug counter that diverges from v_count by one). All
-- three collapse to v_count if we increment it BEFORE the insert so
-- the slug index is 1-based.
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
    v_roles        jsonb;
    v_remaining    int;
    v_role         text;
BEGIN
    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    v_city      := COALESCE(NULLIF(btrim(v_nation.capital), ''), v_nation.name, 'the Capital');
    v_npool_len := COALESCE(array_length(v_nation.first_name_pool, 1), 0);
    v_lpool_len := COALESCE(array_length(v_nation.last_name_pool, 1), 0);

    -- ── Phase 1: author-specified roles from persona_roles ───────
    SELECT cp.persona_roles INTO v_roles
      FROM committee_proposals cp
      JOIN committee_hearings ch ON ch.proposal_id = cp.id
     WHERE ch.id = p_hearing_id;

    IF v_roles IS NOT NULL AND jsonb_typeof(v_roles) = 'array' THEN
        FOR v_role IN SELECT jsonb_array_elements_text(v_roles) LOOP
            v_count := v_count + 1;
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
                'author_' || v_count,
                v_first || ' ' || v_last,
                btrim(v_role),
                'Independent'
            );
        END LOOP;
    END IF;

    -- ── Phase 2: fill remaining slots from category templates ────
    v_remaining := 8 - v_count;

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
