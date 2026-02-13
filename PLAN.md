# Plan: Fix Stuck Tick Processing

## Root Cause Analysis

There are **two competing tick systems** that are fundamentally broken:

### System A — `map.html` auto-tick (lines 320-392)
When the countdown reaches zero, `map.html` calls `processTick()` automatically. But this function is **incomplete** — it only:
- Bumps `next_tick_at` to 8 hours in the future (hardcoded, ignores `tick_interval_hours`)
- Increments `current_tick` by 1
- Advances `current_date` by one month
- Reloads the page

**It does NOT call `advanceTick()` from `game-common.js`**, so none of the actual game effects are processed — no elections, no bill resolutions, no stat effects, no costs, no crises, nothing.

### System B — `admin.html` manual tick (lines 610-627)
Admin clicks button → calls `advanceTick()` from `game-common.js` → processes ALL game effects (elections, laws, costs, PM traits, bills, ideology, crises, etc.)

**This is the only way full effects processing actually runs.**

### System C — All other pages (`common.js` lines 325-406)
When countdown reaches zero, shows "Processing…" and polls every 5 seconds for a new `next_tick_at`. **Does NOT trigger the tick at all.** After 60 attempts (~5 minutes), gives up and shows "Refresh page".

### Why the tick is stuck
If no one has `map.html` open AND admin hasn't manually clicked the button in `admin.html`, the tick simply never advances. The countdown expires and every page just shows "Processing…" forever.

Even if `map.html` IS open, it only bumps numbers — no game effects fire.

### Additional problems
- **Race condition**: `map.html` and `admin.html` can both fire, double-incrementing the tick
- **No locking**: No mechanism prevents concurrent tick processing
- **Hardcoded interval**: `map.html` hardcodes 8 hours instead of reading `tick_interval_hours`

---

## Fix Plan

### Step 1: Consolidate tick triggering into `common.js`
Move the auto-tick trigger from `map.html`'s `processTick()` into `common.js` so that **any open page** can trigger the full `advanceTick()` when the countdown expires.

In `common.js`, change `pollForNewTick()` to instead call a new function `triggerTickIfDue()` that:
1. Checks if `next_tick_at` has passed
2. Attempts to acquire a lightweight DB lock (see Step 2)
3. If lock acquired, calls the full `advanceTick(supabase)` from `game-common.js`
4. If lock not acquired (another tab is processing), falls back to polling behavior

### Step 2: Add database-level tick lock
Add a `tick_processing` boolean column to the `shard` table to prevent concurrent processing.

The lock flow:
1. Attempt: `UPDATE shard SET tick_processing = true WHERE name = 'Alpha Shard' AND tick_processing = false`
2. If the update affects 0 rows → another client is already processing, fall back to polling
3. After `advanceTick()` completes (or errors), release: `UPDATE shard SET tick_processing = false`
4. Safety valve: if `tick_processing` has been `true` for more than 5 minutes, allow override (stale lock from crashed tab)

### Step 3: Remove `map.html`'s duplicate `processTick()`
Remove the incomplete `processTick()` from `map.html`. Instead, have `map.html` use the same `common.js` countdown and auto-trigger system, which now calls the full `advanceTick()`.

Make `map.html` include `game-common.js` (if it doesn't already) so `advanceTick()` is available.

### Step 4: Add error handling and timeout protection
Wrap the `advanceTick()` call in the auto-trigger with:
- A timeout (e.g., 2 minutes) — if processing takes longer, release the lock and log an error
- Try/catch so a failed tick doesn't leave the lock stuck
- Console logging for debugging

### Step 5: Ensure `advanceTick()` advances the game date
Currently `advanceTick()` in `game-common.js` increments `current_tick` and sets `next_tick_at` but does **not** advance `current_date`. The `map.html` `processTick()` was the only place that called `advanceMonth()`. Add `current_date` advancement to the canonical `advanceTick()` function.

---

## Files to modify:
1. **`js/common.js`** — Replace passive polling with active tick triggering + lock logic
2. **`js/game-common.js`** — Add `current_date` advancement to `advanceTick()`, add lock acquire/release helpers
3. **`map.html`** — Remove duplicate `processTick()`, use shared system from common.js
4. **`admin.html`** — Update `advanceTickAdmin()` to use the same lock mechanism (optional but recommended)
