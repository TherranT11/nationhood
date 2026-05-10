-- Mirror of sql/migrations/20261117_seed_nation_gdp_values.sql.
-- Initial GDP values in $B abstract units; per-tick drift handled by
-- applyGdpGrowthDrift in js/game/budget.js.

BEGIN;

UPDATE nations SET gdp = 358.6 WHERE name = 'Avelia';
UPDATE nations SET gdp = 119.4 WHERE name = 'Melizea';
UPDATE nations SET gdp =  45.4 WHERE name = 'Montequilla';
UPDATE nations SET gdp = 101.6 WHERE name = 'Palvera';
UPDATE nations SET gdp = 316.2 WHERE name = 'Sangreza';
UPDATE nations SET gdp = 144.2 WHERE name = 'San Estrella';
UPDATE nations SET gdp =  26.5 WHERE name = 'Sierramar';
UPDATE nations SET gdp = 436.9 WHERE name = 'Hajjara';
UPDATE nations SET gdp = 699.1 WHERE name = 'Calveth';
UPDATE nations SET gdp = 561.2 WHERE name = 'Flandis';
UPDATE nations SET gdp = 899.1 WHERE name = 'Danwei';
UPDATE nations SET gdp = 458.4 WHERE name = 'Vostia';
UPDATE nations SET gdp =  86.9 WHERE name = 'Dravka';

COMMIT;

NOTIFY pgrst, 'reload schema';
