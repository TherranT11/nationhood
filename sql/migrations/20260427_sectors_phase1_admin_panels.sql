-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTORS PHASE 1 — admin panel additions: popularity editor + diagnostics
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds two new sections to the existing Sectors admin tab:
--
--   1. Faction Popularity Editor — bulk grid (rows = factions, cols = active
--      sectors) for setting faction_sector_popularity values 0.0–10.0.
--   2. Sector Diagnostics — read-only TWP + per-sector contribution breakdown
--      computed live from the calc module (js/game/sectors.js).
--
-- JS handlers live in admin.html (loadFactionPopularityEditor,
-- saveFactionPopularityChanges, loadSectorDiagnostics, etc.).
--
-- Idempotency: the search anchor includes the sequence of closing tags that
-- only appears BEFORE injection. After this migration runs once, the new
-- markup sits between sector-add-status and the Danger Zone comment, so the
-- original anchor no longer matches — re-running is a safe no-op.
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE system_config
SET value = REPLACE(
    value,
    '                    <div id="sector-add-status" style="margin-top:8px; font-weight:bold;"></div>' || chr(10) ||
    '                </div>' || chr(10) ||
    '            </div>' || chr(10) ||
    '        </div>' || chr(10) ||
    chr(10) ||
    '        <!-- ==================== DANGER ZONE TAB ==================== -->',

    '                    <div id="sector-add-status" style="margin-top:8px; font-weight:bold;"></div>' || chr(10) ||
    '                </div>' || chr(10) ||
    chr(10) ||
    '                <!-- Phase 1: Faction popularity editor -->' || chr(10) ||
    '                <div style="border-top:2px solid #333; padding-top:20px; margin-top:24px;">' || chr(10) ||
    '                    <h3 style="color:#ffcc00; font-size:1rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">' || chr(10) ||
    '                        Faction Popularity Editor' || chr(10) ||
    '                    </h3>' || chr(10) ||
    '                    <p style="color:#888; font-size:0.85rem; margin-bottom:12px;">' || chr(10) ||
    '                        Set each faction''s popularity per active sector (0.0 to 10.0, in 0.1 steps). Changes are buffered &mdash; click <strong>Save Changes</strong> to persist them. Phase 0 created these rows at 0.0 for every faction.' || chr(10) ||
    '                    </p>' || chr(10) ||
    '                    <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">' || chr(10) ||
    '                        <button class="btn btn-primary" onclick="loadFactionPopularityEditor()">Load Editor</button>' || chr(10) ||
    '                        <button class="btn btn-success" id="sector-popularity-save-btn" onclick="saveFactionPopularityChanges()" style="display:none;">Save Changes</button>' || chr(10) ||
    '                        <span id="sector-popularity-editor-status" style="font-weight:bold;"></span>' || chr(10) ||
    '                    </div>' || chr(10) ||
    '                    <div id="sector-popularity-editor-container" style="margin-top:16px; overflow-x:auto;"></div>' || chr(10) ||
    '                </div>' || chr(10) ||
    chr(10) ||
    '                <!-- Phase 1: Sector diagnostics -->' || chr(10) ||
    '                <div style="border-top:2px solid #333; padding-top:20px; margin-top:24px;">' || chr(10) ||
    '                    <h3 style="color:#ffcc00; font-size:1rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">' || chr(10) ||
    '                        Sector Diagnostics' || chr(10) ||
    '                    </h3>' || chr(10) ||
    '                    <p style="color:#888; font-size:0.85rem; margin-bottom:12px;">' || chr(10) ||
    '                        For each faction in this nation, the calc module computes <strong>Total Weighted Popularity</strong> (TWP = popularity &times; weight &times; base_turnout, summed across active sectors) and a per-sector contribution breakdown. Recomputes from current DB state every time you click Load.' || chr(10) ||
    '                    </p>' || chr(10) ||
    '                    <button class="btn btn-primary" onclick="loadSectorDiagnostics()">Load Diagnostics</button>' || chr(10) ||
    '                    <div id="sector-diagnostics-container" style="margin-top:16px; overflow-x:auto;"></div>' || chr(10) ||
    '                </div>' || chr(10) ||
    '            </div>' || chr(10) ||
    '        </div>' || chr(10) ||
    chr(10) ||
    '        <!-- ==================== DANGER ZONE TAB ==================== -->'
),
    updated_at = now()
WHERE key = 'admin_panel_html';
