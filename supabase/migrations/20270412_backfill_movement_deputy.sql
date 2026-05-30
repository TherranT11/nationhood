-- ════════════════════════════════════════════════════════════════════
-- Backfill Deputy Leader on existing movement parties
-- ════════════════════════════════════════════════════════════════════
-- admin_create_party (20270396) auto-fills empty Deputy + Whip slots
-- on new parties using the nation's first_name_pool / last_name_pool
-- and a 35..65 age roll. Existing parties that were created BEFORE
-- that landed — or any party whose admin left Deputy blank pre-fix —
-- still carry NULLs and render as "Vacant" on the politician-side
-- party detail card.
--
-- One-time backfill: per (party, nation), fill any NULL deputy field
-- using the same formula the RPC uses. Per-field COALESCE so a party
-- with deputy_first_name set but no last name keeps the typed first
-- name and only fills the missing last + age (consistent with the
-- per-field independence the RPC enforces). Skipped:
--   - abandoned parties (no point reviving them)
--   - parties whose nation has no first/last name pool (defensive;
--     all shipped nations carry 30+ entries each)
--   - parties already fully populated (the WHERE catches this — no
--     row qualifies if all three deputy_* are non-NULL)
--
-- Scope: movement_party only — corporations / politicians / military
-- factions don't carry a deputy slot.
--
-- Whip is NOT backfilled here. The request was Deputy Leader
-- specifically; a matching Whip backfill is a one-line addition if
-- that pass comes next.
--
-- Idempotent: re-running this is a no-op because every row touched
-- on first run has all three deputy_* fields populated and falls
-- out of the WHERE clause on the second.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE factions AS f
   SET deputy_first_name = COALESCE(
           f.deputy_first_name,
           n.first_name_pool[1 + floor(random() * array_length(n.first_name_pool, 1))::int]
       ),
       deputy_last_name  = COALESCE(
           f.deputy_last_name,
           n.last_name_pool[1 + floor(random() * array_length(n.last_name_pool, 1))::int]
       ),
       deputy_age        = COALESCE(
           f.deputy_age,
           35 + floor(random() * 31)::int
       )
  FROM nations AS n
 WHERE f.nation_id = n.id
   AND f.faction_type = 'movement_party'
   AND f.abandoned_at IS NULL
   AND (
         f.deputy_first_name IS NULL
      OR f.deputy_last_name  IS NULL
      OR f.deputy_age        IS NULL
       )
   AND n.first_name_pool IS NOT NULL
   AND array_length(n.first_name_pool, 1) > 0
   AND n.last_name_pool  IS NOT NULL
   AND array_length(n.last_name_pool, 1)  > 0;

COMMIT;
