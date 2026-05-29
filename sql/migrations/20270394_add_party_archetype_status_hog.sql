-- ════════════════════════════════════════════════════════════════════
-- ADD PARTY — archetype label + status dropdown + Head of Government
-- ════════════════════════════════════════════════════════════════════
-- User-confirmed design change on the Add Party admin form:
--
--   • REMOVE  Logo Icon + Custom Logo URL inputs
--   • ADD     Archetype dropdown (10 fixed labels, see ARCHETYPE_LIST
--             below). Pure label — no mechanics attached, no stronghold
--             seeding, no platform binding. Stored into the existing
--             factions.archetype text column alongside the party-side
--             ARCHETYPES (8 entries) and the entrepreneur_archetype
--             column for entrepreneurs; the 10 new strings are
--             movement-party-only by convention, no constraint.
--   • ADD     Status dropdown (Governing / Coalition / Opposition).
--             New factions.party_status text column with a CHECK
--             constraint pinning the 3 allowed values. Display-only —
--             does not feed the coalition / government-role system,
--             which has its own dynamic computation.
--   • ADD     "Head of Government?" checkbox below the Leader section.
--             When checked AND the Leader first/last name fields are
--             non-empty, the RPC overwrites the chosen nation's
--             head_of_state_first_name / head_of_state_last_name with
--             the leader's. This is a one-time mutation at party
--             creation; no persistent link. A warning in the form
--             copy makes the overwrite explicit.
--
-- Three steps wrapped in one transaction:
--   1. ALTER TABLE factions ADD party_status
--   2. CREATE OR REPLACE admin_create_party (body otherwise verbatim
--      from 20270379)
--   3. system_config.admin_panel_html — swap the logo block for the
--      archetype + status dropdowns, and inject the HoG checkbox
--      after the Leader section.
--
-- Idempotent throughout. The HTML swaps guard on string-presence so
-- a re-run on already-migrated HTML is a no-op.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. New column ───────────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS party_status text;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'factions_party_status_check'
    ) THEN
        ALTER TABLE public.factions
            ADD CONSTRAINT factions_party_status_check
            CHECK (party_status IS NULL OR party_status IN ('Governing', 'Coalition', 'Opposition'));
    END IF;
END $$;

COMMENT ON COLUMN public.factions.party_status IS
    'Display-only label for a Politician Movement Party''s government posture: Governing / Coalition / Opposition. Set by the admin via the Add Party form (20270394). Independent of the live coalition / lead_party_id machinery, which computes a real party''s role dynamically.';

-- ── 2. RPC — accept archetype + party_status + is_head_of_government ─
-- Body verbatim from 20270379 except: three new payload reads, two new
-- INSERT columns, one defensive validation for the 10 archetype values
-- + 3 status values, and a tail block that overwrites the nation's
-- head_of_state_first_name / last_name when the checkbox is set AND the
-- leader name fields are non-empty.
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
    v_archetype   text := NULLIF(btrim(p_payload->>'archetype'), '');
    v_status      text := NULLIF(btrim(p_payload->>'party_status'), '');
    v_is_hog      bool := COALESCE((p_payload->>'is_head_of_government')::bool, false);
    v_leader_f    text := NULLIF(btrim(p_payload->>'leader_first_name'), '');
    v_leader_l    text := NULLIF(btrim(p_payload->>'leader_last_name'), '');
    v_nation_name text;
    v_shard_id    uuid;
    v_cur_tick    int;
    v_faction_id  uuid := gen_random_uuid();
    -- Allowed archetype labels (movement-party set). The HTML dropdown
    -- mirrors this list; the CHECK here is defence-in-depth against a
    -- payload bypassing the form (admin-tab JS, curl, etc).
    v_archetype_ok constant text[] := ARRAY[
        'Reform', 'Social Democratic', 'Traditional Conservative',
        'Liberal', 'Libertarian', 'Communist / Leftist',
        'Green', 'Nationalist', 'Populist', 'Centrist'
    ];
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
    IF v_archetype IS NOT NULL AND NOT (v_archetype = ANY (v_archetype_ok)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_archetype');
    END IF;
    -- party_status is independently CHECK'd at column level; this guard
    -- short-circuits with a clean reason instead of a constraint error.
    IF v_status IS NOT NULL AND v_status NOT IN ('Governing', 'Coalition', 'Opposition') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_status');
    END IF;
    -- HoG checkbox + leader name relationship: the only useful thing
    -- the HoG flag does is replace the nation's head_of_state_first_name
    -- / last_name with the leader's. A checked box with no leader name
    -- to install would just be a silent no-op; reject with a clean
    -- reason so the admin sees the mistake instead of a missing
    -- side effect.
    IF v_is_hog AND (v_leader_f IS NULL OR v_leader_l IS NULL) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hog_requires_leader');
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
        archetype, party_status,
        party_description, leader_first_name, leader_last_name, leader_age,
        deputy_first_name, deputy_last_name, deputy_age,
        whip_first_name, whip_last_name, whip_age,
        founded_tick, action_points, needs_rebuild, abandoned_at
    ) VALUES (
        v_faction_id,
        'movement_party', v_name, v_nation_id, v_nation_name, v_shard_id,
        v_abbr, v_seats,
        NULLIF(btrim(p_payload->>'party_color'), ''),
        -- Logo Icon / Custom Logo URL inputs are removed from the form
        -- (20270394). The columns stay; movement parties just default
        -- 'star' / NULL going forward. Preserved here so legacy non-form
        -- callers that still pass them keep working.
        COALESCE(NULLIF(btrim(p_payload->>'party_logo'), ''), 'star'),
        NULLIF(btrim(p_payload->>'custom_logo_url'), ''),
        v_archetype, v_status,
        NULLIF(btrim(p_payload->>'party_description'), ''),
        v_leader_f,
        v_leader_l,
        NULLIF(p_payload->>'leader_age', '')::int,
        NULLIF(btrim(p_payload->>'deputy_first_name'), ''),
        NULLIF(btrim(p_payload->>'deputy_last_name'), ''),
        NULLIF(p_payload->>'deputy_age', '')::int,
        NULLIF(btrim(p_payload->>'whip_first_name'), ''),
        NULLIF(btrim(p_payload->>'whip_last_name'), ''),
        NULLIF(p_payload->>'whip_age', '')::int,
        COALESCE(v_cur_tick, 0), 0, false, NULL
    );

    -- Head of Government overwrite. The hog_requires_leader guard
    -- above ensures both leader name fields are non-NULL whenever
    -- v_is_hog is TRUE, so the UPDATE is unconditional here. Targets
    -- nations.head_of_state_first_name / last_name directly — the
    -- nation's current HoS is replaced silently; the form copy warns
    -- the admin before submit.
    IF v_is_hog THEN
        UPDATE nations
           SET head_of_state_first_name = v_leader_f,
               head_of_state_last_name  = v_leader_l
         WHERE id = v_nation_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'faction_id', v_faction_id,
        'faction_name', v_name,
        'abbreviation', v_abbr,
        'seats', v_seats,
        'faction_type', 'movement_party',
        'archetype', v_archetype,
        'party_status', v_status,
        'head_of_government_set', v_is_hog
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_party(jsonb) TO authenticated;

-- ── 3. HTML — admin_panel_html ──────────────────────────────────────

-- 3a. Swap the Logo Icon + Custom Logo URL inputs for Archetype + Status.
UPDATE system_config
SET value = REPLACE(
    value,
    '                <div class="input-group"><label>Logo Icon</label><input type="text" id="ap-logo" maxlength="40" value="star"></div>
                <div class="input-group"><label>Custom Logo URL (optional)</label><input type="text" id="ap-logo-url" placeholder="assets/logos/alp.png"></div>',
    '                <div class="input-group">
                    <label>Archetype</label>
                    <select id="ap-archetype">
                        <option value="">(none)</option>
                        <option value="Reform">Reform</option>
                        <option value="Social Democratic">Social Democratic</option>
                        <option value="Traditional Conservative">Traditional Conservative</option>
                        <option value="Liberal">Liberal</option>
                        <option value="Libertarian">Libertarian</option>
                        <option value="Communist / Leftist">Communist / Leftist</option>
                        <option value="Green">Green</option>
                        <option value="Nationalist">Nationalist</option>
                        <option value="Populist">Populist</option>
                        <option value="Centrist">Centrist</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Status</label>
                    <select id="ap-party-status">
                        <option value="">(none)</option>
                        <option value="Governing">Governing</option>
                        <option value="Coalition">Coalition</option>
                        <option value="Opposition">Opposition</option>
                    </select>
                </div>'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value LIKE '%id="ap-logo"%'
  AND value NOT LIKE '%id="ap-archetype"%';

-- 3b. Inject the Head of Government checkbox after the Leader section
-- (between the Leader inputs and the Deputy Leader section added by
-- 20270379). Anchor on the Deputy heading so the insert is unambiguous.
UPDATE system_config
SET value = REPLACE(
    value,
    '            <h3 style="margin:14px 0 6px; font-size:0.95rem;">Deputy Leader (optional)</h3>',
    '            <div class="input-group" style="margin:10px 0 6px;">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                    <input type="checkbox" id="ap-hog" style="width:auto; margin:0;">
                    <span>Head of Government? <span style="color:#888; font-weight:400; font-size:0.85rem;">&mdash; if checked, the Leader (first + last name) <strong>replaces</strong> the chosen nation''s current Head of State.</span></span>
                </label>
            </div>

            <h3 style="margin:14px 0 6px; font-size:0.95rem;">Deputy Leader (optional)</h3>'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value LIKE '%Deputy Leader (optional)%'
  AND value NOT LIKE '%id="ap-hog"%';

NOTIFY pgrst, 'reload schema';

COMMIT;
