-- Add scaling_type column to ministry_institution_config
-- Values: 'population' (base_cost_per_capita × population) or 'gdp' (base_cost_per_capita × GDP as %)
ALTER TABLE ministry_institution_config
    ADD COLUMN IF NOT EXISTS scaling_type TEXT NOT NULL DEFAULT 'population';
