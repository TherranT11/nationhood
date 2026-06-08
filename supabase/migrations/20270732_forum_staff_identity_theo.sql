-- ════════════════════════════════════════════════════════════════════
-- 20270732 — Forum "Staff" identity: lets therrant@gmail.com post as
--              'theo' (no other user gets this option)
--
-- Per user request, add a single staff posting identity so the
-- canonical NATIONHOOD changelog can be authored under "theo"
-- rather than a politician / entrepreneur faction. Scoped to one
-- user account by construction — the staff faction's linked_user_id
-- points only at therrant@gmail.com's auth.users.id, and the
-- _forum_resolve_author guard rejects any caller whose auth.uid()
-- doesn't match that row. No additional ACL layer needed.
--
-- Schema choice: reuse the existing factions table with a new
-- faction_type value 'staff' rather than spinning up a separate
-- posters table. Three reasons:
--   • forum_posts.author_faction_id already FKs into factions —
--     a separate table would need its own column + its own RPC
--     plumbing through every author display path.
--   • The dropdown / thread rendering layers already key off
--     faction_type for the badge label. Adding 'staff' to the
--     allow-list propagates the new identity through a few
--     5-line client edits, no new render code.
--   • Identity scoping is the same problem the existing
--     linked_user_id mechanism solves — we already know how to
--     gate posting on it. Don't reinvent.
--
-- Two parts:
--   1. _forum_resolve_author re-emit: 'staff' added to the
--      faction_type IN list, ownership + abandoned_at guards
--      otherwise byte-faithful.
--   2. INSERT one factions row keyed off auth.users.email lookup.
--      Idempotent — wrapped in NOT EXISTS so re-running the
--      migration is a no-op.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. _forum_resolve_author: add 'staff' to the allow-list ─────────
CREATE OR REPLACE FUNCTION public._forum_resolve_author(p_faction_id uuid)
RETURNS factions
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_f   factions%ROWTYPE;
BEGIN
    IF v_uid IS NULL OR p_faction_id IS NULL THEN
        RETURN v_f;
    END IF;
    SELECT * INTO v_f FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND abandoned_at IS NULL
       AND faction_type IN ('entrepreneur', 'corporation', 'politician', 'staff');
    RETURN v_f;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._forum_resolve_author(uuid) FROM PUBLIC;

-- ── 2. INSERT the 'theo' staff identity for therrant@gmail.com ──────
-- Wrapped in a DO block so we can look up auth.users.id and bail
-- explicitly if the email isn't on file. NOT EXISTS guard against
-- the (linked_user_id, faction_type='staff') tuple keeps re-runs
-- idempotent — the migration is forward-only but should never
-- double-insert if reapplied to a fresh shard.
DO $$
DECLARE
    v_uid uuid;
BEGIN
    SELECT id INTO v_uid
      FROM auth.users
     WHERE email = 'therrant@gmail.com'
     LIMIT 1;
    IF v_uid IS NULL THEN
        RAISE EXCEPTION
            'therrant@gmail.com not found in auth.users. Sign-in/registration must precede this migration.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.factions
         WHERE faction_type   = 'staff'
           AND linked_user_id = v_uid
           AND abandoned_at IS NULL
    ) THEN
        -- nation is NOT NULL on factions; 'Global' signals a cross-
        -- nation identity (the dropdown / thread renderers don't read
        -- the value for staff). nation_id stays NULL — staff identity
        -- isn't tied to any specific nation FK.
        INSERT INTO public.factions (
            id, faction_type, faction_name,
            nation,
            leader_first_name, leader_last_name,
            linked_user_id,
            abandoned_at, seats, action_points, party_funds
        ) VALUES (
            gen_random_uuid(), 'staff', 'theo',
            'Global',
            'theo', '',
            v_uid,
            NULL, 0, 0, 0
        );
        RAISE NOTICE 'Created staff posting identity ''theo'' for therrant@gmail.com (uid=%).', v_uid;
    ELSE
        RAISE NOTICE 'Staff identity ''theo'' already exists for therrant@gmail.com — no-op.';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
