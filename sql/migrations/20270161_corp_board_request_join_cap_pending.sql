-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — corp_board_request_join: combined seat+pending cap
-- ════════════════════════════════════════════════════════════════════
-- Second-pass audit fix for 20270160. The original gate counted only
-- corp_board_seats against the 7-cap:
--
--     SELECT COUNT(*) INTO v_director_n FROM corp_board_seats
--      WHERE corp_id = p_corp_id;
--     IF v_director_n >= 7 THEN return board_full;
--
-- Two concurrent applications could both pass that check (because a
-- pending request adds zero rows to corp_board_seats), so when both
-- finalised they'd produce 8 seated directors — over the spec'd cap.
-- The race needs a near-full board + two near-overlapping accepts,
-- so it's low-probability in alpha, but it's a real correctness gap.
--
-- Fix: count seated directors PLUS pending requests against the 7
-- cap at request creation. The corp row is FOR UPDATE'd above this
-- check (matches the global-order convention of corp_trade / go_public
-- / go_private / corp_board_leave), so concurrent join applications
-- on the same corp serialise on the corp lock and see each other's
-- just-created pending rows — the count is stable.
--
-- Signature unchanged → plain CREATE OR REPLACE, no DROP. Body is
-- LOGICALLY identical to 20270160's function except for the two SELECT
-- COUNTs and a comment. No new columns / indexes / RLS. Idempotent.
-- Should be applied alongside 20270160 (order doesn't matter — this
-- supersedes 20270160's function body; both migrations write to the
-- same function).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

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

    -- Corp row FIRST — consistent global order with corp_trade /
    -- go_public / go_private / corp_board_leave.
    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Caller's entrepreneur faction. VERBATIM the prelude in
    -- found_entrepreneur_corp / corp_trade / go_public / go_private /
    -- corp_board_leave — keep the set in sync.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- Founders are implicit Chairman — not applicants.
    IF v_corp.owner_faction_id = v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'founder_cannot_apply');
    END IF;

    -- Already a director (Phase A seats).
    IF EXISTS (SELECT 1 FROM corp_board_seats
                WHERE corp_id = p_corp_id AND member_faction_id = v_fac.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_on_board');
    END IF;

    -- One-time per corp: any prior request (pending/accepted/rejected)
    -- for this (applicant, corp) blocks a new application.
    IF EXISTS (SELECT 1 FROM corp_board_requests
                WHERE corp_id = p_corp_id AND applicant_faction_id = v_fac.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_applied');
    END IF;

    -- Board cap: 7 non-founder seats. Count seated directors AND
    -- pending applications together (20270161). The corp row is
    -- locked above so concurrent join applications on this corp
    -- serialise and see each other's just-created pending rows; a
    -- pending request reserves a slot until it accepts or rejects.
    SELECT COUNT(*) INTO v_director_n FROM corp_board_seats
     WHERE corp_id = p_corp_id;
    SELECT v_director_n + COUNT(*) INTO v_director_n FROM corp_board_requests
     WHERE corp_id = p_corp_id AND status = 'pending';
    IF v_director_n >= 7 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'board_full');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Create the request.
    INSERT INTO corp_board_requests (corp_id, applicant_faction_id, created_tick, expires_tick)
    VALUES (p_corp_id, v_fac.id, v_tick, v_tick + 3)
    RETURNING id INTO v_request_id;

    -- Snapshot the eligible-voter pool: CEO + every current director.
    -- The applicant is NEVER in the pool.
    INSERT INTO corp_board_request_pool (request_id, voter_faction_id)
    VALUES (v_request_id, v_corp.owner_faction_id);

    INSERT INTO corp_board_request_pool (request_id, voter_faction_id)
    SELECT v_request_id, member_faction_id
      FROM corp_board_seats
     WHERE corp_id = p_corp_id
       AND member_faction_id <> v_corp.owner_faction_id;  -- defensive (CEO is implicit)

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

COMMENT ON FUNCTION public.corp_board_request_join(UUID) IS
    'File an application to join an entrepreneur corp''s board (Phase B, 20270161: cap counts seated + pending). Owner can''t apply; one-time-per-corp; 7-director cap including pending. Snapshots CEO + current directors as the eligible-voter pool; expires 3 ticks later. Logs event_log row.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270160 (seated-only cap; re-opens the two-concurrent-
-- accept race that can push the board past 7 directors).
