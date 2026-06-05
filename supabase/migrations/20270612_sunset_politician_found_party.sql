-- ════════════════════════════════════════════════════════════════════
-- 20270612 — Sunset politician_found_party (Phase 1 of party sunset)
--
-- Phase 1 of the multi-phase political-party sunset: freeze the
-- on-ramp. Sunset policy: players found Entrepreneurs and Politicians
-- only going forward; parties continue to exist in the DB as
-- system-owned (NPC) factions so the politics engine — Head of
-- Government auto-install, Deputy Speaker, Speaker of the Assembly,
-- general-election seat allocation — keeps working unchanged.
--
-- This migration short-circuits the in-game founding RPC. Existing
-- player parties are NOT touched: every row stays where it is, every
-- linked_user_id stays attached, every party.html surface keeps
-- rendering for current owners. Only NEW party creation via this
-- RPC is blocked.
--
-- Companion UI changes (separate file, same commit):
--   • politician-movements.html — "Start a Political Party" action
--     greyed out, tag flips "Open" → "Sunset", click is a no-op.
--   • faction-select.html — Political Party option hidden so the
--     signup-flow chooser stops offering it.
--   • js/common.js — "Found a Political Party" dropdown item
--     removed.
--   • createparty.html — top banner + Create button disabled. This
--     covers the OTHER creation path (a direct INSERT into factions
--     bypassing politician_found_party) so the URL can't be bookmark-
--     bypassed.
--
-- Reversal: re-apply the 20270583 body (the version this migration
-- replaces). The schema, columns, and existing party rows are
-- unchanged; Phase 1 is the lightest possible freeze.
--
-- Apply after 20270611.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.politician_found_party(
    p_politician_id   uuid,
    p_name            text,
    p_abbreviation    text,
    p_description     text,
    p_archetype       text,
    p_party_color     text,
    p_party_logo      text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Sunset: Phase 1 of the political-party sunset (20270612).
    -- Player parties are no longer created. Existing parties keep
    -- functioning; the politics engine reads them all the same. To
    -- re-enable, restore the 20270583 body of this function.
    RETURN jsonb_build_object('success', false, 'reason', 'sunset');
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_found_party(uuid, text, text, text, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.politician_found_party(uuid, text, text, text, text, text, text) IS
    'SUNSET (20270612) — Phase 1 of the political-party sunset. Returns success:false reason:''sunset'' on every call. The pre-sunset body lived in 20270583. To restore, re-apply that body. Existing player parties and the politics engine (HoG / Deputy Speaker / Speaker / elections) are unaffected.';

NOTIFY pgrst, 'reload schema';

COMMIT;
