-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTORS PHASE 0 — single-sentence descriptions for the 12 default sectors
-- ═══════════════════════════════════════════════════════════════════════════════
-- The original phase 0 migration seeded the 12 defaults with empty descriptions
-- so the admin could fill them in per-nation. In practice every nation wants
-- the same baseline description, so this migration:
--
--   1. Replaces seed_default_sectors() so future nations are seeded WITH
--      descriptions baked in.
--   2. Backfills descriptions on existing default rows that are still empty.
--      Rows where an admin has already typed a custom description are left
--      alone (the WHERE clause checks for empty/whitespace only).
--
-- Each description names WHO the bloc is and WHAT they care about politically,
-- in one sentence, so the same string is meaningful both as admin help-text and
-- as player-facing flavor when the player UI eventually reads it.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION seed_default_sectors(p_nation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO sectors (nation_id, sector_key, name, description, weight, base_turnout, is_default, is_active, display_order)
    VALUES
        (p_nation_id, 'RETIREES_PENSIONERS',           'Retirees & Pensioners',                                    'Older voters living on fixed incomes who prioritize pension stability, healthcare access, and protection of accumulated savings.',                       1, 1.00, true, true,  1),
        (p_nation_id, 'RELIGIOUS_CONSERVATIVES',       'Religious Conservatives',                                  'Faith-driven voters who prioritize traditional family structures, moral order, and the standing of religious institutions in public life.',              1, 1.00, true, true,  2),
        (p_nation_id, 'SERVICE_GIG_WORKERS',           'Service & Gig Workers',                                    'Hourly retail, hospitality, and platform workers focused on minimum wage, scheduling rights, and access to portable benefits.',                          1, 1.00, true, true,  3),
        (p_nation_id, 'URBAN_PROFESSIONALS',           'Urban Professionals',                                      'College-educated salaried workers in cities who care about public services, transit, social tolerance, and a competent administrative state.',           1, 1.00, true, true,  4),
        (p_nation_id, 'SKILLED_TRADES_MANUFACTURING',  'Skilled Trades & Manufacturing',                           'Unionized industrial and construction workers focused on job security, fair trade, apprenticeship pipelines, and industrial policy.',                   1, 1.00, true, true,  5),
        (p_nation_id, 'RURAL_AGRICULTURAL',            'Rural & Agricultural',                                     'Farmers, ranchers, and small-town residents concerned with land use, commodity prices, rural infrastructure, and protection from urban policy overreach.', 1, 1.00, true, true,  6),
        (p_nation_id, 'IMMIGRANT_MINORITY_COMMUNITIES','Immigrant & Minority Communities',                         'First- and second-generation immigrants and ethnic minorities focused on civil rights, family reunification, and equal access to opportunity.',          1, 1.00, true, true,  7),
        (p_nation_id, 'STUDENTS_YOUNG_PRECARIAT',      'Students & Young Precariat',                               'Younger voters in school or unstable early-career work who care about tuition, housing affordability, climate, and entry-level job prospects.',         1, 1.00, true, true,  8),
        (p_nation_id, 'SMALL_BUSINESS_OWNERS',         'Small Business Owners',                                    'Local proprietors and tradespeople worried about taxes, regulation, credit access, and competition from large incumbents.',                              1, 1.00, true, true,  9),
        (p_nation_id, 'CAPITAL_OWNERS_EXECUTIVES',     'Capital Owners / Executives',                              'Wealth holders, investors, and senior executives focused on tax policy, capital mobility, property rights, and a stable business climate.',              1, 1.00, true, true, 10),
        (p_nation_id, 'TECH_ENGINEERING_CLASS',        'Tech & Engineering Class',                                 'High-income knowledge workers in tech, R&D, and engineering who prize talent immigration, R&D funding, and competitive open markets.',                   1, 1.00, true, true, 11),
        (p_nation_id, 'CULTURAL_PRODUCERS',            'Cultural Producers (media, academia, arts, nonprofits)',   'Media workers, academics, artists, and nonprofit staff focused on free expression, public funding for arts and research, and institutional independence.', 1, 1.00, true, true, 12)
    ON CONFLICT (nation_id, sector_key) DO NOTHING;
END;
$$;

-- Backfill existing default rows whose description was never filled in.
-- Custom descriptions an admin has already typed are preserved.
UPDATE sectors s
SET description = src.description,
    updated_at  = now()
FROM (VALUES
    ('RETIREES_PENSIONERS',           'Older voters living on fixed incomes who prioritize pension stability, healthcare access, and protection of accumulated savings.'),
    ('RELIGIOUS_CONSERVATIVES',       'Faith-driven voters who prioritize traditional family structures, moral order, and the standing of religious institutions in public life.'),
    ('SERVICE_GIG_WORKERS',           'Hourly retail, hospitality, and platform workers focused on minimum wage, scheduling rights, and access to portable benefits.'),
    ('URBAN_PROFESSIONALS',           'College-educated salaried workers in cities who care about public services, transit, social tolerance, and a competent administrative state.'),
    ('SKILLED_TRADES_MANUFACTURING',  'Unionized industrial and construction workers focused on job security, fair trade, apprenticeship pipelines, and industrial policy.'),
    ('RURAL_AGRICULTURAL',            'Farmers, ranchers, and small-town residents concerned with land use, commodity prices, rural infrastructure, and protection from urban policy overreach.'),
    ('IMMIGRANT_MINORITY_COMMUNITIES','First- and second-generation immigrants and ethnic minorities focused on civil rights, family reunification, and equal access to opportunity.'),
    ('STUDENTS_YOUNG_PRECARIAT',      'Younger voters in school or unstable early-career work who care about tuition, housing affordability, climate, and entry-level job prospects.'),
    ('SMALL_BUSINESS_OWNERS',         'Local proprietors and tradespeople worried about taxes, regulation, credit access, and competition from large incumbents.'),
    ('CAPITAL_OWNERS_EXECUTIVES',     'Wealth holders, investors, and senior executives focused on tax policy, capital mobility, property rights, and a stable business climate.'),
    ('TECH_ENGINEERING_CLASS',        'High-income knowledge workers in tech, R&D, and engineering who prize talent immigration, R&D funding, and competitive open markets.'),
    ('CULTURAL_PRODUCERS',            'Media workers, academics, artists, and nonprofit staff focused on free expression, public funding for arts and research, and institutional independence.')
) AS src(sector_key, description)
WHERE s.is_default = true
  AND s.sector_key = src.sector_key
  AND (s.description IS NULL OR btrim(s.description) = '');

COMMIT;
