-- ════════════════════════════════════════════════════════════════════
-- ADMIN / DATA FIX: Mateo Paredes resigns as Junior Minister of Tourism
-- ════════════════════════════════════════════════════════════════════
-- He now sits in the Cabinet as Minister of Foreign Affairs & Trade
-- (ministries table), so the lingering civil-service Junior Minister
-- appointment is stale. Clear the Junior Minister rung — the two columns
-- are bound together and set/cleared as a pair (20270669):
--   politician_junior_portfolio        (the portfolio, e.g. 'tourism')
--   politician_junior_minister_at_tick (appointment tick)
--
-- Only the Junior Minister rung is cleared; any lower civil-service rung
-- he holds is left untouched. Clearing a career-track column (non-null →
-- NULL) is LEAVING the track, so the single-affiliation trigger (20270907,
-- which guards ENTERING a track) does not fire. No reputation penalty —
-- this is a data correction, not an in-game resignation.
--
-- Idempotent. Transactional.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DO $$
DECLARE
    v_nation_id uuid;
    v_pol       factions%ROWTYPE;
    v_updated   int;
BEGIN
    SELECT id INTO v_nation_id FROM nations WHERE name = 'Sierramar' LIMIT 1;
    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'Sierramar nation not found.';
    END IF;

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

    RAISE NOTICE 'Mateo Paredes (faction=%) was Junior Minister of: %.',
        v_pol.id, COALESCE(v_pol.politician_junior_portfolio, '(none)');

    UPDATE factions
       SET politician_junior_portfolio        = NULL,
           politician_junior_minister_at_tick = NULL
     WHERE id = v_pol.id
       AND politician_junior_portfolio IS NOT NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;

    RAISE NOTICE 'Resigned Junior Minister appointment (% row updated).', v_updated;
END $$;

-- Verify.
SELECT leader_first_name || ' ' || leader_last_name AS politician,
       politician_junior_portfolio, politician_junior_minister_at_tick,
       politician_ministry
  FROM factions
 WHERE faction_type = 'politician'
   AND leader_first_name ILIKE 'Mateo' AND leader_last_name ILIKE 'Paredes'
   AND nation_id = (SELECT id FROM nations WHERE name = 'Sierramar' LIMIT 1);

COMMIT;
