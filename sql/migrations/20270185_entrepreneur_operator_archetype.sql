-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR ARCHETYPE — comment de-enumeration
-- ════════════════════════════════════════════════════════════════════
-- 20270138 commented the column as "'heir' | 'founder'" — fine when
-- those were the only two archetypes. Adding 'operator' now (and any
-- future archetypes) drifts the comment from reality. The valid set
-- lives in js/game/factions.js (ENTREPRENEUR_ARCHETYPES) as the
-- single source of truth; the comment should point at the SSoT
-- rather than enumerate values that change every time.
--
-- No CHECK constraint exists on entrepreneur_archetype (column is
-- bare text), so no schema change is needed for the new archetype —
-- this migration is comment-only metadata cleanup.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

COMMENT ON COLUMN factions.entrepreneur_archetype IS
    'Entrepreneur only: the archetype key the player picked at setup (heir, founder, operator, …). NULL for all other faction types. Valid set is defined in js/game/factions.js ENTREPRENEUR_ARCHETYPES — that file is the single source of truth; this column is a label only (no CHECK enum, no FK).';

NOTIFY pgrst, 'reload schema';

COMMIT;
