-- ════════════════════════════════════════════════════════════════
-- impeachment_proceedings — RLS policies
--
-- The original 20260303_impeachment.sql created the table without
-- ENABLE ROW LEVEL SECURITY and without policies. RLS got turned on
-- somewhere along the way (sweep migration, dashboard, or default
-- behaviour) and every client-side write started failing with
-- "new row violates row-level security policy". The tick-side code
-- in advance-tick uses the service role and bypasses RLS, so the
-- failure was only visible when a player clicked "Impeach
-- President" from the party-actions screen.
--
-- Policies added:
--   • SELECT        — any authenticated user (public political info,
--                     and bills/party-actions UIs need to read it)
--   • INSERT/UPDATE — only the initiating faction can write rows
--                     where they're listed as the initiator. Parties
--                     have faction.id = user_id so auth.uid() =
--                     initiated_by_faction_id is the canonical
--                     check, with a linked_user_id branch for
--                     symmetry with the corp-faction pattern.
--   • DELETE        — same gate (race-condition guard in
--                     impeachment.js deletes the proceeding row
--                     it just created if a concurrent one beat it).
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.impeachment_proceedings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "impeachment_proceedings_read_all"   ON public.impeachment_proceedings;
DROP POLICY IF EXISTS "impeachment_proceedings_initiator_insert" ON public.impeachment_proceedings;
DROP POLICY IF EXISTS "impeachment_proceedings_initiator_update" ON public.impeachment_proceedings;
DROP POLICY IF EXISTS "impeachment_proceedings_initiator_delete" ON public.impeachment_proceedings;

-- Public read.
CREATE POLICY "impeachment_proceedings_read_all"
    ON public.impeachment_proceedings
    FOR SELECT
    USING (true);

-- Only the initiating faction can insert, AND the faction must be
-- from the SAME nation as the proceeding. The faction-ownership
-- gate alone would let a player in Nation X file an impeachment
-- against the President of Nation Y. The UI never exposes that, but
-- belt-and-suspenders the RLS check.
--
-- linked_user_id covers the corp-faction pattern for symmetry, even
-- though impeachment is currently a party-only action.
CREATE POLICY "impeachment_proceedings_initiator_insert"
    ON public.impeachment_proceedings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        initiated_by_faction_id IN (
            SELECT id FROM public.factions
             WHERE (id = auth.uid() OR linked_user_id = auth.uid())
               AND nation_id = impeachment_proceedings.nation_id
        )
    );

-- Only the initiating faction can update (sets motion_bill_id right
-- after the INSERT in impeachment.js). All phase/result transitions
-- happen tick-side via service role and bypass RLS. Same nation
-- gate as INSERT — the WITH CHECK also blocks moving a proceeding
-- into a different nation_id.
CREATE POLICY "impeachment_proceedings_initiator_update"
    ON public.impeachment_proceedings
    FOR UPDATE
    TO authenticated
    USING (
        initiated_by_faction_id IN (
            SELECT id FROM public.factions
             WHERE (id = auth.uid() OR linked_user_id = auth.uid())
               AND nation_id = impeachment_proceedings.nation_id
        )
    )
    WITH CHECK (
        initiated_by_faction_id IN (
            SELECT id FROM public.factions
             WHERE (id = auth.uid() OR linked_user_id = auth.uid())
               AND nation_id = impeachment_proceedings.nation_id
        )
    );

-- Only the initiating faction can delete (race-condition guard in
-- impeachment.js if another proceeding lands first).
CREATE POLICY "impeachment_proceedings_initiator_delete"
    ON public.impeachment_proceedings
    FOR DELETE
    TO authenticated
    USING (
        initiated_by_faction_id IN (
            SELECT id FROM public.factions
             WHERE (id = auth.uid() OR linked_user_id = auth.uid())
               AND nation_id = impeachment_proceedings.nation_id
        )
    );

COMMIT;

NOTIFY pgrst, 'reload schema';
