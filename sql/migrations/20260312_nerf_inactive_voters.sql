-- Nerf inactive party vote retention: lower default softmax temperature from 10 to 7.
-- Lower K sharpens vote distribution so preference gaps produce larger vote share differences.
-- This makes active campaigning more impactful relative to passive ideology alignment.

-- Update column default for new voter blocs
ALTER TABLE voter_blocs ALTER COLUMN k_value SET DEFAULT 7;

-- Update existing blocs that were using the old default of 10
UPDATE voter_blocs SET k_value = 7 WHERE k_value = 10;
