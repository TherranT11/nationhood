-- ════════════════════════════════════════════════════════════════════
-- FREEZE legacy corporation creation (Corp-cull Phase 1 — no removals)
-- ════════════════════════════════════════════════════════════════════
-- Step 1 of retiring the legacy faction_type='corporation' system. No code
-- or data is removed; this only LOCKS the creation path so no NEW legacy
-- corporation can be founded while the cull proceeds.
--
-- The only creation vector is a client-side INSERT/upsert into `factions`
-- with faction_type='corporation' (corp-nation-select.html). No seed/AI/edge
-- path creates them. A BEFORE INSERT trigger is the hard, client-agnostic
-- lock; it fires only on INSERT, so existing corporations updating their own
-- rows are unaffected. Fully reversible (DROP TRIGGER).
--
-- The founding entry buttons (faction-select.html, js/military-topbar.js) are
-- removed in Phase 2; until then, walking the flow surfaces this trigger's
-- clean message instead of creating a row.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.block_legacy_corp_creation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.faction_type = 'corporation' THEN
        RAISE EXCEPTION 'Corporation founding has been retired.'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_legacy_corp_creation ON public.factions;
CREATE TRIGGER trg_block_legacy_corp_creation
    BEFORE INSERT ON public.factions
    FOR EACH ROW
    EXECUTE FUNCTION public.block_legacy_corp_creation();

COMMENT ON FUNCTION public.block_legacy_corp_creation() IS
    'Corp-cull Phase 1 freeze: rejects any new INSERT of a faction_type=''corporation'' row. Fires only on INSERT (existing corps'' UPDATEs are unaffected). Drop the trigger to unfreeze.';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_block_legacy_corp_creation ON public.factions;
-- DROP FUNCTION IF EXISTS public.block_legacy_corp_creation();
-- COMMIT;
