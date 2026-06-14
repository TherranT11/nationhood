-- ════════════════════════════════════════════════════════════════════
-- 20270908 — Drop the dead chief-of-staff / officer + Combined Arms
--             School posting surface (military-cull leftovers)
--
-- After the army-unit backend cull (20270905) these objects have no
-- reachable caller and several reference columns that no longer exist
-- (so they would ERROR if ever invoked). Reachability audited before
-- removal.
--
-- DROPPED — chief-of-staff / officer (all gated to the retired military
-- faction; no client, tick, or RPC caller):
--   • file_chief_of_staff_report(uuid,text[,boolean]) — read dropped
--     factions.army_* stat columns; would error on call.
--   • get_cos_reports(uuid,uuid) / acknowledge_chief_of_staff_report(
--     uuid,uuid) — only ever called from js/cos-report-pressing.js,
--     which is never imported (orphaned module, deleted alongside).
--   • foreign_officer_exchange(uuid,uuid) — read dropped army_officer_
--     corps / army_professionalism; would error on call.
--   • chief_of_staff_reports / chief_of_staff_report_acks tables +
--     factions.last_chief_of_staff_report_tick — only the dead RPCs
--     above touched them.
--
-- DROPPED — Combined Arms School posting (the player-facing army action):
--   • post_combined_arms_school(uuid) — the Quartermaster action; UI
--     removed, no caller, gated to the abandoned military faction.
--   • factions.last_combined_arms_school_tick — its cooldown stamp;
--     written only by that RPC, read by nothing.
--
-- DROPPED — stranded renamed army column:
--   • factions.army_cohesion (ex army_armor, renamed in 20270131 so
--     20270905's DROP COLUMN army_armor was a no-op). Referenced by
--     nothing live.
--
-- DELIBERATELY KEPT (entangled with live in-flight corp-contract drain,
-- NOT dead) — filed as a later pass once any in-flight schools clear:
--   • combined_arms_school_spec() — read by the live national-budget
--     upkeep calc (budget.js) AND the completion sweep.
--   • processCombinedArmsSchoolCompletions sweep + computeCombinedArms
--     SchoolUpkeepAnnual — drain/charge any Combined Arms School
--     corp_contracts posted before the cull; read corp_contracts only.
--   • factions.army_officer_corps / army_professionalism — still
--     SELECTed by that sweep's (now-never-firing) buff branch; cannot
--     drop without trimming live tick code.
--
-- IF EXISTS / CASCADE throughout so this applies cleanly regardless of
-- which objects a given database carries.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Chief-of-staff / officer RPCs ──────────────────────────────
DROP FUNCTION IF EXISTS public.file_chief_of_staff_report(uuid, text, boolean);
DROP FUNCTION IF EXISTS public.file_chief_of_staff_report(uuid, text);
DROP FUNCTION IF EXISTS public.get_cos_reports(uuid, uuid);
DROP FUNCTION IF EXISTS public.acknowledge_chief_of_staff_report(uuid, uuid);
DROP FUNCTION IF EXISTS public.foreign_officer_exchange(uuid, uuid);

-- ── 2. Chief-of-staff report tables (acks references reports) ─────
DROP TABLE IF EXISTS public.chief_of_staff_report_acks CASCADE;
DROP TABLE IF EXISTS public.chief_of_staff_reports     CASCADE;

-- ── 3. Combined Arms School posting RPC ───────────────────────────
DROP FUNCTION IF EXISTS public.post_combined_arms_school(uuid);

-- ── 4. Dead columns on factions ───────────────────────────────────
ALTER TABLE public.factions
    DROP COLUMN IF EXISTS last_chief_of_staff_report_tick,
    DROP COLUMN IF EXISTS last_combined_arms_school_tick,
    DROP COLUMN IF EXISTS army_cohesion;

NOTIFY pgrst, 'reload schema';

COMMIT;
