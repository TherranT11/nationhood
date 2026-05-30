-- ════════════════════════════════════════════════════════════════════
-- General election audit fixes (follow-up to 20270421)
--
-- Three problems shipped in 20270421 that this migration cleans up:
--
-- 1. SOURCE OF TRUTH VIOLATION. The largest-remainder allocation was
--    inlined in BOTH resolve_due_general_elections() (SQL) and
--    election.html (JS). The JS function header acknowledged the
--    duplication but didn't fix it; per the project's "we fix the
--    duplication before we add anything new" rule, the fix lands here.
--
--    Resolution: extract a STABLE SECURITY DEFINER RPC
--    public.project_general_election(p_nation_id uuid). Returns
--    one row per active movement_party in the nation with the
--    projected seat count. Read by the resolver (which then writes
--    the seats) AND by election.html (which renders the projection).
--    One body, one source.
--
-- 2. LOGIC BUG — all-zero-popularity edge case. With every party at
--    popularity_pct = 0, NULLIF(SUM(pop), 0) returns NULL, every
--    party's base + remainder are 0, and the leftover-award step
--    handed out seats to parties with rem = 0 via the random()
--    tiebreak. The new function gates this at the top: if no party
--    has popularity > 0, every party's projected seats = its current
--    seats (a totally apathetic election is a no-op).
--
--    For mixed cases (some parties at 0, some > 0), pop = 0 parties
--    get projected_seats = 0 explicitly; only pop > 0 parties
--    participate in the allocation.
--
-- 3. DEAD STATE. The resolver previously built a v_results jsonb of
--    per-nation per-party allocations and returned it; the only
--    caller (topbar fire-and-forget) discards the return value.
--    Stripped down to { success, resolved } — if a result-banner UI
--    ever wants the breakdown, election.html can call
--    project_general_election directly.
--
-- ── Tiebreak change (random → stable) ───────────────────────────────
-- The 20270421 resolver used ROW_NUMBER OVER (ORDER BY rem DESC, random()).
-- The new shared function uses (ORDER BY rem DESC, id) so the SAME math
-- runs on the resolver AND on the page projection — players see the
-- same projection on every page load instead of it flickering between
-- ties. In tie-rich corner cases this favours whichever party id sorts
-- first; the projection still drives the actual seats, so reality
-- can't diverge from what the page showed.
--
-- ── Bootstrap edge ──────────────────────────────────────────────────
-- election.html's bootstrap try/catch is in the matching commit
-- (no schema change needed for that fix).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Shared projection function ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.project_general_election(p_nation_id uuid)
RETURNS TABLE(party_id uuid, projected_seats int)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_seats int;
BEGIN
    SELECT total_seats INTO v_total_seats
      FROM nations WHERE id = p_nation_id;

    -- No assembly / unknown nation: every active party returns 0.
    IF v_total_seats IS NULL OR v_total_seats <= 0 THEN
        RETURN QUERY
            SELECT f.id, 0
              FROM factions f
             WHERE f.nation_id    = p_nation_id
               AND f.faction_type = 'movement_party'
               AND f.abandoned_at IS NULL;
        RETURN;
    END IF;

    -- All-zero-popularity case: no-op. Each party keeps its current
    -- seat count. This is the audit-fixed branch — pre-20270422 this
    -- case randomly awarded leftover seats to parties at 0%.
    IF NOT EXISTS (
        SELECT 1 FROM factions
         WHERE nation_id     = p_nation_id
           AND faction_type  = 'movement_party'
           AND abandoned_at IS NULL
           AND COALESCE(popularity_pct, 0) > 0
    ) THEN
        RETURN QUERY
            SELECT f.id, COALESCE(f.seats, 0)::int
              FROM factions f
             WHERE f.nation_id    = p_nation_id
               AND f.faction_type = 'movement_party'
               AND f.abandoned_at IS NULL;
        RETURN;
    END IF;

    -- Largest-remainder over parties with popularity_pct > 0; parties
    -- at 0% are forced to 0 seats (UNION ALL'd in at the end). Single
    -- statement so the optimiser sees the full query plan.
    RETURN QUERY
        WITH popped AS (
            SELECT id, COALESCE(popularity_pct, 0)::numeric AS pop
              FROM factions
             WHERE nation_id     = p_nation_id
               AND faction_type  = 'movement_party'
               AND abandoned_at IS NULL
        ),
        eligible AS (
            SELECT id, pop FROM popped WHERE pop > 0
        ),
        totals AS (
            SELECT NULLIF(SUM(pop), 0) AS sum_pop FROM eligible
        ),
        shares AS (
            SELECT e.id, (e.pop / t.sum_pop) * v_total_seats AS exact_share
              FROM eligible e CROSS JOIN totals t
        ),
        base AS (
            SELECT id,
                   FLOOR(exact_share)::int AS base_seats,
                   exact_share - FLOOR(exact_share) AS rem
              FROM shares
        ),
        ranked AS (
            -- Stable tiebreak by id (not random) so the resolver and
            -- election.html projection always agree. See header.
            SELECT id, base_seats,
                   ROW_NUMBER() OVER (ORDER BY rem DESC, id) AS rn
              FROM base
        ),
        total_base AS (
            SELECT COALESCE(SUM(base_seats), 0) AS used FROM base
        )
        SELECT r.id::uuid,
               (r.base_seats + CASE WHEN r.rn <= (v_total_seats - tb.used) THEN 1 ELSE 0 END)::int
          FROM ranked r, total_base tb
        UNION ALL
        SELECT p.id::uuid, 0
          FROM popped p
         WHERE p.pop <= 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.project_general_election(uuid) TO authenticated;

COMMENT ON FUNCTION public.project_general_election(uuid) IS
    'Largest-remainder projection of assembly seats by popularity_pct. Returns one row per active movement_party in the nation with its projected_seats. Single source of truth for the actual election (resolve_due_general_elections) and the projection page (election.html via RPC). No writes — STABLE function.';

-- ── 2. Resolver now delegates to the projection function ────────────
CREATE OR REPLACE FUNCTION public.resolve_due_general_elections()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick      int;
    v_nation    RECORD;
    v_next_tick int;
    v_resolved  int := 0;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', true, 'resolved', 0, 'reason', 'no_shard');
    END IF;

    FOR v_nation IN
        SELECT id
          FROM nations
         WHERE next_election_tick IS NOT NULL
           AND next_election_tick <= v_tick
         FOR UPDATE SKIP LOCKED
    LOOP
        -- Apply the projection — pure write step, math lives in
        -- project_general_election. The audit-fix invariants
        -- (no-assembly / all-zero / pop<=0) are all handled there.
        UPDATE factions f
           SET seats = pr.projected_seats
          FROM project_general_election(v_nation.id) pr
         WHERE f.id = pr.party_id;

        -- Reschedule: 1D36 + 5 ticks → 6..41 ticks out.
        v_next_tick := v_tick + 5 + 1 + floor(random() * 36)::int;
        UPDATE nations
           SET next_election_tick = v_next_tick
         WHERE id = v_nation.id;

        v_resolved := v_resolved + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'tick', v_tick, 'resolved', v_resolved);
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_due_general_elections() TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
