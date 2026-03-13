# Bug: Trade Agreement Articles Empty in Ratification Bill View

## Problem
When a trade agreement is proposed via the diplomacy wizard and accepted by the target nation, it moves to parliament as a ratification bill. The ratification bill view correctly shows the preamble (agreement name, type, parties, duration) and the "Terms & Provisions" section with numbered articles (Article I through VI), but **none of the article content is displayed** — each article box is empty.

## Expected Behavior
Each article should display its content, e.g.:
- "Art. I — Tariff Reduction: Fuel & Energy: Mutual tariff reduction of 50%"
- "Art. II — Tariff Reduction: Minerals & Raw Materials: Their exports tariff reduction of 100%"
- etc.

These details ARE correctly stored and visible in the diplomacy/agreements panel.

## Root Cause Analysis

### Data Flow
1. **Proposal creation** (`diplomacy.html` ~line 4095-4122): Trade articles are stored as structured objects with `type` + `data` fields (e.g. `{ type: 'tariff_reduction', data: { sector: 'fuel_energy', reduction_pct: 50, direction: 'mutual' } }`) into `proposal_data.articles` on a `diplomatic_proposals` row.

2. **Bill creation**: When accepted, a ratification bill is created with `diplomatic_proposal_id` pointing to this proposal.

3. **Bill page load** (`bill.html` ~line 305-311): The bill page detects `bill.diplomatic_proposal_id`, fetches the proposal, and sets `ratificationData = { kind: 'diplomatic', proposal, ... }`.

4. **Rendering** (`bill.html` ~line 1132-1175, `renderRatificationBill()`): The `rd.kind === 'diplomatic'` branch reads `pd.articles` and renders each article with:
   ```js
   escapeHtml(art.text || '')   // line 1163
   ```

### The Bug
Trade agreement articles **do not have a `text` field**. They use structured `type` + `data` fields:
```js
// What a trade article actually looks like:
{ type: 'tariff_reduction', data: { sector: 'fuel_energy', reduction_pct: 50, direction: 'mutual' } }

// What the diplomatic renderer expects:
{ text: 'Some human-readable article text' }
```

So `art.text` is always `undefined`, and `escapeHtml(art.text || '')` renders an empty string for every article.

### The Fix Location
A function called `renderTradeArticleDescription(art, rd)` already exists (`bill.html` ~line 1070-1124) that correctly converts structured trade articles into human-readable HTML. However, it is **only called in the `rd.kind === 'trade'` path** (lines 1240 and 1253), not in the `rd.kind === 'diplomatic'` path.

## Files Involved
- **`bill.html`** — `renderRatificationBill()` (~line 1126): The diplomatic ratification rendering branch needs to detect trade-style articles (those with `type` + `data` instead of `text`) and use `renderTradeArticleDescription()` to render them.
- **`bill.html`** — `renderTradeArticleDescription()` (~line 1070): Already handles all trade article types (`tariff_reduction`, `duration`, `sector_exemption`, `supply_commitment`, `price_terms`, `breach_penalty`, `subsidized_sector`, `funding_source`, `text_article`). This function expects a second argument `rd` with `nationA`, `nationB`, and `isNationA` fields — the diplomatic ratification data structure would need to provide these.
- **`diplomacy.html`** (~line 4095): Where `proposal_data` is constructed — stores `tradeArticles` (structured) into `articles`.

## Suggested Fix
In `renderRatificationBill()`, within the `rd.kind === 'diplomatic'` branch, when rendering each article (~line 1163), check if the article has a `type` field (indicating it's a structured trade article) and use `renderTradeArticleDescription()` instead of `escapeHtml(art.text || '')`.

The `rd` object for diplomatic proposals would need `nationA`, `nationB`, and `isNationA` fields added (they exist in the `rd.kind === 'trade'` path but not diplomatic). Alternatively, construct a compatible `rd` from the proposal's `proposer_nation_name` / `target_nation_name` fields already stored in `proposal_data`.

Also apply the same type-label logic from the trade path — show "TARIFF REDUCTION", "DURATION", etc. labels on each article instead of just "Article I", "Article II".
