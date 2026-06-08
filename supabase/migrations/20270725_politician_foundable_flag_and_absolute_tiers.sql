-- ════════════════════════════════════════════════════════════════════
-- 20270725 — Politician onboarding: hide non-foundable nations
--              + absolute-threshold tier algorithm
--
-- Two related problems on the first-steps nation picker:
--
-- 1. Non-foundable nations (Palvera / San Estrella / Sangreza /
--    everything outside the four selectable ones) were rendered
--    disabled, not hidden. They came with tier chips ("Tier B
--    BOOSTED") that the user could never actually claim — visual
--    noise that telegraphed mechanics they couldn't use. Fix: hide
--    them entirely. Column-driven so admin tooling can open new
--    nations without a client edit; mirrors the 20270657 foundable
--    _for_corp pattern.
--
-- 2. The tier algorithm used a RELATIVE third-split across ALL 30+
--    nations in the DB. Sierramar with 1 sitting politician landed
--    at the top of the count-DESC ranking and was therefore Tier A
--    — "basic" stats, no boost — even though the nation is
--    effectively empty. The split made sense when there were a lot
--    of busy nations; with one populated player nation and dozens
--    of empty ones it produces nonsense ("A on the only nation
--    anyone is in").
--
--    New algorithm — absolute thresholds, per user spec:
--      Tier C (jumpstart, 50/30/15/80): pol_count < 5
--      Tier B (boosted,   30/15/7/40):  5 <= pol_count < 15
--      Tier A (basic,     1/1/1/10):    pol_count >= 15
--
--    Count is scoped to the politician's TARGET nation alone — no
--    cross-nation comparison, no random tiebreak. The chip the
--    first-steps client renders mirrors the same thresholds.
--
-- Schema:
--   nations.foundable_for_politician boolean NOT NULL DEFAULT FALSE.
--   REVOKE UPDATE so authenticated clients can't flip it; admin
--   RPCs (SECURITY DEFINER) bypass column privilege if/when they
--   need to. Backfill: Melizea / Avelia / Montequilla / Sierramar.
--
-- Server gate:
--   create_politician_with_tier_stats now rejects nation ids whose
--   foundable_for_politician is not TRUE (reason='not_foundable').
--   Closes the devtools-tampering surface where a client could call
--   the RPC with a hidden nation_id and slip onboarding past the UI.
--
-- Out of scope:
--   Existing politicians (e.g. the Sierramar user) are not retro-
--   bumped to a new tier — forward-only, consistent with the
--   20270693 onboarding convention.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: foundable_for_politician ──────────────────────────
ALTER TABLE public.nations
    ADD COLUMN IF NOT EXISTS foundable_for_politician boolean NOT NULL DEFAULT FALSE;

REVOKE UPDATE (foundable_for_politician) ON public.nations
    FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN public.nations.foundable_for_politician IS
    '20270725: TRUE for nations the first-steps politician picker shows + the create_politician_with_tier_stats RPC accepts. Same source of truth as the client filter — admin tooling toggles to open a new nation. Separate from foundable_for_corp because the corp + politician allowlists can drift.';


-- ── 2. Backfill the four currently-allowed nations ───────────────
UPDATE public.nations
   SET foundable_for_politician = TRUE
 WHERE name IN ('Melizea', 'Avelia', 'Montequilla', 'Sierramar')
   AND foundable_for_politician IS DISTINCT FROM TRUE;


-- ── 3. create_politician_with_tier_stats re-emit ─────────────────
-- Two changes from 20270710:
--   • Gate: reject p_nation_id whose foundable_for_politician is
--     not TRUE.
--   • Tier algorithm: absolute thresholds (count-based) replace
--     the relative third-split. No CTE / no cross-nation ranking
--     needed — a single COUNT(*) on the target nation drives the
--     tier choice.
-- Everything else (stat blocks per tier, linked-vs-primary insert
-- path, ON CONFLICT shape) is byte-faithful to 20270710.
CREATE OR REPLACE FUNCTION public.create_politician_with_tier_stats(
    p_nation_id  uuid,
    p_first_name text,
    p_last_name  text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_nation     nations%ROWTYPE;
    v_tick       int;
    v_existing   uuid;
    v_primary    uuid;
    v_is_linked  boolean;
    v_faction_id uuid;
    v_first      text;
    v_last       text;
    v_pol_count  int;
    v_tier       text;
    v_age        int;
    v_skill      int;
    v_rep        int;
    v_cap        int;
    v_inf        int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    v_first := btrim(COALESCE(p_first_name, ''));
    v_last  := btrim(COALESCE(p_last_name,  ''));
    IF length(v_first) < 1 OR length(v_last) < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;

    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    IF v_nation.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;
    IF v_nation.foundable_for_politician IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_foundable');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT id INTO v_existing
      FROM factions
     WHERE faction_type = 'politician'
       AND nation_id    = p_nation_id
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid);
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_in_nation');
    END IF;

    -- Absolute-threshold tier algorithm. Count active politicians on
    -- the target nation; the bands below decide the tier. Mirrored
    -- client-side in first-steps.html's computeTierMap.
    SELECT COUNT(*) INTO v_pol_count
      FROM factions
     WHERE faction_type = 'politician'
       AND nation_id    = p_nation_id
       AND abandoned_at IS NULL;

    IF v_pol_count < 5 THEN
        v_tier := 'C';  -- jumpstart
    ELSIF v_pol_count < 15 THEN
        v_tier := 'B';  -- boosted
    ELSE
        v_tier := 'A';  -- basic
    END IF;

    -- 20270710 stat values, unchanged.
    IF v_tier = 'A' THEN
        v_age := 25; v_skill := 1;  v_rep := 1;  v_cap := 1;  v_inf := 10;
    ELSIF v_tier = 'B' THEN
        v_age := 45; v_skill := 30; v_rep := 15; v_cap := 7;  v_inf := 40;
    ELSE -- 'C'
        v_age := 50; v_skill := 50; v_rep := 30; v_cap := 15; v_inf := 80;
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
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                politician_skill, politician_reputation,
                politician_capital, politician_influence,
                linked_user_id
            ) VALUES (
                v_faction_id, 'politician',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, 0,
                NULL,
                v_first, v_last, v_age,
                v_tick,
                v_skill, v_rep,
                v_cap, v_inf,
                v_uid
            );
        ELSE
            INSERT INTO factions (
                id, faction_type, faction_name,
                nation_id, nation,
                seats, action_points, party_funds,
                abandoned_at,
                leader_first_name, leader_last_name, leader_age,
                founded_tick,
                politician_skill, politician_reputation,
                politician_capital, politician_influence,
                linked_user_id
            ) VALUES (
                v_faction_id, 'politician',
                v_first || ' ' || v_last,
                p_nation_id, v_nation.name,
                0, 0, 0,
                NULL,
                v_first, v_last, v_age,
                v_tick,
                v_skill, v_rep,
                v_cap, v_inf,
                NULL
            )
            ON CONFLICT (id) DO UPDATE SET
                faction_type          = EXCLUDED.faction_type,
                faction_name          = EXCLUDED.faction_name,
                nation_id             = EXCLUDED.nation_id,
                nation                = EXCLUDED.nation,
                seats                 = EXCLUDED.seats,
                action_points         = EXCLUDED.action_points,
                party_funds           = EXCLUDED.party_funds,
                abandoned_at          = NULL,
                leader_first_name     = EXCLUDED.leader_first_name,
                leader_last_name      = EXCLUDED.leader_last_name,
                leader_age            = EXCLUDED.leader_age,
                founded_tick          = EXCLUDED.founded_tick,
                politician_skill      = EXCLUDED.politician_skill,
                politician_reputation = EXCLUDED.politician_reputation,
                politician_capital    = EXCLUDED.politician_capital,
                politician_influence  = EXCLUDED.politician_influence,
                linked_user_id        = NULL;
        END IF;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_in_nation');
    END;

    RETURN jsonb_build_object(
        'success',    true,
        'faction_id', v_faction_id,
        'tier',       v_tier
    );
END $$;

GRANT EXECUTE ON FUNCTION public.create_politician_with_tier_stats(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION public.create_politician_with_tier_stats(uuid, text, text) IS
    'Onboards a new politician with absolute-threshold tier stats (20270725). Gate: nations.foundable_for_politician must be TRUE. Tier from active-politician COUNT on the target nation — C (<5, jumpstart), B (5-14, boosted), A (15+, basic). Stat values unchanged from 20270710: A = 1/1/1/10 (skill/rep/cap/inf), B = 30/15/7/40, C = 50/30/15/80. Forward-only — existing politicians are not retro-bumped.';

NOTIFY pgrst, 'reload schema';

COMMIT;
