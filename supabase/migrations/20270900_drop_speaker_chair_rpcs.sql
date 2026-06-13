-- ════════════════════════════════════════════════════════════════════
-- 20270900 — Retire the Legislature chair-officer feature (RPCs)
--
-- The Legislature career ladder (Deputy Speaker · Presiding Officer →
-- Speaker of the Assembly) was culled from the client — superfluous
-- after the committee stage was abolished (20270892) and statutes go
-- straight to the floor. The three RPCs that drove it have no remaining
-- callers anywhere (their only caller was politician-career.html), so
-- they are dropped here.
--
-- Signatures across the feature's history (20270592 / 20270593 added
-- the 1-arg / no-arg forms; 20270668's faction_id sweep added the
-- faction-scoped overloads) are all dropped IF EXISTS so this applies
-- cleanly regardless of which overloads a given database carries.
--
-- DELIBERATELY KEPT (per scope decision): the two holder columns
--   factions.politician_deputy_speaker_at_tick
--   factions.politician_speaker_of_assembly_at_tick
-- Nothing writes them anymore (the RPCs were their only writers), so
-- they remain permanently NULL. The general-election / coalition /
-- HoG-install / deputy-minister functions that clear them to NULL on
-- their respective events (20270594/626/666/696/875/876/880, …) keep
-- referencing them — those clears are now harmless no-ops. Dropping the
-- columns would force re-emitting all of those core tick functions, a
-- far larger change that was intentionally left out of scope. Their
-- partial unique indexes (uq_factions_speaker_per_nation, deputy) are
-- likewise retained — they never index a row while the columns stay
-- NULL.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.politician_become_deputy_speaker(uuid);
DROP FUNCTION IF EXISTS public.politician_become_deputy_speaker(uuid, uuid);
DROP FUNCTION IF EXISTS public.politician_run_for_speaker(uuid);
DROP FUNCTION IF EXISTS public.politician_run_for_speaker(uuid, uuid);
DROP FUNCTION IF EXISTS public.politician_resign_chair();
DROP FUNCTION IF EXISTS public.politician_resign_chair(uuid);

NOTIFY pgrst, 'reload schema';

COMMIT;
