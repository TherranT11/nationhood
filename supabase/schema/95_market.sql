-- 95 · The world commodity market.
-- One row per tradeable resource (Energy/Food/Minerals/Goods/Services — the mockup's
-- "Oil" is our Energy; Diplomacy is influence, not traded). Each row carries the
-- units currently AVAILABLE on the market (seeded with a 1d6 roll) and the resource's
-- price band. The live price is derived on the client from GLOBAL SUPPLY (the sum of
-- every nation's on_hand) within [min_price, max_price] — one formula, on the client.
-- Read-only for now: there are no buy/sell RPCs until a Minister of Trade exists to
-- authorise them, so no client write policy is granted. Run after 10 (nations).

create table if not exists public.market (
  resource   text primary key,        -- energy | food | minerals | goods | services | military
  available  int not null default 0,  -- units on the market right now (1d6 at seed)
  min_price  numeric not null,         -- price when the resource is abundant
  max_price  numeric not null,         -- price when it's scarce
  created_at timestamptz not null default now()
);

alter table public.market enable row level security;
-- World-readable (the board is public); writes will be RPC-only once trading exists.
drop policy if exists "market_select_all" on public.market;
create policy "market_select_all" on public.market for select using (true);

-- Seed the five commodities once, each with a 1d6 starting availability and its band.
-- Guarded on empty so re-applying never re-rolls availability or resets the bands.
insert into public.market (resource, available, min_price, max_price)
select v.resource, (floor(random() * 6) + 1)::int, v.min_price, v.max_price
from (values
  ('energy',   1, 20),
  ('food',     3, 8),
  ('minerals', 1, 7),
  ('goods',    2, 8),
  ('services', 2, 8)
) as v(resource, min_price, max_price)
where not exists (select 1 from public.market);

-- Energy's ceiling was raised to 20; correct any DB seeded at the old 10.
update public.market set max_price = 20 where resource = 'energy' and max_price < 20;

-- Military: a tradeable resource priced like the others — global supply (sum of on_hand
-- 'military') ÷ total Military production, within the [1,20] band. Seeded once with a 1d6
-- market availability and the band; its production is set per nation in adminsetup.
insert into public.market (resource, available, min_price, max_price)
select 'military', (floor(random() * 6) + 1)::int, 1, 20
where not exists (select 1 from public.market where resource = 'military');
-- Military on-hand is seeded from production (= production, 1:1) in 10_nations, like the other
-- commodities — no separate roll here.
