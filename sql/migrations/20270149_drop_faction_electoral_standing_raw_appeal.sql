-- ═══════════════════════════════════════════════════════════════════════════════
-- DROP faction_electoral_standing.raw_appeal — rawAppeal election cull
-- ═══════════════════════════════════════════════════════════════════════════════
-- Elections run entirely through faction_sector_popularity (run_election RPC,
-- 20260517: vote share = popularity × sectors.weight × sectors.base_turnout,
-- TWP / largest-remainder). The legacy rawAppeal / 3-pillar / softmax pipeline
-- in electorate.js tickElectorate was retired 2026-05 (return; at top of the
-- function — fully unreachable) and the genesis chain that seeded raw_appeal
-- (genesisElectorate → seedFactionElectoralStanding) is defined but has NO
-- caller anywhere in the repo.
--
-- The only LIVE reader of this column — party-actions.js's _standing fetch —
-- was a fetch-but-never-read dead path and is removed in the same change set.
-- No DB view / trigger / materialized view / RPC references raw_appeal
-- (verified: the sole schema reference is the original column definition in
-- 20260321_electorate_system_phase1_schema.sql:192).
--
-- party_approval and visibility on the same table are deliberately KEPT —
-- visibility is still written by the live boostVisibility / decay paths.
--
-- Destructive + irreversible for the column's row data (the values are inert —
-- nothing live reads them). Atomic (single transaction) and idempotent
-- (DROP COLUMN IF EXISTS — safe to re-run).
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE faction_electoral_standing DROP COLUMN IF EXISTS raw_appeal;

COMMIT;

-- ── ROLLBACK (structural only — dropped raw_appeal VALUES are unrecoverable) ──
-- BEGIN;
-- ALTER TABLE faction_electoral_standing
--     ADD COLUMN IF NOT EXISTS raw_appeal DECIMAL(5,2);
-- COMMIT;
-- (rawAppeal remains code-dead after rollback; this only restores the shape.)
