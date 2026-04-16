-- Recover Calveth electorate + rerun parliamentary election.
--
-- Why this exists:
-- - Calveth had elections with zero votes cast.
-- - That can happen if eligible_voters is zero or if faction_electoral_standing
--   rows are missing/degenerate (zero contested share / turnout).
--
-- What this script does:
-- 1) Ensure Calveth exists and has eligible voters.
-- 2) Ensure electorate_profile exists (required for ideology-aware weighting).
-- 3) Ensure faction_electoral_standing rows exist for all active parties.
-- 4) Backfill degenerate standing rows with a fallback blend of:
--      ideology fit (vs electorate profile), momentum, governance.
-- 5) Normalize contested vote shares and clamp turnout.
-- 6) Cancel stale scheduled parliamentary elections, schedule one now,
--    execute run_election, and mark that record completed.
--
-- Safe to re-run; updates are scoped to Calveth.

BEGIN;

DO $$
DECLARE
    v_nation_id UUID;
    v_current_tick INT := 0;
    v_party_count INT := 0;
    v_vote_sum NUMERIC := 0;
    v_election_id UUID;
    v_results JSONB;
BEGIN
    ---------------------------------------------------------------------------
    -- 0) Resolve nation and tick context
    ---------------------------------------------------------------------------
    SELECT id INTO v_nation_id
    FROM nations
    WHERE LOWER(name) = 'calveth'
    LIMIT 1;

    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'Calveth not found. Run sql/insert_calveth.sql first.';
    END IF;

    SELECT COALESCE(current_tick, 0) INTO v_current_tick
    FROM shard
    WHERE name = 'Alpha Shard';

    ---------------------------------------------------------------------------
    -- 1) Ensure eligible voters is non-zero
    ---------------------------------------------------------------------------
    UPDATE nations n
    SET eligible_voters = GREATEST(
        1000,
        ROUND(COALESCE(n.population, 0) * 0.60)
    )
    WHERE n.id = v_nation_id
      AND COALESCE(n.eligible_voters, 0) <= 0;

    ---------------------------------------------------------------------------
    -- 2) Ensure electorate_profile exists
    ---------------------------------------------------------------------------
    INSERT INTO electorate_profile (nation_id, last_updated_tick)
    SELECT v_nation_id, v_current_tick
    WHERE NOT EXISTS (
        SELECT 1
        FROM electorate_profile ep
        WHERE ep.nation_id = v_nation_id
    );

    ---------------------------------------------------------------------------
    -- 3) Ensure standing rows exist for all active parties in Calveth
    ---------------------------------------------------------------------------
    INSERT INTO faction_electoral_standing (
        faction_id,
        nation_id,
        contested_vote_share,
        turnout_rate,
        party_approval,
        ideological_alignment,
        visibility,
        last_updated_tick
    )
    SELECT
        f.id,
        v_nation_id,
        0.0,
        0.65,
        25,
        50,
        COALESCE(f.momentum, 0),
        v_current_tick
    FROM factions f
    WHERE f.nation_id = v_nation_id
      AND f.faction_type = 'party'
      AND f.abandoned_at IS NULL
      AND NOT EXISTS (
          SELECT 1
          FROM faction_electoral_standing fes
          WHERE fes.faction_id = f.id
            AND fes.nation_id = v_nation_id
      );

    ---------------------------------------------------------------------------
    -- 4) Backfill degenerate standings with ideology + momentum + governance
    --    (used only when contested_vote_share is null/<=0)
    ---------------------------------------------------------------------------
    WITH ep AS (
        SELECT *
        FROM electorate_profile
        WHERE nation_id = v_nation_id
        LIMIT 1
    ),
    party_base AS (
        SELECT
            f.id AS faction_id,
            -- ideology fit: compare party axis ([-100,100] mapped to [0,100]) to electorate means
            GREATEST(0.0,
                100.0 - (
                    (
                        ABS(((COALESCE(fi.liberty_equality, 0) + 100.0) / 2.0) - COALESCE(ep.ideo_mean_liberty_equality, 50)) +
                        ABS(((COALESCE(fi.tradition_progress, 0) + 100.0) / 2.0) - COALESCE(ep.ideo_mean_tradition_progress, 50)) +
                        ABS(((COALESCE(fi.security_freedom, 0) + 100.0) / 2.0) - COALESCE(ep.ideo_mean_security_freedom, 50)) +
                        ABS(((COALESCE(fi.globalism_nationalism, 0) + 100.0) / 2.0) - COALESCE(ep.ideo_mean_globalism_nationalism, 50)) +
                        ABS(((COALESCE(fi.individualism_collectivism, 0) + 100.0) / 2.0) - COALESCE(ep.ideo_mean_individualism_collectivism, 50))
                    ) / 5.0
                )
            ) AS ideology_score,
            COALESCE(f.momentum, 0)::NUMERIC AS momentum_score,
            -- governance proxy: existing standing party_approval if present, otherwise nation gov_approval
            COALESCE(fes.party_approval, n.gov_approval, 50)::NUMERIC AS governance_score,
            COALESCE(fes.visibility, COALESCE(f.momentum, 0), 0)::NUMERIC AS visibility_score,
            COALESCE(ep.enthusiasm, 50)::NUMERIC AS enthusiasm
        FROM factions f
        JOIN nations n ON n.id = f.nation_id
        LEFT JOIN faction_ideology fi ON fi.faction_id = f.id
        LEFT JOIN faction_electoral_standing fes ON fes.faction_id = f.id AND fes.nation_id = v_nation_id
        LEFT JOIN ep ON true
        WHERE f.nation_id = v_nation_id
          AND f.faction_type = 'party'
          AND f.abandoned_at IS NULL
    ),
    weighted AS (
        SELECT
            faction_id,
            ideology_score,
            momentum_score,
            governance_score,
            -- blended fallback weight
            GREATEST(
                0.0001,
                (ideology_score * 0.30) +
                (momentum_score * 0.25) +
                (governance_score * 0.35) +
                (50 * 0.10)
            ) AS raw_weight,
            -- turnout baseline from enthusiasm and momentum
            LEAST(0.95, GREATEST(0.35,
                0.45 + (enthusiasm - 50) / 200.0 + (momentum_score / 500.0)
            )) AS fallback_turnout
        FROM party_base
    ),
    sums AS (
        SELECT SUM(raw_weight) AS total_weight
        FROM weighted
    )
    UPDATE faction_electoral_standing fes
    SET contested_vote_share =
            CASE
                WHEN COALESCE(fes.contested_vote_share, 0) > 0
                    THEN fes.contested_vote_share
                ELSE ROUND((w.raw_weight / NULLIF(s.total_weight, 0))::NUMERIC, 6)
            END,
        turnout_rate =
            CASE
                WHEN COALESCE(fes.turnout_rate, 0) > 0
                    THEN LEAST(0.95, GREATEST(0.35, fes.turnout_rate))
                ELSE ROUND(w.fallback_turnout::NUMERIC, 3)
            END,
        ideological_alignment = COALESCE(NULLIF(fes.ideological_alignment, 0), ROUND(w.ideology_score, 2)),
        visibility = COALESCE(NULLIF(fes.visibility, 0), ROUND(w.momentum_score, 2)),
        party_approval = COALESCE(NULLIF(fes.party_approval, 0), ROUND(w.governance_score, 2)),
        last_updated_tick = v_current_tick
    FROM weighted w
    CROSS JOIN sums s
    WHERE fes.faction_id = w.faction_id
      AND fes.nation_id = v_nation_id;

    ---------------------------------------------------------------------------
    -- 5) Normalize contested_vote_share to sum=1 and clamp turnout range
    ---------------------------------------------------------------------------
    WITH rows AS (
        SELECT
            fes.faction_id,
            GREATEST(0.0001, COALESCE(fes.contested_vote_share, 0.0001)) AS share
        FROM faction_electoral_standing fes
        JOIN factions f ON f.id = fes.faction_id
        WHERE fes.nation_id = v_nation_id
          AND f.faction_type = 'party'
          AND f.abandoned_at IS NULL
    ),
    totals AS (
        SELECT SUM(share) AS total_share FROM rows
    )
    UPDATE faction_electoral_standing fes
    SET contested_vote_share = ROUND((r.share / NULLIF(t.total_share, 0))::NUMERIC, 6),
        turnout_rate = ROUND(LEAST(0.95, GREATEST(0.35, COALESCE(fes.turnout_rate, 0.65)))::NUMERIC, 3),
        last_updated_tick = v_current_tick
    FROM rows r
    CROSS JOIN totals t
    WHERE fes.faction_id = r.faction_id
      AND fes.nation_id = v_nation_id;

    SELECT COUNT(*) INTO v_party_count
    FROM factions
    WHERE nation_id = v_nation_id
      AND faction_type = 'party'
      AND abandoned_at IS NULL;

    IF v_party_count = 0 THEN
        RAISE EXCEPTION 'Calveth has no active parties; cannot run election.';
    END IF;

    SELECT COALESCE(SUM(contested_vote_share), 0) INTO v_vote_sum
    FROM faction_electoral_standing fes
    JOIN factions f ON f.id = fes.faction_id
    WHERE fes.nation_id = v_nation_id
      AND f.faction_type = 'party'
      AND f.abandoned_at IS NULL;

    IF v_vote_sum <= 0 THEN
        RAISE EXCEPTION 'Calveth standings still degenerate (sum contested_vote_share <= 0).';
    END IF;

    ---------------------------------------------------------------------------
    -- 6) Rerun parliamentary election now
    ---------------------------------------------------------------------------
    UPDATE elections
    SET status = 'cancelled'
    WHERE nation_id = v_nation_id
      AND election_type = 'parliamentary'
      AND status = 'scheduled';

    INSERT INTO elections (nation_id, election_tick, election_type, status)
    VALUES (v_nation_id, v_current_tick, 'parliamentary', 'scheduled')
    RETURNING id INTO v_election_id;

    SELECT run_election(v_nation_id, 'parliamentary') INTO v_results;

    UPDATE elections
    SET status = 'completed',
        results = v_results,
        election_tick = v_current_tick
    WHERE id = v_election_id;

    RAISE NOTICE 'Calveth election recovery complete. election_id=% tick=%', v_election_id, v_current_tick;
    RAISE NOTICE 'Results summary: %', jsonb_build_object(
        'total_votes_cast', v_results->>'total_votes_cast',
        'turnout_pct', v_results->>'turnout_pct'
    );
END $$;

COMMIT;

-- Optional post-checks:
-- SELECT id, election_tick, status, results->>'total_votes_cast' AS total_votes, results->>'turnout_pct' AS turnout_pct
-- FROM elections
-- WHERE nation_id = (SELECT id FROM nations WHERE LOWER(name)='calveth')
--   AND election_type = 'parliamentary'
-- ORDER BY election_tick DESC, created_at DESC
-- LIMIT 3;
