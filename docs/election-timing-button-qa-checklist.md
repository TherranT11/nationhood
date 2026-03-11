# Election Timing Button QA Checklist

Use this checklist whenever the election timing gate, lock state, or disabled helper copy changes.

## Test setup
- Capture these values before each check:
  - `election_tick = ____`
  - `current_tick = ____`
  - `button state` (enabled/disabled)
  - `disabled reason text` (tooltip/title/helper)
- If testing in UI, hover/focus the disabled button and verify the helper/tooltip is visible.
- If testing in automation, assert both `disabled` state and reason text value.

## Expected behavior matrix

| Case | Tick condition | Expected button state | Expected reason text behavior | Actual button state | Actual reason text | Pass/Fail | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `current_tick = election_tick - 6` | **Enabled** | No disabled reason should be required while enabled. |  |  |  |  |
| 2 | `current_tick = election_tick - 7` | **Disabled** | Shows timing lock reason (outside activation window). |  |  |  |  |
| 3 | `current_tick = election_tick - 1` | **Enabled** | No disabled reason should be required while enabled. |  |  |  |  |
| 4 | `current_tick = election_tick` and after firing | **Disabled / locked** | Shows lock reason indicating election-day lock / already fired state. |  |  |  |  |
| 5 | Any disabled state | **Disabled** | Tooltip/helper text is always present and non-empty when disabled. |  |  |  |  |

## Run log (for regression tracking)

| Date | Environment | Build/Commit | Tester | Summary |
|---|---|---|---|---|
|  |  |  |  |  |

## Notes for future timing-rule changes
- If the activation window changes from `-6..-1`, update this checklist’s case table and keep the prior values in git history for traceability.
- Always update both expected state and expected reason copy in the same PR so behavior and QA criteria stay aligned.
