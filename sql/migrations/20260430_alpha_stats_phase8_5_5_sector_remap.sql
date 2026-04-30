-- =========================================================================
-- ALPHA STATS REFACTOR — Phase 8.5.5: sector remap update
--
-- Phase 8.5.1 renamed three columns (authority → public_approval,
-- goods → service_sector, crime_rate → crime). The Phase 6 sector
-- remap predates those renames, so two default sectors and one
-- secondary anchor still reference the old names. This migration
-- fixes them and re-runs the auto-translator on non-default
-- (custom) sectors so any user-created sectors using the renamed
-- columns get picked up too.
--
--   Religious Conservatives  primary   : authority         → public_approval
--   Cultural Producers       primary   : authority_inverse → public_approval_inverse
--   Small Business Owners    secondary : goods             → service_sector
--
-- alpha_translate_sector_stat() already chains through
-- alpha_translate_stat_key(), which Phase 8.5.2 taught the new
-- aliases — so re-running the non-default translator is idempotent
-- and safe to run repeatedly.
-- =========================================================================

-- ── Step 1: hand-fix the three affected default sectors. ──
UPDATE sectors SET primary_stat   = 'public_approval'
    WHERE sector_key = 'RELIGIOUS_CONSERVATIVES'
      AND primary_stat = 'authority';

UPDATE sectors SET primary_stat   = 'public_approval_inverse'
    WHERE sector_key = 'CULTURAL_PRODUCERS'
      AND primary_stat = 'authority_inverse';

UPDATE sectors SET secondary_stat = 'service_sector'
    WHERE sector_key = 'SMALL_BUSINESS_OWNERS'
      AND secondary_stat = 'goods';

-- ── Step 2: re-translate any non-default (custom) sectors so user-
-- created sectors using authority / goods / crime_rate (or their
-- _inverse variants) pick up the Phase 8.5.2 aliases.
UPDATE sectors
SET primary_stat   = alpha_translate_sector_stat(primary_stat),
    secondary_stat = alpha_translate_sector_stat(secondary_stat)
WHERE is_default = false
  AND (primary_stat IS NOT NULL OR secondary_stat IS NOT NULL);

-- ── Step 3: replace seed_default_sectors() so newly-seeded nations
-- get the alpha-23 column names from day 1.
CREATE OR REPLACE FUNCTION seed_default_sectors(p_nation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO sectors (nation_id, sector_key, name, description, weight, base_turnout, is_default, is_active, display_order, primary_stat, secondary_stat)
    VALUES
        (p_nation_id, 'RETIREES_PENSIONERS',            'Retirees & Pensioners',                                    '', 1, 0.70, true, true,  1, 'health',                  'cost_of_living_inverse'),
        (p_nation_id, 'RELIGIOUS_CONSERVATIVES',        'Religious Conservatives',                                  '', 1, 0.70, true, true,  2, 'public_approval',         'education_inverse'),
        (p_nation_id, 'SERVICE_GIG_WORKERS',            'Service & Gig Workers',                                    '', 1, 0.70, true, true,  3, 'workforce',               'cost_of_living'),
        (p_nation_id, 'URBAN_PROFESSIONALS',            'Urban Professionals',                                      '', 1, 0.70, true, true,  4, 'education',               'workforce'),
        (p_nation_id, 'SKILLED_TRADES_MANUFACTURING',   'Skilled Trades & Manufacturing',                           '', 1, 0.70, true, true,  5, 'industry',                'workforce'),
        (p_nation_id, 'RURAL_AGRICULTURAL',             'Rural & Agricultural',                                     '', 1, 0.70, true, true,  6, 'farmland',                'workforce_inverse'),
        (p_nation_id, 'IMMIGRANT_MINORITY_COMMUNITIES', 'Immigrant & Minority Communities',                         '', 1, 0.70, true, true,  7, 'immigration',             'standard_of_living'),
        (p_nation_id, 'STUDENTS_YOUNG_PRECARIAT',       'Students & Young Precariat',                               '', 1, 0.70, true, true,  8, 'education',               'cost_of_living'),
        (p_nation_id, 'SMALL_BUSINESS_OWNERS',          'Small Business Owners',                                    '', 1, 0.70, true, true,  9, 'gdp_growth',              'service_sector'),
        (p_nation_id, 'CAPITAL_OWNERS_EXECUTIVES',      'Capital Owners / Executives',                              '', 1, 0.70, true, true, 10, 'budget',                  'gdp_growth'),
        (p_nation_id, 'TECH_ENGINEERING_CLASS',         'Tech & Engineering Class',                                 '', 1, 0.70, true, true, 11, 'infrastructure',          'education'),
        (p_nation_id, 'CULTURAL_PRODUCERS',             'Cultural Producers (media, academia, arts, nonprofits)',   '', 1, 0.70, true, true, 12, 'public_approval_inverse', 'education')
    ON CONFLICT (nation_id, sector_key) DO NOTHING;
END;
$$;

-- =========================================================================
-- Spot-check: which default-sector anchors still reference renamed
-- columns? Should return zero rows after this migration.
-- =========================================================================
SELECT sector_key, primary_stat, secondary_stat
FROM sectors
WHERE is_default = true
  AND (primary_stat   IN ('authority', 'authority_inverse', 'goods', 'goods_inverse', 'crime_rate', 'crime_rate_inverse')
    OR secondary_stat IN ('authority', 'authority_inverse', 'goods', 'goods_inverse', 'crime_rate', 'crime_rate_inverse'));
