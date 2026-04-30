-- =========================================================================
-- ALPHA STATS REFACTOR — Phase 6: sector stat remap
--
-- The 12 default sectors had their primary/secondary stat keys pointing
-- at columns that are now either renamed or deleted by the alpha
-- refactor. Phase 6 rewires every sector to the 19-column schema.
--
-- Three pieces:
--
--   1. Per-sector UPDATEs for the 12 defaults — thoughtful re-mapping
--      that preserves each sector's voter-identity (Retirees still
--      cluster around healthcare, Tech still on infrastructure +
--      education, etc.). Sectors that previously anchored on deleted
--      stats (religious, median_age, press_freedom, freedom_index,
--      ethnic_diversity, corporate_tax) get new conceptual anchors
--      drawn from the alpha-19 menu.
--
--   2. Auto-translation for any custom (is_default=false) sectors via
--      alpha_translate_sector_stat() — handles plain renames, the
--      `_inverse` suffix convention, and routes deleted-stat anchors
--      to NULL. The dynamic-weight engine (sectors.js:142) already
--      treats NULL primary_stat as "leave weight alone", so deleted-
--      anchor customs stay at their last manual weight until an admin
--      re-anchors them.
--
--   3. seed_default_sectors() recreated with the new mappings so any
--      newly-created nation gets the alpha-schema sectors from day 1.
--
-- Idempotent. Safe to re-run.
-- =========================================================================

BEGIN;

-- ── Helper: translate a sector primary/secondary key, honoring the
-- `_inverse` suffix. Returns NULL for deleted-with-no-replacement
-- stats; the engine treats those as "no anchor".
CREATE OR REPLACE FUNCTION alpha_translate_sector_stat(p_old_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    v_inverse    BOOLEAN;
    v_base       TEXT;
    v_translated TEXT;
BEGIN
    IF p_old_key IS NULL OR p_old_key = '' THEN
        RETURN NULL;
    END IF;

    v_inverse := right(p_old_key, 8) = '_inverse';
    IF v_inverse THEN
        v_base := substring(p_old_key FROM 1 FOR length(p_old_key) - 8);
    ELSE
        v_base := p_old_key;
    END IF;

    v_translated := alpha_translate_stat_key(v_base);
    IF v_translated IS NULL THEN
        RETURN NULL;  -- underlying stat is deleted; sector loses this anchor
    END IF;

    IF v_inverse THEN
        RETURN v_translated || '_inverse';
    ELSE
        RETURN v_translated;
    END IF;
END;
$$;

-- ── Step 1: hand-curated re-mapping for the 12 default sectors.
-- Each pair preserves the sector's voter-identity while drawing
-- exclusively from the alpha-19 menu.
UPDATE sectors SET primary_stat = 'health',           secondary_stat = 'cost_of_living_inverse' WHERE sector_key = 'RETIREES_PENSIONERS';
UPDATE sectors SET primary_stat = 'authority',        secondary_stat = 'education_inverse'      WHERE sector_key = 'RELIGIOUS_CONSERVATIVES';
UPDATE sectors SET primary_stat = 'workforce',        secondary_stat = 'cost_of_living'         WHERE sector_key = 'SERVICE_GIG_WORKERS';
UPDATE sectors SET primary_stat = 'education',        secondary_stat = 'workforce'              WHERE sector_key = 'URBAN_PROFESSIONALS';
UPDATE sectors SET primary_stat = 'industry',         secondary_stat = 'workforce'              WHERE sector_key = 'SKILLED_TRADES_MANUFACTURING';
UPDATE sectors SET primary_stat = 'farmland',         secondary_stat = 'workforce_inverse'      WHERE sector_key = 'RURAL_AGRICULTURAL';
UPDATE sectors SET primary_stat = 'immigration',      secondary_stat = 'standard_of_living'     WHERE sector_key = 'IMMIGRANT_MINORITY_COMMUNITIES';
UPDATE sectors SET primary_stat = 'education',        secondary_stat = 'cost_of_living'         WHERE sector_key = 'STUDENTS_YOUNG_PRECARIAT';
UPDATE sectors SET primary_stat = 'gdp_growth',       secondary_stat = 'goods'                  WHERE sector_key = 'SMALL_BUSINESS_OWNERS';
UPDATE sectors SET primary_stat = 'budget',           secondary_stat = 'gdp_growth'             WHERE sector_key = 'CAPITAL_OWNERS_EXECUTIVES';
UPDATE sectors SET primary_stat = 'infrastructure',   secondary_stat = 'education'              WHERE sector_key = 'TECH_ENGINEERING_CLASS';
UPDATE sectors SET primary_stat = 'authority_inverse',secondary_stat = 'education'              WHERE sector_key = 'CULTURAL_PRODUCERS';

-- ── Step 2: auto-translate any custom (non-default) sectors. Handles
-- plain renames + `_inverse` suffix + null-routes for deleted anchors.
UPDATE sectors
SET primary_stat   = alpha_translate_sector_stat(primary_stat),
    secondary_stat = alpha_translate_sector_stat(secondary_stat)
WHERE is_default = false
  AND (primary_stat IS NOT NULL OR secondary_stat IS NOT NULL);

-- ── Step 3: recreate seed_default_sectors() with the new mappings
-- so newly-seeded nations get alpha-schema sectors from day 1.
CREATE OR REPLACE FUNCTION seed_default_sectors(p_nation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO sectors (nation_id, sector_key, name, description, weight, base_turnout, is_default, is_active, display_order, primary_stat, secondary_stat)
    VALUES
        (p_nation_id, 'RETIREES_PENSIONERS',            'Retirees & Pensioners',                                    '', 1, 0.70, true, true,  1, 'health',              'cost_of_living_inverse'),
        (p_nation_id, 'RELIGIOUS_CONSERVATIVES',        'Religious Conservatives',                                  '', 1, 0.70, true, true,  2, 'authority',           'education_inverse'),
        (p_nation_id, 'SERVICE_GIG_WORKERS',            'Service & Gig Workers',                                    '', 1, 0.70, true, true,  3, 'workforce',           'cost_of_living'),
        (p_nation_id, 'URBAN_PROFESSIONALS',            'Urban Professionals',                                      '', 1, 0.70, true, true,  4, 'education',           'workforce'),
        (p_nation_id, 'SKILLED_TRADES_MANUFACTURING',   'Skilled Trades & Manufacturing',                           '', 1, 0.70, true, true,  5, 'industry',            'workforce'),
        (p_nation_id, 'RURAL_AGRICULTURAL',             'Rural & Agricultural',                                     '', 1, 0.70, true, true,  6, 'farmland',            'workforce_inverse'),
        (p_nation_id, 'IMMIGRANT_MINORITY_COMMUNITIES', 'Immigrant & Minority Communities',                         '', 1, 0.70, true, true,  7, 'immigration',         'standard_of_living'),
        (p_nation_id, 'STUDENTS_YOUNG_PRECARIAT',       'Students & Young Precariat',                               '', 1, 0.70, true, true,  8, 'education',           'cost_of_living'),
        (p_nation_id, 'SMALL_BUSINESS_OWNERS',          'Small Business Owners',                                    '', 1, 0.70, true, true,  9, 'gdp_growth',          'goods'),
        (p_nation_id, 'CAPITAL_OWNERS_EXECUTIVES',      'Capital Owners / Executives',                              '', 1, 0.70, true, true, 10, 'budget',              'gdp_growth'),
        (p_nation_id, 'TECH_ENGINEERING_CLASS',         'Tech & Engineering Class',                                 '', 1, 0.70, true, true, 11, 'infrastructure',      'education'),
        (p_nation_id, 'CULTURAL_PRODUCERS',             'Cultural Producers (media, academia, arts, nonprofits)',   '', 1, 0.70, true, true, 12, 'authority_inverse',   'education')
    ON CONFLICT (nation_id, sector_key) DO NOTHING;
END;
$$;

COMMIT;

-- =========================================================================
-- Verification — every default sector across every nation should now
-- have a primary_stat in the alpha-19 menu (with optional `_inverse`
-- suffix). Non-default sectors with NULL anchors are expected when
-- their original anchor stat got deleted with no replacement; admins
-- can re-anchor those via the admin Sectors UI.
-- =========================================================================
SELECT n.name AS nation, s.sector_key, s.primary_stat, s.secondary_stat
FROM sectors s
JOIN nations n ON n.id = s.nation_id
WHERE s.is_default = true
ORDER BY n.name, s.display_order;
