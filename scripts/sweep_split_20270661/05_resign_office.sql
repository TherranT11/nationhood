-- 20270661 split #05 of 10 — politician_resign_office(p_faction_id)
--
-- Standalone re-emit. DROP old () signature, CREATE new (uuid)
-- with p_faction_id ownership lookup. Body otherwise byte-identical
-- to 20270646.

BEGIN;

DROP FUNCTION IF EXISTS public.politician_resign_office();

CREATE OR REPLACE FUNCTION public.politician_resign_office(
    p_faction_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_party        factions%ROWTYPE;
    v_tick         int;
    v_office       text;
    v_office_label text;
    v_new_cap      int;
    v_new_pop      numeric;
    v_new_seats    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office IS NULL THEN
        RETURN jsonb_build_object('success', true, 'already_resigned', true);
    END IF;

    v_office       := v_pol.politician_office;
    v_office_label := CASE v_office
        WHEN 'community_organizer'    THEN 'Community Organizer'
        WHEN 'city_council_member'    THEN 'City Council Member'
        WHEN 'city_council_president' THEN 'City Council President'
        WHEN 'member_of_parliament'   THEN 'Member of Parliament'
        WHEN 'senior_mp'              THEN 'Senior MP'
        ELSE initcap(replace(v_office, '_', ' '))
    END;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET politician_influence         = GREATEST(0, COALESCE(politician_influence, 0) - 2),
           politician_office            = NULL,
           politician_office_won_at_tick = NULL
     WHERE id = v_pol.id
    RETURNING politician_influence INTO v_new_cap;

    IF v_pol.politician_party_id IS NOT NULL THEN
        SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id FOR UPDATE;
        IF v_party.id IS NOT NULL THEN
            UPDATE factions
               SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 2)
             WHERE id = v_party.id
            RETURNING popularity_pct INTO v_new_pop;

            IF v_office IN ('member_of_parliament', 'senior_mp') THEN
                UPDATE factions
                   SET seats = GREATEST(0, COALESCE(seats, 0) - 1)
                 WHERE id = v_party.id
                   AND faction_type = 'movement_party'
                   AND abandoned_at IS NULL
                RETURNING seats INTO v_new_seats;
            END IF;
        END IF;
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name, metadata)
    VALUES (v_pol.id, v_tick, 'resigned_office', v_office_label,
            '{"seats_decremented": true}'::jsonb);

    RETURN jsonb_build_object(
        'success',               true,
        'office',                v_office_label,
        'new_political_capital', v_new_cap,
        'new_party_popularity',  v_new_pop,
        'new_party_seats',       v_new_seats
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resign_office(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
