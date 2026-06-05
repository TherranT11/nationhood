-- Sit the Exam — politician civil-service entry RPC.
--
-- Tier 1 of the Government Service ladder (Civil Servant) had a
-- documented entry hook on politician-career.html that was disabled
-- pending the mechanic. This migration ships it:
--
--   1d6 roll.
--     1     → fail: -2 political_capital, 12-tick cooldown before
--             re-apply, career_events row records the rejection.
--     2-6   → pass: +3 political_capital, 1d4 rolls a ministry
--             assignment (1=Defense / 2=Foreign Affairs & Trade /
--             3=Economic Development / 4=Interior). Sets
--             politician_ministry; career_events row records entry.
--
-- Gates: politician_party_id IS NULL (no current affiliation),
--        politician_office   IS NULL (no political office),
--        politician_ministry IS NULL (not already a civil servant),
--        cooldown not active.
--
-- Two new columns on factions:
--   politician_ministry                   — the chosen ministry slug
--   civil_service_exam_cooldown_until_tick — re-apply gate
--
-- Both client-write-revoked so politicians can't self-assign a
-- ministry or clear their own cooldown; writes go through this RPC
-- (SECURITY DEFINER).

BEGIN;

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS politician_ministry text,
    ADD COLUMN IF NOT EXISTS civil_service_exam_cooldown_until_tick int;

ALTER TABLE factions DROP CONSTRAINT IF EXISTS factions_politician_ministry_chk;
ALTER TABLE factions
    ADD CONSTRAINT factions_politician_ministry_chk
    CHECK (politician_ministry IS NULL
           OR politician_ministry IN ('defense', 'foreign_affairs', 'economic_development', 'interior'));

REVOKE UPDATE (politician_ministry, civil_service_exam_cooldown_until_tick)
    ON factions FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN factions.politician_ministry IS
    'Ministry the politician is a civil servant of (defense / foreign_affairs / economic_development / interior). NULL until they pass the Sit the Exam roll. Set by politician_sit_the_exam.';

COMMENT ON COLUMN factions.civil_service_exam_cooldown_until_tick IS
    'Tick at which the politician can re-attempt the civil service exam after a failed roll. NULL = no cooldown. Set by politician_sit_the_exam on a fail (current_tick + 12).';

CREATE OR REPLACE FUNCTION public.politician_sit_the_exam()
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

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    -- No current affiliation: not a party member, not in office, not
    -- already a civil servant.
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

GRANT EXECUTE ON FUNCTION public.politician_sit_the_exam() TO authenticated;

COMMENT ON FUNCTION public.politician_sit_the_exam() IS
    'Politician action: roll 1d6 to enter the civil service. Gates on no party + no office + no existing ministry + no active 12-tick cooldown. Roll 1 fails (-2 political_capital, 12-tick cooldown, career_events row with event_type=civil_service_exam_failed). Roll 2-6 passes (+3 political_capital, 1d4 ministry assignment, career_events row with event_type=civil_service_exam_passed). SECURITY DEFINER (the ministry + cooldown columns are client-write-revoked); FOR UPDATE serialises double-fire.';

NOTIFY pgrst, 'reload schema';

COMMIT;
