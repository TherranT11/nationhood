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
<tr><td><strong>Income Tax</strong></td><td>GDP &times; (rate/100) &times; 0.40 &times; collection rate</td></tr>
<tr><td><strong>Sales Tax</strong></td><td>GDP &times; (rate/100) &times; 0.30 &times; collection rate</td></tr>
<tr><td><strong>Corporate Tax</strong></td><td>GDP &times; (rate/100) &times; 0.10 &times; collection rate</td></tr>
<tr><td><strong>Tariffs</strong></td><td>Actual tariff revenue from trade engine</td></tr>
<tr><td><strong>Oil &amp; Gas</strong></td><td>GDP &times; (oil_and_gas/100) &times; 0.06 (only if stat &gt; 30, bypasses collection rate)</td></tr>
<tr><td><strong>Foreign Aid</strong></td><td>Aid received from other nations</td></tr>
</table>

<h3>Collection Rate</h3>
<p><code>(efficiency + (100 - corruption)) / 200</code></p>
<p class="guide-tip">Perfect efficiency (100) + zero corruption = 100% collection. Low efficiency and high corruption means lost revenue. Invest in efficiency before raising tax rates.</p>

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
<li>Proximity: (proximity/100) &times; 20</li>
<li>Embargo: &minus;40</li>
</ul>
<p class="guide-tip">Trade agreements significantly boost trade volume. An FTA gives +25 affinity.</p>

<h3>Free Trade Agreement Effects</h3>
<p>FTAs and PTAs create real tradeoffs &mdash; they boost trade but have ongoing economic costs:</p>
<table>
<tr><th>Effect</th><th>FTA</th><th>PTA</th></tr>
<tr><td><strong>Trade Affinity</strong></td><td>+25</td><td>+15</td></tr>
<tr><td><strong>Tariff Reduction</strong></td><td>100% all sectors</td><td>Per-article, per-sector</td></tr>
<tr><td><strong>Manufacturing Pressure</strong></td><td>&minus;0.1/tick manufacturing_output</td><td>&minus;0.05/tick (if manufactured_goods reduced)</td></tr>
<tr><td><strong>Sector Competition</strong></td><td>&minus;0.05/tick service &amp; manufacturing (if partner GDP &gt;2&times; yours)</td><td>&mdash;</td></tr>
<tr><td><strong>Polarization on Signing</strong></td><td>+3 both nations</td><td>&mdash;</td></tr>
</table>

<h4>Withdrawal Penalties</h4>
<p>Withdrawing from a trade agreement causes an immediate economic shock to <strong>both</strong> nations:</p>
<table>
<tr><th>Stat</th><th>FTA Withdrawal</th><th>PTA Withdrawal</th></tr>
<tr><td>GDP Growth</td><td>&minus;0.3</td><td>&minus;0.15</td></tr>
<tr><td>Foreign Investment</td><td>&minus;3</td><td>&minus;1</td></tr>
<tr><td>Stability</td><td>&minus;2</td><td>&minus;1</td></tr>
<tr><td>Polarization</td><td>+2</td><td>&mdash;</td></tr>
</table>
<p class="guide-tip">FTAs are powerful but hard to leave. Think carefully before signing &mdash; your manufacturing sector will feel the pressure, and withdrawal hurts both economies.</p>
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
<p><code>collection_rate = (efficiency + (100 - corruption)) / 200</code></p>
<p><code>income_tax = GDP &times; (rate/100) &times; 0.40 &times; collection_rate</code></p>
<p><code>sales_tax = GDP &times; (rate/100) &times; 0.30 &times; collection_rate</code></p>
<p><code>corporate_tax = GDP &times; (rate/100) &times; 0.10 &times; collection_rate</code></p>

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
<p>When you are ready to call a vote, click <strong>&ldquo;Send to Floor&rdquo;</strong>. To be eligible:</p>
<ul>
<li><strong>Standard bills</strong> &mdash; you need at least one co-sponsor (another faction that has accepted) <em>or</em> you must hold a simple majority of seats on your own.</li>
<li><strong>Foundational bills</strong> &mdash; you <em>must</em> have at least one co-sponsor. A solo majority is not enough.</li>
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

<details><summary>Special Bill Types</summary><div>
<h3>Foundational Bills</h3>
<p>Foundational bills change the constitutional structure of the nation. They cost <strong>3 AP</strong> to draft (vs. 2 AP for standard bills) and require a <strong>two-thirds supermajority</strong> to pass. They also <em>must</em> have at least one co-sponsor to advance from committee.</p>

<p>When drafting, select the <strong>Foundational</strong> sector in the policy picker. Available subtypes:</p>
<table>
<tr><th>Subtype</th><th>What It Changes</th></tr>
<tr><td><strong>Electoral Makeup</strong></td><td>Changes the total number of parliamentary seats (50&ndash;500).</td></tr>
<tr><td><strong>Head of State Title</strong></td><td>Renames the head of state (e.g., President, Chancellor, Supreme Leader).</td></tr>
<tr><td><strong>Term Length</strong></td><td>Changes how many ticks a presidential term lasts. Shorter terms increase polarization; longer terms reduce legitimacy.</td></tr>
<tr><td><strong>Term Limits</strong></td><td>Sets the maximum number of terms a president may serve, or removes term limits entirely.</td></tr>
<tr><td><strong>HoS Election Method</strong></td><td>Changes how the head of state is chosen: direct popular vote, appointed by parliament, or constitutional monarchy (hereditary).</td></tr>
</table>
<p>Foundational bills contain exactly <strong>one article</strong> and cannot have policy, text, or funding articles added.</p>

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

function openGuide() {
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

// Tab ID to display label
const TAB_LABELS = {
    dashboard: 'Home', nation: 'Nation', government: 'Government',
    politics: 'Politics', laws: 'Bills', diplomacy: 'Diplomacy',
    economy: 'Economy', events: 'Events', elections: 'Elections'
};

// Hidden on dashboard (no guide needed there)
const HIDDEN_TABS = ['dashboard', 'home'];

// Attach to guide button once DOM is ready
function attachGuideButton() {
    const btn = document.getElementById('guide-btn');
    if (!btn) return;

    const tab = window.__currentTab || 'dashboard';
    if (HIDDEN_TABS.includes(tab)) {
        btn.style.display = 'none';
        return;
    }

    const label = TAB_LABELS[tab] || tab.charAt(0).toUpperCase() + tab.slice(1);
    btn.textContent = label + ' Guide';
    btn.style.display = '';
    btn.addEventListener('click', openGuide);
}

// Run on import - use MutationObserver in case top bar renders after import
if (document.getElementById('guide-btn')) {
    attachGuideButton();
} else {
    const observer = new MutationObserver(() => {
        if (document.getElementById('guide-btn')) {
            attachGuideButton();
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
