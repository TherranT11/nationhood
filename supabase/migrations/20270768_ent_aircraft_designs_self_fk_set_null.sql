-- ════════════════════════════════════════════════════════════════════
-- 20270768 — Fix self-FK on ent_aircraft_designs blocking bankruptcy
--
-- User report: declaring bankruptcy on an entrepreneur aviation-
-- manufacturing corp fails with
--
--   Failed: update or delete on table "ent_aircraft_designs" violates
--   foreign key constraint "ent_aircraft_designs_engine_design_id_fkey"
--   on table "ent_aircraft_designs"
--
-- Root cause: ent_aircraft_designs (introduced in
-- sql/migrations/20270221_ent_aircraft_designs.sql) carries a self-
-- referential FK
--
--   engine_design_id uuid REFERENCES ent_aircraft_designs(id)
--
-- with no ON DELETE clause — default NO ACTION. When a corp is
-- bankrupted, the entrepreneur_corp_id ON DELETE CASCADE fires and
-- queues every design (both engine and aircraft rows) for delete in
-- a single statement. Postgres processes the deletes row-by-row,
-- and the moment an aircraft row references an engine row that's
-- also being deleted, the immediate FK check trips on the orphan
-- pointer and the whole transaction aborts.
--
-- Fix: swap the FK to ON DELETE SET NULL.
--
--   • Within the same corp: engine deleted → aircraft.engine_design_id
--     becomes NULL transiently, then the aircraft row is itself
--     deleted by the corp cascade. No FK violation, atomic.
--
--   • Cross-corp: corp A is bankrupted, corp B has an aircraft using
--     corp A's engine — corp B's aircraft survives with NULL engine
--     pointer (the engine design is gone, but the aircraft row stays
--     on corp B's books). Better than CASCADE, which would have
--     deleted corp B's aircraft as collateral.
--
-- This unblocks bankruptcy / disband for any aviation-manufacturing
-- corp that completed at least one aircraft design.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.ent_aircraft_designs
    DROP CONSTRAINT IF EXISTS ent_aircraft_designs_engine_design_id_fkey;

ALTER TABLE public.ent_aircraft_designs
    ADD CONSTRAINT ent_aircraft_designs_engine_design_id_fkey
    FOREIGN KEY (engine_design_id)
    REFERENCES public.ent_aircraft_designs(id)
    ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
