# Endorsement Migration Plan (Gated)

This plan defines prerequisite removals that **must** be completed before any endorsement schema or flow work begins.

## Prerequisite sequence (strict order)

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
