-- Entrenchment Clauses: allows bills to specify how hard they are to repeal/amend.
-- Tiers: protected (60%), entrenched (67% + cooldown), enshrined (foundational-level).

-- 1. Add entrenchment_tier to bill_articles (one per bill, enforced in app layer)
ALTER TABLE bill_articles ADD COLUMN IF NOT EXISTS entrenchment_tier TEXT DEFAULT NULL
    CHECK (entrenchment_tier IS NULL OR entrenchment_tier IN (
        'protected', 'entrenched', 'enshrined'
    ));

-- 2. Add entrenchment columns to active_laws
ALTER TABLE active_laws ADD COLUMN IF NOT EXISTS entrenchment_tier TEXT DEFAULT NULL
    CHECK (entrenchment_tier IS NULL OR entrenchment_tier IN (
        'protected', 'entrenched', 'enshrined'
    ));
ALTER TABLE active_laws ADD COLUMN IF NOT EXISTS entrenchment_cooldown_until_tick INT DEFAULT NULL;

-- 3. Add entrenchment_tier to bills table (denormalized for fast threshold checks during voting)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS entrenchment_tier TEXT DEFAULT NULL
    CHECK (entrenchment_tier IS NULL OR entrenchment_tier IN (
        'protected', 'entrenched', 'enshrined'
    ));

-- 4. Add entrenchment_upgrade_law_id to bills (references active_law being upgraded)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS entrenchment_upgrade_law_id UUID DEFAULT NULL;
