-- ════════════════════════════════════════════════════════════════
-- Aligned Interest member-vote runtime.
--
-- Brings the Aligned Interest band (already shipped in 20260815)
-- under member control. Instead of auto-deriving the band from the
-- median of corp_interest_rates at ratification, the alliance now
-- votes on it: each member picks a Floor (1-5%) and a Ceiling
-- (6-10%); when each option crosses >50% of cast ballots, the band
-- updates on the NEXT tick.
--
-- Existing columns reused as-is — no new band stats:
--   strategic_alliances.aligned_interest_floor_apr   NUMERIC
--   strategic_alliances.aligned_interest_ceiling_apr NUMERIC
--
-- New tables:
--   alliance_interest_votes        — one row per vote cycle
--   alliance_interest_vote_ballots — one ballot per voter per vote
--   alliance_interest_vote_chat    — persistent per-alliance chat
--                                    surfaced inside the vote modal,
--                                    open to non-members as observers
--
-- New RPCs:
--   start_alliance_interest_vote(alliance_id)
--   cast_alliance_interest_vote(vote_id, floor, ceiling)
--   withdraw_alliance_interest_vote(vote_id)
--   post_alliance_interest_vote_message(alliance_id, body)
--
-- Tick-side helper (called from advance-tick footer):
--   sweep_alliance_interest_votes(p_tick) — auto-resolve, auto-
--     expire (30 ticks), auto-withdraw on initiator-left.
--
-- Re-issues ratify_strategic_alliance to skip the auto-derive on
-- 'aligned_interest' — band stays NULL until the first vote
-- resolves.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alliance_interest_votes (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alliance_id              UUID NOT NULL REFERENCES strategic_alliances(id) ON DELETE CASCADE,
    initiator_faction_id     UUID NOT NULL REFERENCES factions(id) ON DELETE RESTRICT,
    status                   TEXT NOT NULL DEFAULT 'open'
                                 CHECK (status IN ('open','resolved','withdrawn','expired')),
    opened_at_tick           INT  NOT NULL,
    expires_at_tick          INT  NOT NULL,
    -- Filled when the threshold is first crossed; the actual band
    -- write happens on the NEXT tick to satisfy the "resolves on
    -- next tick" rule. NULL while the vote is still gathering.
    pending_resolve_at_tick  INT,
    pending_floor_apr        NUMERIC,
    pending_ceiling_apr      NUMERIC,
    -- Stamped when status flips terminal. Mirrors the pending_*
    -- values for resolved votes; null for withdrawn/expired.
    resolved_at_tick         INT,
    winning_floor_apr        NUMERIC,
    winning_ceiling_apr      NUMERIC,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One open vote per alliance at a time. Resolved/withdrawn/expired
-- ones don't block — the unique index is partial.
CREATE UNIQUE INDEX IF NOT EXISTS idx_alliance_interest_votes_one_open
    ON alliance_interest_votes (alliance_id)
    WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_alliance_interest_votes_status_expires
    ON alliance_interest_votes (status, expires_at_tick);

CREATE TABLE IF NOT EXISTS alliance_interest_vote_ballots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vote_id             UUID NOT NULL REFERENCES alliance_interest_votes(id) ON DELETE CASCADE,
    voter_faction_id    UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    floor_choice        INT  NOT NULL CHECK (floor_choice   BETWEEN 1 AND 5),
    ceiling_choice      INT  NOT NULL CHECK (ceiling_choice BETWEEN 6 AND 10),
    cast_at_tick        INT  NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_alliance_interest_vote_ballots_one_per_voter
    ON alliance_interest_vote_ballots (vote_id, voter_faction_id);

-- Chat persists per-alliance, NOT per-vote — same channel survives
-- across vote cycles so the conversation history stays intact when
-- a vote resolves or expires and a new one opens.
CREATE TABLE IF NOT EXISTS alliance_interest_vote_chat (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alliance_id          UUID NOT NULL REFERENCES strategic_alliances(id) ON DELETE CASCADE,
    author_faction_id    UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    -- Snapshot of membership at post time so the OBSERVER tag stays
    -- accurate even after the author later joins/leaves.
    is_observer          BOOLEAN NOT NULL,
    is_system            BOOLEAN NOT NULL DEFAULT false,
    body                 TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
    posted_at_tick       INT  NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alliance_interest_vote_chat_alliance
    ON alliance_interest_vote_chat (alliance_id, created_at);

-- ── 2. RLS ───────────────────────────────────────────────────────
-- Reads are open to all authenticated (the modal needs to render
-- vote state + chat for observers). Writes go through the SECURITY
-- DEFINER RPCs below — no direct INSERT/UPDATE policies.

ALTER TABLE alliance_interest_votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_interest_vote_ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_interest_vote_chat    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aiv_read_all  ON alliance_interest_votes;
DROP POLICY IF EXISTS aivb_read_all ON alliance_interest_vote_ballots;
DROP POLICY IF EXISTS aivc_read_all ON alliance_interest_vote_chat;

CREATE POLICY aiv_read_all  ON alliance_interest_votes        FOR SELECT TO authenticated USING (true);
CREATE POLICY aivb_read_all ON alliance_interest_vote_ballots FOR SELECT TO authenticated USING (true);
CREATE POLICY aivc_read_all ON alliance_interest_vote_chat    FOR SELECT TO authenticated USING (true);


-- ── 3. Helper: is the caller an active member of an alliance? ───
CREATE OR REPLACE FUNCTION _alliance_caller_is_member(p_alliance_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller UUID := auth.uid();
BEGIN
    IF v_caller IS NULL THEN RETURN FALSE; END IF;
    RETURN EXISTS (
        SELECT 1
        FROM alliance_members am
        JOIN factions f ON f.id = am.faction_id
        WHERE am.alliance_id = p_alliance_id
          AND am.left_at_tick IS NULL
          AND (f.id = v_caller OR f.linked_user_id = v_caller)
    );
END;
$$;

CREATE OR REPLACE FUNCTION _alliance_caller_faction(p_alliance_id UUID)
RETURNS UUID
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller   UUID := auth.uid();
    v_faction  UUID;
BEGIN
    IF v_caller IS NULL THEN RETURN NULL; END IF;
    SELECT f.id INTO v_faction
    FROM alliance_members am
    JOIN factions f ON f.id = am.faction_id
    WHERE am.alliance_id = p_alliance_id
      AND am.left_at_tick IS NULL
      AND (f.id = v_caller OR f.linked_user_id = v_caller)
    LIMIT 1;
    RETURN v_faction;
END;
$$;


-- ── 4. start_alliance_interest_vote ──────────────────────────────
CREATE OR REPLACE FUNCTION start_alliance_interest_vote(p_alliance_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_faction       UUID;
    v_alliance      strategic_alliances%ROWTYPE;
    v_tick          INT;
    v_has_article   BOOLEAN;
    v_vote_id       UUID;
    v_window_ticks  INT := 30;  -- 30-tick auto-expiry per spec
BEGIN
    v_faction := _alliance_caller_faction(p_alliance_id);
    IF v_faction IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT * INTO v_alliance FROM strategic_alliances WHERE id = p_alliance_id;
    IF v_alliance.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'alliance_not_found');
    END IF;
    IF v_alliance.status <> 'active' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'alliance_not_active');
    END IF;

    -- Require Aligned Interest article ratified (active row).
    SELECT EXISTS (
        SELECT 1 FROM alliance_articles
        WHERE alliance_id = p_alliance_id
          AND article_id  = 'aligned_interest'
          AND COALESCE(status, 'active') = 'active'
    ) INTO v_has_article;
    IF NOT v_has_article THEN
        RETURN jsonb_build_object('success', false, 'reason', 'charter_not_unlocked');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    -- One open vote at a time. Partial unique index would also catch
    -- this, but returning a friendly reason is nicer than a 500.
    IF EXISTS (
        SELECT 1 FROM alliance_interest_votes
        WHERE alliance_id = p_alliance_id AND status = 'open'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'vote_already_open');
    END IF;

    INSERT INTO alliance_interest_votes (
        alliance_id, initiator_faction_id, status,
        opened_at_tick, expires_at_tick
    ) VALUES (
        p_alliance_id, v_faction, 'open',
        v_tick, v_tick + v_window_ticks
    ) RETURNING id INTO v_vote_id;

    -- System chat entry so observers see the vote opened.
    INSERT INTO alliance_interest_vote_chat (
        alliance_id, author_faction_id, is_observer, is_system,
        body, posted_at_tick
    ) VALUES (
        p_alliance_id, v_faction, false, true,
        format('Interest Rate vote opened. 30-tick window; majority on each of Floor (1-5%%) and Ceiling (6-10%%) closes the vote.'),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',         true,
        'vote_id',         v_vote_id,
        'expires_at_tick', v_tick + v_window_ticks
    );
END;
$$;

GRANT EXECUTE ON FUNCTION start_alliance_interest_vote(UUID) TO authenticated;


-- ── 5. cast_alliance_interest_vote ───────────────────────────────
CREATE OR REPLACE FUNCTION cast_alliance_interest_vote(
    p_vote_id UUID,
    p_floor   INT,
    p_ceiling INT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_vote     alliance_interest_votes%ROWTYPE;
    v_faction  UUID;
    v_tick     INT;
BEGIN
    IF p_floor   IS NULL OR p_floor   NOT BETWEEN 1 AND 5  THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_floor');
    END IF;
    IF p_ceiling IS NULL OR p_ceiling NOT BETWEEN 6 AND 10 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_ceiling');
    END IF;

    SELECT * INTO v_vote FROM alliance_interest_votes WHERE id = p_vote_id;
    IF v_vote.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'vote_not_found');
    END IF;
    IF v_vote.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'vote_not_open');
    END IF;

    v_faction := _alliance_caller_faction(v_vote.alliance_id);
    IF v_faction IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO alliance_interest_vote_ballots (
        vote_id, voter_faction_id, floor_choice, ceiling_choice, cast_at_tick
    ) VALUES (
        p_vote_id, v_faction, p_floor, p_ceiling, v_tick
    )
    ON CONFLICT (vote_id, voter_faction_id) DO UPDATE
        SET floor_choice   = EXCLUDED.floor_choice,
            ceiling_choice = EXCLUDED.ceiling_choice,
            cast_at_tick   = EXCLUDED.cast_at_tick,
            updated_at     = now();

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION cast_alliance_interest_vote(UUID, INT, INT) TO authenticated;


-- ── 6. withdraw_alliance_interest_vote (initiator only) ──────────
CREATE OR REPLACE FUNCTION withdraw_alliance_interest_vote(p_vote_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller   UUID := auth.uid();
    v_vote     alliance_interest_votes%ROWTYPE;
    v_faction  UUID;
    v_tick     INT;
BEGIN
    SELECT * INTO v_vote FROM alliance_interest_votes WHERE id = p_vote_id FOR UPDATE;
    IF v_vote.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'vote_not_found');
    END IF;
    IF v_vote.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'vote_not_open');
    END IF;

    -- Confirm caller owns the initiator faction (direct or linked).
    IF NOT EXISTS (
        SELECT 1 FROM factions f
        WHERE f.id = v_vote.initiator_faction_id
          AND (f.id = v_caller OR f.linked_user_id = v_caller)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_initiator');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE alliance_interest_votes
    SET status = 'withdrawn'
    WHERE id = p_vote_id;

    INSERT INTO alliance_interest_vote_chat (
        alliance_id, author_faction_id, is_observer, is_system,
        body, posted_at_tick
    ) VALUES (
        v_vote.alliance_id, v_vote.initiator_faction_id, false, true,
        'Interest Rate vote withdrawn by initiator.',
        v_tick
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION withdraw_alliance_interest_vote(UUID) TO authenticated;


-- ── 7. post_alliance_interest_vote_message ───────────────────────
-- Open to any authenticated user. Snapshots is_observer at post
-- time so the OBSERVER tag is stable through later joins/leaves.
CREATE OR REPLACE FUNCTION post_alliance_interest_vote_message(
    p_alliance_id UUID,
    p_body        TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_caller   UUID := auth.uid();
    v_faction  UUID;
    v_observer BOOLEAN;
    v_tick     INT;
    v_alliance UUID;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_body IS NULL OR char_length(trim(p_body)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'empty_body');
    END IF;

    SELECT id INTO v_alliance FROM strategic_alliances WHERE id = p_alliance_id;
    IF v_alliance IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'alliance_not_found');
    END IF;

    -- Resolve the caller's faction. Members post under their member
    -- faction; observers fall back to whichever faction the auth.uid
    -- maps to (direct id or linked corp), or any owned corp/party.
    v_faction := _alliance_caller_faction(p_alliance_id);
    v_observer := (v_faction IS NULL);
    IF v_observer THEN
        SELECT f.id INTO v_faction
        FROM factions f
        WHERE f.id = v_caller OR f.linked_user_id = v_caller
        ORDER BY f.created_at DESC
        LIMIT 1;
        IF v_faction IS NULL THEN
            RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
        END IF;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO alliance_interest_vote_chat (
        alliance_id, author_faction_id, is_observer, is_system,
        body, posted_at_tick
    ) VALUES (
        p_alliance_id, v_faction, v_observer, false,
        substring(trim(p_body) FROM 1 FOR 1000),
        v_tick
    );

    RETURN jsonb_build_object('success', true, 'is_observer', v_observer);
END;
$$;

GRANT EXECUTE ON FUNCTION post_alliance_interest_vote_message(UUID, TEXT) TO authenticated;


-- ── 8. sweep_alliance_interest_votes ─────────────────────────────
-- Per-tick housekeeping: resolve, expire, auto-withdraw. Called from
-- advance-tick footer (see handler-template change below).
CREATE OR REPLACE FUNCTION sweep_alliance_interest_votes(p_tick INT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_vote          RECORD;
    v_total_ballots INT;
    v_floor_winner  INT;
    v_ceiling_winner INT;
    v_floor_count   INT;
    v_ceiling_count INT;
    v_resolved      INT := 0;
    v_expired       INT := 0;
    v_initiator_left INT := 0;
    v_finalized     INT := 0;
BEGIN
    -- Pass A: finalize votes whose resolution was scheduled on a
    -- prior tick (the "resolves on next tick" rule). Apply the band,
    -- close the vote, post a system chat entry.
    FOR v_vote IN
        SELECT *
        FROM alliance_interest_votes
        WHERE status = 'open'
          AND pending_resolve_at_tick IS NOT NULL
          AND p_tick > pending_resolve_at_tick
    LOOP
        UPDATE strategic_alliances
        SET aligned_interest_floor_apr   = v_vote.pending_floor_apr,
            aligned_interest_ceiling_apr = v_vote.pending_ceiling_apr
        WHERE id = v_vote.alliance_id;

        UPDATE alliance_interest_votes
        SET status              = 'resolved',
            resolved_at_tick    = p_tick,
            winning_floor_apr   = v_vote.pending_floor_apr,
            winning_ceiling_apr = v_vote.pending_ceiling_apr
        WHERE id = v_vote.id;

        INSERT INTO alliance_interest_vote_chat (
            alliance_id, author_faction_id, is_observer, is_system,
            body, posted_at_tick
        ) VALUES (
            v_vote.alliance_id, v_vote.initiator_faction_id, false, true,
            format('Interest Rate vote resolved. Band: Floor %s%%, Ceiling %s%%.',
                v_vote.pending_floor_apr, v_vote.pending_ceiling_apr),
            p_tick
        );

        v_finalized := v_finalized + 1;
    END LOOP;

    -- Pass B: open votes — check the >50% threshold on both Floor
    -- and Ceiling. If both cross, schedule resolution for next tick.
    -- Skip votes where pending_resolve is already set (they're
    -- waiting for Pass A on a future tick).
    FOR v_vote IN
        SELECT *
        FROM alliance_interest_votes
        WHERE status = 'open'
          AND pending_resolve_at_tick IS NULL
    LOOP
        SELECT count(*) INTO v_total_ballots
        FROM alliance_interest_vote_ballots WHERE vote_id = v_vote.id;

        IF v_total_ballots = 0 THEN
            CONTINUE;
        END IF;

        -- Top floor option + its tally.
        SELECT floor_choice, count(*)
        INTO v_floor_winner, v_floor_count
        FROM alliance_interest_vote_ballots
        WHERE vote_id = v_vote.id
        GROUP BY floor_choice
        ORDER BY count(*) DESC, floor_choice ASC
        LIMIT 1;

        SELECT ceiling_choice, count(*)
        INTO v_ceiling_winner, v_ceiling_count
        FROM alliance_interest_vote_ballots
        WHERE vote_id = v_vote.id
        GROUP BY ceiling_choice
        ORDER BY count(*) DESC, ceiling_choice ASC
        LIMIT 1;

        -- Strict >50% gate on each axis independently.
        IF v_floor_count   * 2 > v_total_ballots
           AND v_ceiling_count * 2 > v_total_ballots THEN
            UPDATE alliance_interest_votes
            SET pending_resolve_at_tick = p_tick,
                pending_floor_apr       = v_floor_winner,
                pending_ceiling_apr     = v_ceiling_winner
            WHERE id = v_vote.id;

            INSERT INTO alliance_interest_vote_chat (
                alliance_id, author_faction_id, is_observer, is_system,
                body, posted_at_tick
            ) VALUES (
                v_vote.alliance_id, v_vote.initiator_faction_id, false, true,
                format('Majority reached: Floor %s%%, Ceiling %s%%. Band updates next tick.',
                    v_floor_winner, v_ceiling_winner),
                p_tick
            );

            v_resolved := v_resolved + 1;
        END IF;
    END LOOP;

    -- Pass C: auto-withdraw votes whose initiator has left the
    -- alliance (left_at_tick set on their member row, no other
    -- active row for this alliance).
    FOR v_vote IN
        SELECT v.*
        FROM alliance_interest_votes v
        WHERE v.status = 'open'
          AND NOT EXISTS (
              SELECT 1
              FROM alliance_members am
              WHERE am.alliance_id = v.alliance_id
                AND am.faction_id  = v.initiator_faction_id
                AND am.left_at_tick IS NULL
          )
    LOOP
        UPDATE alliance_interest_votes
        SET status = 'withdrawn', resolved_at_tick = p_tick
        WHERE id = v_vote.id;

        INSERT INTO alliance_interest_vote_chat (
            alliance_id, author_faction_id, is_observer, is_system,
            body, posted_at_tick
        ) VALUES (
            v_vote.alliance_id, v_vote.initiator_faction_id, false, true,
            'Interest Rate vote auto-withdrawn: initiator left the alliance.',
            p_tick
        );

        v_initiator_left := v_initiator_left + 1;
    END LOOP;

    -- Pass D: auto-expire open votes past their 30-tick window.
    FOR v_vote IN
        SELECT *
        FROM alliance_interest_votes
        WHERE status = 'open'
          AND p_tick >= expires_at_tick
    LOOP
        UPDATE alliance_interest_votes
        SET status = 'expired', resolved_at_tick = p_tick
        WHERE id = v_vote.id;

        INSERT INTO alliance_interest_vote_chat (
            alliance_id, author_faction_id, is_observer, is_system,
            body, posted_at_tick
        ) VALUES (
            v_vote.alliance_id, v_vote.initiator_faction_id, false, true,
            'Interest Rate vote expired without reaching majority.',
            p_tick
        );

        v_expired := v_expired + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'finalized',      v_finalized,
        'newly_majority', v_resolved,
        'expired',        v_expired,
        'initiator_left', v_initiator_left
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION sweep_alliance_interest_votes(INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION sweep_alliance_interest_votes(INT) TO service_role;


-- ── 9. ratify_strategic_alliance — drop auto-derive on aligned_interest ──
-- The vote is now the source of truth for the band; ratification
-- leaves it NULL until the first vote resolves.
CREATE OR REPLACE FUNCTION ratify_strategic_alliance(
    p_founder_faction_id UUID,
    p_alliance_id        UUID,
    p_article_name       TEXT,
    p_article_kind       TEXT,
    p_article_body       TEXT,
    p_cartel_score       NUMERIC,
    p_chs_bonus          NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_founder    factions%ROWTYPE;
    v_alliance   strategic_alliances%ROWTYPE;
    v_member_n   INT;
    v_voted_n    INT;
    v_distinct_n INT;
    v_consensus  TEXT;
    v_tick       INT;
BEGIN
    v_founder := _alliance_owner_faction(p_founder_faction_id);
    IF v_founder.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    SELECT * INTO v_alliance FROM strategic_alliances WHERE id = p_alliance_id FOR UPDATE;
    IF v_alliance.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alliance not found');
    END IF;
    IF v_alliance.founder_faction_id <> p_founder_faction_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the founder can ratify');
    END IF;
    IF v_alliance.status <> 'negotiating' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alliance is not in negotiation');
    END IF;

    SELECT count(*) INTO v_member_n
    FROM alliance_members WHERE alliance_id = p_alliance_id AND left_at_tick IS NULL;

    SELECT count(*), count(DISTINCT article_id)
    INTO v_voted_n, v_distinct_n
    FROM alliance_negotiation_votes WHERE alliance_id = p_alliance_id;

    IF v_voted_n < v_member_n THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Awaiting %s more vote(s) before ratification', v_member_n - v_voted_n));
    END IF;
    IF v_distinct_n <> 1 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Members are split — all must vote on the same article');
    END IF;

    SELECT article_id INTO v_consensus
    FROM alliance_negotiation_votes WHERE alliance_id = p_alliance_id LIMIT 1;

    IF p_article_kind IS NULL OR p_article_kind NOT IN ('cooperative','coordinating','cartel') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid article kind');
    END IF;
    p_cartel_score := LEAST(10::numeric, GREATEST(0::numeric, COALESCE(p_cartel_score, 0)));
    p_chs_bonus    := LEAST(10::numeric, GREATEST(0::numeric, COALESCE(p_chs_bonus,   0)));

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE strategic_alliances
    SET status = 'active',
        founded_at_tick = v_tick,
        cohesion = LEAST(10::numeric, COALESCE(cohesion, 0) + p_chs_bonus)
    WHERE id = p_alliance_id;

    INSERT INTO alliance_articles (
        alliance_id, article_id, article_name, article_kind, article_body,
        cartel_score, chs_bonus, ratified_at_tick
    ) VALUES (
        p_alliance_id, v_consensus, p_article_name, p_article_kind, p_article_body,
        p_cartel_score, p_chs_bonus, v_tick
    );

    DELETE FROM alliance_negotiation_votes WHERE alliance_id = p_alliance_id;

    -- aligned_interest band is no longer auto-derived here; the
    -- charter is unlocked, but the actual band stays NULL until
    -- members run start_alliance_interest_vote and a majority on
    -- both Floor and Ceiling resolves.

    RETURN jsonb_build_object('success', true, 'article_id', v_consensus);
END;
$$;

GRANT EXECUTE ON FUNCTION ratify_strategic_alliance(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC) TO authenticated;


NOTIFY pgrst, 'reload schema';

COMMIT;
