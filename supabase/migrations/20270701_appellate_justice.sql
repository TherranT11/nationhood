-- ════════════════════════════════════════════════════════════════════
-- 20270701 — Appellate Justice (Judiciary Tier 5)
--
-- New self-applied judicial rung above Magistrate. The career arc:
--
--   Tier 1 Advocate           — bar exam pass
--   Tier 2 Experienced Advocate — rep ≥ 30
--   Tier 3 State Advocate     — rep ≥ 35 + cap ≥ 25 (prosecutor sidestep)
--   Tier 4 Magistrate         — cap ≥ 35 + Experienced Advocate
--   Tier 5 Appellate Justice  — NEW, this migration
--   Tier 6 Supreme Court Justice — admin-stamped only (20270561)
--
-- Gates (server-enforced; politician-career mirrors them as
-- disabled-button states):
--   • caller is the active politician
--   • bar-admitted to THIS nation (same gate as Advocate)
--   • Magistrate already claimed (Tier 4 cleared)
--   • Served as Magistrate ≥ 24 ticks (~2 in-game years; matches
--     half a parliamentary term and signals real bench experience)
--   • politician_skill ≥ 35 — threshold, NOT deducted. "Experience"
--     in the UI; chosen over Capital so each judicial tier signals
--     a different kind of growth (Magistrate already gates on cap).
--   • politician_appellate_justice_at_tick IS NULL — one-shot.
--
-- The role keeps the holder in the regular magistrate pool — they
-- still receive trial assignments by load. Their distinctive
-- responsibility (handling appeals) is a follow-up: the appeal-
-- filing RPC + appellate trial state machine + appellate bench
-- selection logic are all separate work. This migration only
-- establishes the rung, the apply path, and the event/career log
-- entries so the climb is visible immediately.
--
-- Numbers chosen relative to neighbouring rungs:
--   - Magistrate: cap ≥ 35 (one bar of political weight)
--   - Appellate Justice: skill ≥ 35 + 24-tick tenure (one bar of
--     professional weight + bench hours)
-- Each tier signals a different kind of qualification rather than
-- escalating the same stat. Refine the numbers as the bench
-- populates and the cohort becomes visible.
--
-- Event templates:
--   event_log:   "{Politician name} has been elevated to the
--                 Appellate bench of {nation}, where they will
--                 review the rulings of the lower courts."
--   trigger_key: 'politician_appellate_justice_take_bench'
--
--   politician_career_events:
--     event_type:  'appellate_justice'
--     target_name: nation name
--     (template lives in politician-home.html's
--      CAREER_EVENT_TEMPLATES — edit both together if rewording.)
--
-- Schema column write is REVOKE'd from clients; only this SECURITY
-- DEFINER RPC may stamp it. Mirrors the pattern on
-- politician_magistrate_at_tick.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Schema ─────────────────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS politician_appellate_justice_at_tick int;

COMMENT ON COLUMN public.factions.politician_appellate_justice_at_tick IS
    'Tick at which this politician was elevated to the Appellate bench (Judiciary Tier 5). NULL = not on the appellate bench. One-shot — set by politician_apply_to_appellate_bench, never cleared.';

REVOKE UPDATE (politician_appellate_justice_at_tick) ON public.factions
    FROM PUBLIC, anon, authenticated;


-- ── RPC — politician_apply_to_appellate_bench ──────────────────────
CREATE OR REPLACE FUNCTION public.politician_apply_to_appellate_bench(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_tenure    int;
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

    -- Bar admission gate (same shape as the other judicial rungs).
    IF v_pol.bar_admitted_nation_id IS NULL
       OR v_pol.bar_admitted_nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_advocate');
    END IF;

    -- Career-path prerequisite: must already be Magistrate.
    IF v_pol.politician_magistrate_at_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_magistrate');
    END IF;

    -- Tenure gate: must have served as Magistrate ≥ 24 ticks. Read
    -- the shard tick once and reuse for both the gate check and the
    -- stamp tick so a single source drives both.
    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick   := COALESCE(v_tick, 0);
    v_tenure := v_tick - v_pol.politician_magistrate_at_tick;
    IF v_tenure < 24 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'tenure_too_short',
            'tenure_ticks', v_tenure,
            'required',     24);
    END IF;

    -- Experience gate: politician_skill ≥ 35 (UI label "Experience").
    IF COALESCE(v_pol.politician_skill, 0) < 35 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'experience_too_low',
            'experience', COALESCE(v_pol.politician_skill, 0),
            'required',   35);
    END IF;

    -- One-shot guard.
    IF v_pol.politician_appellate_justice_at_tick IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_on_appellate_bench');
    END IF;

    -- Stamp the column.
    UPDATE public.factions
       SET politician_appellate_justice_at_tick = v_tick
     WHERE id = v_pol.id;

    -- Display name + nation name for the dispatches. Defensive
    -- fallbacks mirror the other judicial RPCs (20270530, 20270531).
    v_full_name := btrim(COALESCE(v_pol.leader_first_name, '') || ' ' ||
                         COALESCE(v_pol.leader_last_name, ''));
    IF length(v_full_name) = 0 THEN
        v_full_name := COALESCE(v_pol.faction_name, 'A politician');
    END IF;
    SELECT name INTO v_nation_nm FROM public.nations WHERE id = v_pol.nation_id;

    -- World-events dispatch.
    INSERT INTO public.event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        fired_at_tick
    ) VALUES (
        v_pol.nation_id, v_pol.id,
        'Appellate Justice Elevated',
        v_full_name
            || ' has been elevated to the Appellate bench of '
            || COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation')
            || ', where they will review the rulings of the lower courts.',
        'politician', 'politician_appellate_justice_take_bench',
        v_tick
    );

    -- Career-log dispatch for the politician's Political Career timeline.
    INSERT INTO public.politician_career_events
        (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, v_tick,
        'appellate_justice',
        COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation'),
        '{}'::jsonb
    );

    RETURN jsonb_build_object(
        'success', true,
        'at_tick', v_tick
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_apply_to_appellate_bench(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_apply_to_appellate_bench(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
