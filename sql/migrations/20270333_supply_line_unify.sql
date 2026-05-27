-- ════════════════════════════════════════════════════════════════════
-- SUPPLY ↔ FRONT-LINE UNIFICATION
-- ════════════════════════════════════════════════════════════════════
-- Supply path is now the distance from a nation's capital to the FRONT LINE
-- (war_fronts.line_position), not a fixed per-army sector — so a supply line
-- lengthens as you push into enemy territory and shortens as you fall back.
-- nation_a's path = line_position; nation_b's = sector_count − line_position.
--
-- That makes armies.current_sector_id redundant (an army's position is the
-- front line of its assigned front), so it's dropped. The front line is
-- initialised at war start (setNationsAtWar); this backfills any land front
-- that doesn't have one yet so supply/combat never read a NULL.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Backfill the front line = the static border (count of sectors nation_a holds),
-- clamped inside the chain so a fresh war doesn't start already decided.
UPDATE war_fronts wf
   SET line_position = LEAST(GREATEST(sub.cnt, 1), GREATEST(COALESCE(wf.sector_count, 0) - 1, 1))
  FROM (
        SELECT ws.front_id, COUNT(*) AS cnt
          FROM war_sectors ws
          JOIN war_fronts f ON f.id = ws.front_id
         WHERE ws.nation_id = f.nation_a_id
         GROUP BY ws.front_id
       ) sub
 WHERE wf.id = sub.front_id
   AND wf.front_type = 'land'
   AND wf.line_position IS NULL;

-- Obsolete: army position is derived from the front line now.
ALTER TABLE public.armies DROP COLUMN IF EXISTS current_sector_id;

NOTIFY pgrst, 'reload schema';

COMMIT;
