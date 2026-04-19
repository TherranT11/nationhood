# Construction Corporation System Deep Dive

This document maps the current Construction corp architecture, identifies simplification opportunities, and proposes a pragmatic refactor/cull plan.

## 1) Current System Topology

## Core runtime layers

1. **Tick processor (server authority)**
   - `supabase/functions/advance-corp-tick/index.ts` is the authoritative simulation engine for:
     - contract generation,
     - bid resolution,
     - permit gating,
     - in-progress project advancement,
     - delivery/inspection outcomes,
     - random project events,
     - permit lifecycle costs/expiry,
     - GDP side-effects.  
   - It is a single large file (~4.6k LOC), with construction logic embedded alongside shipping/other corp systems.

2. **Client operations surfaces (HTML + large inline modules)**
   - `corp-operations.html` (~14.5k LOC) and `corp-operations-shipping.html` (~14.7k LOC) both contain major inline game logic/UI orchestration.
   - They import shared modules (`materials.js`, `equipment.js`) but also carry local aliases and additional behavior.

3. **Shared game modules (`js/game/*`)**
   - `materials.js` and `equipment.js` contain domain data and calculators.
   - Legacy template module `construction-contracts.js` was culled after audit because it was not referenced by active construction flow.

4. **Data layer (SQL migrations + RPCs)**
   - Contracts/bids/deliveries: `construction_contracts`, `contract_bids`, `construction_deliveries`.
   - Permit system: `construction_permits`, `corp_permits` + `apply_for_permit` RPC.
   - Resource allocation: `project_material_allocations` + allocation/deallocation RPCs.

---

## 2) Mechanics Breakdown (What the game is doing today)

## Contract lifecycle

1. **Generation**
   - Tick function rolls contract slots by nation and inserts rows into `construction_contracts` with randomized budget/timeline/requirements.
   - Includes sector split (civil / industrial / mega) and cooldown handling for mega projects.

2. **Bidding / award**
   - Players bid into `contract_bids`.
   - Auto-resolution occurs when timer expires or bid count threshold is met.
   - Winner selection alternates between low-cost and quality-favoring heuristics.

3. **Start gating**
   - Awarded contracts are blocked from starting if required permits are missing.

4. **Execution**
   - Per tick checks:
     - workforce assignment sufficiency,
     - project material allocation/consumption,
     - contract stalling logic,
     - per-tick cost drain from corp cash,
     - phase/progress tracking.

5. **Delivery & quality scoring**
   - On completion threshold:
     - delivery record written to `construction_deliveries`,
     - quality score computed from bid quality, variance, permit bonuses/penalties, material grade effects, modifier penalties,
     - reputation/payment/penalty outcomes applied,
     - optional property handoff occurs for corp-issued/custom builds.

6. **Event layer**
   - Notification + regulatory events fire on eligible in-progress projects.
   - Permit holdings reduce event probability and/or penalties.

7. **Permit lifecycle**
   - Pending -> active transitions after processing ticks.
   - Expiry and recurring permit maintenance costs are processed server-side each tick.

## Good design choices already present

- Server-side authority for outcomes (prevents client tampering).
- Data model supports deeper simulation (materials, quality tiers, permits, events).
- Permit-policy coupling enables political gameplay impact without hardcoding per nation.

---

## 3) High-Impact Complexity / Friction Points

## A. Triple source-of-truth drift risk (templates/mechanics)

Construction templates and requirement data live in multiple places with different values and timelines:
- tick authority (`advance-corp-tick/index.ts`),
- client assumptions/aliases in operations pages.

This creates **silent balancing drift** and high regression risk when tuning.

## B. Equipment key mismatch + aliasing indirection

Canonical equipment keys differ across layers:
- shared equipment module uses keys like `trucks`, `mixers`, `cranes`, `haulers`, `piledrivers`,
- construction contract requirements/tick logic use `work_trucks`, `concrete_mixers`, `tower_cranes`, `heavy_haulers`, `pile_drivers`.

`corp-operations.html` adds alias translation to bridge this. This is brittle and easy to miss in new code paths.

## C. Monolithic tick function and monolithic pages

- Construction logic is deeply embedded in a giant edge function.
- Two huge operations pages duplicate substantial logic and diverge over time.

This slows iteration and makes targeted refactors expensive.

## D. Legacy schema footprint likely no longer used

`corp_contracts` / `corp_contract_bids` schema appears superseded by `construction_contracts` / `contract_bids` and has no active JS/edge usage references (outside migration file itself).

## E. Balancing constants spread over code

Cost multipliers, progression thresholds, random event probabilities, and quality formula coefficients are embedded inline rather than centralized in one balancing config.

---

## 4) Suspected Unused / Cull Candidates

These are strong candidates for deprecation review:

1. **Legacy contract schema migrations (`corp_contracts`)**
   - No runtime usage references found in JS/tick code.
   - Retain for historical migration integrity, but mark as deprecated in docs and prevent future use.

3. **Duplicated operations page logic**
   - `corp-operations.html` and `corp-operations-shipping.html` duplicate large sections.
   - Strong candidate for shared module extraction + thin page wrappers.

---

## 5) Refactor Blueprint (ordered, low-risk)

## Phase 0 — Safety rails (do first)

- Add a `construction-system-smoke.mjs` script that validates:
  - every template key has requirement definitions,
  - every requirement equipment/material key exists in canonical catalogs,
  - permit keys referenced by modifiers/events exist.
- Run this in CI before any balancing or migration merge.

## Phase 1 — Canonical data extraction

Create a single `js/game/construction-catalog.js` (or JSON) for:
- template metadata,
- requirement ranges,
- sector rules,
- key constants.

Then:
- load it in client UI,
- import/consume equivalent structured data in edge tick build step,
- ✅ `construction-contracts.js` has been removed after confirming no active references.

## Phase 2 — Key normalization

Choose one equipment key naming scheme and enforce globally.

Recommended: keep short stable keys (`trucks`, `mixers`, etc.) everywhere and migrate contract requirements + DB JSON to canonical keys.

Short-term compatibility:
- add explicit translation helpers in one place only,
- log on fallback alias usage,
- remove aliases after data backfill.

## Phase 3 — Decompose tick construction domain

Split `advance-corp-tick` construction logic into modules:
- `construction/generation.ts`
- `construction/bidding.ts`
- `construction/progress.ts`
- `construction/delivery.ts`
- `construction/events.ts`
- `construction/permits.ts`

Keep one orchestrator in `index.ts`.

## Phase 4 — UI extraction and deduplication

Extract shared operations logic into ES modules:
- contract board,
- bid composer,
- materials procurement,
- equipment manager,
- permit panel,
- project progress/event feed.

Make both operations pages thin shells using the same modules.

## Phase 5 — Balance config externalization

Move formula constants (quality/penalty/event weights) into a single config map and version it.

Benefits:
- faster balancing,
- easier A/B tuning,
- auditability for “why outcome changed”.

---

## 6) Workflow Tightening Recommendations

- **One owner map per subsystem**: explicitly define “authoritative source” for templates, formulas, and IDs.
- **Deprecation labels**: tag legacy files/migrations with clear `LEGACY_DO_NOT_USE` comments.
- **Migration checklist for new content**:
  1. add/modify template,
  2. update canonical catalog,
  3. run construction smoke test,
  4. verify UI render + tick simulation,
  5. verify permit/event linkage.
- **Instrumentation**: log contract funnel metrics (generated -> bid -> awarded -> started -> completed/failed) to quickly detect balance/pathing issues.

---

## 7) Practical First Sprint (1–2 weeks)

1. Create canonical construction catalog file.
2. Wire a read-only adoption path in both tick and client.
3. Add validation script and fail CI on mismatches.
4. Extract/centralize equipment key aliasing.
5. Keep cull checks in CI to prevent reintroduction of duplicate template sources.

This gives immediate complexity reduction without destabilizing live mechanics.

---

## 8) Expected Outcomes if roadmap is followed

- Faster balancing passes (single-file edits vs multi-file hunt).
- Fewer desync bugs between UI expectations and server outcomes.
- Easier onboarding for contributors.
- Cleaner long-term expansion (construction -> energy/finance parity).
