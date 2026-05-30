-- ════════════════════════════════════════════════════════════════════
-- ONE-TIME BASELINE — mark every PRE-SESSION migration as applied so
-- `supabase db push` doesn't try to re-run 145 files (most of which
-- aren't idempotent and have been manually applied to production
-- over time via the SQL Editor).
--
-- INTENTIONALLY EXCLUDES the 24 migrations from this session
-- (versions 20270392+) — the CLI will apply those on the next push.
-- All 24 are idempotent (CREATE OR REPLACE / IF NOT EXISTS / WHERE-
-- filtered UPDATE) so re-applying any that were already pasted into
-- the SQL Editor manually is a no-op, not a conflict.
--
-- Generated from supabase/migrations/*.sql with version < 20270392.
-- Safe to re-run: ON CONFLICT DO NOTHING.
-- ════════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS supabase_migrations;

CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version    text PRIMARY KEY,
    statements text[],
    name       text
);

INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES
    ('20260402', 'corp_last_processed_tick'),
    ('20260420', 'close_stuck_construction_insurance'),
    ('20260421', 'corp_bankruptcy_fk_cascade'),
    ('20260425', 'add_corp_properties_role'),
    ('20260618', 'shipping_contracts_trade_link'),
    ('20260619', 'spawn_shipping_contracts_on_agreement'),
    ('20260921', 'vola_stadium_annual_cost'),
    ('20260938', 'renew_executive_contract'),
    ('20260939', 'widen_spawn_and_retire_organic'),
    ('20260940', 'shipping_offer_tier_pricing'),
    ('20260941', 'vola_host_bid_sequential_gate'),
    ('20260942', 'alliance_interest_vote_runtime'),
    ('20260943', 'drop_budget_reserves_column'),
    ('20260944', 'vola_host_bid_scope_by_nation'),
    ('20261003', 'form_minority_government_rpc'),
    ('20261004', 'drop_institutions'),
    ('20261005', 'trade_negotiation_lock_trigger'),
    ('20261006', 'corp_cash_events_dividend_paid_category'),
    ('20261007', 'pay_out_equity_emit_cash_events'),
    ('20261008', 'process_equity_dividends_rpc'),
    ('20261009', 'alliance_founding_fee_emit_cash_events'),
    ('20261010', 'bid_to_host_vwc_admin_bypass'),
    ('20261011', 'form_minority_government_admin_bypass'),
    ('20261012', 'form_minority_government_keep_ministries_active'),
    ('20261013', 'shipping_contract_bids_applied_at_tick'),
    ('20261014', 'corp_cash_events_nation_id_column'),
    ('20261015', 'corp_cash_events_backfill_nation_id'),
    ('20261016', 'corp_tax_bills_schema'),
    ('20261017', 'corp_tax_rpcs'),
    ('20261018', 'trade_shipping_no_expiry'),
    ('20261019', 'aviation_condition_dynamics'),
    ('20261020', 'corp_fleet_sync_trigger'),
    ('20261021', 'aircraft_retirement'),
    ('20261022', 'aviation_manufacturing_schema'),
    ('20261023', 'place_shipping_offer_fix_expires_at_tick'),
    ('20261024', 'corp_innovation_comment_correction'),
    ('20261025', 'corp_ownership_backfill_v2'),
    ('20261026', 'construction_gdp_bonus_rpc'),
    ('20261027', 'aviation_design_research'),
    ('20261028', 'aviation_aircraft_design'),
    ('20261029', 'drop_crews_assigned'),
    ('20261030', 'aviation_production_runs'),
    ('20261031', 'impeachment_proceedings_rls'),
    ('20261101', 'crews_working'),
    ('20261102', 'volume_discount_tiers'),
    ('20261103', 'time_per_unit_tiers'),
    ('20261104', 'aircraft_design_specs'),
    ('20261105', 'crew_capacity_summary'),
    ('20261106', 'interior_infrastructure'),
    ('20261107', 'aircraft_rfps'),
    ('20261108', 'nations_history_public_approval'),
    ('20261109', 'drop_subsidiaries'),
    ('20261111', 'ensure_corp_last_processed_tick'),
    ('20261112', 'interior_infrastructure_upkeep'),
    ('20261113', 'strategic_alliances_founder_delete'),
    ('20261114', 'party_archetype_tiered_seeding'),
    ('20261115', 'nations_history_gdp_column'),
    ('20261116', 'nations_history_state_apparatus_column'),
    ('20261117', 'seed_nation_gdp_values'),
    ('20261118', 'nations_add_gdp_column'),
    ('20261119', 'finalize_formation_drop_is_active_filter'),
    ('20261120', 'finalize_formation_state_apparatus_in_snapshot'),
    ('20261121', 'finalize_alliance_interest_vote_rpc'),
    ('20261122', 'state_run_economy_corp_exodus'),
    ('20261123', 'strategic_alliances_add_aligned_interest_columns'),
    ('20261124', 'vola_cup_tables_backfill'),
    ('20261125', 'aircraft_rfps_named_priorities'),
    ('20261126', 'aircraft_rfps_cancel'),
    ('20261127', 'aviation_starter_engine'),
    ('20261128', 'aviation_starter_engine_thrust_revision'),
    ('20261129', 'aviation_cancel_design_research'),
    ('20261130', 'crisis_admin_delete_policies'),
    ('20261131', 'rescale_tax_policy_targets'),
    ('20261132', 'nations_history_full_alignment'),
    ('20261133', 'nations_history_self_describing'),
    ('20261134', 'backfill_light_assembly_plant'),
    ('20261203', 'impeachment_excluded_party'),
    ('20261211', 'drop_ambassadors_system'),
    ('20261212', 'drop_diplomatic_inbox_tables'),
    ('20261213', 'finance_debt_payment_event_polish'),
    ('20261214', 'claim_corp_tick_rpc'),
    ('20261215', 'halve_fundraise_yield'),
    ('20261216', 'drop_health_insurance_tables'),
    ('20261217', 'petition_for_reform'),
    ('20261218', 'petition_for_reform_broaden_monarchy_check'),
    ('20261219', 'petition_pressing_issue_redesign'),
    ('20261220', 'petition_revoke_authenticated_processor'),
    ('20261221', 'petition_filter_party_factions'),
    ('20261222', 'nations_history_sync_drift'),
    ('20261223', 'policy_options_stat_effects_backfill'),
    ('20261224', 'fix_construction_bid_displaced_trigger'),
    ('20261225', 'geological_survey_minerals'),
    ('20261226', 'geological_survey_cost_helper'),
    ('20261227', 'geological_survey_cooldown'),
    ('20261228', 'bloc_rpcs_support_linked_user_id'),
    ('20261229', 'schedule_snap_election_supports_linked_user_id'),
    ('20261230', 'debt_to_gdp_band_crises'),
    ('20261231', 'add_faction_branch'),
    ('20270101', 'national_energy_survey'),
    ('20270102', 'agricultural_expansion'),
    ('20270103', 'adopt_platform_drop_ap_cost'),
    ('20270104', 'army_operating_modifiers'),
    ('20270105', 'dissolve_orphaned_caretaker_formations'),
    ('20270106', 'hold_rally_rpc'),
    ('20270107', 'repair_platform_sector_popularity_prereqs'),
    ('20270108', 'platform_popularity_swap_momentum'),
    ('20270109', 'airline_flights_per_tick_scaling'),
    ('20270110', 'operational_safety_pact'),
    ('20270111', 'unstick_caretaker_elections'),
    ('20270112', 'army_officers'),
    ('20270113', 'bill_comments_rls'),
    ('20270114', 'bill_amendment_requests_rls'),
    ('20270115', 'allocate_defense_funds'),
    ('20270116', 'policy_options_manpower_pct'),
    ('20270117', 'tax_options_target_based'),
    ('20270118', 'cancel_trade_agreement_rpc'),
    ('20270119', 'shipping_contract_events'),
    ('20270120', 'rename_army_special_forces_to_loyalty'),
    ('20270121', 'army_units_phase1'),
    ('20270122', 'resign_military_faction'),
    ('20270123', 'resign_dispatch_event'),
    ('20270124', 'military_chat_access'),
    ('20270125', 'create_unit_uses_party_funds'),
    ('20270126', 'chief_of_staff_report'),
    ('20270127', 'cos_report_phase2'),
    ('20270128', 'cos_report_pgrst_reload'),
    ('20270129', 'cos_report_admin_inspector'),
    ('20270130', 'corp_contract_payout_fix'),
    ('20270131', 'rename_army_stats'),
    ('20270132', 'create_unit_dispatch_event'),
    ('20270133', 'foreign_officer_exchange'),
    ('20270134', 'combined_arms_school'),
    ('20270147', 'pay_down_national_debt_unit_fix')
ON CONFLICT (version) DO NOTHING;

-- Verify: should return ~140 rows baselined.
-- The 24 from this session (20270392+) stay UNREGISTERED, so
-- supabase db push will apply them on the next CI run.
SELECT count(*) AS baselined_versions
  FROM supabase_migrations.schema_migrations;

-- Confirm the post-20270391 versions are NOT marked applied:
SELECT count(*) AS this_session_versions_should_be_zero
  FROM supabase_migrations.schema_migrations
 WHERE version >= '20270392';
