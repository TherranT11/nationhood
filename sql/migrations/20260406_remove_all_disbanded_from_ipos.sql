-- Remove ALL disbanded factions from all IPOs.
-- A faction is "disbanded" if abandoned_at IS NOT NULL.
-- For each one: handle presidency succession, transfer founding_party_id,
-- post system messages, then delete all IPO records for that faction.

DO $$
DECLARE
    v_faction RECORD;
    v_org RECORD;
    v_new_president_id UUID;
    v_current_tick INT;
    v_removed_count INT := 0;
BEGIN
    -- Get current tick
    SELECT current_tick INTO v_current_tick FROM shard WHERE name = 'Alpha Shard';
    IF v_current_tick IS NULL THEN v_current_tick := 0; END IF;

    -- Loop over every disbanded faction that still has active IPO memberships
    FOR v_faction IN
        SELECT DISTINCT f.id, f.faction_name
        FROM factions f
        JOIN ipo_members im ON im.faction_id = f.id AND im.is_active = true
        WHERE f.abandoned_at IS NOT NULL
    LOOP
        RAISE NOTICE 'Processing disbanded faction: % (%)', v_faction.faction_name, v_faction.id;

        -- 1. Handle each IPO where this faction is currently president
        FOR v_org IN
            SELECT io.id, io.name, io.founding_party_id
            FROM international_orgs io
            WHERE io.president_id = v_faction.id
              AND io.is_active = true
        LOOP
            -- Find longest-serving remaining full member
            SELECT im.faction_id INTO v_new_president_id
            FROM ipo_members im
            JOIN factions f ON f.id = im.faction_id AND f.abandoned_at IS NULL
            WHERE im.org_id = v_org.id
              AND im.is_active = true
              AND im.role = 'member'
              AND im.faction_id != v_faction.id
            ORDER BY im.joined_at_tick ASC
            LIMIT 1;

            IF v_new_president_id IS NOT NULL THEN
                UPDATE international_orgs
                SET president_id = v_new_president_id,
                    president_term_start_tick = v_current_tick,
                    founding_party_id = CASE
                        WHEN founding_party_id = v_faction.id THEN v_new_president_id
                        ELSE founding_party_id
                    END
                WHERE id = v_org.id;

                INSERT INTO ipo_chat (org_id, faction_id, is_system, message_text, tick_posted)
                VALUES (v_org.id, NULL, true,
                        v_faction.faction_name || ' has disbanded and been removed. A new president has been automatically appointed.',
                        v_current_tick);

                RAISE NOTICE '  IPO "%": new president appointed (%)', v_org.name, v_new_president_id;
            ELSE
                -- No valid remaining members — dissolve the org
                UPDATE international_orgs
                SET is_active = false, dissolved_at_tick = v_current_tick
                WHERE id = v_org.id;

                RAISE NOTICE '  IPO "%": dissolved (no remaining active members)', v_org.name;
            END IF;
        END LOOP;

        -- 2. Transfer founding_party_id for orgs where this faction is founder but not president
        UPDATE international_orgs
        SET founding_party_id = president_id
        WHERE founding_party_id = v_faction.id
          AND president_id != v_faction.id
          AND is_active = true;

        -- 3. Post system message for remaining non-presided orgs
        INSERT INTO ipo_chat (org_id, faction_id, is_system, message_text, tick_posted)
        SELECT im.org_id, NULL, true,
               v_faction.faction_name || ' has disbanded and been removed from the organisation.',
               v_current_tick
        FROM ipo_members im
        WHERE im.faction_id = v_faction.id
          AND im.is_active = true;

        -- 4. Deactivate all memberships (soft delete — preserves history)
        UPDATE ipo_members
        SET is_active = false, left_at_tick = v_current_tick
        WHERE faction_id = v_faction.id
          AND is_active = true;

        -- 5. Clean up related records
        DELETE FROM ipo_ballots WHERE faction_id = v_faction.id;
        DELETE FROM ipo_fund_transactions WHERE faction_id = v_faction.id;
        DELETE FROM ipo_invitations WHERE target_faction_id = v_faction.id OR invited_by = v_faction.id;
        BEGIN DELETE FROM ipo_actions WHERE faction_id = v_faction.id OR target_faction_id = v_faction.id; EXCEPTION WHEN undefined_table THEN NULL; END;
        BEGIN DELETE FROM ipo_amendment_history WHERE faction_id = v_faction.id; EXCEPTION WHEN undefined_table THEN NULL; END;

        v_removed_count := v_removed_count + 1;
    END LOOP;

    RAISE NOTICE 'Done — removed % disbanded faction(s) from all IPOs.', v_removed_count;
END $$;
