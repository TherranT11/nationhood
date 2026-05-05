-- ═══════════════════════════════════════════════════════════════════════════════
-- One-off: clear Hajjara's scheduled-but-never-running elections
-- ═══════════════════════════════════════════════════════════════════════════════
-- Hajjara's government_type is 'absolute_monarchy'. The engine never runs
-- elections for absolute monarchies (elections.js gates with isAbsoluteMonarchy
-- at processElections, runManualElection, and processElectionVacancyEffects),
-- but the elections.html page was still showing an upcoming-election widget
-- because loadElectionInfo() auto-INSERTs a scheduled row whenever it doesn't
-- find one. Result: a phantom "March, 2008 — 39 ticks" entry under
-- "UPCOMING ELECTIONS" that never actually fires.
--
-- This script kills the existing scheduled rows. The companion code change
-- in elections.html short-circuits the auto-reinsert for absolute monarchies
-- and shows "Never" instead, so the cleanup sticks across reloads.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Sanity-check the target. Bail loudly if Hajjara isn't actually an absolute
-- monarchy (e.g. someone changed the government type since this script was
-- written) so we don't accidentally delete a democracy's election queue.
DO $$
DECLARE
    v_gov_type text;
BEGIN
    SELECT government_type INTO v_gov_type
    FROM public.nations
    WHERE name = 'Hajjara';

    IF v_gov_type IS NULL THEN
        RAISE EXCEPTION 'No nation named Hajjara found.';
    END IF;
    IF v_gov_type <> 'absolute_monarchy' THEN
        RAISE EXCEPTION 'Hajjara government_type is %; expected absolute_monarchy. Aborting.', v_gov_type;
    END IF;
END $$;

DELETE FROM public.elections
WHERE nation_id = (SELECT id FROM public.nations WHERE name = 'Hajjara')
  AND status = 'scheduled';

COMMIT;
