-- ════════════════════════════════════════════════════════════════════
-- 20270772 — Committee motion votes: unified Hearing / Vote / Amend / Table
--
-- Supersedes two earlier committee-vote mechanisms with ONE model:
--   • The Set-the-Agenda action vote (20270752 — hear/vote/amend,
--     first action to 3 of 5 wins instantly).
--   • The post-hearing Report vote (20270662 / 20270663 — report/table
--     party-bloc tally).
--
-- Per user direction, every committee now runs a single kind of vote.
-- A seated member MOVES one of four motions on the committee's active
-- proposal; that opens a 3-tick YES/NO ballot of the five members:
--
--   hearing → pull the proposal into hearing mode (once per proposal)
--   vote    → send the bill to the chamber floor
--   amend   → flag the bill for amendment (once per proposal)
--   table   → send the bill back to the agenda (un-sets it as active)
--
-- Ballot rules (user spec):
--   • Majority of the votes actually cast carries the motion.
--     5 members, all voting → 3-2. Abstaining is simply not voting,
--     which lowers the bar: 2 yes / 1 no / 2 abstain passes 2-1.
--   • The vote runs a fixed 3-tick window; it resolves at the deadline
--     (resolve_due_committee_motions), tallying whoever voted.
--   • The committee chair's vote breaks a tie. A tie with the chair
--     abstaining fails (no majority).
--   • The mover auto-casts YES (they're moving the motion). NPC members
--     auto-cast by archetype alignment with the bill: a bill's
--     supporters back advancing motions and oppose tabling; opponents
--     do the reverse; neutral seats split randomly.
--
-- Floor integration is auto-resolved for this pass (the full player-
-- voted floor page is a follow-up): a passed Vote motion sends the
-- bill to the floor where a party-bloc seat tally by archetype
-- (mirrors resolve_due_bills, 20270423) decides enacted vs failed.
-- Enacted bills already surface in the statute book (status='enacted').
--
-- KNOWN LIMITATION (documented, not a silent gap): a passed Amend
-- motion only FLAGS the bill — the clause-by-clause editing workspace
-- is a separate follow-up. The bill's articles are unchanged for now;
-- the motion is consumed so Amend can't be re-moved on the same bill.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Retire the superseded mechanisms ─────────────────────────────
-- Functions first (their bodies reference the tables we're dropping),
-- then the tables. committees.active_proposal_id / active_agenda_set_
-- at_tick and committee_members.last_set_agenda_tick are KEPT — the
-- motion flow reuses them.
DROP FUNCTION IF EXISTS public.committee_cast_agenda_vote(uuid, uuid, text);
DROP FUNCTION IF EXISTS public._committee_tally_and_carry(uuid, uuid, int);
DROP FUNCTION IF EXISTS public._committee_carry_out_agenda(uuid, uuid, text, int);
DROP FUNCTION IF EXISTS public.mp_vote_on_report(uuid, uuid, text);

DROP TABLE IF EXISTS public.committee_agenda_votes;
DROP TABLE IF EXISTS public.bill_report_votes;

-- Un-orphan bills parked in the old report-vote phase: with that panel
-- gone they'd be unreachable. Return them to the idle agenda state so
-- the committee can move motions on them again. (The active_proposal_id
-- slot, if set, is reused as-is by the new flow.)
UPDATE public.committee_proposals
   SET status = 'queued'
 WHERE status = 'awaiting_report_vote';

-- ── 2. Floor-tally cache columns on committee_proposals ─────────────
-- Written by the floor auto-resolve, read by the client to show the
-- result on a recently-decided bill. (status itself stays the one
-- source of truth for enacted/failed; these are the seat split.)
ALTER TABLE public.committee_proposals
    ADD COLUMN IF NOT EXISTS floor_yes_seats       int,
    ADD COLUMN IF NOT EXISTS floor_no_seats        int,
    ADD COLUMN IF NOT EXISTS floor_resolved_at_tick int;

-- ── 3. committee_motions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.committee_motions (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id         uuid NOT NULL REFERENCES public.committees(id)          ON DELETE CASCADE,
    proposal_id          uuid NOT NULL REFERENCES public.committee_proposals(id) ON DELETE CASCADE,
    motion               text NOT NULL CHECK (motion IN ('hearing', 'vote', 'amend', 'table')),
    status               text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'passed', 'failed')),
    opened_by_faction_id uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    opened_at_tick       int  NOT NULL,
    closes_at_tick       int  NOT NULL,
    yes_count            int,
    no_count             int,
    resolved_at_tick     int,
    created_at           timestamptz NOT NULL DEFAULT now()
);

-- At most one OPEN motion per committee at a time.
CREATE UNIQUE INDEX IF NOT EXISTS committee_motions_one_open
    ON public.committee_motions (committee_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS committee_motions_proposal_idx
    ON public.committee_motions (proposal_id);

COMMENT ON TABLE public.committee_motions IS
    'A motion (hearing/vote/amend/table) moved on a committee''s active proposal (20270772). Opens a 3-tick YES/NO ballot; resolve_due_committee_motions tallies at closes_at_tick. One open motion per committee (partial unique index).';

ALTER TABLE public.committee_motions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS committee_motions_select ON public.committee_motions;
CREATE POLICY committee_motions_select ON public.committee_motions
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS committee_motions_service_all ON public.committee_motions;
CREATE POLICY committee_motions_service_all ON public.committee_motions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 4. committee_motion_votes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.committee_motion_votes (
    motion_id        uuid NOT NULL REFERENCES public.committee_motions(id) ON DELETE CASCADE,
    member_id        uuid NOT NULL REFERENCES public.committee_members(id) ON DELETE CASCADE,
    voter_faction_id uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    vote             text NOT NULL CHECK (vote IN ('yes', 'no')),
    is_npc           boolean NOT NULL,
    voted_at_tick    int NOT NULL,
    PRIMARY KEY (motion_id, member_id)
);

COMMENT ON TABLE public.committee_motion_votes IS
    'One YES/NO vote per committee member per motion (20270772). Abstain = no row. NPC rows inserted at motion-open time; player rows via committee_cast_motion_vote.';

ALTER TABLE public.committee_motion_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS committee_motion_votes_select ON public.committee_motion_votes;
CREATE POLICY committee_motion_votes_select ON public.committee_motion_votes
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS committee_motion_votes_service_all ON public.committee_motion_votes;
CREATE POLICY committee_motion_votes_service_all ON public.committee_motion_votes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════
-- 5. _committee_resolve_floor — party-bloc seat tally → enacted/failed
-- ════════════════════════════════════════════════════════════════════
-- Auto-resolves the floor vote for THIS pass. Each party in the nation
-- backs the bill if its archetype is on the proposal's support list,
-- opposes if on the oppose list, abstains otherwise. Seats sum per
-- side; more yes than no seats enacts. (Mirrors resolve_due_bills,
-- 20270423 — when the full player-voted floor lands it replaces this.)
CREATE OR REPLACE FUNCTION public._committee_resolve_floor(
    p_proposal_id uuid,
    p_tick        int
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_prop      committee_proposals%ROWTYPE;
    v_party     RECORD;
    v_yes_seats int := 0;
    v_no_seats  int := 0;
    v_outcome   text;
BEGIN
    SELECT * INTO v_prop FROM committee_proposals WHERE id = p_proposal_id;
    IF v_prop.id IS NULL THEN
        RETURN NULL;
    END IF;

    FOR v_party IN
        SELECT f.archetype, COALESCE(f.seats, 0) AS seats
          FROM factions f
         WHERE f.faction_type = 'movement_party'
           AND f.nation_id    = v_prop.nation_id
           AND f.abandoned_at IS NULL
    LOOP
        IF v_party.archetype IS NULL OR v_party.seats = 0 THEN
            CONTINUE;
        END IF;
        IF v_party.archetype = ANY (COALESCE(v_prop.support_archetypes, ARRAY[]::text[])) THEN
            v_yes_seats := v_yes_seats + v_party.seats;
        ELSIF v_party.archetype = ANY (COALESCE(v_prop.oppose_archetypes, ARRAY[]::text[])) THEN
            v_no_seats := v_no_seats + v_party.seats;
        END IF;
    END LOOP;

    v_outcome := CASE WHEN v_yes_seats > v_no_seats THEN 'enacted' ELSE 'failed' END;

    UPDATE committee_proposals
       SET status                 = v_outcome,
           floor_yes_seats        = v_yes_seats,
           floor_no_seats         = v_no_seats,
           floor_resolved_at_tick = p_tick
     WHERE id = p_proposal_id;

    RETURN v_outcome;
END $$;

REVOKE EXECUTE ON FUNCTION public._committee_resolve_floor(uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public._committee_resolve_floor(uuid, int) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 6. _committee_carry_out_motion — dispatch a passed motion
-- ════════════════════════════════════════════════════════════════════
--   hearing → open a 3-tick hearing; bill STAYS the active item so the
--             committee can move further motions after it closes.
--   vote    → send to floor (auto-resolve), clear the active slot.
--   amend   → flag for amendment (status back to queued, active kept);
--             clause editor is a documented follow-up.
--   table   → bill returns to the agenda pool (active slot cleared).
CREATE OR REPLACE FUNCTION public._committee_carry_out_motion(
    p_committee_id uuid,
    p_proposal_id  uuid,
    p_motion       text,
    p_tick         int
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_comm    committees%ROWTYPE;
    v_prop    committee_proposals%ROWTYPE;
    v_hearing uuid;
BEGIN
    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id;
    SELECT * INTO v_prop FROM committee_proposals WHERE id = p_proposal_id;
    IF v_comm.id IS NULL OR v_prop.id IS NULL THEN
        RETURN;
    END IF;

    IF p_motion = 'hearing' THEN
        -- Defensive: don't double-open if a hearing is somehow live.
        IF NOT EXISTS (SELECT 1 FROM committee_hearings
                        WHERE committee_id = v_comm.id AND status = 'open') THEN
            INSERT INTO committee_hearings (
                committee_id, proposal_id, nation_id, opened_by_faction_id,
                opened_at_tick, closes_at_tick, status
            ) VALUES (
                v_comm.id, v_prop.id, v_comm.nation_id, NULL,
                p_tick, p_tick + 3, 'open'
            ) RETURNING id INTO v_hearing;
            UPDATE committee_proposals SET status = 'in_hearing' WHERE id = v_prop.id;
            PERFORM _seed_hearing_personas(v_hearing, v_prop.category, v_comm.nation_id);
        END IF;
        -- active_proposal_id intentionally kept.

    ELSIF p_motion = 'vote' THEN
        UPDATE committee_proposals SET status = 'on_floor' WHERE id = v_prop.id;
        UPDATE committees
           SET active_proposal_id = NULL, active_agenda_set_at_tick = NULL
         WHERE id = v_comm.id;
        PERFORM _committee_resolve_floor(v_prop.id, p_tick);

    ELSIF p_motion = 'amend' THEN
        -- Flag only (clause editor is a follow-up). Return the bill to
        -- the idle active state so the committee can move on.
        UPDATE committee_proposals SET status = 'queued' WHERE id = v_prop.id;
        -- active_proposal_id intentionally kept.

    ELSIF p_motion = 'table' THEN
        UPDATE committee_proposals SET status = 'queued' WHERE id = v_prop.id;
        UPDATE committees
           SET active_proposal_id = NULL, active_agenda_set_at_tick = NULL
         WHERE id = v_comm.id;
    END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public._committee_carry_out_motion(uuid, uuid, text, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public._committee_carry_out_motion(uuid, uuid, text, int) TO service_role;

-- ════════════════════════════════════════════════════════════════════
-- 7. committee_open_motion — a member moves a motion on the active bill
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.committee_open_motion(
    p_faction_id   uuid,
    p_committee_id uuid,
    p_motion       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_comm    committees%ROWTYPE;
    v_member  committee_members%ROWTYPE;
    v_prop    committee_proposals%ROWTYPE;
    v_motion  text := lower(btrim(COALESCE(p_motion, '')));
    v_tick    int;
    v_motion_id uuid;
    v_seat    committee_members%ROWTYPE;
    v_arch    text;
    v_stance  int;
    v_advance boolean;
    v_vote    text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_committee_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF v_motion NOT IN ('hearing', 'vote', 'amend', 'table') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_motion');
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

    SELECT * INTO v_member FROM committee_members
     WHERE committee_id = v_comm.id AND politician_faction_id = v_pol.id;
    IF v_member.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    IF v_comm.active_proposal_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_active_agenda');
    END IF;

    IF EXISTS (SELECT 1 FROM committee_motions
                WHERE committee_id = v_comm.id AND status = 'open') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'motion_already_open');
    END IF;

    IF EXISTS (SELECT 1 FROM committee_hearings
                WHERE committee_id = v_comm.id AND status = 'open') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_in_progress');
    END IF;

    SELECT * INTO v_prop FROM committee_proposals WHERE id = v_comm.active_proposal_id FOR UPDATE;
    IF v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_found');
    END IF;
    -- The active bill is idle (status 'queued') between motions. Any
    -- other status (in_hearing, on_floor, ...) means it isn't ready.
    IF v_prop.status <> 'queued' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_busy', 'status', v_prop.status);
    END IF;

    -- Once-per-bill guards for hearing / amend.
    IF v_motion = 'hearing' AND EXISTS (
        SELECT 1 FROM committee_motions
         WHERE proposal_id = v_prop.id AND motion = 'hearing' AND status = 'passed'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_already_held');
    END IF;
    IF v_motion = 'amend' AND EXISTS (
        SELECT 1 FROM committee_motions
         WHERE proposal_id = v_prop.id AND motion = 'amend' AND status = 'passed'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'amend_already_held');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    BEGIN
        INSERT INTO committee_motions (
            committee_id, proposal_id, motion, status,
            opened_by_faction_id, opened_at_tick, closes_at_tick
        ) VALUES (
            v_comm.id, v_prop.id, v_motion, 'open',
            v_pol.id, v_tick, v_tick + 3
        ) RETURNING id INTO v_motion_id;
    EXCEPTION WHEN unique_violation THEN
        -- Lost the race for the single open-motion slot.
        RETURN jsonb_build_object('success', false, 'reason', 'motion_already_open');
    END;

    -- The mover backs their own motion.
    INSERT INTO committee_motion_votes (motion_id, member_id, voter_faction_id, vote, is_npc, voted_at_tick)
    VALUES (v_motion_id, v_member.id, v_pol.id, 'yes', false, v_tick);

    -- NPC seats auto-cast by archetype alignment with the bill.
    -- Advancing motions (hearing/vote/amend): supporters yes, opponents
    -- no. Tabling: supporters no, opponents yes. Neutral splits 50/50.
    v_advance := (v_motion <> 'table');
    FOR v_seat IN
        SELECT * FROM committee_members
         WHERE committee_id = v_comm.id
           AND politician_faction_id IS NULL
           AND party_id IS NOT NULL   -- party-less seats abstain (no row)
    LOOP
        SELECT archetype INTO v_arch FROM factions WHERE id = v_seat.party_id;

        v_stance := 0;
        IF v_arch IS NOT NULL THEN
            IF v_arch = ANY (COALESCE(v_prop.support_archetypes, ARRAY[]::text[])) THEN
                v_stance := 1;
            ELSIF v_arch = ANY (COALESCE(v_prop.oppose_archetypes, ARRAY[]::text[])) THEN
                v_stance := -1;
            END IF;
        END IF;

        IF v_stance = 0 THEN
            v_vote := CASE WHEN random() < 0.5 THEN 'yes' ELSE 'no' END;
        ELSIF (v_stance > 0) = v_advance THEN
            v_vote := 'yes';
        ELSE
            v_vote := 'no';
        END IF;

        INSERT INTO committee_motion_votes (motion_id, member_id, voter_faction_id, vote, is_npc, voted_at_tick)
        VALUES (v_motion_id, v_seat.id, NULL, v_vote, true, v_tick)
        ON CONFLICT (motion_id, member_id) DO NOTHING;
    END LOOP;

    RETURN jsonb_build_object(
        'success',        true,
        'motion_id',      v_motion_id,
        'motion',         v_motion,
        'closes_at_tick', v_tick + 3
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.committee_open_motion(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_open_motion(uuid, uuid, text) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 8. committee_cast_motion_vote — a member votes YES/NO on the open motion
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.committee_cast_motion_vote(
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
    v_motion  committee_motions%ROWTYPE;
    v_vote    text := lower(btrim(COALESCE(p_vote, '')));
    v_tick    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_committee_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF v_vote NOT IN ('yes', 'no') THEN
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

    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_not_found');
    END IF;

    SELECT * INTO v_member FROM committee_members
     WHERE committee_id = v_comm.id AND politician_faction_id = v_pol.id;
    IF v_member.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT * INTO v_motion FROM committee_motions
     WHERE committee_id = v_comm.id AND status = 'open'
     FOR UPDATE;
    IF v_motion.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_open_motion');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_tick > v_motion.closes_at_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'voting_closed');
    END IF;

    BEGIN
        INSERT INTO committee_motion_votes (motion_id, member_id, voter_faction_id, vote, is_npc, voted_at_tick)
        VALUES (v_motion.id, v_member.id, v_pol.id, v_vote, false, v_tick);
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_voted');
    END;

    RETURN jsonb_build_object('success', true, 'motion_id', v_motion.id, 'vote', v_vote);
END $$;

REVOKE EXECUTE ON FUNCTION public.committee_cast_motion_vote(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_cast_motion_vote(uuid, uuid, text) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 9. resolve_due_committee_motions — tally + carry out at the deadline
-- ════════════════════════════════════════════════════════════════════
-- On-demand resolver (called fire-and-forget from politician-topbar.js
-- bootstrap, same pattern as resolve_due_bills / resolve_due_general_
-- elections). Majority of cast votes carries; chair breaks ties; a tie
-- with the chair not voting fails.
CREATE OR REPLACE FUNCTION public.resolve_due_committee_motions()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick     int;
    v_motion   committee_motions%ROWTYPE;
    v_yes      int;
    v_no       int;
    v_chair    text;
    v_passed   boolean;
    v_resolved int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_motion IN
        SELECT * FROM committee_motions
         WHERE status = 'open' AND closes_at_tick <= v_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        SELECT
            COUNT(*) FILTER (WHERE vote = 'yes'),
            COUNT(*) FILTER (WHERE vote = 'no')
          INTO v_yes, v_no
          FROM committee_motion_votes
         WHERE motion_id = v_motion.id;

        IF v_yes > v_no THEN
            v_passed := true;
        ELSIF v_no > v_yes THEN
            v_passed := false;
        ELSE
            -- Tie → chair breaks it. Chair abstaining → fails.
            SELECT mv.vote INTO v_chair
              FROM committee_motion_votes mv
              JOIN committee_members m ON m.id = mv.member_id
             WHERE mv.motion_id = v_motion.id AND m.role = 'chair';
            v_passed := (v_chair = 'yes');
        END IF;

        UPDATE committee_motions
           SET status           = CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
               yes_count        = v_yes,
               no_count         = v_no,
               resolved_at_tick = v_tick
         WHERE id = v_motion.id;

        IF v_passed THEN
            PERFORM _committee_carry_out_motion(
                v_motion.committee_id, v_motion.proposal_id, v_motion.motion, v_tick);
        END IF;

        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick, 'resolved', v_resolved);
END $$;

GRANT EXECUTE ON FUNCTION public.resolve_due_committee_motions() TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 10. Re-emit committee_set_agenda — promote-only (no auto action vote)
-- ════════════════════════════════════════════════════════════════════
-- 20270752 auto-cast NPC agenda votes and instantly carried out a
-- winner. That machinery is gone; Set the Agenda now only promotes a
-- queued proposal to the committee's active slot. Members then move
-- motions on it via committee_open_motion.
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
     WHERE committee_id = v_comm.id AND politician_faction_id = v_pol.id;
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

    IF EXISTS (SELECT 1 FROM committee_hearings
                WHERE committee_id = v_comm.id AND status = 'open') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_in_progress');
    END IF;

    SELECT * INTO v_prop FROM committee_proposals WHERE id = p_proposal_id;
    IF v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_found');
    END IF;
    IF v_prop.committee_id <> v_comm.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_committee');
    END IF;
    IF v_prop.status <> 'queued' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_queued', 'have', v_prop.status);
    END IF;

    UPDATE committees
       SET active_proposal_id = v_prop.id, active_agenda_set_at_tick = v_tick
     WHERE id = v_comm.id;
    UPDATE committee_members
       SET last_set_agenda_tick = v_tick
     WHERE id = v_member.id;

    RETURN jsonb_build_object('success', true, 'proposal_id', v_prop.id, 'set_at_tick', v_tick);
END $$;

REVOKE EXECUTE ON FUNCTION public.committee_set_agenda(uuid, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.committee_set_agenda(uuid, uuid, uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- 11. Re-emit close_committee_hearing — return the bill to its active slot
-- ════════════════════════════════════════════════════════════════════
-- 20270662 flipped a closed hearing's proposal to awaiting_report_vote
-- (the old report-vote phase). That phase is gone: the bill returns to
-- the idle active state ('queued', still the committee's active item)
-- so members can move the next motion (typically Vote or Table).
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

    -- 20270772 — bill goes back to the idle active state so the
    -- committee can move the next motion. (Was: awaiting_report_vote.)
    UPDATE committee_proposals
       SET status = 'queued'
     WHERE id = v_hearing.proposal_id
       AND status = 'in_hearing';

    RETURN jsonb_build_object('success', true, 'hearing_id', v_hearing.id, 'closed_at_tick', v_tick);
END $$;

GRANT EXECUTE ON FUNCTION public.close_committee_hearing(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
