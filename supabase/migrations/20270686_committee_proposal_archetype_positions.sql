-- ════════════════════════════════════════════════════════════════════
-- 20270686 — Committee proposals: Support/Oppose archetype positions
--
-- Adds an author-declared archetype stance to committee proposals:
-- up to 2 archetypes listed as Supporting + up to 2 as Opposing. The
-- lists drive the committee report vote so parties have a real
-- methodology rather than the current "NPC parties abstain unless a
-- player MP from the same party votes."
--
-- Schema:
--   committee_proposals.support_archetypes jsonb — NULL or array of
--     0-2 unique archetype names
--   committee_proposals.oppose_archetypes jsonb — same shape
--   Cross-list constraint: no archetype may appear in both lists
--
-- Canonical catalog (10 entries) matches the admin-form NPC party
-- archetype dropdown introduced in 20270394. The createparty.html
-- player-side flow is sunsetted on the politician side, so we use a
-- single source of truth here.
--
-- Mechanic ("Universal mechanical" per user spec):
--   Player MPs vote freely. Their party's seats flow to their side as
--   before (20270663 party-bloc behavior preserved). But if their
--   party's archetype is in the Support list and they vote 'table',
--   OR archetype is in Oppose and they vote 'report', the party pays
--   -1 popularity_pct (floored at 0) as the soft consequence for
--   breaking with their listed position.
--
--   NPC-only parties (no player MP on the committee) used to abstain
--   wholesale. Now: archetype-matching parties vote automatically —
--   Support → 'report', Oppose → 'table'. Neither → abstain.
--
--   Threshold denominator includes any party that lands on a side
--   (player-driven OR archetype-driven). Abstaining parties sit out
--   the math.
--
-- Limitation: the archetype tally only fires when a player MP triggers
-- mp_vote_on_report. All-NPC committees still need a separate tick
-- processor (or hearing-close auto-trigger) to resolve. Out of scope
-- for this commit.
--
-- RPC signature changes (DROP + CREATE for both):
--   committee_propose_law         — adds p_support_archetypes, p_oppose_archetypes
--   committee_propose_amendment   — same
--
-- mp_vote_on_report keeps its (uuid, uuid, text) signature; the new
-- behavior is wholly internal. Body is rewritten end-to-end and
-- 20270663's party-bloc tally is folded into the combined loop.
--
-- Apply after 20270685.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ────────────────────────────────────────────────────
ALTER TABLE public.committee_proposals
    ADD COLUMN IF NOT EXISTS support_archetypes jsonb,
    ADD COLUMN IF NOT EXISTS oppose_archetypes  jsonb;

COMMENT ON COLUMN public.committee_proposals.support_archetypes IS
    'Author-declared list of archetype names whose parties are expected to support this bill. NULL or jsonb array of 0-2 unique names drawn from _archetype_catalog_names(). Drives mp_vote_on_report''s NPC archetype tally and the player MP cross-vote popularity penalty. Disjoint from oppose_archetypes. 20270686.';

COMMENT ON COLUMN public.committee_proposals.oppose_archetypes IS
    'Author-declared list of archetype names whose parties are expected to oppose. Same shape and disjointness rules as support_archetypes. 20270686.';

-- ── 2. Helpers ───────────────────────────────────────────────────
-- Canonical archetype catalog (10 entries) — mirrors the admin-form
-- NPC dropdown in 20270394. Updating this list is a coordinated
-- client+server change: politician-statutes.html's propose/amend
-- modals + the admin form select must match.
CREATE OR REPLACE FUNCTION public._archetype_catalog_names()
RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$
    SELECT ARRAY[
        'Reform',
        'Social Democratic',
        'Traditional Conservative',
        'Liberal',
        'Libertarian',
        'Communist / Leftist',
        'Green',
        'Nationalist',
        'Populist',
        'Centrist'
    ];
$$;

-- Returns 'report' if the given archetype matches any name in
-- p_support, 'table' if it matches any in p_oppose, NULL if neither
-- (party abstains). Support takes precedence on the impossible-by-
-- validation overlap case so behavior is defined.
CREATE OR REPLACE FUNCTION public._archetype_position(
    p_archetype text, p_support jsonb, p_oppose jsonb
)
RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_name text;
BEGIN
    IF p_archetype IS NULL THEN RETURN NULL; END IF;
    IF p_support IS NOT NULL AND jsonb_typeof(p_support) = 'array' THEN
        FOR v_name IN SELECT jsonb_array_elements_text(p_support) LOOP
            IF p_archetype = v_name THEN
                RETURN 'report';
            END IF;
        END LOOP;
    END IF;
    IF p_oppose IS NOT NULL AND jsonb_typeof(p_oppose) = 'array' THEN
        FOR v_name IN SELECT jsonb_array_elements_text(p_oppose) LOOP
            IF p_archetype = v_name THEN
                RETURN 'table';
            END IF;
        END LOOP;
    END IF;
    RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public._validate_archetype_array(p_arr jsonb)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_names text[];
BEGIN
    IF p_arr IS NULL THEN RETURN true; END IF;
    IF jsonb_typeof(p_arr) <> 'array' THEN RETURN false; END IF;
    IF jsonb_array_length(p_arr) > 2 THEN RETURN false; END IF;

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

CREATE OR REPLACE FUNCTION public._validate_archetype_pair(
    p_support jsonb, p_oppose jsonb
)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_sup text[];
    v_opp text[];
BEGIN
    IF NOT _validate_archetype_array(p_support) THEN RETURN false; END IF;
    IF NOT _validate_archetype_array(p_oppose)  THEN RETURN false; END IF;

    IF p_support IS NULL OR p_oppose IS NULL THEN RETURN true; END IF;

    SELECT array_agg(v) INTO v_sup FROM jsonb_array_elements_text(p_support) v;
    SELECT array_agg(v) INTO v_opp FROM jsonb_array_elements_text(p_oppose)  v;
    v_sup := COALESCE(v_sup, ARRAY[]::text[]);
    v_opp := COALESCE(v_opp, ARRAY[]::text[]);

    -- Disjointness — no archetype on both sides.
    IF v_sup && v_opp THEN RETURN false; END IF;

    RETURN true;
END $$;

-- ── 3. committee_propose_law — adds archetype params ─────────────
DROP FUNCTION IF EXISTS public.committee_propose_law(uuid, text, text, jsonb, uuid, jsonb);

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

    IF NOT _validate_persona_roles(p_persona_roles) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_persona_roles');
    END IF;
    IF NOT _validate_archetype_pair(p_support_archetypes, p_oppose_archetypes) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_archetype_positions');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

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

    RETURN jsonb_build_object(
        'success',           true,
        'proposal_id',       v_id,
        'committee_id',      v_comm.id,
        'committee_key',     v_comm.committee_key,
        'proposed_at_tick',  v_tick
    );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.committee_propose_law(uuid, text, text, jsonb, uuid, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_propose_law(uuid, text, text, jsonb, uuid, jsonb, jsonb, jsonb) TO authenticated;

-- ── 4. committee_propose_amendment — adds archetype params ───────
DROP FUNCTION IF EXISTS public.committee_propose_amendment(uuid, text, uuid, jsonb);

CREATE OR REPLACE FUNCTION public.committee_propose_amendment(
    p_amends_proposal_id uuid,
    p_amendment_text     text,
    p_faction_id         uuid,
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

    v_text := btrim(COALESCE(p_amendment_text, ''));
    IF length(v_text) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'empty_amendment');
    END IF;
    IF length(v_text) > 600 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'amendment_too_long',
            'have', length(v_text), 'cap', 600);
    END IF;

    SELECT * INTO v_comm FROM committees WHERE id = v_parent.committee_id;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'parent_committee_missing');
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
REVOKE EXECUTE ON FUNCTION public.committee_propose_amendment(uuid, text, uuid, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_propose_amendment(uuid, text, uuid, jsonb, jsonb, jsonb) TO authenticated;

-- ── 5. mp_vote_on_report — archetype-driven NPC + player penalty ──
-- Folds 20270663's party-bloc tally into a single per-party loop that
-- handles BOTH player-driven votes and NPC archetype-driven votes.
-- Adds the -1 popularity_pct penalty when a player MP votes against
-- their party's listed archetype position.
CREATE OR REPLACE FUNCTION public.mp_vote_on_report(
    p_faction_id  uuid,
    p_proposal_id uuid,
    p_vote        text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_pol              factions%ROWTYPE;
    v_prop             committee_proposals%ROWTYPE;
    v_vote             text := lower(btrim(COALESCE(p_vote, '')));
    v_tick             int;
    v_votable_seats    int := 0;
    v_report_count     int := 0;
    v_table_count      int := 0;
    v_threshold        int;
    v_resolved         text := NULL;
    v_party            RECORD;
    v_party_vote       text;
    v_party_seats      int;
    v_party_arch       text;
    v_player_party_id  uuid;
    v_player_arch      text;
    v_player_position  text;
    v_penalty_applied  bool := false;
    v_penalty_new_pop  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_proposal_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF v_vote NOT IN ('report', 'table') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_vote');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_prop FROM committee_proposals
     WHERE id = p_proposal_id
     FOR UPDATE;
    IF v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_found');
    END IF;
    IF v_prop.status <> 'awaiting_report_vote' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_in_report_vote',
            'status', v_prop.status);
    END IF;

    PERFORM 1 FROM committee_members
     WHERE committee_id          = v_prop.committee_id
       AND politician_faction_id = v_pol.id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_committee_member');
    END IF;

    -- Caller's seat must be party-affiliated; the bloc tally is keyed
    -- off party_id and a NULL seat would silently miscount.
    SELECT party_id INTO v_player_party_id FROM committee_members
     WHERE committee_id          = v_prop.committee_id
       AND politician_faction_id = v_pol.id;
    IF v_player_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'unaffiliated_seat');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    BEGIN
        INSERT INTO bill_report_votes
            (proposal_id, voter_faction_id, vote, voted_at_tick)
        VALUES
            (p_proposal_id, v_pol.id, v_vote, v_tick);
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_voted');
    END;

    -- ── Cross-vote popularity penalty ──────────────────────────────
    -- Player's party archetype on the Support list + 'table' vote, OR
    -- archetype on Oppose + 'report' vote → dock the party 1
    -- popularity_pct (floored at 0). No bonus for voting WITH the
    -- listed position — that's expected behavior.
    SELECT archetype INTO v_player_arch FROM factions WHERE id = v_player_party_id;
    v_player_position := _archetype_position(v_player_arch, v_prop.support_archetypes, v_prop.oppose_archetypes);
    IF (v_player_position = 'report' AND v_vote = 'table')
       OR (v_player_position = 'table'  AND v_vote = 'report') THEN
        UPDATE factions
           SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 1)
         WHERE id = v_player_party_id
        RETURNING popularity_pct INTO v_penalty_new_pop;
        v_penalty_applied := true;
    END IF;

    -- ── Combined party tally ──────────────────────────────────────
    -- One pass per distinct party on the committee. Resolution order
    -- for each party:
    --   1. If any player MP from this party has voted on this bill,
    --      use the FIRST player vote (stable by voted_at_tick,
    --      created_at). Same behavior as 20270663.
    --   2. Else, if the party's archetype matches the Support or
    --      Oppose list, vote that side automatically.
    --   3. Else abstain — party contributes nothing to tally or
    --      threshold denominator.
    FOR v_party IN
        SELECT DISTINCT party_id
          FROM committee_members
         WHERE committee_id = v_prop.committee_id
           AND party_id IS NOT NULL
    LOOP
        -- 1. Player driver
        SELECT brv.vote INTO v_party_vote
          FROM bill_report_votes brv
          JOIN committee_members cm
                 ON cm.politician_faction_id = brv.voter_faction_id
                AND cm.committee_id = v_prop.committee_id
                AND cm.party_id     = v_party.party_id
         WHERE brv.proposal_id = p_proposal_id
         ORDER BY brv.voted_at_tick ASC, brv.created_at ASC
         LIMIT 1;

        -- 2. Archetype fallback
        IF v_party_vote IS NULL THEN
            SELECT archetype INTO v_party_arch FROM factions WHERE id = v_party.party_id;
            v_party_vote := _archetype_position(v_party_arch, v_prop.support_archetypes, v_prop.oppose_archetypes);
        END IF;

        -- 3. Tally if landed on a side
        IF v_party_vote IS NOT NULL THEN
            SELECT COUNT(*) INTO v_party_seats
              FROM committee_members
             WHERE committee_id = v_prop.committee_id
               AND party_id     = v_party.party_id;

            IF v_party_vote = 'report' THEN
                v_report_count := v_report_count + v_party_seats;
            ELSE
                v_table_count := v_table_count + v_party_seats;
            END IF;
            v_votable_seats := v_votable_seats + v_party_seats;
        END IF;
    END LOOP;

    v_threshold := (v_votable_seats / 2) + 1;

    IF v_report_count >= v_threshold THEN
        UPDATE committee_proposals SET status = 'reported' WHERE id = p_proposal_id;
        v_resolved := 'reported';
    ELSIF v_table_count >= v_threshold THEN
        UPDATE committee_proposals SET status = 'tabled' WHERE id = p_proposal_id;
        v_resolved := 'tabled';
    END IF;

    RETURN jsonb_build_object(
        'success',           true,
        'proposal_id',       p_proposal_id,
        'vote',              v_vote,
        'report_count',      v_report_count,
        'table_count',       v_table_count,
        'votable_seats',     v_votable_seats,
        'threshold',         v_threshold,
        'resolved',          v_resolved,
        'penalty_applied',   v_penalty_applied,
        'penalty_new_pop',   v_penalty_new_pop,
        'player_position',   v_player_position
    );
END $$;

COMMENT ON FUNCTION public.mp_vote_on_report(uuid, uuid, text) IS
    'Committee Report-vs-Table vote (Phase A.1.6, 20270686 supersedes 20270663). Each party on the committee resolves to one side via: (a) first player vote from that party, or (b) party archetype matching the proposal''s support/oppose lists. Parties that match neither rule abstain. Player MP whose party archetype is on the opposite side from their vote pays -1 popularity_pct.';

NOTIFY pgrst, 'reload schema';

COMMIT;
