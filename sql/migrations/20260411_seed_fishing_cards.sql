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
),

-- ── CARD 5: Seasonal Restriction (Unilateral / HoG) ──
(
    'maritime_fishing_rights', 5, 'Seasonal Restriction', 'unilateral', 'head_of_government', 1,
    'Marine biologists warn spawning season is approaching. The fish stocks need a break. But any nation that stops fishing while the other continues loses catch share permanently.',

    'Dominant Fleet',
    'Ignore Spawning Season',
    'Keep fishing through breeding period. Your biologists say the stocks can handle it. Their biologists disagree.',
    '{
        "favor_delta": 0.5,
        "tension_delta": 0.5,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "gdp_growth", "delta": 0.05, "duration_ticks": 6, "target": "self" },
            { "stat_key": "arable_land", "delta": -0.1, "duration_ticks": 8, "target": "self" }
        ]
    }'::jsonb,

    'Rival Fleet',
    'Unilaterally Observe Spawning Ban',
    'Pull your fleet out during breeding season. You lose catch. The fish recover. The world notices your restraint.',
    '{
        "favor_delta": 0.5,
        "tension_delta": -1,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "international_reputation", "delta": 0.05, "duration_ticks": 8, "target": "self" },
            { "stat_key": "gdp_growth", "delta": -0.05, "duration_ticks": 6, "target": "self" }
        ]
    }'::jsonb
),

-- ── CARD 6: Surveillance Deployment (Unilateral / MoD) ──
(
    'maritime_fishing_rights', 6, 'Surveillance Deployment', 'unilateral', 'minister_of_defense', 1,
    'Both nations want to know exactly what the other is doing. How many boats. Where they fish. How much they catch. Information is leverage.',

    'Dominant Fleet',
    'Deploy Maritime Surveillance Drones',
    'Unmanned aerial vehicles monitoring the entire zone. Every foreign vessel tracked. Every net documented.',
    '{
        "favor_delta": 0.5,
        "tension_delta": 0.5,
        "relation_delta": 0,
        "treasury_cost": 8000000,
        "stat_effects": [
            { "stat_key": "digital_infrastructure", "delta": 0.05, "duration_ticks": 10, "target": "self" }
        ]
    }'::jsonb,

    'Rival Fleet',
    'Install Vessel Tracking Systems',
    'Equip your fleet with transponders and cameras. Document your OWN movements. Transparent and verifiable. Useful in any future legal proceeding.',
    '{
        "favor_delta": -0.5,
        "tension_delta": 0,
        "relation_delta": 0,
        "treasury_cost": 5000000,
        "stat_effects": [
            { "stat_key": "digital_infrastructure", "delta": 0.05, "duration_ticks": 8, "target": "self" }
        ]
    }'::jsonb
),

-- ── CARD 7: Anti-Dumping Complaint (Unilateral / Ambassador) ──
(
    'maritime_fishing_rights', 7, 'Anti-Dumping Complaint', 'unilateral', 'ambassador', 1,
    'The other nation''s fish are appearing in global markets at suspiciously low prices. Below production cost. Subsidized catch undercutting your industry?',

    'Dominant Fleet',
    'File Formal Anti-Dumping Complaint',
    'Complaint to the international trade body. Accuse them of selling below cost to destroy your fishing industry.',
    '{
        "favor_delta": 0.5,
        "tension_delta": 0.5,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "international_reputation", "delta": -0.05, "duration_ticks": 10, "target": "opponent" }
        ],
        "add_modifier": "dumping_accusations"
    }'::jsonb,

    'Rival Fleet',
    'File Formal Anti-Dumping Complaint',
    'Their larger fleet produces excess catch that depresses global prices. Your small-scale fishermen can''t compete with industrial trawlers.',
    '{
        "favor_delta": -0.5,
        "tension_delta": 0.5,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "international_reputation", "delta": -0.05, "duration_ticks": 10, "target": "opponent" }
        ],
        "add_modifier": "dumping_accusations"
    }'::jsonb
),

-- ── CARD 8: Environmental Report (Unilateral / Ambassador) ──
(
    'maritime_fishing_rights', 8, 'Environmental Report', 'unilateral', 'ambassador', 1,
    'An independent marine research institute publishes a report on fish stock health in the disputed zone. The findings are alarming. Both nations are blamed.',

    'Dominant Fleet',
    'Blame Opponent''s Overfishing',
    'Use the report to publicly accuse the rival fleet of environmental destruction. Demand they reduce their catch unilaterally.',
    '{
        "favor_delta": 0.5,
        "tension_delta": 0.5,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "international_reputation", "delta": -0.05, "duration_ticks": 8, "target": "opponent" }
        ]
    }'::jsonb,

    'Rival Fleet',
    'Propose International Environmental Review',
    'Use the report to call for independent monitoring. The data will likely show the dominant fleet does more damage — they have more boats.',
    '{
        "favor_delta": -1,
        "tension_delta": -0.5,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "international_reputation", "delta": 0.05, "duration_ticks": 8, "target": "self" }
        ]
    }'::jsonb
)

ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- DIPLOMATIC CARDS (require opponent to accept or reject)
-- If rejected: proposing nation gains favor +0.5
-- ══════════════════════════════════════════════════════════════

-- ── CARD 9: Joint Fishing Commission (Diplomatic / FM) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'maritime_fishing_rights', 9, 'Joint Fishing Commission', 'diplomatic', 'foreign_minister', 1,
    'A retired admiral from a third-party nation offers to chair a bilateral fishing commission. He has credibility with both sides. It''s a rare window.',

    'Either Nation', 'Establish Joint Fishing Commission',
    'Bilateral body with regulatory authority over the disputed zone. Shared data. Coordinated enforcement.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Either Nation', 'Establish Joint Fishing Commission',
    'Bilateral body with regulatory authority over the disputed zone. Shared data. Coordinated enforcement.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "tension_delta": -2, "relation_delta": 2, "remove_modifier": "no_regulatory_framework", "stat_effects": [{ "stat_key": "efficiency", "delta": 0.05, "duration_ticks": 15, "target": "both" }] }'::jsonb,
    '{ "favor_delta_to_proposer": 0.5 }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 10: Catch Quota Negotiation (Diplomatic / MoF) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'maritime_fishing_rights', 10, 'Catch Quota Negotiation', 'diplomatic', 'minister_of_finance', 1,
    'Fish stock data is finally available. Both nations know how much is out there. The question is who gets how much.',

    'Dominant Fleet', 'Offer 60/40 Quota Split',
    'You catch more, you get more. Proportional to current fleet size. Generous enough to tempt, skewed enough to maintain leverage.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Rival Fleet', 'Demand 50/50 Quota Split',
    'Equal rights to equal waters. Legal claim, not fleet size, should determine the allocation.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "tension_delta": -1, "remove_modifier": "no_defined_quotas", "stat_effects": [{ "stat_key": "gdp_growth", "delta": 0.025, "duration_ticks": 20, "target": "both" }] }'::jsonb,
    '{ "favor_delta_to_proposer": 0.5 }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 11: Maritime Boundary Survey (Diplomatic / FM) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'maritime_fishing_rights', 11, 'Maritime Boundary Survey', 'diplomatic', 'foreign_minister', 1,
    'The UN Convention on the Law of the Sea provides a framework for resolving overlapping EEZ claims. Both nations are signatories. Neither has invoked it.',

    'Either Nation', 'Commission Joint Hydrographic Survey',
    'Neutral experts map the seabed, measure continental shelf, produce a definitive boundary recommendation. Both nations accept the methodology in advance.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Either Nation', 'Commission Joint Hydrographic Survey',
    'Neutral experts map the seabed, measure continental shelf, produce a definitive boundary recommendation. Both nations accept the methodology in advance.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "tension_delta": -2, "remove_modifier": "no_defined_maritime_territories", "special": "survey_8_ticks" }'::jsonb,
    '{ "favor_delta_to_proposer": 1, "stat_effects_rejector": [{ "stat_key": "international_reputation", "delta": -0.1, "duration_ticks": 8 }] }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 12: Seasonal Fishing Calendar (Diplomatic / Ambassador) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'maritime_fishing_rights', 12, 'Seasonal Fishing Calendar', 'diplomatic', 'ambassador', 1,
    'The same boats chase the same fish through the same seasonal migration. Spring mackerel. Summer tuna. Autumn sardine. Both fleets collide on a predictable schedule.',

    'Either Nation', 'Sign Seasonal Fishing Calendar',
    'Agree which months each fleet operates in which zone. Time-share the waters. Simple. Practical.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Either Nation', 'Sign Seasonal Fishing Calendar',
    'Agree which months each fleet operates in which zone. Time-share the waters. Simple. Practical.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "tension_delta": -1, "remove_modifier": "seasonal_fishing_conflict" }'::jsonb,
    '{ "favor_delta_to_proposer": 0.5 }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;
