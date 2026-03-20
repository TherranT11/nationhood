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
<p>Any party holding at least <strong>15% of total seats</strong> can call a confidence vote at any time. It passes when more than 50% of <em>all seated MPs</em> vote in favor &mdash; not just a majority of votes cast.</p>
<table>
<tr><th>Result</th><th>Effect</th></tr>
<tr><td><strong>Win</strong></td><td>Government stability +5, opposition loses 2 momentum</td></tr>
<tr><td><strong>Lose</strong></td><td>PM resigns, caretaker government formed, coalition negotiation restarts</td></tr>
</table>

<h3>Cabinet</h3>
<p>The PM appoints cabinet ministers. In a coalition government, seats are distributed between partners roughly proportional to seat share. Refusing to give a partner cabinet seats risks breaking the coalition.</p>
<p>Each ministry produces ongoing stat effects based on minister performance and funding level. Ministers can be dismissed by the PM at any time for 1 AP. Dismissing a coalition partner's minister without warning may trigger a coalition collapse.</p>

<h3>Acting Ministers</h3>
<p>If a ministry is vacant, the PM can appoint an <strong>Acting Minister</strong> by directive. Acting ministers provide 50% of a confirmed minister's stat bonus and cost &minus;3 Government Approval per tick they remain unconfirmed. Maximum 3 acting ministers at any time.</p>

<h3>Passing Legislation</h3>
<ol>
<li>Bill sponsor submits to Committee (2 AP). All parties can add or remove articles.</li>
<li>Sponsor sends the bill to the floor for a vote.</li>
<li>Each party votes Yes, No, or Abstain. Votes weighted by seat count.</li>
<li>Bill passes if more than 50% of seated votes are Yes. If not reached within 3 ticks, the bill fails.</li>
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
<p>The President can appoint an Acting Minister by Executive Order if confirmation fails. Acting ministers work at <strong>50% effectiveness</strong> and cost &minus;5 Government Approval on appointment plus &minus;3 per tick. Maximum 3 at any time.</p>

<h3>Signing and Vetoing Bills</h3>
<p>All bills passed by the legislature go to the President's desk. The President has <strong>2 ticks</strong> to act:</p>
<table>
<tr><th>Action</th><th>Effect</th></tr>
<tr><td><strong>Sign</strong></td><td>Bill takes effect next tick</td></tr>
<tr><td><strong>Veto</strong></td><td>Returned to parliament. Requires 2/3 supermajority to override.</td></tr>
<tr><td><strong>Pocket (do nothing)</strong></td><td>Bill auto-signs after 2 ticks</td></tr>
</table>
<p class="guide-tip">A veto override requires 2/3 of all seated votes. If override fails, the bill is dead and cannot be resubmitted for 3 ticks.</p>

<h3>Executive Orders</h3>
<table>
<tr><th>Order</th><th>AP Cost</th></tr>
<tr><td>Acting Minister Appointment</td><td>8 AP</td></tr>
<tr><td>Presidential Tax Adjustment (&plusmn;3% on one tax type)</td><td>6 AP</td></tr>
<tr><td>Emergency Price Controls (freeze fuel/food for 3 ticks)</td><td>10 AP</td></tr>
<tr><td>Declaration of National Emergency (extra AP, bypass one vote/tick, 4 ticks)</td><td>12 AP</td></tr>
<tr><td>Executive Pardon (clear corruption crisis or scandal)</td><td>5 AP</td></tr>
<tr><td>Infrastructure Directive (fast-track infrastructure outcome)</td><td>9 AP</td></tr>
<tr><td>Presidential Censure (condemn rival party, &minus;5 their approval)</td><td>4 AP</td></tr>
</table>

<h3>The Overreach Bar</h3>
<p>Every executive order contributes to the Overreach Bar &mdash; a public counter tracking orders issued in the last 10 ticks.</p>
<table>
<tr><th>Orders (10 ticks)</th><th>Effect</th></tr>
<tr><td>0&ndash;2</td><td>Normal. No penalty.</td></tr>
<tr><td>3&ndash;4</td><td>&ldquo;Governing by Decree&rdquo; label. &minus;2 approval/tick.</td></tr>
<tr><td>5+</td><td>&ldquo;Authoritarian Drift&rdquo; label. &minus;5 approval/tick. Opposition can call joint motion to strip executive powers.</td></tr>
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
<p>Two-stage process: first a majority vote to begin proceedings, then a 2/3 supermajority to convict. Triggered by:</p>
<ul>
<li>A corruption crisis reaching a critical threshold</li>
<li>Overreach Bar maxed out</li>
<li>Any party with sufficient seats calling for proceedings</li>
</ul>
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

<details><summary>Autocratic System</summary><div>
<h3>How It Works</h3>
<p>Autocracy is a different political system. A strongman controls the nation, and factions vie for influence within the regime. All factions receive equal seat allocations that rebalance automatically when parties join or leave.</p>
<p>The autocratic action systems (loyalty, standing, regime health, embezzlement, coups, purges) are currently being redesigned. Check back for updates.</p>
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
