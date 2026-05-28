-- ════════════════════════════════════════════════════════════════════
-- Politicians get their own faction slot per (user, nation).
--
-- 20260419 created idx_factions_one_per_user_per_nation: at most one
-- ACTIVE faction per (owner, nation) regardless of faction_type. That
-- rule made sense when "faction" meant party or corp — both are heavy,
-- mutually-exclusive commitments in a single nation. Politicians have
-- since been introduced as a lighter overlay (Project Neptune): they
-- exist alongside the user's main engagement rather than replacing it,
-- and a player who runs a party in nation X reasonably wants a
-- politician character in that same nation X too.
--
-- Replace the single constraint with TWO partial unique indexes — one
-- on the politician slot, one on every other faction type. That gives:
--
--    party / corp / military / entrepreneur  →  1 per (user, nation)
--    politician                              →  1 per (user, nation)
--    politician + (one of the above)         →  allowed
--    two parties / two politicians / etc.    →  still blocked
--
-- Symmetry: this is direction-agnostic. A user who creates the party
-- first can then create a politician in the same nation; a user who
-- creates the politician first can then create a party.
--
-- Other lockouts are NOT relaxed by this migration:
--   • 20270215's enforce_entrepreneur_nation_lock still blocks an
--     entrepreneur whose origin matches a nation where the user holds
--     a party or military faction. That trigger never cared about
--     politicians (faction_type IN ('party','military') only).
--   • Client-side pre-check in createparty.html is updated in the same
--     PR to skip politicians.
--   • The politician creator (first-steps.html) had no client pre-
--     check; it relies on the DB to surface 23505. After this split
--     the only 23505 it can hit is politician × politician, so its
--     friendly message tightens from "a faction" to "a politician".
--
-- Idempotent (DROP IF EXISTS + CREATE UNIQUE INDEX IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Drop the old all-types-collapsed constraint.
DROP INDEX IF EXISTS idx_factions_one_per_user_per_nation;

-- One non-politician faction per (user, nation). Party / corp /
-- military / entrepreneur are all still mutually exclusive in a
-- single nation for a given user.
CREATE UNIQUE INDEX IF NOT EXISTS idx_factions_one_nonpolitician_per_user_per_nation
    ON factions (COALESCE(linked_user_id, id), nation_id)
    WHERE abandoned_at IS NULL
      AND nation_id IS NOT NULL
      AND faction_type <> 'politician';

-- One politician per (user, nation). Two politicians in the same
-- nation by the same user is still nonsensical — Project Neptune
-- creates a single character, not a roster.
CREATE UNIQUE INDEX IF NOT EXISTS idx_factions_one_politician_per_user_per_nation
    ON factions (COALESCE(linked_user_id, id), nation_id)
    WHERE abandoned_at IS NULL
      AND nation_id IS NOT NULL
      AND faction_type = 'politician';

COMMIT;

-- ── ROLLBACK ──
-- Re-create the collapsed single-slot constraint. WARNING: this fails
-- if any user has both a politician and a non-politician active in the
-- same nation. Abandon the politician (or the other faction) first.
-- BEGIN;
-- DROP INDEX IF EXISTS idx_factions_one_politician_per_user_per_nation;
-- DROP INDEX IF EXISTS idx_factions_one_nonpolitician_per_user_per_nation;
-- CREATE UNIQUE INDEX idx_factions_one_per_user_per_nation
--     ON factions (COALESCE(linked_user_id, id), nation_id)
--     WHERE abandoned_at IS NULL AND nation_id IS NOT NULL;
-- COMMIT;
