-- ════════════════════════════════════════════════════════════════
-- Construction GDP bonus RPC.
--
-- Whenever a construction project completes — Regional HQ, any of the
-- four Aviation Manufacturing assembly plants, sports stadiums from
-- the Sports Ministry, or any future build path — the host nation
-- gains a small, one-time GDP_growth bump on that tick.
--
-- Trust-the-caller posture: callable by both authenticated user
-- sessions (player-triggered builds via expansion.html) AND the
-- service_role per-tick processor (server-side stadium completion
-- sweep). No witness validation against corp_properties / event_log /
-- etc., because the same RPC needs to serve sports stadiums (no
-- corp_properties row) plus future build paths we haven't seen yet.
-- The +0.1 default is small enough that drive-by abuse is bounded;
-- larger awards require an explicit p_delta override at the call site,
-- which is reviewable. Anonymous-public calls can't reach the
-- function because GRANT EXECUTE is gated to authenticated /
-- service_role.
--
-- Idempotent CREATE OR REPLACE. Re-running just refreshes the
-- function definition.
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION award_construction_gdp_bonus(
    p_nation_id UUID,
    p_delta     NUMERIC DEFAULT 0.1
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_gdp NUMERIC;
BEGIN
    -- No auth.uid() check: trust-the-caller, and the per-tick
    -- processor calls this as service_role (no auth.uid()) for
    -- server-completed builds like sports stadiums.
    IF p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'nation_id required');
    END IF;

    UPDATE nations
       SET gdp_growth = LEAST(100, GREATEST(0, COALESCE(gdp_growth, 50) + p_delta))
     WHERE id = p_nation_id
    RETURNING gdp_growth INTO v_new_gdp;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nation not found');
    END IF;

    RETURN jsonb_build_object(
        'success',        true,
        'nation_id',      p_nation_id,
        'delta',          p_delta,
        'new_gdp_growth', v_new_gdp
    );
END;
$$;

GRANT EXECUTE ON FUNCTION award_construction_gdp_bonus(UUID, NUMERIC) TO authenticated;

COMMENT ON FUNCTION award_construction_gdp_bonus(UUID, NUMERIC) IS
    'Trust-the-caller construction GDP bonus. Bumps nations.gdp_growth by p_delta (default +0.1), clamped to [0, 100]. Called from any construction-completion path: Regional HQ build, Aviation Manufacturing plant builds, Sports Ministry stadium construction, etc. Same shape lets future build paths reuse it without per-sector RPC sprawl.';

NOTIFY pgrst, 'reload schema';

COMMIT;
