-- ════════════════════════════════════════════════════════════════════
-- Backfill Party Whip on existing movement parties
-- ════════════════════════════════════════════════════════════════════
-- admin_create_party has auto-filled empty Whip slots on new parties
-- since 20270396; this is the corresponding one-time backfill for
-- parties created before that landed (or where the admin left Whip
-- blank pre-fix and the row still carries NULLs).
--
-- Mirror of 20270412 (deputy backfill) and 20270413's leader backfill
-- — same formula, same guards, scoped to whip_* columns. Per-field
-- COALESCE preserves any typed values; idempotent on re-run because
-- every touched row ends up fully populated.
--
-- Scope: movement_party only — abandoned parties excluded, rows
-- whose nation has no first/last name pool excluded (defensive; all
-- shipped nations carry 30+ pool entries each). Does NOT touch any
-- denormalised whip pointer elsewhere — there isn't one.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE factions AS f
   SET whip_first_name = COALESCE(
           f.whip_first_name,
           n.first_name_pool[1 + floor(random() * array_length(n.first_name_pool, 1))::int]
       ),
       whip_last_name  = COALESCE(
           f.whip_last_name,
           n.last_name_pool[1 + floor(random() * array_length(n.last_name_pool, 1))::int]
       ),
       whip_age        = COALESCE(
           f.whip_age,
           35 + floor(random() * 31)::int
       )
  FROM nations AS n
 WHERE f.nation_id = n.id
   AND f.faction_type = 'movement_party'
   AND f.abandoned_at IS NULL
   AND (
         f.whip_first_name IS NULL
      OR f.whip_last_name  IS NULL
      OR f.whip_age        IS NULL
       )
   AND n.first_name_pool IS NOT NULL
   AND array_length(n.first_name_pool, 1) > 0
   AND n.last_name_pool  IS NOT NULL
   AND array_length(n.last_name_pool, 1)  > 0;

COMMIT;
