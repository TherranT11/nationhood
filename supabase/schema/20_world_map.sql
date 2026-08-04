-- 20 · World map — the single, admin-authored world  (Nationhood: Prophecy & Plague)
-- Idempotent — safe to paste into the Supabase SQL Editor and re-run.
--
-- The whole map (landmasses, settlements, roads, borders) is stored as one JSON
-- document in a single row. Namespaced pp_ to avoid legacy tables in this reused
-- project.

create table if not exists public.pp_world_map (
  id         int primary key default 1,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint pp_world_map_singleton check (id = 1)
);

alter table public.pp_world_map enable row level security;

-- Any signed-in player may read the world map (the game renders it).
drop policy if exists "pp_world_map_select" on public.pp_world_map;
create policy "pp_world_map_select" on public.pp_world_map for select
  using (auth.uid() is not null);

-- No client write policy: the map is saved only through pp_save_world_map(),
-- which enforces the admin check server-side (a client-side gate is not enough
-- for a real write).
create or replace function public.pp_save_world_map(_data jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if (auth.jwt() ->> 'email') is distinct from 'therrant@gmail.com' then
    raise exception 'not authorized';
  end if;
  insert into public.pp_world_map (id, data, updated_at)
  values (1, _data, now())
  on conflict (id) do update set data = excluded.data, updated_at = now();
end;
$$;

grant execute on function public.pp_save_world_map(jsonb) to authenticated;

-- One-time settlement-type collapse: the map used to carry town/city/capital and
-- tribe/village tiers; it now has a single village per people. Remap any legacy
-- settlements in place so an already-drawn map keeps its positions and names —
-- only the `type` changes. Guarded so it's a no-op once migrated (idempotent).
update public.pp_world_map wm
set data = jsonb_set(wm.data, '{settlements}', (
  select coalesce(jsonb_agg(
    case
      when s->>'type' in ('humanCapital','humanCity','humanTown') then jsonb_set(s, '{type}', '"humanVillage"')
      when s->>'type' in ('orcTribe','orcVillage')                then jsonb_set(s, '{type}', '"orcVillage"')
      else s
    end
    order by ord                           -- keep the settlements in their original order
  ), '[]'::jsonb)
  from jsonb_array_elements(wm.data->'settlements') with ordinality as t(s, ord)
))
where wm.id = 1
  and jsonb_typeof(wm.data->'settlements') = 'array'
  and exists (
    select 1 from jsonb_array_elements(wm.data->'settlements') s
    where s->>'type' in ('humanCapital','humanCity','humanTown','orcTribe')
  );
