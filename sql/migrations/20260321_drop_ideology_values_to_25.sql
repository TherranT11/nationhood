-- Drop Progress, Collectivism, and Equality to 25 for:
--   Solar Union (SOL)
--   Collective Essurance Party (CEP)
--   Palveran Democratic People's Party

UPDATE faction_ideology
SET tradition_progress = 25,
    individualism_collectivism = 25,
    liberty_equality = 25
WHERE faction_id IN (
    SELECT id FROM factions
    WHERE faction_name IN (
        'Solar Union',
        'Collective Essurance Party',
        E'Palveran Democratic People''s Party'
    )
);
