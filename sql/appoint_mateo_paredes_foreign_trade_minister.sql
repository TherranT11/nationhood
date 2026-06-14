-- ════════════════════════════════════════════════════════════════════
-- ADMIN / DATA FIX: appoint Mateo Paredes Minister of Foreign Affairs &
-- Trade (Sierramar) + resign his community-organizer candidacy
-- ════════════════════════════════════════════════════════════════════
-- Effects:
--   1. Names Mateo Paredes the minister on Sierramar's ministry_key =
--      'foreign' row — the Foreign Affairs & Trade portfolio. On the
--      POLITICIAN side trade is NOT a standalone ministry; Foreign
--      Affairs & Trade covers it (mirrors MINISTRY_NAMES.foreign_affairs).
--      The 'trade' ministry_key exists only for the businessman-side
--      shipping system, so we deliberately do NOT appoint him there and
--      do NOT surface a "Minister of Trade". Head Office access comes from
--      the gate's 'foreign' key. party_id is set from his real party
--      membership (Partido de la Vanguardia Soberana).
--   2. Records the pin in pinned_ministers (20270911) so re-formation
--      honours it while PVS keeps the foreign portfolio; if PVS loses it
--      the pin retires. Requires the 20270911 migration.
--   3. Deletes his in-flight community-organizer candidacy from
--      politician_active_election. Held office is left untouched — he's a
--      candidate, not a sitting community organizer.
--   4. Self-correcting: clears Mateo + the pin off the 'trade' row in case
--      an earlier version of this script placed him there.
--
-- His politician hero / career H1 then reads "Minister of Foreign Affairs
-- & Trade" via careerLabel() (js/utils.js), one source with the gate.
--
-- Idempotent. Transactional.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_nation_id  uuid;
    v_pol        factions%ROWTYPE;
    v_party_name text;
    v_existing   uuid;
    v_deleted    int;
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

    -- ── Appoint as Minister of Foreign Affairs & Trade ('foreign' row). ──
    SELECT id INTO v_existing
      FROM ministries
     WHERE nation_id = v_nation_id AND ministry_key = 'foreign' AND is_active = true
     LIMIT 1;

    IF v_existing IS NOT NULL THEN
        UPDATE ministries
           SET minister_first_name = v_pol.leader_first_name,
               minister_last_name  = v_pol.leader_last_name,
               minister_age        = COALESCE(v_pol.leader_age, minister_age, 40),
               party_id            = v_pol.politician_party_id,
               minister_approval   = COALESCE(minister_approval, 50),
               ministry_name       = 'Foreign Affairs & Trade'
         WHERE id = v_existing;
    ELSE
        INSERT INTO ministries (nation_id, ministry_key, ministry_name, is_active,
            party_id, minister_first_name, minister_last_name, minister_age, minister_approval)
        VALUES (v_nation_id, 'foreign', 'Foreign Affairs & Trade', true,
            v_pol.politician_party_id, v_pol.leader_first_name, v_pol.leader_last_name,
            COALESCE(v_pol.leader_age, 40), 50);
    END IF;

    -- ── Register the pin so re-formation honours it (20270911). ──
    INSERT INTO pinned_ministers (nation_id, ministry_key, party_id, first_name, last_name, age)
    VALUES (v_nation_id, 'foreign', v_pol.politician_party_id,
            v_pol.leader_first_name, v_pol.leader_last_name, v_pol.leader_age)
    ON CONFLICT (nation_id, ministry_key) DO UPDATE
       SET party_id   = EXCLUDED.party_id,
           first_name = EXCLUDED.first_name,
           last_name  = EXCLUDED.last_name,
           age        = EXCLUDED.age;

    -- ── Self-correct: undo any prior placement on the 'trade' row. ──
    -- Trade isn't a politician-side ministry; leave the row for the
    -- shipping system / formation to fill, just not with Mateo.
    DELETE FROM pinned_ministers
     WHERE nation_id = v_nation_id AND ministry_key = 'trade';
    UPDATE ministries
       SET minister_first_name = NULL, minister_last_name = NULL,
           minister_age = NULL, party_id = NULL
     WHERE nation_id = v_nation_id AND ministry_key = 'trade'
       AND minister_first_name = v_pol.leader_first_name
       AND minister_last_name  = v_pol.leader_last_name;

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
   AND ministry_key = 'foreign'
   AND is_active = true;

COMMIT;
