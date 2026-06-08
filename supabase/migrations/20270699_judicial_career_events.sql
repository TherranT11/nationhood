-- ════════════════════════════════════════════════════════════════════
-- 20270699 — Judicial transitions land on the Political Career log
--
-- Bug: politician-home.html's "Political Career" timeline reads from
-- politician_career_events (separate from event_log). The Bar Exam
-- pass RPC writes a row there (20270505:252) but the three higher
-- judicial step-up RPCs only write to event_log — so a politician
-- who steps up to Experienced Advocate, gets appointed State Advocate,
-- or takes the bench as Magistrate never sees the transition land on
-- their career log. Visible to the test user who became a Magistrate
-- and saw only the Bar Exam pass on their timeline.
--
-- Two parts:
--
--   1. Re-emit politician_step_up_experienced_advocate (20270530)
--      and politician_take_the_bench (20270531) with an additional
--      INSERT to politician_career_events alongside the existing
--      event_log dispatch. State change unchanged; every failure path
--      still returns before the inserts so neither table is dirtied
--      on a rejected call.
--
--   2. Backfill any politician who currently holds Experienced
--      Advocate or Magistrate without the matching career-events row.
--      NOT EXISTS guard makes the backfill idempotent.
--
-- State Advocate (Tier 3) is deferred. Its RPC chain (20270532 +
-- 20270555 + the state_advocate_appointment_requests approval
-- routing through Minister of Interior) is significantly more
-- complex and re-emitting it cleanly is its own piece of work.
-- politician-home.html still gains a 'state_advocate' template
-- entry so the row renders correctly once that follow-up lands.
-- Backfill below also covers any currently-stamped state_prosecutor
-- columns defensively, so once the follow-up writes new rows, the
-- timeline already shows the existing stamp.
--
-- politician_career_events schema (per 20270505:252 pattern):
--   faction_id, event_tick, event_type, target_name, metadata.
-- target_name is the nation name (matches the template signature in
-- politician-home.html's CAREER_EVENT_TEMPLATES). metadata = {}.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Part 1a — Experienced Advocate ──────────────────────────────────
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

    -- 20270699: career-log dispatch so the politician's "Political
    -- Career" timeline picks up the transition.
    INSERT INTO public.politician_career_events
        (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, COALESCE(v_tick, 0),
        'experienced_advocate',
        COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation'),
        '{}'::jsonb
    );

    RETURN jsonb_build_object(
        'success',   true,
        'at_tick',   COALESCE(v_tick, 0)
    );
END $$;

-- ── Part 1b — Take the Bench (Magistrate) ───────────────────────────
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
    SELECT name INTO v_nation_nm FROM public.nations WHERE id = v_pol.nation_id;

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

    -- 20270699: career-log dispatch so the politician's "Political
    -- Career" timeline picks up the transition.
    INSERT INTO public.politician_career_events
        (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (
        v_pol.id, COALESCE(v_tick, 0),
        'magistrate',
        COALESCE(NULLIF(btrim(v_nation_nm), ''), 'their nation'),
        '{}'::jsonb
    );

    RETURN jsonb_build_object(
        'success',   true,
        'at_tick',   COALESCE(v_tick, 0)
    );
END $$;

-- ── Part 2 — Backfill existing stamped tiers ───────────────────────
-- Covers any politician who currently holds Experienced Advocate,
-- State Advocate (state_prosecutor column), or Magistrate without
-- the matching career-events row. NOT EXISTS keeps it idempotent.
-- The State Advocate backfill runs even though the RPC re-emit is
-- deferred — the timeline still surfaces existing stamps so the
-- follow-up only has to handle new ones.

INSERT INTO public.politician_career_events
    (faction_id, event_tick, event_type, target_name, metadata)
SELECT f.id,
       f.politician_experienced_advocate_at_tick,
       'experienced_advocate',
       COALESCE(NULLIF(btrim(n.name), ''), 'their nation'),
       '{}'::jsonb
  FROM public.factions f
  LEFT JOIN public.nations n ON n.id = f.nation_id
 WHERE f.faction_type = 'politician'
   AND f.abandoned_at IS NULL
   AND f.politician_experienced_advocate_at_tick IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM public.politician_career_events e
        WHERE e.faction_id = f.id
          AND e.event_type = 'experienced_advocate'
   );

INSERT INTO public.politician_career_events
    (faction_id, event_tick, event_type, target_name, metadata)
SELECT f.id,
       f.politician_state_prosecutor_at_tick,
       'state_advocate',
       COALESCE(NULLIF(btrim(n.name), ''), 'their nation'),
       '{}'::jsonb
  FROM public.factions f
  LEFT JOIN public.nations n ON n.id = f.nation_id
 WHERE f.faction_type = 'politician'
   AND f.abandoned_at IS NULL
   AND f.politician_state_prosecutor_at_tick IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM public.politician_career_events e
        WHERE e.faction_id = f.id
          AND e.event_type = 'state_advocate'
   );

INSERT INTO public.politician_career_events
    (faction_id, event_tick, event_type, target_name, metadata)
SELECT f.id,
       f.politician_magistrate_at_tick,
       'magistrate',
       COALESCE(NULLIF(btrim(n.name), ''), 'their nation'),
       '{}'::jsonb
  FROM public.factions f
  LEFT JOIN public.nations n ON n.id = f.nation_id
 WHERE f.faction_type = 'politician'
   AND f.abandoned_at IS NULL
   AND f.politician_magistrate_at_tick IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM public.politician_career_events e
        WHERE e.faction_id = f.id
          AND e.event_type = 'magistrate'
   );

NOTIFY pgrst, 'reload schema';

COMMIT;
