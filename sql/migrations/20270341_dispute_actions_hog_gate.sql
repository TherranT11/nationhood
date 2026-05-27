-- ════════════════════════════════════════════════════════════════════
-- DISPUTE ACTIONS → HEAD-OF-GOVERNMENT GATE
-- ════════════════════════════════════════════════════════════════════
-- Deciding a territorial dispute (concede ground, soften/drop a demand, extend
-- the ultimatum, go to war) is a sovereign call — it now belongs to the nation's
-- HEAD OF GOVERNMENT: the Prime Minister in a parliamentary system, or the
-- President in a presidential one (same office test as declare_war). It is no
-- longer the Foreign Ministry's to make.
--
-- dispute_actor_nation() is the single authority: it returns the nation the
-- caller governs (HoG or President), else NULL. Both these RPCs and the
-- issues-panel UI gate read it, so server and client can't drift.
--
-- Pressing a NEW claim (press_claim) is unchanged — that stays a Foreign
-- Ministry action.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Single authority: the nation the caller leads, or NULL ───────────────────
CREATE OR REPLACE FUNCTION public.dispute_actor_nation()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT f.nation_id FROM factions f
   WHERE (f.id = auth.uid() OR f.linked_user_id = auth.uid())
     AND f.faction_type = 'party'
     AND (EXISTS (SELECT 1 FROM head_of_government h
                   WHERE h.nation_id = f.nation_id AND h.faction_id = f.id AND h.active)
          OR EXISTS (SELECT 1 FROM presidents p
                      WHERE p.nation_id = f.nation_id AND p.faction_id = f.id AND p.is_active))
   LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.dispute_actor_nation() TO authenticated;

-- ── PRESSOR: soften the demand one rung ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.soften_demand(p_issue_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_nation UUID;
    v_issue  bilateral_issues%ROWTYPE;
    v_tick   INT;
    v_new    SMALLINT;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.'); END IF;
    v_nation := dispute_actor_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the head of government may manage territorial disputes.'); END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims have a demand ladder.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    IF v_issue.initiative_nation_id IS DISTINCT FROM v_nation THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the pressor can soften the demand.'); END IF;
    IF v_issue.demand_rung >= 4 THEN RETURN jsonb_build_object('ok', false, 'message', 'Already at the floor (Resource Rights) — drop the claim instead.'); END IF;

    v_new := v_issue.demand_rung + 1;
    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    UPDATE bilateral_issues SET demand_rung = v_new, updated_at = NOW() WHERE id = p_issue_id;
    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata, caused_by_nation_id)
    VALUES (p_issue_id, v_tick, 'action_executed', 'The pressor softened the demand.',
        jsonb_build_object('action', 'soften_demand', 'from_rung', v_issue.demand_rung, 'to_rung', v_new), v_nation);
    RETURN jsonb_build_object('ok', true, 'demand_rung', v_new);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;
GRANT EXECUTE ON FUNCTION public.soften_demand(UUID) TO authenticated;

-- ── PRESSOR: back down — drop the claim (penalty + 360-tick re-press cooldown) ─
CREATE OR REPLACE FUNCTION public.drop_claim(p_issue_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_nation UUID;
    v_issue  bilateral_issues%ROWTYPE;
    v_tick   INT;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.'); END IF;
    v_nation := dispute_actor_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the head of government may manage territorial disputes.'); END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims can be dropped here.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    IF v_issue.initiative_nation_id IS DISTINCT FROM v_nation THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the pressor can drop the claim.'); END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    UPDATE bilateral_issues
       SET status = 'dormant', resolved_tick = v_tick, dropped_tick = v_tick, updated_at = NOW()
     WHERE id = p_issue_id;
    UPDATE nations
       SET gov_approval_events = COALESCE(gov_approval_events, 0) - 25,
           civil_unrest        = LEAST(100, COALESCE(civil_unrest, 50) + 10)
     WHERE id = v_nation;
    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata, caused_by_nation_id)
    VALUES (p_issue_id, v_tick, 'status_changed', 'The pressor dropped the claim.',
        jsonb_build_object('action', 'drop_claim', 'status', 'dormant', 'cooldown_ticks', 360,
            'approval_delta', -25, 'unrest_delta', 10), v_nation);
    RETURN jsonb_build_object('ok', true, 'message', 'Claim dropped.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;
GRANT EXECUTE ON FUNCTION public.drop_claim(UUID) TO authenticated;

-- ── PRESSOR: press harder — burn one tick off the clock ──────────────────────
CREATE OR REPLACE FUNCTION public.press_harder(p_issue_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_nation UUID;
    v_issue  bilateral_issues%ROWTYPE;
    v_tick   INT;
    v_new    INT;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.'); END IF;
    v_nation := dispute_actor_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the head of government may manage territorial disputes.'); END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims have a clock.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    IF v_issue.initiative_nation_id IS DISTINCT FROM v_nation THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the pressor can press harder.'); END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_new := GREATEST(v_tick + 1, COALESCE(v_issue.decision_deadline_tick, v_tick + 6) - 1);
    IF v_new >= COALESCE(v_issue.decision_deadline_tick, v_tick + 6) THEN
        RETURN jsonb_build_object('ok', false, 'message', 'The clock is already down to its last tick — pull the trigger or back down.');
    END IF;

    UPDATE bilateral_issues SET decision_deadline_tick = v_new, updated_at = NOW() WHERE id = p_issue_id;
    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata, caused_by_nation_id)
    VALUES (p_issue_id, v_tick, 'action_executed', 'The pressor pressed harder — the clock tightens.',
        jsonb_build_object('action', 'press_harder', 'deadline_tick', v_new), v_nation);
    RETURN jsonb_build_object('ok', true, 'deadline_tick', v_new);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;
GRANT EXECUTE ON FUNCTION public.press_harder(UUID) TO authenticated;

-- ── PRESSOR: extend the deadline (+2 ticks, −8 approval) ──────────────────────
CREATE OR REPLACE FUNCTION public.extend_deadline(p_issue_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_nation UUID;
    v_issue  bilateral_issues%ROWTYPE;
    v_tick   INT;
    v_new    INT;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.'); END IF;
    v_nation := dispute_actor_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the head of government may manage territorial disputes.'); END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims have a clock.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    IF v_issue.initiative_nation_id IS DISTINCT FROM v_nation THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the pressor can extend the deadline.'); END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_new := GREATEST(v_tick, COALESCE(v_issue.decision_deadline_tick, v_tick)) + 2;
    UPDATE bilateral_issues SET decision_deadline_tick = v_new, updated_at = NOW() WHERE id = p_issue_id;
    UPDATE nations SET gov_approval_events = COALESCE(gov_approval_events, 0) - 8 WHERE id = v_nation;
    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata, caused_by_nation_id)
    VALUES (p_issue_id, v_tick, 'action_executed', 'The pressor extended the deadline — the public tires of the delay.',
        jsonb_build_object('action', 'extend_deadline', 'deadline_tick', v_new, 'approval_delta', -8), v_nation);
    RETURN jsonb_build_object('ok', true, 'deadline_tick', v_new);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;
GRANT EXECUTE ON FUNCTION public.extend_deadline(UUID) TO authenticated;

-- ── PRESSOR: go to war — collapse the clock so the tick fires the war ────────
CREATE OR REPLACE FUNCTION public.go_to_war(p_issue_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_nation UUID;
    v_issue  bilateral_issues%ROWTYPE;
    v_tick   INT;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.'); END IF;
    v_nation := dispute_actor_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the head of government may manage territorial disputes.'); END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims escalate this way.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    IF v_issue.initiative_nation_id IS DISTINCT FROM v_nation THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the pressor can go to war.'); END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    UPDATE bilateral_issues SET decision_deadline_tick = v_tick, updated_at = NOW() WHERE id = p_issue_id;
    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata, caused_by_nation_id)
    VALUES (p_issue_id, v_tick, 'action_executed', 'The pressor chose war — the ultimatum is at its end.',
        jsonb_build_object('action', 'go_to_war', 'deadline_tick', v_tick), v_nation);
    RETURN jsonb_build_object('ok', true, 'message', 'War will begin at the next tick.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;
GRANT EXECUTE ON FUNCTION public.go_to_war(UUID) TO authenticated;

-- ── CLAIMANT: concede the demand — resolve in the pressor's favour ───────────
CREATE OR REPLACE FUNCTION public.concede_claim(p_issue_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_nation UUID;
    v_issue  bilateral_issues%ROWTYPE;
    v_tick   INT;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.'); END IF;
    v_nation := dispute_actor_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the head of government may manage territorial disputes.'); END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims can be conceded here.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    IF v_issue.administering_nation_id IS DISTINCT FROM v_nation THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the claimant can concede.'); END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    UPDATE bilateral_issues
       SET status = 'resolved', resolved_tick = v_tick, updated_at = NOW()
     WHERE id = p_issue_id;
    UPDATE bilateral_issue_modifiers
       SET is_active = false, resolved_by = 'issue_resolved', resolved_tick = v_tick
     WHERE issue_id = p_issue_id AND is_active = true;
    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata, caused_by_nation_id)
    VALUES (p_issue_id, v_tick, 'status_changed', 'The claimant conceded the demand — the dispute is resolved.',
        jsonb_build_object('action', 'concede_claim', 'status', 'resolved', 'granted_rung', v_issue.demand_rung), v_nation);
    RETURN jsonb_build_object('ok', true, 'message', 'Claim conceded.', 'granted_rung', v_issue.demand_rung);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;
GRANT EXECUTE ON FUNCTION public.concede_claim(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
