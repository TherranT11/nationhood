-- ════════════════════════════════════════════════════════════════════════════════
-- Health Insurance — Phase 1: Foundation (building + service flag, no revenue yet)
--
-- Adds:
--   1. property_catalog.subsector_lock         — restricts a template to a corp subsector
--   2. property_catalog.min_skilled_workforce  — informational staffing requirement
--   3. Two Insurance Office templates (small + medium) gated to Insurance subsector
--   4. universal_healthcare policy stub (is_active=false) so the activation gate
--      has something to check from day one
--
-- Idempotent. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. Schema additions on property_catalog
ALTER TABLE property_catalog
    ADD COLUMN IF NOT EXISTS subsector_lock TEXT,
    ADD COLUMN IF NOT EXISTS min_skilled_workforce INT DEFAULT 0;

COMMENT ON COLUMN property_catalog.subsector_lock IS
    'Lower-case corp_subsector value (e.g. ''insurance'') that gates this template. NULL = available to any subsector.';
COMMENT ON COLUMN property_catalog.min_skilled_workforce IS
    'Skilled workforce headcount needed for the property to operate. Checked at the corp-pool level (sum across all such properties).';

-- 2. Insurance Office templates
INSERT INTO property_catalog
    (name, type, style, base_cost, capacity, base_maintenance, size_class, description,
     city_template, min_gdp_growth, min_sol, sector_affinity, subsector_lock, min_skilled_workforce)
VALUES
    ('Insurance Office — Branch',  'insurance_office', 'Modern',  2400000, 300, 16000,
     'small',
     'A neighbourhood insurance office for selling and servicing private health policies. Requires skilled underwriters, actuaries, and customer-service staff to operate.',
     'capital', 0, 15, 'finance', 'insurance', 180),
    ('Insurance Office — Regional','insurance_office', 'Modern',  6800000, 800, 38000,
     'medium',
     'A regional insurance hub with a full underwriting floor and claims processing. Anchors a private health insurance operation across a wide service area.',
     'capital', 15, 25, 'finance', 'insurance', 480)
ON CONFLICT DO NOTHING;

-- 3. universal_healthcare policy stub — inactive placeholder so the gating
--    check in corp-operations-finance.html has a known policy_key to look for.
--    Effects/wiring will be filled in by a future policy-design migration.
DO $$
DECLARE v_policy_id uuid;
BEGIN
    -- Skip if it already exists (e.g. legacy data)
    IF EXISTS (SELECT 1 FROM policies WHERE policy_key = 'universal_healthcare') THEN
        RAISE NOTICE 'universal_healthcare policy already exists, skipping stub insert';
        RETURN;
    END IF;

    INSERT INTO policies (
        policy_key, policy_name, policy_type, description,
        major_sector, minor_sector, law_category, fiscal_category,
        ideology, ideologies,
        upfront_cost, upfront_scaling_stat,
        ongoing_base_cost, ongoing_scaling_stat,
        stat_effects, opposed_policy_ids, requires_policy_id,
        target_stat, stat_direction, stat_change_per_tick, duration_months,
        stat_floor, stat_ceiling, ongoing_cost_per_tick, is_active
    ) VALUES (
        'universal_healthcare',
        'Universal Healthcare Act', 'lever',
        'A nationwide single-payer health system funded by taxation. Citizens receive comprehensive care without private premiums. Private health insurance corporations may not write new policies in any nation where this Act is in force. (Stub: effects to be defined in a future migration.)',
        'SOCIAL', 'Healthcare', 'Social Policy', 'Welfare',
        'Equality', '["Equality","Collectivism"]'::jsonb,
        0, NULL,
        0, NULL,
        '[]'::jsonb,
        NULL, NULL,
        'healthcare_accessibility', 'UP', 0, 0, 0, 100, 0, false
    ) RETURNING id INTO v_policy_id;
    RAISE NOTICE 'Created stub policy: Universal Healthcare Act (%) — policy_key: universal_healthcare', v_policy_id;
END $$;

-- ════════════════════════════════════════════════════════════════════════════════
-- VERIFY — should return the two new catalog rows + the stub policy.
-- ════════════════════════════════════════════════════════════════════════════════
SELECT name, type, subsector_lock, min_skilled_workforce, base_cost, capacity
  FROM property_catalog
 WHERE type = 'insurance_office';

SELECT policy_key, policy_name, is_active
  FROM policies
 WHERE policy_key = 'universal_healthcare';
