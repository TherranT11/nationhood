# Legacy Corporation Cull — Manifest & Tracker

Retiring the **legacy `faction_type='corporation'` system** while keeping the
newer **entrepreneur** system (`entrepreneur_corps` + `ent_*`). This file is the
source of truth for the 5-phase cull so any session can resume from here.

> **Two systems, easily confused.** Many `corp_*` tables belong to the *entrepreneur*
> era (KEEP). The cull targets only the faction-corp era. Every tag below is
> backed by a reference count (entrepreneur surfaces vs legacy surfaces).

## Status

- [x] **Phase 1 — Inventory & Freeze** (this doc + `20270239_freeze_legacy_corp_creation.sql`; founding entry buttons disabled; verification items worked)
- [x] **Phase 2 — Frontend cull (hard cull).** Deleted 13 pages (the 10 + `alliances.html`/`expansion.html`/`actions.html`, confirmed corp-only) + `js/corp-topbar.js` + `css/corp-topbar.css` + orphaned `js/corp-bankruptcy.js`. Rewired survivors: `factions.js` routes `corporation`→`faction-select.html`; `common.js` corp-navbar block + import + dead corp-tick-timing removed; `faction-select.html`/`select-nation.html` corp redirects removed; `notifications.js` `isCorp` branch + `checkExecContractsExpiring` removed; `admin.html` corp inspector emptied; `party-actions.js` disband-to-corp redirect removed. Verified: zero dangling refs (only code-comments mention corp-topbar), JS parses, lint clean. KEPT `corp-valuation.js` (shared). Audit also deleted 4 modules orphaned by the page removals: `js/corp-refurbish.js`, `js/sue-corp.js`, `js/equity-apply.js`, `js/game/equipment.js`.

### P2 audit notes / follow-ups
- **Pre-existing orphans (NOT this changeset, leave for a dead-code sweep):** `js/game/materials.js`, `js/game/vessels.js` (legacy construction/shipping data), `js/guide.js`, `js/politics.js` (non-corp; possibly loaded via a path the grep missed — verify before deleting).
- **Feature flag for P3:** the deleted `actions.html` carried the only commercial-lawsuit *filing* UI (`sue-corp.js`) and the equity-apply UI. Confirm these were legacy-corp-only before culling the lawsuit/equity RPCs — if `commercial_lawsuits`/equity apply to entrepreneur corps, an entrepreneur-side filing UI is missing.
- **P5 reminder:** `common.js` `refreshAP` still SELECTs `corp_cash_reserves`; clean when that column is dropped.
- [x] **Phase 3 — Client-only RPC cull** (`20270240`). Dropped 6 legacy RPCs with verified zero callers (frontend deleted): `claim_shipping_route`, `release_shipping_route`, `place_shipping_bid`, `fire_shipping_action`, `set_aircraft_tail_number`, `queue_production_run` (legacy).
- [~] Phase 4 — Tick / edge decoupling (IN PROGRESS, done in verified sub-steps; `advance-corp-tick` is hand-written, verify with `node --check`; **deploy the edge before applying the function-drop migrations**).
  - [x] **4a legacy aviation** — removed TS processors `processAviationDesignResearch`/`processProductionRuns`/`processAircraftRfpExpiry` + their calls from `advance-corp-tick` (entrepreneur aviation runs in `advance-tick` via `process_ent_*`, untouched). No SQL drop (these were TS; `queue_production_run` dropped in P3).
  - [x] **4b legacy shipping** — removed `processShippingRoutes` (TS; filtered to trade_agreement_id IS NULL, so the shared trade-agreement path was untouched) + dropped `place_shipping_offer`, `generate_organic_shipping_routes` (20270242). KEPT `processTradeAgreementShipping`. Fixed two stale comments that referenced the removed processor.
  - [x] **4c legacy airline** — removed the corp_sector=Airline `process_airline_corp_tick` loop from advance-corp-tick + orphaned `summary.airline` field; dropped `process_airline_corp_tick`, `airline_aircraft_ops_cost`, `airline_aircraft_seats`, `airline_aircraft_value` (20270243). Entrepreneur airlines (process_entrepreneur_airline_routes) untouched.
  - [x] **4d legacy corp economy** — DONE. First removed `processPropertyEffects`/`processRegionalHqIncome`/`processCorpMonthlyIncome`, reputation-decay, `assess_corporate_taxes` call (+dropped fn `20270244`), and the self-contained `generateShipMarketListings`/`processVesselOrderDeliveries`/`processEquipmentDeliveries`. Then the **full-loop removal** (one careful pass): deleted the entire per-nation legacy loop `for (const nation of nationList)` (corps fetched via `.eq('faction_type','corporation')`) — construction cluster, permit lifecycle, construction wages, GDP boost, energy, executive-expiry, transit cycles, vessel decay/maintenance, specialty buildings, defense — plus the pre-loop tier-contract generator feeding it. Then orphan-swept every now-callerless TS def: `generateCorpContractsByGdpTier`, `insertCorpContract`, `replenishPropertyMarketplace`, all permit helpers, `processCorpContracts`, the contract-event helpers + NPC/regulatory event tables (`NOTIFICATION_EVENTS`/`CHOICE_EVENTS`/`REGULATORY_EVENTS`/`ALL_EVENT_TEMPLATES`/`PHASE_WINDOW*`/`CC_*`), `expireExecutiveContracts`, vessel/transit helpers (`computeFuelCostForTransit`/`estimateMonthlyClaimMargin`/`resolveIncidentNationId`/`maintenanceMultiplierForStatus`/`getDeliveredPropertyMeta` + `VESSEL_*`/`NPC_SELLERS`/`SALE_REASONS`/`CORP_EQUIPMENT_DEFS`/`INCIDENT_RESERVE_RATE`), and `logShippingWriteFailure`. **advance-corp-tick: 3966 → 842 lines.** `node --check` passes; zero dangling refs. KEEP intact: `loadCorpHomeNations`/`logCashEvent`/`flushCashEvents`/`amortizedMonthlyPayment` (loan/cash infra), `processBankLoanExpiry`/`processBankLoanPayments`/`processCentralBankLoanPayments`/`processTradeAgreementShipping`/`process_entrepreneur_airline_routes`, equity dividends, the two pre-loop sweeps (`auto_abandon_stale_negotiations`/`auto_resolve_stale_incidents`). **SQL-side now callerless from this tick (drop in their phases, AFTER deploying this edge):** `apply_construction_wages_for_nation` + construction GDP-boost RPC (4d-migration), `process_lawsuit_deadlines` (4f), `process_finance_loans` deps / `finance_active_loans` writers (4e).
  - [~] 4e legacy loans — **edge decoupling DONE.** `processFinanceLoans` (finance_active_loans) removed in the 4d full-loop pass; now removed `processBankLoanExpiry`/`processBankLoanPayments` (bank_loans = faction lender/borrower; verified legacy — the entrepreneur loan flow uses `corp_loan_requests`/`corp_loans`, only `js/lawsuit-rule.js` still reads `bank_loans`) from advance-corp-tick. With them gone the **entire faction-corp cash-event ledger infra orphaned and was removed too**: `logCashEvent`, `flushCashEvents`, `loadCorpHomeNations`, `_pendingCashEvents`, `_corpHomeNation`, `_currentTick` (`processCentralBankLoanPayments` keeps NO ledger entry — it keys on entrepreneur_corps, not factions.id). **advance-corp-tick: 842 → 476 lines.** KEPT: `amortizedMonthlyPayment` (used by `processCentralBankLoanPayments`), `processCentralBankLoanPayments`, `processTradeAgreementShipping`, equity dividends, entrepreneur airlines, the two pre-loop sweeps. `node --check` passes; zero dangling refs; build marker bumped (2026-05-24-a). **SQL drops — first batch DONE (`20270246`).** Caller-matrix verified zero callers (client + edge + SQL bodies/triggers; entrepreneur loan flow uses `offer_loan`/`corp_loan_*`/`*_negotiation_*`, none touched) and dropped 10 legacy loan-action RPCs: `close_bank_loan`, `approve_loan_request`, `cancel_loan_request`, `decline_loan_request`, `bank_respond_to_loan_request`, `submit_loan_request` (both 8-arg + 9-arg sigs), `submit_loan_offer`, `reject_loan_offer`, `pay_out_loan`, `pay_down_debt`. **Deferred (entangled — own pass):** `recompute_finance_stats` + its ~22-caller legacy finance ecosystem (syndicated lending / joint equity / alliance LC / mutual aid / `fire_finance_action` / bankruptcy + lawsuit hooks); `set_finance_active_loans_original_principal` (trigger fn → Phase 5 with its table); the loan-negotiation RPCs + `_fire_negotiation` (`js/loan-negotiation-modal.js` appears unimported — confirm before drop). Tables (`bank_loans`/`bank_loan_requests`/`bank_loan_offers`/`finance_active_loans`/`finance_loan_requests`) drop in Phase 5. KEEP entrepreneur `corp_loans`/`central_bank_loans`.
  - [~] 4f lawsuits — **DECISION: keep & modernize** (not cull). The commercial-lawsuit feature is a live Minister-of-Justice docket on government.html but was hard-wired to legacy faction-corps + bank_loans (couldn't be filed at all post-freeze). Re-pointed to the entrepreneur ecosystem. **SQL foundation DONE (`20270247`):** added `plaintiff_corp_id`/`defendant_corp_id` (entrepreneur_corps; faction cols now nullable for dead legacy rows); rewrote `file_commercial_lawsuit` (new sig: corp ids + corp_loan id), `respond_to_lawsuit`, `respond_to_settle_offer`, `issue_ruling` to operate on `entrepreneur_corps.treasury_cash` + `corp_loans`; scope = loan disputes only (`non_payout` = lender sues borrower; `predatory_terms` = borrower sues lender); relief computed once in `_lawsuit_apply_plaintiff_relief` (shared by concede + plaintiff_wins). **No auto-sweep:** dropped `process_lawsuit_deadlines`; deadline enforced at action time + `issue_ruling` allows a default judgment on overdue-unanswered cases. Per-lawsuit `group_chats` thread kept (members = corp owners). **UI layer DONE:** `lawsuit-types.js` trimmed to the two loan grievances (single-source `GRIEVANCE_LABEL`); `lawsuit-rule.js` re-pointed (`loadLoan`→corp_loans, party `.name`/`.ticker`, settlement contract = continue/void only, default-judgment chips, removed dead ruling-deadline/currentTick/APR code); `government.html` Judicial docket query joins entrepreneur_corps corp parties + shows a "Default Judgment" Rule affordance on overdue-unanswered cases; **filing + disputes + defendant-response UI built on entrepreneur-corp.html** (Sue button on each active/defaulted corp_loan row → file_commercial_lawsuit; Legal Disputes panel with Respond [refute/settle/concede modal] and plaintiff Accept/Reject settle). **4f COMPLETE** (SQL `20270247` + audit `2c4ce65` + UI). Deploy note: apply `20270247` before serving the updated pages.
  - [~] 4g advance-tick — **`gov_bailout` MODERNIZED (not culled)**: the Government Bailout bill article now targets entrepreneur_corps instead of legacy faction-corps. Source `js/game/bills.js` enactBill handler re-pointed (`effect.corp_id`; validates the corp exists + HQs in the bill's nation; valuation via the shared `entrepreneur_corp_book_value` RPC; cap 3× book value; budget→debt draw + 0.1 gdp_growth unchanged; pays into `entrepreneur_corps.treasury_cash` directly — no faction corp_cash_events ledger); `index.ts` regenerated via `sync-edge-function.js` (diff confined to the bailout block). `laws.html` re-pointed: `_loadBailoutCorps` loads entrepreneur corps HQ'd in the nation with book-value valuation, article stores `corp_id`, serializes `effect_data.corp_id`; dropped the now-unused `computeCorpValuation` import. No grant migration needed (PUBLIC retains EXECUTE on the book-value fn). **Aviation-incident + bankruptcy cluster DONE (`20270248`):** the legacy aviation-incident system is faction-corp (`aviation_incidents.corp_id`→factions, fired by `process_airline_route_tick` which was only reached via the `process_airline_corp_tick` loop dropped in 4c) and now fully dead. **Correction:** `auto_resolve_stale_incidents` was mis-kept in advance-corp-tick during 4e — removed its call here (build marker 2026-05-24-b). Dropped `process_airline_route_tick`, `_fire_aviation_incident`, `_apply_op_safety_pact`, `respond_to_aviation_incident`, `auto_resolve_stale_incidents`, and `declare_corp_bankruptcy` (legacy faction-corp bankruptcy; entrepreneur `declare_bankruptcy` is separate, KEEP). Verified zero callers each; entrepreneur airline allocator does not use the incident system. Tables `aviation_incidents`/`aviation_incident_types` → Phase 5.
  - [~] 4g-rest — **loan-negotiation cull DONE (`20270249`):** `loan_negotiations` is faction-keyed legacy (`fired_to_loan_id`→bank_loans). Removed the mis-kept `auto_abandon_stale_negotiations` tick sweep (build 2026-05-24-c), deleted the orphan `js/loan-negotiation-modal.js`, and dropped the negotiation RPCs (`create_loan_negotiation`, `update_negotiation_terms` ×2 sigs, `set_negotiation_agreement`, `post_negotiation_message`, `mark_negotiation_seen`, `abandon_negotiation`, `auto_abandon_stale_negotiations`, `_negotiation_caller_role`, `_fire_negotiation`) + the `refund_escrow_on_faction_delete` trigger/fn. Verified zero callers; entrepreneur `offer_loan` is independent. Tables `loan_negotiations`/`loan_negotiation_messages` → Phase 5. **finance-stats ecosystem DONE (`20270250`):** every `recompute_finance_stats` caller was already dropped (close_bank_loan/pay_out_loan/pay_down_debt 4e, declare_corp_bankruptcy + _fire_negotiation 4g) except the syndicated-lending helpers. Removed the `process_syndicated_lending_rescues` advance-tick call (handler template + regenerated index.ts) and dropped `process_syndicated_lending_rescues`, `_apply_syndicated_lending_rescue`, `_deduct_peer_lending_capital`, `_apply_bad_debt_mutual_aid`, `fire_finance_action`, `recompute_finance_stats`. Verified zero callers each. **Deferred (tangential dead code, separate cleanup):** `_apply_joint_equity_split`/`_apply_aligned_interest_penalty` + their callerless entry points `accept_equity_offer`/`ratify_strategic_alliance` (equity_positions/strategic_alliances, not loan tables); `set_finance_active_loans_original_principal` trigger (→ Phase 5 with finance_active_loans).
  - **Phase 4 COMPLETE.** Remaining cull work is Phase 5 (schema teardown: legacy tables + factions corp_* columns + trigger fns).
  - **Loan classification (verified):** `bank_loans`/`finance_active_loans` = faction-based LEGACY → cull; `corp_loans` (corp_id) + `central_bank_loans` (entrepreneur_corp_id) = entrepreneur → KEEP.
- [~] Phase 5 — Schema teardown (staged, confirm each destructive step). **KEEP (reclassified):** `commercial_lawsuits` (modernized 4f), `corp_contracts` (live government stadium/infrastructure/military contracts + main-tick processor).
  - [x] **5A — remove legacy display UI (non-destructive):** deleted economy.html's legacy "Industries" tab (`loadIndustriesData`/`renderIndustriesTab`/`fmtIndustryMoney` + `_industries*` vars + nav/dispatch wiring; −774 lines; it loaded `faction_type='corporation'` corps + corp_properties/corp_vessels/shipping_*/finance_active_loans/corp_warehouse/corp_equipment/construction_*), removed news.js's gated `corp_properties` read, and common.js's legacy `shipping_applications` MoT pending-count. **Verified: all cleanly-dead legacy tables now have zero client/edge readers.**
  - [ ] 5B — DROP migration for the verified-dead tables (confirm list first).
  - [ ] 5C — `factions.corp_*` column audit + drop (per-column verified vs shared modules).
  - [ ] 5D — leftover trigger fns (`refresh_corp_routes_count`, `corp_ownership_sum_check`, `corp_ownership_auto_seed`, `set_finance_active_loans_original_principal`) + deferred dead fns (`_apply_joint_equity_split`/`_apply_aligned_interest_penalty` + `accept_equity_offer`/`ratify_strategic_alliance`), dropped with their tables.

### P3 findings / new follow-ups
- **Leftover P2 frontend — DONE.** Deleted the 3 orphaned legacy pressing-issues modules (`corp-tax-`, `loan-`, `lawsuit-pressing-issues.js`) — confirmed zero loaders (the orphan sweep had been fooled by comment-mentions in sibling modules; the surviving dashboards import only the entrepreneur/government ones: `corp-board-`, `acquisition-`, `corp-investment-`, `petition-`, `cos-report-`). Dropped the now-dead corporate-tax RPCs `pay_corporate_tax_full`/`cook_corporate_tax_books`/`ignore_corporate_tax_bill` (`20270241`).
  - **Chained orphan (audit) — deleted `js/lawsuit-respond.js`** (legacy lawsuit defendant/settle modal, was surfaced on corp-operations.html). Did not chain further (`game/lawsuit-types.js` still referenced elsewhere → kept).
  - **Commercial-lawsuits = legacy, cull in P4/P5.** It's `faction_type`-based and has **no entrepreneur UI** (entrepreneur pages never call `respond_to_lawsuit`/`commercial_lawsuits`), so its whole frontend is now gone with the corp pages — NOT an entrepreneur gap. Cull candidates: tick processor `process_lawsuit_deadlines`, RPCs `respond_to_lawsuit`/`respond_to_settle_offer` (now likely callerless), table `commercial_lawsuits`, the `checkLawsuits` notification (justice-minister) + `game/lawsuit-types.js`. Verify the justice-minister angle before removing the notification.
  - Legacy loan *respond* RPCs that `loan-pressing-issues.js` called may now be callerless — assess in P4 (legacy `finance_active_loans`, distinct from entrepreneur `corp_loans`).
- `airline_aircraft_ops_cost`/`_seats` ARE called by `process_airline_corp_tick` (20260721:207-209) — confirmed tick-bound, hence P4.

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

## CULL — JS modules

`js/corp-topbar.js` (+ `css/corp-topbar.css`) — the legacy corp nav chrome
(`renderCorpTopBar`, `SECTOR_OPS_PAGE`). **Entangled:** imported by surviving
shared pages — `js/common.js:15` (`SECTOR_OPS_PAGE` for the corp navbar block
~945), and `renderCorpTopBar` dynamic-imported by `actions.html:146`,
`alliances.html:865`, `expansion.html:1963`. Must unwire all four + the
`#corp-topbar-container` divs + CSS links before deleting.

> **CORRECTION (was tentatively CULL): `js/game/corp-valuation.js` is KEEP.**
> It is a SHARED valuation module imported by `entrepreneur-corp.html`,
> `entrepreneur-corporations.html`, `entrepreneur-markets.html`,
> `entrepreneur-dashboard.html`, `laws.html`, `expansion.html`, `alliances.html`.
> Do NOT delete.

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
| `process_trade_agreement_shipping_multiwinner`, `spawn_shipping_contracts_for_agreement` | dual-bidder allocator. KEEP; strip legacy payout branch in P3/P4. |
| `processTradeAgreementShipping` tick block (advance-corp-tick ~3235) | calls the shared allocator. KEEP. |

> **Reclassified → CULL (see V1):** `emit_corp_cash_event`, `corp_cash_events`,
> `factions.corp_cash_reserves`. These are **legacy-only**, not shared with the
> live entrepreneur system (which writes `treasury_cash` directly). Cull in P5
> after their legacy callers (tick blocks + legacy aircraft fns) are gone.
> Final-grep gate in P5: confirm no live entrepreneur RPC calls `emit_corp_cash_event`.

## Verification items (Phase 1 findings)

1. **RESOLVED.** `20270204` is a MIXED migration: it defines live entrepreneur fns (`process_entrepreneur_airline_routes`, `found_entrepreneur_corp`) AND **legacy** aircraft fns (`overhaul_aircraft`/`retire_aircraft`/`set_aircraft_tail_number`) — the latter are what charge `corp_cash_reserves` via `emit_corp_cash_event`. `entrepreneur_buy_aircraft` has zero callers (retired "generic buy"). ⇒ the cash-event layer is **legacy, not entangled** with the live entrepreneur system. Reclassified to CULL above.
2. **RESOLVED.** `corp_executives` is read only by the legacy `isCorp` branch (`checkExecContractsExpiring`) in `notifications.js` ⇒ **CULL**. That whole `isCorp` notification branch is legacy → remove in P2.
3. PENDING (P3): `corp_aircraft_designs` 1 entrepreneur reference — confirm it's a comment, not a dependency.
4. **RESOLVED.** `process_corp_loans` / `recompute_finance_stats` operate on entrepreneur `corp_loans` + `central_bank_loans` (per `20270175`/`20270233`) ⇒ **KEEP**. Legacy `finance_active_loans` is a separate system.
5. PENDING (P5): `factions.corp_debt` / `corp_reputation` / `corp_fleet` — confirm no SHARED reader before dropping.

## Also CULL in Phase 2 (found during P1)

- `notifications.js` legacy `isCorp` branch (`checkExecContractsExpiring` + the corp-only probe set in `refreshNotifications`).
- Founding entry buttons — **DONE in P1** (`faction-select.html` #opt-corp hidden; `js/military-topbar.js` found-corp item + handler removed).
- **Dead-but-present (deferred):** `faction-select.html` `chooseFactionType('corporation')` / `selectFactionOption('corporation')` branches and `select-nation.html`'s `pending_faction_type==='corp'` redirect are now unreachable (card hidden) but not yet removed — left intact this phase to avoid partial edits to a page that P2 removes wholesale. The DB trigger is the hard backstop if any path is somehow reached. NOTE: keep `faction-select.html:170-176` existing-corp redirect until corps are gone.
