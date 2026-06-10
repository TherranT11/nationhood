-- ════════════════════════════════════════════════════════════════════
-- 20270794 — Core Metrics: the three pillars (start at 1)
--
-- Construction corps compete on three high-level attributes instead
-- of micro-managed materials. Stored as columns (not display copy) so
-- upgrade mechanics increment one place and project-bid math reads
-- the same source:
--
--   pillar_speed       Structural Speed (Throughput) — cuts the
--                      baseline ticks to deliver a finished building.
--   pillar_efficiency  Procurement Efficiency (Cost Reduction) —
--                      permanently cuts the baseline cash spent on
--                      raw materials per project.
--   pillar_quality     Engineering Quality (Value-Add) — permanent
--                      positive performance modifier on the finished
--                      building (e.g. +0.3 GDP growth vs the +0.2
--                      baseline).
--
-- Column names are industry-neutral on purpose: throughput / cost /
-- value-add generalize to the automotive trio when it's designed —
-- per-industry LABELS live client-side, the numbers live here. All
-- corps start every pillar at 1.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS pillar_speed      int NOT NULL DEFAULT 1 CHECK (pillar_speed      >= 1),
    ADD COLUMN IF NOT EXISTS pillar_efficiency int NOT NULL DEFAULT 1 CHECK (pillar_efficiency >= 1),
    ADD COLUMN IF NOT EXISTS pillar_quality    int NOT NULL DEFAULT 1 CHECK (pillar_quality    >= 1);

NOTIFY pgrst, 'reload schema';

COMMIT;
