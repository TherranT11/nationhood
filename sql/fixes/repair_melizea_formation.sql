-- Heal Melizea's government_formations row.
--
-- Symptom: Government → Election subtab in Melizea shows
-- "No Government — Snap Election Imminent" while Government → Administrative
-- correctly shows the Delgado Administration with a full cabinet.
--
-- Root cause: the Election tab's hasFormedGov check queries
--   government_formations WHERE status = 'formed'
-- but the active formation row for Melizea isn't in that state — it's either
-- 'active', missing entirely (formGovernmentFallback path), or one of several
-- now-broken statuses left behind by historical migrations.
--
-- This script ensures Melizea has exactly one government_formations row in
-- 'formed' state for the active administration. Idempotent — re-runnable.

BEGIN;

DO $$
DECLARE
    v_nation_id      uuid;
    v_admin_id       uuid;
    v_pm_party_id    uuid;
    v_admin_started  int;
    v_existing_id    uuid;
    v_party_ids      uuid[];
BEGIN
    SELECT id INTO v_nation_id FROM nations WHERE name = 'Melizea' LIMIT 1;
    IF v_nation_id IS NULL THEN
        RAISE EXCEPTION 'Melizea nation not found';
    END IF;

    -- Pull the active administration to learn the PM party + start tick.
    SELECT id, pm_party_id, started_at_tick
      INTO v_admin_id, v_pm_party_id, v_admin_started
      FROM administrations
     WHERE nation_id = v_nation_id AND ended_at_tick IS NULL
     ORDER BY started_at_tick DESC NULLS LAST
     LIMIT 1;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'No active administration for Melizea';
    END IF;

    -- Coalition party_ids = every party that holds an active ministry seat.
    SELECT COALESCE(array_agg(DISTINCT party_id), ARRAY[]::uuid[])
      INTO v_party_ids
      FROM ministries
     WHERE nation_id = v_nation_id
       AND is_active  = true
       AND party_id  IS NOT NULL;

    -- Promote any existing 'active' or 'proposed' formation to 'formed'.
    UPDATE government_formations
       SET status    = 'formed',
           formed_at = COALESCE(formed_at, NOW())
     WHERE nation_id = v_nation_id
       AND status IN ('active', 'proposed');

    -- If still no formed row, synthesize one from the administration.
    SELECT id INTO v_existing_id
      FROM government_formations
     WHERE nation_id = v_nation_id
       AND status    = 'formed'
     LIMIT 1;

    IF v_existing_id IS NULL THEN
        INSERT INTO government_formations (
            nation_id, proposed_by, status, party_ids,
            formation_type, formed_at,
            ministry_assignments
        ) VALUES (
            v_nation_id,
            v_pm_party_id,
            'formed',
            v_party_ids,
            'coalition',
            NOW(),
            jsonb_build_object('prime_minister', v_pm_party_id)
        );
        RAISE NOTICE 'Melizea: synthesized new formed government_formation';
    ELSE
        RAISE NOTICE 'Melizea: existing formation % is now status=formed', v_existing_id;
    END IF;
END $$;

-- Verify.
SELECT id, status, formed_at, array_length(party_ids, 1) AS coalition_size
  FROM government_formations
 WHERE nation_id = (SELECT id FROM nations WHERE name = 'Melizea' LIMIT 1)
 ORDER BY COALESCE(formed_at, '1900-01-01') DESC;

COMMIT;
