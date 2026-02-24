-- Set geographic proximity values for all nation pairs.
-- Scale: 0 = distant, 100 = bordering/neighboring.
-- Proximity >= 80 grants +10 trade affinity bonus.

-- Bordering nations (100)
UPDATE diplomatic_relations SET proximity = 100
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'melizea'));

UPDATE diplomatic_relations SET proximity = 100
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'));

UPDATE diplomatic_relations SET proximity = 100
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

UPDATE diplomatic_relations SET proximity = 100
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

UPDATE diplomatic_relations SET proximity = 100
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));

UPDATE diplomatic_relations SET proximity = 100
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'san estrella'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

UPDATE diplomatic_relations SET proximity = 100
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'sangreza'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'sangreza'), (SELECT id FROM nations WHERE LOWER(name) = 'montequilla'));

-- Non-bordering nations (20)
UPDATE diplomatic_relations SET proximity = 20
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'avelia'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));

UPDATE diplomatic_relations SET proximity = 20
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'san estrella'));

UPDATE diplomatic_relations SET proximity = 20
WHERE nation_a_id = LEAST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'))
  AND nation_b_id = GREATEST((SELECT id FROM nations WHERE LOWER(name) = 'melizea'), (SELECT id FROM nations WHERE LOWER(name) = 'sangreza'));
