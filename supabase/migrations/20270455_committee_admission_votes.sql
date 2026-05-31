-- ════════════════════════════════════════════════════════════════════
-- Committee admission votes — chamber-wide vote on a Member of
-- Parliament joining a standing committee
--
-- ── Flow ────────────────────────────────────────────────────────────
-- Player MP clicks Apply for Committee → apply_for_committee creates
-- a committee_admission_votes row with status='active', a snapshot of
-- party-line tallies (applicant's party = all YES seats, other
-- parties = all NO seats), and a resolve_at_tick = now + 3.
--
-- The Voting panel on politician-nation.html renders the live row.
-- On any page load, resolve_due_admission_votes is called lazily;
-- votes whose resolve_at_tick has passed transition to passed/failed:
--   YES seats / (YES + NO) >= 51% → passed
--     → the applicant takes the highest-slot 'member' role on the
--       committee, displacing the NPC there
--   otherwise → failed
--
-- ── Why party-line / deterministic for v1 ───────────────────────────
-- Per the design spec: applicant's party votes YES on the applicant
-- (real rule: YES on the highest-Reputation applicant from the party,
-- which collapses to the applicant herself in a single-applicant
-- cycle); every other party votes NO. There is no individual MP
-- defection model yet. The snapshot at apply time captures the seat
-- distribution; later seat changes don't affect the resolution.
--
-- ── Caps ────────────────────────────────────────────────────────────
-- An MP can be a member of at most 2 committees. apply_for_committee
-- rejects applications that would exceed this cap.
--
-- ── Why lazy resolution ─────────────────────────────────────────────
-- Same pattern as politician_resolve_due_elections (20270418): vote
-- resolution runs when a player visits a page that surfaces the
-- vote. No scheduled job, no background processor. Deterministic
-- outcome computed from the row's snapshot.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS committee_admission_votes (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id          uuid NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    nation_id             uuid NOT NULL REFERENCES nations(id)    ON DELETE CASCADE,
    applicant_faction_id  uuid NOT NULL REFERENCES factions(id)   ON DELETE CASCADE,
    applicant_party_id    uuid REFERENCES factions(id) ON DELETE SET NULL,
    started_at_tick       int NOT NULL,
    resolve_at_tick       int NOT NULL,
    status                text NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','passed','failed')),
    resolved_at_tick      int,
    yes_seats             int NOT NULL,
    no_seats              int NOT NULL,
    chamber_size          int NOT NULL,
    threshold_pct         int NOT NULL DEFAULT 51,
    created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cav_nation_status_idx ON committee_admission_votes(nation_id, status);
CREATE INDEX IF NOT EXISTS cav_resolve_idx       ON committee_admission_votes(status, resolve_at_tick);
CREATE INDEX IF NOT EXISTS cav_applicant_idx     ON committee_admission_votes(applicant_faction_id);

COMMENT ON TABLE committee_admission_votes IS
    'Chamber-wide vote on an MP joining a committee. Party-line snapshot at apply time (applicant party YES, others NO); resolves 3 ticks later; passed result seats the applicant in the highest-slot ''member'' role of the committee, displacing the NPC. Failed result is terminal — the applicant can re-apply.';

-- ── 2. RLS ──────────────────────────────────────────────────────────
ALTER TABLE committee_admission_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cav_select ON committee_admission_votes;
CREATE POLICY cav_select ON committee_admission_votes
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS cav_service_all ON committee_admission_votes;
CREATE POLICY cav_service_all ON committee_admission_votes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 3. apply_for_committee — create the vote ────────────────────────
CREATE OR REPLACE FUNCTION public.apply_for_committee(p_committee_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_pol             factions%ROWTYPE;
    v_comm            committees%ROWTYPE;
    v_tick            int;
    v_member_count    int;
    v_open_member     int;
    v_yes             int := 0;
    v_no              int := 0;
    v_chamber         int := 0;
    v_vote_id         uuid;
    v_resolve_at      int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_committee_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    IF v_pol.politician_office IS DISTINCT FROM 'member_of_parliament' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_mp');
    END IF;

    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_not_found');
    END IF;

    IF v_comm.nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_nation');
    END IF;

    -- Cap: already on this committee?
    IF EXISTS (
        SELECT 1 FROM committee_members
         WHERE committee_id = p_committee_id
           AND politician_faction_id = v_pol.id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_member');
    END IF;

    -- Cap: 2 committees max
    SELECT COUNT(*) INTO v_member_count
      FROM committee_members
     WHERE politician_faction_id = v_pol.id;
    IF v_member_count >= 2 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_cap', 'cap', 2);
    END IF;

    -- Cap: existing active vote for this applicant + committee
    IF EXISTS (
        SELECT 1 FROM committee_admission_votes
         WHERE committee_id = p_committee_id
           AND applicant_faction_id = v_pol.id
           AND status = 'active'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'vote_pending');
    END IF;

    -- Seat availability: at least one 'member' slot must be NPC-held.
    -- Up-front check avoids spawning votes that can't possibly seat.
    SELECT MAX(slot_idx) INTO v_open_member
      FROM committee_members
     WHERE committee_id = p_committee_id
       AND role = 'member'
       AND politician_faction_id IS NULL;
    IF v_open_member IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_open_seat');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Party-line tally snapshot. SUM over movement_party rows in the
    -- applicant's nation; split by whether the party is the
    -- applicant's. chamber_size = sum of all seats.
    SELECT
        COALESCE(SUM(CASE WHEN id = v_pol.politician_party_id THEN COALESCE(seats, 0) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN id <> v_pol.politician_party_id THEN COALESCE(seats, 0) ELSE 0 END), 0),
        COALESCE(SUM(COALESCE(seats, 0)), 0)
      INTO v_yes, v_no, v_chamber
      FROM factions
     WHERE nation_id = v_pol.nation_id
       AND faction_type = 'movement_party'
       AND abandoned_at IS NULL;

    v_resolve_at := v_tick + 3;

    INSERT INTO committee_admission_votes (
        committee_id, nation_id, applicant_faction_id, applicant_party_id,
        started_at_tick, resolve_at_tick, yes_seats, no_seats, chamber_size
    ) VALUES (
        p_committee_id, v_pol.nation_id, v_pol.id, v_pol.politician_party_id,
        v_tick, v_resolve_at, v_yes, v_no, v_chamber
    ) RETURNING id INTO v_vote_id;

    RETURN jsonb_build_object(
        'success',          true,
        'vote_id',          v_vote_id,
        'committee_id',     p_committee_id,
        'resolve_at_tick',  v_resolve_at,
        'yes_seats',        v_yes,
        'no_seats',         v_no,
        'chamber_size',     v_chamber
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_for_committee(uuid) TO authenticated;

COMMENT ON FUNCTION public.apply_for_committee(uuid) IS
    'MP applies to join a committee. Validates MP-only, same-nation, not-already-member, 2-committee cap, no-pending-vote, open-member-seat. Spawns committee_admission_votes row with party-line snapshot (applicant party YES, others NO) and resolve_at_tick = now + 3. Resolution by resolve_due_admission_votes when next viewer loads the page.';

-- ── 4. resolve_due_admission_votes — lazy resolver ──────────────────
CREATE OR REPLACE FUNCTION public.resolve_due_admission_votes(p_nation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_tick          int;
    v_vote          committee_admission_votes%ROWTYPE;
    v_target_slot   int;
    v_resolved      int := 0;
    v_passed        int := 0;
    v_failed        int := 0;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_vote IN
        SELECT * FROM committee_admission_votes
         WHERE nation_id = p_nation_id
           AND status = 'active'
           AND resolve_at_tick <= v_tick
         ORDER BY resolve_at_tick ASC
         FOR UPDATE
    LOOP
        -- Pass threshold: yes / (yes+no) >= threshold_pct/100.
        -- Integer math: yes * 100 >= (yes+no) * threshold_pct.
        -- All-abstain (yes+no = 0) → fail (no mandate).
        IF (v_vote.yes_seats + v_vote.no_seats) = 0
           OR v_vote.yes_seats * 100 < (v_vote.yes_seats + v_vote.no_seats) * v_vote.threshold_pct THEN
            UPDATE committee_admission_votes
               SET status = 'failed', resolved_at_tick = v_tick
             WHERE id = v_vote.id;
            v_failed := v_failed + 1;
        ELSE
            -- Find an open member slot to seat the applicant.
            SELECT MAX(slot_idx) INTO v_target_slot
              FROM committee_members
             WHERE committee_id = v_vote.committee_id
               AND role = 'member'
               AND politician_faction_id IS NULL;
            IF v_target_slot IS NULL THEN
                -- Slot was filled between apply and resolve (rare).
                -- Fail-soft so the vote terminates cleanly; applicant
                -- can re-apply when another seat opens.
                UPDATE committee_admission_votes
                   SET status = 'failed', resolved_at_tick = v_tick
                 WHERE id = v_vote.id;
                v_failed := v_failed + 1;
            ELSE
                UPDATE committee_members
                   SET politician_faction_id = v_vote.applicant_faction_id,
                       party_id              = v_vote.applicant_party_id,
                       npc_first_name        = NULL,
                       npc_last_name         = NULL,
                       seated_at_tick        = v_tick
                 WHERE committee_id = v_vote.committee_id
                   AND slot_idx    = v_target_slot;
                UPDATE committee_admission_votes
                   SET status = 'passed', resolved_at_tick = v_tick
                 WHERE id = v_vote.id;
                v_passed := v_passed + 1;
            END IF;
        END IF;
        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success',  true,
        'resolved', v_resolved,
        'passed',   v_passed,
        'failed',   v_failed
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_due_admission_votes(uuid) TO authenticated;

COMMENT ON FUNCTION public.resolve_due_admission_votes(uuid) IS
    'Lazy resolver. For all active committee_admission_votes in p_nation_id with resolve_at_tick <= current_tick, evaluates yes >= 51% of cast. Pass: seats the applicant in the highest-slot ''member'' role (displaces NPC). Fail: terminal. FOR UPDATE on the vote row serialises concurrent resolves.';

NOTIFY pgrst, 'reload schema';

COMMIT;
