-- Add 'oil_and_gas' to entrepreneur_corps.industry CHECK constraint.
--
-- Main's oil & gas feature shipped across 20270443 (phase2 schema),
-- 20270446 (phase3a starter roll), and 20270447 (cost SoT fix), but
-- none of them updated entrepreneur_corps_industry_check — last set
-- in 20270213_aviation_manufacturing.sql, which still reads
-- ('construction','banking','shipping','real_estate','airline',
--  'aviation_manufacturing').
--
-- Result: any INSERT into entrepreneur_corps with industry='oil_and_gas'
-- (the founding flow's "Start a Corporation → Oil & Gas" path) fails
-- with "violates check constraint entrepreneur_corps_industry_check".
-- This migration drops + re-adds the constraint with oil_and_gas in
-- the allowed list.
--
-- Constraint rebuild — drop-and-re-add, no data backfill needed
-- (existing rows are by definition in the old set, which is a strict
-- subset of the new set).

BEGIN;

ALTER TABLE entrepreneur_corps
    DROP CONSTRAINT IF EXISTS entrepreneur_corps_industry_check;

ALTER TABLE entrepreneur_corps
    ADD CONSTRAINT entrepreneur_corps_industry_check
    CHECK (industry IN (
        'construction',
        'banking',
        'shipping',
        'real_estate',
        'airline',
        'aviation_manufacturing',
        'oil_and_gas'
    ));

NOTIFY pgrst, 'reload schema';

COMMIT;
