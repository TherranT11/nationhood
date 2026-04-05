-- Add the "Issues" tab to the admin panel HTML stored in system_config.
-- Inserts the tab button after the Integrity tab button, and the tab-content div before the closing </div>.

-- Step 1: Add the tab button
UPDATE system_config
SET value = REPLACE(
    value,
    '<button class="tab" onclick="showTab(''integrity'')">Integrity</button>',
    '<button class="tab" onclick="showTab(''integrity'')">Integrity</button>' || chr(10) ||
    '            <button class="tab" onclick="showTab(''issues'')">Issues</button>'
),
    updated_at = now()
WHERE key = 'admin_panel_html';

-- Step 2: Add the tab content div (before the final closing </div>)
UPDATE system_config
SET value = REPLACE(
    value,
    '        <!-- ==================== INTEGRITY TAB ==================== -->',
    '        <!-- ==================== ISSUES SPAWNER TAB ==================== -->
        <div class="tab-content" id="tab-issues">
            <h2>Bilateral Issues Spawner</h2>
            <p style="color:#888; font-size:0.9rem; margin-bottom:15px;">
                Spawn bilateral issues between nations for testing. Select nations, issue type, starting conditions, and modifiers.
            </p>
            <div id="issue-spawner-panel" style="margin-bottom:24px;"></div>
            <h3 style="color:#ccc; margin-top:24px; margin-bottom:12px;">Active Issues</h3>
            <div id="is-active-list" style="background:#252525; border:1px solid #444; border-radius:4px; padding:12px;"><div style="color:#888;font-size:13px;">Switch to this tab to load.</div></div>
        </div>

        <!-- ==================== INTEGRITY TAB ==================== -->'
),
    updated_at = now()
WHERE key = 'admin_panel_html';
