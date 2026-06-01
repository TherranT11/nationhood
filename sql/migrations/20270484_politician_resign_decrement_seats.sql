-- Resign — decrement the party's seat count on parliament-tier exit.
--
-- 20270480's politician_resign_office cleared the politician's office,
-- debited political_capital + party popularity, and logged a career
-- event — but never touched factions.seats. Winning a parliament race
-- bumps the party's seat count by +1 (20270418 line 168); resigning
-- has to do the inverse or the seat tally drifts.
--
-- Seat decrement only fires for parliament-tier offices
-- (member_of_parliament, senior_mp). Community organizer and
-- city_council_member don't take parliament seats, so resigning from
-- those doesn't change factions.seats — matches the asymmetric reward
-- in 20270418 (community wins bump popularity, not seats).

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_resign_office()
RETURNS jsonb
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

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office IS NULL THEN
        RETURN jsonb_build_object('success', true, 'already_resigned', true);
    END IF;

    v_office       := v_pol.politician_office;
    v_office_label := CASE v_office
        WHEN 'community_organizer'  THEN 'Community Organizer'
        WHEN 'city_council_member'  THEN 'City Council Member'
        WHEN 'member_of_parliament' THEN 'Member of Parliament'
        WHEN 'senior_mp'            THEN 'Senior MP'
        ELSE initcap(replace(v_office, '_', ' '))
    END;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET political_capital            = GREATEST(0, COALESCE(political_capital, 0) - 2),
           politician_office            = NULL,
           politician_office_won_at_tick = NULL
     WHERE id = v_pol.id
    RETURNING political_capital INTO v_new_cap;

    IF v_pol.politician_party_id IS NOT NULL THEN
        SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id FOR UPDATE;
        IF v_party.id IS NOT NULL THEN
            -- Popularity hit applies to every office tier.
            UPDATE factions
               SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 2)
             WHERE id = v_party.id
            RETURNING popularity_pct INTO v_new_pop;

            -- Seat decrement: parliament tier only. Mirrors the +1 bump
            -- on parliament wins in 20270418.
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

GRANT EXECUTE ON FUNCTION public.politician_resign_office() TO authenticated;

-- ── One-time backfill ──────────────────────────────────────────────
-- Any existing parliament-tier resignation event (logged by the
-- previous version of politician_resign_office) didn't decrement
-- factions.seats. Mark each affected event with
-- metadata.seats_decremented = true after we apply the -1, so a
-- re-run of this migration is a no-op.

WITH pending AS (
    SELECT e.id AS event_id, f.politician_party_id
      FROM politician_career_events e
      JOIN factions f ON f.id = e.faction_id
     WHERE e.event_type = 'resigned_office'
       AND e.target_name IN ('Member of Parliament', 'Senior MP')
       AND f.politician_party_id IS NOT NULL
       AND NOT COALESCE((e.metadata->>'seats_decremented')::boolean, false)
),
seats_decremented AS (
    UPDATE factions
       SET seats = GREATEST(0, COALESCE(seats, 0) - 1)
      FROM pending
     WHERE factions.id = pending.politician_party_id
       AND factions.faction_type = 'movement_party'
       AND factions.abandoned_at IS NULL
    RETURNING factions.id
)
UPDATE politician_career_events
   SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"seats_decremented": true}'::jsonb
 WHERE id IN (SELECT event_id FROM pending);

NOTIFY pgrst, 'reload schema';

COMMIT;
