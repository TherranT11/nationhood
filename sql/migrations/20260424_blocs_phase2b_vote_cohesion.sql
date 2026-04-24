-- ============================================================
-- BLOCS — Phase 2b: Vote-cohesion tracking + auto-dissolve
--
-- Rules (confirmed by design):
--   * A bill counts as "1 dissent" for a bloc if any member voted YES
--     AND any other member voted NO on it. Abstains / no-votes never
--     count. One bill = at most one dissent mark, no matter how many
--     bloc members disagree on it.
--   * The counter is cumulative across the bloc's lifetime.
--   * Third bill with internal dissent dissolves the bloc with reason
--     'vote_split'. Remaining members are cleared from bloc_id; pending
--     invites are rescinded.
--   * No momentum penalty on vote-split dissolution — per Q4=A, only
--     voluntary leaves are penalized.
--
-- The dissolution event template (Phase 2d) will read
-- blocs.last_dissent_bill_id + bill_support to compose the
-- "disagreed on {bill}" message, so this migration stores the
-- triggering bill on every increment (not just the dissolving one).
--
-- Safe to re-run: ALTER ... IF NOT EXISTS + CREATE OR REPLACE.
-- ============================================================

-- ==================== SCHEMA ====================

ALTER TABLE blocs
    ADD COLUMN IF NOT EXISTS dissent_count INT NOT NULL DEFAULT 0;

ALTER TABLE blocs
    ADD COLUMN IF NOT EXISTS last_dissent_bill_id UUID
        REFERENCES bills(id) ON DELETE SET NULL;

-- ==================== RPC: process_bloc_vote_cohesion ====================
-- Called from the bills dispatcher loop (resolveExpiredVotes) once per
-- resolved bill. Increments dissent_count on any bloc whose members split
-- YES-vs-NO on this bill, and dissolves any bloc that just hit 3. Returns
-- the count of blocs dissolved as a result of this call (for logging;
-- callers can ignore).
--
-- Tick-processor-only: no caller-ownership check inside. Service role key
-- bypasses RLS; the authenticated grant below matches accumulate_ap /
-- adjust_momentum conventions for internal-use RPCs invoked from the
-- client bills flow as well as the edge function.

CREATE OR REPLACE FUNCTION process_bloc_vote_cohesion(
    p_bill_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_nation_id UUID;
    v_tick INT;
    v_row RECORD;
    v_dissolved_count INT := 0;
BEGIN
    SELECT nation_id INTO v_nation_id FROM bills WHERE id = p_bill_id;
    IF v_nation_id IS NULL THEN
        RETURN 0;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';

    -- One UPDATE picks out exactly the blocs with a YES/NO split and
    -- bumps their counters atomically. RETURNING lets us inspect each
    -- new counter value to decide whether to dissolve.
    FOR v_row IN
        UPDATE blocs b
           SET dissent_count        = COALESCE(b.dissent_count, 0) + 1,
               last_dissent_bill_id = p_bill_id
         WHERE b.nation_id = v_nation_id
           AND b.dissolved_at_tick IS NULL
           AND EXISTS (
               SELECT 1 FROM bill_support bs
               JOIN factions f ON f.id = bs.faction_id
               WHERE bs.bill_id = p_bill_id
                 AND f.bloc_id = b.id
                 AND bs.stance IN ('yes', 'accept')
           )
           AND EXISTS (
               SELECT 1 FROM bill_support bs
               JOIN factions f ON f.id = bs.faction_id
               WHERE bs.bill_id = p_bill_id
                 AND f.bloc_id = b.id
                 AND bs.stance IN ('no', 'reject')
           )
        RETURNING b.id, b.dissent_count
    LOOP
        IF v_row.dissent_count >= 3 THEN
            UPDATE factions SET bloc_id = NULL WHERE bloc_id = v_row.id;
            UPDATE bloc_invitations
               SET status = 'rescinded', responded_at_tick = v_tick
             WHERE bloc_id = v_row.id AND status = 'pending';
            UPDATE blocs
               SET dissolved_at_tick  = v_tick,
                   dissolution_reason = 'vote_split'
             WHERE id = v_row.id;
            v_dissolved_count := v_dissolved_count + 1;
        END IF;
    END LOOP;

    RETURN v_dissolved_count;
END;
$fn$;

GRANT EXECUTE ON FUNCTION process_bloc_vote_cohesion(UUID) TO authenticated, service_role;

-- ==================== VERIFY ====================
SELECT 'blocs.dissent_count'        AS object, COUNT(*) AS present
  FROM information_schema.columns
 WHERE table_name = 'blocs' AND column_name = 'dissent_count'
UNION ALL
SELECT 'blocs.last_dissent_bill_id', COUNT(*)
  FROM information_schema.columns
 WHERE table_name = 'blocs' AND column_name = 'last_dissent_bill_id'
UNION ALL
SELECT 'process_bloc_vote_cohesion RPC', COUNT(*)
  FROM pg_proc WHERE proname = 'process_bloc_vote_cohesion';
