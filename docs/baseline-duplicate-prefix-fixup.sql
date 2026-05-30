-- ════════════════════════════════════════════════════════════════════
-- ⚠ SUPERSEDED by docs/baseline-duplicate-prefix-rename.sql — do NOT
-- run this file on a fresh project. The "register by full filename"
-- approach below stopped working when the Supabase CLI tightened its
-- version-extraction to leading-numeric-only, which made every
-- subsequent `db push` fail with "Remote migration versions not
-- found in local migrations directory." The rename file resolves
-- the underlying duplicate-prefix problem by giving each file a
-- unique short prefix. Kept here purely as historical context for
-- the production DB that ran this once before the rename.
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- FOLLOW-UP BASELINE — register the 12 duplicate-prefix files the CLI
-- couldn't match against the first baseline.
--
-- Background: supabase/migrations/ has 169 files but only 157 unique
-- timestamp prefixes — 12 files share their YYYYMMDD prefix with
-- another file. The first baseline (baseline-schema-migrations.sql)
-- inserted one row per unique prefix, which works for the 157
-- non-duplicates. The 12 collided on the PK and only one of each
-- pair landed.
--
-- The Supabase CLI tracks each FILE separately when filenames share
-- a timestamp. For those 12 files, the CLI's version key is the
-- full filename (minus .sql), not just the prefix. This SQL
-- registers each of them under that full-filename version so the
-- next `db push` skips them.
--
-- Safe to re-run: ON CONFLICT DO NOTHING. Versions are full
-- filenames so they can't collide with anything in the existing
-- baseline (those used short timestamps).
-- ════════════════════════════════════════════════════════════════════

INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES
    ('20260420_create_custom_group_chat',                'create_custom_group_chat'),
    ('20260420_equity_last_payment_amount',              'equity_last_payment_amount'),
    ('20260420_finance_active_loans_original_principal', 'finance_active_loans_original_principal'),
    ('20260420_rename_civil_construction_subsector',     'rename_civil_construction_subsector'),
    ('20260420_tick_interval_8h',                        'tick_interval_8h'),
    ('20260420_vostia_unstick_caretaker',                'vostia_unstick_caretaker'),
    ('20260421_corp_properties_refurbish_count',         'corp_properties_refurbish_count'),
    ('20260421_declare_corp_bankruptcy_rpc',             'declare_corp_bankruptcy_rpc'),
    ('20260421_military_loyalty_act',                    'military_loyalty_act'),
    ('20260421_trade_flows_domestic_production',         'trade_flows_domestic_production'),
    ('20260425_corp_cash_history',                       'corp_cash_history'),
    ('20260425_correct_legacy_regional_hq_roles',        'correct_legacy_regional_hq_roles')
ON CONFLICT (version) DO NOTHING;

-- Verify: should return 12 (the new rows just added) or 145 if you
-- include the original baseline.
SELECT count(*) AS total_baselined,
       count(*) FILTER (WHERE version LIKE '%\_%' ESCAPE '\\') AS full_filename_rows
  FROM supabase_migrations.schema_migrations
 WHERE version < '20270392';

-- Confirm session migrations (20270392+) still NOT registered, so the
-- next CI db push applies them:
SELECT count(*) AS session_rows_should_be_zero
  FROM supabase_migrations.schema_migrations
 WHERE version >= '20270392';
