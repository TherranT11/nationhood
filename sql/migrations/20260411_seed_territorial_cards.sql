-- ============================================================
-- Seed: Territorial Ownership Dispute — Cards 1-3
-- ============================================================

INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects
) VALUES

-- ── CARD 1: Infrastructure Investment (Unilateral / MoF) ──
(
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
),

-- ── CARD 2: Citizen Settlement Wave (Unilateral / HoG) ──
(
    'territorial_ownership', 2, 'Citizen Settlement Wave', 'unilateral', 'head_of_government', 1,
    'Reports emerge that families are being incentivized to relocate to the territory. New housing blocks under construction. The settlement program is quiet but systematic — each month, the demographic balance shifts a little further.',

    'Occupying Nation',
    'Accelerate Settlement Program',
    'Double the incentive packages. Fast-track construction permits. Make the territory a priority destination for young families. The demographic window is closing — push now.',
    '{
        "favor_delta": 2,
        "tension_delta": 2,
        "relation_delta": 0,
        "add_modifier": "accelerated_settlement",
        "modifier_effects": { "stat_key": "polarization", "delta": 0.15, "duration_ticks": 20, "target": "both" }
    }'::jsonb,

    'Claimant Nation',
    'Counter-Settlement Initiative',
    'Launch a parallel program encouraging your citizens to settle in communities adjacent to the territory. Cultural centers, language schools, economic incentives. You cannot settle in the territory itself — but you can surround it.',
    '{
        "favor_delta": -1,
        "tension_delta": 1,
        "relation_delta": 0,
        "add_modifier": "counter_settlement",
        "modifier_effects": { "stat_key": "polarization", "delta": 0.1, "duration_ticks": 15, "target": "both" }
    }'::jsonb
),

-- ── CARD 3: Commission Legal Study (Unilateral / FM) ──
(
    'territorial_ownership', 3, 'Commission Legal Study', 'unilateral', 'foreign_minister', 1,
    'A prominent international law firm publishes an unsolicited brief citing conflicting treaty precedents. Both nations scramble to commission their own legal analyses.',

    'Occupying Nation',
    'Publish Sovereignty Legal Framework',
    '80 pages of precedent asserting continuous administration as the basis for sovereignty. Distributed to every embassy. If your international reputation exceeds theirs, it carries more weight.',
    '{
        "favor_delta": 1,
        "tension_delta": 0,
        "relation_delta": 0,
        "conditional": { "if_stat_gt": "international_reputation", "then_favor": 1, "else_favor": 0.5 }
    }'::jsonb,

    'Claimant Nation',
    'Publish Historical Claim Dossier',
    'Detailed claim based on pre-colonial treaties, ethnic demographics, and original partition documents. Published globally. If your international reputation exceeds theirs, the world listens.',
    '{
        "favor_delta": -1,
        "tension_delta": 0,
        "relation_delta": 0,
        "conditional": { "if_stat_gt": "international_reputation", "then_favor": -1, "else_favor": -0.5 }
    }'::jsonb
),

-- ── CARD 4: Name the Territory (Unilateral / HoG) ──
(
    'territorial_ownership', 4, 'Name the Territory', 'unilateral', 'head_of_government', 1,
    'A geography textbook refers to the territory by the other side''s name. Outrage erupts in the education ministry. Maps are political weapons — and somebody just drew the wrong line.',

    'Occupying Nation',
    'Mandate Official Naming',
    'Update all maps, databases, educational materials. Their name erased from official cartography. Every atlas printed in your country will use your name and only your name.',
    '{
        "favor_delta": 0.5,
        "tension_delta": 1,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "gov_approval", "delta": 0.1, "duration_ticks": 8, "target": "self" }
        ]
    }'::jsonb,

    'Claimant Nation',
    'International Naming Campaign',
    'Lobby international organizations and media to use YOUR name. UN database. Global map publishers. The BBC. If the world calls it by your name, the occupation feels less permanent.',
    '{
        "favor_delta": -0.5,
        "tension_delta": 0.5,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "international_reputation", "delta": 0.05, "duration_ticks": 8, "target": "self" }
        ]
    }'::jsonb
),

-- ── CARD 5: Economic Development Zone (Unilateral / MoF) ──
(
    'territorial_ownership', 5, 'Economic Development Zone', 'unilateral', 'minister_of_finance', 1,
    'The territory''s mineral deposits attract interest from foreign mining companies. Both nations could benefit — but who grants the permits? Whoever controls extraction controls the economic argument for sovereignty.',

    'Occupying Nation',
    'Issue Extraction Licenses',
    'Grant mining permits under your authority. Tax revenue flows to your treasury. Foreign companies register with your government. Economic facts on the ground.',
    '{
        "favor_delta": 1,
        "tension_delta": 1,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "gdp_growth", "delta": 0.1, "duration_ticks": 15, "target": "self" },
            { "stat_key": "pollution", "delta": 0.1, "duration_ticks": 15, "target": "self" }
        ]
    }'::jsonb,

    'Claimant Nation',
    'Challenge License Legitimacy',
    'Declare all extraction licenses illegitimate. Warn mining companies of legal action if ownership changes. Make the investment climate uncertain enough to scare them off.',
    '{
        "favor_delta": -0.5,
        "tension_delta": 1,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "foreign_investment", "delta": -0.05, "duration_ticks": 10, "target": "opponent" }
        ]
    }'::jsonb
),

-- ── CARD 6: Cultural Festival (Unilateral / Ambassador) ──
(
    'territorial_ownership', 6, 'Cultural Festival', 'unilateral', 'ambassador', 1,
    'The anniversary of the territory''s founding approaches. Both nations plan commemorative events. What should be a local celebration becomes a geopolitical flashpoint — flags, anthems, and competing histories.',

    'Occupying Nation',
    'Host National Festival in Territory',
    'Massive cultural festival. Government officials attend. Military bands play. Your flag flies from every building. The message is clear: this is ours, and we celebrate it as ours.',
    '{
        "favor_delta": 0.5,
        "tension_delta": 1,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "gov_approval", "delta": 0.1, "duration_ticks": 6, "target": "self" }
        ],
        "add_modifier": "anniversary_tensions",
        "modifier_effects": { "stat_key": "civil_unrest", "delta": 0.1, "duration_ticks": 4, "target": "both" }
    }'::jsonb,

    'Claimant Nation',
    'Hold Memorial March at the Border',
    'Solemn march. Thousands carrying candles and photographs of relatives who lived in the territory. Not aggressive — mournful. The international cameras will tell the story better than any legal brief.',
    '{
        "favor_delta": -1,
        "tension_delta": 0.5,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "international_reputation", "delta": 0.05, "duration_ticks": 6, "target": "self" }
        ]
    }'::jsonb
),

-- ── CARD 7: Administrative Expansion (Unilateral / FM) ──
(
    'territorial_ownership', 7, 'Administrative Expansion', 'unilateral', 'foreign_minister', 1,
    'Bureaucratic creep. One nation quietly expanding its administrative footprint — new post offices, tax collection points, police stations. Every office is a flag planted in paperwork.',

    'Occupying Nation',
    'Establish Full Administrative Presence',
    'Courts, tax authority, passport office. Full government services operating under your jurisdiction. Citizens in the territory interact only with your bureaucracy.',
    '{
        "favor_delta": 1,
        "tension_delta": 1,
        "relation_delta": 0,
        "treasury_cost": 10000000,
        "stat_effects": [
            { "stat_key": "efficiency", "delta": 0.1, "duration_ticks": 12, "target": "self" }
        ]
    }'::jsonb,

    'Claimant Nation',
    'Protest Administrative Overreach',
    'Formal objection filed with every international body. A detailed report documenting every new office, every new official, every new stamp. Frame it as creeping annexation.',
    '{
        "favor_delta": -0.5,
        "tension_delta": 0.5,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "international_reputation", "delta": -0.05, "duration_ticks": 10, "target": "opponent" }
        ]
    }'::jsonb
),

-- ── CARD 8: Diaspora Mobilization (Unilateral / Ambassador) ──
(
    'territorial_ownership', 8, 'Diaspora Mobilization', 'unilateral', 'ambassador', 1,
    'Expatriates from the territory organize politically abroad. Advocacy groups, fundraising campaigns, lobbying foreign governments. The diaspora becomes a weapon — or a liability.',

    'Occupying Nation',
    'Discredit Diaspora Organization',
    'State media investigation into the diaspora group. Suggest foreign intelligence connections. Question their funding sources. Make the international community doubt their legitimacy.',
    '{
        "favor_delta": 0.5,
        "tension_delta": 0.5,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "polarization", "delta": 0.1, "duration_ticks": 10, "target": "opponent" }
        ]
    }'::jsonb,

    'Claimant Nation',
    'Elevate Diaspora Voice',
    'Official recognition of the diaspora organization. Their leader meets the Foreign Minister. Testimony enters the parliamentary record. Give them a platform and a megaphone.',
    '{
        "favor_delta": -1,
        "tension_delta": 0.5,
        "relation_delta": 0,
        "stat_effects": [
            { "stat_key": "gov_approval", "delta": 0.1, "duration_ticks": 10, "target": "self" },
            { "stat_key": "polarization", "delta": 0.1, "duration_ticks": 10, "target": "self" }
        ]
    }'::jsonb
),

-- ══════════════════════════════════════════════════════════════
-- DIPLOMATIC CARDS (require opponent to accept or reject)
-- If rejected: proposing nation gains favor +0.5
-- ══════════════════════════════════════════════════════════════

)

ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- DIPLOMATIC CARDS (require opponent to accept or reject)
-- If rejected: proposing nation gains favor +0.5
-- Inserted separately because they use diplomatic_accept/reject columns.
-- ══════════════════════════════════════════════════════════════

-- ── CARD 9: Joint Sovereignty Proposal (Diplomatic / HoG) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'territorial_ownership', 9, 'Joint Sovereignty Proposal', 'diplomatic', 'head_of_government', 1,
    'An elder statesperson publishes an op-ed arguing that the only sustainable solution is shared sovereignty. Both flags. Both languages. Both anthems. The idea is radical — and it won''t go away.',

    'Either Nation', 'Offer Joint Governance Framework',
    'Propose co-administration. Shared revenue from territory resources. Dual citizenship for residents. Joint police patrols. Equal representation in a territorial council.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Either Nation', 'Offer Joint Governance Framework',
    'Propose co-administration. Shared revenue from territory resources. Dual citizenship for residents. Joint police patrols. Equal representation in a territorial council.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "favor_reset": 0, "tension_delta": -3, "relation_delta": 3, "remove_modifier": "competing_sovereignty_claims" }'::jsonb,
    '{ "favor_delta_to_proposer": 0.5, "tension_delta": 0.5 }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 10: International Court Submission (Diplomatic / FM) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'territorial_ownership', 10, 'International Court Submission', 'diplomatic', 'foreign_minister', 1,
    'Legal scholars from both nations recommend submitting the dispute to the International Court of Justice for a binding ruling. It would take time — but the result would be final.',

    'Either Nation', 'Submit to Binding Adjudication',
    'Accept the court''s jurisdiction. Present your case. Abide by the ruling. If you believe your administration is legitimate, let the law confirm it.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Either Nation', 'Submit to Binding Adjudication',
    'Accept the court''s jurisdiction. Present your case. Abide by the ruling. If your historical claim is sound, the court will validate it.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "favor_reset": 0, "tension_delta": -3, "remove_modifier": "no_international_adjudication", "special": "arbitration_10_ticks" }'::jsonb,
    '{ "favor_delta_to_proposer": 1, "stat_effects_rejector": [{ "stat_key": "international_reputation", "delta": -0.1, "duration_ticks": 8 }] }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 11: Resource-Sharing Framework (Diplomatic / MoF) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'territorial_ownership', 11, 'Resource-Sharing Framework', 'diplomatic', 'minister_of_finance', 1,
    'New geological survey shows deposits in the territory are larger than estimated. Oil, rare earths, aquifer — the resource question can no longer be ignored. Both economies could benefit, but only if they agree on terms.',

    'Occupying Nation', 'Offer 60/40 Revenue Split',
    'Propose a resource-sharing agreement weighted toward the administering power. 60% of extraction revenue to you, 40% to them. Generous enough to tempt, skewed enough to maintain leverage.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Claimant Nation', 'Demand 50/50 Revenue Split',
    'Propose equal revenue sharing. Half of all extraction proceeds go to each nation. Fair on paper — but it implicitly acknowledges joint ownership.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "tension_delta": -2, "remove_modifier": "resource_potential", "stat_effects": [{ "stat_key": "gdp_growth", "delta": 0.05, "duration_ticks": 20, "target": "both" }] }'::jsonb,
    '{ "favor_delta_to_proposer": 0.5 }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 12: Cultural Heritage Preservation (Diplomatic / Ambassador) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'territorial_ownership', 12, 'Cultural Heritage Preservation', 'diplomatic', 'ambassador', 1,
    'UNESCO threatens to place the territory''s historic sites on the endangered heritage list. Ancient temples, medieval fortifications, colonial-era archives — all deteriorating while two nations argue over who should maintain them.',

    'Either Nation', 'Propose Joint Heritage Commission',
    'Establish a bilateral commission to preserve and restore the territory''s cultural sites. Shared funding, shared expertise, shared credit. The sites belong to humanity, not to politics.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Either Nation', 'Propose Joint Heritage Commission',
    'Establish a bilateral commission to preserve and restore the territory''s cultural sites. Shared funding, shared expertise, shared credit. The sites belong to humanity, not to politics.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "tension_delta": -1, "remove_modifier": "historical_grievance_attached", "stat_effects": [{ "stat_key": "international_reputation", "delta": 0.05, "duration_ticks": 10, "target": "both" }] }'::jsonb,
    '{ "favor_delta_to_proposer": 0.5, "stat_effects_rejector": [{ "stat_key": "international_reputation", "delta": -0.1, "duration_ticks": 6 }] }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 13: Border Crossing Normalization (Diplomatic / Ambassador) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'territorial_ownership', 13, 'Border Crossing Normalization', 'diplomatic', 'ambassador', 1,
    'A family on the claimant side has relatives in the territory. Three years without contact. Their story goes international — a grandmother who hasn''t held her grandchild. The human cost of the dispute has a face now.',

    'Either Nation', 'Open Humanitarian Crossing Points',
    'Establish designated crossing points for family reunification, medical emergencies, and cultural events. Not a political concession — a humanitarian one. Let the families see each other.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Either Nation', 'Open Humanitarian Crossing Points',
    'Establish designated crossing points for family reunification, medical emergencies, and cultural events. Not a political concession — a humanitarian one. Let the families see each other.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "tension_delta": -2, "stat_effects": [{ "stat_key": "civil_unrest", "delta": -0.1, "duration_ticks": 15, "target": "both" }, { "stat_key": "happiness", "delta": 0.05, "duration_ticks": 15, "target": "both" }] }'::jsonb,
    '{ "favor_delta_to_proposer": 0.5, "stat_effects_rejector": [{ "stat_key": "civil_unrest", "delta": 0.1, "duration_ticks": 8 }] }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 14: Economic Concession Offer (Diplomatic / HoG / 2 AP) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'territorial_ownership', 14, 'Economic Concession Offer', 'diplomatic', 'head_of_government', 2,
    'Back-channel talks suggest one side might trade the territorial claim for an economic package. Favorable trade terms, infrastructure investment, debt forgiveness. The price of peace — if anyone is willing to pay it.',

    'Occupying Nation', 'Offer Trade Package for Claim Withdrawal',
    'Propose a comprehensive economic package in exchange for the claimant formally renouncing their claim. Preferential trade terms for 30 ticks, infrastructure co-investment, and a public reconciliation ceremony.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Claimant Nation', 'Offer to Withdraw Claim for Economic Deal',
    'Propose to formally withdraw your territorial claim in exchange for a comprehensive economic package. Trade access, investment guarantees, and debt restructuring. Pragmatism over pride.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "special": "resolve_issue", "relation_delta": 5, "stat_effects_acceptor": [{ "stat_key": "gov_approval", "delta": -1.5, "duration_ticks": 1, "target": "self" }], "stat_effects_proposer": [{ "stat_key": "gov_approval", "delta": 3, "duration_ticks": 1, "target": "self" }], "stat_effects": [{ "stat_key": "trade_balance", "delta": 0.2, "duration_ticks": 30, "target": "acceptor" }] }'::jsonb,
    '{ "favor_delta_to_proposer": 0.5 }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 15: Demilitarized Zone Proposal (Diplomatic / MoD) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'territorial_ownership', 15, 'Demilitarized Zone Proposal', 'diplomatic', 'minister_of_defense', 1,
    'Military analysts warn that force concentration near the territory is creating "accidental war" risk. Patrols cross paths. Radar locks happen. One nervous lieutenant could start a shooting war.',

    'Either Nation', 'Propose Mutual Demilitarization',
    'Both sides withdraw military forces from a defined buffer zone around the territory. Observation posts staffed by neutral monitors. Weapons systems pulled back beyond engagement range.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Either Nation', 'Propose Mutual Demilitarization',
    'Both sides withdraw military forces from a defined buffer zone around the territory. Observation posts staffed by neutral monitors. Weapons systems pulled back beyond engagement range.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "tension_delta": -3, "remove_modifier": "military_outpost", "stat_effects": [{ "stat_key": "stability", "delta": 0.1, "duration_ticks": 10, "target": "both" }] }'::jsonb,
    '{ "favor_delta_to_proposer": 0.5, "tension_delta": 1 }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;

-- ── CARD 16: Population Census Agreement (Diplomatic / FM) ──
INSERT INTO issue_card_definitions (
    issue_type, card_number, card_name, card_type, required_role, ap_cost,
    narrative,
    option_a_label, option_a_title, option_a_text, option_a_effects,
    option_b_label, option_b_title, option_b_text, option_b_effects,
    diplomatic_accept_effects, diplomatic_reject_effects
) VALUES (
    'territorial_ownership', 16, 'Population Census Agreement', 'diplomatic', 'foreign_minister', 1,
    'Both nations claim demographic majority in the territory. Neither has reliable data. International demographers offer to conduct an independent, supervised census — but both sides must agree to accept the results.',

    'Either Nation', 'Accept Independent Census',
    'Allow international demographers to conduct a full census of the territory. Methodology reviewed by both sides. Results published globally. Whatever the numbers say, you accept them.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    'Either Nation', 'Accept Independent Census',
    'Allow international demographers to conduct a full census of the territory. Methodology reviewed by both sides. Results published globally. Whatever the numbers say, you accept them.',
    '{ "favor_delta": 0, "tension_delta": 0, "relation_delta": 0 }'::jsonb,

    '{ "tension_delta": -1, "special": "census_favor_shift" }'::jsonb,
    '{ "favor_delta_to_proposer": 1 }'::jsonb
) ON CONFLICT (issue_type, card_number) DO NOTHING;
