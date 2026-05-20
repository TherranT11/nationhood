-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — CEO No-Confidence Vote
-- ════════════════════════════════════════════════════════════════════
-- A board member files a no-confidence motion against the CEO of a
-- public corp. Eligible voters (any holder with shares > 0 at the
-- moment of filing) vote YES (oust) or NO (keep) weighted by their
-- shares-at-open snapshot. Motion runs for 3 ticks; resolves at
-- expiry.
--
-- ── Pass condition ──────────────────────────────────────────────────
--   YES > NO  (strict — tie loses, CEO survives)
--   AND  YES + NO  >=  CEIL(0.30 × snapshot_held_shares)   (quorum)
--
-- ── Outcomes ────────────────────────────────────────────────────────
--   ousted          CEO loses chair. Successor = highest-share faction
--                   on the board (tie-break oldest joined_tick).
--                   CEO ent_reputation -2.  Caller: no change.
--                   Successor's seat row is deleted (they become the
--                   new implicit Chairman / owner_faction_id).
--   survived        Pass condition false WITH quorum.  CEO +3 rep;
--                   caller -1 rep.
--   failed_quorum   Pass condition false WITHOUT quorum.  Same rep
--                   deltas as survived — outcome differs only for the
--                   event-log narrative.
--
-- ── Cooldown ────────────────────────────────────────────────────────
--   After a survived/failed_quorum outcome, the corp gets 3 ticks of
--   immunity for THIS CEO. Derived from the last resolved motion
--   against the current owner_faction_id (no extra column on
--   entrepreneur_corps — ONE SOURCE).  An oust naturally clears the
--   shield because the new CEO has no prior motions on their record.
--
-- ── Vote weight ─────────────────────────────────────────────────────
--   Snapshot at motion-open via corp_no_confidence_eligibility — one
--   row per holder with shares > 0 at file-time. Trading during the
--   window (corp_trade) does NOT change weights. Vote-changing IS
--   allowed until expiry (the resolve check at expiry is the gate).
--
-- ── Resolution timing ───────────────────────────────────────────────
--   Resolve only at expiry. NO mid-window early-resolve: vote-change
--   is allowed so "math-locked" is not actually locked. The single-
--   row RPC (corp_no_confidence_resolve) is idempotent + callable by
--   anyone (the client flushes expired motions on page-load). The
--   bulk finalizer (finalize_expired_no_confidence_motions) mirrors
--   finalize_expired_board_requests — ready for an advance-tick hook
--   when we touch js/game next, but not required for v1.
--
-- ── Storage ─────────────────────────────────────────────────────────
--   corp_no_confidence_motions      — one row per motion + cached
--                                     tally + outcome.
--   corp_no_confidence_eligibility  — share-weight snapshot at open.
--   corp_no_confidence_votes        — actual YES/NO cast (PK on
--                                     (motion_id, voter); UPSERT for
--                                     vote-change).
--
-- ── Lock order ──────────────────────────────────────────────────────
--   Always corp row first (consistent global order with corp_trade /
--   corp_dividend / corp_board_*).  Motion row locks come second.
--   Faction prelude VERBATIM the rest of the entrepreneur set.
--
-- Idempotent migration (CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE
-- FUNCTION). No schema changes outside the new tables.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Tables ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS corp_no_confidence_motions (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id               uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    caller_faction_id     uuid NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    ceo_faction_id        uuid NOT NULL REFERENCES factions(id),
    opened_tick           int  NOT NULL,
    expiry_tick           int  NOT NULL,
    status                text NOT NULL DEFAULT 'open'
                          CHECK (status IN ('open','resolved')),
    outcome               text
                          CHECK (outcome IN ('survived','failed_quorum','ousted')),
    snapshot_held_shares  bigint NOT NULL CHECK (snapshot_held_shares > 0),
    yes_shares            bigint NOT NULL DEFAULT 0 CHECK (yes_shares >= 0),
    no_shares             bigint NOT NULL DEFAULT 0 CHECK (no_shares  >= 0),
    successor_faction_id  uuid REFERENCES factions(id),
    resolved_at_tick      int
);

-- One open motion per corp at any time. Partial unique index — the
-- gate IS the schema (no race condition possible between concurrent
-- file calls; the second loses the PK).
CREATE UNIQUE INDEX IF NOT EXISTS uq_cnc_one_open_per_corp
    ON corp_no_confidence_motions (corp_id) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_cnc_motions_corp_status
    ON corp_no_confidence_motions (corp_id, status);
CREATE INDEX IF NOT EXISTS idx_cnc_motions_open_expiry
    ON corp_no_confidence_motions (expiry_tick) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS corp_no_confidence_eligibility (
    motion_id        uuid   NOT NULL REFERENCES corp_no_confidence_motions(id) ON DELETE CASCADE,
    voter_faction_id uuid   NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    shares_at_open   bigint NOT NULL CHECK (shares_at_open > 0),
    PRIMARY KEY (motion_id, voter_faction_id)
);

CREATE TABLE IF NOT EXISTS corp_no_confidence_votes (
    motion_id        uuid    NOT NULL REFERENCES corp_no_confidence_motions(id) ON DELETE CASCADE,
    voter_faction_id uuid    NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    vote             boolean NOT NULL,
    cast_at_tick     int     NOT NULL,
    PRIMARY KEY (motion_id, voter_faction_id)
);

COMMENT ON TABLE corp_no_confidence_motions IS
    'One row per no-confidence motion. Cached tally (yes_shares/no_shares) updated by corp_no_confidence_vote so resolve doesn''t re-aggregate. RPC-write-only (RLS SELECT-all, no write policy).';
COMMENT ON TABLE corp_no_confidence_eligibility IS
    'Share-weight snapshot at motion-open. One row per holder of corp_shareholdings.shares > 0 at file-time. Vote-weight SoT — corp_trade during the window does not change it.';
COMMENT ON TABLE corp_no_confidence_votes IS
    'YES/NO votes on a motion. PK (motion_id, voter_faction_id) — one vote per voter; UPSERT for vote-change until expiry.';

-- ── RLS ─────────────────────────────────────────────────────────────

ALTER TABLE corp_no_confidence_motions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE corp_no_confidence_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE corp_no_confidence_votes       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON corp_no_confidence_motions;
CREATE POLICY "Allow select for all" ON corp_no_confidence_motions     FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow select for all" ON corp_no_confidence_eligibility;
CREATE POLICY "Allow select for all" ON corp_no_confidence_eligibility FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow select for all" ON corp_no_confidence_votes;
CREATE POLICY "Allow select for all" ON corp_no_confidence_votes       FOR SELECT USING (true);
-- No write policies. RPCs (SECURITY DEFINER) are the only mutate path.

-- ════════════════════════════════════════════════════════════════════
-- corp_no_confidence_file — file a motion against the CEO
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.corp_no_confidence_file(p_corp_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid             UUID := auth.uid();
    v_fac             factions%ROWTYPE;
    v_corp            entrepreneur_corps%ROWTYPE;
    v_tick            INT;
    v_cooldown_until  INT;
    v_held_sum        BIGINT;
    v_n_holders       INT;
    v_seat_count      INT;
    v_motion_id       UUID;
    v_ceo_name        TEXT;
    v_caller_name     TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Corp row FIRST — consistent global lock order.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.listing <> 'public' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_public');
    END IF;

    -- Faction guard (verbatim the rest of the entrepreneur set —
    -- keep the set in sync).
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- CEO cannot file against themselves.
    IF v_corp.owner_faction_id = v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'is_ceo');
    END IF;

    -- Caller must hold a board seat (founder is implicit / never in
    -- corp_board_seats, so this naturally excludes the CEO too).
    IF NOT EXISTS (
        SELECT 1 FROM corp_board_seats
         WHERE corp_id = p_corp_id AND member_faction_id = v_fac.id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_director');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Cooldown derived from the last resolved motion against THIS CEO.
    -- An oust resets the shield because the new CEO has no history.
    SELECT COALESCE(MAX(resolved_at_tick), -999) + 3 INTO v_cooldown_until
      FROM corp_no_confidence_motions
     WHERE corp_id = p_corp_id
       AND outcome IN ('survived','failed_quorum')
       AND ceo_faction_id = v_corp.owner_faction_id;
    IF v_tick < v_cooldown_until THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown_active',
            'cooldown_until_tick', v_cooldown_until);
    END IF;

    -- One open motion per corp. The partial unique index above is the
    -- hard gate; this read returns a clean error before the INSERT.
    IF EXISTS (SELECT 1 FROM corp_no_confidence_motions
                WHERE corp_id = p_corp_id AND status = 'open') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'motion_already_open');
    END IF;

    -- Successor eligibility: at least one OTHER board seat must exist.
    -- The caller is themselves a seat row, so a seat-count >= 1 means
    -- at least the caller could inherit. (The caller may not be the
    -- highest-share board member, but SOME successor exists.)
    SELECT COUNT(*) INTO v_seat_count FROM corp_board_seats WHERE corp_id = p_corp_id;
    IF v_seat_count < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_eligible_successor');
    END IF;

    -- Snapshot eligible voters and their weights.
    SELECT COALESCE(SUM(shares), 0)::bigint, COUNT(*)
      INTO v_held_sum, v_n_holders
      FROM corp_shareholdings
     WHERE corp_id = p_corp_id AND shares > 0;
    IF v_held_sum < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_holders');
    END IF;

    -- Open the motion.
    INSERT INTO corp_no_confidence_motions
        (corp_id, caller_faction_id, ceo_faction_id, opened_tick, expiry_tick,
         status, snapshot_held_shares)
    VALUES
        (p_corp_id, v_fac.id, v_corp.owner_faction_id, v_tick, v_tick + 3,
         'open', v_held_sum)
    RETURNING id INTO v_motion_id;

    -- Populate eligibility (vote-weight snapshot).
    INSERT INTO corp_no_confidence_eligibility (motion_id, voter_faction_id, shares_at_open)
    SELECT v_motion_id, holder_faction_id, shares
      FROM corp_shareholdings
     WHERE corp_id = p_corp_id AND shares > 0;

    -- Event log.
    SELECT COALESCE(NULLIF(btrim(COALESCE(leader_first_name,'') || ' ' || COALESCE(leader_last_name,'')), ''),
                    faction_name, 'A director')
      INTO v_caller_name FROM factions WHERE id = v_fac.id;
    SELECT COALESCE(NULLIF(btrim(COALESCE(leader_first_name,'') || ' ' || COALESCE(leader_last_name,'')), ''),
                    faction_name, 'the CEO')
      INTO v_ceo_name FROM factions WHERE id = v_corp.owner_faction_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used, category,
        trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'No-Confidence Motion Filed',
        format('%s filed a no-confidence motion against %s of %s. Voting closes in 3 ticks.',
               v_caller_name, v_ceo_name, v_corp.name),
        'corporate', 'corp_no_confidence_filed',
        jsonb_build_object(
            'motion_id',            v_motion_id,
            'corp_id',              p_corp_id,
            'corp_name',            v_corp.name,
            'caller_id',            v_fac.id,
            'ceo_id',               v_corp.owner_faction_id,
            'opened_tick',          v_tick,
            'expiry_tick',          v_tick + 3,
            'snapshot_held_shares', v_held_sum,
            'n_holders',            v_n_holders
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',              true,
        'motion_id',            v_motion_id,
        'opened_tick',          v_tick,
        'expiry_tick',          v_tick + 3,
        'snapshot_held_shares', v_held_sum,
        'n_holders',            v_n_holders
    );
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- corp_no_confidence_vote — cast / change a vote
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.corp_no_confidence_vote(p_motion_id UUID, p_yes BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid           UUID := auth.uid();
    v_fac           factions%ROWTYPE;
    v_motion        corp_no_confidence_motions%ROWTYPE;
    v_corp          entrepreneur_corps%ROWTYPE;
    v_tick          INT;
    v_weight        BIGINT;
    v_existing      BOOLEAN;  -- prior vote value (NULL if first vote)
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_motion_id IS NULL OR p_yes IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_input');
    END IF;

    -- Lock motion first (its corp row is locked next; both writes
    -- live on the motion table, so this order is fine — and is the
    -- only locking we need on this RPC since corp_dividend / trade do
    -- not touch motion rows).
    SELECT * INTO v_motion FROM corp_no_confidence_motions
     WHERE id = p_motion_id FOR UPDATE;
    IF v_motion.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'motion_not_found');
    END IF;
    IF v_motion.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'motion_closed');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    -- Belt + suspenders: if the client somehow calls vote after expiry,
    -- reject rather than mutate a stale tally. The resolver will close
    -- the motion shortly.
    IF v_tick >= v_motion.expiry_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'voting_closed');
    END IF;

    -- Faction guard.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    -- Snapshot weight for this voter at motion-open.
    SELECT shares_at_open INTO v_weight
      FROM corp_no_confidence_eligibility
     WHERE motion_id = p_motion_id AND voter_faction_id = v_fac.id;
    IF v_weight IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_eligible');
    END IF;

    -- Look up prior vote (if any) so we can back it out of the tally.
    SELECT vote INTO v_existing
      FROM corp_no_confidence_votes
     WHERE motion_id = p_motion_id AND voter_faction_id = v_fac.id;

    -- Short-circuit no-ops: same vote being recast.
    IF v_existing IS NOT NULL AND v_existing = p_yes THEN
        RETURN jsonb_build_object(
            'success',  true,
            'unchanged', true,
            'vote',      p_yes,
            'yes_shares', v_motion.yes_shares,
            'no_shares',  v_motion.no_shares,
            'snapshot_held_shares', v_motion.snapshot_held_shares,
            'expiry_tick', v_motion.expiry_tick
        );
    END IF;

    -- Back out old vote, apply new. Atomic within this txn.
    IF v_existing IS TRUE THEN
        UPDATE corp_no_confidence_motions
           SET yes_shares = yes_shares - v_weight
         WHERE id = p_motion_id;
    ELSIF v_existing IS FALSE THEN
        UPDATE corp_no_confidence_motions
           SET no_shares  = no_shares  - v_weight
         WHERE id = p_motion_id;
    END IF;

    INSERT INTO corp_no_confidence_votes (motion_id, voter_faction_id, vote, cast_at_tick)
    VALUES (p_motion_id, v_fac.id, p_yes, v_tick)
    ON CONFLICT (motion_id, voter_faction_id)
       DO UPDATE SET vote = excluded.vote, cast_at_tick = excluded.cast_at_tick;

    IF p_yes THEN
        UPDATE corp_no_confidence_motions
           SET yes_shares = yes_shares + v_weight
         WHERE id = p_motion_id
        RETURNING * INTO v_motion;
    ELSE
        UPDATE corp_no_confidence_motions
           SET no_shares  = no_shares  + v_weight
         WHERE id = p_motion_id
        RETURNING * INTO v_motion;
    END IF;

    -- Event log (a tally event, not a per-vote disclosure — voter +
    -- weight in the payload is fine since the votes table is
    -- SELECT-all anyway).
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_motion.corp_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used, category,
        trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        CASE WHEN v_existing IS NULL THEN 'No-Confidence Vote Cast'
                                     ELSE 'No-Confidence Vote Changed' END,
        format('A vote of %s was %s on the no-confidence motion against %s.',
               CASE WHEN p_yes THEN 'YES' ELSE 'NO' END,
               CASE WHEN v_existing IS NULL THEN 'cast' ELSE 'changed' END,
               v_corp.name),
        'corporate', 'corp_no_confidence_vote',
        jsonb_build_object(
            'motion_id',   p_motion_id,
            'voter_id',    v_fac.id,
            'vote',        p_yes,
            'weight',      v_weight,
            'changed',     v_existing IS NOT NULL,
            'yes_shares',  v_motion.yes_shares,
            'no_shares',   v_motion.no_shares
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',              true,
        'vote',                 p_yes,
        'weight',               v_weight,
        'changed',              v_existing IS NOT NULL,
        'yes_shares',           v_motion.yes_shares,
        'no_shares',            v_motion.no_shares,
        'snapshot_held_shares', v_motion.snapshot_held_shares,
        'expiry_tick',          v_motion.expiry_tick
    );
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- corp_no_confidence_resolve — close a single expired motion
-- ════════════════════════════════════════════════════════════════════
-- Idempotent: callable from anywhere (client flush, bulk finalizer,
-- future advance-tick hook). Re-entrant calls on a resolved motion
-- return the current state without mutating.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.corp_no_confidence_resolve(p_motion_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_motion       corp_no_confidence_motions%ROWTYPE;
    v_corp         entrepreneur_corps%ROWTYPE;
    v_tick         INT;
    v_quorum_thr   BIGINT;
    v_quorum_met   BOOLEAN;
    v_pass         BOOLEAN;
    v_outcome      TEXT;
    v_successor    UUID;
    v_old_ceo_name TEXT;
    v_new_ceo_name TEXT;
    v_caller_name  TEXT;
    v_d            TEXT;
BEGIN
    IF p_motion_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'motion_not_found');
    END IF;

    -- Lock motion row.
    SELECT * INTO v_motion FROM corp_no_confidence_motions
     WHERE id = p_motion_id FOR UPDATE;
    IF v_motion.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'motion_not_found');
    END IF;

    -- Idempotent: already resolved → return current state.
    IF v_motion.status = 'resolved' THEN
        RETURN jsonb_build_object(
            'success',         true,
            'already_resolved', true,
            'outcome',         v_motion.outcome,
            'successor_id',    v_motion.successor_faction_id,
            'yes_shares',      v_motion.yes_shares,
            'no_shares',       v_motion.no_shares,
            'snapshot_held_shares', v_motion.snapshot_held_shares,
            'resolved_at_tick', v_motion.resolved_at_tick
        );
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_tick < v_motion.expiry_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_yet',
            'expiry_tick', v_motion.expiry_tick, 'current_tick', v_tick);
    END IF;

    -- Lock corp row (we may rotate ownership and write rep deltas).
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_motion.corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        -- Corp was deleted between file and resolve. Mark motion as
        -- resolved/survived-by-default so it doesn't linger.
        UPDATE corp_no_confidence_motions
           SET status = 'resolved', outcome = 'failed_quorum',
               resolved_at_tick = v_tick
         WHERE id = p_motion_id;
        RETURN jsonb_build_object('success', true, 'outcome', 'failed_quorum',
            'reason_note', 'corp_deleted');
    END IF;

    -- Quorum: ceil(0.30 × snapshot_held_shares). Bigint arithmetic for
    -- the ceil — (n*3 + 9) / 10 gives the same result as ceil(0.3n)
    -- for positive integers without any numeric/float work.
    v_quorum_thr := (v_motion.snapshot_held_shares * 3 + 9) / 10;
    v_quorum_met := (v_motion.yes_shares + v_motion.no_shares) >= v_quorum_thr;
    v_pass       := (v_motion.yes_shares > v_motion.no_shares) AND v_quorum_met;

    IF v_pass THEN
        v_outcome := 'ousted';
    ELSIF NOT v_quorum_met THEN
        v_outcome := 'failed_quorum';
    ELSE
        v_outcome := 'survived';
    END IF;

    -- Apply outcome.
    IF v_outcome = 'ousted' THEN
        -- Successor: highest-share board seat; tie-break oldest
        -- joined_tick. LEFT JOIN handles seats with no shareholding
        -- row (treated as 0 shares).
        SELECT s.member_faction_id
          INTO v_successor
          FROM corp_board_seats s
          LEFT JOIN corp_shareholdings sh
            ON sh.corp_id = s.corp_id
           AND sh.holder_faction_id = s.member_faction_id
         WHERE s.corp_id = v_motion.corp_id
         ORDER BY COALESCE(sh.shares, 0) DESC, s.joined_tick ASC
         LIMIT 1;

        IF v_successor IS NULL THEN
            -- No seated successor (the board emptied during the
            -- window via corp_board_leave). Demote outcome to
            -- survived — the CEO keeps the chair by default and
            -- gets +3 rep; caller loses -1. Defensive only; the
            -- file gate required ≥1 seat at open.
            v_outcome := 'survived';
        ELSE
            -- Ownership rotation. Founder is implicit (never in
            -- corp_board_seats), so the successor's seat row must be
            -- removed once they become the new Chairman.
            UPDATE entrepreneur_corps
               SET owner_faction_id = v_successor
             WHERE id = v_motion.corp_id;
            DELETE FROM corp_board_seats
             WHERE corp_id = v_motion.corp_id AND member_faction_id = v_successor;

            -- Outgoing CEO rep -2.
            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) - 2
             WHERE id = v_motion.ceo_faction_id;
        END IF;
    END IF;

    -- Survived / failed_quorum rep deltas:
    --   CEO +3, caller -1.
    IF v_outcome IN ('survived', 'failed_quorum') THEN
        UPDATE factions
           SET ent_reputation = COALESCE(ent_reputation, 0) + 3
         WHERE id = v_motion.ceo_faction_id;
        UPDATE factions
           SET ent_reputation = COALESCE(ent_reputation, 0) - 1
         WHERE id = v_motion.caller_faction_id;
    END IF;

    -- Finalise motion row.
    UPDATE corp_no_confidence_motions
       SET status              = 'resolved',
           outcome             = v_outcome,
           successor_faction_id = CASE WHEN v_outcome = 'ousted' THEN v_successor ELSE NULL END,
           resolved_at_tick    = v_tick
     WHERE id = p_motion_id;

    -- Event log.
    SELECT COALESCE(NULLIF(btrim(COALESCE(leader_first_name,'') || ' ' || COALESCE(leader_last_name,'')), ''),
                    faction_name, 'the former CEO')
      INTO v_old_ceo_name FROM factions WHERE id = v_motion.ceo_faction_id;
    SELECT COALESCE(NULLIF(btrim(COALESCE(leader_first_name,'') || ' ' || COALESCE(leader_last_name,'')), ''),
                    faction_name, 'A director')
      INTO v_caller_name  FROM factions WHERE id = v_motion.caller_faction_id;
    IF v_outcome = 'ousted' AND v_successor IS NOT NULL THEN
        SELECT COALESCE(NULLIF(btrim(COALESCE(leader_first_name,'') || ' ' || COALESCE(leader_last_name,'')), ''),
                        faction_name, 'A new CEO')
          INTO v_new_ceo_name FROM factions WHERE id = v_successor;
    END IF;

    v_d := CASE v_outcome
        WHEN 'ousted'        THEN format('%s was ousted as CEO of %s by no-confidence vote (%s YES vs %s NO of %s eligible shares). %s takes the chair.',
                                          v_old_ceo_name, v_corp.name,
                                          v_motion.yes_shares, v_motion.no_shares, v_motion.snapshot_held_shares,
                                          COALESCE(v_new_ceo_name, 'A successor'))
        WHEN 'survived'      THEN format('%s survived a no-confidence vote at %s (%s YES vs %s NO of %s eligible shares).',
                                          v_old_ceo_name, v_corp.name,
                                          v_motion.yes_shares, v_motion.no_shares, v_motion.snapshot_held_shares)
        WHEN 'failed_quorum' THEN format('The no-confidence motion against %s of %s failed for lack of quorum (%s + %s of %s eligible shares cast).',
                                          v_old_ceo_name, v_corp.name,
                                          v_motion.yes_shares, v_motion.no_shares, v_motion.snapshot_held_shares)
    END;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used, category,
        trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_motion.ceo_faction_id,
        CASE v_outcome
            WHEN 'ousted'        THEN 'CEO Ousted'
            WHEN 'survived'      THEN 'CEO Survived No-Confidence'
            WHEN 'failed_quorum' THEN 'No-Confidence Motion Failed (Quorum)'
        END,
        v_d, 'corporate', 'corp_no_confidence_resolved',
        jsonb_build_object(
            'motion_id',            p_motion_id,
            'corp_id',              v_motion.corp_id,
            'corp_name',            v_corp.name,
            'outcome',              v_outcome,
            'ceo_id',               v_motion.ceo_faction_id,
            'caller_id',            v_motion.caller_faction_id,
            'successor_id',         CASE WHEN v_outcome = 'ousted' THEN v_successor ELSE NULL END,
            'yes_shares',           v_motion.yes_shares,
            'no_shares',            v_motion.no_shares,
            'snapshot_held_shares', v_motion.snapshot_held_shares,
            'quorum_threshold',     v_quorum_thr,
            'opened_tick',          v_motion.opened_tick,
            'expiry_tick',          v_motion.expiry_tick
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',              true,
        'outcome',              v_outcome,
        'successor_id',         CASE WHEN v_outcome = 'ousted' THEN v_successor ELSE NULL END,
        'yes_shares',           v_motion.yes_shares,
        'no_shares',            v_motion.no_shares,
        'snapshot_held_shares', v_motion.snapshot_held_shares,
        'quorum_threshold',     v_quorum_thr,
        'resolved_at_tick',     v_tick
    );
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- finalize_expired_no_confidence_motions(p_tick) — bulk resolver
-- ════════════════════════════════════════════════════════════════════
-- Mirrors finalize_expired_board_requests. Idempotent, callable from
-- any client as a safety net + ready for an advance-tick hook in the
-- next js/game sync.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.finalize_expired_no_confidence_motions(p_tick INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r       RECORD;
    v_n     INT := 0;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tick');
    END IF;
    FOR r IN
        SELECT id FROM corp_no_confidence_motions
         WHERE status = 'open' AND expiry_tick <= p_tick
    LOOP
        PERFORM corp_no_confidence_resolve(r.id);
        v_n := v_n + 1;
    END LOOP;
    RETURN jsonb_build_object('success', true, 'resolved', v_n);
END;
$$;

-- ── Grants ──────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.corp_no_confidence_file(UUID)              TO authenticated;
GRANT EXECUTE ON FUNCTION public.corp_no_confidence_vote(UUID, BOOLEAN)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.corp_no_confidence_resolve(UUID)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_expired_no_confidence_motions(INT) TO authenticated;

-- ── Comments ────────────────────────────────────────────────────────

COMMENT ON FUNCTION public.corp_no_confidence_file(UUID) IS
    'File a no-confidence motion against a public corp''s CEO. Board-only (excludes CEO); one open motion per corp; 3-tick cooldown after a CEO survives. Snapshots eligible voters + their share weights at open. Vote runs 3 ticks.';
COMMENT ON FUNCTION public.corp_no_confidence_vote(UUID, BOOLEAN) IS
    'Cast / change a YES/NO vote on an open motion. Weight is the voter''s shares-at-open snapshot (corp_trade during the window doesn''t affect it). Upserts the votes row + updates the cached tally on motions.';
COMMENT ON FUNCTION public.corp_no_confidence_resolve(UUID) IS
    'Resolve a single motion at/after expiry. Idempotent. Pass: yes_shares > no_shares AND yes+no >= ceil(0.3 * snapshot). On pass: highest-share board member inherits (tie-break oldest joined_tick), CEO -2 rep, seat row deleted. On fail / quorum-fail: CEO +3 rep, caller -1 rep.';
COMMENT ON FUNCTION public.finalize_expired_no_confidence_motions(INT) IS
    'Bulk resolve every open motion with expiry_tick <= p_tick. Safety-net callable + ready for advance-tick wiring on the next js/game sync.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ────────────────────────────────────────────────────────
-- DROP FUNCTION IF EXISTS public.finalize_expired_no_confidence_motions(INT);
-- DROP FUNCTION IF EXISTS public.corp_no_confidence_resolve(UUID);
-- DROP FUNCTION IF EXISTS public.corp_no_confidence_vote(UUID, BOOLEAN);
-- DROP FUNCTION IF EXISTS public.corp_no_confidence_file(UUID);
-- DROP TABLE    IF EXISTS corp_no_confidence_votes;
-- DROP TABLE    IF EXISTS corp_no_confidence_eligibility;
-- DROP TABLE    IF EXISTS corp_no_confidence_motions;
-- Safe in alpha (no data depending on these tables yet).
