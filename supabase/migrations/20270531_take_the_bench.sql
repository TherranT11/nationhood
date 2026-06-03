-- ════════════════════════════════════════════════════════════════════
-- 20270531 — Take the Bench (Magistrate, Judiciary Tier 3)
--
-- Lights up the Magistrate rung on the politician-career.html
-- Judiciary ladder. Same shape as the Experienced Advocate step-up
-- (20270529 + 20270530): one-shot transition, threshold gate (no
-- spend), event_log dispatch on success.
--
-- Gates (server-enforced; client mirrors as disabled-button states):
--   • caller is the active politician (faction id + linked_user_id
--     resolve, same as 20270507 / 20270505).
--   • bar_admitted_nation_id IS NOT NULL AND matches nation_id —
--     must hold this nation's bar (matches Advocate's held() gate).
--   • politician_experienced_advocate_at_tick IS NOT NULL — you have
--     to step up to Experienced Advocate before the bench opens.
--     Ladder climbing, not a skip.
--   • political_capital >= 35 — threshold only, not deducted.
--   • politician_magistrate_at_tick IS NULL — one-shot.
--
-- Event template:
--   "{Politician name} has donned a robe and joined the Ministry of
--    Justice as a magistrate to preside over cases of the nation."
--
-- Defensive fallbacks mirror 20270530: missing leader name →
-- faction_name → 'A politician'. category='politician',
-- trigger_key 'politician_magistrate_take_bench'.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_magistrate_at_tick int;

COMMENT ON COLUMN public.factions.politician_magistrate_at_tick IS
    'Tick at which this politician took the bench as Magistrate (Judiciary Tier 3). NULL = not yet a magistrate. One-shot — set by politician_take_the_bench, never cleared.';

CREATE OR REPLACE FUNCTION public.politician_take_the_bench(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_full_name text;
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

    IF COALESCE(v_pol.political_capital, 0) < 35 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'political_capital_too_low',
            'political_capital', COALESCE(v_pol.political_capital, 0),
            'required',          35);
    END IF;

    IF v_pol.politician_magistrate_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_on_bench');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE public.factions
       SET politician_magistrate_at_tick = COALESCE(v_tick, 0)
     WHERE id = v_pol.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' || COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;

    INSERT INTO public.event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        'Magistrate Sworn In',
        v_full_name
            || ' has donned a robe and joined the Ministry of Justice as a magistrate'
            || ' to preside over cases of the nation.',
        'politician', 'politician_magistrate_take_bench',
        COALESCE(v_tick, 0)
    );

    RETURN jsonb_build_object(
        'success',   true,
        'at_tick',   COALESCE(v_tick, 0)
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_take_the_bench(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_take_the_bench(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
