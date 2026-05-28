-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD NATION — admin tab injection
-- ═══════════════════════════════════════════════════════════════════════════════
-- Injects the "Add Nation" tab button + form into the database-stored admin panel
-- HTML (system_config.admin_panel_html), loaded by admin.html via get_admin_panel.
-- JS handlers (renderAddNationStats, fillNationDefaults, onAddNationGovType,
-- loadAddNationPolicies, createNation) live in admin.html and call the
-- admin_create_nation RPC (20270349_admin_create_nation_rpc.sql).
--
-- Pattern mirrors 20270135_provinces_phase1_admin_tab.sql:
--   1. Tab button — inserted after the existing "Provinces" tab button.
--   2. Tab content <div id="tab-addnation"> — inserted before the Danger Zone tab.
-- The stat-input grid (#nn-stats-grid) and policy checklist (#nn-policies-list)
-- are empty containers that the JS fills on panel load.
--
-- Idempotent: each UPDATE is guarded by `value NOT LIKE '%addnation%'`.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Step 1: Tab button, after the Provinces tab button.
UPDATE system_config
SET value = REPLACE(
    value,
    '<button class="tab" onclick="showTab(''provinces'')">Provinces</button>',
    '<button class="tab" onclick="showTab(''provinces'')">Provinces</button>' || chr(10) ||
    '            <button class="tab" onclick="showTab(''addnation'')">Add Nation</button>'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value NOT LIKE '%showTab(''addnation'')%';

-- Step 2: Tab content, before the Danger Zone tab.
UPDATE system_config
SET value = REPLACE(
    value,
    '        <!-- ==================== DANGER ZONE TAB ==================== -->',
    '        <!-- ==================== ADD NATION TAB ==================== -->
        <div class="tab-content" id="tab-addnation">
            <h2>Add Nation</h2>
            <p style="color:#888; font-size:0.9rem; margin-bottom:16px;">
                Seeds a complete, playable nation in one transaction: base row + stats,
                profile, vacant cabinet, neutral diplomatic relations with every existing
                nation, a caretaker administration, and (optionally) pre-activated structural
                policies. Default sectors are seeded automatically. Stats left untouched
                default to 50 &mdash; use <strong>Fill sensible defaults</strong> to pre-fill a
                realistic spread you can tweak.
            </p>

            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px;">
                <div class="input-group"><label>Name</label><input type="text" id="nn-name" maxlength="60" placeholder="e.g. Aurelia"></div>
                <div class="input-group"><label>Official Name</label><input type="text" id="nn-official_name" maxlength="120" placeholder="e.g. Republic of Aurelia"></div>
                <div class="input-group"><label>Capital</label><input type="text" id="nn-capital" maxlength="80" placeholder="e.g. Aurelia City"></div>
                <div class="input-group"><label>Continent</label><input type="text" id="nn-continent" list="nn-continent-list" maxlength="40" placeholder="e.g. Meridian"><datalist id="nn-continent-list"></datalist></div>
                <div class="input-group">
                    <label>Government Type</label>
                    <select id="nn-govtype" onchange="onAddNationGovType()">
                        <option value="parliamentary">Parliamentary Democracy</option>
                        <option value="presidential">Presidential Republic</option>
                        <option value="semipresidential">Semi-Presidential</option>
                        <option value="constitutional_monarchy">Constitutional Monarchy</option>
                        <option value="absolute_monarchy">Absolute Monarchy</option>
                    </select>
                </div>
                <div class="input-group"><label>Total Seats</label><input type="number" id="nn-total_seats" min="1" max="1000" value="150"></div>
                <div class="input-group"><label>Max Parties</label><input type="number" id="nn-max_parties" min="1" max="30" value="8"></div>
            </div>

            <h3 style="margin:18px 0 6px; font-size:0.95rem;">Head of State</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px;">
                <div class="input-group"><label>Title</label><input type="text" id="nn-hos_title" maxlength="40" value="President"></div>
                <div class="input-group"><label>First Name</label><input type="text" id="nn-hos_first" maxlength="60"></div>
                <div class="input-group"><label>Last Name</label><input type="text" id="nn-hos_last" maxlength="60"></div>
                <div class="input-group"><label>Age</label><input type="number" id="nn-hos_age" min="18" max="100" value="55"></div>
                <div class="input-group" id="nn-dynasty-wrap" style="display:none;"><label>Dynasty Name</label><input type="text" id="nn-dynasty_name" maxlength="80" placeholder="e.g. House of Ashgrove"></div>
            </div>

            <h3 style="margin:18px 0 6px; font-size:0.95rem;">Headline Economy &amp; Demographics</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px;">
                <div class="input-group"><label>Population</label><input type="number" id="nn-population" min="1" value="10000000"></div>
                <div class="input-group"><label>Eligible Voters</label><input type="number" id="nn-eligible_voters" min="0" value="8000000"></div>
                <div class="input-group"><label>GDP ($)</label><input type="number" id="nn-gdp" min="0" value="500000000000"></div>
                <div class="input-group"><label>Debt ($)</label><input type="number" id="nn-debt" min="0" value="100000000000"></div>
            </div>

            <h3 style="margin:18px 0 6px; font-size:0.95rem;">Schedule</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px;">
                <div class="input-group" id="nn-presterm-wrap"><label>Presidential Term (ticks)</label><input type="number" id="nn-presidential_term_ticks" min="1" value="48"></div>
                <div class="input-group" id="nn-preslimit-wrap"><label>Presidential Term Limit</label><input type="number" id="nn-presidential_term_limit" min="0" value="2"></div>
                <div class="input-group" id="nn-parlterm-wrap"><label>Parliamentary Term (ticks)</label><input type="number" id="nn-parliamentary_term_ticks" min="1" value="48"></div>
            </div>
            <p id="nn-election-note" style="color:#888; font-size:0.8rem; margin-top:4px;"></p>

            <h3 style="margin:18px 0 6px; font-size:0.95rem;">Profile (optional)</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px;">
                <div class="input-group"><label>Flag URL</label><input type="text" id="nn-flag_url" placeholder="assets/flags/Aurelia.png"></div>
                <div class="input-group"><label>Demonym</label><input type="text" id="nn-demonym" maxlength="60" placeholder="Aurelian"></div>
                <div class="input-group"><label>Currency Name</label><input type="text" id="nn-currency_name" maxlength="60"></div>
                <div class="input-group"><label>Religion</label><input type="text" id="nn-religion" maxlength="80"></div>
                <div class="input-group"><label>Languages</label><input type="text" id="nn-languages" maxlength="120"></div>
                <div class="input-group"><label>Founded Year</label><input type="text" id="nn-founded_year" maxlength="12"></div>
                <div class="input-group"><label>Motto</label><input type="text" id="nn-motto" maxlength="120"></div>
            </div>
            <div class="input-group"><label>Overview</label><textarea id="nn-overview" rows="3" style="width:100%;"></textarea></div>

            <h3 style="margin:18px 0 6px; font-size:0.95rem;">Diplomacy</h3>
            <div class="input-group" style="max-width:280px;"><label>Default Proximity to all nations (0 near &ndash; 100 far)</label><input type="number" id="nn-proximity" min="0" max="100" value="80"></div>

            <details style="margin-top:16px;">
                <summary style="cursor:pointer; font-weight:600;">National Statistics (0&ndash;100 unless noted)</summary>
                <div style="margin:10px 0;">
                    <button class="btn" onclick="fillNationDefaults()">Fill sensible defaults</button>
                    <button class="btn" onclick="renderAddNationStats(true)">Reset all to 50</button>
                </div>
                <div id="nn-stats-grid" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:8px;"></div>
            </details>

            <details style="margin-top:16px;">
                <summary style="cursor:pointer; font-weight:600;">Pre-activate Structural Policies (optional)</summary>
                <p style="color:#888; font-size:0.8rem; margin:8px 0;">Checked policies are inserted as already-baked active law (their effects are assumed pre-baked into the stats above).</p>
                <div style="margin-bottom:8px;"><input type="text" id="nn-policy-filter" placeholder="Filter policies..." oninput="filterAddNationPolicies()" style="width:100%; max-width:360px;"></div>
                <div id="nn-policies-list" style="max-height:260px; overflow-y:auto; border:1px solid #333; padding:8px;">Loading policies...</div>
            </details>

            <div style="margin-top:20px;">
                <button class="btn btn-primary" onclick="createNation(this)">Create Nation</button>
                <span id="nn-status" style="margin-left:12px; font-size:0.9rem;"></span>
            </div>
        </div>

        <!-- ==================== DANGER ZONE TAB ==================== -->'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value NOT LIKE '%id="tab-addnation"%';

COMMIT;
