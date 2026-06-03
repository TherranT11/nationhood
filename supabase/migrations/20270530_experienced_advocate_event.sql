-- ════════════════════════════════════════════════════════════════════
-- 20270530 — Experienced Advocate world event
--
-- Adds an event_log dispatch when a politician steps up to
-- Experienced Advocate. Matches the pattern in 20270500 (propose_law)
-- and 20270528 (trial resolution): category='politician' so the
-- POLITICS_CATEGORIES filter on politician-home picks it up without
-- a frontend change.
--
-- Template:
--   "{Politician name} has been widely recognized as one of the
--    more experienced attorneys in {nation}, and their name has
--    been mentioned in national circles."
--
-- Re-issues politician_step_up_experienced_advocate (20270529) with
-- the same body + a nation load + an event_log INSERT after the
-- UPDATE. State change is unchanged; the dispatch can't fire on
-- failed step-ups because every gate returns early.
--
-- Defensive fallbacks: missing leader name → faction_name → 'A
-- politician'. Missing nation name → 'their nation'. trigger_key
-- 'politician_experienced_advocate' is new.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_step_up_experienced_advocate(
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

    -- World-events dispatch.
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
        'Experienced Advocate',
        v_full_name
            || ' has been widely recognized as one of the more experienced attorneys in '
            || COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation')
            || ', and their name has been mentioned in national circles.',
        'politician', 'politician_experienced_advocate',
        COALESCE(v_tick, 0)
    );

    RETURN jsonb_build_object(
        'success',   true,
        'at_tick',   COALESCE(v_tick, 0)
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
