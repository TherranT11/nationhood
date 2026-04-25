-- ============================================================
-- BLOCS — Phase 2d: Creation + vote-split dissolution events
--
-- Fires two event_log rows via the canonical direct-INSERT convention
-- (see fire_system_event / game/elections.js for the shape):
--
--   * 'bloc_formed' at the end of create_bloc, listing all pending
--     invitees at that moment. Per Q8=A this fires at creation time
--     even if invitees later decline; the event narrates intent.
--
--   * 'bloc_dissolved_vote_split' inside process_bloc_vote_cohesion
--     when dissent_count just crossed 3. Captures one representative
--     YES-voting party and one representative NO-voting party from
--     the triggering bill (alphabetical for determinism), plus the
--     bill name. Queried BEFORE bloc_id nulls out so the FKs still
--     resolve.
--
-- Category='political' matches the codebase convention. event_log
-- has no explicit scope column — nation/world scoping is handled at
-- the UI read layer based on nation_id and the viewer's context.
-- Dissolutions from other paths (leader_left, promoted_to_pm) do NOT
-- fire events in this migration; only the user-specified vote_split
-- event is in scope.
--
-- Safe to re-run: CREATE OR REPLACE replaces both RPCs.
-- ============================================================

-- ==================== RPC: create_bloc (replaced — adds event) ====================
-- Body is identical to Phase 2a's version except for the event_log
-- INSERT right before RETURN. Invitee names are read from the
-- bloc_invitations rows the loop just wrote so that only actually-
-- invited parties appear in the event text (skipped-ineligible
-- ones don't leak in).

CREATE OR REPLACE FUNCTION create_bloc(
    p_leader_faction_id UUID,
    p_name TEXT,
    p_invitee_faction_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user_id UUID;
    v_leader factions%ROWTYPE;
    v_tick INT;
    v_bloc_id UUID;
    v_invitee UUID;
    v_invitee_faction factions%ROWTYPE;
    v_invited INT := 0;
    v_skipped INT := 0;
    v_clean_name TEXT;
    v_leader_name TEXT;
    v_invitee_names TEXT;
    v_event_desc TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_leader FROM factions WHERE id = p_leader_faction_id;
    IF v_leader.id IS NULL THEN
        RAISE EXCEPTION 'Leader faction not found';
    END IF;
    IF p_leader_faction_id <> v_user_id THEN
        RAISE EXCEPTION 'Faction ownership required';
    END IF;
    IF v_leader.faction_type IS DISTINCT FROM 'party' THEN
        RAISE EXCEPTION 'Only parties can form blocs';
    END IF;
    IF v_leader.bloc_id IS NOT NULL THEN
        RAISE EXCEPTION 'Already in a bloc';
    END IF;

    IF EXISTS (
        SELECT 1 FROM head_of_government hog
        WHERE hog.nation_id = v_leader.nation_id
          AND hog.faction_id = p_leader_faction_id
          AND hog.active = true
    ) THEN
        RAISE EXCEPTION 'Head of Government cannot form blocs — you already lead the coalition';
    END IF;

    IF EXISTS (
        SELECT 1 FROM administrations a
        WHERE a.nation_id = v_leader.nation_id
          AND a.ended_at_tick IS NULL
          AND a.president_party_id = p_leader_faction_id
    ) THEN
        RAISE EXCEPTION 'Head of Government cannot form blocs — you already lead the coalition';
    END IF;

    IF EXISTS (
        SELECT 1 FROM nations n
        WHERE n.id = v_leader.nation_id
          AND n.monarch_faction_id = p_leader_faction_id
    ) THEN
        RAISE EXCEPTION 'Head of Government cannot form blocs — you already lead the coalition';
    END IF;

    v_clean_name := TRIM(COALESCE(p_name, ''));
    IF v_clean_name = '' THEN
        RAISE EXCEPTION 'Bloc name required';
    END IF;
    IF LENGTH(v_clean_name) > 40 THEN
        RAISE EXCEPTION 'Bloc name too long (max 40 characters)';
    END IF;

    IF COALESCE(v_leader.party_funds, 0) < 100000 THEN
        RAISE EXCEPTION 'Insufficient party funds ($100,000 required)';
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';

    INSERT INTO blocs (nation_id, name, leader_faction_id, founded_at_tick)
    VALUES (v_leader.nation_id, v_clean_name, p_leader_faction_id, v_tick)
    RETURNING id INTO v_bloc_id;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - 100000,
           bloc_id     = v_bloc_id
     WHERE id = p_leader_faction_id;

    IF p_invitee_faction_ids IS NOT NULL THEN
        FOREACH v_invitee IN ARRAY p_invitee_faction_ids LOOP
            IF v_invitee = p_leader_faction_id THEN
                v_skipped := v_skipped + 1; CONTINUE;
            END IF;

            SELECT * INTO v_invitee_faction FROM factions WHERE id = v_invitee;
            IF v_invitee_faction.id IS NULL
               OR v_invitee_faction.nation_id IS DISTINCT FROM v_leader.nation_id
               OR v_invitee_faction.faction_type IS DISTINCT FROM 'party'
               OR v_invitee_faction.bloc_id IS NOT NULL THEN
                v_skipped := v_skipped + 1; CONTINUE;
            END IF;

            INSERT INTO bloc_invitations
                (bloc_id, invited_faction_id, invited_by_faction_id,
                 status, created_at_tick)
            VALUES
                (v_bloc_id, v_invitee, p_leader_faction_id, 'pending', v_tick)
            ON CONFLICT DO NOTHING;

            v_invited := v_invited + 1;
        END LOOP;
    END IF;

    PERFORM adjust_momentum(p_leader_faction_id, 2, 'Bloc founded: ' || v_clean_name, v_tick);

    -- Phase 2d: creation event. Uses actually-invited parties (from the
    -- bloc_invitations rows just inserted), not the raw p_invitee_faction_ids,
    -- so silently-skipped ineligible entries don't leak into the headline.
    v_leader_name := COALESCE(v_leader.faction_name, 'A party');
    SELECT string_agg(f.faction_name, ', ' ORDER BY f.faction_name)
      INTO v_invitee_names
      FROM bloc_invitations bi
      JOIN factions f ON f.id = bi.invited_faction_id
     WHERE bi.bloc_id = v_bloc_id
       AND bi.status = 'pending';

    IF v_invitee_names IS NOT NULL AND v_invitee_names <> '' THEN
        v_event_desc := v_leader_name || ' has created the ' || v_clean_name
                     || ' bloc with ' || v_invitee_names || '.';
    ELSE
        v_event_desc := v_leader_name || ' has created the ' || v_clean_name || ' bloc.';
    END IF;

    -- Event insert wrapped so a write failure (schema drift, transient
    -- error) doesn't roll back the whole bloc creation and refund the
    -- $100k to a now-nonexistent bloc row. Log and continue.
    BEGIN
        INSERT INTO event_log (
            nation_id, faction_id, event_name, trigger_key, category,
            description_chosen, effects_applied, fired_at_tick
        ) VALUES (
            v_leader.nation_id, p_leader_faction_id, 'Bloc Formed', 'bloc_formed',
            'political', v_event_desc,
            jsonb_build_object(
                'bloc_id', v_bloc_id,
                'bloc_name', v_clean_name,
                'leader_faction_id', p_leader_faction_id,
                'invited_count', v_invited,
                'skipped_count', v_skipped
            ),
            v_tick
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Bloc creation event_log insert failed for bloc % (%): %',
            v_bloc_id, v_clean_name, SQLERRM;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'bloc_id', v_bloc_id,
        'name', v_clean_name,
        'invited_count', v_invited,
        'skipped_count', v_skipped
    );
END;
$fn$;

GRANT EXECUTE ON FUNCTION create_bloc(UUID, TEXT, UUID[]) TO authenticated;

-- ==================== RPC: process_bloc_vote_cohesion (replaced — adds event) ====================
-- Same UPDATE/dissolve shape as Phase 2b; the only addition is the
-- representative-party lookup + event_log INSERT inside the dissolve
-- branch. Those queries run BEFORE bloc_id is cleared so the joins
-- still resolve.

CREATE OR REPLACE FUNCTION process_bloc_vote_cohesion(
    p_bill_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_nation_id UUID;
    v_tick INT;
    v_row RECORD;
    v_dissolved_count INT := 0;
    v_bloc_name TEXT;
    v_yes_party TEXT;
    v_no_party TEXT;
    v_bill_name TEXT;
    v_event_desc TEXT;
BEGIN
    SELECT nation_id INTO v_nation_id FROM bills WHERE id = p_bill_id;
    IF v_nation_id IS NULL THEN
        RETURN 0;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard';
    SELECT bill_name INTO v_bill_name FROM bills WHERE id = p_bill_id;

    FOR v_row IN
        WITH bumped AS (
            UPDATE blocs b
               SET dissent_count        = COALESCE(b.dissent_count, 0) + 1,
                   last_dissent_bill_id = p_bill_id
             WHERE b.nation_id = v_nation_id
               AND b.dissolved_at_tick IS NULL
               AND EXISTS (
                   SELECT 1 FROM bill_support bs
                   JOIN factions f ON f.id = bs.faction_id
                   WHERE bs.bill_id = p_bill_id
                     AND f.bloc_id = b.id
                     AND bs.stance IN ('yes', 'accept')
               )
               AND EXISTS (
                   SELECT 1 FROM bill_support bs
                   JOIN factions f ON f.id = bs.faction_id
                   WHERE bs.bill_id = p_bill_id
                     AND f.bloc_id = b.id
                     AND bs.stance IN ('no', 'reject')
               )
            RETURNING b.id, b.dissent_count, b.name
        )
        SELECT id, dissent_count, name FROM bumped
    LOOP
        IF v_row.dissent_count >= 3 THEN
            -- Phase 2d: capture representative YES + NO party names
            -- BEFORE bloc_id is nulled out on members.
            SELECT f.faction_name INTO v_yes_party
              FROM bill_support bs
              JOIN factions f ON f.id = bs.faction_id
             WHERE bs.bill_id = p_bill_id
               AND f.bloc_id = v_row.id
               AND bs.stance IN ('yes', 'accept')
             ORDER BY f.faction_name
             LIMIT 1;

            SELECT f.faction_name INTO v_no_party
              FROM bill_support bs
              JOIN factions f ON f.id = bs.faction_id
             WHERE bs.bill_id = p_bill_id
               AND f.bloc_id = v_row.id
               AND bs.stance IN ('no', 'reject')
             ORDER BY f.faction_name
             LIMIT 1;

            v_bloc_name := v_row.name;

            UPDATE factions SET bloc_id = NULL WHERE bloc_id = v_row.id;
            UPDATE bloc_invitations
               SET status = 'rescinded', responded_at_tick = v_tick
             WHERE bloc_id = v_row.id AND status = 'pending';
            UPDATE blocs
               SET dissolved_at_tick  = v_tick,
                   dissolution_reason = 'vote_split'
             WHERE id = v_row.id;
            v_dissolved_count := v_dissolved_count + 1;

            v_event_desc := 'The ' || v_bloc_name || ' bloc has dissolved after '
                         || COALESCE(v_yes_party, 'one member')
                         || ' and '
                         || COALESCE(v_no_party, 'another')
                         || ' disagreed on '
                         || COALESCE(v_bill_name, 'a bill')
                         || '.';

            -- Event insert wrapped so a write failure doesn't leave the
            -- dissolution half-rolled-back (members re-pointed at a bloc
            -- flagged dissolved, etc.). Log and continue.
            BEGIN
                INSERT INTO event_log (
                    nation_id, event_name, trigger_key, category,
                    description_chosen, effects_applied, fired_at_tick
                ) VALUES (
                    v_nation_id, 'Bloc Dissolved', 'bloc_dissolved_vote_split',
                    'political', v_event_desc,
                    jsonb_build_object(
                        'bloc_id', v_row.id,
                        'bloc_name', v_bloc_name,
                        'reason', 'vote_split',
                        'bill_id', p_bill_id,
                        'bill_name', v_bill_name,
                        'yes_party_name', v_yes_party,
                        'no_party_name', v_no_party
                    ),
                    v_tick
                );
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Bloc dissolution event_log insert failed for bloc % (%): %',
                    v_row.id, v_bloc_name, SQLERRM;
            END;
        END IF;
    END LOOP;

    RETURN v_dissolved_count;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION process_bloc_vote_cohesion(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION process_bloc_vote_cohesion(UUID) TO service_role;

-- ==================== VERIFY ====================
SELECT 'create_bloc RPC'                   AS object, COUNT(*) AS present
  FROM pg_proc WHERE proname = 'create_bloc'
UNION ALL
SELECT 'process_bloc_vote_cohesion RPC', COUNT(*)
  FROM pg_proc WHERE proname = 'process_bloc_vote_cohesion';
