-- ════════════════════════════════════════════════════════════════════
-- 20270950 — World Organizations: schema + founding
--
-- An international body founded by a nation's Foreign Minister or Head of
-- Government from the World Organization Management page. The five categories
-- mirror js/game/world-org-sectors.js — keep the CHECK below in sync with
-- those keys (the one place the taxonomy is duplicated, client ↔ server).
--
-- member_nation_ids is a uuid[] (the founder is the first member); a richer
-- join/charter mechanic — type of body, scope, founding cost, states signing
-- on — lands later. status walks 'forming' → 'active'.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.world_organizations (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category          text NOT NULL CHECK (category IN (
                        'diplomatic_political', 'economic_financial', 'trade_commerce',
                        'security_defense', 'technical_functional')),
    name              text NOT NULL,
    abbreviation      text,
    purpose           text,
    founder_nation_id uuid NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    member_nation_ids uuid[] NOT NULL DEFAULT '{}',
    status            text NOT NULL DEFAULT 'forming' CHECK (status IN ('forming', 'active')),
    created_at_tick   int,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS world_organizations_category_idx ON public.world_organizations (category);
CREATE INDEX IF NOT EXISTS world_organizations_members_idx  ON public.world_organizations USING GIN (member_nation_ids);

-- International bodies are public game state — any authenticated user reads.
-- Writes go only through found_organization() (SECURITY DEFINER); there is no
-- direct-write policy.
ALTER TABLE public.world_organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read world orgs" ON public.world_organizations;
CREATE POLICY "Authenticated read world orgs" ON public.world_organizations
    FOR SELECT TO authenticated USING (true);

-- ── Found a new organization ────────────────────────────────────────
-- Server-side mirror of worldOrgAccess: the caller's politician must be their
-- nation's Foreign Minister or Head of Government. The founder nation becomes
-- the sole 'forming' member.
CREATE OR REPLACE FUNCTION public.found_organization(
    p_category     text,
    p_name         text,
    p_abbreviation text,
    p_purpose      text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_tick    int;
    v_name    text := btrim(COALESCE(p_name, ''));
    v_abbr    text := NULLIF(btrim(COALESCE(p_abbreviation, '')), '');
    v_purpose text := NULLIF(btrim(COALESCE(p_purpose, '')), '');
    v_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_category IS NULL OR p_category NOT IN
       ('diplomatic_political', 'economic_financial', 'trade_commerce',
        'security_defense', 'technical_functional') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_category');
    END IF;
    IF length(v_name) < 3 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;

    -- The caller's politician who is FM or HoG of their nation — the WHERE
    -- enforces the gate, and picks the right faction on a multi-politician
    -- account.
    SELECT * INTO v_fac FROM factions f
     WHERE f.faction_type = 'politician'
       AND f.abandoned_at IS NULL
       AND (f.id = v_uid OR f.linked_user_id = v_uid)
       AND f.nation_id IS NOT NULL
       AND (f.politician_foreign_minister_at_tick IS NOT NULL
            OR EXISTS (SELECT 1 FROM head_of_government h
                        WHERE h.nation_id = f.nation_id AND h.active AND h.faction_id = f.id))
     ORDER BY f.created_at ASC
     LIMIT 1;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO world_organizations (category, name, abbreviation, purpose,
        founder_nation_id, member_nation_ids, status, created_at_tick)
    VALUES (p_category, v_name, v_abbr, v_purpose,
        v_fac.nation_id, ARRAY[v_fac.nation_id], 'forming', COALESCE(v_tick, 0))
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id, 'status', 'forming');
END $$;

REVOKE ALL ON FUNCTION public.found_organization(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.found_organization(text, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
