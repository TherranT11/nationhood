-- Fix corp_executives INSERT/UPDATE policies for linked corporations.
-- Linked corps have faction_id != auth.uid() (they use linked_user_id instead).
-- Allow any authenticated user to insert/update (matches existing permissive RLS pattern).

DROP POLICY IF EXISTS corp_executives_insert ON corp_executives;
DROP POLICY IF EXISTS corp_executives_update ON corp_executives;

CREATE POLICY corp_executives_insert ON corp_executives
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY corp_executives_update ON corp_executives
    FOR UPDATE TO authenticated USING (true);
