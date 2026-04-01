-- ============================================================
-- Phase 2d: Fishing Dispute — Autocracy Actions Seed Data
-- ============================================================
-- 8 aggrieved autocracy + 8 enforcer autocracy = 16 records
-- Autocracies use Regime_Health instead of Gov_Approval,
-- Faction_Loyalty instead of Polarization, and skip parliamentary approval.
-- ============================================================


-- ==================== AGGRIEVED AUTOCRACY (Nation A) ====================

INSERT INTO incident_actions_available (
    incident_type, nation_role, gov_type, action_key, action_name,
    action_description, required_role, ap_cost, leverage_min, leverage_max,
    cooldown_ticks, is_one_time, requires_action_key,
    effects_template, risk_description, backfire_chance, backfire_effects,
    escalation_color
) VALUES

-- 1. State Media Propaganda Blitz
('fishing_dispute', 'aggrieved', 'autocracy', 'propaganda_blitz',
 'State Media Propaganda Blitz',
 'Flood state media with coverage framing the seizure as an act of aggression. Controlled narrative. Patriotic rallies organized. The crew are national heroes.',
 'HoG', 1, 1, 2,
 3, FALSE, NULL,
 '{"stat_effects": {"Civil_Unrest_a": -1, "Polarization_a": 1}, "scaling": {"stat": "press_freedom", "nation": "self", "inverted": true, "tiers": [{"max": 30, "lev_min": 2, "lev_max": 2}, {"max": 50, "lev_min": 1, "lev_max": 2}, {"min": 50, "lev_min": 1, "lev_max": 1}]}}',
 NULL, NULL, NULL,
 'pressure'),

-- 2. Threaten Detained Nation B Citizens
('fishing_dispute', 'aggrieved', 'autocracy', 'threaten_citizens',
 'Threaten Detained Citizens',
 'Order security services to detain, harass, or restrict enforcer citizens in your country. Business travelers, students, tourists. A hostage situation without calling it one.',
 'HoG', 2, 2, 3,
 0, TRUE, NULL,
 '{"stat_effects": {"Relations": -6, "Intl_Reputation_a": -2, "Civil_Unrest_b": 1}, "scaling": {"stat": "immigration_between", "tiers": [{"condition": "high", "lev_min": 3, "lev_max": 3}, {"condition": "low", "lev_min": 2, "lev_max": 2}, {"condition": "none", "unavailable": true}]}}',
 'Heavy international reputation cost. Third-party nations may react.',
 NULL, NULL,
 'escalate'),

-- 3. Deploy Military Forces
('fishing_dispute', 'aggrieved', 'autocracy', 'deploy_military',
 'Deploy Military Forces',
 'Deploy naval forces to the disputed zone. No consultation, no parliamentary debate, no public announcement until the ships are already there.',
 'MoD', 3, 3, 5,
 0, FALSE, NULL,
 '{"stat_effects": {"Relations": -8, "Military_Readiness_both": 2, "Stability_both": -1}, "scaling": {"stat": "military_readiness", "compare": "vs_opponent", "tiers": [{"condition": "self_higher", "lev_min": 4, "lev_max": 5}, {"condition": "equal", "lev_min": 3, "lev_max": 4}, {"condition": "self_lower", "lev_min": 3, "lev_max": 3}]}, "cannot_undo": true}',
 NULL, NULL, NULL,
 'escalate'),

-- 4. Covert Sabotage Operation
('fishing_dispute', 'aggrieved', 'autocracy', 'covert_sabotage',
 'Covert Sabotage Operation',
 'Order intelligence services to sabotage the enforcer''s coast guard capabilities. Cyber attack, damage to patrol vessels, fuel contamination. Deniable, dirty, effective.',
 'HoG', 3, 1, 4,
 6, FALSE, NULL,
 '{"scaling": {"stat": "covert_ops_vs_defense", "tiers": [{"condition": "self_higher", "lev_min": 3, "lev_max": 4}, {"condition": "equal", "lev_min": 2, "lev_max": 3}, {"condition": "self_lower", "lev_min": 1, "lev_max": 2}]}, "if_hidden": {"stat_effects": {}}, "if_exposed": {"stat_effects": {"Relations": -10, "Intl_Reputation_a": -3}}}',
 'If your intelligence is weaker than their defenses, 25% chance of exposure — flips leverage to opponent +3.',
 0.25,
 '{"leverage_shift_b": 3, "leverage_shift_a": 0, "stat_effects": {"Intl_Reputation_a": -3, "Relations": -10}, "condition": "covert_ops_lower"}',
 'escalate'),

-- 5. Demand Release (Backed by Threat)
('fishing_dispute', 'aggrieved', 'autocracy', 'demand_release_threat',
 'Demand Release (Backed by Threat)',
 'Deliver a private ultimatum: release the crew in 3 ticks or face consequences. The ambiguity IS the threat.',
 'HoG', 2, 3, 3,
 0, TRUE, NULL,
 '{"stat_effects": {"Relations": -5}, "deadline": {"ticks": 3, "on_expire": {"leverage_shift_a": 2, "Military_Readiness_both": 2, "war_risk_pct": 20}, "automatic": true}}',
 'The follow-through is AUTOMATIC. Your military and security apparatus expects action after the deadline.',
 NULL, NULL,
 'escalate'),

-- 6. Seize Nation B Assets
('fishing_dispute', 'aggrieved', 'autocracy', 'seize_assets',
 'Seize Assets',
 'Nationalize or freeze all enforcer business assets, bank accounts, and property within your borders. No legal process, no compensation.',
 'HoG', 2, 1, 3,
 0, TRUE, NULL,
 '{"stat_effects": {"Relations": -8, "Intl_Reputation_a": -2, "Foreign_Investment_a": -2, "GDP_Growth_b": -0.5}, "scaling": {"stat": "foreign_investment_from_b", "tiers": [{"condition": "high", "lev_min": 3, "lev_max": 3}, {"condition": "low", "lev_min": 2, "lev_max": 2}, {"condition": "minimal", "lev_min": 1, "lev_max": 1}]}, "cannot_undo": true}',
 'Foreign_Investment -2 hits YOU. Every foreign investor watches you steal property. They''ll pull their money next.',
 NULL, NULL,
 'escalate'),

-- 7. Propose Mediation
('fishing_dispute', 'aggrieved', 'autocracy', 'propose_mediation',
 'Propose Mediation',
 'Call for third-party mediation. Riskier for autocracies — if burned, internal rivals see compromise as weakness.',
 'HoG', 2, 0, 0,
 3, FALSE, NULL,
 '{"mediation": true, "penalty_if_rejected": {"leverage_shift_a": -2, "Intl_Reputation_a": 0.5, "Regime_Health_a": -1}, "bonus_if_opponent_rejected": {"leverage_shift_a": 1}}',
 'Autocratic penalty: -2 leverage AND Regime_Health -1 if burned. Internal rivals see weakness.',
 NULL, NULL,
 'diplomatic'),

-- 8. Accept Situation / Concede
('fishing_dispute', 'aggrieved', 'autocracy', 'concede',
 'Accept Situation / Concede',
 'Accept the loss. Release a statement framing the concession as "strategic patience." Your propagandists will spin it.',
 'HoG', 0, 0, 0,
 0, TRUE, NULL,
 '{"resolution": true, "resolution_type": "concession_a", "stat_effects": {"Relations": 3, "Intl_Reputation_a": -1}, "regime_health_cost": "opponent_leverage_x1.5", "coup_risk": {"threshold": 20, "chance": 0.3}}',
 'WARNING: If Regime_Health drops below 20, 30% chance of coup attempt.',
 NULL, NULL,
 'concede')

ON CONFLICT (incident_type, nation_role, gov_type, action_key) DO NOTHING;


-- ==================== ENFORCER AUTOCRACY (Nation B) ====================

INSERT INTO incident_actions_available (
    incident_type, nation_role, gov_type, action_key, action_name,
    action_description, required_role, ap_cost, leverage_min, leverage_max,
    cooldown_ticks, is_one_time, requires_action_key,
    effects_template, risk_description, backfire_chance, backfire_effects,
    escalation_color
) VALUES

-- 1. Show Trial
('fishing_dispute', 'enforcer', 'autocracy', 'show_trial',
 'Show Trial',
 'Stage a public trial on state television. Predetermined verdict. Confessions obtained. The crew convicted of espionage. Sentences: 5 years.',
 'HoG', 1, 2, 2,
 0, TRUE, NULL,
 '{"stat_effects": {"Relations": -5, "Intl_Reputation_b": -2, "Civil_Unrest_a": 2}, "duration_ticks": 2}',
 'Every other nation watches this and thinks "that could be our citizens." Maximum intimidation, brutal reputation cost.',
 NULL, NULL,
 'escalate'),

-- 2. Use Crew as Explicit Bargaining Chips
('fishing_dispute', 'enforcer', 'autocracy', 'bargaining_chips',
 'Use Crew as Bargaining Chips',
 'Make it explicit: the crew will be released when the aggrieved meets specific demands. This is ransoming hostages with extra steps.',
 'HoG', 2, 2, 3,
 6, FALSE, NULL,
 '{"stat_effects": {"Relations": -8, "Intl_Reputation_b": -3}, "third_party_reaction": {"formal_protest_chance": 0.4}}',
 '40% chance a non-involved nation issues a formal protest against you.',
 NULL, NULL,
 'escalate'),

-- 3. Expand Military Enforcement Zone
('fishing_dispute', 'enforcer', 'autocracy', 'expand_enforcement_zone',
 'Expand Military Enforcement Zone',
 'Deploy additional coast guard and naval assets. Declare an expanded exclusion zone. Any vessel entering will be intercepted.',
 'MoD', 2, 2, 4,
 0, FALSE, NULL,
 '{"stat_effects": {"Relations": -5, "Military_Readiness_b": 1}, "scaling": {"stat": "military_readiness", "compare": "vs_opponent", "tiers": [{"condition": "self_higher", "lev_min": 3, "lev_max": 4}, {"condition": "equal", "lev_min": 2, "lev_max": 3}, {"condition": "self_lower", "lev_min": 1, "lev_max": 2}]}, "cannot_undo": true}',
 NULL, NULL, NULL,
 'escalate'),

-- 4. Economic Strangulation
('fishing_dispute', 'enforcer', 'autocracy', 'economic_strangulation',
 'Economic Strangulation',
 'Block ALL aggrieved goods from entering your country. Seize cargo in transit. Redirect supply chains. A blockade without the military label.',
 'MoT', 2, 2, 3,
 0, FALSE, NULL,
 '{"stat_effects": {"Trade_Balance_both": -2, "GDP_Growth_a": -1, "Foreign_Investment_b": -1}, "persists_until": "lifted_or_resolved"}',
 'Hits your own Foreign_Investment because investors see you as unpredictable.',
 NULL, NULL,
 'pressure'),

-- 5. Threaten Crew Mistreatment
('fishing_dispute', 'enforcer', 'autocracy', 'threaten_mistreatment',
 'Threaten Crew Mistreatment',
 'Allow reports to leak that the detained crew is held in harsh conditions. Solitary confinement. Limited food. You don''t confirm or deny.',
 'HoG', 1, 3, 3,
 0, TRUE, NULL,
 '{"stat_effects": {"Relations": -10, "Intl_Reputation_b": -4}, "third_party_reaction": {"formal_protest_chance": 0.6}, "tick_29_interaction": "if TICK_29 fires after this, leverage_shift_a becomes 6 instead of 4"}',
 'MAXIMUM reputation damage. Every nation sees this. If the crew death event fires after this, the death is attributed to your mistreatment.',
 NULL, NULL,
 'escalate'),

-- 6. Proxy Provocation
('fishing_dispute', 'enforcer', 'autocracy', 'proxy_provocation',
 'Proxy Provocation',
 'Stage an incident making the aggrieved look like the aggressor. False flag: a vessel fires on your coast guard (actually your operatives). Planted weapons found.',
 'HoG', 3, 0, 4,
 6, FALSE, NULL,
 '{"scaling": {"stat": "covert_ops", "tiers": [{"condition": "success", "lev_min": 3, "lev_max": 4}, {"condition": "partial", "lev_min": 1, "lev_max": 2}, {"condition": "failure", "lev_min": 0, "lev_max": 0}]}, "if_hidden": {"stat_effects": {}}, "if_exposed": {"stat_effects": {"Relations": -10, "Intl_Reputation_b": -4}}}',
 'Highest-risk, highest-reward. If it works, the narrative flips. If it fails, you''re exposed and the crisis becomes unwinnable.',
 0.3,
 '{"leverage_shift_a": 4, "leverage_shift_b": 0, "stat_effects": {"Relations": -10, "Intl_Reputation_b": -4}}',
 'escalate'),

-- 7. Propose Mediation
('fishing_dispute', 'enforcer', 'autocracy', 'propose_mediation',
 'Propose Mediation',
 'Call for third-party mediation. Riskier for autocracies — if burned, Regime_Health -1 in addition to leverage penalty.',
 'HoG', 2, 0, 0,
 3, FALSE, NULL,
 '{"mediation": true, "penalty_if_rejected": {"leverage_shift_b": -2, "Intl_Reputation_b": 0.5, "Regime_Health_b": -1}, "bonus_if_opponent_rejected": {"leverage_shift_b": 1}}',
 'Autocratic penalty: -2 leverage AND Regime_Health -1 if burned.',
 NULL, NULL,
 'diplomatic'),

-- 8. Accept Situation / Back Down
('fishing_dispute', 'enforcer', 'autocracy', 'concede',
 'Accept Situation / Back Down',
 'Release crew and vessel. Concede the enforcement action. Frame as de-escalation. Your propagandists will spin it.',
 'HoG', 0, 0, 0,
 0, TRUE, NULL,
 '{"resolution": true, "resolution_type": "concession_b", "stat_effects": {"Relations": 3, "Intl_Reputation_b": -1}, "regime_health_cost": "opponent_leverage_x1.5", "coup_risk": {"threshold": 20, "chance": 0.3}}',
 'WARNING: If Regime_Health drops below 20, 30% chance of coup attempt. Autocrats conceding is existentially dangerous.',
 NULL, NULL,
 'concede')

ON CONFLICT (incident_type, nation_role, gov_type, action_key) DO NOTHING;
