-- ════════════════════════════════════════════════════════════════════
-- Retire legacy faction-owned airlines (Vindstyrke et al).
--
-- The airline system has two parallel ownership models:
--   • LEGACY: airline_routes.airline_faction_id → factions(id) where
--     faction_type='corporation' AND corp_sector='Airline'.
--     Same shape for corp_aircraft.corp_id and airline_terminals.owner_airline_id.
--   • ENTREPRENEUR (current): airline_routes.airline_corp_id → entrepreneur_corps(id),
--     corp_aircraft.entrepreneur_corp_id, airline_terminals.owner_corp_id.
--
-- The legacy tick (process_aviation_routes etc) was dropped in
-- 20270243_corp_cull_p4c_drop_legacy_airline_fns.sql. The current
-- process_entrepreneur_airline_routes (20270347_airline_proportional_split)
-- only processes rows where airline_corp_id IS NOT NULL. Result: legacy
-- routes were left orphaned — their last_tick_pax frozen at whatever the
-- legacy tick wrote before it was dropped (Vindstyrke shows 281 every
-- tick on Oros ↔ Buenavera and never moves).
--
-- The lane-display in entrepreneur-corp.html sums last_tick_pax across
-- ALL active routes on the city pair (entrepreneur and legacy alike), so
-- those frozen 281s pollute every entrepreneur carrier's lane breakdown.
--
-- Fix: retire all legacy airline data. Routes, aircraft and terminal
-- claims are hard-deleted (no live process touches them anyway, and
-- they're causing observable drift). Legacy airline corporation
-- factions themselves are soft-deleted (abandoned_at = NOW()) so we
-- don't break FKs from tables that 20270251 deliberately KEPT
-- (corp_cash_events, corp_contract_events, etc).
--
-- Legacy ownership COLUMNS are deliberately NOT dropped here. ~10
-- still-live function bodies (entrepreneur_buy_aircraft,
-- entrepreneur_claim_terminal, the homeland-founding seeds, etc) gate
-- on AND owner_airline_id IS NULL — column-drop requires a per-function
-- rewrite pass that's out of scope for "kill the 281 bug". Post-this
-- migration those columns are NULL everywhere; the gates stay TRUE;
-- nothing reads them productively. They become Phase 5D cleanup.
--
-- Idempotent: re-running on a clean DB is a no-op (WHERE clauses match
-- nothing the second time).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Hard-delete legacy airline_routes ────────────────────────────
-- Vindstyrke's frozen 281, and anything similar. The CASCADE on
-- airline_corp_id (entrepreneur_corps FK) is irrelevant — these rows
-- are the airline_faction_id-owned legacy set.
DELETE FROM airline_routes
 WHERE airline_faction_id IS NOT NULL;

-- ── 2. Hard-delete legacy corp_aircraft ─────────────────────────────
-- The 20270203 CHECK constraint guarantees (corp_id IS NULL) XOR
-- (entrepreneur_corp_id IS NULL), so "entrepreneur_corp_id IS NULL"
-- precisely identifies the legacy rows. Deleting fires
-- sync_corp_fleet_slots which zeroes factions.corp_fleet for the
-- abandoned corporation — fine, that hero stat is moot.
DELETE FROM corp_aircraft
 WHERE entrepreneur_corp_id IS NULL;

-- ── 3. Release legacy airline_terminals ─────────────────────────────
-- Don't delete the slot rows (terminal_number / city_id are still
-- meaningful as the city's inventory of slot positions). Just unclaim
-- them — owner_airline_id = NULL, owner_corp_id stays NULL = unclaimed.
UPDATE airline_terminals
   SET owner_airline_id = NULL,
       acquired_at_tick = NULL
 WHERE owner_corp_id IS NULL
   AND owner_airline_id IS NOT NULL;

-- ── 4. Soft-delete legacy airline corporation factions ──────────────
-- abandoned_at is the standard "tombstoned faction" pattern used
-- elsewhere (active queries already filter abandoned_at IS NULL).
-- linked_user_id cleared so any owning user no longer shows it on
-- their roster. FKs from corp_cash_events / corp_contract_events stay
-- valid (the 20270251 KEPT-list).
UPDATE factions
   SET abandoned_at    = COALESCE(abandoned_at, NOW()),
       linked_user_id  = NULL
 WHERE faction_type = 'corporation'
   AND corp_sector  = 'Airline'
   AND abandoned_at IS NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
