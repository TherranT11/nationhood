// ===== PAGE GUIDE SYSTEM =====
// Shows contextual help guides per page tab

const guideContent = {
    economy: {
        title: 'Economy Guide',
        html: `
<details open><summary>Overview Sub-Tab</summary><div>
<p>The Overview is your economic dashboard &mdash; a snapshot of fiscal health, trade, debt, and macro indicators.</p>

<h3>Fiscal Snapshot</h3>
<table>
<tr><th>Card</th><th>What It Shows</th></tr>
<tr><td><strong>Revenue</strong></td><td>Total income your government collects per tick (taxes + oil + aid)</td></tr>
<tr><td><strong>Expenditures</strong></td><td>Total government spending per tick (ministry costs + debt service + aid given)</td></tr>
<tr><td><strong>Surplus / Deficit</strong></td><td>Revenue minus Expenditures. Green = surplus. Red = deficit (debt is growing).</td></tr>
</table>
<p class="guide-tip">If your deficit is red, you are accumulating national debt every tick. Raise revenue (taxes) or cut spending (repeal expensive policies).</p>

<h3>Trade Snapshot</h3>
<ul>
<li><strong>Total Exports</strong> &mdash; Dollar value of goods sold abroad</li>
<li><strong>Total Imports</strong> &mdash; Dollar value of goods bought from abroad</li>
<li><strong>Trade Balance</strong> &mdash; Exports minus Imports</li>
<li><strong>Tariff Revenue</strong> &mdash; Income earned from tariffs on imports</li>
</ul>

<h3>Trade Diagnostics</h3>
<ul>
<li><strong>Tariff Rate</strong> (0&ndash;100) &mdash; Higher tariffs reduce imports</li>
<li><strong>Import Dampening</strong> = <code>1 - (tariff_rate / 200)</code></li>
<li><strong>Currency Strength</strong> = <code>currency_strength / 50</code> &mdash; 1.0 is neutral</li>
<li><strong>Stability Modifier</strong> = <code>min(1.0, stability / 40)</code> &mdash; Need 40+ stability for full exports</li>
</ul>

<h3>National Debt</h3>
<table>
<tr><th>Metric</th><th>What It Means</th></tr>
<tr><td><strong>Debt-to-GDP</strong></td><td>Most important debt metric. &lt;50% Healthy, 50&ndash;100% Elevated, 100&ndash;150% Distressed, 150%+ Critical</td></tr>
<tr><td><strong>Credit Rating</strong></td><td>0&ndash;100. Higher = better. Affects interest rate on debt.</td></tr>
<tr><td><strong>Debt Service Burden</strong></td><td>% of budget going to interest. At 30%+ government spending is severely penalized.</td></tr>
<tr><td><strong>Credit Lockout</strong></td><td>Credit rating below 40 locks you out of credit markets.</td></tr>
</table>
<p class="guide-tip">Watch Debt-to-GDP. At 150%+ you face sovereign default &mdash; forced to choose between full default or partial restructuring (6 AP).</p>

<h3>Macro Indicators</h3>
<ul>
<li><strong>GDP Growth</strong> &mdash; Stat 0&ndash;100 where 50 = 0% growth. Above 50 = growing, below 50 = shrinking.</li>
<li><strong>Unemployment</strong> &mdash; Lower is better.</li>
<li><strong>Inflation</strong> &mdash; 0&ndash;100. Increases cost of all government spending.</li>
<li><strong>Standard of Living</strong> &mdash; Composite measure of citizen wellbeing.</li>
</ul>
</div></details>

<details><summary>Budget Sub-Tab</summary><div>
<p>Your detailed fiscal accounting ledger.</p>

<h3>Revenue Sources</h3>
<table>
<tr><th>Source</th><th>Formula</th></tr>
<tr><td><strong>Income Tax</strong></td><td>GDP &times; (rate/100) &times; 0.55 &times; collection rate</td></tr>
<tr><td><strong>Sales Tax</strong></td><td>GDP &times; (rate/100) &times; 0.35 &times; collection rate</td></tr>
<tr><td><strong>Corporate Tax</strong></td><td>GDP &times; (rate/100) &times; 0.15 &times; collection rate</td></tr>
<tr><td><strong>Tariffs</strong></td><td>Actual tariff revenue from trade engine</td></tr>
<tr><td><strong>Oil &amp; Gas</strong></td><td>GDP &times; (oil_and_gas/100) &times; 0.06 (only if stat &gt; 30, bypasses collection rate)</td></tr>
<tr><td><strong>Foreign Aid</strong></td><td>Aid received from other nations</td></tr>
</table>

<h3>Collection Rate</h3>
<p><code>0.35 + ((efficiency + (100 - corruption)) / 200) &times; 0.65</code></p>
<p class="guide-tip">Ranges from 35% (worst governance) to 100% (perfect). Even poorly-run nations collect some tax. High efficiency and low corruption maximize revenue.</p>

<h3>Expenditures</h3>
<p>11 ministries, each with costs from:</p>
<ul>
<li><strong>Policy Costs</strong> &mdash; Ongoing cost of active laws (base cost in millions/tick, may scale with a stat, inflation-adjusted)</li>
<li><strong>Institution Costs</strong> &mdash; Baseline costs scaled by population or GDP, inflation-adjusted</li>
</ul>
<p><strong>Debt Service</strong> is mandatory: <code>debt &times; interest_rate</code> where rate = <code>15% - (credit_rating &times; 0.13%)</code>, clamped 2%&ndash;18%.</p>
</div></details>

<details><summary>Taxation Sub-Tab</summary><div>
<p>Actively manage your tax policy here.</p>

<h3>Fiscal Summary Bar</h3>
<table>
<tr><th>Metric</th><th>Meaning</th></tr>
<tr><td><strong>Tax Revenue</strong></td><td>Tax income as % of total national income</td></tr>
<tr><td><strong>Tax Burden</strong></td><td>Avg rate &times; 1.28. Labels: Low / Moderate-Low / Moderate / High / Very High</td></tr>
<tr><td><strong>Compliance %</strong></td><td>How much of owed taxes you actually collect</td></tr>
<tr><td><strong>Pending Changes</strong></td><td>Tax reform bills in the legislative pipeline</td></tr>
</table>

<h3>Tax Cards</h3>
<table>
<tr><th>Tax</th><th>GDP Weight</th><th>Max Rate</th></tr>
<tr><td><strong>Income Tax</strong></td><td>40% (largest lever)</td><td>50%</td></tr>
<tr><td><strong>Sales Tax</strong></td><td>30%</td><td>50%</td></tr>
<tr><td><strong>Corporate Tax</strong></td><td>10% (smallest, but affects Business Owners bloc)</td><td>50%</td></tr>
</table>

<h3>How to Use</h3>
<ul>
<li>Adjust the slider to your desired rate</li>
<li>Preview: projected revenue change, approval impact, stat effects, voter bloc impacts</li>
<li>Click Submit to draft a tax reform bill (costs 2 AP)</li>
<li>Bill goes through normal legislative process</li>
</ul>

<p class="guide-tip">Raising income/sales taxes costs ~2% approval per 1% rate increase. Cutting them gains ~1% per 1% decrease. Voters punish hikes more than they reward cuts.</p>
</div></details>

<details><summary>Trade Sub-Tab</summary><div>
<h3>Sector Flows Table</h3>
<p>Each row shows a trade sector with export volume, import volume, net balance, price modifier, and trend arrow.</p>

<h3>Derived Trade Scores</h3>
<table>
<tr><th>Sector</th><th>Derived From</th></tr>
<tr><td><strong>Manufactured Goods</strong></td><td>Avg of physical_infrastructure + higher_education</td></tr>
<tr><td><strong>Technology</strong></td><td>Avg of digital_infrastructure + higher_education</td></tr>
<tr><td><strong>Tourism</strong></td><td>Avg of happiness + stability + physical_infrastructure</td></tr>
<tr><td><strong>Services &amp; Finance</strong></td><td>Avg of higher_education + digital_infrastructure + credit</td></tr>
<tr><td><strong>Medical &amp; Biotech</strong></td><td>Avg of healthcare_quality + higher_education + digital_infrastructure</td></tr>
</table>

<h3>Trade Partner Affinity</h3>
<p>Each partner has an affinity score (0&ndash;100) composed of:</p>
<ul>
<li>Base: 50</li>
<li>Diplomatic bonus: relation_score &times; 0.3</li>
<li>Trade agreement: FTA (+25), RSC (+20), PTA (+15)</li>
<li>Proximity: ((100 &minus; distance) / 100) &times; 20 &mdash; 0 = bordering, 100 = far</li>
<li>Embargo: &minus;40</li>
</ul>
<p class="guide-tip">Trade agreements significantly boost trade volume. An FTA gives +25 affinity.</p>

<h3>Trade Actions</h3>
<p>Three ways to manage trade relationships, each with different costs and benefits:</p>

<h4>Unilateral Tariff Reduction</h4>
<p>A one-sided tariff cut on a specific nation. No negotiation needed. 3 AP cost.</p>
<table>
<tr><th>Stat</th><th>Effect per tick</th></tr>
<tr><td>Cost of Living</td><td style="color:#5cb85c">&minus;0.1</td></tr>
<tr><td>Inflation</td><td style="color:#5cb85c">&minus;0.05</td></tr>
<tr><td>Happiness</td><td style="color:#5cb85c">+0.05</td></tr>
<tr><td>Foreign Investment</td><td style="color:#5cb85c">+0.05</td></tr>
<tr><td>Manufacturing Output</td><td style="color:#d9534f">&minus;0.05</td></tr>
<tr><td>Union Strength</td><td style="color:#d9534f">&minus;0.05</td></tr>
</table>

<h4>Preferential Tariff Agreement (PTA)</h4>
<p>Bilateral sector-specific tariff reductions. Requires negotiation. +15 trade affinity.</p>
<table>
<tr><th>Stat</th><th>Effect per tick</th></tr>
<tr><td>GDP Growth</td><td style="color:#5cb85c">+0.05</td></tr>
<tr><td>Cost of Living</td><td style="color:#5cb85c">&minus;0.05</td></tr>
<tr><td>Inflation</td><td style="color:#5cb85c">&minus;0.05</td></tr>
<tr><td>Foreign Investment</td><td style="color:#5cb85c">+0.1</td></tr>
<tr><td>Happiness</td><td style="color:#5cb85c">+0.05</td></tr>
<tr><td>Manufacturing Output</td><td style="color:#d9534f">&minus;0.05 (if manufactured goods reduced)</td></tr>
<tr><td>Union Strength</td><td style="color:#d9534f">&minus;0.05 (if manufactured goods reduced)</td></tr>
</table>

<h4>Free Trade Agreement (FTA)</h4>
<p>Comprehensive bilateral agreement. Strongest effects. +25 trade affinity. +3 polarization on signing.</p>
<table>
<tr><th>Stat</th><th>Effect per tick</th></tr>
<tr><td>GDP Growth</td><td style="color:#5cb85c">+0.15</td></tr>
<tr><td>Cost of Living</td><td style="color:#5cb85c">&minus;0.2</td></tr>
<tr><td>Inflation</td><td style="color:#5cb85c">&minus;0.1</td></tr>
<tr><td>Foreign Investment</td><td style="color:#5cb85c">+0.15</td></tr>
<tr><td>Happiness</td><td style="color:#5cb85c">+0.1</td></tr>
<tr><td>Credit</td><td style="color:#5cb85c">+0.05</td></tr>
<tr><td>Manufacturing Output</td><td style="color:#d9534f">&minus;0.15</td></tr>
<tr><td>Union Strength</td><td style="color:#d9534f">&minus;0.15</td></tr>
<tr><td>Sector Competition</td><td style="color:#d9534f">&minus;0.05 service &amp; manufacturing (if partner GDP &gt;2&times; yours)</td></tr>
</table>

<h4>Withdrawal Penalties</h4>
<p>Withdrawing from an FTA or PTA causes an immediate economic shock to <strong>both</strong> nations:</p>
<table>
<tr><th>Stat</th><th>FTA</th><th>PTA</th></tr>
<tr><td>GDP Growth</td><td>&minus;0.3</td><td>&minus;0.15</td></tr>
<tr><td>Foreign Investment</td><td>&minus;3</td><td>&minus;1</td></tr>
<tr><td>Stability</td><td>&minus;2</td><td>&minus;1</td></tr>
<tr><td>Polarization</td><td>+2</td><td>&mdash;</td></tr>
</table>
<p class="guide-tip">FTAs are powerful but costly. Unilateral reductions are a quick diplomatic gesture. PTAs offer a middle ground with targeted sector access.</p>
</div></details>

<details><summary>Sectors Sub-Tab</summary><div>
<h3>The 8 Trade Sectors</h3>
<table>
<tr><th>Sector</th><th>Driving Stat(s)</th><th>Threshold</th></tr>
<tr><td>Fuel &amp; Energy</td><td>oil_and_gas</td><td>15</td></tr>
<tr><td>Minerals</td><td>rare_minerals</td><td>15</td></tr>
<tr><td>Food &amp; Agriculture</td><td>arable_land</td><td>20</td></tr>
<tr><td>Manufactured Goods</td><td>physical_infrastructure + higher_education</td><td>30</td></tr>
<tr><td>Technology</td><td>digital_infrastructure + higher_education</td><td>30</td></tr>
<tr><td>Tourism</td><td>happiness + stability + physical_infrastructure</td><td>30</td></tr>
<tr><td>Services &amp; Finance</td><td>higher_education + digital_infrastructure + credit</td><td>30</td></tr>
<tr><td>Medical &amp; Biotech</td><td>healthcare_quality + higher_education + digital_infrastructure</td><td>30</td></tr>
</table>

<h3>Reading a Sector Panel</h3>
<ul>
<li><strong>Export Capacity Score</strong> (0&ndash;100) &mdash; How competitive your nation is</li>
<li><strong>Threshold Marker</strong> &mdash; Minimum score needed to export. Below = you import instead.</li>
<li><strong>Sector Drivers</strong> &mdash; The stats that determine capacity, with current values</li>
</ul>
<p class="guide-tip">To boost a sector, raise its underlying stats via policies. Once the composite score crosses the threshold, you become a net exporter.</p>
</div></details>

<details><summary>How the Simulation Works</summary><div>
<p>The economy updates every <strong>tick</strong> (1 tick = 1 in-game month, 12 ticks = 1 year).</p>

<h3>Each Tick</h3>
<ul>
<li><strong>GDP Growth</strong>: <code>monthly_change% = ((gdp_growth - 50) / 50) &times; 1</code>. Range: &minus;1% to +1%/month.</li>
<li><strong>Budget</strong>: Revenue computed, ministry costs (inflation-adjusted), debt service deducted</li>
<li><strong>Debt</strong>: Deficit adds to debt; surplus reduces it</li>
<li><strong>Trade</strong>: Export capacities, import demands, trade volumes, tariff revenue</li>
<li><strong>Aid Review</strong>: Every 12th tick, foreign aid conditions checked</li>
</ul>

<h3>Inflation</h3>
<p>Rate = <code>stat^1.5 / 100</code>, applied as cost multiplier <code>1 + rate/100</code> to ALL government spending.</p>
<table>
<tr><th>Stat Range</th><th>Rate/Tick</th><th>Label</th></tr>
<tr><td>0&ndash;5</td><td>&lt;0.1%</td><td>Negligible</td></tr>
<tr><td>5&ndash;15</td><td>0.1&ndash;0.5%</td><td>Minimal</td></tr>
<tr><td>15&ndash;30</td><td>0.5&ndash;1.5%</td><td>Stable</td></tr>
<tr><td>30&ndash;45</td><td>1.5&ndash;3%</td><td>Low</td></tr>
<tr><td>45&ndash;60</td><td>3&ndash;5%</td><td>Moderate</td></tr>
<tr><td>60&ndash;75</td><td>5&ndash;8%</td><td>High</td></tr>
<tr><td>75&ndash;100</td><td>8%+</td><td>Hyperinflation</td></tr>
</table>

<h3>The Debt Spiral</h3>
<p>Deficit &rarr; more debt &rarr; higher debt service &rarr; less budget &rarr; larger deficit &rarr; credit rating drops &rarr; higher interest &rarr; repeat.</p>
<p class="guide-tip">Break the spiral early: increase revenue or cut spending to run a surplus. The longer you wait, the harder it gets.</p>
</div></details>

<details><summary>Key Formulas</summary><div>
<h3>Revenue</h3>
<p><code>collection_rate = 0.35 + ((efficiency + (100 - corruption)) / 200) &times; 0.65</code></p>
<p><code>income_tax = GDP &times; (rate/100) &times; 0.55 &times; collection_rate</code></p>
<p><code>sales_tax = GDP &times; (rate/100) &times; 0.35 &times; collection_rate</code></p>
<p><code>corporate_tax = GDP &times; (rate/100) &times; 0.15 &times; collection_rate</code></p>

<h3>Debt</h3>
<p><code>interest = 15% - (credit_rating &times; 0.13%)</code> [clamped 2%&ndash;18%]</p>
<p><code>debt_service = debt &times; interest</code></p>

<h3>GDP Growth</h3>
<p><code>monthly% = ((gdp_growth - 50) / 50) &times; 1</code></p>
<p><code>yearly% = (1 + monthly/100)^12 - 1</code></p>

<h3>Trade</h3>
<p><code>import_dampening = 1 - (tariff_rate / 200)</code></p>
<p><code>export_modifier = min(1.0, stability / 40)</code></p>
<p><code>trade_affinity = max(0, min(100, 50 + diplomatic + treaty + proximity + embargo))</code></p>
</div></details>

<details><summary>Strategic Tips</summary><div>
<h3>Early Game</h3>
<ul>
<li>Don't ignore your budget &mdash; even small deficits compound</li>
<li>Check your collection rate &mdash; invest in efficiency before raising rates</li>
<li>Oil &amp; Gas revenue (if stat &gt; 30) bypasses collection rate entirely</li>
</ul>

<h3>Managing Taxes</h3>
<ul>
<li>Income tax is your biggest lever (40% GDP weight)</li>
<li>Corporate tax is smallest (10%) but directly affects Business Owners</li>
<li>Don't max all taxes &mdash; approval penalty for hikes is 2x the reward for cuts</li>
</ul>

<h3>Managing Debt</h3>
<ul>
<li>Watch Debt-to-GDP, not raw debt &mdash; a large economy sustains more debt</li>
<li>Credit rating 100 = 2% interest. Rating 0 = 18%. That's a 9x difference.</li>
<li>If Debt-to-GDP exceeds 100%, act immediately. At 150%, forced default.</li>
</ul>

<h3>Managing Trade</h3>
<ul>
<li>Below 40 stability, exports are proportionally reduced. At 0, you export nothing.</li>
<li>Tariffs generate revenue but dampen imports</li>
<li>Invest in Technology and Services for long-term growth</li>
</ul>

<h3>The Golden Rule</h3>
<p class="guide-tip"><strong>Run a slight surplus.</strong> Even a small surplus each tick pays down debt, improves credit rating, lowers interest, and gives fiscal breathing room for crises.</p>
</div></details>
`
    },
    nation: {
        title: 'Nation Overview Guide',
        html: `
<details open><summary>What This Page Is</summary><div>
<p>The Nation Overview is your country's dashboard &mdash; a snapshot of every national statistic, historical trends, active laws and crises, and what's driving each number up or down.</p>

<h3>Header Area</h3>
<ul>
<li><strong>Nation name &amp; flag</strong> &mdash; Your country's identity</li>
<li><strong>Current game date</strong> &mdash; Derived from the shard tick (1 tick = 1 in-game month, starting Jan Year 1)</li>
<li><strong>Revolution banner</strong> &mdash; Appears in red when revolution risk is critically high</li>
</ul>

<h3>Featured Cards</h3>
<p>Three stats get special large-format cards at the top of the page:</p>
<ul>
<li><strong>GDP Growth</strong> &mdash; The headline economic indicator</li>
<li><strong>Inflation</strong> &mdash; Monetary health</li>
<li><strong>National Debt</strong> &mdash; Fiscal position</li>
</ul>
</div></details>

<details><summary>The 14 National Statistics</summary><div>
<p>Stats are grouped into themed, collapsible sections:</p>
<table>
<tr><th>Section</th><th>Stats</th></tr>
<tr><td><strong>Economy</strong></td><td>GDP Growth, Inflation, Unemployment, National Debt</td></tr>
<tr><td><strong>Society</strong></td><td>Healthcare, Education, Crime Rate, Poverty Rate</td></tr>
<tr><td><strong>Governance</strong></td><td>Corruption, Political Stability, Infrastructure</td></tr>
<tr><td><strong>Global</strong></td><td>International Reputation, Environmental Index</td></tr>
<tr><td><strong>Security</strong></td><td>Revolution Risk</td></tr>
</table>

<h3>Stat Ranges</h3>
<table>
<tr><th>Stat</th><th>Range</th><th>Notes</th></tr>
<tr><td>Most stats</td><td>0 &ndash; 100</td><td>Healthcare, Education, Infrastructure, etc.</td></tr>
<tr><td>GDP Growth</td><td>Can go negative</td><td>Below 50 = recession</td></tr>
<tr><td>Inflation</td><td>Can go negative</td><td>Deflation possible</td></tr>
<tr><td>National Debt</td><td>0 &ndash; 200+</td><td>As % of GDP</td></tr>
<tr><td>Revolution Risk</td><td>0 &ndash; 100</td><td>Triggers revolution event at very high values</td></tr>
</table>
</div></details>

<details><summary>Reading a Stat Card</summary><div>
<p>Each stat card displays four pieces of information:</p>
<table>
<tr><th>Element</th><th>What It Shows</th></tr>
<tr><td><strong>Current Value</strong></td><td>The live number (e.g. &ldquo;4.2% GDP Growth&rdquo;)</td></tr>
<tr><td><strong>Ranking Pip</strong></td><td>Colored dot showing where you stand relative to other nations</td></tr>
<tr><td><strong>Sparkline Chart</strong></td><td>Inline trend graph of the last ~12 ticks of history</td></tr>
<tr><td><strong>&ldquo;Affected By&rdquo; Panel</strong></td><td>Expandable section listing everything pushing that stat up or down</td></tr>
</table>

<h3>Ranking Pip Colors</h3>
<ul>
<li><span style="color:#5cb85c;">&bull;</span> <strong>Green</strong> = Top third of all nations</li>
<li><span style="color:#d48a3c;">&bull;</span> <strong>Amber</strong> = Middle third</li>
<li><span style="color:#d9534f;">&bull;</span> <strong>Red</strong> = Bottom third</li>
</ul>

<p class="guide-tip">Click any stat card to expand its &ldquo;Affected By&rdquo; breakdown &mdash; this is the most important analytical feature on the page.</p>
</div></details>

<details><summary>The &ldquo;Affected By&rdquo; System</summary><div>
<p>Expanding a stat card reveals every force currently pushing that stat up or down. Each influence shows its <strong>source name</strong>, <strong>direction</strong> (positive/negative), and <strong>magnitude</strong>.</p>

<h3>Sources of Influence</h3>
<table>
<tr><th>#</th><th>Source</th><th>How It Works</th></tr>
<tr><td>1</td><td><strong>Active Laws</strong></td><td>Laws passed by parliament with defined stat effects (e.g. &ldquo;Universal Healthcare Act: Healthcare +3, Debt +1&rdquo;)</td></tr>
<tr><td>2</td><td><strong>Active Crises</strong></td><td>Ongoing crises that penalize stats (e.g. &ldquo;Banking Crisis: GDP &minus;2, Unemployment +1.5&rdquo;)</td></tr>
<tr><td>3</td><td><strong>Ministry Actions</strong></td><td>Executive actions by the Head of Government. Effects decay over time.</td></tr>
<tr><td>4</td><td><strong>Diplomatic Actions</strong></td><td>Effects from treaties, trade agreements, and other diplomatic activity</td></tr>
<tr><td>5</td><td><strong>Presidential Influence</strong></td><td>The sitting president's ideology and trait nudge stats in certain directions</td></tr>
<tr><td>6</td><td><strong>HoG Trait</strong></td><td>The Head of Government's leader trait provides passive stat bonuses/penalties</td></tr>
<tr><td>7</td><td><strong>Stat Connections</strong></td><td>Second-order effects &mdash; stats influence each other (e.g. high crime lowers stability)</td></tr>
<tr><td>8</td><td><strong>Stat Decay</strong></td><td>Stats drift toward baseline over time. Extreme values decay faster.</td></tr>
</table>

<p class="guide-tip">Laws are the primary lever &mdash; most stat movement comes from active legislation. Check what's already influencing a stat before proposing new laws to stack effects.</p>
</div></details>

<details><summary>How Stats Change (The Tick System)</summary><div>
<p>Every <strong>game tick</strong>, the advance-tick function runs and, for each nation:</p>
<ol>
<li>Collects all active law effects</li>
<li>Collects all active crisis effects</li>
<li>Collects ministry action effects (with time decay)</li>
<li>Collects diplomatic effects</li>
<li>Calculates stat-to-stat connections</li>
<li>Applies natural decay toward baseline</li>
<li>Sums everything as a <strong>delta</strong> per stat</li>
<li>Applies the delta to current values</li>
<li>Clamps results to valid ranges</li>
<li>Writes new values and a historical snapshot</li>
</ol>

<h3>Key Relationships</h3>
<ul>
<li><strong>Laws are the primary lever</strong> &mdash; Most stat movement comes from active legislation</li>
<li><strong>Crises are the primary threat</strong> &mdash; Penalties persist until resolved (via laws or ministry actions)</li>
<li><strong>Ministry actions are temporary</strong> &mdash; Effects decay over several ticks, unlike laws which persist until repealed</li>
<li><strong>Stats influence each other</strong> &mdash; You can't fix crime without addressing poverty and education; you can't grow GDP while corruption is high</li>
<li><strong>Decay prevents stagnation</strong> &mdash; Even good stats slowly decline without active maintenance</li>
</ul>

<p class="guide-tip">Stat decay means you need ongoing policy to maintain extreme positions. A single law isn't enough &mdash; keep legislating.</p>
</div></details>

<details><summary>Interactive Features</summary><div>
<h3>Section Collapse / Expand</h3>
<p>Click any section header to toggle its visibility. This lets you focus on the stat categories that matter to you.</p>

<h3>Sparkline Charts</h3>
<p>Small inline trend graphs in each stat card, showing approximately the last 12 ticks of history. Use these to spot trends at a glance &mdash; a downward slope means existing policies aren't enough.</p>

<h3>Stat Detail View</h3>
<p>Click a stat card to expand the &ldquo;Affected By&rdquo; panel below it, revealing the full breakdown of influences on that stat.</p>
</div></details>

<details><summary>Strategic Tips</summary><div>
<h3>Identify Weak Spots</h3>
<p>Look for stats with <span style="color:#d9534f;">&bull;</span> red ranking pips &mdash; these are in the bottom third of all nations. Proposing laws that address weak stats will resonate with voter blocs who care about those issues.</p>

<h3>Use &ldquo;Affected By&rdquo; Before Legislating</h3>
<p>Before proposing a law, check what's already influencing the stat you want to change. Stacking effects in the same direction compounds results. Counteracting existing negatives is often more impactful than boosting already-strong stats.</p>

<h3>Watch Sparkline Trends</h3>
<ul>
<li><strong>Downward slope</strong> &mdash; Existing policies aren't enough, new action needed</li>
<li><strong>Flat line after your law</strong> &mdash; It's working, but barely offsetting decay and other forces</li>
<li><strong>Upward slope</strong> &mdash; Your policies are winning; maintain course</li>
</ul>

<h3>Critical Thresholds</h3>
<table>
<tr><th>Stat</th><th>Danger Zone</th><th>What Happens</th></tr>
<tr><td>Revolution Risk</td><td>~70+</td><td>Nation is in danger of revolution. Prioritize stability and crisis management.</td></tr>
<tr><td>National Debt</td><td>150%+ of GDP</td><td>Sovereign default. Drags down GDP and triggers economic crises.</td></tr>
<tr><td>Political Stability</td><td>&lt;20</td><td>Governance breakdown, compounding other problems</td></tr>
<tr><td>Political Stability</td><td>0</td><td>Failed State. Services collapse, lawlessness spreads, international isolation. Persists until stability reaches 15.</td></tr>
</table>

<p class="guide-tip">National Debt is the silent killer. Many popular laws increase debt. If it spirals, it drags GDP and triggers crises that are hard to escape.</p>
</div></details>
`
    },
    government: {
        title: 'Government Guide',
        html: `
<details open><summary>Parliamentary System</summary><div>
<h3>How It Works</h3>
<p>In a parliamentary system, executive power flows from the legislature. Your party wins seats, builds a coalition, and earns the right to form a government. The Prime Minister serves at the pleasure of parliament. Lose your majority and you lose power.</p>

<h3>The Parliament</h3>
<p>Parliament is the central institution. Every party holds seats proportional to their vote share at the last election. Seats determine which bills pass, who forms government, and whether the PM survives.</p>
<p>Seat counts update immediately when:</p>
<ul>
<li>An election is held and results are certified</li>
<li>A party is kicked from the nation &mdash; their seats redistribute proportionally to all remaining parties right away</li>
<li>A snap election is triggered</li>
</ul>

<h3>The Coalition</h3>
<p>No single party typically holds a majority. To govern, parties form a coalition &mdash; a formal agreement to vote together and share cabinet positions. A coalition is stable when it controls more than 50% of seats.</p>
<p class="guide-tip">Coalition status is visible to all players. A coalition below 50% is a minority government &mdash; every bill becomes a negotiation.</p>

<h3>Forming a Government</h3>
<p>After an election, the leader of the largest party gets the first opportunity to form government. They have a defined number of ticks to secure a coalition. If they fail, the opportunity passes to the next largest party.</p>
<p>The PM is formally confirmed when they demonstrate majority support in a <strong>confidence vote</strong>. Until that vote passes, they are a caretaker PM with a limited action set.</p>

<h3>Confidence Votes</h3>
<p>Any party can call a confidence vote for <strong>5 AP</strong>. It passes when more than 50% of <em>all seated MPs</em> vote in favor &mdash; not just a majority of votes cast. The voting window is 6 ticks, and there is a 6-tick cooldown between confidence votes.</p>
<table>
<tr><th>Result</th><th>Effect</th></tr>
<tr><td><strong>Win</strong></td><td>Government stability +5, opposition loses 2 momentum</td></tr>
<tr><td><strong>Lose</strong></td><td>PM resigns, caretaker government formed, coalition negotiation restarts</td></tr>
</table>

<h3>Cabinet</h3>
<p>The PM appoints cabinet ministers. In a coalition government, seats are distributed between partners roughly proportional to seat share. Refusing to give a partner cabinet seats risks breaking the coalition.</p>
<p>Each ministry produces ongoing stat effects based on minister performance and funding level. Ministers can be dismissed by the PM at any time for 1 AP. Dismissing a coalition partner's minister without warning may trigger a coalition collapse.</p>

<h3>Acting Ministers</h3>
<p>If a ministry is vacant, the PM can appoint an <strong>Acting Minister</strong> by directive. Acting ministers provide 50% of a confirmed minister's stat bonus. If a confirmation vote for that ministry failed during this administration, appointing an acting minister grants <strong>+1 Government Approval</strong>. If no vote was held, it costs <strong>&minus;1 Government Approval</strong>. Maximum 3 acting ministers at any time.</p>

<h3>Passing Legislation</h3>
<ol>
<li>Bill sponsor submits to Committee (2 AP). All parties can add or remove articles.</li>
<li>Sponsor sends the bill to the floor for a vote.</li>
<li>Each party votes Yes, No, or Abstain. Votes weighted by seat count.</li>
<li>Bill passes if more than 50% of seated votes are Yes (quorum: 50% of seats must participate). If not reached within 6 ticks, the bill fails.</li>
<li>Passed bills take effect at the start of the next tick.</li>
</ol>
<p class="guide-tip">There is no presidential veto in a parliamentary system. A bill that passes the floor becomes law.</p>

<h3>Whipping</h3>
<p>Party whips can spend <strong>2 AP</strong> to whip their members on a specific bill, locking the party's vote. Unwhipped parties may vote independently based on ideological alignment with the bill's content.</p>

<h3>Elections</h3>
<p>Elections are scheduled at fixed intervals but can be triggered early by:</p>
<ul>
<li>A failed confidence vote</li>
<li>The PM calling a snap election (3 AP &mdash; a gamble on strong polling)</li>
<li>A constitutional crisis event</li>
</ul>
<p><strong>Vote share</strong> is determined by: ideological proximity (party position on 5 axes vs. population center) and performance voting (governance quality since last election).</p>
<p>After an election, the largest party gets first right to form a coalition. They have 3 ticks. If they can't reach 50%, the next largest party gets a turn.</p>

<h3>Losing Power</h3>
<table>
<tr><th>Method</th><th>What Happens</th></tr>
<tr><td><strong>Failed confidence vote</strong></td><td>PM resigns immediately. Caretaker government until new coalition forms.</td></tr>
<tr><td><strong>Coalition collapses</strong></td><td>If government falls below 50% seats, confidence vote triggers automatically.</td></tr>
<tr><td><strong>Lost election</strong></td><td>Largest party gets first right to form government. You enter opposition.</td></tr>
<tr><td><strong>Party dissolved</strong></td><td>Seats redistribute, you lose all government positions.</td></tr>
</table>
</div></details>

<details><summary>Presidential System</summary><div>
<h3>How It Works</h3>
<p>Executive and legislative power are separated. The President is elected independently and serves a fixed term. They cannot be removed by parliamentary vote &mdash; only by impeachment or term end. This creates the possibility of <strong>divided government</strong>: a President from one party, a parliament controlled by another.</p>

<h3>Winning the Presidency</h3>
<p>Won through a direct election on a separate cycle from legislative elections. Presidential elections are winner-takes-all &mdash; a small party can hold the presidency while being a minority in the legislature.</p>

<h3>What the President Controls</h3>
<ul>
<li><strong>Cabinet appointments</strong> &mdash; Nominates all ministers (requires senate confirmation)</li>
<li><strong>Bill signing and veto</strong> &mdash; All bills must go to the President's desk</li>
<li><strong>Executive orders</strong> &mdash; Act by decree without parliamentary approval (with AP cost and approval penalties)</li>
<li><strong>Non-cabinet appointments</strong> &mdash; Central Bank Governor, Director of Intelligence</li>
<li><strong>Diplomatic actions</strong> &mdash; Treaty ratification, international org entry/exit, foreign recognition</li>
</ul>

<h3>Cabinet Nominations</h3>
<p>The President nominates a candidate for each ministry. Nominations go to a senate confirmation vote, weighted by seat share. Passes with more than 50% support.</p>
<p><strong>Failed nominations:</strong> The ministry re-opens. The party whose nominee was rejected is barred from that same seat for the remainder of the game. The President may have to appoint ministers from opposition parties.</p>

<h3>Acting Ministers (Presidential)</h3>
<p>The President can appoint an Acting Minister by Executive Order. Acting ministers work at <strong>50% effectiveness</strong>. If the senate confirmation vote for that ministry failed, appointing an acting minister grants <strong>+1 Government Approval</strong>. If no confirmation vote was held, it costs <strong>&minus;1 Government Approval</strong>. Maximum 3 at any time.</p>

<h3>Signing and Vetoing Bills</h3>
<p>All bills passed by the legislature go to the President's desk. The President has <strong>6 ticks</strong> to act:</p>
<table>
<tr><th>Action</th><th>Effect</th></tr>
<tr><td><strong>Sign</strong></td><td>Bill takes effect next tick</td></tr>
<tr><td><strong>Veto</strong></td><td>Returned to parliament. Requires 2/3 supermajority to override.</td></tr>
<tr><td><strong>Pocket (do nothing)</strong></td><td>Bill auto-signs after 6 ticks</td></tr>
</table>
<p class="guide-tip">A veto override requires 2/3 of all seated votes. If override fails, the bill is dead and cannot be resubmitted for 3 ticks.</p>

<h3>Executive Orders</h3>
<table>
<tr><th>Order</th><th>AP Cost</th><th>Details</th></tr>
<tr><td>Acting Minister Appointment</td><td>3 AP</td><td>Bypass senate confirmation (max 3 at a time)</td></tr>
<tr><td>Presidential Tax Adjustment (&plusmn;3% on one tax type)</td><td>2&ndash;4 AP</td><td>3-tick cooldown per tax type</td></tr>
<tr><td>Emergency Price Controls (freeze fuel prices for 3 ticks)</td><td>4 AP</td><td>4-tick cooldown between uses</td></tr>
<tr><td>Declaration of National Emergency</td><td>4 AP</td><td>Emergency powers until manually ended; 8-tick cooldown</td></tr>
<tr><td>Presidential Censure (condemn rival party)</td><td>1 AP</td><td>&minus;8 momentum (or &minus;16 if repeated within 5 ticks)</td></tr>
<tr><td>Stimulate the Economy</td><td>3 AP</td><td>Ideology-flavored order; each usable once per presidential term</td></tr>
</table>

<h3>Stimulus Orders</h3>
<p>Each ideology axis offers 2 unique economic orders. Once used, it cannot be reused during the same presidential term. Each order boosts some stats while reducing others, reflecting ideological trade-offs.</p>
<table>
<tr><th>Ideology</th><th>Orders</th></tr>
<tr><td><strong>Individualism</strong></td><td>Small Business Deregulation, Capital Gains Tax Holiday</td></tr>
<tr><td><strong>Collectivism</strong></td><td>Federal Jobs Program, Wage Floor for Federal Contractors</td></tr>
<tr><td><strong>Nationalism</strong></td><td>Buy Local Procurement, Export Control on Strategic Resources</td></tr>
<tr><td><strong>Globalism</strong></td><td>Fast-Track Foreign Investment Zones, Tariff Suspension</td></tr>
<tr><td><strong>Equality</strong></td><td>Minority Business Lending Directive, Pay Transparency</td></tr>
<tr><td><strong>Liberty</strong></td><td>Regulatory Moratorium, Federal Licensing Reform</td></tr>
<tr><td><strong>Progress</strong></td><td>Green Infrastructure Fast-Track, AI &amp; Automation Workforce Initiative</td></tr>
<tr><td><strong>Tradition</strong></td><td>Domestic Energy Unleashing, Manufacturing Revival</td></tr>
<tr><td><strong>Security</strong></td><td>Critical Infrastructure Investment, Anti-Fraud &amp; Black Market Crackdown</td></tr>
<tr><td><strong>Freedom</strong></td><td>Crypto &amp; Fintech Deregulation, Open Data &amp; Digital Commons</td></tr>
</table>

<h3>The Overreach Bar</h3>
<p>Every executive order contributes to the Overreach Bar &mdash; a public counter tracking orders issued in the last 8 ticks.</p>
<table>
<tr><th>Orders (8 ticks)</th><th>Effect</th></tr>
<tr><td>0&ndash;1</td><td>Normal. No penalty.</td></tr>
<tr><td>2&ndash;3</td><td>&ldquo;Governing by Decree&rdquo; label. Approval penalty per tick.</td></tr>
<tr><td>4+</td><td>&ldquo;Authoritarian Drift&rdquo; label. Severe approval penalty per tick. Opposition can call joint motion to strip executive powers.</td></tr>
</table>
<p class="guide-tip">Use executive orders sparingly. The Overreach Bar is visible to all players and can trigger impeachment proceedings.</p>

<h3>Divided Government</h3>
<p>When the President's party doesn't control a majority in the legislature, every bill is a negotiation. Strategies:</p>
<ul>
<li>Negotiate amendments with opposition to get bills across the line</li>
<li>Use executive orders sparingly for the most urgent priorities</li>
<li>Court swing parties with AP actions and coalition offers</li>
<li>Campaign hard for seats in the next legislative election</li>
</ul>

<h3>Impeachment</h3>
<p>Two-stage process: first a majority vote to begin proceedings, then a 2/3 supermajority to convict. At least one charge must be filed, and each charge has specific preconditions:</p>
<table>
<tr><th>Charge</th><th>Requirement</th></tr>
<tr><td><strong>Abuse of Power</strong></td><td>Presidential overreach &ge; 4</td></tr>
<tr><td><strong>Corruption</strong></td><td>Nation corruption stat &ge; 40</td></tr>
<tr><td><strong>Gross Incompetence</strong></td><td>Gov approval &le; 25 for 6 consecutive ticks</td></tr>
<tr><td><strong>Constitutional Violation</strong></td><td>&ge; 2 vetoed bills that had &frac23; legislative support</td></tr>
<tr><td><strong>Criminal Conduct</strong></td><td>Corruption &ge; 30 AND judicial independence &le; 35</td></tr>
</table>
<p class="guide-tip">If no charges meet their requirements, impeachment cannot be filed. The president's leader traits can modify the AP cost.</p>
<table>
<tr><th>Result</th><th>Effect</th></tr>
<tr><td><strong>Survives</strong></td><td>Legitimacy +6 (persecution narrative)</td></tr>
<tr><td><strong>Convicted</strong></td><td>Immediate removal. Party loses &minus;12 approval globally.</td></tr>
</table>

<h3>Non-Cabinet Positions</h3>
<table>
<tr><th>Position</th><th>Powers</th></tr>
<tr><td><strong>Governor, Central Bank</strong></td><td>Monetary policy: interest rates, quantitative easing/tightening, currency intervention</td></tr>
<tr><td><strong>Director, Intelligence Bureau</strong></td><td>Covert surveillance, disinformation campaigns, counterintelligence defense</td></tr>
</table>
<p class="guide-tip">A vacant Intelligence Bureau means rival nations can surveil you freely with no defense.</p>

<h3>Losing Power (Presidential)</h3>
<ul>
<li><strong>Lost presidential election</strong> &mdash; Lose presidency at term end. Party retains legislative seats.</li>
<li><strong>Impeachment conviction</strong> &mdash; Immediate removal. 2/3 supermajority required. Party loses &minus;12 approval.</li>
<li><strong>Overreach consequences</strong> &mdash; Sustained abuse can trigger a parliamentary motion to strip presidential powers.</li>
</ul>
</div></details>

<details><summary>Autocratic System &mdash; Five Pillars</summary><div>
<h3>How It Works</h3>
<p>Autocracy replaces elections with internal power struggles. A <strong>Strongman</strong> leads the regime, and four factions each control one of the <strong>Five Pillars of Power</strong>. The fifth pillar &mdash; the Wildcard &mdash; is always unclaimed and decays over time.</p>

<h3>The Five Pillars</h3>
<table>
<tr><th>Pillar</th><th>Actions</th><th>Passive Drift Triggers</th></tr>
<tr><td><strong>Military</strong></td><td>Deploy, Stand Down, Military Exercises</td><td>Civil Unrest &le; 20, Crime Rate &le; 20</td></tr>
<tr><td><strong>Party</strong></td><td>Rally, Agitate, Party Congress</td><td>Stability &ge; 70, Polarization &ge; 70</td></tr>
<tr><td><strong>Oligarchs</strong></td><td>Patronage, Capital Flight, Bribe</td><td>GDP Growth &ge; 70, Corruption &ge; 70</td></tr>
<tr><td><strong>Media</strong></td><td>Broadcast, Smear, Blackout</td><td>Press Freedom &le; 20, Legitimacy &ge; 70</td></tr>
<tr><td><strong>Security</strong></td><td>Surveillance, Blackmail, Disappear</td><td>Crime Rate &le; 20, Freedom Index &le; 20</td></tr>
</table>

<h3>Backing (0&ndash;20)</h3>
<p>Each pillar has a Backing value (0&ndash;20). Backing is <strong>zero-sum</strong>: gaining Backing on one pillar reduces all others proportionally. Sources of Backing change:</p>
<ul>
<li><strong>Actions</strong> &mdash; Most actions increase your pillar&rsquo;s Backing</li>
<li><strong>Passive Drift</strong> &mdash; National stats can trigger +1 Backing per tick</li>
<li><strong>Neglect</strong> &mdash; Pillar Backing &le; 3 for 5+ consecutive ticks: extra -1 decay</li>
<li><strong>Wildcard Decay</strong> &mdash; The unclaimed pillar loses &minus;0.1 per tick (floor 0)</li>
</ul>

<h3>Dual Mode Actions</h3>
<p>Most actions can be used in two modes:</p>
<table>
<tr><th>Mode</th><th>Effect on Tracker</th></tr>
<tr><td><strong>FOR REGIME</strong></td><td>Tracker decreases (stabilizes regime)</td></tr>
<tr><td><strong>FOR YOURSELF</strong></td><td>Tracker increases (destabilizes regime)</td></tr>
</table>
<p><strong>Stand Down</strong> is always FOR YOURSELF. <strong>Agitate</strong> and <strong>Capital Flight</strong> contribute at half power in regime mode.</p>

<h3>The Tracker (0&ndash;100)</h3>
<p>The regime stability tracker. Only the Strongman sees the exact word:</p>
<table>
<tr><th>Range</th><th>Word</th><th>Meaning</th></tr>
<tr><td>0&ndash;20</td><td>IRON</td><td>Regime is rock solid</td></tr>
<tr><td>21&ndash;40</td><td>FIRM</td><td>Stable but watchful</td></tr>
<tr><td>41&ndash;60</td><td>RESTLESS</td><td>Discontent growing</td></tr>
<tr><td>61&ndash;80</td><td>VOLATILE</td><td>Regime is fragile</td></tr>
<tr><td>81&ndash;100</td><td>CRITICAL</td><td>Coup is imminent</td></tr>
</table>
<p>The tracker naturally decays toward 30 each tick (+1 or &minus;1).</p>

<h3>Power Level (1&ndash;5)</h3>
<p>Each faction has a hidden Power level that determines the magnitude of tracker contributions:</p>
<p><code>base = CEIL(backing / 4) + FLOOR(ministers / 2) + (is_pm ? 1 : 0) + (longevity &ge; 36 ticks ? 1 : 0)</code></p>
<table>
<tr><th>Power</th><th>Tracker &Delta;</th></tr>
<tr><td>1</td><td>&pm;2</td></tr>
<tr><td>2</td><td>&pm;3</td></tr>
<tr><td>3</td><td>&pm;4</td></tr>
<tr><td>4</td><td>&pm;5</td></tr>
<tr><td>5</td><td>&pm;7</td></tr>
</table>

<h3>Strongman Exclusives</h3>
<p>Only the Strongman (ruling faction) can use:</p>
<ul>
<li><strong>Arrest Leader</strong> &mdash; Detain a faction leader. Costs 3 AP.</li>
<li><strong>Execute Leader</strong> &mdash; Kill an arrested leader. Permanent. Pillar becomes Wildcard.</li>
<li><strong>Release Leader</strong> &mdash; Free a detained leader.</li>
<li><strong>Favor</strong> &mdash; Grant favour to a faction (+Backing, +Loyalty).</li>
<li><strong>Emergency Decree</strong> &mdash; Issue decree for immediate stat effects.</li>
<li><strong>Appoint/Revoke Successor</strong> &mdash; Designate an heir for succession.</li>
</ul>
<p>The Strongman can only use their own foundation pillar actions (no tracker movement).</p>

<h3>Coup Types</h3>
<table>
<tr><th>Type</th><th>Who</th><th>How</th></tr>
<tr><td><strong>Standard Coup</strong></td><td>Any non-Strongman</td><td>Roll + Backing bonus vs threshold. Success = seize power.</td></tr>
<tr><td><strong>Putsch</strong></td><td>Military pillar only</td><td>Declare martial law. Strongman must respond (decree or appeal to security).</td></tr>
<tr><td><strong>Silent Coup</strong></td><td>Security pillar only</td><td>Multi-phase. Security approaches other factions with offers. If enough accept, vote resolves the coup.</td></tr>
</table>

<h3>Coup Outcomes</h3>
<table>
<tr><th>Result</th><th>Tracker Reset</th><th>Effect</th></tr>
<tr><td>Dominant</td><td>&rarr; 30</td><td>+5 Stability, -5 Unrest. Strongman purged.</td></tr>
<tr><td>Clean</td><td>&rarr; 30</td><td>Normal transfer of power.</td></tr>
<tr><td>Pyrrhic</td><td>&rarr; 30</td><td>Win but weakened. Other factions can counter-coup for 3 ticks.</td></tr>
<tr><td>Failure</td><td>&rarr; 10</td><td>Faction Backing zeroed. Leader may be arrested.</td></tr>
<tr><td>Catastrophic</td><td>&rarr; 10</td><td>Backing zeroed, leader arrested, pillar becomes Wildcard.</td></tr>
</table>

<h3>Succession</h3>
<p>When the Strongman dies:</p>
<ul>
<li><strong>With designated successor</strong> &mdash; Successor takes power immediately.</li>
<li><strong>Without successor</strong> &mdash; Highest-Backing faction auto-coups at +20 bonus. If that fails, Democratic Revolution triggers immediately.</li>
</ul>

<h3>Leader Lifecycle</h3>
<ul>
<li>Leaders age +1 year every 12 ticks</li>
<li>Death age: randomized 75&ndash;85 at leader creation</li>
<li>When a leader dies: their pillar becomes the Wildcard, a new leader is auto-generated who claims the old Wildcard pillar</li>
</ul>

<h3>Democratic Revolution</h3>
<p>Triggered when <strong>Stability &lt; 20 AND Civil Unrest &gt; 50</strong> (autocracies only).</p>
<ol>
<li><strong>WARNING</strong> &mdash; Random 13&ndash;22 tick timer starts. No stat effects on first tick.</li>
<li><strong>ESCALATION</strong> &mdash; Each tick: stability &minus;1, civil unrest +1, international reputation &minus;1.</li>
<li><strong>AVERTABLE</strong> &mdash; Break either condition to cancel the revolution.</li>
<li><strong>REVOLUTION FIRES</strong> &mdash; Government converts to Democracy (50% Parliamentary, 50% Presidential). Emergency election in 3 ticks.</li>
</ol>
<p class="guide-tip">Revolution is the endgame for a mismanaged autocracy. Watch stability and unrest closely &mdash; once the timer starts, you have limited time to act.</p>
</div></details>

<details><summary>Ministry Actions</summary><div>
<h3>Overview</h3>
<p>Some ministries have special actions that the ruling party can activate. These actions produce stat effects over time, with a delay before effects begin and a duration over which they apply. Each action has an escalating AP cost based on how many times it has been used recently.</p>

<h3>Use-Count Scaling</h3>
<p>Positive effects diminish with repeated use, while negative side effects remain at full strength. AP costs also escalate:</p>
<table>
<tr><th>Use Count</th><th>Positive Effect Scale</th><th>Negative Effects</th></tr>
<tr><td>0 (first use)</td><td>100%</td><td>100%</td></tr>
<tr><td>1</td><td>70%</td><td>100%</td></tr>
<tr><td>2</td><td>40%</td><td>100%</td></tr>
<tr><td>3+</td><td>15%</td><td>100%</td></tr>
</table>

<h3>Interior Ministry Actions</h3>
<table>
<tr><th>Action</th><th>AP Cost (by use)</th><th>Delay</th><th>Duration</th><th>Effects</th></tr>
<tr><td><strong>Enforce Public Order</strong></td><td>2 / 3 / 5 / 8</td><td>1 tick</td><td>4 ticks</td><td>Crime &minus;2, Incarceration +3, Happiness &minus;2, Social Mobility &minus;1</td></tr>
<tr><td><strong>Community Outreach</strong></td><td>1 / 2 / 3 / 4</td><td>3 ticks</td><td>8 ticks</td><td>Happiness +2, Crime &minus;1, Std of Living +1</td></tr>
<tr><td><strong>Surveillance Expansion</strong></td><td>2 / 4 / 7 / 11</td><td>2 ticks</td><td>10 ticks</td><td>Crime &minus;5, Happiness &minus;2, Digital Infra +2, Std of Living &minus;1</td></tr>
</table>
<p class="guide-tip">Community Outreach is slow but sustainable with no downsides. Surveillance Expansion has permanent residue penalties that compound with each use. Choose your approach wisely.</p>
</div></details>

<details><summary>Protests</summary><div>
<h3>Overview</h3>
<p>Parties can organize protests to pressure the government. Protests have 7 tiers, with higher tiers causing greater national impact. Repeated protests escalate AP costs and can trigger crises at the highest tiers.</p>

<h3>AP Costs</h3>
<p>Protest costs escalate with a party's use count: <strong>2 / 3 / 5 / 7 / 10 AP</strong>. The use counter decays by 1 for every 12 ticks without protesting.</p>

<h3>Cooldowns</h3>
<ul>
<li><strong>Calling party:</strong> 12-tick cooldown after a protest resolves</li>
<li><strong>Endorsing party:</strong> 6-tick cooldown</li>
</ul>

<h3>Joint Protests</h3>
<p>Other parties can endorse a protest for a bonus of +15 turnout per endorsing party (cap: +30). Endorsements also give +15 to the turnout roll.</p>

<h3>Protest Fatigue</h3>
<p>Each protest in the last 6 ticks imposes a &minus;10 penalty to protest score. Over-protesting makes each successive protest weaker.</p>

<h3>Backfire (Tiers 1&ndash;2)</h3>
<p><strong>Tier 1 &mdash; Embarrassing Backfire:</strong> The organising party loses &minus;10 Visibility, &minus;7 Approval, and &minus;12 Enthusiasm. If government approval is 45+, the government may gain up to +3 approval.</p>
<p><strong>Tier 2 &mdash; Protests Don't Materialise:</strong> The organising party loses &minus;4 Visibility, &minus;3 Approval, and &minus;5 Enthusiasm. Government may still gain up to +3 approval.</p>

<h3>Crisis Tiers</h3>
<table>
<tr><th>Tier</th><th>Duration</th><th>Effects per Tick</th></tr>
<tr><td><strong>Tier 6</strong></td><td>6 ticks</td><td>Gov Approval &minus;2, Civil Unrest +2, Happiness &minus;1. After tick 3: Political Violence +1</td></tr>
<tr><td><strong>Tier 7</strong></td><td>6 ticks</td><td>Gov Approval &minus;3, Civil Unrest +3, GDP Growth &minus;0.2, Foreign Investment &minus;2, Political Violence +1</td></tr>
</table>
<p>Tier 7 protests also generate a <strong>demand</strong> &mdash; a specific stat target the government must meet within 6 ticks or face further consequences.</p>

<h3>Responses to Protests</h3>
<table>
<tr><th>Action</th><th>AP Cost</th><th>Details</th></tr>
<tr><td><strong>Public Address</strong></td><td>1 AP</td><td>3-tick cooldown. Available to the ruling party to address protest grievances.</td></tr>
<tr><td><strong>Enforce Public Order</strong></td><td>2 AP</td><td>Deploy law enforcement against a Tier 6+ crisis (33% success chance).</td></tr>
<tr><td><strong>National Emergency</strong></td><td>5 AP</td><td>Declare emergency in response to a Tier 7 crisis.</td></tr>
</table>

<h3>Unresolved Grievances</h3>
<p>Protests that were never adequately addressed carry a <strong>&minus;5 penalty</strong> at the next election for the governing party.</p>
<p class="guide-tip">Protests are a double-edged sword. Fizzled protests hurt the organizer, but successful ones can spiral into crises that destabilize the government.</p>
</div></details>

<details><summary>Defense Doctrines</summary><div>
<h3>Overview</h3>
<p>The Ministry of Defense can announce military doctrines across 5 sectors. Doctrines shape your nation's military posture and are visible to other nations (except hidden doctrines). Announcing a doctrine costs AP and adds to your nation's <strong>Doctrine Cohesion</strong> score.</p>

<h3>Sectors</h3>
<table>
<tr><th>Sector</th><th>Examples</th></tr>
<tr><td><strong>Army</strong></td><td>Active Defense, Counterinsurgency, Asymmetric Warfare, Combined Battle, Joint Command Operations</td></tr>
<tr><td><strong>Navy</strong></td><td>Blue-Water Navy, Coastal Defense, Maritime Interdiction</td></tr>
<tr><td><strong>Air Force</strong></td><td>Air Superiority, Close Air Support, Strategic Airlift</td></tr>
<tr><td><strong>Intelligence</strong></td><td>Signals Intelligence, Human Intelligence, Cyber Operations</td></tr>
<tr><td><strong>Nuclear</strong></td><td>No First Use, Flexible Response, Launch on Warning, Minimum Deterrence</td></tr>
</table>

<h3>Key Rules</h3>
<ul>
<li>Most sectors allow multiple active doctrines simultaneously</li>
<li><strong>Nuclear</strong> is single-select &mdash; only one nuclear doctrine can be active at a time</li>
<li>Landlocked nations cannot adopt Navy doctrines</li>
<li>Some doctrines are autocracy-only (e.g., Praetorian Doctrine)</li>
<li>Nuclear doctrines enter a <strong>pending</strong> state before becoming active</li>
</ul>

<h3>Cohesion</h3>
<p>Doctrine Cohesion (max 200) represents how well your military doctrines integrate. Higher cohesion improves defense effectiveness.</p>

<h3>Renouncing</h3>
<p>Doctrines can be renounced, but there is a cooldown of 120 ticks before the same doctrine can be re-announced.</p>
<p class="guide-tip">Doctrines are long-term strategic commitments. Choose doctrines that complement your nation's geography, resources, and diplomatic posture.</p>
</div></details>
`
    },
    events: {
        title: 'Events Guide',
        html: `
<details open><summary>What is CIVIC?</summary><div>
<p>CIVIC is the <strong>Public Discourse Network</strong> for your nation &mdash; a social feed where game events are reported and discussed by AI-generated citizen personas.</p>
<p>Every major political event (elections, crises, bills, coups, cabinet changes) is transformed into social posts by randomized citizen accounts. This gives you a live pulse of what&rsquo;s happening in your nation.</p>
</div></details>

<details><summary>Post Types</summary><div>
<table>
<tr><th>Type</th><th>Description</th></tr>
<tr><td><strong>System Posts</strong></td><td>Auto-generated from game events. Have a blue left border and event tag badge (ELECTION, CRISIS, BILL, etc). Multiple perspectives per event.</td></tr>
<tr><td><strong>Player Posts</strong></td><td>Written by you and other players. Can receive comments and real likes/shares. Posted under a random citizen handle.</td></tr>
</table>
<p class="guide-tip">Your posts are anonymous &mdash; they appear under a randomly chosen citizen handle, so other players cannot identify which faction posted.</p>
</div></details>

<details><summary>Writing Posts</summary><div>
<ul>
<li>Posts have a <strong>280-character limit</strong></li>
<li>Use <strong>#hashtags</strong> to tag topics &mdash; they become clickable filters</li>
<li>Your faction initials appear in the compose avatar</li>
<li>After posting, you&rsquo;ll briefly see which handle your post was published under</li>
</ul>
</div></details>

<details><summary>Interactions</summary><div>
<table>
<tr><th>Action</th><th>Effect</th></tr>
<tr><td><strong>Like</strong> (heart)</td><td>Increments like count. Player post likes are persisted; system post likes are session-only.</td></tr>
<tr><td><strong>Share</strong> (arrow)</td><td>Increments share count. Same persistence rules as likes.</td></tr>
<tr><td><strong>Comment</strong> (bubble)</td><td>Toggles the reply thread. Only player posts accept replies (v1).</td></tr>
<tr><td><strong>Click post</strong></td><td>Expands/collapses the comment thread.</td></tr>
</table>
</div></details>

<details><summary>Filtering &amp; Search</summary><div>
<ul>
<li>Click any <strong>#hashtag</strong> in a post to filter the feed by that tag</li>
<li>Click a <strong>trending tag</strong> in the sidebar to filter</li>
<li>Use the <strong>search box</strong> to search post text, handle names, or display names</li>
<li>The active filter bar shows what&rsquo;s active &mdash; click <strong>[X]</strong> to clear</li>
</ul>
</div></details>

<details><summary>Trending Sidebar</summary><div>
<p>The trending section shows the top 7 hashtags by post count. On mobile screens, the top 3 trending tags appear as an inline bar above the feed.</p>
</div></details>

<details><summary>Live Updates</summary><div>
<p>The feed receives <strong>real-time updates</strong> &mdash; new player posts from other factions in your nation will appear automatically without refreshing the page.</p>
</div></details>
`
    },

    laws: {
        title: 'Bills Guide',
        html: `
<details open><summary>Drafting a Bill</summary><div>
<h3>What Is a Bill?</h3>
<p>A bill is a piece of proposed legislation that, if passed by parliament, becomes an active law. Active laws produce ongoing stat effects every tick &mdash; raising or lowering national indicators like stability, corruption, GDP growth, press freedom, and more. Bills are the primary way factions shape the nation.</p>

<h3>Who Can Draft?</h3>
<table>
<tr><th>Government Type</th><th>Who Can Draft</th></tr>
<tr><td><strong>Parliamentary</strong></td><td>Any faction with seats in parliament</td></tr>
<tr><td><strong>Presidential</strong></td><td>Any faction with seats in the legislature</td></tr>
<tr><td><strong>Autocracy</strong></td><td>Only the ruling faction (bills are called <em>Decrees</em>)</td></tr>
</table>

<h3>AP Cost</h3>
<p>Drafting a standard bill costs <strong>2 AP</strong>. This is deducted when you submit the bill to committee.</p>
<p class="guide-tip">The <strong>Policy Wonk</strong> party leadership trait reduces bill drafting cost by 1 AP. If you legislate heavily, this trait pays for itself quickly.</p>

<h3>How to Draft</h3>
<ol>
<li>Click <strong>&ldquo;Draft a Bill&rdquo;</strong> (or &ldquo;Draft a Decree&rdquo; in autocracies) at the top of the Bills page.</li>
<li>The draft modal opens with a preamble already written. You cannot edit the preamble &mdash; it is auto-generated.</li>
<li>Add one or more <strong>articles</strong> to the bill (see article types below).</li>
<li>Give your bill a name in the <strong>&ldquo;Name Your Bill&rdquo;</strong> field.</li>
<li>Click <strong>&ldquo;Submit to Committee&rdquo;</strong>. Your AP is deducted and the bill enters the committee phase.</li>
</ol>

<h3>Article Types</h3>
<p>Every bill must contain at least one article. There are three types you can add:</p>

<table>
<tr><th>Type</th><th>What It Does</th><th>How to Add</th></tr>
<tr><td><strong>Policy Article</strong></td><td>Activates a policy from the national policy catalogue. Each policy has stat effects that apply every tick once the bill passes.</td><td>Click <strong>&ldquo;+ Add Article&rdquo;</strong>, choose a sector, then select a policy from the grid.</td></tr>
<tr><td><strong>Text Article</strong></td><td>A freeform provision with no mechanical effect. Useful for signalling intent, setting conditions, or political messaging.</td><td>Click <strong>&ldquo;+ Add Text Article&rdquo;</strong>, enter a title and body, then confirm.</td></tr>
<tr><td><strong>Funding Article</strong></td><td>Changes how a ministry&rsquo;s budget is allocated across its institutions. Adjusting funding levels affects the ministry&rsquo;s output.</td><td>Click <strong>&ldquo;+ Funding Article&rdquo;</strong>, choose a ministry, adjust the institution sliders, then confirm.</td></tr>
</table>

<h3>Policy Sectors</h3>
<p>When adding a policy article, you pick from one of 11 sectors:</p>
<p>Economics &bull; Labor &bull; Education &bull; Energy &bull; Welfare &bull; Social &bull; Military &amp; Security &bull; Governance &bull; Immigration &bull; International &bull; Trade</p>
<p>Each sector contains multiple policies. Policies you have already enacted appear greyed out and cannot be added again.</p>

<h3>Ideology Chips</h3>
<p>Every policy displays small coloured squares indicating its ideological alignment. These are compared against <em>your faction&rsquo;s</em> current ideology scores:</p>
<ul>
<li><strong>Green chip</strong> &mdash; Aligned with your faction. Passing this boosts your approval with like-minded voter blocs.</li>
<li><strong>Red chip</strong> &mdash; Opposed to your faction. Passing this may cost you support with your base.</li>
<li><strong>Grey chip</strong> &mdash; Neutral. No strong ideological signal.</li>
</ul>
<p class="guide-tip">Ideology chips are relative to <em>your</em> faction. The same policy may show green for one party and red for another. Use this to gauge whether a bill will help or hurt you politically.</p>

<h3>Removing Articles</h3>
<p>While drafting, each article has a remove button (<strong>&times;</strong>). Click it to strip the article from the bill before submission. You can add and remove freely until you submit.</p>

<h3>Naming Your Bill</h3>
<p>Bills require a name before submission. The name is visible to all players in the nation and appears in the political events feed when the bill is voted on. Choose something descriptive &mdash; &ldquo;Economic Modernisation Act&rdquo; tells other players what to expect; &ldquo;Bill 7&rdquo; does not.</p>

<h3>What Happens After Submission</h3>
<p>Once submitted, your bill enters the <strong>Committee</strong> phase. It is now visible to all factions in your nation. Other factions can propose amendments, offer conditional support, or signal opposition. You retain control of the bill as its sponsor.</p>
<p>Committee is where you build the votes to pass. See the next section for how amendments and support-building work.</p>
</div></details>

<details><summary>Committee Phase</summary><div>
<h3>What Is Committee?</h3>
<p>After a bill is submitted, it enters the <strong>committee</strong> phase. The bill is now visible to every faction in your nation. This is the negotiation stage &mdash; you need to build enough support to advance the bill to the floor.</p>

<h3>Committee Expiry</h3>
<p>Bills that sit in committee for <strong>6 ticks</strong> without being sent to the floor are <strong>automatically expired</strong> and removed. Act within the window or lose the bill (and the AP you spent).</p>

<h3>Support &amp; Stances</h3>
<p>Each faction in parliament is listed in the bill&rsquo;s sidebar with a stance:</p>
<table>
<tr><th>Stance</th><th>Meaning</th></tr>
<tr><td><strong>SPONSOR</strong></td><td>You drafted the bill. Automatically counts as support.</td></tr>
<tr><td><strong>ACCEPT</strong></td><td>The faction supports the bill.</td></tr>
<tr><td><strong>REJECT</strong></td><td>The faction opposes the bill.</td></tr>
<tr><td><strong>CONDITIONAL</strong></td><td>The faction has proposed an amendment &mdash; they will support if you accept it.</td></tr>
<tr><td><strong>PENDING</strong></td><td>The faction has not yet declared a position.</td></tr>
<tr><td><strong>LOCKED</strong></td><td>Support was locked via a strike deal (cannot be changed).</td></tr>
</table>
<p>The sidebar shows a live <strong>Support %</strong> bar based on total seats backing the bill.</p>

<h3>Accepting or Rejecting (Non-Sponsors)</h3>
<p>If you are <em>not</em> the sponsor, you can click <strong>Accept</strong> or <strong>Reject</strong> on the bill detail page. You may change your mind at any time while the bill is in committee &mdash; unless your support has been locked by a strike deal.</p>

<h3>Conditional Support (Amendments)</h3>
<p>Instead of simply accepting or rejecting, any non-sponsor faction can propose <strong>conditional support</strong>. This is the game&rsquo;s amendment system. There are three types:</p>

<table>
<tr><th>Type</th><th>What It Does</th></tr>
<tr><td><strong>Policy Amendment</strong></td><td>You propose adding a specific policy article. If the sponsor accepts, the policy is added and your faction&rsquo;s support is recorded.</td></tr>
<tr><td><strong>Text Amendment</strong></td><td>You propose adding a freeform text article (title + body). No mechanical effect, but politically significant.</td></tr>
<tr><td><strong>Strike Article</strong></td><td>You request the <em>removal</em> of an existing article. If accepted, the article is removed and your support is <strong>locked</strong> (you cannot withdraw it later).</td></tr>
</table>

<p>The <strong>sponsor</strong> sees all incoming conditional support offers and can <strong>Accept</strong> or <strong>Reject</strong> each one individually. Accepting an amendment modifies the bill and secures that faction&rsquo;s votes.</p>
<p class="guide-tip">Amendments are the core negotiation mechanic. A bill with unpopular articles can be salvaged by striking the controversial provision in exchange for another party&rsquo;s locked support.</p>

<h3>Sponsor Actions in Committee</h3>
<p>As the sponsor, you have several tools while your bill is in committee:</p>
<ul>
<li><strong>Add Policy Article</strong> &mdash; attach additional policies to the bill.</li>
<li><strong>Add Text Article</strong> &mdash; attach freeform text provisions.</li>
<li><strong>Remove articles</strong> &mdash; strip articles you added (using the &times; button on each article).</li>
<li><strong>Accept / Reject amendments</strong> &mdash; respond to conditional support offers from other factions.</li>
<li><strong>Retract Bill</strong> &mdash; withdraw the bill entirely. The AP cost is not refunded.</li>
</ul>

<h3>Sending to the Floor</h3>
<p>When you are ready to call a vote, click <strong>&ldquo;Send to Floor&rdquo;</strong>. The sponsor can push a bill to the floor at any time, with or without a co-sponsor.</p>
<ul>
<li><strong>Solo send</strong> &mdash; if no other faction has accepted, sending to the floor costs the sponsoring party <strong>&minus;2 Momentum</strong>.</li>
<li><strong>With a co-sponsor</strong> &mdash; no penalty. A co-sponsor is any other faction whose stance is &ldquo;accept&rdquo;.</li>
<li><strong>Auto-floor bills</strong> (ratifications, motions of no confidence, impeachment motions, veto overrides, minister confirmations) never require a co-sponsor and never carry the solo penalty.</li>
</ul>
<p>Once on the floor, the bill enters the voting window and <strong>cannot be amended or retracted</strong>.</p>
</div></details>

<details><summary>Floor Vote &amp; Resolution</summary><div>
<h3>Voting Window</h3>
<p>Floor votes last <strong>6 ticks</strong>. The deadline is shown on the bill detail page. Every faction with parliamentary seats may vote.</p>

<h3>How to Vote</h3>
<p>Open the bill detail page and click one of three buttons:</p>
<ul>
<li><strong>Vote Yes</strong> &mdash; your faction&rsquo;s seats count toward passage.</li>
<li><strong>Vote No</strong> &mdash; your faction&rsquo;s seats count against.</li>
<li><strong>Abstain</strong> &mdash; your seats count toward quorum but not toward yes or no.</li>
</ul>
<p>You may change your vote at any time before the window closes.</p>

<h3>Quorum</h3>
<p>At least <strong>50%</strong> of total seats must participate (yes + no + abstain) for the vote to be valid. If quorum is not met, the bill fails automatically.</p>

<h3>Passage Thresholds</h3>
<table>
<tr><th>Bill Type</th><th>Threshold</th></tr>
<tr><td>Standard bill</td><td><strong>Simple majority</strong> &mdash; more YES votes than NO votes</td></tr>
<tr><td>Repeal</td><td><strong>Simple majority</strong></td></tr>
<tr><td>Foundational bill</td><td><strong>Two-thirds supermajority</strong> &mdash; YES votes &ge; &lceil;2/3 of total seats&rceil;</td></tr>
<tr><td>No Confidence motion</td><td><strong>Simple majority</strong></td></tr>
<tr><td>Impeachment motion</td><td><strong>Absolute majority</strong> &mdash; YES &ge; 61 of 120 seats</td></tr>
<tr><td>Impeachment conviction</td><td><strong>Two-thirds supermajority</strong></td></tr>
</table>

<h3>Early Resolution</h3>
<p>If enough votes are locked in that the outcome is mathematically certain before the deadline, the bill resolves on the <strong>next tick</strong> instead of waiting for the window to expire. The bill page will show &ldquo;Resolves next tick &mdash; will pass&rdquo; or &ldquo;will fail&rdquo;.</p>

<h3>Presidential Systems &mdash; President&rsquo;s Desk</h3>
<p>In a presidential democracy, bills that pass the legislature are sent to the <strong>President&rsquo;s Desk</strong> before becoming law. The president&rsquo;s faction may:</p>
<ul>
<li><strong>Sign into law</strong> &mdash; the bill takes effect immediately.</li>
<li><strong>Veto</strong> &mdash; the bill is blocked. Costs the president <strong>-3 Approval</strong>. The legislature can override a veto with a <strong>two-thirds supermajority</strong>.</li>
</ul>
<p>If the president takes no action within <strong>6 ticks</strong>, the bill is <strong>auto-signed</strong> into law.</p>

<h3>Autocracies &mdash; Decrees</h3>
<p>In an autocracy, there is no floor vote. The ruling faction drafts a <strong>decree</strong> and clicks <strong>&ldquo;Enact Decree&rdquo;</strong> to pass it unilaterally. Other factions can still propose amendments during the committee phase if any exist. The head faction can also <strong>veto</strong> decrees proposed by other parties.</p>

<h3>What Happens When a Bill Passes</h3>
<p>Each policy article in the bill becomes an <strong>active law</strong>. Active laws apply their stat effects every tick (e.g., +2 stability, -1 corruption, etc.). Funding articles adjust ministry institution allocations. Text articles have no mechanical effect but are recorded in the legislative history.</p>

<h3>What Happens When a Bill Fails</h3>
<p>The bill is removed with no effect. It appears in the <strong>Recently Resolved</strong> section marked as FAILED. The AP spent drafting it is not refunded.</p>

<h3>Frozen Bills</h3>
<p>If the legislature is <strong>dissolved</strong> (e.g., during elections), all in-progress bills are <strong>frozen</strong>. Frozen bills cannot be voted on or amended. They are dismissed when the election resolves.</p>
</div></details>

<details><summary>Active Laws &amp; Repeals</summary><div>
<h3>Active Laws</h3>
<p>The bottom of the Bills page shows all <strong>active laws</strong> grouped by sector (Economics, Labor, Education, etc.). Expand a sector, then a sub-sector, to see which policies are currently in effect.</p>
<p>Each active law displays:</p>
<ul>
<li>The policy name and description</li>
<li>Stat effects (e.g., Stability ↑, Corruption ↓) &mdash; these apply every tick</li>
<li>The tick it was passed</li>
<li>A <strong>Rescind</strong> button</li>
</ul>

<h3>Rescinding (Repealing) a Law</h3>
<p>Click <strong>&ldquo;Rescind&rdquo;</strong> on any active law to propose its repeal. This creates a <strong>repeal bill</strong> automatically and sends it to committee. The repeal bill follows the same committee &rarr; floor vote pipeline as any other bill. It passes with a simple majority.</p>
<p>You can also add <strong>repeal articles</strong> to a regular bill while drafting. In the policy picker, already-enacted policies appear with a red <strong>&ldquo;Click to Repeal&rdquo;</strong> badge. Clicking one adds a repeal article to your draft. This lets you bundle new policies and repeals in a single bill.</p>
<p class="guide-tip">When you repeal a law, its stat effects are reversed. If the law was costing money per tick, those costs stop immediately. Ideology chips on repeal articles are <em>inverted</em> &mdash; repealing an opposed policy shows as green (aligned) for you.</p>

<h3>The All Laws Panel</h3>
<p>Click <strong>&ldquo;All Laws&rdquo;</strong> at the top of the page to open a filterable catalogue of every policy in the game. Use it to:</p>
<ul>
<li><strong>Search by name</strong> &mdash; type in the search box to filter policies.</li>
<li><strong>Filter by status</strong> &mdash; show only Active or Inactive policies.</li>
<li><strong>Filter by sector</strong> &mdash; narrow to a specific sector.</li>
<li><strong>Filter by ideology</strong> &mdash; find policies aligned to a particular ideology pole.</li>
</ul>
<p>Each policy card shows its stat effects, ideology chips, costs, and whether it is currently active. This is useful for planning which policies to target in your next bill.</p>

<h3>Legislative Record</h3>
<p>Click <strong>&ldquo;View full legislative record&rdquo;</strong> below the Recently Resolved section to see every bill that has ever been voted on, with pass/fail status, vote tallies, and party breakdowns. Use it to review the nation&rsquo;s legislative history and track which factions voted which way.</p>
</div></details>

<details><summary>Approval, Ideology &amp; Penalties</summary><div>
<h3>How Bills Affect Party Approval</h3>
<p>When a bill passes, every faction that voted receives an <strong>approval adjustment</strong> based on how the bill&rsquo;s ideology aligns with their own. The system checks each policy article&rsquo;s ideology tags against your faction&rsquo;s ideology scores on each axis.</p>

<table>
<tr><th>Scenario</th><th>Approval Effect</th></tr>
<tr><td>Voted YES on an aligned bill</td><td><strong>+1 to +4</strong> (scaled &times;0.3)</td></tr>
<tr><td>Voted YES on an opposed bill</td><td><strong>&minus;2 to &minus;10</strong> (scaled &times;0.3) &mdash; includes a &minus;2 opposition kicker</td></tr>
<tr><td>Voted NO on an opposed bill</td><td><strong>+1 to +4</strong> (inverted &mdash; voting against something you oppose is good)</td></tr>
<tr><td>Voted NO on an aligned bill</td><td><strong>&minus;2 to &minus;10</strong> (inverted &mdash; voting against something you support hurts)</td></tr>
<tr><td>Abstained</td><td>No approval change from ideology alignment</td></tr>
</table>

<p class="guide-tip">The more ideology tags a bill has, the bigger the swing. A bill with 3 articles all opposed to your faction could cost you up to &minus;3 approval (after scaling) if you vote Yes. Vote strategically.</p>

<h3>Ideology Chip Colours</h3>
<p>Every policy in the game has ideology tags (e.g., PROGRESS, LIBERTY, SECURITY). These appear as coloured chips on bill articles:</p>
<ul>
<li><strong style="color:#7a9a5b;">Green</strong> &mdash; Your faction scores <strong>+20 or higher</strong> on that ideology&rsquo;s axis. This is aligned with your position.</li>
<li><strong style="color:#a65d5d;">Red</strong> &mdash; Your faction scores <strong>&minus;20 or lower</strong> on that ideology&rsquo;s axis. This is opposed to your position.</li>
<li><strong style="color:#8a8778;">Grey</strong> &mdash; Your faction is between &minus;19 and +19 on the axis. No strong signal either way.</li>
</ul>
<p>Chip colours are <strong>relative to your faction</strong>. The same bill may show green chips for one party and red for another. On repeal bills, the colours are inverted &mdash; repealing an opposed policy shows green.</p>

<h3>The Five Ideology Axes</h3>
<table>
<tr><th>Axis</th><th>Left Pole</th><th>Right Pole</th></tr>
<tr><td>Liberty &harr; Equality</td><td>Liberty</td><td>Equality</td></tr>
<tr><td>Tradition &harr; Progress</td><td>Tradition</td><td>Progress</td></tr>
<tr><td>Security &harr; Freedom</td><td>Security</td><td>Freedom</td></tr>
<tr><td>Globalism &harr; Nationalism</td><td>Globalism</td><td>Nationalism</td></tr>
<tr><td>Individualism &harr; Collectivism</td><td>Individualism</td><td>Collectivism</td></tr>
</table>
<p>Your faction&rsquo;s position on each axis ranges from &minus;100 to +100. Positive scores mean you lean toward the <em>right pole</em>; negative toward the <em>left pole</em>. You shift your position over time through stances, campaigns, and legislative activity.</p>

<h3>Penalty for Not Voting</h3>
<p>If your faction <strong>does not vote at all</strong> (no Yes, No, or Abstain) on a floor bill, you suffer penalties when it resolves:</p>
<table>
<tr><th>Stat</th><th>Penalty</th></tr>
<tr><td>Party Approval</td><td><strong>&minus;1 to &minus;3</strong> (random)</td></tr>
<tr><td>Visibility</td><td><strong>&minus;5</strong></td></tr>
<tr><td>Experience</td><td><strong>&minus;5</strong> (on the 0&ndash;100 display scale)</td></tr>
</table>
<p>These penalties apply <strong>per bill</strong>. If three bills resolve in one tick and you didn&rsquo;t vote on any of them, you take the penalty three times.</p>
<p class="guide-tip"><strong>Always vote.</strong> Even if you don&rsquo;t care about a bill, casting Abstain avoids the penalty entirely. The only scenario where not voting makes sense is if you want to intentionally torpedo quorum.</p>

<h3>Government Approval Bonus</h3>
<p>Every bill that passes gives a small <strong>government approval event bonus</strong>, reflecting that the legislature is actively governing. This nudges the nation&rsquo;s <em>gov_approval_events</em> stat positively, benefiting all coalition parties.</p>
</div></details>

<details><summary>Foundational Laws &amp; Repeal</summary><div>
<h3>What Are Foundational Laws?</h3>
<p>Foundational laws change the constitutional structure of the nation. They are different from standard bills:</p>
<ul>
<li>Cost <strong>3 AP</strong> to draft (vs. 2 AP for standard bills)</li>
<li>Require a <strong>two-thirds supermajority</strong> to pass (80 of 120 seats)</li>
<li><strong>Must</strong> have at least one co-sponsor to advance from committee</li>
<li>Contain exactly <strong>one article</strong> (no additional policies or text)</li>
<li>Have <strong>cooldown timers</strong> between changes (120&ndash;360 ticks depending on type)</li>
</ul>

<h3>Established Foundational Laws</h3>
<p>Some foundational laws start the game already established (e.g., Legislative Term Length). When a foundational law is established:</p>
<ul>
<li>It shows an <strong style="color:#5cb85c;">ACTIVE</strong> badge in the foundational law picker</li>
<li>You <strong>cannot directly change</strong> it by proposing a new value</li>
<li>You must first <strong>repeal</strong> it (supermajority vote), then propose a replacement</li>
</ul>

<h3>Repealing a Foundational Law</h3>
<p>To change an established foundational law:</p>
<ol>
<li>Click the active foundational law card &mdash; this selects it as a <strong>repeal</strong></li>
<li>Confirm and submit. A repeal bill is created requiring a two-thirds supermajority</li>
<li>Once the repeal passes, the law&rsquo;s active status is cleared</li>
<li>You can now propose a new value through the normal foundational bill flow</li>
</ol>
<p class="guide-tip">Repealing a foundational law does not change the nation&rsquo;s current settings immediately &mdash; it only unlocks the ability to propose a new value. Elections continue on the current schedule until a replacement law passes.</p>

<h3>Cooldowns</h3>
<table>
<tr><th>Foundational Law</th><th>Cooldown</th></tr>
<tr><td>Presidential Term Length</td><td>120 ticks (10 years)</td></tr>
<tr><td>Legislative Term Length</td><td>120 ticks (10 years)</td></tr>
<tr><td>Presidential Term Limits</td><td>240 ticks (20 years)</td></tr>
<tr><td>Head of State Election Method</td><td>360 ticks (30 years)</td></tr>
</table>
<p>Cooldowns apply to both establishing and repealing foundational laws. The cooldown starts from the tick the last foundational bill of that type passed.</p>
</div></details>

<details><summary>Other Special Bill Types</summary><div>
<h3>Repeal Bills</h3>
<p>Repeal bills are created when you click <strong>Rescind</strong> on an active law. They target a single active law for removal and pass with a simple majority. The bill is pre-configured &mdash; you cannot add articles to it.</p>

<h3>No Confidence Motions</h3>
<p>A motion to dissolve the current government. Requires a <strong>simple majority</strong> (more YES than NO votes). If passed, the coalition is dissolved, the PM is removed, and all ministries are vacated. If it fails, the filer loses 5 approval and the PM gains 3, with a 6-tick cooldown before another motion can be filed.</p>

<h3>Impeachment</h3>
<p>Impeachment is a two-stage process in presidential systems. Filing requires at least one valid charge (Abuse of Power, Corruption, Gross Incompetence, Constitutional Violation, or Criminal Conduct), each with specific stat-based preconditions.</p>
<ol>
<li><strong>Impeachment Motion</strong> &mdash; requires an <strong>absolute majority</strong> (61 of 120 seats) to pass. If successful, the president is impeached and proceeds to a conviction trial.</li>
<li><strong>Impeachment Conviction</strong> &mdash; requires a <strong>two-thirds supermajority</strong> to convict and remove the president from office.</li>
</ol>
<p>If the motion fails, the filer loses 2 approval and the president gains 2. A 10-tick cooldown applies. After acquittal, the cooldown is 20 ticks. The president&rsquo;s <strong>Constitutional Scholar</strong> trait increases the filing cost by +3 AP; the <strong>Paper Thin Mandate</strong> flaw reduces it by 2 AP.</p>

<h3>Default Resolution</h3>
<p>An extreme fiscal measure available when your nation&rsquo;s debt-to-GDP ratio exceeds <strong>150%</strong>. Filing costs <strong>6 AP</strong> and requires a two-thirds supermajority. There are two types:</p>
<ul>
<li><strong>Full Default</strong> &mdash; eliminates all debt but causes severe international consequences.</li>
<li><strong>Partial Restructuring</strong> &mdash; negotiates a repayment rate (30&ndash;70%) with reduced penalties.</li>
</ul>
<p>You can optionally include <strong>austerity commitments</strong> (spending cuts) to soften the international backlash.</p>
</div></details>
`
    },

    diplomacy: {
        title: 'Diplomacy Guide',
        html: `
<details open><summary>Dashboard Overview</summary><div>
<p>The Diplomacy page is your window into foreign affairs. It has three top-level subtabs (<strong>WORLD</strong> &middot; <strong>TRADE</strong> &middot; <strong>IPO</strong>) and, inside the WORLD subtab, a view toggle for Diplomacy and World Nations:</p>
<ul>
<li><strong>WORLD</strong> &mdash; the default subtab. Diplomacy view has four sub-sections: Relations, Agreements, Initiative, and Inbox. Toggle to World Nations for the global overview.</li>
<li><strong>TRADE</strong> &mdash; trade negotiations, agreements, and shipping</li>
<li><strong>IPO</strong> &mdash; International Party Organisations you belong to</li>
</ul>

<h3>Diplomacy Sub-Tabs</h3>
<table>
<tr><th>Tab</th><th>What It Shows</th></tr>
<tr><td><strong>Relations</strong></td><td>Lists every foreign nation with embassy status, relation scores, ambassador info, and active agreement counts. Click a nation to see detailed actions.</td></tr>
<tr><td><strong>Agreements</strong></td><td>All your active treaties, trade agreements, and diplomatic proposals &mdash; both inbound and outbound.</td></tr>
<tr><td><strong>Initiative</strong></td><td>The drafting workspace for building multi-article diplomatic proposals (Minor and Major initiatives).</td></tr>
<tr><td><strong>Inbox</strong></td><td>Diplomatic messages from other nations. Only visible to players holding diplomatic roles.</td></tr>
</table>
</div></details>

<details><summary>Diplomatic Roles</summary><div>
<p>Not every player can conduct diplomacy. You need to hold one of these roles through your nation's government:</p>

<h3>Head of Government (HoG)</h3>
<ul>
<li><strong>Who:</strong> The Prime Minister's party (parliamentary) or the President's party (presidential). In autocracies, the ruling faction.</li>
<li><strong>Powers:</strong> State Visits (4 AP). War, ceasefire, and alliance actions are planned for future updates.</li>
<li><strong>Special:</strong> Can join trade negotiations (2 AP) and override certain diplomatic decisions.</li>
</ul>

<h3>Foreign Minister (FM)</h3>
<ul>
<li><strong>Who:</strong> The party that holds the Foreign Ministry in the coalition government.</li>
<li><strong>Powers:</strong> Appoint Ambassadors (1 AP), Recall Ambassadors (1 AP), propose Major Diplomatic Initiatives (2 AP).</li>
<li><strong>Key duty:</strong> Reviews incoming minor proposals before they take effect. Also sees all unread diplomatic messages.</li>
</ul>

<h3>Minister of Trade (MoT)</h3>
<ul>
<li><strong>Who:</strong> The party that holds the Trade Ministry in the coalition government.</li>
<li><strong>Powers:</strong> Trade Agreements (2 AP), Retaliatory Tariffs (2 AP), Export Subsidies (2 AP), Tariff Reductions (3 AP), Impose Embargo (5 AP).</li>
<li><strong>Key duty:</strong> Leads trade negotiations. Can join ongoing talks for 2 AP.</li>
</ul>

<h3>Ambassador</h3>
<ul>
<li><strong>Who:</strong> Appointed by the Foreign Minister, confirmed by parliament (6-tick vote). Your party must have an ambassador posted to a specific nation.</li>
<li><strong>Powers:</strong> Minor Diplomatic Initiatives (2 AP), Formal Protests (2 AP), Send Messages (free).</li>
<li><strong>Term:</strong> 60 ticks (~5 years). Ambassadors can resign or be recalled by the FM.</li>
<li><strong>Scope:</strong> You can only act toward the nation you are posted to.</li>
</ul>

<h3>No Role?</h3>
<p>If your party doesn't hold any of these roles, you can still view foreign relations and agreements, but you cannot take diplomatic actions. Work with your coalition to get a ministry or an ambassador posting.</p>
</div></details>

<details><summary>Foreign Relations Panel</summary><div>
<p>When you click on a foreign nation in the Relations tab, you see a detailed card:</p>

<table>
<tr><th>Field</th><th>Meaning</th></tr>
<tr><td><strong>Embassy Status</strong></td><td><span style="color:#4ade80;">Open</span> = both nations have active ambassadors to each other. <span style="color:#ef4444;">Closed</span> = one or both sides have no ambassador.</td></tr>
<tr><td><strong>Relations Score</strong></td><td>A number reflecting diplomatic warmth. Positive = friendly, negative = hostile. Affected by diplomatic actions, trade deals, protests, and covert operations.</td></tr>
<tr><td><strong>Relations Tier</strong></td><td>A label derived from the score: Friendly, Neutral, Cool, Adversarial, Hostile, Ceasefire, or War.</td></tr>
<tr><td><strong>Our Ambassador</strong></td><td>The name and party of your ambassador posted to that nation (if any).</td></tr>
<tr><td><strong>Their Ambassador</strong></td><td>The name and party of their ambassador posted to your nation (if any).</td></tr>
<tr><td><strong>Active Agreements</strong></td><td>Count of treaties and trade agreements currently in force between the two nations.</td></tr>
</table>
</div></details>

<details><summary>Appointing Ambassadors</summary><div>
<p>Ambassadors are your diplomatic presence in foreign nations. Only the <strong>Foreign Minister</strong> can appoint them.</p>

<h3>Appointment Flow</h3>
<ol>
<li><strong>FM clicks "Appoint Ambassador"</strong> (1 AP) and selects a target nation.</li>
<li><strong>Select a candidate</strong> from the list of eligible party representatives.</li>
<li><strong>Click "Nominate"</strong> &mdash; this creates a <em>confirmation bill</em> that goes directly to the parliamentary floor.</li>
<li><strong>Parliament votes</strong> for 6 ticks. A simple majority (51%) confirms the appointment.</li>
<li>If confirmed, the ambassador becomes <strong>active</strong> and the appointing party gains that ambassador's powers toward the target nation.</li>
</ol>

<h3>Key Details</h3>
<ul>
<li><strong>Term length:</strong> 60 ticks (~5 years). After that, the ambassador retires and must be re-appointed.</li>
<li><strong>Autocracies:</strong> Skip the confirmation vote &mdash; the ambassador is appointed immediately.</li>
<li><strong>One per nation:</strong> You can only have one active ambassador per foreign nation.</li>
<li><strong>Recall:</strong> The FM (or HoG) can recall an ambassador at any time for 1 AP.</li>
<li><strong>Resignation:</strong> A player whose party holds an ambassadorship can resign voluntarily.</li>
</ul>
</div></details>

<details><summary>AP Costs Reference</summary><div>
<table>
<tr><th>Action</th><th>Cost</th><th>Role Required</th></tr>
<tr><td>Appoint Ambassador</td><td>1 AP</td><td>Foreign Minister</td></tr>
<tr><td>Recall Ambassador</td><td>1 AP</td><td>Foreign Minister / HoG</td></tr>
<tr><td>Minor Diplomatic Initiative</td><td>2 AP</td><td>Ambassador</td></tr>
<tr><td>Major Diplomatic Initiative</td><td>2 AP</td><td>Foreign Minister</td></tr>
<tr><td>Formal Protest</td><td>2 AP</td><td>Ambassador</td></tr>
<tr><td>Send Message</td><td>Free</td><td>Ambassador</td></tr>
<tr><td>Trade Agreement</td><td>2 AP</td><td>Minister of Trade</td></tr>
<tr><td>Retaliatory Tariff</td><td>2 AP</td><td>Minister of Trade</td></tr>
<tr><td>Export Subsidy</td><td>2 AP</td><td>Minister of Trade</td></tr>
<tr><td>Tariff Reduction</td><td>3 AP</td><td>Minister of Trade</td></tr>
<tr><td>Impose Embargo</td><td>5 AP</td><td>Minister of Trade</td></tr>
<tr><td>State Visit</td><td>4 AP</td><td>Head of Government</td></tr>
</table>
<p><em>Tip: If bilateral trade talks are already open with a nation, some actions cost 1 AP less.</em></p>
</div></details>

<details><summary>Trade Agreements Overview</summary><div>
<p>Trade agreements are negotiated between two nations (or enacted unilaterally) through the <strong>Minister of Trade</strong>. There are 6 types:</p>

<table>
<tr><th>Type</th><th>Abbr.</th><th>Bilateral?</th><th>Description</th></tr>
<tr><td><strong>Free Trade Agreement</strong></td><td>FTA</td><td>Yes</td><td>Eliminates all tariffs between two nations. You can carve out sector exemptions.</td></tr>
<tr><td><strong>Preferential Tariff</strong></td><td>PTA</td><td>Yes</td><td>Reduces tariffs on specific sectors. Each side can negotiate different reduction percentages.</td></tr>
<tr><td><strong>Resource Supply Contract</strong></td><td>RSC</td><td>Yes</td><td>Guaranteed purchase commitment for raw resources (Fuel, Minerals, or Food). Sets price terms and optional breach penalties.</td></tr>
<tr><td><strong>Export Subsidy</strong></td><td>ES</td><td>No</td><td>Unilateral &mdash; subsidize your own exporters (5-30%) to boost competitiveness. Costs your treasury.</td></tr>
<tr><td><strong>Economic Aid</strong></td><td>AID</td><td>Yes</td><td>Financial assistance from donor to recipient. Can attach conditions (governance, economic, or social benchmarks).</td></tr>
<tr><td><strong>Retaliatory Tariff</strong></td><td>RT</td><td>No</td><td>Unilateral &mdash; impose a surcharge (5-50%) on imports from a specific nation. Damages relations.</td></tr>
</table>

<h3>Credit Rating Requirements</h3>
<p>Your nation needs a minimum credit rating to propose certain agreements:</p>
<ul>
<li><strong>FTA</strong> &mdash; Credit &ge; 25</li>
<li><strong>PTA</strong> &mdash; Credit &ge; 10</li>
<li><strong>RSC</strong> &mdash; Credit &ge; 15</li>
<li><strong>Aid (as donor)</strong> &mdash; Credit &ge; 20</li>
<li><strong>Export Subsidy / Retaliatory Tariff</strong> &mdash; No requirement</li>
</ul>

<h3>Tradeable Sectors</h3>
<p>Six sectors can appear in trade agreements:</p>
<ol>
<li>Fuel &amp; Energy</li>
<li>Minerals &amp; Raw Materials</li>
<li>Food &amp; Agriculture</li>
<li>Manufactured Goods</li>
<li>Technology &amp; Electronics</li>
<li>Arms &amp; Military Equipment</li>
</ol>
<p><em>Tourism and Services &amp; Finance exist as export sectors in the economy but cannot be included in trade agreements.</em></p>
</div></details>

<details><summary>Trade Negotiation Lifecycle</summary><div>
<p>Bilateral trade agreements (FTA, PTA, RSC, Aid) follow this lifecycle:</p>

<ol>
<li><strong>Propose</strong> (2 AP) &mdash; The MoT, FM, or Ambassador opens a negotiation with a target nation. Choose the agreement type.</li>
<li><strong>Counterpart Joins</strong> &mdash; The other nation's MoT, FM, or Ambassador must join the negotiation. If nobody joins within the time limit, talks expire.</li>
<li><strong>Draft Articles</strong> &mdash; Both sides add articles (duration, sector terms, conditions). Either side can add or modify articles.</li>
<li><strong>Close Negotiations</strong> &mdash; When both sides are satisfied, either party can close the negotiation.</li>
<li><strong>Ratification</strong> &mdash; A ratification bill is created in <em>both</em> parliaments. Each legislature votes for 6 ticks.</li>
<li><strong>Activation</strong> &mdash; If both parliaments pass the bill, the agreement becomes active. If either rejects it, the agreement fails.</li>
</ol>

<h3>Timing</h3>
<ul>
<li>Negotiations expire after <strong>4 ticks</strong> by default.</li>
<li>Negotiations can be extended up to <strong>3 times</strong> (+12 ticks each, max ~40 ticks total).</li>
<li>Ratification voting lasts <strong>6 ticks</strong>.</li>
</ul>

<h3>Unilateral Actions</h3>
<p><strong>Export Subsidies</strong> and <strong>Retaliatory Tariffs</strong> skip the negotiation phase. The MoT drafts articles and they take effect immediately (no parliamentary ratification needed).</p>

<h3>Agreement Duration</h3>
<p>Every agreement requires a Duration article:</p>
<ul>
<li><strong>Permanent</strong> &mdash; lasts until one side withdraws (with notice period).</li>
<li><strong>Fixed term</strong> &mdash; 8 to 48 ticks depending on type. Can optionally auto-renew.</li>
<li><strong>Withdrawal notice</strong> &mdash; 1 to 6 ticks advance notice required to withdraw early.</li>
</ul>
</div></details>

<details><summary>Minor Diplomatic Initiatives</summary><div>
<p>Minor initiatives are <strong>Tier 1</strong> proposals drafted by an <strong>Ambassador</strong> (2 AP). They bundle one or more articles and are sent to the target nation. The target's Ambassador, FM, or HoG can accept directly &mdash; no parliamentary vote needed.</p>

<h3>Article Types</h3>

<h4>Visa Agreement</h4>
<p>Establishes visa-free travel between nations. Configurable options:</p>
<ul>
<li><strong>Duration:</strong> 30, 90, or 180 days</li>
<li><strong>Scope:</strong> Tourism Only, Tourism + Business, or All Purposes</li>
<li><strong>Direction:</strong> Reciprocal, One-way (Our Citizens), or One-way (Their Citizens)</li>
<li><strong>Excludes:</strong> Can carve out Work Permits, Residency, or Diplomatic Staff</li>
</ul>
<p><em>Effects:</em> Improves relations (+6 base), generates tourism revenue, increases international reputation. Broader scope and longer duration amplify effects but may increase immigration and polarization.</p>

<h4>Cultural Exchange</h4>
<p>Soft power programme (Artist Exchange, Museum Exhibits, Film Festival, etc.):</p>
<ul>
<li><strong>Duration:</strong> 1 Year, 2 Years, or Permanent (with ongoing cost)</li>
<li><strong>Funding:</strong> 50/50, 60/40 We Pay More, or 60/40 They Pay More</li>
</ul>
<p><em>Effects:</em> Improves relations (+4 base), boosts international reputation and soft power.</p>

<h4>Student Exchange</h4>
<p>University exchange programme:</p>
<ul>
<li><strong>Seats:</strong> 50&ndash;500 students (diminishing returns above 200)</li>
<li><strong>Level:</strong> Undergraduate, Graduate, or Both</li>
<li><strong>Duration:</strong> 1 Semester (6 ticks), Full Year (12), or Full Degree (36+)</li>
<li><strong>Field:</strong> Sciences, Engineering, Medicine, Humanities, Law, or Economics</li>
<li><strong>Funding:</strong> Host Pays, Split, or Sender Pays</li>
</ul>
<p><em>Effects:</em> Improves relations (+3 base), boosts higher education. Graduate + Sciences/Engineering fields grant a bonus to Technology.</p>

<h4>Joint Statement</h4>
<p>A public or private declaration between two nations. Purely diplomatic &mdash; no mechanical stat effects, but can signal alignment:</p>
<ul>
<li><strong>Visibility:</strong> Public (visible to all) or Private (only signatories see it)</li>
</ul>
</div></details>

<details><summary>Major Diplomatic Initiatives</summary><div>
<p>Major initiatives are <strong>Tier 3</strong> proposals drafted by the <strong>Foreign Minister</strong> (2 AP). They require <strong>bilateral parliamentary ratification</strong> &mdash; both nations' legislatures must pass the agreement within 6 ticks.</p>

<p><em>If a Major initiative fails ratification, you must wait <strong>8 ticks</strong> before re-proposing the same type.</em></p>

<h3>Article Types</h3>

<h4>Open Borders Agreement</h4>
<p>Freedom of movement between nations. The most impactful treaty type:</p>
<ul>
<li><strong>Scope:</strong> Full Freedom (entry + work + residency + settlement), Work &amp; Residency Only, or Labor Mobility Only</li>
<li><strong>Direction:</strong> Reciprocal or One-way</li>
<li><strong>Worker Protections:</strong> Enhanced (minimum wage, anti-exploitation, pension portability), Standard, or None</li>
<li><strong>Transition:</strong> Immediate (unrest spike), 6-Tick Phased, or 12-Tick Gradual</li>
</ul>
<p><em>Effects:</em> Large relations boost (+8 base), GDP growth, labor force participation. Also increases immigration, civil unrest, polarization, and cost of living. Enhanced protections cost more but reduce exploitation.</p>
<p><strong>Sovereignty cost:</strong> Full Open Borders blocks domestic IMMIGRATION and LABOR policy changes. Work/Labor Mobility blocks LABOR policies.</p>

<h4>Mutual Extradition Treaty</h4>
<p>Criminal extradition agreement:</p>
<ul>
<li><strong>Scope:</strong> Serious Crimes Only, All Criminal Offenses, or Political Offenses Included</li>
<li><strong>Dual Criminality:</strong> Required (must be a crime in both nations) or Waived</li>
<li><strong>Appeal Process:</strong> Full Judicial Review, Expedited Review, or None</li>
<li><strong>Exceptions:</strong> Death Penalty Cases, Military Offenses, Financial Crimes</li>
</ul>
<p><em>Effects:</em> Improves relations (+6 base), reduces crime and corruption. Including political offenses increases repression risk.</p>
<p><strong>Sovereignty cost:</strong> Including Political Offenses blocks domestic GOVERNANCE policy changes.</p>

<h4>Bilateral Environmental Accord</h4>
<p>Environmental commitments with real enforcement:</p>
<ul>
<li><strong>Emission Targets:</strong> Modest (&minus;5%), Moderate (&minus;15%), or Ambitious (&minus;25%)</li>
<li><strong>Renewable Energy Targets:</strong> 25%, 40%, or 60% minimum</li>
<li><strong>Pollution Standards:</strong> Advisory, Binding, or Strict</li>
<li><strong>Conservation:</strong> Forest, Marine, Wetland, Biodiversity (pick any combination)</li>
<li><strong>Review Interval:</strong> 6, 12, or 24 ticks</li>
<li><strong>Penalty for Non-Compliance:</strong> Warning, Financial, or Sanctions</li>
</ul>
<p><em>Effects:</em> Improves relations (+5 base), boosts environmental index and international reputation. Stricter targets are costlier but more effective.</p>
<p><strong>Sovereignty cost:</strong> Strict/Binding pollution standards block domestic ENERGY policy changes.</p>
</div></details>

<details><summary>State Visits</summary><div>
<p>The <strong>Head of Government</strong> can conduct official visits to foreign nations. State visits are highly configurable and build relations, soft power, and trade ties.</p>

<h3>Visit Types</h3>
<table>
<tr><th>Type</th><th>AP Modifier</th><th>Specialty</th></tr>
<tr><td><strong>Official State Visit</strong></td><td>+0</td><td>Balanced &mdash; standard relations multiplier</td></tr>
<tr><td><strong>Working Visit</strong></td><td>&minus;1</td><td>Trade-focused &mdash; 1.2&times; trade bonus, 0.8&times; relations</td></tr>
<tr><td><strong>Goodwill Visit</strong></td><td>&minus;2</td><td>Soft power &mdash; 1.3&times; cultural effects</td></tr>
</table>

<h3>Duration</h3>
<table>
<tr><th>Length</th><th>Extra AP</th><th>Effect Multiplier</th><th>Max Agenda Items</th></tr>
<tr><td>Short</td><td>+1</td><td>0.7&times;</td><td>3</td></tr>
<tr><td>Moderate</td><td>+2</td><td>1.0&times;</td><td>5</td></tr>
<tr><td>Lengthy</td><td>+3</td><td>1.3&times;</td><td>7</td></tr>
</table>
<p><em>Total AP cost = 4 (base) + duration AP + visit type modifier.</em></p>

<h3>Delegation Size</h3>
<table>
<tr><th>Size</th><th>Debt Cost</th><th>Effect Bonus</th></tr>
<tr><td>Small (4)</td><td>$1.2M</td><td>None</td></tr>
<tr><td>Standard (8)</td><td>$2.4M</td><td>None</td></tr>
<tr><td>Large (14)</td><td>$4.8M</td><td>+10%</td></tr>
</table>

<h3>Agenda Items</h3>
<p>Pick items up to your duration's max. Each adds specific effects:</p>
<ul>
<li><strong>Formal Reception</strong> &mdash; +3 relations, +5 public awareness</li>
<li><strong>Joint Press Conference</strong> &mdash; +2 gov approval, +2 relations (8% gaffe risk)</li>
<li><strong>Economic Forum</strong> &mdash; +4 trade relations, unlocks trade deal ($1.2M cost)</li>
<li><strong>University Address</strong> &mdash; +3 soft power, +2 education approval</li>
<li><strong>Private Bilateral Talks</strong> &mdash; +5 relations, enables diplomatic discount (future actions cost 1 less AP)</li>
<li><strong>Military Review</strong> &mdash; +4 military trust (may alarm hostile neighbours)</li>
<li><strong>Cultural Exchange</strong> &mdash; +4 soft power, +2 relations ($0.8M cost)</li>
<li><strong>Monument Visit</strong> &mdash; +3 public opinion (symbolic, low cost)</li>
<li><strong>Treaty Signing</strong> &mdash; Sign a pending treaty during the visit</li>
</ul>
</div></details>

<details><summary>Hostile &amp; Confrontational Actions</summary><div>
<p>Not all diplomacy is friendly. Several tools exist for economic pressure and conflict:</p>

<h3>Implemented</h3>
<table>
<tr><th>Action</th><th>Cost</th><th>Role</th><th>Effect</th></tr>
<tr><td><strong>Impose Embargo</strong></td><td>5 AP</td><td>Minister of Trade</td><td>Block trade in targeted, partial, or all sectors with a nation. Damages their economy and your relations.</td></tr>
<tr><td><strong>Retaliatory Tariff</strong></td><td>2 AP</td><td>Minister of Trade</td><td>Surcharge (5&ndash;50%) on imports from a specific nation. Less extreme than embargo.</td></tr>
<tr><td><strong>Recall Ambassador</strong></td><td>1 AP</td><td>Foreign Minister</td><td>Remove your ambassador from a nation. Signals diplomatic displeasure and closes your embassy.</td></tr>
</table>

<h3>Coming Soon</h3>
<ul>
<li><strong>Formal Protest</strong> (2 AP, Ambassador) &mdash; Lodge formal disapproval of another nation's actions</li>
<li><strong>Declare War</strong> (8 AP, Head of Government) &mdash; Military conflict with justification system</li>
<li><strong>Call for Ceasefire</strong> (4 AP, Head of Government) &mdash; End active conflicts</li>
<li><strong>Sign Alliance</strong> (6 AP, Head of Government) &mdash; Mutual defense pacts</li>
<li><strong>Foreign Aid Proposal</strong> (4 AP, Foreign Minister) &mdash; Direct financial assistance</li>
</ul>
</div></details>

<details><summary>International Party Organisations (IPOs)</summary><div>
<p>IPOs are voluntary cross-nation associations of like-minded parties. They let you coordinate strategy, pool resources, and project ideological influence across borders. Access them via the <strong>IPO</strong> subtab on the Diplomacy page. All costs are paid in cash from your party funds.</p>

<h3>Creating an Organisation</h3>
<ul>
<li><strong>Cost:</strong> $200k base, plus $50k for each charter article beyond the first</li>
<li>You define a <strong>charter</strong> with up to 5 articles (only Article I &mdash; Mission is required)</li>
<li>The founding party becomes the first president and member</li>
<li>Choose a name, logo symbol, and abbreviation</li>
</ul>

<h3>Charter Articles</h3>
<table>
<tr><th>Article</th><th>What It Configures</th></tr>
<tr><td><strong>I. Mission Statement</strong></td><td>Required. Text describing the organisation's purpose.</td></tr>
<tr><td><strong>II. Leadership</strong></td><td>Presidency type (Rotation, Most Seats, or Random), term length (1&ndash;7 years), voting weight (Equal or Seat Share), vote threshold (Majority or Unanimous).</td></tr>
<tr><td><strong>III. Membership</strong></td><td>Admission method (Vote or President decides), ideological threshold (restrict by ideology direction), expulsion clause (Disabled, President, Majority, or Unanimous).</td></tr>
<tr><td><strong>IV. Governance</strong></td><td>Action leadership model, vote transparency (Public or Secret ballot), observer status, veto rights, emergency powers.</td></tr>
<tr><td><strong>V. Resources</strong></td><td>Solidarity fund (enable + cash per quarter), resource sharing cap, joint statement clause, headquarters nation.</td></tr>
</table>

<h3>Membership</h3>
<ul>
<li><strong>Members</strong> can vote, propose actions, and send chat messages</li>
<li><strong>Observers</strong> can view and read chat but cannot vote or act</li>
<li>Joining requires either a <strong>membership vote</strong> (8 ticks) or <strong>president approval</strong>, depending on the charter</li>
<li>The charter can set <strong>ideological thresholds</strong> &mdash; applicants must align on at least one selected ideology axis</li>
</ul>

<h3>Presidency</h3>
<ul>
<li>Term length: 1&ndash;7 years (configurable)</li>
<li><strong>Rotation:</strong> Members take turns in membership order</li>
<li><strong>Most Seats:</strong> The member with the most legislative seats becomes president</li>
<li><strong>Random:</strong> A random member is selected each term</li>
</ul>

<h3>Solidarity Fund</h3>
<p>If enabled in the charter, members contribute cash each quarter (in $50k increments) to a shared fund. The fund can be spent on:</p>
<ul>
<li><strong>Back-channel transfers</strong> &mdash; Send cash to another member, drawn from the fund (25% exposure risk)</li>
<li><strong>Funding org actions</strong> &mdash; Rallies, symposiums, and other collective actions</li>
</ul>
<p>The resource sharing cap (if set) limits how many transfers each member can make per term. Headquarters upkeep draws $50k/tick from the fund.</p>

<h3>IPO Actions</h3>
<table>
<tr><th>Action</th><th>Cost</th><th>Effect</th></tr>
<tr><td><strong>Targeted Rally</strong></td><td>$200k</td><td>Roll for approval change for one other member faction (+8 to &minus;1 range)</td></tr>
<tr><td><strong>Global Rally</strong></td><td>$350k</td><td>Roll for every member faction independently (president only)</td></tr>
<tr><td><strong>Back-Channel</strong></td><td>$100k overhead + transfer (or fund-source: amount drawn from fund)</td><td>Secret cash transfer to another member (25% exposure risk if drawn from fund)</td></tr>
<tr><td><strong>Joint Statement</strong></td><td>$50k</td><td>President issues org-wide statement</td></tr>
<tr><td><strong>Symposium</strong></td><td>Vote required</td><td>Shift a target nation's ideology by +3 on a chosen axis (4-tick delay, 20-tick cooldown)</td></tr>
</table>

<h3>Voting</h3>
<ul>
<li>Votes last <strong>8 ticks</strong> and can be for membership, charter amendments, actions, or symposiums</li>
<li>Maximum <strong>5 concurrent votes</strong> per organisation</li>
<li>Ballot options: Yes, No, or Abstain</li>
<li>Pass condition depends on charter: <strong>Majority</strong> (&gt;50%) or <strong>Unanimous</strong></li>
<li>Ballots can be <strong>public</strong> (names shown) or <strong>secret</strong> (anonymous) per the charter</li>
</ul>
</div></details>

<details><summary>Sovereignty Constraints</summary><div>
<p>Certain active Major Initiative treaties restrict your ability to change domestic policies. While the treaty is in force, the affected policy sectors are <strong>blocked</strong> from new legislation:</p>

<table>
<tr><th>Treaty</th><th>Condition</th><th>Blocked Sectors</th></tr>
<tr><td><strong>Open Borders</strong></td><td>Full Freedom of Movement</td><td>Immigration, Labor</td></tr>
<tr><td><strong>Open Borders</strong></td><td>Work &amp; Residency / Labor Mobility</td><td>Labor</td></tr>
<tr><td><strong>Mutual Extradition</strong></td><td>Includes Political Offenses</td><td>Governance</td></tr>
<tr><td><strong>Environmental Accord</strong></td><td>Strict or Binding Pollution Standards</td><td>Energy</td></tr>
</table>
<p>To regain policy freedom, you must either <strong>withdraw</strong> from the treaty (costing relations and reputation) or wait for it to expire.</p>

<p><em>Tip: Before signing a Major Initiative, check which domestic policy sectors it will lock. A treaty that blocks Labor policy changes could prevent you from responding to an unemployment crisis.</em></p>
</div></details>

<details><summary>Timing &amp; Cooldowns Reference</summary><div>
<table>
<tr><th>Element</th><th>Duration</th></tr>
<tr><td>Ambassador confirmation vote</td><td>6 ticks</td></tr>
<tr><td>Ambassador term length</td><td>60 ticks (~5 years)</td></tr>
<tr><td>Trade negotiation default expiry</td><td>4 ticks</td></tr>
<tr><td>Trade negotiation extension</td><td>+12 ticks (max 3 extensions)</td></tr>
<tr><td>Trade ratification vote</td><td>6 ticks</td></tr>
<tr><td>FM review window (minor initiatives)</td><td>3 ticks</td></tr>
<tr><td>Major initiative ratification vote</td><td>6 ticks (both parliaments)</td></tr>
<tr><td>Major initiative re-propose cooldown</td><td>8 ticks</td></tr>
<tr><td>State visit acceptance window</td><td>3 ticks</td></tr>
<tr><td>Symposium cooldown</td><td>20 ticks</td></tr>
<tr><td>IPO vote duration</td><td>8 ticks</td></tr>
<tr><td>IPO max concurrent votes</td><td>5</td></tr>
<tr><td>Aid condition review interval</td><td>12 ticks (annually)</td></tr>
<tr><td>Environmental accord compliance window</td><td>24 ticks</td></tr>
</table>
</div></details>
`
    }
};

// Placeholder for tabs without a guide yet
const placeholderGuide = {
    title: 'Guide',
    html: `
<div style="text-align:center; padding: 40px 20px;">
    <div style="font-size: 2.5rem; margin-bottom: 16px; opacity: 0.5;">&#x1F4D6;</div>
    <h2 style="border: none; margin-bottom: 8px;">Guide Coming Soon</h2>
    <p style="color: #888;">A detailed guide for this page is being written. Check back later!</p>
</div>
`
};

let overlayEl = null;

function createOverlay() {
    if (overlayEl) return overlayEl;
    overlayEl = document.createElement('div');
    overlayEl.className = 'guide-overlay';
    overlayEl.id = 'guide-overlay';
    overlayEl.innerHTML = `
        <div class="guide-panel" id="guide-panel">
            <div class="guide-panel-header">
                <span class="guide-panel-title" id="guide-panel-title"></span>
                <button class="guide-close" id="guide-close">&times;</button>
            </div>
            <div id="guide-panel-body"></div>
        </div>
    `;
    document.body.appendChild(overlayEl);

    // Close on X button
    overlayEl.querySelector('#guide-close').addEventListener('click', closeGuide);

    // Close on click outside panel
    overlayEl.addEventListener('click', (e) => {
        if (e.target === overlayEl) closeGuide();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlayEl.classList.contains('active')) closeGuide();
    });

    return overlayEl;
}

export function openGuide() {
    const tab = window.__currentTab || 'dashboard';
    const guide = guideContent[tab] || placeholderGuide;
    const overlay = createOverlay();

    document.getElementById('guide-panel-title').textContent = guide.title;
    document.getElementById('guide-panel-body').innerHTML = guide.html;
    overlay.classList.add('active');
}

function closeGuide() {
    if (overlayEl) overlayEl.classList.remove('active');
}

// Guide button setup is now handled by common.js (lazy-loaded on click)
