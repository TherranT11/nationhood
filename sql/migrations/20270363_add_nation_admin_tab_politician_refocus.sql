-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD NATION admin tab — politician refocus (HTML swap)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Replaces the two sections of the Add Nation tab that are now politician-only:
--
--   1. "Headline Economy & Demographics" — drops legacy nations.gdp / nations.debt
--      and nations.eligible_voters in favour of the five politician_* fields
--      (politician_gdp / politician_budget / politician_debt / politician_stability
--      / politician_civil_freedoms). Population stays — it's shared across surfaces.
--
--   2. "National Statistics" details — the 26-stat 0-100 grid is gone. The two
--      politician 0-100 stats now live inline in the Headline block above, so
--      this whole details block is removed (along with its Fill/Reset buttons).
--
-- Companion RPC migration 20270362 updates admin_create_nation to read these
-- fields and to mirror politician_gdp/politician_debt into the legacy gdp/debt
-- columns so the (legacy) parties surface keeps showing sensible numbers.
--
-- Idempotency: both REPLACEs are guarded — the first by the old "Eligible Voters"
-- input id (which is removed), the second by the old "National Statistics" summary.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Step 1: Swap the Headline Economy & Demographics section for the politician set.
UPDATE system_config
SET value = REPLACE(
    value,
    '            <h3 style="margin:18px 0 6px; font-size:0.95rem;">Headline Economy &amp; Demographics</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px;">
                <div class="input-group"><label>Population</label><input type="number" id="nn-population" min="1" value="10000000"></div>
                <div class="input-group"><label>Eligible Voters</label><input type="number" id="nn-eligible_voters" min="0" value="8000000"></div>
                <div class="input-group"><label>GDP ($)</label><input type="number" id="nn-gdp" min="0" value="500000000000"></div>
                <div class="input-group"><label>Debt ($)</label><input type="number" id="nn-debt" min="0" value="100000000000"></div>
            </div>',
    '            <h3 style="margin:18px 0 6px; font-size:0.95rem;">Politician Headline Stats</h3>
            <p style="color:#888; font-size:0.8rem; margin-bottom:8px;">The five stats that drive the Politician nation page. GDP / Budget / Debt are dollar values; Stability and Civil Freedoms are 0&ndash;100. Population is shared across surfaces.</p>
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px;">
                <div class="input-group"><label>Population</label><input type="number" id="nn-population" min="1" value="10000000"></div>
                <div class="input-group"><label>GDP ($)</label><input type="number" id="nn-politician_gdp" min="0" value="500000000000"></div>
                <div class="input-group"><label>Budget ($)</label><input type="number" id="nn-politician_budget" min="0" value="100000000000"></div>
                <div class="input-group"><label>Debt ($)</label><input type="number" id="nn-politician_debt" min="0" value="100000000000"></div>
                <div class="input-group"><label>Stability (0&ndash;100)</label><input type="number" id="nn-politician_stability" min="0" max="100" value="50"></div>
                <div class="input-group"><label>Civil Freedoms (0&ndash;100)</label><input type="number" id="nn-politician_civil_freedoms" min="0" max="100" value="50"></div>
            </div>'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value LIKE '%id="nn-eligible_voters"%';

-- Step 2: Remove the legacy 26-stat National Statistics details block entirely.
UPDATE system_config
SET value = REPLACE(
    value,
    '            <details style="margin-top:16px;">
                <summary style="cursor:pointer; font-weight:600;">National Statistics (0&ndash;100 unless noted)</summary>
                <div style="margin:10px 0;">
                    <button class="btn" onclick="fillNationDefaults()">Fill sensible defaults</button>
                    <button class="btn" onclick="renderAddNationStats()">Reset all to 50</button>
                </div>
                <div id="nn-stats-grid" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:8px;"></div>
            </details>

',
    ''
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value LIKE '%National Statistics (0&ndash;100 unless noted)%';

COMMIT;
