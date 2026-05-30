-- ════════════════════════════════════════════════════════════════════
-- SECOND FOLLOW-UP — finish the duplicate-prefix cleanup by renaming
-- the 3 "keeper" files of each dup-group so their prefixes don't
-- collide with the previous-fix's 9-digit prefixes as literal-string
-- prefixes.
--
-- Background:
--   • docs/baseline-duplicate-prefix-rename.sql renamed 12 files
--     from short prefix → 9-digit prefix (e.g.
--     20260420_create_custom_group_chat → 202604201). But the
--     keepers of each dup-group (the files whose short prefix the
--     first baseline already had registered) were left alone with
--     their 8-digit prefix.
--   • After that fix shipped, the next CI db push still failed with
--         Remote migration versions not found in local migrations directory.
--         supabase migration repair --status reverted 20260420 20260421 20260425
--     The 3 named versions were the keeper prefixes. Local files
--     existed with those exact prefixes, so naive set-difference
--     should have matched.
--   • Diagnosis: the keeper prefix 20260420 (8 chars) is a literal
--     string-prefix of the renamed-file prefix 202604201 (9 chars).
--     Same for 20260421 → 202604211 and 20260425 → 202604251. The
--     Supabase CLI's matcher gets confused when one registered
--     version is a string-prefix of another registered version that
--     also exists locally — it treats the shorter version as
--     unmatched. Every other baseline prefix in the project (~130
--     of them) is NOT a prefix-of any other version, which is why
--     they all matched cleanly.
--
-- Fix in the same commit as this SQL:
--   keeper renames (3 files), each gaining a trailing 0 so the prefix
--   is 9 digits long like the rest of the dup-group:
--     20260420_close_stuck_construction_insurance → 202604200
--     20260421_corp_bankruptcy_fk_cascade         → 202604210
--     20260425_add_corp_properties_role           → 202604250
--   After the rename, no registered version is a string-prefix of
--   another registered version, so the CLI's matcher has nothing to
--   trip over.
--
-- ── How to use this file ──
-- Paste the body into Supabase SQL Editor and run BEFORE merging the
-- keeper-rename commit to main. Same sequence as last time:
--   1. Run this SQL.
--   2. Merge the commit; CI runs db push, sees consistent state.
-- Safe to re-run.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- Drop the 3 short-prefix rows from the first baseline (these are the
-- keepers' old version keys; the keepers are being renamed to 9-digit
-- prefixes by the same commit).
DELETE FROM supabase_migrations.schema_migrations
 WHERE version IN ('20260420', '20260421', '20260425');

-- Insert the 3 new 9-digit prefix rows matching the renamed keepers.
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES
    ('202604200', 'close_stuck_construction_insurance'),
    ('202604210', 'corp_bankruptcy_fk_cascade'),
    ('202604250', 'add_corp_properties_role')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- Verify: should return 3 (the new keeper rows just landed).
SELECT count(*) AS new_keeper_rows
  FROM supabase_migrations.schema_migrations
 WHERE version IN ('202604200', '202604210', '202604250');

-- Verify: should return 0 (the old short-prefix rows are gone).
SELECT count(*) AS old_short_prefix_rows_should_be_zero
  FROM supabase_migrations.schema_migrations
 WHERE version IN ('20260420', '20260421', '20260425');
