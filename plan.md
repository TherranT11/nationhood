# Plan: Make Resource Supply Contracts (RSC) Mechanically Functional

## Current State
- RSC negotiation UI works: players can draft supply_commitment, price_terms, duration, breach_penalty articles
- `trade_agreements` table stores all this structured data correctly
- `processExpiredTradeAgreements()` already handles duration/expiry (sets status='expired')
- Withdrawal UI exists (`withdrawTradeAgreement()`)

## What's Broken
1. `processTradeFlows()` only queries `diplomatic_proposals` for a boolean `has_trade_agreement` flag — never reads `trade_agreements` table
2. RSC supply commitments (sector, commitment_pct, direction) are stored but never enforced
3. Price terms (discounted/premium) are stored but never applied to trade value
4. Breach penalties on withdrawal use a generic formula instead of the negotiated breach_penalty article

## Implementation

### Step 1: Make processTradeFlows read and enforce active RSCs
**Files:** `js/game/trade-constants.js`, `supabase/functions/advance-tick/index.ts`

In `processTradeFlows()`, after computing nationFlows and before the distribution loop:

1. Query `trade_agreements` where `status = 'active'` and `agreement_type = 'resource_supply'`
2. Parse each RSC's articles to extract `supply_commitment` (sector, direction, commitment_pct) and `price_terms`
3. **Pre-allocate guaranteed volumes before normal distribution:**
   - Identify buyer and seller from `supply_commitment.direction` + nation_a_id/nation_b_id
   - Calculate guaranteed volume: `seller's export capacity in that sector × (commitment_pct / 100)`
   - Cap at buyer's remaining import demand in that sector
   - Record the pre-allocation in `actualExports`/`actualImports` and `partnerRows`
   - This reduces the seller's remaining capacity and buyer's remaining demand for the normal distribution pass
4. Keep the existing `has_trade_agreement` affinity bonus (+20) — RSCs still count as trade agreements

### Step 2: Apply price terms to RSC trade volumes
**Files:** same as Step 1

For RSC pre-allocated volumes, adjust the trade value based on `price_terms`:
- `market`: use the normal sector price modifier (no change)
- `discounted`: multiply value by `(1 - modifier_pct/100)` — seller gets less revenue
- `premium`: multiply value by `(1 + modifier_pct/100)` — seller gets more revenue
- `fixed`: use price modifier of 1.0 (neutral, ignores supply/demand swings)

This affects the `trade_volume` recorded in `trade_partners` for RSC flows.

### Step 3: Enforce negotiated breach penalties on withdrawal
**File:** `diplomacy.html` — `withdrawTradeAgreement()` function

Currently the withdrawal uses a generic formula: `relPenalty = noticeTicks <= 1 ? 5 : noticeTicks <= 3 ? 3 : 1`

Change to:
1. Check if the agreement has a `breach_penalty` article in its `articles` JSONB
2. If present, apply the negotiated penalties:
   - `relations_penalty`: reduce bilateral relation_score by this amount
   - `financial_penalty`: deduct from withdrawing nation's treasury (in millions)
3. If no breach_penalty article exists, fall back to the current generic formula
4. Show the actual penalties in the confirmation dialog

### Step 4: Sync edge function
**File:** `supabase/functions/advance-tick/index.ts`

Mirror all changes from Steps 1-2 in the edge function's copy of `processTradeFlows()`.

## What Already Works (No Changes Needed)
- Duration/expiration: `processExpiredTradeAgreements()` already expires agreements when `expires_at_tick <= currentTick`
- Auto-renewal: could be added later but not required for core functionality
- The `trade_agreements` insert on ratification (both bills pass → row created with correct articles, duration, expiry)
- The `has_trade_agreement` boolean flag from `diplomatic_proposals` — existing FTAs/PTAs continue to get the +20 affinity bonus
