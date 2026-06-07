-- ════════════════════════════════════════════════════════════════════
-- 20270671 — entrepreneur_travel: log a "chartered a flight" event
--
-- Extends entrepreneur_travel (20270491 / sql/20270349) to insert one
-- event_log row when the travel completes. The RPC was already the
-- canonical (and only) write path for changing factions.nation —
-- 20270491 closed the home-nation gate hole by REVOKEing direct
-- UPDATE on (nation, ent_origin_nation), so this RPC is the single
-- choke point. Wiring the event here is the single-source way to
-- announce travel; no other code path can move an entrepreneur
-- between nations.
--
-- One row per call, keyed to the destination nation. The
-- destination's feed reads the announcement as the arrival beat;
-- the origin doesn't get a mirror row because "X chartered a flight
-- to Melizea" makes sense on the destination's feed and is
-- redundant on the origin's (the entrepreneur is leaving, not
-- arriving).
--
-- Display name mirrors js/utils.js displayName(): leader_first_name
-- + leader_last_name first, then faction_name, then 'An entrepreneur'
-- as the floor. Keeps the event copy consistent with every other
-- character-name surface (topbar, party panel, committee cards,
-- etc.).
--
-- The whole RPC is recreated via CREATE OR REPLACE rather than
-- patched in pieces — the new event-log INSERT sits between the
-- existing UPDATE and the success return, and recreating the whole
-- function keeps the diff readable and the version history honest.
-- Body otherwise identical to 20270491 (validations, FOR UPDATE,
-- charge, UPDATE, EXCEPTION sink). If a subsequent migration
-- changes the cost or validation, this is the file to edit.
--
-- Apply after 20270670.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.entrepreneur_travel(p_nation_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_uid    UUID := auth.uid();
    v_fac    factions%ROWTYPE;
    v_name   TEXT;
    v_tick   int;
    v_disp   text;
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

    -- Chartered Flight event for the destination nation's feed.
    -- Mirrors displayName() so the event reads "Therrant Smith has
    -- chartered a flight to Melizea." rather than the faction_name
    -- fallback whenever a real character name is on the row.
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    v_disp := COALESCE(
        NULLIF(btrim(COALESCE(v_fac.leader_first_name, '') || ' ' || COALESCE(v_fac.leader_last_name, '')), ''),
        NULLIF(btrim(v_fac.faction_name), ''),
        'An entrepreneur'
    );

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, fired_at_tick
    ) VALUES (
        p_nation_id, v_fac.id, 'Chartered Flight',
        v_disp || ' has chartered a flight to ' || v_name || '.',
        'corporate', 'entrepreneur_chartered_flight', v_tick
    );

    RETURN jsonb_build_object('success', true, 'location', v_name, 'cost', c_cost);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'reason', 'error', 'message', SQLERRM);
END; $$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_travel(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
