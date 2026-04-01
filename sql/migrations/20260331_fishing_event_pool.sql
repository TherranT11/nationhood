-- ============================================================
-- Phase 2b: Fishing Dispute — Event Pool Seed Data
-- ============================================================
-- 5 start events + 30 tick events + 12 escalation events = 47 records
-- Placeholders: {nation_a} = aggrieved, {nation_b} = enforcer
-- ============================================================

-- ==================== 5 START EVENTS ====================

INSERT INTO incident_event_pool (incident_type, event_key, category, event_text_template, leverage_shift_a, leverage_shift_b, stat_effects_template, metadata_template)
VALUES
('fishing_dispute', 'START_1', 'start',
 'Seized vessel''s captain claims he was fishing in traditional waters for 30 years. Family members protest at {nation_b}''s embassy.',
 1, 0, NULL, NULL),

('fishing_dispute', 'START_2', 'start',
 '{nation_b} coast guard releases inspection footage showing {nation_a} vessels dumping undersized fish to hide illegal catch volumes.',
 0, 2, NULL, NULL),

('fishing_dispute', 'START_3', 'start',
 'Both foreign ministries issue measured statements. International media coverage is minimal.',
 0, 0, NULL, NULL),

('fishing_dispute', 'START_4', 'start',
 '{nation_a}''s fishing union calls a general strike in port cities. Thousands refuse to sail until the crew is released.',
 2, 0, NULL, NULL),

('fishing_dispute', 'START_5', 'start',
 'International Maritime Organization confirms seizure location falls within {nation_b}''s recognized EEZ by 3 nautical miles.',
 0, 1, NULL, NULL)

ON CONFLICT (incident_type, event_key) DO NOTHING;


-- ==================== 30 TICK EVENTS ====================

-- LOW INTENSITY (10 events)

INSERT INTO incident_event_pool (incident_type, event_key, category, event_text_template, leverage_shift_a, leverage_shift_b, stat_effects_template, metadata_template)
VALUES
('fishing_dispute', 'TICK_1', 'low',
 'A second {nation_a} fishing vessel enters the disputed zone in defiance. {nation_b} coast guard monitors but does not intercept.',
 1, 0, NULL, NULL),

('fishing_dispute', 'TICK_2', 'low',
 '{nation_b} releases two detained crew members on humanitarian grounds — medical conditions.',
 0, 1, NULL, NULL),

('fishing_dispute', 'TICK_3', 'low',
 'Satellite imagery shows both nations'' fleets have been gradually encroaching on each other''s waters over 5 years.',
 0, 0, NULL, NULL),

('fishing_dispute', 'TICK_4', 'low',
 '{nation_a}''s ambassador requests meeting with {nation_b} FM. Meeting granted but produces no agreement.',
 0, 0, NULL, NULL),

('fishing_dispute', 'TICK_5', 'low',
 'Minor scuffle between {nation_a} fishermen and {nation_b} port officials at the impound dock. No serious injuries.',
 1, 0, NULL, NULL),

('fishing_dispute', 'TICK_6', 'low',
 '{nation_b} environmental agency reports overfishing threatens local stocks. Calls for reduced quotas from all nations.',
 0, 1, NULL, NULL),

('fishing_dispute', 'TICK_7', 'low',
 'International fishing association calls for joint management framework. Neither side commits.',
 0, 0, NULL, NULL),

('fishing_dispute', 'TICK_8', 'low',
 'Weather forces all vessels to port. Tensions ease temporarily.',
 0, 0, NULL, '{"special": "both_toward_center_0.5"}'),

('fishing_dispute', 'TICK_9', 'low',
 '{nation_a} fishermen''s wives stage a candlelight vigil outside {nation_b}''s embassy. Photos circulate internationally.',
 1, 0, NULL, NULL),

('fishing_dispute', 'TICK_10', 'low',
 '{nation_b} port authority announces improved conditions for the detained crew. Access to legal representation granted.',
 0, 1, NULL, NULL)

ON CONFLICT (incident_type, event_key) DO NOTHING;


-- MODERATE INTENSITY (10 events)

INSERT INTO incident_event_pool (incident_type, event_key, category, event_text_template, leverage_shift_a, leverage_shift_b, stat_effects_template, metadata_template)
VALUES
('fishing_dispute', 'TICK_11', 'moderate',
 '{nation_a} state media broadcasts children of detained crew crying for their fathers. Story goes viral regionally.',
 2, 0, NULL, NULL),

('fishing_dispute', 'TICK_12', 'moderate',
 '{nation_b} publishes vessel''s logbook showing 14 incursions into {nation_b}''s claimed EEZ in the past year. Systematic, not accidental.',
 0, 2, NULL, NULL),

('fishing_dispute', 'TICK_13', 'moderate',
 'A {nation_a} commercial vessel turned away from {nation_b} port. "Enhanced security screening." Widely seen as retaliation.',
 2, 0, NULL, NULL),

('fishing_dispute', 'TICK_14', 'moderate',
 'Third-party nation offers to host negotiations. {nation_a} accepts immediately. {nation_b} says it will "consider the proposal."',
 1, 0, NULL, NULL),

('fishing_dispute', 'TICK_15', 'moderate',
 '{nation_b} coast guard intercepts and boards ANOTHER {nation_a} vessel. Second detention in the same crisis.',
 0, 2, NULL, NULL),

('fishing_dispute', 'TICK_16', 'moderate',
 '{nation_a} fishing industry reports major economic losses. Coastal communities suffering. Pressure mounts on government.',
 0, 1, NULL, NULL),

('fishing_dispute', 'TICK_17', 'moderate',
 'Popular {nation_a} politician calls for consumer boycott of {nation_b} goods. Some retail chains begin pulling products.',
 2, 0, NULL, NULL),

('fishing_dispute', 'TICK_18', 'moderate',
 'Leaked diplomatic cable: {nation_b}''s FM privately called the seizure "an overreaction." Government scrambles on damage control.',
 2, 0, NULL, NULL),

('fishing_dispute', 'TICK_19', 'moderate',
 '{nation_b} files formal boundary demarcation documents with the International Maritime Organization, strengthening their legal claim.',
 0, 2, NULL, NULL),

('fishing_dispute', 'TICK_20', 'moderate',
 'Regional fishing nations issue a joint statement calling the detained crew''s treatment "concerning." Not a condemnation, but pressure.',
 1, 0, NULL, NULL)

ON CONFLICT (incident_type, event_key) DO NOTHING;


-- HIGH INTENSITY (10 events)

INSERT INTO incident_event_pool (incident_type, event_key, category, event_text_template, leverage_shift_a, leverage_shift_b, stat_effects_template, metadata_template)
VALUES
('fishing_dispute', 'TICK_21', 'high',
 '{nation_a} fishing vessel rams {nation_b} coast guard cutter while fleeing. Cutter damaged. One officer injured.',
 0, 3, '{"Relations": -3}', NULL),

('fishing_dispute', 'TICK_22', 'high',
 '{nation_b} coast guard fires warning shots at {nation_a} vessel that refused to stop. No casualties. Filmed internationally.',
 3, 0, '{"Relations": -3}', NULL),

('fishing_dispute', 'TICK_23', 'high',
 'A {nation_a} naval vessel enters the disputed zone. Positions between fishing fleet and coast guard. Military presence.',
 3, 0, '{"Military_Readiness_both": 1}', NULL),

('fishing_dispute', 'TICK_24', 'high',
 'International court issues preliminary injunction ordering crew release. {nation_b} has 3 ticks to comply.',
 4, 0, NULL, NULL),

('fishing_dispute', 'TICK_25', 'high',
 '{nation_b} declares disputed zone a "restricted military area." Deploys a frigate. All civilian vessels ordered out.',
 0, 3, '{"Military_Readiness_both": 1, "Stability_both": -1}', NULL),

('fishing_dispute', 'TICK_26', 'high',
 'Intelligence suggests {nation_a} covertly arming fishing vessels. Reinforced hulls. Military-grade communications.',
 0, 3, NULL, NULL),

('fishing_dispute', 'TICK_27', 'high',
 'Mass protests in {nation_a} capital. Tens of thousands demand government "defend sovereignty." Approval surges but compromise dies.',
 3, 0, '{"Gov_Approval_a": 2, "Polarization_a": 2}', NULL),

('fishing_dispute', 'TICK_28', 'high',
 '{nation_b} impounds ALL {nation_a} commercial vessels in {nation_b} ports. Cargo, tankers, ferries. Economic hostage-taking.',
 0, 4, '{"Trade_Balance_both": -2}', NULL),

('fishing_dispute', 'TICK_29', 'high',
 'A {nation_a} fisherman dies in custody. Cause disputed. International outrage.',
 4, 0, '{"Relations": -5, "Intl_Reputation_b": -2}', NULL),

('fishing_dispute', 'TICK_30', 'high',
 'Both navies conducting parallel patrols. Vessels pass within 200 meters. One wrong move and shots are fired.',
 0, 0, '{"Stability_both": -2, "Military_Readiness_both": 2}', '{"war_risk_pct": 10, "war_risk_description": "10% per tick chance of accidental exchange of fire"}')

ON CONFLICT (incident_type, event_key) DO NOTHING;


-- ==================== 12 ESCALATION EVENTS ====================

-- Nation A leverage hits 5

INSERT INTO incident_event_pool (incident_type, event_key, category, event_text_template, leverage_shift_a, leverage_shift_b, stat_effects_template, metadata_template)
VALUES
('fishing_dispute', 'ESC_A5_1', 'escalation_a5',
 'International media picks up the story. Sympathetic coverage of detained fishermen. {nation_b}''s embassy in {nation_a} besieged by protesters.',
 0, 0, '{"Intl_Reputation_b": -1, "Civil_Unrest_a": 1}', NULL),

('fishing_dispute', 'ESC_A5_2', 'escalation_a5',
 'Three regional nations issue statements of "concern" about {nation_b}''s enforcement. Diplomatic isolation beginning.',
 0, 0, '{"Relations_b_others": -2}', '{"targets": "3_random_non_involved"}'),

('fishing_dispute', 'ESC_A5_3', 'escalation_a5',
 '{nation_b}''s opposition party calls the crisis "a self-inflicted embarrassment." Internal political fracture.',
 0, 0, '{"Gov_Approval_b": -3, "Polarization_b": 1}', NULL)

ON CONFLICT (incident_type, event_key) DO NOTHING;


-- Nation B leverage hits 5

INSERT INTO incident_event_pool (incident_type, event_key, category, event_text_template, leverage_shift_a, leverage_shift_b, stat_effects_template, metadata_template)
VALUES
('fishing_dispute', 'ESC_B5_1', 'escalation_b5',
 'International legal experts publish analysis supporting {nation_b}''s EEZ claim. Academic consensus forming.',
 0, 0, '{"Intl_Reputation_a": -1}', NULL),

('fishing_dispute', 'ESC_B5_2', 'escalation_b5',
 '{nation_a} fishermen avoiding the zone entirely. Coastal communities in economic free-fall.',
 0, 0, '{"Food_Security_a": -1, "Trade_Balance_a": -1}', NULL),

('fishing_dispute', 'ESC_B5_3', 'escalation_b5',
 '{nation_b} announces permanent coast guard station in disputed zone. Construction begins in 6 ticks. Fait accompli.',
 0, 0, '{"Stability_a": -1, "Relations": -3}', NULL)

ON CONFLICT (incident_type, event_key) DO NOTHING;


-- Nation A leverage hits 8

INSERT INTO incident_event_pool (incident_type, event_key, category, event_text_template, leverage_shift_a, leverage_shift_b, stat_effects_template, metadata_template)
VALUES
('fishing_dispute', 'ESC_A8_1', 'escalation_a8',
 'IMO issues formal demand for crew release. Failure to comply in 3 ticks triggers international shipping sanctions on {nation_b}.',
 0, 0, '{"Intl_Reputation_b": -2}', '{"deadline_ticks": 3, "deadline_type": "imo_sanctions"}'),

('fishing_dispute', 'ESC_A8_2', 'escalation_a8',
 '{nation_a} parliament passes "all means necessary" resolution. Interpreted as war authorization.',
 0, 0, '{"Stability_b": -2, "Military_Readiness_both": 2, "Relations": -5}', '{"war_risk_pct": 15}'),

('fishing_dispute', 'ESC_A8_3', 'escalation_a8',
 '{nation_a}''s military alliance issues a joint statement condemning {nation_b}. Alliance DEFCON elevated.',
 0, 0, '{"Deterrence_b": -2}', '{"requires": "nation_a_in_military_alliance", "alliance_cohesion": 3}')

ON CONFLICT (incident_type, event_key) DO NOTHING;


-- Nation B leverage hits 8

INSERT INTO incident_event_pool (incident_type, event_key, category, event_text_template, leverage_shift_a, leverage_shift_b, stat_effects_template, metadata_template)
VALUES
('fishing_dispute', 'ESC_B8_1', 'escalation_b8',
 '{nation_a}''s fishing industry petitions government to surrender. Every major union signs. "We cannot sustain these losses."',
 0, 0, '{"Gov_Approval_a": -4, "Polarization_a": 2}', NULL),

('fishing_dispute', 'ESC_B8_2', 'escalation_b8',
 '{nation_b} announces vessel permanently confiscated. Crew to face criminal trial with 2-year sentences.',
 0, 0, '{"Relations": -8, "Civil_Unrest_a": 4, "Stability_a": -2}', NULL),

('fishing_dispute', 'ESC_B8_3', 'escalation_b8',
 'Major foreign investor pulls out of {nation_a} citing "unstable maritime situation."',
 0, 0, '{"Foreign_Investment_a": -2, "GDP_Growth_a": -0.5}', NULL)

ON CONFLICT (incident_type, event_key) DO NOTHING;
