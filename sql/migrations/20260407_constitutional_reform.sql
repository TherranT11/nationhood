-- Constitutional Reform Foundational Law
-- Unified law replacing the HoS Election Method law.
-- Allows players to change between Parliamentary Democracy, Constitutional Monarchy,
-- Presidential Republic, and Semi-Presidential Republic.

-- Column on bills table for the proposed constitutional system
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_constitutional_reform TEXT DEFAULT NULL
    CHECK (proposed_constitutional_reform IS NULL OR proposed_constitutional_reform IN (
        'parliamentary', 'constitutional_monarchy', 'presidential', 'semi_presidential'
    ));

-- Cooldown tracking on nations table (240-tick cooldown)
ALTER TABLE nations ADD COLUMN IF NOT EXISTS last_constitutional_reform_tick INT DEFAULT NULL;
