-- ════════════════════════════════════════════════════════════════════
-- 20270792 — Fix Start Corporation: hq column does not exist on prod
--
-- Live failure: businessman_start_corporation (20270788) INSERTed
-- into entrepreneur_corps.hq — a column from the table's original
-- 20270139 definition that the production table no longer carries
-- (the live founding RPC, 20270656, writes hq_nation_id only).
--
-- Fix: a real hq_city column (the modal's chosen city; entrepreneur
-- corps stay NULL and keep their nation-level HQ display) and the
-- RPC re-emitted byte-faithful to 20270788 with the INSERT targeting
-- it. business-corp.html reads hq_city.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.entrepreneur_corps
    ADD COLUMN IF NOT EXISTS hq_city text;

COMMENT ON COLUMN public.entrepreneur_corps.hq_city IS
    'Headquarters city name chosen at founding (businessman flow, 20270792). NULL on entrepreneur-founded corps, whose HQ remains nation-level.';

-- ── 4. businessman_start_corporation ──────────────────────────────
CREATE OR REPLACE FUNCTION public.businessman_start_corporation(
    p_faction_id uuid,
    p_city_id    uuid,
    p_industry   text,
    p_name       text,
    p_logo_url   text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_fac    factions%ROWTYPE;
    v_city   cities%ROWTYPE;
    v_tick   int;
    v_cost   constant numeric := 10000;
    v_corp_id uuid;
    v_name   text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL OR p_city_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_industry NOT IN ('construction', 'automotive') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_industry');
    END IF;
    v_name := btrim(COALESCE(p_name, ''));
    IF length(v_name) < 2 OR length(v_name) > 60 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_businessman');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT * INTO v_city FROM cities
     WHERE id = p_city_id AND nation_id = v_fac.nation_id;
    IF v_city.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_city');
    END IF;

    IF EXISTS (SELECT 1 FROM entrepreneur_corps WHERE lower(name) = lower(v_name)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_taken');
    END IF;

    IF COALESCE(v_fac.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'cost', v_cost, 'funds', COALESCE(v_fac.party_funds, 0));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_cost
     WHERE id = v_fac.id;

    INSERT INTO entrepreneur_corps (
        owner_faction_id, name, industry,
        hq_city, hq_nation_id,
        starting_capital, founding_fee, listing,
        founded_tick, logo_url
    ) VALUES (
        v_fac.id, v_name, p_industry,
        v_city.city_name, v_fac.nation_id,
        0, v_cost, 'private',
        v_tick, NULLIF(btrim(COALESCE(p_logo_url, '')), '')
    ) RETURNING id INTO v_corp_id;

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key, fired_at_tick
    ) VALUES (
        v_fac.nation_id, v_fac.id,
        'Corporation Founded',
        COALESCE(v_fac.faction_name, 'A businessman') || ' has founded ' || v_name
            || ' in ' || v_city.city_name || '.',
        'economy', 'businessman_founded_corp', v_tick
    );

    RETURN jsonb_build_object(
        'success',   true,
        'corp_id',   v_corp_id,
        'corp_name', v_name,
        'city',      v_city.city_name,
        'new_funds', COALESCE(v_fac.party_funds, 0) - v_cost
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.businessman_start_corporation(uuid, uuid, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.businessman_start_corporation(uuid, uuid, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
