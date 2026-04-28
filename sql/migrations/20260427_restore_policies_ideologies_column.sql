-- ─────────────────────────────────────────────────────────────
-- Re-add policies.ideologies column dropped from prod
-- ─────────────────────────────────────────────────────────────
-- Same class of bug as the factions.ideology_value_1/2 cleanup
-- earlier today — the policies table's `ideologies` jsonb column
-- (multi-tag list) had been dropped from prod, but the admin policy
-- builder (policyadmin.html:1045) still writes to it on every
-- create/update, and laws.html / bill.html / government.html still
-- read it.
--
-- Client read path is already null-safe — every reader uses the
-- pattern:
--    p.ideologies && Array.isArray(p.ideologies)
--      ? p.ideologies
--      : (p.ideology ? [p.ideology] : [])
-- So an empty/null ideologies column falls back to the singular
-- `ideology` field. Re-adding the column with a `[]` default lets
-- writes succeed without changing read semantics.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE policies
    ADD COLUMN IF NOT EXISTS ideologies jsonb DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
