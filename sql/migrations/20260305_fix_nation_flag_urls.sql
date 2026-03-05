-- Fix Palvera flag_url: was set as relative path instead of full GitHub raw URL
-- All other nations already use the full URL format

UPDATE nations SET flag_url = 'https://raw.githubusercontent.com/TherranT11/nationhood/main/assets/flags/Palvera.png' WHERE name = 'Palvera';
UPDATE nation_profiles SET flag_url = 'https://raw.githubusercontent.com/TherranT11/nationhood/main/assets/flags/Palvera.png' WHERE nation_id = (SELECT id FROM nations WHERE name = 'Palvera');
