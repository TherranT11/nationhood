-- ═══════════════════════════════════════════════════════════════════════════════
-- One-off cleanup: deactivate corp_properties rows the UI doesn't recognise
-- ═══════════════════════════════════════════════════════════════════════════════
-- Two directives from the bug report:
--
--   1. Globally — every active corp_properties row whose role/type isn't
--      one of (role='national_hq', type='regional_hq', type='airline_terminal')
--      gets is_active flipped to false. These are marketplace buys (and any
--      legacy seed rows) with arbitrary catalog types like 'office',
--      'factory', 'warehouse' — Actions counted them, Expansion silently
--      hid them, no other surface accounts for them. Treat as
--      unrecognised-by-the-UI and remove.
--
--   2. Zellox specifically — also deactivate any active row that ISN'T the
--      National HQ (i.e. its regional_hqs and terminals too). The user wants
--      Zellox stripped down to just its National HQ.
--
-- Soft delete via is_active=false (not DELETE) because:
--   - Every reader already filters by is_active=true so the UI effect is
--     identical to a hard delete.
--   - Reversible if any row turns out to be wanted after all (one UPDATE
--     to flip back, vs irrecoverable from a DELETE).
--   - No risk of cascading FK constraint failures from anything that
--     historically referenced these rows.
--
-- Wrapped in a single transaction. Two preview SELECTs surround each UPDATE
-- so you can sanity-check the row counts before COMMIT lands.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Preview: rows the global filter will hit ──────────────────────────────────
SELECT
    'PREVIEW: global cleanup (other types)' AS step,
    COUNT(*)                                AS rows_to_deactivate
FROM public.corp_properties cp
WHERE cp.is_active = true
  AND cp.role <> 'national_hq'
  AND (cp.type IS NULL OR cp.type NOT IN ('regional_hq', 'airline_terminal'));

-- ── Action 1: deactivate every "other" row across all corps ───────────────────
UPDATE public.corp_properties
SET is_active = false
WHERE is_active = true
  AND role <> 'national_hq'
  AND (type IS NULL OR type NOT IN ('regional_hq', 'airline_terminal'));

-- ── Preview: rows the Zellox-specific filter will hit ─────────────────────────
SELECT
    'PREVIEW: Zellox non-HQ cleanup' AS step,
    COUNT(*)                         AS rows_to_deactivate
FROM public.corp_properties cp
JOIN public.factions f ON f.id = cp.faction_id
WHERE f.faction_name = 'Zellox Investments'
  AND cp.is_active = true
  AND cp.role <> 'national_hq';

-- ── Action 2: strip Zellox down to its National HQ only ───────────────────────
UPDATE public.corp_properties
SET is_active = false
WHERE faction_id IN (
    SELECT id FROM public.factions WHERE faction_name = 'Zellox Investments'
)
  AND is_active = true
  AND role <> 'national_hq';

-- ── Verification: per-corp post-cleanup count ─────────────────────────────────
SELECT
    f.faction_name,
    COUNT(*) FILTER (WHERE cp.is_active = true)                      AS active_rows,
    COUNT(*) FILTER (WHERE cp.is_active = true AND cp.role = 'national_hq')           AS active_national_hqs,
    COUNT(*) FILTER (WHERE cp.is_active = true AND cp.type = 'regional_hq')           AS active_regional_hqs,
    COUNT(*) FILTER (WHERE cp.is_active = true AND cp.type = 'airline_terminal')      AS active_terminals
FROM public.factions f
LEFT JOIN public.corp_properties cp ON cp.faction_id = f.id
WHERE f.faction_type = 'corporation'
GROUP BY f.faction_name
ORDER BY f.faction_name;

COMMIT;
