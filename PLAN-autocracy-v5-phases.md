# Autocracy V5 — 10-Phase Implementation Plan

Each phase is independently deployable. Later phases build on earlier ones.

---

## Phase 1: Database Schema & Core State

**Goal:** Create all new tables and columns. No game logic yet — just the data layer.

- Create `autocracy_tracker` table (nation_id, tracker_value 0–100 default 0, last_updated_tick)
- Create `faction_state` table (faction_id, pillar ENUM, backing DECIMAL 0–20, leader_name, leader_age, leader_birth_tick, death_age, is_strongman, is_wildcard, arrested_leader, minister_count, is_prime_minister, longevity_ticks, blackmail_immune_until, deploy_ap_level, bribe_ap_level, blackmail_ap_level, party_congress_last_tick, favor_last_tick, surveillance_targets JSON)
- Create `coup_attempt_log` table (attempt_id, faction_id, tick, tracker_at_attempt, roll_result, outcome ENUM)
- Create `silent_coup_offers` table (offer_id, from_faction_id, to_faction_id, offer_type ENUM, tick_offered, accepted)
- Create `silent_coup_votes` table (vote_id, faction_id, tick, choice ENUM)
- Add RPC stubs for future operations (placeholder functions)
- Seed initial `faction_state` rows for existing autocracy nations (4 factions, pillar assignment, leader generation, backing initialized to 20 each with wildcard at 20)

---

## Phase 2: Five Pillars & Backing System

**Goal:** Pillars exist, Backing is tracked, zero-sum enforcement works, passive drift runs each tick.

- Implement pillar assignment logic: Strongman claims one, 3 factions claim one each, one Wildcard
- Implement zero-sum Backing enforcement function:
  - Apply delta to target pillar
  - Distribute inverse delta proportionally across non-Wildcard pillars weighted by current Backing
  - Clamp all values 0–20
  - Assert sum == 100 (minus Wildcard decay float)
- Implement Wildcard pillar decay: -0.1 Backing/tick, floor at 0
- Implement passive drift (checked each tick before actions):
  - Military: civil_unrest ≤ 20 → +1, crime_rate ≤ 20 → +1
  - Oligarchs: gdp_growth ≥ 70 → +1, corruption ≥ 70 → +1
  - Party: stability ≥ 70 → +1, polarization ≥ 70 → +1
  - State Media: press_freedom ≤ 20 → +1, legitimacy ≥ 70 → +1
  - Security Services: crime_rate ≤ 20 → +1, freedom_index ≤ 20 → +1
  - Zero-sum redistribution after all pillar checks
- Wire passive drift + Wildcard decay into tick processor (step 1 and step 3 of tick order)

---

## Phase 3: Power Calculation & Regime Tracker

**Goal:** Hidden Power stat computed each tick. Regime Tracker operational with natural decay.

- Implement Power formula (server-side only, never exposed to client):
  - base = CEIL(backing / 4)
  - if is_prime_minister: base += 1
  - base += FLOOR(minister_count / 2)
  - if longevity_ticks >= 36: base += 1
  - power = CLAMP(base, 1, 5)
- Implement Power → Tracker delta map: {1: ±2, 2: ±3, 3: ±4, 4: ±5, 5: ±7}
- Implement tracker contribution function:
  - Determine delta from power_map
  - Half delta for AGITATE/CAPITAL_FLIGHT in FOR_REGIME mode
  - FOR_REGIME: tracker -= delta; FOR_YOURSELF: tracker += delta
  - Clamp 0–100
  - Skip entirely if actor is Strongman using foundation pillar actions
- Implement tracker natural decay (after all actions each tick):
  - if > 30: -1 (floor 30); if < 30: +1 (ceiling 30)
- Implement Strongman tracker word display: IRON/FIRM/RESTLESS/VOLATILE/CRITICAL
- Wire Power calculation + tracker decay into tick processor (steps 2–3)

---

## Phase 4: AP Economy & Dual-Mode Action Framework

**Goal:** AP system operational. Action framework supports FOR REGIME / FOR YOURSELF toggle. No specific actions yet.

- Implement +5 AP per tick, no carryover (reset to 0 then add 5 each tick)
- Build generic action dispatch system:
  - Validate AP cost (including escalating costs)
  - Validate cooldowns
  - Determine mode (FOR_REGIME or FOR_YOURSELF) — hidden from other players
  - Apply tracker contribution based on mode + Power
  - Apply governance effects (stat changes)
  - Log action
- Implement escalating cost framework:
  - Track per-leader escalation levels (deploy_ap_level, bribe_ap_level, blackmail_ap_level)
  - Reset all escalation levels + cooldowns on leader death
- Implement Strongman action filter: only show foundation pillar actions + exclusive actions
- Implement Stand Down special case: no dual mode, always FOR_YOURSELF

---

## Phase 5: Faction Actions (Military, Party, Oligarchs)

**Goal:** First 9 actions playable.

- **Military Actions:**
  - Deploy (2/4/6 AP escalating, reduces Civil Unrest + Political Violence, -1 Legitimacy, mutual exclusion with Military Exercises same tick)
  - Stand Down (1 AP, Civil Unrest/Political Violence drift up, no dual mode)
  - Military Exercises (2 AP, +1d3 Backing, mutual exclusion with Deploy same tick)
- **Party Actions:**
  - Rally (2 AP, +0.3 Legitimacy ×5 ticks, -1 Polarization, +1 Backing)
  - Agitate (2 AP, -0.3 Legitimacy ×5 ticks, +1 Polarization, half Power for FOR_REGIME)
  - Party Congress (2 AP, forces Strongman to attend or refuse, 4-tick cooldown)
- **Oligarch Actions:**
  - Patronage (2 AP, -0.3 Cost of Living ×5 ticks, +0.1 Standard of Living ×5 ticks)
  - Capital Flight (2 AP, GDP drops, Corruption increases, half Power for FOR_REGIME)
  - Bribe (2/3/4/5 AP escalating, +2 Backing to target, visible only to recipient)

---

## Phase 6: Faction Actions (Security Services, State Media) & Strongman Exclusives

**Goal:** All 20+ actions implemented. Full action system complete.

- **Security Services Actions:**
  - Surveillance (2 AP, reveals target's Backing/AP/last action, tracks surveilled targets in JSON)
  - Blackmail (1/2/3 AP escalating, target loses 1d3 Backing OR 2 AP, requires 2× Surveillance, respects immunity)
  - Disappear (3 AP, target -1 Backing, special rules vs Strongman: -2 foundation Backing, -1 Legitimacy)
- **State Media Actions:**
  - Broadcast (2 AP, +0.3 Legitimacy ×5 ticks, -1 Polarization, -0.1 Press Freedom, +1 Backing)
  - Smear (2 AP, target -2 Backing, +1 Polarization, -0.1 Press Freedom, can target Strongman)
  - Blackout (1 AP, freezes Legitimacy + Polarization for 1 tick, 5-tick cooldown)
- **Strongman Exclusive Actions:**
  - Arrest Leader (2 AP, 1d20 + modifiers vs target Backing, success/tie/fail outcomes, -3 Legitimacy, +3 Polarization)
  - Execute Leader (post-arrest only, 1d10 roll for tracker effects, -5 Legitimacy, +5 Polarization, +5 Strongman Backing)
  - Release Leader (post-arrest only, +1d6 Regime tracker, +3 Legitimacy, -2 Polarization, target Backing halved)
  - Favor (2 AP, +4/-4 Backing to two factions, visible to all, 3-tick cooldown)

---

## Phase 7: Coup Mechanics (Standard + Putsch)

**Goal:** Standard coups and Military Putsch fully functional.

- Implement standard coup formula:
  - roll = 1d100 + (tracker - 50)
  - Outcomes: catastrophic (<0), failure (0–39), pyrrhic (40–69), clean (70–99), dominant (100+)
  - Stat consequences per outcome (Stability, Civil Unrest, Legitimacy, Polarization)
  - Tracker resets (failure → 10, success → 30)
  - Catastrophic: leader executed, pillar → Wildcard, Backing -5
  - Failure: leader arrested, Backing -5
  - Pyrrhic: 3-tick window for other factions to attempt at +20 bonus
  - Clean: Legitimacy → 35
  - Dominant: Legitimacy → 50
- Log all attempts to `coup_attempt_log`
- Implement Vulnerability Window: Strongman foundation Backing = 0 → 3-tick window, any faction +20 to roll, resets to 5 if survived
- **Putsch (Military special):**
  - Stage 1: Military declares martial law, all notified
  - Strongman gets 1 tick to respond: Emergency Decree (3 AP, +1d6×3 tracker) / Appeal to Security Services (0 AP, SS chooses secretly) / Do Nothing
  - Resolution via standard formula after response window

---

## Phase 8: Silent Coup & Succession

**Goal:** Security Services Silent Coup (both paths) and Strongman succession system.

- **Silent Coup Path A (tracker 25–39):**
  - Requirement: Surveillance used on every faction at least once
  - Deal Phase: SS sends private offers (Minister position / +3 Backing / Blackmail Immunity 10 ticks)
  - Store offers in `silent_coup_offers` table
  - Vote Phase (next tick): hidden banner, each faction chooses Support Strongman or Silent Coup
  - Store votes in `silent_coup_votes` table
  - Majority Silent Coup → auto-success, no roll
  - Tied/majority Strongman → fail, SS Backing → 0, leader eligible for Arrest
  - Cancellation: if tracker drops below 25 between deal and vote, cancel everything
- **Silent Coup Path B (tracker ≥ 40):**
  - No deal/vote phase, standard coup formula, Surveillance requirement still applies
- **Post-success auto-appointment:** minister offers honored, 10-tick lock on reassignment
- **Succession:**
  - Appoint Successor / Revoke Successor actions
  - Leader aging: +1 year per 12 ticks
  - Death with successor → successor takes power
  - Death without successor → highest Backing faction auto-coup at +20, fail → Democratic Revolution check

---

## Phase 9: Democratic Revolution & Leader Lifecycle

**Goal:** Democratic Revolution system and full leader aging/death cycle.

- **Democratic Revolution:**
  - Trigger: Stability < 20 AND Civil Unrest > 50, no active revolution
  - Warning phase: random 13–22 ticks duration, logged REVOLUTION_WARNING
  - Escalation each tick: stability -1, civil_unrest +1, international_reputation -1
  - Avertable: either condition breaks → crisis cancelled (REVOLUTION_AVERTED)
  - Revolution fires: government type → Parliamentary/Presidential (50/50), stats reset, ruling_faction_id nulled, all crises cleared, bloc approvals reset, emergency election in 3 ticks
  - Event logging: WARNING / ESCALATION / AVERTED / DEMOCRATIC_REVOLUTION
- **Leader Lifecycle:**
  - Aging: every 12 ticks, leader_age += 1
  - Death check: leader_age >= death_age → pillar becomes Wildcard, escalation resets
  - New leader generation when faction claims Wildcard pillar
- Wire Democratic Revolution check into tick processor (step 5)
- Wire leader aging into tick processor (step 4)
- Wire Vulnerability Window check into tick processor (step 6)

---

## Phase 10: UI & Guide

**Goal:** Full autocracy UI on politics.js / government.html / nation.html. Guide updated.

- **Politics page (politics.js):**
  - Five Pillars display with Backing bars (0–20 scale)
  - Wildcard pillar indicator
  - Faction cards: pillar, Backing, leader name/age, minister count, PM badge
  - Action panel per faction: show available actions based on pillar, dual-mode toggle (FOR REGIME / FOR YOURSELF), AP cost display, cooldown timers, escalation level indicators
  - Strongman-only: tracker word display (IRON/FIRM/RESTLESS/VOLATILE/CRITICAL)
  - Strongman action filter: only foundation pillar + exclusive actions visible
  - Stand Down: no mode toggle
  - Surveillance results display (Backing/AP/last action of target)
  - Bribe: visible only to recipient
  - Party Congress: Strongman attend/refuse prompt
- **Government page:**
  - Silent Coup deal phase: offer selection UI for Security Services
  - Silent Coup vote phase: hidden banner for non-Strongman factions
  - Putsch: martial law banner, Strongman response options
  - Pyrrhic success window: coup attempt option for other factions
  - Arrested leader panel: Execute/Release options for Strongman
  - Successor appointment panel
- **Nation page / Dashboard:**
  - Revolution banner when active
  - "Chance of Democratic Revolution" proximity indicator on dashboard
  - Revolution countdown during escalation
- **Guide (guide.js):**
  - Full autocracy section: Five Pillars, Backing, actions by pillar, dual modes, coup types, Strongman exclusives, succession, Democratic Revolution
- **Style:** Consistent with dashboard.html and politics.html CSS patterns

---

## Phase Dependencies

```
Phase 1 (Schema)
  └─→ Phase 2 (Pillars & Backing)
       └─→ Phase 3 (Power & Tracker)
            └─→ Phase 4 (AP & Action Framework)
                 ├─→ Phase 5 (Military/Party/Oligarch Actions)
                 └─→ Phase 6 (SecSvc/Media/Strongman Actions)
                      ├─→ Phase 7 (Standard Coup + Putsch)
                      └─→ Phase 8 (Silent Coup + Succession)
                           └─→ Phase 9 (Democratic Revolution + Leader Lifecycle)
                                └─→ Phase 10 (UI & Guide)
```

Phases 5 & 6 can run in parallel. Phases 7 & 8 can run in parallel.
All other phases are sequential.
