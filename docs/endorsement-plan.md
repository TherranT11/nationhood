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
