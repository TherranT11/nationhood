-- Fix stuck minister confirmations: bills passed via emergency powers
-- but ministries table was never updated (confirmation_status still 'pending').
--
-- This finds all minister_confirmation bills with status='passed' where the
-- corresponding ministry still has confirmation_status='pending' and a
-- pending_minister blob, then seats the minister.

DO $$
DECLARE
  rec RECORD;
  pm JSONB;
  ministry_display TEXT;
BEGIN
  FOR rec IN
    SELECT b.id AS bill_id, b.nation_id, b.ministry_key, b.bill_name,
           m.id AS ministry_id, m.pending_minister
    FROM bills b
    JOIN ministries m
      ON m.nation_id = b.nation_id
     AND m.ministry_key = b.ministry_key
     AND m.is_active = true
    WHERE b.bill_type = 'minister_confirmation'
      AND b.status = 'passed'
      AND m.confirmation_status = 'pending'
      AND m.pending_minister IS NOT NULL
  LOOP
    pm := rec.pending_minister;

    ministry_display := CASE rec.ministry_key
      WHEN 'prime_minister' THEN 'Prime Minister'
      WHEN 'interior' THEN 'Ministry of the Interior'
      WHEN 'foreign' THEN 'Foreign Ministry'
      WHEN 'defense' THEN 'Ministry of Defense'
      WHEN 'finance' THEN 'Ministry of Finance'
      WHEN 'education' THEN 'Ministry of Education'
      WHEN 'healthcare' THEN 'Ministry of Healthcare'
      WHEN 'labor' THEN 'Ministry of Labor'
      WHEN 'justice' THEN 'Ministry of Justice'
      WHEN 'trade' THEN 'Ministry of Trade'
      WHEN 'energy' THEN 'Ministry of Energy'
      WHEN 'transportation' THEN 'Ministry of Transportation'
      WHEN 'security' THEN 'Ministry of Security'
      ELSE rec.ministry_key
    END;

    UPDATE ministries SET
      party_id = (pm->>'party_id')::UUID,
      minister_first_name = pm->>'first_name',
      minister_last_name = pm->>'last_name',
      minister_age = (pm->>'age')::INT,
      minister_approval = 50,
      ministry_name = ministry_display,
      confirmation_status = 'confirmed',
      pending_minister = NULL
    WHERE id = rec.ministry_id;

    RAISE NOTICE 'Seated minister for % in nation %: % %',
      rec.ministry_key, rec.nation_id,
      pm->>'first_name', pm->>'last_name';
  END LOOP;
END $$;
