-- ════════════════════════════════════════════════════════════════════
-- 20270614 — Board roles (CFO/COO) + resignation + COO succession
--
-- Phase 1 of the Board of Directors deepening:
--
--   • corp_board_seats.role        — NULL (plain Director) | 'cfo' | 'coo'.
--     One CFO and one COO per corp (unique partial index).
--
--   • factions.next_board_apply_tick — cooldown stamp set when a
--     board member voluntarily resigns. Blocks
--     corp_board_request_join until the tick passes (5-tick window).
--
--   • corp_appoint_role(p_corp_id, p_member_faction_id, p_role) —
--     CEO-only. Sets role on an existing Director's seat. Auto-swaps
--     so reassigning the same role to a different director clears
--     the previous holder (only one CFO and one COO per corp at any
--     time). Idempotent on a no-op apply.
--
--   • corp_clear_role(p_corp_id, p_member_faction_id) — CEO-only.
--     Drops a CFO/COO back to plain Director.
--
--   • corp_board_resign(p_corp_id) — caller resigns their own seat.
--     Stamps factions.next_board_apply_tick = current_tick + 5.
--     Fires politician_career_events 'removed_from_board' with
--     metadata.removal_reason = 'voluntary' AND event_log
--     'Board Seat Vacated' (category='corporate',
--     trigger_key='corp_board_resign'). No reputation hit.
--
--   • corp_remove_director(p_corp_id, p_member_faction_id) —
--     CEO-only. Kicks a Director (or CFO / COO — drops them off the
--     seat entirely). NO cooldown applied to the removed faction
--     (the career-event record is the cost). Same career event +
--     event_log entries, with removal_reason = 'forced'.
--
--   • corp_board_request_join — re-issued with the cooldown check
--     added after the already_applied gate. Body otherwise
--     byte-identical to 20270160.
--
--   • corp_no_confidence_resolve — re-issued so the ousted-CEO
--     successor selection prefers the seated COO over the highest
--     shareholder. Tie-break order: COO > shareholder count desc >
--     joined_tick asc. Body otherwise byte-identical to 20270163.
--
-- Reputation per-tick drips (Director / CFO / COO tenure) and the
-- CFO-initiated dividend voting are separate follow-ups (Phase 2
-- and Phase 3 per the design discussion).
--
-- Apply after 20270613.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ────────────────────────────────────────────────────
ALTER TABLE public.corp_board_seats
    ADD COLUMN IF NOT EXISTS role text
    CHECK (role IS NULL OR role IN ('cfo', 'coo'));

COMMENT ON COLUMN public.corp_board_seats.role IS
    'Board-seat sub-role beyond plain Director. NULL = Director (the default for all seats). ''cfo'' = Chief Financial Officer (Phase 2 mechanic: initiate dividend votes). ''coo'' = Chief Operating Officer (first in line for CEO succession during a no-confidence ouster; 20270614). One CFO and one COO max per corp, enforced by the partial unique index below.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_corp_board_seats_unique_role
    ON public.corp_board_seats (corp_id, role)
    WHERE role IS NOT NULL;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS next_board_apply_tick int;

COMMENT ON COLUMN public.factions.next_board_apply_tick IS
    'Cooldown stamp: the earliest tick at which this faction may file a fresh corp_board_request_join after voluntarily resigning a seat. Set by corp_board_resign to current_tick + 5. NULL = no cooldown active. CEO-initiated removals via corp_remove_director do NOT stamp this column (the career-event record is the cost there, not a cooldown).';

-- ── 2. corp_appoint_role — CEO-only, auto-swap ───────────────────
CREATE OR REPLACE FUNCTION public.corp_appoint_role(
    p_corp_id           uuid,
    p_member_faction_id uuid,
    p_role              text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_corp      entrepreneur_corps%ROWTYPE;
    v_seat      corp_board_seats%ROWTYPE;
    v_old_seat  corp_board_seats%ROWTYPE;
    v_tick      int;
    v_member_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_member_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_role IS NULL OR p_role NOT IN ('cfo', 'coo') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_role');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ceo');
    END IF;

    -- The CEO can't appoint themselves; they're already the chair.
    IF p_member_faction_id = v_corp.owner_faction_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_appoint_ceo');
    END IF;

    SELECT * INTO v_seat FROM corp_board_seats
     WHERE corp_id = p_corp_id AND member_faction_id = p_member_faction_id
     FOR UPDATE;
    IF v_seat.corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_a_director');
    END IF;

    -- No-op idempotent.
    IF v_seat.role = p_role THEN
        RETURN jsonb_build_object('success', true, 'noop', true, 'role', p_role);
    END IF;

    -- Auto-swap: if another seat already holds this role, clear it
    -- first so the unique partial index doesn't reject the new set.
    SELECT * INTO v_old_seat FROM corp_board_seats
     WHERE corp_id = p_corp_id AND role = p_role
       AND member_faction_id <> p_member_faction_id
     FOR UPDATE;
    IF v_old_seat.corp_id IS NOT NULL THEN
        UPDATE corp_board_seats SET role = NULL
         WHERE corp_id = p_corp_id
           AND member_faction_id = v_old_seat.member_faction_id;
    END IF;

    UPDATE corp_board_seats SET role = p_role
     WHERE corp_id = p_corp_id AND member_faction_id = p_member_faction_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT COALESCE(NULLIF(btrim(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, '')), ''),
                    faction_name, 'A Director')
      INTO v_member_name FROM factions WHERE id = p_member_faction_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        format('Board Role Appointed — %s', upper(p_role)),
        format('%s has been appointed %s of %s.',
               v_member_name,
               CASE p_role WHEN 'cfo' THEN 'CFO' WHEN 'coo' THEN 'COO' END,
               v_corp.name),
        'corporate', 'corp_appoint_role',
        jsonb_build_object('corp_id', p_corp_id, 'corp_name', v_corp.name,
                           'member_faction_id', p_member_faction_id,
                           'role', p_role),
        v_tick
    );

    RETURN jsonb_build_object('success', true, 'role', p_role,
        'displaced_member_faction_id', v_old_seat.member_faction_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_appoint_role(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_appoint_role(uuid, uuid, text) TO authenticated;

-- ── 3. corp_clear_role — CEO-only, demote to plain Director ──────
CREATE OR REPLACE FUNCTION public.corp_clear_role(
    p_corp_id           uuid,
    p_member_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_seat   corp_board_seats%ROWTYPE;
    v_tick   int;
    v_member_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_member_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ceo');
    END IF;

    SELECT * INTO v_seat FROM corp_board_seats
     WHERE corp_id = p_corp_id AND member_faction_id = p_member_faction_id
     FOR UPDATE;
    IF v_seat.corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_a_director');
    END IF;
    IF v_seat.role IS NULL THEN
        RETURN jsonb_build_object('success', true, 'noop', true);
    END IF;

    UPDATE corp_board_seats SET role = NULL
     WHERE corp_id = p_corp_id AND member_faction_id = p_member_faction_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT COALESCE(NULLIF(btrim(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, '')), ''),
                    faction_name, 'A Director')
      INTO v_member_name FROM factions WHERE id = p_member_faction_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        format('Board Role Vacated — %s', upper(v_seat.role)),
        format('%s is no longer %s of %s; returns to Director.',
               v_member_name,
               CASE v_seat.role WHEN 'cfo' THEN 'CFO' WHEN 'coo' THEN 'COO' END,
               v_corp.name),
        'corporate', 'corp_clear_role',
        jsonb_build_object('corp_id', p_corp_id, 'corp_name', v_corp.name,
                           'member_faction_id', p_member_faction_id,
                           'previous_role', v_seat.role),
        v_tick
    );

    RETURN jsonb_build_object('success', true, 'previous_role', v_seat.role);
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_clear_role(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_clear_role(uuid, uuid) TO authenticated;

-- ── 4. corp_board_resign — caller self-resigns ───────────────────
CREATE OR REPLACE FUNCTION public.corp_board_resign(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_corp      entrepreneur_corps%ROWTYPE;
    v_seat      corp_board_seats%ROWTYPE;
    v_tick      int;
    v_cooldown  int := 5;
    v_member_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    SELECT * INTO v_seat FROM corp_board_seats
     WHERE corp_id = p_corp_id AND member_faction_id = v_fac.id
     FOR UPDATE;
    IF v_seat.corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_on_board');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    DELETE FROM corp_board_seats
     WHERE corp_id = p_corp_id AND member_faction_id = v_fac.id;

    UPDATE factions
       SET next_board_apply_tick = v_tick + v_cooldown
     WHERE id = v_fac.id;

    SELECT COALESCE(NULLIF(btrim(COALESCE(v_fac.leader_first_name, '') || ' ' || COALESCE(v_fac.leader_last_name, '')), ''),
                    v_fac.faction_name, 'A Director')
      INTO v_member_name;

    -- Career event on the resigner's record.
    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        v_fac.id, v_tick, 'removed_from_board', v_corp.name,
        jsonb_build_object('corp_id', p_corp_id, 'removal_reason', 'voluntary',
                           'previous_role', v_seat.role)
    );

    -- World-visible event.
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Board Seat Vacated',
        format('%s has resigned from the Board of Directors of %s.',
               v_member_name, v_corp.name),
        'corporate', 'corp_board_resign',
        jsonb_build_object('corp_id', p_corp_id, 'corp_name', v_corp.name,
                           'member_faction_id', v_fac.id,
                           'previous_role', v_seat.role,
                           'cooldown_until_tick', v_tick + v_cooldown),
        v_tick
    );

    RETURN jsonb_build_object('success', true,
        'cooldown_until_tick', v_tick + v_cooldown,
        'previous_role',       v_seat.role);
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_board_resign(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_board_resign(uuid) TO authenticated;

-- ── 5. corp_remove_director — CEO kicks a board member ───────────
CREATE OR REPLACE FUNCTION public.corp_remove_director(
    p_corp_id           uuid,
    p_member_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_seat   corp_board_seats%ROWTYPE;
    v_tick   int;
    v_member_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_member_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ceo');
    END IF;

    SELECT * INTO v_seat FROM corp_board_seats
     WHERE corp_id = p_corp_id AND member_faction_id = p_member_faction_id
     FOR UPDATE;
    IF v_seat.corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_a_director');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    DELETE FROM corp_board_seats
     WHERE corp_id = p_corp_id AND member_faction_id = p_member_faction_id;

    -- NO cooldown stamp on forced removal — the career record is the cost.

    SELECT COALESCE(NULLIF(btrim(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, '')), ''),
                    faction_name, 'A Director')
      INTO v_member_name FROM factions WHERE id = p_member_faction_id;

    INSERT INTO politician_career_events (
        faction_id, event_tick, event_type, target_name, metadata
    ) VALUES (
        p_member_faction_id, v_tick, 'removed_from_board', v_corp.name,
        jsonb_build_object('corp_id', p_corp_id, 'removal_reason', 'forced',
                           'previous_role', v_seat.role)
    );

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, p_member_faction_id,
        'Board Seat Vacated',
        format('%s has been removed from the Board of Directors of %s.',
               v_member_name, v_corp.name),
        'corporate', 'corp_board_remove',
        jsonb_build_object('corp_id', p_corp_id, 'corp_name', v_corp.name,
                           'member_faction_id', p_member_faction_id,
                           'previous_role', v_seat.role,
                           'removed_by_ceo_faction_id', v_fac.id),
        v_tick
    );

    RETURN jsonb_build_object('success', true,
        'previous_role', v_seat.role);
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_remove_director(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_remove_director(uuid, uuid) TO authenticated;

-- ── 6. corp_board_request_join — add cooldown check ──────────────
-- Body byte-identical to 20270160 except for the new cooldown gate
-- inserted after the already_applied check.
CREATE OR REPLACE FUNCTION public.corp_board_request_join(p_corp_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          UUID := auth.uid();
    v_fac          factions%ROWTYPE;
    v_corp         entrepreneur_corps%ROWTYPE;
    v_tick         INT;
    v_request_id   UUID;
    v_director_n   INT;
    v_name         TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    IF v_corp.owner_faction_id = v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'founder_cannot_apply');
    END IF;

    IF EXISTS (SELECT 1 FROM corp_board_seats
                WHERE corp_id = p_corp_id AND member_faction_id = v_fac.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_on_board');
    END IF;

    IF EXISTS (SELECT 1 FROM corp_board_requests
                WHERE corp_id = p_corp_id AND applicant_faction_id = v_fac.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_applied');
    END IF;

    -- 20270614: 5-tick cooldown after a voluntary resignation (any
    -- corp — the gate is on the faction, not per-corp). Forced
    -- removals don't stamp the column, so a kicked director can
    -- re-apply immediately to another corp.
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_fac.next_board_apply_tick IS NOT NULL
       AND v_fac.next_board_apply_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'resignation_cooldown',
            'cooldown_until_tick', v_fac.next_board_apply_tick,
            'ticks_remaining', v_fac.next_board_apply_tick - v_tick);
    END IF;

    SELECT COUNT(*) INTO v_director_n FROM corp_board_seats
     WHERE corp_id = p_corp_id;
    IF v_director_n >= 7 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'board_full');
    END IF;

    INSERT INTO corp_board_requests (corp_id, applicant_faction_id, created_tick, expires_tick)
    VALUES (p_corp_id, v_fac.id, v_tick, v_tick + 3)
    RETURNING id INTO v_request_id;

    INSERT INTO corp_board_request_pool (request_id, voter_faction_id)
    VALUES (v_request_id, v_corp.owner_faction_id);

    INSERT INTO corp_board_request_pool (request_id, voter_faction_id)
    SELECT v_request_id, member_faction_id
      FROM corp_board_seats
     WHERE corp_id = p_corp_id
       AND member_faction_id <> v_corp.owner_faction_id;

    v_name := COALESCE(
        NULLIF(btrim(COALESCE(v_fac.leader_first_name,'') || ' ' || COALESCE(v_fac.leader_last_name,'')), ''),
        v_fac.faction_name,
        'An entrepreneur'
    );

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Board Application Filed',
        format('%s has sought to join the Board of Directors of %s.', v_name, v_corp.name),
        'corporate', 'corp_board_request_join',
        jsonb_build_object('corp_id', p_corp_id, 'corp_name', v_corp.name,
                           'request_id', v_request_id, 'expires_tick', v_tick + 3),
        v_tick
    );

    RETURN jsonb_build_object(
        'success', true, 'request_id', v_request_id,
        'expires_tick', v_tick + 3
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.corp_board_request_join(UUID) TO authenticated;

-- ── 7. corp_no_confidence_resolve — COO succession preference ────
-- Body byte-identical to 20270163 except for the successor SELECT,
-- which now orders by (role='coo') DESC ahead of shareholdings.
-- Pulling only the changed function from the migration; the rest
-- of 20270163 is untouched.
-- We re-issue the function below in its full form so PG can swap
-- the body in one atomic CREATE OR REPLACE.
-- ────────────────────────────────────────────────────────────────
-- The full 20270163 body is reproduced verbatim with only the
-- successor SELECT updated (search "ORDER BY (s.role = 'coo')").
-- To keep this migration tractable we pull the function body from
-- the existing definition and patch the one ORDER BY clause. The
-- next migration to touch corp_no_confidence_resolve will need to
-- preserve the COO-preference ordering.

CREATE OR REPLACE FUNCTION public.corp_no_confidence_resolve(p_motion_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_motion         corp_no_confidence_motions%ROWTYPE;
    v_corp           entrepreneur_corps%ROWTYPE;
    v_filer          factions%ROWTYPE;
    v_total_shares   bigint;
    v_quorum_shares  bigint;
    v_quorum_met     boolean;
    v_pass           boolean;
    v_outcome        text;
    v_successor      uuid;
    v_tick           int;
    v_corp_name      text;
    v_old_ceo_name   text;
    v_new_ceo_name   text;
BEGIN
    IF p_motion_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_motion FROM corp_no_confidence_motions
     WHERE id = p_motion_id FOR UPDATE;
    IF v_motion.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'motion_not_found');
    END IF;
    IF v_motion.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'motion_not_open',
            'status', v_motion.status);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_motion.resolve_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_yet_due',
            'resolve_tick', v_motion.resolve_tick, 'current_tick', v_tick);
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = v_motion.corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        UPDATE corp_no_confidence_motions
           SET status = 'resolved', resolved_at_tick = v_tick,
               outcome = 'survived'
         WHERE id = p_motion_id;
        RETURN jsonb_build_object('success', false, 'reason', 'corp_gone');
    END IF;

    SELECT COALESCE(SUM(eligible_shares), 0) INTO v_total_shares
      FROM corp_no_confidence_eligibility
     WHERE motion_id = p_motion_id;

    v_quorum_shares := CEIL(v_total_shares * 0.30)::bigint;
    v_quorum_met    := (v_motion.yes_shares + v_motion.no_shares) >= v_quorum_shares;
    v_pass          := (v_motion.yes_shares > v_motion.no_shares) AND v_quorum_met;

    IF v_pass THEN
        v_outcome := 'ousted';
    ELSIF NOT v_quorum_met THEN
        v_outcome := 'failed_quorum';
    ELSE
        v_outcome := 'survived';
    END IF;

    IF v_outcome = 'ousted' THEN
        -- 20270614: COO first if present, then highest-share seat,
        -- tie-break oldest joined_tick. LEFT JOIN handles seats with
        -- no shareholding row (treated as 0 shares).
        SELECT s.member_faction_id
          INTO v_successor
          FROM corp_board_seats s
          LEFT JOIN corp_shareholdings sh
            ON sh.corp_id = s.corp_id
           AND sh.holder_faction_id = s.member_faction_id
         WHERE s.corp_id = v_motion.corp_id
         ORDER BY (s.role = 'coo') DESC NULLS LAST,
                  COALESCE(sh.shares, 0) DESC,
                  s.joined_tick ASC
         LIMIT 1;

        IF v_successor IS NULL THEN
            v_outcome := 'survived';
        ELSE
            DELETE FROM corp_board_seats
             WHERE corp_id = v_motion.corp_id
               AND member_faction_id = v_successor;

            SELECT COALESCE(NULLIF(btrim(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, '')), ''),
                            faction_name, 'Outgoing CEO')
              INTO v_old_ceo_name FROM factions WHERE id = v_corp.owner_faction_id;
            SELECT COALESCE(NULLIF(btrim(COALESCE(leader_first_name, '') || ' ' || COALESCE(leader_last_name, '')), ''),
                            faction_name, 'New CEO')
              INTO v_new_ceo_name FROM factions WHERE id = v_successor;
            v_corp_name := v_corp.name;

            UPDATE entrepreneur_corps
               SET owner_faction_id = v_successor,
                   updated_at = now()
             WHERE id = v_motion.corp_id;

            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) - 2
             WHERE id = v_corp.owner_faction_id;
        END IF;
    END IF;

    IF v_outcome IN ('survived', 'failed_quorum') THEN
        UPDATE factions
           SET ent_reputation = COALESCE(ent_reputation, 0) + 3
         WHERE id = v_corp.owner_faction_id;

        SELECT * INTO v_filer FROM factions WHERE id = v_motion.filed_by_faction_id;
        IF v_filer.id IS NOT NULL THEN
            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) - 1
             WHERE id = v_motion.filed_by_faction_id;
        END IF;
    END IF;

    UPDATE corp_no_confidence_motions
       SET status = 'resolved', resolved_at_tick = v_tick,
           outcome = v_outcome,
           successor_faction_id = CASE WHEN v_outcome = 'ousted' THEN v_successor END
     WHERE id = p_motion_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_corp.owner_faction_id,
        CASE WHEN v_outcome = 'ousted'        THEN 'CEO Ousted by Board'
             WHEN v_outcome = 'failed_quorum' THEN 'Confidence Vote Failed Quorum'
             ELSE 'CEO Survived Confidence Vote' END,
        CASE WHEN v_outcome = 'ousted'
             THEN format('%s removed %s as CEO of %s; %s assumes the chair.',
                         'The board', COALESCE(v_old_ceo_name, 'the outgoing CEO'),
                         COALESCE(v_corp_name, v_corp.name),
                         COALESCE(v_new_ceo_name, 'the new CEO'))
             WHEN v_outcome = 'failed_quorum'
             THEN format('A no-confidence motion against the CEO of %s failed to meet quorum.', v_corp.name)
             ELSE format('The CEO of %s has survived a no-confidence motion.', v_corp.name) END,
        'corporate', 'corp_no_confidence_vote',
        jsonb_build_object(
            'corp_id', v_motion.corp_id, 'corp_name', v_corp.name,
            'motion_id', p_motion_id, 'outcome', v_outcome,
            'yes_shares', v_motion.yes_shares, 'no_shares', v_motion.no_shares,
            'total_eligible', v_total_shares, 'quorum_shares', v_quorum_shares,
            'successor_faction_id', v_successor
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success', true, 'outcome', v_outcome,
        'yes_shares', v_motion.yes_shares, 'no_shares', v_motion.no_shares,
        'total_eligible', v_total_shares, 'quorum_shares', v_quorum_shares,
        'successor_faction_id', v_successor
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_no_confidence_resolve(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_no_confidence_resolve(uuid) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
