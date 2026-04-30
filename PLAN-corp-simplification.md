# PLAN — Corporate Stat System Simplification

**Branch:** `claude/nationhood-corporate-redesign-hl2JM`
**Status:** DRAFT — review before execution
**Date:** 2026-04-30

---

## 1. Goal

Collapse the corporation system from ~20 interlocking subsystems down to **11 canonical stats**, and delete every system that no longer feeds them.

### Final canonical stat set (target schema)

**Identity (kept, reduced):**
- `name`, `ticker`, `sector`, `is_public` (Public/Private)
- CEO / founder linkage (kept — Executives system stays)

**Persisted stocks (on `corporations` row):**
| Stat | Type | Range | Source today |
|---|---|---|---|
| Cash | numeric | ≥ 0 | existing `corp_cash_reserves` |
| Debt | numeric | ≥ 0 | existing `corp_debt` |
| Assets | numeric | ≥ 0 | **NEW** — single number, replaces properties/equipment/vessels/warehouse |
| Innovation | numeric | 0–10 | rescaled from existing 0–100 |
| Market Share | numeric | 0–10 | rescaled from existing 0–100 |
| Reputation | numeric | 0–10 | rescaled from existing 0–100, decay rule replaced |
| Productivity | numeric | 0–10 | **NEW** |

**Per-tick flows (recomputed each tick, snapshotted on row + historized):**
| Stat | Source |
|---|---|
| Revenue | sum of contract payouts + other income for the tick |
| Costs | sum of operating costs (non-wage) for the tick |
| Employee Wages | sum of wage outflows for the tick |

**New ownership table:**
- `corp_ownership(corp_id, holder_type, holder_id, pct)` — must sum to 100% per corp
- Holder types: `player`, `state`, `shareholders`, `rival_corp`, etc.
- Seed: founding player corp owns 100%

---

## 2. What dies

### 2a. Tables dropped (full)
- `corp_workforce_audit`
- `corp_equipment`, `corp_equipment_deliveries`
- `corp_warehouse`
- `corp_vessels`, `vessel_incidents`, `vessel_insurance`, `shipping_application_vessel`
- `government_bonds`, `bond_holdings`, all bond-related RPCs
- `finance_insurance_*` / `construction_insurance` / `health_insurance_*` (if corp-only — flag if shared with nations)
- `construction_permits`, `permit_policies`, `project_permit_requirements`
- `corp_donation_cooldown`
- `corp_cash_history` → replaced by `corp_pnl_history`

### 2b. Columns dropped from `corporations`
- `subsector`
- `corp_general_workforce`, `corp_skilled_workforce`, `corp_innovative_workforce`
- `corp_operational_efficiency`
- `corp_credit_rating`, `corp_regulatory_standing`, `corp_political_influence` (UI-only legacy)
- `corp_loans` (legacy)

### 2c. Columns dropped from `corp_properties` *(see open question §5)*
- `subsector`

### 2d. Migrations marked dead (will be no-ops on fresh DB; see §4 strategy)
All of these become irrelevant — listed in deletion order:
- `20260329_corp_equipment.sql`
- `20260329_corp_warehouse.sql`
- `20260403_corp_starting_workforce_500.sql`
- `20260403_corp_workforce_columns.sql`
- `20260405_corp_property_subsector.sql`
- `20260406_corp_operational_efficiency.sql`
- `20260409_construction_permits.sql`
- `20260409_seed_permit_policies.sql`
- `20260410_construction_insurance.sql`
- `20260410_government_bonds.sql`
- `20260411_permit_gdp_stat_effects.sql`
- `20260412_insurance_fixes.sql`
- `20260412_permit_stat_effects_phase3.sql`
- `20260412_permits_phase1{a,b,c,d}_*.sql`
- `20260413_corp_vessels.sql`
- `20260413_vessel_insurance.sql`
- `20260415_permit_policy_integrity_*.sql`
- `20260415_project_permit_requirements_rpc.sql`
- `20260416_corp_donation_cooldown.sql`
- `20260417_shipping_application_vessel.sql`
- `20260418_vessel_incidents{,_job2}.sql`
- `20260418_sanitize_shipping_route_gov_contract_values.sql`
- `20260419_corp_cash_history.sql`
- `20260423_finance_bond_sell_and_dispute_rpcs.sql`
- `20260423_finance_loan_*.sql` *(IF unrelated to general debt — flag)*
- `20260423_health_insurance_phase{1..5}_*.sql` *(IF corp-only)*
- `20260423_release_stuck_corp_equipment.sql`
- `20260424_audit_corp_workforce_changes.sql`
- `20260424_debt_system_phase1.sql`, `_phase2_atomicity.sql`
- `20260424_deliver_vessel_order_rpc.sql`
- `20260426_buy_bond_linked_faction_support.sql`
- `20260428_release_stuck_corp_equipment.sql`

### 2e. JS files deleted
- `js/corp-shipping-data.js`
- `js/game/vessels.js`
- `js/game/equipment.js`
- `js/game/materials.js`
- `js/game/shipping.js`
- `js/game/subsidiary-*.js` *(flag — confirm subsidiaries are still wanted)*

### 2f. HTML pages deleted
- `corp-operations-shipping.html`
- `corp-operations-finance.html` *(or kept and stripped down to Cash/Debt only — flag)*

---

## 3. What changes

### 3a. `corp_contracts` table
Strip these columns (they reference dead systems):
- `assigned_workforce`, `assigned_assets`
- `permits_required`, `equipment_required`, `materials_estimated`
- `current_phase` *(phases were tied to construction stages — flag if you want a simpler progress model)*

Keep: `contract_type`, `budget`, `timeline_months`, `status`, `progress_months`, `amount_spent`, `deadline_tick`, `expected_finish_tick`.

### 3b. `corporations` row gains current-tick flow snapshot columns
- `revenue_current_tick`, `costs_current_tick`, `wages_current_tick`
(Plus history table — see §3c)

### 3c. New table `corp_pnl_history`
```
corp_id        uuid
tick           int
revenue        numeric
costs          numeric
wages          numeric
profit         numeric (generated: revenue - costs - wages)
cash_start     numeric
cash_end       numeric
PRIMARY KEY (corp_id, tick)
```

### 3d. Reputation rescale
- Old: 0–100, decay 0.25/tick, default 65
- New: 0–10, no automatic decay (driven by events: scandals, environmental damage, worker mistreatment, performance)
- Migration: `new = round(old / 10, 1)`

### 3e. Innovation / Market Share rescale
- Old: 0–100, UI-only, default 20 / 5
- New: 0–10, persisted, driven by gameplay events
- Migration: `new = round(old / 10, 1)`

### 3f. Bankruptcy RPC (`20260421_declare_corp_bankruptcy_rpc.sql`)
Rewrite valuation:
- Old: `(cash + property_value + equipment_value − liabilities) × 1.30`
- New: `(cash + assets − debt) × 1.30`

### 3g. Tick processor
- Remove: workforce updates, equipment condition decay, vessel fuel/condition decay, warehouse aging, permit checks, bond coupon payouts (corp side).
- Keep: contract progress, executive contract expiry.
- Add: per-tick recomputation of revenue/costs/wages → snapshot + history insert.
- Add: derived stat updates (Productivity computed from… *flag — see §5*).

---

## 4. Execution strategy

Two options for how to handle the migration history:

**(A) Squash into a single "corp v2" migration.**
Add one migration `20260430_corp_simplify_v2.sql` that drops every dropped table/column and creates the new ones. Leave old migration files in place as historical artifacts. Cleaner git diff, but the migration history file list stays bloated.

**(B) Delete dead migration files outright.**
Only safe if no production DB has run them, OR if we're OK rebuilding. You're solo on a feature branch — probably fine. Cleanest end state.

**Recommendation:** **(B)** — delete the dead migration files AND add one consolidating migration that defines the new shape. Anyone resetting DB gets the simple end state.

---

## 5. Open questions before we execute

1. **Properties / real estate** — not in your kill list, but Assets is now "a single number". Three options:
   - **(i)** Kill `corp_properties` entirely. Assets is a single number on the corp row that the player invests in directly.
   - **(ii)** Keep properties as flavor/UI but they don't produce stats — Assets is still a single number that they happen to represent.
   - **(iii)** Keep properties and have `Assets = SUM(property values)` — i.e. the "single number" is computed.
   - Which?

2. **Productivity formula** — what drives it? Options:
   - Function of Innovation + Wages + Reputation?
   - Set by player investment / events only?
   - Hybrid?

3. **Innovation / Market Share / Reputation update rules** — purely event-driven, or also tick-decay (like the old reputation)? Your spec mentions Innovation "pays off over time" and Reputation "tanks fast on scandals" — so event-driven sounds right, but confirm no passive drift.

4. **`corp-operations-finance.html`** — kill the page (since Bonds/Insurance are gone) or keep as a stripped Cash/Debt overview?

5. **Subsidiaries** (`js/game/subsidiary-*.js`, `corp_properties.subsector`/`logo_url`) — kill or keep? They came from the property system.

6. **Health insurance** (`20260423_health_insurance_phase*`) — is this nation-side (citizens) or corp-side? If corp-side it dies; if nation-side it stays. I'll verify before deleting.

7. **Loan system** (`20260423_finance_loan_*`) — Debt is kept as a stat, but is the *loan request/foreclose/payment RPC machinery* keeping or simplifying? Easiest: keep loans as the mechanism that produces the Debt number.

8. **Contract phases** — kill the 7-phase progression (Permits/Planning/.../Delivery)? Permits phase is dead; the rest tie to construction. Replace with simple `progress_pct`?

---

## 6. Suggested ordering when we execute

1. Answer §5 open questions.
2. Write the consolidating migration `20260430_corp_simplify_v2.sql`.
3. Write `corp_ownership` + `corp_pnl_history` table migrations.
4. Delete dead migration files (§2d).
5. Delete dead JS files (§2e).
6. Strip dead UI sections from kept HTML pages.
7. Delete dead HTML pages (§2f).
8. Rewrite tick processor + bankruptcy RPC.
9. Smoke-test: create corp on a fresh DB, run a tick, verify all 11 stats populate.
