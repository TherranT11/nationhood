-- 20260912_vola_culture_decimal_and_invest.sql
--
-- Promote national_vola_culture from SMALLINT to NUMERIC(5,1) so the
-- 3% per-tick decay can produce fractional values like 22.6 → 21.9 →
-- 21.3 instead of crushing to integers each tick (which made small
-- cultures decay in jumps and tiny investments wash out).
--
-- The CHECK constraint stays the same — NUMERIC happily evaluates
-- BETWEEN 0 AND 100 against decimal values.
--
-- Idempotent: ALTER COLUMN ... TYPE on a column already at NUMERIC(5,1)
-- is a no-op when the target type matches.

BEGIN;

ALTER TABLE public.nations
    ALTER COLUMN national_vola_culture TYPE NUMERIC(5,1) USING national_vola_culture::NUMERIC(5,1);

COMMENT ON COLUMN public.nations.national_vola_culture IS
    'Hidden Vola Program engagement, 0.0-100.0 (NUMERIC(5,1)). Decays 3% per tick toward 0; raised by Sports Minister "Invest in National Sports Culture" action ($2M/$5M/$8M for +3/+5/+7).';

NOTIFY pgrst, 'reload schema';

COMMIT;
