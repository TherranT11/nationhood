-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTORS PHASE 3 — independent seats column
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds nations.independent_seats — the number of parliament seats held by
-- "Independents" (smaller parties, caucuses, MPs unaffiliated with major
-- parties). Persists across elections; each election rolls 1D10 and applies
-- a delta from the table below, clamped to [0, floor(parliament_size * 0.08)].
--
--   Roll:  1   2   3   4   5   6   7   8   9   10
--   Delta: -6  -5  -4  -3  -2  -1  +1  +2  +3  +4
--
-- Behavior in Phase 3: ghost seats. They reduce the seats available to major
-- parties (the sector-TWP allocator gets parliament_size - independent_seats),
-- but they do NOT vote on bills, count toward quorum, or appear in committees.
-- A future phase will implement voting behavior.
--
-- Player UI plan (deferred): label as "Independents" on the parliament screen,
-- render as white dots in the parliament makeup visual.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE nations
    ADD COLUMN IF NOT EXISTS independent_seats integer NOT NULL DEFAULT 0;

ALTER TABLE nations
    DROP CONSTRAINT IF EXISTS nations_independent_seats_nonneg;
ALTER TABLE nations
    ADD CONSTRAINT nations_independent_seats_nonneg
    CHECK (independent_seats >= 0) NOT VALID;

COMMENT ON COLUMN nations.independent_seats IS
    'Phase 3: parliament seats held by Independents (small parties / caucuses / unaffiliated MPs). Updated each election by a 1D10 roll [-6..-1, +1..+4], clamped to [0, floor(parliament_size * 0.08)]. Ghost seats: reduce major-party allocation, do not vote in Phase 3.';

COMMIT;
