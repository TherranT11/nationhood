-- ════════════════════════════════════════════════════════════════════
-- Faction nickname — 12-char player handle
--
-- Adds factions.nickname text (NULL = no nickname, defaults to NULL).
-- Owner-editable: existing "Users can update linked factions" RLS
-- policy (20260328) already allows the linked user to UPDATE any
-- column on their own faction row. CHECK constraint enforces the
-- 12-char ceiling server-side so a hacked client can't slip a longer
-- string past the form validation.
--
-- Display semantics: js/utils.js displayName(faction) returns
-- "First Last (Nickname)" when the nickname is set, "First Last"
-- otherwise. All character-name surfaces are updated to call it.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS nickname text;

ALTER TABLE factions
    DROP CONSTRAINT IF EXISTS factions_nickname_len_chk;
ALTER TABLE factions
    ADD CONSTRAINT factions_nickname_len_chk
    CHECK (nickname IS NULL OR char_length(nickname) <= 12);

COMMENT ON COLUMN factions.nickname IS
    'Optional 12-char player nickname (20270459). Owner-editable via the existing linked_user_id UPDATE policy; CHECK length<=12 enforced server-side. NULL = no nickname.';

NOTIFY pgrst, 'reload schema';

COMMIT;
