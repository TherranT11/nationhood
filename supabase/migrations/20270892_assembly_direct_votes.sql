-- ════════════════════════════════════════════════════════════════════
-- 20270892 — The committee stage is abolished; proposals go straight
--            to the assembly floor
--
-- User spec: statutes, amendments, and policy-change proposals no
-- longer route through committees. Proposing one opens the public
-- 3-tick chamber vote (the 20270883 machinery) immediately — it
-- shows in the nation's Voting section, the parties divide, and it
-- resolves after 3 ticks. Passed statutes/amendments land on the
-- Statutes page as before; passed policy changes flip the nation's
-- active law (the tick processor's processTargetBasedPolicies then
-- applies the stat effects — no new applier).
--
-- What goes (user-confirmed: drop it all, history included):
--   • Tables: committees, committee_members, committee_admission_
--     votes, committee_motions, committee_motion_votes, committee_
--     agenda_votes, committee_hearings, committee_hearing_personas,
--     committee_hearing_testimonies, committee_hearing_chat_messages.
--   • Every committee-stage function (admission, agenda, motions,
--     hearings, NPC chair agenda, the motion sweep). politician_
--     resign_chair survives — that's the Speaker machinery, not a
--     committee chair. ccp_city_hearing survives — a CCP city action.
--
-- What stays (legacy committee_* names kept deliberately — renaming
-- the tables would churn every reader for zero behavior):
--   • committee_proposals      — the statute/amendment record.
--   • committee_policy_proposals — the policy-change record.
--   • committee_floor_votes    — the chamber vote, generalized to
--     also carry policy votes (exactly one subject per row).
--   • _committee_resolve_floor — unchanged; now fired at propose
--     time instead of by the dropped committee_move_to_floor.
--   • resolve_due_committee_floor_votes — re-emitted with the
--     policy branch (enact = active_laws upsert, the same shape
--     resolve_due_bills uses).
--
-- In-flight proposals (user-confirmed): everything sitting in a
-- committee queue is sent to the floor under the new rules — the
-- DO block at the end opens their votes at the current tick.
--
-- Policy vote division: the sponsor's party banks YES; other seated
-- parties consult derive_bill_stance(option) — the bills system's
-- one source for option→archetype stance (+1 YES / -1 NO); everyone
-- unmapped rolls 1D2, the same neutral rule statute votes use.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. committee_floor_votes carries policy votes too ─────────────
ALTER TABLE public.committee_floor_votes
    ALTER COLUMN proposal_id DROP NOT NULL;
ALTER TABLE public.committee_floor_votes
    ADD COLUMN IF NOT EXISTS policy_proposal_id uuid
        REFERENCES public.committee_policy_proposals(id) ON DELETE CASCADE;
ALTER TABLE public.committee_floor_votes
    DROP CONSTRAINT IF EXISTS committee_floor_votes_one_subject;
ALTER TABLE public.committee_floor_votes
    ADD CONSTRAINT committee_floor_votes_one_subject
    CHECK ((proposal_id IS NULL) <> (policy_proposal_id IS NULL));
CREATE UNIQUE INDEX IF NOT EXISTS committee_floor_votes_one_active_per_policy
    ON public.committee_floor_votes (policy_proposal_id)
    WHERE status = 'active' AND policy_proposal_id IS NOT NULL;

-- ── 2. The two kept proposal tables shed their committee linkage ──
ALTER TABLE public.committee_policy_proposals
    DROP CONSTRAINT IF EXISTS committee_policy_proposals_status_check;
ALTER TABLE public.committee_policy_proposals
    ADD CONSTRAINT committee_policy_proposals_status_check
    CHECK (status IN ('queued','tabled','reported_out','withdrawn',
                      'on_floor','enacted','failed'));
ALTER TABLE public.committee_policy_proposals
    DROP COLUMN IF EXISTS committee_id;
ALTER TABLE public.committee_proposals
    DROP COLUMN IF EXISTS committee_id;
-- Chair bids are gone with the committees — the per-faction bid
-- cooldown column has no writer or reader left.
ALTER TABLE public.factions
    DROP COLUMN IF EXISTS next_chair_bid_tick;

COMMENT ON TABLE public.committee_proposals IS
    'Statute and amendment proposals (legacy name). Since 20270892 a proposal opens its 3-tick assembly floor vote at submit time; status=enacted rows are the Statutes page. persona_roles is a dead column from the hearings era.';
COMMENT ON TABLE public.committee_policy_proposals IS
    'Policy-switch proposals (legacy name). Since 20270892 a proposal opens its 3-tick assembly floor vote at submit time; on pass the resolver flips active_laws and the tick processor applies the effects.';

-- ── 3. Drop every committee-stage function (all overloads) ────────
DO $$
DECLARE r record;
BEGIN
    FOR r IN
        SELECT p.oid::regprocedure AS sig
          FROM pg_proc p
         WHERE p.pronamespace = 'public'::regnamespace
           AND p.proname IN (
               '_committee_carry_out_agenda', '_committee_carry_out_motion',
               '_committee_tally_and_carry', '_seed_hearing_personas',
               '_validate_persona_roles',
               'accept_hearing_testimony', 'apply_for_committee',
               'close_committee_hearing', 'committee_cast_agenda_vote',
               'committee_cast_motion_vote', 'committee_hearing_chat_post',
               'committee_hold_hearing', 'committee_move_to_floor',
               'committee_open_motion', 'committee_set_agenda',
               'ensure_committee', 'list_committees_for_member',
               'list_open_hearings_for_witness', 'politician_bid_for_chair',
               'process_committee_npc_chair_agenda',
               'resolve_due_committee_motions', 'resolve_due_admission_votes',
               'submit_hearing_testimony',
               -- re-created below with committee-free signatures
               'committee_propose_law', 'committee_propose_amendment',
               'committee_propose_policy_change'
           )
    LOOP
        EXECUTE format('DROP FUNCTION %s', r.sig);
    END LOOP;
END $$;

-- ── 4. Propose a statute → straight to the floor ──────────────────
-- 20270756 body minus the committee routing and the hearings-era
-- stakeholder personas. The insert lands at on_floor and the chamber
-- vote opens in the same transaction.
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
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
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

-- ── 5. Propose an amendment → straight to the floor ───────────────
-- 20270757 body minus the committee picker and personas.
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

-- ── 6. The policy floor vote opener ───────────────────────────────
-- Division: sponsor's party banks YES; other seated parties consult
-- derive_bill_stance(proposed option) — +1 YES, -1 NO; unmapped
-- archetypes roll 1D2. Same shape as the statute division.
CREATE OR REPLACE FUNCTION public._open_policy_floor_vote(
    p_policy_proposal_id uuid,
    p_tick               int
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_prop          committee_policy_proposals%ROWTYPE;
    v_party         RECORD;
    v_sponsor_party uuid;
    v_sponsor_name  text;
    v_policy_name   text;
    v_option_name   text;
    v_stances       jsonb;
    v_stance        text;
    v_lean          int;
    v_votes         jsonb := '[]'::jsonb;
    v_yes           int := 0;
    v_no            int := 0;
    v_chamber       int := 0;
BEGIN
    SELECT * INTO v_prop FROM committee_policy_proposals WHERE id = p_policy_proposal_id;
    IF v_prop.id IS NULL THEN
        RETURN NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM committee_floor_votes
                WHERE policy_proposal_id = p_policy_proposal_id AND status = 'active') THEN
        RETURN 'on_floor';
    END IF;

    SELECT policy_name INTO v_policy_name FROM policies WHERE id = v_prop.policy_id;
    SELECT option_name INTO v_option_name FROM policy_options WHERE id = v_prop.proposed_option_id;
    v_stances := COALESCE(derive_bill_stance(v_prop.proposed_option_id), '{}'::jsonb);

    SELECT NULLIF(btrim(COALESCE(f.leader_first_name, '') || ' ' ||
                        COALESCE(f.leader_last_name, '')), ''),
           f.politician_party_id
      INTO v_sponsor_name, v_sponsor_party
      FROM factions f WHERE f.id = v_prop.author_faction_id;

    FOR v_party IN
        SELECT f.id, f.archetype, COALESCE(f.seats, 0) AS seats
          FROM factions f
         WHERE f.faction_type = 'movement_party'
           AND f.nation_id    = v_prop.nation_id
           AND f.abandoned_at IS NULL
           AND COALESCE(f.seats, 0) > 0
    LOOP
        v_lean := COALESCE((v_stances->>v_party.archetype)::int, 0);
        IF v_party.id = v_sponsor_party THEN
            v_stance := 'yes';
        ELSIF v_lean > 0 THEN
            v_stance := 'yes';
        ELSIF v_lean < 0 THEN
            v_stance := 'no';
        ELSE
            v_stance := CASE WHEN random() < 0.5 THEN 'yes' ELSE 'no' END;
        END IF;
        v_votes   := v_votes || jsonb_build_object(
            'party_id', v_party.id, 'stance', v_stance, 'seats', v_party.seats);
        v_chamber := v_chamber + v_party.seats;
        IF v_stance = 'yes' THEN
            v_yes := v_yes + v_party.seats;
        ELSE
            v_no := v_no + v_party.seats;
        END IF;
    END LOOP;

    INSERT INTO committee_floor_votes (
        nation_id, policy_proposal_id, bill_name, category, sponsor_name,
        party_votes, yes_seats, no_seats, chamber_size,
        started_at_tick, resolve_at_tick
    ) VALUES (
        v_prop.nation_id, v_prop.id,
        COALESCE(v_policy_name, 'Policy Change') || ' — ' || COALESCE(v_option_name, 'new direction'),
        'policy',
        COALESCE(v_sponsor_name, 'a member of the chamber'),
        v_votes, v_yes, v_no, v_chamber,
        p_tick, p_tick + 3
    );

    UPDATE committee_policy_proposals
       SET status = 'on_floor'
     WHERE id = p_policy_proposal_id;

    RETURN 'on_floor';
END $$;

REVOKE EXECUTE ON FUNCTION public._open_policy_floor_vote(uuid, int) FROM PUBLIC;

-- ── 7. Propose a policy change → straight to the floor ────────────
-- 20270728 body minus the committee routing.
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
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
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

-- ── 7b. The Tax Holiday Act files straight to the floor too ───────
-- 20270873 body minus the Finance committee routing; the archetype
-- stances and the one-per-nation gates are unchanged.
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
    IF v_pol.politician_office NOT IN ('member_of_parliament', 'senior_mp') THEN
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

-- (grants unchanged — CREATE OR REPLACE preserves 20270873's.)

-- ── 8. The sweep learns the policy branch ─────────────────────────
-- 20270883 body; the statute branch (including the Tax Holiday mint)
-- is unchanged. Policy votes flip active_laws on pass — the same
-- UPDATE-else-INSERT resolve_due_bills uses — and the tick
-- processor's processTargetBasedPolicies applies the stat effects.
CREATE OR REPLACE FUNCTION public.resolve_due_committee_floor_votes()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick     int;
    v_vote     committee_floor_votes%ROWTYPE;
    v_prop     committee_proposals%ROWTYPE;
    v_pprop    committee_policy_proposals%ROWTYPE;
    v_passed   boolean;
    v_resolved int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', 0, 'reason', 'no_shard');
    END IF;

    FOR v_vote IN
        SELECT * FROM committee_floor_votes
         WHERE status = 'active' AND resolve_at_tick <= v_tick
         ORDER BY resolve_at_tick ASC
         FOR UPDATE SKIP LOCKED
    LOOP
        v_passed := v_vote.yes_seats > v_vote.no_seats;

        UPDATE committee_floor_votes
           SET status        = CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
               resolved_tick = v_tick
         WHERE id = v_vote.id;

        IF v_vote.policy_proposal_id IS NOT NULL THEN
            -- ── Policy change ─────────────────────────────────────
            SELECT * INTO v_pprop FROM committee_policy_proposals
             WHERE id = v_vote.policy_proposal_id;
            UPDATE committee_policy_proposals
               SET status = CASE WHEN v_passed THEN 'enacted' ELSE 'failed' END
             WHERE id = v_vote.policy_proposal_id;

            IF v_passed AND v_pprop.id IS NOT NULL THEN
                IF EXISTS (
                    SELECT 1 FROM active_laws
                     WHERE nation_id = v_pprop.nation_id
                       AND policy_id = v_pprop.policy_id
                       AND COALESCE(is_reversal, false) = false
                ) THEN
                    UPDATE active_laws
                       SET selected_option_id = v_pprop.proposed_option_id,
                           passed_tick        = v_tick
                     WHERE nation_id = v_pprop.nation_id
                       AND policy_id = v_pprop.policy_id
                       AND COALESCE(is_reversal, false) = false;
                ELSE
                    INSERT INTO active_laws (nation_id, policy_id, selected_option_id, passed_tick, is_reversal)
                    VALUES (v_pprop.nation_id, v_pprop.policy_id, v_pprop.proposed_option_id, v_tick, false);
                END IF;
            END IF;

            INSERT INTO bills (nation_id, proposed_by, proposed_tick, bill_name, bill_type,
                               status, voting_ends_tick, passed_tick, votes_for, votes_against, preamble)
            VALUES (v_vote.nation_id, v_pprop.author_faction_id, v_vote.started_at_tick,
                    v_vote.bill_name, 'committee_floor',
                    CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
                    v_vote.resolve_at_tick, v_tick, v_vote.yes_seats, v_vote.no_seats,
                    CASE WHEN v_passed
                         THEN format('The chamber adopts %s, sponsored by %s, %s seats to %s. The law takes effect immediately.',
                                     v_vote.bill_name, v_vote.sponsor_name,
                                     v_vote.yes_seats, v_vote.no_seats)
                         ELSE format('The chamber rejects %s, sponsored by %s, %s seats to %s.',
                                     v_vote.bill_name, v_vote.sponsor_name,
                                     v_vote.no_seats, v_vote.yes_seats)
                    END);
        ELSE
            -- ── Statute / amendment (unchanged from 20270883) ─────
            SELECT * INTO v_prop FROM committee_proposals WHERE id = v_vote.proposal_id;
            UPDATE committee_proposals
               SET status                 = CASE WHEN v_passed THEN 'enacted' ELSE 'failed' END,
                   floor_yes_seats        = v_vote.yes_seats,
                   floor_no_seats         = v_vote.no_seats,
                   floor_resolved_at_tick = v_tick
             WHERE id = v_vote.proposal_id;

            -- Tax Holiday Act (20270873): an enacted holiday proposal
            -- mints the holiday, starting at the year of enactment. One
            -- active holiday per nation.
            IF v_passed AND v_prop.holiday_params IS NOT NULL THEN
                IF NOT EXISTS (
                    SELECT 1 FROM corporate_tax_holidays h
                     WHERE h.nation_id = v_prop.nation_id
                       AND (2000 + v_tick / 12) < h.start_year + h.years) THEN
                    INSERT INTO corporate_tax_holidays (
                        nation_id, source_proposal_id, pct, years, sectors, start_year, created_at_tick
                    ) VALUES (
                        v_prop.nation_id, v_prop.id,
                        (v_prop.holiday_params->>'pct')::int,
                        (v_prop.holiday_params->>'years')::int,
                        CASE WHEN v_prop.holiday_params->'sectors' = 'null'::jsonb THEN NULL
                             ELSE ARRAY(SELECT jsonb_array_elements_text(v_prop.holiday_params->'sectors')) END,
                        2000 + v_tick / 12, v_tick
                    );
                END IF;
            END IF;

            INSERT INTO bills (nation_id, proposed_by, proposed_tick, bill_name, bill_type,
                               status, voting_ends_tick, passed_tick, votes_for, votes_against, preamble)
            VALUES (v_vote.nation_id, v_prop.author_faction_id, v_vote.started_at_tick,
                    format('%s (%s Code)', v_vote.bill_name, initcap(COALESCE(v_vote.category, 'statute'))),
                    'committee_floor',
                    CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
                    v_vote.resolve_at_tick, v_tick, v_vote.yes_seats, v_vote.no_seats,
                    CASE WHEN v_passed
                         THEN format('The chamber enacts %s, sponsored by %s, %s seats to %s. It enters the %s Code.',
                                     v_vote.bill_name, v_vote.sponsor_name,
                                     v_vote.yes_seats, v_vote.no_seats,
                                     initcap(COALESCE(v_vote.category, 'statute')))
                         ELSE format('The chamber rejects %s, sponsored by %s, %s seats to %s.',
                                     v_vote.bill_name, v_vote.sponsor_name,
                                     v_vote.no_seats, v_vote.yes_seats)
                    END);
        END IF;

        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'resolved', v_resolved, 'tick', v_tick);
END $$;

REVOKE EXECUTE ON FUNCTION public.resolve_due_committee_floor_votes() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resolve_due_committee_floor_votes() TO authenticated;

-- ── 9. In-flight proposals go to the floor (user-confirmed) ───────
DO $$
DECLARE
    r      record;
    v_tick int;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR r IN SELECT id FROM committee_proposals
              WHERE status IN ('queued','in_hearing','in_amendment',
                               'awaiting_report_vote','reported','tabled')
    LOOP
        UPDATE committee_proposals SET status = 'on_floor' WHERE id = r.id;
        PERFORM _committee_resolve_floor(r.id, v_tick);
    END LOOP;

    FOR r IN SELECT id FROM committee_policy_proposals
              WHERE status IN ('queued','tabled')
    LOOP
        PERFORM _open_policy_floor_vote(r.id, v_tick);
    END LOOP;
END $$;

-- ── 10. The committee stage itself ────────────────────────────────
DROP TABLE IF EXISTS
    public.committee_hearing_chat_messages,
    public.committee_hearing_testimonies,
    public.committee_hearing_personas,
    public.committee_hearings,
    public.committee_motion_votes,
    public.committee_motions,
    public.committee_agenda_votes,
    public.committee_admission_votes,
    public.committee_members,
    public.committees
    CASCADE;

NOTIFY pgrst, 'reload schema';

COMMIT;
