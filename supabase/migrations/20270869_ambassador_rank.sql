-- ════════════════════════════════════════════════════════════════════
-- 20270869 — The Ambassador (Foreign Service tier 4 — THE BIG ONE)
--
-- A DCM with 30 Experience hits [REQUEST APPOINTMENT] and the home
-- legislature TAKES IT UP: a 3-TICK chamber vote (design ruling,
-- rev.) — ambassador_confirmation_votes — renders in the Nation
-- page's VOTING section with the full division visible from the
-- start: the requester's party banks its seats YES, every other
-- party's bloc declares on a 1D2 at creation. After 3 ticks
-- resolve_due_ambassador_confirmations (the resolve_due_* pattern,
-- fired from page loads) enacts the verdict: more YES seats than NO
-- appoints (a tie fails; failure stamps a 12-tick re-request
-- cooldown), and the verdict lands in the chamber record as a
-- terminal bills row ('Appointment of {Politician} as Ambassador of
-- {Nation}', bill_type ambassador_confirmation). The target posting
-- is quoted at request time; if it's taken during the window the
-- resolver re-rolls a vacancy, and a confirmation with nowhere to
-- send you lapses without a cooldown.
--
-- Appointment: a RANDOM vacant live nation (market_nation_names),
-- home excluded, one ambassador per home→host pair (partial unique
-- index). The DCM region vacates. The term runs 60 TICKS — enforced
-- lazily (_expire_due_ambassadors sweeps at request time and via the
-- heartbeat the card fires; no timers). An expired ambassador
-- returns to civilian life and must win the chamber again.
--
-- Actions (one move per tick, next_ambassador_action_tick):
-- · [MEETING] — a persistent meeting request carded into BOTH
--   Pressing Issues containers (ambassador + the host nation's
--   player Foreign Minister, 20270868). Acceptance unlocks
--   [NEGOTIATIONS] — the existing DM system carries the talk.
--   Requires a sitting player FM (a meeting with nobody is nothing).
-- · [ISSUE STATEMENT] — a public 240-char statement. A player FM
--   reviews it (approve: +2 Reputation, +1 Relations; reject: −1
--   Reputation); with no player FM the ministry rolls, weighted by
--   relation_score. Every statement also lands on the HOME nation's
--   FM&T page as a communique — and the HOME Foreign Minister holds
--   a 12-tick [CENSURE] window. TWO strikes recall the ambassador
--   (design ruling): first censure is the warning (−2 Reputation),
--   the second ends the term in disgrace.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_ambassador_nation_id uuid,
    ADD COLUMN IF NOT EXISTS politician_ambassador_at_tick   int,
    ADD COLUMN IF NOT EXISTS politician_ambassador_strikes   int NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS next_ambassador_request_tick    int,
    ADD COLUMN IF NOT EXISTS next_ambassador_action_tick     int;

CREATE UNIQUE INDEX IF NOT EXISTS factions_one_ambassador_per_pair
    ON public.factions (nation_id, politician_ambassador_nation_id)
    WHERE politician_ambassador_nation_id IS NOT NULL AND abandoned_at IS NULL;

CREATE TABLE IF NOT EXISTS public.ambassador_meetings (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ambassador_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    fm_faction_id        uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    host_nation_id       uuid NOT NULL,
    status               text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'declined')),
    created_at_tick      int  NOT NULL,
    created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassador_meetings_fm_idx
    ON public.ambassador_meetings (fm_faction_id) WHERE status IN ('requested', 'accepted');

CREATE TABLE IF NOT EXISTS public.ambassador_statements (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ambassador_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    home_nation_id        uuid NOT NULL,
    host_nation_id        uuid NOT NULL,
    body                  text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 240),
    status                text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    decided_by_path       text CHECK (decided_by_path IS NULL OR decided_by_path IN ('player_fm', 'npc_roll')),
    censured              boolean NOT NULL DEFAULT false,
    created_at_tick       int  NOT NULL,
    decided_tick          int,
    created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassador_statements_pending_idx
    ON public.ambassador_statements (host_nation_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.ambassador_confirmation_votes (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id            uuid NOT NULL,
    candidate_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    candidate_name       text NOT NULL,
    target_nation_id     uuid NOT NULL,
    target_nation_name   text NOT NULL,
    -- The division, locked at creation: [{party_id, stance, seats}].
    party_votes          jsonb NOT NULL DEFAULT '[]',
    yes_seats            int NOT NULL DEFAULT 0,
    no_seats             int NOT NULL DEFAULT 0,
    chamber_size         int NOT NULL DEFAULT 0,
    status               text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'passed', 'failed')),
    started_at_tick      int NOT NULL,
    resolve_at_tick      int NOT NULL,
    resolved_tick        int,
    created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassador_confirmation_votes_active_idx
    ON public.ambassador_confirmation_votes (nation_id) WHERE status = 'active';

ALTER TABLE public.ambassador_confirmation_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.ambassador_confirmation_votes;
CREATE POLICY "Allow select for all" ON public.ambassador_confirmation_votes FOR SELECT USING (true);

ALTER TABLE public.ambassador_meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.ambassador_meetings;
CREATE POLICY "Allow select for all" ON public.ambassador_meetings FOR SELECT USING (true);
ALTER TABLE public.ambassador_statements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON public.ambassador_statements;
CREATE POLICY "Allow select for all" ON public.ambassador_statements FOR SELECT USING (true);

-- ── _expire_due_ambassadors — the lazy 60-tick term ───────────────
CREATE OR REPLACE FUNCTION public._expire_due_ambassadors(p_tick int)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    v_row     RECORD;
    v_expired int := 0;
BEGIN
    FOR v_row IN
        SELECT id, politician_ambassador_nation_id, politician_ambassador_at_tick
          FROM factions
         WHERE politician_ambassador_nation_id IS NOT NULL
           AND politician_ambassador_at_tick + 60 <= p_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        UPDATE factions
           SET politician_ambassador_nation_id = NULL,
               politician_ambassador_at_tick   = NULL,
               politician_ambassador_strikes   = 0
         WHERE id = v_row.id;
        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
        SELECT v_row.id, p_tick, 'ambassador_term_ended', COALESCE(n.name, ''),
               jsonb_build_object('nation', n.name)
          FROM nations n WHERE n.id = v_row.politician_ambassador_nation_id;
        v_expired := v_expired + 1;
    END LOOP;
    RETURN v_expired;
END $$;

REVOKE EXECUTE ON FUNCTION public._expire_due_ambassadors(int) FROM PUBLIC;

-- The heartbeat the card fires when it sees an expired term — the
-- sweep is the rule, anyone may invoke it.
CREATE OR REPLACE FUNCTION public.resolve_due_ambassador_terms()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick int;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    RETURN jsonb_build_object('success', true,
        'expired', _expire_due_ambassadors(COALESCE(v_tick, 0)));
END $$;

GRANT EXECUTE ON FUNCTION public.resolve_due_ambassador_terms() TO authenticated;

-- ── _ambassador_check — eligibility, the chief-check shape ────────
CREATE OR REPLACE FUNCTION public._ambassador_check(p_uid uuid, p_faction_id uuid, p_tick int)
RETURNS factions
LANGUAGE plpgsql
AS $$
DECLARE
    v_fac factions%ROWTYPE;
BEGIN
    SELECT * INTO v_fac FROM factions
     WHERE id = p_faction_id
       AND (id = p_uid OR linked_user_id = p_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_fac.id IS NULL
       OR lower(COALESCE(v_fac.status, '')) = 'arrested'
       OR v_fac.politician_ambassador_nation_id IS NULL THEN
        RETURN NULL;
    END IF;
    -- Lazy term enforcement: an expired ambassador's action retires
    -- the post instead of executing.
    IF v_fac.politician_ambassador_at_tick + 60 <= p_tick THEN
        PERFORM _expire_due_ambassadors(p_tick);
        RETURN NULL;
    END IF;
    RETURN v_fac;
END $$;

REVOKE EXECUTE ON FUNCTION public._ambassador_check(uuid, uuid, int) FROM PUBLIC;

-- ── _statement_approved_event — the approved words make the news ──
CREATE OR REPLACE FUNCTION public._statement_approved_event(p_stmt ambassador_statements, p_tick int)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_amb  text;
    v_host text;
BEGIN
    SELECT COALESCE(NULLIF(TRIM(COALESCE(leader_first_name, '') || ' '
                  || COALESCE(leader_last_name, '')), ''), 'The Ambassador')
      INTO v_amb FROM factions WHERE id = p_stmt.ambassador_faction_id;
    SELECT name INTO v_host FROM nations WHERE id = p_stmt.host_nation_id;
    INSERT INTO event_log (nation_id, event_name, event_type, category,
                           description_chosen, fired_at_tick, effects_applied)
    VALUES (p_stmt.home_nation_id, 'AMBASSADORIAL STATEMENT', 'diplomacy', 'government',
            format('%s, Ambassador to %s, issues an approved statement: “%s”',
                   v_amb, COALESCE(v_host, '—'), p_stmt.body),
            p_tick, jsonb_build_object('statement_id', p_stmt.id));
END $$;

REVOKE EXECUTE ON FUNCTION public._statement_approved_event(ambassador_statements, int) FROM PUBLIC;

-- ── _foreign_minister_of — who answers the door ───────────────────
CREATE OR REPLACE FUNCTION public._foreign_minister_of(p_nation_id uuid)
RETURNS uuid
LANGUAGE sql STABLE
AS $$
    SELECT id FROM factions
     WHERE nation_id = p_nation_id
       AND politician_foreign_minister_at_tick IS NOT NULL
       AND abandoned_at IS NULL
     LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public._foreign_minister_of(uuid) FROM PUBLIC;

-- ── politician_request_ambassador_appointment — THE VOTE OPENS ────
CREATE OR REPLACE FUNCTION public.politician_request_ambassador_appointment(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_tick   int;
    v_party  RECORD;
    v_yes    int := 0;
    v_no     int := 0;
    v_stance text;
    v_votes  jsonb := '[]'::jsonb;
    v_target nations%ROWTYPE;
    v_name   text;
    v_id     uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF lower(COALESCE(v_pol.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_pol.politician_dcm_region IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_dcm');
    END IF;
    IF COALESCE(v_pol.politician_skill, 0) < 30 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_enough_experience',
            'need', 30, 'have', COALESCE(v_pol.politician_skill, 0));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.next_ambassador_request_tick IS NOT NULL
       AND v_pol.next_ambassador_request_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.next_ambassador_request_tick);
    END IF;
    IF EXISTS (SELECT 1 FROM ambassador_confirmation_votes
                WHERE candidate_faction_id = v_pol.id AND status = 'active') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'confirmation_pending');
    END IF;

    -- Vacancy precheck BEFORE the chamber sits (design ruling) — the
    -- quoted posting headlines the vote; the resolver re-rolls if
    -- it's taken during the window.
    PERFORM _expire_due_ambassadors(v_tick);
    SELECT n.* INTO v_target FROM nations n
     WHERE n.name = ANY (market_nation_names())
       AND n.id <> v_pol.nation_id
       AND NOT EXISTS (
           SELECT 1 FROM factions f
            WHERE f.faction_type = 'politician'
              AND f.abandoned_at IS NULL
              AND f.nation_id = v_pol.nation_id
              AND f.politician_ambassador_nation_id = n.id)
     ORDER BY random() LIMIT 1;
    IF v_target.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_postings');
    END IF;

    -- The division declares at creation: the candidate's party banks
    -- its seats YES; every other bloc follows a 1D2. The stances are
    -- public for the full 3-tick window.
    FOR v_party IN
        SELECT id, COALESCE(seats, 0) AS seats FROM factions
         WHERE faction_type = 'movement_party'
           AND nation_id = v_pol.nation_id
           AND abandoned_at IS NULL
           AND COALESCE(seats, 0) > 0
    LOOP
        IF v_party.id = v_pol.politician_party_id OR FLOOR(random() * 2) = 0 THEN
            v_stance := 'yes';
            v_yes := v_yes + v_party.seats;
        ELSE
            v_stance := 'no';
            v_no := v_no + v_party.seats;
        END IF;
        v_votes := v_votes || jsonb_build_object(
            'party_id', v_party.id, 'stance', v_stance, 'seats', v_party.seats);
    END LOOP;

    v_name := COALESCE(NULLIF(TRIM(COALESCE(v_pol.leader_first_name, '') || ' '
                    || COALESCE(v_pol.leader_last_name, '')), ''), 'The Nominee');

    INSERT INTO ambassador_confirmation_votes (
        nation_id, candidate_faction_id, candidate_name,
        target_nation_id, target_nation_name, party_votes,
        yes_seats, no_seats, chamber_size, started_at_tick, resolve_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id, v_name,
        v_target.id, COALESCE(v_target.name, '—'), v_votes,
        v_yes, v_no, v_yes + v_no, v_tick, v_tick + 3
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'vote_id', v_id,
        'nation', v_target.name, 'yes_seats', v_yes, 'no_seats', v_no,
        'resolve_at_tick', v_tick + 3);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_request_ambassador_appointment(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_request_ambassador_appointment(uuid) TO authenticated;

-- ── resolve_due_ambassador_confirmations — the chamber's verdict ──
-- The resolve_due_* pattern: fired from page loads, idempotent,
-- FOR UPDATE SKIP LOCKED. Enacts each due vote: appoint on a YES
-- majority (tie fails), stamp the 12-tick re-request cooldown on a
-- NO, and land the terminal bills row either way.
CREATE OR REPLACE FUNCTION public.resolve_due_ambassador_confirmations()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick     int;
    v_vote     ambassador_confirmation_votes%ROWTYPE;
    v_pol      factions%ROWTYPE;
    v_target   nations%ROWTYPE;
    v_passed   boolean;
    v_resolved int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_vote IN
        SELECT * FROM ambassador_confirmation_votes
         WHERE status = 'active' AND resolve_at_tick <= v_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        v_passed := v_vote.yes_seats > v_vote.no_seats;
        SELECT * INTO v_pol FROM factions
         WHERE id = v_vote.candidate_faction_id
           AND faction_type = 'politician'
           AND abandoned_at IS NULL
         FOR UPDATE;
        -- A candidate who lost the DCM post, got arrested, or
        -- vanished during the window can't be sworn in.
        IF v_passed AND (v_pol.id IS NULL
            OR v_pol.politician_dcm_region IS NULL
            OR lower(COALESCE(v_pol.status, '')) = 'arrested') THEN
            v_passed := false;
        END IF;

        IF v_passed THEN
            -- The quoted posting first; re-roll if it was taken
            -- during the window.
            PERFORM _expire_due_ambassadors(v_tick);
            SELECT n.* INTO v_target FROM nations n
             WHERE n.id = v_vote.target_nation_id
               AND NOT EXISTS (
                   SELECT 1 FROM factions f
                    WHERE f.faction_type = 'politician'
                      AND f.abandoned_at IS NULL
                      AND f.nation_id = v_pol.nation_id
                      AND f.politician_ambassador_nation_id = n.id);
            IF v_target.id IS NULL THEN
                SELECT n.* INTO v_target FROM nations n
                 WHERE n.name = ANY (market_nation_names())
                   AND n.id <> v_pol.nation_id
                   AND NOT EXISTS (
                       SELECT 1 FROM factions f
                        WHERE f.faction_type = 'politician'
                          AND f.abandoned_at IS NULL
                          AND f.nation_id = v_pol.nation_id
                          AND f.politician_ambassador_nation_id = n.id)
                 ORDER BY random() LIMIT 1;
            END IF;
            IF v_target.id IS NULL THEN
                -- Confirmed with nowhere to send them: the
                -- appointment lapses, no cooldown — not the
                -- chamber's fault.
                v_passed := false;
            ELSE
                BEGIN
                    UPDATE factions
                       SET politician_ambassador_nation_id = v_target.id,
                           politician_ambassador_at_tick   = v_tick,
                           politician_ambassador_strikes   = 0,
                           politician_dcm_region           = NULL,
                           politician_dcm_at_tick          = NULL
                     WHERE id = v_pol.id;
                EXCEPTION WHEN unique_violation THEN
                    v_passed := false;
                END;
            END IF;
        ELSIF v_pol.id IS NOT NULL THEN
            UPDATE factions SET next_ambassador_request_tick = v_tick + 12
             WHERE id = v_pol.id;
        END IF;

        UPDATE ambassador_confirmation_votes
           SET status = CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
               resolved_tick = v_tick,
               target_nation_id = CASE WHEN v_passed THEN v_target.id ELSE target_nation_id END,
               target_nation_name = CASE WHEN v_passed THEN COALESCE(v_target.name, target_nation_name) ELSE target_nation_name END
         WHERE id = v_vote.id;

        -- The chamber record.
        INSERT INTO bills (nation_id, proposed_by, proposed_tick, bill_name, bill_type,
                           status, voting_ends_tick, passed_tick, votes_for, votes_against, preamble)
        VALUES (v_vote.nation_id, v_vote.candidate_faction_id, v_vote.started_at_tick,
                format('Appointment of %s as Ambassador to %s', v_vote.candidate_name,
                       CASE WHEN v_passed THEN COALESCE(v_target.name, v_vote.target_nation_name)
                            ELSE v_vote.target_nation_name END),
                'ambassador_confirmation',
                CASE WHEN v_passed THEN 'passed' ELSE 'failed' END,
                v_vote.resolve_at_tick, v_tick, v_vote.yes_seats, v_vote.no_seats,
                CASE WHEN v_passed
                     THEN format('The chamber confirms %s as Ambassador to %s, %s seats to %s. The term runs sixty ticks.',
                                 v_vote.candidate_name, COALESCE(v_target.name, v_vote.target_nation_name),
                                 v_vote.yes_seats, v_vote.no_seats)
                     ELSE format('The chamber declined to confirm %s for the embassy in %s, %s seats to %s.',
                                 v_vote.candidate_name, v_vote.target_nation_name,
                                 v_vote.no_seats, v_vote.yes_seats)
                END);

        IF v_pol.id IS NOT NULL THEN
            INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
            VALUES (v_pol.id, v_tick,
                    CASE WHEN v_passed THEN 'ambassador_appointed' ELSE 'ambassador_rejected' END,
                    CASE WHEN v_passed THEN COALESCE(v_target.name, '') ELSE '' END,
                    jsonb_build_object('yes_seats', v_vote.yes_seats, 'no_seats', v_vote.no_seats,
                                       'term_ends_tick', CASE WHEN v_passed THEN v_tick + 60 ELSE NULL END));
        END IF;

        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'resolved', v_resolved);
END $$;

GRANT EXECUTE ON FUNCTION public.resolve_due_ambassador_confirmations() TO authenticated;

-- ── politician_ambassador_resign — hand back the credentials ──────
-- No claw-back: the next posting means winning the chamber again,
-- which is its own barrier (the FS-resign convention, 20270771).
CREATE OR REPLACE FUNCTION public.politician_ambassador_resign(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_tick   int;
    v_nation text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_ambassador_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ambassador');
    END IF;

    SELECT name INTO v_nation FROM nations
     WHERE id = v_pol.politician_ambassador_nation_id;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET politician_ambassador_nation_id = NULL,
           politician_ambassador_at_tick   = NULL,
           politician_ambassador_strikes   = 0
     WHERE id = v_pol.id;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (v_pol.id, v_tick, 'ambassador_resigned', COALESCE(v_nation, ''),
            jsonb_build_object('nation', v_nation));

    RETURN jsonb_build_object('success', true, 'resigned_from', v_nation);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_ambassador_resign(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_ambassador_resign(uuid) TO authenticated;

-- ── ambassador_request_meeting ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ambassador_request_meeting(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_tick int;
    v_fac  factions%ROWTYPE;
    v_fm   uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_fac := _ambassador_check(v_uid, p_faction_id, v_tick);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ambassador');
    END IF;
    IF v_fac.next_ambassador_action_tick IS NOT NULL
       AND v_fac.next_ambassador_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_fac.next_ambassador_action_tick);
    END IF;
    v_fm := _foreign_minister_of(v_fac.politician_ambassador_nation_id);
    IF v_fm IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_foreign_minister');
    END IF;
    IF EXISTS (SELECT 1 FROM ambassador_meetings
                WHERE ambassador_faction_id = v_fac.id
                  AND fm_faction_id = v_fm
                  AND status IN ('requested', 'accepted')) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'meeting_open');
    END IF;

    INSERT INTO ambassador_meetings (ambassador_faction_id, fm_faction_id, host_nation_id, created_at_tick)
    VALUES (v_fac.id, v_fm, v_fac.politician_ambassador_nation_id, v_tick);

    UPDATE factions SET next_ambassador_action_tick = v_tick + 1 WHERE id = v_fac.id;
    RETURN jsonb_build_object('success', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.ambassador_request_meeting(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ambassador_request_meeting(uuid) TO authenticated;

-- ── fm_decide_meeting ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fm_decide_meeting(
    p_faction_id uuid,
    p_meeting_id uuid,
    p_accept     boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_meeting ambassador_meetings%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_meeting_id IS NULL OR p_accept IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    SELECT * INTO v_meeting FROM ambassador_meetings
     WHERE id = p_meeting_id AND fm_faction_id = v_pol.id
     FOR UPDATE;
    IF v_meeting.id IS NULL OR v_meeting.status <> 'requested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_requested');
    END IF;
    UPDATE ambassador_meetings
       SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END
     WHERE id = v_meeting.id;
    RETURN jsonb_build_object('success', true, 'accepted', p_accept);
END $$;

REVOKE EXECUTE ON FUNCTION public.fm_decide_meeting(uuid, uuid, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fm_decide_meeting(uuid, uuid, boolean) TO authenticated;

-- ── ambassador_issue_statement ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ambassador_issue_statement(
    p_faction_id uuid,
    p_text       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_tick  int;
    v_fac   factions%ROWTYPE;
    v_text  text := TRIM(COALESCE(p_text, ''));
    v_fm    uuid;
    v_host  nations%ROWTYPE;
    v_id    uuid;
    v_rel   numeric := 0;
    v_roll  int;
    v_appr  boolean;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF length(v_text) < 1 OR length(v_text) > 240 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_text');
    END IF;
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_fac := _ambassador_check(v_uid, p_faction_id, v_tick);
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ambassador');
    END IF;
    IF v_fac.next_ambassador_action_tick IS NOT NULL
       AND v_fac.next_ambassador_action_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_fac.next_ambassador_action_tick);
    END IF;

    SELECT * INTO v_host FROM nations WHERE id = v_fac.politician_ambassador_nation_id;

    INSERT INTO ambassador_statements (
        ambassador_faction_id, home_nation_id, host_nation_id, body, created_at_tick
    ) VALUES (
        v_fac.id, v_fac.nation_id, v_fac.politician_ambassador_nation_id, v_text, v_tick
    ) RETURNING id INTO v_id;

    -- Every statement reaches the HOME ministry's Communiques — the
    -- record the home FM censures from.
    INSERT INTO diplomatic_cables (
        faction_id, nation_id, body, sender_name, host_city, host_nation, sent_at_tick
    ) VALUES (
        v_fac.id, v_fac.nation_id, v_text,
        COALESCE(NULLIF(TRIM(COALESCE(v_fac.leader_first_name, '') || ' '
                      || COALESCE(v_fac.leader_last_name, '')), ''), 'The Ambassador')
            || ' (Ambassador)',
        COALESCE(v_host.capital, ''), COALESCE(v_host.name, ''), v_tick
    );

    v_fm := _foreign_minister_of(v_fac.politician_ambassador_nation_id);
    IF v_fm IS NOT NULL THEN
        -- A player FM reviews it from Pressing Issues.
        UPDATE factions SET next_ambassador_action_tick = v_tick + 1 WHERE id = v_fac.id;
        RETURN jsonb_build_object('success', true, 'status', 'pending', 'path', 'player_fm');
    END IF;

    -- No player FM: the ministry reviews — a roll weighted by the
    -- bilateral relation_score (warmer relations, kinder readings).
    SELECT COALESCE(relation_score, 0) INTO v_rel FROM diplomatic_relations
     WHERE nation_a_id = LEAST(v_fac.nation_id, v_fac.politician_ambassador_nation_id)
       AND nation_b_id = GREATEST(v_fac.nation_id, v_fac.politician_ambassador_nation_id)
     LIMIT 1;
    v_roll := 1 + FLOOR(random() * 100)::int;
    v_appr := v_roll <= GREATEST(10, LEAST(90, 50 + ROUND(COALESCE(v_rel, 0) / 2)));

    UPDATE ambassador_statements
       SET status = CASE WHEN v_appr THEN 'approved' ELSE 'rejected' END,
           decided_by_path = 'npc_roll', decided_tick = v_tick
     WHERE id = v_id;
    IF v_appr THEN
        UPDATE factions
           SET embassy_reputation = LEAST(100, COALESCE(embassy_reputation, 50) + 2)
         WHERE id = v_fac.id;
        PERFORM _bump_relation_score(v_fac.nation_id, v_fac.politician_ambassador_nation_id, 1);
        PERFORM _statement_approved_event(
            (SELECT st FROM ambassador_statements st WHERE st.id = v_id), v_tick);
    ELSE
        UPDATE factions
           SET embassy_reputation = GREATEST(0, COALESCE(embassy_reputation, 50) - 1)
         WHERE id = v_fac.id;
    END IF;

    UPDATE factions SET next_ambassador_action_tick = v_tick + 1 WHERE id = v_fac.id;
    RETURN jsonb_build_object('success', true, 'path', 'npc_roll',
        'status', CASE WHEN v_appr THEN 'approved' ELSE 'rejected' END);
END $$;

REVOKE EXECUTE ON FUNCTION public.ambassador_issue_statement(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ambassador_issue_statement(uuid, text) TO authenticated;

-- ── fm_decide_statement — the host FM's review ────────────────────
CREATE OR REPLACE FUNCTION public.fm_decide_statement(
    p_faction_id   uuid,
    p_statement_id uuid,
    p_accept       boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_pol  factions%ROWTYPE;
    v_stmt ambassador_statements%ROWTYPE;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_statement_id IS NULL OR p_accept IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    SELECT * INTO v_stmt FROM ambassador_statements
     WHERE id = p_statement_id FOR UPDATE;
    IF v_stmt.id IS NULL OR v_stmt.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_pending');
    END IF;
    -- The decider must be the HOST nation's sitting FM.
    IF v_pol.politician_foreign_minister_at_tick IS NULL
       OR v_pol.nation_id <> v_stmt.host_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_fm');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE ambassador_statements
       SET status = CASE WHEN p_accept THEN 'approved' ELSE 'rejected' END,
           decided_by_path = 'player_fm', decided_tick = v_tick
     WHERE id = v_stmt.id;
    IF p_accept THEN
        UPDATE factions
           SET embassy_reputation = LEAST(100, COALESCE(embassy_reputation, 50) + 2)
         WHERE id = v_stmt.ambassador_faction_id;
        PERFORM _bump_relation_score(v_stmt.home_nation_id, v_stmt.host_nation_id, 1);
        PERFORM _statement_approved_event(v_stmt, v_tick);
    ELSE
        UPDATE factions
           SET embassy_reputation = GREATEST(0, COALESCE(embassy_reputation, 50) - 1)
         WHERE id = v_stmt.ambassador_faction_id;
    END IF;
    RETURN jsonb_build_object('success', true, 'approved', p_accept);
END $$;

REVOKE EXECUTE ON FUNCTION public.fm_decide_statement(uuid, uuid, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.fm_decide_statement(uuid, uuid, boolean) TO authenticated;

-- ── home_fm_censure — two strikes and the term ends ───────────────
CREATE OR REPLACE FUNCTION public.home_fm_censure(
    p_faction_id   uuid,
    p_statement_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_stmt    ambassador_statements%ROWTYPE;
    v_tick    int;
    v_strikes int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_statement_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    SELECT * INTO v_stmt FROM ambassador_statements
     WHERE id = p_statement_id FOR UPDATE;
    IF v_stmt.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_found');
    END IF;
    -- The censure pen belongs to the HOME nation's sitting FM, and
    -- the window runs 12 ticks from issuance.
    IF v_pol.politician_foreign_minister_at_tick IS NULL
       OR v_pol.nation_id <> v_stmt.home_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_fm');
    END IF;
    IF v_stmt.censured THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_censured');
    END IF;
    -- An FM can't censure their own statement era; ambassadors
    -- censuring themselves is blocked by the FM/ambassador posts
    -- being mutually exclusive in practice, but belt and braces:
    IF v_stmt.ambassador_faction_id = v_pol.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_stmt.created_at_tick + 12 <= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'window_closed');
    END IF;

    UPDATE ambassador_statements SET censured = true WHERE id = v_stmt.id;
    UPDATE factions
       SET politician_ambassador_strikes = COALESCE(politician_ambassador_strikes, 0) + 1,
           embassy_reputation = GREATEST(0, COALESCE(embassy_reputation, 50) - 2)
     WHERE id = v_stmt.ambassador_faction_id
     RETURNING politician_ambassador_strikes INTO v_strikes;

    IF v_strikes >= 2 THEN
        -- The second strike recalls the ambassador in disgrace.
        UPDATE factions
           SET politician_ambassador_nation_id = NULL,
               politician_ambassador_at_tick   = NULL,
               politician_ambassador_strikes   = 0
         WHERE id = v_stmt.ambassador_faction_id;
        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
        VALUES (v_stmt.ambassador_faction_id, v_tick, 'ambassador_recalled', '',
                jsonb_build_object('statement_id', v_stmt.id));
        RETURN jsonb_build_object('success', true, 'strikes', 2, 'recalled', true);
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (v_stmt.ambassador_faction_id, v_tick, 'ambassador_censured', '',
            jsonb_build_object('statement_id', v_stmt.id));
    RETURN jsonb_build_object('success', true, 'strikes', v_strikes, 'recalled', false);
END $$;

REVOKE EXECUTE ON FUNCTION public.home_fm_censure(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.home_fm_censure(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
