-- ════════════════════════════════════════════════════════════════════
-- Movement parties: name uniqueness scoped to (nation, faction_type)
-- ════════════════════════════════════════════════════════════════════
-- The live DB carries a global UNIQUE on factions.faction_name
-- (constraint name factions_faction_name_key — PostgreSQL's auto-name
-- for a column-level UNIQUE declared at table creation, not in any
-- migration in the codebase). That meant Add Party in Hajjara failed
-- with "duplicate key value violates unique constraint" when the
-- intended new name (e.g. "Reform Party") already existed on a faction
-- in a completely different nation. Two nations should be able to
-- have parties of the same name — they're separate political surfaces.
--
-- admin_create_party (20270370 / 20270351 lineage) already enforces
-- per-nation uniqueness at RPC time:
--
--     IF EXISTS (
--         SELECT 1 FROM factions
--          WHERE nation_id = v_nation_id
--            AND faction_type = 'movement_party'
--            AND LOWER(faction_name) = LOWER(v_name)
--            AND abandoned_at IS NULL
--     ) THEN
--         RETURN jsonb_build_object('success', false, 'reason', 'name_exists');
--     END IF;
--
-- This migration drops the global constraint and replaces it with a
-- partial unique index that mirrors that RPC check exactly — so the
-- DB-level guarantee matches what admin_create_party already promises.
--
-- Scope: 'party' (player-created via createparty.html) and
-- 'movement_party' (admin-created via admin_create_party). Both surface
-- in legislative / political UIs where a name collision would be
-- genuinely confusing. createparty.html has a per-user-per-nation
-- guard but no faction-name collision check — without the global
-- UNIQUE it had been relying on, two users could otherwise mint two
-- parties of the same name in the same nation. The partial unique
-- below closes that gap.
--
-- Other faction types (politician, corp, military) keep no DB-level
-- name uniqueness — politicians legitimately share given+family names
-- across players, corps use a separate naming surface in
-- entrepreneur_corps, and military's branch/nation pair is the
-- effective identity.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions DROP CONSTRAINT IF EXISTS factions_faction_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_factions_party_name_per_nation
    ON factions (nation_id, LOWER(faction_name))
    WHERE faction_type IN ('party', 'movement_party')
      AND abandoned_at IS NULL
      AND nation_id IS NOT NULL;

COMMIT;

-- ── ROLLBACK ──
-- WARNING: re-adding the global UNIQUE will fail if two active rows
-- now share a faction_name across nations (which is the whole reason
-- it was dropped). Reconcile first.
-- BEGIN;
-- DROP INDEX IF EXISTS idx_factions_party_name_per_nation;
-- ALTER TABLE factions ADD CONSTRAINT factions_faction_name_key UNIQUE (faction_name);
-- COMMIT;
