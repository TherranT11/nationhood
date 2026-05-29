-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD PARTY — Deputy Leader + Party Whip fields
-- ═══════════════════════════════════════════════════════════════════════════════
-- 20270376 / 20270377 added deputy_* / whip_* columns to factions and
-- backfilled HRF. This migration extends the Add Party admin form to
-- collect those same fields at creation time, and updates the
-- admin_create_party RPC to read them out of the payload and write them
-- into the INSERT alongside the existing leader_* fields.
--
-- Defaults: admin.html's loadAddPartyInit attaches a change listener to
-- the Nation dropdown that pre-fills both name + age fields from the
-- nation's culture pool (js/game/political-actions.js → getNationNames).
-- Admin can override any field before submit. Empty fields stay empty
-- on submit and the RPC writes NULL for them — same lenient pattern the
-- Leader fields use.
--
-- HTML changes are scoped to a single REPLACE that swaps the closing
-- </div> of the Leader (optional) section + the opening of the Create
-- button row with a block that inserts Deputy + Whip sections between
-- them. The Leader block itself stays byte-identical. Idempotent guard:
-- the REPLACE only fires when the new ap-deputy-first id isn't already
-- in the value.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Step 1: HTML — Deputy + Whip sections below Leader.
UPDATE system_config
SET value = REPLACE(
    value,
    '                <div class="input-group"><label>Age</label><input type="number" id="ap-leader-age" min="18" max="100"></div>
            </div>

            <div style="margin-top:18px;">',
    '                <div class="input-group"><label>Age</label><input type="number" id="ap-leader-age" min="18" max="100"></div>
            </div>

            <h3 style="margin:14px 0 6px; font-size:0.95rem;">Deputy Leader (optional)</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px;">
                <div class="input-group"><label>First Name</label><input type="text" id="ap-deputy-first" maxlength="50"></div>
                <div class="input-group"><label>Last Name</label><input type="text" id="ap-deputy-last" maxlength="50"></div>
                <div class="input-group"><label>Age</label><input type="number" id="ap-deputy-age" min="18" max="100"></div>
            </div>

            <h3 style="margin:14px 0 6px; font-size:0.95rem;">Party Whip (optional)</h3>
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px;">
                <div class="input-group"><label>First Name</label><input type="text" id="ap-whip-first" maxlength="50"></div>
                <div class="input-group"><label>Last Name</label><input type="text" id="ap-whip-last" maxlength="50"></div>
                <div class="input-group"><label>Age</label><input type="number" id="ap-whip-age" min="18" max="100"></div>
            </div>

            <div style="margin-top:18px;">'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value NOT LIKE '%id="ap-deputy-first"%';

-- Step 2: RPC — extend INSERT with deputy_* and whip_* fields.
-- Body is byte-identical to 20270370 except for the six new column
-- references in the INSERT column list + VALUES row. Same gates, same
-- payload reads, same return shape.
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

    INSERT INTO factions (
        id,
        faction_type, faction_name, nation_id, nation, shard_id,
        abbreviation, seats, party_color, party_logo, custom_logo_url,
        party_description, leader_first_name, leader_last_name, leader_age,
        deputy_first_name, deputy_last_name, deputy_age,
        whip_first_name, whip_last_name, whip_age,
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
        NULLIF(btrim(p_payload->>'deputy_first_name'), ''),
        NULLIF(btrim(p_payload->>'deputy_last_name'), ''),
        NULLIF(p_payload->>'deputy_age', '')::int,
        NULLIF(btrim(p_payload->>'whip_first_name'), ''),
        NULLIF(btrim(p_payload->>'whip_last_name'), ''),
        NULLIF(p_payload->>'whip_age', '')::int,
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

NOTIFY pgrst, 'reload schema';

COMMIT;
