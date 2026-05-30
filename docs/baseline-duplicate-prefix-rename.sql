-- ════════════════════════════════════════════════════════════════════
-- FOLLOW-UP TO baseline-duplicate-prefix-fixup.sql — switch from long-
-- filename versions to renumbered short prefixes.
--
-- Background:
--   • baseline-duplicate-prefix-fixup.sql registered 12 duplicate-
--     prefix files using their FULL filename as the schema_migrations
--     version (e.g. '20260420_create_custom_group_chat'). That worked
--     for an older Supabase CLI that fell back to full filename when
--     prefixes collided.
--   • The current CLI (as pulled by `version: latest` in
--     .github/workflows/db-push.yml) extracts the version as the
--     leading numeric run only (^[0-9]+). It can't match the long-
--     name rows against any local file → `db push` aborts with
--     "Remote migration versions not found in local migrations
--     directory."
--   • The structurally correct fix is to make every prefix unique so
--     the CLI's straightforward extraction works regardless of
--     version. The same commit that ships this SQL renames the 12
--     duplicate-prefix files in supabase/migrations/ to unique 9-
--     digit prefixes (one file per dup-group keeps the original 8-
--     digit prefix; the others get the prefix + a 1-based suffix).
--
-- ── Renames mapping ──
--   20260420 group (7 files, keeper = close_stuck_construction_insurance):
--     20260420_create_custom_group_chat                → 202604201
--     20260420_equity_last_payment_amount              → 202604202
--     20260420_finance_active_loans_original_principal → 202604203
--     20260420_rename_civil_construction_subsector     → 202604204
--     20260420_tick_interval_8h                        → 202604205
--     20260420_vostia_unstick_caretaker                → 202604206
--   20260421 group (5 files, keeper = corp_bankruptcy_fk_cascade):
--     20260421_corp_properties_refurbish_count → 202604211
--     20260421_declare_corp_bankruptcy_rpc     → 202604212
--     20260421_military_loyalty_act            → 202604213
--     20260421_trade_flows_domestic_production → 202604214
--   20260425 group (3 files, keeper = add_corp_properties_role):
--     20260425_corp_cash_history                → 202604251
--     20260425_correct_legacy_regional_hq_roles → 202604252
--
-- ── Why the renamed prefixes still sort correctly ──
-- Lexicographic comparison: 20260420 < 202604201 < 202604202 ... <
-- 202604206 < 20260421 < 202604211 < ... — the shorter string is
-- "less" when it's a prefix of the longer one, so the keeper sorts
-- first within each group and the next-day prefix sorts after all
-- the renamed files. CLI applies migrations in this lexicographic
-- order; ordering inside an already-applied group is moot anyway.
--
-- ── How to use this file ──
-- Paste the body into Supabase SQL Editor and run BEFORE merging the
-- rename commit to main. Order matters:
--   1. Run this SQL (deletes 12 long-name rows + inserts 12 new
--      short-prefix rows).
--   2. Merge the rename commit to main. CI workflow runs
--      `supabase db push`, which now sees consistent state and
--      proceeds to apply any genuinely pending migrations.
-- If you run this AFTER merging, the CI run between the merge and
-- the fixup will still fail with the same error — no damage, just a
-- red badge until the SQL ran.
--
-- Safe to re-run: DELETE is filtered by version IN (...) so it only
-- touches those 12 rows; the INSERT uses ON CONFLICT DO NOTHING.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DELETE FROM supabase_migrations.schema_migrations
 WHERE version IN (
    '20260420_create_custom_group_chat',
    '20260420_equity_last_payment_amount',
    '20260420_finance_active_loans_original_principal',
    '20260420_rename_civil_construction_subsector',
    '20260420_tick_interval_8h',
    '20260420_vostia_unstick_caretaker',
    '20260421_corp_properties_refurbish_count',
    '20260421_declare_corp_bankruptcy_rpc',
    '20260421_military_loyalty_act',
    '20260421_trade_flows_domestic_production',
    '20260425_corp_cash_history',
    '20260425_correct_legacy_regional_hq_roles'
 );

INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES
    ('202604201', 'create_custom_group_chat'),
    ('202604202', 'equity_last_payment_amount'),
    ('202604203', 'finance_active_loans_original_principal'),
    ('202604204', 'rename_civil_construction_subsector'),
    ('202604205', 'tick_interval_8h'),
    ('202604206', 'vostia_unstick_caretaker'),
    ('202604211', 'corp_properties_refurbish_count'),
    ('202604212', 'declare_corp_bankruptcy_rpc'),
    ('202604213', 'military_loyalty_act'),
    ('202604214', 'trade_flows_domestic_production'),
    ('202604251', 'corp_cash_history'),
    ('202604252', 'correct_legacy_regional_hq_roles')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- Verify: should return 12 (the new short-prefix rows just landed).
SELECT count(*) AS new_short_prefix_rows
  FROM supabase_migrations.schema_migrations
 WHERE version IN (
    '202604201', '202604202', '202604203', '202604204', '202604205',
    '202604206', '202604211', '202604212', '202604213', '202604214',
    '202604251', '202604252'
 );

-- Verify: should return 0 (long-name rows gone).
SELECT count(*) AS old_long_name_rows_should_be_zero
  FROM supabase_migrations.schema_migrations
 WHERE version LIKE '20260420\_%' ESCAPE '\'
    OR version LIKE '20260421\_%' ESCAPE '\'
    OR version LIKE '20260425\_%' ESCAPE '\';
