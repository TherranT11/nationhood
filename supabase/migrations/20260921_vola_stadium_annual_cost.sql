-- 20260921_vola_stadium_annual_cost.sql
--
-- Completed stadiums incur an ongoing annual cost on the host nation's
-- budget. Tracked via a denormalized sum-column (vola_stadium_annual_cost)
-- so the budget panel and processNationDebtTick can read a single number
-- without joining/scanning corp_contracts every tick.
--
-- Cost mapping (abstract dollars/yr — same scale as nation.budget):
--   Small stadium       (Light Infrastructure)  → $0.5/yr
--   Modest stadium      (Heavy Infrastructure)  → $1.0/yr
--   Extravagant stadium (Megaproject)           → $2.0/yr
--
-- Updated by processVolaStadiumCompletions on every stadium completion.
-- Backfilled here from completed corp_contracts where project_subtype =
-- 'Vola Stadium' so existing nations show the correct ongoing cost
-- starting next tick.

BEGIN;

ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS vola_stadium_annual_cost NUMERIC(6,1) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.nations.vola_stadium_annual_cost IS
    'Sum of every completed Vola stadium''s annual cost (small=$0.5, modest=$1, extravagant=$2). Surfaced in the budget panel under Sports & Culture and included in processNationDebtTick balance math.';

-- Backfill: re-derive from completed stadium contracts. Idempotent if
-- re-run (overwrites with the recomputed sum).
UPDATE public.nations n
   SET vola_stadium_annual_cost = COALESCE((
        SELECT SUM(CASE c.spec_category
            WHEN 'Light Infrastructure' THEN 0.5
            WHEN 'Heavy Infrastructure' THEN 1.0
            WHEN 'Megaproject'          THEN 2.0
            ELSE 0 END)
        FROM corp_contracts c
        WHERE c.project_subtype  = 'Vola Stadium'
          AND c.status           = 'completed'
          AND c.issuer_nation_id = n.id
   ), 0);

NOTIFY pgrst, 'reload schema';

COMMIT;
