-- One-shot cleanup: dissolve orphaned caretaker formations.
--
-- Companion to the elections.js fix (the .maybeSingle() in the
-- election-completion dissolve block threw on >1 matching row, which
-- after an early election is a legitimate state — the just-flipped
-- caretaker plus a prior-cycle leftover. The throw skipped the
-- dissolve, so a caretaker row survived after the follow-up election
-- already resolved and a new government formed. Every reader
-- (laws-page freeze, election status pill) then believed the nation
-- was permanently in caretaker — the Dravka bug.)
--
-- The code change stops new orphans forming. This statement clears
-- the ones already stranded.
--
-- Targeting: a caretaker row is orphaned IFF a newer 'formed'
-- formation exists for the same nation. A *legitimate* caretaker
-- (government fell, election still pending, no new government yet)
-- has NO newer formed row, so the EXISTS filter leaves it untouched.
-- Idempotent — re-running finds nothing once the orphans are cleared.

-- Diagnostic (run first if you want to see what will change):
--   SELECT c.nation_id, n.name, c.id AS caretaker_id, c.formed_at AS caretaker_formed,
--          f.id AS formed_id, f.formed_at AS formed_formed
--   FROM government_formations c
--   JOIN government_formations f
--     ON f.nation_id = c.nation_id
--    AND f.status = 'formed'
--    AND f.formed_at > c.formed_at
--   JOIN nations n ON n.id = c.nation_id
--   WHERE c.status = 'caretaker';

UPDATE government_formations c
SET status = 'dissolved'
WHERE c.status = 'caretaker'
  AND EXISTS (
      SELECT 1
      FROM government_formations f
      WHERE f.nation_id = c.nation_id
        AND f.status = 'formed'
        AND f.formed_at > c.formed_at
  );

NOTIFY pgrst, 'reload schema';
