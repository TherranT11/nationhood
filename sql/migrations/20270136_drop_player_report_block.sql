-- ═══════════════════════════════════════════════════════════════════════════════
-- DROP player report + block (message_reports, user_blocks)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Removes the two player-facing moderation tables. Scope (confirmed):
--   * Player "Report" UI + message_reports  → removed
--   * Player "Block" UI + user_blocks        → removed
--   * Admin Moderation tab                   → KEPT (its reports half is
--       removed in admin.html; mute/ban management stays)
--   * Send/edit-path mute/ban/rate-limit triggers + group_chat_members
--     muted_until/banned_at/banned_by + edit-window columns → KEPT (dormant;
--     still driven by the admin tab's mute/ban tools). Removing those is a
--     separate, higher-risk task and is deliberately out of scope here.
--
-- Safe to DROP: no FK references INTO these tables and no DB
-- function/trigger/view/RPC depends on them (only the defining migration
-- 20260424_phase5_moderation.sql and client code referenced them). Their
-- RLS policies + indexes drop automatically with the table. Idempotent.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

DROP TABLE IF EXISTS message_reports;
DROP TABLE IF EXISTS user_blocks;

COMMIT;
