# Minor Diplomatic Initiative — Implementation Plan

## Scope
Implement the full Minor Diplomatic Initiative system with article config UI, effect calculation, accept/strike/reject flow, and budget integration through the Embassies & Consulates institution.

**Excluded from this pass:** Counter-proposal flow (strike+add+2AP back-and-forth). Only Accept, Accept-with-Strikes, and Reject.

## Files to Modify

### 1. `js/game/diplomacy-constants.js` — Add initiative config constants
- Add `MINOR_INITIATIVE_CONFIG` with all article type definitions, duration/scope/direction scaling, cost tables, effect formulas
- Add `INITIATIVE_ARTICLE_TYPES` with full config schemas for visa_agreement, cultural_exchange, student_exchange, joint_statement

### 2. `diplomacy.html` — Major UI changes to draft panel
- **Replace** the current simple `INITIATIVE_TYPES` object (lines 152-181) with the new rich article type config
- **Replace** `renderDraftBox()` minor_initiative branch — currently uses a flat select+add flow with no config fields. Replace with full article card UI:
  - Auto-fill target nation from ambassador posting (read-only)
  - Article selector dropdown → add article card with config fields
  - Each article card has toggle groups (duration, scope, direction), checkboxes (excludes, programmes, fields), numeric inputs (seats), textareas (statement text)
  - Effect tags calculated dynamically based on config
  - Article cards styled per CSS spec (teal left border, mono labels, effect-tag variants)
  - Action bar shows article count, FM budget info, Send button
- **Replace** `addDraftArticle()` — create articles with full config objects instead of flat text
- **Update** `submitDraft()` — build rich proposal_data with article configs and computed effects
- **Update** `applyProposalEffects()` — apply stat modifiers (immigration, int'l reputation, higher_education, soft_power, polarization, terrorism_risk), not just relations+money
- **Update** `acceptProposal()` — deduct costs from Embassies & Consulates institution needed_amount
- **Update** `strikeArticles()` — works with rich article objects (strike by article id)
- **Update** proposal rendering in negotiations box — show rich article details, effect tags, config summaries
- Add validation: hostile nations blocked, one visa agreement per initiative, FM budget check
- Add `renderInitiativeArticleCard()` — renders a single article with its config controls and effect tags
- Add `calculateArticleEffects()` — computes effects from article config (duration_mod × scope_mod × direction)

### 3. `css/diplomacy.css` — Add initiative-specific styles
- `.initiative-article` — article card with config fields
- `.config-grid`, `.config-row`, `.config-label` — config field layout
- `.toggle-group`, `.toggle-opt`, `.toggle-opt.is-selected` — radio-style toggles
- `.check-group`, `.check-opt`, `.check-opt.is-selected` — multi-select checkboxes
- `.config-value`, `.config-value--sm`, `.config-unit`, `.config-note` — numeric inputs
- `.text-area` — textarea for joint statement
- `.effect-tag` variants: `--positive`, `--money-pos`, `--money-neg`, `--negative`, `--info`, `--neutral`, `--warning`
- `.article-note` — italic explanatory text
- `.article-selector` — bottom dropdown bar
- `.btn--send` — send button with teal styling

### 4. `supabase/functions/advance-tick/index.ts` — Process active initiatives per tick
- Add soft_power decay processing for cultural_exchange articles (first third +3, second third +2, final third +1)
- Add permanent cultural_exchange ongoing costs (-$5M/tick from institution needed_amount)
- Handle initiative expiry (cultural_exchange/student_exchange duration-based)
- Remove persistent stat modifiers (polarization, terrorism_risk, immigration) when initiative expires or is repealed
- Check for and replace duplicate visa agreements between same nations

### 5. No new migration needed
- The `diplomatic_proposals` table already has `proposal_data` JSONB which stores all article configs, effects, and state
- Active effects are read each tick from proposals with status='active' and type='diplomatic_initiative'
- Costs increase `needed_amount` on the `embassies` institution in `budget_item_allocations`

## Implementation Order

1. **Constants** — Add MINOR_INITIATIVE_CONFIG to diplomacy-constants.js
2. **CSS** — Add all initiative-specific styles
3. **Draft UI** — Rebuild the minor initiative draft panel with article config cards
4. **Effect Calculation** — Add calculateArticleEffects() function
5. **Submit** — Update submitDraft() to build rich proposal_data
6. **Accept/Effects** — Update applyProposalEffects() for rich effects + institution cost
7. **Strike** — Update strikeArticles() for rich article objects
8. **Negotiations Display** — Update proposal rendering to show rich article details
9. **Tick Processing** — Add soft_power decay, ongoing costs, expiry in advance-tick
10. **Validation** — Add edge case checks (hostile, duplicate visa, budget)

## Key Design Decisions

- **Budget integration:** Initiative costs increase `needed_amount` on the `embassies` institution in `budget_item_allocations`. This creates underfunding that the government must address through budget bills.
- **Stat modifiers:** Persistent effects (immigration, polarization, terrorism_risk) stored as metadata in the proposal_data and applied/removed by advance-tick based on initiative status.
- **Effect tags:** Dynamically computed in the UI from article config — not stored as static values. This allows real-time preview as the user adjusts config toggles.
- **Visa replacement:** If a visa agreement already exists between two nations, activating a new one replaces the old one (old initiative status → 'superseded', old effects removed).
- **No new tables:** All data stored in existing `diplomatic_proposals.proposal_data` JSONB.
