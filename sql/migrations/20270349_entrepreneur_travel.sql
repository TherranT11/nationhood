-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR TRAVEL — relocate your founder to any nation for $20k
-- ════════════════════════════════════════════════════════════════════
-- factions.nation is the entrepreneur's CURRENT location, and found_entrepreneur_corp
-- already gates new corps to it ("found where you are"). Travel moves it. To keep
-- the Character page's immutable ORIGIN (birthplace) from drifting with travel,
-- snapshot it once into factions.ent_origin_nation; the page reads ORIGIN from
-- there and CURRENT LOCATION from factions.nation.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions ADD COLUMN IF NOT EXISTS ent_origin_nation TEXT;
-- Snapshot every existing entrepreneur's origin from their current nation.
UPDATE factions SET ent_origin_nation = nation
 WHERE faction_type = 'entrepreneur' AND ent_origin_nation IS NULL;

-- Location must move only through the costed RPC. Without this the open
-- "Factions update own" policy would let a client UPDATE factions.nation
-- directly — free travel, and a bypass of found_entrepreneur_corp's home-nation
-- gate. Origin is likewise set only by the RPC/backfill. The SECURITY DEFINER
-- RPC (and the service-role tick) write them as owner, bypassing this revoke.
REVOKE UPDATE (nation, ent_origin_nation) ON public.factions FROM PUBLIC, anon, authenticated;

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
