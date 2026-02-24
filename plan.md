# Automatic Inactivity Decay System — Implementation Plan

## Overview

Factions that don't spend AP for extended periods will suffer automatic penalties during tick processing: approval rating decay, seat erosion, and eventually auto-disbanding. This incentivizes active play and naturally clears out abandoned factions.

---

## Existing Infrastructure

Already in place:
- **`factions.last_ap_spent_tick`** column — tracks when a faction last spent AP
- **`markFactionActive(supabase, factionId, currentTick)`** in `game-common.js:11643` — updates the column
- **`markFactionActive` is only called from `government.html`** (purge, fire minister, no-confidence, early elections)
- **NOT called from**: campaign actions (rally, press conf, outreach, fundraiser), bill drafting, bill voting, diplomacy

---

## Step 1: Expand `markFactionActive` Coverage

**Goal**: Every AP-spending action should update `last_ap_spent_tick`.

### 1a. Integrate into `deductAP()` itself (game-common.js:869)
Instead of sprinkling `markFactionActive` calls everywhere, call it automatically inside `deductAP()` after a successful deduction. This catches ALL current and future AP-costing actions in one place.

**File**: `js/game-common.js` — `deductAP()` function (~line 869)
**Change**: After a successful `deduct_ap` RPC (data !== -1), call `markFactionActive(supabase, factionId)`.

This makes the existing 4 manual calls in `government.html` redundant but harmless (they'll just re-set the same tick).

### 1b. Initialize `last_ap_spent_tick` for existing factions
**File**: `sql/add_inactivity_decay.sql` (new migration)
**Change**: For any faction where `last_ap_spent_tick IS NULL AND nation_id IS NOT NULL`, backfill it to the current shard tick so existing active players aren't immediately penalized.

---

## Step 2: Add Inactivity Decay Config

**File**: `js/game-common.js` — add to `GAME_CONFIG` (~line 20)

```javascript
// Inactivity decay
INACTIVITY_GRACE_TICKS: 12,        // No penalty for first 12 ticks of inactivity
INACTIVITY_APPROVAL_DECAY: 3,      // -3 approval per tick while inactive
INACTIVITY_SEAT_LOSS_THRESHOLD: 24, // After 24 ticks inactive, start losing seats
INACTIVITY_SEAT_LOSS_PER_TICK: 1,  // -1 seat per tick once past threshold
INACTIVITY_DISBAND_THRESHOLD: 48,  // After 48 ticks inactive, auto-disband
```

---

## Step 3: Implement `processInactivityDecay()`

**File**: `js/game-common.js` — new exported function (after the `markFactionActive` function ~line 11653)

```
processInactivityDecay(supabase, nationId, currentTick)
```

**Logic**:
1. Query all non-NPC party factions in the nation that have `nation_id` set
2. For each faction, compute `ticksInactive = currentTick - (faction.last_ap_spent_tick || faction.founded_tick || 0)`
3. Skip if `ticksInactive <= INACTIVITY_GRACE_TICKS`
4. **Approval decay**: Reduce `approval_rating` by `INACTIVITY_APPROVAL_DECAY` per tick (floor at 0)
5. **Seat loss** (if `ticksInactive > INACTIVITY_SEAT_LOSS_THRESHOLD`): Reduce `seats` by `INACTIVITY_SEAT_LOSS_PER_TICK` (floor at 0)
6. **Auto-disband** (if `ticksInactive > INACTIVITY_DISBAND_THRESHOLD`): Remove from nation (`nation_id = null`, `abandoned_at = now()`, set `disband_cooldown_until_tick`). Log to `campaign_actions` with `action_type: 'auto_disbanded_inactivity'`
7. Return array of `{ factionId, factionName, ticksInactive, approvalLost, seatsLost, disbanded }` for summary logging

---

## Step 4: Wire Into Tick Processing

**File**: `supabase/functions/advance-tick/handler-template.ts` — inside the per-nation loop (~line 632, after ambassador retirements, before final snapshot)

```javascript
// Inactivity decay (approval + seat erosion for idle factions)
const inactivityResults = await processInactivityDecay(supabase, nation.id, newTick);
if (inactivityResults.length > 0) {
    summary.inactivityDecay = summary.inactivityDecay || [];
    summary.inactivityDecay.push({ nation: nation.name, factions: inactivityResults });
}
```

Then run `node scripts/sync-edge-function.js` to regenerate `index.ts`.

---

## Step 5: Admin Dashboard — Show Inactivity Status

**File**: `admin.html`

### 5a. Fetch `last_ap_spent_tick` in player query (~line 1071)
Add `last_ap_spent_tick` to the select fields.

### 5b. Show inactivity indicator in player cards (~line 1091)
- Fetch `current_tick` from shard once at load time
- For each player card, compute ticks inactive and show a color-coded badge:
  - Green: active (within grace period)
  - Yellow: "Inactive X ticks" (past grace, before seat loss)
  - Orange: "Losing seats — X ticks idle" (past seat loss threshold)
  - Red: "Will auto-disband in X ticks" (approaching disband threshold)

### 5c. Add "Inactive" filter button alongside existing All / In Nation / No Nation filters (~line 160)
Filters to factions past the grace period.

### 5d. Show inactivity decay results in tick summary (~line 629)
Display count of factions penalized and any auto-disbands in the tick processing summary.

---

## Step 6: Regenerate Edge Function

```bash
node scripts/sync-edge-function.js
```

---

## Files Modified

| File | Changes |
|------|---------|
| `js/game-common.js` | Add config constants, `processInactivityDecay()`, update `deductAP()` to call `markFactionActive` |
| `supabase/functions/advance-tick/handler-template.ts` | Wire `processInactivityDecay` into per-nation tick loop |
| `admin.html` | Fetch + display inactivity status, add filter, show in tick summary |
| `sql/add_inactivity_decay.sql` | Backfill migration for `last_ap_spent_tick` |
| `supabase/functions/advance-tick/index.ts` | Auto-regenerated by sync script |

## Files NOT Modified (no new file creation beyond the SQL migration)

No new HTML pages, no new JS modules — everything fits into existing structure.
