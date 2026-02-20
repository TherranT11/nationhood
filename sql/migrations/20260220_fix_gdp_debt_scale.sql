-- ==================== FIX GDP & DEBT SCALE ====================
-- Standardize GDP and debt to small-scale storage (value = billions).
-- DB value of 195 = $195 Billion. Display code multiplies by 1e9.

-- Reset Melizea GDP (was corrupted by processStatEffects applying
-- billion-scale multipliers to a small-scale value)
UPDATE nations SET gdp = 195 WHERE LOWER(name) = 'melizea';

-- Convert debt from raw dollars to small-scale (billions)
-- Only convert values that are clearly at raw-dollar scale (>= 1 million)
UPDATE nations SET debt = ROUND(debt / 1000000000.0) WHERE debt >= 1000000;
