-- ════════════════════════════════════════════════════════════════════
-- 20270640 — committee_propose_amendment
--
-- New MP action: pick an existing enacted law, write a free-text
-- amendment, send it to the committee that originally enacted it.
-- The amendment lands in the same committee_proposals table as a
-- new law, so the committee's existing queue + hearing + reporting-
-- out workflow picks it up unchanged.
--
-- Two new columns on committee_proposals:
--   proposal_type        text NOT NULL DEFAULT 'new_law'
--     'new_law'   — original committee_propose_law (20270500) shape.
--     'amendment' — written by this RPC; amends_proposal_id is set.
--   amends_proposal_id   uuid REFERENCES committee_proposals(id)
--     NULL for new_law rows; required for amendment rows (CHECK).
--
-- Committee is INHERITED from the parent law — the user spec is
-- "select a statute, write the amendment, send to committee" with
-- no committee picker. The Foreign Affairs committee that enacted
-- the parent gets the amendment to consider.
--
-- Category and section are also inherited (so a Civil Code section
-- amendment goes back to Civil Code) — the new row's section reads
-- "Amendment: <parent section>" so the agenda list distinguishes
-- it from the original at a glance.
--
-- Dispatches mirror committee_propose_law's: one politician_career_
-- events row (event_type='proposed_amendment') and one event_log
-- row (trigger_key='politician_proposed_amendment'). Sentence shape
-- matches the propose_law template so the client-side
-- CAREER_EVENT_TEMPLATES map can render both consistently.
--
-- Apply after 20270639.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema additions ──────────────────────────────────────────
ALTER TABLE public.committee_proposals
    ADD COLUMN IF NOT EXISTS proposal_type      text NOT NULL DEFAULT 'new_law',
    ADD COLUMN IF NOT EXISTS amends_proposal_id uuid REFERENCES public.committee_proposals(id);

-- proposal_type values + the FK consistency invariant in one CHECK.
ALTER TABLE public.committee_proposals
    DROP CONSTRAINT IF EXISTS committee_proposals_proposal_type_chk;
ALTER TABLE public.committee_proposals
    ADD CONSTRAINT committee_proposals_proposal_type_chk
    CHECK (
        proposal_type IN ('new_law', 'amendment')
        AND (proposal_type = 'new_law' OR amends_proposal_id IS NOT NULL)
    );

COMMENT ON COLUMN public.committee_proposals.proposal_type IS
    '''new_law'' (default, written by committee_propose_law 20270500) or ''amendment'' (written by committee_propose_amendment 20270640, with amends_proposal_id pointing at the enacted parent). CHECK enforces that amendments carry a parent FK.';

COMMENT ON COLUMN public.committee_proposals.amends_proposal_id IS
    'FK to the enacted committee_proposals row this amendment changes. NULL for new_law rows. Committee, category, and section are inherited from the parent at insert time so the agenda flow doesn''t need to special-case amendments.';

REVOKE UPDATE (proposal_type, amends_proposal_id) ON public.committee_proposals
    FROM PUBLIC, anon, authenticated;

-- ── 2. committee_propose_amendment ───────────────────────────────
CREATE OR REPLACE FUNCTION public.committee_propose_amendment(
    p_amends_proposal_id uuid,
    p_amendment_text     text
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

GRANT EXECUTE ON FUNCTION public.committee_propose_amendment(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
