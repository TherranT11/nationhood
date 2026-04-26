-- Seed start events for border_incursion incident type.
-- Required for territorial ownership disputes to escalate when tension hits 10.

-- ==================== 5 START EVENTS ====================

INSERT INTO incident_event_pool (incident_type, event_key, category, event_text_template, leverage_shift_a, leverage_shift_b, stat_effects_template, metadata_template)
VALUES
('border_incursion', 'START_1', 'start',
 'Armed forces from {nation_a} have crossed into the disputed territory. {nation_b}''s border patrols report unauthorized military vehicles on the main highway.',
 2, 0, NULL, NULL),

('border_incursion', 'START_2', 'start',
 '{nation_a} claims its troops entered the territory to protect ethnic nationals facing persecution. {nation_b} calls it a blatant violation of sovereignty.',
 1, 0, NULL, NULL),

('border_incursion', 'START_3', 'start',
 'A border checkpoint was seized overnight by {nation_a} forces. {nation_b} has deployed its military to establish a defensive perimeter.',
 2, 1, NULL, NULL),

('border_incursion', 'START_4', 'start',
 'Satellite imagery confirms {nation_a} has moved armored units to within 5km of the disputed boundary. {nation_b}''s foreign ministry demands immediate withdrawal.',
 1, 0, NULL, NULL),

('border_incursion', 'START_5', 'start',
 'Both nations'' flags now fly over the disputed territory. Civilian authorities have withdrawn. Military standoff at the main crossroads.',
 1, 1, NULL, NULL)

ON CONFLICT (incident_type, event_key) DO NOTHING;

-- ==================== 10 TICK EVENTS (LOW/MOD/HIGH) ====================
-- Categories must match incident_event_pool_category_check:
-- 'start','low','moderate','high','escalation_a5/b5/a8/b8'.
-- Resolutions are not stored here — incidents.js generates them at runtime.

INSERT INTO incident_event_pool (incident_type, event_key, category, event_text_template, leverage_shift_a, leverage_shift_b, stat_effects_template, metadata_template)
VALUES
-- LOW INTENSITY
('border_incursion', 'TICK_L1', 'low',
 '{nation_a} soldiers are distributing food to local civilians in the occupied zone. Hearts and minds campaign underway.',
 1, 0, NULL, NULL),

('border_incursion', 'TICK_L2', 'low',
 'International observers arrive at the border. Both sides agree to maintain current positions while talks proceed.',
 0, 0, NULL, NULL),

('border_incursion', 'TICK_L3', 'low',
 'Minor scuffle between border patrols at a secondary crossing. No injuries reported. Both sides blame the other.',
 0, 0, NULL, NULL),

-- MODERATE INTENSITY
('border_incursion', 'TICK_M1', 'moderate',
 '{nation_b} scrambles fighter jets over the disputed territory in a show of force. {nation_a} condemns the provocation.',
 0, 2, NULL, NULL),

('border_incursion', 'TICK_M2', 'moderate',
 'Civilian refugees from the disputed territory flood into {nation_b}. Humanitarian crisis developing at border camps.',
 0, 1, NULL, NULL),

('border_incursion', 'TICK_M3', 'moderate',
 '{nation_a} begins fortifying positions with sandbags and razor wire. {nation_b} accuses them of establishing a permanent occupation.',
 1, 0, NULL, NULL),

('border_incursion', 'TICK_M4', 'moderate',
 'Trade between the two nations has collapsed. Border crossings closed to all civilian traffic.',
 0, 0, NULL, NULL),

-- HIGH INTENSITY
('border_incursion', 'TICK_H1', 'high',
 'Exchange of gunfire at the northern checkpoint. Two soldiers from {nation_b} wounded. {nation_a} claims self-defense.',
 1, 0, NULL, NULL),

('border_incursion', 'TICK_H2', 'high',
 '{nation_b} mobilizes reserve forces along the entire shared border. Full military readiness declared.',
 0, 3, NULL, NULL),

('border_incursion', 'TICK_H3', 'high',
 'International community calls for immediate ceasefire. UN Security Council holds emergency session on the crisis.',
 0, 0, NULL, NULL)

ON CONFLICT (incident_type, event_key) DO NOTHING;
