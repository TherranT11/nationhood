-- Rescale nations.debt from raw-dollar storage to abstract integers
-- (matches the rescale 20261206 just did for nations.budget).
--
-- Both columns now live on the same player-facing scale: a Budget of
-- 967 and a Debt of 50 mean the same units. The Government Budget
-- panel's Surplus / Debt card flips between them and now both render
-- as bare integers via _gbFmtCurrency.
--
-- KNOWN FOLLOW-UPS — code paths still treating nation.debt as raw:
--   - nation.html, economy.html, map.html         (display via formatCurrencyShort)
--   - js/game/budget.js _RAW_PER_ABSTRACT bridges in other call sites
--     (one-time transfers, advance-corp-tick trade transfers,
--     20261017_corp_tax_rpcs.sql)
--   These will misreport / miscalculate against rescaled debt until
--   patched. Out of scope for Stage 1 (debt accumulation fix); track
--   as follow-up tickets.

UPDATE nations
   SET debt = ROUND(debt::numeric / 1000000.0)
 WHERE COALESCE(debt, 0) > 100000;

NOTIFY pgrst, 'reload schema';
