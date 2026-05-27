-- ════════════════════════════════════════════════════════════════════
-- RESOLVE ENGINE — conceding a claim transfers the rung's slice of the stake
-- ════════════════════════════════════════════════════════════════════
-- The stake is the contested resource (e.g. 2 Farmland) PLUS a slice of the
-- claimant's population (rolled 1D3 % at press). When the claimant CONCEDES,
-- the standing demand_rung decides how much of that stake actually moves from
-- the claimant to the pressor — softer demands hand over less:
--   1 Full Cession        land ×1.00   population ×1.00
--   2 Administrative Ctrl  land ×0.75   population ×0.75
--   3 Joint Condominium    land ×0.50   population ×0.50
--   4 Resource Rights      land ×0.25   population ×0   (a sliver of output, no people)
-- The rich "sovereignty / recurring tribute" depth is a later pass; v1 is a
-- one-time transfer of real nation quantities (farmland/minerals/energy +
-- population). Going to war / white-peace ceasefire transfer nothing — this is
-- only the "claimant says yes" path.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Population stake (1D3 %), rolled on the insert trigger ────────────────
ALTER TABLE bilateral_issues
    ADD COLUMN IF NOT EXISTS population_stake_pct SMALLINT;
REVOKE UPDATE (population_stake_pct) ON public.bilateral_issues FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.bilateral_issue_start_clock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.issue_type = 'territorial_ownership' THEN
        IF NEW.decision_deadline_tick IS NULL AND NEW.created_tick IS NOT NULL THEN
            NEW.decision_deadline_tick := NEW.created_tick + 6;
        END IF;
        IF NEW.population_stake_pct IS NULL THEN
            NEW.population_stake_pct := 1 + floor(random() * 3)::int;   -- 1..3
        END IF;
    END IF;
    RETURN NEW;
END; $$;

-- Backfill live disputes that predate the column.
UPDATE bilateral_issues SET population_stake_pct = 1 + floor(random() * 3)::int
 WHERE issue_type = 'territorial_ownership' AND status IN ('active', 'partial')
   AND population_stake_pct IS NULL;

-- ── 2. concede_claim v2 — resolve + transfer the rung's slice of the stake ───
CREATE OR REPLACE FUNCTION public.concede_claim(p_issue_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_caller    UUID := auth.uid();
    v_nation    UUID;          -- the conceding claimant
    v_pressor   UUID;
    v_issue     bilateral_issues%ROWTYPE;
    v_tick      INT;
    v_res       TEXT;
    v_land_tier NUMERIC;
    v_pop_tier  NUMERIC;
    v_land_amt  NUMERIC;
    v_land_have NUMERIC;
    v_claim_pop NUMERIC;
    v_pop_amt   NUMERIC;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.'); END IF;
    v_nation := dispute_actor_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the head of government may manage territorial disputes.'); END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims can be conceded here.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    IF v_issue.administering_nation_id IS DISTINCT FROM v_nation THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the claimant can concede.'); END IF;

    v_pressor := v_issue.initiative_nation_id;
    v_res     := v_issue.stake_resource;

    -- Tier by the standing demand rung.
    CASE v_issue.demand_rung
        WHEN 1 THEN v_land_tier := 1.00; v_pop_tier := 1.00;
        WHEN 2 THEN v_land_tier := 0.75; v_pop_tier := 0.75;
        WHEN 3 THEN v_land_tier := 0.50; v_pop_tier := 0.50;
        WHEN 4 THEN v_land_tier := 0.25; v_pop_tier := 0.00;
        ELSE        v_land_tier := 0.00; v_pop_tier := 0.00;
    END CASE;

    -- Resource transfer (claimant → pressor), clamped to what the claimant
    -- actually holds so the pressor can never gain more than the claimant loses
    -- (the stake quantity is rolled independently of real holdings). %I columns
    -- come from the validated stake_resource set only.
    v_land_amt := round(COALESCE(v_issue.stake_quantity, 0) * v_land_tier);
    IF v_pressor IS NOT NULL AND v_land_amt > 0 AND v_res IN ('farmland', 'minerals', 'energy') THEN
        EXECUTE format('SELECT GREATEST(0, COALESCE(%I, 0)) FROM nations WHERE id = $1', v_res) INTO v_land_have USING v_nation;
        v_land_amt := LEAST(v_land_amt, COALESCE(v_land_have, 0));
        IF v_land_amt > 0 THEN
            EXECUTE format('UPDATE nations SET %I = COALESCE(%I,0) - $1 WHERE id = $2', v_res, v_res) USING v_land_amt, v_nation;
            EXECUTE format('UPDATE nations SET %I = COALESCE(%I,0) + $1 WHERE id = $2', v_res, v_res) USING v_land_amt, v_pressor;
        END IF;
    END IF;

    -- Population transfer (a slice of the claimant's CURRENT population).
    SELECT COALESCE(population, 0) INTO v_claim_pop FROM nations WHERE id = v_nation;
    v_pop_amt := round(v_claim_pop * (COALESCE(v_issue.population_stake_pct, 0) / 100.0) * v_pop_tier);
    IF v_pressor IS NOT NULL AND v_pop_amt > 0 THEN
        UPDATE nations SET population = GREATEST(0, COALESCE(population, 0) - v_pop_amt) WHERE id = v_nation;
        UPDATE nations SET population = COALESCE(population, 0) + v_pop_amt WHERE id = v_pressor;
    END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    UPDATE bilateral_issues SET status = 'resolved', resolved_tick = v_tick, updated_at = NOW() WHERE id = p_issue_id;
    UPDATE bilateral_issue_modifiers SET is_active = false, resolved_by = 'issue_resolved', resolved_tick = v_tick
     WHERE issue_id = p_issue_id AND is_active = true;

    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata, caused_by_nation_id)
    VALUES (p_issue_id, v_tick, 'status_changed', 'The claimant conceded the demand — the dispute is resolved.',
        jsonb_build_object('action', 'concede_claim', 'status', 'resolved', 'granted_rung', v_issue.demand_rung,
            'resource', v_res, 'resource_transferred', v_land_amt, 'population_transferred', v_pop_amt), v_nation);

    RETURN jsonb_build_object('ok', true, 'message', 'Claim conceded.',
        'granted_rung', v_issue.demand_rung, 'resource_transferred', v_land_amt, 'population_transferred', v_pop_amt);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;

GRANT EXECUTE ON FUNCTION public.concede_claim(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
