-- ════════════════════════════════════════════════════════════════════
-- HARDENING: protect factions.status from direct client writes
-- ════════════════════════════════════════════════════════════════════
-- Follow-up to 20270412 (arrest lock). factions has permissive UPDATE RLS
-- ("Allow update for all" + "Users can update linked factions" where
-- linked_user_id = auth.uid()), so WITHOUT this a player could simply run
--     UPDATE factions SET status = 'active' WHERE id = <their own faction>
-- from the client and self-release from arrest. The 20270412 triggers guard
-- corp/share actions and party_funds, but NOT a bare status flip.
--
-- Fix uses the same idiom as 20270254 (ent_unpaid_debt): a column-level
-- REVOKE. SECURITY DEFINER functions and the admin SQL console run as the
-- table owner and bypass column REVOKEs, so legitimate arrest/release (admin
-- SQL) still works — only direct PostgREST writes by anon/authenticated are
-- blocked. No client code writes factions.status (it is read-only on the
-- client), so nothing legitimate breaks.
--
-- Idempotent: re-REVOKEing an already-revoked privilege is a harmless no-op.
-- ════════════════════════════════════════════════════════════════════

REVOKE UPDATE (status) ON public.factions FROM PUBLIC, anon, authenticated;

-- ── ROLLBACK ──
-- GRANT UPDATE (status) ON public.factions TO authenticated;
