-- ════════════════════════════════════════════════════════════════════
-- 20270790 — Forum: businessmen can author threads and posts
--
-- The forum pages port to the Businessman FORUM tab (shared pages,
-- same forum dataset). Reads were already type-agnostic — the owner
-- checks lost their type gates in 20270603 — leaving exactly one
-- live type list: _forum_resolve_author (20270599), the DRY helper
-- create_forum_thread + create_forum_post resolve authors through.
-- 'businessman' joins the set. Body otherwise byte-faithful to
-- 20270599, including the deliberate no-GRANT posture (the helper is
-- only reachable through the SECURITY DEFINER write RPCs).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public._forum_resolve_author(p_faction_id uuid)
RETURNS factions
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_f   factions%ROWTYPE;
BEGIN
    IF v_uid IS NULL OR p_faction_id IS NULL THEN
        RETURN v_f;     -- empty row
    END IF;
    SELECT * INTO v_f FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND abandoned_at IS NULL
       AND faction_type IN ('entrepreneur', 'corporation', 'politician', 'businessman');
    RETURN v_f;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._forum_resolve_author(uuid) FROM PUBLIC;

NOTIFY pgrst, 'reload schema';

COMMIT;
