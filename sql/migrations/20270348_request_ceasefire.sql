-- ════════════════════════════════════════════════════════════════════
-- REQUEST CEASEFIRE — white peace, by mutual consent, ends an active war
-- ════════════════════════════════════════════════════════════════════
-- A belligerent's FOREIGN MINISTER offers a ceasefire on a war it is fighting.
-- The OTHER belligerent's HEAD OF GOVERNMENT accepts or rejects (in the War
-- Room). Neither side can end the war alone — it takes one offer + the other's
-- acceptance. On accept it is a WHITE PEACE: relation flips war → neutral
-- (fronts derive-inactive, combat stops), war state resets, no territory changes
-- hands, and any territorial dispute that escalated into this war closes.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE diplomatic_relations
    ADD COLUMN IF NOT EXISTS ceasefire_offer_nation_id UUID REFERENCES nations(id);
-- Lock against direct client writes — only the gated RPCs (as owner) and the
-- service-role tick touch it.
REVOKE UPDATE (ceasefire_offer_nation_id) ON public.diplomatic_relations FROM PUBLIC, anon, authenticated;

-- ── request_ceasefire: a belligerent's Foreign Minister sues for peace ───────
CREATE OR REPLACE FUNCTION public.request_ceasefire(p_target_nation_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_nation UUID;
    v_a UUID;
    v_b UUID;
    v_rel diplomatic_relations%ROWTYPE;
BEGIN
    v_nation := foreign_ministry_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the Foreign Ministry can request a ceasefire.'); END IF;
    IF p_target_nation_id IS NULL OR p_target_nation_id = v_nation THEN RETURN jsonb_build_object('ok', false, 'message', 'Pick the nation you are at war with.'); END IF;

    v_a := LEAST(v_nation, p_target_nation_id);
    v_b := GREATEST(v_nation, p_target_nation_id);
    SELECT * INTO v_rel FROM diplomatic_relations WHERE nation_a_id = v_a AND nation_b_id = v_b FOR UPDATE;
    IF v_rel.nation_a_id IS NULL OR v_rel.relation_type <> 'war' THEN
        RETURN jsonb_build_object('ok', false, 'message', 'You are not at war with that nation.');
    END IF;

    UPDATE diplomatic_relations SET ceasefire_offer_nation_id = v_nation, updated_at = NOW()
     WHERE nation_a_id = v_a AND nation_b_id = v_b;
    RETURN jsonb_build_object('ok', true, 'message', 'Ceasefire requested.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;
GRANT EXECUTE ON FUNCTION public.request_ceasefire(UUID) TO authenticated;

-- ── respond_ceasefire: the OTHER belligerent's head of government decides ────
CREATE OR REPLACE FUNCTION public.respond_ceasefire(p_other_nation_id UUID, p_accept BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_nation UUID;
    v_a UUID;
    v_b UUID;
    v_rel diplomatic_relations%ROWTYPE;
    v_tick INT;
BEGIN
    v_nation := dispute_actor_nation();
    IF v_nation IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Only the head of government can respond to a ceasefire.'); END IF;
    IF p_other_nation_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'No counterpart nation.'); END IF;

    v_a := LEAST(v_nation, p_other_nation_id);
    v_b := GREATEST(v_nation, p_other_nation_id);
    SELECT * INTO v_rel FROM diplomatic_relations WHERE nation_a_id = v_a AND nation_b_id = v_b FOR UPDATE;
    IF v_rel.nation_a_id IS NULL OR v_rel.relation_type <> 'war' THEN RETURN jsonb_build_object('ok', false, 'message', 'You are not at war with that nation.'); END IF;
    IF v_rel.ceasefire_offer_nation_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'There is no ceasefire offer to respond to.'); END IF;
    IF v_rel.ceasefire_offer_nation_id = v_nation THEN RETURN jsonb_build_object('ok', false, 'message', 'You proposed this ceasefire — the other side must respond.'); END IF;

    IF NOT p_accept THEN
        UPDATE diplomatic_relations SET ceasefire_offer_nation_id = NULL, updated_at = NOW()
         WHERE nation_a_id = v_a AND nation_b_id = v_b;
        RETURN jsonb_build_object('ok', true, 'ceasefire', 'rejected');
    END IF;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    -- White peace: end the war, reset war state. Fronts are derived from
    -- relation_type='war', so flipping it to neutral stops the fighting.
    UPDATE diplomatic_relations
       SET relation_type = 'neutral', ceasefire_offer_nation_id = NULL,
           war_declared_at_tick = NULL, war_justification = NULL,
           war_score_a = 0, war_score_b = 0, updated_at = NOW()
     WHERE nation_a_id = v_a AND nation_b_id = v_b;
    -- Close the territorial dispute that escalated into this war (if any).
    UPDATE bilateral_issues SET status = 'resolved', resolved_tick = v_tick, updated_at = NOW()
     WHERE issue_type = 'territorial_ownership' AND status = 'escalated'
       AND nation_a_id = v_a AND nation_b_id = v_b;
    -- Dispatch to both nations' event logs.
    INSERT INTO event_log (nation_id, event_name, trigger_key, description_chosen, category, fired_at_tick)
    VALUES (v_a, 'Ceasefire', 'ceasefire', 'A ceasefire has ended the war — white peace, no territory changes hands.', 'crisis', v_tick),
           (v_b, 'Ceasefire', 'ceasefire', 'A ceasefire has ended the war — white peace, no territory changes hands.', 'crisis', v_tick);
    RETURN jsonb_build_object('ok', true, 'ceasefire', 'accepted');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END; $$;
GRANT EXECUTE ON FUNCTION public.respond_ceasefire(UUID, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
