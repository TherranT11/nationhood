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

-- ── CARD 13: Joint Coast Guard Patrols (Diplomatic / MoD) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'maritime_fishing_rights', 13, 'Joint Coast Guard Patrols', 'diplomatic', 'minister_of_defense', 1,
    'An unidentified vessel is spotted dumping oil in the disputed zone. Both nations blame each other. Neither has jurisdiction to arrest the polluter.',

    'Either Nation', 'Establish Joint Patrol Agreement',
    'Combined coast guard patrols. Shared radio frequencies. Joint arrest authority. Unified rules of engagement.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Either Nation', 'Establish Joint Patrol Agreement',
    'Combined coast guard patrols. Shared radio frequencies. Joint arrest authority. Unified rules of engagement.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "tension_delta": -2, "remove_modifier": "no_joint_enforcement", "stat_effects": [{ "stat_key": "crime_rate", "delta": -0.1, "duration_ticks": 15, "target": "both" }] }'::jsonb,
    '{ "favor_delta_to_proposer": 0.5 }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 14: International Arbitration (Diplomatic / FM / 2 AP) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'maritime_fishing_rights', 14, 'International Arbitration', 'diplomatic', 'foreign_minister', 2,
    'The International Tribunal for the Law of the Sea has agreed to hear the case — if both parties submit. One hearing. One ruling. Final and binding.',

    'Either Nation', 'Submit to Binding Arbitration',
    'Let the tribunal decide. The ruling draws the line, sets the quotas. You might lose everything. But the dispute ends.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Either Nation', 'Submit to Binding Arbitration',
    'Let the tribunal decide. The ruling draws the line, sets the quotas. You might lose everything. But the dispute ends.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "tension_delta": -3, "favor_reset": 0, "special": "arbitration_8_ticks" }'::jsonb,
    '{ "favor_delta_to_proposer": 1, "stat_effects_rejector": [{ "stat_key": "international_reputation", "delta": -0.1, "duration_ticks": 10 }] }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 15: Conservation Partnership (Diplomatic / Ambassador) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'maritime_fishing_rights', 15, 'Conservation Partnership', 'diplomatic', 'ambassador', 1,
    'Marine biologists from both nations publish a joint paper. Three key species at risk of collapse. The science is clear. Both nations are killing them.',

    'Either Nation', 'Launch Joint Conservation Program',
    'Bilateral marine reserve. Shared research stations. Coordinated spawning season bans. Both fleets sacrifice equally.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Either Nation', 'Launch Joint Conservation Program',
    'Bilateral marine reserve. Shared research stations. Coordinated spawning season bans. Both fleets sacrifice equally.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "tension_delta": -2, "remove_modifier": "overfishing", "stat_effects": [{ "stat_key": "arable_land", "delta": 0.1, "duration_ticks": 15, "target": "both" }, { "stat_key": "gdp_growth", "delta": -0.03, "duration_ticks": 10, "target": "both" }] }'::jsonb,
    '{ "favor_delta_to_proposer": 0.5, "stat_effects_rejector": [{ "stat_key": "international_reputation", "delta": -0.1, "duration_ticks": 6 }] }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 16: Integrated Fishery Management (Diplomatic / HoG / 2 AP) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'maritime_fishing_rights', 16, 'Integrated Fishery Management', 'diplomatic', 'head_of_government', 2,
    'An economist publishes a paper arguing the disputed fishery would generate 40% more value if managed as a single unit rather than fought over. Cooperation is more profitable than competition.',

    'Either Nation', 'Propose Integrated Fishery Management',
    'Merge the fishery into a single managed entity. Joint ownership. Profits pooled and split. Neither nation''s fleet favored.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Either Nation', 'Propose Integrated Fishery Management',
    'Merge the fishery into a single managed entity. Joint ownership. Profits pooled and split. Neither nation''s fleet favored.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "special": "resolve_issue", "tension_delta": -10, "relation_delta": 5, "stat_effects": [{ "stat_key": "gdp_growth", "delta": 0.05, "duration_ticks": 30, "target": "both" }] }'::jsonb,
    '{ "favor_delta_to_proposer": 0.5 }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- AGGRESSIVE CARDS (high tension, high favor, relations damage)
-- ══════════════════════════════════════════════════════════════

-- ── CARD 17: Vessel Harassment (Aggressive / MoD) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects
) VALUES (
    'maritime_fishing_rights', 17, 'Vessel Harassment', 'aggressive', 'minister_of_defense', 1,
    'Radio chatter from the disputed zone: "Unidentified vessel, alter course immediately." Both coast guards broadcasting the same warning at each other.',

    'Dominant Fleet',
    'Shadow and Intimidate Foreign Vessels',
    'Your cutters follow their fishing boats. Close. Spotlight at night. Horn blasts at dawn. Technically legal. Absolutely threatening.',
    '{
        "favor_delta": 1,
        "tension_delta": 2,
        "relation_delta": -3,
        "stat_effects": [
            { "stat_key": "civil_unrest", "delta": 0.1, "duration_ticks": 10, "target": "opponent" }
        ],
        "add_modifier": "active_harassment_campaign"
    }'::jsonb,

    'Rival Fleet',
    'Escort Your Fishing Fleet',
    'Send coast guard cutters to accompany your boats. Armed escort. Not aggressive — protective. But armed.',
    '{
        "favor_delta": -0.5,
        "tension_delta": 1,
        "relation_delta": -2,
        "stat_effects": [
            { "stat_key": "military_readiness", "delta": 0.05, "duration_ticks": 8, "target": "self" }
        ]
    }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 18: Seize Foreign Vessel (Aggressive / MoD / 2 AP) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects
) VALUES (
    'maritime_fishing_rights', 18, 'Seize Foreign Vessel', 'aggressive', 'minister_of_defense', 2,
    'Your coast guard intercepts a foreign fishing vessel. The captain refuses inspection. The crew is defiant. Your sailors have their hands on their weapons.',

    'Dominant Fleet',
    'Board and Impound',
    'Armed boarding. Crew detained. Catch confiscated. Vessel towed to your port. International law is ambiguous.',
    '{
        "favor_delta": 2,
        "tension_delta": 3,
        "relation_delta": -5,
        "stat_effects": [
            { "stat_key": "gov_approval", "delta": -0.3, "duration_ticks": 10, "target": "opponent" },
            { "stat_key": "civil_unrest", "delta": 0.2, "duration_ticks": 10, "target": "opponent" }
        ],
        "add_modifier": "seized_vessel_held",
        "incident_trigger_chance": 0.5
    }'::jsonb,

    'Rival Fleet',
    'Detain Vessel for Safety Inspection',
    'Board under pretense of safety violation. Impound for investigation. Hold 48 hours. A message.',
    '{
        "favor_delta": -1,
        "tension_delta": 2,
        "relation_delta": -3,
        "stat_effects": [
            { "stat_key": "gov_approval", "delta": -0.1, "duration_ticks": 8, "target": "opponent" }
        ],
        "incident_trigger_chance": 0.25
    }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 19: Naval Deployment (Aggressive / MoD / 2 AP) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects
) VALUES (
    'maritime_fishing_rights', 19, 'Naval Deployment', 'aggressive', 'minister_of_defense', 2,
    'The coast guard isn''t enough anymore. Navy vessels redeployed from other duties. Warships heading toward the fishing zone. The line between coast guard and navy just disappeared.',

    'Dominant Fleet',
    'Deploy Naval Patrol to Disputed Zone',
    'A frigate and two patrol boats. Armed with more than water cannons. This is no longer a fisheries dispute.',
    '{
        "favor_delta": 2,
        "tension_delta": 3,
        "relation_delta": -5,
        "stat_effects": [
            { "stat_key": "military_readiness", "delta": 0.1, "duration_ticks": 15, "target": "self" },
            { "stat_key": "stability", "delta": -0.2, "duration_ticks": 15, "target": "opponent" }
        ],
        "add_modifier": "naval_presence_in_fishing_zone",
        "modifier_effects": { "incident_trigger_multiplier": 2.0, "duration_ticks": 15 }
    }'::jsonb,

    'Rival Fleet',
    'Request Allied Naval Presence',
    'Ask a friendly third-party nation to conduct a freedom of navigation exercise through the zone. Their warship. Your message.',
    '{
        "favor_delta": -1,
        "tension_delta": 2,
        "relation_delta": -4,
        "random_roll": {
            "success_chance": 0.3,
            "success_label": "Third-party agrees",
            "success_effects": { "stat_effects": [{ "stat_key": "stability", "delta": -0.1, "duration_ticks": 10, "target": "opponent" }] },
            "fail_label": "Request declined",
            "fail_effects": {}
        }
    }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 20: Unilateral Fishing Ban (Aggressive / HoG) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects
) VALUES (
    'maritime_fishing_rights', 20, 'Unilateral Fishing Ban', 'aggressive', 'head_of_government', 1,
    'The Head of Government goes on television. "Effective immediately, all fishing in the disputed zone is prohibited. Any vessel that enters will be impounded."',

    'Dominant Fleet',
    'Declare Exclusion Zone',
    'Ban all fishing. Enforce with coast guard. Nobody eats.',
    '{
        "favor_delta": 1,
        "tension_delta": 2,
        "relation_delta": -3,
        "stat_effects": [
            { "stat_key": "cost_of_living", "delta": 0.15, "duration_ticks": 15, "target": "both" },
            { "stat_key": "manufacturing_output", "delta": -0.1, "duration_ticks": 15, "target": "both" }
        ],
        "add_modifier": "fishing_ban_in_effect"
    }'::jsonb,

    'Rival Fleet',
    'Defy the Ban',
    'Publicly reject it as illegitimate. Order your fleet to continue under armed escort. Dare them to enforce it.',
    '{
        "favor_delta": -1,
        "tension_delta": 2,
        "relation_delta": -3,
        "stat_effects": [
            { "stat_key": "gov_approval", "delta": 0.1, "duration_ticks": 6, "target": "self" }
        ],
        "incident_trigger_chance": 0.4
    }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 21: Trade Retaliation (Aggressive / MoF) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects
) VALUES (
    'maritime_fishing_rights', 21, 'Trade Retaliation', 'aggressive', 'minister_of_finance', 1,
    'If they won''t respect your rights on the water, you''ll make them pay on land. The trade minister opens a file labeled "economic countermeasures."',

    'Dominant Fleet',
    'Impose Tariffs on Rival''s Seafood Exports',
    '25% duty on all fish products from the rival nation. Their processors lose their biggest customer overnight.',
    '{
        "favor_delta": 1,
        "tension_delta": 2,
        "relation_delta": -3,
        "stat_effects": [
            { "stat_key": "trade_balance", "delta": -0.15, "duration_ticks": 12, "target": "opponent" },
            { "stat_key": "cost_of_living", "delta": 0.1, "duration_ticks": 12, "target": "self" }
        ]
    }'::jsonb,

    'Rival Fleet',
    'Embargo Dominant Fleet''s Fuel Supply',
    'If their boats refuel at your ports, cut them off. No diesel. No lubricants. No dock access. Their operational range drops overnight.',
    '{
        "favor_delta": -1,
        "tension_delta": 2,
        "relation_delta": -4,
        "stat_effects": [
            { "stat_key": "gdp_growth", "delta": -0.05, "duration_ticks": 10, "target": "opponent" },
            { "stat_key": "trade_balance", "delta": -0.1, "duration_ticks": 10, "target": "both" }
        ]
    }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;
