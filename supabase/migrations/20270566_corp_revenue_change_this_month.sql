-- ════════════════════════════════════════════════════════════════════
-- 20270566 — corp_revenue_change_this_month RPC
--
-- The Corporate Finance header on entrepreneur-corp shows a "REVENUE
-- CHANGE (THIS MONTH)" card. Its client query targeted corp_cash
-- _history — a table that was deliberately culled in
-- sql/migrations/20270251_corp_cull_p5b_teardown_legacy_economy. The
-- card has been rendering "$0 · lookup failed" since.
--
-- The successor SOT is corp_cash_events (created 20260701) — a more
-- granular per-event audit row written by _emit_corp_cash_event
-- alongside every cash-affecting write. Net cash change for a given
-- tick (= one in-game month per how-to.html) is the sum of delta
-- for that corp_id at that tick.
--
-- This RPC reproduces the old card's "most recent month's net delta"
-- shape on top of the new SOT: latest tick that had any cash event
-- for the corp, plus the sum of all that tick's deltas.
--
-- Returns NULL tick + 0 cash_delta when the corp has no events
-- (newly-founded, never-traded, etc.) so the client can keep its
-- "no data yet" fallback distinct from "lookup failed".
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.corp_revenue_change_this_month(p_corp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_tick  int;
    v_delta numeric;
BEGIN
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT tick, SUM(delta)
      INTO v_tick, v_delta
      FROM public.corp_cash_events
     WHERE corp_id = p_corp_id
     GROUP BY tick
     ORDER BY tick DESC
     LIMIT 1;

    RETURN jsonb_build_object(
        'success',    true,
        'tick',       v_tick,
        'cash_delta', COALESCE(v_delta, 0)
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_revenue_change_this_month(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_revenue_change_this_month(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
