-- ════════════════════════════════════════════════════════════════════
-- 20270774 — corp_consultants: SELECT scoped to involved parties
--
-- Audit finding on 20270773: the table shipped with a public
-- authenticated SELECT (USING true). That defeats the public/private
-- amount redaction in the corporate-history line — any authenticated
-- user could read private-corp consultancy amounts straight off the
-- table via PostgREST, no subpoena required.
--
-- Fix: SELECT is now limited to the involved parties —
--   • the consultant (their faction row belongs to the caller), or
--   • the corp's owner (their entrepreneur faction owns the corp).
--
-- Everyone else gets nothing from direct reads. The FIS
-- investigation surface gets its access later through SECURITY
-- DEFINER RPCs (the subpoena mechanic), which bypass RLS by design —
-- exactly the "hidden until investigated" posture the consultancy
-- redaction wants.
--
-- The pending-offer + responder RPCs are SECURITY DEFINER and
-- unaffected.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP POLICY IF EXISTS corp_consultants_select ON public.corp_consultants;
CREATE POLICY corp_consultants_select ON public.corp_consultants
    FOR SELECT TO authenticated USING (
        -- The consultant themselves…
        EXISTS (
            SELECT 1 FROM factions f
             WHERE f.id = corp_consultants.consultant_faction_id
               AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
        -- …or the corp's owner.
        OR EXISTS (
            SELECT 1
              FROM entrepreneur_corps ec
              JOIN factions f ON f.id = ec.owner_faction_id
             WHERE ec.id = corp_consultants.corp_id
               AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );

COMMENT ON TABLE public.corp_consultants IS
    'Consultancy offers + roster. retain_corp_consultant escrows the fee and inserts status=pending; respond_consultancy_offer pays out on accept (politicians: +1 politician_capital per $5M in capital_granted) or refunds the treasury on decline. SELECT limited to the consultant + corp owner (20270774) so private-corp amounts stay confidential; FIS access lands later via SECURITY DEFINER subpoena RPCs. RPC-only writes. 20270773.';

NOTIFY pgrst, 'reload schema';

COMMIT;
