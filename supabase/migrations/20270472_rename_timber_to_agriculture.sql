-- Rename the 'timber' industry to 'agriculture' on nation_industry_bases.
--
-- politician-economy.html's industry list renamed Timber & Forestry to
-- Agriculture & Foodstuffs (different name, different blurb, different
-- trade asset — Foodstuffs giving +2 Food + +2 Food Generation instead
-- of Lumber giving +2 Goods Generation).
--
-- The internal industry key changed from 'timber' to 'agriculture'.
-- nation_industry_bases.industry_key (seeded with 'timber' in
-- 20270410_nation_industry_bases.sql) is the only persisted reference
-- to that key — the column has no CHECK constraint enumerating values,
-- so a one-shot UPDATE swaps the existing rows over.
--
-- Idempotent: skips the UPDATE if 'agriculture' rows already exist
-- (re-run safe).

BEGIN;

UPDATE nation_industry_bases
   SET industry_key = 'agriculture'
 WHERE industry_key = 'timber'
   AND NOT EXISTS (
       SELECT 1 FROM nation_industry_bases nib
        WHERE nib.nation_id = nation_industry_bases.nation_id
          AND nib.industry_key = 'agriculture'
   );

NOTIFY pgrst, 'reload schema';

COMMIT;
