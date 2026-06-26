-- One-off correction: bring existing nations' base on-hand up to EQUAL production (1:1),
-- replacing the old "half of production" seed. The five base commodities only; the merge
-- (||) preserves Military on-hand and any other keys.
--
-- Safe to run ONCE while the Market is read-only (no trading yet, so on-hand still equals the
-- seed). Do NOT re-run after buy/sell trading goes live — it would clobber real stockpiles.
update public.nations
   set on_hand = on_hand || jsonb_build_object(
     'energy',   coalesce((production->>'energy')::numeric,   0),
     'food',     coalesce((production->>'food')::numeric,     0),
     'minerals', coalesce((production->>'minerals')::numeric, 0),
     'goods',    coalesce((production->>'goods')::numeric,    0),
     'services', coalesce((production->>'services')::numeric, 0)
   );
