-- ════════════════════════════════════════════════════════════════
-- resign_military_faction RPC — Chief of Staff resigns.
--
-- Mirrors the disband_party / declare_corp_bankruptcy model: the
-- faction row is NOT deleted, it is marked abandoned (abandoned_at =
-- now()). Every active-faction read path filters .is('abandoned_at',
-- null) / isFactionInactive(), so the resigned army faction drops out
-- of the switcher and the "Join a Military Faction" option reappears
-- automatically off the same ownership state — no extra bookkeeping.
--
-- The −1 Public Approval hit is on the NATION (nations.public_approval,
-- clamped 0–100). This MUST be server-side: a client cannot be
-- allowed to decrement an arbitrary nation's approval. Caller
-- ownership is enforced here (auth.uid() vs id / linked_user_id),
-- exactly like create_unit (20270121).
--
-- Idempotent: a faction already abandoned returns an error and does
-- NOT apply the approval hit again, so a double-fire (double-click /
-- retry) can't double-dock approval. SECURITY DEFINER; no client
-- write to factions.abandoned_at or nations.public_approval otherwise.
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.resign_military_faction(
    p_faction_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user UUID := auth.uid();
    v_fac  factions%ROWTYPE;
BEGIN
    SELECT * INTO v_fac FROM factions WHERE id = p_faction_id;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Faction not found');
    END IF;
    IF v_fac.faction_type <> 'military' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not a military faction');
    END IF;
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not command this faction');
    END IF;
    IF v_fac.abandoned_at IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already resigned this commission');
    END IF;

    UPDATE factions SET abandoned_at = now() WHERE id = p_faction_id;

    UPDATE nations
       SET public_approval = GREATEST(0, LEAST(100, COALESCE(public_approval, 0) - 1))
     WHERE id = v_fac.nation_id;

    RETURN jsonb_build_object('success', true);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.resign_military_faction(UUID) TO authenticated;
