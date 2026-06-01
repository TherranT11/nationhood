-- ════════════════════════════════════════════════════════════════════
-- General elections — seat allocation by largest-remainder popularity
--
-- Wires up the politician-nation "NEXT GENERAL ELECTION" countdown
-- that's been a display-only chip since 20270349 introduced
-- nations.next_election_tick. When the tick catches up, this
-- migration's resolver reallocates every seat in the nation's
-- assembly across the active movement_party rows in proportion to
-- their popularity_pct, then schedules the next election 1D36 + 5
-- ticks out.
--
-- ── Allocation method ───────────────────────────────────────────────
-- Largest-remainder against popularity_pct. For each nation:
--   1. exact_share[i] = (popularity_pct[i] / Σ popularity_pct) × total_seats
--   2. base_seats[i]  = FLOOR(exact_share[i])
--   3. leftover       = total_seats − Σ base_seats
--   4. Award the `leftover` extra seats to parties with the largest
--      fractional remainders (random tiebreak).
-- popularity_pct is approval rating not vote share — it sums above
-- 100 — so normalising against the sum is what turns it into a vote-
-- share-like split. Parties with popularity_pct ≤ 0 get 0 seats; a
-- nation with no popular parties at all is a silent no-op (existing
-- seats kept).
--
-- ── Triggering ──────────────────────────────────────────────────────
-- Same on-demand pattern as politician_resolve_due_elections:
-- politician-topbar.js fires the RPC on every politician-page
-- bootstrap. FOR UPDATE SKIP LOCKED on the nations row prevents two
-- concurrent loads from double-applying the same election. The next-
-- tick advance is the idempotency key — once the row's
-- next_election_tick moves past current_tick the resolver short-
-- circuits on it.
--
-- ── Initial schedule for Avelia + Melizea ───────────────────────────
-- One-shot UPDATE at the bottom of this migration sets
-- next_election_tick = current_tick + 1D36 + 5 (6..41 ticks) for
-- both nations. Independent rolls per nation (random() is per-row in
-- Postgres). Re-running the migration would re-roll the dates — fine,
-- this is a deliberate "start the election clock" beat.
--
-- ── Out of scope (deferred) ─────────────────────────────────────────
-- * Coalition formation / governing-party selection. Today
--   nation.head_of_state pointers stay put across an election.
-- * Election-result history table. The RPC's return payload carries
--   the per-party allocations, but no durable log lands yet — the
--   politician_career_events / party_motions deferred-log pattern is
--   the model when it's wanted.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.resolve_due_general_elections()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick      int;
    v_nation    RECORD;
    v_seats     int;
    v_next_tick int;
    v_resolved  int := 0;
    v_results   jsonb := '[]'::jsonb;
    v_nation_res jsonb;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', 0, 'reason', 'no_shard');
    END IF;

    -- SKIP LOCKED means two parallel page loads each get a disjoint
    -- set of due elections to process; neither blocks the other.
    FOR v_nation IN
        SELECT id, name, total_seats
          FROM nations
         WHERE next_election_tick IS NOT NULL
           AND next_election_tick <= v_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        v_seats := COALESCE(v_nation.total_seats, 0);
        IF v_seats <= 0 THEN
            -- No assembly (e.g. an absolute monarchy that somehow got
            -- a next_election_tick set anyway). Push the schedule
            -- forward so we don't busy-loop on this row.
            v_next_tick := v_tick + 5 + 1 + floor(random() * 36)::int;
            UPDATE nations SET next_election_tick = v_next_tick WHERE id = v_nation.id;
            CONTINUE;
        END IF;

        -- ── Largest-remainder allocation ─────────────────────────────
        -- Single UPDATE with CTEs; faster than building a temp table
        -- per nation and avoids the per-call cleanup. The random()
        -- in the ROW_NUMBER's ORDER tiebreaks parties that share a
        -- fractional remainder, so a 3-way tie doesn't always favour
        -- whichever id sorts first.
        WITH popped AS (
            SELECT id, COALESCE(popularity_pct, 0)::numeric AS pop
              FROM factions
             WHERE nation_id    = v_nation.id
               AND faction_type = 'movement_party'
               AND abandoned_at IS NULL
        ),
        totals AS (
            SELECT NULLIF(SUM(pop), 0) AS sum_pop
              FROM popped WHERE pop > 0
        ),
        shares AS (
            SELECT p.id, p.pop,
                   CASE WHEN p.pop > 0 AND t.sum_pop IS NOT NULL
                        THEN (p.pop / t.sum_pop) * v_seats
                        ELSE 0
                   END AS exact_share
              FROM popped p CROSS JOIN totals t
        ),
        base AS (
            SELECT id,
                   FLOOR(exact_share)::int AS base_seats,
                   exact_share - FLOOR(exact_share) AS rem
              FROM shares
        ),
        ranked AS (
            SELECT id, base_seats,
                   ROW_NUMBER() OVER (ORDER BY rem DESC, random()) AS rn
              FROM base
        ),
        total_base AS (
            SELECT COALESCE(SUM(base_seats), 0) AS used FROM base
        )
        UPDATE factions f
           SET seats = r.base_seats
                     + CASE WHEN r.rn <= (v_seats - tb.used) THEN 1 ELSE 0 END
          FROM ranked r, total_base tb
         WHERE f.id = r.id;

        -- Schedule the next election: 1D36 + 5 → 6..41 ticks out.
        v_next_tick := v_tick + 5 + 1 + floor(random() * 36)::int;
        UPDATE nations
           SET next_election_tick = v_next_tick
         WHERE id = v_nation.id;

        v_resolved := v_resolved + 1;

        -- Per-nation result block for the response. Sorted by seats
        -- descending so the winner reads first; this is what the UI
        -- would surface in a result banner once one's built.
        SELECT jsonb_build_object(
                 'nation_id',          v_nation.id,
                 'nation_name',        v_nation.name,
                 'total_seats',        v_seats,
                 'next_election_tick', v_next_tick,
                 'parties',            COALESCE(jsonb_agg(jsonb_build_object(
                     'party_id',       f.id,
                     'faction_name',   f.faction_name,
                     'popularity_pct', f.popularity_pct,
                     'seats',          f.seats
                 ) ORDER BY f.seats DESC, f.faction_name), '[]'::jsonb)
               )
          INTO v_nation_res
          FROM factions f
         WHERE f.nation_id    = v_nation.id
           AND f.faction_type = 'movement_party'
           AND f.abandoned_at IS NULL;

        v_results := v_results || jsonb_build_array(v_nation_res);
    END LOOP;

    RETURN jsonb_build_object(
        'success',  true,
        'tick',     v_tick,
        'resolved', v_resolved,
        'results',  v_results
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_due_general_elections() TO authenticated;

COMMENT ON FUNCTION public.resolve_due_general_elections() IS
    'Reallocates assembly seats by largest-remainder of popularity_pct for every nation whose next_election_tick has matured. Reschedules each nation 1D36+5 ticks out. SECURITY DEFINER + SKIP LOCKED so concurrent politician-page loads don''t double-apply. Called from js/politician-topbar.js on every politician-page bootstrap.';

-- ── Initial schedule: Avelia + Melizea start the election clock ─────
-- Run AFTER the function is created so a re-run of this migration
-- can't accidentally fire the resolver against a stale body.
UPDATE nations
   SET next_election_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1)
                          + 5 + 1 + floor(random() * 36)::int
 WHERE name IN ('Avelia', 'Melizea');

NOTIFY pgrst, 'reload schema';

COMMIT;
