-- ═══════════════════════════════════════════════════════════════════════════════
-- RESTORE GLOBAL + NATION CHATS AFTER IPO-WIPE CASCADE
-- ═══════════════════════════════════════════════════════════════════════════════
-- Background:
--   20260426_ipo_cash_conversion_and_wipe.sql ran TRUNCATE international_orgs
--   ... CASCADE. Postgres TRUNCATE CASCADE doesn't just delete referencing
--   rows — it truncates ANY table that has a foreign-key reference, in full.
--   group_chats has ipo_org_id REFERENCES international_orgs(id) (per
--   20260329_messaging_system.sql), which dragged the entire group_chats /
--   group_chat_members / group_chat_messages chain into the truncate.
--
--   Net damage:
--   - group_chats rows: gone (all of them — global, nation, ipo, custom)
--   - group_chat_members rows: gone
--   - group_chat_messages rows: gone (NOT recoverable)
--
--   This migration re-seeds the structural chats (Global + per-nation Nation
--   Chat) and backfills membership for every active party/corp faction. The
--   logic mirrors 20260424_phase1_nation_chat.sql and 20260424_phase2_global_chat.sql
--   — both are idempotent so running this on a healthy database is a no-op.
--
--   Custom chats and IPO chats are NOT restored; users will have to recreate
--   them. Message history is permanently lost.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Re-seed Global Chat ─────────────────────────────────────────────────
INSERT INTO group_chats (id, name, chat_type, created_by, created_at)
SELECT gen_random_uuid(), 'Global Chat', 'global', NULL, now()
WHERE NOT EXISTS (
    SELECT 1 FROM group_chats WHERE chat_type = 'global'
);

-- Backfill membership for every active party/corp faction.
INSERT INTO group_chat_members (chat_id, faction_id, joined_at, last_read_at)
SELECT gc.id, f.id, now(), NULL
FROM factions f
JOIN group_chats gc ON gc.chat_type = 'global'
WHERE f.abandoned_at IS NULL
  AND f.faction_type IN ('party', 'corporation')
  AND NOT EXISTS (
      SELECT 1 FROM group_chat_members m
      WHERE m.chat_id = gc.id AND m.faction_id = f.id
  );

-- ── 2. Re-seed Nation Chats ────────────────────────────────────────────────
INSERT INTO group_chats (id, name, chat_type, nation_id, created_by, created_at)
SELECT gen_random_uuid(), n.name || ' National Chat', 'nation', n.id, NULL, now()
FROM nations n
WHERE NOT EXISTS (
    SELECT 1 FROM group_chats gc
    WHERE gc.nation_id = n.id AND gc.chat_type = 'nation'
);

-- Backfill membership for every active party/corp faction in their nation.
INSERT INTO group_chat_members (chat_id, faction_id, joined_at, last_read_at)
SELECT gc.id, f.id, now(), NULL
FROM factions f
JOIN group_chats gc
  ON gc.nation_id = f.nation_id
 AND gc.chat_type = 'nation'
WHERE f.nation_id IS NOT NULL
  AND f.abandoned_at IS NULL
  AND f.faction_type IN ('party', 'corporation')
  AND NOT EXISTS (
      SELECT 1 FROM group_chat_members m
      WHERE m.chat_id = gc.id AND m.faction_id = f.id
  );

COMMIT;

-- ── Verification (run after migration completes) ───────────────────────────
-- Expect: 1 global chat + N nation chats, members ≈ count of active factions.
--
--   SELECT chat_type, COUNT(*) AS chats, COALESCE(SUM(member_count), 0) AS total_members
--   FROM (
--       SELECT gc.id, gc.chat_type, COUNT(m.faction_id) AS member_count
--       FROM group_chats gc
--       LEFT JOIN group_chat_members m ON m.chat_id = gc.id
--       GROUP BY gc.id, gc.chat_type
--   ) t
--   GROUP BY chat_type
--   ORDER BY chat_type;
