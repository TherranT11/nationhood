-- ════════════════════════════════════════════════════════════════
-- Foreign Officer Exchange Program — a Commanding General army
-- action. $12 from the army faction's party_funds, 24-tick cooldown.
--
-- Send officers abroad: Officer Corps + Professionalism each gain
--   GREATEST(0, FLOOR((target_army.stat - your_army.stat) / 20))
-- (negative/zero difference → no gain — an equal/weaker partner is
-- never harmful but gives nothing), with the resulting stat clamped
-- to [0,100] (the universal 0-100 stat convention; both columns are
-- display-only NUMERIC modifiers with no engine/tick consumers).
-- The action ALWAYS charges $12 and sets the cooldown, even when
-- both gains floor to 0 — no free retry.
--
-- Gating mirrors file_chief_of_staff_report (20270131/20270129):
-- SECURITY DEFINER, auth.uid() must command this army (admin-
-- inspector aware via NOT is_admin()), army faction only. Cooldown
-- tracked by a new factions.last_foreign_officer_exchange_tick
-- column (same pattern as last_chief_of_staff_report_tick).
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.factions
  ADD COLUMN IF NOT EXISTS last_foreign_officer_exchange_tick INTEGER DEFAULT NULL;

CREATE OR REPLACE FUNCTION public.foreign_officer_exchange(
    p_faction_id        UUID,
    p_target_faction_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user       UUID := auth.uid();
    v_fac        factions%ROWTYPE;
    v_tgt        factions%ROWTYPE;
    v_tick       INT;
    v_cd         INT := 24;
    v_cost       NUMERIC := 12000000;
    v_oc_gain    INT;
    v_pr_gain    INT;
    v_new_oc     NUMERIC;
    v_new_pr     NUMERIC;
    v_tgt_nation TEXT;
BEGIN
    SELECT * INTO v_fac FROM factions WHERE id = p_faction_id;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Army faction not found');
    END IF;
    IF v_fac.faction_type <> 'military' OR v_fac.branch <> 'army' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not an army faction');
    END IF;
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF NOT is_admin() AND v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not command this army');
    END IF;

    SELECT * INTO v_tgt FROM factions WHERE id = p_target_faction_id;
    IF v_tgt.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Selected nation has no army');
    END IF;
    IF v_tgt.faction_type <> 'military' OR v_tgt.branch <> 'army' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Selected faction is not an army');
    END IF;
    IF v_tgt.abandoned_at IS NOT NULL OR v_tgt.is_banned IS TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Selected army is inactive');
    END IF;
    IF v_tgt.id = v_fac.id OR v_tgt.nation_id = v_fac.nation_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Choose a foreign army, not your own nation');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_fac.last_foreign_officer_exchange_tick IS NOT NULL
       AND v_tick < v_fac.last_foreign_officer_exchange_tick + v_cd THEN
        RETURN jsonb_build_object('success', false, 'error', 'cooldown',
            'ready_at_tick', v_fac.last_foreign_officer_exchange_tick + v_cd);
    END IF;

    IF COALESCE(v_fac.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient Army Funds');
    END IF;

    -- FLOOR((target - you) / 20); a zero/negative difference clamps to 0.
    v_oc_gain := GREATEST(0, FLOOR((COALESCE(v_tgt.army_officer_corps, 0)
                                  - COALESCE(v_fac.army_officer_corps, 0)) / 20.0))::INT;
    v_pr_gain := GREATEST(0, FLOOR((COALESCE(v_tgt.army_professionalism, 0)
                                  - COALESCE(v_fac.army_professionalism, 0)) / 20.0))::INT;

    -- Resulting stat clamped to [0,100].
    v_new_oc := LEAST(100, GREATEST(0, COALESCE(v_fac.army_officer_corps, 0) + v_oc_gain));
    v_new_pr := LEAST(100, GREATEST(0, COALESCE(v_fac.army_professionalism, 0) + v_pr_gain));

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_cost,
           army_officer_corps = v_new_oc,
           army_professionalism = v_new_pr,
           last_foreign_officer_exchange_tick = v_tick
     WHERE id = p_faction_id;

    SELECT name INTO v_tgt_nation FROM nations WHERE id = v_tgt.nation_id;

    RETURN jsonb_build_object(
        'success', true,
        'target_nation', COALESCE(v_tgt_nation, 'the foreign nation'),
        'officer_corps_gain', v_oc_gain,
        'professionalism_gain', v_pr_gain,
        'new_officer_corps', v_new_oc,
        'new_professionalism', v_new_pr,
        'cost', v_cost
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.foreign_officer_exchange(UUID, UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
