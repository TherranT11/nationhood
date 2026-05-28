-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD PARTY — admin tab injection
-- ═══════════════════════════════════════════════════════════════════════════════
-- Injects the "Add Party" tab button + form into system_config.admin_panel_html.
-- JS handlers (loadAddPartyInit, createParty) live in admin.html and call the
-- admin_create_party RPC (20270351). The nation dropdown (#ap-nation) and
-- archetype dropdown (#ap-archetype) are filled by the JS on panel load — the
-- archetype list is imported from js/game/archetypes.js so it never drifts.
--
-- Pattern mirrors 20270350_add_nation_admin_tab.sql:
--   1. Tab button — inserted after the "Add Nation" tab button.
--   2. Tab content <div id="tab-addparty"> — inserted before the Danger Zone tab.
-- Idempotent: guarded by `value NOT LIKE '%addparty%'` / '%tab-addparty%'.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Step 1: Tab button, after the Add Nation tab button.
UPDATE system_config
SET value = REPLACE(
    value,
    '<button class="tab" onclick="showTab(''addnation'')">Add Nation</button>',
    '<button class="tab" onclick="showTab(''addnation'')">Add Nation</button>' || chr(10) ||
    '            <button class="tab" onclick="showTab(''addparty'')">Add Party</button>'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value NOT LIKE '%showTab(''addparty'')%';

-- Step 2: Tab content, before the Danger Zone tab.
UPDATE system_config
SET value = REPLACE(
    value,
    '        <!-- ==================== DANGER ZONE TAB ==================== -->',
    '        <!-- ==================== ADD PARTY TAB ==================== -->
        <div class="tab-content" id="tab-addparty">
            <h2>Add Party</h2>
            <p style="color:#888; font-size:0.9rem; margin-bottom:16px;">
                Creates a seated NPC party in the chosen nation. Sector popularity is
                seeded from the selected archetype (the same tiers a player party gets).
                The party has no owner and takes no actions on its own &mdash; it simply
                holds seats. Auto-voting is a separate, later step.
            </p>

            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px;">
                <div class="input-group">
                    <label>Nation</label>
                    <select id="ap-nation"><option value="">-- Choose a nation --</option></select>
                </div>
                <div class="input-group"><label>Party Name</label><input type="text" id="ap-name" maxlength="80" placeholder="e.g. Aurelian Labour Party"></div>
                <div class="input-group"><label>Abbreviation</label><input type="text" id="ap-abbr" maxlength="8" placeholder="e.g. ALP"></div>
                <div class="input-group"><label>Starting Seats</label><input type="number" id="ap-seats" min="0" max="1000" value="0"></div>
                <div class="input-group">
                    <label>Archetype (sets sector strongholds)</label>
                    <select id="ap-archetype"><option value="">(none)</option></select>
                </div>
                <div class="input-group"><label>Party Color</label><input type="color" id="ap-color" value="#5b9bd5"></div>
                <div class="input-group"><label>Logo Icon</label><input type="text" id="ap-logo" maxlength="40" value="star"></div>
                <div class="input-group"><label>Custom Logo URL (optional)</label><input type="text" id="ap-logo-url" placeholder="assets/logos/alp.png"></div>
            </div>

            <div class="input-group"><label>Description</label><textarea id="ap-desc" rows="2" style="width:100%;"></textarea></div>

            <h3 style="margin:14px 0 6px; font-size:0.95rem;">Leader (optional)</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px;">
                <div class="input-group"><label>First Name</label><input type="text" id="ap-leader-first" maxlength="50"></div>
                <div class="input-group"><label>Last Name</label><input type="text" id="ap-leader-last" maxlength="50"></div>
                <div class="input-group"><label>Age</label><input type="number" id="ap-leader-age" min="18" max="100"></div>
            </div>

            <div style="margin-top:18px;">
                <button class="btn btn-primary" onclick="createParty(this)">Create Party</button>
                <span id="ap-status" style="margin-left:12px; font-size:0.9rem;"></span>
            </div>
        </div>

        <!-- ==================== DANGER ZONE TAB ==================== -->'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value NOT LIKE '%id="tab-addparty"%';

COMMIT;
