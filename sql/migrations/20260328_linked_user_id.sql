-- Allow a single user to own multiple factions (party + corporation).
-- linked_user_id bridges a second faction to the same auth user.
-- Primary faction: factions.id = auth.uid() (legacy pattern)
-- Linked faction: factions.linked_user_id = auth.uid()

ALTER TABLE factions ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_factions_linked_user_id ON factions(linked_user_id) WHERE linked_user_id IS NOT NULL;

COMMENT ON COLUMN factions.linked_user_id IS 'Links this faction to a user who owns it as a secondary faction. Primary faction uses id=auth.uid().';

-- RLS: allow users to SELECT their linked factions
-- (existing policies already allow SELECT on factions for authenticated users)

-- RLS: allow users to UPDATE their linked factions
CREATE POLICY "Users can update linked factions" ON factions
    FOR UPDATE TO authenticated
    USING (linked_user_id = auth.uid())
    WITH CHECK (linked_user_id = auth.uid());
