-- ════════════════════════════════════════════════════════════════════════════════
-- Permit Policy Integrity + Admin Diagnostics
--
-- Goals:
-- 1) Verify all permit-law policies have a usable permit_key.
-- 2) Verify all referenced permit keys exist in construction_permits.
-- 3) Normalize required_for sectors for every permit law's intended scope.
-- 4) Add migration-time validation that flags:
--    - policy permit keys without matching construction_permits
--    - permits with empty/invalid required_for
-- 5) Add admin diagnostics for active permit laws by nation and affected sectors.
-- ════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Canonical sector mapping for permit laws.
-- This backfills/normalizes required_for to keep permit law behavior consistent.
WITH permit_sector_map(permit_key, required_for) AS (
    VALUES
        ('municipal_zoning',            '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('structural_engineering',      '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('fire_safety',                 '["civil_engineering"]'::jsonb),
        ('environmental_impact',        '["industrial","mega_project"]'::jsonb),
        ('air_quality',                 '["civil_engineering","industrial"]'::jsonb),
        ('waste_management',            '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('ohs_compliance',              '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('working_hours',               '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('union_representation',        '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('heavy_transport',             '["industrial","mega_project"]'::jsonb),
        ('performance_bond',            '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('tax_compliance',              '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('noise_vibration',             '["civil_engineering"]'::jsonb),
        ('hazmat_handling',             '["industrial","mega_project"]'::jsonb),
        ('water_resource',              '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('coastal_maritime',            '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('renewable_energy',            '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('telecom_infrastructure',      '["civil_engineering","industrial"]'::jsonb),
        ('agri_land_conversion',        '["civil_engineering","industrial"]'::jsonb),
        ('heritage_preservation',       '["civil_engineering","mega_project"]'::jsonb),
        ('seismic_resilience',          '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('disaster_preparedness',       '["civil_engineering","mega_project"]'::jsonb),
        ('foreign_investment_clearance','["industrial","mega_project"]'::jsonb),
        ('anti_corruption',             '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('local_workforce',             '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('apprenticeship_training',     '["civil_engineering","industrial","mega_project"]'::jsonb),
        ('community_consultation',      '["civil_engineering","mega_project"]'::jsonb),
        ('public_accessibility',        '["civil_engineering","mega_project"]'::jsonb)
)
UPDATE construction_permits cp
SET required_for = m.required_for
FROM permit_sector_map m
WHERE cp.permit_key = m.permit_key
  AND cp.required_for IS DISTINCT FROM m.required_for;

-- Migration-time verification + flagging.
-- We intentionally fail migration if integrity violations exist.
DO $$
DECLARE
    v_invalid_policy_rows INT := 0;
    v_missing_permit_rows INT := 0;
    v_invalid_required_rows INT := 0;
BEGIN
    -- Permit-law policies must have a non-empty permit_key.
    SELECT COUNT(*) INTO v_invalid_policy_rows
    FROM policies p
    WHERE p.major_sector = 'PERMITS'
      AND (p.permit_key IS NULL OR btrim(p.permit_key) = '');

    -- Referenced permit keys must exist (explicit check for visibility in migration logs).
    SELECT COUNT(*) INTO v_missing_permit_rows
    FROM policies p
    LEFT JOIN construction_permits cp ON cp.permit_key = p.permit_key
    WHERE p.major_sector = 'PERMITS'
      AND p.permit_key IS NOT NULL
      AND btrim(p.permit_key) <> ''
      AND cp.permit_key IS NULL;

    -- required_for must be a non-empty JSON array of known construction sectors.
    SELECT COUNT(*) INTO v_invalid_required_rows
    FROM construction_permits cp
    WHERE cp.permit_key IN (
        SELECT DISTINCT permit_key
        FROM policies
        WHERE major_sector = 'PERMITS'
          AND permit_key IS NOT NULL
          AND btrim(permit_key) <> ''
    )
      AND (
          jsonb_typeof(cp.required_for) <> 'array'
          OR jsonb_array_length(cp.required_for) = 0
          OR EXISTS (
              SELECT 1
              FROM jsonb_array_elements_text(cp.required_for) AS elem(sector)
              WHERE sector NOT IN ('civil_engineering', 'industrial', 'mega_project')
          )
      );

    RAISE NOTICE 'Permit policy integrity check: invalid policy permit_key rows=% | policy->permit misses=% | invalid required_for rows=%',
        v_invalid_policy_rows, v_missing_permit_rows, v_invalid_required_rows;

    IF v_invalid_policy_rows > 0 OR v_missing_permit_rows > 0 OR v_invalid_required_rows > 0 THEN
        RAISE EXCEPTION 'Permit policy integrity validation failed. See permit_policy_integrity_issues_v for flagged rows.';
    END IF;
END $$;

-- Persistent diagnostics view for admins / migration audits.
CREATE OR REPLACE VIEW permit_policy_integrity_issues_v AS
WITH permit_law_policies AS (
    SELECT p.id, p.policy_key, p.policy_name, p.major_sector, p.minor_sector, p.law_category, p.is_active, p.permit_key
    FROM policies p
    WHERE p.major_sector = 'PERMITS'
),
policy_without_permit_key AS (
    SELECT
        'policy_missing_permit_key'::text AS issue_type,
        p.id AS policy_id,
        p.policy_key,
        p.policy_name,
        p.permit_key,
        NULL::jsonb AS required_for,
        'Permit-law policy has NULL/blank permit_key'::text AS details
    FROM permit_law_policies p
    WHERE p.permit_key IS NULL OR btrim(p.permit_key) = ''
),
policy_missing_construction_permit AS (
    SELECT
        'policy_missing_construction_permit'::text AS issue_type,
        p.id AS policy_id,
        p.policy_key,
        p.policy_name,
        p.permit_key,
        NULL::jsonb AS required_for,
        'No matching construction_permits row for policy permit_key'::text AS details
    FROM permit_law_policies p
    LEFT JOIN construction_permits cp ON cp.permit_key = p.permit_key
    WHERE p.permit_key IS NOT NULL
      AND btrim(p.permit_key) <> ''
      AND cp.permit_key IS NULL
),
permit_invalid_required_for AS (
    SELECT
        'permit_invalid_required_for'::text AS issue_type,
        p.id AS policy_id,
        p.policy_key,
        p.policy_name,
        p.permit_key,
        cp.required_for,
        'required_for must be non-empty JSON array limited to civil_engineering|industrial|mega_project'::text AS details
    FROM permit_law_policies p
    JOIN construction_permits cp ON cp.permit_key = p.permit_key
    WHERE (
        jsonb_typeof(cp.required_for) <> 'array'
        OR jsonb_array_length(cp.required_for) = 0
        OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(cp.required_for) AS elem(sector)
            WHERE sector NOT IN ('civil_engineering', 'industrial', 'mega_project')
        )
    )
)
SELECT * FROM policy_without_permit_key
UNION ALL
SELECT * FROM policy_missing_construction_permit
UNION ALL
SELECT * FROM permit_invalid_required_for;

COMMENT ON VIEW permit_policy_integrity_issues_v IS
'Flags permit policy integrity problems: missing policy permit keys, missing construction_permits rows, and invalid required_for sector arrays.';

-- Admin diagnostics: active permit laws by nation + affected sectors.
CREATE OR REPLACE VIEW admin_active_permit_laws_by_nation_v AS
SELECT
    n.id AS nation_id,
    n.name,
    al.id AS active_law_id,
    al.passed_tick,
    al.passed_at,
    p.id AS policy_id,
    p.policy_key,
    p.policy_name,
    p.minor_sector,
    p.law_category,
    p.permit_key,
    cp.category AS permit_category,
    cp.required_for AS affected_sectors,
    ARRAY(
        SELECT DISTINCT elem
        FROM jsonb_array_elements_text(cp.required_for) AS t(elem)
        ORDER BY elem
    ) AS affected_sectors_list
FROM active_laws al
JOIN policies p ON p.id = al.policy_id
JOIN nations n ON n.id = al.nation_id
LEFT JOIN construction_permits cp ON cp.permit_key = p.permit_key
WHERE p.major_sector = 'PERMITS'
ORDER BY n.name, p.policy_name, al.passed_at DESC;

COMMENT ON VIEW admin_active_permit_laws_by_nation_v IS
'Admin diagnostic view: active permit laws per nation, with permit key/category and affected construction sectors (construction_permits.required_for).';

COMMIT;
