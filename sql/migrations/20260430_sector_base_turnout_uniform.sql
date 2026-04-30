-- =========================================================================
-- Sector Base Turnout — flat 0.70 default
--
-- The sectors system was seeded with base_turnout = 1.00 for ten of the
-- twelve default sectors (Retirees and Religious Conservatives shipped at
-- 0.70). Operationally we want every sector to start at 0.70 so the
-- TWP math has consistent headroom for stat-driven tuning later.
--
-- This migration:
--   1. Drops the column-level DEFAULT (was 1.00) and resets it to 0.70.
--      Affects future INSERTs that omit the column.
--   2. Backfills every existing sector row to 0.70 (active + inactive,
--      default + custom). Operator-tuned values are clobbered, which is
--      the explicit ask — we want a clean slate.
--   3. Updates seed_default_sectors() so newly-seeded nations get 0.70
--      across the board.
--
-- Idempotent: re-running just rewrites the same value.
-- =========================================================================

ALTER TABLE sectors ALTER COLUMN base_turnout SET DEFAULT 0.70;

UPDATE sectors SET base_turnout = 0.70 WHERE base_turnout IS DISTINCT FROM 0.70;

CREATE OR REPLACE FUNCTION seed_default_sectors(p_nation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO sectors (nation_id, sector_key, name, description, weight, base_turnout, is_default, is_active, display_order, primary_stat, secondary_stat)
    VALUES
        (p_nation_id, 'RETIREES_PENSIONERS',            'Retirees & Pensioners',                                    '', 1, 0.70, true, true,  1, 'median_age',           'lifespan'),
        (p_nation_id, 'RELIGIOUS_CONSERVATIVES',        'Religious Conservatives',                                  '', 1, 0.70, true, true,  2, 'religious',            NULL),
        (p_nation_id, 'SERVICE_GIG_WORKERS',            'Service & Gig Workers',                                    '', 1, 0.70, true, true,  3, 'urbanization',         'unemployment'),
        (p_nation_id, 'URBAN_PROFESSIONALS',            'Urban Professionals',                                      '', 1, 0.70, true, true,  4, 'urbanization',         'higher_education'),
        (p_nation_id, 'SKILLED_TRADES_MANUFACTURING',   'Skilled Trades & Manufacturing',                           '', 1, 0.70, true, true,  5, 'manufacturing_output', 'unemployment'),
        (p_nation_id, 'RURAL_AGRICULTURAL',             'Rural & Agricultural',                                     '', 1, 0.70, true, true,  6, 'arable_land',          'urbanization_inverse'),
        (p_nation_id, 'IMMIGRANT_MINORITY_COMMUNITIES', 'Immigrant & Minority Communities',                         '', 1, 0.70, true, true,  7, 'immigration',          'ethnic_diversity'),
        (p_nation_id, 'STUDENTS_YOUNG_PRECARIAT',       'Students & Young Precariat',                               '', 1, 0.70, true, true,  8, 'median_age_inverse',   'higher_education'),
        (p_nation_id, 'SMALL_BUSINESS_OWNERS',          'Small Business Owners',                                    '', 1, 0.70, true, true,  9, 'gdp_growth',           'corporate_tax_inverse'),
        (p_nation_id, 'CAPITAL_OWNERS_EXECUTIVES',      'Capital Owners / Executives',                              '', 1, 0.70, true, true, 10, 'income_inequality',    'corporate_tax_inverse'),
        (p_nation_id, 'TECH_ENGINEERING_CLASS',         'Tech & Engineering Class',                                 '', 1, 0.70, true, true, 11, 'digital_infrastructure','higher_education'),
        (p_nation_id, 'CULTURAL_PRODUCERS',             'Cultural Producers (media, academia, arts, nonprofits)',   '', 1, 0.70, true, true, 12, 'press_freedom',        'freedom_index')
    ON CONFLICT (nation_id, sector_key) DO NOTHING;
END;
$$;

-- Verify: every row should now read 0.70.
SELECT base_turnout, COUNT(*) AS rows
FROM sectors
GROUP BY base_turnout
ORDER BY base_turnout;
