-- ════════════════════════════════════════════════════════════════════
-- ADMIN / DATA FIX: Mateo Paredes → the Foreign Minister POST (Sierramar)
-- ════════════════════════════════════════════════════════════════════
-- Single source of truth on the politician side: the dedicated Foreign
-- Minister post (factions.politician_foreign_minister_at_tick, 20270868 —
-- the FM&T cabinet post, one per nation). The hero, the Current Office
-- card, the faction-switcher suffix, and the Head Office gate all read
-- this column now (no ministries-table name-match).
--
-- Effects:
--   1. Vacate any current Sierramar Foreign Minister (one-per-nation index
--      factions_one_fm_per_nation), then appoint Mateo to the post.
--   2. Undo the earlier party-cabinet (ministries) appointment so the role
--      lives in exactly one place: clear Mateo off the 'foreign' ministries
--      row + drop his pinned_ministers 'foreign' pin. The ministries row
--      itself stays for the party-formation cabinet to fill.
--
-- Idempotent. Transactional. (His Junior Minister of Tourism rung is
-- cleared by the companion mateo_paredes_resign_junior_minister.sql.)
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_nation_id uuid;
    v_pol       factions%ROWTYPE;
    v_tick      int;
    v_vacated   int;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    SELECT id INTO v_nation_id FROM nations WHERE name = 'Sierramar' LIMIT 1;
    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'Sierramar nation not found.';
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE nation_id    = v_nation_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND leader_first_name ILIKE 'Mateo'
       AND leader_last_name  ILIKE 'Paredes'
     LIMIT 1;
    IF v_pol.id IS NULL THEN
        RAISE EXCEPTION 'Mateo Paredes politician faction not found in Sierramar.';
    END IF;

    -- One FM per nation — vacate any current holder other than Mateo.
    UPDATE factions
       SET politician_foreign_minister_at_tick = NULL
     WHERE nation_id = v_nation_id
       AND politician_foreign_minister_at_tick IS NOT NULL
       AND id <> v_pol.id;
    GET DIAGNOSTICS v_vacated = ROW_COUNT;

    -- Appoint Mateo to the dedicated Foreign Minister post.
    UPDATE factions
       SET politician_foreign_minister_at_tick = COALESCE(v_tick, 0)
     WHERE id = v_pol.id;

    -- One source: undo the earlier ministries-table appointment for him.
    DELETE FROM pinned_ministers
     WHERE nation_id = v_nation_id AND ministry_key = 'foreign';
    UPDATE ministries
       SET minister_first_name = NULL, minister_last_name = NULL,
           minister_age = NULL, party_id = NULL
     WHERE nation_id = v_nation_id AND ministry_key = 'foreign'
       AND minister_first_name = v_pol.leader_first_name
       AND minister_last_name  = v_pol.leader_last_name;

    RAISE NOTICE 'Mateo Paredes (faction=%) appointed Foreign Minister of Sierramar at tick %; vacated % prior holder(s).',
        v_pol.id, v_tick, v_vacated;
END $$;

-- Verify.
SELECT leader_first_name || ' ' || leader_last_name AS politician,
       politician_foreign_minister_at_tick AS fm_at_tick
  FROM factions
 WHERE faction_type = 'politician'
   AND leader_first_name ILIKE 'Mateo' AND leader_last_name ILIKE 'Paredes'
   AND nation_id = (SELECT id FROM nations WHERE name = 'Sierramar' LIMIT 1);

COMMIT;
