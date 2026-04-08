-- ============================================================
-- Pre-activate STRUCTURAL policies for Vostia
-- ============================================================
-- Based on Calveth template, adjusted for Vostia's stat profile:
-- Lower taxes, higher corruption, higher religiosity, moderate freedom
-- All policies: activated_at_tick=0, effects_started=true,
-- effects_completed=true, ticks_elapsed=48
-- (effects already baked into starting nation stats)
-- ============================================================

DO $$
DECLARE
    v_vo uuid;
    v_policy_id uuid;
BEGIN

SELECT id INTO v_vo FROM nations WHERE LOWER(name) = 'vostia';
IF v_vo IS NULL THEN
    RAISE EXCEPTION 'Vostia nation not found — run insert_vostia.sql first';
END IF;

-- ── GOVERNANCE ──

-- Anti-Corruption Commission
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'anti-corruption commission' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Justice', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Civil Service Meritocracy Reform
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'civil service meritocracy reform' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Interministerial Coordination Office
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'interministerial coordination office' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Interior', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Press Freedom Protection
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'press freedom protection' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'GOVERNANCE', 'Media', 'Justice', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Public Broadcasting Service
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'public broadcasting service' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'GOVERNANCE', 'Media', 'Interior', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Voting Rights Expansion
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'voting rights expansion' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'GOVERNANCE', 'Electoral', 'Interior', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Emergency Care Non-Refusal Mandate
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'emergency care non-refusal mandate' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'GOVERNANCE', 'Regulatory', 'Health', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- ── ECONOMICS ──

-- Integrated Tax Administration System
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'integrated tax administration system' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Inflation Targeting Framework
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'inflation targeting framework' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Small Business Credit Guarantee
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'small business credit guarantee' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'ECONOMICS', 'Fiscal Policy', 'Finance', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Export Credit Agency
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'export credit agency' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'ECONOMICS', 'Trade Policy', 'Finance', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Utility Price Regulation
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'utility price regulation' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'ECONOMICS', 'Regulatory', 'Interior', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Zoning Reform Act
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'zoning reform act' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'ECONOMICS', 'Infrastructure', 'Transportation', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- ── SOCIAL / HEALTHCARE ──

-- Healthcare Services Expansion
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'healthcare services expansion' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'SOCIAL', 'Healthcare', 'Healthcare', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- National Health Insurance Subsidy
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'national health insurance subsidy' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'SOCIAL', 'Welfare', 'Health', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Geriatric Care Strategy
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'geriatric care strategy' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'SOCIAL', 'Healthcare', 'Healthcare', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- National Disease Screening Program
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'national disease screening program' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'SOCIAL', 'Healthcare', 'Health', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Generic Medicine Access Act
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'generic medicine access act' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'SOCIAL', 'Healthcare', 'Healthcare', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Drug Prevention and Education
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'drug prevention and education' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'SOCIAL', 'Healthcare', 'Healthcare', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- ── EDUCATION ──

-- Vocational Training Expansion
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'vocational training expansion' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'EDUCATION', 'Education', 'Education', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- ── LABOR ──

-- National Labor Relations
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'national labor relations' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'LABOR', 'Workers', 'Labor', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- ── IMMIGRATION ──

-- Immigration Integration Program
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'immigration integration program' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'IMMIGRATION', 'Immigration', 'Interior', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

-- Automated Border Processing System
SELECT id INTO v_policy_id FROM policies WHERE LOWER(policy_name) = 'automated border processing system' LIMIT 1;
IF v_policy_id IS NOT NULL THEN
    INSERT INTO nation_policies (nation_id, policy_id, major_sector, law_category, fiscal_category, status, activated_at_tick, effects_started, effects_completed, ticks_elapsed)
    VALUES (v_vo, v_policy_id, 'IMMIGRATION', 'Border Enforcement', 'Interior', 'active', 0, true, true, 48)
    ON CONFLICT DO NOTHING;
END IF;

RAISE NOTICE 'Vostia structural policies activated successfully (21 policies)';
END $$;

-- Verify
SELECT p.policy_name, np.major_sector, np.status, np.activated_at_tick, np.effects_completed
FROM nation_policies np
JOIN policies p ON p.id = np.policy_id
JOIN nations n ON n.id = np.nation_id
WHERE LOWER(n.name) = 'vostia'
ORDER BY np.major_sector, p.policy_name;
