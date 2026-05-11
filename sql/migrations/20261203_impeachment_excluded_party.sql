-- ════════════════════════════════════════════════════════════════
-- elections.excluded_faction_id — bar a party from a snap election
--
-- Populated by the impeachment-conviction processor in advance-tick:
-- when a president is convicted, the snap election that follows
-- excludes the convicted president's own party from fielding a
-- candidate. Read by triggerPresidentialCandidateSelection (in
-- js/game/presidential.js) — that loop skips the excluded faction
-- when registering pm_candidates rows for the upcoming presidential
-- election.
--
-- Single-election scope: the column lives on the election row, so it
-- evaporates with the row when the election resolves and is cleaned
-- up. The party can run normally in every subsequent election —
-- exactly the "this election only" semantics the spec calls for.
--
-- Nullable + NULL default — no behaviour change for ordinary
-- elections, only impeachment-triggered ones populate this.
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.elections
    ADD COLUMN IF NOT EXISTS excluded_faction_id UUID
        REFERENCES public.factions(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.elections.excluded_faction_id IS
    'If set, this faction (party) cannot field a candidate in this election. Populated by impeachment-conviction processing so the convicted president''s party is barred from the snap election that follows. Cleared automatically when the election row is deleted.';

COMMIT;

NOTIFY pgrst, 'reload schema';
