-- ════════════════════════════════════════════════════════════════════
-- Movement parties: Deputy Leader + Party Whip
-- ════════════════════════════════════════════════════════════════════
-- factions has had leader_first_name / leader_last_name on movement_party
-- rows since 20270365 (admin-supplied at Add Party time). The party
-- detail page shows that single Leader card in its Party Leadership
-- panel. Adds two more leadership slots — Deputy Leader and Party Whip
-- — surfaced on party.html as a 3-up grid.
--
-- Columns are nullable. Existing rows aren't touched except for one
-- explicit backfill: HRF (Hajjaran Royal Front) gets a Deputy + Whip
-- picked from the Al-Makir (Hajjara culture) name pool in
-- js/game/political-actions.js so the only seeded movement_party
-- displays a fully populated leadership panel. Other movement_party
-- rows (none on the live DB today; any added later via the Add Party
-- admin form) can have the values supplied at creation time or filled
-- in by a future admin tool — there's no trigger here that would lock
-- the codebase into one culture's name pool.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions ADD COLUMN IF NOT EXISTS deputy_first_name text;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS deputy_last_name  text;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS whip_first_name   text;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS whip_last_name    text;

COMMENT ON COLUMN factions.deputy_first_name IS
    'Movement-party Deputy Leader given name. Nullable. Supplied at Add Party time or backfilled. Mirror of leader_first_name shape.';
COMMENT ON COLUMN factions.whip_first_name IS
    'Movement-party Party Whip given name. Nullable. Supplied at Add Party time or backfilled. Mirror of leader_first_name shape.';

-- HRF backfill. Names drawn from js/game/political-actions.js
-- ALMAKIR_FIRST_NAMES / ALMAKIR_LAST_NAMES — the same pool used to
-- generate Hajjara politicians on first-steps.html, so the deputy and
-- whip read as the same culture as Leader Mujar Adin.
UPDATE factions
   SET deputy_first_name = COALESCE(deputy_first_name, 'Kareem'),
       deputy_last_name  = COALESCE(deputy_last_name,  'Al-Mansouri'),
       whip_first_name   = COALESCE(whip_first_name,   'Tariq'),
       whip_last_name    = COALESCE(whip_last_name,    'Al-Najjar')
 WHERE faction_type = 'movement_party'
   AND faction_name = 'Hajjaran Royal Front';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- ALTER TABLE factions DROP COLUMN IF EXISTS whip_last_name;
-- ALTER TABLE factions DROP COLUMN IF EXISTS whip_first_name;
-- ALTER TABLE factions DROP COLUMN IF EXISTS deputy_last_name;
-- ALTER TABLE factions DROP COLUMN IF EXISTS deputy_first_name;
-- COMMIT;
