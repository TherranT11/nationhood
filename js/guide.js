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
<li><strong>GDP Growth</strong>: <code>monthly_change% = ((gdp_growth - 50) / 50) &times; 3</code>. Range: &minus;3% to +3%/month.</li>
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
<p><code>monthly% = ((gdp_growth - 50) / 50) &times; 3</code></p>
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
