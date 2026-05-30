-- Track cumulative refurbish count per property. Drives the 1.25^count cost
-- growth. Incremented by advance-corp-tick/index.ts when a refurbish completes.

ALTER TABLE corp_properties
    ADD COLUMN IF NOT EXISTS refurbish_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN corp_properties.refurbish_count IS
    'Number of completed refurbishments. Each subsequent refurbish costs 1.25^count more than the base (purchase_price * 0.10 * inflation).';
