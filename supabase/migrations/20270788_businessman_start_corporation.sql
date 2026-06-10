-- ════════════════════════════════════════════════════════════════════
-- 20270788 — Businessman: Start Company
--
-- [Start Company] on businessman-career.html opens the founding
-- modal: nation (fixed), a city picker showing GROWTH | JOBS | TAX
-- PACKAGES per city, corporation type (Construction or Automotive),
-- a name, an optional logo (2MB), and a $10,000 founding cost.
--
-- Schema groundwork:
--   • 'automotive' joins the entrepreneur_corps industry CHECK (the
--     select-nation picker has counted it since 20270778-era; this
--     makes rows of that industry actually insertable).
--   • starting_capital's table CHECK drops its $5M floor (now >= 0):
--     a businessman startup seeds at $0 capital with a $10k fee. The
--     entrepreneur founding band ($5M-$500M) is still enforced
--     server-side in its own RPC (20270656 'invalid_capital'), so
--     entrepreneur behavior is unchanged.
--   • entrepreneur_corps.logo_url — public URL into the new
--     corp-logos bucket (2MB cap, image mime types; provisioning
--     mirrors party-logos, 20260414).
--
-- businessman_start_corporation(p_faction_id, p_city_id, p_industry,
-- p_name, p_logo_url): ownership + arrest + funds guards, $10k
-- deducted from party_funds, corp inserted HQ'd in the chosen city
-- of the businessman's own nation, founding logged to event_log.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Industry CHECK gains 'automotive' ──────────────────────────
ALTER TABLE entrepreneur_corps
    DROP CONSTRAINT IF EXISTS entrepreneur_corps_industry_check;

ALTER TABLE entrepreneur_corps
    ADD CONSTRAINT entrepreneur_corps_industry_check
    CHECK (industry IN (
        'construction',
        'banking',
        'shipping',
        'real_estate',
        'airline',
        'aviation_manufacturing',
        'oil_and_gas',
        'automotive'
    ));

-- ── 2. starting_capital floor drops to 0 ──────────────────────────
ALTER TABLE entrepreneur_corps
    DROP CONSTRAINT IF EXISTS entrepreneur_corps_starting_capital_check;

ALTER TABLE entrepreneur_corps
    ADD CONSTRAINT entrepreneur_corps_starting_capital_check
    CHECK (starting_capital BETWEEN 0 AND 500000000);

-- ── 3. Logo column + corp-logos bucket ────────────────────────────
ALTER TABLE entrepreneur_corps
    ADD COLUMN IF NOT EXISTS logo_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'corp-logos',
    'corp-logos',
    true,
    2097152, -- 2MB
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload corp logos" ON storage.objects;
CREATE POLICY "Users can upload corp logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'corp-logos');

DROP POLICY IF EXISTS "Anyone can view corp logos" ON storage.objects;
CREATE POLICY "Anyone can view corp logos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'corp-logos');

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
        hq, hq_nation_id,
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
