-- ══════════════════════════════════════════════════════════════
-- Backfill corp_ownership for any corporation missing a row.
--
-- The trg_corp_ownership_auto_seed trigger (20260508) seeds a 100%
-- ownership row on INSERT into factions, but corps created BEFORE
-- the trigger was deployed have no ownership rows — the dashboard
-- reads "No ownership data on file" for them. This one-shot
-- backfill applies the same holder-selection rules as the trigger
-- to every existing corp without ownership data.
--
-- Idempotent: skips any corp that already has rows.
-- ══════════════════════════════════════════════════════════════

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
  AND NOT EXISTS (SELECT 1 FROM corp_ownership o WHERE o.corp_id = f.id);
