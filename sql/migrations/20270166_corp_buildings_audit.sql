-- ════════════════════════════════════════════════════════════════════
-- CONSTRUCTION v0 — audit hardening: trust the shard, not the caller
-- ════════════════════════════════════════════════════════════════════
-- Second-pass audit fix on 20270165's complete_finished_buildings.
-- The previous version gated completion on the caller-supplied
-- p_tick parameter (mirroring finalize_expired_board_requests'
-- pattern from 20270160). Since GRANT EXECUTE is held by
-- authenticated, any signed-in user could pass an arbitrarily large
-- p_tick and fast-complete their own in-progress buildings — which
-- materialises the +0.2 GDP_Growth bump on the host nation ahead of
-- schedule and short-circuits the build-duration economy.
--
-- This rewrite reads current_tick from shard inside the function and
-- uses that as the authoritative gate. p_tick is kept in the
-- signature for caller ergonomics (the tick processor's 3.6e block
-- passes its newTick) but is no longer trusted by the SQL — it
-- becomes an audit hint, not an input. Body otherwise verbatim.
--
-- Same exploit lives in finalize_expired_board_requests (20270160)
-- and process_expired_petitions (older). Those stay as-is — fixing
-- them is a separate hardening pass that needs explicit approval.
--
-- Idempotent (CREATE OR REPLACE). No schema change.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.complete_finished_buildings(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r          RECORD;
    v_count    int := 0;
    v_corp     RECORD;
    v_nation   text;
    v_tick     int;
BEGIN
    -- Authoritative tick from the shard. p_tick is accepted (the
    -- tick processor passes newTick for symmetry with other
    -- finalize handlers) but DELIBERATELY ignored for the gate so
    -- an authenticated caller cannot fast-complete their buildings
    -- by passing a future tick. The shard's current_tick is the
    -- single source of truth for "now".
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR r IN
        SELECT id, builder_corp_id, nation_id, name, tier, cost_paid,
               gdp_growth_applied
          FROM corp_buildings
         WHERE status = 'in_progress' AND completes_at_tick <= v_tick
         FOR UPDATE
    LOOP
        UPDATE corp_buildings
           SET status            = 'completed',
               completed_at_tick = v_tick,
               gdp_growth_applied = true
         WHERE id = r.id;

        IF NOT r.gdp_growth_applied THEN
            UPDATE nations
               SET gdp_growth = COALESCE(gdp_growth, 0) + 0.2
             WHERE id = r.nation_id;
        END IF;

        SELECT c.name, c.owner_faction_id INTO v_corp
          FROM entrepreneur_corps c WHERE c.id = r.builder_corp_id;
        SELECT name INTO v_nation FROM nations WHERE id = r.nation_id;

        INSERT INTO event_log (
            nation_id, faction_id, event_name, description_used,
            category, trigger_key, effects_applied, fired_at_tick
        ) VALUES (
            r.nation_id, v_corp.owner_faction_id,
            'Construction Completed',
            format('%s has completed %s in %s. GDP growth ticks up.',
                   v_corp.name, r.name, v_nation),
            'corporate', 'construction_completed',
            jsonb_build_object(
                'building_id',     r.id,
                'corp_id',         r.builder_corp_id,
                'corp_name',       v_corp.name,
                'tier',            r.tier,
                'cost',            r.cost_paid,
                'gdp_growth_bump', 0.2
            ),
            v_tick
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'completed', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_finished_buildings(int) TO authenticated;

COMMENT ON FUNCTION public.complete_finished_buildings(int) IS
    'Idempotent tick handler — flips in_progress→completed for any corp_buildings row whose completes_at_tick has elapsed PER THE SHARD, applies +0.2 GDP_Growth one-time (gdp_growth_applied flag), logs the event. p_tick is accepted as a hint but ignored for the gate (the shard.current_tick is authoritative; prevents authenticated callers from fast-completing buildings by passing a future tick). Called from advance-tick (3.6e); safe to call lazily.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270165 to restore the p_tick-trusted version. NOT
-- recommended — the prior behaviour is exploitable.
