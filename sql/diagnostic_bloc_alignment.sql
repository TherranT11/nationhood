-- Diagnostic: Verify voter bloc approval aligns with ideological compatibility
--
-- This query compares each party's ideology with each voter bloc's ideology,
-- calculates the expected alignment, and flags cases where actual preference_score
-- diverges significantly from what ideology alone would predict.
--
-- Ideology alignment logic (mirrors computeIdeologyAlignment in ideology.js):
--   Party scores: -100 to +100 → normalized to 0-100 via (score + 100) / 2
--   Bloc scores: 0-100 (already normalized)
--   Per-axis alignment: 1 - |partyNorm - blocScore| / 100
--   Weighted by party strength (|partyScore| / 100)
--
-- Opposition logic (mirrors countIdeologyRelationship):
--   Party threshold: |score| >= 20
--   Bloc threshold: |score - 50| >= 10
--   Same side = aligned, different side = opposed

WITH ideology_calc AS (
    SELECT
        f.id AS faction_id,
        f.faction_name,
        vb.id AS bloc_id,
        vb.bloc_name,
        vb.population_weight,
        fi.liberty_equality AS p_le,
        fi.tradition_progress AS p_tp,
        fi.security_freedom AS p_sf,
        fi.globalism_nationalism AS p_gn,
        fi.individualism_collectivism AS p_ic,
        vb.axis_liberty_equality AS b_le,
        vb.axis_tradition_progress AS b_tp,
        vb.axis_security_freedom AS b_sf,
        vb.axis_globalism_nationalism AS b_gn,
        vb.axis_individualism_collectivism AS b_ic,
        fba.ideology_alignment AS actual_alignment,
        fba.preference_score,
        fba.momentum,
        fba.vote_share,
        fba.ideology_drift,
        n.nation_name
    FROM factions f
    JOIN faction_ideology fi ON fi.faction_id = f.id
    JOIN voter_blocs vb ON vb.nation_id = f.nation_id AND vb.is_active = true
    JOIN faction_bloc_approval fba ON fba.faction_id = f.id AND fba.bloc_id = vb.id
    JOIN nations n ON n.id = f.nation_id
    WHERE f.faction_type = 'party'
),

-- Calculate per-axis alignment and opposition
axis_detail AS (
    SELECT
        ic.*,

        -- Per-axis party strength (weight)
        ABS(p_le) / 100.0 AS str_le,
        ABS(p_tp) / 100.0 AS str_tp,
        ABS(p_sf) / 100.0 AS str_sf,
        ABS(p_gn) / 100.0 AS str_gn,
        ABS(p_ic) / 100.0 AS str_ic,

        -- Per-axis alignment (0-1)
        CASE WHEN ABS(p_le) >= 1 THEN 1 - ABS((p_le + 100.0) / 2 - b_le) / 100.0 ELSE NULL END AS align_le,
        CASE WHEN ABS(p_tp) >= 1 THEN 1 - ABS((p_tp + 100.0) / 2 - b_tp) / 100.0 ELSE NULL END AS align_tp,
        CASE WHEN ABS(p_sf) >= 1 THEN 1 - ABS((p_sf + 100.0) / 2 - b_sf) / 100.0 ELSE NULL END AS align_sf,
        CASE WHEN ABS(p_gn) >= 1 THEN 1 - ABS((p_gn + 100.0) / 2 - b_gn) / 100.0 ELSE NULL END AS align_gn,
        CASE WHEN ABS(p_ic) >= 1 THEN 1 - ABS((p_ic + 100.0) / 2 - b_ic) / 100.0 ELSE NULL END AS align_ic,

        -- Opposition counting per axis (party threshold 20, bloc threshold 10)
        CASE WHEN ABS(p_le) >= 20 AND ABS(b_le - 50) >= 10 THEN
            CASE WHEN SIGN(p_le) = SIGN(b_le - 50) THEN 'aligned' ELSE 'opposed' END
        ELSE 'neutral' END AS rel_le,
        CASE WHEN ABS(p_tp) >= 20 AND ABS(b_tp - 50) >= 10 THEN
            CASE WHEN SIGN(p_tp) = SIGN(b_tp - 50) THEN 'aligned' ELSE 'opposed' END
        ELSE 'neutral' END AS rel_tp,
        CASE WHEN ABS(p_sf) >= 20 AND ABS(b_sf - 50) >= 10 THEN
            CASE WHEN SIGN(p_sf) = SIGN(b_sf - 50) THEN 'aligned' ELSE 'opposed' END
        ELSE 'neutral' END AS rel_sf,
        CASE WHEN ABS(p_gn) >= 20 AND ABS(b_gn - 50) >= 10 THEN
            CASE WHEN SIGN(p_gn) = SIGN(b_gn - 50) THEN 'aligned' ELSE 'opposed' END
        ELSE 'neutral' END AS rel_gn,
        CASE WHEN ABS(p_ic) >= 20 AND ABS(b_ic - 50) >= 10 THEN
            CASE WHEN SIGN(p_ic) = SIGN(b_ic - 50) THEN 'aligned' ELSE 'opposed' END
        ELSE 'neutral' END AS rel_ic

    FROM ideology_calc ic
),

-- Aggregate to expected alignment + opposition counts
expected AS (
    SELECT
        ad.*,

        -- Weighted alignment score (0-100), matching computeIdeologyAlignment()
        CASE
            WHEN COALESCE(str_le,0) + COALESCE(str_tp,0) + COALESCE(str_sf,0) + COALESCE(str_gn,0) + COALESCE(str_ic,0) < 0.01
            THEN 50
            ELSE (
                COALESCE(align_le * str_le, 0) +
                COALESCE(align_tp * str_tp, 0) +
                COALESCE(align_sf * str_sf, 0) +
                COALESCE(align_gn * str_gn, 0) +
                COALESCE(align_ic * str_ic, 0)
            ) / NULLIF(
                CASE WHEN ABS(p_le) >= 1 THEN str_le ELSE 0 END +
                CASE WHEN ABS(p_tp) >= 1 THEN str_tp ELSE 0 END +
                CASE WHEN ABS(p_sf) >= 1 THEN str_sf ELSE 0 END +
                CASE WHEN ABS(p_gn) >= 1 THEN str_gn ELSE 0 END +
                CASE WHEN ABS(p_ic) >= 1 THEN str_ic ELSE 0 END
            , 0) * 100
        END AS expected_alignment,

        -- Opposition / alignment counts
        (CASE WHEN rel_le = 'opposed' THEN 1 ELSE 0 END +
         CASE WHEN rel_tp = 'opposed' THEN 1 ELSE 0 END +
         CASE WHEN rel_sf = 'opposed' THEN 1 ELSE 0 END +
         CASE WHEN rel_gn = 'opposed' THEN 1 ELSE 0 END +
         CASE WHEN rel_ic = 'opposed' THEN 1 ELSE 0 END) AS opposed_count,

        (CASE WHEN rel_le = 'aligned' THEN 1 ELSE 0 END +
         CASE WHEN rel_tp = 'aligned' THEN 1 ELSE 0 END +
         CASE WHEN rel_sf = 'aligned' THEN 1 ELSE 0 END +
         CASE WHEN rel_gn = 'aligned' THEN 1 ELSE 0 END +
         CASE WHEN rel_ic = 'aligned' THEN 1 ELSE 0 END) AS aligned_count,

        -- Expected opposition multiplier
        CASE
            WHEN (CASE WHEN rel_le = 'opposed' THEN 1 ELSE 0 END +
                  CASE WHEN rel_tp = 'opposed' THEN 1 ELSE 0 END +
                  CASE WHEN rel_sf = 'opposed' THEN 1 ELSE 0 END +
                  CASE WHEN rel_gn = 'opposed' THEN 1 ELSE 0 END +
                  CASE WHEN rel_ic = 'opposed' THEN 1 ELSE 0 END) >= 2 THEN 0.70
            WHEN (CASE WHEN rel_le = 'opposed' THEN 1 ELSE 0 END +
                  CASE WHEN rel_tp = 'opposed' THEN 1 ELSE 0 END +
                  CASE WHEN rel_sf = 'opposed' THEN 1 ELSE 0 END +
                  CASE WHEN rel_gn = 'opposed' THEN 1 ELSE 0 END +
                  CASE WHEN rel_ic = 'opposed' THEN 1 ELSE 0 END) = 1 THEN 0.80
            WHEN (CASE WHEN rel_le = 'aligned' THEN 1 ELSE 0 END +
                  CASE WHEN rel_tp = 'aligned' THEN 1 ELSE 0 END +
                  CASE WHEN rel_sf = 'aligned' THEN 1 ELSE 0 END +
                  CASE WHEN rel_gn = 'aligned' THEN 1 ELSE 0 END +
                  CASE WHEN rel_ic = 'aligned' THEN 1 ELSE 0 END) = 0 THEN 0.90
            ELSE 1.0
        END AS expected_multiplier

    FROM axis_detail ad
)

SELECT
    nation_name,
    faction_name AS party,
    bloc_name AS bloc,
    population_weight AS pop_wt,
    ROUND(expected_alignment, 1) AS calc_alignment,
    ROUND(actual_alignment, 1) AS db_alignment,
    ROUND(ABS(expected_alignment - actual_alignment), 1) AS alignment_diff,
    opposed_count AS opp,
    aligned_count AS aln,
    expected_multiplier AS mult,
    ROUND(preference_score, 1) AS pref_score,
    ROUND(momentum, 1) AS momentum,
    ROUND(ideology_drift, 1) AS drift,
    ROUND(vote_share::numeric, 4) AS vote_share,
    -- Flag anomalies
    CASE
        WHEN ABS(expected_alignment - actual_alignment) > 5 THEN 'ALIGNMENT MISMATCH'
        WHEN opposed_count >= 2 AND preference_score > 60 THEN 'HIGH PREF DESPITE OPPOSITION'
        WHEN aligned_count >= 2 AND opposed_count = 0 AND preference_score < 30 THEN 'LOW PREF DESPITE ALIGNMENT'
        WHEN expected_alignment > 70 AND actual_alignment > 70 AND preference_score < 40 THEN 'PREF BELOW IDEOLOGY'
        WHEN expected_alignment < 30 AND actual_alignment < 30 AND preference_score > 70 THEN 'PREF ABOVE IDEOLOGY'
        ELSE 'OK'
    END AS status
FROM expected
ORDER BY nation_name, faction_name, bloc_name;
