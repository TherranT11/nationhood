-- Oil-plot permits: leases on surveyed (and unsurveyed) plots.
--
-- Each plot can be permitted to one oil_and_gas corp at a time for
-- 1-25 years. Players pick a dollar offer + duration; the offer must
-- meet a scarcity-driven minimum that scales with how many of the
-- nation's plots are already permitted. Tier and survey status feed
-- into the per-year base.
--
-- Pricing — single source: oil_plot_min_bid_per_year(plot_id)
--   per_year = $5,000,000 × tier_mult × scarcity_mult
--   tier_mult:
--     dry             0.2
--     small           1.0
--     moderate        2.0
--     large           4.0
--     generational    8.0
--     NULL/unsurveyed 1.0  (risk-priced; bidder doesn't know tier)
--   scarcity_mult = LEAST(5.0, total_plots / max(1, total - owned))
--     8-plot nation: 1.0× empty → 5.0× last plot (capped)
--   total_min = per_year × p_years
--
-- The acquire RPC gates on owner-of-corp, plot not already permitted,
-- offer >= total_min, treasury can cover offer. Atomic: locks corp +
-- plot row, debits treasury, writes the permit fields. Expiry is
-- denormalised (permit_expires_at_tick = acquired + years × 12 ticks).
-- No automatic enforcement of expiry yet — that's a tick-processor
-- follow-up once the lease mechanic gets used.

BEGIN;

ALTER TABLE nation_oil_plots
    ADD COLUMN IF NOT EXISTS permit_holder_corp_id   uuid REFERENCES entrepreneur_corps(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS permit_amount_paid      bigint,
    ADD COLUMN IF NOT EXISTS permit_years            int CHECK (permit_years IS NULL OR (permit_years BETWEEN 1 AND 25)),
    ADD COLUMN IF NOT EXISTS permit_acquired_at_tick int,
    ADD COLUMN IF NOT EXISTS permit_expires_at_tick  int;

REVOKE UPDATE (permit_holder_corp_id, permit_amount_paid, permit_years, permit_acquired_at_tick, permit_expires_at_tick)
    ON nation_oil_plots FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_nation_oil_plots_holder
    ON nation_oil_plots (permit_holder_corp_id) WHERE permit_holder_corp_id IS NOT NULL;

COMMENT ON COLUMN nation_oil_plots.permit_holder_corp_id IS
    'oil_and_gas corp currently leasing this plot. NULL = open for bidding ("Private Owner" in UI). Set by oil_plot_acquire_permit; FK ON DELETE SET NULL so plot survives if corp folds.';

-- ── Min bid per year — single source for UI + RPC ───────────────────
CREATE OR REPLACE FUNCTION public.oil_plot_min_bid_per_year(p_plot_id uuid)
RETURNS bigint
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_plot      nation_oil_plots%ROWTYPE;
    v_total     int;
    v_owned     int;
    v_scarcity  numeric;
    v_tier_mult numeric;
BEGIN
    SELECT * INTO v_plot FROM nation_oil_plots WHERE id = p_plot_id;
    IF v_plot.id IS NULL THEN RETURN 0; END IF;

    SELECT COUNT(*) INTO v_total FROM nation_oil_plots WHERE nation_id = v_plot.nation_id;
    SELECT COUNT(*) INTO v_owned FROM nation_oil_plots
     WHERE nation_id = v_plot.nation_id AND permit_holder_corp_id IS NOT NULL;

    v_scarcity := LEAST(5.0, v_total::numeric / GREATEST(1, v_total - v_owned));

    v_tier_mult := CASE COALESCE(v_plot.tier, 'unsurveyed')
        WHEN 'dry'          THEN 0.2
        WHEN 'small'        THEN 1.0
        WHEN 'moderate'     THEN 2.0
        WHEN 'large'        THEN 4.0
        WHEN 'generational' THEN 8.0
        ELSE 1.0
    END;

    RETURN (5000000 * v_tier_mult * v_scarcity)::bigint;
END;
$$;

GRANT EXECUTE ON FUNCTION public.oil_plot_min_bid_per_year(uuid) TO authenticated;

COMMENT ON FUNCTION public.oil_plot_min_bid_per_year(uuid) IS
    'Minimum per-year bid for an oil-plot permit. base $5M × tier_mult (dry 0.2 / small 1 / moderate 2 / large 4 / generational 8 / unsurveyed 1) × scarcity (capped at 5×). UI and oil_plot_acquire_permit both call this.';

-- ── Acquire permit ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.oil_plot_acquire_permit(
    p_plot_id uuid,
    p_amount  bigint,
    p_years   int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_corp      entrepreneur_corps%ROWTYPE;
    v_plot      nation_oil_plots%ROWTYPE;
    v_tick      int;
    v_min_year  bigint;
    v_min_total bigint;
    v_expires   int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_years IS NULL OR p_years < 1 OR p_years > 25 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_years');
    END IF;
    IF p_amount IS NULL OR p_amount < 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE owner_faction_id IN (SELECT id FROM factions WHERE id = v_uid OR linked_user_id = v_uid)
       AND industry = 'oil_and_gas'
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_oil_corp');
    END IF;

    SELECT * INTO v_plot FROM nation_oil_plots WHERE id = p_plot_id FOR UPDATE;
    IF v_plot.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'plot_not_found');
    END IF;
    IF v_plot.permit_holder_corp_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_permitted');
    END IF;

    v_min_year  := oil_plot_min_bid_per_year(p_plot_id);
    v_min_total := v_min_year * p_years;
    IF p_amount < v_min_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'amount_too_low',
            'minimum', v_min_total, 'offered', p_amount, 'per_year_min', v_min_year);
    END IF;

    IF COALESCE(v_corp.treasury_cash, 0) < p_amount THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_corp.treasury_cash, 0), 'need', p_amount);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_expires := v_tick + (p_years * 12);

    UPDATE entrepreneur_corps SET treasury_cash = treasury_cash - p_amount WHERE id = v_corp.id;

    UPDATE nation_oil_plots
       SET permit_holder_corp_id   = v_corp.id,
           permit_amount_paid      = p_amount,
           permit_years            = p_years,
           permit_acquired_at_tick = v_tick,
           permit_expires_at_tick  = v_expires
     WHERE id = v_plot.id;

    RETURN jsonb_build_object(
        'success',         true,
        'plot_id',         v_plot.id,
        'plot_name',       v_plot.name,
        'amount_paid',     p_amount,
        'years',           p_years,
        'expires_at_tick', v_expires
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.oil_plot_acquire_permit(uuid, bigint, int) TO authenticated;

COMMENT ON FUNCTION public.oil_plot_acquire_permit(uuid, bigint, int) IS
    'Oil & Gas corp owner-only: acquire a lease permit on a plot. Gates: plot not already permitted, offer >= oil_plot_min_bid_per_year × years, treasury can cover offer. Lease ends at acquired_tick + years × 12.';

NOTIFY pgrst, 'reload schema';

COMMIT;
