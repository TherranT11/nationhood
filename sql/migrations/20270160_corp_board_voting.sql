-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — board voting infrastructure (Phase B: Join)
-- ════════════════════════════════════════════════════════════════════
-- Phase A (20270158) shipped the seats table + Leave Board. This is
-- the Join Board flow: a pending Pressing Issue voted on by the
-- current CEO + every current board member, snapshot at creation,
-- 51% YES threshold, auto-reject 3 ticks after creation if not passed.
--
-- Tables
--   corp_board_requests       — one row per application (pending /
--                               accepted / rejected). 7-seat cap and
--                               one-time-per-corp gate enforced at
--                               creation in corp_board_request_join.
--   corp_board_request_pool   — snapshot of eligible voters at creation
--                               (CEO + each current corp_board_seats).
--                               Voter membership does NOT recompute as
--                               the board changes during the vote
--                               (deterministic denominator).
--   corp_board_request_votes  — one row per (request, voter) recording
--                               their YES/NO. Non-voters at expiry are
--                               counted as NO by the auto-reject pass.
--
-- RPCs (SECURITY DEFINER; the tables have no client write policy)
--   corp_board_request_join(p_corp_id)        — creates the request +
--                                               snapshot pool, fires
--                                               the apply event.
--   corp_board_vote(p_request_id, p_yes)      — records vote; if YES
--                                               count crosses
--                                               ceil(pool * 0.51) the
--                                               accept finalises
--                                               atomically (seat row,
--                                               +1 rep applicant, +1
--                                               rep CEO, 1..6%% share-
--                                               price bump on public,
--                                               event).
--   finalize_expired_board_requests(p_tick)   — called from the tick
--                                               processor each tick;
--                                               marks every pending
--                                               request with
--                                               expires_tick ≤ p_tick
--                                               as rejected (no side
--                                               effects beyond the
--                                               event log).
--
-- One-time per corp: the gate is "any prior corp_board_requests row
-- exists for (applicant, corp)". So a past accept-then-leave, a past
-- rejection, and a past expiry all block reapply. Founders never go
-- through this flow (their seat is ownership of record, blocked
-- separately).
--
-- Conservation: rep is a smallint stat (not money); the share-price
-- bump only moves a numeric column, no cash flow. money_conserved
-- holds for the same reason it does in corp_board_leave (20270158).
-- Lock order on accept: corp row FIRST (consistent global order with
-- corp_trade / go_public / go_private / corp_board_leave).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Tables ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS corp_board_requests (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id               uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    applicant_faction_id  uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    status                text NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','accepted','rejected')),
    created_tick          int  NOT NULL,
    expires_tick          int  NOT NULL,
    finalized_tick        int
);

CREATE INDEX IF NOT EXISTS idx_corp_board_requests_corp_app
    ON corp_board_requests (corp_id, applicant_faction_id);
CREATE INDEX IF NOT EXISTS idx_corp_board_requests_pending
    ON corp_board_requests (expires_tick) WHERE status = 'pending';

ALTER TABLE corp_board_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON corp_board_requests;
CREATE POLICY "Allow select for all" ON corp_board_requests
    FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS corp_board_request_pool (
    request_id        uuid NOT NULL REFERENCES corp_board_requests(id) ON DELETE CASCADE,
    voter_faction_id  uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    PRIMARY KEY (request_id, voter_faction_id)
);
CREATE INDEX IF NOT EXISTS idx_corp_board_request_pool_voter
    ON corp_board_request_pool (voter_faction_id);

ALTER TABLE corp_board_request_pool ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON corp_board_request_pool;
CREATE POLICY "Allow select for all" ON corp_board_request_pool
    FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS corp_board_request_votes (
    request_id        uuid NOT NULL REFERENCES corp_board_requests(id) ON DELETE CASCADE,
    voter_faction_id  uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    vote              boolean NOT NULL,
    voted_at_tick     int     NOT NULL,
    PRIMARY KEY (request_id, voter_faction_id)
);

ALTER TABLE corp_board_request_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for all" ON corp_board_request_votes;
CREATE POLICY "Allow select for all" ON corp_board_request_votes
    FOR SELECT USING (true);

-- ── corp_board_request_join: file an application ────────────────────

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

    -- Board cap: 7 non-founder seats (8 total counting the Chairman).
    SELECT COUNT(*) INTO v_director_n FROM corp_board_seats
     WHERE corp_id = p_corp_id;
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

-- ── corp_board_vote: cast a YES or NO; may finalise accept ──────────

CREATE OR REPLACE FUNCTION public.corp_board_vote(p_request_id UUID, p_yes BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid        UUID := auth.uid();
    v_fac        factions%ROWTYPE;
    v_req        corp_board_requests%ROWTYPE;
    v_corp       entrepreneur_corps%ROWTYPE;
    v_tick       INT;
    v_pool_size  INT;
    v_yes_count  INT;
    v_threshold  INT;
    v_d6         INT;
    v_new_price  NUMERIC;
    v_finalised  BOOLEAN := FALSE;
    v_name       TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_yes IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Lock the request row first so concurrent votes serialise on it
    -- (prevents two YES votes from both crossing the threshold).
    SELECT * INTO v_req FROM corp_board_requests
     WHERE id = p_request_id
     FOR UPDATE;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_pending');
    END IF;

    -- Caller's entrepreneur faction (VERBATIM prelude).
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- Voter must be in the snapshot pool. Applicants are never pooled.
    IF NOT EXISTS (SELECT 1 FROM corp_board_request_pool
                    WHERE request_id = p_request_id
                      AND voter_faction_id = v_fac.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_eligible_voter');
    END IF;

    -- One vote per (request, voter).
    IF EXISTS (SELECT 1 FROM corp_board_request_votes
                WHERE request_id = p_request_id
                  AND voter_faction_id = v_fac.id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_voted');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO corp_board_request_votes (request_id, voter_faction_id, vote, voted_at_tick)
    VALUES (p_request_id, v_fac.id, p_yes, v_tick);

    -- Threshold check: ceil(pool * 0.51) YES votes. Only YES can
    -- trigger the accept; NO votes are recorded and only matter at
    -- expiry (when non-yes voters are all counted as NO).
    IF p_yes THEN
        SELECT COUNT(*) INTO v_pool_size FROM corp_board_request_pool
         WHERE request_id = p_request_id;
        SELECT COUNT(*) INTO v_yes_count FROM corp_board_request_votes
         WHERE request_id = p_request_id AND vote = TRUE;
        v_threshold := CEIL(v_pool_size::numeric * 0.51)::int;

        IF v_yes_count >= v_threshold THEN
            -- ── ACCEPT finalisation ─────────────────────────────────
            -- Lock the corp row (consistent global order) for the
            -- atomic seat insert + share-price bump + rep credits.
            SELECT * INTO v_corp FROM entrepreneur_corps
             WHERE id = v_req.corp_id
             FOR UPDATE;
            -- corp is guaranteed to exist (FK + ON DELETE CASCADE would
            -- have nuked the request); defensive recheck only.
            IF v_corp.id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
            END IF;

            -- Seat row. ON CONFLICT DO NOTHING is belt + suspenders;
            -- the application gate forbids prior membership.
            INSERT INTO corp_board_seats (corp_id, member_faction_id, joined_tick)
            VALUES (v_corp.id, v_req.applicant_faction_id, v_tick)
            ON CONFLICT (corp_id, member_faction_id) DO NOTHING;

            -- +1 reputation to the applicant.
            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) + 1
             WHERE id = v_req.applicant_faction_id;

            -- +1 reputation to the CEO (owner of record).
            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) + 1
             WHERE id = v_corp.owner_faction_id;

            -- 1..6%% share-price bump for public corps. Money flow
            -- unchanged (no cash moves); same column REVOKE bypass
            -- pattern as corp_board_leave's drop.
            v_d6 := NULL;
            v_new_price := v_corp.share_price;
            IF v_corp.listing = 'public' AND v_corp.share_price IS NOT NULL THEN
                v_d6        := floor(random() * 6)::int + 1;
                v_new_price := v_corp.share_price * (1 + v_d6::numeric / 100);
                UPDATE entrepreneur_corps
                   SET share_price = v_new_price
                 WHERE id = v_corp.id;
            END IF;

            UPDATE corp_board_requests
               SET status = 'accepted', finalized_tick = v_tick
             WHERE id = p_request_id;

            SELECT COALESCE(
                NULLIF(btrim(COALESCE(f.leader_first_name,'') || ' ' || COALESCE(f.leader_last_name,'')), ''),
                f.faction_name, 'An entrepreneur')
              INTO v_name
              FROM factions f WHERE f.id = v_req.applicant_faction_id;

            INSERT INTO event_log (
                nation_id, faction_id, event_name, description_used,
                category, trigger_key, effects_applied, fired_at_tick
            ) VALUES (
                v_corp.hq_nation_id, v_req.applicant_faction_id,
                'Board Appointment Confirmed',
                format('%s has been welcomed to the Board of Directors of %s.', v_name, v_corp.name),
                'corporate', 'corp_board_request_accepted',
                jsonb_build_object('corp_id', v_corp.id, 'corp_name', v_corp.name,
                                   'request_id', p_request_id, 'd6', v_d6,
                                   'new_price', v_new_price,
                                   'pool_size', v_pool_size, 'yes_count', v_yes_count),
                v_tick
            );

            v_finalised := TRUE;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success',   true,
        'finalised', v_finalised,
        'd6',        v_d6,
        'new_price', v_new_price
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.corp_board_vote(UUID, BOOLEAN) TO authenticated;

-- ── finalize_expired_board_requests: tick-processor expiry ──────────
-- Idempotent. Called once per tick from the advance-tick handler;
-- also safe to call lazily from any client (no effects on already-
-- finalised rows). Marks every pending request whose expires_tick
-- has passed as 'rejected'. No rep / share-price effects.

CREATE OR REPLACE FUNCTION public.finalize_expired_board_requests(p_tick INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r          RECORD;
    v_corp     entrepreneur_corps%ROWTYPE;
    v_name     TEXT;
    v_count    INT := 0;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tick');
    END IF;

    FOR r IN
        SELECT id, corp_id, applicant_faction_id
          FROM corp_board_requests
         WHERE status = 'pending' AND expires_tick <= p_tick
         FOR UPDATE
    LOOP
        UPDATE corp_board_requests
           SET status = 'rejected', finalized_tick = p_tick
         WHERE id = r.id;

        SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = r.corp_id;
        SELECT COALESCE(
            NULLIF(btrim(COALESCE(f.leader_first_name,'') || ' ' || COALESCE(f.leader_last_name,'')), ''),
            f.faction_name, 'An entrepreneur')
          INTO v_name
          FROM factions f WHERE f.id = r.applicant_faction_id;

        INSERT INTO event_log (
            nation_id, faction_id, event_name, description_used,
            category, trigger_key, effects_applied, fired_at_tick
        ) VALUES (
            v_corp.hq_nation_id, r.applicant_faction_id,
            'Board Application Declined',
            format('%s''s application to the Board of Directors of %s was declined.', v_name, COALESCE(v_corp.name, 'a corporation')),
            'corporate', 'corp_board_request_rejected',
            jsonb_build_object('corp_id', r.corp_id, 'request_id', r.id, 'reason', 'expired'),
            p_tick
        );
        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'rejected', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_expired_board_requests(INT) TO authenticated;

COMMENT ON FUNCTION public.corp_board_request_join(UUID) IS
    'File an application to join an entrepreneur corp''s board (Phase B). Owner can''t apply; one-time-per-corp; 7-seat cap. Snapshots CEO + current directors as the eligible-voter pool; expires 3 ticks later. Logs event_log row.';
COMMENT ON FUNCTION public.corp_board_vote(UUID, BOOLEAN) IS
    'Cast a YES/NO vote on a pending board-join request. Voter must be in the snapshot pool. YES votes that cross ceil(pool * 0.51) finalise the accept atomically: insert seat, +1 rep applicant, +1 rep CEO, 1..6%% share-price bump on public, event log.';
COMMENT ON FUNCTION public.finalize_expired_board_requests(INT) IS
    'Mark every pending corp_board_requests row with expires_tick ≤ p_tick as rejected. Called once per tick from advance-tick; idempotent + safe to call from any client as a safety net.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- DROP FUNCTION IF EXISTS public.corp_board_request_join(UUID);
-- DROP FUNCTION IF EXISTS public.corp_board_vote(UUID, BOOLEAN);
-- DROP FUNCTION IF EXISTS public.finalize_expired_board_requests(INT);
-- DROP TABLE  IF EXISTS corp_board_request_votes;
-- DROP TABLE  IF EXISTS corp_board_request_pool;
-- DROP TABLE  IF EXISTS corp_board_requests;
-- Safe in alpha (no data depending on these tables yet). corp_board_seats
-- (Phase A, 20270158) is left alone.
