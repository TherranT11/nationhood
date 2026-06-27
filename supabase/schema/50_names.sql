-- 50 · Nation name pools (structure only)
-- Depends on: 10 (nations). Run after 40. The rows are bulk data and live in
-- supabase/seed/ (one file per nation) — run those after this file.

-- ---------------------------------------------------------------------------
-- Nation name pools: the source for each nation's flavoured names (generated
-- politicians/characters). One row per name, scoped by nation_id + kind (male /
-- female first names, surname). Public read; clients never write it. Only the
-- structure lives here; the names are seeded from supabase/seed/<nation>_names.sql.
-- A party's leader + recruits draw from its own nation's rows.
-- ---------------------------------------------------------------------------
create table if not exists public.nation_names (
  id        bigint generated always as identity primary key,
  nation_id text not null references public.nations (id) on delete cascade,
  kind      text not null check (kind in ('male', 'female', 'surname')),
  name      text not null,
  unique (nation_id, kind, name)
);

-- Migrate the original Sessau-only table (sessau_names) into the generic one,
-- once. Idempotent: the copy is on-conflict-do-nothing and the old table is
-- dropped only after a successful copy, so a re-run simply finds it already gone.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'sessau_names') then
    insert into public.nation_names (nation_id, kind, name)
      select 'sessau', kind, name from public.sessau_names
      on conflict (nation_id, kind, name) do nothing;
    drop table public.sessau_names;
  end if;
end $$;

alter table public.nation_names enable row level security;

drop policy if exists "nation_names_select_all" on public.nation_names;
create policy "nation_names_select_all" on public.nation_names for select using (true);

-- ONE source for a generated NPC name: a random first name + surname from a nation's pool.
-- Returns the two parts separately (independent random draws, as before) — callers that want a
-- full name concat them. Used by generated politicians (schema/40), corporation directors
-- (/47) and city mayors (/108), so every NPC is named the same way. Either part is null if the
-- nation has no seeded names of that kind. Internal: only the security-definer callers use it.
-- VOLATILE (it calls random()): each call must re-draw, so a single statement that names many
-- rows — e.g. a backfill — gives each its own name rather than reusing one cached result.
create or replace function public._random_name(p_nation text, out first_name text, out last_name text)
language sql volatile security definer set search_path = public as $$
  select
    (select name from public.nation_names where nation_id = p_nation and kind in ('male', 'female') order by random() limit 1),
    (select name from public.nation_names where nation_id = p_nation and kind = 'surname'          order by random() limit 1);
$$;
revoke all on function public._random_name(text) from public, anon, authenticated;
