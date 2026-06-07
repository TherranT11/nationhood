-- ════════════════════════════════════════════════════════════════════
-- 20270662 — Phase A.1: Committee report-vote mechanism
--
-- Current state: a queued bill goes into a hearing, the hearing
-- closes, the bill sits at status='queued' forever. There's no
-- mechanism for the committee to decide whether to report it to the
-- assembly floor or table it. Hearings are political theater that
-- doesn't gate anything.
--
-- This migration ships the missing core: after a hearing closes, the
-- committee enters a Report Vote phase. Each committee member votes
-- 'report' or 'table'. First side to a majority resolves the bill.
--
-- A.2 (drafting workspace with multi-policy bills) and A.3 (floor
-- integration — reported bills become assembly votes) follow as
-- separate commits. This commit makes both of those possible by
-- giving committees a real decision to make.
--
-- ── Shape ──────────────────────────────────────────────────────────
-- 1. Extend committee_proposals.status CHECK with the workflow
--    states the rest of Phase A needs:
--      queued                — fresh draft, waiting to be heard
--      in_hearing            — chair has opened a hearing on it
--      awaiting_report_vote  — hearing closed; committee deciding
--      reported              — committee voted to send to floor
--      tabled                — committee voted to kill it
--      on_floor              — A.3 — assembly is voting on it
--      enacted               — A.3 — passed the floor vote
--      failed                — A.3 — failed the floor vote
--      withdrawn             — sponsor pulled it (pre-hearing)
--    Existing rows stay queryable: 'queued' / 'tabled' / 'withdrawn'
--    are preserved; the old 'reported_out' value (never written by
--    any live RPC) is dropped — confirmed zero rows by spot-check.
--
-- 2. New nullable bill_name column on committee_proposals — the
--    name a Reported bill will display as on the assembly floor.
--    A.2's drafting workspace fills it; existing committee_propose_
--    law calls leave it NULL (legacy bills inherit `section` as
--    their display name in the client until A.2 ships).
--
-- 3. New bill_report_votes table: (proposal_id, voter_faction_id,
--    vote) with UNIQUE(proposal_id, voter_faction_id) — one vote
--    per member per bill.
--
-- 4. Re-emit committee_hold_hearing and close_committee_hearing
--    with two changes:
--      • They now take p_faction_id (multi-politician fix from
--        20270643 / 20270658 / 20270661 — committees_* were on the
--        broader-sweep flag list).
--      • They write status transitions on committee_proposals:
--        hold_hearing flips queued → in_hearing; close flips
--        in_hearing → awaiting_report_vote.
--      • Old (uuid) / (uuid, uuid) signatures DROP'd so stale
--        callers fail loud.
--
-- 5. New mp_vote_on_report(p_faction_id, p_proposal_id, p_vote)
--    RPC. Committee-member-only gate. Records the vote and
--    auto-resolves: as soon as one side crosses
--    ⌊total_members / 2⌋ + 1, the proposal flips to 'reported'
--    or 'tabled'.
--
-- Client edits land in lockstep on committee.html — see the
-- companion JS diff. Phase A.2 and A.3 are explicit follow-ups,
-- flagged below.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Extend status CHECK + add bill_name ────────────────────────
-- Defensive backfill BEFORE the CHECK swap: rename any legacy
-- 'reported_out' rows to 'reported'. The original 20270498 CHECK
-- included 'reported_out' but no live RPC has ever written it;
-- still, ADD CONSTRAINT … CHECK validates existing rows by default,
-- so if a row with that status existed (set manually or by a removed
-- code path), the migration would otherwise fail mid-flight. Idempotent
-- — re-running this is a no-op once nothing matches.
UPDATE public.committee_proposals
   SET status = 'reported'
 WHERE status = 'reported_out';

ALTER TABLE public.committee_proposals
    DROP CONSTRAINT IF EXISTS committee_proposals_status_check;
ALTER TABLE public.committee_proposals
    ADD CONSTRAINT committee_proposals_status_check
    CHECK (status IN (
        'queued',
        'in_hearing',
        'awaiting_report_vote',
        'reported',
        'tabled',
        'on_floor',
        'enacted',
        'failed',
        'withdrawn'
    ));

ALTER TABLE public.committee_proposals
    ADD COLUMN IF NOT EXISTS bill_name text;

COMMENT ON COLUMN public.committee_proposals.bill_name IS
    'Display name of the bill on the assembly floor (Phase A.2). NULL for legacy free-text bills written via committee_propose_law before A.2 — clients fall back to `section` for display. Multi-policy drafted bills (A.2) populate this.';

-- ── 2. bill_report_votes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bill_report_votes (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id      uuid NOT NULL REFERENCES public.committee_proposals(id) ON DELETE CASCADE,
    voter_faction_id uuid NOT NULL REFERENCES public.factions(id)            ON DELETE CASCADE,
    vote             text NOT NULL CHECK (vote IN ('report', 'table')),
    voted_at_tick    int  NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (proposal_id, voter_faction_id)
);

CREATE INDEX IF NOT EXISTS bill_report_votes_proposal_idx
    ON public.bill_report_votes (proposal_id);

COMMENT ON TABLE public.bill_report_votes IS
    'Committee-member votes during the Report Vote phase (Phase A.1, 20270662). One row per (proposal, voter). Vote is irrevocable — first majority wins.';

ALTER TABLE public.bill_report_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bill_report_votes_select ON public.bill_report_votes;
CREATE POLICY bill_report_votes_select ON public.bill_report_votes
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS bill_report_votes_service_all ON public.bill_report_votes;
CREATE POLICY bill_report_votes_service_all ON public.bill_report_votes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 3. Re-emit committee_hold_hearing(p_committee_id, p_proposal_id, p_faction_id)
--      — multi-politician fix + status transition queued → in_hearing.
DROP FUNCTION IF EXISTS public.committee_hold_hearing(uuid, uuid);

CREATE OR REPLACE FUNCTION public.committee_hold_hearing(
    p_committee_id uuid,
    p_proposal_id  uuid,
    p_faction_id   uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_comm      committees%ROWTYPE;
    v_prop      committee_proposals%ROWTYPE;
    v_tick      int;
    v_hearing   uuid;
    v_seeded    int;
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

    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_not_found');
    END IF;

    PERFORM 1 FROM committee_members
     WHERE committee_id          = v_comm.id
       AND politician_faction_id = v_pol.id
       AND role                  = 'chair';
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_chair');
    END IF;

    SELECT * INTO v_prop FROM committee_proposals WHERE id = p_proposal_id;
    IF v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_found');
    END IF;
    IF v_prop.committee_id <> v_comm.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_committee');
    END IF;
    IF v_prop.status NOT IN ('queued') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_proposal_status');
    END IF;

    PERFORM 1 FROM committee_hearings
     WHERE committee_id = v_comm.id AND status = 'open' LIMIT 1;
    IF FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_already_open');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO committee_hearings (
        committee_id, proposal_id, nation_id, opened_by_faction_id,
        opened_at_tick, closes_at_tick, status
    ) VALUES (
        v_comm.id, v_prop.id, v_comm.nation_id, v_pol.id,
        v_tick, v_tick + 3, 'open'
    ) RETURNING id INTO v_hearing;

    -- 20270662 — flip the proposal into in_hearing so the UI can
    -- track the workflow phase off committee_proposals.status alone.
    UPDATE committee_proposals
       SET status = 'in_hearing'
     WHERE id = v_prop.id;

    v_seeded := _seed_hearing_personas(v_hearing, v_prop.category, v_comm.nation_id);

    RETURN jsonb_build_object(
        'success',       true,
        'hearing_id',    v_hearing,
        'closes_at_tick', v_tick + 3,
        'personas',      v_seeded
    );
END $$;

GRANT EXECUTE ON FUNCTION public.committee_hold_hearing(uuid, uuid, uuid) TO authenticated;

-- ── 4. Re-emit close_committee_hearing(p_hearing_id, p_faction_id)
--      — multi-politician fix + status transition in_hearing →
--      awaiting_report_vote.
DROP FUNCTION IF EXISTS public.close_committee_hearing(uuid);

CREATE OR REPLACE FUNCTION public.close_committee_hearing(
    p_hearing_id uuid,
    p_faction_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_hearing committee_hearings%ROWTYPE;
    v_tick    int;
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

    SELECT * INTO v_hearing FROM committee_hearings WHERE id = p_hearing_id;
    IF v_hearing.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_not_found');
    END IF;

    PERFORM 1 FROM committee_members
     WHERE committee_id          = v_hearing.committee_id
       AND politician_faction_id = v_pol.id
       AND role                  = 'chair';
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_chair');
    END IF;

    IF v_hearing.status = 'closed' THEN
        RETURN jsonb_build_object('success', true, 'hearing_id', v_hearing.id, 'already_closed', true);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE committee_hearings
       SET status = 'closed', closed_at_tick = v_tick
     WHERE id = v_hearing.id;

    -- 20270662 — flip the proposal into awaiting_report_vote so the
    -- committee can now cast Report / Table votes via mp_vote_on_report.
    UPDATE committee_proposals
       SET status = 'awaiting_report_vote'
     WHERE id = v_hearing.proposal_id
       AND status = 'in_hearing';

    RETURN jsonb_build_object('success', true, 'hearing_id', v_hearing.id, 'closed_at_tick', v_tick);
END $$;

GRANT EXECUTE ON FUNCTION public.close_committee_hearing(uuid, uuid) TO authenticated;

-- ── 5. mp_vote_on_report — committee-member Report vs Table vote.
--      First side to ⌊members/2⌋ + 1 wins; the proposal flips to
--      'reported' or 'tabled' immediately. UNIQUE(proposal,voter)
--      blocks re-votes.
CREATE OR REPLACE FUNCTION public.mp_vote_on_report(
    p_faction_id  uuid,
    p_proposal_id uuid,
    p_vote        text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_prop         committee_proposals%ROWTYPE;
    v_vote         text := lower(btrim(COALESCE(p_vote, '')));
    v_tick         int;
    v_member_count int;
    v_report_count int;
    v_table_count  int;
    v_threshold    int;
    v_resolved     text := NULL;
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

    -- Tally. Vote is irrevocable; first side to crossing the
    -- majority threshold resolves the bill. Threshold counts ONLY
    -- seated politicians — NPC seats (politician_faction_id IS NULL)
    -- can't vote, so including them in the denominator could make
    -- bills unresolvable if NPCs hold a plurality of seats.
    SELECT COUNT(*) INTO v_member_count
      FROM committee_members
     WHERE committee_id = v_prop.committee_id
       AND politician_faction_id IS NOT NULL;
    v_threshold := (v_member_count / 2) + 1;

    SELECT
        COUNT(*) FILTER (WHERE vote = 'report'),
        COUNT(*) FILTER (WHERE vote = 'table')
      INTO v_report_count, v_table_count
      FROM bill_report_votes
     WHERE proposal_id = p_proposal_id;

    IF v_report_count >= v_threshold THEN
        UPDATE committee_proposals SET status = 'reported' WHERE id = p_proposal_id;
        v_resolved := 'reported';
    ELSIF v_table_count >= v_threshold THEN
        UPDATE committee_proposals SET status = 'tabled' WHERE id = p_proposal_id;
        v_resolved := 'tabled';
    END IF;

    RETURN jsonb_build_object(
        'success',       true,
        'proposal_id',   p_proposal_id,
        'vote',          v_vote,
        'report_count',  v_report_count,
        'table_count',   v_table_count,
        'member_count',  v_member_count,
        'threshold',     v_threshold,
        'resolved',      v_resolved
    );
END $$;

GRANT EXECUTE ON FUNCTION public.mp_vote_on_report(uuid, uuid, text) TO authenticated;

COMMENT ON FUNCTION public.mp_vote_on_report(uuid, uuid, text) IS
    'Committee-member Report-vs-Table vote during the awaiting_report_vote phase (Phase A.1, 20270662). One vote per (proposal, member) — irrevocable. First side to ⌊members/2⌋ + 1 resolves the bill: ''reported'' → goes to floor (A.3 wiring); ''tabled'' → dies in committee.';

NOTIFY pgrst, 'reload schema';

COMMIT;
