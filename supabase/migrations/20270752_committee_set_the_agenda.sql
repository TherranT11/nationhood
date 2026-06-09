-- ════════════════════════════════════════════════════════════════════
-- 20270752 — Committee: Set the Agenda + 5-member action vote
--
-- Today the committee's Monthly Agenda is driven by the NPC-chair
-- tick processor (process_committee_npc_chair_agenda, 20270683) for
-- committees with NPC chairs, or by the chair-only Hold a Hearing
-- RPC (20270499/20270662) for player chairs. Either way, a rank-and-
-- file player member can't choose which proposal gets picked up,
-- and can only influence what happens to it after a hearing closes
-- (Report / Table via committee_report_vote, 20270662).
--
-- This migration adds:
--   • A "Set the Agenda" action any committee member can use once
--     per tick — promotes one queued proposal to ACTIVE.
--   • A 5-member vote on what to do with that active proposal:
--       hear   — open the standard 3-tick testimony window
--       vote   — skip testimony, move straight to the report vote
--       amend  — flag for amendment (NPCs cannot vote amend)
--     NPC members auto-cast at Set-the-Agenda time based on
--     archetype alignment with the proposal's support/oppose lists
--     (20270686): support → vote, oppose → hear, neutral → 50/50.
--   • Player members cast manually via committee_cast_agenda_vote.
--   • First action to hit 3 of 5 votes is carried out. If all 5
--     vote and no action reaches 3 (only 2-2-1 fits), the chair's
--     vote wins.
--
-- The NPC-chair tick processor (process_committee_npc_chair_agenda)
-- now skips any committee with an active_proposal_id set, so the
-- voting workflow doesn't race with auto-promotion.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ════════════════════════════════════════════════════════════════════
-- 1. Schema additions
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.committees
    ADD COLUMN IF NOT EXISTS active_proposal_id uuid
        REFERENCES public.committee_proposals(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS active_agenda_set_at_tick int;

COMMENT ON COLUMN public.committees.active_proposal_id IS
    'Proposal currently on the Monthly Agenda awaiting the 5-member action vote (20270752). Cleared when the vote resolves and the action is carried out.';

ALTER TABLE public.committee_members
    ADD COLUMN IF NOT EXISTS last_set_agenda_tick int;

COMMENT ON COLUMN public.committee_members.last_set_agenda_tick IS
    'Tick at which this member last used Set the Agenda (20270752). One use per tick per member, regardless of any other committee action they take.';

-- Add 'in_amendment' to the proposal status enum so an Amend-vote
-- win has somewhere to land. The proposal sits there until a future
-- amendment editor moves it on.
ALTER TABLE public.committee_proposals
    DROP CONSTRAINT IF EXISTS committee_proposals_status_check;
ALTER TABLE public.committee_proposals
    ADD CONSTRAINT committee_proposals_status_check
    CHECK (status IN (
        'queued',
        'in_hearing',
        'in_amendment',
        'awaiting_report_vote',
        'reported',
        'tabled',
        'on_floor',
        'enacted',
        'failed',
        'withdrawn'
    ));

-- Per-member, per-proposal vote on what to do with the active item.
CREATE TABLE IF NOT EXISTS public.committee_agenda_votes (
    committee_id     uuid NOT NULL REFERENCES public.committees(id)         ON DELETE CASCADE,
    proposal_id      uuid NOT NULL REFERENCES public.committee_proposals(id) ON DELETE CASCADE,
    member_id        uuid NOT NULL REFERENCES public.committee_members(id)   ON DELETE CASCADE,
    voter_faction_id uuid          REFERENCES public.factions(id)            ON DELETE SET NULL,
    vote             text NOT NULL CHECK (vote IN ('hear', 'vote', 'amend')),
    is_npc           boolean NOT NULL,
    voted_at_tick    int NOT NULL,
    PRIMARY KEY (committee_id, proposal_id, member_id)
);

CREATE INDEX IF NOT EXISTS committee_agenda_votes_committee_idx
    ON public.committee_agenda_votes (committee_id, proposal_id);

COMMENT ON TABLE public.committee_agenda_votes IS
    'Five-vote action ballot on a committee''s active agenda item (20270752). seat_idx maps via committee_members. NPC votes inserted at Set-the-Agenda time; player votes via committee_cast_agenda_vote.';

ALTER TABLE public.committee_agenda_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS committee_agenda_votes_select ON public.committee_agenda_votes;
CREATE POLICY committee_agenda_votes_select ON public.committee_agenda_votes
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS committee_agenda_votes_service_all ON public.committee_agenda_votes;
CREATE POLICY committee_agenda_votes_service_all ON public.committee_agenda_votes
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════════════════════
-- 2. _committee_carry_out_agenda — internal action dispatcher
-- ════════════════════════════════════════════════════════════════════
-- Wraps the three carry-out paths. Called by committee_cast_agenda
-- _vote when a tally hits a winner. Clears active_proposal_id on
-- the committee row regardless of which path fires.
--
--   hear  → mirror committee_hold_hearing (20270662) — insert a
--           committee_hearings row, flip proposal status, seed
--           personas. Bypasses the chair-only gate since the
--           5-member vote is the authorising body now.
--   vote  → skip the hearing; flip proposal to
--           awaiting_report_vote so the existing report-vote panel
--           (20270662) picks it up.
--   amend → flip proposal to in_amendment (new status). Sits there
--           until the amendment editor lands. Active_proposal_id
--           clears so the committee can Set the Agenda again.
CREATE OR REPLACE FUNCTION public._committee_carry_out_agenda(
    p_committee_id uuid,
    p_proposal_id  uuid,
    p_action       text,
    p_tick         int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_comm     committees%ROWTYPE;
    v_prop     committee_proposals%ROWTYPE;
    v_hearing  uuid;
    v_seeded   int;
BEGIN
    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id;
    SELECT * INTO v_prop FROM committee_proposals WHERE id = p_proposal_id;
    IF v_comm.id IS NULL OR v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_target');
    END IF;

    IF p_action = 'hear' THEN
        IF EXISTS (SELECT 1 FROM committee_hearings
                    WHERE committee_id = v_comm.id AND status = 'open') THEN
            -- Defensive: shouldn't happen because Set the Agenda
            -- requires no in-flight hearing, but if a race let one
            -- through, just clear the active slot rather than
            -- erroring out.
            UPDATE committees SET active_proposal_id = NULL,
                                   active_agenda_set_at_tick = NULL
             WHERE id = v_comm.id;
            RETURN jsonb_build_object('success', false, 'reason', 'hearing_already_open');
        END IF;
        INSERT INTO committee_hearings (
            committee_id, proposal_id, nation_id, opened_by_faction_id,
            opened_at_tick, closes_at_tick, status
        ) VALUES (
            v_comm.id, v_prop.id, v_comm.nation_id, NULL,
            p_tick, p_tick + 3, 'open'
        ) RETURNING id INTO v_hearing;
        UPDATE committee_proposals SET status = 'in_hearing' WHERE id = v_prop.id;
        v_seeded := _seed_hearing_personas(v_hearing, v_prop.category, v_comm.nation_id);
    ELSIF p_action = 'vote' THEN
        UPDATE committee_proposals SET status = 'awaiting_report_vote' WHERE id = v_prop.id;
    ELSIF p_action = 'amend' THEN
        UPDATE committee_proposals SET status = 'in_amendment' WHERE id = v_prop.id;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_action');
    END IF;

    UPDATE committees
       SET active_proposal_id        = NULL,
           active_agenda_set_at_tick = NULL
     WHERE id = v_comm.id;

    RETURN jsonb_build_object(
        'success', true,
        'action',  p_action,
        'hearing_id', v_hearing
    );
END $$;

REVOKE EXECUTE ON FUNCTION public._committee_carry_out_agenda(uuid, uuid, text, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public._committee_carry_out_agenda(uuid, uuid, text, int) TO service_role;


-- ════════════════════════════════════════════════════════════════════
-- 2b. _committee_tally_and_carry — internal tally + dispatch
-- ════════════════════════════════════════════════════════════════════
-- Counts current votes for (committee_id, proposal_id). If any of
-- hear/vote/amend has ≥3 votes, picks that winner. If all 5 members
-- have voted and no action has ≥3 (only 2-2-1 fits), the chair's
-- vote breaks. On a winner, calls _committee_carry_out_agenda which
-- fires the action AND clears active_proposal_id. Returns the winner
-- string or NULL when no winner yet.
--
-- Called from both committee_set_agenda (after NPC auto-cast — NPCs
-- can already hit 3 without the player) and committee_cast_agenda_vote
-- (after each player cast).
CREATE OR REPLACE FUNCTION public._committee_tally_and_carry(
    p_committee_id uuid,
    p_proposal_id  uuid,
    p_tick         int
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_total       int;
    v_hear        int;
    v_vote_count  int;
    v_amend       int;
    v_winner      text;
    v_chair_vote  text;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE vote = 'hear'),
        COUNT(*) FILTER (WHERE vote = 'vote'),
        COUNT(*) FILTER (WHERE vote = 'amend')
      INTO v_total, v_hear, v_vote_count, v_amend
      FROM committee_agenda_votes
     WHERE committee_id = p_committee_id
       AND proposal_id  = p_proposal_id;

    IF v_hear >= 3 THEN
        v_winner := 'hear';
    ELSIF v_vote_count >= 3 THEN
        v_winner := 'vote';
    ELSIF v_amend >= 3 THEN
        v_winner := 'amend';
    ELSIF v_total >= 5 THEN
        SELECT v.vote INTO v_chair_vote
          FROM committee_agenda_votes v
          JOIN committee_members m ON m.id = v.member_id
         WHERE v.committee_id = p_committee_id
           AND v.proposal_id  = p_proposal_id
           AND m.role         = 'chair';
        v_winner := COALESCE(v_chair_vote, 'hear');
    END IF;

    IF v_winner IS NULL THEN
        RETURN NULL;
    END IF;

    PERFORM _committee_carry_out_agenda(p_committee_id, p_proposal_id, v_winner, p_tick);
    RETURN v_winner;
END $$;

REVOKE EXECUTE ON FUNCTION public._committee_tally_and_carry(uuid, uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public._committee_tally_and_carry(uuid, uuid, int) TO service_role;


-- ════════════════════════════════════════════════════════════════════
-- 3. committee_set_agenda — picks a queued proposal as active
-- ════════════════════════════════════════════════════════════════════
-- Caller must be a seated committee member who hasn't used Set the
-- Agenda this tick. Validates the proposal belongs to this committee
-- and is in 'queued'. Sets active_proposal_id + auto-casts each NPC
-- member's vote based on archetype alignment with the proposal's
-- support/oppose lists. Player members' slots stay empty — they
-- cast via committee_cast_agenda_vote.
CREATE OR REPLACE FUNCTION public.committee_set_agenda(
    p_faction_id   uuid,
    p_committee_id uuid,
    p_proposal_id  uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_comm      committees%ROWTYPE;
    v_prop      committee_proposals%ROWTYPE;
    v_member    committee_members%ROWTYPE;
    v_tick      int;
    v_seat      committee_members%ROWTYPE;
    v_arch      text;
    v_vote      text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_committee_id IS NULL OR p_proposal_id IS NULL THEN
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

    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id FOR UPDATE;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_not_found');
    END IF;

    SELECT * INTO v_member FROM committee_members
     WHERE committee_id = v_comm.id
       AND politician_faction_id = v_pol.id;
    IF v_member.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_member.last_set_agenda_tick IS NOT NULL
       AND v_member.last_set_agenda_tick >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_used_this_tick',
            'next_tick', v_member.last_set_agenda_tick + 1);
    END IF;

    IF v_comm.active_proposal_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'agenda_already_active',
            'active_proposal_id', v_comm.active_proposal_id);
    END IF;

    SELECT * INTO v_prop FROM committee_proposals WHERE id = p_proposal_id;
    IF v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_found');
    END IF;
    IF v_prop.committee_id <> v_comm.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_committee');
    END IF;
    IF v_prop.status <> 'queued' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_queued',
            'have', v_prop.status);
    END IF;

    -- Defensive: no open hearing (would race with the hear-carry-out).
    IF EXISTS (SELECT 1 FROM committee_hearings
                WHERE committee_id = v_comm.id AND status = 'open') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_in_progress');
    END IF;

    UPDATE committees
       SET active_proposal_id        = v_prop.id,
           active_agenda_set_at_tick = v_tick
     WHERE id = v_comm.id;

    UPDATE committee_members
       SET last_set_agenda_tick = v_tick
     WHERE id = v_member.id;

    -- Auto-cast NPC member votes. Pull each NPC seat's archetype
    -- from their party_id → factions.archetype (parties are the
    -- archetype carriers on this surface, mirroring how the report
    -- vote tally uses party archetype too).
    FOR v_seat IN
        SELECT m.* FROM committee_members m
         WHERE m.committee_id = v_comm.id
           AND m.politician_faction_id IS NULL
    LOOP
        v_arch := NULL;
        IF v_seat.party_id IS NOT NULL THEN
            SELECT archetype INTO v_arch FROM factions WHERE id = v_seat.party_id;
        END IF;

        IF v_arch IS NOT NULL
           AND v_arch = ANY(COALESCE(v_prop.support_archetypes, ARRAY[]::text[])) THEN
            v_vote := 'vote';
        ELSIF v_arch IS NOT NULL
              AND v_arch = ANY(COALESCE(v_prop.oppose_archetypes, ARRAY[]::text[])) THEN
            v_vote := 'hear';
        ELSE
            v_vote := CASE WHEN random() < 0.5 THEN 'hear' ELSE 'vote' END;
        END IF;

        INSERT INTO committee_agenda_votes (
            committee_id, proposal_id, member_id, voter_faction_id,
            vote, is_npc, voted_at_tick
        ) VALUES (
            v_comm.id, v_prop.id, v_seat.id, NULL,
            v_vote, true, v_tick
        )
        ON CONFLICT (committee_id, proposal_id, member_id) DO NOTHING;
    END LOOP;

    -- NPCs alone can already hit a 3-vote majority (4 NPCs + 1 player
    -- committee: 3-1 or 4-0 NPC splits already resolve the vote).
    -- Tally now so the carry-out fires before the player even sees
    -- the agenda. _committee_tally_and_carry is a no-op when no
    -- action has 3 yet, so it's safe to call unconditionally.
    PERFORM public._committee_tally_and_carry(v_comm.id, v_prop.id, v_tick);

    RETURN jsonb_build_object(
        'success', true,
        'proposal_id', v_prop.id,
        'set_at_tick', v_tick
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.committee_set_agenda(uuid, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_set_agenda(uuid, uuid, uuid) TO authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 4. committee_cast_agenda_vote — player member casts hear/vote/amend
-- ════════════════════════════════════════════════════════════════════
-- Inserts the player's vote, then tallies. First action to ≥3 wins;
-- if all 5 members have voted and no action has ≥3, the chair's
-- vote breaks the tie. On a winner, calls _committee_carry_out_agenda
-- which fires the chosen path AND clears active_proposal_id.
CREATE OR REPLACE FUNCTION public.committee_cast_agenda_vote(
    p_faction_id   uuid,
    p_committee_id uuid,
    p_vote         text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_comm    committees%ROWTYPE;
    v_member  committee_members%ROWTYPE;
    v_tick    int;
    v_winner  text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_committee_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_vote NOT IN ('hear', 'vote', 'amend') THEN
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

    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id FOR UPDATE;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_not_found');
    END IF;
    IF v_comm.active_proposal_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_active_agenda');
    END IF;

    SELECT * INTO v_member FROM committee_members
     WHERE committee_id          = v_comm.id
       AND politician_faction_id = v_pol.id;
    IF v_member.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    IF EXISTS (
        SELECT 1 FROM committee_agenda_votes
         WHERE committee_id = v_comm.id
           AND proposal_id  = v_comm.active_proposal_id
           AND member_id    = v_member.id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_voted');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO committee_agenda_votes (
        committee_id, proposal_id, member_id, voter_faction_id,
        vote, is_npc, voted_at_tick
    ) VALUES (
        v_comm.id, v_comm.active_proposal_id, v_member.id, v_pol.id,
        p_vote, false, v_tick
    );

    v_winner := _committee_tally_and_carry(v_comm.id, v_comm.active_proposal_id, v_tick);

    RETURN jsonb_build_object(
        'success',  true,
        'vote',     p_vote,
        'resolved', v_winner IS NOT NULL,
        'action',   v_winner
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.committee_cast_agenda_vote(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_cast_agenda_vote(uuid, uuid, text) TO authenticated;


-- ════════════════════════════════════════════════════════════════════
-- 5. process_committee_npc_chair_agenda — skip when agenda is active
-- ════════════════════════════════════════════════════════════════════
-- 20270683 had this fire whenever a committee had no open hearing.
-- Now we additionally skip committees with active_proposal_id set,
-- so the 5-member vote isn't pre-empted by the tick processor
-- promoting some other queued proposal in the meantime.
CREATE OR REPLACE FUNCTION public.process_committee_npc_chair_agenda(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick      int;
    v_promoted  int := 0;
    v_committee record;
    v_prop      record;
    v_hearing   uuid;
BEGIN
    v_tick := COALESCE((SELECT current_tick FROM shard WHERE name = 'Alpha Shard'), p_tick, 0);

    FOR v_committee IN
        SELECT c.id AS committee_id, c.nation_id
          FROM committees c
         WHERE NOT _committee_chair_is_player(c.id)
           AND c.active_proposal_id IS NULL
           AND NOT EXISTS (
               SELECT 1 FROM committee_hearings h
                WHERE h.committee_id = c.id
                  AND h.status = 'open'
           )
    LOOP
        SELECT id, category INTO v_prop
          FROM committee_proposals
         WHERE committee_id = v_committee.committee_id
           AND status = 'queued'
         ORDER BY proposed_at_tick ASC, id ASC
         LIMIT 1;

        IF v_prop.id IS NOT NULL THEN
            INSERT INTO committee_hearings (
                committee_id, proposal_id, nation_id, opened_by_faction_id,
                opened_at_tick, closes_at_tick, status
            ) VALUES (
                v_committee.committee_id, v_prop.id, v_committee.nation_id, NULL,
                v_tick, v_tick + 3, 'open'
            ) RETURNING id INTO v_hearing;

            UPDATE committee_proposals
               SET status = 'in_hearing'
             WHERE id = v_prop.id;

            PERFORM _seed_hearing_personas(v_hearing, v_prop.category, v_committee.nation_id);

            v_promoted := v_promoted + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick, 'promoted', v_promoted);
END;
$$;
GRANT EXECUTE ON FUNCTION public.process_committee_npc_chair_agenda(int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
