-- ════════════════════════════════════════════════════════════════
-- Corp ownership backfill v2.
--
-- The original 20260513_corp_ownership_backfill ran in May 2026 to
-- catch corps created before trg_corp_ownership_auto_seed shipped
-- (20260508). New corps since then should have been seeded by the
-- trigger automatically, but at least one founder-owned corp has
-- shown up in the wild without a row (Fabrica Sangreza). Whether it
-- slipped past the trigger or got cleared by some other path
-- doesn't matter — this is a re-run of the same backfill, idempotent
-- (skips corps that already have any row).
--
-- Holder selection mirrors the trigger:
--   linked_user_id present  → 'player', linked_user_id
--   id matches auth.users   → 'player', id (founding-account corps)
--   neither                 → 'state', NULL (NPC / admin-seeded)
--
-- 100% per corp keeps the corp_ownership_sum_check invariant happy.
-- ════════════════════════════════════════════════════════════════

INSERT INTO corp_ownership (corp_id, holder_type, holder_id, pct)
SELECT
    f.id,
    CASE
        WHEN f.linked_user_id IS NOT NULL THEN 'player'
        WHEN EXISTS (SELECT 1 FROM auth.users u WHERE u.id = f.id) THEN 'player'
        ELSE 'state'
    END AS holder_type,
    CASE
        WHEN f.linked_user_id IS NOT NULL THEN f.linked_user_id
        WHEN EXISTS (SELECT 1 FROM auth.users u WHERE u.id = f.id) THEN f.id
        ELSE NULL
    END AS holder_id,
    100 AS pct
FROM factions f
WHERE f.faction_type = 'corporation'
  AND f.abandoned_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM corp_ownership o WHERE o.corp_id = f.id);
