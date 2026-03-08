-- Fix Palvera and Avelia debt: reset to $0 by stat processors treating debt
-- as a 0-100 stat and clamping/zeroing it.
--
-- Root cause: processStatConnections, processEvents, processCrises, and
-- processPMTraitEffects could modify 'debt' via policy/event/crisis effects.
-- While they scaled by RAW_SCALING_DIVISORS and didn't clamp to 100, effects
-- could still drive debt to 0 through accumulated 'down' effects.
--
-- Code fix: added STAT_PROCESSOR_SKIP set so all processors skip gdp and debt.
-- This SQL restores debt to seed values.

-- 1. Preview: show all nations' debt
SELECT name, debt,
    CASE WHEN debt >= 1000000000 THEN 'dollar-scale OK'
         WHEN debt = 0 THEN 'ZEROED ⚠'
         ELSE 'SUSPECT ⚠' END AS debt_status
FROM nations
ORDER BY name;

-- 2. Reset Palvera debt to seed value ($48B)
UPDATE nations
SET debt = 48000000000
WHERE LOWER(name) = 'palvera'
  AND debt < 1000000000;  -- safety: only fix if broken

-- 3. Reset Avelia debt to seed value ($10B)
UPDATE nations
SET debt = 10000000000
WHERE LOWER(name) = 'avelia'
  AND debt < 1000000000;  -- safety: only fix if broken

-- 4. Set Avelia GDP to $324B
UPDATE nations
SET gdp = 324000000000
WHERE LOWER(name) = 'avelia';

-- 5. Verify
SELECT name, gdp, debt,
    CASE WHEN debt >= 1000000000 THEN 'dollar-scale OK'
         ELSE 'STILL BROKEN ⚠' END AS debt_status
FROM nations
WHERE LOWER(name) IN ('palvera', 'avelia')
ORDER BY name;
