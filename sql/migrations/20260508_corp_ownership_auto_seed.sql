-- ══════════════════════════════════════════════════════════════
-- Auto-seed corp_ownership for new corporations
--
-- corp_ownership has no client-INSERT RLS policy (writes go through
-- SECURITY DEFINER RPCs only). To keep the ownership invariant
-- (every corp must have rows summing to 100) honored for newly
-- created corps without forcing every UI insert path to call an RPC,
-- add an AFTER INSERT trigger on factions that seeds the 100% row.
--
-- Holder selection mirrors the v2 backfill in
-- 20260430_corp_simplify_v2.sql:
--   linked_user_id present  → holder_type='player', holder_id=linked_user_id
--   linked_user_id is null  → holder_type='player', holder_id=factions.id
--                             (the founding-account case where the corp
--                             IS the auth.users row — id=user_id)
--   no auth context at all  → holder_type='state', holder_id=NULL
--                             (NPC corp seeded by admin scripts)
--
-- The trigger is idempotent: if a row already exists for the corp it
-- does nothing (e.g. an admin tool that pre-seeds ownership).
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION corp_ownership_auto_seed() RETURNS TRIGGER AS $$
BEGIN
    -- Only act on rows that are corporations.
    IF NEW.faction_type IS DISTINCT FROM 'corporation' THEN
        RETURN NEW;
    END IF;

    -- Skip if this corp already has ownership rows (idempotent).
    IF EXISTS (SELECT 1 FROM corp_ownership WHERE corp_id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Player-owned (primary or linked) → 'player' holder; else 'state'.
    IF NEW.linked_user_id IS NOT NULL THEN
        INSERT INTO corp_ownership (corp_id, holder_type, holder_id, pct)
        VALUES (NEW.id, 'player', NEW.linked_user_id, 100);
    ELSIF NEW.id IS NOT NULL AND EXISTS (
        SELECT 1 FROM auth.users WHERE id = NEW.id
    ) THEN
        -- Founding account case: factions.id is the user's auth.users.id.
        INSERT INTO corp_ownership (corp_id, holder_type, holder_id, pct)
        VALUES (NEW.id, 'player', NEW.id, 100);
    ELSE
        -- NPC / admin-seeded.
        INSERT INTO corp_ownership (corp_id, holder_type, holder_id, pct)
        VALUES (NEW.id, 'state', NULL, 100);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_corp_ownership_auto_seed ON factions;
CREATE TRIGGER trg_corp_ownership_auto_seed
  AFTER INSERT ON factions
  FOR EACH ROW
  EXECUTE FUNCTION corp_ownership_auto_seed();

COMMENT ON FUNCTION corp_ownership_auto_seed() IS
  'AFTER INSERT trigger on factions: seeds the 100% corp_ownership row for new corporations so the sum-to-100 invariant holds without requiring every UI insert path to call a separate RPC. Idempotent.';
