-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTORS PHASE 0 — audit follow-up: protect defaults + lock sector_key
-- ═══════════════════════════════════════════════════════════════════════════════
-- Defense-in-depth for two rules already enforced by the admin UI:
--
--   1. Default sectors (`is_default = true`) cannot be soft-deleted via UPDATE.
--      The UI hides the Remove button on default rows, but a direct API call
--      could still flip is_active. This trigger blocks that path.
--
--   2. `sector_key` is locked after insert. The admin UI auto-generates the key
--      from the name on creation and never exposes it for editing, but this
--      prevents accidental key mutation via direct UPDATE (which would silently
--      orphan any bills referencing the old key).
--
-- The guards intentionally cover only UPDATE — hard DELETEs are permitted so
-- that ON DELETE CASCADE from `nations` still works when a nation is removed.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION trg_sectors_protect_invariants()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.is_default = true AND NEW.is_active = false THEN
        RAISE EXCEPTION
            'Cannot soft-delete a default sector (sector_key=%, nation_id=%). Defaults can be renamed and reweighted but never deleted.',
            OLD.sector_key, OLD.nation_id;
    END IF;

    IF OLD.sector_key IS DISTINCT FROM NEW.sector_key THEN
        RAISE EXCEPTION
            'sector_key is immutable after insert (was=%, attempted=%). Bills will reference sectors by key — changing it would orphan them.',
            OLD.sector_key, NEW.sector_key;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sectors_protect_invariants ON sectors;
CREATE TRIGGER sectors_protect_invariants
    BEFORE UPDATE ON sectors
    FOR EACH ROW EXECUTE FUNCTION trg_sectors_protect_invariants();

COMMIT;
