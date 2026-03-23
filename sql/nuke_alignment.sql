-- ============================================================================
-- SQL NUKE: Recalculate all electoral standings for Palvera
-- Bypasses the ±2/tick alignment drift cap
-- Recomputes: alignment → platform_appeal → raw_appeal → vote shares
-- ============================================================================

-- Step 1: Preview (SELECT) — run this first to verify before updating
-- Step 2: Update (UPDATE) — uncomment the UPDATE block at the bottom

WITH nation AS (
    SELECT id, polarization::float8 AS polarization, stability::float8 AS stability
    FROM nations
    WHERE name ILIKE '%Palvera%'
    LIMIT 1
),
profile AS (
    SELECT ep.*
    FROM electorate_profile ep
    JOIN nation n ON n.id = ep.nation_id
),
-- Unpivot electorate axes: mean, variance, salience per axis
elec_axes AS (
    SELECT v.*
    FROM profile p
    CROSS JOIN LATERAL (VALUES
        ('liberty_equality',           p.ideo_mean_liberty_equality::float8,           p.ideo_var_liberty_equality::float8,           COALESCE(p.salience_liberty_equality, 0.200)::float8),
        ('tradition_progress',         p.ideo_mean_tradition_progress::float8,         p.ideo_var_tradition_progress::float8,         COALESCE(p.salience_tradition_progress, 0.200)::float8),
        ('security_freedom',           p.ideo_mean_security_freedom::float8,           p.ideo_var_security_freedom::float8,           COALESCE(p.salience_security_freedom, 0.200)::float8),
        ('globalism_nationalism',      p.ideo_mean_globalism_nationalism::float8,      p.ideo_var_globalism_nationalism::float8,      COALESCE(p.salience_globalism_nationalism, 0.200)::float8),
        ('individualism_collectivism', p.ideo_mean_individualism_collectivism::float8, p.ideo_var_individualism_collectivism::float8,  COALESCE(p.salience_individualism_collectivism, 0.200)::float8)
    ) AS v(axis_key, elec_mean, elec_var, salience)
),
-- Active parties
active_parties AS (
    SELECT f.id AS faction_id, f.faction_name
    FROM factions f
    JOIN nation n ON n.id = f.nation_id
    WHERE f.faction_type = 'party'
      AND f.abandoned_at IS NULL
),
party_count AS (
    SELECT COUNT(*)::float8 AS n FROM active_parties
),
-- Unpivot faction ideology: normalize -100..100 → 0..100
faction_axes AS (
    SELECT
        fi.faction_id,
        v.axis_key,
        (v.raw_val::float8 + 100.0) / 2.0 AS party_pos
    FROM faction_ideology fi
    JOIN active_parties ap ON ap.faction_id = fi.faction_id
    CROSS JOIN LATERAL (VALUES
        ('liberty_equality',           fi.liberty_equality::float8),
        ('tradition_progress',         fi.tradition_progress::float8),
        ('security_freedom',           fi.security_freedom::float8),
        ('globalism_nationalism',      fi.globalism_nationalism::float8),
        ('individualism_collectivism', fi.individualism_collectivism::float8)
    ) AS v(axis_key, raw_val)
),

-- ============================================================================
-- BIMODAL AXIS ALIGNMENT with valley penalty (per faction × axis)
-- Replicates bimodalAxisAlignment() from the tick engine
-- ============================================================================
bimodal AS (
    SELECT
        fa.faction_id,
        fa.axis_key,
        ea.salience,
        fa.party_pos,
        ea.elec_mean,
        ea.elec_var,
        -- Intermediate values for readability
        GREATEST(5.0, ea.elec_var) AS sigma,
        LEAST(1.0, GREATEST(0.0, (ea.elec_var - 10.0) / 30.0)) AS pol_weight,
        ea.elec_var * 0.67 AS offset_val,
        -- Unimodal Gaussian
        exp(-power(fa.party_pos - ea.elec_mean, 2)
            / (2.0 * power(GREATEST(5.0, ea.elec_var), 2))) AS unimodal,
        -- Hump sigma
        GREATEST(5.0,
            GREATEST(5.0, ea.elec_var)
            * (0.45 - 0.20 * LEAST(1.0, GREATEST(0.0, (ea.elec_var - 10.0) / 30.0)))
        ) AS hump_sigma,
        -- Left/right humps
        LEAST(100.0, GREATEST(0.0, ea.elec_mean - ea.elec_var * 0.67)) AS left_hump,
        LEAST(100.0, GREATEST(0.0, ea.elec_mean + ea.elec_var * 0.67)) AS right_hump
    FROM faction_axes fa
    JOIN elec_axes ea ON ea.axis_key = fa.axis_key
),
bimodal_scored AS (
    SELECT
        b.*,
        -- Bimodal = max of left/right Gaussians
        GREATEST(
            exp(-power(b.party_pos - b.left_hump, 2) / (2.0 * power(b.hump_sigma, 2))),
            exp(-power(b.party_pos - b.right_hump, 2) / (2.0 * power(b.hump_sigma, 2)))
        ) AS bimodal_val,
        -- Distance from mean
        abs(b.party_pos - b.elec_mean) AS dist_from_mean,
        -- Valley threshold
        b.offset_val * 0.6 AS valley_threshold
    FROM bimodal b
),
bimodal_final AS (
    SELECT
        bs.faction_id,
        bs.axis_key,
        bs.salience,
        -- Final score = raw_blend × valley_penalty
        (CASE
            WHEN bs.pol_weight <= 0 THEN bs.unimodal
            ELSE (1.0 - bs.pol_weight) * bs.unimodal + bs.pol_weight * bs.bimodal_val
        END)
        *
        (CASE
            WHEN bs.dist_from_mean < bs.valley_threshold AND bs.pol_weight > 0
                 AND bs.valley_threshold > 0 THEN
                1.0 - ((1.0 - bs.dist_from_mean / bs.valley_threshold) * bs.pol_weight * 0.70)
            ELSE 1.0
        END) AS axis_score
    FROM bimodal_scored bs
),

-- ============================================================================
-- SPATIAL AXIS COMPETITION: softmax(bimodal_scores, temp=4) × poolQuality
-- Replicates spatialAxisCompetition() from the tick engine
-- ============================================================================
spatial_softmax AS (
    SELECT
        bf.faction_id,
        bf.axis_key,
        bf.salience,
        bf.axis_score,
        MAX(bf.axis_score) OVER (PARTITION BY bf.axis_key) AS pool_quality,
        exp((bf.axis_score - MAX(bf.axis_score) OVER (PARTITION BY bf.axis_key)) / 4.0) AS exp_val,
        SUM(exp((bf.axis_score - MAX(bf.axis_score) OVER (PARTITION BY bf.axis_key)) / 4.0))
            OVER (PARTITION BY bf.axis_key) AS sum_exp
    FROM bimodal_final bf
),
spatial_shares AS (
    SELECT
        faction_id,
        axis_key,
        salience,
        CASE
            WHEN sum_exp > 0 THEN (exp_val / sum_exp) * pool_quality
            ELSE pool_quality / (SELECT n FROM party_count)
        END AS axis_competitive_score
    FROM spatial_softmax
),

-- ============================================================================
-- WEIGHTED ALIGNMENT: salience-weighted average → sqrt compression
-- Replicates computeSpatialAlignments() from the tick engine
-- ============================================================================
weighted_alignment AS (
    SELECT
        ss.faction_id,
        LEAST(100.0, GREATEST(0.0,
            sqrt(
                GREATEST(0.0,
                    (SUM(ss.axis_competitive_score * ss.salience) / NULLIF(SUM(ss.salience), 0))
                    / NULLIF(1.0 / pc.n, 0)
                )
            ) * 50.0
        )) AS new_alignment
    FROM spatial_shares ss
    CROSS JOIN party_count pc
    GROUP BY ss.faction_id, pc.n
),

-- ============================================================================
-- PLATFORM APPEAL: ideology_baseline (alignment × 0.3) + stance_contribution
-- ============================================================================
new_standings AS (
    SELECT
        wa.faction_id,
        wa.new_alignment,
        -- New platform appeal (bypass drift cap)
        LEAST(90.0, GREATEST(10.0,
            wa.new_alignment * 0.3 + COALESCE(fes.stance_contribution_total, 0)::float8
        )) AS new_platform_appeal,
        -- Unchanged pillars
        fes.party_approval::float8     AS party_approval,
        fes.visibility::float8         AS visibility,
        fes.credibility_modifier::float8 AS credibility_modifier,
        fes.turnout_rate::float8       AS turnout_rate,
        -- Reference
        fes.id                         AS standing_id,
        COALESCE(fes.stance_contribution_total, 0)::float8 AS stance_contribution_total,
        -- Old values for comparison
        fes.ideological_alignment::float8 AS old_alignment,
        fes.platform_appeal::float8    AS old_platform_appeal,
        fes.raw_appeal::float8         AS old_raw_appeal,
        fes.contested_vote_share::float8 AS old_contested,
        fes.realized_vote_share::float8  AS old_realized
    FROM weighted_alignment wa
    JOIN nation n ON TRUE
    JOIN faction_electoral_standing fes ON fes.faction_id = wa.faction_id AND fes.nation_id = n.id
),

-- ============================================================================
-- RAW APPEAL: 5-pillar weighted sum with dynamic credibility weight
-- Replicates the raw_appeal computation from the tick engine
-- ============================================================================
raw_appeal_calc AS (
    SELECT
        ns.*,
        -- Chaos index
        LEAST(1.0, GREATEST(0.0,
            ((SELECT polarization FROM nation) / 100.0 + (1.0 - (SELECT stability FROM nation) / 100.0)) / 2.0
        )) AS chaos_index
    FROM new_standings ns
),
raw_appeal_final AS (
    SELECT
        rac.*,
        -- Dynamic weights
        (0.35 - rac.chaos_index * 0.30) AS cred_weight,
        (1.0 - (0.35 - rac.chaos_index * 0.30)) / 0.80 AS other_scale,
        -- Credibility score
        LEAST(100.0, GREATEST(0.0, (COALESCE(rac.credibility_modifier, 1.0) - 0.5) * 100.0)) AS cred_score,
        -- Raw appeal = weighted pillar sum
        (
            rac.new_alignment      * 0.25 * (1.0 - (0.35 - rac.chaos_index * 0.30)) / 0.80
          + rac.new_platform_appeal * 0.20 * (1.0 - (0.35 - rac.chaos_index * 0.30)) / 0.80
          + rac.party_approval      * 0.20 * (1.0 - (0.35 - rac.chaos_index * 0.30)) / 0.80
          + rac.visibility           * 0.15 * (1.0 - (0.35 - rac.chaos_index * 0.30)) / 0.80
          + LEAST(100.0, GREATEST(0.0, (COALESCE(rac.credibility_modifier, 1.0) - 0.5) * 100.0))
            * (0.35 - rac.chaos_index * 0.30)
        ) AS new_raw_appeal
    FROM raw_appeal_calc rac
),

-- ============================================================================
-- SOFTMAX → contested_vote_share (temperature = 8)
-- ============================================================================
max_appeal AS (
    SELECT MAX(new_raw_appeal) AS max_ra FROM raw_appeal_final
),
softmax_calc AS (
    SELECT
        raf.*,
        exp((raf.new_raw_appeal - ma.max_ra) / 8.0) AS exp_val
    FROM raw_appeal_final raf
    CROSS JOIN max_appeal ma
),
softmax_total AS (
    SELECT SUM(exp_val) AS total_exp FROM softmax_calc
),

-- ============================================================================
-- VOTE SHARES: contested × turnout → realized (renormalized)
-- ============================================================================
vote_shares AS (
    SELECT
        sc.*,
        sc.exp_val / st.total_exp AS new_contested,
        (sc.exp_val / st.total_exp) * sc.turnout_rate AS realized_raw
    FROM softmax_calc sc
    CROSS JOIN softmax_total st
),
realized_total AS (
    SELECT SUM(realized_raw) AS total_realized FROM vote_shares
),
final_results AS (
    SELECT
        vs.standing_id,
        vs.faction_id,
        ROUND(vs.new_alignment::numeric, 2)              AS new_alignment,
        ROUND(vs.new_platform_appeal::numeric, 2)        AS new_platform_appeal,
        ROUND((vs.new_alignment * 0.3)::numeric, 2)      AS new_ideology_baseline,
        ROUND(vs.new_raw_appeal::numeric, 2)              AS new_raw_appeal,
        ROUND(vs.new_contested::numeric, 4)               AS new_contested_vote_share,
        ROUND(vs.new_contested::numeric, 4)               AS new_base_vote_share,
        ROUND((vs.realized_raw / rt.total_realized)::numeric, 4) AS new_realized_vote_share,
        -- Old values
        vs.old_alignment,
        vs.old_platform_appeal,
        vs.old_raw_appeal,
        vs.old_contested,
        vs.old_realized,
        vs.stance_contribution_total,
        vs.turnout_rate
    FROM vote_shares vs
    CROSS JOIN realized_total rt
)

-- ====================== PREVIEW ======================
SELECT
    ap.faction_name,
    ROUND(fr.old_alignment::numeric, 1)           AS old_align,
    fr.new_alignment                               AS new_align,
    ROUND(fr.old_platform_appeal::numeric, 1)      AS old_appeal,
    fr.new_platform_appeal                         AS new_appeal,
    ROUND(fr.old_raw_appeal::numeric, 1)           AS old_raw,
    fr.new_raw_appeal                              AS new_raw,
    ROUND((fr.old_contested * 100)::numeric, 1)    AS "old_cvs%",
    ROUND((fr.new_contested_vote_share * 100)::numeric, 1) AS "new_cvs%",
    ROUND((fr.old_realized * 100)::numeric, 1)     AS "old_rvs%",
    ROUND((fr.new_realized_vote_share * 100)::numeric, 1)  AS "new_rvs%",
    ROUND(fr.turnout_rate::numeric, 3)             AS turnout
FROM final_results fr
JOIN active_parties ap ON ap.faction_id = fr.faction_id
ORDER BY fr.new_realized_vote_share DESC;

-- ====================== UPDATE (uncomment to apply) ======================
-- UPDATE faction_electoral_standing fes
-- SET
--     ideological_alignment  = fr.new_alignment,
--     platform_appeal        = fr.new_platform_appeal,
--     ideology_baseline      = fr.new_ideology_baseline,
--     raw_appeal             = fr.new_raw_appeal,
--     contested_vote_share   = fr.new_contested_vote_share,
--     base_vote_share        = fr.new_base_vote_share,
--     realized_vote_share    = fr.new_realized_vote_share,
--     alignment_contribution = ROUND((fr.new_alignment * 0.25 * (1.0 - (0.35 - ((SELECT polarization FROM nation) / 100.0 + (1.0 - (SELECT stability FROM nation) / 100.0)) / 2.0 * 0.30)) / 0.80 / 100)::numeric, 4),
--     appeal_contribution    = ROUND((fr.new_platform_appeal * 0.20 * (1.0 - (0.35 - ((SELECT polarization FROM nation) / 100.0 + (1.0 - (SELECT stability FROM nation) / 100.0)) / 2.0 * 0.30)) / 0.80 / 100)::numeric, 4)
-- FROM final_results fr
-- WHERE fes.id = fr.standing_id;
