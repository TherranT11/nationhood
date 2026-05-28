-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD PARTY — explicit id in the INSERT (defensive)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Symptom: Admin → Add Party fails with
--   "duplicate key value violates unique constraint 'factions_pkey'"
-- on the very first attempt for a brand-new (nation, name) pair. Neither
-- 20270351 nor 20270365 supplied id in the INSERT — both relied on the
-- factions.id DEFAULT gen_random_uuid() column default. A genuine UUIDv4
-- collision is astronomically unlikely, so the most plausible explanation
-- is that the deployed admin_create_party body is still an earlier
-- variant (one that set id from somewhere fixed — e.g. auth.uid()) and
-- the new function definition hadn't actually replaced it.
--
-- Fix: re-issue the function with id := gen_random_uuid() spelled out in
-- the INSERT so the id is never inherited from a column default, a
-- stale cached body, or any BEFORE-INSERT trigger that might have been
-- patched onto factions out of band. Body is otherwise identical to
-- 20270365 — same gates, same payload reads, same return shape.
--
-- If this migration runs and the error reproduces, the next step is to
-- look at the live factions table for triggers / constraints not in
-- source:
--   SELECT trigger_name, action_timing, event_manipulation, action_statement
--     FROM information_schema.triggers WHERE event_object_table = 'factions';
--   SELECT conname, pg_get_constraintdef(oid)
--     FROM pg_constraint WHERE conrelid = 'public.factions'::regclass;
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
    v_faction_id  uuid := gen_random_uuid();
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

    -- id is spelled out (gen_random_uuid()) so it never inherits from a
    -- column default, a cached function body, or a stray BEFORE INSERT
    -- trigger. See header for the root-cause notes.
    INSERT INTO factions (
        id,
        faction_type, faction_name, nation_id, nation, shard_id,
        abbreviation, seats, party_color, party_logo, custom_logo_url,
        party_description, leader_first_name, leader_last_name, leader_age,
        founded_tick, action_points, needs_rebuild, abandoned_at
    ) VALUES (
        v_faction_id,
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
    );

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
