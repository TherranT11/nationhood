-- ════════════════════════════════════════════════════════════════════
-- OFFICER ACTIONS v3 — each action now hits 2–3 stats, incl. Manpower + Officer
-- Corps (Equipment Quality stays untouched)
-- ════════════════════════════════════════════════════════════════════
-- The originals only ever moved 5 of the army stats (+5/−5 between Supply,
-- Logistics, Training, Cohesion, Professionalism). Manpower and Officer Corps
-- were never in the pool. v3 keeps each action's ±5 primary pair and adds a
-- secondary effect to most of them:
--
--   intensive_drills        +Training −Cohesion          −1,000 Manpower (washouts)
--   internal_security_sweep +Cohesion −Professionalism    −1,000 Manpower (purged)
--   requisition_drive       +Supply   −Cohesion           −1,000 Manpower (desertion)
--   comforts_and_rations    +Cohesion −Supply             +1,000 Manpower (stragglers return)
--   doctrine_reform         +Professionalism −Training    +3 Officer Corps
--   standardize_procedures  +Professionalism −Logistics   +3 Officer Corps
--   field_improvisation     +Logistics −Professionalism   −3 Officer Corps
--   forward_stockpiling     +Supply   −Logistics          (2 stats)
--   logistics_overhaul      +Logistics −Supply            (2 stats)
--
-- Clamp rules differ by stat: the 0–100 stats clamp to [0,100]; Manpower is a
-- raw soldier count, so it only floors at 0 (no upper cap). Cost + 12-tick
-- per-action cooldown are unchanged from v2. The client mirror of these numbers
-- lives in js/officer-actions.js (officerEffectText) — keep the two in step.
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
    v_cd      INT := 12;   -- per-action cooldown, ticks
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

    -- Effect list + cost per action. Column names are hardcoded here (the only
    -- source of the dynamic %I identifiers below — no user input reaches them).
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

    -- Apply each effect. Manpower is a raw soldier count (floor at 0, no upper
    -- cap); every other stat is a 0–100 operating modifier.
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

    -- Charge the fee and stamp the per-action cooldown.
    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_cost,
           officer_action_cooldowns = jsonb_set(COALESCE(officer_action_cooldowns, '{}'::jsonb), ARRAY[p_action], to_jsonb(v_tick))
     WHERE id = p_faction_id;

    RETURN jsonb_build_object('success', true, 'action', p_action, 'ready_at_tick', v_tick + v_cd);
END; $$;

GRANT EXECUTE ON FUNCTION public.army_officer_action(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
