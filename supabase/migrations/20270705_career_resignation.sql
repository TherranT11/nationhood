-- ════════════════════════════════════════════════════════════════════
-- 20270705 — Permissive career resignation (judicial + civil service)
--
-- Closes the "I'm in career X, I want to switch to Y" dead-end. The
-- civil-service exam gates on bar_admitted_nation_id IS NOT NULL
-- (20270646:2794); the bar exam similarly blocks while a ministry is
-- held. Today the only way out of either is full retirement, which
-- kills the politician entirely.
--
-- Two paired RPCs:
--
-- politician_resign_from_bench(p_faction_id) — clears every self-
-- claimed judicial stamp so the civil-service exam (and any other
-- career-mutex'd entry) unblocks. Columns cleared:
--   • bar_admitted_nation_id, bar_admitted_at_tick,
--     bar_last_attempt_tick (Advocate)
--   • politician_experienced_advocate_at_tick (Tier 2)
--   • politician_state_prosecutor_at_tick (Tier 3)
--   • politician_magistrate_at_tick (Tier 4)
--   • politician_appellate_justice_at_tick (Tier 5)
-- The admin-stamped politician_supreme_court_justice_at_tick is
-- intentionally NOT cleared (executive-tier appointment, not a self-
-- claimed rung). Admin can unstamp separately.
--
-- politician_resign_from_civil_service(p_faction_id) — symmetric for
-- the civil-service ladder. Columns cleared:
--   • politician_ministry (the ministry slug — the bar-exam gate)
--   • politician_senior_civil_servant_at_tick (Tier 2 stamp)
--   • politician_agency_head_of (which agency they ran)
--   • politician_permanent_secretary_at_tick (Tier 3)
--   • politician_permanent_secretary_ministry
--   • politician_junior_portfolio (Tier 3 appointed Junior Minister)
-- Note: this does NOT touch politician_office, which is the elected-
-- office path. Existing politician_resign_office (20270661:538)
-- handles that and is unchanged.
--
-- Both RPCs cost -2 Reputation (the price of walking away from a
-- vocation) and dispatch matching event_log + politician_career_events
-- entries. Active trials assigned to a resigning judge stay on their
-- docket until the 5-tick inactivity sweep rotates them off; same
-- for a resigning Junior Minister mid-tenure — graceful degradation
-- vs. surprising counsel / the HoG mid-flow.
--
-- Event templates added in politician-home.html's CAREER_EVENT_TEMPLATES:
--   'resigned_from_bench'         — judicial
--   'resigned_from_civil_service' — civil service
--
-- Gates: authenticated, owns the faction, IS in the relevant career
-- (otherwise nothing to resign from — early-success no-op with
-- already_resigned).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. politician_resign_from_bench ────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_resign_from_bench(
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

    IF v_pol.bar_admitted_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'already_resigned', true);
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE public.factions
       SET bar_admitted_nation_id                    = NULL,
           bar_admitted_at_tick                      = NULL,
           bar_last_attempt_tick                     = NULL,
           politician_experienced_advocate_at_tick   = NULL,
           politician_state_prosecutor_at_tick       = NULL,
           politician_magistrate_at_tick             = NULL,
           politician_appellate_justice_at_tick      = NULL,
           politician_reputation = GREATEST(0,
               COALESCE(politician_reputation, 0) - 2)
     WHERE id = v_pol.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' ||
                         COALESCE(v_pol.leader_last_name, ''));
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
        'Resigned From the Bench',
        v_full_name
            || ' has resigned from the bench of '
            || COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation')
            || ', returning to private life.',
        'politician', 'politician_resigned_from_bench',
        v_tick
    );

    INSERT INTO public.politician_career_events
        (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick,
        'resigned_from_bench',
        COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation'),
        '{}'::jsonb
    );

    RETURN jsonb_build_object(
        'success',         true,
        'at_tick',         v_tick,
        'reputation_cost', 2
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_resign_from_bench(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_resign_from_bench(uuid) TO authenticated;


-- ── 2. politician_resign_from_civil_service ────────────────────────
CREATE OR REPLACE FUNCTION public.politician_resign_from_civil_service(
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

    -- Nothing to resign from. politician_ministry is the canonical
    -- "in the civil service" gate — if it's NULL there's no posting
    -- to walk away from.
    IF v_pol.politician_ministry IS NULL THEN
        RETURN jsonb_build_object('success', true, 'already_resigned', true);
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE public.factions
       SET politician_ministry                          = NULL,
           politician_senior_civil_servant_at_tick      = NULL,
           politician_agency_head_of                    = NULL,
           politician_permanent_secretary_at_tick       = NULL,
           politician_permanent_secretary_ministry      = NULL,
           politician_junior_portfolio                  = NULL,
           politician_reputation = GREATEST(0,
               COALESCE(politician_reputation, 0) - 2)
     WHERE id = v_pol.id;

    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' ||
                         COALESCE(v_pol.leader_last_name, ''));
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
        'Resigned From the Civil Service',
        v_full_name
            || ' has resigned from the civil service of '
            || COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation')
            || ', returning to private life.',
        'politician', 'politician_resigned_from_civil_service',
        v_tick
    );

    INSERT INTO public.politician_career_events
        (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick,
        'resigned_from_civil_service',
        COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation'),
        '{}'::jsonb
    );

    RETURN jsonb_build_object(
        'success',         true,
        'at_tick',         v_tick,
        'reputation_cost', 2
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_resign_from_civil_service(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_resign_from_civil_service(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;

