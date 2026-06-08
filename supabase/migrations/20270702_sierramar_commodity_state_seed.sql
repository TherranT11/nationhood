-- ════════════════════════════════════════════════════════════════════
-- 20270702 — Sierramar commodity state seed
--
-- Backfills Sierramar's nation_commodity_state with the user-spec'd
-- on_hand + production_per_tick values. Same shape as 20270692's
-- Montequilla seed block (lines 96-109).
--
-- Spec:
--   crude_oil       on_hand=3  production=0   ('Energy' in the UI;
--                                              key stays crude_oil
--                                              per the CHECK constraint
--                                              + js/game/commodities.js
--                                              label-only rename)
--   minerals        on_hand=3  production=0
--   foodstuffs      on_hand=4  production=2
--   consumer_goods  on_hand=2  production=NULL  (non-extraction;
--                                                schema CHECK requires
--                                                NULL here)
--   services        on_hand=1  production=NULL
--   diplomacy       on_hand=1  production=NULL
--
-- Sierramar's 6 commodity rows were created by 20270692's all-nations
-- cross-join backfill (lines 80-94) with default 0 / NULL values, so
-- this is purely an UPDATE — no INSERT needed. Idempotent: re-running
-- writes the same values.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

UPDATE public.nation_commodity_state ncs
   SET on_hand             = v.on_hand,
       production_per_tick = v.production
  FROM (VALUES
      ('crude_oil',       3::numeric, 0::numeric),
      ('minerals',        3::numeric, 0::numeric),
      ('foodstuffs',      4::numeric, 2::numeric),
      ('consumer_goods',  2::numeric, NULL::numeric),
      ('services',        1::numeric, NULL::numeric),
      ('diplomacy',       1::numeric, NULL::numeric)
  ) AS v(commodity_key, on_hand, production)
 WHERE ncs.nation_id = (SELECT id FROM public.nations WHERE name = 'Sierramar')
   AND ncs.commodity_key = v.commodity_key;

COMMIT;
