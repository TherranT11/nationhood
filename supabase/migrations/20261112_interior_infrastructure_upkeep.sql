-- Mirror of sql/migrations/20261112_interior_infrastructure_upkeep.sql.
-- Adds upkeep_per_year (1/2/4) to interior_infrastructure_tiers().

BEGIN;

CREATE OR REPLACE FUNCTION public.interior_infrastructure_tiers()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT '{
        "small": {
            "name":            "Local Municipal Complex",
            "post_cost":       2000000,
            "budget":          20000000,
            "timeline":        6,
            "spec_category":   "Light Infrastructure",
            "upkeep_per_year": 1,
            "stat_effects": [
                {"stat": "standard_of_living", "delta": 0.2}
            ]
        },
        "modest": {
            "name":            "Civic Center",
            "post_cost":       5000000,
            "budget":          50000000,
            "timeline":        12,
            "spec_category":   "Heavy Infrastructure",
            "upkeep_per_year": 2,
            "stat_effects": [
                {"stat": "gdp_growth",         "delta": 1.0},
                {"stat": "standard_of_living", "delta": 0.4}
            ]
        },
        "extravagant": {
            "name":            "Provincial Infrastructure",
            "post_cost":       12000000,
            "budget":          120000000,
            "timeline":        24,
            "spec_category":   "Megaproject",
            "upkeep_per_year": 4,
            "stat_effects": [
                {"stat": "gdp_growth",         "delta": 1.5},
                {"stat": "standard_of_living", "delta": 1.5},
                {"stat": "public_approval",    "delta": 0.5}
            ]
        }
    }'::JSONB
$$;

COMMIT;

NOTIFY pgrst, 'reload schema';
