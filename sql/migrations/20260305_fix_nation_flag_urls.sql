-- Fix missing flag_url on nations table for all nations
-- The flag_url column on the nations table is read by common.js and select-nation.html

UPDATE nations SET flag_url = 'assets/flags/Palvera.png' WHERE name = 'Palvera' AND (flag_url IS NULL OR flag_url = '');
UPDATE nations SET flag_url = 'assets/flags/sanestrella.png' WHERE name = 'San Estrella' AND (flag_url IS NULL OR flag_url = '');
UPDATE nations SET flag_url = 'assets/flags/sangreza.png' WHERE name = 'Sangreza' AND (flag_url IS NULL OR flag_url = '');
UPDATE nations SET flag_url = 'assets/flags/Avelia.png' WHERE name = 'Avelia' AND (flag_url IS NULL OR flag_url = '');
UPDATE nations SET flag_url = 'assets/flags/Melizea.png' WHERE name = 'Melizea' AND (flag_url IS NULL OR flag_url = '');
UPDATE nations SET flag_url = 'assets/flags/Montequilla.png' WHERE name = 'Montequilla' AND (flag_url IS NULL OR flag_url = '');

-- Also update nation_profiles if rows exist
UPDATE nation_profiles SET flag_url = 'assets/flags/Palvera.png' WHERE nation_id = (SELECT id FROM nations WHERE name = 'Palvera') AND (flag_url IS NULL OR flag_url = '');
UPDATE nation_profiles SET flag_url = 'assets/flags/sanestrella.png' WHERE nation_id = (SELECT id FROM nations WHERE name = 'San Estrella') AND (flag_url IS NULL OR flag_url = '');
UPDATE nation_profiles SET flag_url = 'assets/flags/sangreza.png' WHERE nation_id = (SELECT id FROM nations WHERE name = 'Sangreza') AND (flag_url IS NULL OR flag_url = '');
UPDATE nation_profiles SET flag_url = 'assets/flags/Avelia.png' WHERE nation_id = (SELECT id FROM nations WHERE name = 'Avelia') AND (flag_url IS NULL OR flag_url = '');
UPDATE nation_profiles SET flag_url = 'assets/flags/Melizea.png' WHERE nation_id = (SELECT id FROM nations WHERE name = 'Melizea') AND (flag_url IS NULL OR flag_url = '');
UPDATE nation_profiles SET flag_url = 'assets/flags/Montequilla.png' WHERE nation_id = (SELECT id FROM nations WHERE name = 'Montequilla') AND (flag_url IS NULL OR flag_url = '');
