-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN SUSPICION — factions.politician_suspicion
-- ═══════════════════════════════════════════════════════════════════════════════
-- politician-career.html displays a SUSPICION cell ("Low" / "Watched" / "High"
-- / "Severe"). The source of truth is this column — TEXT NOT NULL DEFAULT
-- 'Low' on every faction row, so the career page never reads a hardcoded
-- literal. Future progression code (scandals, dissident ties, exposure events)
-- updates the value in place; ignored for non-politician factions.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS politician_suspicion TEXT NOT NULL DEFAULT 'Low';

COMMENT ON COLUMN factions.politician_suspicion IS
    'Politician suspicion state, displayed on politician-career.html.'
    ' Defaults to Low on new politicians; future scandal / exposure code'
    ' updates the value. Ignored for non-politician factions.';

COMMIT;
