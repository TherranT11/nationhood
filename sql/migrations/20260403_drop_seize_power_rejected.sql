-- Drop dead-state column: seize_power_rejected was added in
-- 20260323_authoritarian_foundational_laws.sql but is never read or written
-- by any JS, TS, or HTML code in the codebase. Removing to avoid confusion.
ALTER TABLE nations DROP COLUMN IF EXISTS seize_power_rejected;
