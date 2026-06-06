-- ════════════════════════════════════════════════════════════════════
-- 20270647 — End all active wars
--
-- Resets every diplomatic_relations row currently at relation_type='war'
-- back to neutral and clears the per-war metadata (declaration tick,
-- justification, conquest score). The war system isn't part of the
-- politician build path right now and any rows still marked as war
-- are leftover state — wipe the slate so nothing surfaces unexpectedly.
--
-- relation_score is left alone: it's the hidden friendliness gauge and
-- the war flag is independent of where the score sits.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE public.diplomatic_relations
   SET relation_type        = 'neutral',
       war_declared_at_tick = NULL,
       war_justification    = NULL,
       war_score_a          = 0,
       war_score_b          = 0,
       updated_at           = now()
 WHERE relation_type = 'war';

COMMIT;
