-- Remove "The Greater Union Council of Montequilla" from all IPOs.
-- If this causes an IPO to be leaderless, appoint the longest-serving
-- remaining full member as the new president.

DO $$
DECLARE
    v_faction_id UUID;
    v_faction_name TEXT;
    v_org RECORD;
    v_new_president_id UUID;
    v_current_tick INT;
BEGIN
    -- Look up the faction by name + nation
    SELECT f.id, f.faction_name INTO v_faction_id, v_faction_name
    FROM factions f
    JOIN nations n ON n.id = f.nation_id
    WHERE f.faction_name = 'The Greater Union Council'
      AND n.name = 'Montequilla'
    LIMIT 1;

    -- Also try abandoned factions (nation_id is null after disband)
    IF v_faction_id IS NULL THEN
        SELECT id, faction_name INTO v_faction_id, v_faction_name
        FROM factions
        WHERE faction_name = 'The Greater Union Council'
          AND nation_id IS NULL
          AND abandoned_at IS NOT NULL
        LIMIT 1;
    END IF;

    IF v_faction_id IS NULL THEN
        RAISE NOTICE 'Faction "The Greater Union Council" not found — skipping.';
        RETURN;
    END IF;

    -- Get current tick for term start
    SELECT MAX(tick) INTO v_current_tick FROM tick_log;
    IF v_current_tick IS NULL THEN v_current_tick := 0; END IF;

    RAISE NOTICE 'Removing faction % (%) from all IPOs...', v_faction_name, v_faction_id;

    -- Handle each IPO where this faction is president
    FOR v_org IN
        SELECT io.id, io.name, io.founding_party_id
        FROM international_orgs io
        WHERE io.president_id = v_faction_id
          AND io.is_active = true
    LOOP
        -- Find the longest-serving remaining full member
        SELECT im.faction_id INTO v_new_president_id
        FROM ipo_members im
        WHERE im.org_id = v_org.id
          AND im.is_active = true
          AND im.role = 'member'
          AND im.faction_id != v_faction_id
        ORDER BY im.joined_at_tick ASC
        LIMIT 1;

        IF v_new_president_id IS NOT NULL THEN
            -- Appoint new president
            UPDATE international_orgs
            SET president_id = v_new_president_id,
                president_term_start_tick = v_current_tick,
                founding_party_id = CASE
                    WHEN founding_party_id = v_faction_id THEN v_new_president_id
                    ELSE founding_party_id
                END
            WHERE id = v_org.id;

            -- System message
            INSERT INTO ipo_chat (org_id, faction_id, is_system, message_text, tick_posted)
            VALUES (v_org.id, NULL, true,
                    v_faction_name || ' has disbanded and been removed from the organisation. A new president has been automatically appointed.',
                    v_current_tick);

            RAISE NOTICE 'IPO "%": appointed new president %', v_org.name, v_new_president_id;
        ELSE
            -- No remaining members — dissolve the org
            UPDATE international_orgs
            SET is_active = false, dissolved_at_tick = v_current_tick
            WHERE id = v_org.id;

            RAISE NOTICE 'IPO "%": dissolved (no remaining members)', v_org.name;
        END IF;
    END LOOP;

    -- Transfer founding_party_id for orgs where this faction is founder but not president
    UPDATE international_orgs
    SET founding_party_id = president_id
    WHERE founding_party_id = v_faction_id
      AND president_id != v_faction_id
      AND is_active = true
      AND president_id IS NOT NULL;

    -- Post system message for non-presided orgs where they're still a member
    INSERT INTO ipo_chat (org_id, faction_id, is_system, message_text, tick_posted)
    SELECT im.org_id, NULL, true,
           v_faction_name || ' has disbanded and been removed from the organisation.',
           v_current_tick
    FROM ipo_members im
    WHERE im.faction_id = v_faction_id
      AND im.is_active = true
      AND im.org_id NOT IN (
          SELECT id FROM international_orgs WHERE president_id = v_faction_id AND is_active = true
      );

    -- Remove from all IPO tables
    DELETE FROM ipo_fund_transactions WHERE faction_id = v_faction_id;
    DELETE FROM ipo_votes WHERE proposed_by = v_faction_id;
    DELETE FROM ipo_action_log WHERE faction_id = v_faction_id;
    DELETE FROM ipo_ballots WHERE faction_id = v_faction_id;
    DELETE FROM ipo_chat WHERE faction_id = v_faction_id;
    DELETE FROM ipo_invitations WHERE target_faction_id = v_faction_id OR invited_by = v_faction_id;
    DELETE FROM ipo_members WHERE faction_id = v_faction_id;

    -- Clean up tables that may exist
    BEGIN DELETE FROM ipo_amendment_history WHERE faction_id = v_faction_id; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN DELETE FROM ipo_actions WHERE faction_id = v_faction_id OR target_faction_id = v_faction_id; EXCEPTION WHEN undefined_table THEN NULL; END;

    RAISE NOTICE 'Done — % fully removed from all IPOs.', v_faction_name;
END $$;
