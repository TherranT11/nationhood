-- ════════════════════════════════════════════════════════════════════
-- REMOVE the admin "Moderation" tab from the control panel
-- ════════════════════════════════════════════════════════════════════
-- The admin panel markup lives in system_config.admin_panel_html (served
-- by get_admin_panel() and injected into admin.html#admin-section). The
-- Chat Moderation tab was erroring ("more than one relationship was found
-- for 'group_chat_members' and 'factions'") and is being culled.
--
-- Targeted REPLACE (mirrors the add-tab pattern of 20270205 / 20270135)
-- so every other tab — including voters / provinces, which the static
-- seed_admin_panel.sql does NOT carry — is preserved. Re-seeding instead
-- would silently drop those.
--
-- Scope: the admin UI only. The group_chat_members mute/ban columns and
-- the chat system's enforcement are untouched (they're not part of this
-- tab). The orphaned JS handlers are removed from admin.html separately.
--
-- Idempotent: REPLACE no-ops if the markup is already gone. A guard at
-- the end raises a loud NOTICE if the markup didn't match (e.g. the live
-- value drifted from the seed) so the removal can't fail silently.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Remove the tab button (leading newline + indent consumed so no blank
--    line is left behind between the Issues button and the </div>).
UPDATE system_config
SET value = REPLACE(value, $mod$
            <button class="tab" onclick="showTab('moderation')">Moderation</button>$mod$, ''),
    updated_at = now()
WHERE key = 'admin_panel_html';

-- 2. Remove the tab-content panel.
UPDATE system_config
SET value = REPLACE(value, $mod$        <!-- ==================== MODERATION TAB ==================== -->
        <div class="tab-content" id="tab-moderation">
            <h2>🛡️ Chat Moderation</h2>
            <p style="color:#888; font-size:0.9rem; margin-bottom:15px;">
                Review user reports, wipe offending messages, and mute or ban
                chat members per channel. All actions take effect immediately.
            </p>

            <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">
                <button class="btn btn-secondary mod-btn active" id="mod-btn-reports" style="padding:8px 16px; font-size:0.8rem;" onclick="showModView('reports')">Open Reports</button>
                <button class="btn btn-secondary mod-btn" id="mod-btn-actions" style="padding:8px 16px; font-size:0.8rem;" onclick="showModView('actions')">Manual Actions</button>
                <button class="btn btn-secondary mod-btn" id="mod-btn-muted" style="padding:8px 16px; font-size:0.8rem;" onclick="showModView('muted')">Active Mutes / Bans</button>
            </div>

            <div id="mod-status" style="color:#888; font-size:0.85rem; margin-bottom:12px;"></div>
            <div id="mod-content" style="font-size:0.9rem;"></div>
        </div>$mod$, ''),
    updated_at = now()
WHERE key = 'admin_panel_html';

-- 3. Loud guard: if either fragment didn't match, the value drifted from
--    the seed and the tab is still present — surface it instead of a
--    silent no-op.
DO $$
DECLARE
    v text;
BEGIN
    SELECT value INTO v FROM system_config WHERE key = 'admin_panel_html';
    IF v IS NULL THEN
        RAISE NOTICE 'admin_panel_html not found — nothing to update.';
    ELSIF v LIKE '%showTab(''moderation'')%' OR v LIKE '%tab-moderation%' THEN
        RAISE WARNING 'Moderation markup still present in admin_panel_html — the live value differs from the seed; REPLACE did not match. Inspect and adjust the search strings.';
    ELSE
        RAISE NOTICE 'Moderation tab removed from admin_panel_html.';
    END IF;
END $$;

COMMIT;
