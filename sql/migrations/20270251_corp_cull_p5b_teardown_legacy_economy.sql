-- ============================================================================
-- Corp-cull Phase 5B: schema teardown — legacy faction-corp economy
-- ============================================================================
-- Drops the dead legacy faction-corporation economy: a 52-table connected
-- component plus the 41 functions that operate on it. Every object here was
-- verified (in branch claude/nationhood-project-setup-Dng1O) to have:
--   * zero client/edge readers,
--   * zero live tick/RPC callers (the last 3 mis-kept tick calls —
--     process_equity_dividends + the two alliance sweeps — were removed in
--     migration-adjacent edge changes / 5B-prep), and
--   * no surviving function that calls or references it.
--
-- DELIBERATELY KEPT — do NOT confuse with legacy:
--   * corp_cash_events + factions.corp_cash_reserves — still have live client/edge
--     READERS (createparty.html, admin.html, common.js, bills.js display corp
--     cash). Their only writer, emit_corp_cash_event, is itself now dead — but it
--     and the columns are kept here because the columns are read live; dropping
--     them is a Phase 5C concern, not part of this table/function teardown.
--     (Note: the live entrepreneur cash path uses entrepreneur_corps.treasury via
--     ent_place_construction_bid / entrepreneur_overhaul_aircraft — NOT this
--     ledger. The bare overhaul_aircraft / place_construction_bid are legacy.)
--   * corp_contract_events / shipping_contract_events — live audit logs for the
--     live corp_contracts / shipping_contracts systems (zero reads, live writes).
--   * The entrepreneur economy (corp_loans, corp_shareholdings, corp_contracts,
--     shipping_contracts, corp_aircraft, airline_routes, …).
--
-- NOT in this migration (deferred): the factions.corp_* COLUMNS — a per-column
-- liveness pass (Phase 5C), separate from this table/function teardown,
-- so the column teardown needs its own per-column pass (Phase 5C).
--
-- Idempotent: IF EXISTS + CASCADE throughout. CASCADE on the function drops
-- removes the 3 vestigial triggers still bound to the live factions table
-- (trg_dissolve_alliances_on_founder_delete, trg_aviation_starter_engine_auto_seed,
-- trg_corp_ownership_auto_seed).
-- ============================================================================

BEGIN;

-- ── 1. Drop legacy functions (41) ───────────────────────────────────
-- DO block drops every overload of each name with CASCADE (also unbinds the
-- triggers on factions that reference now-dead tables).
DO $$
DECLARE
    fn_names TEXT[] := ARRAY[
        '_alliance_caller_faction',
        '_alliance_caller_is_member',
        '_alliance_member_has_article',
        '_apply_aligned_interest_penalty',
        '_apply_joint_equity_split',
        '_cull_cascade',
        'allocate_material_to_project',
        'aviation_starter_engine_auto_seed',
        'award_aircraft_rfp',
        'bid_on_aircraft_rfp',
        'buy_airline_terminal',
        'cancel_aircraft_rfp',
        'cancel_design_research',
        'cast_alliance_interest_vote',
        'corp_ownership_auto_seed',
        'corp_ownership_sum_check',
        'deallocate_material_from_project',
        'dissolve_alliances_on_founder_delete',
        'dissolve_failed_alliance_negotiations',
        'finalize_alliance_interest_vote',
        'leave_strategic_alliance',
        'pay_out_equity',
        'post_aircraft_rfp',
        'post_alliance_interest_vote_message',
        'process_equity_dividends',
        'propose_strategic_alliance',
        'ratify_strategic_alliance',
        'reject_equity_offer',
        'relocate_corp_hq',
        'renew_executive_contract',
        'send_alliance_message',
        'start_aircraft_design_research',
        'start_alliance_interest_vote',
        'start_engine_design_research',
        'submit_alliance_vote',
        'submit_equity_offer',
        'submit_equity_raise',
        'sweep_alliance_interest_votes',
        'unsubmit_alliance_vote',
        'withdraw_alliance_interest_vote',
        'withdraw_strategic_alliance'
    ];
    fn_name  TEXT;
    proc     RECORD;
BEGIN
    FOREACH fn_name IN ARRAY fn_names LOOP
        FOR proc IN
            SELECT p.oid::regprocedure AS sig
              FROM pg_proc p
              JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = fn_name
        LOOP
            EXECUTE 'DROP FUNCTION IF EXISTS ' || proc.sig || ' CASCADE';
        END LOOP;
    END LOOP;
END $$;

-- ── 2. Drop legacy tables (52) ────────────────────────────────────
-- CASCADE clears intra-component FKs, indexes, RLS policies and any remaining
-- triggers on these tables.
DROP TABLE IF EXISTS
    aircraft_rfp_bids,
    aircraft_rfps,
    alliance_articles,
    alliance_chat_messages,
    alliance_interest_vote_ballots,
    alliance_interest_vote_chat,
    alliance_interest_votes,
    alliance_members,
    alliance_negotiation_votes,
    alliance_negotiations,
    aviation_incident_types,
    aviation_incidents,
    bank_loan_offers,
    bank_loan_requests,
    bank_loans,
    construction_contracts,
    construction_deliveries,
    corp_aircraft_designs,
    corp_airline_terminals,
    corp_cash_history,
    corp_equipment,
    corp_equipment_deliveries,
    corp_executives,
    corp_ownership,
    corp_permits,
    corp_pnl_history,
    corp_production_run_plants,
    corp_production_runs,
    corp_properties,
    corp_tax_bills,
    corp_vessels,
    corp_warehouse,
    equity_offers,
    equity_positions,
    equity_raises,
    finance_active_loans,
    finance_loan_offers,
    finance_loan_requests,
    loan_negotiation_messages,
    loan_negotiations,
    project_material_allocations,
    ship_market_listings,
    shipping_applications,
    shipping_claims,
    shipping_route_margin_ticks,
    shipping_routes,
    strategic_alliances,
    subsidiary_auto_policies,
    subsidiary_auto_rates,
    subsidiary_bids,
    subsidiary_sales,
    vessel_orders
CASCADE;

COMMIT;
