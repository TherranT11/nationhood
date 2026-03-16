-- Backfill existing leaders who have no traits with 1-2 positive and 1-2 negative traits.
-- Respects contradiction pairs so no leader gets e.g. born_leader + unelectable.

DO $$
DECLARE
    faction_row RECORD;
    pos_pool TEXT[] := ARRAY[
        'tireless_campaigner','efficient_operator','quick_study','delegation',
        'born_leader','comeback_kid','crowd_pleaser','telegenic',
        'arm_twister','deal_maker','policy_wonk','constitutional_scholar',
        'cabinet_builder','executive_authority','crisis_manager','economic_steward',
        'statesman','international_presence','populist_touch','base_energizer'
    ];
    neg_pool TEXT[] := ARRAY[
        'indecisive','micromanager','slow_to_act','high_maintenance',
        'unelectable','sore_loser','gaffe_prone','wooden_speaker',
        'poor_whip','stubborn_negotiator','single_issue','paper_thin_mandate',
        'cabinet_hog','overreach','panic_under_pressure','economically_illiterate',
        'isolationist','international_pariah','elitist','divisive_figure'
    ];
    -- Contradiction pairs: positive index -> negative index (0-based into the arrays above)
    -- The arrays are ordered so index i in pos_pool contradicts index i in neg_pool
    picked_pos TEXT[];
    picked_neg TEXT[];
    num_pos INT;
    num_neg INT;
    candidate TEXT;
    contradicted BOOLEAN;
    i INT;
    j INT;
    shuffled_pos TEXT[];
    shuffled_neg TEXT[];
BEGIN
    FOR faction_row IN
        SELECT id, leader_first_name, leader_last_name
        FROM factions
        WHERE leader_first_name IS NOT NULL
          AND leader_last_name IS NOT NULL
          AND (leader_positive_traits IS NULL
               OR leader_positive_traits = '[]'::JSONB
               OR jsonb_array_length(leader_positive_traits) = 0)
    LOOP
        -- Shuffle positive pool
        shuffled_pos := ARRAY(SELECT unnest(pos_pool) ORDER BY random());
        -- Shuffle negative pool
        shuffled_neg := ARRAY(SELECT unnest(neg_pool) ORDER BY random());

        -- Pick 1-2 positive traits
        num_pos := 1 + floor(random() * 2)::INT;  -- 1 or 2
        picked_pos := '{}';
        FOR i IN 1..array_length(shuffled_pos, 1) LOOP
            EXIT WHEN array_length(picked_pos, 1) >= num_pos;
            picked_pos := picked_pos || shuffled_pos[i];
        END LOOP;

        -- Pick 1-2 negative traits, avoiding contradictions with picked positives
        num_neg := 1 + floor(random() * 2)::INT;  -- 1 or 2
        picked_neg := '{}';
        FOR i IN 1..array_length(shuffled_neg, 1) LOOP
            EXIT WHEN array_length(picked_neg, 1) >= num_neg;
            candidate := shuffled_neg[i];
            contradicted := FALSE;

            -- Check if this negative contradicts any picked positive
            -- Contradiction pairs are aligned by index in pos_pool/neg_pool
            FOR j IN 1..array_length(pos_pool, 1) LOOP
                IF neg_pool[j] = candidate THEN
                    -- The contradicting positive would be pos_pool[j]
                    IF pos_pool[j] = ANY(picked_pos) THEN
                        contradicted := TRUE;
                    END IF;
                    EXIT;
                END IF;
            END LOOP;

            -- Also check wooden_speaker which contradicts both crowd_pleaser AND telegenic
            IF candidate = 'wooden_speaker' AND ('crowd_pleaser' = ANY(picked_pos) OR 'telegenic' = ANY(picked_pos)) THEN
                contradicted := TRUE;
            END IF;

            IF NOT contradicted THEN
                picked_neg := picked_neg || candidate;
            END IF;
        END LOOP;

        -- Update the faction
        UPDATE factions
        SET leader_positive_traits = to_jsonb(picked_pos),
            leader_negative_traits = to_jsonb(picked_neg)
        WHERE id = faction_row.id;

        RAISE NOTICE 'Backfilled traits for faction %: +% -%',
            faction_row.id, picked_pos, picked_neg;
    END LOOP;
END $$;
