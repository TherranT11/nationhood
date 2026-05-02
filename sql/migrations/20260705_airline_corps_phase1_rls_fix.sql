-- ══════════════════════════════════════════════════════════════
-- Airline Corps Phase 1 — RLS audit fix.
--
-- The two tables shipped in 20260704 had a public SELECT policy
-- but no INSERT policy. corp-nation-select.html does a client-
-- side INSERT into corp_airline_terminals at corp creation;
-- without an INSERT policy RLS denies the write and the new
-- airline ships without its free home terminal.
--
-- This migration adds INSERT policies that allow an authenticated
-- user to insert rows whose corp_id points at a faction they own
-- (id = auth.uid() for primary corps, linked_user_id = auth.uid()
-- for linked corps). UPDATE / DELETE remain service-role only —
-- no client surface modifies these rows post-creation in Phase 1.
-- ══════════════════════════════════════════════════════════════

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='corp_aircraft' AND policyname='Owners can insert corp_aircraft'
    ) THEN
        CREATE POLICY "Owners can insert corp_aircraft"
            ON public.corp_aircraft FOR INSERT
            TO authenticated
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.factions f
                     WHERE f.id = corp_aircraft.corp_id
                       AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname='public' AND tablename='corp_airline_terminals' AND policyname='Owners can insert corp_airline_terminals'
    ) THEN
        CREATE POLICY "Owners can insert corp_airline_terminals"
            ON public.corp_airline_terminals FOR INSERT
            TO authenticated
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.factions f
                     WHERE f.id = corp_airline_terminals.corp_id
                       AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
                )
            );
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
