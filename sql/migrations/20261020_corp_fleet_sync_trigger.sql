-- ════════════════════════════════════════════════════════════════
-- Keep factions.corp_fleet in sync with owned aircraft.
--
-- Background: factions.corp_fleet (slot count) was backfilled once
-- in 20260718 and then never maintained. corp-nation-select.html
-- sets the starter value (=2) at corp founding for the seeded
-- 2-regional fleet, but every subsequent aircraft purchase or
-- removal leaves the count stale. UI hero stat at
-- airline-operations.html line ~2014 reads this column directly
-- and so drifts from reality the moment a player buys a second
-- plane.
--
-- Fix shape: AFTER trigger on corp_aircraft that recomputes
-- factions.corp_fleet for the affected corp by SUM(fleet_slots).
-- fleet_slots is GENERATED ALWAYS on corp_aircraft (1/2/3 by
-- class) so the source of truth is unambiguous. Trigger fires on
-- INSERT, DELETE, and UPDATE OF corp_id (defensive — aircraft
-- don't transfer between corps in normal play, but if it ever
-- does, both old and new corps need updating).
--
-- One-shot resync at the bottom catches any drift that has
-- already accumulated since 20260718.
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION sync_corp_fleet_slots()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- INSERT / UPDATE: recompute the (new) corp's slot total.
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        UPDATE factions
           SET corp_fleet = COALESCE((
               SELECT SUM(fleet_slots)::INT
                 FROM corp_aircraft
                WHERE corp_id = NEW.corp_id
           ), 0)
         WHERE id = NEW.corp_id;
    END IF;

    -- DELETE, or UPDATE that moved corp_id: also recompute the
    -- old corp. ON DELETE CASCADE from factions makes this a
    -- no-op when the corp itself is gone (UPDATE of a missing row
    -- affects 0 rows), which is the desired behavior.
    IF TG_OP = 'DELETE'
       OR (TG_OP = 'UPDATE' AND OLD.corp_id IS DISTINCT FROM NEW.corp_id) THEN
        UPDATE factions
           SET corp_fleet = COALESCE((
               SELECT SUM(fleet_slots)::INT
                 FROM corp_aircraft
                WHERE corp_id = OLD.corp_id
           ), 0)
         WHERE id = OLD.corp_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION sync_corp_fleet_slots() IS
    'AFTER trigger on corp_aircraft INSERT/DELETE/UPDATE-of-corp_id. Keeps factions.corp_fleet equal to SUM(corp_aircraft.fleet_slots) for the corp at all times. fleet_slots is a generated column on corp_aircraft (Regional=1, Narrowbody=2, Widebody=3), so the source of truth is the aircraft rows themselves.';

DROP TRIGGER IF EXISTS trg_sync_corp_fleet_slots ON corp_aircraft;
CREATE TRIGGER trg_sync_corp_fleet_slots
    AFTER INSERT OR DELETE OR UPDATE OF corp_id ON corp_aircraft
    FOR EACH ROW
    EXECUTE FUNCTION sync_corp_fleet_slots();


-- ── One-shot: re-resync any corps that have drifted since 20260718 ──
-- Pattern mirrors the original backfill at
-- 20260718_airline_founding_baseline.sql line 64-76.
UPDATE factions f
   SET corp_fleet = COALESCE(slot_totals.total, 0)
  FROM (
      SELECT corp_id, SUM(fleet_slots)::INT AS total
        FROM corp_aircraft
       GROUP BY corp_id
  ) slot_totals
 WHERE f.id = slot_totals.corp_id
   AND f.corp_fleet IS DISTINCT FROM COALESCE(slot_totals.total, 0);

-- Corps with stale corp_fleet > 0 but zero aircraft rows (e.g.,
-- early-game state where the seeded value never matched reality).
UPDATE factions f
   SET corp_fleet = 0
 WHERE f.corp_fleet > 0
   AND NOT EXISTS (SELECT 1 FROM corp_aircraft a WHERE a.corp_id = f.id);


NOTIFY pgrst, 'reload schema';

COMMIT;
