-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTORS PHASE 2 — sector effects on policies
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds the `sector_effects` column on `policies` so a bill's articles can
-- declare how passing (or failing to pass) the bill should shift faction
-- popularity per sector. Read by processSectorShifts in js/game/bills.js.
--
-- Format (jsonb array):
--   [
--     { "sector_key": "RETIREES_PENSIONERS",   "change_tenths": 20  },  -- +2.0
--     { "sector_key": "CAPITAL_OWNERS_EXECUTIVES", "change_tenths": -15 } -- -1.5
--   ]
--
-- Conventions:
--   * change_tenths is signed (positive = popularity gain on pass).
--   * Magnitude bounds (V3 §6.3) are NOT enforced at the DB level — the
--     authoring UI clamps to ±5 (Universal), ±15 (Moderate), ±30 (Radical).
--     Bills can mix sectors freely; alignment classification is deferred to
--     a later phase.
--   * sector_key references `sectors.sector_key`, which is per-nation. Bills
--     for nations missing the named sector silently no-op for that effect.
--   * Default is an empty array so existing policies stay inert until a
--     human authors effects on them.
--
-- Application model (handled in processSectorShifts, not here):
--   * Pass:     proposer + YES voters get +change_tenths; NO voters get
--               -change_tenths; abstain unaffected. Vote-aligned.
--   * Fail:     proposer gets -change_tenths (full inverse). No other voters
--               affected. Asymmetric — proposer "owns" the failed bill.
--   * Withdraw: no effect.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE policies
    ADD COLUMN IF NOT EXISTS sector_effects jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN policies.sector_effects IS
    'Phase 2: sector popularity deltas applied on bill resolution. Array of {sector_key, change_tenths}. Vote-aligned on pass, sponsor-only inverse on fail (V3 §7.1 + Phase 2 design).';

-- Defensive shape check: every element must have the two required keys.
-- Stored as a constraint rather than a trigger so violations surface at
-- write time and not at read time. NOT VALID skips the existing rows
-- (they're all '[]' from the default, but be explicit).
ALTER TABLE policies
    DROP CONSTRAINT IF EXISTS policies_sector_effects_shape;
ALTER TABLE policies
    ADD CONSTRAINT policies_sector_effects_shape
    CHECK (
        jsonb_typeof(sector_effects) = 'array'
        AND NOT EXISTS (
            SELECT 1
            FROM jsonb_array_elements(sector_effects) AS e
            WHERE jsonb_typeof(e->'sector_key') IS DISTINCT FROM 'string'
               OR jsonb_typeof(e->'change_tenths') IS DISTINCT FROM 'number'
        )
    ) NOT VALID;

COMMIT;
