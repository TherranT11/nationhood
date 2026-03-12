# Nationhood Economy Tab - Comprehensive Guide

This guide explains every section of the Economy tab, how to read the numbers, and how to use the tools available to manage your nation's economy.

---

## Table of Contents

1. [Overview Sub-Tab](#1-overview-sub-tab)
2. [Budget Sub-Tab](#2-budget-sub-tab)
3. [Taxation Sub-Tab](#3-taxation-sub-tab)
4. [Trade Sub-Tab](#4-trade-sub-tab)
5. [Sectors Sub-Tab](#5-sectors-sub-tab)
6. [Tariffs Sub-Tab](#6-tariffs-sub-tab)
7. [How the Economy Simulation Works](#7-how-the-economy-simulation-works)
8. [Key Formulas Reference](#8-key-formulas-reference)
9. [Strategic Tips](#9-strategic-tips)

---

## 1. Overview Sub-Tab

The Overview is your economic dashboard. It gives you a snapshot of fiscal health, trade, debt, and macro indicators at a glance.

### Fiscal Snapshot

Three cards at the top:

| Card | What It Shows |
|------|---------------|
| **Revenue** | Total income your government collects per tick (taxes + oil + aid) |
| **Expenditures** | Total government spending per tick (ministry costs + debt service + aid given) |
| **Surplus / Deficit** | Revenue minus Expenditures. Green = surplus (good). Red = deficit (debt is growing). |

**How to read it:** If your deficit is red, you are accumulating national debt every tick. You need to either raise revenue (taxes) or cut spending (repeal expensive policies).

### Trade Snapshot

Four cards showing per-tick trade activity:

- **Total Exports** - Dollar value of goods your nation sells abroad
- **Total Imports** - Dollar value of goods your nation buys from abroad
- **Trade Balance** - Exports minus Imports. Positive = trade surplus. Negative = trade deficit.
- **Tariff Revenue** - Income earned from tariffs on imports

### Trade Inputs / Diagnostics

This panel breaks down the modifiers affecting your trade:

- **Tariff Rate** - Your current tariff level (0-100). Higher tariffs reduce imports via the import dampening formula.
- **Import Dampening** - Calculated as `1 - (tariff_rate / 200)`. A tariff of 100 reduces imports by 50%.
- **Currency Strength Modifier** - Your currency_strength stat divided by 50. A value of 1.0 is neutral. Above 1.0 strengthens exports; below 1.0 weakens them.
- **Stability Modifier** - Affects export capacity. Formula: `min(1.0, stability / 40)`. You need stability of at least 40 for full export potential. Below 40, exports are proportionally reduced.
- **Per-Sector Capacity vs Actual** - Shows each sector's theoretical export capacity versus what is actually being traded.
- **Trade Partner Affinity** - Lists which nations you can trade with and how strong the trading relationship is.

### National Debt Section

This is critical for long-term survival:

| Metric | What It Means |
|--------|---------------|
| **Total Debt** | The raw dollar amount your nation owes |
| **Debt-to-GDP Ratio** | Debt divided by GDP. The most important debt metric. |
| **Debt-to-Revenue Ratio** | Debt divided by annual revenue. Shows how many years of revenue it would take to pay off debt. |
| **Credit Rating** | Score from 0-100. Higher is better. Affects your interest rate on debt. |
| **Debt Distress Level** | Label based on Debt-to-GDP: Healthy (<50%), Elevated (50-100%), Distressed (100-150%), Critical (>150%) |
| **Debt Service Burden** | What percentage of your budget goes to paying interest. At 30%+, government spending effectiveness is severely penalized. |
| **Credit Lockout** | If your credit rating drops below 40, you are locked out of credit markets. |

**How to read it:** Watch the Debt-to-GDP ratio. If it's climbing toward 100%, you need to act. At 150%+, you face sovereign default and must choose between full default or partial restructuring (costs 6 AP).

### Macro Indicators

Four key statistics about your economy:

- **GDP Growth** - Stat from 0-100 where 50 = 0% growth. Above 50 = growing economy, below 50 = shrinking.
- **Unemployment** - Lower is better. Affected by labor policies and economic health.
- **Inflation** - Stat from 0-100. Increases the cost of all government spending. Labels range from "Negligible" (<0.1% per tick) to "Hyperinflation" (8%+ per tick).
- **Standard of Living** - Composite measure of citizen wellbeing.

### Economic Rankings

Shows how your nation ranks against all other nations in the game for GDP, GDP Growth, Standard of Living, Unemployment, and National Debt.

### Sector Health

Bar chart showing each of the 8 trade sectors' export capacity scores (0-100) with threshold markers. Sectors above their threshold are actively exporting; those below are not competitive enough to export.

---

## 2. Budget Sub-Tab

The Budget tab is your detailed fiscal accounting ledger.

### Summary Cards

Same three cards as the Overview fiscal snapshot: Revenue, Expenditures, Surplus/Deficit.

### Revenue Breakdown (Left Column)

Shows exactly where your money comes from:

| Source | How It's Calculated |
|--------|-------------------|
| **Income Tax** | GDP x (rate/100) x 0.40 x collection rate |
| **Sales Tax** | GDP x (rate/100) x 0.30 x collection rate |
| **Corporate Tax** | GDP x (rate/100) x 0.10 x collection rate |
| **Tariffs** | Actual tariff revenue from the trade engine (or GDP x (rate/100) x 0.05 x collection rate as fallback) |
| **Oil & Gas** | GDP x (oil_and_gas/100) x 0.06 (only if oil_and_gas stat > 30, not subject to collection rate) |
| **Foreign Aid** | Aid received from other nations or international bodies |

**Collection Rate** is a hidden but crucial modifier: `(efficiency + (100 - corruption)) / 200`. Perfect efficiency (100) and zero corruption gives you 100% collection. Low efficiency and high corruption means you're losing tax revenue to waste and graft.

### Expenditure Breakdown (Right Column)

Shows spending by ministry. There are 11 fiscal categories, each corresponding to a ministry:

1. Interior
2. Labor
3. Healthcare
4. Education
5. Transportation
6. Energy
7. Justice
8. Foreign Ministry
9. Finance
10. Defense
11. Trade

Each ministry's cost comes from two sources:
- **Policy Costs** - The ongoing cost of active laws/policies assigned to that ministry. Each policy has a base cost (in millions per tick) that may scale with a nation stat and is adjusted for inflation.
- **Institution Costs** - Baseline costs for running government institutions, scaled by population or GDP and adjusted for inflation.

**Debt Service** is also listed as a mandatory expenditure. It's calculated as: `debt x effective_interest_rate`, where the interest rate is `15% - (credit_rating x 0.13%)`, clamped between 2% and 18%.

### Net Balance Box

Shows the final surplus or deficit after all revenue and spending. If red, this amount is being added to your national debt every tick.

---

## 3. Taxation Sub-Tab

This is where you actively manage your tax policy.

### Fiscal Summary Bar

Five metrics across the top:

| Metric | What It Means |
|--------|---------------|
| **Tax Revenue** | Your tax income as a percentage of total national income |
| **Tax Burden** | Average tax rate x 1.28. Labels: Low / Moderate-Low / Moderate / High / Very High |
| **Compliance %** | How much of owed taxes you actually collect. Based on efficiency, corruption, and Tax Admin funding. |
| **Avg Effective Rate** | The average across all your tax rates |
| **Pending Changes** | Number of tax reform bills currently in the legislative pipeline |

### Tax Cards

Three interactive cards, one for each tax type:

#### Income Tax
- **GDP Weight**: 40% (largest revenue source)
- **Max Rate**: 50%
- **Slider**: Adjust from 0% to 50%
- **Sparkline**: Shows 12 ticks of revenue history
- **Revenue Comparison**: Actual vs projected revenue with delta

#### Sales Tax
- **GDP Weight**: 30% (second largest)
- **Max Rate**: 50%
- Same interactive elements as Income Tax

#### Corporate Tax
- **GDP Weight**: 10% (smallest of the three)
- **Max Rate**: 50%
- Same interactive elements as Income Tax

### How to Use the Tax Cards

1. **Adjust the slider** to your desired new rate
2. The card will show you a preview of:
   - **Projected revenue change** (will it raise or lower revenue)
   - **Approval impact** (how voters will react)
   - **Stat effects** (what nation stats will be affected, from the stat_connections table)
   - **Voter bloc impacts** (which voter groups care about this tax)
3. **Click Submit** to draft a tax reform bill (costs 2 AP)
4. The bill then goes through the normal legislative process (committee, floor vote, presidential signature if applicable)

**Slider color coding:**
- Low rates: cooler colors
- Mid rates: neutral
- High rates: warmer colors
- Extreme rates (near 50%): red/warning colors

**Key insight:** Raising income and sales taxes by 1% costs you about 2% approval per point. Cutting them gains about 1% approval per point. The approval impact is asymmetric - voters punish tax hikes more than they reward tax cuts.

---

## 4. Trade Sub-Tab

Shows your international commerce in detail.

### Trade Overview Cards

Four cards: Total Exports, Total Imports, Trade Balance, Tariff Revenue (all per-tick values).

### Sector Flows Table

A table with one row per trade sector showing:

| Column | Meaning |
|--------|---------|
| **Sector** | Name of the trade sector |
| **Export Volume** | Dollar value of exports in this sector |
| **Import Volume** | Dollar value of imports in this sector |
| **Net Balance** | Exports minus Imports for this sector |
| **Price Modifier** | Scarcity/abundance multiplier affecting trade value |
| **Trend** | Arrow showing direction compared to previous tick |

### Derived Trade Scores

Some sectors don't have a single driving stat. Instead, they use composite scores:

| Sector | Derived From |
|--------|-------------|
| **Manufactured Goods** | Average of physical_infrastructure + higher_education |
| **Technology** | Average of digital_infrastructure + higher_education |
| **Tourism** | Average of happiness + stability + physical_infrastructure |
| **Services & Finance** | Average of higher_education + digital_infrastructure + credit |
| **Medical & Biotech** | Average of healthcare_quality + higher_education + digital_infrastructure |

### Trading Partners Section

Cards for each nation you trade with, sorted by total volume:

- **Bilateral volumes**: How much you export to and import from this partner
- **Affinity score**: How strong the trading relationship is (0-100)
- **Affinity breakdown**: Shows the components:
  - Base: 50 (everyone starts here)
  - Diplomatic bonus: relation_score x 0.3
  - Trade agreement bonus: FTA (+25), RSC (+20), PTA (+15)
  - Proximity bonus: (proximity/100) x 20
  - Embargo penalty: -40
- **Volume bars**: Visual stacked bar of exports/imports
- **Sector breakdown**: Per-sector trade with this specific partner

---

## 5. Sectors Sub-Tab

Deep dive into each of the 8 trade sectors.

### The 8 Trade Sectors

| Sector | Driving Stat(s) | Export Threshold |
|--------|-----------------|-----------------|
| **Fuel & Energy** | oil_and_gas | 15 |
| **Minerals & Raw Materials** | rare_minerals | 15 |
| **Food & Agriculture** | arable_land | 20 |
| **Manufactured Goods** | physical_infrastructure + higher_education | 30 |
| **Technology** | digital_infrastructure + higher_education | 30 |
| **Tourism** | happiness + stability + physical_infrastructure | 30 (export-only) |
| **Services & Finance** | higher_education + digital_infrastructure + credit | 30 |
| **Medical & Biotech** | healthcare_quality + higher_education + digital_infrastructure | 30 |

### How to Read a Sector Panel

Click on any sector tab to see:

- **Export Capacity Score** (0-100): How competitive your nation is in this sector. Driven by the sector's underlying stats.
- **Threshold Marker**: The minimum capacity score needed to export. If you're below the threshold, you import in this sector instead.
- **Above/Below Threshold Status**: Clear indicator of whether you're a net exporter or importer.
- **Export Volume**: Actual dollar value of exports.
- **Import Volume**: Actual dollar value of imports.
- **Net**: Exports minus Imports.
- **Price Modifier**: Market price multiplier for this sector's goods.
- **Sector Drivers**: The specific nation stats that determine your capacity, with their current values.
- **Trading Partners**: Which nations you're trading with in this specific sector.

**How to improve a sector:** Raise the underlying stats. For example, to boost Technology exports, invest in digital_infrastructure and higher_education through policies. Once the composite score crosses the threshold (30), you become a net exporter.

---

## 6. Tariffs Sub-Tab

Manages trade agreements with other nations.

- **Active Trade Agreements**: List of all current agreements (FTA, RSC, PTA)
- **Agreement Details**: Type, partner nation, terms, and expiration
- **Impact**: Each agreement type provides a different affinity bonus that affects trade volume with that partner

---

## 7. How the Economy Simulation Works

The economy updates every **tick** (one tick = one in-game month, 12 ticks = 1 year).

### Each Tick, the Following Happens:

1. **GDP Growth Applied**
   - Your gdp_growth stat (0-100) determines monthly GDP change
   - At 50: 0% growth (flat)
   - Above 50: positive growth (up to +3% per month at 100)
   - Below 50: negative growth (down to -3% per month at 0)
   - Formula: `monthly_change% = ((gdp_growth - 50) / 50) x 3`

2. **Stat Decay / Equilibrium**
   - Stats naturally drift toward equilibrium values
   - Active policies counteract or amplify this drift

3. **Budget Calculated**
   - Revenue from all tax sources computed
   - Ministry costs computed (policy costs + institution costs, both inflation-adjusted)
   - Debt service computed
   - Surplus reduces debt; deficit increases debt

4. **Debt Updated**
   - If deficit: debt increases by the deficit amount
   - If surplus: debt decreases by the surplus amount
   - Credit rating adjusts based on debt levels

5. **Trade Engine Runs**
   - Export capacities calculated per sector
   - Import demands calculated based on population
   - Trade volumes determined by capacity, affinity, and modifiers
   - Tariff revenue calculated from actual imports

6. **Aid Conditions Reviewed** (annually, every 12th tick)
   - Foreign aid conditions checked
   - Aid can be suspended, reduced, or terminated if conditions aren't met

### Inflation: The Silent Killer

Inflation deserves special attention because it compounds:

- **Inflation stat** (0-100) converts to a percentage rate: `rate = stat^1.5 / 100`
- This rate is applied as a **cost multiplier** to ALL government spending: `cost x (1 + rate/100)`
- At inflation stat 28: ~0.42% per tick (roughly stable, manageable)
- At inflation stat 50: ~3.5% per tick (costs rising fast)
- At inflation stat 100: 10% per tick (hyperinflation, costs doubling every ~7 ticks)

| Inflation Stat | Rate/Tick | Label | Impact |
|---------------|-----------|-------|--------|
| 0-5 | <0.1% | Negligible | No real impact |
| 5-15 | 0.1-0.5% | Minimal | Barely noticeable |
| 15-30 | 0.5-1.5% | Stable | Normal range |
| 30-45 | 1.5-3% | Low | Starting to bite |
| 45-60 | 3-5% | Moderate | Significant cost increases |
| 60-75 | 5-8% | High | Serious economic strain |
| 75-100 | 8%+ | Hyperinflation | Economy collapsing |

### The Debt Spiral

Debt can become self-reinforcing:

1. Deficit spending adds to debt
2. More debt means higher debt service payments
3. Higher debt service means less available budget
4. Less available budget means larger deficit
5. Credit rating drops, increasing interest rates
6. Higher interest rates mean even more debt service
7. Repeat until sovereign default

**Breaking the spiral:** You must either increase revenue (raise taxes) or decrease spending (repeal expensive policies) enough to run a surplus. The earlier you act, the easier it is.

---

## 8. Key Formulas Reference

### Revenue
```
collection_rate = (efficiency + (100 - corruption)) / 200

income_tax_revenue  = GDP x (income_tax_rate / 100) x 0.40 x collection_rate
sales_tax_revenue   = GDP x (sales_tax_rate / 100)  x 0.30 x collection_rate
corporate_tax_rev   = GDP x (corp_tax_rate / 100)    x 0.10 x collection_rate
tariff_revenue      = GDP x (tariff_rate / 100)      x 0.05 x collection_rate
oil_gas_revenue     = GDP x (oil_and_gas / 100)      x 0.06  [if oil_and_gas > 30]
```

### Debt
```
effective_interest = 15% - (credit_rating x 0.13%)   [clamped 2%-18%]
debt_service       = debt x effective_interest
available_budget   = gross_revenue - debt_service
```

### GDP Growth
```
monthly_change%    = ((gdp_growth - 50) / 50) x 3
yearly_growth%     = (1 + monthly_change/100)^12 - 1
```

### Inflation
```
inflation_rate     = inflation_stat^1.5 / 100
cost_multiplier    = 1 + (inflation_rate / 100)
```

### Trade
```
import_dampening   = 1 - (tariff_rate / 200)
currency_modifier  = currency_strength / 50
export_modifier    = min(1.0, stability / 40)
trade_affinity     = max(0, min(100, 50 + diplomatic + treaty + proximity + embargo))
```

### Tax Burden
```
tax_burden_score   = average_tax_rate x 1.28
```

---

## 9. Strategic Tips

### Early Game
- **Don't ignore your budget.** Even small deficits compound over time.
- **Check your collection rate.** If efficiency is low or corruption is high, raising tax rates won't help much - you'll just lose more to waste. Invest in efficiency first.
- **Oil & Gas is free money.** If your oil_and_gas stat is above 30, you get revenue that bypasses the collection rate entirely.

### Managing Taxes
- **Income tax is your biggest lever** (40% GDP weight). A 1% change here moves the needle most.
- **Corporate tax has the smallest GDP weight** (10%) but affects the Business Owners voter bloc directly.
- **Don't max out all taxes.** The approval penalty for tax hikes is double the reward for cuts. Find a sustainable middle ground.

### Managing Debt
- **Watch Debt-to-GDP, not raw debt.** A large economy can sustain more debt.
- **Credit rating matters.** At credit rating 100, your interest rate is 2%. At credit rating 0, it's 18%. That's a 9x difference in debt service costs.
- **If Debt-to-GDP exceeds 100%, act immediately.** At 150%, you face forced default.
- **Credit lockout (below 40 rating) is devastating.** Avoid it at all costs.

### Managing Trade
- **Stability is essential for exports.** Below 40 stability, your exports are proportionally reduced. At 0 stability, you export nothing.
- **Tariffs are a double-edged sword.** They generate revenue but dampen imports (and trade partners may retaliate).
- **Invest in composite sectors for long-term growth.** Technology and Services & Finance have high thresholds (30) but are driven by stats you control (education, digital infrastructure).
- **Trade agreements matter.** An FTA gives +25 affinity, which significantly increases trade volume with that partner.

### Inflation Control
- **Keep inflation stat below 30 if possible.** Above that, costs start rising noticeably.
- **Inflation compounds.** A "moderate" 3% per tick means costs roughly double every 2 years (24 ticks).
- **Look for policies that target the inflation stat.** Prevention is far cheaper than cure.

### The Golden Rule
**Run a slight surplus.** Even a small surplus each tick will slowly pay down debt, improve your credit rating, lower your interest rate, and give you fiscal breathing room for crises. A balanced budget is fine; a persistent deficit is a ticking time bomb.
