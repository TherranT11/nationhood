-- Add per-subsidiary cash tracking to regional HQ properties
-- Used for INJECT CAPITAL / WITHDRAW operations between parent corp and subsidiaries

ALTER TABLE corp_properties
    ADD COLUMN IF NOT EXISTS sub_cash BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN corp_properties.sub_cash IS 'Cash reserves held by this subsidiary (regional_hq only). Parent can inject/withdraw.';
