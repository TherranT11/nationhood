-- Politician self-resignation from an elected office.
--
-- Player-driven "step down" action on the role card in
-- politician-home.html (MP / Senior MP / Community Organizer / City
-- Council). Costs the politician 2 Political Capital and the party 2
-- Popularity (capped at 0 floor). Clears politician_office and
-- politician_office_won_at_tick so the role card falls back to the
-- Party Member variant immediately.
--
-- Logs a `resigned_office` row in politician_career_events with the
-- role's display label in target_name; the politician-home.html
-- CAREER_EVENT_TEMPLATES picks it up to render
-- "{name} resigns from their office as {role}."
--
-- Caller must own the politician (id = auth.uid() OR linked_user_id
-- = auth.uid()). No-op if politician_office is already NULL — returns
-- success with a flag so the UI can stay quiet.
--
-- Party-popularity hit is skipped if the politician has no party
-- (politician_party_id IS NULL) — nothing to debit.

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
    v_office_label text;
    v_new_cap      int;
    v_new_pop      numeric;
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

    v_office_label := CASE v_pol.politician_office
        WHEN 'community_organizer'  THEN 'Community Organizer'
        WHEN 'city_council_member'  THEN 'City Council Member'
        WHEN 'member_of_parliament' THEN 'Member of Parliament'
        WHEN 'senior_mp'            THEN 'Senior MP'
        ELSE initcap(replace(v_pol.politician_office, '_', ' '))
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
            UPDATE factions
               SET popularity_pct = GREATEST(0, COALESCE(popularity_pct, 0) - 2)
             WHERE id = v_party.id
            RETURNING popularity_pct INTO v_new_pop;
        END IF;
    END IF;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
    VALUES (v_pol.id, v_tick, 'resigned_office', v_office_label);

    RETURN jsonb_build_object(
        'success',              true,
        'office',               v_office_label,
        'new_political_capital', v_new_cap,
        'new_party_popularity', v_new_pop
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resign_office() TO authenticated;

COMMENT ON FUNCTION public.politician_resign_office() IS
    'Politician steps down from their elected office: -2 political_capital, -2 party popularity_pct (skipped if no party), clears politician_office + politician_office_won_at_tick, logs a resigned_office career event. Caller must own the politician.';

NOTIFY pgrst, 'reload schema';

COMMIT;
