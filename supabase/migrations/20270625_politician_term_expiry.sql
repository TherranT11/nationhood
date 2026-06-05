-- ════════════════════════════════════════════════════════════════════
-- 20270625 — Community Organizer / City Council: 12-tick term expiry
--
-- termEndTickFor() in js/utils.js already returns
-- `officeWonAtTick + 12` for community_organizer + city_council_member,
-- and politician-home.html renders the "TERM ENDS · N TICKS REMAINING"
-- pill from it. The mechanic just wasn't enforced server-side — a
-- politician kept the office indefinitely past tick won+12 unless they
-- manually resigned. User flagged the role card sitting at "0 TICKS
-- REMAINING" without ever clearing.
--
-- politician_resolve_expired_terms(): same teardown shape as
-- politician_resign_office (20270480) — clears politician_office +
-- politician_office_won_at_tick, logs a term_ended career event —
-- minus the political-capital / party-popularity penalty. A term
-- running its natural course isn't a fault.
--
-- Trigger: called on page load by politician-home.html and
-- politician-career.html alongside the existing
-- politician_resolve_due_elections. Same lazy "resolve due things
-- when the player opens their page" pattern.
--
-- Scope: caller's own politicians (id = auth.uid() OR linked_user_id =
-- auth.uid()) — mirrors politician_resolve_due_elections. NPC
-- politicians don't run for office in the current model, so caller-
-- only is sufficient.
--
-- MP / Senior MP are out of scope: legislature seats reseat on the
-- nation's next_election_tick (general-election cycle), not a flat
-- per-politician term. termEndTickFor() handles that branch
-- separately.
--
-- Apply after 20270624.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_resolve_expired_terms()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid           uuid := auth.uid();
    v_tick          int;
    v_pol           RECORD;
    v_office_label  text;
    v_expired_count int := 0;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR v_pol IN
        SELECT id, politician_office, politician_office_won_at_tick
          FROM factions
         WHERE (id = v_uid OR linked_user_id = v_uid)
           AND faction_type = 'politician'
           AND abandoned_at IS NULL
           AND politician_office IN ('community_organizer', 'city_council_member')
           AND politician_office_won_at_tick IS NOT NULL
           -- "+ 12" is the local-office term length. js/utils.js
           -- termEndTickFor() uses the same constant for the
           -- "TERM ENDS · N TICKS REMAINING" display — keep the two
           -- in sync if the term length ever changes.
           AND v_tick >= politician_office_won_at_tick + 12
         FOR UPDATE
    LOOP
        v_office_label := CASE v_pol.politician_office
            WHEN 'community_organizer' THEN 'Community Organizer'
            WHEN 'city_council_member' THEN 'City Council Member'
            ELSE initcap(replace(v_pol.politician_office, '_', ' '))
        END;

        UPDATE factions
           SET politician_office             = NULL,
               politician_office_won_at_tick = NULL
         WHERE id = v_pol.id;

        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
        VALUES (v_pol.id, v_tick, 'term_ended', v_office_label);

        v_expired_count := v_expired_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success',       true,
        'tick',          v_tick,
        'expired_count', v_expired_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_resolve_expired_terms() TO authenticated;

COMMENT ON FUNCTION public.politician_resolve_expired_terms() IS
    'Clears expired 12-tick terms on community_organizer + city_council_member offices for politicians owned by the caller. Mirrors politician_resign_office''s teardown (politician_office + politician_office_won_at_tick → NULL, logs term_ended career event) but without the resignation penalties. Called by politician-home.html + politician-career.html on page load alongside politician_resolve_due_elections.';

NOTIFY pgrst, 'reload schema';

COMMIT;
