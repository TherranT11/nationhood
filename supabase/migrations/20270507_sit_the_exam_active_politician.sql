-- ════════════════════════════════════════════════════════════════════
-- 20270507 — Sit the Exam: active politician + judicial-career gate
--
-- Two fixes bundled, both surfaced by the same player report:
--
-- Player viewed their bar-admitted advocate, tapped "Sit the Exam"
-- for civil service, and got "You must leave your party before
-- sitting the civil service exam." The advocate was NOT a party
-- member — but another politician on the same account (Renata
-- Sandoval) was. politician_sit_the_exam() in 20270471 (legacy
-- sql/migrations/, hand-applied to prod) resolves the politician
-- via `ORDER BY created_at ASC LIMIT 1`, so the gate fired on the
-- OLDEST politician's party_id instead of the active one. Same
-- multi-politician pattern documented in 20270505.
--
-- Second issue: even if the active-politician lookup picked the
-- advocate correctly, there was no gate on the judicial career.
-- The advocate ladder (bar_admitted_nation_id IS NOT NULL) means
-- the player has chosen a career — they shouldn't be able to also
-- apply for the civil service. Spec: "You can't join the civil
-- service if you already have a career."
--
-- Fixes:
--   1. Drop the no-arg signature; re-author as
--      politician_sit_the_exam(p_faction_id uuid). The client
--      passes window.__careerCtx.faction.id (active politician),
--      same pattern as bar_exam_start/bar_exam_submit in 20270505.
--   2. Add gate: bar_admitted_nation_id IS NOT NULL →
--      reason 'already_in_career'. The client renders this as
--      "You can't join the civil service if you already have a
--      career."
--
-- Everything else from 20270471 is preserved verbatim (1d6 roll,
-- 1d4 ministry assignment, +3 / -2 political_capital, 12-tick
-- cooldown, career_events rows).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP FUNCTION IF EXISTS public.politician_sit_the_exam();

CREATE OR REPLACE FUNCTION public.politician_sit_the_exam(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_pol           factions%ROWTYPE;
    v_tick          int;
    v_roll          int;
    v_ministry_roll int;
    v_ministry_slug text;
    v_ministry_name text;
    v_cap_delta     int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    -- No current career on any ladder.
    IF v_pol.bar_admitted_nation_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_in_career');
    END IF;
    IF v_pol.politician_party_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'has_party');
    END IF;
    IF v_pol.politician_office IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'in_office');
    END IF;
    IF v_pol.politician_ministry IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_civil_servant');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    IF v_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_shard');
    END IF;

    IF v_pol.civil_service_exam_cooldown_until_tick IS NOT NULL
       AND v_pol.civil_service_exam_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'ready_at_tick', v_pol.civil_service_exam_cooldown_until_tick);
    END IF;

    v_roll          := 1 + floor(random() * 6)::int;
    v_ministry_roll := 1 + floor(random() * 4)::int;
    v_ministry_slug := CASE v_ministry_roll
        WHEN 1 THEN 'defense'
        WHEN 2 THEN 'foreign_affairs'
        WHEN 3 THEN 'economic_development'
        WHEN 4 THEN 'interior'
    END;
    v_ministry_name := CASE v_ministry_roll
        WHEN 1 THEN 'Defense'
        WHEN 2 THEN 'Foreign Affairs & Trade'
        WHEN 3 THEN 'Economic Development'
        WHEN 4 THEN 'Interior'
    END;

    IF v_roll = 1 THEN
        v_cap_delta := -2;
        UPDATE factions
           SET political_capital = GREATEST(0, COALESCE(political_capital, 0) + v_cap_delta),
               civil_service_exam_cooldown_until_tick = v_tick + 12
         WHERE id = v_pol.id;

        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
        VALUES (v_pol.id, v_tick, 'civil_service_exam_failed', v_ministry_name);

        RETURN jsonb_build_object(
            'success',             true,
            'outcome',             'fail',
            'roll',                v_roll,
            'ministry_slug',       v_ministry_slug,
            'ministry_name',       v_ministry_name,
            'capital_delta',       v_cap_delta,
            'cooldown_until_tick', v_tick + 12
        );
    ELSE
        v_cap_delta := 3;
        UPDATE factions
           SET political_capital   = COALESCE(political_capital, 0) + v_cap_delta,
               politician_ministry = v_ministry_slug
         WHERE id = v_pol.id;

        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
        VALUES (v_pol.id, v_tick, 'civil_service_exam_passed', v_ministry_name);

        RETURN jsonb_build_object(
            'success',       true,
            'outcome',       'pass',
            'roll',          v_roll,
            'ministry_slug', v_ministry_slug,
            'ministry_name', v_ministry_name,
            'capital_delta', v_cap_delta
        );
    END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.politician_sit_the_exam(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_sit_the_exam(uuid) TO authenticated;

COMMENT ON FUNCTION public.politician_sit_the_exam(uuid) IS
    'Politician civil-service entry. Takes p_faction_id (the active politician — 20270505 pattern). Gates: bar_admitted_nation_id IS NULL (no judicial career), politician_party_id IS NULL, politician_office IS NULL, politician_ministry IS NULL, no active 12-tick cooldown. 1d6 roll: 1=fail (-2 PC, 12-tick cooldown), 2-6=pass (+3 PC, 1d4 ministry assignment).';

NOTIFY pgrst, 'reload schema';

COMMIT;
