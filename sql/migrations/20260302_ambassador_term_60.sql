-- Extend ambassador term length from 36 ticks (3 years) to 60 ticks (5 years).

-- Update the column default for new ambassadors
ALTER TABLE ambassadors ALTER COLUMN term_length SET DEFAULT 60;

-- Update existing active ambassadors to the new term length
UPDATE ambassadors
SET term_length = 60
WHERE is_active = true
  AND status = 'active'
  AND term_length = 36;
