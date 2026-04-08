-- ════════════════════════════════════════════════════════════════════════════════
-- Migration: Constitutional Amendment Streamlining
-- Date: 2026-04-01
--
-- Lowers the threshold for foundational bills from 67% to 55%.
-- This law itself requires 67% to pass (old rules apply to change the rules).
-- Once active, all future foundational bills only need 55%.
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE nations ADD COLUMN IF NOT EXISTS constitutional_amendment_streamlining BOOLEAN DEFAULT FALSE;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_constitutional_amendment_streamlining BOOLEAN DEFAULT FALSE;
