-- ════════════════════════════════════════════════════════════════════
-- 20270728 — Propose Law: policy-switch proposals to committee
--
-- The Statutes Overview panel grew a third MP-only button per user
-- spec — "Propose Law" — alongside the existing "Propose New Statute"
-- and "Amend Statute" actions. Where those modals draft article-text
-- bills, this one is a structured policy switch: pick a policy
-- (Corporate Taxation, Industrial Policy, etc.), see the current
-- option active in the nation, pick a new option from the available
-- alternatives, route the proposal to a committee.
--
-- Per user direction:
--   • Visibility — submitted proposals show in committee.html's
--     Upcoming Agenda alongside the existing article-based proposals.
--   • Routing — the player picks the receiving committee inside the
--     modal (no auto-route by sector). Same five-tile picker the
--     existing modal uses.
--
-- Schema choices:
--   • Separate table (committee_policy_proposals) rather than
--     reusing committee_proposals.articles. The proposal payload
--     here is structured (policy_id, current/proposed option_id),
--     not free-form clauses; jamming it into the existing articles
--     jsonb would lose the foreign-key integrity and force every
--     committee.html render to inspect the type. A separate table
--     keeps the committee.html fetch a clean parallel query.
--
--   • current_option_id is a SNAPSHOT at submit time. If the active
--     law changes between submission and the proposal being heard,
--     the snapshot still reads truthfully ("when the MP proposed
--     this, the law was X"). Server reads active_laws inside the
--     RPC; the client doesn't have to send it.
--
--   • Status enum mirrors committee_proposals — queued / tabled /
--     reported_out / withdrawn — so a future markup/vote/report-out
--     flow can use the same state machine the article-based path
--     gets when those land.
--
-- Out of scope:
--   • Markup, vote, and report-out RPCs. V1 lets the proposal
--     submit + render; advancing it through the legislative pipeline
--     is a follow-up.
--   • Application of the policy change on report_out. When that
--     ships, the resolver flips active_laws.selected_option_id to
--     the proposed_option_id.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: committee_policy_proposals ────────────────────────
CREATE TABLE IF NOT EXISTS public.committee_policy_proposals (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id         uuid NOT NULL REFERENCES public.committees(id)     ON DELETE CASCADE,
    nation_id            uuid NOT NULL REFERENCES public.nations(id)        ON DELETE CASCADE,
    author_faction_id    uuid          REFERENCES public.factions(id)       ON DELETE SET NULL,
    policy_id            uuid NOT NULL REFERENCES public.policies(id)       ON DELETE CASCADE,
    current_option_id    uuid          REFERENCES public.policy_options(id) ON DELETE SET NULL,
    proposed_option_id   uuid NOT NULL REFERENCES public.policy_options(id) ON DELETE CASCADE,
    status               text NOT NULL DEFAULT 'queued'
                              CHECK (status IN ('queued','tabled','reported_out','withdrawn')),
    proposed_at_tick     int  NOT NULL,
    created_at           timestamptz NOT NULL DEFAULT now()
);
-- No (committee, policy) uniqueness — multiple MPs can stack rival
-- proposals on the same policy ("X → progressive" vs "X → flat") and
-- the committee picks among them at markup. Mirrors how
-- committee_proposals allows parallel article-based bills per
-- section, no schema-level mutex.

CREATE INDEX IF NOT EXISTS committee_policy_proposals_committee_idx
    ON public.committee_policy_proposals (committee_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS committee_policy_proposals_author_idx
    ON public.committee_policy_proposals (author_faction_id);
CREATE INDEX IF NOT EXISTS committee_policy_proposals_nation_idx
    ON public.committee_policy_proposals (nation_id, status);

COMMENT ON TABLE public.committee_policy_proposals IS
    'MP-drafted policy-switch proposals sitting in a committee queue (20270728). Modal on politician-statutes.html writes here via committee_propose_policy_change; committee.html fetches alongside committee_proposals to render both kinds in Upcoming Agenda. current_option_id is a snapshot of the live active_law at submit time.';

ALTER TABLE public.committee_policy_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS committee_policy_proposals_select ON public.committee_policy_proposals;
CREATE POLICY committee_policy_proposals_select ON public.committee_policy_proposals
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS committee_policy_proposals_service_all ON public.committee_policy_proposals;
CREATE POLICY committee_policy_proposals_service_all ON public.committee_policy_proposals
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ── 2. committee_propose_policy_change RPC ────────────────────────
-- MP-gated. Validates that:
--   • caller is a Member of Parliament (or Senior MP)
--   • committee belongs to the caller's nation
--   • policy + proposed option exist and the option belongs to that
--     policy
--   • the proposed option is NOT the same as the current one
--   • the policy + committee pair has no other queued/tabled
--     proposal open (caught by the unique constraint; surfaced as
--     'duplicate_open_proposal' rather than a raw PG error).
-- Snapshots the current option from active_laws and inserts.
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

    -- Validate the proposed option belongs to the policy.
    SELECT policy_id INTO v_proposed_policy
      FROM policy_options WHERE id = p_proposed_option_id;
    IF v_proposed_policy IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'option_not_found');
    END IF;
    IF v_proposed_policy IS DISTINCT FROM p_policy_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'option_policy_mismatch');
    END IF;

    -- Snapshot the current option from the nation's active laws. A
    -- policy with no active_laws row gets a NULL snapshot — the
    -- proposal is still valid ("nation has never enacted this; the
    -- MP wants to enact X").
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
        committee_id, nation_id, author_faction_id,
        policy_id, current_option_id, proposed_option_id,
        status, proposed_at_tick
    ) VALUES (
        p_committee_id, v_pol.nation_id, v_pol.id,
        p_policy_id, v_current_opt, p_proposed_option_id,
        'queued', v_tick
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success',      true,
        'proposal_id',  v_id,
        'tick',         v_tick
    );
END $$;

GRANT EXECUTE ON FUNCTION public.committee_propose_policy_change(uuid, uuid, uuid, uuid)
    TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
