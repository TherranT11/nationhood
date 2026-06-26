-- One-off correction: bring existing nations' on-hand to EQUAL production (1:1) for every
-- tradeable resource, replacing the old "half of production" base seed and the 1d6 Military
-- roll. The merge (||) preserves any other keys.
--
-- Safe to run ONCE while the Market is read-only (no trading yet, so on-hand still equals the
-- seed). Do NOT re-run after buy/sell trading goes live — it would clobber real stockpiles.
update public.nations
   set on_hand = on_hand || jsonb_build_object(
     'energy',   coalesce((production->>'energy')::numeric,   0),
     'food',     coalesce((production->>'food')::numeric,     0),
     'minerals', coalesce((production->>'minerals')::numeric, 0),
     'goods',    coalesce((production->>'goods')::numeric,    0),
     'services', coalesce((production->>'services')::numeric, 0),
     'military', coalesce((production->>'military')::numeric,  0)
   );
