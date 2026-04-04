-- ==================== FIX CALVETH LIVE GOVERNMENT NAMES ====================
-- Directly patches the ministries, head_of_government, and administrations
-- tables for Calveth's active government.
--
-- Problem: Ministers show "Unknown Person" and PM shows "Tomas Mendoza"
-- because the assign_ministry RPC wrote placeholder names.
-- This script assigns proper Danish names to all active Calveth ministers.
--
-- Safe to re-run: only affects Calveth's active government.

DO $$
DECLARE
  v_nation_id UUID;
  v_pm_faction_id UUID;
  v_pm_first TEXT;
  v_pm_last TEXT;
  v_pm_age INT;
  v_ministry RECORD;
  v_first_names TEXT[] := ARRAY['Lukas','Noah','Victor','Oliver','Oscar','William','Emil','Alfred','Magnus','Mads','Frederik','Christian','Mikkel','Anders','Lars','Søren','Rasmus','Kristian','Morten','Jesper'];
  v_last_names TEXT[] := ARRAY['Jensen','Nielsen','Hansen','Pedersen','Andersen','Christensen','Larsen','Sørensen','Rasmussen','Jørgensen','Petersen','Madsen','Kristensen','Olsen','Thomsen','Christiansen','Poulsen','Johansen','Knudsen','Mortensen'];
  v_new_first TEXT;
  v_new_last TEXT;
  v_new_age INT;
BEGIN
  -- Get Calveth's nation ID
  SELECT id INTO v_nation_id FROM nations WHERE name = 'Calveth';
  IF v_nation_id IS NULL THEN
    RAISE NOTICE 'Calveth not found, nothing to do.';
    RETURN;
  END IF;

  -- 1. Fix PM: Use the faction leader's name (already backfilled to Danish)
  --    Get the PM's party from head_of_government
  SELECT faction_id INTO v_pm_faction_id
  FROM head_of_government
  WHERE nation_id = v_nation_id AND active = true;

  IF v_pm_faction_id IS NOT NULL THEN
    -- Get the (now-Danish) leader name from factions
    SELECT leader_first_name, leader_last_name, leader_age
    INTO v_pm_first, v_pm_last, v_pm_age
    FROM factions
    WHERE id = v_pm_faction_id;

    -- Update head_of_government table
    UPDATE head_of_government SET
      first_name = v_pm_first,
      last_name = v_pm_last,
      age = COALESCE(v_pm_age, 45)
    WHERE nation_id = v_nation_id AND active = true;

    -- Update the PM ministry row
    UPDATE ministries SET
      minister_first_name = v_pm_first,
      minister_last_name = v_pm_last,
      minister_age = COALESCE(v_pm_age, 45)
    WHERE nation_id = v_nation_id
      AND ministry_key = 'prime_minister'
      AND is_active = true;

    -- Update the administration name
    UPDATE administrations SET
      prime_minister = v_pm_first || ' ' || v_pm_last,
      admin_name = v_pm_last || ' Administration'
    WHERE nation_id = v_nation_id AND ended_at_tick IS NULL;

    RAISE NOTICE 'PM updated to: % %', v_pm_first, v_pm_last;
  END IF;

  -- 2. Fix all non-PM ministers: assign random Danish names
  FOR v_ministry IN
    SELECT id, ministry_key
    FROM ministries
    WHERE nation_id = v_nation_id
      AND is_active = true
      AND ministry_key != 'prime_minister'
      AND (minister_first_name IS NULL
           OR minister_first_name = 'Unknown'
           OR minister_last_name = 'Person')
  LOOP
    v_new_first := v_first_names[1 + floor(random() * array_length(v_first_names, 1))::int];
    v_new_last  := v_last_names[1 + floor(random() * array_length(v_last_names, 1))::int];
    v_new_age   := 35 + floor(random() * 31)::int;

    UPDATE ministries SET
      minister_first_name = v_new_first,
      minister_last_name  = v_new_last,
      minister_age        = v_new_age
    WHERE id = v_ministry.id;

    RAISE NOTICE '  % → % % (age %)', v_ministry.ministry_key, v_new_first, v_new_last, v_new_age;
  END LOOP;

  RAISE NOTICE 'Done — Calveth government names fixed.';
END $$;
