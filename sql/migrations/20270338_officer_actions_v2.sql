-- ════════════════════════════════════════════════════════════════════
-- OFFICER ACTIONS v2 — halve costs, 4 cross-loop actions, 12-tick cooldown
-- ════════════════════════════════════════════════════════════════════
-- Existing five keep their ±5 effect at half cost. Four new actions bridge the
-- materiel loop (Supply/Logistics) and the human loop (Training/Professionalism/
-- Cohesion), so the two can be converted into each other:
--   requisition_drive       +Supply        −Cohesion         $5  (Quartermaster)
--   comforts_and_rations    +Cohesion      −Supply           $5  (Commanding Gen.)
--   field_improvisation     +Logistics     −Professionalism  $6  (Quartermaster)
--   standardize_procedures  +Professionalism −Logistics      $7  (Chief of Staff)
-- Every officer action now also has a 12-tick PER-ACTION cooldown, tracked in
-- factions.officer_action_cooldowns (action_key → last-used tick).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS officer_action_cooldowns JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Cooldowns are written only by this RPC; a client mustn't reset its own (the
-- "Factions update own" RLS policy would otherwise allow it). SECURITY DEFINER
-- bypasses this revoke.
REVOKE UPDATE (officer_action_cooldowns) ON public.factions FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.army_officer_action(p_faction_id UUID, p_action TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_fac  factions%ROWTYPE;
    v_up   TEXT;
    v_down TEXT;
    v_cost NUMERIC;
    v_tick INT;
    v_last INT;
    v_cd   INT := 12;   -- per-action cooldown, ticks
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

    CASE p_action
        WHEN 'forward_stockpiling'     THEN v_up := 'army_supplies';        v_down := 'army_logistics';       v_cost := 4000000;
        WHEN 'logistics_overhaul'      THEN v_up := 'army_logistics';       v_down := 'army_supplies';        v_cost := 6000000;
        WHEN 'intensive_drills'        THEN v_up := 'army_training';        v_down := 'army_cohesion';        v_cost := 5000000;
        WHEN 'internal_security_sweep' THEN v_up := 'army_cohesion';        v_down := 'army_professionalism'; v_cost := 6000000;
        WHEN 'doctrine_reform'         THEN v_up := 'army_professionalism'; v_down := 'army_training';        v_cost := 7500000;
        WHEN 'requisition_drive'       THEN v_up := 'army_supplies';        v_down := 'army_cohesion';        v_cost := 5000000;
        WHEN 'comforts_and_rations'    THEN v_up := 'army_cohesion';        v_down := 'army_supplies';        v_cost := 5000000;
        WHEN 'field_improvisation'     THEN v_up := 'army_logistics';       v_down := 'army_professionalism'; v_cost := 6000000;
        WHEN 'standardize_procedures'  THEN v_up := 'army_professionalism'; v_down := 'army_logistics';       v_cost := 7000000;
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

    -- Apply the ±5 stat shift (dynamic %I — column names from the hardcoded CASE).
    EXECUTE format(
        'UPDATE factions SET %I = LEAST(100, GREATEST(0, COALESCE(%I,0) + 5)), '
        || '%I = GREATEST(0, COALESCE(%I,0) - 5) WHERE id = $1',
        v_up, v_up, v_down, v_down
    ) USING p_faction_id;
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
