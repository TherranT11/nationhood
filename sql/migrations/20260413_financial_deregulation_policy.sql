-- ════════════════════════════════════════════════════════════════════════════════
-- Financial Sector Deregulation Act
--
-- Economy policy that benefits Finance corporations at the cost of
-- national financial stability and income equality.
--
-- Effects: +15% lending capacity, -20% reserve ratio (15%→12%),
-- +10% interest income on active loans. Stat drift: financial_stability
-- deteriorates, income_inequality rises, foreign_investment improves.
-- ════════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_policy_id uuid;
BEGIN

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
    'financial_sector_deregulation_act',
    'Financial Sector Deregulation Act', 'structural',
    'Reduces regulatory requirements on financial institutions. Lowers mandatory reserve ratios from 15% to 12%, removes caps on lending exposure, and streamlines approval processes. Finance corporations get +15% lending capacity and +10% interest income. Critics warn of increased systemic risk and inequality.',
    'ECONOMY', 'Financial Regulation', 'Economy', 'Treasury',
    'Individualism', '["Individualism","Liberty","Corporations Affected"]'::jsonb,
    15, 'gdp',
    3, 'gdp',
    '[
        {"stat_key":"foreign_investment",   "direction":"up",   "rate":0.5, "delay_ticks":1, "duration_ticks":120, "adjust_type":null, "adjust_value":0},
        {"stat_key":"gdp_growth",           "direction":"up",   "rate":0.2, "delay_ticks":2, "duration_ticks":120, "adjust_type":null, "adjust_value":0},
        {"stat_key":"income_inequality",    "direction":"up",   "rate":0.4, "delay_ticks":2, "duration_ticks":120, "adjust_type":null, "adjust_value":0},
        {"stat_key":"corruption",           "direction":"up",   "rate":0.15,"delay_ticks":4, "duration_ticks":120, "adjust_type":null, "adjust_value":0},
        {"stat_key":"financial_stability",  "direction":"down", "rate":0.5, "delay_ticks":3, "duration_ticks":120, "adjust_type":null, "adjust_value":0},
        {"stat_key":"cost_of_living",       "direction":"down", "rate":0.1, "delay_ticks":3, "duration_ticks":120, "adjust_type":null, "adjust_value":0}
    ]'::jsonb,
    NULL, NULL,
    'foreign_investment', 'UP', 0.5, 120, 0, 100, 3, true
) RETURNING id INTO v_policy_id;

RAISE NOTICE 'Created: Financial Sector Deregulation Act (id=%)', v_policy_id;

-- No default nation_policies — this must be proposed and passed by a party

END $$;
