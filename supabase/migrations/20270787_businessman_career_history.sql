-- ════════════════════════════════════════════════════════════════════
-- 20270787 — Businessman career history: rolled at creation
--
-- The CAREER tab unlocks with a Career History section whose entries
-- are auto-rolled once when the businessman is created (and
-- backfilled for existing ones), shaped by archetype:
--
--   youthful_salaryman    one entry at (founding tick - 1):
--                         "Graduated from {Capital} University" with a
--                         degree in Economics / Accounting /
--                         Communications / Business.
--
--   seasoned_executive    1d3 directorships at corporations in the
--                         home nation (drawn from entrepreneur_corps
--                         HQ'd there; generated firm names backfill
--                         when the nation has too few corps):
--                         "Director of Regional Operations/Finances/
--                         Sales", each lasting 1d12 + 5 years, chained
--                         backwards from the founding year.
--
--   wealthy_entrepreneur  2-4 ventures founded and sold, chained
--                         backwards: "Founded {Name}" · sold after
--                         3-10 years for $6M-$45M. Pure backstory —
--                         the proceeds are already in the $65M start.
--
-- Stored as factions.biz_career_history — a jsonb array of
-- { year, label, sub } rendered newest-first. Display strings are
-- built server-side (same posture as embassy draw snapshots) so the
-- client just lists them.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS biz_career_history jsonb;

-- ── History roll helper ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._roll_businessman_history(
    p_archetype text,
    p_nation_id uuid,
    p_capital   text,
    p_tick      int
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE
AS $$
DECLARE
    v_degrees  text[] := ARRAY['Economics','Accounting','Communications','Business'];
    v_depts    text[] := ARRAY['Operations','Finances','Sales'];
    v_firms    text[] := ARRAY['Altamira Group','Camino Real Holdings','Tres Fuentes Industries',
                               'La Ribera Logistics','Monte Claro Capital','Buenaventura Trading'];
    v_brands   text[] := ARRAY['Naviera Dorado','Altamira','Coronado','Valverde','Solano',
                               'Belmonte','Mirasol','Esperanza','Cresta Azul','Puerta Norte'];
    v_kinds    text[] := ARRAY['Industries','Group','Logistics','Foods','Media','Shipping'];
    v_hist     jsonb := '[]'::jsonb;
    v_year     int := 2000 + (COALESCE(p_tick, 0) / 12);
    v_corps    text[];
    v_n        int;
    v_end      int;
    v_dur      int;
    v_founded  int;
    v_name     text;
    v_sale     int;
    i          int;
BEGIN
    IF p_archetype = 'youthful_salaryman' OR p_archetype IS NULL THEN
        v_hist := jsonb_build_array(jsonb_build_object(
            'year',  2000 + ((GREATEST(COALESCE(p_tick, 0) - 1, 0)) / 12),
            'label', 'Graduated from ' || COALESCE(p_capital, 'the capital') || ' University',
            'sub',   'Degree in ' || v_degrees[1 + floor(random() * 4)::int]
        ));

    ELSIF p_archetype = 'seasoned_executive' THEN
        v_n := 1 + floor(random() * 3)::int;   -- 1d3 stints
        SELECT array_agg(name) INTO v_corps FROM (
            SELECT name FROM entrepreneur_corps
             WHERE hq_nation_id = p_nation_id
             ORDER BY random() LIMIT v_n) t;
        v_end := v_year;
        FOR i IN 1..v_n LOOP
            v_dur  := 6 + floor(random() * 12)::int;   -- 1d12 + 5 → 6..17 years
            v_name := COALESCE(v_corps[i],
                               v_firms[1 + floor(random() * array_length(v_firms, 1))::int]);
            v_hist := v_hist || jsonb_build_array(jsonb_build_object(
                'year',  v_end,
                'label', 'Director of Regional ' || v_depts[1 + floor(random() * 3)::int]
                         || ' — ' || v_name,
                'sub',   v_dur || ' years (' || (v_end - v_dur) || '–' || v_end || ')'
            ));
            v_end := v_end - v_dur - (1 + floor(random() * 2)::int);
        END LOOP;

    ELSIF p_archetype = 'wealthy_entrepreneur' THEN
        v_n   := 2 + floor(random() * 3)::int;   -- 2..4 ventures
        v_end := v_year - (1 + floor(random() * 3)::int);
        FOR i IN 1..v_n LOOP
            v_name    := v_brands[1 + floor(random() * array_length(v_brands, 1))::int]
                         || ' '
                         || v_kinds[1 + floor(random() * array_length(v_kinds, 1))::int];
            v_dur     := 3 + floor(random() * 8)::int;   -- held 3..10 years
            v_founded := v_end - v_dur;
            v_sale    := 6 + floor(random() * 40)::int;  -- $6M..$45M
            v_hist := v_hist || jsonb_build_array(jsonb_build_object(
                'year',  v_end,
                'label', 'Founded ' || v_name,
                'sub',   v_founded || '–' || v_end || ' · Sold for $' || v_sale || 'M'
            ));
            v_end := v_founded - (1 + floor(random() * 3)::int);
        END LOOP;
    END IF;

    RETURN v_hist;
END $$;

REVOKE EXECUTE ON FUNCTION public._roll_businessman_history(text, uuid, text, int) FROM PUBLIC;

-- ── create_businessman re-emit: roll + store the history ──────────
-- Body byte-faithful to 20270786 except the history roll (after the
-- nation fetch, so the capital is available) and the new insert
-- column.
CREATE OR REPLACE FUNCTION public.create_businessman(
    p_nation_id  uuid,
    p_first_name text,
    p_last_name  text,
    p_archetype  text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid             uuid := auth.uid();
    v_nation          nations%ROWTYPE;
    v_tick            int;
    v_existing        uuid;
    v_existing_banned boolean;
    v_primary         uuid;
    v_is_linked       boolean;
    v_faction_id      uuid;
    v_first           text;
    v_last            text;
    v_funds           numeric;
    v_age             int;
    v_res             jsonb;
    v_hist            jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    v_first := btrim(COALESCE(p_first_name, ''));
    v_last  := btrim(COALESCE(p_last_name,  ''));
    IF length(v_first) < 1 OR length(v_last) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;

    IF p_archetype = 'wealthy_entrepreneur' THEN
        v_funds := 65000000; v_age := 60;
    ELSIF p_archetype = 'seasoned_executive' THEN
        v_funds := 2000000;  v_age := 50;
    ELSIF p_archetype = 'youthful_salaryman' THEN
        v_funds := 150000;   v_age := 25;
    ELSE
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_archetype');
    END IF;
    v_res := _roll_businessman_residence(p_archetype);

    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;
    IF v_nation.name NOT IN ('Melizea', 'Avelia', 'Montequilla', 'Sierramar') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_foundable');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_hist := _roll_businessman_history(p_archetype, p_nation_id, v_nation.capital, v_tick);

    SELECT id, COALESCE(is_banned, false) INTO v_existing, v_existing_banned
      FROM factions
     WHERE faction_type = 'businessman'
       AND nation_id    = p_nation_id
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     LIMIT 1;
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false,
            'reason', CASE WHEN v_existing_banned THEN 'banned_in_nation'
                           ELSE 'already_in_nation' END);
    END IF;

    SELECT id INTO v_primary FROM factions
     WHERE id = v_uid AND abandoned_at IS NULL
     LIMIT 1;
    v_is_linked  := v_primary IS NOT NULL;
    v_faction_id := CASE WHEN v_is_linked THEN gen_random_uuid() ELSE v_uid END;

    BEGIN
        IF v_is_linked THEN
            INSERT INTO factions (
                id, faction_type, faction_name,
                nation_id, nation,
                seats, action_points, party_funds,
                entrepreneur_archetype,
                biz_residence_name, biz_residence_worth, biz_career_history,
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                linked_user_id
            ) VALUES (
                v_faction_id, 'businessman',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, v_funds,
                p_archetype,
                v_res->>'name', (v_res->>'worth')::bigint, v_hist,
                NULL,
                v_first, v_last, v_age,
                v_tick,
                v_uid
            );
        ELSE
            INSERT INTO factions (
                id, faction_type, faction_name,
                nation_id, nation,
                seats, action_points, party_funds,
                entrepreneur_archetype,
                biz_residence_name, biz_residence_worth, biz_career_history,
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                linked_user_id
            ) VALUES (
                v_faction_id, 'businessman',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, v_funds,
                p_archetype,
                v_res->>'name', (v_res->>'worth')::bigint, v_hist,
                NULL,
                v_first, v_last, v_age,
                v_tick,
                NULL
            )
            ON CONFLICT (id) DO UPDATE SET
                faction_type           = EXCLUDED.faction_type,
                faction_name           = EXCLUDED.faction_name,
                nation_id              = EXCLUDED.nation_id,
                nation                 = EXCLUDED.nation,
                seats                  = EXCLUDED.seats,
                action_points          = EXCLUDED.action_points,
                party_funds            = EXCLUDED.party_funds,
                entrepreneur_archetype = EXCLUDED.entrepreneur_archetype,
                biz_residence_name     = EXCLUDED.biz_residence_name,
                biz_residence_worth    = EXCLUDED.biz_residence_worth,
                biz_career_history     = EXCLUDED.biz_career_history,
                abandoned_at           = NULL,
                leader_first_name      = EXCLUDED.leader_first_name,
                leader_last_name       = EXCLUDED.leader_last_name,
                leader_age             = EXCLUDED.leader_age,
                founded_tick           = EXCLUDED.founded_tick,
                linked_user_id         = NULL;
        END IF;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_occupied');
    END;

    RETURN jsonb_build_object(
        'success',    true,
        'faction_id', v_faction_id
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.create_businessman(uuid, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_businessman(uuid, text, text, text) TO authenticated;

-- ── Backfill existing businessmen ─────────────────────────────────
-- Direct correlated call in SET (single column, so none of the
-- multi-column gymnastics 20270786 needed). NULL archetypes get the
-- salaryman-tier degree entry, matching the residence backfill.
UPDATE public.factions f
   SET biz_career_history = public._roll_businessman_history(
           f.entrepreneur_archetype,
           f.nation_id,
           (SELECT n.capital FROM nations n WHERE n.id = f.nation_id),
           COALESCE(f.founded_tick, 0))
 WHERE f.faction_type = 'businessman'
   AND f.biz_career_history IS NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
