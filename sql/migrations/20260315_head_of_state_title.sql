-- Add head_of_state_title column to nations table
-- Stores the custom HoS title (e.g., President, Chancellor, Premier, etc.)
-- NULL means use the default derived from government_type
ALTER TABLE nations ADD COLUMN IF NOT EXISTS head_of_state_title TEXT DEFAULT NULL;

-- Add proposed_hos_title column to bills table for foundational HoS title bills
ALTER TABLE bills ADD COLUMN IF NOT EXISTS proposed_hos_title TEXT DEFAULT NULL;

-- Add head_of_state_title column to administrations table for past admin snapshots
ALTER TABLE administrations ADD COLUMN IF NOT EXISTS head_of_state_title TEXT DEFAULT NULL;
