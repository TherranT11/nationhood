-- =========================================================================
-- Sector Dynamic Weights — Phase 1
--
-- Each sector's weight is derived from one or two nation stats, recomputed
-- when an election fires. Per-sector range stays 1–3 (so existing UI/math
-- doesn't break); nation-total target 24–28; soft-cap at 28.
--
-- Storage: two new TEXT columns on `sectors` carrying the stat keys.
-- A trailing `_inverse` suffix means "use 100 - stat_value" (e.g. Rural &
-- Agricultural's secondary is `urbanization_inverse` — high urbanization
-- means a smaller rural sector).
--
-- The engine pulls the stat value from `nations.<key>` (or `100 - <key>`)
-- and applies a stepped formula (≥65→3, 35-65→2, <35→1). Two-stat sectors
-- weight primary 70% / secondary 30% before stepping. Soft-cap to 28
-- proportionally if the raw sum exceeds it.
--
-- Seed values are mapped to the 12 default sector_keys. Custom sectors
-- (added via admin UI) start with NULL stats and stay at their manual
-- weight until an admin assigns mappings.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + UPDATE … WHERE primary_stat IS
-- NULL guards prevent re-runs from overwriting any operator-edited
-- mappings.
-- =========================================================================

ALTER TABLE sectors ADD COLUMN IF NOT EXISTS primary_stat TEXT;
ALTER TABLE sectors ADD COLUMN IF NOT EXISTS secondary_stat TEXT;

-- Backfill default mappings for the 12 seed sector_keys. Skips any rows
-- where an operator has already set primary_stat (so re-running this
-- migration doesn't clobber custom assignments).
UPDATE sectors SET primary_stat = 'median_age',          secondary_stat = 'lifespan'              WHERE sector_key = 'RETIREES_PENSIONERS'           AND primary_stat IS NULL;
UPDATE sectors SET primary_stat = 'religious',           secondary_stat = NULL                    WHERE sector_key = 'RELIGIOUS_CONSERVATIVES'       AND primary_stat IS NULL;
UPDATE sectors SET primary_stat = 'urbanization',        secondary_stat = 'unemployment'          WHERE sector_key = 'SERVICE_GIG_WORKERS'           AND primary_stat IS NULL;
UPDATE sectors SET primary_stat = 'urbanization',        secondary_stat = 'higher_education'      WHERE sector_key = 'URBAN_PROFESSIONALS'           AND primary_stat IS NULL;
UPDATE sectors SET primary_stat = 'manufacturing_output',secondary_stat = 'unemployment'          WHERE sector_key = 'SKILLED_TRADES_MANUFACTURING'  AND primary_stat IS NULL;
UPDATE sectors SET primary_stat = 'arable_land',         secondary_stat = 'urbanization_inverse'  WHERE sector_key = 'RURAL_AGRICULTURAL'            AND primary_stat IS NULL;
UPDATE sectors SET primary_stat = 'immigration',         secondary_stat = 'ethnic_diversity'      WHERE sector_key = 'IMMIGRANT_MINORITY_COMMUNITIES'AND primary_stat IS NULL;
UPDATE sectors SET primary_stat = 'median_age_inverse',  secondary_stat = 'higher_education'      WHERE sector_key = 'STUDENTS_YOUNG_PRECARIAT'      AND primary_stat IS NULL;
UPDATE sectors SET primary_stat = 'gdp_growth',          secondary_stat = 'corporate_tax_inverse' WHERE sector_key = 'SMALL_BUSINESS_OWNERS'         AND primary_stat IS NULL;
UPDATE sectors SET primary_stat = 'income_inequality',   secondary_stat = 'corporate_tax_inverse' WHERE sector_key = 'CAPITAL_OWNERS_EXECUTIVES'     AND primary_stat IS NULL;
UPDATE sectors SET primary_stat = 'digital_infrastructure',secondary_stat = 'higher_education'    WHERE sector_key = 'TECH_ENGINEERING_CLASS'        AND primary_stat IS NULL;
UPDATE sectors SET primary_stat = 'press_freedom',       secondary_stat = 'freedom_index'         WHERE sector_key = 'CULTURAL_PRODUCERS'            AND primary_stat IS NULL;

-- Update the seed function so new nations get the same defaults baked in.
CREATE OR REPLACE FUNCTION seed_default_sectors(p_nation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO sectors (nation_id, sector_key, name, description, weight, base_turnout, is_default, is_active, display_order, primary_stat, secondary_stat)
    VALUES
        (p_nation_id, 'RETIREES_PENSIONERS',            'Retirees & Pensioners',                                    '', 1, 1.00, true, true,  1, 'median_age',           'lifespan'),
        (p_nation_id, 'RELIGIOUS_CONSERVATIVES',        'Religious Conservatives',                                  '', 1, 1.00, true, true,  2, 'religious',            NULL),
        (p_nation_id, 'SERVICE_GIG_WORKERS',            'Service & Gig Workers',                                    '', 1, 1.00, true, true,  3, 'urbanization',         'unemployment'),
        (p_nation_id, 'URBAN_PROFESSIONALS',            'Urban Professionals',                                      '', 1, 1.00, true, true,  4, 'urbanization',         'higher_education'),
        (p_nation_id, 'SKILLED_TRADES_MANUFACTURING',   'Skilled Trades & Manufacturing',                           '', 1, 1.00, true, true,  5, 'manufacturing_output', 'unemployment'),
        (p_nation_id, 'RURAL_AGRICULTURAL',             'Rural & Agricultural',                                     '', 1, 1.00, true, true,  6, 'arable_land',          'urbanization_inverse'),
        (p_nation_id, 'IMMIGRANT_MINORITY_COMMUNITIES', 'Immigrant & Minority Communities',                         '', 1, 1.00, true, true,  7, 'immigration',          'ethnic_diversity'),
        (p_nation_id, 'STUDENTS_YOUNG_PRECARIAT',       'Students & Young Precariat',                               '', 1, 1.00, true, true,  8, 'median_age_inverse',   'higher_education'),
        (p_nation_id, 'SMALL_BUSINESS_OWNERS',          'Small Business Owners',                                    '', 1, 1.00, true, true,  9, 'gdp_growth',           'corporate_tax_inverse'),
        (p_nation_id, 'CAPITAL_OWNERS_EXECUTIVES',      'Capital Owners / Executives',                              '', 1, 1.00, true, true, 10, 'income_inequality',    'corporate_tax_inverse'),
        (p_nation_id, 'TECH_ENGINEERING_CLASS',         'Tech & Engineering Class',                                 '', 1, 1.00, true, true, 11, 'digital_infrastructure','higher_education'),
        (p_nation_id, 'CULTURAL_PRODUCERS',             'Cultural Producers (media, academia, arts, nonprofits)',   '', 1, 1.00, true, true, 12, 'press_freedom',        'freedom_index')
    ON CONFLICT (nation_id, sector_key) DO NOTHING;
END;
$$;

-- Verify: every default sector across every nation should now carry a
-- primary_stat. Custom sectors (is_default=false) are allowed to be NULL.
SELECT n.name AS nation, s.name AS sector, s.primary_stat, s.secondary_stat
FROM sectors s
JOIN nations n ON n.id = s.nation_id
WHERE s.is_default = true
  AND s.primary_stat IS NULL
ORDER BY n.name, s.display_order;
