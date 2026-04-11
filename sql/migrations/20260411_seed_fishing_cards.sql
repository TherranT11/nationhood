-- ============================================================
-- Seed: Maritime Fishing Rights — Cards 1-4 (Unilateral)
-- ============================================================

INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects
) VALUES

-- ── CARD 1: Fleet Modernization (Unilateral / MoF) ──
(
    'maritime_fishing_rights', 1, 'Fleet Modernization', 'unilateral', 'minister_of_finance', 1,
    'A shipyard announces a new class of deep-water trawler — faster engines, larger nets, refrigerated holds. The fleet that modernizes first controls the catch for a generation.',

    'Dominant Fleet',
    'Fund Next-Generation Trawler Program',
    'Commission 12 new vessels with GPS-guided nets and sonar tracking. Your fleet becomes technologically untouchable.',
    '{
        "favor_delta": 1,
        "tension_delta": 0.5,
        "relation_delta": 0,
        "treasury_cost": 20000000,
        "stat_effects": [
            { "stat_key": "manufacturing_output", "delta": 0.1, "duration_ticks": 10, "target": "self" }
        ],
        "add_modifier": "fleet_modernization_gap"
    }'::jsonb,

    'Rival Fleet',
    'Subsidize Fleet Upgrades',
    'Retrofit existing boats with modern equipment. Cheaper than new builds. Close the gap without matching their spending.',
    '{
        "favor_delta": -0.5,
        "tension_delta": 0,
        "relation_delta": 0,
        "treasury_cost": 12000000,
        "stat_effects": [
            { "stat_key": "manufacturing_output", "delta": 0.05, "duration_ticks": 10, "target": "self" }
        ]
    }'::jsonb
),

-- ── CARD 2: Expand Fishing Operations (Unilateral / FM) ──
(
    'maritime_fishing_rights', 2, 'Expand Fishing Operations', 'unilateral', 'foreign_minister', 1,
    'Fishing captains report the richest grounds lie in the most contested part of the overlap zone. Both fleets edge closer. The water is getting crowded.',

    'Dominant Fleet',
    'Push Fleet Deeper Into Disputed Zone',
    'Order captains to fish the richest grounds regardless of the other nation''s presence. More boats. Longer shifts. Claim the water with hulls.',
    '{
        "favor_delta": 1.5,
        "tension_delta": 1.5,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "gdp_growth", "delta": 0.05, "duration_ticks": 12, "target": "self" }
        ],
        "add_modifier": "foreign_vessels_in_waters",
        "modifier_effects": { "stat_key": "civil_unrest", "delta": 0.1, "duration_ticks": 12, "target": "opponent" }
    }'::jsonb,

    'Rival Fleet',
    'Redirect to Uncontested Waters',
    'Pull your fleet back from the most contested areas. Fish the edges. You catch less but avoid confrontation.',
    '{
        "favor_delta": 0.5,
        "tension_delta": -1,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "gdp_growth", "delta": -0.05, "duration_ticks": 8, "target": "self" }
        ]
    }'::jsonb
),

-- ── CARD 3: Coastal Community Investment (Unilateral / MoF) ──
(
    'maritime_fishing_rights', 3, 'Coastal Community Investment', 'unilateral', 'minister_of_finance', 1,
    'Fishing towns on both coasts are struggling. Young people leave for the cities. The boats sit idle half the season. The communities that built the fishing industry are dying.',

    'Dominant Fleet',
    'Build Modern Port Infrastructure',
    'Cold storage, processing plants, modern fish market. Your port becomes the regional hub. Their fishermen start selling catch at YOUR docks because the facilities are better.',
    '{
        "favor_delta": 1,
        "tension_delta": 0,
        "relation_delta": 0,
        "treasury_cost": 18000000,
        "stat_effects": [
            { "stat_key": "physical_infrastructure", "delta": 0.1, "duration_ticks": 10, "target": "self" },
            { "stat_key": "unemployment", "delta": -0.1, "duration_ticks": 10, "target": "self" }
        ]
    }'::jsonb,

    'Rival Fleet',
    'Fund Fishing Community Revival',
    'Job training, boat repair grants, tourism development. Diversify the coastal economy beyond the disputed catch.',
    '{
        "favor_delta": 0,
        "tension_delta": 0,
        "relation_delta": 0,
        "treasury_cost": 15000000,
        "stat_effects": [
            { "stat_key": "unemployment", "delta": -0.1, "duration_ticks": 10, "target": "self" },
            { "stat_key": "poverty_rate", "delta": -0.05, "duration_ticks": 10, "target": "self" }
        ]
    }'::jsonb
),

-- ── CARD 4: Issue Fishing Licenses (Unilateral / FM) ──
(
    'maritime_fishing_rights', 4, 'Issue Fishing Licenses', 'unilateral', 'foreign_minister', 1,
    'Your fishing ministry announces a new licensing regime. Any vessel in waters you claim must carry your permit. Foreign vessels are technically in violation the moment they cast a net.',

    'Dominant Fleet',
    'Enforce Licensing in Disputed Zone',
    'Issue licenses to your fleet. Announce that unlicensed vessels will be warned, then fined, then impounded.',
    '{
        "favor_delta": 1,
        "tension_delta": 1,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "gov_approval", "delta": 0.1, "duration_ticks": 8, "target": "self" }
        ]
    }'::jsonb,

    'Rival Fleet',
    'Issue Counter-Licenses',
    'Create your own licensing regime for the same waters. Both nations have now issued permits for the same zone. Both legal. Neither recognizes the other''s authority.',
    '{
        "favor_delta": -0.5,
        "tension_delta": 0.5,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "efficiency", "delta": -0.05, "duration_ticks": 8, "target": "self" }
        ]
    }'::jsonb
)

ON CONFLICT (issue_type, card_number) DO NOTHING;
