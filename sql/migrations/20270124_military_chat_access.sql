-- ════════════════════════════════════════════════════════════════
-- Give military factions Global + Nation chat access.
--
-- The Phase 1/2 chat enrollment triggers (20260424) only seat
-- faction_type IN ('party','corporation'); RLS itself is permissive,
-- so the gate is purely the membership provisioning. A military
-- faction therefore gets zero group_chat_members rows → no Global or
-- Nation tab, can't post.
--
-- Fix: CREATE OR REPLACE both trigger functions (same name/signature,
-- so the existing trg_enroll_* triggers pick up the new bodies — no
-- trigger DDL needed) to also allow 'military', and backfill every
-- existing active military faction into its nation chat + the global
-- chat. Bodies are byte-for-byte the 20260424 versions with only the
-- faction_type allow-list widened — party/corp behaviour is unchanged.
-- Functions stay SECURITY DEFINER (their INSERT bypasses RLS, exactly
-- as for parties/corps). Idempotent: ON CONFLICT / NOT EXISTS guards.
-- On resign (abandoned_at set) the unchanged drop-on-abandon branches
-- still remove the military faction's seat — no zombies.
-- ════════════════════════════════════════════════════════════════

-- ── Nation-chat enrollment (parallel to 20260424_phase1) ──────────
CREATE OR REPLACE FUNCTION enroll_faction_in_nation_chat()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_chat_id UUID;
BEGIN
    IF NEW.nation_id IS NULL
       OR NEW.abandoned_at IS NOT NULL
       OR NEW.faction_type NOT IN ('party', 'corporation', 'military') THEN
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

-- ── Global-chat enrollment (parallel to 20260424_phase2) ──────────
CREATE OR REPLACE FUNCTION enroll_faction_in_global_chat()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_chat_id UUID;
BEGIN
    IF NEW.faction_type NOT IN ('party', 'corporation', 'military') THEN
        RETURN NEW;
    END IF;

    IF NEW.abandoned_at IS NOT NULL THEN
        IF TG_OP = 'UPDATE' AND OLD.abandoned_at IS NULL THEN
            DELETE FROM group_chat_members m
            USING group_chats gc
            WHERE m.chat_id = gc.id
              AND gc.chat_type = 'global'
              AND m.faction_id = NEW.id;
        END IF;
        RETURN NEW;
    END IF;

    SELECT id INTO v_chat_id
    FROM group_chats
    WHERE chat_type = 'global'
    LIMIT 1;

    IF v_chat_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO group_chat_members (chat_id, faction_id, joined_at)
    VALUES (v_chat_id, NEW.id, now())
    ON CONFLICT (chat_id, faction_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Backfill existing active military factions ────────────────────
-- The triggers only fire on future INSERT/UPDATE, so factions that
-- already joined (e.g. Army of Avelia) need an explicit catch-up.

-- Nation chat
INSERT INTO group_chat_members (chat_id, faction_id, joined_at, last_read_at)
SELECT gc.id, f.id, now(), NULL
FROM factions f
JOIN group_chats gc
  ON gc.nation_id = f.nation_id
 AND gc.chat_type = 'nation'
WHERE f.nation_id IS NOT NULL
  AND f.abandoned_at IS NULL
  AND f.faction_type = 'military'
  AND NOT EXISTS (
      SELECT 1 FROM group_chat_members m
      WHERE m.chat_id = gc.id AND m.faction_id = f.id
  );

-- Global chat
INSERT INTO group_chat_members (chat_id, faction_id, joined_at, last_read_at)
SELECT gc.id, f.id, now(), NULL
FROM factions f
JOIN group_chats gc ON gc.chat_type = 'global'
WHERE f.abandoned_at IS NULL
  AND f.faction_type = 'military'
  AND NOT EXISTS (
      SELECT 1 FROM group_chat_members m
      WHERE m.chat_id = gc.id AND m.faction_id = f.id
  );
