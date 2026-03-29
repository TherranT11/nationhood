-- ============================================================
-- Seed foundational laws for all nations
-- ============================================================
-- 1. Legislative Term Length: 48 months for all nations, 24 for Melizea.
--    parliamentary_term_established_tick tracks whether the law is
--    "established" (non-null) or "repealed" (null). When established,
--    players must repeal it before proposing a new term length.
--
-- 2. Head of State Election: Presidential republics get 'direct_vote'
--    as their default election method.

-- ─── Schema additions ───

ALTER TABLE nations ADD COLUMN IF NOT EXISTS parliamentary_term_established_tick INTEGER;

ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_foundational_repeal BOOLEAN DEFAULT false;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS foundational_repeal_subtype TEXT;

-- ─── Legislative Term Length ───

UPDATE nations
SET parliamentary_term_ticks = 48,
    parliamentary_term_established_tick = 0
WHERE name != 'Melizea';

UPDATE nations
SET parliamentary_term_ticks = 24,
    parliamentary_term_established_tick = 0
WHERE name = 'Melizea';

-- ─── Head of State Election: Direct Vote for Presidential Republics ───

UPDATE nations
SET hos_election_method = 'direct_vote'
WHERE government_type = 'Presidential'
  AND (hos_election_method IS NULL OR hos_election_method = 'appointed');
