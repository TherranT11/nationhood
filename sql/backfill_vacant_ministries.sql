-- Backfill vacant ministries for currently formed governments.
--
-- Bug: dissolveCoalition() wiped ministry rows when a new coalition formed,
-- but formGovernment() never re-populated them from the formation data.
-- This migration reads ministry_assignments + minister_names from each
-- active government_formations record and writes them into the ministries table.
--
-- Run once in the Supabase SQL editor.

DO $$
DECLARE
    f RECORD;
    m_key TEXT;
    m_party_id UUID;
    m_minister JSONB;
    m_existing_id UUID;
    ministry_display_name TEXT;
BEGIN
    -- Loop over every currently-formed government
    FOR f IN
        SELECT id, nation_id, ministry_assignments, minister_names
        FROM government_formations
        WHERE status = 'formed'
          AND ministry_assignments IS NOT NULL
          AND minister_names IS NOT NULL
    LOOP
        -- Loop over each ministry key in ministry_assignments
        FOR m_key, m_party_id IN
            SELECT key, value::UUID
            FROM jsonb_each_text(f.ministry_assignments)
            WHERE key != 'prime_minister'
              AND value IS NOT NULL
              AND value != ''
        LOOP
            m_minister := f.minister_names -> m_key;

            -- Skip if no minister name data for this key
            IF m_minister IS NULL THEN
                CONTINUE;
            END IF;

            -- Resolve display name
            ministry_display_name := CASE m_key
                WHEN 'interior' THEN 'Ministry of the Interior'
                WHEN 'foreign' THEN 'Foreign Ministry'
                WHEN 'defense' THEN 'Ministry of Defense'
                WHEN 'finance' THEN 'Ministry of Finance'
                WHEN 'education' THEN 'Ministry of Education'
                WHEN 'healthcare' THEN 'Ministry of Healthcare'
                WHEN 'labor' THEN 'Ministry of Labor'
                WHEN 'justice' THEN 'Ministry of Justice'
                WHEN 'transportation' THEN 'Ministry of Transportation'
                WHEN 'security' THEN 'Ministry of Security'
                ELSE m_key
            END;

            -- Check if an active ministry row already exists
            SELECT id INTO m_existing_id
            FROM ministries
            WHERE nation_id = f.nation_id
              AND ministry_key = m_key
              AND is_active = true
            LIMIT 1;

            IF m_existing_id IS NOT NULL THEN
                -- Only update if currently vacant (don't overwrite correctly-populated rows)
                UPDATE ministries
                SET party_id = m_party_id,
                    minister_first_name = m_minister ->> 'first_name',
                    minister_last_name  = m_minister ->> 'last_name',
                    minister_age        = (m_minister ->> 'age')::INT,
                    minister_approval   = COALESCE(minister_approval, 50)
                WHERE id = m_existing_id
                  AND (minister_first_name IS NULL OR party_id IS NULL);
            ELSE
                -- Create the ministry row
                INSERT INTO ministries (nation_id, ministry_key, ministry_name, is_active,
                                        party_id, minister_first_name, minister_last_name,
                                        minister_age, minister_approval)
                VALUES (f.nation_id, m_key, ministry_display_name, true,
                        m_party_id,
                        m_minister ->> 'first_name',
                        m_minister ->> 'last_name',
                        (m_minister ->> 'age')::INT,
                        50);
            END IF;
        END LOOP;
    END LOOP;
END $$;
