-- ════════════════════════════════════════════════════════════════════
-- 20270529 — Experienced Advocate (Judiciary Tier 2)
--
-- Adds the first climbable step on the bench arc above raw bar
-- admission. The career page Judiciary ladder gains:
--
--   TIER 1  Advocate              ← already lit by bar admission
--   TIER 2  Experienced Advocate  ← NEW — claim via [Step Up]
--   TIER 3  Magistrate            ← (unchanged, still placeholder)
--   TIER 4  Appellate Justice     ← (unchanged, still placeholder)
--   TIER 5  Supreme Court Justice ← NEW — visual rung, no mechanic
--   TIER 6  Chief Justice         ← (unchanged, still appointed-only)
--
-- This migration only ships the Experienced Advocate state and RPC.
-- Supreme Court Justice is visual-only on the client (no schema).
--
-- Gates on the RPC (all checked server-side; client mirrors as
-- disabled-button states so a stale tab can't bypass):
--   • caller is the active politician (same active-politician resolve
--     used by 20270507 sit_the_exam and 20270505 bar_exam).
--   • bar_admitted_nation_id IS NOT NULL AND matches the politician's
--     nation_id — must be admitted to THIS nation's bar (cross-nation
--     bar admissions don't count, same as the Advocate rung's held()).
--   • politician_reputation >= 30.
--   • politician_experienced_advocate_at_tick IS NULL (re-entry guard;
--     stepping up is a one-shot transition).
--
-- No cost. Rep is the threshold, not the currency.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_experienced_advocate_at_tick int;

COMMENT ON COLUMN public.factions.politician_experienced_advocate_at_tick IS
    'Tick at which this politician claimed the Experienced Advocate rung (Judiciary Tier 2). NULL = not stepped up. One-shot — set by politician_step_up_experienced_advocate, never cleared.';

CREATE OR REPLACE FUNCTION public.politician_step_up_experienced_advocate(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid  uuid := auth.uid();
    v_pol  factions%ROWTYPE;
    v_tick int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_pol FROM public.factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    IF v_pol.bar_admitted_nation_id IS NULL
       OR v_pol.bar_admitted_nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    IF COALESCE(v_pol.politician_reputation, 0) < 30 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'reputation_too_low',
            'reputation', COALESCE(v_pol.politician_reputation, 0),
            'required',   30);
    END IF;

    IF v_pol.politician_experienced_advocate_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_stepped_up');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE public.factions
       SET politician_experienced_advocate_at_tick = COALESCE(v_tick, 0)
     WHERE id = v_pol.id;

    RETURN jsonb_build_object(
        'success',   true,
        'at_tick',   COALESCE(v_tick, 0)
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_step_up_experienced_advocate(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_step_up_experienced_advocate(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
