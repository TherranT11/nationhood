-- Fix government_formations that were incorrectly dissolved during government formation.
--
-- Bug: dissolveCoalition() dissolved ALL formations (including the newly-formed one)
-- because it filtered only on nation_id + status, not excluding the new formation.
--
-- This finds the most recent formation per nation that has status 'dissolved' but
-- has no newer 'formed' replacement, and sets it back to 'formed'.
--
-- Run once in the Supabase SQL editor.

-- Specifically fix the known affected Montequilla formation:
UPDATE government_formations
SET status = 'formed'
WHERE id = '8e3abbd0-e2f9-46ce-8978-20cfd3da6203'
  AND status = 'dissolved';
