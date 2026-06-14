-- ════════════════════════════════════════════════════════════════════
-- 20270920 — Party Caucus & Allies (Phase 1: the Allies + Caucus base)
--
-- Allies are a Senior MP's personal bloc. A Senior MP grows the bloc with
-- politician_recruit_ally (cooldown-gated), and a Caucus — a named, lasting
-- bloc inside their party — grants +2 more on formation. When a Senior
-- MP's allies reach 10% of their party's seats, they can form a Caucus
-- (10 Influence). What allies DO on the chamber floor (split the party
-- seat bloc on bills) lands in Phase 2.
--
--   factions.politician_allies                            — the bloc count
--   factions.politician_ally_recruit_cooldown_until_tick  — recruit gate
--   caucuses                                              — the named blocs
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.factions ADD COLUMN IF NOT EXISTS politician_allies int NOT NULL DEFAULT 0;
ALTER TABLE public.factions ADD COLUMN IF NOT EXISTS politician_ally_recruit_cooldown_until_tick int;

COMMENT ON COLUMN public.factions.politician_allies IS
    'Senior MP personal ally bloc (20270920). Allies vote with the Senior MP, splitting their seats off the party line on chamber bills (Phase 2). Grown via politician_recruit_ally; +2 per caucus formed. 0 for non-politician / non-Senior-MP factions.';

-- A Caucus: a named bloc a Senior MP forms inside their party. Persistent
-- identity; its mechanical effect today is the +2 Allies on formation.
CREATE TABLE IF NOT EXISTS public.caucuses (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id          uuid NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    party_id           uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    founder_faction_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    name               text NOT NULL,
    description        text,
    archetype          text,
    created_tick       int  NOT NULL DEFAULT 0,
    created_at         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.caucuses ENABLE ROW LEVEL SECURITY;
-- Public game data (read by the party page); writes only via the RPC below.
DROP POLICY IF EXISTS caucuses_read ON public.caucuses;
CREATE POLICY caucuses_read ON public.caucuses FOR SELECT USING (true);

-- ── politician_recruit_ally — a Senior MP grows their bloc ─────────
CREATE OR REPLACE FUNCTION public.politician_recruit_ally(p_faction_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_tick   int;
    v_allies int;
    v_cd     constant int := 4;   -- ticks between recruits
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician' AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_politician'); END IF;
    IF v_pol.politician_office IS DISTINCT FROM 'senior_mp' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_senior_mp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE id = v_pol.shard_id;
    v_tick := COALESCE(v_tick, 0);
    IF v_pol.politician_ally_recruit_cooldown_until_tick IS NOT NULL
       AND v_pol.politician_ally_recruit_cooldown_until_tick > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown',
            'until_tick', v_pol.politician_ally_recruit_cooldown_until_tick);
    END IF;

    UPDATE factions
       SET politician_allies = COALESCE(politician_allies, 0) + 1,
           politician_ally_recruit_cooldown_until_tick = v_tick + v_cd
     WHERE id = v_pol.id
    RETURNING politician_allies INTO v_allies;

    RETURN jsonb_build_object('success', true, 'allies', v_allies, 'cooldown_until', v_tick + v_cd);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_recruit_ally(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_recruit_ally(uuid) TO authenticated;

-- ── politician_form_caucus — name a bloc: +2 Allies, −10 Influence ─
-- Gated on the same 10%-of-party-seats rule the UI uses to ungrey the
-- button (allies * 10 >= party seats), and 10 Influence.
CREATE OR REPLACE FUNCTION public.politician_form_caucus(
    p_faction_id  uuid,
    p_name        text,
    p_description text,
    p_archetype   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_name   text := btrim(COALESCE(p_name, ''));
    v_desc   text := btrim(COALESCE(p_description, ''));
    v_arch   text := btrim(COALESCE(p_archetype, ''));
    v_seats  int;
    v_tick   int;
    v_cost   constant int := 10;
    v_new_id uuid := gen_random_uuid();
    v_allies int;
    v_inf    int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician' AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_politician'); END IF;
    IF v_pol.politician_office IS DISTINCT FROM 'senior_mp' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_senior_mp');
    END IF;
    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_party');
    END IF;
    IF length(v_name) < 2 OR length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;

    SELECT COALESCE(seats, 0) INTO v_seats FROM factions WHERE id = v_pol.politician_party_id;
    IF COALESCE(v_pol.politician_allies, 0) * 10 < COALESCE(v_seats, 0) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_allies',
            'allies', COALESCE(v_pol.politician_allies, 0), 'party_seats', COALESCE(v_seats, 0));
    END IF;
    IF COALESCE(v_pol.politician_influence, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_influence',
            'required', v_cost, 'have', COALESCE(v_pol.politician_influence, 0));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE id = v_pol.shard_id;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO caucuses (id, nation_id, party_id, founder_faction_id, name, description, archetype, created_tick)
    VALUES (v_new_id, v_pol.nation_id, v_pol.politician_party_id, v_pol.id, v_name,
            NULLIF(v_desc, ''), NULLIF(v_arch, ''), v_tick);

    UPDATE factions
       SET politician_allies    = COALESCE(politician_allies, 0) + 2,
           politician_influence = GREATEST(0, COALESCE(politician_influence, 0) - v_cost)
     WHERE id = v_pol.id
    RETURNING politician_allies, politician_influence INTO v_allies, v_inf;

    RETURN jsonb_build_object('success', true, 'caucus_id', v_new_id, 'name', v_name,
        'allies', v_allies, 'influence_spent', v_cost, 'politician_influence', v_inf);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_form_caucus(uuid, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_form_caucus(uuid, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
