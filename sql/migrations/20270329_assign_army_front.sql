-- ════════════════════════════════════════════════════════════════════
-- ASSIGN ARMY TO FRONT — deploy a named army to a specific land front
-- ════════════════════════════════════════════════════════════════════
-- An army (armies row) is deployed to one war_fronts land front (A/B/C) that
-- borders its nation. $1 from the army treasury (factions.party_funds), same pot
-- create_army / create_unit charge. Re-assignable (overwrites); no recall yet.
-- Owner-gated SECURITY DEFINER — armies has no client-write policy.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.armies
    ADD COLUMN IF NOT EXISTS assigned_front_id UUID REFERENCES war_fronts(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.armies.assigned_front_id IS
    'Land front (war_fronts.id) this army is deployed to, or NULL = unassigned. Set by assign_army_to_front; cleared if the front is removed.';

CREATE OR REPLACE FUNCTION public.assign_army_to_front(p_army_id UUID, p_front_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user    UUID := auth.uid();
    v_army    armies%ROWTYPE;
    v_fac     factions%ROWTYPE;
    v_front   war_fronts%ROWTYPE;
    v_fee     NUMERIC := 1000000;   -- $1
    v_balance NUMERIC;
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

    SELECT * INTO v_army FROM armies WHERE id = p_army_id FOR UPDATE;
    IF v_army.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Army not found'); END IF;

    -- Ownership (mirrors create_army): caller must command this army faction.
    SELECT * INTO v_fac FROM factions WHERE id = v_army.faction_id FOR UPDATE;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Army faction not found'); END IF;
    IF v_fac.faction_type <> 'military' OR v_fac.branch <> 'army' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not an army faction');
    END IF;
    IF v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not command this army');
    END IF;

    SELECT * INTO v_front FROM war_fronts WHERE id = p_front_id;
    IF v_front.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Front not found'); END IF;
    IF v_front.front_type <> 'land' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Armies deploy to land fronts only');
    END IF;
    IF v_army.nation_id NOT IN (v_front.nation_a_id, v_front.nation_b_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'That front does not border your nation');
    END IF;

    -- No-op if already deployed there — don't charge for re-confirming.
    IF v_army.assigned_front_id = p_front_id THEN
        RETURN jsonb_build_object('success', true, 'army_id', p_army_id, 'front_id', p_front_id, 'unchanged', true);
    END IF;

    v_balance := COALESCE(v_fac.party_funds, 0);
    IF v_balance < v_fee THEN
        RETURN jsonb_build_object('success', false, 'error',
            format('Insufficient Army Funds: $%s available, $1 required', round(v_balance / 1000000.0, 1)));
    END IF;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_fee WHERE id = v_fac.id;
    UPDATE armies   SET assigned_front_id = p_front_id WHERE id = p_army_id;

    RETURN jsonb_build_object('success', true, 'army_id', p_army_id, 'front_id', p_front_id);
END; $$;

GRANT EXECUTE ON FUNCTION public.assign_army_to_front(UUID, UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
