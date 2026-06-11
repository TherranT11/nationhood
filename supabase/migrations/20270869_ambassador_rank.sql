-- ════════════════════════════════════════════════════════════════════
-- 20270869 — The Ambassador (Foreign Service tier 4 — THE BIG ONE)
--
-- A DCM with 30 Experience hits [REQUEST APPOINTMENT] and the home
-- legislature votes ON THE SPOT: the requester's own party banks its
-- seats as YES; every other party rolls 1D2 and its whole bloc
-- follows the die. More YES seats than NO appoints (a tie fails);
-- failure stamps a 12-tick re-request cooldown. Vacancy is checked
-- BEFORE the vote so a confirmation is never wasted. Either way the
-- chamber's verdict is AUTO-GENERATED as a bills row — 'Appointment
-- of {Politician} as Ambassador of {Nation}', bill_type
-- ambassador_confirmation, landed terminal (passed/failed) with the
-- seat tally, so it renders in the legislature's recent results.
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

-- ── politician_request_ambassador_appointment — THE VOTE ──────────
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
    v_target nations%ROWTYPE;
    v_name   text;
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

    -- Vacancy precheck BEFORE the vote (design ruling) — never burn
    -- a confirmation on "no postings". Expired terms sweep first.
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

    -- THE VOTE: party blocs, resolved on the spot. The requester's
    -- party banks its seats YES; every other party rolls 1D2 and its
    -- bloc follows. An empty chamber appoints unopposed.
    FOR v_party IN
        SELECT id, COALESCE(seats, 0) AS seats FROM factions
         WHERE faction_type = 'movement_party'
           AND nation_id = v_pol.nation_id
           AND abandoned_at IS NULL
           AND COALESCE(seats, 0) > 0
    LOOP
        IF v_party.id = v_pol.politician_party_id THEN
            v_yes := v_yes + v_party.seats;
        ELSIF FLOOR(random() * 2) = 0 THEN
            v_yes := v_yes + v_party.seats;
        ELSE
            v_no := v_no + v_party.seats;
        END IF;
    END LOOP;

    v_name := COALESCE(NULLIF(TRIM(COALESCE(v_pol.leader_first_name, '') || ' '
                    || COALESCE(v_pol.leader_last_name, '')), ''), 'The Nominee');

    IF v_yes + v_no > 0 AND v_yes <= v_no THEN
        -- The chamber says no (a tie fails). 12 ticks before the
        -- ministry will float the name again. The verdict enters the
        -- chamber record either way.
        INSERT INTO bills (nation_id, proposed_by, proposed_tick, bill_name, bill_type,
                           status, voting_ends_tick, passed_tick, votes_for, votes_against, preamble)
        VALUES (v_pol.nation_id, v_pol.id, v_tick,
                format('Appointment of %s as Ambassador of %s', v_name, v_target.name),
                'ambassador_confirmation', 'failed', v_tick, v_tick, v_yes, v_no,
                format('The Foreign Ministry put %s before the chamber for the embassy in %s. The chamber declined, %s seats to %s.', v_name, v_target.name, v_no, v_yes));
        UPDATE factions SET next_ambassador_request_tick = v_tick + 12
         WHERE id = v_pol.id;
        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
        VALUES (v_pol.id, v_tick, 'ambassador_rejected', '',
                jsonb_build_object('yes_seats', v_yes, 'no_seats', v_no));
        RETURN jsonb_build_object('success', false, 'reason', 'vote_failed',
            'yes_seats', v_yes, 'no_seats', v_no, 'retry_at_tick', v_tick + 12);
    END IF;

    BEGIN
        UPDATE factions
           SET politician_ambassador_nation_id = v_target.id,
               politician_ambassador_at_tick   = v_tick,
               politician_ambassador_strikes   = 0,
               politician_dcm_region           = NULL,
               politician_dcm_at_tick          = NULL
         WHERE id = v_pol.id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_postings');
    END;

    INSERT INTO bills (nation_id, proposed_by, proposed_tick, bill_name, bill_type,
                       status, voting_ends_tick, passed_tick, votes_for, votes_against, preamble)
    VALUES (v_pol.nation_id, v_pol.id, v_tick,
            format('Appointment of %s as Ambassador of %s', v_name, v_target.name),
            'ambassador_confirmation', 'passed', v_tick, v_tick, v_yes, v_no,
            format('The chamber confirms %s as Ambassador to %s, %s seats to %s. The term runs sixty ticks.', v_name, v_target.name, v_yes, v_no));

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (v_pol.id, v_tick, 'ambassador_appointed', COALESCE(v_target.name, ''),
            jsonb_build_object('nation', v_target.name, 'yes_seats', v_yes, 'no_seats', v_no,
                               'term_ends_tick', v_tick + 60));

    RETURN jsonb_build_object('success', true, 'nation', v_target.name,
        'capital', v_target.capital, 'yes_seats', v_yes, 'no_seats', v_no,
        'term_ends_tick', v_tick + 60);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_request_ambassador_appointment(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_request_ambassador_appointment(uuid) TO authenticated;

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
