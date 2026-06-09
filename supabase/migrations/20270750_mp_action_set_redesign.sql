-- ════════════════════════════════════════════════════════════════════
-- 20270750 — MP action set redesign
--
-- Per user spec, the Member of Parliament repeatable-action set
-- changes from
--    Floor Speech / Hold a Rally / Fundraising Dinner
-- to
--    Propose New Statute / Propose New Law / Fundraising
--
-- Three server-side changes accompany the client tile swap:
--
-- 1. committee_propose_law (the statute draft RPC) now gates on
--    next_mp_action_tick AND burns it on success. Previously
--    statute drafting was free of the MP per-tick lock; the new
--    "pick one each tick" tile makes it part of that lock.
--
-- 2. committee_propose_policy_change (the policy-switch RPC, 20270728)
--    gains the same gate + burn for the same reason.
--
-- 3. politician_mp_fundraising_dinner — the popularity hit drops from
--    -1 to -0.5 to match the user's redesigned Fundraising tile.
--    Everything else (1d20, $roll × $1000 to party_funds, +1-tick
--    cooldown burn) is byte-faithful to 20270486.
--
-- All three pieces share the next_mp_action_tick lock (+1 cooldown
-- from 20270460) — same per-tick economy as before, just a new
-- 3-action slate.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. committee_propose_law — MP cooldown check + burn
-- ════════════════════════════════════════════════════════════════════
-- Byte-faithful to 20270686 except for the two added lock pieces:
--   • next_mp_action_tick check inserted right after the office
--     validation (same shape as politician_mp_floor_speech et al).
--   • next_mp_action_tick burn inserted right before the RETURN.
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

    -- 20270750: MP per-tick lock. Statute drafting is now one of the
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

    -- 20270750: burn the MP per-tick lock.
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


-- ════════════════════════════════════════════════════════════════════
-- 2. committee_propose_policy_change — MP cooldown check + burn
-- ════════════════════════════════════════════════════════════════════
-- Byte-faithful to 20270728 except for the two added lock pieces.
CREATE OR REPLACE FUNCTION public.committee_propose_policy_change(
    p_committee_id       uuid,
    p_policy_id          uuid,
    p_proposed_option_id uuid,
    p_faction_id         uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_comm            committees%ROWTYPE;
    v_tick            int;
    v_proposed_policy uuid;
    v_current_opt     uuid;
    v_id              uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL
       OR p_committee_id IS NULL
       OR p_policy_id IS NULL
       OR p_proposed_option_id IS NULL THEN
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

    -- 20270750: MP per-tick lock.
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

    INSERT INTO committee_policy_proposals (
        committee_id, nation_id, author_faction_id,
        policy_id, current_option_id, proposed_option_id,
        status, proposed_at_tick
    ) VALUES (
        p_committee_id, v_pol.nation_id, v_pol.id,
        p_policy_id, v_current_opt, p_proposed_option_id,
        'queued', v_tick
    )
    RETURNING id INTO v_id;

    -- 20270750: burn the MP per-tick lock.
    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',          true,
        'proposal_id',      v_id,
        'tick',             v_tick,
        'next_action_tick', v_tick + 1
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.committee_propose_policy_change(uuid, uuid, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_propose_policy_change(uuid, uuid, uuid, uuid) TO authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 3. politician_mp_fundraising_dinner — popularity hit -1 → -0.5
-- ════════════════════════════════════════════════════════════════════
-- The Fundraising tile in the new MP action set softens the donor
-- visibility cost from -1 to -0.5. Roll math + party_funds payout +
-- cooldown burn unchanged from 20270486.
CREATE OR REPLACE FUNCTION public.politician_mp_fundraising_dinner(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_ctx        jsonb;
    v_pol_id     uuid;
    v_party_id   uuid;
    v_party_name text;
    v_tick       int;
    v_roll       int;
    v_money      bigint;
    v_new_funds  numeric;
    v_new_pop    numeric;
BEGIN
    v_ctx := _mp_action_check(p_faction_id);
    IF NOT (v_ctx->>'ok')::bool THEN
        RETURN (v_ctx - 'ok') || jsonb_build_object('success', false);
    END IF;

    v_pol_id     := (v_ctx->>'politician_id')::uuid;
    v_party_id   := (v_ctx->>'party_id')::uuid;
    v_party_name := v_ctx->>'party_name';
    v_tick       := (v_ctx->>'current_tick')::int;

    v_roll  := 1 + floor(random() * 20)::int;
    v_money := (v_roll * 1000)::bigint;

    UPDATE factions
       SET party_funds    = COALESCE(party_funds, 0) + v_money,
           popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 0.5)
     WHERE id = v_party_id
    RETURNING party_funds, popularity_pct INTO v_new_funds, v_new_pop;

    UPDATE factions SET next_mp_action_tick = v_tick + 1 WHERE id = v_pol_id;

    RETURN jsonb_build_object(
        'success',              true,
        'action',               'fundraising',
        'roll',                 v_roll,
        'money_raised',         v_money,
        'party_funds_after',    v_new_funds,
        'new_party_popularity', v_new_pop,
        'party_name',           v_party_name,
        'next_action_tick',     v_tick + 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_mp_fundraising_dinner(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
