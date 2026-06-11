-- ════════════════════════════════════════════════════════════════════
-- 20270835 — DESIGN CHANGE: corp founding costs
--
-- The flat $10k founding fee is gone. Founding capital is now
--
--   CONSTRUCTION: $10M base · AUTOMOTIVE: $35M base
--   × the HQ nation's Standard of Living / 50 (50 is baseline)
--
-- so a SoL-75 nation charges 1.5× and a SoL-40 nation 0.8×. The fee
-- still debits party_funds and stamps founding_fee on the corp row.
--
-- businessman_start_corporation re-emitted byte-faithful to 20270832
-- (the automotive XP seed rides along) except the cost computation.
-- The career page's founding modal mirrors the same formula.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── businessman_start_corporation — SoL-scaled founding capital ───
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
    v_cost   numeric;
    v_sol    numeric;
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

    -- 20270835: founding capital — $10M construction / $35M
    -- automotive, scaled by the nation's Standard of Living
    -- (50 is baseline: SoL 75 costs 1.5×, SoL 40 costs 0.8×).
    SELECT GREATEST(1, COALESCE(standard_of_living, 50)) INTO v_sol
      FROM nations WHERE id = v_fac.nation_id;
    v_cost := ROUND(CASE p_industry
                        WHEN 'automotive' THEN 35000000
                        ELSE                   10000000
                    END * COALESCE(v_sol, 50) / 50.0);

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
        founded_tick, logo_url, experience
    ) VALUES (
        v_fac.id, v_name, p_industry,
        v_city.city_name, v_fac.nation_id,
        0, v_cost, 'private',
        v_tick, NULLIF(btrim(COALESCE(p_logo_url, '')), ''),
        -- 20270832: automotive corps open with 5 Experience — the
        -- Design Studio bootstrap (construction earns from builds).
        CASE WHEN p_industry = 'automotive' THEN 5 ELSE 0 END
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
