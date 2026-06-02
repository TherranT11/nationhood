-- Restore the pump-vs-plot nation gate on link_pump_to_plot.
--
-- 20270482 replaced the original v_plot.nation_id <> v_corp.hq_nation_id
-- gate with a permit-ownership check, but lost the implicit physical
-- rule that the pump itself must be in the same nation as the plot.
-- The UI modal still filters candidates by pump.nation_id === plot.nation_id,
-- but a direct RPC call bypassing the UI could link a pump in nation A
-- to a permitted plot in nation B — a Calveth pump "extracting" Hajjara
-- crude. process_oil_and_gas would then quietly produce barrels off a
-- pump that isn't physically there.
--
-- Adds one IF guard: pump.nation_id must equal plot.nation_id. Returns
-- 'wrong_nation' so the UI can map it cleanly. Everything else
-- byte-for-byte from 20270482.

BEGIN;

CREATE OR REPLACE FUNCTION public.link_pump_to_plot(
    p_building_id uuid,
    p_plot_id     uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_pump corp_buildings%ROWTYPE;
    v_plot nation_oil_plots%ROWTYPE;
    v_corp entrepreneur_corps%ROWTYPE;
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
    IF v_pump.nation_id <> v_plot.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_nation');
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

NOTIFY pgrst, 'reload schema';

COMMIT;
