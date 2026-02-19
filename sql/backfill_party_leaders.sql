-- ==================== BACKFILL PARTY LEADERS ====================
-- Assigns a random leader name + age to every faction that doesn't have one yet.
-- Uses the same name pool as the PM candidate system.

WITH names AS (
    SELECT unnest(ARRAY[
        'Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca',
        'Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin',
        'Emilio','Catalina','Fernando','Renata'
    ]) AS first_name,
    generate_series(1,20) AS idx
),
surnames AS (
    SELECT unnest(ARRAY[
        'Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos',
        'Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero',
        'Aguilar','Valenzuela','Carrasco','Ibarra'
    ]) AS last_name,
    generate_series(1,20) AS idx
)
UPDATE factions
SET leader_first_name = (SELECT first_name FROM names ORDER BY random() LIMIT 1),
    leader_last_name  = (SELECT last_name  FROM surnames ORDER BY random() LIMIT 1),
    leader_age        = 35 + floor(random() * 20)::int   -- 35-54
WHERE faction_type = 'party'
  AND leader_first_name IS NULL;
