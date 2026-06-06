-- ════════════════════════════════════════════════════════════════════
-- 20270645 — corp_revenue_by_year RPC
--
-- Two new cards on the corp dashboard — "This Year's Revenue" and
-- "Last Year's Revenue" — both summing the corp's net cash change
-- (the same shape the existing REVENUE CHANGE (THIS MONTH) card
-- uses) over a 12-tick window.
--
-- No new state: corp_cash_events (the granular SOT created 20260701)
-- carries every cash event with (corp_id, tick, delta). Year-of-tick
-- math is the same anchor js/utils.js uses for tickToDate — tick 0
-- = January 2000, 12 ticks per year, so:
--
--   year_index      = floor(current_tick / 12)
--   year_start_tick = year_index * 12
--   year_end_tick   = year_start_tick + 11
--
-- "This year" sums [year_start_tick, current_tick]; "last year"
-- sums [year_start_tick - 12, year_start_tick - 1]. Edge case
-- handled — current_tick < 12 means there's no "last year" yet, so
-- last_year_delta returns 0 with last_year_start_tick at the
-- pre-game placeholder.
--
-- Apply after 20270644.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.corp_revenue_by_year(
    p_corp_id     uuid,
    p_current_tick int
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_year_start      int;
    v_last_year_start int;
    v_last_year_end   int;
    v_this_delta      numeric;
    v_last_delta      numeric;
BEGIN
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;
    IF p_current_tick IS NULL OR p_current_tick < 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tick');
    END IF;

    v_year_start      := (p_current_tick / 12) * 12;
    v_last_year_start := v_year_start - 12;
    v_last_year_end   := v_year_start - 1;

    SELECT COALESCE(SUM(delta), 0) INTO v_this_delta
      FROM public.corp_cash_events
     WHERE corp_id = p_corp_id
       AND tick >= v_year_start
       AND tick <= p_current_tick;

    -- Last year only has meaning once we're past the first year.
    IF v_last_year_start >= 0 THEN
        SELECT COALESCE(SUM(delta), 0) INTO v_last_delta
          FROM public.corp_cash_events
         WHERE corp_id = p_corp_id
           AND tick >= v_last_year_start
           AND tick <= v_last_year_end;
    ELSE
        v_last_delta := 0;
    END IF;

    RETURN jsonb_build_object(
        'success',          true,
        'current_tick',     p_current_tick,
        'year_start_tick',  v_year_start,
        'last_year_start_tick', v_last_year_start,
        'last_year_end_tick',   v_last_year_end,
        'this_year_delta',  COALESCE(v_this_delta, 0),
        'last_year_delta',  COALESCE(v_last_delta, 0)
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_revenue_by_year(uuid, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_revenue_by_year(uuid, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
