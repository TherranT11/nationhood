-- ═══════════════════════════════════════════════════════════════════════════════
-- POLITICIAN FOUND PARTY — politician_found_party + supporting columns
-- ═══════════════════════════════════════════════════════════════════════════════
-- Founding flow for politicians: pick a name, abbreviation, archetype, and
-- launch a new movement_party. Requires politician_influence >= 100 as a
-- gate — the value is NOT deducted, just required to use the action. Hard
-- cap of one active movement per politician; if their founded movement
-- gets abandoned, they may found another. The cap is intentionally shared
-- across all future movement types (NGOs, dissident groups), so the check
-- gates on founder_faction_id rather than on faction_type.
--
-- Two new columns on factions:
--   archetype          — string label picked at founding ('Reform',
--                        'Social Democratic', etc.). NULL for any
--                        non-movement faction. Drives the badge color
--                        and the party-page archetype tag.
--   founder_faction_id — uuid → factions(id) ON DELETE SET NULL. Set
--                        once at founding; used to enforce the
--                        one-active-movement cap and to surface
--                        "founded by X" on movement pages later.
--
-- Founding side effects, in order:
--   1. Verify caller owns the politician.
--   2. Verify politician_influence >= 100 (gate, not deducted).
--   3. Verify no other active movement founded by this politician.
--   4. INSERT factions row (faction_type='movement_party'), with the
--      politician's name copied into leader_first/last_name and
--      founder_faction_id pointing back to them.
--   5. Set politician_party_id = new party.id on the founder so they
--      appear in the party's Members list automatically.
--   6. INSERT 'founded_party' career event.
--
-- The +3 first-join bonus in politician_join_party is gated on the
-- existence of a prior 'joined_party' event — founding logs
-- 'founded_party' instead, so the politician can still earn +3 on a
-- future actual JOIN (e.g. after abandoning the founded party). That's
-- intentional: founding isn't the same beat as discovering a movement
-- and signing up.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE factions
    ADD COLUMN IF NOT EXISTS archetype          text,
    ADD COLUMN IF NOT EXISTS founder_faction_id uuid REFERENCES factions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_factions_founder
    ON factions (founder_faction_id) WHERE founder_faction_id IS NOT NULL;

COMMENT ON COLUMN factions.archetype IS
    'For movement-type factions (movement_party, future movement_ngo / movement_dissident): the archetype label picked at founding (e.g. ''Reform'', ''Social Democratic''). Drives the badge color and the party page archetype tag. NULL for non-movement factions.';
COMMENT ON COLUMN factions.founder_faction_id IS
    'For movement factions founded by a politician: the politician faction id that founded it. Used to enforce the one-active-movement-per-politician cap and to surface founder lineage on movement pages.';

CREATE OR REPLACE FUNCTION public.politician_found_party(
    p_politician_id   uuid,
    p_name            text,
    p_abbreviation    text,
    p_description     text,
    p_archetype       text,
    p_party_color     text,
    p_party_logo      text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_pol          factions%ROWTYPE;
    v_name         text := btrim(COALESCE(p_name, ''));
    v_abbr         text := btrim(COALESCE(p_abbreviation, ''));
    v_desc         text := btrim(COALESCE(p_description, ''));
    v_arch         text := btrim(COALESCE(p_archetype, ''));
    v_color        text := btrim(COALESCE(p_party_color, ''));
    v_logo         text := btrim(COALESCE(p_party_logo, ''));
    v_tick         int;
    v_new_id       uuid := gen_random_uuid();
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;

    SELECT * INTO v_pol FROM factions WHERE id = p_politician_id FOR UPDATE;
    IF v_pol.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_not_found'); END IF;
    IF v_pol.faction_type <> 'politician' THEN RETURN jsonb_build_object('success', false, 'reason', 'not_a_politician'); END IF;
    IF v_pol.id <> v_uid AND v_pol.linked_user_id IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_pol.abandoned_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'politician_inactive'); END IF;
    IF v_pol.nation_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_nation'); END IF;

    -- Gate (not deducted): 100 Influence required.
    IF COALESCE(v_pol.politician_influence, 0) < 100 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_influence',
            'required', 100, 'have', COALESCE(v_pol.politician_influence, 0));
    END IF;

    -- One active movement per politician (shared across all movement types).
    IF EXISTS (
        SELECT 1 FROM factions
         WHERE founder_faction_id = p_politician_id
           AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_founded');
    END IF;

    -- Field validation (kept tight; matches admin_create_party's limits).
    IF length(v_name) < 2 OR length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF length(v_abbr) < 1 OR length(v_abbr) > 8 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_abbreviation');
    END IF;
    IF EXISTS (
        SELECT 1 FROM factions
         WHERE nation_id = v_pol.nation_id AND faction_type = 'movement_party'
           AND LOWER(faction_name) = LOWER(v_name) AND abandoned_at IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_exists');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE id = v_pol.shard_id;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO factions (
        id, faction_type, faction_name, nation_id, nation, shard_id,
        abbreviation, seats, party_color, party_logo, party_description,
        archetype, founder_faction_id,
        leader_first_name, leader_last_name, leader_age,
        founded_tick, action_points, needs_rebuild, abandoned_at
    ) VALUES (
        v_new_id, 'movement_party', v_name, v_pol.nation_id, v_pol.nation, v_pol.shard_id,
        v_abbr, 0,
        NULLIF(v_color, ''),
        COALESCE(NULLIF(v_logo, ''), 'star'),
        NULLIF(v_desc, ''),
        NULLIF(v_arch, ''),
        p_politician_id,
        v_pol.leader_first_name, v_pol.leader_last_name, v_pol.leader_age,
        v_tick, 0, false, NULL
    );

    -- Auto-affiliate the founder with their new party. No +3 bonus and no
    -- 'joined_party' event — founding isn't joining, and the bonus rule
    -- (gated on prior joined_party events) stays available for a future
    -- actual JOIN should the politician ever leave + sign on elsewhere.
    UPDATE factions
       SET politician_party_id = v_new_id
     WHERE id = p_politician_id;

    INSERT INTO politician_career_events (faction_id, event_tick, event_type, target_name)
    VALUES (p_politician_id, v_tick, 'founded_party', v_name);

    RETURN jsonb_build_object('success', true,
        'party_id',   v_new_id,
        'party_name', v_name);
END;
$$;

GRANT EXECUTE ON FUNCTION public.politician_found_party(uuid, text, text, text, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
