-- ═══════════════════════════════════════════════════════════════════════════════
-- Diagnostic: Zellox Investments owned properties
-- ═══════════════════════════════════════════════════════════════════════════════
-- Read-only. Lists every corp_properties row currently flagged is_active=true
-- for the Zellox Investments faction so we can tell whether the Actions
-- page's "3 buildings" count vs Expansion's "1 property" reflects:
--
--   (real purchases) → Two marketplace office/factory/etc. rows whose
--   type isn't in the Expansion allowlist (national_hq / regional_hq /
--   airline_terminal). Fix is Option A: Expansion adds an "Other
--   Properties" bucket so every owned asset is visible.
--
--   (zombie rows) → Two rows from a Regional HQ + office-building that
--   were demolished/sold but never had is_active flipped to false.
--   Fix is Option C: trace the sell/demolish path and patch wherever
--   it's leaving rows half-deactivated, plus a one-off cleanup UPDATE.
--
-- Section 1 lists the live rows. Section 2 cross-references the
-- Actions-vs-Expansion counting rules so both numbers appear next to
-- each other. Section 3 also surfaces inactive rows from the last 60
-- ticks in case the user remembers selling something recently — helps
-- confirm whether the sell path actually flips is_active.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Active properties Zellox owns right now ─────────────────────────────
SELECT
    cp.id,
    cp.name,
    cp.type,
    cp.role,
    cp.style,
    cp.city,
    n.name                      AS nation,
    cp.condition                AS condition_pct,
    cp.purchase_price,
    cp.monthly_maintenance,
    cp.purchased_at_tick,
    cp.is_active,
    cp.created_at,
    -- Tag each row with which page would count it. Mirrors:
    --   Actions   → counts every active row
    --   Expansion → role='national_hq' OR type IN ('regional_hq','airline_terminal')
    CASE
        WHEN cp.role = 'national_hq'                                   THEN 'national_hq'
        WHEN cp.type IN ('regional_hq', 'airline_terminal')            THEN cp.type
        ELSE 'other (counted by Actions, hidden on Expansion)'
    END                         AS bucket_classification
FROM public.corp_properties cp
LEFT JOIN public.nations n ON n.id = cp.nation_id
JOIN public.factions f ON f.id = cp.faction_id
WHERE f.faction_name = 'Zellox Investments'
  AND cp.is_active = true
ORDER BY cp.purchased_at_tick DESC NULLS LAST, cp.created_at DESC;

-- ── 2. The two counts side by side ──────────────────────────────────────────
WITH zellox_props AS (
    SELECT cp.*
    FROM public.corp_properties cp
    JOIN public.factions f ON f.id = cp.faction_id
    WHERE f.faction_name = 'Zellox Investments'
      AND cp.is_active = true
)
SELECT
    COUNT(*)                                                                AS actions_count,
    COUNT(*) FILTER (
        WHERE role = 'national_hq'
           OR type IN ('regional_hq', 'airline_terminal')
    )                                                                       AS expansion_count,
    COUNT(*) FILTER (
        WHERE NOT (role = 'national_hq'
                   OR type IN ('regional_hq', 'airline_terminal'))
    )                                                                       AS hidden_on_expansion
FROM zellox_props;

-- ── 3. Recently deactivated rows (last ~60 ticks) ───────────────────────────
-- If the sell/demolish path is bugged we'd see rows with stale
-- is_active=true here. If it's working we'd see is_active=false rows
-- (and the user's "missing properties" story is bogus — they didn't
-- actually sell them).
SELECT
    cp.id,
    cp.name,
    cp.type,
    cp.role,
    cp.purchased_at_tick,
    cp.is_active,
    cp.updated_at
FROM public.corp_properties cp
JOIN public.factions f ON f.id = cp.faction_id
LEFT JOIN public.shard s ON s.name = 'Alpha Shard'
WHERE f.faction_name = 'Zellox Investments'
  AND cp.is_active = false
  AND cp.purchased_at_tick IS NOT NULL
  AND cp.purchased_at_tick > COALESCE(s.current_tick, 0) - 60
ORDER BY cp.updated_at DESC NULLS LAST;
