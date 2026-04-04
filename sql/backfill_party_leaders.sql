-- ==================== BACKFILL PARTY LEADERS + FOUNDED DATE ====================
-- Assigns a random leader name + age to every faction.
-- Uses array indexing with per-row random() to ensure different names.
-- Also backfills created_at for any factions missing a founding date.
-- Re-running is safe: overwrites leader fields, only sets created_at if NULL.

-- 1. Randomize leaders for all party factions using nation-specific name pools
-- Calveth → Danish names, Avelia → Avelian names, Flandis → Dutch names, others → Crucera (Spanish)
UPDATE factions f
SET leader_first_name = CASE n.name
      WHEN 'Calveth' THEN (ARRAY['Lukas','Noah','Victor','Oliver','Oscar','William','Emil','Alfred','Magnus','Mads','Frederik','Christian','Mikkel','Anders','Lars','Søren','Rasmus','Kristian','Morten','Jesper'])[1 + floor(random()*20)::int]
      WHEN 'Avelia' THEN (ARRAY['Marcelo','Luciana','Dante','Sofía','Lorenzo','Elena','Tomás','Rosario','Fabrizio','Carolina','Leandro','Paloma','Giancarlo','Inés','Renato','Marisol','Nico','Florencia','Aurelio','Celeste'])[1 + floor(random()*20)::int]
      WHEN 'Flandis' THEN (ARRAY['Adriaan','Bastiaan','Casper','Damiaan','Evert','Floris','Gerben','Harmen','Ivo','Jasper','Klaas','Laurens','Maarten','Niels','Olaf','Pieter','Quinten','Reinier','Sander','Thijs'])[1 + floor(random()*20)::int]
      ELSE (ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin','Emilio','Catalina','Fernando','Renata'])[1 + floor(random()*20)::int]
    END,
    leader_last_name = CASE n.name
      WHEN 'Calveth' THEN (ARRAY['Jensen','Nielsen','Hansen','Pedersen','Andersen','Christensen','Larsen','Sørensen','Rasmussen','Jørgensen','Petersen','Madsen','Kristensen','Olsen','Thomsen','Christiansen','Poulsen','Johansen','Knudsen','Mortensen'])[1 + floor(random()*20)::int]
      WHEN 'Avelia' THEN (ARRAY['Montalbán','Ferretti','Salcedo','Conti','Valverde','Lucero','Maretti','Orellana','Bellini','Calderón','Santoro','Vásquez','Lombardi','Peñaloza','Rinaldi','Escobar','Castellani','Madrigal','Giacomo','Solano'])[1 + floor(random()*20)::int]
      WHEN 'Flandis' THEN (ARRAY['Bakker','Bos','Bosman','Brouwer','De Graaf','De Jong','De Vries','De Wit','Dekker','Dijkstra','Dijk','Driessen','Gerritsen','Hendriks','Hermans','Hoekstra','Huisman','Jacobs','Janssen','Koster'])[1 + floor(random()*20)::int]
      ELSE (ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero','Aguilar','Valenzuela','Carrasco','Ibarra'])[1 + floor(random()*20)::int]
    END,
    leader_age = 35 + floor(random() * 20)::int
FROM nations n
WHERE f.nation_id = n.id
  AND f.faction_type = 'party';

-- 2. Backfill created_at for factions that have none
UPDATE factions
SET created_at = now()
WHERE faction_type = 'party'
  AND created_at IS NULL;

-- 3. Backfill founded_tick from the shard's current tick for any party missing it
UPDATE factions
SET founded_tick = (SELECT current_tick FROM shard WHERE name = 'Alpha Shard')
WHERE faction_type = 'party'
  AND founded_tick IS NULL;
