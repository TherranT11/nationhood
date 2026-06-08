-- ════════════════════════════════════════════════════════════════════
-- 20270720 — Big Tent party archetype: 90 Influence + 3 sub-archetypes
--
-- Adds a "Big Tent" archetype to the founding flow. Two changes from
-- the default 100-Influence path:
--
--   1. Cost drops to 90 Influence (gate + deduction).
--   2. Client packs the three sub-archetypes into the p_archetype
--      string as "Big Tent · {A} / {B} / {C}". Server just stores
--      that text verbatim — no schema change. Display surfaces that
--      already read factions.archetype (Geography card archetype
--      chip, party page subtitle, etc.) render the full label, so
--      the "embraces three banners" framing comes through without
--      any extra columns.
--
-- Detection is a prefix match: `v_arch ILIKE 'Big Tent%'`. The
-- client controls the composite string format, so a prefix is
-- enough to flag the discount path. Any non-Big-Tent caller stays
-- on the 100-Influence path — backwards compatible with the 20270714
-- revival contract.
--
-- Body otherwise byte-faithful to 20270714 — only the cost is now
-- a variable. Idempotent on re-run via CREATE OR REPLACE.
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
    v_cost         int := 100;
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

    -- 20270720: Big Tent founding pays 90 Influence instead of 100.
    -- Detection is a prefix match on the archetype string — the
    -- client packs sub-archetypes as "Big Tent · A / B / C" so the
    -- discount triggers whenever Big Tent leads the label.
    IF v_arch ILIKE 'Big Tent%' THEN
        v_cost := 90;
    END IF;

    IF COALESCE(v_pol.politician_influence, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_influence',
            'required', v_cost, 'have', COALESCE(v_pol.politician_influence, 0));
    END IF;

    IF v_pol.politician_party_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_affiliated');
    END IF;

    IF EXISTS (
        SELECT 1 FROM factions
         WHERE founder_faction_id = p_politician_id
           AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_founded');
    END IF;

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

    UPDATE factions
       SET politician_party_id  = v_new_id,
           politician_influence = GREATEST(0, COALESCE(politician_influence, 0) - v_cost)
     WHERE id = p_politician_id
    RETURNING politician_influence INTO v_new_influence;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
    VALUES (p_politician_id, v_tick, 'founded_party', v_name);

    RETURN jsonb_build_object('success', true,
        'party_id',             v_new_id,
        'party_name',           v_name,
        'influence_spent',      v_cost,
        'politician_influence', v_new_influence);
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_found_party(uuid, text, text, text, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.politician_found_party(uuid, text, text, text, text, text, text) IS
    'In-game party founding (20270720 adds Big Tent). Gates on politician_influence: 100 by default, 90 when the archetype string starts with "Big Tent". Deducts the same amount on success. Politician must be independent (no current party) and not already lead another active movement. Inserts a movement_party faction row, auto-affiliates the founder, stamps a founded_party career event. Returns { success, party_id, party_name, influence_spent, politician_influence } on win; { success:false, reason } with insufficient_influence / already_affiliated / already_founded / invalid_name / invalid_abbreviation / name_exists otherwise.';

NOTIFY pgrst, 'reload schema';

COMMIT;
