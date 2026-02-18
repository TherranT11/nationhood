-- Comprehensive stat key normalization across ALL effect tables.
-- Fixes known mismatches where effect records use legacy/incorrect stat keys.
-- Safe to re-run (only updates rows that match the old value).
-- Run this in Supabase SQL editor.
--
-- Alias mapping (wrong → correct):
--   literacy_rate        → literacy
--   hospital_beds        → beds_per_100k
--   technology           → digital_infrastructure
--   infrastructure       → physical_infrastructure
--   tourism              → international_reputation
--   diplomatic_standing  → international_reputation
--   military_strength    → stability
--   education_quality    → higher_education
--   education            → higher_education
--   trade                → trade_balance
--   trade_volume         → trade_balance
--   intl_reputation      → international_reputation
--   credit_rating        → credit
--   credit_score         → credit

-- Helper: apply alias mapping to a JSONB array of stat effect objects
-- (used for policies.stat_effects which stores [{stat_key, direction, ...}])
CREATE OR REPLACE FUNCTION _fix_stat_key_in_jsonb_array(arr JSONB, old_key TEXT, new_key TEXT)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    elem JSONB;
    result JSONB := '[]'::JSONB;
BEGIN
    FOR elem IN SELECT * FROM jsonb_array_elements(arr)
    LOOP
        IF elem->>'stat_key' = old_key THEN
            elem := jsonb_set(elem, '{stat_key}', to_jsonb(new_key));
        END IF;
        result := result || jsonb_build_array(elem);
    END LOOP;
    RETURN result;
END $$;

-- Define all aliases
DO $$
DECLARE
    alias RECORD;
BEGIN
    FOR alias IN
        SELECT * FROM (VALUES
            ('literacy_rate',       'literacy'),
            ('hospital_beds',       'beds_per_100k'),
            ('technology',          'digital_infrastructure'),
            ('infrastructure',      'physical_infrastructure'),
            ('tourism',             'international_reputation'),
            ('diplomatic_standing', 'international_reputation'),
            ('military_strength',   'stability'),
            ('education_quality',   'higher_education'),
            ('education',           'higher_education'),
            ('trade',               'trade_balance'),
            ('trade_volume',        'trade_balance'),
            ('intl_reputation',     'international_reputation'),
            ('credit_rating',       'credit'),
            ('credit_score',        'credit')
        ) AS t(old_key, new_key)
    LOOP
        -- 1. policies.stat_effects (JSONB array)
        UPDATE policies
        SET stat_effects = _fix_stat_key_in_jsonb_array(stat_effects, alias.old_key, alias.new_key)
        WHERE stat_effects::TEXT LIKE '%' || alias.old_key || '%';

        IF FOUND THEN RAISE NOTICE 'Fixed policies.stat_effects: % → %', alias.old_key, alias.new_key; END IF;

        -- 2. policies.target_stat (TEXT column)
        UPDATE policies SET target_stat = alias.new_key
        WHERE target_stat = alias.old_key;

        IF FOUND THEN RAISE NOTICE 'Fixed policies.target_stat: % → %', alias.old_key, alias.new_key; END IF;

        -- 3. crisis_effects.stat_key
        UPDATE crisis_effects SET stat_key = alias.new_key
        WHERE stat_key = alias.old_key;

        IF FOUND THEN RAISE NOTICE 'Fixed crisis_effects: % → %', alias.old_key, alias.new_key; END IF;

        -- 4. crisis_triggers.stat_key
        UPDATE crisis_triggers SET stat_key = alias.new_key
        WHERE stat_key = alias.old_key;

        IF FOUND THEN RAISE NOTICE 'Fixed crisis_triggers: % → %', alias.old_key, alias.new_key; END IF;

        -- 5. crisis_end_triggers.stat_key
        UPDATE crisis_end_triggers SET stat_key = alias.new_key
        WHERE stat_key = alias.old_key;

        IF FOUND THEN RAISE NOTICE 'Fixed crisis_end_triggers: % → %', alias.old_key, alias.new_key; END IF;

        -- 6. event_effects.stat_key
        UPDATE event_effects SET stat_key = alias.new_key
        WHERE stat_key = alias.old_key;

        IF FOUND THEN RAISE NOTICE 'Fixed event_effects: % → %', alias.old_key, alias.new_key; END IF;

        -- 7. event_triggers.stat_key
        UPDATE event_triggers SET stat_key = alias.new_key
        WHERE stat_key = alias.old_key;

        IF FOUND THEN RAISE NOTICE 'Fixed event_triggers: % → %', alias.old_key, alias.new_key; END IF;

        -- 8. ministry_action_log.stat_effects (JSONB array)
        UPDATE ministry_action_log
        SET stat_effects = _fix_stat_key_in_jsonb_array(stat_effects, alias.old_key, alias.new_key)
        WHERE stat_effects IS NOT NULL AND stat_effects::TEXT LIKE '%' || alias.old_key || '%';

        IF FOUND THEN RAISE NOTICE 'Fixed ministry_action_log: % → %', alias.old_key, alias.new_key; END IF;
    END LOOP;

    RAISE NOTICE 'Stat key alias migration v3 complete.';
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS _fix_stat_key_in_jsonb_array(JSONB, TEXT, TEXT);
