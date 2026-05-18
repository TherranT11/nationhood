-- ═══════════════════════════════════════════════════════════════════════════════
-- PROVINCES PHASE 1 — admin tab injection
-- ═══════════════════════════════════════════════════════════════════════════════
-- Injects the "Provinces" tab into the database-stored admin panel HTML
-- (system_config.admin_panel_html). Must run AFTER 20270135_provinces_phase1.sql
-- (the schema migration) and after 20260426_sectors_phase0_admin_tab.sql (the
-- Sectors tab this anchors on). JS handlers live in admin.html itself.
--
-- Pattern follows 20260426_sectors_phase0_admin_tab.sql:
--   1. Insert a tab button in the tab strip (after the existing Sectors tab)
--   2. Insert the tab-content <div> in the panel body (before Danger Zone)
--
-- Truly idempotent: each UPDATE is guarded by `value NOT LIKE '%provinces%'`
-- so a re-run can't duplicate the tab even if the anchor still matches.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Add the "Provinces" tab button after the "Sectors" tab button
UPDATE system_config
SET value = REPLACE(
    value,
    '<button class="tab" onclick="showTab(''sectors'')">Sectors</button>',
    '<button class="tab" onclick="showTab(''sectors'')">Sectors</button>' || chr(10) ||
    '            <button class="tab" onclick="showTab(''provinces'')">Provinces</button>'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value NOT LIKE '%showTab(''provinces'')%';

-- Step 2: Add the Provinces tab-content div, placed before the Danger Zone tab
UPDATE system_config
SET value = REPLACE(
    value,
    '        <!-- ==================== DANGER ZONE TAB ==================== -->',
    '        <!-- ==================== PROVINCES TAB ==================== -->
        <div class="tab-content" id="tab-provinces">
            <h2>Provinces Management</h2>
            <p style="color:#888; font-size:0.9rem; margin-bottom:20px;">
                Split each sector''s national <strong>Weight</strong> across this nation''s provinces.
                Per sector, the province weights must sum <strong>exactly</strong> to the nation weight
                (the partition model) — Save is blocked until every sector is balanced.
                A province weight may be <strong>0</strong> (sector absent there); the nation weight is read-only here
                (edit it in the Sectors tab). Phase 1 is display-only: the election map shows these splits but the
                election engine still uses the nation weight.
            </p>

            <div class="input-group">
                <label>Select Nation</label>
                <select id="province-nation-select" onchange="onProvinceNationSelect()">
                    <option value="">-- Choose a nation --</option>
                </select>
            </div>

            <div id="province-nation-info" class="hidden">

                <div style="display:flex; gap:12px; align-items:flex-end; margin:16px 0; flex-wrap:wrap;">
                    <div class="input-group" style="flex:0 0 240px; margin-bottom:0;">
                        <label>New Province Name</label>
                        <input type="text" id="new-province-name" placeholder="e.g. Northshire" maxlength="80">
                    </div>
                    <button class="btn btn-primary" onclick="addProvince(this)">+ Add Province</button>
                    <span id="province-add-status" style="font-weight:bold;"></span>
                </div>

                <div class="weight-validator" id="province-balance-bar" style="margin:16px 0;">
                    <span class="weight-validator-label">Balance:</span>
                    <span class="weight-validator-status" id="province-balance-status">—</span>
                </div>

                <div id="province-grid-container" style="margin:16px 0; overflow-x:auto;"></div>

                <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:16px;">
                    <button class="btn btn-success" id="province-save-btn" onclick="saveProvinceWeights(this)">Save Weights</button>
                    <span id="province-save-status" style="font-weight:bold;"></span>
                </div>
            </div>
        </div>

        <!-- ==================== DANGER ZONE TAB ==================== -->'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value NOT LIKE '%id="tab-provinces"%';
