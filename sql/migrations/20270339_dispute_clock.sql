-- ════════════════════════════════════════════════════════════════════
-- DISPUTE DECISION CLOCK — the territorial dispute's resolution spine
-- ════════════════════════════════════════════════════════════════════
-- A pressed territorial claim now carries a 6-tick decision clock. It is the
-- SINGLE war trigger for territorial disputes: passive tension no longer
-- escalates them (see js/game/issues.js — the tension-10 path is now incidents
-- only). The clock resolves the dispute one of four ways:
--
--   PRESSOR doors          claimant
--   ──────────────         ──────────────
--   GO TO WAR  (go_to_war) CONCEDE  (concede_claim) → dispute resolved, pressor
--     collapses the clock    granted the standing demand_rung
--     so the tick fires     STAND STRONG → no-op; let the clock run
--     startWarFromIssue
--   BACK DOWN (drop_claim — reused) → dispute dropped, −25 approval / +10 unrest
--
--   PRESSOR levers: press_harder (−1 tick) · extend_deadline (+2 ticks, −8 appr)
--
-- At expiry with nothing resolved, the tick auto-goes-to-war (the clock running
-- out IS the casus belli). All war-starts still flow through the one JS writer
-- setNationsAtWar via startWarFromIssue — go_to_war just brings the deadline to
-- "now" so the next tick fires it. The on-acceptance territory/resource transfer
-- (what a demand_rung MEANS) remains the resolve-engine's later pass; concede
-- here records the granted rung and closes the dispute.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Column ────────────────────────────────────────────────────────────────
-- The tick at which the pressor must have resolved the dispute or it auto-goes to
-- war. NULL for non-territorial issues (they have no clock).
ALTER TABLE bilateral_issues
    ADD COLUMN IF NOT EXISTS decision_deadline_tick INT;

-- ── 2. Start the clock on every new territorial claim ────────────────────────
-- A BEFORE INSERT trigger keeps press_claim untouched (DRY): any territorial
-- dispute opens with deadline = created_tick + 6. created_tick is stamped by
-- press_claim to the current tick.
CREATE OR REPLACE FUNCTION public.bilateral_issue_start_clock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.issue_type = 'territorial_ownership'
       AND NEW.decision_deadline_tick IS NULL
       AND NEW.created_tick IS NOT NULL THEN
        NEW.decision_deadline_tick := NEW.created_tick + 6;
    END IF;
    RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_bilateral_issue_start_clock ON bilateral_issues;
CREATE TRIGGER trg_bilateral_issue_start_clock
    BEFORE INSERT ON bilateral_issues
    FOR EACH ROW EXECUTE FUNCTION public.bilateral_issue_start_clock();

-- ── 3. Backfill live territorial disputes that predate the clock ─────────────
-- Give legacy disputes a FRESH clock from now (current_tick + 6), not
-- created_tick + 6 — otherwise an old dispute's deadline would already be in the
-- past and it would jump straight to war on the next tick.
UPDATE bilateral_issues
   SET decision_deadline_tick = (SELECT COALESCE(current_tick, 0) FROM shard WHERE name = 'Alpha Shard' LIMIT 1) + 6
 WHERE issue_type = 'territorial_ownership'
   AND status IN ('active', 'partial')
   AND decision_deadline_tick IS NULL;

-- ── 4. Shared guard: caller must hold the Foreign Ministry of `which` side ───
-- Returns the dispute row (locked) when the caller's party holds the active
-- Foreign Ministry of the required side ('pressor' = initiative, 'claimant' =
-- administering), else raises a clean exception the RPCs convert to {ok:false}.
-- Inlined per-RPC below rather than a helper — plpgsql can't easily return both
-- a rowtype and an error string, and the dispute must be locked FOR UPDATE in
-- the caller's own transaction.

-- ── 5. press_harder: pressor burns one tick off the clock ────────────────────
CREATE OR REPLACE FUNCTION public.press_harder(p_issue_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller   UUID := auth.uid();
    v_ministry ministries%ROWTYPE;
    v_nation   UUID;
    v_issue    bilateral_issues%ROWTYPE;
    v_tick     INT;
    v_new      INT;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.'); END IF;

    SELECT * INTO v_ministry FROM ministries
     WHERE ministry_key = 'foreign' AND is_active = true
       AND EXISTS (SELECT 1 FROM factions f WHERE f.id = ministries.party_id
                    AND (f.id = v_caller OR f.linked_user_id = v_caller));
    IF v_ministry.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Your party does not hold the Foreign Ministry.'); END IF;
    v_nation := v_ministry.nation_id;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims have a clock.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    IF v_issue.initiative_nation_id IS DISTINCT FROM v_nation THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the pressor can press harder.'); END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    -- Floor at tick+1: pressing harder tightens the screw but never itself starts
    -- the war — that is the GO-TO-WAR door's job.
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

-- ── 6. extend_deadline: pressor adds 2 ticks for −8 approval ─────────────────
CREATE OR REPLACE FUNCTION public.extend_deadline(p_issue_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller   UUID := auth.uid();
    v_ministry ministries%ROWTYPE;
    v_nation   UUID;
    v_issue    bilateral_issues%ROWTYPE;
    v_tick     INT;
    v_new      INT;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.'); END IF;

    SELECT * INTO v_ministry FROM ministries
     WHERE ministry_key = 'foreign' AND is_active = true
       AND EXISTS (SELECT 1 FROM factions f WHERE f.id = ministries.party_id
                    AND (f.id = v_caller OR f.linked_user_id = v_caller));
    IF v_ministry.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Your party does not hold the Foreign Ministry.'); END IF;
    v_nation := v_ministry.nation_id;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims have a clock.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    IF v_issue.initiative_nation_id IS DISTINCT FROM v_nation THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the pressor can extend the deadline.'); END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_new := GREATEST(v_tick, COALESCE(v_issue.decision_deadline_tick, v_tick)) + 2;

    UPDATE bilateral_issues SET decision_deadline_tick = v_new, updated_at = NOW() WHERE id = p_issue_id;

    -- −8 approval on the pressor nation (same event-bucket path drop_claim uses).
    UPDATE nations SET gov_approval_events = COALESCE(gov_approval_events, 0) - 8 WHERE id = v_nation;

    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata, caused_by_nation_id)
    VALUES (p_issue_id, v_tick, 'action_executed', 'The pressor extended the deadline — the public tires of the delay.',
        jsonb_build_object('action', 'extend_deadline', 'deadline_tick', v_new, 'approval_delta', -8), v_nation);

    RETURN jsonb_build_object('ok', true, 'deadline_tick', v_new);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;

GRANT EXECUTE ON FUNCTION public.extend_deadline(UUID) TO authenticated;

-- ── 7. go_to_war: pressor pulls the trigger — collapse the clock to now ──────
-- The tick's clock-expiry branch (issues.js) then fires startWarFromIssue →
-- setNationsAtWar, the single war-state writer. No SQL duplicates that logic.
CREATE OR REPLACE FUNCTION public.go_to_war(p_issue_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller   UUID := auth.uid();
    v_ministry ministries%ROWTYPE;
    v_nation   UUID;
    v_issue    bilateral_issues%ROWTYPE;
    v_tick     INT;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.'); END IF;

    SELECT * INTO v_ministry FROM ministries
     WHERE ministry_key = 'foreign' AND is_active = true
       AND EXISTS (SELECT 1 FROM factions f WHERE f.id = ministries.party_id
                    AND (f.id = v_caller OR f.linked_user_id = v_caller));
    IF v_ministry.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Your party does not hold the Foreign Ministry.'); END IF;
    v_nation := v_ministry.nation_id;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims escalate this way.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    IF v_issue.initiative_nation_id IS DISTINCT FROM v_nation THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the pressor can go to war.'); END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Bring the deadline to "now" so the next tick's expiry branch starts the war.
    UPDATE bilateral_issues SET decision_deadline_tick = v_tick, updated_at = NOW() WHERE id = p_issue_id;

    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata, caused_by_nation_id)
    VALUES (p_issue_id, v_tick, 'action_executed', 'The pressor chose war — the ultimatum is at its end.',
        jsonb_build_object('action', 'go_to_war', 'deadline_tick', v_tick), v_nation);

    RETURN jsonb_build_object('ok', true, 'message', 'War will begin at the next tick.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;

GRANT EXECUTE ON FUNCTION public.go_to_war(UUID) TO authenticated;

-- ── 8. concede_claim: claimant accepts the standing demand → dispute resolved ─
-- The claimant is the administering nation (holds the ground). Conceding closes
-- the dispute in the pressor's favour at the current demand_rung. The mechanical
-- effect of that rung (territory / administration / condominium / resource share)
-- is the resolve-engine's later pass; here we record the granted rung and close.
CREATE OR REPLACE FUNCTION public.concede_claim(p_issue_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller   UUID := auth.uid();
    v_ministry ministries%ROWTYPE;
    v_nation   UUID;
    v_issue    bilateral_issues%ROWTYPE;
    v_tick     INT;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.'); END IF;

    SELECT * INTO v_ministry FROM ministries
     WHERE ministry_key = 'foreign' AND is_active = true
       AND EXISTS (SELECT 1 FROM factions f WHERE f.id = ministries.party_id
                    AND (f.id = v_caller OR f.linked_user_id = v_caller));
    IF v_ministry.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Your party does not hold the Foreign Ministry.'); END IF;
    v_nation := v_ministry.nation_id;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial claims can be conceded here.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    -- Only the CLAIMANT (administering nation) can concede.
    IF v_issue.administering_nation_id IS DISTINCT FROM v_nation THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the claimant can concede.'); END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- Resolve in the pressor's favour. Modifiers are deactivated to match the
    -- tick's resolve/escalate teardown.
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
