-- Rescale the oil-plot survey tier table to a geometric ladder
-- anchored at generational = raw 19-20.
--
-- Was (20270473):
--   v_modified := v_d20 - 5 + v_bonus;  -- range -4..15 with bonus 0
--   modified <= -2  dry          (raw 1-3,  15%)
--   modified <= 2   small        (raw 4-7,  20%)
--   modified <= 8   moderate     (raw 8-13, 30%)
--   modified <= 13  large        (raw 14-18,25%)
--   else            generational (raw 19-20,10%)
--
-- Now: drop the -5 offset and use a geometric distribution where
-- each higher tier is rarer than the last. With bonus 0:
--   raw 1-10   dry          (50%)
--   raw 11-15  small        (25%)
--   raw 16-17  moderate     (10%)
--   raw 18     large         (5%)
--   raw 19-20  generational (10%)
--
-- Bonus still adds 1:1 to the roll, so paying ~$90M-$180M can
-- still push a poor roll to generational. The crude_present
-- ranges per tier are unchanged.

BEGIN;

CREATE OR REPLACE FUNCTION public.survey_oil_plot(
    p_plot_id     uuid,
    p_extra_bonus int DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_corp      entrepreneur_corps%ROWTYPE;
    v_plot      nation_oil_plots%ROWTYPE;
    v_tick      int;
    v_bonus     int;
    v_cost      bigint;
    v_d20       int;
    v_modified  int;
    v_tier      text;
    v_crude     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    v_bonus := GREATEST(0, COALESCE(p_extra_bonus, 0));
    v_cost  := 5000000 + (v_bonus * 10000000)::bigint;

    SELECT * INTO v_corp
      FROM entrepreneur_corps
     WHERE owner_faction_id IN (
            SELECT id FROM factions WHERE id = v_uid OR linked_user_id = v_uid
         )
       AND industry = 'oil_and_gas'
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_oil_corp');
    END IF;

    SELECT * INTO v_plot
      FROM nation_oil_plots
     WHERE id = p_plot_id
     FOR UPDATE;
    IF v_plot.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plot_not_found');
    END IF;
    IF v_plot.nation_id <> v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plot_outside_nation');
    END IF;
    IF v_plot.surveyed THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_surveyed');
    END IF;

    IF COALESCE(v_corp.treasury_cash, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_corp.treasury_cash, 0), 'need', v_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    v_d20      := 1 + floor(random() * 20)::int;
    v_modified := v_d20 + v_bonus;

    IF    v_modified <= 10 THEN v_tier := 'dry';          v_crude := 0;
    ELSIF v_modified <= 15 THEN v_tier := 'small';        v_crude := 100 + floor(random() * 200)::int;
    ELSIF v_modified <= 17 THEN v_tier := 'moderate';     v_crude := 300 + floor(random() * 300)::int;
    ELSIF v_modified <= 18 THEN v_tier := 'large';        v_crude := 600 + floor(random() * 250)::int;
    ELSE                        v_tier := 'generational'; v_crude := 850 + floor(random() * 150)::int;
    END IF;

    UPDATE entrepreneur_corps
       SET treasury_cash = treasury_cash - v_cost
     WHERE id = v_corp.id;

    UPDATE nation_oil_plots
       SET surveyed            = true,
           surveyed_at_tick    = v_tick,
           surveyed_by_faction = v_corp.owner_faction_id,
           tier                = v_tier,
           crude_present       = v_crude
     WHERE id = v_plot.id;

    RETURN jsonb_build_object(
        'success',       true,
        'plot_id',       v_plot.id,
        'plot_name',     v_plot.name,
        'roll_d20',      v_d20,
        'modified_roll', v_modified,
        'bonus_paid',    v_bonus,
        'cost_paid',     v_cost,
        'tier',          v_tier,
        'crude_present', v_crude
    );
END;
$$;

COMMENT ON FUNCTION public.survey_oil_plot(uuid, int) IS
    'Oil & Gas corp action: survey a plot in the corp''s home nation. Cost = $5M + $10M × p_extra_bonus. Roll = 1d20 + bonus → tier on raw scale (dry 1-10 / small 11-15 / moderate 16-17 / large 18 / generational 19-20) + crude_present (3-digit bbl count). Gates on plot-not-yet-surveyed + plot in corp''s nation + treasury can afford. SECURITY DEFINER; FOR UPDATE on both corp and plot rows serialises a double-fire.';

NOTIFY pgrst, 'reload schema';

COMMIT;
