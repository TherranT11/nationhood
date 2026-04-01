-- ============================================================
-- Phase 2c: Fishing Dispute — Democracy Actions Seed Data
-- ============================================================
-- 7 aggrieved democracy + 7 enforcer democracy = 14 records
-- ============================================================


-- ==================== AGGRIEVED DEMOCRACY (Nation A) ====================

INSERT INTO incident_actions_available (
    incident_type, nation_role, gov_type, action_key, action_name,
    action_description, required_role, ap_cost, leverage_min, leverage_max,
    cooldown_ticks, is_one_time, requires_action_key,
    effects_template, risk_description, backfire_chance, backfire_effects,
    escalation_color
) VALUES

-- 1. Rally International Sympathy
('fishing_dispute', 'aggrieved', 'democracy', 'rally_sympathy',
 'Rally International Sympathy',
 'Launch a coordinated diplomatic campaign. Brief foreign journalists, circulate photos of detained crew''s families, request statements of support from friendly nations.',
 'Ambassador', 1, 1, 3,
 4, FALSE, NULL,
 '{"stat_effects": {"Relations": -1}, "scaling": {"stat": "intl_reputation", "nation": "self", "tiers": [{"min": 60, "lev_min": 2, "lev_max": 3}, {"min": 40, "lev_min": 1, "lev_max": 2}, {"min": 0, "lev_min": 1, "lev_max": 1}]}}',
 NULL, NULL, NULL,
 'diplomatic'),

-- 2. Demand Crew Release (Ultimatum)
('fishing_dispute', 'aggrieved', 'democracy', 'demand_release_ultimatum',
 'Demand Crew Release (Ultimatum)',
 'Publicly demand the immediate release of detained citizens. Set a firm deadline. Put the enforcer on the clock.',
 'HoG', 3, 2, 2,
 0, TRUE, NULL,
 '{"stat_effects": {"Relations": -5}, "deadline": {"ticks": 3, "on_expire": {"leverage_shift_a": 3}, "on_comply": {"leverage_shift_a": -3, "Relations": 3}}}',
 'If they call the bluff and ignore the deadline, you gain leverage but must escalate further or look weak.',
 NULL, NULL,
 'pressure'),

-- 3. File International Legal Complaint
('fishing_dispute', 'aggrieved', 'democracy', 'file_legal_complaint',
 'File International Legal Complaint',
 'File a formal complaint with the International Maritime Organization. Slow but legitimate. The ruling carries real weight.',
 'FM', 2, 1, 1,
 0, TRUE, NULL,
 '{"immediate_leverage_a": 1, "delayed_ruling": {"ticks": 4, "scaling": {"stat": "intl_reputation", "compare": "vs_opponent", "outcomes": {"self_higher": {"for_a_pct": 65, "ambiguous_pct": 25, "against_pct": 10, "for_lev": 3, "against_lev": -2}, "equal": {"for_a_pct": 45, "ambiguous_pct": 35, "against_pct": 20, "for_lev": 2, "against_lev": -2}, "self_lower": {"for_a_pct": 30, "ambiguous_pct": 30, "against_pct": 40, "for_lev": 2, "against_lev": -3}}}}}',
 NULL, NULL, NULL,
 'diplomatic'),

-- 4. Organize Economic Boycott
('fishing_dispute', 'aggrieved', 'democracy', 'economic_boycott',
 'Organize Economic Boycott',
 'Organize a consumer and commercial boycott of enforcer goods. Seafood products targeted first, then broader economic pressure.',
 'MoT', 3, 1, 4,
 0, FALSE, NULL,
 '{"stat_effects": {"Trade_Balance_both": -1}, "scaling": {"stat": "trade_balance_vs_opponent", "tiers": [{"condition": "opponent_exports_more", "lev_min": 3, "lev_max": 4, "extra": {"GDP_Growth_b": -0.5}}, {"condition": "balanced", "lev_min": 2, "lev_max": 3}, {"condition": "self_exports_more", "lev_min": 1, "lev_max": 2}]}, "persists_until": "lifted_or_resolved"}',
 'If the trade balance doesn''t favor this, the boycott hurts you more than them.',
 NULL, NULL,
 'pressure'),

-- 5. Deploy Naval Escort
('fishing_dispute', 'aggrieved', 'democracy', 'deploy_naval_escort',
 'Deploy Naval Escort',
 'Send a naval task force to escort fishing vessels. Armed escort with orders to prevent further seizures.',
 'MoD', 4, 2, 5,
 0, FALSE, NULL,
 '{"stat_effects": {"Relations": -8, "Military_Readiness_both": 2, "Stability_both": -1}, "scaling": {"stat": "military_readiness", "compare": "vs_opponent", "tiers": [{"condition": "self_higher", "lev_min": 4, "lev_max": 5}, {"condition": "equal", "lev_min": 3, "lev_max": 4}, {"condition": "self_lower", "lev_min": 2, "lev_max": 3}]}, "persists_until": "resolved", "cannot_undo": true}',
 'If your military isn''t stronger than theirs, deploying looks provocative rather than protective. The international community may turn on you.',
 0.2,
 '{"leverage_shift_a": 0, "stat_effects": {"Intl_Reputation_a": -2}, "condition": "self_military_lower"}',
 'escalate'),

-- 6. Propose Mediation
('fishing_dispute', 'aggrieved', 'democracy', 'propose_mediation',
 'Propose Mediation',
 'Publicly call for third-party mediation of the dispute. A signal of willingness to compromise — but only if the other side agrees.',
 'HoG', 2, 0, 0,
 3, FALSE, NULL,
 '{"mediation": true, "penalty_if_rejected": {"leverage_shift_a": -2, "Intl_Reputation_a": 0.5}, "bonus_if_opponent_rejected": {"leverage_shift_a": 1}}',
 'If the other side doesn''t reciprocate, you lose 2 leverage and look weak.',
 NULL, NULL,
 'diplomatic'),

-- 7. Accept Situation / Concede
('fishing_dispute', 'aggrieved', 'democracy', 'concede',
 'Accept Situation / Concede',
 'Accept the enforcer''s enforcement action. Request crew release through normal legal channels. Concede the disputed waters.',
 'HoG', 0, 0, 0,
 0, TRUE, NULL,
 '{"resolution": true, "resolution_type": "concession_a", "stat_effects": {"Relations": 3, "Intl_Reputation_a": -1}, "gov_approval_cost": "opponent_leverage"}',
 NULL, NULL, NULL,
 'concede')

ON CONFLICT (incident_type, nation_role, gov_type, action_key) DO NOTHING;


-- ==================== ENFORCER DEMOCRACY (Nation B) ====================

INSERT INTO incident_actions_available (
    incident_type, nation_role, gov_type, action_key, action_name,
    action_description, required_role, ap_cost, leverage_min, leverage_max,
    cooldown_ticks, is_one_time, requires_action_key,
    effects_template, risk_description, backfire_chance, backfire_effects,
    escalation_color
) VALUES

-- 1. Tighten Legal Case
('fishing_dispute', 'enforcer', 'democracy', 'tighten_legal_case',
 'Tighten Legal Case',
 'Direct prosecutors to build the strongest possible case against the detained crew. Compile evidence, document violations, prepare for trial.',
 'FM', 1, 1, 2,
 4, FALSE, NULL,
 '{"stat_effects": {"Relations": -1}, "scaling": {"stat": "judicial_independence", "nation": "self", "tiers": [{"min": 60, "lev_min": 2, "lev_max": 2}, {"min": 40, "lev_min": 1, "lev_max": 2}, {"min": 0, "lev_min": 1, "lev_max": 1}]}}',
 'A corrupt nation prosecuting fishermen looks like persecution, not justice.',
 0.15,
 '{"leverage_shift_b": 0, "description": "Case seen as politically motivated", "condition": "judicial_independence_below_40"}',
 'diplomatic'),

-- 2. Prosecute and Sentence Crew
('fishing_dispute', 'enforcer', 'democracy', 'prosecute_crew',
 'Prosecute and Sentence Crew',
 'Formally charge and try the detained crew. If convicted: vessel permanently confiscated, crew sentenced to fines and detention.',
 'FM', 3, 3, 3,
 0, TRUE, NULL,
 '{"stat_effects": {"Relations": -8, "Civil_Unrest_a": 3}, "duration_ticks": 4, "conditional": {"if_opponent_intl_rep_gt_55": {"Intl_Reputation_b": -1}}}',
 'If the aggrieved nation has high international reputation, the trial generates backlash.',
 NULL, NULL,
 'pressure'),

-- 3. Expand Maritime Enforcement Zone
('fishing_dispute', 'enforcer', 'democracy', 'expand_enforcement_zone',
 'Expand Maritime Enforcement Zone',
 'Deploy additional coast guard and naval assets. Expand the enforced perimeter. Any aggrieved vessel entering the zone will be boarded and inspected.',
 'MoD', 3, 1, 4,
 0, FALSE, NULL,
 '{"stat_effects": {"Relations": -5, "Military_Readiness_b": 1}, "scaling": {"stat": "military_readiness", "compare": "vs_opponent", "tiers": [{"condition": "self_higher", "lev_min": 3, "lev_max": 4}, {"condition": "equal", "lev_min": 2, "lev_max": 3}, {"condition": "self_lower", "lev_min": 1, "lev_max": 2}]}, "persists_until": "resolved", "cannot_undo": true}',
 NULL, NULL, NULL,
 'escalate'),

-- 4. Impose Port Restrictions
('fishing_dispute', 'enforcer', 'democracy', 'port_restrictions',
 'Impose Port Restrictions on Aggrieved',
 'Enhanced inspections on all aggrieved vessels in your ports. 2-3 day delays per vessel. Technically legal, clearly retaliatory.',
 'MoT', 2, 2, 2,
 0, FALSE, NULL,
 '{"stat_effects": {"Trade_Balance_both": -1, "Trade_Balance_a": -1}, "persists_until": "lifted_or_resolved"}',
 NULL, NULL, NULL,
 'pressure'),

-- 5. Offer Conditional Crew Release
('fishing_dispute', 'enforcer', 'democracy', 'conditional_release',
 'Offer Conditional Crew Release',
 'Offer to release the crew in exchange for the aggrieved acknowledging your maritime jurisdiction. The vessel stays.',
 'HoG', 2, 1, 2,
 6, FALSE, NULL,
 '{"offer": true, "if_accepted": {"leverage_shift_b": 1, "stat_effects": {"Relations": 2}, "crew_released": true, "eez_acknowledged": true}, "if_rejected": {"leverage_shift_b": 2}}',
 'This is a trap disguised as generosity. If they accept, they concede the waters. If they reject, you look reasonable.',
 NULL, NULL,
 'diplomatic'),

-- 6. Propose Mediation
('fishing_dispute', 'enforcer', 'democracy', 'propose_mediation',
 'Propose Mediation',
 'Publicly call for third-party mediation. Signal willingness to compromise — but only if the other side agrees.',
 'HoG', 2, 0, 0,
 3, FALSE, NULL,
 '{"mediation": true, "penalty_if_rejected": {"leverage_shift_b": -2, "Intl_Reputation_b": 0.5}, "bonus_if_opponent_rejected": {"leverage_shift_b": 1}}',
 'If the other side doesn''t reciprocate, you lose 2 leverage and look weak.',
 NULL, NULL,
 'diplomatic'),

-- 7. Accept Situation / Back Down
('fishing_dispute', 'enforcer', 'democracy', 'concede',
 'Accept Situation / Back Down',
 'Release crew and vessel. Acknowledge that the maritime boundary needs formal resolution. Walk back the enforcement action.',
 'HoG', 0, 0, 0,
 0, TRUE, NULL,
 '{"resolution": true, "resolution_type": "concession_b", "stat_effects": {"Relations": 3, "Intl_Reputation_b": -1}, "gov_approval_cost": "opponent_leverage"}',
 NULL, NULL, NULL,
 'concede')

ON CONFLICT (incident_type, nation_role, gov_type, action_key) DO NOTHING;
