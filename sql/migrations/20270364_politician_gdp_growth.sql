-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN-SIDE GDP GROWTH — new dedicated column
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds politician_gdp_growth to nations as a 0-100 score that drives the GDP
-- Growth tier flavor under National Characteristics on politician-nation.html.
-- The score is rebased from a real-world % rate to a 0-100 band so it composes
-- with the other politician_* 0-100 stats:
--
--   81–100 · Booming        (roughly +4.5% to +7.5%)
--   61–80  · Healthy Growth (roughly +1.5% to +4.5%)
--   41–60  · Stagnant       (roughly -1.5% to +1.5%, straddling zero)
--   21–40  · Recession      (roughly -4.5% to -1.5%)
--    0–20  · Depression     (roughly -7.5% or worse)
--
-- Default 50 puts new nations in the middle of Stagnant. Hajjara is seeded
-- to 68 (Healthy Growth) — a sustainable expansion that matches its
-- 441B GDP / 126B budget profile.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE nations
    ADD COLUMN IF NOT EXISTS politician_gdp_growth INT NOT NULL DEFAULT 50;

COMMENT ON COLUMN nations.politician_gdp_growth IS
    '0-100 GDP growth score on the politician nation page. Five tiers: Booming (81-100), Healthy Growth (61-80), Stagnant (41-60), Recession (21-40), Depression (0-20).';

UPDATE nations
   SET politician_gdp_growth = 68
 WHERE LOWER(name) = 'hajjara';

COMMIT;
