-- Fix faction_bloc_approval rows stuck at seed values (preference_score=40)
-- because the three-pillar engine's update silently failed.
--
-- Affected: Avelian National Party (67bd70f7-1e49-41c4-986b-4634688037a3)
-- Symptom: All voter bloc approvals show 40, ideology_alignment=50, vote_share=0
-- Cause: Silent update failures in three-pillar batch update loop
--
-- This resets stuck values so the next tick's three-pillar calculation
-- will compute fresh preference_scores from the faction's ideology data.

-- Reset stuck rows for ALL factions (not just the known affected one)
-- to catch any other factions with the same issue.
UPDATE faction_bloc_approval
SET
    ideology_alignment = 0,   -- Forces recalculation (default is 50)
    preference_score = 0,     -- Forces recalculation (seed was 40)
    vote_share = 0            -- Forces recalculation
WHERE preference_score = 40
  AND ideology_alignment = 50
  AND (vote_share = 0 OR vote_share IS NULL);
