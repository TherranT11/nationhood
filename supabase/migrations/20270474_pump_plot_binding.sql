-- Pump-to-plot binding + per-tick crude depletion. Phase 4B of the
-- Oil & Gas survey mechanic (Phase 4A shipped the plots + survey RPC
-- in 20270473_oil_plots.sql).
--
-- Before this migration: every completed pump_jack produced a flat
-- 3 bbl/tick into entrepreneur_corps.crude_reserve regardless of
-- whether any plot in the nation had crude to give.
--
-- After this migration: a pump only produces when it's LINKED to a
-- surveyed plot with crude_present > 0. The plot's reserve is the
-- ground truth — pumps draw from it and decrement it. When the plot
-- hits 0 the pump stops (link stays put; player can re-assign).
-- Multiple pumps (same corp or different corps) can drain the same
-- plot; per-tick draw is capped at plot.crude_present so no plot
-- ever goes negative.
--
-- Player UX:
--   link_pump_to_plot(building_id, plot_id)   -- assign or re-assign
--   unlink_pump_from_plot(building_id)        -- detach
-- Both owner-only, both validate that the building is a completed
-- pump_jack the caller's corp owns and (for link) that the plot is
-- in the same nation, surveyed, and has crude > 0.

BEGIN;

-- ── 1. Column ──────────────────────────────────────────────────────
-- ON DELETE SET NULL so dropping a plot (shouldn't happen — plots
-- aren't deletable in normal play) leaves the pump unlinked rather
-- than cascading the building away. linked_plot_id is server-only
-- writable; players set it via link_pump_to_plot RPC.
ALTER TABLE corp_buildings
    ADD COLUMN IF NOT EXISTS linked_plot_id uuid
        REFERENCES nation_oil_plots(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_corp_buildings_linked_plot
    ON corp_buildings (linked_plot_id) WHERE linked_plot_id IS NOT NULL;

REVOKE UPDATE (linked_plot_id) ON corp_buildings FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN corp_buildings.linked_plot_id IS
    'For pump_jack only: the nation_oil_plots row this pump draws crude from. NULL = pump idle (no production). Set/cleared via link_pump_to_plot / unlink_pump_from_plot RPCs. Server-only writes.';

-- ── 2. Replace process_oil_and_gas to deplete linked plots ─────────
-- Replaces the flat 3 bbl/tick/pump model from 20270443. The only
-- delta is the "Extraction" block (step 1): instead of `pumps × 3`,
-- we group pumps by linked_plot_id, then for each plot we extract
-- LEAST(3 × pump_count, plot.crude_present) and decrement the plot.
-- Unlinked pumps and pumps on dry plots contribute 0.
--
-- Lock ordering: corp row FOR UPDATE (same as before) + plot rows
-- FOR UPDATE in plot_id order so two concurrent corp loops can't
-- deadlock on the same shared plot.
CREATE OR REPLACE FUNCTION public.process_oil_and_gas(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_corp                 RECORD;
    v_link                 RECORD;
    v_avail                int;
    v_extracted            int;
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
        -- 1. Extraction: per linked plot, draw min(3 × pumps, crude).
        v_crude_produced := 0;
        FOR v_link IN
            SELECT linked_plot_id, COUNT(*)::int AS pump_count
              FROM corp_buildings
             WHERE owner_corp_id    = v_corp.id
               AND building_type    = 'pump_jack'
               AND status           = 'completed'
               AND linked_plot_id IS NOT NULL
             GROUP BY linked_plot_id
             ORDER BY linked_plot_id  -- deterministic lock order
        LOOP
            SELECT crude_present INTO v_avail
              FROM nation_oil_plots
             WHERE id = v_link.linked_plot_id
             FOR UPDATE;
            IF v_avail IS NULL OR v_avail <= 0 THEN
                CONTINUE;
            END IF;
            v_extracted := LEAST(v_link.pump_count * 3, v_avail);
            UPDATE nation_oil_plots
               SET crude_present = crude_present - v_extracted
             WHERE id = v_link.linked_plot_id;
            v_crude_produced := v_crude_produced + v_extracted;
        END LOOP;

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
        -- Pull from crude_reserve PLUS what pumps just produced; the
        -- refinery is processing this tick's intake immediately if there's
        -- room in the same tick (no one-tick lag between pump and refine).
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
        UPDATE entrepreneur_corps
           SET crude_reserve   = crude_reserve   + v_crude_produced - v_refined_made,
               refined_reserve = refined_reserve + v_refined_made   - v_sold_to_stations,
               treasury_cash   = COALESCE(treasury_cash, 0) + v_retail_revenue,
               oil_last_processed_tick = p_tick
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

COMMENT ON FUNCTION public.process_oil_and_gas(int) IS
    'Per-tick production processor for Oil & Gas corps. Phase 4B: pumps only produce when linked to a surveyed plot with crude > 0; each plot draws LEAST(3 × pumps_on_plot, plot.crude_present) and decrements the plot. Unlinked/dry pumps contribute 0. Refineries crude_reserve → refined_reserve (up to capacity); gas stations refined_reserve → treasury at retail. Idempotent (oil_last_processed_tick). Service-role only; called from advance-corp-tick.';

-- ── 3. Player RPC: link a pump to a plot ───────────────────────────
-- Owner-only. Gates: caller controls the building's corp, building
-- is a completed pump_jack, plot is in the corp's HQ nation, plot is
-- surveyed and has crude > 0. Idempotent on re-link (just overwrites).
CREATE OR REPLACE FUNCTION public.link_pump_to_plot(
    p_building_id uuid,
    p_plot_id     uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pump      corp_buildings%ROWTYPE;
    v_plot      nation_oil_plots%ROWTYPE;
    v_corp      entrepreneur_corps%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pump FROM corp_buildings WHERE id = p_building_id FOR UPDATE;
    IF v_pump.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_pump.building_type <> 'pump_jack' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_a_pump');
    END IF;
    IF v_pump.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'pump_not_completed');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_pump.owner_corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.owner_faction_id NOT IN (
        SELECT id FROM factions WHERE id = v_uid OR linked_user_id = v_uid
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT * INTO v_plot FROM nation_oil_plots WHERE id = p_plot_id;
    IF v_plot.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plot_not_found');
    END IF;
    IF v_plot.nation_id <> v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plot_outside_nation');
    END IF;
    IF NOT v_plot.surveyed THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plot_not_surveyed');
    END IF;
    IF v_plot.crude_present <= 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plot_depleted');
    END IF;

    UPDATE corp_buildings SET linked_plot_id = p_plot_id WHERE id = v_pump.id;

    RETURN jsonb_build_object(
        'success',       true,
        'building_id',   v_pump.id,
        'plot_id',       v_plot.id,
        'plot_name',     v_plot.name,
        'crude_present', v_plot.crude_present
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_pump_to_plot(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.link_pump_to_plot(uuid, uuid) IS
    'Oil & Gas corp owner-only: bind a completed pump_jack to a surveyed plot in the corp''s HQ nation. Gates on plot.surveyed + crude_present > 0 + plot in same nation. Re-link OK (overwrites). Pump only produces while linked; see process_oil_and_gas.';

-- ── 4. Player RPC: unlink a pump from its plot ─────────────────────
CREATE OR REPLACE FUNCTION public.unlink_pump_from_plot(
    p_building_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pump      corp_buildings%ROWTYPE;
    v_corp      entrepreneur_corps%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pump FROM corp_buildings WHERE id = p_building_id FOR UPDATE;
    IF v_pump.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_pump.building_type <> 'pump_jack' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_a_pump');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_pump.owner_corp_id;
    IF v_corp.id IS NULL OR v_corp.owner_faction_id NOT IN (
        SELECT id FROM factions WHERE id = v_uid OR linked_user_id = v_uid
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    UPDATE corp_buildings SET linked_plot_id = NULL WHERE id = v_pump.id;

    RETURN jsonb_build_object('success', true, 'building_id', v_pump.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlink_pump_from_plot(uuid) TO authenticated;

COMMENT ON FUNCTION public.unlink_pump_from_plot(uuid) IS
    'Oil & Gas corp owner-only: clear a pump_jack''s linked_plot_id. Pump stops producing until re-linked.';

NOTIFY pgrst, 'reload schema';

COMMIT;
