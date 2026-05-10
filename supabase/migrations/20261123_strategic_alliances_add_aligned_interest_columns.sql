-- ════════════════════════════════════════════════════════════════
-- Schema-drift fix: aligned_interest_floor_apr / _ceiling_apr
-- columns missing on prod
--
-- 20260815_aligned_interest_runtime.sql added these two columns to
-- strategic_alliances via ADD COLUMN IF NOT EXISTS. Per a 2026-05-10
-- player report, both columns are missing on prod — the original
-- migration was apparently skipped by `supabase db push` (the
-- backdated-timestamp pattern: db push records a high-water mark
-- and silently skips files dated below it).
--
-- Symptoms reported by the player:
--   - alliances.html [aiv] alliance fetch logs:
--       column strategic_alliances.aligned_interest_floor_apr does not exist
--   - finalize_alliance_interest_vote RPC returns 400:
--       column "aligned_interest_floor_apr" of relation "strategic_alliances" does not exist
--
-- Forward-dated to land after 20261122 so db push picks it up.
-- Idempotent — safe to re-run on environments that already have
-- the columns.
-- ════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.strategic_alliances
    ADD COLUMN IF NOT EXISTS aligned_interest_floor_apr   NUMERIC,
    ADD COLUMN IF NOT EXISTS aligned_interest_ceiling_apr NUMERIC;

COMMENT ON COLUMN public.strategic_alliances.aligned_interest_floor_apr IS
    'Minimum APR (per cent) the alliance allows on commercial loans, set when the Aligned Interest article is ratified or via the alliance interest vote. NULL = article not active. Loans below the floor trigger −2 Cohesion + −1 Reputation via _apply_aligned_interest_penalty.';
COMMENT ON COLUMN public.strategic_alliances.aligned_interest_ceiling_apr IS
    'Maximum APR (per cent) the alliance allows on commercial loans. Mirror of the floor.';

COMMIT;

NOTIFY pgrst, 'reload schema';
