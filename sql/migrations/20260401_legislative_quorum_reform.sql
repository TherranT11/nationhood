-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: Legislative Quorum Reform Act
-- Date: 2026-04-01
--
-- Adds tracking columns for the Legislative Quorum Reform foundational law.
-- When active, the quorum threshold for standard bills drops from 50% to the
-- chosen value (40%, 30%, or 25%).
-- ════════════════════════════════════════════════════════════════════════════════

-- Nation flag: custom quorum percentage (0 = not active / use default 50%)
ALTER TABLE nations ADD COLUMN IF NOT EXISTS legislative_quorum_override INT DEFAULT 0;

-- Bill proposal field: the chosen quorum percentage (40, 30, or 25)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_legislative_quorum_override INT DEFAULT NULL;
