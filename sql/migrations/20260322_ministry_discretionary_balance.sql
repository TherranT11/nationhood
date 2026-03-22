-- Add per-ministry discretionary funds balance.
-- Parliament can allocate funds via funding articles in bills.
-- Ministry actions that draw budget deduct from this balance each active tick.

ALTER TABLE ministries
ADD COLUMN IF NOT EXISTS discretionary_balance NUMERIC DEFAULT 0;

COMMENT ON COLUMN ministries.discretionary_balance IS 'Available discretionary funds in raw dollars. Credited by funding bill enactment, debited by active ministry actions per tick.';
