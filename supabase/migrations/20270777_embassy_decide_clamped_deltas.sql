-- ════════════════════════════════════════════════════════════════════
-- 20270777 — embassy_event_decide: report clamped deltas
--
-- Follow-up to 20270776, which already shipped to the remote — the
-- audit-pass fix lands here as its own version instead of editing the
-- applied file (editing an applied migration desyncs the supabase
-- migration history and broke db push with a duplicate-version error).
--
-- The fix: the result envelope's 'applied' array reported the
-- AUTHORED amount, not the post-clamp movement — a maxed stat hit
-- with "Up by 5" showed a +5 that didn't happen in the player's
-- result modal. Each effect now records new-minus-previous after
-- clamping and zero-change lines are dropped. Body otherwise
-- byte-faithful to 20270776.
--
-- KNOWN ISSUE (pre-existing, factions-wide): the "Factions update
-- own" / "Users can update linked factions" policies let owners
-- UPDATE any column on their factions row, so the embassy stats are
-- client-writable the same way politician_reputation / party_funds
-- already are. Column-level hardening is a separate project.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.embassy_event_decide(
    p_faction_id   uuid,
    p_draw_id      uuid,
    p_decision_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_draw      embassy_event_draws%ROWTYPE;
    v_tick      int;
    v_decision  jsonb;
    v_eff       jsonb;
    v_stat      text;
    v_amt       numeric;
    v_delta     numeric;
    v_prev      numeric;
    v_budget    numeric;
    v_rep       int;
    v_trust     int;
    v_lev       int;
    v_applied   jsonb := '[]'::jsonb;
    v_full_name text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_draw_id IS NULL OR p_decision_key IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_draw FROM embassy_event_draws
     WHERE id = p_draw_id
     FOR UPDATE;
    IF v_draw.id IS NULL OR v_draw.faction_id <> v_pol.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'draw_not_found');
    END IF;
    IF v_draw.resolved_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_resolved',
            'decision_key', v_draw.decision_key);
    END IF;

    SELECT d INTO v_decision
      FROM jsonb_array_elements(v_draw.decisions) d
     WHERE d->>'key' = upper(p_decision_key)
     LIMIT 1;
    IF v_decision IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_decision');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    v_budget := COALESCE(v_pol.embassy_budget,     100);
    v_rep    := COALESCE(v_pol.embassy_reputation, 50);
    v_trust  := COALESCE(v_pol.embassy_trust,      50);
    v_lev    := COALESCE(v_pol.embassy_leverage,   50);

    -- 'applied' reports the ACTUAL post-clamp movement, not the
    -- authored amount — a maxed stat hit with "Up by 5" shows no
    -- line rather than a +5 that didn't happen.
    FOR v_eff IN SELECT * FROM jsonb_array_elements(COALESCE(v_decision->'effects', '[]'::jsonb)) LOOP
        v_stat := v_eff->>'stat';
        v_amt  := COALESCE((v_eff->>'amount')::numeric, 0);
        IF v_amt <= 0 THEN CONTINUE; END IF;
        v_delta := CASE WHEN v_eff->>'direction' = 'down' THEN -v_amt ELSE v_amt END;
        IF v_stat = 'budget' THEN
            v_prev   := v_budget;
            v_budget := GREATEST(0, v_budget + v_delta);
            v_delta  := v_budget - v_prev;
        ELSIF v_stat = 'reputation' THEN
            v_prev  := v_rep;
            v_rep   := LEAST(100, GREATEST(0, v_rep + round(v_delta)::int));
            v_delta := v_rep - v_prev;
        ELSIF v_stat = 'trust' THEN
            v_prev   := v_trust;
            v_trust  := LEAST(100, GREATEST(0, v_trust + round(v_delta)::int));
            v_delta  := v_trust - v_prev;
        ELSIF v_stat = 'leverage' THEN
            v_prev  := v_lev;
            v_lev   := LEAST(100, GREATEST(0, v_lev + round(v_delta)::int));
            v_delta := v_lev - v_prev;
        ELSE
            CONTINUE;
        END IF;
        IF v_delta <> 0 THEN
            v_applied := v_applied || jsonb_build_array(jsonb_build_object(
                'stat', v_stat, 'delta', v_delta));
        END IF;
    END LOOP;

    UPDATE factions
       SET embassy_budget     = v_budget,
           embassy_reputation = v_rep,
           embassy_trust      = v_trust,
           embassy_leverage   = v_lev
     WHERE id = v_pol.id;

    UPDATE embassy_event_draws
       SET decision_key     = upper(p_decision_key),
           resolved_at_tick = v_tick
     WHERE id = v_draw.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' || COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'An attaché');
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick, 'embassy_event_resolved', v_draw.title,
        jsonb_build_object('draw_id', v_draw.id, 'decision_key', upper(p_decision_key),
                           'applied', v_applied)
    );

    -- nation_id is the politician's HOME nation — same posture as the
    -- FS exam rows (20270765): the dispatch lands on their domestic
    -- timeline, not the host nation's world feed.
    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key, fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        v_draw.title,
        v_full_name || ' handled an incident at the embassy in '
            || COALESCE(v_draw.vars->>'city', 'the capital') || ', '
            || COALESCE(v_draw.vars->>'nation', 'a foreign nation')
            || ' — chose option ' || upper(p_decision_key) || '.',
        'politician', 'politician_embassy_event', v_tick
    );

    RETURN jsonb_build_object(
        'success',      true,
        'decision_key', upper(p_decision_key),
        'applied',      v_applied,
        'embassy',      jsonb_build_object(
            'budget',     v_budget,
            'reputation', v_rep,
            'trust',      v_trust,
            'leverage',   v_lev
        )
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.embassy_event_decide(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.embassy_event_decide(uuid, uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
