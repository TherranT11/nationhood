# Design Doc Critique: Presidential Endorsement Specification

## Context
This is a critical review of the Presidential Endorsement design specification against the actual Nationhood codebase. The goal is to identify incorrect assumptions, over-engineering, simplification opportunities, and potential bugs before implementation begins.

---

## CRITICAL ISSUES (Must Fix Before Implementation)

### 1. "Party Compatibility Score" Does Not Exist
The doc repeatedly says to "read from the party relationship table" — **this table does not exist**. The codebase has:
- `computeIdeologyAlignment(factionIdeology, bloc)` in `ideology.js` — faction-to-**voter-bloc**, NOT faction-to-faction
- `faction_ideology` table with 5 axes (-100 to +100 each)
- No pre-computed party-to-party scores anywhere

**Fix required:** You need a new `computePartyCompatibility(partyAIdeology, partyBIdeology)` function. This is straightforward — adapt the existing `computeIdeologyAlignment` to compare two faction ideology rows instead of faction-vs-bloc. The 0-100 output range can stay the same.

### 2. Vote Transfer Cannot Be "Injected" Into the Current Runoff
The doc assumes you can add transferred votes to a candidate's total during the runoff. But the actual runoff implementation (`elections.js:1641-1696`):
- **Deletes** non-runoff candidates from `pm_candidates`
- **Re-runs** the `run_presidential_election` RPC with only 2 candidates
- Voter blocs **re-vote from scratch** via the Weighted Competition Model

You cannot just add votes on top of the RPC output. The endorsement vote transfer needs to happen **after** the runoff RPC returns results, as a post-processing step that modifies the final vote tallies before determining the winner. This is a fundamental architectural issue the doc doesn't address.

**Fix required:** The transfer must be a post-RPC adjustment: take the runoff results, add transferred votes, recalculate percentages, then determine winner. This changes the implementation significantly from what the doc implies.

### 3. "Three-Candidate Runoff" Referenced — Doesn't Exist
Section 4.4 says: "In a three-candidate runoff, calculate compatibility against all non-endorsed runoff candidates." The codebase only supports **top-2 runoffs** (`elections.js:1648`: `sortedRound1.slice(0, 2)`). Remove all three-candidate runoff references from the doc.

### 4. No "Party Relationship Panel" Exists
The doc references displaying Coalition Debt on "both parties' relationship panels" and expired debts in "relationship history." There is no party relationship panel or history in the UI. The doc is designing against a UI surface that would need to be built from scratch.

### 5. UUIDs — Minor Terminology Issue
The doc specifies `UUID` types for record fields. The codebase uses Supabase auto-generated UUIDs via `gen_random_uuid()` — you don't manually specify UUID fields. Just use standard Supabase `id` columns. Not a blocker, but the doc's explicit UUID typing is misleading about how IDs work here.

---

## OVER-ENGINEERING (Simplify or Defer)

### 6. The 4-State Endorsement Status Enum Is Unnecessary
`PENDING → ACTIVE → RESOLVED` plus `VOID` is 4 states. In practice:
- **PENDING** and **ACTIVE** only differ by whether round 1 has fired. The code that runs after round 1 will process all endorsements in one pass — it doesn't need to distinguish between these two beforehand.
- **Suggestion:** Use 2 states: `active` and `resolved`. Set `resolved` with a `result` field: `'transferred'`, `'voided'`, `'winner_no_runoff'`. Simpler, same expressiveness.

### 7. Coalition Debt Is an Entire Sub-System — Defer to v2
Coalition Debt (Sections 6.3, 7.1–7.4) introduces:
- A new database table with its own lifecycle
- A fulfillment mechanic (ministry appointment OR bill whip)
- An 8-tick countdown with tick-based expiry processing
- A betrayal flag with **permanent** compatibility modifiers (requires a persistent party-to-party modifier system that also doesn't exist)
- UI on "both parties' relationship panels" (which don't exist)
- Creditor bill designation UI

This is roughly **40% of the doc's complexity** for what is a consequence mechanic. The core endorsement feature (declaration, vote transfer, approval changes) works without it.

**Recommendation:** Ship endorsement v1 without Coalition Debt. Add a "Coalition Debt triggered" flag to the post-election summary for now. Implement the full debt system as a v2 follow-up once the endorsement core is proven.

### 8. Endorsement Record Has Too Many Fields
The doc specifies 8 fields per endorsement. Several are derivable or redundant:
- `declared_at_tick` — unnecessary if endorsements are always declared in the pre-election window (you know the election tick)
- `transfer_rate` — derivable from `compatibility_score` at resolution time; caching it separately is premature
- `votes_transferred` — computed during resolution, store it on the election results JSONB, not a separate record
- `status` — simplified per point 6 above

**Minimal record:** `endorsing_party_id`, `endorsed_party_id`, `election_id`, `compatibility_score` (cached at declaration). Everything else computed or stored in election results.

### 9. Betrayal Flag + Permanent -15 Compatibility Penalty
This requires building a persistent party-to-party modifier system that doesn't exist. The codebase has no concept of permanent relationship modifiers between parties. Building this infrastructure for one use case is over-engineering.

**Defer** along with Coalition Debt to v2.

---

## SIMPLIFICATION OPPORTUNITIES

### 10. Store Endorsement Data on the Election JSONB
Rather than creating a new `endorsements` table, store endorsement records inside `elections.results` JSONB (which already holds `round_1_candidates`, `runoff_candidates`, etc.). Add an `endorsements` array. This keeps all election data together and avoids a new table for a feature that's inherently tied to a single election.

### 11. Post-Election Summary — Build on Existing Results Display
`elections.html` already renders per-party votes, per-bloc breakdown, and turnout. The endorsement summary data can be embedded in the election results JSONB and rendered as an additional section in the existing results view — no separate summary screen needed.

### 12. Protest Vote Mechanic — Simplify the 70/30 Split
The 70% abstain / 30% protest split is fine mechanically, but the doc over-specifies the protest target logic for a scenario that can't happen (three-candidate runoff). In a two-candidate runoff, protest votes always go to the non-endorsed candidate. Remove the multi-candidate protest routing logic entirely.

### 13. Compatibility Score Calculation — Reuse Existing Infrastructure
Write one new function: `computePartyCompatibility(partyA, partyB)` that mirrors the structure of `computeIdeologyAlignment` but compares two `faction_ideology` rows. Both parties' axes are already -100 to +100 — compute distance across all 5 axes, normalize to 0-100. ~15 lines of code, lives in `ideology.js`.

### 14. Duplicate Ministry Display Names
The doc's Section 3 mentions ministry display names. `presidential.js:184-192` already has the full `ministryDisplayName` mapping. Don't duplicate it — export and reuse.

---

## POTENTIAL BUGS & DESIGN GAPS

### 15. Self-Endorsement Not Guarded
The doc says guard against endorsing your own party but doesn't make it an explicit availability condition. Add it: "Endorsing party cannot be the same as the endorsed party's faction."

### 16. Void + Approval Consequence Contradiction
Section 8 edge cases say: "No runoff triggered → Set status VOID. Still apply approval consequence based on whether endorsed candidate won round 1 outright."

But the approval rules in Section 6.1/6.2 are written assuming a runoff. If Party A endorses Party B, and Party C wins outright in round 1 (no runoff), should Party A get the "backed the loser" penalty? The doc says yes, but this is punishing the player for something that was structurally impossible to influence.

**Suggestion:** If VOID due to no runoff, apply **no approval consequence**. The endorsement never activated — don't punish or reward for it.

### 17. "Endorsed Party Drops Out" — What Does This Mean?
The doc references "endorsed party dropped out or was eliminated before the runoff." In this codebase, parties don't "drop out" of presidential elections. The only removal mechanism is `admin_kick_party()` which disbands the entire party. Clarify what scenario this is guarding against — it may be a phantom edge case.

### 18. Minimum 1 Vote Transfer — Edge Case
The doc says "Minimum 1 vote transfers if endorsement is ACTIVE and party had any round 1 votes." But what if the endorsing party had 0 votes in round 1? `floor(0 * rate) = 0`, and forcing 1 vote from nothing creates votes from thin air. Guard: if `round1_votes === 0`, void the endorsement.

### 19. Cancellation Window Ambiguity
"Allow cancellation only before round 1 fires." But when exactly does round 1 "fire"? The election processes in a single tick during `advanceTick()`. If the endorsement UI is on the politics page and the tick fires server-side, the player can't cancel mid-tick. Clarify: cancellation is allowed until the tick BEFORE `election_tick`. Once `current_tick >= election_tick`, endorsement is locked.

### 20. Multiple Endorsements FROM a Single Party
The doc covers multiple parties endorsing the same candidate, but doesn't address: can a single party endorse multiple candidates? Presumably no — one endorsement per party per election. State this explicitly.

### 21. Runoff Candidate Qualification Timing
The doc says void the endorsement if "the endorsing party itself qualified for the runoff." This check happens after round 1 resolves. But the endorsement was declared before round 1. If the endorsing party's candidate came in 1st or 2nd, their endorsement of someone else should indeed void — but this means a player can endorse a rival and still end up in the runoff themselves. The doc handles this correctly, but the UX should warn the player: "If your candidate qualifies for the runoff, this endorsement will be voided."

---

## MISSING FROM THE DOC

### 22. Where Does the [Endorse] Button Live?
The doc says "Election page" but there's already a disabled `Endorse Candidate` button in `politics.html:5626`. Clarify which page owns this UI.

### 23. NPC Party Behavior
Can NPC parties endorse? Do they auto-endorse based on ideology? The doc only describes player-initiated endorsement. If NPC parties can't endorse, it's a player-only advantage. If they can, you need auto-endorsement AI logic.

### 24. AP Cost
The doc doesn't mention AP cost for endorsing. Should it cost 1 AP like other political actions? Or is it free? Given the user's stated preference to remove AP costs from nominations, this should be explicitly stated.

---

## DECISIONS (Confirmed by User)

- **Coalition Debt:** Deferred to v2. Remove from v1 scope entirely.
- **Void endorsement consequences:** No approval penalty/reward when endorsement is voided (no runoff triggered). Clean void = no consequences.
- **NPC endorsement:** Player-only for now. NPCs cannot endorse. No AI endorsement logic needed.

---

## RECOMMENDED IMPLEMENTATION ORDER

1. **`computePartyCompatibility()` function** in ideology.js (~15 lines)
2. **Endorsement declaration** — store on election results JSONB, button in politics.html
3. **Vote transfer post-processing** — after runoff RPC, adjust totals
4. **Protest vote split** — simple 70/30 to non-endorsed candidate
5. **Approval/polarization consequences** — reuse existing `adjustGovernmentApprovalEvent` and momentum system (skip if voided)
6. **Post-election summary additions** — extend existing elections.html renderer
7. **Coalition Debt** — defer to v2
