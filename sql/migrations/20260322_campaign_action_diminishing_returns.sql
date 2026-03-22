-- Add campaign action counter for diminishing returns on same-tick burst spending.
-- Reset to 0 each tick by the electorate tick processor.

ALTER TABLE faction_electoral_standing
    ADD COLUMN IF NOT EXISTS campaign_actions_this_tick INTEGER DEFAULT 0;
