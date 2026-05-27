-- ════════════════════════════════════════════════════════════════════
-- MEDIATION HANDSHAKE — a third party brokers, both belligerents must accept
-- ════════════════════════════════════════════════════════════════════
-- A third party's FM offering to mediate (stance 'mediate') opens a pending
-- offer. BOTH belligerent heads of government must accept it (respond_mediation).
-- When both accept: that nation becomes the sole mediator, the decision clock
-- gains +6 ticks, and the mediator's FM + HoG may post to the head-of-state
-- channel. Either side rejecting clears the offer. One mediator per dispute.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Mediation state ──────────────────────────────────────────────────────────
ALTER TABLE bilateral_issues
    ADD COLUMN IF NOT EXISTS mediator_nation_id        UUID REFERENCES nations(id),
    ADD COLUMN IF NOT EXISTS mediation_offer_nation_id UUID REFERENCES nations(id),
    ADD COLUMN IF NOT EXISTS mediation_accept_a        BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS mediation_accept_b        BOOLEAN NOT NULL DEFAULT false;

-- Locked against direct client writes — only the gated RPCs (as owner) and the
-- service-role tick touch these.
REVOKE UPDATE (mediator_nation_id, mediation_offer_nation_id, mediation_accept_a, mediation_accept_b)
    ON public.bilateral_issues FROM PUBLIC, anon, authenticated;

-- ── set_issue_stance v2 — 'mediate' opens a pending offer ────────────────────
CREATE OR REPLACE FUNCTION public.set_issue_stance(p_issue_id UUID, p_stance TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_nation   UUID;
    v_issue    bilateral_issues%ROWTYPE;
    v_claimant UUID;
    v_pressor  UUID;
    v_prev     TEXT;
BEGIN
    v_nation := foreign_ministry_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the Foreign Ministry can set a stance.'); END IF;
    IF p_stance NOT IN ('support_claimant','support_pressor','condemn_claimant','condemn_pressor','mediate','neutral') THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Invalid stance.');
    END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.issue_type <> 'territorial_ownership' THEN RETURN jsonb_build_object('ok', false, 'message', 'Only territorial disputes have stances.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    IF v_nation IN (v_issue.nation_a_id, v_issue.nation_b_id) THEN
        RETURN jsonb_build_object('ok', false, 'message', 'A party to the dispute cannot take a third-party stance.');
    END IF;

    v_claimant := v_issue.administering_nation_id;
    v_pressor  := v_issue.initiative_nation_id;

    SELECT stance INTO v_prev FROM bilateral_issue_stances WHERE issue_id = p_issue_id AND nation_id = v_nation;

    IF v_prev IS DISTINCT FROM p_stance THEN
        IF    p_stance = 'support_claimant' THEN PERFORM dispute_nudge_relation(v_nation, v_claimant,  8); PERFORM dispute_nudge_relation(v_nation, v_pressor,  -8);
        ELSIF p_stance = 'support_pressor'  THEN PERFORM dispute_nudge_relation(v_nation, v_pressor,   8); PERFORM dispute_nudge_relation(v_nation, v_claimant, -8);
        ELSIF p_stance = 'condemn_claimant' THEN PERFORM dispute_nudge_relation(v_nation, v_claimant, -15);
        ELSIF p_stance = 'condemn_pressor'  THEN PERFORM dispute_nudge_relation(v_nation, v_pressor,  -15);
        END IF;
    END IF;

    IF p_stance = 'neutral' THEN
        DELETE FROM bilateral_issue_stances WHERE issue_id = p_issue_id AND nation_id = v_nation;
    ELSE
        INSERT INTO bilateral_issue_stances (issue_id, nation_id, stance)
        VALUES (p_issue_id, v_nation, p_stance)
        ON CONFLICT (issue_id, nation_id) DO UPDATE SET stance = EXCLUDED.stance, updated_at = NOW();
    END IF;

    -- Mediation offer bookkeeping. Open a pending offer only when none is seated
    -- and none pending; withdraw it if this nation was the pending offerer.
    IF p_stance = 'mediate' THEN
        IF v_issue.mediator_nation_id IS NULL AND v_issue.mediation_offer_nation_id IS NULL THEN
            UPDATE bilateral_issues
               SET mediation_offer_nation_id = v_nation, mediation_accept_a = false, mediation_accept_b = false, updated_at = NOW()
             WHERE id = p_issue_id;
        END IF;
    ELSIF v_prev = 'mediate' AND v_issue.mediation_offer_nation_id = v_nation THEN
        UPDATE bilateral_issues
           SET mediation_offer_nation_id = NULL, mediation_accept_a = false, mediation_accept_b = false, updated_at = NOW()
         WHERE id = p_issue_id;
    END IF;

    RETURN jsonb_build_object('ok', true, 'stance', p_stance);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;

GRANT EXECUTE ON FUNCTION public.set_issue_stance(UUID, TEXT) TO authenticated;

-- ── respond_mediation — a belligerent HoG accepts or rejects the offer ───────
CREATE OR REPLACE FUNCTION public.respond_mediation(p_issue_id UUID, p_accept BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_nation UUID;
    v_issue  bilateral_issues%ROWTYPE;
    v_tick   INT;
    v_a      BOOLEAN;
    v_b      BOOLEAN;
BEGIN
    v_nation := dispute_actor_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the head of government can respond to mediation.'); END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id FOR UPDATE;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.status NOT IN ('active', 'partial') THEN RETURN jsonb_build_object('ok', false, 'message', 'This dispute is no longer open.'); END IF;
    IF v_issue.mediation_offer_nation_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'There is no mediation offer to respond to.'); END IF;
    IF v_nation NOT IN (v_issue.nation_a_id, v_issue.nation_b_id) THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Only a party to the dispute can respond.');
    END IF;

    IF NOT p_accept THEN
        UPDATE bilateral_issues
           SET mediation_offer_nation_id = NULL, mediation_accept_a = false, mediation_accept_b = false, updated_at = NOW()
         WHERE id = p_issue_id;
        RETURN jsonb_build_object('ok', true, 'mediation', 'rejected');
    END IF;

    v_a := v_issue.mediation_accept_a;
    v_b := v_issue.mediation_accept_b;
    IF v_nation = v_issue.nation_a_id THEN v_a := true; ELSE v_b := true; END IF;

    IF v_a AND v_b THEN
        SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
        UPDATE bilateral_issues
           SET mediator_nation_id = mediation_offer_nation_id,
               mediation_offer_nation_id = NULL,
               mediation_accept_a = false, mediation_accept_b = false,
               decision_deadline_tick = GREATEST(COALESCE(decision_deadline_tick, v_tick), v_tick) + 6,
               updated_at = NOW()
         WHERE id = p_issue_id;
        RETURN jsonb_build_object('ok', true, 'mediation', 'accepted');
    ELSE
        UPDATE bilateral_issues SET mediation_accept_a = v_a, mediation_accept_b = v_b, updated_at = NOW() WHERE id = p_issue_id;
        RETURN jsonb_build_object('ok', true, 'mediation', 'pending');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;

GRANT EXECUTE ON FUNCTION public.respond_mediation(UUID, BOOLEAN) TO authenticated;

-- ── send_issue_message v2 — belligerent HoGs + the mediator (FM or HoG) ──────
CREATE OR REPLACE FUNCTION public.send_issue_message(p_issue_id UUID, p_body TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_issue  bilateral_issues%ROWTYPE;
    v_hog    UUID;
    v_fm     UUID;
    v_sender UUID;
    v_tick   INT;
    v_body   TEXT;
    v_id     UUID;
BEGIN
    v_body := btrim(COALESCE(p_body, ''));
    IF v_body = '' THEN RETURN jsonb_build_object('ok', false, 'message', 'Message is empty.'); END IF;
    IF length(v_body) > 1000 THEN v_body := left(v_body, 1000); END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;

    v_hog := dispute_actor_nation();
    v_fm  := foreign_ministry_nation();

    IF    v_hog IS NOT NULL AND v_hog IN (v_issue.nation_a_id, v_issue.nation_b_id) THEN v_sender := v_hog;  -- belligerent HoG
    ELSIF v_issue.mediator_nation_id IS NOT NULL AND v_hog = v_issue.mediator_nation_id THEN v_sender := v_hog;  -- mediator HoG
    ELSIF v_issue.mediator_nation_id IS NOT NULL AND v_fm  = v_issue.mediator_nation_id THEN v_sender := v_fm;   -- mediator FM
    ELSE RETURN jsonb_build_object('ok', false, 'message', 'Only the belligerent heads of government or the mediator may post.'); END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    INSERT INTO bilateral_issue_messages (issue_id, sender_nation_id, body, sent_at_tick)
    VALUES (p_issue_id, v_sender, v_body, v_tick) RETURNING id INTO v_id;
    RETURN jsonb_build_object('ok', true, 'id', v_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;

GRANT EXECUTE ON FUNCTION public.send_issue_message(UUID, TEXT) TO authenticated;

-- ── Channel READ now includes the mediator nation's factions ─────────────────
DROP POLICY IF EXISTS bim_read ON bilateral_issue_messages;
CREATE POLICY bim_read ON bilateral_issue_messages FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM bilateral_issues bi
     WHERE bi.id = bilateral_issue_messages.issue_id
       AND EXISTS (SELECT 1 FROM factions f
                    WHERE (f.id = auth.uid() OR f.linked_user_id = auth.uid())
                      AND f.nation_id IN (bi.nation_a_id, bi.nation_b_id, bi.mediator_nation_id))
));

NOTIFY pgrst, 'reload schema';

COMMIT;
