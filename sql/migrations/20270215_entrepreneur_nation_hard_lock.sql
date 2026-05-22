-- ════════════════════════════════════════════════════════════════════
-- HARD LOCK: no entrepreneur in a nation where you hold a Party / Military
-- ════════════════════════════════════════════════════════════════════
-- A user may not found an entrepreneur whose ORIGIN nation is one where
-- they already hold a Political Party or a Military Branch faction.
--
-- Entrepreneurs are nation-agnostic: factions.nation_id is NULL and the
-- origin is stored as a NAME in factions.nation (see entrepreneur-archetype.html).
-- Party / military factions key off factions.nation_id. So the lock joins
-- nations to compare the entrepreneur's origin NAME against the user's
-- party/military nation_id.
--
-- Enforced as a BEFORE INSERT trigger so it's a true hard lock — it fires
-- on every creation path (the direct upsert for a primary faction AND the
-- linked-secondary insert), independent of RLS or any client check.
--
-- A user's factions are matched the canonical way: id = uid OR
-- linked_user_id = uid, where uid = COALESCE(NEW.linked_user_id, NEW.id).
--
-- Existing entrepreneurs are grandfathered (INSERT-only). Idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_entrepreneur_nation_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid;
BEGIN
    IF NEW.faction_type <> 'entrepreneur' OR NEW.nation IS NULL THEN
        RETURN NEW;
    END IF;

    v_uid := COALESCE(NEW.linked_user_id, NEW.id);

    IF EXISTS (
        SELECT 1
          FROM factions f
          JOIN nations n ON n.id = f.nation_id
         WHERE f.faction_type IN ('party', 'military')
           AND f.abandoned_at IS NULL
           AND (f.id = v_uid OR f.linked_user_id = v_uid)
           AND n.name = NEW.nation
    ) THEN
        RAISE EXCEPTION
            'HARD_LOCK_ENTREPRENEUR_NATION: you already hold a Political Party or Military Branch in %, so an entrepreneur cannot originate there.', NEW.nation
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_entrepreneur_nation_lock ON factions;
CREATE TRIGGER trg_enforce_entrepreneur_nation_lock
    BEFORE INSERT ON factions
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_entrepreneur_nation_lock();

COMMENT ON FUNCTION public.enforce_entrepreneur_nation_lock() IS
    'BEFORE INSERT trigger on factions: blocks founding an entrepreneur whose origin nation (factions.nation, a name) matches a nation where the same user (id or linked_user_id) already holds an active party or military faction. Hard lock — fires on every creation path.';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_enforce_entrepreneur_nation_lock ON factions;
-- DROP FUNCTION IF EXISTS public.enforce_entrepreneur_nation_lock();
-- COMMIT;
