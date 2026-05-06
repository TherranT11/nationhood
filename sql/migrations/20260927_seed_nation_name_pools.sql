-- 20260927_seed_nation_name_pools.sql
--
-- Seed nations.first_name_pool / last_name_pool from the JS name
-- constants in political-actions.js so the SQL backfill for the
-- Vola team roster can actually draw culturally-appropriate names
-- instead of falling through to "Player One / Player Two".
--
-- After populating the pools we TRUNCATE vola_team_players and
-- regenerate every nation's roster (same lateral-random approach
-- as 20260925) so the previous "Player One" rows get replaced
-- with real names.
--
-- Source pools (must stay in sync with js/game/political-actions.js):
--   PM_*       → Crucera (Sangreza, Melizea, Montequilla, Palvera, San Estrella)
--   AVELIA_*   → Avelia
--   CALVETH_*  → Calveth
--   FLANDIS_*  → Flandis
--   VOSTIA_*   → Vostia
--   ALMAKIR_*  → Hajjara
--   DRAVKA_*   → Dravka
--   DANWEI_*   → Danwei (family-first; "first_name" slot holds surnames)

BEGIN;

-- Map of nation_name → (first_name_pool, last_name_pool).
WITH pools(nation_name, first_pool, last_pool) AS (
    VALUES
    -- Crucera default (PM_* in JS).
    ('Sangreza',    ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin','Emilio','Catalina','Fernando','Renata','Ricardo','Héctor','Ignacio','Santiago','Esteban','Nicolás','Ramón','Arturo','Álvaro','Gonzalo','Javier','Mauricio','Enrique','Sergio','Adrián','Hugo','Cristián','Rubén','Germán','Felipe'],
                    ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero','Aguilar','Valenzuela','Carrasco','Ibarra','Fuentes','Quiroga','Sepúlveda','Villalobos','Paredes','Arellano','Sandoval','Medina','Estrada','Cervantes','Figueroa','Maldonado','Cisneros','Zúñiga','Bustamante','Roldán','Camacho','Gallardo','Barrera','Saavedra']),
    ('Melizea',     ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin','Emilio','Catalina','Fernando','Renata','Ricardo','Héctor','Ignacio','Santiago','Esteban','Nicolás','Ramón','Arturo','Álvaro','Gonzalo','Javier','Mauricio','Enrique','Sergio','Adrián','Hugo','Cristián','Rubén','Germán','Felipe'],
                    ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero','Aguilar','Valenzuela','Carrasco','Ibarra','Fuentes','Quiroga','Sepúlveda','Villalobos','Paredes','Arellano','Sandoval','Medina','Estrada','Cervantes','Figueroa','Maldonado','Cisneros','Zúñiga','Bustamante','Roldán','Camacho','Gallardo','Barrera','Saavedra']),
    ('Montequilla', ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin','Emilio','Catalina','Fernando','Renata','Ricardo','Héctor','Ignacio','Santiago','Esteban','Nicolás','Ramón','Arturo','Álvaro','Gonzalo','Javier','Mauricio','Enrique','Sergio','Adrián','Hugo','Cristián','Rubén','Germán','Felipe'],
                    ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero','Aguilar','Valenzuela','Carrasco','Ibarra','Fuentes','Quiroga','Sepúlveda','Villalobos','Paredes','Arellano','Sandoval','Medina','Estrada','Cervantes','Figueroa','Maldonado','Cisneros','Zúñiga','Bustamante','Roldán','Camacho','Gallardo','Barrera','Saavedra']),
    ('Palvera',     ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin','Emilio','Catalina','Fernando','Renata','Ricardo','Héctor','Ignacio','Santiago','Esteban','Nicolás','Ramón','Arturo','Álvaro','Gonzalo','Javier','Mauricio','Enrique','Sergio','Adrián','Hugo','Cristián','Rubén','Germán','Felipe'],
                    ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero','Aguilar','Valenzuela','Carrasco','Ibarra','Fuentes','Quiroga','Sepúlveda','Villalobos','Paredes','Arellano','Sandoval','Medina','Estrada','Cervantes','Figueroa','Maldonado','Cisneros','Zúñiga','Bustamante','Roldán','Camacho','Gallardo','Barrera','Saavedra']),
    ('San Estrella',ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin','Emilio','Catalina','Fernando','Renata','Ricardo','Héctor','Ignacio','Santiago','Esteban','Nicolás','Ramón','Arturo','Álvaro','Gonzalo','Javier','Mauricio','Enrique','Sergio','Adrián','Hugo','Cristián','Rubén','Germán','Felipe'],
                    ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero','Aguilar','Valenzuela','Carrasco','Ibarra','Fuentes','Quiroga','Sepúlveda','Villalobos','Paredes','Arellano','Sandoval','Medina','Estrada','Cervantes','Figueroa','Maldonado','Cisneros','Zúñiga','Bustamante','Roldán','Camacho','Gallardo','Barrera','Saavedra']),
    -- Avelia.
    ('Avelia',      ARRAY['Marcelo','Luciana','Dante','Sofía','Lorenzo','Elena','Tomás','Rosario','Fabrizio','Carolina','Leandro','Paloma','Giancarlo','Inés','Renato','Marisol','Nico','Florencia','Aurelio','Celeste','Valentín','Matías','Silvio','Bernardo','Cristóbal','Lazzaro','Osvaldo','Enzo','Pascual','Damián'],
                    ARRAY['Montalbán','Ferretti','Salcedo','Conti','Valverde','Lucero','Maretti','Orellana','Bellini','Calderón','Santoro','Vásquez','Lombardi','Peñaloza','Rinaldi','Escobar','Castellani','Madrigal','Giacomo','Solano','Traverso','Coronado','Benedetti','Villarreal','Rosetti','Mondragón','Falcone','Quirós','Molinari','Saldaña']),
    -- Calveth.
    ('Calveth',     ARRAY['Lukas','Noah','Victor','Oliver','Oscar','William','Emil','Alfred','Magnus','Mads','Frederik','Christian','Mikkel','Anders','Lars','Søren','Rasmus','Kristian','Morten','Jesper','Henrik','Thomas','Jacob','Sebastian','Mathias','Valdemar','Karl','Arthur','Otto','August','Erik','Jens','Niels','Hans','Poul','Viggo','Aksel','Felix','Malthe','Gustav','Alma','Ida','Clara','Ella','Olivia','Freja','Sofie','Astrid','Maja','Agnes'],
                    ARRAY['Jensen','Nielsen','Hansen','Pedersen','Andersen','Christensen','Larsen','Sørensen','Rasmussen','Jørgensen','Petersen','Madsen','Kristensen','Olsen','Thomsen','Christiansen','Poulsen','Johansen','Knudsen','Mortensen','Møller','Jacobsen','Jakobsen','Olesen','Frederiksen','Mikkelsen','Henriksen','Laursen','Lund','Schmidt','Eriksen','Holm','Clausen','Svendsen','Andreasen','Iversen','Jeppesen','Vestergaard','Bertelsen','Nissen','Kjær','Gregersen','Jepsen','Hermansen','Bayer','Buch','Dahl','Dam','Haugaard','Høeg','Jespersen','Kjeldsen','Kofod','Kragh','Krogh','Lassen','Lind','Lorentzen','Ludvigsen','Mathiasen','Mogensen','Munk','Nedergaard','Nygaard','Nørgaard','Ottosen','Overgaard','Pallesen','Schiøtz','Simonsen','Skov','Søndergaard','Villadsen','Winther']),
    -- Flandis.
    ('Flandis',     ARRAY['Anneliese','Bregje','Clasien','Dymphna','Elske','Fenna','Grietje','Hanneke','Ilse','Jobke','Karlijn','Lieselotte','Maaike','Nienke','Roos','Adriaan','Bastiaan','Casper','Damiaan','Evert','Floris','Gerben','Harmen','Ivo','Jasper','Klaas','Laurens','Maarten','Niels','Olaf','Pieter','Quinten','Reinier','Sander','Thijs','Uwe','Valentijn','Wessel','Xander','Yorick','Zeger','Arjen','Bram','Cor','Daan','Egbert','Folkert','Gijs','Hedzer','Imro'],
                    ARRAY['Bakker','Bos','Bosman','Brouwer','De Graaf','De Jong','De Vries','De Wit','Dekker','Dijkstra','Dijk','Driessen','Gerritsen','Hendriks','Hermans','Hoekstra','Huisman','Jacobs','Janssen','Koster','Kuiper','Lammers','Maas','Meijer','Mulder','Peters','Pieters','Pijpers','Post','Prins','Smit','Smits','Snel','Snoek','Timmers','Van Dam','Van den Berg','Van den Bosch','Van der Laan','Van der Meer','Van Dijk','Van Houten','Van Leeuwen','Van Rijn','Vermeer','Visser','Willems','Wolff','Zijlstra','Zwart']),
    -- Vostia.
    ('Vostia',      ARRAY['Dragan','Goran','Vuk','Zoran','Dušan','Nemanja','Bogdan','Slobodan','Vlastimir','Milorad','Gvozden','Radomir','Branislav','Jovan','Dimitrije','Ognjen','Lazar','Miodrag','Zdravko','Nebojša','Predrag','Stojan','Vojislav','Darko','Borislav','Momčilo','Uroš','Radoš','Božidar','Gavrilo','Vasilije','Đorđe','Radovan','Blagoje','Veljko','Živko','Krsto','Miloš','Draško','Balša','Dragana','Svetlana','Jelena','Milica','Danica','Zora','Radmila','Snežana','Vesna'],
                    ARRAY['Jovanović','Petrović','Đorđević','Marković','Nikolić','Popović','Stojanović','Ilić','Lukić','Babić','Ristić','Kostić','Vuković','Lazarević','Kovačević','Simić','Milošević','Stevanović','Tomić','Savić','Radović','Dimitrijević','Vasić','Bogdanović','Jović','Krstić','Mladenović','Filipović','Gajić','Cvetković','Mitić','Todorović','Milosavljević','Živković','Knežević','Pantić','Stanković','Marić','Mihajlović','Tasić','Pavlović','Kuzmanović','Milanović','Grbić','Obradović','Sekulić','Mašić','Bulatović','Krivokapić','Đukanović','Ivanović','Pešić','Milovanović','Mitrović','Antić','Perić','Blagojević','Drašković','Božić','Nedić','Vukotić','Vujović','Radulović','Matić','Damjanović','Krsmanović','Urošević','Šćepanović','Gojković','Zlatković','Arsić','Aleksić','Vidaković','Vasiljević','Janković']),
    -- Hajjara (Al-Makir / Arabic).
    ('Hajjara',     ARRAY['Ahmad','Muhammad','Ali','Omar','Hassan','Hussein','Khalid','Abdullah','Ibrahim','Yusuf','Ismail','Hamza','Tariq','Zayd','Saeed','Faisal','Nasser','Salman','Rashid','Kareem','Mahmoud','Farid','Jamal','Samir','Hadi','Anwar','Imran','Bilal','Qasim','Majid','Walid','Fadi','Rami','Zahir','Adnan','Amin','Haris','Yasin','Tamer','Nabil','Bashir','Dawood','Zakaria','Munir','Latif','Jaber','Mazen','Kamil','Rauf','Shadi'],
                    ARRAY['Al-Farouq','Al-Hakim','Al-Masri','Al-Sabah','Al-Najjar','Al-Haddad','Al-Saleh','Al-Sharif','Al-Khalifa','Al-Qahtani','Al-Harbi','Al-Otaibi','Al-Anzi','Al-Zahrani','Al-Ghamdi','Al-Dosari','Al-Rashidi','Al-Suwaidi','Al-Mansouri','Al-Mutairi','Al-Ahmadi','Al-Saeed','Al-Jabari','Al-Khatib','Al-Basri','Al-Tamimi','Al-Hashimi','Al-Kurdi','Al-Husseini','Al-Yamani','Al-Shammari','Al-Farsi','Al-Hamadi','Al-Siddiqi','Al-Qureshi','Al-Azmi','Al-Salem','Al-Din','Al-Rahman','Al-Majid','Al-Bakri','Al-Saadi','Al-Hilali','Al-Makki','Al-Madani','Al-Baghdadi','Al-Dimashqi','Al-Andalusi','Al-Maghribi','Al-Samarrai','Al-Tikriti','Al-Nasiri','Al-Fahd','Al-Karim','Al-Nouri','Al-Sayegh','Al-Rifai','Al-Qadri','Al-Ayoubi','Al-Barghouti','Al-Khatri','Al-Shihabi','Al-Awadi','Al-Sarraf','Al-Zubaidi','Al-Hussein','Al-Attar','Al-Safadi','Al-Hourani','Al-Kassab','Al-Taleb','Al-Hamdan','Al-Rantisi','Al-Banna','Al-Khatour']),
    -- Dravka (Albanian).
    ('Dravka',      ARRAY['Agon','Altin','Arban','Ardian','Ardit','Arian','Arlind','Armend','Artan','Auron','Bardhyl','Besart','Besmir','Besnik','Bledar','Blerim','Burim','Dalmat','Dardan','Dasnor','Dëfrim','Dorian','Drilon','Dritan','Edon','Endrit','Enver','Erion','Ermal','Ervin','Fisnik','Flamur','Genti','Gezim','Ilir','Jetmir','Kastriot','Kreshnik','Luan','Mirlind','Pajtim','Saimir','Skerdilaid','Taulant','Vigan','Afërdita','Bora','Era','Luljeta','Teuta'],
                    ARRAY['Abazi','Ademi','Agolli','Ahmeti','Alia','Aliti','Asllani','Bajrami','Bakalli','Bala','Balaj','Bardhi','Beqiri','Berisha','Biba','Bisha','Brahimi','Buda','Bushaj','Bushati','Caka','Cami','Cani','Cela','Dajaku','Dauti','Deda','Dedaj','Demiri','Dervishi','Dobi','Doda','Dragusha','Duka','Elezi','Fejzu','Ferati','Frashëri','Gashi','Gega','Gjoni','Gjoka','Gurakuqi','Hadergjonaj','Hajdari','Halili','Hamiti','Haradinaj','Hasani','Hoti','Hoxha','Ismaili','Jahjaga','Jashari','Kadiu','Kastrati','Kelmendi','Kodra','Kola','Konica','Krasniqi','Kuqi','Kurti','Leka','Lekaj','Limaj','Luli','Lumi','Malo','Marku','Mazreku','Mehmeti','Meidani','Meksi','Meta','Morina','Muka','Murati','Musliu','Mustafa','Myftiu','Nano','Ndreu','Osmani','Pajaziti','Pasha','Prenga','Qosja','Rama','Rexhepi','Rugova','Sadiku','Sejdiu','Selimi','Shala','Shehu','Smajlaj','Spahiu','Tafa','Zaimi']),
    -- Danwei (Taiwanese, family-first: surnames go in first_name slot).
    ('Danwei',      ARRAY['Chen','Lin','Huang','Chang','Lee','Wang','Wu','Liu','Tsai','Yang','Hsu','Cheng','Chou','Hsieh','Kuo','Chiang','Tang','Lo','Pan','Chao','Ho','Chu','Tseng','Yeh','Hsiao','Lai','Su','Ma','Hung','Chiu','Shih','Chien','Liao','Han','Sun','Wei','Ku','Fang','Yu','Shen','Fu','Hsiang','Tsao','Hu','Sung','Shao','Kao','Pao','Po','Lung'],
                    ARRAY['Kuo-yu','Wei-ming','Ming-chen','Chih-yuan','Hsiao-ping','Wen-cheng','Yu-ren','Ying-jeou','Teng-hui','Cheng-yi','Chen-yi','Tien-hsing','Po-yu','Chih-hao','Yi-feng','Chih-hung','Wei-jen','Cheng-ming','Po-chen','Hsing-kuo','Wen-fan','Po-hsiung','Tsung-hsien','Chao-ming','Yi-chun','Chang-ting','Mei-ling','Hsiu-lien','Wen-chi','Yu-hua','Su-chen','Yi-fang','Hsin-yi','Yu-ling','Chia-ling','Pei-ling','Mei-feng','Hsiao-mei','Yu-chen','Wen-ling','Mei-yu','Chia-hsuan','Pei-yi','Hsin-mei','Chia-jung','Pei-chen','Hsiu-chen','Mei-chen','Yi-ling','Hsiu-mei'])
)
UPDATE nations n
SET first_name_pool = p.first_pool,
    last_name_pool  = p.last_pool
FROM pools p
WHERE n.name = p.nation_name;

-- Any nation we don't have an explicit pool for falls back to the
-- Crucera pool so the backfill never sees NULL arrays.
UPDATE nations
SET first_name_pool = ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin','Emilio','Catalina','Fernando','Renata','Ricardo','Héctor','Ignacio','Santiago','Esteban','Nicolás','Ramón','Arturo','Álvaro','Gonzalo','Javier','Mauricio','Enrique','Sergio','Adrián','Hugo','Cristián','Rubén','Germán','Felipe']
WHERE first_name_pool IS NULL OR array_length(first_name_pool, 1) IS NULL;

UPDATE nations
SET last_name_pool = ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero','Aguilar','Valenzuela','Carrasco','Ibarra','Fuentes','Quiroga','Sepúlveda','Villalobos','Paredes','Arellano','Sandoval','Medina','Estrada','Cervantes','Figueroa','Maldonado','Cisneros','Zúñiga','Bustamante','Roldán','Camacho','Gallardo','Barrera','Saavedra']
WHERE last_name_pool IS NULL OR array_length(last_name_pool, 1) IS NULL;

-- Now wipe and regenerate the Vola team roster so the existing
-- "Player One/Two/Three" rows get replaced with real names.
TRUNCATE TABLE public.vola_team_players RESTART IDENTITY;

WITH shard_tick AS (
    SELECT current_tick AS t FROM shard WHERE name = 'Alpha Shard' LIMIT 1
)
INSERT INTO vola_team_players (
    nation_id, position_number, position_name,
    first_name, last_name, age, rating,
    recruited_at_tick, recruited_at_culture, retires_at_tick, is_captain
)
SELECT
    n.id,
    p.pos,
    CASE p.pos WHEN 1 THEN 'Forward' WHEN 2 THEN 'Midfielder' ELSE 'Defender' END,
    n.first_name_pool[r.first_idx],
    n.last_name_pool[r.last_idx],
    r.age,
    floor(COALESCE(n.national_vola_culture, 0))::int + r.d6,
    (SELECT t FROM shard_tick),
    COALESCE(n.national_vola_culture, 0),
    (SELECT t FROM shard_tick) + 1 + r.d36,
    p.pos = 1
FROM nations n
CROSS JOIN (VALUES (1),(2),(3)) AS p(pos)
CROSS JOIN LATERAL (
    SELECT
        1 + floor(random() * array_length(n.first_name_pool, 1))::int AS first_idx,
        1 + floor(random() * array_length(n.last_name_pool,  1))::int AS last_idx,
        18 + floor(random() * 18)::int AS age,
        1  + floor(random() *  6)::int AS d6,
        floor(random() * 36)::int      AS d36
) r;

UPDATE nations n SET national_team_prowess = COALESCE((
    SELECT SUM(rating) FROM vola_team_players WHERE nation_id = n.id
), 0);

COMMIT;
