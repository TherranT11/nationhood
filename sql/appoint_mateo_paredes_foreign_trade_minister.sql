-- ════════════════════════════════════════════════════════════════════
-- ADMIN / DATA FIX: appoint Mateo Paredes Minister of Foreign Affairs &
-- Trade (Sierramar) + resign his community-organizer candidacy
-- ════════════════════════════════════════════════════════════════════
-- Effects:
--   1. Names Mateo Paredes the minister on Sierramar's cabinet rows for
--      BOTH ministry_key = 'foreign' (diplomacy / war) and 'trade'
--      (shipping). The engine keeps them as two functional keys, but the
--      player-facing portfolio is one — "Foreign Ministry & Trade" — so
--      the 'foreign' row is renamed to that. This is what grants Head
--      Office (cabinet-office.html) access: the gate name-matches the
--      ministries row for the nation. A companion code change adds
--      'foreign' to that gate's key list so the portfolio opens the door.
--      party_id is set from his real party membership (he sits with
--      Partido de la Vanguardia Soberana — read off politician_party_id).
--   2. Records the appointment in pinned_ministers (20270911) so it
--      survives re-formation: while PVS keeps the foreign/trade portfolio
--      the deferred trigger restores Mateo after each formation; if PVS
--      loses the portfolio the pin retires and the new coalition's
--      appointee stands. Requires the 20270911 migration to be applied.
--   3. Deletes his in-flight community-organizer candidacy from
--      politician_active_election ("auto-resign the office he's running
--      for"). Held office is left untouched — he's a candidate, not a
--      sitting community organizer.
--
-- His politician hero / career H1 then reads "Minister of Foreign Affairs
-- & Trade" via careerLabel() (js/utils.js), which now reads the ministries
-- table — one source of truth with the Head Office gate.
--
-- Idempotent. Transactional.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_nation_id  uuid;
    v_pol        factions%ROWTYPE;
    v_party_name text;
    v_key        text;
    v_existing   uuid;
    v_deleted    int;
    v_keys       text[] := ARRAY['foreign', 'trade'];
BEGIN
    -- Resolve Sierramar.
    SELECT id INTO v_nation_id FROM nations WHERE name = 'Sierramar' LIMIT 1;
    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'Sierramar nation not found.';
    END IF;

    -- Resolve Mateo Paredes (active politician faction in Sierramar).
    SELECT * INTO v_pol
      FROM factions
     WHERE nation_id    = v_nation_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND leader_first_name ILIKE 'Mateo'
       AND leader_last_name  ILIKE 'Paredes'
     LIMIT 1;
    IF v_pol.id IS NULL THEN
        RAISE EXCEPTION 'Mateo Paredes politician faction not found in Sierramar.';
    END IF;

    -- Surface his party so the operator can confirm it's PVS (the cabinet
    -- row's party_id is set from this membership).
    SELECT faction_name INTO v_party_name FROM factions WHERE id = v_pol.politician_party_id;
    RAISE NOTICE 'Mateo Paredes: faction=%, party_id=% (%).',
        v_pol.id, v_pol.politician_party_id, COALESCE(v_party_name, 'no party / independent');

    -- ── Appoint as minister on the foreign + trade cabinet rows. ──
    FOREACH v_key IN ARRAY v_keys
    LOOP
        SELECT id INTO v_existing
          FROM ministries
         WHERE nation_id = v_nation_id AND ministry_key = v_key AND is_active = true
         LIMIT 1;

        IF v_existing IS NOT NULL THEN
            UPDATE ministries
               SET minister_first_name = v_pol.leader_first_name,
                   minister_last_name  = v_pol.leader_last_name,
                   minister_age        = COALESCE(v_pol.leader_age, minister_age, 40),
                   party_id            = v_pol.politician_party_id,
                   minister_approval   = COALESCE(minister_approval, 50),
                   ministry_name       = CASE WHEN v_key = 'foreign'
                                              THEN 'Foreign Ministry & Trade'
                                              ELSE ministry_name END
             WHERE id = v_existing;
        ELSE
            INSERT INTO ministries (nation_id, ministry_key, ministry_name, is_active,
                party_id, minister_first_name, minister_last_name, minister_age, minister_approval)
            VALUES (v_nation_id, v_key,
                CASE WHEN v_key = 'foreign' THEN 'Foreign Ministry & Trade' ELSE 'Ministry of Trade' END,
                true, v_pol.politician_party_id,
                v_pol.leader_first_name, v_pol.leader_last_name,
                COALESCE(v_pol.leader_age, 40), 50);
        END IF;
    END LOOP;

    -- ── Register the pins so re-formation honours them (20270911). ──
    INSERT INTO pinned_ministers (nation_id, ministry_key, party_id, first_name, last_name, age)
    SELECT v_nation_id, k, v_pol.politician_party_id,
           v_pol.leader_first_name, v_pol.leader_last_name, v_pol.leader_age
      FROM unnest(v_keys) AS k
    ON CONFLICT (nation_id, ministry_key) DO UPDATE
       SET party_id   = EXCLUDED.party_id,
           first_name = EXCLUDED.first_name,
           last_name  = EXCLUDED.last_name,
           age        = EXCLUDED.age;

    -- ── Resign the in-flight community-organizer candidacy. ──
    DELETE FROM politician_active_election
     WHERE politician_id = v_pol.id
       AND race_tier     = 'community';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE 'Cleared % community-organizer candidacy row(s).', v_deleted;

    RAISE NOTICE 'Mateo Paredes appointed Minister of Foreign Affairs & Trade (Sierramar, nation_id=%).', v_nation_id;
END $$;

-- Verify the appointment.
SELECT ministry_key, ministry_name,
       minister_first_name || ' ' || minister_last_name AS minister,
       minister_age, minister_approval, party_id
  FROM ministries
 WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sierramar' LIMIT 1)
   AND ministry_key IN ('foreign', 'trade')
   AND is_active = true
 ORDER BY ministry_key;

COMMIT;
