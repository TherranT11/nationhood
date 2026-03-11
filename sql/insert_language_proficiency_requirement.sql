-- Insert policy: Language Proficiency Requirement
-- Sector: IMMIGRATION | Law Category: Border Enforcement | Type: structural
-- Ideologies: Tradition, Nationalism
-- Costs: $3M x Population (upfront), $1M x Population/tick (ongoing)
-- Active at start for: Montequilla, Sangreza, San Estrella

DO $$
DECLARE
    v_policy_id uuid;
    v_nation_id uuid;
    v_total_duration int := 48; -- max(delay + duration) across all effects
BEGIN

-- 1. Insert the policy
INSERT INTO policies (
    policy_key,
    policy_name,
    policy_type,
    description,
    major_sector,
    minor_sector,
    law_category,
    fiscal_category,
    ideology,
    ideologies,
    upfront_cost,
    upfront_scaling_stat,
    ongoing_base_cost,
    ongoing_scaling_stat,
    stat_effects,
    opposed_policy_ids,
    requires_policy_id,
    -- Legacy fields
    target_stat,
    stat_direction,
    stat_change_per_tick,
    duration_months,
    stat_floor,
    stat_ceiling,
    ongoing_cost_per_tick,
    is_active
) VALUES (
    'language_proficiency_requirement_' || to_hex(extract(epoch from now())::int),
    'Language Proficiency Requirement',
    'structural',
    'Mandatory language testing as a prerequisite for visa approval, reducing inflow from nations with large linguistic distance while framing restriction as an integration measure.',
    'IMMIGRATION',
    'Border Enforcement',
    'Border Enforcement',
    'Interior',
    'Tradition',          -- legacy single ideology (NOT NULL column)
    '["Tradition","Nationalism"]'::jsonb,
    3,                    -- upfront $3M (scaled by population)
    'population',         -- upfront scaling stat
    1,                    -- ongoing $1M (scaled by population)
    'population',         -- ongoing scaling stat
    '[
        {"stat_key":"immigration",              "direction":"down","rate":0.2, "delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"illegal_immigration",      "direction":"down","rate":0.2, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"labor_force_participation", "direction":"down","rate":0.15,"delay_ticks":4,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"polarization",             "direction":"down","rate":0.1, "delay_ticks":6,"duration_ticks":48,"adjust_type":null,"adjust_value":0},
        {"stat_key":"international_reputation",  "direction":"down","rate":0.1, "delay_ticks":3,"duration_ticks":48,"adjust_type":null,"adjust_value":0}
    ]'::jsonb,
    NULL,                 -- no opposed policies
    NULL,                 -- no prerequisite
    -- Legacy fields (first stat effect)
    'immigration',
    'DOWN',
    0.2,
    48,
    0,
    100,
    1,
    true
)
RETURNING id INTO v_policy_id;

RAISE NOTICE 'Created policy: Language Proficiency Requirement (id: %)', v_policy_id;

-- 2. Activate for starting nations: Montequilla, Sangreza, San Estrella
FOR v_nation_id IN
    SELECT id FROM nations WHERE LOWER(name) IN ('montequilla', 'sangreza', 'san estrella')
LOOP
    INSERT INTO nation_policies (
        nation_id,
        policy_id,
        major_sector,
        law_category,
        fiscal_category,
        status,
        activated_at_tick,
        effects_started,
        effects_completed,
        ticks_elapsed
    ) VALUES (
        v_nation_id,
        v_policy_id,
        'IMMIGRATION',
        'Border Enforcement',
        'Interior',
        'active',
        0,
        true,
        true,
        v_total_duration
    );

    RAISE NOTICE 'Activated for nation: %', v_nation_id;
END LOOP;

END $$;
