-- ════════════════════════════════════════════════════════════════════
-- ARMY COMMANDER — appoint a general to lead a specific army
-- ════════════════════════════════════════════════════════════════════
-- A free Chief-of-Staff action: roll 7 generals (client-side, names from the
-- nation's pool), pick one + an army, and he becomes that army's commander.
-- Each general has NAME, AGE and three 1–100 stats, rolled under ceilings:
--   LEADERSHIP   ≤ army_professionalism   — combat power multiplier in battle
--   DISCIPLINE   ≤ army_cohesion          — slows cohesion drain / rallying
--   STATE LOYALTY≤ f(approval↑, unrest↓)  — generated now, NO EFFECT yet
--
-- The RPC clamps the gameplay stats to their live ceilings (leadership ≤
-- professionalism, discipline ≤ cohesion) so a tampered client can't exceed
-- what the army could field; loyalty is clamped 1–100 only (no effect yet, its
-- ceiling is enforced client-side at roll time). armies has no client-write
-- policy, so this owner-gated SECURITY DEFINER is the only writer. No fee.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.armies
    ADD COLUMN IF NOT EXISTS commander_name        TEXT,
    ADD COLUMN IF NOT EXISTS commander_age         INT,
    ADD COLUMN IF NOT EXISTS commander_leadership  INT,
    ADD COLUMN IF NOT EXISTS commander_loyalty     INT,
    ADD COLUMN IF NOT EXISTS commander_discipline  INT;

CREATE OR REPLACE FUNCTION public.appoint_army_commander(
    p_army_id UUID, p_name TEXT, p_age INT,
    p_leadership INT, p_loyalty INT, p_discipline INT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_army armies%ROWTYPE;
    v_fac  factions%ROWTYPE;
    v_lead INT; v_disc INT; v_loy INT;
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

    SELECT * INTO v_army FROM armies WHERE id = p_army_id FOR UPDATE;
    IF v_army.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Army not found'); END IF;

    SELECT * INTO v_fac FROM factions WHERE id = v_army.faction_id;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Army faction not found'); END IF;
    IF v_fac.faction_type <> 'military' OR v_fac.branch <> 'army' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not an army faction');
    END IF;
    IF NOT is_admin() AND v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not command this army');
    END IF;

    -- Clamp gameplay stats to their live ceilings (and 1..100). Loyalty has no
    -- effect yet, so it's only bounded 1..100 here.
    v_lead := LEAST(100, GREATEST(1, LEAST(COALESCE(p_leadership, 1), GREATEST(1, COALESCE(v_fac.army_professionalism, 0)::int))));
    v_disc := LEAST(100, GREATEST(1, LEAST(COALESCE(p_discipline, 1), GREATEST(1, COALESCE(v_fac.army_cohesion, 0)::int))));
    v_loy  := LEAST(100, GREATEST(1, COALESCE(p_loyalty, 1)));

    UPDATE armies SET
        commander_name       = NULLIF(btrim(COALESCE(p_name, '')), ''),
        commander_age        = GREATEST(1, LEAST(120, COALESCE(p_age, 50))),
        commander_leadership = v_lead,
        commander_loyalty    = v_loy,
        commander_discipline = v_disc
     WHERE id = p_army_id;

    RETURN jsonb_build_object('success', true, 'army_id', p_army_id,
        'leadership', v_lead, 'loyalty', v_loy, 'discipline', v_disc);
END; $$;

GRANT EXECUTE ON FUNCTION public.appoint_army_commander(UUID, TEXT, INT, INT, INT, INT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
