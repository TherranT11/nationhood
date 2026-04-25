-- Add efficiency column to trade_agreements.
-- Trade agreements operate at 85% efficiency by default.
-- A shipping corporation successfully bidding on and deploying a vessel
-- on the agreement's trade route increases efficiency by 3%.

ALTER TABLE trade_agreements
    ADD COLUMN IF NOT EXISTS efficiency NUMERIC(4,3) NOT NULL DEFAULT 0.850;

COMMENT ON COLUMN trade_agreements.efficiency IS
    'Trade flow efficiency multiplier (0-1). Starts at 0.85 (85%). Each active shipping claim adds 0.03.';
