-- Add `branch` column to factions so military factions can identify which
-- service they belong to (army / navy / air_force). Party and corporation
-- rows leave the column NULL.
--
-- Uniqueness: each (nation_id, branch) pair can be held by at most one
-- active player. Enforced with a partial unique index that ignores rows
-- with NULL branch (parties, corps) and rows where the faction has been
-- abandoned. Abandoning your army frees the slot for the next player.
--
-- RLS: also fills a long-standing gap in the factions INSERT policy
-- chain. The existing "Factions insert own" policy (20260302) only
-- permits primary inserts (id = auth.uid()). When a user who already
-- holds a primary faction (party or corp) joins a military branch,
-- the new row uses id = gen_random_uuid() with linked_user_id =
-- auth.uid() — the linked-faction pattern. Without a matching INSERT
-- policy that pattern is rejected. This new policy mirrors the
-- existing "Users can update linked factions" UPDATE policy added
-- in 20260328_linked_user_id.sql. It also unblocks the same linked-
-- corp insert path in corp-nation-select.html, which was structurally
-- broken under the prior policy set.

ALTER TABLE factions
  ADD COLUMN IF NOT EXISTS branch text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_factions_branch_per_nation
  ON factions (nation_id, branch)
  WHERE branch IS NOT NULL AND abandoned_at IS NULL;

DROP POLICY IF EXISTS "Factions insert linked" ON factions;
CREATE POLICY "Factions insert linked"
  ON factions FOR INSERT TO authenticated
  WITH CHECK (linked_user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
