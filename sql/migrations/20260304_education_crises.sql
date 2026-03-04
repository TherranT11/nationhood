-- Insert the 6 Education ministry crises into the crisis system.
-- These are crisis_type='ministry' crises that activate based on institution
-- funding levels rather than nation stat thresholds.
--
-- Activation: ALL institutions in institution_ids must be funded below funding_threshold_pct
-- Recovery: ALL institutions in institution_ids must be funded at or above recovery_threshold_pct

-- Use a DO block with variables so we can reference template IDs for effects
DO $$
DECLARE
    v_id UUID;
BEGIN

-- 1. Classroom Collapse (SEVERE)
-- Trigger: primary_schools < 40% funding
-- Recovery: primary_schools >= 60% funding
INSERT INTO crisis_templates (name, description, is_active, crisis_type, fiscal_category, funding_threshold_pct, recovery_threshold_pct, institution_ids)
VALUES (
    'Classroom Collapse',
    'Overcrowded classrooms, teacher walkouts, schools running triple shifts. Parents pulling kids out. Literacy rates visibly declining.',
    true, 'ministry', 'Education', 40, 60,
    '["primary_schools"]'::jsonb
) RETURNING id INTO v_id;

INSERT INTO crisis_effects (crisis_id, target, stat_key, minister_key, change_per_tick, stat_floor) VALUES
    (v_id, 'nation', 'literacy', NULL, -0.8, 5),
    (v_id, 'nation', 'education_accessibility', NULL, -1, 5),
    (v_id, 'nation', 'happiness', NULL, -1, 5),
    (v_id, 'minister_approval', NULL, 'education', -8, 5);


-- 2. Brain Drain Exodus (SEVERE)
-- Trigger: universities < 40% funding
-- Recovery: universities >= 60% funding
INSERT INTO crisis_templates (name, description, is_active, crisis_type, fiscal_category, funding_threshold_pct, recovery_threshold_pct, institution_ids)
VALUES (
    'Brain Drain Exodus',
    'Top professors accepting offers abroad. Research labs shuttering. International rankings plummet. Graduate students fleeing.',
    true, 'ministry', 'Education', 40, 60,
    '["universities"]'::jsonb
) RETURNING id INTO v_id;

INSERT INTO crisis_effects (crisis_id, target, stat_key, minister_key, change_per_tick, stat_floor) VALUES
    (v_id, 'nation', 'higher_education', NULL, -0.8, 5),
    (v_id, 'nation', 'academic_immigration', NULL, -1.5, 5),
    (v_id, 'nation', 'international_reputation', NULL, -0.3, 5),
    (v_id, 'minister_approval', NULL, 'education', -6, 5);


-- 3. Skilled Trades Shortage (SEVERE)
-- Trigger: vocational < 40% funding
-- Recovery: vocational >= 60% funding
INSERT INTO crisis_templates (name, description, is_active, crisis_type, fiscal_category, funding_threshold_pct, recovery_threshold_pct, institution_ids)
VALUES (
    'Skilled Trades Shortage',
    'Can''t find electricians, plumbers, welders, machinists. Infrastructure projects stalling. Factories can''t hire. Construction costs skyrocketing.',
    true, 'ministry', 'Education', 40, 60,
    '["vocational"]'::jsonb
) RETURNING id INTO v_id;

INSERT INTO crisis_effects (crisis_id, target, stat_key, minister_key, change_per_tick, stat_floor) VALUES
    (v_id, 'nation', 'unemployment', NULL, 1, NULL),
    (v_id, 'nation', 'labor_force_participation', NULL, -0.5, 5),
    (v_id, 'nation', 'physical_infrastructure', NULL, -0.3, 5),
    (v_id, 'minister_approval', NULL, 'education', -5, 5);


-- 4. Education System Failure (CRITICAL)
-- Trigger: primary_schools AND universities both < 50% funding
-- Recovery: both >= 70% funding
INSERT INTO crisis_templates (name, description, is_active, crisis_type, fiscal_category, funding_threshold_pct, recovery_threshold_pct, institution_ids)
VALUES (
    'Education System Failure',
    'The pipeline is broken at both ends. Kids aren''t learning in school. Universities are hollowed out. International observers comparing you to failed states.',
    true, 'ministry', 'Education', 50, 70,
    '["primary_schools", "universities"]'::jsonb
) RETURNING id INTO v_id;

INSERT INTO crisis_effects (crisis_id, target, stat_key, minister_key, change_per_tick, stat_floor) VALUES
    (v_id, 'nation', 'literacy', NULL, -1.5, 5),
    (v_id, 'nation', 'higher_education', NULL, -1, 5),
    (v_id, 'nation', 'international_reputation', NULL, -1, 5),
    (v_id, 'nation', 'happiness', NULL, -1.5, 5),
    (v_id, 'minister_approval', NULL, 'education', -15, 5);


-- 5. Lost Generation (CRITICAL)
-- Trigger: primary_schools AND vocational both < 50% funding
-- Recovery: both >= 70% funding
INSERT INTO crisis_templates (name, description, is_active, crisis_type, fiscal_category, funding_threshold_pct, recovery_threshold_pct, institution_ids)
VALUES (
    'Lost Generation',
    'Kids aren''t learning AND there''s no alternative path. No school, no trades, no skills. Youth unemployment explodes. An entire generation with nothing to do.',
    true, 'ministry', 'Education', 50, 70,
    '["primary_schools", "vocational"]'::jsonb
) RETURNING id INTO v_id;

INSERT INTO crisis_effects (crisis_id, target, stat_key, minister_key, change_per_tick, stat_floor) VALUES
    (v_id, 'nation', 'unemployment', NULL, 1.5, NULL),
    (v_id, 'nation', 'crime_rate', NULL, 1, NULL),
    (v_id, 'nation', 'civil_unrest', NULL, 1, NULL),
    (v_id, 'nation', 'happiness', NULL, -1.5, 5),
    (v_id, 'minister_approval', NULL, 'education', -12, 5);


-- 6. Skills Gap Catastrophe (CRITICAL)
-- Trigger: universities AND vocational both < 50% funding
-- Recovery: both >= 70% funding
INSERT INTO crisis_templates (name, description, is_active, crisis_type, fiscal_category, funding_threshold_pct, recovery_threshold_pct, institution_ids)
VALUES (
    'Skills Gap Catastrophe',
    'No graduates. No tradespeople. The economy can''t find anyone qualified. Factories relocate abroad. Tech companies stop investing.',
    true, 'ministry', 'Education', 50, 70,
    '["universities", "vocational"]'::jsonb
) RETURNING id INTO v_id;

INSERT INTO crisis_effects (crisis_id, target, stat_key, minister_key, change_per_tick, stat_floor) VALUES
    (v_id, 'nation', 'gdp_growth', NULL, -1, 5),
    (v_id, 'nation', 'foreign_investment', NULL, -1.5, 5),
    (v_id, 'nation', 'unemployment', NULL, 1, NULL),
    (v_id, 'nation', 'labor_force_participation', NULL, -0.5, 5),
    (v_id, 'minister_approval', NULL, 'education', -10, 5);

END $$;
