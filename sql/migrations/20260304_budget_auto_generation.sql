-- Allow bills.proposed_by to be NULL for system-generated budget bills.
-- System-generated budget bills are auto-created 3 ticks before the budget deadline
-- and placed into committee without a sponsor.

ALTER TABLE bills ALTER COLUMN proposed_by DROP NOT NULL;

-- Also drop the foreign key constraint if it prevents null values
-- (FK constraints allow NULL by default in PostgreSQL, so this is just defensive)
