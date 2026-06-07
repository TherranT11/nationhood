-- ════════════════════════════════════════════════════════════════════
-- 20270668 — Multi-politician faction_id sweep, round 4
--
-- Rounds 1-3 (20270661 / 20270665 / 20270667) closed the original
-- bug class — every standalone politician_* action RPC that graded
-- the caller via:
--
--   SELECT * INTO v_pol FROM factions
--    WHERE (id = v_uid OR linked_user_id = v_uid)
--      AND faction_type = 'politician' AND abandoned_at IS NULL
--    ORDER BY created_at ASC LIMIT 1;
--
-- breaks on multi-politician accounts (Renata / Sofia bug class).
-- The career / home / committee surfaces grade the active ctx.faction
-- row, but the server grades whichever sibling was created first.
--
-- Rounds 1-3 covered the player-action RPCs. This round closes the
-- domain-RPC stragglers — the committee, bills, chair, election,
-- court draw/appeal, and civil-servant-paperwork surfaces that
-- share the same selector shape. Thirteen functions in scope:
--
--   COMMITTEE (re-emit from 20270640 / 20270500 bodies)
--     • committee_propose_amendment
--     • committee_propose_law
--
--   BILLS (re-emit from 20270424 / 20270423 bodies)
--     • propose_bill                — no client callers today
--     • cast_vote_on_bill           — no client callers today
--
--   CHAIRS (re-emit from 20270593 bodies)
--     • politician_become_deputy_speaker
--     • politician_run_for_speaker
--     • politician_resign_chair                — no existing args
--
--   ELECTION (re-emit from 20270506 body)
--     • politician_stand_for_election
--
--   COURT — DRAW / APPEAL (re-emit from 20270646 bodies; already
--   id-based but with p_faction_id as the FIRST argument. This sweep
--   moves it to the LAST argument so every politician-domain RPC
--   ends with the same convention.)
--     • accept_drawn_case           — no client callers today
--     • refuse_drawn_case
--     • start_appeal
--
--   PAPERWORK — civil-servant filings only
--     • submit_paperwork_routing                (20270638)
--     • fetch_civil_servant_dispatch            (20270630, no args)
--
-- Pattern per function (identical to rounds 1-3):
--   1. DROP the old signature so any stale caller fails loud.
--   2. Add p_faction_id uuid as the LAST argument (rounds 1-3
--      convention — domain args first, faction_id last).
--   3. Insert NULL guard:
--        IF p_faction_id IS NULL THEN
--            RETURN jsonb_build_object('success', false,
--                                      'reason', 'invalid_arguments');
--        END IF;
--      directly after the auth.uid() NULL check.
--   4. Replace the politician SELECT with the id-based lookup +
--      ownership guard:
--        SELECT * INTO v_pol FROM factions
--         WHERE id = p_faction_id
--           AND faction_type = 'politician'
--           AND abandoned_at IS NULL
--           AND (id = v_uid OR linked_user_id = v_uid)
--         [FOR UPDATE];
--   5. Where the old SELECT also constrained politician_party_id or
--      politician_ministry, those checks move INTO the function body
--      as a separate IF after the lookup so the existing 'not_member'
--      / 'not_civil_servant' reason codes still fire — same pattern
--      as 20270661 file_a_memo and 20270665 _mp_action_check.
--   6. Everything else byte-identical to each RPC's latest emission.
--
-- Client coverage (3 surfaces): politician-statutes.html,
-- politician-career.html, politician-home.html. handleMpAction
-- already threads p_faction_id on every politician-home action so
-- the existing dispatcher needs no edit.
--
-- The three court draw/appeal RPCs in 20270646 already use the
-- id-based SELECT — this sweep only re-positions p_faction_id from
-- the FIRST to LAST argument. PostgREST resolves named-arg calls by
-- name, so existing JS object-literal callers stay valid; only the
-- function signature on the server changes.
--
-- ── DROPPED FROM ORIGINAL 19-RPC SCOPE (pre-commit audit) ──
-- Six RPCs the initial sweep proposed touching were excised:
--
--   • is_court_admin / submit_court_case_draft — bodies have no
--     politician SELECT at all; the original grep was a false
--     positive from a parser bug that spilled across $$-terminated
--     function boundaries. No bug class, nothing to fix.
--
--   • accept_court_case_draft — has an ORDER BY for ENTREPRENEUR
--     credit lookup, not politician grading. Adding p_faction_id
--     wouldn't help (the body never references it) and the real
--     entrepreneur multi-faction bug needs its own sweep with a
--     different fix shape (the admin doesn't know the submitter's
--     faction).
--
--   • submit_paperwork_dispatch / approve_paperwork_dispatch /
--     reject_paperwork_dispatch — bug class is real but the caller
--     surfaces (handlepaperwork.html, courtcaseadmin.html) don't
--     load a faction context. Wiring p_faction_id through would
--     break those pages until they're migrated to initCommon-style
--     bootstrap. Deferred until the page work is in scope.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. committee_propose_amendment(p_amends_proposal_id, p_amendment_text, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.committee_propose_amendment(uuid, text);

CREATE OR REPLACE FUNCTION public.committee_propose_amendment(
    p_amends_proposal_id uuid,
    p_amendment_text     text,
    p_faction_id         uuid
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
    -- Same-nation guard. Orphaned (NULL nation_id) politicians can't
    -- amend; cross-nation amendments are rejected.
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

    -- Committee is inherited from the parent. If the parent's committee
    -- row was deleted (shouldn't happen — committees aren't deleted in
    -- the current model — but defend against it) bail rather than
    -- write an orphan amendment.
    SELECT * INTO v_comm FROM committees WHERE id = v_parent.committee_id;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'parent_committee_missing');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Single-article wrap matching the propose_law shape so the
    -- downstream readers (hearing UI, statute view) don't need a
    -- branch on proposal_type to render the body.
    v_articles := jsonb_build_array(
        jsonb_build_object('ordinal', 1, 'tag', 'operative', 'text', v_text)
    );
    v_section := 'Amendment: ' || v_parent.section;

    INSERT INTO committee_proposals (
        committee_id, nation_id, author_faction_id,
        category, section, articles,
        status, proposed_at_tick,
        proposal_type, amends_proposal_id
    ) VALUES (
        v_comm.id, v_parent.nation_id, v_pol.id,
        v_parent.category, v_section, v_articles,
        'queued', v_tick,
        'amendment', v_parent.id
    )
    RETURNING id INTO v_id;

    -- Committee display name — keep the CASE in sync with
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

    -- ONE-SOURCE NOTE: the sentence here mirrors committee_propose_
    -- law's event_log INSERT — keep the two in sync with the
    -- client-side CAREER_EVENT_TEMPLATES map.
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
REVOKE EXECUTE ON FUNCTION public.committee_propose_amendment(uuid, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_propose_amendment(uuid, text, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 2. committee_propose_law(p_committee_id, p_category, p_section, p_articles, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.committee_propose_law(uuid, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.committee_propose_law(
    p_committee_id uuid,
    p_category     text,
    p_section      text,
    p_articles     jsonb,
    p_faction_id   uuid
)
RETURNS jsonb
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
    -- Orphaned politicians (NULL nation_id) can't propose. Otherwise
    -- v_comm.nation_id <> NULL evaluates to NULL → IF skips → an
    -- orphan could submit to any committee. IS DISTINCT FROM closes
    -- the NULL-bypass; the explicit NULL check returns the same
    -- wrong_nation reason so the client doesn't need a new branch.
    -- (Restored from 20270498's audit patch — body kept here to keep
    -- this CREATE OR REPLACE the canonical reference.)
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

    -- Validate each article's shape + sum total text length.
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

    -- Server-normalised articles: trim, ordinal 1..N, drop unknown
    -- tag values to 'operative' so the column shape is predictable
    -- regardless of what the client sent.
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

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO committee_proposals (
        committee_id, nation_id, author_faction_id,
        category, section, articles,
        status, proposed_at_tick
    ) VALUES (
        v_comm.id, v_comm.nation_id, v_pol.id,
        v_category, v_section, v_articles,
        'queued', v_tick
    )
    RETURNING id INTO v_id;

    -- ── Dispatches ─────────────────────────────────────────────────
    -- Committee display name — keep this CASE in sync with
    -- js/committees.js COMMITTEES[*].name when adding a new committee.
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

    -- ONE-SOURCE NOTE: the sentence here is duplicated in
    -- politician-home.html's CAREER_EVENT_TEMPLATES.proposed_law
    -- because event_log stores text (read directly) while
    -- politician_career_events stores components (rendered via the
    -- template map). The two writers MUST emit identical strings.
    -- If you edit the format below, update the client template too.
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
REVOKE EXECUTE ON FUNCTION public.committee_propose_law(uuid, text, text, jsonb, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_propose_law(uuid, text, text, jsonb, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 3. propose_bill(p_policy_id, p_option_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- No client callers today (verified). Server signature fixed for
-- convention parity; ready when the surface comes back.
DROP FUNCTION IF EXISTS public.propose_bill(uuid, uuid);

CREATE OR REPLACE FUNCTION public.propose_bill(
    p_policy_id  uuid,
    p_option_id  uuid,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_option    policy_options%ROWTYPE;
    v_current   uuid;
    v_stance    jsonb;
    v_bill_id   uuid;
    v_next_pr   int;
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
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_party');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_pol.next_bill_propose_tick IS NOT NULL
       AND v_pol.next_bill_propose_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_bill_propose_tick);
    END IF;

    SELECT * INTO v_option FROM policy_options WHERE id = p_option_id;
    IF v_option.id IS NULL OR v_option.policy_id <> p_policy_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_option');
    END IF;

    SELECT selected_option_id INTO v_current
      FROM active_laws
     WHERE nation_id = v_pol.nation_id
       AND policy_id = p_policy_id
       AND COALESCE(is_reversal, false) = false
     ORDER BY passed_tick DESC NULLS LAST LIMIT 1;
    IF v_current IS NOT NULL AND v_current = p_option_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_active');
    END IF;

    -- Fast-path EXISTS check — same-tx racers fall through to the
    -- unique-index EXCEPTION handler at the INSERT.
    IF EXISTS (SELECT 1 FROM assembly_bills
                WHERE nation_id = v_pol.nation_id
                  AND policy_id = p_policy_id
                  AND status    = 'voting') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_in_flight');
    END IF;

    v_stance := derive_bill_stance(p_option_id);

    BEGIN
        INSERT INTO assembly_bills (
            nation_id, policy_id, current_option_id, proposed_option_id,
            proposer_politician_id, proposer_party_id,
            archetype_alignment, proposed_at_tick, close_at_tick
        ) VALUES (
            v_pol.nation_id, p_policy_id, v_current, p_option_id,
            v_pol.id, v_pol.politician_party_id,
            v_stance, v_tick, v_tick + 3
        ) RETURNING id INTO v_bill_id;
    EXCEPTION WHEN unique_violation THEN
        -- Concurrent racer beat us to the INSERT via the partial
        -- unique index assembly_bills_one_voting_per_policy.
        RETURN jsonb_build_object('success', false, 'reason', 'bill_in_flight');
    END;

    v_next_pr := v_tick + 5;
    UPDATE factions SET next_bill_propose_tick = v_next_pr WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success', true,
        'bill_id', v_bill_id,
        'archetype_alignment', v_stance,
        'close_at_tick', v_tick + 3,
        'next_propose_tick', v_next_pr
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.propose_bill(uuid, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.propose_bill(uuid, uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 4. cast_vote_on_bill(p_bill_id, p_position, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- No client callers today (verified). Server signature fixed for
-- convention parity; ready when the surface comes back.
DROP FUNCTION IF EXISTS public.cast_vote_on_bill(uuid, text);

CREATE OR REPLACE FUNCTION public.cast_vote_on_bill(
    p_bill_id    uuid,
    p_position   text,
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_pol  factions%ROWTYPE;
    v_bill assembly_bills%ROWTYPE;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_position NOT IN ('yes', 'no') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_position');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_bill FROM assembly_bills WHERE id = p_bill_id;
    IF v_bill.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_not_found');
    END IF;
    IF v_bill.status <> 'voting' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'bill_closed');
    END IF;
    IF v_bill.nation_id <> v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_nation');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO assembly_bill_votes (bill_id, politician_id, party_id, position, voted_at_tick)
    VALUES (p_bill_id, v_pol.id, v_pol.politician_party_id, p_position, v_tick)
    ON CONFLICT (bill_id, politician_id) DO UPDATE
        SET position      = EXCLUDED.position,
            party_id      = EXCLUDED.party_id,
            voted_at_tick = EXCLUDED.voted_at_tick;

    RETURN jsonb_build_object('success', true, 'bill_id', p_bill_id, 'position', p_position);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.cast_vote_on_bill(uuid, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.cast_vote_on_bill(uuid, text, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 5. politician_become_deputy_speaker(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- The original SELECT also constrained politician_party_id = p_party_id.
-- That moves into a separate IF after the id-based lookup so the
-- 'not_member' reason code still fires when the caller's politician
-- isn't in the party they passed.
DROP FUNCTION IF EXISTS public.politician_become_deputy_speaker(uuid);

CREATE OR REPLACE FUNCTION public.politician_become_deputy_speaker(
    p_party_id   uuid,
    p_faction_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    REPUTATION_REQUIRED CONSTANT int := 35;
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_top_party uuid;
    v_existing  uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF v_pol.politician_office IS DISTINCT FROM 'member_of_parliament' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;

    IF v_pol.politician_deputy_speaker_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_deputy_speaker');
    END IF;
    -- Cross-chair guard: a Speaker shouldn't be able to also hold the
    -- Deputy stamp. The matching guard on the Speaker RPC blocks the
    -- other direction.
    IF v_pol.politician_speaker_of_assembly_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'holds_other_chair',
            'chair', 'speaker_of_assembly');
    END IF;

    IF COALESCE(v_pol.politician_reputation, 0) < REPUTATION_REQUIRED THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_reputation',
            'required', REPUTATION_REQUIRED,
            'have',     COALESCE(v_pol.politician_reputation, 0));
    END IF;

    SELECT id INTO v_top_party
      FROM public.factions
     WHERE nation_id    = v_pol.nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL
     ORDER BY COALESCE(seats, 0) DESC, created_at ASC
     LIMIT 1;
    IF v_top_party IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_governing');
    END IF;

    SELECT id INTO v_existing
      FROM public.factions
     WHERE nation_id = v_pol.nation_id
       AND politician_deputy_speaker_at_tick IS NOT NULL
     LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seat_filled');
    END IF;

    BEGIN
        UPDATE public.factions
           SET politician_deputy_speaker_at_tick = v_tick
         WHERE id = v_pol.id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seat_filled');
    END;

    RETURN jsonb_build_object(
        'success',       true,
        'tick',          v_tick,
        'role',          'deputy_speaker'
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_become_deputy_speaker(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_become_deputy_speaker(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 6. politician_run_for_speaker(p_party_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_run_for_speaker(uuid);

CREATE OR REPLACE FUNCTION public.politician_run_for_speaker(
    p_party_id   uuid,
    p_faction_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    REPUTATION_REQUIRED CONSTANT int := 35;
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_party     factions%ROWTYPE;
    v_tick      int;
    v_existing  uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF v_pol.politician_office IS DISTINCT FROM 'member_of_parliament' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;

    IF v_pol.politician_speaker_of_assembly_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_speaker');
    END IF;
    -- Mutually exclusive with the lower chair. Spec route is to resign
    -- Deputy first (politician_resign_chair → returns to MP), then run.
    IF v_pol.politician_deputy_speaker_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'holds_other_chair',
            'chair', 'deputy_speaker');
    END IF;

    IF COALESCE(v_pol.politician_reputation, 0) < REPUTATION_REQUIRED THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_reputation',
            'required', REPUTATION_REQUIRED,
            'have',     COALESCE(v_pol.politician_reputation, 0));
    END IF;

    -- HoG gate: party_status = 'Governing' (set by the 20270394 admin
    -- form when "Head of Government" is checked for the party; the
    -- explicit surface for "this party holds the HoG seat").
    SELECT * INTO v_party FROM public.factions WHERE id = p_party_id;
    IF v_party.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    IF v_party.party_status IS DISTINCT FROM 'Governing' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_governing');
    END IF;

    -- Seat-filled gate (one-per-nation). Backstopped by uq index.
    SELECT id INTO v_existing
      FROM public.factions
     WHERE nation_id = v_pol.nation_id
       AND politician_speaker_of_assembly_at_tick IS NOT NULL
     LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seat_filled');
    END IF;

    BEGIN
        UPDATE public.factions
           SET politician_speaker_of_assembly_at_tick = v_tick
         WHERE id = v_pol.id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seat_filled');
    END;

    RETURN jsonb_build_object(
        'success', true,
        'tick',    v_tick,
        'role',    'speaker_of_assembly'
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_run_for_speaker(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_run_for_speaker(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 7. politician_resign_chair(p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- Originally arg-less. New signature is just (p_faction_id uuid).
DROP FUNCTION IF EXISTS public.politician_resign_chair();

CREATE OR REPLACE FUNCTION public.politician_resign_chair(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_pol   factions%ROWTYPE;
    v_chair text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    IF v_pol.politician_speaker_of_assembly_at_tick IS NOT NULL THEN
        v_chair := 'speaker_of_assembly';
        UPDATE public.factions
           SET politician_speaker_of_assembly_at_tick = NULL
         WHERE id = v_pol.id;
    ELSIF v_pol.politician_deputy_speaker_at_tick IS NOT NULL THEN
        v_chair := 'deputy_speaker';
        UPDATE public.factions
           SET politician_deputy_speaker_at_tick = NULL
         WHERE id = v_pol.id;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'no_chair_held');
    END IF;

    RETURN jsonb_build_object(
        'success',       true,
        'resigned_from', v_chair
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_resign_chair(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_resign_chair(uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 8. politician_stand_for_election(p_party_id, p_tier, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.politician_stand_for_election(uuid, text);

CREATE OR REPLACE FUNCTION public.politician_stand_for_election(
    p_party_id   uuid,
    p_tier       text,
    p_faction_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_shard_id  uuid;
    v_offer     politician_election_offers%ROWTYPE;
    v_next      int;
    v_resolve   int;
    v_district  text;
    v_opp_first text;
    v_opp_last  text;
    v_opp_blurb text;
    v_opp_pname text;
    v_your      int;
    v_opp       int;
    v_odds      int;
    v_win       int;
    v_lose      int;
    v_poll_you  int;
    v_poll_opp  int;
    v_poll_und  int;
    v_party_funds_before bigint;
    v_entry_fee bigint := 50000;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_tier NOT IN ('community','parliament') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;
    IF v_pol.politician_party_id IS DISTINCT FROM p_party_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    IF v_pol.politician_office IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_in_office',
            'office', v_pol.politician_office);
    END IF;

    SELECT current_tick, id INTO v_tick, v_shard_id FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF EXISTS (SELECT 1 FROM politician_active_election WHERE politician_id = v_pol.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'race_in_progress');
    END IF;

    IF v_pol.next_member_action_tick IS NOT NULL
       AND v_pol.next_member_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_member_action_tick);
    END IF;

    SELECT * INTO v_offer FROM politician_election_offers WHERE politician_id = v_pol.id;
    IF v_offer.politician_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_offer');
    END IF;

    IF p_tier = 'community' THEN
        v_district  := v_offer.com_district;
        v_opp_first := v_offer.com_opp_first;
        v_opp_last  := v_offer.com_opp_last;
        v_opp_blurb := v_offer.com_opp_blurb;
        v_opp_pname := NULL;
        v_your      := v_offer.com_your_stat;
        v_opp       := v_offer.com_opp_stat;
        v_odds      := v_offer.com_odds_pct;
        v_win       := v_offer.com_stake_win;
        v_lose      := v_offer.com_stake_lose;
        v_resolve   := v_tick + 1;
    ELSE
        v_district  := v_offer.parl_district;
        v_opp_first := v_offer.parl_opp_first;
        v_opp_last  := v_offer.parl_opp_last;
        v_opp_blurb := v_offer.parl_opp_blurb;
        v_opp_pname := v_offer.parl_opp_party_name;
        v_your      := v_offer.parl_your_stat;
        v_opp       := v_offer.parl_opp_stat;
        v_odds      := v_offer.parl_odds_pct;
        v_win       := v_offer.parl_stake_win;
        v_lose      := v_offer.parl_stake_lose;
        v_resolve   := v_tick + 2;
    END IF;

    IF p_tier = 'parliament' THEN
        SELECT party_funds INTO v_party_funds_before
          FROM factions
         WHERE id = p_party_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL
         FOR UPDATE;
        IF v_party_funds_before IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
        END IF;
        IF v_party_funds_before < v_entry_fee THEN
            RETURN jsonb_build_object('success', false,
                'reason', 'insufficient_party_funds',
                'have', v_party_funds_before, 'need', v_entry_fee);
        END IF;
        UPDATE factions
           SET party_funds = party_funds - v_entry_fee
         WHERE id = p_party_id;
    END IF;

    -- Polling seed (20270399).
    v_poll_you := GREATEST(0, LEAST(100, v_odds - 8));
    v_poll_und := 15;
    v_poll_opp := GREATEST(0, 100 - v_poll_you - v_poll_und);

    INSERT INTO politician_active_election (
        politician_id, shard_id, race_tier, district,
        opp_first, opp_last, opp_blurb, opp_party_name,
        your_stat, opp_stat, win_odds_pct, stake_win, stake_lose,
        resolve_tick,
        polling_you_pct, polling_opp_pct, polling_undecided_pct,
        party_id
    ) VALUES (
        v_pol.id, v_shard_id, p_tier, v_district,
        v_opp_first, v_opp_last, v_opp_blurb, v_opp_pname,
        v_your, v_opp, v_odds, v_win, v_lose,
        v_resolve,
        v_poll_you, v_poll_opp, v_poll_und,
        p_party_id
    );

    DELETE FROM politician_election_offers WHERE politician_id = v_pol.id;

    -- 20270506: do NOT bump next_member_action_tick here. Standing
    -- for election is administrative; the player gets one campaign
    -- action on the entry tick. Existing cooldown (if any) stands.
    v_next := v_pol.next_member_action_tick;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_pol.id, v_tick, 'stood_for_election', v_district,
        jsonb_build_object(
            'race_tier',      p_tier,
            'opponent',       v_opp_first || ' ' || v_opp_last,
            'opp_party_name', v_opp_pname,
            'win_odds_pct',   v_odds,
            'entry_fee',      CASE WHEN p_tier = 'parliament' THEN v_entry_fee ELSE 0 END
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'race_tier', p_tier,
        'district', v_district,
        'opp_full_name', v_opp_first || ' ' || v_opp_last,
        'win_odds_pct', v_odds,
        'resolve_tick', v_resolve,
        'next_member_action_tick', v_next,
        'polling_you_pct', v_poll_you,
        'polling_opp_pct', v_poll_opp,
        'polling_undecided_pct', v_poll_und
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.politician_stand_for_election(uuid, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_stand_for_election(uuid, text, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 9. accept_drawn_case(p_case_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- 20270646 already used the id-based SELECT and an ownership guard;
-- this sweep only re-positions p_faction_id from FIRST to LAST so the
-- politician-domain convention is uniform. No client callers today
-- (verified).
DROP FUNCTION IF EXISTS public.accept_drawn_case(uuid, uuid);

CREATE OR REPLACE FUNCTION public.accept_drawn_case(
    p_case_id    uuid,
    p_faction_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_case_status text;
    v_standing    numeric;
    v_inserted    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_case_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT status INTO v_case_status FROM public.court_case_drafts WHERE id = p_case_id;
    IF v_case_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;
    IF v_case_status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_approved');
    END IF;

    -- Gate the stat award on the INSERT actually landing. UNIQUE
    -- (politician_id, case_id) means a double-fire / replay only
    -- inserts once; v_inserted = 0 on the second try, and we bail
    -- before applying +0.2 again.
    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, p_case_id, 'accepted')
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    UPDATE public.factions
       SET politician_capital = COALESCE(politician_capital, 0) + 0.2
     WHERE id = v_pol.id
    RETURNING politician_capital INTO v_standing;

    RETURN jsonb_build_object(
        'success',           true,
        'decision',          'accepted',
        'case_id',           p_case_id,
        'influence_delta',    0.2,
        'new_influence',      v_standing
    );
END $$;
REVOKE EXECUTE ON FUNCTION public.accept_drawn_case(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.accept_drawn_case(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 10. refuse_drawn_case(p_case_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- 20270646 already used the id-based SELECT; this sweep only
-- re-positions p_faction_id from FIRST to LAST. PostgREST resolves
-- by argument name so existing object-literal callers stay valid.
DROP FUNCTION IF EXISTS public.refuse_drawn_case(uuid, uuid);

CREATE OR REPLACE FUNCTION public.refuse_drawn_case(
    p_case_id    uuid,
    p_faction_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_pol         factions%ROWTYPE;
    v_case_status text;
    v_pc          numeric;
    v_inserted    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_case_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    SELECT status INTO v_case_status FROM public.court_case_drafts WHERE id = p_case_id;
    IF v_case_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_found');
    END IF;
    IF v_case_status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_not_approved');
    END IF;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, p_case_id, 'refused')
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_decided');
    END IF;

    UPDATE public.factions
       SET politician_influence = GREATEST(0, COALESCE(politician_influence, 0) - 2)
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_pc;

    RETURN jsonb_build_object(
        'success',                 true,
        'decision',                'refused',
        'case_id',                 p_case_id,
        'politician_influence_delta', -2,
        'new_politician_influence',   v_pc
    );
END $$;
REVOKE EXECUTE ON FUNCTION public.refuse_drawn_case(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.refuse_drawn_case(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 11. start_appeal(p_original_trial_id, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- 20270646 already used the id-based SELECT; this sweep only
-- re-positions p_faction_id from FIRST to LAST.
DROP FUNCTION IF EXISTS public.start_appeal(uuid, uuid);

CREATE OR REPLACE FUNCTION public.start_appeal(
    p_original_trial_id uuid,
    p_faction_id        uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                uuid := auth.uid();
    v_pol                factions%ROWTYPE;
    v_orig               court_case_trials%ROWTYPE;
    v_case               court_case_drafts%ROWTYPE;
    v_tick               int;
    v_appellant_side     text;
    v_appellee_side      text;
    v_appellee_party     text;
    v_state_advocate_id  uuid;
    v_trial_id           uuid;
    v_p_advocate         uuid;
    v_d_advocate         uuid;
    v_status             text;
    v_judge_id           uuid;
    v_active_count       int;
    v_cap                int;
    v_my_owner           uuid;
    v_is_sc              boolean;
    v_can_sc             boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_original_trial_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;
    IF v_pol.politician_magistrate_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'magistrate_cannot_appeal');
    END IF;

    v_active_count := public._advocate_active_case_count(v_pol.id);
    v_cap := CASE
        WHEN v_pol.politician_experienced_advocate_at_tick IS NOT NULL THEN 4
        WHEN v_pol.politician_state_prosecutor_at_tick    IS NOT NULL THEN 4
        ELSE 3
    END;
    IF v_active_count >= v_cap THEN
        RETURN jsonb_build_object('success', false, 'reason', 'case_cap_reached',
            'active', v_active_count, 'cap', v_cap);
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT * INTO v_orig FROM public.court_case_trials
     WHERE id = p_original_trial_id FOR UPDATE;
    IF v_orig.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'trial_not_found');
    END IF;
    IF v_orig.status <> 'resolved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'original_not_resolved');
    END IF;
    IF v_orig.nation_id <> v_pol.bar_admitted_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_mismatch');
    END IF;
    IF v_orig.verdict_at_tick IS NULL
       OR (v_tick - v_orig.verdict_at_tick) > 12 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'appeal_window_closed');
    END IF;
    IF v_orig.verdict_winner NOT IN ('plaintiff', 'defendant') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_verdict_to_appeal');
    END IF;
    IF EXISTS (SELECT 1 FROM public.court_case_trials
                WHERE appeal_of_trial_id = v_orig.id
                  AND status IN ('pre_trial','settlement_conference','awaiting_hearing','in_progress')) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'appeal_in_flight');
    END IF;

    v_is_sc  := v_orig.appeal_of_trial_id IS NOT NULL;
    v_can_sc := v_pol.politician_experienced_advocate_at_tick IS NOT NULL
             OR v_pol.politician_state_prosecutor_at_tick    IS NOT NULL;
    IF v_is_sc AND NOT v_can_sc THEN
        RETURN jsonb_build_object('success', false, 'reason', 'sc_requires_experienced_or_state');
    END IF;
    IF v_is_sc AND EXISTS (
         SELECT 1 FROM public.court_case_trials parent
          WHERE parent.id = v_orig.appeal_of_trial_id
            AND parent.appeal_of_trial_id IS NOT NULL
       ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'sc_is_terminal');
    END IF;

    IF v_orig.verdict_winner = 'plaintiff' THEN
        v_appellant_side := 'defendant';
        v_appellee_side  := 'plaintiff';
    ELSE
        v_appellant_side := 'plaintiff';
        v_appellee_side  := 'defendant';
    END IF;

    SELECT * INTO v_case FROM public.court_case_drafts WHERE id = v_orig.case_draft_id;
    v_appellee_party := CASE WHEN v_appellee_side = 'plaintiff'
                               THEN v_case.plaintiff_party_type
                               ELSE v_case.defendant_party_type END;

    v_my_owner := COALESCE(v_pol.linked_user_id, v_pol.id);

    IF v_appellee_party = 'state' THEN
        SELECT sa.id INTO v_state_advocate_id
          FROM public.factions sa
          LEFT JOIN public.court_case_trials t
            ON (t.plaintiff_advocate_id = sa.id OR t.defendant_advocate_id = sa.id)
           AND t.status IN ('in_progress', 'settlement_conference', 'awaiting_hearing', 'pre_trial')
         WHERE sa.politician_state_prosecutor_at_tick IS NOT NULL
           AND sa.bar_admitted_nation_id = v_pol.bar_admitted_nation_id
           AND sa.abandoned_at IS NULL
           AND sa.id <> v_pol.id
           AND COALESCE(sa.linked_user_id, sa.id) <> v_my_owner
         GROUP BY sa.id
         ORDER BY COUNT(t.id) ASC, random() ASC
         LIMIT 1;
    END IF;

    IF v_appellant_side = 'plaintiff' THEN
        v_p_advocate := v_pol.id;
        v_d_advocate := v_state_advocate_id;
    ELSE
        v_p_advocate := v_state_advocate_id;
        v_d_advocate := v_pol.id;
    END IF;

    -- Status routing:
    --   SC trial, both seats filled → awaiting_hearing (queue).
    --   SC trial, one seat open     → pre_trial (waiting for join).
    --   Regular appeal, both seats  → in_progress.
    --   Regular appeal, one open    → pre_trial.
    IF v_is_sc THEN
        IF v_p_advocate IS NOT NULL AND v_d_advocate IS NOT NULL THEN
            v_status := 'awaiting_hearing';
        ELSE
            v_status := 'pre_trial';
        END IF;
    ELSIF v_p_advocate IS NOT NULL AND v_d_advocate IS NOT NULL THEN
        v_status := 'in_progress';
    ELSE
        v_status := 'pre_trial';
    END IF;

    INSERT INTO public.court_case_trials (
        case_draft_id, nation_id,
        plaintiff_advocate_id, defendant_advocate_id,
        plaintiff_name, defendant_name,
        witness_names,
        status,
        pre_trial_started_at_tick, pre_trial_expires_at_tick,
        matched_at_tick,
        current_round, current_turn,
        appeal_of_trial_id
    ) VALUES (
        v_orig.case_draft_id, v_orig.nation_id,
        v_p_advocate, v_d_advocate,
        v_orig.plaintiff_name, v_orig.defendant_name,
        v_orig.witness_names,
        v_status,
        v_tick, v_tick + 3,
        CASE WHEN v_status IN ('in_progress', 'awaiting_hearing') THEN v_tick END,
        CASE WHEN v_status = 'in_progress' THEN 1   END,
        CASE WHEN v_status = 'in_progress' THEN 'plaintiff' END,
        v_orig.id
    ) RETURNING id INTO v_trial_id;

    INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
    VALUES (v_pol.id, v_orig.case_draft_id,
            CASE WHEN v_appellant_side = 'plaintiff'
                   THEN 'representing_plaintiff'
                   ELSE 'representing_defendant' END)
    ON CONFLICT (politician_id, case_id) DO NOTHING;
    IF v_state_advocate_id IS NOT NULL THEN
        INSERT INTO public.politician_court_case_attempts (politician_id, case_id, decision)
        VALUES (v_state_advocate_id, v_orig.case_draft_id,
                CASE WHEN v_appellee_side = 'plaintiff'
                       THEN 'representing_plaintiff'
                       ELSE 'representing_defendant' END)
        ON CONFLICT (politician_id, case_id) DO NOTHING;
    END IF;

    IF v_is_sc THEN
        -- Filing bonus: +1 Rep, +2 PC for getting in front of the
        -- Supreme Court. Applied once at filing, independent of verdict.
        UPDATE public.factions
           SET politician_reputation = COALESCE(politician_reputation, 0) + 1,
               politician_influence     = COALESCE(politician_influence, 0) + 2
         WHERE id = v_pol.id;

        v_judge_id := NULL;
    ELSE
        v_judge_id := public._assign_magistrate_to_trial(v_trial_id);
        IF v_status = 'in_progress' THEN
            PERFORM public._begin_trial_arguments(v_trial_id);
        END IF;
    END IF;

    INSERT INTO public.court_case_trial_messages (
        trial_id, side, round, turn_seq, text, kind
    ) VALUES (
        v_trial_id, 'system', 0, 0,
        CASE WHEN v_is_sc
             THEN 'A Supreme Court appeal has been filed. The case is queued for hearing.'
             ELSE 'Appeal of the prior verdict is convened. Counsel for the appellant has filed; the court will hear arguments.'
        END,
        'judge_note'
    );

    IF v_is_sc AND v_status = 'awaiting_hearing' THEN
        PERFORM public._activate_sc_queue_for_nation(v_orig.nation_id);
    END IF;

    RETURN jsonb_build_object(
        'success',           true,
        'appeal_trial_id',   v_trial_id,
        'appellant_side',    v_appellant_side,
        'status',            v_status,
        'state_advocate_id', v_state_advocate_id,
        'judge_faction_id',  v_judge_id
    );
END $$;
REVOKE EXECUTE ON FUNCTION public.start_appeal(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.start_appeal(uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 12. submit_paperwork_routing(p_dispatch_id, p_ministry, p_agency, p_flag, p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- The original SELECT also constrained politician_ministry IS NOT NULL.
-- That moves into a separate IF after the id-based lookup so the
-- 'not_civil_servant' reason code still fires (same pattern as
-- 20270661 file_a_memo).
DROP FUNCTION IF EXISTS public.submit_paperwork_routing(uuid, text, text, boolean);

CREATE OR REPLACE FUNCTION public.submit_paperwork_routing(
    p_dispatch_id uuid,
    p_ministry    text,
    p_agency      text,
    p_flag        boolean,
    p_faction_id  uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                uuid := auth.uid();
    v_fac                factions%ROWTYPE;
    v_d                  paperwork_dispatches%ROWTYPE;
    v_tick               int;
    v_handled_this_tick  int;
    v_routing_correct    boolean;
    v_flag_correct       boolean;
    v_skill_delta        numeric := 0;
    v_rep_delta          numeric := 0;
    v_new_skill          numeric;
    v_new_rep            numeric;
    v_batch_position     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_dispatch_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_ministry IS NULL OR p_agency IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_routing');
    END IF;
    IF NOT public._paperwork_valid_ministry_agency(p_ministry, p_agency) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_routing');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;
    IF v_fac.politician_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- 20270638: how many paperwork submissions has this civil servant
    -- already logged THIS tick? Drives both the 3-per-tick batch cap
    -- and the cross-action-lock carve-out below.
    SELECT COUNT(*) INTO v_handled_this_tick
      FROM civil_servant_paperwork_handled
     WHERE faction_id = v_fac.id
       AND handled_at_tick = v_tick;

    IF v_handled_this_tick >= 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'batch_full',
            'batch_position', 3, 'batch_remaining', 0, 'batch_done', true);
    END IF;

    -- Cross-action lock with File a Memo (20270632) still gates the
    -- FIRST submit of the batch. Once v_handled_this_tick > 0, the
    -- lock visible to us was set by this batch's earlier submission
    -- and we'd false-positive on it — so skip the check.
    IF v_handled_this_tick = 0
       AND v_fac.next_civil_service_action_tick IS NOT NULL
       AND v_fac.next_civil_service_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_fac.next_civil_service_action_tick);
    END IF;

    SELECT * INTO v_d FROM paperwork_dispatches WHERE id = p_dispatch_id;
    IF v_d.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'dispatch_not_found');
    END IF;
    IF v_d.status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'dispatch_not_approved');
    END IF;
    IF v_d.author_faction_id = v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_grade_own_authoring');
    END IF;

    -- Per-dispatch 12-tick cooldown (20270630). Separate parallel
    -- gate from the per-tick batch cap above.
    IF EXISTS (
        SELECT 1 FROM civil_servant_paperwork_handled
         WHERE faction_id  = v_fac.id
           AND dispatch_id = p_dispatch_id
           AND handled_at_tick + 12 > v_tick
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'on_cooldown');
    END IF;

    v_routing_correct := (p_ministry = v_d.correct_ministry
                          AND p_agency  = v_d.correct_agency);
    v_flag_correct := (COALESCE(p_flag, false) = v_d.should_flag);

    IF v_routing_correct THEN
        v_skill_delta := 0.3;
    END IF;
    IF v_d.should_flag AND COALESCE(p_flag, false) THEN
        v_rep_delta := 0.3;
    END IF;

    -- Apply stat deltas + stamp the per-tick cross-action lock. The
    -- stamp is a no-op idempotent on submissions 2/3 (same v_tick + 1
    -- value), so we don't branch.
    UPDATE factions
       SET politician_skill              = COALESCE(politician_skill, 0)      + v_skill_delta,
           politician_reputation         = COALESCE(politician_reputation, 0) + v_rep_delta,
           next_civil_service_action_tick = v_tick + 1
     WHERE id = v_fac.id
    RETURNING politician_skill, politician_reputation
        INTO v_new_skill, v_new_rep;

    INSERT INTO civil_servant_paperwork_handled (
        faction_id, dispatch_id, handled_at_tick,
        chosen_ministry, chosen_agency, chose_to_flag,
        routing_correct, flag_correct,
        skill_delta, reputation_delta
    ) VALUES (
        v_fac.id, p_dispatch_id, v_tick,
        p_ministry, p_agency, COALESCE(p_flag, false),
        v_routing_correct, v_flag_correct,
        v_skill_delta, v_rep_delta
    );

    v_batch_position := v_handled_this_tick + 1;

    RETURN jsonb_build_object(
        'success',          true,
        'dispatch_id',      p_dispatch_id,
        'routing_correct',  v_routing_correct,
        'flag_correct',     v_flag_correct,
        'skill_delta',      v_skill_delta,
        'reputation_delta', v_rep_delta,
        'new_skill',        v_new_skill,
        'new_reputation',   v_new_rep,
        'correct_ministry', v_d.correct_ministry,
        'correct_agency',   v_d.correct_agency,
        'should_flag',      v_d.should_flag,
        'next_action_tick', v_tick + 1,
        'batch_position',   v_batch_position,
        'batch_remaining',  GREATEST(0, 3 - v_batch_position),
        'batch_done',       v_batch_position >= 3
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.submit_paperwork_routing(uuid, text, text, boolean, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_paperwork_routing(uuid, text, text, boolean, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 13. fetch_civil_servant_dispatch(p_faction_id)
-- ════════════════════════════════════════════════════════════════════
-- Originally arg-less. New signature is just (p_faction_id uuid).
-- The original SELECT also constrained politician_ministry IS NOT NULL;
-- that moves into a separate IF after the id-based lookup.
DROP FUNCTION IF EXISTS public.fetch_civil_servant_dispatch();

CREATE OR REPLACE FUNCTION public.fetch_civil_servant_dispatch(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_tick   int;
    v_d      RECORD;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Caller must be a civil servant — politician faction with a
    -- politician_ministry assignment. Not gating on a specific
    -- ministry per the user's spec; any civil servant can handle any
    -- dispatch.
    SELECT * INTO v_fac FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;
    IF v_fac.politician_ministry IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_civil_servant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- One approved dispatch the caller hasn't handled in the last 12
    -- ticks, isn't the author of, and that hasn't been claimed by the
    -- caller. Random pick keeps the queue non-deterministic across
    -- civil servants. Returns player-facing columns ONLY — the answer
    -- key (correct_ministry / correct_agency / should_flag) stays
    -- server-side until the grading RPC runs.
    SELECT d.id, d.office_of, d.doc_title, d.sender_title, d.body,
           d.display_id, d.created_at_tick
      INTO v_d
      FROM paperwork_dispatches d
     WHERE d.status = 'approved'
       AND d.author_faction_id IS DISTINCT FROM v_fac.id
       AND NOT EXISTS (
           SELECT 1 FROM civil_servant_paperwork_handled h
            WHERE h.faction_id  = v_fac.id
              AND h.dispatch_id = d.id
              AND h.handled_at_tick + 12 > v_tick
       )
     ORDER BY random()
     LIMIT 1;

    IF v_d.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'dispatch', NULL,
            'reason', 'queue_empty');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'dispatch', jsonb_build_object(
            'id',              v_d.id,
            'display_id',      v_d.display_id,
            'office_of',       v_d.office_of,
            'doc_title',       v_d.doc_title,
            'sender_title',    v_d.sender_title,
            'body',            v_d.body,
            'created_at_tick', v_d.created_at_tick
        )
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.fetch_civil_servant_dispatch(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fetch_civil_servant_dispatch(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
