-- ════════════════════════════════════════════════════════════════════
-- OFFICER ACTION DISPATCHES — each army officer action writes a Military event
-- ════════════════════════════════════════════════════════════════════
-- The nine officer actions (army_officer_action) ran silently. Now each, on
-- success, writes an event_log dispatch to the issuing nation. The event feed
-- buckets anything with a trigger_key prefixed 'military_' into the Military tab
-- (category 'government', same as the commander-appointment dispatches). Body
-- reproduced from 20270340 (v3 effects) with a per-action narrative + the insert.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.army_officer_action(p_faction_id UUID, p_action TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user    UUID := auth.uid();
    v_fac     factions%ROWTYPE;
    v_effects JSONB;
    v_eff     JSONB;
    v_col     TEXT;
    v_delta   NUMERIC;
    v_cost    NUMERIC;
    v_tick    INT;
    v_last    INT;
    v_cd      INT := 12;
    v_meta    JSONB;
    v_name    TEXT;
    v_text    TEXT;
    -- Written dispatches, one per action (Military event feed). One source.
    v_events  JSONB := '{
        "forward_stockpiling":     {"name": "Forward Stockpiling",     "text": "Quartermasters crammed the forward depots to bursting — supply swells, but the overloaded transport net groans and slows."},
        "logistics_overhaul":      {"name": "Logistics Overhaul",      "text": "Convoys and motor pools were re-rationalised for throughput; existing stockpiles were burned through in the reshuffle."},
        "intensive_drills":        {"name": "Intensive Drills",        "text": "Grueling drill cycles sharpened the army''s edge — combat skill rose as exhausted, resentful troops frayed and some washed out."},
        "internal_security_sweep": {"name": "Internal Security Sweep", "text": "A security sweep rooted out defeatists and informants; the ranks closed up, but a climate of surveillance corroded professional trust and thinned the rolls."},
        "doctrine_reform":         {"name": "Doctrine Reform",         "text": "The field manual was rewritten and standards enforced — the officer corps sharpened, though doctrine focus pulled troops off the live-fire range."},
        "requisition_drive":       {"name": "Requisition Drive",       "text": "A hard requisition drive filled the depots; supply rose as heavy-handed seizure ground morale and spurred desertion."},
        "comforts_and_rations":    {"name": "Comforts & Rations",      "text": "Hot food, rest, and comforts were issued across the force — morale lifted and stragglers rejoined as the depots drew down."},
        "field_improvisation":     {"name": "Field Improvisation",     "text": "Routes were improvised and every hand pressed into hauling; cargo moved, but standards slipped and the command staff was sidelined."},
        "standardize_procedures":  {"name": "Standardize Procedures",  "text": "Strict doctrine and paperwork were imposed — professional standards and staff sharpened, while the transport net bogged down in process."}
    }'::jsonb;
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

    CASE p_action
        WHEN 'forward_stockpiling'     THEN v_cost := 4000000; v_effects :=
            '[{"col":"army_supplies","d":5},{"col":"army_logistics","d":-5}]';
        WHEN 'logistics_overhaul'      THEN v_cost := 6000000; v_effects :=
            '[{"col":"army_logistics","d":5},{"col":"army_supplies","d":-5}]';
        WHEN 'intensive_drills'        THEN v_cost := 5000000; v_effects :=
            '[{"col":"army_training","d":5},{"col":"army_cohesion","d":-5},{"col":"army_manpower","d":-1000}]';
        WHEN 'internal_security_sweep' THEN v_cost := 6000000; v_effects :=
            '[{"col":"army_cohesion","d":5},{"col":"army_professionalism","d":-5},{"col":"army_manpower","d":-1000}]';
        WHEN 'doctrine_reform'         THEN v_cost := 7500000; v_effects :=
            '[{"col":"army_professionalism","d":5},{"col":"army_training","d":-5},{"col":"army_officer_corps","d":3}]';
        WHEN 'requisition_drive'       THEN v_cost := 5000000; v_effects :=
            '[{"col":"army_supplies","d":5},{"col":"army_cohesion","d":-5},{"col":"army_manpower","d":-1000}]';
        WHEN 'comforts_and_rations'    THEN v_cost := 5000000; v_effects :=
            '[{"col":"army_cohesion","d":5},{"col":"army_supplies","d":-5},{"col":"army_manpower","d":1000}]';
        WHEN 'field_improvisation'     THEN v_cost := 6000000; v_effects :=
            '[{"col":"army_logistics","d":5},{"col":"army_professionalism","d":-5},{"col":"army_officer_corps","d":-3}]';
        WHEN 'standardize_procedures'  THEN v_cost := 7000000; v_effects :=
            '[{"col":"army_professionalism","d":5},{"col":"army_logistics","d":-5},{"col":"army_officer_corps","d":3}]';
        ELSE RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
    END CASE;

    SELECT * INTO v_fac FROM factions WHERE id = p_faction_id FOR UPDATE;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Faction not found'); END IF;
    IF v_fac.faction_type <> 'military' OR v_fac.branch <> 'army' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not an army faction');
    END IF;
    IF NOT is_admin() AND v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not command this army');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';
    v_tick := COALESCE(v_tick, 0);
    v_last := (v_fac.officer_action_cooldowns->>p_action)::int;
    IF v_last IS NOT NULL AND v_tick < v_last + v_cd THEN
        RETURN jsonb_build_object('success', false, 'error',
            format('On cooldown — ready in %s tick(s)', v_last + v_cd - v_tick), 'ready_at_tick', v_last + v_cd);
    END IF;

    IF COALESCE(v_fac.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'error',
            format('Insufficient Army Funds: $%s available, $%s required',
                   round(COALESCE(v_fac.party_funds, 0) / 1000000.0, 1), round(v_cost / 1000000.0, 1)));
    END IF;

    FOR v_eff IN SELECT * FROM jsonb_array_elements(v_effects) LOOP
        v_col   := v_eff->>'col';
        v_delta := (v_eff->>'d')::numeric;
        IF v_col = 'army_manpower' THEN
            EXECUTE format('UPDATE factions SET %I = GREATEST(0, COALESCE(%I,0) + $1) WHERE id = $2', v_col, v_col)
                USING v_delta, p_faction_id;
        ELSE
            EXECUTE format('UPDATE factions SET %I = LEAST(100, GREATEST(0, COALESCE(%I,0) + $1)) WHERE id = $2', v_col, v_col)
                USING v_delta, p_faction_id;
        END IF;
    END LOOP;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_cost,
           officer_action_cooldowns = jsonb_set(COALESCE(officer_action_cooldowns, '{}'::jsonb), ARRAY[p_action], to_jsonb(v_tick))
     WHERE id = p_faction_id;

    -- Written Military dispatch (best-effort — never block the action on a log).
    v_meta := v_events -> p_action;
    v_name := COALESCE(v_meta->>'name', 'Officer Action');
    v_text := COALESCE(v_meta->>'text', 'The army carried out an officer action.');
    IF v_fac.nation_id IS NOT NULL THEN
        BEGIN
            INSERT INTO event_log (nation_id, faction_id, event_name, description_chosen, category, trigger_key, fired_at_tick)
            VALUES (v_fac.nation_id, p_faction_id, v_fac.faction_name || ' — ' || v_name, v_text, 'government', 'military_officer_action', v_tick);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    RETURN jsonb_build_object('success', true, 'action', p_action, 'ready_at_tick', v_tick + v_cd);
END; $$;

GRANT EXECUTE ON FUNCTION public.army_officer_action(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
