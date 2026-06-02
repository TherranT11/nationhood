-- ════════════════════════════════════════════════════════════════════
-- Committee proposals — Propose New Law flow
--
-- When an MP (or Senior MP) drafts a bill on politician-statutes.html
-- and submits, the row lands here. The receiving committee's
-- Upcoming Agenda renders queued rows; future migrations will add
-- the markup / table / report-out flows that move a proposal through
-- 'queued' → 'tabled' → 'reported_out' (becomes a real bill at that
-- point), or 'withdrawn' if the author pulls it.
--
-- Schema choices:
--   category    — one of civil / criminal / commercial / electoral.
--                 Matches the four codes that take legislative
--                 amendments; Constitutional Charter changes go
--                 through a separate (future) supermajority path
--                 so they're not in the category enum.
--   section     — free text, up to 80 chars. Existing-section
--                 suggestions on the modal are convenience only;
--                 the column doesn't enforce a vocabulary.
--   articles    — jsonb array of objects { ordinal, tag, text }.
--                 ordinal is 1-based, tag is the type label the
--                 modal shows (operative / remedy / administration /
--                 definition / exception). Stored as jsonb so the
--                 article list can grow / shrink without schema
--                 changes; validated client-side and again in the
--                 RPC for shape + length.
--
-- author_faction_id is FK to factions.id — the politician who
-- drafted it. The committee renders "Proposed by …" off the author
-- row's leader name. SET NULL on delete keeps the proposal visible
-- in the historical record even if the author faction is abandoned
-- later.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS committee_proposals (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id         uuid NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    nation_id            uuid NOT NULL REFERENCES nations(id)    ON DELETE CASCADE,
    author_faction_id    uuid          REFERENCES factions(id)   ON DELETE SET NULL,
    category             text NOT NULL CHECK (category IN ('civil','criminal','commercial','electoral')),
    section              text NOT NULL CHECK (length(btrim(section)) BETWEEN 1 AND 80),
    articles             jsonb NOT NULL,
    status               text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','tabled','reported_out','withdrawn')),
    proposed_at_tick     int  NOT NULL,
    created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS committee_proposals_committee_idx
    ON committee_proposals (committee_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS committee_proposals_author_idx
    ON committee_proposals (author_faction_id);

COMMENT ON TABLE committee_proposals IS
    'MP-drafted bills sitting in a committee queue. Modal at politician-statutes.html writes here via committee_propose_law; committee.html''s Upcoming Agenda reads back rows where status=queued.';

ALTER TABLE committee_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS committee_proposals_select ON committee_proposals;
CREATE POLICY committee_proposals_select ON committee_proposals
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS committee_proposals_service_all ON committee_proposals;
CREATE POLICY committee_proposals_service_all ON committee_proposals
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── committee_propose_law RPC ────────────────────────────────────────
-- MP-gated. Validates input shape + length. Inserts a queued row
-- bound to (committee, nation, author). Server is authoritative on
-- proposed_at_tick — clients can't backdate.
CREATE OR REPLACE FUNCTION public.committee_propose_law(
    p_committee_id uuid,
    p_category     text,
    p_section      text,
    p_articles     jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_pol        factions%ROWTYPE;
    v_comm       committees%ROWTYPE;
    v_tick       int;
    v_section    text;
    v_category   text;
    v_articles   jsonb;
    v_total_len  int := 0;
    v_n_articles int;
    v_art        jsonb;
    v_text       text;
    v_id         uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
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
    IF v_comm.nation_id <> v_pol.nation_id THEN
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

    -- Validate each article shape + sum total text length.
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
    -- tag values to 'operative' so the column shape is predictable.
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

    RETURN jsonb_build_object(
        'success',           true,
        'proposal_id',       v_id,
        'committee_id',      v_comm.id,
        'committee_key',     v_comm.committee_key,
        'proposed_at_tick',  v_tick
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.committee_propose_law(uuid, text, text, jsonb) TO authenticated;

COMMENT ON FUNCTION public.committee_propose_law(uuid, text, text, jsonb) IS
    'MP-gated insert into committee_proposals. Validates: politician_office IN (member_of_parliament, senior_mp), committee belongs to politician''s nation, category IN civil/criminal/commercial/electoral, section 1-80 chars, articles 1-10 items with non-empty text and total length <=600 chars. Tags normalised to operative/remedy/administration/definition/exception (anything else falls back to operative).';

NOTIFY pgrst, 'reload schema';

COMMIT;
