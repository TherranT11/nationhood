# Phase 0: Remove Autocracy Action Systems

## Goal
Remove the action/interaction layer for Autocracy factions (both Strongman and Non-Strongman) while preserving the Autocracy government type itself as a functioning shell. After this phase, autocracy nations exist but factions cannot take autocracy-specific actions.

## What STAYS (Autocracy Government Type Shell)
- `government_type = 'autocracy'` recognition in `isAutocracy()` / `government-types.js`
- `ruling_faction_id` (who the strongman is) — needed for seat logic, elections
- Autocracy-specific seat allocation in elections (`isAutocracy` branches)
- Autocracy guard rails in `bills.js` (e.g. foundational law restrictions)
- The autocracy-setup.html page (nation creation flow)
- Basic autocracy branching in UI (e.g. "this is an autocracy" labels)
- Democratic Revolution system (already separate, triggers on stability/unrest)

## What Gets REMOVED — 6 Systems

---

### 1. LOYALTY SYSTEM

**What it is:** Faction-level loyalty stat (0-95) that decays based on regime health, modified by actions, controls purge eligibility and regime grip.

**DB columns (leave in place, stop using):**
- `factions.loyalty` (default 50)

**Tick processing to remove:**
- `processLoyaltyTick()` — `political-actions.js:2291-2378` / `advance-tick:15895`
- `processLoyaltyDemandExpiry()` — `political-actions.js:2393-2427` / `advance-tick:15997`
- `getAutocracyLoyaltyDecay()` — `political-actions.js:2283-2289`
- Tick caller lines in advance-tick: ~24378, ~24382

**UI to remove:**
- Loyalty display in faction rows — `politics.js:743-754`
- Loyalty visibility logic (`canSeeExactLoyalty`, `canSeeLoyaltyLabel`) — `politics.js:648-649`
- Loyalty color functions / labels — `politics.js:590` (regime grip uses avgLoyalty)
- Demand banner display — `politics.js:804-806`

**Config to remove:**
- `config.js:51-56` — PLEDGE_ALLEGIANCE_* loyalty constants
- `config.js:58-60` — CONSOLIDATE_POWER_LOYALTY
- `config.js:62-67` — DEMONSTRATE_COMPETENCE_LOYALTY
- `config.js:69-79` — EMBEZZLE_FUNDS_* loyalty constants
- `config.js:89-104` — INTIMIDATE_* loyalty constants
- `config.js:106-112` — PURGE_* loyalty constants
- `config.js:118-121` — REDISTRIBUTE_SEATS_* loyalty constants
- `LOYALTY_CAP: 95`

**Dependencies that need rewiring:**
- Regime Grip calculation uses avgLoyalty as 25% component — remove this component
- Purge eligibility requires loyalty < 20 — entire purge is being removed anyway

---

### 2. STANDING SYSTEM

**What it is:** Faction-level standing stat (0-90) representing political influence. Decays -1/tick if no standing-building action in 3 ticks. Affects embezzle income, buy influence costs, intimidation effectiveness, coup probability.

**DB columns (leave in place, stop using):**
- `factions.standing` (default 30)
- `factions.last_standing_action_tick`
- `stewards.standing` (default 40) — part of steward system removal

**Tick processing to remove:**
- `processStandingTick()` — `political-actions.js:2383-2460` / `advance-tick:16033`
- Tick caller line in advance-tick: ~24394

**Config to remove:**
- `STANDING_CAP: 90`
- `STANDING_RELEVANCE_DECAY_TICKS: 3`
- `COUP_MIN_STANDING: 15`
- All per-action standing constants (covered in action removal)

---

### 3. REGIME HEALTH SYSTEM

**What it is:** Nation-level stat (0-80 cap) representing autocratic regime stability. Decays -0.5/tick, recovers based on loyalty, stability, successor, no-crisis conditions. Triggers regime collapse at 0. Affects loyalty decay rate, coup probability, buy influence cost scaling.

**DB columns (leave in place, stop using):**
- `nations.regime_health` (default 80)

**Tick processing to remove:**
- `processRegimeHealthTick()` — `political-actions.js:6549-6608` / `advance-tick:20130`
- `getRegimeHealthTier()` — `political-actions.js:6543-6548`
- `handleRegimeCollapse()` — `political-actions.js:6609-6706`
- Tick caller line in advance-tick: ~24398

**UI to remove:**
- Regime health display / status labels — `politics.js:613-620`
- Regime health bar rendering — `politics.js:889-895`
- Regime grip calculation (entire concept) — `politics.js:587-592`

**Dependencies:**
- Bills.js term limit removal: `regime_health -= 5` — remove this effect
- Diplomacy state visit: regime health damage — remove this effect

---

### 4. AUTOCRACY-SPECIFIC ACTIONS (Strongman)

**What it is:** Actions available only to the ruling faction (strongman) in an autocracy.

**Functions to remove from `political-actions.js`:**
- `executePurge()` — lines 3342-3517 (purge a faction's steward, seize funds, redistribute)
- `executeRedistributeSeats()` — lines 3525-3596 (move seats between factions)
- `executeAppointSuccessor()` — lines 6159-6315 (appoint chosen successor / family)
- `executeRevokeSuccessor()` — lines 6317-6362 (revoke successor status)
- Demand Loyalty UI handler (inline in politics.js, creates `loyalty_demands` row)
- `renderSuccessorPanel()`, `renderPurgePanel()`, `renderRedistributePanel()` helper functions

**UI to remove from `politics.js`:**
- Strongman action panel (lines ~4884-4900): Demand Loyalty, Successor, Purge, Redistribute
- All click handlers for strongman actions
- Coalition betrayal loyalty penalty (line ~5365-5370)

---

### 5. AUTOCRACY-SPECIFIC ACTIONS (Non-Strongman / Steward)

**What it is:** Actions available to non-ruling factions who have claimed a pillar and become stewards.

**Functions to remove from `political-actions.js`:**
- `executePledgeAllegiance()` — lines 2615-2682
- `executeConsolidatePower()` — lines 2689-2735
- `executeDemonstrateCompetence()` — lines 2744-2827
- `executeEmbezzleFunds()` — lines 2837-2957
- `executeBuyInfluence()` — lines 2969-3107
- `executeIntimidate()` — lines 3114-3229
- `executeIntimidationResponse()` — lines 3242-3318
- `executeMobilize()` — lines 1685-1800
- `executeDynastyAction()` — lines 6395-6700+
- `executeCoupAttempt()` — lines 6978-7230+
- `calculateCoupProbability()` — lines 6773-6820
- `getEmbezzleRiskLabel()` — lines 3598-3612
- Coup invitation/response handlers
- `adjustStewardsCoupReadiness()` — lines 2596-2604
- Show of Force handler (inline in politics.js)

**UI to remove from `politics.js`:**
- Non-strongman action panel (lines ~4906-4991): Pledge, Consolidate, Demonstrate, Embezzle, Buy Influence, Show of Force, Mobilize, Dynasty
- All click handlers for these actions
- War chest display
- Buy influence cost preview
- Intimidation response overlay/handlers
- Coup invitation overlay/handlers

---

### 6. EMBEZZLED FUNDS SYSTEM

**What it is:** Faction-level hidden wealth (`embezzled_funds`) used as currency for autocracy actions. Earned via embezzlement, spent on Buy Influence, Intimidate, Demonstrate Competence, Coup attempts.

**DB columns (leave in place, stop using):**
- `factions.embezzled_funds` (default 0)
- `factions.consecutive_embezzle_ticks` (default 0)

**Already covered by action removal above.** All functions that read/write embezzled_funds are autocracy actions being removed. Just need to ensure no orphan references remain.

---

## STEWARD SYSTEM (Entangled — Remove)

The steward system (`stewards` table) is the backbone of autocracy actions. Every non-strongman action requires a steward. Stewards have their own tick processing.

**Tick processing to remove:**
- `processStewardTick()` — `political-actions.js:3636-3770+` / `advance-tick:17236`
- Tick caller line in advance-tick: ~24390

**UI to remove from `politics.js`:**
- Steward status panel (lines ~665-720): true_loyalty, estimated_loyalty, war chest, coup readiness
- Steward claim buttons ("BECOME STEWARD")
- Pillar rendering with steward info
- `renderRegimePillars()` or equivalent

**DB table (leave in place, stop using):**
- `stewards` table
- `loyalty_demands` table

---

## EXECUTION ORDER

1. **Tick processor**: Comment out / remove all 6 autocracy tick functions and their callers in advance-tick
2. **Action functions**: Remove all autocracy action `execute*` functions from political-actions.js
3. **Config constants**: Remove all autocracy-specific constants from config.js
4. **UI rendering**: Remove autocracy action panels, steward panels, regime health display from politics.js
5. **UI handlers**: Remove all autocracy action click handlers from politics.js
6. **Cross-file effects**: Remove regime_health effects from bills.js, diplomacy.html
7. **Guide**: Remove autocracy action descriptions from guide.js
8. **Rebuild advance-tick bundle**: Run sync script to update advance-tick/index.ts

## WHAT THE AUTOCRACY PAGE LOOKS LIKE AFTER

- Nation page still shows "Autocracy" as government type
- Parliament view still shows factions with seats
- Elections still work (autocracy election rules preserved)
- Bills still work (autocracy foundational law guards preserved)
- The "Actions" tab shows: "Autocracy actions are being redesigned. No actions available."
- No loyalty column, no standing column, no regime health bar, no steward panels
- Democratic Revolution still fires based on stability/unrest (already independent)

## FILES TOUCHED

| File | Changes |
|------|---------|
| `js/game/political-actions.js` | Remove ~5000 lines of action functions + tick processors |
| `js/game/config.js` | Remove ~80 lines of autocracy constants |
| `js/politics.js` | Remove ~600 lines of autocracy UI + handlers |
| `supabase/functions/advance-tick/index.ts` | Remove tick caller lines (rebuild from source) |
| `js/game/bills.js` | Remove regime_health effect (~5 lines) |
| `diplomacy.html` | Remove state visit regime_health damage |
| `js/guide.js` | Remove autocracy action guide entries |
| `government.html` | Remove regime health references if any |
| `dashboard.html` | Remove "Chance of Democratic Revolution" if coupled to regime |
