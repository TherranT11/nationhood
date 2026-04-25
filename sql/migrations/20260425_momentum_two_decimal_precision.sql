-- ============================================================
-- Lock factions.momentum to 2 decimal places via column precision
--
-- Problem: factions.momentum was declared as plain NUMERIC (arbitrary
-- precision), so writes like (existingMomentum + integerDelta) where
-- existingMomentum already carried float noise (e.g., 1.870000000000001
-- from prior dirty writes) propagated that noise indefinitely. UI
-- showed momentum as "1.870000000000001 / 100".
--
-- Fix: ALTER COLUMN to NUMERIC(8,2). PostgreSQL rounds any stored value
-- to 2 decimals on write. Existing dirty values get rounded by this
-- ALTER. Matches the precision already used on faction_bloc_approval.momentum.
--
-- Why not a BEFORE-UPDATE trigger or ROUND() in every writer? The column
-- type IS the invariant — DB enforces it for every writer, every read,
-- every code path, including ones we haven't written yet. SSoT, zero
-- application code, no automation to maintain.
--
-- Range check: momentum is clamped 0-100 by adjust_momentum RPC and
-- matching JS clamps. NUMERIC(8,2) holds up to 999999.99, well above.
--
-- Safe to re-run: ALTER COLUMN TYPE to a type the column already has
-- is a no-op in PostgreSQL.
-- ============================================================

ALTER TABLE factions ALTER COLUMN momentum TYPE NUMERIC(8,2);

-- Verify: every momentum value now has at most 2 decimal places.
-- Expected: 0 rows.
SELECT id, faction_name, momentum
  FROM factions
 WHERE momentum IS NOT NULL
   AND momentum != ROUND(momentum, 2);
