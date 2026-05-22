-- ════════════════════════════════════════════════════════════════════
-- REMOVE the admin "Policy Audit" tab from the control panel
-- ════════════════════════════════════════════════════════════════════
-- Companion to 20270217 (Moderation cull). The Policy Audit tab errored
-- ("column policies_1.upfront_cost does not exist" — the policies schema
-- moved on and the audit query was never updated) and is being culled.
--
-- The admin panel markup lives in system_config.admin_panel_html (served
-- by get_admin_panel). Targeted REPLACE strips the tab button + panel so
-- every other tab is preserved — re-seeding instead would drop the
-- voters/provinces tabs the static seed never carried.
--
-- Orphaned JS handlers (runPolicyAudit / recalculatePolicyCosts +
-- auditScaleCost / auditFormatCurrency) are removed from admin.html
-- separately.
--
-- Idempotent: REPLACE no-ops if the markup is already gone. The guard at
-- the end raises a loud WARNING if the markup didn't match (live value
-- drifted from the seed) so the removal can't fail silently.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Remove the tab button (leading newline + indent consumed so no blank
--    line is left behind between the neighbouring button and the next).
UPDATE system_config
SET value = REPLACE(value, $pa$
            <button class="tab" onclick="showTab('audit')">Policy Audit</button>$pa$, ''),
    updated_at = now()
WHERE key = 'admin_panel_html';

-- 2. Remove the tab-content panel.
UPDATE system_config
SET value = REPLACE(value, $pa$        <div class="tab-content" id="tab-audit">
            <h2>Policy Audit</h2>
            <p style="color:#888; margin-bottom:16px;">Review all active policies across all nations with their computed annual budget costs.</p>
            <button class="btn btn-primary" onclick="runPolicyAudit()">Run Policy Audit</button>
            <button class="btn btn-primary" onclick="recalculatePolicyCosts()" style="margin-left:8px; background:#e67e22;">Recalculate Policy Costs</button>
            <div id="audit-status" class="status info hidden"></div>
            <div id="audit-results" style="margin-top:20px;"></div>
        </div>$pa$, ''),
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
    ELSIF v LIKE '%showTab(''audit'')%' OR v LIKE '%tab-audit%' THEN
        RAISE WARNING 'Policy Audit markup still present in admin_panel_html — the live value differs from the seed; REPLACE did not match. Inspect and adjust the search strings.';
    ELSE
        RAISE NOTICE 'Policy Audit tab removed from admin_panel_html.';
    END IF;
END $$;

COMMIT;
