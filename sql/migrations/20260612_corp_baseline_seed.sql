-- ══════════════════════════════════════════════════════════════
-- Corp baseline seed: 5 in stats / 100% ownership / 2 Assets / 1 Market Share
--
-- Sets every existing corporation to a uniform baseline:
--
--   corp_reputation          = 5     (general reputation)
--   corp_innovation          = 5
--   corp_productivity        = 5
--   corp_assets              = 2     (per directive)
--   corp_market_share        = 1     (per directive)
--
--   corp_work_crews          = 5     (Construction sector)
--   corp_regulatory_standing = 5
--   corp_supply_chain        = 5
--
--   corp_lending_capital     = 5     (Finance — displayed value)
--   corp_lending_capital_max = 5     (action-controlled max so the
--                                     recompute reproduces 5 when
--                                     outstanding = 0)
--   corp_interest_rates      = 5
--   corp_overleverage        = 5     (Finance — displayed value)
--   corp_overleverage_offset = 5     (action-controlled offset so
--                                     the recompute reproduces 5
--                                     when derived = 0; net at
--                                     baseline is 5)
--
--   corp_freighters          = 5     (Shipping sector — overrides the
--                                     3 / 5 / 0 founding seed from
--                                     20260609 in favor of a uniform
--                                     baseline across all sectors)
--   corp_fleet_health        = 5
--   corp_route_risk          = 5
--
-- Plus corp_ownership is reset so every corp has a single 100%
-- player-holder row pointing to its linked_user_id (or its own id
-- when linked_user_id is NULL).
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- 1. Stat baseline UPDATE
-- ══════════════════════════════════════════════════════════════
UPDATE factions
   SET corp_reputation          = 5,
       corp_innovation          = 5,
       corp_productivity        = 5,
       corp_assets              = 2,
       corp_market_share        = 1,
       corp_work_crews          = 5,
       corp_regulatory_standing = 5,
       corp_supply_chain        = 5,
       corp_lending_capital     = 5,
       corp_lending_capital_max = 5,
       corp_interest_rates      = 5,
       corp_overleverage        = 5,
       corp_overleverage_offset = 5,
       corp_freighters          = 5,
       corp_fleet_health        = 5,
       corp_route_risk          = 5
 WHERE faction_type = 'corporation';


-- ══════════════════════════════════════════════════════════════
-- 2. Ownership reset to 100% player-held
-- ══════════════════════════════════════════════════════════════
-- Single transaction so the corp_ownership_sum_check trigger sees
-- 100 at commit. The trigger has an explicit zero-rows escape
-- ("corp dissolved; ownership cleared deliberately") so the DELETE
-- step doesn't trip the sum-to-100 enforcement.
BEGIN;

DELETE FROM corp_ownership
 WHERE corp_id IN (
    SELECT id FROM factions WHERE faction_type = 'corporation'
 );

INSERT INTO corp_ownership (corp_id, holder_type, holder_id, pct)
SELECT id,
       'player',
       COALESCE(linked_user_id, id),
       100
  FROM factions
 WHERE faction_type = 'corporation';

COMMIT;

NOTIFY pgrst, 'reload schema';
