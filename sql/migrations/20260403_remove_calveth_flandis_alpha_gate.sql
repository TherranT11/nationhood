-- Remove alpha tester code gate for Calveth and Flandis.
-- Both nations are now open to any player up to the max 8-party limit.
-- Deleting their unused codes removes them from the ALPHA_CODE_NATIONS set
-- in select-nation.html, which suppresses the Alpha badge and code prompt.
DELETE FROM alpha_tester_codes
WHERE nation_id IN (
    SELECT id FROM nations WHERE LOWER(name) IN ('calveth', 'flandis')
);
