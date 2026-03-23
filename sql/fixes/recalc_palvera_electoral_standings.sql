-- ============================================================================
-- Recalculate electoral standings for Palvera with valley penalty
--
-- Problem: National Unity Party (centrist) incorrectly winning because the
-- valley penalty wasn't applied at polarization=100.
--
-- This script faithfully reproduces the JS logic from electorate.js:
--   bimodalAxisAlignment → spatialAxisCompetition → weighted alignment →
--   platform appeal drift → raw appeal → softmax → turnout → realized
-- ============================================================================

BEGIN;

-- ── Step 0: Identify Palvera and gather base data ──
WITH nation AS (
    SELECT id, polarization, stability
    FROM nations
    WHERE name ILIKE '%Palvera%'
    LIMIT 1
),
profile AS (
    SELECT ep.*
    FROM electorate_profile ep
    JOIN nation n ON ep.nation_id = n.id
),
parties AS (
    SELECT f.id AS faction_id, f.name AS faction_name,
           fi.liberty_equality, fi.tradition_progress, fi.security_freedom,
           fi.globalism_nationalism, fi.individualism_collectivism
    FROM factions f
    JOIN nation n ON f.nation_id = n.id
    JOIN faction_ideology fi ON fi.faction_id = f.id
    WHERE f.faction_type = 'party'
),
standings AS (
    SELECT fes.*
    FROM faction_electoral_standing fes
    JOIN nation n ON fes.nation_id = n.id
    JOIN factions f ON f.id = fes.faction_id AND f.faction_type = 'party'
),

-- ── Step 1: Bimodal axis alignment per party per axis ──
-- Unnest axes into rows for set-based processing
axes AS (
    SELECT unnest(ARRAY['liberty_equality','tradition_progress','security_freedom',
                         'globalism_nationalism','individualism_collectivism']) AS axis_key
),
party_axis_raw AS (
    SELECT
        p.faction_id,
        p.faction_name,
        a.axis_key,
        -- Party position normalized to 0-100
        CASE a.axis_key
            WHEN 'liberty_equality'            THEN (p.liberty_equality + 100.0) / 2.0
            WHEN 'tradition_progress'          THEN (p.tradition_progress + 100.0) / 2.0
            WHEN 'security_freedom'            THEN (p.security_freedom + 100.0) / 2.0
            WHEN 'globalism_nationalism'       THEN (p.globalism_nationalism + 100.0) / 2.0
            WHEN 'individualism_collectivism'  THEN (p.individualism_collectivism + 100.0) / 2.0
        END AS party_pos,
        -- Electorate mean
        CASE a.axis_key
            WHEN 'liberty_equality'            THEN pr.ideo_mean_liberty_equality
            WHEN 'tradition_progress'          THEN pr.ideo_mean_tradition_progress
            WHEN 'security_freedom'            THEN pr.ideo_mean_security_freedom
            WHEN 'globalism_nationalism'       THEN pr.ideo_mean_globalism_nationalism
            WHEN 'individualism_collectivism'  THEN pr.ideo_mean_individualism_collectivism
        END AS elec_mean,
        -- Electorate variance
        CASE a.axis_key
            WHEN 'liberty_equality'            THEN pr.ideo_var_liberty_equality
            WHEN 'tradition_progress'          THEN pr.ideo_var_tradition_progress
            WHEN 'security_freedom'            THEN pr.ideo_var_security_freedom
            WHEN 'globalism_nationalism'       THEN pr.ideo_var_globalism_nationalism
            WHEN 'individualism_collectivism'  THEN pr.ideo_var_individualism_collectivism
        END AS elec_var,
        -- Salience
        CASE a.axis_key
            WHEN 'liberty_equality'            THEN pr.salience_liberty_equality
            WHEN 'tradition_progress'          THEN pr.salience_tradition_progress
            WHEN 'security_freedom'            THEN pr.salience_security_freedom
            WHEN 'globalism_nationalism'       THEN pr.salience_globalism_nationalism
            WHEN 'individualism_collectivism'  THEN pr.salience_individualism_collectivism
        END AS salience
    FROM parties p
    CROSS JOIN axes a
    CROSS JOIN profile pr
),
-- Compute bimodal alignment with valley penalty
party_axis_alignment AS (
    SELECT
        pa.*,
        -- sigma = max(5, elecVar)
        GREATEST(5.0, pa.elec_var) AS sigma,
        -- polWeight = clamp((elecVar - 10) / 30, 0, 1)
        LEAST(1.0, GREATEST(0.0, (pa.elec_var - 10.0) / 30.0)) AS pol_weight,
        -- offset = elecVar * 0.67
        pa.elec_var * 0.67 AS hump_offset
    FROM party_axis_raw pa
),
party_axis_scores AS (
    SELECT
        paa.*,
        -- Unimodal gaussian
        exp(-power(paa.party_pos - paa.elec_mean, 2) / (2.0 * power(paa.sigma, 2)))
            AS unimodal,
        -- Hump sigma = max(5, sigma * (0.45 - 0.20 * polWeight))
        GREATEST(5.0, paa.sigma * (0.45 - 0.20 * paa.pol_weight)) AS hump_sigma,
        -- Left/right hump positions
        LEAST(100.0, GREATEST(0.0, paa.elec_mean - paa.hump_offset)) AS left_hump,
        LEAST(100.0, GREATEST(0.0, paa.elec_mean + paa.hump_offset)) AS right_hump,
        -- Distance from mean (for valley penalty)
        abs(paa.party_pos - paa.elec_mean) AS dist_from_mean
    FROM party_axis_alignment paa
),
party_axis_bimodal AS (
    SELECT
        pas.*,
        -- Bimodal = max of left/right hump gaussians
        GREATEST(
            exp(-power(pas.party_pos - pas.left_hump, 2) / (2.0 * power(pas.hump_sigma, 2))),
            exp(-power(pas.party_pos - pas.right_hump, 2) / (2.0 * power(pas.hump_sigma, 2)))
        ) AS bimodal,
        -- Valley penalty
        CASE
            WHEN pas.dist_from_mean < pas.hump_offset * 0.6 AND pas.pol_weight > 0 THEN
                1.0 - (
                    (1.0 - pas.dist_from_mean / (pas.hump_offset * 0.6))  -- valleyDepth
                    * pas.pol_weight
                    * 0.70
                )
            ELSE 1.0
        END AS valley_penalty
    FROM party_axis_scores pas
),
party_axis_final AS (
    SELECT
        pab.*,
        -- rawBlend = (1 - polWeight) * unimodal + polWeight * bimodal
        -- axisScore = rawBlend * valleyPenalty
        -- But if polWeight <= 0, just return unimodal
        CASE
            WHEN pab.pol_weight <= 0 THEN pab.unimodal
            ELSE (
                (1.0 - pab.pol_weight) * pab.unimodal + pab.pol_weight * pab.bimodal
            ) * pab.valley_penalty
        END AS axis_score
    FROM party_axis_bimodal pab
),

-- ── Step 2: Spatial competition per axis ──
-- Softmax over alignment scores per axis (temperature = 4)
axis_totals AS (
    SELECT
        axis_key,
        MAX(axis_score) AS max_score
    FROM party_axis_final
    GROUP BY axis_key
),
party_axis_exp AS (
    SELECT
        paf.*,
        at.max_score AS pool_quality,
        exp((paf.axis_score - at.max_score) / 4.0) AS exp_score
    FROM party_axis_final paf
    JOIN axis_totals at ON at.axis_key = paf.axis_key
),
axis_exp_sums AS (
    SELECT axis_key, SUM(exp_score) AS sum_exp
    FROM party_axis_exp
    GROUP BY axis_key
),
party_axis_shares AS (
    SELECT
        pae.faction_id,
        pae.faction_name,
        pae.axis_key,
        pae.salience,
        pae.axis_score,
        pae.valley_penalty,
        -- share = (exp_score / sum_exp) * poolQuality
        ROUND((pae.exp_score / aes.sum_exp) * pae.pool_quality, 3) AS axis_share
    FROM party_axis_exp pae
    JOIN axis_exp_sums aes ON aes.axis_key = pae.axis_key
),

-- ── Step 3: Weighted alignment ──
-- weight = salience (profile salience only; skipping issue salience for this fix)
-- raw_share = sum(axis_share * salience) / sum(salience)
-- Then sqrt compression: alignment = clamp(sqrt(raw_share / fairShare) * 50, 0, 100)
party_count AS (
    SELECT COUNT(DISTINCT faction_id)::float AS n_parties FROM parties
),
party_raw_share AS (
    SELECT
        pas.faction_id,
        pas.faction_name,
        SUM(pas.axis_share * pas.salience) / NULLIF(SUM(pas.salience), 0) AS raw_share
    FROM party_axis_shares pas
    GROUP BY pas.faction_id, pas.faction_name
),
party_alignment AS (
    SELECT
        prs.faction_id,
        prs.faction_name,
        prs.raw_share,
        -- fairShare = 1 / n_parties
        -- relativeStrength = raw_share / fairShare
        -- scaledStrength = clamp(sqrt(relativeStrength) * 50, 0, 100)
        LEAST(100.0, GREATEST(0.0,
            sqrt(prs.raw_share / NULLIF(1.0 / pc.n_parties, 0)) * 50.0
        )) AS new_alignment
    FROM party_raw_share prs
    CROSS JOIN party_count pc
),

-- ── Step 4: Platform appeal drift ──
-- new_platform_appeal = clamp(old + (new_alignment - old_alignment) * 0.3, 10, 90)
party_appeal AS (
    SELECT
        pa.faction_id,
        pa.faction_name,
        pa.new_alignment,
        s.ideological_alignment AS old_alignment,
        s.platform_appeal AS old_platform_appeal,
        s.party_approval,
        s.visibility,
        s.credibility_modifier,
        s.turnout_rate AS old_turnout_rate,
        s.raw_appeal AS old_raw_appeal,
        s.contested_vote_share AS old_contested,
        s.realized_vote_share AS old_realized,
        LEAST(90.0, GREATEST(10.0,
            s.platform_appeal + (pa.new_alignment - s.ideological_alignment) * 0.3
        )) AS new_platform_appeal
    FROM party_alignment pa
    JOIN standings s ON s.faction_id = pa.faction_id
),

-- ── Step 5: Raw appeal (dynamic credibility weighting) ──
chaos_params AS (
    SELECT
        LEAST(1.0, GREATEST(0.0,
            (n.polarization / 100.0 + (1.0 - n.stability / 100.0)) / 2.0
        )) AS chaos_index,
        n.polarization,
        n.stability
    FROM nation n
),
pillar_weights AS (
    SELECT
        cp.chaos_index,
        -- credWeight = 0.35 - chaosIndex * (0.35 - 0.05)
        0.35 - cp.chaos_index * 0.30 AS cred_weight,
        -- otherBaseSum = 0.25 + 0.20 + 0.20 + 0.15 = 0.80
        0.80 AS other_base_sum
    FROM chaos_params cp
),
weights AS (
    SELECT
        pw.cred_weight,
        -- otherScale = (1 - credWeight) / 0.80
        (1.0 - pw.cred_weight) / pw.other_base_sum AS other_scale,
        0.25 * ((1.0 - pw.cred_weight) / pw.other_base_sum) AS w_align,
        0.20 * ((1.0 - pw.cred_weight) / pw.other_base_sum) AS w_appeal,
        0.20 * ((1.0 - pw.cred_weight) / pw.other_base_sum) AS w_approval,
        0.15 * ((1.0 - pw.cred_weight) / pw.other_base_sum) AS w_visibility
    FROM pillar_weights pw
),
party_raw_appeal AS (
    SELECT
        pap.faction_id,
        pap.faction_name,
        pap.new_alignment,
        pap.old_alignment,
        pap.new_platform_appeal,
        pap.old_platform_appeal,
        pap.party_approval,
        pap.visibility,
        pap.credibility_modifier,
        pap.old_raw_appeal,
        pap.old_contested,
        pap.old_realized,
        pap.old_turnout_rate,
        -- credScore = clamp((credibility_modifier - 0.5) * 100, 0, 100)
        LEAST(100.0, GREATEST(0.0, (pap.credibility_modifier - 0.5) * 100.0)) AS cred_score,
        -- raw_appeal = alignment*wAlign + appeal*wAppeal + approval*wApproval + vis*wVis + credScore*credWeight
        ROUND((
            pap.new_alignment * w.w_align +
            pap.new_platform_appeal * w.w_appeal +
            pap.party_approval * w.w_approval +
            pap.visibility * w.w_visibility +
            LEAST(100.0, GREATEST(0.0, (pap.credibility_modifier - 0.5) * 100.0)) * w.cred_weight
        )::numeric, 2) AS new_raw_appeal,
        w.w_align, w.w_appeal, w.w_approval, w.w_visibility, w.cred_weight
    FROM party_appeal pap
    CROSS JOIN weights w
),

-- ── Step 6: Softmax → contested_vote_share (temperature = 8) ──
softmax_max AS (
    SELECT MAX(new_raw_appeal) AS max_appeal FROM party_raw_appeal
),
party_softmax AS (
    SELECT
        pra.*,
        exp((pra.new_raw_appeal - sm.max_appeal) / 8.0) AS exp_appeal
    FROM party_raw_appeal pra
    CROSS JOIN softmax_max sm
),
softmax_sum AS (
    SELECT SUM(exp_appeal) AS total_exp FROM party_softmax
),
party_contested AS (
    SELECT
        ps.*,
        ROUND((ps.exp_appeal / ss.total_exp)::numeric, 4) AS new_contested
    FROM party_softmax ps
    CROSS JOIN softmax_sum ss
),

-- ── Step 7: Realized vote share (turnout) ──
-- Using existing turnout_rate from standings (not recalculating turnout here)
party_realized_raw AS (
    SELECT
        pc.*,
        pc.new_contested * pc.old_turnout_rate AS realized_raw
    FROM party_contested pc
),
realized_sum AS (
    SELECT SUM(realized_raw) AS total_realized FROM party_realized_raw
),
party_final AS (
    SELECT
        prr.*,
        ROUND((prr.realized_raw / NULLIF(rs.total_realized, 0))::numeric, 4) AS new_realized
    FROM party_realized_raw prr
    CROSS JOIN realized_sum rs
)

-- ══════════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC SELECT: show old vs new values for each party
-- ══════════════════════════════════════════════════════════════════════════════
SELECT
    pf.faction_name,
    -- Alignment
    ROUND(pf.old_alignment::numeric, 2) AS old_align,
    ROUND(pf.new_alignment::numeric, 2) AS new_align,
    ROUND((pf.new_alignment - pf.old_alignment)::numeric, 2) AS align_delta,
    -- Platform appeal
    ROUND(pf.old_platform_appeal::numeric, 2) AS old_appeal,
    ROUND(pf.new_platform_appeal::numeric, 2) AS new_appeal,
    -- Raw appeal
    ROUND(pf.old_raw_appeal::numeric, 2) AS old_raw,
    pf.new_raw_appeal AS new_raw,
    -- Vote shares
    ROUND((pf.old_contested * 100)::numeric, 2) AS old_contested_pct,
    ROUND((pf.new_contested * 100)::numeric, 2) AS new_contested_pct,
    ROUND((pf.old_realized * 100)::numeric, 2) AS old_realized_pct,
    ROUND((pf.new_realized * 100)::numeric, 2) AS new_realized_pct,
    -- Key debug info
    ROUND(pf.visibility::numeric, 1) AS vis,
    ROUND(pf.credibility_modifier::numeric, 3) AS cred,
    ROUND(pf.party_approval::numeric, 1) AS approval,
    -- Weight info (same for all rows but useful for verification)
    ROUND(pf.cred_weight::numeric, 4) AS cred_w
FROM party_final pf
ORDER BY pf.new_realized DESC;

ROLLBACK;
-- ══════════════════════════════════════════════════════════════════════════════
-- To actually apply the update, replace the SELECT + ROLLBACK above with
-- the UPDATE + COMMIT block below (uncomment it):
-- ══════════════════════════════════════════════════════════════════════════════

/*
-- Apply the recalculated values
UPDATE faction_electoral_standing fes
SET
    ideological_alignment = pf.new_alignment,
    platform_appeal       = pf.new_platform_appeal,
    raw_appeal            = pf.new_raw_appeal,
    contested_vote_share  = pf.new_contested,
    realized_vote_share   = pf.new_realized
FROM party_final pf
WHERE fes.faction_id = pf.faction_id
  AND fes.nation_id = (SELECT id FROM nation);

COMMIT;
*/
