-- ════════════════════════════════════════════════════════════════════════════════
-- Event Modifier Wiring — Phase 5
--
-- Wire event_modifiers on permits that were seeded with empty {}
-- but have corresponding event templates in the corp-tick processor.
--
-- When a corp holds a permit with event_modifiers, the tick processor
-- multiplies the event's base probability by the modifier value.
-- e.g. {"grid_integration_failure": 0.3} = 70% probability reduction.
--
-- Also fixes pre-existing key mismatch: air_quality permit references
-- "local_community_opposition" but event template is "community_opposition".
-- ════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════
-- NEW PERMITS: Wire event_modifiers
-- ═══════════════════════════════════════════════════

-- Renewable Energy: grid integration failure reduced by 70%
UPDATE construction_permits
SET event_modifiers = '{"grid_integration_failure": 0.3}'::jsonb
WHERE permit_key = 'renewable_energy';

-- Telecom Infrastructure: signal interference reduced by 70%
UPDATE construction_permits
SET event_modifiers = '{"signal_interference": 0.3}'::jsonb
WHERE permit_key = 'telecom_infrastructure';

-- Agricultural Land Conversion: illegal land clearing reduced by 80%
UPDATE construction_permits
SET event_modifiers = '{"illegal_land_clearing": 0.2}'::jsonb
WHERE permit_key = 'agri_land_conversion';

-- Foreign Investment Clearance: foreign influence scandal reduced by 70%
UPDATE construction_permits
SET event_modifiers = '{"foreign_influence_scandal": 0.3}'::jsonb
WHERE permit_key = 'foreign_investment_clearance';

-- Local Workforce Quota: labor exploitation reduced by 70%
UPDATE construction_permits
SET event_modifiers = '{"labor_exploitation": 0.3}'::jsonb
WHERE permit_key = 'local_workforce';

-- Apprenticeship & Training: skills shortage reduced by 60%
UPDATE construction_permits
SET event_modifiers = '{"skills_shortage": 0.4}'::jsonb
WHERE permit_key = 'apprenticeship_training';

-- Community Consultation: community protest blockade reduced by 80%
UPDATE construction_permits
SET event_modifiers = '{"community_protest_blockade": 0.2}'::jsonb
WHERE permit_key = 'community_consultation';

-- Public Accessibility: accessibility lawsuit reduced by 70%
UPDATE construction_permits
SET event_modifiers = '{"accessibility_lawsuit": 0.3}'::jsonb
WHERE permit_key = 'public_accessibility';


-- ═══════════════════════════════════════════════════
-- FIX PRE-EXISTING: air_quality key mismatch
-- Event template is "community_opposition" not "local_community_opposition"
-- Add the correct key alongside the legacy one
-- ═══════════════════════════════════════════════════

UPDATE construction_permits
SET event_modifiers = '{"local_community_opposition": 0.7, "community_opposition": 0.7, "noise_complaint_shutdown": 0.8}'::jsonb
WHERE permit_key = 'air_quality';
