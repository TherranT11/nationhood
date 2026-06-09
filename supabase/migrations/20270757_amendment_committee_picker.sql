-- ════════════════════════════════════════════════════════════════════
-- 20270757 — Amendment now takes a proposer-picked committee
--
-- Per user spec, the Amend Statute flow shifts from
--   pick statute → write change → server inherits parent's committee
-- to
--   pick category → pick statute → write the amended text → pick committee
--
-- That means committee_propose_amendment grows a new required
-- p_committee_id parameter and validates it the same way
-- committee_propose_law does (must exist, must be in the proposer's
-- nation). The parent_committee_missing check goes away — the
-- amendment is now filed in the committee the proposer picks, not
-- inherited from the parent statute.
--
-- The event_log + politician_career_events rows also key off the
-- picked committee now, so a constitutional amendment referred to
-- Finance & Budget reads correctly on the timeline.
--
-- Old signature dropped to avoid PostgREST ambiguity — the only
-- caller is politician-statutes.html, updated in the same commit.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.committee_propose_amendment(uuid, text, uuid, jsonb, jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.committee_propose_amendment(
    p_amends_proposal_id uuid,
    p_amendment_text     text,
    p_faction_id         uuid,
    p_committee_id       uuid,
    p_persona_roles      jsonb DEFAULT NULL,
    p_support_archetypes jsonb DEFAULT NULL,
    p_oppose_archetypes  jsonb DEFAULT NULL
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

    -- 20270757: Committee is proposer-picked, not parent-inherited.
    IF p_committee_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_committee');
    END IF;
    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_not_found');
    END IF;
    IF v_comm.nation_id IS DISTINCT FROM v_pol.nation_id THEN
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

    IF NOT _validate_persona_roles(p_persona_roles) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_persona_roles');
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
        committee_id, nation_id, author_faction_id,
        category, section, articles,
        status, proposed_at_tick,
        proposal_type, amends_proposal_id,
        persona_roles, support_archetypes, oppose_archetypes
    ) VALUES (
        v_comm.id, v_parent.nation_id, v_pol.id,
        v_parent.category, v_section, v_articles,
        'queued', v_tick,
        'amendment', v_parent.id,
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

REVOKE EXECUTE ON FUNCTION public.committee_propose_amendment(uuid, text, uuid, uuid, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_propose_amendment(uuid, text, uuid, uuid, jsonb, jsonb, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
