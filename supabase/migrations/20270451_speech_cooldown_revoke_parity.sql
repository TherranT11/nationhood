-- ════════════════════════════════════════════════════════════════════
-- Audit follow-up on 20270450 — close defense-in-depth gap inherited
-- from 20270381
--
-- 20270450 added door_knock_cooldown_until_tick with the REVOKE UPDATE
-- column-level pattern. The analogous speech_cooldown_until_tick from
-- 20270381 was added without that REVOKE — at the time the pattern
-- wasn't yet established for the politician faction columns.
--
-- The factions UPDATE policy (20260328 "Users can update linked
-- factions") allows authenticated users to update their own faction
-- row. Without column-level REVOKE, a client can send
--   UPDATE factions SET speech_cooldown_until_tick = 0 WHERE id = ...
-- and bypass the speech cooldown entirely. The same gap is closed for
-- door_knock_cooldown_until_tick (20270450), next_party_motion_tick
-- (20270419), next_member_action_tick / next_bill_propose_tick
-- (20270423), next_mp_action_tick (20270433), politician_office /
-- politician_office_won_at_tick (20270418 / 20270432). Speech was the
-- odd one out.
--
-- This migration is a single REVOKE — no RPC changes, no data
-- changes. Cleans up the parity gap so both Party Member action
-- cooldowns are server-write-only.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

REVOKE UPDATE (speech_cooldown_until_tick)
    ON factions FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN factions.speech_cooldown_until_tick IS
    'Earliest tick at which this politician may Give a Speech again. Stamped to current_tick + 3 by politician_give_speech on any non-rejected call. NULL = no cooldown. Server-only writes (RPC-only) — REVOKE UPDATE added in 20270451 to match the door_knock pattern from 20270450.';

NOTIFY pgrst, 'reload schema';

COMMIT;
