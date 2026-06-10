-- ════════════════════════════════════════════════════════════════════
-- 20270778 — corp_tax_filings: restrict SELECT to the corp owner
--
-- 20270776 shipped corp_tax_filings with a SELECT policy of USING(true),
-- making every filing — including status='evaded' and the hidden
-- amount — world-readable. That defeats the feature's core design:
-- under-disclosed income is meant to stay confidential until an FIS
-- agent investigates (the deferred-detection path). A competitor could
-- otherwise just query the table and see who cooked their books. Same
-- class of leak as the private-corp consultancy amounts fixed earlier.
--
-- Tighten SELECT to the corp's owner (the faction linked to the calling
-- user) plus admins. Writes already go only through file_corporate_tax
-- (SECURITY DEFINER) and the service_role policy, both unaffected. A
-- future FIS audit will read filings via its own SECURITY DEFINER RPC,
-- which bypasses RLS — so no agent-read policy is needed here yet.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP POLICY IF EXISTS corp_tax_filings_select ON public.corp_tax_filings;

CREATE POLICY corp_tax_filings_owner_select ON public.corp_tax_filings
    FOR SELECT TO authenticated
    USING (
        is_admin()
        OR EXISTS (
            SELECT 1
              FROM entrepreneur_corps ec
              JOIN factions f ON f.id = ec.owner_faction_id
             WHERE ec.id = corp_tax_filings.corp_id
               AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
        )
    );

NOTIFY pgrst, 'reload schema';

COMMIT;
