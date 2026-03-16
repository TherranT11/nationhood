# Caucus System — Implementation Plan

## Summary
When a party holds >= 50% of seats, internal ideological factions (caucuses) activate. These caucuses can defect on bills that touch their dominant ideology axis, creating internal pressure on dominant majorities.

---

## Phase 1: Database Schema

### New migration: `sql/migrations/20260316_caucus_system.sql`

**Table: `caucus_factions`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| party_id | FK → factions | The parent party |
| nation_id | FK → nations | Denormalized for queries |
| name | TEXT | e.g. "Civil Libertarians" |
| dominant_axis | TEXT | e.g. 'liberty_equality' |
| wing_end | TEXT | 'left' or 'right' |
| seat_share | NUMERIC | Fraction of party seats (0.0–1.0) |
| relationship_score | INT | 0–100, default 65 |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | |

**Table: `caucus_dispositions`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| caucus_faction_id | FK → caucus_factions | |
| bill_id | FK → bills | |
| disposition | TEXT | 'aligned', 'nervous', 'opposed', 'not_triggered' |
| votes_affected | INT | Seats withheld/at-risk |
| whipped | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | |
| UNIQUE(caucus_faction_id, bill_id) | | |

Also add to seed-work reset list: `caucus_factions`, `caucus_dispositions`.

---

## Phase 2: Core Game Logic

### New file: `js/game/caucus.js`

**Constants (add to config.js):**
```
CAUCUS_THRESHOLD: 0.50
CAUCUS_TIERS: [{min:0.50,max:0.59,factions:2},{min:0.60,max:0.69,factions:3},{min:0.70,max:0.79,factions:4},{min:0.80,max:1.0,factions:5}]
CAUCUS_DEFAULT_RELATIONSHIP: 65
CAUCUS_WHIP_AP_COST: 1
CAUCUS_THRESHOLD_ALIGNED: 0    // bill_score >= 0 on their axis
CAUCUS_THRESHOLD_NERVOUS: -15  // bill_score >= -15 on their axis
CAUCUS_THRESHOLD_RANGE: 20     // how much relationship shifts thresholds
CAUCUS_REL_BILL_ALIGNED: 7    // +rel when aligned bill passes
CAUCUS_REL_BILL_OPPOSED_PASS: -20  // -rel when opposed bill passes anyway
CAUCUS_REL_WHIP: 3            // +rel from whip action
CAUCUS_REL_PLEDGE_HONOURED: 8
CAUCUS_REL_PLEDGE_BETRAYED: -25
CAUCUS_REL_DECAY: -2          // per term if no positive bills
CAUCUS_NON_GOVERNING_MODIFIER: 0.85  // 15% lower threshold for non-governing
```

**Key functions:**

### `evaluateCaucusActivation(supabase, nationId, totalSeats)`
- Query all parties with `faction_type='party'` for this nation
- For each: `seatShare = party.seats / totalSeats`
- If >= 0.50 and no active caucus_factions → run `assignCaucusFactions()`
- If < 0.50 and has active caucus_factions → deactivate all (`is_active = false`)
- If crossing a tier boundary upward → add new factions (preserve existing)

### `assignCaucusFactions(supabase, party, nationId, factionCount)`
1. Load all voter blocs for nation from `voter_blocs`
2. Load `faction_bloc_approval` for this party to get bloc weights
3. For each ideology axis, calculate spread: find min/max `axis_*` values across blocs weighted by their approval of this party
4. Sort axes by spread descending, take top `ceil(factionCount / 2)` axes
5. For each axis, create 2 caucus_faction records (one per wing)
6. Set `seat_share` proportional to bloc weight at each end
7. Set `relationship_score = 65`, `is_active = true`

**Wing name mapping** (constant):
```js
CAUCUS_WING_NAMES = {
  liberty_equality:          { left: 'Civil Libertarians',      right: 'Egalitarians' },
  tradition_progress:        { left: 'Traditionalist Caucus',   right: 'Reform Caucus' },
  security_freedom:          { left: 'Security Hawks',          right: 'Civil Liberties Caucus' },
  globalism_nationalism:     { left: 'Internationalists',       right: 'National Interest Caucus' },
  individualism_collectivism:{ left: 'Free Market Caucus',      right: 'Collectivist Caucus' }
}
```

### `calculateCaucusDispositions(supabase, billId, nationId)`
Called when a bill moves to floor or when vote tallies are recalculated.

1. Load bill with `bill_articles(*, policies(*))`
2. Extract ideology tags from articles → compute net axis scores (reuse `IDEOLOGY_TO_AXIS` mapping from ideology.js)
3. Determine primary axis (highest absolute net score) and secondary axes
4. Load all active `caucus_factions` for parties in this nation
5. For each caucus faction:
   - If bill has no score on `dominant_axis` → `NOT_TRIGGERED`
   - Get bill's score on that axis. Positive = moves toward faction's wing end, negative = moves away
   - Apply relationship modifier: `threshold_modifier = (rel_score - 50) / 100 * THRESHOLD_RANGE`
   - If non-governing party: multiply thresholds by `NON_GOVERNING_MODIFIER`
   - If secondary axis only: cap at NERVOUS (never OPPOSED)
   - Compare score to effective thresholds → ALIGNED / NERVOUS / OPPOSED
   - Calculate `votes_affected = Math.round(party.seats * caucus.seat_share)`
6. Upsert into `caucus_dispositions`

### `applyCaucusToVoteTally(supabase, billId)`
Called after `syncVoteTallies` to adjust effective vote counts.

1. Load all OPPOSED caucus dispositions for this bill (where `whipped = false`)
2. For each, subtract `votes_affected` from the party's YES vote count
3. For NERVOUS factions (not whipped), show as "soft" votes in UI but don't subtract
4. Return adjustment summary for UI display

### `executeWhipCaucus(supabase, factionId, caucusFactionId, billId)`
Political action: spend AP to whip a NERVOUS faction.

1. Verify caucus faction belongs to this party
2. Verify disposition is NERVOUS (not OPPOSED or ALIGNED)
3. Verify not already whipped on this bill
4. Deduct AP (1-2 based on faction size)
5. Set `whipped = true` on disposition, change disposition to ALIGNED
6. Add +3 to relationship_score
7. Log to event_log

### `updateCaucusRelationships(supabase, billId, outcome)`
Called after bill resolution in `resolveExpiredVotes`.

1. Load all caucus dispositions for this bill
2. For each faction:
   - If bill passed and faction was ALIGNED/whipped: +5 to +10 rel
   - If bill passed and faction was OPPOSED: -20 rel
   - If bill failed: no change
3. Clamp relationship_score to 0–100
4. Update caucus_factions

### `decayCaucusRelationships(supabase, nationId, currentTick)`
Called per tick (or per term boundary).

- For each active caucus faction: if no positive bill in last 10 ticks, apply -2 decay

---

## Phase 3: Integration into Existing Systems

### 3a. Tick Processing (`handler-template.ts`)
Add after elections processing, before `checkEarlyMajority`:
```
// Caucus system: activate/deactivate factions based on seat share
await evaluateCaucusActivation(supabase, nation.id, GAME_CONFIG.TOTAL_SEATS);
```

### 3b. Bill Voting (`bills.js`)
In `syncVoteTallies` or immediately after it's called — also call `calculateCaucusDispositions` and `applyCaucusToVoteTally` to adjust the effective votes.

The key integration point: after `syncVoteTallies` writes `votes_for/against/abstain`, apply caucus deductions to create `effective_votes_for`. The `evaluateBillVote` and `resolveBillVote` functions should use these adjusted values.

Approach: Add `caucus_votes_withheld` column to `bills` table. After sync, subtract withheld from `votes_for` for resolution purposes.

### 3c. Bill Resolution (`resolveExpiredVotes`)
After bill outcome is determined, call `updateCaucusRelationships(supabase, billId, outcome)`.

### 3d. Political Actions (`political-actions.js`)
Add `executeWhipCaucus` as a new action available when viewing a bill with NERVOUS factions.

### 3e. Pledge Integration
When checking pledge fulfillment/betrayal, also update caucus relationships via `CAUCUS_REL_PLEDGE_HONOURED` / `CAUCUS_REL_PLEDGE_BETRAYED`.

---

## Phase 4: UI

### 4a. Bill View (`laws.html`) — Faction Disposition Panel
When a bill is on the floor and the sponsoring party has active caucuses:
- Show a "Caucus Disposition" panel below the vote tally
- Each caucus faction listed with disposition icon and vote count
- NERVOUS factions get a "Whip" button (costs AP)
- OPPOSED factions shown in red, no whip option

### 4b. Parliament Seat Visualization
When a bill is active, split the party's seat bar into sub-segments:
- Confirmed (green) / Nervous (amber) / Withheld (red)
- Only visible during active floor votes

### 4c. Party Detail Screen — Factions Tab
On the party page, add a "Caucuses" tab showing:
- Each active caucus name, dominant axis, ~seat count
- Relationship score bar (visual, not numeric)
- Last 3 triggered bills and dispositions
- Warning if relationship < 30

---

## Phase 5: Seed Data
Update `seed-work.js` to optionally create caucus factions for any party that starts with >= 50% seats (e.g., Avelia's New Dawn Party with 50 seats in a 120-seat parliament → 41.6%, so no caucuses by default — could adjust seed data for testing).

---

## Implementation Order
1. SQL migration (tables)
2. `js/game/caucus.js` (core logic)
3. `config.js` constants
4. `handler-template.ts` tick integration
5. `bills.js` vote adjustment integration
6. `political-actions.js` whip action
7. `laws.html` UI — disposition panel + whip button
8. Party page UI — caucuses tab
9. Parliament seat visualization
10. Seed data + testing
