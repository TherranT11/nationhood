-- ════════════════════════════════════════════════════════════════════
-- 20270692 — nation_commodity_state + drop the derived production
--            equation; seed Montequilla
--
-- User design change. The politician-economy summary strip used to
-- derive Production live from industry-base sums (sum / divisor —
-- see COMMODITIES.inputs/divisor in politician-economy.html). The
-- user has asked to:
--
--   1. Forget the derived formula. Production is now a raw number
--      written directly per nation per commodity.
--   2. Add an On Hand stockpile (it was a '--' hardcoded placeholder
--      on the cards with no underlying storage).
--   3. Strip Production entirely — schema AND UI — for the three
--      "service" commodities (consumer_goods / services / diplomacy)
--      for ALL nations. Those cards show On Hand only from now on.
--   4. Seed Montequilla with explicit on-hand + production values.
--
-- Storage:
--   nation_commodity_state (
--       nation_id           uuid    FK nations
--       commodity_key       text    one of 6 enum-by-CHECK keys
--       on_hand             numeric NOT NULL DEFAULT 0  (>=0)
--       production_per_tick numeric NULL
--       PRIMARY KEY (nation_id, commodity_key)
--   )
--
-- Partition CHECK locks the no-production rule in the schema:
--   crude_oil / minerals / foodstuffs    → production_per_tick NOT NULL
--   consumer_goods / services / diplomacy → production_per_tick NULL
--
-- Backfill: every existing nation gets all 6 commodity rows at zero.
-- Then UPDATE Montequilla with the user's seed numbers.
--
-- politician-economy.html updates in lockstep — the COMMODITIES
-- inputs/divisor properties + computeProduction() are deleted and
-- the card renderer reads on_hand / production_per_tick directly.
--
-- Apply after 20270691.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nation_commodity_state (
    nation_id           uuid    NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    commodity_key       text    NOT NULL,
    on_hand             numeric NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
    production_per_tick numeric,
    PRIMARY KEY (nation_id, commodity_key),
    CONSTRAINT nation_commodity_state_key_check
        CHECK (commodity_key IN ('crude_oil','minerals','foodstuffs','consumer_goods','services','diplomacy')),
    -- Partition: the 3 "production-bearing" commodities require a non-null
    -- non-negative number; the 3 "service" commodities require NULL. This is
    -- the schema-level enforcement of the user's "remove production
    -- entirely for those" instruction.
    CONSTRAINT nation_commodity_state_production_partition
        CHECK (
            (commodity_key IN ('crude_oil','minerals','foodstuffs')
              AND production_per_tick IS NOT NULL
              AND production_per_tick >= 0)
         OR (commodity_key IN ('consumer_goods','services','diplomacy')
              AND production_per_tick IS NULL)
        )
);

COMMENT ON TABLE public.nation_commodity_state IS
    'Per-nation commodity stockpiles + per-tick production. Raw values, NOT derived from industry bases. production_per_tick is NULL for consumer_goods / services / diplomacy by partition CHECK — those commodities render On Hand only on politician-economy. 20270692.';

ALTER TABLE public.nation_commodity_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ncs_select ON public.nation_commodity_state;
CREATE POLICY ncs_select ON public.nation_commodity_state
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS ncs_service_all ON public.nation_commodity_state;
CREATE POLICY ncs_service_all ON public.nation_commodity_state
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 2. Backfill every existing nation with zeroed rows ───────────
INSERT INTO public.nation_commodity_state (nation_id, commodity_key, on_hand, production_per_tick)
SELECT n.id,
       ck.commodity_key,
       0,
       CASE WHEN ck.commodity_key IN ('consumer_goods','services','diplomacy')
                THEN NULL
                ELSE 0
       END
  FROM public.nations n
 CROSS JOIN (VALUES
     ('crude_oil'), ('minerals'), ('foodstuffs'),
     ('consumer_goods'), ('services'), ('diplomacy')
 ) AS ck(commodity_key)
ON CONFLICT (nation_id, commodity_key) DO NOTHING;

-- ── 3. Seed Montequilla per user spec ────────────────────────────
UPDATE public.nation_commodity_state ncs
   SET on_hand             = v.on_hand,
       production_per_tick = v.production
  FROM (VALUES
      ('crude_oil',       4::numeric, 1::numeric),
      ('minerals',       11::numeric, 7::numeric),
      ('foodstuffs',      4::numeric, 1::numeric),
      ('consumer_goods',  3::numeric, NULL::numeric),
      ('services',        1::numeric, NULL::numeric),
      ('diplomacy',       1::numeric, NULL::numeric)
  ) AS v(commodity_key, on_hand, production)
 WHERE ncs.nation_id = (SELECT id FROM public.nations WHERE name = 'Montequilla')
   AND ncs.commodity_key = v.commodity_key;

NOTIFY pgrst, 'reload schema';

COMMIT;
