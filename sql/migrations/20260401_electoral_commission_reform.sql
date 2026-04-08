-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: Electoral Commission Reform Act
-- Date: 2026-04-01
--
-- Adds tracking columns for the Electoral Commission Reform foundational law.
-- When active, the ruling coalition gets a random 5-10% seat bonus in
-- parliamentary elections, subtracted proportionally from opposition parties.
-- ════════════════════════════════════════════════════════════════════════════════

-- Nation flag: is this law active?
ALTER TABLE nations ADD COLUMN IF NOT EXISTS electoral_commission_reform BOOLEAN DEFAULT FALSE;

-- Bill proposal field: used when drafting the foundational bill
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_electoral_commission_reform BOOLEAN DEFAULT FALSE;
