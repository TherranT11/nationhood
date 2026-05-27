-- ════════════════════════════════════════════════════════════════════
-- COMBAT — front line + per-front action orders (ASSAULT / DEFEND)
-- ════════════════════════════════════════════════════════════════════
-- Each land front gets a single front-line integer (line_position): nation_a
-- holds sectors 1..line_position, nation_b holds the rest; the contested sector
-- is the seam. The combat tick (military-units.js processCombat) initialises it
-- to the static border, then nudges it ±1 toward the loser's capital whenever a
-- side breaks (army_cohesion → 0). line_position = 0 → nation_a's capital has
-- fallen; = sector_count → nation_b's. Ownership, contested sector and
-- capital-capture are all derived from this one number.
--
-- Each side's commanding army faction sets its action for the next tick via
-- set_front_action; the tick reads action_a/action_b. Only ASSAULT can advance
-- the line; DEFEND holds (×1.5 power, ½ casualties, 0.4× cohesion drain).
-- Un-ordered fronts default to DEFEND. (REGROUP/SUBJUGATE land later.)
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.war_fronts
    ADD COLUMN IF NOT EXISTS line_position INT,
    ADD COLUMN IF NOT EXISTS action_a TEXT NOT NULL DEFAULT 'defend' CHECK (action_a IN ('assault','defend')),
    ADD COLUMN IF NOT EXISTS action_b TEXT NOT NULL DEFAULT 'defend' CHECK (action_b IN ('assault','defend'));

COMMENT ON COLUMN public.war_fronts.line_position IS
    'Front-line boundary: nation_a holds sectors 1..line_position, nation_b the rest. NULL until the combat tick initialises it to the border. 0 = a''s capital fallen; sector_count = b''s.';
COMMENT ON COLUMN public.war_fronts.action_a IS 'nation_a forces'' order this tick: assault | defend (default).';
COMMENT ON COLUMN public.war_fronts.action_b IS 'nation_b forces'' order this tick: assault | defend (default).';

-- ── set_front_action() — the commanding army faction orders a front ──
CREATE OR REPLACE FUNCTION public.set_front_action(p_front_id UUID, p_action TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user  UUID := auth.uid();
    v_fac   factions%ROWTYPE;
    v_front war_fronts%ROWTYPE;
BEGIN
    IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
    IF p_action NOT IN ('assault', 'defend') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
    END IF;

    SELECT * INTO v_front FROM war_fronts WHERE id = p_front_id;
    IF v_front.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Front not found'); END IF;
    IF v_front.front_type <> 'land' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only land fronts take orders');
    END IF;

    -- Caller must command an army faction of one of the front's two nations.
    SELECT * INTO v_fac FROM factions
     WHERE (id = v_user OR linked_user_id = v_user)
       AND faction_type = 'military' AND branch = 'army'
       AND nation_id IN (v_front.nation_a_id, v_front.nation_b_id)
     LIMIT 1;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not command an army on this front');
    END IF;

    IF v_fac.nation_id = v_front.nation_a_id THEN
        UPDATE war_fronts SET action_a = p_action WHERE id = p_front_id;
    ELSE
        UPDATE war_fronts SET action_b = p_action WHERE id = p_front_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'action', p_action);
END; $$;

GRANT EXECUTE ON FUNCTION public.set_front_action(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
