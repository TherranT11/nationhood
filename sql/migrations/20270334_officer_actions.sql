-- ════════════════════════════════════════════════════════════════════
-- OFFICER ACTIONS — five staff actions that reallocate army stats (+5/−5)
-- ════════════════════════════════════════════════════════════════════
-- Each action raises one operating modifier by 5 and lowers another by 5
-- (clamped 0–100), for a fee from the army faction's treasury (party_funds):
--
--   forward_stockpiling      +Supply        −Logistics        $8   (Quartermaster)
--   logistics_overhaul       +Logistics     −Supply           $12  (Quartermaster)
--   intensive_drills         +Training      −Cohesion         $10  (Commanding Gen.)
--   internal_security_sweep  +Cohesion      −Professionalism  $12  (Dir. of Intel.)
--   doctrine_reform          +Professionalism −Training       $15  (Chief of Staff)
--
-- These form two closed loops (Supply⇄Logistics; Training→Cohesion→
-- Professionalism→Training), so they only RESHAPE an army, never inflate it —
-- and the combat formula punishes any stat driven to 0, so min-maxing one stat
-- by gutting another is self-defeating. No cooldown needed; cost is the limiter.
-- Owner-gated SECURITY DEFINER — factions stat columns have no client write.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.army_officer_action(p_faction_id UUID, p_action TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_fac  factions%ROWTYPE;
    v_up   TEXT;
    v_down TEXT;
    v_cost NUMERIC;
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

    -- Action → (stat raised, stat lowered, fee). Column names are hardcoded
    -- here, so the dynamic UPDATE below is injection-safe.
    CASE p_action
        WHEN 'forward_stockpiling'     THEN v_up := 'army_supplies';        v_down := 'army_logistics';       v_cost := 8000000;
        WHEN 'logistics_overhaul'      THEN v_up := 'army_logistics';       v_down := 'army_supplies';        v_cost := 12000000;
        WHEN 'intensive_drills'        THEN v_up := 'army_training';        v_down := 'army_cohesion';        v_cost := 10000000;
        WHEN 'internal_security_sweep' THEN v_up := 'army_cohesion';        v_down := 'army_professionalism'; v_cost := 12000000;
        WHEN 'doctrine_reform'         THEN v_up := 'army_professionalism'; v_down := 'army_training';        v_cost := 15000000;
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
    IF COALESCE(v_fac.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'error',
            format('Insufficient Army Funds: $%s available, $%s required',
                   round(COALESCE(v_fac.party_funds, 0) / 1000000.0, 1), round(v_cost / 1000000.0, 1)));
    END IF;

    EXECUTE format(
        'UPDATE factions SET party_funds = COALESCE(party_funds,0) - $1, '
        || '%I = LEAST(100, GREATEST(0, COALESCE(%I,0) + 5)), '
        || '%I = GREATEST(0, COALESCE(%I,0) - 5) WHERE id = $2',
        v_up, v_up, v_down, v_down
    ) USING v_cost, p_faction_id;

    RETURN jsonb_build_object('success', true, 'action', p_action);
END; $$;

GRANT EXECUTE ON FUNCTION public.army_officer_action(UUID, TEXT) TO authenticated;

-- The operating modifiers must change ONLY through RPCs (officer actions,
-- foreign officer exchange, combined arms school) and the combat/supply tick —
-- never a direct client UPDATE. But authenticated owners can update their own
-- faction row ("Factions update own" RLS), and RLS UPDATE is row-level, so lock
-- these at the column-privilege level (same pattern as ent_unpaid_debt). The
-- SECURITY DEFINER RPCs (owned by postgres) and the service-role tick bypass
-- this; no browser path writes these columns, so nothing legitimate breaks.
REVOKE UPDATE (
    army_manpower, army_training, army_equipment, army_cohesion,
    army_professionalism, army_logistics, army_officer_corps, army_supplies
) ON public.factions FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
