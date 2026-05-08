-- ════════════════════════════════════════════════════════════════
-- Step 1 of 6: Corporate Tax foundation — nation_id on corp_cash_events
--
-- Builds the schema gap that blocks the territorial corporate-tax
-- model: today corp_cash_events records corp_id but not the nation
-- where the cash flow occurred. To assess revenue per (corp, nation)
-- at tax time, every revenue event needs to know its earning
-- jurisdiction.
--
-- This migration is purely additive and deploys as a no-op:
--
--   1. ALTER corp_cash_events ADD COLUMN nation_id UUID, FK to
--      nations with ON DELETE SET NULL so historical events survive
--      nation deletion. Existing rows stay NULL.
--   2. DROP the old 5-arg emit_corp_cash_event signature; CREATE a
--      6-arg version with p_nation_id UUID DEFAULT NULL appended.
--      All existing callers pass ≤5 args, so they resolve to the
--      new function with nation_id=NULL — no behavior change.
--   3. Add a partial index on (nation_id, tick) for the per-nation
--      revenue rollup that drives tax assessment. Partial because
--      most rows are NULL until step 2 backfills.
--
-- Step 2 (separate migration) backfills existing rows + updates the
-- ~15-20 emit call sites in advance-corp-tick to pass the right
-- nation_id. Step 1 alone changes nothing observable.
--
-- Idempotent (ADD COLUMN IF NOT EXISTS, DROP FUNCTION IF EXISTS,
-- CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── Column add ──────────────────────────────────────────────────
ALTER TABLE public.corp_cash_events
    ADD COLUMN IF NOT EXISTS nation_id UUID
        REFERENCES public.nations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.corp_cash_events.nation_id IS
    'Nation where the cash flow occurred. Revenue events: where revenue was earned (HQ income → property nation; sub-revenue → subsidiary nation; market/airline/finance/trade → corp home nation). Non-revenue events: corp home nation. NULL on legacy rows pre-dating the step-2 backfill.';

-- Partial index for the per-nation revenue rollup that drives
-- corporate tax assessment. Partial because legacy rows are NULL
-- and have no use for this lookup.
CREATE INDEX IF NOT EXISTS idx_corp_cash_events_nation_tick
    ON public.corp_cash_events (nation_id, tick)
    WHERE nation_id IS NOT NULL;

-- ── Function signature update ───────────────────────────────────
-- DROP first because adding a parameter creates a new overload;
-- CREATE OR REPLACE only matches identical signatures. All current
-- callers pass ≤5 args, so once the old signature is gone they
-- resolve to the new function with p_nation_id defaulting to NULL.
DROP FUNCTION IF EXISTS emit_corp_cash_event(UUID, TEXT, TEXT, NUMERIC, INTEGER);

CREATE OR REPLACE FUNCTION emit_corp_cash_event(
    p_corp_id    UUID,
    p_category   TEXT,
    p_label      TEXT,
    p_delta      NUMERIC,
    p_tick       INTEGER DEFAULT NULL,
    p_nation_id  UUID    DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick INTEGER;
BEGIN
    IF p_tick IS NULL THEN
        SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';
        v_tick := COALESCE(v_tick, 0);
    ELSE
        v_tick := p_tick;
    END IF;

    INSERT INTO corp_cash_events (corp_id, tick, category, label, delta, nation_id)
    VALUES (p_corp_id, v_tick, p_category, p_label, p_delta, p_nation_id);

    UPDATE factions
       SET corp_cash_reserves = GREATEST(0, COALESCE(corp_cash_reserves, 0) + p_delta)
     WHERE id = p_corp_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION emit_corp_cash_event(UUID, TEXT, TEXT, NUMERIC, INTEGER, UUID) FROM PUBLIC;

COMMENT ON FUNCTION emit_corp_cash_event(UUID, TEXT, TEXT, NUMERIC, INTEGER, UUID) IS
    'Atomic SSoT writer for corp cash flows. Appends a corp_cash_events row AND adjusts factions.corp_cash_reserves by the same delta in one transaction. p_nation_id (added 20261014) tags the event with its earning jurisdiction for territorial corporate-tax assessment — NULL on calls that haven''t been updated yet, populated explicitly by revenue emit sites in advance-corp-tick. NOT granted to authenticated; reachable via PERFORM from other SECURITY DEFINER RPCs and from service_role inside advance-tick.';

NOTIFY pgrst, 'reload schema';

COMMIT;
