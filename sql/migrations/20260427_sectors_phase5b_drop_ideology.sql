-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTORS PHASE 5b — DELETE the ideology data layer
-- ═══════════════════════════════════════════════════════════════════════════════
-- All live readers and writers of ideology data were removed in Phase 5a.
-- This migration drops the ideology tables and ideology-axis columns.
--
-- Tables dropped:
--   * faction_ideology              — per-faction ideology axis scores
--   * ideology_history              — per-tick ideology delta log
--   * ideology_shift_actions        — think-tank / media-campaign / grassroots
--                                     player actions (now stub-failures)
--   * caucus_factions               — internal-caucus identity tied to axes
--   * caucus_dispositions           — per-bill caucus stance (axis-driven)
--   * faction_issue_stance          — faction stance on an axis-labeled issue
--   * issue_state                   — per-nation issue salience (axes only)
--
-- Columns dropped from surviving tables:
--   * factions.ideology, ideologies, ideology_value_1, ideology_value_2
--   * nations.{individualism|collectivism|liberty|equality|freedom|security|
--              tradition|progress|globalism|nationalism|cooperation}_voters
--     (eligible_voters stays — it's a population count, not ideology)
--   * electorate_profile.ideo_mean_*, ideo_var_*, salience_* (5 axes × 3)
--     (enthusiasm, demographics, salience_target, salience_floor stay)
--   * faction_electoral_standing.ideological_alignment, ideology_baseline,
--     alignment_contribution, polled_alignment, polled_alignment_contribution
--   * pm_candidates.ideology, ideology_axis, ideology_direction
--   * head_of_government.ideology
--   * presidents.ideology
--   * policies.ideology, ideologies
--
-- Idempotent: every operation uses IF EXISTS so re-running is safe.
--
-- DEPLOYMENT NOTE — also re-run sql/create_admin_kick_party.sql after this
-- migration. That RPC's stored body has bare DELETE FROM faction_ideology /
-- ideology_history calls that throw post-drop. The source file was updated
-- in this same Phase 5b commit; running the script reinstalls the cleaned
-- function in the DB. (admin_delete_party doesn't need re-running — its
-- per-statement exception handler already tolerates missing tables.)
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. DROP DEPENDENT VIEWS
-- ─────────────────────────────────────────────────────────────────────────────
-- nation_voter_breakdown was created ad-hoc in the live DB (not tracked in
-- repo SQL). It reads the per-axis voter columns on `nations` that step 3
-- drops, so it must be torn down first. CASCADE catches anything else that
-- transitively depends on it.

DROP VIEW IF EXISTS nation_voter_breakdown CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DROP TABLES
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS faction_ideology       CASCADE;
DROP TABLE IF EXISTS ideology_history       CASCADE;
DROP TABLE IF EXISTS ideology_shift_actions CASCADE;
DROP TABLE IF EXISTS caucus_dispositions    CASCADE;
DROP TABLE IF EXISTS caucus_factions        CASCADE;
DROP TABLE IF EXISTS faction_issue_stance   CASCADE;
DROP TABLE IF EXISTS issue_state            CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DROP COLUMNS — factions
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE factions
    DROP COLUMN IF EXISTS ideology,
    DROP COLUMN IF EXISTS ideologies,
    DROP COLUMN IF EXISTS ideology_value_1,
    DROP COLUMN IF EXISTS ideology_value_2;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DROP COLUMNS — nations (axis voter counts)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE nations
    DROP COLUMN IF EXISTS individualism_voters,
    DROP COLUMN IF EXISTS collectivism_voters,
    DROP COLUMN IF EXISTS liberty_voters,
    DROP COLUMN IF EXISTS equality_voters,
    DROP COLUMN IF EXISTS freedom_voters,
    DROP COLUMN IF EXISTS security_voters,
    DROP COLUMN IF EXISTS tradition_voters,
    DROP COLUMN IF EXISTS progress_voters,
    DROP COLUMN IF EXISTS globalism_voters,
    DROP COLUMN IF EXISTS nationalism_voters,
    DROP COLUMN IF EXISTS cooperation_voters;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. DROP COLUMNS — electorate_profile (the 5 axes × 3 fields = 15 columns)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE electorate_profile
    DROP COLUMN IF EXISTS ideo_mean_tradition_progress,
    DROP COLUMN IF EXISTS ideo_mean_liberty_equality,
    DROP COLUMN IF EXISTS ideo_mean_security_freedom,
    DROP COLUMN IF EXISTS ideo_mean_globalism_nationalism,
    DROP COLUMN IF EXISTS ideo_mean_individualism_collectivism,
    DROP COLUMN IF EXISTS ideo_var_tradition_progress,
    DROP COLUMN IF EXISTS ideo_var_liberty_equality,
    DROP COLUMN IF EXISTS ideo_var_security_freedom,
    DROP COLUMN IF EXISTS ideo_var_globalism_nationalism,
    DROP COLUMN IF EXISTS ideo_var_individualism_collectivism,
    DROP COLUMN IF EXISTS salience_tradition_progress,
    DROP COLUMN IF EXISTS salience_liberty_equality,
    DROP COLUMN IF EXISTS salience_security_freedom,
    DROP COLUMN IF EXISTS salience_globalism_nationalism,
    DROP COLUMN IF EXISTS salience_individualism_collectivism;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. DROP COLUMNS — faction_electoral_standing (alignment fields)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE faction_electoral_standing
    DROP COLUMN IF EXISTS ideological_alignment,
    DROP COLUMN IF EXISTS ideology_baseline,
    DROP COLUMN IF EXISTS alignment_contribution,
    DROP COLUMN IF EXISTS polled_alignment,
    DROP COLUMN IF EXISTS polled_alignment_contribution;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. DROP COLUMNS — pm_candidates / head_of_government / presidents
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE pm_candidates
    DROP COLUMN IF EXISTS ideology,
    DROP COLUMN IF EXISTS ideology_axis,
    DROP COLUMN IF EXISTS ideology_direction;

ALTER TABLE head_of_government
    DROP COLUMN IF EXISTS ideology;

ALTER TABLE presidents
    DROP COLUMN IF EXISTS ideology;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. DROP COLUMNS — policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE policies
    DROP COLUMN IF EXISTS ideology,
    DROP COLUMN IF EXISTS ideologies;

COMMIT;
