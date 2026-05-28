-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD PARTY admin tab — movement refocus (HTML swap)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Updates the Add Party admin form to reflect the new faction_type='movement_party'
-- semantics from migration 20270365. Two REPLACEs:
--
--   1. The intro help text — explains that this creates a Politician Movement
--      Party that surfaces on politician-movements.html and is hidden from the
--      (legacy) parties surface (election rosters, party listings, etc.).
--
--   2. The archetype dropdown — removed. Archetypes seeded sector-popularity
--      strongholds, a parties-side mechanic the movement surface doesn't use.
--      Dropping the dropdown keeps the form aligned with the actual fields the
--      RPC consumes (no silent no-op inputs).
--
-- Idempotent: each REPLACE guards on a string only present in the old version.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Step 1: Swap the intro help text.
UPDATE system_config
SET value = REPLACE(
    value,
    '            <h2>Add Party</h2>
            <p style="color:#888; font-size:0.9rem; margin-bottom:16px;">
                Creates a seated NPC party in the chosen nation. Sector popularity is
                seeded from the selected archetype (the same tiers a player party gets).
                The party has no owner and takes no actions on its own &mdash; it simply
                holds seats. Auto-voting is a separate, later step.
            </p>',
    '            <h2>Add Party</h2>
            <p style="color:#888; font-size:0.9rem; margin-bottom:16px;">
                Creates a <strong>Politician Movement Party</strong> in the chosen nation
                (faction_type=movement_party). It surfaces on the Politician &rarr;
                Movements page under the Political Parties tab for politicians in that
                nation, and is hidden from every legacy parties surface (election rosters,
                party listings, voting panels, IPO guards, etc.). The party has no owner
                and takes no actions on its own.
            </p>'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value LIKE '%Sector popularity is%seeded from the selected archetype%';

-- Step 2: Remove the archetype dropdown row.
UPDATE system_config
SET value = REPLACE(
    value,
    '                <div class="input-group">
                    <label>Archetype (sets sector strongholds)</label>
                    <select id="ap-archetype"><option value="">(none)</option></select>
                </div>
',
    ''
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value LIKE '%id="ap-archetype"%';

COMMIT;
