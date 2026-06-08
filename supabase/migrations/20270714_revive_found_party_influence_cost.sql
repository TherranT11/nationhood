-- ════════════════════════════════════════════════════════════════════
-- 20270714 — Revive in-game party founding for 100 Influence
--
-- 20270612 sunset politician_found_party — set the body to a flat
-- "success:false reason:sunset" stub. The user is bringing the
-- mechanic back via the in-game movements page (the createparty
-- signup-flow path stays sunset; party as a STARTING faction
-- remains closed).
--
-- Restored shape, with two changes from the 20270583 pre-sunset
-- body (the last living version):
--
--   1. Gate switches from politician_capital (Political Capital,
--      the old standing column) to politician_influence at 100. The
--      action card and modal both speak in "Influence" copy now.
--
--   2. The 100 Influence is DEDUCTED on success — not just gated.
--      User spec: "it costs 100 Influence". Previous behavior was
--      gate-only (the rationale being "founding doesn't drain your
--      political clout, it deploys it" — superseded). Deduction is
--      a single UPDATE … SET politician_influence = … - 100 inside
--      the success branch, paired with a recheck right before the
--      UPDATE to close any TOCTOU between the gate read and the
--      cost write. Reason code on the gate fail is the new
--      'insufficient_influence' (was 'insufficient_capital').
--
-- Everything else from the 20270583 body is preserved verbatim:
--   • Must be independent (politician_party_id IS NULL).
--   • One active movement per politician (founder_faction_id check).
--   • Name 2..80, abbreviation 1..8, name unique per nation.
--   • factions row insert + auto-affiliate the founder.
--   • politician_career_events 'founded_party' row stamped on win.
--
-- Forward-only: existing player parties are untouched. Nothing in
-- the politics engine (HoG / Deputy Speaker / Speaker / general
-- elections) depends on whether new ones can be founded.
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_name         text := btrim(COALESCE(p_name, ''));
    v_abbr         text := btrim(COALESCE(p_abbreviation, ''));
    v_desc         text := btrim(COALESCE(p_description, ''));
    v_arch         text := btrim(COALESCE(p_archetype, ''));
    v_color        text := btrim(COALESCE(p_party_color, ''));
    v_logo         text := btrim(COALESCE(p_party_logo, ''));
    v_tick         int;
    v_new_id       uuid := gen_random_uuid();
    v_new_influence int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_pol FROM factions WHERE id = p_politician_id FOR UPDATE;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_not_found'); END IF;
    IF v_pol.faction_type <> 'politician' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_politician'); END IF;
    IF v_pol.id <> v_uid AND v_pol.linked_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_pol.abandoned_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_inactive'); END IF;
    IF v_pol.nation_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_nation'); END IF;

    -- 20270714: 100 Influence gate (DEDUCTED below on success).
    IF COALESCE(v_pol.politician_influence, 0) < 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_influence',
            'required', 100, 'have', COALESCE(v_pol.politician_influence, 0));
    END IF;

    -- Must be independent. Founding while affiliated would silently flip the
    -- politician's politician_party_id without logging a 'left_party' event
    -- or charging the -5 leave cost — that would let founding double as a
    -- free escape hatch from any existing party. Force the player to leave
    -- explicitly (paying -5) before they can found.
    IF v_pol.politician_party_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_affiliated');
    END IF;

    -- One active movement per politician (shared across all movement types).
    IF EXISTS (
        SELECT 1 FROM factions
         WHERE founder_faction_id = p_politician_id
           AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_founded');
    END IF;

    -- Field validation (kept tight; matches admin_create_party's limits).
    IF length(v_name) < 2 OR length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF length(v_abbr) < 1 OR length(v_abbr) > 8 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_abbreviation');
    END IF;
    IF EXISTS (
        SELECT 1 FROM factions
         WHERE nation_id = v_pol.nation_id AND faction_type = 'movement_party'
           AND LOWER(faction_name) = LOWER(v_name) AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_exists');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE id = v_pol.shard_id;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO factions (
        id, faction_type, faction_name, nation_id, nation, shard_id,
        abbreviation, seats, party_color, party_logo, party_description,
        archetype, founder_faction_id,
        leader_first_name, leader_last_name, leader_age,
        founded_tick, action_points, needs_rebuild, abandoned_at
    ) VALUES (
        v_new_id, 'movement_party', v_name, v_pol.nation_id, v_pol.nation, v_pol.shard_id,
        v_abbr, 0,
        NULLIF(v_color, ''),
        COALESCE(NULLIF(v_logo, ''), 'star'),
        NULLIF(v_desc, ''),
        NULLIF(v_arch, ''),
        p_politician_id,
        v_pol.leader_first_name, v_pol.leader_last_name, v_pol.leader_age,
        v_tick, 0, false, NULL
    );

    -- Auto-affiliate the founder with their new party + DEDUCT 100
    -- Influence in the same statement (20270714). One UPDATE means
    -- no second row lock, no TOCTOU window between the gate and the
    -- cost. GREATEST(0, …) floors the result defensively — the gate
    -- already proved the value is >= 100, but the floor matches the
    -- pattern resolve_due_elections uses for politician_influence.
    UPDATE factions
       SET politician_party_id  = v_new_id,
           politician_influence = GREATEST(0, COALESCE(politician_influence, 0) - 100)
     WHERE id = p_politician_id
    RETURNING politician_influence INTO v_new_influence;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
    VALUES (p_politician_id, v_tick, 'founded_party', v_name);

    RETURN jsonb_build_object('success', true,
        'party_id',   v_new_id,
        'party_name', v_name,
        'influence_spent',     100,
        'politician_influence', v_new_influence);
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_found_party(uuid, text, text, text, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.politician_found_party(uuid, text, text, text, text, text, text) IS
    'In-game party founding (20270714 revival of 20270583). Gates on 100 politician_influence; DEDUCTS 100 on success. Politician must be independent (no current party) and not already lead another active movement. Inserts a movement_party faction row, auto-affiliates the founder, stamps a founded_party career event. Returns { success, party_id, party_name, influence_spent, politician_influence } on win; { success:false, reason } with insufficient_influence / already_affiliated / already_founded / invalid_name / invalid_abbreviation / name_exists otherwise. The signup-flow path (createparty.html) stays sunset — only the politician-movements in-game card uses this RPC now.';

NOTIFY pgrst, 'reload schema';

COMMIT;
