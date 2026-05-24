# Legacy Corporation Cull — Manifest & Tracker

Retiring the **legacy `faction_type='corporation'` system** while keeping the
newer **entrepreneur** system (`entrepreneur_corps` + `ent_*`). This file is the
source of truth for the 5-phase cull so any session can resume from here.

> **Two systems, easily confused.** Many `corp_*` tables belong to the *entrepreneur*
> era (KEEP). The cull targets only the faction-corp era. Every tag below is
> backed by a reference count (entrepreneur surfaces vs legacy surfaces).

## Status

- [x] **Phase 1 — Inventory & Freeze** (this doc + `20270239_freeze_legacy_corp_creation.sql`)
- [ ] Phase 2 — Frontend cull (pages + JS + entry links)
- [ ] Phase 3 — RPC / function cull (forward DROP migration)
- [ ] Phase 4 — Tick / edge decoupling (advance-corp-tick, advance-tick)
- [ ] Phase 5 — Schema teardown (legacy tables + `factions` columns)

**Rules:** forward-only `DROP` migrations (never edit the ~104 historical files);
each phase ends with build/lint + a dangling-reference grep + one reviewable commit;
the KEEP/SHARED allow-list is do-not-touch.

## Creation path (FROZEN in Phase 1)

Only vector: client insert/upsert into `factions` with `faction_type:'corporation'`
at `corp-nation-select.html:~1010`. Entry buttons: `faction-select.html:206`,
`js/military-topbar.js:298` → `select-nation.html:860` → `corp-setup.html` →
`corp-nation-select.html`. No seed/AI/edge vector found. Hard-locked by the
`trg_block_legacy_corp_creation` BEFORE INSERT trigger.

---

## CULL — pages

`corp-dashboard.html`, `corp-dashboard-home2.html`, `corp-operations.html`,
`corp-operations-finance.html`, `corp-operations-shipping.html`, `corp-nations.html`,
`corp-nation-select.html`, `corp-setup.html`, `aviation-operations.html`,
`airline-operations.html`

## CULL — JS modules (verify each is not imported by a KEEP page)

`js/corp-topbar.js`, `js/game/corp-valuation.js` (+ any legacy-only helpers they pull)

## CULL — tables (entrepreneur refs / legacy refs)

| Table | ent / legacy |
|---|---|
| `corp_properties` | 0 / 6 |
| `corp_ownership` | legacy only |
| `corp_contracts`, `corp_contract_bids`, `corp_contract_events` | legacy only |
| `corp_executives`, `corp_tax_bills`, `corp_pnl_history` | legacy (verify `corp_executives` vs notifications `checkExecContractsExpiring`) |
| `corp_aircraft_designs`, `corp_production_runs`, `corp_production_run_plants` | legacy aviation (verify 1 ent ref to `corp_aircraft_designs`) |
| `corp_airline_terminals` | legacy only |
| `aircraft_rfps`, `aircraft_rfp_bids` | 0 / 2 — legacy (entrepreneur uses `ent_aircraft_rfps`) |
| `shipping_routes`, `shipping_claims`, `shipping_applications`, `shipping_route_margin_ticks` | legacy shipping |
| `airline_city_ranges` | verify (likely legacy) |
| `finance_active_loans` | 1 / 2 — legacy finance |

## CULL — `factions` columns (~36 legacy corp stat columns)

`corp_sector`, `corp_subsector`, `corp_company_type`, `corp_ticker`, `corp_assets`,
`corp_fleet`, `corp_fleet_health`, `corp_freighters`, `corp_op_safety`, `corp_routes`,
`corp_route_risk`, `corp_productivity`, `corp_supply_chain`, `corp_employee_wages`,
`corp_work_crews`, `corp_regulatory_standing`, `corp_quality_control`, `corp_innovation`,
`corp_fraud_total`, `corp_production_capacity`, `corp_lending_capital`,
`corp_lending_capital_max`, `corp_interest_rates`, `corp_overleverage`,
`corp_overleverage_offset`, `corp_construction_action_locked_until_tick`,
`corp_finance_action_locked_until_tick`, `corp_shipping_action_locked_until_tick`,
`corp_last_processed_tick`, `corp_costs_current_tick`, `corp_opex_current_tick`,
`corp_profit_current_tick`, `corp_revenue_current_tick`, `corp_wages_current_tick`,
`corp_market_share`, `shipping_fleet_capacity`, `shipping_fleet_deployed`
*(verify `corp_debt`, `corp_reputation`, `corp_fleet`, `corp_id`, `corp_buildings` — possible SHARED reads.)*

## CULL — RPCs / functions (last-defining migration)

`claim_shipping_route`, `release_shipping_route`, `generate_organic_shipping_routes`,
`place_shipping_bid`, `place_shipping_offer`, `fire_shipping_action`,
`refresh_corp_routes_count`, `set_aircraft_tail_number`, `queue_production_run` (legacy),
`assess_corporate_taxes`, `pay_corporate_tax_full`, `cook_corporate_tax_books`,
`ignore_corporate_tax_bill`, `declare_corp_bankruptcy`, `airline_aircraft_ops_cost`,
`airline_aircraft_seats`, `airline_aircraft_value`, `process_airline_corp_tick`,
`corp_ownership_sum_check`, `corp_ownership_auto_seed`

## CULL — tick blocks

**`advance-corp-tick/index.ts`:** `processPropertyEffects` (~1118), `processRegionalHqIncome`
(~1253), `processCorpMonthlyIncome` (~2024), `processShippingRoutes` legacy passes A/B/C
(~2785–2950), `processAviationDesignResearch` (~2984), `processProductionRuns` (~3111),
`processAircraftRfpExpiry` (~3074), airline-sector `process_airline_corp_tick` loop (~3827),
reputation decay (~3892), legacy tax processor call (~4900+).
**`advance-tick/index.ts`:** `gov_bailout` legacy-corp path (~8220–8289).

---

## KEEP — entrepreneur (do-not-touch allow-list)

**Pages:** `entrepreneur-corp.html`, `entrepreneur-corporations.html`,
`entrepreneur-markets.html`, `diplomacy.html`; **JS:** `js/entrepreneur-topbar.js`.
**Tables:** `entrepreneur_corps`, all `ent_*`, `corp_buildings`, `corp_shareholdings`,
`corp_board_seats`, `corp_board_request*`, `corp_loans`, `corp_loan_offers`,
`corp_loan_requests`, `corp_sale_offers`, `corp_acquisitions`, `acquisition_messages`,
`corp_share_price_history`, `corp_no_confidence_*`.
**RPCs:** `submit_corp_loan_request`, `offer_loan`, `accept_corp_sale_offer`,
`agree_acquisition`, `_settle_corp_transfer`, `ent_*`, `process_corp_loans`,
`get_shipping_routes_for_corp`, `veto_shipping_bid`, `get_route_bids_for_minister`.
**Tick:** `process_entrepreneur_airline_routes`, `process_ent_aircraft_rfps`,
`process_ent_production_runs`.

## SHARED — keep, but de-legacy carefully (NOT delete)

| Entity | Why shared / action |
|---|---|
| `corp_aircraft` | ent 11 / legacy 1 — entrepreneur airline fleet. KEEP; strip legacy `airline_corp_id`(faction) usage in P4. |
| `airline_routes`, `airline_terminals`, `airline_cities` | ent ≫ legacy — entrepreneur airlines. KEEP. |
| `shipping_contracts`, `shipping_contract_bids`, `shipping_contract_events` | trade-agreement allocator serves legacy + entrepreneur bidders. KEEP; remove legacy-bidder branch only. |
| `emit_corp_cash_event`, `corp_cash_events`, `factions.corp_cash_reserves` | **Entanglement:** entrepreneur aircraft RPCs (`20270204`) charge `corp_cash_reserves` via `emit_corp_cash_event`. KEEP until `20270204` is confirmed superseded by the `ent_*` aviation system (`20270221`+) and migrated off — resolve before P5. |
| `process_trade_agreement_shipping_multiwinner`, `spawn_shipping_contracts_for_agreement` | dual-bidder allocator. KEEP; strip legacy payout branch in P3/P4. |
| `processTradeAgreementShipping` tick block (advance-corp-tick ~3235) | calls the shared allocator. KEEP. |

## Open verification items (resolve as their phase begins)

1. `20270204_entrepreneur_aircraft_rpcs.sql` — superseded by `20270221`+ `ent_*` aviation? If yes, its `emit_corp_cash_event`/`corp_cash_reserves` use is dead → unblocks culling the cash-event layer.
2. `corp_executives` — legacy, or used by entrepreneur `checkExecContractsExpiring` (notifications.js)?
3. `corp_aircraft_designs` 1 entrepreneur reference — confirm it's a comment, not a dependency.
4. `process_corp_loans` / `recompute_finance_stats` / `process_finance_loan_payment` — confirm they operate on entrepreneur `corp_loans`, not legacy `finance_active_loans`.
5. `factions.corp_debt` / `corp_reputation` / `corp_fleet` — confirm no SHARED reader before dropping.
