-- ════════════════════════════════════════════════════════════════════
-- 20270780 — Revenue YTD accumulator: feed the year cards real data
--
-- "THIS YEAR'S REVENUE" and "LAST YEAR'S REVENUE" on entrepreneur-
-- corp.html have been silently $0 since they shipped: corp_revenue_
-- by_year (20270645) sums corp_cash_events, but that ledger stopped
-- being written at tick ~140 when the corp simplification replaced
-- per-event cash rows with direct treasury writes + the last_tick_
-- revenue / last_revenue_tick stamp (20270605 → 20270621). The month
-- card was migrated to the stamp; the year cards never were —
-- confirmed live: shard tick 167, corp_cash_events MAX(tick) = 140,
-- month card +$405k from the stamp, year card $0 from the dead table.
--
-- Only the latest tick's revenue is kept anywhere, so past months are
-- unrecoverable. Fix going forward, same SoT posture as 20270621:
--
--   1. entrepreneur_corps gains revenue_ytd / revenue_ytd_year /
--      revenue_last_year.
--   2. stamp_entrepreneur_corp_revenue — the single choke point every
--      revenue processor (oil & gas, airline routes, shipping,
--      apartment rents) already calls — rolls the accumulator: same
--      year → add; year changed → archive ytd into revenue_last_year
--      (or 0 it if a full year was skipped) and restart the count.
--   3. corp_revenue_by_year reads the accumulator. Return shape is
--      byte-compatible with 20270645 so entrepreneur-corp.html needs
--      no changes. The stale-stamp case is handled at read time: a
--      corp whose last activity was last year still reports that
--      year's total under last_year_delta.
--   4. Best-effort backfill: seed the accumulator from the existing
--      stamp, so the card opens showing at least the latest month's
--      revenue instead of $0 until the next tick. (True YTD history
--      for earlier months no longer exists anywhere — this is the
--      recoverable part.)
--
-- Year math is the shared anchor (tick 0 = Jan 2000, 12 ticks/year):
-- year_index = tick / 12, integer division.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Accumulator columns ────────────────────────────────────────
ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS revenue_ytd       bigint NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS revenue_ytd_year  int,
    ADD COLUMN IF NOT EXISTS revenue_last_year bigint NOT NULL DEFAULT 0;

-- ── 2. Stamp helper rolls the year accumulator ────────────────────
-- Body identical to 20270621 plus the three accumulator columns.
-- All CASE arms read the OLD row values (single-UPDATE semantics),
-- so the order of assignments below doesn't matter. NULL
-- revenue_ytd_year (corp never stamped since this landed) falls
-- through the -1 sentinel into the "new year" arms.
CREATE OR REPLACE FUNCTION public.stamp_entrepreneur_corp_revenue(
    p_corp_id uuid,
    p_tick    int,
    p_amount  bigint
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE entrepreneur_corps
       SET treasury_cash     = COALESCE(treasury_cash, 0) + p_amount,
           last_tick_revenue = CASE
               WHEN last_revenue_tick = p_tick
                    THEN COALESCE(last_tick_revenue, 0) + p_amount
               WHEN p_amount <> 0
                    THEN p_amount
               ELSE last_tick_revenue
           END,
           last_revenue_tick = CASE
               WHEN last_revenue_tick = p_tick THEN p_tick
               WHEN p_amount <> 0              THEN p_tick
               ELSE last_revenue_tick
           END,
           revenue_last_year = CASE
               WHEN COALESCE(revenue_ytd_year, -1) = p_tick / 12
                    THEN revenue_last_year
               WHEN COALESCE(revenue_ytd_year, -1) = (p_tick / 12) - 1
                    THEN COALESCE(revenue_ytd, 0)
               ELSE 0
           END,
           revenue_ytd = CASE
               WHEN COALESCE(revenue_ytd_year, -1) = p_tick / 12
                    THEN COALESCE(revenue_ytd, 0) + p_amount
               ELSE p_amount
           END,
           revenue_ytd_year = p_tick / 12,
           updated_at = now()
     WHERE id = p_corp_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.stamp_entrepreneur_corp_revenue(uuid, int, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.stamp_entrepreneur_corp_revenue(uuid, int, bigint) TO service_role;

-- ── 3. corp_revenue_by_year reads the accumulator ─────────────────
-- Same signature + return keys as 20270645; only the source changes.
CREATE OR REPLACE FUNCTION public.corp_revenue_by_year(
    p_corp_id     uuid,
    p_current_tick int
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_year       int;
    v_ytd        bigint;
    v_ytd_year   int;
    v_last_year  bigint;
    v_this_delta bigint := 0;
    v_last_delta bigint := 0;
BEGIN
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_current_tick IS NULL OR p_current_tick < 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tick');
    END IF;

    v_year := p_current_tick / 12;

    SELECT COALESCE(revenue_ytd, 0), revenue_ytd_year, COALESCE(revenue_last_year, 0)
      INTO v_ytd, v_ytd_year, v_last_year
      FROM entrepreneur_corps
     WHERE id = p_corp_id;
    -- Unknown corp → zeros, same as 20270645's empty-set sums.

    IF v_ytd_year = v_year THEN
        v_this_delta := v_ytd;
        v_last_delta := v_last_year;
    ELSIF v_ytd_year = v_year - 1 THEN
        -- Corp hasn't earned anything yet this year — its accumulator
        -- still holds last year's total.
        v_this_delta := 0;
        v_last_delta := v_ytd;
    END IF;
    -- Older or NULL v_ytd_year → both stay 0.

    RETURN jsonb_build_object(
        'success',          true,
        'current_tick',     p_current_tick,
        'year_start_tick',  v_year * 12,
        'last_year_start_tick', v_year * 12 - 12,
        'last_year_end_tick',   v_year * 12 - 1,
        'this_year_delta',  COALESCE(v_this_delta, 0),
        'last_year_delta',  COALESCE(v_last_delta, 0)
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_revenue_by_year(uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_revenue_by_year(uuid, int) TO authenticated;

-- ── 4. Backfill from the existing stamp ───────────────────────────
-- The only per-month figure that survived the ledger cull is the
-- latest stamp, so each corp's year opens with that month counted.
UPDATE public.entrepreneur_corps
   SET revenue_ytd      = COALESCE(last_tick_revenue, 0),
       revenue_ytd_year = last_revenue_tick / 12
 WHERE last_revenue_tick IS NOT NULL
   AND revenue_ytd_year IS NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
