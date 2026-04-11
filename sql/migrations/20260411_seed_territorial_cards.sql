-- ============================================================
-- Seed: Territorial Ownership Dispute — Card #1
-- ============================================================

INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects
) VALUES (
    'territorial_ownership', 1, 'Infrastructure Investment', 'unilateral', 'minister_of_finance', 1,
    'International development banks are offering favorable loan terms for infrastructure projects in border regions. Both nations eye the territory as a priority investment zone.',

    'Occupying Nation',
    'Build New Roads and Bridges',
    'Pour money into connecting the territory to your national road network. New highway, bridge, upgraded power grid. Every road leads to your capital, not theirs.',
    '{
        "favor_delta": 1,
        "tension_delta": 0.5,
        "relation_delta": 0,
        "treasury_cost": 20000000,
        "stat_effects": [
            { "stat_key": "physical_infrastructure", "delta": 0.1, "duration_ticks": 10, "target": "self" }
        ]
    }'::jsonb,

    'Claimant Nation',
    'Develop Adjacent Border Region',
    'Develop the communities right outside the territory. Modern infrastructure that makes your side prosperous and inviting.',
    '{
        "favor_delta": -0.5,
        "tension_delta": 0,
        "relation_delta": 0,
        "treasury_cost": 15000000,
        "stat_effects": [
            { "stat_key": "physical_infrastructure", "delta": 0.1, "duration_ticks": 8, "target": "self" }
        ]
    }'::jsonb
)
ON CONFLICT (issue_type, card_number) DO NOTHING;
