-- Reset Melizea GDP to 195 and pin gdp_growth at 50 (neutral/stable)
UPDATE nations
SET gdp = 195,
    gdp_growth = 50
WHERE LOWER(name) = 'melizea';
