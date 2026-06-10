-- ════════════════════════════════════════════════════════════════════
-- 20270786 — Businessman residence: rolled at creation, persisted
--
-- The businessman home page gains an identity row (location,
-- residence, debt, net worth, assets, status). The residence is the
-- only piece needing new state — name and worth are rolled ONCE at
-- creation (re-rolling per page load would let players refresh-shop
-- their net worth) and stored on the faction row:
--
--   wealthy_entrepreneur  fancy estate name ("Naruna Villa",
--                         "Blanco Estate" style)
--                         worth = 1d16 ($1M..$16M) + $3M flat
--                               = $4,000,000 .. $19,000,000
--   seasoned_executive    neighborhood name ("Las Colinas Heights")
--                         worth = $600,000 .. $900,000
--   youthful_salaryman    "Modest Townhome"
--                         worth = $250,000 .. $400,000
--
-- Net worth is NOT stored — it's cash on hand + residence worth,
-- computed wherever displayed (one source of truth: the two parts).
--
-- create_businessman is re-emitted (same signature as 20270785, so
-- CREATE OR REPLACE suffices) with the residence roll added to the
-- archetype branch. Existing businessman rows are backfilled with a
-- roll for their stored archetype (salaryman-tier when the archetype
-- predates 20270785 and is NULL).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS biz_residence_name  text,
    ADD COLUMN IF NOT EXISTS biz_residence_worth bigint;

-- ── Residence roll helper ─────────────────────────────────────────
-- One place for the name pools + worth ranges; used by the creation
-- RPC and the backfill below.
CREATE OR REPLACE FUNCTION public._roll_businessman_residence(p_archetype text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE
AS $$
DECLARE
    v_estates   text[] := ARRAY['Naruna','Blanco','Mirasol','Altamira','Coronado',
                                'Esperanza','Valverde','Marisol','Solano','Belmonte',
                                'Montefino','Aurelia','Dorado','Serena','Cresta Azul','Riviera'];
    v_est_kinds text[] := ARRAY['Villa','Estate','Manor','Hacienda','House'];
    v_hoods     text[] := ARRAY['Altavista','Los Cedros','Puerta Norte','San Rafael',
                                'Las Colinas','El Mirador','Vista Hermosa','Camino Real',
                                'Monte Claro','La Ribera','Tres Fuentes','Buenaventura'];
    v_hood_kinds text[] := ARRAY['Heights','District','Gardens','Quarter','Terrace'];
    v_name  text;
    v_worth bigint;
BEGIN
    IF p_archetype = 'wealthy_entrepreneur' THEN
        v_name  := v_estates[1 + floor(random() * array_length(v_estates, 1))::int]
                   || ' '
                   || v_est_kinds[1 + floor(random() * array_length(v_est_kinds, 1))::int];
        -- 1d16 million + $3M flat → $4M..$19M
        v_worth := (1 + floor(random() * 16))::bigint * 1000000 + 3000000;
    ELSIF p_archetype = 'seasoned_executive' THEN
        v_name  := v_hoods[1 + floor(random() * array_length(v_hoods, 1))::int]
                   || ' '
                   || v_hood_kinds[1 + floor(random() * array_length(v_hood_kinds, 1))::int];
        -- $600k..$900k in $1k steps
        v_worth := 600000 + floor(random() * 301)::bigint * 1000;
    ELSE
        -- youthful_salaryman, and the pre-archetype NULL backfill tier
        v_name  := 'Modest Townhome';
        -- $250k..$400k in $1k steps
        v_worth := 250000 + floor(random() * 151)::bigint * 1000;
    END IF;
    RETURN jsonb_build_object('name', v_name, 'worth', v_worth);
END $$;

REVOKE EXECUTE ON FUNCTION public._roll_businessman_residence(text) FROM PUBLIC;

-- ── create_businessman re-emit: roll + store the residence ────────
-- Body byte-faithful to 20270785 except the residence roll and the
-- two new insert columns.
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
                biz_residence_name, biz_residence_worth,
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
                v_res->>'name', (v_res->>'worth')::bigint,
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
                biz_residence_name, biz_residence_worth,
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
                v_res->>'name', (v_res->>'worth')::bigint,
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
-- One roll per residence-less row, tiered by stored archetype
-- (salaryman-tier for pre-archetype NULLs). The multi-column SET
-- subquery may reference the target row (unlike a FROM-clause
-- LATERAL, which cannot) and calls the volatile roll exactly once
-- per row, so name and worth come from the same roll.
UPDATE public.factions f
   SET (biz_residence_name, biz_residence_worth) =
       (SELECT r.res->>'name', (r.res->>'worth')::bigint
          FROM (SELECT public._roll_businessman_residence(f.entrepreneur_archetype) AS res) r)
 WHERE f.faction_type = 'businessman'
   AND f.biz_residence_name IS NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
