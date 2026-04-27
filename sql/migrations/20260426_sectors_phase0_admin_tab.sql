-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTORS PHASE 0 — admin tab injection
-- ═══════════════════════════════════════════════════════════════════════════════
-- Injects the "Sectors" tab into the database-stored admin panel HTML
-- (system_config.admin_panel_html). Must run AFTER 20260426_sectors_phase0.sql
-- (the schema migration). JS handlers live in admin.html itself.
--
-- Pattern follows 20260405_admin_issues_tab.sql:
--   1. Insert a tab button in the tab strip (after the existing Voters tab)
--   2. Insert the tab-content <div> in the panel body
--
-- Idempotent: if the Sectors tab already exists, the REPLACE is a no-op because
-- the search string will not match.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Add the "Sectors" tab button after the "Voters" tab button
UPDATE system_config
SET value = REPLACE(
    value,
    '<button class="tab" onclick="showTab(''voters'')">Voters</button>',
    '<button class="tab" onclick="showTab(''voters'')">Voters</button>' || chr(10) ||
    '            <button class="tab" onclick="showTab(''sectors'')">Sectors</button>'
),
    updated_at = now()
WHERE key = 'admin_panel_html';

-- Step 2: Add the Sectors tab-content div, placed before the Danger Zone tab
UPDATE system_config
SET value = REPLACE(
    value,
    '        <!-- ==================== DANGER ZONE TAB ==================== -->',
    '        <!-- ==================== SECTORS TAB ==================== -->
        <div class="tab-content" id="tab-sectors">
            <h2>Sectors Management</h2>
            <p style="color:#888; font-size:0.9rem; margin-bottom:20px;">
                Per-nation voter sectors. Each sector has a <strong>Weight</strong> (1-3) and a <strong>Base Turnout</strong> (0.50-1.30).
                Default sectors can be renamed and reweighted but never deleted; custom sectors can be soft-deleted (popularity history is preserved).
                Bills will reference sectors by their internal key, never by name, so renaming a sector is safe.
            </p>

            <div class="input-group">
                <label>Select Nation</label>
                <select id="sector-nation-select" onchange="onSectorNationSelect()">
                    <option value="">-- Choose a nation --</option>
                </select>
            </div>

            <div id="sector-nation-info" class="hidden">

                <div class="weight-validator" id="sector-totals-bar" style="margin:16px 0;">
                    <span class="weight-validator-label">Total Weight:</span>
                    <span class="weight-validator-value" id="sector-total-weight">0</span>
                    <span class="weight-validator-status" id="sector-weight-status"></span>
                    <span style="display:inline-block;width:24px;"></span>
                    <span class="weight-validator-label">Sectors:</span>
                    <span class="weight-validator-value" id="sector-count-display">0 default + 0 custom</span>
                </div>

                <div id="sector-list-container" style="margin:16px 0; overflow-x:auto;"></div>

                <div style="border-top:2px solid #333; padding-top:20px; margin-top:24px;">
                    <h3 style="color:#ffcc00; font-size:1rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">
                        Add Custom Sector
                    </h3>
                    <p style="color:#888; font-size:0.85rem; margin-bottom:12px;">
                        New custom sectors are auto-keyed from their name (e.g. &quot;Coastal Trade&quot; -&gt; <code>COASTAL_TRADE</code>) and start with popularity 0 for every existing party in this nation.
                    </p>
                    <div class="input-group">
                        <label>Sector Name</label>
                        <input type="text" id="new-sector-name" placeholder="e.g. Coastal Trade" maxlength="80">
                    </div>
                    <div class="input-group">
                        <label>Description (optional)</label>
                        <input type="text" id="new-sector-description" placeholder="Short description shown to players" maxlength="240">
                    </div>
                    <div style="display:flex; gap:12px; align-items:flex-end; margin-bottom:12px; flex-wrap:wrap;">
                        <div class="input-group" style="flex:0 0 120px; margin-bottom:0;">
                            <label>Weight</label>
                            <input type="number" id="new-sector-weight" min="1" max="3" step="1" value="1">
                        </div>
                        <div class="input-group" style="flex:0 0 160px; margin-bottom:0;">
                            <label>Base Turnout</label>
                            <input type="number" id="new-sector-turnout" min="0.50" max="1.30" step="0.05" value="1.00">
                        </div>
                        <button class="btn btn-primary" onclick="addCustomSector()">+ Add Sector</button>
                    </div>
                    <div id="sector-add-status" style="margin-top:8px; font-weight:bold;"></div>
                </div>
            </div>
        </div>

        <!-- ==================== DANGER ZONE TAB ==================== -->'
),
    updated_at = now()
WHERE key = 'admin_panel_html';
