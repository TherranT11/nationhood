-- ════════════════════════════════════════════════════════════════════
-- 20270563 — Chief Justice (Judiciary Tier 6)
--
-- Final rung on the bench arc. Schema-only ship: the appointment
-- mechanic and any behavioural gates (presiding-over-impeachments,
-- assigning Supreme Court panels, tiebreaker votes, whatever the
-- final design lands on) come later. This migration just stands up
-- the column and locks it down to server-side writes so the future
-- appointment RPC has a column to set without a follow-up REVOKE.
--
-- Judiciary ladder for reference:
--   TIER 1  Advocate              (bar admission, no column)
--   TIER 2  Experienced Advocate  (politician_experienced_advocate_at_tick)
--   TIER 3  Magistrate            (politician_magistrate_at_tick)
--   TIER 4  Appellate Justice     (visual-only, no schema)
--   TIER 5  Supreme Court Justice (politician_supreme_court_justice_at_tick)
--   TIER 6  Chief Justice         ← this migration
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_chief_justice_at_tick int;

COMMENT ON COLUMN public.factions.politician_chief_justice_at_tick IS
    'Tick at which this politician was appointed Chief Justice (Judiciary Tier 6). NULL = not appointed. One-shot, never cleared. Appointment RPC deferred — admins set this directly for now.';

-- Same defense-in-depth pattern as the SC Justice column (20270561):
-- without column-level REVOKE, a player with row-level UPDATE access
-- to their own faction row could self-promote by direct-writing the
-- column from the client, bypassing the future appointment RPC.
REVOKE UPDATE (politician_chief_justice_at_tick)
    ON public.factions FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
