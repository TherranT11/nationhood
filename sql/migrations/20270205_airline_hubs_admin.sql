-- ═══════════════════════════════════════════════════════════════════════════════
-- AIRLINE HUBS — admin management (RPCs + admin "Hubs" tab)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds an admin-only "Hubs" tab to manage airline_cities (hubs) and the
-- airline_city_ranges distance matrix from the Admin Panel.
--
-- A "hub" is an airline_cities row: name + nation + population_pct (used here
-- as a 1-15 demand WEIGHT) + runway_type (short/standard/international) +
-- terminal_count (slot rows in airline_terminals) + is_capital.
--
-- Range matrix = airline_city_ranges, stored canonically (city_a_id < city_b_id),
-- one row per undirected pair. KEPT ON THE EXISTING SCALE (domestic hops ~4-11,
-- cross-nation ~75-80) — the aircraft range gating in entrepreneur_open_route
-- (regional ≤20, narrowbody ≤60, widebody any) reads these directly, so the
-- matrix is NOT constrained to 1-10; it accepts any range_units > 0.
--
-- ── Why RPCs (not direct table writes like the Provinces tab) ────────────────
-- airline_cities / airline_terminals / airline_city_ranges are world-readable
-- but have NO client write policy (writes are RPC-only, like the entrepreneur_*
-- functions). Rather than open broad write RLS on these gameplay tables, the
-- admin mutations go through SECURITY DEFINER RPCs gated by is_admin().
--
-- Creating a hub also materializes its terminal slot rows (airline_terminals),
-- mirroring the 20260706 seed, so a new hub is immediately claimable. Editing
-- terminal_count safely adds/removes UNOWNED slots only. Deleting a hub is
-- blocked while any slot is owned or any active route touches it.
--
-- JS handlers live in admin.html. Tab HTML is injected into
-- system_config.admin_panel_html (same mechanism as the Provinces tab,
-- 20270135_provinces_phase1_admin_tab.sql).
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. admin_create_hub ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_create_hub(
    p_nation_id  uuid,
    p_name       text,
    p_weight     numeric,
    p_runway     text,
    p_terminals  int,
    p_is_capital boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_name text := btrim(COALESCE(p_name, ''));
    v_hub  uuid;
    v_i    int;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    IF p_nation_id IS NULL OR NOT EXISTS (SELECT 1 FROM nations WHERE id = p_nation_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;
    IF length(v_name) < 2 OR length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_weight IS NULL OR p_weight < 1 OR p_weight > 15 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_weight');
    END IF;
    IF p_runway NOT IN ('short','standard','international') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_runway');
    END IF;
    IF p_terminals IS NULL OR p_terminals < 1 OR p_terminals > 10 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_terminals');
    END IF;
    IF EXISTS (SELECT 1 FROM airline_cities WHERE nation_id = p_nation_id AND lower(name) = lower(v_name)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_exists');
    END IF;

    -- One capital per nation: reassigning clears the previous holder.
    IF COALESCE(p_is_capital, false) THEN
        UPDATE airline_cities SET is_capital = false
         WHERE nation_id = p_nation_id AND is_capital = true;
    END IF;

    INSERT INTO airline_cities (nation_id, name, population_pct, terminal_count, runway_type, is_capital)
    VALUES (p_nation_id, v_name, p_weight, p_terminals, p_runway, COALESCE(p_is_capital, false))
    RETURNING id INTO v_hub;

    -- Materialize the terminal slots (all unowned), mirroring the 20260706 seed.
    FOR v_i IN 1..p_terminals LOOP
        INSERT INTO airline_terminals (city_id, terminal_number) VALUES (v_hub, v_i);
    END LOOP;

    RETURN jsonb_build_object('success', true, 'hub_id', v_hub);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_hub(uuid, text, numeric, text, int, boolean) TO authenticated;

COMMENT ON FUNCTION public.admin_create_hub(uuid, text, numeric, text, int, boolean) IS
    'Admin-only. Creates an airline hub (airline_cities row) with weight 1-15, runway short/standard/international, and N (1-10) terminal slot rows. Reassigns the nation capital if p_is_capital. is_admin() gated.';

-- ── 2. admin_update_hub ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_update_hub(
    p_hub_id     uuid,
    p_name       text,
    p_weight     numeric,
    p_runway     text,
    p_terminals  int,
    p_is_capital boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hub   airline_cities%ROWTYPE;
    v_name  text := btrim(COALESCE(p_name, ''));
    v_cur   int;
    v_owned int;
    v_max   int;
    v_i     int;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    SELECT * INTO v_hub FROM airline_cities WHERE id = p_hub_id FOR UPDATE;
    IF v_hub.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hub_not_found');
    END IF;
    IF length(v_name) < 2 OR length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_weight IS NULL OR p_weight < 1 OR p_weight > 15 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_weight');
    END IF;
    IF p_runway NOT IN ('short','standard','international') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_runway');
    END IF;
    IF p_terminals IS NULL OR p_terminals < 1 OR p_terminals > 10 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_terminals');
    END IF;
    IF EXISTS (SELECT 1 FROM airline_cities
                WHERE nation_id = v_hub.nation_id AND lower(name) = lower(v_name) AND id <> p_hub_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_exists');
    END IF;

    -- Terminal-slot sync: add unowned rows to grow; drop only UNOWNED rows
    -- (highest number first) to shrink. Refuse to shrink below owned count.
    SELECT COUNT(*) INTO v_cur FROM airline_terminals WHERE city_id = p_hub_id;
    SELECT COUNT(*) INTO v_owned FROM airline_terminals
     WHERE city_id = p_hub_id AND (owner_airline_id IS NOT NULL OR owner_corp_id IS NOT NULL);

    IF p_terminals < v_owned THEN
        RETURN jsonb_build_object('success', false, 'reason', 'terminals_below_owned', 'owned', v_owned);
    END IF;

    IF p_terminals > v_cur THEN
        SELECT COALESCE(MAX(terminal_number), 0) INTO v_max FROM airline_terminals WHERE city_id = p_hub_id;
        FOR v_i IN 1..(p_terminals - v_cur) LOOP
            INSERT INTO airline_terminals (city_id, terminal_number) VALUES (p_hub_id, v_max + v_i);
        END LOOP;
    ELSIF p_terminals < v_cur THEN
        DELETE FROM airline_terminals
         WHERE id IN (
             SELECT id FROM airline_terminals
              WHERE city_id = p_hub_id
                AND owner_airline_id IS NULL
                AND owner_corp_id IS NULL
              ORDER BY terminal_number DESC
              LIMIT (v_cur - p_terminals)
         );
    END IF;

    -- One capital per nation: reassigning clears the previous holder.
    IF COALESCE(p_is_capital, false) AND NOT v_hub.is_capital THEN
        UPDATE airline_cities SET is_capital = false
         WHERE nation_id = v_hub.nation_id AND is_capital = true AND id <> p_hub_id;
    END IF;

    UPDATE airline_cities
       SET name           = v_name,
           population_pct  = p_weight,
           runway_type     = p_runway,
           terminal_count  = p_terminals,
           is_capital      = COALESCE(p_is_capital, false)
     WHERE id = p_hub_id;

    RETURN jsonb_build_object('success', true, 'hub_id', p_hub_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_hub(uuid, text, numeric, text, int, boolean) TO authenticated;

COMMENT ON FUNCTION public.admin_update_hub(uuid, text, numeric, text, int, boolean) IS
    'Admin-only. Updates a hub''s name/weight(1-15)/runway/terminal_count/capital. Terminal sync adds or removes UNOWNED slots only; refuses to shrink below the owned-slot count. is_admin() gated.';

-- ── 3. admin_delete_hub ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_delete_hub(p_hub_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hub airline_cities%ROWTYPE;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    SELECT * INTO v_hub FROM airline_cities WHERE id = p_hub_id;
    IF v_hub.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hub_not_found');
    END IF;

    IF EXISTS (SELECT 1 FROM airline_terminals
                WHERE city_id = p_hub_id
                  AND (owner_airline_id IS NOT NULL OR owner_corp_id IS NOT NULL)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'has_owned_terminals');
    END IF;
    IF EXISTS (SELECT 1 FROM airline_routes
                WHERE status = 'active'
                  AND (origin_city_id = p_hub_id OR dest_city_id = p_hub_id)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'has_active_routes');
    END IF;

    -- FK ON DELETE CASCADE removes the hub's terminals and range rows.
    DELETE FROM airline_cities WHERE id = p_hub_id;

    RETURN jsonb_build_object('success', true, 'hub_id', p_hub_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_hub(uuid) TO authenticated;

COMMENT ON FUNCTION public.admin_delete_hub(uuid) IS
    'Admin-only. Deletes a hub (cascades its terminals + range rows). Blocked while any terminal slot is owned or any active route touches the hub. is_admin() gated.';

-- ── 4. admin_set_hub_ranges (bulk upsert) ────────────────────────
-- p_ranges: jsonb array of {"a": uuid, "b": uuid, "r": int}. Each pair is
-- canonicalized (a<b) and upserted; r <= 0 / null entries are skipped.
CREATE OR REPLACE FUNCTION public.admin_set_hub_ranges(p_ranges jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_e     jsonb;
    v_a     uuid;
    v_b     uuid;
    v_r     int;
    v_tmp   uuid;
    v_count int := 0;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    IF p_ranges IS NULL OR jsonb_typeof(p_ranges) <> 'array' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_payload');
    END IF;

    FOR v_e IN SELECT value FROM jsonb_array_elements(p_ranges) AS x(value)
    LOOP
        v_a := NULLIF(v_e->>'a', '')::uuid;
        v_b := NULLIF(v_e->>'b', '')::uuid;
        v_r := NULLIF(v_e->>'r', '')::int;

        CONTINUE WHEN v_a IS NULL OR v_b IS NULL OR v_a = v_b OR v_r IS NULL OR v_r <= 0;

        IF v_a > v_b THEN v_tmp := v_a; v_a := v_b; v_b := v_tmp; END IF;

        INSERT INTO airline_city_ranges (city_a_id, city_b_id, range_units)
        VALUES (v_a, v_b, v_r)
        ON CONFLICT (city_a_id, city_b_id) DO UPDATE SET range_units = EXCLUDED.range_units;

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'pairs_saved', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_hub_ranges(jsonb) TO authenticated;

COMMENT ON FUNCTION public.admin_set_hub_ranges(jsonb) IS
    'Admin-only bulk upsert of the airline_city_ranges matrix. Input: jsonb array of {a,b,r}; each pair canonicalized to a<b and upserted (r must be > 0). is_admin() gated.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. Inject the "Hubs" admin tab into system_config.admin_panel_html
-- ═══════════════════════════════════════════════════════════════════════════════
-- Pattern + idempotency guards follow 20270135_provinces_phase1_admin_tab.sql.

-- Step 1: tab button after the Provinces tab button.
UPDATE system_config
SET value = REPLACE(
    value,
    '<button class="tab" onclick="showTab(''provinces'')">Provinces</button>',
    '<button class="tab" onclick="showTab(''provinces'')">Provinces</button>' || chr(10) ||
    '            <button class="tab" onclick="showTab(''hubs'')">Hubs</button>'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value NOT LIKE '%showTab(''hubs'')%';

-- Step 2: tab-content div, before the Danger Zone tab.
UPDATE system_config
SET value = REPLACE(
    value,
    '        <!-- ==================== DANGER ZONE TAB ==================== -->',
    '        <!-- ==================== HUBS TAB ==================== -->
        <div class="tab-content" id="tab-hubs">
            <h2>Airline Hubs</h2>
            <p style="color:#888; font-size:0.9rem; margin-bottom:20px;">
                Manage airline hubs (cities): population <strong>weight (1-15)</strong>, runway class,
                and terminal slots. Below, set the pairwise <strong>range matrix</strong> used by aircraft
                route gating. Ranges use the existing scale (domestic hops ~4-11, cross-nation ~75-80) —
                regionals fly &le;20, narrowbodies &le;60, widebodies any range.
            </p>

            <div class="input-group">
                <label>Select Nation (to add a hub)</label>
                <select id="hub-nation-select" onchange="onHubNationSelect()">
                    <option value="">-- Choose a nation --</option>
                </select>
                <div id="hub-nation-pop" style="margin-top:6px; color:#a3b07e; font-weight:bold;">Population: &mdash;</div>
            </div>

            <div id="hub-add-form" class="hidden" style="background:#1c1c1c; border:1px solid #333; border-radius:4px; padding:14px; margin:12px 0;">
                <div style="display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap;">
                    <div class="input-group" style="flex:0 0 200px; margin-bottom:0;">
                        <label>Hub Name</label>
                        <input type="text" id="hub-new-name" placeholder="e.g. Northport" maxlength="80">
                    </div>
                    <div class="input-group" style="flex:0 0 130px; margin-bottom:0;">
                        <label>Weight (1-15)</label>
                        <input type="number" id="hub-new-weight" min="1" max="15" step="1" value="5">
                    </div>
                    <div class="input-group" style="flex:0 0 160px; margin-bottom:0;">
                        <label>Runway</label>
                        <select id="hub-new-runway">
                            <option value="short">Short Runway</option>
                            <option value="standard" selected>Standard</option>
                            <option value="international">International</option>
                        </select>
                    </div>
                    <div class="input-group" style="flex:0 0 130px; margin-bottom:0;">
                        <label>Terminals (1-10)</label>
                        <input type="number" id="hub-new-terminals" min="1" max="10" step="1" value="4">
                    </div>
                    <label style="display:flex; align-items:center; gap:6px; margin-bottom:8px; color:#ccc;">
                        <input type="checkbox" id="hub-new-capital"> Capital
                    </label>
                    <button class="btn btn-primary" onclick="addHub(this)">+ Add Hub</button>
                    <span id="hub-add-status" style="font-weight:bold;"></span>
                </div>
            </div>

            <h3 style="margin-top:24px;">All Hubs</h3>
            <div id="hub-list-container" style="overflow-x:auto;"><div class="no-players">Loading&hellip;</div></div>

            <h3 style="margin-top:24px;">Range Matrix</h3>
            <p style="color:#888; font-size:0.85rem; margin-bottom:8px;">
                Range from each hub to every other hub. Edit the upper cells; the lower mirror is read-only.
                Blank = no range set. Range must be a whole number &gt; 0.
            </p>
            <div id="hub-matrix-container" style="overflow-x:auto;"><div class="no-players">Loading&hellip;</div></div>
            <div style="display:flex; gap:12px; align-items:center; margin-top:14px;">
                <button class="btn btn-success" onclick="saveHubRanges(this)">Save Ranges</button>
                <span id="hub-ranges-status" style="font-weight:bold;"></span>
            </div>
        </div>

        <!-- ==================== DANGER ZONE TAB ==================== -->'
),
    updated_at = now()
WHERE key = 'admin_panel_html'
  AND value NOT LIKE '%id="tab-hubs"%';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.admin_set_hub_ranges(jsonb);
-- DROP FUNCTION IF EXISTS public.admin_delete_hub(uuid);
-- DROP FUNCTION IF EXISTS public.admin_update_hub(uuid, text, numeric, text, int, boolean);
-- DROP FUNCTION IF EXISTS public.admin_create_hub(uuid, text, numeric, text, int, boolean);
-- -- Tab HTML: manual removal from system_config.admin_panel_html if desired.
-- COMMIT;
