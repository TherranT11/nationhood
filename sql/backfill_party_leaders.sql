-- ==================== BACKFILL PARTY LEADERS + FOUNDED DATE ====================
-- Assigns a random leader name + age to every faction.
-- Uses array indexing with per-row random() to ensure different names.
-- Also backfills created_at for any factions missing a founding date.
-- Re-running is safe: overwrites leader fields, only sets created_at if NULL.

-- 1. Randomize leaders for all party factions
UPDATE factions
SET leader_first_name = (ARRAY[
        'Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca',
        'Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin',
        'Emilio','Catalina','Fernando','Renata'
    ])[1 + floor(random() * 20)::int],
    leader_last_name = (ARRAY[
        'Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos',
        'Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero',
        'Aguilar','Valenzuela','Carrasco','Ibarra'
    ])[1 + floor(random() * 20)::int],
    leader_age = 35 + floor(random() * 20)::int
WHERE faction_type = 'party';

-- 2. Backfill created_at for factions that have none
UPDATE factions
SET created_at = now()
WHERE faction_type = 'party'
  AND created_at IS NULL;
