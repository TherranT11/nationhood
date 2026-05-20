-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR STOCK SYSTEM — per-tick price-history anchors
-- ════════════════════════════════════════════════════════════════════
-- The share price only moves on trades (or IPO / board joins / etc.),
-- so between trades the corp_share_price_history table sits idle and
-- the "Share Price History" sparkline shows a flat / empty chart —
-- visually indistinguishable from "no activity ever". This RPC
-- appends a no-op anchor row (source='tick') for every public corp
-- once per tick so the chart always has a time-axis to plot against.
--
-- No money moves. delta_pct stays NULL. The chart's polyline gets a
-- datapoint at the corp's current price every tick — visible time
-- progression between trades. Idempotent within a tick (re-running
-- the tick handler won't duplicate rows).
--
-- Wired into the advance-tick handler at section 3.6g, right after
-- corp loan servicing.
--
-- ── Source column ────────────────────────────────────────────────
-- 'tick' is a new label. The source column has no CHECK constraint
-- (intentionally — see 20270164's robustness-over-strict comment), so
-- adding the value needs no schema change.
--
-- ── Recent-events list ───────────────────────────────────────────
-- Client-side: entrepreneur-corp.html filters source='tick' out of
-- the recent-changes list (they're noise there); the sparkline keeps
-- them. Same fetch, two consumers.
--
-- Idempotent. No schema/table changes.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.process_corp_price_anchors(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick    int;
    v_written int := 0;
BEGIN
    -- Shard current_tick is the source of truth — p_tick is taken as
    -- a hint but the actual write tags the row with the shard's tick
    -- so an out-of-band caller can't backdate or future-date anchors.
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, p_tick, 0);

    -- One row per public corp per tick. NOT EXISTS makes the insert
    -- idempotent: if the tick handler runs twice for the same tick
    -- (manual reprocess), we don't double-anchor.
    INSERT INTO corp_share_price_history
        (corp_id, at_tick, old_price, new_price, delta_pct, source)
    SELECT c.id, v_tick, c.share_price, c.share_price, NULL, 'tick'
      FROM entrepreneur_corps c
     WHERE c.listing = 'public'
       AND c.share_price IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM corp_share_price_history h
            WHERE h.corp_id = c.id
              AND h.at_tick = v_tick
              AND h.source  = 'tick'
       );
    GET DIAGNOSTICS v_written = ROW_COUNT;

    RETURN jsonb_build_object('success', true, 'tick', v_tick, 'written', v_written);
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_corp_price_anchors(int) TO authenticated;

COMMENT ON FUNCTION public.process_corp_price_anchors(int) IS
    'Per-tick cosmetic anchor for the corp share-price sparkline. Inserts one row per public corp into corp_share_price_history with source=''tick'', new_price = current share_price, delta_pct = NULL. No money moves. Idempotent within a tick via NOT EXISTS. Called from advance-tick section 3.6g.';

COMMENT ON COLUMN corp_share_price_history.source IS
    'Labels the cause: trade_buy / trade_sell / board_join / board_leave / ipo / delist / backfill / tick. NULL means an instrumented RPC didn''t set the session var (future writer / untouched RPC).';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.process_corp_price_anchors(int);
-- -- Tick-anchor rows can stay in the history table; they're harmless
-- -- and the trigger from 20270164 will keep appending real-change
-- -- rows on top. To purge anchors entirely:
-- --   DELETE FROM corp_share_price_history WHERE source = 'tick';
-- COMMIT;
