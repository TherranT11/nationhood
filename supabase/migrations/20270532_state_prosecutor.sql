-- ════════════════════════════════════════════════════════════════════
-- 20270532 — State Prosecutor (Judiciary Tier 3, parallel to bench)
--
-- Adds the prosecutorial sidestep between Experienced Advocate and
-- Magistrate. Parallel to the Magistrate bench rung — claiming
-- State Prosecutor does NOT gate or unlock anything on the bench
-- path, and vice versa. A politician can hold either, both, or
-- neither.
--
-- Same shape as 20270529 / 20270531: one-shot transition, threshold
-- gate (no spend), event_log dispatch on success.
--
-- Gates (server-enforced; client mirrors as disabled-button states):
--   • caller is the active politician.
--   • bar-admitted to THIS nation (matches Advocate's held() gate).
--   • Experienced Advocate already claimed (Tier 2 cleared).
--   • politician_reputation >= 35  — threshold, NOT deducted.
--   • political_capital      >= 25  — threshold, NOT deducted.
--   • politician_state_prosecutor_at_tick IS NULL — one-shot.
--
-- Numbers chosen relative to neighbouring rungs:
--   - 30 Rep gets you Experienced Advocate (Tier 2).
--   - +5 Rep + 25 PC gets you State Prosecutor (Tier 3 sidestep).
--   - 35 PC + Experienced Advocate gets you the Magistrate bench
--     (Tier 4) — same as before this migration, no change.
--
-- Event template:
--   "{Politician name} has been appointed State Prosecutor of
--    {nation}, charged with pursuing cases on behalf of the people."
--
-- Defensive fallbacks mirror 20270530 / 20270531: missing leader
-- name → faction_name → 'A politician'. Missing nation name →
-- 'their nation'. trigger_key 'politician_state_prosecutor_appt'.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_state_prosecutor_at_tick int;

COMMENT ON COLUMN public.factions.politician_state_prosecutor_at_tick IS
    'Tick at which this politician was appointed State Prosecutor (Judiciary Tier 3, parallel to Magistrate). NULL = not appointed. One-shot — set by politician_seek_state_prosecutor_appointment, never cleared.';

CREATE OR REPLACE FUNCTION public.politician_seek_state_prosecutor_appointment(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_full_name text;
    v_nation_nm text;
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

    IF v_pol.politician_experienced_advocate_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_experienced_advocate');
    END IF;

    IF COALESCE(v_pol.politician_reputation, 0) < 35 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'reputation_too_low',
            'reputation', COALESCE(v_pol.politician_reputation, 0),
            'required',   35);
    END IF;

    IF COALESCE(v_pol.political_capital, 0) < 25 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'political_capital_too_low',
            'political_capital', COALESCE(v_pol.political_capital, 0),
            'required',          25);
    END IF;

    IF v_pol.politician_state_prosecutor_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_appointed');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE public.factions
       SET politician_state_prosecutor_at_tick = COALESCE(v_tick, 0)
     WHERE id = v_pol.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' || COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;
    SELECT name INTO v_nation_nm FROM public.nations WHERE id = v_pol.nation_id;

    INSERT INTO public.event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        'State Prosecutor Appointed',
        v_full_name
            || ' has been appointed State Prosecutor of '
            || COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation')
            || ', charged with pursuing cases on behalf of the people.',
        'politician', 'politician_state_prosecutor_appt',
        COALESCE(v_tick, 0)
    );

    RETURN jsonb_build_object(
        'success',   true,
        'at_tick',   COALESCE(v_tick, 0)
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_seek_state_prosecutor_appointment(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_seek_state_prosecutor_appointment(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
