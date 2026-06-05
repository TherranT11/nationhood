-- ════════════════════════════════════════════════════════════════════
-- 20270628 — Paperwork dispatches: close the answer-key read leak
--
-- Second-pass audit on 20270627 found a real RLS hole. The read policy
-- pw_read_self_or_approved allowed ANY caller (including anonymous via
-- direct PostgREST) to SELECT approved dispatches — and Supabase RLS
-- is row-level, not column-level, so the answer-key columns
-- (correct_ministry, correct_agency, should_flag) came along with the
-- player-facing fields.
--
-- That's a grading-exploit-in-waiting: once the civil-servant routing
-- UI exists, a player could query paperwork_dispatches directly to
-- read the correct answer for any dispatch they're about to be graded
-- on.
--
-- Fix: drop the status='approved' branch from the read policy. Only
-- authors can now read dispatches directly; everyone else (including
-- the future civil-servant routing UI) must go through a SECURITY
-- DEFINER RPC that returns only the player-facing columns.
--
-- Surfaces currently in play:
--   • handlepaperwork.html — writes only via submit_paperwork_dispatch
--     RPC (SECURITY DEFINER, bypasses RLS). No direct read.
--   • courtcaseadmin.html — reads via list_pending_paperwork_dispatches
--     RPC (SECURITY DEFINER, bypasses RLS). No direct read.
--   • Author's own dispatches — covered by the remaining
--     author_faction_id IN (...) branch. Authors keep seeing their
--     submissions including pending / approved / rejected states.
--
-- Civil-servant routing UI is future work. When it lands it'll ship
-- with its own SECURITY DEFINER fetch RPC that returns only
-- (id, office_of, doc_title, sender_title, body, display_id) — the
-- answer key stays server-side.
--
-- Apply after 20270627.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Old policy let everyone read approved rows. Replace with author-
-- only read so the answer key stops leaking via direct PostgREST.
DROP POLICY IF EXISTS pw_read_self_or_approved ON public.paperwork_dispatches;

CREATE POLICY pw_read_own_dispatches ON public.paperwork_dispatches
    FOR SELECT USING (
        author_faction_id IN (
            SELECT id FROM public.factions
             WHERE id = auth.uid() OR linked_user_id = auth.uid()
        )
    );

COMMIT;
