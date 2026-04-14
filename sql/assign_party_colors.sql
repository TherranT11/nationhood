-- Assign random unique colors to all parties that don't have one or are all yellow/default
-- Uses a palette of 16 distinct political colors

WITH color_palette AS (
    SELECT unnest(ARRAY[
        '#c43a3a', '#d45a2a', '#c8a832', '#d4a017',
        '#8a9a4a', '#2a8a4a', '#3a6a3a', '#2a8a7a',
        '#4a8aba', '#3a5a9a', '#2a3a6a', '#7a4a9a',
        '#8a3a7a', '#ba4a6a', '#5a6a7a', '#4a4a4a'
    ]) AS hex,
    generate_series(1, 16) AS idx
),
parties_to_color AS (
    SELECT id, faction_name,
           ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
    FROM factions
    WHERE faction_type = 'party'
      AND abandoned_at IS NULL
)
UPDATE factions f
SET party_color = cp.hex
FROM parties_to_color ptc
JOIN color_palette cp ON cp.idx = ((ptc.rn - 1) % 16) + 1
WHERE f.id = ptc.id;
