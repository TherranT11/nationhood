-- Rebalance Tier 6 (Nationwide Protests) and Tier 7 (The Big One) crisis effects.
-- Old Tier 7: gov -3, unrest +3, happiness -1, violence +1
-- New Tier 7: gov -0.5, unrest +2, gdp_growth -0.3, foreign_investment -1, violence +1
-- New Tier 6: half of Tier 7 values

-- ── Tier 6: Nationwide Protests (00000000-0000-0000-0000-000000000020) ──

-- Delete old effects
DELETE FROM crisis_effects
WHERE crisis_id = '00000000-0000-0000-0000-000000000020';

-- Insert new effects
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick)
VALUES
    ('00000000-0000-0000-0000-000000000020', 'government_approval', 'gov_approval', -0.25),
    ('00000000-0000-0000-0000-000000000020', 'nation', 'civil_unrest', 1),
    ('00000000-0000-0000-0000-000000000020', 'nation', 'gdp_growth', -0.15),
    ('00000000-0000-0000-0000-000000000020', 'nation', 'foreign_investment', -0.5),
    ('00000000-0000-0000-0000-000000000020', 'nation', 'political_violence', 0.5);

-- ── Tier 7: The Big One (00000000-0000-0000-0000-000000000021) ──

-- Delete old effects
DELETE FROM crisis_effects
WHERE crisis_id = '00000000-0000-0000-0000-000000000021';

-- Insert new effects
INSERT INTO crisis_effects (crisis_id, target, stat_key, change_per_tick)
VALUES
    ('00000000-0000-0000-0000-000000000021', 'government_approval', 'gov_approval', -0.5),
    ('00000000-0000-0000-0000-000000000021', 'nation', 'civil_unrest', 2),
    ('00000000-0000-0000-0000-000000000021', 'nation', 'gdp_growth', -0.3),
    ('00000000-0000-0000-0000-000000000021', 'nation', 'foreign_investment', -1),
    ('00000000-0000-0000-0000-000000000021', 'nation', 'political_violence', 1);
