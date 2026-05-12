-- Round nations.gdp to integer
--
-- nation.gdp is already on the $B abstract scale (e.g. 907.9 = $907.9B per
-- the code comments in budget.js:897 and government.html:2433). Round every
-- nation's value to a whole-integer billion so the display reads as "$908B"
-- not "$907.9B" — matching the unified "abstract integer + suffix" pattern
-- the budget panel uses for every other currency column.
--
-- After this, displays in nation.html, nation-info.html, and map.html were
-- also updated to render GDP with an explicit B suffix when the column is
-- read directly (those files previously assumed gdp was raw dollars and
-- used a generic Million / Billion / Trillion suffix formatter).

UPDATE nations SET gdp = ROUND(gdp);

NOTIFY pgrst, 'reload schema';
