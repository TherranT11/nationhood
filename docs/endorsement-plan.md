# Endorsement Summary Copy Update Plan

This plan defines the required copy and behavior updates for endorsement summaries.

## Required updates

1. Keep the **margin-vs-transfer decisive comparison** in endorsement summaries for teaching value.
2. Remove all **debt trigger** language and consequence framing from endorsement summaries.
3. Replace debt framing with neutral insights, for example:
   - "Your transfer exceeded final margin."
   - "Transfer size was larger than the final margin."
4. Ensure endorsement flows emit **no debt-related notifications**.

## Merge gate checklist for endorsement PRs

- [ ] Decisive margin-vs-transfer comparison remains present.
- [ ] Debt trigger language removed from all endorsement summary copy.
- [ ] Neutral insight copy is used in endorsement summaries.
- [ ] No debt-related notifications are emitted by endorsement flows.

## PR template snippet (copy into endorsement PR descriptions)

### Preconditions complete
- [ ] Decisive margin-vs-transfer comparison retained
- [ ] Debt trigger language removed
- [ ] Neutral insight copy added
- [ ] Debt-related endorsement notifications disabled
1. Remove NPC references in client/UI.
2. Remove NPC dependency in SQL/RPC.
3. Only then start endorsement schema + flows.

## Merge gate checklist for endorsement PRs

> **Rule:** Endorsement PRs are blocked from merge until all prerequisite items below are marked complete.

- [ ] **P1 — Client/UI cleanup complete:** NPC references removed in frontend/UI.
- [ ] **P2 — SQL/RPC cleanup complete:** NPC dependency removed in database schema, SQL, and RPC layers.
- [ ] **P3 — Endorsement work start approved:** endorsement schema + flows started only after P1-P2 are checked.

## PR template snippet (copy into endorsement PR descriptions)

```md
### Endorsement Migration Gate
- [ ] P1 complete (NPC references removed in client/UI)
- [ ] P2 complete (NPC dependency removed in SQL/RPC)
- [ ] P3 confirmed (endorsement schema + flows started after P1-P2)
```
