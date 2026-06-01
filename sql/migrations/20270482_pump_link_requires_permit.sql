-- Gate pump-to-plot linking + per-tick extraction on permit ownership.
--
-- Surveying a plot reveals its tier + crude reserve, but extracting
-- requires holding the permit (oil_plot_acquire_permit / 20270481).
-- Pre-this-migration a corp could link any pump to any surveyed plot
-- in the same nation — misleading: survey is information, not title.
--
-- Changes
-- ───────
-- 1. link_pump_to_plot now requires the calling corp to hold the
--    plot's permit (nation_oil_plots.permit_holder_corp_id =
--    p_corp_id). Plot still must be surveyed with crude > 0; the
--    nation-match gate falls out of the permit check (you can only
--    bid on plots in nations you have presence in).
-- 2. process_oil_and_gas now skips linked plots where the pump's
--    owner corp doesn't currently hold the permit. Existing links
--    aren't auto-cleared — they just produce 0 bbl, same as a
--    depleted plot. Players can manually unlink, or let the row sit
--    inert until the pump is reassigned.
--
-- The rest of process_oil_and_gas (refinery cap, gas station retail,
-- treasury credit, oil_last_processed_tick) is byte-for-byte from
-- 20270474.

BEGIN;

-- ── 1. link_pump_to_plot: add permit-holder gate ────────────────────
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
    IF v_plot.permit_holder_corp_id IS DISTINCT FROM v_corp.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_permit');
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
    'Oil & Gas corp owner-only: bind a completed pump_jack to a plot where the corp holds the permit (nation_oil_plots.permit_holder_corp_id = corp.id) and the plot is surveyed with crude > 0. Re-link OK (overwrites). Pump only produces while linked AND while the corp still holds the permit; see process_oil_and_gas.';

-- ── 2. process_oil_and_gas: skip non-permitted plots ────────────────
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
        -- 1. Extraction: per linked plot we currently hold the permit on,
        --    draw min(3 × pumps_on_plot, crude). Pumps linked to plots
        --    where the permit has lapsed or transferred produce 0 — link
        --    stays put, but extraction is gated on title.
        v_crude_produced := 0;
        FOR v_link IN
            SELECT cb.linked_plot_id, COUNT(*)::int AS pump_count
              FROM corp_buildings cb
              JOIN nation_oil_plots p ON p.id = cb.linked_plot_id
             WHERE cb.owner_corp_id    = v_corp.id
               AND cb.building_type    = 'pump_jack'
               AND cb.status           = 'completed'
               AND cb.linked_plot_id IS NOT NULL
               AND p.permit_holder_corp_id = v_corp.id
             GROUP BY cb.linked_plot_id
             ORDER BY cb.linked_plot_id
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

        -- 2. Refining capacity (unchanged from 20270474).
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

        -- 3. Gas station retail (unchanged).
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

        -- 4. Commit deltas (unchanged).
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
    'Per-tick processor for Oil & Gas. Pumps only produce when linked AND the corp currently holds the plot''s permit. LEAST(3 × pumps_on_plot, crude_present) drawn per plot per tick. Refining + retail unchanged. Idempotent (oil_last_processed_tick). Service-role only.';

NOTIFY pgrst, 'reload schema';

COMMIT;
