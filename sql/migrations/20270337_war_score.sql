-- ════════════════════════════════════════════════════════════════════
-- WAR SCORE — Conquest Points, +1 per enemy sector seized
-- ════════════════════════════════════════════════════════════════════
-- Each war (a diplomatic_relations pair at relation_type='war') tracks a
-- conquest score per side: +1 every time that nation's forces push the front
-- line one sector into the enemy's territory (combat tick, processCombat).
--   war_score_a = points nation_a has earned (sectors seized from nation_b)
--   war_score_b = points nation_b has earned (sectors seized from nation_a)
-- These accumulate now and will be spent in peace negotiations later. Reset to
-- 0 implicitly when a fresh war starts (setNationsAtWar upserts the row; a brand
-- new pair defaults to 0). Written only by the tick (service role); no client write.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.diplomatic_relations
    ADD COLUMN IF NOT EXISTS war_score_a INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS war_score_b INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.diplomatic_relations.war_score_a IS
    'Conquest Points for nation_a in this war: +1 per sector seized from nation_b. Spent in negotiations.';
COMMENT ON COLUMN public.diplomatic_relations.war_score_b IS
    'Conquest Points for nation_b in this war: +1 per sector seized from nation_a.';

NOTIFY pgrst, 'reload schema';

COMMIT;
