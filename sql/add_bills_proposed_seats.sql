-- Adds proposed_seats column to bills table for foundational law support.
-- This column stores the proposed legislature size for foundational bills.
-- Without this column, Supabase silently drops the field on insert and
-- enactFoundationalBill() fails silently.

ALTER TABLE bills
ADD COLUMN IF NOT EXISTS proposed_seats INTEGER;

ALTER TABLE bills
ADD CONSTRAINT bills_proposed_seats_range
    CHECK (proposed_seats IS NULL OR (proposed_seats >= 50 AND proposed_seats <= 500));
