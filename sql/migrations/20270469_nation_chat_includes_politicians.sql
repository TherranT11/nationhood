-- Extend Nation Chat enrollment to politicians + movement_parties.
--
-- Phase 1 Nation Chat (20260424) enrolled only 'party' and 'corporation'
-- factions in the per-nation group_chats row, via trg_enroll_nation_chat.
-- Politicians + the movement_party faction they can found are first-class
-- citizens of a nation now, so they need a seat in the same chat — the
-- politician-home.html restructure builds a chat panel against it.
--
-- This migration:
--   1. Replaces enroll_faction_in_nation_chat() to add 'politician' and
--      'movement_party' to the eligible faction_types.
--   2. Backfills group_chat_members for every active politician /
--      movement_party that doesn't already have a seat.
--
-- The trigger itself doesn't need re-CREATEing — it fires on the same
-- INSERT/UPDATE columns. Only the function body changes.
--
-- Idempotent (CREATE OR REPLACE + NOT EXISTS on the backfill).

BEGIN;

CREATE OR REPLACE FUNCTION enroll_faction_in_nation_chat()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_chat_id UUID;
BEGIN
    -- Eligible faction types for Nation Chat. Was: party + corporation.
    -- Adds: politician (the individual politician faction row) and
    -- movement_party (the player-founded party type from the politician
    -- system). Other types (military, entrepreneur, ngo, etc.) stay out.
    IF NEW.nation_id IS NULL
       OR NEW.abandoned_at IS NOT NULL
       OR NEW.faction_type NOT IN ('party', 'corporation', 'politician', 'movement_party') THEN
        IF TG_OP = 'UPDATE' AND NEW.abandoned_at IS NOT NULL AND OLD.abandoned_at IS NULL THEN
            DELETE FROM group_chat_members m
            USING group_chats gc
            WHERE m.chat_id = gc.id
              AND gc.chat_type = 'nation'
              AND m.faction_id = NEW.id;
        END IF;
        RETURN NEW;
    END IF;

    SELECT id INTO v_new_chat_id
    FROM group_chats
    WHERE nation_id = NEW.nation_id AND chat_type = 'nation'
    LIMIT 1;

    IF v_new_chat_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.nation_id IS DISTINCT FROM NEW.nation_id AND OLD.nation_id IS NOT NULL THEN
        DELETE FROM group_chat_members m
        USING group_chats gc
        WHERE m.chat_id = gc.id
          AND gc.chat_type = 'nation'
          AND gc.nation_id = OLD.nation_id
          AND m.faction_id = NEW.id;
    END IF;

    INSERT INTO group_chat_members (chat_id, faction_id, joined_at)
    VALUES (v_new_chat_id, NEW.id, now())
    ON CONFLICT (chat_id, faction_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill: existing politician + movement_party factions get seats.
-- 'party' + 'corporation' were already enrolled by 20260424 so they're
-- excluded here to avoid touching their joined_at timestamps.
INSERT INTO group_chat_members (chat_id, faction_id, joined_at, last_read_at)
SELECT gc.id, f.id, now(), NULL
FROM factions f
JOIN group_chats gc
  ON gc.nation_id = f.nation_id
 AND gc.chat_type = 'nation'
WHERE f.nation_id IS NOT NULL
  AND f.abandoned_at IS NULL
  AND f.faction_type IN ('politician', 'movement_party')
  AND NOT EXISTS (
      SELECT 1 FROM group_chat_members m
      WHERE m.chat_id = gc.id AND m.faction_id = f.id
  );

NOTIFY pgrst, 'reload schema';

COMMIT;
