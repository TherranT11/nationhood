-- ════════════════════════════════════════════════════════════════════
-- DIPLOMATIC RELATIONS — allow authenticated clients to READ the table
-- ════════════════════════════════════════════════════════════════════
-- The client reads diplomatic_relations directly (Press Claim's bordering-nation
-- list, the war room's active-war list, the declare-war modal, the diplomacy
-- page). RLS was blocking authenticated SELECT, so every one of those reads
-- returned 0 rows with NO error — a nation could never see its own borders or
-- wars (e.g. Press Claim said "no bordering nations" despite proximity=0 rows).
--
-- The diplomatic map is public (same stance as war_fronts / war_sectors), so a
-- permissive read policy is correct. A permissive SELECT policy ORs with any
-- existing one, so this restores reads regardless of what's currently in place.
-- Writes stay locked: the tick (service role) and the declare-war / press-claim
-- RPCs (SECURITY DEFINER) bypass RLS; there is still no client WRITE policy.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.diplomatic_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS diplomatic_relations_read ON public.diplomatic_relations;
CREATE POLICY diplomatic_relations_read
    ON public.diplomatic_relations FOR SELECT TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
