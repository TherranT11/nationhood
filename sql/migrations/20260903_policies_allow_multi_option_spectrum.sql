-- ═══════════════════════════════════════════════════════════════════════════════
-- POLICIES — allow 'multi_option_spectrum' as a valid policy_type
-- ═══════════════════════════════════════════════════════════════════════════════
-- The policies.policy_type CHECK constraint (defined back when the policies
-- table was created and never touched since) only knows about 'structural'
-- and 'lever'. The multi-option spectrum work added a third option in the
-- builder UI ('multi_option_spectrum') but no migration ever extended the
-- CHECK to allow it — every CREATE POLICY of that type fails with
-- policies_policy_type_check.
--
-- Drop the existing constraint and re-add it with the full set, named
-- explicitly so future extensions are easier to find.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.policies
    DROP CONSTRAINT IF EXISTS policies_policy_type_check;

ALTER TABLE public.policies
    ADD CONSTRAINT policies_policy_type_check
        CHECK (policy_type IN ('structural', 'lever', 'multi_option_spectrum'));

NOTIFY pgrst, 'reload schema';

COMMIT;
