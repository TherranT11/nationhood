-- =========================================================================
-- ALPHA STATS REFACTOR — Phase 8.5.1: schema corrections
--
-- Late-stage column renames + tax-scale conversion. The user's final
-- 23-stat menu differs from the 19 we'd been building toward in three
-- ways:
--
--   1. authority      → public_approval  (rename)
--   2. goods          → service_sector   (rename)
--   3. crime_rate     → crime            (rename)
--
-- Plus three columns we'd marked as deleted (income_tax, corporate_tax,
-- corruption) are restored to the live menu. They're already on the
-- nations table — Phase 8.5.2 brings them back into NATION_STAT_COLUMNS
-- + STAT_KEY_ALIASES + decay config in stats.js.
--
-- This migration also down-scales income_tax / corporate_tax from
-- 0-100 percentages (legacy) to 0-10 stat units (alpha). The new
-- revenue formula in 8.5.4 expects the 0-10 scale.
--
-- Idempotent:
--   * Column renames are gated on `column_name = 'old_name'` so a
--     re-run is a no-op once the column has been renamed.
--   * Tax down-scale is gated on `value > 10` so re-running won't
--     halve already-converted values. Operators who edit a value
--     above 10 between runs will see it down-scaled (intentional —
--     the column is now defined as 0-10).
-- =========================================================================

BEGIN;

-- ── Renames ──────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public'
                 AND table_name = 'nations'
                 AND column_name = 'authority') THEN
        ALTER TABLE nations RENAME COLUMN authority TO public_approval;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public'
                 AND table_name = 'nations'
                 AND column_name = 'goods') THEN
        ALTER TABLE nations RENAME COLUMN goods TO service_sector;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public'
                 AND table_name = 'nations'
                 AND column_name = 'crime_rate') THEN
        ALTER TABLE nations RENAME COLUMN crime_rate TO crime;
    END IF;
END $$;

-- ── Tax scale conversion: 0-100 → 0-10 ───────────────────────────────────
-- Down-scale only values that are still on the legacy 0-100 scale.
-- Already-converted rows (≤10) are left alone, so re-runs are safe.
UPDATE nations
SET income_tax = ROUND(income_tax / 10.0)
WHERE income_tax IS NOT NULL AND income_tax > 10;

UPDATE nations
SET corporate_tax = ROUND(corporate_tax / 10.0)
WHERE corporate_tax IS NOT NULL AND corporate_tax > 10;

-- ── Range CHECK on the new 0-10 tax columns ─────────────────────────────
-- NOT VALID matches the existing pattern (independent_seats, alpha-19
-- range) so the constraint applies to future writes without forcing a
-- full-table validation pass.
ALTER TABLE nations DROP CONSTRAINT IF EXISTS nations_tax_rates_range;
ALTER TABLE nations ADD CONSTRAINT nations_tax_rates_range CHECK (
    (income_tax    IS NULL OR income_tax    BETWEEN 0 AND 10) AND
    (corporate_tax IS NULL OR corporate_tax BETWEEN 0 AND 10)
) NOT VALID;

COMMIT;

-- =========================================================================
-- Verify — every nation should now have:
--   * public_approval / service_sector / crime in place of the old
--     authority / goods / crime_rate columns
--   * income_tax + corporate_tax in 0-10 range
--   * corruption still on the row (unchanged)
-- Spot-check the row totals; anything outside expected ranges is an
-- operator-edit anomaly worth eyeballing.
-- =========================================================================
SELECT
    name,
    public_approval,
    service_sector,
    crime,
    corruption,
    income_tax,
    corporate_tax
FROM nations
ORDER BY name;
