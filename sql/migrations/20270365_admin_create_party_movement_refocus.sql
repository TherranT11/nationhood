-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD PARTY — refocus as Politician Movement Party
-- ═══════════════════════════════════════════════════════════════════════════════
-- Political parties are now legacy. The Add Party admin tool used to create
-- factions with faction_type='party', putting admin-created NPC parties onto
-- the (legacy) Parties surface: election rosters, party listings, voting
-- panels, and so on. This is no longer the desired flow.
--
-- New behavior: admin_create_party inserts faction_type='movement_party'. This
-- new type is invisible to every legacy site that filters on faction_type='party'
-- (election processors, party listings, IPO guards, snap-election guards,
-- nation/global chat ACLs, etc.) — there are 200+ such call sites and they
-- automatically exclude movement parties without any per-site filter. The
-- Politician → Movements page (politician-movements.html) queries the new
-- type directly and surfaces movement parties under the Political Parties tab
-- for politicians in that nation.
--
-- factions.faction_type is a free-form text column with no CHECK constraint,
-- so no schema change is required to introduce the new value.
--
-- The legacy archetype/stronghold UPDATE block is removed: that was a parties-
-- side sector-popularity seeding step that the movement surface doesn't use.
-- The name-uniqueness check is scoped to faction_type='movement_party' so the
-- admin can create a movement party with the same name as a legacy party
-- without collision (they're separate entities).
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_create_party(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nation_id   uuid := NULLIF(p_payload->>'nation_id', '')::uuid;
    v_name        text := btrim(COALESCE(p_payload->>'faction_name', ''));
    v_abbr        text := btrim(COALESCE(p_payload->>'abbreviation', ''));
    v_seats       int  := COALESCE(NULLIF(p_payload->>'seats', '')::int, 0);
    v_nation_name text;
    v_shard_id    uuid;
    v_cur_tick    int;
    v_faction_id  uuid;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    IF v_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_required');
    END IF;
    SELECT name, shard_id INTO v_nation_name, v_shard_id FROM nations WHERE id = v_nation_id;
    IF v_nation_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;
    IF length(v_name) < 2 OR length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF length(v_abbr) < 1 OR length(v_abbr) > 8 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_abbreviation');
    END IF;
    IF v_seats < 0 OR v_seats > 1000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_seats');
    END IF;
    IF EXISTS (
        SELECT 1 FROM factions
         WHERE nation_id = v_nation_id AND faction_type = 'movement_party'
           AND LOWER(faction_name) = LOWER(v_name) AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_exists');
    END IF;

    SELECT current_tick INTO v_cur_tick FROM shard WHERE id = v_shard_id;

    INSERT INTO factions (
        faction_type, faction_name, nation_id, nation, shard_id,
        abbreviation, seats, party_color, party_logo, custom_logo_url,
        party_description, leader_first_name, leader_last_name, leader_age,
        founded_tick, action_points, needs_rebuild, abandoned_at
    ) VALUES (
        'movement_party', v_name, v_nation_id, v_nation_name, v_shard_id,
        v_abbr, v_seats,
        NULLIF(btrim(p_payload->>'party_color'), ''),
        COALESCE(NULLIF(btrim(p_payload->>'party_logo'), ''), 'star'),
        NULLIF(btrim(p_payload->>'custom_logo_url'), ''),
        NULLIF(btrim(p_payload->>'party_description'), ''),
        NULLIF(btrim(p_payload->>'leader_first_name'), ''),
        NULLIF(btrim(p_payload->>'leader_last_name'), ''),
        NULLIF(p_payload->>'leader_age', '')::int,
        COALESCE(v_cur_tick, 0), 0, false, NULL
    )
    RETURNING id INTO v_faction_id;

    RETURN jsonb_build_object(
        'success', true,
        'faction_id', v_faction_id,
        'faction_name', v_name,
        'abbreviation', v_abbr,
        'seats', v_seats,
        'faction_type', 'movement_party'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_party(jsonb) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
