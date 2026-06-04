-- ════════════════════════════════════════════════════════════════════
-- 20270605 — Oil & Gas: surface per-tick revenue on entrepreneur-corp
--
-- Bug: the "Revenue Change (This Month)" card on entrepreneur-corp.html
-- has been rendering "$0 · no data yet" for every oil & gas corp even
-- when retail revenue is clearly flowing into the treasury each tick.
--
-- Root cause:
--   * The card calls corp_revenue_change_this_month (20270566) which
--     sums delta from corp_cash_events for the latest tick.
--   * corp_cash_events.corp_id is FK'd to factions(id) — the legacy
--     corp system. Per docs/legacy-corp-cull.md and the comment block
--     in sql/migrations/20270251, entrepreneur cash flows now go
--     through entrepreneur_corps.treasury_cash; the legacy ledger is
--     kept around only for stale reads on legacy faction corps.
--   * process_oil_and_gas (20270443) writes treasury_cash directly
--     and never emits a corp_cash_events row — it physically can't,
--     because the FK rejects entrepreneur_corps ids.
--   * Net effect: corp_revenue_change_this_month always returns
--     tick=NULL for entrepreneur corps, and the card shows "no data
--     yet" forever.
--
-- Fix shape:
--   1. Add two scalar columns to entrepreneur_corps:
--        last_tick_revenue   bigint  -- net retail revenue posted on
--                                       the most recent tick that had
--                                       any retail flow.
--        last_revenue_tick   int     -- which tick that was.
--      Server-only writes (REVOKE UPDATE from authenticated) — only
--      the tick processor touches them.
--
--   2. Update process_oil_and_gas to stamp those columns alongside
--      its existing treasury credit. Body is otherwise byte-identical
--      to the 20270443 version. We only stamp when v_retail_revenue
--      > 0 so a no-station / empty-reserve tick doesn't clobber the
--      most recent real number with a 0.
--
--   3. Replace corp_revenue_change_this_month with one that reads
--      entrepreneur_corps.last_tick_revenue / last_revenue_tick for
--      this single corp. Same response shape so the client doesn't
--      need to change — but it now reflects the actual live revenue
--      path.
--
-- Scope: this fix targets oil & gas, which is the path the user hit.
-- Airline routes (20270465), share trades (20270444), apartment rents
-- (20270438), etc. all write to treasury_cash through the same
-- bypass-the-ledger pattern. They will keep showing "no data yet"
-- until each gets the same two-column stamp. Tracking that as a
-- follow-up — narrower than rebuilding the whole entrepreneur-side
-- cash-events ledger in one go.
--
-- Apply after 20270604.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ─────────────────────────────────────────────────────
ALTER TABLE entrepreneur_corps
    ADD COLUMN IF NOT EXISTS last_tick_revenue bigint NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_revenue_tick int;

COMMENT ON COLUMN entrepreneur_corps.last_tick_revenue IS
    'Net revenue (in dollars) posted to treasury_cash on the most recent tick that produced any revenue. Stamped by per-tick processors (process_oil_and_gas; other paths TBD). Server-only writes. Read by corp_revenue_change_this_month for the entrepreneur-corp Revenue card.';
COMMENT ON COLUMN entrepreneur_corps.last_revenue_tick IS
    'The tick at which last_tick_revenue was posted. NULL = the corp has never produced revenue. Server-only writes.';

REVOKE UPDATE (last_tick_revenue, last_revenue_tick)
    ON entrepreneur_corps FROM PUBLIC, anon, authenticated;

-- ── 2. process_oil_and_gas — same body + stamp the new columns ────
CREATE OR REPLACE FUNCTION public.process_oil_and_gas(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_corp                 RECORD;
    v_pumps                int;
    v_refine_cap           bigint;
    v_demand               bigint;
    v_crude_produced       bigint;
    v_refined_made         bigint;
    v_sold_to_stations     bigint;
    v_retail_revenue       bigint;
    v_count                int := 0;
    v_total_retail         bigint := 0;
    v_total_crude_added    bigint := 0;
    v_total_refined_made   bigint := 0;
BEGIN
    FOR v_corp IN
        SELECT id, crude_reserve, refined_reserve
          FROM entrepreneur_corps
         WHERE industry = 'oil_and_gas'
           AND (oil_last_processed_tick IS NULL OR oil_last_processed_tick <> p_tick)
         FOR UPDATE
    LOOP
        -- 1. Extraction
        SELECT COUNT(*) INTO v_pumps
          FROM corp_buildings
         WHERE owner_corp_id = v_corp.id
           AND building_type = 'pump_jack'
           AND status = 'completed';
        v_crude_produced := (v_pumps * 3)::bigint;

        -- 2. Refining capacity (sum per-tier throughput)
        SELECT COALESCE(SUM(CASE building_type
            WHEN 'refinery_small'   THEN 4
            WHEN 'refinery_regular' THEN 10
            WHEN 'refinery_large'   THEN 20
            ELSE 0 END), 0)::bigint INTO v_refine_cap
          FROM corp_buildings
         WHERE owner_corp_id = v_corp.id
           AND building_type IN ('refinery_small','refinery_regular','refinery_large')
           AND status = 'completed';
        v_refined_made := LEAST(v_refine_cap, v_corp.crude_reserve + v_crude_produced);

        -- 3. Gas station retail consumption
        SELECT COALESCE(SUM(FLOOR((COALESCE(n.standard_of_living, 50)
                                 + COALESCE(n.infrastructure,    50)) / 20.0)), 0)::bigint
          INTO v_demand
          FROM corp_buildings b
          JOIN nations n ON n.id = b.nation_id
         WHERE b.owner_corp_id = v_corp.id
           AND b.building_type = 'gas_station'
           AND b.status = 'completed';
        v_sold_to_stations := LEAST(v_demand, v_corp.refined_reserve + v_refined_made);
        v_retail_revenue   := v_sold_to_stations * oil_gas_retail_price();

        -- 4. Commit deltas. Reserves are NET of in/out this tick.
        -- last_tick_revenue / last_revenue_tick only get stamped on
        -- ticks that actually produced revenue — a stretch of zero-
        -- production ticks shouldn't clobber the most recent real
        -- number with a 0 (which would render as "Tick N · $0" and
        -- look like the card lost the data). On a no-revenue tick we
        -- leave those two columns alone.
        UPDATE entrepreneur_corps
           SET crude_reserve   = crude_reserve   + v_crude_produced - v_refined_made,
               refined_reserve = refined_reserve + v_refined_made   - v_sold_to_stations,
               treasury_cash   = COALESCE(treasury_cash, 0) + v_retail_revenue,
               oil_last_processed_tick = p_tick,
               last_tick_revenue = CASE WHEN v_retail_revenue > 0
                                        THEN v_retail_revenue
                                        ELSE last_tick_revenue END,
               last_revenue_tick = CASE WHEN v_retail_revenue > 0
                                        THEN p_tick
                                        ELSE last_revenue_tick END
         WHERE id = v_corp.id;

        v_count               := v_count + 1;
        v_total_retail        := v_total_retail + v_retail_revenue;
        v_total_crude_added   := v_total_crude_added + v_crude_produced;
        v_total_refined_made  := v_total_refined_made + v_refined_made;
    END LOOP;

    RETURN jsonb_build_object(
        'success',            true,
        'tick',               p_tick,
        'corps_processed',    v_count,
        'crude_produced',     v_total_crude_added,
        'refined_produced',   v_total_refined_made,
        'retail_revenue',     v_total_retail
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_oil_and_gas(int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.process_oil_and_gas(int) TO service_role;

-- ── 3. corp_revenue_change_this_month — read the new SOT ──────────
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

    SELECT last_revenue_tick, last_tick_revenue
      INTO v_tick, v_delta
      FROM entrepreneur_corps
     WHERE id = p_corp_id;

    -- v_tick stays NULL when the corp has never produced revenue.
    -- The client renders that as "no data yet" — distinct from
    -- "lookup failed" on RPC error.
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
