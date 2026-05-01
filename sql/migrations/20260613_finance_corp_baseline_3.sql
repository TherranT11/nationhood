-- ══════════════════════════════════════════════════════════════
-- Finance corp stat reset — 3 across the board EXCEPT Zellox Corp
--
-- Sets every Finance-sector corporation's three stats to 3:
--   corp_lending_capital     = 3
--   corp_interest_rates      = 3
--   corp_overleverage        = 3
--
-- Plus the action-controlled split-layer columns so the recompute
-- reproduces 3 when the portfolio is empty:
--   corp_lending_capital_max = 3
--   corp_overleverage_offset = 3
--
-- Zellox Corp is exempted (presumably the test-data / story-NPC
-- counterparty whose stats should stay at whatever they're at).
-- Match by faction_name; using ILIKE so the match is case-insensitive
-- and tolerant of trailing whitespace.
--
-- Defensive against partial migration history — each split-layer
-- column update is gated by an information_schema EXISTS check so
-- the migration runs cleanly even if 20260605 / 20260606 haven't
-- been applied yet.
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- 1. Displayed stats (corp_lending_capital, corp_interest_rates,
--    corp_overleverage) — gated by corp_lending_capital existing
--    (added 20260514). Zellox excluded.
-- ══════════════════════════════════════════════════════════════
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'factions'
           AND column_name = 'corp_lending_capital'
    ) THEN
        UPDATE factions
           SET corp_lending_capital = 3,
               corp_interest_rates  = 3,
               corp_overleverage    = 3
         WHERE faction_type = 'corporation'
           AND corp_sector  = 'Finance'
           AND COALESCE(faction_name, '') NOT ILIKE 'zellox%';
    END IF;
END $$;


-- ══════════════════════════════════════════════════════════════
-- 2. corp_lending_capital_max — gated separately (added 20260605).
-- ══════════════════════════════════════════════════════════════
-- Set so the recompute reproduces displayed lending_capital = 3
-- when outstanding = 0 (formula: max - outstanding/$50M).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'factions'
           AND column_name = 'corp_lending_capital_max'
    ) THEN
        UPDATE factions
           SET corp_lending_capital_max = 3
         WHERE faction_type = 'corporation'
           AND corp_sector  = 'Finance'
           AND COALESCE(faction_name, '') NOT ILIKE 'zellox%';
    END IF;
END $$;


-- ══════════════════════════════════════════════════════════════
-- 3. corp_overleverage_offset — gated separately (added 20260606).
-- ══════════════════════════════════════════════════════════════
-- Set so the recompute reproduces displayed overleverage = 3 when
-- the portfolio-derived value is 0 (formula: derived + offset).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'factions'
           AND column_name = 'corp_overleverage_offset'
    ) THEN
        UPDATE factions
           SET corp_overleverage_offset = 3
         WHERE faction_type = 'corporation'
           AND corp_sector  = 'Finance'
           AND COALESCE(faction_name, '') NOT ILIKE 'zellox%';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
