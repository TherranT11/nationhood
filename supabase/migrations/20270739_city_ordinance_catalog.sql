-- ════════════════════════════════════════════════════════════════════
-- 20270739 — City ordinance catalog (V1 — foundation only)
--
-- Schema + create/list RPCs for the city ordinance system the user
-- spec'd against the empty [Active Ordinances] / [Voting Agenda]
-- placeholders on city.html. This migration ships the AUTHORING
-- side — anyone who currently holds mayor / city_council_member /
-- city_council_president can create ordinance templates via the
-- new cityordinance.html form.
--
-- Out of scope this migration (lands in 20270740):
--   • The Propose flow on the Mayor card (button → modal listing).
--   • city_ordinance_proposals + voting + resolution + rewards.
--   • city_ordinances (enacted instances) + display on city.html.
-- These get the next push so commit 1 stays reviewable on its own.
--
-- User-confirmed design choices (asked & answered):
--   • Catalog is GLOBAL — one shared ordinance pool across every
--     nation. Mateo's "Smoking Ban" appears in Avelia's Propose
--     list too.
--   • Authoring gated to Mayor / CCM / CCP (the three offices that
--     get the Propose action). Plain party members can't author.
--   • Cost deducts from city.budget on PASS (deferred to the
--     resolution RPC in 20270740).
--   • Vote mechanic = all 4 council seats vote, simple majority,
--     CCP breaks ties (also deferred to 20270740).
--
-- Stat targeting: stat_key restricted to the nine 1-10 city stats
-- in cities (infrastructure / appeal / growth / crime / approval /
-- pollution / jobs / services / affordability). budget isn't a
-- targetable stat — it's a dollar amount with its own
-- collect-taxes mechanic. stat_delta is a signed int (-10..+10);
-- 0 is allowed for "purely symbolic" ordinances but the form
-- discourages it.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. ordinances table (global catalog) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.ordinances (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 text NOT NULL CHECK (length(btrim(name))        BETWEEN 1 AND 80),
    description          text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 400),
    cost                 int  NOT NULL CHECK (cost                        BETWEEN 0 AND 100),
    support_archetypes   text[] NOT NULL DEFAULT '{}',
    oppose_archetypes    text[] NOT NULL DEFAULT '{}',
    stat_key             text NOT NULL CHECK (stat_key IN (
        'infrastructure', 'appeal', 'growth', 'crime', 'approval',
        'pollution', 'jobs', 'services', 'affordability'
    )),
    stat_delta           int  NOT NULL CHECK (stat_delta BETWEEN -10 AND 10),
    author_faction_id    uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    created_at_tick      int  NOT NULL,
    created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ordinances_created_idx
    ON public.ordinances (created_at DESC);
CREATE INDEX IF NOT EXISTS ordinances_author_idx
    ON public.ordinances (author_faction_id);

COMMENT ON TABLE public.ordinances IS
    'Global ordinance catalog (20270739). Templates authored on cityordinance.html by mayors / CCMs / CCPs; any of the three offices in any nation can propose any template into their city. Enactment, vote tracking, and stat effects land in 20270740.';

ALTER TABLE public.ordinances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ordinances_select ON public.ordinances;
CREATE POLICY ordinances_select ON public.ordinances
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS ordinances_service_all ON public.ordinances;
CREATE POLICY ordinances_service_all ON public.ordinances
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ── 2. create_ordinance RPC ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_ordinance(
    p_faction_id        uuid,
    p_name              text,
    p_description       text,
    p_cost              int,
    p_support_archetypes text[],
    p_oppose_archetypes  text[],
    p_stat_key          text,
    p_stat_delta        int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid      uuid := auth.uid();
    v_pol      factions%ROWTYPE;
    v_tick     int;
    v_id       uuid;
    v_name     text;
    v_desc     text;
    v_support  text[];
    v_oppose   text[];
    v_overlap  int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF v_pol.politician_office NOT IN
       ('mayor', 'city_council_member', 'city_council_president') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_office');
    END IF;

    -- Trim + length-guard text fields. CHECK constraints catch the
    -- same conditions on INSERT; we surface a friendlier reason code
    -- here so the form can map to a usable error message.
    v_name := btrim(COALESCE(p_name, ''));
    v_desc := btrim(COALESCE(p_description, ''));
    IF length(v_name) < 1 OR length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF length(v_desc) < 1 OR length(v_desc) > 400 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_description');
    END IF;
    IF p_cost IS NULL OR p_cost < 0 OR p_cost > 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_cost');
    END IF;
    IF p_stat_key IS NULL OR p_stat_key NOT IN (
        'infrastructure', 'appeal', 'growth', 'crime', 'approval',
        'pollution', 'jobs', 'services', 'affordability'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_key');
    END IF;
    IF p_stat_delta IS NULL OR p_stat_delta < -10 OR p_stat_delta > 10 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_stat_delta');
    END IF;

    -- Normalise archetype arrays — dedupe + reject empties. NULL
    -- collapses to '{}'. Reject archetypes outside the canonical
    -- 10-set (matches PARTY_ARCHETYPES in js/game/party-archetypes.js).
    v_support := ARRAY(SELECT DISTINCT a FROM unnest(COALESCE(p_support_archetypes, ARRAY[]::text[])) a
                       WHERE btrim(a) <> '');
    v_oppose  := ARRAY(SELECT DISTINCT a FROM unnest(COALESCE(p_oppose_archetypes,  ARRAY[]::text[])) a
                       WHERE btrim(a) <> '');
    IF EXISTS (
        SELECT 1 FROM unnest(v_support || v_oppose) a
         WHERE a NOT IN (
             'Reform', 'Social Democratic', 'Traditional Conservative',
             'Liberal', 'Libertarian', 'Communist / Leftist',
             'Green', 'Nationalist', 'Populist', 'Centrist'
         )
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_archetype');
    END IF;
    -- An archetype can't be on both sides — it'd ping-pong the
    -- popularity rewards at resolution.
    SELECT count(*) INTO v_overlap FROM unnest(v_support) s
     WHERE s = ANY(v_oppose);
    IF v_overlap > 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'archetype_overlap');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO public.ordinances (
        name, description, cost,
        support_archetypes, oppose_archetypes,
        stat_key, stat_delta,
        author_faction_id, created_at_tick
    ) VALUES (
        v_name, v_desc, p_cost,
        v_support, v_oppose,
        p_stat_key, p_stat_delta,
        v_pol.id, v_tick
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success',       true,
        'ordinance_id',  v_id,
        'created_at_tick', v_tick
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.create_ordinance(uuid, text, text, int, text[], text[], text, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.create_ordinance(uuid, text, text, int, text[], text[], text, int) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
