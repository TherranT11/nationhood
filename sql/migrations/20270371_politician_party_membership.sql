-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN PARTY MEMBERSHIP — join / leave a movement_party
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds the affiliation column the politician page reads when it decides
-- whether the "Party Member" rung on the Party Office ladder is held, and
-- the two RPCs that flip the bit. Joining a party:
--   • sets factions.politician_party_id to the movement_party's id
--   • grants the politician +3 politician_influence
--   • inserts a 'joined_party' row in politician_career_events
--
-- Leaving a party reverses the first step (id → NULL) and inserts a
-- 'left_party' career event with the party name as it was at the time.
-- Influence is NOT clawed back — that's the design ("you don't lose what
-- you earned"). The career_events table doesn't enforce event_type so
-- 'left_party' just slots in alongside the existing types.
--
-- Anti-grind: the +3 fires only on the politician's FIRST EVER join.
-- Subsequent joins (after any leave + rejoin loop, or party-switching)
-- log the event but grant no further influence. The existence of a
-- prior 'joined_party' event in politician_career_events is the gate.
-- This is why leave + rejoin doesn't farm influence.
--
-- Both RPCs are SECURITY DEFINER and verify the caller owns the politician
-- via the canonical (id = auth.uid() OR linked_user_id = auth.uid()) test.
-- Both verify the politician and the party are in the same nation; a
-- politician can't join a party from another country.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Affiliation column ──────────────────────────────────────────────
ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS politician_party_id uuid REFERENCES factions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_factions_politician_party
    ON factions (politician_party_id) WHERE politician_party_id IS NOT NULL;

COMMENT ON COLUMN factions.politician_party_id IS
    'For faction_type=''politician'' rows: the movement_party (factions.id with faction_type=''movement_party'') the politician is currently affiliated with. NULL = Independent. Set by politician_join_party; cleared by politician_leave_party.';

-- ── 2. politician_join_party ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_join_party(
    p_politician_id uuid,
    p_party_id      uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_party     factions%ROWTYPE;
    v_tick      int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_pol FROM factions WHERE id = p_politician_id FOR UPDATE;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_not_found'); END IF;
    IF v_pol.faction_type <> 'politician' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_politician'); END IF;
    IF v_pol.id <> v_uid AND v_pol.linked_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_pol.abandoned_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_inactive'); END IF;

    SELECT * INTO v_party FROM factions WHERE id = p_party_id;
    IF v_party.id IS NULL OR v_party.faction_type <> 'movement_party' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'party_not_found');
    END IF;
    IF v_party.abandoned_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'party_inactive'); END IF;
    IF v_party.nation_id IS DISTINCT FROM v_pol.nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'different_nation');
    END IF;

    -- Idempotent same-party join — just succeed without re-logging.
    IF v_pol.politician_party_id = p_party_id THEN
        RETURN jsonb_build_object('success', true, 'party_name', v_party.faction_name, 'already_member', true);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- +3 influence ONLY on the politician's first ever joined_party event.
    -- Re-joins (whether switching parties or leaving + rejoining) log the
    -- event but grant nothing, so leave→rejoin can't farm influence.
    DECLARE
        v_first_join boolean := NOT EXISTS (
            SELECT 1 FROM politician_career_events
             WHERE faction_id = p_politician_id AND event_type = 'joined_party'
        );
    BEGIN
        UPDATE factions
           SET politician_party_id = p_party_id,
               politician_influence = COALESCE(politician_influence, 0)
                                    + CASE WHEN v_first_join THEN 3 ELSE 0 END
         WHERE id = p_politician_id;

        INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
        VALUES (p_politician_id, v_tick, 'joined_party', v_party.faction_name);

        RETURN jsonb_build_object('success', true,
            'party_id', p_party_id, 'party_name', v_party.faction_name,
            'influence_delta', CASE WHEN v_first_join THEN 3 ELSE 0 END);
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_join_party(uuid, uuid) TO authenticated;

-- ── 3. politician_leave_party ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_leave_party(
    p_politician_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_party     factions%ROWTYPE;
    v_tick      int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_pol FROM factions WHERE id = p_politician_id FOR UPDATE;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_not_found'); END IF;
    IF v_pol.faction_type <> 'politician' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_politician'); END IF;
    IF v_pol.id <> v_uid AND v_pol.linked_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_pol.abandoned_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_inactive'); END IF;

    IF v_pol.politician_party_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'already_independent', true);
    END IF;

    -- Snapshot the party name BEFORE clearing the link so the career event
    -- records who they actually left (and survives a later party rename).
    SELECT * INTO v_party FROM factions WHERE id = v_pol.politician_party_id;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions SET politician_party_id = NULL WHERE id = p_politician_id;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
    VALUES (p_politician_id, v_tick, 'left_party', COALESCE(v_party.faction_name, 'a political party'));

    RETURN jsonb_build_object('success', true, 'party_name', v_party.faction_name);
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_leave_party(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
