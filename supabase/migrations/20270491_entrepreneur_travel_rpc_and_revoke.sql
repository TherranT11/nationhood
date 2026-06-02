-- Close the home-nation gate security hole.
--
-- 20270490 (mirror) added factions.ent_origin_nation to prod and gated
-- found_entrepreneur_corp on it. But the REVOKE + entrepreneur_travel
-- RPC from sql/migrations/20270349 — which together make ent_origin_nation
-- and factions.nation immutable through any path except the costed
-- travel RPC — were never mirrored. Today on prod, any authenticated
-- user can `_supabase.from('factions').update({ent_origin_nation: 'x',
-- nation: 'y'})` directly through the open "Factions update own" RLS
-- policy, which bypasses both the home-nation gate and the $20k
-- travel cost.
--
-- This migration ports the two missing pieces verbatim from 20270349:
--   1. REVOKE UPDATE (nation, ent_origin_nation) — the SECURITY DEFINER
--      RPC writes them as the function owner and is unaffected.
--   2. entrepreneur_travel(p_nation_id) — the only legitimate path to
--      change factions.nation, costing $20k and seeding ent_origin_nation
--      on first call.
--
-- Column add + backfill are NOT repeated here — 20270490 already
-- handled both idempotently (ADD COLUMN IF NOT EXISTS + WHERE IS NULL
-- backfill). Only the access-control gap closes here.

BEGIN;

REVOKE UPDATE (nation, ent_origin_nation) ON public.factions
    FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.entrepreneur_travel(p_nation_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_uid    UUID := auth.uid();
    v_fac    factions%ROWTYPE;
    v_name   TEXT;
    c_cost   CONSTANT bigint := 20000;   -- $20k, entrepreneur funds are raw 1:1 dollars
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur' AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur'); END IF;

    IF p_nation_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_nation'); END IF;
    SELECT name INTO v_name FROM nations WHERE id = p_nation_id;
    IF v_name IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_nation'); END IF;

    IF lower(btrim(COALESCE(v_fac.nation, ''))) = lower(btrim(v_name)) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_there');
    END IF;
    IF COALESCE(v_fac.party_funds, 0) < c_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'cost', c_cost);
    END IF;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - c_cost,
           nation = v_name,
           ent_origin_nation = COALESCE(ent_origin_nation, v_fac.nation)   -- seed origin if never set
     WHERE id = v_fac.id;

    RETURN jsonb_build_object('success', true, 'location', v_name, 'cost', c_cost);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'reason', 'error', 'message', SQLERRM);
END; $$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_travel(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
